import { Injectable, signal, computed, inject, DestroyRef, NgZone } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents, IMessages } from '../events/CometChatMessageEvents';
import { CometChatConversationEvents } from '../events/CometChatConversationEvents';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import {
  CometChatGroupEvents,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
  IGroupLeft,
} from '../events/CometChatGroupEvents';
import { CometChatUserEvents } from '../events/CometChatUserEvents';
import { MessageStatus } from '../Enums/Enums';
import { CometChatUIKitConstants } from '../constants';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * ConversationsService
 *
 * Service responsible for managing conversation state and SDK interactions.
 * Implements the Hybrid Approach pattern where service provides defaults
 * but component @Input properties can override them.
 *
 * Now uses Angular Signals for reactive state management with improved performance.
 * Maintains Observable API for backward compatibility.
 *
 * **Global State Sharing Behavior:**
 * This is a singleton service (providedIn: 'root') that maintains global state
 * shared across ALL components in the application that inject it. This means:
 *
 * - Multiple instances of CometChatConversationsComponent will share the same conversation list
 * - Changes made by one component (e.g., deleting a conversation) are immediately visible to all other components
 * - Loading and error states are shared globally across all components
 * - The active conversation selection is shared across all components
 * - Typing indicators are shared across all components
 *
 * **State Isolation Considerations:**
 * Because this is a singleton service, be aware of the following implications:
 *
 * 1. **Shared State**: All components using this service see the same data. If Component A
 *    fetches conversations, Component B will also see those conversations without fetching.
 *
 * 2. **State Pollution**: If you need component-specific state (e.g., different conversation
 *    lists for different views), the component should manage that state locally using @Input
 *    properties to override service defaults, or use a different service instance.
 *
 * 3. **State Reset**: When you need to reset the state (e.g., when switching users or clearing
 *    data), call the cleanup() method to reset all state to initial values. This is important
 *    to prevent state leakage between different user sessions or application contexts.
 *
 * **Automatic Cleanup:**
 * Uses DestroyRef for automatic cleanup of SDK listeners when the service is destroyed.
 * This happens automatically when the Angular application is destroyed, ensuring no memory leaks.
 *
 * **Manual State Reset:**
 * The cleanup() method is available for manual state reset when needed for component isolation
 * or when switching between different application contexts (e.g., user logout, switching accounts).
 * Call this method when you need to clear all conversations, reset loading/error states, and
 * remove SDK listeners.
 *
 * @example
 * // Using the service in a component
 * export class MyComponent {
 *   private conversationsService = inject(ConversationsService);
 *
 *   ngOnInit() {
 *     // Fetch conversations - all components will see this data
 *     this.conversationsService.fetchConversations();
 *
 *     // Subscribe to conversations - will receive updates from any component
 *     this.conversationsService.conversations$.subscribe(conversations => {
 *       console.log('Conversations updated:', conversations);
 *     });
 *   }
 *
 *   onLogout() {
 *     // Reset state when user logs out to prevent state leakage
 *     this.conversationsService.cleanup();
 *   }
 * }
 *
 * @Injectable providedIn: 'root'
 */
@Injectable({
  providedIn: 'root',
})
export class ConversationsService {
  // DestroyRef for automatic cleanup
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  // State Management - Signals for reactive state
  private conversationsSignal = signal<CometChat.Conversation[]>([]);
  private loadingStateSignal = signal<boolean>(false);
  private errorStateSignal = signal<Error | null>(null);
  private activeConversationSignal = signal<CometChat.Conversation | null>(null);
  private typingIndicatorsSignal = signal<Map<string, CometChat.TypingIndicator>>(new Map());
  private allConversationsSignal = signal<CometChat.Conversation[]>([]);

  // Public Signal API (read-only)
  readonly conversations = this.conversationsSignal.asReadonly();
  readonly loadingState = this.loadingStateSignal.asReadonly();
  readonly errorState = this.errorStateSignal.asReadonly();
  readonly activeConversation = this.activeConversationSignal.asReadonly();
  readonly typingIndicators = this.typingIndicatorsSignal.asReadonly();

  // Public Observable API (for backward compatibility)
  readonly conversations$: Observable<CometChat.Conversation[]> = toObservable(
    this.conversationsSignal
  );
  readonly loadingState$: Observable<boolean> = toObservable(this.loadingStateSignal);
  readonly errorState$: Observable<Error | null> = toObservable(this.errorStateSignal);
  readonly activeConversation$: Observable<CometChat.Conversation | null> = toObservable(
    this.activeConversationSignal
  );
  readonly typingIndicators$: Observable<Map<string, CometChat.TypingIndicator>> = toObservable(
    this.typingIndicatorsSignal
  );

  // Computed signals for derived state
  readonly hasConversations = computed(() => this.conversationsSignal().length > 0);
  readonly isLoading = computed(() => this.loadingStateSignal());
  readonly hasError = computed(() => this.errorStateSignal() !== null);

  // Configuration
  private conversationsRequest?: CometChat.ConversationsRequest;
  private requestBuilder?: CometChat.ConversationsRequestBuilder;
  private messageListenerId = `conversations_${Date.now()}`;
  private userListenerId = `conversations_user_${Date.now()}`;
  private groupListenerId = `conversations_group_${Date.now()}`;
  private callListenerId = `conversations_call_${Date.now()}`;

