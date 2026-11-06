/**
 * Behavioural unit tests for CometChatFullScreenViewerComponent.
 *
 * The pre-existing suites in this folder either drive a hand-written stand-in class
 * (the *.property.spec.ts files re-implement navigation on a local mock) or boot the
 * component against a live SDK session, so the real component's lifecycle, keyboard,
 * Picture-in-Picture and download paths were never executed. These tests drive the
 * real component with the data layer replaced by mocks, so every guard runs.
 *
 * The viewer's own utils module is partially mocked: only the four helpers that reach
 * out of the page (XHR image download, anchor-based file download, and the two PIP
 * requests the browser will not grant in jsdom) are replaced. Everything else —
 * file-size formatting, aria labels, download-target resolution, body-scroll locking —
 * stays real so the component is measured against real collaborators.
 */
import { vi } from 'vitest';

// The calls SDK reaches for JitsiMeetJS, which jsdom does not provide.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

const viewerUtils = vi.hoisted(() => ({
  downloadImageWithRetry: vi.fn(),
  enterPip: vi.fn(),
  exitPip: vi.fn(),
  triggerMediaDownload: vi.fn(),
}));

vi.mock('./cometchat-fullscreen-viewer.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./cometchat-fullscreen-viewer.utils')>();
  return { ...actual, ...viewerUtils };
});

import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CometChatFullScreenViewerComponent } from './cometchat-fullscreen-viewer.component';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { FocusTrapService } from '../../../services/focus-trap.service';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../../utils/CometChatLogger';
import type { MediaAttachment } from '../../../modals/MediaAttachment';

