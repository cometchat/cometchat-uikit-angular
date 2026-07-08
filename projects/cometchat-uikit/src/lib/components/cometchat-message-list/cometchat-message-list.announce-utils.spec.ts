/**
 * cometchat-message-list.announce-utils Tests
 *
 * Covers: announceNewMessageImpl, announceMessageSentImpl,
 *         announceMessageFailedImpl, announceMessageDeletedImpl,
 *         announceMessageEditedImpl, announceTypingImpl,
 *         announceLoadingMoreImpl.
 *
 * @module components/cometchat-message-list/announce-utils
 */

import { describe, it, expect, vi } from 'vitest';
import {
  announceNewMessageImpl,
  announceMessageSentImpl,
  announceMessageFailedImpl,
  announceMessageDeletedImpl,
  announceMessageEditedImpl,
  announceTypingImpl,
  announceLoadingMoreImpl,
} from './cometchat-message-list.announce-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSelf(overrides: Record<string, any> = {}) {
  return {
    liveAnnouncer: {
      announce: vi.fn(),
      announceError: vi.fn(),
    },
    typingAnnouncementTimeout: null as any,
    ...overrides,
  };
}

describe('cometchat-message-list.announce-utils', () => {

  // ==================== announceNewMessageImpl ====================

  describe('announceNewMessageImpl', () => {
    it('should call liveAnnouncer.announce with polite priority', () => {
      const self = makeSelf();
      announceNewMessageImpl(self, 'Alice', 'Hello world');
      expect(self.liveAnnouncer.announce).toHaveBeenCalledWith(
        expect.any(String),
        'polite'
      );
    });

    it('should include sender name in the announcement', () => {
      const self = makeSelf();
      announceNewMessageImpl(self, 'Alice', 'Hello');
      const call = self.liveAnnouncer.announce.mock.calls[0][0];
      expect(call).toContain('Alice');
    });

    it('should include message preview in the announcement', () => {
      const self = makeSelf();
      announceNewMessageImpl(self, 'Alice', 'Hello world');
      const call = self.liveAnnouncer.announce.mock.calls[0][0];
      expect(call).toContain('Hello world');
    });
  });

  // ==================== announceMessageSentImpl ====================

  describe('announceMessageSentImpl', () => {
    it('should call liveAnnouncer.announce with polite priority', () => {
      const self = makeSelf();
      announceMessageSentImpl(self);
      expect(self.liveAnnouncer.announce).toHaveBeenCalledWith(
        expect.any(String),
        'polite'
      );
    });
  });

  // ==================== announceMessageFailedImpl ====================

  describe('announceMessageFailedImpl', () => {
    it('should call liveAnnouncer.announceError', () => {
      const self = makeSelf();
      announceMessageFailedImpl(self);
      expect(self.liveAnnouncer.announceError).toHaveBeenCalledWith(expect.any(String));
    });
  });

  // ==================== announceMessageDeletedImpl ====================

  describe('announceMessageDeletedImpl', () => {
    it('should call liveAnnouncer.announce with polite priority', () => {
      const self = makeSelf();
      announceMessageDeletedImpl(self);
      expect(self.liveAnnouncer.announce).toHaveBeenCalledWith(
        expect.any(String),
        'polite'
      );
    });
  });

  // ==================== announceMessageEditedImpl ====================

  describe('announceMessageEditedImpl', () => {
    it('should call liveAnnouncer.announce with polite priority', () => {
      const self = makeSelf();
      announceMessageEditedImpl(self);
      expect(self.liveAnnouncer.announce).toHaveBeenCalledWith(
        expect.any(String),
        'polite'
      );
    });
  });

  // ==================== announceTypingImpl ====================

  describe('announceTypingImpl', () => {
    it('should set a timeout', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      announceTypingImpl(self, 'Alice');
      expect(self.typingAnnouncementTimeout).toBeDefined();
      vi.useRealTimers();
    });

    it('should call liveAnnouncer.announce after 1 second', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      announceTypingImpl(self, 'Alice');
      vi.advanceTimersByTime(1000);
      expect(self.liveAnnouncer.announce).toHaveBeenCalledWith(
        expect.stringContaining('Alice'),
        'polite'
      );
      vi.useRealTimers();
    });

    it('should clear previous timeout when called again', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      announceTypingImpl(self, 'Alice');
      const firstTimeout = self.typingAnnouncementTimeout;
      announceTypingImpl(self, 'Bob');
      // Should have a new timeout
      expect(self.typingAnnouncementTimeout).not.toBe(firstTimeout);
      vi.useRealTimers();
    });

    it('should clear timeout reference after it fires', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      announceTypingImpl(self, 'Alice');
      vi.advanceTimersByTime(1000);
      expect(self.typingAnnouncementTimeout).toBeNull();
      vi.useRealTimers();
    });
  });

  // ==================== announceLoadingMoreImpl ====================

  describe('announceLoadingMoreImpl', () => {
    it('should call liveAnnouncer.announce with polite priority', () => {
      const self = makeSelf();
      announceLoadingMoreImpl(self);
      expect(self.liveAnnouncer.announce).toHaveBeenCalledWith(
        expect.any(String),
        'polite'
      );
    });
  });
});
