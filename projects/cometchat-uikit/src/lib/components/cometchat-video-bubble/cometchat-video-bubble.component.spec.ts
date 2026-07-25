/**
 * CometChatVideoBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the video bubble component that
 * renders CometChat.MediaMessage objects with thumbnail display, play button
 * overlay, multi-video grid layouts, duration badges, and fullscreen viewer.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             Video URL Extraction, Play Button Click Events, Alignment CSS,
 *             Null/Missing URL Fallback, Layout Determination,
 *             Duration Formatting, Caption Extraction, ARIA/Accessibility,
 *             Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-video-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatVideoBubbleComponent } from './cometchat-video-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock video message object that mimics CometChat.MediaMessage
 * with the given number of attachments and optional caption.
 */
function createMockVideoMessage(
  attachmentCount: number,
  caption?: string,
  options?: { includeDuration?: boolean; senderName?: string; senderAvatar?: string }
): any {
  const attachments: any[] = [];
  const includeDuration = options?.includeDuration !== false;

  for (let i = 0; i < attachmentCount; i++) {
    attachments.push({
      url: `https://example.com/video${i + 1}.mp4`,
      thumbnail: `https://example.com/thumb${i + 1}.jpg`,
      metadata: {
        width: 1920,
        height: 1080,
        duration: includeDuration ? 125 + i * 10 : undefined,
        size: 2048576,
        mimeType: 'video/mp4',
      },
    });
  }

  return {
    getAttachments: () => attachments,
    getText: () => caption || '',
    getData: () => ({ text: caption || '' }),
    getSender: () => ({
      getName: () => options?.senderName || 'Test User',
      getAvatar: () => options?.senderAvatar || 'https://example.com/avatar.png',
    }),
    getReceiverType: () => 'user',
    getReceiver: () => 'superhero2',
    getType: () => 'video',
    getId: () => 99999,
  };
}

/**
 * Triggers change detection and waits for async operations to settle.
 */
