/**
 * Types and interfaces for CometChatMessageInformation component.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

/** Maximum characters for message preview truncation */
export const MAX_PREVIEW_LENGTH = 100;

/**
 * Interface for receipt information with user details.
 */
export interface ReceiptInfo {
  /** The user who received/read the message */
  user: CometChat.User;
  /** Timestamp when the action occurred (Unix timestamp in seconds) */
  timestamp: number;
}

/**
 * Interface for combined user receipt information (for group messages).
 * Shows both read and delivered timestamps for a single user.
 */
export interface UserReceiptInfo {
  /** The user who received/read the message */
  user: CometChat.User;
  /** Timestamp when the message was read (Unix timestamp in seconds), 0 if not read */
  readAt: number;
  /** Timestamp when the message was delivered (Unix timestamp in seconds), 0 if not delivered */
  deliveredAt: number;
}
