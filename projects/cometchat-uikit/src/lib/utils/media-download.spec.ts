/**
 * Tests for the shared media downloader.
 *
 * The behaviour under test is exactly the thing that breaks silently in production: a download
 * that "works" by navigating to the CDN URL instead of saving the file. These assertions pin the
 * blob detour, the simple-request shape of the fetch, and the tab fallback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerMediaDownload } from './media-download';

vi.mock('./CometChatLogger', () => ({
  CometChatLogger: { warn: vi.fn(), error: vi.fn(), log: vi.fn() },
}));

const CDN_URL = 'https://media-in.cometchat.io/photo.jpg?Expires=1&Signature=abc';

describe('triggerMediaDownload', () => {
  let clicked: HTMLAnchorElement[];
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    clicked = [];
    // Capture the anchor at click time — the element is removed from the DOM immediately after.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this.cloneNode(true) as HTMLAnchorElement);
    });
    createObjectURL = vi.fn(() => 'blob:mock-object-url');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when the media fetch succeeds', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, blob: async () => new Blob(['x']) })));
    });

    it('saves a same-origin blob URL rather than navigating to the CDN', async () => {
      await expect(triggerMediaDownload(CDN_URL, 'photo.jpg')).resolves.toBe('saved');

      expect(clicked).toHaveLength(1);
      expect(clicked[0].getAttribute('href')).toBe('blob:mock-object-url');
      expect(clicked[0].download).toBe('photo.jpg');
      // A target would turn the save into a navigation, which is the bug being prevented.
      expect(clicked[0].getAttribute('target')).toBeNull();
    });

    it('keeps the fetch a simple request — no headers, no credentials', async () => {
      await triggerMediaDownload(CDN_URL, 'photo.jpg');

      // A second argument is what makes the request preflighted; the CDN 403s the OPTIONS.
      expect(fetch).toHaveBeenCalledWith(CDN_URL);
      expect((fetch as any).mock.calls[0]).toHaveLength(1);
    });

    it('revokes the object URL only after the download has had time to start', async () => {
      await triggerMediaDownload(CDN_URL, 'photo.jpg');

      expect(revokeObjectURL).not.toHaveBeenCalled();
      vi.advanceTimersByTime(10_000);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-object-url');
    });
  });

  describe('when the media fetch fails', () => {
    it('falls back to opening the CDN URL in a new tab on a 403', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403, blob: async () => new Blob() })));

      await expect(triggerMediaDownload(CDN_URL, 'photo.jpg')).resolves.toBe('opened-in-new-tab');

      expect(clicked).toHaveLength(1);
      expect(clicked[0].getAttribute('href')).toBe(CDN_URL);
      expect(clicked[0].getAttribute('target')).toBe('_blank');
      expect(clicked[0].getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('falls back on a CORS/network rejection and never rejects itself', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));

      await expect(triggerMediaDownload(CDN_URL, 'photo.jpg')).resolves.toBe('opened-in-new-tab');
      expect(clicked[0].getAttribute('href')).toBe(CDN_URL);
    });
  });

});
