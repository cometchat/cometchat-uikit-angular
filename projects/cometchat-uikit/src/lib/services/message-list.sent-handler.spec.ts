/**
 * message-list.sent-handler Tests
 *
 * Covers: handleSentMessageImpl, updateSentMessageByMuidImpl,
 *         updateSentMessageReplyCountImpl, handleEditedMessageImpl,
 *         flushPendingSentMessages, setupSentMessageListenerImpl,
 *         setupEditedMessageListenerImpl.
 *
 * @module services/message-list.sent-handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleSentMessageImpl,
  updateSentMessageByMuidImpl,
  updateSentMessageReplyCountImpl,
  handleEditedMessageImpl,
  flushPendingSentMessages,
  setupSentMessageListenerImpl,
  setupEditedMessageListenerImpl,
} from './message-list.sent-handler';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { MessageStatus } from '../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextMessage(id = 1, muid = `muid-${id}`): CometChat.TextMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getMuid = () => muid;
  (msg as any).getParentMessageId = () => null;
  return msg;
}

function makeCtx(overrides: Record<string, any> = {}) {
  const messageMuidMap = new Map<string, CometChat.BaseMessage>();
  const messageIdMap = new Map<string, CometChat.BaseMessage>();

  return {
    parentMessageId: null,
    isAgentChatMode: false,
    loadingStateSignal: vi.fn().mockReturnValue(false),
    isMessageForCurrentConversation: vi.fn().mockReturnValue(true),
    isThreadReplyForCurrentConversation: vi.fn().mockReturnValue(false),
    addMessage: vi.fn(),
    updateMessageById: vi.fn().mockReturnValue(true),
    updateMessageByMuid: vi.fn(),
    messageMuidMap,
    messageIdMap,
    normalizeMessageId: vi.fn((id: any) => String(id)),
    ...overrides,
  };
}

describe('message-list.sent-handler', () => {

  // ==================== handleSentMessageImpl ====================

  describe('handleSentMessageImpl', () => {
    it('should call addMessage for inprogress status', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('should call updateSentMessageByMuid for success status', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      expect(ctx.updateMessageById).toHaveBeenCalled();
    });

    it('should call updateSentMessageByMuid for error status', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.error });
      expect(ctx.updateMessageById).toHaveBeenCalled();
    });

    it('should return early when message is not for current conversation', () => {
      const ctx = makeCtx({ isMessageForCurrentConversation: vi.fn().mockReturnValue(false) });
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('should queue message when loading state is true', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      // Should not add immediately
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('should handle thread reply for current conversation when parentMessageId is set', () => {
      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => 99;
      const ctx = makeCtx({
        parentMessageId: null,
        isAgentChatMode: false,
        isThreadReplyForCurrentConversation: vi.fn().mockReturnValue(true),
      });
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      // Should update reply count, not add message
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });
  });

  // ==================== updateSentMessageByMuidImpl ====================

  describe('updateSentMessageByMuidImpl', () => {
    it('should call updateMessageByMuid when MUID exists in map', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1, 'test-muid');
      const existingMsg = makeTextMessage(1, 'test-muid');
      ctx.messageMuidMap.set('test-muid', existingMsg);
      updateSentMessageByMuidImpl(ctx, msg);
      expect(ctx.updateMessageByMuid).toHaveBeenCalledWith('test-muid', msg);
    });

    it('should call updateMessageById when MUID not in map but ID exists', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(42, 'unknown-muid');
      updateSentMessageByMuidImpl(ctx, msg);
      expect(ctx.updateMessageById).toHaveBeenCalledWith(42, msg);
    });

    it('should call updateMessageById when getMuid returns null', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(10);
      (msg as any).getMuid = () => null;
      updateSentMessageByMuidImpl(ctx, msg);
      expect(ctx.updateMessageById).toHaveBeenCalledWith(10, msg);
    });

    it('should not call updateMessageById when no MUID and no ID', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(0);
      (msg as any).getMuid = () => null;
      (msg as any).getId = () => 0;
      updateSentMessageByMuidImpl(ctx, msg);
      // id=0 is falsy, so updateMessageById should not be called
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });
  });

  // ==================== updateSentMessageReplyCountImpl ====================

  describe('updateSentMessageReplyCountImpl', () => {
    it('should return early when message has no parentMessageId', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => null;
      updateSentMessageReplyCountImpl(ctx, msg);
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });

    it('should return early when parent message not found in map', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => 99;
      updateSentMessageReplyCountImpl(ctx, msg);
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });

    it('should increment reply count on parent message', () => {
      const ctx = makeCtx();
      const parentMsg = makeTextMessage(99);
      // Provide a real-ish parent with getReplyCount/setReplyCount
      let replyCount = 2;
      (parentMsg as any).getReplyCount = () => replyCount;
      (parentMsg as any).setReplyCount = (v: number) => { replyCount = v; };
      ctx.messageIdMap.set('99', parentMsg);
      ctx.normalizeMessageId = vi.fn().mockReturnValue('99');

      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => 99;

      updateSentMessageReplyCountImpl(ctx, msg);
      // updateMessageById should be called with the parent ID
      expect(ctx.updateMessageById).toHaveBeenCalledWith(99, expect.anything());
    });
  });

  // ==================== handleEditedMessageImpl ====================

  describe('handleEditedMessageImpl', () => {
    it('should call updateMessageById with the edited message', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(5);
      handleEditedMessageImpl(ctx, msg);
      expect(ctx.updateMessageById).toHaveBeenCalledWith(5, msg);
    });

    it('should return early when message is not for current conversation', () => {
      const ctx = makeCtx({ isMessageForCurrentConversation: vi.fn().mockReturnValue(false) });
      const msg = makeTextMessage(5);
      handleEditedMessageImpl(ctx, msg);
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });

    it('should emit onMessageEdited event', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(5);
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessageEdited.subscribe(spy);
      handleEditedMessageImpl(ctx, msg);
      expect(spy).toHaveBeenCalledWith(msg);
      sub.unsubscribe();
    });
  });

  // ==================== flushPendingSentMessages ====================

  describe('flushPendingSentMessages', () => {
    it('should do nothing when no pending messages', () => {
      const ctx = makeCtx();
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('should process queued inprogress messages after loading', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1);
      // Queue a message while loading
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).not.toHaveBeenCalled();

      // Now flush
      ctx.loadingStateSignal = vi.fn().mockReturnValue(false);
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('should skip inprogress messages already in the list by MUID', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1, 'existing-muid');
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });

      // Simulate message already fetched from server
      ctx.messageMuidMap.set('existing-muid', msg);
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('should process success messages from queue', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      flushPendingSentMessages(ctx);
      expect(ctx.updateMessageById).toHaveBeenCalled();
    });

    it('should skip messages not for current conversation', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });

      ctx.isMessageForCurrentConversation = vi.fn().mockReturnValue(false);
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });
  });

  // ==================== setupSentMessageListenerImpl ====================

  describe('setupSentMessageListenerImpl', () => {
    it('should subscribe to ccMessageSent and store subscription', () => {
      const ctx = makeCtx();
      setupSentMessageListenerImpl(ctx);
      expect(ctx.ccMessageSentSubscription).toBeDefined();
      ctx.ccMessageSentSubscription?.unsubscribe();
    });

    it('should call handleSentMessageImpl when ccMessageSent fires', () => {
      const ctx = makeCtx();
      setupSentMessageListenerImpl(ctx);
      const msg = makeTextMessage(1);
      CometChatMessageEvents.ccMessageSent.next({ message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
      ctx.ccMessageSentSubscription?.unsubscribe();
    });
  });

  // ==================== setupEditedMessageListenerImpl ====================

  describe('setupEditedMessageListenerImpl', () => {
    it('should subscribe to ccMessageEdited and store subscription', () => {
      const ctx = makeCtx();
      setupEditedMessageListenerImpl(ctx);
      expect(ctx.ccMessageEditedSubscription).toBeDefined();
      ctx.ccMessageEditedSubscription?.unsubscribe();
    });

    it('should call handleEditedMessageImpl when ccMessageEdited fires with success', () => {
      const ctx = makeCtx();
      setupEditedMessageListenerImpl(ctx);
      const msg = makeTextMessage(5);
      CometChatMessageEvents.ccMessageEdited.next({ message: msg, status: MessageStatus.success });
      expect(ctx.updateMessageById).toHaveBeenCalledWith(5, msg);
      ctx.ccMessageEditedSubscription?.unsubscribe();
    });

    it('should not call handleEditedMessageImpl for non-success status', () => {
      const ctx = makeCtx();
      setupEditedMessageListenerImpl(ctx);
      const msg = makeTextMessage(5);
      CometChatMessageEvents.ccMessageEdited.next({ message: msg, status: MessageStatus.inprogress });
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
      ctx.ccMessageEditedSubscription?.unsubscribe();
    });
  });
});
