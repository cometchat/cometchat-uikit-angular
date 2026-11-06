import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { groupByTimestamp, VisibilityTracker } from './cometchat-notification-feed.utils';
import type { NotificationFeedItem } from './cometchat-notification-feed.types';

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
  let onViewed: Mock<(item: NotificationFeedItem) => void>;
  let onRead: Mock<(item: NotificationFeedItem) => void>;
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

// ---------------------------------------------------------------------------
// VisibilityTracker — observer-driven behaviour
//
// The tests above construct a tracker but never fire the IntersectionObserver
// callback, so the view/read reporting it exists for never runs. These stub the
// observer so the callback can be driven directly.
// ---------------------------------------------------------------------------

describe('VisibilityTracker — intersection handling', () => {
  let onViewed: Mock<(item: NotificationFeedItem) => void>;
  let onRead: Mock<(item: NotificationFeedItem) => void>;
  let tracker: VisibilityTracker;
  let fire: (entries: Array<{ id: string; isIntersecting: boolean }>) => void;
  let observed: HTMLElement[];
  let disconnectCount: number;

  /** An element carrying the id attribute the tracker reads back. */
  function elementFor(id: string): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-feed-item-id', id);
    return el;
  }

  beforeEach(() => {
    onViewed = vi.fn();
    onRead = vi.fn();
    observed = [];
    disconnectCount = 0;

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entries: unknown[]) => void) {
          // Translate the test's terse entry shape into what the tracker reads.
          fire = (entries) =>
            cb(
              entries.map(e => ({
                isIntersecting: e.isIntersecting,
                target: elementFor(e.id),
              }))
            );
        }
        observe(el: HTMLElement) {
          observed.push(el);
        }
        unobserve() {}
        disconnect() {
          disconnectCount++;
        }
      }
    );

    tracker = new VisibilityTracker(onViewed, onRead);
    tracker.init(null);
    vi.useFakeTimers();
  });

  afterEach(() => {
    tracker.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Registers an item with the tracker so the observer callback can resolve it. */
  function track(id: string, readAt: number | null = null) {
    const item = createMockFeedItem({ id, readAt });
    tracker.observe(elementFor(id), item);
    return item;
  }

  it('reports an item as viewed when it becomes visible', () => {
    const item = track('a');
    fire([{ id: 'a', isIntersecting: true }]);
    expect(onViewed).toHaveBeenCalledWith(item);
  });

  it('reports a given item as viewed only once', () => {
    track('a');
    fire([{ id: 'a', isIntersecting: true }]);
    fire([{ id: 'a', isIntersecting: true }]);
    expect(onViewed).toHaveBeenCalledTimes(1);
  });

  it('reports read after the item has been visible for a second', () => {
    const item = track('a');
    fire([{ id: 'a', isIntersecting: true }]);

    expect(onRead).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onRead).toHaveBeenCalledWith(item);
  });

  it('does not report read if the item leaves before the second elapses', () => {
    track('a');
    fire([{ id: 'a', isIntersecting: true }]);
    vi.advanceTimersByTime(500);
    fire([{ id: 'a', isIntersecting: false }]);
    vi.advanceTimersByTime(1000);

    expect(onRead).not.toHaveBeenCalled();
  });

  it('does not start a read timer for an already-read item', () => {
    track('a', 12345);
    fire([{ id: 'a', isIntersecting: true }]);
    vi.advanceTimersByTime(2000);

    expect(onViewed).toHaveBeenCalled();
    expect(onRead).not.toHaveBeenCalled();
  });

  it('reports read only once even if the item re-enters', () => {
    track('a');
    fire([{ id: 'a', isIntersecting: true }]);
    vi.advanceTimersByTime(1000);
    fire([{ id: 'a', isIntersecting: true }]);
    vi.advanceTimersByTime(1000);

    expect(onRead).toHaveBeenCalledTimes(1);
  });

  it('handles several items in one callback', () => {
    track('a');
    track('b');
    fire([
      { id: 'a', isIntersecting: true },
      { id: 'b', isIntersecting: true },
    ]);
    expect(onViewed).toHaveBeenCalledTimes(2);
  });

  it('ignores an entry whose element carries no item id', () => {
    tracker.observe(document.createElement('div'), createMockFeedItem({ id: 'a' }));
    const bare = document.createElement('div');
    // Fire directly with an element that has no data attribute.
    expect(() => fire([{ id: '', isIntersecting: true }])).not.toThrow();
    expect(onViewed).not.toHaveBeenCalled();
    expect(bare).toBeTruthy();
  });

  it('ignores an entry for an item it has never been given', () => {
    fire([{ id: 'never-registered', isIntersecting: true }]);
    expect(onViewed).not.toHaveBeenCalled();
  });

  it('cancels a pending read timer via markAsRead', () => {
    track('a');
    fire([{ id: 'a', isIntersecting: true }]);
    tracker.markAsRead('a');
    vi.advanceTimersByTime(2000);

    expect(onRead).not.toHaveBeenCalled();
  });

  it('suppresses a later read for an item marked read in advance', () => {
    track('a');
    tracker.markAsRead('a');
    fire([{ id: 'a', isIntersecting: true }]);
    vi.advanceTimersByTime(2000);

    expect(onRead).not.toHaveBeenCalled();
  });

  describe('reset', () => {
    it('cancels pending read timers', () => {
      track('a');
      fire([{ id: 'a', isIntersecting: true }]);
      tracker.reset();
      vi.advanceTimersByTime(2000);

      expect(onRead).not.toHaveBeenCalled();
    });

    it('disconnects the observer', () => {
      tracker.reset();
      expect(disconnectCount).toBe(1);
    });

    it('clears the viewed set so an item reports again', () => {
      track('a');
      fire([{ id: 'a', isIntersecting: true }]);
      expect(onViewed).toHaveBeenCalledTimes(1);

      tracker.reset();
      track('a');
      fire([{ id: 'a', isIntersecting: true }]);

      expect(onViewed).toHaveBeenCalledTimes(2);
    });
  });

  describe('dispose', () => {
    it('cancels pending read timers', () => {
      track('a');
      fire([{ id: 'a', isIntersecting: true }]);
      tracker.dispose();
      vi.advanceTimersByTime(2000);

      expect(onRead).not.toHaveBeenCalled();
    });

    it('disconnects the observer', () => {
      tracker.dispose();
      expect(disconnectCount).toBeGreaterThanOrEqual(1);
    });

    it('is safe to call twice', () => {
      tracker.dispose();
      expect(() => tracker.dispose()).not.toThrow();
    });

    it('stops observing after disposal', () => {
      tracker.dispose();
      const before = observed.length;
      tracker.observe(elementFor('late'), createMockFeedItem({ id: 'late' }));
      expect(observed.length).toBe(before);
    });
  });
});
