/**
 * Message options utilities for CometChatMessageList component.
 *
 * Extracted from cometchat-message-list.component.ts to isolate
 * context menu option building and message action resolution.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitConstants } from '../../constants';

// ==================== Option IDs ====================

export const MESSAGE_OPTION_IDS = {
  EDIT: 'edit',
  DELETE: 'delete',
  REPLY: 'reply',
  REPLY_IN_THREAD: 'replyInThread',
  COPY: 'copy',
  TRANSLATE: 'translate',
  REACT: 'react',
  MESSAGE_INFO: 'messageInfo',
  MESSAGE_PRIVATELY: 'messagePrivately',
  MARK_AS_UNREAD: 'markAsUnread',
  FLAG: 'flag',
} as const;

// ==================== Default Option Builders ====================

/**
 * Checks whether a message can be edited by the logged-in user.
 */
export function canEditMessage(
  message: CometChat.BaseMessage,
  loggedInUid: string
): boolean {
  if (message.getDeletedAt()) return false;
  if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) return false;
  const sender = message.getSender();
  return !!sender && sender.getUid() === loggedInUid;
}

/**
 * Checks whether a message can be deleted by the logged-in user.
 */
export function canDeleteMessage(
  message: CometChat.BaseMessage,
  loggedInUid: string
): boolean {
  if (message.getDeletedAt()) return false;
  const sender = message.getSender();
  return !!sender && sender.getUid() === loggedInUid;
}

/**
 * Checks whether a message can be replied to.
 */
export function canReplyToMessage(message: CometChat.BaseMessage): boolean {
  if (message.getDeletedAt()) return false;
  const category = message.getCategory();
  return category !== 'action' && category !== 'call';
}

/**
 * Checks whether a message can be copied to clipboard.
 */
export function canCopyMessage(message: CometChat.BaseMessage): boolean {
  if (message.getDeletedAt()) return false;
  return message.getType() === CometChatUIKitConstants.MessageTypes.text;
}

/**
 * Checks whether a message can be translated.
 */
export function canTranslateMessage(message: CometChat.BaseMessage): boolean {
  if (message.getDeletedAt()) return false;
  return message.getType() === CometChatUIKitConstants.MessageTypes.text;
}

/**
 * Checks whether a message can have reactions added.
 */
export function canReactToMessage(message: CometChat.BaseMessage): boolean {
  if (message.getDeletedAt()) return false;
  const category = message.getCategory();
  return category !== 'action' && category !== 'call';
}

// ==================== Message Preview Helpers ====================

/**
 * Returns a short preview string for a message (used in accessibility announcements).
 *
 * @param message - The message to preview
 * @param maxLength - Maximum preview length
 */
export function getMessagePreview(
  message: CometChat.BaseMessage,
  maxLength = 50
): string {
  if (message.getDeletedAt()) {
    return CometChatLocalize.getLocalizedString('message_deleted');
  }

  const type = message.getType();
  switch (type) {
    case CometChatUIKitConstants.MessageTypes.text: {
      const text = (message as CometChat.TextMessage).getText() || '';
      return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
    }
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
 * Checks whether a message is a media message (image, video, audio, file).
 */
export function isMediaMessage(message: CometChat.BaseMessage): boolean {
  const type = message.getType();
  return (
    type === CometChatUIKitConstants.MessageTypes.image ||
    type === CometChatUIKitConstants.MessageTypes.video ||
    type === CometChatUIKitConstants.MessageTypes.audio ||
    type === CometChatUIKitConstants.MessageTypes.file
  );
}
