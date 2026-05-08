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
  login: vi.fn().mockResolvedValue({ uid: 'mock-user' }),
  generateToken: vi.fn().mockResolvedValue({ token: 'call-token-abc' }),
  joinSession: vi.fn().mockResolvedValue({ error: null }),
  leaveSession: vi.fn(),
  addEventListener: vi.fn().mockReturnValue(() => {}),
  removeEventListener: vi.fn(),
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
 * Extracts the event listener callbacks registered via addEventListener
 * by intercepting the mock and capturing what was registered.
 *
 * In v5, events are registered via CometChatUIKitCalls.addEventListener()
 * rather than via OngoingCallListener constructor.
 */
function extractRegisteredListeners(service: any, sessionID: string, onError?: Function) {
  const listeners: Record<string, Function> = {};

  // Intercept addEventListener to capture registered callbacks
  mockCallsSDK.addEventListener = vi.fn().mockImplementation((eventName: string, cb: Function) => {
    listeners[eventName] = cb;
    return () => {}; // unsubscribe fn
  });

  // Trigger listener registration by calling startCall internals
  // We call registerSessionEventListeners directly via the private method
  (service as any).registerSessionEventListeners(sessionID, onError);

  return listeners;
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
    mockCallsSDK.login = vi.fn().mockResolvedValue({ uid: 'mock-user' });
    mockCallsSDK.generateToken = vi.fn().mockResolvedValue({ token: 'call-token-abc' });
    mockCallsSDK.joinSession = vi.fn().mockResolvedValue({ error: null });
    mockCallsSDK.leaveSession = vi.fn();
    mockCallsSDK.addEventListener = vi.fn().mockReturnValue(() => {});
    mockCallsSDK.removeEventListener = vi.fn();

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
    it('should return a plain SessionSettings object when no custom settings set', () => {
      service.setCallSettingsBuilder(null);
      const result = service.getCallSettings('sess-1');
      expect(result).toBeTypeOf('object');
      expect(result).toHaveProperty('sessionType');
      expect(result).toHaveProperty('layout');
    });

    it('should return sessionType VIDEO by default (not audio-only)', () => {
      service.setCallSettingsBuilder(null);
      service.setIsAudioOnly(false);
      const result = service.getCallSettings('sess-video');
      expect(result.sessionType).toBe('VIDEO');
    });

    it('should return sessionType VOICE when isAudioOnly is true', () => {
      service.setCallSettingsBuilder(null);
      service.setIsAudioOnly(true);
      const result = service.getCallSettings('sess-voice');
      expect(result.sessionType).toBe('VOICE');
    });

    it('should return custom settings object when set', () => {
      const customSettings = { sessionType: 'VOICE', layout: 'SIDEBAR', custom: true };
      service.setCallSettingsBuilder(customSettings);
      const result = service.getCallSettings('sess-custom');
      expect(result).toBe(customSettings);
    });

    it('should not call addEventListener when getCallSettings is called', () => {
      service.setCallSettingsBuilder(null);
      service.getCallSettings('sess-no-events');
      // addEventListener is called in registerSessionEventListeners, not getCallSettings
      expect(mockCallsSDK.addEventListener).not.toHaveBeenCalled();
    });
  });

  // ==================== Session Event Listeners (v5) ====================

  describe('Session event listeners (v5 addEventListener)', () => {
    describe('onSessionLeft - defaultCalling', () => {
      beforeEach(() => {
        service.setCallWorkflow(CallWorkflow.defaultCalling);
      });

      it('should call CometChat.clearActiveCall()', () => {
        const listeners = extractRegisteredListeners(service, 'sess-left');
        listeners['onSessionLeft']();
        expect(clearActiveCallSpy).toHaveBeenCalledOnce();
      });

      it('should emit ccCallEnded with null', () => {
        let emittedValue: any = 'not-emitted';
        CometChatCallEvents.ccCallEnded.subscribe(v => {
          emittedValue = v;
        });
        const listeners = extractRegisteredListeners(service, 'sess-left');
        listeners['onSessionLeft']();
        expect(emittedValue).toBeNull();
      });

      it('should set isCallActive to false', () => {
        service['_isCallActive'].set(true);
        const listeners = extractRegisteredListeners(service, 'sess-left');
        listeners['onSessionLeft']();
        expect(service.isCallActive()).toBe(false);
      });
    });

    describe('onLeaveSessionButtonClicked - defaultCalling', () => {
      beforeEach(() => {
        service.setCallWorkflow(CallWorkflow.defaultCalling);
      });

      it('should call CometChat.endCall with the session ID', async () => {
        const listeners = extractRegisteredListeners(service, 'sess-btn');
        listeners['onLeaveSessionButtonClicked']();
        await vi.waitFor(() => {
          expect(endCallSpy).toHaveBeenCalledWith('sess-btn');
        });
      });

      it('should call leaveSession and emit ccCallEnded after endCall succeeds', async () => {
        const order: string[] = [];
        endCallSpy.mockImplementation(async () => {
          order.push('endCall');
          return createMockCall();
        });
        mockCallsSDK.leaveSession = vi.fn().mockImplementation(() => {
          order.push('leaveSession');
        });
        CometChatCallEvents.ccCallEnded.subscribe(() => {
          order.push('ccCallEnded');
        });

        const listeners = extractRegisteredListeners(service, 'sess-btn-order');
        listeners['onLeaveSessionButtonClicked']();

        await vi.waitFor(() => {
          expect(order).toEqual(['endCall', 'leaveSession', 'ccCallEnded']);
        });
      });

      it('should set isCallActive to false after successful endCall', async () => {
        service['_isCallActive'].set(true);
        const listeners = extractRegisteredListeners(service, 'sess-btn-active');
        listeners['onLeaveSessionButtonClicked']();
        await vi.waitFor(() => {
          expect(service.isCallActive()).toBe(false);
        });
      });

      it('should forward error to onError callback when endCall fails', async () => {
        endCallSpy.mockRejectedValue(new Error('endCall failed'));
        const onError = vi.fn();
        const listeners = extractRegisteredListeners(service, 'sess-btn-err', onError);
        listeners['onLeaveSessionButtonClicked']();
        await vi.waitFor(() => {
          expect(onError).toHaveBeenCalledOnce();
        });
        const exception = onError.mock.calls[0][0];
        expect(exception).toBeInstanceOf(CometChat.CometChatException);
      });
    });

    describe('onLeaveSessionButtonClicked - directCalling', () => {
      beforeEach(() => {
        service.setCallWorkflow(CallWorkflow.directCalling);
      });

      it('should emit ccCallEnded then call leaveSession', () => {
        const order: string[] = [];
        CometChatCallEvents.ccCallEnded.subscribe(() => {
          order.push('ccCallEnded');
        });
        mockCallsSDK.leaveSession = vi.fn().mockImplementation(() => {
          order.push('leaveSession');
        });
        const listeners = extractRegisteredListeners(service, 'sess-direct-btn');
        listeners['onLeaveSessionButtonClicked']();
        expect(order).toEqual(['ccCallEnded', 'leaveSession']);
      });

      it('should NOT call CometChat.endCall', () => {
        const listeners = extractRegisteredListeners(service, 'sess-direct-btn2');
        listeners['onLeaveSessionButtonClicked']();
        expect(endCallSpy).not.toHaveBeenCalled();
      });

      it('should set isCallActive to false', () => {
        service['_isCallActive'].set(true);
        const listeners = extractRegisteredListeners(service, 'sess-direct-btn3');
        listeners['onLeaveSessionButtonClicked']();
        expect(service.isCallActive()).toBe(false);
      });
    });

    describe('addEventListener registration', () => {
      it('should register onSessionLeft and onLeaveSessionButtonClicked listeners', () => {
        const listeners = extractRegisteredListeners(service, 'sess-reg');
        expect(listeners['onSessionLeft']).toBeDefined();
        expect(listeners['onLeaveSessionButtonClicked']).toBeDefined();
      });
    });
  });

  // ==================== startCall() ====================

  describe('startCall()', () => {
    const frame = document.createElement('div');

    it('should call SDK methods in correct order: generateToken → joinSession', async () => {
      const callOrder: string[] = [];
      mockCallsSDK.generateToken = vi.fn().mockImplementation(async () => {
        callOrder.push('generateToken');
        return { token: 'tok' };
      });
      mockCallsSDK.joinSession = vi.fn().mockImplementation(async () => {
        callOrder.push('joinSession');
        return { error: null };
      });

      service.setSessionID('sess-1');
      await service.startCall(frame);
      expect(callOrder).toEqual(['generateToken', 'joinSession']);
    });

    it('should pass only sessionID to generateToken (no authToken in v5)', async () => {
      service.setSessionID('sess-abc');
      await service.startCall(frame);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('sess-abc');
      expect(mockCallsSDK.generateToken).not.toHaveBeenCalledWith('sess-abc', expect.anything());
    });

    it('should pass generated token, session settings, and frame to joinSession', async () => {
      service.setSessionID('sess-xyz');
      await service.startCall(frame);
      expect(mockCallsSDK.joinSession).toHaveBeenCalledWith(
        'call-token-abc',
        expect.any(Object),
        frame
      );
    });

    it('should register event listeners before joining session', async () => {
      service.setSessionID('sess-events');
      await service.startCall(frame);
      expect(mockCallsSDK.addEventListener).toHaveBeenCalled();
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
  });

  // ==================== endSession() ====================

  describe('endSession()', () => {
    it('should call CometChatUIKitCalls.leaveSession()', () => {
      service.endSession();
      expect(mockCallsSDK.leaveSession).toHaveBeenCalledOnce();
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
      expect(mockCallsSDK.leaveSession).toHaveBeenCalledTimes(2);
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

    it('should call endSession (leaveSession) after CometChat.endCall succeeds', async () => {
      await service.endCall();
      expect(mockCallsSDK.leaveSession).toHaveBeenCalledOnce();
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

    it('should follow correct order: endCall → leaveSession → ccCallEnded', async () => {
      const order: string[] = [];
      endCallSpy.mockImplementation(async () => {
        order.push('endCall');
        return createMockCall();
      });
      mockCallsSDK.leaveSession = vi.fn().mockImplementation(() => {
        order.push('leaveSession');
      });
      CometChatCallEvents.ccCallEnded.subscribe(() => {
        order.push('ccCallEnded');
      });
      await service.endCall();
      expect(order).toEqual(['endCall', 'leaveSession', 'ccCallEnded']);
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

    it('should emit ccCallEnded then call leaveSession', async () => {
      const order: string[] = [];
      CometChatCallEvents.ccCallEnded.subscribe(() => {
        order.push('ccCallEnded');
      });
      mockCallsSDK.leaveSession = vi.fn().mockImplementation(() => {
        order.push('leaveSession');
      });
      await service.endCall();
      expect(order).toEqual(['ccCallEnded', 'leaveSession']);
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
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('first-sess');

      await service.endCall();
      expect(endCallSpy).toHaveBeenCalledWith('first-sess');

      service.setSessionID('second-sess');
      await service.startCall(frame);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('second-sess');

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

    it('should transition to false via listener onSessionLeft callback', () => {
      service.setCallWorkflow(CallWorkflow.defaultCalling);
      service['_isCallActive'].set(true);
      const listeners = extractRegisteredListeners(service, 'sess-listener-transition');
      expect(service.isCallActive()).toBe(true);
      listeners['onSessionLeft']();
      expect(service.isCallActive()).toBe(false);
    });

    it('should transition to false via listener onLeaveSessionButtonClicked (directCalling)', () => {
      service.setCallWorkflow(CallWorkflow.directCalling);
      service['_isCallActive'].set(true);
      const listeners = extractRegisteredListeners(service, 'sess-btn-transition');
      expect(service.isCallActive()).toBe(true);
      listeners['onLeaveSessionButtonClicked']();
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
      expect(mockCallsSDK.joinSession).toHaveBeenCalledTimes(2);
    });

    it('should handle startCall with empty sessionID', async () => {
      service.setSessionID('');
      await service.startCall(frame);
      expect(mockCallsSDK.generateToken).toHaveBeenCalledWith('');
      expect(service.isCallActive()).toBe(true);
    });

    it('should handle endSession called multiple times without error', () => {
      service.setSessionID('multi-end');
      service['_isCallActive'].set(true);
      service.endSession();
      expect(service.isCallActive()).toBe(false);
      expect(() => service.endSession()).not.toThrow();
      expect(mockCallsSDK.leaveSession).toHaveBeenCalledTimes(2);
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

    it('should wrap non-Error rejection from joinSession with ONGOING_CALL_ERROR code', async () => {
      mockCallsSDK.joinSession = vi.fn().mockRejectedValue({ custom: 'error-object' });
      const onError = vi.fn();
      service.setSessionID('sess-wrap');
      const frame = document.createElement('div');
      await expect(service.startCall(frame, onError)).rejects.toThrow();
      const exception = onError.mock.calls[0][0];
      expect(exception).toBeInstanceOf(CometChat.CometChatException);
      expect(exception.code).toBe('ONGOING_CALL_ERROR');
    });
  });
});
