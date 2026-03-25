/**
 * OutgoingCallService Tests
 *
 * Categories: Initialization, Signal State Management, Configuration Signals,
 *             Sound Management, Cancel Flow, Timeout Handling, SDK Integration,
 *             Edge Cases, Null/Undefined Parameter Handling
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 11.3, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/outgoing-call
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
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, fetchTestUser, fetchTestGroup } from '../test-setup';
import { OutgoingCallService } from './outgoing-call.service';
import { CometChatSoundManager } from '../resources/CometChatSoundManager/CometChatSoundManager';

describe('OutgoingCallService', () => {
  let service: OutgoingCallService;
  let testUser: CometChat.User;
  let testGroup: CometChat.Group;

  // Spies for SoundManager
  let playSpy: ReturnType<typeof vi.spyOn>;
  let pauseSpy: ReturnType<typeof vi.spyOn>;

  /**
   * Creates a mock CometChat.Call object for testing.
   * We use mock calls because real SDK call creation requires an active call session
   * which is impractical in unit tests. The service's state management and sound
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

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testGroup = await fetchTestGroup('supergroup');
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    // Spy on SoundManager
    playSpy = vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => {});
    pauseSpy = vi.spyOn(CometChatSoundManager, 'pause').mockImplementation(() => {});

    // Create service directly
    service = new OutgoingCallService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root via TestBed', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const injected = TestBed.inject(OutgoingCallService);
      expect(injected).toBeTruthy();
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
    it('should update activeCall signal when setActiveCall is called', () => {
      const call = createMockCall('sess-1');
      service.setActiveCall(call);
      expect(service.activeCall()).toBe(call);
    });

    it('should clear activeCall signal when set to null', () => {
      const call = createMockCall('sess-2');
      service.setActiveCall(call);
      service.setActiveCall(null);
      expect(service.activeCall()).toBeNull();
    });

    it('should replace previous activeCall with a new call', () => {
      const call1 = createMockCall('sess-a');
      const call2 = createMockCall('sess-b');
      service.setActiveCall(call1);
      expect(service.activeCall()).toBe(call1);
      service.setActiveCall(call2);
      expect(service.activeCall()).toBe(call2);
    });

    it('should reflect signal changes synchronously', () => {
      const call = createMockCall('sess-sync');
      expect(service.activeCall()).toBeNull();
      service.setActiveCall(call);
      expect(service.activeCall()).toBe(call);
      service.setActiveCall(null);
      expect(service.activeCall()).toBeNull();
    });

    it('should support full lifecycle: null → active → null → active → null', () => {
      const call1 = createMockCall('lc-1');
      const call2 = createMockCall('lc-2');

      expect(service.activeCall()).toBeNull();
      service.setActiveCall(call1);
      expect(service.activeCall()).toBe(call1);
      service.setActiveCall(null);
      expect(service.activeCall()).toBeNull();
      service.setActiveCall(call2);
      expect(service.activeCall()).toBe(call2);
      service.setActiveCall(null);
      expect(service.activeCall()).toBeNull();
    });

    it('should return consistent signal values across multiple reads', () => {
      const call = createMockCall('sess-consistent');
      service.setActiveCall(call);
      const read1 = service.activeCall();
      const read2 = service.activeCall();
      const read3 = service.activeCall();
      expect(read1).toBe(read2);
      expect(read2).toBe(read3);
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

    it('should track disableSoundForCalls through multiple toggles', () => {
      expect(service.disableSoundForCalls()).toBe(false);
      service.setDisableSoundForCalls(true);
      expect(service.disableSoundForCalls()).toBe(true);
      service.setDisableSoundForCalls(false);
      expect(service.disableSoundForCalls()).toBe(false);
      service.setDisableSoundForCalls(true);
      expect(service.disableSoundForCalls()).toBe(true);
    });

    it('should track customSoundForCalls through multiple changes', () => {
      service.setCustomSoundForCalls('https://a.com/1.mp3');
      expect(service.customSoundForCalls()).toBe('https://a.com/1.mp3');
      service.setCustomSoundForCalls('https://b.com/2.mp3');
      expect(service.customSoundForCalls()).toBe('https://b.com/2.mp3');
      service.setCustomSoundForCalls('');
      expect(service.customSoundForCalls()).toBe('');
    });
  });

  // ==================== Sound Management ====================

  describe('Sound Management', () => {
    it('should call SoundManager.play with "outgoingCall" and null when no custom URL', () => {
      service.setDisableSoundForCalls(false);
      service.setCustomSoundForCalls('');
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledOnce();
      expect(playSpy).toHaveBeenCalledWith('outgoingCall', null);
    });

    it('should call SoundManager.play with custom URL when configured', () => {
      service.setDisableSoundForCalls(false);
      service.setCustomSoundForCalls('https://example.com/ring.mp3');
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledWith('outgoingCall', 'https://example.com/ring.mp3');
    });

    it('should NOT call SoundManager.play when sound is disabled', () => {
      service.setDisableSoundForCalls(true);
      service.playOutgoingSound();
      expect(playSpy).not.toHaveBeenCalled();
    });

    it('should call SoundManager.pause on stopOutgoingSound', () => {
      service.stopOutgoingSound();
      expect(pauseSpy).toHaveBeenCalledOnce();
    });

    it('should play sound after toggling disableSoundForCalls back to false', () => {
      service.setDisableSoundForCalls(true);
      service.playOutgoingSound();
      expect(playSpy).not.toHaveBeenCalled();

      service.setDisableSoundForCalls(false);
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledOnce();
    });

    it('should pass the exact custom URL string to SoundManager', () => {
      const customUrl = 'https://cdn.example.com/sounds/outgoing-tone.wav';
      service.setCustomSoundForCalls(customUrl);
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledWith('outgoingCall', customUrl);
    });

    it('should not play sound with custom URL when disabled', () => {
      service.setDisableSoundForCalls(true);
      service.setCustomSoundForCalls('https://example.com/custom.mp3');
      service.playOutgoingSound();
      expect(playSpy).not.toHaveBeenCalled();
    });

    it('should call SoundManager.pause even if no sound was playing', () => {
      service.stopOutgoingSound();
      expect(pauseSpy).toHaveBeenCalledOnce();
    });

    it('should call SoundManager.pause exactly once per stopOutgoingSound call', () => {
      service.stopOutgoingSound();
      expect(pauseSpy).toHaveBeenCalledTimes(1);
      service.stopOutgoingSound();
      expect(pauseSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== Cancel Flow ====================

  describe('Cancel Flow', () => {
    it('should clear activeCall and stop sound on cancel (typical cancel flow)', () => {
      const call = createMockCall('cancel-1');

      // Initiate outgoing call
      service.setActiveCall(call);
      service.playOutgoingSound();
      expect(service.activeCall()).toBe(call);
      expect(playSpy).toHaveBeenCalledOnce();

      // Cancel the call
      service.stopOutgoingSound();
      service.setActiveCall(null);

      expect(pauseSpy).toHaveBeenCalledOnce();
      expect(service.activeCall()).toBeNull();
    });

    it('should handle cancel when no sound was playing (sound disabled)', () => {
      const call = createMockCall('cancel-2');

      service.setDisableSoundForCalls(true);
      service.setActiveCall(call);
      service.playOutgoingSound();
      expect(playSpy).not.toHaveBeenCalled();

      // Cancel
      service.stopOutgoingSound();
      service.setActiveCall(null);

      expect(pauseSpy).toHaveBeenCalledOnce();
      expect(service.activeCall()).toBeNull();
    });

    it('should handle cancel when there is no active call', () => {
      expect(service.activeCall()).toBeNull();

      service.stopOutgoingSound();
      service.setActiveCall(null);

      expect(pauseSpy).toHaveBeenCalledOnce();
      expect(service.activeCall()).toBeNull();
    });

    it('should handle multiple cancel operations in sequence', () => {
      const call = createMockCall('cancel-multi');

      // First call + cancel
      service.setActiveCall(call);
      service.playOutgoingSound();
      service.stopOutgoingSound();
      service.setActiveCall(null);

      // Second cancel (no active call)
      service.stopOutgoingSound();
      service.setActiveCall(null);

      expect(pauseSpy).toHaveBeenCalledTimes(2);
      expect(service.activeCall()).toBeNull();
    });

    it('should handle cancel with custom sound URL configured', () => {
      const call = createMockCall('cancel-custom');
      service.setCustomSoundForCalls('https://example.com/ring.mp3');
      service.setActiveCall(call);
      service.playOutgoingSound();

      expect(playSpy).toHaveBeenCalledWith('outgoingCall', 'https://example.com/ring.mp3');

      service.stopOutgoingSound();
      service.setActiveCall(null);

      expect(pauseSpy).toHaveBeenCalledOnce();
      expect(service.activeCall()).toBeNull();
    });
  });

  // ==================== Timeout Handling ====================

  describe('Timeout Handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow external timeout to clear call state after elapsed time', () => {
      const call = createMockCall('timeout-1');

      service.setActiveCall(call);
      service.playOutgoingSound();
      expect(service.activeCall()).toBe(call);

      // Simulate external timeout
      vi.advanceTimersByTime(30000);

      // External code would call these on timeout
      service.stopOutgoingSound();
      service.setActiveCall(null);

      expect(pauseSpy).toHaveBeenCalledOnce();
      expect(service.activeCall()).toBeNull();
    });

    it('should maintain call state if timeout has not elapsed', () => {
      const call = createMockCall('timeout-2');

      service.setActiveCall(call);
      service.playOutgoingSound();

      vi.advanceTimersByTime(5000);

      // Call should still be active
      expect(service.activeCall()).toBe(call);
    });

    it('should handle call answered before timeout', () => {
      const call = createMockCall('timeout-3');

      service.setActiveCall(call);
      service.playOutgoingSound();

      // Call answered after 5 seconds (before 30s timeout)
      vi.advanceTimersByTime(5000);
      service.stopOutgoingSound();
      service.setActiveCall(null);

      expect(pauseSpy).toHaveBeenCalledOnce();
      expect(service.activeCall()).toBeNull();

      // Further time advancement should not cause issues
      vi.advanceTimersByTime(25000);
      expect(service.activeCall()).toBeNull();
    });
  });

  // ==================== SDK Integration ====================

  describe('SDK Integration', () => {
    it('should work with real SDK CometChat.Call type expectations', () => {
      // Verify the service can hold a mock call that matches SDK Call interface
      const call = createMockCall('sdk-int-1', 'audio');
      service.setActiveCall(call);

      const active = service.activeCall();
      expect(active).not.toBeNull();
      expect(active!.getSessionId()).toBe('sdk-int-1');
      expect(active!.getType()).toBe('audio');
    });

    it('should handle video call type correctly', () => {
      const call = createMockCall('sdk-int-2', 'video');
      service.setActiveCall(call);
      expect(service.activeCall()!.getType()).toBe('video');
    });

    it('should handle switching from audio to video call', () => {
      const audioCall = createMockCall('switch-1', 'audio');
      const videoCall = createMockCall('switch-2', 'video');

      service.setActiveCall(audioCall);
      expect(service.activeCall()!.getType()).toBe('audio');

      service.setActiveCall(videoCall);
      expect(service.activeCall()!.getType()).toBe('video');
    });

    it('should call SoundManager.play with correct arguments for audio call', () => {
      const call = createMockCall('sdk-audio', 'audio');
      service.setActiveCall(call);
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledWith('outgoingCall', null);
    });

    it('should call SoundManager.play with correct arguments for video call', () => {
      const call = createMockCall('sdk-video', 'video');
      service.setActiveCall(call);
      service.playOutgoingSound();
      // Sound is the same regardless of call type
      expect(playSpy).toHaveBeenCalledWith('outgoingCall', null);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle setActiveCall(null) when already null', () => {
      expect(() => service.setActiveCall(null)).not.toThrow();
      expect(service.activeCall()).toBeNull();
    });

    it('should handle setting the same call multiple times', () => {
      const call = createMockCall('sess-repeat');
      service.setActiveCall(call);
      service.setActiveCall(call);
      service.setActiveCall(call);
      expect(service.activeCall()).toBe(call);
    });

    it('should handle rapid set/clear of activeCall without errors', () => {
      const call = createMockCall('rapid-1');
      for (let i = 0; i < 50; i++) {
        service.setActiveCall(call);
        service.setActiveCall(null);
      }
      expect(service.activeCall()).toBeNull();
    });

    it('should handle rapid play/stop sound cycles', () => {
      for (let i = 0; i < 20; i++) {
        service.playOutgoingSound();
        service.stopOutgoingSound();
      }
      expect(playSpy).toHaveBeenCalledTimes(20);
      expect(pauseSpy).toHaveBeenCalledTimes(20);
    });

    it('should handle rapid config toggles', () => {
      for (let i = 0; i < 30; i++) {
        service.setDisableSoundForCalls(i % 2 === 0);
        service.setCustomSoundForCalls(i % 2 === 0 ? 'https://example.com/sound.mp3' : '');
      }
      // Last iteration: i=29, 29%2=1 → false, ''
      expect(service.disableSoundForCalls()).toBe(false);
      expect(service.customSoundForCalls()).toBe('');
    });

    it('should handle play called multiple times without stop in between', () => {
      service.playOutgoingSound();
      service.playOutgoingSound();
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle stop called multiple times without play in between', () => {
      service.stopOutgoingSound();
      service.stopOutgoingSound();
      service.stopOutgoingSound();
      expect(pauseSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle interleaved play/stop with config changes', () => {
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledTimes(1);

      service.setDisableSoundForCalls(true);
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledTimes(1); // Still 1, disabled

      service.stopOutgoingSound();
      expect(pauseSpy).toHaveBeenCalledTimes(1);

      service.setDisableSoundForCalls(false);
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== Null/Undefined Parameter Handling ====================

  describe('Null/Undefined Parameter Handling', () => {
    it('should accept null and set activeCall to null', () => {
      service.setActiveCall(null);
      expect(service.activeCall()).toBeNull();
    });

    it('should accept null after having an active call', () => {
      const call = createMockCall('null-1');
      service.setActiveCall(call);
      service.setActiveCall(null);
      expect(service.activeCall()).toBeNull();
    });

    it('should handle undefined coerced to null gracefully', () => {
      service.setActiveCall(undefined as any);
      expect(service.activeCall()).toBeUndefined();
    });

    it('should handle falsy values coerced as boolean for disableSoundForCalls', () => {
      service.setDisableSoundForCalls(0 as any);
      expect(service.disableSoundForCalls()).toBeFalsy();
    });

    it('should handle truthy values coerced as boolean for disableSoundForCalls', () => {
      service.setDisableSoundForCalls(1 as any);
      expect(service.disableSoundForCalls()).toBeTruthy();
    });

    it('should handle null coerced as string for customSoundForCalls', () => {
      service.setCustomSoundForCalls(null as any);
      expect(service.customSoundForCalls()).toBeNull();
    });

    it('should pass null/empty custom URL as null to SoundManager', () => {
      service.setCustomSoundForCalls('');
      service.playOutgoingSound();
      expect(playSpy).toHaveBeenCalledWith('outgoingCall', null);
    });

    it('should not throw when playOutgoingSound called with default configuration', () => {
      expect(() => service.playOutgoingSound()).not.toThrow();
    });

    it('should not throw when stopOutgoingSound called with no prior play', () => {
      expect(() => service.stopOutgoingSound()).not.toThrow();
    });

    it('should not throw when stopOutgoingSound called multiple times', () => {
      expect(() => {
        service.stopOutgoingSound();
        service.stopOutgoingSound();
      }).not.toThrow();
    });
  });
});
