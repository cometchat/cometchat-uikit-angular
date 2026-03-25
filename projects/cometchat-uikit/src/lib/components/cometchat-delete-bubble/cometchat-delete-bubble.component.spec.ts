/**
 * CometChatDeleteBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the delete bubble component that
 * renders deleted message placeholders with sender/receiver styling variants,
 * a delete icon, and localized "This message was deleted" text.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, DOM Rendering,
 *             BEM CSS Structure, Variant Styling, Localization,
 *             Accessibility, Null/Empty Handling, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 3.1, 3.2, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-delete-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatDeleteBubbleComponent } from './cometchat-delete-bubble.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

describe('CometChatDeleteBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatDeleteBubbleComponent>;
  let component: CometChatDeleteBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatDeleteBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatDeleteBubbleComponent);
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

    it('should have default isSentByMe as false', () => {
      expect(component.isSentByMe).toBe(false);
    });

    it('should have default text as undefined', () => {
      expect(component.text).toBeUndefined();
    });

    it('should always render the bubble container (unlike action bubble)', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble')).toBeTruthy();
    });

    it('should default to receiver variant class', () => {
      expect(component.variantClass).toBe('cometchat-delete-bubble--receiver');
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect isSentByMe=true', () => {
      component.isSentByMe = true;
      fixture.detectChanges();

      expect(component.isSentByMe).toBe(true);
      const bubble = el.querySelector('.cometchat-delete-bubble');
      expect(bubble?.classList.contains('cometchat-delete-bubble--sender')).toBe(true);
    });

    it('should accept and reflect isSentByMe=false', () => {
      component.isSentByMe = false;
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-delete-bubble');
      expect(bubble?.classList.contains('cometchat-delete-bubble--receiver')).toBe(true);
    });

    it('should accept custom text input and display it', () => {
      component.text = 'Message removed';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      expect(textEl?.textContent?.trim()).toBe('Message removed');
    });

    it('should update DOM when text changes', () => {
      component.text = 'First text';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe(
        'First text'
      );

      fixture.componentRef.setInput('text', 'Second text');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe(
        'Second text'
      );
    });

    it('should update variant class when isSentByMe toggles', () => {
      component.isSentByMe = false;
      fixture.detectChanges();
      expect(
        el
          .querySelector('.cometchat-delete-bubble')
          ?.classList.contains('cometchat-delete-bubble--receiver')
      ).toBe(true);

      fixture.componentRef.setInput('isSentByMe', true);
      fixture.detectChanges();
      expect(
        el
          .querySelector('.cometchat-delete-bubble')
          ?.classList.contains('cometchat-delete-bubble--sender')
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Deleted Message Text Display & Localization
  // ---------------------------------------------------------------------------
  describe('Deleted Message Text Display', () => {
    it('should display localized "This message was deleted" when no text input', () => {
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      expect(textEl?.textContent?.trim()).toBe('This message was deleted');
    });

    it('should match CometChatLocalize.getLocalizedString("message_deleted")', () => {
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_deleted');
      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      expect(textEl?.textContent?.trim()).toBe(expected);
    });

    it('should display custom text when provided', () => {
      component.text = 'Message removed by admin';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      expect(textEl?.textContent?.trim()).toBe('Message removed by admin');
    });

    it('should fall back to localized text when text is empty string', () => {
      component.text = '';
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_deleted');
      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe(
        expected
      );
    });

    it('should fall back to localized text when text is null', () => {
      component.text = null as any;
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_deleted');
      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe(
        expected
      );
    });

    it('should use custom text with whitespace content (non-empty)', () => {
      component.text = '  spaces  ';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent).toContain('spaces');
    });
  });

  // ---------------------------------------------------------------------------
  // BEM CSS Structure
  // ---------------------------------------------------------------------------
  describe('BEM CSS Structure', () => {
    it('should render the block element .cometchat-delete-bubble', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble')).toBeTruthy();
    });

    it('should render the body element .cometchat-delete-bubble__body', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble__body')).toBeTruthy();
    });

    it('should render the icon element .cometchat-delete-bubble__icon', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble__icon')).toBeTruthy();
    });

    it('should render the text element .cometchat-delete-bubble__text', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble__text')).toBeTruthy();
    });

    it('should apply --sender modifier when isSentByMe is true', () => {
      component.isSentByMe = true;
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-delete-bubble');
      expect(bubble?.classList.contains('cometchat-delete-bubble--sender')).toBe(true);
      expect(bubble?.classList.contains('cometchat-delete-bubble--receiver')).toBe(false);
    });

    it('should apply --receiver modifier when isSentByMe is false', () => {
      component.isSentByMe = false;
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-delete-bubble');
      expect(bubble?.classList.contains('cometchat-delete-bubble--receiver')).toBe(true);
      expect(bubble?.classList.contains('cometchat-delete-bubble--sender')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('should have role="status" on the delete bubble container', () => {
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-delete-bubble');
      expect(bubble?.getAttribute('role')).toBe('status');
    });

    it('should set aria-label to the displayText value', () => {
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-delete-bubble');
      expect(bubble?.getAttribute('aria-label')).toBe('This message was deleted');
    });

    it('should update aria-label when custom text is provided', () => {
      component.text = 'Custom deleted message';
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-delete-bubble');
      expect(bubble?.getAttribute('aria-label')).toBe('Custom deleted message');
    });

    it('should mark the icon as aria-hidden="true"', () => {
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-delete-bubble__icon');
      expect(iconEl?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should update aria-label when text changes', () => {
      component.text = 'First';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble')?.getAttribute('aria-label')).toBe(
        'First'
      );

      fixture.componentRef.setInput('text', 'Second');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble')?.getAttribute('aria-label')).toBe(
        'Second'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Null / Empty Handling
  // ---------------------------------------------------------------------------
  describe('Null / Empty Handling', () => {
    it('should not throw when text is null', () => {
      expect(() => {
        component.text = null as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not throw when text is undefined', () => {
      expect(() => {
        component.text = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should still render the bubble when text is null (always renders)', () => {
      component.text = null as any;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-delete-bubble')).toBeTruthy();
    });

    it('should still render the bubble when text is empty string', () => {
      component.text = '';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-delete-bubble')).toBeTruthy();
    });

    it('should recover from null to valid custom text', () => {
      component.text = null as any;
      fixture.detectChanges();
      const localized = CometChatLocalize.getLocalizedString('message_deleted');
      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe(
        localized
      );

      fixture.componentRef.setInput('text', 'Recovered');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe(
        'Recovered'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle very long custom text without throwing', () => {
      const longText = 'A'.repeat(10000);
      component.text = longText;

      expect(() => fixture.detectChanges()).not.toThrow();

      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      expect(textEl?.textContent).toContain('AAAA');
    });

    it('should handle text with HTML-like content safely', () => {
      component.text = '<script>alert("xss")</script>';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      // Angular template interpolation escapes HTML by default
      expect(textEl?.innerHTML).not.toContain('<script>');
      expect(textEl?.textContent).toContain('<script>');
    });

    it('should handle unicode characters', () => {
      component.text = '此消息已被删除 🗑️';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      expect(textEl?.textContent?.trim()).toBe('此消息已被删除 🗑️');
    });

    it('should handle emoji-only text', () => {
      component.text = '🗑️';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-delete-bubble')).toBeTruthy();
      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe('🗑️');
    });

    it('should handle simultaneous custom text and sender variant', () => {
      component.text = 'Custom deleted';
      component.isSentByMe = true;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-delete-bubble__text')?.textContent?.trim()).toBe(
        'Custom deleted'
      );
      expect(
        el
          .querySelector('.cometchat-delete-bubble')
          ?.classList.contains('cometchat-delete-bubble--sender')
      ).toBe(true);
    });

    it('should handle zero-width space character as custom text', () => {
      // Zero-width space (U+200B) has length > 0, treated as custom text
      component.text = '\u200B';
      fixture.detectChanges();

      expect(component.displayText).toBe('\u200B');
    });

    it('should handle text with newlines', () => {
      component.text = 'Line 1\nLine 2';
      fixture.detectChanges();

      expect(component.displayText).toBe('Line 1\nLine 2');
    });

    it('should handle single space as custom text', () => {
      // Single space has length > 0, so it's treated as custom text
      component.text = ' ';
      fixture.detectChanges();

      expect(component.displayText).toBe(' ');
    });
  });
});
