vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { CachedMediaUrls, ResolvableAttachment } from './media';

const REMOTE = 'https://cdn.example.com/a.mp3';
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function attachment(url = REMOTE): ResolvableAttachment {
  return { url, name: 'a.mp3', mimeType: 'audio/mpeg', size: 10 };
}

describe('CachedMediaUrls (README §3.8)', () => {
  let fake: OfflineSdkFake;
  let revoked: string[];
  let online: boolean;

  beforeEach(() => {
    fake = installOfflineSdk();
    revoked = [];
    online = true;
    (URL as any).revokeObjectURL = (url: string) => {
      revoked.push(url);
    };
    // The SDK's connection state (never navigator.onLine, README P3).
    Object.defineProperty(fake, 'connected', { get: () => online, configurable: true });
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  it('points an attachment at the SDK copy and revokes it exactly once on dispose', async () => {
    fake.cachedMedia.set(REMOTE, 'blob:cached-1');
    const media = new CachedMediaUrls();
    const a = attachment();
    const onResolved = vi.fn();
    media.resolve([a], onResolved);
    await flush();
    expect(a.url).toBe('blob:cached-1');
    expect(onResolved).toHaveBeenCalledTimes(1);
    media.dispose();
    media.dispose();
    expect(revoked).toEqual(['blob:cached-1']);
  });

  it('a clone of the message keeps the same object URL at once: no revoke, no second lookup', async () => {
    fake.cachedMedia.set(REMOTE, 'blob:cached-1');
    const media = new CachedMediaUrls();
    const first = attachment();
    media.resolve([first], vi.fn());
    await flush();
    expect(first.url).toBe('blob:cached-1');
    const lookups = fake.callsTo('getCachedMediaObjectURL').length;

    // A receipt or reaction clones the message: fresh attachments with the remote URL again.
    const clone = attachment();
    media.resolve([clone], vi.fn());
    // Before any async step: the clone is already pointed at the cached copy.
    expect(clone.url).toBe('blob:cached-1');
    await flush();
    expect(clone.url).toBe('blob:cached-1');
    expect(revoked).toEqual([]);
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(lookups);

    // The attachment is gone from the message: its copy is let go.
    media.resolve([attachment('https://cdn.example.com/other.mp3')], vi.fn());
    expect(revoked).toEqual(['blob:cached-1']);
    media.dispose();
  });

  it('a queued file keeps its preview URL across a clone and releases it when the file is gone', () => {
    const create = vi.fn().mockReturnValueOnce('blob:held-1').mockReturnValue('blob:held-more');
    (URL as any).createObjectURL = create;
    const media = new CachedMediaUrls();
    const file = new Blob(['x']);
    const first: ResolvableAttachment = { name: 'p.png', type: 'image', file };
    media.resolve([first], vi.fn());
    expect(first.url).toBe('blob:held-1');
    const clone: ResolvableAttachment = { name: 'p.png', type: 'image', file };
    media.resolve([clone], vi.fn());
    expect(clone.url).toBe('blob:held-1');
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoked).toEqual([]);
    media.resolve([attachment()], vi.fn());
    expect(revoked).toEqual(['blob:held-1']);
    media.dispose();
  });

  it('treats a never-downloaded attachment as unavailable only while the device is offline', async () => {
    const media = new CachedMediaUrls();
    const a = attachment();
    const onResolved = vi.fn();
    media.resolve([a], onResolved);
    await flush();
    expect(a.url).toBe(REMOTE);
    expect(media.isUnavailable(a)).toBe(false);
    online = false;
    expect(media.isUnavailable(a)).toBe(true);
    expect(media.hasUnavailable()).toBe(true);
    // The bubble repaints so it can show the placeholder instead of a broken image.
    expect(onResolved).toHaveBeenCalled();
    online = true;
    expect(media.hasUnavailable()).toBe(false);
  });

  it('refreshes the bubble when the SDK finishes the download (mediaReady$)', async () => {
    online = false;
    const mediaReady$ = new Subject<unknown>();
    const media = new CachedMediaUrls();
    const a = attachment();
    const onResolved = vi.fn();
    media.watch(mediaReady$);
    media.resolve([a], onResolved);
    await flush();
    expect(media.isUnavailable(a)).toBe(true);

    fake.cachedMedia.set(REMOTE, 'blob:downloaded');
    mediaReady$.next({ urlKey: REMOTE });
    await flush();
    expect(a.url).toBe('blob:downloaded');
    expect(media.isUnavailable(a)).toBe(false);
    media.dispose();
    expect(revoked).toEqual(['blob:downloaded']);
  });

  it('stops listening to mediaReady$ after dispose', async () => {
    const mediaReady$ = new Subject<unknown>();
    const media = new CachedMediaUrls();
    media.watch(mediaReady$);
    media.resolve([attachment()], vi.fn());
    await flush();
    media.dispose();
    const lookups = fake.callsTo('getCachedMediaObjectURL').length;
    mediaReady$.next({});
    await flush();
    expect(fake.callsTo('getCachedMediaObjectURL').length).toBe(lookups);
  });

  it('repaints when the SDK reconnects so the bubble loads from its URL', async () => {
    online = false;
    const media = new CachedMediaUrls();
    const onResolved = vi.fn();
    const connection$ = new Subject<boolean>();
    media.watch(undefined, () => connection$);
    media.resolve([attachment()], onResolved);
    await flush();
    onResolved.mockClear();
    online = true;
    connection$.next(true);
    expect(onResolved).toHaveBeenCalledTimes(1);
    media.dispose();
  });

  it('with offline off, watch subscribes to nothing (no listener, UIK-GATE-03)', () => {
    fake.setEnabled(false);
    const media = new CachedMediaUrls();
    const mediaReady$ = new Subject<unknown>();
    const connection$ = new Subject<boolean>();
    const factory = vi.fn(() => connection$);
    const addListener = vi.spyOn(window, 'addEventListener');
    media.watch(mediaReady$, factory);
    expect(mediaReady$.observed).toBe(false);
    expect(factory).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalled();
    media.dispose();
  });

  it('does nothing with offline off (P1): no lookup, nothing unavailable', async () => {
    fake.setEnabled(false);
    online = false;
    const media = new CachedMediaUrls();
    const a = attachment();
    media.resolve([a], vi.fn());
    await flush();
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
    expect(media.isUnavailable(a)).toBe(false);
  });

  it('does nothing when the SDK media caching is OFF (BEH-MEDIA-03)', async () => {
    fake.mediaCachingMode = 'OFF';
    online = false;
    const media = new CachedMediaUrls();
    const a = attachment();
    media.resolve([a], vi.fn());
    await flush();
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
    expect(media.isUnavailable(a)).toBe(false);
  });

  it('AC-12.3: a tap online on a never-downloaded attachment asks the SDK to download it, once, then shows the cached copy', async () => {
    const media = new CachedMediaUrls();
    const onResolved = vi.fn();
    const a = attachment();
    media.resolve([a], onResolved);
    await flush();
    expect(media.requestDownload(a)).toBe(true);
    expect(media.requestDownload(a)).toBe(false); // single-flight
    const [[desc, callback]] = fake.callsTo('downloadMedia') as any;
    expect(desc.url).toBe(REMOTE);
    fake.cachedMedia.set(REMOTE, 'blob:cached-a');
    callback.onSuccess();
    await flush();
    expect(a.url).toBe('blob:cached-a');
    media.dispose();
  });

  it('does not repaint when a retry found nothing new (another bubble finished a download)', async () => {
    const mediaReady$ = new Subject<unknown>();
    const media = new CachedMediaUrls();
    const onResolved = vi.fn();
    media.watch(mediaReady$);
    media.resolve([attachment()], onResolved);
    await flush();
    expect(onResolved).toHaveBeenCalledTimes(1); // learned it is not cached
    mediaReady$.next({ urlKey: 'https://cdn.example.com/other.mp3' });
    await flush();
    expect(onResolved).toHaveBeenCalledTimes(1);
    media.dispose();
  });

  it('keeps the source of an attachment in use, and swaps it once it is free', async () => {
    const mediaReady$ = new Subject<unknown>();
    const media = new CachedMediaUrls();
    const a = attachment();
    let playing = true;
    media.watch(mediaReady$);
    media.resolve([a], vi.fn(), () => playing);
    await flush();
    fake.cachedMedia.set(REMOTE, 'blob:later');
    mediaReady$.next({ urlKey: REMOTE });
    await flush();
    expect(a.url).toBe(REMOTE);
    expect(revoked).toEqual(['blob:later']);
    playing = false;
    mediaReady$.next({ urlKey: REMOTE });
    await flush();
    expect(a.url).toBe('blob:later');
    media.dispose();
  });

  it('finds a copy that arrived during playback when the connection drops', async () => {
    const connection$ = new Subject<boolean>();
    const media = new CachedMediaUrls();
    const a = attachment();
    media.watch(undefined, () => connection$);
    media.resolve([a], vi.fn());
    await flush();
    fake.cachedMedia.set(REMOTE, 'blob:kept');
    online = false;
    connection$.next(false);
    await flush();
    expect(a.url).toBe('blob:kept');
    expect(media.isUnavailable(a)).toBe(false);
    media.dispose();
  });

  it('AC-12.3: no download while disconnected, for a cached attachment, or with offline off', async () => {
    const media = new CachedMediaUrls();
    const a = attachment();
    media.resolve([a], vi.fn());
    await flush();
    online = false;
    expect(media.requestDownload(a)).toBe(false);
    online = true;
    fake.setEnabled(false);
    expect(media.requestDownload(a)).toBe(false);
    expect(media.requestDownload(undefined)).toBe(false);
    expect(fake.callsTo('downloadMedia')).toHaveLength(0);
    media.dispose();
  });

  /**
   * A click output hands the attachment to app code, which may save or open it
   * long after this bubble revoked its object URL (Prajwal 2026-11-20T13:00Z).
   */
  describe('original: what a click output may hand to app code', () => {
    it('gives back the remote url and displayUrl, not the object URL', async () => {
      fake.cachedMedia.set(REMOTE, 'blob:cached-1');
      const media = new CachedMediaUrls();
      const a: ResolvableAttachment = { ...attachment(), type: 'image', displayUrl: 'https://cdn.example.com/a-medium.jpg' };
      media.resolve([a], vi.fn());
      await flush();
      // Rendering still uses the cached copy.
      expect(a.url).toBe('blob:cached-1');
      expect(a.displayUrl).toBe('blob:cached-1');

      const out = media.original(a);
      expect(out.url).toBe(REMOTE);
      expect(out.displayUrl).toBe('https://cdn.example.com/a-medium.jpg');
      // A copy: the rendered attachment is left pointing at the cached copy.
      expect(out).not.toBe(a);
      expect(a.url).toBe('blob:cached-1');
      // Everything else is carried over.
      expect(out.name).toBe('a.mp3');
      expect(out.mimeType).toBe('audio/mpeg');
      media.dispose();
    });

    it('keeps the remote url across a re-resolve of the same attachment', async () => {
      fake.cachedMedia.set(REMOTE, 'blob:cached-1');
      const media = new CachedMediaUrls();
      const a = attachment();
      media.resolve([a], vi.fn());
      await flush();
      // A receipt or reaction re-renders the bubble with the same attachment.
      media.resolve([a], vi.fn());
      await flush();
      expect(media.original(a).url).toBe(REMOTE);
      media.dispose();
    });

    it('leaves an attachment with no remote url alone (an unsent own one)', () => {
      (URL as any).createObjectURL = vi.fn().mockReturnValue('blob:held-1');
      const media = new CachedMediaUrls();
      const held: ResolvableAttachment = { name: 'p.png', type: 'image', file: new Blob(['x']) };
      media.resolve([held], vi.fn());
      expect(held.url).toBe('blob:held-1');
      // Nothing else to offer: the message has no remote copy yet.
      expect(media.original(held)).toBe(held);
      media.dispose();
    });

    it('leaves an attachment that was never cached alone', async () => {
      const media = new CachedMediaUrls();
      const a = attachment();
      media.resolve([a], vi.fn());
      await flush();
      expect(a.url).toBe(REMOTE);
      expect(media.original(a)).toBe(a);
      media.dispose();
    });

    it('restores a displayUrl that the message never had', async () => {
      fake.cachedMedia.set(REMOTE, 'blob:cached-1');
      const media = new CachedMediaUrls();
      const a: ResolvableAttachment = { ...attachment(), type: 'image' };
      media.resolve([a], vi.fn());
      await flush();
      expect(a.displayUrl).toBe('blob:cached-1');
      expect('displayUrl' in media.original(a)).toBe(false);
      media.dispose();
    });
  });

  /**
   * What `watch` costs a mounted bubble (Prajwal 2026-11-20T11:54Z on #674).
   *
   * Both subscriptions are global: `mediaReady$` fires for every finished SDK
   * download and `connectionChanged$` for every connect and disconnect, in
   * every mounted bubble at once. A repaint is not free — an audio bubble
   * tears down and rebuilds every WaveSurfer instance and re-decodes the
   * audio (cometchat-audio-bubble.component.ts cleanupWaveSurferInstances +
   * initializeAllWaveSurfers) — so a bubble must only pay when the event is
   * about media it is actually waiting for.
   */
  describe('what a global media event costs an idle bubble', () => {
    it('a connection change does not repaint a bubble whose media is all cached', async () => {
      fake.cachedMedia.set(REMOTE, 'blob:cached-1');
      const connection$ = new Subject<boolean>();
      const media = new CachedMediaUrls();
      const onResolved = vi.fn();
      media.watch(undefined, () => connection$);
      media.resolve([attachment()], onResolved);
      await flush();
      expect(onResolved).toHaveBeenCalledTimes(1); // the copy turned up
      const lookups = fake.callsTo('getCachedMediaObjectURL').length;
      onResolved.mockClear();

      online = false;
      connection$.next(false);
      await flush();
      online = true;
      connection$.next(true);
      await flush();

      // An idle voice note keeps its player: nothing about it changed.
      expect(onResolved).not.toHaveBeenCalled();
      expect(fake.callsTo('getCachedMediaObjectURL').length).toBe(lookups);
      media.dispose();
    });

    it('a connection change still repaints a bubble that is waiting for media', async () => {
      online = false;
      const connection$ = new Subject<boolean>();
      const media = new CachedMediaUrls();
      const onResolved = vi.fn();
      media.watch(undefined, () => connection$);
      const a = attachment();
      media.resolve([a], onResolved);
      await flush();
      expect(media.isUnavailable(a)).toBe(true); // "Available when online"
      onResolved.mockClear();

      online = true;
      connection$.next(true);
      await flush();

      // The placeholder has to turn back into the real source.
      expect(onResolved).toHaveBeenCalled();
      expect(media.isUnavailable(a)).toBe(false);
      media.dispose();
    });

    it('a download of another bubble\'s file costs no cache lookup here', async () => {
      online = false;
      const mediaReady$ = new Subject<unknown>();
      const media = new CachedMediaUrls();
      const onResolved = vi.fn();
      media.watch(mediaReady$);
      media.resolve([attachment()], onResolved);
      await flush();
      const lookups = fake.callsTo('getCachedMediaObjectURL').length;
      onResolved.mockClear();

      mediaReady$.next({ urlKey: 'https://cdn.example.com/someone-else.mp3' });
      await flush();

      expect(fake.callsTo('getCachedMediaObjectURL').length).toBe(lookups);
      expect(onResolved).not.toHaveBeenCalled();
      media.dispose();
    });

    it('a download of this bubble\'s own file is looked up and repaints', async () => {
      online = false;
      const mediaReady$ = new Subject<unknown>();
      const media = new CachedMediaUrls();
      const onResolved = vi.fn();
      media.watch(mediaReady$);
      const a = attachment();
      media.resolve([a], onResolved);
      await flush();
      const lookups = fake.callsTo('getCachedMediaObjectURL').length;
      onResolved.mockClear();

      fake.cachedMedia.set(REMOTE, 'blob:mine');
      mediaReady$.next({ urlKey: REMOTE });
      await flush();

      expect(fake.callsTo('getCachedMediaObjectURL').length).toBeGreaterThan(lookups);
      expect(a.url).toBe('blob:mine');
      expect(onResolved).toHaveBeenCalled();
      media.dispose();
    });

    it("a signed attachment URL still matches the SDK's stripped key", async () => {
      // The SDK reports the URL with its query dropped (MediaCache.stripQuery), while the
      // attachment keeps the full presigned link. Comparing them raw never matched, so a
      // background download never reached the bubble.
      online = false;
      const signed = `${REMOTE}?X-Amz-Signature=abc123&X-Amz-Expires=900`;
      const mediaReady$ = new Subject<unknown>();
      const media = new CachedMediaUrls();
      const onResolved = vi.fn();
      media.watch(mediaReady$);
      const a = attachment(signed);
      media.resolve([a], onResolved);
      await flush();
      onResolved.mockClear();

      fake.cachedMedia.set(signed, 'blob:signed');
      mediaReady$.next({ urlKey: REMOTE });
      await flush();

      expect(a.url).toBe('blob:signed');
      expect(onResolved).toHaveBeenCalled();
      media.dispose();
    });

    it('a download event that reports no urlKey is retried, as before', async () => {
      online = false;
      const mediaReady$ = new Subject<unknown>();
      const media = new CachedMediaUrls();
      const a = attachment();
      media.watch(mediaReady$);
      media.resolve([a], vi.fn());
      await flush();

      fake.cachedMedia.set(REMOTE, 'blob:no-key');
      mediaReady$.next({});
      await flush();

      expect(a.url).toBe('blob:no-key');
      media.dispose();
    });
  });
});
