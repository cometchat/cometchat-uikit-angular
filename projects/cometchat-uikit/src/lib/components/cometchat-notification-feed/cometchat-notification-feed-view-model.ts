import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  NotificationFeedItem,
  NotificationCategory,
  NotificationFeedState,
  TimestampGroup,
} from './cometchat-notification-feed.types';
import { groupByTimestamp } from './cometchat-notification-feed.utils';
import { isOfflineOn } from '../../utils/offline/offline-gate';
import { mergeSnapshotPage, readPageTwoPhase } from '../../utils/offline/two-phase';
import { OfflineListSession } from '../../utils/offline/list-session';

/**
 * ViewModel for CometChatNotificationFeed.
 * Manages all data operations: fetching, pagination, engagement, real-time updates.
 */
export class NotificationFeedViewModel {
  private feedRequestBuilder: any = null;
  private customFeedRequestBuilder: any = null;
  private categoriesRequestBuilder: any = null;
  private listenerId: string = '';
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private deliveredItemIds: Set<string> = new Set();
  private fetchVersion: number = 0;
  /** Offline: logout / user switch clears the feed, a cache reset reloads it (UIK-LIFE-01/02). */
  readonly offlineSession = new OfflineListSession();
  private onStateChange: (state: NotificationFeedState) => void;

  private state: NotificationFeedState = {
    items: [],
    groupedItems: [],
    categories: [],
    activeCategory: null,
    totalUnreadCount: 0,
    categoryUnreadCounts: new Map(),
    screenState: 'loading',
    isLoadingMore: false,
    isRefreshing: false,
    isOffline: false,
    error: null,
    hasMorePages: true,
    paginationError: false,
  };

  /**
   * Offline (D84): "Connect to load notifications" is up (the error state, because the device was not
   * connected), so the first page is read once by itself when the connection is back. A non-network
   * error never sets it.
   */
  private reloadOnConnect = false;
  /** Offline (D84 rule 3): nothing on screen and no connection says "Connect to load notifications", with no Retry. */
  get connectToLoad(): boolean {
    return this.reloadOnConnect && this.state.screenState === 'error' && isOfflineOn();
  }
  /**
   * Offline (D83): a load the user or app started failed while feed items were on screen. The
   * items stay and no error view shows; this is how the failure reaches `onError`.
   */
  private onKeptRowsError?: (error: CometChat.CometChatException) => void;

  constructor(
    onStateChange: (state: NotificationFeedState) => void,
    feedRequestBuilder?: any,
    categoriesRequestBuilder?: any,
    onKeptRowsError?: (error: CometChat.CometChatException) => void
  ) {
    this.onStateChange = onStateChange;
    this.onKeptRowsError = onKeptRowsError;
    this.customFeedRequestBuilder = feedRequestBuilder || null;
    this.feedRequestBuilder = feedRequestBuilder || null;
    this.categoriesRequestBuilder = categoriesRequestBuilder || null;
    this.listenerId = `notification_feed_${Date.now()}`;
  }

  /**
   * Get current state.
   */
  getState(): NotificationFeedState {
    return this.state;
  }

  /**
   * Update state and notify the view.
   */
  private setState(partial: Partial<NotificationFeedState>): void {
    this.state = { ...this.state, ...partial };
    if (partial.items !== undefined) {
      this.state.groupedItems = groupByTimestamp(this.state.items);
    }
    this.onStateChange(this.state);
  }

  /**
   * Initialize: fetch categories, first page, register listener.
   */
  async init(): Promise<void> {
    this.setState({ screenState: 'loading' });

    await this.fetchCategories();
    await this.fetchInitialItems();
    this.registerListener();
  }

  /**
   * Cleanup: remove listener, stop polling.
   */
  dispose(): void {
    this.removeListener();
    this.stopUnreadCountPolling();
  }

  /**
   * Fetch available categories for filter chips.
   */
  async fetchCategories(): Promise<void> {
    try {
      let builder = this.categoriesRequestBuilder;
      if (!builder) {
        builder = new CometChat.NotificationCategoriesRequestBuilder()
          .setLimit(50)
          .build();
      }
      const categories: NotificationCategory[] = await builder.fetchNext();
      this.setState({ categories });
    } catch (error) {
      // Categories fetch failure is non-fatal — show "All" chip only
      console.warn('[NotificationFeed] Failed to fetch categories:', error);
      this.setState({ categories: [] });
    }
  }

  /**
   * One page of the feed. Offline on: `onCached` gets the cached page first and the answer is the
   * server page, or null when the server could not be reached (an offline read past the cache).
   * Offline off: the request's one read, as before.
   */
  private async readFeedPage(
    onCached: (items: NotificationFeedItem[]) => void
  ): Promise<{ page: NotificationFeedItem[] | null; unreachable?: unknown }> {
    if (!isOfflineOn()) return { page: await this.feedRequestBuilder.fetchNext() };
    this.offlineSession.markRan();
    const { server, unreachable } = await readPageTwoPhase<NotificationFeedItem>(this.feedRequestBuilder, 'notificationFeed', onCached);
    return { page: server, unreachable };
  }

