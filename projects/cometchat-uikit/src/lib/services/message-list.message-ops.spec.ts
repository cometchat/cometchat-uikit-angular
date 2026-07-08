/**
 * message-list.message-ops Tests
 *
 * Covers: addMessageImpl, updateMessageByIdImpl, updateMessageByMuidImpl,
 *         deleteMessageImpl, removeMessageImpl, getMessageByIdImpl,
 *         deduplicateMessagesImpl, clearMessagesImpl.
 *
 * @module services/message-list.message-ops
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  addMessageImpl,
  updateMessageByIdImpl,
  updateMessageByMuidImpl,
  deleteMessageImpl,
  removeMessageImpl,
  getMessageByIdImpl,
  deduplicateMessagesImpl,
  clearMessagesImpl,
  MessageOpsContext,
} from './message-list.message-ops';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(id: number, muid = `muid-${id}`): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getMuid = () => muid;
  return msg as unknown as CometChat.BaseMessage;
}

function makeCtx(): MessageOpsContext {
  let _allMessages: CometChat.BaseMessage[] = [];
  let _messages: CometChat.BaseMessage[] = [];
  let _nextId = 0;

  const allMessagesSignal = {
    get value() { return _allMessages; },
    set: vi.fn((v: CometChat.BaseMessage[]) => { _allMessages = v; }),
    update: vi.fn((fn: (m: CometChat.BaseMessage[]) => CometChat.BaseMessage[]) => { _allMessages = fn(_allMessages); }),
    call: () => _allMessages,
  };
  const messagesSignal = {
    get value() { return _messages; },
    set: vi.fn((v: CometChat.BaseMessage[]) => { _messages = v; }),
    update: vi.fn((fn: (m: CometChat.BaseMessage[]) => CometChat.BaseMessage[]) => { _messages = fn(_messages); }),
    call: () => _messages,
  };
  const nextMessageIdSignal = {
    get value() { return _nextId; },
    set: vi.fn((v: number) => { _nextId = v; }),
    call: () => _nextId,
  };

  const ctx: any = {
    get messagesSignal() { return Object.assign(() => _messages, messagesSignal); },
    get allMessagesSignal() { return Object.assign(() => _allMessages, allMessagesSignal); },
    get nextMessageIdSignal() { return Object.assign(() => _nextId, nextMessageIdSignal); },
    messageIdMap: new Map<number, CometChat.BaseMessage>(),
    messageMuidMap: new Map<string, CometChat.BaseMessage>(),
    errorCallback: null,
    normalizeMessageId: (id: string | number) => Number(id),
    updateMessageById: vi.fn(),
    updateMessageReactions: vi.fn(),
  };

  // Wire updateMessageById to actually call updateMessageByIdImpl
  ctx.updateMessageById = (id: number, msg: CometChat.BaseMessage) => updateMessageByIdImpl(ctx, id, msg);

  return ctx;
}

describe('message-list.message-ops', () => {

  // ==================== addMessageImpl ====================

  describe('addMessageImpl', () => {
    it('should add message to allMessagesSignal', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      addMessageImpl(ctx, msg);
      expect(ctx.allMessagesSignal()).toContain(msg);
    });

    it('should add message to messagesSignal', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      addMessageImpl(ctx, msg);
      expect(ctx.messagesSignal()).toContain(msg);
    });

    it('should add message to messageIdMap', () => {
      const ctx = makeCtx();
      const msg = makeMessage(42);
      addMessageImpl(ctx, msg);
      expect(ctx.messageIdMap.has(42)).toBe(true);
    });

    it('should add message to messageMuidMap', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1, 'test-muid');
      addMessageImpl(ctx, msg);
      expect(ctx.messageMuidMap.has('test-muid')).toBe(true);
    });

    it('should update nextMessageIdSignal when message ID is higher', () => {
      const ctx = makeCtx();
      const msg = makeMessage(100);
      addMessageImpl(ctx, msg);
      expect(ctx.nextMessageIdSignal()).toBe(100);
    });

    it('should not decrease nextMessageIdSignal', () => {
      const ctx = makeCtx();
      addMessageImpl(ctx, makeMessage(100));
      addMessageImpl(ctx, makeMessage(50));
      expect(ctx.nextMessageIdSignal()).toBe(100);
    });
  });

  // ==================== updateMessageByIdImpl ====================

  describe('updateMessageByIdImpl', () => {
    it('should return false when message not found', () => {
      const ctx = makeCtx();
      const msg = makeMessage(999);
      expect(updateMessageByIdImpl(ctx, 999, msg)).toBe(false);
    });

    it('should update message in allMessagesSignal', () => {
      const ctx = makeCtx();
      const original = makeMessage(1);
      addMessageImpl(ctx, original);
      const updated = makeMessage(1);
      (updated as any).getText = () => 'Updated';
      const result = updateMessageByIdImpl(ctx, 1, updated);
      expect(result).toBe(true);
      expect(ctx.allMessagesSignal()[0]).toBe(updated);
    });

    it('should update messageIdMap', () => {
      const ctx = makeCtx();
      const original = makeMessage(1);
      addMessageImpl(ctx, original);
      const updated = makeMessage(1);
      updateMessageByIdImpl(ctx, 1, updated);
      expect(ctx.messageIdMap.get(1)).toBe(updated);
    });
  });

  // ==================== updateMessageByMuidImpl ====================

  describe('updateMessageByMuidImpl', () => {
    it('should return false when MUID not found', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1, 'unknown-muid');
      expect(updateMessageByMuidImpl(ctx, 'unknown-muid', msg)).toBe(false);
    });

    it('should update message by MUID', () => {
      const ctx = makeCtx();
      const original = makeMessage(1, 'test-muid');
      addMessageImpl(ctx, original);
      const updated = makeMessage(1, 'test-muid');
      const result = updateMessageByMuidImpl(ctx, 'test-muid', updated);
      expect(result).toBe(true);
    });
  });

  // ==================== deleteMessageImpl ====================

  describe('deleteMessageImpl', () => {
    it('should return false when message not found', () => {
      const ctx = makeCtx();
      expect(deleteMessageImpl(ctx, 999)).toBe(false);
    });

    it('should set deletedAt on the message', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      addMessageImpl(ctx, msg);
      const result = deleteMessageImpl(ctx, 1);
      expect(result).toBe(true);
      const updated = ctx.messageIdMap.get(1);
      expect(updated?.getDeletedAt()).toBeGreaterThan(0);
    });
  });

  // ==================== removeMessageImpl ====================

  describe('removeMessageImpl', () => {
    it('should return false when message not found', () => {
      const ctx = makeCtx();
      expect(removeMessageImpl(ctx, 999)).toBe(false);
    });

    it('should remove message from allMessagesSignal', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      addMessageImpl(ctx, msg);
      removeMessageImpl(ctx, 1);
      expect(ctx.allMessagesSignal()).not.toContain(msg);
    });

    it('should remove message from messageIdMap', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      addMessageImpl(ctx, msg);
      removeMessageImpl(ctx, 1);
      expect(ctx.messageIdMap.has(1)).toBe(false);
    });

    it('should remove message from messageMuidMap', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1, 'test-muid');
      addMessageImpl(ctx, msg);
      removeMessageImpl(ctx, 1);
      expect(ctx.messageMuidMap.has('test-muid')).toBe(false);
    });
  });

  // ==================== getMessageByIdImpl ====================

  describe('getMessageByIdImpl', () => {
    it('should return undefined when message not found', () => {
      const ctx = makeCtx();
      expect(getMessageByIdImpl(ctx, 999)).toBeUndefined();
    });

    it('should return the message when found', () => {
      const ctx = makeCtx();
      const msg = makeMessage(42);
      addMessageImpl(ctx, msg);
      expect(getMessageByIdImpl(ctx, 42)).toBe(msg);
    });
  });

  // ==================== deduplicateMessagesImpl ====================

  describe('deduplicateMessagesImpl', () => {
    it('should return empty array for empty input', () => {
      const ctx = makeCtx();
      expect(deduplicateMessagesImpl(ctx, [])).toEqual([]);
    });

    it('should remove duplicate messages by ID', () => {
      const ctx = makeCtx();
      const msg1 = makeMessage(1);
      const msg2 = makeMessage(1); // duplicate
      const msg3 = makeMessage(2);
      const result = deduplicateMessagesImpl(ctx, [msg1, msg2, msg3]);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(msg1);
      expect(result[1]).toBe(msg3);
    });

    it('should preserve order of first occurrence', () => {
      const ctx = makeCtx();
      const msgs = [makeMessage(3), makeMessage(1), makeMessage(2), makeMessage(1)];
      const result = deduplicateMessagesImpl(ctx, msgs);
      expect(result.map(m => m.getId())).toEqual([3, 1, 2]);
    });
  });

  // ==================== clearMessagesImpl ====================

  describe('clearMessagesImpl', () => {
    it('should clear allMessagesSignal', () => {
      const ctx = makeCtx();
      addMessageImpl(ctx, makeMessage(1));
      clearMessagesImpl(ctx);
      expect(ctx.allMessagesSignal()).toEqual([]);
    });

    it('should clear messagesSignal', () => {
      const ctx = makeCtx();
      addMessageImpl(ctx, makeMessage(1));
      clearMessagesImpl(ctx);
      expect(ctx.messagesSignal()).toEqual([]);
    });

    it('should clear messageIdMap', () => {
      const ctx = makeCtx();
      addMessageImpl(ctx, makeMessage(1));
      clearMessagesImpl(ctx);
      expect(ctx.messageIdMap.size).toBe(0);
    });

    it('should clear messageMuidMap', () => {
      const ctx = makeCtx();
      addMessageImpl(ctx, makeMessage(1, 'test-muid'));
      clearMessagesImpl(ctx);
      expect(ctx.messageMuidMap.size).toBe(0);
    });

    it('should reset nextMessageIdSignal to 0', () => {
      const ctx = makeCtx();
      addMessageImpl(ctx, makeMessage(100));
      clearMessagesImpl(ctx);
      expect(ctx.nextMessageIdSignal()).toBe(0);
    });
  });
});
