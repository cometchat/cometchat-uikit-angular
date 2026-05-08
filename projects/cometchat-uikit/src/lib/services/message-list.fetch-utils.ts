/**
 * Extracted fetch and receipt logic for MessageListService.
 */
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {WritableSignal} from '@angular/core';
import {CometChatLogger} from '../utils/CometChatLogger';
import {CometChatUIKit} from '../cometchat-uikit';
import {CometChatUIKitUtility} from '../CometChatUIKitUtility';
import {ErrorCallback} from './message-composer.service';
import {flushPendingSentMessages} from './message-list.sent-handler';

export interface FetchContext {
  messagesRequest: CometChat.MessagesRequest | null;
  nextMessagesRequest: CometChat.MessagesRequest | null;
  fetchGeneration: number;
  isAgentChatMode: boolean;
  parentMessageId: number | null;
  currentUser: CometChat.User | null;
  currentGroup: CometChat.Group | null;
  errorCallback: ErrorCallback | null;
  readonly DEFAULT_MESSAGE_LIMIT: number;
  loadingStateSignal: WritableSignal<boolean>;
  errorStateSignal: WritableSignal<Error | null>;
  prevMessageIdSignal: WritableSignal<number>;
  nextMessageIdSignal: WritableSignal<number>;
  allMessagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messageIdMap: Map<number, CometChat.BaseMessage>;
  messageMuidMap: Map<string, CometChat.BaseMessage>;
  normalizeMessageId(id: string | number): number;
  markInitialMessagesAsRead(): Promise<void>;
  buildMessagesRequest(messageId?: number): CometChat.MessagesRequest;
  buildNextMessagesRequest(messageId?: number): CometChat.MessagesRequest;
  clearMessagesAndState(): void;
}

export async function fetchPreviousMessagesImpl(ctx: FetchContext): Promise<boolean> {
  if (!ctx.messagesRequest) {
    CometChatLogger.warn('MessageListService', 'Cannot fetch messages: No conversation context set. Call setUser() or setGroup() first.');
    return false;
  }
  if (ctx.isAgentChatMode && ctx.parentMessageId === null) {
    CometChatLogger.warn('MessageListService', 'fetchPreviousMessages blocked in agent chat mode: parentMessageId is null. Messages are only fetched when loading a historical thread.');
    return false;
  }
  const generation = ctx.fetchGeneration;
  ctx.loadingStateSignal.set(true);
  try {
    const messages: CometChat.BaseMessage[] = await ctx.messagesRequest.fetchPrevious();
    if (generation !== ctx.fetchGeneration) return false;
    if (messages && messages.length > 0) {
      ctx.allMessagesSignal.update(current => [...messages, ...current]);
      ctx.messagesSignal.update(current => [...messages, ...current]);
      const oldestMessage = messages[0];
      const isFirstFetch = ctx.prevMessageIdSignal() === 0;
      ctx.prevMessageIdSignal.set(oldestMessage.getId());
      if (ctx.nextMessageIdSignal() === 0) {
        const newestMessage = messages[messages.length - 1];
        ctx.nextMessageIdSignal.set(newestMessage.getId());
        // Rebuild nextMessagesRequest with the anchor ID so fetchNext() has the required MessageId
        ctx.nextMessagesRequest = ctx.buildNextMessagesRequest(newestMessage.getId());
      }
      for (const message of messages) {
        const messageId = ctx.normalizeMessageId(message.getId());
        ctx.messageIdMap.set(messageId, message);
        const muid = message.getMuid?.();
        if (muid) { ctx.messageMuidMap.set(muid, message); }
      }
      if (isFirstFetch) {
        setTimeout(() => { ctx.markInitialMessagesAsRead(); }, 100);
      }
    }
    ctx.loadingStateSignal.set(false);
    flushPendingSentMessages(ctx);
    return messages.length === ctx.DEFAULT_MESSAGE_LIMIT;
  } catch (error) {
    if (generation !== ctx.fetchGeneration) return false;
    ctx.loadingStateSignal.set(false);
    ctx.errorStateSignal.set(error as Error);
    CometChatLogger.error('MessageListService', 'Error fetching previous messages:', error);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
    flushPendingSentMessages(ctx);
    return false;
  }
}