  /**
   * Offline on (D84): a first-page load failed. With nothing on screen it is the error state, `onError`
   * once; offline, the feed shows "Connect to load notifications" and loads once more when the
   * connection is back (rules 3 and 8). With items on screen they stay: a not-connected failure
   * reports nothing (rule 2), a real failure of a load the user or app started reports once (rule 5).
   * Returns false when offline is off: the caller keeps today's error handling.
   */
  private failOffline(error: unknown, notConnected: boolean, automatic: boolean, extra: Partial<NotificationFeedState> = {}): boolean {
    if (!isOfflineOn()) return false;
    if (this.state.items.length === 0) {
      this.reloadOnConnect = notConnected;
      this.setState({ ...extra, screenState: 'error', error: error as CometChat.CometChatException });
    } else {
      this.setState({ ...extra, screenState: 'loaded' });
      if (!automatic && !notConnected) this.onKeptRowsError?.(error as CometChat.CometChatException);
    }
    return true;
  }

  /**
   * Offline on, on reconnect: the error view is up because the device was offline, so the first
   * page is read once by itself (D83). A non-network error is not reloaded.
   */
  reloadAfterOfflineError(): void {
    if (!isOfflineOn() || !this.reloadOnConnect || this.state.screenState !== 'error' || this.state.items.length > 0) return;
    this.reloadOnConnect = false;
    this.setState({ screenState: 'loading' });
    void this.fetchInitialItems(true);
  }

  /** Logout / user switch: nothing of the old session stays on screen. */
  clearForSession(): void {
    this.fetchVersion++;
    this.deliveredItemIds.clear();
    this.setState({
      items: [], screenState: 'loading', isLoadingMore: false, isRefreshing: false,
      hasMorePages: true, paginationError: false, totalUnreadCount: 0, categoryUnreadCounts: new Map(),
    });
  }

  /** The offline cache was rebuilt: read the first page again, cached then server. */
  reloadAfterReset(): void {
    void this.fetchInitialItems(true);
  }

  /**
   * Fetch the first page of feed items.
   * Uses fetchVersion to discard stale results from previous category switches.
   */
  async fetchInitialItems(automatic = false): Promise<void> {
    const version = ++this.fetchVersion;
    this.reloadOnConnect = false;
    try {
      this.initFeedRequestBuilder();
      const { page: items, unreachable } = await this.readFeedPage(cached => {
        if (version === this.fetchVersion && cached.length > 0) {
          this.setState({ items: cached, screenState: 'loaded', hasMorePages: true });
        }
      });

      // Discard result if a newer fetch was triggered (category switch race)
      if (version !== this.fetchVersion) return;

      if (items === null) {
        // Offline and nothing newer to show: cached items stay; the load failed (D83).
        this.failOffline(unreachable, true, automatic);
        return;
      }

      if (items.length === 0) {
        this.setState({ items: [], screenState: 'empty', hasMorePages: false });
      } else {
        this.setState({ items, screenState: 'loaded', hasMorePages: true });
        this.reportDeliveredBatch(items);
      }

      await this.fetchUnreadCount();
    } catch (error: any) {
      if (version !== this.fetchVersion) return;
      if (this.failOffline(error, false, automatic)) return;
      this.setState({
        screenState: 'error',
        error: error as CometChat.CometChatException,
      });
    }
  }

  /**
   * Fetch next page (infinite scroll).
   */
  async fetchNextPage(): Promise<void> {
    if (this.state.isLoadingMore || !this.state.hasMorePages) return;

    this.setState({ isLoadingMore: true, paginationError: false });

    try {
      if (isOfflineOn()) {
        await this.fetchNextPageOffline();
        return;
      }
      const items: NotificationFeedItem[] = await this.feedRequestBuilder.fetchNext();

      if (items.length === 0) {
        this.setState({ isLoadingMore: false, hasMorePages: false });
      } else {
        // Deduplicate: filter out items already in the list
        const existingIds = new Set(this.state.items.map((i) => i.getId()));
        const newItems = items.filter((item) => !existingIds.has(item.getId()));

        if (newItems.length === 0) {
          this.setState({ isLoadingMore: false, hasMorePages: false });
        } else {
          const allItems = [...this.state.items, ...newItems];
          this.setState({ items: allItems, isLoadingMore: false });
          this.reportDeliveredBatch(newItems);
        }
      }
    } catch (error) {
      console.warn('[NotificationFeed] Pagination error:', error);
      this.setState({ isLoadingMore: false, paginationError: true });
    }
  }

