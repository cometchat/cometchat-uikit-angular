/**
 * Media on the offline (ON) path (README §3.8, UIK-MEDIA-01): an attachment's
 * source is the SDK's cached copy (`getCachedMediaObjectURL`) when it has one,
 * else its URL, as today. The kit keeps no media cache of its own; the object
 * URLs it receives are revoked when the bubble lets go of them.
 *
 * With offline off, or with the SDK's media caching OFF, nothing here runs.
 *
 * @internal
 */
import { hasSdkFunction, isOfflineOn, offlineSdk } from './offline-gate';
import { CometChatLogger } from '../CometChatLogger';
import type { Observable, Subscription } from 'rxjs';

export interface ResolvableAttachment {
  url?: string;
  displayUrl?: string;
  /** `'image'` marks one whose cached copy replaces its (remote) preview too. */
  type?: string;
  /** The file an unsent own message still holds (no `url` yet); see {@link CachedMediaUrls.resolve}. */
  file?: Blob;
  mimeType?: string;
  name?: string;
  size?: number;
}

function isRemote(url: string | undefined): url is string {
  return !!url && /^https?:/i.test(url);
}

/**
 * The key one media file is known by: its URL with the query and fragment dropped.
 *
 * This is the SDK's own key (`MediaCache.stripQuery`, BEH-MEDIA-12): a presigned link is
 * re-signed on every fetch, so the signature cannot be part of the identity or the same
 * file would never be recognised twice. The SDK reports this stripped form to
 * `onMediaDownloaded`, so anything comparing it to an attachment's stored URL has to strip
 * that side too.
 *
 * @internal
 */
export function mediaUrlKeyOf(url: string | undefined): string {
  const raw = String(url ?? '');
  let end = raw.length;
  const q = raw.indexOf('?');
  if (q !== -1) end = q;
  const h = raw.indexOf('#');
  if (h !== -1 && h < end) end = h;
  return raw.slice(0, end);
}

/** Whether media should be looked up in the SDK's cache for this render. */
export function shouldResolveCachedMedia(): boolean {
  if (!isOfflineOn() || !hasSdkFunction('getCachedMediaObjectURL')) return false;
  try {
    return offlineSdk().getMediaCachingMode?.() !== 'OFF';
  } catch {
    return true;
  }
}

/**
 * Whether the SDK's realtime connection is down right now. This is the SDK's
 * own state, read only on the offline path to label media that has no cached
 * copy; the kit never gates an offline decision on a browser connectivity API
 * (README P3).
 */
function sdkDisconnected(): boolean {
  try {
    const sdk = offlineSdk();
    if (typeof sdk?.getConnectionStatus !== 'function') return false;
    return sdk.getConnectionStatus() !== (sdk.CONNECTION_STATUS?.CONNECTED ?? 'connected');
  } catch {
    return false;
  }
}

/**
 * Owns the object URLs one bubble received, so they are revoked exactly once.
 *
 * Also knows which remote attachments the SDK had no copy of. While the device
 * is offline those are "unavailable" (the bubble shows "Available when online"
 * instead of a broken image); once it is back online they load from their URL
 * as today. A bubble calls {@link watch} once so a finished SDK download or a
 * return to online refreshes it.
 */
export class CachedMediaUrls {
  /**
   * Remote URL → the object URL this bubble got for it. A re-resolve (the message was cloned by a
   * receipt, a reaction or the ack) hands back the same object URL while the attachment is still
   * shown, so the image does not reload and a playing video or voice note does not restart.
   */
  private readonly cached = new Map<string, string>();
  /** The held file of an unsent own attachment → its preview object URL, kept the same way. */
  private readonly previews = new Map<Blob, string>();
  /** Remote attachments the last lookup found no cached copy for. */
  private readonly uncached = new Set<ResolvableAttachment>();
  /**
   * Attachment → the `url` and `displayUrl` it had before it was pointed at a
   * cached copy, so {@link original} can hand app code the remote attachment.
   */
  private readonly remoteOf = new WeakMap<
    ResolvableAttachment,
    { url?: string; displayUrl?: string }
  >();
  private generation = 0;
  private lastAttachments: ResolvableAttachment[] = [];
  private lastOnResolved: (() => void) | null = null;
  private inUse: ((attachment: ResolvableAttachment) => boolean) | null = null;
  private subscriptions: Subscription[] = [];

