/**
 * Utility helpers for ConversationsService.
 * Contains error handling, retry logic, conversation update settings checks,
 * and receipt handling helpers.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatUIKitConstants } from '../constants';

// ─── Error Helpers ────────────────────────────────────────────────────────────

const RETRY_DELAYS = [1000, 2000, 4000] as const;
const MAX_RETRY_ATTEMPTS = 3;

export function isRecoverableError(error: unknown): boolean {
  if (!error) return false;
  const err = error as Record<string, unknown>;
  const msg = (typeof err['message'] === 'string' ? err['message'] : '').toLowerCase();
  const code = (typeof err['code'] === 'string' ? err['code'] : '') as string;
  const networkKeywords = ['network', 'timeout', 'connection', 'fetch', 'econnrefused', 'enotfound', 'etimedout', 'socket', 'offline'] as const;
  const recoverableCodes = ['ERR_NETWORK', 'ERR_TIMEOUT', 'ERR_CONNECTION_REFUSED', 'ERR_CONNECTION_RESET', 'NETWORK_ERROR', 'TIMEOUT_ERROR'] as const;
  return networkKeywords.some(k => msg.includes(k)) || recoverableCodes.some(c => code === c || msg.includes(c.toLowerCase()));
}

export function getUserFriendlyErrorMessage(error: unknown, context: string): string {
  if (!error) return 'An unknown error occurred';
  const msg = ((error as Record<string, unknown>)['message'] as string || '').toLowerCase();
  if (msg.includes('network') || msg.includes('offline')) return 'Unable to connect. Please check your internet connection and try again.';
  if (msg.includes('timeout')) return 'The request took too long. Please try again.';
  if (msg.includes('auth') || msg.includes('unauthorized')) return 'Authentication failed. Please log in again.';
  if (msg.includes('permission') || msg.includes('forbidden')) return "You don't have permission to perform this action.";
  if (msg.includes('not found') || msg.includes('404')) return 'The requested resource was not found.';
  if (msg.includes('server') || msg.includes('500')) return 'Server error. Please try again later.';
  switch (context) {
    case 'fetchConversations': return 'Failed to load conversations. Please try again.';
    case 'deleteConversation': return 'Failed to delete conversation. Please try again.';
    case 'fetchNextConversations': return 'Failed to load more conversations. Please try again.';
    default: return ((error as Record<string, unknown>)['message'] as string) || 'An error occurred. Please try again.';
  }
}

export function createEnhancedError(error: unknown, context: string): Error {
  const msg = getUserFriendlyErrorMessage(error, context);
  const enhanced = new Error(msg);
  (enhanced as Error & { originalError: unknown }).originalError = error;
  (enhanced as Error & { context: string }).context = context;
  return enhanced;
}

export async function handleErrorWithRetry(
  error: unknown,
  context: string,
  retryAttempts: Map<string, number>,
  setError: (e: Error) => void,
  retryFn?: () => Promise<void>
): Promise<void> {
  CometChatLogger.error('ConversationsService', `Error in ${context}:`, error);
  const currentAttempt = retryAttempts.get(context) || 0;

  if (isRecoverableError(error) && currentAttempt < MAX_RETRY_ATTEMPTS && retryFn) {
    retryAttempts.set(context, currentAttempt + 1);
    const delay = RETRY_DELAYS[currentAttempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
    await new Promise(resolve => setTimeout(resolve, delay));
    try {
      await retryFn();
      retryAttempts.delete(context);
      return;
    } catch (retryError) {
      return handleErrorWithRetry(retryError, context, retryAttempts, setError, retryFn);
    }
  }

  retryAttempts.delete(context);
  setError(createEnhancedError(error, context));
  throw createEnhancedError(error, context);
}

// ─── Conversation ID Helpers ──────────────────────────────────────────────────

export function getConversationEntityId(conversation: CometChat.Conversation): string {
  const convWith = conversation.getConversationWith();
  return convWith instanceof CometChat.User ? convWith.getUid() : (convWith as CometChat.Group).getGuid();
}

export function findConversationIndex(conversations: CometChat.Conversation[], entityId: string): number {
  return conversations.findIndex(conv => getConversationEntityId(conv) === entityId);
}

// ─── Conversation Update Settings ────────────────────────────────────────────

export function isAMessage(message: unknown): message is CometChat.BaseMessage {
  return (
    message instanceof CometChat.TextMessage ||
    message instanceof CometChat.MediaMessage ||
    message instanceof CometChat.CustomMessage ||
    message instanceof CometChat.InteractiveMessage ||
    message instanceof CometChat.Action ||
    message instanceof CometChat.Call
  );
}

export function shouldIncrementForCustomMessage(message: CometChat.CustomMessage): boolean {
  try {
    const metadata = message.getMetadata() as Record<string, unknown>;
    return (
      message.willUpdateConversation() ||
      (metadata && metadata.hasOwnProperty('incrementUnreadCount') && !!metadata['incrementUnreadCount']) ||
      (CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnCustomMessages?.() ?? false)
    );
  } catch { return false; }
}

export function shouldLastMessageAndUnreadCountBeUpdated(message: CometChat.BaseMessage): boolean {
  try {
    const settings = CometChatUIKit.conversationUpdateSettings;
    const isCustom = message.getCategory() === CometChatUIKitConstants.MessageCategory.custom;

    if (message.getParentMessageId() && !settings?.shouldUpdateOnMessageReplies?.()) return false;

    if (isCustom) {
      if (message.getParentMessageId() && settings?.shouldUpdateOnMessageReplies?.() && shouldIncrementForCustomMessage(message as CometChat.CustomMessage)) return true;
      return shouldIncrementForCustomMessage(message as CometChat.CustomMessage);
    }

    if (message.getCategory() === CometChatUIKitConstants.MessageCategory.action) {
      if (message.getType() === CometChatUIKitConstants.MessageTypes.groupMember) {
        return settings?.shouldUpdateOnGroupActions?.() ?? true;
      }
      return true;
    }

    if (
      message.getCategory() === CometChatUIKitConstants.MessageCategory.call &&
      (message.getType() === CometChatUIKitConstants.MessageTypes.audio || message.getType() === CometChatUIKitConstants.MessageTypes.video)
    ) {
      return settings?.shouldUpdateOnCallActivities?.() ?? true;
    }

    return true;
  } catch { return true; }
}

// ─── Receipt Handling ─────────────────────────────────────────────────────────

export function applyReceiptToConversations(
  conversations: CometChat.Conversation[],
  receipt: CometChat.MessageReceipt,
  isGroupReceipt: boolean
): { updated: boolean; conversations: CometChat.Conversation[] } {
  const receiptMessageId = parseInt(receipt.getMessageId(), 10);
  const readAt = receipt.getReadAt();
  const deliveredAt = receipt.getDeliveredAt();
  const sender = receipt.getSender();
  const receiverId = receipt.getReceiver();

  if (isNaN(receiptMessageId)) return { updated: false, conversations };

  let updated = false;
  for (let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i];
    const isGroup = conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group;
    if (isGroup !== isGroupReceipt) continue;

    const convWith = conversation.getConversationWith();
    const convId = convWith instanceof CometChat.User ? convWith.getUid() : (convWith as CometChat.Group).getGuid();

    const matches = isGroup ? convId === receiverId : convId === sender?.getUid?.();
    if (!matches) continue;

    const lastMessage = conversation.getLastMessage();
    if (!lastMessage) continue;

    const lastMessageId = lastMessage.getId();
    if (receiptMessageId >= lastMessageId || lastMessageId === 0) {
      if (readAt) {
        lastMessage.setReadAt(readAt);
        if (!lastMessage.getDeliveredAt()) lastMessage.setDeliveredAt(readAt);
      } else if (deliveredAt && !lastMessage.getReadAt()) {
        lastMessage.setDeliveredAt(deliveredAt);
      }
      conversation.setLastMessage(lastMessage);
      updated = true;
    }
    break;
  }

  return { updated, conversations };
}

// ─── Typing Indicator Key ─────────────────────────────────────────────────────

export function getTypingIndicatorKey(typingIndicator: CometChat.TypingIndicator): string {
  const receiverType = typingIndicator.getReceiverType();
  return receiverType === 'user'
    ? typingIndicator.getSender().getUid()
    : typingIndicator.getReceiverId();
}
