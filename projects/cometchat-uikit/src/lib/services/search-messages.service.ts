import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { ConnectionStateService } from './connection-state.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, States } from '../Enums/Enums';
import { hasValidMessageSearchCriteria } from '../components/cometchat-search/search-filter.utils';
import { isOfflineOn } from '../utils/offline/offline-gate';
import { isNotConnectedError } from '../utils/offline/reconcile';
import { SearchFailureHold } from './search-failure-hold';
import { mergeSnapshotPage, readPageTwoPhase } from '../utils/offline/two-phase';

/**
 * Service managing message search state and SDK queries.
 * Injected into CometChatSearchMessagesListComponent.
 */
@Injectable()
export class SearchMessagesService {
  /** Current message results */
  readonly messages: WritableSignal<CometChat.BaseMessage[]> = signal<CometChat.BaseMessage[]>([]);
  /** Current fetch state */
  readonly fetchState: WritableSignal<States> = signal<States>(States.loaded);
  /** Whether more pages exist */
  readonly hasMoreResults: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Offline (D83): a search the service re-ran by itself on reconnect failed. A search the user or
   * app started rejects to its caller instead; this is the channel for the one nobody awaits.
   */
  readonly reconnectSearchError$ = new Subject<CometChat.CometChatException>();
  /**
   * Offline (D84 rule 7): the search could not reach the server and nothing saved matches, so the list
   * says "Connect to search" (`fetchState` is `empty`; no `searchError`). It runs once more by itself
   * when the connection is back (rule 8). Always false with offline off.
   */
  readonly connectToSearch: WritableSignal<boolean> = signal<boolean>(false);
  /**
   * Offline (D84, Android): the search failed with a real error and nothing is shown, inside the search
   * component. The component decides, once both scopes have answered, whether that is the error view or
   * the plain empty state (`fetchState` is `empty`; no `searchError` from this scope). Always false with
   * offline off, and outside the search component.
   */
  readonly searchFailed: WritableSignal<boolean> = signal<boolean>(false);

