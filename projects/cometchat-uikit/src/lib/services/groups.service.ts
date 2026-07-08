import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../Enums/Enums';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { CometChatLogger } from '../utils/CometChatLogger';
import { GroupsErrorCallback } from './groups.service.types';
import { attachGroupListener } from './groups.service.utils';
import { ConnectionStateService } from './connection-state.service';

export type { GroupsErrorCallback };

/**
 * GroupsService manages group list state and SDK interactions.
 * NOT `providedIn: 'root'` — instantiated per component instance.
 * Uses Angular Signals for reactive state management.
 * @see Requirements 2.1, 2.3, 2.5, 2.7
 */
@Injectable()
export class GroupsService {
  private groupsSignal = signal<CometChat.Group[]>([]);
  private fetchStateSignal = signal<States>(States.loading);
  private hasMoreSignal = signal<boolean>(true);

  readonly groups = this.groupsSignal.asReadonly();
  readonly fetchState = this.fetchStateSignal.asReadonly();
  readonly hasMore = this.hasMoreSignal.asReadonly();

  private groupsRequest: CometChat.GroupsRequest | null = null;
  private errorCallback: GroupsErrorCallback | null = null;
  private isFetching = false;
  private loggedInUser: CometChat.User | null = null;

  private groupListenerId = `groups_service_group_${CometChatUIKitUtility.ID()}`;
  /** Guard: only re-fetch on reconnect after the first fetch has completed. */
  private initialFetchDone = false;

  // Injected here so the component doesn't need to wire up reconnect logic —
  // the service subscribes to the shared connection state directly.
  private connectionState = inject(ConnectionStateService);
  private destroyRef = inject(DestroyRef);

  private static readonly DEFAULT_LIMIT = 30;
  private static readonly MIN_SHIMMER_TIME = 1000;

  constructor() {
    // Re-fetch on WebSocket reconnect. Uses the shared singleton listener
    // instead of registering a per-service CometChat.ConnectionListener.
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleReconnect());
  }

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
      this.initialFetchDone = true;
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

  /** Attach SDK GroupListener for real-time group events. */
  attachListeners(): void {
    this.cacheLoggedInUser();
    attachGroupListener(this.groupListenerId, {
      isLoggedInUser: (user) => this.isLoggedInUser(user),
      updateGroupForSDKEvents: (params) => this.updateGroupForSDKEvents(params),
      removeGroup: (guid) => this.removeGroup(guid),
      updateGroup: (group) => this.updateGroup(group),
    });
  }

  /**
   * Remove the SDK group listener.
   * Connection listener is managed by the shared ConnectionStateService.
   */
  detachListeners(): void {
    try {
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      CometChatLogger.error('GroupsService', 'Error removing group listener:', error);
    }
  }

  // ==================== Private: Reconnect ====================

  /**
   * Called by ConnectionStateService when the WebSocket reconnects.
   * Resets the request and re-fetches the first page of groups.
   */
  private handleReconnect(): void {
    if (!this.groupsRequest || !this.initialFetchDone) return;
    CometChatLogger.info('GroupsService', 'WebSocket reconnected — refreshing group list');
    // Silent refresh: don't show shimmer, don't clear the list until new data arrives.
    const freshRequest = this.buildRequest('', null, null, '');
    freshRequest.fetchNext()
      .then(newGroups => {
        this.groupsSignal.set(newGroups);
        // Reset hasMore to true — we're back at page 1, more pages may exist
        this.hasMoreSignal.set(true);
        if (newGroups.length === 0) {
          this.fetchStateSignal.set(States.empty);
        } else {
          this.fetchStateSignal.set(States.loaded);
        }
        this.groupsRequest = freshRequest;
      })
      .catch(e => CometChatLogger.error('GroupsService', 'Error refreshing groups on reconnect:', e));
  }


  // ==================== List Mutation Methods ====================

  /** Update a group in the list by replacing it at its current position. */
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

  /** Remove a group from the list by GUID. */
  removeGroup(guid: string): void {
    const current = this.groupsSignal();
    const filtered = current.filter(g => g.getGuid() !== guid);
    this.groupsSignal.set(filtered);

    if (filtered.length === 0) {
      this.fetchStateSignal.set(States.empty);
    }
  }

  /** Prepend a group to the beginning of the list (if not already present). */
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

  /** Update a group for SDK events with additional metadata. */
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

  /** Append multiple groups to the list without duplicates. */
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
    this.initialFetchDone = false;
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
