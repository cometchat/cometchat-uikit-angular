/**
 * MediaUploadTrayService — the paths the sibling spec leaves dark.
 *
 * Three things keep the sibling spec away from most of this file:
 *
 *  1. `extractVideoMeta` needs a decoding `<video>`. jsdom has none, so the real
 *     element never fires `loadeddata` and the extraction promise simply hangs —
 *     every line after the first `await` is unreachable. Here `document.createElement`
 *     hands back a scripted media element instead, so the poster pipeline (and each
 *     of its failure modes) runs to completion.
 *  2. The service is built with `new` there, outside Angular DI, so `safeInjectToast`
 *     throws and `this.toast` is null — every toast call is a silent no-op. Here it is
 *     built inside an injection context with a stub toast, so the notification path is
 *     observable.
 *  3. The error-mapping fallbacks (missing error object, `getMessage()`-only errors,
 *     loose `ERR_BAD_REQUEST`, an unknown byte limit) only occur for inputs the happy
 *     path never produces.
 *
 * @module services/media-upload-tray
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  MediaUploadTrayService,
  DEFAULT_MAX_ATTACHMENTS,
  computeAggregate,
  detectAttachmentType,
  extractVideoMeta,
  mimeMatches,
} from './media-upload-tray.service';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatToastService } from '../components/base-elements/cometchat-toast/cometchat-toast.service';
import type { AttachmentFile } from '../components/cometchat-message-composer/cometchat-message-composer.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkFile(name: string, size: number, type: string): File {
  const f = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

/** What the scripted canvas returns from `toDataURL` unless a test overrides it. */
const POSTER_DATA_URL = 'data:image/jpeg;base64,AAA';

const GENERIC_UPLOAD_ERROR = CometChatLocalize.getLocalizedString(
  'message_composer_upload_failed',
);

interface MediaStubConfig {
  /** `video.duration` the fake element reports once metadata "lands". */
  duration?: number;
  videoWidth?: number;
  videoHeight?: number;
  /** How `load()` answers: fire `loadeddata`, fire `onerror`, or never respond. */
  load?: 'loadeddata' | 'error' | 'silent';
  /** Whether assigning `currentTime` fires `seeked`. */
  seek?: 'seeked' | 'silent';
  /** `getContext('2d')` returns null when 'none'. */
  context?: 'ok' | 'none';
  dataUrl?: string;
}

interface MediaStub {
  /** Every fake `<video>` handed out, in creation order. */
  videos: FakeVideo[];
  canvases: FakeCanvas[];
  /** Every tag `document.createElement` was asked for. */
  tags: string[];
}

interface FakeVideo {
  duration: number | undefined;
  videoWidth: number;
  videoHeight: number;
  src: string;
  muted: boolean;
  preload: string;
  playsInline: boolean;
  currentTime: number;
  onloadeddata: (() => void) | null;
  onerror: (() => void) | null;
  onseeked: (() => void) | null;
  /** Every value assigned to `currentTime`, so a test can prove a seek was skipped. */
  seekTargets: number[];
  load: () => void;
  removeAttribute: (name: string) => void;
}

interface FakeCanvas {
  width: number;
  height: number;
  drawImage: ReturnType<typeof vi.fn>;
  getContext: ReturnType<typeof vi.fn>;
  toDataURL: ReturnType<typeof vi.fn>;
}

function makeFakeVideo(cfg: MediaStubConfig): FakeVideo {
  const seekTargets: number[] = [];
  const video = {
    duration: cfg.duration,
    videoWidth: cfg.videoWidth ?? 0,
    videoHeight: cfg.videoHeight ?? 0,
    src: '',
    muted: false,
    preload: '',
    playsInline: false,
    onloadeddata: null,
    onerror: null,
    onseeked: null,
    seekTargets,
    removeAttribute: vi.fn(),
    load: vi.fn(() => {
      if (cfg.load === 'silent') {
        return;
      }
      setTimeout(() => {
        if (cfg.load === 'error') {
          video.onerror?.();
        } else {
          video.onloadeddata?.();
        }
      }, 0);
    }),
  } as unknown as FakeVideo;

  Object.defineProperty(video, 'currentTime', {
    get: () => seekTargets[seekTargets.length - 1] ?? 0,
    set: (t: number) => {
      seekTargets.push(t);
      if (cfg.seek === 'silent') {
        return;
      }
      setTimeout(() => video.onseeked?.(), 0);
    },
  });
  return video;
}

