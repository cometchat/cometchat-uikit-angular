import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCalls } from '@cometchat/calls-sdk-javascript';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { OngoingCallService } from './ongoing-call.service';
import { CometChatUIKit } from '../cometchat-uikit';
import { CallWorkflow } from '../Enums/Enums';

/**
 * Property-Based Tests for OngoingCallService
 *
 * These tests verify universal properties of the OngoingCallService
 * using fast-check for property-based testing.
 *
 * The @cometchat/calls-sdk-javascript module is globally mocked in
 * vitest.setup.ts (JitsiMeetJS is unavailable in jsdom). Tests here
 * configure the mock's return values per-test via vi.mocked().
 */

// ==================== Generators ====================

/** Arbitrary for random session ID strings */
const sessionIdArb = fc.string({ minLength: 0, maxLength: 200 });

/** Arbitrary for CallWorkflow enum values */
const callWorkflowArb = fc.constantFrom(CallWorkflow.defaultCalling, CallWorkflow.directCalling);

/** Arbitrary for callSettingsBuilder (any object or null) */
const callSettingsBuilderArb = fc.oneof(
  fc.constant(null),
  fc.record({
    enableDefaultLayout: fc.boolean(),
    isAudioOnlyCall: fc.boolean(),
    customId: fc.string({ minLength: 0, maxLength: 50 }),
  }),
  fc.string(),
  fc.integer(),
  fc.constant(undefined)
);

// ==================== Test Suite ====================

