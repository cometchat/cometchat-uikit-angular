import { inject, DestroyRef, signal, WritableSignal, Signal, NgZone } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ErrorCallback } from './message-composer.service';
import { CometChatUIKitConstants } from '../constants';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatMessageEvents, IMessages } from '../events/CometChatMessageEvents';
import { MessageStatus } from '../Enums/Enums';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * MessageListService
 *
 * Core service responsible for managing message state, SDK interactions, and real-time updates
 * for the CometChat Angular V5 UIKit Message List component.
 *
 * ## Overview
 *
 * This service provides a centralized data layer for message list functionality, including:
 * - Message state management using Angular Signals
 * - SDK interactions for fetching and manipulating messages
 * - Real-time message, receipt, reaction, and group action listeners
 * - Bidirectional pagination (scroll up for older, scroll down for newer messages)
 * - Thread message support
 * - Connection state management with automatic reconnection handling
 *
 * ## Architecture
 *
 * The service follows established patterns in the Angular UIKit codebase:
 * - **Angular Signals**: For reactive state management with improved performance
 * - **Observable APIs**: Via `toObservable()` for backward compatibility with RxJS-based code
 * - **Hybrid Approach Pattern**: Service provides defaults but component @Input properties can override
 * - **DestroyRef**: For automatic cleanup of SDK listeners when the service is destroyed
 *
 * ## Global State Sharing Behavior
 *
 * This is a singleton service (providedIn: 'root') that maintains global state
 * shared across ALL components in the application that inject it. This means:
 *
 * - Multiple instances of MessageList components will share the same message state
 * - Changes made by one component are immediately visible to all other components
 * - Loading and error states are shared globally across all components
 *
 * ## Automatic Cleanup
 *
 * Uses DestroyRef for automatic cleanup of SDK listeners when the service is destroyed.
 * This happens automatically when the Angular application is destroyed, ensuring no memory leaks.
 *
 * ## Manual State Reset
 *
 * The cleanup() method is available for manual state reset when needed:
 * - User logout: Clear all message data before the next user logs in
 * - Account switching: Reset state when switching between different user accounts
 * - Conversation switching: Clear messages when changing active conversation
 *
 * @example
 * ```typescript
 * export class MessageListComponent {
 *   private messageListService = inject(MessageListService);
 *
 *   // Access messages via signal
 *   messages = this.messageListService.messages;
 *
 *   // Or via observable
 *   messages$ = this.messageListService.messages$;
 *
 *   ngOnInit() {
 *     // Set the conversation context
 *     this.messageListService.setUser(this.user);
 *     // or
 *     this.messageListService.setGroup(this.group);
 *
 *     // Fetch initial messages
 *     this.messageListService.fetchPreviousMessages();
 *   }
 *
 *   onLogout() {
 *     // Reset state when user logs out
 *     this.messageListService.cleanup();
 *   }
 * }
 * ```
 *
 * @Injectable providedIn: 'root'

 */
// @Injectable({
//   providedIn: 'root',
// })
export class MessageListService {
  // ==================== DestroyRef for Automatic Cleanup ====================

  /**
   * DestroyRef for automatic cleanup when the service is destroyed.
   * Used to remove SDK listeners and reset state automatically.
   * @private
   */
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  // ==================== Listener IDs ====================

  /**
   * Unique listener ID for message events.
   * Uses timestamp to ensure uniqueness across service instances.
   * @private
   */
  private messageListenerId = `message_list_${Date.now()}`;

  /**
   * Unique listener ID for group events.
   * Uses timestamp to ensure uniqueness across service instances.
   * @private
   */
  private groupListenerId = `message_list_group_${Date.now()}`;

  /**
   * Unique listener ID for call events.
   * Uses timestamp to ensure uniqueness across service instances.
   * @private
   */
  private callListenerId = `message_list_call_${Date.now()}`;

  /**
   * Unique listener ID for connection events.
   * Uses timestamp to ensure uniqueness across service instances.
   * @private
   */
  private connectionListenerId = `message_list_connection_${Date.now()}`;

  // ==================== Event Subscriptions ====================

  /**
   * Subscription for the ccMessageSent event from CometChatMessageEvents.
   *
   * This subscription listens for messages sent by the current user via the
   * message composer. It enables real-time synchronization of sent messages
   * in the message list, providing optimistic UI updates.
   *
   * **Why This Is Needed:**
   * The SDK's real-time listeners (onTextMessageReceived, onMediaMessageReceived, etc.)
   * only fire for messages received from OTHER users. Messages sent by the current
   * user are not captured by these listeners. This subscription fills that gap.
   *
   * **Lifecycle:**
   * - Created in constructor via `setupSentMessageListener()`
   * - Unsubscribed in `cleanup()` via `removeSentMessageListener()`
   * - NOT unsubscribed in `resetState()` (persists across conversation switches)
   *
   * @private
   * @see Requirement 1.1 - Subscribe to ccMessageSent in constructor
   * @see Requirement 5.1 - Store subscription in private property
   */
  private ccMessageSentSubscription: Subscription | null = null;

  /**
   * Subscription for the ccMessageEdited event from CometChatMessageEvents.
   *
   * This subscription listens for messages edited by the current user via the
   * message composer. It enables real-time synchronization of edited messages
   * in the message list for the sender.
   *
   * **Why This Is Needed:**
   * The SDK's onMessageEdited listener only fires for messages edited by OTHER users.
   * Messages edited by the current user are not captured by that listener. This
   * subscription fills that gap by listening to the composer's ccMessageEdited event.
   *
   * **Lifecycle:**
   * - Created in constructor via `setupEditedMessageListener()`
   * - Unsubscribed in `cleanup()` via `removeEditedMessageListener()`
   * - NOT unsubscribed in `resetState()` (persists across conversation switches)
   *
   * @private
   */
  private ccMessageEditedSubscription: Subscription | null = null;

  // ==================== State Signals ====================

  /**
   * Signal containing the array of messages currently displayed.
   * This is the primary message array used for rendering in the UI.
   *
   * @private
   * @see Requirement 2.1
   */
  private messagesSignal: WritableSignal<CometChat.BaseMessage[]> = signal<CometChat.BaseMessage[]>(
    []
  );

  /**
   * Signal containing the complete message history in memory.
   * Used for virtualization and quick access during scrolling.
   * May contain more messages than messagesSignal for performance optimization.
   *
   * @private
   * @see Requirement 2.2
   */
  private allMessagesSignal: WritableSignal<CometChat.BaseMessage[]> = signal<
    CometChat.BaseMessage[]
  >([]);

  /**
   * Signal indicating whether messages are currently being fetched.
   * Used to show loading indicators in the UI.
   *
   * @private
   * @see Requirement 2.3
   */
  private loadingStateSignal: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Signal containing any error that occurred during operations.
   * Null when no error is present.
   *
   * @private
   * @see Requirement 2.4
   */
  private errorStateSignal: WritableSignal<Error | null> = signal<Error | null>(null);

  /**
   * Signal tracking the ID of the oldest fetched message.
   * Used for backward pagination (scroll up to load older messages).
   * Value of 0 indicates no messages have been fetched yet.
   *
   * @private
   * @see Requirement 2.5
   */
  private prevMessageIdSignal: WritableSignal<number> = signal<number>(0);

  /**
   * Signal tracking the ID of the newest fetched message.
   * Used for forward pagination (scroll down to load newer messages).
   * Value of 0 indicates no messages have been fetched yet.
   *
   * @private
   * @see Requirement 2.6
   */
  private nextMessageIdSignal: WritableSignal<number> = signal<number>(0);

  /**
   * Signal tracking the number of unread messages.
   * Used to display unread message indicators in the UI.
   *
   * @private
   * @see Requirement 2.7
   */
  private unreadCountSignal: WritableSignal<number> = signal<number>(0);

  /**
   * Signal tracking the WebSocket connection state.
   * Used to handle connection interruptions and reconnection logic.
   *
   * @private
   * @see Requirement 11.1, 11.2, 11.3
   */
  private connectionStatusSignal: WritableSignal<'connected' | 'disconnected'> = signal<
    'connected' | 'disconnected'
  >('connected');

  // ==================== Typing Indicator State ====================

  /**
   * Signal containing a map of user UIDs to their typing indicators.
   * Used to track which users are currently typing in the conversation.
   *
   * **Key:** User UID (string)
   * **Value:** CometChat.TypingIndicator object
   *
   * **Usage:**
   * - Updated when typing started/ended events are received
   * - Used to display typing indicators in the UI
   * - Auto-cleared after timeout (default 5 seconds)
   *
   * **Lifecycle:**
   * - Populated when `handleTypingStarted()` is called
   * - Entries removed when `handleTypingEnded()` is called or timeout expires
   * - Cleared when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 1.8 - Listen for typing indicator events from SDK
   */
  private typingUsersSignal: WritableSignal<Map<string, CometChat.TypingIndicator>> = signal<
    Map<string, CometChat.TypingIndicator>
  >(new Map());

  /**
   * Map to store timeout IDs for auto-clearing typing indicators.
   * Each typing indicator is automatically removed after a timeout period
   * if no new typing event is received for that user.
   *
   * **Key:** User UID (string)
   * **Value:** Timeout ID (ReturnType<typeof setTimeout>)
   *
   * **Usage:**
   * - When a typing started event is received, a timeout is set
   * - If a new typing event arrives before timeout, the old timeout is cleared
   * - When timeout expires, the typing indicator is removed
   * - When typing ended event is received, the timeout is cleared
   *
   * **Lifecycle:**
   * - Entries added when `handleTypingStarted()` is called
   * - Entries removed when timeout expires or `handleTypingEnded()` is called
   * - All timeouts cleared when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 1.5 - Auto-hide after timeout (default 5 seconds)
   */
  private typingTimeoutsMap = new Map<string, ReturnType<typeof setTimeout>>();

  // ==================== Message Lookup Maps ====================

  /**
   * Map for O(1) lookup of messages by their server-assigned ID.
   * This enables efficient message retrieval without iterating through the entire message array.
   *
   * **Usage:**
   * - Quick lookup when updating a message by ID
   * - Finding messages for receipt updates
   * - Retrieving messages for reaction updates
   *
   * **Lifecycle:**
   * - Populated when messages are fetched or added
   * - Updated when messages are modified
   * - Cleared when cleanup() or clearMessages() is called
   *
   * @private
   * @see Requirement 16.3
   */
  private messageIdMap = new Map<number, CometChat.BaseMessage>();

  /**
   * Map for O(1) lookup of messages by their client-assigned MUID.
   * Used for updating optimistically added messages after server confirmation.
   *
   * **What is MUID?**
   * MUID (Message Unique Identifier) is a temporary ID assigned to messages on the client
   * before they receive a server-assigned ID. This allows the UI to display messages
   * immediately (optimistic update) and then update them with the server response.
   *
   * **Usage:**
   * - Finding optimistically added messages to update with server response
   * - Handling message send confirmations
   * - Deduplicating messages during real-time updates
   *
   * **Lifecycle:**
   * - Populated when messages are added (if they have a MUID)
   * - Updated when messages are modified
   * - Cleared when cleanup() or clearMessages() is called
   *
   * @private
   * @see Requirement 16.3
   */
  private messageMuidMap = new Map<string, CometChat.BaseMessage>();

  // ==================== Configuration Properties ====================

  /**
   * Current user for 1-on-1 conversations.
   *
   * When set, the service will fetch and display messages for the conversation
   * with this user. This property is mutually exclusive with `currentGroup` -
   * setting one will clear the other.
   *
   * **Usage:**
   * - Set via `setUser(user)` method
   * - Used to configure the MessagesRequestBuilder with the user's UID
   * - Used to validate incoming real-time messages belong to this conversation
   *
   * **Lifecycle:**
   * - Set when `setUser()` is called
   * - Cleared when `setGroup()` is called (mutual exclusivity)
   * - Reset to null when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 3.6 - Configure builder with user's UID
   * @see Requirement 17.1 - setUser method
   * @see Requirement 17.6 - Mutual exclusivity between user and group
   */
  private currentUser: CometChat.User | null = null;

  /**
   * Current group for group conversations.
   *
   * When set, the service will fetch and display messages for this group
   * conversation. This property is mutually exclusive with `currentUser` -
   * setting one will clear the other.
   *
   * **Usage:**
   * - Set via `setGroup(group)` method
   * - Used to configure the MessagesRequestBuilder with the group's GUID
   * - Used to validate incoming real-time messages belong to this conversation
   * - Used to validate group action events belong to this group
   *
   * **Lifecycle:**
   * - Set when `setGroup()` is called
   * - Cleared when `setUser()` is called (mutual exclusivity)
   * - Reset to null when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 3.7 - Configure builder with group's GUID
   * @see Requirement 17.2 - setGroup method
   * @see Requirement 17.6 - Mutual exclusivity between user and group
   */
  private currentGroup: CometChat.Group | null = null;

  /**
   * Parent message ID for thread mode.
   *
   * When set, the service operates in thread mode and will only fetch and
   * display messages that are replies to this parent message. This enables
   * threaded conversation views within a chat.
   *
   * **Usage:**
   * - Set via `setParentMessageId(parentMessageId)` method
   * - Used to configure the MessagesRequestBuilder for thread message fetching
   * - Used to filter incoming real-time messages to only show thread replies
   * - When set, hideReplies is set to false in the builder
   *
   * **Lifecycle:**
   * - Set when `setParentMessageId()` is called
   * - Reset to null when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 3.5 - Configure builder for thread message fetching
   * @see Requirement 14.1 - Thread mode configuration
   * @see Requirement 14.2 - Only fetch messages with matching parentMessageId
   */
  private parentMessageId: number | null = null;

  /**
   * Custom MessagesRequestBuilder for advanced message fetch configuration.
   *
   * When provided, this builder overrides the default builder configuration.
   * This allows components to customize message fetching behavior for
   * advanced use cases like filtering by message type, custom limits, etc.
   *
   * **Usage:**
   * - Set via `setMessagesRequestBuilder(builder)` method
   * - When set, used instead of creating a default builder
   * - Component @Input can override service default (Hybrid Approach Pattern)
   *
   * **Lifecycle:**
   * - Set when `setMessagesRequestBuilder()` is called
   * - Reset to null when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 3.1 - Accept optional MessagesRequestBuilder
   * @see Requirement 1.4 - Hybrid Approach Pattern
   */
  private messagesRequestBuilder: CometChat.MessagesRequestBuilder | null = null;

  /**
   * Flag to hide group action messages in the message list.
   *
   * When true, group action messages (member joined, left, kicked, banned,
   * unbanned, scope changed, added) will not be displayed in the message list.
   * This is useful for cleaner conversation views that focus on actual messages.
   *
   * **Usage:**
   * - Set via `setHideGroupActionMessages(hide)` method
   * - Used when configuring the MessagesRequestBuilder categories
   * - Used to filter group action events from real-time listeners
   *
   * **Lifecycle:**
   * - Set when `setHideGroupActionMessages()` is called
   * - Reset to false when `cleanup()` or `resetState()` is called
   *
   * @private
   * @default false
   * @see Requirement 9.10 - Hide group action messages when flag is true
   */
  private hideGroupActionMessages = false;

  /**
   * MessagesRequest for fetching previous (older) messages.
   *
   * This is the built request object used to fetch messages when scrolling up
   * (loading older messages). It is created from the MessagesRequestBuilder
   * and configured for backward pagination.
   *
   * **Usage:**
   * - Created by `buildMessagesRequest()` method
   * - Used by `fetchPreviousMessages()` to call SDK's `fetchPrevious()`
   * - Maintains pagination state for backward scrolling
   *
   * **Lifecycle:**
   * - Created when conversation context is set (user/group)
   * - Reset to null when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 4.1 - Invoke SDK's fetchPrevious() method
   */
  private messagesRequest: CometChat.MessagesRequest | null = null;

  /**
   * MessagesRequest for fetching next (newer) messages.
   *
   * This is the built request object used to fetch messages when scrolling down
   * (loading newer messages). It is created from the MessagesRequestBuilder
   * and configured for forward pagination.
   *
   * **Usage:**
   * - Created by `buildMessagesRequest()` method with appropriate configuration
   * - Used by `fetchNextMessages()` to call SDK's `fetchNext()`
   * - Maintains pagination state for forward scrolling
   * - Used during reconnection to fetch missed messages
   *
   * **Lifecycle:**
   * - Created when conversation context is set (user/group)
   * - Reset to null when `cleanup()` or `resetState()` is called
   *
   * @private
   * @see Requirement 5.1 - Invoke SDK's fetchNext() method
   * @see Requirement 11.5 - Fetch missed messages after reconnection
   */
  private nextMessagesRequest: CometChat.MessagesRequest | null = null;

  /**
   * Error callback for propagating errors to components.
   *
   * When set, this callback is invoked whenever an error occurs in the service
   * that should be communicated to the consuming component. This allows
   * components to handle errors in a custom way (e.g., showing toast messages,
   * triggering retry logic, logging to analytics).
   *
   * **Usage:**
   * - Set via `setErrorCallback(callback)` method
   * - Called when errors occur during fetch operations
   * - Called when errors occur during real-time event processing
   * - Receives CometChat.CometChatException for detailed error information
   *
   * **Lifecycle:**
   * - Set when `setErrorCallback()` is called
   * - Preserved during `resetState()` (not cleared)
   * - Cleared only when explicitly set to null or during full `cleanup()`
   *
   * **Note:** Unlike other configuration properties, errorCallback is NOT reset
   * during `resetState()` to allow error handling to persist across conversation
   * switches. It is only cleared during full `cleanup()` (e.g., user logout).
   *
   * @private
   * @see Requirement 15.3 - Error callback mechanism for propagating errors
   */
  private errorCallback: ErrorCallback | null = null;

  // ==================== Default Configuration Constants ====================

  // ==================== Custom Message Types/Categories ====================

  /**
   * Custom message types added by developers to include in message fetching.
   * These are merged with the default types when building the MessagesRequestBuilder.
   * Uses a Set for automatic deduplication.
   *
   * @private
   * @see Requirement 3.1, 3.3, 3.8
   */
  private customMessageTypes: Set<string> = new Set();

  /**
   * Custom message categories added by developers to include in message fetching.
   * These are merged with the default categories when building the MessagesRequestBuilder.
   * Uses a Set for automatic deduplication.
   *
   * @private
   * @see Requirement 3.2, 3.4, 3.8
   */
  private customMessageCategories: Set<string> = new Set();

  /**
   * Full replacement for default message types. When set, the built-in defaults
   * are ignored and this set is used instead.
   * @private
   */
  private replacedMessageTypes: Set<string> | null = null;

  /**
   * Full replacement for default message categories. When set, the built-in defaults
   * are ignored and this set is used instead.
   * @private
   */
  private replacedMessageCategories: Set<string> | null = null;

  /**
   * Default limit for messages per fetch request.
   * @private
   * @see Requirement 3.4
   */
  private readonly DEFAULT_MESSAGE_LIMIT = 30;

  /**
   * Default timeout duration for typing indicators (in milliseconds).
   * Typing indicators are automatically removed after this duration
   * if no new typing event is received for that user.
   * @private
   * @see Requirement 1.5 - Auto-hide after timeout (default 5 seconds)
   */
  private readonly TYPING_INDICATOR_TIMEOUT = 5000;

  /**
   * Maximum number of retry attempts for recoverable errors.
   * After this many attempts, the error is propagated to the component.
   * @private
   * @see Requirement 15.5
   */
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Retry delays with exponential backoff (1s, 2s, 4s).
   * Each subsequent retry waits longer to give the system time to recover.
   * @private
   * @see Requirement 15.5
   */
  private readonly RETRY_DELAYS = [1000, 2000, 4000] as const;

  /**
   * Generation counter for discarding stale fetch results.
   *
   * Incremented each time the conversation changes (via setUser/setGroup/clearMessagesAndState).
   * Async fetch methods capture this value before awaiting, then compare after the promise
   * resolves/rejects. If the generation has changed, the result is stale and discarded —
   * preventing a previous conversation's error or data from polluting the current one.
   *
   * @private
   * @see Requirement 2.24 - Fast chat switching should not show error state
   */
  private fetchGeneration = 0;

  /**
   * Map to track retry attempts per operation context.
   * Keys are operation context strings (e.g., "fetchPreviousMessages"),
   * values are the current retry attempt count.
   * @private
   * @see Requirement 15.5
   */
  private retryAttempts = new Map<string, number>();

  // ==================== MessagesRequest Builder Methods ====================

  /**
   * Build a MessagesRequest for fetching previous (older) messages.
   *
   * This method creates a configured MessagesRequest object that can be used
   * to fetch messages from the CometChat SDK. It handles both custom builder
   * configurations and default configurations.
   *
   * **Configuration Priority:**
   * 1. If a custom `messagesRequestBuilder` is provided, it is used as the base
   * 2. Otherwise, a default builder is created with standard message types/categories
   *
   * **Default Configuration:**
   * - Message types: text, file, image, audio, video, groupMember
   * - Message categories: message, action, call, interactive, custom
   * - Limit: 30 messages per fetch
   * - hideReplies: true (unless in thread mode)
   *
   * **Context Configuration:**
   * - For 1-on-1 chats: Sets UID from currentUser
   * - For group chats: Sets GUID from currentGroup
   * - For thread mode: Sets parentMessageId and hideReplies to false
   * - For jumping to message: Sets messageId parameter
   *
   * @param messageId - Optional message ID to fetch messages around (for jumping to specific message)
   * @returns A configured MessagesRequest ready for fetching
   *
   * @private
   * @see Requirement 3.1 - Accept optional MessagesRequestBuilder
   * @see Requirement 3.2 - Create default builder with standard types/categories
   * @see Requirement 3.3 - Hide replies by default
   * @see Requirement 3.4 - Default limit of 30 messages
   * @see Requirement 3.5 - Configure for thread message fetching
   * @see Requirement 3.6 - Set UID for user conversations
   * @see Requirement 3.7 - Set GUID for group conversations
   * @see Requirement 3.8 - Support messageId for jumping to specific message
   */
  private buildMessagesRequest(messageId?: number): CometChat.MessagesRequest {
    let builder: CometChat.MessagesRequestBuilder;

    if (this.messagesRequestBuilder) {
      // Use custom builder if provided (Hybrid Approach Pattern)
      builder = this.messagesRequestBuilder;
    } else {
      // Create default builder with standard message types and categories
      const messageTypes = this.getDefaultMessageTypes();
      const messageCategories = this.getDefaultMessageCategories();
      builder = new CometChat.MessagesRequestBuilder()
        .setLimit(this.DEFAULT_MESSAGE_LIMIT)
        .setTypes(messageTypes)
        .setCategories(messageCategories);
    }

    // Configure hideReplies based on thread mode
    // In thread mode (parentMessageId is set), we want to see replies
    // In normal mode, we hide replies to keep the main conversation clean
    const isThreadMode = this.parentMessageId !== null;
    builder.hideReplies(!isThreadMode);

    // Configure based on conversation context
    if (this.currentUser) {
      builder.setUID(this.currentUser.getUid());
    } else if (this.currentGroup) {
      builder.setGUID(this.currentGroup.getGuid());
    }

    // Configure for thread mode
    if (this.parentMessageId !== null) {
      builder.setParentMessageId(this.parentMessageId);
    }

    // Configure for jumping to specific message
    if (messageId !== undefined) {
      builder.setMessageId(messageId);
    }

    return builder.build();
  }

  /**
   * Build a MessagesRequest for fetching next (newer) messages.
   *
   * This method creates a configured MessagesRequest object for forward pagination,
   * used when scrolling down to load newer messages or when fetching missed messages
   * after reconnection.
   *
   * The configuration is similar to `buildMessagesRequest()` but is specifically
   * designed for forward pagination scenarios.
   *
   * **Usage Scenarios:**
   * - User scrolls down to load newer messages
   * - Reconnection: Fetch messages missed during disconnection
   * - Jump to message: Load newer messages after jumping to a specific message
   *
   * @param messageId - Optional message ID to fetch messages after (for forward pagination)
   * @returns A configured MessagesRequest ready for fetching newer messages
   *
   * @private
   * @see Requirement 5.1 - Invoke SDK's fetchNext() method
   * @see Requirement 11.5 - Fetch missed messages after reconnection
   */
  private buildNextMessagesRequest(messageId?: number): CometChat.MessagesRequest {
    let builder: CometChat.MessagesRequestBuilder;

    if (this.messagesRequestBuilder) {
      // Use custom builder if provided (Hybrid Approach Pattern)
      builder = this.messagesRequestBuilder;
    } else {
      // Create default builder with standard message types and categories
      const messageTypes = this.getDefaultMessageTypes();
      const messageCategories = this.getDefaultMessageCategories();

      builder = new CometChat.MessagesRequestBuilder()
        .setLimit(this.DEFAULT_MESSAGE_LIMIT)
        .setTypes(messageTypes)
        .setCategories(messageCategories);
    }

    // Configure hideReplies based on thread mode
    const isThreadMode = this.parentMessageId !== null;
    builder.hideReplies(!isThreadMode);

    // Configure based on conversation context
    if (this.currentUser) {
      builder.setUID(this.currentUser.getUid());
    } else if (this.currentGroup) {
      builder.setGUID(this.currentGroup.getGuid());
    }

    // Configure for thread mode
    if (this.parentMessageId !== null) {
      builder.setParentMessageId(this.parentMessageId);
    }

    // Configure for forward pagination from specific message
    if (messageId !== undefined) {
      builder.setMessageId(messageId);
    }

    return builder.build();
  }

  /**
   * Get the default message types for the MessagesRequestBuilder.
   *
   * Returns an array of message types that should be fetched by default.
   * This includes all standard message types supported by the UIKit.
   *
   * @returns Array of message type strings
   * @private
   */
  private getDefaultMessageTypes(): string[] {
    // If types were fully replaced, use the replacement set
    if (this.replacedMessageTypes) {
      return Array.from(this.replacedMessageTypes);
    }

    const defaults = [
      CometChatUIKitConstants.MessageTypes.text,
      CometChatUIKitConstants.MessageTypes.file,
      CometChatUIKitConstants.MessageTypes.image,
      CometChatUIKitConstants.MessageTypes.audio,
      CometChatUIKitConstants.MessageTypes.video,
      CometChatUIKitConstants.MessageTypes.groupMember,
      CometChatUIKitConstants.MessageTypes.form,
      CometChatUIKitConstants.MessageTypes.scheduler,
      CometChatUIKitConstants.MessageTypes.card,
      CometChatUIKitConstants.MessageTypes.assistant,
      'extension_sticker',
      'extension_poll',
      'extension_whiteboard',
      'extension_document',
      'meeting',
    ];

    // Merge custom types, deduplicated via Set
    if (this.customMessageTypes.size > 0) {
      const merged = new Set(defaults);
      this.customMessageTypes.forEach(type => merged.add(type));
      return Array.from(merged);
    }

    return defaults;
  }

  /**
   * Get the default message categories for the MessagesRequestBuilder.
   *
   * Returns an array of message categories that should be fetched by default.
   * The categories included depend on the `hideGroupActionMessages` flag.
   *
   * @returns Array of message category strings
   * @private
   * @see Requirement 9.10 - Hide group action messages when flag is true
   */
  private getDefaultMessageCategories(): string[] {
    // If categories were fully replaced, use the replacement set
    if (this.replacedMessageCategories) {
      return Array.from(this.replacedMessageCategories);
    }

    const categories = [
      CometChatUIKitConstants.MessageCategory.message,
      CometChatUIKitConstants.MessageCategory.custom,
      CometChatUIKitConstants.MessageCategory.call,
      CometChatUIKitConstants.MessageCategory.interactive,
      CometChatUIKitConstants.MessageCategory.agentic,
    ];

    // Include action category only if group action messages are not hidden
    if (!this.hideGroupActionMessages) {
      categories.push(CometChatUIKitConstants.MessageCategory.action);
    }

    // Merge custom categories, deduplicated via Set
    if (this.customMessageCategories.size > 0) {
      const merged = new Set(categories);
      this.customMessageCategories.forEach(cat => merged.add(cat));
      return Array.from(merged);
    }

    return categories;
  }

  // ==================== Public Read-only Signals ====================

  /**
   * Read-only signal containing the array of messages currently displayed.
   * Use this signal in components to reactively access the message list.
   *
   * @example
   * ```typescript
   * // In component template
   * @for (message of messageListService.messages(); track message.getId()) {
   *   <message-bubble [message]="message" />
   * }
   *
   * // In component class
   * const currentMessages = this.messageListService.messages();
   * ```
   *
   * @see Requirement 2.8
   */
  readonly messages: Signal<CometChat.BaseMessage[]> = this.messagesSignal.asReadonly();

  /**
   * Read-only signal containing the complete message history in memory.
   * Used for virtualization and quick access during scrolling.
   *
   * @example
   * ```typescript
   * const totalMessages = this.messageListService.allMessages().length;
   * ```
   *
   * @see Requirement 2.8
   */
  readonly allMessages: Signal<CometChat.BaseMessage[]> = this.allMessagesSignal.asReadonly();

  /**
   * Read-only signal indicating whether messages are currently being fetched.
   * Use this to show loading indicators in the UI.
   *
   * @example
   * ```typescript
   * // In component template
   * @if (messageListService.loadingState()) {
   *   <loading-spinner />
   * }
   * ```
   *
   * @see Requirement 2.8
   */
  readonly loadingState: Signal<boolean> = this.loadingStateSignal.asReadonly();

  /**
   * Read-only signal containing any error that occurred during operations.
   * Null when no error is present.
   *
   * @example
   * ```typescript
   * // In component template
   * @if (messageListService.errorState(); as error) {
   *   <error-message [error]="error" />
   * }
   * ```
   *
   * @see Requirement 2.8
   */
  readonly errorState: Signal<Error | null> = this.errorStateSignal.asReadonly();

  /**
   * Read-only signal tracking the ID of the oldest fetched message.
   * Used for backward pagination (scroll up to load older messages).
   * Value of 0 indicates no messages have been fetched yet.
   *
   * @example
   * ```typescript
   * const oldestMessageId = this.messageListService.prevMessageId();
   * ```
   *
   * @see Requirement 2.8
   */
  readonly prevMessageId: Signal<number> = this.prevMessageIdSignal.asReadonly();

  /**
   * Read-only signal tracking the ID of the newest fetched message.
   * Used for forward pagination (scroll down to load newer messages).
   * Value of 0 indicates no messages have been fetched yet.
   *
   * @example
   * ```typescript
   * const newestMessageId = this.messageListService.nextMessageId();
   * ```
   *
   * @see Requirement 2.8
   */
  readonly nextMessageId: Signal<number> = this.nextMessageIdSignal.asReadonly();

  /**
   * Read-only signal tracking the number of unread messages.
   * Used to display unread message indicators in the UI.
   *
   * @example
   * ```typescript
   * // In component template
   * @if (messageListService.unreadCount() > 0) {
   *   <unread-badge [count]="messageListService.unreadCount()" />
   * }
   * ```
   *
   * @see Requirement 2.8
   */
  readonly unreadCount: Signal<number> = this.unreadCountSignal.asReadonly();

  /**
   * Read-only signal tracking the WebSocket connection state.
   * Used to handle connection interruptions and show connection status in UI.
   *
   * @example
   * ```typescript
   * // In component template
   * @if (messageListService.connectionStatus() === 'disconnected') {
   *   <connection-lost-banner />
   * }
   * ```
   *
   * @see Requirement 2.8
   */
  readonly connectionStatus: Signal<'connected' | 'disconnected'> =
    this.connectionStatusSignal.asReadonly();

  /**
   * Read-only signal containing a map of user UIDs to their typing indicators.
   * Use this signal in components to reactively display typing status.
   *
   * **Key:** User UID (string)
   * **Value:** CometChat.TypingIndicator object
   *
   * @example
   * ```typescript
   * // In component template
   * @if (messageListService.typingUsers().size > 0) {
   *   <typing-indicator [typingUsers]="messageListService.typingUsers()" />
   * }
   *
   * // In component class - get array of typing users
   * const typingUsersArray = Array.from(this.messageListService.typingUsers().values());
   * ```
   *
   * @see Requirement 1.8 - Listen for typing indicator events from SDK
   */
  readonly typingUsers: Signal<Map<string, CometChat.TypingIndicator>> =
    this.typingUsersSignal.asReadonly();

  // ==================== Public Observables ====================

  /**
   * Observable stream of the messages array for backward compatibility with RxJS-based code.
   * Emits whenever the messages signal changes.
   *
   * Use this when you need to integrate with RxJS operators or existing RxJS-based code.
   * For new code, prefer using the `messages` signal directly for better performance.
   *
   * @example
   * ```typescript
   * // Subscribe to message changes
   * this.messageListService.messages$.pipe(
   *   map(messages => messages.filter(m => m.getType() === 'text')),
   *   takeUntilDestroyed()
   * ).subscribe(textMessages => {
   *   console.log('Text messages:', textMessages);
   * });
   *
   * // Use with async pipe in template
   * // <div *ngFor="let message of messageListService.messages$ | async">
   * ```
   *
   * @see Requirement 2.9
   */
  readonly messages$: Observable<CometChat.BaseMessage[]> = toObservable(this.messagesSignal);

  /**
   * Observable stream of the loading state for backward compatibility with RxJS-based code.
   * Emits true when messages are being fetched, false otherwise.
   *
   * Use this when you need to integrate with RxJS operators or existing RxJS-based code.
   * For new code, prefer using the `loadingState` signal directly for better performance.
   *
   * @example
   * ```typescript
   * // Combine with other observables
   * combineLatest([
   *   this.messageListService.loadingState$,
   *   this.messageListService.errorState$
   * ]).pipe(
   *   takeUntilDestroyed()
   * ).subscribe(([loading, error]) => {
   *   this.showSpinner = loading && !error;
   * });
   *
   * // Use with async pipe in template
   * // <loading-spinner *ngIf="messageListService.loadingState$ | async" />
   * ```
   *
   * @see Requirement 2.9
   */
  readonly loadingState$: Observable<boolean> = toObservable(this.loadingStateSignal);

