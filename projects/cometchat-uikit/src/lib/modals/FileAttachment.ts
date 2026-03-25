import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * File Attachment Data Structure
 *
 * Represents a file attachment extracted from a CometChat.MediaMessage.
 * This interface normalizes the file attachment data for consistent handling
 * across file-related components.
 *
 * @remarks
 * Used by CometChatFileBubbleComponent to process and display file attachments
 * from messages. Unlike MediaAttachment (for images/videos), this interface
 * includes file-specific metadata like name, extension, and MIME type.
 *
 * @see Requirements 1.3, 1.7, 1.8, 1.9
 */
export interface FileAttachment {
  /** File name with extension */
  name: string;

  /** Download URL */
  url: string;

  /** MIME type (e.g., 'application/pdf', 'text/plain') */
  mimeType: string;

  /** File extension (e.g., 'pdf', 'docx', 'zip') */
  extension: string;

  /** File size in bytes */
  size: number;

  /** The original attachment object from CometChat SDK (optional) */
  raw?: CometChat.Attachment;
}
