/**
 * Shared Media Bubble Utilities
 *
 * Extracted from cometchat-image-bubble and cometchat-video-bubble to consolidate
 * duplicate attachment extraction, caption extraction, sender info extraction,
 * and layout determination logic (~36 + 31 + 21 + 21 shared lines).
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from './CometChatLogger';
import { MediaAttachment, MediaLayoutType } from '../modals/MediaAttachment';

/**
 * Extracts media attachments from a CometChat message.
 *
 * @param message - The CometChat media message
 * @param mediaType - The type of media ('image' or 'video')
 * @param logPrefix - Prefix for warning/error log messages
 * @returns Array of MediaAttachment objects
 */
export function extractMediaAttachments(
  message: CometChat.MediaMessage | null | undefined,
  mediaType: 'image' | 'video',
  logPrefix: string
): MediaAttachment[] {
  if (!message) {
    CometChatLogger.warn(logPrefix, 'Message is null or undefined');
    return [];
  }

  try {
    const rawAttachments = message.getAttachments();

    if (!rawAttachments || !Array.isArray(rawAttachments)) {
      CometChatLogger.warn(logPrefix, 'Message has no attachments or attachments is not an array');
      return [];
    }

    // Both the message-level thumbnail and the thumbnail-generation extension describe ONE image, so
    // they are only meaningful when the message carries a single attachment. Applying them to every
    // attachment of a batch gave each tile the same displayUrl, so the grid rendered the same picture
    // repeated instead of the distinct images that were sent. A batch attachment falls back to its
    // OWN thumbnail, then its own full url.
    const isSingleAttachment = rawAttachments.length === 1;

    // Thumbnail may be stored at message metadata level (e.g. from mock data or some SDK versions)
    const messageMeta = (message as any).getMetadata?.() || {};
    const messageLevelThumbnail: string | undefined =
      isSingleAttachment && typeof messageMeta?.thumbnail === 'string' ? messageMeta.thumbnail : undefined;

    // CometChat Thumbnail Generation extension stores compressed URLs in:
    //   metadata["@injected"]["extensions"]["thumbnail-generation"]["url_medium"] (images)
    //   metadata["@injected"]["extensions"]["thumbnail-generation"]["url_small"]  (videos)
    const thumbnailGenExt = messageMeta?.['@injected']?.['extensions']?.['thumbnail-generation'];
    const extensionThumbnailUrl: string | undefined = !isSingleAttachment
      ? undefined
      : mediaType === 'image'
        ? (typeof thumbnailGenExt?.['url_medium'] === 'string' ? thumbnailGenExt['url_medium'] : undefined)
        : (typeof thumbnailGenExt?.['url_small'] === 'string' ? thumbnailGenExt['url_small'] : undefined);

    const mediaAttachments: MediaAttachment[] = [];

    for (let i = 0; i < rawAttachments.length; i++) {
      const attachment = rawAttachments[i];

      if (!attachment || typeof attachment !== 'object') {
        CometChatLogger.warn(logPrefix, `Attachment at index ${i} is invalid (not an object)`);
        continue;
      }

      const url = (attachment as any).url || (attachment as any).getUrl?.();
      if (!url || typeof url !== 'string') {
        CometChatLogger.warn(logPrefix, `Attachment at index ${i} is missing URL, skipping`);
        continue;
      }

      const rawThumbnail = (attachment as any).thumbnail || (attachment as any).getThumbnail?.();
      const thumbnail =
        rawThumbnail && typeof rawThumbnail === 'string'
          ? rawThumbnail
          : messageLevelThumbnail;

      const metadata = (attachment as any).metadata || {};

      const mediaAttachment: MediaAttachment = {
        url,
        type: mediaType,
        // displayUrl: use extension thumbnail (low-quality) for bubble display.
        // Falls back to attachment-level thumbnail, then message-level thumbnail, then full url.
        // The fullscreen viewer always uses `url` (full quality) — never displayUrl.
        displayUrl: extensionThumbnailUrl ?? (thumbnail && typeof thumbnail === 'string' ? thumbnail : undefined) ?? url,
        thumbnail: thumbnail && typeof thumbnail === 'string' ? thumbnail : undefined,
        width: typeof metadata.width === 'number' ? metadata.width : undefined,
        height: typeof metadata.height === 'number' ? metadata.height : undefined,
        size: typeof metadata.size === 'number' ? metadata.size : undefined,
        mimeType: typeof metadata.mimeType === 'string' ? metadata.mimeType : undefined,
        raw: attachment as CometChat.Attachment,
      };

      // Add duration for video attachments
      if (mediaType === 'video' && typeof metadata.duration === 'number') {
        mediaAttachment.duration = metadata.duration;
      }

      mediaAttachments.push(mediaAttachment);
    }

    return mediaAttachments;
  } catch (error) {
    CometChatLogger.error(logPrefix, 'Error extracting attachments:', error);
    return [];
  }
}

/**
 * Extracts caption text from a CometChat message.
 *
 * Tries getText() first, then falls back to getData()?.text.
 *
 * @param message - The CometChat message
 * @param logPrefix - Prefix for warning log messages
 * @returns The caption string, or empty string if not found
 */
export function extractMediaCaption(
  message: CometChat.MediaMessage | null | undefined,
  logPrefix: string
): string {
  if (!message) {
    return '';
  }

  try {
    const textFromGetText = (message as any).getText?.();
    if (textFromGetText && typeof textFromGetText === 'string' && textFromGetText.trim() !== '') {
      return textFromGetText;
    }

    const data = (message as any).getData?.();
    if (data && typeof data === 'object') {
      const textFromData = data.text;
      if (textFromData && typeof textFromData === 'string' && textFromData.trim() !== '') {
        return textFromData;
      }
    }

    return '';
  } catch (error) {
    CometChatLogger.warn(logPrefix, 'Error extracting caption, returning empty string:', error);
    return '';
  }
}

/**
 * Extracts sender name and avatar URL from a CometChat message.
 *
 * @param message - The CometChat message
 * @param logPrefix - Prefix for warning log messages
 * @returns Object with senderName and senderAvatarUrl
 */
export function extractSenderInfo(
  message: CometChat.MediaMessage | null | undefined,
  logPrefix: string
): { senderName: string; senderAvatarUrl: string } {
  if (!message) {
    return { senderName: '', senderAvatarUrl: '' };
  }

  try {
    const sender = (message as any).getSender?.();
    if (sender) {
      return {
        senderName: sender.getName?.() || sender.name || '',
        senderAvatarUrl: sender.getAvatar?.() || sender.avatar || '',
      };
    }
    return { senderName: '', senderAvatarUrl: '' };
  } catch (error) {
    CometChatLogger.warn(logPrefix, 'Error extracting sender info:', error);
    return { senderName: '', senderAvatarUrl: '' };
  }
}

/**
 * Determines the layout type based on attachment count.
 *
 * @param attachmentCount - Number of attachments
 * @returns Object with layoutType and overflowCount
 */
export function determineMediaLayout(attachmentCount: number): {
  layoutType: MediaLayoutType;
  overflowCount: number;
} {
  if (attachmentCount === 1) {
    return { layoutType: 'single', overflowCount: 0 };
  } else if (attachmentCount >= 2 && attachmentCount <= 3) {
    return { layoutType: 'grid', overflowCount: 0 };
  } else if (attachmentCount === 4) {
    return { layoutType: 'grid-2x2', overflowCount: 0 };
  } else if (attachmentCount > 4) {
    return { layoutType: 'overflow', overflowCount: attachmentCount - 4 };
  }
  // attachmentCount === 0
  return { layoutType: 'single', overflowCount: 0 };
}
