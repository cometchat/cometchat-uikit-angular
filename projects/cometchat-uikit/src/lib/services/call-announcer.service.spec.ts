/**
 * CallAnnouncerService Tests
 *
 * Categories: Initialization, Call Announcement Triggers,
 *             Sound Playback Coordination, Null/Edge Case Handling,
 *             Localization Integration
 *
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/call-announcer
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CallAnnouncerService } from './call-announcer.service';
import { LiveAnnouncerService } from './live-announcer.service';

describe('CallAnnouncerService', () => {
  let service: CallAnnouncerService;
  let liveAnnouncer: LiveAnnouncerService;
  let announceSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30_000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallAnnouncerService);
    liveAnnouncer = TestBed.inject(LiveAnnouncerService);
    announceSpy = vi.spyOn(liveAnnouncer, 'announce');
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should be a singleton instance via TestBed', () => {
      const service2 = TestBed.inject(CallAnnouncerService);
      expect(service).toBe(service2);
    });

    it('should have all public announcement methods', () => {
      expect(typeof service.announceIncomingCall).toBe('function');
      expect(typeof service.announceOutgoingCall).toBe('function');
      expect(typeof service.announceCallConnected).toBe('function');
      expect(typeof service.announceCallEnded).toBe('function');
      expect(typeof service.announceCallDeclined).toBe('function');
      expect(typeof service.announceCallCanceled).toBe('function');
      expect(typeof service.announceCallFailed).toBe('function');
      expect(typeof service.announceCallInitiation).toBe('function');
    });
  });

  // ==================== Call Announcement Triggers ====================

  describe('Call Announcement Triggers', () => {
    it('should announce incoming audio call with caller name', () => {
      service.announceIncomingCall('Alice', 'audio');

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('Alice');
    });

    it('should announce incoming video call with caller name', () => {
      service.announceIncomingCall('Bob', 'video');

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('Bob');
    });

    it('should announce outgoing call with receiver name', () => {
      service.announceOutgoingCall('Charlie');

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('Charlie');
    });

    it('should announce call connected', () => {
      service.announceCallConnected();

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toBeTruthy();
    });

    it('should announce call ended', () => {
      service.announceCallEnded();

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toBeTruthy();
    });

    it('should announce call declined', () => {
      service.announceCallDeclined();

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toBeTruthy();
    });

    it('should announce call canceled', () => {
      service.announceCallCanceled();

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toBeTruthy();
    });

    it('should announce call failed without reason', () => {
      service.announceCallFailed();

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toBeTruthy();
    });

    it('should announce call failed with reason appended', () => {
      service.announceCallFailed('Network error');

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('Network error');
    });

    it('should announce audio call initiation', () => {
      service.announceCallInitiation('audio');

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toBeTruthy();
    });

    it('should announce video call initiation', () => {
      service.announceCallInitiation('video');

      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toBeTruthy();
    });
  });

  // ==================== Sound Playback Coordination ====================

  describe('Sound Playback Coordination', () => {
    it('should use assertive politeness for incoming calls', () => {
      service.announceIncomingCall('Test', 'audio');
      expect(announceSpy.mock.calls[0][1]).toBe('assertive');
    });

    it('should use assertive politeness for outgoing calls', () => {
      service.announceOutgoingCall('Test');
      expect(announceSpy.mock.calls[0][1]).toBe('assertive');
    });

    it('should use assertive politeness for call connected', () => {
      service.announceCallConnected();
      expect(announceSpy.mock.calls[0][1]).toBe('assertive');
    });

    it('should use assertive politeness for call ended', () => {
      service.announceCallEnded();
      expect(announceSpy.mock.calls[0][1]).toBe('assertive');
    });

    it('should use assertive politeness for call declined', () => {
      service.announceCallDeclined();
      expect(announceSpy.mock.calls[0][1]).toBe('assertive');
    });

    it('should use assertive politeness for call canceled', () => {
      service.announceCallCanceled();
      expect(announceSpy.mock.calls[0][1]).toBe('assertive');
    });

    it('should use assertive politeness for call failed', () => {
      service.announceCallFailed();
      expect(announceSpy.mock.calls[0][1]).toBe('assertive');
    });

    it('should use polite politeness for call initiation', () => {
      service.announceCallInitiation('audio');
      expect(announceSpy.mock.calls[0][1]).toBe('polite');
    });

    it('should use 3000ms duration for incoming calls', () => {
      service.announceIncomingCall('Test', 'audio');
      expect(announceSpy.mock.calls[0][2]).toBe(3000);
    });

    it('should use 3000ms duration for call failed', () => {
      service.announceCallFailed();
      expect(announceSpy.mock.calls[0][2]).toBe(3000);
    });

    it('should use 2000ms duration for outgoing calls', () => {
      service.announceOutgoingCall('Test');
      expect(announceSpy.mock.calls[0][2]).toBe(2000);
    });

    it('should use 2000ms duration for call connected', () => {
      service.announceCallConnected();
      expect(announceSpy.mock.calls[0][2]).toBe(2000);
    });

    it('should use 2000ms duration for call ended', () => {
      service.announceCallEnded();
      expect(announceSpy.mock.calls[0][2]).toBe(2000);
    });

    it('should use 2000ms duration for call initiation', () => {
      service.announceCallInitiation('video');
      expect(announceSpy.mock.calls[0][2]).toBe(2000);
    });

    it('should delegate all announcements to LiveAnnouncerService', () => {
      service.announceIncomingCall('A', 'audio');
      service.announceOutgoingCall('B');
      service.announceCallConnected();
      service.announceCallEnded();
      service.announceCallDeclined();
      service.announceCallCanceled();
      service.announceCallFailed();
      service.announceCallInitiation('video');

      expect(announceSpy).toHaveBeenCalledTimes(8);
    });
  });

  // ==================== Localization Integration ====================

  describe('Localization Integration', () => {
    it('should produce different messages for audio vs video incoming calls', () => {
      service.announceIncomingCall('Test', 'audio');
      const audioMsg = announceSpy.mock.calls[0][0] as string;

      announceSpy.mockClear();
      service.announceIncomingCall('Test', 'video');
      const videoMsg = announceSpy.mock.calls[0][0] as string;

      expect(audioMsg).not.toBe(videoMsg);
    });

    it('should produce different messages for audio vs video call initiation', () => {
      service.announceCallInitiation('audio');
      const audioMsg = announceSpy.mock.calls[0][0] as string;

      announceSpy.mockClear();
      service.announceCallInitiation('video');
      const videoMsg = announceSpy.mock.calls[0][0] as string;

      expect(audioMsg).not.toBe(videoMsg);
    });

    it('should produce non-empty messages for all status announcements', () => {
      const methods: (() => void)[] = [
        () => service.announceCallConnected(),
        () => service.announceCallEnded(),
        () => service.announceCallDeclined(),
        () => service.announceCallCanceled(),
        () => service.announceCallFailed(),
      ];

      for (const method of methods) {
        announceSpy.mockClear();
        method();
        const message = announceSpy.mock.calls[0][0] as string;
        expect(message.length).toBeGreaterThan(0);
      }
    });

    it('should replace {name} placeholder in incoming call message', () => {
      service.announceIncomingCall('UniqueCallerXYZ', 'audio');
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('UniqueCallerXYZ');
      expect(message).not.toContain('{name}');
    });

    it('should replace {name} placeholder in outgoing call message', () => {
      service.announceOutgoingCall('UniqueReceiverABC');
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('UniqueReceiverABC');
      expect(message).not.toContain('{name}');
    });

    it('should replace {type} placeholder in incoming call message', () => {
      service.announceIncomingCall('Test', 'video');
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).not.toContain('{type}');
    });

    it('should replace {type} placeholder in call initiation message', () => {
      service.announceCallInitiation('audio');
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).not.toContain('{type}');
    });
  });

  // ==================== Null / Edge Case Handling ====================

  describe('Null / Edge Case Handling', () => {
    it('should handle empty caller name for incoming call without throwing', () => {
      expect(() => service.announceIncomingCall('', 'audio')).not.toThrow();
      expect(announceSpy).toHaveBeenCalledOnce();
    });

    it('should handle empty receiver name for outgoing call without throwing', () => {
      expect(() => service.announceOutgoingCall('')).not.toThrow();
      expect(announceSpy).toHaveBeenCalledOnce();
    });

    it('should handle empty string reason for call failed (treated as falsy)', () => {
      service.announceCallFailed('');
      const message = announceSpy.mock.calls[0][0] as string;
      // Empty string is falsy, so no `: ` suffix should be appended
      expect(message).not.toContain(': ');
    });

    it('should handle undefined reason for call failed', () => {
      service.announceCallFailed(undefined);
      expect(announceSpy).toHaveBeenCalledOnce();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).not.toContain('undefined');
    });

    it('should handle special characters in caller name', () => {
      expect(() => service.announceIncomingCall("O'Brien & Co.", 'audio')).not.toThrow();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain("O'Brien & Co.");
    });

    it('should handle special characters in failure reason', () => {
      service.announceCallFailed('Error: <timeout> & retry');
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('Error: <timeout> & retry');
    });

    it('should handle very long caller name without throwing', () => {
      const longName = 'A'.repeat(500);
      expect(() => service.announceIncomingCall(longName, 'video')).not.toThrow();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain(longName);
    });

    it('should handle very long failure reason without throwing', () => {
      const longReason = 'Error '.repeat(100);
      expect(() => service.announceCallFailed(longReason)).not.toThrow();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain(longReason);
    });

    it('should handle rapid successive announcements without throwing', () => {
      expect(() => {
        service.announceIncomingCall('A', 'audio');
        service.announceOutgoingCall('B');
        service.announceCallConnected();
        service.announceCallEnded();
        service.announceCallDeclined();
        service.announceCallCanceled();
        service.announceCallFailed('reason');
        service.announceCallInitiation('video');
      }).not.toThrow();

      expect(announceSpy).toHaveBeenCalledTimes(8);
    });

    it('should handle unicode characters in caller name', () => {
      expect(() => service.announceIncomingCall('用户名 🎉', 'audio')).not.toThrow();
      const message = announceSpy.mock.calls[0][0] as string;
      expect(message).toContain('用户名 🎉');
    });
  });
});
