/**
 * OngoingCallService Tests
 *
 * Categories: Initialization, Signal State Management, Call Settings,
 *             Listener Callbacks, Session Lifecycle, End Call Flow,
 *             Error Handling, Edge Cases, Null/Undefined Parameter Handling
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/ongoing-call
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================

const mockCallsSDK = {
  generateToken: vi.fn().mockResolvedValue({ token: 'call-token-abc' }),
  startSession: vi.fn(),
  endSession: vi.fn(),
  CallSettingsBuilder: vi.fn().mockImplementation(function (this: any) {
    this.enableDefaultLayout = vi.fn().mockReturnThis();
    this.setIsAudioOnlyCall = vi.fn().mockReturnThis();
    this.setCallListener = vi.fn().mockReturnThis();
    this.build = vi.fn().mockReturnValue({ settings: true });
  }),
  OngoingCallListener: class {
    constructor(public callbacks: any) {}
  },
};

vi.mock('../CometChatCalls', () => ({
  CometChatUIKitCalls: mockCallsSDK,
  _setCallsSDKForTesting: vi.fn(),
}));

vi.mock('../cometchat-uikit', () => ({
  CometChatUIKit: {
    callingReady: Promise.resolve(),
  },
}));

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, fetchTestUser, fetchTestGroup } from '../test-setup';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CallWorkflow } from '../Enums/Enums';

// ==================== Helpers ====================

function createMockUser(authToken = 'mock-auth-token') {
  return {
    getAuthToken: () => authToken,
    getUid: () => 'user-1',
    getName: () => 'TestUser',
  } as unknown as CometChat.User;
}

function createMockCall(sessionId = 'session-123'): CometChat.Call {
  return {
    getSessionId: () => sessionId,
    getType: () => 'audio',
    getStatus: () => 'ongoing',
    getAction: () => 'ongoing',
    getSender: () => ({ getUid: () => 'user-1', getName: () => 'TestUser' }),
    getReceiver: () => ({ getUid: () => 'user-2', getName: () => 'TestUser2' }),
    getReceiverType: () => 'user',
  } as unknown as CometChat.Call;
}

/**
 * Extracts the listener callbacks from getCallSettings by
 * intercepting the OngoingCallListener constructor.
 */
function extractListenerCallbacks(service: any, sessionID: string, onError?: Function) {
  let capturedCallbacks: any = null;
  const origListener = mockCallsSDK.OngoingCallListener;

  mockCallsSDK.OngoingCallListener = class {
    constructor(callbacks: any) {
      capturedCallbacks = callbacks;
    }
  } as any;

  service.getCallSettings(sessionID, onError);

  mockCallsSDK.OngoingCallListener = origListener;
  return capturedCallbacks;
}

// ==================== Test Suite ====================

