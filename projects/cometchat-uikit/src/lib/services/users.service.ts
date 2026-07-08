import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../Enums/Enums';
import { CometChatLogger } from '../utils/CometChatLogger';
import { ConnectionStateService } from './connection-state.service';

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
  private errorCallback: UsersErrorCallback | null = null;
  private isFetching = false;
  /** Guard: only re-fetch on reconnect after the first fetch has completed. */
  private initialFetchDone = false;

  // Shared singleton connection listener — no per-service SDK listener needed.
  private connectionState = inject(ConnectionStateService);
  private destroyRef = inject(DestroyRef);

  // ==================== Configuration ====================

  private static readonly DEFAULT_LIMIT = 30;
  private static readonly MIN_SHIMMER_TIME = 1000;

  constructor() {
    // Re-fetch on WebSocket reconnect using the shared ConnectionStateService.
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleReconnect());
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

    this.usersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;

    this.usersRequest = this.buildRequest(
      searchText,
      usersRequestBuilder,
      searchRequestBuilder,
      usersSearchText
    );
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

    this.isFetching = true;

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
      CometChatLogger.error('UsersService', 'Error fetching users:', error);
      if (this.usersSignal().length === 0) {
        this.fetchStateSignal.set(States.error);
      }
      this.handleError(error);
    } finally {
      this.isFetching = false;
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
    this.usersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.isFetching = false;

    this.usersRequest = this.buildRequest(
      keyword,
      config?.usersRequestBuilder ?? null,
      config?.searchRequestBuilder ?? null,
      config?.usersSearchText ?? ''
    );
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
    if (!this.usersRequest || !this.initialFetchDone) return;
    CometChatLogger.info('UsersService', 'WebSocket reconnected — refreshing user list');
    // Silent refresh: don't show shimmer, don't clear the list until new data arrives.
    // Build a fresh request to get the latest first page.
    const freshRequest = this.buildRequest('', null, null, '');
    freshRequest.fetchNext()
      .then(newUsers => {
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
    this.detachListeners();
    this.usersSignal.set([]);
    this.fetchStateSignal.set(States.loading);
    this.hasMoreSignal.set(true);
    this.usersRequest = null;
    this.errorCallback = null;
    this.isFetching = false;
    this.initialFetchDone = false;
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
}
