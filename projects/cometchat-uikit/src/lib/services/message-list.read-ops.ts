/**
 * Read/delivery/unread operation functions for MessageListService.
 * Extracted to reduce service file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { isRetryableError } from './message-list.error-utils';

export interface ReadOpsContext {
  messageIdMap: Map<number, CometChat.BaseMessage>;
  messagesSignal: any;
  allMessagesSignal: any;
  normalizeMessageId: (id: string | number) => number;
  updateMessageById: (id: number, msg: CometChat.BaseMessage) => boolean;
}

export async function markAsReadImpl(ctx: ReadOpsContext, message: CometChat.BaseMessage): Promise<void> {
  // Guard: don't attempt markAsRead on messages without a valid server ID
  // (e.g., pending/optimistic messages that haven't received their ID yet)
  if (!message.getId()) { return; }
  const maxRetries = 2;
  const retryDelays = [1000, 2000];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await CometChat.markAsRead(message);
      return;
    } catch (error: unknown) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryable = isRetryableError(error);
      if (!isRetryable || isLastAttempt) {
        CometChatLogger.error('MessageListService', `markAsRead: Failed after ${attempt + 1} attempt(s)`, { messageId: message.getId(), error, isRetryable });
        return;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
    }
  }
}

export function updateLocalReadStatusImpl(ctx: ReadOpsContext, messageIds: number[]): void {
  const idSet = new Set(messageIds.map(id => ctx.normalizeMessageId(id)));
  const updateMessages = (messages: CometChat.BaseMessage[]): CometChat.BaseMessage[] => {
    return messages.map(msg => {
      const msgId = ctx.normalizeMessageId(msg.getId());
      if (idSet.has(msgId) && !msg.getReadAt()) {
        const cloned = Object.create(Object.getPrototypeOf(msg), Object.getOwnPropertyDescriptors(msg)) as CometChat.BaseMessage;
        cloned.setReadAt(Math.floor(Date.now() / 1000));
        ctx.messageIdMap.set(msgId, cloned);
        return cloned;
      }
      return msg;
    });
  };
  ctx.allMessagesSignal.update(updateMessages);
  ctx.messagesSignal.update(updateMessages);
}

export async function markInitialMessagesAsReadImpl(ctx: ReadOpsContext, messages: CometChat.BaseMessage[], loggedInUser: CometChat.User | null, markAsRead: (msg: CometChat.BaseMessage) => Promise<void>): Promise<void> {
  if (messages.length === 0 || !loggedInUser) { return; }
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const sender = msg.getSender();
    if (!msg.getReadAt() && sender && sender.getUid() !== loggedInUser.getUid()) {
      try {
        await markAsRead(msg);
        const messageId = msg.getId();
        if (messageId) { updateLocalReadStatusImpl(ctx, [messageId]); }
        CometChatMessageEvents.ccMessageRead.next(msg);
        break;
      } catch (error) {
        CometChatLogger.error('MessageListService', 'Error marking messages as read on initial load:', error);
      }
    }
  }
}

export async function markAsDeliveredImpl(_ctx: ReadOpsContext, message: CometChat.BaseMessage): Promise<void> {
  try {
    await CometChat.markAsDelivered(message);
  } catch (error) {
    CometChatLogger.error('MessageListService', 'markAsDelivered: Failed to mark message as delivered', error);
  }
}

export async function markAsUnreadImpl(ctx: ReadOpsContext, message: CometChat.BaseMessage): Promise<CometChat.Conversation> {
  const messageId = message.getId();
  const existingMessage = ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
  if (!existingMessage) {
    const error = new Error(`[MessageListService] markAsUnread: Message with ID ${messageId} not found`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  try {
    const updatedConversation = await CometChat.markMessageAsUnread(existingMessage) as CometChat.Conversation;
    return updatedConversation;
  } catch (error) {
    CometChatLogger.error('MessageListService', 'markAsUnread: SDK call failed', error);
    throw error;
  }
}

export function getMessagesInRangeImpl(ctx: ReadOpsContext, startIndex: number, endIndex: number): CometChat.BaseMessage[] {
  const allMessages = ctx.allMessagesSignal();
  const totalCount = allMessages.length;
  if (totalCount === 0) { return []; }
  if (startIndex < 0 || endIndex < 0 || startIndex > endIndex || startIndex >= totalCount) {
    CometChatLogger.warn('MessageListService', `getMessagesInRange: Invalid range [${startIndex}, ${endIndex}] for totalCount ${totalCount}`);
    return [];
  }
  const clampedEndIndex = Math.min(endIndex, totalCount - 1);
  return allMessages.slice(startIndex, clampedEndIndex + 1);
}

export function getTotalMessageCountImpl(ctx: ReadOpsContext): number {
  return ctx.allMessagesSignal().length;
}
