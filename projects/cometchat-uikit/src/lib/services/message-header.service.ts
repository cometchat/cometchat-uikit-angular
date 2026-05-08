import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import type { ErrorCallback } from './message-header.types';
import {
  addUserStatusListener,
  removeUserStatusListener,
  addTypingListener,
  removeTypingListener,
  addGroupMemberListener,
  removeGroupMemberListener,
  addConnectionListener,
  removeConnectionListener,
} from './message-header.listeners';
import {
  handleServiceError,
  executeWithRetry,
  isTypingEventRelevant,
  addTypingUser,
  removeTypingUserFromMap,
  getTypingUsersArray,
  type TypingUserEntry,
} from './message-header.utils';

// Re-export types for backward compatibility
export type { ErrorCallback } from './message-header.types';

/**
 * MessageHeaderService
 *
 * Service responsible for managing message header state and SDK interactions.
 * Implements the Hybrid Approach pattern where service provides defaults
 * but component @Input properties can override them.
 *
 * Uses Angular Signals for reactive state management.
 *
 * @Injectable
 * @see Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */
@Injectable()
export class MessageHeaderService {
  // ==================== Listener IDs ====================
  private userListenerId = `message_header_user_${Date.now()}`;
  private messageListenerId = `message_header_message_${Date.now()}`;
  private groupListenerId = `message_header_group_${Date.now()}`;
  private connectionListenerId = `message_header_connection_${Date.now()}`;

  // ==================== Typing Configuration ====================
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private readonly TYPING_TIMEOUT_MS = 2000;
  private currentTypingEntityId: string | null = null;
  private currentTypingEntityType: 'user' | 'group' | null = null;
  private currentGroupId: string | null = null;
  private typingUsersMap = new Map<string, TypingUserEntry>();

  // ==================== State Signals ====================
  private userSignal = signal<CometChat.User | null>(null);
  private groupSignal = signal<CometChat.Group | null>(null);
  private userStatusSignal = signal<string>('offline');
  private typingIndicatorSignal = signal<CometChat.TypingIndicator | null>(null);
  private typingUsersSignal = signal<CometChat.User[]>([]);
  private groupMemberCountSignal = signal<number>(0);
  private lastActiveAtSignal = signal<number | null>(null);
  private connectionStatusSignal = signal<'connected' | 'disconnected'>('connected');

  // ==================== Error Handling ====================
  private errorCallback: ErrorCallback | null = null;

  // ==================== Public Signal API (read-only) ====================
  readonly user = this.userSignal.asReadonly();
  readonly group = this.groupSignal.asReadonly();
  readonly userStatus = this.userStatusSignal.asReadonly();
  readonly typingIndicator = this.typingIndicatorSignal.asReadonly();
  readonly typingUsers = this.typingUsersSignal.asReadonly();
  readonly groupMemberCount = this.groupMemberCountSignal.asReadonly();
  readonly lastActiveAt = this.lastActiveAtSignal.asReadonly();
  readonly connectionStatus = this.connectionStatusSignal.asReadonly();

