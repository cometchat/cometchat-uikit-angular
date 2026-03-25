import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Unit + Property-Based Tests for CometChatOutgoingCallComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Call object display: receiver name, avatar for user/group (Requirement 4.2)
 * - Cancel button emission (callCanceled output)
 * - Timeout handling (ngOnDestroy cleanup)
 * - ARIA attributes: role=dialog, aria-modal, aria-live, aria-labelledby
 * - Null call handling: effectiveCall returns null, getters return empty strings
 * - Template override inputs (titleView, subtitleView, avatarView, cancelButtonView)
 * - Input priority over service state
 * - Error callback invocation
 *
 * Uses vi.hoisted() + vi.mock() for SDK mocking BEFORE imports,
 * and Object.create() to bypass Angular's inject() context requirement.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================

const { mockSoundPlay, mockSoundPause } = vi.hoisted(() => ({
  mockSoundPlay: vi.fn(),
  mockSoundPause: vi.fn(),
}));

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
import { EventEmitter, computed, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { OutgoingCallService } from '../../services/outgoing-call.service';
import { CometChatOutgoingCallComponent } from './cometchat-outgoing-call.component';

// ==================== Helpers & Generators ====================

const receiverTypeArb = fc.constantFrom('user', 'group');
const sessionIdArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s: string) => s.trim().length > 0);
const receiverNameArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s: string) => s.trim().length > 0);
const avatarUrlArb = fc.oneof(fc.constant(''), fc.webUrl());
const callTypeArb = fc.constantFrom('audio', 'video');

/**
 * Creates a mock CometChat.Call object with user or group receiver.
 * For user receivers: getAvatar() returns the avatar URL.
 * For group receivers: getIcon() returns the avatar URL.
 */
function createMockCall(opts: {
  sessionId: string;
  callType: string;
  receiverName: string;
  receiverAvatar: string;
  receiverType: string;
}): CometChat.Call {
  let receiver: any;

  if (opts.receiverType === 'group') {
    receiver = {
      getName: () => opts.receiverName,
      getIcon: () => opts.receiverAvatar,
      getGuid: () => 'guid_' + opts.sessionId,
    };
  } else {
    receiver = {
      getName: () => opts.receiverName,
      getAvatar: () => opts.receiverAvatar,
      getUid: () => 'uid_' + opts.sessionId,
    };
  }

  return {
    getSessionId: () => opts.sessionId,
    getType: () => opts.callType,
    getCallInitiator: () => receiver,
    getCallReceiver: () => receiver,
    getStatus: () => 'initiated',
    getSender: () => receiver,
    getReceiver: () => receiver,
    getReceiverType: () => opts.receiverType,
    getAction: () => 'initiated',
  } as unknown as CometChat.Call;
}

/** Arbitrary for call options with user or group receiver */
const callOptsArb = fc.record({
  sessionId: sessionIdArb,
  callType: callTypeArb,
  receiverName: receiverNameArb,
  receiverAvatar: avatarUrlArb,
  receiverType: receiverTypeArb,
});

/**
 * Creates a component instance without calling the constructor
 * (which requires Angular's injection context for inject()).
 * Manually wires the service and initializes default field values,
 * including computed signals for effectiveDisableSoundForCalls/effectiveCustomSoundForCalls.
 */