  private searchRequest: CometChat.MessagesRequest | null = null;
  /** Whether the current search has a keyword (and so has no cache to read). */
  private keywordSearch = false;
  private isLoadingMore = false;
  /** Bumped by every new search and reset: an answer for an older one is dropped. */
  private generation = 0;
  private readonly connectionState = inject(ConnectionStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly failureHold = inject(SearchFailureHold, { optional: true });
  /**
   * Offline (D84): "Connect to search" is up because the device was not connected, so the same search
   * runs once more by itself when the connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;
  private lastSearch: {
    keyword: string;
    filters: CometChatSearchFilter[];
    uid?: string;
    guid?: string;
    customBuilder?: CometChat.MessagesRequestBuilder;
    alwaysShowSeeMore: boolean;
  } | null = null;

  constructor() {
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rerunAfterReconnect());
  }

  /** Offline on, "Connect to search" up because of no connection: run the last search once more (D84 rule 8). */
  private rerunAfterReconnect(): void {
    if (!isOfflineOn() || !this.reloadOnConnect || !this.connectToSearch() || !this.lastSearch) return;
    this.reloadOnConnect = false;
    const { keyword, filters, uid, guid, customBuilder, alwaysShowSeeMore } = this.lastSearch;
    this.search(keyword, filters, uid, guid, customBuilder, alwaysShowSeeMore).catch(error =>
      this.reconnectSearchError$.next(error)
    );
  }

  /**
   * Initiate a message search with the given criteria.
   */
  async search(
    keyword: string,
    filters: CometChatSearchFilter[],
    uid?: string,
    guid?: string,
    customBuilder?: CometChat.MessagesRequestBuilder,
    alwaysShowSeeMore = false
  ): Promise<void> {
    const gen = ++this.generation;
    const stale = () => gen !== this.generation;
    this.isLoadingMore = false;
    this.fetchState.set(States.loading);
    this.messages.set([]);
    this.hasMoreResults.set(false);
    this.reloadOnConnect = false;
    this.connectToSearch.set(false);
    this.searchFailed.set(false);
    this.failureHold?.drop('messages');
    this.lastSearch = { keyword, filters, uid, guid, customBuilder, alwaysShowSeeMore };
    this.keywordSearch = keyword.trim() !== '';

    if (!hasValidMessageSearchCriteria(keyword, filters, uid, guid)) {
      this.fetchState.set(States.empty);
      return;
    }

    try {
      this.searchRequest = this.buildRequest(
        keyword,
        filters,
        uid,
        guid,
        customBuilder,
        alwaysShowSeeMore
      );
      const limit = alwaysShowSeeMore ? 3 : 30;
      // Offline on, filters without a keyword: cached rows first, then the server's (README §3.9).
      if (isOfflineOn() && !this.keywordSearch) {
        await this.searchTwoPhase(this.searchRequest, limit, stale);
        return;
      }
      const results = await this.searchRequest.fetchPrevious();
      if (stale()) return;

      if (results.length > 0) {
        this.messages.set(results.reverse());
        this.fetchState.set(States.loaded);
        this.hasMoreResults.set(results.length >= limit);
      } else {
        this.fetchState.set(States.empty);
        this.hasMoreResults.set(false);
      }
    } catch (error) {
      // An older search's failure says nothing about the current one.
      if (stale()) return;
      // Offline on, no connection: the messages already on screen stay and nothing is reported (D84 rule 2); with
      // nothing on screen a keyword search is "Connect to search", an offline state with no `searchError`
      // (rule 7), and runs once more when the connection is back (rule 8). A search by filter alone is not
      // "Connect to search" (Android): it is the plain empty state, with no report and no re-run.
      const rowsShown = isOfflineOn() && this.messages().length > 0;
      if (isOfflineOn() && isNotConnectedError(error)) {
        const connectToSearch = this.keywordSearch && !rowsShown;
        this.reloadOnConnect = connectToSearch;
        this.connectToSearch.set(connectToSearch);
        this.fetchState.set(rowsShown ? States.loaded : States.empty);
        return;
      }
      // Offline on, inside the search component, a real failure with nothing on screen waits for the other
      // scope (Android's final state): the component makes it the error view only when that scope failed too,
      // reports it when that scope has results, and otherwise it is the plain empty state with no report.
      if (isOfflineOn() && !rowsShown && this.failureHold) {
        this.failureHold.hold('messages', error);
        this.searchFailed.set(true);
        this.fetchState.set(States.empty);
        return;
      }
      // Any other failure: results on screen stay (and it is reported once, rule 5); with nothing on
      // screen it is the error view (rule 4). The caller reports it: this is the search's `onError`.
      this.fetchState.set(rowsShown ? States.loaded : States.error);
      throw error;
    }
  }

  /** Filters without a keyword on the offline path: cached then server, newest first, deduped by id. */
  private async searchTwoPhase(request: CometChat.MessagesRequest, limit: number, stale: () => boolean): Promise<void> {
    const keyOf = (m: CometChat.BaseMessage) => String(m.getId());
    let cachedKeys = new Set<string>();
    const { server, unreachable } = await readPageTwoPhase<CometChat.BaseMessage>(request, 'messages', cached => {
      if (stale() || cached.length === 0) return;
      cachedKeys = new Set(cached.map(keyOf));
      this.messages.set([...cached].reverse());
      this.fetchState.set(States.loaded);
    }, 'previous');
    if (stale()) return;
    if (server === null) {
      // Offline and nothing newer: `search()` keeps the cached rows, or says "Connect to search" when
      // nothing is on screen (D84 rules 2 and 7).
      this.hasMoreResults.set(false);
      throw unreachable ?? new Error('not connected');
    }
    const merged = mergeSnapshotPage(this.messages(), cachedKeys, [...server].reverse(), keyOf);
    this.messages.set(merged);
    this.fetchState.set(merged.length > 0 ? States.loaded : States.empty);
    this.hasMoreResults.set(server.length >= limit);
  }

  /** Next page of a keyword-less search on the offline path; "load more" never repeats a row. */
  private async loadMoreTwoPhase(request: CometChat.MessagesRequest, stale: () => boolean): Promise<void> {
    const keyOf = (m: CometChat.BaseMessage) => String(m.getId());
    let cachedKeys = new Set<string>();
    const { server } = await readPageTwoPhase<CometChat.BaseMessage>(request, 'messages', cached => {
      if (stale() || cached.length === 0) return;
      cachedKeys = new Set(cached.map(keyOf));
      this.messages.update(prev => mergeSnapshotPage(prev, new Set<string>(), [...cached].reverse(), keyOf));
    }, 'previous');
    if (stale() || server === null) return;
    this.messages.update(prev => mergeSnapshotPage(prev, cachedKeys, [...server].reverse(), keyOf));
    this.hasMoreResults.set(server.length >= 30);
  }

  /**
   * Load the next page of results.
   */
  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.searchRequest) {
      return;
    }
    this.isLoadingMore = true;
    const gen = this.generation;
    const stale = () => gen !== this.generation;

