import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ConversationsService } from './conversations.service';

/**
 * ChatStateService
 *
 * Centralized service for managing active chat state across the CometChat Angular UIKit.
 * Provides a single source of truth for the currently active chat entity
 * (User, Group, or Conversation) using Angular Signals with Observable API for RxJS integration.
 *
 * Enforces mutual exclusivity: setting a User clears the active Group and vice versa.
 *
 * @Injectable providedIn: 'root'
 */
@Injectable({
  providedIn: 'root',
})
export class ChatStateService {
  private conversationsService = inject(ConversationsService);

  // ==================== Private Signals ====================

  private activeUserSignal = signal<CometChat.User | null>(null);
  private activeGroupSignal = signal<CometChat.Group | null>(null);
  private activeConversationSignal = signal<CometChat.Conversation | null>(null);

  // ==================== Public Readonly Signals ====================

  /**
   * Readonly signal for the currently active user.
   * @example
   * ```typescript
   * activeUser = this.chatStateService.activeUser;
   * // In template: {{ activeUser()?.getName() }}
   * ```
   */
  readonly activeUser = this.activeUserSignal.asReadonly();

  /**
   * Readonly signal for the currently active group.
   * @example
   * ```typescript
   * activeGroup = this.chatStateService.activeGroup;
   * // In template: {{ activeGroup()?.getName() }}
   * ```
   */
  readonly activeGroup = this.activeGroupSignal.asReadonly();

  /**
   * Readonly signal for the currently active conversation.
   */
  readonly activeConversation = this.activeConversationSignal.asReadonly();

  // ==================== Public Observables ====================

  /**
   * Observable stream for the currently active user.
   * @example
   * ```typescript
   * this.chatStateService.activeUser$.subscribe(user => { ... });
   * ```
   */
  readonly activeUser$: Observable<CometChat.User | null> = toObservable(this.activeUserSignal);

  /**
   * Observable stream for the currently active group.
   */
  readonly activeGroup$: Observable<CometChat.Group | null> = toObservable(this.activeGroupSignal);

  /**
   * Observable stream for the currently active conversation.
   */
  readonly activeConversation$: Observable<CometChat.Conversation | null> = toObservable(
    this.activeConversationSignal
  );

  // ==================== Setters ====================

  /**
   * Sets the active user and clears the active group (mutual exclusivity).
   * @param user - The user to set as active, or null to clear
   */
  setActiveUser(user: CometChat.User | null): void {
    this.activeUserSignal.set(user);
    if (user !== null) {
      this.activeGroupSignal.set(null);
    }
  }

  /**
   * Sets the active group and clears the active user (mutual exclusivity).
   * @param group - The group to set as active, or null to clear
   */
  setActiveGroup(group: CometChat.Group | null): void {
    this.activeGroupSignal.set(group);
    if (group !== null) {
      this.activeUserSignal.set(null);
    }
  }

  /**
   * Sets the active conversation and extracts user/group from it.
   * Automatically calls setActiveUser or setActiveGroup based on conversation type.
   * @param conversation - The conversation to set as active, or null to clear
   */
  setActiveConversation(conversation: CometChat.Conversation | null): void {
    this.activeConversationSignal.set(conversation);

    if (conversation != null) {
      const conversationWith = conversation.getConversationWith();
      if (conversationWith instanceof CometChat.User) {
        this.setActiveUser(conversationWith);
      } else if (conversationWith instanceof CometChat.Group) {
        this.setActiveGroup(conversationWith);
      }
    } else {
      this.activeUserSignal.set(null);
      this.activeGroupSignal.set(null);
    }
  }

  // ==================== Getters (Snapshot Values) ====================

  /**
   * Gets the current active user (snapshot, non-reactive).
   * @returns The currently active user, or null
   */
  getActiveUser(): CometChat.User | null {
    return this.activeUserSignal();
  }

  /**
   * Gets the current active group (snapshot, non-reactive).
   * @returns The currently active group, or null
   */
  getActiveGroup(): CometChat.Group | null {
    return this.activeGroupSignal();
  }

  /**
   * Gets the current active conversation (snapshot, non-reactive).
   * @returns The currently active conversation, or null
   */
  getActiveConversation(): CometChat.Conversation | null {
    return this.activeConversationSignal();
  }

  // ==================== Utility Methods ====================

  /**
   * Gets the currently active chat entity (User or Group).
   * Returns User if set, otherwise Group, otherwise null.
   * @returns The active User, Group, or null
   */
  getActiveChatEntity(): CometChat.User | CometChat.Group | null {
    const user = this.activeUserSignal();
    if (user !== null) {
      return user;
    }
    return this.activeGroupSignal();
  }

  /**
   * Clears all active chat states (user, group, conversation).
   * Also clears the internal active conversation in ConversationsService.
   */
  clearActiveChat(): void {
    this.activeUserSignal.set(null);
    this.activeGroupSignal.set(null);
    this.activeConversationSignal.set(null);
    this.conversationsService.setActiveConversation(null);
  }
}
