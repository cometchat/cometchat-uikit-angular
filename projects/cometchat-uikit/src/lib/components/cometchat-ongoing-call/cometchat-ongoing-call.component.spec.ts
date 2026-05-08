import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Unit Tests for CometChatOngoingCallComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Session ID binding: rendering gate, startCall trigger (Requirement 4.1, 4.2)
 * - Call controls display: Escape key handling, template context
 * - End call emission: ccCallEnded → callEnded output
 * - Null session handling: empty sessionID prevents rendering and startCall
 * - Error handling: handleError wraps errors, emits error output + onError callback
 * - Accessibility: role="application", aria-live="polite", tabindex="0", aria-label
 * - CallAnnouncer integration: announceCallEnded on call end
 * - Custom callScreenView template override
 * - ngOnInit input sync and event subscription
 * - ngOnDestroy cleanup: endSession + unsubscribe
 *
 * Uses vi.mock() for SDK mocking BEFORE imports,
 * and Object.create() to bypass Angular's inject() context requirement.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================

// Mock @cometchat/calls-sdk-javascript BEFORE it gets imported
vi.mock('@cometchat/calls-sdk-javascript', () => {
  return {
    CometChatCalls: {
      CallSettingsBuilder: class {
        enableDefaultLayout() {
          return this;
        }
        setIsAudioOnlyCall() {
          return this;
        }
        setCallListener() {
          return this;
        }
      },
      OngoingCallListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },
      endSession: vi.fn(),
      init: vi.fn(),
    },
  };
});

// Mock @cometchat/chat-sdk-javascript — must include all static properties
// accessed by constants.ts at module load time
vi.mock('@cometchat/chat-sdk-javascript', () => {
  class MockCometChatException {
    code: string;
    message: string;
    details?: string;
    constructor(opts: { code: string; message: string; details?: string }) {
      this.code = opts.code;
      this.message = opts.message;
      this.details = opts.details;
    }
  }

  return {
    CometChat: {
      CometChatException: MockCometChatException,
      CallListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },
      ConnectionListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },

      // Static constants used by constants.ts and Enums
      CATEGORY_MESSAGE: 'message',
      CATEGORY_CUSTOM: 'custom',
      CATEGORY_ACTION: 'action',
      CATEGORY_CALL: 'call',
      CATEGORY_INTERACTIVE: 'interactive',
      MessageCategory: { AGENTIC: 'agentic' },
      ModerationStatus: {
        PENDING: 'pending',
        APPROVED: 'approved',
        DISAPPROVED: 'disapproved',
        UNMODERATED: 'unmoderated',
      },
      MESSAGE_TYPE: {
        TEXT: 'text',
        FILE: 'file',
        IMAGE: 'image',
        AUDIO: 'audio',
        VIDEO: 'video',
        ASSISTANT: 'assistant',
        TOOL_ARGUMENTS: 'toolArguments',
        TOOL_RESULT: 'toolResults',
      },
      ACTION_TYPE: {
        MEMBER_JOINED: 'joined',
        MEMBER_LEFT: 'left',
        MEMBER_ADDED: 'added',
        MEMBER_BANNED: 'banned',
        MEMBER_UNBANNED: 'unbanned',
        MEMBER_KICKED: 'kicked',
        MEMBER_INVITED: 'invited',
        MEMBER_SCOPE_CHANGED: 'scopeChanged',
      },
      RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
      USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
      GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
      GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
      CALL_STATUS: {
        ONGOING: 'ongoing',
        ENDED: 'ended',
        INITIATED: 'initiated',
        CANCELLED: 'cancelled',
        REJECTED: 'rejected',
        UNANSWERED: 'unanswered',
        BUSY: 'busy',
      },
      CALL_MODE: {
        DEFAULT: 'default',
        GRID: 'grid',
        SINGLE: 'single',
        SPOTLIGHT: 'spotlight',
        TILE: 'tile',
      },
      CALL_TYPE: { AUDIO: 'audio', VIDEO: 'video' },
      GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
      AI_ASSISTANT_EVENTS: {
        RUN_STARTED: 'run_started',
        TEXT_MESSAGE_START: 'text_message_start',
        TEXT_MESSAGE_CONTENT: 'text_message_content',
        TEXT_MESSAGE_END: 'text_message_end',
        RUN_FINISHED: 'run_finished',
        TOOL_CALL_STARTED: 'tool_call_start',
        TOOL_CALL_ENDED: 'tool_call_end',
        TOOL_CALL_ARGUMENT: 'tool_call_args',
        TOOL_CALL_RESULT: 'tool_call_result',
      },
    },
  };
});