    try {
      if (isOfflineOn() && !this.keywordSearch) {
        await this.loadMoreTwoPhase(this.searchRequest, stale);
        return;
      }
      const results = await this.searchRequest.fetchPrevious();
      if (stale()) return;
      if (results.length > 0) {
        this.messages.update(prev => [...prev, ...results.reverse()]);
        const limit = 30;
        this.hasMoreResults.set(results.length >= limit);
      } else {
        this.hasMoreResults.set(false);
      }
    } catch (error) {
      if (stale()) return;
      // Offline past the cache: keep the rows; the next scroll tries again.
      if (!(isOfflineOn() && isNotConnectedError(error))) throw error;
    } finally {
      // A newer search owns the flag.
      if (!stale()) this.isLoadingMore = false;
    }
  }

  /** Reset all state. */
  reset(): void {
    this.generation++;
    this.messages.set([]);
    this.fetchState.set(States.loaded);
    this.hasMoreResults.set(false);
    this.reloadOnConnect = false;
    this.connectToSearch.set(false);
    this.searchFailed.set(false);
    this.failureHold?.drop('messages');
    this.lastSearch = null;
    this.searchRequest = null;
    this.isLoadingMore = false;
  }

  /**
   * Build a MessagesRequest based on search criteria and filters.
   */
  private buildRequest(
    keyword: string,
    filters: CometChatSearchFilter[],
    uid?: string,
    guid?: string,
    customBuilder?: CometChat.MessagesRequestBuilder,
    alwaysShowSeeMore = false
  ): CometChat.MessagesRequest {
    let builder = customBuilder ? customBuilder : new CometChat.MessagesRequestBuilder();

    builder.hideDeletedMessages(true);
    const limit = alwaysShowSeeMore ? 3 : 30;

    if (!customBuilder) {
      builder = builder.setLimit(limit);
    }

    if (keyword.trim() !== '') {
      builder = builder.setSearchKeyword(keyword);
    }
    if (uid) {
      builder = builder.setUID(uid);
    }
    if (guid) {
      builder = builder.setGUID(guid);
    }

    // Apply filter-specific attachment types (matching React UIKit approach)
    if (filters.length > 0) {
      if (filters.includes(CometChatSearchFilter.Links)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        builder = (builder as any).hasLinks(true);
      }

      const attachmentTypeMap: Partial<Record<CometChatSearchFilter, CometChat.AttachmentType>> = {
        [CometChatSearchFilter.Photos]: CometChat.AttachmentType.IMAGE,
        [CometChatSearchFilter.Videos]: CometChat.AttachmentType.VIDEO,
        [CometChatSearchFilter.Documents]: CometChat.AttachmentType.FILE,
        [CometChatSearchFilter.Audio]: CometChat.AttachmentType.AUDIO,
      };

      for (const [filter, attachmentType] of Object.entries(attachmentTypeMap)) {
        if (filters.includes(filter as CometChatSearchFilter)) {
          builder = builder.setAttachmentTypes([attachmentType as CometChat.AttachmentType]);
          break;
        }
      }
    }

    return builder.build();
  }
}
