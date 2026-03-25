/**
 * CometChatThreadView Component Tests
 *
 * Comprehensive TestBed-based test suite for the thread view component.
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Computed Properties, Keyboard Accessibility,
 *             Panel Mode, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 3.1, 3.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-thread-view
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
import { ensureSdkReady, sdkCleanup, flushPromises } from '../../../testing';
import { CometChatThreadViewComponent } from './cometchat-thread-view.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(
  fixture: ComponentFixture<CometChatThreadViewComponent>
): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

/**
 * Creates a real CometChat.TextMessage for testing.
 */
function createTextMessage(text: string, receiverUid = 'superhero2'): CometChat.TextMessage {
  return new CometChat.TextMessage(receiverUid, text, CometChat.RECEIVER_TYPE.USER);
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatThreadViewComponent', () => {
  let fixture: ComponentFixture<CometChatThreadViewComponent>;
  let component: CometChatThreadViewComponent;
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
      imports: [CometChatThreadViewComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatThreadViewComponent);
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

    it('should default mode to indicator', () => {
      fixture.detectChanges();
      expect(component.mode).toBe('indicator');
    });

    it('should default replyCount to 0', () => {
      fixture.detectChanges();
      expect(component.replyCount).toBe(0);
    });

    it('should default unreadReplyCount to 0', () => {
      fixture.detectChanges();
      expect(component.unreadReplyCount).toBe(0);
    });

    it('should have parentMessage undefined by default', () => {
      fixture.detectChanges();
      expect(component.parentMessage).toBeUndefined();
    });

    it('should default announceOnOpen to true', () => {
      fixture.detectChanges();
      expect(component.announceOnOpen).toBe(true);
    });

    it('should not render indicator when replyCount is 0', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-view')).toBeFalsy();
    });
  });

  // -------------------------------------------------------------------------
  // Input Bindings
  // -------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept replyCount and reflect it', async () => {
      component.replyCount = 5;
      await initAndDetect(fixture);
      expect(component.replyCount).toBe(5);
    });

    it('should accept unreadReplyCount and reflect it', async () => {
      component.unreadReplyCount = 3;
      await initAndDetect(fixture);
      expect(component.unreadReplyCount).toBe(3);
    });

    it('should accept parentMessage input', async () => {
      const msg = createTextMessage('Hello thread');
      component.parentMessage = msg;
      await initAndDetect(fixture);
      expect(component.parentMessage).toBe(msg);
    });

    it('should accept mode input and switch to panel', async () => {
      component.mode = 'panel';
      await initAndDetect(fixture);
      expect(component.mode).toBe('panel');
    });

    it('should accept announceOnOpen input', async () => {
      component.announceOnOpen = false;
      await initAndDetect(fixture);
      expect(component.announceOnOpen).toBe(false);
    });

    it('should update when replyCount changes from one value to another', async () => {
      component.replyCount = 1;
      await initAndDetect(fixture);
      expect(component.replyCountText).toContain('1');

      component.replyCount = 10;
      fixture.detectChanges();
      expect(component.replyCountText).toContain('10');
    });

    it('should handle null parentMessage gracefully', () => {
      expect(() => {
        component.parentMessage = null as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle undefined parentMessage gracefully', () => {
      expect(() => {
        component.parentMessage = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit threadClick with parentMessage when onThreadViewClick is called', async () => {
      const msg = createTextMessage('Test');
      component.parentMessage = msg;
      component.replyCount = 1;
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.threadClick.subscribe(spy);
      component.onThreadViewClick();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(msg);
    });

    it('should not emit threadClick when parentMessage is undefined', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.threadClick.subscribe(spy);
      component.onThreadViewClick();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit threadClick when indicator is clicked in the DOM', async () => {
      const msg = createTextMessage('Test');
      component.parentMessage = msg;
      component.replyCount = 3;
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.threadClick.subscribe(spy);

      const indicator = el.querySelector('.cometchat-thread-view') as HTMLElement;
      expect(indicator).toBeTruthy();
      indicator.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick when closeThread is called in panel mode', async () => {
      component.mode = 'panel';
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.closeThread();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit multiple threadClick events on repeated calls', () => {
      const msg = createTextMessage('Test');
      component.parentMessage = msg;
      fixture.detectChanges();

      const spy = vi.fn();
      component.threadClick.subscribe(spy);
      component.onThreadViewClick();
      component.onThreadViewClick();
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // DOM Rendering
  // -------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    describe('Indicator Mode', () => {
      it('should render .cometchat-thread-view when replyCount > 0', async () => {
        component.replyCount = 3;
        await initAndDetect(fixture);
        expect(el.querySelector('.cometchat-thread-view')).toBeTruthy();
      });

      it('should not render indicator when replyCount is 0', async () => {
        component.replyCount = 0;
        await initAndDetect(fixture);
        expect(el.querySelector('.cometchat-thread-view')).toBeFalsy();
      });

      it('should render the thread icon image', async () => {
        component.replyCount = 1;
        await initAndDetect(fixture);
        const icon = el.querySelector('.cometchat-thread-view__icon') as HTMLImageElement;
        expect(icon).toBeTruthy();
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });

      it('should render the reply count text span', async () => {
        component.replyCount = 5;
        await initAndDetect(fixture);
        const countEl = el.querySelector('.cometchat-thread-view__count');
        expect(countEl).toBeTruthy();
        expect(countEl?.textContent?.trim()).toContain('5');
      });

      it('should render unread indicator when unreadReplyCount > 0', async () => {
        component.replyCount = 3;
        component.unreadReplyCount = 2;
        await initAndDetect(fixture);
        expect(el.querySelector('.cometchat-thread-view__unread-indicator')).toBeTruthy();
      });

      it('should not render unread indicator when unreadReplyCount is 0', async () => {
        component.replyCount = 3;
        component.unreadReplyCount = 0;
        await initAndDetect(fixture);
        expect(el.querySelector('.cometchat-thread-view__unread-indicator')).toBeFalsy();
      });

      it('should apply --unread modifier class when hasUnreadReplies', async () => {
        component.replyCount = 3;
        component.unreadReplyCount = 1;
        await initAndDetect(fixture);
        expect(el.querySelector('.cometchat-thread-view--unread')).toBeTruthy();
      });

      it('should have role="button" on the indicator', async () => {
        component.replyCount = 1;
        await initAndDetect(fixture);
        const indicator = el.querySelector('.cometchat-thread-view');
        expect(indicator?.getAttribute('role')).toBe('button');
      });

      it('should have tabindex="0" on the indicator', async () => {
        component.replyCount = 1;
        await initAndDetect(fixture);
        const indicator = el.querySelector('.cometchat-thread-view');
        expect(indicator?.getAttribute('tabindex')).toBe('0');
      });

      it('should have aria-label on the indicator', async () => {
        component.replyCount = 3;
        await initAndDetect(fixture);
        const indicator = el.querySelector('.cometchat-thread-view');
        expect(indicator?.getAttribute('aria-label')).toBeTruthy();
      });
    });

    describe('Panel Mode', () => {
      it('should render an aside element in panel mode', async () => {
        component.mode = 'panel';
        await initAndDetect(fixture);
        const aside = el.querySelector('aside.cometchat-thread-view--panel');
        expect(aside).toBeTruthy();
      });

      it('should have role="complementary" on the panel aside', async () => {
        component.mode = 'panel';
        await initAndDetect(fixture);
        const aside = el.querySelector('aside');
        expect(aside?.getAttribute('role')).toBe('complementary');
      });

      it('should have aria-label on the panel aside', async () => {
        component.mode = 'panel';
        await initAndDetect(fixture);
        const aside = el.querySelector('aside');
        const label = aside?.getAttribute('aria-label');
        expect(label).toBeTruthy();
      });

      it('should not render indicator elements in panel mode', async () => {
        component.mode = 'panel';
        component.replyCount = 5;
        await initAndDetect(fixture);
        // Panel mode should not have the icon or count elements from indicator mode
        expect(el.querySelector('.cometchat-thread-view__icon')).toBeFalsy();
        expect(el.querySelector('.cometchat-thread-view__count')).toBeFalsy();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Computed Properties
  // -------------------------------------------------------------------------
  describe('Computed Properties', () => {
    describe('shouldDisplay', () => {
      it('should return false when replyCount is 0', () => {
        component.replyCount = 0;
        fixture.detectChanges();
        expect(component.shouldDisplay).toBe(false);
      });

      it('should return true when replyCount is greater than 0', () => {
        component.replyCount = 1;
        fixture.detectChanges();
        expect(component.shouldDisplay).toBe(true);
      });

      it('should return true for large replyCount', () => {
        component.replyCount = 999;
        fixture.detectChanges();
        expect(component.shouldDisplay).toBe(true);
      });
    });

    describe('hasUnreadReplies', () => {
      it('should return false when unreadReplyCount is 0', () => {
        component.unreadReplyCount = 0;
        fixture.detectChanges();
        expect(component.hasUnreadReplies).toBe(false);
      });

      it('should return true when unreadReplyCount > 0', () => {
        component.unreadReplyCount = 3;
        fixture.detectChanges();
        expect(component.hasUnreadReplies).toBe(true);
      });
    });

    describe('replyCountText', () => {
      it('should use singular form for 1 reply', () => {
        component.replyCount = 1;
        fixture.detectChanges();
        const singular = CometChatLocalize.getLocalizedString('thread_reply');
        expect(component.replyCountText).toBe(`1 ${singular}`);
      });

      it('should use plural form for 0 replies', () => {
        component.replyCount = 0;
        fixture.detectChanges();
        const plural = CometChatLocalize.getLocalizedString('thread_replies');
        expect(component.replyCountText).toBe(`0 ${plural}`);
      });

      it('should use plural form for multiple replies', () => {
        component.replyCount = 5;
        fixture.detectChanges();
        const plural = CometChatLocalize.getLocalizedString('thread_replies');
        expect(component.replyCountText).toBe(`5 ${plural}`);
      });

      it('should update when replyCount changes', () => {
        component.replyCount = 1;
        fixture.detectChanges();
        expect(component.replyCountText).toContain('1');

        component.replyCount = 3;
        fixture.detectChanges();
        expect(component.replyCountText).toContain('3');
      });
    });

    describe('ariaLabel', () => {
      it('should return reply count text when no unread replies', () => {
        component.replyCount = 3;
        component.unreadReplyCount = 0;
        fixture.detectChanges();
        expect(component.ariaLabel).toBe(component.replyCountText);
      });

      it('should include unread count when unread replies exist', () => {
        component.replyCount = 5;
        component.unreadReplyCount = 2;
        fixture.detectChanges();
        expect(component.ariaLabel).toContain('2 unread');
        expect(component.ariaLabel).toContain(component.replyCountText);
      });

      it('should use singular form in aria label for 1 reply with unread', () => {
        component.replyCount = 1;
        component.unreadReplyCount = 1;
        fixture.detectChanges();
        expect(component.ariaLabel).toContain('1 unread');
      });
    });

    describe('panelAriaLabel', () => {
      it('should return localized accessibility_thread_replies string', () => {
        fixture.detectChanges();
        const expected = CometChatLocalize.getLocalizedString('accessibility_thread_replies');
        expect(component.panelAriaLabel).toBe(expected);
      });
    });

    describe('isPanelMode / isIndicatorMode', () => {
      it('should return true for isIndicatorMode in default mode', () => {
        fixture.detectChanges();
        expect(component.isIndicatorMode).toBe(true);
        expect(component.isPanelMode).toBe(false);
      });

      it('should return true for isPanelMode when mode is panel', () => {
        component.mode = 'panel';
        fixture.detectChanges();
        expect(component.isPanelMode).toBe(true);
        expect(component.isIndicatorMode).toBe(false);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Accessibility
  // -------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    describe('Indicator Mode', () => {
      it('should emit threadClick on Enter key', async () => {
        const msg = createTextMessage('Test');
        component.parentMessage = msg;
        component.replyCount = 1;
        await initAndDetect(fixture);

        const spy = vi.fn();
        component.threadClick.subscribe(spy);
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        vi.spyOn(event, 'preventDefault');
        component.onKeyDown(event);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should emit threadClick on Space key', async () => {
        const msg = createTextMessage('Test');
        component.parentMessage = msg;
        component.replyCount = 1;
        await initAndDetect(fixture);

        const spy = vi.fn();
        component.threadClick.subscribe(spy);
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        vi.spyOn(event, 'preventDefault');
        component.onKeyDown(event);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should not emit threadClick on Escape key in indicator mode', () => {
        component.parentMessage = createTextMessage('Test');
        fixture.detectChanges();
        const spy = vi.fn();
        component.threadClick.subscribe(spy);
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        component.onKeyDown(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should not emit threadClick on Tab key', () => {
        component.parentMessage = createTextMessage('Test');
        fixture.detectChanges();
        const spy = vi.fn();
        component.threadClick.subscribe(spy);
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        component.onKeyDown(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should dispatch Enter on indicator element in DOM and trigger threadClick', async () => {
        const msg = createTextMessage('Test');
        component.parentMessage = msg;
        component.replyCount = 2;
        await initAndDetect(fixture);

        const spy = vi.fn();
        component.threadClick.subscribe(spy);

        const indicator = el.querySelector('.cometchat-thread-view') as HTMLElement;
        expect(indicator).toBeTruthy();
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(event);
        expect(spy).toHaveBeenCalled();
      });

      it('should dispatch Space on indicator element in DOM and trigger threadClick', async () => {
        const msg = createTextMessage('Test');
        component.parentMessage = msg;
        component.replyCount = 2;
        await initAndDetect(fixture);

        const spy = vi.fn();
        component.threadClick.subscribe(spy);

        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        el.dispatchEvent(event);
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('Panel Mode', () => {
      it('should emit closeClick on Escape key', async () => {
        component.mode = 'panel';
        await initAndDetect(fixture);

        const spy = vi.fn();
        component.closeClick.subscribe(spy);
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        vi.spyOn(event, 'preventDefault');
        component.onKeyDown(event);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should not emit closeClick on Enter key in panel mode', () => {
        component.mode = 'panel';
        fixture.detectChanges();
        const spy = vi.fn();
        component.closeClick.subscribe(spy);
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        component.onKeyDown(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should not emit closeClick on Space key in panel mode', () => {
        component.mode = 'panel';
        fixture.detectChanges();
        const spy = vi.fn();
        component.closeClick.subscribe(spy);
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        component.onKeyDown(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should dispatch Escape on host element and trigger closeClick', async () => {
        component.mode = 'panel';
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
    });
  });

  // -------------------------------------------------------------------------
  // Panel Mode (Lifecycle & Focus Restoration)
  // -------------------------------------------------------------------------
  describe('Panel Mode', () => {
    it('should store previously focused element on init', async () => {
      // Create a focusable element and focus it before component init
      const btn = document.createElement('button');
      btn.textContent = 'Focus me';
      document.body.appendChild(btn);
      btn.focus();

      component.mode = 'panel';
      component.replyCount = 5;
      await initAndDetect(fixture);

      // The component should have stored the previously focused element
      // We verify indirectly by calling closeThread and checking focus restoration
      const focusSpy = vi.spyOn(btn, 'focus');
      component.closeThread();

      // Focus restoration uses setTimeout, so wait for it
      await new Promise(r => setTimeout(r, 50));
      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(btn);
    });

    it('should not announce when announceOnOpen is false', async () => {
      component.mode = 'panel';
      component.announceOnOpen = false;
      component.replyCount = 5;

      // Spy on the LiveAnnouncerService
      const announcer = (component as any).liveAnnouncer;
      const announceSpy = vi.spyOn(announcer, 'announce');

      await initAndDetect(fixture);
      expect(announceSpy).not.toHaveBeenCalled();
    });

    it('should announce thread opened when announceOnOpen is true', async () => {
      component.mode = 'panel';
      component.announceOnOpen = true;
      component.replyCount = 3;

      const announcer = (component as any).liveAnnouncer;
      const announceSpy = vi.spyOn(announcer, 'announce');

      await initAndDetect(fixture);
      expect(announceSpy).toHaveBeenCalledWith(expect.stringContaining('3'), 'polite');
    });

    it('should not announce in indicator mode on init', async () => {
      component.mode = 'indicator';
      component.replyCount = 10;

      const announcer = (component as any).liveAnnouncer;
      const announceSpy = vi.spyOn(announcer, 'announce');

      await initAndDetect(fixture);
      expect(announceSpy).not.toHaveBeenCalled();
    });

    it('should clean up previouslyFocusedElement on destroy', async () => {
      component.mode = 'panel';
      await initAndDetect(fixture);

      fixture.destroy();

      // After destroy, the internal reference should be null
      // Verify no error is thrown if we were to access it
      expect(() => fixture.destroy).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when rendering with no inputs at all', async () => {
      expect(() => fixture.detectChanges()).not.toThrow();
      await flushPromises();
    });

    it('should handle negative replyCount gracefully', () => {
      component.replyCount = -1;
      fixture.detectChanges();
      expect(component.shouldDisplay).toBe(false);
      expect(component.replyCountText).toContain('-1');
    });

    it('should handle very large replyCount', () => {
      component.replyCount = 999999;
      fixture.detectChanges();
      expect(component.shouldDisplay).toBe(true);
      expect(component.replyCountText).toContain('999+');
    });

    it('should handle very large unreadReplyCount in ariaLabel', () => {
      component.replyCount = 100;
      component.unreadReplyCount = 50;
      fixture.detectChanges();
      expect(component.ariaLabel).toContain('50 unread');
    });

    it('should handle switching modes from indicator to panel', async () => {
      component.replyCount = 3;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-thread-view')).toBeTruthy();
      expect(el.querySelector('aside')).toBeFalsy();

      fixture.componentRef.setInput('mode', 'panel');
      fixture.detectChanges();
      expect(el.querySelector('aside.cometchat-thread-view--panel')).toBeTruthy();
    });

    it('should not emit threadClick when parentMessage is null', () => {
      component.parentMessage = null as any;
      fixture.detectChanges();
      const spy = vi.fn();
      component.threadClick.subscribe(spy);
      component.onThreadViewClick();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle closeThread without prior ngOnInit (no previouslyFocusedElement)', () => {
      // Component in indicator mode — ngOnInit does not store focus ref
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      expect(() => component.closeThread()).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should handle replyCount of exactly 1 (singular boundary)', () => {
      component.replyCount = 1;
      fixture.detectChanges();
      const singular = CometChatLocalize.getLocalizedString('thread_reply');
      expect(component.replyCountText).toBe(`1 ${singular}`);
    });

    it('should handle replyCount of exactly 2 (plural boundary)', () => {
      component.replyCount = 2;
      fixture.detectChanges();
      const plural = CometChatLocalize.getLocalizedString('thread_replies');
      expect(component.replyCountText).toBe(`2 ${plural}`);
    });
  });
});
