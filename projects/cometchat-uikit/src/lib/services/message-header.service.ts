import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Error callback type for service error handling
 * Used to propagate errors from service to component
 */
export type ErrorCallback = (error: CometChat.CometChatException) => void;

/**
 * MessageHeaderService
 *
 * Service responsible for managing message header state and SDK interactions.
 * Implements the Hybrid Approach pattern where service provides defaults
 * but component @Input properties can override them.
 *
 * Uses Angular Signals for reactive state management with improved performance.
 *
 * Error Handling Strategy:
 * - All SDK calls are wrapped in try-catch blocks
 * - Errors are logged to console with [MessageHeaderService] prefix
 * - Errors are propagated to component via error callback
 * - Recoverable errors (network, timeout) trigger retry mechanisms
 * - Non-recoverable errors are clearly communicated
 *
 * @Injectable providedIn: 'root'
 * @see Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */
@Injectable()
export class MessageHeaderService {
  // ==================== Listener IDs ====================

  /**
   * Unique ID for user status listener
   * @private
   */
  private userListenerId = `message_header_user_${Date.now()}`;

  /**
   * Unique ID for message listener (typing events)
   * @private
   */
  private messageListenerId = `message_header_message_${Date.now()}`;

  /**
   * Unique ID for group member listener
   * @private
   */
  private groupListenerId = `message_header_group_${Date.now()}`;

  /**
   * Unique ID for connection listener
   * @private
   */
  private connectionListenerId = `message_header_connection_${Date.now()}`;

  // ==================== Typing Indicator Configuration ====================

  /**
   * Timeout reference for auto-clearing stale typing indicators
   * @private
   */
  private typingTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Timeout duration in milliseconds for auto-clearing typing indicators
   * @private
   * @readonly
   */
  private readonly TYPING_TIMEOUT_MS = 2000;

  /**
   * Current entity ID being monitored for typing events
   * @private
   */
  private currentTypingEntityId: string | null = null;

  /**
   * Current entity type being monitored for typing events
   * @private
   */
  private currentTypingEntityType: 'user' | 'group' | null = null;

  /**
   * Current group ID being monitored for member events
   * @private
   */
  private currentGroupId: string | null = null;

  // ==================== State Management - Signals ====================

  /**
   * Current user being displayed in the header
   * @private
   */
  private userSignal = signal<CometChat.User | null>(null);

  /**
   * Current group being displayed in the header
   * @private
   */
  private groupSignal = signal<CometChat.Group | null>(null);

  /**
   * Current user status ('online' or 'offline')
   * @private
   */
  private userStatusSignal = signal<string>('offline');

  /**
   * Current typing indicator (if someone is typing)
   * @private
   */
  private typingIndicatorSignal = signal<CometChat.TypingIndicator | null>(null);

  /**
   * Map of typing users for group conversations
   * Key: user UID, Value: { user: CometChat.User, timestamp: number }
   * @private
   */
  private typingUsersMap = new Map<string, { user: CometChat.User; timestamp: number }>();

  /**
   * Signal for multiple typing users in groups
   * @private
   */
  private typingUsersSignal = signal<CometChat.User[]>([]);

  /**
   * Current group member count
   * @private
   */
  private groupMemberCountSignal = signal<number>(0);

  /**
   * Last active timestamp for offline users
   * @private
   */
  private lastActiveAtSignal = signal<number | null>(null);

  /**
   * Connection status ('connected' or 'disconnected')
   * @private
   */
  private connectionStatusSignal = signal<'connected' | 'disconnected'>('connected');

  // ==================== Error Handling ====================

  /**
   * Error callback for propagating errors to component
   * @private
   * @see Requirements 14.2
   */
  private errorCallback: ErrorCallback | null = null;

  /**
   * Maximum retry attempts for recoverable errors
   * @private
   * @see Requirements 14.5
   */
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Retry delay in milliseconds (exponential backoff base)
   * @private
   */
  private readonly RETRY_DELAY_MS = 1000;

  // ==================== Public Signal API (read-only) ====================

  /**
   * Read-only signal for current user
   */
  readonly user = this.userSignal.asReadonly();

  /**
   * Read-only signal for current group
   */
  readonly group = this.groupSignal.asReadonly();

  /**
   * Read-only signal for user status
   */
  readonly userStatus = this.userStatusSignal.asReadonly();

  /**
   * Read-only signal for typing indicator
   */
  readonly typingIndicator = this.typingIndicatorSignal.asReadonly();

