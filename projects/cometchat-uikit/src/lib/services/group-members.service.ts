import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../Enums/Enums';
import { CometChatUIKitConstants } from '../constants';
import { GroupMemberUtils } from '../utils/GroupMemberUtils';
import {
  CometChatGroupEvents,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
} from '../events/CometChatGroupEvents';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { CometChatLogger } from '../utils/CometChatLogger';
import { ConnectionStateService } from './connection-state.service';

// Re-export for backward compatibility
export type { GroupMembersErrorCallback } from './group-members.types';
import { GroupMembersErrorCallback } from './group-members.types';

/**
 * GroupMembersService
 *
 * Service responsible for managing group member state and SDK interactions.
 * NOT `providedIn: 'root'` — instantiated per component instance to avoid
 * shared state between multiple group member lists.
 *
 * Uses Angular Signals for reactive state management.
 */
@Injectable()
export class GroupMembersService {
  // ==================== State Signals ====================

  private membersSignal = signal<CometChat.GroupMember[]>([]);
  private fetchStateSignal = signal<States>(States.loading);
  private hasMoreSignal = signal<boolean>(true);

  readonly members = this.membersSignal.asReadonly();
  readonly fetchState = this.fetchStateSignal.asReadonly();
  readonly hasMore = this.hasMoreSignal.asReadonly();

  // ==================== Private State ====================

  private groupMembersRequest: CometChat.GroupMembersRequest | null = null;
  private currentGroup: CometChat.Group | null = null;
  private errorCallback: GroupMembersErrorCallback | null = null;

  private userListenerId = `group_members_user_${CometChatUIKitUtility.ID()}`;
  private groupListenerId = `group_members_group_${CometChatUIKitUtility.ID()}`;
  /** Guard: only re-fetch on reconnect after the first fetch has completed. */
  private initialFetchDone = false;

  private connectionState = inject(ConnectionStateService);
  private destroyRef = inject(DestroyRef);

  private static readonly DEFAULT_LIMIT = 30;

