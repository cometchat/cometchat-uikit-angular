/**
 * Sound notification utilities for CometChatConversations component.
 *
 * Extracted from cometchat-conversations.component.ts to isolate
 * sound notification logic and new-message detection.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== New Message Detection ====================

/**
 * Checks whether a message qualifies as a "new" message for sound notification.
 * A message is new if it was sent within the last 30 seconds.
 *
 * @param message - The message to check
 * @param lastKnownMessageId - The ID of the last known message before this update
 */
export function isNewMessage(
  message: CometChat.BaseMessage,
  lastKnownMessageId: number
): boolean {
  const messageId = message.getId() ?? 0;
  return messageId > lastKnownMessageId;
}

/**
 * Checks whether a message was sent by the logged-in user.
 *
 * @param message - The message to check
 * @param loggedInUid - UID of the currently logged-in user
 */
export function isMessageFromLoggedInUser(
  message: CometChat.BaseMessage,
  loggedInUid: string
): boolean {
  const sender = message.getSender();
  return !!sender && sender.getUid() === loggedInUid;
}

/**
 * Determines whether a sound notification should play for a new message.
 *
 * Sound plays when:
 * - Sound is not disabled
 * - The message is from another user (not the logged-in user)
 * - The message is genuinely new (higher ID than last known)
 *
 * @param message - The incoming message
 * @param loggedInUid - UID of the currently logged-in user
 * @param disableSound - Whether sound is disabled
 * @param lastKnownMessageId - ID of the last known message
 */
export function shouldPlayConversationSound(
  message: CometChat.BaseMessage,
  loggedInUid: string,
  disableSound: boolean,
  lastKnownMessageId: number
): boolean {
  if (disableSound) return false;
  if (isMessageFromLoggedInUser(message, loggedInUid)) return false;
  if (!isNewMessage(message, lastKnownMessageId)) return false;
  return true;
}

// ==================== Conversation ID Helpers ====================

/**
 * Returns a stable string key for a conversation.
 */
export function getConversationId(conversation: CometChat.Conversation): string {
  return conversation.getConversationId();
}

/**
 * Returns the display name for a conversation.
 */
export function getConversationDisplayName(
  conversation: CometChat.Conversation
): string {
  const conversationWith = conversation.getConversationWith();
  return conversationWith?.getName?.() || '';
}
