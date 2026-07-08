import { NotificationFeedItem, TimestampGroup } from './cometchat-notification-feed.types';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Groups feed items by their sentAt timestamp into labeled sections.
 *
 * Rules:
 * - sentAt is today → localized "Today"
 * - sentAt is yesterday → localized "Yesterday"
 * - sentAt is within this week → Day name (e.g., "Monday")
 * - sentAt is older → Localized date (e.g., "Jan 15, 2025")
 */
export function groupByTimestamp(items: NotificationFeedItem[]): TimestampGroup[] {
  if (!items || items.length === 0) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const startOfWeek = new Date(today.getTime() - today.getDay() * 86400000);

  const groupMap = new Map<string, NotificationFeedItem[]>();
  const groupOrder: string[] = [];

  for (const item of items) {
    const sentAt = item.getSentAt();
    const itemDate = new Date(sentAt * 1000);
    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    let label: string;

    if (itemDay.getTime() === today.getTime()) {
      label = CometChatLocalize.getLocalizedString('today');
    } else if (itemDay.getTime() === yesterday.getTime()) {
      label = CometChatLocalize.getLocalizedString('yesterday');
    } else if (itemDay.getTime() >= startOfWeek.getTime()) {
      label = itemDate.toLocaleDateString(undefined, { weekday: 'long' });
    } else {
      label = itemDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (!groupMap.has(label)) {
      groupMap.set(label, []);
      groupOrder.push(label);
    }
    groupMap.get(label)!.push(item);
  }

  return groupOrder.map((label) => ({
    label,
    items: groupMap.get(label)!,
  }));
}

/**
 * Visibility tracker using IntersectionObserver.
 * Tracks which items are visible and manages read/viewed engagement timers.
 */
export class VisibilityTracker {
  private observer: IntersectionObserver | null = null;
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private viewedItems: Set<string> = new Set();
  private readItems: Set<string> = new Set();
  private onViewed: (item: NotificationFeedItem) => void;
  private onRead: (item: NotificationFeedItem) => void;
  private itemMap: Map<string, NotificationFeedItem> = new Map();

  constructor(
    onViewed: (item: NotificationFeedItem) => void,
    onRead: (item: NotificationFeedItem) => void
  ) {
    this.onViewed = onViewed;
    this.onRead = onRead;
  }

  /**
   * Initialize the IntersectionObserver.
   */
  init(root: HTMLElement | null): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const itemId = entry.target.getAttribute('data-feed-item-id');
          if (!itemId) continue;

          const item = this.itemMap.get(itemId);
          if (!item) continue;

          if (entry.isIntersecting) {
            this.handleItemVisible(item);
          } else {
            this.handleItemHidden(item);
          }
        }
      },
      {
        root,
        threshold: 0.5,
      }
    );
  }

  /**
   * Observe a DOM element for a feed item.
   */
  observe(element: HTMLElement, item: NotificationFeedItem): void {
    this.itemMap.set(item.getId(), item);
    this.observer?.observe(element);
  }

  /**
   * Unobserve a DOM element.
   */
  unobserve(element: HTMLElement): void {
    this.observer?.unobserve(element);
  }

  /**
   * Handle item becoming visible in viewport.
   */
  private handleItemVisible(item: NotificationFeedItem): void {
    // Report viewed (once per item)
    if (!this.viewedItems.has(item.getId())) {
      this.viewedItems.add(item.getId());
      this.onViewed(item);
    }

    // Start 1-second timer for read (only if not already read)
    if (!this.readItems.has(item.getId()) && item.getReadAt() === null) {
      const timer = setTimeout(() => {
        this.readItems.add(item.getId());
        this.onRead(item);
        this.timers.delete(item.getId());
      }, 1000);
      this.timers.set(item.getId(), timer);
    }
  }

  /**
   * Handle item leaving viewport.
   */
  private handleItemHidden(item: NotificationFeedItem): void {
    // Cancel read timer if item leaves before 1 second
    const timer = this.timers.get(item.getId());
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(item.getId());
    }
  }

  /**
   * Mark an item as already read (e.g., when state updates externally).
   */
  markAsRead(itemId: string): void {
    this.readItems.add(itemId);
    const timer = this.timers.get(itemId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(itemId);
    }
  }

  /**
   * Reset the tracker state (call on category switch to prevent memory leak).
   * Note: After disconnect(), the existing IntersectionObserver instance remains valid.
   * Calling observe() on it after disconnect() will resume observation for newly
   * added elements — this is per the IntersectionObserver spec. No re-creation needed.
   */
  reset(): void {
    this.timers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.timers.clear();
    this.viewedItems.clear();
    this.readItems.clear();
    this.itemMap.clear();
    // Disconnect stops observing all current targets but keeps the observer reusable
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Cleanup all observers and timers.
   */
  dispose(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.timers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.timers.clear();
    this.viewedItems.clear();
    this.readItems.clear();
    this.itemMap.clear();
  }
}