async function initAndDetect(
  fixture: ComponentFixture<CometChatVideoBubbleComponent>
): Promise<void> {
  fixture.detectChanges();
  await Promise.resolve();
  await new Promise(r => setTimeout(r, 50));
  fixture.detectChanges();
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('CometChatVideoBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatVideoBubbleComponent>;
  let component: CometChatVideoBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatVideoBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatVideoBubbleComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture?.destroy();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      component.message = createMockVideoMessage(1);
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default alignment as left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should render the root .cometchat-video-bubble element', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-video-bubble')).toBeTruthy();
    });

    it('should expose MessageBubbleAlignment enum to template', () => {
      expect(component.MessageBubbleAlignment).toBeDefined();
      expect(component.MessageBubbleAlignment.left).toBe(MessageBubbleAlignment.left);
      expect(component.MessageBubbleAlignment.right).toBe(MessageBubbleAlignment.right);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a message input and extract attachments on init', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(2);
    });

    it('should reflect alignment input change to right', async () => {
      component.message = createMockVideoMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should update when message input changes via ngOnChanges', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(1);

      const newMessage = createMockVideoMessage(3);
      component.message = newMessage;
      component.ngOnChanges({
        message: {
          currentValue: newMessage,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();
      expect((component as any).attachments.length).toBe(3);
    });

    it('should update isOutgoing when alignment changes to right', async () => {
      component.message = createMockVideoMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);
      expect((component as any).isOutgoing).toBe(false);

      component.alignment = MessageBubbleAlignment.right;
      component.ngOnChanges({
        alignment: {
          currentValue: MessageBubbleAlignment.right,
          previousValue: MessageBubbleAlignment.left,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();
      expect((component as any).isOutgoing).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Video URL Extraction
  // ---------------------------------------------------------------------------
  describe('Video URL Extraction', () => {
    it('should extract single video URL from attachment', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      expect((component as any).attachments[0].url).toBe('https://example.com/video1.mp4');
    });

    it('should extract multiple video URLs', async () => {
      component.message = createMockVideoMessage(3);
      await initAndDetect(fixture);

      const attachments = (component as any).attachments;
      expect(attachments.length).toBe(3);
      expect(attachments[0].url).toBe('https://example.com/video1.mp4');
      expect(attachments[1].url).toBe('https://example.com/video2.mp4');
      expect(attachments[2].url).toBe('https://example.com/video3.mp4');
    });

    it('should extract thumbnail URL from attachment', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      expect((component as any).attachments[0].thumbnail).toBe('https://example.com/thumb1.jpg');
    });

    it('should extract video metadata (width, height, duration, size, mimeType)', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.width).toBe(1920);
      expect(att.height).toBe(1080);
      expect(att.duration).toBe(125);
      expect(att.size).toBe(2048576);
      expect(att.mimeType).toBe('video/mp4');
    });

    it('should set type to video for all attachments', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      expect((component as any).attachments[0].type).toBe('video');
      expect((component as any).attachments[1].type).toBe('video');
    });

    it('should skip attachments with missing URL', async () => {
      component.message = {
        getAttachments: () => [
          { url: 'https://example.com/video1.mp4', metadata: {} },
          { thumbnail: 'https://example.com/thumb2.jpg', metadata: {} },
          { url: 'https://example.com/video3.mp4', metadata: {} },
        ],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      const attachments = (component as any).attachments;
      expect(attachments.length).toBe(2);
      expect(attachments[0].url).toBe('https://example.com/video1.mp4');
      expect(attachments[1].url).toBe('https://example.com/video3.mp4');
    });

    it('should handle attachments without metadata', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/video.mp4' }],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.url).toBe('https://example.com/video.mp4');
      expect(att.thumbnail).toBeUndefined();
      expect(att.width).toBeUndefined();
      expect(att.height).toBeUndefined();
      expect(att.duration).toBeUndefined();
    });

    it('should store raw attachment reference', async () => {
      const rawAtt = { url: 'https://example.com/video.mp4', metadata: {} };
      component.message = {
        getAttachments: () => [rawAtt],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      expect((component as any).attachments[0].raw).toBe(rawAtt);
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit videoClick when a video is clicked', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.videoClick.subscribe(spy);

      (component as any).onVideoClick(1);
      expect(spy).toHaveBeenCalledWith({
        attachment: (component as any).attachments[1],
        index: 1,
      });
    });

    it('should emit playerOpen when player viewer is opened', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.playerOpen.subscribe(spy);

      (component as any).onVideoClick(0);
      expect(spy).toHaveBeenCalled();
      expect((component as any).showPlayerViewer).toBe(true);
    });

    it('should emit playerClose when player viewer is closed', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.playerClose.subscribe(spy);

      (component as any).closePlayerViewer();
      expect(spy).toHaveBeenCalled();
      expect((component as any).showPlayerViewer).toBe(false);
    });

    it('should not emit videoClick for negative index', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.videoClick.subscribe(spy);

      (component as any).onVideoClick(-1);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit videoClick for out-of-bounds index', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.videoClick.subscribe(spy);

      (component as any).onVideoClick(10);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Play Button Click Events (keyboard support)
  // ---------------------------------------------------------------------------
  describe('Play Button Click Events', () => {
    it('should render a play overlay for single video', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const playOverlay = el.querySelector('.cometchat-video-bubble__play-overlay');
      expect(playOverlay).toBeTruthy();
    });

    it('should open player viewer on video click', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      (component as any).onVideoClick(0);
      expect((component as any).showPlayerViewer).toBe(true);
      expect((component as any).playerStartIndex).toBe(0);
    });

    it('should open player at correct index for second video', async () => {
      component.message = createMockVideoMessage(3);
      await initAndDetect(fixture);

      (component as any).onVideoClick(2);
      expect((component as any).showPlayerViewer).toBe(true);
      expect((component as any).playerStartIndex).toBe(2);
    });

    it('should handle keyboard Enter on thumbnail', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onThumbnailKeyDown(event, 0);
      expect(preventSpy).toHaveBeenCalled();
      expect((component as any).showPlayerViewer).toBe(true);
    });

    it('should handle keyboard Space on thumbnail', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onThumbnailKeyDown(event, 0);
      expect(preventSpy).toHaveBeenCalled();
      expect((component as any).showPlayerViewer).toBe(true);
    });

    it('should ignore non-activation keys on thumbnail', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      (component as any).onThumbnailKeyDown(event, 0);

      expect((component as any).showPlayerViewer).toBe(false);
    });

    it('should not open player for invalid index via keyboard', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      (component as any).onThumbnailKeyDown(event, 5);

      expect((component as any).showPlayerViewer).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS Classes
  // ---------------------------------------------------------------------------
  describe('Alignment CSS Classes', () => {
    it('should apply incoming class for left alignment (default)', async () => {
      component.message = createMockVideoMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-video-bubble');
      expect(bubble?.classList.contains('cometchat-video-bubble--incoming')).toBe(true);
      expect(bubble?.classList.contains('cometchat-video-bubble--outgoing')).toBe(false);
    });

    it('should apply outgoing class for right alignment', async () => {
      component.message = createMockVideoMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-video-bubble');
      expect(bubble?.classList.contains('cometchat-video-bubble--outgoing')).toBe(true);
      expect(bubble?.classList.contains('cometchat-video-bubble--incoming')).toBe(false);
    });

    it('should switch alignment classes when alignment changes', async () => {
      component.message = createMockVideoMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      let bubble = el.querySelector('.cometchat-video-bubble');
      expect(bubble?.classList.contains('cometchat-video-bubble--incoming')).toBe(true);

      component.alignment = MessageBubbleAlignment.right;
      component.ngOnChanges({
        alignment: {
          currentValue: MessageBubbleAlignment.right,
          previousValue: MessageBubbleAlignment.left,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();

      bubble = el.querySelector('.cometchat-video-bubble');
      expect(bubble?.classList.contains('cometchat-video-bubble--outgoing')).toBe(true);
      expect(bubble?.classList.contains('cometchat-video-bubble--incoming')).toBe(false);
    });

    it('should apply layout modifier class for single video', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-video-bubble');
      expect(bubble?.classList.contains('cometchat-video-bubble--single')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Null/Missing URL Fallback
  // ---------------------------------------------------------------------------
  describe('Null/Missing URL Fallback', () => {
    it('should handle null message gracefully without throwing', () => {
      component.message = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle undefined message gracefully', () => {
      component.message = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle null attachments array', async () => {
      component.message = {
        getAttachments: () => null,
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle empty attachments array', async () => {
      component.message = {
        getAttachments: () => [],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle getAttachments throwing an error', () => {
      component.message = {
        getAttachments: () => {
          throw new Error('Extraction error');
        },
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle invalid attachment objects in array', async () => {
      component.message = {
        getAttachments: () => [null, undefined, 'invalid', 123, {}],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle message without getSender method', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/video.mp4', metadata: {} }],
        getText: () => '',
        getData: () => ({}),
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).senderName).toBe('');
      expect((component as any).senderAvatarUrl).toBe('');
    });

    it('should set empty caption for null message', () => {
      component.message = null as any;
      fixture.detectChanges();
      expect((component as any).captionText).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Layout Determination
  // ---------------------------------------------------------------------------
  describe('Layout Determination', () => {
    it('should set layout to "single" for 1 attachment', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('single');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "grid" for 2 attachments', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('grid');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "grid" for 3 attachments', async () => {
      component.message = createMockVideoMessage(3);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('grid');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "grid-2x2" for 4 attachments', async () => {
      component.message = createMockVideoMessage(4);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('grid-2x2');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "overflow" for 5 attachments', async () => {
      component.message = createMockVideoMessage(5);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('overflow');
      expect((component as any).overflowCount).toBe(1);
    });

    it('should set layout to "overflow" for 7 attachments with correct overflow count', async () => {
      component.message = createMockVideoMessage(7);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('overflow');
      expect((component as any).overflowCount).toBe(3);
    });

    it('should set layout to "single" for 0 attachments', async () => {
      component.message = {
        getAttachments: () => [],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('single');
      expect((component as any).overflowCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Duration Formatting
  // ---------------------------------------------------------------------------
  describe('Duration Formatting', () => {
    it('should format 0 seconds as 0:00', () => {
      expect((component as any).formatDuration(0)).toBe('0:00');
    });

    it('should format seconds correctly', () => {
      expect((component as any).formatDuration(5)).toBe('0:05');
      expect((component as any).formatDuration(30)).toBe('0:30');
      expect((component as any).formatDuration(59)).toBe('0:59');
    });

    it('should format minutes correctly', () => {
      expect((component as any).formatDuration(60)).toBe('1:00');
      expect((component as any).formatDuration(90)).toBe('1:30');
      expect((component as any).formatDuration(125)).toBe('2:05');
    });

    it('should format hours correctly (H:MM:SS)', () => {
      expect((component as any).formatDuration(3600)).toBe('1:00:00');
      expect((component as any).formatDuration(3665)).toBe('1:01:05');
      expect((component as any).formatDuration(7200)).toBe('2:00:00');
    });

    it('should handle negative values as 0:00', () => {
      expect((component as any).formatDuration(-5)).toBe('0:00');
    });

    it('should handle NaN as 0:00', () => {
      expect((component as any).formatDuration(NaN)).toBe('0:00');
    });

    it('should handle Infinity as 0:00', () => {
      expect((component as any).formatDuration(Infinity)).toBe('0:00');
    });

    it('should handle null/undefined as 0:00', () => {
      expect((component as any).formatDuration(null)).toBe('0:00');
      expect((component as any).formatDuration(undefined)).toBe('0:00');
    });
  });

  // ---------------------------------------------------------------------------
  // Caption Extraction
  // ---------------------------------------------------------------------------
  describe('Caption Extraction', () => {
    it('should extract caption via getText()', async () => {
      component.message = createMockVideoMessage(1, 'Test video caption');
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('Test video caption');
    });

    it('should have empty caption when getText() returns empty', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('');
    });

    it('should extract caption via getData().text fallback', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/video.mp4', metadata: {} }],
        getText: () => '',
        getData: () => ({ text: 'Caption from getData' }),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('Caption from getData');
    });

    it('should treat whitespace-only caption as empty', async () => {
      component.message = createMockVideoMessage(1, '   ');
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('');
    });

    it('should render caption section when caption exists', async () => {
      component.message = createMockVideoMessage(1, 'My video caption');
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-video-bubble__caption');
      expect(captionEl).toBeTruthy();
    });

    it('should not render caption section when no caption', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-video-bubble__caption');
      expect(captionEl).toBeNull();
    });

    it('should handle getData throwing error gracefully', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/video.mp4', metadata: {} }],
        getText: () => '',
        getData: () => {
          throw new Error('getData error');
        },
        getSender: () => null,
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).captionText).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering & BEM Structure
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the container element for single video', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-video-bubble__container')).toBeTruthy();
    });

    it('should render video wrapper with thumbnail', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-video-bubble__video-wrapper');
      expect(wrapper).toBeTruthy();

      const thumbnail = el.querySelector('.cometchat-video-bubble__thumbnail');
      expect(thumbnail).toBeTruthy();
    });

    it('should render play overlay and play icon', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-video-bubble__play-overlay')).toBeTruthy();
      expect(el.querySelector('.cometchat-video-bubble__play-icon')).toBeTruthy();
    });

    it('should render duration badge when duration is present', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const badge = el.querySelector('.cometchat-video-bubble__duration-badge');
      expect(badge).toBeTruthy();

      const durationText = el.querySelector('.cometchat-video-bubble__duration-text');
      expect(durationText?.textContent?.trim()).toBeTruthy();
    });

    it('should not render duration badge when duration is absent', async () => {
      component.message = createMockVideoMessage(1, undefined, { includeDuration: false });
      await initAndDetect(fixture);

      const badge = el.querySelector('.cometchat-video-bubble__duration-badge');
      expect(badge).toBeNull();
    });

    it('should render grid layout for 2 videos', async () => {
      component.message = createMockVideoMessage(2);
      await initAndDetect(fixture);

      const grid = el.querySelector('.cometchat-video-bubble__grid--two-col');
      expect(grid).toBeTruthy();

      const wrappers = el.querySelectorAll('.cometchat-video-bubble__video-wrapper');
      expect(wrappers.length).toBe(2);
    });

    it('should render 2x2 grid layout for 4 videos', async () => {
      component.message = createMockVideoMessage(4);
      await initAndDetect(fixture);

      const grid = el.querySelector('.cometchat-video-bubble__grid--2x2');
      expect(grid).toBeTruthy();

      const wrappers = el.querySelectorAll('.cometchat-video-bubble__video-wrapper');
      expect(wrappers.length).toBe(4);
    });

    it('should render overflow layout for >4 videos', async () => {
      component.message = createMockVideoMessage(6);
      await initAndDetect(fixture);

      const overflowTile = el.querySelector('.cometchat-video-bubble__overflow-tile');
      expect(overflowTile).toBeTruthy();

      const overflowText = el.querySelector('.cometchat-video-bubble__overflow-text');
      expect(overflowText?.textContent?.trim()).toBeTruthy();
    });

    it('should not render any video items when no attachments', async () => {
      component.message = {
        getAttachments: () => [],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-video-bubble__video-wrapper')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA / Accessibility
  // ---------------------------------------------------------------------------
  describe('ARIA Attributes', () => {
    it('should have role="button" on video wrapper', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-video-bubble__video-wrapper');
      expect(wrapper?.getAttribute('role')).toBe('button');
    });

    it('should have aria-label on video wrapper', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-video-bubble__video-wrapper');
      expect(wrapper?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have tabindex on video wrapper for keyboard focus', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-video-bubble__video-wrapper');
      expect(wrapper?.getAttribute('tabindex')).toBe('0');
    });

    it('should have aria-hidden on play overlay', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const overlay = el.querySelector('.cometchat-video-bubble__play-overlay');
      expect(overlay?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-hidden on duration badge', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const badge = el.querySelector('.cometchat-video-bubble__duration-badge');
      expect(badge?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should generate correct thumbnail ARIA label with duration', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const label = (component as any).getThumbnailAriaLabel(0);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should generate fallback ARIA label for missing attachment', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      const label = (component as any).getThumbnailAriaLabel(99);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should have role="button" and aria-label on overflow tile', async () => {
      component.message = createMockVideoMessage(6);
      await initAndDetect(fixture);

      const overflowTile = el.querySelector('.cometchat-video-bubble__overflow-tile');
      expect(overflowTile?.getAttribute('role')).toBe('button');
      expect(overflowTile?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have tabindex on overflow tile', async () => {
      component.message = createMockVideoMessage(6);
      await initAndDetect(fixture);

      const overflowTile = el.querySelector('.cometchat-video-bubble__overflow-tile');
      expect(overflowTile?.getAttribute('tabindex')).toBe('0');
    });
  });

  // ---------------------------------------------------------------------------
  // Sender Info Extraction
  // ---------------------------------------------------------------------------
  describe('Sender Info Extraction', () => {
    it('should extract sender name from message', async () => {
      component.message = createMockVideoMessage(1, undefined, { senderName: 'Alice' });
      await initAndDetect(fixture);

      expect((component as any).senderName).toBe('Alice');
    });

    it('should extract sender avatar from message', async () => {
      component.message = createMockVideoMessage(1, undefined, {
        senderAvatar: 'https://example.com/alice.png',
      });
      await initAndDetect(fixture);

      expect((component as any).senderAvatarUrl).toBe('https://example.com/alice.png');
    });

    it('should set empty sender info when sender is null', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/video.mp4', metadata: {} }],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      expect((component as any).senderName).toBe('');
      expect((component as any).senderAvatarUrl).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle message with malformed getData gracefully', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/video.mp4', metadata: {} }],
        getText: () => '',
        getData: () => {
          throw new Error('getData error');
        },
        getSender: () => null,
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).captionText).toBe('');
    });

    it('should handle message with getSender throwing error', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/video.mp4', metadata: {} }],
        getText: () => '',
        getData: () => ({}),
        getSender: () => {
          throw new Error('getSender error');
        },
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).senderName).toBe('');
    });

    it('should close player viewer and emit playerClose', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      (component as any).onVideoClick(0);
      expect((component as any).showPlayerViewer).toBe(true);

      (component as any).closePlayerViewer();
      expect((component as any).showPlayerViewer).toBe(false);
    });

    it('should handle overflow text generation', async () => {
      component.message = createMockVideoMessage(7);
      await initAndDetect(fixture);

      const text = (component as any).getOverflowText();
      expect(text).toBeTruthy();
      expect(text).toContain('3');
    });

    it('should handle overflow ARIA label generation', async () => {
      component.message = createMockVideoMessage(6);
      await initAndDetect(fixture);

      const label = (component as any).getOverflowAriaLabel();
      expect(label).toBeTruthy();
      expect(label).toContain('2');
    });

    it('should clean up PIP on destroy without throwing', async () => {
      component.message = createMockVideoMessage(1);
      await initAndDetect(fixture);

      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should handle attachments with non-string thumbnail gracefully', async () => {
      component.message = {
        getAttachments: () => [
          { url: 'https://example.com/video.mp4', thumbnail: 12345, metadata: {} },
        ],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      expect((component as any).attachments[0].thumbnail).toBeUndefined();
    });

    it('should handle attachments with non-number metadata values', async () => {
      component.message = {
        getAttachments: () => [
          {
            url: 'https://example.com/video.mp4',
            metadata: { width: 'wide', height: 'tall', duration: 'long', size: 'big' },
          },
        ],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.width).toBeUndefined();
      expect(att.height).toBeUndefined();
      expect(att.duration).toBeUndefined();
      expect(att.size).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Duration badge — client-side fallback (React parity)
  // ---------------------------------------------------------------------------
  describe('Duration badge fallback', () => {
    /** Fake a `loadedmetadata` event off the thumbnail <video>. */
    function metadataEvent(duration: number): Event {
      return { target: { duration } } as unknown as Event;
    }

    it('adopts the duration read off the thumbnail <video> when metadata has none', () => {
      (component as any).attachments = [{ url: 'v.mp4' }];
      (component as any).onThumbnailMetadata(0, metadataEvent(67));
      expect((component as any).attachments[0].duration).toBe(67);
    });

    it('never overrides a duration the backend supplied', () => {
      (component as any).attachments = [{ url: 'v.mp4', duration: 30 }];
      (component as any).onThumbnailMetadata(0, metadataEvent(67));
      expect((component as any).attachments[0].duration).toBe(30);
    });

    it('ignores a non-finite, zero or missing duration', () => {
      (component as any).attachments = [{ url: 'v.mp4' }];
      (component as any).onThumbnailMetadata(0, metadataEvent(Infinity));
      expect((component as any).attachments[0].duration).toBeUndefined();

      (component as any).onThumbnailMetadata(0, metadataEvent(0));
      expect((component as any).attachments[0].duration).toBeUndefined();

      (component as any).onThumbnailMetadata(0, { target: null } as unknown as Event);
      expect((component as any).attachments[0].duration).toBeUndefined();
    });

    it('is a no-op for an out-of-range index', () => {
      (component as any).attachments = [];
      expect(() => (component as any).onThumbnailMetadata(3, metadataEvent(10))).not.toThrow();
    });

    it('renders the badge once a duration is known', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/v.mp4', metadata: {} }],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.cometchat-video-bubble__duration-badge')).toBeNull();

      (component as any).onThumbnailMetadata(0, metadataEvent(67));
      fixture.detectChanges();
      expect(
        el.querySelector('.cometchat-video-bubble__duration-text')?.textContent?.trim(),
      ).toBe('1:07');
    });
  });
});
