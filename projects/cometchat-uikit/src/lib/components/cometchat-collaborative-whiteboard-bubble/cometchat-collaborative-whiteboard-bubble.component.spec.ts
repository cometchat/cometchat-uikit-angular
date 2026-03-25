/**
 * CometChatCollaborativeWhiteboardBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the collaborative whiteboard bubble
 * component that renders collaborative whiteboard messages by extracting the
 * whiteboard URL from message metadata and displaying a banner, title, subtitle,
 * and action button.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, DOM Rendering,
 *             Whiteboard URL Extraction, Button Click Events,
 *             Alignment CSS, Keyboard Accessibility,
 *             Null/Empty Handling, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-collaborative-whiteboard-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatCollaborativeWhiteboardBubbleComponent } from './cometchat-collaborative-whiteboard-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock CustomMessage with configurable metadata for collaborative
 * whiteboard. The component extracts URL from:
 *   metadata["@injected"]["extensions"]["whiteboard"]["board_url"]
 */
function createWhiteboardMessage(options?: {
  whiteboardUrl?: string;
  metadata?: Record<string, any> | null;
}): any {
  if (options?.metadata !== undefined) {
    return { getMetadata: () => options.metadata };
  }
  const url = options?.whiteboardUrl ?? 'https://example.com/whiteboard/123';
  return {
    getMetadata: () => ({
      '@injected': {
        extensions: {
          whiteboard: { board_url: url },
        },
      },
    }),
  };
}

/**
 * Simulates ngOnChanges for the message input on the component.
 */
function setMessageAndDetect(
  fixture: ComponentFixture<CometChatCollaborativeWhiteboardBubbleComponent>,
  message: any
): void {
  const component = fixture.componentInstance;
  const prev = component.message;
  component.message = message;
  component.ngOnChanges({
    message: new SimpleChange(prev, message, prev == null),
  });
  fixture.detectChanges();
}

/**
 * Simulates ngOnChanges for the alignment input on the component.
 */
function setAlignmentAndDetect(
  fixture: ComponentFixture<CometChatCollaborativeWhiteboardBubbleComponent>,
  alignment: MessageBubbleAlignment
): void {
  const component = fixture.componentInstance;
  const prev = component.alignment;
  component.alignment = alignment;
  component.ngOnChanges({
    alignment: new SimpleChange(prev, alignment, false),
  });
  fixture.detectChanges();
}

describe('CometChatCollaborativeWhiteboardBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatCollaborativeWhiteboardBubbleComponent>;
  let component: CometChatCollaborativeWhiteboardBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatCollaborativeWhiteboardBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatCollaborativeWhiteboardBubbleComponent);
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

    it('should have default alignment as left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should have default disableInteraction as false', () => {
      expect(component.disableInteraction).toBe(false);
    });

    it('should render the root .cometchat container on init', () => {
      component.message = createWhiteboardMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat')).toBeTruthy();
    });

    it('should render the block element .cometchat-collaborative-whiteboard-bubble', () => {
      component.message = createWhiteboardMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-collaborative-whiteboard-bubble')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a message input and extract whiteboard URL', () => {
      const msg = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board/1' });
      setMessageAndDetect(fixture, msg);
      expect(component.message).toBe(msg);
    });

    it('should accept alignment input as right', () => {
      component.message = createWhiteboardMessage();
      component.alignment = MessageBubbleAlignment.right;
      fixture.detectChanges();
      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should accept disableInteraction input', () => {
      component.message = createWhiteboardMessage();
      component.disableInteraction = true;
      fixture.detectChanges();
      expect(component.disableInteraction).toBe(true);
    });

    it('should update when message changes from one valid value to another', () => {
      const msg1 = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board/1' });
      setMessageAndDetect(fixture, msg1);

      const msg2 = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board/2' });
      setMessageAndDetect(fixture, msg2);
      expect(component.message).toBe(msg2);
    });

    it('should handle null message input gracefully', () => {
      expect(() => {
        setMessageAndDetect(fixture, null);
      }).not.toThrow();
    });

    it('should handle undefined message input gracefully', () => {
      expect(() => {
        setMessageAndDetect(fixture, undefined);
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Whiteboard URL Extraction
  // ---------------------------------------------------------------------------
  describe('Whiteboard URL Extraction', () => {
    it('should extract URL from metadata["@injected"]["extensions"]["whiteboard"]["board_url"]', () => {
      const msg = createWhiteboardMessage({
        whiteboardUrl: 'https://boards.example.com/collab/abc',
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('https://boards.example.com/collab/abc');
    });

    it('should return empty string when metadata is null', () => {
      const msg = createWhiteboardMessage({ metadata: null });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should return empty string when metadata is not an object', () => {
      const msg = { getMetadata: () => 'not-an-object' };
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should return empty string when @injected is missing', () => {
      const msg = createWhiteboardMessage({ metadata: { someOtherKey: 'value' } });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should return empty string when extensions is missing', () => {
      const msg = createWhiteboardMessage({ metadata: { '@injected': { noExtensions: true } } });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should return empty string when whiteboard key is missing', () => {
      const msg = createWhiteboardMessage({
        metadata: { '@injected': { extensions: { otherExtension: {} } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should return empty string when board_url is missing', () => {
      const msg = createWhiteboardMessage({
        metadata: { '@injected': { extensions: { whiteboard: { other_key: 'value' } } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should return empty string when board_url is not a string', () => {
      const msg = createWhiteboardMessage({
        metadata: { '@injected': { extensions: { whiteboard: { board_url: 12345 } } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should return empty string when board_url is empty string', () => {
      const msg = createWhiteboardMessage({
        metadata: { '@injected': { extensions: { whiteboard: { board_url: '' } } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the body section with icon and content', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);
      expect(el.querySelector('.cometchat-collaborative-whiteboard-bubble__body')).toBeTruthy();
      expect(
        el.querySelector('.cometchat-collaborative-whiteboard-bubble__body-icon')
      ).toBeTruthy();
      expect(
        el.querySelector('.cometchat-collaborative-whiteboard-bubble__body-content')
      ).toBeTruthy();
    });

    it('should render the title label', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);
      const nameEl = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__body-content-name label'
      );
      expect(nameEl).toBeTruthy();
      expect(nameEl!.textContent!.trim()).toBeTruthy();
    });

    it('should render the subtitle label', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);
      const descEl = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__body-content-description label'
      );
      expect(descEl).toBeTruthy();
      expect(descEl!.textContent!.trim()).toBeTruthy();
    });

    it('should render the action button', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);
      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.textContent!.trim()).toBeTruthy();
    });

    it('should render the banner image section when bannerImage is set', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);
      const bannerSection = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__banner-image'
      );
      expect(bannerSection).toBeTruthy();
    });

    it('should set title attribute on the title label', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);
      const nameLabel = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__body-content-name label'
      ) as HTMLElement;
      expect(nameLabel?.title).toBeTruthy();
    });

    it('should set title attribute on the subtitle label', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);
      const descLabel = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__body-content-description label'
      ) as HTMLElement;
      expect(descLabel?.title).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Button Click Events
  // ---------------------------------------------------------------------------
  describe('Button Click Events', () => {
    it('should emit buttonClick with whiteboard URL on button click', () => {
      const msg = createWhiteboardMessage({
        whiteboardUrl: 'https://boards.example.com/collab/abc',
      });
      setMessageAndDetect(fixture, msg);

      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(spy).toHaveBeenCalledWith('https://boards.example.com/collab/abc');
      openSpy.mockRestore();
    });

    it('should not emit buttonClick when whiteboard URL is empty', () => {
      const msg = createWhiteboardMessage({ metadata: null });
      setMessageAndDetect(fixture, msg);

      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit the correct URL after message changes', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const msg1 = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board/1' });
      setMessageAndDetect(fixture, msg1);
      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      button.click();
      expect(spy).toHaveBeenCalledWith('https://example.com/board/1');

      const msg2 = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board/2' });
      setMessageAndDetect(fixture, msg2);
      button.click();
      expect(spy).toHaveBeenCalledWith('https://example.com/board/2');

      openSpy.mockRestore();
    });

    it('should disable the button when whiteboard URL is empty', () => {
      const msg = createWhiteboardMessage({ metadata: null });
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable the button when whiteboard URL is valid', () => {
      const msg = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board' });
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should disable the button when disableInteraction is true', () => {
      const msg = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board' });
      component.disableInteraction = true;
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should call window.open with the whiteboard URL on click', () => {
      const msg = createWhiteboardMessage({
        whiteboardUrl: 'https://boards.example.com/collab/abc',
      });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(openSpy).toHaveBeenCalledWith(
        'https://boards.example.com/collab/abc',
        '',
        'fullscreen=yes, scrollbars=auto'
      );
      openSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS
  // ---------------------------------------------------------------------------
  describe('Alignment CSS', () => {
    it('should apply incoming modifier class for left alignment', () => {
      component.message = createWhiteboardMessage();
      component.alignment = MessageBubbleAlignment.left;
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-collaborative-whiteboard-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--incoming')
      ).toBe(true);
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--outgoing')
      ).toBe(false);
    });

    it('should apply outgoing modifier class for right alignment', () => {
      component.message = createWhiteboardMessage();
      component.alignment = MessageBubbleAlignment.right;
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-collaborative-whiteboard-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--outgoing')
      ).toBe(true);
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--incoming')
      ).toBe(false);
    });

    it('should default to incoming (left) alignment', () => {
      component.message = createWhiteboardMessage();
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-collaborative-whiteboard-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--incoming')
      ).toBe(true);
    });

    it('should toggle alignment classes when alignment changes', () => {
      component.message = createWhiteboardMessage();
      component.alignment = MessageBubbleAlignment.left;
      fixture.detectChanges();

      let container = el.querySelector('.cometchat-collaborative-whiteboard-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--incoming')
      ).toBe(true);

      setAlignmentAndDetect(fixture, MessageBubbleAlignment.right);
      container = el.querySelector('.cometchat-collaborative-whiteboard-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--outgoing')
      ).toBe(true);
      expect(
        container?.classList.contains('cometchat-collaborative-whiteboard-bubble--incoming')
      ).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should have aria-label on the action button', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have title attribute on the action button', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button.title).toBeTruthy();
    });

    it('should be natively focusable as a button element', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('should emit buttonClick on Enter keydown', () => {
      const msg = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board' });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      button.dispatchEvent(enterEvent);

      expect(spy).toHaveBeenCalledWith('https://example.com/board');
      openSpy.mockRestore();
    });

    it('should emit buttonClick on Space keydown', () => {
      const msg = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board' });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      button.dispatchEvent(spaceEvent);

      expect(spy).toHaveBeenCalledWith('https://example.com/board');
      openSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Null URL Handling
  // ---------------------------------------------------------------------------
  describe('Null URL Handling', () => {
    it('should set empty whiteboardUrl when message is null', () => {
      setMessageAndDetect(fixture, null);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should set empty whiteboardUrl when message is undefined', () => {
      setMessageAndDetect(fixture, undefined);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should set empty whiteboardUrl when getMetadata returns undefined', () => {
      const msg = { getMetadata: () => undefined };
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should not throw when getMetadata is not a function', () => {
      const msg = { noMetadataMethod: true };
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should not throw when getMetadata throws an error', () => {
      const msg = {
        getMetadata: () => {
          throw new Error('metadata error');
        },
      };
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should clear whiteboardUrl when message changes from valid to null', () => {
      const msg = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board' });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('https://example.com/board');

      setMessageAndDetect(fixture, null);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should disable button when message is null', () => {
      setMessageAndDetect(fixture, null);
      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle whiteboard URL with query parameters', () => {
      const msg = createWhiteboardMessage({
        whiteboardUrl: 'https://boards.example.com/board?id=123&token=abc',
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('https://boards.example.com/board?id=123&token=abc');
    });

    it('should handle whiteboard URL with encoded characters', () => {
      const msg = createWhiteboardMessage({
        whiteboardUrl: 'https://boards.example.com/board/my%20whiteboard.html',
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe(
        'https://boards.example.com/board/my%20whiteboard.html'
      );
    });

    it('should handle very long whiteboard URL', () => {
      const longUrl = 'https://boards.example.com/' + 'a'.repeat(2000);
      const msg = createWhiteboardMessage({ whiteboardUrl: longUrl });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe(longUrl);
    });

    it('should handle message object with no methods at all', () => {
      const msg = {};
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should handle @injected as non-object value', () => {
      const msg = createWhiteboardMessage({ metadata: { '@injected': 'string-value' } });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should handle extensions as non-object value', () => {
      const msg = createWhiteboardMessage({
        metadata: { '@injected': { extensions: 'not-an-object' } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should handle whiteboard as non-object value', () => {
      const msg = createWhiteboardMessage({
        metadata: { '@injected': { extensions: { whiteboard: 'not-an-object' } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('');
    });

    it('should handle metadata with deeply nested but valid structure plus extra keys', () => {
      const msg = createWhiteboardMessage({
        metadata: {
          '@injected': {
            extensions: {
              whiteboard: {
                board_url: 'https://deep.example.com/board',
                extra_field: 'ignored',
              },
              other_extension: { key: 'value' },
            },
            other_injected: 'ignored',
          },
          other_top_level: 'ignored',
        },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['whiteboardUrl']).toBe('https://deep.example.com/board');
    });

    it('should handle whiteboard URL with fragment', () => {
      const msg = createWhiteboardMessage({
        whiteboardUrl: 'https://boards.example.com/board#section-2',
      });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(spy).toHaveBeenCalledWith('https://boards.example.com/board#section-2');
      openSpy.mockRestore();
    });

    it('should reset bannerImageError on processMessage', () => {
      component.message = createWhiteboardMessage();
      fixture.detectChanges();

      // Simulate banner error
      component['bannerImageError'] = true;
      // Re-process via message change
      const msg2 = createWhiteboardMessage({ whiteboardUrl: 'https://example.com/board/2' });
      setMessageAndDetect(fixture, msg2);
      expect(component['bannerImageError']).toBe(false);
    });

    it('should hide banner image section when bannerImageError is true', () => {
      const msg = createWhiteboardMessage();
      setMessageAndDetect(fixture, msg);

      // Trigger the error handler
      component['onBannerImageError']();
      fixture.detectChanges();

      const bannerSection = el.querySelector(
        '.cometchat-collaborative-whiteboard-bubble__banner-image'
      );
      expect(bannerSection).toBeNull();
    });
  });
});