function makeFakeCanvas(cfg: MediaStubConfig): FakeCanvas {
  const drawImage = vi.fn();
  return {
    width: 0,
    height: 0,
    drawImage,
    getContext: vi.fn(() => (cfg.context === 'none' ? null : { drawImage })),
    toDataURL: vi.fn(() => cfg.dataUrl ?? POSTER_DATA_URL),
  };
}

/**
 * Replace `document.createElement` for 'video'/'canvas' with scripted stand-ins.
 * Configs are consumed in creation order; the last one repeats, so a single config
 * serves a whole batch of videos. Any other tag falls through to the real DOM.
 */
function installMediaStub(configs: MediaStubConfig[]): MediaStub {
  const stub: MediaStub = { videos: [], canvases: [], tags: [] };
  const configAt = (i: number): MediaStubConfig =>
    configs[Math.min(i, configs.length - 1)] ?? {};
  const realCreateElement = document.createElement.bind(document);

  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    stub.tags.push(tag);
    if (tag === 'video') {
      const video = makeFakeVideo(configAt(stub.videos.length));
      stub.videos.push(video);
      return video;
    }
    if (tag === 'canvas') {
      const canvas = makeFakeCanvas(configAt(stub.canvases.length));
      stub.canvases.push(canvas);
      return canvas;
    }
    return realCreateElement(tag as 'div');
  }) as typeof document.createElement);

  return stub;
}

// ---------------------------------------------------------------------------

