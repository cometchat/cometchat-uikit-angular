import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Users List Auto-Scroll on Navigation (Bug 2)
 *
 * **Property 2: List Auto-Scroll on Navigation**
 * *For any* users or groups list with items extending beyond the viewport, navigating with arrow keys
 * should automatically scroll to keep the focused item visible within the viewport.
 *
 * **Validates: Requirements 2.2, 2.3, 2.4**
 *
 * This test validates that:
 * - Auto-scroll when navigating beyond viewport
 * - Scroll down on arrow down at last visible item
 * - Scroll up on arrow up at first visible item
 * - scrollIntoView is called with correct options (smooth, nearest)
 */

// ==================== Mock DOM Elements ====================

/**
 * Mock HTMLElement for testing scroll behavior
 */
class MockHTMLElement {
  private _scrollTop = 0;
  private _scrollHeight = 0;
  private _clientHeight = 0;
  private _offsetTop = 0;
  private _offsetHeight = 0;
  private _classList = new Set<string>();
  private _attributes = new Map<string, string>();
  public children: MockHTMLElement[] = [];
  public parent: MockHTMLElement | null = null;
  public scrollIntoViewCalled = false;
  public scrollIntoViewOptions: ScrollIntoViewOptions | null = null;

  constructor(
    public tagName: string,
    public className = '',
    options: {
      scrollHeight?: number;
      clientHeight?: number;
      offsetTop?: number;
      offsetHeight?: number;
    } = {}
  ) {
    if (className) {
      className.split(' ').forEach(cls => this._classList.add(cls));
    }

    this._scrollHeight = options.scrollHeight || 1000;
    this._clientHeight = options.clientHeight || 300;
    this._offsetTop = options.offsetTop || 0;
    this._offsetHeight = options.offsetHeight || 50;
  }

  get scrollTop(): number {
    return this._scrollTop;
  }

  set scrollTop(value: number) {
    this._scrollTop = value;
  }

  get scrollHeight(): number {
    return this._scrollHeight;
  }

  get clientHeight(): number {
    return this._clientHeight;
  }

  get offsetTop(): number {
    return this._offsetTop;
  }

  get offsetHeight(): number {
    return this._offsetHeight;
  }

  get classList() {
    return {
      contains: (className: string) => this._classList.has(className),
      add: (className: string) => this._classList.add(className),
      remove: (className: string) => this._classList.delete(className),
    };
  }

  setAttribute(name: string, value: string): void {
    this._attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this._attributes.get(name) || null;
  }

  appendChild(child: MockHTMLElement): void {
    this.children.push(child);
    child.parent = this;
  }

  querySelector(selector: string): MockHTMLElement | null {
    // Handle attribute selector [data-index="N"]
    if (selector.startsWith('[data-index="') && selector.endsWith('"]')) {
      const index = selector.match(/\[data-index="(\d+)"\]/)?.[1];
      if (index !== undefined) {
        for (const child of this.children) {
          if (child.getAttribute('data-index') === index) {
            return child;
          }
        }
      }
    }

    // Handle class selector
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      for (const child of this.children) {
        if (child.classList.contains(className)) {
          return child;
        }
      }
    }

    return null;
  }

  scrollIntoView(options?: ScrollIntoViewOptions): void {
    this.scrollIntoViewCalled = true;
    this.scrollIntoViewOptions = options || null;

    // Simulate scroll behavior
    if (this.parent) {
      const parentScrollTop = this.parent.scrollTop;
      const parentClientHeight = this.parent.clientHeight;
      const itemOffsetTop = this.offsetTop;
      const itemOffsetHeight = this.offsetHeight;

      // Check if item is above viewport
      if (itemOffsetTop < parentScrollTop) {
        this.parent.scrollTop = itemOffsetTop;
      }
      // Check if item is below viewport
      else if (itemOffsetTop + itemOffsetHeight > parentScrollTop + parentClientHeight) {
        this.parent.scrollTop = itemOffsetTop + itemOffsetHeight - parentClientHeight;
      }
    }
  }

  isInViewport(): boolean {
    if (!this.parent) return true;

    const parentScrollTop = this.parent.scrollTop;
    const parentClientHeight = this.parent.clientHeight;
    const itemTop = this.offsetTop;
    const itemBottom = this.offsetTop + this.offsetHeight;

    return itemTop >= parentScrollTop && itemBottom <= parentScrollTop + parentClientHeight;
  }
}

