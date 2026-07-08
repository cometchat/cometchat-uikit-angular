/**
 * cometchat-message-list.message-state Tests
 *
 * Covers: shouldPlaySoundImpl, getReactionFingerprintImpl,
 *         getDateStringImpl, computeMessagesWithDateSeparatorsImpl.
 *
 * @module components/cometchat-message-list/message-state
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  shouldPlaySoundImpl,
  getReactionFingerprintImpl,
  getDateStringImpl,
  computeMessagesWithDateSeparatorsImpl,
} from './cometchat-message-list.message-state';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeMessage(id: number, senderUid: string, sentAt = 1705276800): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getMuid = () => `muid-${id}`;
  (msg as any).getSentAt = () => sentAt;
  (msg as any).getReplyCount = () => 0;
  (msg as any).getReadAt = () => null;
  (msg as any).getDeliveredAt = () => null;
  (msg as any).getDeletedAt = () => null;
  (msg as any).getEditedAt = () => null;
  msg.setSender(makeUser(senderUid));
  return msg as unknown as CometChat.BaseMessage;
}

function makeReactionCount(emoji: string, count: number, reactedByMe = false): CometChat.ReactionCount {
  return new CometChat.ReactionCount(emoji, count, reactedByMe);
}

function makeSelf(overrides: Record<string, any> = {}) {
  return {
    loggedInUser: makeUser('loggedIn'),
    effectiveDisableSoundForMessages: vi.fn().mockReturnValue(false),
    lastSoundPlayedAt: 0,
    SOUND_THROTTLE_INTERVAL: 1000,
    messages: vi.fn().mockReturnValue([]),
    hideDateSeparator: false,
    ...overrides,
  };
}

describe('cometchat-message-list.message-state', () => {

  // ==================== shouldPlaySoundImpl ====================

  describe('shouldPlaySoundImpl', () => {
    it('should return false when sound is disabled', () => {
      const self = makeSelf({ effectiveDisableSoundForMessages: vi.fn().mockReturnValue(true) });
      const msg = makeMessage(1, 'other');
      expect(shouldPlaySoundImpl(self, msg)).toBe(false);
    });

    it('should return false when message is from logged-in user', () => {
      const self = makeSelf();
      const msg = makeMessage(1, 'loggedIn');
      expect(shouldPlaySoundImpl(self, msg)).toBe(false);
    });

    it('should return false when sound was played recently (throttle)', () => {
      const self = makeSelf({ lastSoundPlayedAt: Date.now() - 500, SOUND_THROTTLE_INTERVAL: 1000 });
      const msg = makeMessage(1, 'other');
      expect(shouldPlaySoundImpl(self, msg)).toBe(false);
    });

    it('should return true when all conditions are met', () => {
      const self = makeSelf({ lastSoundPlayedAt: 0 });
      const msg = makeMessage(1, 'other');
      expect(shouldPlaySoundImpl(self, msg)).toBe(true);
    });

    it('should return true when throttle interval has passed', () => {
      const self = makeSelf({ lastSoundPlayedAt: Date.now() - 2000, SOUND_THROTTLE_INTERVAL: 1000 });
      const msg = makeMessage(1, 'other');
      expect(shouldPlaySoundImpl(self, msg)).toBe(true);
    });
  });

  // ==================== getReactionFingerprintImpl ====================

  describe('getReactionFingerprintImpl', () => {
    it('should return "0" for message with no reactions', () => {
      const msg = makeMessage(1, 'user1');
      (msg as any).getReactions = () => [];
      expect(getReactionFingerprintImpl(msg)).toBe('0');
    });

    it('should return "0" when getReactions is undefined', () => {
      const msg = makeMessage(1, 'user1');
      (msg as any).getReactions = undefined;
      expect(getReactionFingerprintImpl(msg)).toBe('0');
    });

    it('should return fingerprint string for reactions', () => {
      const msg = makeMessage(1, 'user1');
      (msg as any).getReactions = () => [makeReactionCount('👍', 2, true)];
      const fp = getReactionFingerprintImpl(msg);
      expect(fp).toContain('👍');
      expect(fp).toContain('2');
      expect(fp).toContain('m'); // reactedByMe
    });

    it('should include multiple reactions separated by |', () => {
      const msg = makeMessage(1, 'user1');
      (msg as any).getReactions = () => [
        makeReactionCount('👍', 2, true),
        makeReactionCount('❤️', 1, false),
      ];
      const fp = getReactionFingerprintImpl(msg);
      expect(fp).toContain('|');
    });

    it('should not include "m" when reactedByMe is false', () => {
      const msg = makeMessage(1, 'user1');
      (msg as any).getReactions = () => [makeReactionCount('👍', 1, false)];
      const fp = getReactionFingerprintImpl(msg);
      expect(fp).not.toContain('m');
    });
  });

  // ==================== getDateStringImpl ====================

  describe('getDateStringImpl', () => {
    it('should return a string in YYYY-M-D format', () => {
      const ts = 1705276800; // 2024-01-15
      const result = getDateStringImpl(ts);
      expect(typeof result).toBe('string');
      expect(result.split('-').length).toBe(3);
    });

    it('should return the same string for timestamps on the same day', () => {
      const ts1 = 1705276800;
      const ts2 = ts1 + 3600; // +1 hour
      expect(getDateStringImpl(ts1)).toBe(getDateStringImpl(ts2));
    });

    it('should return different strings for timestamps on different days', () => {
      const ts1 = 1705276800;
      const ts2 = ts1 + 86400; // +1 day
      expect(getDateStringImpl(ts1)).not.toBe(getDateStringImpl(ts2));
    });
  });

  // ==================== computeMessagesWithDateSeparatorsImpl ====================

  describe('computeMessagesWithDateSeparatorsImpl', () => {
    it('should return empty array when no messages', () => {
      const self = makeSelf({ messages: vi.fn().mockReturnValue([]) });
      expect(computeMessagesWithDateSeparatorsImpl(self)).toEqual([]);
    });

    it('should return messages without separators when hideDateSeparator=true', () => {
      const msg = makeMessage(1, 'user1', 1705276800);
      const self = makeSelf({
        messages: vi.fn().mockReturnValue([msg]),
        hideDateSeparator: true,
      });
      const result = computeMessagesWithDateSeparatorsImpl(self);
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('message');
    });

    it('should insert date separator before first message', () => {
      const msg = makeMessage(1, 'user1', 1705276800);
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg]) });
      const result = computeMessagesWithDateSeparatorsImpl(self);
      expect(result.length).toBe(2);
      expect(result[0].type).toBe('date-separator');
      expect(result[1].type).toBe('message');
    });

    it('should insert separator between messages on different days', () => {
      const msg1 = makeMessage(1, 'user1', 1705276800); // day 1
      const msg2 = makeMessage(2, 'user1', 1705276800 + 86400); // day 2
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg1, msg2]) });
      const result = computeMessagesWithDateSeparatorsImpl(self);
      // sep1, msg1, sep2, msg2
      expect(result.length).toBe(4);
      expect(result[0].type).toBe('date-separator');
      expect(result[1].type).toBe('message');
      expect(result[2].type).toBe('date-separator');
      expect(result[3].type).toBe('message');
    });

    it('should not insert separator between messages on same day', () => {
      const msg1 = makeMessage(1, 'user1', 1705276800);
      const msg2 = makeMessage(2, 'user1', 1705276800 + 3600); // same day
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg1, msg2]) });
      const result = computeMessagesWithDateSeparatorsImpl(self);
      // sep, msg1, msg2
      expect(result.length).toBe(3);
    });

    it('should include key property on each item', () => {
      const msg = makeMessage(1, 'user1', 1705276800);
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg]) });
      const result = computeMessagesWithDateSeparatorsImpl(self);
      for (const item of result) {
        expect(typeof item.key).toBe('string');
        expect(item.key.length).toBeGreaterThan(0);
      }
    });
  });
});
