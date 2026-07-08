/**
 * cometchat-message-list.reaction-handlers Tests
 *
 * Covers: showEmojiKeyboardForMessageImpl, onEmojiKeyboardCloseImpl,
 *         onEmojiSelectedImpl, onBubbleReactionClickImpl,
 *         onBubbleReactionListItemClickImpl.
 *
 * @module components/cometchat-message-list/reaction-handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  showEmojiKeyboardForMessageImpl,
  onEmojiKeyboardCloseImpl,
  onEmojiSelectedImpl,
  onBubbleReactionClickImpl,
  onBubbleReactionListItemClickImpl,
  ReactionHandlerContext,
} from './cometchat-message-list.reaction-handlers';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(id = 1): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getMuid = () => `muid-${id}`;
  return msg as unknown as CometChat.BaseMessage;
}

function makeReactionCount(emoji: string, reactedByMe = false): CometChat.ReactionCount {
  return new CometChat.ReactionCount(emoji, 1, reactedByMe);
}

function makeReaction(emoji: string): CometChat.Reaction {
  const r = new CometChat.Reaction();
  (r as any).reaction = emoji;
  (r as any).getReaction = () => emoji;
  return r;
}

function makeCtx(overrides: Partial<ReactionHandlerContext> = {}): ReactionHandlerContext {
  const emojiKeyboardMessage = { value: null as any, set: vi.fn((v: any) => { emojiKeyboardMessage.value = v; }) };
  const emojiKeyboardPosition = { value: null as any, set: vi.fn((v: any) => { emojiKeyboardPosition.value = v; }) };

  return {
    listContainer: null,
    emojiKeyboardMessage: Object.assign(() => emojiKeyboardMessage.value, emojiKeyboardMessage),
    emojiKeyboardPosition: Object.assign(() => emojiKeyboardPosition.value, emojiKeyboardPosition),
    messageListService: {
      addReaction: vi.fn().mockResolvedValue(undefined),
      removeReaction: vi.fn().mockResolvedValue(undefined),
    },
    cdr: { markForCheck: vi.fn() },
    reactionClick: { emit: vi.fn() },
    reactionListItemClick: { emit: vi.fn() },
    getMessageAlignment: vi.fn().mockReturnValue(MessageBubbleAlignment.left),
    saveScrollPositionForReaction: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-list.reaction-handlers', () => {

  // ==================== showEmojiKeyboardForMessageImpl ====================

  describe('showEmojiKeyboardForMessageImpl', () => {
    it('should set emojiKeyboardMessage to the provided message', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      showEmojiKeyboardForMessageImpl(ctx, msg);
      expect(ctx.emojiKeyboardMessage.set).toHaveBeenCalledWith(msg);
    });

    it('should not throw when listContainer is null', () => {
      const ctx = makeCtx({ listContainer: null });
      expect(() => showEmojiKeyboardForMessageImpl(ctx, makeMessage(1))).not.toThrow();
    });
  });

  // ==================== onEmojiKeyboardCloseImpl ====================

  describe('onEmojiKeyboardCloseImpl', () => {
    it('should set emojiKeyboardMessage to null', () => {
      const ctx = makeCtx();
      onEmojiKeyboardCloseImpl(ctx);
      expect(ctx.emojiKeyboardMessage.set).toHaveBeenCalledWith(null);
    });

    it('should set emojiKeyboardPosition to null', () => {
      const ctx = makeCtx();
      onEmojiKeyboardCloseImpl(ctx);
      expect(ctx.emojiKeyboardPosition.set).toHaveBeenCalledWith(null);
    });
  });

  // ==================== onEmojiSelectedImpl ====================

  describe('onEmojiSelectedImpl', () => {
    it('should return early when no message is set', async () => {
      const ctx = makeCtx();
      // emojiKeyboardMessage returns null
      await onEmojiSelectedImpl(ctx, '👍');
      expect(ctx.messageListService.addReaction).not.toHaveBeenCalled();
    });

    it('should call addReaction with the message ID and emoji', async () => {
      const msg = makeMessage(42);
      const emojiKeyboardMessage = { value: msg, set: vi.fn() };
      const ctx = makeCtx({
        emojiKeyboardMessage: Object.assign(() => emojiKeyboardMessage.value, emojiKeyboardMessage),
      });
      await onEmojiSelectedImpl(ctx, '👍');
      expect(ctx.messageListService.addReaction).toHaveBeenCalledWith(42, '👍');
    });

    it('should clear emojiKeyboardMessage and position after selection', async () => {
      const msg = makeMessage(42);
      const emojiKeyboardMessage = { value: msg, set: vi.fn() };
      const emojiKeyboardPosition = { value: { top: 0, left: 0 }, set: vi.fn() };
      const ctx = makeCtx({
        emojiKeyboardMessage: Object.assign(() => emojiKeyboardMessage.value, emojiKeyboardMessage),
        emojiKeyboardPosition: Object.assign(() => emojiKeyboardPosition.value, emojiKeyboardPosition),
      });
      await onEmojiSelectedImpl(ctx, '👍');
      expect(emojiKeyboardMessage.set).toHaveBeenCalledWith(null);
      expect(emojiKeyboardPosition.set).toHaveBeenCalledWith(null);
    });

    it('should call saveScrollPositionForReaction before adding reaction', async () => {
      const msg = makeMessage(42);
      const emojiKeyboardMessage = { value: msg, set: vi.fn() };
      const ctx = makeCtx({
        emojiKeyboardMessage: Object.assign(() => emojiKeyboardMessage.value, emojiKeyboardMessage),
      });
      await onEmojiSelectedImpl(ctx, '👍');
      expect(ctx.saveScrollPositionForReaction).toHaveBeenCalled();
    });

    it('should not throw when addReaction fails', async () => {
      const msg = makeMessage(42);
      const emojiKeyboardMessage = { value: msg, set: vi.fn() };
      const ctx = makeCtx({
        emojiKeyboardMessage: Object.assign(() => emojiKeyboardMessage.value, emojiKeyboardMessage),
        messageListService: {
          addReaction: vi.fn().mockRejectedValue(new Error('reaction failed')),
          removeReaction: vi.fn(),
        },
      });
      await expect(onEmojiSelectedImpl(ctx, '👍')).resolves.not.toThrow();
    });

    it('should return early when message ID is 0 or invalid', async () => {
      const msg = makeMessage(0);
      (msg as any).getId = () => 0;
      const emojiKeyboardMessage = { value: msg, set: vi.fn() };
      const ctx = makeCtx({
        emojiKeyboardMessage: Object.assign(() => emojiKeyboardMessage.value, emojiKeyboardMessage),
      });
      await onEmojiSelectedImpl(ctx, '👍');
      expect(ctx.messageListService.addReaction).not.toHaveBeenCalled();
    });
  });

  // ==================== onBubbleReactionClickImpl ====================

  describe('onBubbleReactionClickImpl', () => {
    it('should call addReaction when reaction is not reacted by me', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(10);
      const reaction = makeReactionCount('👍', false);
      await onBubbleReactionClickImpl(ctx, { reaction, message: msg });
      expect(ctx.messageListService.addReaction).toHaveBeenCalledWith(10, '👍');
    });

    it('should call removeReaction when reaction is already reacted by me', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(10);
      const reaction = makeReactionCount('👍', true);
      await onBubbleReactionClickImpl(ctx, { reaction, message: msg });
      expect(ctx.messageListService.removeReaction).toHaveBeenCalledWith(10, '👍');
    });

    it('should emit reactionClick event', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(10);
      const reaction = makeReactionCount('👍', false);
      await onBubbleReactionClickImpl(ctx, { reaction, message: msg });
      expect(ctx.reactionClick.emit).toHaveBeenCalledWith({ reaction, message: msg });
    });

    it('should call saveScrollPositionForReaction', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(10);
      const reaction = makeReactionCount('👍', false);
      await onBubbleReactionClickImpl(ctx, { reaction, message: msg });
      expect(ctx.saveScrollPositionForReaction).toHaveBeenCalled();
    });

    it('should not throw when addReaction fails', async () => {
      const ctx = makeCtx({
        messageListService: {
          addReaction: vi.fn().mockRejectedValue(new Error('fail')),
          removeReaction: vi.fn(),
        },
      });
      const msg = makeMessage(10);
      const reaction = makeReactionCount('👍', false);
      await expect(onBubbleReactionClickImpl(ctx, { reaction, message: msg })).resolves.not.toThrow();
    });
  });

  // ==================== onBubbleReactionListItemClickImpl ====================

  describe('onBubbleReactionListItemClickImpl', () => {
    it('should call removeReaction with the message ID and emoji', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(20);
      const reaction = makeReaction('❤️');
      await onBubbleReactionListItemClickImpl(ctx, { reaction, message: msg });
      expect(ctx.messageListService.removeReaction).toHaveBeenCalledWith(20, '❤️');
    });

    it('should emit reactionListItemClick event', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(20);
      const reaction = makeReaction('❤️');
      await onBubbleReactionListItemClickImpl(ctx, { reaction, message: msg });
      expect(ctx.reactionListItemClick.emit).toHaveBeenCalledWith({ reaction, message: msg });
    });

    it('should call saveScrollPositionForReaction', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(20);
      const reaction = makeReaction('❤️');
      await onBubbleReactionListItemClickImpl(ctx, { reaction, message: msg });
      expect(ctx.saveScrollPositionForReaction).toHaveBeenCalled();
    });

    it('should not throw when removeReaction fails', async () => {
      const ctx = makeCtx({
        messageListService: {
          addReaction: vi.fn(),
          removeReaction: vi.fn().mockRejectedValue(new Error('fail')),
        },
      });
      const msg = makeMessage(20);
      const reaction = makeReaction('❤️');
      await expect(onBubbleReactionListItemClickImpl(ctx, { reaction, message: msg })).resolves.not.toThrow();
    });
  });
});
