/**
 * Types, interfaces, and constants for MessageListService.
 *
 * Extracted from message-list.service.ts to keep the service file focused
 * on business logic while this file owns all type definitions.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Error Handling Types ====================

/**
 * Represents a recoverable error context with retry metadata.
 */
export interface RetryContext {
  /** Human-readable operation name for logging */
  operation: string;
  /** Current retry attempt (0-based) */
  attempt: number;
  /** Maximum allowed attempts */
  maxAttempts: number;
}

/**
 * Callback type for propagating errors to consuming components.
 */
export type MessageListErrorCallback = (error: CometChat.CometChatException) => void;

// ==================== Fetch State Types ====================

/**
 * Represents the direction of a message fetch operation.
 */
export type FetchDirection = 'previous' | 'next' | 'around';

/**
 * Result of a message fetch operation.
 */
export interface FetchResult {
  messages: CometChat.BaseMessage[];
  direction: FetchDirection;
  hasMore: boolean;
}

// ==================== Typing Indicator Types ====================

/**
 * Snapshot of the current typing state for a conversation.
 */
export interface TypingSnapshot {
  /** Map of user UID → TypingIndicator */
  users: Map<string, CometChat.TypingIndicator>;
}

// ==================== Receipt Types ====================

/**
 * Represents a read/delivery receipt update.
 */
export interface ReceiptUpdate {
  messageId: number;
  type: 'read' | 'delivered';
  timestamp: number;
  receiverId: string;
  receiverType: string;
}

// ==================== Reaction Types ====================

/**
 * Represents a reaction event payload.
 */
export interface ReactionEventPayload {
  messageId: number;
  emoji: string;
  action: 'added' | 'removed';
  reactedBy: CometChat.User;
}

// ==================== Connection State Types ====================

/**
 * WebSocket connection state.
 */
export type ConnectionStatus = 'connected' | 'disconnected';

// ==================== Default Configuration Constants ====================

/**
 * Default number of messages fetched per request.
 */
export const DEFAULT_MESSAGE_LIMIT = 30;

/**
 * Typing indicator auto-clear timeout in milliseconds.
 */
export const TYPING_INDICATOR_TIMEOUT_MS = 5000;

/**
 * Maximum retry attempts for recoverable errors.
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry delays with exponential backoff (ms).
 */
export const RETRY_DELAYS = [1000, 2000, 4000] as const;

// ==================== Listener ID Helpers ====================

/**
 * Generates a unique listener ID for message events.
 */
export function generateMessageListenerId(): string {
  return `message_list_${Date.now()}`;
}

/**
 * Generates a unique listener ID for group events.
 */
export function generateGroupListenerId(): string {
  return `message_list_group_${Date.now()}`;
}

/**
 * Generates a unique listener ID for call events.
 */
export function generateCallListenerId(): string {
  return `message_list_call_${Date.now()}`;
}

/**
 * Generates a unique listener ID for connection events.
 */
export function generateConnectionListenerId(): string {
  return `message_list_connection_${Date.now()}`;
}
