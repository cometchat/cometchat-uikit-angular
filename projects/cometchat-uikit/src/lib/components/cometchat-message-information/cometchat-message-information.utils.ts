/**
 * Utility functions for CometChatMessageInformation component.
 */
import { DatePipe } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { ReceiptInfo, MAX_PREVIEW_LENGTH } from './cometchat-message-information.types';

/**
 * Formats a Unix timestamp (seconds) for accessibility announcements.
 * Returns a human-readable medium date/time string.
 */
export function formatTimestampForAccessibility(timestamp: number, datePipe: DatePipe): string {
  const date = new Date(timestamp * 1000);
  return datePipe.transform(date, 'medium') || '';
}

/**
 * Gets the aria-label for a receipt item.
 * Combines the receipt type (delivered/read), user name, and timestamp.
 */
export function getReceiptAriaLabel(
  receipt: ReceiptInfo,
  type: 'delivered' | 'read',
  datePipe: DatePipe
): string {
  const userName = receipt.user.getName();
  const timestamp = formatTimestampForAccessibility(receipt.timestamp, datePipe);

  if (type === 'read') {
    return CometChatLocalize.getLocalizedString('accessibility_read_by_user')
      .replace('{name}', userName)
      .replace('{time}', timestamp);
  }

  return CometChatLocalize.getLocalizedString('accessibility_delivered_to_user')
    .replace('{name}', userName)
    .replace('{time}', timestamp);
}

/**
 * Gets the truncated message preview text for a given message.
 * Returns localized descriptions for media messages.
 */
export function getMessagePreview(message: CometChat.BaseMessage): string {
  if (!message) return '';

  const messageType = message.getType();

  if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
    const text = (message as CometChat.TextMessage).getText() || '';
    return text.length > MAX_PREVIEW_LENGTH
      ? text.substring(0, MAX_PREVIEW_LENGTH) + '...'
      : text;
  }

  switch (messageType) {
    case CometChat.MESSAGE_TYPE.IMAGE:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
    case CometChat.MESSAGE_TYPE.VIDEO:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
    case CometChat.MESSAGE_TYPE.AUDIO:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
    case CometChat.MESSAGE_TYPE.FILE:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
    default:
      return CometChatLocalize.getLocalizedString('message');
  }
}

/**
 * Gets the icon URL for media messages, or null for non-media messages.
 */
export function getMediaIcon(message: CometChat.BaseMessage): string | null {
  if (!message) return null;
  switch (message.getType()) {
    case CometChat.MESSAGE_TYPE.IMAGE:
      return 'assets/conversations_image-message.svg';
    case CometChat.MESSAGE_TYPE.VIDEO:
      return 'assets/conversations_video-message.svg';
    case CometChat.MESSAGE_TYPE.AUDIO:
      return 'assets/conversations_audio-message.svg';
    case CometChat.MESSAGE_TYPE.FILE:
      return 'assets/conversations_file-message.svg';
    default:
      return null;
  }
}
