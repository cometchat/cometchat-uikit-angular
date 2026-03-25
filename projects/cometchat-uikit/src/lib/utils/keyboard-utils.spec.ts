import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import {
  isActivationKey,
  isArrowKey,
  handleActivation,
  getNextIndex,
  getFocusableElements,
  getNavigationDirection,
  isEscapeKey,
  isTabKey,
  isHomeKey,
  isEndKey,
  NavigationDirection,
} from './keyboard-utils';

/**
 * Unit and Property-Based Tests for Keyboard Utility Functions
 *
 * Tests all keyboard utility functions using both unit tests for specific
 * cases and property-based tests with fast-check for universal properties.
 *
 * **Validates: Requirements 8.2, 8.6, 10.1, 10.2, 10.4, 14.4, 14.5, 15.7**
 */

// ==================== SDK Session Setup ====================

beforeAll(async () => {
  await ensureSdkReady();
});

afterAll(async () => {
  await sdkCleanup();
});

// ==================== Test Helpers ====================

/**
 * Creates a mock KeyboardEvent for testing
 */
function createKeyboardEvent(
  key: string,
  options?: { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean }
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

// ==================== Generators ====================

/** Arbitrary for activation keys */
const activationKeyArb = fc.constantFrom('Enter', ' ');

/** Arbitrary for arrow keys */
const arrowKeyArb = fc.constantFrom('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');

/** Arbitrary for non-activation keys */
const nonActivationKeyArb = fc
  .string({ minLength: 1, maxLength: 10 })
  .filter(s => s !== 'Enter' && s !== ' ');

/** Arbitrary for non-arrow keys */
const nonArrowKeyArb = fc
  .string({ minLength: 1, maxLength: 10 })
  .filter(s => !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(s));

/** Arbitrary for navigation direction */
const directionArb = fc.constantFrom<NavigationDirection>('up', 'down', 'left', 'right');

/** Arbitrary for forward directions */
const forwardDirectionArb = fc.constantFrom<NavigationDirection>('down', 'right');

/** Arbitrary for backward directions */
const backwardDirectionArb = fc.constantFrom<NavigationDirection>('up', 'left');

/** Arbitrary for valid list index and total items */
const listNavigationArb = fc
  .record({
    currentIndex: fc.integer({ min: 0, max: 99 }),
    totalItems: fc.integer({ min: 1, max: 100 }),
  })
  .filter(({ currentIndex, totalItems }) => currentIndex < totalItems);

// ==================== isActivationKey Tests ====================

describe('isActivationKey', () => {
  it('should return true for Enter key', () => {
    const event = createKeyboardEvent('Enter');
    expect(isActivationKey(event)).toBe(true);
  });

  it('should return true for Space key', () => {
    const event = createKeyboardEvent(' ');
    expect(isActivationKey(event)).toBe(true);
  });

  it('should return false for other keys', () => {
    const event = createKeyboardEvent('a');
    expect(isActivationKey(event)).toBe(false);
  });

  it('should return false for Escape key', () => {
    const event = createKeyboardEvent('Escape');
    expect(isActivationKey(event)).toBe(false);
  });

  it('should return false for Tab key', () => {
    const event = createKeyboardEvent('Tab');
    expect(isActivationKey(event)).toBe(false);
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: isActivationKey returns true only for Enter and Space**
   *
   * *For any* activation key (Enter or Space), isActivationKey SHALL return true.
   */
  it('Property: returns true for all activation keys', () => {
    fc.assert(
      fc.property(activationKeyArb, key => {
        const event = createKeyboardEvent(key);
        expect(isActivationKey(event)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: isActivationKey returns false for non-activation keys**
   *
   * *For any* key that is not Enter or Space, isActivationKey SHALL return false.
   */
  it('Property: returns false for non-activation keys', () => {
    fc.assert(
      fc.property(nonActivationKeyArb, key => {
        const event = createKeyboardEvent(key);
        expect(isActivationKey(event)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== isArrowKey Tests ====================

describe('isArrowKey', () => {
  it('should return true for ArrowUp', () => {
    const event = createKeyboardEvent('ArrowUp');
    expect(isArrowKey(event)).toBe(true);
  });

  it('should return true for ArrowDown', () => {
    const event = createKeyboardEvent('ArrowDown');
    expect(isArrowKey(event)).toBe(true);
  });

  it('should return true for ArrowLeft', () => {
    const event = createKeyboardEvent('ArrowLeft');
    expect(isArrowKey(event)).toBe(true);
  });

  it('should return true for ArrowRight', () => {
    const event = createKeyboardEvent('ArrowRight');
    expect(isArrowKey(event)).toBe(true);
  });

  it('should return false for other keys', () => {
    const event = createKeyboardEvent('Enter');
    expect(isArrowKey(event)).toBe(false);
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: isArrowKey returns true only for arrow keys**
   *
   * *For any* arrow key, isArrowKey SHALL return true.
   */
  it('Property: returns true for all arrow keys', () => {
    fc.assert(
      fc.property(arrowKeyArb, key => {
        const event = createKeyboardEvent(key);
        expect(isArrowKey(event)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: isArrowKey returns false for non-arrow keys**
   *
   * *For any* key that is not an arrow key, isArrowKey SHALL return false.
   */
  it('Property: returns false for non-arrow keys', () => {
    fc.assert(
      fc.property(nonArrowKeyArb, key => {
        const event = createKeyboardEvent(key);
        expect(isArrowKey(event)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== handleActivation Tests ====================

describe('handleActivation', () => {
  it('should call callback and return true for Enter key', () => {
    const callback = vi.fn();
    const event = createKeyboardEvent('Enter');
    const result = handleActivation(event, callback);

    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call callback and return true for Space key', () => {
    const callback = vi.fn();
    const event = createKeyboardEvent(' ');
    const result = handleActivation(event, callback);

    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback and return false for other keys', () => {
    const callback = vi.fn();
    const event = createKeyboardEvent('a');
    const result = handleActivation(event, callback);

    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should call preventDefault by default', () => {
    const callback = vi.fn();
    const event = createKeyboardEvent('Enter');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    handleActivation(event, callback);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not call preventDefault when option is false', () => {
    const callback = vi.fn();
    const event = createKeyboardEvent('Enter');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    handleActivation(event, callback, { preventDefault: false });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should not call stopPropagation by default', () => {
    const callback = vi.fn();
    const event = createKeyboardEvent('Enter');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    handleActivation(event, callback);

    expect(stopPropagationSpy).not.toHaveBeenCalled();
  });

  it('should call stopPropagation when option is true', () => {
    const callback = vi.fn();
    const event = createKeyboardEvent('Enter');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    handleActivation(event, callback, { stopPropagation: true });

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: handleActivation invokes callback only for activation keys**
   *
   * *For any* activation key, handleActivation SHALL invoke the callback.
   * *For any* non-activation key, handleActivation SHALL NOT invoke the callback.
   *
   * **Validates: Requirements 1.1, 2.1, 3.4, 5.2, 6.6**
   */
  it('Property: invokes callback only for activation keys', () => {
    fc.assert(
      fc.property(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 10 }),
        }),
        ({ key }) => {
          const callback = vi.fn();
          const event = createKeyboardEvent(key);
          const result = handleActivation(event, callback);

          const isActivation = key === 'Enter' || key === ' ';

          expect(result).toBe(isActivation);
          expect(callback).toHaveBeenCalledTimes(isActivation ? 1 : 0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ==================== getNextIndex Tests ====================

describe('getNextIndex', () => {
  describe('basic navigation', () => {
    it('should return next index for down direction', () => {
      expect(getNextIndex(0, 'down', 5)).toBe(1);
      expect(getNextIndex(2, 'down', 5)).toBe(3);
    });

    it('should return next index for right direction', () => {
      expect(getNextIndex(0, 'right', 5)).toBe(1);
      expect(getNextIndex(2, 'right', 5)).toBe(3);
    });

    it('should return previous index for up direction', () => {
      expect(getNextIndex(2, 'up', 5)).toBe(1);
      expect(getNextIndex(4, 'up', 5)).toBe(3);
    });

    it('should return previous index for left direction', () => {
      expect(getNextIndex(2, 'left', 5)).toBe(1);
      expect(getNextIndex(4, 'left', 5)).toBe(3);
    });
  });

  describe('wrap-around behavior', () => {
    it('should wrap to first index when going forward from last', () => {
      expect(getNextIndex(4, 'down', 5)).toBe(0);
      expect(getNextIndex(4, 'right', 5)).toBe(0);
    });

    it('should wrap to last index when going backward from first', () => {
      expect(getNextIndex(0, 'up', 5)).toBe(4);
      expect(getNextIndex(0, 'left', 5)).toBe(4);
    });

    it('should not wrap when wrap option is false', () => {
      expect(getNextIndex(4, 'down', 5, { wrap: false })).toBe(4);
      expect(getNextIndex(0, 'up', 5, { wrap: false })).toBe(0);
    });
  });

  describe('skip disabled items', () => {
    it('should skip disabled items when going forward', () => {
      const skipDisabled = (index: number) => index === 1;
      expect(getNextIndex(0, 'down', 5, { skipDisabled })).toBe(2);
    });

    it('should skip disabled items when going backward', () => {
      const skipDisabled = (index: number) => index === 1;
      expect(getNextIndex(2, 'up', 5, { skipDisabled })).toBe(0);
    });

    it('should skip multiple consecutive disabled items', () => {
      const skipDisabled = (index: number) => index === 1 || index === 2;
      expect(getNextIndex(0, 'down', 5, { skipDisabled })).toBe(3);
    });

    it('should wrap around when skipping disabled items', () => {
      const skipDisabled = (index: number) => index === 0;
      expect(getNextIndex(4, 'down', 5, { skipDisabled })).toBe(1);
    });

    it('should handle all items disabled gracefully', () => {
      const skipDisabled = () => true;
      // Should not infinite loop, returns some index
      const result = getNextIndex(0, 'down', 5, { skipDisabled });
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(5);
    });
  });

  describe('edge cases', () => {
    it('should handle single item list', () => {
      expect(getNextIndex(0, 'down', 1)).toBe(0);
      expect(getNextIndex(0, 'up', 1)).toBe(0);
    });

    it('should handle empty list', () => {
      expect(getNextIndex(0, 'down', 0)).toBe(0);
    });
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: getNextIndex always returns valid index within bounds**
   *
   * *For any* valid current index, direction, and total items,
   * getNextIndex SHALL return an index in range [0, totalItems - 1].
   *
   * **Validates: Requirements 3.1-3.3, 8.1-8.2, 9.2-9.5**
   */
  it('Property: always returns valid index within bounds', () => {
    fc.assert(
      fc.property(
        listNavigationArb,
        directionArb,
        fc.boolean(),
        ({ currentIndex, totalItems }, direction, wrap) => {
          const result = getNextIndex(currentIndex, direction, totalItems, { wrap });

          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThan(totalItems);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: Forward navigation increments index (with wrap)**
   *
   * *For any* forward direction (down/right) with wrap enabled,
   * getNextIndex SHALL return (currentIndex + 1) mod totalItems.
   *
   * **Validates: Requirements 3.2, 9.2**
   */
  it('Property: forward navigation increments index with wrap', () => {
    fc.assert(
      fc.property(
        listNavigationArb,
        forwardDirectionArb,
        ({ currentIndex, totalItems }, direction) => {
          const result = getNextIndex(currentIndex, direction, totalItems, { wrap: true });
          const expected = (currentIndex + 1) % totalItems;

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: Backward navigation decrements index (with wrap)**
   *
   * *For any* backward direction (up/left) with wrap enabled,
   * getNextIndex SHALL return (currentIndex - 1 + totalItems) mod totalItems.
   *
   * **Validates: Requirements 3.3, 9.3**
   */
  it('Property: backward navigation decrements index with wrap', () => {
    fc.assert(
      fc.property(
        listNavigationArb,
        backwardDirectionArb,
        ({ currentIndex, totalItems }, direction) => {
          const result = getNextIndex(currentIndex, direction, totalItems, { wrap: true });
          const expected = (currentIndex - 1 + totalItems) % totalItems;

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: Navigation without wrap clamps to bounds**
   *
   * *For any* navigation without wrap, the result SHALL be clamped
   * to [0, totalItems - 1].
   *
   * **Validates: Requirements 9.4, 9.5**
   */
  it('Property: navigation without wrap clamps to bounds', () => {
    fc.assert(
      fc.property(listNavigationArb, directionArb, ({ currentIndex, totalItems }, direction) => {
        const result = getNextIndex(currentIndex, direction, totalItems, { wrap: false });

        // Result should be clamped
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(totalItems);

        // At boundaries, should stay at boundary
        if (currentIndex === 0 && (direction === 'up' || direction === 'left')) {
          expect(result).toBe(0);
        }
        if (currentIndex === totalItems - 1 && (direction === 'down' || direction === 'right')) {
          expect(result).toBe(totalItems - 1);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: Skip disabled never returns disabled index**
   *
   * *For any* navigation with skipDisabled callback, the result
   * SHALL NOT be a disabled index (unless all items are disabled).
   *
   * **Validates: Requirements 8.6**
   */
  it('Property: skip disabled never returns disabled index', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            currentIndex: fc.integer({ min: 0, max: 9 }),
            totalItems: fc.integer({ min: 2, max: 10 }),
            disabledIndices: fc.array(fc.integer({ min: 0, max: 9 }), { maxLength: 5 }),
          })
          .filter(({ currentIndex, totalItems }) => currentIndex < totalItems),
        directionArb,
        ({ currentIndex, totalItems, disabledIndices }, direction) => {
          const disabledSet = new Set(disabledIndices.filter(i => i < totalItems));
          const skipDisabled = (index: number) => disabledSet.has(index);

          const result = getNextIndex(currentIndex, direction, totalItems, { skipDisabled });

          // If not all items are disabled, result should not be disabled
          const allDisabled = Array.from({ length: totalItems }, (_, i) => i).every(i =>
            disabledSet.has(i)
          );

          if (!allDisabled) {
            expect(disabledSet.has(result)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ==================== getFocusableElements Tests ====================

describe('getFocusableElements', () => {
  it('should return empty array for null container', () => {
    expect(getFocusableElements(null as any)).toEqual([]);
  });

  it('should return empty array for container with no focusable elements', () => {
    const container = document.createElement('div');
    container.innerHTML = '<span>Not focusable</span><div>Also not focusable</div>';

    expect(getFocusableElements(container)).toEqual([]);
  });

  it('should find buttons', () => {
    const container = document.createElement('div');
    container.innerHTML = '<button>Click me</button>';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('BUTTON');
  });

  it('should exclude disabled buttons', () => {
    const container = document.createElement('div');
    container.innerHTML = '<button disabled>Disabled</button><button>Enabled</button>';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
    expect(result[0].textContent).toBe('Enabled');
  });

  it('should find links with href', () => {
    const container = document.createElement('div');
    container.innerHTML = '<a href="https://example.com">Link</a>';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('A');
  });

  it('should find inputs', () => {
    const container = document.createElement('div');
    container.innerHTML = '<input type="text" />';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('INPUT');
  });

  it('should exclude disabled inputs', () => {
    const container = document.createElement('div');
    container.innerHTML = '<input type="text" disabled /><input type="text" />';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
  });

  it('should find selects', () => {
    const container = document.createElement('div');
    container.innerHTML = '<select><option>Option</option></select>';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('SELECT');
  });

  it('should find textareas', () => {
    const container = document.createElement('div');
    container.innerHTML = '<textarea></textarea>';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('TEXTAREA');
  });

  it('should find elements with tabindex >= 0', () => {
    const container = document.createElement('div');
    container.innerHTML = '<div tabindex="0">Focusable div</div>';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
  });

  it('should exclude elements with tabindex="-1"', () => {
    const container = document.createElement('div');
    container.innerHTML = '<div tabindex="-1">Not focusable</div><div tabindex="0">Focusable</div>';

    const result = getFocusableElements(container);
    expect(result.length).toBe(1);
    expect(result[0].getAttribute('tabindex')).toBe('0');
  });

  it('should find multiple focusable elements in order', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>First</button>
      <input type="text" />
      <a href="#">Link</a>
      <div tabindex="0">Div</div>
    `;

    const result = getFocusableElements(container);
    expect(result.length).toBe(4);
    expect(result[0].tagName).toBe('BUTTON');
    expect(result[1].tagName).toBe('INPUT');
    expect(result[2].tagName).toBe('A');
    expect(result[3].tagName).toBe('DIV');
  });
});

// ==================== getNavigationDirection Tests ====================

describe('getNavigationDirection', () => {
  it('should return "up" for ArrowUp', () => {
    const event = createKeyboardEvent('ArrowUp');
    expect(getNavigationDirection(event)).toBe('up');
  });

  it('should return "down" for ArrowDown', () => {
    const event = createKeyboardEvent('ArrowDown');
    expect(getNavigationDirection(event)).toBe('down');
  });

  it('should return "left" for ArrowLeft', () => {
    const event = createKeyboardEvent('ArrowLeft');
    expect(getNavigationDirection(event)).toBe('left');
  });

  it('should return "right" for ArrowRight', () => {
    const event = createKeyboardEvent('ArrowRight');
    expect(getNavigationDirection(event)).toBe('right');
  });

  it('should return null for non-arrow keys', () => {
    const event = createKeyboardEvent('Enter');
    expect(getNavigationDirection(event)).toBeNull();
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: getNavigationDirection maps arrow keys correctly**
   *
   * *For any* arrow key, getNavigationDirection SHALL return the corresponding direction.
   */
  it('Property: maps arrow keys to correct directions', () => {
    const keyToDirection: Record<string, NavigationDirection> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };

    fc.assert(
      fc.property(arrowKeyArb, key => {
        const event = createKeyboardEvent(key);
        expect(getNavigationDirection(event)).toBe(keyToDirection[key]);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: accessibility-enhancement-base-elements**
   * **Property: getNavigationDirection returns null for non-arrow keys**
   *
   * *For any* non-arrow key, getNavigationDirection SHALL return null.
   */
  it('Property: returns null for non-arrow keys', () => {
    fc.assert(
      fc.property(nonArrowKeyArb, key => {
        const event = createKeyboardEvent(key);
        expect(getNavigationDirection(event)).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== isEscapeKey Tests ====================

describe('isEscapeKey', () => {
  describe('Standard Operations', () => {
    it('should return true for Escape key', () => {
      const event = createKeyboardEvent('Escape');
      expect(isEscapeKey(event)).toBe(true);
    });

    it('should return false for Enter key', () => {
      const event = createKeyboardEvent('Enter');
      expect(isEscapeKey(event)).toBe(false);
    });

    it('should return false for Space key', () => {
      const event = createKeyboardEvent(' ');
      expect(isEscapeKey(event)).toBe(false);
    });

    it('should return false for Tab key', () => {
      const event = createKeyboardEvent('Tab');
      expect(isEscapeKey(event)).toBe(false);
    });

    it('should return false for arrow keys', () => {
      expect(isEscapeKey(createKeyboardEvent('ArrowUp'))).toBe(false);
      expect(isEscapeKey(createKeyboardEvent('ArrowDown'))).toBe(false);
    });
  });

  describe('Modifier Key Combinations', () => {
    it('should return true for Escape with Shift modifier', () => {
      const event = createKeyboardEvent('Escape', { shiftKey: true });
      expect(isEscapeKey(event)).toBe(true);
    });

    it('should return true for Escape with Ctrl modifier', () => {
      const event = createKeyboardEvent('Escape', { ctrlKey: true });
      expect(isEscapeKey(event)).toBe(true);
    });

    it('should return true for Escape with Alt modifier', () => {
      const event = createKeyboardEvent('Escape', { altKey: true });
      expect(isEscapeKey(event)).toBe(true);
    });
  });

  describe('Property Tests', () => {
    /**
     * **Validates: Requirements 9.1, 9.2**
     * For any non-Escape key, isEscapeKey SHALL return false.
     */
    it('Property: returns false for any non-Escape key', () => {
      const nonEscapeKeyArb = fc
        .string({ minLength: 1, maxLength: 10 })
        .filter(s => s !== 'Escape');

      fc.assert(
        fc.property(nonEscapeKeyArb, key => {
          const event = createKeyboardEvent(key);
          expect(isEscapeKey(event)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== isTabKey Tests ====================

describe('isTabKey', () => {
  describe('Standard Operations', () => {
    it('should return true for Tab key', () => {
      const event = createKeyboardEvent('Tab');
      expect(isTabKey(event)).toBe(true);
    });

    it('should return false for Enter key', () => {
      const event = createKeyboardEvent('Enter');
      expect(isTabKey(event)).toBe(false);
    });

    it('should return false for Space key', () => {
      const event = createKeyboardEvent(' ');
      expect(isTabKey(event)).toBe(false);
    });

    it('should return false for Escape key', () => {
      const event = createKeyboardEvent('Escape');
      expect(isTabKey(event)).toBe(false);
    });

    it('should return false for arrow keys', () => {
      expect(isTabKey(createKeyboardEvent('ArrowUp'))).toBe(false);
      expect(isTabKey(createKeyboardEvent('ArrowDown'))).toBe(false);
    });
  });

  describe('Modifier Key Combinations', () => {
    it('should return true for Tab with Shift modifier (Shift+Tab)', () => {
      const event = createKeyboardEvent('Tab', { shiftKey: true });
      expect(isTabKey(event)).toBe(true);
    });

    it('should return true for Tab with Ctrl modifier', () => {
      const event = createKeyboardEvent('Tab', { ctrlKey: true });
      expect(isTabKey(event)).toBe(true);
    });

    it('should return true for Tab with Alt modifier', () => {
      const event = createKeyboardEvent('Tab', { altKey: true });
      expect(isTabKey(event)).toBe(true);
    });
  });

  describe('Property Tests', () => {
    /**
     * **Validates: Requirements 9.1, 9.2**
     * For any non-Tab key, isTabKey SHALL return false.
     */
    it('Property: returns false for any non-Tab key', () => {
      const nonTabKeyArb = fc.string({ minLength: 1, maxLength: 10 }).filter(s => s !== 'Tab');

      fc.assert(
        fc.property(nonTabKeyArb, key => {
          const event = createKeyboardEvent(key);
          expect(isTabKey(event)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== isHomeKey Tests ====================

describe('isHomeKey', () => {
  describe('Standard Operations', () => {
    it('should return true for Home key', () => {
      const event = createKeyboardEvent('Home');
      expect(isHomeKey(event)).toBe(true);
    });

    it('should return false for End key', () => {
      const event = createKeyboardEvent('End');
      expect(isHomeKey(event)).toBe(false);
    });

    it('should return false for Enter key', () => {
      const event = createKeyboardEvent('Enter');
      expect(isHomeKey(event)).toBe(false);
    });

    it('should return false for arrow keys', () => {
      expect(isHomeKey(createKeyboardEvent('ArrowUp'))).toBe(false);
      expect(isHomeKey(createKeyboardEvent('ArrowDown'))).toBe(false);
    });
  });

  describe('Modifier Key Combinations', () => {
    it('should return true for Home with Ctrl modifier', () => {
      const event = createKeyboardEvent('Home', { ctrlKey: true });
      expect(isHomeKey(event)).toBe(true);
    });

    it('should return true for Home with Shift modifier', () => {
      const event = createKeyboardEvent('Home', { shiftKey: true });
      expect(isHomeKey(event)).toBe(true);
    });
  });

  describe('Property Tests', () => {
    /**
     * **Validates: Requirements 9.1, 9.2**
     * For any non-Home key, isHomeKey SHALL return false.
     */
    it('Property: returns false for any non-Home key', () => {
      const nonHomeKeyArb = fc.string({ minLength: 1, maxLength: 10 }).filter(s => s !== 'Home');

      fc.assert(
        fc.property(nonHomeKeyArb, key => {
          const event = createKeyboardEvent(key);
          expect(isHomeKey(event)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== isEndKey Tests ====================

describe('isEndKey', () => {
  describe('Standard Operations', () => {
    it('should return true for End key', () => {
      const event = createKeyboardEvent('End');
      expect(isEndKey(event)).toBe(true);
    });

    it('should return false for Home key', () => {
      const event = createKeyboardEvent('Home');
      expect(isEndKey(event)).toBe(false);
    });

    it('should return false for Enter key', () => {
      const event = createKeyboardEvent('Enter');
      expect(isEndKey(event)).toBe(false);
    });

    it('should return false for arrow keys', () => {
      expect(isEndKey(createKeyboardEvent('ArrowUp'))).toBe(false);
      expect(isEndKey(createKeyboardEvent('ArrowDown'))).toBe(false);
    });
  });

  describe('Modifier Key Combinations', () => {
    it('should return true for End with Ctrl modifier', () => {
      const event = createKeyboardEvent('End', { ctrlKey: true });
      expect(isEndKey(event)).toBe(true);
    });

    it('should return true for End with Shift modifier', () => {
      const event = createKeyboardEvent('End', { shiftKey: true });
      expect(isEndKey(event)).toBe(true);
    });
  });

  describe('Property Tests', () => {
    /**
     * **Validates: Requirements 9.1, 9.2**
     * For any non-End key, isEndKey SHALL return false.
     */
    it('Property: returns false for any non-End key', () => {
      const nonEndKeyArb = fc.string({ minLength: 1, maxLength: 10 }).filter(s => s !== 'End');

      fc.assert(
        fc.property(nonEndKeyArb, key => {
          const event = createKeyboardEvent(key);
          expect(isEndKey(event)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== Modifier Key Combination Tests ====================

describe('Modifier Key Combinations', () => {
  describe('isActivationKey with modifiers', () => {
    it('should return true for Enter with Ctrl modifier', () => {
      const event = createKeyboardEvent('Enter', { ctrlKey: true });
      expect(isActivationKey(event)).toBe(true);
    });

    it('should return true for Enter with Shift modifier', () => {
      const event = createKeyboardEvent('Enter', { shiftKey: true });
      expect(isActivationKey(event)).toBe(true);
    });

    it('should return true for Space with Alt modifier', () => {
      const event = createKeyboardEvent(' ', { altKey: true });
      expect(isActivationKey(event)).toBe(true);
    });
  });

  describe('isArrowKey with modifiers', () => {
    it('should return true for ArrowDown with Ctrl modifier', () => {
      const event = createKeyboardEvent('ArrowDown', { ctrlKey: true });
      expect(isArrowKey(event)).toBe(true);
    });

    it('should return true for ArrowUp with Shift modifier', () => {
      const event = createKeyboardEvent('ArrowUp', { shiftKey: true });
      expect(isArrowKey(event)).toBe(true);
    });

    it('should return true for ArrowLeft with Alt modifier', () => {
      const event = createKeyboardEvent('ArrowLeft', { altKey: true });
      expect(isArrowKey(event)).toBe(true);
    });
  });

  describe('handleActivation with modifiers', () => {
    it('should activate for Enter with Ctrl modifier', () => {
      const callback = vi.fn();
      const event = createKeyboardEvent('Enter', { ctrlKey: true });
      const result = handleActivation(event, callback);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should activate for Space with Shift modifier', () => {
      const callback = vi.fn();
      const event = createKeyboardEvent(' ', { shiftKey: true });
      const result = handleActivation(event, callback);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNavigationDirection with modifiers', () => {
    it('should return correct direction for ArrowDown with Ctrl', () => {
      const event = createKeyboardEvent('ArrowDown', { ctrlKey: true });
      expect(getNavigationDirection(event)).toBe('down');
    });

    it('should return correct direction for ArrowUp with Shift', () => {
      const event = createKeyboardEvent('ArrowUp', { shiftKey: true });
      expect(getNavigationDirection(event)).toBe('up');
    });
  });
});

// ==================== Null/Invalid Event Handling ====================

describe('Null/Invalid Handling', () => {
  /**
   * **Validates: Requirements 9.4**
   * All key detection helpers should handle edge cases gracefully.
   */

  describe('Key detection with empty key string', () => {
    it('isActivationKey should return false for empty key', () => {
      const event = createKeyboardEvent('');
      expect(isActivationKey(event)).toBe(false);
    });

    it('isArrowKey should return false for empty key', () => {
      const event = createKeyboardEvent('');
      expect(isArrowKey(event)).toBe(false);
    });

    it('isEscapeKey should return false for empty key', () => {
      const event = createKeyboardEvent('');
      expect(isEscapeKey(event)).toBe(false);
    });

    it('isTabKey should return false for empty key', () => {
      const event = createKeyboardEvent('');
      expect(isTabKey(event)).toBe(false);
    });

    it('isHomeKey should return false for empty key', () => {
      const event = createKeyboardEvent('');
      expect(isHomeKey(event)).toBe(false);
    });

    it('isEndKey should return false for empty key', () => {
      const event = createKeyboardEvent('');
      expect(isEndKey(event)).toBe(false);
    });

    it('getNavigationDirection should return null for empty key', () => {
      const event = createKeyboardEvent('');
      expect(getNavigationDirection(event)).toBeNull();
    });
  });

  describe('handleActivation with non-activation keys', () => {
    it('should not call callback for Escape key', () => {
      const callback = vi.fn();
      const event = createKeyboardEvent('Escape');
      const result = handleActivation(event, callback);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not call callback for arrow keys', () => {
      const callback = vi.fn();
      const event = createKeyboardEvent('ArrowDown');
      const result = handleActivation(event, callback);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not call callback for Tab key', () => {
      const callback = vi.fn();
      const event = createKeyboardEvent('Tab');
      const result = handleActivation(event, callback);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getNextIndex boundary inputs', () => {
    it('should handle negative totalItems', () => {
      const result = getNextIndex(0, 'down', -1);
      expect(typeof result).toBe('number');
      expect(result).toBe(0);
    });

    it('should handle currentIndex equal to totalItems', () => {
      // Out-of-bounds currentIndex
      const result = getNextIndex(5, 'down', 5);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative currentIndex', () => {
      const result = getNextIndex(-1, 'down', 5);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large totalItems', () => {
      const result = getNextIndex(0, 'down', 100000);
      expect(result).toBe(1);
    });
  });

  describe('getFocusableElements with edge cases', () => {
    it('should handle undefined container gracefully', () => {
      expect(getFocusableElements(undefined as any)).toEqual([]);
    });

    it('should handle empty container', () => {
      const container = document.createElement('div');
      expect(getFocusableElements(container)).toEqual([]);
    });

    it('should handle container with only disabled elements', () => {
      const container = document.createElement('div');
      container.innerHTML = '<button disabled>Disabled</button><input disabled />';
      expect(getFocusableElements(container)).toEqual([]);
    });

    it('should handle deeply nested focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = '<div><div><div><button>Deep</button></div></div></div>';
      const result = getFocusableElements(container);
      expect(result.length).toBe(1);
      expect(result[0].textContent).toBe('Deep');
    });
  });
});