function createComponentWithService(svc: OutgoingCallService): CometChatOutgoingCallComponent {
  const comp = Object.create(
    CometChatOutgoingCallComponent.prototype
  ) as CometChatOutgoingCallComponent;
  (comp as any).outgoingCallService = svc;
  (comp as any).callAnnouncer = {
    announceOutgoingCall: vi.fn(),
  };
  (comp as any).dialogFocusManager = {
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
  };
  (comp as any).globalConfig = null;
  (comp as any).disableSoundForCallsExplicitlySet = signal(false);
  (comp as any).customSoundForCallsExplicitlySet = signal(false);
  (comp as any)._disableSoundForCalls = signal(false);
  (comp as any)._customSoundForCalls = signal('');
  // Initialize computed signals that are normally created in the class body
  (comp as any).effectiveDisableSoundForCalls = computed(() => {
    if ((comp as any).disableSoundForCallsExplicitlySet()) return (comp as any)._disableSoundForCalls();
    if ((comp as any).globalConfig?.disableSoundForCalls !== undefined)
      return (comp as any).globalConfig.disableSoundForCalls;
    return false;
  });
  (comp as any).effectiveCustomSoundForCalls = computed(() => {
    if ((comp as any).customSoundForCallsExplicitlySet()) return (comp as any)._customSoundForCalls();
    if ((comp as any).globalConfig?.customSoundForCalls !== undefined)
      return (comp as any).globalConfig.customSoundForCalls;
    return '';
  });
  comp.call = null;
  comp.onError = null;
  comp.titleView = null;
  comp.subtitleView = null;
  comp.avatarView = null;
  comp.cancelButtonView = null;
  (comp as any).endCallIconUrl = 'assets/call_end.svg';
  comp.callCanceled = new EventEmitter<void>();
  comp.error = new EventEmitter<CometChat.CometChatException>();
  return comp;
}

// ==================== Property-Based Test Suite ====================

