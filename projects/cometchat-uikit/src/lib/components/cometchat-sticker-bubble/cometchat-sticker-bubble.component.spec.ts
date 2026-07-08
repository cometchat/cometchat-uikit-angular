/**
 * CometChatStickerBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the sticker bubble component that
 * renders sticker messages by extracting the sticker image URL from message
 * metadata/customData using a priority-based fallback chain.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, DOM Rendering,
 *             Sticker URL Extraction, Alignment CSS, Accessibility,
 *             Null/Empty Handling, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-sticker-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatStickerBubbleComponent } from './cometchat-sticker-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock CustomMessage with configurable metadata and customData
 * that mimics CometChat.CustomMessage's API surface.
 */
function createMockStickerMessage(options?: {
  metadata?: Record<string, any> | null;
  customData?: Record<string, any> | null;
}): any {
  const metadata = options?.metadata !== undefined ? options.metadata : null;
  const customData = options?.customData !== undefined ? options.customData : null;
  return {
    getMetadata: () => metadata,
    getCustomData: () => customData,
  };
}

/**
 * Simulates ngOnChanges for the message input on the component.
 */
function setMessageAndDetect(
  fixture: ComponentFixture<CometChatStickerBubbleComponent>,
  message: any
): void {
  const component = fixture.componentInstance;
  const prev = component.message;
  component.message = message;
  component.ngOnChanges({
    message: new SimpleChange(prev, message, prev === null),
  });
  fixture.detectChanges();
}

