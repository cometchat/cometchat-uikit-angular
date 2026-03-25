import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ConversationsService } from './conversations.service';

/**
 * ChatStateService
 *
 * Centralized service for managing active chat state across the CometChat Angular UIKit.
 *
 * ## Overview
 *
 * This service provides a single source of truth for the currently active chat entity
 * (User, Group, or Conversation) in the application. It implements the Hybrid Approach
 * pattern, allowing components to work with either:
 *
 * 1. **@Input properties** (backward compatible) - Components can receive user/group via props
 * 2. **Service-based state** (new approach) - Components automatically read from this service
 *
 * ## Architecture
 *
 * The service uses Angular Signals for reactive state management with improved performance
 * and change detection. It also maintains an Observable API for backward compatibility
 * with RxJS-based code.
 *
 * ### State Management
 *
 * - **Signals**: Provide synchronous, fine-grained reactivity with automatic dependency tracking
 * - **Observables**: Provide asynchronous, stream-based reactivity for RxJS integration
 * - **Mutual Exclusivity**: Only one chat entity (User OR Group) can be active at a time
 *
 * ### Key Features
 *
 * - **Type-safe**: Full TypeScript support with CometChat SDK types
 * - **Reactive**: Automatic UI updates when state changes
 * - **Flexible**: Works with both signals and observables
 * - **Backward Compatible**: Existing code using props continues to work
 *
 * ## Usage Patterns
 *
 * ### Pattern 1: Signal-based (Recommended for new code)
 *
 * ```typescript
 * export class MyComponent {
 *   private chatStateService = inject(ChatStateService);
 *
 *   // Read signal value
 *   activeUser = this.chatStateService.activeUser;
 *
 *   // Use in template
 *   // <div>{{ activeUser()?.getName() }}</div>
 *
 *   // Set active user
 *   selectUser(user: CometChat.User) {
 *     this.chatStateService.setActiveUser(user);
 *   }
 * }
 * ```
 *
 * ### Pattern 2: Observable-based (For RxJS integration)
 *
 * ```typescript
 * export class MyComponent implements OnInit {
 *   private chatStateService = inject(ChatStateService);
 *
 *   ngOnInit() {
 *     this.chatStateService.activeUser$.subscribe(user => {
 *       console.log('Active user changed:', user);
 *     });
 *   }
 * }
 * ```
 *
 * ### Pattern 3: Snapshot value (One-time read)
 *
 * ```typescript
 * export class MyComponent {
 *   private chatStateService = inject(ChatStateService);
 *
 *   sendMessage() {
 *     const user = this.chatStateService.getActiveUser();
 *     if (user) {
 *       // Send message to user
 *     }
 *   }
 * }
 * ```
 *
 * ### Pattern 4: Hybrid Approach (Component with props)
 *
 * ```typescript
 * export class MessageComponent {
 *   private chatStateService = inject(ChatStateService);
 *
 *   @Input() user?: CometChat.User; // Optional prop
 *
 *   // Use prop if provided, otherwise use service
 *   activeUser = computed(() =>
 *     this.user ?? this.chatStateService.activeUser()
 *   );
 * }
 * ```
 *
 * ## Mutual Exclusivity
 *
 * The service enforces mutual exclusivity between User and Group:
 * - Setting a User automatically clears the active Group
 * - Setting a Group automatically clears the active User
 * - Only one chat entity can be active at any given time
 *
 * This prevents ambiguous states and ensures components always know which
 * entity they're working with.
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({
  providedIn: 'root',
})
export class ChatStateService {
  // ==================== Service Injection ====================

  /**
   * ConversationsService for clearing internal active conversation state
   * @private
   */
  private conversationsService = inject(ConversationsService);

  // ==================== Private Signals ====================

  /**
   * Private signal for active user state
   * @private
   * @internal
   */
  private activeUserSignal = signal<CometChat.User | null>(null);

  /**
   * Private signal for active group state
   * @private
   * @internal
   */
  private activeGroupSignal = signal<CometChat.Group | null>(null);

  /**
   * Private signal for active conversation state
   * @private
   * @internal
   */
  private activeConversationSignal = signal<CometChat.Conversation | null>(null);

  // ==================== Public Readonly Signals ====================

  /**
   * Public readonly signal for the currently active user
   *
   * Use this signal in components for reactive, synchronous access to the active user.
   * The signal automatically tracks dependencies and triggers updates when the value changes.
   *
   * @readonly
   * @returns A readonly signal containing the active User or null
   *
   * @example
   * ```typescript
   * // In component
   * activeUser = this.chatStateService.activeUser;
   *
   * // In template
   * <div *ngIf="activeUser()">
   *   Chatting with: {{ activeUser()!.getName() }}
   * </div>
   *
   * // In computed
   * userName = computed(() => this.activeUser()?.getName() ?? 'No user');
   * ```
   */
  readonly activeUser = this.activeUserSignal.asReadonly();

  /**
   * Public readonly signal for the currently active group
   *
   * Use this signal in components for reactive, synchronous access to the active group.
   * The signal automatically tracks dependencies and triggers updates when the value changes.
   *
   * @readonly
   * @returns A readonly signal containing the active Group or null
   *
   * @example
   * ```typescript
   * // In component
   * activeGroup = this.chatStateService.activeGroup;
   *
   * // In template
   * <div *ngIf="activeGroup()">
   *   Group: {{ activeGroup()!.getName() }}
   * </div>
   *
   * // In computed
   * groupName = computed(() => this.activeGroup()?.getName() ?? 'No group');
   * ```
   */
  readonly activeGroup = this.activeGroupSignal.asReadonly();

  /**
   * Public readonly signal for the currently active conversation
   *
   * Use this signal in components for reactive, synchronous access to the active conversation.
   * The signal automatically tracks dependencies and triggers updates when the value changes.
   *
   * @readonly
   * @returns A readonly signal containing the active Conversation or null
   *
   * @example
   * ```typescript
   * // In component
   * activeConversation = this.chatStateService.activeConversation;
   *
   * // In template
   * <div *ngIf="activeConversation()">
   *   Conversation ID: {{ activeConversation()!.getConversationId() }}
   * </div>
   * ```
   */
  readonly activeConversation = this.activeConversationSignal.asReadonly();

  // ==================== Public Observables ====================

  /**
   * Observable stream for the currently active user
   *
   * Use this observable for RxJS-based reactivity and integration with existing
   * observable-based code. Emits whenever the active user changes.
   *
   * @readonly
   * @returns An observable stream of User or null
   *
   * @example
   * ```typescript
   * // Subscribe to user changes
   * this.chatStateService.activeUser$.subscribe(user => {
   *   if (user) {
   *     console.log('Active user:', user.getName());
   *     this.loadUserData(user);
   *   }
   * });
   *
   * // Use with async pipe in template
   * <div *ngIf="chatStateService.activeUser$ | async as user">
   *   {{ user.getName() }}
   * </div>
   *
   * // Combine with other observables
   * combineLatest([
   *   this.chatStateService.activeUser$,
   *   this.messagesService.messages$
   * ]).subscribe(([user, messages]) => {
   *   // Handle combined data
   * });
   * ```
   */
  readonly activeUser$: Observable<CometChat.User | null> = toObservable(this.activeUserSignal);

  /**
   * Observable stream for the currently active group
   *
   * Use this observable for RxJS-based reactivity and integration with existing
   * observable-based code. Emits whenever the active group changes.
   *
   * @readonly
   * @returns An observable stream of Group or null
   *
   * @example
   * ```typescript
   * // Subscribe to group changes
   * this.chatStateService.activeGroup$.subscribe(group => {
   *   if (group) {
   *     console.log('Active group:', group.getName());
   *     this.loadGroupMembers(group);
   *   }
   * });
   *
   * // Use with async pipe in template
   * <div *ngIf="chatStateService.activeGroup$ | async as group">
   *   {{ group.getName() }}
   * </div>
   * ```
   */
  readonly activeGroup$: Observable<CometChat.Group | null> = toObservable(this.activeGroupSignal);

  /**
   * Observable stream for the currently active conversation
   *
   * Use this observable for RxJS-based reactivity and integration with existing
   * observable-based code. Emits whenever the active conversation changes.
   *
   * @readonly
   * @returns An observable stream of Conversation or null
   *
   * @example
   * ```typescript
   * // Subscribe to conversation changes
   * this.chatStateService.activeConversation$.subscribe(conversation => {
   *   if (conversation) {
   *     console.log('Active conversation:', conversation.getConversationId());
   *     this.loadMessages(conversation);
   *   }
   * });
   * ```
   */
  readonly activeConversation$: Observable<CometChat.Conversation | null> = toObservable(
    this.activeConversationSignal
  );

  constructor() {
    // Service is ready to use immediately
    // No initialization required
  }

  // ==================== Setters ====================

  /**
   * Sets the active user and clears the active group
   *
   * When a user is set as active, the active group is automatically cleared
   * to maintain mutual exclusivity (only one chat entity can be active at a time).
   *
   * This method triggers updates to:
   * - `activeUser` signal
   * - `activeUser$` observable
   * - `activeGroup` signal (cleared)
   * - `activeGroup$` observable (cleared)
   *
   * All subscribed components will be notified of the change.
   *
   * @param user - The user to set as active, or null to clear the active user
   *
   * @example
   * ```typescript
   * // Set a user as active (e.g., when user clicks on a user in the list)
   * handleUserClick(user: CometChat.User) {
   *   this.chatStateService.setActiveUser(user);
   *   // Active group is automatically cleared
   * }
   *
   * // Clear active user (e.g., when closing chat)
   * closeChat() {
   *   this.chatStateService.setActiveUser(null);
   * }
   * ```
   */
  setActiveUser(user: CometChat.User | null): void {
    this.activeUserSignal.set(user);
    // Clear group when user is set (mutual exclusivity)
    if (user !== null) {
      this.activeGroupSignal.set(null);
    }
  }

  /**
   * Sets the active group and clears the active user
   *
   * When a group is set as active, the active user is automatically cleared
   * to maintain mutual exclusivity (only one chat entity can be active at a time).
   *
   * This method triggers updates to:
   * - `activeGroup` signal
   * - `activeGroup$` observable
   * - `activeUser` signal (cleared)
   * - `activeUser$` observable (cleared)
   *
   * All subscribed components will be notified of the change.
   *
   * @param group - The group to set as active, or null to clear the active group
   *
   * @example
   * ```typescript
   * // Set a group as active (e.g., when user clicks on a group in the list)
   * handleGroupClick(group: CometChat.Group) {
   *   this.chatStateService.setActiveGroup(group);
   *   // Active user is automatically cleared
   * }
   *
   * // Clear active group (e.g., when closing chat)
   * closeChat() {
   *   this.chatStateService.setActiveGroup(null);
   * }
   * ```
   */
  setActiveGroup(group: CometChat.Group | null): void {
    this.activeGroupSignal.set(group);
    // Clear user when group is set (mutual exclusivity)
    if (group !== null) {
      this.activeUserSignal.set(null);
    }
  }

  /**
   * Sets the active conversation and extracts user/group from it
   *
   * When a conversation is set, this method automatically extracts the
   * `conversationWith` entity (User or Group) and sets it as the active entity
   * using `setActiveUser()` or `setActiveGroup()`.
   *
   * This ensures that message components can work seamlessly with either:
   * - Direct user/group references (from Users/Groups lists)
   * - Conversation objects (from Conversations list)
   *
   * The extraction process:
   * 1. Calls `conversation.getConversationWith()` to get the entity
   * 2. Checks if it's a User or Group using `instanceof`
   * 3. Calls the appropriate setter (`setActiveUser` or `setActiveGroup`)
   * 4. The setter handles mutual exclusivity automatically
   *
   * @param conversation - The conversation to set as active, or null to clear
   *
   * @example
   * ```typescript
   * // Set a conversation as active (e.g., when user clicks on a conversation)
   * handleConversationClick(conversation: CometChat.Conversation) {
   *   this.chatStateService.setActiveConversation(conversation);
   *
   *   // The service automatically:
   *   // 1. Extracts the User or Group from conversation.getConversationWith()
   *   // 2. Sets it as active using setActiveUser() or setActiveGroup()
   *   // 3. Maintains mutual exclusivity
   * }
   *
   * // Clear active conversation
   * closeChat() {
   *   this.chatStateService.setActiveConversation(null);
   *   // This also clears activeUser and activeGroup
   * }
   * ```
   */
  setActiveConversation(conversation: CometChat.Conversation | null): void {
    this.activeConversationSignal.set(conversation);

    if (conversation != null) {
      // Extract the conversationWith entity (User or Group)
      const conversationWith = conversation.getConversationWith();

      // Set the appropriate entity based on conversation type
      if (conversationWith instanceof CometChat.User) {
        this.setActiveUser(conversationWith);
      } else if (conversationWith instanceof CometChat.Group) {
        this.setActiveGroup(conversationWith);
      }
    } else {
      // Clear both user and group when conversation is cleared
      this.activeUserSignal.set(null);
      this.activeGroupSignal.set(null);
    }
  }

  // ==================== Getters (Snapshot Values) ====================

  /**
   * Gets the current active user (snapshot value)
   *
   * Returns the current value of the active user signal without reactivity.
   * This is a one-time read that does not subscribe to changes.
   *
   * Use this when you need the current value once without subscribing to changes,
   * such as in event handlers or one-time operations.
   *
   * For reactive updates, use the `activeUser` signal or `activeUser$` observable instead.
   *
   * @returns The currently active user, or null if no user is active
   *
   * @example
   * ```typescript
   * // Get current user value in an event handler
   * sendMessage(text: string) {
   *   const user = this.chatStateService.getActiveUser();
   *   if (user) {
   *     this.messageService.sendTextMessage(user, text);
   *   } else {
   *     console.error('No active user');
   *   }
   * }
   *
   * // Check if user is active before performing action
   * canSendMessage(): boolean {
   *   return this.chatStateService.getActiveUser() !== null;
   * }
   * ```
   */
  getActiveUser(): CometChat.User | null {
    return this.activeUserSignal();
  }

  /**
   * Gets the current active group (snapshot value)
   *
   * Returns the current value of the active group signal without reactivity.
   * This is a one-time read that does not subscribe to changes.
   *
   * Use this when you need the current value once without subscribing to changes,
   * such as in event handlers or one-time operations.
   *
   * For reactive updates, use the `activeGroup` signal or `activeGroup$` observable instead.
   *
   * @returns The currently active group, or null if no group is active
   *
   * @example
   * ```typescript
   * // Get current group value in an event handler
   * sendMessage(text: string) {
   *   const group = this.chatStateService.getActiveGroup();
   *   if (group) {
   *     this.messageService.sendTextMessage(group, text);
   *   } else {
   *     console.error('No active group');
   *   }
   * }
   *
   * // Check if group is active before performing action
   * canSendMessage(): boolean {
   *   return this.chatStateService.getActiveGroup() !== null;
   * }
   * ```
   */
  getActiveGroup(): CometChat.Group | null {
    return this.activeGroupSignal();
  }

  /**
   * Gets the current active conversation (snapshot value)
   *
   * Returns the current value of the active conversation signal without reactivity.
   * This is a one-time read that does not subscribe to changes.
   *
   * Use this when you need the current value once without subscribing to changes,
   * such as in event handlers or one-time operations.
   *
   * For reactive updates, use the `activeConversation` signal or `activeConversation$` observable instead.
   *
   * @returns The currently active conversation, or null if no conversation is active
   *
   * @example
   * ```typescript
   * // Get current conversation value
   * loadMessages() {
   *   const conversation = this.chatStateService.getActiveConversation();
   *   if (conversation) {
   *     const conversationId = conversation.getConversationId();
   *     this.messageService.fetchMessages(conversationId);
   *   }
   * }
   *
   * // Check conversation type
   * isGroupConversation(): boolean {
   *   const conversation = this.chatStateService.getActiveConversation();
   *   return conversation?.getConversationType() === 'group';
   * }
   * ```
   */
  getActiveConversation(): CometChat.Conversation | null {
    return this.activeConversationSignal();
  }

  // ==================== Utility Methods ====================

  /**
   * Gets the currently active chat entity (User or Group)
   *
   * This utility method returns whichever chat entity is currently active,
   * without needing to check both `activeUser` and `activeGroup` separately.
   *
   * Due to mutual exclusivity, only one entity can be active at a time:
   * - If a User is active, returns the User
   * - If a Group is active, returns the Group
   * - If neither is active, returns null
   *
   * User takes precedence if both are somehow set (though this should never
   * happen due to mutual exclusivity enforcement).
   *
   * This is particularly useful in message components that need to work with
   * either users or groups without caring about the specific type.
   *
   * @returns The active User if set, otherwise the active Group if set, otherwise null
   *
   * @example
   * ```typescript
   * // Use in message components that work with both users and groups
   * sendMessage(text: string) {
   *   const recipient = this.chatStateService.getActiveChatEntity();
   *
   *   if (recipient instanceof CometChat.User) {
   *     console.log('Sending to user:', recipient.getName());
   *     this.messageService.sendToUser(recipient, text);
   *   } else if (recipient instanceof CometChat.Group) {
   *     console.log('Sending to group:', recipient.getName());
   *     this.messageService.sendToGroup(recipient, text);
   *   } else {
   *     console.error('No active chat entity');
   *   }
   * }
   *
   * // Check if any chat is active
   * hasActiveChat(): boolean {
   *   return this.chatStateService.getActiveChatEntity() !== null;
   * }
   *
   * // Get entity name regardless of type
   * getActiveChatName(): string {
   *   const entity = this.chatStateService.getActiveChatEntity();
   *   return entity?.getName() ?? 'No active chat';
   * }
   * ```
   */
  getActiveChatEntity(): CometChat.User | CometChat.Group | null {
    // User takes precedence (though mutual exclusivity ensures only one is set)
    const user = this.activeUserSignal();
    if (user !== null) {
      return user;
    }

    // Return group if no user is active
    const group = this.activeGroupSignal();
    return group;
  }

  /**
   * Clears all active chat states
   *
   * This method resets all three signals (activeUser, activeGroup, activeConversation)
   * to null, effectively clearing the entire chat state.
   *
   * All components subscribed to these signals (via signals or observables) will be
   * notified of the change and can react accordingly (e.g., hide message area, clear UI).
   *
   * Common use cases:
   * - User logs out of the application
   * - User navigates away from the chat interface
   * - Application needs to reset to initial state
   * - Closing all open chats
   *
   * @example
   * ```typescript
   * // Clear all chat state on logout
   * handleLogout() {
   *   this.chatStateService.clearActiveChat();
   *   CometChat.logout();
   *   this.router.navigate(['/login']);
   * }
   *
   * // Clear state when navigating away from chat
   * ngOnDestroy() {
   *   this.chatStateService.clearActiveChat();
   * }
   *
   * // Clear state when closing chat window
   * closeChat() {
   *   this.chatStateService.clearActiveChat();
   *   this.showChat = false;
   * }
   *
   * // Reset to initial state
   * resetApplication() {
   *   this.chatStateService.clearActiveChat();
   *   this.loadInitialData();
   * }
   * ```
   */
  clearActiveChat(): void {
    this.activeUserSignal.set(null);
    this.activeGroupSignal.set(null);
    this.activeConversationSignal.set(null);
    // Also clear the internal active conversation in ConversationsService
    // to remove visual highlighting from conversation items
    this.conversationsService.setActiveConversation(null);
  }
}
