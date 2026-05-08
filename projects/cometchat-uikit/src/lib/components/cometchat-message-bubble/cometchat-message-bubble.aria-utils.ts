/**
 * ARIA / accessibility utilities for CometChatMessageBubble component.
 *
 * Extracted from cometchat-message-bubble.component.ts to isolate
 * accessible label generation and screen-reader text helpers.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitConstants } from '../../constants';

// ==================== Accessible Label ====================

/**
 * Builds the full accessible label for a message bubble.
 * Combines sender name, message type, content preview, timestamp, and reactions.
 */
export function getMessageBubbleAriaLabel(
  message: CometChat.BaseMessage,
  loggedInUid: string,
  formattedTimestamp: string
): string {
  const parts: string[] = [];

  // Sender
  const sender = message.getSender();
  const senderName = sender?.getName() || '';
  const isOutgoing = sender?.getUid() === loggedInUid;
  if (isOutgoing) {
    parts.push(CometChatLocalize.getLocalizedString('message_bubble_you'));
  } else if (senderName) {
    parts.push(senderName);
  }

  // Deleted
  if (message.getDeletedAt()) {
    parts.push(CometChatLocalize.getLocalizedString('message_deleted'));
    if (formattedTimestamp) parts.push(formattedTimestamp);
    return parts.join(', ');
  }

  // Content preview
  const preview = getContentPreview(message);
  if (preview) parts.push(preview);

  // Timestamp
  if (formattedTimestamp) parts.push(formattedTimestamp);

  // Reactions
  const reactions = (message as any).getReactions?.() as CometChat.ReactionCount[] | undefined;
  if (reactions && reactions.length > 0) {
    const reactionSummary = getReactionsSummary(reactions);
    if (reactionSummary) parts.push(reactionSummary);
  }

  return parts.join(', ');
}

/**
 * Returns a short content preview string for a message.
 */
export function getContentPreview(message: CometChat.BaseMessage): string {
  const type = message.getType();
  const category = message.getCategory();

  if (category === 'action') {
    return (message as CometChat.Action).getMessage?.() || '';
  }
  if (category === 'call') {
    return CometChatLocalize.getLocalizedString('message_bubble_call');
  }

  switch (type) {
    case CometChatUIKitConstants.MessageTypes.text:
      return truncateText((message as CometChat.TextMessage).getText() || '', 100);
    case CometChatUIKitConstants.MessageTypes.image:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
    case CometChatUIKitConstants.MessageTypes.video:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
    case CometChatUIKitConstants.MessageTypes.audio:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
    case CometChatUIKitConstants.MessageTypes.file:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
    default:
      return type;
  }
}

/**
 * Returns a summary string for a set of reactions.
 * e.g. "👍 3, ❤️ 1"
 */
export function getReactionsSummary(reactions: CometChat.ReactionCount[]): string {
  if (!reactions || reactions.length === 0) return '';
  return reactions
    .map(r => `${r.getReaction()} ${r.getCount()}`)
    .join(', ');
}

/**
 * Returns the message type label for accessibility.
 */
export function getMessageTypeLabel(message: CometChat.BaseMessage): string {
  const type = message.getType();
  const category = message.getCategory();

  if (category === 'action') return CometChatLocalize.getLocalizedString('message_bubble_action');
  if (category === 'call') return CometChatLocalize.getLocalizedString('message_bubble_call');

  switch (type) {
    case CometChatUIKitConstants.MessageTypes.text:
      return CometChatLocalize.getLocalizedString('message_bubble_text');
    case CometChatUIKitConstants.MessageTypes.image:
      return CometChatLocalize.getLocalizedString('message_bubble_image');
    case CometChatUIKitConstants.MessageTypes.video:
      return CometChatLocalize.getLocalizedString('message_bubble_video');
    case CometChatUIKitConstants.MessageTypes.audio:
      return CometChatLocalize.getLocalizedString('message_bubble_audio');
    case CometChatUIKitConstants.MessageTypes.file:
      return CometChatLocalize.getLocalizedString('message_bubble_file');
    default:
      return type;
  }
}

// ==================== Helpers ====================

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