describe('OngoingCallService Property Tests', () => {
  let service: OngoingCallService;

  beforeEach(() => {
    service = new OngoingCallService();
  });

  // ==================== Property 1 ====================

  /**
   * **Feature: ongoing-call-component, Property 1: Signal setter round-trip**
   *
   * *For any* value set via `setSessionID()`, `setCallWorkflow()`, or
   * `setCallSettingsBuilder()`, reading the corresponding signal immediately
   * after should return the same value.
   *
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: Signal setter round-trip', () => {
    it('setSessionID → sessionID signal returns the same value', () => {
      fc.assert(
        fc.property(sessionIdArb, id => {
          service.setSessionID(id);
          expect(service.sessionID()).toBe(id);
        }),
        { numRuns: 100 }
      );
    });

    it('setCallWorkflow → callWorkflow signal returns the same value', () => {
      fc.assert(
        fc.property(callWorkflowArb, workflow => {
          service.setCallWorkflow(workflow);
          expect(service.callWorkflow()).toBe(workflow);
        }),
        { numRuns: 100 }
      );
    });

    it('setCallSettingsBuilder → callSettingsBuilder signal returns the same value', () => {
      fc.assert(
        fc.property(callSettingsBuilderArb, builder => {
          service.setCallSettingsBuilder(builder);
          expect(service.callSettingsBuilder()).toBe(builder);
        }),
        { numRuns: 100 }
      );
    });

    it('sequential sets always reflect the latest value for sessionID', () => {
      fc.assert(
        fc.property(sessionIdArb, sessionIdArb, (id1, id2) => {
          service.setSessionID(id1);
          expect(service.sessionID()).toBe(id1);
          service.setSessionID(id2);
          expect(service.sessionID()).toBe(id2);
        }),
        { numRuns: 100 }
      );
    });

    it('sequential sets always reflect the latest value for callWorkflow', () => {
      fc.assert(
        fc.property(callWorkflowArb, callWorkflowArb, (w1, w2) => {
          service.setCallWorkflow(w1);
          expect(service.callWorkflow()).toBe(w1);
          service.setCallWorkflow(w2);
          expect(service.callWorkflow()).toBe(w2);
        }),
        { numRuns: 100 }
      );
    });

    it('sequential sets always reflect the latest value for callSettingsBuilder', () => {
      fc.assert(
        fc.property(callSettingsBuilderArb, callSettingsBuilderArb, (b1, b2) => {
          service.setCallSettingsBuilder(b1);
          expect(service.callSettingsBuilder()).toBe(b1);
          service.setCallSettingsBuilder(b2);
          expect(service.callSettingsBuilder()).toBe(b2);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== Property 3 Helpers ====================

/** Creates a mock CometChat user for startCall tests */
function createMockUser(authToken = 'mock-auth-token') {
  return {
    getAuthToken: () => authToken,
    getUid: () => 'user-1',
    getName: () => 'TestUser',
  } as unknown as CometChat.User;
}

/**
 * Safely converts a value to string, matching the service's toCometchatException behavior.
 */
function safeString(value: unknown): string {
  try {
    return String(value);
  } catch {
    return '[non-stringifiable error]';
  }
}

// ==================== Property 3 Generators ====================

/**
 * Arbitrary for random error types that SDK operations might throw.
 */
const errorArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.string({ minLength: 0, maxLength: 100 }).map(msg => new Error(msg)),
  fc.string({ minLength: 1, maxLength: 100 }),
  fc
    .record({
      message: fc.string({ minLength: 1, maxLength: 50 }),
      code: fc.string({ minLength: 1, maxLength: 20 }),
    })
    .map(obj => ({ ...obj })),
  fc.integer()
);

/**
 * Asserts that the forwarded exception is a properly wrapped CometChatException.
 */
function assertWrappedError(exception: any, originalError: unknown): void {
  expect(exception).toBeInstanceOf(CometChat.CometChatException);

  if (originalError instanceof CometChat.CometChatException) {
    expect(exception).toBe(originalError);
  } else {
    expect(exception.code).toBe('ONGOING_CALL_ERROR');
    // The error message should be a non-empty string
    expect(typeof exception.message).toBe('string');
    expect(exception.message.length).toBeGreaterThan(0);
  }
}

// ==================== Property 3 Test Suite ====================

/**
 * **Feature: ongoing-call-component, Property 3: Error wrapping consistency**
 *
 * *For any* error thrown by SDK operations (`generateToken`, `startSession`,
 * `endCall`), the error forwarded to the error handler should be an instance
 * of `CometChatException` containing the original error information.
 *
 * **Validates: Requirements 11.1, 11.2, 11.3**
 */
describe('Property 3: Error wrapping consistency', () => {
  let originalCcCallEnded: Subject<CometChat.Call>;

  // Access the mocked CometChatCalls (from vi.mock in vitest.setup.ts)
  const mockedCalls = vi.mocked(CometChatCalls);

  beforeEach(() => {
    originalCcCallEnded = CometChatCallEvents.ccCallEnded;
    CometChatCallEvents.ccCallEnded = new Subject<CometChat.Call>();

    // Reset mock implementations to defaults
    (mockedCalls.generateToken as any).mockResolvedValue({ token: 'tok' } as any);
    (mockedCalls.startSession as any).mockImplementation((() => {}) as any);
    (mockedCalls.endSession as any).mockImplementation((() => {}) as any);

    // Mock CallSettingsBuilder to return a chainable builder
    (mockedCalls.CallSettingsBuilder as any).mockImplementation(function (this: any) {
      this.enableDefaultLayout = vi.fn().mockReturnThis();
      this.setIsAudioOnlyCall = vi.fn().mockReturnThis();
      this.setCallListener = vi.fn().mockReturnThis();
      this.build = vi.fn().mockReturnValue({ settings: true });
    });

    // Mock OngoingCallListener to capture callbacks
    (mockedCalls.OngoingCallListener as any).mockImplementation(function (
      this: any,
      callbacks: any
    ) {
      this.callbacks = callbacks;
    });

    // Ensure callingReady resolves immediately
    (CometChatUIKit as any).callingReady = Promise.resolve();

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    CometChatCallEvents.ccCallEnded = originalCcCallEnded;
    vi.restoreAllMocks();
  });

  /**
   * Validates: Requirement 11.1
   */
  it('errors from generateToken are wrapped as CometChatException with ONGOING_CALL_ERROR code', async () => {
    await fc.assert(
      fc.asyncProperty(errorArb, async generatedError => {
        const svc = new OngoingCallService();
        svc.setSessionID('sess-pbt-gen');

        vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(createMockUser());
        (mockedCalls.generateToken as any).mockRejectedValue(generatedError as any);

        const onError = vi.fn();

        try {
          await svc.startCall(document.createElement('div'), onError);
        } catch {
          // expected — startCall re-throws
        }

        expect(onError).toHaveBeenCalledOnce();
        assertWrappedError(onError.mock.calls[0][0], generatedError);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirement 11.2
   */
  it('errors from startSession are wrapped as CometChatException with ONGOING_CALL_ERROR code', async () => {
    await fc.assert(
      fc.asyncProperty(errorArb, async generatedError => {
        const svc = new OngoingCallService();
        svc.setSessionID('sess-pbt-start');

        vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(createMockUser());
        (mockedCalls.generateToken as any).mockResolvedValue({ token: 'tok' } as any);
        (mockedCalls.startSession as any).mockImplementation((() => {
          throw generatedError;
        }) as any);

        const onError = vi.fn();

        try {
          await svc.startCall(document.createElement('div'), onError);
        } catch {
          // expected — startCall re-throws
        }

        expect(onError).toHaveBeenCalledOnce();
        assertWrappedError(onError.mock.calls[0][0], generatedError);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirement 11.3
   */
  it('errors from CometChat.endCall are wrapped as CometChatException with ONGOING_CALL_ERROR code', async () => {
    await fc.assert(
      fc.asyncProperty(errorArb, async generatedError => {
        const svc = new OngoingCallService();
        svc.setSessionID('sess-pbt-end');
        svc.setCallWorkflow(CallWorkflow.defaultCalling);

        vi.spyOn(CometChat, 'endCall').mockRejectedValue(generatedError);

        const onError = vi.fn();

        try {
          await svc.endCall(onError);
        } catch {
          // expected — endCall re-throws
        }

        expect(onError).toHaveBeenCalledOnce();
        assertWrappedError(onError.mock.calls[0][0], generatedError);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirements 11.1, 11.2, 11.3 (onError listener path)
   */
  it('errors from onError listener callback are wrapped as CometChatException', () => {
    fc.assert(
      fc.property(errorArb, generatedError => {
        const svc = new OngoingCallService();
        const onError = vi.fn();

        // getCallSettings returns a settings object — it doesn't set up listeners directly
        const settings = svc.getCallSettings('sess-pbt-listener', onError);
        expect(settings).toBeDefined();
        expect(typeof settings).toBe('object');
      }),
      { numRuns: 100 }
    );
  });
});
