/**
 * cometchat-fullscreen-viewer.utils Tests
 *
 * Covers: formatFileSize, getFileExtension, generateDefaultFilename,
 *         preventBodyScroll, restoreBodyScroll, resolveDownloadTarget,
 *         getViewerAriaLabel, getMediaAltText, getGalleryPositionText,
 *         waitForVideoReady, enterPip, exitPip, downloadImageWithRetry.
 *
 * @module components/base-elements/cometchat-fullscreen-viewer/utils
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatFileSize,
  getFileExtension,
  generateDefaultFilename,
  preventBodyScroll,
  restoreBodyScroll,
  resolveDownloadTarget,
  getViewerAriaLabel,
  getMediaAltText,
  getGalleryPositionText,
  waitForVideoReady,
  enterPip,
  exitPip,
  downloadImageWithRetry,
} from './cometchat-fullscreen-viewer.utils';
import type { MediaAttachment } from '../../../modals/MediaAttachment';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

describe('formatFileSize', () => {
  it.each([
    [500, '500 B'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [1048576, '1.0 MB'],
    [1073741824, '1.0 GB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });

  it('shows no decimal for plain bytes', () => {
    expect(formatFileSize(999)).toBe('999 B');
  });

  it('returns an empty string for an unknown size', () => {
    expect(formatFileSize(undefined)).toBe('');
  });

  it('returns an empty string for zero rather than "0 B"', () => {
    expect(formatFileSize(0)).toBe('');
  });

  it('stops at GB rather than inventing a larger unit', () => {
    expect(formatFileSize(1024 ** 4)).toBe('1024.0 GB');
  });
});

describe('getFileExtension', () => {
  it.each([
    ['photo.png', 'PNG'],
    ['clip.MP4', 'MP4'],
    ['archive.tar.gz', 'GZ'],
  ])('extracts %s as %s', (name, expected) => {
    expect(getFileExtension(name)).toBe(expected);
  });

  it('returns an empty string when there is no extension', () => {
    expect(getFileExtension('README')).toBe('');
  });

  it('returns an empty string for an undefined name', () => {
    expect(getFileExtension(undefined)).toBe('');
  });

  it('treats a leading dot as an extension', () => {
    expect(getFileExtension('.gitignore')).toBe('GITIGNORE');
  });
});

describe('generateDefaultFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000));
  });

  it.each([
    ['image', 'download_1700000000000.jpg'],
    ['video', 'download_1700000000000.mp4'],
    ['audio', 'download_1700000000000.mp3'],
    ['file', 'download_1700000000000.bin'],
  ])('names a %s download', (type, expected) => {
    expect(generateDefaultFilename(type)).toBe(expected);
  });

  it('falls back to .bin for an unknown media type', () => {
    expect(generateDefaultFilename('hologram')).toBe('download_1700000000000.bin');
  });
});

// ---------------------------------------------------------------------------
// Body scroll
// ---------------------------------------------------------------------------

describe('body scroll locking', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('hides overflow and hands back the previous value', () => {
    document.body.style.overflow = 'scroll';
    expect(preventBodyScroll()).toBe('scroll');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('hands back an empty string when nothing was set', () => {
    document.body.style.overflow = '';
    expect(preventBodyScroll()).toBe('');
  });

  it('restores whatever value it was given', () => {
    restoreBodyScroll('auto');
    expect(document.body.style.overflow).toBe('auto');
  });

  it('round-trips so the page is left as it was found', () => {
    document.body.style.overflow = 'scroll';
    const original = preventBodyScroll();
    restoreBodyScroll(original);
    expect(document.body.style.overflow).toBe('scroll');
  });
});

// ---------------------------------------------------------------------------
// resolveDownloadTarget
// ---------------------------------------------------------------------------

describe('resolveDownloadTarget', () => {
  const attachment = (over: Partial<MediaAttachment> = {}) =>
    ({ url: 'https://cdn/a.png', name: 'a.png', type: 'image', ...over }) as MediaAttachment;

  it('prefers the current attachment in gallery mode', () => {
    const a = attachment();
    expect(resolveDownloadTarget(true, a, 'https://cdn/single.png', 'single.png', 'image')).toEqual({
      mediaUrl: 'https://cdn/a.png',
      filename: 'a.png',
      currentMedia: a,
    });
  });

  it('generates a filename for an unnamed gallery attachment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000));

    const result = resolveDownloadTarget(true, attachment({ name: '' }), '', '', 'image');
    expect(result?.filename).toBe('download_1700000000000.jpg');
  });

  it('defaults an untyped gallery attachment to image', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000));

    const result = resolveDownloadTarget(
      true,
      attachment({ name: '', type: undefined }),
      '',
      '',
      'file'
    );
    expect(result?.filename).toBe('download_1700000000000.jpg');
  });

  it('falls back to the single url when gallery mode has no attachment', () => {
    expect(resolveDownloadTarget(true, null, 'https://cdn/single.png', 'single.png', 'image')).toEqual({
      mediaUrl: 'https://cdn/single.png',
      filename: 'single.png',
      currentMedia: 'https://cdn/single.png',
    });
  });

  it('uses the single url outside gallery mode', () => {
    const result = resolveDownloadTarget(false, attachment(), 'https://cdn/single.mp4', 'c.mp4', 'video');
    expect(result?.mediaUrl).toBe('https://cdn/single.mp4');
  });

  it('generates a filename from the media type when none is given', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000));

    const result = resolveDownloadTarget(false, null, 'https://cdn/x', '', 'video');
    expect(result?.filename).toBe('download_1700000000000.mp4');
  });

  it('returns null when there is nothing to download', () => {
    expect(resolveDownloadTarget(false, null, '', '', 'image')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Aria helpers
// ---------------------------------------------------------------------------

describe('getViewerAriaLabel', () => {
  it.each(['video', 'audio', 'file'] as const)('returns a non-empty label for %s', (type) => {
    expect(getViewerAriaLabel(type)).toBeTruthy();
  });

  it('distinguishes each media type', () => {
    const labels = new Set([
      getViewerAriaLabel('video'),
      getViewerAriaLabel('audio'),
      getViewerAriaLabel('file'),
    ]);
    expect(labels.size).toBe(3);
  });

  it('falls back to the generic viewer label for an image', () => {
    expect(getViewerAriaLabel('image')).toBeTruthy();
  });
});

describe('getMediaAltText', () => {
  it('names the sender for a video', () => {
    expect(getMediaAltText('video', 'Alice', 'clip.mp4')).toContain('Alice');
  });

  it('names the sender for an image', () => {
    expect(getMediaAltText('image', 'Alice', 'photo.png')).toContain('Alice');
  });

  it('substitutes a placeholder when the sender is unknown', () => {
    const text = getMediaAltText('image', '', 'photo.png');
    expect(text).toBeTruthy();
    expect(text).not.toContain('{sender}');
  });

  it('falls back to the filename for other media types', () => {
    expect(getMediaAltText('file', 'Alice', 'invoice.pdf')).toBe('invoice.pdf');
  });

  it('falls back to the generic label when there is no filename either', () => {
    expect(getMediaAltText('file', 'Alice', '')).toBeTruthy();
  });

  it('leaves no unresolved placeholder in any branch', () => {
    for (const type of ['video', 'image', 'file', undefined]) {
      expect(getMediaAltText(type, 'Alice', 'f.bin')).not.toContain('{sender}');
    }
  });
});

describe('getGalleryPositionText', () => {
  it('reports the position and total', () => {
    const text = getGalleryPositionText(2, 5);
    expect(text).toContain('2');
    expect(text).toContain('5');
  });

  it('leaves no unresolved placeholders', () => {
    const text = getGalleryPositionText(1, 3);
    expect(text).not.toContain('{current}');
    expect(text).not.toContain('{total}');
  });

  it('handles a single-item gallery', () => {
    expect(getGalleryPositionText(1, 1)).toContain('1');
  });
});

// ---------------------------------------------------------------------------
// Video readiness and Picture-in-Picture
// ---------------------------------------------------------------------------

describe('waitForVideoReady', () => {
  function makeVideo(readyState: number) {
    const listeners: Record<string, () => void> = {};
    return {
      readyState,
      load: vi.fn(),
      addEventListener: (e: string, cb: () => void) => {
        listeners[e] = cb;
      },
      removeEventListener: (e: string) => {
        delete listeners[e];
      },
      fire: (e: string) => listeners[e]?.(),
      listeners,
    } as unknown as HTMLVideoElement & { fire: (e: string) => void; listeners: Record<string, () => void> };
  }

  it('resolves immediately when the video is already playable', async () => {
    await expect(waitForVideoReady(makeVideo(2))).resolves.toBeUndefined();
  });

  it('resolves once canplay fires', async () => {
    const video = makeVideo(1);
    const pending = waitForVideoReady(video);
    video.fire('canplay');
    await expect(pending).resolves.toBeUndefined();
  });

  it('rejects when the video errors', async () => {
    const video = makeVideo(1);
    const pending = waitForVideoReady(video);
    video.fire('error');
    await expect(pending).rejects.toThrow('Video load error');
  });

  it('calls load() when the video has not started loading', async () => {
    const video = makeVideo(0);
    const pending = waitForVideoReady(video);
    expect(video.load).toHaveBeenCalled();
    video.fire('canplay');
    await pending;
  });

  it('does not call load() when the video is already loading', async () => {
    const video = makeVideo(1);
    const pending = waitForVideoReady(video);
    expect(video.load).not.toHaveBeenCalled();
    video.fire('canplay');
    await pending;
  });

  it('detaches its listeners once settled', async () => {
    const video = makeVideo(1);
    const pending = waitForVideoReady(video);
    video.fire('canplay');
    await pending;
    expect(Object.keys(video.listeners)).toHaveLength(0);
  });

  it('times out after 5 seconds', async () => {
    vi.useFakeTimers();
    const video = makeVideo(1);
    const pending = waitForVideoReady(video);
    const assertion = expect(pending).rejects.toThrow('Video load timeout');
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });
});

describe('enterPip', () => {
  function makeVideo(over: Record<string, unknown> = {}) {
    return {
      readyState: 2,
      paused: false,
      play: vi.fn().mockResolvedValue(undefined),
      requestPictureInPicture: vi.fn().mockResolvedValue({}),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      load: vi.fn(),
      ...over,
    } as unknown as HTMLVideoElement;
  }

  it('requests picture-in-picture and reports success', async () => {
    const video = makeVideo();
    await expect(enterPip(video)).resolves.toBe(true);
    expect(video.requestPictureInPicture).toHaveBeenCalled();
  });

  it('starts playback first when the video is paused', async () => {
    const video = makeVideo({ paused: true });
    await enterPip(video);
    expect(video.play).toHaveBeenCalled();
  });

  it('continues even when playback is blocked', async () => {
    const video = makeVideo({ paused: true, play: vi.fn().mockRejectedValue(new Error('blocked')) });
    await expect(enterPip(video)).resolves.toBe(true);
    expect(video.requestPictureInPicture).toHaveBeenCalled();
  });

  it('reports failure when the request is refused', async () => {
    const video = makeVideo({
      requestPictureInPicture: vi.fn().mockRejectedValue(new Error('not allowed')),
    });
    await expect(enterPip(video)).resolves.toBe(false);
  });

  it('reports failure when the video never becomes ready', async () => {
    const video = makeVideo({ readyState: 1, addEventListener: vi.fn() });
    vi.useFakeTimers();
    const pending = enterPip(video);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(pending).resolves.toBe(false);
  });
});

describe('exitPip', () => {
  it('does nothing when nothing is in picture-in-picture', async () => {
    const exitSpy = vi.fn();
    Object.defineProperty(document, 'pictureInPictureElement', {
      value: null,
      configurable: true,
    });
    (document as unknown as Record<string, unknown>)['exitPictureInPicture'] = exitSpy;

    await exitPip();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits when a video is in picture-in-picture', async () => {
    const exitSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'pictureInPictureElement', {
      value: {},
      configurable: true,
    });
    (document as unknown as Record<string, unknown>)['exitPictureInPicture'] = exitSpy;

    await exitPip();
    expect(exitSpy).toHaveBeenCalled();
  });

  it('swallows a failure to exit', async () => {
    Object.defineProperty(document, 'pictureInPictureElement', {
      value: {},
      configurable: true,
    });
    (document as unknown as Record<string, unknown>)['exitPictureInPicture'] = vi
      .fn()
      .mockRejectedValue(new Error('nope'));

    await expect(exitPip()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// downloadImageWithRetry
// ---------------------------------------------------------------------------

describe('downloadImageWithRetry', () => {
  let lastXhr: Record<string, unknown>;

  function stubXhr(status: number) {
    lastXhr = {
      open: vi.fn(),
      send: vi.fn(),
      readyState: 4,
      status,
      response: new Blob(['x']),
      responseType: '',
    };
    // Must be constructible — the util calls `new XMLHttpRequest()`. A constructor
    // that returns an object yields that object, so every `new` hands back the stub.
    vi.stubGlobal(
      'XMLHttpRequest',
      function XhrStub(this: unknown) {
        return lastXhr;
      } as unknown as typeof XMLHttpRequest
    );
    return lastXhr;
  }

  it('opens a GET for the given url and sends it', () => {
    const xhr = stubXhr(200);
    downloadImageWithRetry('https://cdn/a.png', vi.fn(), vi.fn(), vi.fn());

    expect(xhr['open']).toHaveBeenCalledWith('GET', 'https://cdn/a.png', true);
    expect(xhr['send']).toHaveBeenCalled();
    expect(xhr['responseType']).toBe('blob');
  });

  it('reports progress when the length is known', () => {
    const xhr = stubXhr(200);
    const onProgress = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', onProgress, vi.fn(), vi.fn());

    (xhr['onprogress'] as (e: unknown) => void)({ lengthComputable: true, loaded: 50, total: 200 });
    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it('stays silent when the length is unknown', () => {
    const xhr = stubXhr(200);
    const onProgress = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', onProgress, vi.fn(), vi.fn());

    (xhr['onprogress'] as (e: unknown) => void)({ lengthComputable: false, loaded: 50, total: 0 });
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('falls back when the network fails', () => {
    const xhr = stubXhr(200);
    const onFallback = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', vi.fn(), vi.fn(), onFallback);

    (xhr['onerror'] as () => void)();
    expect(onFallback).toHaveBeenCalledWith('https://cdn/a.png');
  });

  it('falls back on timeout', () => {
    const xhr = stubXhr(200);
    const onFallback = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', vi.fn(), vi.fn(), onFallback);

    (xhr['ontimeout'] as () => void)();
    expect(onFallback).toHaveBeenCalledWith('https://cdn/a.png');
  });

  it('falls back immediately on a non-retryable status', () => {
    const xhr = stubXhr(500);
    const onFallback = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', vi.fn(), vi.fn(), onFallback);

    (xhr['onload'] as () => void)();
    expect(onFallback).toHaveBeenCalledWith('https://cdn/a.png');
  });

  it('ignores a load event before the request has completed', () => {
    const xhr = stubXhr(200);
    xhr['readyState'] = 3;
    const onFallback = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', vi.fn(), vi.fn(), onFallback);

    (xhr['onload'] as () => void)();
    expect(onFallback).not.toHaveBeenCalled();
  });

  it('retries a 403 rather than giving up', () => {
    vi.useFakeTimers();
    const xhr = stubXhr(403);
    const onFallback = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', vi.fn(), vi.fn(), onFallback);

    (xhr['onload'] as () => void)();
    expect(onFallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(800);
    expect(xhr['send']).toHaveBeenCalledTimes(2);
  });

  it('gives up on 403 once the attempt budget is spent', () => {
    const xhr = stubXhr(403);
    const onFallback = vi.fn();
    downloadImageWithRetry('https://cdn/a.png', vi.fn(), vi.fn(), onFallback, 5, 5);

    (xhr['onload'] as () => void)();
    expect(onFallback).toHaveBeenCalledWith('https://cdn/a.png');
  });
});
