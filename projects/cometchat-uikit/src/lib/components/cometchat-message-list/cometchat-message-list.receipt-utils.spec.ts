/**
 * cometchat-message-list.receipt-utils Tests
 *
 * Covers: isSenderMessage, isReceiverMessage, isEligibleForReadReceipt,
 *         getLatestReceiverMessage, countUnreadMessages,
 *         getConversationId, getConversationType, isMessageForCurrentConversation.
 *
 * @module components/cometchat-message-list/receipt-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  isSenderMessage,
  isReceiverMessage,
  isEligibleForReadReceipt,
  getLatestReceiverMessage,
  countUnreadMessages,
  getConversationId,
  getConversationType,
  isMessageForCurrentConversation,
} from './cometchat-message-list.receipt-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeGroup(guid: string): CometChat.Group {
  return new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC, '');
}

function makeMessage(
  id: number,
  senderUid: string,
  receiverId: string,
  opts: { deletedAt?: number; readAt?: number } = {}
): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage(receiverId, 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  const sender = makeUser(senderUid);
  msg.setSender(sender);
  if (opts.deletedAt) {
    (msg as any).deletedAt = opts.deletedAt;
    (msg as any).getDeletedAt = () => opts.deletedAt;
  }
  if (opts.readAt) {
    (msg as any).readAt = opts.readAt;
    (msg as any).getReadAt = () => opts.readAt;
  }
  return msg as unknown as CometChat.BaseMessage;
}

describe('cometchat-message-list.receipt-utils', () => {

  // ==================== isSenderMessage ====================

  describe('isSenderMessage', () => {
    it('should return true when sender UID matches loggedInUid', () => {
      const msg = makeMessage(1, 'user1', 'user2');
      expect(isSenderMessage(msg, 'user1')).toBe(true);
    });

    it('should return false when sender UID does not match', () => {
      const msg = makeMessage(1, 'user2', 'user1');
      expect(isSenderMessage(msg, 'user1')).toBe(false);
    });

    it('should return false when message has no sender', () => {
      const msg = new CometChat.TextMessage('user1', 'Hello', CometChat.RECEIVER_TYPE.USER);
      // No sender set
      expect(isSenderMessage(msg as unknown as CometChat.BaseMessage, 'user1')).toBe(false);
    });
  });

  // ==================== isReceiverMessage ====================

  describe('isReceiverMessage', () => {
    it('should return true when sender UID does not match loggedInUid', () => {
      const msg = makeMessage(1, 'user2', 'user1');
      expect(isReceiverMessage(msg, 'user1')).toBe(true);
    });

    it('should return false when sender UID matches loggedInUid', () => {
      const msg = makeMessage(1, 'user1', 'user2');
      expect(isReceiverMessage(msg, 'user1')).toBe(false);
    });
  });

  // ==================== isEligibleForReadReceipt ====================

  describe('isEligibleForReadReceipt', () => {
    it('should return true for an unread receiver message', () => {
      const msg = makeMessage(1, 'user2', 'user1');
      expect(isEligibleForReadReceipt(msg, 'user1')).toBe(true);
    });

    it('should return false for a sender message', () => {
      const msg = makeMessage(1, 'user1', 'user2');
      expect(isEligibleForReadReceipt(msg, 'user1')).toBe(false);
    });

    it('should return false for a deleted message', () => {
      const msg = makeMessage(1, 'user2', 'user1', { deletedAt: Date.now() });
      expect(isEligibleForReadReceipt(msg, 'user1')).toBe(false);
    });

    it('should return false for an already-read message', () => {
      const msg = makeMessage(1, 'user2', 'user1', { readAt: Date.now() });
      expect(isEligibleForReadReceipt(msg, 'user1')).toBe(false);
    });
  });

  // ==================== getLatestReceiverMessage ====================

  describe('getLatestReceiverMessage', () => {
    it('should return the message with the highest ID among receiver messages', () => {
      const msg1 = makeMessage(10, 'user2', 'user1');
      const msg2 = makeMessage(20, 'user2', 'user1');
      const msg3 = makeMessage(15, 'user2', 'user1');
      const result = getLatestReceiverMessage([msg1, msg2, msg3], 'user1');
      expect((result as any).id).toBe(20);
    });

    it('should skip sender messages', () => {
      const senderMsg = makeMessage(100, 'user1', 'user2');
      const receiverMsg = makeMessage(50, 'user2', 'user1');
      const result = getLatestReceiverMessage([senderMsg, receiverMsg], 'user1');
      expect((result as any).id).toBe(50);
    });

    it('should return null when all messages are from the logged-in user', () => {
      const msg1 = makeMessage(10, 'user1', 'user2');
      const msg2 = makeMessage(20, 'user1', 'user2');
      expect(getLatestReceiverMessage([msg1, msg2], 'user1')).toBeNull();
    });

    it('should return null for empty array', () => {
      expect(getLatestReceiverMessage([], 'user1')).toBeNull();
    });

    it('should return the single receiver message in a one-element array', () => {
      const msg = makeMessage(42, 'user2', 'user1');
      const result = getLatestReceiverMessage([msg], 'user1');
      expect((result as any).id).toBe(42);
    });
  });

  // ==================== countUnreadMessages ====================

  describe('countUnreadMessages', () => {
    it('should count only unread receiver messages', () => {
      const unread1 = makeMessage(1, 'user2', 'user1');
      const unread2 = makeMessage(2, 'user2', 'user1');
      const read = makeMessage(3, 'user2', 'user1', { readAt: Date.now() });
      const sent = makeMessage(4, 'user1', 'user2');
      expect(countUnreadMessages([unread1, unread2, read, sent], 'user1')).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(countUnreadMessages([], 'user1')).toBe(0);
    });

    it('should return 0 when all messages are read', () => {
      const msg1 = makeMessage(1, 'user2', 'user1', { readAt: Date.now() });
      const msg2 = makeMessage(2, 'user2', 'user1', { readAt: Date.now() });
      expect(countUnreadMessages([msg1, msg2], 'user1')).toBe(0);
    });

    it('should return 0 when all messages are from the logged-in user', () => {
      const msg1 = makeMessage(1, 'user1', 'user2');
      const msg2 = makeMessage(2, 'user1', 'user2');
      expect(countUnreadMessages([msg1, msg2], 'user1')).toBe(0);
    });
  });

  // ==================== getConversationId ====================

  describe('getConversationId', () => {
    it('should return user UID when user is provided', () => {
      const user = makeUser('user1');
      expect(getConversationId(user, null)).toBe('user1');
    });

    it('should return group GUID when group is provided', () => {
      const group = makeGroup('group1');
      expect(getConversationId(null, group)).toBe('group1');
    });

    it('should return null when both are null', () => {
      expect(getConversationId(null, null)).toBeNull();
    });

    it('should prefer user over group when both are provided', () => {
      const user = makeUser('user1');
      const group = makeGroup('group1');
      expect(getConversationId(user, group)).toBe('user1');
    });
  });

  // ==================== getConversationType ====================

  describe('getConversationType', () => {
    it('should return USER receiver type when user is provided', () => {
      const user = makeUser('user1');
      expect(getConversationType(user, null)).toBe(CometChat.RECEIVER_TYPE.USER);
    });

    it('should return GROUP receiver type when group is provided', () => {
      const group = makeGroup('group1');
      expect(getConversationType(null, group)).toBe(CometChat.RECEIVER_TYPE.GROUP);
    });

    it('should return empty string when both are null', () => {
      expect(getConversationType(null, null)).toBe('');
    });
  });

  // ==================== isMessageForCurrentConversation ====================

  describe('isMessageForCurrentConversation', () => {
    it('should return true for a message from the current user to logged-in user', () => {
      const msg = makeMessage(1, 'user2', 'user1');
      // Patch receiverId
      (msg as any).getReceiverId = () => 'user1';
      const user = makeUser('user2');
      expect(isMessageForCurrentConversation(msg, user, null, 'user1')).toBe(true);
    });

    it('should return true for a message from logged-in user to current user', () => {
      const msg = makeMessage(1, 'user1', 'user2');
      (msg as any).getReceiverId = () => 'user2';
      const user = makeUser('user2');
      expect(isMessageForCurrentConversation(msg, user, null, 'user1')).toBe(true);
    });

    it('should return false for a message not involving the current conversation', () => {
      const msg = makeMessage(1, 'user3', 'user4');
      (msg as any).getReceiverId = () => 'user4';
      const user = makeUser('user2');
      expect(isMessageForCurrentConversation(msg, user, null, 'user1')).toBe(false);
    });

    it('should return true for a group message matching the current group', () => {
      const groupMsg = new CometChat.TextMessage('group1', 'Hello', CometChat.RECEIVER_TYPE.GROUP);
      (groupMsg as any).getReceiverId = () => 'group1';
      const group = makeGroup('group1');
      expect(isMessageForCurrentConversation(
        groupMsg as unknown as CometChat.BaseMessage, null, group, 'user1'
      )).toBe(true);
    });

    it('should return false for a group message not matching the current group', () => {
      const groupMsg = new CometChat.TextMessage('group2', 'Hello', CometChat.RECEIVER_TYPE.GROUP);
      (groupMsg as any).getReceiverId = () => 'group2';
      const group = makeGroup('group1');
      expect(isMessageForCurrentConversation(
        groupMsg as unknown as CometChat.BaseMessage, null, group, 'user1'
      )).toBe(false);
    });

    it('should return false when both user and group are null', () => {
      const msg = makeMessage(1, 'user2', 'user1');
      (msg as any).getReceiverId = () => 'user1';
      expect(isMessageForCurrentConversation(msg, null, null, 'user1')).toBe(false);
    });
  });
});
