/**
 * cometchat-message-list.options-utils Tests
 *
 * Covers: canEditMessage, canDeleteMessage, canReplyToMessage,
 *         canCopyMessage, canTranslateMessage, canReactToMessage,
 *         getMessagePreview, isMediaMessage.
 *
 * @module components/cometchat-message-list/options-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  canEditMessage,
  canDeleteMessage,
  canReplyToMessage,
  canCopyMessage,
  canTranslateMessage,
  canReactToMessage,
  getMessagePreview,
  isMediaMessage,
  MESSAGE_OPTION_IDS,
} from './cometchat-message-list.options-utils';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeTextMessage(senderUid: string, opts: { deletedAt?: number } = {}): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello world', CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.text;
  (msg as any).getCategory = () => 'message';
  if (opts.deletedAt) {
    (msg as any).deletedAt = opts.deletedAt;
    (msg as any).getDeletedAt = () => opts.deletedAt;
  }
  return msg as unknown as CometChat.BaseMessage;
}

function makeMediaMessage(type: string, senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.MediaMessage('r1', {} as File, type, CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getType = () => type;
  (msg as any).getCategory = () => 'message';
  return msg as unknown as CometChat.BaseMessage;
}

function makeActionMessage(): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'joined', CometChat.RECEIVER_TYPE.USER);
  (msg as any).getType = () => 'action';
  (msg as any).getCategory = () => 'action';
  return msg as unknown as CometChat.BaseMessage;
}

describe('cometchat-message-list.options-utils', () => {

  // ==================== MESSAGE_OPTION_IDS ====================

  describe('MESSAGE_OPTION_IDS', () => {
    it('should export expected option ID constants', () => {
      expect(MESSAGE_OPTION_IDS.EDIT).toBe('edit');
      expect(MESSAGE_OPTION_IDS.DELETE).toBe('delete');
      expect(MESSAGE_OPTION_IDS.REPLY).toBe('reply');
      expect(MESSAGE_OPTION_IDS.COPY).toBe('copy');
    });
  });

  // ==================== canEditMessage ====================

  describe('canEditMessage', () => {
    it('should return true for own text message', () => {
      const msg = makeTextMessage('user1');
      expect(canEditMessage(msg, 'user1')).toBe(true);
    });

    it('should return false for other user text message', () => {
      const msg = makeTextMessage('user2');
      expect(canEditMessage(msg, 'user1')).toBe(false);
    });

    it('should return false for deleted message', () => {
      const msg = makeTextMessage('user1', { deletedAt: Date.now() });
      expect(canEditMessage(msg, 'user1')).toBe(false);
    });

    it('should return false for non-text message', () => {
      const msg = makeMediaMessage('image', 'user1');
      expect(canEditMessage(msg, 'user1')).toBe(false);
    });

    it('should return false when message has no sender', () => {
      const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
      (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.text;
      expect(canEditMessage(msg as unknown as CometChat.BaseMessage, 'user1')).toBe(false);
    });
  });

  // ==================== canDeleteMessage ====================

  describe('canDeleteMessage', () => {
    it('should return true for own message', () => {
      const msg = makeTextMessage('user1');
      expect(canDeleteMessage(msg, 'user1')).toBe(true);
    });

    it('should return false for other user message', () => {
      const msg = makeTextMessage('user2');
      expect(canDeleteMessage(msg, 'user1')).toBe(false);
    });

    it('should return false for deleted message', () => {
      const msg = makeTextMessage('user1', { deletedAt: Date.now() });
      expect(canDeleteMessage(msg, 'user1')).toBe(false);
    });

    it('should return true for own media message', () => {
      const msg = makeMediaMessage('image', 'user1');
      expect(canDeleteMessage(msg, 'user1')).toBe(true);
    });
  });

  // ==================== canReplyToMessage ====================

  describe('canReplyToMessage', () => {
    it('should return true for regular text message', () => {
      const msg = makeTextMessage('user1');
      expect(canReplyToMessage(msg)).toBe(true);
    });

    it('should return false for deleted message', () => {
      const msg = makeTextMessage('user1', { deletedAt: Date.now() });
      expect(canReplyToMessage(msg)).toBe(false);
    });

    it('should return false for action message', () => {
      const msg = makeActionMessage();
      expect(canReplyToMessage(msg)).toBe(false);
    });

    it('should return true for media message', () => {
      const msg = makeMediaMessage('image', 'user1');
      expect(canReplyToMessage(msg)).toBe(true);
    });
  });

  // ==================== canCopyMessage ====================

  describe('canCopyMessage', () => {
    it('should return true for text message', () => {
      const msg = makeTextMessage('user1');
      expect(canCopyMessage(msg)).toBe(true);
    });

    it('should return false for deleted message', () => {
      const msg = makeTextMessage('user1', { deletedAt: Date.now() });
      expect(canCopyMessage(msg)).toBe(false);
    });

    it('should return false for image message', () => {
      const msg = makeMediaMessage('image', 'user1');
      expect(canCopyMessage(msg)).toBe(false);
    });

    it('should return false for video message', () => {
      const msg = makeMediaMessage('video', 'user1');
      expect(canCopyMessage(msg)).toBe(false);
    });
  });

  // ==================== canTranslateMessage ====================

  describe('canTranslateMessage', () => {
    it('should return true for text message', () => {
      const msg = makeTextMessage('user1');
      expect(canTranslateMessage(msg)).toBe(true);
    });

    it('should return false for deleted message', () => {
      const msg = makeTextMessage('user1', { deletedAt: Date.now() });
      expect(canTranslateMessage(msg)).toBe(false);
    });

    it('should return false for image message', () => {
      const msg = makeMediaMessage('image', 'user1');
      expect(canTranslateMessage(msg)).toBe(false);
    });
  });

  // ==================== canReactToMessage ====================

  describe('canReactToMessage', () => {
    it('should return true for regular message', () => {
      const msg = makeTextMessage('user1');
      expect(canReactToMessage(msg)).toBe(true);
    });

    it('should return false for deleted message', () => {
      const msg = makeTextMessage('user1', { deletedAt: Date.now() });
      expect(canReactToMessage(msg)).toBe(false);
    });

    it('should return false for action message', () => {
      const msg = makeActionMessage();
      expect(canReactToMessage(msg)).toBe(false);
    });

    it('should return true for media message', () => {
      const msg = makeMediaMessage('image', 'user1');
      expect(canReactToMessage(msg)).toBe(true);
    });
  });

  // ==================== getMessagePreview ====================

  describe('getMessagePreview', () => {
    it('should return deleted message text for deleted message', () => {
      const msg = makeTextMessage('user1', { deletedAt: Date.now() });
      const preview = getMessagePreview(msg);
      expect(typeof preview).toBe('string');
      expect(preview.length).toBeGreaterThan(0);
    });

    it('should return text content for text message', () => {
      const msg = new CometChat.TextMessage('r1', 'Hello world', CometChat.RECEIVER_TYPE.USER);
      (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.text;
      (msg as any).getText = () => 'Hello world';
      const preview = getMessagePreview(msg as unknown as CometChat.BaseMessage);
      expect(preview).toBe('Hello world');
    });

    it('should truncate long text messages', () => {
      const longText = 'A'.repeat(100);
      const msg = new CometChat.TextMessage('r1', longText, CometChat.RECEIVER_TYPE.USER);
      (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.text;
      (msg as any).getText = () => longText;
      const preview = getMessagePreview(msg as unknown as CometChat.BaseMessage, 50);
      expect(preview.length).toBeLessThanOrEqual(52); // 50 + ellipsis
      expect(preview.endsWith('…')).toBe(true);
    });

    it('should return localized string for image message', () => {
      const msg = makeMediaMessage('image', 'user1');
      const preview = getMessagePreview(msg);
      expect(typeof preview).toBe('string');
      expect(preview.length).toBeGreaterThan(0);
    });

    it('should return localized string for video message', () => {
      const msg = makeMediaMessage('video', 'user1');
      const preview = getMessagePreview(msg);
      expect(typeof preview).toBe('string');
    });

    it('should return localized string for audio message', () => {
      const msg = makeMediaMessage('audio', 'user1');
      const preview = getMessagePreview(msg);
      expect(typeof preview).toBe('string');
    });

    it('should return localized string for file message', () => {
      const msg = makeMediaMessage('file', 'user1');
      const preview = getMessagePreview(msg);
      expect(typeof preview).toBe('string');
    });

    it('should return the type for unknown message type', () => {
      const msg = makeMediaMessage('custom_type', 'user1');
      const preview = getMessagePreview(msg);
      expect(preview).toBe('custom_type');
    });
  });

  // ==================== isMediaMessage ====================

  describe('isMediaMessage', () => {
    it('should return true for image message', () => {
      expect(isMediaMessage(makeMediaMessage('image', 'u1'))).toBe(true);
    });

    it('should return true for video message', () => {
      expect(isMediaMessage(makeMediaMessage('video', 'u1'))).toBe(true);
    });

    it('should return true for audio message', () => {
      expect(isMediaMessage(makeMediaMessage('audio', 'u1'))).toBe(true);
    });

    it('should return true for file message', () => {
      expect(isMediaMessage(makeMediaMessage('file', 'u1'))).toBe(true);
    });

    it('should return false for text message', () => {
      expect(isMediaMessage(makeTextMessage('u1'))).toBe(false);
    });

    it('should return false for action message', () => {
      expect(isMediaMessage(makeActionMessage())).toBe(false);
    });
  });
});
