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
import { isOfflineOn } from '../utils/offline/offline-gate';
import { fetchNextTwoPhase, mergeSnapshotPage } from '../utils/offline/two-phase';
import { OfflineListSession, watchOfflineSession } from '../utils/offline/list-session';
import { isKeywordSearch, offlineStateFor } from '../utils/offline/list-states';
import { OfflineHubService } from './offline-hub.service';
import { replaySweptGroupActions } from '../utils/offline/swept-group-actions';
import type { Subscription } from 'rxjs';

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
  /**
   * Offline support (D83): bumped when a load the kit started itself (a cache-reset or
   * reconnect reload) has settled, so the component redraws from this service. Never
   * changes with offline off.
   */
  private readonly offlineSettledSignal = signal(0);
  readonly offlineSettled = this.offlineSettledSignal.asReadonly();
  /**
   * Offline (D84 rule 3): the list was read with no connection and nothing on screen, so
   * the kit shows "Connect to load members" in place of the error view (the app's own error
   * view still wins). `fetchState` is `error` and `error` fired once. Always false with
   * offline off.
   */
  private readonly connectToLoadSignal = signal(false);
  readonly connectToLoad = this.connectToLoadSignal.asReadonly();
  /**
   * Offline (D84 rule 7): a keyword search could not run with no connection and nothing is
   * saved for it, so the list says "Connect to search" (`fetchState` is `empty`, no
   * `error`). Only a real keyword is a search; a filter alone is the plain list. Always
   * false with offline off.
   */
  private readonly connectToSearchSignal = signal(false);
  readonly connectToSearch = this.connectToSearchSignal.asReadonly();
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
  /**
   * Offline (D84): the offline state ("Connect to load members" or "Connect to search") is up
   * because the device was not connected, so the first page loads once by itself when the
   * connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;
  /** Offline: the server answered a page of the current request (the next read is a "load more"). */
  private serverPageRead = false;
  /** The next offline read was started by the kit (cache reset, reconnect), not by the user or app. */
  private automaticLoad = false;

  private connectionState = inject(ConnectionStateService);
  private destroyRef = inject(DestroyRef);

  /** Offline: logout / user switch clears the list, a cache reset reloads it (UIK-LIFE-01/02). */
  private readonly offlineSession = new OfflineListSession();
  /** What the current request was built from, to rebuild it after a cache reset. */
  private lastBuild: { builder?: CometChat.GroupMembersRequestBuilder; keyword?: string; searchBuilder?: CometChat.GroupMembersRequestBuilder } | null = null;

  private static readonly DEFAULT_LIMIT = 30;

  constructor() {
    // Silent reconnect refresh — keeps existing list visible, resets to page 1.
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleReconnect());
    watchOfflineSession(inject(OfflineHubService), this.destroyRef, this.offlineSession, {
      clear: () => this.clearForSession(),
      reload: () => this.reloadAfterReset(),
    });
  }

  setErrorCallback(callback: GroupMembersErrorCallback | null): void { this.errorCallback = callback; }

  /**
   * Initialize the service with a group and optional custom request builder.
   * Creates the GroupMembersRequestBuilder and fetches the first page.
   */
  initialize(group: CometChat.Group, builder?: CometChat.GroupMembersRequestBuilder): void {
    this.currentGroup = group;
    this.offlineSession.supersede();
    this.membersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;

    const effectiveBuilder =
      builder ||
      new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(
        GroupMembersService.DEFAULT_LIMIT
      );

    this.lastBuild = { builder };
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
    if (isOfflineOn()) {
      const automatic = this.automaticLoad;
      this.automaticLoad = false;
      return this.fetchNextOffline(this.groupMembersRequest, automatic);
    }

    // A search or re-initialisation meanwhile makes this read stale: its page is dropped.
    const epoch = this.offlineSession.epoch;
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
      if (this.offlineSession.isStale(epoch)) return;

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
      if (this.offlineSession.isStale(epoch)) return;
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

    this.offlineSession.supersede();
    this.membersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;

    let effectiveBuilder: CometChat.GroupMembersRequestBuilder;

    if (searchBuilder) {
      effectiveBuilder = searchBuilder;
      effectiveBuilder.setSearchKeyword(keyword);
    } else {
      effectiveBuilder = new CometChat.GroupMembersRequestBuilder(this.currentGroup.getGuid())
        .setLimit(GroupMembersService.DEFAULT_LIMIT)
        .setSearchKeyword(keyword);
    }

    this.lastBuild = { keyword, searchBuilder };
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
      const handlers = {
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
      };
      CometChat.addGroupListener(this.groupListenerId, new CometChat.GroupListener(handlers));
      // Offline: group actions missed while away arrive only in the SDK's
      // sweep; they run the same handlers as the live listener (README §3.7).
      this.sweptGroupActions?.unsubscribe();
      this.sweptGroupActions = replaySweptGroupActions(this.offlineHubForSweep.messageSync$, () => this.offlineHubForSweep.gen, handlers);
    } catch (error) {
      CometChatLogger.error('GroupMembersService', 'Error attaching group listener:', error);
    }
  }

  private readonly offlineHubForSweep = inject(OfflineHubService);
  private sweptGroupActions: Subscription | null = null;

  detachListeners(): void {
    this.sweptGroupActions?.unsubscribe();
    this.sweptGroupActions = null;
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
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;
  }

  // ==================== Private: Reconnect ====================

  /**
   * Called by ConnectionStateService when the WebSocket reconnects.
   * Silently re-fetches page 1 without clearing the list or showing shimmer.
   * Resets hasMore to true so pagination works again from the new first page.
   */
  private handleReconnect(): void {
    if (this.needsOfflineReload()) return this.reloadAfterReset();
    if (!this.currentGroup || !this.initialFetchDone) return;
    CometChatLogger.info('GroupMembersService', 'WebSocket reconnected — refreshing member list');
    // Same request config (app builder and current search keyword) as the list's current load.
    const replaced = this.groupMembersRequest;
    const last = this.lastBuild;
    let freshRequest: CometChat.GroupMembersRequest;
    if (last?.keyword) {
      freshRequest = (
        last.searchBuilder ??
        new CometChat.GroupMembersRequestBuilder(this.currentGroup.getGuid()).setLimit(
          GroupMembersService.DEFAULT_LIMIT
        )
      )
        .setSearchKeyword(last.keyword)
        .build();
    } else {
      freshRequest = (
        last?.builder ??
        new CometChat.GroupMembersRequestBuilder(this.currentGroup.getGuid()).setLimit(
          GroupMembersService.DEFAULT_LIMIT
        )
      ).build();
    }
    freshRequest.fetchNext()
      .then(newMembers => {
        // Another group or a search since the reconnect owns the list now: don't show the old one.
        if (this.groupMembersRequest !== replaced) return;
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

  /**
   * Offline path of {@link fetchNext}: the cached page paints at once, the
   * server page then replaces it in place (D83). A failed load with nothing on
   * screen shows the error view and fires `onError` once; with rows on screen the
   * rows stay and `onError` fires once for a first-page load the user or app
   * started (never for a "load more" page, never for a load the kit started).
   */
  private async fetchNextOffline(
    request: NonNullable<typeof this.groupMembersRequest>,
    automatic = false
  ): Promise<void> {
    this.offlineSession.markRan();
    const epoch = this.offlineSession.epoch;
    const firstPage = !this.serverPageRead;
    // A reload the kit starts from the offline state reports once, not again if it fails the same way.
    const reportedOffline = this.connectToLoadSignal();
    if (firstPage) {
      this.reloadOnConnect = false;
      this.clearOfflineStates();
    }
    let cachedKeys = new Set<string>();
    const keyOf = (item: CometChat.GroupMember) => item.getUid();
    try {
      await fetchNextTwoPhase<CometChat.GroupMember>(request, 'groupMembers', {
        onCached: page => {
          if (this.offlineSession.isStale(epoch) || page.length === 0) return;
          cachedKeys = new Set(page.map(keyOf));
          this.clearOfflineStates();
          this.membersSignal.set(mergeSnapshotPage(this.membersSignal(), new Set<string>(), page, keyOf));
          this.fetchStateSignal.set(States.loaded);
        },
        onServer: page => {
          if (this.offlineSession.isStale(epoch)) return;
          this.reloadOnConnect = false;
          this.clearOfflineStates();
          this.serverPageRead = true;
          this.membersSignal.set(mergeSnapshotPage(this.membersSignal(), cachedKeys, page, keyOf));
          // Only an empty server page ends the list (BEH-READ-09b).
          this.hasMoreSignal.set(page.length > 0);
          this.fetchStateSignal.set(this.membersSignal().length === 0 ? States.empty : States.loaded);
          this.initialFetchDone = true;
        },
        onError: (error, notConnected) => {
          if (this.offlineSession.isStale(epoch)) return;
          CometChatLogger.error('GroupMembersService', 'Error fetching (offline path):', error);
          if (this.membersSignal().length === 0) {
            // Nothing on screen. Offline: "Connect to search" for a keyword search (no `error`),
            // else the offline state in the error state (`error` once, D84 rules 3 and 7); any
            // other failure is the error view with Retry (rule 4). One more load when the
            // connection is back if that is why it failed (rule 8).
            this.reloadOnConnect = notConnected;
            const state = offlineStateFor(notConnected, this.isKeywordSearch(request));
            this.connectToSearchSignal.set(state === 'connect_to_search');
            this.connectToLoadSignal.set(state === 'connect_to_load');
            if (state === 'connect_to_search') {
              this.fetchStateSignal.set(States.empty);
              return;
            }
            this.fetchStateSignal.set(States.error);
            if (!(automatic && notConnected && reportedOffline)) this.handleError(error);
          } else if (!automatic && !notConnected) {
            // Rows stay. A real failure of a load the user or app started reports once (rule 5);
            // offline over rows (rule 2) and a load the kit started report nothing.
            this.handleError(error);
          }
        },
      });
    } finally {
      if (automatic && !this.offlineSession.isStale(epoch)) this.offlineSettledSignal.update(n => n + 1);
    }
  }

  /** Whether the read is a keyword search (D84 addition B): a filter alone is the plain list. */
  private isKeywordSearch(request: unknown): boolean {
    return isKeywordSearch(request, this.lastBuild?.keyword);
  }

  private clearOfflineStates(): void {
    if (this.connectToLoadSignal()) this.connectToLoadSignal.set(false);
    if (this.connectToSearchSignal()) this.connectToSearchSignal.set(false);
  }

  /** Logout / user switch: nothing of the old session stays on screen. */
  private clearForSession(): void {
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;
    this.membersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.groupMembersRequest = null;
    this.initialFetchDone = false;
  }

  /**
   * Offline on, on reconnect: a list showing the error view because the device was
   * offline loads its first page once by itself (D83); so does a list whose cached rows
   * are shown but whose first page never loaded (quietly). A non-network error is not
   * reloaded. A list that did load refreshes as before.
   */
  private needsOfflineReload(): boolean {
    if (!isOfflineOn() || !this.offlineSession.ranOffline || !this.currentGroup || !this.lastBuild) {
      return false;
    }
    const rowsShown = this.membersSignal().length > 0;
    return (
      (this.reloadOnConnect && !rowsShown && (this.connectToLoadSignal() || this.connectToSearchSignal())) ||
      (rowsShown && !this.initialFetchDone)
    );
  }

  /** The offline cache was rebuilt: read the first page again, cached then server. */
  private reloadAfterReset(): void {
    if (!this.currentGroup || !this.lastBuild) return;
    const { builder, keyword, searchBuilder } = this.lastBuild;
    this.automaticLoad = true;
    try {
      if (keyword) this.search(keyword, searchBuilder);
      else this.initialize(this.currentGroup, builder);
    } finally {
      this.automaticLoad = false;
    }
  }
}