  /**
   * Offline path of {@link fetchNextPage}: cached rows join the list at once, the server page then
   * replaces them in place; rows are deduped by id so "load more" never repeats one, and a read
   * past the cache while offline leaves the list and offers a retry.
   */
  private async fetchNextPageOffline(): Promise<void> {
    this.offlineSession.markRan();
    const epoch = this.offlineSession.epoch;
    const keyOf = (item: NotificationFeedItem) => item.getId();
    let cachedKeys = new Set<string>();
    const server = await readPageTwoPhase<NotificationFeedItem>(this.feedRequestBuilder, 'notificationFeed', cached => {
      if (this.offlineSession.isStale(epoch) || cached.length === 0) return;
      cachedKeys = new Set(cached.map(keyOf));
      this.setState({ items: mergeSnapshotPage(this.state.items, new Set<string>(), cached, keyOf) });
    }).then(result => result.server);
    if (this.offlineSession.isStale(epoch)) return;
    if (server === null) {
      this.setState({ isLoadingMore: false, paginationError: true });
      return;
    }
    this.setState({
      items: mergeSnapshotPage(this.state.items, cachedKeys, server, keyOf),
      isLoadingMore: false,
      // Only an empty server page ends the list (BEH-READ-09b).
      hasMorePages: server.length > 0,
    });
    this.reportDeliveredBatch(server);
  }

  /**
   * Retry pagination after error.
   */
  retryPagination(): void {
    this.setState({ paginationError: false, hasMorePages: true });
    this.fetchNextPage();
  }

  /**
   * Refresh feed (pull-to-refresh or reconnect).
   */
  async refresh(): Promise<void> {
    if (this.state.isRefreshing) return;

    this.setState({ isRefreshing: true });
    this.deliveredItemIds.clear();
    this.reloadOnConnect = false;

    try {
      this.initFeedRequestBuilder();
      const { page: items, unreachable } = await this.readFeedPage(cached => {
        if (cached.length > 0) this.setState({ items: cached, screenState: 'loaded', hasMorePages: true });
      });

      if (items === null) {
        // Offline: cached items stay; the refresh failed (D83).
        this.failOffline(unreachable, true, false, { isRefreshing: false });
        return;
      }

      if (items.length === 0) {
        this.setState({ items: [], screenState: 'empty', isRefreshing: false, hasMorePages: false });
      } else {
        this.setState({ items, screenState: 'loaded', isRefreshing: false, hasMorePages: true });
        this.reportDeliveredBatch(items);
      }

      await this.fetchUnreadCount();
    } catch (error: any) {
      if (this.failOffline(error, false, false, { isRefreshing: false })) return;
      this.setState({
        screenState: 'error',
        isRefreshing: false,
        error: error as CometChat.CometChatException,
      });
    }
  }

  /**
   * Switch category filter.
   */
  switchCategory(category: string | null): void {
    this.setState({ activeCategory: category, screenState: 'loading', items: [], hasMorePages: true });
    this.deliveredItemIds.clear();
    this.fetchInitialItems();
  }

  // --- Engagement Methods ---

  /**
   * Report delivered for a batch of items (once per item).
   */
  private reportDeliveredBatch(items: NotificationFeedItem[]): void {
    for (const item of items) {
      this.reportDelivered(item);
    }
  }

  /**
   * Report item as delivered (fire-and-forget, once per item).
   */
  reportDelivered(item: NotificationFeedItem): void {
    if (this.deliveredItemIds.has(item.getId())) return;
    this.deliveredItemIds.add(item.getId());

    try {
      const result = CometChat.markFeedItemAsDelivered(item);
      if (result && result.catch) {
        result.catch(() => { /* fire-and-forget */ });
      }
    } catch (error) {
      // Silently ignore - engagement is fire-and-forget
    }
  }

  /**
   * Report item as viewed (fire-and-forget).
   */
  reportViewed(item: NotificationFeedItem): void {
    try {
      const result = CometChat.reportFeedEngagement(item, 'viewed');
      if (result && result.catch) {
        result.catch(() => { /* fire-and-forget */ });
      }
    } catch (error) {
      // Silently ignore
    }
  }

  /**
   * Report item as read (after 1s visibility).
   */
  reportRead(item: NotificationFeedItem): void {
    try {
      const result = CometChat.markFeedItemAsRead(item);
      if (result && result.catch) {
        result.catch(() => { /* fire-and-forget */ });
      }
      // Update local state
      const updatedItems = this.state.items.map((i) =>
        i.getId() === item.getId()
          ? (() => { i.setReadAt(Math.floor(Date.now() / 1000)); return i; })()
          : i
      );
      const newUnreadCount = Math.max(0, this.state.totalUnreadCount - 1);

      // Decrement per-category unread count
      const categoryUnreadCounts = new Map(this.state.categoryUnreadCounts);
      if (item.getCategory()) {
        const currentCount = categoryUnreadCounts.get(item.getCategory()) || 0;
        if (currentCount > 0) {
          categoryUnreadCounts.set(item.getCategory(), currentCount - 1);
        }
      }

      this.setState({ items: updatedItems, totalUnreadCount: newUnreadCount, categoryUnreadCounts });
    } catch (error) {
      console.warn('[NotificationFeed] Failed to mark read:', error);
    }
  }

