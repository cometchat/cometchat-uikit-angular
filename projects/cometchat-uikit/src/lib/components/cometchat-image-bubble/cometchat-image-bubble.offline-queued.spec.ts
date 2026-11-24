vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CometChatFullScreenViewerComponent } from '../base-elements/cometchat-fullscreen-viewer/cometchat-fullscreen-viewer.component';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChatImageBubbleComponent } from './cometchat-image-bubble.component';
import { CometChatVideoBubbleComponent } from '../cometchat-video-bubble/cometchat-video-bubble.component';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { extractMediaAttachments } from '../../utils/media-bubble-utils';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const REMOTE = 'https://cdn.example.com/full.jpg';
const THUMB = 'https://cdn.example.com/thumb.jpg';

/** An own, still-queued media message: no URL yet, the SDK's `files` hold the bytes. */
function queuedMessage(type: 'image' | 'video', file: File): any {
  return {
    getAttachments: () => [{ url: '', getUrl: () => '', name: file.name }],
    files: [file],
    getText: () => '',
    getData: () => ({}),
    getSender: () => ({ getName: () => 'Me', getAvatar: () => '' }),
    getType: () => type,
    getId: () => 0,
  };
}

function sentImage(): any {
  return {
    getAttachments: () => [{ url: REMOTE, metadata: {} }],
    getMetadata: () => ({ '@injected': { extensions: { 'thumbnail-generation': { url_medium: THUMB } } } }),
    getText: () => '',
    getData: () => ({}),
    getSender: () => ({ getName: () => 'Me', getAvatar: () => '' }),
    getType: () => 'image',
    getId: () => 7,
  };
}