describe('CometChatStickerBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatStickerBubbleComponent>;
  let component: CometChatStickerBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatStickerBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatStickerBubbleComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default message as null', () => {
      expect(component.message).toBeNull();
    });

    it('should have default alignment as left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should have default stickerUrl as empty string', () => {
      expect(component.stickerUrl).toBe('');
    });

    it('should render the container div on init even without a message', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-sticker-bubble')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a message input and extract stickerUrl', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker.png' },
      });
      setMessageAndDetect(fixture, msg);

      expect(component.message).toBe(msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/sticker.png');
    });

    it('should accept alignment input as right', () => {
      component.alignment = MessageBubbleAlignment.right;
      fixture.detectChanges();

      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should update stickerUrl when message changes', () => {
      const msg1 = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker1.png' },
      });
      setMessageAndDetect(fixture, msg1);
      expect(component.stickerUrl).toBe('https://cdn.example.com/sticker1.png');

      const msg2 = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker2.png' },
      });
      setMessageAndDetect(fixture, msg2);
      expect(component.stickerUrl).toBe('https://cdn.example.com/sticker2.png');
    });

    it('should handle null message input gracefully', () => {
      expect(() => {
        setMessageAndDetect(fixture, null);
      }).not.toThrow();
      expect(component.stickerUrl).toBe('');
    });

    it('should handle undefined message input gracefully', () => {
      expect(() => {
        setMessageAndDetect(fixture, undefined);
      }).not.toThrow();
      expect(component.stickerUrl).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Sticker URL Extraction (Priority Chain)
  // ---------------------------------------------------------------------------
  describe('Sticker URL Extraction', () => {
    it('should extract URL from metadata.data.sticker_url (priority 1)', () => {
      const msg = createMockStickerMessage({
        metadata: { data: { sticker_url: 'https://cdn.example.com/p1.png' } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/p1.png');
    });

    it('should extract URL from metadata.sticker_url (priority 2)', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/p2.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/p2.png');
    });

    it('should extract URL from customData.sticker_url (priority 3)', () => {
      const msg = createMockStickerMessage({
        metadata: null,
        customData: { sticker_url: 'https://cdn.example.com/p3.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/p3.png');
    });

    it('should prefer metadata.data.sticker_url over metadata.sticker_url', () => {
      const msg = createMockStickerMessage({
        metadata: {
          data: { sticker_url: 'https://cdn.example.com/priority1.png' },
          sticker_url: 'https://cdn.example.com/priority2.png',
        },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/priority1.png');
    });

    it('should prefer metadata.sticker_url over customData.sticker_url', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/meta.png' },
        customData: { sticker_url: 'https://cdn.example.com/custom.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/meta.png');
    });

    it('should fall back to customData when metadata has no sticker_url', () => {
      const msg = createMockStickerMessage({
        metadata: { someOtherKey: 'value' },
        customData: { sticker_url: 'https://cdn.example.com/fallback.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/fallback.png');
    });

    it('should return empty string when no sticker_url found anywhere', () => {
      const msg = createMockStickerMessage({
        metadata: { someOtherKey: 'value' },
        customData: { someOtherKey: 'value' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering — Image Display
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the block element .cometchat-sticker-bubble', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-sticker-bubble')).toBeTruthy();
    });

    it('should render the img element when stickerUrl is set', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker.png' },
      });
      setMessageAndDetect(fixture, msg);

      const img = el.querySelector('.cometchat-sticker-bubble__image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain('sticker.png');
    });

    it('should not render the img element when stickerUrl is empty', () => {
      setMessageAndDetect(fixture, null);

      expect(el.querySelector('.cometchat-sticker-bubble__image')).toBeNull();
    });

    it('should update the img src when message changes', () => {
      const msg1 = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/first.png' },
      });
      setMessageAndDetect(fixture, msg1);
      let img = el.querySelector('.cometchat-sticker-bubble__image') as HTMLImageElement;
      expect(img.src).toContain('first.png');

      const msg2 = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/second.png' },
      });
      fixture.componentRef.setInput('message', msg2);
      fixture.detectChanges();
      img = el.querySelector('.cometchat-sticker-bubble__image') as HTMLImageElement;
      expect(img.src).toContain('second.png');
    });

    it('should remove the img element when message is cleared', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(el.querySelector('.cometchat-sticker-bubble__image')).toBeTruthy();

      fixture.componentRef.setInput('message', null);
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-sticker-bubble__image')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS
  // ---------------------------------------------------------------------------
  describe('Alignment CSS', () => {
    it('should apply incoming modifier class for left alignment', () => {
      component.alignment = MessageBubbleAlignment.left;
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-sticker-bubble');
      expect(container?.classList.contains('cometchat-sticker-bubble--incoming')).toBe(true);
      expect(container?.classList.contains('cometchat-sticker-bubble--outgoing')).toBe(false);
    });

    it('should apply outgoing modifier class for right alignment', () => {
      component.alignment = MessageBubbleAlignment.right;
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-sticker-bubble');
      expect(container?.classList.contains('cometchat-sticker-bubble--outgoing')).toBe(true);
      expect(container?.classList.contains('cometchat-sticker-bubble--incoming')).toBe(false);
    });

    it('should default to incoming (left) alignment', () => {
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-sticker-bubble');
      expect(container?.classList.contains('cometchat-sticker-bubble--incoming')).toBe(true);
    });

    it('should toggle alignment classes when alignment changes', () => {
      component.alignment = MessageBubbleAlignment.left;
      fixture.detectChanges();
      let container = el.querySelector('.cometchat-sticker-bubble');
      expect(container?.classList.contains('cometchat-sticker-bubble--incoming')).toBe(true);

      fixture.componentRef.setInput('alignment', MessageBubbleAlignment.right);
      fixture.detectChanges();
      container = el.querySelector('.cometchat-sticker-bubble');
      expect(container?.classList.contains('cometchat-sticker-bubble--outgoing')).toBe(true);
      expect(container?.classList.contains('cometchat-sticker-bubble--incoming')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('should have role="img" on the sticker bubble container', () => {
      fixture.detectChanges();
      const container = el.querySelector('.cometchat-sticker-bubble');
      expect(container?.getAttribute('role')).toBe('img');
    });

    it('should have an aria-label on the container', () => {
      fixture.detectChanges();
      const container = el.querySelector('.cometchat-sticker-bubble');
      const ariaLabel = container?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should render the sticker image as decorative (empty alt + aria-hidden)', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker.png' },
      });
      setMessageAndDetect(fixture, msg);

      // The accessible name is provided once by the container's role="img" +
      // aria-label; the inner <img> is decorative to avoid a duplicate announcement.
      const img = el.querySelector('.cometchat-sticker-bubble__image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });

    it('should not render img (and thus no alt) when stickerUrl is empty', () => {
      setMessageAndDetect(fixture, null);
      expect(el.querySelector('img')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Null URL Fallback
  // ---------------------------------------------------------------------------
  describe('Null URL Fallback', () => {
    it('should return empty string when message is null', () => {
      setMessageAndDetect(fixture, null);
      expect(component.stickerUrl).toBe('');
    });

    it('should return empty string when metadata and customData are both null', () => {
      const msg = createMockStickerMessage({ metadata: null, customData: null });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('');
    });

    it('should return empty string when getMetadata returns undefined', () => {
      const msg = { getMetadata: () => undefined, getCustomData: () => undefined };
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('');
    });

    it('should not throw when getMetadata is not a function', () => {
      const msg = { noMetadataMethod: true };
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component.stickerUrl).toBe('');
    });

    it('should handle message with getMetadata throwing an error', () => {
      const msg = {
        getMetadata: () => {
          throw new Error('metadata error');
        },
        getCustomData: () => null,
      };
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component.stickerUrl).toBe('');
    });

    it('should clear stickerUrl when message is set to null after having a value', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/sticker.png');

      fixture.componentRef.setInput('message', null);
      fixture.detectChanges();
      expect(component.stickerUrl).toBe('');
      expect(el.querySelector('.cometchat-sticker-bubble__image')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle sticker URL with query parameters', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker.png?v=2&size=128' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toContain('sticker.png?v=2&size=128');
    });

    it('should handle sticker URL with encoded characters', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/stickers/happy%20face.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('https://cdn.example.com/stickers/happy%20face.png');
    });

    it('should handle very long sticker URL', () => {
      const longUrl = 'https://cdn.example.com/' + 'a'.repeat(2000) + '.png';
      const msg = createMockStickerMessage({
        metadata: { sticker_url: longUrl },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe(longUrl);
    });

    it('should handle metadata.data without sticker_url key', () => {
      const msg = createMockStickerMessage({
        metadata: { data: { other_key: 'value' } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('');
    });

    it('should handle metadata.data.sticker_url as empty string (falsy)', () => {
      const msg = createMockStickerMessage({
        metadata: { data: { sticker_url: '' } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('');
    });

    it('should handle message object with no methods at all', () => {
      const msg = {};
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component.stickerUrl).toBe('');
    });

    it('should render sticker with both message and alignment set', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/sticker.png' },
      });
      component.alignment = MessageBubbleAlignment.right;
      setMessageAndDetect(fixture, msg);

      const container = el.querySelector('.cometchat-sticker-bubble');
      expect(container?.classList.contains('cometchat-sticker-bubble--outgoing')).toBe(true);
      const img = el.querySelector('.cometchat-sticker-bubble__image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain('sticker.png');
    });

    it('should handle unicode in sticker URL', () => {
      const msg = createMockStickerMessage({
        metadata: { sticker_url: 'https://cdn.example.com/stickers/笑脸.png' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toContain('笑脸.png');
    });

    it('should handle customData.sticker_url as empty string (falsy)', () => {
      const msg = createMockStickerMessage({
        metadata: null,
        customData: { sticker_url: '' },
      });
      setMessageAndDetect(fixture, msg);
      expect(component.stickerUrl).toBe('');
    });
  });
});