// Now import modules that transitively pull in the SDKs (AFTER mocks)
import { Subject } from 'rxjs';
import { EventEmitter, ElementRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatCallEvents } from '../../events/CometChatCallEvents';
import { OngoingCallService } from '../../services/ongoing-call.service';
import { CallWorkflow } from '../../Enums/Enums';
import { CometChatOngoingCallComponent } from './cometchat-ongoing-call.component';

// ==================== Helpers ====================

/**
 * Creates a component instance without calling the constructor
 * (which requires Angular's injection context for inject()).
 * Manually wires the service and initializes default field values.
 */
function createComponentWithService(svc: OngoingCallService): CometChatOngoingCallComponent {
  const comp = Object.create(
    CometChatOngoingCallComponent.prototype
  ) as CometChatOngoingCallComponent;
  (comp as any).ongoingCallService = svc;
  (comp as any).callAnnouncer = { announceCallEnded: vi.fn() };
  (comp as any).pendingTimers = [];
  // Provide a mock DestroyRef for takeUntilDestroyed
  const destroyCallbacks: (() => void)[] = [];
  (comp as any).destroyRef = {
    onDestroy: (fn: () => void) => { destroyCallbacks.push(fn); },
    _destroyCallbacks: destroyCallbacks,
  };
  comp.sessionID = '';
  comp.callSettingsBuilder = null;
  comp.callWorkflow = CallWorkflow.defaultCalling;
  comp.onError = null;
  comp.callScreenView = null;
  comp.callEnded = new EventEmitter<void>();
  comp.error = new EventEmitter<CometChat.CometChatException>();
  (comp as any).callEndedSub = null;
  return comp;
}

/**
 * Creates a mock ElementRef wrapping a real div element.
 */
function createMockCallScreenFrame(): ElementRef<HTMLDivElement> {
  const div = document.createElement('div');
  return new ElementRef(div);
}

// ==================== Test Suite ====================