export async function fetchNextMessagesImpl(ctx: FetchContext): Promise<boolean> {
  if (!ctx.nextMessagesRequest) {
    CometChatLogger.warn('MessageListService', 'Cannot fetch next messages: No conversation context set. Call setUser() or setGroup() first.');
    return false;
  }
  const generation = ctx.fetchGeneration;
  ctx.loadingStateSignal.set(true);
  try {
    const messages: CometChat.BaseMessage[] = await ctx.nextMessagesRequest.fetchNext();
    if (generation !== ctx.fetchGeneration) return false;
    if (messages && messages.length > 0) {
      ctx.allMessagesSignal.update(current => [...current, ...messages]);
      ctx.messagesSignal.update(current => [...current, ...messages]);
      const newestMessage = messages[messages.length - 1];
      ctx.nextMessageIdSignal.set(newestMessage.getId());
      if (ctx.prevMessageIdSignal() === 0) { const oldestMessage = messages[0]; ctx.prevMessageIdSignal.set(oldestMessage.getId()); }
      for (const message of messages) {
        const messageId = ctx.normalizeMessageId(message.getId());
        ctx.messageIdMap.set(messageId, message);
        const muid = message.getMuid?.();
        if (muid) { ctx.messageMuidMap.set(muid, message); }
      }
    }
    ctx.loadingStateSignal.set(false);
    flushPendingSentMessages(ctx);
    return messages.length === ctx.DEFAULT_MESSAGE_LIMIT;
  } catch (error) {
    if (generation !== ctx.fetchGeneration) return false;
    ctx.loadingStateSignal.set(false);
    ctx.errorStateSignal.set(error as Error);
    CometChatLogger.error('MessageListService', 'Error fetching next messages:', error);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
    flushPendingSentMessages(ctx);
    return false;
  }
}

export async function fetchMessagesAroundIdImpl(ctx: FetchContext, messageId: number): Promise<void> {
  if (!ctx.currentUser && !ctx.currentGroup) {
    const error = new Error('[MessageListService] Cannot fetch messages around ID: No conversation context set. Call setUser() or setGroup() first.');
    CometChatLogger.error('MessageListService', error.message);
    ctx.errorStateSignal.set(error);
    throw error;
  }
  ctx.clearMessagesAndState();
  const generation = ctx.fetchGeneration;
  ctx.loadingStateSignal.set(true);
  try {
    const beforeRequest = ctx.buildMessagesRequest(messageId);
    const messagesBefore: CometChat.BaseMessage[] = await beforeRequest.fetchPrevious();
    if (generation !== ctx.fetchGeneration) { return; }
    let messagesAfter: CometChat.BaseMessage[] = [];
    let targetMessage: CometChat.BaseMessage | null = null;
    if (messagesBefore.length > 0) {
      const afterAnchorId = messagesBefore[messagesBefore.length - 1].getId();
      const afterRequest = ctx.buildNextMessagesRequest(afterAnchorId);
      messagesAfter = await afterRequest.fetchNext();
    } else {
      try { targetMessage = await CometChat.getMessageDetails(messageId); } catch (e) { CometChatLogger.error('MessageListService', 'Failed to fetch target message:', e); }
      const afterRequest = ctx.buildNextMessagesRequest(messageId);
      messagesAfter = await afterRequest.fetchNext();
    }
    if (generation !== ctx.fetchGeneration) { return; }
    const allMessages: CometChat.BaseMessage[] = [
      ...messagesBefore,
      ...(targetMessage ? [targetMessage] : []),
      ...messagesAfter,
    ];
    const seenIds = new Set<number>();
    const uniqueMessages = allMessages.filter(m => { const id = m.getId(); if (seenIds.has(id)) return false; seenIds.add(id); return true; });
    if (uniqueMessages.length > 0) {
      ctx.allMessagesSignal.set(uniqueMessages);
      ctx.messagesSignal.set(uniqueMessages);
      ctx.prevMessageIdSignal.set(uniqueMessages[0].getId());
      ctx.nextMessageIdSignal.set(uniqueMessages[uniqueMessages.length - 1].getId());
      for (const message of uniqueMessages) {
        const msgId = ctx.normalizeMessageId(message.getId());
        ctx.messageIdMap.set(msgId, message);
        const muid = message.getMuid?.();
        if (muid) { ctx.messageMuidMap.set(muid, message); }
      }
    }
    const oldestId = ctx.prevMessageIdSignal();
    const newestId = ctx.nextMessageIdSignal();
    ctx.messagesRequest = ctx.buildMessagesRequest(oldestId || undefined);
    ctx.nextMessagesRequest = ctx.buildNextMessagesRequest(newestId || undefined);
    ctx.loadingStateSignal.set(false);
    flushPendingSentMessages(ctx);
  } catch (error) {
    if (generation !== ctx.fetchGeneration) { return; }
    ctx.loadingStateSignal.set(false);
    ctx.errorStateSignal.set(error as Error);
    CometChatLogger.error('MessageListService', 'Error fetching messages around ID:', error);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
    flushPendingSentMessages(ctx);
  }
}

