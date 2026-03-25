/**
 * CometChatCallBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the call bubble component that
 * renders call messages with call type icon, title, subtitle, and optional
 * action button. Supports sender/receiver styling variants.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, Call Type/Status Display,
 *             DOM Rendering, BEM CSS Structure, Icon Selection,
 *             Button & Click Events, Alignment CSS, Accessibility,
 *             Null/Empty Handling, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-call-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatCallBubbleComponent } from './cometchat-call-bubble.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Creates a minimal mock call message object that satisfies the component's
 * expected CometChat.Call interface. Real SDK Call objects require an active
 * call session which isn't feasible in unit tests, so we use duck-typed objects
 * that match the getter API the component uses.
 */
function createCallMessage(
  overrides: {
    type?: string;
    status?: string;
    sessionId?: string;
    duration?: number;
    sentAt?: number;
  } = {}
): any {
  return {
    getType: () => overrides.type ?? 'audio',
    getStatus: () => overrides.status ?? 'ended',
    getSessionId: () => overrides.sessionId ?? 'session-123',
    getDuration: () => overrides.duration ?? 0,
    getSentAt: () => overrides.sentAt ?? 1709107200,
  };
}

describe('CometChatCallBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatCallBubbleComponent>;
  let component: CometChatCallBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatCallBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatCallBubbleComponent);
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

    it('should have default alignment as "left"', () => {
      expect(component.alignment).toBe('left');
    });

    it('should have default disableInteraction as false', () => {
      expect(component.disableInteraction).toBe(false);
    });

    it('should render the root .cometchat-call-bubble element when message is set', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble')).toBeTruthy();
    });

    it('should render fallback state when no message is provided', () => {
      fixture.detectChanges();
      const bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble).toBeTruthy();
      // Fallback title should be the localized voice call string
      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      const expected = CometChatLocalize.getLocalizedString('message_list_voice_call');
      expect(titleEl?.textContent?.trim()).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and process a call message object', () => {
      component.message = createCallMessage({ sessionId: 'sess-abc' });
      fixture.detectChanges();

      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBeTruthy();
    });

    it('should accept alignment "right" and apply sender modifier', () => {
      component.message = createCallMessage();
      component.alignment = 'right';
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble?.classList.contains('cometchat-call-bubble--sender')).toBe(true);
      expect(bubble?.classList.contains('cometchat-call-bubble--receiver')).toBe(false);
    });

    it('should accept alignment "left" and apply receiver modifier', () => {
      component.message = createCallMessage();
      component.alignment = 'left';
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble?.classList.contains('cometchat-call-bubble--receiver')).toBe(true);
      expect(bubble?.classList.contains('cometchat-call-bubble--sender')).toBe(false);
    });

    it('should accept custom iconUrl override', () => {
      component.message = createCallMessage();
      component.iconUrl = 'assets/custom-icon.svg';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-call-bubble__icon') as HTMLElement;
      expect(iconEl).toBeTruthy();
      const maskStyle =
        iconEl.style.getPropertyValue('mask') || iconEl.style.getPropertyValue('-webkit-mask');
      expect(maskStyle).toContain('custom-icon.svg');
    });

    it('should accept custom title override', () => {
      component.message = createCallMessage();
      component.title = 'Custom Call Title';
      fixture.detectChanges();

      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBe('Custom Call Title');
    });

    it('should accept custom subtitle override', () => {
      component.message = createCallMessage();
      component.subtitle = 'Custom Subtitle';
      fixture.detectChanges();

      const subtitleEl = el.querySelector('.cometchat-call-bubble__subtitle');
      expect(subtitleEl?.textContent?.trim()).toBe('Custom Subtitle');
    });

    it('should accept buttonText and show the action button', () => {
      component.message = createCallMessage();
      component.buttonText = 'Call Back';
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-call-bubble__button');
      expect(button).toBeTruthy();
      expect(button?.textContent?.trim()).toBe('Call Back');
    });
  });

  // ---------------------------------------------------------------------------
  // Call Type / Status Display
  // ---------------------------------------------------------------------------
  describe('Call Type / Status Display', () => {
    it('should display localized "Voice Call" title for audio calls', () => {
      component.message = createCallMessage({ type: 'audio' });
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_list_voice_call');
      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBe(expected);
    });

    it('should display localized "Video Call" title for video calls', () => {
      component.message = createCallMessage({ type: 'video' });
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_list_video_call');
      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBe(expected);
    });

    it('should default to audio for unknown call type', () => {
      component.message = createCallMessage({ type: 'unknown' });
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_list_voice_call');
      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBe(expected);
    });

    it('should display a formatted date subtitle from sentAt timestamp', () => {
      component.message = createCallMessage({ sentAt: 1709107200 });
      fixture.detectChanges();

      const subtitleEl = el.querySelector('.cometchat-call-bubble__subtitle');
      expect(subtitleEl?.textContent?.trim()).toBeTruthy();
      // Should contain a date-like string
      expect(subtitleEl?.textContent?.trim()).toMatch(/\d+\s\w+,\s\d+:\d+\s(AM|PM)/);
    });

    it('should display localized fallback subtitle when sentAt is missing', () => {
      component.message = {
        getType: () => 'audio',
        getStatus: () => 'ended',
        getSessionId: () => 'sess-1',
        getDuration: () => 0,
        getSentAt: () => undefined,
      } as any;
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_list_ended_call');
      const subtitleEl = el.querySelector('.cometchat-call-bubble__subtitle');
      expect(subtitleEl?.textContent?.trim()).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // BEM CSS Structure
  // ---------------------------------------------------------------------------
  describe('BEM CSS Structure', () => {
    it('should render the block element .cometchat-call-bubble', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble')).toBeTruthy();
    });

    it('should render the body element .cometchat-call-bubble__body', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble__body')).toBeTruthy();
    });

    it('should render the icon wrapper .cometchat-call-bubble__icon-wrapper', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble__icon-wrapper')).toBeTruthy();
    });

    it('should render the icon element .cometchat-call-bubble__icon', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble__icon')).toBeTruthy();
    });

    it('should render the content element .cometchat-call-bubble__content', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble__content')).toBeTruthy();
    });

    it('should render the title element .cometchat-call-bubble__title', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble__title')).toBeTruthy();
    });

    it('should render the subtitle element .cometchat-call-bubble__subtitle', () => {
      component.message = createCallMessage();
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-call-bubble__subtitle')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Icon Selection Logic
  // ---------------------------------------------------------------------------
  describe('Icon Selection Logic', () => {
    it('should use outgoing voice icon for ended audio call', () => {
      component.message = createCallMessage({ type: 'audio', status: 'ended' });
      component.alignment = 'left';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-call-bubble__icon') as HTMLElement;
      const maskStyle =
        iconEl.style.getPropertyValue('mask') || iconEl.style.getPropertyValue('-webkit-mask');
      expect(maskStyle).toContain('outgoing-voice-call.svg');
    });

    it('should use outgoing video icon for ended video call', () => {
      component.message = createCallMessage({ type: 'video', status: 'ended' });
      component.alignment = 'left';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-call-bubble__icon') as HTMLElement;
      const maskStyle =
        iconEl.style.getPropertyValue('mask') || iconEl.style.getPropertyValue('-webkit-mask');
      expect(maskStyle).toContain('outgoing-video-call.svg');
    });

    it('should use incoming voice icon for missed receiver audio call', () => {
      component.message = createCallMessage({ type: 'audio', status: 'missed' });
      component.alignment = 'left';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-call-bubble__icon') as HTMLElement;
      const maskStyle =
        iconEl.style.getPropertyValue('mask') || iconEl.style.getPropertyValue('-webkit-mask');
      expect(maskStyle).toContain('incoming-voice-call.svg');
    });

    it('should use incoming video icon for missed receiver video call', () => {
      component.message = createCallMessage({ type: 'video', status: 'missed' });
      component.alignment = 'left';
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-call-bubble__icon') as HTMLElement;
      const maskStyle =
        iconEl.style.getPropertyValue('mask') || iconEl.style.getPropertyValue('-webkit-mask');
      expect(maskStyle).toContain('incoming-video-call.svg');
    });
  });

  // ---------------------------------------------------------------------------
  // Button & Click Events
  // ---------------------------------------------------------------------------
  describe('Button & Click Events', () => {
    it('should emit buttonClick with sessionId and message when button is clicked', () => {
      const msg = createCallMessage({ sessionId: 'sess-abc' });
      component.message = msg;
      component.buttonText = 'Call Back';
      fixture.detectChanges();

      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      const button = el.querySelector('.cometchat-call-bubble__button') as HTMLElement;
      button.click();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'sess-abc',
          message: msg,
        })
      );
    });

    it('should not render button when buttonText is undefined', () => {
      component.message = createCallMessage();
      component.buttonText = undefined;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-call-bubble__button')).toBeNull();
    });

    it('should not render button when buttonText is empty string', () => {
      component.message = createCallMessage();
      component.buttonText = '';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-call-bubble__button')).toBeNull();
    });

    it('should not render button when buttonText is whitespace only', () => {
      component.message = createCallMessage();
      component.buttonText = '   ';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-call-bubble__button')).toBeNull();
    });

    it('should not render button when disableInteraction is true', () => {
      component.message = createCallMessage();
      component.buttonText = 'Call Back';
      component.disableInteraction = true;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-call-bubble__button')).toBeNull();
    });

    it('should render button with correct text', () => {
      component.message = createCallMessage();
      component.buttonText = 'Join Call';
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-call-bubble__button');
      expect(button?.textContent?.trim()).toBe('Join Call');
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS
  // ---------------------------------------------------------------------------
  describe('Alignment CSS', () => {
    it('should apply --sender modifier for right alignment', () => {
      component.message = createCallMessage();
      component.alignment = 'right';
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble?.classList.contains('cometchat-call-bubble--sender')).toBe(true);
    });

    it('should apply --receiver modifier for left alignment', () => {
      component.message = createCallMessage();
      component.alignment = 'left';
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble?.classList.contains('cometchat-call-bubble--receiver')).toBe(true);
    });

    it('should switch from receiver to sender when alignment changes', () => {
      component.message = createCallMessage();
      component.alignment = 'left';
      fixture.detectChanges();

      let bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble?.classList.contains('cometchat-call-bubble--receiver')).toBe(true);

      fixture.componentRef.setInput('alignment', 'right');
      fixture.detectChanges();

      bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble?.classList.contains('cometchat-call-bubble--sender')).toBe(true);
      expect(bubble?.classList.contains('cometchat-call-bubble--receiver')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('should have role="article" on the call bubble container', () => {
      component.message = createCallMessage();
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-call-bubble');
      expect(bubble?.getAttribute('role')).toBe('article');
    });

    it('should set aria-label containing the call title and subtitle', () => {
      component.message = createCallMessage({ type: 'audio' });
      fixture.detectChanges();

      const bubble = el.querySelector('.cometchat-call-bubble');
      const ariaLabel = bubble?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      const voiceCallTitle = CometChatLocalize.getLocalizedString('message_list_voice_call');
      expect(ariaLabel).toContain(voiceCallTitle);
    });

    it('should have role="img" on the icon element', () => {
      component.message = createCallMessage();
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-call-bubble__icon');
      expect(iconEl?.getAttribute('role')).toBe('img');
    });

    it('should set aria-label on the icon element to the computed title', () => {
      component.message = createCallMessage({ type: 'video' });
      fixture.detectChanges();

      const iconEl = el.querySelector('.cometchat-call-bubble__icon');
      const videoTitle = CometChatLocalize.getLocalizedString('message_list_video_call');
      expect(iconEl?.getAttribute('aria-label')).toBe(videoTitle);
    });

    it('should set aria-label on the action button to buttonText', () => {
      component.message = createCallMessage();
      component.buttonText = 'Join Call';
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-call-bubble__button');
      expect(button?.getAttribute('aria-label')).toBe('Join Call');
    });

    it('should have type="button" on the action button', () => {
      component.message = createCallMessage();
      component.buttonText = 'Call Back';
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-call-bubble__button');
      expect(button?.getAttribute('type')).toBe('button');
    });
  });

  // ---------------------------------------------------------------------------
  // Null / Empty Call Object Handling
  // ---------------------------------------------------------------------------
  describe('Null / Empty Call Object Handling', () => {
    it('should not throw when message is null', () => {
      expect(() => {
        component.message = null as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not throw when message is undefined', () => {
      expect(() => {
        component.message = undefined as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should display fallback title when message is null', () => {
      component.message = null as any;
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_list_voice_call');
      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBe(expected);
    });

    it('should display fallback subtitle when message is null', () => {
      component.message = null as any;
      fixture.detectChanges();

      const expected = CometChatLocalize.getLocalizedString('message_list_ended_call');
      const subtitleEl = el.querySelector('.cometchat-call-bubble__subtitle');
      expect(subtitleEl?.textContent?.trim()).toBe(expected);
    });

    it('should hide button in fallback state even if buttonText is set', () => {
      component.message = null as any;
      component.buttonText = 'Call Back';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-call-bubble__button')).toBeNull();
    });

    it('should not throw when message has missing getter methods', () => {
      expect(() => {
        component.message = {} as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should recover from null to valid message', () => {
      component.message = null as any;
      fixture.detectChanges();

      const fallbackTitle = el.querySelector('.cometchat-call-bubble__title')?.textContent?.trim();

      fixture.componentRef.setInput('message', createCallMessage({ type: 'video' }));
      fixture.detectChanges();

      const videoTitle = CometChatLocalize.getLocalizedString('message_list_video_call');
      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBe(videoTitle);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle message that throws in getType gracefully', () => {
      expect(() => {
        component.message = {
          getType: () => {
            throw new Error('fail');
          },
          getStatus: () => 'ended',
          getSessionId: () => 'sess-1',
          getDuration: () => 0,
          getSentAt: () => 1709107200,
        } as any;
        fixture.detectChanges();
      }).not.toThrow();

      // Should fall back to default state
      const expected = CometChatLocalize.getLocalizedString('message_list_voice_call');
      const titleEl = el.querySelector('.cometchat-call-bubble__title');
      expect(titleEl?.textContent?.trim()).toBe(expected);
    });

    it('should handle case-insensitive status normalization', () => {
      component.message = {
        getType: () => 'audio',
        getStatus: () => 'MISSED',
        getSessionId: () => 'sess-1',
        getDuration: () => 0,
        getSentAt: () => 1709107200,
      } as any;
      component.alignment = 'left';
      fixture.detectChanges();

      // MISSED should normalize to 'missed' and use incoming icon
      const iconEl = el.querySelector('.cometchat-call-bubble__icon') as HTMLElement;
      const maskStyle =
        iconEl.style.getPropertyValue('mask') || iconEl.style.getPropertyValue('-webkit-mask');
      expect(maskStyle).toContain('incoming-voice-call.svg');
    });

    it('should handle message without getDuration method', () => {
      expect(() => {
        component.message = {
          getType: () => 'audio',
          getStatus: () => 'ended',
          getSessionId: () => 'sess-1',
          getSentAt: () => 1709107200,
        } as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle very large timestamp (milliseconds)', () => {
      component.message = createCallMessage({ sentAt: 1709107200000 });
      fixture.detectChanges();

      const subtitleEl = el.querySelector('.cometchat-call-bubble__subtitle');
      expect(subtitleEl?.textContent?.trim()).toBeTruthy();
    });

    it('should update DOM when message changes from audio to video', () => {
      component.message = createCallMessage({ type: 'audio' });
      fixture.detectChanges();

      const audioTitle = CometChatLocalize.getLocalizedString('message_list_voice_call');
      expect(el.querySelector('.cometchat-call-bubble__title')?.textContent?.trim()).toBe(
        audioTitle
      );

      fixture.componentRef.setInput('message', createCallMessage({ type: 'video' }));
      fixture.detectChanges();

      const videoTitle = CometChatLocalize.getLocalizedString('message_list_video_call');
      expect(el.querySelector('.cometchat-call-bubble__title')?.textContent?.trim()).toBe(
        videoTitle
      );
    });

    it('should handle all valid call statuses without throwing', () => {
      const statuses = [
        'initiated',
        'ongoing',
        'ended',
        'missed',
        'cancelled',
        'rejected',
        'busy',
        'unanswered',
      ];
      for (const status of statuses) {
        expect(() => {
          component.message = createCallMessage({ status });
          fixture.detectChanges();
        }).not.toThrow();
      }
    });
  });
});
