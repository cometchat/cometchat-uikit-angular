/**
 * What imageClick / videoClick hand to app code with offline on (README §3.8).
 *
 * With offline on, CachedMediaUrls.point() replaces attachment.url (and an
 * image's displayUrl) with an object URL this bubble owns and revokes when it
 * re-resolves or is destroyed. The click outputs must still carry the remote
 * attachment, or an app that saves or opens attachment.url is left with a
 * blob: URL that stops working (Prajwal 2026-11-20T13:00Z on #674).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChatImageBubbleComponent } from './cometchat-image-bubble.component';
import { CometChatVideoBubbleComponent } from '../cometchat-video-bubble/cometchat-video-bubble.component';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const REMOTE = 'https://cdn.example.com/full.jpg';
const THUMB = 'https://cdn.example.com/thumb.jpg';
const VIDEO = 'https://cdn.example.com/clip.mp4';
const CACHED = 'blob:cached-copy';

function sentImage(): any {
  return {
    getAttachments: () => [{ url: REMOTE, metadata: {} }],
    getMetadata: () => ({
      '@injected': { extensions: { 'thumbnail-generation': { url_medium: THUMB } } },
    }),
    getText: () => '',
    getData: () => ({}),
    getSender: () => ({ getName: () => 'Me', getAvatar: () => '' }),
    getType: () => 'image',
    getId: () => 7,
  };
}

function sentVideo(): any {
  return {
    getAttachments: () => [{ url: VIDEO, metadata: {} }],
    getMetadata: () => ({}),
    getText: () => '',
    getData: () => ({}),
    getSender: () => ({ getName: () => 'Me', getAvatar: () => '' }),
    getType: () => 'video',
    getId: () => 8,
  };
}

describe('media bubble click outputs with offline on', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk();
    (URL as any).revokeObjectURL = vi.fn();
    (URL as any).createObjectURL = vi.fn().mockReturnValue('blob:held');
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  describe('image bubble', () => {
    let fixture: ComponentFixture<CometChatImageBubbleComponent>;

    async function make(): Promise<void> {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({ imports: [CometChatImageBubbleComponent] }).compileComponents();
      fixture = TestBed.createComponent(CometChatImageBubbleComponent);
      fixture.componentRef.setInput('message', sentImage());
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
    }

    it('emits the remote attachment while rendering from the cached copy', async () => {
      fake.cachedMedia.set(REMOTE, CACHED);
      await make();
      const c = fixture.componentInstance as any;
      // The bubble renders from the cached copy.
      expect(c.attachments[0].url).toBe(CACHED);

      const emitted: any[] = [];
      fixture.componentInstance.imageClick.subscribe(e => emitted.push(e));
      c.onImageClick(0);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].attachment.url).toBe(REMOTE);
      expect(emitted[0].attachment.displayUrl).toBe(THUMB);
      expect(emitted[0].index).toBe(0);
      // Rendering is untouched by the emit.
      expect(c.attachments[0].url).toBe(CACHED);
    });

    it('emits the attachment unchanged when there is no cached copy', async () => {
      await make();
      const c = fixture.componentInstance as any;
      const emitted: any[] = [];
      fixture.componentInstance.imageClick.subscribe(e => emitted.push(e));
      c.onImageClick(0);
      expect(emitted[0].attachment.url).toBe(REMOTE);
    });

    it('checks the index before asking the SDK for a download', async () => {
      await make();
      const c = fixture.componentInstance as any;
      const requestDownload = vi.spyOn(c.offlineMedia, 'requestDownload');
      const emitted: any[] = [];
      fixture.componentInstance.imageClick.subscribe(e => emitted.push(e));

      c.onImageClick(5);
      c.onImageClick(-1);

      expect(requestDownload).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });
  });

  describe('video bubble', () => {
    let fixture: ComponentFixture<CometChatVideoBubbleComponent>;

    async function make(): Promise<void> {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({ imports: [CometChatVideoBubbleComponent] }).compileComponents();
      fixture = TestBed.createComponent(CometChatVideoBubbleComponent);
      fixture.componentRef.setInput('message', sentVideo());
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
    }

    it('emits the remote attachment while playing the cached copy', async () => {
      fake.cachedMedia.set(VIDEO, CACHED);
      await make();
      const c = fixture.componentInstance as any;
      expect(c.attachments[0].url).toBe(CACHED);

      const emitted: any[] = [];
      fixture.componentInstance.videoClick.subscribe(e => emitted.push(e));
      c.onVideoClick(0);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].attachment.url).toBe(VIDEO);
      expect(c.attachments[0].url).toBe(CACHED);
    });

    it('checks the index before asking the SDK for a download', async () => {
      await make();
      const c = fixture.componentInstance as any;
      const requestDownload = vi.spyOn(c.offlineMedia, 'requestDownload');
      const emitted: any[] = [];
      fixture.componentInstance.videoClick.subscribe(e => emitted.push(e));

      c.onVideoClick(9);

      expect(requestDownload).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });
  });
});