  /**
   * Report item as clicked.
   */
  reportClicked(item: NotificationFeedItem): void {
    try {
      const result = CometChat.reportFeedEngagement(item, 'clicked');
      if (result && result.catch) {
        result.catch(() => { /* fire-and-forget */ });
      }
    } catch (error) {
      // Silently ignore
    }
  }

  /**
   * Report item as interacted (action button tap).
   */
  reportInteracted(item: NotificationFeedItem): void {
    try {
      const result = CometChat.reportFeedEngagement(item, 'interacted');
      if (result && result.catch) {
        result.catch(() => { /* fire-and-forget */ });
      }
    } catch (error) {
      // Silently ignore
    }
  }

  // --- Real-Time ---

  /**
   * Register WebSocket listener for new feed items.
   */
  private registerListener(): void {
    try {
      CometChat.addNotificationFeedListener(
        this.listenerId,
        {
          onFeedItemReceived: (feedItem: NotificationFeedItem) => {
            this.onFeedItemReceived(feedItem);
          },
        }
      );
    } catch (error) {
      console.warn('[NotificationFeed] Failed to register listener:', error);
    }
  }

  /**
   * Remove WebSocket listener.
   */
  private removeListener(): void {
    try {
      CometChat.removeNotificationFeedListener(this.listenerId);
    } catch (error) {
      console.warn('[NotificationFeed] Failed to remove listener:', error);
    }
  }

  /**
   * Handle new feed item received via WebSocket.
   */
  onFeedItemReceived(item: NotificationFeedItem): void {
    // Always update unread counts (regardless of active filter)
    const newUnreadCount = this.state.totalUnreadCount + 1;
    const categoryUnreadCounts = new Map(this.state.categoryUnreadCounts);
    if (item.getCategory()) {
      const currentCount = categoryUnreadCounts.get(item.getCategory()) || 0;
      categoryUnreadCounts.set(item.getCategory(), currentCount + 1);
    }

    // Only prepend to visible list if no category filter is active,
    // or if the item matches the active category filter
    const matchesFilter = !this.state.activeCategory || item.getCategory() === this.state.activeCategory;

    if (matchesFilter) {
      const updatedItems = [item, ...this.state.items];
      this.setState({
        items: updatedItems,
        screenState: 'loaded',
        totalUnreadCount: newUnreadCount,
        categoryUnreadCounts,
      });
    } else {
      // Update counts only — don't insert into visible list
      this.setState({
        totalUnreadCount: newUnreadCount,
        categoryUnreadCounts,
      });
    }

    // Mark as delivered
    this.reportDelivered(item);
  }

  // --- Unread Count ---

  /**
   * Fetch current unread count.
   */
  private async fetchUnreadCount(): Promise<void> {
    try {
      const result = await CometChat.getNotificationFeedUnreadCount();
      const count = typeof result === 'number' ? result : result?.count ?? 0;
      this.setState({ totalUnreadCount: count });
    } catch (error: any) {
      if (error?.code !== 'ERR_BAD_REQUEST') {
        console.warn('[NotificationFeed] Failed to fetch unread count:', error);
      }
    }
  }

  /**
   * Start polling unread count every 30 seconds.
   */
  startUnreadCountPolling(intervalMs: number = 30000): void {
    this.stopUnreadCountPolling();
    this.pollingInterval = setInterval(() => {
      this.fetchUnreadCount();
    }, intervalMs);
  }

  /**
   * Stop polling.
   */
  stopUnreadCountPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // --- Helpers ---

  /**
   * Initialize or re-initialize the feed request builder.
   * Respects custom builder if provided via constructor (when no category filter active).
   */
  private initFeedRequestBuilder(): void {
    try {
      // If a custom builder was provided and no category filter is active, rebuild from it
      if (this.customFeedRequestBuilder && !this.state.activeCategory) {
        this.feedRequestBuilder = this.customFeedRequestBuilder;
        return;
      }

      const builder = new CometChat.NotificationFeedRequestBuilder().setLimit(15);

      if (this.state.activeCategory) {
        builder.setCategory(this.state.activeCategory);
      }

      this.feedRequestBuilder = builder.build();
    } catch (error) {
      console.warn('[NotificationFeed] Failed to init request builder:', error);
    }
  }
}
