/**
 * Types and interfaces for CometChatMessageComposer component.
 *
 * Extracted from cometchat-message-composer.component.ts to keep the
 * component class focused on UI logic while this file owns all type definitions.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Attachment Types ====================

/**
 * Upload lifecycle status for a staged attachment tile.
 * Extends the legacy statuses with the multi-attachment upload states.
 * - 'failed'    : transfer failed (UploadFileListener.onFileFailure) — retryable (show Retry)
 * - 'rejected'  : not retryable (UploadFileListener.onFileError) — show Remove
 * - 'cancelled' : user cancelled an in-flight upload
 *
 * @remarks 'error' is retained as a deprecated alias of 'failed' for backward compatibility.
 */
export type AttachmentTileStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'rejected'
  | 'cancelled'
  | 'error';

/**
 * Tracks a file attachment in the composer's pending attachment list.
 */
export interface AttachmentFile {
  /** Unique identifier for the file */
  id: string;
  /** The actual File object */
  file: File;
  /** Type of attachment */
  type: 'image' | 'video' | 'audio' | 'file';
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type of the file (e.g. 'image/png'). */
  mimeType?: string;
  /** Upload id. UIKit-generated and passed to the SDK, which echoes it back on every upload event;
   *  it is the tile key from the moment the file is staged. */
  fileId?: string;
  /** Thumbnail URL for preview (local object URL while uploading; attachment URL once uploaded). */
  thumbnailUrl?: string;
  /** Video clip length in seconds, read locally alongside the poster. Drives the tile's duration badge. */
  durationSec?: number;
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
  /** Bytes uploaded so far (UploadFileListener.onFileProgress). */
  loaded?: number;
  /** Total bytes to upload (UploadFileListener.onFileProgress). */
  total?: number;
  /** Current upload status */
  status: AttachmentTileStatus;
  /** Error message if status is 'failed' | 'rejected' (or legacy 'error'). */
  errorMessage?: string;
  /** SDK Attachment, set on onFileUploaded — the object sent via MediaMessage.setAttachments. */
  attachment?: CometChat.Attachment;
}

/**
 * Represents a file size validation error.
 * Used to display error messages when files exceed the size limit.
 */
export interface FileSizeError {
  /** Number of files that exceeded the limit */
  count: number;
  /** Type of files (photo, video, file) */
  fileType: string;
  /** Size limit in MB */
  limitMB: number;
  /** Timestamp when error occurred */
  timestamp: number;
}

// ==================== Mention Types ====================

/**
 * A suggestion item shown in the mentions dropdown.
 */
export interface MentionSuggestionItem {
  uid: string;
  name: string;
  avatar?: string;
  isSelf?: boolean;
}

// ==================== Composer State Types ====================

/**
 * The current mode of the composer.
 * - 'compose': Normal message composition
 * - 'edit': Editing an existing message
 * - 'reply': Replying to a message
 */
export type ComposerMode = 'compose' | 'edit' | 'reply';

/**
 * Identifies which popover is currently open in the composer.
 */
export type ActivePopover = 'emoji' | 'attachment' | 'voice' | 'stickers' | 'ai' | null;

// ==================== Constants ====================

/**
 * Maximum number of unique mentions allowed in a single message.
 * When this limit is reached, additional mention insertions are blocked
 * and a warning banner is displayed above the input area.
 */
export const MENTIONS_LIMIT = 10;

/**
 * Debounce delay for typing indicator events (ms).
 */
export const TYPING_DEBOUNCE_MS = 300;

/**
 * Typing indicator stop delay after last keystroke (ms).
 */
export const TYPING_STOP_DELAY_MS = 1000;

// ==================== Template Context Types ====================

/**
 * Context object passed to composer template slots.
 */
export interface ComposerTemplateContext {
  user?: CometChat.User;
  group?: CometChat.Group;
}
