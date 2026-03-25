/**
 * CometChatActionBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the action bubble component that
 * renders action/system messages (e.g., "User joined the group") with a
 * centered, pill-shaped appearance and optional call-status icons.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, DOM Rendering,
 *             BEM CSS Structure, Icon Display, Accessibility,
 *             Null/Empty Handling, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-action-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatActionBubbleComponent } from './cometchat-action-bubble.component';

describe('CometChatActionBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatActionBubbleComponent>;
  let component: CometChatActionBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatActionBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatActionBubbleComponent);
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

    it('should have default messageText as empty string', () => {
      expect(component.messageText).toBe('');
    });

    it('should have default iconUrl as empty string', () => {
      expect(component.iconUrl).toBe('');
    });

    it('should have default iconErrorColor as false', () => {
      expect(component.iconErrorColor).toBe(false);
    });

    it('should not render the bubble when messageText is empty (default)', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect messageText input', () => {
      component.messageText = 'User joined the group';
      fixture.detectChanges();

      expect(component.messageText).toBe('User joined the group');
      const textEl = el.querySelector('.cometchat-action-bubble__text');
      expect(textEl?.textContent?.trim()).toBe('User joined the group');
    });

    it('should update DOM when messageText changes', () => {
      component.messageText = 'First action';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble__text')?.textContent?.trim()).toBe(
        'First action'
      );

      fixture.componentRef.setInput('messageText', 'Second action');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble__text')?.textContent?.trim()).toBe(
        'Second action'
      );
    });

    it('should accept iconUrl input and show icon element', () => {
      component.messageText = 'Outgoing Call';
      component.iconUrl = 'assets/outgoing_video_no_fill.svg';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble__icon')).toBeTruthy();
    });

    it('should accept iconErrorColor input and apply error modifier class', () => {
      component.messageText = 'Missed Call';
      component.iconUrl = 'assets/missed_call.svg';
      component.iconErrorColor = true;
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-action-bubble__icon');
      expect(iconEl?.classList.contains('cometchat-action-bubble__icon--error')).toBe(true);
    });

    it('should not apply error modifier class when iconErrorColor is false', () => {
      component.messageText = 'Outgoing Call';
      component.iconUrl = 'assets/outgoing_video_no_fill.svg';
      component.iconErrorColor = false;
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-action-bubble__icon');
      expect(iconEl?.classList.contains('cometchat-action-bubble__icon--error')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering — Action Text Display
  // ---------------------------------------------------------------------------
  describe('Action Text Display', () => {
    it('should display the action message text in the DOM', () => {
      component.messageText = 'User left the group';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-action-bubble__text');
      expect(textEl).toBeTruthy();
      expect(textEl?.textContent?.trim()).toBe('User left the group');
    });

    it('should render various action message types correctly', () => {
      const actionMessages = [
        'User joined the group',
        'User left the group',
        'Group name changed to Test Group',
        'User was kicked',
        'User was banned',
      ];

      component.messageText = actionMessages[0];
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble__text')?.textContent?.trim()).toBe(
        actionMessages[0]
      );

      for (let i = 1; i < actionMessages.length; i++) {
        fixture.componentRef.setInput('messageText', actionMessages[i]);
        fixture.detectChanges();

        const textEl = el.querySelector('.cometchat-action-bubble__text');
        expect(textEl?.textContent?.trim()).toBe(actionMessages[i]);
      }
    });

    it('should render the bubble container when messageText has content', () => {
      component.messageText = 'Some action';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();
    });

    it('should hide the bubble container when messageText becomes empty', () => {
      component.messageText = 'Visible';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();

      fixture.componentRef.setInput('messageText', '');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // BEM CSS Structure
  // ---------------------------------------------------------------------------
  describe('BEM CSS Structure', () => {
    it('should render the block element .cometchat-action-bubble', () => {
      component.messageText = 'BEM test';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();
    });

    it('should render the text element .cometchat-action-bubble__text', () => {
      component.messageText = 'Text element';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble__text')).toBeTruthy();
    });

    it('should render the icon element .cometchat-action-bubble__icon when iconUrl is set', () => {
      component.messageText = 'Call action';
      component.iconUrl = 'assets/call.svg';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble__icon')).toBeTruthy();
    });

    it('should not render the icon element when iconUrl is empty', () => {
      component.messageText = 'No icon';
      component.iconUrl = '';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble__icon')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Icon Display
  // ---------------------------------------------------------------------------
  describe('Icon Display', () => {
    it('should apply mask styles to the icon element', () => {
      component.messageText = 'Outgoing Call';
      component.iconUrl = 'assets/outgoing_video_no_fill.svg';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-action-bubble__icon') as HTMLElement;
      expect(iconEl).toBeTruthy();
      // ngStyle applies the mask styles
      const style = iconEl.style;
      expect(style.getPropertyValue('mask') || style.getPropertyValue('-webkit-mask')).toContain(
        'outgoing_video_no_fill.svg'
      );
    });

    it('should not show icon when iconUrl is whitespace only', () => {
      component.messageText = 'Action';
      component.iconUrl = '   ';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble__icon')).toBeNull();
    });

    it('should toggle error modifier when iconErrorColor changes', () => {
      component.messageText = 'Missed Call';
      component.iconUrl = 'assets/missed_call.svg';
      component.iconErrorColor = false;
      fixture.detectChanges();

      let iconEl = el.querySelector('.cometchat-action-bubble__icon');
      expect(iconEl?.classList.contains('cometchat-action-bubble__icon--error')).toBe(false);

      fixture.componentRef.setInput('iconErrorColor', true);
      fixture.detectChanges();

      iconEl = el.querySelector('.cometchat-action-bubble__icon');
      expect(iconEl?.classList.contains('cometchat-action-bubble__icon--error')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('should have role="status" on the action bubble container', () => {
      component.messageText = 'User joined';
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-action-bubble');
      expect(bubble?.getAttribute('role')).toBe('status');
    });

    it('should set aria-label to the messageText value', () => {
      component.messageText = 'Group name changed to New Group';
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-action-bubble');
      expect(bubble?.getAttribute('aria-label')).toBe('Group name changed to New Group');
    });

    it('should update aria-label when messageText changes', () => {
      component.messageText = 'First';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble')?.getAttribute('aria-label')).toBe(
        'First'
      );

      fixture.componentRef.setInput('messageText', 'Second');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble')?.getAttribute('aria-label')).toBe(
        'Second'
      );
    });

    it('should mark icon as aria-hidden="true"', () => {
      component.messageText = 'Missed Call';
      component.iconUrl = 'assets/missed_call.svg';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-action-bubble__icon');
      expect(iconEl?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should not render any ARIA container when shouldRender is false', () => {
      component.messageText = '';
      fixture.detectChanges();

      expect(el.querySelector('[role="status"]')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Null / Empty Message Handling
  // ---------------------------------------------------------------------------
  describe('Null / Empty Message Handling', () => {
    it('should not render when messageText is null', () => {
      component.messageText = null as any;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeNull();
      expect(component.shouldRender).toBe(false);
    });

    it('should not render when messageText is undefined', () => {
      component.messageText = undefined as any;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeNull();
      expect(component.shouldRender).toBe(false);
    });

    it('should not throw when messageText is set to null', () => {
      expect(() => {
        component.messageText = null as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not render when messageText is whitespace only', () => {
      component.messageText = '   \t\n  ';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeNull();
    });

    it('should recover from null to valid messageText', () => {
      component.messageText = null as any;
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble')).toBeNull();

      fixture.componentRef.setInput('messageText', 'Recovered');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();
      expect(el.querySelector('.cometchat-action-bubble__text')?.textContent?.trim()).toBe(
        'Recovered'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle very long messageText without throwing', () => {
      const longText = 'A'.repeat(10000);
      component.messageText = longText;

      expect(() => fixture.detectChanges()).not.toThrow();

      const textEl = el.querySelector('.cometchat-action-bubble__text');
      expect(textEl?.textContent).toContain('AAAA');
    });

    it('should handle text with HTML-like content safely', () => {
      component.messageText = '<script>alert("xss")</script>';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-action-bubble__text');
      // Angular's template interpolation escapes HTML by default
      expect(textEl?.innerHTML).not.toContain('<script>');
      expect(textEl?.textContent).toContain('<script>');
    });

    it('should handle unicode characters', () => {
      component.messageText = '用户加入了群组 🎉';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-action-bubble__text');
      expect(textEl?.textContent?.trim()).toBe('用户加入了群组 🎉');
    });

    it('should handle emoji-only messageText', () => {
      component.messageText = '👋';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();
      expect(el.querySelector('.cometchat-action-bubble__text')?.textContent?.trim()).toBe('👋');
    });

    it('should handle simultaneous messageText, iconUrl, and iconErrorColor', () => {
      component.messageText = 'Missed Call';
      component.iconUrl = 'assets/missed_call.svg';
      component.iconErrorColor = true;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();
      expect(el.querySelector('.cometchat-action-bubble__text')?.textContent?.trim()).toBe(
        'Missed Call'
      );
      expect(el.querySelector('.cometchat-action-bubble__icon')).toBeTruthy();
      expect(
        el
          .querySelector('.cometchat-action-bubble__icon')
          ?.classList.contains('cometchat-action-bubble__icon--error')
      ).toBe(true);
    });

    it('should handle iconUrl with query parameters', () => {
      component.messageText = 'Call';
      component.iconUrl = 'https://cdn.example.com/icon.svg?v=2&size=20';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-action-bubble__icon') as HTMLElement;
      expect(iconEl).toBeTruthy();
    });

    it('should handle messageText with leading/trailing whitespace but valid content', () => {
      component.messageText = '  User joined  ';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();
      // The text is rendered as-is (with whitespace), but the bubble renders
      expect(el.querySelector('.cometchat-action-bubble__text')?.textContent).toContain(
        'User joined'
      );
    });

    it('should handle zero-width space character in messageText', () => {
      // Zero-width space (U+200B) — trim() does NOT remove it
      component.messageText = '\u200B';
      fixture.detectChanges();

      // shouldRender is true because trim().length > 0
      expect(component.shouldRender).toBe(true);
      expect(el.querySelector('.cometchat-action-bubble')).toBeTruthy();
    });
  });
});
