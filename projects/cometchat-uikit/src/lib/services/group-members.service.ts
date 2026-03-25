import { Injectable, signal } from '@angular/core';
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

/**
 * Error callback type for propagating errors to the component.
 */
export type GroupMembersErrorCallback = (error: CometChat.CometChatException) => void;

/**
 * GroupMembersService
 *
 * Service responsible for managing group member state and SDK interactions.
 * NOT `providedIn: 'root'` — instantiated per component instance to avoid
 * shared state between multiple group member lists.
 *
 * Uses Angular Signals for reactive state management.
 *
 * @see Requirements 1.1, 2.1, 2.2, 3.1-3.3, 6.1-6.4, 7.1-7.4, 8.3, 8.5, 9.1-9.9, 13.1
 */
@Injectable()
export class GroupMembersService {
  // ==================== State Signals ====================

  private membersSignal = signal<CometChat.GroupMember[]>([]);
  private fetchStateSignal = signal<States>(States.loading);
  private hasMoreSignal = signal<boolean>(true);

  /** Read-only signal for the current member list. */
  readonly members = this.membersSignal.asReadonly();

  /** Read-only signal for the current fetch state. */
  readonly fetchState = this.fetchStateSignal.asReadonly();

  /** Read-only signal indicating if more members can be fetched. */
  readonly hasMore = this.hasMoreSignal.asReadonly();

  // ==================== Private State ====================

  private groupMembersRequest: CometChat.GroupMembersRequest | null = null;
  private currentGroup: CometChat.Group | null = null;
  private errorCallback: GroupMembersErrorCallback | null = null;

  private userListenerId = `group_members_user_${CometChatUIKitUtility.ID()}`;
  private groupListenerId = `group_members_group_${CometChatUIKitUtility.ID()}`;

  // ==================== Configuration ====================

  private static readonly DEFAULT_LIMIT = 30;

  // ==================== Public API ====================

  /**
   * Set the error callback for propagating errors to the component.
   */
  setErrorCallback(callback: GroupMembersErrorCallback | null): void {
    this.errorCallback = callback;
  }

  /**
   * Initialize the service with a group and optional custom request builder.
   * Creates the GroupMembersRequestBuilder and fetches the first page.
   *
   * @param group - The group whose members to fetch
   * @param builder - Optional custom request builder
   * @see Requirement 1.1
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
   *
   * @see Requirements 2.1, 2.2
   */
  async fetchNext(): Promise<void> {
    if (!this.groupMembersRequest) {
      return;
    }

    const isInitialFetch =
      this.membersSignal().length === 0 && this.fetchStateSignal() === States.loading;
    const startTime = Date.now();
    const MIN_SHIMMER_TIME = 1000; // Minimum 1s shimmer on initial fetch

    try {
      const newMembers = await this.groupMembersRequest.fetchNext();

      // Ensure shimmer is visible for at least MIN_SHIMMER_TIME on initial fetch
      if (isInitialFetch) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_SHIMMER_TIME - elapsed);
        await new Promise<void>(resolve => setTimeout(resolve, remainingTime));
      }

      if (newMembers.length === 0) {
        this.hasMoreSignal.set(false);
        // If this was the first fetch and no members exist, set empty state
        if (this.membersSignal().length === 0) {
          this.fetchStateSignal.set(States.empty);
        }
        return;
      }

      this.appendMembersWithoutDuplicates(newMembers);

      // If fewer than the limit were returned, no more pages
      if (newMembers.length < GroupMembersService.DEFAULT_LIMIT) {
        this.hasMoreSignal.set(false);
      }

