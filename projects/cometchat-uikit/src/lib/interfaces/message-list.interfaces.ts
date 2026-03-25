/**
 * Message List Interfaces
 *
 * Defines interfaces and types for the MessageListService configuration,
 * callbacks, and data structures.
 *
 * Note: ErrorCallback type is imported from message-composer.service.ts
 * to avoid duplication. Use the shared ErrorCallback type from services.
 *
 * @module interfaces/message-list
 * @see Requirements 1.1, 1.4 - Service Architecture and Initialization
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Configuration options for the MessageListService.
 *
 * This interface defines all configurable options that can be passed
 * to the MessageListService to customize its behavior for different
 * conversation types and use cases.
 *
 * @example
 * ```typescript
 * // Configuration for a 1-on-1 conversation
 * const userConfig: MessageListConfig = {
 *   user: currentUser,
 *   hideGroupActionMessages: false,
 * };
 *
 * // Configuration for a group conversation
 * const groupConfig: MessageListConfig = {
 *   group: currentGroup,
 *   hideGroupActionMessages: true,
 * };
 *
 * // Configuration for thread mode
 * const threadConfig: MessageListConfig = {
 *   group: currentGroup,
 *   parentMessageId: 12345,
 * };
 *
 * // Configuration for jumping to a specific message
 * const jumpConfig: MessageListConfig = {
 *   user: currentUser,
 *   messageId: 67890,
 * };
 * ```
 */
export interface MessageListConfig {
  /**
   * User for 1-on-1 conversations.
   *
   * When set, the service will fetch and display messages
   * for the conversation with this user.
   * Mutually exclusive with `group`.
   */
  user?: CometChat.User;

  /**
   * Group for group conversations.
   *
   * When set, the service will fetch and display messages
   * for this group conversation.
   * Mutually exclusive with `user`.
   */
  group?: CometChat.Group;

  /**
   * Parent message ID for thread mode.
   *
   * When set, the service will only fetch and display
   * messages that are replies to this parent message.
   */
  parentMessageId?: number;

  /**
   * Custom messages request builder.
   *
   * Allows overriding the default MessagesRequestBuilder
   * with a custom configuration for advanced use cases.
   */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * Hide group action messages.
   *
   * When true, group action messages (member joined, left, etc.)
   * will not be displayed in the message list.
   * @default false
   */
  hideGroupActionMessages?: boolean;

  /**
   * Message ID to fetch around (for jumping to specific message).
   *
   * When set, the service will fetch messages around this
   * specific message ID, enabling "jump to message" functionality.
   */
  messageId?: number;
}

/**
 * Result of a fetch operation.
 *
 * Returned by fetchPreviousMessages() and fetchNextMessages() methods
 * to provide the fetched messages and pagination information.
 *
 * @example
 * ```typescript
 * const result: FetchResult = await messageListService.fetchPreviousMessages();
 *
 * if (result.hasMore) {
 *   // More messages available, can fetch again on scroll
 *   console.log(`Fetched ${result.messages.length} messages`);
 * } else {
 *   // Reached the beginning of the conversation
 *   console.log('No more messages to load');
 * }
 * ```
 */
export interface FetchResult {
  /**
   * Messages fetched in this operation.
   *
   * Array of BaseMessage objects returned from the SDK.
   * For fetchPreviousMessages, these are older messages.
   * For fetchNextMessages, these are newer messages.
   */
  messages: CometChat.BaseMessage[];

  /**
   * Whether more messages are available.
   *
   * True if there are more messages to fetch in the same direction.
   * False if the beginning (for previous) or end (for next) has been reached.
   */
  hasMore: boolean;
}

/**
 * Message update payload for real-time updates.
 *
 * Used internally by the service to communicate message updates
 * to subscribers and for event handling.
 *
 * @example
 * ```typescript
 * // Handling a new message
 * const addPayload: MessageUpdatePayload = {
 *   message: newTextMessage,
 *   updateType: 'added',
 * };
 *
 * // Handling an edited message
 * const editPayload: MessageUpdatePayload = {
 *   message: editedMessage,
 *   updateType: 'edited',
 * };
 *
 * // Handling a deleted message
 * const deletePayload: MessageUpdatePayload = {
 *   message: deletedMessage,
 *   updateType: 'deleted',
 * };
 *
 * // Handling a reaction update
 * const reactionPayload: MessageUpdatePayload = {
 *   message: messageWithNewReaction,
 *   updateType: 'reaction',
 * };
 * ```
 */
export interface MessageUpdatePayload {
  /**
   * The message that was updated.
   *
   * Contains the full message object with the latest state.
   */
  message: CometChat.BaseMessage;

  /**
   * Type of update that occurred.
   *
   * - `added`: A new message was added to the conversation
   * - `edited`: An existing message was edited
   * - `deleted`: A message was deleted (soft delete)
   * - `reaction`: A reaction was added or removed from a message
   */
  updateType: 'added' | 'edited' | 'deleted' | 'reaction';
}
