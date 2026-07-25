import { Injectable, signal, computed, inject } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { CometChatToastService } from '../components/base-elements/cometchat-toast/cometchat-toast.service';
import type {
  AttachmentFile,
} from '../components/cometchat-message-composer/cometchat-message-composer.types';

/** Fallback when the SDK max-attachment-count setting is unavailable. */
export const DEFAULT_MAX_ATTACHMENTS = 10;

/**
 * SDK/server upload error code → UIKit localization key. When an upload fails, `errorText` looks the
 * exception's `code` up here and shows the short, localized copy instead of the SDK's raw message
 * (which is English-only and byte-precise, e.g. "...exceeds the maximum allowed size of 104857600
 * bytes."). Codes not listed fall through to a message-text heuristic, then to the raw message.
 *
 * Extend this as server error codes are confirmed — the file-TYPE rejection is a server response, so
 * its exact code goes here once known (until then the message heuristic in resolveUploadErrorKey
 * catches it).
 */
const UPLOAD_ERROR_LOCALE_KEY: Readonly<Record<string, string>> = {
  ERR_FILE_SIZE_EXCEEDED: 'message_composer_upload_error_file_size',
};

/**
 * Codes that identify a failure only LOOSELY, consulted after the message heuristics rather than
 * before them. `ERR_BAD_REQUEST` is what the server returns when it rejects a file's type, but it
 * is a generic 400 — treating it as authoritative would relabel any other 400 (a size rejection,
 * say) as a type error. Checking it last means a message that clearly states its own reason still
 * wins, and everything else lands on the type copy.
 */
const UPLOAD_ERROR_FALLBACK_LOCALE_KEY: Readonly<Record<string, string>> = {
  ERR_BAD_REQUEST: 'message_composer_upload_error_invalid_file',
};

