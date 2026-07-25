/**
 * Message CRUD operation functions for MessageListService.
 * Extracted to reduce service file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { CometChatUIKitConstants } from '../constants';

export interface MessageOpsContext {
  messagesSignal: any;
  allMessagesSignal: any;
  messageIdMap: Map<number, CometChat.BaseMessage>;
  messageMuidMap: Map<string, CometChat.BaseMessage>;
  nextMessageIdSignal: any;
  errorCallback: any;
  normalizeMessageId: (id: string | number) => number;
  updateMessageById: (id: number, msg: CometChat.BaseMessage) => boolean;
  updateMessageReactions: (id: number, reactions: CometChat.ReactionCount[]) => boolean;
}

/**
 * The subset of the service needed to tell whether a message is already listed.
 * Kept separate so the fetch helpers can reuse the check without depending on
 * the full message-ops surface.
 */
export interface MessageLookupContext {
  messageIdMap: Map<number, CometChat.BaseMessage>;
  messageMuidMap: Map<string, CometChat.BaseMessage>;
  normalizeMessageId: (id: string | number) => number;
}

/**
 * Reports whether a message is already in the list.
 *
 * Matches on muid first so a message added optimistically is recognised when the
 * server copy of it arrives, then falls back to id. Both lookups are guarded:
 * a message that has not been sent yet carries a muid but no usable id, and
 * treating those absent ids as equal would collapse distinct pending messages
 * into one. Negative ids are sentinels (the streaming placeholder) and are
 * matched by muid rather than id.
 */
export function isDuplicateMessageImpl(ctx: MessageLookupContext, message: CometChat.BaseMessage): boolean {
  const muid = message.getMuid?.();
  if (muid && ctx.messageMuidMap.has(muid)) { return true; }
  const rawId = message.getId();
  if (!rawId) { return false; }
  const messageId = ctx.normalizeMessageId(rawId);
  return messageId > 0 && ctx.messageIdMap.has(messageId);
}

export function addMessageImpl(ctx: MessageOpsContext, message: CometChat.BaseMessage): void {
  // A message can be pushed at us more than once — a socket re-delivery after a
  // reconnect, or a re-emitted event — and appending it again renders it twice.
  if (isDuplicateMessageImpl(ctx, message)) { return; }
  ctx.allMessagesSignal.update((current: CometChat.BaseMessage[]) => [...current, message]);
  ctx.messagesSignal.update((current: CometChat.BaseMessage[]) => [...current, message]);
  const messageId = ctx.normalizeMessageId(message.getId());
  ctx.messageIdMap.set(messageId, message);
  const muid = message.getMuid?.();
  if (muid) { ctx.messageMuidMap.set(muid, message); }
  if (messageId > ctx.nextMessageIdSignal()) { ctx.nextMessageIdSignal.set(messageId); }
}

export function updateMessageByIdImpl(ctx: MessageOpsContext, messageId: number, message: CometChat.BaseMessage): boolean {
  const normalizedId = ctx.normalizeMessageId(messageId);
  const index = ctx.allMessagesSignal().findIndex((m: CometChat.BaseMessage) => ctx.normalizeMessageId(m.getId()) === normalizedId);
  if (index === -1) { CometChatLogger.warn('MessageListService', `Message with ID ${messageId} not found for update`); return false; }
  ctx.allMessagesSignal.update((current: CometChat.BaseMessage[]) => { const u = [...current]; u[index] = message; return u; });
  const mi = ctx.messagesSignal().findIndex((m: CometChat.BaseMessage) => ctx.normalizeMessageId(m.getId()) === normalizedId);
  if (mi !== -1) ctx.messagesSignal.update((current: CometChat.BaseMessage[]) => { const u = [...current]; u[mi] = message; return u; });
  ctx.messageIdMap.set(normalizedId, message);
  const muid = message.getMuid?.(); if (muid) ctx.messageMuidMap.set(muid, message);
  return true;
}

export function updateMessageByMuidImpl(ctx: MessageOpsContext, muid: string, message: CometChat.BaseMessage): boolean {
  const existing = ctx.messageMuidMap.get(muid);
  if (!existing) { CometChatLogger.warn('MessageListService', `Message with MUID ${muid} not found for update`); return false; }
  const index = ctx.allMessagesSignal().findIndex((m: CometChat.BaseMessage) => m.getMuid?.() === muid);
  if (index === -1) { CometChatLogger.warn('MessageListService', `Message with MUID ${muid} found in map but not in array`); ctx.messageMuidMap.delete(muid); return false; }
  const oldId = existing.getId();
  ctx.allMessagesSignal.update((current: CometChat.BaseMessage[]) => { const u = [...current]; u[index] = message; return u; });
  const mi = ctx.messagesSignal().findIndex((m: CometChat.BaseMessage) => m.getMuid?.() === muid);
  if (mi !== -1) ctx.messagesSignal.update((current: CometChat.BaseMessage[]) => { const u = [...current]; u[mi] = message; return u; });
  const newId = message.getId(); if (newId) ctx.messageIdMap.set(ctx.normalizeMessageId(newId), message);
  if (oldId && oldId !== newId) ctx.messageIdMap.delete(ctx.normalizeMessageId(oldId));
  const newMuid = message.getMuid?.(); if (newMuid) ctx.messageMuidMap.set(newMuid, message);
  if (newMuid !== muid) ctx.messageMuidMap.delete(muid);
  return true;
}