  // Error handling and retry configuration
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000] as const; // Exponential backoff: 1s, 2s, 4s
  private retryAttempts = new Map<string, number>(); // Track retry attempts per operation

  // ==================== Event Subscriptions ====================

  /**
   * Subscription for the ccMessageSent event from CometChatMessageEvents.
   *
   * This subscription listens for messages sent by the current user via the
   * message composer. It enables real-time synchronization of sent messages
   * in the conversations list, updating the last message preview.
   *
   * **Why This Is Needed:**
   * The SDK's real-time listeners (onTextMessageReceived, onMediaMessageReceived, etc.)
   * only fire for messages received from OTHER users. Messages sent by the current
   * user are not captured by these listeners. This subscription fills that gap.
   *
   * **Lifecycle:**
   * - Created in constructor via `setupSentMessageListener()`
   * - Unsubscribed in `cleanup()` via `removeSentMessageListener()`
   *
   * @private
   * @see Requirement 2.1 - Subscribe to ccMessageSent in constructor
   * @see Requirement 5.2 - Store subscription in private property
   */
  private ccMessageSentSubscription: Subscription | null = null;

  /**
   * Subscription for the ccMessageDeleted event from CometChatMessageEvents.
   *
   * The SDK's onMessageDeleted listener only fires for messages deleted by OTHER users.
   * When the logged-in user deletes their own message, ccMessageDeleted is emitted locally.
   * This subscription ensures the conversation's last message updates accordingly.
   *
   * @private
   */
  private ccMessageDeletedSubscription: Subscription | null = null;

  /**
   * Subscriptions for CometChatCallEvents (outgoing call, accepted, rejected, ended).
   *
   * SDK CallListener only fires for events from OTHER users. For the logged-in user's
   * own call actions (initiating, rejecting, accepting, ending), the internal event bus
   * CometChatCallEvents is used. These subscriptions keep the conversation's last message
   * in sync for the caller's own actions.
   */
  private callEventSubscriptions: Subscription[] = [];

  /**
   * Subscriptions for group, user, message-edited, and conversation-deleted UI events.
   * These match the React UIKit's event subscription pattern for the Conversations component.
   * @see Requirement 4 — Align Conversations Component Event Subscriptions with React
   */
  private uiEventSubscriptions: Subscription[] = [];

  constructor() {
    this.setupMessageListener();
    this.setupUserListener();
    this.setupGroupListener();
    this.setupCallListener();

    // Set up sent message listener for real-time synchronization of sent messages
    // This subscription listens for ccMessageSent events from the message composer
    // and enables updating the conversation's last message preview when the user sends a message
    // @see Requirement 2.1 - Subscribe to ccMessageSent in constructor
    this.setupSentMessageListener();

    // Subscribe to ccMessageDeleted for the logged-in user's own message deletions
    this.setupDeletedMessageListener();

    // Subscribe to internal call events for the logged-in user's own call actions
    this.setupCallEventSubscriptions();

    // Subscribe to group, user, message-edited, and conversation-deleted UI events (Req 4)
    this.setupUIEventSubscriptions();

    // Register cleanup with DestroyRef for automatic cleanup when service is destroyed
    // This ensures SDK listeners are removed and state is reset automatically
    this.destroyRef.onDestroy(() => {
      this.removeMessageListener();
      this.removeUserListener();
      this.removeGroupListener();
      this.removeCallListener();
      this.removeSentMessageListener();
      this.removeCallEventSubscriptions();
      this.removeUIEventSubscriptions();
      this.resetState();
    });
  }

  // ==================== Error Handling Methods (Task 17) ====================

  /**
   * Check if an error is recoverable (network, timeout, etc.)
   * Recoverable errors can be retried with exponential backoff
   *
   * @param error - The error to check
   * @returns True if error is recoverable
   * @private
   */
  private isRecoverableError(error: unknown): boolean {
    if (!error) {
      return false;
    }

    const err = error as Record<string, unknown>;
    const errorMessage = (typeof err['message'] === 'string' ? err['message'] : '').toLowerCase();
    const errorCode = (typeof err['code'] === 'string' ? err['code'] : '') as string;

    // Network-related errors
    const networkErrors = [
      'network',
      'timeout',
      'connection',
      'fetch',
      'econnrefused',
      'enotfound',
      'etimedout',
      'socket',
      'offline',
    ] as const;

    // Check error message for network-related keywords
    const hasNetworkError = networkErrors.some(keyword => errorMessage.includes(keyword));

    // Check error codes for recoverable errors
    const recoverableErrorCodes = [
      'ERR_NETWORK',
      'ERR_TIMEOUT',
      'ERR_CONNECTION_REFUSED',
      'ERR_CONNECTION_RESET',
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
    ] as const;

    const hasRecoverableCode = recoverableErrorCodes.some(
      code => errorCode === code || errorMessage.includes(code.toLowerCase())
    );

    return hasNetworkError || hasRecoverableCode;
  }

  /**
   * Get user-friendly error message based on error type
   * Converts technical errors into readable messages for users
   *
   * @param error - The error object
   * @param context - Context of where the error occurred
   * @returns User-friendly error message
   * @private
   */
  private getUserFriendlyErrorMessage(error: unknown, context: string): string {
    if (!error) {
      return 'An unknown error occurred';
    }

    const err = error as Record<string, unknown>;
    const errorMessage = (typeof err['message'] === 'string' ? err['message'] : '').toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('offline')) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }

    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
      return 'Authentication failed. Please log in again.';
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      return "You don't have permission to perform this action.";
    }

    // Not found errors
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'The requested resource was not found.';
    }

    // Server errors
    if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return 'Server error. Please try again later.';
    }

    // Context-specific messages
    switch (context) {
      case 'fetchConversations':
        return 'Failed to load conversations. Please try again.';
      case 'deleteConversation':
        return 'Failed to delete conversation. Please try again.';
      case 'fetchNextConversations':
        return 'Failed to load more conversations. Please try again.';
      default:
        return (typeof err['message'] === 'string' ? err['message'] : '') || 'An error occurred. Please try again.';
    }
  }

  /**
   * Handle error with retry logic for recoverable errors
   * Implements exponential backoff: 1s, 2s, 4s
   *
   * @param error - The error that occurred
   * @param context - Context of where the error occurred
   * @param retryFn - Function to retry if error is recoverable
   * @returns Promise that resolves when retry succeeds or rejects when max retries reached
   * @private
   */
  private async handleErrorWithRetry(
    error: unknown,
    context: string,
    retryFn?: () => Promise<void>
  ): Promise<void> {
    // Log error for debugging (Requirement 17.5)
    CometChatLogger.error('ConversationsService', `Error in ${context}:`, error);

    // Get current retry attempt count for this operation
    const currentAttempt = this.retryAttempts.get(context) || 0;

    // Check if error is recoverable and we haven't exceeded max retries
    if (this.isRecoverableError(error) && currentAttempt < this.MAX_RETRY_ATTEMPTS && retryFn) {
      // Increment retry attempt
      this.retryAttempts.set(context, currentAttempt + 1);

      // Get delay for this retry attempt (exponential backoff)
      const delay =
        this.RETRY_DELAYS[currentAttempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];

      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));

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

    // Max retries reached or error is not recoverable
    // Reset retry count
    this.retryAttempts.delete(context);

    // Get user-friendly error message
    const userFriendlyMessage = this.getUserFriendlyErrorMessage(error, context);

    // Create enhanced error object with user-friendly message
    const enhancedError = new Error(userFriendlyMessage);
    (enhancedError as Error & { originalError: unknown }).originalError = error;
    (enhancedError as Error & { context: string }).context = context;

    // Update error state (Requirement 17.3)
    this.errorStateSignal.set(enhancedError);

    // Re-throw error so component can handle it
    throw enhancedError;
  }

  /**
   * Clear error state
   * Resets the error state to null
   */
  clearError(): void {
    this.errorStateSignal.set(null);
  }

  // ==================== Public Methods ====================

  /**
   * Set the global conversations request builder
   * This will be used by all component instances unless overridden by @Input
   *
   * @param builder - ConversationsRequestBuilder instance
   */
  setConversationsRequestBuilder(builder: CometChat.ConversationsRequestBuilder): void {
    this.requestBuilder = builder;
    this.conversationsRequest = undefined; // Reset request to use new builder
  }

  /**
   * Set the active conversation globally
   * This will be highlighted in all component instances unless overridden by @Input
   *
   * @param conversation - Conversation to set as active, or null to clear
   */
  setActiveConversation(conversation: CometChat.Conversation | null): void {
    this.activeConversationSignal.set(conversation);
  }

  /**
   * Get the current conversations array
   *
   * @returns Current conversations array
   */
  getConversations(): CometChat.Conversation[] {
    return this.conversationsSignal();
  }

  /**
   * Fetch conversations using the configured request builder
   *
   * @param builder - Optional builder to override the service default
   */
  async fetchConversations(builder?: CometChat.ConversationsRequestBuilder): Promise<void> {
    const context = 'fetchConversations';

    try {
      // Clear existing data so shimmer is visible (paginated list shows shimmer only when items.length === 0)
      this.allConversationsSignal.set([]);
      this.conversationsSignal.set([]);
      this.loadingStateSignal.set(true);
      this.errorStateSignal.set(null);

      const startTime = Date.now();
      const MIN_SHIMMER_TIME = 1000; // Minimum 1s shimmer on initial fetch

      // Use provided builder or service default, or create default with limit 30
      const effectiveBuilder =
        builder || this.requestBuilder || new CometChat.ConversationsRequestBuilder().setLimit(30);

      // Create new request from builder
      this.conversationsRequest = effectiveBuilder.build();

      // Fetch conversations from SDK
      const conversations = await this.conversationsRequest.fetchNext();

      // Ensure shimmer is visible for at least MIN_SHIMMER_TIME
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SHIMMER_TIME - elapsed);

      await new Promise<void>(resolve => setTimeout(resolve, remainingTime));

      // Update state and store all conversations
      this.allConversationsSignal.set(conversations);
      this.conversationsSignal.set(conversations);
      this.loadingStateSignal.set(false);
    } catch (error) {
      this.loadingStateSignal.set(false);

      // Handle error with retry logic
      await this.handleErrorWithRetry(error, context, async () => {
        // Retry function - recursively call fetchConversations
        return this.fetchConversations(builder);
      });
    }
  }

  /**
   * Fetch the next batch of conversations (pagination)
   * @returns Promise<boolean> - true if there are more conversations to fetch, false otherwise
   */
  async fetchNextConversations(): Promise<boolean> {
    const context = 'fetchNextConversations';

    // Don't fetch if no request exists (initial fetch hasn't been called)
    if (!this.conversationsRequest) {
      CometChatLogger.warn(
        'ConversationsService',
        'fetchNextConversations called but no request exists. Call fetchConversations first.'
      );
      return false;
    }

    // Don't fetch if already loading
    if (this.loadingStateSignal()) {
      return true; // Assume there's more since we're still loading
    }

    try {
      this.loadingStateSignal.set(true);
      this.errorStateSignal.set(null);

      // Fetch next batch
      const nextConversations = await this.conversationsRequest.fetchNext();

      // Append to existing conversations
      const currentConversations = this.conversationsSignal();
      const updatedConversations = [...currentConversations, ...nextConversations];
      this.allConversationsSignal.set(updatedConversations);
      this.conversationsSignal.set(updatedConversations);

      this.loadingStateSignal.set(false);

      // Return whether there are more conversations to fetch
      // If we got fewer than expected (or 0), there are no more
      return nextConversations.length > 0;
    } catch (error) {
      this.loadingStateSignal.set(false);
      CometChatLogger.error('ConversationsService', `Error in ${context}:`, error);

      // Get user-friendly error message
      const userFriendlyMessage = this.getUserFriendlyErrorMessage(error, context);
      const enhancedError = new Error(userFriendlyMessage);
      (enhancedError as Error & { originalError: unknown }).originalError = error;
      (enhancedError as Error & { context: string }).context = context;

      this.errorStateSignal.set(enhancedError);
      return false;
    }
  }

  /**
   * Delete a conversation
   *
   * @param conversationWith - User or Group ID
   * @param conversationType - 'user' or 'group'
   */
  async deleteConversation(conversationWith: string, conversationType: string): Promise<void> {
    const context = 'deleteConversation';

    try {
      this.errorStateSignal.set(null);

      // Delete via SDK
      await CometChat.deleteConversation(conversationWith, conversationType);

      // Remove from local state
      this.removeConversation(conversationWith);
    } catch (error) {
      // Handle error with retry logic
      await this.handleErrorWithRetry(error, context, async () => {
        // Retry function - recursively call deleteConversation
        return this.deleteConversation(conversationWith, conversationType);
      });
    }
  }

  /**
   * Search/filter conversations by text
   * Filters conversations by name or last message content
   *
   * @param searchText - Text to search for
   */
  searchConversations(searchText: string): void {
    if (!searchText || searchText.trim() === '') {
      // If search is empty, restore all conversations
      // Ensure both signals are in sync
      const allConversations = this.allConversationsSignal();
      this.conversationsSignal.set([...allConversations]);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = this.allConversationsSignal().filter(conversation => {
      const conversationWith = conversation.getConversationWith();
      const name =
        conversationWith instanceof CometChat.User
          ? conversationWith.getName()
          : conversationWith.getName();

      const lastMessage = conversation.getLastMessage();
      const messageText = lastMessage instanceof CometChat.TextMessage ? lastMessage.getText() : '';

      return (
        name.toLowerCase().includes(searchLower) || messageText.toLowerCase().includes(searchLower)
      );
    });

    this.conversationsSignal.set(filtered);
  }

  /**
   * Update or add a conversation to the list.
   * Respects dashboard ConversationUpdateSettings for unread count and last message updates.
   * Moves updated conversation to the top (most recent first sorting).
   *
   * When a message is provided, this method:
   * - Checks `shouldLastMessageAndUnreadCountBeUpdated` to respect dashboard settings
   * - Increments unread count only if the sender is not the logged-in user
   * - Updates group member count for group action messages
   * - Sets the last message on the conversation
   *
   * @param conversation - Conversation to update/add
   * @param message - Optional message that triggered the update (for unread count / settings checks)
   */
  updateConversationList(
    conversation: CometChat.Conversation,
    message?: CometChat.BaseMessage
  ): void {
    const effectiveMessage = message || conversation.getLastMessage();

    // If a message is provided, validate it against dashboard settings
    if (effectiveMessage) {
      if (!this.isAMessage(effectiveMessage)) {
        return;
      }
      if (!this.shouldLastMessageAndUnreadCountBeUpdated(effectiveMessage)) {
        return;
      }

      // Increment unread count if sender is not the logged-in user
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      if (loggedInUser && effectiveMessage.getSender().getUid() !== loggedInUser.getUid()) {
        conversation.setUnreadMessageCount((conversation.getUnreadMessageCount() ?? 0) + 1);
      }

      // Update group member count for group action messages
      if (
        effectiveMessage instanceof CometChat.Action &&
        effectiveMessage.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
        conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group
      ) {
        const actionFor = effectiveMessage.getActionFor();
        const receiver = effectiveMessage.getReceiver();
        if (actionFor instanceof CometChat.Group && receiver instanceof CometChat.Group) {
          const isSameGroup = receiver.getGuid() === actionFor.getGuid();
          if (isSameGroup) {
            const updatedGroup = conversation.getConversationWith() as CometChat.Group;
            updatedGroup.setMembersCount(actionFor.getMembersCount());
            conversation.setConversationWith(updatedGroup);
          }
        }
      }

      // Set the last message on the conversation
      conversation.setLastMessage(effectiveMessage);
    }

    const conversations = [...this.allConversationsSignal()];
    const conversationWith = conversation.getConversationWith();
    const conversationId =
      conversationWith instanceof CometChat.User
        ? conversationWith.getUid()
        : conversationWith.getGuid();

    // Find existing conversation
    const existingIndex = conversations.findIndex(conv => {
      const convWith = conv.getConversationWith();
      const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
      return convId === conversationId;
    });

    if (existingIndex !== -1) {
      // Remove existing and add updated to top
      conversations.splice(existingIndex, 1);
    }

    // Add to top (most recent first)
    const updatedConversations = [conversation, ...conversations];
    this.allConversationsSignal.set(updatedConversations);
    this.conversationsSignal.set(updatedConversations);
  }

  /**
   * Remove a conversation from the list
   *
   * @param conversationWith - User or Group ID
   */
  removeConversation(conversationWith: string): void {
    const conversations = [...this.allConversationsSignal()];

    // Find the conversation being removed to emit the event
    const conversationToRemove = conversations.find(conv => {
      const convWith = conv.getConversationWith();
      const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
      return convId === conversationWith;
    });

    const filtered = conversations.filter(conv => {
      const convWith = conv.getConversationWith();
      const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
      return convId !== conversationWith;
    });

    this.allConversationsSignal.set(filtered);
    this.conversationsSignal.set(filtered);

    // Emit the conversation deleted event if the conversation was found
    if (conversationToRemove) {
      CometChatConversationEvents.ccConversationDeleted.next(conversationToRemove);
    }
  }

  /**
   * Find a conversation by user/group ID.
   * Returns the conversation object if found, null otherwise.
   *
   * @param conversationWith - User UID or Group GUID
   * @returns The conversation object or null if not found
   */
  findConversation(conversationWith: string): CometChat.Conversation | null {
    const conversations = this.allConversationsSignal();
    const found = conversations.find(conv => {
      const convWith = conv.getConversationWith();
      const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
      return convId === conversationWith;
    });
    return found || null;
  }

  /**
   * Replace a conversation in the list with a new conversation object.
   * Useful for updating conversation data without changing position.
   *
   * @param conversationWith - User UID or Group GUID to find
   * @param newConversation - The new conversation object to replace with
   * @returns true if replacement was successful, false if conversation not found
   */
  replaceConversation(newConversation: CometChat.Conversation): boolean {
    const conversationWith: CometChat.User | CometChat.Group =
      newConversation.getConversationWith();
    const convUID =
      conversationWith instanceof CometChat.User
        ? (conversationWith as CometChat.User).getUid()
        : (conversationWith as CometChat.Group).getGuid();
    const conversations = [...this.allConversationsSignal()];
    const index = conversations.findIndex(conv => {
      const convWith = conv.getConversationWith();
      const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
      return convId === convUID;
    });

    if (index === -1) {
      return false;
    }

    conversations[index] = newConversation;
    this.allConversationsSignal.set(conversations);
    this.conversationsSignal.set(conversations);
    return true;
  }

  /**
   * Move a conversation to the top of the list.
   * Useful for bringing a conversation to attention after receiving a new message.
   *
   * @param conversationWith - User UID or Group GUID
   * @returns true if move was successful, false if conversation not found
   */
  moveConversationToTop(conversationWith: string): boolean {
    const conversations = [...this.allConversationsSignal()];
    const index = conversations.findIndex(conv => {
      const convWith = conv.getConversationWith();
      const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
      return convId === conversationWith;
    });

    if (index === -1) {
      return false;
    }

    // Remove from current position and add to top
    const [conversation] = conversations.splice(index, 1);
    conversations.unshift(conversation);

    this.allConversationsSignal.set(conversations);
    this.conversationsSignal.set(conversations);
    return true;
  }

  /**
   * Insert a conversation at a specific index.
   * If index is out of bounds, appends to the end.
   *
   * @param conversation - The conversation to insert
   * @param index - The position to insert at (0 = top)
   */
  insertConversationAt(conversation: CometChat.Conversation, index: number): void {
    const conversations = [...this.allConversationsSignal()];

    // Clamp index to valid range
    const insertIndex = Math.max(0, Math.min(index, conversations.length));
    conversations.splice(insertIndex, 0, conversation);

    this.allConversationsSignal.set(conversations);
    this.conversationsSignal.set(conversations);
  }

  /**
   * Get the index of a conversation in the list.
   *
   * @param conversationWith - User UID or Group GUID
   * @returns The index of the conversation, or -1 if not found
   */
  getConversationIndex(conversationWith: string): number {
    const conversations = this.allConversationsSignal();
    return conversations.findIndex(conv => {
      const convWith = conv.getConversationWith();
      const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
      return convId === conversationWith;
    });
  }

  // ==================== Receipt Handling Methods (Task 16) ====================

  /**
   * Update conversation unread count.
   * Updates the unread count for a specific conversation in the list.
   * @param conversationId - The conversation ID (user UID or group GUID)
   * @param count - The new unread count
   * @see Requirements 8.4, 8.5
   */
  updateConversationUnreadCount(conversationId: string, count: number): void {
    try {
      const conversations = [...this.allConversationsSignal()];

      // Find the conversation by ID
      const conversationIndex = conversations.findIndex(conv => {
        const convWith = conv.getConversationWith();
        const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
        return convId === conversationId;
      });

      if (conversationIndex === -1) {
        return; // Conversation not found
      }

      // Update unread count (Requirement 8.4)
      const conversation = conversations[conversationIndex];
      conversation.setUnreadMessageCount(count);

      // Update state efficiently using signals (Requirement 8.5)
      this.allConversationsSignal.set(conversations);
      this.conversationsSignal.set(conversations);
    } catch (error) {
      CometChatLogger.error(
        'ConversationsService',
        'Error updating conversation unread count:',
        error
      );
    }
  }

  /**
   * Update conversation read status.
   * Clears unread indicators and updates the last message read status.
   * When the last message matches and conversation is active, resets unread count
   * and removes unread state while keeping active state.
   * @param conversationId - The conversation ID (user UID or group GUID)
   * @param message - The latest message that was read
   * @see Requirements 9.3, 9.4
   */
  updateConversationReadStatus(conversationId: string, message: CometChat.BaseMessage): void {
    try {
      const conversations = [...this.allConversationsSignal()];

      // Find the conversation by ID
      const conversationIndex = conversations.findIndex(conv => {
        const convWith = conv.getConversationWith();
        const convId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
        return convId === conversationId;
      });

      if (conversationIndex === -1) {
        return; // Conversation not found
      }

      const conversation = conversations[conversationIndex];
      const lastMessage = conversation.getLastMessage();

      // Always clear unread count when messages are marked as read in this conversation
      conversation.setUnreadMessageCount(0);

      // Update read receipt status on last message if it matches
      const lastMessageMatches = lastMessage && lastMessage.getId() === message.getId();
      if (lastMessageMatches) {
        const readAt = message.getReadAt();
        if (readAt) {
          lastMessage.setReadAt(readAt);
          conversation.setLastMessage(lastMessage);
        }
      }

      // Update state efficiently using signals
      this.allConversationsSignal.set(conversations);
      this.conversationsSignal.set(conversations);
    } catch (error) {
      CometChatLogger.error(
        'ConversationsService',
        'Error updating conversation read status:',
        error
      );
    }
  }

  /**
   * Gets the conversation ID from a conversation object.
   * @param conversation - The conversation to get ID from
   * @returns The conversation ID (user UID or group GUID)
   * @private
   */
  private getConversationId(conversation: CometChat.Conversation): string {
    const conversationWith = conversation.getConversationWith();
    return conversationWith instanceof CometChat.User
      ? conversationWith.getUid()
      : conversationWith.getGuid();
  }

  /**
   * Handle message receipt (delivery or read).
   * Updates the last message receipt status in the conversation list.
   * @param receipt - The message receipt from SDK
   * @private
   */
  private handleReceipt(receipt: CometChat.MessageReceipt, isGroupReceipt: boolean): void {
    try {
      const receiptMessageId = parseInt(receipt.getMessageId(), 10);
      const readAt = receipt.getReadAt();
      const deliveredAt = receipt.getDeliveredAt();
      const sender = receipt.getSender();
      const receiverType = receipt.getReceiverType();
      const receiverId = receipt.getReceiver();

      if (isNaN(receiptMessageId)) {
        return;
      }

      const conversations = [...this.allConversationsSignal()];
      let updated = false;

      for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];

        // Group/1-on-1 guard
        const isGroup =
          conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group;
        if (isGroup && !isGroupReceipt) {
          continue;
        }
        if (!isGroup && isGroupReceipt) {
          continue;
        }

        // Match conversation by receiver info
        const convWith = conversation.getConversationWith();
        const convId =
          convWith instanceof CometChat.User
            ? convWith.getUid()
            : (convWith as CometChat.Group).getGuid();

        // For 1-on-1: the receipt sender is the other user in the conversation
        // For group: match by receiver ID (group GUID)
        let matches = false;
        if (isGroup) {
          matches = convId === receiverId;
        } else {
          const senderUid = sender?.getUid?.();
          matches = convId === senderUid;
        }

        if (!matches) {
          continue;
        }

        const lastMessage = conversation.getLastMessage();
        if (!lastMessage) {
          continue;
        }

        const lastMessageId = lastMessage.getId();

        // Update if the receipt covers the last message:
        // - receiptMessageId >= lastMessageId (normal case)
        // - lastMessageId is 0 (optimistic message not yet confirmed by server)
        if (receiptMessageId >= lastMessageId || lastMessageId === 0) {
          if (readAt) {
            lastMessage.setReadAt(readAt);
            if (!lastMessage.getDeliveredAt()) {
              lastMessage.setDeliveredAt(readAt);
            }
          } else if (deliveredAt) {
            if (!lastMessage.getReadAt()) {
              lastMessage.setDeliveredAt(deliveredAt);
            }
          }
          conversation.setLastMessage(lastMessage);
          updated = true;
        }
        break;
      }

      if (updated) {
        this.allConversationsSignal.set(conversations);
        this.conversationsSignal.set(conversations);
      }
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error handling receipt:', error);
    }
  }

  /**
   * Cleanup method to remove SDK listeners and reset all state to initial values.
   *
   * **When to Use:**
   * Call this method when you need to manually reset the service state, such as:
   * - User logout: Clear all conversation data before the next user logs in
   * - Account switching: Reset state when switching between different user accounts
   * - Application context change: Clear state when navigating to a different application context
   * - Testing: Reset state between test cases
   *
   * **What It Does:**
   * - Removes all SDK listeners (message, user, group listeners)
   * - Resets conversations array to empty
   * - Clears loading and error states
   * - Clears active conversation selection
   * - Clears typing indicators
   * - Resets retry attempt counters
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
   * // Reset state on user logout
   * onLogout() {
   *   this.conversationsService.cleanup();
   *   // Now safe to log in a different user
   * }
   *
   * @example
   * // Reset state when switching accounts
   * switchAccount(newUserId: string) {
   *   this.conversationsService.cleanup();
   *   // Login with new user and fetch their conversations
   *   this.loginAndFetchConversations(newUserId);
   * }
   */
  cleanup(): void {
    // Remove SDK listeners
    this.removeListeners();

    // Reset state
    this.resetState();
  }

  /**
   * Remove all SDK listeners and subscriptions without resetting state.
   * Use this when the component is destroyed but the service state should persist
   * (e.g., tab switching). Listeners will be re-added when the component re-initializes.
   */
  removeListeners(): void {
    this.removeMessageListener();
    this.removeUserListener();
    this.removeGroupListener();
    this.removeCallListener();
    this.removeSentMessageListener();
    this.removeDeletedMessageListener();
    this.removeCallEventSubscriptions();
    this.removeUIEventSubscriptions();
  }

  /**
   * Reset all state to initial values.
   *
   * This is an internal method called during cleanup and DestroyRef onDestroy.
   * It resets all signals and maps to their initial empty states.
   *
   * **State Reset Includes:**
   * - Conversations array (both filtered and all conversations)
   * - Loading state (set to false)
   * - Error state (set to null)
   * - Active conversation (set to null)
   * - Typing indicators (cleared)
   * - Retry attempt counters (cleared)
   *
   * **Global Impact:**
   * Because this service is a singleton, resetting state affects all components
   * that are subscribed to this service's observables or signals.
   *
   * @private
   */
  private resetState(): void {
    // Reset state using signals
    this.allConversationsSignal.set([]);
    this.conversationsSignal.set([]);
    this.loadingStateSignal.set(false);
    this.errorStateSignal.set(null);
    this.activeConversationSignal.set(null);
    this.typingIndicatorsSignal.set(new Map());

    // Clear retry attempts
    this.retryAttempts.clear();
  }

  /**
   * Set up message listener for real-time message updates
   * Handles new messages, message updates, and message deletions
   *
   * @private
   */
  private setupMessageListener(): void {
    try {
      CometChat.addMessageListener(
        this.messageListenerId,
        new CometChat.MessageListener({
          onTextMessageReceived: (message: CometChat.TextMessage) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onMediaMessageReceived: (message: CometChat.MediaMessage) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onCustomMessageReceived: (message: CometChat.CustomMessage) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onInteractiveMessageReceived: (message: CometChat.InteractiveMessage) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onMessageEdited: (message: CometChat.BaseMessage) => {
            this.ngZone.run(() => this.handleMessageUpdate(message));
          },
          onMessageDeleted: (message: CometChat.BaseMessage) => {
            this.ngZone.run(() => this.handleMessageDelete(message));
          },
          onMessagesDelivered: (receipt: CometChat.MessageReceipt) => {
            this.ngZone.run(() => this.handleReceipt(receipt, false));
          },
          onMessagesRead: (receipt: CometChat.MessageReceipt) => {
            this.ngZone.run(() => this.handleReceipt(receipt, false));
          },
          onMessagesDeliveredToAll: (receipt: CometChat.MessageReceipt) => {
            this.ngZone.run(() => this.handleReceipt(receipt, true));
          },
          onMessagesReadByAll: (receipt: CometChat.MessageReceipt) => {
            this.ngZone.run(() => this.handleReceipt(receipt, true));
          },
          onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
            this.ngZone.run(() => this.handleTypingStarted(typingIndicator));
          },
          onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
            this.ngZone.run(() => this.handleTypingEnded(typingIndicator));
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error setting up message listener:', error);
    }
  }

  /**
   * Set up user listener for online/offline status updates
   *
   * @private
   */
  private setupUserListener(): void {
    try {
      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (user: CometChat.User) => {
            this.ngZone.run(() => this.handleUserStatusChange(user));
          },
          onUserOffline: (user: CometChat.User) => {
            this.ngZone.run(() => this.handleUserStatusChange(user));
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error setting up user listener:', error);
    }
  }

  /**
   * Set up group listener for group-related updates
   *
   * @private
   */
  private setupGroupListener(): void {
    try {
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberJoined: (message: CometChat.Action) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onGroupMemberLeft: (message: CometChat.Action) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onGroupMemberKicked: (message: CometChat.Action) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onGroupMemberBanned: (message: CometChat.Action) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onGroupMemberUnbanned: (message: CometChat.Action) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onGroupMemberScopeChanged: (message: CometChat.Action) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
          onMemberAddedToGroup: (message: CometChat.Action) => {
            this.ngZone.run(() => this.handleNewMessage(message));
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error setting up group listener:', error);
    }
  }

  /**
   * Set up call listener for real-time call action updates.
   *
   * Call events (incoming call, call cancelled, call accepted, call rejected,
   * call ended) come through CometChat.CallListener, NOT MessageListener.
   * Without this listener, the conversation's last message won't update
   * in real-time when call actions occur.
   *
   * The call object (CometChat.Call) extends BaseMessage, so it flows through
   * the same refreshSingleConversation → updateConversationList pipeline
   * as regular messages.
   *
   * @private
   */
  private setupCallListener(): void {
    try {
      CometChat.addCallListener(
        this.callListenerId,
        new CometChat.CallListener({
          onIncomingCallReceived: (call: CometChat.Call) => {
            this.ngZone.run(() => this.refreshSingleConversation(call));
          },
          onIncomingCallCancelled: (call: CometChat.Call) => {
            this.ngZone.run(() => this.refreshSingleConversation(call));
          },
          onOutgoingCallAccepted: (call: CometChat.Call) => {
            this.ngZone.run(() => this.refreshSingleConversation(call));
          },
          onOutgoingCallRejected: (call: CometChat.Call) => {
            this.ngZone.run(() => this.refreshSingleConversation(call));
          },
          onCallEndedMessageReceived: (call: CometChat.Call) => {
            this.ngZone.run(() => this.refreshSingleConversation(call));
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error setting up call listener:', error);
    }
  }

  /**
   * Subscribe to CometChatCallEvents for the logged-in user's own call actions.
   *
   * SDK CallListener only fires for events from OTHER users. When the logged-in user
   * initiates, cancels, accepts, rejects, or ends a call, those actions are emitted
   * through CometChatCallEvents. We subscribe to all four events and feed the call
   * object into refreshSingleConversation to update the conversation's last message.
   *
   * Note: ccCallEnded may emit null in some edge cases (e.g. session cleanup),
   * so we guard against that.
   *
   * @private
   */
  private setupCallEventSubscriptions(): void {
    this.callEventSubscriptions.push(
      CometChatCallEvents.ccOutgoingCall.subscribe((call: CometChat.Call) => {
        if (call) {
          this.refreshSingleConversation(call);
        }
      }),
      CometChatCallEvents.ccCallAccepted.subscribe((call: CometChat.Call) => {
        if (call) {
          this.refreshSingleConversation(call);
        }
      }),
      CometChatCallEvents.ccCallRejected.subscribe((call: CometChat.Call) => {
        if (call) {
          this.refreshSingleConversation(call);
        }
      }),
      CometChatCallEvents.ccCallEnded.subscribe((call: CometChat.Call) => {
        if (call) {
          this.refreshSingleConversation(call);
        }
      })
    );
  }

  /**
   * Unsubscribe from all CometChatCallEvents subscriptions.
   *
   * @private
   */
  private removeCallEventSubscriptions(): void {
    this.callEventSubscriptions.forEach(sub => sub.unsubscribe());
    this.callEventSubscriptions = [];
  }

  /**
   * Subscribe to group, user, message-edited, and conversation-deleted UI events.
   * Matches the React UIKit's event subscription pattern for the Conversations component.
   *
   * @private
   * @see Requirement 4 — Align Conversations Component Event Subscriptions with React
   */
  private setupUIEventSubscriptions(): void {
    // 7.1 — ccGroupCreated: fetch conversation from SDK and add to list
    this.uiEventSubscriptions.push(
      CometChatGroupEvents.ccGroupCreated.subscribe((group: CometChat.Group) => {
        CometChat.getConversation(
          group.getGuid(),
          CometChatUIKitConstants.MessageReceiverType.group
        )
          .then((conversation: CometChat.Conversation) => {
            if (conversation) {
              // Add to top of list
              const conversations = [conversation, ...this.allConversationsSignal()];
              this.allConversationsSignal.set(conversations);
              this.conversationsSignal.set(conversations);
            }
          })
          .catch((error: CometChat.CometChatException) => {
            CometChatLogger.error(
              'ConversationsService',
              'Error fetching conversation for created group:',
              error
            );
          });
      })
    );

    // 7.2 — ccGroupDeleted: remove group conversation from list
    this.uiEventSubscriptions.push(
      CometChatGroupEvents.ccGroupDeleted.subscribe((group: CometChat.Group) => {
        this.removeConversationSilently(group.getGuid());
      })
    );

    // 7.3 — ccGroupLeft: remove group conversation from list
    this.uiEventSubscriptions.push(
      CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => {
        this.removeConversationSilently(item.leftGroup.getGuid());
      })
    );

    // 7.4 — ccGroupMemberScopeChanged: update last message
    this.uiEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((item: IGroupMemberScopeChanged) => {
        this.refreshSingleConversation(item.message);
      })
    );

    // 7.5 — ccGroupMemberAdded: update last message
    this.uiEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
        const message = item.messages[item.messages.length - 1];
        if (message) {
          // Update the group on the conversation and refresh with the last action message
          this.updateGroupOnConversation(item.userAddedIn);
          this.refreshSingleConversation(message);
        }
      })
    );

    // 7.6 — ccGroupMemberKicked: update last message and group
    this.uiEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
        this.updateGroupOnConversation(item.kickedFrom);
        this.refreshSingleConversation(item.message);
      })
    );

    // 7.7 — ccGroupMemberBanned: update last message and group
    this.uiEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
        this.updateGroupOnConversation(item.kickedFrom);
        this.refreshSingleConversation(item.message);
      })
    );

    // 7.8 — ccUserBlocked: remove blocked user conversation
    this.uiEventSubscriptions.push(
      CometChatUserEvents.ccUserBlocked.subscribe((user: CometChat.User) => {
        // If blocked users are excluded (default), remove the conversation
        // If blocked users are included, just update the user on the conversation
        const requestBuilder = this.requestBuilder;
        if (requestBuilder) {
          const builtRequest = requestBuilder.build();
          if (builtRequest && builtRequest.isIncludeBlockedUsers?.()) {
            this.updateUserOnConversation(user);
            return;
          }
        }
        this.removeConversationSilently(user.getUid());
      })
    );

    // 7.9 — ccUserUnblocked: update unblocked user conversation
    this.uiEventSubscriptions.push(
      CometChatUserEvents.ccUserUnblocked.subscribe((user: CometChat.User) => {
        this.updateUserOnConversation(user);
      })
    );

    // 7.10 — ccMessageEdited: update last message on success
    this.uiEventSubscriptions.push(
      CometChatMessageEvents.ccMessageEdited.subscribe((data: IMessages) => {
        if (data.status === MessageStatus.success) {
          this.refreshSingleConversation(data.message);
        }
      })
    );

    // 7.17 — ccConversationDeleted: remove conversation from list
    this.uiEventSubscriptions.push(
      CometChatConversationEvents.ccConversationDeleted.subscribe(
        (conversation: CometChat.Conversation) => {
          if (conversation) {
            const conversationWith = conversation.getConversationWith();
            const convId =
              conversationWith instanceof CometChat.User
                ? conversationWith.getUid()
                : (conversationWith as CometChat.Group).getGuid();
            // Remove from local state without re-publishing the event
            const conversations = this.allConversationsSignal().filter(conv => {
              const cw = conv.getConversationWith();
              const id =
                cw instanceof CometChat.User ? cw.getUid() : (cw as CometChat.Group).getGuid();
              return id !== convId;
            });
            this.allConversationsSignal.set(conversations);
            this.conversationsSignal.set(conversations);
          }
        }
      )
    );
  }

  /**
   * Unsubscribe from all UI event subscriptions.
   * @private
   */
  private removeUIEventSubscriptions(): void {
    this.uiEventSubscriptions.forEach(sub => sub.unsubscribe());
    this.uiEventSubscriptions = [];
  }

  /**
   * Update the group object on a conversation in the list.
   * Used when group metadata changes (member count, etc.) from UI events.
   * @param group - The updated group object
   * @private
   */
  private updateGroupOnConversation(group: CometChat.Group): void {
    const conversations = this.allConversationsSignal();
    const guid = group.getGuid();
    const updated = conversations.map(conv => {
      const convWith = conv.getConversationWith();
      if (convWith instanceof CometChat.Group && convWith.getGuid() === guid) {
        conv.setConversationWith(group);
      }
      return conv;
    });
    this.allConversationsSignal.set([...updated]);
    this.conversationsSignal.set([...updated]);
  }

  /**
   * Update the user object on a conversation in the list.
   * Used when user metadata changes (blocked status, etc.) from UI events.
   * @param user - The updated user object
   * @private
   */
  private updateUserOnConversation(user: CometChat.User): void {
    const conversations = this.allConversationsSignal();
    const uid = user.getUid();
    const updated = conversations.map(conv => {
      const convWith = conv.getConversationWith();
      if (convWith instanceof CometChat.User && convWith.getUid() === uid) {
        conv.setConversationWith(user);
      }
      return conv;
    });
    this.allConversationsSignal.set([...updated]);
    this.conversationsSignal.set([...updated]);
  }

  /**
   * Remove a conversation from the list without publishing ccConversationDeleted.
   * Used by UI event handlers (group deleted, group left, user blocked) where
   * the removal is triggered by an external event, not a user-initiated delete.
   * @param conversationWith - User UID or Group GUID
   * @private
   */
  private removeConversationSilently(conversationWith: string): void {
    const conversations = this.allConversationsSignal();
    const filtered = conversations.filter(conv => {
      const convWith = conv.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? convWith.getUid()
          : (convWith as CometChat.Group).getGuid();
      return convId !== conversationWith;
    });
    this.allConversationsSignal.set(filtered);
    this.conversationsSignal.set(filtered);
  }

  /**
   * Set up sent message listener for real-time synchronization of sent messages.
   *
   * This method subscribes to the `CometChatMessageEvents.ccMessageSent` event
   * to receive notifications when the current user sends a message via the
   * message composer. This enables updating the conversation's last message
   * preview in real-time.
   *
   * **Why This Is Needed:**
   * The SDK's real-time listeners (onTextMessageReceived, onMediaMessageReceived, etc.)
   * only fire for messages received from OTHER users. Messages sent by the current
   * user are not captured by these listeners. This subscription fills that gap.
   *
   * **Lifecycle:**
   * - Called in constructor to set up subscription immediately
   * - Subscription is unsubscribed in cleanup() via removeSentMessageListener()
   *
   * @private
   * @see Requirement 2.1 - Subscribe to ccMessageSent in constructor
   * @see Requirement 5.2 - Store subscription in private property
   */
  private setupSentMessageListener(): void {
    this.ccMessageSentSubscription = CometChatMessageEvents.ccMessageSent.subscribe(
      (data: IMessages) => {
        this.handleSentMessage(data);
      }
    );
  }

  /**
   * Handle sent message events from the message composer.
   *
   * This method processes ccMessageSent events to update the conversation list
   * when the current user sends a message. It only processes messages with
   * `success` status to ensure the conversation is updated with confirmed messages.
   *
   * **Implementation Note:**
   * This is a placeholder that will be fully implemented in Task 2.2.
   * The full implementation will:
   * - Only process messages with success status
   * - Get conversation from message using CometChatHelper
   * - Update the conversation list with the new last message
   *
   * @param data - The IMessages object containing message and status
   * @private
   * @see Requirement 2.2 - Handle success status
   * @see Requirement 2.3 - Update conversation list
   * @see Requirement 2.6 - Ignore inprogress and error statuses
   */
  private handleSentMessage(data: IMessages): void {
    const { message, status } = data;

    // Only process successful sends
    if (status !== MessageStatus.success) {
      return;
    }

    // Use refreshSingleConversation to check local list first
    this.refreshSingleConversation(message);
  }

  /**
   * Remove sent message listener subscription.
   *
   * This method unsubscribes from the ccMessageSent event to prevent memory leaks.
   * Called during cleanup() to ensure proper resource management.
   *
   * @private
   * @see Requirement 2.5 - Unsubscribe from ccMessageSent on cleanup
   * @see Requirement 5.4 - Proper cleanup of subscription
   */
  private removeSentMessageListener(): void {
    this.ccMessageSentSubscription?.unsubscribe();
    this.ccMessageSentSubscription = null;
  }

  /**
   * Set up deleted message listener for the logged-in user's own deletions.
   * The SDK's onMessageDeleted only fires for remote deletions.
   * This listens to ccMessageDeleted to update the conversation last message locally.
   *
   * @private
   */
  private setupDeletedMessageListener(): void {
    this.ccMessageDeletedSubscription = CometChatMessageEvents.ccMessageDeleted.subscribe(
      (message: CometChat.BaseMessage) => {
        this.handleMessageDelete(message);
      }
    );
  }

  /**
   * Remove deleted message listener subscription.
   * @private
   */
  private removeDeletedMessageListener(): void {
    this.ccMessageDeletedSubscription?.unsubscribe();
    this.ccMessageDeletedSubscription = null;
  }

  /**
   * Handle new message received.
   * First checks if the conversation already exists in the local list.
   * If found, updates last message and unread count locally (no SDK call).
   * If not found, fetches the conversation from SDK via getConversationFromMessage.
   *
   * Respects dashboard ConversationUpdateSettings:
   * - Custom messages: only update if shouldUpdateOnCustomMessages() or willUpdateConversation()
   * - Group actions: only update if shouldUpdateOnGroupActions()
   * - Call activities: only update if shouldUpdateOnCallActivities()
   * - Message replies: only update if shouldUpdateOnMessageReplies()
   *
   * @param message - The new message received
   * @private
   */
  /**
   * Handle a new message received from the SDK.
   * Updates the conversation list and marks as delivered if not active.
   * @param message - The new message
   * @private
   * @see Requirements 7.1, 7.2, 7.3 - Mark as delivered for non-active conversations
   */
  private handleNewMessage(message: CometChat.BaseMessage): void {
    try {
      // Check dashboard settings before processing
      const settings = CometChatUIKit.conversationUpdateSettings;
      if (
        settings &&
        !settings.shouldUpdateOnCustomMessages?.() &&
        message.getCategory() === CometChatUIKitConstants.MessageCategory.custom
      ) {
        return;
      }
      if (
        settings &&
        !settings.shouldUpdateOnGroupActions?.() &&
        message.getCategory() === CometChatUIKitConstants.MessageCategory.action
      ) {
        return;
      }

      // Check if conversation is currently active (Requirement 7.1)
      const activeConv = this.activeConversationSignal();
      const isActiveConversation = this.isMessageForActiveConversation(message, activeConv);

      // Mark as delivered if not sent by logged-in user and not already delivered
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      const isReceiverMessage =
        loggedInUser && message.getSender().getUid() !== loggedInUser.getUid();

      if (isReceiverMessage && !message.getDeliveredAt()) {
        // If not active conversation, mark as delivered (Requirements 7.2, 7.3)
        if (!isActiveConversation) {
          CometChat.markAsDelivered(message).catch(() => {
            // Silent fail - delivery receipt is best-effort
          });
        }
      }

      // Try to find existing conversation in local list
      this.refreshSingleConversation(message);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error handling new message:', error);
    }
  }

  /**
   * Check if a message belongs to the currently active conversation.
   * @param message - The message to check
   * @param activeConversation - The currently active conversation
   * @returns True if the message is for the active conversation
   * @private
   * @see Requirement 7.1 - Check active conversation state
   */
  private isMessageForActiveConversation(
    message: CometChat.BaseMessage,
    activeConversation: CometChat.Conversation | null
  ): boolean {
    if (!activeConversation) {
      return false;
    }

    const messageConversationId = message.getConversationId();
    const activeConversationId = activeConversation.getConversationId();

    return messageConversationId === activeConversationId;
  }

  /**
   * Refresh a single conversation based on an incoming message.
   * Checks local list first; only calls SDK if conversation is not found locally.
   *
   * @param message - The message to process
   * @param removeConversation - If true, removes the conversation instead of updating
   * @private
   */
  private refreshSingleConversation(
    message: CometChat.BaseMessage,
    removeConversation = false
  ): void {
    try {
      const conversations = this.allConversationsSignal();
      const messageConversationId = message.getConversationId();

      // Find existing conversation by conversationId
      const targetIdx = conversations.findIndex(
        conv => conv.getConversationId() === messageConversationId
      );

      if (targetIdx >= 0) {
        // Conversation exists locally - update in place without SDK call
        const conversation = conversations[targetIdx];
        if (removeConversation) {
          const convWith = conversation.getConversationWith();
          const convId =
            convWith instanceof CometChat.User
              ? convWith.getUid()
              : (convWith as CometChat.Group).getGuid();
          this.removeConversation(convId);
        } else {
          this.updateConversationList(conversation, message);
        }
      } else {
        // Conversation not in local list - fetch from SDK (new conversation)
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((conversation: CometChat.Conversation) => {
            this.updateConversationList(conversation, message);
          })
          .catch((error: CometChat.CometChatException) => {
            CometChatLogger.error(
              'ConversationsService',
              'Error getting conversation from message:',
              error
            );
          });
      }
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error in refreshSingleConversation:', error);
    }
  }

  /**
   * Handle message update (edit)
   * Uses refreshSingleConversation to check local list first
   *
   * @param message - The updated message
   * @private
   */
  private handleMessageUpdate(message: CometChat.BaseMessage): void {
    try {
      this.refreshSingleConversation(message);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error handling message update:', error);
    }
  }

  /**
   * Handle message deletion
   * Uses refreshSingleConversation to check local list first
   *
   * @param message - The deleted message
   * @private
   */
  private handleMessageDelete(message: CometChat.BaseMessage): void {
    try {
      this.refreshSingleConversation(message);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error handling message delete:', error);
    }
  }

  /**
   * Handle typing started event
   * Adds typing indicator to the map
   * Key format:
   * - For user conversations (1v1): use sender's UID (the person who is typing)
   * - For group conversations: use receiver's GUID (the group where typing is happening)
   *
   * @param typingIndicator - The typing indicator
   * @private
   */
  private handleTypingStarted(typingIndicator: CometChat.TypingIndicator): void {
    try {
      // Create a new Map with the existing indicators
      const typingIndicators = new Map(this.typingIndicatorsSignal());

      // Get the receiver type to determine the key format
      const receiverType = typingIndicator.getReceiverType();

      // Create a unique key based on receiver type
      // For 1v1 chats: use sender's UID (the person typing)
      // For groups: use group GUID (where the typing is happening)
      const key =
        receiverType === 'user'
          ? typingIndicator.getSender().getUid() // 1v1: sender's UID
          : typingIndicator.getReceiverId(); // Group: group GUID

      typingIndicators.set(key, typingIndicator);
      this.typingIndicatorsSignal.set(typingIndicators);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error handling typing started:', error);
    }
  }

  /**
   * Handle typing ended event
   * Removes typing indicator from the map
   *
   * @param typingIndicator - The typing indicator
   * @private
   */
  private handleTypingEnded(typingIndicator: CometChat.TypingIndicator): void {
    try {
      // Create a new Map with the existing indicators
      const typingIndicators = new Map(this.typingIndicatorsSignal());

      // Get the receiver type to determine the key format
      const receiverType = typingIndicator.getReceiverType();

      // Create the same unique key to remove the correct typing indicator
      // For 1v1 chats: use sender's UID (the person typing)
      // For groups: use group GUID (where the typing is happening)
      const key =
        receiverType === 'user'
          ? typingIndicator.getSender().getUid() // 1v1: sender's UID
          : typingIndicator.getReceiverId(); // Group: group GUID

      typingIndicators.delete(key);
      this.typingIndicatorsSignal.set(typingIndicators);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error handling typing ended:', error);
    }
  }

  /**
   * Handle user status change (online/offline)
   * Updates the conversation list to reflect status changes
   *
   * @param user - The user whose status changed
   * @private
   */
  private handleUserStatusChange(user: CometChat.User): void {
    try {
      const conversations = this.conversationsSignal();
      const userId = user.getUid();

      // Find conversation with this user
      const updatedConversations = conversations.map(conversation => {
        const conversationWith = conversation.getConversationWith();
        if (conversationWith instanceof CometChat.User && conversationWith.getUid() === userId) {
          // Update the user object in the conversation
          conversationWith.setStatus(user.getStatus());
          return conversation;
        }
        return conversation;
      });

      // Emit updated conversations
      this.conversationsSignal.set(updatedConversations);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error handling user status change:', error);
    }
  }

  /**
   * Remove message listener
   *
   * @private
   */
  private removeMessageListener(): void {
    try {
      CometChat.removeMessageListener(this.messageListenerId);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error removing message listener:', error);
    }
  }

  /**
   * Remove user listener
   *
   * @private
   */
  private removeUserListener(): void {
    try {
      CometChat.removeUserListener(this.userListenerId);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error removing user listener:', error);
    }
  }

  /**
   * Remove group listener
   *
   * @private
   */
  private removeGroupListener(): void {
    try {
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error removing group listener:', error);
    }
  }

  /**
   * Remove call listener
   *
   * @private
   */
  private removeCallListener(): void {
    try {
      CometChat.removeCallListener(this.callListenerId);
    } catch (error) {
      CometChatLogger.error('ConversationsService', 'Error removing call listener:', error);
    }
  }

  // ==================== Conversation Update Settings Helpers ====================

  /**
   * Check if a message is a valid message type that should trigger conversation updates.
   * Mirrors React UIKit's `isAMessage` function.
   *
   * @param message - The message to check
   * @returns True if the message is a recognized message type
   * @private
   */
  private isAMessage(message: unknown): message is CometChat.BaseMessage {
    return (
      message instanceof CometChat.TextMessage ||
      message instanceof CometChat.MediaMessage ||
      message instanceof CometChat.CustomMessage ||
      message instanceof CometChat.InteractiveMessage ||
      message instanceof CometChat.Action ||
      message instanceof CometChat.Call
    );
  }

  /**
   * Determine whether a message should trigger updates to the conversation's
   * last message and unread count, based on dashboard ConversationUpdateSettings.
   *
   * Mirrors React UIKit's `ConversationsManager.shouldLastMessageAndUnreadCountBeUpdated`.
   *
   * Rules:
   * - Thread replies: skip unless shouldUpdateOnMessageReplies() is enabled
   * - Custom messages: check willUpdateConversation(), metadata incrementUnreadCount, or shouldUpdateOnCustomMessages()
   * - Action messages (group member): check shouldUpdateOnGroupActions()
   * - Call messages (audio/video): check shouldUpdateOnCallActivities()
   * - All other messages: always update
   *
   * @param message - The message to evaluate
   * @returns True if the conversation should be updated
   * @private
   */
  private shouldLastMessageAndUnreadCountBeUpdated(message: CometChat.BaseMessage): boolean {
    try {
      const settings = CometChatUIKit.conversationUpdateSettings;
      const isCustomMessage =
        message.getCategory() === CometChatUIKitConstants.MessageCategory.custom;

      // Check if the message is a reply to another message (thread reply)
      if (message.getParentMessageId() && !settings?.shouldUpdateOnMessageReplies?.()) {
        return false;
      }

      // Custom messages: check thread reply + custom settings
      if (isCustomMessage) {
        if (
          message.getParentMessageId() &&
          settings?.shouldUpdateOnMessageReplies?.() &&
          this.shouldIncrementForCustomMessage(message as CometChat.CustomMessage)
        ) {
          return true;
        }
        return this.shouldIncrementForCustomMessage(message as CometChat.CustomMessage);
      }

      // Action messages (group member join/leave/kick/ban etc.)
      if (message.getCategory() === CometChatUIKitConstants.MessageCategory.action) {
        if (message.getType() === CometChatUIKitConstants.MessageTypes.groupMember) {
          return settings?.shouldUpdateOnGroupActions?.() ?? true;
        }
        return true;
      }

      // Call messages (audio/video)
      if (
        message.getCategory() === CometChatUIKitConstants.MessageCategory.call &&
        (message.getType() === CometChatUIKitConstants.MessageTypes.audio ||
          message.getType() === CometChatUIKitConstants.MessageTypes.video)
      ) {
        return settings?.shouldUpdateOnCallActivities?.() ?? true;
      }

      // Default: all other messages should trigger an update
      return true;
    } catch (error) {
      CometChatLogger.error(
        'ConversationsService',
        'Error in shouldLastMessageAndUnreadCountBeUpdated:',
        error
      );
      return true;
    }
  }

  /**
   * Check if a custom message should increment the unread count / update conversation.
   * Mirrors React UIKit's `ConversationsManager.shouldIncrementForCustomMessage`.
   *
   * A custom message triggers an update if:
   * - `willUpdateConversation()` returns true (SDK-level flag)
   * - Metadata contains `incrementUnreadCount: true`
   * - Dashboard setting `shouldUpdateOnCustomMessages()` is enabled
   *
   * @param message - The custom message to check
   * @returns True if the custom message should trigger a conversation update
   * @private
   */
  private shouldIncrementForCustomMessage(message: CometChat.CustomMessage): boolean {
    try {
      const metadata = message.getMetadata() as Record<string, unknown>;
      return (
        message.willUpdateConversation() ||
        (metadata &&
          metadata.hasOwnProperty('incrementUnreadCount') &&
          !!metadata['incrementUnreadCount']) ||
        (CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnCustomMessages?.() ?? false)
      );
    } catch (error) {
      CometChatLogger.error(
        'ConversationsService',
        'Error in shouldIncrementForCustomMessage:',
        error
      );
      return false;
    }
  }
}