/** Byte-weighted aggregate progress across staged tiles. */
export interface TrayAggregate {
  loaded: number;
  total: number;
  percent: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Pure helpers (exported for property-based tests — NFR-2). No SDK / no state.
// ──────────────────────────────────────────────────────────────────────────

/**
 * Byte-weighted aggregate. `percent = round(Σloaded / Σtotal * 100)`.
 * Returns 0% when there is nothing to upload. NEVER averages per-tile percentages —
 * large files must weigh proportionally (design doc §5.4).
 */
export function computeAggregate(tiles: AttachmentFile[]): TrayAggregate {
  let loaded = 0;
  let total = 0;
  for (const t of tiles) {
    loaded += t.loaded ?? 0;
    total += t.total ?? t.size ?? 0;
  }
  const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
  return { loaded, total, percent };
}

/**
 * Send is allowed iff the tray is non-empty, no tile is still in flight
 * (`pending`/`uploading`), and at least one tile is `uploaded`.
 */
export function deriveCanSend(tiles: AttachmentFile[]): boolean {
  if (tiles.length === 0) {
    return false;
  }
  const anyInFlight = tiles.some(
    (t) => t.status === 'uploading' || t.status === 'pending',
  );
  const anyUploaded = tiles.some((t) => t.status === 'uploaded');
  return !anyInFlight && anyUploaded;
}

/** Classify a file into the tray tile type from its MIME type. */
export function detectAttachmentType(
  mimeType: string | undefined,
): 'image' | 'video' | 'audio' | 'file' {
  const m = (mimeType ?? '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  return 'file';
}

/**
 * Whether a file's MIME type matches an accept pattern. Supports exact
 * (`image/png`), wildcard subtype (`image/*`), and `*`/`*​/*`. Exported for tests.
 */
export function mimeMatches(fileType: string, pattern: string): boolean {
  const t = (fileType || '').toLowerCase();
  const p = (pattern || '').toLowerCase();
  if (!p || p === '*' || p === '*/*') return true;
  if (p.endsWith('/*')) return t.startsWith(p.slice(0, -1));
  return t === p;
}

/** First-frame poster + duration read from a local video File. Both fields are best-effort. */
export interface VideoMeta {
  /** JPEG data-URL of the first decodable frame, or `undefined` on any failure. */
  poster?: string;
  /** Clip length in seconds, or `undefined` when the browser reports a non-finite duration. */
  durationSec?: number;
}

/**
 * Extract the first frame of a local video File as a JPEG data-URL poster, plus its duration
 * (best-effort, fully local). Resolves an empty object on any failure (no DOM, unsupported codec,
 * decode/seek error, timeout). The poster is downscaled to `maxDim` so the data URL stays small.
 * Never rejects; always cleans up the temporary <video>/object-URL.
 */
export function extractVideoMeta(file: File, maxDim = 320): Promise<VideoMeta> {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return Promise.resolve({});
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;

  const cleanup = (): undefined => {
    video.onloadeddata = null;
    video.onerror = null;
    video.onseeked = null;
    try {
      video.removeAttribute('src');
      video.load();
    } catch {
      /* ignore */
    }
    if (typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }
    return undefined;
  };

  const once = (event: 'loadeddata' | 'seeked', timeoutMs: number): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${event} timeout`)), timeoutMs);
      const handler = () => {
        clearTimeout(timer);
        resolve();
      };
      if (event === 'loadeddata') {
        video.onloadeddata = handler;
        video.onerror = () => {
          clearTimeout(timer);
          reject(new Error('decode error'));
        };
      } else {
        video.onseeked = handler;
      }
    });

  return (async (): Promise<VideoMeta> => {
    // Captured right after metadata lands so it survives a later poster failure — the duration
    // badge should still render even when the frame can't be decoded.
    let durationSec: number | undefined;
    try {
      video.src = url;
      video.load();
      await once('loadeddata', 4000);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationSec = video.duration;
      }
      // Seek slightly past the start so we skip an all-black leading frame when present. Skip the
      // seek entirely for a ~0 target (e.g. zero-duration clips) — assigning currentTime to the
      // value it already holds never fires 'seeked' and would stall until the timeout; the frame
      // from loadeddata is already usable.
      const target = Math.min(0.1, (Number.isFinite(video.duration) ? video.duration : 1) / 2);
      if (target > 0.01) {
        try {
          video.currentTime = target;
          await once('seeked', 2000);
        } catch {
          /* seek unsupported/failed — capture whatever frame is decoded */
        }
      }
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        cleanup();
        return { durationSec };
      }
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        return { durationSec };
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      cleanup();
      const poster = dataUrl && dataUrl.startsWith('data:image/') ? dataUrl : undefined;
      return { poster, durationSec };
    } catch {
      cleanup();
      return { durationSec };
    }
  })();
}

/**
 * MediaUploadTrayService
 *
 * Owns the composer's attachment-staging state machine and wraps the CometChat
 * SDK multi-attachment upload lifecycle (`UploadFileRequest` + `UploadFileListener`).
 *
 * Provided at the **composer** level (not root) so each composer instance — main
 * and thread — owns an independent tray and its own `UploadFileRequest`, i.e. an
 * independent batch. `fileId`s are UIKit-generated and only have to be unique
 * within a batch, so two composers never collide. Internal: not exported from
 * `public-api.ts`.
 *
 * @remarks State is exposed as signals for OnPush components. `canSend` is
 * single-sourced: enabled only from the SDK `onComplete`, disabled on every new
 * `stage()` and whenever a cancel/remove empties the tray.
 */
@Injectable()
export class MediaUploadTrayService {
  /** key = fileId (UIKit-generated; the SDK echoes it back on every event) */
  private readonly _tilesMap = signal<Map<string, AttachmentFile>>(new Map());
  private readonly _canSend = signal(false);
  private readonly _notice = signal<string | null>(null);

  /** Insertion-ordered staged tiles. */
  readonly tiles = computed<AttachmentFile[]>(() => [
    ...this._tilesMap().values(),
  ]);
  readonly hasTiles = computed(() => this._tilesMap().size > 0);
  readonly aggregate = computed<TrayAggregate>(() =>
    computeAggregate(this.tiles()),
  );
  /** Any tile in a terminal error state (failed/rejected). Blocks Send until it's removed. */
  readonly hasErrorTile = computed(() =>
    this.tiles().some(
      (t) => t.status === 'rejected' || t.status === 'failed' || t.status === 'error',
    ),
  );
  /**
   * Send-gate: all staged tiles uploaded (`_canSend`, set on SDK completion) AND none failed. The
   * error clause is enforced here rather than in `_canSend` because the SDK's `onComplete` reports
   * `successful > 0` even for a partial batch — so a mix of uploaded + rejected tiles would
   * otherwise still enable Send. A failed upload must block sending until the user removes it.
   */
  readonly canSend = computed(() => this._canSend() && !this.hasErrorTile());
  /** Transient localized notice (e.g. attachment-count limit reached). */
  readonly notice = this._notice.asReadonly();

  /** The SDK upload request owning this composer's batch; null until the first stage. */
  private request: CometChat.UploadFileRequest | null = null;
  /** Cached app setting (async getter); null until first fetched. */
  private maxCount: number | null = null;
  /** Optional composer-provided validation (mirrors composer @Inputs). */
  private allowedFileTypes?: string[];
  private maxFileSize?: number;
  /** Upload recipient (uid/guid + 'user'/'group'), set by the composer before staging. The SDK sends
   *  both in the presign call for role-based access control. */
  private receiverId?: string;
  private receiverType?: string;
  /** Thread parent, when this composer is a thread composer. Sent alongside the receiver in the
   *  presign call so the server scopes the upload to the thread. */
  private parentMessageId?: string | number;

  /** Root toast service — surfaces upload/validation errors as a transient toast.
   *  Injected defensively so the service also works when created outside Angular DI (unit tests). */
  private readonly toast = this.safeInjectToast();
  /** Dedupe identical error toasts fired in quick succession (e.g. N oversized files). */
  private lastToastMessage = '';
  private lastToastAt = 0;

  /** Set client-side validation from the composer (allowedFileTypes / maxFileSize @Inputs). */
  setValidationConfig(cfg: { allowedFileTypes?: string[]; maxFileSize?: number }): void {
    this.allowedFileTypes = cfg.allowedFileTypes;
    this.maxFileSize = cfg.maxFileSize;
  }

  /** Set the upload recipient — `id` is the uid/guid, `type` is `user`/`group` (CometChat.RECEIVER_TYPE),
   *  and `parentMessageId` marks a thread composer. The SDK sends all three in the presign call for
   *  role-based access control. Changing the destination discards the current batch: a request is
   *  bound to one destination, so its presigns are not valid for another conversation. */
  setReceiver(id: string, type: string, parentMessageId?: string | number): void {
    const changed =
      this.receiverId !== id ||
      this.receiverType !== type ||
      this.parentMessageId !== parentMessageId;
    this.receiverId = id;
    this.receiverType = type;
    this.parentMessageId = parentMessageId;
    if (changed && this.request) {
      this.clearAll();
    }
  }

  /**
   * SDK listener — built once; maps per-file + completion events onto tiles. Passed with EVERY
   * `uploadAttachments` call rather than registered once via `addUploadListener`: the SDK creates a
   * batch's group lazily on the first upload, and `addUploadListener` silently drops the listener
   * when the group doesn't exist yet, so registering at request-creation time delivered no events at
   * all. Re-passing the same object is safe — the SDK dispatches per-file events to the file's own
   * listener and dedupes by object identity, so nothing fires twice.
   */
  private readonly listener = new CometChat.UploadFileListener({
    onFileProgress: (fileId: string, loaded: number, total: number, percent: number) => {
      this.patchTile(fileId, { loaded, total, uploadProgress: percent });
    },
    onFileUploaded: (fileId: string, attachment: CometChat.Attachment) => {
      // Keep the LOCAL preview (object-URL image / extracted video poster) — do NOT switch the tile
      // to the uploaded S3 URL, which is private/unsigned and would 403. The blob is revoked later
      // (dropTile/clearAll). We still store `attachment` (needed to build the outgoing message).
      this.patchTile(fileId, {
        status: 'uploaded',
        uploadProgress: 100,
        attachment,
      });
    },
    onFileError: (fileId: string, error: CometChat.CometChatException) => {
      const message = this.errorText(error);
      this.patchTile(fileId, { status: 'rejected', errorMessage: message });
      this.notifyError(message);
    },
    onFileFailure: (fileId: string, error: CometChat.CometChatException) => {
      const message = this.errorText(error);
      this.patchTile(fileId, { status: 'failed', errorMessage: message });
      this.notifyError(message);
    },
    onComplete: (result: CometChat.UploadResult) => {
      // Idempotent: SET from current result. onComplete is NOT once-per-batch — it re-fires every
      // time the batch drains (e.g. after files are added to an already-settled tray), and `result`
      // always describes the whole batch, so this must never toggle or accumulate.
      this._canSend.set((result?.successful?.length ?? 0) > 0);
    },
  });

  // ── Public actions ───────────────────────────────────────────────────────

  /**
   * Stage and begin uploading files. Accumulates into the existing upload group
   * (reuses `muid`). Enforces the max-attachment count (UIKit-side, before the SDK).
   *
   * `forcedKind` overrides the MIME-derived category — the "File" picker option stages
   * everything as `file` regardless of its actual MIME type, so an MP4 chosen through it
   * sends as a file message rather than a video message. Drag-drop and paste pass nothing
   * and stay MIME-derived.
   */
  async stage(files: File[], forcedKind?: AttachmentFile['type']): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }
    if (this.maxCount == null) {
      this.maxCount = await this.fetchMaxCount();
    }

    let noticeKey: string | null = null;

    // Client-side type/size pre-check (composer @Inputs), before hitting the SDK.
    const typeSizeValid = files.filter((f) => {
      if (this.maxFileSize != null && f.size > this.maxFileSize) {
        noticeKey = 'message_composer_file_size_error';
        return false;
      }
      if (
        this.allowedFileTypes?.length &&
        !this.allowedFileTypes.some((p) => mimeMatches(f.type, p))
      ) {
        if (!noticeKey) noticeKey = 'message_composer_file_type_error';
        return false;
      }
      return true;
    });

    // Count limit (from the SDK setting). All-or-nothing: a batch that would overflow the limit
    // stages NOTHING. Silently truncating to the first N left the user with an arbitrary subset of
    // their selection and no clear signal which files were dropped; a hard reject makes them
    // re-pick deliberately. The toast below is the only feedback, so it must always fire here.
    const remaining = Math.max(0, this.maxCount - this._tilesMap().size);
    const overflows = typeSizeValid.length > remaining;
    const accepted = overflows ? [] : typeSizeValid;
    if (overflows) {
      noticeKey = 'message_composer_attachment_limit_reached';
    }

    if (noticeKey) {
      const noticeText = CometChatLocalize.getLocalizedString(noticeKey);
      this._notice.set(noticeText);
      this.notifyError(noticeText);
    } else {
      this._notice.set(null);
    }

    if (accepted.length === 0) {
      return;
    }

    // New files in flight -> disable Send until the next onComplete (design ⚠️ U1).
    this._canSend.set(false);

    // fileIds are OURS to mint — the SDK never assigns one, it just echoes back what we pass. That
    // lets the tiles below be painted at 0% before a single byte moves, with no "adopt the SDK's id
    // on the first event" step.
    const items = accepted.map((file) => ({ fileId: CometChatUIKitUtility.ID(), file }));

    const next = new Map(this._tilesMap());
    items.forEach(({ fileId, file }) => {
      const type = forcedKind ?? detectAttachmentType(file.type);
      next.set(fileId, {
        id: fileId,
        fileId,
        file,
        type,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        // A force-filed image still has no image preview in the tray — it is a file card.
        thumbnailUrl: type === 'image' ? this.localPreview(file) : undefined,
        uploadProgress: 0,
        loaded: 0,
        total: file.size,
        status: 'uploading',
      });
    });
    this._tilesMap.set(next);

    // Videos can't preview from an object URL — extract their first frame asynchronously.
    // Skipped when the picker forced a non-video kind (no video tile to poster).
    if (forcedKind === undefined || forcedKind === 'video') {
      this.hydrateVideoPosters(items);
    }

    // Upload LAST, so a synchronous SDK throw still leaves the tiles painted and marks only these
    // files failed — the user keeps the batch and can retry, rather than watching the tray vanish.
    try {
      const request = this.ensureRequest();
      request.uploadAttachments(items, this.listener);
    } catch (error) {
      const message =
        this.errorText(error as CometChat.CometChatException) ||
        CometChatLocalize.getLocalizedString('message_composer_upload_failed');
      for (const { fileId } of items) {
        this.patchTile(fileId, { status: 'failed', errorMessage: message });
      }
      this._notice.set(message);
      this.notifyError(message);
    }
  }

  /**
   * The request owning this composer's batch, created on first use. It is bound to the destination
   * (and thread parent) captured here, which the SDK sends in every presign call; `setReceiver`
   * tears the request down when that destination changes.
   *
   * No listener is attached here — the batch's group does not exist until the first upload, and
   * `addUploadListener` is a silent no-op before then. Each `uploadAttachments` call carries the
   * listener instead.
   */
  private ensureRequest(): CometChat.UploadFileRequest {
    if (!this.request) {
      const request = CometChat.createUploadFileRequest(
        this.receiverId ?? '',
        this.receiverType ?? '',
      );
      if (this.parentMessageId != null) {
        request.setParentMessageId(this.parentMessageId);
      }
      this.request = request;
    }
    return this.request;
  }

  /** Cancel an in-flight upload (and remove the tile). */
  cancel(tile: AttachmentFile): void {
    this.dropTile(tile);
  }

  /** Remove a tile (uploaded or rejected). SDK cancel is a safe no-op once uploaded. */
  remove(tile: AttachmentFile): void {
    this.dropTile(tile);
  }

  /**
   * Retry a failed upload. Only a `failed` tile (transfer error — `onFileFailure`) is retryable;
   * a `rejected` tile (`onFileError`: size/type/permission) can only be removed and replaced, and
   * `retryAttachment` is a documented no-op for it — so don't flip such a tile back to `uploading`
   * and strand it in a state nothing will ever resolve.
   */
  retry(tile: AttachmentFile): void {
    if (tile.status === 'rejected') {
      return;
    }
    const fileId = tile.fileId ?? tile.id;
    if (!this.request) {
      return;
    }
    try {
      // Re-uploads the bytes the SDK retained for this file (re-presigning if the old presign
      // expired) — the file object never has to be handed back.
      this.request.retryAttachment(fileId);
    } catch {
      /* surfaced via the listener */
    }
    this.patchTile(fileId, {
      status: 'uploading',
      uploadProgress: 0,
      loaded: 0,
      errorMessage: undefined,
    });
    this._canSend.set(false);
  }

  /** Release the batch and reset the tray (after send, or on composer close). */
  clearAll(): void {
    if (this.request) {
      try {
        // Drops the whole group, which is what holds the per-file listener references — so no
        // detach step is needed (and nothing can call back into a tray we're tearing down).
        this.request.clearAll();
      } catch {
        /* best effort */
      }
    }
    for (const tile of this.tiles()) {
      this.revoke(tile);
    }
    this._tilesMap.set(new Map());
    this.request = null;
    this._canSend.set(false);
    this._notice.set(null);
  }

  /** Lifecycle cleanup alias (conversation switch / destroy). */
  reset(): void {
    this.clearAll();
  }

  /** Successfully-uploaded attachments to put on the outgoing MediaMessage. */
  getSuccessfulAttachments(): CometChat.Attachment[] {
    return this.getSuccessfulTiles().map((t) => t.attachment as CometChat.Attachment);
  }

  /**
   * Successfully-uploaded tiles, in display order. Carries the STAGED kind (`tile.type`),
   * which the picker may have forced away from the file's MIME type — the send path must
   * group on this, not on `attachment.getMimeType()`.
   */
  getSuccessfulTiles(): AttachmentFile[] {
    return this.tiles().filter((t) => t.status === 'uploaded' && t.attachment);
  }

  /**
   * The SDK-owned batch id, stamped onto every message of the fanned-out send as
   * `metadata.batchId` so the list can group them. Null before the first stage.
   */
  getBatchId(): string | null {
    return this.request?.getBatchId() ?? null;
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private dropTile(tile: AttachmentFile): void {
    const fileId = tile.fileId ?? tile.id;
    if (this.request) {
      try {
        // Handles both states: aborts the upload if in flight, else just drops the uploaded file
        // from the batch so it isn't included in the send.
        this.request.removeAttachment(fileId);
      } catch {
        /* best effort */
      }
    }
    this.revoke(tile);
    const next = new Map(this._tilesMap());
    next.delete(fileId);
    this._tilesMap.set(next);
    this._canSend.set(deriveCanSend(this.tiles()));
  }

  private patchTile(fileId: string, patch: Partial<AttachmentFile>): void {
    const map = this._tilesMap();
    const existing = map.get(fileId);
    if (!existing) {
      return; // tile already removed/cancelled
    }
    const next = new Map(map);
    next.set(fileId, { ...existing, ...patch });
    this._tilesMap.set(next);
  }

  private async fetchMaxCount(): Promise<number> {
    try {
      const n = await CometChat.getMaxAttachmentCount();
      return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_ATTACHMENTS;
    } catch {
      return DEFAULT_MAX_ATTACHMENTS;
    }
  }

  /** Max attachments allowed per message (server `getMaxAttachmentCount`), fetched once and cached. */
  async getMaxCount(): Promise<number> {
    if (this.maxCount == null) { this.maxCount = await this.fetchMaxCount(); }
    return this.maxCount;
  }

  /** Free slots left before the limit, given what's already staged. Used by the file picker to cap
   *  a selection so the user can't pick more than will fit. */
  async remainingSlots(): Promise<number> {
    return Math.max(0, (await this.getMaxCount()) - this._tilesMap().size);
  }

  private localPreview(file: File): string | undefined {
    // Images render directly from an object URL. Videos can't (a video blob is not a valid CSS
    // background-image), so their first-frame poster is extracted asynchronously in stage().
    if (
      detectAttachmentType(file.type) === 'image' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      try {
        return URL.createObjectURL(file);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Kick off first-frame poster + duration extraction for each staged video and patch them onto
   * the tile. Bounded concurrency (decoding many videos at once can spike memory/CPU, esp. on mobile).
   */
  private hydrateVideoPosters(items: { fileId: string; file: File }[]): void {
    const videos = items.filter(({ file }) => detectAttachmentType(file.type) === 'video');
    if (videos.length === 0) {
      return;
    }

    let cursor = 0;
    const runNext = (): void => {
      if (cursor >= videos.length) {
        return;
      }
      const { file, fileId } = videos[cursor++];
      extractVideoMeta(file)
        .then(({ poster, durationSec }) => {
          // patchTile is a no-op if the tile was cancelled/removed meanwhile.
          const patch: Partial<AttachmentFile> = {};
          if (poster) {
            patch.thumbnailUrl = poster;
          }
          if (durationSec !== undefined) {
            patch.durationSec = durationSec;
          }
          if (Object.keys(patch).length > 0) {
            this.patchTile(fileId, patch);
          }
        })
        .catch(() => {
          /* best-effort: no poster, tile keeps the play-button placeholder */
        })
        .finally(() => runNext());
    };

    const POSTER_CONCURRENCY = 2;
    for (let k = 0; k < Math.min(POSTER_CONCURRENCY, videos.length); k++) {
      runNext();
    }
  }

  private revoke(tile: AttachmentFile): void {
    const url = tile.thumbnailUrl;
    if (
      url &&
      url.startsWith('blob:') &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }
  }

  private errorText(error: CometChat.CometChatException | undefined): string {
    if (!error) return '';
    const anyErr = error as unknown as { code?: string; message?: string; getMessage?: () => string };
    const raw = anyErr.message ?? anyErr.getMessage?.() ?? '';
    const key = this.resolveUploadErrorKey(anyErr.code, raw);
    if (!key) return raw;
    // Only the size string has a `{n}` MB placeholder; localizedWithMb no-ops for the rest. The
    // limit comes from the SDK message (authoritative for what it actually enforced), else the
    // composer's maxFileSize @Input.
    const bytes = this.parseLimitBytes(raw) ?? this.maxFileSize;
    return this.localizedWithMb(key, bytes);
  }

  /**
   * Which localization key (if any) to show for an upload error. Prefers the SDK/server `code` via
   * {@link UPLOAD_ERROR_LOCALE_KEY}; falls back to a message-text heuristic for server errors whose
   * code isn't statically known (the file-type rejection). Returns '' to keep the raw SDK message.
   */
  private resolveUploadErrorKey(code: string | undefined, message: string): string {
    if (code && UPLOAD_ERROR_LOCALE_KEY[code]) {
      return UPLOAD_ERROR_LOCALE_KEY[code];
    }
    const m = (message || '').toLowerCase();
    if (/maximum allowed size|exceeds the .*size|size limit/.test(m)) {
      return 'message_composer_upload_error_file_size';
    }
    if (/\btype\b/.test(m) && /(not supported|not allowed|unsupported|invalid)/.test(m)) {
      return 'message_composer_upload_error_file_type';
    }
    // Loose codes last, so a message that named its own reason above still wins.
    if (code && UPLOAD_ERROR_FALLBACK_LOCALE_KEY[code]) {
      return UPLOAD_ERROR_FALLBACK_LOCALE_KEY[code];
    }
    return '';
  }

  /** Pull the "...of <N> bytes." limit out of the SDK size-exceeded message; null if absent. */
  private parseLimitBytes(message: string | undefined): number | null {
    const match = message?.match(/of\s+(\d+)\s*bytes/i);
    return match ? Number(match[1]) : null;
  }

  /** Resolve a key, substituting a `{n}` MB placeholder from `bytes` when the string has one. */
  private localizedWithMb(key: string, bytes?: number): string {
    const text = CometChatLocalize.getLocalizedString(key);
    if (!text.includes('{n}')) return text;
    if (bytes == null) return text.replace(/\{n\}/g, '');
    const mb = Math.max(1, Math.round(bytes / (1024 * 1024)));
    return text.replace(/\{n\}/g, String(mb));
  }

  /**
   * Surface an upload/validation error as a transient error toast (existing toast component,
   * with its built-in error icon + auto-dismiss). Falls back to a generic localized message
   * when no text is available, and dedupes identical messages fired within a short window
   * (e.g. several oversized files failing at once).
   */
  private notifyError(message: string | null | undefined): void {
    const text =
      (message ?? '').trim() ||
      CometChatLocalize.getLocalizedString('message_composer_upload_failed');
    const now = Date.now();
    if (text === this.lastToastMessage && now - this.lastToastAt < 4000) {
      return;
    }
    this.lastToastMessage = text;
    this.lastToastAt = now;
    this.toast?.error(text, { duration: 4000 });
  }

  /** inject() the toast service, tolerating a non-DI (manual `new`) instantiation. */
  private safeInjectToast(): CometChatToastService | null {
    try {
      return inject(CometChatToastService);
    } catch {
      return null;
    }
  }
}