  constructor() {
    // Silent reconnect refresh — keeps existing list visible, resets to page 1.
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleReconnect());
  }

  setErrorCallback(callback: GroupMembersErrorCallback | null): void { this.errorCallback = callback; }

  /**
   * Initialize the service with a group and optional custom request builder.
   * Creates the GroupMembersRequestBuilder and fetches the first page.
   */
  initialize(group: CometChat.Group, builder?: CometChat.GroupMembersRequestBuilder): void {
    this.currentGroup = group;
    this.membersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);

    const effectiveBuilder =
      builder ||
      new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(
        GroupMembersService.DEFAULT_LIMIT
      );

    this.groupMembersRequest = effectiveBuilder.build();
    this.fetchNext();
  }

  /**
   * Fetch the next page of group members from the SDK.
   * Appends results without duplicates.
   */
  async fetchNext(): Promise<void> {
    if (!this.groupMembersRequest) {
      return;
    }

    const isInitialFetch =
      this.membersSignal().length === 0 && this.fetchStateSignal() === States.loading;
    const startTime = Date.now();
    const MIN_SHIMMER_TIME = 1000;

    try {
      const newMembers = await this.groupMembersRequest.fetchNext();

      if (isInitialFetch) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_SHIMMER_TIME - elapsed);
        await new Promise<void>(resolve => setTimeout(resolve, remainingTime));
      }

      if (newMembers.length === 0) {
        this.hasMoreSignal.set(false);
        if (this.membersSignal().length === 0) {
          this.fetchStateSignal.set(States.empty);
        }
        return;
      }

      this.appendMembersWithoutDuplicates(newMembers);

      if (newMembers.length < GroupMembersService.DEFAULT_LIMIT) {
        this.hasMoreSignal.set(false);
      }

      this.fetchStateSignal.set(States.loaded);
      this.initialFetchDone = true;
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error fetching members:', error);
      if (this.membersSignal().length === 0) {
        this.fetchStateSignal.set(States.error);
      }
      this.handleError(error);
    }
  }

  /**
   * Search members by keyword. Resets the list and creates a new builder.
   */
  search(keyword: string, searchBuilder?: CometChat.GroupMembersRequestBuilder): void {
    if (!this.currentGroup) {
      return;
    }

    this.membersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);

    let effectiveBuilder: CometChat.GroupMembersRequestBuilder;

    if (searchBuilder) {
      effectiveBuilder = searchBuilder;
      effectiveBuilder.setSearchKeyword(keyword);
    } else {
      effectiveBuilder = new CometChat.GroupMembersRequestBuilder(this.currentGroup.getGuid())
        .setLimit(GroupMembersService.DEFAULT_LIMIT)
        .setSearchKeyword(keyword);
    }

    this.groupMembersRequest = effectiveBuilder.build();
    this.fetchNext();
  }

  // ==================== Member Actions ====================

  /** Kick a member from the group. Calls SDK, removes from list, emits ccGroupMemberKicked event. */
  async kickMember(group: CometChat.Group, member: CometChat.GroupMember): Promise<void> {
    try {
      await CometChat.kickGroupMember(group.getGuid(), member.getUid());
      this.removeMember(member.getUid());
      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        const groupClone = CometChatUIKitUtility.clone(group);
        groupClone.setMembersCount(groupClone.getMembersCount() - 1);
        const actionMessage = GroupMemberUtils.createActionMessage(
          member, CometChatUIKitConstants.groupMemberAction.KICKED, groupClone, loggedInUser
        );
        CometChatGroupEvents.ccGroupMemberKicked.next({
          message: actionMessage, kickedFrom: groupClone, kickedUser: member, kickedBy: loggedInUser,
        } as IGroupMemberKickedBanned);
      }
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error kicking member:', error);
      this.handleError(error);
    }
  }

  /** Ban a member from the group. Calls SDK, removes from list, emits ccGroupMemberBanned event. */
  async banMember(group: CometChat.Group, member: CometChat.GroupMember): Promise<void> {
    try {
      await CometChat.banGroupMember(group.getGuid(), member.getUid());
      this.removeMember(member.getUid());
      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        const groupClone = CometChatUIKitUtility.clone(group);
        groupClone.setMembersCount(groupClone.getMembersCount() - 1);
        const actionMessage = GroupMemberUtils.createActionMessage(
          member, CometChatUIKitConstants.groupMemberAction.BANNED, groupClone, loggedInUser
        );
        CometChatGroupEvents.ccGroupMemberBanned.next({
          message: actionMessage, kickedFrom: groupClone, kickedUser: member, kickedBy: loggedInUser,
        } as IGroupMemberKickedBanned);
      }
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error banning member:', error);
      this.handleError(error);
    }
  }

  /** Update a member's scope (role) in the group. Calls SDK, updates list, emits event. */
  async updateMemberScope(
    group: CometChat.Group,
    member: CometChat.GroupMember,
    newScope: string
  ): Promise<void> {
    try {
      const oldScope = member.getScope();
      await CometChat.updateGroupMemberScope(
        group.getGuid(), member.getUid(), newScope as CometChat.GroupMemberScope
      );
      this.updateMemberScopeInList(member.getUid(), newScope as CometChat.GroupMemberScope);
      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        const updatedMember = CometChatUIKitUtility.clone(member);
        updatedMember.setScope(newScope as CometChat.GroupMemberScope);
        const groupClone = CometChatUIKitUtility.clone(group);
        const actionMessage = GroupMemberUtils.createActionMessage(
          updatedMember, CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE, groupClone, loggedInUser
        );
        CometChatGroupEvents.ccGroupMemberScopeChanged.next({
          message: actionMessage, updatedUser: updatedMember,
          scopeChangedTo: newScope, scopeChangedFrom: oldScope, group: groupClone,
        } as IGroupMemberScopeChanged);
      }
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error updating member scope:', error);
      this.handleError(error);
      throw error;
    }
  }

  // ==================== List Mutation Methods ====================

  removeMember(uid: string): void {
    const filtered = this.membersSignal().filter(m => m.getUid() !== uid);
    this.membersSignal.set(filtered);
    if (filtered.length === 0) {
      this.fetchStateSignal.set(States.empty);
    }
  }

  updateMemberStatus(user: CometChat.User): void {
    const current = this.membersSignal();
    const index = current.findIndex(m => m.getUid() === user.getUid());
    if (index === -1) return;
    const updated = [...current];
    updated[index].setStatus(user.getStatus());
    this.membersSignal.set(updated);
  }

  updateMemberScopeInList(uid: string, newScope: CometChat.GroupMemberScope): void {
    const current = this.membersSignal();
    const index = current.findIndex(m => m.getUid() === uid);
    if (index === -1) return;
    const updated = [...current];
    updated[index].setScope(newScope);
    this.membersSignal.set(updated);
  }

  appendMember(member: CometChat.GroupMember): void {
    const current = this.membersSignal();
    if (current.some(m => m.getUid() === member.getUid())) return;
    this.membersSignal.set([...current, member]);
    if (this.fetchStateSignal() === States.empty) {
      this.fetchStateSignal.set(States.loaded);
    }
  }

  appendMembersWithoutDuplicates(members: CometChat.GroupMember[]): void {
    const current = this.membersSignal();
    const existingUids = new Set(current.map(m => m.getUid()));
    const newMembers = members.filter(m => !existingUids.has(m.getUid()));
    if (newMembers.length > 0) {
      this.membersSignal.set([...current, ...newMembers]);
    }
  }

  // ==================== Listener Management ====================

  attachListeners(groupGuid: string, hideUserStatus: boolean): void {
    if (!hideUserStatus) {
      try {
        CometChat.addUserListener(
          this.userListenerId,
          new CometChat.UserListener({
            onUserOnline: (user: CometChat.User) => this.updateMemberStatus(user),
            onUserOffline: (user: CometChat.User) => this.updateMemberStatus(user),
          })
        );
      } catch (error) {
        CometChatLogger.error('GroupMembersService', 'Error attaching user listener:', error);
      }
    }

    try {
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            _message: CometChat.Action,
            changedUser: CometChat.GroupMember,
            newScope: CometChat.GroupMemberScope,
            _oldScope: CometChat.GroupMemberScope,
            changedGroup: CometChat.Group
          ) => {
            if (changedGroup.getGuid() !== groupGuid) return;
            this.updateMemberScopeInList(changedUser.getUid(), newScope);
          },
          onGroupMemberKicked: (
            _message: CometChat.Action,
            kickedUser: CometChat.User,
            _kickedBy: CometChat.User,
            kickedFrom: CometChat.Group
          ) => {
            if (kickedFrom.getGuid() !== groupGuid) return;
            this.removeMember(kickedUser.getUid());
          },
          onGroupMemberBanned: (
            _message: CometChat.Action,
            bannedUser: CometChat.User,
            _bannedBy: CometChat.User,
            bannedFrom: CometChat.Group
          ) => {
            if (bannedFrom.getGuid() !== groupGuid) return;
            this.removeMember(bannedUser.getUid());
          },
          onMemberAddedToGroup: (
            _message: CometChat.Action,
            userAdded: CometChat.User,
            _userAddedBy: CometChat.User,
            userAddedIn: CometChat.Group
          ) => {
            if (userAddedIn.getGuid() !== groupGuid) return;
            const newMember = GroupMemberUtils.createParticipantGroupMember(userAdded, userAddedIn);
            this.appendMember(newMember);
          },
          onGroupMemberLeft: (
            _message: CometChat.Action,
            leavingUser: CometChat.User,
            group: CometChat.Group
          ) => {
            if (group.getGuid() !== groupGuid) return;
            this.removeMember(leavingUser.getUid());
          },
          onGroupMemberJoined: (
            _message: CometChat.Action,
            joinedUser: CometChat.User,
            joinedGroup: CometChat.Group
          ) => {
            if (joinedGroup.getGuid() !== groupGuid) return;
            const newMember = GroupMemberUtils.createParticipantGroupMember(joinedUser, joinedGroup);
            this.appendMember(newMember);
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error attaching group listener:', error);
    }
  }

  detachListeners(): void {
    try {
      CometChat.removeUserListener(this.userListenerId);
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error removing user listener:', error);
    }
    try {
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error removing group listener:', error);
    }
  }

  // ==================== Cleanup ====================

  cleanup(): void {
    this.detachListeners();
    this.membersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.groupMembersRequest = null;
    this.currentGroup = null;
    this.errorCallback = null;
    this.initialFetchDone = false;
  }

  // ==================== Private: Reconnect ====================

  /**
   * Called by ConnectionStateService when the WebSocket reconnects.
   * Silently re-fetches page 1 without clearing the list or showing shimmer.
   * Resets hasMore to true so pagination works again from the new first page.
   */
  private handleReconnect(): void {
    if (!this.currentGroup || !this.initialFetchDone) return;
    CometChatLogger.info('GroupMembersService', 'WebSocket reconnected — refreshing member list');
    const freshRequest = new CometChat.GroupMembersRequestBuilder(this.currentGroup.getGuid())
      .setLimit(GroupMembersService.DEFAULT_LIMIT)
      .build();
    freshRequest.fetchNext()
      .then(newMembers => {
        this.membersSignal.set(newMembers);
        // Reset to true — back at page 1, more pages may exist
        this.hasMoreSignal.set(true);
        this.fetchStateSignal.set(newMembers.length === 0 ? States.empty : States.loaded);
        this.groupMembersRequest = freshRequest;
      })
      .catch(e => CometChatLogger.error('GroupMembersService', 'Error refreshing members on reconnect:', e));
  }

  // ==================== Private Helpers ====================

  private handleError(error: unknown): void {
    if (this.errorCallback) {
      this.errorCallback(this.toCometchatException(error));
    }
  }

  private toCometchatException(error: unknown): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) return error;
    if (error instanceof Error) {
      return new CometChat.CometChatException({
        code: 'GROUP_MEMBERS_ERROR', message: error.message, details: error.stack || '',
      });
    }
    return new CometChat.CometChatException({
      code: 'GROUP_MEMBERS_ERROR', message: String(error), details: '',
    });
  }
}
