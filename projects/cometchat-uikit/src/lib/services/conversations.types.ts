/**
 * Types and interfaces for ConversationsService
 */

// This file is intentionally minimal — ConversationsService uses CometChat SDK
// types directly. It exists as an extension point for future custom types.

export type ConversationId = string;

/**
 * Context string used for error handling / retry tracking.
 */
export type ConversationOperationContext =
  | 'fetchConversations'
  | 'fetchNextConversations'
  | 'deleteConversation'
  | string;