describe('CometChatFullScreenViewerComponent (coverage)', () => {
  let fixture: ComponentFixture<CometChatFullScreenViewerComponent>;
  let component: CometChatFullScreenViewerComponent;
  let el: HTMLElement;
  let announcer: { announce: ReturnType<typeof vi.fn>; announceError: ReturnType<typeof vi.fn>; announceStatus: ReturnType<typeof vi.fn> };
  let focusTrap: { activate: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const tick = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  /** Replaces the translation lookup for the listed keys so announcements can be asserted exactly. */
  function stubTranslations(overrides: Record<string, string>): void {
    const original = CometChatLocalize.getLocalizedString.bind(CometChatLocalize);
    vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) =>
      Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : original(key)
    );
  }

  function definePipSupport(enabled: boolean): void {
    Object.defineProperty(document, 'pictureInPictureEnabled', {
      value: enabled,
      configurable: true,
      writable: true,
    });
  }

  function clearPipGlobals(): void {
    delete (document as unknown as Record<string, unknown>)['pictureInPictureEnabled'];
    delete (document as unknown as Record<string, unknown>)['pictureInPictureElement'];
    delete (document as unknown as Record<string, unknown>)['exitPictureInPicture'];
  }

  function imageAttachment(name?: string): MediaAttachment {
    return { url: `https://cdn.example.com/${name ?? 'anon'}`, type: 'image', ...(name ? { name } : {}) };
  }

  function videoAttachment(name: string): MediaAttachment {
    return { url: `https://cdn.example.com/${name}`, type: 'video', name };
  }

  /** A stand-in for a @ViewChild video that records pause/seek without jsdom's unimplemented media stack. */
  function fakeVideo(currentTime = 7) {
    return {
      currentTime,
      duration: NaN,
      paused: true,
      play: vi.fn(),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  }

  /**
   * Angular refreshes view queries on every change-detection pass — and this TestBed runs change
   * detection on its own as soon as the zone goes stable — so a plain `component.viewerContainer = x`
   * is silently replaced before any 100ms lifecycle timer fires. An accessor pair pins the value for
   * the lifetime of the test.
   */
  function pinViewChild(name: 'viewerContainer' | 'closeButton' | 'videoElement', value: unknown): void {
    Object.defineProperty(component, name, {
      configurable: true,
      get: () => value,
      set: () => undefined,
    });
  }

  function attachContainer(withCloseButton: boolean): { container: HTMLDivElement; closeBtn: HTMLButtonElement } {
    const container = document.createElement('div');
    const closeBtn = document.createElement('button');
    container.appendChild(closeBtn);
    pinViewChild('viewerContainer', { nativeElement: container });
    pinViewChild('closeButton', withCloseButton ? { nativeElement: closeBtn } : undefined);
    return { container, closeBtn };
  }

  function openChange(previousValue: unknown, currentValue: unknown): SimpleChanges {
    return { isOpen: new SimpleChange(previousValue, currentValue, false) };
  }

  /** jsdom's HTMLMediaElement has no working clock; give the element writable playback state. */
  function patchVideo(
    video: HTMLVideoElement,
    opts: { duration?: number; paused?: boolean; currentTime?: number } = {}
  ): { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> } {
    const play = vi.fn();
    const pause = vi.fn();
    (video as any).play = play;
    (video as any).pause = pause;
    Object.defineProperty(video, 'currentTime', {
      value: opts.currentTime ?? 0,
      writable: true,
      configurable: true,
    });
    if (opts.duration !== undefined) {
      Object.defineProperty(video, 'duration', { value: opts.duration, configurable: true });
    }
    if (opts.paused !== undefined) {
      Object.defineProperty(video, 'paused', { value: opts.paused, configurable: true });
    }
    return { play, pause };
  }

  /** Renders single-media video mode so the real #videoElement view query resolves. */
  async function renderSingleVideo(opts: { duration?: number; paused?: boolean; currentTime?: number } = {}) {
    component.mediaType = 'video';
    component.url = 'https://cdn.example.com/clip.mp4';
    fixture.detectChanges();
    await tick(230); // let ngAfterViewInit's focus + PIP-listener timers run
    const video = component.videoElement!.nativeElement;
    const spies = patchVideo(video, opts);
    return { video, ...spies };
  }

  // ── Setup ─────────────────────────────────────────────────────────────────

  beforeEach(async () => {
    viewerUtils.downloadImageWithRetry.mockReset();
    viewerUtils.triggerMediaDownload.mockReset();
    viewerUtils.enterPip.mockReset();
    viewerUtils.enterPip.mockResolvedValue(true);
    viewerUtils.exitPip.mockReset();
    viewerUtils.exitPip.mockResolvedValue(undefined);

    announcer = { announce: vi.fn(), announceError: vi.fn(), announceStatus: vi.fn() };
    focusTrap = { activate: vi.fn(), deactivate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CometChatFullScreenViewerComponent],
      providers: [
        { provide: LiveAnnouncerService, useValue: announcer },
        { provide: FocusTrapService, useValue: focusTrap },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatFullScreenViewerComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    fixture.destroy();
    clearPipGlobals();
    document.body.style.overflow = '';
    vi.restoreAllMocks();
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('reports PIP support when the document advertises it', () => {
      definePipSupport(true);

      component.ngOnInit();

      expect(component.isPipSupported).toBe(true);
    });

    it('reports no PIP support when the document advertises the API but has it disabled', () => {
      definePipSupport(false);

      component.ngOnInit();

      expect(component.isPipSupported).toBe(false);
    });

    it('reports no PIP support when the document has no PIP API at all', () => {
      clearPipGlobals();

      component.ngOnInit();

      expect(component.isPipSupported).toBe(false);
    });

    it('clamps a startIndex past the end of the gallery onto the last attachment', () => {
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png'), imageAttachment('c.png')];
      component.startIndex = 7;

      component.ngOnInit();

      expect(component.currentIndex).toBe(2);
    });

    it('clamps a negative startIndex onto the first attachment', () => {
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      component.startIndex = -4;

      component.ngOnInit();

      expect(component.currentIndex).toBe(0);
    });

    it('shows a single image url immediately instead of waiting for a download', () => {
      component.url = 'https://cdn.example.com/photo.png';
      component.mediaType = 'image';

      component.ngOnInit();

      expect(component.image).toBe('https://cdn.example.com/photo.png');
      expect(component.isDownloading).toBe(false);
      expect(component.progress).toBe(100);
    });

    it('does not preload a non-image url into the image slot', () => {
      component.url = 'https://cdn.example.com/clip.mp4';
      component.mediaType = 'video';

      component.ngOnInit();

      expect(component.image).toBeUndefined();
      expect(component.progress).toBe(100);
    });

    it('leaves progress at zero when no url was bound', () => {
      component.ngOnInit();

      expect(component.isDownloading).toBe(false);
      expect(component.progress).toBe(0);
      expect(component.image).toBeUndefined();
    });
  });

  // ── ngOnChanges: opening ──────────────────────────────────────────────────

  describe('ngOnChanges when the viewer opens', () => {
    it('locks body scroll, remembers the trigger element and traps focus on the close button', async () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();
      document.body.style.overflow = 'scroll';
      const { container, closeBtn } = attachContainer(true);

      component.ngOnChanges(openChange(false, true));

      expect(document.body.style.overflow).toBe('hidden');
      expect((component as any).previouslyFocusedElement).toBe(trigger);
      expect((component as any).originalBodyOverflow).toBe('scroll');
      expect(focusTrap.activate).not.toHaveBeenCalled();

      await tick(160);

      expect(focusTrap.activate).toHaveBeenCalledWith({
        container,
        initialFocus: closeBtn,
        returnFocusOnDeactivate: true,
      });
      trigger.remove();
    });

    it('asks the focus trap for the first focusable element when the close button has not rendered', async () => {
      const { container } = attachContainer(false);

      component.ngOnChanges(openChange(false, true));
      await tick(160);

      expect(focusTrap.activate).toHaveBeenCalledWith({
        container,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });
    });

    it('does not activate a focus trap when the container has not rendered', async () => {
      pinViewChild('viewerContainer', undefined);

      component.ngOnChanges(openChange(false, true));
      await tick(160);

      expect(focusTrap.activate).not.toHaveBeenCalled();
    });

    it('announces the gallery position shortly after opening in gallery mode', async () => {
      stubTranslations({ accessibility_gallery_position: 'Image {current} of {total}' });
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      fixture.detectChanges(); // ngOnInit re-derives currentIndex from startIndex, so move after it
      component.currentIndex = 1;

      component.ngOnChanges(openChange(false, true));
      await tick(160);

      expect(announcer.announce).toHaveBeenCalledWith('Image 2 of 2', 'polite');
    });

    it('makes only the viewer announcement when opening a single attachment', async () => {
      stubTranslations({ message_list_full_screen_viewer: 'Image viewer' });
      component.mediaType = 'image';

      component.ngOnChanges(openChange(false, true));
      await tick(160);

      expect(announcer.announce).toHaveBeenCalledTimes(1);
      expect(announcer.announce).toHaveBeenCalledWith('Image viewer', 'polite');
    });

    it('ignores an isOpen change that was already open', () => {
      document.body.style.overflow = 'auto';

      component.ngOnChanges(openChange(true, true));

      expect(document.body.style.overflow).toBe('auto');
      expect(announcer.announce).not.toHaveBeenCalled();
    });
  });

  // ── ngOnChanges: closing ──────────────────────────────────────────────────

  describe('ngOnChanges when the viewer closes', () => {
    it('restores the original body overflow and releases the focus trap', () => {
      const { container } = attachContainer(true);
      (component as any).originalBodyOverflow = 'scroll';
      document.body.style.overflow = 'hidden';

      component.ngOnChanges(openChange(true, false));

      expect(document.body.style.overflow).toBe('scroll');
      expect(focusTrap.deactivate).toHaveBeenCalledWith(container);
    });

    it('restores body overflow even when the container has already gone', () => {
      (component as any).originalBodyOverflow = '';
      document.body.style.overflow = 'hidden';

      component.ngOnChanges(openChange(true, false));

      expect(document.body.style.overflow).toBe('');
      expect(focusTrap.deactivate).not.toHaveBeenCalled();
    });

    it('ignores an isOpen change that was never open', () => {
      attachContainer(true);
      document.body.style.overflow = 'hidden';

      component.ngOnChanges(openChange(undefined, false));

      expect(document.body.style.overflow).toBe('hidden');
      expect(focusTrap.deactivate).not.toHaveBeenCalled();
    });
  });

  // ── ngOnChanges: startIndex ───────────────────────────────────────────────

  describe('ngOnChanges for startIndex', () => {
    beforeEach(() => {
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png'), imageAttachment('c.png')];
    });

    it('navigates to a startIndex that changes after the first binding', () => {
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.ngOnChanges({ startIndex: new SimpleChange(0, 2, false) });

      expect(component.currentIndex).toBe(2);
      expect(emitted).toEqual([2]);
    });

    it('ignores the very first startIndex binding, which ngOnInit already applied', () => {
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.ngOnChanges({ startIndex: new SimpleChange(undefined, 2, true) });

      expect(component.currentIndex).toBe(0);
      expect(emitted).toEqual([]);
    });

    it('ignores a startIndex change outside gallery mode', () => {
      component.attachments = [];
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.ngOnChanges({ startIndex: new SimpleChange(0, 1, false) });

      expect(component.currentIndex).toBe(0);
      expect(emitted).toEqual([]);
    });

    it('ignores a startIndex that is out of range, negative, or not a number', () => {
      component.currentIndex = 1;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.ngOnChanges({ startIndex: new SimpleChange(1, 5, false) });
      expect(component.currentIndex).toBe(1);

      component.ngOnChanges({ startIndex: new SimpleChange(1, -1, false) });
      expect(component.currentIndex).toBe(1);

      component.ngOnChanges({ startIndex: new SimpleChange(1, '2' as unknown as number, false) });
      expect(component.currentIndex).toBe(1);

      expect(emitted).toEqual([]);
    });
  });

  // ── ngOnChanges: attachments ──────────────────────────────────────────────

  describe('ngOnChanges for attachments', () => {
    it('falls back to the first attachment when the list shrinks past the current index', () => {
      const previous = [imageAttachment('a.png'), imageAttachment('b.png'), imageAttachment('c.png')];
      component.attachments = previous;
      fixture.detectChanges();
      component.currentIndex = 2;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      const next = [imageAttachment('a.png')];
      component.attachments = next;
      component.ngOnChanges({ attachments: new SimpleChange(previous, next, false) });

      expect(component.currentIndex).toBe(0);
      expect(emitted).toEqual([0]);
    });

    it('keeps the current index when the replacement list still contains it', () => {
      const previous = [imageAttachment('a.png'), imageAttachment('b.png')];
      component.attachments = previous;
      fixture.detectChanges();
      component.currentIndex = 1;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      const next = [imageAttachment('x.png'), imageAttachment('y.png'), imageAttachment('z.png')];
      component.attachments = next;
      component.ngOnChanges({ attachments: new SimpleChange(previous, next, false) });

      expect(component.currentIndex).toBe(1);
      expect(emitted).toEqual([]);
    });

    it('ignores an attachments value that is not an array', () => {
      const previous = [imageAttachment('a.png'), imageAttachment('b.png'), imageAttachment('c.png')];
      component.attachments = previous;
      component.currentIndex = 2;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.ngOnChanges({ attachments: new SimpleChange(previous, null, false) });

      expect(component.currentIndex).toBe(2);
      expect(emitted).toEqual([]);
    });

    it('ignores the very first attachments binding', () => {
      const next = [imageAttachment('a.png')];
      component.attachments = next;
      component.currentIndex = 2;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.ngOnChanges({ attachments: new SimpleChange(undefined, next, true) });

      expect(component.currentIndex).toBe(2);
      expect(emitted).toEqual([]);
    });
  });

  // ── ngAfterViewInit ───────────────────────────────────────────────────────

  describe('ngAfterViewInit', () => {
    it('traps focus on the first focusable element and announces the gallery position when already open', async () => {
      stubTranslations({ accessibility_gallery_position: 'Image {current} of {total}' });
      component.isOpen = true;
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      const { container } = attachContainer(false);

      fixture.detectChanges(); // the first pass runs ngAfterViewInit
      await tick(160);

      expect(focusTrap.activate).toHaveBeenCalledWith({
        container,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });
      expect(announcer.announce).toHaveBeenCalledWith('Image 1 of 2', 'polite');
    });

    it('does not trap focus while the viewer is closed', async () => {
      component.isOpen = false;
      attachContainer(true);

      fixture.detectChanges();
      await tick(260);

      expect(focusTrap.activate).not.toHaveBeenCalled();
      expect(announcer.announce).not.toHaveBeenCalled();
    });

  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('exits PIP, rewinds the video, releases the focus trap and restores body scroll', () => {
      const container = document.createElement('div');
      pinViewChild('viewerContainer', { nativeElement: container });
      const video = fakeVideo(12);
      pinViewChild('videoElement', { nativeElement: video });
      (component as any).originalBodyOverflow = 'scroll';
      document.body.style.overflow = 'hidden';
      component.isPipMode = true;

      component.ngOnDestroy();

      expect(viewerUtils.exitPip).toHaveBeenCalledTimes(1);
      expect(video.pause).toHaveBeenCalledTimes(1);
      expect(video.currentTime).toBe(0);
      expect(focusTrap.deactivate).toHaveBeenCalledWith(container);
      expect(document.body.style.overflow).toBe('scroll');
    });

    it('does not try to exit PIP when it was never entered', () => {
      const video = fakeVideo(4);
      pinViewChild('videoElement', { nativeElement: video });
      component.isPipMode = false;

      component.ngOnDestroy();

      expect(viewerUtils.exitPip).not.toHaveBeenCalled();
      expect(video.pause).toHaveBeenCalledTimes(1);
    });
  });

  // ── Legacy image download ─────────────────────────────────────────────────

  describe('downloadImage', () => {
    it('tracks progress, swaps in the decoded object url, and falls back to the source url on failure', () => {
      component.isDownloading = true;

      component.downloadImage('https://cdn.example.com/photo.jpg');

      expect(viewerUtils.downloadImageWithRetry).toHaveBeenCalledTimes(1);
      const [url, onProgress, onSuccess, onFallback, attemptCount] =
        viewerUtils.downloadImageWithRetry.mock.calls[0] as [
          string,
          (p: number) => void,
          (objectUrl: string) => void,
          (url: string) => void,
          number
        ];
      expect(url).toBe('https://cdn.example.com/photo.jpg');
      expect(attemptCount).toBe(0);

      onProgress(37);
      expect(component.progress).toBe(37);
      expect(component.isDownloading).toBe(true);

      onSuccess('blob:decoded-image');
      expect(component.image).toBe('blob:decoded-image');
      expect(component.isDownloading).toBe(false);

      component.isDownloading = true;
      onFallback('https://cdn.example.com/photo.jpg');
      expect(component.image).toBe('https://cdn.example.com/photo.jpg');
      expect(component.isDownloading).toBe(false);
    });

    it('forwards an explicit retry count so a retry does not restart the attempt budget', () => {
      component.downloadImage('https://cdn.example.com/photo.jpg');
      expect(viewerUtils.downloadImageWithRetry.mock.calls[0][4]).toBe(0);

      component.downloadImage('https://cdn.example.com/photo.jpg', 3);
      expect(viewerUtils.downloadImageWithRetry.mock.calls[1][4]).toBe(3);
    });
  });

  // ── close ─────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('exits PIP, rewinds the video, releases the trap, restores scroll and emits closeClick', () => {
      const container = document.createElement('div');
      pinViewChild('viewerContainer', { nativeElement: container });
      const video = fakeVideo(9);
      pinViewChild('videoElement', { nativeElement: video });
      (component as any).originalBodyOverflow = 'auto';
      document.body.style.overflow = 'hidden';
      component.isPipMode = true;
      let closed = 0;
      component.closeClick.subscribe(() => closed++);

      component.close();

      expect(viewerUtils.exitPip).toHaveBeenCalledTimes(1);
      expect(video.pause).toHaveBeenCalledTimes(1);
      expect(video.currentTime).toBe(0);
      expect(focusTrap.deactivate).toHaveBeenCalledWith(container);
      expect(document.body.style.overflow).toBe('auto');
      expect(closed).toBe(1);
    });

    it('leaves the PIP window playing when asked to keep it alive', () => {
      const video = fakeVideo(9);
      pinViewChild('videoElement', { nativeElement: video });
      component.isPipMode = true;
      let closed = 0;
      component.closeClick.subscribe(() => closed++);

      component.close(true);

      expect(viewerUtils.exitPip).not.toHaveBeenCalled();
      expect(video.pause).not.toHaveBeenCalled();
      expect(video.currentTime).toBe(9);
      expect(focusTrap.deactivate).not.toHaveBeenCalled();
      expect(closed).toBe(1);
    });

    it('still rewinds the video when PIP was requested but is not active', () => {
      const video = fakeVideo(9);
      pinViewChild('videoElement', { nativeElement: video });
      component.isPipMode = false;

      component.close(true);

      expect(video.pause).toHaveBeenCalledTimes(1);
      expect(video.currentTime).toBe(0);
    });

    it('returns focus to the element that opened the viewer, after the close has been emitted', async () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      const focusSpy = vi.spyOn(trigger, 'focus');
      (component as any).previouslyFocusedElement = trigger;

      component.close();

      expect(focusSpy).not.toHaveBeenCalled();
      await tick(10);
      expect(focusSpy).toHaveBeenCalledTimes(1);
      trigger.remove();
    });

    it('closes cleanly without deferring a focus call when the remembered element can no longer take focus', async () => {
      // A detached reference whose `focus` is no longer callable: counting reads of the property
      // separates the guard's single typeof check from an actual (throwing) deferred invocation.
      let focusReads = 0;
      const stale = {
        get focus() {
          focusReads++;
          return 'detached';
        },
      };
      (component as any).previouslyFocusedElement = stale as unknown as HTMLElement;
      let closed = 0;
      component.closeClick.subscribe(() => closed++);

      component.close();
      await tick(10);

      expect(closed).toBe(1);
      expect(focusReads).toBe(1);
    });
  });

  describe('close affordances', () => {
    it('closes on click and on Enter or Space, and swallows the event so the backdrop does not also react', () => {
      let closed = 0;
      component.closeClick.subscribe(() => closed++);

      const click = new MouseEvent('click');
      const clickStop = vi.spyOn(click, 'stopPropagation');
      component.handleCloseClick(click);
      expect(clickStop).toHaveBeenCalledTimes(1);
      expect(closed).toBe(1);

      const enter = new KeyboardEvent('keydown', { key: 'Enter' });
      const enterPrevent = vi.spyOn(enter, 'preventDefault');
      component.handleCloseKeydown(enter);
      expect(enterPrevent).toHaveBeenCalledTimes(1);
      expect(closed).toBe(2);

      component.handleCloseKeydown(new KeyboardEvent('keydown', { key: ' ' }));
      expect(closed).toBe(3);

      component.handleCloseKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(closed).toBe(3);
    });
  });

  // ── Document keyboard handling ────────────────────────────────────────────

  describe('handleDocumentKeydown', () => {
    it('ignores every key while the viewer is closed', () => {
      component.isOpen = false;
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      let closed = 0;
      component.closeClick.subscribe(() => closed++);

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(closed).toBe(0);
      expect(component.currentIndex).toBe(0);
    });

    it('closes on Escape and consumes the key', () => {
      component.isOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const prevent = vi.spyOn(event, 'preventDefault');
      let closed = 0;
      component.closeClick.subscribe(() => closed++);

      component.handleDocumentKeydown(event);

      expect(prevent).toHaveBeenCalledTimes(1);
      expect(closed).toBe(1);
    });

    it('ignores an unrelated key in single-image mode', () => {
      component.isOpen = true;
      component.mediaType = 'image';
      component.url = 'https://cdn.example.com/photo.png';
      fixture.detectChanges();
      let closed = 0;
      component.closeClick.subscribe(() => closed++);

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));

      expect(closed).toBe(0);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('plays a paused video on Space and announces the new state', async () => {
      stubTranslations({ audio_bubble_play: 'Playing' });
      component.isOpen = true;
      const { play } = await renderSingleVideo({ paused: true, duration: 60 });

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: ' ' }));

      expect(play).toHaveBeenCalledTimes(1);
      expect(announcer.announce).toHaveBeenCalledWith('Playing', 'polite');
    });

    it('pauses a playing video on Space and announces the new state', async () => {
      stubTranslations({ audio_bubble_pause: 'Paused' });
      component.isOpen = true;
      const { pause } = await renderSingleVideo({ paused: false, duration: 60 });

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: ' ' }));

      expect(pause).toHaveBeenCalledTimes(1);
      expect(announcer.announce).toHaveBeenCalledWith('Paused', 'polite');
    });

    it('seeks forward five seconds on ArrowRight and announces the new position', async () => {
      component.isOpen = true;
      const { video } = await renderSingleVideo({ duration: 120, currentTime: 10, paused: false });

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(video.currentTime).toBe(15);
      // Pinned literally: formatTimeForAnnouncement just forwards to formatDuration(_, 'long'),
      // so asserting that call back would restate the implementation instead of the spoken text.
      expect(announcer.announce).toHaveBeenCalledWith('15 seconds', 'polite');
    });

    it('seeks backward five seconds on ArrowLeft', async () => {
      component.isOpen = true;
      const { video } = await renderSingleVideo({ duration: 120, currentTime: 30, paused: false });

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

      expect(video.currentTime).toBe(25);
    });

    it('jumps to the reported end on End', async () => {
      component.isOpen = true;
      const { video } = await renderSingleVideo({ duration: 90, currentTime: 10, paused: false });

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'End' }));

      expect(video.currentTime).toBe(90);
    });

    it('treats a video that has not reported a duration as zero length', async () => {
      component.isOpen = true;
      // jsdom leaves duration as NaN; the component substitutes 0, so a forward seek clamps to the start.
      const { video } = await renderSingleVideo({ currentTime: 10, paused: false });

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(video.currentTime).toBe(0);
    });

    it('does nothing for a media key the controls service declines to act on', async () => {
      component.isOpen = true;
      const { video, play, pause } = await renderSingleVideo({ duration: 60, currentTime: 20, paused: false });
      (component as any).mediaControlsService = {
        handleKeyDown: vi.fn().mockReturnValue({ action: 'none' }),
        formatTimeForAnnouncement: vi.fn().mockReturnValue('unused'),
      };
      announcer.announce.mockClear();

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'Home' }));

      expect(play).not.toHaveBeenCalled();
      expect(pause).not.toHaveBeenCalled();
      expect(video.currentTime).toBe(20);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('skips the media shortcuts when no video element is rendered', async () => {
      component.isOpen = true;
      component.mediaType = 'video';
      component.url = ''; // the template only renders <video> when there is a source
      fixture.detectChanges();
      await tick(230);

      expect(component.videoElement).toBeUndefined();

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: ' ' }));

      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('skips the media shortcuts once the video has failed to load', async () => {
      component.isOpen = true;
      const { video, play } = await renderSingleVideo({ duration: 60, currentTime: 5, paused: true });
      component.videoError = true;

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(play).not.toHaveBeenCalled();
      expect(video.currentTime).toBe(5);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('falls through to gallery handling for a key outside the media shortcut set', async () => {
      component.isOpen = true;
      component.attachments = [videoAttachment('a.mp4'), videoAttachment('b.mp4')];
      fixture.detectChanges();
      await tick(230);
      patchVideo(component.videoElement!.nativeElement, { duration: 60, currentTime: 3 });
      announcer.announce.mockClear(); // the open-gallery announcement already fired in ngAfterViewInit

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'm' }));

      expect(component.currentIndex).toBe(0);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('seeks the gallery video instead of navigating when the arrow key reaches a video', async () => {
      component.isOpen = true;
      component.attachments = [videoAttachment('a.mp4'), videoAttachment('b.mp4')];
      fixture.detectChanges();
      await tick(230);
      const video = component.videoElement!.nativeElement;
      patchVideo(video, { duration: 100, currentTime: 10, paused: false });

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(video.currentTime).toBe(15);
      expect(component.currentIndex).toBe(0);
    });

    it('moves through an image gallery with the arrow keys', () => {
      component.isOpen = true;
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png'), imageAttachment('c.png')];
      fixture.detectChanges();
      component.currentIndex = 1;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      const right = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const rightPrevent = vi.spyOn(right, 'preventDefault');
      component.handleDocumentKeydown(right);
      expect(component.currentIndex).toBe(2);
      expect(rightPrevent).toHaveBeenCalledTimes(1);

      const left = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const leftPrevent = vi.spyOn(left, 'preventDefault');
      component.handleDocumentKeydown(left);
      expect(component.currentIndex).toBe(1);
      expect(leftPrevent).toHaveBeenCalledTimes(1);

      expect(emitted).toEqual([2, 1]);
    });

    it('does not run past either end of an image gallery', () => {
      component.isOpen = true;
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      fixture.detectChanges();
      component.currentIndex = 1;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(component.currentIndex).toBe(1);

      component.currentIndex = 0;
      fixture.detectChanges();
      component.handleDocumentKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(component.currentIndex).toBe(0);

      expect(emitted).toEqual([]);
    });

    it('leaves the host keydown binding inert so the document handler stays the only key path', () => {
      // Dispatched on the host element and deliberately non-bubbling: the real @HostListener
      // ('keydown') runs while the document-level listener cannot see the event. Anything that
      // starts handling keys on the host — a second Escape path, host-level gallery arrows —
      // would be caught here as a double-handling regression.
      component.isOpen = true;
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      fixture.detectChanges();
      let closed = 0;
      component.closeClick.subscribe(() => closed++);
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));
      announcer.announce.mockClear();

      for (const key of ['Escape', 'ArrowRight', 'ArrowLeft', ' ']) {
        el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: false }));
      }

      expect(closed).toBe(0);
      expect(component.currentIndex).toBe(0);
      expect(emitted).toEqual([]);
      expect(announcer.announce).not.toHaveBeenCalled();
      expect(focusTrap.deactivate).not.toHaveBeenCalled();
    });
  });

  // ── Media error states ────────────────────────────────────────────────────

  describe('media error states', () => {
    it('replaces the video with the error state after a load failure', async () => {
      await renderSingleVideo();
      expect(el.querySelector('.cometchat-fullscreen-viewer__body-video')).not.toBeNull();

      component.handleVideoError();
      fixture.detectChanges();

      expect(component.videoError).toBe(true);
      expect(el.querySelector('.cometchat-fullscreen-viewer__error-state')).not.toBeNull();
      expect(el.querySelector('.cometchat-fullscreen-viewer__body-video')).toBeNull();
    });

    it('replaces the image with the no-preview state after a load failure', () => {
      component.mediaType = 'image';
      component.url = 'https://cdn.example.com/expired.png';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-fullscreen-viewer__body-image')).not.toBeNull();

      component.handleImageError();
      fixture.detectChanges();

      expect(component.imageError).toBe(true);
      expect(el.querySelector('.cometchat-fullscreen-viewer__no-preview')).not.toBeNull();
      expect(el.querySelector('.cometchat-fullscreen-viewer__body-image')).toBeNull();
    });
  });

  // ── Getters ───────────────────────────────────────────────────────────────

  describe('header getters', () => {
    function messageStub(opts: { name?: string; avatar?: string; sentAt?: number }): any {
      const sender = { getName: () => opts.name ?? '', getAvatar: () => opts.avatar ?? '' };
      const message: Record<string, unknown> = { getSender: () => sender };
      if (opts.sentAt !== undefined) {
        message['getSentAt'] = () => opts.sentAt;
      }
      return message;
    }

    it('formats the message timestamp with the viewer "date at time" format, and returns empty without a message', () => {
      // Asserting against formatDate(sentAt, getDateFormat()) would only restate the
      // implementation. Instead: stub the separator word to a token that cannot occur in a
      // date, so the rendered string proves the viewer's own pattern reached formatDate and
      // kept its time half — the exact regression the getDateFormat comment describes.
      stubTranslations({ full_screen_viewer_at: '@@' });
      component.message = messageStub({ name: 'Alice', sentAt: 1700000000 });

      const formatted = component.formattedDate;

      expect(formatted).toContain('@@');
      expect(formatted).toMatch(/@@\s*\d/); // a time follows the separator
      expect(formatted).toMatch(/\d.*@@/); // a date precedes it

      component.message = undefined;
      expect(component.formattedDate).toBe('');
    });

    it('returns an empty date for a message object that cannot report a sent time', () => {
      component.message = messageStub({ name: 'Alice' });

      expect(component.formattedDate).toBe('');
    });

    it('shows sender info from the message when neither explicit sender input is bound', () => {
      component.message = messageStub({ name: 'Alice', avatar: '' });
      expect(component.senderName).toBe('Alice');
      expect(component.showSenderInfo).toBe(true);

      component.message = messageStub({ name: '', avatar: 'https://cdn.example.com/alice.png' });
      expect(component.senderAvatar).toBe('https://cdn.example.com/alice.png');
      expect(component.showSenderInfo).toBe(true);

      component.message = messageStub({ name: '', avatar: '' });
      expect(component.showSenderInfo).toBe(false);
    });

    it('prefers the explicit sender inputs over the message sender', () => {
      component.message = messageStub({ name: 'Alice', avatar: 'https://cdn.example.com/alice.png' });
      component.explicitSenderName = 'Bob';
      component.explicitSenderAvatarUrl = 'https://cdn.example.com/bob.png';

      expect(component.senderName).toBe('Bob');
      expect(component.senderAvatar).toBe('https://cdn.example.com/bob.png');
    });

    it('reports an empty name, size and extension for an unnamed gallery attachment', () => {
      component.fileName = 'single-mode-name.png';
      component.fileSize = 2048;
      component.attachments = [imageAttachment()];

      expect(component.currentFileName).toBe('');
      expect(component.currentFileExtension).toBe('');
      expect(component.currentFileSize).toBe('');
    });

    it('reports the single-media file details when there is no gallery', () => {
      component.fileName = 'report.PDF';
      component.fileSize = 2048;

      expect(component.currentFileName).toBe('report.PDF');
      expect(component.currentFileExtension).toBe('PDF');
      expect(component.currentFileSize).toBe('2.0 KB');
      expect(component.fileExtension).toBe('PDF');
      expect(component.formattedFileSize).toBe('2.0 KB');
    });

    it('scales the progress ring stroke with the reported progress', () => {
      component.progress = 0;
      expect(component.progressStrokeDasharray).toBe('0 113');

      component.progress = 113;
      const [dash, gap] = component.progressStrokeDasharray.split(' ');
      expect(Number(dash)).toBeCloseTo(100, 8);
      expect(gap).toBe('113');
    });
  });

  // ── Gallery navigation ────────────────────────────────────────────────────

  describe('gallery navigation', () => {
    it('refuses to move past the last or before the first attachment', () => {
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      fixture.detectChanges();
      component.currentIndex = 1;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.navigateNext();
      expect(component.currentIndex).toBe(1);

      component.currentIndex = 0;
      fixture.detectChanges();
      component.navigatePrev();
      expect(component.currentIndex).toBe(0);

      expect(emitted).toEqual([]);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('exits PIP, announces the new position and rewires the PIP listeners when moving forward', async () => {
      stubTranslations({ fullscreen_viewer_index: '{current} / {total}' });
      component.isOpen = true;
      component.attachments = [videoAttachment('a.mp4'), videoAttachment('b.mp4')];
      fixture.detectChanges();
      await tick(230);
      component.isPipMode = true;
      const states: boolean[] = [];
      component.pipStateChange.subscribe((v) => states.push(v));

      component.navigateNext();

      expect(viewerUtils.exitPip).toHaveBeenCalledTimes(1);
      expect(component.currentIndex).toBe(1);
      expect(announcer.announce).toHaveBeenCalledWith('2 / 2', 'polite');

      await tick(160);
      component.videoElement!.nativeElement.dispatchEvent(new Event('leavepictureinpicture'));

      expect(component.isPipMode).toBe(false);
      expect(states).toEqual([false]);
    });

    it('exits PIP, announces the new position and rewires the PIP listeners when moving back', async () => {
      stubTranslations({ fullscreen_viewer_index: '{current} / {total}' });
      component.isOpen = true;
      component.attachments = [videoAttachment('a.mp4'), videoAttachment('b.mp4')];
      fixture.detectChanges();
      component.currentIndex = 1;
      await tick(230);
      component.isPipMode = true;
      const states: boolean[] = [];
      component.pipStateChange.subscribe((v) => states.push(v));

      component.navigatePrev();

      expect(viewerUtils.exitPip).toHaveBeenCalledTimes(1);
      expect(component.currentIndex).toBe(0);
      expect(announcer.announce).toHaveBeenCalledWith('1 / 2', 'polite');

      await tick(160);
      component.videoElement!.nativeElement.dispatchEvent(new Event('enterpictureinpicture'));

      expect(component.isPipMode).toBe(true);
      expect(states).toEqual([true]);
    });

    it('jumps straight to an index without announcing a position, and rewires the PIP listeners', async () => {
      component.isOpen = true;
      component.attachments = [videoAttachment('a.mp4'), videoAttachment('b.mp4')];
      fixture.detectChanges();
      await tick(230);
      component.isPipMode = true;
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));
      const states: boolean[] = [];
      component.pipStateChange.subscribe((v) => states.push(v));
      announcer.announce.mockClear(); // the open-gallery announcement already fired in ngAfterViewInit

      component.navigateToIndex(1);

      expect(viewerUtils.exitPip).toHaveBeenCalledTimes(1);
      expect(component.currentIndex).toBe(1);
      expect(emitted).toEqual([1]);
      // navigateToIndex is the programmatic entry point; the announcement belongs to the arrow keys.
      expect(announcer.announce).not.toHaveBeenCalled();

      await tick(160);
      component.videoElement!.nativeElement.dispatchEvent(new Event('leavepictureinpicture'));

      expect(component.isPipMode).toBe(false);
      expect(states).toEqual([false]);
    });

    it('refuses an index outside the gallery and any index without a gallery', () => {
      component.attachments = [imageAttachment('a.png')];
      fixture.detectChanges();
      const emitted: number[] = [];
      component.indexChange.subscribe((v) => emitted.push(v));

      component.navigateToIndex(5);
      component.navigateToIndex(-1);
      expect(component.currentIndex).toBe(0);

      component.attachments = [];
      component.navigateToIndex(0);

      expect(emitted).toEqual([]);
    });

    it('clears a stale image error when the gallery moves to a different attachment', () => {
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      fixture.detectChanges();
      component.imageError = true;

      component.navigateNext();

      expect(component.imageError).toBe(false);
      expect(component.currentIndex).toBe(1);
    });

    it('exposes the current attachment only for an index inside the gallery', () => {
      const first = imageAttachment('a.png');
      component.attachments = [first];

      expect(component.currentAttachment).toBe(first);

      component.currentIndex = 4;
      expect(component.currentAttachment).toBeNull();

      component.currentIndex = -1;
      expect(component.currentAttachment).toBeNull();

      component.attachments = [];
      component.currentIndex = 0;
      expect(component.currentAttachment).toBeNull();
    });
  });

  // ── Gallery position announcement ─────────────────────────────────────────

  describe('gallery position announcement', () => {
    it('announces nothing when there are no attachments', () => {
      (component as any).announceGalleryPosition();

      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('falls back to a built-in position string when the localized template is missing', () => {
      stubTranslations({ accessibility_gallery_position: '' });
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png'), imageAttachment('c.png')];
      component.currentIndex = 2;

      (component as any).announceGalleryPosition();

      expect(announcer.announce).toHaveBeenCalledWith('Image 3 of 3', 'polite');
    });

    it('renders the gallery counter label with the position substituted in', () => {
      stubTranslations({ fullscreen_viewer_index: '{current} of {total}' });
      component.attachments = [imageAttachment('a.png'), imageAttachment('b.png')];
      component.currentIndex = 1;

      expect(component.getGalleryPositionLabel()).toBe('2 of 2');
    });
  });

  // ── Download ──────────────────────────────────────────────────────────────

  describe('download', () => {
    it('downloads the current gallery attachment and emits it', () => {
      const attachment = imageAttachment('holiday.png');
      component.attachments = [attachment];
      const emitted: Array<MediaAttachment | string> = [];
      component.downloadClick.subscribe((v) => emitted.push(v));

      component.download();

      expect(viewerUtils.triggerMediaDownload).toHaveBeenCalledWith(attachment.url, 'holiday.png');
      expect(emitted).toEqual([attachment]);
    });

    it('downloads the single media url and emits the url', () => {
      component.url = 'https://cdn.example.com/clip.mp4';
      component.fileName = 'clip.mp4';
      const emitted: Array<MediaAttachment | string> = [];
      component.downloadClick.subscribe((v) => emitted.push(v));

      component.download();

      expect(viewerUtils.triggerMediaDownload).toHaveBeenCalledWith('https://cdn.example.com/clip.mp4', 'clip.mp4');
      expect(emitted).toEqual(['https://cdn.example.com/clip.mp4']);
    });

    it('warns and emits nothing when there is no media to download', () => {
      const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
      let emitted = 0;
      component.downloadClick.subscribe(() => emitted++);

      component.download();

      expect(warn).toHaveBeenCalledWith('CometChatFullscreenViewer', 'No media URL available for download');
      expect(viewerUtils.triggerMediaDownload).not.toHaveBeenCalled();
      expect(emitted).toBe(0);
    });
  });

  // ── Picture-in-Picture ────────────────────────────────────────────────────

  describe('showPipButton', () => {
    it('offers the PIP button only for a healthy video in a browser that supports it', () => {
      definePipSupport(true);
      component.mediaType = 'video';
      component.url = 'https://cdn.example.com/clip.mp4';
      component.ngOnInit();

      expect(component.showPipButton).toBe(true);

      component.videoError = true;
      expect(component.showPipButton).toBe(false);

      component.videoError = false;
      component.mediaType = 'image';
      expect(component.showPipButton).toBe(false);

      component.mediaType = 'video';
      component.enablePictureInPicture = false;
      expect(component.showPipButton).toBe(false);
    });

    it('offers the PIP button for a video attachment in gallery mode', () => {
      definePipSupport(true);
      component.attachments = [videoAttachment('a.mp4'), imageAttachment('b.png')];
      component.ngOnInit();

      expect(component.showPipButton).toBe(true);

      component.currentIndex = 1;
      expect(component.showPipButton).toBe(false);
    });
  });

  describe('enterPictureInPicture', () => {
    it('does nothing when the browser has no PIP support', async () => {
      component.isPipSupported = false;

      await component.enterPictureInPicture();

      expect(viewerUtils.enterPip).not.toHaveBeenCalled();
      expect(component.isPipMode).toBe(false);
    });

    it('enters PIP with the rendered video and publishes the new state', async () => {
      const { video } = await renderSingleVideo();
      component.isPipSupported = true;
      const states: boolean[] = [];
      component.pipStateChange.subscribe((v) => states.push(v));

      await component.enterPictureInPicture();

      expect(viewerUtils.enterPip).toHaveBeenCalledWith(video);
      expect(component.isPipMode).toBe(true);
      expect(states).toEqual([true]);
    });

    it('stays out of PIP mode when the browser refuses the request', async () => {
      viewerUtils.enterPip.mockResolvedValue(false);
      await renderSingleVideo();
      component.isPipSupported = true;
      const states: boolean[] = [];
      component.pipStateChange.subscribe((v) => states.push(v));

      await component.enterPictureInPicture();

      expect(component.isPipMode).toBe(false);
      expect(states).toEqual([]);
    });

    it('releases another PIP window before requesting its own', async () => {
      const exitSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(document, 'pictureInPictureElement', {
        value: document.createElement('video'),
        configurable: true,
      });
      Object.defineProperty(document, 'exitPictureInPicture', { value: exitSpy, configurable: true });
      await renderSingleVideo();
      component.isPipSupported = true;

      await component.enterPictureInPicture();

      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(viewerUtils.enterPip).toHaveBeenCalledTimes(1);
      expect(component.isPipMode).toBe(true);
    });

    it('still enters PIP when releasing the other PIP window fails', async () => {
      Object.defineProperty(document, 'pictureInPictureElement', {
        value: document.createElement('video'),
        configurable: true,
      });
      Object.defineProperty(document, 'exitPictureInPicture', {
        value: vi.fn().mockRejectedValue(new Error('still closing')),
        configurable: true,
      });
      await renderSingleVideo();
      component.isPipSupported = true;

      await component.enterPictureInPicture();

      expect(viewerUtils.enterPip).toHaveBeenCalledTimes(1);
      expect(component.isPipMode).toBe(true);
    });

    it('falls back to a video inside the container when the view query has not resolved', async () => {
      component.mediaType = 'image';
      component.url = 'https://cdn.example.com/photo.png';
      fixture.detectChanges();
      expect(component.videoElement).toBeUndefined();

      const container = document.createElement('div');
      const nested = document.createElement('video');
      container.appendChild(nested);
      (component as any).viewerContainer = { nativeElement: container };
      component.isPipSupported = true;

      await component.enterPictureInPicture();

      expect(viewerUtils.enterPip).toHaveBeenCalledWith(nested);
      expect(component.isPipMode).toBe(true);
    });

    it('gives up when there is no video anywhere in the view', async () => {
      component.isPipSupported = true;

      await component.enterPictureInPicture();

      expect(viewerUtils.enterPip).not.toHaveBeenCalled();
      expect(component.isPipMode).toBe(false);
    });
  });

  describe('exitPictureInPicture', () => {
    it('asks the browser to leave PIP but leaves the flag to the leavepictureinpicture event', async () => {
      component.isPipMode = true;
      const states: boolean[] = [];
      component.pipStateChange.subscribe((v) => states.push(v));

      await component.exitPictureInPicture();

      expect(viewerUtils.exitPip).toHaveBeenCalledTimes(1);
      expect(component.isPipMode).toBe(true);
      expect(states).toEqual([]);
    });
  });

  describe('togglePictureInPicture', () => {
    it('enters PIP when inactive and leaves it when active', async () => {
      await renderSingleVideo();
      component.isPipSupported = true;

      component.togglePictureInPicture();
      await tick(0);

      expect(viewerUtils.enterPip).toHaveBeenCalledTimes(1);
      expect(viewerUtils.exitPip).not.toHaveBeenCalled();

      component.isPipMode = true;
      component.togglePictureInPicture();
      await tick(0);

      expect(viewerUtils.exitPip).toHaveBeenCalledTimes(1);
      expect(viewerUtils.enterPip).toHaveBeenCalledTimes(1);
    });
  });

  describe('PIP event listeners', () => {
    it('tracks PIP enter and leave events and stops once the listeners are removed', async () => {
      const { video } = await renderSingleVideo();
      const states: boolean[] = [];
      component.pipStateChange.subscribe((v) => states.push(v));

      video.dispatchEvent(new Event('enterpictureinpicture'));
      expect(component.isPipMode).toBe(true);

      video.dispatchEvent(new Event('leavepictureinpicture'));
      expect(component.isPipMode).toBe(false);
      expect(states).toEqual([true, false]);

      (component as any).removePipEventListeners();

      expect((component as any).pipEnterListener).toBeNull();
      expect((component as any).pipLeaveListener).toBeNull();

      video.dispatchEvent(new Event('enterpictureinpicture'));

      expect(component.isPipMode).toBe(false);
      expect(states).toEqual([true, false]);
    });

    it('does nothing when asked to wire listeners with no video in the view', () => {
      (component as any).setupPipEventListeners();

      expect((component as any).pipEnterListener).toBeNull();
      expect((component as any).pipLeaveListener).toBeNull();
    });
  });

  describe('getPipButtonAriaLabel', () => {
    it('labels the button with the action it will perform', () => {
      stubTranslations({
        fullscreen_viewer_pip_enter: 'Enter picture in picture',
        fullscreen_viewer_pip_exit: 'Exit picture in picture',
      });

      expect(component.getPipButtonAriaLabel()).toBe('Enter picture in picture');

      component.isPipMode = true;
      expect(component.getPipButtonAriaLabel()).toBe('Exit picture in picture');
    });
  });

  // ── Date format ───────────────────────────────────────────────────────────

  describe('getDateFormat', () => {
    it('builds a "date at time" pattern for every calendar bucket', () => {
      stubTranslations({ full_screen_viewer_at: 'at' });

      const format = component.getDateFormat();

      expect(format.today).toContain('[at]');
      expect(format.today).toBe(format.yesterday);
      expect(format.today).toBe(format.otherDays);
    });

    it('lets an explicit per-instance format override the built-in pattern', () => {
      component.imageSentAtDateTimeFormat = { today: 'HH:mm' };

      const format = component.getDateFormat();

      expect(format.today).toBe('HH:mm');
      expect(format.otherDays).toContain(CometChatLocalize.getTimePattern());
    });

    it('lets an explicitly configured global calendar object override the pattern, but not a per-instance format', () => {
      // getCalendarObject() always returns a full object, so spreading it unconditionally used to
      // overwrite every key and cost the header its time. This pins the intended precedence chain:
      // built-in "date at time" pattern < global object < per-instance input.
      stubTranslations({ full_screen_viewer_at: 'at' });
      const localize = CometChatLocalize as unknown as Record<string, unknown>;
      const savedObject = localize['calendarObject'];
      const savedFlag = localize['customCalendarObjectSet'];
      try {
        CometChatLocalize.setGlobalCalendarObject({ today: 'GLOBAL_TODAY', otherDays: 'GLOBAL_OTHER' });

        const globalOnly = component.getDateFormat();
        expect(globalOnly.today).toBe('GLOBAL_TODAY');
        expect(globalOnly.otherDays).toBe('GLOBAL_OTHER');
        expect(globalOnly.today).not.toContain('[at]');

        component.imageSentAtDateTimeFormat = { today: 'INSTANCE_TODAY' };
        const withInstance = component.getDateFormat();
        expect(withInstance.today).toBe('INSTANCE_TODAY');
        expect(withInstance.otherDays).toBe('GLOBAL_OTHER');
      } finally {
        localize['calendarObject'] = savedObject;
        localize['customCalendarObjectSet'] = savedFlag;
      }
    });
  });

  // ── Alt text ──────────────────────────────────────────────────────────────

  describe('getMediaAltText', () => {
    it('describes a gallery video by its sender', () => {
      stubTranslations({ fullscreen_viewer_video_alt: 'Video from {sender}' });
      component.explicitSenderName = 'Alice';
      component.attachments = [videoAttachment('a.mp4')];

      expect(component.getMediaAltText()).toBe('Video from Alice');
    });

    it('describes single-media images by their sender and falls back to the filename for other types', () => {
      stubTranslations({ fullscreen_viewer_image_alt: 'Image from {sender}' });
      component.explicitSenderName = 'Alice';
      component.mediaType = 'image';

      expect(component.getMediaAltText()).toBe('Image from Alice');

      component.mediaType = 'file';
      component.fileName = 'notes.txt';
      expect(component.getMediaAltText()).toBe('notes.txt');
    });
  });
});
