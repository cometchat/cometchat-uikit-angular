import { Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../Enums/Enums';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Error callback type for propagating errors to the component.
 */
export type GroupsErrorCallback = (error: CometChat.CometChatException) => void;

/**
 * GroupsService
 *
 * Service responsible for managing group list state and SDK interactions.
 * NOT `providedIn: 'root'` — instantiated per component instance to avoid
 * shared state between multiple group lists.
 *
 * Uses Angular Signals for reactive state management.
 *
 * Replaces the plain-class `GroupsManager` with an Angular-native `@Injectable()`
 * service following the `GroupMembersService` / `CallLogsService` pattern.
 *
 * @see Requirements 2.1, 2.3, 2.5, 2.7
 */
@Injectable()
export class GroupsService {
  // ==================== State Signals ====================

  private groupsSignal = signal<CometChat.Group[]>([]);
  private fetchStateSignal = signal<States>(States.loading);
  private hasMoreSignal = signal<boolean>(true);

  /** Read-only signal for the current group list. */
  readonly groups = this.groupsSignal.asReadonly();

  /** Read-only signal for the current fetch state. */
  readonly fetchState = this.fetchStateSignal.asReadonly();

  /** Read-only signal indicating if more groups can be fetched. */
  readonly hasMore = this.hasMoreSignal.asReadonly();

  // ==================== Private State ====================

  private groupsRequest: CometChat.GroupsRequest | null = null;
  private errorCallback: GroupsErrorCallback | null = null;
  private isFetching = false;

  /** Cached logged-in user for hasJoined / isLoggedInUser detection in listeners. */
  private loggedInUser: CometChat.User | null = null;

  private groupListenerId = `groups_service_group_${CometChatUIKitUtility.ID()}`;
  private connectionListenerId = `groups_service_conn_${CometChatUIKitUtility.ID()}`;

  // ==================== Configuration ====================

  private static readonly DEFAULT_LIMIT = 30;
  private static readonly MIN_SHIMMER_TIME = 1000;

  // ==================== Public API ====================

  /**
   * Set the error callback for propagating errors to the component.
   */
  setErrorCallback(callback: GroupsErrorCallback | null): void {
    this.errorCallback = callback;
  }

  /**
   * Initialize the service with request builder configuration.
   * Ports the GroupsManager constructor logic.
   *
   * @param config - Configuration matching the original GroupsManager constructor args
   */
  initialize(config: {
    groupsRequestBuilder?: CometChat.GroupsRequestBuilder | null;
    searchRequestBuilder?: CometChat.GroupsRequestBuilder | null;
    searchText?: string;
    groupsSearchText?: string;
  }): void {
    const {
      groupsRequestBuilder = null,
      searchRequestBuilder = null,
      searchText = '',
      groupsSearchText = '',
    } = config;

    this.groupsSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;

    this.groupsRequest = this.buildRequest(
      searchText,
      groupsRequestBuilder,
      searchRequestBuilder,
      groupsSearchText
    );
  }


  /**
   * Fetch the next page of groups from the SDK.
   * Includes minimum shimmer time on initial fetch, duplicate-free appending,
   * hasMore tracking, and isFetching guard to prevent concurrent calls.
   */
  async fetchNext(): Promise<void> {
    if (!this.groupsRequest || this.isFetching) {
      return;
    }

    this.isFetching = true;

    const isInitialFetch =
      this.groupsSignal().length === 0 && this.fetchStateSignal() === States.loading;
    const startTime = Date.now();

    try {
      const newGroups = await this.groupsRequest.fetchNext();

      // Ensure shimmer is visible for at least MIN_SHIMMER_TIME on initial fetch
      if (isInitialFetch) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, GroupsService.MIN_SHIMMER_TIME - elapsed);
        await new Promise<void>(resolve => setTimeout(resolve, remainingTime));
      }

      if (newGroups.length === 0) {
        this.hasMoreSignal.set(false);
        if (this.groupsSignal().length === 0) {
          this.fetchStateSignal.set(States.empty);
        }
        this.isFetching = false;
        return;
      }

      this.appendGroupsWithoutDuplicates(newGroups);

      if (newGroups.length < GroupsService.DEFAULT_LIMIT) {
        this.hasMoreSignal.set(false);
      }

      this.fetchStateSignal.set(States.loaded);
    } catch (error) {
      CometChatLogger.error('GroupsService', 'Error fetching groups:', error);
      if (this.groupsSignal().length === 0) {
        this.fetchStateSignal.set(States.error);
      }
      this.handleError(error);
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Search groups by keyword. Resets the list and creates a new request builder.
   *
   * @param keyword - The search keyword
   * @param searchRequestBuilder - Optional custom search request builder
   */
  search(
    keyword: string,
    config?: {
      groupsRequestBuilder?: CometChat.GroupsRequestBuilder | null;
      searchRequestBuilder?: CometChat.GroupsRequestBuilder | null;
    }
  ): void {
    this.groupsSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;

    this.groupsRequest = this.buildRequest(
      keyword,
      config?.groupsRequestBuilder ?? null,
      config?.searchRequestBuilder ?? null,
      ''
    );
  }

  // ==================== Listener Management ====================

  /**
   * Attach SDK GroupListener for real-time group events.
   * Ports GroupsManager.attachListeners() — directly updates service Signals
   * instead of using a dispatch callback.
   *
   * Includes logged-in user caching for hasJoined / isLoggedInUser detection.
   */
  attachListeners(): void {
    // Cache logged-in user for isLoggedInUser checks
    this.cacheLoggedInUser();

    try {
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberJoined: (
            _message: CometChat.Action,
            joinedUser: CometChat.User,
            joinedGroup: CometChat.Group
          ) => {
            const isLoggedIn = this.isLoggedInUser(joinedUser);
            this.updateGroupForSDKEvents({
              group: joinedGroup,
              newCount: joinedGroup.getMembersCount(),
              hasJoined: isLoggedIn ? true : undefined,
              addGroup: isLoggedIn,
            });
          },

          onGroupMemberLeft: (
            _message: CometChat.Action,
            leavingUser: CometChat.User,
            groupLeft: CometChat.Group
          ) => {
            if (this.isLoggedInUser(leavingUser)) {
              this.removeGroup(groupLeft.getGuid());
            } else {
              this.updateGroupForSDKEvents({
                group: groupLeft,
                newCount: groupLeft.getMembersCount(),
              });
            }
          },

          onGroupMemberKicked: (
            _message: CometChat.Action,
            kickedUser: CometChat.User,
            _kickedBy: CometChat.User,
            kickedFrom: CometChat.Group
          ) => {
            if (this.isLoggedInUser(kickedUser)) {
              this.removeGroup(kickedFrom.getGuid());
            } else {
              this.updateGroupForSDKEvents({
                group: kickedFrom,
                newCount: kickedFrom.getMembersCount(),
              });
            }
          },

          onGroupMemberBanned: (
            _message: CometChat.Action,
            bannedUser: CometChat.User,
            _bannedBy: CometChat.User,
            bannedFrom: CometChat.Group
          ) => {
            if (this.isLoggedInUser(bannedUser)) {
              this.removeGroup(bannedFrom.getGuid());
            } else {
              this.updateGroupForSDKEvents({
                group: bannedFrom,
                newCount: bannedFrom.getMembersCount(),
              });
            }
          },

          onGroupMemberScopeChanged: (
            _message: CometChat.Action,
            changedUser: CometChat.User,
            newScope: string,
            _oldScope: string,
            changedGroup: CometChat.Group
          ) => {
            if (this.isLoggedInUser(changedUser)) {
              this.updateGroupForSDKEvents({
                group: changedGroup,
                newScope,
              });
            } else {
              this.updateGroup(changedGroup);
            }
          },

          onMemberAddedToGroup: (
            _message: CometChat.Action,
            userAdded: CometChat.User,
            _userAddedBy: CometChat.User,
            userAddedIn: CometChat.Group
          ) => {
            const isLoggedIn = this.isLoggedInUser(userAdded);
            this.updateGroupForSDKEvents({
              group: userAddedIn,
              newCount: userAddedIn.getMembersCount(),
              hasJoined: isLoggedIn ? true : undefined,
              addGroup: isLoggedIn,
            });
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('GroupsService', 'Error attaching group listener:', error);
    }
  }

  /**
   * Attach a connection listener for handling reconnection events.
   *
   * @param callback - Function to call when connection is re-established
   */
  attachConnectionListener(callback: () => void): void {
    try {
      CometChat.addConnectionListener(
        this.connectionListenerId,
        new CometChat.ConnectionListener({
          onConnected: () => {
            callback();
          },
          onDisconnected: () => {
            // No action needed — will refresh on reconnect
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('GroupsService', 'Error attaching connection listener:', error);
    }
  }

  /**
   * Remove all SDK listeners.
   */
  detachListeners(): void {
    try {
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      CometChatLogger.error('GroupsService', 'Error removing group listener:', error);
    }

    try {
      CometChat.removeConnectionListener(this.connectionListenerId);
    } catch (error) {
      CometChatLogger.error('GroupsService', 'Error removing connection listener:', error);
    }
  }


  // ==================== List Mutation Methods ====================

  /**
   * Update a group in the list by replacing it at its current position.
   *
   * @param group - The updated group object
   */
  updateGroup(group: CometChat.Group): void {
    const current = this.groupsSignal();
    const index = current.findIndex(g => g.getGuid() === group.getGuid());

    if (index !== -1) {
      this.groupsSignal.set([
        ...current.slice(0, index),
        group,
        ...current.slice(index + 1),
      ]);
    }
  }

  /**
   * Remove a group from the list by GUID.
   *
   * @param guid - The GUID of the group to remove
   */
  removeGroup(guid: string): void {
    const current = this.groupsSignal();
    const filtered = current.filter(g => g.getGuid() !== guid);
    this.groupsSignal.set(filtered);

    if (filtered.length === 0) {
      this.fetchStateSignal.set(States.empty);
    }
  }

  /**
   * Prepend a group to the beginning of the list (if not already present).
   *
   * @param group - The group to prepend
   */
  prependGroup(group: CometChat.Group): void {
    const current = this.groupsSignal();
    if (current.some(g => g.getGuid() === group.getGuid())) {
      return;
    }
    this.groupsSignal.set([group, ...current]);

    if (this.fetchStateSignal() === States.empty) {
      this.fetchStateSignal.set(States.loaded);
    }
  }

  /**
   * Update a group for SDK events with additional metadata.
   * Handles: updating member count, hasJoined status, scope,
   * and optionally adding the group to the list.
   *
   * @param params - SDK event update parameters
   */
  updateGroupForSDKEvents(params: {
    group: CometChat.Group;
    newScope?: string;
    newCount?: number;
    hasJoined?: boolean;
    addGroup?: boolean;
  }): void {
    const { group, addGroup } = params;

    // If addGroup is true and group not in list, prepend it
    if (addGroup) {
      const current = this.groupsSignal();
      const existingIndex = current.findIndex(g => g.getGuid() === group.getGuid());
      if (existingIndex === -1) {
        this.prependGroup(group);
        return;
      }
    }

    // Otherwise, update the existing group
    this.updateGroup(group);
  }

  /**
   * Append multiple groups to the list without duplicates.
   *
   * @param groups - The groups to append
   */
  appendGroupsWithoutDuplicates(groups: CometChat.Group[]): void {
    const current = this.groupsSignal();
    const existingGuids = new Set(current.map(g => g.getGuid()));
    const newGroups = groups.filter(g => !existingGuids.has(g.getGuid()));

    if (newGroups.length > 0) {
      this.groupsSignal.set([...current, ...newGroups]);
    }
  }

  // ==================== Cleanup ====================

  /**
   * Full cleanup: detach listeners and reset state.
   */
  cleanup(): void {
    this.detachListeners();
    this.groupsSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.groupsRequest = null;
    this.errorCallback = null;
    this.isFetching = false;
    this.loggedInUser = null;
  }

  // ==================== Private Helpers ====================

  /**
   * Build a GroupsRequest from the provided configuration.
   * Ports the GroupsManager constructor logic.
   */
  private buildRequest(
    searchText: string,
    groupsRequestBuilder: CometChat.GroupsRequestBuilder | null,
    searchRequestBuilder: CometChat.GroupsRequestBuilder | null,
    groupsSearchText: string
  ): CometChat.GroupsRequest {
    if (searchText) {
      if (searchRequestBuilder) {
        return searchRequestBuilder.setSearchKeyword(searchText).build();
      } else if (groupsRequestBuilder) {
        return groupsRequestBuilder.setSearchKeyword(searchText).build();
      } else {
        return new CometChat.GroupsRequestBuilder()
          .setLimit(GroupsService.DEFAULT_LIMIT)
          .setSearchKeyword(searchText)
          .build();
      }
    } else {
      if (groupsRequestBuilder) {
        return groupsRequestBuilder.build();
      } else {
        return new CometChat.GroupsRequestBuilder()
          .setLimit(GroupsService.DEFAULT_LIMIT)
          .build();
      }
    }
  }

  /**
   * Cache the logged-in user from the SDK for isLoggedInUser checks.
   */
  private cacheLoggedInUser(): void {
    if (!this.loggedInUser) {
      CometChat.getLoggedinUser()
        .then((user: CometChat.User | null) => {
          this.loggedInUser = user;
        })
        .catch((error: CometChat.CometChatException) => {
          CometChatLogger.error('GroupsService', 'Error getting logged-in user:', error);
        });
    }
  }

  /**
   * Check if the given user is the logged-in user.
   */
  private isLoggedInUser(user: CometChat.User): boolean {
    if (!this.loggedInUser) {
      return false;
    }
    return user.getUid() === this.loggedInUser.getUid();
  }

  /**
   * Propagate an error to the component via the error callback.
   */
  private handleError(error: unknown): void {
    if (this.errorCallback) {
      const exception = this.toCometChatException(error);
      this.errorCallback(exception);
    }
  }

  /**
   * Convert an unknown error to a CometChatException.
   */
  private toCometChatException(error: unknown): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) {
      return error;
    }

    if (error instanceof Error) {
      return new CometChat.CometChatException({
        code: 'GROUPS_ERROR',
        message: error.message,
        details: error.stack || '',
      });
    }

    return new CometChat.CometChatException({
      code: 'GROUPS_ERROR',
      message: String(error),
      details: '',
    });
  }
}