describe('queued own media is shown from the file the message holds (BEH-MEDIA-18)', () => {
  let fake: OfflineSdkFake;
  let created: string[];
  let revoked: string[];

  beforeEach(() => {
    fake = installOfflineSdk();
    created = [];
    revoked = [];
    (URL as any).createObjectURL = vi.fn(() => {
      const url = `blob:queued-${created.length}`;
      created.push(url);
      return url;
    });
    (URL as any).revokeObjectURL = vi.fn((url: string) => revoked.push(url));
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
    OfflineHub.resetForTests();
  });

  describe('image bubble', () => {
    let fixture: ComponentFixture<CometChatImageBubbleComponent>;
    const make = async (message: any) => {
      await TestBed.configureTestingModule({ imports: [CometChatImageBubbleComponent] }).compileComponents();
      fixture = TestBed.createComponent(CometChatImageBubbleComponent);
      fixture.componentRef.setInput('message', message);
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
    };
    const attachments = () => (fixture.componentInstance as any).attachments;

    it('uses an object URL of the queued file for the tile and the viewer, and revokes it on destroy', async () => {
      await make(queuedMessage('image', new File(['x'], 'a.jpg', { type: 'image/jpeg' })));
      expect(attachments()).toHaveLength(1);
      const live = created[created.length - 1];
      expect(attachments()[0].url).toBe(live);
      expect(attachments()[0].displayUrl).toBe(live);
      // The viewer is given the same attachments (its own copy of the list).
      (fixture.componentInstance as any).onImageClick(0);
      fixture.detectChanges();
      const viewer = fixture.debugElement.query(By.directive(CometChatFullScreenViewerComponent));
      expect(viewer).not.toBeNull();
      expect(viewer.componentInstance.attachments[0].url).toBe(live);
      expect(revoked).not.toContain(live);
      fixture.destroy();
      // Every object URL ever made is revoked, each exactly once.
      expect([...revoked].sort()).toEqual([...created].sort());
    });

    it('revokes the previous object URL when the message changes (it was sent)', async () => {
      await make(queuedMessage('image', new File(['x'], 'a.jpg', { type: 'image/jpeg' })));
      const live = created[created.length - 1];
      fixture.componentRef.setInput('message', sentImage());
      fixture.componentInstance.ngOnChanges({ message: {} as any });
      expect(revoked).toContain(live);
      expect([...revoked].sort()).toEqual([...created].sort());
      expect(attachments()[0].url).toBe(REMOTE);
    });

    it('a sent image is unchanged and creates no object URL', async () => {
      await make(sentImage());
      expect(created).toEqual([]);
      expect(attachments()[0].url).toBe(REMOTE);
    });

    it('with no file held (after a reload) there is nothing to preview and nothing breaks', async () => {
      const msg = queuedMessage('image', new File(['x'], 'a.jpg'));
      msg.files = undefined;
      await make(msg);
      expect(attachments()).toEqual([]);
      expect(created).toEqual([]);
    });

    it('offline OFF: the queued file is not read', async () => {
      fake.setEnabled(false);
      await make(queuedMessage('image', new File(['x'], 'a.jpg', { type: 'image/jpeg' })));
      expect(attachments()).toEqual([]);
      expect(created).toEqual([]);
    });
  });

  describe('video bubble', () => {
    it('plays the queued file from an object URL and revokes it on destroy', async () => {
      await TestBed.configureTestingModule({ imports: [CometChatVideoBubbleComponent] }).compileComponents();
      const fixture = TestBed.createComponent(CometChatVideoBubbleComponent);
      fixture.componentRef.setInput('message', queuedMessage('video', new File(['x'], 'a.mp4', { type: 'video/mp4' })));
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
      expect((fixture.componentInstance as any).attachments[0].url).toBe(created[created.length - 1]);
      fixture.destroy();
      expect([...revoked].sort()).toEqual([...created].sort());
    });
  });

  describe('extractMediaAttachments', () => {
    it('reads message.files when there is no attachment list at all', () => {
      const msg = { getAttachments: () => undefined, files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } as any;
      const out = extractMediaAttachments(msg, 'image', 'T');
      expect(out).toHaveLength(1);
      expect(out[0].url).toBe('');
      expect(out[0].file).toBeInstanceOf(Blob);
    });
    it('offline OFF: returns what it did before (url-less attachment skipped)', () => {
      fake.setEnabled(false);
      expect(extractMediaAttachments(queuedMessage('image', new File(['x'], 'a.jpg')), 'image', 'T')).toEqual([]);
    });
  });

  describe('thumbnail fallback', () => {
    let fixture: ComponentFixture<CometChatImageBubbleComponent>;
    const make = async () => {
      await TestBed.configureTestingModule({ imports: [CometChatImageBubbleComponent] }).compileComponents();
      fixture = TestBed.createComponent(CometChatImageBubbleComponent);
      fixture.componentRef.setInput('message', sentImage());
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
    };
    const a = () => (fixture.componentInstance as any).attachments[0];

    it('prefers the cached full image over the remote thumbnail', async () => {
      fake.cachedMedia.set(REMOTE, 'blob:full');
      await make();
      expect(a().url).toBe('blob:full');
      expect(a().displayUrl).toBe('blob:full');
    });

    it('falls back to the full image (cached blob when there is one) when the thumbnail fails', async () => {
      await make();
      vi.useFakeTimers();
      try {
        expect(a().displayUrl).toBe(THUMB);
        const c = fixture.componentInstance as any;
        c.onImageError(0); // first failure: retried
        vi.advanceTimersByTime(1000);
        c.onImageError(0); // retry failed: fall back to the full image
        expect(a().displayUrl).toBe(REMOTE);
        expect(c.errorIndices.has(0)).toBe(false);
        c.onImageError(0); // the full image fails too: now it is unsupported
        expect(c.errorIndices.has(0)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('offline OFF: a failed thumbnail still ends in the unsupported glyph, as today', async () => {
      fake.setEnabled(false);
      await make();
      vi.useFakeTimers();
      try {
        const c = fixture.componentInstance as any;
        c.onImageError(0);
        vi.advanceTimersByTime(1000);
        c.onImageError(0);
        expect(c.errorIndices.has(0)).toBe(true);
        expect(a().displayUrl).toBe(THUMB);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