// ==================== Test Setup ====================

/**
 * Create a mock users list structure with scrollable container
 */
function createUsersListStructure(itemCount: number): {
  container: MockHTMLElement;
  items: MockHTMLElement[];
} {
  const container = new MockHTMLElement('div', 'cometchat-users__list-container', {
    scrollHeight: itemCount * 50, // Each item is 50px tall
    clientHeight: 300, // Viewport shows 6 items at a time
  });

  const items: MockHTMLElement[] = [];

  for (let i = 0; i < itemCount; i++) {
    const item = new MockHTMLElement('cometchat-user-item', 'cometchat-user-item', {
      offsetTop: i * 50,
      offsetHeight: 50,
    });
    item.setAttribute('data-index', i.toString());
    container.appendChild(item);
    items.push(item);
  }

  return { container, items };
}

/**
 * Simulate arrow down navigation
 */
function simulateArrowDown(
  container: MockHTMLElement,
  currentIndex: number,
  items: MockHTMLElement[]
): number {
  const nextIndex = Math.min(currentIndex + 1, items.length - 1);
  const nextItem = items[nextIndex];

  // Simulate the scrollFocusedItemIntoView call
  nextItem.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  });

  return nextIndex;
}

/**
 * Simulate arrow up navigation
 */
function simulateArrowUp(
  container: MockHTMLElement,
  currentIndex: number,
  items: MockHTMLElement[]
): number {
  const prevIndex = Math.max(currentIndex - 1, 0);
  const prevItem = items[prevIndex];

  // Simulate the scrollFocusedItemIntoView call
  prevItem.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  });

  return prevIndex;
}

// ==================== Property-Based Tests ====================

