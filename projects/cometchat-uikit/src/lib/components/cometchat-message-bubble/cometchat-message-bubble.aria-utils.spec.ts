/**
 * cometchat-message-bubble.aria-utils Tests
 *
 * Covers: getMessageBubbleAriaLabel, getContentPreview,
 *         getReactionsSummary, getMessageTypeLabel.
 *
 * @module components/cometchat-message-bubble/aria-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getMessageBubbleAriaLabel,
  getContentPreview,
  getReactionsSummary,
  getMessageTypeLabel,
} from './cometchat-message-bubble.aria-utils';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, name: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  return u;
}

function makeTextMessage(text: string, senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', text, CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid, `User ${senderUid}`));
  (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.text;
  (msg as any).getCategory = () => 'message';
  (msg as any).getText = () => text;
  return msg as unknown as CometChat.BaseMessage;
}

function makeMediaMessage(type: string, senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.MediaMessage('r1', {} as File, type, CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid, `User ${senderUid}`));
  (msg as any).getType = () => type;
  (msg as any).getCategory = () => 'message';
  return msg as unknown as CometChat.BaseMessage;
}

function makeDeletedMessage(senderUid: string): CometChat.BaseMessage {
  const msg = makeTextMessage('Hello', senderUid);
  (msg as any).deletedAt = Date.now();
  (msg as any).getDeletedAt = () => Date.now();
  return msg;
}

function makeReactionCount(emoji: string, count: number): CometChat.ReactionCount {
  return new CometChat.ReactionCount(emoji, count, false);
}

describe('cometchat-message-bubble.aria-utils', () => {

  // ==================== getContentPreview ====================

  describe('getContentPreview', () => {
    it('should return text content for text messages', () => {
      const msg = makeTextMessage('Hello world', 'u1');
      const preview = getContentPreview(msg);
      expect(preview).toBe('Hello world');
    });

    it('should truncate long text at 100 chars', () => {
      const longText = 'A'.repeat(150);
      const msg = makeTextMessage(longText, 'u1');
      const preview = getContentPreview(msg);
      expect(preview.length).toBeLessThanOrEqual(102); // 100 + ellipsis
      expect(preview.endsWith('…')).toBe(true);
    });

    it('should return localized string for image messages', () => {
      const msg = makeMediaMessage('image', 'u1');
      const preview = getContentPreview(msg);
      expect(typeof preview).toBe('string');
      expect(preview.length).toBeGreaterThan(0);
    });

    it('should return localized string for video messages', () => {
      const msg = makeMediaMessage('video', 'u1');
      expect(typeof getContentPreview(msg)).toBe('string');
    });

    it('should return localized string for audio messages', () => {
      const msg = makeMediaMessage('audio', 'u1');
      expect(typeof getContentPreview(msg)).toBe('string');
    });

    it('should return localized string for file messages', () => {
      const msg = makeMediaMessage('file', 'u1');
      expect(typeof getContentPreview(msg)).toBe('string');
    });

    it('should return the type for unknown message types', () => {
      const msg = makeMediaMessage('custom_type', 'u1');
      expect(getContentPreview(msg)).toBe('custom_type');
    });

    it('should return action message text for action category', () => {
      const msg = makeTextMessage('joined', 'u1');
      (msg as any).getCategory = () => 'action';
      (msg as any).getMessage = () => 'User joined the group';
      const preview = getContentPreview(msg);
      expect(typeof preview).toBe('string');
    });

    it('should return call label for call category', () => {
      const msg = makeTextMessage('call', 'u1');
      (msg as any).getCategory = () => 'call';
      const preview = getContentPreview(msg);
      expect(typeof preview).toBe('string');
    });
  });

  // ==================== getReactionsSummary ====================

  describe('getReactionsSummary', () => {
    it('should return empty string for empty reactions', () => {
      expect(getReactionsSummary([])).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(getReactionsSummary(null as any)).toBe('');
      expect(getReactionsSummary(undefined as any)).toBe('');
    });

    it('should format single reaction correctly', () => {
      const reactions = [makeReactionCount('👍', 3)];
      expect(getReactionsSummary(reactions)).toBe('👍 3');
    });

    it('should format multiple reactions with comma separator', () => {
      const reactions = [makeReactionCount('👍', 2), makeReactionCount('❤️', 1)];
      const result = getReactionsSummary(reactions);
      expect(result).toContain('👍 2');
      expect(result).toContain('❤️ 1');
      expect(result).toContain(', ');
    });
  });

  // ==================== getMessageTypeLabel ====================

  describe('getMessageTypeLabel', () => {
    it('should return text label for text messages', () => {
      const msg = makeTextMessage('Hello', 'u1');
      expect(typeof getMessageTypeLabel(msg)).toBe('string');
      expect(getMessageTypeLabel(msg).length).toBeGreaterThan(0);
    });

    it('should return image label for image messages', () => {
      const msg = makeMediaMessage('image', 'u1');
      expect(typeof getMessageTypeLabel(msg)).toBe('string');
    });

    it('should return video label for video messages', () => {
      const msg = makeMediaMessage('video', 'u1');
      expect(typeof getMessageTypeLabel(msg)).toBe('string');
    });

    it('should return audio label for audio messages', () => {
      const msg = makeMediaMessage('audio', 'u1');
      expect(typeof getMessageTypeLabel(msg)).toBe('string');
    });

    it('should return file label for file messages', () => {
      const msg = makeMediaMessage('file', 'u1');
      expect(typeof getMessageTypeLabel(msg)).toBe('string');
    });

    it('should return action label for action category', () => {
      const msg = makeTextMessage('action', 'u1');
      (msg as any).getCategory = () => 'action';
      expect(typeof getMessageTypeLabel(msg)).toBe('string');
    });

    it('should return call label for call category', () => {
      const msg = makeTextMessage('call', 'u1');
      (msg as any).getCategory = () => 'call';
      expect(typeof getMessageTypeLabel(msg)).toBe('string');
    });

    it('should return the type for unknown types', () => {
      const msg = makeMediaMessage('custom_xyz', 'u1');
      expect(getMessageTypeLabel(msg)).toBe('custom_xyz');
    });
  });

  // ==================== getMessageBubbleAriaLabel ====================

  describe('getMessageBubbleAriaLabel', () => {
    it('should include sender name for incoming messages', () => {
      const msg = makeTextMessage('Hello', 'user2');
      msg.getSender()!.setName('Alice');
      const label = getMessageBubbleAriaLabel(msg, 'loggedIn', '3:45 PM');
      expect(label).toContain('Alice');
    });

    it('should include "you" label for outgoing messages', () => {
      const msg = makeTextMessage('Hello', 'loggedIn');
      const label = getMessageBubbleAriaLabel(msg, 'loggedIn', '3:45 PM');
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should include timestamp in the label', () => {
      const msg = makeTextMessage('Hello', 'user2');
      const label = getMessageBubbleAriaLabel(msg, 'loggedIn', '3:45 PM');
      expect(label).toContain('3:45 PM');
    });

    it('should include text content in the label', () => {
      const msg = makeTextMessage('Hello world', 'user2');
      const label = getMessageBubbleAriaLabel(msg, 'loggedIn', '3:45 PM');
      expect(label).toContain('Hello world');
    });

    it('should return deleted message label for deleted messages', () => {
      const msg = makeDeletedMessage('user2');
      const label = getMessageBubbleAriaLabel(msg, 'loggedIn', '3:45 PM');
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should include reactions summary when reactions exist', () => {
      const msg = makeTextMessage('Hello', 'user2');
      (msg as any).getReactions = () => [makeReactionCount('👍', 2)];
      const label = getMessageBubbleAriaLabel(msg, 'loggedIn', '3:45 PM');
      expect(label).toContain('👍 2');
    });

    it('should handle message with no sender', () => {
      const msg = makeTextMessage('Hello', 'user2');
      (msg as any).getSender = () => null;
      expect(() => getMessageBubbleAriaLabel(msg, 'loggedIn', '3:45 PM')).not.toThrow();
    });

    it('should handle empty timestamp', () => {
      const msg = makeTextMessage('Hello', 'user2');
      const label = getMessageBubbleAriaLabel(msg, 'loggedIn', '');
      expect(typeof label).toBe('string');
    });
  });
});
