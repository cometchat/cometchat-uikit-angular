/**
 * Utility helpers for CometChatConversationItem component.
 *
 * Pure functions that operate on CometChat SDK objects,
 * keeping the component class lean.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Gets the avatar image URL for a conversation.
 */
export function getConversationAvatarImage(
  conversationWith: CometChat.User | CometChat.Group | null
): string {
  if (!conversationWith) return '';
  if (conversationWith instanceof CometChat.User) return conversationWith.getAvatar() || '';
  return (conversationWith as CometChat.Group).getIcon() || '';
}

/**
 * Gets the display name for a conversation participant.
 */
export function getConversationAvatarName(
  conversationWith: CometChat.User | CometChat.Group | null
): string {
  return conversationWith?.getName() || '';
}

/**
 * Gets the user status for a user conversation.
 */
export function getConversationUserStatus(
  conversationWith: CometChat.User | CometChat.Group | null
): string {
  if (conversationWith instanceof CometChat.User) {
    return conversationWith.getStatus() || 'offline';
  }
  return '';
}

/**
 * Gets the group type for a group conversation.
 */
export function getConversationGroupType(
  conversationWith: CometChat.User | CometChat.Group | null
): string {
  if (conversationWith instanceof CometChat.Group) {
    return conversationWith.getType() || '';
  }
  return '';
}

/**
 * Gets the receipt status for the last message.
 */
export function getReceiptStatus(
  lastMessage: CometChat.BaseMessage | undefined,
  isLastMessageByMe: boolean
): 'wait' | 'sent' | 'delivered' | 'read' | null {
  if (!lastMessage || !isLastMessageByMe || lastMessage.getDeletedAt()) return null;

  const category = lastMessage.getCategory();
  if (category === 'action' || category === 'call') return null;

  const readAt = lastMessage.getReadAt();
  const deliveredAt = lastMessage.getDeliveredAt();
  const sentAt = lastMessage.getSentAt();

  if (readAt) return 'read';
  if (deliveredAt) return 'delivered';
  if (sentAt) return 'sent';
  return 'wait';
}

/**
 * Checks if a string is a URL.
 */
export function isURL(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if a string contains a markdown link [text](url).
 */
export function hasMarkdownLink(text: string): boolean {
  return /\[([^\]]+)\]\(([^)]+)\)/.test(text);
}

/**
 * Gets the accessible label for a conversation item.
 */
export function getConversationAccessibleLabel(
  conversationWith: CometChat.User | CometChat.Group | null,
  subtitleText: string,
  unreadCount: number
): string {
  const name = conversationWith?.getName() || '';
  const parts = [name];
  if (subtitleText) {
    // Strip HTML tags from subtitle to produce valid aria-label text
    const plainText = subtitleText.replace(/<[^>]*>/g, '');
    if (plainText) parts.push(plainText);
  }
  if (unreadCount > 0) {
    parts.push(`${unreadCount} ${CometChatLocalize.getLocalizedString('conversation_unread_messages')}`);
  }
  return parts.join(', ');
}
