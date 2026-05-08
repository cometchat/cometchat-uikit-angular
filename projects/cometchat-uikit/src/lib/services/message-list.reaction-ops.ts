/**
 * Reaction operation functions for MessageListService.
 * Extracted to reduce service file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';

export interface ReactionOpsContext {
  messageIdMap: Map<number, CometChat.BaseMessage>;
  errorCallback: any;
  normalizeMessageId: (id: string | number) => number;
  updateMessageReactions: (id: number, reactions: CometChat.ReactionCount[]) => boolean;
}

export async function addReactionImpl(ctx: ReactionOpsContext, messageId: number, emoji: string): Promise<void> {
  const message = ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
  if (!message) {
    const error = new Error(`[MessageListService] addReaction: Message with ID ${messageId} not found`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  const originalReactions = message.getReactions() || [];
  const updatedReactions: CometChat.ReactionCount[] = [];
  let reactionFound = false;
  originalReactions.forEach(reaction => {
    if (reaction.getReaction() === emoji) {
      reaction.setCount(reaction.getCount() + 1);
      reaction.setReactedByMe(true);
      updatedReactions.push(reaction);
      reactionFound = true;
    } else {
      updatedReactions.push(reaction);
    }
  });
  if (!reactionFound) { const newReaction = new CometChat.ReactionCount(emoji, 1, true); updatedReactions.push(newReaction); }
  ctx.updateMessageReactions(messageId, updatedReactions);
  try {
    await CometChat.addReaction(messageId, emoji);
  } catch (error) {
    CometChatLogger.error('MessageListService', 'addReaction: Failed to add reaction', error);
    ctx.updateMessageReactions(messageId, originalReactions);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
  }
}

export async function removeReactionImpl(ctx: ReactionOpsContext, messageId: number, emoji: string): Promise<void> {
  const message = ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
  if (!message) {
    const error = new Error(`[MessageListService] removeReaction: Message with ID ${messageId} not found`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  const originalReactions = message.getReactions() || [];
  const updatedReactions: CometChat.ReactionCount[] = [];
  originalReactions.forEach(reaction => {
    if (reaction.getReaction() === emoji) {
      if (reaction.getCount() > 1) { reaction.setCount(reaction.getCount() - 1); reaction.setReactedByMe(false); updatedReactions.push(reaction); }
    } else {
      updatedReactions.push(reaction);
    }
  });
  ctx.updateMessageReactions(messageId, updatedReactions);
  try {
    await CometChat.removeReaction(messageId, emoji);
  } catch (error) {
    CometChatLogger.error('MessageListService', 'removeReaction: Failed to remove reaction', error);
    ctx.updateMessageReactions(messageId, originalReactions);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
  }
}

export async function fetchReactionsImpl(ctx: ReactionOpsContext, messageId: number, builder?: CometChat.ReactionsRequestBuilder): Promise<CometChat.Reaction[]> {
  try {
    let reactionsRequestBuilder: CometChat.ReactionsRequestBuilder;
    if (builder) { reactionsRequestBuilder = builder.setMessageId(messageId); } else {
      reactionsRequestBuilder = new CometChat.ReactionsRequestBuilder().setMessageId(messageId);
    }
    const reactionsRequest = reactionsRequestBuilder.build();
    const reactions: CometChat.Reaction[] = await reactionsRequest.fetchNext();
    return reactions;
  } catch (error) {
    CometChatLogger.error('MessageListService', 'fetchReactions: Failed to fetch reactions', error);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
    return [];
  }
}
