import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { groupByTimestamp, VisibilityTracker } from './cometchat-notification-feed.utils';

/**
 * Mock NotificationFeedItem for testing
 */
function createMockFeedItem(overrides: Partial<{
  id: string;
  sentAt: number;
  readAt: number | null;
  category: string;
}> = {}) {
  const id = overrides.id ?? `item-${Math.random().toString(36).slice(2)}`;
  const sentAt = overrides.sentAt ?? Math.floor(Date.now() / 1000);
  const readAt = overrides.readAt ?? null;
  const category = overrides.category ?? 'NEWS';

  return {
    getId: () => id,
    getSentAt: () => sentAt,
    getReadAt: () => readAt,
    setReadAt: vi.fn(),
    getCategory: () => category,
    getContent: () => ({ title: 'Test notification' }),
  } as any;
}

describe('groupByTimestamp', () => {
  it('should return empty array for empty items', () => {
    expect(groupByTimestamp([])).toEqual([]);
  });

  it('should return empty array for null/undefined', () => {
    expect(groupByTimestamp(null as any)).toEqual([]);
    expect(groupByTimestamp(undefined as any)).toEqual([]);
  });

  it('should group items sent today under "Today"', () => {
    const now = Math.floor(Date.now() / 1000);
    const items = [
      createMockFeedItem({ sentAt: now - 60 }),
      createMockFeedItem({ sentAt: now - 120 }),
    ];

    const groups = groupByTimestamp(items);
    expect(groups.length).toBe(1);
    expect(groups[0].label).toBe('Today');
    expect(groups[0].items.length).toBe(2);
  });

  it('should group items sent yesterday under "Yesterday"', () => {
    const yesterday = Math.floor(Date.now() / 1000) - 86400;
    const items = [createMockFeedItem({ sentAt: yesterday })];

    const groups = groupByTimestamp(items);
    expect(groups.length).toBe(1);
    expect(groups[0].label).toBe('Yesterday');
  });

  it('should create separate groups for different days', () => {
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - 86400;
    const items = [
      createMockFeedItem({ sentAt: now }),
      createMockFeedItem({ sentAt: yesterday }),
    ];

    const groups = groupByTimestamp(items);
    expect(groups.length).toBe(2);
    expect(groups[0].label).toBe('Today');
    expect(groups[1].label).toBe('Yesterday');
  });

  it('should group old items by localized date string', () => {
    // 30 days ago
    const oldDate = Math.floor(Date.now() / 1000) - 30 * 86400;
    const items = [createMockFeedItem({ sentAt: oldDate })];

    const groups = groupByTimestamp(items);
    expect(groups.length).toBe(1);
    // Should not be "Today" or "Yesterday"
    expect(groups[0].label).not.toBe('Today');
    expect(groups[0].label).not.toBe('Yesterday');
  });

  it('should preserve item order within groups', () => {
    const now = Math.floor(Date.now() / 1000);
    const item1 = createMockFeedItem({ id: 'first', sentAt: now - 10 });
    const item2 = createMockFeedItem({ id: 'second', sentAt: now - 20 });

    const groups = groupByTimestamp([item1, item2]);
    expect(groups[0].items[0].getId()).toBe('first');
    expect(groups[0].items[1].getId()).toBe('second');
  });
});

describe('VisibilityTracker', () => {
  let onViewed: ReturnType<typeof vi.fn>;
  let onRead: ReturnType<typeof vi.fn>;
  let tracker: VisibilityTracker;

  beforeEach(() => {
    onViewed = vi.fn();
    onRead = vi.fn();
    tracker = new VisibilityTracker(onViewed, onRead);
    vi.useFakeTimers();
  });

  afterEach(() => {
    tracker.dispose();
    vi.useRealTimers();
  });

  it('should create without errors', () => {
    expect(tracker).toBeDefined();
  });

  it('should dispose without errors', () => {
    tracker.init(null);
    expect(() => tracker.dispose()).not.toThrow();
  });

  it('should handle markAsRead for unknown items', () => {
    expect(() => tracker.markAsRead('unknown-id')).not.toThrow();
  });

  it('should initialize with IntersectionObserver when root is provided', () => {
    const mockRoot = document.createElement('div');
    tracker.init(mockRoot);
    // Should not throw
    expect(tracker).toBeDefined();
  });

  it('should handle observe/unobserve without crashing', () => {
    const mockRoot = document.createElement('div');
    tracker.init(mockRoot);

    const element = document.createElement('div');
    element.setAttribute('data-feed-item-id', 'test-1');
    const item = createMockFeedItem({ id: 'test-1' });

    expect(() => tracker.observe(element, item)).not.toThrow();
    expect(() => tracker.unobserve(element)).not.toThrow();
  });
});
