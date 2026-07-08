import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  NotificationFeedItem,
  NotificationCategory,
  NotificationFeedState,
  TimestampGroup,
} from './cometchat-notification-feed.types';
import { groupByTimestamp } from './cometchat-notification-feed.utils';

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

  constructor(
    onStateChange: (state: NotificationFeedState) => void,
    feedRequestBuilder?: any,
    categoriesRequestBuilder?: any
  ) {
    this.onStateChange = onStateChange;
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
   * Fetch the first page of feed items.
   * Uses fetchVersion to discard stale results from previous category switches.
   */
  async fetchInitialItems(): Promise<void> {
    const version = ++this.fetchVersion;
    try {
      this.initFeedRequestBuilder();
      const items: NotificationFeedItem[] = await this.feedRequestBuilder.fetchNext();

      // Discard result if a newer fetch was triggered (category switch race)
      if (version !== this.fetchVersion) return;

      if (items.length === 0) {
        this.setState({ items: [], screenState: 'empty', hasMorePages: false });
      } else {
        this.setState({ items, screenState: 'loaded', hasMorePages: true });
        this.reportDeliveredBatch(items);
      }

      await this.fetchUnreadCount();
    } catch (error: any) {
      if (version !== this.fetchVersion) return;
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

    try {
      this.initFeedRequestBuilder();
      const items: NotificationFeedItem[] = await this.feedRequestBuilder.fetchNext();

      if (items.length === 0) {
        this.setState({ items: [], screenState: 'empty', isRefreshing: false, hasMorePages: false });
      } else {
        this.setState({ items, screenState: 'loaded', isRefreshing: false, hasMorePages: true });
        this.reportDeliveredBatch(items);
      }

      await this.fetchUnreadCount();
    } catch (error: any) {
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
