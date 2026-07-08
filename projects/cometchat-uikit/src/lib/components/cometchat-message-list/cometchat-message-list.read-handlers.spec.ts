/**
 * cometchat-message-list.read-handlers Tests
 *
 * Covers: markInitialMessagesAsReadImpl, handleRealtimeMessageReceiptImpl,
 *         markMessagesReadOnScrollToBottomImpl, markAsReadWithRetryImpl.
 *
 * @module components/cometchat-message-list/read-handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  markInitialMessagesAsReadImpl,
  handleRealtimeMessageReceiptImpl,
  markMessagesReadOnScrollToBottomImpl,
  markAsReadWithRetryImpl,
} from './cometchat-message-list.read-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeMessage(
  id: number,
  senderUid: string,
  opts: { readAt?: number } = {}
): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  msg.setSender(makeUser(senderUid));
  if (opts.readAt) {
    (msg as any).readAt = opts.readAt;
    (msg as any).getReadAt = () => opts.readAt;
  } else {
    (msg as any).getReadAt = () => undefined;
  }
  return msg as unknown as CometChat.BaseMessage;
}

function makeCtx(overrides: Record<string, any> = {}) {
  const unreadMessages = { value: [] as CometChat.BaseMessage[], set: vi.fn((v: any) => { unreadMessages.value = v; }), update: vi.fn((fn: any) => { unreadMessages.value = fn(unreadMessages.value); }) };
  return {
    loggedInUser: makeUser('loggedIn'),
    messages: vi.fn().mockReturnValue([]),
    unreadMessages: Object.assign(() => unreadMessages.value, unreadMessages),
    isReceiverMessage: vi.fn().mockReturnValue(true),
    isAtBottom: vi.fn().mockReturnValue(true),
    getLatestReceiverMessage: vi.fn().mockReturnValue(null),
    messageListService: {
      markAsRead: vi.fn().mockResolvedValue(undefined),
      updateLocalReadStatus: vi.fn(),
    },
    notifyUnreadCountChange: vi.fn(),
    notifyMessagesRead: vi.fn(),
    error: { emit: vi.fn() },
    ...overrides,
  };
}

describe('cometchat-message-list.read-handlers', () => {

  // ==================== markInitialMessagesAsReadImpl ====================

  describe('markInitialMessagesAsReadImpl', () => {
    it('should return early when messages array is empty', async () => {
      const ctx = makeCtx({ messages: vi.fn().mockReturnValue([]) });
      await markInitialMessagesAsReadImpl(ctx);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should return early when loggedInUser is null', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx({
        loggedInUser: null,
        messages: vi.fn().mockReturnValue([msg]),
      });
      await markInitialMessagesAsReadImpl(ctx);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should mark the last unread receiver message as read', async () => {
      const msg1 = makeMessage(1, 'other');
      const msg2 = makeMessage(2, 'other');
      const ctx = makeCtx({
        messages: vi.fn().mockReturnValue([msg1, msg2]),
        isReceiverMessage: vi.fn().mockReturnValue(true),
      });
      await markInitialMessagesAsReadImpl(ctx);
      // Should mark the last unread message (msg2, index 1 from end)
      expect(ctx.messageListService.markAsRead).toHaveBeenCalledTimes(1);
    });

    it('should call notifyUnreadCountChange with 0 after marking', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx({
        messages: vi.fn().mockReturnValue([msg]),
        isReceiverMessage: vi.fn().mockReturnValue(true),
      });
      await markInitialMessagesAsReadImpl(ctx);
      expect(ctx.notifyUnreadCountChange).toHaveBeenCalledWith(0);
    });

    it('should call notifyMessagesRead after marking', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx({
        messages: vi.fn().mockReturnValue([msg]),
        isReceiverMessage: vi.fn().mockReturnValue(true),
      });
      await markInitialMessagesAsReadImpl(ctx);
      expect(ctx.notifyMessagesRead).toHaveBeenCalledWith(msg);
    });

    it('should skip already-read messages', async () => {
      const readMsg = makeMessage(1, 'other', { readAt: Date.now() });
      const ctx = makeCtx({
        messages: vi.fn().mockReturnValue([readMsg]),
        isReceiverMessage: vi.fn().mockReturnValue(true),
      });
      await markInitialMessagesAsReadImpl(ctx);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should skip sender messages', async () => {
      const senderMsg = makeMessage(1, 'loggedIn');
      const ctx = makeCtx({
        messages: vi.fn().mockReturnValue([senderMsg]),
        isReceiverMessage: vi.fn().mockReturnValue(false),
      });
      await markInitialMessagesAsReadImpl(ctx);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should not throw when markAsRead fails', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx({
        messages: vi.fn().mockReturnValue([msg]),
        isReceiverMessage: vi.fn().mockReturnValue(true),
        messageListService: {
          markAsRead: vi.fn().mockRejectedValue(new Error('Network error')),
          updateLocalReadStatus: vi.fn(),
        },
      });
      await expect(markInitialMessagesAsReadImpl(ctx)).resolves.not.toThrow();
    });

    it('should call updateLocalReadStatus with the message ID', async () => {
      const msg = makeMessage(42, 'other');
      const ctx = makeCtx({
        messages: vi.fn().mockReturnValue([msg]),
        isReceiverMessage: vi.fn().mockReturnValue(true),
      });
      await markInitialMessagesAsReadImpl(ctx);
      expect(ctx.messageListService.updateLocalReadStatus).toHaveBeenCalledWith([42]);
    });
  });

  // ==================== handleRealtimeMessageReceiptImpl ====================

  describe('handleRealtimeMessageReceiptImpl', () => {
    it('should return early when loggedInUser is null', async () => {
      const ctx = makeCtx({ loggedInUser: null });
      const msg = makeMessage(1, 'other');
      await handleRealtimeMessageReceiptImpl(ctx, msg);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should return early when message is not a receiver message', async () => {
      const ctx = makeCtx({ isReceiverMessage: vi.fn().mockReturnValue(false) });
      const msg = makeMessage(1, 'loggedIn');
      await handleRealtimeMessageReceiptImpl(ctx, msg);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should mark message as read when at bottom', async () => {
      const ctx = makeCtx({ isAtBottom: vi.fn().mockReturnValue(true) });
      const msg = makeMessage(1, 'other');
      await handleRealtimeMessageReceiptImpl(ctx, msg);
      expect(ctx.messageListService.markAsRead).toHaveBeenCalledWith(msg);
    });

    it('should call updateLocalReadStatus when at bottom', async () => {
      const ctx = makeCtx({ isAtBottom: vi.fn().mockReturnValue(true) });
      const msg = makeMessage(55, 'other');
      await handleRealtimeMessageReceiptImpl(ctx, msg);
      expect(ctx.messageListService.updateLocalReadStatus).toHaveBeenCalledWith([55]);
    });

    it('should add message to unreadMessages when not at bottom', async () => {
      const ctx = makeCtx({ isAtBottom: vi.fn().mockReturnValue(false) });
      const msg = makeMessage(1, 'other');
      await handleRealtimeMessageReceiptImpl(ctx, msg);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
      expect(ctx.unreadMessages.update).toHaveBeenCalled();
    });

    it('should not throw when markAsRead fails at bottom', async () => {
      const ctx = makeCtx({
        isAtBottom: vi.fn().mockReturnValue(true),
        messageListService: {
          markAsRead: vi.fn().mockRejectedValue(new Error('fail')),
          updateLocalReadStatus: vi.fn(),
        },
      });
      const msg = makeMessage(1, 'other');
      await expect(handleRealtimeMessageReceiptImpl(ctx, msg)).resolves.not.toThrow();
    });
  });

  // ==================== markMessagesReadOnScrollToBottomImpl ====================

  describe('markMessagesReadOnScrollToBottomImpl', () => {
    it('should return early when unreadMessages is empty', async () => {
      const ctx = makeCtx();
      (ctx.unreadMessages as any) = Object.assign(() => [], { set: vi.fn(), update: vi.fn() });
      await markMessagesReadOnScrollToBottomImpl(ctx);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should return early when loggedInUser is null', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx({ loggedInUser: null });
      (ctx.unreadMessages as any) = Object.assign(() => [msg], { set: vi.fn(), update: vi.fn() });
      await markMessagesReadOnScrollToBottomImpl(ctx);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should return early when no latest receiver message found', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx({ getLatestReceiverMessage: vi.fn().mockReturnValue(null) });
      (ctx.unreadMessages as any) = Object.assign(() => [msg], { set: vi.fn(), update: vi.fn() });
      await markMessagesReadOnScrollToBottomImpl(ctx);
      expect(ctx.messageListService.markAsRead).not.toHaveBeenCalled();
    });

    it('should mark the latest receiver message as read', async () => {
      const msg = makeMessage(10, 'other');
      const latestMsg = makeMessage(10, 'other');
      const ctx = makeCtx({ getLatestReceiverMessage: vi.fn().mockReturnValue(latestMsg) });
      (ctx.unreadMessages as any) = Object.assign(() => [msg], { set: vi.fn(), update: vi.fn() });
      await markMessagesReadOnScrollToBottomImpl(ctx);
      expect(ctx.messageListService.markAsRead).toHaveBeenCalledWith(latestMsg);
    });

    it('should clear unreadMessages after marking', async () => {
      const msg = makeMessage(10, 'other');
      const latestMsg = makeMessage(10, 'other');
      const setFn = vi.fn();
      const ctx = makeCtx({ getLatestReceiverMessage: vi.fn().mockReturnValue(latestMsg) });
      (ctx.unreadMessages as any) = Object.assign(() => [msg], { set: setFn, update: vi.fn() });
      await markMessagesReadOnScrollToBottomImpl(ctx);
      expect(setFn).toHaveBeenCalledWith([]);
    });

    it('should call notifyUnreadCountChange with 0', async () => {
      const msg = makeMessage(10, 'other');
      const latestMsg = makeMessage(10, 'other');
      const ctx = makeCtx({ getLatestReceiverMessage: vi.fn().mockReturnValue(latestMsg) });
      (ctx.unreadMessages as any) = Object.assign(() => [msg], { set: vi.fn(), update: vi.fn() });
      await markMessagesReadOnScrollToBottomImpl(ctx);
      expect(ctx.notifyUnreadCountChange).toHaveBeenCalledWith(0);
    });

    it('should not throw when markAsRead fails', async () => {
      const msg = makeMessage(10, 'other');
      const latestMsg = makeMessage(10, 'other');
      const ctx = makeCtx({
        getLatestReceiverMessage: vi.fn().mockReturnValue(latestMsg),
        messageListService: {
          markAsRead: vi.fn().mockRejectedValue(new Error('fail')),
          updateLocalReadStatus: vi.fn(),
        },
      });
      (ctx.unreadMessages as any) = Object.assign(() => [msg], { set: vi.fn(), update: vi.fn() });
      await expect(markMessagesReadOnScrollToBottomImpl(ctx)).resolves.not.toThrow();
    });
  });

  // ==================== markAsReadWithRetryImpl ====================

  describe('markAsReadWithRetryImpl', () => {
    it('should call markAsRead once on success', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(1, 'other');
      await markAsReadWithRetryImpl(ctx, msg);
      expect(ctx.messageListService.markAsRead).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure up to MAX_RETRIES (2)', async () => {
      vi.useFakeTimers();
      const markAsRead = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockRejectedValueOnce(new Error('fail3'));
      const ctx = makeCtx({ messageListService: { markAsRead, updateLocalReadStatus: vi.fn() } });
      const msg = makeMessage(1, 'other');

      const promise = markAsReadWithRetryImpl(ctx, msg);
      // Advance through retry delays
      await vi.runAllTimersAsync();
      await promise;

      expect(markAsRead).toHaveBeenCalledTimes(3); // initial + 2 retries
      vi.useRealTimers();
    }, 10000);

    it('should emit error event after max retries with CometChatException', async () => {
      vi.useFakeTimers();
      const sdkError = new CometChat.CometChatException({ code: 'ERR', message: 'fail' });
      const markAsRead = vi.fn().mockRejectedValue(sdkError);
      const errorEmit = vi.fn();
      const ctx = makeCtx({
        messageListService: { markAsRead, updateLocalReadStatus: vi.fn() },
        error: { emit: errorEmit },
      });
      const msg = makeMessage(1, 'other');

      const promise = markAsReadWithRetryImpl(ctx, msg);
      await vi.runAllTimersAsync();
      await promise;

      expect(errorEmit).toHaveBeenCalledWith(sdkError);
      vi.useRealTimers();
    }, 10000);

    it('should not emit error for non-CometChatException after max retries', async () => {
      vi.useFakeTimers();
      const markAsRead = vi.fn().mockRejectedValue(new Error('plain error'));
      const errorEmit = vi.fn();
      const ctx = makeCtx({
        messageListService: { markAsRead, updateLocalReadStatus: vi.fn() },
        error: { emit: errorEmit },
      });
      const msg = makeMessage(1, 'other');

      const promise = markAsReadWithRetryImpl(ctx, msg);
      await vi.runAllTimersAsync();
      await promise;

      expect(errorEmit).not.toHaveBeenCalled();
      vi.useRealTimers();
    }, 10000);

    it('should succeed on second attempt after first failure', async () => {
      vi.useFakeTimers();
      const markAsRead = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(undefined);
      const ctx = makeCtx({ messageListService: { markAsRead, updateLocalReadStatus: vi.fn() } });
      const msg = makeMessage(1, 'other');

      const promise = markAsReadWithRetryImpl(ctx, msg);
      await vi.runAllTimersAsync();
      await promise;

      expect(markAsRead).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    }, 10000);
  });
});