  /**
   * Read-only signal for multiple typing users in groups
   */
  readonly typingUsers = this.typingUsersSignal.asReadonly();

  /**
   * Read-only signal for group member count
   */
  readonly groupMemberCount = this.groupMemberCountSignal.asReadonly();

  /**
   * Read-only signal for last active timestamp
   */
  readonly lastActiveAt = this.lastActiveAtSignal.asReadonly();

  /**
   * Read-only signal for connection status
   */
  readonly connectionStatus = this.connectionStatusSignal.asReadonly();

  // ==================== DestroyRef for Automatic Cleanup ====================

  /**
   * DestroyRef for automatic cleanup when the service is destroyed
   * @private
   * @see Requirements 1.2, 1.4, 1.5
   */
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Register cleanup with DestroyRef for automatic cleanup when service is destroyed
    // This ensures SDK listeners are removed and state is reset automatically
    // without requiring explicit cleanup() calls from components
    // @see Requirements 1.2, 1.4, 1.5
    this.destroyRef.onDestroy(() => {
      try {
        // Remove all SDK listeners (user, message, group, connection)
        this.removeUserStatusListener();
        this.removeTypingListener();
        this.removeGroupMemberListener();
        this.removeConnectionListener();

        // Reset all state to initial values
        this.resetState();
      } catch (error) {
        // Log but don't propagate during cleanup to avoid blocking other cleanup operations
        CometChatLogger.error('MessageHeaderService', 'Error during DestroyRef cleanup:', error);
      }
    });
  }

  // ==================== Error Handling Methods ====================

  /**
   * Set the error callback for propagating errors to component
   * Called by component during initialization
   *
   * @param callback - Error callback function
   * @see Requirements 14.2
   */
  setErrorCallback(callback: ErrorCallback | null): void {
    this.errorCallback = callback;
  }

  /**
   * Handle and propagate errors
   * Logs error to console and calls error callback if set
   *
   * @param error - The error that occurred
   * @param context - Context string describing where the error occurred
   * @private
   * @see Requirements 14.2, 14.3
   */
  private handleError(error: unknown, context: string): void {
    // Log error to console for debugging
    CometChatLogger.error('MessageHeaderService', `${context}:`, error);

    // Propagate error to component if callback is set
    if (this.errorCallback) {
      const exception = this.toCometchatException(error, context);
      this.errorCallback(exception);
    }
  }

  /**
   * Convert unknown error to CometChatException
   *
   * @param error - The error to convert
   * @param context - Context string for error message
   * @returns CometChat.CometChatException
   * @private
   */
  private toCometchatException(error: unknown, context: string): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) {
      return error;
    }

    if (error instanceof Error) {
      return new CometChat.CometChatException({
        code: 'SERVICE_ERROR',
        message: `${context}: ${error.message}`,
        details: error.stack || '',
      });
    }

    return new CometChat.CometChatException({
      code: 'UNKNOWN_ERROR',
      message: `${context}: ${String(error)}`,
      details: '',
    });
  }

  /**
   * Check if an error is recoverable (network, timeout, connection issues)
   *
   * @param error - The error to check
   * @returns true if the error is recoverable
   * @private
   * @see Requirements 14.5
   */
  private isRecoverableError(error: unknown): boolean {
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const errorCode =
      error instanceof CometChat.CometChatException ? String(error.code || '').toLowerCase() : '';

    const recoverablePatterns = [
      'network',
      'timeout',
      'connection',
      'econnrefused',
      'enotfound',
      'socket',
      'websocket',
      'err_network',
      'err_connection',
    ] as const;

    return recoverablePatterns.some(
      pattern => errorMessage.includes(pattern) || errorCode.includes(pattern)
    );
  }

  /**
   * Execute an async operation with retry logic for recoverable errors
   *
   * @param operation - The async operation to execute
   * @param context - Context string for error logging
   * @param maxRetries - Maximum number of retry attempts
   * @returns Promise that resolves when operation succeeds or all retries exhausted
   * @private
   * @see Requirements 14.5
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.MAX_RETRY_ATTEMPTS
  ): Promise<T | null> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // If not recoverable or last attempt, don't retry
        if (!this.isRecoverableError(error) || attempt === maxRetries) {
          this.handleError(error, context);
          return null;
        }

        // Log retry attempt
        CometChatLogger.warn(
          'MessageHeaderService',
          `${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`
        );

        // Exponential backoff delay
        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    // Should not reach here, but handle just in case
    this.handleError(lastError, context);
    return null;
  }

  /**
   * Delay helper for retry logic
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Public Methods ====================

  /**
   * Set the user for the message header
   * Initializes user-related state from the user object
   *
   * @param user - CometChat.User object to display in header
   * @see Requirements 14.1, 14.2, 14.3
   */
  setUser(user: CometChat.User): void {
    try {
      // Validate user object
      if (!user) {
        throw new Error('User object is required');
      }

      // Clear any existing group state
      this.groupSignal.set(null);
      this.groupMemberCountSignal.set(0);

      // Set user state
      this.userSignal.set(user);

      // Initialize user status from user object
      const status = user.getStatus?.();
      this.userStatusSignal.set(status || 'offline');

      // Initialize last active timestamp
      const lastActiveAt = user.getLastActiveAt?.();
      this.lastActiveAtSignal.set(lastActiveAt || null);

      // Clear typing indicator when switching users
      this.typingIndicatorSignal.set(null);
      this.typingUsersMap.clear();
      this.typingUsersSignal.set([]);
    } catch (error) {
      this.handleError(error, 'Error setting user');
    }
  }

  /**
   * Set the group for the message header
   * Initializes group-related state from the group object
   *
   * @param group - CometChat.Group object to display in header
   * @see Requirements 14.1, 14.2, 14.3
   */
  setGroup(group: CometChat.Group): void {
    try {
      // Validate group object
      if (!group) {
        throw new Error('Group object is required');
      }

      // Clear any existing user state
      this.userSignal.set(null);
      this.userStatusSignal.set('offline');
      this.lastActiveAtSignal.set(null);

      // Set group state
      this.groupSignal.set(group);

      // Initialize member count from group object
      const membersCount = group.getMembersCount?.();
      this.groupMemberCountSignal.set(membersCount || 0);

      // Clear typing indicator when switching groups
      this.typingIndicatorSignal.set(null);
      this.typingUsersMap.clear();
      this.typingUsersSignal.set([]);
    } catch (error) {
      this.handleError(error, 'Error setting group');
    }
  }

  /**
   * Update the user status signal
   * Used by listeners to update status in real-time
   *
   * @param status - New status value ('online' or 'offline')
   * @see Requirements 14.1, 14.3
   */
  updateUserStatus(status: string): void {
    try {
      this.userStatusSignal.set(status);
    } catch (error) {
      this.handleError(error, 'Error updating user status');
    }
  }

  /**
   * Update the last active timestamp
   * Used when user goes offline
   *
   * @param timestamp - Last active timestamp in milliseconds
   * @see Requirements 14.1, 14.3
   */
  updateLastActiveAt(timestamp: number | null): void {
    try {
      this.lastActiveAtSignal.set(timestamp);
    } catch (error) {
      this.handleError(error, 'Error updating last active at');
    }
  }

  /**
   * Set the typing indicator
   * Used by listeners when typing starts
   *
   * @param typingIndicator - CometChat.TypingIndicator object
   * @see Requirements 14.1, 14.3
   */
  setTypingIndicator(typingIndicator: CometChat.TypingIndicator | null): void {
    try {
      this.typingIndicatorSignal.set(typingIndicator);
    } catch (error) {
      this.handleError(error, 'Error setting typing indicator');
    }
  }

  /**
   * Update the group member count
   * Used by listeners when members join/leave
   *
   * @param count - New member count
   * @see Requirements 14.1, 14.3
   */
  updateGroupMemberCount(count: number): void {
    try {
      this.groupMemberCountSignal.set(count);
    } catch (error) {
      this.handleError(error, 'Error updating group member count');
    }
  }

  /**
   * Increment the group member count by 1
   * Used when a member joins the group
   * @see Requirements 14.1, 14.3
   */
  incrementGroupMemberCount(): void {
    try {
      const currentCount = this.groupMemberCountSignal();
      this.groupMemberCountSignal.set(currentCount + 1);
    } catch (error) {
      this.handleError(error, 'Error incrementing group member count');
    }
  }

  /**
   * Decrement the group member count by 1
   * Used when a member leaves/is kicked/banned from the group
   * @see Requirements 14.1, 14.3
   */
  decrementGroupMemberCount(): void {
    try {
      const currentCount = this.groupMemberCountSignal();
      // Ensure count doesn't go below 0
      this.groupMemberCountSignal.set(Math.max(0, currentCount - 1));
    } catch (error) {
      this.handleError(error, 'Error decrementing group member count');
    }
  }

  /**
   * Reset all state to initial values
   * Used for cleanup when component is destroyed
   * @see Requirements 14.1, 14.3
   */
  resetState(): void {
    try {
      this.userSignal.set(null);
      this.groupSignal.set(null);
      this.userStatusSignal.set('offline');
      this.typingIndicatorSignal.set(null);
      this.typingUsersMap.clear();
      this.typingUsersSignal.set([]);
      this.groupMemberCountSignal.set(0);
      this.lastActiveAtSignal.set(null);
      this.connectionStatusSignal.set('connected');
      // Clear error callback on reset
      this.errorCallback = null;
    } catch (error) {
      // Log but don't propagate during reset to avoid infinite loops
      CometChatLogger.error('MessageHeaderService', 'Error resetting state:', error);
    }
  }

  // ==================== Real-time Listeners ====================

  /**
   * Set up user status listener to track online/offline status changes
   * Only updates status if the user matches the current user being displayed
   *
   * @param userId - The user ID to listen for status changes
   * @see Requirements 14.4
   */
  setupUserStatusListener(userId: string): void {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required for status listener');
      }

      // Remove any existing user listener before setting up a new one
      CometChat.removeUserListener(this.userListenerId);

      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (user: CometChat.User) => {
            this.handleUserStatusChange(user, 'online');
          },
          onUserOffline: (user: CometChat.User) => {
            this.handleUserStatusChange(user, 'offline');
          },
        })
      );
    } catch (error) {
      this.handleError(error, 'Error setting up user status listener');
    }
  }

  /**
   * Handle user status change events
   * Only updates state if the user matches the current user being displayed
   *
   * @param user - The user whose status changed
   * @param status - The new status ('online' or 'offline')
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleUserStatusChange(user: CometChat.User, status: 'online' | 'offline'): void {
    try {
      const currentUser = this.userSignal();

      // Only update if the status change is for the current user being displayed
      if (currentUser && currentUser.getUid() === user.getUid()) {
        this.userStatusSignal.set(status);

        // Update lastActiveAt for offline users
        if (status === 'offline') {
          const lastActiveAt = user.getLastActiveAt?.();
          this.lastActiveAtSignal.set(lastActiveAt || Date.now());
        } else {
          // Clear lastActiveAt when user comes online
          this.lastActiveAtSignal.set(null);
        }
      }
    } catch (error) {
      this.handleError(error, 'Error handling user status change');
    }
  }

  /**
   * Remove the user status listener
   * Should be called during cleanup
   * @see Requirements 14.4
   */
  removeUserStatusListener(): void {
    try {
      CometChat.removeUserListener(this.userListenerId);
    } catch (error) {
      // Log but don't propagate during cleanup
      CometChatLogger.error('MessageHeaderService', 'Error removing user status listener:', error);
    }
  }

  // ==================== Typing Indicator Listener ====================

  /**
   * Set up typing indicator listener to track typing events
   * Listens for onTypingStarted and onTypingEnded events from CometChat SDK
   * Only updates typing indicator if it matches the current user/group being displayed
   *
   * @param entityId - The user ID or group ID to listen for typing events
   * @param entityType - The type of entity ('user' or 'group')
   * @see Requirements 14.4
   */
  setupTypingListener(entityId: string, entityType: 'user' | 'group'): void {
    try {
      // Validate entityId
      if (!entityId) {
        throw new Error('Entity ID is required for typing listener');
      }

      // Store current entity info for filtering typing events
      this.currentTypingEntityId = entityId;
      this.currentTypingEntityType = entityType;

      // Remove any existing message listener before setting up a new one
      CometChat.removeMessageListener(this.messageListenerId);

      // Clear any existing typing timeout
      this.clearTypingTimeout();

      // Clear any existing typing indicator
      this.typingIndicatorSignal.set(null);

      CometChat.addMessageListener(
        this.messageListenerId,
        new CometChat.MessageListener({
          onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
            this.handleTypingStarted(typingIndicator);
          },
          onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
            this.handleTypingEnded(typingIndicator);
          },
        })
      );
    } catch (error) {
      this.handleError(error, 'Error setting up typing listener');
    }
  }

  /**
   * Handle typing started event
   * Sets the typing indicator signal and starts auto-clear timeout
   * Only updates if the typing event matches the current entity being displayed
   * For groups, tracks multiple typing users
   *
   * @param typingIndicator - CometChat.TypingIndicator object from SDK
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleTypingStarted(typingIndicator: CometChat.TypingIndicator): void {
    try {
      // Validate that we have a current entity to compare against
      if (!this.currentTypingEntityId || !this.currentTypingEntityType) {
        return;
      }

      // Get the receiver ID and type from the typing indicator
      const receiverId = typingIndicator.getReceiverId();
      const receiverType = typingIndicator.getReceiverType();
      const sender = typingIndicator.getSender();
      const senderId = sender?.getUid();

      // Determine if this typing event is relevant to the current conversation
      let isRelevant = false;

      if (this.currentTypingEntityType === 'user') {
        // For user conversations, check if the sender is the user we're chatting with
        isRelevant = senderId === this.currentTypingEntityId;
      } else if (this.currentTypingEntityType === 'group') {
        // For group conversations, check if the receiver is the group we're viewing
        isRelevant =
          receiverType === CometChat.RECEIVER_TYPE.GROUP &&
          receiverId === this.currentTypingEntityId;
      }

      if (!isRelevant) {
        return;
      }

      // Clear any existing timeout before setting new one
      this.clearTypingTimeout();

      // Set the typing indicator signal
      this.typingIndicatorSignal.set(typingIndicator);

      // For group conversations, track multiple typing users
      if (this.currentTypingEntityType === 'group' && sender && senderId) {
        // Add or update the typing user in the map
        this.typingUsersMap.set(senderId, {
          user: sender,
          timestamp: Date.now(),
        });

        // Update the typing users signal
        this.updateTypingUsersSignal();

        // Set up individual timeout for this user
        setTimeout(() => {
          this.removeTypingUser(senderId);
        }, this.TYPING_TIMEOUT_MS);
      }

      // Start auto-clear timeout (2 seconds)
      // This handles cases where onTypingEnded is not received
      this.typingTimeout = setTimeout(() => {
        this.typingIndicatorSignal.set(null);
        // For groups, also clear all typing users
        if (this.currentTypingEntityType === 'group') {
          this.typingUsersMap.clear();
          this.typingUsersSignal.set([]);
        }
      }, this.TYPING_TIMEOUT_MS);
    } catch (error) {
      this.handleError(error, 'Error handling typing started');
    }
  }

  /**
   * Handle typing ended event
   * Clears the typing indicator signal and any pending timeout
   * Only updates if the typing event matches the current entity being displayed
   * For groups, removes the specific user from typing users
   *
   * @param typingIndicator - CometChat.TypingIndicator object from SDK
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleTypingEnded(typingIndicator: CometChat.TypingIndicator): void {
    try {
      // Validate that we have a current entity to compare against
      if (!this.currentTypingEntityId || !this.currentTypingEntityType) {
        return;
      }

      // Get the receiver ID and type from the typing indicator
      const receiverId = typingIndicator.getReceiverId();
      const receiverType = typingIndicator.getReceiverType();
      const senderId = typingIndicator.getSender()?.getUid();

      // Determine if this typing event is relevant to the current conversation
      let isRelevant = false;

      if (this.currentTypingEntityType === 'user') {
        // For user conversations, check if the sender is the user we're chatting with
        isRelevant = senderId === this.currentTypingEntityId;
      } else if (this.currentTypingEntityType === 'group') {
        // For group conversations, check if the receiver is the group we're viewing
        isRelevant =
          receiverType === CometChat.RECEIVER_TYPE.GROUP &&
          receiverId === this.currentTypingEntityId;
      }

      if (!isRelevant) {
        return;
      }

      // For group conversations, remove the specific user from typing users
      if (this.currentTypingEntityType === 'group' && senderId) {
        this.removeTypingUser(senderId);

        // Only clear the main typing indicator if no one else is typing
        if (this.typingUsersMap.size === 0) {
          this.clearTypingTimeout();
          this.typingIndicatorSignal.set(null);
        }
      } else {
        // For user conversations, clear everything
        this.clearTypingTimeout();
        this.typingIndicatorSignal.set(null);
      }
    } catch (error) {
      this.handleError(error, 'Error handling typing ended');
    }
  }

  /**
   * Clear the typing timeout if it exists
   * @private
   */
  private clearTypingTimeout(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = undefined;
    }
  }

  /**
   * Remove a typing user from the map and update the signal
   * @param userId - The user ID to remove
   * @private
   */
  private removeTypingUser(userId: string): void {
    if (this.typingUsersMap.has(userId)) {
      this.typingUsersMap.delete(userId);
      this.updateTypingUsersSignal();
    }
  }

  /**
   * Update the typing users signal from the map
   * @private
   */
  private updateTypingUsersSignal(): void {
    const users = Array.from(this.typingUsersMap.values()).map(entry => entry.user);
    this.typingUsersSignal.set(users);
  }

  /**
   * Remove the typing indicator listener
   * Should be called during cleanup
   * @see Requirements 14.4
   */
  removeTypingListener(): void {
    try {
      // Remove the message listener
      CometChat.removeMessageListener(this.messageListenerId);

      // Clear any pending timeout
      this.clearTypingTimeout();

      // Clear the typing indicator signal
      this.typingIndicatorSignal.set(null);

      // Clear typing users map and signal
      this.typingUsersMap.clear();
      this.typingUsersSignal.set([]);

      // Clear entity tracking
      this.currentTypingEntityId = null;
      this.currentTypingEntityType = null;
    } catch (error) {
      // Log but don't propagate during cleanup
      CometChatLogger.error('MessageHeaderService', 'Error removing typing listener:', error);
    }
  }

  // ==================== Group Member Listener ====================

  /**
   * Set up group member listener to track member join/leave/kick/ban events
   * Only updates member count if the group matches the current group being displayed
   *
   * @param groupId - The group ID to listen for member events
   * @see Requirements 14.4
   */
  setupGroupMemberListener(groupId: string): void {
    try {
      // Validate groupId
      if (!groupId) {
        throw new Error('Group ID is required for member listener');
      }

      // Store current group ID for filtering events
      this.currentGroupId = groupId;

      // Remove any existing group listener before setting up a new one
      CometChat.removeGroupListener(this.groupListenerId);

      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberJoined: (
            message: CometChat.Action,
            joinedUser: CometChat.User,
            joinedGroup: CometChat.Group
          ) => {
            this.handleGroupMemberJoined(joinedGroup);
          },
          onGroupMemberLeft: (
            message: CometChat.Action,
            leavingUser: CometChat.User,
            group: CometChat.Group
          ) => {
            this.handleGroupMemberLeft(group);
          },
          onGroupMemberKicked: (
            message: CometChat.Action,
            kickedUser: CometChat.User,
            kickedBy: CometChat.User,
            kickedFrom: CometChat.Group
          ) => {
            this.handleGroupMemberKicked(kickedFrom);
          },
          onGroupMemberBanned: (
            message: CometChat.Action,
            bannedUser: CometChat.User,
            bannedBy: CometChat.User,
            bannedFrom: CometChat.Group
          ) => {
            this.handleGroupMemberBanned(bannedFrom);
          },
          onMemberAddedToGroup: (
            message: CometChat.Action,
            userAdded: CometChat.User,
            userAddedBy: CometChat.User,
            userAddedIn: CometChat.Group
          ) => {
            this.handleMemberAddedToGroup(userAddedIn);
          },
          onGroupMemberScopeChanged: (
            message: CometChat.Action,
            changedUser: CometChat.User,
            newScope: string,
            oldScope: string,
            changedGroup: CometChat.Group
          ) => {
            this.handleGroupMemberScopeChanged(changedUser, newScope, oldScope, changedGroup);
          },
        })
      );
    } catch (error) {
      this.handleError(error, 'Error setting up group member listener');
    }
  }

  /**
   * Handle group member joined event
   * Increments member count if the group matches the current group
   *
   * @param group - The group where a member joined
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleGroupMemberJoined(group: CometChat.Group): void {
    try {
      // Only update if the event is for the current group being displayed
      if (this.currentGroupId && group.getGuid() === this.currentGroupId) {
        this.incrementGroupMemberCount();
      }
    } catch (error) {
      this.handleError(error, 'Error handling group member joined');
    }
  }

  /**
   * Handle group member left event
   * Decrements member count if the group matches the current group
   *
   * @param group - The group where a member left
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleGroupMemberLeft(group: CometChat.Group): void {
    try {
      // Only update if the event is for the current group being displayed
      if (this.currentGroupId && group.getGuid() === this.currentGroupId) {
        this.decrementGroupMemberCount();
      }
    } catch (error) {
      this.handleError(error, 'Error handling group member left');
    }
  }

  /**
   * Handle group member kicked event
   * Decrements member count if the group matches the current group
   *
   * @param group - The group where a member was kicked
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleGroupMemberKicked(group: CometChat.Group): void {
    try {
      // Only update if the event is for the current group being displayed
      if (this.currentGroupId && group.getGuid() === this.currentGroupId) {
        this.decrementGroupMemberCount();
      }
    } catch (error) {
      this.handleError(error, 'Error handling group member kicked');
    }
  }

  /**
   * Handle group member banned event
   * Decrements member count if the group matches the current group
   *
   * @param group - The group where a member was banned
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleGroupMemberBanned(group: CometChat.Group): void {
    try {
      // Only update if the event is for the current group being displayed
      if (this.currentGroupId && group.getGuid() === this.currentGroupId) {
        this.decrementGroupMemberCount();
      }
    } catch (error) {
      this.handleError(error, 'Error handling group member banned');
    }
  }

  /**
   * Handle member added to group event
   * Increments member count if the group matches the current group
   *
   * @param group - The group where a member was added
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleMemberAddedToGroup(group: CometChat.Group): void {
    try {
      // Only update if the event is for the current group being displayed
      if (this.currentGroupId && group.getGuid() === this.currentGroupId) {
        this.incrementGroupMemberCount();
      }
    } catch (error) {
      this.handleError(error, 'Error handling member added to group');
    }
  }

  /**
   * Handle group member scope changed event
   * This event is for scope updates (e.g., member to admin) - no count change needed
   * Can be used for future enhancements like updating UI for scope changes
   *
   * @param user - The user whose scope changed
   * @param newScope - The new scope of the user
   * @param oldScope - The old scope of the user
   * @param group - The group where the scope change occurred
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleGroupMemberScopeChanged(
    user: CometChat.User,
    newScope: string,
    oldScope: string,
    group: CometChat.Group
  ): void {
    try {
      // Only process if the event is for the current group being displayed
      if (this.currentGroupId && group.getGuid() === this.currentGroupId) {
        // Scope changes don't affect member count
        // This handler is provided for future enhancements
        // such as updating UI when a member becomes admin/moderator
      }
    } catch (error) {
      this.handleError(error, 'Error handling group member scope changed');
    }
  }

  /**
   * Remove the group member listener
   * Should be called during cleanup
   * @see Requirements 14.4
   */
  removeGroupMemberListener(): void {
    try {
      // Remove the group listener
      CometChat.removeGroupListener(this.groupListenerId);

      // Clear group tracking
      this.currentGroupId = null;
    } catch (error) {
      // Log but don't propagate during cleanup
      CometChatLogger.error('MessageHeaderService', 'Error removing group member listener:', error);
    }
  }

  // ==================== Connection Listener ====================

  /**
   * Set up connection listener to track SDK connection state
   * Handles onConnected and onDisconnected events from CometChat SDK
   * On reconnection, optionally refreshes user status
   * @see Requirements 14.4, 14.5
   */
  setupConnectionListener(): void {
    try {
      // Remove any existing connection listener before setting up a new one
      CometChat.removeConnectionListener(this.connectionListenerId);

      CometChat.addConnectionListener(
        this.connectionListenerId,
        new CometChat.ConnectionListener({
          onConnected: () => {
            this.handleConnected();
          },
          onDisconnected: () => {
            this.handleDisconnected();
          },
        })
      );
    } catch (error) {
      this.handleError(error, 'Error setting up connection listener');
    }
  }

  /**
   * Handle SDK connected event
   * Updates connection status to 'connected' and optionally refreshes user status
   * Implements recovery for reconnection scenarios
   * @private
   * @see Requirements 14.5
   */
  private handleConnected(): void {
    try {
      // Update connection status signal
      this.connectionStatusSignal.set('connected');

      // Refresh user status on reconnection (recovery mechanism)
      const currentUser = this.userSignal();
      if (currentUser) {
        // Refresh user status by fetching latest user data
        this.refreshUserStatus(currentUser.getUid());
      }
    } catch (error) {
      this.handleError(error, 'Error handling connected event');
    }
  }

  /**
   * Handle SDK disconnected event
   * Updates connection status to 'disconnected'
   * @private
   * @see Requirements 14.1, 14.3
   */
  private handleDisconnected(): void {
    try {
      // Update connection status signal
      this.connectionStatusSignal.set('disconnected');
    } catch (error) {
      this.handleError(error, 'Error handling disconnected event');
    }
  }

  /**
   * Refresh user status by fetching latest user data from SDK
   * Called on reconnection to ensure status is up-to-date
   * Uses retry logic for recoverable errors
   *
   * @param userId - The user ID to refresh status for
   * @private
   * @see Requirements 14.5
   */
  private async refreshUserStatus(userId: string): Promise<void> {
    // Use retry logic for this recoverable operation
    const result = await this.executeWithRetry(
      async () => CometChat.getUser(userId),
      'Error refreshing user status'
    );

    if (result) {
      try {
        const status = result.getStatus?.();
        this.userStatusSignal.set(status || 'offline');

        // Update lastActiveAt for offline users
        if (status === 'offline') {
          const lastActiveAt = result.getLastActiveAt?.();
          this.lastActiveAtSignal.set(lastActiveAt || null);
        } else {
          this.lastActiveAtSignal.set(null);
        }
      } catch (error) {
        this.handleError(error, 'Error processing refreshed user status');
      }
    }
  }

  /**
   * Remove the connection listener
   * Should be called during cleanup
   * @see Requirements 14.4
   */
  removeConnectionListener(): void {
    try {
      CometChat.removeConnectionListener(this.connectionListenerId);
    } catch (error) {
      // Log but don't propagate during cleanup
      CometChatLogger.error('MessageHeaderService', 'Error removing connection listener:', error);
    }
  }

  // ==================== Listener Management ====================

  /**
   * Set up all relevant listeners for the given entity
   * First removes any existing listeners, then sets up new ones based on entity type
   *
   * For 'user' type:
   * - Sets up user status listener to track online/offline status
   * - Sets up typing listener to track typing events
   * - Sets up connection listener for reconnection handling
   *
   * For 'group' type:
   * - Sets up group member listener to track member join/leave/kick/ban events
   * - Sets up typing listener to track typing events in the group
   * - Sets up connection listener for reconnection handling
   *
   * @param entityId - The user ID or group ID to set up listeners for
   * @param entityType - The type of entity ('user' or 'group')
   * @see Requirements 14.4
   *
   * @example
   * // For user conversation
   * messageHeaderService.setupListeners('user123', 'user');
   *
   * @example
   * // For group conversation
   * messageHeaderService.setupListeners('group456', 'group');
   */
  setupListeners(entityId: string, entityType: 'user' | 'group'): void {
    try {
      // Validate entityId
      if (!entityId) {
        throw new Error('Entity ID is required for setting up listeners');
      }

      // First, remove any existing listeners to prevent duplicates
      this.removeAllListeners();

      // Set up listeners based on entity type
      if (entityType === 'user') {
        // For user conversations:
        // - Listen for user status changes (online/offline)
        // - Listen for typing events from this user
        this.setupUserStatusListener(entityId);
        this.setupTypingListener(entityId, 'user');
      } else if (entityType === 'group') {
        // For group conversations:
        // - Listen for group member events (join/leave/kick/ban)
        // - Listen for typing events in this group
        this.setupGroupMemberListener(entityId);
        this.setupTypingListener(entityId, 'group');
      }

      // Always set up connection listener for reconnection handling
      this.setupConnectionListener();
    } catch (error) {
      this.handleError(error, 'Error setting up listeners');
    }
  }

  /**
   * Remove all SDK listeners
   * Removes user status, typing, group member, and connection listeners
   * Should be called before setting up new listeners or during cleanup
   *
   * @private
   * @see Requirements 14.4
   */
  private removeAllListeners(): void {
    try {
      // Remove user status listener
      this.removeUserStatusListener();

      // Remove typing listener (also clears typing timeout and indicator)
      this.removeTypingListener();

      // Remove group member listener
      this.removeGroupMemberListener();

      // Remove connection listener
      this.removeConnectionListener();
    } catch (error) {
      // Log but don't propagate during cleanup
      CometChatLogger.error('MessageHeaderService', 'Error removing all listeners:', error);
    }
  }

  /**
   * Clean up the service by removing all listeners and resetting state
   * Should be called when the component using this service is destroyed
   *
   * This method:
   * 1. Removes all SDK listeners (user status, typing, group member, connection)
   * 2. Resets all signals to their initial values
   * 3. Clears the error callback
   *
   * @see Requirements 14.4
   *
   * @example
   * // In component ngOnDestroy
   * ngOnDestroy(): void {
   *   this.messageHeaderService.cleanup();
   * }
   */
  cleanup(): void {
    try {
      // Remove all SDK listeners
      this.removeAllListeners();

      // Reset all signals to initial state (also clears error callback)
      this.resetState();
    } catch (error) {
      // Log but don't propagate during cleanup to avoid infinite loops
      CometChatLogger.error('MessageHeaderService', 'Error during cleanup:', error);
    }
  }
}