  /**
   * Observable stream of the error state for backward compatibility with RxJS-based code.
   * Emits the current error or null when no error is present.
   *
   * Use this when you need to integrate with RxJS operators or existing RxJS-based code.
   * For new code, prefer using the `errorState` signal directly for better performance.
   *
   * @example
   * ```typescript
   * // React to errors
   * this.messageListService.errorState$.pipe(
   *   filter(error => error !== null),
   *   takeUntilDestroyed()
   * ).subscribe(error => {
   *   this.toastService.showError(error.message);
   * });
   *
   * // Use with async pipe in template
   * // <error-banner *ngIf="messageListService.errorState$ | async as error" [error]="error" />
   * ```
   *
   * @see Requirement 2.9
   */
  readonly errorState$: Observable<Error | null> = toObservable(this.errorStateSignal);

  // ==================== Constructor ====================

  constructor() {
    // Register cleanup with DestroyRef for automatic cleanup when service is destroyed
    // This ensures SDK listeners are removed and state is reset automatically
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });

    // Set up sent message listener for real-time synchronization of sent messages
    // This subscription listens for ccMessageSent events from the message composer
    // and enables optimistic UI updates for messages sent by the current user
    // @see Requirement 1.1 - Subscribe to ccMessageSent in constructor
    this.setupSentMessageListener();

    // Set up edited message listener for real-time synchronization of edited messages
    // This subscription listens for ccMessageEdited events from the message composer
    this.setupEditedMessageListener();

    this.setupMessageListener();
  }

  // ==================== Cleanup Methods ====================

  /**
   * Cleanup method to remove SDK listeners and reset all state to initial values.
   *
   * **When to Use:**
   * Call this method when you need to manually reset the service state, such as:
   * - User logout: Clear all message data before the next user logs in
   * - Account switching: Reset state when switching between different user accounts
   * - Conversation switching: Clear messages when changing active conversation
   * - Testing: Reset state between test cases
   *
   * **What It Does:**
   * - Removes all SDK listeners (message, group, call, connection listeners)
   * - Resets all state signals to initial values
   * - Clears message lookup maps
   * - Resets pagination IDs
   * - Clears all configuration properties including errorCallback
   *
   * **Automatic vs Manual Cleanup:**
   * - Automatic: DestroyRef handles cleanup when the Angular application is destroyed
   * - Manual: Call this method explicitly when you need to reset state during runtime
   *
   * **State Isolation:**
   * Because this is a singleton service, calling cleanup() will affect ALL components
   * that use this service. Make sure this is the desired behavior before calling.
   *
   * @example
   * ```typescript
   * // Reset state on user logout
   * onLogout() {
   *   this.messageListService.cleanup();
   *   // Now safe to log in a different user
   * }
   *
   * // Reset state when switching conversations
   * switchConversation(newUser: CometChat.User) {
   *   this.messageListService.cleanup();
   *   this.messageListService.setUser(newUser);
   *   this.messageListService.fetchPreviousMessages();
   * }
   * ```
   */
  cleanup(): void {
    // Remove SDK listeners
    this.removeMessageListener();
    this.removeGroupListener();
    this.removeCallListener();
    this.removeConnectionListener();

    // Remove event subscriptions
    this.removeSentMessageListener();
    this.removeEditedMessageListener();

    // Reset state (does not clear errorCallback)
    this.resetState();

    // Clear errorCallback during full cleanup (e.g., user logout)
    this.errorCallback = null;

    // Regenerate listener IDs for next use
    this.regenerateListenerIds();
  }

  /**
   * Reset all state to initial values.
   *
   * This is an internal method called during cleanup and DestroyRef onDestroy.
   * It resets all signals and maps to their initial empty states.
   *
   * **Signals Reset:**
   * - messagesSignal → []
   * - allMessagesSignal → []
   * - loadingStateSignal → false
   * - errorStateSignal → null
   * - prevMessageIdSignal → 0
   * - nextMessageIdSignal → 0
   * - unreadCountSignal → 0
   * - connectionStatusSignal → 'connected'
   *
   * **Maps Reset:**
   * - messageIdMap → cleared
   * - messageMuidMap → cleared
   *
   * **Configuration Properties Reset:**
   * - currentUser → null
   * - currentGroup → null
   * - parentMessageId → null
   * - messagesRequestBuilder → null
   * - hideGroupActionMessages → false
   * - messagesRequest → null
   * - nextMessagesRequest → null
   *
   * **Note:** errorCallback is NOT reset during resetState() to allow error
   * handling to persist across conversation switches. It is only cleared
   * during full cleanup() (e.g., user logout).
   *
   * @private
   * @see Requirement 1.6, 16.5
   */
  private resetState(): void {
    // Reset message arrays
    this.messagesSignal.set([]);
    this.allMessagesSignal.set([]);

    // Reset loading and error states
    this.loadingStateSignal.set(false);
    this.errorStateSignal.set(null);

    // Reset pagination IDs
    this.prevMessageIdSignal.set(0);
    this.nextMessageIdSignal.set(0);

    // Reset unread count
    this.unreadCountSignal.set(0);

    // Reset connection status to connected (default state)
    this.connectionStatusSignal.set('connected');

    // Clear message lookup maps
    this.messageIdMap.clear();
    this.messageMuidMap.clear();

    // Clear retry attempts tracking
    this.retryAttempts.clear();

    // Clear typing indicator state
    // Clear all pending timeouts to prevent memory leaks
    this.typingTimeoutsMap.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.typingTimeoutsMap.clear();
    this.typingUsersSignal.set(new Map());

    // Reset configuration properties
    // Note: errorCallback is NOT reset here to preserve error handling across conversation switches
    this.currentUser = null;
    this.currentGroup = null;
    this.parentMessageId = null;
    this.messagesRequestBuilder = null;
    this.hideGroupActionMessages = false;
    this.messagesRequest = null;
    this.nextMessagesRequest = null;

    // Clear translation cache
    this.translationCache.clear();
  }

  /**
   * Regenerate unique listener IDs.
   *
   * Called after cleanup to ensure new listener IDs are used
   * when listeners are set up again.
   *
   * @private
   */
  private regenerateListenerIds(): void {
    const timestamp = Date.now();
    this.messageListenerId = `message_list_${timestamp}`;
    this.groupListenerId = `message_list_group_${timestamp}`;
    this.callListenerId = `message_list_call_${timestamp}`;
    this.connectionListenerId = `message_list_connection_${timestamp}`;
  }

  /**
   * Normalize message ID to number type.
   *
   * The CometChat SDK sometimes returns message IDs as strings instead of numbers.
   * This helper ensures consistent number type for use as Map keys.
   *
   * @param messageId - The message ID from SDK (may be string or number)
   * @returns The message ID as a number
   * @private
   */
  private normalizeMessageId(messageId: string | number): number {
    return typeof messageId === 'string' ? parseInt(messageId, 10) : messageId;
  }

  // ==================== Listener Removal Methods ====================

  /**
   * Remove the message listener from CometChat SDK.
   *
   * This method safely removes the message listener that was registered with the SDK
   * using the unique `messageListenerId`. It is called during:
   * - Service cleanup (user logout, account switching)
   * - Conversation switching (before setting up new listeners)
   * - Service destruction (via DestroyRef)
   *
   * The method wraps the SDK call in a try-catch to ensure that any errors during
   * listener removal do not disrupt the application flow. Errors are logged for
   * debugging purposes but do not propagate to the UI.
   *
   * @private
   * @see Requirement 16.6 - Remove all SDK listeners during cleanup to prevent memory leaks
   */
  private removeMessageListener(): void {
    try {
      CometChat.removeMessageListener(this.messageListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing message listener:', error);
    }
  }

  /**
   * Remove the group listener from CometChat SDK.
   *
   * This method safely removes the group listener that was registered with the SDK
   * using the unique `groupListenerId`. It is called during:
   * - Service cleanup (user logout, account switching)
   * - Conversation switching (before setting up new listeners)
   * - Service destruction (via DestroyRef)
   *
   * The method wraps the SDK call in a try-catch to ensure that any errors during
   * listener removal do not disrupt the application flow. Errors are logged for
   * debugging purposes but do not propagate to the UI.
   *
   * @private
   * @see Requirement 16.6 - Remove all SDK listeners during cleanup to prevent memory leaks
   */
  private removeGroupListener(): void {
    try {
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing group listener:', error);
    }
  }

  /**
   * Remove the call listener from CometChat SDK.
   *
   * This method safely removes the call listener that was registered with the SDK
   * using the unique `callListenerId`. It is called during:
   * - Service cleanup (user logout, account switching)
   * - Conversation switching (before setting up new listeners)
   * - Service destruction (via DestroyRef)
   *
   * The method wraps the SDK call in a try-catch to ensure that any errors during
   * listener removal do not disrupt the application flow. Errors are logged for
   * debugging purposes but do not propagate to the UI.
   *
   * @private
   * @see Requirement 16.6 - Remove all SDK listeners during cleanup to prevent memory leaks
   */
  private removeCallListener(): void {
    try {
      CometChat.removeCallListener(this.callListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing call listener:', error);
    }
  }

  /**
   * Remove the connection listener from CometChat SDK.
   *
   * This method safely removes the connection listener that was registered with the SDK
   * using the unique `connectionListenerId`. It is called during:
   * - Service cleanup (user logout, account switching)
   * - Conversation switching (before setting up new listeners)
   * - Service destruction (via DestroyRef)
   *
   * The method wraps the SDK call in a try-catch to ensure that any errors during
   * listener removal do not disrupt the application flow. Errors are logged for
   * debugging purposes but do not propagate to the UI.
   *
   * @private
   * @see Requirement 16.6 - Remove all SDK listeners during cleanup to prevent memory leaks
   */
  private removeConnectionListener(): void {
    try {
      CometChat.removeConnectionListener(this.connectionListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing connection listener:', error);
    }
  }

  /**
   * Remove the sent message listener subscription.
   *
   * This method safely unsubscribes from the `CometChatMessageEvents.ccMessageSent`
   * event to prevent memory leaks. It is called during:
   * - Service cleanup (user logout, account switching)
   * - Service destruction (via DestroyRef)
   *
   * **Important:** This method is NOT called during `resetState()` because the
   * subscription should persist across conversation switches. The sent message
   * listener is global and handles messages for any conversation, so it only
   * needs to be removed during full cleanup (e.g., user logout).
   *
   * @private
   * @see Requirement 1.5 - Unsubscribe from ccMessageSent during cleanup
   * @see Requirement 5.3 - Unsubscribe on cleanup to prevent memory leaks
   * @see Requirement 5.5 - Do NOT unsubscribe during resetState
   */
  private removeSentMessageListener(): void {
    if (this.ccMessageSentSubscription) {
      this.ccMessageSentSubscription.unsubscribe();
      this.ccMessageSentSubscription = null;
    }
  }

  /**
   * Remove the edited message listener subscription.
   *
   * This method safely unsubscribes from the `CometChatMessageEvents.ccMessageEdited`
   * event to prevent memory leaks. It is called during:
   * - Service cleanup (user logout, account switching)
   * - Service destruction (via DestroyRef)
   *
   * **Important:** This method is NOT called during `resetState()` because the
   * subscription should persist across conversation switches.
   *
   * @private
   */
  private removeEditedMessageListener(): void {
    if (this.ccMessageEditedSubscription) {
      this.ccMessageEditedSubscription.unsubscribe();
      this.ccMessageEditedSubscription = null;
    }
  }

  // ==================== Getter Methods for Listener IDs ====================

  /**
   * Get the message listener ID.
   * Useful for testing and debugging.
   *
   * @returns The current message listener ID
   */
  getMessageListenerId(): string {
    return this.messageListenerId;
  }

  /**
   * Get the group listener ID.
   * Useful for testing and debugging.
   *
   * @returns The current group listener ID
   */
  getGroupListenerId(): string {
    return this.groupListenerId;
  }

  /**
   * Get the call listener ID.
   * Useful for testing and debugging.
   *
   * @returns The current call listener ID
   */
  getCallListenerId(): string {
    return this.callListenerId;
  }

  /**
   * Get the connection listener ID.
   * Useful for testing and debugging.
   *
   * @returns The current connection listener ID
   */
  getConnectionListenerId(): string {
    return this.connectionListenerId;
  }

  // ==================== Public Setter Methods ====================

  /**
   * Set the current user for 1-on-1 conversations.
   *
   * This method configures the service to fetch and display messages for a
   * 1-on-1 conversation with the specified user. It handles the complete
   * conversation context switch including:
   *
   * 1. **Mutual Exclusivity**: Clears `currentGroup` to ensure only one
   *    conversation context is active at a time
   * 2. **State Reset**: Clears existing messages and resets pagination state
   * 3. **Listener Management**: Removes existing listeners and sets up new
   *    listeners for the new conversation (implemented in later tasks)
   * 4. **Request Builder**: Builds a new MessagesRequest configured for
   *    the user conversation
   *
   * **Usage:**
   * Call this method when the user selects a 1-on-1 conversation to view.
   * After calling this method, call `fetchPreviousMessages()` to load the
   * initial messages.
   *
   * **State Changes:**
   * - `currentUser` is set to the provided user
   * - `currentGroup` is cleared to null
   * - All message arrays are cleared
   * - Pagination IDs are reset to 0
   * - New MessagesRequest is built for the user
   *
   * @param user - The CometChat User to set as the current conversation context
   *
   * @example
   * ```typescript
   * // Switch to a 1-on-1 conversation
   * async switchToUserConversation(user: CometChat.User) {
   *   this.messageListService.setUser(user);
   *   await this.messageListService.fetchPreviousMessages();
   * }
   * ```
   *
   * @see Requirement 17.1 - setUser method
   * @see Requirement 17.3 - Clear existing messages and listeners
   * @see Requirement 17.4 - Set up new listeners for new conversation
   * @see Requirement 17.6 - Mutual exclusivity between user and group
   */
  setUser(user: CometChat.User): void {
    if (!user) {
      const error = new Error('[MessageListService] setUser: User is required');
      CometChatLogger.error('MessageListService', error.message);
      if (this.errorCallback) {
        this.errorCallback(error as unknown as CometChat.CometChatException);
      }
      return;
    }

    // Clear existing messages and state for conversation switch
    this.clearMessagesAndState();

    // Remove existing listeners before setting up new ones
    // TODO: Listener setup will be implemented in Tasks 11, 12, 13, 14
    // this.removeMessageListener();
    this.removeGroupListener();
    this.removeCallListener();
    this.removeConnectionListener();

    // Set the new user and clear group (mutual exclusivity)
    this.currentUser = user;
    this.currentGroup = null;

    // Build new MessagesRequest for the user conversation
    this.messagesRequest = this.buildMessagesRequest();
    this.nextMessagesRequest = this.buildNextMessagesRequest();

    // TODO: Set up new listeners for the new conversation
    // Listener setup will be implemented in Tasks 11, 12, 13, 14:
    // - setupMessageListener() - Task 11.1
    // - setupGroupListener() - Task 12.1 (not needed for user conversations)
    // - setupCallListener() - Task 13.1
    // - setupConnectionListener() - Task 14.1
  }

  /**
   * Set the current group for group conversations.
   *
   * This method configures the service to fetch and display messages for a
   * group conversation with the specified group. It handles the complete
   * conversation context switch including:
   *
   * 1. **Mutual Exclusivity**: Clears `currentUser` to ensure only one
   *    conversation context is active at a time
   * 2. **State Reset**: Clears existing messages and resets pagination state
   * 3. **Listener Management**: Removes existing listeners and sets up new
   *    listeners for the new conversation (implemented in later tasks)
   * 4. **Request Builder**: Builds a new MessagesRequest configured for
   *    the group conversation
   *
   * **Usage:**
   * Call this method when the user selects a group conversation to view.
   * After calling this method, call `fetchPreviousMessages()` to load the
   * initial messages.
   *
   * **State Changes:**
   * - `currentGroup` is set to the provided group
   * - `currentUser` is cleared to null
   * - All message arrays are cleared
   * - Pagination IDs are reset to 0
   * - New MessagesRequest is built for the group
   *
   * @param group - The CometChat Group to set as the current conversation context
   *
   * @example
   * ```typescript
   * // Switch to a group conversation
   * async switchToGroupConversation(group: CometChat.Group) {
   *   this.messageListService.setGroup(group);
   *   await this.messageListService.fetchPreviousMessages();
   * }
   * ```
   *
   * @see Requirement 17.2 - setGroup method
   * @see Requirement 17.3 - Clear existing messages and listeners
   * @see Requirement 17.4 - Set up new listeners for new conversation
   * @see Requirement 17.6 - Mutual exclusivity between user and group
   */
  setGroup(group: CometChat.Group): void {
    if (!group) {
      const error = new Error('[MessageListService] setGroup: Group is required');
      CometChatLogger.error('MessageListService', error.message);
      if (this.errorCallback) {
        this.errorCallback(error as unknown as CometChat.CometChatException);
      }
      return;
    }

    // Clear existing messages and state for conversation switch
    this.clearMessagesAndState();

    // Remove existing listeners before setting up new ones
    // TODO: Listener setup will be implemented in Tasks 11, 12, 13, 14
    // this.removeMessageListener();
    this.removeGroupListener();
    this.removeCallListener();
    this.removeConnectionListener();

    // Set the new group and clear user (mutual exclusivity)
    this.currentGroup = group;
    this.currentUser = null;

    // Build new MessagesRequest for the group conversation
    this.messagesRequest = this.buildMessagesRequest();
    this.nextMessagesRequest = this.buildNextMessagesRequest();

    // TODO: Set up new listeners for the new conversation
    // Listener setup will be implemented in Tasks 11, 12, 13, 14:
    // - setupMessageListener() - Task 11.1
    // - setupGroupListener() - Task 12.1
    // - setupCallListener() - Task 13.1
    // - setupConnectionListener() - Task 14.1
  }

  /**
   * Clear the current conversation (both user and group).
   *
   * This method is called when a conversation is deleted or when the user
   * navigates away from a conversation without selecting a new one.
   * It clears all messages, state, and listeners without setting a new conversation.
   */
  clearConversation(): void {
    // Clear existing messages and state
    this.clearMessagesAndState();

    // Remove all listeners
    this.removeGroupListener();
    this.removeCallListener();
    this.removeConnectionListener();

    // Clear both user and group
    this.currentUser = null;
    this.currentGroup = null;

    // Clear MessagesRequest objects
    this.messagesRequest = null;
    this.nextMessagesRequest = null;
  }

  /**
   * Set the parent message ID for thread mode.
   *
   * This method configures the service to operate in thread mode, where only
   * messages that are replies to the specified parent message are fetched
   * and displayed.
   *
   * **Thread Mode Behavior:**
   * - When `parentMessageId` is set (not null), the service operates in thread mode
   * - Only messages with matching `parentMessageId` are fetched
   * - `hideReplies` is set to false in the MessagesRequestBuilder
   * - Real-time listeners filter messages to only show thread replies
   *
   * **Normal Mode Behavior:**
   * - When `parentMessageId` is null, the service operates in normal mode
   * - All messages in the conversation are fetched
   * - `hideReplies` is set to true to keep the main conversation clean
   *
   * **Usage:**
   * Call this method when entering or exiting thread view. After calling
   * this method, call `fetchPreviousMessages()` to load the thread messages.
   *
   * @param parentMessageId - The ID of the parent message for thread mode,
   *                          or null to exit thread mode
   *
   * @example
   * ```typescript
   * // Enter thread mode
   * viewThread(parentMessage: CometChat.BaseMessage) {
   *   this.messageListService.setParentMessageId(parentMessage.getId());
   *   this.messageListService.fetchPreviousMessages();
   * }
   *
   * // Exit thread mode
   * exitThread() {
   *   this.messageListService.setParentMessageId(null);
   *   this.messageListService.fetchPreviousMessages();
   * }
   * ```
   *
   * @see Requirement 3.5 - Configure builder for thread message fetching
   * @see Requirement 14.1 - Thread mode configuration
   * @see Requirement 14.2 - Only fetch messages with matching parentMessageId
   */
  setParentMessageId(parentMessageId: number | null): void {
    this.parentMessageId = parentMessageId;

    // Rebuild MessagesRequest to reflect thread mode change
    // Only rebuild if we have a conversation context
    if (this.currentUser || this.currentGroup) {
      // Clear stale messages and state before rebuilding, consistent with setUser()/setGroup()
      this.clearMessagesAndState();
      this.messagesRequest = this.buildMessagesRequest();
      this.nextMessagesRequest = this.buildNextMessagesRequest();
    }
  }

  /**
   * Set a custom MessagesRequestBuilder for advanced message fetch configuration.
   *
   * This method allows components to provide a custom MessagesRequestBuilder
   * that overrides the default builder configuration. This is part of the
   * Hybrid Approach Pattern where the service provides defaults but component
   * inputs can override them.
   *
   * **Use Cases:**
   * - Filter messages by specific types (e.g., only text messages)
   * - Change the message fetch limit
   * - Add custom tags or metadata filters
   * - Configure advanced SDK options
   *
   * **Behavior:**
   * - When a custom builder is provided, it is used instead of the default builder
   * - The service still applies conversation context (UID/GUID) and thread mode
   *   configuration to the custom builder
   * - Set to null to revert to default builder behavior
   *
   * @param builder - The custom MessagesRequestBuilder to use, or null to use defaults
   *
   * @example
   * ```typescript
   * // Use custom builder to only fetch text messages
   * const customBuilder = new CometChat.MessagesRequestBuilder()
   *   .setLimit(50)
   *   .setTypes(['text']);
   * this.messageListService.setMessagesRequestBuilder(customBuilder);
   *
   * // Revert to default builder
   * this.messageListService.setMessagesRequestBuilder(null);
   * ```
   *
   * @see Requirement 3.1 - Accept optional MessagesRequestBuilder
   * @see Requirement 1.4 - Hybrid Approach Pattern
   */
  setMessagesRequestBuilder(builder: CometChat.MessagesRequestBuilder | null): void {
    this.messagesRequestBuilder = builder;

    // Rebuild MessagesRequest with new builder
    // Only rebuild if we have a conversation context
    if (this.currentUser || this.currentGroup) {
      this.messagesRequest = this.buildMessagesRequest();
      this.nextMessagesRequest = this.buildNextMessagesRequest();
    }
  }

  /**
   * Set whether to hide group action messages in the message list.
   *
   * Group action messages include:
   * - Member joined
   * - Member left
   * - Member kicked
   * - Member banned
   * - Member unbanned
   * - Member scope changed
   * - Member added
   *
   * **Behavior:**
   * - When `hide` is true, group action messages are excluded from the
   *   message categories in the MessagesRequestBuilder
   * - When `hide` is false, group action messages are included
   * - This also affects real-time group action events (they won't be
   *   added to the list when hidden)
   *
   * @param hide - True to hide group action messages, false to show them
   *
   * @example
   * ```typescript
   * // Hide group action messages for cleaner conversation view
   * this.messageListService.setHideGroupActionMessages(true);
   *
   * // Show group action messages
   * this.messageListService.setHideGroupActionMessages(false);
   * ```
   *
   * @see Requirement 9.10 - Hide group action messages when flag is true
   */
  setHideGroupActionMessages(hide: boolean): void {
    this.hideGroupActionMessages = hide;

    // Rebuild MessagesRequest to reflect category change
    // Only rebuild if we have a conversation context
    if (this.currentUser || this.currentGroup) {
      this.messagesRequest = this.buildMessagesRequest();
      this.nextMessagesRequest = this.buildNextMessagesRequest();
    }
  }

  // ==================== Custom Message Types/Categories Methods ====================

  /**
   * Add custom message types to include in message fetching.
   *
   * These types are merged with the default types when building the
   * MessagesRequestBuilder. Empty, null, and undefined values are filtered out.
   * Duplicate types are automatically deduplicated via Set.
   *
   * When a custom `MessagesRequestBuilder` is provided via `setMessagesRequestBuilder`,
   * these custom types are NOT appended — the custom builder is used as-is.
   *
   * @param types - Array of message type strings to add
   *
   * @example
   * ```typescript
   * this.messageListService.addCustomMessageTypes(['location', 'payment']);
   * ```
   *
   * @see Requirement 3.1 - addCustomMessageTypes method
   * @see Requirement 3.3 - Include custom types in MessagesRequestBuilder
   * @see Requirement 3.7 - Custom builder bypasses custom types
   * @see Requirement 3.8 - Deduplication
   */
  addCustomMessageTypes(types: string[]): void {
    if (!types) return;
    types
      .filter(t => t != null && t !== '')
      .forEach(t => this.customMessageTypes.add(t));
  }

  /**
   * Add custom message categories to include in message fetching.
   *
   * These categories are merged with the default categories when building the
   * MessagesRequestBuilder. Empty, null, and undefined values are filtered out.
   * Duplicate categories are automatically deduplicated via Set.
   *
   * When a custom `MessagesRequestBuilder` is provided via `setMessagesRequestBuilder`,
   * these custom categories are NOT appended — the custom builder is used as-is.
   *
   * @param categories - Array of message category strings to add
   *
   * @example
   * ```typescript
   * this.messageListService.addCustomMessageCategories(['custom', 'interactive']);
   * ```
   *
   * @see Requirement 3.2 - addCustomMessageCategories method
   * @see Requirement 3.4 - Include custom categories in MessagesRequestBuilder
   * @see Requirement 3.7 - Custom builder bypasses custom categories
   * @see Requirement 3.8 - Deduplication
   */
  addCustomMessageCategories(categories: string[]): void {
    if (!categories) return;
    categories
      .filter(c => c != null && c !== '')
      .forEach(c => this.customMessageCategories.add(c));
  }

  /**
   * Remove previously added custom message types.
   *
   * @param types - Array of message type strings to remove
   *
   * @example
   * ```typescript
   * this.messageListService.removeCustomMessageTypes(['location']);
   * ```
   *
   * @see Requirement 3.5 - removeCustomMessageTypes method
   */
  removeCustomMessageTypes(types: string[]): void {
    if (!types) return;
    types.forEach(t => this.customMessageTypes.delete(t));
  }

  /**
   * Remove previously added custom message categories.
   *
   * @param categories - Array of message category strings to remove
   *
   * @example
   * ```typescript
   * this.messageListService.removeCustomMessageCategories(['custom']);
   * ```
   *
   * @see Requirement 3.6 - removeCustomMessageCategories method
   */
  removeCustomMessageCategories(categories: string[]): void {
    if (!categories) return;
    categories.forEach(c => this.customMessageCategories.delete(c));
  }

  /**
   * Replace the entire message types array used for fetching.
   *
   * This completely overrides the built-in default types. Any types added
   * via `addCustomMessageTypes` are still merged on top of this replacement.
   * Pass `null` to revert to the built-in defaults.
   *
   * @param types - Array of message type strings to use, or `null` to reset
   *
   * @example
   * ```typescript
   * // Replace defaults entirely
   * this.messageListService.setMessageTypes(['text', 'image', 'location']);
   *
   * // Revert to built-in defaults
   * this.messageListService.setMessageTypes(null);
   * ```
   */
  setMessageTypes(types: string[] | null): void {
    if (types === null) {
      this.replacedMessageTypes = null;
      return;
    }
    this.replacedMessageTypes = new Set(types.filter(t => t != null && t !== ''));
  }

  /**
   * Replace the entire message categories array used for fetching.
   *
   * This completely overrides the built-in default categories. Any categories
   * added via `addCustomMessageCategories` are still merged on top of this
   * replacement. Pass `null` to revert to the built-in defaults.
   *
   * @param categories - Array of message category strings to use, or `null` to reset
   *
   * @example
   * ```typescript
   * // Replace defaults entirely
   * this.messageListService.setMessageCategories(['message', 'custom']);
   *
   * // Revert to built-in defaults
   * this.messageListService.setMessageCategories(null);
   * ```
   */
  setMessageCategories(categories: string[] | null): void {
    if (categories === null) {
      this.replacedMessageCategories = null;
      return;
    }
    this.replacedMessageCategories = new Set(categories.filter(c => c != null && c !== ''));
  }

  /**
   * Get the current list of message types that will be used for fetching.
   *
   * Returns the effective types array: either the replaced set (if `setMessageTypes`
   * was called), or the built-in defaults, merged with any custom types added via
   * `addCustomMessageTypes`.
   *
   * @returns Array of message type strings
   *
   * @example
   * ```typescript
   * const types = this.messageListService.getAllMessageTypes();
   * // ['text', 'file', 'image', 'audio', 'video', 'groupMember', 'form', ...]
   * ```
   */
  getAllMessageTypes(): string[] {
    return this.getDefaultMessageTypes();
  }

  /**
   * Get the current list of message categories that will be used for fetching.
   *
   * Returns the effective categories array: either the replaced set (if
   * `setMessageCategories` was called), or the built-in defaults, merged with
   * any custom categories added via `addCustomMessageCategories`.
   *
   * @returns Array of message category strings
   *
   * @example
   * ```typescript
   * const categories = this.messageListService.getAllMessageCategories();
   * // ['message', 'custom', 'call', 'interactive', 'agentic', 'action']
   * ```
   */
  getAllMessageCategories(): string[] {
    return this.getDefaultMessageCategories();
  }

  /**
   * Set the error callback for propagating errors to components.
   *
   * This method allows components to register a callback function that will
   * be invoked whenever an error occurs in the service. This enables custom
   * error handling such as showing toast messages, triggering retry logic,
   * or logging to analytics.
   *
   * **Error Callback Lifecycle:**
   * - The callback is preserved during `resetState()` to allow error handling
   *   to persist across conversation switches
   * - The callback is only cleared during full `cleanup()` (e.g., user logout)
   *   or when explicitly set to null
   *
   * **Error Types:**
   * The callback receives a `CometChat.CometChatException` which includes:
   * - Error code
   * - Error message
   * - Error details
   *
   * @param callback - The error callback function, or null to remove the callback
   *
   * @example
   * ```typescript
   * // Set error callback to show toast messages
   * this.messageListService.setErrorCallback((error) => {
   *   this.toastService.showError(error.message);
   *   this.analyticsService.logError('message_list_error', error);
   * });
   *
   * // Remove error callback
   * this.messageListService.setErrorCallback(null);
   * ```
   *
   * @see Requirement 15.3 - Error callback mechanism for propagating errors
   */
  setErrorCallback(callback: ErrorCallback | null): void {
    this.errorCallback = callback;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Clear messages and state for conversation switching.
   *
   * This method clears all message-related state without removing listeners
   * or resetting configuration properties. It's used internally when switching
   * between conversations.
   *
   * **What It Clears:**
   * - Message arrays (messagesSignal, allMessagesSignal)
   * - Message lookup maps (messageIdMap, messageMuidMap)
   * - Pagination IDs (prevMessageIdSignal, nextMessageIdSignal)
   * - Unread count
   * - Error state
   * - MessagesRequest objects
   *
   * **What It Preserves:**
   * - Listener IDs (will be reused or regenerated separately)
   * - Error callback (preserved across conversation switches)
   * - Connection status
   *
   * @private
   */
  private clearMessagesAndState(): void {
    // Increment fetch generation to invalidate any in-flight fetch requests.
    // This ensures stale promises from a previous conversation don't update
    // signals or set error state after the conversation has changed.
    this.fetchGeneration++;

    // Clear message arrays
    this.messagesSignal.set([]);
    this.allMessagesSignal.set([]);

    // Clear message lookup maps
    this.messageIdMap.clear();
    this.messageMuidMap.clear();

    // Reset pagination IDs
    this.prevMessageIdSignal.set(0);
    this.nextMessageIdSignal.set(0);

    // Reset unread count
    this.unreadCountSignal.set(0);

    // Clear error state
    this.errorStateSignal.set(null);

    // Clear MessagesRequest objects (will be rebuilt)
    this.messagesRequest = null;
    this.nextMessagesRequest = null;
  }

  // ==================== Fetch Operations ====================

  /**
   * Fetch previous (older) messages for the current conversation.
   *
   * This method fetches older messages by calling the CometChat SDK's `fetchPrevious()`
   * method. It is typically called when the user scrolls up in the message list to
   * load more message history.
   *
   * ## Behavior
   *
   * 1. **Pre-flight Check**: Verifies that a conversation context is set (user or group)
   *    and that a MessagesRequest exists. Returns `false` if not configured.
   *
   * 2. **Loading State**: Sets `loadingStateSignal` to `true` before fetching and
   *    `false` after completion (whether successful or failed).
   *
   * 3. **Message Fetching**: Calls the SDK's `fetchPrevious()` method to retrieve
   *    older messages based on the current pagination state.
   *
   * 4. **Message Storage**: Prepends fetched messages to both `allMessagesSignal`
   *    and `messagesSignal` arrays (older messages go at the beginning).
   *
   * 5. **Pagination Tracking**: Updates `prevMessageIdSignal` with the ID of the
   *    oldest message in the fetched batch for subsequent pagination.
   *
   * 6. **Message Indexing**: Adds all fetched messages to `messageIdMap` and
   *    `messageMuidMap` for O(1) lookup.
   *
   * 7. **Has More Detection**: Returns `true` if the number of fetched messages
   *    equals the configured limit (indicating more messages may be available),
   *    `false` otherwise.
   *
   * ## Error Handling
   *
   * - Errors are caught and stored in `errorStateSignal`
   * - Errors are logged to console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The method returns `false` on error
   *
   * ## Usage
   *
   * Call this method after setting a conversation context via `setUser()` or
   * `setGroup()`. It can be called multiple times to load more message history.
   *
   * @returns Promise<boolean> - `true` if more messages are available (hasMore),
   *                             `false` if no more messages or an error occurred
   *
   * @example
   * ```typescript
   * // Initial message load
   * async loadMessages() {
   *   this.messageListService.setUser(this.user);
   *   const hasMore = await this.messageListService.fetchPreviousMessages();
   *   console.log('Has more messages:', hasMore);
   * }
   *
   * // Load more on scroll
   * async onScrollUp() {
   *   if (this.messageListService.loadingState()) return;
   *   const hasMore = await this.messageListService.fetchPreviousMessages();
   *   if (!hasMore) {
   *     console.log('Reached beginning of conversation');
   *   }
   * }
   *
   * // With error handling
   * async loadMessagesWithErrorHandling() {
   *   this.messageListService.setErrorCallback((error) => {
   *     this.toastService.showError('Failed to load messages');
   *   });
   *   await this.messageListService.fetchPreviousMessages();
   * }
   * ```
   *
   * @see Requirement 4.1 - Invoke SDK's fetchPrevious() method
   * @see Requirement 4.2 - Set loadingStateSignal to true during fetch
   * @see Requirement 4.3 - Prepend messages to allMessagesSignal
   * @see Requirement 4.4 - Update prevMessageIdSignal with oldest message ID
   * @see Requirement 4.5 - Set loadingStateSignal to false after fetch
   * @see Requirement 4.6 - Set errorStateSignal on error
   * @see Requirement 4.7 - Set loadingStateSignal to false on error
   * @see Requirement 4.8 - Return boolean indicating hasMore
   */
  async fetchPreviousMessages(): Promise<boolean> {
    // 1. Check if messagesRequest exists (conversation context must be set)
    if (!this.messagesRequest) {
      CometChatLogger.warn(
        'MessageListService',
        'Cannot fetch messages: No conversation context set. Call setUser() or setGroup() first.'
      );
      return false;
    }

    // Capture the current fetch generation before the async call.
    // If the conversation changes while this fetch is in-flight,
    // fetchGeneration will be incremented and we can detect staleness.
    const generation = this.fetchGeneration;

    // 2. Set loading state to true
    this.loadingStateSignal.set(true);

    try {
      // 3. Call SDK's fetchPrevious()
      const messages: CometChat.BaseMessage[] = await this.messagesRequest.fetchPrevious();

      // 3a. Discard stale results — conversation changed while fetch was in-flight
      if (generation !== this.fetchGeneration) {
        return false;
      }

      // 4. If messages were fetched
      if (messages && messages.length > 0) {
        // 5. Prepend messages to allMessagesSignal (older messages go at the beginning)
        this.allMessagesSignal.update(current => [...messages, ...current]);
        this.messagesSignal.update(current => [...messages, ...current]);

        // 6. Update prevMessageIdSignal with the oldest message ID
        const oldestMessage = messages[0];
        const isFirstFetch = this.prevMessageIdSignal() === 0;
        this.prevMessageIdSignal.set(oldestMessage.getId());

        // Also update nextMessageIdSignal if this is the first fetch
        // (newest message in the batch becomes the reference for forward pagination)
        if (this.nextMessageIdSignal() === 0) {
          const newestMessage = messages[messages.length - 1];
          this.nextMessageIdSignal.set(newestMessage.getId());
        }

        // 7. Update messageIdMap and messageMuidMap for O(1) lookup
        for (const message of messages) {
          const messageId = this.normalizeMessageId(message.getId());
          this.messageIdMap.set(messageId, message);
          const muid = message.getMuid?.();
          if (muid) {
            this.messageMuidMap.set(muid, message);
          }
        }

        // 8. Mark initial messages as read (if this is the first fetch)
        // This ensures read receipts are sent for unread messages when chat loads
        if (isFirstFetch) {
          // This is the first fetch - mark unread messages as read after a short delay to ensure DOM is rendered
          setTimeout(() => {
            this.markInitialMessagesAsRead();
          }, 100);
        }
      }

      // 9. Set loading state to false
      this.loadingStateSignal.set(false);

      // 10. Return whether more messages are available
      // If we received exactly the limit number of messages, there may be more
      return messages.length === this.DEFAULT_MESSAGE_LIMIT;
    } catch (error) {
      // 11. Handle error — but only if the conversation hasn't changed
      if (generation !== this.fetchGeneration) {
        // Stale error from a previous conversation — discard silently
        return false;
      }

      this.loadingStateSignal.set(false);
      this.errorStateSignal.set(error as Error);
      CometChatLogger.error('MessageListService', 'Error fetching previous messages:', error);

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }

      return false;
    }
  }

  /**
   * Fetch next (newer) messages for the current conversation.
   *
   * This method fetches newer messages by calling the CometChat SDK's `fetchNext()`
   * method. It is typically called when the user scrolls down in the message list to
   * load more recent messages, or when catching up after reconnection.
   *
   * ## Behavior
   *
   * 1. **Pre-flight Check**: Verifies that a conversation context is set (user or group)
   *    and that a `nextMessagesRequest` exists. Returns `false` if not configured.
   *
   * 2. **Loading State**: Sets `loadingStateSignal` to `true` before fetching and
   *    `false` after completion (whether successful or failed).
   *
   * 3. **Message Fetching**: Calls the SDK's `fetchNext()` method to retrieve
   *    newer messages based on the current pagination state.
   *
   * 4. **Message Storage**: Appends fetched messages to both `allMessagesSignal`
   *    and `messagesSignal` arrays (newer messages go at the end).
   *
   * 5. **Pagination Tracking**: Updates `nextMessageIdSignal` with the ID of the
   *    newest message in the fetched batch for subsequent pagination.
   *
   * 6. **Message Indexing**: Adds all fetched messages to `messageIdMap` and
   *    `messageMuidMap` for O(1) lookup.
   *
   * 7. **Has More Detection**: Returns `true` if the number of fetched messages
   *    equals the configured limit (indicating more messages may be available),
   *    `false` otherwise.
   *
   * ## Difference from fetchPreviousMessages
   *
   * - Uses `nextMessagesRequest` instead of `messagesRequest`
   * - Appends messages to the end instead of prepending to the beginning
   * - Updates `nextMessageIdSignal` instead of `prevMessageIdSignal`
   *
   * ## Error Handling
   *
   * - Errors are caught and stored in `errorStateSignal`
   * - Errors are logged to console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The method returns `false` on error
   *
   * ## Usage Scenarios
   *
   * - **Scroll Down**: User scrolls down to load newer messages
   * - **Reconnection**: Fetch messages missed during disconnection
   * - **Jump to Message**: Load newer messages after jumping to a specific message
   *
   * @returns Promise<boolean> - `true` if more messages are available (hasMore),
   *                             `false` if no more messages or an error occurred
   *
   * @example
   * ```typescript
   * // Load newer messages on scroll down
   * async onScrollDown() {
   *   if (this.messageListService.loadingState()) return;
   *   const hasMore = await this.messageListService.fetchNextMessages();
   *   if (!hasMore) {
   *     console.log('Reached end of conversation');
   *   }
   * }
   *
   * // Catch up after reconnection
   * async onReconnected() {
   *   // Fetch any messages that were missed during disconnection
   *   let hasMore = true;
   *   while (hasMore) {
   *     hasMore = await this.messageListService.fetchNextMessages();
   *   }
   * }
   *
   * // With error handling
   * async loadNewerMessagesWithErrorHandling() {
   *   this.messageListService.setErrorCallback((error) => {
   *     this.toastService.showError('Failed to load newer messages');
   *   });
   *   await this.messageListService.fetchNextMessages();
   * }
   * ```
   *
   * @see Requirement 5.1 - Invoke SDK's fetchNext() method
   * @see Requirement 5.2 - Set loadingStateSignal to true during fetch
   * @see Requirement 5.3 - Append messages to allMessagesSignal
   * @see Requirement 5.4 - Update nextMessageIdSignal with newest message ID
   * @see Requirement 5.5 - Set loadingStateSignal to false after fetch
   * @see Requirement 5.6 - Set errorStateSignal on error
   * @see Requirement 5.7 - Set loadingStateSignal to false on error
   * @see Requirement 5.8 - Return boolean indicating hasMore
   */
  async fetchNextMessages(): Promise<boolean> {
    // 1. Check if nextMessagesRequest exists (conversation context must be set)
    if (!this.nextMessagesRequest) {
      CometChatLogger.warn(
        'MessageListService',
        'Cannot fetch next messages: No conversation context set. Call setUser() or setGroup() first.'
      );
      return false;
    }

    // Capture the current fetch generation before the async call.
    const generation = this.fetchGeneration;

    // 2. Set loading state to true
    this.loadingStateSignal.set(true);

    try {
      // 3. Call SDK's fetchNext()
      const messages: CometChat.BaseMessage[] = await this.nextMessagesRequest.fetchNext();

      // 3a. Discard stale results — conversation changed while fetch was in-flight
      if (generation !== this.fetchGeneration) {
        return false;
      }

      // 4. If messages were fetched
      if (messages && messages.length > 0) {
        // 5. Append messages to allMessagesSignal (newer messages go at the end)
        this.allMessagesSignal.update(current => [...current, ...messages]);
        this.messagesSignal.update(current => [...current, ...messages]);

        // 6. Update nextMessageIdSignal with the newest message ID
        const newestMessage = messages[messages.length - 1];
        this.nextMessageIdSignal.set(newestMessage.getId());

        // Also update prevMessageIdSignal if this is the first fetch
        // (oldest message in the batch becomes the reference for backward pagination)
        if (this.prevMessageIdSignal() === 0) {
          const oldestMessage = messages[0];
          this.prevMessageIdSignal.set(oldestMessage.getId());
        }

        // 7. Update messageIdMap and messageMuidMap for O(1) lookup
        for (const message of messages) {
          const messageId = this.normalizeMessageId(message.getId());
          this.messageIdMap.set(messageId, message);
          const muid = message.getMuid?.();
          if (muid) {
            this.messageMuidMap.set(muid, message);
          }
        }
      }

      // 8. Set loading state to false
      this.loadingStateSignal.set(false);

      // 9. Return whether more messages are available
      // If we received exactly the limit number of messages, there may be more
      return messages.length === this.DEFAULT_MESSAGE_LIMIT;
    } catch (error) {
      // 10. Handle error — but only if the conversation hasn't changed
      if (generation !== this.fetchGeneration) {
        return false;
      }

      this.loadingStateSignal.set(false);
      this.errorStateSignal.set(error as Error);
      CometChatLogger.error('MessageListService', 'Error fetching next messages:', error);

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }

      return false;
    }
  }

  /**
   * Fetch messages around a specific message ID (jump to message functionality).
   *
   * This method is used for "jump to message" functionality where the user wants to
   * navigate to a specific message in the conversation. It fetches messages both
   * before and after the target message to provide context around it.
   *
   * ## Behavior
   *
   * 1. **Pre-flight Check**: Verifies that a conversation context is set (user or group).
   *    Throws an error if not configured.
   *
   * 2. **State Reset**: Clears existing messages and resets pagination state since
   *    this is a "jump" operation that repositions the view.
   *
   * 3. **Loading State**: Sets `loadingStateSignal` to `true` before fetching and
   *    `false` after completion (whether successful or failed).
   *
   * 4. **Bidirectional Fetch**:
   *    - First, builds a MessagesRequest with the target messageId and fetches
   *      messages BEFORE the target (using `fetchPrevious()`)
   *    - Then, builds another MessagesRequest and fetches messages AFTER the target
   *      (using `fetchNext()`)
   *
   * 5. **Message Merging**: Combines messages from both fetches in chronological order:
   *    - Messages before the target (older) come first
   *    - Messages after the target (newer) come last
   *
   * 6. **Pagination Tracking**: Updates both pagination signals:
   *    - `prevMessageIdSignal` with the ID of the oldest message
   *    - `nextMessageIdSignal` with the ID of the newest message
   *
   * 7. **Message Indexing**: Adds all fetched messages to `messageIdMap` and
   *    `messageMuidMap` for O(1) lookup.
   *
   * 8. **Request Rebuilding**: Rebuilds `messagesRequest` and `nextMessagesRequest`
   *    for subsequent pagination from the new position.
   *
   * ## Use Cases
   *
   * - **Search Results**: User clicks on a search result to jump to that message
   * - **Notifications**: User clicks on a notification to view the mentioned message
   * - **Deep Links**: Opening a conversation at a specific message via URL
   * - **Replies**: Jumping to the original message when viewing a reply
   * - **Unread Messages**: Jumping to the first unread message
   *
   * ## Error Handling
   *
   * - Errors are caught and stored in `errorStateSignal`
   * - Errors are logged to console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The method throws the error for the caller to handle if needed
   *
   * ## Important Notes
   *
   * - This operation clears all existing messages before fetching
   * - The target message itself may or may not be included in the results
   *   depending on the SDK's behavior
   * - After calling this method, the user can scroll up/down to load more
   *   messages using `fetchPreviousMessages()` and `fetchNextMessages()`
   *
   * @param messageId - The ID of the message to fetch messages around
   * @returns Promise<void> - Resolves when messages are fetched and stored
   * @throws Error if no conversation context is set or if fetching fails
   *
   * @example
   * ```typescript
   * // Jump to a specific message from search results
   * async jumpToSearchResult(messageId: number) {
   *   try {
   *     await this.messageListService.fetchMessagesAroundId(messageId);
   *     // Scroll to the target message in the UI
   *     this.scrollToMessage(messageId);
   *   } catch (error) {
   *     this.toastService.showError('Failed to load message');
   *   }
   * }
   *
   * // Jump to first unread message
   * async jumpToFirstUnread(firstUnreadMessageId: number) {
   *   await this.messageListService.fetchMessagesAroundId(firstUnreadMessageId);
   *   this.highlightMessage(firstUnreadMessageId);
   * }
   *
   * // Jump to message from notification
   * async handleNotificationClick(notification: Notification) {
   *   const messageId = notification.messageId;
   *   this.messageListService.setUser(notification.sender);
   *   await this.messageListService.fetchMessagesAroundId(messageId);
   * }
   *
   * // With error handling
   * async jumpToMessageWithErrorHandling(messageId: number) {
   *   this.messageListService.setErrorCallback((error) => {
   *     this.toastService.showError('Failed to jump to message');
   *   });
   *
   *   try {
   *     await this.messageListService.fetchMessagesAroundId(messageId);
   *   } catch (error) {
   *     // Additional error handling if needed
   *     console.error('Jump to message failed:', error);
   *   }
   * }
   * ```
   *
   * @see Requirement 3.8 - Support messageId for jumping to specific message
   */
  async fetchMessagesAroundId(messageId: number): Promise<void> {
    // 1. Pre-flight check: Verify conversation context is set
    if (!this.currentUser && !this.currentGroup) {
      const error = new Error(
        '[MessageListService] Cannot fetch messages around ID: No conversation context set. Call setUser() or setGroup() first.'
      );
      CometChatLogger.error('MessageListService', error.message);
      this.errorStateSignal.set(error);
      throw error;
    }

    // 2. Clear existing messages and state (this is a "jump" operation)
    this.clearMessagesAndState();

    // Capture the current fetch generation after clearing (clearMessagesAndState increments it).
    const generation = this.fetchGeneration;

    // 3. Set loading state to true
    this.loadingStateSignal.set(true);

    try {
      // 4. Build MessagesRequest with the target messageId for fetching BEFORE
      const beforeRequest = this.buildMessagesRequest(messageId);

      // 5. Fetch messages BEFORE the target message (including the target)
      const messagesBefore: CometChat.BaseMessage[] = await beforeRequest.fetchPrevious();

      // 5a. Discard stale results — conversation changed while fetch was in-flight
      if (generation !== this.fetchGeneration) {
        return;
      }

      // 6. Build MessagesRequest for fetching AFTER the target message
      const afterRequest = this.buildNextMessagesRequest(messageId);

      // 7. Fetch messages AFTER the target message
      const messagesAfter: CometChat.BaseMessage[] = await afterRequest.fetchNext();

      // 7a. Discard stale results — conversation changed while fetch was in-flight
      if (generation !== this.fetchGeneration) {
        return;
      }

      // 8. Merge messages in chronological order
      // Messages before (older) come first, messages after (newer) come last
      // Note: messagesBefore is already in chronological order (oldest first)
      // messagesAfter is also in chronological order (oldest first)
      const allMessages: CometChat.BaseMessage[] = [...messagesBefore, ...messagesAfter];

      // 9. Remove duplicates (in case the target message appears in both results)
      const uniqueMessages = this.deduplicateMessages(allMessages);

      // 10. Update signals with merged messages
      if (uniqueMessages.length > 0) {
        this.allMessagesSignal.set(uniqueMessages);
        this.messagesSignal.set(uniqueMessages);

        // 11. Update pagination signals
        // prevMessageIdSignal = oldest message ID (for backward pagination)
        const oldestMessage = uniqueMessages[0];
        this.prevMessageIdSignal.set(oldestMessage.getId());

        // nextMessageIdSignal = newest message ID (for forward pagination)
        const newestMessage = uniqueMessages[uniqueMessages.length - 1];
        this.nextMessageIdSignal.set(newestMessage.getId());

        // 12. Update messageIdMap and messageMuidMap for O(1) lookup
        for (const message of uniqueMessages) {
          const messageId = this.normalizeMessageId(message.getId());
          this.messageIdMap.set(messageId, message);
          const muid = message.getMuid?.();
          if (muid) {
            this.messageMuidMap.set(muid, message);
          }
        }
      }

      // 13. Rebuild MessagesRequest objects for subsequent pagination
      // These will be used for fetchPreviousMessages() and fetchNextMessages()
      this.messagesRequest = this.buildMessagesRequest();
      this.nextMessagesRequest = this.buildNextMessagesRequest();

      // 14. Set loading state to false
      this.loadingStateSignal.set(false);
    } catch (error) {
      // 15. Handle error — but only if the conversation hasn't changed
      if (generation !== this.fetchGeneration) {
        return;
      }

      this.loadingStateSignal.set(false);
      this.errorStateSignal.set(error as Error);
      CometChatLogger.error('MessageListService', 'Error fetching messages around ID:', error);

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }
    }
  }

  /**
   * Remove duplicate messages from an array based on message ID.
   *
   * This helper method is used when merging messages from multiple fetch operations
   * (e.g., fetchMessagesAroundId) to ensure no duplicate messages appear in the list.
   *
   * The method preserves the order of messages and keeps the first occurrence
   * of each message ID.
   *
   * @param messages - Array of messages that may contain duplicates
   * @returns Array of unique messages in the same order
   * @private
   */
  private deduplicateMessages(messages: CometChat.BaseMessage[]): CometChat.BaseMessage[] {
    const seenIds = new Set<number>();
    const uniqueMessages: CometChat.BaseMessage[] = [];

    for (const message of messages) {
      const id = message.getId();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueMessages.push(message);
      }
    }

    return uniqueMessages;
  }

  // ==================== Error Handling Methods ====================

  /**
   * Determine if an error is recoverable and should be retried.
   *
   * This method analyzes an error to determine if it's a temporary/transient error
   * that may succeed on retry, or a permanent error that should not be retried.
   *
   * ## Recoverable Errors (return true)
   *
   * These errors are typically temporary and may succeed on retry:
   *
   * - **Network Errors**: Connection lost, network unavailable, DNS resolution failures
   *   - Error codes: `ERR_NETWORK`, `ECONNREFUSED`, `ENOTFOUND`, `ENETUNREACH`
   *
   * - **Timeout Errors**: Request took too long to complete
   *   - Error codes: `ETIMEDOUT`, `ECONNRESET`, `TIMEOUT`
   *
   * - **Temporary Server Errors**: Server is temporarily unavailable
   *   - HTTP status codes: 503 (Service Unavailable), 504 (Gateway Timeout)
   *   - Error codes: `SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT`
   *
   * - **Rate Limiting**: Too many requests in a short period
   *   - HTTP status code: 429 (Too Many Requests)
   *   - Error codes: `RATE_LIMIT_EXCEEDED`, `TOO_MANY_REQUESTS`
   *
   * ## Non-Recoverable Errors (return false)
   *
   * These errors are permanent and should not be retried:
   *
   * - **Authentication Errors**: Invalid credentials or session expired
   *   - HTTP status codes: 401 (Unauthorized), 403 (Forbidden)
   *   - Error codes: `AUTH_ERR`, `UNAUTHORIZED`, `FORBIDDEN`
   *
   * - **Not Found Errors**: Resource doesn't exist
   *   - HTTP status code: 404 (Not Found)
   *   - Error codes: `NOT_FOUND`, `ERR_UID_NOT_FOUND`, `ERR_GUID_NOT_FOUND`
   *
   * - **Validation Errors**: Invalid request parameters
   *   - HTTP status code: 400 (Bad Request)
   *   - Error codes: `VALIDATION_ERROR`, `BAD_REQUEST`, `INVALID_PARAMS`
   *
   * - **Server Errors**: Internal server errors (not temporary)
   *   - HTTP status code: 500 (Internal Server Error)
   *   - Error codes: `INTERNAL_SERVER_ERROR`
   *
   * ## Error Detection Strategy
   *
   * The method uses multiple strategies to detect error types:
   *
   * 1. **Error Code Check**: Examines `error.code` or `error.errorCode` properties
   *    for known error codes (both string and numeric)
   *
   * 2. **HTTP Status Check**: Examines `error.status` or `error.httpStatusCode`
   *    for HTTP status codes
   *
   * 3. **Error Message Analysis**: Falls back to analyzing the error message
   *    for keywords like "network", "timeout", "connection"
   *
   * 4. **Default Behavior**: If the error type cannot be determined, defaults
   *    to non-recoverable (false) to avoid infinite retry loops
   *
   * ## Usage
   *
   * This method is used internally by `handleErrorWithRetry()` to determine
   * whether to retry a failed operation or propagate the error immediately.
   *
   * @param error - The error to analyze. Can be any type (CometChat.CometChatException,
   *                Error, or unknown error object)
   * @returns `true` if the error is recoverable and retry is appropriate,
   *          `false` if the error is non-recoverable and should not be retried
   *
   * @example
   * ```typescript
   * // Internal usage in handleErrorWithRetry
   * private async handleErrorWithRetry(error: any, context: string, retryFn?: () => Promise<void>) {
   *   if (this.isRecoverableError(error) && currentAttempt < this.MAX_RETRY_ATTEMPTS) {
   *     // Retry the operation
   *     await retryFn();
   *   } else {
   *     // Propagate the error
   *     this.errorStateSignal.set(error);
   *   }
   * }
   * ```
   *
   * @private
   * @see Requirement 15.4 - Identify recoverable errors and implement retry logic
   */
  private isRecoverableError(error: unknown): boolean {
    // Handle null/undefined errors - not recoverable
    if (!error) {
      return false;
    }

    // Handle non-object errors (e.g., string errors) - check message content
    if (typeof error !== 'object') {
      const errorString = String(error).toLowerCase();
      return this.isRecoverableErrorMessage(errorString);
    }

    // Extract error code from various possible properties
    // CometChat SDK uses 'code' or 'errorCode', HTTP errors use 'status'
    const errObj = error as Record<string, unknown>;
    const code = errObj['code'] || errObj['errorCode'];
    const status = errObj['status'] || errObj['httpStatusCode'];

    // ==================== Check for Recoverable Error Codes ====================

    // Network/Connection errors (string codes)
    const recoverableStringCodes = [
      'ERR_NETWORK',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ENETUNREACH',
      'ECONNRESET',
      'ETIMEDOUT',
      'TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
      'RATE_LIMIT_EXCEEDED',
      'TOO_MANY_REQUESTS',
    ];

    if (typeof code === 'string' && recoverableStringCodes.includes(code.toUpperCase())) {
      return true;
    }

    // Temporary server errors and rate limiting (numeric codes)
    const recoverableNumericCodes = [
      503, // Service Unavailable
      504, // Gateway Timeout
      429, // Too Many Requests (Rate Limiting)
    ];

    if (typeof code === 'number' && recoverableNumericCodes.includes(code)) {
      return true;
    }

    // Check HTTP status codes
    if (typeof status === 'number' && recoverableNumericCodes.includes(status)) {
      return true;
    }

    // ==================== Check for Non-Recoverable Error Codes ====================

    // Authentication and authorization errors (string codes)
    const nonRecoverableStringCodes = [
      'AUTH_ERR',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'ERR_UID_NOT_FOUND',
      'ERR_GUID_NOT_FOUND',
      'VALIDATION_ERROR',
      'BAD_REQUEST',
      'INVALID_PARAMS',
      'INTERNAL_SERVER_ERROR',
    ];

    if (typeof code === 'string' && nonRecoverableStringCodes.includes(code.toUpperCase())) {
      return false;
    }

    // Non-recoverable HTTP status codes
    const nonRecoverableNumericCodes = [
      400, // Bad Request
      401, // Unauthorized
      403, // Forbidden
      404, // Not Found
      500, // Internal Server Error
    ];

    if (typeof code === 'number' && nonRecoverableNumericCodes.includes(code)) {
      return false;
    }

    // Check HTTP status codes for non-recoverable errors
    if (typeof status === 'number' && nonRecoverableNumericCodes.includes(status)) {
      return false;
    }

    // ==================== Fallback: Check Error Message ====================

    // If we couldn't determine from codes, check the error message
    const message = errObj['message'] || errObj['msg'] || '';
    if (typeof message === 'string' && message.length > 0) {
      return this.isRecoverableErrorMessage(message.toLowerCase());
    }

    // ==================== Default: Non-Recoverable ====================

    // If we can't determine the error type, default to non-recoverable
    // This prevents infinite retry loops for unknown error types
    return false;
  }

  /**
   * Check if an error message indicates a recoverable error.
   *
   * This helper method analyzes error message text for keywords that indicate
   * recoverable (temporary) errors. It's used as a fallback when error codes
   * are not available or not recognized.
   *
   * ## Recoverable Keywords
   *
   * The following keywords in an error message indicate a recoverable error:
   * - "network" - Network connectivity issues
   * - "timeout" - Request timeout
   * - "connection" - Connection problems
   * - "temporarily" - Temporary service issues
   * - "unavailable" - Service temporarily unavailable
   * - "rate limit" - Rate limiting
   * - "too many requests" - Rate limiting
   * - "retry" - Server suggests retry
   *
   * @param message - The error message to analyze (should be lowercase)
   * @returns `true` if the message indicates a recoverable error, `false` otherwise
   *
   * @private
   */
  private isRecoverableErrorMessage(message: string): boolean {
    const recoverableKeywords = [
      'network',
      'timeout',
      'connection',
      'temporarily',
      'unavailable',
      'rate limit',
      'too many requests',
      'retry',
      'econnrefused',
      'enotfound',
      'etimedout',
      'econnreset',
    ];

    return recoverableKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Get a user-friendly error message for a given error.
   *
   * This method maps technical error types to human-readable messages that can be
   * displayed to end users. It analyzes the error to determine its type and returns
   * an appropriate message that helps users understand what went wrong and what
   * action they can take.
   *
   * ## Error Type Mapping
   *
   * | Error Type       | User-Friendly Message                                                          |
   * |------------------|--------------------------------------------------------------------------------|
   * | Network          | "Unable to connect. Please check your internet connection and try again."      |
   * | Timeout          | "The request took too long. Please try again."                                 |
   * | Authentication   | "Authentication failed. Please log in again."                                  |
   * | Permission       | "You don't have permission to perform this action."                            |
   * | Not Found        | "The requested resource was not found."                                        |
   * | Server           | "Server error. Please try again later."                                        |
   * | Default          | "Failed to load messages. Please try again."                                   |
   *
   * ## Error Detection Strategy
   *
   * The method uses multiple strategies to detect error types:
   *
   * 1. **Error Code Check**: Examines `error.code` or `error.errorCode` properties
   *    for known error codes (both string and numeric)
   *
   * 2. **HTTP Status Check**: Examines `error.status` or `error.httpStatusCode`
   *    for HTTP status codes
   *
   * 3. **Error Message Analysis**: Falls back to analyzing the error message
   *    for keywords that indicate specific error types
   *
   * 4. **Default Message**: If the error type cannot be determined, returns
   *    a generic user-friendly message
   *
   * ## Context Parameter
   *
   * The `context` parameter provides additional information about where the error
   * occurred (e.g., "fetchPreviousMessages", "markAsRead"). This context is used
   * for logging purposes but is not included in the user-facing message to keep
   * messages simple and actionable.
   *
   * ## Usage
   *
   * This method is used internally by `handleErrorWithRetry()` to create
   * user-friendly error messages that are stored in `errorStateSignal` and
   * can be displayed in the UI.
   *
   * @param error - The error to analyze. Can be any type (CometChat.CometChatException,
   *                Error, or unknown error object)
   * @param context - A string describing where the error occurred (e.g., "fetchPreviousMessages").
   *                  Used for logging but not included in the user-facing message.
   * @returns A user-friendly error message string suitable for display to end users
   *
   * @example
   * ```typescript
   * // Internal usage in handleErrorWithRetry
   * private async handleErrorWithRetry(error: any, context: string, retryFn?: () => Promise<void>) {
   *   const userFriendlyMessage = this.getUserFriendlyErrorMessage(error, context);
   *   const enhancedError = new Error(userFriendlyMessage);
   *   this.errorStateSignal.set(enhancedError);
   * }
   *
   * // Example outputs:
   * // Network error → "Unable to connect. Please check your internet connection and try again."
   * // 401 error → "Authentication failed. Please log in again."
   * // 404 error → "The requested resource was not found."
   * // Unknown error → "Failed to load messages. Please try again."
   * ```
   *
   * @private
   * @see Requirement 15.6 - Provide user-friendly error messages for common error scenarios
   */
  private getUserFriendlyErrorMessage(error: unknown, context: string): string {
    // Log the context for debugging purposes
    console.debug(
      `[MessageListService] Getting user-friendly message for error in context: ${context}`
    );

    // Handle null/undefined errors
    if (!error) {
      return 'Failed to load messages. Please try again.';
    }

    // Handle non-object errors (e.g., string errors)
    if (typeof error !== 'object') {
      const errorString = String(error).toLowerCase();
      return this.getMessageFromErrorString(errorString);
    }

    // Extract error code and status from various possible properties
    const errObj = error as Record<string, unknown>;
    const code = errObj['code'] || errObj['errorCode'];
    const status = errObj['status'] || errObj['httpStatusCode'];
    const message = ((errObj['message'] || errObj['msg'] || '') as string).toLowerCase();

    // ==================== Network Errors ====================
    const networkCodes = ['ERR_NETWORK', 'ECONNREFUSED', 'ENOTFOUND', 'ENETUNREACH'];
    if (typeof code === 'string' && networkCodes.includes(code.toUpperCase())) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }

    // ==================== Timeout Errors ====================
    const timeoutCodes = ['ETIMEDOUT', 'ECONNRESET', 'TIMEOUT'];
    if (typeof code === 'string' && timeoutCodes.includes(code.toUpperCase())) {
      return 'The request took too long. Please try again.';
    }
    if (
      message.includes('timeout') ||
      message.includes('etimedout') ||
      message.includes('timed out')
    ) {
      return 'The request took too long. Please try again.';
    }

    // ==================== Authentication Errors ====================
    const authCodes = ['AUTH_ERR', 'UNAUTHORIZED'];
    if (typeof code === 'string' && authCodes.includes(code.toUpperCase())) {
      return 'Authentication failed. Please log in again.';
    }
    if (code === 401 || status === 401) {
      return 'Authentication failed. Please log in again.';
    }
    if (
      message.includes('authentication') ||
      message.includes('unauthorized') ||
      message.includes('auth') ||
      message.includes('login')
    ) {
      return 'Authentication failed. Please log in again.';
    }

    // ==================== Permission Errors ====================
    const permissionCodes = ['FORBIDDEN', 'PERMISSION_DENIED'];
    if (typeof code === 'string' && permissionCodes.includes(code.toUpperCase())) {
      return "You don't have permission to perform this action.";
    }
    if (code === 403 || status === 403) {
      return "You don't have permission to perform this action.";
    }
    if (
      message.includes('forbidden') ||
      message.includes('permission') ||
      message.includes('access denied')
    ) {
      return "You don't have permission to perform this action.";
    }

    // ==================== Not Found Errors ====================
    const notFoundCodes = ['NOT_FOUND', 'ERR_UID_NOT_FOUND', 'ERR_GUID_NOT_FOUND'];
    if (typeof code === 'string' && notFoundCodes.includes(code.toUpperCase())) {
      return 'The requested resource was not found.';
    }
    if (code === 404 || status === 404) {
      return 'The requested resource was not found.';
    }
    if (message.includes('not found') || message.includes('does not exist')) {
      return 'The requested resource was not found.';
    }

    // ==================== Server Errors ====================
    const serverCodes = ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT'];
    if (typeof code === 'string' && serverCodes.includes(code.toUpperCase())) {
      return 'Server error. Please try again later.';
    }
    if (
      code === 500 ||
      code === 503 ||
      code === 504 ||
      status === 500 ||
      status === 503 ||
      status === 504
    ) {
      return 'Server error. Please try again later.';
    }
    if (
      message.includes('server error') ||
      message.includes('internal error') ||
      message.includes('service unavailable')
    ) {
      return 'Server error. Please try again later.';
    }

    // ==================== Rate Limiting Errors ====================
    const rateLimitCodes = ['RATE_LIMIT_EXCEEDED', 'TOO_MANY_REQUESTS'];
    if (typeof code === 'string' && rateLimitCodes.includes(code.toUpperCase())) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (code === 429 || status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // ==================== Default Message ====================
    return 'Failed to load messages. Please try again.';
  }

  /**
   * Get a user-friendly message from an error string.
   *
   * This helper method analyzes error message text for keywords that indicate
   * specific error types and returns an appropriate user-friendly message.
   * It's used as a fallback when the error is a string rather than an object.
   *
   * @param errorString - The error string to analyze (should be lowercase)
   * @returns A user-friendly error message string
   *
   * @private
   */
  private getMessageFromErrorString(errorString: string): string {
    // Network errors
    if (
      errorString.includes('network') ||
      errorString.includes('connection') ||
      errorString.includes('econnrefused') ||
      errorString.includes('enotfound')
    ) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }

    // Timeout errors
    if (
      errorString.includes('timeout') ||
      errorString.includes('etimedout') ||
      errorString.includes('timed out')
    ) {
      return 'The request took too long. Please try again.';
    }

    // Authentication errors
    if (
      errorString.includes('authentication') ||
      errorString.includes('unauthorized') ||
      errorString.includes('auth') ||
      errorString.includes('login')
    ) {
      return 'Authentication failed. Please log in again.';
    }

    // Permission errors
    if (
      errorString.includes('forbidden') ||
      errorString.includes('permission') ||
      errorString.includes('access denied')
    ) {
      return "You don't have permission to perform this action.";
    }

    // Not found errors
    if (errorString.includes('not found') || errorString.includes('does not exist')) {
      return 'The requested resource was not found.';
    }

    // Server errors
    if (
      errorString.includes('server error') ||
      errorString.includes('internal error') ||
      errorString.includes('service unavailable')
    ) {
      return 'Server error. Please try again later.';
    }

    // Rate limiting errors
    if (errorString.includes('rate limit') || errorString.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Default message
    return 'Failed to load messages. Please try again.';
  }

  // ==================== Error Handling with Retry ====================

  /**
   * Helper method to create a delay using Promise.
   *
   * This method is used by `handleErrorWithRetry()` to implement exponential
   * backoff delays between retry attempts.
   *
   * @param ms - The number of milliseconds to delay
   * @returns A Promise that resolves after the specified delay
   *
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle error with retry logic for recoverable errors.
   *
   * This method implements comprehensive error handling with exponential backoff
   * retry logic for recoverable errors. It is the central error handling mechanism
   * for all service operations.
   *
   * ## Behavior
   *
   * 1. **Logging**: Logs the error with `[MessageListService]` prefix for debugging
   *
   * 2. **Recoverable Error Check**: Uses `isRecoverableError()` to determine if
   *    the error is temporary and can be retried (e.g., network issues, timeouts)
   *
   * 3. **Retry Logic**: If the error is recoverable and a retry function is provided:
   *    - Implements exponential backoff with delays: 1000ms, 2000ms, 4000ms
   *    - Tracks retry attempts per operation context
   *    - Calls the retry function after each delay
   *    - Recursively handles errors from retry attempts
   *    - Resets retry count on success
   *
   * 4. **Final Failure Handling**: When all retries are exhausted or error is non-recoverable:
   *    - Gets a user-friendly error message via `getUserFriendlyErrorMessage()`
   *    - Creates an enhanced error object with the user-friendly message
   *    - Attaches the original error and context to the enhanced error
   *    - Sets `errorStateSignal` with the enhanced error
   *    - Calls `errorCallback` if set with the original error
   *
   * ## Exponential Backoff
   *
   * The retry delays follow an exponential pattern to give the system time to recover:
   * - 1st retry: 1 second delay
   * - 2nd retry: 2 seconds delay
   * - 3rd retry: 4 seconds delay
   *
   * After 3 failed attempts, the error is propagated to the component.
   *
   * ## Error Types
   *
   * **Recoverable Errors** (will retry):
   * - Network errors (connection lost, DNS failure)
   * - Timeout errors
   * - Rate limiting (429)
   * - Temporary server errors (503, 504)
   *
   * **Non-Recoverable Errors** (immediate failure):
   * - Authentication errors (401)
   * - Permission errors (403)
   * - Not found errors (404)
   * - Validation errors (400)
   * - Server errors (500)
   *
   * @param error - The error that occurred. Can be any type (CometChat.CometChatException,
   *                Error, or unknown error object)
   * @param context - A string describing where the error occurred (e.g., "fetchPreviousMessages").
   *                  Used for logging and tracking retry attempts.
   * @param retryFn - Optional function to retry the operation. If not provided, the error
   *                  is immediately propagated without retry attempts.
   * @returns Promise that resolves when retry succeeds or when error handling is complete
   *
   * @example
   * ```typescript
   * // Usage in fetchPreviousMessages
   * async fetchPreviousMessages(): Promise<boolean> {
   *   try {
   *     const messages = await this.messagesRequest.fetchPrevious();
   *     // ... process messages
   *   } catch (error) {
   *     await this.handleErrorWithRetry(error, 'fetchPreviousMessages', async () => {
   *       // Retry the operation
   *       await this.fetchPreviousMessages();
   *     });
   *     return false;
   *   }
   * }
   *
   * // Usage without retry function (immediate error handling)
   * try {
   *   await someOperation();
   * } catch (error) {
   *   await this.handleErrorWithRetry(error, 'someOperation');
   * }
   * ```
   *
   * @private
   * @see Requirement 15.1 - Wrap SDK calls in try-catch blocks
   * @see Requirement 15.2 - Log errors with [MessageListService] prefix
   * @see Requirement 15.3 - Error callback mechanism for propagating errors
   * @see Requirement 15.4 - Identify recoverable errors and implement retry logic
   * @see Requirement 15.5 - Retry with exponential backoff
   * @see Requirement 15.6 - Provide user-friendly error messages
   */
  private async handleErrorWithRetry(
    error: unknown,
    context: string,
    retryFn?: () => Promise<void>
  ): Promise<void> {
    // 1. Log error for debugging (Requirement 15.2)
    CometChatLogger.error('MessageListService', `Error in ${context}:`, error);

    // 2. Get current retry attempt count for this operation
    const currentAttempt = this.retryAttempts.get(context) || 0;

    // 3. Check if error is recoverable and we haven't exceeded max retries
    if (this.isRecoverableError(error) && currentAttempt < this.MAX_RETRY_ATTEMPTS && retryFn) {
      // Increment retry attempt
      this.retryAttempts.set(context, currentAttempt + 1);

      // Get delay for this retry attempt (exponential backoff: 1s, 2s, 4s)
      const retryDelay =
        this.RETRY_DELAYS[currentAttempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];

      // Wait for the delay
      await this.delay(retryDelay);

      // Retry the operation
      try {
        await retryFn();
        // Success - reset retry count
        this.retryAttempts.delete(context);
        return;
      } catch (retryError) {
        // Retry failed - handle recursively
        return this.handleErrorWithRetry(retryError, context, retryFn);
      }
    }

    // 4. Max retries reached or error is not recoverable
    // Reset retry count
    this.retryAttempts.delete(context);

    // 5. Get user-friendly error message (Requirement 15.6)
    const userFriendlyMessage = this.getUserFriendlyErrorMessage(error, context);

    // 6. Create enhanced error object with user-friendly message
    const enhancedError = new Error(userFriendlyMessage);
    (enhancedError as Error & { originalError: unknown }).originalError = error;
    (enhancedError as Error & { context: string }).context = context;

    // 7. Call errorCallback if set (Requirement 15.3)
    // Note: Non-fetch errors should NOT set errorStateSignal to avoid replacing
    // the message list with the full error state UI.
    if (this.errorCallback) {
      this.errorCallback(error as CometChat.CometChatException);
    }
  }

  // ==================== Error Management ====================

  /**
   * Clear the current error state.
   *
   * This method resets the `errorStateSignal` to null, clearing any error
   * that was previously set. Use this method to dismiss error states in the UI
   * and prepare for retry operations.
   *
   * ## When to Use
   *
   * - **After displaying an error message to the user**: Once the user has acknowledged
   *   the error (e.g., dismissed a toast or error dialog), clear the error state.
   *
   * - **Before retrying a failed operation**: Clear the previous error before attempting
   *   the operation again to ensure a clean state.
   *
   * - **When the user dismisses an error notification**: If your UI has a dismissible
   *   error banner or notification, call this method when the user closes it.
   *
   * - **When switching conversations**: Clear any errors from the previous conversation
   *   before loading the new one (though `setUser()` and `setGroup()` handle this automatically).
   *
   * ## Behavior
   *
   * - Sets `errorStateSignal` to null
   * - Does NOT affect the `errorCallback` - it remains set for future error handling
   * - Does NOT affect retry attempt tracking - those are managed per-operation
   * - Does NOT affect loading state or other signals
   *
   * ## Relationship with Error Handling
   *
   * This method complements the error handling flow:
   * 1. An error occurs during an operation (e.g., `fetchPreviousMessages()`)
   * 2. `handleErrorWithRetry()` sets `errorStateSignal` with the error
   * 3. The UI displays the error to the user
   * 4. User acknowledges/dismisses the error
   * 5. Call `clearError()` to reset the error state
   * 6. Optionally retry the operation
   *
   * @example
   * ```typescript
   * // Clear error after user dismisses error message
   * onErrorDismissed(): void {
   *   this.messageListService.clearError();
   * }
   *
   * // Clear error before retrying a failed operation
   * async retryFetch(): Promise<void> {
   *   this.messageListService.clearError();
   *   await this.messageListService.fetchPreviousMessages();
   * }
   *
   * // Clear error when user clicks "Try Again" button
   * async onTryAgainClick(): Promise<void> {
   *   this.messageListService.clearError();
   *   const hasMore = await this.messageListService.fetchPreviousMessages();
   *   if (hasMore) {
   *     console.log('More messages available');
   *   }
   * }
   *
   * // Use in template with error state signal
   * // @if (messageListService.errorState(); as error) {
   * //   <error-banner
   * //     [message]="error.message"
   * //     (dismiss)="onErrorDismissed()"
   * //     (retry)="retryFetch()"
   * //   />
   * // }
   * ```
   *
   * @returns void
   *
   * @see Requirement 15.3 - Error callback mechanism for propagating errors to components
   * @see errorState - Read-only signal to access the current error state
   * @see errorState$ - Observable stream for the error state (RxJS compatibility)
   * @see handleErrorWithRetry - Private method that sets the error state
   */
  clearError(): void {
    this.errorStateSignal.set(null);
  }

  // ==================== Message Operations ====================

  /**
   * Add a new message to the message list.
   *
   * This method appends a message to the end of the message arrays and updates
   * the lookup maps for O(1) access. It is typically called when:
   * - A new message is received via real-time listener
   * - A message is sent and needs to be added to the list
   * - An optimistic message needs to be added before server confirmation
   *
   * ## Behavior
   *
   * 1. **Appends to message arrays**: The message is added to the end of both
   *    `allMessagesSignal` and `messagesSignal` arrays, maintaining chronological order.
   *
   * 2. **Updates lookup maps**: The message is added to `messageIdMap` using its
   *    server-assigned ID, and to `messageMuidMap` using its MUID (if available).
   *    This enables O(1) lookup for subsequent operations like updates or deletions.
   *
   * 3. **Updates pagination tracking**: If the new message's ID is greater than
   *    the current `nextMessageIdSignal`, it is updated to reflect the newest message.
   *    This ensures forward pagination works correctly.
   *
   * ## When to Use
   *
   * - **Real-time message reception**: When a new message is received via the
   *   message listener (onTextMessageReceived, onMediaMessageReceived, etc.)
   *
   * - **After sending a message**: When a message is successfully sent and needs
   *   to be displayed in the list
   *
   * - **Optimistic updates**: When adding a message to the UI before server
   *   confirmation (the message will have a MUID but may not have a server ID yet)
   *
   * ## Important Notes
   *
   * - This method does NOT check for duplicates. Ensure the message is not already
   *   in the list before calling this method.
   *
   * - This method does NOT validate if the message belongs to the current conversation.
   *   Use `isMessageForCurrentConversation()` before calling this method if needed.
   *
   * - For updating existing messages, use `updateMessageById()` or `updateMessageByMuid()`
   *   instead.
   *
   * @param message - The message to add to the list. Can be any type that extends
   *                  CometChat.BaseMessage (TextMessage, MediaMessage, CustomMessage, etc.)
   *
   * @example
   * ```typescript
   * // Add a received message from real-time listener
   * onTextMessageReceived(message: CometChat.TextMessage): void {
   *   if (this.isMessageForCurrentConversation(message)) {
   *     this.messageListService.addMessage(message);
   *   }
   * }
   *
   * // Add a sent message after successful send
   * async sendMessage(text: string): Promise<void> {
   *   const message = await CometChat.sendMessage(textMessage);
   *   this.messageListService.addMessage(message);
   * }
   *
   * // Add an optimistic message before server confirmation
   * sendMessageOptimistically(textMessage: CometChat.TextMessage): void {
   *   // Add immediately for instant UI feedback
   *   this.messageListService.addMessage(textMessage);
   *
   *   // Send to server and update with response
   *   CometChat.sendMessage(textMessage).then(sentMessage => {
   *     this.messageListService.updateMessageByMuid(
   *       textMessage.getMuid(),
   *       sentMessage
   *     );
   *   });
   * }
   * ```
   *
   * @returns void
   *
   * @see Requirement 12.1 - Provide addMessage method to add a new message to the list
   * @see Requirement 12.2 - Add message to the end of allMessagesSignal array
   * @see updateMessageById - Update a message by its server-assigned ID
   * @see updateMessageByMuid - Update a message by its client-assigned MUID
   * @see removeMessage - Remove a message from the list
   */
  addMessage(message: CometChat.BaseMessage): void {
    // Append to message arrays
    this.allMessagesSignal.update(current => [...current, message]);
    this.messagesSignal.update(current => [...current, message]);

    // Add to lookup maps for O(1) access
    const messageId = this.normalizeMessageId(message.getId());
    this.messageIdMap.set(messageId, message);

    // Add to MUID map if the message has a MUID
    // MUID is used for optimistic updates before server confirmation
    const muid = message.getMuid?.();
    if (muid) {
      this.messageMuidMap.set(muid, message);
    }

    // Update nextMessageIdSignal if this message has a higher ID
    // This ensures forward pagination tracking stays accurate
    if (messageId > this.nextMessageIdSignal()) {
      this.nextMessageIdSignal.set(messageId);
    }
  }

  /**
   * Update a message by its server-assigned ID.
   *
   * This method finds a message in the list by its ID and replaces it with
   * the updated message. It is typically called when:
   * - A message is edited
   * - A message's delivery/read status changes
   * - A message's reactions are updated
   *
   * ## How It Works
   *
   * 1. **Finds the message**: Searches `allMessagesSignal` for a message with
   *    the matching ID. If not found, logs a warning and returns false.
   *
   * 2. **Updates message arrays**: Replaces the old message with the new one
   *    in both `allMessagesSignal` and `messagesSignal`. The arrays are updated
   *    immutably to trigger signal change detection.
   *
   * 3. **Updates lookup maps**: Updates `messageIdMap` with the new message
   *    reference. If the message has a MUID, also updates `messageMuidMap`.
   *
   * ## When to Use
   *
   * - **Message edited**: When a message is edited by the sender or received
   *   via the `onMessageEdited` listener
   *
   * - **Receipt updates**: When delivery or read receipts are received and
   *   the message status needs to be updated
   *
   * - **Reaction updates**: When reactions are added or removed from a message
   *
   * - **Server confirmation**: When an optimistically added message receives
   *   its server response (though `updateMessageByMuid` is preferred for this)
   *
   * ## Important Notes
   *
   * - This method does NOT add the message if it doesn't exist. Use `addMessage()`
   *   for adding new messages.
   *
   * - The message ID must match exactly. If you need to update by MUID (for
   *   optimistic updates), use `updateMessageByMuid()` instead.
   *
   * - The method returns a boolean indicating success, allowing callers to
   *   handle the case where the message was not found.
   *
   * @param messageId - The server-assigned ID of the message to update
   * @param message - The updated message object that will replace the existing one
   * @returns `true` if the message was found and updated, `false` otherwise
   *
   * @example
   * ```typescript
   * // Update an edited message
   * onMessageEdited(editedMessage: CometChat.BaseMessage): void {
   *   const updated = this.messageListService.updateMessageById(
   *     editedMessage.getId(),
   *     editedMessage
   *   );
   *   if (!updated) {
   *     console.log('Message not in current list, ignoring edit');
   *   }
   * }
   *
   * // Update message with new delivery status
   * onMessagesDelivered(receipt: CometChat.MessageReceipt): void {
   *   const message = this.messageListService.getMessageById(receipt.getMessageId());
   *   if (message) {
   *     // Create updated message with new delivery status
   *     const updatedMessage = this.updateMessageDeliveryStatus(message, receipt);
   *     this.messageListService.updateMessageById(message.getId(), updatedMessage);
   *   }
   * }
   *
   * // Update message reactions
   * onMessageReactionAdded(reactionEvent: CometChat.ReactionEvent): void {
   *   const message = this.messageListService.getMessageById(reactionEvent.getMessageId());
   *   if (message) {
   *     // Create updated message with new reactions
   *     const updatedMessage = this.updateMessageReactions(message, reactionEvent);
   *     this.messageListService.updateMessageById(message.getId(), updatedMessage);
   *   }
   * }
   * ```
   *
   * @see Requirement 12.3 - Provide updateMessageById method to update a message by its ID
   * @see addMessage - Add a new message to the list
   * @see updateMessageByMuid - Update a message by its client-assigned MUID
   * @see getMessageById - Retrieve a message by its ID
   */
  updateMessageById(messageId: number, message: CometChat.BaseMessage): boolean {
    // Normalize messageId to ensure consistent comparison
    const normalizedId = this.normalizeMessageId(messageId);

    // Find the index of the message in allMessagesSignal
    const currentMessages = this.allMessagesSignal();
    const index = currentMessages.findIndex(
      m => this.normalizeMessageId(m.getId()) === normalizedId
    );

    if (index === -1) {
      CometChatLogger.warn('MessageListService', `Message with ID ${messageId} not found for update`);
      return false;
    }

    // Update allMessagesSignal
    this.allMessagesSignal.update(current => {
      const updated = [...current];
      updated[index] = message;
      return updated;
    });

    // Update messagesSignal (find index separately as arrays may differ)
    const messagesIndex = this.messagesSignal().findIndex(
      m => this.normalizeMessageId(m.getId()) === normalizedId
    );
    if (messagesIndex !== -1) {
      this.messagesSignal.update(current => {
        const updated = [...current];
        updated[messagesIndex] = message;
        return updated;
      });
    }

    // Update messageIdMap
    this.messageIdMap.set(normalizedId, message);

    // Update messageMuidMap if the message has a MUID
    const muid = message.getMuid?.();
    if (muid) {
      this.messageMuidMap.set(muid, message);
    }

    return true;
  }

  /**
   * Update a message in the list by its MUID (Message Unique Identifier).
   *
   * This method finds a message by its client-assigned MUID and replaces it
   * with the provided updated message. It updates both the `allMessagesSignal`
   * and `messagesSignal` arrays, as well as the lookup maps.
   *
   * ## Primary Use Case: Optimistic Updates
   *
   * This method is primarily used for optimistic updates - when a message is
   * added to the UI before server confirmation (using MUID), and then needs
   * to be updated with the server response (which includes the server-assigned ID).
   *
   * **Optimistic Update Flow:**
   * 1. User sends a message
   * 2. Message is immediately added to UI with a client-generated MUID
   * 3. Message is sent to server
   * 4. Server responds with the message including server-assigned ID
   * 5. `updateMessageByMuid()` is called to replace the optimistic message
   *    with the server-confirmed message
   *
   * ## Map Updates
   *
   * This method handles the following map updates:
   * - **messageMuidMap**: Updated with the new message (using the new message's MUID)
   * - **messageIdMap**: Updated with the new message (using the new message's ID)
   * - **Old MUID cleanup**: If the new message has a different MUID than the
   *   original, the old MUID entry is removed from messageMuidMap
   *
   * ## Important Notes
   *
   * - This method does NOT add the message if it doesn't exist. Use `addMessage()`
   *   for adding new messages.
   *
   * - If you have the server-assigned message ID, prefer using `updateMessageById()`
   *   as it's more reliable (IDs are guaranteed unique, MUIDs are client-generated).
   *
   * - The method returns a boolean indicating success, allowing callers to
   *   handle the case where the message was not found.
   *
   * @param muid - The client-assigned MUID of the message to update
   * @param message - The updated message object that will replace the existing one
   * @returns `true` if the message was found and updated, `false` otherwise
   *
   * @example
   * ```typescript
   * // Optimistic update flow - update message after server confirmation
   * async sendMessage(text: string): Promise<void> {
   *   // Create message with client-generated MUID
   *   const muid = this.generateMuid();
   *   const optimisticMessage = this.createOptimisticMessage(text, muid);
   *
   *   // Add to UI immediately (optimistic)
   *   this.messageListService.addMessage(optimisticMessage);
   *
   *   try {
   *     // Send to server
   *     const serverMessage = await CometChat.sendMessage(optimisticMessage);
   *
   *     // Update with server response (includes server-assigned ID)
   *     this.messageListService.updateMessageByMuid(muid, serverMessage);
   *   } catch (error) {
   *     // Handle send failure - maybe mark message as failed
   *     const failedMessage = this.markMessageAsFailed(optimisticMessage);
   *     this.messageListService.updateMessageByMuid(muid, failedMessage);
   *   }
   * }
   *
   * // Handle message send confirmation from real-time listener
   * onMessageSent(message: CometChat.BaseMessage): void {
   *   const muid = message.getMuid();
   *   if (muid) {
   *     // Update the optimistically added message with server response
   *     const updated = this.messageListService.updateMessageByMuid(muid, message);
   *     if (!updated) {
   *       // Message wasn't in list (maybe sent from another device)
   *       this.messageListService.addMessage(message);
   *     }
   *   }
   * }
   * ```
   *
   * @see Requirement 12.4 - Provide updateMessageByMuid method to update a message by its MUID
   * @see addMessage - Add a new message to the list
   * @see updateMessageById - Update a message by its server-assigned ID
   * @see getMessageById - Retrieve a message by its ID
   */
  updateMessageByMuid(muid: string, message: CometChat.BaseMessage): boolean {
    // Find the message in messageMuidMap for O(1) lookup
    const existingMessage = this.messageMuidMap.get(muid);

    if (!existingMessage) {
      CometChatLogger.warn('MessageListService', `Message with MUID ${muid} not found for update`);
      return false;
    }

    // Find the index of the message in allMessagesSignal
    const currentMessages = this.allMessagesSignal();
    const index = currentMessages.findIndex(m => m.getMuid?.() === muid);

    if (index === -1) {
      // This shouldn't happen if messageMuidMap is in sync, but handle it gracefully
      CometChatLogger.warn('MessageListService', `Message with MUID ${muid} found in map but not in array`);
      // Clean up the stale map entry
      this.messageMuidMap.delete(muid);
      return false;
    }

    // Get the old message's ID for cleanup
    const oldMessageId = existingMessage.getId();

    // Update allMessagesSignal
    this.allMessagesSignal.update(current => {
      const updated = [...current];
      updated[index] = message;
      return updated;
    });

    // Update messagesSignal (find index separately as arrays may differ)
    const messagesIndex = this.messagesSignal().findIndex(m => m.getMuid?.() === muid);
    if (messagesIndex !== -1) {
      this.messagesSignal.update(current => {
        const updated = [...current];
        updated[messagesIndex] = message;
        return updated;
      });
    }

    // Update messageIdMap with the new message's ID
    const newMessageId = message.getId();
    if (newMessageId) {
      const normalizedNewId = this.normalizeMessageId(newMessageId);
      this.messageIdMap.set(normalizedNewId, message);
    }

    // Remove old message ID from map if it's different from the new one
    if (oldMessageId && oldMessageId !== newMessageId) {
      const normalizedOldId = this.normalizeMessageId(oldMessageId);
      this.messageIdMap.delete(normalizedOldId);
    }

    // Update messageMuidMap with the new message
    const newMuid = message.getMuid?.();
    if (newMuid) {
      this.messageMuidMap.set(newMuid, message);
    }

    // Remove old MUID entry if the new message has a different MUID
    if (newMuid !== muid) {
      this.messageMuidMap.delete(muid);
    }

    return true;
  }

  // ==================== Message Deletion Operations ====================

  /**
   * Mark a message as deleted without removing it from the list.
   *
   * This method finds a message by its ID and marks it as deleted by setting
   * the `deletedAt` timestamp. The message remains in the list but should be
   * displayed differently in the UI (e.g., "This message was deleted").
   *
   * ## Behavior
   *
   * - Finds the message in the message list by its server-assigned ID
   * - Sets the `deletedAt` property to the current timestamp (in seconds)
   * - Updates the message in both `allMessagesSignal` and `messagesSignal`
   * - Updates the message in `messageIdMap` and `messageMuidMap`
   * - Returns `true` if the message was found and marked as deleted
   * - Returns `false` if the message was not found
   *
   * ## Soft Delete vs Hard Delete
   *
   * This method performs a **soft delete** - the message stays in the list
   * but is marked as deleted. This is the standard behavior for chat applications
   * where deleted messages are shown as "This message was deleted" rather than
   * completely disappearing.
   *
   * For **hard delete** (completely removing a message from the list), use
   * the `removeMessage()` method instead.
   *
   * ## Use Cases
   *
   * - **User deletes their own message**: Mark the message as deleted so other
   *   users see "This message was deleted"
   * - **Real-time deletion event**: When receiving a message deleted event from
   *   the SDK, mark the local message as deleted
   * - **Moderation**: When a moderator deletes a message, mark it as deleted
   *
   * ## Example Usage
   *
   * ```typescript
   * // Delete a message by ID
   * const messageId = 12345;
   * const wasDeleted = this.messageListService.deleteMessage(messageId);
   *
   * if (wasDeleted) {
   *   console.log('Message marked as deleted');
   * } else {
   *   console.log('Message not found');
   * }
   *
   * // In a real-time listener for message deletion
   * onMessageDeleted(message: CometChat.BaseMessage) {
   *   this.messageListService.deleteMessage(message.getId());
   * }
   *
   * // In a component handling user delete action
   * async onDeleteMessage(message: CometChat.BaseMessage) {
   *   try {
   *     // Delete on server first
   *     await CometChat.deleteMessage(message.getId());
   *     // Then mark as deleted locally
   *     this.messageListService.deleteMessage(message.getId());
   *   } catch (error) {
   *     console.error('Failed to delete message:', error);
   *   }
   * }
   * ```
   *
   * @param messageId - The server-assigned ID of the message to mark as deleted
   * @returns `true` if the message was found and marked as deleted, `false` otherwise
   *
   * @see Requirement 12.5 - Provide deleteMessage method to mark a message as deleted
   * @see removeMessage - Completely remove a message from the list (hard delete)
   * @see updateMessageById - Update a message by its ID
   * @see getMessageById - Retrieve a message by its ID
   */
  deleteMessage(messageId: number): boolean {
    // Find the message in messageIdMap for O(1) lookup
    const existingMessage = this.messageIdMap.get(this.normalizeMessageId(messageId));

    if (!existingMessage) {
      CometChatLogger.warn('MessageListService', `Message with ID ${messageId} not found for deletion`);
      return false;
    }

    // Mark the message as deleted by setting deletedAt timestamp
    // The timestamp is in seconds (Unix timestamp format used by CometChat SDK)
    const deletedAtTimestamp = Math.floor(Date.now() / 1000);

    // Clone the message to create a new object reference so Angular change detection
    // picks up the update in components that compare input references
    const clonedMessage = Object.create(
      Object.getPrototypeOf(existingMessage),
      Object.getOwnPropertyDescriptors(existingMessage)
    ) as CometChat.BaseMessage;
    clonedMessage.setDeletedAt(deletedAtTimestamp);

    // Update the message in the arrays using updateMessageById
    // This ensures both arrays and maps are updated consistently
    return this.updateMessageById(messageId, clonedMessage);
  }

  /**
   * Edit a text message.
   *
   * This method edits a text message by calling the CometChat SDK's
   * `editMessage` API. It performs an optimistic update to immediately reflect the
   * change in the UI, then syncs with the server.
   *
   * ## How It Works
   *
   * 1. **Validation**: Ensures the message is a text message that can be edited
   * 2. **Optimistic Update**: Immediately updates the local message state with the new text
   * 3. **Server Call**: Calls `CometChat.editMessage(message)` to persist the edit
   * 4. **Error Rollback**: If the server call fails, the optimistic update is rolled back
   *
   * ## Validation Rules
   *
   * - Only text messages can be edited
   * - The message must exist in the current message list
   * - The new text must be provided
   *
   * ## Error Handling
   *
   * - Errors are logged to the console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The optimistic update is rolled back on error to maintain consistency
   * - The error is re-thrown for the caller to handle if needed
   *
   * ## Example Usage
   *
   * ```typescript
   * // Edit a message
   * try {
   *   const editedMessage = await this.messageListService.editMessage(message, 'Updated text');
   *   console.log('Message edited successfully');
   * } catch (error) {
   *   console.error('Failed to edit message:', error);
   * }
   * ```
   *
   * @param message - The message to edit (must be a text message)
   * @param newText - The new text content for the message
   * @returns A Promise that resolves with the edited message from the server
   * @throws Error if the message is not found, not a text message, or if the SDK call fails
   *
   * @see Requirement 11.5 - THE Message_List_Service SHALL provide an `editMessage()` method
   * @see updateMessageById - Update a message by its ID
   */
  async editMessage(
    message: CometChat.BaseMessage,
    newText: string
  ): Promise<CometChat.BaseMessage> {
    // Validate message exists in the list
    const existingMessage = this.messageIdMap.get(message.getId());

    if (!existingMessage) {
      const error = new Error(
        `[MessageListService] editMessage: Message with ID ${message.getId()} not found`
      );
      CometChatLogger.error('MessageListService', error.message);
      throw error;
    }

    // Validate message is a text message
    if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) {
      const error = new Error(`[MessageListService] editMessage: Only text messages can be edited`);
      CometChatLogger.error('MessageListService', error.message);
      throw error;
    }

    // Cast to TextMessage for setText method
    const textMessage = message as CometChat.TextMessage;

    // Store original text for potential rollback
    const originalText = textMessage.getText();

    // Perform optimistic update
    textMessage.setText(newText);
    this.updateMessageById(message.getId(), textMessage);

    try {
      // Call SDK to persist the edit
      const editedMessage = await CometChat.editMessage(textMessage);

      // Update with server response (includes editedAt timestamp)
      this.updateMessageById(editedMessage.getId(), editedMessage);

      return editedMessage;
    } catch (error) {
      // Rollback optimistic update on error
      CometChatLogger.error('MessageListService', 'editMessage: Failed to edit message', error);
      textMessage.setText(originalText);
      this.updateMessageById(message.getId(), textMessage);

      // Note: Edit errors should NOT set errorStateSignal to avoid replacing
      // the message list with the full error state UI.

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }

      return message;
    }
  }

  /**
   * Completely remove a message from the message list (hard delete).
   *
   * This method removes a message entirely from the message list, including:
   * - Removing from `allMessagesSignal` array
   * - Removing from `messagesSignal` array
   * - Removing from `messageIdMap` for ID-based lookup
   * - Removing from `messageMuidMap` for MUID-based lookup (if the message has a MUID)
   *
   * ## Return Value
   *
   * - Returns `true` if the message was found and removed
   * - Returns `false` if the message was not found
   *
   * ## Hard Delete vs Soft Delete
   *
   * This method performs a **hard delete** - the message is completely removed
   * from the list and will no longer appear in the UI. This is different from
   * `deleteMessage()` which performs a soft delete (marks the message as deleted
   * but keeps it in the list).
   *
   * Use this method when you want to completely remove a message from view,
   * such as:
   * - Removing temporary/optimistic messages that failed to send
   * - Removing messages that should not be visible to the current user
   * - Cleaning up messages during conversation reset
   *
   * For standard message deletion (showing "This message was deleted"), use
   * `deleteMessage()` instead.
   *
   * ## Use Cases
   *
   * - **Failed message send**: Remove an optimistically added message that
   *   failed to send to the server
   * - **Message moderation**: Completely remove inappropriate content
   * - **Conversation cleanup**: Remove specific messages during state reset
   * - **Temporary messages**: Remove temporary UI messages (e.g., typing indicators)
   *
   * ## Example Usage
   *
   * ```typescript
   * // Remove a message by ID
   * const messageId = 12345;
   * const wasRemoved = this.messageListService.removeMessage(messageId);
   *
   * if (wasRemoved) {
   *   console.log('Message completely removed from list');
   * } else {
   *   console.log('Message not found');
   * }
   *
   * // Remove a failed optimistic message
   * async sendMessage(text: string) {
   *   // Create optimistic message with temporary ID
   *   const tempMessage = createOptimisticMessage(text);
   *   this.messageListService.addMessage(tempMessage);
   *
   *   try {
   *     // Send to server
   *     const sentMessage = await CometChat.sendMessage(tempMessage);
   *     // Update with server response
   *     this.messageListService.updateMessageByMuid(tempMessage.getMuid(), sentMessage);
   *   } catch (error) {
   *     // Remove the failed optimistic message
   *     this.messageListService.removeMessage(tempMessage.getId());
   *     console.error('Failed to send message:', error);
   *   }
   * }
   *
   * // Remove messages during cleanup
   * cleanupTemporaryMessages(messageIds: number[]) {
   *   messageIds.forEach(id => this.messageListService.removeMessage(id));
   * }
   * ```
   *
   * @param messageId - The server-assigned ID of the message to remove
   * @returns `true` if the message was found and removed, `false` otherwise
   *
   * @see Requirement 12.6 - Provide removeMessage method to completely remove a message from the list
   * @see deleteMessage - Mark a message as deleted while keeping it in the list (soft delete)
   * @see addMessage - Add a new message to the list
   * @see getMessageById - Retrieve a message by its ID
   */
  removeMessage(messageId: number): boolean {
    // Find the message in messageIdMap for O(1) lookup
    const existingMessage = this.messageIdMap.get(messageId);

    if (!existingMessage) {
      CometChatLogger.warn('MessageListService', `Message with ID ${messageId} not found for removal`);
      return false;
    }

    // Get the MUID if it exists (for removing from messageMuidMap)
    const muid = existingMessage.getMuid();

    // Remove from allMessagesSignal array
    const currentAllMessages = this.allMessagesSignal();
    const filteredAllMessages = currentAllMessages.filter(msg => msg.getId() !== messageId);
    this.allMessagesSignal.set(filteredAllMessages);

    // Remove from messagesSignal array
    const currentMessages = this.messagesSignal();
    const filteredMessages = currentMessages.filter(msg => msg.getId() !== messageId);
    this.messagesSignal.set(filteredMessages);

    // Remove from messageIdMap
    this.messageIdMap.delete(messageId);

    // Remove from messageMuidMap if the message has a MUID
    if (muid) {
      this.messageMuidMap.delete(muid);
    }

    return true;
  }

  // ==================== Message Retrieval Operations ====================

  /**
   * Retrieve a message by its server-assigned ID.
   *
   * This method provides O(1) lookup of messages using the `messageIdMap`.
   * It is useful when you need to access a specific message for operations
   * like updating, checking status, or displaying details.
   *
   * ## Performance
   *
   * This method uses a Map-based lookup which provides O(1) time complexity,
   * making it efficient even for large message lists. The `messageIdMap` is
   * automatically maintained when messages are added, updated, or removed.
   *
   * ## Return Value
   *
   * - Returns the `CometChat.BaseMessage` if found in the message list
   * - Returns `undefined` if no message with the given ID exists
   *
   * ## Use Cases
   *
   * - **Check message existence**: Verify if a message is in the current list
   * - **Get message details**: Access message properties for display or processing
   * - **Update operations**: Retrieve a message before updating it
   * - **Receipt handling**: Find a message to update its delivery/read status
   * - **Reaction handling**: Find a message to update its reactions
   * - **Thread operations**: Find a parent message to update reply count
   *
   * ## Example Usage
   *
   * ```typescript
   * // Basic retrieval
   * const message = this.messageListService.getMessageById(12345);
   * if (message) {
   *   console.log('Message text:', message.getText());
   *   console.log('Sender:', message.getSender().getName());
   * }
   *
   * // Check if message exists before updating
   * const messageId = 12345;
   * const existingMessage = this.messageListService.getMessageById(messageId);
   * if (existingMessage) {
   *   // Perform update operation
   *   this.messageListService.updateMessageById(messageId, updatedMessage);
   * } else {
   *   console.log('Message not found in current list');
   * }
   *
   * // Handle receipt update
   * onMessageDelivered(receipt: CometChat.MessageReceipt) {
   *   const message = this.messageListService.getMessageById(receipt.getMessageId());
   *   if (message) {
   *     // Update delivery status
   *     message.setDeliveredAt(receipt.getDeliveredAt());
   *     this.messageListService.updateMessageById(message.getId(), message);
   *   }
   * }
   *
   * // Display message details in a modal
   * showMessageDetails(messageId: number) {
   *   const message = this.messageListService.getMessageById(messageId);
   *   if (message) {
   *     this.openMessageDetailsModal(message);
   *   } else {
   *     this.showError('Message not found');
   *   }
   * }
   * ```
   *
   * @param messageId - The server-assigned ID of the message to retrieve
   * @returns The message if found, `undefined` otherwise
   *
   * @see Requirement 12.7 - Provide getMessageById method to retrieve a specific message
   * @see Requirement 16.3 - Use efficient data structures for message lookup by ID
   * @see updateMessageById - Update a message by its ID
   * @see deleteMessage - Mark a message as deleted by its ID
   * @see removeMessage - Completely remove a message by its ID
   */
  getMessageById(messageId: number): CometChat.BaseMessage | undefined {
    // Normalize to number in case SDK returns string
    const numericId = this.normalizeMessageId(messageId);
    return this.messageIdMap.get(numericId);
  }

  // ==================== Reply Count Operations ====================

  /**
   * Update the reply count for a parent message.
   *
   * This method finds a parent message by its ID and updates its reply count.
   * It is used to keep the parent message's reply count in sync when:
   * - A new reply is added to a thread
   * - A reply is deleted from a thread
   * - Thread information is refreshed from the server
   *
   * ## How It Works
   *
   * 1. Looks up the parent message in the `messageIdMap` using O(1) lookup
   * 2. If found, updates the message's reply count using `setReplyCount()`
   * 3. Updates the message in both arrays and maps via `updateMessageById()`
   * 4. Returns a boolean indicating success or failure
   *
   * ## Performance
   *
   * - **Time Complexity**: O(n) where n is the number of messages in the list
   *   (due to the `updateMessageById` call which iterates through the array)
   * - **Space Complexity**: O(1) - no additional memory allocation
   *
   * ## Thread Reply Count Behavior
   *
   * The reply count represents the total number of replies in a thread.
   * This count is displayed in the UI to indicate thread activity.
   *
   * **Important:** This method sets the absolute count, not a delta.
   * If you need to increment/decrement, first get the current count:
   *
   * ```typescript
   * const message = this.messageListService.getMessageById(parentId);
   * if (message) {
   *   const currentCount = message.getReplyCount() || 0;
   *   this.messageListService.updateReplyCount(parentId, currentCount + 1);
   * }
   * ```
   *
   * ## Example Usage
   *
   * ```typescript
   * // Update reply count when a new reply is received
   * onThreadReplyReceived(reply: CometChat.BaseMessage): void {
   *   const parentId = reply.getParentMessageId();
   *   const parentMessage = this.messageListService.getMessageById(parentId);
   *   if (parentMessage) {
   *     const newCount = (parentMessage.getReplyCount() || 0) + 1;
   *     this.messageListService.updateReplyCount(parentId, newCount);
   *   }
   * }
   *
   * // Update reply count when a reply is deleted
   * onThreadReplyDeleted(reply: CometChat.BaseMessage): void {
   *   const parentId = reply.getParentMessageId();
   *   const parentMessage = this.messageListService.getMessageById(parentId);
   *   if (parentMessage) {
   *     const newCount = Math.max(0, (parentMessage.getReplyCount() || 0) - 1);
   *     this.messageListService.updateReplyCount(parentId, newCount);
   *   }
   * }
   *
   * // Sync reply count from server response
   * onThreadInfoFetched(threadInfo: { parentId: number; replyCount: number }): void {
   *   this.messageListService.updateReplyCount(threadInfo.parentId, threadInfo.replyCount);
   * }
   *
   * // Check if update was successful
   * const updated = this.messageListService.updateReplyCount(parentId, 5);
   * if (!updated) {
   *   console.warn('Parent message not found in current list');
   * }
   * ```
   *
   * @param parentMessageId - The server-assigned ID of the parent message to update
   * @param count - The new reply count to set (must be a non-negative integer)
   * @returns `true` if the parent message was found and updated, `false` otherwise
   *
   * @see Requirement 12.8 - Provide updateReplyCount method to update thread reply counts
   * @see Requirement 14.4 - Track reply counts for parent messages
   * @see Requirement 14.5 - Increment parent message's reply count when new reply is added
   * @see getMessageById - Retrieve a message by its ID
   * @see updateMessageById - Update a message by its ID
   */
  updateReplyCount(parentMessageId: number, count: number): boolean {
    // Find the parent message using O(1) lookup
    const parentMessage = this.messageIdMap.get(parentMessageId);

    if (!parentMessage) {
      CometChatLogger.warn(
        'MessageListService',
        `updateReplyCount: Parent message with ID ${parentMessageId} not found`
      );
      return false;
    }

    // Clone the parent message to create a new object reference.
    // Critical for OnPush change detection — same pattern as updateSentMessageReplyCount.
    const clonedParent = CometChatUIKitUtility.clone(parentMessage);

    // Update the reply count on the cloned message
    clonedParent.setReplyCount(count);

    // Update the message in both arrays and maps
    // This ensures consistency across all data structures
    return this.updateMessageById(parentMessageId, clonedParent);
  }

  // ==================== Reaction Operations ====================

  /**
   * Update the reactions on a message.
   *
   * This method updates the reactions array on a specific message identified by its ID.
   * It is used to reflect reaction changes in the UI when:
   * - A reaction is added to a message
   * - A reaction is removed from a message
   * - Reaction information is refreshed from the server
   *
   * ## How It Works
   *
   * 1. Finds the message in the `messageIdMap` using O(1) lookup
   * 2. Updates the message's reactions using `message.setReactions(reactions)`
   * 3. Updates the message in both arrays and maps using `updateMessageById`
   * 4. Returns `true` if successful, `false` if the message was not found
   *
   * ## Performance
   *
   * - **Time Complexity**: O(n) where n is the number of messages in the list
   *   (due to the `updateMessageById` call which iterates through the array)
   * - **Space Complexity**: O(1) - no additional memory allocation
   *
   * ## Reaction Data Structure
   *
   * The `reactions` parameter is an array of `CometChat.ReactionCount` objects.
   * Each `ReactionCount` contains:
   * - `reaction`: The emoji/reaction string (e.g., "👍", "❤️", "😂")
   * - `count`: The number of times this reaction has been added
   * - `reactedByMe`: Whether the current user has added this reaction
   *
   * ## Example Usage
   *
   * ```typescript
   * // Update reactions when a reaction event is received
   * onReactionAdded(reactionEvent: CometChat.ReactionEvent): void {
   *   const messageId = reactionEvent.getReaction()?.getMessageId();
   *   const message = this.messageListService.getMessageById(messageId);
   *   if (message) {
   *     // Get updated reactions from the event or fetch from server
   *     const updatedReactions = reactionEvent.getReaction()?.getReactions() || [];
   *     this.messageListService.updateMessageReactions(messageId, updatedReactions);
   *   }
   * }
   *
   * // Update reactions when a reaction is removed
   * onReactionRemoved(reactionEvent: CometChat.ReactionEvent): void {
   *   const messageId = reactionEvent.getReaction()?.getMessageId();
   *   const message = this.messageListService.getMessageById(messageId);
   *   if (message) {
   *     const updatedReactions = reactionEvent.getReaction()?.getReactions() || [];
   *     this.messageListService.updateMessageReactions(messageId, updatedReactions);
   *   }
   * }
   *
   * // Refresh reactions from server
   * async refreshMessageReactions(messageId: number): Promise<void> {
   *   const reactions = await CometChat.getMessageReactions(messageId);
   *   this.messageListService.updateMessageReactions(messageId, reactions);
   * }
   *
   * // Check if update was successful
   * const updated = this.messageListService.updateMessageReactions(messageId, newReactions);
   * if (!updated) {
   *   console.warn('Message not found in current list');
   * }
   * ```
   *
   * @param messageId - The server-assigned ID of the message to update
   * @param reactions - The new reactions array to set on the message
   * @returns `true` if the message was found and updated, `false` otherwise
   *
   * @see Requirement 12.9 - Provide updateMessageReactions method to update message reactions
   * @see Requirement 8.3 - Update message's reaction data when reaction is added
   * @see Requirement 8.4 - Update message's reaction data when reaction is removed
   * @see getMessageById - Retrieve a message by its ID
   * @see updateMessageById - Update a message by its ID
   */
  updateMessageReactions(messageId: number, reactions: CometChat.ReactionCount[]): boolean {
    // Find the message using O(1) lookup
    const message = this.messageIdMap.get(this.normalizeMessageId(messageId));

    if (!message) {
      CometChatLogger.warn(
        'MessageListService',
        `updateMessageReactions: Message with ID ${messageId} not found`
      );
      return false;
    }

    // Update the reactions on the message
    message.setReactions(reactions);

    // Update the message in both arrays and maps
    // This ensures consistency across all data structures
    return this.updateMessageById(messageId, message);
  }

  /**
   * Add a reaction to a message.
   *
   * This method adds a reaction (emoji) to a message by calling the CometChat SDK's
   * `addReaction` API. It performs an optimistic update to immediately reflect the
   * change in the UI, then syncs with the server.
   *
   * ## How It Works
   *
   * 1. **Optimistic Update**: Immediately updates the local message state with the new reaction
   * 2. **Server Call**: Calls `CometChat.addReaction(messageId, emoji)` to persist the reaction
   * 3. **Error Rollback**: If the server call fails, the optimistic update is rolled back
   *
   * ## Optimistic Update Flow
   *
   * 1. Get the current message from the message list
   * 2. Clone the current reactions array
   * 3. Check if the emoji already exists in reactions:
   *    - If yes: Increment count and set `reactedByMe` to true
   *    - If no: Add a new ReactionCount with count=1 and reactedByMe=true
   * 4. Update the message with new reactions (optimistic)
   * 5. Call SDK to persist the reaction
   * 6. On error: Rollback to original reactions
   *
   * ## Error Handling
   *
   * - Errors are logged to the console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The optimistic update is rolled back on error to maintain consistency
   * - The error is re-thrown for the caller to handle if needed
   *
   * ## Example Usage
   *
   * ```typescript
   * // Add a thumbs up reaction to a message
   * try {
   *   await this.messageListService.addReaction(12345, '👍');
   *   console.log('Reaction added successfully');
   * } catch (error) {
   *   console.error('Failed to add reaction:', error);
   * }
   *
   * // Add reaction from emoji picker
   * onEmojiSelected(messageId: number, emoji: string): void {
   *   this.messageListService.addReaction(messageId, emoji);
   * }
   * ```
   *
   * @param messageId - The server-assigned ID of the message to add the reaction to
   * @param emoji - The emoji/reaction string to add (e.g., "👍", "❤️", "😂")
   * @returns A Promise that resolves when the reaction is successfully added
   * @throws Error if the message is not found or if the SDK call fails
   *
   * @see Requirement 4.4 - Reactions SHALL support adding new reactions via an emoji picker
   * @see removeReaction - Remove a reaction from a message
   * @see fetchReactions - Fetch reactions for a message
   * @see updateMessageReactions - Update message reactions locally
   */
  async addReaction(messageId: number, emoji: string): Promise<void> {
    // Step 1: Get the current message for optimistic update
    const message = this.messageIdMap.get(this.normalizeMessageId(messageId));

    if (!message) {
      const error = new Error(
        `[MessageListService] addReaction: Message with ID ${messageId} not found`
      );
      CometChatLogger.error('MessageListService', error.message);
      throw error;
    }

    // Step 2: Store original reactions for potential rollback
    const originalReactions = message.getReactions() || [];

    // Step 3: Perform optimistic update
    const updatedReactions: CometChat.ReactionCount[] = [];
    let reactionFound = false;

    // Clone and update existing reactions
    originalReactions.forEach(reaction => {
      if (reaction.getReaction() === emoji) {
        // Emoji already exists - increment count and mark as reacted by me
        reaction.setCount(reaction.getCount() + 1);
        reaction.setReactedByMe(true);
        updatedReactions.push(reaction);
        reactionFound = true;
      } else {
        updatedReactions.push(reaction);
      }
    });

    // If emoji doesn't exist, add a new reaction
    if (!reactionFound) {
      const newReaction = new CometChat.ReactionCount(emoji, 1, true);
      updatedReactions.push(newReaction);
    }

    // Step 4: Apply optimistic update to UI
    this.updateMessageReactions(messageId, updatedReactions);

    try {
      // Step 5: Call SDK to persist the reaction
      await CometChat.addReaction(messageId, emoji);
    } catch (error) {
      // Step 6: Rollback optimistic update on error
      CometChatLogger.error('MessageListService', 'addReaction: Failed to add reaction', error);
      this.updateMessageReactions(messageId, originalReactions);

      // Note: Reaction errors should NOT set errorStateSignal to avoid showing
      // the full error state UI. The optimistic rollback handles the UI gracefully.

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }
    }
  }

  /**
   * Remove a reaction from a message.
   *
   * This method removes a reaction (emoji) from a message by calling the CometChat SDK's
   * `removeReaction` API. It performs an optimistic update to immediately reflect the
   * change in the UI, then syncs with the server.
   *
   * ## How It Works
   *
   * 1. **Optimistic Update**: Immediately updates the local message state to remove the reaction
   * 2. **Server Call**: Calls `CometChat.removeReaction(messageId, emoji)` to persist the removal
   * 3. **Error Rollback**: If the server call fails, the optimistic update is rolled back
   *
   * ## Optimistic Update Flow
   *
   * 1. Get the current message from the message list
   * 2. Clone the current reactions array
   * 3. Find the reaction with the matching emoji:
   *    - If count > 1: Decrement count and set `reactedByMe` to false
   *    - If count === 1: Remove the reaction entirely from the array
   * 4. Update the message with new reactions (optimistic)
   * 5. Call SDK to persist the removal
   * 6. On error: Rollback to original reactions
   *
   * ## Error Handling
   *
   * - Errors are logged to the console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The optimistic update is rolled back on error to maintain consistency
   * - The error is re-thrown for the caller to handle if needed
   *
   * ## Example Usage
   *
   * ```typescript
   * // Remove a thumbs up reaction from a message
   * try {
   *   await this.messageListService.removeReaction(12345, '👍');
   *   console.log('Reaction removed successfully');
   * } catch (error) {
   *   console.error('Failed to remove reaction:', error);
   * }
   *
   * // Toggle reaction - remove if already reacted
   * onReactionClick(messageId: number, reaction: CometChat.ReactionCount): void {
   *   if (reaction.getReactedByMe()) {
   *     this.messageListService.removeReaction(messageId, reaction.getReaction());
   *   } else {
   *     this.messageListService.addReaction(messageId, reaction.getReaction());
   *   }
   * }
   * ```
   *
   * @param messageId - The server-assigned ID of the message to remove the reaction from
   * @param emoji - The emoji/reaction string to remove (e.g., "👍", "❤️", "😂")
   * @returns A Promise that resolves when the reaction is successfully removed
   * @throws Error if the message is not found or if the SDK call fails
   *
   * @see Requirement 4.5 - Reactions SHALL support removing the user's own reaction by clicking it again
   * @see addReaction - Add a reaction to a message
   * @see fetchReactions - Fetch reactions for a message
   * @see updateMessageReactions - Update message reactions locally
   */
  async removeReaction(messageId: number, emoji: string): Promise<void> {
    // Step 1: Get the current message for optimistic update
    const message = this.messageIdMap.get(this.normalizeMessageId(messageId));

    if (!message) {
      const error = new Error(
        `[MessageListService] removeReaction: Message with ID ${messageId} not found`
      );
      CometChatLogger.error('MessageListService', error.message);
      throw error;
    }

    // Step 2: Store original reactions for potential rollback
    const originalReactions = message.getReactions() || [];

    // Step 3: Perform optimistic update
    const updatedReactions: CometChat.ReactionCount[] = [];

    originalReactions.forEach(reaction => {
      if (reaction.getReaction() === emoji) {
        // Found the emoji to remove
        if (reaction.getCount() > 1) {
          // More than one user has this reaction - decrement count
          reaction.setCount(reaction.getCount() - 1);
          reaction.setReactedByMe(false);
          updatedReactions.push(reaction);
        }
        // If count === 1, don't add to updatedReactions (effectively removes it)
      } else {
        // Keep other reactions unchanged
        updatedReactions.push(reaction);
      }
    });

    // Step 4: Apply optimistic update to UI
    this.updateMessageReactions(messageId, updatedReactions);

    try {
      // Step 5: Call SDK to persist the removal
      await CometChat.removeReaction(messageId, emoji);
    } catch (error) {
      // Step 6: Rollback optimistic update on error
      CometChatLogger.error(
        'MessageListService',
        'removeReaction: Failed to remove reaction',
        error
      );
      this.updateMessageReactions(messageId, originalReactions);

      // Note: Reaction errors should NOT set errorStateSignal to avoid showing
      // the full error state UI. The optimistic rollback handles the UI gracefully.

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }
    }
  }

  /**
   * Fetch reactions for a specific message.
   *
   * This method fetches the detailed reaction information for a message, including
   * which users reacted with each emoji. It uses the CometChat SDK's ReactionsRequestBuilder
   * to fetch paginated reaction data.
   *
   * ## How It Works
   *
   * 1. **Builder Configuration**: Uses the provided `ReactionsRequestBuilder` or creates a default one
   * 2. **Request Building**: Configures the builder with the message ID and builds the request
   * 3. **Fetch Reactions**: Calls `fetchNext()` on the request to get the reactions
   * 4. **Return Data**: Returns the array of `CometChat.Reaction` objects
   *
   * ## Default Builder Configuration
   *
   * If no builder is provided, a default builder is created with:
   * - Message ID set to the provided `messageId`
   * - Default limit (typically 25 reactions per page)
   *
   * ## Custom Builder Usage
   *
   * You can provide a custom `ReactionsRequestBuilder` to:
   * - Filter by specific emoji: `builder.setReaction('👍')`
   * - Change the limit: `builder.setLimit(50)`
   * - Configure other SDK options
   *
   * ## Pagination
   *
   * This method fetches one page of reactions. For pagination:
   * - Store the builder instance
   * - Call `fetchReactions` again with the same builder to get the next page
   * - The builder maintains pagination state internally
   *
   * ## Error Handling
   *
   * - Errors are logged to the console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The error is re-thrown for the caller to handle
   *
   * ## Example Usage
   *
   * ```typescript
   * // Fetch reactions with default builder
   * const reactions = await this.messageListService.fetchReactions(12345);
   * console.log('Reactions:', reactions);
   *
   * // Fetch reactions with custom builder (filter by emoji)
   * const builder = new CometChat.ReactionsRequestBuilder()
   *   .setMessageId(12345)
   *   .setReaction('👍')
   *   .setLimit(50);
   * const thumbsUpReactions = await this.messageListService.fetchReactions(12345, builder);
   *
   * // Paginated fetching
   * const builder = new CometChat.ReactionsRequestBuilder()
   *   .setMessageId(12345)
   *   .setLimit(25);
   * const firstPage = await this.messageListService.fetchReactions(12345, builder);
   * const secondPage = await this.messageListService.fetchReactions(12345, builder);
   * ```
   *
   * @param messageId - The server-assigned ID of the message to fetch reactions for
   * @param builder - Optional custom ReactionsRequestBuilder for advanced configuration
   * @returns A Promise that resolves with an array of CometChat.Reaction objects
   * @throws Error if the SDK call fails
   *
   * @see Requirement 4.7 - Reactions SHALL be fetched using the reactionsRequestBuilder if provided
   * @see addReaction - Add a reaction to a message
   * @see removeReaction - Remove a reaction from a message
   * @see updateMessageReactions - Update message reactions locally
   */
  async fetchReactions(
    messageId: number,
    builder?: CometChat.ReactionsRequestBuilder
  ): Promise<CometChat.Reaction[]> {
    try {
      // Step 1: Use provided builder or create a default one
      let reactionsRequestBuilder: CometChat.ReactionsRequestBuilder;

      if (builder) {
        // Use the provided builder and set the message ID
        reactionsRequestBuilder = builder.setMessageId(messageId);
      } else {
        // Create a default builder with the message ID
        reactionsRequestBuilder = new CometChat.ReactionsRequestBuilder().setMessageId(messageId);
      }

      // Step 2: Build the request
      const reactionsRequest = reactionsRequestBuilder.build();

      // Step 3: Fetch reactions from the server
      const reactions: CometChat.Reaction[] = await reactionsRequest.fetchNext();

      // Step 4: Return the reactions
      return reactions;
    } catch (error) {
      // Log error for debugging
      CometChatLogger.error(
        'MessageListService',
        'fetchReactions: Failed to fetch reactions',
        error
      );

      // Note: Fetch reactions errors should NOT set errorStateSignal to avoid replacing
      // the message list with the full error state UI.

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }

      // Return empty array instead of propagating error
      return [];
    }
  }

  // ==================== Mark as Read/Delivered Operations ====================

  /**
   * Mark a message as read.
   *
   * This method sends a read receipt to the CometChat server, indicating that
   * the current user has read the specified message. This updates the message's
   * read status for the sender and other participants in the conversation.
   *
   * ## How It Works
   *
   * 1. Calls `CometChat.markAsRead(message)` to send the read receipt to the server
   * 2. The SDK handles updating the message's read status on the server
   * 3. Other participants receive the read receipt via their message listeners
   * 4. Errors are logged but not propagated to avoid disrupting the UI
   *
   * ## When to Use
   *
   * - **Message visibility**: When a message becomes visible in the viewport
   * - **Conversation opened**: When the user opens a conversation with unread messages
   * - **Scroll to message**: When the user scrolls to view a previously unread message
   * - **New message received**: When a new message is received and the conversation is active
   *
   * ## Error Handling
   *
   * This method handles errors gracefully without disrupting the UI:
   * - Errors are logged to the console with `[MessageListService]` prefix for debugging
   * - Errors are NOT propagated to the component or shown to the user
   * - The UI continues to function normally even if the read receipt fails to send
   *
   * This graceful error handling is intentional because:
   * - Read receipts are not critical to the chat functionality
   * - Network issues may cause temporary failures that resolve on their own
   * - Retrying read receipts is handled by the SDK internally
   *
   * ## Important Notes
   *
   * - This method is asynchronous but does not return a result
   * - The method does not update local message state; that is handled by receipt listeners
   * - Multiple calls with the same message are safe; the SDK handles deduplication
   * - The message must have a valid ID for the read receipt to be sent
   *
   * ## Example Usage
   *
   * ```typescript
   * // Mark a message as read when it becomes visible
   * onMessageVisible(message: CometChat.BaseMessage): void {
   *   this.messageListService.markAsRead(message);
   * }
   *
   * // Mark the last message as read when conversation is opened
   * onConversationOpened(messages: CometChat.BaseMessage[]): void {
   *   const lastMessage = messages[messages.length - 1];
   *   if (lastMessage) {
   *     this.messageListService.markAsRead(lastMessage);
   *   }
   * }
   *
   * // Mark all visible messages as read
   * markVisibleMessagesAsRead(visibleMessages: CometChat.BaseMessage[]): void {
   *   visibleMessages.forEach(message => {
   *     this.messageListService.markAsRead(message);
   *   });
   * }
   * ```
   *
   * @param message - The message to mark as read. Must be a valid CometChat.BaseMessage
   *                  with a server-assigned ID.
   * @returns A Promise that resolves when the operation completes (success or failure).
   *          The Promise never rejects; errors are handled internally.
   *
   * @see Requirement 11.1 - Ensure single SDK call per batch
   * @see Requirement 11.2 - Add retry logic with exponential backoff
   * @see Requirement 11.3 - Add error handling that doesn't fail silently
   * @see Requirement 13.1 - Provide markAsRead(message) method to mark a message as read
   * @see Requirement 13.2 - Invoke SDK's markAsRead() method when markAsRead is called
   * @see Requirement 13.5 - Handle errors from mark operations gracefully without disrupting the UI
   * @see markAsDelivered - Mark a message as delivered
   */
  async markAsRead(message: CometChat.BaseMessage): Promise<void> {
    const maxRetries = 2;
    const retryDelays = [1000, 2000]; // Exponential backoff: 1s, 2s

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Requirement 11.1: Single SDK call per batch (message represents the latest in batch)
        await CometChat.markAsRead(message);
        return; // Success - exit retry loop
      } catch (error: unknown) {
        const isLastAttempt = attempt === maxRetries;

        // Determine if error is retryable
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || isLastAttempt) {
          // Requirement 11.3: Error handling that doesn't fail silently
          CometChatLogger.error(
            'MessageListService',
            `markAsRead: Failed to mark message as read after ${attempt + 1} attempt(s)`,
            {
              messageId: message.getId(),
              error: error,
              isRetryable: isRetryable,
            }
          );
          return; // Exit - don't propagate error to UI
        }

        // Wait before retrying (exponential backoff)
        const delay = retryDelays[attempt];
        CometChatLogger.warn(
          'MessageListService',
          `markAsRead: Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          { messageId: message.getId(), error: error }
        );
        await this.delay(delay);
      }
    }
  }

  /**
   * Update read status locally for multiple messages without making SDK calls.
   *
   * This method batch updates the read status for multiple messages in the local
   * message list. It is used after a single SDK call has been made with the latest
   * message to update all unread messages in the batch.
   *
   * ## How It Works
   *
   * 1. Accepts an array of message IDs to update
   * 2. Gets the current timestamp for the read receipt
   * 3. Iterates through each message ID
   * 4. Finds the message using O(1) lookup
   * 5. Updates the message's readAt timestamp locally
   * 6. Updates the message in the list to trigger UI refresh
   *
   * ## Important Notes
   *
   * - This method does NOT make SDK calls - it only updates local state
   * - Should be called AFTER a single SDK call with the latest message
   * - Used to optimize read receipts by avoiding multiple SDK calls
   * - If a message is not found, it is skipped (no error thrown)
   *
   * ## Example Usage
   *
   * ```typescript
   * // Mark multiple messages as read locally after SDK call
   * const unreadMessageIds = [101, 102, 103, 104, 105];
   * const latestMessage = messages.find(m => m.getId() === 105);
   *
   * // Make single SDK call with latest message
   * await this.messageListService.markAsRead(latestMessage);
   *
   * // Update all messages locally
   * this.messageListService.updateLocalReadStatus(unreadMessageIds);
   * ```
   *
   * @param messageIds - Array of message IDs to update locally
   * @see Requirement 11.4 - Batch update read status for multiple messages
   * @see Requirement 1.2 - Update all unread messages locally after single SDK call
   * @see Requirement 4.2 - Update all unread messages locally after single SDK call
   */
  updateLocalReadStatus(messageIds: number[]): void {
    // Get current timestamp for read receipt
    const readAt = Math.floor(Date.now() / 1000);

    // Batch update all messages locally
    messageIds.forEach(messageId => {
      const message = this.getMessageById(messageId);

      if (message) {
        // Update read status locally without SDK call
        message.setReadAt(readAt);

        // Force signal update by replacing the message in the array
        this.allMessagesSignal.update(current => {
          const index = current.findIndex(m => this.normalizeMessageId(m.getId()) === messageId);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = message;
            return updated;
          }
          return current;
        });

        this.messagesSignal.update(current => {
          const index = current.findIndex(m => this.normalizeMessageId(m.getId()) === messageId);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = message;
            return updated;
          }
          return current;
        });
      }
    });
  }

  /**
   * Marks initial messages as read after they are fetched and rendered.
   * Iterates from last message backwards, stops after marking first unread message.
   * This ensures read receipts are sent when the chat loads for the first time.
   *
   * @private
   * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  private async markInitialMessagesAsRead(): Promise<void> {
    const messages = this.messagesSignal();
    const loggedInUser = CometChatUIKit.getLoggedInUser();

    if (messages.length === 0 || !loggedInUser) {
      return;
    }

    // Iterate from last message backwards (Requirement 1.1, 1.2, 1.3)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];

      // Check if this is an unread receiver message
      const isReceiverMessage =
        msg.getSender() && msg.getSender().getUid() !== loggedInUser.getUid();

      if (!msg.getReadAt() && isReceiverMessage) {
        // Found the latest unread message - mark it as read
        try {
          // Make SDK call with this message (Requirement 1.4)
          // SDK will mark this and all previous messages as read automatically
          await this.markAsRead(msg);

          // Update local status for this message (Requirement 1.2)
          const messageId = msg.getId();
          if (messageId) {
            this.updateLocalReadStatus([messageId]);
          }

          // Notify conversations component that message was read
          CometChatMessageEvents.ccMessageRead.next(msg);

          // Stop after marking the first (latest) unread message (Requirement 1.5)
          break;
        } catch (error) {
          CometChatLogger.error(
            'MessageListService',
            'Error marking messages as read on initial load:',
            error
          );
        }
      }
    }
  }

  /**
   * Determine if an error is retryable.
   *
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   * @private
   */
  private isRetryableError(error: unknown): boolean {
    const err = error as Record<string, unknown> | null | undefined;
    const errMessage = typeof err?.['message'] === 'string' ? err['message'] : '';
    const errCode = typeof err?.['code'] === 'string' ? err['code'] : '';

    // Network errors are retryable
    if (errMessage.includes('network') || errMessage.includes('timeout')) {
      return true;
    }

    // Connection errors are retryable
    if (errCode === 'ERR_CONNECTION_REFUSED' || errCode === 'ECONNREFUSED') {
      return true;
    }

    // Invalid message or permission errors are NOT retryable
    if (errCode === 'ERR_INVALID_MESSAGE' || errCode === 'ERR_UNAUTHORIZED') {
      return false;
    }

    // Default: retry for unknown errors
    return true;
  }

  /**
   * Mark a message as delivered.
   *
   * This method sends a delivery receipt to the CometChat server, indicating that
   * the message has been delivered to the current user's device. This updates the
   * message's delivery status for the sender.
   *
   * ## How It Works
   *
   * 1. Calls `CometChat.markAsDelivered(message)` to send the delivery receipt to the server
   * 2. The SDK handles updating the message's delivery status on the server
   * 3. The sender receives the delivery receipt via their message listeners
   * 4. Errors are logged but not propagated to avoid disrupting the UI
   *
   * ## When to Use
   *
   * - **Message received**: When a new message is received from the server
   * - **App foreground**: When the app comes to the foreground with pending messages
   * - **Initial load**: When messages are fetched and need delivery confirmation
   *
   * ## Difference from markAsRead
   *
   * - **markAsDelivered**: Indicates the message reached the device (automatic)
   * - **markAsRead**: Indicates the user has seen/read the message (user action)
   *
   * Typically, `markAsDelivered` is called automatically when messages are received,
   * while `markAsRead` is called when the user views the message.
   *
   * ## Error Handling
   *
   * This method handles errors gracefully without disrupting the UI:
   * - Errors are logged to the console with `[MessageListService]` prefix for debugging
   * - Errors are NOT propagated to the component or shown to the user
   * - The UI continues to function normally even if the delivery receipt fails to send
   *
   * This graceful error handling is intentional because:
   * - Delivery receipts are not critical to the chat functionality
   * - Network issues may cause temporary failures that resolve on their own
   * - Retrying delivery receipts is handled by the SDK internally
   *
   * ## Important Notes
   *
   * - This method is asynchronous but does not return a result
   * - The method does not update local message state; that is handled by receipt listeners
   * - Multiple calls with the same message are safe; the SDK handles deduplication
   * - The message must have a valid ID for the delivery receipt to be sent
   *
   * ## Example Usage
   *
   * ```typescript
   * // Mark a message as delivered when received
   * onMessageReceived(message: CometChat.BaseMessage): void {
   *   // Add to message list
   *   this.messageListService.addMessage(message);
   *   // Send delivery receipt
   *   this.messageListService.markAsDelivered(message);
   * }
   *
   * // Mark all fetched messages as delivered
   * onMessagesFetched(messages: CometChat.BaseMessage[]): void {
   *   messages.forEach(message => {
   *     this.messageListService.markAsDelivered(message);
   *   });
   * }
   *
   * // Mark message as delivered when app comes to foreground
   * onAppForeground(pendingMessages: CometChat.BaseMessage[]): void {
   *   pendingMessages.forEach(message => {
   *     this.messageListService.markAsDelivered(message);
   *   });
   * }
   * ```
   *
   * @param message - The message to mark as delivered. Must be a valid CometChat.BaseMessage
   *                  with a server-assigned ID.
   * @returns A Promise that resolves when the operation completes (success or failure).
   *          The Promise never rejects; errors are handled internally.
   *
   * @see Requirement 13.3 - Provide markAsDelivered(message) method to mark a message as delivered
   * @see Requirement 13.4 - Invoke SDK's markAsDelivered() method when markAsDelivered is called
   * @see Requirement 13.5 - Handle errors from mark operations gracefully without disrupting the UI
   * @see markAsRead - Mark a message as read
   */
  async markAsDelivered(message: CometChat.BaseMessage): Promise<void> {
    try {
      await CometChat.markAsDelivered(message);
    } catch (error) {
      // Log error for debugging but don't propagate to UI
      // Delivery receipts are not critical and should not disrupt the user experience
      CometChatLogger.error(
        'MessageListService',
        'markAsDelivered: Failed to mark message as delivered',
        error
      );
    }
  }

  // ==================== Memory Management Operations ====================

  /**
   * Get messages within a specific index range for virtualization.
   *
   * This method returns a slice of the `allMessagesSignal` array for the specified
   * index range. It is designed to support virtualized rendering of large message
   * lists, where only the visible messages need to be rendered at any given time.
   *
   * ## Purpose
   *
   * When rendering large message lists (thousands of messages), rendering all
   * messages at once would cause performance issues. Virtualization solves this
   * by only rendering the messages that are currently visible in the viewport.
   * This method allows the UI to request only the messages in the visible range.
   *
   * ## How It Works
   *
   * 1. Validates that `startIndex` and `endIndex` are within valid bounds
   * 2. Handles edge cases (negative indices, out of bounds, startIndex > endIndex)
   * 3. Returns a slice of the `allMessagesSignal` array from `startIndex` to `endIndex` (inclusive)
   *
   * ## Range Behavior
   *
   * - **startIndex**: The starting index (0-based, inclusive)
   * - **endIndex**: The ending index (0-based, inclusive)
   * - The returned array includes messages at both `startIndex` and `endIndex`
   * - For example, `getMessagesInRange(0, 2)` returns messages at indices 0, 1, and 2 (3 messages)
   *
   * ## Edge Case Handling
   *
   * - **Negative indices**: Returns an empty array
   * - **startIndex > endIndex**: Returns an empty array
   * - **startIndex >= totalCount**: Returns an empty array
   * - **endIndex >= totalCount**: Clamps to the last valid index
   * - **Empty message list**: Returns an empty array
   *
   * ## Performance
   *
   * - **Time Complexity**: O(k) where k is the number of messages in the range (endIndex - startIndex + 1)
   * - **Space Complexity**: O(k) for the returned array slice
   *
   * ## Example Usage
   *
   * ```typescript
   * // Get messages for the visible viewport (indices 10-25)
   * const visibleMessages = this.messageListService.getMessagesInRange(10, 25);
   *
   * // Get the first 10 messages
   * const firstTen = this.messageListService.getMessagesInRange(0, 9);
   *
   * // Get messages for virtual scroll component
   * onViewportChange(startIndex: number, endIndex: number): void {
   *   this.visibleMessages = this.messageListService.getMessagesInRange(startIndex, endIndex);
   * }
   *
   * // Handle edge cases gracefully
   * const empty1 = this.messageListService.getMessagesInRange(-1, 5);  // Returns []
   * const empty2 = this.messageListService.getMessagesInRange(10, 5);  // Returns []
   * const clamped = this.messageListService.getMessagesInRange(0, 1000); // Clamps to actual length
   * ```
   *
   * @param startIndex - The starting index (0-based, inclusive). Must be >= 0.
   * @param endIndex - The ending index (0-based, inclusive). Must be >= startIndex.
   * @returns An array of messages within the specified range, or an empty array if the range is invalid.
   *
   * @see Requirement 16.2 - Provide method to get messages within a specific range for virtualization
   * @see allMessages - The complete message history signal
   * @see getTotalMessageCount - Get the total number of messages in memory
   */
  getMessagesInRange(startIndex: number, endIndex: number): CometChat.BaseMessage[] {
    const allMessages = this.allMessagesSignal();
    const totalCount = allMessages.length;

    // Handle empty message list
    if (totalCount === 0) {
      return [];
    }

    // Validate startIndex is not negative
    if (startIndex < 0) {
      CometChatLogger.warn(
        'MessageListService',
        `getMessagesInRange: startIndex (${startIndex}) is negative, returning empty array`
      );
      return [];
    }

    // Validate endIndex is not negative
    if (endIndex < 0) {
      CometChatLogger.warn(
        'MessageListService',
        `getMessagesInRange: endIndex (${endIndex}) is negative, returning empty array`
      );
      return [];
    }

    // Validate startIndex is not greater than endIndex
    if (startIndex > endIndex) {
      CometChatLogger.warn(
        'MessageListService',
        `getMessagesInRange: startIndex (${startIndex}) is greater than endIndex (${endIndex}), returning empty array`
      );
      return [];
    }

    // Validate startIndex is within bounds
    if (startIndex >= totalCount) {
      CometChatLogger.warn(
        'MessageListService',
        `getMessagesInRange: startIndex (${startIndex}) is out of bounds (totalCount: ${totalCount}), returning empty array`
      );
      return [];
    }

    // Clamp endIndex to the last valid index if it exceeds bounds
    const clampedEndIndex = Math.min(endIndex, totalCount - 1);

    // Return the slice of messages (slice is exclusive of end, so add 1)
    return allMessages.slice(startIndex, clampedEndIndex + 1);
  }

  /**
   * Get the total number of messages currently stored in memory.
   *
   * This method returns the length of the `allMessagesSignal` array, which contains
   * the complete message history that has been fetched and stored in memory. It is
   * essential for virtualization to know the total number of messages for calculating
   * scroll positions and determining when to load more messages.
   *
   * ## Purpose
   *
   * When implementing virtualized message lists, the UI needs to know:
   * 1. **Total scroll height**: Calculate the total scrollable area based on message count
   * 2. **Scroll position**: Determine which messages are visible at a given scroll position
   * 3. **Load more triggers**: Know when the user has scrolled near the beginning/end
   * 4. **Progress indicators**: Show how many messages have been loaded vs. total available
   *
   * ## How It Works
   *
   * Simply returns the length of the `allMessagesSignal` array. This is an O(1) operation
   * since JavaScript arrays maintain their length as a property.
   *
   * ## Relationship with Other Methods
   *
   * - **getMessagesInRange(startIndex, endIndex)**: Uses total count to validate range bounds
   * - **fetchPreviousMessages()**: Increases total count when older messages are loaded
   * - **fetchNextMessages()**: Increases total count when newer messages are loaded
   * - **addMessage()**: Increases total count by 1
   * - **removeMessage()**: Decreases total count by 1
   * - **clearMessages()**: Resets total count to 0
   *
   * ## Performance
   *
   * - **Time Complexity**: O(1) - Direct array length access
   * - **Space Complexity**: O(1) - No additional memory allocation
   *
   * ## Example Usage
   *
   * ```typescript
   * // Get total message count for scroll calculations
   * const totalMessages = this.messageListService.getTotalMessageCount();
   *
   * // Calculate scroll height for virtual scroll
   * const estimatedItemHeight = 60; // pixels
   * const totalScrollHeight = totalMessages * estimatedItemHeight;
   *
   * // Check if more messages might be available
   * if (totalMessages < expectedTotal) {
   *   this.messageListService.fetchPreviousMessages();
   * }
   *
   * // Display message count to user
   * console.log(`Loaded ${totalMessages} messages`);
   *
   * // Use with getMessagesInRange for virtualization
   * const totalCount = this.messageListService.getTotalMessageCount();
   * const visibleRange = this.calculateVisibleRange(scrollPosition, viewportHeight);
   * const startIndex = Math.max(0, visibleRange.start);
   * const endIndex = Math.min(totalCount - 1, visibleRange.end);
   * const visibleMessages = this.messageListService.getMessagesInRange(startIndex, endIndex);
   * ```
   *
   * @returns The total number of messages in the `allMessagesSignal` array.
   *          Returns 0 if no messages have been loaded.
   *
   * @see Requirement 16.4 - Provide getTotalMessageCount() method returning total messages in memory
   * @see getMessagesInRange - Get messages within a specific index range
   * @see allMessages - The complete message history signal
   * @see clearMessages - Clear all messages from memory
   */
  getTotalMessageCount(): number {
    return this.allMessagesSignal().length;
  }

  /**
   * Clear all messages from memory.
   *
   * This method resets all message-related state to its initial values, effectively
   * clearing the message list. It is used when switching conversations, logging out,
   * or resetting the message list state.
   *
   * ## Purpose
   *
   * When the user switches to a different conversation or logs out, the message list
   * needs to be cleared to:
   * 1. **Free memory**: Release references to old messages for garbage collection
   * 2. **Prevent data leakage**: Ensure messages from one conversation don't appear in another
   * 3. **Reset pagination**: Clear pagination IDs so the new conversation starts fresh
   * 4. **Clean state**: Ensure the UI shows a clean slate for the new conversation
   *
   * ## What Gets Cleared
   *
   * - **allMessagesSignal**: Reset to empty array `[]`
   * - **messagesSignal**: Reset to empty array `[]`
   * - **messageIdMap**: Cleared (all entries removed)
   * - **messageMuidMap**: Cleared (all entries removed)
   * - **prevMessageIdSignal**: Reset to `0`
   * - **nextMessageIdSignal**: Reset to `0`
   *
   * ## What Is NOT Cleared
   *
   * - **loadingStateSignal**: Not affected (may still be loading)
   * - **errorStateSignal**: Not affected (use `clearError()` separately if needed)
   * - **unreadCountSignal**: Not affected (managed separately)
   * - **connectionStatusSignal**: Not affected (connection state is independent)
   * - **Configuration properties**: Not affected (user, group, parentMessageId, etc.)
   * - **errorCallback**: Not affected (error handling persists)
   *
   * ## When to Use
   *
   * - **Switching conversations**: Call before setting a new user/group
   * - **User logout**: Call as part of cleanup when user logs out
   * - **Resetting state**: Call when you need to reload messages from scratch
   * - **Memory management**: Call to free memory when message list is not visible
   *
   * ## Relationship with Other Methods
   *
   * - **cleanup()**: Calls `clearMessages()` as part of full cleanup (also removes listeners)
   * - **resetState()**: Calls `clearMessages()` as part of state reset
   * - **setUser()/setGroup()**: May call `clearMessages()` when switching conversations
   * - **getTotalMessageCount()**: Returns 0 after `clearMessages()` is called
   * - **getMessagesInRange()**: Returns empty array after `clearMessages()` is called
   *
   * ## Performance
   *
   * - **Time Complexity**: O(1) - Signal updates and map clears are constant time
   * - **Space Complexity**: O(1) - No additional memory allocation
   *
   * ## Example Usage
   *
   * ```typescript
   * // Clear messages when switching conversations
   * onConversationChange(newUser: CometChat.User): void {
   *   this.messageListService.clearMessages();
   *   this.messageListService.setUser(newUser);
   *   this.messageListService.fetchPreviousMessages();
   * }
   *
   * // Clear messages on logout
   * onLogout(): void {
   *   this.messageListService.clearMessages();
   *   // Or use cleanup() for full cleanup including listeners
   *   // this.messageListService.cleanup();
   * }
   *
   * // Clear messages to free memory when component is hidden
   * onHide(): void {
   *   this.messageListService.clearMessages();
   * }
   *
   * // Verify messages are cleared
   * this.messageListService.clearMessages();
   * console.log(this.messageListService.getTotalMessageCount()); // 0
   * console.log(this.messageListService.allMessages()); // []
   * console.log(this.messageListService.prevMessageId()); // 0
   * console.log(this.messageListService.nextMessageId()); // 0
   * ```
   *
   * @returns void
   *
   * @see Requirement 16.5 - Provide clearMessages() method to clear all messages from memory
   * @see cleanup - Full cleanup including listener removal
   * @see getTotalMessageCount - Returns 0 after clearMessages()
   * @see getMessagesInRange - Returns empty array after clearMessages()
   * @see allMessages - The complete message history signal (cleared by this method)
   */
  clearMessages(): void {
    // Reset message arrays to empty
    this.allMessagesSignal.set([]);
    this.messagesSignal.set([]);

    // Clear message lookup maps
    this.messageIdMap.clear();
    this.messageMuidMap.clear();

    // Reset pagination IDs
    this.prevMessageIdSignal.set(0);
    this.nextMessageIdSignal.set(0);
  }

  // ==================== Real-time Listeners ====================

  /**
   * Set up the sent message listener for real-time synchronization of sent messages.
   *
   * This method subscribes to `CometChatMessageEvents.ccMessageSent` to receive
   * notifications when the current user sends a message via the message composer.
   * This enables real-time synchronization of sent messages in the message list.
   *
   * **Why This Is Needed:**
   * The SDK's real-time listeners (onTextMessageReceived, onMediaMessageReceived, etc.)
   * only fire for messages received from OTHER users. Messages sent by the current
   * user are not captured by these listeners. This subscription fills that gap by
   * listening to the ccMessageSent event emitted by the message composer.
   *
   * **Event Handling:**
   * The subscription receives `IMessages` objects containing:
   * - `message`: The CometChat.BaseMessage that was sent
   * - `status`: MessageStatus enum (inprogress, success, error)
   *
   * The handler method `handleSentMessage()` processes these events to:
   * - Add messages immediately on `inprogress` (optimistic UI)
   * - Update messages by MUID on `success`
   * - Update messages with error state on `error`
   *
   * **Lifecycle:**
   * - Called in constructor to set up subscription immediately
   * - Subscription persists across conversation switches (NOT unsubscribed in resetState)
   * - Unsubscribed only in cleanup() via removeSentMessageListener()
   *
   * @private
   * @see Requirement 1.1 - Subscribe to ccMessageSent in constructor
   * @see Requirement 1.2 - Handle inprogress status (optimistic UI)
   * @see Requirement 1.3 - Handle success status (update by MUID)
   * @see Requirement 1.4 - Handle error status
   * @see Requirement 5.1 - Store subscription in private property
   */
  private setupSentMessageListener(): void {
    this.ccMessageSentSubscription = CometChatMessageEvents.ccMessageSent.subscribe(
      (data: IMessages) => {
        this.handleSentMessage(data);
      }
    );
  }

  /**
   * Set up subscription to ccMessageEdited event from message composer.
   *
   * This subscription enables real-time updates for messages edited by the
   * current user. When a user edits their own message via the composer,
   * the message list needs to update immediately to reflect the changes.
   *
   * **Why This Is Needed:**
   * The SDK's onMessageEdited listener only fires for messages edited by OTHER users.
   * For the sender's own edits, we need to listen to the composer's ccMessageEdited event.
   *
   * **Lifecycle:**
   * - Called in constructor to set up subscription immediately
   * - Subscription persists across conversation switches (NOT unsubscribed in resetState)
   * - Unsubscribed only in cleanup() via removeEditedMessageListener()
   *
   * @private
   */
  private setupEditedMessageListener(): void {
    this.ccMessageEditedSubscription = CometChatMessageEvents.ccMessageEdited.subscribe(
      (data: IMessages) => {
        // Only handle success status - this is when the edit is confirmed by the server
        if (data.status === MessageStatus.success && data.message) {
          this.handleEditedMessage(data.message);
        }
      }
    );
  }

  /**
   * Handle edited message events from the message composer.
   *
   * This method processes ccMessageEdited events to synchronize edited messages
   * in the message list for the sender. It validates the message belongs to the
   * current conversation and updates it in place.
   *
   * @param message - The edited message with updated content
   * @private
   */
  private handleEditedMessage(message: CometChat.BaseMessage): void {
    // Validate message belongs to current conversation
    if (!this.isMessageForCurrentConversation(message)) {
      return;
    }

    // Update the message in the list
    this.updateMessageById(message.getId(), message);

    // Emit the onMessageEdited event for components to listen to
    CometChatMessageEvents.onMessageEdited.next(message);
  }

  /**
   * Handle sent message events from the message composer.
   *
   * This method processes ccMessageSent events to synchronize sent messages
   * in the message list. It handles three status types:
   * - `inprogress`: Add message immediately (optimistic UI)
   * - `success`: Update existing message by MUID with server-confirmed data
   * - `error`: Update message to show error state
   *
   * **Implementation Note:**
   * This is a placeholder that will be fully implemented in Task 1.2.
   * The full implementation will:
   * - Validate message belongs to current conversation
   * - Handle each status type appropriately
   * - Update reply counts for thread messages
   *
   * @param data - The IMessages object containing message and status
   * @private
   * @see Requirement 1.2 - Handle inprogress status
   * @see Requirement 1.3 - Handle success status
   * @see Requirement 1.4 - Handle error status
   * @see Requirement 1.6 - Validate message belongs to current conversation
   */
  private handleSentMessage(data: IMessages): void {
    const { message, status } = data;

    // For thread replies sent while in normal (non-thread) mode:
    // isMessageForCurrentConversation will reject them (they have a parentMessageId).
    // But we still need to update the parent message's reply count in the main list.
    // This mirrors the same pattern used in handleNewMessage for incoming thread replies.
    if (!this.parentMessageId && message.getParentMessageId() && status === MessageStatus.success) {
      if (this.isThreadReplyForCurrentConversation(message)) {
        this.updateSentMessageReplyCount(message);
      }
      return;
    }

    // Validate message belongs to current conversation
    // This checks user/group context and thread mode (parentMessageId)
    if (!this.isMessageForCurrentConversation(message)) {
      return;
    }

    switch (status) {
      case MessageStatus.inprogress:
        // Add message immediately (optimistic UI)
        // This provides instant feedback to the user that their message was sent
        this.addMessage(message);
        break;

      case MessageStatus.success:
        // Update existing message by MUID with server-confirmed message
        // This replaces the optimistic message with the server response
        this.updateSentMessageByMuid(message);
        break;

      case MessageStatus.error:
        // Update message with error state
        // This allows the UI to show the message failed to send
        this.updateSentMessageByMuid(message);
        break;
    }
  }

  /**
   * Update a sent message by extracting its MUID and calling updateMessageByMuid.
   *
   * This is a helper method that extracts the MUID from the message and uses
   * the existing `updateMessageByMuid` method to update the message in the list.
   * It handles the case where the message doesn't have a MUID or isn't found.
   *
   * **Why This Method Exists:**
   * The `handleSentMessage` method receives a message object from the ccMessageSent
   * event. To update the optimistically added message, we need to find it by MUID
   * and replace it with the server-confirmed message.
   *
   * **Fallback Behavior:**
   * If the message doesn't have a MUID or isn't found in the list, this method
   * falls back to using the message's own ID for the update.
   *
   * @param message - The message to update (contains MUID for lookup)
   * @private
   * @see Requirement 3.1 - Store message with MUID in messageMuidMap
   * @see Requirement 3.2 - Find existing message by MUID and update in place
   * @see Requirement 3.3 - Update both message arrays and lookup maps
   */
  private updateSentMessageByMuid(message: CometChat.BaseMessage): void {
    const muid = message.getMuid?.();
    if (!muid) {
      // No MUID available, try to update by message ID as fallback
      const messageId = message.getId();
      if (messageId) {
        this.updateMessageById(messageId, message);
      }
      return;
    }

    // Look up existing message in messageMuidMap
    const existingMessage = this.messageMuidMap.get(muid);

    if (existingMessage) {
      // Update the existing message by MUID
      this.updateMessageByMuid(muid, message);
    } else {
      // Message not found by MUID, try to update by message ID as fallback
      const messageId = message.getId();
      if (messageId) {
        this.updateMessageById(messageId, message);
      }
    }
  }

  /**
   * Update the reply count on a parent message when a thread reply is sent.
   *
   * This method is called when a sent message has a parentMessageId and the
   * service is NOT in thread mode. It increments the reply count on the parent
   * message to reflect the new thread reply.
   *
   * **When This Is Called:**
   * - A user sends a reply to a thread (message has parentMessageId)
   * - The service is displaying the main conversation (NOT in thread mode)
   * - The ccMessageSent event is received with status `success`
   *
   * **Why This Is Needed:**
   * When viewing the main conversation, thread replies are not displayed inline.
   * Instead, the parent message shows a reply count indicator. This method
   * ensures that count is updated when the current user sends a new reply.
   *
   * **How It Works:**
   * 1. Extracts the parentMessageId from the sent message
   * 2. Looks up the parent message in `messageIdMap` using O(1) lookup
   * 3. Gets the current reply count (defaults to 0 if not set)
   * 4. Increments the count by 1
   * 5. Updates the parent message via `updateMessageById()`
   *
   * **Note:** This method silently returns if:
   * - The message has no parentMessageId
   * - The parent message is not found in the current message list
   *
   * @param message - The sent thread reply message containing the parentMessageId
   * @private
   * @see Requirement 4.3 - Update reply count on parent message when thread reply is sent
   * @see updateReplyCount - Public method for setting absolute reply count
   * @see updateMessageById - Updates message in arrays and lookup maps
   */
  private updateSentMessageReplyCount(message: CometChat.BaseMessage): void {
    const parentId = message.getParentMessageId();

    if (!parentId) {
      // Message is not a thread reply, nothing to update
      return;
    }

    // Look up the parent message using O(1) lookup
    const parentMessage = this.messageIdMap.get(this.normalizeMessageId(parentId));

    if (!parentMessage) {
      // Parent message not in current list (may be outside loaded range)
      // This is not an error - silently return
      return;
    }

    // Clone the parent message to create a new object reference.
    // This is critical for Angular's OnPush change detection — the message bubble
    // component won't re-render if we mutate the same object reference in place.
    // Mirrors React UIKit's CometChatUIKitUtility.clone pattern.
    const clonedParent = CometChatUIKitUtility.clone(parentMessage);

    // Get current reply count and increment by 1
    const currentCount = clonedParent.getReplyCount() || 0;
    clonedParent.setReplyCount(currentCount + 1);

    // Update the parent message in both arrays and lookup maps
    this.updateMessageById(parentId, clonedParent);
  }

  /**
   * Set up the message listener for receiving real-time message events.
   *
   * This method registers a CometChat MessageListener to handle all real-time
   * message events for the current conversation. It is called when a conversation
   * context is set (via `setUser()` or `setGroup()`) and handles the following events:
   *
   * ## Message Events
   *
   * - **onTextMessageReceived**: When a new text message is received
   * - **onMediaMessageReceived**: When a new media message (image, video, audio, file) is received
   * - **onCustomMessageReceived**: When a new custom message is received
   * - **onInteractiveMessageReceived**: When a new interactive message is received
   * - **onMessageEdited**: When an existing message is edited
   * - **onMessageDeleted**: When a message is deleted
   *
   * ## Receipt Events
   *
   * - **onMessagesDelivered**: When messages are delivered to a user (1-on-1 chats)
   * - **onMessagesRead**: When messages are read by a user (1-on-1 chats)
   * - **onMessagesDeliveredToAll**: When messages are delivered to all group members
   * - **onMessagesReadByAll**: When messages are read by all group members
   *
   * ## Reaction Events
   *
   * - **onMessageReactionAdded**: When a reaction is added to a message
   * - **onMessageReactionRemoved**: When a reaction is removed from a message
   *
   * ## Event Flow
   *
   * 1. SDK receives real-time event from WebSocket
   * 2. MessageListener callback is invoked with the event data
   * 3. Event is validated to ensure it belongs to the current conversation
   * 4. Appropriate handler method is called to update the message list
   * 5. UI automatically updates via signal reactivity
   *
   * ## Listener Lifecycle
   *
   * - **Setup**: Called when conversation context is set (`setUser()` or `setGroup()`)
   * - **Removal**: Called when conversation changes or `cleanup()` is invoked
   * - **Unique ID**: Uses `messageListenerId` to ensure unique listener registration
   *
   * ## Error Handling
   *
   * - Errors in event handlers are caught and logged to prevent disrupting the UI
   * - Errors do NOT set `errorStateSignal` to avoid showing error UI for real-time events
   * - This follows Requirement 15.7: "SHALL NOT disrupt the UI for real-time listener errors"
   *
   * @private
   * @see Requirement 6.1 - Set up message listener for receiving real-time message events
   * @see Requirement 6.2 - Handle text message received
   * @see Requirement 6.3 - Handle media message received
   * @see Requirement 6.4 - Handle custom message received
   * @see Requirement 6.5 - Handle interactive message received
   * @see Requirement 6.6 - Handle message edited
   * @see Requirement 6.7 - Handle message deleted
   * @see Requirement 7.1 - Set up listener for delivery receipts
   * @see Requirement 7.2 - Set up listener for read receipts
   * @see Requirement 7.3 - Handle delivery receipt received
   * @see Requirement 7.4 - Handle read receipt received
   * @see Requirement 7.5 - Handle deliveredToAll receipt for group messages
   * @see Requirement 7.6 - Handle readByAll receipt for group messages
   * @see Requirement 7.7 - Only process receipts for messages in current conversation
   * @see Requirement 8.1 - Set up listener for reaction added events
   * @see Requirement 8.2 - Set up listener for reaction removed events
   * @see Requirement 8.3 - Handle reaction added to message
   * @see Requirement 8.4 - Handle reaction removed from message
   * @see Requirement 8.5 - Only process reaction events for messages in current conversation
   */
  private setupMessageListener(): void {
    CometChat.addMessageListener(
      this.getMessageListenerId(),
      new CometChat.MessageListener({
        /**
         * Handle incoming text messages.
         *
         * Called when a new text message is received in any conversation.
         * The message is validated and added to the list if it belongs to
         * the current conversation.
         *
         * @param textMessage - The received text message
         * @see Requirement 6.2 - Add text message to list if it belongs to current conversation
         */
        onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
          try {
            this.handleNewMessage(textMessage);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling text message received:',
              error
            );
          }
        },

        /**
         * Handle incoming media messages.
         *
         * Called when a new media message (image, video, audio, file) is received.
         * The message is validated and added to the list if it belongs to
         * the current conversation.
         *
         * @param mediaMessage - The received media message
         * @see Requirement 6.3 - Add media message to list if it belongs to current conversation
         */
        onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
          try {
            this.handleNewMessage(mediaMessage);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling media message received:',
              error
            );
          }
        },

        /**
         * Handle incoming custom messages.
         *
         * Called when a new custom message is received. Custom messages are
         * application-specific messages with custom data payloads.
         * The message is validated and added to the list if it belongs to
         * the current conversation.
         *
         * @param customMessage - The received custom message
         * @see Requirement 6.4 - Add custom message to list if it belongs to current conversation
         */
        onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
          try {
            this.handleNewMessage(customMessage);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling custom message received:',
              error
            );
          }
        },

        /**
         * Handle incoming interactive messages.
         *
         * Called when a new interactive message is received. Interactive messages
         * include forms, polls, and other interactive elements.
         * The message is validated and added to the list if it belongs to
         * the current conversation.
         *
         * @param interactiveMessage - The received interactive message
         * @see Requirement 6.5 - Add interactive message to list if it belongs to current conversation
         */
        onInteractiveMessageReceived: (interactiveMessage: CometChat.InteractiveMessage) => {
          try {
            this.handleNewMessage(interactiveMessage);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling interactive message received:',
              error
            );
          }
        },

        /**
         * Handle message edited events.
         *
         * Called when an existing message is edited. The corresponding message
         * in the list is updated with the new content if it belongs to
         * the current conversation.
         *
         * @param message - The edited message with updated content
         * @see Requirement 6.6 - Update corresponding message in the list
         */
        onMessageEdited: (message: CometChat.BaseMessage) => {
          try {
            this.handleMessageEdited(message);
          } catch (error) {
            CometChatLogger.error('MessageListService', 'Error handling message edited:', error);
          }
        },

        /**
         * Handle message deleted events.
         *
         * Called when a message is deleted. The corresponding message in the list
         * is updated with deleted status if it belongs to the current conversation.
         *
         * @param message - The deleted message with deletedAt timestamp
         * @see Requirement 6.7 - Update corresponding message in the list with deleted status
         */
        onMessageDeleted: (message: CometChat.BaseMessage) => {
          try {
            this.handleMessageDeleted(message);
          } catch (error) {
            CometChatLogger.error('MessageListService', 'Error handling message deleted:', error);
          }
        },

        /**
         * Handle delivery receipt events (1-on-1 chats).
         *
         * Called when messages are delivered to a user in a 1-on-1 conversation.
         * Updates the delivery status of the corresponding messages.
         *
         * @param messageReceipt - The delivery receipt containing message IDs and timestamp
         * @see Requirement 7.1 - Set up listener for delivery receipts
         * @see Requirement 7.3 - Update corresponding message's delivery status
         */
        onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
          try {
            this.ngZone.run(() => this.handleReceipt(messageReceipt, false));
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling messages delivered:',
              error
            );
          }
        },

        /**
         * Handle read receipt events (1-on-1 chats).
         *
         * Called when messages are read by a user in a 1-on-1 conversation.
         * Updates the read status of the corresponding messages.
         *
         * @param messageReceipt - The read receipt containing message IDs and timestamp
         * @see Requirement 7.2 - Set up listener for read receipts
         * @see Requirement 7.4 - Update corresponding message's read status
         */
        onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
          try {
            this.ngZone.run(() => this.handleReceipt(messageReceipt, false));
          } catch (error) {
            CometChatLogger.error('MessageListService', 'Error handling messages read:', error);
          }
        },

        /**
         * Handle delivered-to-all receipt events (group chats).
         *
         * Called when messages are delivered to all members in a group conversation.
         * Updates the delivery status of the corresponding messages to indicate
         * all group members have received them.
         *
         * @param messageReceipt - The delivery receipt for group messages
         * @see Requirement 7.5 - Handle deliveredToAll receipt for group messages
         */
        onMessagesDeliveredToAll: (messageReceipt: CometChat.MessageReceipt) => {
          try {
            this.ngZone.run(() => this.handleReceipt(messageReceipt, true));
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling messages delivered to all:',
              error
            );
          }
        },

        /**
         * Handle read-by-all receipt events (group chats).
         *
         * Called when messages are read by all members in a group conversation.
         * Updates the read status of the corresponding messages to indicate
         * all group members have read them.
         *
         * @param messageReceipt - The read receipt for group messages
         * @see Requirement 7.6 - Handle readByAll receipt for group messages
         */
        onMessagesReadByAll: (messageReceipt: CometChat.MessageReceipt) => {
          try {
            this.ngZone.run(() => this.handleReceipt(messageReceipt, true));
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling messages read by all:',
              error
            );
          }
        },

        /**
         * Handle reaction added events.
         *
         * Called when a reaction is added to a message. Updates the message's
         * reaction data if the message belongs to the current conversation.
         *
         * @param reactionEvent - The reaction event containing message ID and reaction data
         * @see Requirement 8.1 - Set up listener for reaction added events
         * @see Requirement 8.3 - Update message's reaction data when reaction is added
         */
        onMessageReactionAdded: (reactionEvent: CometChat.ReactionEvent) => {
          try {
            this.handleReactionEvent(reactionEvent);
          } catch (error) {
            CometChatLogger.error('MessageListService', 'Error handling reaction added:', error);
          }
        },

        /**
         * Handle reaction removed events.
         *
         * Called when a reaction is removed from a message. Updates the message's
         * reaction data if the message belongs to the current conversation.
         *
         * @param reactionEvent - The reaction event containing message ID and reaction data
         * @see Requirement 8.2 - Set up listener for reaction removed events
         * @see Requirement 8.4 - Update message's reaction data when reaction is removed
         */
        onMessageReactionRemoved: (reactionEvent: CometChat.ReactionEvent) => {
          try {
            this.handleReactionEvent(reactionEvent);
          } catch (error) {
            CometChatLogger.error('MessageListService', 'Error handling reaction removed:', error);
          }
        },
      })
    );
  }

  // ==================== Message Validation Methods ====================

  /**
   * Check if a message belongs to the current conversation context.
   *
   * This method validates whether an incoming real-time message should be processed
   * and added to the current message list. It performs the following checks:
   *
   * ## Validation Logic
   *
   * 1. **Conversation Context Check**: Ensures a conversation context is set
   *    - Returns `false` if neither `currentUser` nor `currentGroup` is set
   *
   * 2. **User Conversation Check** (when `currentUser` is set):
   *    - Message receiver type must be 'user'
   *    - Message must be between the logged-in user and `currentUser`
   *    - Checks both directions: logged-in user → currentUser AND currentUser → logged-in user
   *
   * 3. **Group Conversation Check** (when `currentGroup` is set):
   *    - Message receiver type must be 'group'
   *    - Message receiver's GUID must match `currentGroup`'s GUID
   *
   * 4. **Thread Mode Check** (when `parentMessageId` is set):
   *    - Message's `parentMessageId` must match the configured `parentMessageId`
   *    - This ensures only thread replies are shown in thread view
   *
   * ## Usage
   *
   * This method is called by all real-time message handlers to filter messages:
   * - `handleNewMessage()` - Filter new incoming messages
   * - `handleMessageEdited()` - Filter edited message events
   * - `handleMessageDeleted()` - Filter deleted message events
   *
   * @param message - The message to validate
   * @returns `true` if the message belongs to the current conversation, `false` otherwise
   *
   * @example
   * ```typescript
   * // In handleNewMessage
   * private handleNewMessage(message: CometChat.BaseMessage): void {
   *   if (!this.isMessageForCurrentConversation(message)) {
   *     return; // Ignore messages from other conversations
   *   }
   *   this.addMessage(message);
   * }
   * ```
   *
   * @private
   * @see Requirement 6.8 - Validate that received messages belong to the current user/group conversation
   * @see Requirement 6.9 - In thread mode, only process messages with matching parentMessageId
   */
  private isMessageForCurrentConversation(message: CometChat.BaseMessage): boolean {
    // No conversation context set - cannot validate
    if (!this.currentUser && !this.currentGroup) {
      return false;
    }

    const receiverType = message.getReceiverType();

    // ==================== User Conversation Validation ====================
    if (this.currentUser) {
      // Message must be for a user conversation
      if (receiverType !== CometChatUIKitConstants.MessageReceiverType.user) {
        return false;
      }

      // Get the logged-in user to check message direction
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      if (!loggedInUser) {
        return false;
      }

      const loggedInUserId = loggedInUser.getUid();
      const currentUserId = this.currentUser.getUid();

      // Get sender and receiver IDs from the message
      const sender = message.getSender();
      const senderId = sender ? sender.getUid() : '';

      // For user messages, receiver is a User object
      const receiverId = message.getReceiverId();

      // Check if message is between logged-in user and current user
      // Direction 1: Logged-in user sent to current user
      const sentByLoggedInUser =
        (!sender || senderId === loggedInUserId) && receiverId === currentUserId;
      // Direction 2: Current user sent to logged-in user
      const sentByCurrentUser =
        (!sender || senderId === currentUserId) && receiverId === loggedInUserId;

      if (!sentByLoggedInUser && !sentByCurrentUser) {
        return false;
      }
    }

    // ==================== Group Conversation Validation ====================
    if (this.currentGroup) {
      // Message must be for a group conversation
      if (receiverType !== CometChatUIKitConstants.MessageReceiverType.group) {
        return false;
      }

      // Get the receiver GUID from the message
      const receiver = message.getReceiverId();

      // Check if message is for the current group
      if (receiver != this.currentGroup.getGuid()) {
        return false;
      }
    }

    // ==================== Thread Mode Validation ====================
    // Mirrors React UIKit's isPartOfCurrentChatForSDKEvent / isPartOfCurrentChatForUIEvent pattern:
    // - In thread mode: only accept messages whose parentMessageId matches
    // - In normal mode: reject any message that has a parentMessageId (thread replies)
    if (this.parentMessageId !== null) {
      // Thread mode: only accept messages with matching parentMessageId
      const messageParentId = message.getParentMessageId();
      if (messageParentId !== this.parentMessageId) {
        return false;
      }
    } else {
      // Normal (main chat) mode: reject thread replies so they don't appear in the main list
      if (message.getParentMessageId()) {
        return false;
      }
    }

    // All validations passed - message belongs to current conversation
    return true;
  }

  // ==================== Message Event Handler Stubs ====================
  // These methods will be implemented in subsequent tasks (11.3 - 11.7)

  /**
   * Handle a new incoming message.
   *
   * This method is called by real-time message listeners when a new message is received.
   * It validates that the message belongs to the current conversation context and adds
   * it to the message list if valid.
   *
   * ## Validation Flow
   *
   * 1. **Conversation Context Check**: Validates the message belongs to the current
   *    user (1-on-1 chat) or group conversation using `isMessageForCurrentConversation()`.
   *
   * 2. **Thread Mode Check**: If in thread mode (parentMessageId is set), validates
   *    the message has a matching parentMessageId.
   *
   * 3. **Add to List**: If all validations pass, adds the message to the list via
   *    `addMessage()`, which appends it to the message arrays and updates lookup maps.
   *
   * ## Message Types Handled
   *
   * This method handles all incoming message types:
   * - Text messages (CometChat.TextMessage)
   * - Media messages (CometChat.MediaMessage) - images, audio, video, files
   * - Custom messages (CometChat.CustomMessage)
   * - Interactive messages (CometChat.InteractiveMessage)
   *
   * @param message - The new message to handle. Can be any message type that extends BaseMessage.
   *
   * @example
   * ```typescript
   * // Called from message listener
   * onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
   *   this.handleNewMessage(textMessage);
   * }
   *
   * onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
   *   this.handleNewMessage(mediaMessage);
   * }
   * ```
   *
   * @private
   * @see isMessageForCurrentConversation - Validation logic for conversation context
   * @see addMessage - Method to add message to the list
   * @see Requirement 6.2 - Handle text messages for current conversation
   * @see Requirement 6.3 - Handle media messages for current conversation
   * @see Requirement 6.4 - Handle custom messages for current conversation
   * @see Requirement 6.5 - Handle interactive messages for current conversation
   */
  private handleNewMessage(message: CometChat.BaseMessage): void {
    // Check if this is a thread reply arriving while we're in normal (non-thread) mode.
    // In that case, don't add it to the main list — instead, update the parent message's
    // reply count so the thread indicator stays current.
    // This mirrors React UIKit's isThreadOfCurrentChatForSDKEvent + updateReplyCount pattern.
    if (!this.parentMessageId && message.getParentMessageId()) {
      // Validate the thread reply belongs to the current conversation (user/group match)
      if (this.isThreadReplyForCurrentConversation(message)) {
        this.updateSentMessageReplyCount(message);
      }
      return;
    }

    // Validate message belongs to current conversation
    // This checks user/group context and thread mode (parentMessageId)
    if (!this.isMessageForCurrentConversation(message)) {
      // Message is for a different conversation - ignore it
      return;
    }

    // Add the validated message to the list
    // This appends to allMessagesSignal, messagesSignal, and updates lookup maps
    this.addMessage(message);
  }

  /**
   * Check if a thread reply belongs to the current conversation (user/group match only).
   *
   * This is used when a message with a parentMessageId arrives while the service is
   * in normal (non-thread) mode. We need to know if the thread reply is for the
   * current conversation so we can update the parent message's reply count.
   *
   * Unlike `isMessageForCurrentConversation`, this method does NOT check parentMessageId
   * matching — it only validates the user/group context.
   *
   * Mirrors React UIKit's `isThreadOfCurrentChatForSDKEvent`.
   *
   * @param message - The thread reply message to validate
   * @returns true if the message belongs to the current user/group conversation
   * @private
   */
  private isThreadReplyForCurrentConversation(message: CometChat.BaseMessage): boolean {
    if (!this.currentUser && !this.currentGroup) {
      return false;
    }

    const receiverId = message.getReceiverId();
    const senderId = message.getSender()?.getUid() || '';

    if (this.currentUser) {
      if (message.getReceiverType() !== CometChatUIKitConstants.MessageReceiverType.user) {
        return false;
      }
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      if (!loggedInUser) return false;
      const loggedInUserId = loggedInUser.getUid();
      const currentUserId = this.currentUser.getUid();
      // Message is between logged-in user and current user (either direction)
      return (
        (senderId === loggedInUserId && receiverId === currentUserId) ||
        (senderId === currentUserId && receiverId === loggedInUserId)
      );
    }

    if (this.currentGroup) {
      if (message.getReceiverType() !== CometChatUIKitConstants.MessageReceiverType.group) {
        return false;
      }
      return receiverId === this.currentGroup.getGuid();
    }

    return false;
  }

  /**
   * Handle a message edited event.
   *
   * Validates that the message belongs to the current conversation and updates
   * the corresponding message in the list. This method is called by the real-time
   * message listener when an `onMessageEdited` event is received.
   *
   * ## Validation
   *
   * Before updating, the method validates that the edited message belongs to the
   * current conversation context using `isMessageForCurrentConversation()`. This
   * ensures that:
   * - For 1-on-1 chats: The message is between the logged-in user and the current user
   * - For group chats: The message belongs to the current group
   * - For thread mode: The message has the matching parentMessageId
   *
   * ## Update Behavior
   *
   * When the message is validated, it is updated in place using `updateMessageById()`,
   * which:
   * - Updates the message in both `allMessagesSignal` and `messagesSignal` arrays
   * - Updates the `messageIdMap` for O(1) lookup
   * - Updates the `messageMuidMap` if the message has a MUID
   *
   * @param message - The edited message with updated content
   * @private
   * @see isMessageForCurrentConversation - Validation logic for conversation context
   * @see updateMessageById - Method to update message in the list
   * @see Requirement 6.6 - Update corresponding message in the list when edited
   */
  private handleMessageEdited(message: CometChat.BaseMessage): void {
    // Validate message belongs to current conversation
    // This checks user/group context and thread mode (parentMessageId)
    if (!this.isMessageForCurrentConversation(message)) {
      // Message is for a different conversation - ignore it
      return;
    }

    // Update the message in the list
    // This updates both arrays (allMessagesSignal, messagesSignal) and lookup maps
    this.updateMessageById(message.getId(), message);

    // Emit the onMessageEdited event for components to listen to
    // @see Requirement 11.4 - THE Message_List_Component SHALL emit a `messageEdited` event when a message is edited
    CometChatMessageEvents.onMessageEdited.next(message);
  }

  /**
   * Handle a message deleted event.
   *
   * Validates that the message belongs to the current conversation and marks
   * the corresponding message as deleted in the list. This method is called by
   * the real-time message listener when an `onMessageDeleted` event is received.
   *
   * ## Validation
   *
   * Before marking as deleted, the method validates that the deleted message belongs
   * to the current conversation context using `isMessageForCurrentConversation()`.
   * This ensures that:
   * - For 1-on-1 chats: The message is between the logged-in user and the current user
   * - For group chats: The message belongs to the current group
   * - For thread mode: The message has the matching parentMessageId
   *
   * ## Soft Delete Behavior
   *
   * When the message is validated, it is marked as deleted using `deleteMessage()`,
   * which performs a **soft delete**:
   * - Sets the `deletedAt` timestamp on the message
   * - Keeps the message in the list (does not remove it)
   * - The UI should display deleted messages differently (e.g., "This message was deleted")
   *
   * This is different from `removeMessage()` which completely removes the message
   * from the list (hard delete).
   *
   * @param message - The deleted message from the real-time event
   * @private
   * @see isMessageForCurrentConversation - Validation logic for conversation context
   * @see deleteMessage - Method to mark message as deleted (soft delete)
   * @see Requirement 6.7 - Update corresponding message in the list with deleted status
   */
  private handleMessageDeleted(message: CometChat.BaseMessage): void {
    // Validate message belongs to current conversation
    // This checks user/group context and thread mode (parentMessageId)
    if (!this.isMessageForCurrentConversation(message)) {
      // Message is for a different conversation - ignore it
      return;
    }

    // Mark the message as deleted in the list (soft delete)
    // This sets the deletedAt timestamp but keeps the message in the list
    // The UI should display deleted messages differently (e.g., "This message was deleted")
    this.deleteMessage(message.getId());

    // Emit the onMessageDeleted event for components to listen to
    // @see Requirement 12.4 - THE Message_List_Component SHALL emit a `messageDeleted` event when a message is deleted
    CometChatMessageEvents.onMessageDeleted.next(message);
  }

  /**
   * Handle a message receipt event (delivery or read).
   *
   * Finds the message by receipt's message ID and updates its delivery/read status.
   * This method handles both 1-on-1 and group chat receipts:
   * - For delivery receipts: Updates the message's deliveredAt timestamp
   * - For read receipts: Updates the message's readAt timestamp
   *
   * The receipt type is determined by checking which timestamp is available:
   * - If `getReadAt()` returns a value, it's a read receipt
   * - If `getDeliveredAt()` returns a value, it's a delivery receipt
   *
   * @param receipt - The message receipt containing message ID and timestamp
   * @private
   * @see Requirement 7.3 - Update corresponding message's delivery status
   * @see Requirement 7.4 - Update corresponding message's read status
   * @see Requirement 7.5 - Handle deliveredToAll receipt for group messages
   * @see Requirement 7.6 - Handle readByAll receipt for group messages
   */
  /**
   * Handle a message receipt (delivery or read).
   *
   * This method processes delivery and read receipts from the SDK's real-time listeners.
   * It updates the message's delivery or read status locally WITHOUT making additional SDK calls.
   *
   * ## How It Works
   *
   * 1. Extracts message ID from the receipt
   * 2. Finds the message in the current list using O(1) lookup
   * 3. Determines receipt type (read or delivery)
   * 4. Updates the message's status locally
   * 5. Updates the message in the list to trigger UI refresh
   *
   * ## Receipt Types
   *
   * - **Delivery Receipt**: Updates message.deliveredAt timestamp
   * - **Read Receipt**: Updates message.readAt timestamp
   * - Read receipts take precedence over delivery receipts
   *
   * ## Important Notes
   *
   * - This method does NOT make SDK calls - it only updates local state
   * - The receipt has already been sent by the SDK; this just reflects the status
   * - If the message is not found, the method returns early (expected for other conversations)
   * - Multiple receipts for the same message are safe; the latest timestamp is used
   *
   * @param receipt - The message receipt containing message ID and timestamp
   * @private
   * @see Requirement 5.1 - Update delivery status locally for delivery receipts
   * @see Requirement 5.2 - Update read status locally for read receipts
   * @see Requirement 5.5 - Do not make additional SDK calls
   * @see Requirement 6.1 - Update delivery status locally for delivery receipts
   * @see Requirement 6.2 - Update read status locally for read receipts
   * @see Requirement 6.5 - Do not make additional SDK calls
   */
  private handleReceipt(receipt: CometChat.MessageReceipt, isGroupReceipt: boolean): void {
    // For group conversations, only process group-level receipts (deliveredToAll/readByAll)
    // For 1-on-1 conversations, only process individual receipts (delivered/read)
    if (this.currentGroup && !isGroupReceipt) {
      return;
    }
    if (this.currentUser && isGroupReceipt) {
      return;
    }

    // Get the message ID from the receipt and convert to number
    const messageIdStr = receipt.getMessageId();
    const messageId = parseInt(messageIdStr, 10);

    if (isNaN(messageId)) {
      CometChatLogger.warn('MessageListService', 'Invalid message ID in receipt:', messageIdStr);
      return;
    }

    const readAt = receipt.getReadAt();
    const deliveredAt = receipt.getDeliveredAt();
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (!loggedInUser) {
      return;
    }
    const loggedInUserId = loggedInUser.getUid();

    CometChatLogger.debug('MessageListService', 'handleReceipt called', {
      messageId,
      readAt,
      deliveredAt,
      isGroupReceipt,
      messagesCount: this.allMessagesSignal().length,
    });

    // Walk through messages and update the receipt target + all preceding sender messages
    // until we hit one that already has the status set
    let needsUpdate = false;

    this.allMessagesSignal.update(current => {
      // Find the index of the receipt target message
      let targetIndex = current.findIndex(m => this.normalizeMessageId(m.getId()) === messageId);

      CometChatLogger.debug(
        'MessageListService',
        'handleReceipt targetIndex:',
        targetIndex,
        'for messageId:',
        messageId
      );

      // If target not found by exact ID, the receipt may have arrived before the
      // optimistic message was updated with its server ID. In that case, walk
      // backwards from the end and update all sender messages whose ID <= receiptMessageId
      // (or whose ID is 0/temp, meaning they're still optimistic).
      if (targetIndex === -1) {
        targetIndex = current.length - 1;
      }

      const updated = [...current];

      // Walk backwards from the target (or end of list)
      for (let i = targetIndex; i >= 0; i--) {
        const msg = updated[i];
        const sender = msg.getSender();
        const senderUid = sender ? sender.getUid() : '';

        // Only update messages sent by the logged-in user
        if (senderUid !== loggedInUserId) {
          continue;
        }

        const msgId = this.normalizeMessageId(msg.getId());

        // Skip messages with IDs higher than the receipt (they were sent after)
        // But allow messages with ID 0 (optimistic, not yet confirmed by server)
        if (msgId > messageId && msgId !== 0) {
          continue;
        }

        if (readAt) {
          // Stop if this message already has readAt set
          if (msg.getReadAt()) {
            CometChatLogger.debug(
              'MessageListService',
              'handleReceipt: msg already has readAt, breaking at index',
              i,
              'msgId:',
              msgId
            );
            break;
          }
          // Clone the message to create a new object reference.
          // Critical for OnPush change detection — the message bubble component
          // won't re-render if we mutate the same object reference in place.
          const cloned = CometChatUIKitUtility.clone(msg);
          cloned.setReadAt(readAt);
          // Also ensure deliveredAt is set (read implies delivered)
          if (!cloned.getDeliveredAt()) {
            cloned.setDeliveredAt(readAt);
          }
          updated[i] = cloned;
          // Update lookup maps with the cloned message
          const clonedId = this.normalizeMessageId(cloned.getId());
          if (clonedId) {
            this.messageIdMap.set(clonedId, cloned);
          }
          const clonedMuid = cloned.getMuid?.();
          if (clonedMuid) {
            this.messageMuidMap.set(clonedMuid, cloned);
          }
          needsUpdate = true;
          CometChatLogger.debug(
            'MessageListService',
            'handleReceipt: set readAt on msg at index',
            i,
            'msgId:',
            msgId
          );
        } else if (deliveredAt) {
          // Stop if this message already has deliveredAt set
          if (msg.getDeliveredAt()) {
            CometChatLogger.debug(
              'MessageListService',
              'handleReceipt: msg already has deliveredAt, breaking at index',
              i,
              'msgId:',
              msgId
            );
            break;
          }
          // Clone the message for OnPush change detection
          const cloned = CometChatUIKitUtility.clone(msg);
          cloned.setDeliveredAt(deliveredAt);
          updated[i] = cloned;
          // Update lookup maps with the cloned message
          const clonedId = this.normalizeMessageId(cloned.getId());
          if (clonedId) {
            this.messageIdMap.set(clonedId, cloned);
          }
          const clonedMuid = cloned.getMuid?.();
          if (clonedMuid) {
            this.messageMuidMap.set(clonedMuid, cloned);
          }
          needsUpdate = true;
          CometChatLogger.debug(
            'MessageListService',
            'handleReceipt: set deliveredAt on msg at index',
            i,
            'msgId:',
            msgId
          );
        }
      }

      CometChatLogger.debug('MessageListService', 'handleReceipt: needsUpdate =', needsUpdate);
      return needsUpdate ? updated : current;
    });

    // Mirror the same update to messagesSignal
    if (needsUpdate) {
      CometChatLogger.debug('MessageListService', 'handleReceipt: updating messagesSignal');
      this.messagesSignal.update(current => {
        let targetIndex = current.findIndex(m => this.normalizeMessageId(m.getId()) === messageId);
        if (targetIndex === -1) {
          targetIndex = current.length - 1;
        }

        const updated = [...current];

        for (let i = targetIndex; i >= 0; i--) {
          const msg = updated[i];
          const sender = msg.getSender();
          const senderUid = sender ? sender.getUid() : '';

          if (senderUid !== loggedInUserId) {
            continue;
          }

          const msgId = this.normalizeMessageId(msg.getId());
          if (msgId > messageId && msgId !== 0) {
            continue;
          }

          if (readAt) {
            if (msg.getReadAt()) {
              break;
            }
            // Use the already-cloned message from allMessagesSignal via lookup map
            // Must use the current message's ID (msgId), not the receipt's target messageId
            const cloned =
              this.messageIdMap.get(this.normalizeMessageId(msgId)) ||
              CometChatUIKitUtility.clone(msg);
            if (!cloned.getReadAt()) {
              cloned.setReadAt(readAt);
              if (!cloned.getDeliveredAt()) {
                cloned.setDeliveredAt(readAt);
              }
            }
            updated[i] = cloned;
          } else if (deliveredAt) {
            if (msg.getDeliveredAt()) {
              break;
            }
            const cloned =
              this.messageIdMap.get(this.normalizeMessageId(msg.getId())) ||
              CometChatUIKitUtility.clone(msg);
            if (!cloned.getDeliveredAt()) {
              cloned.setDeliveredAt(deliveredAt);
            }
            updated[i] = cloned;
          }
        }

        return updated;
      });
    }
  }

  /**
   * Handle a reaction event (added or removed).
   *
   * Finds the message by reaction event's message ID and updates its reactions.
   * This method is called by the real-time message listener when either
   * `onMessageReactionAdded` or `onMessageReactionRemoved` events are received.
   *
   * ## How It Works
   *
   * 1. Extracts the reaction object from the reaction event
   * 2. Gets the message ID from the reaction
   * 3. Finds the message in the current list using O(1) lookup
   * 4. Gets the updated reactions array from the message
   * 5. Updates the message's reactions using `updateMessageReactions()`
   *
   * ## Reaction Event Structure
   *
   * The `CometChat.ReactionEvent` contains:
   * - `getReaction()`: Returns the `Reaction` object with:
   *   - `getMessageId()`: The ID of the message that was reacted to
   *   - The reaction details (emoji, user who reacted, etc.)
   *
   * ## Message Reactions Update
   *
   * After a reaction is added or removed, the SDK automatically updates the
   * message's reactions array. We retrieve the updated reactions from the
   * message object and persist them using `updateMessageReactions()`.
   *
   * ## Validation
   *
   * The method validates:
   * - The reaction object exists
   * - The message ID is valid
   * - The message exists in the current list
   *
   * If any validation fails, the method returns early without making changes.
   *
   * ## Example Flow
   *
   * ```
   * User A adds 👍 reaction to message ID 12345
   *   ↓
   * SDK fires onMessageReactionAdded event
   *   ↓
   * handleReactionEvent() is called
   *   ↓
   * Extract reaction from event → Get message ID (12345)
   *   ↓
   * Find message in list → Get updated reactions from message
   *   ↓
   * updateMessageReactions(12345, updatedReactions)
   *   ↓
   * UI updates to show the new reaction
   * ```
   *
   * @param reactionEvent - The reaction event containing message ID and reaction data
   * @private
   * @see updateMessageReactions - Method to update message reactions
   * @see getMessageById - Method to find message by ID
   * @see Requirement 8.1 - Set up listener for reaction added events
   * @see Requirement 8.2 - Set up listener for reaction removed events
   * @see Requirement 8.3 - Update message's reaction data when reaction is added
   * @see Requirement 8.4 - Update message's reaction data when reaction is removed
   * @see Requirement 8.5 - Only process reaction events for messages in current conversation
   */
  private handleReactionEvent(reactionEvent: CometChat.ReactionEvent): void {
    // Step 1: Get the reaction object from the event
    // The reaction contains the message ID and reaction details
    const reaction = reactionEvent.getReaction();

    // Validate that the reaction object exists
    if (!reaction) {
      CometChatLogger.warn('MessageListService', 'handleReactionEvent: No reaction in event');
      return;
    }

    // Step 2: Get the message ID from the reaction
    const messageId = reaction.getMessageId();

    // Validate the message ID is a valid number
    if (!messageId || typeof messageId !== 'number') {
      CometChatLogger.warn('MessageListService', 'handleReactionEvent: Invalid message ID:', messageId);
      return;
    }

    // Step 3: Find the message in the list using O(1) lookup
    const message = this.getMessageById(messageId);

    // If message not found in current list, return early
    // This handles the case where the reaction is for a message in a different conversation
    if (!message) {
      // Message not in current list - this is expected for reactions on messages
      // in other conversations, so we don't log a warning
      return;
    }

    // Step 4: Get the updated reactions from the reaction event itself.
    // Previously, we read message.getReactions() from the cached message, which
    // could be stale — especially for the sender's own reactions where the SDK
    // may not have updated the cached message object yet. The ReactionEvent's
    // Reaction object may carry the updated reactions via getReactions().
    // We prefer the event data over the cached message data for accuracy.
    const eventReactions = (reaction as unknown as CometChat.ReactionEvent & { getReactions?(): CometChat.ReactionCount[] }).getReactions?.();
    const updatedReactions: CometChat.ReactionCount[] =
      eventReactions || message.getReactions() || [];

    // Step 5: Update the message's reactions in the list
    // This ensures the UI reflects the latest reaction state
    this.updateMessageReactions(messageId, updatedReactions);
  }

  // ==================== Group Listener Methods ====================

  /**
   * Set up the group listener for receiving real-time group action events.
   *
   * This method registers a CometChat.GroupListener with the SDK to receive
   * real-time notifications about group membership changes. These events are
   * displayed as action messages in the message list to keep users informed
   * about group activity.
   *
   * ## Group Events Handled
   *
   * The listener handles the following group action events:
   *
   * | Event | Description | Example Message |
   * |-------|-------------|-----------------|
   * | `onGroupMemberJoined` | A user joined the group | "John joined the group" |
   * | `onGroupMemberLeft` | A user left the group | "John left the group" |
   * | `onGroupMemberKicked` | A user was kicked from the group | "John was kicked by Admin" |
   * | `onGroupMemberBanned` | A user was banned from the group | "John was banned by Admin" |
   * | `onGroupMemberUnbanned` | A user was unbanned from the group | "John was unbanned by Admin" |
   * | `onGroupMemberScopeChanged` | A user's role was changed | "John is now a moderator" |
   * | `onMemberAddedToGroup` | A user was added to the group | "John was added by Admin" |
   *
   * ## Event Handler Parameters
   *
   * Each event handler receives different parameters from the SDK:
   *
   * - `onGroupMemberJoined(message, joinedUser, joinedGroup)`:
   *   - `message`: CometChat.Action - The action message to display
   *   - `joinedUser`: CometChat.User - The user who joined
   *   - `joinedGroup`: CometChat.Group - The group that was joined
   *
   * - `onGroupMemberLeft(message, leftUser, leftGroup)`:
   *   - `message`: CometChat.Action - The action message to display
   *   - `leftUser`: CometChat.User - The user who left
   *   - `leftGroup`: CometChat.Group - The group that was left
   *
   * - `onGroupMemberKicked(message, kickedUser, kickedBy, kickedFrom)`:
   *   - `message`: CometChat.Action - The action message to display
   *   - `kickedUser`: CometChat.User - The user who was kicked
   *   - `kickedBy`: CometChat.User - The user who performed the kick
   *   - `kickedFrom`: CometChat.Group - The group from which the user was kicked
   *
   * - `onGroupMemberBanned(message, bannedUser, bannedBy, bannedFrom)`:
   *   - `message`: CometChat.Action - The action message to display
   *   - `bannedUser`: CometChat.User - The user who was banned
   *   - `bannedBy`: CometChat.User - The user who performed the ban
   *   - `bannedFrom`: CometChat.Group - The group from which the user was banned
   *
   * - `onGroupMemberUnbanned(message, unbannedUser, unbannedBy, unbannedFrom)`:
   *   - `message`: CometChat.Action - The action message to display
   *   - `unbannedUser`: CometChat.User - The user who was unbanned
   *   - `unbannedBy`: CometChat.User - The user who performed the unban
   *   - `unbannedFrom`: CometChat.Group - The group from which the user was unbanned
   *
   * - `onGroupMemberScopeChanged(message, changedUser, newScope, oldScope, changedGroup)`:
   *   - `message`: CometChat.Action - The action message to display
   *   - `changedUser`: CometChat.User - The user whose scope was changed
   *   - `newScope`: string - The new scope/role (e.g., "admin", "moderator", "participant")
   *   - `oldScope`: string - The previous scope/role
   *   - `changedGroup`: CometChat.Group - The group where the scope was changed
   *
   * - `onMemberAddedToGroup(message, userAdded, userAddedBy, userAddedIn)`:
   *   - `message`: CometChat.Action - The action message to display
   *   - `userAdded`: CometChat.User - The user who was added
   *   - `userAddedBy`: CometChat.User - The user who added the member
   *   - `userAddedIn`: CometChat.Group - The group to which the user was added
   *
   * ## Validation
   *
   * Each event handler calls `handleGroupAction()` which validates:
   * 1. The group matches the current group conversation
   * 2. The `hideGroupActionMessages` flag is not set to true
   *
   * If validation passes, the action message is added to the message list.
   *
   * ## Error Handling
   *
   * All event handlers are wrapped in try-catch blocks to ensure that errors
   * in processing one event do not affect subsequent events or disrupt the UI.
   * Errors are logged to the console with the `[MessageListService]` prefix.
   *
   * ## Listener Lifecycle
   *
   * - **Setup**: Called when `setGroup()` is invoked to set up a group conversation
   * - **Removal**: Called via `removeGroupListener()` when:
   *   - Switching to a different conversation
   *   - Calling `cleanup()` (e.g., user logout)
   *   - Service destruction (via DestroyRef)
   *
   * @private
   * @see handleGroupAction - Method that processes group action events
   * @see removeGroupListener - Method to remove the group listener
   * @see Requirement 9.1 - Set up group listener for group action events
   * @see Requirement 9.2 - Handle member joined event
   * @see Requirement 9.3 - Handle member left event
   * @see Requirement 9.4 - Handle member kicked event
   * @see Requirement 9.5 - Handle member banned event
   * @see Requirement 9.6 - Handle member unbanned event
   * @see Requirement 9.7 - Handle member scope changed event
   * @see Requirement 9.8 - Handle member added to group event
   */
  private setupGroupListener(): void {
    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        /**
         * Handle group member joined event.
         *
         * Called when a user joins the group. The action message is added to
         * the message list to inform other group members about the new member.
         *
         * @param message - The action message describing the join event
         * @param joinedUser - The user who joined the group
         * @param joinedGroup - The group that was joined
         * @see Requirement 9.2 - Add action message when member joins the group
         */
        onGroupMemberJoined: (
          message: CometChat.Action,
          joinedUser: CometChat.User,
          joinedGroup: CometChat.Group
        ) => {
          try {
            this.handleGroupAction(message, joinedGroup);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling group member joined:',
              error
            );
          }
        },

        /**
         * Handle group member left event.
         *
         * Called when a user voluntarily leaves the group. The action message
         * is added to the message list to inform other group members.
         *
         * @param message - The action message describing the leave event
         * @param leftUser - The user who left the group
         * @param leftGroup - The group that was left
         * @see Requirement 9.3 - Add action message when member leaves the group
         */
        onGroupMemberLeft: (
          message: CometChat.Action,
          leftUser: CometChat.User,
          leftGroup: CometChat.Group
        ) => {
          try {
            this.handleGroupAction(message, leftGroup);
          } catch (error) {
            CometChatLogger.error('MessageListService', 'Error handling group member left:', error);
          }
        },

        /**
         * Handle group member kicked event.
         *
         * Called when a user is kicked from the group by an admin or moderator.
         * The action message is added to the message list to inform other
         * group members about the removal.
         *
         * @param message - The action message describing the kick event
         * @param kickedUser - The user who was kicked
         * @param kickedBy - The user who performed the kick action
         * @param kickedFrom - The group from which the user was kicked
         * @see Requirement 9.4 - Add action message when member is kicked from the group
         */
        onGroupMemberKicked: (
          message: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          try {
            this.handleGroupAction(message, kickedFrom);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling group member kicked:',
              error
            );
          }
        },

        /**
         * Handle group member banned event.
         *
         * Called when a user is banned from the group by an admin or moderator.
         * Banned users cannot rejoin the group until they are unbanned.
         * The action message is added to the message list to inform other
         * group members about the ban.
         *
         * @param message - The action message describing the ban event
         * @param bannedUser - The user who was banned
         * @param bannedBy - The user who performed the ban action
         * @param bannedFrom - The group from which the user was banned
         * @see Requirement 9.5 - Add action message when member is banned from the group
         */
        onGroupMemberBanned: (
          message: CometChat.Action,
          bannedUser: CometChat.User,
          bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          try {
            this.handleGroupAction(message, bannedFrom);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling group member banned:',
              error
            );
          }
        },

        /**
         * Handle group member unbanned event.
         *
         * Called when a previously banned user is unbanned from the group.
         * The unbanned user can now rejoin the group.
         * The action message is added to the message list to inform other
         * group members about the unban.
         *
         * @param message - The action message describing the unban event
         * @param unbannedUser - The user who was unbanned
         * @param unbannedBy - The user who performed the unban action
         * @param unbannedFrom - The group from which the user was unbanned
         * @see Requirement 9.6 - Add action message when member is unbanned from the group
         */
        onGroupMemberUnbanned: (
          message: CometChat.Action,
          unbannedUser: CometChat.User,
          unbannedBy: CometChat.User,
          unbannedFrom: CometChat.Group
        ) => {
          try {
            this.handleGroupAction(message, unbannedFrom);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling group member unbanned:',
              error
            );
          }
        },

        /**
         * Handle group member scope changed event.
         *
         * Called when a user's role/scope in the group is changed (e.g., from
         * participant to moderator, or from moderator to admin).
         * The action message is added to the message list to inform other
         * group members about the role change.
         *
         * @param message - The action message describing the scope change event
         * @param changedUser - The user whose scope was changed
         * @param newScope - The new scope/role (e.g., "admin", "moderator", "participant")
         * @param oldScope - The previous scope/role
         * @param changedGroup - The group where the scope was changed
         * @see Requirement 9.7 - Add action message when member's scope is changed
         */
        onGroupMemberScopeChanged: (
          message: CometChat.Action,
          changedUser: CometChat.User,
          newScope: string,
          oldScope: string,
          changedGroup: CometChat.Group
        ) => {
          try {
            this.handleGroupAction(message, changedGroup);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling group member scope changed:',
              error
            );
          }
        },

        /**
         * Handle member added to group event.
         *
         * Called when a user is added to the group by an admin or moderator.
         * This is different from `onGroupMemberJoined` which is triggered when
         * a user joins voluntarily.
         * The action message is added to the message list to inform other
         * group members about the new addition.
         *
         * @param message - The action message describing the add event
         * @param userAdded - The user who was added to the group
         * @param userAddedBy - The user who added the member
         * @param userAddedIn - The group to which the user was added
         * @see Requirement 9.8 - Add action message when member is added to the group
         */
        onMemberAddedToGroup: (
          message: CometChat.Action,
          userAdded: CometChat.User,
          userAddedBy: CometChat.User,
          userAddedIn: CometChat.Group
        ) => {
          try {
            this.handleGroupAction(message, userAddedIn);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling member added to group:',
              error
            );
          }
        },
      })
    );
  }

  /**
   * Handle a group action event.
   *
   * This method is called by all group listener event handlers to process
   * group action messages. It validates that the action belongs to the current
   * group conversation and adds the action message to the message list if
   * group action messages are not hidden.
   *
   * ## Validation Flow
   *
   * 1. **Group Context Check**: Validates that a group conversation is currently
   *    active (`currentGroup` is set). If not, the action is ignored since
   *    group actions are only relevant in group conversations.
   *
   * 2. **Group Match Check**: Validates that the action's group matches the
   *    current group by comparing GUIDs. This ensures actions from other
   *    groups are not displayed in the current conversation.
   *
   * 3. **Hide Flag Check**: Checks the `hideGroupActionMessages` flag. If set
   *    to `true`, the action message is not added to the list. This allows
   *    users to have a cleaner conversation view without action messages.
   *
   * ## Action Message Display
   *
   * If all validations pass, the action message is added to the message list
   * using `addMessage()`. The UI should display action messages differently
   * from regular messages (e.g., centered text, different styling).
   *
   * ## Example Action Messages
   *
   * - "John joined the group"
   * - "Jane left the group"
   * - "Admin kicked John from the group"
   * - "Admin banned Jane from the group"
   * - "Admin unbanned John from the group"
   * - "Admin changed Jane's role to moderator"
   * - "Admin added John to the group"
   *
   * @param message - The action message from the group event
   * @param group - The group where the action occurred
   *
   * @private
   * @see addMessage - Method to add message to the list
   * @see Requirement 9.9 - Only process group actions for the current group conversation
   * @see Requirement 9.10 - Do not add group action messages when hideGroupActionMessages is true
   */
  private handleGroupAction(message: CometChat.Action, group: CometChat.Group): void {
    // Step 1: Validate that we have a current group context
    // Group actions are only relevant in group conversations
    if (!this.currentGroup) {
      // No group conversation active - ignore the action
      return;
    }

    // Step 2: Validate that the action is for the current group
    // Compare GUIDs to ensure the action belongs to the current conversation
    if (group.getGuid() !== this.currentGroup.getGuid()) {
      // Action is for a different group - ignore it
      return;
    }

    // Step 3: Check if group action messages should be hidden
    // This allows users to have a cleaner conversation view
    if (this.hideGroupActionMessages) {
      // Group action messages are hidden - do not add to list
      return;
    }

    // Step 4: Add the action message to the message list
    // The UI should display action messages with appropriate styling
    this.addMessage(message);
  }

  // ==================== Call Listener Methods ====================

  /**
   * Set up the call listener for receiving call-related events.
   *
   * This method registers a CometChat.CallListener with the SDK to receive
   * real-time call events. Call events include incoming calls, call cancellations,
   * call rejections, call acceptances, and call ended messages.
   *
   * ## Events Handled
   *
   * The listener handles the following call events:
   *
   * - **onIncomingCallReceived**: Called when an incoming call is received.
   *   The call message is added to the message list to show call history.
   *
   * - **onIncomingCallCancelled**: Called when an incoming call is cancelled
   *   by the caller before being answered. The call message is updated in the list.
   *
   * - **onOutgoingCallRejected**: Called when an outgoing call is rejected
   *   by the recipient. The call message is updated in the list.
   *
   * - **onOutgoingCallAccepted**: Called when an outgoing call is accepted
   *   by the recipient. The call message is updated in the list.
   *
   * - **onCallEndedMessageReceived**: Called when a call ends and a call ended
   *   message is received. The call ended message is added to the list.
   *
   * ## Conversation Validation
   *
   * Each event handler validates that the call belongs to the current conversation
   * before processing. This ensures that call events from other conversations
   * are not displayed in the current message list.
   *
   * ## Error Handling
   *
   * All event handlers are wrapped in try-catch blocks to ensure that errors
   * in processing one event do not affect subsequent events or disrupt the UI.
   * Errors are logged to the console with the `[MessageListService]` prefix.
   *
   * ## Listener Lifecycle
   *
   * - **Setup**: Called when `setUser()` or `setGroup()` is invoked to set up a conversation
   * - **Removal**: Called via `removeCallListener()` when:
   *   - Switching to a different conversation
   *   - Calling `cleanup()` (e.g., user logout)
   *   - Service destruction (via DestroyRef)
   *
   * @private
   * @see handleCallAction - Method that processes call events
   * @see removeCallListener - Method to remove the call listener
   * @see Requirement 10.1 - Set up call listener when calling is enabled
   * @see Requirement 10.2 - Handle incoming call received event
   * @see Requirement 10.3 - Handle incoming call cancelled event
   * @see Requirement 10.4 - Handle outgoing call rejected event
   * @see Requirement 10.5 - Handle outgoing call accepted event
   * @see Requirement 10.6 - Handle call ended message received event
   */
  private setupCallListener(): void {
    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        /**
         * Handle incoming call received event.
         *
         * Called when an incoming call is received from another user.
         * The call message is added to the message list to show call history.
         *
         * @param call - The incoming call object
         * @see Requirement 10.2 - Add call message when incoming call is received
         */
        onIncomingCallReceived: (call: CometChat.Call) => {
          try {
            this.handleCallAction(call);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling incoming call received:',
              error
            );
          }
        },

        /**
         * Handle incoming call cancelled event.
         *
         * Called when an incoming call is cancelled by the caller before
         * being answered. This typically happens when the caller hangs up
         * before the recipient answers.
         *
         * @param call - The cancelled call object
         * @see Requirement 10.3 - Update call message when incoming call is cancelled
         */
        onIncomingCallCancelled: (call: CometChat.Call) => {
          try {
            this.handleCallAction(call);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling incoming call cancelled:',
              error
            );
          }
        },

        /**
         * Handle outgoing call rejected event.
         *
         * Called when an outgoing call is rejected by the recipient.
         * This happens when the recipient declines the call.
         *
         * @param call - The rejected call object
         * @see Requirement 10.4 - Update call message when outgoing call is rejected
         */
        onOutgoingCallRejected: (call: CometChat.Call) => {
          try {
            this.handleCallAction(call);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling outgoing call rejected:',
              error
            );
          }
        },

        /**
         * Handle outgoing call accepted event.
         *
         * Called when an outgoing call is accepted by the recipient.
         * This happens when the recipient answers the call.
         *
         * @param call - The accepted call object
         * @see Requirement 10.5 - Update call message when outgoing call is accepted
         */
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          try {
            this.handleCallAction(call);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling outgoing call accepted:',
              error
            );
          }
        },

        /**
         * Handle call ended message received event.
         *
         * Called when a call ends and a call ended message is received.
         * This message contains information about the call duration and
         * how the call ended (completed, missed, rejected, etc.).
         *
         * @param call - The call ended message object
         * @see Requirement 10.6 - Add call ended message to the list
         */
        onCallEndedMessageReceived: (call: CometChat.Call) => {
          try {
            this.handleCallAction(call);
          } catch (error) {
            CometChatLogger.error(
              'MessageListService',
              'Error handling call ended message:',
              error
            );
          }
        },
      })
    );
  }

  /**
   * Handle a call action event.
   *
   * This method is called by all call listener event handlers to process
   * call messages. It validates that the call belongs to the current
   * conversation and adds or updates the call message in the message list.
   *
   * ## Validation Flow
   *
   * 1. **Conversation Context Check**: Validates that a conversation is currently
   *    active (`currentUser` or `currentGroup` is set). If not, the call is
   *    ignored since we need a conversation context to display call messages.
   *
   * 2. **Conversation Match Check**: Validates that the call belongs to the
   *    current conversation by checking:
   *    - For 1-on-1 calls: The call's receiver or sender UID matches the current user's UID
   *    - For group calls: The call's receiver GUID matches the current group's GUID
   *
   * ## Call Message Handling
   *
   * If validation passes, the call message is processed as follows:
   *
   * - **New Call**: If the call message doesn't exist in the list (by ID),
   *   it is added to the message list using `addMessage()`.
   *
   * - **Existing Call**: If the call message already exists in the list,
   *   it is updated using `updateMessageById()` to reflect the latest
   *   call status (e.g., cancelled, rejected, accepted, ended).
   *
   * ## Example Call Messages
   *
   * - "Incoming audio call from John"
   * - "Missed video call from Jane"
   * - "Audio call with John - 5:32"
   * - "Video call rejected"
   *
   * @param call - The call object from the call event
   *
   * @private
   * @see addMessage - Method to add message to the list
   * @see updateMessageById - Method to update existing message
   * @see Requirement 10.7 - Only process call events for the current conversation
   */
  private handleCallAction(call: CometChat.Call): void {
    // Step 1: Validate that we have a conversation context
    // Call messages need a conversation context to be displayed
    if (!this.currentUser && !this.currentGroup) {
      // No conversation active - ignore the call
      return;
    }

    // Step 2: Validate that the call belongs to the current conversation
    const receiverType = call.getReceiverType();
    const receiver = call.getReceiver();
    const sender = call.getSender();

    if (this.currentUser) {
      // For 1-on-1 conversations, check if the call involves the current user
      const currentUid = this.currentUser.getUid();

      // The call should be either:
      // - From the current user (sender matches)
      // - To the current user (receiver matches)
      const receiverUid =
        receiverType === CometChatUIKitConstants.MessageReceiverType.user
          ? (receiver as CometChat.User)?.getUid?.()
          : null;
      const senderUid = sender?.getUid?.();

      // Check if this call is part of the current 1-on-1 conversation
      const isCallForCurrentConversation =
        receiverUid === currentUid || (senderUid === currentUid && receiverUid !== null);

      if (!isCallForCurrentConversation) {
        // Call is not for the current conversation - ignore it
        return;
      }

      // Additional check: ensure the other party in the call matches the current user
      // For incoming calls, sender should be the current user we're chatting with
      // For outgoing calls, receiver should be the current user we're chatting with
      const otherPartyUid = senderUid === currentUid ? receiverUid : senderUid;
      if (otherPartyUid !== currentUid && receiverUid !== currentUid && senderUid !== currentUid) {
        // The call doesn't involve the current conversation partner
        return;
      }
    } else if (this.currentGroup) {
      // For group conversations, check if the call is for the current group
      if (receiverType !== CometChatUIKitConstants.MessageReceiverType.group) {
        // Not a group call - ignore it
        return;
      }

      const receiverGuid = (receiver as CometChat.Group)?.getGuid?.();
      if (receiverGuid !== this.currentGroup.getGuid()) {
        // Call is for a different group - ignore it
        return;
      }
    }

    // Step 3: Add or update the call message in the list
    const existingMessage = this.getMessageById(call.getId());

    if (existingMessage) {
      // Call message already exists - update it with the latest status
      this.updateMessageById(call.getId(), call);
    } else {
      // New call message - add it to the list
      this.addMessage(call);
    }
  }

  // ==================== Connection Listener Methods ====================

  /**
   * Set up the connection listener for monitoring WebSocket connection state.
   *
   * This method registers a CometChat.ConnectionListener with the SDK to receive
   * notifications about connection state changes. It handles:
   *
   * - **onConnected**: Called when the WebSocket connection is established or
   *   re-established after a disconnection. Updates the connection status signal
   *   and triggers reconnection handling to fetch any missed messages.
   *
   * - **onDisconnected**: Called when the WebSocket connection is lost. Updates
   *   the connection status signal to allow the UI to show a disconnection indicator.
   *
   * ## Connection State Management
   *
   * The connection state is tracked via `connectionStatusSignal` which can be:
   * - `'connected'`: WebSocket connection is active
   * - `'disconnected'`: WebSocket connection is lost
   *
   * ## Reconnection Handling
   *
   * When the connection is re-established after a disconnection, the service
   * automatically fetches any messages that may have been missed during the
   * disconnection period. This ensures the message list stays in sync with
   * the server state.
   *
   * ## Listener Lifecycle
   *
   * - **Setup**: Called when a conversation context is set (setUser/setGroup)
   * - **Removal**: Called during cleanup, conversation switching, or service destruction
   *
   * @private
   * @see Requirement 11.1 - Set up connection listener for monitoring WebSocket connection state
   * @see Requirement 11.2 - Update connection status signal when connection is established
   * @see Requirement 11.3 - Update connection status signal when connection is disconnected
   */
  private setupConnectionListener(): void {
    try {
      // Remove any existing connection listener before setting up a new one
      CometChat.removeConnectionListener(this.connectionListenerId);

      CometChat.addConnectionListener(
        this.connectionListenerId,
        new CometChat.ConnectionListener({
          /**
           * Handle connection established event.
           *
           * Called when the WebSocket connection is established or re-established.
           * Updates the connection status and triggers reconnection handling to
           * fetch any missed messages.
           *
           * @see Requirement 11.2 - Update connection status signal when connected
           * @see Requirement 11.4 - Fetch missed messages on reconnection
           */
          onConnected: () => {
            try {
              // Update connection status to connected
              this.connectionStatusSignal.set('connected');

              // Handle reconnection - fetch any missed messages
              this.handleReconnection();
            } catch (error) {
              CometChatLogger.error(
                'MessageListService',
                'Error handling connection established:',
                error
              );
            }
          },

          /**
           * Handle connection disconnected event.
           *
           * Called when the WebSocket connection is lost. Updates the connection
           * status to allow the UI to show a disconnection indicator.
           *
           * @see Requirement 11.3 - Update connection status signal when disconnected
           */
          onDisconnected: () => {
            try {
              // Update connection status to disconnected
              this.connectionStatusSignal.set('disconnected');
            } catch (error) {
              CometChatLogger.error(
                'MessageListService',
                'Error handling connection disconnected:',
                error
              );
            }
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error setting up connection listener:', error);
    }
  }

  /**
   * Handle reconnection after a connection interruption.
   *
   * This method is called when the WebSocket connection is re-established after
   * being disconnected. It fetches any messages that may have been missed during
   * the disconnection period to ensure the message list stays in sync with the
   * server state.
   *
   * ## Reconnection Flow
   *
   * 1. **Context Check**: Verifies that a conversation context is active
   *    (currentUser or currentGroup is set). If not, reconnection handling
   *    is skipped since there's no conversation to sync.
   *
   * 2. **Message Check**: Checks if there are existing messages in the list
   *    by looking at the `nextMessageIdSignal`. If no messages exist (value is 0),
   *    reconnection handling is skipped since there's nothing to sync from.
   *
   * 3. **Fetch Missed Messages**: Uses `fetchNextMessages()` to fetch any messages
   *    that arrived after the last known message (tracked by `nextMessageIdSignal`).
   *    The `fetchNextMessages()` method already handles:
   *    - Appending new messages to the existing list
   *    - Updating the `nextMessageIdSignal` with the newest message ID
   *    - Adding messages to the lookup maps (messageIdMap, messageMuidMap)
   *    - Deduplication (messages are appended, not duplicated)
   *
   * ## Error Handling
   *
   * Errors during reconnection handling are logged but do not propagate to the UI.
   * This ensures that connection recovery doesn't disrupt the user experience.
   * The user can manually refresh if needed.
   *
   * ## Important Notes
   *
   * - This method is called automatically by the connection listener's onConnected handler
   * - The `fetchNextMessages()` method handles all the complexity of fetching and merging
   * - Messages are fetched using the existing `nextMessagesRequest` which is already
   *   configured for the current conversation context
   *
   * @private
   * @see Requirement 11.4 - Fetch missed messages after reconnection
   * @see Requirement 11.5 - Use nextMessageIdSignal to fetch messages after last known message
   * @see Requirement 11.6 - Merge fetched messages with existing messages without duplicates
   */
  private async handleReconnection(): Promise<void> {
    try {
      // Step 1: Check if we have a conversation context
      if (!this.currentUser && !this.currentGroup) {
        // No conversation active - nothing to sync
        return;
      }

      // Step 2: Check if we have existing messages to sync from
      const lastMessageId = this.nextMessageIdSignal();
      if (lastMessageId === 0) {
        // No messages fetched yet - nothing to sync from
        // The initial fetch will happen when the conversation is set up
        return;
      }

      // Step 3: Rebuild the next messages request to fetch from the last known message
      // This ensures we fetch messages after the last message we have
      this.nextMessagesRequest = this.buildNextMessagesRequest(lastMessageId);

      // Step 4: Fetch any missed messages
      // fetchNextMessages() handles:
      // - Appending messages to the list
      // - Updating nextMessageIdSignal
      // - Adding to lookup maps
      // - Deduplication (messages are appended, existing ones are not duplicated)
      const hasMore = await this.fetchNextMessages();

      // Log reconnection activity for debugging
      if (hasMore) {
        CometChatLogger.debug(
          'MessageListService',
          'Reconnection: Fetched missed messages, more available'
        );
      } else {
        CometChatLogger.debug(
          'MessageListService',
          'Reconnection: Fetched missed messages, caught up'
        );
      }
    } catch (error) {
      // Log but don't propagate - reconnection errors shouldn't disrupt the UI
      CometChatLogger.error('MessageListService', 'Error handling reconnection:', error);
    }
  }

  // ==================== Typing Indicator Handler Methods ====================

  /**
   * Handle a typing started event from the SDK.
   *
   * This method is called when a user starts typing in a conversation. It validates
   * the typing indicator, filters out the logged-in user's own typing, and manages
   * the typing indicator state with automatic timeout cleanup.
   *
   * ## Validation Flow
   *
   * 1. **Logged-in User Filter**: Filters out typing indicators from the logged-in user.
   *    Users should not see their own typing indicator.
   *
   * 2. **Conversation Context Check**: Validates the typing indicator belongs to the
   *    current conversation (user or group).
   *
   * 3. **Timeout Management**: Clears any existing timeout for this user and sets
   *    a new timeout to auto-clear the indicator after TYPING_INDICATOR_TIMEOUT (5 seconds).
   *
   * 4. **State Update**: Adds the typing indicator to the typingUsersSignal map.
   *
   * ## Timeout Behavior
   *
   * Each typing indicator is automatically removed after 5 seconds if no new typing
   * event is received for that user. This ensures stale typing indicators are cleaned
   * up even if the typing ended event is not received (e.g., due to network issues).
   *
   * @param indicator - The typing indicator from the SDK containing sender and receiver info
   *
   * @example
   * ```typescript
   * // Called from message listener
   * onTypingStarted: (indicator: CometChat.TypingIndicator) => {
   *   this.handleTypingStarted(indicator);
   * }
   * ```
   *
   * @see Requirement 1.5 - Auto-hide after timeout (default 5 seconds)
   * @see Requirement 1.7 - Filter out logged-in user's own typing
   * @see Requirement 1.8 - Listen for typing indicator events from SDK
   */
  handleTypingStarted(indicator: CometChat.TypingIndicator): void {
    try {
      // Step 1: Get the logged-in user to filter out own typing
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      if (!loggedInUser) {
        // No logged-in user - cannot process typing indicator
        return;
      }

      // Step 2: Get the sender of the typing indicator
      const sender = indicator.getSender();
      if (!sender) {
        // No sender information - cannot process
        return;
      }

      const senderUid = sender.getUid();

      // Step 3: Filter out logged-in user's own typing (Requirement 1.7)
      if (senderUid === loggedInUser.getUid()) {
        // Don't show typing indicator for the logged-in user's own typing
        return;
      }

      // Step 4: Validate typing indicator belongs to current conversation
      if (!this.isTypingIndicatorForCurrentConversation(indicator)) {
        // Typing indicator is for a different conversation - ignore
        return;
      }

      // Step 5: Clear any existing timeout for this user
      const existingTimeout = this.typingTimeoutsMap.get(senderUid);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.typingTimeoutsMap.delete(senderUid);
      }

      // Step 6: Add the typing indicator to the signal
      const currentTypingUsers = new Map(this.typingUsersSignal());
      currentTypingUsers.set(senderUid, indicator);
      this.typingUsersSignal.set(currentTypingUsers);

      // Step 7: Set a new timeout to auto-clear after TYPING_INDICATOR_TIMEOUT (Requirement 1.5)
      const timeoutId = setTimeout(() => {
        this.clearTypingIndicator(senderUid);
      }, this.TYPING_INDICATOR_TIMEOUT);

      this.typingTimeoutsMap.set(senderUid, timeoutId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error handling typing started:', error);
    }
  }

  /**
   * Handle a typing ended event from the SDK.
   *
   * This method is called when a user stops typing in a conversation. It clears
   * the typing indicator and any associated timeout for the user.
   *
   * ## Cleanup Flow
   *
   * 1. **Timeout Cleanup**: Clears any pending timeout for this user to prevent
   *    the timeout callback from firing after the indicator is already removed.
   *
   * 2. **State Update**: Removes the typing indicator from the typingUsersSignal map.
   *
   * @param indicator - The typing indicator from the SDK containing sender info
   *
   * @example
   * ```typescript
   * // Called from message listener
   * onTypingEnded: (indicator: CometChat.TypingIndicator) => {
   *   this.handleTypingEnded(indicator);
   * }
   * ```
   *
   * @see Requirement 1.8 - Listen for typing indicator events from SDK
   */
  handleTypingEnded(indicator: CometChat.TypingIndicator): void {
    try {
      // Step 1: Get the sender of the typing indicator
      const sender = indicator.getSender();
      if (!sender) {
        // No sender information - cannot process
        return;
      }

      const senderUid = sender.getUid();

      // Step 2: Clear the typing indicator for this user
      this.clearTypingIndicator(senderUid);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error handling typing ended:', error);
    }
  }

  /**
   * Clear a typing indicator for a specific user.
   *
   * This is a helper method that handles the cleanup of a typing indicator,
   * including clearing the timeout and removing from the signal. It is called
   * by both `handleTypingEnded()` and the auto-clear timeout.
   *
   * @param userUid - The UID of the user whose typing indicator should be cleared
   * @private
   */
  private clearTypingIndicator(userUid: string): void {
    // Step 1: Clear any existing timeout for this user
    const existingTimeout = this.typingTimeoutsMap.get(userUid);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeoutsMap.delete(userUid);
    }

    // Step 2: Remove the typing indicator from the signal
    const currentTypingUsers = new Map(this.typingUsersSignal());
    if (currentTypingUsers.has(userUid)) {
      currentTypingUsers.delete(userUid);
      this.typingUsersSignal.set(currentTypingUsers);
    }
  }

  /**
   * Check if a typing indicator belongs to the current conversation context.
   *
   * This method validates whether a typing indicator should be processed based
   * on the current conversation context (user or group).
   *
   * ## Validation Logic
   *
   * 1. **Conversation Context Check**: Ensures a conversation context is set
   *    - Returns `false` if neither `currentUser` nor `currentGroup` is set
   *
   * 2. **User Conversation Check** (when `currentUser` is set):
   *    - Typing indicator receiver type must be 'user'
   *    - Typing indicator must be from the current user (sender UID matches currentUser UID)
   *
   * 3. **Group Conversation Check** (when `currentGroup` is set):
   *    - Typing indicator receiver type must be 'group'
   *    - Typing indicator receiver ID must match currentGroup's GUID
   *
   * @param indicator - The typing indicator to validate
   * @returns `true` if the indicator belongs to the current conversation, `false` otherwise
   * @private
   */
  private isTypingIndicatorForCurrentConversation(indicator: CometChat.TypingIndicator): boolean {
    // No conversation context set - cannot validate
    if (!this.currentUser && !this.currentGroup) {
      return false;
    }

    const receiverType = indicator.getReceiverType();
    const receiverId = indicator.getReceiverId();

    // ==================== User Conversation Validation ====================
    if (this.currentUser) {
      // Typing indicator must be for a user conversation
      if (receiverType !== CometChatUIKitConstants.MessageReceiverType.user) {
        return false;
      }

      // Get the sender of the typing indicator
      const sender = indicator.getSender();
      if (!sender) {
        return false;
      }

      // The typing indicator should be from the current user we're chatting with
      // In a 1-on-1 chat, we receive typing indicators from the other user
      if (sender.getUid() !== this.currentUser.getUid()) {
        return false;
      }
    }

    // ==================== Group Conversation Validation ====================
    if (this.currentGroup) {
      // Typing indicator must be for a group conversation
      if (receiverType !== CometChatUIKitConstants.MessageReceiverType.group) {
        return false;
      }

      // Check if typing indicator is for the current group
      if (receiverId !== this.currentGroup.getGuid()) {
        return false;
      }
    }

    // All validations passed - typing indicator belongs to current conversation
    return true;
  }

  // ==================== Translation Cache ====================

  /**
   * Cache for translated messages.
   * Key format: `${messageId}_${language}` (e.g., "12345_es")
   * Value: The translated text string
   *
   * This cache prevents repeated API calls for the same message/language combination.
   * The cache is cleared when `cleanup()` or `resetState()` is called.
   *
   * @private
   * @see Requirement 14.4 - Cache translated messages to avoid repeated API calls
   */
  private translationCache = new Map<string, string>();

  // ==================== Translation Operations ====================

  /**
   * Translate a message to the specified language.
   *
   * This method translates a text message using the CometChat translation API.
   * It caches translated messages to avoid repeated API calls for the same
   * message/language combination.
   *
   * ## How It Works
   *
   * 1. **Cache Check**: First checks if the translation is already cached
   * 2. **Validation**: Ensures the message is a text message that can be translated
   * 3. **API Call**: Calls `CometChat.callExtension` with the translation extension
   * 4. **Cache Storage**: Stores the translated text in the cache
   * 5. **Return**: Returns the translated text
   *
   * ## Cache Key Format
   *
   * The cache key is formatted as `${messageId}_${language}` to uniquely identify
   * each message/language combination. For example: "12345_es" for message ID 12345
   * translated to Spanish.
   *
   * ## Supported Languages
   *
   * The translation API supports various language codes (e.g., "en", "es", "fr", "de").
   * The language parameter should be a valid ISO 639-1 language code.
   *
   * ## Error Handling
   *
   * - Errors are logged to the console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The error is re-thrown for the caller to handle if needed
   *
   * ## Example Usage
   *
   * ```typescript
   * // Translate a message to Spanish
   * try {
   *   const translatedText = await this.messageListService.translateMessage(message, 'es');
   *   console.log('Translated text:', translatedText);
   * } catch (error) {
   *   console.error('Failed to translate message:', error);
   * }
   *
   * // Translate using user's preferred language
   * const userLanguage = navigator.language.split('-')[0]; // e.g., "en" from "en-US"
   * const translatedText = await this.messageListService.translateMessage(message, userLanguage);
   * ```
   *
   * @param message - The message to translate (must be a text message)
   * @param language - The target language code (e.g., "en", "es", "fr", "de")
   * @returns A Promise that resolves with the translated text
   * @throws Error if the message is not found, not a text message, or if the API call fails
   *
   * @see Requirement 14.2 - WHEN translate is clicked, THE Message_List_Component SHALL call the translation API
   * @see Requirement 14.4 - THE Message_List_Component SHALL cache translated messages to avoid repeated API calls
   */
  async translateMessage(message: CometChat.BaseMessage, language: string): Promise<string> {
    const messageId = message.getId();

    // Step 1: Check cache first
    const cacheKey = `${messageId}_${language}`;
    const cachedTranslation = this.translationCache.get(cacheKey);

    if (cachedTranslation) {
      return cachedTranslation;
    }

    // Step 2: Validate message exists in the list
    const existingMessage = this.messageIdMap.get(this.normalizeMessageId(messageId));

    if (!existingMessage) {
      const error = new Error(
        `[MessageListService] translateMessage: Message with ID ${messageId} not found`
      );
      CometChatLogger.error('MessageListService', error.message);
      throw error;
    }

    // Step 3: Validate message is a text message
    if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) {
      const error = new Error(
        `[MessageListService] translateMessage: Only text messages can be translated`
      );
      CometChatLogger.error('MessageListService', error.message);
      throw error;
    }

    try {
      // Step 4: Call the translation API
      const textMessage = message as CometChat.TextMessage;
      const originalText = textMessage.getText();

      // Call CometChat's message translation extension
      const response = (await CometChat.callExtension(
        'message-translation',
        'POST',
        'v2/translate',
        {
          msgId: messageId,
          text: originalText,
          languages: [language],
        }
      )) as { translations: { language_translated: string; message_translated: string }[] };

      // Step 5: Extract translated text from response
      const translations = response?.translations || [];
      const translation = translations.find(t => t.language_translated === language);

      if (!translation) {
        throw new Error(`Translation for language '${language}' not found in response`);
      }

      const translatedText = translation.message_translated;

      // Step 6: Cache the translation
      this.translationCache.set(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      // Log error for debugging
      CometChatLogger.error(
        'MessageListService',
        'translateMessage: Failed to translate message',
        error
      );

      // Note: Translate errors should NOT set errorStateSignal to avoid replacing
      // the message list with the full error state UI.

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }

      // Return empty string instead of propagating error
      return '';
    }
  }

  /**
   * Get a cached translation for a message.
   *
   * This method retrieves a previously cached translation without making an API call.
   * It is useful for checking if a translation exists before displaying UI elements.
   *
   * @param messageId - The server-assigned ID of the message
   * @param language - The target language code
   * @returns The cached translated text, or `undefined` if not cached
   *
   * @see Requirement 14.4 - Cache translated messages to avoid repeated API calls
   */
  getCachedTranslation(messageId: number, language: string): string | undefined {
    const cacheKey = `${messageId}_${language}`;
    return this.translationCache.get(cacheKey);
  }

  /**
   * Clear the translation cache.
   *
   * This method clears all cached translations. It is called automatically
   * when `cleanup()` or `resetState()` is called.
   *
   * @see Requirement 14.4 - Cache translated messages to avoid repeated API calls
   */
  clearTranslationCache(): void {
    this.translationCache.clear();
  }

  // ==================== Message Moderation Methods ====================

  /**
   * Flag/report a message for moderation.
   *
   * This method calls the CometChat SDK's message moderation extension to flag
   * a message as inappropriate. The flagged message will be reviewed by moderators.
   *
   * ## Behavior
   *
   * 1. **Validation**: Ensures the message exists in the current list
   * 2. **API Call**: Calls `CometChat.callExtension` with the moderation extension
   * 3. **Return**: Returns a Promise that resolves when the flag is successful
   *
   * ## Error Handling
   *
   * - Errors are logged to the console with `[MessageListService]` prefix
   * - If an `errorCallback` is set, it is invoked with the error
   * - The error is re-thrown for the caller to handle if needed
   *
   * ## Example Usage
   *
   * ```typescript
   * // Flag a message with a remark
   * try {
   *   await this.messageListService.flagMessage(message, 'This message contains spam');
   *   console.log('Message flagged successfully');
   * } catch (error) {
   *   console.error('Failed to flag message:', error);
   * }
   *
   * // Flag a message without a remark
   * await this.messageListService.flagMessage(message);
   * ```
   *
   * @param message - The message to flag (must exist in the current list)
   * @param remark - Optional remark explaining why the message is being flagged
   * @returns A Promise that resolves when the flag is successful
   * @throws Error if the message is not found or if the API call fails
   *
   * @see Requirement 9.5 - THE Message_List_Component SHALL call the SDK's flag message API
   */
  async flagMessage(message: CometChat.BaseMessage, remark?: string): Promise<void> {
    const messageId = message.getId();

    // Step 1: Validate message exists in the list
    const existingMessage = this.messageIdMap.get(this.normalizeMessageId(messageId));

    if (!existingMessage) {
      const error = new Error(
        `[MessageListService] flagMessage: Message with ID ${messageId} not found`
      );
      CometChatLogger.error('MessageListService', error.message);
      throw error;
    }

    try {
      // Step 2: Call the moderation extension API
      // The CometChat moderation extension uses the 'report-message' endpoint
      await CometChat.callExtension('moderation', 'POST', 'v1/report', {
        msgId: messageId,
        reason: remark || '',
      });

      // Success - the message has been flagged
    } catch (error) {
      // Log error for debugging
      CometChatLogger.error('MessageListService', 'flagMessage: Failed to flag message', error);

      // Note: Flag message errors should NOT set errorStateSignal to avoid replacing
      // the message list with the full error state UI.

      // Call error callback if set
      if (this.errorCallback) {
        this.errorCallback(error as CometChat.CometChatException);
      }
    }
  }
}