      this.fetchStateSignal.set(States.loaded);
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error fetching members:', error);
      // Only set error state if this is the initial fetch (no members loaded yet)
      if (this.membersSignal().length === 0) {
        this.fetchStateSignal.set(States.error);
      }
      this.handleError(error);
    }
  }

  /**
   * Search members by keyword. Resets the list and creates a new builder.
   *
   * @param keyword - The search keyword
   * @param searchBuilder - Optional custom search request builder
   * @see Requirements 3.1, 3.2, 3.3
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

  /**
   * Kick a member from the group.
   * Calls SDK, removes from list, emits ccGroupMemberKicked event.
   *
   * @param group - The group to kick from
   * @param member - The member to kick
   * @see Requirements 6.1-6.4
   */
  async kickMember(group: CometChat.Group, member: CometChat.GroupMember): Promise<void> {
    try {
      await CometChat.kickGroupMember(group.getGuid(), member.getUid());

      this.removeMember(member.getUid());

      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        const groupClone = CometChatUIKitUtility.clone(group);
        groupClone.setMembersCount(groupClone.getMembersCount() - 1);

        const actionMessage = GroupMemberUtils.createActionMessage(
          member,
          CometChatUIKitConstants.groupMemberAction.KICKED,
          groupClone,
          loggedInUser
        );

        const event: IGroupMemberKickedBanned = {
          message: actionMessage,
          kickedFrom: groupClone,
          kickedUser: member,
          kickedBy: loggedInUser,
        };
        CometChatGroupEvents.ccGroupMemberKicked.next(event);
      }
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error kicking member:', error);
      this.handleError(error);
    }
  }

  /**
   * Ban a member from the group.
   * Calls SDK, removes from list, emits ccGroupMemberBanned event.
   *
   * @param group - The group to ban from
   * @param member - The member to ban
   * @see Requirements 7.1-7.4
   */
  async banMember(group: CometChat.Group, member: CometChat.GroupMember): Promise<void> {
    try {
      await CometChat.banGroupMember(group.getGuid(), member.getUid());

      this.removeMember(member.getUid());

      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        const groupClone = CometChatUIKitUtility.clone(group);
        groupClone.setMembersCount(groupClone.getMembersCount() - 1);

        const actionMessage = GroupMemberUtils.createActionMessage(
          member,
          CometChatUIKitConstants.groupMemberAction.BANNED,
          groupClone,
          loggedInUser
        );

        const event: IGroupMemberKickedBanned = {
          message: actionMessage,
          kickedFrom: groupClone,
          kickedUser: member,
          kickedBy: loggedInUser,
        };
        CometChatGroupEvents.ccGroupMemberBanned.next(event);
      }
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error banning member:', error);
      this.handleError(error);
    }
  }

  /**
   * Update a member's scope (role) in the group.
   * Calls SDK, updates in list, emits ccGroupMemberScopeChanged event.
   *
   * @param group - The group
   * @param member - The member whose scope to change
   * @param newScope - The new scope to assign
   * @see Requirements 8.3, 8.5
   */
  async updateMemberScope(
    group: CometChat.Group,
    member: CometChat.GroupMember,
    newScope: string
  ): Promise<void> {
    try {
      const oldScope = member.getScope();

      await CometChat.updateGroupMemberScope(
        group.getGuid(),
        member.getUid(),
        newScope as CometChat.GroupMemberScope
      );

      this.updateMemberScopeInList(member.getUid(), newScope as CometChat.GroupMemberScope);

      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        // Clone the member and update scope before creating the action message (matching React)
        const updatedMember = CometChatUIKitUtility.clone(member);
        updatedMember.setScope(newScope as CometChat.GroupMemberScope);

        const groupClone = CometChatUIKitUtility.clone(group);

        const actionMessage = GroupMemberUtils.createActionMessage(
          updatedMember,
          CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE,
          groupClone,
          loggedInUser
        );

        const event: IGroupMemberScopeChanged = {
          message: actionMessage,
          updatedUser: updatedMember,
          scopeChangedTo: newScope,
          scopeChangedFrom: oldScope,
          group: groupClone,
        };
        CometChatGroupEvents.ccGroupMemberScopeChanged.next(event);
      }
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error updating member scope:', error);
      this.handleError(error);
      throw error;
    }
  }

  // ==================== List Mutation Methods ====================

  /**
   * Remove a member from the list by UID.
   *
   * @param uid - The UID of the member to remove
   * @see Requirements 6.2, 7.2, 9.2, 9.3, 9.6
   */
  removeMember(uid: string): void {
    const current = this.membersSignal();
    const filtered = current.filter(m => m.getUid() !== uid);
    this.membersSignal.set(filtered);

    if (filtered.length === 0) {
      this.fetchStateSignal.set(States.empty);
    }
  }

  /**
   * Update a member's online/offline status in the list.
   *
   * @param user - The user whose status changed
   * @see Requirement 9.1
   */
  updateMemberStatus(user: CometChat.User): void {
    const current = this.membersSignal();
    const index = current.findIndex(m => m.getUid() === user.getUid());

    if (index === -1) {
      return;
    }

    // Update the member's status in place and trigger signal update
    const updated = [...current];
    updated[index].setStatus(user.getStatus());
    this.membersSignal.set(updated);
  }

  /**
   * Update a member's scope in the list.
   *
   * @param uid - The UID of the member
   * @param newScope - The new scope to set
   * @see Requirements 8.4, 9.4
   */
  updateMemberScopeInList(uid: string, newScope: CometChat.GroupMemberScope): void {
    const current = this.membersSignal();
    const index = current.findIndex(m => m.getUid() === uid);

    if (index === -1) {
      return;
    }

    const updated = [...current];
    updated[index].setScope(newScope);
    this.membersSignal.set(updated);
  }

  /**
   * Append a single member to the list.
   *
   * @param member - The member to append
   * @see Requirements 9.5, 9.7
   */
  appendMember(member: CometChat.GroupMember): void {
    const current = this.membersSignal();
    // Avoid duplicates
    if (current.some(m => m.getUid() === member.getUid())) {
      return;
    }
    this.membersSignal.set([...current, member]);

    if (this.fetchStateSignal() === States.empty) {
      this.fetchStateSignal.set(States.loaded);
    }
  }

  /**
   * Append multiple members to the list without duplicates.
   *
   * @param members - The members to append
   * @see Requirement 2.2
   */
  appendMembersWithoutDuplicates(members: CometChat.GroupMember[]): void {
    const current = this.membersSignal();
    const existingUids = new Set(current.map(m => m.getUid()));
    const newMembers = members.filter(m => !existingUids.has(m.getUid()));

    if (newMembers.length > 0) {
      this.membersSignal.set([...current, ...newMembers]);
    }
  }

  // ==================== Listener Management ====================

  /**
   * Attach SDK user and group listeners for real-time updates.
   *
   * @param groupGuid - The GUID of the group to listen for events on
   * @param hideUserStatus - Whether to skip user status updates
   * @see Requirements 9.1-9.9
   */
  attachListeners(groupGuid: string, hideUserStatus: boolean): void {
    // User listener for online/offline status
    if (!hideUserStatus) {
      try {
        CometChat.addUserListener(
          this.userListenerId,
          new CometChat.UserListener({
            onUserOnline: (user: CometChat.User) => {
              this.updateMemberStatus(user);
            },
            onUserOffline: (user: CometChat.User) => {
              this.updateMemberStatus(user);
            },
          })
        );
      } catch (error) {
        CometChatLogger.error('GroupMembersService', 'Error attaching user listener:', error);
      }
    }

    // Group listener for member events
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
            // Requirement 9.8: Only process events for the current group
            if (changedGroup.getGuid() !== groupGuid) {
              return;
            }
            this.updateMemberScopeInList(changedUser.getUid(), newScope);
          },
          onGroupMemberKicked: (
            _message: CometChat.Action,
            kickedUser: CometChat.User,
            _kickedBy: CometChat.User,
            kickedFrom: CometChat.Group
          ) => {
            if (kickedFrom.getGuid() !== groupGuid) {
              return;
            }
            this.removeMember(kickedUser.getUid());
          },
          onGroupMemberBanned: (
            _message: CometChat.Action,
            bannedUser: CometChat.User,
            _bannedBy: CometChat.User,
            bannedFrom: CometChat.Group
          ) => {
            if (bannedFrom.getGuid() !== groupGuid) {
              return;
            }
            this.removeMember(bannedUser.getUid());
          },
          onMemberAddedToGroup: (
            _message: CometChat.Action,
            userAdded: CometChat.User,
            _userAddedBy: CometChat.User,
            userAddedIn: CometChat.Group
          ) => {
            if (userAddedIn.getGuid() !== groupGuid) {
              return;
            }
            const newMember = GroupMemberUtils.createParticipantGroupMember(userAdded, userAddedIn);
            this.appendMember(newMember);
          },
          onGroupMemberLeft: (
            _message: CometChat.Action,
            leavingUser: CometChat.User,
            group: CometChat.Group
          ) => {
            if (group.getGuid() !== groupGuid) {
              return;
            }
            this.removeMember(leavingUser.getUid());
          },
          onGroupMemberJoined: (
            _message: CometChat.Action,
            joinedUser: CometChat.User,
            joinedGroup: CometChat.Group
          ) => {
            if (joinedGroup.getGuid() !== groupGuid) {
              return;
            }
            const newMember = GroupMemberUtils.createParticipantGroupMember(
              joinedUser,
              joinedGroup
            );
            this.appendMember(newMember);
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error attaching group listener:', error);
    }
  }

  /**
   * Remove all SDK listeners.
   *
   * @see Requirement 13.1
   */
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

  /**
   * Full cleanup: detach listeners and reset state.
   *
   * @see Requirement 13.1
   */
  cleanup(): void {
    this.detachListeners();
    this.membersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.groupMembersRequest = null;
    this.currentGroup = null;
    this.errorCallback = null;
  }

  // ==================== Private Helpers ====================

  /**
   * Propagate an error to the component via the error callback.
   */
  private handleError(error: unknown): void {
    if (this.errorCallback) {
      const exception = this.toCometchatException(error);
      this.errorCallback(exception);
    }
  }

  /**
   * Convert an unknown error to a CometChatException.
   */
  private toCometchatException(error: unknown): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) {
      return error;
    }

    if (error instanceof Error) {
      return new CometChat.CometChatException({
        code: 'GROUP_MEMBERS_ERROR',
        message: error.message,
        details: error.stack || '',
      });
    }

    return new CometChat.CometChatException({
      code: 'GROUP_MEMBERS_ERROR',
      message: String(error),
      details: '',
    });
  }
}
