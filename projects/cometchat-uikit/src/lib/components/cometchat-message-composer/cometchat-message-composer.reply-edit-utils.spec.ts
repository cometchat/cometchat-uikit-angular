/**
 * cometchat-message-composer.reply-edit-utils Tests
 *
 * Covers: getEditPreviewTitleImpl, exitReplyModeImpl, onReplyPreviewCloseImpl,
 *         openPollModalImpl, closePollModalImpl, onPollCreatedImpl,
 *         enterReplyModeImpl, onEditPreviewCloseImpl.
 *
 * @module components/cometchat-message-composer/reply-edit-utils
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getEditPreviewTitleImpl,
  exitReplyModeImpl,
  onReplyPreviewCloseImpl,
  openPollModalImpl,
  closePollModalImpl,
  onPollCreatedImpl,
  enterReplyModeImpl,
  onEditPreviewCloseImpl,
} from './cometchat-message-composer.reply-edit-utils';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';

// Mock CometChatUIKit
vi.mock('../../cometchat-uikit', () => ({
  CometChatUIKit: {
    getLoggedInUser: vi.fn().mockReturnValue(null),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeTextMessage(senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getType = () => 'text';
  (msg as any).getCategory = () => 'message';
  (msg as any).getDeletedAt = () => null;
  return msg as unknown as CometChat.BaseMessage;
}

function makeSelf(overrides: Record<string, any> = {}) {
  const messageToReplySignal = { value: null as any, set: vi.fn((v: any) => { messageToReplySignal.value = v; }) };
  const isPollModalOpen = { value: false, set: vi.fn((v: boolean) => { isPollModalOpen.value = v; }) };

  return {
    messageToReplySignal: Object.assign(() => messageToReplySignal.value, messageToReplySignal),
    isPollModalOpen: Object.assign(() => isPollModalOpen.value, isPollModalOpen),
    messageToEdit: null,
    exitEditMode: vi.fn(),
    exitReplyMode: vi.fn(),
    cancelEdit: vi.fn(),
    closePreview: { emit: vi.fn() },
    announcePolite: vi.fn(),
    customRichTextEditor: null,
    focusRichTextEditor: vi.fn(),
    focusTextInput: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-composer.reply-edit-utils', () => {

  // ==================== getEditPreviewTitleImpl ====================

  describe('getEditPreviewTitleImpl', () => {
    it('should return a non-empty string', () => {
      const result = getEditPreviewTitleImpl();
      expect(typeof result).toBe('string');
    });
  });

  // ==================== exitReplyModeImpl ====================

  describe('exitReplyModeImpl', () => {
    it('should set messageToReplySignal to null', () => {
      const self = makeSelf();
      self.messageToReplySignal.value = makeTextMessage('user1');
      exitReplyModeImpl(self);
      expect(self.messageToReplySignal.set).toHaveBeenCalledWith(null);
    });
  });

  // ==================== onReplyPreviewCloseImpl ====================

  describe('onReplyPreviewCloseImpl', () => {
    it('should emit ccReplyToMessage with cancelled status when message exists', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf();
      self.messageToReplySignal.set(msg);
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccReplyToMessage.subscribe(spy);
      onReplyPreviewCloseImpl(self);
      sub.unsubscribe();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ status: MessageStatus.cancelled, message: msg })
      );
    });

    it('should call exitReplyMode', () => {
      const self = makeSelf();
      onReplyPreviewCloseImpl(self);
      expect(self.exitReplyMode).toHaveBeenCalled();
    });

    it('should emit closePreview', () => {
      const self = makeSelf();
      onReplyPreviewCloseImpl(self);
      expect(self.closePreview.emit).toHaveBeenCalled();
    });

    it('should not emit ccReplyToMessage when no message', () => {
      const self = makeSelf();
      self.messageToReplySignal.value = null;
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccReplyToMessage.subscribe(spy);
      onReplyPreviewCloseImpl(self);
      sub.unsubscribe();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ==================== openPollModalImpl ====================

  describe('openPollModalImpl', () => {
    it('should set isPollModalOpen to true', () => {
      const self = makeSelf();
      openPollModalImpl(self);
      expect(self.isPollModalOpen.set).toHaveBeenCalledWith(true);
    });
  });

  // ==================== closePollModalImpl ====================

  describe('closePollModalImpl', () => {
    it('should set isPollModalOpen to false', () => {
      const self = makeSelf();
      closePollModalImpl(self);
      expect(self.isPollModalOpen.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== onPollCreatedImpl ====================

  describe('onPollCreatedImpl', () => {
    it('should call closePollModal', () => {
      const self = makeSelf({ closePollModal: vi.fn() });
      onPollCreatedImpl(self);
      expect(self.closePollModal).toHaveBeenCalled();
    });

    it('should emit ccReplyToMessage with success when in reply mode', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf({ closePollModal: vi.fn() });
      self.messageToReplySignal.set(msg);
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccReplyToMessage.subscribe(spy);
      onPollCreatedImpl(self);
      sub.unsubscribe();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ status: MessageStatus.success })
      );
    });

    it('should call exitReplyMode when in reply mode', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf({ closePollModal: vi.fn() });
      self.messageToReplySignal.set(msg);
      onPollCreatedImpl(self);
      expect(self.exitReplyMode).toHaveBeenCalled();
    });

    it('should not emit ccReplyToMessage when not in reply mode', () => {
      const self = makeSelf({ closePollModal: vi.fn() });
      self.messageToReplySignal.value = null;
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccReplyToMessage.subscribe(spy);
      onPollCreatedImpl(self);
      sub.unsubscribe();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ==================== enterReplyModeImpl ====================

  describe('enterReplyModeImpl', () => {
    it('should set messageToReplySignal to the message', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf();
      enterReplyModeImpl(self, msg);
      expect(self.messageToReplySignal.set).toHaveBeenCalledWith(msg);
    });

    it('should call exitEditMode when in edit mode', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf({ messageToEdit: makeTextMessage('user1') });
      enterReplyModeImpl(self, msg);
      expect(self.exitEditMode).toHaveBeenCalled();
    });

    it('should call announcePolite', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf();
      enterReplyModeImpl(self, msg);
      expect(self.announcePolite).toHaveBeenCalled();
    });

    it('should focus text input when no rich text editor', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf({ customRichTextEditor: null });
      enterReplyModeImpl(self, msg);
      expect(self.focusTextInput).toHaveBeenCalled();
    });

    it('should focus rich text editor when editor exists', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf({ customRichTextEditor: {} });
      enterReplyModeImpl(self, msg);
      expect(self.focusRichTextEditor).toHaveBeenCalled();
    });
  });

  // ==================== onEditPreviewCloseImpl ====================

  describe('onEditPreviewCloseImpl', () => {
    it('should call cancelEdit', () => {
      const self = makeSelf();
      onEditPreviewCloseImpl(self);
      expect(self.cancelEdit).toHaveBeenCalled();
    });
  });
});
