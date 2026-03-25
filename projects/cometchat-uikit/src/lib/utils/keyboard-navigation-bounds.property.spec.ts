/**
 * Property-Based Tests for Keyboard Navigation Index Bounds
 *
 * Categories: Index Bounds, Wrap-Around, Single Item, Boundary Wrapping,
 *             No-Wrap Clamping, Key Detection, Direction Mapping
 * Validates: Requirements 8.2, 10.4
 *
 * Property 14: Keyboard Navigation Index Bounds
 * For any list of N items (N > 0) and any current index and any navigation
 * direction, getNextIndex() returns an index in the range [0, N-1].
 *
 * @module utils/keyboard-navigation-bounds.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

import {
  getNextIndex,
  isActivationKey,
  isEscapeKey,
  getNavigationDirection,
  NavigationDirection,
} from './keyboard-utils';

// ==================== SDK Session Setup ====================

beforeAll(async () => {
  await ensureSdkReady();
}, 30000);

afterAll(async () => {
  await sdkCleanup();
});

// ==================== Test Helpers ====================

function createKeyboardEvent(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

// ==================== Arbitraries ====================

/** Direction arbitrary covering all four navigation directions. */
const arbDirection = fc.constantFrom<NavigationDirection>('up', 'down', 'left', 'right');

/** Forward directions (down, right). */
const arbForwardDirection = fc.constantFrom<NavigationDirection>('down', 'right');

/** Backward directions (up, left). */
const arbBackwardDirection = fc.constantFrom<NavigationDirection>('up', 'left');

/** Valid list navigation: N in [1, 200], currentIndex in [0, N-1]. */
const arbListNav = fc
  .record({
    totalItems: fc.integer({ min: 1, max: 200 }),
    currentIndex: fc.integer({ min: 0, max: 199 }),
  })
  .filter(({ currentIndex, totalItems }) => currentIndex < totalItems);

/** Arbitrary for any key string (used for key detection tests). */
const arbKeyString = fc.string({ minLength: 1, maxLength: 15 });

/** Arbitrary for out-of-range current indices (negative or >= totalItems). */
const arbOutOfRangeNav = fc.record({
  totalItems: fc.integer({ min: 1, max: 100 }),
  currentIndex: fc.oneof(fc.integer({ min: -100, max: -1 }), fc.integer({ min: 100, max: 500 })),
});

// ==================== Tests ====================

