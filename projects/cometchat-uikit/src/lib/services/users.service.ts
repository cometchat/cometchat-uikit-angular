import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../Enums/Enums';
import { CometChatLogger } from '../utils/CometChatLogger';
import { ConnectionStateService } from './connection-state.service';
import { isOfflineOn } from '../utils/offline/offline-gate';
import { fetchNextTwoPhase, mergeSnapshotPage } from '../utils/offline/two-phase';
import { OfflineListSession, watchOfflineSession } from '../utils/offline/list-session';
import { isKeywordSearch, offlineStateFor } from '../utils/offline/list-states';
import { OfflineHubService } from './offline-hub.service';

/**
 * Error callback type for propagating errors to the component.
 */
export type UsersErrorCallback = (error: CometChat.CometChatException) => void;

/**
 * UsersService
 *
 * Service responsible for managing user list state and SDK interactions.
 * NOT `providedIn: 'root'` — instantiated per component instance to avoid
 * shared state between multiple user lists.
 *
 * Uses Angular Signals for reactive state management.
 *
 * Reconnection on WebSocket drop is handled via the shared ConnectionStateService
 * rather than a per-instance CometChat.ConnectionListener.
 *
 * @see Requirements 2.2, 2.4, 2.6, 2.8
 */
@Injectable()
export class UsersService {
  // ==================== State Signals ====================

  private usersSignal = signal<CometChat.User[]>([]);
  /**
   * Offline support (D83): bumped when a load the kit started itself (a cache-reset or
   * reconnect reload) has settled, so the component redraws from this service. Never
   * changes with offline off.
   */
  private readonly offlineSettledSignal = signal(0);
  readonly offlineSettled = this.offlineSettledSignal.asReadonly();
  /**
   * Offline (D84 rule 3): the list was read with no connection and nothing on screen, so
   * the kit shows "Connect to load users" in place of the error view (the app's own error
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

  /** Read-only signal for the current user list. */
  readonly users = this.usersSignal.asReadonly();

  /** Read-only signal for the current fetch state. */
  readonly fetchState = this.fetchStateSignal.asReadonly();

  /** Read-only signal indicating if more users can be fetched. */
  readonly hasMore = this.hasMoreSignal.asReadonly();

  // ==================== Private State ====================

  private usersRequest: CometChat.UsersRequest | null = null;
  /** The next offline read was started by the kit (cache reset, reconnect), not by the user or app. */
  private automaticLoad = false;
  private errorCallback: UsersErrorCallback | null = null;
  private isFetching = false;
  /** Guard: only re-fetch on reconnect after the first fetch has completed. */
  private initialFetchDone = false;
  /**
   * Offline (D84): the offline state ("Connect to load users" or "Connect to search") is up
   * because the device was not connected, so the first page loads once by itself when the
   * connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;
  /** Offline: the server answered a page of the current request (the next read is a "load more"). */
  private serverPageRead = false;

  // Shared singleton connection listener — no per-service SDK listener needed.
  private connectionState = inject(ConnectionStateService);
  private destroyRef = inject(DestroyRef);

  /** Offline: logout / user switch clears the list, a cache reset reloads it (UIK-LIFE-01/02). */
  private readonly offlineSession = new OfflineListSession();
  private lastRequestArgs: [string, CometChat.UsersRequestBuilder | null, CometChat.UsersRequestBuilder | null, string] | null = null;

  // ==================== Configuration ====================

  private static readonly DEFAULT_LIMIT = 30;
  private static readonly MIN_SHIMMER_TIME = 1000;

