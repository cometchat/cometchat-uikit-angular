/**
 * message-list.read-ops Tests
 *
 * Covers: updateLocalReadStatusImpl, getMessagesInRangeImpl,
 *         getTotalMessageCountImpl, markInitialMessagesAsReadImpl,
 *         markAsReadImpl, markAsDeliveredImpl, markAsUnreadImpl.
 *
 * @module services/message-list.read-ops
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  updateLocalReadStatusImpl,
  getMessagesInRangeImpl,
  getTotalMessageCountImpl,
  markInitialMessagesAsReadImpl,
  markAsReadImpl,
  markAsDeliveredImpl,
  markAsUnreadImpl,
  ReadOpsContext,
} from './message-list.read-ops';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeMessage(id: number, senderUid: string, readAt?: number): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  msg.setSender(makeUser(senderUid));
  if (readAt) {
    (msg as any).readAt = readAt;
    (msg as any).getReadAt = () => readAt;
  } else {
    (msg as any).getReadAt = () => null;
  }
  return msg as unknown as CometChat.BaseMessage;
}

function makeCtx(messages: CometChat.BaseMessage[] = []): ReadOpsContext {
  let _allMessages = [...messages];
  let _messages = [...messages];
  const messageIdMap = new Map<number, CometChat.BaseMessage>();
  messages.forEach(m => messageIdMap.set(m.getId(), m));

  return {
    messageIdMap,
    messagesSignal: Object.assign(() => _messages, {
      update: vi.fn((fn: (m: CometChat.BaseMessage[]) => CometChat.BaseMessage[]) => { _messages = fn(_messages); }),
    }),
    allMessagesSignal: Object.assign(() => _allMessages, {
      update: vi.fn((fn: (m: CometChat.BaseMessage[]) => CometChat.BaseMessage[]) => { _allMessages = fn(_allMessages); }),
    }),
    normalizeMessageId: (id: string | number) => Number(id),
    updateMessageById: vi.fn().mockReturnValue(true),
  };
}

describe('message-list.read-ops', () => {

  // ==================== updateLocalReadStatusImpl ====================

  describe('updateLocalReadStatusImpl', () => {
    it('should update allMessagesSignal and messagesSignal', () => {
      const msg = makeMessage(1, 'user1');
      const ctx = makeCtx([msg]);
      updateLocalReadStatusImpl(ctx, [1]);
      expect(ctx.allMessagesSignal.update).toHaveBeenCalled();
      expect(ctx.messagesSignal.update).toHaveBeenCalled();
    });

    it('should set readAt on matching messages', () => {
      const msg = makeMessage(1, 'user1');
      const ctx = makeCtx([msg]);
      updateLocalReadStatusImpl(ctx, [1]);
      const updateFn = (ctx.allMessagesSignal.update as any).mock.calls[0][0];
      const result = updateFn([msg]);
      // The cloned message should be a different object (was updated)
      expect(result[0]).not.toBe(msg);
    });

    it('should not update already-read messages', () => {
      const msg = makeMessage(1, 'user1', Date.now());
      const ctx = makeCtx([msg]);
      updateLocalReadStatusImpl(ctx, [1]);
      const updateFn = (ctx.allMessagesSignal.update as any).mock.calls[0][0];
      const result = updateFn([msg]);
      // Should return the same message unchanged
      expect(result[0]).toBe(msg);
    });

    it('should not update messages not in the ID set', () => {
      const msg1 = makeMessage(1, 'user1');
      const msg2 = makeMessage(2, 'user1');
      const ctx = makeCtx([msg1, msg2]);
      updateLocalReadStatusImpl(ctx, [1]);
      const updateFn = (ctx.allMessagesSignal.update as any).mock.calls[0][0];
      const result = updateFn([msg1, msg2]);
      expect(result[1]).toBe(msg2); // msg2 unchanged
    });
  });

  // ==================== getMessagesInRangeImpl ====================

  describe('getMessagesInRangeImpl', () => {
    it('should return empty array when no messages', () => {
      const ctx = makeCtx([]);
      expect(getMessagesInRangeImpl(ctx, 0, 5)).toEqual([]);
    });

    it('should return messages in the specified range', () => {
      const msgs = [makeMessage(1, 'u1'), makeMessage(2, 'u1'), makeMessage(3, 'u1'), makeMessage(4, 'u1')];
      const ctx = makeCtx(msgs);
      const result = getMessagesInRangeImpl(ctx, 1, 2);
      expect(result.length).toBe(2);
      expect(result[0].getId()).toBe(2);
      expect(result[1].getId()).toBe(3);
    });

    it('should return empty array for invalid range', () => {
      const msgs = [makeMessage(1, 'u1'), makeMessage(2, 'u1')];
      const ctx = makeCtx(msgs);
      expect(getMessagesInRangeImpl(ctx, -1, 1)).toEqual([]);
      expect(getMessagesInRangeImpl(ctx, 2, 1)).toEqual([]);
      expect(getMessagesInRangeImpl(ctx, 5, 10)).toEqual([]);
    });

    it('should clamp endIndex to array length', () => {
      const msgs = [makeMessage(1, 'u1'), makeMessage(2, 'u1')];
      const ctx = makeCtx(msgs);
      const result = getMessagesInRangeImpl(ctx, 0, 100);
      expect(result.length).toBe(2);
    });
  });

  // ==================== getTotalMessageCountImpl ====================

  describe('getTotalMessageCountImpl', () => {
    it('should return 0 for empty list', () => {
      const ctx = makeCtx([]);
      expect(getTotalMessageCountImpl(ctx)).toBe(0);
    });

    it('should return the count of all messages', () => {
      const msgs = [makeMessage(1, 'u1'), makeMessage(2, 'u1'), makeMessage(3, 'u1')];
      const ctx = makeCtx(msgs);
      expect(getTotalMessageCountImpl(ctx)).toBe(3);
    });
  });

  // ==================== markInitialMessagesAsReadImpl ====================

  describe('markInitialMessagesAsReadImpl', () => {
    it('should return early when messages is empty', async () => {
      const ctx = makeCtx([]);
      const markAsRead = vi.fn();
      const loggedInUser = makeUser('loggedIn');
      await markInitialMessagesAsReadImpl(ctx, [], loggedInUser, markAsRead);
      expect(markAsRead).not.toHaveBeenCalled();
    });

    it('should return early when loggedInUser is null', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx([msg]);
      const markAsRead = vi.fn();
      await markInitialMessagesAsReadImpl(ctx, [msg], null, markAsRead);
      expect(markAsRead).not.toHaveBeenCalled();
    });

    it('should mark the last unread receiver message as read', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx([msg]);
      const markAsRead = vi.fn().mockResolvedValue(undefined);
      const loggedInUser = makeUser('loggedIn');
      await markInitialMessagesAsReadImpl(ctx, [msg], loggedInUser, markAsRead);
      expect(markAsRead).toHaveBeenCalledWith(msg);
    });

    it('should skip messages already read', async () => {
      const readMsg = makeMessage(1, 'other', Date.now());
      const ctx = makeCtx([readMsg]);
      const markAsRead = vi.fn();
      const loggedInUser = makeUser('loggedIn');
      await markInitialMessagesAsReadImpl(ctx, [readMsg], loggedInUser, markAsRead);
      expect(markAsRead).not.toHaveBeenCalled();
    });

    it('should skip messages from logged-in user', async () => {
      const ownMsg = makeMessage(1, 'loggedIn');
      const ctx = makeCtx([ownMsg]);
      const markAsRead = vi.fn();
      const loggedInUser = makeUser('loggedIn');
      await markInitialMessagesAsReadImpl(ctx, [ownMsg], loggedInUser, markAsRead);
      expect(markAsRead).not.toHaveBeenCalled();
    });

    it('should emit ccMessageRead event after marking', async () => {
      const msg = makeMessage(1, 'other');
      const ctx = makeCtx([msg]);
      const markAsRead = vi.fn().mockResolvedValue(undefined);
      const loggedInUser = makeUser('loggedIn');
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageRead.subscribe(spy);
      await markInitialMessagesAsReadImpl(ctx, [msg], loggedInUser, markAsRead);
      sub.unsubscribe();
      expect(spy).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== markAsReadImpl ====================

  describe('markAsReadImpl', () => {
    it('should call CometChat.markAsRead', async () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      const msg = makeMessage(1, 'user1');
      vi.mocked(CometChat.markAsRead).mockResolvedValueOnce(undefined as any);
      await markAsReadImpl(ctx, msg);
      expect(CometChat.markAsRead).toHaveBeenCalledWith(msg);
      vi.useRealTimers();
    });

    it('should not throw when markAsRead fails (logs and returns)', async () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      const msg = makeMessage(1, 'user1');
      vi.mocked(CometChat.markAsRead).mockRejectedValue({ code: 'ERR', message: 'fail' });
      await expect(markAsReadImpl(ctx, msg)).resolves.not.toThrow();
      vi.advanceTimersByTime(5000);
      vi.useRealTimers();
    });
  });

  // ==================== markAsDeliveredImpl ====================

  describe('markAsDeliveredImpl', () => {
    it('should call CometChat.markAsDelivered', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(1, 'user1');
      vi.mocked(CometChat.markAsDelivered).mockResolvedValueOnce(undefined as any);
      await markAsDeliveredImpl(ctx, msg);
      expect(CometChat.markAsDelivered).toHaveBeenCalledWith(msg);
    });

    it('should not throw when markAsDelivered fails', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(1, 'user1');
      vi.mocked(CometChat.markAsDelivered).mockRejectedValueOnce(new Error('fail'));
      await expect(markAsDeliveredImpl(ctx, msg)).resolves.not.toThrow();
    });
  });

  // ==================== markAsUnreadImpl ====================

  describe('markAsUnreadImpl', () => {
    it('should throw when message not found in map', async () => {
      const ctx = makeCtx([]);
      const msg = makeMessage(999, 'user1');
      await expect(markAsUnreadImpl(ctx, msg)).rejects.toThrow();
    });

    it('should call CometChat.markMessageAsUnread when message found', async () => {
      const msg = makeMessage(1, 'user1');
      const ctx = makeCtx([msg]);
      const mockConv = new CometChat.Conversation();
      // Patch CometChat.markMessageAsUnread directly
      const original = (CometChat as any).markMessageAsUnread;
      (CometChat as any).markMessageAsUnread = vi.fn().mockResolvedValue(mockConv);
      const result = await markAsUnreadImpl(ctx, msg);
      expect((CometChat as any).markMessageAsUnread).toHaveBeenCalledWith(msg);
      expect(result).toBe(mockConv);
      (CometChat as any).markMessageAsUnread = original;
    });

    it('should throw when SDK call fails', async () => {
      const msg = makeMessage(1, 'user1');
      const ctx = makeCtx([msg]);
      const original = (CometChat as any).markMessageAsUnread;
      (CometChat as any).markMessageAsUnread = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(markAsUnreadImpl(ctx, msg)).rejects.toThrow();
      (CometChat as any).markMessageAsUnread = original;
    });
  });
});
