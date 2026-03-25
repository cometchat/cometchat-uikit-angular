/**
 * CometChatCollaborativeDocumentBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the collaborative document bubble
 * component that renders collaborative document messages by extracting the
 * document URL from message metadata and displaying a banner, title, subtitle,
 * and action button.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, DOM Rendering,
 *             Document URL Extraction, Button Click Events,
 *             Alignment CSS, Keyboard Accessibility,
 *             Null/Empty Handling, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-collaborative-document-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatCollaborativeDocumentBubbleComponent } from './cometchat-collaborative-document-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock CustomMessage with configurable metadata for collaborative
 * document. The component extracts URL from:
 *   metadata["@injected"]["extensions"]["document"]["document_url"]
 */
function createDocumentMessage(options?: {
  documentUrl?: string;
  metadata?: Record<string, any> | null;
}): any {
  if (options?.metadata !== undefined) {
    return { getMetadata: () => options.metadata };
  }
  const url = options?.documentUrl ?? 'https://example.com/document/123';
  return {
    getMetadata: () => ({
      '@injected': {
        extensions: {
          document: { document_url: url },
        },
      },
    }),
  };
}

/**
 * Simulates ngOnChanges for the message input on the component.
 */
function setMessageAndDetect(
  fixture: ComponentFixture<CometChatCollaborativeDocumentBubbleComponent>,
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
  fixture: ComponentFixture<CometChatCollaborativeDocumentBubbleComponent>,
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

describe('CometChatCollaborativeDocumentBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatCollaborativeDocumentBubbleComponent>;
  let component: CometChatCollaborativeDocumentBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatCollaborativeDocumentBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatCollaborativeDocumentBubbleComponent);
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
      // Provide a minimal message to avoid required-input issues
      component.message = createDocumentMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat')).toBeTruthy();
    });

    it('should render the block element .cometchat-collaborative-document-bubble', () => {
      component.message = createDocumentMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-collaborative-document-bubble')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a message input and extract document URL', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://example.com/doc/1' });
      setMessageAndDetect(fixture, msg);
      expect(component.message).toBe(msg);
    });

    it('should accept alignment input as right', () => {
      component.message = createDocumentMessage();
      component.alignment = MessageBubbleAlignment.right;
      fixture.detectChanges();
      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should accept disableInteraction input', () => {
      component.message = createDocumentMessage();
      component.disableInteraction = true;
      fixture.detectChanges();
      expect(component.disableInteraction).toBe(true);
    });

    it('should update when message changes from one valid value to another', () => {
      const msg1 = createDocumentMessage({ documentUrl: 'https://example.com/doc/1' });
      setMessageAndDetect(fixture, msg1);

      const msg2 = createDocumentMessage({ documentUrl: 'https://example.com/doc/2' });
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
  // Document URL Extraction
  // ---------------------------------------------------------------------------
  describe('Document URL Extraction', () => {
    it('should extract URL from metadata["@injected"]["extensions"]["document"]["document_url"]', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://docs.example.com/collab/abc' });
      setMessageAndDetect(fixture, msg);
      // The component stores the extracted URL internally; verify via button enabled state
      expect(component['documentUrl']).toBe('https://docs.example.com/collab/abc');
    });

    it('should return empty string when metadata is null', () => {
      const msg = createDocumentMessage({ metadata: null });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should return empty string when metadata is not an object', () => {
      const msg = { getMetadata: () => 'not-an-object' };
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should return empty string when @injected is missing', () => {
      const msg = createDocumentMessage({ metadata: { someOtherKey: 'value' } });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should return empty string when extensions is missing', () => {
      const msg = createDocumentMessage({ metadata: { '@injected': { noExtensions: true } } });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should return empty string when document key is missing', () => {
      const msg = createDocumentMessage({
        metadata: { '@injected': { extensions: { otherExtension: {} } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should return empty string when document_url is missing', () => {
      const msg = createDocumentMessage({
        metadata: { '@injected': { extensions: { document: { other_key: 'value' } } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should return empty string when document_url is not a string', () => {
      const msg = createDocumentMessage({
        metadata: { '@injected': { extensions: { document: { document_url: 12345 } } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should return empty string when document_url is empty string', () => {
      const msg = createDocumentMessage({
        metadata: { '@injected': { extensions: { document: { document_url: '' } } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the body section with icon and content', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);
      expect(el.querySelector('.cometchat-collaborative-document-bubble__body')).toBeTruthy();
      expect(el.querySelector('.cometchat-collaborative-document-bubble__body-icon')).toBeTruthy();
      expect(
        el.querySelector('.cometchat-collaborative-document-bubble__body-content')
      ).toBeTruthy();
    });

    it('should render the title label', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);
      const nameEl = el.querySelector(
        '.cometchat-collaborative-document-bubble__body-content-name label'
      );
      expect(nameEl).toBeTruthy();
      expect(nameEl!.textContent!.trim()).toBeTruthy();
    });

    it('should render the subtitle label', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);
      const descEl = el.querySelector(
        '.cometchat-collaborative-document-bubble__body-content-description label'
      );
      expect(descEl).toBeTruthy();
      expect(descEl!.textContent!.trim()).toBeTruthy();
    });

    it('should render the action button', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);
      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.textContent!.trim()).toBeTruthy();
    });

    it('should render the banner image section when bannerImage is set', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);
      const bannerSection = el.querySelector(
        '.cometchat-collaborative-document-bubble__banner-image'
      );
      // Banner is shown when bannerImage is truthy and no error
      expect(bannerSection).toBeTruthy();
    });

    it('should set title attribute on the title label', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);
      const nameLabel = el.querySelector(
        '.cometchat-collaborative-document-bubble__body-content-name label'
      ) as HTMLElement;
      expect(nameLabel?.title).toBeTruthy();
    });

    it('should set title attribute on the subtitle label', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);
      const descLabel = el.querySelector(
        '.cometchat-collaborative-document-bubble__body-content-description label'
      ) as HTMLElement;
      expect(descLabel?.title).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Button Click Events
  // ---------------------------------------------------------------------------
  describe('Button Click Events', () => {
    it('should emit buttonClick with document URL on button click', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://docs.example.com/collab/abc' });
      setMessageAndDetect(fixture, msg);

      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      // Stub window.open to prevent actual navigation in test
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(spy).toHaveBeenCalledWith('https://docs.example.com/collab/abc');
      openSpy.mockRestore();
    });

    it('should not emit buttonClick when document URL is empty', () => {
      const msg = createDocumentMessage({ metadata: null });
      setMessageAndDetect(fixture, msg);

      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit the correct URL after message changes', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const msg1 = createDocumentMessage({ documentUrl: 'https://example.com/doc/1' });
      setMessageAndDetect(fixture, msg1);
      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      button.click();
      expect(spy).toHaveBeenCalledWith('https://example.com/doc/1');

      const msg2 = createDocumentMessage({ documentUrl: 'https://example.com/doc/2' });
      setMessageAndDetect(fixture, msg2);
      button.click();
      expect(spy).toHaveBeenCalledWith('https://example.com/doc/2');

      openSpy.mockRestore();
    });

    it('should disable the button when document URL is empty', () => {
      const msg = createDocumentMessage({ metadata: null });
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable the button when document URL is valid', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://example.com/doc' });
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should disable the button when disableInteraction is true', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://example.com/doc' });
      component.disableInteraction = true;
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should call window.open with the document URL on click', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://docs.example.com/collab/abc' });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(openSpy).toHaveBeenCalledWith(
        'https://docs.example.com/collab/abc',
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
      component.message = createDocumentMessage();
      component.alignment = MessageBubbleAlignment.left;
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-collaborative-document-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--incoming')
      ).toBe(true);
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--outgoing')
      ).toBe(false);
    });

    it('should apply outgoing modifier class for right alignment', () => {
      component.message = createDocumentMessage();
      component.alignment = MessageBubbleAlignment.right;
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-collaborative-document-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--outgoing')
      ).toBe(true);
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--incoming')
      ).toBe(false);
    });

    it('should default to incoming (left) alignment', () => {
      component.message = createDocumentMessage();
      fixture.detectChanges();

      const container = el.querySelector('.cometchat-collaborative-document-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--incoming')
      ).toBe(true);
    });

    it('should toggle alignment classes when alignment changes', () => {
      component.message = createDocumentMessage();
      component.alignment = MessageBubbleAlignment.left;
      fixture.detectChanges();

      let container = el.querySelector('.cometchat-collaborative-document-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--incoming')
      ).toBe(true);

      setAlignmentAndDetect(fixture, MessageBubbleAlignment.right);
      container = el.querySelector('.cometchat-collaborative-document-bubble');
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--outgoing')
      ).toBe(true);
      expect(
        container?.classList.contains('cometchat-collaborative-document-bubble--incoming')
      ).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should have aria-label on the action button', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have title attribute on the action button', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button.title).toBeTruthy();
    });

    it('should be natively focusable as a button element', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('should emit buttonClick on Enter keydown', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://example.com/doc' });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      button.dispatchEvent(enterEvent);

      expect(spy).toHaveBeenCalledWith('https://example.com/doc');
      openSpy.mockRestore();
    });

    it('should emit buttonClick on Space keydown', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://example.com/doc' });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      button.dispatchEvent(spaceEvent);

      expect(spy).toHaveBeenCalledWith('https://example.com/doc');
      openSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Null URL Handling
  // ---------------------------------------------------------------------------
  describe('Null URL Handling', () => {
    it('should set empty documentUrl when message is null', () => {
      setMessageAndDetect(fixture, null);
      expect(component['documentUrl']).toBe('');
    });

    it('should set empty documentUrl when message is undefined', () => {
      setMessageAndDetect(fixture, undefined);
      expect(component['documentUrl']).toBe('');
    });

    it('should set empty documentUrl when getMetadata returns undefined', () => {
      const msg = { getMetadata: () => undefined };
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should not throw when getMetadata is not a function', () => {
      const msg = { noMetadataMethod: true };
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component['documentUrl']).toBe('');
    });

    it('should not throw when getMetadata throws an error', () => {
      const msg = {
        getMetadata: () => {
          throw new Error('metadata error');
        },
      };
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component['documentUrl']).toBe('');
    });

    it('should clear documentUrl when message changes from valid to null', () => {
      const msg = createDocumentMessage({ documentUrl: 'https://example.com/doc' });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('https://example.com/doc');

      setMessageAndDetect(fixture, null);
      expect(component['documentUrl']).toBe('');
    });

    it('should disable button when message is null', () => {
      setMessageAndDetect(fixture, null);
      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle document URL with query parameters', () => {
      const msg = createDocumentMessage({
        documentUrl: 'https://docs.example.com/doc?id=123&token=abc',
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('https://docs.example.com/doc?id=123&token=abc');
    });

    it('should handle document URL with encoded characters', () => {
      const msg = createDocumentMessage({
        documentUrl: 'https://docs.example.com/doc/my%20document.html',
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('https://docs.example.com/doc/my%20document.html');
    });

    it('should handle very long document URL', () => {
      const longUrl = 'https://docs.example.com/' + 'a'.repeat(2000);
      const msg = createDocumentMessage({ documentUrl: longUrl });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe(longUrl);
    });

    it('should handle message object with no methods at all', () => {
      const msg = {};
      expect(() => setMessageAndDetect(fixture, msg)).not.toThrow();
      expect(component['documentUrl']).toBe('');
    });

    it('should handle @injected as non-object value', () => {
      const msg = createDocumentMessage({ metadata: { '@injected': 'string-value' } });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should handle extensions as non-object value', () => {
      const msg = createDocumentMessage({
        metadata: { '@injected': { extensions: 'not-an-object' } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should handle document as non-object value', () => {
      const msg = createDocumentMessage({
        metadata: { '@injected': { extensions: { document: 'not-an-object' } } },
      });
      setMessageAndDetect(fixture, msg);
      expect(component['documentUrl']).toBe('');
    });

    it('should handle metadata with deeply nested but valid structure plus extra keys', () => {
      const msg = createDocumentMessage({
        metadata: {
          '@injected': {
            extensions: {
              document: {
                document_url: 'https://deep.example.com/doc',
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
      expect(component['documentUrl']).toBe('https://deep.example.com/doc');
    });

    it('should handle document URL with fragment', () => {
      const msg = createDocumentMessage({
        documentUrl: 'https://docs.example.com/doc#section-2',
      });
      setMessageAndDetect(fixture, msg);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector(
        '.cometchat-collaborative-document-bubble__button'
      ) as HTMLButtonElement;
      button.click();

      expect(spy).toHaveBeenCalledWith('https://docs.example.com/doc#section-2');
      openSpy.mockRestore();
    });

    it('should reset bannerImageError on processMessage', () => {
      component.message = createDocumentMessage();
      fixture.detectChanges();

      // Simulate banner error
      component['bannerImageError'] = true;
      // Re-process via message change
      const msg2 = createDocumentMessage({ documentUrl: 'https://example.com/doc/2' });
      setMessageAndDetect(fixture, msg2);
      expect(component['bannerImageError']).toBe(false);
    });

    it('should hide banner image section when bannerImageError is true', () => {
      const msg = createDocumentMessage();
      setMessageAndDetect(fixture, msg);

      // Trigger the error handler
      component['onBannerImageError']();
      fixture.detectChanges();

      const bannerSection = el.querySelector(
        '.cometchat-collaborative-document-bubble__banner-image'
      );
      expect(bannerSection).toBeNull();
    });
  });
});