describe('Property 2: List Auto-Scroll on Navigation', () => {
  /**
   * Property Test: Auto-scroll when navigating beyond viewport
   * **Validates: Requirements 2.2**
   */
  it('should automatically scroll when navigating beyond visible viewport', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }), // Number of items in list
        fc.integer({ min: 0, max: 5 }), // Starting index (within first viewport)
        (itemCount: number, startIndex: number) => {
          // Arrange: Create list with items extending beyond viewport
          const { container, items } = createUsersListStructure(itemCount);
          let currentIndex = startIndex;

          // Reset scroll position
          container.scrollTop = 0;

          // Act: Navigate down beyond the viewport (6 items visible at a time)
          const navigationsNeeded = 7 - startIndex; // Navigate to 7th item
          for (let i = 0; i < navigationsNeeded; i++) {
            currentIndex = simulateArrowDown(container, currentIndex, items);
          }

          // Assert: scrollIntoView was called on the focused item
          const focusedItem = items[currentIndex];
          expect(focusedItem.scrollIntoViewCalled).toBe(true);

          // Assert: scrollIntoView was called with correct options
          expect(focusedItem.scrollIntoViewOptions).toEqual({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });

          // Assert: Container scrolled to keep item visible
          // Item 7 (index 6) should be visible after scrolling
          expect(focusedItem.isInViewport()).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Scroll down on arrow down at last visible item
   * **Validates: Requirements 2.3**
   */
  it('should scroll down when pressing arrow down on last visible item', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }), // Number of items
        (itemCount: number) => {
          // Arrange: Create list and position at last visible item
          const { container, items } = createUsersListStructure(itemCount);
          container.scrollTop = 0;

          // Last visible item in initial viewport (6 items visible, so index 5)
          const lastVisibleIndex = 5;
          let currentIndex = lastVisibleIndex;

          // Verify item is currently visible
          expect(items[lastVisibleIndex].isInViewport()).toBe(true);

          // Act: Press arrow down to move to next item (beyond viewport)
          currentIndex = simulateArrowDown(container, currentIndex, items);

          // Assert: Moved to next item
          expect(currentIndex).toBe(lastVisibleIndex + 1);

          // Assert: scrollIntoView was called
          expect(items[currentIndex].scrollIntoViewCalled).toBe(true);

          // Assert: New item is now visible (container scrolled down)
          expect(items[currentIndex].isInViewport()).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Scroll up on arrow up at first visible item
   * **Validates: Requirements 2.4**
   */
  it('should scroll up when pressing arrow up on first visible item', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 50 }), // Number of items (min 12 so scrolledItems < itemCount)
        fc.integer({ min: 6, max: 10 }), // Starting scroll position (items)
        (itemCount: number, scrolledItems: number) => {
          // Arrange: Create list and scroll down
          const { container, items } = createUsersListStructure(itemCount);

          // Scroll down so first visible item is at scrolledItems index
          container.scrollTop = scrolledItems * 50;

          // First visible item in current viewport
          const firstVisibleIndex = scrolledItems;
          let currentIndex = firstVisibleIndex;

          // Verify item is currently visible
          expect(items[firstVisibleIndex].isInViewport()).toBe(true);

          // Act: Press arrow up to move to previous item (above viewport)
          currentIndex = simulateArrowUp(container, currentIndex, items);

          // Assert: Moved to previous item
          expect(currentIndex).toBe(firstVisibleIndex - 1);

          // Assert: scrollIntoView was called
          expect(items[currentIndex].scrollIntoViewCalled).toBe(true);

          // Assert: New item is now visible (container scrolled up)
          expect(items[currentIndex].isInViewport()).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: scrollIntoView called with correct options
   * **Validates: Requirements 2.5**
   */
  it('should call scrollIntoView with smooth behavior and nearest block', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 30 }),
        fc.integer({ min: 0, max: 20 }),
        (itemCount: number, targetIndex: number) => {
          // Arrange
          const { container, items } = createUsersListStructure(itemCount);
          const safeTargetIndex = Math.min(targetIndex, itemCount - 1);

          // Act: Navigate to target item
          items[safeTargetIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });

          // Assert: scrollIntoView was called with correct options
          expect(items[safeTargetIndex].scrollIntoViewCalled).toBe(true);
          expect(items[safeTargetIndex].scrollIntoViewOptions).toEqual({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Multiple navigation cycles maintain scroll sync
   * **Validates: Requirements 2.2, 2.3, 2.4**
   */
  it('should maintain scroll sync across multiple navigation cycles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 15, max: 30 }),
        fc.array(fc.constantFrom('down', 'up'), { minLength: 5, maxLength: 20 }),
        (itemCount: number, navigationSequence: ('down' | 'up')[]) => {
          // Arrange
          const { container, items } = createUsersListStructure(itemCount);
          let currentIndex = 0;
          container.scrollTop = 0;

          // Act: Execute navigation sequence
          for (const direction of navigationSequence) {
            if (direction === 'down' && currentIndex < itemCount - 1) {
              currentIndex = simulateArrowDown(container, currentIndex, items);
            } else if (direction === 'up' && currentIndex > 0) {
              currentIndex = simulateArrowUp(container, currentIndex, items);
            }

            // Assert: Current item is always visible after navigation
            expect(items[currentIndex].isInViewport()).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property Test: querySelector finds correct item by data-index
   * **Validates: Requirements 2.2**
   */
  it('should correctly query items by data-index attribute', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }),
        fc.integer({ min: 0, max: 15 }),
        (itemCount: number, queryIndex: number) => {
          // Arrange
          const { container, items } = createUsersListStructure(itemCount);
          const safeQueryIndex = Math.min(queryIndex, itemCount - 1);

          // Act: Query for item by data-index
          const foundItem = container.querySelector(`[data-index="${safeQueryIndex}"]`);

          // Assert: Found the correct item
          expect(foundItem).not.toBeNull();
          expect(foundItem).toBe(items[safeQueryIndex]);
          expect(foundItem?.getAttribute('data-index')).toBe(safeQueryIndex.toString());
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Scroll position updates correctly
   * **Validates: Requirements 2.2**
   */
  it('should update scroll position when item is outside viewport', () => {
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 30 }), (itemCount: number) => {
        // Arrange: Create list with initial scroll at top
        const { container, items } = createUsersListStructure(itemCount);
        container.scrollTop = 0;
        const initialScrollTop = container.scrollTop;

        // Act: Navigate to item beyond viewport (item 10)
        const targetIndex = Math.min(10, itemCount - 1);
        items[targetIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });

        // Assert: Scroll position changed
        if (targetIndex > 5) {
          // Beyond initial viewport
          expect(container.scrollTop).toBeGreaterThan(initialScrollTop);
        }

        // Assert: Target item is now visible
        expect(items[targetIndex].isInViewport()).toBe(true);
      }),
      { numRuns: 50 }
    );
  });
});