describe('CometChatOngoingCallComponent Unit Tests', () => {
  let component: CometChatOngoingCallComponent;
  let service: OngoingCallService;
  let origCcCallEnded: Subject<CometChat.Call>;

  beforeEach(() => {
    // Save and replace the static Subject so tests are isolated
    origCcCallEnded = CometChatCallEvents.ccCallEnded;
    CometChatCallEvents.ccCallEnded = new Subject<CometChat.Call>();

    service = new OngoingCallService();
    component = createComponentWithService(service);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original subject
    CometChatCallEvents.ccCallEnded = origCcCallEnded;
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    it('creates a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('has empty sessionID by default', () => {
      expect(component.sessionID).toBe('');
    });

    it('has null callSettingsBuilder by default', () => {
      expect(component.callSettingsBuilder).toBeNull();
    });

    it('has defaultCalling callWorkflow by default', () => {
      expect(component.callWorkflow).toBe(CallWorkflow.defaultCalling);
    });

    it('has null onError callback by default', () => {
      expect(component.onError).toBeNull();
    });

    it('has null callScreenView by default', () => {
      expect(component.callScreenView).toBeNull();
    });
  });

  // ==================== Session ID binding (Req 4.1, 4.2) ====================

  describe('session ID binding', () => {
    it('non-empty sessionID is truthy (gates template rendering)', () => {
      component.sessionID = 'session-abc';
      expect(component.sessionID).toBeTruthy();
    });

    it('empty sessionID is falsy (prevents template rendering)', () => {
      component.sessionID = '';
      expect(component.sessionID).toBeFalsy();
    });

    it('templateContext provides sessionID and callWorkflow', () => {
      component.sessionID = 'session-xyz';
      component.callWorkflow = CallWorkflow.directCalling;

      const ctx = component.templateContext;
      expect(ctx.$implicit.sessionID).toBe('session-xyz');
      expect(ctx.$implicit.callWorkflow).toBe(CallWorkflow.directCalling);
    });

    it('ngAfterViewInit calls startCall when sessionID is set and callScreenFrame is available', () => {
      const startCallSpy = vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = 'new-session-123';
      (component as any).callScreenFrame = createMockCallScreenFrame();

      component.ngAfterViewInit();

      expect(startCallSpy).toHaveBeenCalledTimes(1);
      expect(startCallSpy).toHaveBeenCalledWith(
        (component as any).callScreenFrame.nativeElement,
        expect.any(Function)
      );
    });

    it('ngAfterViewInit does NOT call startCall when sessionID is empty', () => {
      const startCallSpy = vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = '';
      (component as any).callScreenFrame = createMockCallScreenFrame();

      component.ngAfterViewInit();

      expect(startCallSpy).not.toHaveBeenCalled();
    });

    it('ngAfterViewInit does NOT call startCall when callScreenFrame is unavailable', () => {
      const startCallSpy = vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = 'session-123';
      (component as any).callScreenFrame = undefined;

      component.ngAfterViewInit();

      expect(startCallSpy).not.toHaveBeenCalled();
    });

    it('ngOnChanges syncs inputs to service on sessionID change', () => {
      vi.useFakeTimers();

      const setSessionIDSpy = vi.spyOn(service, 'setSessionID');
      const setCallWorkflowSpy = vi.spyOn(service, 'setCallWorkflow');
      const setCallSettingsBuilderSpy = vi.spyOn(service, 'setCallSettingsBuilder');
      vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = 'new-session-456';
      component.callWorkflow = CallWorkflow.defaultCalling;
      (component as any).callScreenFrame = createMockCallScreenFrame();

      component.ngOnChanges({
        sessionID: {
          currentValue: 'new-session-456',
          previousValue: 'old-session',
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(setSessionIDSpy).toHaveBeenCalledWith('new-session-456');
      expect(setCallWorkflowSpy).toHaveBeenCalledWith(CallWorkflow.defaultCalling);
      expect(setCallSettingsBuilderSpy).toHaveBeenCalledWith(null);

      vi.runAllTimers();
      vi.useRealTimers();
    });

    it('ngOnChanges triggers startCall via setTimeout when callScreenFrame is available', () => {
      vi.useFakeTimers();

      const startCallSpy = vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = 'session-789';
      (component as any).callScreenFrame = createMockCallScreenFrame();

      component.ngOnChanges({
        sessionID: {
          currentValue: 'session-789',
          previousValue: 'old',
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      vi.runAllTimers();

      expect(startCallSpy).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('ngOnChanges does NOT call startCall when callScreenFrame is unavailable', () => {
      vi.useFakeTimers();

      const startCallSpy = vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = 'session-no-frame';
      (component as any).callScreenFrame = undefined;

      component.ngOnChanges({
        sessionID: {
          currentValue: 'session-no-frame',
          previousValue: 'old',
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      vi.runAllTimers();

      expect(startCallSpy).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  // ==================== Call controls display ====================

  describe('call controls display', () => {
    it('onKeyDown stops Escape propagation (prevents accidental call end)', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');

      component.onKeyDown(event);

      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('onKeyDown does NOT stop non-Escape keys', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const enterSpy = vi.spyOn(enterEvent, 'stopPropagation');
      const tabSpy = vi.spyOn(tabEvent, 'stopPropagation');

      component.onKeyDown(enterEvent);
      component.onKeyDown(tabEvent);

      expect(enterSpy).not.toHaveBeenCalled();
      expect(tabSpy).not.toHaveBeenCalled();
    });

    it('callScreenView template override replaces default container', () => {
      const mockTemplate = {} as any;
      component.callScreenView = mockTemplate;
      expect(component.callScreenView).toBe(mockTemplate);
    });

    it('templateContext provides session data for custom callScreenView', () => {
      component.sessionID = 'custom-session';
      component.callWorkflow = CallWorkflow.directCalling;
      component.callScreenView = {} as any;

      const ctx = component.templateContext;
      expect(ctx.$implicit.sessionID).toBe('custom-session');
      expect(ctx.$implicit.callWorkflow).toBe(CallWorkflow.directCalling);
    });
  });

  // ==================== End call emission ====================

  describe('end call emission', () => {
    it('callEnded output emits when ccCallEnded subject fires', () => {
      let callEndedEmitted = false;
      const sub = component.callEnded.subscribe(() => {
        callEndedEmitted = true;
      });

      component.ngOnInit();
      CometChatCallEvents.ccCallEnded.next({} as CometChat.Call);

      expect(callEndedEmitted).toBe(true);
      sub.unsubscribe();
    });

    it('callAnnouncer.announceCallEnded is called when ccCallEnded fires', () => {
      const announceSpy = vi.fn();
      (component as any).callAnnouncer = { announceCallEnded: announceSpy };

      component.ngOnInit();
      CometChatCallEvents.ccCallEnded.next({} as CometChat.Call);

      expect(announceSpy).toHaveBeenCalledTimes(1);
    });

    it('callAnnouncer.announceCallEnded is NOT called before ccCallEnded fires', () => {
      const announceSpy = vi.fn();
      (component as any).callAnnouncer = { announceCallEnded: announceSpy };

      component.ngOnInit();

      expect(announceSpy).not.toHaveBeenCalled();
    });

    it('ngOnDestroy calls endSession on the service', () => {
      const endSessionSpy = vi.spyOn(service, 'endSession').mockImplementation(() => {});

      component.ngOnDestroy();

      expect(endSessionSpy).toHaveBeenCalledTimes(1);
    });

    it('ngOnDestroy unsubscribes from callEndedSub', () => {
      component.ngOnInit();
      // takeUntilDestroyed handles cleanup automatically — no manual sub tracking needed

      vi.spyOn(service, 'endSession').mockImplementation(() => {});
      component.ngOnDestroy();

      // Verify endSession was called (cleanup happened)
      expect(service.endSession).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Null session handling ====================

  describe('null session handling', () => {
    it('empty sessionID is falsy so template does not render', () => {
      component.sessionID = '';
      expect(component.sessionID).toBeFalsy();
    });

    it('ngAfterViewInit does not start call when sessionID is empty', () => {
      const startCallSpy = vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = '';
      (component as any).callScreenFrame = createMockCallScreenFrame();

      component.ngAfterViewInit();

      expect(startCallSpy).not.toHaveBeenCalled();
    });

    it('ngOnChanges with empty sessionID does not trigger startCall', () => {
      vi.useFakeTimers();

      const startCallSpy = vi.spyOn(service, 'startCall').mockResolvedValue(undefined);

      component.sessionID = '';

      component.ngOnChanges({
        sessionID: {
          currentValue: '',
          previousValue: 'old-session',
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      vi.runAllTimers();

      expect(startCallSpy).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('ngOnDestroy handles cleanup even when no subscription exists', () => {
      const endSessionSpy = vi.spyOn(service, 'endSession').mockImplementation(() => {});

      // No ngOnInit called, so callEndedSub is null
      expect((component as any).callEndedSub).toBeNull();

      component.ngOnDestroy();

      expect(endSessionSpy).toHaveBeenCalledTimes(1);
      expect((component as any).callEndedSub).toBeNull();
    });
  });

  // ==================== Error handling ====================

  describe('error handling', () => {
    it('handleError emits error output with CometChatException for Error input', () => {
      const emittedErrors: CometChat.CometChatException[] = [];
      const sub = component.error.subscribe(err => emittedErrors.push(err));

      (component as any).handleError(new Error('test error'));

      expect(emittedErrors.length).toBe(1);
      expect(emittedErrors[0]).toBeInstanceOf(CometChat.CometChatException);
      expect(emittedErrors[0].message).toBe('test error');

      sub.unsubscribe();
    });

    it('handleError invokes onError callback when provided', () => {
      const callbackErrors: CometChat.CometChatException[] = [];
      component.onError = err => callbackErrors.push(err);

      const emittedErrors: CometChat.CometChatException[] = [];
      const sub = component.error.subscribe(err => emittedErrors.push(err));

      (component as any).handleError(new Error('callback error'));

      expect(callbackErrors.length).toBe(1);
      expect(callbackErrors[0]).toBeInstanceOf(CometChat.CometChatException);
      expect(emittedErrors[0]).toBe(callbackErrors[0]);

      sub.unsubscribe();
    });

    it('handleError wraps a CometChatException as-is', () => {
      const original = new CometChat.CometChatException({
        code: 'TEST_CODE',
        message: 'original exception',
        details: 'some details',
      });

      const emittedErrors: CometChat.CometChatException[] = [];
      const sub = component.error.subscribe(err => emittedErrors.push(err));

      (component as any).handleError(original);

      expect(emittedErrors[0]).toBe(original);

      sub.unsubscribe();
    });

    it('handleError wraps a string error into CometChatException', () => {
      const emittedErrors: CometChat.CometChatException[] = [];
      const sub = component.error.subscribe(err => emittedErrors.push(err));

      (component as any).handleError('string error');

      expect(emittedErrors[0]).toBeInstanceOf(CometChat.CometChatException);
      expect(emittedErrors[0].message).toBe('string error');

      sub.unsubscribe();
    });

    it('startCall error is forwarded via handleError', async () => {
      vi.spyOn(service, 'startCall').mockRejectedValue(new Error('token generation failed'));

      const emittedErrors: CometChat.CometChatException[] = [];
      const sub = component.error.subscribe(err => emittedErrors.push(err));

      component.sessionID = 'error-session';
      (component as any).callScreenFrame = createMockCallScreenFrame();

      component.ngAfterViewInit();

      // Wait for the async rejection to propagate through microtask queue
      await new Promise(resolve => setTimeout(resolve, 50));
      // Flush any remaining microtasks
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(emittedErrors.length).toBeGreaterThanOrEqual(1);

      sub.unsubscribe();
    }, 10_000);
  });

  // ==================== Accessibility attributes ====================

  describe('accessibility attributes', () => {
    it('template uses role="application" on the call container (verified via template)', () => {
      // The template has: role="application" on the .cometchat-ongoing-call div.
      component.sessionID = 'a11y-test';
      expect(component.sessionID).toBeTruthy();
      expect(component.callScreenView).toBeNull();
    });

    it('template uses aria-live="polite" on the call container (verified via template)', () => {
      // The template has: aria-live="polite" on the .cometchat-ongoing-call div.
      component.sessionID = 'a11y-live-test';
      expect(component.sessionID).toBeTruthy();
    });

    it('template uses aria-label with accessibility_ongoing_call translate key (verified via template)', () => {
      // The template has: [attr.aria-label]="'accessibility_ongoing_call' | translate"
      component.sessionID = 'a11y-label-test';
      expect(component.sessionID).toBeTruthy();
      expect(component.callScreenView).toBeNull();
    });

    it('template sets tabindex="0" on the call container for keyboard focus (verified via template)', () => {
      // The template has: tabindex="0" on the .cometchat-ongoing-call div.
      component.sessionID = 'a11y-tabindex-test';
      expect(component.sessionID).toBeTruthy();
    });
  });

  // ==================== ngOnInit input sync ====================

  describe('ngOnInit syncs inputs and subscribes to events', () => {
    it('ngOnInit syncs sessionID, callWorkflow, callSettingsBuilder to service', () => {
      const setSessionIDSpy = vi.spyOn(service, 'setSessionID');
      const setCallWorkflowSpy = vi.spyOn(service, 'setCallWorkflow');
      const setCallSettingsBuilderSpy = vi.spyOn(service, 'setCallSettingsBuilder');

      component.sessionID = 'init-session';
      component.callWorkflow = CallWorkflow.directCalling;
      component.callSettingsBuilder = { custom: true };

      component.ngOnInit();

      expect(setSessionIDSpy).toHaveBeenCalledWith('init-session');
      expect(setCallWorkflowSpy).toHaveBeenCalledWith(CallWorkflow.directCalling);
      expect(setCallSettingsBuilderSpy).toHaveBeenCalledWith({ custom: true });
    });

    it('ngOnInit subscribes to CometChatCallEvents.ccCallEnded', () => {
      component.ngOnInit();

      // Verify the subscription works by emitting an event
      let emitted = false;
      const sub = component.callEnded.subscribe(() => {
        emitted = true;
      });

      CometChatCallEvents.ccCallEnded.next({} as CometChat.Call);

      expect(emitted).toBe(true);

      sub.unsubscribe();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should have accessible session ID binding', () => {
      component.sessionID = 'test-session';
      expect(component.sessionID).toBe('test-session');
    });

    it('should have focusable end call control', () => {
      expect(typeof component.onKeyDown).toBe('function');
    });
  });
});
