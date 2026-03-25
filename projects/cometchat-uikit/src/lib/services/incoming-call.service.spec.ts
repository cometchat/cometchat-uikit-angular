/**
 * IncomingCallService Tests
 *
 * Categories: Initialization, Signal State Management, Configuration Signals,
 *             Sound Management, Accept/Decline Flows, CallListener Registration,
 *             Event Subscriptions, Cleanup, Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 11.3, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/incoming-call
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, fetchTestUser, fetchTestGroup } from '../test-setup';
import { IncomingCallService } from './incoming-call.service';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatUIEvents } from '../events/CometChatUIEvents';
import { CometChatSoundManager } from '../resources/CometChatSoundManager/CometChatSoundManager';

describe('IncomingCallService', () => {
  let service: IncomingCallService;
  let testUser: CometChat.User;
  let testGroup: CometChat.Group;

  // Store original subjects for restoration
  let originalCcCallEnded: Subject<CometChat.Call>;
  let originalCcOutgoingCall: Subject<CometChat.Call>;
  let originalCcCallRejected: Subject<CometChat.Call>;
  let originalCcCallAccepted: Subject<CometChat.Call>;
  let originalCcShowOngoingCall: Subject<any>;

  // Spies for SoundManager
  let playSpy: ReturnType<typeof vi.spyOn>;
  let pauseSpy: ReturnType<typeof vi.spyOn>;

  // Spy for CometChat.addCallListener to capture the registered listener
  let addCallListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeCallListenerSpy: ReturnType<typeof vi.spyOn>;

  /**
   * Creates a mock CometChat.Call object for testing.
   * We use mock calls because real SDK call creation requires an active call session
   * which is impractical in unit tests. The service's state management and event
   * handling logic is what we're testing, not the SDK call creation.
   */
  function createMockCall(sessionId: string, callType = 'audio'): CometChat.Call {
    const caller = {
      getName: () => 'TestCaller',
      getAvatar: () => '',
      getUid: () => 'uid_' + sessionId,
    };
    return {
      getSessionId: () => sessionId,
      getType: () => callType,
      getCallInitiator: () => caller,
      getCallReceiver: () => caller,
      getStatus: () => 'initiated',
      getSender: () => caller,
      getReceiver: () => caller,
      getReceiverType: () => 'user',
      getAction: () => 'initiated',
    } as unknown as CometChat.Call;
  }

  /** Extracts the registered CallListener from the addCallListener spy */
  function getRegisteredListener(): any {
    const calls = addCallListenerSpy.mock.calls;
    return calls.length > 0 ? calls[calls.length - 1][1] : null;
  }

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testGroup = await fetchTestGroup('supergroup');
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    // Save original event subjects
    originalCcCallEnded = CometChatCallEvents.ccCallEnded;
    originalCcOutgoingCall = CometChatCallEvents.ccOutgoingCall;
    originalCcCallRejected = CometChatCallEvents.ccCallRejected;
    originalCcCallAccepted = CometChatCallEvents.ccCallAccepted;
    originalCcShowOngoingCall = CometChatUIEvents.ccShowOngoingCall;

    // Replace with fresh subjects for test isolation
    CometChatCallEvents.ccCallEnded = new Subject<CometChat.Call>();
    CometChatCallEvents.ccOutgoingCall = new Subject<CometChat.Call>();
    CometChatCallEvents.ccCallRejected = new Subject<CometChat.Call>();
    CometChatCallEvents.ccCallAccepted = new Subject<CometChat.Call>();
    CometChatUIEvents.ccShowOngoingCall = new Subject<any>();

    // Spy on CometChat listener methods (must be before service creation)
    // Clear accumulated calls from the global mock before creating the spy
    vi.mocked(CometChat.addCallListener).mockClear();
    vi.mocked(CometChat.removeCallListener).mockClear();
    addCallListenerSpy = vi.spyOn(CometChat, 'addCallListener').mockImplementation(() => {});
    removeCallListenerSpy = vi.spyOn(CometChat, 'removeCallListener').mockImplementation(() => {});

    // Spy on SoundManager
    playSpy = vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => {});
    pauseSpy = vi.spyOn(CometChatSoundManager, 'pause').mockImplementation(() => {});

    // Create service directly (constructor registers listener + subscribes to events)
    service = new IncomingCallService();
  });

  afterEach(() => {
    service.ngOnDestroy();

    // Restore original subjects
    CometChatCallEvents.ccCallEnded = originalCcCallEnded;
    CometChatCallEvents.ccOutgoingCall = originalCcOutgoingCall;
    CometChatCallEvents.ccCallRejected = originalCcCallRejected;
    CometChatCallEvents.ccCallAccepted = originalCcCallAccepted;
    CometChatUIEvents.ccShowOngoingCall = originalCcShowOngoingCall;

    vi.restoreAllMocks();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root via TestBed', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const injected = TestBed.inject(IncomingCallService);
      expect(injected).toBeTruthy();
      injected.ngOnDestroy();
    });

    it('should have null initial incomingCall signal', () => {
      expect(service.incomingCall()).toBeNull();
    });

    it('should have null initial activeCall signal', () => {
      expect(service.activeCall()).toBeNull();
    });

    it('should have disableSoundForCalls as false by default', () => {
      expect(service.disableSoundForCalls()).toBe(false);
    });

    it('should have empty customSoundForCalls by default', () => {
      expect(service.customSoundForCalls()).toBe('');
    });

    it('should register a CallListener on construction', () => {
      expect(addCallListenerSpy).toHaveBeenCalledOnce();
      expect(addCallListenerSpy.mock.calls[0][0]).toContain('incoming_call_listener_');
    });
  });

  // ==================== Signal State Management ====================

  describe('Signal State Management', () => {
    it('should update incomingCall signal when setIncomingCall is called', () => {
      const call = createMockCall('sess-1');
      service.setIncomingCall(call);
      expect(service.incomingCall()).toBe(call);
    });

    it('should clear incomingCall signal when set to null', () => {
      const call = createMockCall('sess-2');
      service.setIncomingCall(call);
      service.setIncomingCall(null);
      expect(service.incomingCall()).toBeNull();
    });

    it('should update activeCall signal when setActiveCall is called', () => {
      const call = createMockCall('sess-3');
      service.setActiveCall(call);
      expect(service.activeCall()).toBe(call);
    });

    it('should clear activeCall signal when set to null', () => {
      const call = createMockCall('sess-4');
      service.setActiveCall(call);
      service.setActiveCall(null);
      expect(service.activeCall()).toBeNull();
    });

    it('should replace previous incomingCall with a new call', () => {
      const call1 = createMockCall('sess-a');
      const call2 = createMockCall('sess-b');
      service.setIncomingCall(call1);
      expect(service.incomingCall()).toBe(call1);
      service.setIncomingCall(call2);
      expect(service.incomingCall()).toBe(call2);
    });

    it('should reflect signal changes synchronously', () => {
      const call = createMockCall('sess-sync');
      expect(service.incomingCall()).toBeNull();
      service.setIncomingCall(call);
      expect(service.incomingCall()).toBe(call);
      service.setIncomingCall(null);
      expect(service.incomingCall()).toBeNull();
    });
  });

  // ==================== Configuration Signals ====================

  describe('Configuration Signals', () => {
    it('should update disableSoundForCalls signal', () => {
      service.setDisableSoundForCalls(true);
      expect(service.disableSoundForCalls()).toBe(true);
      service.setDisableSoundForCalls(false);
      expect(service.disableSoundForCalls()).toBe(false);
    });

    it('should update customSoundForCalls signal', () => {
      service.setCustomSoundForCalls('https://example.com/ring.mp3');
      expect(service.customSoundForCalls()).toBe('https://example.com/ring.mp3');
    });

    it('should clear customSoundForCalls when set to empty string', () => {
      service.setCustomSoundForCalls('https://example.com/ring.mp3');
      service.setCustomSoundForCalls('');
      expect(service.customSoundForCalls()).toBe('');
    });
  });

  // ==================== Sound Management ====================

  describe('Sound Management', () => {
    it('should call SoundManager.play with "incomingCall" and null when no custom URL', () => {
      service.setDisableSoundForCalls(false);
      service.setCustomSoundForCalls('');
      service.playIncomingSound();
      expect(playSpy).toHaveBeenCalledOnce();
      expect(playSpy).toHaveBeenCalledWith('incomingCall', null);
    });

    it('should call SoundManager.play with custom URL when configured', () => {
      service.setDisableSoundForCalls(false);
      service.setCustomSoundForCalls('https://example.com/ring.mp3');
      service.playIncomingSound();
      expect(playSpy).toHaveBeenCalledWith('incomingCall', 'https://example.com/ring.mp3');
    });

    it('should NOT call SoundManager.play when sound is disabled', () => {
      service.setDisableSoundForCalls(true);
      service.playIncomingSound();
      expect(playSpy).not.toHaveBeenCalled();
    });

    it('should call SoundManager.pause on stopIncomingSound', () => {
      service.stopIncomingSound();
      expect(pauseSpy).toHaveBeenCalledOnce();
    });

    it('should play sound after toggling disableSoundForCalls back to false', () => {
      service.setDisableSoundForCalls(true);
      service.playIncomingSound();
      expect(playSpy).not.toHaveBeenCalled();

      service.setDisableSoundForCalls(false);
      service.playIncomingSound();
      expect(playSpy).toHaveBeenCalledOnce();
    });
  });

  // ==================== Accept Call Flow ====================

  describe('Accept Call Flow', () => {
    it('should call CometChat.acceptCall with the session ID', async () => {
      const call = createMockCall('sess-accept');
      const acceptSpy = vi.spyOn(CometChat, 'acceptCall').mockResolvedValue(call);

      service.setIncomingCall(call);
      await service.acceptCall('sess-accept');

      expect(acceptSpy).toHaveBeenCalledWith('sess-accept');
    });

    it('should emit ccCallAccepted event after accepting', async () => {
      const call = createMockCall('sess-accept-evt');
      vi.spyOn(CometChat, 'acceptCall').mockResolvedValue(call);

      let emittedCall: CometChat.Call | null = null;
      const sub = CometChatCallEvents.ccCallAccepted.subscribe(c => {
        emittedCall = c;
      });

      await service.acceptCall('sess-accept-evt');
      expect(emittedCall).toBe(call);
      sub.unsubscribe();
    });

    it('should emit ccShowOngoingCall event after accepting', async () => {
      const call = createMockCall('sess-accept-ui');
      vi.spyOn(CometChat, 'acceptCall').mockResolvedValue(call);

      let emittedPayload: any = null;
      const sub = CometChatUIEvents.ccShowOngoingCall.subscribe(e => {
        emittedPayload = e;
      });

      await service.acceptCall('sess-accept-ui');
      expect(emittedPayload).not.toBeNull();
      expect(emittedPayload.child).toBe(call);
      sub.unsubscribe();
    });

    it('should set activeCall and clear incomingCall after accepting', async () => {
      const call = createMockCall('sess-accept-state');
      vi.spyOn(CometChat, 'acceptCall').mockResolvedValue(call);

      service.setIncomingCall(call);
      await service.acceptCall('sess-accept-state');

      expect(service.activeCall()).toBe(call);
      expect(service.incomingCall()).toBeNull();
    });

    it('should return the accepted call object', async () => {
      const call = createMockCall('sess-accept-ret');
      vi.spyOn(CometChat, 'acceptCall').mockResolvedValue(call);

      const result = await service.acceptCall('sess-accept-ret');
      expect(result).toBe(call);
    });
  });

  // ==================== Decline Call Flow ====================

  describe('Decline Call Flow', () => {
    it('should call CometChat.rejectCall with session ID and REJECTED status', async () => {
      const call = createMockCall('sess-decline');
      const rejectSpy = vi.spyOn(CometChat, 'rejectCall').mockResolvedValue(call as any);

      service.setIncomingCall(call);
      await service.declineCall('sess-decline');

      expect(rejectSpy).toHaveBeenCalledWith('sess-decline', CometChat.CALL_STATUS.REJECTED);
    });

    it('should emit ccCallRejected event after declining', async () => {
      const call = createMockCall('sess-decline-evt');
      vi.spyOn(CometChat, 'rejectCall').mockResolvedValue(call as any);

      let emittedCall: CometChat.Call | null = null;
      const sub = CometChatCallEvents.ccCallRejected.subscribe(c => {
        emittedCall = c;
      });

      await service.declineCall('sess-decline-evt');
      expect(emittedCall).toBe(call);
      sub.unsubscribe();
    });

    it('should clear incomingCall after declining', async () => {
      const call = createMockCall('sess-decline-state');
      vi.spyOn(CometChat, 'rejectCall').mockResolvedValue(call as any);

      service.setIncomingCall(call);
      await service.declineCall('sess-decline-state');

      expect(service.incomingCall()).toBeNull();
    });
  });

  // ==================== CallListener Incoming Call Handling ====================

  describe('CallListener — Incoming Call Handling', () => {
    it('should set incomingCall and play sound when no active call exists', () => {
      const call = createMockCall('sess-incoming');
      const listener = getRegisteredListener();

      listener.onIncomingCallReceived(call);

      expect(service.incomingCall()).toBe(call);
      expect(playSpy).toHaveBeenCalled();
    });

    it('should auto-reject with BUSY when an active call exists', () => {
      const activeCall = createMockCall('sess-active');
      const newCall = createMockCall('sess-new-incoming');
      const rejectSpy = vi.spyOn(CometChat, 'rejectCall').mockResolvedValue(newCall as any);

      service.setActiveCall(activeCall);
      const listener = getRegisteredListener();
      listener.onIncomingCallReceived(newCall);

      expect(rejectSpy).toHaveBeenCalledWith('sess-new-incoming', CometChat.CALL_STATUS.BUSY);
      expect(service.incomingCall()).toBeNull();
    });

    it('should auto-reject with BUSY when a pending incoming call already exists', () => {
      const existingIncoming = createMockCall('sess-existing');
      const newCall = createMockCall('sess-another');
      const rejectSpy = vi.spyOn(CometChat, 'rejectCall').mockResolvedValue(newCall as any);

      service.setIncomingCall(existingIncoming);
      const listener = getRegisteredListener();
      listener.onIncomingCallReceived(newCall);

      expect(rejectSpy).toHaveBeenCalledWith('sess-another', CometChat.CALL_STATUS.BUSY);
      expect(service.incomingCall()).toBe(existingIncoming);
    });

    it('should handle onIncomingCallCancelled by clearing state and pausing sound', () => {
      const call = createMockCall('sess-cancel');
      service.setIncomingCall(call);

      const listener = getRegisteredListener();
      listener.onIncomingCallCancelled(call);

      expect(service.incomingCall()).toBeNull();
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should NOT clear incomingCall on cancel if session IDs do not match', () => {
      const call1 = createMockCall('sess-keep');
      const call2 = createMockCall('sess-other');
      service.setIncomingCall(call1);

      const listener = getRegisteredListener();
      listener.onIncomingCallCancelled(call2);

      expect(service.incomingCall()).toBe(call1);
    });

    it('should stop sound on onOutgoingCallAccepted', () => {
      const call = createMockCall('sess-out-accept');
      const listener = getRegisteredListener();
      listener.onOutgoingCallAccepted(call);
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should stop sound on onOutgoingCallRejected', () => {
      const call = createMockCall('sess-out-reject');
      const listener = getRegisteredListener();
      listener.onOutgoingCallRejected(call);
      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  // ==================== Event Subscriptions ====================

  describe('Event Subscriptions', () => {
    it('should clear both activeCall and incomingCall on ccCallEnded', () => {
      const call = createMockCall('sess-ended');
      service.setActiveCall(call);
      service.setIncomingCall(call);

      CometChatCallEvents.ccCallEnded.next(call);

      expect(service.activeCall()).toBeNull();
      expect(service.incomingCall()).toBeNull();
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should set activeCall when ccOutgoingCall fires', () => {
      const call = createMockCall('sess-outgoing');
      CometChatCallEvents.ccOutgoingCall.next(call);
      expect(service.activeCall()).toBe(call);
    });

    it('should clear incomingCall and pause sound on ccCallRejected', () => {
      const call = createMockCall('sess-rejected');
      service.setIncomingCall(call);

      CometChatCallEvents.ccCallRejected.next(call);

      expect(service.incomingCall()).toBeNull();
      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  // ==================== Cleanup (ngOnDestroy) ====================

  describe('Cleanup (ngOnDestroy)', () => {
    it('should remove the CallListener on destroy', () => {
      const listenerId = addCallListenerSpy.mock.calls[0][0];
      service.ngOnDestroy();
      expect(removeCallListenerSpy).toHaveBeenCalledWith(listenerId);
    });

    it('should unsubscribe from event subscriptions on destroy', () => {
      const call = createMockCall('sess-destroy');

      // Verify subscriptions are active
      CometChatCallEvents.ccCallEnded.next(call);
      expect(service.activeCall()).toBeNull();

      service.ngOnDestroy();

      // After destroy, set active call manually then emit ccCallEnded
      service.setActiveCall(call);
      CometChatCallEvents.ccCallEnded.next(call);
      // Subscription handler won't fire, so activeCall stays
      expect(service.activeCall()).toBe(call);
    });

    it('should not throw when destroyed multiple times', () => {
      expect(() => {
        service.ngOnDestroy();
        service.ngOnDestroy();
      }).not.toThrow();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle setIncomingCall(null) when already null', () => {
      expect(() => service.setIncomingCall(null)).not.toThrow();
      expect(service.incomingCall()).toBeNull();
    });

    it('should handle setActiveCall(null) when already null', () => {
      expect(() => service.setActiveCall(null)).not.toThrow();
      expect(service.activeCall()).toBeNull();
    });

    it('should handle setting the same call multiple times', () => {
      const call = createMockCall('sess-repeat');
      service.setIncomingCall(call);
      service.setIncomingCall(call);
      service.setIncomingCall(call);
      expect(service.incomingCall()).toBe(call);
    });

    it('should handle ccCallEnded when no active or incoming call exists', () => {
      const call = createMockCall('sess-no-state');
      expect(() => CometChatCallEvents.ccCallEnded.next(call)).not.toThrow();
      expect(service.activeCall()).toBeNull();
      expect(service.incomingCall()).toBeNull();
    });

    it('should handle ccOutgoingCall replacing a previous active call', () => {
      const call1 = createMockCall('sess-out-1');
      const call2 = createMockCall('sess-out-2');

      CometChatCallEvents.ccOutgoingCall.next(call1);
      expect(service.activeCall()).toBe(call1);

      CometChatCallEvents.ccOutgoingCall.next(call2);
      expect(service.activeCall()).toBe(call2);
    });

    it('should return consistent signal values across multiple reads', () => {
      const call = createMockCall('sess-consistent');
      service.setIncomingCall(call);
      const read1 = service.incomingCall();
      const read2 = service.incomingCall();
      const read3 = service.incomingCall();
      expect(read1).toBe(read2);
      expect(read2).toBe(read3);
    });

    it('should handle auto-reject error gracefully when rejectCall fails', () => {
      const activeCall = createMockCall('sess-active-err');
      const newCall = createMockCall('sess-new-err');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(CometChat, 'rejectCall').mockRejectedValue(new Error('Network error'));

      service.setActiveCall(activeCall);
      const listener = getRegisteredListener();

      // Should not throw even when rejectCall fails
      expect(() => listener.onIncomingCallReceived(newCall)).not.toThrow();
      expect(service.incomingCall()).toBeNull();

      consoleSpy.mockRestore();
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
});
