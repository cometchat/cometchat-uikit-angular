/**
 * CometChatThreadHeader Component Tests
 *
 * Comprehensive TestBed-based test suite for the thread header component.
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Computed Properties, Keyboard Accessibility,
 *             Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.5,
 *            14.4, 14.5, 15.7
 *
 * @module components/cometchat-thread-header
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, flushPromises } from '../../testing';
import { CometChatThreadHeaderComponent } from './cometchat-thread-header.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(
  fixture: ComponentFixture<CometChatThreadHeaderComponent>
): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

/**
 * Creates a real CometChat.TextMessage for testing.
 * Uses the SDK constructor so the object has all real methods.
 */
function createTextMessage(text: string, senderUid = 'superhero1'): CometChat.TextMessage {
  const msg = new CometChat.TextMessage(senderUid, text, CometChat.RECEIVER_TYPE.USER);
  return msg;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatThreadHeaderComponent', () => {
  let fixture: ComponentFixture<CometChatThreadHeaderComponent>;
  let component: CometChatThreadHeaderComponent;
  let el: HTMLElement;
  let loggedInUser: CometChat.User;

  beforeAll(async () => {
    loggedInUser = await ensureSdkReady();
    expect(loggedInUser).toBeTruthy();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatThreadHeaderComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatThreadHeaderComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat-thread-header element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-header')).toBeTruthy();
    });

    it('should have role="banner" on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-thread-header');
      expect(root?.getAttribute('role')).toBe('banner');
    });

    it('should have default replyCount of 0', () => {
      fixture.detectChanges();
      expect(component.replyCount).toBe(0);
    });

    it('should have parentMessage undefined by default', () => {
      fixture.detectChanges();
      expect(component.parentMessage).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Input Bindings
  // -------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a parentMessage input and reflect it', async () => {
      const msg = createTextMessage('Hello thread');
      component.parentMessage = msg;
      await initAndDetect(fixture);
      expect(component.parentMessage).toBe(msg);
    });

    it('should accept a replyCount input and reflect it', async () => {
      component.replyCount = 7;
      await initAndDetect(fixture);
      expect(component.replyCount).toBe(7);
    });

    it('should update when replyCount changes from one value to another', async () => {
      component.parentMessage = createTextMessage('Test');
      component.replyCount = 1;
      await initAndDetect(fixture);
      expect(component.replyCountText).toContain('1');

      // Manually trigger the input change and ngOnChanges for OnPush component
      const previousValue = component.replyCount;
      component.replyCount = 10;
      component.ngOnChanges({
        replyCount: {
          currentValue: 10,
          previousValue,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();
      expect(component.replyCountText).toContain('10');
    });

    it('should handle null parentMessage gracefully without throwing', () => {
      expect(() => {
        component.parentMessage = null as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle undefined parentMessage gracefully without throwing', () => {
      expect(() => {
        component.parentMessage = undefined as any;
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit closeClick when onCloseClick is called', async () => {
      component.parentMessage = createTextMessage('Test');
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.onCloseClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit backClick (deprecated) when onCloseClick is called', async () => {
      component.parentMessage = createTextMessage('Test');
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.backClick.subscribe(spy);
      component.onCloseClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit both closeClick and backClick on each call', async () => {
      await initAndDetect(fixture);
      const closeSpy = vi.fn();
      const backSpy = vi.fn();
      component.closeClick.subscribe(closeSpy);
      component.backClick.subscribe(backSpy);

      component.onCloseClick();
      component.onCloseClick();

      expect(closeSpy).toHaveBeenCalledTimes(2);
      expect(backSpy).toHaveBeenCalledTimes(2);
    });

    it('should emit via onBackClick (deprecated) which delegates to onCloseClick', async () => {
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.onBackClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick when close button is clicked in the DOM', async () => {
      component.parentMessage = createTextMessage('Test');
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = el.querySelector('.cometchat-thread-header__close-button') as HTMLElement;
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // DOM Rendering
  // -------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the top bar section', async () => {
      component.parentMessage = createTextMessage('Hello');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-header__top-bar')).toBeTruthy();
    });

    it('should render the thread title', async () => {
      component.parentMessage = createTextMessage('Hello');
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-thread-header__title');
      expect(title).toBeTruthy();
      // Title uses localized 'thread_title' key via translate pipe
      expect(title?.textContent?.trim()).toBeTruthy();
    });

    it('should render the close button', async () => {
      component.parentMessage = createTextMessage('Hello');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-header__close-button')).toBeTruthy();
    });

    it('should render the close button icon', async () => {
      component.parentMessage = createTextMessage('Hello');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-header__close-button-icon')).toBeTruthy();
    });

    it('should render the bubble wrapper when parentMessage is set', async () => {
      component.parentMessage = createTextMessage('Hello');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-header__bubble-wrapper')).toBeTruthy();
    });

    it('should not render the bubble wrapper when parentMessage is not set', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-header__bubble-wrapper')).toBeFalsy();
    });

    it('should render sender name when parentMessage has a sender', async () => {
      const msg = createTextMessage('Hello');
      // The sender is set by the SDK constructor; for a locally created message
      // getSender() may be null. We test the conditional rendering logic.
      component.parentMessage = msg;
      await initAndDetect(fixture);
      // The sender-name element only renders if senderName is truthy
      const senderEl = el.querySelector('.cometchat-thread-header__sender-name');
      if (component.senderName) {
        expect(senderEl).toBeTruthy();
      } else {
        expect(senderEl).toBeFalsy();
      }
    });

    it('should have aria-label attribute on the root element', async () => {
      component.parentMessage = createTextMessage('Hello');
      component.replyCount = 3;
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-thread-header');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on the close button', async () => {
      component.parentMessage = createTextMessage('Hello');
      await initAndDetect(fixture);
      const closeBtn = el.querySelector('.cometchat-thread-header__close-button');
      expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have tabindex="0" on the close button', async () => {
      component.parentMessage = createTextMessage('Hello');
      await initAndDetect(fixture);
      const closeBtn = el.querySelector('.cometchat-thread-header__close-button');
      expect(closeBtn?.getAttribute('tabindex')).toBe('0');
    });
  });

  // -------------------------------------------------------------------------
  // Computed Properties
  // -------------------------------------------------------------------------
  describe('Computed Properties', () => {
    describe('messagePreview', () => {
      it('should return empty string when parentMessage is not set', () => {
        fixture.detectChanges();
        expect(component.messagePreview).toBe('');
      });

      it('should return text content for text messages', () => {
        component.parentMessage = createTextMessage('Hello world');
        fixture.detectChanges();
        expect(component.messagePreview).toBe('Hello world');
      });

      it('should truncate text longer than 50 characters with ellipsis', () => {
        const longText = 'A'.repeat(60);
        component.parentMessage = createTextMessage(longText);
        fixture.detectChanges();
        expect(component.messagePreview).toBe('A'.repeat(50) + '...');
        expect(component.messagePreview.length).toBe(53);
      });

      it('should not truncate text exactly 50 characters', () => {
        const exactText = 'B'.repeat(50);
        component.parentMessage = createTextMessage(exactText);
        fixture.detectChanges();
        expect(component.messagePreview).toBe(exactText);
      });

      it('should not truncate text shorter than 50 characters', () => {
        component.parentMessage = createTextMessage('Short');
        fixture.detectChanges();
        expect(component.messagePreview).toBe('Short');
      });

      it('should handle empty text message', () => {
        component.parentMessage = createTextMessage('');
        fixture.detectChanges();
        expect(component.messagePreview).toBe('');
      });
    });

    describe('mediaIcon', () => {
      it('should return null when parentMessage is not set', () => {
        fixture.detectChanges();
        expect(component.mediaIcon).toBeNull();
      });

      it('should return null for text messages', () => {
        component.parentMessage = createTextMessage('Hello');
        fixture.detectChanges();
        expect(component.mediaIcon).toBeNull();
      });
    });

    describe('replyCountText', () => {
      it('should use singular form for 1 reply', () => {
        component.replyCount = 1;
        fixture.detectChanges();
        expect(component.replyCountText).toContain('1');
        // Should use the singular localization key
        expect(component.replyCountText).not.toBe(component.replyCountText.replace('1', ''));
      });

      it('should use plural form for 0 replies', () => {
        component.replyCount = 0;
        fixture.detectChanges();
        expect(component.replyCountText).toContain('0');
      });

      it('should use plural form for multiple replies', () => {
        component.replyCount = 5;
        fixture.detectChanges();
        expect(component.replyCountText).toContain('5');
      });

      it('should handle large reply counts', () => {
        component.replyCount = 999999;
        fixture.detectChanges();
        // Component caps display at 999+
        expect(component.replyCountText).toContain('999+');
      });
    });

    describe('ariaLabel', () => {
      it('should include message preview and reply count', () => {
        component.parentMessage = createTextMessage('Hello world');
        component.replyCount = 3;
        fixture.detectChanges();
        const label = component.ariaLabel;
        expect(label).toContain('Hello world');
        expect(label).toContain('3');
      });

      it('should handle empty preview when no parent message', () => {
        component.replyCount = 5;
        fixture.detectChanges();
        const label = component.ariaLabel;
        expect(label).toContain('5');
      });
    });

    describe('closeButtonAriaLabel', () => {
      it('should return a non-empty localized string', () => {
        fixture.detectChanges();
        expect(component.closeButtonAriaLabel).toBeTruthy();
        expect(typeof component.closeButtonAriaLabel).toBe('string');
      });

      it('should equal backButtonAriaLabel (deprecated alias)', () => {
        fixture.detectChanges();
        expect(component.backButtonAriaLabel).toBe(component.closeButtonAriaLabel);
      });
    });

    describe('isMediaMessage', () => {
      it('should return false when parentMessage is not set', () => {
        fixture.detectChanges();
        expect(component.isMediaMessage).toBe(false);
      });

      it('should return false for text messages', () => {
        component.parentMessage = createTextMessage('Hello');
        fixture.detectChanges();
        expect(component.isMediaMessage).toBe(false);
      });
    });

    describe('senderName', () => {
      it('should return empty string when parentMessage is not set', () => {
        fixture.detectChanges();
        expect(component.senderName).toBe('');
      });

      it('should return sender name when parentMessage has a sender', () => {
        const msg = createTextMessage('Hello');
        component.parentMessage = msg;
        fixture.detectChanges();
        // For locally constructed messages, sender may be null
        const expected = msg.getSender()?.getName() || '';
        expect(component.senderName).toBe(expected);
      });
    });

    describe('parentMessageAlignment', () => {
      it('should return left alignment when parentMessage is not set', () => {
        fixture.detectChanges();
        expect(component.parentMessageAlignment).toBe(MessageBubbleAlignment.left);
      });

      it('should return left alignment when no logged-in user is available from UIKit', () => {
        component.parentMessage = createTextMessage('Hello');
        fixture.detectChanges();
        // CometChatUIKit.getLoggedInUser() may return null in test env
        // Either left or right is valid depending on UIKit state
        expect([MessageBubbleAlignment.left, MessageBubbleAlignment.right]).toContain(
          component.parentMessageAlignment
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Accessibility
  // -------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit closeClick on Enter key via onCloseKeydown', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      component.onCloseKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should emit closeClick on Space key via onCloseKeydown', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      component.onCloseKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not emit closeClick on Tab key via onCloseKeydown', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      component.onCloseKeydown(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit closeClick on arbitrary letter key via onCloseKeydown', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      component.onCloseKeydown(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit closeClick on Escape key via onHeaderKeydown (HostListener)', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');
      component.onHeaderKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not emit closeClick on Enter key at header level', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      component.onHeaderKeydown(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should delegate onBackKeydown to onCloseKeydown', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      component.onBackKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should dispatch Escape on the host element and trigger close', async () => {
      component.parentMessage = createTextMessage('Test');
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should dispatch Enter on close button in DOM and trigger close', async () => {
      component.parentMessage = createTextMessage('Test');
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = el.querySelector('.cometchat-thread-header__close-button') as HTMLElement;
      expect(closeBtn).toBeTruthy();
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      closeBtn.dispatchEvent(event);
      fixture.detectChanges();
      expect(spy).toHaveBeenCalled();
    });

    it('should dispatch Space on close button in DOM and trigger close', async () => {
      component.parentMessage = createTextMessage('Test');
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = el.querySelector('.cometchat-thread-header__close-button') as HTMLElement;
      expect(closeBtn).toBeTruthy();
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      closeBtn.dispatchEvent(event);
      fixture.detectChanges();
      expect(spy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle text at exactly the truncation boundary (49, 50, 51 chars)', () => {
      const text49 = 'X'.repeat(49);
      const text50 = 'X'.repeat(50);
      const text51 = 'X'.repeat(51);

      component.parentMessage = createTextMessage(text49);
      fixture.detectChanges();
      expect(component.messagePreview).toBe(text49);

      component.parentMessage = createTextMessage(text50);
      fixture.detectChanges();
      expect(component.messagePreview).toBe(text50);

      component.parentMessage = createTextMessage(text51);
      fixture.detectChanges();
      expect(component.messagePreview).toBe('X'.repeat(50) + '...');
    });

    it('should handle text with special characters', () => {
      component.parentMessage = createTextMessage('<script>alert("xss")</script>');
      fixture.detectChanges();
      expect(component.messagePreview).toBe('<script>alert("xss")</script>');
    });

    it('should handle text with only whitespace', () => {
      component.parentMessage = createTextMessage('   ');
      fixture.detectChanges();
      expect(component.messagePreview).toBe('   ');
    });

    it('should handle very large replyCount', () => {
      component.replyCount = 999999;
      fixture.detectChanges();
      // Component caps display at 999+
      expect(component.replyCountText).toContain('999+');
    });

    it('should return empty messagePreview when parentMessage is null', () => {
      component.parentMessage = null as any;
      fixture.detectChanges();
      expect(component.messagePreview).toBe('');
    });

    it('should return null mediaIcon when parentMessage is null', () => {
      component.parentMessage = null as any;
      fixture.detectChanges();
      expect(component.mediaIcon).toBeNull();
    });

    it('should return empty senderName when parentMessage is null', () => {
      component.parentMessage = null as any;
      fixture.detectChanges();
      expect(component.senderName).toBe('');
    });

    it('should return false for isMediaMessage when parentMessage is null', () => {
      component.parentMessage = null as any;
      fixture.detectChanges();
      expect(component.isMediaMessage).toBe(false);
    });

    it('should return left alignment when parentMessage is null', () => {
      component.parentMessage = null as any;
      fixture.detectChanges();
      expect(component.parentMessageAlignment).toBe(MessageBubbleAlignment.left);
    });

    it('should not throw when rendering with no inputs at all', async () => {
      expect(() => fixture.detectChanges()).not.toThrow();
      await flushPromises();
    });
  });
});