describe('extractVideoMeta — local first-frame poster + duration', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  const realCreateObjectURL = (URL as unknown as Record<string, unknown>)['createObjectURL'];
  const realRevokeObjectURL = (URL as unknown as Record<string, unknown>)['revokeObjectURL'];

  const clip = (): File => mkFile('clip.mp4', 4096, 'video/mp4');

  beforeEach(() => {
    createObjectURL = vi.fn((f: File) => `blob:mock/${f.name}`);
    revokeObjectURL = vi.fn();
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = createObjectURL;
    (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = realCreateObjectURL;
    (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = realRevokeObjectURL;
  });

  it('gives up before touching the DOM when object URLs are unavailable', async () => {
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = undefined;
    const stub = installMediaStub([{}]);

    await expect(extractVideoMeta(clip())).resolves.toEqual({});
    // No element may be created: there is nothing to point a <video> at.
    expect(stub.tags).toEqual([]);
  });

  it('captures a downscaled first frame plus the duration, then releases the object URL', async () => {
    const stub = installMediaStub([
      { duration: 12.5, videoWidth: 640, videoHeight: 480 },
    ]);

    const meta = await extractVideoMeta(clip());

    expect(meta).toEqual({ poster: POSTER_DATA_URL, durationSec: 12.5 });
    // 640x480 against the default 320 cap -> scale 0.5.
    expect(stub.canvases[0].width).toBe(320);
    expect(stub.canvases[0].height).toBe(240);
    expect(stub.canvases[0].drawImage).toHaveBeenCalledWith(stub.videos[0], 0, 0, 320, 240);
    // Seeks just past 0 so an all-black leading frame is skipped.
    expect(stub.videos[0].seekTargets).toEqual([0.1]);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/clip.mp4');
    // Handlers are dropped so a late event cannot resolve anything.
    expect(stub.videos[0].onloadeddata).toBeNull();
    expect(stub.videos[0].onseeked).toBeNull();
  });

  it('honours maxDim and never collapses a sliver of a frame to zero pixels', async () => {
    const stub = installMediaStub([
      { duration: 3, videoWidth: 1000, videoHeight: 1 },
    ]);

    const meta = await extractVideoMeta(clip(), 100);

    expect(meta.poster).toBe(POSTER_DATA_URL);
    expect(stub.canvases[0].width).toBe(100);
    // round(1 * 0.1) is 0; the floor of 1 keeps toDataURL from failing on an empty canvas.
    expect(stub.canvases[0].height).toBe(1);
  });

  it('never upscales a frame smaller than the cap', async () => {
    const stub = installMediaStub([{ duration: 3, videoWidth: 16, videoHeight: 9 }]);

    await extractVideoMeta(clip(), 320);

    expect(stub.canvases[0].width).toBe(16);
    expect(stub.canvases[0].height).toBe(9);
  });

  it('skips the seek and reports no duration for a zero-length clip', async () => {
    // seek: 'silent' is the trap — if the code did seek here it would stall for the
    // full seek timeout instead of using the frame it already has.
    const stub = installMediaStub([
      { duration: 0, videoWidth: 320, videoHeight: 180, seek: 'silent' },
    ]);

    const meta = await extractVideoMeta(clip());

    expect(stub.videos[0].seekTargets).toEqual([]);
    expect(meta.poster).toBe(POSTER_DATA_URL);
    expect(meta.durationSec).toBeUndefined();
  });

  it('still posters a clip whose duration the browser reports as non-finite', async () => {
    const stub = installMediaStub([
      { duration: Number.NaN, videoWidth: 320, videoHeight: 180 },
    ]);

    const meta = await extractVideoMeta(clip());

    expect(meta.poster).toBe(POSTER_DATA_URL);
    expect(meta.durationSec).toBeUndefined();
    // With no usable duration the seek target falls back to 1/2 capped at 0.1.
    expect(stub.videos[0].seekTargets).toEqual([0.1]);
  });

  it('keeps the frame when the seek never completes', async () => {
    vi.useFakeTimers();
    const stub = installMediaStub([
      { duration: 12, videoWidth: 320, videoHeight: 180, seek: 'silent' },
    ]);

    const pending = extractVideoMeta(clip());
    await vi.advanceTimersByTimeAsync(1); // metadata lands
    await vi.advanceTimersByTimeAsync(2000); // seek timeout elapses

    await expect(pending).resolves.toEqual({
      poster: POSTER_DATA_URL,
      durationSec: 12,
    });
    expect(stub.videos[0].seekTargets).toEqual([0.1]);
  });

  it('resolves empty when the video never reports any data', async () => {
    vi.useFakeTimers();
    const stub = installMediaStub([
      { duration: 12, videoWidth: 320, videoHeight: 180, load: 'silent' },
    ]);

    const pending = extractVideoMeta(clip());
    await vi.advanceTimersByTimeAsync(4000); // loadeddata timeout elapses

    const meta = await pending;
    expect(meta.poster).toBeUndefined();
    expect(meta.durationSec).toBeUndefined();
    // No frame was ever drawn, and the object URL is released anyway.
    expect(stub.canvases).toEqual([]);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/clip.mp4');
  });

  it('resolves empty on a decode error and still tears the element down', async () => {
    const stub = installMediaStub([
      { duration: 12, videoWidth: 320, videoHeight: 180, load: 'error' },
    ]);

    const meta = await extractVideoMeta(clip());

    expect(meta.poster).toBeUndefined();
    expect(meta.durationSec).toBeUndefined();
    expect(stub.videos[0].removeAttribute).toHaveBeenCalledWith('src');
    expect(stub.videos[0].onerror).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/clip.mp4');
  });

  it('returns the duration alone when the frame has no dimensions', async () => {
    const stub = installMediaStub([{ duration: 7, videoWidth: 0, videoHeight: 0 }]);

    const meta = await extractVideoMeta(clip());

    expect(meta).toEqual({ durationSec: 7 });
    // Nothing to draw, so no canvas is allocated at all.
    expect(stub.tags).toEqual(['video']);
  });

  it('returns the duration alone when no 2D context is available', async () => {
    const stub = installMediaStub([
      { duration: 9, videoWidth: 320, videoHeight: 180, context: 'none' },
    ]);

    const meta = await extractVideoMeta(clip());

    expect(meta).toEqual({ durationSec: 9 });
    expect(stub.canvases[0].toDataURL).not.toHaveBeenCalled();
  });

  it('discards a data URL that is not an image', async () => {
    const stub = installMediaStub([
      {
        duration: 9,
        videoWidth: 320,
        videoHeight: 180,
        dataUrl: 'data:text/plain;base64,AAA',
      },
    ]);

    const meta = await extractVideoMeta(clip());

    // The frame WAS drawn — the result is rejected on its content type, not skipped.
    expect(stub.canvases[0].drawImage).toHaveBeenCalled();
    expect(meta).toEqual({ durationSec: 9 });
  });

  it('completes on a platform without revokeObjectURL', async () => {
    (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = undefined;
    installMediaStub([{ duration: 4, videoWidth: 320, videoHeight: 180 }]);

    // Cleanup runs before the poster is returned, so a throw in there would have
    // dropped us into the catch and lost the frame.
    await expect(extractVideoMeta(clip())).resolves.toEqual({
      poster: POSTER_DATA_URL,
      durationSec: 4,
    });
  });
});

// ---------------------------------------------------------------------------

describe('pure tray helpers — absent-field fallbacks', () => {
  it('computeAggregate treats missing byte counts as zero', () => {
    expect(computeAggregate([{ status: 'pending' } as unknown as AttachmentFile])).toEqual({
      loaded: 0,
      total: 0,
      percent: 0,
    });
  });

  it('computeAggregate falls back to the file size when the SDK has not reported a total', () => {
    const tiles = [
      { status: 'uploading', loaded: 100, size: 400 },
      { status: 'uploading', loaded: 0, total: 600, size: 1 },
    ] as unknown as AttachmentFile[];

    // 100/1000 — `size` stands in for the missing `total`, so the weighting stays byte-based.
    expect(computeAggregate(tiles)).toEqual({ loaded: 100, total: 1000, percent: 10 });
  });

  it('detectAttachmentType falls back to "file" for an absent MIME type', () => {
    expect(detectAttachmentType(undefined)).toBe('file');
    expect(detectAttachmentType('')).toBe('file');
  });

  it('mimeMatches accepts anything against an empty pattern', () => {
    expect(mimeMatches('image/png', '')).toBe(true);
    expect(mimeMatches('image/png', undefined as unknown as string)).toBe(true);
    // ...but a real pattern still discriminates.
    expect(mimeMatches('image/png', 'video/*')).toBe(false);
  });

  it('mimeMatches fails a file whose own MIME type is blank against a real pattern', () => {
    // The OS can hand back a File with an empty `type`. It must not slip through an
    // allow-list as a wildcard — only the PATTERN side is permissive when empty.
    expect(mimeMatches('', 'image/*')).toBe(false);
    expect(mimeMatches(undefined as unknown as string, 'image/png')).toBe(false);
    // ...and the pattern-side wildcard still lets it through.
    expect(mimeMatches('', '*/*')).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('MediaUploadTrayService — guards, fallbacks and the toast path', () => {
  let svc: MediaUploadTrayService;
  let listener: {
    onFileProgress: (id: string, loaded: number, total: number, percent: number) => void;
    onFileUploaded: (id: string, attachment: unknown) => void;
    onFileError: (id: string, error: unknown) => void;
    onFileFailure: (id: string, error: unknown) => void;
    onComplete: (result: unknown) => void;
  };
  let request: Record<string, ReturnType<typeof vi.fn>>;
  let createRequestSpy: ReturnType<typeof vi.spyOn>;
  let toast: { error: ReturnType<typeof vi.fn> };
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  const realCreateObjectURL = (URL as unknown as Record<string, unknown>)['createObjectURL'];
  const realRevokeObjectURL = (URL as unknown as Record<string, unknown>)['revokeObjectURL'];

  const idOf = (i: number): string => svc.tiles()[i].fileId as string;
  const errorText = (e: unknown): string =>
    (svc as unknown as { errorText: (e: unknown) => string }).errorText(e);

  beforeEach(() => {
    createObjectURL = vi.fn((f: File) => `blob:mock/${f.name}`);
    revokeObjectURL = vi.fn();
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = createObjectURL;
    (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = revokeObjectURL;

    // The listener bundle is built in a field initializer, so this must be in place
    // before the service is constructed.
    // Fake listener constructor: hands the callback bundle straight back so the test can drive it.
    vi.spyOn(CometChat, 'UploadFileListener').mockImplementation(function (this: unknown, bundle: unknown) {
      return bundle;
    } as unknown as typeof CometChat.UploadFileListener);
    vi.spyOn(CometChat, 'getMaxAttachmentCount').mockResolvedValue(10);

    request = {
      setParentMessageId: vi.fn(() => request),
      getBatchId: vi.fn(() => 'batch-1'),
      uploadAttachments: vi.fn((_items: unknown, l: unknown) => {
        listener = l as typeof listener;
      }),
      retryAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAll: vi.fn(),
    };
    createRequestSpy = vi
      .spyOn(CometChat, 'createUploadFileRequest')
      .mockImplementation(() => request as unknown as ReturnType<typeof CometChat.createUploadFileRequest>);

    toast = { error: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: CometChatToastService, useValue: toast as unknown as CometChatToastService },
      ],
    });
    // Built inside an injection context so `inject(CometChatToastService)` succeeds and the
    // notification path is really exercised rather than swallowed by `this.toast?.`.
    svc = TestBed.runInInjectionContext(() => new MediaUploadTrayService());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = realCreateObjectURL;
    (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = realRevokeObjectURL;
  });

  describe('stage guards', () => {
    it('does nothing for an empty or absent selection', async () => {
      await svc.stage([]);
      await svc.stage(null as unknown as File[]);

      // Returns before the limit is even fetched, so no request is minted either.
      expect(CometChat.getMaxAttachmentCount).not.toHaveBeenCalled();
      expect(createRequestSpy).not.toHaveBeenCalled();
      expect(svc.tiles()).toEqual([]);
      expect(svc.notice()).toBeNull();
    });

    it('keeps the size notice when a later file fails the type check too', async () => {
      svc.setValidationConfig({ maxFileSize: 50, allowedFileTypes: ['image/*'] });

      await svc.stage([
        mkFile('big.png', 100, 'image/png'), // too large -> sets the size notice
        mkFile('doc.pdf', 10, 'application/pdf'), // wrong type -> must not overwrite it
      ]);

      expect(svc.notice()).toBe(
        CometChatLocalize.getLocalizedString('message_composer_file_size_error'),
      );
      expect(svc.notice()).not.toBe(
        CometChatLocalize.getLocalizedString('message_composer_file_type_error'),
      );
      expect(svc.tiles()).toEqual([]);
      expect(request['uploadAttachments']).not.toHaveBeenCalled();
    });

    it('rejects a file whose MIME type the OS left blank against an allow-list', async () => {
      svc.setValidationConfig({ allowedFileTypes: ['image/*'] });

      await svc.stage([mkFile('photo', 10, '')]);

      // An empty `type` must not read as "matches everything" — that would let any
      // file past an image-only composer.
      expect(svc.notice()).toBe(
        CometChatLocalize.getLocalizedString('message_composer_file_type_error'),
      );
      expect(svc.tiles()).toEqual([]);
      expect(request['uploadAttachments']).not.toHaveBeenCalled();
    });

    it('leaves the batch alone when the destination is re-set to the same place', async () => {
      svc.setReceiver('alice', 'user');
      await svc.stage([mkFile('a.png', 10, 'image/png')]);

      svc.setReceiver('alice', 'user');

      expect(request['clearAll']).not.toHaveBeenCalled();
      expect(svc.tiles().length).toBe(1);
      expect(createRequestSpy).toHaveBeenCalledOnce();
    });
  });

  describe('local previews', () => {
    it('creates no preview for a file forced to "image" that is not one', async () => {
      // The image picker can hand back a file whose MIME type the OS left blank.
      await svc.stage([mkFile('photo', 10, '')], 'image');

      expect(svc.tiles()[0].type).toBe('image');
      expect(svc.tiles()[0].thumbnailUrl).toBeUndefined();
      expect(createObjectURL).not.toHaveBeenCalled();
    });

    it('stages the tile anyway when the object URL cannot be created', async () => {
      createObjectURL.mockImplementation(() => {
        throw new Error('blob quota exceeded');
      });

      await svc.stage([mkFile('a.png', 10, 'image/png')]);

      expect(svc.tiles().length).toBe(1);
      expect(svc.tiles()[0].status).toBe('uploading');
      expect(svc.tiles()[0].thumbnailUrl).toBeUndefined();
      expect(request['uploadAttachments']).toHaveBeenCalledOnce();
    });
  });

  describe('video poster hydration', () => {
    it('patches the extracted poster and duration onto the staged tile', async () => {
      installMediaStub([{ duration: 8, videoWidth: 320, videoHeight: 180 }]);

      await svc.stage([mkFile('clip.mp4', 4096, 'video/mp4')]);

      await vi.waitFor(() => {
        expect(svc.tiles()[0].thumbnailUrl).toBe(POSTER_DATA_URL);
      });
      expect(svc.tiles()[0].durationSec).toBe(8);
      expect(svc.tiles()[0].type).toBe('video');
    });

    it('patches the duration alone when the frame cannot be decoded', async () => {
      installMediaStub([{ duration: 6, videoWidth: 0, videoHeight: 0 }]);

      await svc.stage([mkFile('clip.mp4', 4096, 'video/mp4')]);

      await vi.waitFor(() => {
        expect(svc.tiles()[0].durationSec).toBe(6);
      });
      // No poster: the tile keeps its play-button placeholder rather than a broken image.
      expect(svc.tiles()[0].thumbnailUrl).toBeUndefined();
    });

    it('patches nothing when extraction yields neither poster nor duration', async () => {
      const stub = installMediaStub([{ load: 'error' }]);
      const patchTile = vi.spyOn(
        svc as unknown as { patchTile: (id: string, patch: unknown) => void },
        'patchTile',
      );

      await svc.stage([mkFile('clip.mp4', 4096, 'video/mp4')]);
      await vi.waitFor(() => {
        expect(stub.videos[0].onerror).toBeNull(); // extraction has finished and cleaned up
      });

      expect(patchTile).not.toHaveBeenCalled();
      expect(svc.tiles()[0].thumbnailUrl).toBeUndefined();
      expect(svc.tiles()[0].durationSec).toBeUndefined();
    });

    it('keeps draining the queue when a poster patch throws', async () => {
      const stub = installMediaStub([{ duration: 5, videoWidth: 320, videoHeight: 180 }]);
      // A throw out of the patch must not strand the files still waiting behind it.
      vi.spyOn(
        svc as unknown as { patchTile: (id: string, patch: unknown) => void },
        'patchTile',
      ).mockImplementation(() => {
        throw new Error('tile store failed');
      });

      await svc.stage([
        mkFile('a.mp4', 4096, 'video/mp4'),
        mkFile('b.mp4', 4096, 'video/mp4'),
        mkFile('c.mp4', 4096, 'video/mp4'),
      ]);

      // Concurrency is 2, so the third only starts once an earlier one settles.
      await vi.waitFor(() => {
        expect(stub.videos.length).toBe(3);
      });
      expect(svc.tiles().length).toBe(3);
    });

    it('skips hydration entirely when the picker forced a non-video kind', async () => {
      const stub = installMediaStub([{ duration: 5, videoWidth: 320, videoHeight: 180 }]);

      await svc.stage([mkFile('clip.mp4', 4096, 'video/mp4')], 'file');

      expect(stub.tags).toEqual([]);
      expect(svc.tiles()[0].type).toBe('file');
    });
  });

  describe('attachment limit', () => {
    it('falls back to the default limit when the SDK reports a nonsense count', async () => {
      (CometChat.getMaxAttachmentCount as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      expect(await svc.getMaxCount()).toBe(DEFAULT_MAX_ATTACHMENTS);
      expect(await svc.remainingSlots()).toBe(DEFAULT_MAX_ATTACHMENTS);
    });

    it('falls back to the default limit when the SDK getter rejects', async () => {
      (CometChat.getMaxAttachmentCount as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('offline'),
      );

      expect(await svc.getMaxCount()).toBe(DEFAULT_MAX_ATTACHMENTS);
    });

    it('fetches the limit once and serves the cached value after that', async () => {
      (CometChat.getMaxAttachmentCount as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(4);

      expect(await svc.getMaxCount()).toBe(4);
      expect(await svc.getMaxCount()).toBe(4);

      expect(CometChat.getMaxAttachmentCount).toHaveBeenCalledOnce();
    });

    it('reports the free slots left after what is already staged', async () => {
      (CometChat.getMaxAttachmentCount as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(3);

      await svc.stage([mkFile('a.png', 10, 'image/png'), mkFile('b.png', 10, 'image/png')]);

      expect(await svc.remainingSlots()).toBe(1);
      svc.remove(svc.tiles()[0]);
      expect(await svc.remainingSlots()).toBe(2);
    });
  });

  describe('tile lifecycle edge cases', () => {
    it('ignores a progress event for a tile that was already removed', async () => {
      await svc.stage([mkFile('a.png', 1000, 'image/png')]);
      const id = idOf(0);
      svc.remove(svc.tiles()[0]);

      listener.onFileProgress(id, 500, 1000, 50);

      // The tile must not come back from the dead.
      expect(svc.tiles()).toEqual([]);
      expect(svc.aggregate()).toEqual({ loaded: 0, total: 0, percent: 0 });
      expect(svc.hasTiles()).toBe(false);
    });

    it('removes a tile keyed only by `id` before any batch exists', () => {
      svc.remove({ id: 'orphan', status: 'failed' } as AttachmentFile);

      // Nothing to tell the SDK about — the request was never created.
      expect(createRequestSpy).not.toHaveBeenCalled();
      expect(request['removeAttachment']).not.toHaveBeenCalled();
      expect(svc.tiles()).toEqual([]);
      expect(svc.canSend()).toBe(false);
    });

    it('revokes blob previews on clearAll and leaves tiles without one alone', async () => {
      await svc.stage([
        mkFile('a.png', 10, 'image/png'),
        mkFile('notes.pdf', 10, 'application/pdf'),
      ]);
      expect(svc.tiles()[1].thumbnailUrl).toBeUndefined();

      svc.clearAll();

      expect(revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/a.png');
    });

    it('clearAll on an untouched tray resets state without reaching for a request', () => {
      svc.clearAll();

      expect(request['clearAll']).not.toHaveBeenCalled();
      expect(svc.hasTiles()).toBe(false);
      expect(svc.canSend()).toBe(false);
      expect(svc.notice()).toBeNull();
      expect(svc.getBatchId()).toBeNull();
    });

    it('reset releases the batch like clearAll', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png')]);

      svc.reset();

      expect(request['clearAll']).toHaveBeenCalledOnce();
      expect(svc.hasTiles()).toBe(false);
      expect(svc.getBatchId()).toBeNull();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/a.png');
    });

    it('retry is inert while there is no batch to retry into', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png')]);
      const attachment = { getUrl: () => 'https://cdn/a.png' } as unknown as CometChat.Attachment;
      listener.onFileUploaded(idOf(0), attachment);
      listener.onComplete({ successful: [{ fileId: idOf(0), attachment }] });
      expect(svc.canSend()).toBe(true);

      // The batch is released but the tray still holds the tile. Retrying must change
      // nothing — walking the tile back to `uploading` would strand it in a state the
      // (now absent) listener can never resolve, and would pull Send away for good.
      (svc as unknown as { request: unknown }).request = null;
      svc.retry({ id: idOf(0), status: 'failed' } as AttachmentFile);

      expect(request['retryAttachment']).not.toHaveBeenCalled();
      expect(svc.tiles()[0].status).toBe('uploaded');
      expect(svc.canSend()).toBe(true);
    });

    it('retry keys off `id` when the tile carries no fileId', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png')]);
      const id = idOf(0);
      listener.onFileFailure(id, { message: 'network' });

      svc.retry({ id, status: 'failed' } as AttachmentFile);

      expect(request['retryAttachment']).toHaveBeenCalledWith(id);
      expect(svc.tiles()[0].status).toBe('uploading');
    });

    it('still flips the tile to uploading when retryAttachment throws', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png')]);
      listener.onFileFailure(idOf(0), { message: 'network' });
      request['retryAttachment'].mockImplementation(() => {
        throw new Error('presign expired');
      });

      svc.retry(svc.tiles()[0]);

      // The throw is reported through the listener, so the tile shows progress, not an error.
      expect(svc.tiles()[0].status).toBe('uploading');
      expect(svc.tiles()[0].errorMessage).toBeUndefined();
      expect(svc.tiles()[0].uploadProgress).toBe(0);
      expect(svc.canSend()).toBe(false);
    });

    it('a tile left in the legacy "error" status still blocks Send', async () => {
      await svc.stage([
        mkFile('a.png', 10, 'image/png'),
        mkFile('b.png', 10, 'image/png'),
      ]);
      const attachment = { getUrl: () => 'https://cdn/a.png' } as unknown as CometChat.Attachment;
      listener.onFileUploaded(idOf(0), attachment);
      listener.onFileUploaded(idOf(1), attachment);
      listener.onComplete({ successful: [{ fileId: idOf(0) }, { fileId: idOf(1) }] });
      expect(svc.canSend()).toBe(true);

      // `error` is the pre-rename spelling of a terminal upload failure and is still in
      // AttachmentTileStatus. deriveCanSend ignores it (it only looks for in-flight +
      // uploaded), so the gate has to come from hasErrorTile.
      (svc as unknown as { patchTile: (id: string, p: Partial<AttachmentFile>) => void }).patchTile(
        idOf(1),
        { status: 'error', errorMessage: 'legacy failure' },
      );

      expect(svc.hasErrorTile()).toBe(true);
      expect(svc.canSend()).toBe(false);
      // Removing the offender hands Send back rather than latching it off.
      svc.remove(svc.tiles()[1]);
      expect(svc.hasErrorTile()).toBe(false);
      expect(svc.canSend()).toBe(true);
    });

    it('onComplete without successes takes Send away again', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png')]);
      const attachment = { getUrl: () => 'https://cdn/a.png' } as unknown as CometChat.Attachment;
      listener.onFileUploaded(idOf(0), attachment);
      listener.onComplete({ successful: [{ fileId: idOf(0), attachment }] });
      expect(svc.canSend()).toBe(true);

      // onComplete re-fires whenever the batch drains and always describes the whole
      // batch, so an empty result must SET the gate back, not leave it latched.
      listener.onComplete({ successful: [] });
      expect(svc.canSend()).toBe(false);

      listener.onComplete({});
      expect(svc.canSend()).toBe(false);

      listener.onComplete(undefined);
      expect(svc.canSend()).toBe(false);
    });
  });

  describe('upload error copy', () => {
    it('shows the localized generic message when the SDK reports no error object', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png')]);

      listener.onFileError(idOf(0), undefined);

      expect(svc.tiles()[0].status).toBe('rejected');
      expect(svc.tiles()[0].errorMessage).toBe(GENERIC_UPLOAD_ERROR);
      expect(toast.error).toHaveBeenCalledWith(GENERIC_UPLOAD_ERROR, { duration: 4000 });
    });

    it('reads the text from getMessage() when there is no message property', () => {
      expect(errorText({ getMessage: () => 'This file type is not allowed.' })).toBe(
        'File type not supported.',
      );
    });

    it('stays quiet for an error carrying neither code nor text', () => {
      const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);

      expect(errorText({})).toBe('');

      // Nothing to log: a warning with an empty message is noise.
      expect(warn).not.toHaveBeenCalled();
    });

    it('logs the raw SDK text for an error it cannot map', () => {
      const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);

      expect(errorText({ code: 'ERR_UPLOAD_STALLED', message: 'Upload stalled.' })).toBe('');

      expect(warn).toHaveBeenCalledWith(
        'MediaUploadTray',
        'Unmapped upload error:',
        'Upload stalled.',
        'ERR_UPLOAD_STALLED',
      );
    });

    it('treats a bare 400 as an invalid file, but lets a self-describing message win', () => {
      expect(errorText({ code: 'ERR_BAD_REQUEST', message: 'Bad Request' })).toBe('Invalid File');

      // Same loose code, but the text names a size problem — so the size copy must win.
      expect(
        errorText({
          code: 'ERR_BAD_REQUEST',
          message: 'The file exceeds the maximum allowed size of 1048576 bytes.',
        }),
      ).toBe('File exceeds the 1 MB size limit.');
    });

    it('drops the {n} placeholder when no byte limit is known', () => {
      // No "of N bytes" in the message and no maxFileSize @Input to fall back on.
      const text = errorText({ code: 'ERR_FILE_SIZE_EXCEEDED', message: 'File too large' });

      expect(text).not.toContain('{n}');
      // Current behaviour: the removed placeholder leaves a double space behind.
      expect(text).toBe('File exceeds the  MB size limit.');
    });

    it('falls back to the composer maxFileSize, floored at 1 MB', () => {
      svc.setValidationConfig({ maxFileSize: 1024 });

      // 1 KB rounds to 0 MB; the floor keeps the copy from reading "0 MB".
      expect(errorText({ code: 'ERR_FILE_SIZE_EXCEEDED', message: 'File too large' })).toBe(
        'File exceeds the 1 MB size limit.',
      );
    });
  });

  describe('error toasts', () => {
    it('uses the generic message when there is no text to show', () => {
      (svc as unknown as { notifyError: (m?: string | null) => void }).notifyError(undefined);

      expect(toast.error).toHaveBeenCalledWith(GENERIC_UPLOAD_ERROR, { duration: 4000 });
    });

    it('dedupes identical toasts fired in quick succession', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png'), mkFile('b.png', 10, 'image/png')]);

      // Two files failing the same way at once must not stack two identical toasts.
      listener.onFileError(idOf(0), { code: 'ERR_X', message: 'who knows' });
      listener.onFileError(idOf(1), { code: 'ERR_X', message: 'who knows' });

      expect(toast.error).toHaveBeenCalledOnce();
      expect(svc.tiles().map((t) => t.status)).toEqual(['rejected', 'rejected']);
    });

    it('lets a different message through immediately', async () => {
      await svc.stage([mkFile('a.png', 10, 'image/png'), mkFile('b.png', 10, 'image/png')]);

      listener.onFileError(idOf(0), {
        code: 'ERR_FILE_SIZE_EXCEEDED',
        message: 'exceeds the maximum allowed size of 104857600 bytes',
      });
      listener.onFileFailure(idOf(1), { code: 'ERR_X', message: 'who knows' });

      expect(toast.error).toHaveBeenCalledTimes(2);
      expect(toast.error.mock.calls[0][0]).toBe('File exceeds the 100 MB size limit.');
      expect(toast.error.mock.calls[1][0]).toBe(GENERIC_UPLOAD_ERROR);
    });
  });
});
