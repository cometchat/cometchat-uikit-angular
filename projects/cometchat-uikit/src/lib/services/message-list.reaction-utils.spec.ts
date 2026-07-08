/**
 * message-list.reaction-utils Tests
 *
 * Covers: applyReactionEvent, isReactionForCurrentConversation,
 *         isReceiptForCurrentConversation, applyReadReceipt, applyDeliveryReceipt.
 *
 * @module services/message-list.reaction-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  applyReactionEvent,
  isReactionForCurrentConversation,
  isReceiptForCurrentConversation,
  applyReadReceipt,
  applyDeliveryReceipt,
} from './message-list.reaction-utils';

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

function makeReactionCount(emoji: string, count: number, reactedByMe = false): CometChat.ReactionCount {
  return new CometChat.ReactionCount(emoji, count, reactedByMe);
}

function makeTextMessage(id: number, senderId: string, receiverId: string): CometChat.TextMessage {
  const msg = new CometChat.TextMessage(receiverId, 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  const sender = makeUser(senderId);
  msg.setSender(sender);
  return msg;
}

function makeReactionEvent(emoji: string, receiverId: string, receiverType: string): CometChat.ReactionEvent {
  const event = new CometChat.ReactionEvent();
  (event as any).reaction = emoji;
  (event as any).receiverId = receiverId;
  (event as any).receiverType = receiverType;
  // Patch getters
  (event as any).getReceiverId = () => receiverId;
  (event as any).getReceiverType = () => receiverType;
  (event as any).getReaction = () => emoji;
  return event;
}

function makeReceipt(senderId: string, receiverId: string, receiverType: string, messageId: string): CometChat.MessageReceipt {
  const receipt = new CometChat.MessageReceipt();
  const sender = makeUser(senderId);
  const receiver = makeUser(receiverId);
  (receipt as any).sender = sender;
  (receipt as any).receiver = receiver;
  (receipt as any).receiverType = receiverType;
  (receipt as any).messageId = messageId;
  (receipt as any).getSender = () => sender;
  (receipt as any).getReceiver = () => receiver;
  (receipt as any).getReceiverType = () => receiverType;
  (receipt as any).getMessageId = () => messageId;
  return receipt;
}

describe('message-list.reaction-utils', () => {

  // ==================== applyReactionEvent ====================

  describe('applyReactionEvent', () => {
    it('should add a new reaction when none exists', () => {
      const reactions: CometChat.ReactionCount[] = [];
      const user = makeUser('user1');
      const result = applyReactionEvent(reactions, '👍', 'added', user);
      expect(result.length).toBe(1);
      expect(result[0].getReaction()).toBe('👍');
      expect(result[0].getCount()).toBe(1);
    });

    it('should increment count when reaction already exists', () => {
      const reactions = [makeReactionCount('👍', 2)];
      const user = makeUser('user2');
      const result = applyReactionEvent(reactions, '👍', 'added', user);
      expect(result.length).toBe(1);
      expect(result[0].getCount()).toBe(3);
    });

    it('should add a second distinct reaction', () => {
      const reactions = [makeReactionCount('👍', 1)];
      const user = makeUser('user1');
      const result = applyReactionEvent(reactions, '❤️', 'added', user);
      expect(result.length).toBe(2);
      const heart = result.find(r => r.getReaction() === '❤️');
      expect(heart?.getCount()).toBe(1);
    });

    it('should decrement count when reaction is removed', () => {
      const reactions = [makeReactionCount('👍', 3)];
      const user = makeUser('user1');
      const result = applyReactionEvent(reactions, '👍', 'removed', user);
      expect(result.length).toBe(1);
      expect(result[0].getCount()).toBe(2);
    });

    it('should remove reaction entirely when count reaches zero', () => {
      const reactions = [makeReactionCount('👍', 1)];
      const user = makeUser('user1');
      const result = applyReactionEvent(reactions, '👍', 'removed', user);
      expect(result.length).toBe(0);
    });

    it('should return unchanged array when removing non-existent reaction', () => {
      const reactions = [makeReactionCount('👍', 2)];
      const user = makeUser('user1');
      const result = applyReactionEvent(reactions, '❤️', 'removed', user);
      expect(result.length).toBe(1);
      expect(result[0].getReaction()).toBe('👍');
    });

    it('should not mutate the original reactions array', () => {
      const reactions = [makeReactionCount('👍', 2)];
      const user = makeUser('user1');
      applyReactionEvent(reactions, '👍', 'added', user);
      expect(reactions[0].getCount()).toBe(2); // unchanged
    });

    it('should handle empty reactions array for removal gracefully', () => {
      const reactions: CometChat.ReactionCount[] = [];
      const user = makeUser('user1');
      const result = applyReactionEvent(reactions, '👍', 'removed', user);
      expect(result).toEqual([]);
    });

    it('should preserve other reactions when modifying one', () => {
      const reactions = [makeReactionCount('👍', 2), makeReactionCount('❤️', 5)];
      const user = makeUser('user1');
      const result = applyReactionEvent(reactions, '👍', 'added', user);
      const heart = result.find(r => r.getReaction() === '❤️');
      expect(heart?.getCount()).toBe(5);
    });
  });

  // ==================== isReactionForCurrentConversation ====================

  describe('isReactionForCurrentConversation', () => {
    it('should return true for user conversation when receiverId matches', () => {
      const event = makeReactionEvent('👍', 'user1', CometChat.RECEIVER_TYPE.USER);
      const user = makeUser('user1');
      expect(isReactionForCurrentConversation(event, user, null, 'loggedIn')).toBe(true);
    });

    it('should return true for user conversation when receiverId matches loggedInUid', () => {
      const event = makeReactionEvent('👍', 'loggedIn', CometChat.RECEIVER_TYPE.USER);
      const user = makeUser('user1');
      expect(isReactionForCurrentConversation(event, user, null, 'loggedIn')).toBe(true);
    });

    it('should return false for user conversation when receiverId does not match', () => {
      const event = makeReactionEvent('👍', 'other-user', CometChat.RECEIVER_TYPE.USER);
      const user = makeUser('user1');
      expect(isReactionForCurrentConversation(event, user, null, 'loggedIn')).toBe(false);
    });

    it('should return false for user conversation when receiverType is group', () => {
      const event = makeReactionEvent('👍', 'user1', CometChat.RECEIVER_TYPE.GROUP);
      const user = makeUser('user1');
      expect(isReactionForCurrentConversation(event, user, null, 'loggedIn')).toBe(false);
    });

    it('should return true for group conversation when receiverId matches guid', () => {
      const event = makeReactionEvent('👍', 'group1', CometChat.RECEIVER_TYPE.GROUP);
      const group = makeGroup('group1');
      expect(isReactionForCurrentConversation(event, null, group, 'loggedIn')).toBe(true);
    });

    it('should return false for group conversation when receiverId does not match', () => {
      const event = makeReactionEvent('👍', 'other-group', CometChat.RECEIVER_TYPE.GROUP);
      const group = makeGroup('group1');
      expect(isReactionForCurrentConversation(event, null, group, 'loggedIn')).toBe(false);
    });

    it('should return false when both user and group are null', () => {
      const event = makeReactionEvent('👍', 'user1', CometChat.RECEIVER_TYPE.USER);
      expect(isReactionForCurrentConversation(event, null, null, 'loggedIn')).toBe(false);
    });
  });

  // ==================== isReceiptForCurrentConversation ====================

  describe('isReceiptForCurrentConversation', () => {
    it('should return true for user conversation when sender matches', () => {
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      const user = makeUser('user1');
      expect(isReceiptForCurrentConversation(receipt, user, null)).toBe(true);
    });

    it('should return false for user conversation when sender does not match', () => {
      const receipt = makeReceipt('other-user', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      const user = makeUser('user1');
      expect(isReceiptForCurrentConversation(receipt, user, null)).toBe(false);
    });

    it('should return false for user conversation when receiverType is group', () => {
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.GROUP, '100');
      const user = makeUser('user1');
      expect(isReceiptForCurrentConversation(receipt, user, null)).toBe(false);
    });

    it('should return true for group conversation when receiverId matches guid', () => {
      const receipt = makeReceipt('user1', 'group1', CometChat.RECEIVER_TYPE.GROUP, '100');
      const group = makeGroup('group1');
      expect(isReceiptForCurrentConversation(receipt, null, group)).toBe(true);
    });

    it('should return false for group conversation when receiverId does not match', () => {
      const receipt = makeReceipt('user1', 'other-group', CometChat.RECEIVER_TYPE.GROUP, '100');
      const group = makeGroup('group1');
      expect(isReceiptForCurrentConversation(receipt, null, group)).toBe(false);
    });

    it('should return false when both user and group are null', () => {
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(isReceiptForCurrentConversation(receipt, null, null)).toBe(false);
    });
  });

  // ==================== applyReadReceipt ====================

  describe('applyReadReceipt', () => {
    it('should return true when message ID is within receipt range and not yet read', () => {
      const msg = makeTextMessage(50, 'user1', 'loggedIn');
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyReadReceipt(msg, receipt)).toBe(true);
    });

    it('should return false when message ID is greater than receipt message ID', () => {
      const msg = makeTextMessage(150, 'user1', 'loggedIn');
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyReadReceipt(msg, receipt)).toBe(false);
    });

    it('should return false when message is already marked as read', () => {
      const msg = makeTextMessage(50, 'user1', 'loggedIn');
      (msg as any).readAt = Date.now();
      (msg as any).getReadAt = () => Date.now();
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyReadReceipt(msg, receipt)).toBe(false);
    });

    it('should return true when message ID equals receipt message ID', () => {
      const msg = makeTextMessage(100, 'user1', 'loggedIn');
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyReadReceipt(msg, receipt)).toBe(true);
    });
  });

  // ==================== applyDeliveryReceipt ====================

  describe('applyDeliveryReceipt', () => {
    it('should return true when message ID is within receipt range and not yet delivered', () => {
      const msg = makeTextMessage(50, 'user1', 'loggedIn');
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyDeliveryReceipt(msg, receipt)).toBe(true);
    });

    it('should return false when message ID is greater than receipt message ID', () => {
      const msg = makeTextMessage(150, 'user1', 'loggedIn');
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyDeliveryReceipt(msg, receipt)).toBe(false);
    });

    it('should return false when message is already marked as delivered', () => {
      const msg = makeTextMessage(50, 'user1', 'loggedIn');
      (msg as any).deliveredAt = Date.now();
      (msg as any).getDeliveredAt = () => Date.now();
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyDeliveryReceipt(msg, receipt)).toBe(false);
    });

    it('should return true when message ID equals receipt message ID', () => {
      const msg = makeTextMessage(100, 'user1', 'loggedIn');
      const receipt = makeReceipt('user1', 'loggedIn', CometChat.RECEIVER_TYPE.USER, '100');
      expect(applyDeliveryReceipt(msg, receipt)).toBe(true);
    });
  });
});