describe('Property 14: Keyboard Navigation Index Bounds', () => {
  // ---------- Core property: getNextIndex always in [0, N-1] ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * For any N > 0, any currentIndex in [0, N-1], and any direction,
   * getNextIndex() returns an index in [0, N-1] with wrap enabled.
   */
  it('getNextIndex with wrap returns index in [0, N-1] for any valid input', () => {
    fc.assert(
      fc.property(arbListNav, arbDirection, ({ totalItems, currentIndex }, direction) => {
        const result = getNextIndex(currentIndex, direction, totalItems, { wrap: true });
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(totalItems);
      }),
      { numRuns: 200 }
    );
  });

  // ---------- No-wrap also stays in bounds ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * For any N > 0, any currentIndex in [0, N-1], and any direction,
   * getNextIndex() with wrap=false returns an index in [0, N-1].
   */
  it('getNextIndex without wrap returns index in [0, N-1] for any valid input', () => {
    fc.assert(
      fc.property(arbListNav, arbDirection, ({ totalItems, currentIndex }, direction) => {
        const result = getNextIndex(currentIndex, direction, totalItems, { wrap: false });
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(totalItems);
      }),
      { numRuns: 200 }
    );
  });

  // ---------- Boundary wrapping: index 0 going backward wraps to N-1 ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * At index 0 with a backward direction and wrap enabled,
   * getNextIndex() returns N-1.
   */
  it('at index 0 going backward wraps to N-1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 200 }),
        arbBackwardDirection,
        (totalItems, direction) => {
          const result = getNextIndex(0, direction, totalItems, { wrap: true });
          expect(result).toBe(totalItems - 1);
        }
      ),
      { numRuns: 150 }
    );
  });

  // ---------- Boundary wrapping: index N-1 going forward wraps to 0 ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * At index N-1 with a forward direction and wrap enabled,
   * getNextIndex() returns 0.
   */
  it('at index N-1 going forward wraps to 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 200 }),
        arbForwardDirection,
        (totalItems, direction) => {
          const result = getNextIndex(totalItems - 1, direction, totalItems, { wrap: true });
          expect(result).toBe(0);
        }
      ),
      { numRuns: 150 }
    );
  });

  // ---------- Single item list always returns 0 ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * For N=1, any direction and any wrap setting, getNextIndex() returns 0.
   */
  it('single item list (N=1) always returns 0 regardless of direction or wrap', () => {
    fc.assert(
      fc.property(arbDirection, fc.boolean(), (direction, wrap) => {
        const result = getNextIndex(0, direction, 1, { wrap });
        expect(result).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- No-wrap clamps at boundaries ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * At index 0 going backward with wrap=false, result stays at 0.
   * At index N-1 going forward with wrap=false, result stays at N-1.
   */
  it('no-wrap clamps at boundaries instead of wrapping', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 200 }), totalItems => {
        // Backward from 0 clamps to 0
        const backResult = getNextIndex(0, 'up', totalItems, { wrap: false });
        expect(backResult).toBe(0);

        // Forward from N-1 clamps to N-1
        const fwdResult = getNextIndex(totalItems - 1, 'down', totalItems, { wrap: false });
        expect(fwdResult).toBe(totalItems - 1);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- getNextIndex never returns negative ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * For any N > 0, any currentIndex, any direction, and any wrap setting,
   * getNextIndex() never returns a negative number.
   */
  it('getNextIndex never returns a negative number', () => {
    fc.assert(
      fc.property(
        arbListNav,
        arbDirection,
        fc.boolean(),
        ({ totalItems, currentIndex }, direction, wrap) => {
          const result = getNextIndex(currentIndex, direction, totalItems, { wrap });
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  // ---------- getNextIndex with skipDisabled stays in bounds ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * For any N > 0 with a skipDisabled callback that disables some indices,
   * getNextIndex() still returns an index in [0, N-1].
   */
  it('getNextIndex with skipDisabled returns index in [0, N-1]', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            totalItems: fc.integer({ min: 2, max: 50 }),
            currentIndex: fc.integer({ min: 0, max: 49 }),
            disabledIndices: fc.array(fc.integer({ min: 0, max: 49 }), {
              minLength: 0,
              maxLength: 10,
            }),
          })
          .filter(({ currentIndex, totalItems }) => currentIndex < totalItems),
        arbDirection,
        ({ totalItems, currentIndex, disabledIndices }, direction) => {
          const disabledSet = new Set(disabledIndices.filter(i => i < totalItems));
          const skipDisabled = (index: number) => disabledSet.has(index);

          const result = getNextIndex(currentIndex, direction, totalItems, {
            wrap: true,
            skipDisabled,
          });
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThan(totalItems);
        }
      ),
      { numRuns: 150 }
    );
  });

  // ---------- isActivationKey: Enter and Space return true, others false ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * isActivationKey returns true if and only if the key is Enter or Space.
   */
  it('isActivationKey returns true iff key is Enter or Space', () => {
    fc.assert(
      fc.property(arbKeyString, key => {
        const event = createKeyboardEvent(key);
        const expected = key === 'Enter' || key === ' ';
        expect(isActivationKey(event)).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  // ---------- isEscapeKey: Escape returns true, others false ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * isEscapeKey returns true if and only if the key is Escape.
   */
  it('isEscapeKey returns true iff key is Escape', () => {
    fc.assert(
      fc.property(arbKeyString, key => {
        const event = createKeyboardEvent(key);
        const expected = key === 'Escape';
        expect(isEscapeKey(event)).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  // ---------- getNavigationDirection maps arrow keys correctly, null otherwise ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * getNavigationDirection returns the correct direction for arrow keys
   * and null for any other key.
   */
  it('getNavigationDirection returns correct direction for arrow keys, null otherwise', () => {
    const keyToDir: Record<string, NavigationDirection> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };

    fc.assert(
      fc.property(arbKeyString, key => {
        const event = createKeyboardEvent(key);
        const result = getNavigationDirection(event);
        if (Object.hasOwn(keyToDir, key)) {
          expect(result).toBe(keyToDir[key]);
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 200 }
    );
  });

  // ---------- Forward navigation produces (currentIndex + 1) % N ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * For any forward direction with wrap, getNextIndex returns
   * (currentIndex + 1) % totalItems.
   */
  it('forward navigation with wrap equals (currentIndex + 1) % totalItems', () => {
    fc.assert(
      fc.property(arbListNav, arbForwardDirection, ({ totalItems, currentIndex }, direction) => {
        const result = getNextIndex(currentIndex, direction, totalItems, { wrap: true });
        expect(result).toBe((currentIndex + 1) % totalItems);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Backward navigation produces (currentIndex - 1 + N) % N ----------

  /**
   * **Validates: Requirements 8.2, 10.4**
   *
   * For any backward direction with wrap, getNextIndex returns
   * (currentIndex - 1 + totalItems) % totalItems.
   */
  it('backward navigation with wrap equals (currentIndex - 1 + N) % N', () => {
    fc.assert(
      fc.property(arbListNav, arbBackwardDirection, ({ totalItems, currentIndex }, direction) => {
        const result = getNextIndex(currentIndex, direction, totalItems, { wrap: true });
        expect(result).toBe((currentIndex - 1 + totalItems) % totalItems);
      }),
      { numRuns: 150 }
    );
  });
});
