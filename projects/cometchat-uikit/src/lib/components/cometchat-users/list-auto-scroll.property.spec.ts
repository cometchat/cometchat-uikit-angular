/**
 * Property-Based Tests for Users List Auto-Scroll Behavior
 *
 * Exercises the real keyboard helpers in `cometchat-users.keyboard.ts` and the
 * component's own arrow-key focus movement (`focusNextItem` /
 * `focusPreviousItem` -> `scrollFocusedItemIntoView`) against a real DOM list,
 * checking that the item that receives focus is the one scrolled into view.
 *
 * @module components/cometchat-users/list-auto-scroll.property
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  focusNextUserItem,
  focusPreviousUserItem,
  scrollUserItemIntoView,
} from './cometchat-users.keyboard';
import { CometChatUsersComponent } from './cometchat-users.component';

const SCROLL_OPTS = { behavior: 'smooth', block: 'nearest', inline: 'nearest' };

/** Builds a real list container with `count` items carrying `data-index`. */
function buildList(count: number) {
  const container = document.createElement('div');
  const spies: ReturnType<typeof vi.fn>[] = [];
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.setAttribute('data-index', String(i));
    const spy = vi.fn();
    (item as any).scrollIntoView = spy;
    spies.push(spy);
    container.appendChild(item);
  }
  return { container, spies };
}

/** Index of the single item that was scrolled, or -1 / -2 (none / many). */
function scrolledIndex(spies: ReturnType<typeof vi.fn>[]): number {
  const hits = spies.map((s, i) => (s.mock.calls.length ? i : -1)).filter(i => i >= 0);
  if (hits.length === 0) return -1;
  if (hits.length > 1) return -2;
  return hits[0];
}

const fakeUsers = (n: number) => Array.from({ length: n }, (_, i) => ({ uid: `u${i}` })) as any[];

describe('List Auto-Scroll (users list)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('scrollUserItemIntoView', () => {
    it('scrolls exactly the item at the focused index, with smooth/nearest options, after a tick', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 40 }).chain(n => fc.tuple(fc.constant(n), fc.integer({ min: 0, max: n - 1 }))),
          ([count, focused]) => {
            const { container, spies } = buildList(count);
            const timers: ReturnType<typeof setTimeout>[] = [];

            scrollUserItemIntoView(container, focused, timers);

            // Deferred: nothing scrolls synchronously, and the timer is tracked for cleanup
            expect(scrolledIndex(spies)).toBe(-1);
            expect(timers).toHaveLength(1);

            vi.runAllTimers();
            expect(scrolledIndex(spies)).toBe(focused);
            expect(spies[focused]).toHaveBeenCalledTimes(1);
            expect(spies[focused]).toHaveBeenCalledWith(SCROLL_OPTS);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('scrolls nothing when the focused index has no rendered item', () => {
      const { container, spies } = buildList(3);
      scrollUserItemIntoView(container, 7, []);
      vi.runAllTimers();
      expect(scrolledIndex(spies)).toBe(-1);
    });

    it('is a no-op when the list container is not rendered', () => {
      const timers: ReturnType<typeof setTimeout>[] = [];
      scrollUserItemIntoView(undefined, 0, timers);
      expect(timers).toHaveLength(1);
      expect(() => vi.runAllTimers()).not.toThrow();
    });
  });

  describe('focusNextUserItem / focusPreviousUserItem', () => {
    it('moves forward with wrap-around and requests a scroll each time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }).chain(n => fc.tuple(fc.constant(n), fc.integer({ min: -1, max: n - 1 }))),
          ([count, focused]) => {
            const cdr = { markForCheck: vi.fn() } as any;
            const scroll = vi.fn();
            const next = focusNextUserItem(fakeUsers(count), focused, cdr, scroll);
            const expected = focused === -1 ? 0 : (focused + 1) % count;
            expect(next).toBe(expected);
            expect(scroll).toHaveBeenCalledTimes(1);
            expect(cdr.markForCheck).toHaveBeenCalledTimes(1);
          }
        )
      );
    });

    it('moves backward with wrap-around and requests a scroll each time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }).chain(n => fc.tuple(fc.constant(n), fc.integer({ min: -1, max: n - 1 }))),
          ([count, focused]) => {
            const cdr = { markForCheck: vi.fn() } as any;
            const scroll = vi.fn();
            const prev = focusPreviousUserItem(fakeUsers(count), focused, cdr, scroll);
            const expected = focused === -1 ? count - 1 : (focused - 1 + count) % count;
            expect(prev).toBe(expected);
            expect(scroll).toHaveBeenCalledTimes(1);
          }
        )
      );
    });

    it('leaves focus unchanged and does not scroll on an empty list', () => {
      const cdr = { markForCheck: vi.fn() } as any;
      const scroll = vi.fn();
      expect(focusNextUserItem([], 3, cdr, scroll)).toBe(3);
      expect(focusPreviousUserItem([], -1, cdr, scroll)).toBe(-1);
      expect(scroll).not.toHaveBeenCalled();
    });
  });

  describe('CometChatUsersComponent arrow navigation', () => {
    /** Real component logic, bound to a minimal state object (no DI needed). */
    function makeHost(count: number, focusedIndex: number, initialLoadComplete = true) {
      const { container, spies } = buildList(count);
      const host = Object.create(CometChatUsersComponent.prototype) as any;
      host.userList = fakeUsers(count);
      host.focusedIndex = focusedIndex;
      host.cdr = { markForCheck: vi.fn() };
      host.initialLoadComplete = initialLoadComplete;
      host.listContainer = { nativeElement: container };
      host.pendingTimers = [];
      return { host, spies };
    }

    it('keeps the newly focused item in view for any sequence of ArrowDown/ArrowUp moves', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 25 }),
          fc.array(fc.boolean(), { minLength: 1, maxLength: 40 }),
          (count, moves) => {
            const { host, spies } = makeHost(count, -1);
            let model = -1;
            for (const down of moves) {
              spies.forEach(s => s.mockClear());
              if (down) host.focusNextItem();
              else host.focusPreviousItem();
              model = down
                ? (model === -1 ? 0 : (model + 1) % count)
                : (model === -1 ? count - 1 : (model - 1 + count) % count);
              vi.runAllTimers();
              expect(host.focusedIndex).toBe(model);
              expect(scrolledIndex(spies)).toBe(model);
              expect(spies[model]).toHaveBeenCalledWith(SCROLL_OPTS);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('scrolls down to the first item when wrapping past the last one', () => {
      const { host, spies } = makeHost(5, 4);
      host.focusNextItem();
      vi.runAllTimers();
      expect(host.focusedIndex).toBe(0);
      expect(scrolledIndex(spies)).toBe(0);
    });

    it('scrolls to the last item when wrapping up from the first one', () => {
      const { host, spies } = makeHost(5, 0);
      host.focusPreviousItem();
      vi.runAllTimers();
      expect(host.focusedIndex).toBe(4);
      expect(scrolledIndex(spies)).toBe(4);
    });

    it('does not auto-scroll before the initial load has completed', () => {
      const { host, spies } = makeHost(5, 0, false);
      host.focusNextItem();
      vi.runAllTimers();
      expect(host.focusedIndex).toBe(1);
      expect(scrolledIndex(spies)).toBe(-1);
      expect(host.pendingTimers).toHaveLength(0);
    });
  });
});