  constructor() {
    // Re-fetch on WebSocket reconnect using the shared ConnectionStateService.
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleReconnect());
    watchOfflineSession(inject(OfflineHubService), this.destroyRef, this.offlineSession, {
      clear: () => this.clearForSession(),
      reload: () => this.reloadAfterReset(),
    });
  }

  // ==================== Public API ====================

  /**
   * Set the error callback for propagating errors to the component.
   */
  setErrorCallback(callback: UsersErrorCallback | null): void {
    this.errorCallback = callback;
  }

  /**
   * Initialize the service with request builder configuration.
   * Ports the UsersManager constructor logic.
   *
   * @param config - Configuration matching the original UsersManager constructor args
   */
  initialize(config: {
    usersRequestBuilder?: CometChat.UsersRequestBuilder | null;
    searchRequestBuilder?: CometChat.UsersRequestBuilder | null;
    searchText?: string;
    usersSearchText?: string;
  }): void {
    const {
      usersRequestBuilder = null,
      searchRequestBuilder = null,
      searchText = '',
      usersSearchText = '',
    } = config;

    this.offlineSession.supersede();
    this.usersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;

    this.lastRequestArgs = [searchText, usersRequestBuilder, searchRequestBuilder, usersSearchText];
    this.usersRequest = this.buildRequest(...this.lastRequestArgs);
  }

  /**
   * Fetch the next page of users from the SDK.
   * Includes minimum shimmer time on initial fetch, duplicate-free appending,
   * hasMore tracking, and isFetching guard to prevent concurrent calls.
   */
  async fetchNext(): Promise<void> {
    if (!this.usersRequest || this.isFetching) {
      return;
    }
    if (isOfflineOn()) {
      const automatic = this.automaticLoad;
      this.automaticLoad = false;
      return this.fetchNextOffline(this.usersRequest, automatic);
    }

    this.isFetching = true;
    // A search or re-initialisation meanwhile makes this read stale: its page is
    // dropped and it leaves `isFetching` to the read that replaced it.
    const epoch = this.offlineSession.epoch;

    const isInitialFetch =
      this.usersSignal().length === 0 && this.fetchStateSignal() === States.loading;
    const startTime = Date.now();

    try {
      const newUsers = await this.usersRequest.fetchNext();

      // Ensure shimmer is visible for at least MIN_SHIMMER_TIME on initial fetch
      if (isInitialFetch) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, UsersService.MIN_SHIMMER_TIME - elapsed);
        await new Promise<void>(resolve => setTimeout(resolve, remainingTime));
      }
      if (this.offlineSession.isStale(epoch)) return;

      if (newUsers.length === 0) {
        this.hasMoreSignal.set(false);
        if (this.usersSignal().length === 0) {
          this.fetchStateSignal.set(States.empty);
        }
        this.isFetching = false;
        return;
      }

      this.appendUsersWithoutDuplicates(newUsers);

      if (newUsers.length < UsersService.DEFAULT_LIMIT) {
        this.hasMoreSignal.set(false);
      }

      this.fetchStateSignal.set(States.loaded);
      this.initialFetchDone = true;
    } catch (error) {
      if (this.offlineSession.isStale(epoch)) return;
      CometChatLogger.error('UsersService', 'Error fetching users:', error);
      if (this.usersSignal().length === 0) {
        this.fetchStateSignal.set(States.error);
      }
      this.handleError(error);
    } finally {
      if (!this.offlineSession.isStale(epoch)) this.isFetching = false;
    }
  }

  /**
   * Search users by keyword. Resets the list and creates a new request builder.
   *
   * @param keyword - The search keyword
   * @param config - Optional configuration with custom request builders
   */
  search(
    keyword: string,
    config?: {
      usersRequestBuilder?: CometChat.UsersRequestBuilder | null;
      searchRequestBuilder?: CometChat.UsersRequestBuilder | null;
      usersSearchText?: string;
    }
  ): void {
    this.offlineSession.supersede();
    this.usersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;

    this.lastRequestArgs = [
      keyword,
      config?.usersRequestBuilder ?? null,
      config?.searchRequestBuilder ?? null,
      config?.usersSearchText ?? '',
    ];
    this.usersRequest = this.buildRequest(...this.lastRequestArgs);
  }

  // ==================== Listener Management ====================

  /**
   * Remove the user listener (connection listener is handled by ConnectionStateService).
   */
  detachListeners(): void {
    // No per-service connection listener to remove — ConnectionStateService owns it.
  }

  // ==================== Private: Reconnect ====================

  /**
   * Called by ConnectionStateService when the WebSocket reconnects.
   * Resets the list and re-fetches the first page of users.
   */
  private handleReconnect(): void {
    if (this.needsOfflineReload()) return this.reloadAfterReset();
    if (!this.usersRequest || !this.initialFetchDone) return;
    CometChatLogger.info('UsersService', 'WebSocket reconnected — refreshing user list');
    // Silent refresh: don't show shimmer, don't clear the list until new data arrives.
    // Build a fresh request for the latest first page, from the same request config
    // (app builder and current search keyword) as the list's current load.
    const replaced = this.usersRequest;
    const freshRequest = this.buildRequest(...(this.lastRequestArgs ?? (['', null, null, ''] as const)));
    freshRequest.fetchNext()
      .then(newUsers => {
        // A search or re-initialize since the reconnect owns the list now.
        if (this.usersRequest !== replaced) return;
        this.usersSignal.set(newUsers);
        // Reset hasMore to true — we're back at page 1, more pages may exist
        this.hasMoreSignal.set(true);
        if (newUsers.length === 0) {
          this.fetchStateSignal.set(States.empty);
        } else {
          this.fetchStateSignal.set(States.loaded);
        }
        this.usersRequest = freshRequest;
      })
      .catch(e => CometChatLogger.error('UsersService', 'Error refreshing users on reconnect:', e));
  }

  // ==================== List Mutation Methods ====================

  /**
   * Update a user in the list by replacing it at its current position.
   *
   * @param user - The updated user object
   */
  updateUser(user: CometChat.User): void {
    const current = this.usersSignal();
    const index = current.findIndex(u => u.getUid() === user.getUid());

    if (index !== -1) {
      this.usersSignal.set([
        ...current.slice(0, index),
        user,
        ...current.slice(index + 1),
      ]);
    }
  }

  /**
   * Remove a user from the list by UID.
   *
   * @param uid - The UID of the user to remove
   */
  removeUser(uid: string): void {
    const current = this.usersSignal();
    const filtered = current.filter(u => u.getUid() !== uid);
    this.usersSignal.set(filtered);

    if (filtered.length === 0) {
      this.fetchStateSignal.set(States.empty);
    }
  }

  /**
   * Append multiple users to the list without duplicates.
   *
   * @param users - The users to append
   */
  appendUsersWithoutDuplicates(users: CometChat.User[]): void {
    const current = this.usersSignal();
    const existingUids = new Set(current.map(u => u.getUid()));
    const newUsers = users.filter(u => !existingUids.has(u.getUid()));

    if (newUsers.length > 0) {
      this.usersSignal.set([...current, ...newUsers]);
    }
  }

  // ==================== Cleanup ====================

  /**
   * Full cleanup: detach listeners and reset state.
   */
  cleanup(): void {
    this.offlineSession.supersede();
    this.detachListeners();
    this.usersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.usersRequest = null;
    this.errorCallback = null;
    this.isFetching = false;
    this.initialFetchDone = false;
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    this.serverPageRead = false;
  }

  // ==================== Private Helpers ====================

  /**
   * Build a UsersRequest from the provided configuration.
   * Ports the UsersManager constructor logic.
   */
  private buildRequest(
    searchText: string,
    usersRequestBuilder: CometChat.UsersRequestBuilder | null,
    searchRequestBuilder: CometChat.UsersRequestBuilder | null,
    usersSearchText: string
  ): CometChat.UsersRequest {
    if (searchText) {
      if (searchRequestBuilder) {
        return searchRequestBuilder.setSearchKeyword(searchText).build();
      } else if (usersRequestBuilder) {
        return usersRequestBuilder.setSearchKeyword(searchText).build();
      } else {
        return new CometChat.UsersRequestBuilder()
          .setLimit(UsersService.DEFAULT_LIMIT)
          .setSearchKeyword(searchText)
          .build();
      }
    } else {
      if (usersRequestBuilder) {
        return usersRequestBuilder.build();
      } else {
        return new CometChat.UsersRequestBuilder()
          .setLimit(UsersService.DEFAULT_LIMIT)
          .build();
      }
    }
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
        code: 'USERS_ERROR',
        message: error.message,
        details: error.stack || '',
      });
    }

    return new CometChat.CometChatException({
      code: 'USERS_ERROR',
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
    request: NonNullable<typeof this.usersRequest>,
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
    const keyOf = (item: CometChat.User) => item.getUid();
    try {
      await fetchNextTwoPhase<CometChat.User>(request, 'users', {
        onCached: page => {
          if (this.offlineSession.isStale(epoch) || page.length === 0) return;
          cachedKeys = new Set(page.map(keyOf));
          this.clearOfflineStates();
          this.usersSignal.set(mergeSnapshotPage(this.usersSignal(), new Set<string>(), page, keyOf));
          this.fetchStateSignal.set(States.loaded);
        },
        onServer: page => {
          if (this.offlineSession.isStale(epoch)) return;
          this.reloadOnConnect = false;
          this.clearOfflineStates();
          this.serverPageRead = true;
          this.usersSignal.set(mergeSnapshotPage(this.usersSignal(), cachedKeys, page, keyOf));
          // Only an empty server page ends the list (BEH-READ-09b).
          this.hasMoreSignal.set(page.length > 0);
          this.fetchStateSignal.set(this.usersSignal().length === 0 ? States.empty : States.loaded);
          this.initialFetchDone = true;
        },
        onError: (error, notConnected) => {
          if (this.offlineSession.isStale(epoch)) return;
          CometChatLogger.error('UsersService', 'Error fetching (offline path):', error);
          if (this.usersSignal().length === 0) {
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
    const args = this.lastRequestArgs;
    return isKeywordSearch(request, args?.[0], args?.[3]);
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
    this.usersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.usersRequest = null;
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
    const rowsShown = this.usersSignal().length > 0;
    return (
      (this.reloadOnConnect && !rowsShown && (this.connectToLoadSignal() || this.connectToSearchSignal())) ||
      (rowsShown && !this.initialFetchDone)
    );
  }

  /** The offline cache was rebuilt: read the first page again, cached then server. */
  private reloadAfterReset(): void {
    if (!this.lastRequestArgs) return;
    this.usersRequest = this.buildRequest(...this.lastRequestArgs);
    this.serverPageRead = false;
    if (this.usersSignal().length === 0) this.fetchStateSignal.set(States.loading);
    this.automaticLoad = true;
    void this.fetchNext().finally(() => (this.automaticLoad = false));
  }
}