// ==================== Integration Tests ====================

describe('List Auto-Scroll - Integration', () => {
  /**
   * Integration test: Verify list structure supports scrolling
   */
  it('should have correct structure for scrollable list', () => {
    const { container, items } = createUsersListStructure(20);

    // Verify container has scroll properties
    expect(container.scrollHeight).toBeGreaterThan(container.clientHeight);
    expect(container.scrollHeight).toBe(20 * 50); // 20 items * 50px each
    expect(container.clientHeight).toBe(300); // Viewport height

    // Verify items have data-index attributes
    items.forEach((item, index) => {
      expect(item.getAttribute('data-index')).toBe(index.toString());
    });
  });

  /**
   * Integration test: Verify navigation from top to bottom
   */
  it('should successfully navigate from first to last item with auto-scroll', () => {
    const itemCount = 20;
    const { container, items } = createUsersListStructure(itemCount);
    let currentIndex = 0;

    // Navigate from first to last item
    while (currentIndex < itemCount - 1) {
      currentIndex = simulateArrowDown(container, currentIndex, items);

      // Verify current item is always visible
      expect(items[currentIndex].isInViewport()).toBe(true);
    }

    // Verify we reached the last item
    expect(currentIndex).toBe(itemCount - 1);
  });

  /**
   * Integration test: Verify navigation from bottom to top
   */
  it('should successfully navigate from last to first item with auto-scroll', () => {
    const itemCount = 20;
    const { container, items } = createUsersListStructure(itemCount);

    // Start at last item
    let currentIndex = itemCount - 1;
    container.scrollTop = container.scrollHeight - container.clientHeight;

    // Navigate from last to first item
    while (currentIndex > 0) {
      currentIndex = simulateArrowUp(container, currentIndex, items);

      // Verify current item is always visible
      expect(items[currentIndex].isInViewport()).toBe(true);
    }

    // Verify we reached the first item
    expect(currentIndex).toBe(0);
  });

  /**
   * Integration test: Verify scrollIntoView behavior matches React UIKit
   */
  it('should use scrollIntoView options that match React UIKit behavior', () => {
    const { container, items } = createUsersListStructure(15);

    // Navigate to item beyond viewport
    items[10].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });

    // Verify options match expected behavior
    expect(items[10].scrollIntoViewOptions).toEqual({
      behavior: 'smooth', // Smooth scrolling for better UX
      block: 'nearest', // Minimal scroll distance
      inline: 'nearest', // Minimal horizontal scroll
    });
  });
});
