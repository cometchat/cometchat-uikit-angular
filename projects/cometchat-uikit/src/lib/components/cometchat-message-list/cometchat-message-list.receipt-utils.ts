/**
 * Read/delivery receipt utilities for CometChatMessageList component.
 *
 * Extracted from cometchat-message-list.component.ts to isolate
 * receipt classification, sender/receiver detection, and unread count logic.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Sender / Receiver Classification ====================

/**
 * Checks whether a message was sent by the logged-in user.
 *
 * @param message - The message to check
 * @param loggedInUid - UID of the currently logged-in user
 */
export function isSenderMessage(
  message: CometChat.BaseMessage,
  loggedInUid: string
): boolean {
  const sender = message.getSender();
  return !!sender && sender.getUid() === loggedInUid;
}

/**
 * Checks whether a message was received from another user (not the logged-in user).
 *
 * @param message - The message to check
 * @param loggedInUid - UID of the currently logged-in user
 */
export function isReceiverMessage(
  message: CometChat.BaseMessage,
  loggedInUid: string
): boolean {
  return !isSenderMessage(message, loggedInUid);
}

// ==================== Receipt Eligibility ====================

/**
 * Checks whether a message is eligible to be marked as read.
 * Only unread receiver messages that haven't been deleted are eligible.
 *
 * @param message - The message to check
 * @param loggedInUid - UID of the currently logged-in user
 */
export function isEligibleForReadReceipt(
  message: CometChat.BaseMessage,
  loggedInUid: string
): boolean {
  if (isSenderMessage(message, loggedInUid)) return false;
  if (message.getDeletedAt()) return false;
  if (message.getReadAt()) return false; // Already read
  return true;
}

// ==================== Latest Receiver Message ====================

/**
 * Finds the latest (highest ID) receiver message from a list.
 * Used to send a single read receipt for all unread messages.
 *
 * @param messages - Array of messages to search
 * @param loggedInUid - UID of the currently logged-in user
 */
export function getLatestReceiverMessage(
  messages: CometChat.BaseMessage[],
  loggedInUid: string
): CometChat.BaseMessage | null {
  let latest: CometChat.BaseMessage | null = null;
  for (const msg of messages) {
    if (!isReceiverMessage(msg, loggedInUid)) continue;
    if (!latest || (msg.getId() ?? 0) > (latest.getId() ?? 0)) {
      latest = msg;
    }
  }
  return latest;
}

// ==================== Unread Count Helpers ====================

/**
 * Counts the number of unread receiver messages in a list.
 *
 * @param messages - Array of messages to count
 * @param loggedInUid - UID of the currently logged-in user
 */
export function countUnreadMessages(
  messages: CometChat.BaseMessage[],
  loggedInUid: string
): number {
  return messages.filter(msg => isEligibleForReadReceipt(msg, loggedInUid)).length;
}

// ==================== Conversation ID Helpers ====================

/**
 * Derives the conversation ID from a user or group.
 *
 * @param user - Active user (for 1-on-1 chats)
 * @param group - Active group (for group chats)
 */
export function getConversationId(
  user: CometChat.User | null,
  group: CometChat.Group | null
): string | null {
  if (user) return user.getUid();
  if (group) return group.getGuid();
  return null;
}

/**
 * Derives the conversation type string from a user or group.
 */
export function getConversationType(
  user: CometChat.User | null,
  group: CometChat.Group | null
): string {
  if (user) return CometChat.RECEIVER_TYPE.USER;
  if (group) return CometChat.RECEIVER_TYPE.GROUP;
  return '';
}

// ==================== Message Conversation Matching ====================

/**
 * Checks whether a message belongs to the currently active conversation.
 *
 * @param message - The incoming message
 * @param user - Active user (for 1-on-1 chats)
 * @param group - Active group (for group chats)
 * @param loggedInUid - UID of the currently logged-in user
 */
export function isMessageForCurrentConversation(
  message: CometChat.BaseMessage,
  user: CometChat.User | null,
  group: CometChat.Group | null,
  loggedInUid: string
): boolean {
  if (user) {
    const sender = message.getSender();
    const receiverId = message.getReceiverId();
    const senderUid = sender?.getUid();
    return (
      (senderUid === user.getUid() && receiverId === loggedInUid) ||
      (senderUid === loggedInUid && receiverId === user.getUid())
    );
  }
  if (group) {
    return message.getReceiverId() === group.getGuid();
  }
  return false;
}
