/**
 * cometchat-conversation-item.utils Tests
 *
 * Covers: getConversationAvatarImage, getConversationAvatarName,
 *         getConversationUserStatus, getConversationGroupType,
 *         getReceiptStatus, isURL, hasMarkdownLink,
 *         getConversationAccessibleLabel.
 *
 * @module components/cometchat-conversation-item/utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getConversationAvatarImage,
  getConversationAvatarName,
  getConversationUserStatus,
  getConversationGroupType,
  getReceiptStatus,
  isURL,
  hasMarkdownLink,
  getConversationAccessibleLabel,
} from './cometchat-conversation-item.utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, name: string, avatar = ''): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  if (avatar) u.setAvatar(avatar);
  u.setStatus('online' as any);
  return u;
}

function makeGroup(guid: string, name: string, type = CometChat.GROUP_TYPE.PUBLIC, icon = ''): CometChat.Group {
  const g = new CometChat.Group(guid, name, type, '');
  if (icon) (g as any).icon = icon;
  return g;
}

function makeTextMessage(senderUid: string, opts: {
  sentAt?: number; deliveredAt?: number; readAt?: number; deletedAt?: number;
} = {}): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  const sender = makeUser(senderUid, `User ${senderUid}`);
  msg.setSender(sender);
  (msg as any).getCategory = () => 'message';
  if (opts.sentAt) { (msg as any).sentAt = opts.sentAt; (msg as any).getSentAt = () => opts.sentAt; }
  if (opts.deliveredAt) { (msg as any).deliveredAt = opts.deliveredAt; (msg as any).getDeliveredAt = () => opts.deliveredAt; }
  if (opts.readAt) { (msg as any).readAt = opts.readAt; (msg as any).getReadAt = () => opts.readAt; }
  if (opts.deletedAt) { (msg as any).deletedAt = opts.deletedAt; (msg as any).getDeletedAt = () => opts.deletedAt; }
  return msg as unknown as CometChat.BaseMessage;
}

describe('cometchat-conversation-item.utils', () => {

  // ==================== getConversationAvatarImage ====================

  describe('getConversationAvatarImage', () => {
    it('should return empty string for null', () => {
      expect(getConversationAvatarImage(null)).toBe('');
    });

    it('should return user avatar URL', () => {
      const user = makeUser('u1', 'Alice', 'https://avatar.url/alice.jpg');
      expect(getConversationAvatarImage(user)).toBe('https://avatar.url/alice.jpg');
    });

    it('should return empty string when user has no avatar', () => {
      const user = makeUser('u1', 'Alice');
      expect(getConversationAvatarImage(user)).toBe('');
    });

    it('should return group icon URL', () => {
      const group = makeGroup('g1', 'Team', CometChat.GROUP_TYPE.PUBLIC, 'https://icon.url/team.jpg');
      (group as any).getIcon = () => 'https://icon.url/team.jpg';
      expect(getConversationAvatarImage(group)).toBe('https://icon.url/team.jpg');
    });

    it('should return empty string when group has no icon', () => {
      const group = makeGroup('g1', 'Team');
      (group as any).getIcon = () => '';
      expect(getConversationAvatarImage(group)).toBe('');
    });
  });

  // ==================== getConversationAvatarName ====================

  describe('getConversationAvatarName', () => {
    it('should return empty string for null', () => {
      expect(getConversationAvatarName(null)).toBe('');
    });

    it('should return user name', () => {
      const user = makeUser('u1', 'Alice');
      expect(getConversationAvatarName(user)).toBe('Alice');
    });

    it('should return group name', () => {
      const group = makeGroup('g1', 'Engineering Team');
      expect(getConversationAvatarName(group)).toBe('Engineering Team');
    });
  });

  // ==================== getConversationUserStatus ====================

  describe('getConversationUserStatus', () => {
    it('should return empty string for null', () => {
      expect(getConversationUserStatus(null)).toBe('');
    });

    it('should return user status', () => {
      const user = makeUser('u1', 'Alice');
      user.setStatus('online' as any);
      expect(getConversationUserStatus(user)).toBe('online');
    });

    it('should return empty string for group', () => {
      const group = makeGroup('g1', 'Team');
      expect(getConversationUserStatus(group)).toBe('');
    });

    it('should return "offline" when user has no status', () => {
      const user = makeUser('u1', 'Alice');
      (user as any).getStatus = () => '';
      expect(getConversationUserStatus(user)).toBe('offline');
    });
  });

  // ==================== getConversationGroupType ====================

  describe('getConversationGroupType', () => {
    it('should return empty string for null', () => {
      expect(getConversationGroupType(null)).toBe('');
    });

    it('should return group type', () => {
      const group = makeGroup('g1', 'Team', CometChat.GROUP_TYPE.PUBLIC);
      expect(getConversationGroupType(group)).toBe(CometChat.GROUP_TYPE.PUBLIC);
    });

    it('should return private group type', () => {
      const group = makeGroup('g1', 'Team', CometChat.GROUP_TYPE.PRIVATE);
      expect(getConversationGroupType(group)).toBe(CometChat.GROUP_TYPE.PRIVATE);
    });

    it('should return empty string for user', () => {
      const user = makeUser('u1', 'Alice');
      expect(getConversationGroupType(user)).toBe('');
    });
  });

  // ==================== getReceiptStatus ====================

  describe('getReceiptStatus', () => {
    it('should return null when no message', () => {
      expect(getReceiptStatus(undefined, true)).toBeNull();
    });

    it('should return null when message is not by me', () => {
      const msg = makeTextMessage('other', { sentAt: Date.now() });
      expect(getReceiptStatus(msg, false)).toBeNull();
    });

    it('should return null for deleted message', () => {
      const msg = makeTextMessage('me', { sentAt: Date.now(), deletedAt: Date.now() });
      expect(getReceiptStatus(msg, true)).toBeNull();
    });

    it('should return "read" when message has readAt', () => {
      const msg = makeTextMessage('me', { sentAt: Date.now(), deliveredAt: Date.now(), readAt: Date.now() });
      expect(getReceiptStatus(msg, true)).toBe('read');
    });

    it('should return "delivered" when message has deliveredAt but no readAt', () => {
      const msg = makeTextMessage('me', { sentAt: Date.now(), deliveredAt: Date.now() });
      expect(getReceiptStatus(msg, true)).toBe('delivered');
    });

    it('should return "sent" when message has sentAt but no deliveredAt', () => {
      const msg = makeTextMessage('me', { sentAt: Date.now() });
      expect(getReceiptStatus(msg, true)).toBe('sent');
    });

    it('should return "wait" when message has no timestamps', () => {
      const msg = makeTextMessage('me', {});
      expect(getReceiptStatus(msg, true)).toBe('wait');
    });

    it('should return null for action category messages', () => {
      const msg = makeTextMessage('me', { sentAt: Date.now() });
      (msg as any).getCategory = () => 'action';
      expect(getReceiptStatus(msg, true)).toBeNull();
    });
  });

  // ==================== isURL ====================

  describe('isURL', () => {
    it('should return true for http URL', () => {
      expect(isURL('http://example.com')).toBe(true);
    });

    it('should return true for https URL', () => {
      expect(isURL('https://example.com/path')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isURL('Hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isURL('')).toBe(false);
    });
  });

  // ==================== hasMarkdownLink ====================

  describe('hasMarkdownLink', () => {
    it('should return true for markdown link', () => {
      expect(hasMarkdownLink('[Click here](https://example.com)')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(hasMarkdownLink('Hello world')).toBe(false);
    });
  });

  // ==================== getConversationAccessibleLabel ====================

  describe('getConversationAccessibleLabel', () => {
    it('should include conversation name', () => {
      const user = makeUser('u1', 'Alice');
      const label = getConversationAccessibleLabel(user, 'Hello', 0);
      expect(label).toContain('Alice');
    });

    it('should include subtitle text', () => {
      const user = makeUser('u1', 'Alice');
      const label = getConversationAccessibleLabel(user, 'Hello world', 0);
      expect(label).toContain('Hello world');
    });

    it('should strip HTML tags from subtitle', () => {
      const user = makeUser('u1', 'Alice');
      const label = getConversationAccessibleLabel(user, '<b>Hello</b>', 0);
      expect(label).toContain('Hello');
      expect(label).not.toContain('<b>');
    });

    it('should include unread count when > 0', () => {
      const user = makeUser('u1', 'Alice');
      const label = getConversationAccessibleLabel(user, 'Hello', 3);
      expect(label).toContain('3');
    });

    it('should not include unread count when 0', () => {
      const user = makeUser('u1', 'Alice');
      const label = getConversationAccessibleLabel(user, 'Hello', 0);
      expect(label).not.toContain('0');
    });

    it('should handle null conversationWith', () => {
      const label = getConversationAccessibleLabel(null, 'Hello', 0);
      expect(typeof label).toBe('string');
    });
  });
});