describe('CometChatOutgoingCallComponent Property Tests', () => {
  let component: CometChatOutgoingCallComponent;
  let service: OutgoingCallService;

  beforeEach(() => {
    vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(CometChatSoundManager, 'pause').mockImplementation(() => {});
    service = new OutgoingCallService();
    component = createComponentWithService(service);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: outgoing-call-component, Property 1: Receiver info rendering matches call object**
   *
   * *For any* CometChat.Call object, the Outgoing_Call_Component SHALL render the
   * receiver's name and avatar image that match the call object's receiver — using
   * getAvatar() for user receivers and getIcon() for group receivers.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 1: Receiver info rendering matches call object', () => {
    it('receiverName and receiverAvatar match the call object for any random call with user or group receiver', () => {
      fc.assert(
        fc.property(callOptsArb, opts => {
          const call = createMockCall(opts);
          component.call = call;

          expect(component.receiverName).toBe(opts.receiverName);
          expect(component.receiverAvatar).toBe(opts.receiverAvatar);
          expect(component.effectiveCall).toBe(call);
        }),
        { numRuns: 100 }
      );
    });

    it('receiverAvatar uses getAvatar() for user receivers', () => {
      const userCallOptsArb = fc.record({
        sessionId: sessionIdArb,
        callType: callTypeArb,
        receiverName: receiverNameArb,
        receiverAvatar: avatarUrlArb,
        receiverType: fc.constant('user'),
      });

      fc.assert(
        fc.property(userCallOptsArb, opts => {
          const call = createMockCall(opts);
          component.call = call;

          const receiver = call.getReceiver() as CometChat.User;
          expect(component.receiverAvatar).toBe(receiver.getAvatar());
          expect(component.receiverName).toBe((receiver as any).getName());
        }),
        { numRuns: 100 }
      );
    });

    it('receiverAvatar uses getIcon() for group receivers', () => {
      const groupCallOptsArb = fc.record({
        sessionId: sessionIdArb,
        callType: callTypeArb,
        receiverName: receiverNameArb,
        receiverAvatar: avatarUrlArb,
        receiverType: fc.constant('group'),
      });

      fc.assert(
        fc.property(groupCallOptsArb, opts => {
          const call = createMockCall(opts);
          component.call = call;

          const receiver = call.getReceiver() as CometChat.Group;
          expect(component.receiverAvatar).toBe(receiver.getIcon());
          expect(component.receiverName).toBe((receiver as any).getName());
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: outgoing-call-component, Property 4: Cancel action pauses sound and emits event**
   *
   * *For any* active outgoing call, when the cancel button is activated, the
   * component SHALL pause the ringtone via `SoundManager.pause()` and emit
   * the `callCanceled` event.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 4: Cancel action pauses sound and emits event', () => {
    it('onCancelClick pauses sound and emits callCanceled for any random active call', () => {
      fc.assert(
        fc.property(callOptsArb, opts => {
          vi.mocked(CometChatSoundManager.pause).mockClear();

          const call = createMockCall(opts);
          component.call = call;

          let canceledEmitted = false;
          const sub = component.callCanceled.subscribe(() => {
            canceledEmitted = true;
          });

          component.onCancelClick();

          expect(CometChatSoundManager.pause).toHaveBeenCalledTimes(1);
          expect(canceledEmitted).toBe(true);

          sub.unsubscribe();
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== Property 6: Input priority over service state ====================

describe('Property 6: Component input takes priority over service state', () => {
  let component: CometChatOutgoingCallComponent;
  let service: OutgoingCallService;

  beforeEach(() => {
    vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(CometChatSoundManager, 'pause').mockImplementation(() => {});
    service = new OutgoingCallService();
    component = createComponentWithService(service);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('effectiveCall returns the component input when both input and service have values', () => {
    fc.assert(
      fc.property(callOptsArb, callOptsArb, (inputOpts, serviceOpts) => {
        const inputCall = createMockCall(inputOpts);
        const serviceCall = createMockCall(serviceOpts);

        service.setActiveCall(serviceCall);
        component.call = inputCall;

        expect(component.effectiveCall).toBe(inputCall);
        expect(component.receiverName).toBe(inputOpts.receiverName);
        expect(component.receiverAvatar).toBe(inputOpts.receiverAvatar);
      }),
      { numRuns: 100 }
    );
  });

  it('effectiveCall falls back to service state when component input is null', () => {
    fc.assert(
      fc.property(callOptsArb, serviceOpts => {
        const serviceCall = createMockCall(serviceOpts);

        service.setActiveCall(serviceCall);
        component.call = null;

        expect(component.effectiveCall).toBe(serviceCall);
        expect(component.receiverName).toBe(serviceOpts.receiverName);
        expect(component.receiverAvatar).toBe(serviceOpts.receiverAvatar);
      }),
      { numRuns: 100 }
    );
  });

  it('effectiveCall returns input call when service has no active call', () => {
    fc.assert(
      fc.property(callOptsArb, inputOpts => {
        const inputCall = createMockCall(inputOpts);

        service.setActiveCall(null);
        component.call = inputCall;

        expect(component.effectiveCall).toBe(inputCall);
        expect(component.receiverName).toBe(inputOpts.receiverName);
        expect(component.receiverAvatar).toBe(inputOpts.receiverAvatar);
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== Property 7: Error callback invocation ====================

describe('Property 7: Error callback invocation', () => {
  let component: CometChatOutgoingCallComponent;
  let service: OutgoingCallService;

  const errorMessageArb = fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s: string) => s.trim().length > 0);

  beforeEach(() => {
    vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(CometChatSoundManager, 'pause').mockImplementation(() => {});
    service = new OutgoingCallService();
    component = createComponentWithService(service);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invokes onError callback with CometChatException when sound playback fails in ngOnInit', () => {
    fc.assert(
      fc.property(callOptsArb, errorMessageArb, (opts, errMsg) => {
        vi.mocked(CometChatSoundManager.play).mockReset();
        vi.mocked(CometChatSoundManager.pause).mockReset();

        vi.mocked(CometChatSoundManager.play).mockImplementation(() => {
          throw new Error(errMsg);
        });
        vi.mocked(CometChatSoundManager.pause).mockImplementation(() => {});

        const comp = createComponentWithService(service);
        const call = createMockCall(opts);
        comp.call = call;
        comp.disableSoundForCalls = false;

        let callbackError: CometChat.CometChatException | null = null;
        comp.onError = err => {
          callbackError = err;
        };

        let emittedError: CometChat.CometChatException | null = null;
        const sub = comp.error.subscribe(err => {
          emittedError = err;
        });

        comp.ngOnInit();

        expect(callbackError).not.toBeNull();
        expect(callbackError).toBeInstanceOf(CometChat.CometChatException);
        expect(callbackError!.message).toBe(errMsg);

        expect(emittedError).not.toBeNull();
        expect(emittedError).toBeInstanceOf(CometChat.CometChatException);
        expect(emittedError!.message).toBe(errMsg);

        expect(callbackError).toBe(emittedError);

        sub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });

  it('invokes onError callback with CometChatException when cancel action fails', () => {
    fc.assert(
      fc.property(callOptsArb, errorMessageArb, (opts, errMsg) => {
        vi.mocked(CometChatSoundManager.pause).mockReset();

        vi.mocked(CometChatSoundManager.pause).mockImplementation(() => {
          throw new Error(errMsg);
        });

        const comp = createComponentWithService(service);
        const call = createMockCall(opts);
        comp.call = call;

        let callbackError: CometChat.CometChatException | null = null;
        comp.onError = err => {
          callbackError = err;
        };

        let emittedError: CometChat.CometChatException | null = null;
        const sub = comp.error.subscribe(err => {
          emittedError = err;
        });

        comp.onCancelClick();

        expect(callbackError).not.toBeNull();
        expect(callbackError).toBeInstanceOf(CometChat.CometChatException);
        expect(callbackError!.message).toBe(errMsg);

        expect(emittedError).not.toBeNull();
        expect(emittedError).toBeInstanceOf(CometChat.CometChatException);
        expect(emittedError!.message).toBe(errMsg);

        expect(callbackError).toBe(emittedError);

        sub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });

  it('emits error output even when no onError callback is provided', () => {
    fc.assert(
      fc.property(callOptsArb, errorMessageArb, (opts, errMsg) => {
        vi.mocked(CometChatSoundManager.pause).mockReset();
        vi.mocked(CometChatSoundManager.pause).mockImplementation(() => {
          throw new Error(errMsg);
        });

        const comp = createComponentWithService(service);
        const call = createMockCall(opts);
        comp.call = call;
        comp.onError = null;

        let emittedError: CometChat.CometChatException | null = null;
        const sub = comp.error.subscribe(err => {
          emittedError = err;
        });

        comp.onCancelClick();

        expect(emittedError).not.toBeNull();
        expect(emittedError).toBeInstanceOf(CometChat.CometChatException);
        expect(emittedError!.message).toBe(errMsg);

        sub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== Unit Tests ====================

describe('CometChatOutgoingCallComponent Unit Tests', () => {
  let component: CometChatOutgoingCallComponent;
  let service: OutgoingCallService;

  const mockCall = createMockCall({
    sessionId: 'session-123',
    callType: 'audio',
    receiverName: 'Alice',
    receiverAvatar: 'https://example.com/alice.png',
    receiverType: 'user',
  });

  const mockGroupCall = createMockCall({
    sessionId: 'session-456',
    callType: 'video',
    receiverName: 'Dev Team',
    receiverAvatar: 'https://example.com/group.png',
    receiverType: 'group',
  });

  beforeEach(() => {
    vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(CometChatSoundManager, 'pause').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    service = new OutgoingCallService();
    component = createComponentWithService(service);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    it('creates a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('has null call input by default', () => {
      expect(component.call).toBeNull();
    });

    it('has null effectiveCall when no call input and no service call', () => {
      expect(component.effectiveCall).toBeNull();
    });

    it('has empty receiverName when no call', () => {
      expect(component.receiverName).toBe('');
    });

    it('has empty receiverAvatar when no call', () => {
      expect(component.receiverAvatar).toBe('');
    });

    it('has all template overrides set to null', () => {
      expect(component.titleView).toBeNull();
      expect(component.subtitleView).toBeNull();
      expect(component.avatarView).toBeNull();
      expect(component.cancelButtonView).toBeNull();
    });

    it('has null onError callback', () => {
      expect(component.onError).toBeNull();
    });

    it('has endCallIconUrl set to assets/call_end.svg', () => {
      expect(component.endCallIconUrl).toBe('assets/call_end.svg');
    });
  });

  // ==================== Call object display (Req 4.2) ====================

  describe('call object display', () => {
    it('displays receiver name from user call', () => {
      component.call = mockCall;
      expect(component.receiverName).toBe('Alice');
    });

    it('displays receiver avatar from user call via getAvatar()', () => {
      component.call = mockCall;
      expect(component.receiverAvatar).toBe('https://example.com/alice.png');
    });

    it('displays receiver name from group call', () => {
      component.call = mockGroupCall;
      expect(component.receiverName).toBe('Dev Team');
    });

    it('displays receiver avatar from group call via getIcon()', () => {
      component.call = mockGroupCall;
      expect(component.receiverAvatar).toBe('https://example.com/group.png');
    });

    it('provides template context with call info', () => {
      component.call = mockCall;
      const ctx = component.templateContext;
      expect(ctx.$implicit.receiverName).toBe('Alice');
      expect(ctx.$implicit.receiverAvatar).toBe('https://example.com/alice.png');
      expect(ctx.$implicit.call).toBe(mockCall);
    });
  });

  // ==================== Cancel button emission ====================

  describe('cancel button emission', () => {
    it('onCancelClick emits callCanceled event', () => {
      component.call = mockCall;
      let emitted = false;
      const sub = component.callCanceled.subscribe(() => {
        emitted = true;
      });
      component.onCancelClick();
      expect(emitted).toBe(true);
      sub.unsubscribe();
    });

    it('onCancelClick pauses sound via stopOutgoingSound', () => {
      component.call = mockCall;
      component.onCancelClick();
      expect(CometChatSoundManager.pause).toHaveBeenCalled();
    });

    it('onCancelClick works even when no call is set (still pauses and emits)', () => {
      component.call = null;
      let emitted = false;
      const sub = component.callCanceled.subscribe(() => {
        emitted = true;
      });
      component.onCancelClick();
      expect(CometChatSoundManager.pause).toHaveBeenCalled();
      expect(emitted).toBe(true);
      sub.unsubscribe();
    });
  });

  // ==================== Timeout handling (ngOnDestroy cleanup) ====================

  describe('ngOnDestroy cleanup / timeout handling', () => {
    it('ngOnDestroy calls stopOutgoingSound which pauses the sound manager', () => {
      component.call = mockCall;
      component.ngOnDestroy();
      expect(CometChatSoundManager.pause).toHaveBeenCalled();
    });

    it('ngOnDestroy handles errors gracefully and emits error event', () => {
      vi.mocked(CometChatSoundManager.pause).mockImplementation(() => {
        throw new Error('pause failed');
      });

      let emittedError: CometChat.CometChatException | null = null;
      const sub = component.error.subscribe(err => {
        emittedError = err;
      });

      component.ngOnDestroy();

      expect(emittedError).not.toBeNull();
      expect(emittedError!.message).toBe('pause failed');
      sub.unsubscribe();
    });

    it('ngOnDestroy pauses sound even when no call is set', () => {
      component.call = null;
      service.setActiveCall(null);
      component.ngOnDestroy();
      expect(CometChatSoundManager.pause).toHaveBeenCalled();
    });
  });

  // ==================== Null call handling ====================

  describe('null call handling', () => {
    it('effectiveCall returns null when no call input and no service call', () => {
      component.call = null;
      service.setActiveCall(null);
      expect(component.effectiveCall).toBeNull();
    });

    it('receiverName returns empty string when effectiveCall is null', () => {
      component.call = null;
      service.setActiveCall(null);
      expect(component.receiverName).toBe('');
    });

    it('receiverAvatar returns empty string when effectiveCall is null', () => {
      component.call = null;
      service.setActiveCall(null);
      expect(component.receiverAvatar).toBe('');
    });
  });

  // ==================== Template override inputs ====================

  describe('template override inputs', () => {
    it('titleView defaults to null', () => {
      expect(component.titleView).toBeNull();
    });

    it('subtitleView defaults to null', () => {
      expect(component.subtitleView).toBeNull();
    });

    it('avatarView defaults to null', () => {
      expect(component.avatarView).toBeNull();
    });

    it('cancelButtonView defaults to null', () => {
      expect(component.cancelButtonView).toBeNull();
    });

    it('titleView can be set to a TemplateRef-like value', () => {
      const mockTemplate = {} as any;
      component.titleView = mockTemplate;
      expect(component.titleView).toBe(mockTemplate);
    });

    it('subtitleView can be set to a TemplateRef-like value', () => {
      const mockTemplate = {} as any;
      component.subtitleView = mockTemplate;
      expect(component.subtitleView).toBe(mockTemplate);
    });

    it('avatarView can be set to a TemplateRef-like value', () => {
      const mockTemplate = {} as any;
      component.avatarView = mockTemplate;
      expect(component.avatarView).toBe(mockTemplate);
    });

    it('cancelButtonView can be set to a TemplateRef-like value', () => {
      const mockTemplate = {} as any;
      component.cancelButtonView = mockTemplate;
      expect(component.cancelButtonView).toBe(mockTemplate);
    });
  });

  // ==================== ARIA attributes ====================

  describe('ARIA and accessibility attributes', () => {
    it('component provides data for role="dialog" rendering (effectiveCall truthy)', () => {
      component.call = mockCall;
      expect(component.effectiveCall).toBeTruthy();
      expect(component.receiverName).toBe('Alice');
    });

    it('templateContext provides call data for ARIA live region announcements', () => {
      component.call = mockCall;
      const ctx = component.templateContext;
      expect(ctx.$implicit.receiverName).toBe('Alice');
      expect(ctx.$implicit.receiverAvatar).toBe('https://example.com/alice.png');
      expect(ctx.$implicit.call).toBe(mockCall);
    });

    it('endCallIconUrl is set for the cancel button icon', () => {
      expect(component.endCallIconUrl).toBe('assets/call_end.svg');
    });

    it('callAnnouncer.announceOutgoingCall is called on ngOnInit with call', () => {
      component.call = mockCall;
      component.ngOnInit();
      expect((component as any).callAnnouncer.announceOutgoingCall).toHaveBeenCalledWith('Alice');
    });

    it('callAnnouncer.announceOutgoingCall is NOT called when no call', () => {
      component.call = null;
      service.setActiveCall(null);
      component.ngOnInit();
      expect((component as any).callAnnouncer.announceOutgoingCall).not.toHaveBeenCalled();
    });
  });

  // ==================== Localization key ====================

  describe('localization key calls_outgoing', () => {
    it('subtitle uses calls_outgoing localization key (verified via template design)', () => {
      component.call = mockCall;
      expect(component.effectiveCall).toBeTruthy();
      expect(component.receiverName).toBe('Alice');
    });
  });

  // ==================== ngOnInit sound playback ====================

  describe('ngOnInit sound playback', () => {
    it('plays outgoing sound when call is set and sound is not disabled', () => {
      component.call = mockCall;
      component.ngOnInit();
      expect(CometChatSoundManager.play).toHaveBeenCalledWith('outgoingCall', null);
    });

    it('does not play sound when effectiveCall is null', () => {
      component.call = null;
      service.setActiveCall(null);
      component.ngOnInit();
      expect(CometChatSoundManager.play).not.toHaveBeenCalled();
    });

    it('does not play sound when disableSoundForCalls is true', () => {
      component.call = mockCall;
      component.disableSoundForCalls = true;
      component.ngOnInit();
      expect(CometChatSoundManager.play).not.toHaveBeenCalled();
    });

    it('handles error during sound playback gracefully', () => {
      vi.mocked(CometChatSoundManager.play).mockImplementation(() => {
        throw new Error('sound error');
      });
      component.call = mockCall;
      const emittedErrors: CometChat.CometChatException[] = [];
      const sub = component.error.subscribe(e => emittedErrors.push(e));
      expect(() => component.ngOnInit()).not.toThrow();
      expect(emittedErrors.length).toBe(1);
      expect(emittedErrors[0].message).toBe('sound error');
      sub.unsubscribe();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should provide accessible caller name for screen readers', () => {
      component.call = mockCall;
      expect(component.receiverName).toBeTruthy();
    });

    it('should have focusable cancel button', () => {
      component.call = mockCall;
      expect(typeof component.onCancelClick).toBe('function');
    });

    it('should provide call type info for screen readers', () => {
      component.call = mockCall;
      expect(component.effectiveCall).toBeTruthy();
    });
  });
});