  /**
   * Point each remote attachment at its cached copy, if the SDK has one.
   * `onResolved` runs once after any attachment changed. A later `resolve` or
   * `release` makes this one's late answers a no-op. `inUse` names an
   * attachment that must keep its current source for now (audio being played:
   * changing the source would restart it); it is looked up again later.
   */
  resolve(
    attachments: ResolvableAttachment[],
    onResolved: () => void,
    inUse?: (attachment: ResolvableAttachment) => boolean
  ): void {
    // Late answers of the previous resolve are dropped.
    this.generation++;
    this.uncached.clear();
    this.lastAttachments = attachments;
    this.lastOnResolved = onResolved;
    this.inUse = inUse ?? null;
    const shown = new Set(attachments.map(a => a.url));
    this.previewQueuedFiles(attachments);
    // Let go of what these attachments no longer show.
    for (const [remote, objectUrl] of this.cached) {
      if (shouldResolveCachedMedia() && shown.has(remote)) continue;
      this.revoke(objectUrl);
      this.cached.delete(remote);
    }
    if (!shouldResolveCachedMedia()) return;
    for (const attachment of attachments) {
      const objectUrl = isRemote(attachment.url) ? this.cached.get(attachment.url) : undefined;
      if (objectUrl) this.point(attachment, objectUrl);
    }
    this.lookup(attachments, this.generation, onResolved);
  }

  private revoke(objectUrl: string): void {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {
      /* already revoked */
    }
  }

  /** Show `attachment` from its cached copy; an image's copy replaces its remote (expiring) preview too. */
  private point(attachment: ResolvableAttachment, objectUrl: string): void {
    const remote = attachment.url;
    // Remembered before the object URL goes in, so {@link original} can give
    // app code the attachment the message actually carries. Only the first
    // time: a re-resolve must not record an object URL as the remote one.
    if (!this.remoteOf.has(attachment))
      this.remoteOf.set(attachment, { url: remote, displayUrl: attachment.displayUrl });
    if (!attachment.displayUrl || attachment.displayUrl === remote || attachment.type === 'image')
      attachment.displayUrl = objectUrl;
    attachment.url = objectUrl;
  }

  /**
   * The attachment as the message carries it: a copy whose `url` and
   * `displayUrl` are the remote ones again, for handing to app code.
   *
   * The object URLs this bubble renders from belong to this bubble: it revokes
   * them when it re-resolves or is destroyed (scrolled away, chat switched), so
   * an app that saved or opened one from a click output would be left with a
   * `blob:` URL that has stopped working. An attachment that was never pointed
   * at a cached copy, including an unsent own one whose only source is the held
   * file, is returned as it is.
   */
  original<T extends ResolvableAttachment>(attachment: T): T {
    const remote = this.remoteOf.get(attachment);
    if (!remote) return attachment;
    const copy = { ...attachment };
    if (remote.url === undefined) delete copy.url;
    else copy.url = remote.url;
    if (remote.displayUrl === undefined) delete copy.displayUrl;
    else copy.displayUrl = remote.displayUrl;
    return copy;
  }