export function deleteMessageImpl(ctx: MessageOpsContext, messageId: number): boolean {
  const existingMessage = ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
  if (!existingMessage) { CometChatLogger.warn('MessageListService', `Message with ID ${messageId} not found for deletion`); return false; }
  const deletedAtTimestamp = Math.floor(Date.now() / 1000);
  const clonedMessage = Object.create(Object.getPrototypeOf(existingMessage), Object.getOwnPropertyDescriptors(existingMessage)) as CometChat.BaseMessage;
  clonedMessage.setDeletedAt(deletedAtTimestamp);
  return ctx.updateMessageById(messageId, clonedMessage);
}

export async function editMessageImpl(ctx: MessageOpsContext, message: CometChat.BaseMessage, newText: string): Promise<CometChat.BaseMessage> {
  const existingMessage = ctx.messageIdMap.get(message.getId());
  if (!existingMessage) {
    const error = new Error(`[MessageListService] editMessage: Message with ID ${message.getId()} not found`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) {
    const error = new Error(`[MessageListService] editMessage: Only text messages can be edited`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  const textMessage = message as CometChat.TextMessage;
  const originalText = textMessage.getText();
  textMessage.setText(newText);
  ctx.updateMessageById(message.getId(), textMessage);
  try {
    const editedMessage = await CometChat.editMessage(textMessage);
    ctx.updateMessageById(editedMessage.getId(), editedMessage);
    return editedMessage;
  } catch (error) {
    CometChatLogger.error('MessageListService', 'editMessage: Failed to edit message', error);
    textMessage.setText(originalText);
    ctx.updateMessageById(message.getId(), textMessage);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
    return message;
  }
}

export function removeMessageImpl(ctx: MessageOpsContext, messageId: number): boolean {
  const existingMessage = ctx.messageIdMap.get(messageId);
  if (!existingMessage) { CometChatLogger.warn('MessageListService', `Message with ID ${messageId} not found for removal`); return false; }
  const muid = existingMessage.getMuid();
  ctx.allMessagesSignal.set(ctx.allMessagesSignal().filter((msg: CometChat.BaseMessage) => msg.getId() !== messageId));
  ctx.messagesSignal.set(ctx.messagesSignal().filter((msg: CometChat.BaseMessage) => msg.getId() !== messageId));
  ctx.messageIdMap.delete(messageId);
  if (muid) { ctx.messageMuidMap.delete(muid); }
  return true;
}

export function getMessageByIdImpl(ctx: MessageOpsContext, messageId: number): CometChat.BaseMessage | undefined {
  return ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
}

export function updateReplyCountImpl(ctx: MessageOpsContext, parentMessageId: number, count: number): boolean {
  const parentMessage = ctx.messageIdMap.get(parentMessageId);
  if (!parentMessage) { CometChatLogger.warn('MessageListService', `updateReplyCount: Parent message with ID ${parentMessageId} not found`); return false; }
  const cloned = CometChatUIKitUtility.clone(parentMessage); cloned.setReplyCount(count);
  return ctx.updateMessageById(parentMessageId, cloned);
}

export function updateMessageReactionsImpl(ctx: MessageOpsContext, messageId: number, reactions: CometChat.ReactionCount[]): boolean {
  const message = ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
  if (!message) { CometChatLogger.warn('MessageListService', `updateMessageReactions: Message with ID ${messageId} not found`); return false; }
  message.setReactions(reactions); return ctx.updateMessageById(messageId, message);
}

export function deduplicateMessagesImpl(_ctx: MessageOpsContext, messages: CometChat.BaseMessage[]): CometChat.BaseMessage[] {
  const seenIds = new Set<number>();
  const uniqueMessages: CometChat.BaseMessage[] = [];
  for (const message of messages) {
    const id = message.getId();
    if (!seenIds.has(id)) { seenIds.add(id); uniqueMessages.push(message); }
  }
  return uniqueMessages;
}

export function clearMessagesImpl(ctx: MessageOpsContext): void {
  ctx.allMessagesSignal.set([]);
  ctx.messagesSignal.set([]);
  ctx.messageIdMap.clear();
  ctx.messageMuidMap.clear();
  (ctx as any).prevMessageIdSignal?.set(0);
  ctx.nextMessageIdSignal.set(0);
}

export function clearMessagesAndStateImpl(ctx: MessageOpsContext): void {
  (ctx as any).fetchGeneration++;
  ctx.messagesSignal.set([]);
  ctx.allMessagesSignal.set([]);
  ctx.messageIdMap.clear();
  ctx.messageMuidMap.clear();
  (ctx as any).prevMessageIdSignal?.set(0);
  ctx.nextMessageIdSignal.set(0);
  (ctx as any).unreadCountSignal?.set(0);
  (ctx as any).errorStateSignal?.set(null);
  (ctx as any).messagesRequest = null;
  (ctx as any).nextMessagesRequest = null;
}
