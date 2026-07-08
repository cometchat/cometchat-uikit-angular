/**
 * cometchat-message-list.option-click Tests
 *
 * Covers: handleOptionClickImpl — all option IDs dispatch to the correct
 *         component method, unknown IDs are ignored gracefully.
 *
 * @module components/cometchat-message-list/option-click
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { handleOptionClickImpl } from './cometchat-message-list.option-click';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(id = 1): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  return msg as unknown as CometChat.BaseMessage;
}

function makeSelf() {
  return {
    copyMessageToClipboard: vi.fn(),
    showDeleteConfirmation: vi.fn(),
    translateMessage: vi.fn(),
    showFlagConfirmation: vi.fn(),
    handleMessagePrivately: vi.fn(),
    onReplyMessage: vi.fn(),
    onEditMessage: vi.fn(),
    onMessageInfo: vi.fn(),
    showEmojiKeyboardForMessage: vi.fn(),
    threadRepliesClick: { emit: vi.fn() },
    markMessageAsUnread: vi.fn(),
  };
}

function makeOption(id: string) {
  return { id, title: id, iconURL: '' };
}

describe('cometchat-message-list.option-click', () => {

  let self: ReturnType<typeof makeSelf>;
  let msg: CometChat.BaseMessage;

  beforeEach(() => {
    self = makeSelf();
    msg = makeMessage(42);
  });

  // ==================== copyMessage ====================

  describe('copyMessage option', () => {
    it('should call copyMessageToClipboard with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.copyMessage), msg);
      expect(self.copyMessageToClipboard).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== deleteMessage ====================

  describe('deleteMessage option', () => {
    it('should call showDeleteConfirmation with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.deleteMessage), msg);
      expect(self.showDeleteConfirmation).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== translateMessage ====================

  describe('translateMessage option', () => {
    it('should call translateMessage with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.translateMessage), msg);
      expect(self.translateMessage).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== flagMessage ====================

  describe('flagMessage option', () => {
    it('should call showFlagConfirmation with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.flagMessage), msg);
      expect(self.showFlagConfirmation).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== sendMessagePrivately ====================

  describe('sendMessagePrivately option', () => {
    it('should call handleMessagePrivately with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.sendMessagePrivately), msg);
      expect(self.handleMessagePrivately).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== replyMessage ====================

  describe('replyMessage option', () => {
    it('should call onReplyMessage with the message ID', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.replyMessage), msg);
      expect(self.onReplyMessage).toHaveBeenCalledWith(42);
    });
  });

  // ==================== editMessage ====================

  describe('editMessage option', () => {
    it('should call onEditMessage with the message ID', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.editMessage), msg);
      expect(self.onEditMessage).toHaveBeenCalledWith(42);
    });
  });

  // ==================== info / messageInformation ====================

  describe('info option', () => {
    it('should call onMessageInfo with the message ID for "info" id', () => {
      handleOptionClickImpl(self, makeOption('info'), msg);
      expect(self.onMessageInfo).toHaveBeenCalledWith(42);
    });

    it('should call onMessageInfo with the message ID for messageInformation id', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.messageInformation), msg);
      expect(self.onMessageInfo).toHaveBeenCalledWith(42);
    });
  });

  // ==================== reactToMessage ====================

  describe('reactToMessage option', () => {
    it('should call showEmojiKeyboardForMessage with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.reactToMessage), msg);
      expect(self.showEmojiKeyboardForMessage).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== replyInThread ====================

  describe('replyInThread option', () => {
    it('should emit threadRepliesClick with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.replyInThread), msg);
      expect(self.threadRepliesClick.emit).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== markAsUnread ====================

  describe('markAsUnread option', () => {
    it('should call markMessageAsUnread with the message', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.markAsUnread), msg);
      expect(self.markMessageAsUnread).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== unknown option ====================

  describe('unknown option', () => {
    it('should not throw for an unknown option ID', () => {
      expect(() => handleOptionClickImpl(self, makeOption('unknown-option-xyz'), msg)).not.toThrow();
    });

    it('should not call any handler for an unknown option ID', () => {
      handleOptionClickImpl(self, makeOption('unknown-option-xyz'), msg);
      expect(self.copyMessageToClipboard).not.toHaveBeenCalled();
      expect(self.showDeleteConfirmation).not.toHaveBeenCalled();
      expect(self.translateMessage).not.toHaveBeenCalled();
      expect(self.showFlagConfirmation).not.toHaveBeenCalled();
      expect(self.handleMessagePrivately).not.toHaveBeenCalled();
      expect(self.onReplyMessage).not.toHaveBeenCalled();
      expect(self.onEditMessage).not.toHaveBeenCalled();
      expect(self.onMessageInfo).not.toHaveBeenCalled();
      expect(self.showEmojiKeyboardForMessage).not.toHaveBeenCalled();
      expect(self.threadRepliesClick.emit).not.toHaveBeenCalled();
      expect(self.markMessageAsUnread).not.toHaveBeenCalled();
    });
  });

  // ==================== mutual exclusivity ====================

  describe('mutual exclusivity', () => {
    it('should only call the matching handler, not others', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.copyMessage), msg);
      expect(self.copyMessageToClipboard).toHaveBeenCalledTimes(1);
      expect(self.showDeleteConfirmation).not.toHaveBeenCalled();
      expect(self.translateMessage).not.toHaveBeenCalled();
    });

    it('should only call delete handler for delete option', () => {
      handleOptionClickImpl(self, makeOption(CometChatUIKitConstants.MessageOption.deleteMessage), msg);
      expect(self.showDeleteConfirmation).toHaveBeenCalledTimes(1);
      expect(self.copyMessageToClipboard).not.toHaveBeenCalled();
    });
  });
});