  /**
   * An unsent own attachment (no URL yet) is shown from the file the message still holds: an object
   * URL, revoked with the others by `release`. Offline ON only (the extractor adds no file otherwise).
   */
  private previewQueuedFiles(attachments: ResolvableAttachment[]): void {
    const live = new Set<Blob>();
    for (const attachment of attachments) {
      if (attachment.url || !attachment.file) continue;
      live.add(attachment.file);
      const objectUrl = this.previews.get(attachment.file) ?? URL.createObjectURL(attachment.file);
      this.previews.set(attachment.file, objectUrl);
      attachment.url = objectUrl;
      attachment.displayUrl = objectUrl;
      delete attachment.file;
    }
    for (const [file, objectUrl] of this.previews) {
      if (live.has(file)) continue;
      this.revoke(objectUrl);
      this.previews.delete(file);
    }
  }

  private lookup(
    attachments: ResolvableAttachment[],
    generation: number,
    onResolved: () => void,
    isRetry = false
  ): void {
    const lookups = attachments.map(async attachment => {
      const remote = attachment.url;
      if (!isRemote(remote)) return false;
      try {
        const objectUrl: string | null = await offlineSdk().getCachedMediaObjectURL({
          url: remote,
          mimeType: attachment.mimeType,
          name: attachment.name,
          size: attachment.size,
        });
        if (generation !== this.generation) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          return false;
        }
        if (!objectUrl) {
          this.uncached.add(attachment);
          return false;
        }
        if (this.inUse?.(attachment)) {
          URL.revokeObjectURL(objectUrl);
          this.uncached.add(attachment);
          return false;
        }
        this.uncached.delete(attachment);
        // Another attachment of this bubble may share the URL: one object URL per remote URL.
        const kept = this.cached.get(remote);
        if (kept) this.revoke(objectUrl);
        else this.cached.set(remote, objectUrl);
        this.point(attachment, kept ?? objectUrl);
        return true;
      } catch (error) {
        CometChatLogger.warn('OfflineMedia', 'Cached media lookup failed:', error);
        return false;
      }
    });
    // A bubble repaints when a copy turned up and, on the first lookup, when it learned a file is
    // not cached (that is what lets it show the placeholder). A retry that found nothing new must
    // not repaint: another bubble's download would otherwise rebuild this bubble's audio player.
    void Promise.all(lookups).then(changed => {
      if (generation !== this.generation) return;
      if (changed.some(Boolean) || (!isRetry && this.uncached.size > 0)) onResolved();
    });
  }

  /**
   * Whether this attachment has no cached copy and the device is offline, so it
   * cannot be shown now. False with offline off, with media caching off, for a
   * local (blob/data) source, and once the device is back online.
   */
  isUnavailable(attachment: ResolvableAttachment | undefined): boolean {
    return !!attachment && this.uncached.has(attachment) && sdkDisconnected();
  }

  /** Whether any attachment of the last `resolve` is unavailable right now. */
  hasUnavailable(): boolean {
    return sdkDisconnected() && this.lastAttachments.some(a => this.uncached.has(a));
  }

  /**
   * Refresh the bubble when the SDK finishes a download (`mediaReady$`) and when
   * the SDK's connection goes down or up (`connectionChanged$`). Call once, e.g.
   * from `ngOnInit`; undone by {@link dispose}. With offline off (or media
   * caching off) it subscribes to nothing, so an offline-off app gains no
   * listener at all (UIK-GATE-03).
   */
  watch(
    mediaReady$: Observable<unknown> | undefined,
    connectionChanged?: () => Observable<unknown>
  ): void {
    this.unwatch();
    if (!shouldResolveCachedMedia()) return;
    if (mediaReady$) {
      this.subscriptions.push(
        mediaReady$.subscribe(event => {
          // The SDK's download listener is global: without this, each finished
          // download made every mounted image, video, audio and file bubble
          // with uncached media do a cache lookup (N bubbles x K downloads).
          if (this.affectedByDownload(event)) this.retryUncached();
        })
      );
    }
    const connection$ = connectionChanged?.();
    if (connection$) {
      this.subscriptions.push(
        connection$.subscribe(() => {
          // Only a bubble holding media the SDK has no copy of is affected by
          // the connection changing: that is what turns "Available when
          // online" into the real source and back. Repainting unconditionally
          // rebuilt every idle voice-note player (cleanupWaveSurferInstances +
          // initializeAllWaveSurfers) on every connect and disconnect, and
          // re-decoded its audio. retryUncached repaints by itself when a copy
          // has turned up.
          const affected = this.uncached.size > 0;
          this.retryUncached();
          if (affected) this.lastOnResolved?.();
        })
      );
    }
  }

  /**
   * Whether a finished SDK download is for media this bubble is waiting for.
   * An event with no usable `urlKey` is taken as "maybe", so an SDK that does
   * not report one behaves as before.
   */
  private affectedByDownload(event: unknown): boolean {
    const urlKey = (event as { urlKey?: unknown } | null | undefined)?.urlKey;
    if (typeof urlKey !== 'string' || urlKey === '') return true;
    // Both sides are normalised before comparing. The SDK reports the URL with its
    // query dropped (`MediaCache.mediaUrlKey` -> `stripQuery`), while the attachment
    // keeps the full signed link, so a plain `===` never matched a presigned URL and
    // a background download never reached the bubble. The React Native kit already
    // normalises both sides (`useOfflineMediaUri.urlKeyOf`).
    const key = mediaUrlKeyOf(urlKey);
    for (const attachment of this.uncached) if (mediaUrlKeyOf(attachment.url) === key) return true;
    return false;
  }

  /** Attachments a `downloadMedia` was asked for and has not answered yet. */
  private readonly downloading = new Set<string>();

  /**
   * AC-12.3: the user tapped a media attachment the SDK has no copy of while
   * the SDK is connected. Ask the SDK to download and cache it
   * (`downloadMedia`); when it is done (its callback, or the global
   * `onMediaDownloaded` the bubble watches) the bubble resolves the cached copy
   * again. Returns whether a download was requested. Nothing with offline or
   * media caching off, for a cached or local attachment, or while disconnected.
   */
  requestDownload(attachment: ResolvableAttachment | undefined): boolean {
    if (
      !attachment ||
      !this.uncached.has(attachment) ||
      !shouldResolveCachedMedia() ||
      sdkDisconnected()
    )
      return false;
    if (!hasSdkFunction('downloadMedia')) return false;
    const remote = attachment.url;
    if (!isRemote(remote) || this.downloading.has(remote)) return false;
    this.downloading.add(remote);
    const done = () => {
      this.downloading.delete(remote);
      this.retryUncached();
    };
    const handlers = {
      onSuccess: done,
      onError: () => {
        this.downloading.delete(remote);
      },
    };
    try {
      const Listener = offlineSdk().MediaCallbackListener;
      offlineSdk().downloadMedia(
        {
          url: remote,
          mimeType: attachment.mimeType,
          name: attachment.name,
          size: attachment.size,
        },
        typeof Listener === 'function' ? new Listener(handlers) : handlers
      );
      return true;
    } catch (error) {
      this.downloading.delete(remote);
      CometChatLogger.warn('OfflineMedia', 'downloadMedia failed:', error);
      return false;
    }
  }

  /** Look up again only the attachments that had no cached copy. */
  private retryUncached(): void {
    if (!this.uncached.size || !this.lastOnResolved || !shouldResolveCachedMedia()) return;
    this.lookup([...this.uncached], this.generation, this.lastOnResolved, true);
  }

  private unwatch(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
  }

  /** Revoke every object URL handed out so far. */
  release(): void {
    this.generation++;
    this.uncached.clear();
    for (const url of [...this.cached.values(), ...this.previews.values()]) this.revoke(url);
    this.cached.clear();
    this.previews.clear();
  }

  /** `release` plus stop watching; the bubble's `ngOnDestroy`. */
  dispose(): void {
    this.unwatch();
    this.release();
    this.lastAttachments = [];
    this.lastOnResolved = null;
    this.inUse = null;
  }
}