  private destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      try {
        this.removeAllListeners();
        this.resetState();
      } catch (error) {
        CometChatLogger.error('MessageHeaderService', 'Error during DestroyRef cleanup:', error);
      }
    });
  }

  // ==================== Error Callback ====================

  setErrorCallback(callback: ErrorCallback | null): void {
    this.errorCallback = callback;
  }

  private handleError(error: unknown, context: string): void {
    handleServiceError(error, context, this.errorCallback);
  }

  // ==================== Public State Methods ====================

  setUser(user: CometChat.User): void {
    try {
      if (!user) throw new Error('User object is required');
      this.groupSignal.set(null);
      this.groupMemberCountSignal.set(0);
      this.userSignal.set(user);
      this.userStatusSignal.set(user.getStatus?.() || 'offline');
      this.lastActiveAtSignal.set(user.getLastActiveAt?.() || null);
      this.typingIndicatorSignal.set(null);
      this.typingUsersMap.clear();
      this.typingUsersSignal.set([]);
    } catch (error) { this.handleError(error, 'Error setting user'); }
  }

  setGroup(group: CometChat.Group): void {
    try {
      if (!group) throw new Error('Group object is required');
      this.userSignal.set(null);
      this.userStatusSignal.set('offline');
      this.lastActiveAtSignal.set(null);
      this.groupSignal.set(group);
      this.groupMemberCountSignal.set(group.getMembersCount?.() || 0);
      this.typingIndicatorSignal.set(null);
      this.typingUsersMap.clear();
      this.typingUsersSignal.set([]);
    } catch (error) { this.handleError(error, 'Error setting group'); }
  }

  updateUserStatus(status: string): void { this.userStatusSignal.set(status); }
  updateLastActiveAt(timestamp: number | null): void { this.lastActiveAtSignal.set(timestamp); }
  setTypingIndicator(typingIndicator: CometChat.TypingIndicator | null): void { this.typingIndicatorSignal.set(typingIndicator); }
  updateGroupMemberCount(count: number): void { this.groupMemberCountSignal.set(count); }
  incrementGroupMemberCount(): void { this.groupMemberCountSignal.set(this.groupMemberCountSignal() + 1); }
  decrementGroupMemberCount(): void { this.groupMemberCountSignal.set(Math.max(0, this.groupMemberCountSignal() - 1)); }

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
      this.errorCallback = null;
    } catch (error) {
      CometChatLogger.error('MessageHeaderService', 'Error resetting state:', error);
    }
  }

  // ==================== Listener Setup ====================

  setupListeners(entityId: string, entityType: 'user' | 'group'): void {
    try {
      if (!entityId) throw new Error('Entity ID is required for setting up listeners');
      this.removeAllListeners();
      if (entityType === 'user') {
        this.setupUserStatusListener(entityId);
        this.setupTypingListener(entityId, 'user');
      } else {
        this.setupGroupMemberListener(entityId);
        this.setupTypingListener(entityId, 'group');
      }
      this.setupConnectionListener();
    } catch (error) { this.handleError(error, 'Error setting up listeners'); }
  }

  setupUserStatusListener(userId: string): void {
    try {
      if (!userId) throw new Error('User ID is required for status listener');
      removeUserStatusListener(this.userListenerId);
      addUserStatusListener(
        this.userListenerId,
        (user) => this.handleUserStatusChange(user, 'online'),
        (user) => this.handleUserStatusChange(user, 'offline')
      );
    } catch (error) { this.handleError(error, 'Error setting up user status listener'); }
  }

  setupTypingListener(entityId: string, entityType: 'user' | 'group'): void {
    try {
      if (!entityId) throw new Error('Entity ID is required for typing listener');
      this.currentTypingEntityId = entityId;
      this.currentTypingEntityType = entityType;
      removeTypingListener(this.messageListenerId);
      this.clearTypingTimeout();
      this.typingIndicatorSignal.set(null);
      addTypingListener(
        this.messageListenerId,
        (indicator) => this.handleTypingStarted(indicator),
        (indicator) => this.handleTypingEnded(indicator)
      );
    } catch (error) { this.handleError(error, 'Error setting up typing listener'); }
  }

  setupGroupMemberListener(groupId: string): void {
    try {
      if (!groupId) throw new Error('Group ID is required for member listener');
      this.currentGroupId = groupId;
      removeGroupMemberListener(this.groupListenerId);
      addGroupMemberListener(this.groupListenerId, {
        onJoined: (_, __, g) => this.handleGroupMemberJoined(g),
        onLeft: (_, __, g) => this.handleGroupMemberLeft(g),
        onKicked: (_, __, ___, g) => this.handleGroupMemberKicked(g),
        onBanned: (_, __, ___, g) => this.handleGroupMemberBanned(g),
        onAdded: (_, __, ___, g) => this.handleMemberAddedToGroup(g),
        onScopeChanged: (_m, _u, _ns, _os, _g) => { /* scope changes don't affect member count */ },
      });
    } catch (error) { this.handleError(error, 'Error setting up group member listener'); }
  }

  setupConnectionListener(): void {
    try {
      removeConnectionListener(this.connectionListenerId);
      addConnectionListener(
        this.connectionListenerId,
        () => this.handleConnected(),
        () => this.handleDisconnected()
      );
    } catch (error) { this.handleError(error, 'Error setting up connection listener'); }
  }

  // ==================== Listener Removal ====================

  removeUserStatusListener(): void {
    try { removeUserStatusListener(this.userListenerId); }
    catch (e) { CometChatLogger.error('MessageHeaderService', 'Error removing user status listener:', e); }
  }

  removeTypingListener(): void {
    try {
      removeTypingListener(this.messageListenerId);
      this.clearTypingTimeout();
      this.typingIndicatorSignal.set(null);
      this.typingUsersMap.clear();
      this.typingUsersSignal.set([]);
      this.currentTypingEntityId = null;
      this.currentTypingEntityType = null;
    } catch (e) { CometChatLogger.error('MessageHeaderService', 'Error removing typing listener:', e); }
  }

  removeGroupMemberListener(): void {
    try { removeGroupMemberListener(this.groupListenerId); this.currentGroupId = null; }
    catch (e) { CometChatLogger.error('MessageHeaderService', 'Error removing group member listener:', e); }
  }

  removeConnectionListener(): void {
    try { removeConnectionListener(this.connectionListenerId); }
    catch (e) { CometChatLogger.error('MessageHeaderService', 'Error removing connection listener:', e); }
  }

  private removeAllListeners(): void {
    try {
      this.removeUserStatusListener();
      this.removeTypingListener();
      this.removeGroupMemberListener();
      this.removeConnectionListener();
    } catch (e) { CometChatLogger.error('MessageHeaderService', 'Error removing all listeners:', e); }
  }

  cleanup(): void {
    try { this.removeAllListeners(); this.resetState(); }
    catch (e) { CometChatLogger.error('MessageHeaderService', 'Error during cleanup:', e); }
  }

  // ==================== Private Event Handlers ====================

  private handleUserStatusChange(user: CometChat.User, status: 'online' | 'offline'): void {
    try {
      const current = this.userSignal();
      if (current && current.getUid() === user.getUid()) {
        this.userStatusSignal.set(status);
        if (status === 'offline') {
          this.lastActiveAtSignal.set(user.getLastActiveAt?.() || Date.now());
        } else {
          this.lastActiveAtSignal.set(null);
        }
      }
    } catch (e) { this.handleError(e, 'Error handling user status change'); }
  }

  private handleTypingStarted(typingIndicator: CometChat.TypingIndicator): void {
    try {
      if (!this.currentTypingEntityId || !this.currentTypingEntityType) return;
      if (!isTypingEventRelevant(typingIndicator, this.currentTypingEntityId, this.currentTypingEntityType)) return;

      this.clearTypingTimeout();
      this.typingIndicatorSignal.set(typingIndicator);

      const sender = typingIndicator.getSender();
      const senderId = sender?.getUid();
      if (this.currentTypingEntityType === 'group' && sender && senderId) {
        addTypingUser(this.typingUsersMap, senderId, sender);
        this.typingUsersSignal.set(getTypingUsersArray(this.typingUsersMap));
        setTimeout(() => {
          if (removeTypingUserFromMap(this.typingUsersMap, senderId)) {
            this.typingUsersSignal.set(getTypingUsersArray(this.typingUsersMap));
          }
        }, this.TYPING_TIMEOUT_MS);
      }

      this.typingTimeout = setTimeout(() => {
        this.typingIndicatorSignal.set(null);
        if (this.currentTypingEntityType === 'group') {
          this.typingUsersMap.clear();
          this.typingUsersSignal.set([]);
        }
      }, this.TYPING_TIMEOUT_MS);
    } catch (e) { this.handleError(e, 'Error handling typing started'); }
  }

  private handleTypingEnded(typingIndicator: CometChat.TypingIndicator): void {
    try {
      if (!this.currentTypingEntityId || !this.currentTypingEntityType) return;
      if (!isTypingEventRelevant(typingIndicator, this.currentTypingEntityId, this.currentTypingEntityType)) return;

      const senderId = typingIndicator.getSender()?.getUid();
      if (this.currentTypingEntityType === 'group' && senderId) {
        removeTypingUserFromMap(this.typingUsersMap, senderId);
        this.typingUsersSignal.set(getTypingUsersArray(this.typingUsersMap));
        if (this.typingUsersMap.size === 0) {
          this.clearTypingTimeout();
          this.typingIndicatorSignal.set(null);
        }
      } else {
        this.clearTypingTimeout();
        this.typingIndicatorSignal.set(null);
      }
    } catch (e) { this.handleError(e, 'Error handling typing ended'); }
  }

  private clearTypingTimeout(): void {
    if (this.typingTimeout) { clearTimeout(this.typingTimeout); this.typingTimeout = undefined; }
  }

  /** Increment count if the event is for the current group. */
  private handleGroupMemberJoined(group: CometChat.Group): void {
    if (this.currentGroupId && group.getGuid() === this.currentGroupId) this.incrementGroupMemberCount();
  }

  /** Decrement count if the event is for the current group. */
  private handleGroupMemberLeft(group: CometChat.Group): void {
    if (this.currentGroupId && group.getGuid() === this.currentGroupId) this.decrementGroupMemberCount();
  }

  private handleGroupMemberKicked(group: CometChat.Group): void {
    if (this.currentGroupId && group.getGuid() === this.currentGroupId) this.decrementGroupMemberCount();
  }

  private handleGroupMemberBanned(group: CometChat.Group): void {
    if (this.currentGroupId && group.getGuid() === this.currentGroupId) this.decrementGroupMemberCount();
  }

  private handleMemberAddedToGroup(group: CometChat.Group): void {
    if (this.currentGroupId && group.getGuid() === this.currentGroupId) this.incrementGroupMemberCount();
  }

  private handleConnected(): void {
    try {
      this.connectionStatusSignal.set('connected');
      const currentUser = this.userSignal();
      if (currentUser) this.refreshUserStatus(currentUser.getUid());
    } catch (e) { this.handleError(e, 'Error handling connected event'); }
  }

  private handleDisconnected(): void {
    try { this.connectionStatusSignal.set('disconnected'); }
    catch (e) { this.handleError(e, 'Error handling disconnected event'); }
  }

  private async refreshUserStatus(userId: string): Promise<void> {
    const result = await executeWithRetry(
      async () => CometChat.getUser(userId),
      'Error refreshing user status',
      this.errorCallback
    );
    if (result) {
      try {
        const status = result.getStatus?.();
        this.userStatusSignal.set(status || 'offline');
        this.lastActiveAtSignal.set(status === 'offline' ? (result.getLastActiveAt?.() || null) : null);
      } catch (e) { this.handleError(e, 'Error processing refreshed user status'); }
    }
  }
}
