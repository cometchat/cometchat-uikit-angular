/**
 * Reaction/emoji handler functions for CometChatMessageList.
 * Extracted to reduce component file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { MessageBubbleAlignment } from '../../Enums/Enums';

export interface ReactionHandlerContext {
  listContainer: any;
  emojiKeyboardMessage: any;
  emojiKeyboardPosition: any;
  messageListService: any;
  cdr: any;
  reactionClick: any;
  reactionListItemClick: any;
  getMessageAlignment: (msg: CometChat.BaseMessage) => MessageBubbleAlignment;
  saveScrollPositionForReaction: () => void;
}

export function showEmojiKeyboardForMessageImpl(ctx: ReactionHandlerContext, message: CometChat.BaseMessage): void {
  ctx.emojiKeyboardMessage.set(message);
  requestAnimationFrame(() => { calculateEmojiKeyboardPositionImpl(ctx, message); });
}

export function calculateEmojiKeyboardPositionImpl(ctx: ReactionHandlerContext, message: CometChat.BaseMessage): void {
  const messageId = message.getId() || message.getMuid();
  const container = ctx.listContainer?.nativeElement;
  if (!container || !messageId) return;
  const rootEl = container.closest('.cometchat-message-list') as HTMLElement;
  if (!rootEl) return;
  const msgWrapper = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
  if (!msgWrapper) return;
  const bubbleEl = msgWrapper.querySelector('.cometchat-message-bubble') as HTMLElement;
  const msgRect = bubbleEl ? bubbleEl.getBoundingClientRect() : msgWrapper.getBoundingClientRect();
  const rootRect = rootEl.getBoundingClientRect();
  const alignment = ctx.getMessageAlignment(message);
  const isOutgoing = alignment === MessageBubbleAlignment.right;
  const kbWidth = 340;
  const kbHeight = 350;
  const gap = 8;
  const availableWidth = rootRect.width;
  const effectiveKbWidth = Math.min(kbWidth, availableWidth - 16);
  let left: number;
  if (isOutgoing) {
    left = msgRect.left - rootRect.left - effectiveKbWidth - gap;
    if (left < 0) { left = gap; }
  } else {
    left = msgRect.right - rootRect.left + gap;
    if (left + effectiveKbWidth > availableWidth) { left = availableWidth - effectiveKbWidth - gap; }
  }
  left = Math.max(0, Math.min(left, availableWidth - effectiveKbWidth));
  const msgCenterY = msgRect.top - rootRect.top + msgRect.height / 2;
  let top = msgCenterY - kbHeight / 2;
  top = Math.max(0, Math.min(top, rootRect.height - kbHeight));
  ctx.emojiKeyboardPosition.set({ top, left, side: isOutgoing ? 'left' : 'right' });
}

export async function onEmojiSelectedImpl(ctx: ReactionHandlerContext, emoji: string): Promise<void> {
  const message = ctx.emojiKeyboardMessage();
  ctx.emojiKeyboardMessage.set(null);
  ctx.emojiKeyboardPosition.set(null);
  if (!message) { console.warn('[CometChatMessageList] onEmojiSelected: No message reference available'); return; }
  const messageId = message.getId();
  if (!messageId || messageId <= 0) { console.warn('[CometChatMessageList] onEmojiSelected: Invalid messageId', messageId); return; }
  try {
    ctx.saveScrollPositionForReaction();
    await ctx.messageListService.addReaction(messageId, emoji);
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'onEmojiSelected: Failed to add reaction', error);
  }
}

export function onEmojiKeyboardCloseImpl(ctx: ReactionHandlerContext): void {
  ctx.emojiKeyboardMessage.set(null);
  ctx.emojiKeyboardPosition.set(null);
}

export async function onBubbleReactionClickImpl(ctx: ReactionHandlerContext, event: { reaction: CometChat.ReactionCount; message: CometChat.BaseMessage }): Promise<void> {
  const { reaction, message } = event;
  ctx.saveScrollPositionForReaction();
  try {
    if (reaction.getReactedByMe()) {
      await ctx.messageListService.removeReaction(message.getId(), reaction.getReaction());
    } else {
      await ctx.messageListService.addReaction(message.getId(), reaction.getReaction());
    }
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'onBubbleReactionClick: Reaction operation failed', error);
  }
  ctx.reactionClick.emit(event);
}

export async function onBubbleReactionListItemClickImpl(ctx: ReactionHandlerContext, event: { reaction: CometChat.Reaction; message: CometChat.BaseMessage }): Promise<void> {
  const { reaction, message } = event;
  ctx.saveScrollPositionForReaction();
  try {
    await ctx.messageListService.removeReaction(message.getId(), reaction.getReaction());
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'onBubbleReactionListItemClick: Reaction removal failed', error);
  }
  ctx.reactionListItemClick.emit(event);
}
