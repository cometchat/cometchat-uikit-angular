/**
 * Types and interfaces for MessageComposerService
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Error callback type for service error handling
 */
export type ErrorCallback = (error: CometChat.CometChatException) => void;

/**
 * Payload interface for creating a poll via the polls extension API
 */
export interface PollCreatePayload {
  /** The poll question */
  question: string;
  /** Array of answer options (2-12 items) */
  options: string[];
  /** Receiver ID (user UID or group GUID) */
  receiver: string;
  /** Receiver type ('user' or 'group') */
  receiverType: string;
  /** Optional quoted message ID for replies */
  quotedMessageId?: number;
}

/**
 * Payload interface for creating collaborative documents and whiteboards
 */
export interface CollaborativePayload {
  /** Receiver ID (user UID or group GUID) */
  receiver: string;
  /** Receiver type ('user' or 'group') */
  receiverType: string;
  /** Optional quoted message ID for replies */
  quotedMessageId?: number;
}

/**
 * Mention suggestion item - can be a user, group member, or special @all mention
 */
export interface MentionSuggestion {
  /** Unique identifier */
  uid: string;
  /** Display name */
  name: string;
  /** Avatar URL */
  avatar?: string;
  /** Whether this is the @all mention */
  isAllMention?: boolean;
  /** Original user or group member object */
  entity?: CometChat.User | CometChat.GroupMember;
}
