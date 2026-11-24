import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../Enums/Enums';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { CometChatLogger } from '../utils/CometChatLogger';
import { GroupsErrorCallback } from './groups.service.types';
import { attachGroupListener, groupListenerHandlers } from './groups.service.utils';
import { replaySweptGroupActions } from '../utils/offline/swept-group-actions';
import type { Subscription } from 'rxjs';
import { ConnectionStateService } from './connection-state.service';
import { isOfflineOn } from '../utils/offline/offline-gate';
import { fetchNextTwoPhase, mergeSnapshotPage } from '../utils/offline/two-phase';
import { OfflineListSession, watchOfflineSession } from '../utils/offline/list-session';
import { isKeywordSearch, offlineStateFor } from '../utils/offline/list-states';
import { OfflineHubService } from './offline-hub.service';

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
  /**
   * Offline support (D83): bumped when a load the kit started itself (a cache-reset or
   * reconnect reload) has settled, so the component redraws from this service. Never
   * changes with offline off.
   */
  private readonly offlineSettledSignal = signal(0);
  readonly offlineSettled = this.offlineSettledSignal.asReadonly();
  /**
   * Offline (D84 rule 3): the list was read with no connection and nothing on screen, so
   * the kit shows "Connect to load groups" in place of the error view (the app's own error
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
  /**
   * Offline (D84): the offline state ("Connect to load groups" or "Connect to search") is up
   * because the device was not connected, so the first page loads once by itself when the
   * connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;
  /** Offline: the server answered a page of the current request (the next read is a "load more"). */
  private serverPageRead = false;
  /** The next offline read was started by the kit (cache reset, reconnect), not by the user or app. */
  private automaticLoad = false;

  // Injected here so the component doesn't need to wire up reconnect logic —
  // the service subscribes to the shared connection state directly.
  private connectionState = inject(ConnectionStateService);
  private destroyRef = inject(DestroyRef);

  /** Offline: logout / user switch clears the list, a cache reset reloads it (UIK-LIFE-01/02). */
  private readonly offlineSession = new OfflineListSession();
  private lastRequestArgs: [string, CometChat.GroupsRequestBuilder | null, CometChat.GroupsRequestBuilder | null, string] | null = null;

  private static readonly DEFAULT_LIMIT = 30;
  private static readonly MIN_SHIMMER_TIME = 1000;

  constructor() {
    // Re-fetch on WebSocket reconnect. Uses the shared singleton listener
    // instead of registering a per-service CometChat.ConnectionListener.
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleReconnect());
    watchOfflineSession(inject(OfflineHubService), this.destroyRef, this.offlineSession, {
      clear: () => this.clearForSession(),
      reload: () => this.reloadAfterReset(),
    });
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

    this.offlineSession.supersede();
    this.groupsSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;

    this.lastRequestArgs = [searchText, groupsRequestBuilder, searchRequestBuilder, groupsSearchText];
    this.groupsRequest = this.buildRequest(...this.lastRequestArgs);
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
    if (isOfflineOn()) {
      const automatic = this.automaticLoad;
      this.automaticLoad = false;
      return this.fetchNextOffline(this.groupsRequest, automatic);
    }

    this.isFetching = true;
    // A search or re-initialisation meanwhile makes this read stale: its page is
    // dropped and it leaves `isFetching` to the read that replaced it.
    const epoch = this.offlineSession.epoch;

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
      if (this.offlineSession.isStale(epoch)) return;

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
      if (this.offlineSession.isStale(epoch)) return;
      CometChatLogger.error('GroupsService', 'Error fetching groups:', error);
      if (this.groupsSignal().length === 0) {
        this.fetchStateSignal.set(States.error);
      }
      this.handleError(error);
    } finally {
      if (!this.offlineSession.isStale(epoch)) this.isFetching = false;
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
    this.offlineSession.supersede();
    this.groupsSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;

    this.lastRequestArgs = [keyword, config?.groupsRequestBuilder ?? null, config?.searchRequestBuilder ?? null, ''];
    this.groupsRequest = this.buildRequest(...this.lastRequestArgs);
  }

  // ==================== Listener Management ====================

  /** Attach SDK GroupListener for real-time group events. */
  attachListeners(): void {
    this.cacheLoggedInUser();
    const callbacks = {
      isLoggedInUser: (user: CometChat.User) => this.isLoggedInUser(user),
      updateGroupForSDKEvents: (params: Parameters<GroupsService['updateGroupForSDKEvents']>[0]) => this.updateGroupForSDKEvents(params),
      removeGroup: (guid: string) => this.removeGroup(guid),
      updateGroup: (group: CometChat.Group) => this.updateGroup(group),
    };
    attachGroupListener(this.groupListenerId, callbacks);
    // Offline: group actions missed while away arrive only in the SDK's sweep;
    // they run the same handlers as the live listener (README §3.7), but with
    // the two that write a group redirected: a swept action carries the group
    // as it was when the action happened, so it must be merged into the listed
    // row, never put in its place (see applySweptGroupAction).
    this.sweptGroupActions?.unsubscribe();
    this.sweptGroupActions = replaySweptGroupActions(
      this.offlineHubForSweep.messageSync$,
      () => this.offlineHubForSweep.gen,
      groupListenerHandlers({
        ...callbacks,
        updateGroupForSDKEvents: params => this.applySweptGroupAction(params),
        updateGroup: (group: CometChat.Group) => this.applySweptGroupAction({ group }),
      })
    );
  }
  private readonly offlineHubForSweep = inject(OfflineHubService);
  private sweptGroupActions: Subscription | null = null;

  /**
   * Remove the SDK group listener.
   * Connection listener is managed by the shared ConnectionStateService.
   */
  detachListeners(): void {
    this.sweptGroupActions?.unsubscribe();
    this.sweptGroupActions = null;
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
    if (this.needsOfflineReload()) return this.reloadAfterReset();
    if (!this.groupsRequest || !this.initialFetchDone) return;
    CometChatLogger.info('GroupsService', 'WebSocket reconnected — refreshing group list');
    // Silent refresh: don't show shimmer, don't clear the list until new data arrives.
    // Same request config (app builder and current search keyword) as the list's current load.
    const replaced = this.groupsRequest;
    const freshRequest = this.buildRequest(...(this.lastRequestArgs ?? (['', null, null, ''] as const)));
    freshRequest.fetchNext()
      .then(newGroups => {
        // A search or re-initialize since the reconnect owns the list now.
        if (this.groupsRequest !== replaced) return;
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

  /**
   * Apply a group action the catch-up sweep replayed.
   *
   * The live handlers hand over the group the action carries. Live that
   * snapshot is current, so the row is replaced with it. Swept, it is the group
   * as it was when the action happened, which on reconnect can be hours old:
   * replacing the row would undo the name, icon, description, owner and member
   * count the list refreshed from the server on the same reconnect. So only
   * what the action itself is about reaches the listed row — the member count,
   * the signed-in user's scope, and whether the signed-in user is in the group.
   * A group the signed-in user joined or was added to while away is still new
   * information, so it is added to the list as before.
   */
  private applySweptGroupAction(params: {
    group: CometChat.Group;
    newScope?: string;
    newCount?: number;
    hasJoined?: boolean;
    addGroup?: boolean;
  }): void {
    const { group, newScope, newCount, hasJoined, addGroup } = params;
    const guid = group?.getGuid?.();
    if (!guid) return;

    const current = this.groupsSignal();
    const index = current.findIndex(g => g.getGuid() === guid);
    if (index === -1) {
      if (addGroup) this.prependGroup(group);
      return;
    }

    const listed = current[index];
    let changed = false;
    if (typeof newCount === 'number' && Number.isFinite(newCount) && newCount >= 0 && listed.getMembersCount?.() !== newCount) {
      listed.setMembersCount(newCount);
      changed = true;
    }
    if (newScope && listed.getScope?.() !== newScope) {
      listed.setScope(newScope as CometChat.GroupMemberScope);
      changed = true;
    }
    if (hasJoined !== undefined && listed.getHasJoined?.() !== hasJoined) {
      listed.setHasJoined(hasJoined);
      changed = true;
    }
    // A new array so the list's signal consumers see the change.
    if (changed) this.groupsSignal.set([...current.slice(0, index), listed, ...current.slice(index + 1)]);
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
    this.offlineSession.supersede();
    this.detachListeners();
    this.groupsSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.groupsRequest = null;
    this.errorCallback = null;
    this.isFetching = false;
    this.loggedInUser = null;
    this.initialFetchDone = false;
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;
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

  /**
   * Offline path of {@link fetchNext}: the cached page paints at once, the
   * server page then replaces it in place (D83). A failed load with nothing on
   * screen shows the error view and fires `onError` once; with rows on screen the
   * rows stay and `onError` fires once for a first-page load the user or app
   * started (never for a "load more" page, never for a load the kit started).
   */
  private async fetchNextOffline(
    request: NonNullable<typeof this.groupsRequest>,
    automatic = false
  ): Promise<void> {
    this.isFetching = true;
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
    const keyOf = (item: CometChat.Group) => item.getGuid();
    try {
      await fetchNextTwoPhase<CometChat.Group>(request, 'groups', {
        onCached: page => {
          if (this.offlineSession.isStale(epoch) || page.length === 0) return;
          cachedKeys = new Set(page.map(keyOf));
          this.clearOfflineStates();
          this.groupsSignal.set(mergeSnapshotPage(this.groupsSignal(), new Set<string>(), page, keyOf));
          this.fetchStateSignal.set(States.loaded);
        },
        onServer: page => {
          if (this.offlineSession.isStale(epoch)) return;
          this.reloadOnConnect = false;
          this.clearOfflineStates();
          this.serverPageRead = true;
          this.groupsSignal.set(mergeSnapshotPage(this.groupsSignal(), cachedKeys, page, keyOf));
          // Only an empty server page ends the list (BEH-READ-09b).
          this.hasMoreSignal.set(page.length > 0);
          this.fetchStateSignal.set(this.groupsSignal().length === 0 ? States.empty : States.loaded);
          this.initialFetchDone = true;
        },
        onError: (error, notConnected) => {
          if (this.offlineSession.isStale(epoch)) return;
          CometChatLogger.error('GroupsService', 'Error fetching (offline path):', error);
          if (this.groupsSignal().length === 0) {
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
      if (!this.offlineSession.isStale(epoch)) {
        this.isFetching = false;
        if (automatic) this.offlineSettledSignal.update(n => n + 1);
      }
    }
  }

  /** Whether the read is a keyword search (D84 addition B): a filter alone is the plain list. */
  private isKeywordSearch(request: unknown): boolean {
    return isKeywordSearch(request, this.lastRequestArgs?.[0], this.lastRequestArgs?.[3]);
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
    this.groupsSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.groupsRequest = null;
    this.isFetching = false;
    this.initialFetchDone = false;
  }

  /**
   * Offline on, on reconnect: a list showing the error view because the device was
   * offline loads its first page once by itself (D83); so does a list whose cached rows
   * are shown but whose first page never loaded (quietly). A non-network error is not
   * reloaded. A list that did load refreshes as before.
   */
  private needsOfflineReload(): boolean {
    if (!isOfflineOn() || !this.offlineSession.ranOffline || this.isFetching || !this.lastRequestArgs) {
      return false;
    }
    const rowsShown = this.groupsSignal().length > 0;
    return (
      (this.reloadOnConnect && !rowsShown && (this.connectToLoadSignal() || this.connectToSearchSignal())) ||
      (rowsShown && !this.initialFetchDone)
    );
  }

  /** The offline cache was rebuilt: read the first page again, cached then server. */
  private reloadAfterReset(): void {
    if (!this.lastRequestArgs) return;
    this.groupsRequest = this.buildRequest(...this.lastRequestArgs);
    this.serverPageRead = false;
    if (this.groupsSignal().length === 0) this.fetchStateSignal.set(States.loading);
    this.automaticLoad = true;
    void this.fetchNext().finally(() => (this.automaticLoad = false));
  }
}