export interface ReceiptContext {
  currentGroup: CometChat.Group | null;
  currentUser: CometChat.User | null;
  allMessagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messageIdMap: Map<number, CometChat.BaseMessage>;
  messageMuidMap: Map<string, CometChat.BaseMessage>;
  normalizeMessageId(id: string | number): number;
}

export function handleReceiptImpl(ctx: ReceiptContext, receipt: CometChat.MessageReceipt, isGroupReceipt: boolean): void {
  if (ctx.currentGroup && !isGroupReceipt) { return; }
  if (ctx.currentUser && isGroupReceipt) { return; }
  const messageIdStr = receipt.getMessageId();
  const messageId = parseInt(messageIdStr, 10);
  if (isNaN(messageId)) { CometChatLogger.warn('MessageListService', 'Invalid message ID in receipt:', messageIdStr); return; }
  const readAt = receipt.getReadAt();
  const deliveredAt = receipt.getDeliveredAt();
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  if (!loggedInUser) { return; }
  const loggedInUserId = loggedInUser.getUid();
  let needsUpdate = false;
  ctx.allMessagesSignal.update(current => {
    let targetIndex = current.findIndex(m => ctx.normalizeMessageId(m.getId()) === messageId);
    if (targetIndex === -1) { targetIndex = current.length - 1; }
    const updated = [...current];
    for (let i = targetIndex; i >= 0; i--) {
      const msg = updated[i];
      const sender = msg.getSender();
      const senderUid = sender ? sender.getUid() : '';
      if (senderUid !== loggedInUserId) { continue; }
      const msgId = ctx.normalizeMessageId(msg.getId());
      if (msgId > messageId && msgId !== 0) { continue; }
      if (readAt) {
        if (msg.getReadAt()) { break; }
        const cloned = CometChatUIKitUtility.clone(msg);
        cloned.setReadAt(readAt);
        if (!cloned.getDeliveredAt()) { cloned.setDeliveredAt(readAt); }
        updated[i] = cloned;
        const clonedId = ctx.normalizeMessageId(cloned.getId());
        if (clonedId) { ctx.messageIdMap.set(clonedId, cloned); }
        const clonedMuid = cloned.getMuid?.();
        if (clonedMuid) { ctx.messageMuidMap.set(clonedMuid, cloned); }
        needsUpdate = true;
      } else if (deliveredAt) {
        if (msg.getDeliveredAt()) { break; }
        const cloned = CometChatUIKitUtility.clone(msg);
        cloned.setDeliveredAt(deliveredAt);
        updated[i] = cloned;
        const clonedId = ctx.normalizeMessageId(cloned.getId());
        if (clonedId) { ctx.messageIdMap.set(clonedId, cloned); }
        const clonedMuid = cloned.getMuid?.();
        if (clonedMuid) { ctx.messageMuidMap.set(clonedMuid, cloned); }
        needsUpdate = true;
      }
    }
    return needsUpdate ? updated : current;
  });
  if (needsUpdate) {
    ctx.messagesSignal.update(current => {
      let targetIndex = current.findIndex(m => ctx.normalizeMessageId(m.getId()) === messageId);
      if (targetIndex === -1) { targetIndex = current.length - 1; }
      const updated = [...current];
      for (let i = targetIndex; i >= 0; i--) {
        const msg = updated[i];
        const sender = msg.getSender();
        const senderUid = sender ? sender.getUid() : '';
        if (senderUid !== loggedInUserId) { continue; }
        const msgId = ctx.normalizeMessageId(msg.getId());
        if (msgId > messageId && msgId !== 0) { continue; }
        if (readAt) {
          if (msg.getReadAt()) { break; }
          const cloned = ctx.messageIdMap.get(ctx.normalizeMessageId(msgId)) || CometChatUIKitUtility.clone(msg);
          if (!cloned.getReadAt()) { cloned.setReadAt(readAt); if (!cloned.getDeliveredAt()) { cloned.setDeliveredAt(readAt); } }
          updated[i] = cloned;
        } else if (deliveredAt) {
          if (msg.getDeliveredAt()) { break; }
          const cloned = ctx.messageIdMap.get(ctx.normalizeMessageId(msg.getId())) || CometChatUIKitUtility.clone(msg);
          if (!cloned.getDeliveredAt()) { cloned.setDeliveredAt(deliveredAt); }
          updated[i] = cloned;
        }
      }
      return updated;
    });
  }
}
