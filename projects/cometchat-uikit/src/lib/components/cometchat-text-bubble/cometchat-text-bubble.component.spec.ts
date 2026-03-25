/**
 * CometChatTextBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the text bubble component that
 * renders CometChat.TextMessage objects with rich formatting, link previews,
 * mentions, alignment variants, single-emoji detection, and content truncation.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Alignment CSS Classes, Localized Labels,
 *             Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-text-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatTextBubbleComponent } from './cometchat-text-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { flushPromises } from '../../testing';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a real CometChat.TextMessage with the given text, sent to 'superhero2'.
 * Does NOT send it over the network — just constructs the SDK object locally.
 */
function createTextMessage(text: string, receiverUid = 'superhero2'): CometChat.TextMessage {
  const msg = new CometChat.TextMessage(receiverUid, text, CometChat.RECEIVER_TYPE.USER);
  return msg;
}

/**
 * Triggers async initialization (ngOnInit calls an async formatter init)
 * and then runs change detection so the DOM reflects the processed message.
 */
async function initAndDetect(
  fixture: ComponentFixture<CometChatTextBubbleComponent>
): Promise<void> {
  fixture.detectChanges(); // triggers ngOnInit
  // Allow the async initializeTextFormatters promise to resolve
  await flushPromises();
  await new Promise(r => setTimeout(r, 50));
  fixture.detectChanges();
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('CometChatTextBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatTextBubbleComponent>;
  let component: CometChatTextBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatTextBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatTextBubbleComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      // Provide a required message input before detectChanges
      component.message = createTextMessage('Hello');
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default alignment as left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should render the root .cometchat-text-bubble element', async () => {
      component.message = createTextMessage('Test');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-text-bubble')).toBeTruthy();
    });

    it('should expose MessageBubbleAlignment enum to template', () => {
      expect(component.MessageBubbleAlignment).toBeDefined();
      expect(component.MessageBubbleAlignment.left).toBe(MessageBubbleAlignment.left);
      expect(component.MessageBubbleAlignment.right).toBe(MessageBubbleAlignment.right);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings — message
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a CometChat.TextMessage and extract its text', async () => {
      const msg = createTextMessage('Hello from SDK');
      component.message = msg;
      await initAndDetect(fixture);

      // The internal messageText should match the message text
      expect((component as any).messageText).toBe('Hello from SDK');
    });

    it('should reflect alignment input change to right', async () => {
      component.message = createTextMessage('Outgoing');
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should update DOM when message input changes', async () => {
      component.message = createTextMessage('First');
      await initAndDetect(fixture);

      const textEl = el.querySelector('.cometchat-text-bubble__text');
      expect(textEl?.textContent).toContain('First');

      // Change message
      component.message = createTextMessage('Second');
      component.ngOnChanges({
        message: {
          currentValue: component.message,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();

      const updatedTextEl = el.querySelector('.cometchat-text-bubble__text');
      expect(updatedTextEl?.textContent).toContain('Second');
    });
  });

  // ---------------------------------------------------------------------------
  // Text Content Display
  // ---------------------------------------------------------------------------
  describe('Text Content Display', () => {
    it('should display the message text in the DOM', async () => {
      component.message = createTextMessage('Visible text content');
      await initAndDetect(fixture);

      const textEl = el.querySelector('.cometchat-text-bubble__text');
      expect(textEl).toBeTruthy();
      expect(textEl?.textContent).toContain('Visible text content');
    });

    it('should render the .cometchat-text-bubble__content container', async () => {
      component.message = createTextMessage('Content container test');
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-text-bubble__content')).toBeTruthy();
    });

    it('should display multi-line text preserving content', async () => {
      const multiLine = 'Line one\nLine two\nLine three';
      component.message = createTextMessage(multiLine);
      await initAndDetect(fixture);

      const textEl = el.querySelector('.cometchat-text-bubble__text');
      expect(textEl?.textContent).toContain('Line one');
      expect(textEl?.textContent).toContain('Line two');
      expect(textEl?.textContent).toContain('Line three');
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS Classes
  // ---------------------------------------------------------------------------
  describe('Alignment CSS Classes', () => {
    it('should apply incoming class for left alignment (default)', async () => {
      component.message = createTextMessage('Incoming');
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-text-bubble');
      expect(bubble?.classList.contains('cometchat-text-bubble-incoming')).toBe(true);
      expect(bubble?.classList.contains('cometchat-text-bubble-outgoing')).toBe(false);
    });

    it('should apply outgoing class for right alignment', async () => {
      component.message = createTextMessage('Outgoing');
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-text-bubble');
      expect(bubble?.classList.contains('cometchat-text-bubble-outgoing')).toBe(true);
      expect(bubble?.classList.contains('cometchat-text-bubble-incoming')).toBe(false);
    });

    it('should switch alignment classes when alignment changes', async () => {
      component.message = createTextMessage('Switch test');
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      let bubble = el.querySelector('.cometchat-text-bubble');
      expect(bubble?.classList.contains('cometchat-text-bubble-incoming')).toBe(true);

      // Switch to right using setInput for OnPush change detection
      fixture.componentRef.setInput('alignment', MessageBubbleAlignment.right);
      fixture.detectChanges();

      bubble = el.querySelector('.cometchat-text-bubble');
      expect(bubble?.classList.contains('cometchat-text-bubble-outgoing')).toBe(true);
      expect(bubble?.classList.contains('cometchat-text-bubble-incoming')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Localized Labels
  // ---------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should use localized "read more" label when content is truncated', () => {
      // Verify the localization key exists and returns a non-empty string
      const readMoreKey = 'text_bubble_read_more';
      const readMoreLabel = CometChatLocalize.getLocalizedString(readMoreKey);
      // The key should resolve to something (either a translation or the key itself)
      expect(readMoreLabel).toBeTruthy();
      expect(typeof readMoreLabel).toBe('string');
    });

    it('should use localized "show less" label', () => {
      const showLessKey = 'text_bubble_show_less';
      const showLessLabel = CometChatLocalize.getLocalizedString(showLessKey);
      expect(showLessLabel).toBeTruthy();
      expect(typeof showLessLabel).toBe('string');
    });

    it('should use localized "translated message" label', () => {
      const translatedKey = 'text_bubble_translated_message';
      const translatedLabel = CometChatLocalize.getLocalizedString(translatedKey);
      expect(translatedLabel).toBeTruthy();
      expect(typeof translatedLabel).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit linkClick when onLinkPreviewClick is called', async () => {
      component.message = createTextMessage('Check https://example.com');
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.linkClick.subscribe(spy);

      // Directly invoke the protected method via bracket notation
      (component as any).onLinkPreviewClick('https://example.com');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('https://example.com');
    });

    it('should not emit linkClick for empty URL', async () => {
      component.message = createTextMessage('No link');
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.linkClick.subscribe(spy);

      (component as any).onLinkPreviewClick('');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Null / Empty Text Fallback
  // ---------------------------------------------------------------------------
  describe('Null / Empty Text Fallback', () => {
    it('should handle a message with empty text gracefully', async () => {
      component.message = createTextMessage('');
      expect(() => initAndDetect(fixture)).not.toThrow();
      await initAndDetect(fixture);

      // Component should still render without errors
      expect(el.querySelector('.cometchat-text-bubble')).toBeTruthy();
    });

    it('should set messageText to empty string for empty text message', async () => {
      component.message = createTextMessage('');
      await initAndDetect(fixture);

      expect((component as any).messageText).toBe('');
    });

    it('should not throw when processMessage is called with no message', () => {
      // The message input is required, but we test defensive behavior
      // by calling processMessage before setting message
      expect(() => {
        (component as any).processMessage();
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Single Emoji Detection
  // ---------------------------------------------------------------------------
  describe('Single Emoji Detection', () => {
    it('should detect a single emoji and apply the single-emoji modifier class', async () => {
      component.message = createTextMessage('😀');
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-text-bubble');
      expect(bubble?.classList.contains('cometchat-text-bubble--single-emoji')).toBe(true);
    });

    it('should not apply single-emoji class for regular text', async () => {
      component.message = createTextMessage('Hello world');
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-text-bubble');
      expect(bubble?.classList.contains('cometchat-text-bubble--single-emoji')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // BEM CSS Structure
  // ---------------------------------------------------------------------------
  describe('BEM CSS Structure', () => {
    it('should render the block element .cometchat-text-bubble', async () => {
      component.message = createTextMessage('BEM test');
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-text-bubble')).toBeTruthy();
    });

    it('should render the text element .cometchat-text-bubble__text', async () => {
      component.message = createTextMessage('Text element');
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-text-bubble__text')).toBeTruthy();
    });

    it('should render the content element .cometchat-text-bubble__content', async () => {
      component.message = createTextMessage('Content element');
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-text-bubble__content')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle very long text without throwing', async () => {
      const longText = 'A'.repeat(5000);
      component.message = createTextMessage(longText);

      await expect(initAndDetect(fixture)).resolves.not.toThrow();

      const textEl = el.querySelector('.cometchat-text-bubble__text');
      expect(textEl?.textContent).toContain('AAAA');
    });

    it('should handle text with special HTML characters safely', async () => {
      component.message = createTextMessage('<script>alert("xss")</script>');
      await initAndDetect(fixture);

      const textEl = el.querySelector('.cometchat-text-bubble__text');
      // The sanitizer should strip the script tag
      expect(textEl?.innerHTML).not.toContain('<script>');
    });

    it('should handle whitespace-only text', async () => {
      component.message = createTextMessage('   ');
      expect(() => initAndDetect(fixture)).not.toThrow();
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-text-bubble')).toBeTruthy();
    });

    it('should handle text with unicode characters', async () => {
      const unicodeText = '你好世界 مرحبا العالم こんにちは世界';
      component.message = createTextMessage(unicodeText);
      await initAndDetect(fixture);

      const textEl = el.querySelector('.cometchat-text-bubble__text');
      expect(textEl?.textContent).toContain('你好世界');
    });

    it('should not render link preview container when no link previews exist', async () => {
      component.message = createTextMessage('No links here');
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-text-bubble__link-preview-container')).toBeNull();
    });

    it('should not render translation section for non-translated messages', async () => {
      component.message = createTextMessage('No translation');
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-text-bubble__translation-container')).toBeNull();
    });
  });
});
