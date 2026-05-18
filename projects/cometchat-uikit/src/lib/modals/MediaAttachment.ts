import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Media Attachment Data Structure
 *
 * Represents a media attachment (image or video) extracted from a CometChat.MediaMessage.
 * This interface normalizes the attachment data for consistent handling across components.
 *
 * @remarks
 * Used by CometChatImageBubbleComponent and CometChatVideoBubbleComponent to process
 * and display media attachments from messages.
 *
 * @see Requirements 1.7, 1.8, 1.9, 1.10
 */
export interface MediaAttachment {
  /** The URL of the media file — always the full-quality original */
  url: string;

  /**
   * The display URL for the thumbnail preview in the bubble.
   * When the CometChat Thumbnail Generation extension is enabled, this is the
   * compressed low-quality URL (url_medium for images, url_small for videos).
   * Falls back to `url` when no extension thumbnail is available.
   * The fullscreen viewer always uses `url` (full quality), never `displayUrl`.
   */
  displayUrl?: string;

  /** The type of media (image or video) - required for fullscreen viewer gallery mode */
  type?: 'image' | 'video';

  /** The filename for download purposes (optional) */
  name?: string;

  /** The thumbnail URL (primarily for videos, optional for images) */
  thumbnail?: string;

  /** The width of the media in pixels (optional) */
  width?: number;

  /** The height of the media in pixels (optional) */
  height?: number;

  /** The duration in seconds (for videos only) */
  duration?: number;

  /** The file size in bytes (optional) */
  size?: number;

  /** The MIME type of the media (optional) */
  mimeType?: string;

  /** The original attachment object from CometChat SDK */
  raw?: CometChat.Attachment;
}

/**
 * Layout Type
 *
 * Defines the layout configuration for displaying multiple media attachments.
 *
 * @remarks
 * - 'single': Display one attachment at full size
 * - 'grid': Display 2-3 attachments in a grid layout
 * - 'grid-2x2': Display 4 attachments in a 2×2 grid
 * - 'overflow': Display first 3 attachments + overflow indicator for >4 attachments
 *
 * @see Requirements 2.1, 3.1, 3.2, 4.1
 */
export type MediaLayoutType = 'single' | 'grid' | 'grid-2x2' | 'overflow';
