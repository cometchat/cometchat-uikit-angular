/**
 * CallLogsService Tests
 *
 * Categories: Initialization, Signal Defaults, Configuration Methods,
 *             fetchCallLogs (Success/Error), fetchNextCallLogs (Pagination),
 *             Call Initiation (Real SDK), cancelOutgoingCall (Real SDK),
 *             initialize/cleanup (Listeners & Subscriptions),
 *             Error Handling, Null/Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * NOTE: CallLogsService uses CometChatCalls.CallLogRequestBuilder from the calls SDK
 * for its default builder path. Since we must mock the calls SDK, the default builder
 * path is tested via the mock. Custom builder and all CometChat chat-SDK interactions
 * (initiateCall, rejectCall, addCallListener, etc.) use the real SDK.
 *
 * @module services/call-logs
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================

/**
 * Tracks all built CallLogRequest instances so tests can control fetchNext behavior.
 * Each call to .build() pushes the resulting request object here.
 */
const builtRequests: { fetchNext: ReturnType<typeof vi.fn> }[] = [];

vi.mock('../CometChatCalls', () => {
  return {
    CometChatUIKitCalls: {
      CallLogRequestBuilder: class MockCallLogRequestBuilder {
        private _limit = 30;
        private _category = '';
        private _authToken = '';
        setLimit(limit: number) {
          this._limit = limit;
          return this;
        }
        setCallCategory(cat: string) {
          this._category = cat;
          return this;
        }
        setAuthToken(token: string) {
          this._authToken = token;
          return this;
        }
        build() {
          const request = { fetchNext: vi.fn().mockResolvedValue([]) };
          builtRequests.push(request);
          return request;
        }
      },
      init: vi.fn().mockResolvedValue(true),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    },
  };
});

// ==================== Imports (after mocks) ====================

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ensureSdkReady, sdkCleanup, fetchTestUser, fetchTestGroup } from '../test-setup';
import { CallLogsService } from './call-logs.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States, MessageStatus } from '../Enums/Enums';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';

// ==================== Helpers ====================

/** Creates a mock call log object (as returned by the Calls SDK). */
function createMockCallLog(overrides: Record<string, any> = {}): any {
  return {
    sessionId: overrides['sessionId'] ?? 'session_' + Math.random().toString(36).slice(2),
    initiator: overrides['initiator'] ?? { uid: 'user1', name: 'User 1' },
    receiver: overrides['receiver'] ?? { uid: 'user2', name: 'User 2' },
    type: overrides['type'] ?? 'audio',
    status: overrides['status'] ?? 'ended',
    initiatedAt: overrides['initiatedAt'] ?? Date.now() / 1000,
    endedAt: overrides['endedAt'] ?? Date.now() / 1000,
    ...overrides,
  };
}

/** Creates a mock CallLogRequest with controllable fetchNext behavior. */
function createMockCallLogRequest(fetchNextFn: () => Promise<any[]>): any {
  return { fetchNext: vi.fn(fetchNextFn) };
}

/** Creates a mock CallLogRequestBuilder that returns a given request. */
function createMockBuilder(request: any): any {
  return { build: vi.fn(() => request) };
}

/**
 * Runs fetchCallLogs with fake timers.
 * The service has a MIN_SHIMMER_TIME (1000ms) setTimeout internally.
 */
async function runFetchCallLogs(service: CallLogsService): Promise<void> {
  const promise = service.fetchCallLogs();
  await vi.advanceTimersByTimeAsync(1500);
  await promise;
}

// ==================== Tests ====================

