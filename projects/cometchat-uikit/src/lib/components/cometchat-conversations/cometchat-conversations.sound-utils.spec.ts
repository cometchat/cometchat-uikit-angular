/**
 * cometchat-conversations.sound-utils Tests
 *
 * Covers: isNewMessage, isMessageFromLoggedInUser,
 *         shouldPlayConversationSound, getConversationId,
 *         getConversationDisplayName.
 *
 * @module components/cometchat-conversations/sound-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  isNewMessage,
  isMessageFromLoggedInUser,
  shouldPlayConversationSound,
  getConversationId,
  getConversationDisplayName,
} from './cometchat-conversations.sound-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, name = `User ${uid}`): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  return u;
}

function makeMessage(id: number, senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  msg.setSender(makeUser(senderUid));
  return msg as unknown as CometChat.BaseMessage;
}

function makeConversation(id: string, name: string): CometChat.Conversation {
  const conv = new CometChat.Conversation();
  (conv as any).conversationId = id;
  (conv as any).getConversationId = () => id;
  const user = makeUser('u1', name);
  (conv as any).conversationWith = user;
  (conv as any).getConversationWith = () => user;
  return conv;
}

describe('cometchat-conversations.sound-utils', () => {

  // ==================== isNewMessage ====================

  describe('isNewMessage', () => {
    it('should return true when message ID is greater than lastKnownMessageId', () => {
      const msg = makeMessage(100, 'user1');
      expect(isNewMessage(msg, 50)).toBe(true);
    });

    it('should return false when message ID equals lastKnownMessageId', () => {
      const msg = makeMessage(50, 'user1');
      expect(isNewMessage(msg, 50)).toBe(false);
    });

    it('should return false when message ID is less than lastKnownMessageId', () => {
      const msg = makeMessage(30, 'user1');
      expect(isNewMessage(msg, 50)).toBe(false);
    });

    it('should return true when lastKnownMessageId is 0', () => {
      const msg = makeMessage(1, 'user1');
      expect(isNewMessage(msg, 0)).toBe(true);
    });

    it('should handle message with no ID (returns 0)', () => {
      const msg = makeMessage(0, 'user1');
      (msg as any).getId = () => undefined;
      expect(isNewMessage(msg, 0)).toBe(false);
    });
  });

  // ==================== isMessageFromLoggedInUser ====================

  describe('isMessageFromLoggedInUser', () => {
    it('should return true when sender UID matches loggedInUid', () => {
      const msg = makeMessage(1, 'loggedIn');
      expect(isMessageFromLoggedInUser(msg, 'loggedIn')).toBe(true);
    });

    it('should return false when sender UID does not match', () => {
      const msg = makeMessage(1, 'other');
      expect(isMessageFromLoggedInUser(msg, 'loggedIn')).toBe(false);
    });

    it('should return false when message has no sender', () => {
      const msg = makeMessage(1, 'user1');
      (msg as any).getSender = () => null;
      expect(isMessageFromLoggedInUser(msg, 'loggedIn')).toBe(false);
    });
  });

  // ==================== shouldPlayConversationSound ====================

  describe('shouldPlayConversationSound', () => {
    it('should return false when sound is disabled', () => {
      const msg = makeMessage(100, 'other');
      expect(shouldPlayConversationSound(msg, 'loggedIn', true, 50)).toBe(false);
    });

    it('should return false when message is from logged-in user', () => {
      const msg = makeMessage(100, 'loggedIn');
      expect(shouldPlayConversationSound(msg, 'loggedIn', false, 50)).toBe(false);
    });

    it('should return false when message is not new', () => {
      const msg = makeMessage(30, 'other');
      expect(shouldPlayConversationSound(msg, 'loggedIn', false, 50)).toBe(false);
    });

    it('should return true when all conditions are met', () => {
      const msg = makeMessage(100, 'other');
      expect(shouldPlayConversationSound(msg, 'loggedIn', false, 50)).toBe(true);
    });

    it('should return false when sound disabled even if message is new and from other', () => {
      const msg = makeMessage(100, 'other');
      expect(shouldPlayConversationSound(msg, 'loggedIn', true, 50)).toBe(false);
    });
  });

  // ==================== getConversationId ====================

  describe('getConversationId', () => {
    it('should return the conversation ID', () => {
      const conv = makeConversation('conv-123', 'Alice');
      expect(getConversationId(conv)).toBe('conv-123');
    });
  });

  // ==================== getConversationDisplayName ====================

  describe('getConversationDisplayName', () => {
    it('should return the name of the conversation participant', () => {
      const conv = makeConversation('conv-1', 'Alice');
      expect(getConversationDisplayName(conv)).toBe('Alice');
    });

    it('should return empty string when conversationWith has no name', () => {
      const conv = makeConversation('conv-1', 'Alice');
      // Override getName to return empty string
      const user = makeUser('u1', 'Alice');
      (user as any).getName = () => '';
      (conv as any).getConversationWith = () => user;
      expect(getConversationDisplayName(conv)).toBe('');
    });

    it('should return empty string when conversationWith is null', () => {
      const conv = makeConversation('conv-1', 'Alice');
      (conv as any).getConversationWith = () => null;
      expect(getConversationDisplayName(conv)).toBe('');
    });
  });
});
