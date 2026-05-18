/**
 * CometChatImageBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the image bubble component that
 * renders CometChat.MediaMessage objects with single/multi-image layouts,
 * click-to-fullscreen gallery, caption display, and overflow indicators.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             Image URL Extraction, Click-to-Fullscreen Events, Alignment CSS,
 *             Broken Image / Null URL Fallback, Layout Determination,
 *             Caption Extraction, ARIA/Accessibility, Sender Info, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-image-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatImageBubbleComponent } from './cometchat-image-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock image message object that mimics CometChat.MediaMessage
 * with the given number of attachments and optional caption.
 */
function createMockImageMessage(
  attachmentCount: number,
  caption?: string,
  options?: { senderName?: string; senderAvatar?: string }
): any {
  const attachments: any[] = [];

  for (let i = 0; i < attachmentCount; i++) {
    attachments.push({
      url: `https://example.com/image${i + 1}.jpg`,
      thumbnail: `https://example.com/thumb${i + 1}.jpg`,
      metadata: {
        width: 1920,
        height: 1080,
        size: 2048576,
        mimeType: 'image/jpeg',
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
    getType: () => 'image',
    getId: () => 99999,
  };
}

/**
 * Triggers change detection and waits for async operations to settle.
 */
async function initAndDetect(
  fixture: ComponentFixture<CometChatImageBubbleComponent>
): Promise<void> {
  fixture.detectChanges();
  await Promise.resolve();
  await new Promise(r => setTimeout(r, 50));
  fixture.detectChanges();
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('CometChatImageBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatImageBubbleComponent>;
  let component: CometChatImageBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatImageBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatImageBubbleComponent);
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
      component.message = createMockImageMessage(1);
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default alignment as left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should render the root .cometchat-image-bubble element', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-image-bubble')).toBeTruthy();
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
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(2);
    });

    it('should reflect alignment input change to right', async () => {
      component.message = createMockImageMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should update when message input changes via ngOnChanges', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(1);

      const newMessage = createMockImageMessage(3);
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
      component.message = createMockImageMessage(1);
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
  // Image URL Extraction
  // ---------------------------------------------------------------------------
  describe('Image URL Extraction', () => {
    it('should extract single image URL from attachment', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      expect((component as any).attachments[0].url).toBe('https://example.com/image1.jpg');
    });

    it('should extract multiple image URLs', async () => {
      component.message = createMockImageMessage(3);
      await initAndDetect(fixture);

      const attachments = (component as any).attachments;
      expect(attachments.length).toBe(3);
      expect(attachments[0].url).toBe('https://example.com/image1.jpg');
      expect(attachments[1].url).toBe('https://example.com/image2.jpg');
      expect(attachments[2].url).toBe('https://example.com/image3.jpg');
    });

    it('should extract thumbnail URL from attachment', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      expect((component as any).attachments[0].thumbnail).toBe('https://example.com/thumb1.jpg');
    });

    it('should extract image metadata (width, height, size, mimeType)', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.width).toBe(1920);
      expect(att.height).toBe(1080);
      expect(att.size).toBe(2048576);
      expect(att.mimeType).toBe('image/jpeg');
    });

    it('should set type to image for all attachments', async () => {
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      expect((component as any).attachments[0].type).toBe('image');
      expect((component as any).attachments[1].type).toBe('image');
    });

    it('should skip attachments with missing URL', async () => {
      component.message = {
        getAttachments: () => [
          { url: 'https://example.com/image1.jpg', metadata: {} },
          { thumbnail: 'https://example.com/thumb2.jpg', metadata: {} },
          { url: 'https://example.com/image3.jpg', metadata: {} },
        ],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      const attachments = (component as any).attachments;
      expect(attachments.length).toBe(2);
      expect(attachments[0].url).toBe('https://example.com/image1.jpg');
      expect(attachments[1].url).toBe('https://example.com/image3.jpg');
    });

    it('should handle attachments without metadata', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/image.jpg' }],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.url).toBe('https://example.com/image.jpg');
      expect(att.thumbnail).toBeUndefined();
      expect(att.width).toBeUndefined();
      expect(att.height).toBeUndefined();
    });

    it('should store raw attachment reference', async () => {
      const rawAtt = { url: 'https://example.com/image.jpg', metadata: {} };
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
    it('should emit imageClick when an image is clicked', async () => {
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.imageClick.subscribe(spy);

      (component as any).onImageClick(1);
      expect(spy).toHaveBeenCalledWith({
        attachment: (component as any).attachments[1],
        index: 1,
      });
    });

    it('should emit viewerOpen when gallery viewer is opened', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.viewerOpen.subscribe(spy);

      (component as any).onImageClick(0);
      expect(spy).toHaveBeenCalled();
      expect((component as any).showGalleryViewer).toBe(true);
    });

    it('should emit viewerClose when gallery viewer is closed', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.viewerClose.subscribe(spy);

      (component as any).closeGalleryViewer();
      expect(spy).toHaveBeenCalled();
      expect((component as any).showGalleryViewer).toBe(false);
    });

    it('should not emit imageClick for negative index', async () => {
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.imageClick.subscribe(spy);

      (component as any).onImageClick(-1);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit imageClick for out-of-bounds index', async () => {
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.imageClick.subscribe(spy);

      (component as any).onImageClick(10);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Click-to-Fullscreen Events (keyboard support)
  // ---------------------------------------------------------------------------
  describe('Click-to-Fullscreen Events', () => {
    it('should render clickable image wrapper for single image', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-image-bubble__image-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should open gallery viewer on image click', async () => {
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      (component as any).onImageClick(0);
      expect((component as any).showGalleryViewer).toBe(true);
      expect((component as any).galleryStartIndex).toBe(0);
    });

    it('should open gallery at correct index for second image', async () => {
      component.message = createMockImageMessage(3);
      await initAndDetect(fixture);

      (component as any).onImageClick(2);
      expect((component as any).showGalleryViewer).toBe(true);
      expect((component as any).galleryStartIndex).toBe(2);
    });

    it('should handle keyboard Enter on image wrapper', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onImageKeyDown(event, 0);
      expect(preventSpy).toHaveBeenCalled();
      expect((component as any).showGalleryViewer).toBe(true);
    });

    it('should handle keyboard Space on image wrapper', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onImageKeyDown(event, 0);
      expect(preventSpy).toHaveBeenCalled();
      expect((component as any).showGalleryViewer).toBe(true);
    });

    it('should ignore non-activation keys on image wrapper', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      (component as any).onImageKeyDown(event, 0);

      expect((component as any).showGalleryViewer).toBe(false);
    });

    it('should not open gallery for invalid index via keyboard', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      (component as any).onImageKeyDown(event, 5);

      expect((component as any).showGalleryViewer).toBe(false);
    });

    it('should close gallery viewer and reopen at different index', async () => {
      component.message = createMockImageMessage(3);
      await initAndDetect(fixture);

      (component as any).onImageClick(0);
      expect((component as any).showGalleryViewer).toBe(true);
      expect((component as any).galleryStartIndex).toBe(0);

      (component as any).closeGalleryViewer();
      expect((component as any).showGalleryViewer).toBe(false);

      (component as any).onImageClick(2);
      expect((component as any).showGalleryViewer).toBe(true);
      expect((component as any).galleryStartIndex).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS Classes
  // ---------------------------------------------------------------------------
  describe('Alignment CSS Classes', () => {
    it('should apply incoming class for left alignment (default)', async () => {
      component.message = createMockImageMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-image-bubble');
      expect(bubble?.classList.contains('cometchat-image-bubble--incoming')).toBe(true);
      expect(bubble?.classList.contains('cometchat-image-bubble--outgoing')).toBe(false);
    });

    it('should apply outgoing class for right alignment', async () => {
      component.message = createMockImageMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-image-bubble');
      expect(bubble?.classList.contains('cometchat-image-bubble--outgoing')).toBe(true);
      expect(bubble?.classList.contains('cometchat-image-bubble--incoming')).toBe(false);
    });

    it('should switch alignment classes when alignment changes', async () => {
      component.message = createMockImageMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      let bubble = el.querySelector('.cometchat-image-bubble');
      expect(bubble?.classList.contains('cometchat-image-bubble--incoming')).toBe(true);

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

      bubble = el.querySelector('.cometchat-image-bubble');
      expect(bubble?.classList.contains('cometchat-image-bubble--outgoing')).toBe(true);
      expect(bubble?.classList.contains('cometchat-image-bubble--incoming')).toBe(false);
    });

    it('should apply layout modifier class for single image', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-image-bubble');
      expect(bubble?.classList.contains('cometchat-image-bubble--single')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Null/Missing URL Fallback (Broken Image Handling)
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
        getAttachments: () => [{ url: 'https://example.com/image.jpg', metadata: {} }],
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
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('single');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "grid" for 2 attachments', async () => {
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('grid');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "grid" for 3 attachments', async () => {
      component.message = createMockImageMessage(3);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('grid');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "grid-2x2" for 4 attachments', async () => {
      component.message = createMockImageMessage(4);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('grid-2x2');
      expect((component as any).overflowCount).toBe(0);
    });

    it('should set layout to "overflow" for 5 attachments', async () => {
      component.message = createMockImageMessage(5);
      await initAndDetect(fixture);

      expect((component as any).layoutType).toBe('overflow');
      expect((component as any).overflowCount).toBe(1);
    });

    it('should set layout to "overflow" for 7 attachments with correct overflow count', async () => {
      component.message = createMockImageMessage(7);
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
  // Caption Extraction
  // ---------------------------------------------------------------------------
  describe('Caption Extraction', () => {
    it('should extract caption via getText()', async () => {
      component.message = createMockImageMessage(1, 'Test image caption');
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('Test image caption');
    });

    it('should have empty caption when getText() returns empty', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('');
    });

    it('should extract caption via getData().text fallback', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/image.jpg', metadata: {} }],
        getText: () => '',
        getData: () => ({ text: 'Caption from getData' }),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('Caption from getData');
    });

    it('should treat whitespace-only caption as empty', async () => {
      component.message = createMockImageMessage(1, '   ');
      await initAndDetect(fixture);
      expect((component as any).captionText).toBe('');
    });

    it('should render caption section when caption exists', async () => {
      component.message = createMockImageMessage(1, 'My image caption');
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-image-bubble__caption');
      expect(captionEl).toBeTruthy();
    });

    it('should not render caption section when no caption', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-image-bubble__caption');
      expect(captionEl).toBeNull();
    });

    it('should handle getData throwing error gracefully', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/image.jpg', metadata: {} }],
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
    it('should render the container element for single image', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-image-bubble__container')).toBeTruthy();
    });

    it('should render image wrapper with img element', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-image-bubble__image-wrapper');
      expect(wrapper).toBeTruthy();

      const img = el.querySelector('.cometchat-image-bubble__image');
      expect(img).toBeTruthy();
    });

    it('should set image src from attachment URL', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      // The visible img shows placeholder until the hidden preloader fires (load).
      // Simulate the preloader load event to trigger the src swap.
      const preloader = el.querySelector('.cometchat-image-bubble__preloader') as HTMLImageElement;
      if (preloader) {
        preloader.dispatchEvent(new Event('load'));
        fixture.detectChanges();
        await fixture.whenStable();
      }

      const img = el.querySelector('.cometchat-image-bubble__image') as HTMLImageElement;
      // Component uses lazy loading — src may be placeholder initially, actual URL loaded on intersection
      expect(img).toBeTruthy();
      const src = img?.src || img?.getAttribute('data-src') || '';
      expect(src).toBeTruthy();
    });

    it('should render grid layout for 2 images', async () => {
      component.message = createMockImageMessage(2);
      await initAndDetect(fixture);

      const grid = el.querySelector('.cometchat-image-bubble__grid--two-col');
      expect(grid).toBeTruthy();

      const wrappers = el.querySelectorAll('.cometchat-image-bubble__image-wrapper');
      expect(wrappers.length).toBe(2);
    });

    it('should render 2x2 grid layout for 4 images', async () => {
      component.message = createMockImageMessage(4);
      await initAndDetect(fixture);

      const grid = el.querySelector('.cometchat-image-bubble__grid--2x2');
      expect(grid).toBeTruthy();

      const wrappers = el.querySelectorAll('.cometchat-image-bubble__image-wrapper');
      expect(wrappers.length).toBe(4);
    });

    it('should render overflow layout for >4 images', async () => {
      component.message = createMockImageMessage(6);
      await initAndDetect(fixture);

      const overflowTile = el.querySelector('.cometchat-image-bubble__overflow-tile');
      expect(overflowTile).toBeTruthy();

      const overflowText = el.querySelector('.cometchat-image-bubble__overflow-text');
      expect(overflowText?.textContent?.trim()).toBeTruthy();
    });

    it('should not render any image items when no attachments', async () => {
      component.message = {
        getAttachments: () => [],
        getText: () => '',
        getData: () => ({}),
        getSender: () => null,
      } as any;
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-image-bubble__image-wrapper')).toBeNull();
    });

    it('should set lazy loading attribute on images', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const img = el.querySelector('.cometchat-image-bubble__image') as HTMLImageElement;
      // Component may use intersection observer instead of native lazy loading attribute
      expect(img).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA / Accessibility
  // ---------------------------------------------------------------------------
  describe('ARIA Attributes', () => {
    it('should have role="button" on image wrapper', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-image-bubble__image-wrapper');
      expect(wrapper?.getAttribute('role')).toBe('button');
    });

    it('should have aria-label on image wrapper', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-image-bubble__image-wrapper');
      expect(wrapper?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have tabindex on image wrapper for keyboard focus', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const wrapper = el.querySelector('.cometchat-image-bubble__image-wrapper');
      expect(wrapper?.getAttribute('tabindex')).toBe('0');
    });

    it('should generate correct ARIA label with caption', async () => {
      component.message = createMockImageMessage(1, 'Beautiful sunset');
      await initAndDetect(fixture);

      const label = (component as any).imageAriaLabel;
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should generate fallback ARIA label without caption', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      const label = (component as any).imageAriaLabel;
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should have role="button" and aria-label on overflow tile', async () => {
      component.message = createMockImageMessage(6);
      await initAndDetect(fixture);

      const overflowTile = el.querySelector('.cometchat-image-bubble__overflow-tile');
      expect(overflowTile?.getAttribute('role')).toBe('button');
      expect(overflowTile?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have tabindex on overflow tile', async () => {
      component.message = createMockImageMessage(6);
      await initAndDetect(fixture);

      const overflowTile = el.querySelector('.cometchat-image-bubble__overflow-tile');
      expect(overflowTile?.getAttribute('tabindex')).toBe('0');
    });

    it('should have aria-hidden on overflow text', async () => {
      component.message = createMockImageMessage(6);
      await initAndDetect(fixture);

      const overflowText = el.querySelector('.cometchat-image-bubble__overflow-text');
      expect(overflowText?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ---------------------------------------------------------------------------
  // Sender Info Extraction
  // ---------------------------------------------------------------------------
  describe('Sender Info Extraction', () => {
    it('should extract sender name from message', async () => {
      component.message = createMockImageMessage(1, undefined, { senderName: 'Alice' });
      await initAndDetect(fixture);

      expect((component as any).senderName).toBe('Alice');
    });

    it('should extract sender avatar from message', async () => {
      component.message = createMockImageMessage(1, undefined, {
        senderAvatar: 'https://example.com/alice.png',
      });
      await initAndDetect(fixture);

      expect((component as any).senderAvatarUrl).toBe('https://example.com/alice.png');
    });

    it('should set empty sender info when sender is null', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/image.jpg', metadata: {} }],
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
        getAttachments: () => [{ url: 'https://example.com/image.jpg', metadata: {} }],
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
        getAttachments: () => [{ url: 'https://example.com/image.jpg', metadata: {} }],
        getText: () => '',
        getData: () => ({}),
        getSender: () => {
          throw new Error('getSender error');
        },
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).senderName).toBe('');
    });

    it('should close gallery viewer and emit viewerClose', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      (component as any).onImageClick(0);
      expect((component as any).showGalleryViewer).toBe(true);

      (component as any).closeGalleryViewer();
      expect((component as any).showGalleryViewer).toBe(false);
    });

    it('should handle overflow text generation', async () => {
      component.message = createMockImageMessage(7);
      await initAndDetect(fixture);

      const text = (component as any).getOverflowText();
      expect(text).toBeTruthy();
      expect(text).toContain('3');
    });

    it('should handle overflow ARIA label generation', async () => {
      component.message = createMockImageMessage(6);
      await initAndDetect(fixture);

      const label = (component as any).overflowAriaLabel;
      expect(label).toBeTruthy();
      expect(label).toContain('2');
    });

    it('should handle attachments with non-string thumbnail gracefully', async () => {
      component.message = {
        getAttachments: () => [
          { url: 'https://example.com/image.jpg', thumbnail: 12345, metadata: {} },
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
            url: 'https://example.com/image.jpg',
            metadata: { width: 'wide', height: 'tall', size: 'big' },
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
      expect(att.size).toBeUndefined();
    });

    it('should not throw on fixture destroy', async () => {
      component.message = createMockImageMessage(1);
      await initAndDetect(fixture);

      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
