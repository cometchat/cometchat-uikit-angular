/**
 * message-list.reaction-ops Tests
 *
 * Covers: addReactionImpl (add new, increment, toggle off),
 *         removeReactionImpl (decrement, remove when count=1),
 *         fetchReactionsImpl.
 *
 * @module services/message-list.reaction-ops
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  addReactionImpl,
  removeReactionImpl,
  fetchReactionsImpl,
  ReactionOpsContext,
} from './message-list.reaction-ops';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(id: number, reactions: CometChat.ReactionCount[] = []): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getReactions = () => reactions;
  (msg as any).setReactions = vi.fn((r: CometChat.ReactionCount[]) => { (msg as any).getReactions = () => r; });
  return msg as unknown as CometChat.BaseMessage;
}

function makeReactionCount(emoji: string, count: number, reactedByMe = false): CometChat.ReactionCount {
  const r = new CometChat.ReactionCount(emoji, count, reactedByMe);
  return r;
}

function makeCtx(messages: CometChat.BaseMessage[] = []): ReactionOpsContext {
  const messageIdMap = new Map<number, CometChat.BaseMessage>();
  messages.forEach(m => messageIdMap.set(m.getId(), m));

  return {
    messageIdMap,
    errorCallback: null,
    normalizeMessageId: (id: string | number) => Number(id),
    updateMessageReactions: vi.fn().mockReturnValue(true),
  };
}

describe('message-list.reaction-ops', () => {

  beforeEach(() => {
    vi.mocked(CometChat.addReaction).mockResolvedValue(undefined as any);
    vi.mocked(CometChat.removeReaction).mockResolvedValue(undefined as any);
  });

  // ==================== addReactionImpl ====================

  describe('addReactionImpl', () => {
    it('should throw when message not found', async () => {
      const ctx = makeCtx([]);
      await expect(addReactionImpl(ctx, 999, '👍')).rejects.toThrow();
    });

    it('should add a new reaction when none exists', async () => {
      const msg = makeMessage(1, []);
      const ctx = makeCtx([msg]);
      await addReactionImpl(ctx, 1, '👍');
      expect(ctx.updateMessageReactions).toHaveBeenCalledTimes(1);
      const reactions = (ctx.updateMessageReactions as any).mock.calls[0][1] as CometChat.ReactionCount[];
      expect(reactions.some(r => r.getReaction() === '👍')).toBe(true);
    });

    it('should call CometChat.addReaction for new reaction', async () => {
      const msg = makeMessage(1, []);
      const ctx = makeCtx([msg]);
      await addReactionImpl(ctx, 1, '👍');
      expect(CometChat.addReaction).toHaveBeenCalledWith(1, '👍');
    });

    it('should increment count when reaction exists and not reacted by me', async () => {
      const existing = makeReactionCount('👍', 2, false);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      await addReactionImpl(ctx, 1, '👍');
      const reactions = (ctx.updateMessageReactions as any).mock.calls[0][1] as CometChat.ReactionCount[];
      const thumbs = reactions.find(r => r.getReaction() === '👍');
      expect(thumbs?.getCount()).toBe(3);
      expect(thumbs?.getReactedByMe()).toBe(true);
    });

    it('should toggle off (remove) when already reacted by me', async () => {
      const existing = makeReactionCount('👍', 1, true);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      await addReactionImpl(ctx, 1, '👍');
      // Should call removeReaction (toggle off)
      expect(CometChat.removeReaction).toHaveBeenCalledWith(1, '👍');
    });

    it('should remove reaction from list when toggling off with count=1', async () => {
      const existing = makeReactionCount('👍', 1, true);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      await addReactionImpl(ctx, 1, '👍');
      const reactions = (ctx.updateMessageReactions as any).mock.calls[0][1] as CometChat.ReactionCount[];
      expect(reactions.find(r => r.getReaction() === '👍')).toBeUndefined();
    });

    it('should rollback reactions on SDK error', async () => {
      const existing = makeReactionCount('👍', 2, false);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      vi.mocked(CometChat.addReaction).mockRejectedValueOnce(new Error('fail'));
      await addReactionImpl(ctx, 1, '👍');
      // Should call updateMessageReactions twice: once optimistic, once rollback
      expect(ctx.updateMessageReactions).toHaveBeenCalledTimes(2);
    });

    it('should call errorCallback on SDK error', async () => {
      const msg = makeMessage(1, []);
      const errorCb = vi.fn();
      const ctx = makeCtx([msg]);
      ctx.errorCallback = errorCb;
      vi.mocked(CometChat.addReaction).mockRejectedValueOnce(new Error('fail'));
      await addReactionImpl(ctx, 1, '👍');
      expect(errorCb).toHaveBeenCalled();
    });
  });

  // ==================== removeReactionImpl ====================

  describe('removeReactionImpl', () => {
    it('should throw when message not found', async () => {
      const ctx = makeCtx([]);
      await expect(removeReactionImpl(ctx, 999, '👍')).rejects.toThrow();
    });

    it('should decrement count when count > 1', async () => {
      const existing = makeReactionCount('👍', 3, true);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      await removeReactionImpl(ctx, 1, '👍');
      const reactions = (ctx.updateMessageReactions as any).mock.calls[0][1] as CometChat.ReactionCount[];
      const thumbs = reactions.find(r => r.getReaction() === '👍');
      expect(thumbs?.getCount()).toBe(2);
    });

    it('should remove reaction when count is 1', async () => {
      const existing = makeReactionCount('👍', 1, true);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      await removeReactionImpl(ctx, 1, '👍');
      const reactions = (ctx.updateMessageReactions as any).mock.calls[0][1] as CometChat.ReactionCount[];
      expect(reactions.find(r => r.getReaction() === '👍')).toBeUndefined();
    });

    it('should call CometChat.removeReaction', async () => {
      const existing = makeReactionCount('👍', 2, true);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      await removeReactionImpl(ctx, 1, '👍');
      expect(CometChat.removeReaction).toHaveBeenCalledWith(1, '👍');
    });

    it('should rollback reactions on SDK error', async () => {
      const existing = makeReactionCount('👍', 2, true);
      const msg = makeMessage(1, [existing]);
      const ctx = makeCtx([msg]);
      vi.mocked(CometChat.removeReaction).mockRejectedValueOnce(new Error('fail'));
      await removeReactionImpl(ctx, 1, '👍');
      expect(ctx.updateMessageReactions).toHaveBeenCalledTimes(2);
    });

    it('should preserve other reactions when removing one', async () => {
      const thumbs = makeReactionCount('👍', 2, true);
      const heart = makeReactionCount('❤️', 1, false);
      const msg = makeMessage(1, [thumbs, heart]);
      const ctx = makeCtx([msg]);
      await removeReactionImpl(ctx, 1, '👍');
      const reactions = (ctx.updateMessageReactions as any).mock.calls[0][1] as CometChat.ReactionCount[];
      expect(reactions.find(r => r.getReaction() === '❤️')).toBeDefined();
    });
  });

  // ==================== fetchReactionsImpl ====================

  describe('fetchReactionsImpl', () => {
    it('should return reactions from SDK', async () => {
      const ctx = makeCtx();
      const mockReactions = [new CometChat.Reaction()];
      const mockRequest = { fetchNext: vi.fn().mockResolvedValue(mockReactions) };
      const mockBuilder = {
        setMessageId: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue(mockRequest),
      };
      // Use a proper constructor function
      (CometChat as any).ReactionsRequestBuilder = function() { return mockBuilder; };

      const result = await fetchReactionsImpl(ctx, 1);
      expect(result).toBe(mockReactions);
    });

    it('should return empty array on error', async () => {
      const ctx = makeCtx();
      const mockBuilder = {
        setMessageId: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({
          fetchNext: vi.fn().mockRejectedValue(new Error('fail')),
        }),
      };
      (CometChat as any).ReactionsRequestBuilder = vi.fn().mockReturnValue(mockBuilder);

      const result = await fetchReactionsImpl(ctx, 1);
      expect(result).toEqual([]);
    });

    it('should call errorCallback on error', async () => {
      const errorCb = vi.fn();
      const ctx = makeCtx();
      ctx.errorCallback = errorCb;
      const mockBuilder = {
        setMessageId: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({
          fetchNext: vi.fn().mockRejectedValue(new Error('fail')),
        }),
      };
      (CometChat as any).ReactionsRequestBuilder = vi.fn().mockReturnValue(mockBuilder);

      await fetchReactionsImpl(ctx, 1);
      expect(errorCb).toHaveBeenCalled();
    });
  });
});