describe('OngoingCallService', () => {
  let service: any;
  let OngoingCallService: any;
  let testUser: CometChat.User;
  let testGroup: CometChat.Group;
  let originalCcCallEnded: Subject<CometChat.Call>;

  // CometChat SDK spies
  let getLoggedinUserSpy: ReturnType<typeof vi.spyOn>;
  let endCallSpy: ReturnType<typeof vi.spyOn>;
  let clearActiveCallSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testGroup = await fetchTestGroup('supergroup');
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(async () => {
    // Save and replace event subjects for isolation
    originalCcCallEnded = CometChatCallEvents.ccCallEnded;
    CometChatCallEvents.ccCallEnded = new Subject<CometChat.Call>();

    // Reset all mock implementations to defaults
    mockCallsSDK.generateToken = vi.fn().mockResolvedValue({ token: 'call-token-abc' });
    mockCallsSDK.startSession = vi.fn();
    mockCallsSDK.endSession = vi.fn();
    mockCallsSDK.CallSettingsBuilder = vi.fn().mockImplementation(function (this: any) {
      this.enableDefaultLayout = vi.fn().mockReturnThis();
      this.setIsAudioOnlyCall = vi.fn().mockReturnThis();
      this.setCallListener = vi.fn().mockReturnThis();
      this.build = vi.fn().mockReturnValue({ settings: true });
    });
    mockCallsSDK.OngoingCallListener = class {
      constructor(public callbacks: any) {}
    };

    // Clear accumulated calls from global mocks before creating spies
    vi.mocked(CometChat.getLoggedinUser).mockClear();
    vi.mocked(CometChat.endCall).mockClear();
    vi.mocked(CometChat.clearActiveCall).mockClear();

    // Mock CometChat SDK methods
    getLoggedinUserSpy = vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(createMockUser());
    endCallSpy = vi.spyOn(CometChat, 'endCall').mockResolvedValue(createMockCall());
    clearActiveCallSpy = vi.spyOn(CometChat, 'clearActiveCall').mockImplementation(() => {});

    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Dynamic import to ensure mocks are in place
    const mod = await import('./ongoing-call.service');
    OngoingCallService = mod.OngoingCallService;
    service = new OngoingCallService();
  });

  afterEach(() => {
    CometChatCallEvents.ccCallEnded = originalCcCallEnded;
    vi.restoreAllMocks();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root via TestBed', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const injected = TestBed.inject(OngoingCallService);
      expect(injected).toBeTruthy();
    });

    it('should have empty sessionID by default', () => {
      expect(service.sessionID()).toBe('');
    });

    it('should have isCallActive as false by default', () => {
      expect(service.isCallActive()).toBe(false);
    });

    it('should have callWorkflow as defaultCalling by default', () => {
      expect(service.callWorkflow()).toBe(CallWorkflow.defaultCalling);
    });

    it('should have callSettingsBuilder as null by default', () => {
      expect(service.callSettingsBuilder()).toBeNull();
    });

    it('should verify real SDK user object is available from test setup', () => {
      expect(testUser).toBeTruthy();
      expect(testUser.getUid()).toBe('superhero1');
    });

    it('should verify real SDK group object is available from test setup', () => {
      expect(testGroup).toBeTruthy();
      expect(testGroup.getGuid()).toBe('supergroup');
    });
  });

  // ==================== Signal State Management ====================

  describe('Signal State Management', () => {
    it('should update sessionID signal via setSessionID', () => {
      service.setSessionID('my-session-42');
      expect(service.sessionID()).toBe('my-session-42');
    });

    it('should update callWorkflow signal via setCallWorkflow', () => {
      service.setCallWorkflow(CallWorkflow.directCalling);
      expect(service.callWorkflow()).toBe(CallWorkflow.directCalling);
    });

    it('should update callSettingsBuilder signal via setCallSettingsBuilder', () => {
      const builder = { build: vi.fn() };
      service.setCallSettingsBuilder(builder);
      expect(service.callSettingsBuilder()).toBe(builder);
    });

    it('should allow overwriting sessionID multiple times', () => {
      service.setSessionID('first');
      expect(service.sessionID()).toBe('first');
      service.setSessionID('second');
      expect(service.sessionID()).toBe('second');
      service.setSessionID('third');
      expect(service.sessionID()).toBe('third');
    });

    it('should allow toggling callWorkflow back and forth', () => {
      service.setCallWorkflow(CallWorkflow.directCalling);
      expect(service.callWorkflow()).toBe(CallWorkflow.directCalling);
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      expect(service.callWorkflow()).toBe(CallWorkflow.defaultCalling);
    });

    it('should allow setting callSettingsBuilder back to null', () => {
      const builder = { build: vi.fn() };
      service.setCallSettingsBuilder(builder);
      expect(service.callSettingsBuilder()).toBe(builder);
      service.setCallSettingsBuilder(null);
      expect(service.callSettingsBuilder()).toBeNull();
    });

    it('should return consistent signal values across multiple reads', () => {
      service.setSessionID('consistent-sess');
      const read1 = service.sessionID();
      const read2 = service.sessionID();
      const read3 = service.sessionID();
      expect(read1).toBe(read2);
      expect(read2).toBe(read3);
    });
  });

  // ==================== getCallSettings() ====================

  describe('getCallSettings()', () => {
    it('should create default builder when no custom builder is set', () => {
      service.setCallSettingsBuilder(null);
      const result = service.getCallSettings('sess-1');
      expect(mockCallsSDK.CallSettingsBuilder).toHaveBeenCalled();
      expect(result).toEqual({ settings: true });
    });

    it('should use custom builder when set', () => {
      const customBuilder = {
        setCallListener: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({ custom: true }),
      };
      service.setCallSettingsBuilder(customBuilder);
      const result = service.getCallSettings('sess-custom');
      expect(customBuilder.setCallListener).toHaveBeenCalled();
      expect(customBuilder.build).toHaveBeenCalled();
      expect(result).toEqual({ custom: true });
    });

    it('should attach OngoingCallListener to the builder', () => {
      const customBuilder = {
        setCallListener: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({}),
      };
      service.setCallSettingsBuilder(customBuilder);
      service.getCallSettings('sess-listener');
      expect(customBuilder.setCallListener).toHaveBeenCalledOnce();
      const listener = customBuilder.setCallListener.mock.calls[0][0];
      expect(listener).toBeDefined();
    });

    it('should call enableDefaultLayout(true) on default builder', () => {
      service.setCallSettingsBuilder(null);
      service.getCallSettings('sess-default-layout');
      const builderInstance = mockCallsSDK.CallSettingsBuilder.mock.instances[0] as any;
      expect(builderInstance.enableDefaultLayout).toHaveBeenCalledWith(true);
    });

    it('should call setIsAudioOnlyCall(false) on default builder', () => {
      service.setCallSettingsBuilder(null);
      service.getCallSettings('sess-audio-only');
      const builderInstance = mockCallsSDK.CallSettingsBuilder.mock.instances[0] as any;
      expect(builderInstance.setIsAudioOnlyCall).toHaveBeenCalledWith(false);
    });
  });

  // ==================== Listener Callbacks ====================

  describe('OngoingCallListener callbacks', () => {
    describe('onCallEnded - defaultCalling', () => {
      beforeEach(() => {
        service.setCallWorkflow(CallWorkflow.defaultCalling);
      });

      it('should call CometChatUIKitCalls.endSession()', () => {
        const callbacks = extractListenerCallbacks(service, 'sess-ended');
        callbacks.onCallEnded();
        expect(mockCallsSDK.endSession).toHaveBeenCalledOnce();
      });

      it('should call CometChat.clearActiveCall()', () => {
        const callbacks = extractListenerCallbacks(service, 'sess-ended');
        callbacks.onCallEnded();
        expect(clearActiveCallSpy).toHaveBeenCalledOnce();
      });

      it('should emit ccCallEnded with null', () => {
        let emittedValue: any = 'not-emitted';
        CometChatCallEvents.ccCallEnded.subscribe(v => {
          emittedValue = v;
        });
        const callbacks = extractListenerCallbacks(service, 'sess-ended');
        callbacks.onCallEnded();
        expect(emittedValue).toBeNull();
      });

      it('should set isCallActive to false', () => {
        service['_isCallActive'].set(true);
        const callbacks = extractListenerCallbacks(service, 'sess-ended');
        callbacks.onCallEnded();
        expect(service.isCallActive()).toBe(false);
      });
    });

    describe('onCallEndButtonPressed - defaultCalling', () => {
      beforeEach(() => {
        service.setCallWorkflow(CallWorkflow.defaultCalling);
      });

      it('should call CometChat.endCall with the session ID', async () => {
        const callbacks = extractListenerCallbacks(service, 'sess-btn');
        callbacks.onCallEndButtonPressed();
        await vi.waitFor(() => {
          expect(endCallSpy).toHaveBeenCalledWith('sess-btn');
        });
      });

      it('should call endSession and emit ccCallEnded after endCall succeeds', async () => {
        const order: string[] = [];
        endCallSpy.mockImplementation(async () => {
          order.push('endCall');
          return createMockCall();
        });
        mockCallsSDK.endSession = vi.fn().mockImplementation(() => {
          order.push('endSession');
        });
        CometChatCallEvents.ccCallEnded.subscribe(() => {
          order.push('ccCallEnded');
        });

        const callbacks = extractListenerCallbacks(service, 'sess-btn-order');
        callbacks.onCallEndButtonPressed();

        await vi.waitFor(() => {
          expect(order).toEqual(['endCall', 'endSession', 'ccCallEnded']);
        });
      });

      it('should set isCallActive to false after successful endCall', async () => {
        service['_isCallActive'].set(true);
        const callbacks = extractListenerCallbacks(service, 'sess-btn-active');
        callbacks.onCallEndButtonPressed();
        await vi.waitFor(() => {
          expect(service.isCallActive()).toBe(false);
        });
      });

      it('should forward error to onError callback when endCall fails', async () => {
        endCallSpy.mockRejectedValue(new Error('endCall failed'));
        const onError = vi.fn();
        const callbacks = extractListenerCallbacks(service, 'sess-btn-err', onError);
        callbacks.onCallEndButtonPressed();
        await vi.waitFor(() => {
          expect(onError).toHaveBeenCalledOnce();
        });
        const exception = onError.mock.calls[0][0];
        expect(exception).toBeInstanceOf(CometChat.CometChatException);
      });
    });

    describe('onCallEndButtonPressed - directCalling', () => {
      beforeEach(() => {
        service.setCallWorkflow(CallWorkflow.directCalling);
      });

      it('should emit ccCallEnded then call endSession', () => {
        const order: string[] = [];
        CometChatCallEvents.ccCallEnded.subscribe(() => {
          order.push('ccCallEnded');
        });
        mockCallsSDK.endSession = vi.fn().mockImplementation(() => {
          order.push('endSession');
        });
        const callbacks = extractListenerCallbacks(service, 'sess-direct-btn');
        callbacks.onCallEndButtonPressed();
        expect(order).toEqual(['ccCallEnded', 'endSession']);
      });

      it('should NOT call CometChat.endCall', () => {
        const callbacks = extractListenerCallbacks(service, 'sess-direct-btn2');
        callbacks.onCallEndButtonPressed();
        expect(endCallSpy).not.toHaveBeenCalled();
      });

      it('should set isCallActive to false', () => {
        service['_isCallActive'].set(true);
        const callbacks = extractListenerCallbacks(service, 'sess-direct-btn3');
        callbacks.onCallEndButtonPressed();
        expect(service.isCallActive()).toBe(false);
      });
    });

    describe('onError', () => {
      it('should forward error to onError callback as CometChatException', () => {
        const onError = vi.fn();
        const callbacks = extractListenerCallbacks(service, 'sess-onerr', onError);
        callbacks.onError(new Error('SDK error'));
        expect(onError).toHaveBeenCalledOnce();
        const exception = onError.mock.calls[0][0];
        expect(exception).toBeInstanceOf(CometChat.CometChatException);
        expect(exception.code).toBe('ONGOING_CALL_ERROR');
      });

      it('should not throw when no onError callback is provided', () => {
        const callbacks = extractListenerCallbacks(service, 'sess-onerr-none');
        expect(() => callbacks.onError(new Error('no handler'))).not.toThrow();
      });
    });
  });

  // ==================== startCall() ====================

  describe('startCall()', () => {
    const frame = document.createElement('div');

    it('should call SDK methods in correct order: getLoggedinUser → generateToken → startSession', async () => {
      const callOrder: string[] = [];
      getLoggedinUserSpy.mockImplementation(async () => {
        callOrder.push('getLoggedinUser');
        return createMockUser();
      });
      mockCallsSDK.generateToken = vi.fn().mockImplementation(async () => {
        callOrder.push('generateToken');
        return { token: 'tok' };
      });
      mockCallsSDK.startSession = vi.fn().mockImplementation(() => {
        callOrder.push('startSession');
      });

      service.setSessionID('sess-1');
      await service.startCall(frame);
      expect(callOrder).toEqual(['getLoggedinUser', 'generateToken', 'startSession']);
    });

    it('should pass sessionID and authToken to generateToken', async () => {
      service.setSessionID('sess-abc');
      await service.startCall(frame);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('sess-abc', 'mock-auth-token');
    });

    it('should pass generated token, call settings, and frame to startSession', async () => {
      service.setSessionID('sess-xyz');
      await service.startCall(frame);
      expect(mockCallsSDK.startSession).toHaveBeenCalledWith(
        'call-token-abc',
        expect.any(Object),
        frame
      );
    });

    it('should set isCallActive to true on success', async () => {
      expect(service.isCallActive()).toBe(false);
      service.setSessionID('sess-1');
      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);
    });

    it('should wrap error in CometChatException when generateToken fails', async () => {
      mockCallsSDK.generateToken = vi.fn().mockRejectedValue(new Error('Token generation failed'));
      const onError = vi.fn();
      service.setSessionID('sess-err');
      await expect(service.startCall(frame, onError)).rejects.toThrow();
      expect(onError).toHaveBeenCalledOnce();
      const exception = onError.mock.calls[0][0];
      expect(exception).toBeInstanceOf(CometChat.CometChatException);
      expect(exception.code).toBe('ONGOING_CALL_ERROR');
    });

    it('should not set isCallActive to true when startCall fails', async () => {
      mockCallsSDK.generateToken = vi.fn().mockRejectedValue(new Error('fail'));
      service.setSessionID('sess-fail');
      try {
        await service.startCall(frame);
      } catch {
        /* expected */
      }
      expect(service.isCallActive()).toBe(false);
    });

    it('should throw when getLoggedinUser returns null', async () => {
      getLoggedinUserSpy.mockResolvedValue(null as any);
      const onError = vi.fn();
      service.setSessionID('no-user');
      await expect(service.startCall(frame, onError)).rejects.toThrow();
      expect(onError).toHaveBeenCalledOnce();
      expect(service.isCallActive()).toBe(false);
    });
  });

  // ==================== endSession() ====================

  describe('endSession()', () => {
    it('should call CometChatUIKitCalls.endSession()', () => {
      service.endSession();
      expect(mockCallsSDK.endSession).toHaveBeenCalledOnce();
    });

    it('should set isCallActive to false', () => {
      service['_isCallActive'].set(true);
      expect(service.isCallActive()).toBe(true);
      service.endSession();
      expect(service.isCallActive()).toBe(false);
    });

    it('should reset sessionID to empty string', () => {
      service.setSessionID('sess-active');
      expect(service.sessionID()).toBe('sess-active');
      service.endSession();
      expect(service.sessionID()).toBe('');
    });

    it('should handle being called multiple times without error', () => {
      service.setSessionID('multi-end');
      service['_isCallActive'].set(true);
      service.endSession();
      expect(service.isCallActive()).toBe(false);
      expect(() => service.endSession()).not.toThrow();
      expect(mockCallsSDK.endSession).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== endCall() ====================

  describe('endCall() - defaultCalling workflow', () => {
    beforeEach(() => {
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service.setSessionID('sess-default');
    });

    it('should call CometChat.endCall with the session ID', async () => {
      await service.endCall();
      expect(endCallSpy).toHaveBeenCalledWith('sess-default');
    });

    it('should call endSession after CometChat.endCall succeeds', async () => {
      await service.endCall();
      expect(mockCallsSDK.endSession).toHaveBeenCalledOnce();
    });

    it('should emit ccCallEnded with the ended call object', async () => {
      let emittedValue: any = null;
      CometChatCallEvents.ccCallEnded.subscribe(v => {
        emittedValue = v;
      });
      await service.endCall();
      expect(emittedValue).toBeTruthy();
      expect(emittedValue.getSessionId()).toBe('session-123');
    });

    it('should follow correct order: endCall → endSession → ccCallEnded', async () => {
      const order: string[] = [];
      endCallSpy.mockImplementation(async () => {
        order.push('endCall');
        return createMockCall();
      });
      mockCallsSDK.endSession = vi.fn().mockImplementation(() => {
        order.push('endSession');
      });
      CometChatCallEvents.ccCallEnded.subscribe(() => {
        order.push('ccCallEnded');
      });
      await service.endCall();
      expect(order).toEqual(['endCall', 'endSession', 'ccCallEnded']);
    });

    it('should wrap error from CometChat.endCall on failure', async () => {
      endCallSpy.mockRejectedValue(new Error('endCall failed'));
      const onError = vi.fn();
      await expect(service.endCall(onError)).rejects.toThrow();
      expect(onError).toHaveBeenCalledOnce();
      const exception = onError.mock.calls[0][0];
      expect(exception).toBeInstanceOf(CometChat.CometChatException);
      expect(exception.code).toBe('ONGOING_CALL_ERROR');
    });

    it('should set isCallActive to false after successful endCall', async () => {
      service['_isCallActive'].set(true);
      await service.endCall();
      expect(service.isCallActive()).toBe(false);
    });
  });

  describe('endCall() - directCalling workflow', () => {
    beforeEach(() => {
      service.setCallWorkflow(CallWorkflow.directCalling);
      service.setSessionID('sess-direct');
    });

    it('should NOT call CometChat.endCall', async () => {
      await service.endCall();
      expect(endCallSpy).not.toHaveBeenCalled();
    });

    it('should emit ccCallEnded then call endSession', async () => {
      const order: string[] = [];
      CometChatCallEvents.ccCallEnded.subscribe(() => {
        order.push('ccCallEnded');
      });
      mockCallsSDK.endSession = vi.fn().mockImplementation(() => {
        order.push('endSession');
      });
      await service.endCall();
      expect(order).toEqual(['ccCallEnded', 'endSession']);
    });

    it('should set isCallActive to false', async () => {
      service['_isCallActive'].set(true);
      await service.endCall();
      expect(service.isCallActive()).toBe(false);
    });

    it('should reset sessionID to empty string', async () => {
      await service.endCall();
      expect(service.sessionID()).toBe('');
    });
  });

  // ==================== Session Lifecycle ====================

  describe('Session lifecycle (setSessionID → startCall → endCall → verify cleanup)', () => {
    const frame = document.createElement('div');

    it('should complete full lifecycle with defaultCalling', async () => {
      service.setSessionID('lifecycle-sess');
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      expect(service.sessionID()).toBe('lifecycle-sess');
      expect(service.isCallActive()).toBe(false);

      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);

      await service.endCall();
      expect(service.isCallActive()).toBe(false);
      expect(service.sessionID()).toBe('');
    });

    it('should complete full lifecycle with directCalling', async () => {
      service.setSessionID('lifecycle-direct');
      service.setCallWorkflow(CallWorkflow.directCalling);

      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);

      await service.endCall();
      expect(service.isCallActive()).toBe(false);
      expect(service.sessionID()).toBe('');
    });

    it('should reset sessionID after endSession()', async () => {
      service.setSessionID('sess-to-clear');
      await service.startCall(frame);

      service.endSession();
      expect(service.sessionID()).toBe('');
      expect(service.isCallActive()).toBe(false);
    });

    it('should support start → end → start → end cycle', async () => {
      service.setSessionID('session-1');
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);

      await service.endCall();
      expect(service.isCallActive()).toBe(false);
      expect(service.sessionID()).toBe('');

      service.setSessionID('session-2');
      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);

      await service.endCall();
      expect(service.isCallActive()).toBe(false);
      expect(service.sessionID()).toBe('');
    });

    it('should use correct sessionID for each sequential session', async () => {
      service.setSessionID('first-sess');
      await service.startCall(frame);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('first-sess', 'mock-auth-token');

      await service.endCall();
      expect(endCallSpy).toHaveBeenCalledWith('first-sess');

      service.setSessionID('second-sess');
      await service.startCall(frame);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('second-sess', 'mock-auth-token');

      await service.endCall();
      expect(endCallSpy).toHaveBeenCalledWith('second-sess');
    });

    it('should allow switching workflow between sessions', async () => {
      // First session: defaultCalling
      service.setSessionID('sess-dc');
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      await service.startCall(frame);
      await service.endCall();
      expect(endCallSpy).toHaveBeenCalledWith('sess-dc');

      // Second session: directCalling
      endCallSpy.mockClear();
      service.setSessionID('sess-direct');
      service.setCallWorkflow(CallWorkflow.directCalling);
      await service.startCall(frame);
      await service.endCall();
      expect(endCallSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== isCallActive Signal Transitions ====================

  describe('isCallActive signal transitions', () => {
    const frame = document.createElement('div');

    it('should transition false → true → false during successful call', async () => {
      const transitions: boolean[] = [];
      transitions.push(service.isCallActive()); // false

      service.setSessionID('transition-test');
      await service.startCall(frame);
      transitions.push(service.isCallActive()); // true

      await service.endCall();
      transitions.push(service.isCallActive()); // false

      expect(transitions).toEqual([false, true, false]);
    });

    it('should remain false when startCall fails', async () => {
      mockCallsSDK.generateToken = vi.fn().mockRejectedValue(new Error('token fail'));
      expect(service.isCallActive()).toBe(false);
      service.setSessionID('fail-test');
      try {
        await service.startCall(frame);
      } catch {
        /* expected */
      }
      expect(service.isCallActive()).toBe(false);
    });

    it('should transition to false via endSession() after startCall', async () => {
      service.setSessionID('end-session-test');
      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);
      service.endSession();
      expect(service.isCallActive()).toBe(false);
    });

    it('should transition to false via listener onCallEnded callback', () => {
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service['_isCallActive'].set(true);
      const callbacks = extractListenerCallbacks(service, 'sess-listener-transition');
      expect(service.isCallActive()).toBe(true);
      callbacks.onCallEnded();
      expect(service.isCallActive()).toBe(false);
    });

    it('should transition to false via listener onCallEndButtonPressed (directCalling)', () => {
      service.setCallWorkflow(CallWorkflow.directCalling);
      service['_isCallActive'].set(true);
      const callbacks = extractListenerCallbacks(service, 'sess-btn-transition');
      expect(service.isCallActive()).toBe(true);
      callbacks.onCallEndButtonPressed();
      expect(service.isCallActive()).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    const frame = document.createElement('div');

    it('should handle endCall when no session is active (defaultCalling)', async () => {
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service.setSessionID('');
      await service.endCall();
      expect(endCallSpy).toHaveBeenCalledWith('');
      expect(service.isCallActive()).toBe(false);
    });

    it('should handle endCall when no session is active (directCalling)', async () => {
      service.setCallWorkflow(CallWorkflow.directCalling);
      service.setSessionID('');
      await service.endCall();
      expect(endCallSpy).not.toHaveBeenCalled();
      expect(service.isCallActive()).toBe(false);
    });

    it('should handle calling startCall twice in sequence', async () => {
      service.setSessionID('double-start');
      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);
      await service.startCall(frame);
      expect(service.isCallActive()).toBe(true);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledTimes(2);
      expect(mockCallsSDK.startSession).toHaveBeenCalledTimes(2);
    });

    it('should handle startCall with empty sessionID', async () => {
      service.setSessionID('');
      await service.startCall(frame);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('', 'mock-auth-token');
      expect(service.isCallActive()).toBe(true);
    });

    it('should handle endSession called multiple times without error', () => {
      service.setSessionID('multi-end');
      service['_isCallActive'].set(true);
      service.endSession();
      expect(service.isCallActive()).toBe(false);
      expect(() => service.endSession()).not.toThrow();
      expect(mockCallsSDK.endSession).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid set/clear of sessionID without errors', () => {
      for (let i = 0; i < 50; i++) {
        service.setSessionID(`sess-${i}`);
        service.setSessionID('');
      }
      expect(service.sessionID()).toBe('');
    });

    it('should handle rapid workflow toggles', () => {
      for (let i = 0; i < 30; i++) {
        service.setCallWorkflow(
          i % 2 === 0 ? CallWorkflow.defaultCalling : CallWorkflow.directCalling
        );
      }
      // Last iteration: i=29, 29%2=1 → directCalling
      expect(service.callWorkflow()).toBe(CallWorkflow.directCalling);
    });
  });

  // ==================== Null/Undefined Parameter Handling ====================

  describe('Null/Undefined Parameter Handling', () => {
    it('should handle setSessionID with empty string', () => {
      service.setSessionID('');
      expect(service.sessionID()).toBe('');
    });

    it('should handle setCallSettingsBuilder with undefined', () => {
      service.setCallSettingsBuilder(undefined);
      expect(service.callSettingsBuilder()).toBeUndefined();
    });

    it('should handle setCallSettingsBuilder with null', () => {
      service.setCallSettingsBuilder(null);
      expect(service.callSettingsBuilder()).toBeNull();
    });

    it('should handle endCall with no onError callback (success)', async () => {
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service.setSessionID('no-cb');
      await expect(service.endCall()).resolves.toBeUndefined();
    });

    it('should handle endCall error without onError callback (defaultCalling)', async () => {
      endCallSpy.mockRejectedValue(new Error('fail'));
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service.setSessionID('no-cb-err');
      await expect(service.endCall()).rejects.toThrow();
    });

    it('should handle startCall with no onError callback when it fails', async () => {
      mockCallsSDK.generateToken = vi.fn().mockRejectedValue(new Error('fail'));
      service.setSessionID('no-cb-start');
      await expect(service.startCall(document.createElement('div'))).rejects.toThrow();
    });
  });

  // ==================== Error Wrapping ====================

  describe('Error wrapping (toCometchatException)', () => {
    it('should preserve CometChatException if already one', async () => {
      const sdkException = new CometChat.CometChatException({
        code: 'ERR_ALREADY',
        message: 'Already a CometChatException',
        details: '',
      });
      endCallSpy.mockRejectedValue(sdkException);
      const onError = vi.fn();
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service.setSessionID('preserve-exc');
      await expect(service.endCall(onError)).rejects.toThrow();
      const exception = onError.mock.calls[0][0];
      expect(exception).toBe(sdkException);
      expect(exception.code).toBe('ERR_ALREADY');
    });

    it('should wrap plain Error with ONGOING_CALL_ERROR code', async () => {
      endCallSpy.mockRejectedValue(new Error('plain error'));
      const onError = vi.fn();
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service.setSessionID('wrap-plain');
      await expect(service.endCall(onError)).rejects.toThrow();
      const exception = onError.mock.calls[0][0];
      expect(exception).toBeInstanceOf(CometChat.CometChatException);
      expect(exception.code).toBe('ONGOING_CALL_ERROR');
      expect(exception.message).toContain('plain error');
    });

    it('should wrap non-Error values with ONGOING_CALL_ERROR code', async () => {
      endCallSpy.mockRejectedValue('string-error');
      const onError = vi.fn();
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service.setSessionID('wrap-string');
      await expect(service.endCall(onError)).rejects.toThrow();
      const exception = onError.mock.calls[0][0];
      expect(exception).toBeInstanceOf(CometChat.CometChatException);
      expect(exception.code).toBe('ONGOING_CALL_ERROR');
      expect(exception.message).toContain('string-error');
    });

    it('should wrap listener onError with ONGOING_CALL_ERROR code for non-Error values', () => {
      const onError = vi.fn();
      const callbacks = extractListenerCallbacks(service, 'sess-wrap', onError);
      callbacks.onError({ custom: 'error-object' });
      const exception = onError.mock.calls[0][0];
      expect(exception).toBeInstanceOf(CometChat.CometChatException);
      expect(exception.code).toBe('ONGOING_CALL_ERROR');
    });
  });
});