describe('CallLogsService', () => {
  let service: CallLogsService;
  let testUser: CometChat.User;
  let testUser2: CometChat.User;
  let testGroup: CometChat.Group;

  // Store original subjects for restoration
  let originalCcCallEnded: Subject<CometChat.Call>;
  let originalCcMessageSent: Subject<any>;

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testUser2 = await fetchTestUser('superhero2');
    testGroup = await fetchTestGroup('supergroup');
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    vi.useFakeTimers();

    // Save original subjects
    originalCcCallEnded = CometChatCallEvents.ccCallEnded;
    originalCcMessageSent = CometChatMessageEvents.ccMessageSent;

    // Replace with fresh subjects for test isolation
    CometChatCallEvents.ccCallEnded = new Subject<CometChat.Call>();
    CometChatMessageEvents.ccMessageSent = new Subject<any>();

    // Clear built requests tracker
    builtRequests.length = 0;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CallLogsService],
    });
    service = TestBed.inject(CallLogsService);
  });

  afterEach(() => {
    service.cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();

    // Restore original subjects
    CometChatCallEvents.ccCallEnded = originalCcCallEnded;
    CometChatMessageEvents.ccMessageSent = originalCcMessageSent;
  });

  // ==================== Initialization & Signal Defaults ====================

  describe('Initialization', () => {
    it('should be injectable via TestBed when explicitly provided', () => {
      expect(service).toBeTruthy();
      expect(service).toBeInstanceOf(CallLogsService);
    });

    it('should have initial state as loading', () => {
      expect(service.state()).toBe(States.loading);
    });

    it('should have empty call logs initially', () => {
      expect(service.callLogs()).toEqual([]);
    });

    it('should have hasMore as true initially', () => {
      expect(service.hasMore()).toBe(true);
    });

    it('should have showOutgoingCallScreen as false initially', () => {
      expect(service.showOutgoingCallScreen()).toBe(false);
    });

    it('should have showOngoingCall as false initially', () => {
      expect(service.showOngoingCall()).toBe(false);
    });

    it('should have activeCallObject as null initially', () => {
      expect(service.activeCallObject()).toBeNull();
    });

    it('should have sessionId as null initially', () => {
      expect(service.sessionId()).toBeNull();
    });
  });

  // ==================== Configuration Methods ====================

  describe('Configuration Methods', () => {
    it('should accept a custom CallLogRequestBuilder via setCallLogRequestBuilder', async () => {
      const mockLogs = [createMockCallLog()];
      const mockRequest = createMockCallLogRequest(async () => mockLogs);
      const mockBuilder = createMockBuilder(mockRequest);

      service.setCallLogRequestBuilder(mockBuilder);
      await runFetchCallLogs(service);

      expect(mockBuilder.build).toHaveBeenCalledOnce();
      expect(service.callLogs()).toEqual(mockLogs);
    });

    it('should reset internal request when a new builder is set', async () => {
      const mockRequest1 = createMockCallLogRequest(async () => [
        createMockCallLog({ sessionId: 'a' }),
      ]);
      const mockBuilder1 = createMockBuilder(mockRequest1);
      service.setCallLogRequestBuilder(mockBuilder1);
      await runFetchCallLogs(service);
      expect(service.callLogs().length).toBe(1);

      const mockRequest2 = createMockCallLogRequest(async () => [
        createMockCallLog({ sessionId: 'b' }),
        createMockCallLog({ sessionId: 'c' }),
      ]);
      const mockBuilder2 = createMockBuilder(mockRequest2);
      service.setCallLogRequestBuilder(mockBuilder2);
      await runFetchCallLogs(service);

      expect(mockBuilder2.build).toHaveBeenCalledOnce();
      expect(service.callLogs().length).toBe(2);
    });

    it('should set logged-in user without throwing', () => {
      expect(() => service.setLoggedInUser(testUser)).not.toThrow();
    });

    it('should set onError callback without throwing', () => {
      expect(() => service.setOnError(vi.fn())).not.toThrow();
    });

    it('should clear onError callback when null is passed', async () => {
      const callback = vi.fn();
      service.setOnError(callback);
      service.setOnError(null);

      const mockRequest = createMockCallLogRequest(async () => {
        throw new Error('test');
      });
      const mockBuilder = createMockBuilder(mockRequest);
      service.setCallLogRequestBuilder(mockBuilder);
      await runFetchCallLogs(service);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ==================== fetchCallLogs - Success ====================

  describe('fetchCallLogs - Success', () => {
    it('should fetch call logs and set state to loaded when results are returned', async () => {
      const mockLogs = [createMockCallLog(), createMockCallLog(), createMockCallLog()];
      const mockRequest = createMockCallLogRequest(async () => mockLogs);
      const mockBuilder = createMockBuilder(mockRequest);

      service.setCallLogRequestBuilder(mockBuilder);
      await runFetchCallLogs(service);

      expect(service.callLogs()).toEqual(mockLogs);
      expect(service.callLogs().length).toBe(3);
      expect(service.state()).toBe(States.loaded);
    });

    it('should set state to empty when no results are returned', async () => {
      const mockRequest = createMockCallLogRequest(async () => []);
      const mockBuilder = createMockBuilder(mockRequest);

      service.setCallLogRequestBuilder(mockBuilder);
      await runFetchCallLogs(service);

      expect(service.callLogs()).toEqual([]);
      expect(service.state()).toBe(States.empty);
      expect(service.hasMore()).toBe(false);
    });

    it('should clear existing call logs before fetching new ones', async () => {
      const mockLogs1 = [createMockCallLog()];
      const mockRequest1 = createMockCallLogRequest(async () => mockLogs1);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest1));
      await runFetchCallLogs(service);
      expect(service.callLogs().length).toBe(1);

      const mockLogs2 = [createMockCallLog(), createMockCallLog()];
      const mockRequest2 = createMockCallLogRequest(async () => mockLogs2);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest2));
      await runFetchCallLogs(service);

      expect(service.callLogs().length).toBe(2);
      expect(service.callLogs()).toEqual(mockLogs2);
    });

    it('should use default builder when no custom builder is set (uses logged-in user auth token)', async () => {
      service.setLoggedInUser(testUser);
      await runFetchCallLogs(service);

      // Default builder from mock returns empty array
      expect(service.state()).toBe(States.empty);
      // Verify a request was built via the mock CallLogRequestBuilder
      expect(builtRequests.length).toBeGreaterThanOrEqual(1);
    });

    it('should call fetchNext() on the built request', async () => {
      const mockRequest = createMockCallLogRequest(async () => [createMockCallLog()]);
      const mockBuilder = createMockBuilder(mockRequest);

      service.setCallLogRequestBuilder(mockBuilder);
      await runFetchCallLogs(service);

      expect(mockRequest.fetchNext).toHaveBeenCalled();
    });
  });

  // ==================== fetchCallLogs - Error ====================

  describe('fetchCallLogs - Error', () => {
    it('should set state to error when SDK rejects', async () => {
      const mockRequest = createMockCallLogRequest(async () => {
        throw new Error('SDK fetch failed');
      });
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);

      expect(service.state()).toBe(States.error);
    });

    it('should call onError callback when SDK rejects', async () => {
      const onErrorSpy = vi.fn();
      service.setOnError(onErrorSpy);

      const mockRequest = createMockCallLogRequest(async () => {
        throw new Error('Network error');
      });
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);

      expect(onErrorSpy).toHaveBeenCalledOnce();
      expect(onErrorSpy.mock.calls[0][0]).toBeDefined();
    });

    it('should handle CometChatException errors and forward to onError', async () => {
      const onErrorSpy = vi.fn();
      service.setOnError(onErrorSpy);

      const sdkError = new CometChat.CometChatException({
        code: 'ERR_FETCH',
        message: 'Fetch failed',
      });
      const mockRequest = createMockCallLogRequest(async () => {
        throw sdkError;
      });
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);

      expect(onErrorSpy).toHaveBeenCalledOnce();
      expect(service.state()).toBe(States.error);
    });

    it('should handle non-Error thrown values (string)', async () => {
      const onErrorSpy = vi.fn();
      service.setOnError(onErrorSpy);

      const mockRequest = createMockCallLogRequest(async () => {
        throw 'string error';
      });
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);

      expect(onErrorSpy).toHaveBeenCalledOnce();
      expect(service.state()).toBe(States.error);
    });

    it('should not throw when onError is not set and SDK rejects', async () => {
      const mockRequest = createMockCallLogRequest(async () => {
        throw new Error('No callback');
      });
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));

      await expect(runFetchCallLogs(service)).resolves.toBeUndefined();
      expect(service.state()).toBe(States.error);
    });
  });

  // ==================== fetchNextCallLogs - Pagination ====================

  describe('fetchNextCallLogs - Pagination', () => {
    it('should append new call logs to existing list', async () => {
      const initialLogs = [createMockCallLog({ sessionId: 'log1' })];
      const mockRequest = createMockCallLogRequest(async () => initialLogs);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);
      expect(service.callLogs().length).toBe(1);

      const nextLogs = [
        createMockCallLog({ sessionId: 'log2' }),
        createMockCallLog({ sessionId: 'log3' }),
      ];
      mockRequest.fetchNext.mockResolvedValueOnce(nextLogs);

      const result = await service.fetchNextCallLogs();

      expect(result).toBe(true);
      expect(service.callLogs().length).toBe(3);
      expect(service.hasMore()).toBe(true);
    });

    it('should return false and set hasMore to false when no more results', async () => {
      const initialLogs = [createMockCallLog()];
      const mockRequest = createMockCallLogRequest(async () => initialLogs);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);

      mockRequest.fetchNext.mockResolvedValueOnce([]);
      const result = await service.fetchNextCallLogs();

      expect(result).toBe(false);
      expect(service.hasMore()).toBe(false);
    });

    it('should return false when callLogRequest is null (no initial fetch)', async () => {
      const result = await service.fetchNextCallLogs();
      expect(result).toBe(false);
    });

    it('should handle error during pagination and keep existing items', async () => {
      const initialLogs = [createMockCallLog()];
      const mockRequest = createMockCallLogRequest(async () => initialLogs);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);
      expect(service.callLogs().length).toBe(1);
      expect(service.state()).toBe(States.loaded);

      mockRequest.fetchNext.mockRejectedValueOnce(new Error('Pagination failed'));
      const onErrorSpy = vi.fn();
      service.setOnError(onErrorSpy);

      const result = await service.fetchNextCallLogs();

      expect(result).toBe(false);
      expect(service.callLogs().length).toBe(1); // Keeps existing items
      expect(service.state()).toBe(States.loaded); // Does NOT change to error
      expect(onErrorSpy).toHaveBeenCalledOnce();
    });

    it('should set state to error during pagination when no existing items', async () => {
      const mockRequest = createMockCallLogRequest(async () => []);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);
      // callLogs is [], state is empty

      mockRequest.fetchNext.mockRejectedValueOnce(new Error('fail'));
      const result = await service.fetchNextCallLogs();

      expect(result).toBe(false);
      expect(service.state()).toBe(States.error);
    });

    it('should prevent concurrent fetchNext calls (isFetching guard)', async () => {
      const initialLogs = [createMockCallLog()];
      let resolveSlowFetch!: (value: any[]) => void;
      const slowFetchPromise = new Promise<any[]>(resolve => {
        resolveSlowFetch = resolve;
      });

      const mockRequest = createMockCallLogRequest(async () => initialLogs);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);

      mockRequest.fetchNext.mockReturnValueOnce(slowFetchPromise);

      // Start first pagination
      const firstFetch = service.fetchNextCallLogs();
      // Second call while first is in progress — should return false immediately
      const secondResult = await service.fetchNextCallLogs();
      expect(secondResult).toBe(false);

      // Resolve the first fetch
      resolveSlowFetch([createMockCallLog()]);
      const firstResult = await firstFetch;
      expect(firstResult).toBe(true);
    });
  });

  // ==================== Call Initiation with Real SDK ====================

  describe('Call Initiation with Real SDK', () => {
    it('should initiate a real audio call to a user via CometChat.initiateCall', async () => {
      vi.useRealTimers();
      service.setLoggedInUser(testUser);

      await service.initiateCall(CometChat.CALL_TYPE.AUDIO, testUser2.getUid());

      expect(service.activeCallObject()).toBeTruthy();
      expect(service.showOutgoingCallScreen()).toBe(true);

      // Clean up: cancel the outgoing call
      try {
        await service.cancelOutgoingCall();
      } catch {
        /* ignore */
      }
      vi.useFakeTimers();
    }, 15000);

    it('should initiate a real video call to a user via CometChat.initiateCall', async () => {
      vi.useRealTimers();
      service.setLoggedInUser(testUser);

      await service.initiateCall(CometChat.CALL_TYPE.VIDEO, testUser2.getUid());

      expect(service.activeCallObject()).toBeTruthy();
      expect(service.showOutgoingCallScreen()).toBe(true);

      // Clean up
      try {
        await service.cancelOutgoingCall();
      } catch {
        /* ignore */
      }
      vi.useFakeTimers();
    }, 15000);

    it('should emit ccMessageSent with inprogress status on successful call initiation', async () => {
      vi.useRealTimers();
      service.setLoggedInUser(testUser);

      const events: { message: any; status: MessageStatus }[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e));

      await service.initiateCall(CometChat.CALL_TYPE.AUDIO, testUser2.getUid());

      expect(events.length).toBe(1);
      expect(events[0].status).toBe(MessageStatus.inprogress);
      expect(events[0].message).toBeTruthy();

      sub.unsubscribe();
      try {
        await service.cancelOutgoingCall();
      } catch {
        /* ignore */
      }
      vi.useFakeTimers();
    }, 15000);

    it('should handle error during call initiation and forward to onError', async () => {
      vi.useRealTimers();
      const onErrorSpy = vi.fn();
      service.setOnError(onErrorSpy);

      // Make initiateCall reject to simulate SDK error
      vi.spyOn(CometChat, 'initiateCall').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_INVALID', message: 'Invalid UID' })
      );

      await service.initiateCall(CometChat.CALL_TYPE.AUDIO, '');

      expect(onErrorSpy).toHaveBeenCalledOnce();
      expect(service.activeCallObject()).toBeNull();
      expect(service.showOutgoingCallScreen()).toBe(false);
      vi.useFakeTimers();
    }, 15000);
  });

  // ==================== cancelOutgoingCall with Real SDK ====================

  describe('cancelOutgoingCall with Real SDK', () => {
    it('should do nothing when no active call exists', async () => {
      vi.useRealTimers();
      await service.cancelOutgoingCall();
      // No error, no state change
      expect(service.activeCallObject()).toBeNull();
      expect(service.showOutgoingCallScreen()).toBe(false);
      vi.useFakeTimers();
    });

    it('should cancel an active outgoing call and reset state', async () => {
      vi.useRealTimers();
      service.setLoggedInUser(testUser);

      // Initiate a real call first
      await service.initiateCall(CometChat.CALL_TYPE.AUDIO, testUser2.getUid());
      expect(service.activeCallObject()).toBeTruthy();
      expect(service.showOutgoingCallScreen()).toBe(true);

      // Cancel it
      await service.cancelOutgoingCall();

      expect(service.activeCallObject()).toBeNull();
      expect(service.showOutgoingCallScreen()).toBe(false);
      vi.useFakeTimers();
    }, 15000);

    it('should emit ccMessageSent with success status when cancelling', async () => {
      vi.useRealTimers();
      service.setLoggedInUser(testUser);

      await service.initiateCall(CometChat.CALL_TYPE.AUDIO, testUser2.getUid());

      const events: { message: any; status: MessageStatus }[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e));

      await service.cancelOutgoingCall();

      expect(events.length).toBe(1);
      expect(events[0].status).toBe(MessageStatus.success);

      sub.unsubscribe();
      vi.useFakeTimers();
    }, 15000);
  });

  // ==================== initialize / cleanup ====================

  describe('initialize and cleanup', () => {
    it('should register a call listener on initialize', () => {
      const addListenerSpy = vi.spyOn(CometChat, 'addCallListener');
      service.initialize();
      expect(addListenerSpy).toHaveBeenCalledOnce();
      addListenerSpy.mockRestore();
    });

    it('should remove the call listener on cleanup', () => {
      vi.mocked(CometChat.removeCallListener).mockClear();
      service.initialize();
      service.cleanup();
      expect(CometChat.removeCallListener).toHaveBeenCalledOnce();
    });

    it('should subscribe to ccCallEnded on initialize', () => {
      const subscribeSpy = vi.spyOn(CometChatCallEvents.ccCallEnded, 'subscribe');
      service.initialize();
      expect(subscribeSpy).toHaveBeenCalledOnce();
      subscribeSpy.mockRestore();
    });

    it('should reset ongoing call state when ccCallEnded is emitted', () => {
      service.initialize();

      // Manually set some ongoing call state
      (service as any)._showOngoingCall.set(true);
      (service as any)._sessionId.set('some-session');
      (service as any)._activeCallObject.set({} as CometChat.Call);

      // Emit ccCallEnded
      CometChatCallEvents.ccCallEnded.next({} as CometChat.Call);

      expect(service.showOngoingCall()).toBe(false);
      expect(service.sessionId()).toBeNull();
      expect(service.activeCallObject()).toBeNull();
    });

    it('should unsubscribe from event subscriptions on cleanup', () => {
      service.initialize();
      const subs = (service as any).subscriptions as { unsubscribe: () => void }[];
      const unsubSpies = subs.map((sub: any) => vi.spyOn(sub, 'unsubscribe'));

      service.cleanup();

      for (const spy of unsubSpies) {
        expect(spy).toHaveBeenCalledOnce();
      }
    });

    it('should clear the subscriptions array after cleanup', () => {
      service.initialize();
      service.cleanup();
      expect((service as any).subscriptions).toEqual([]);
    });

    it('should handle cleanup when initialize was not called', () => {
      expect(() => service.cleanup()).not.toThrow();
    });

    it('should handle onOutgoingCallAccepted by transitioning to ongoing call', () => {
      // Clear mock call history and capture the listener
      vi.mocked(CometChat.addCallListener).mockClear();
      service.initialize();

      // Simulate outgoing call screen being shown
      (service as any)._showOutgoingCallScreen.set(true);

      // Extract the listener from the addCallListener mock call
      const listenerCall = vi.mocked(CometChat.addCallListener).mock.calls[0];
      const listener = listenerCall[1] as any;

      const mockCall = { getSessionId: () => 'accepted-session-id' } as any;
      listener.onOutgoingCallAccepted(mockCall);

      expect(service.showOutgoingCallScreen()).toBe(false);
      expect(service.sessionId()).toBe('accepted-session-id');
      expect(service.showOngoingCall()).toBe(true);
    });

    it('should handle onOutgoingCallRejected by hiding outgoing screen and clearing call', () => {
      // Clear mock call history and capture the listener
      vi.mocked(CometChat.addCallListener).mockClear();
      service.initialize();

      (service as any)._showOutgoingCallScreen.set(true);
      (service as any)._activeCallObject.set({} as CometChat.Call);

      const listenerCall = vi.mocked(CometChat.addCallListener).mock.calls[0];
      const listener = listenerCall[1] as any;

      listener.onOutgoingCallRejected({} as CometChat.Call);

      expect(service.showOutgoingCallScreen()).toBe(false);
      expect(service.activeCallObject()).toBeNull();
    });
  });

  // ==================== Null Parameter Handling ====================

  describe('Null Parameter Handling', () => {
    it('should handle fetchCallLogs with no builder and no logged-in user', async () => {
      // No builder set, no logged-in user — uses default builder with undefined auth token
      await runFetchCallLogs(service);
      // Should not throw; state depends on mock SDK behavior
      expect([States.empty, States.error, States.loaded]).toContain(service.state());
    });

    it('should handle fetchNextCallLogs when no initial fetch was done', async () => {
      const result = await service.fetchNextCallLogs();
      expect(result).toBe(false);
    });

    it('should handle null call logs response gracefully', async () => {
      const mockRequest = createMockCallLogRequest(async () => null as any);
      service.setCallLogRequestBuilder(createMockBuilder(mockRequest));
      await runFetchCallLogs(service);

      // null response treated as empty
      expect(service.state()).toBe(States.empty);
      expect(service.callLogs()).toEqual([]);
    });

    it('should handle cancelOutgoingCall when no active call exists', async () => {
      vi.useRealTimers();
      await service.cancelOutgoingCall();
      expect(service.activeCallObject()).toBeNull();
      expect(service.showOutgoingCallScreen()).toBe(false);
      vi.useFakeTimers();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle multiple sequential fetchCallLogs calls correctly', async () => {
      const logs1 = [createMockCallLog({ sessionId: 'first' })];
      const req1 = createMockCallLogRequest(async () => logs1);
      service.setCallLogRequestBuilder(createMockBuilder(req1));
      await runFetchCallLogs(service);
      expect(service.callLogs().length).toBe(1);

      const logs2 = [
        createMockCallLog({ sessionId: 'second-a' }),
        createMockCallLog({ sessionId: 'second-b' }),
      ];
      const req2 = createMockCallLogRequest(async () => logs2);
      service.setCallLogRequestBuilder(createMockBuilder(req2));
      await runFetchCallLogs(service);

      // Second fetch replaces first
      expect(service.callLogs().length).toBe(2);
      expect(service.state()).toBe(States.loaded);
    });

    it('should transition state correctly: loading → loaded → loading → empty', async () => {
      const logs = [createMockCallLog()];
      const req1 = createMockCallLogRequest(async () => logs);
      service.setCallLogRequestBuilder(createMockBuilder(req1));
      await runFetchCallLogs(service);
      expect(service.state()).toBe(States.loaded);

      const req2 = createMockCallLogRequest(async () => []);
      service.setCallLogRequestBuilder(createMockBuilder(req2));
      await runFetchCallLogs(service);
      expect(service.state()).toBe(States.empty);
    });

    it('should verify real SDK user objects have expected properties', () => {
      expect(testUser.getUid()).toBeTruthy();
      expect(testUser.getName()).toBeTruthy();
      expect(testUser2.getUid()).toBeTruthy();
      expect(testUser2.getUid()).not.toBe(testUser.getUid());
    });

    it('should verify real SDK group object has expected properties', () => {
      expect(testGroup.getGuid()).toBeTruthy();
      expect(testGroup.getName()).toBeTruthy();
    });

    it('should handle setting loggedInUser with a real SDK user for default builder path', async () => {
      service.setLoggedInUser(testUser);
      await runFetchCallLogs(service);

      // The default builder was used (via mock) with the user's auth token
      expect(builtRequests.length).toBe(1);
      expect([States.empty, States.loaded]).toContain(service.state());
    });
  });
});
