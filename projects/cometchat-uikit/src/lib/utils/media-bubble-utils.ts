/**
 * Shared Media Bubble Utilities
 *
 * Extracted from cometchat-image-bubble and cometchat-video-bubble to consolidate
 * duplicate attachment extraction, caption extraction, sender info extraction,
 * and layout determination logic (~36 + 31 + 21 + 21 shared lines).
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
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
    console.warn(`[${logPrefix}] Message is null or undefined`);
    return [];
  }

  try {
    const rawAttachments = message.getAttachments();

    if (!rawAttachments || !Array.isArray(rawAttachments)) {
      console.warn(`[${logPrefix}] Message has no attachments or attachments is not an array`);
      return [];
    }

    // Thumbnail may be stored at message metadata level (e.g. from mock data or some SDK versions)
    const messageMeta = (message as any).getMetadata?.() || {};
    const messageLevelThumbnail: string | undefined =
      typeof messageMeta?.thumbnail === 'string' ? messageMeta.thumbnail : undefined;

    const mediaAttachments: MediaAttachment[] = [];

    for (let i = 0; i < rawAttachments.length; i++) {
      const attachment = rawAttachments[i];

      if (!attachment || typeof attachment !== 'object') {
        console.warn(`[${logPrefix}] Attachment at index ${i} is invalid (not an object)`);
        continue;
      }

      const url = (attachment as any).url || (attachment as any).getUrl?.();
      if (!url || typeof url !== 'string') {
        console.warn(`[${logPrefix}] Attachment at index ${i} is missing URL, skipping`);
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
    console.error(`[${logPrefix}] Error extracting attachments:`, error);
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
    console.warn(`[${logPrefix}] Error extracting caption, returning empty string:`, error);
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
    console.warn(`[${logPrefix}] Error extracting sender info:`, error);
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
