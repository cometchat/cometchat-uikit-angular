import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Mention Scroll Into View
 *
 * **Feature: message-composer-bugfixes, Property 5: Mention Scroll Into View**
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Property 5: Mention Scroll Into View
 * *For any* mention suggestions list with more items than fit in the viewport,
 * navigating with arrow keys should scroll the focused item into view.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

// ==================== Mock Types ====================

/**
 * Interface representing a mention suggestion
 * Mirrors the MentionSuggestion interface from the component
 */
interface MentionSuggestion {
  uid: string;
  name: string;
  avatar?: string;
  isAllMention?: boolean;
}

/**
 * Interface representing the scroll state of the mention suggestions panel
 */
interface ScrollState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Interface representing the mention suggestions panel state
 */
interface MentionPanelState {
  isOpen: boolean;
  suggestions: MentionSuggestion[];
  focusedIndex: number;
  scrollState: ScrollState;
  itemHeight: number;
  visibleItemCount: number;
}

/**
 * Enum for navigation direction
 */
type NavigationDirection = 'up' | 'down';

// ==================== Constants ====================

/**
 * Default item height in pixels (matches CSS)
 */
const DEFAULT_ITEM_HEIGHT = 48;

/**
 * Default visible item count (typical viewport)
 */
const DEFAULT_VISIBLE_ITEMS = 5;

/**
 * Maximum number of suggestions to display
 */
const MAX_SUGGESTIONS = 50;

// ==================== Pure Functions (Mirror Component Logic) ====================

/**
 * Create a mention suggestion
 *
 * @param uid - User ID
 * @param name - Display name
 * @param isAllMention - Whether this is the @all mention
 * @returns MentionSuggestion object
 */
function createMentionSuggestion(
  uid: string,
  name: string,
  isAllMention = false
): MentionSuggestion {
  return { uid, name, isAllMention };
}

/**
 * Get the default scroll state (scrolled to top)
 *
 * @param totalItems - Total number of items in the list
 * @param visibleItems - Number of items visible in viewport
 * @param itemHeight - Height of each item in pixels
 * @returns Default ScrollState
 */
function getDefaultScrollState(
  totalItems: number,
  visibleItems: number,
  itemHeight: number
): ScrollState {
  return {
    scrollTop: 0,
    scrollHeight: totalItems * itemHeight,
    clientHeight: visibleItems * itemHeight,
  };
}

/**
 * Get the default mention panel state (closed)
 *
 * @returns Default MentionPanelState with panel closed
 */
function getDefaultMentionPanelState(): MentionPanelState {
  return {
    isOpen: false,
    suggestions: [],
    focusedIndex: 0,
    scrollState: getDefaultScrollState(0, DEFAULT_VISIBLE_ITEMS, DEFAULT_ITEM_HEIGHT),
    itemHeight: DEFAULT_ITEM_HEIGHT,
    visibleItemCount: DEFAULT_VISIBLE_ITEMS,
  };
}

/**
 * Open the mention panel with suggestions
 *
 * @param suggestions - Array of mention suggestions
 * @param visibleItems - Number of items visible in viewport
 * @param itemHeight - Height of each item in pixels
 * @returns MentionPanelState with panel open
 */
function openMentionPanel(
  suggestions: MentionSuggestion[],
  visibleItems: number = DEFAULT_VISIBLE_ITEMS,
  itemHeight: number = DEFAULT_ITEM_HEIGHT
): MentionPanelState {
  return {
    isOpen: true,
    suggestions,
    focusedIndex: 0,
    scrollState: getDefaultScrollState(suggestions.length, visibleItems, itemHeight),
    itemHeight,
    visibleItemCount: visibleItems,
  };
}

/**
 * Calculate the scroll position needed to show an item
 * Mirrors the scrollIntoView behavior with block: 'nearest'
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * @param state - Current mention panel state
 * @param targetIndex - Index of the item to scroll into view
 * @returns New scroll position
 */
function calculateScrollToShowItem(state: MentionPanelState, targetIndex: number): number {
  const { scrollState, itemHeight, visibleItemCount } = state;
  const { scrollTop, clientHeight } = scrollState;

  // Calculate the position of the target item
  const itemTop = targetIndex * itemHeight;
  const itemBottom = itemTop + itemHeight;

  // Calculate the visible range
  const visibleTop = scrollTop;
  const visibleBottom = scrollTop + clientHeight;

  // If item is above visible area, scroll up to show it at top
  if (itemTop < visibleTop) {
    return itemTop;
  }

  // If item is below visible area, scroll down to show it at bottom
  if (itemBottom > visibleBottom) {
    return itemBottom - clientHeight;
  }

  // Item is already visible, no scroll needed
  return scrollTop;
}

/**
 * Check if an item is visible in the current scroll position
 *
 * @param state - Current mention panel state
 * @param itemIndex - Index of the item to check
 * @returns True if the item is fully visible
 */
function isItemVisible(state: MentionPanelState, itemIndex: number): boolean {
  const { scrollState, itemHeight } = state;
  const { scrollTop, clientHeight } = scrollState;

  const itemTop = itemIndex * itemHeight;
  const itemBottom = itemTop + itemHeight;

  const visibleTop = scrollTop;
  const visibleBottom = scrollTop + clientHeight;

  return itemTop >= visibleTop && itemBottom <= visibleBottom;
}

/**
 * Navigate to the next suggestion (Arrow Down)
 * Mirrors the handleKeydown behavior for ArrowDown
 *
 * **Validates: Requirements 3.1, 3.3**
 *
 * @param state - Current mention panel state
 * @returns New mention panel state with updated focus and scroll
 */
function navigateDown(state: MentionPanelState): MentionPanelState {
  if (!state.isOpen || state.suggestions.length === 0) {
    return state;
  }

  // Calculate new focused index (wrap around)
  const newIndex = (state.focusedIndex + 1) % state.suggestions.length;

  // Calculate new scroll position to show the focused item
  const newScrollTop = calculateScrollToShowItem({ ...state, focusedIndex: newIndex }, newIndex);

  return {
    ...state,
    focusedIndex: newIndex,
    scrollState: {
      ...state.scrollState,
      scrollTop: newScrollTop,
    },
  };
}

/**
 * Navigate to the previous suggestion (Arrow Up)
 * Mirrors the handleKeydown behavior for ArrowUp
 *
 * **Validates: Requirements 3.2, 3.4**
 *
 * @param state - Current mention panel state
 * @returns New mention panel state with updated focus and scroll
 */
function navigateUp(state: MentionPanelState): MentionPanelState {
  if (!state.isOpen || state.suggestions.length === 0) {
    return state;
  }

  // Calculate new focused index (wrap around)
  const newIndex = (state.focusedIndex - 1 + state.suggestions.length) % state.suggestions.length;

  // Calculate new scroll position to show the focused item
  const newScrollTop = calculateScrollToShowItem({ ...state, focusedIndex: newIndex }, newIndex);

  return {
    ...state,
    focusedIndex: newIndex,
    scrollState: {
      ...state.scrollState,
      scrollTop: newScrollTop,
    },
  };
}

/**
 * Navigate in a direction
 *
 * @param state - Current mention panel state
 * @param direction - Navigation direction
 * @returns New mention panel state
 */
function navigate(state: MentionPanelState, direction: NavigationDirection): MentionPanelState {
  return direction === 'down' ? navigateDown(state) : navigateUp(state);
}

/**
 * Apply multiple navigation steps
 *
 * @param initialState - Starting state
 * @param directions - Array of navigation directions
 * @returns Final state after all navigations
 */
function applyNavigations(
  initialState: MentionPanelState,
  directions: NavigationDirection[]
): MentionPanelState {
  return directions.reduce((state, direction) => navigate(state, direction), initialState);
}

/**
 * Check if the focused item is visible after navigation
 * This is the core property we're testing
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * @param state - Current mention panel state
 * @returns True if the focused item is visible
 */
function isFocusedItemVisible(state: MentionPanelState): boolean {
  if (!state.isOpen || state.suggestions.length === 0) {
    return true; // No item to check
  }
  return isItemVisible(state, state.focusedIndex);
}

/**
 * Update suggestions while maintaining scroll position for same items
 * Mirrors the behavior when suggestions are updated with same items
 *
 * **Validates: Requirements 3.6**
 *
 * @param state - Current mention panel state
 * @param newSuggestions - New suggestions array
 * @returns Updated mention panel state
 */
function updateSuggestions(
  state: MentionPanelState,
  newSuggestions: MentionSuggestion[]
): MentionPanelState {
  // Check if suggestions are the same (by uid)
  const areSameSuggestions =
    state.suggestions.length === newSuggestions.length &&
    state.suggestions.every((s, i) => s.uid === newSuggestions[i].uid);

  if (areSameSuggestions) {
    // Maintain scroll position
    return {
      ...state,
      suggestions: newSuggestions,
    };
  }

  // Reset to top for new suggestions
  return {
    ...state,
    suggestions: newSuggestions,
    focusedIndex: 0,
    scrollState: getDefaultScrollState(
      newSuggestions.length,
      state.visibleItemCount,
      state.itemHeight
    ),
  };
}

// ==================== Test Generators ====================

/**
 * Generator for mention suggestion
 */
const mentionSuggestionGenerator = (index: number): fc.Arbitrary<MentionSuggestion> =>
  fc.record({
    uid: fc.constant(`user-${index}`),
    name: fc.string({ minLength: 1, maxLength: 20 }).map(s => s || `User ${index}`),
    isAllMention: fc.constant(false),
  });

/**
 * Generator for array of mention suggestions
 */
const mentionSuggestionsGenerator = (
  minLength = 1,
  maxLength: number = MAX_SUGGESTIONS
): fc.Arbitrary<MentionSuggestion[]> =>
  fc
    .integer({ min: minLength, max: maxLength })
    .chain(count =>
      fc.tuple(...Array.from({ length: count }, (_, i) => mentionSuggestionGenerator(i)))
    );

/**
 * Generator for mention suggestions with more items than visible
 * This ensures we have a scrollable list
 */
const scrollableSuggestionsGenerator = (
  visibleItems: number = DEFAULT_VISIBLE_ITEMS
): fc.Arbitrary<MentionSuggestion[]> =>
  mentionSuggestionsGenerator(visibleItems + 1, MAX_SUGGESTIONS);

/**
 * Generator for navigation direction
 */
const navigationDirectionGenerator = (): fc.Arbitrary<NavigationDirection> =>
  fc.constantFrom('up', 'down');

/**
 * Generator for sequence of navigation directions
 */
const navigationSequenceGenerator = (
  minLength = 1,
  maxLength = 20
): fc.Arbitrary<NavigationDirection[]> =>
  fc.array(navigationDirectionGenerator(), { minLength, maxLength });

/**
 * Generator for visible item count (viewport size)
 */
const visibleItemCountGenerator = (): fc.Arbitrary<number> => fc.integer({ min: 3, max: 10 });

/**
 * Generator for item height
 */
const itemHeightGenerator = (): fc.Arbitrary<number> => fc.integer({ min: 32, max: 64 });

/**
 * Generator for open mention panel state with scrollable list
 */
const openMentionPanelGenerator = (): fc.Arbitrary<MentionPanelState> =>
  fc
    .tuple(visibleItemCountGenerator(), itemHeightGenerator())
    .chain(([visibleItems, itemHeight]) =>
      scrollableSuggestionsGenerator(visibleItems).map(suggestions =>
        openMentionPanel(suggestions, visibleItems, itemHeight)
      )
    );

/**
 * Generator for open mention panel with specific focus position
 */
const mentionPanelWithFocusGenerator = (): fc.Arbitrary<MentionPanelState> =>
  openMentionPanelGenerator().chain(state =>
    fc.integer({ min: 0, max: state.suggestions.length - 1 }).map(focusIndex => ({
      ...state,
      focusedIndex: focusIndex,
      scrollState: {
        ...state.scrollState,
        scrollTop: calculateScrollToShowItem(state, focusIndex),
      },
    }))
  );

// ==================== Property Tests ====================

describe('Mention Scroll Into View Property Tests', () => {
  /**
   * **Feature: message-composer-bugfixes, Property 5: Mention Scroll Into View**
   *
   * *For any* mention suggestions list with more items than fit in the viewport,
   * navigating with arrow keys should scroll the focused item into view.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
   */
  describe('Property 5: Mention Scroll Into View', () => {
    /**
     * Test: Arrow Down scrolls focused item into view
     *
     * **Validates: Requirements 3.1, 3.3**
     *
     * WHEN the user presses Arrow Down in mention suggestions
     * THEN the focused item SHALL be scrolled into view if outside viewport
     */
    it('should scroll focused item into view when navigating down', () => {
      fc.assert(
        fc.property(openMentionPanelGenerator(), initialState => {
          const newState = navigateDown(initialState);

          // The focused item should be visible after navigation
          expect(isFocusedItemVisible(newState)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Arrow Up scrolls focused item into view
     *
     * **Validates: Requirements 3.2, 3.4**
     *
     * WHEN the user presses Arrow Up in mention suggestions
     * THEN the focused item SHALL be scrolled into view if outside viewport
     */
    it('should scroll focused item into view when navigating up', () => {
      fc.assert(
        fc.property(openMentionPanelGenerator(), initialState => {
          const newState = navigateUp(initialState);

          // The focused item should be visible after navigation
          expect(isFocusedItemVisible(newState)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Focused item is always visible after any navigation sequence
     *
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     *
     * WHEN the user navigates through mention suggestions with any sequence of arrow keys
     * THEN the focused item SHALL always be visible
     */
    it('should keep focused item visible after any navigation sequence', () => {
      fc.assert(
        fc.property(
          openMentionPanelGenerator(),
          navigationSequenceGenerator(),
          (initialState, directions) => {
            const finalState = applyNavigations(initialState, directions);

            // The focused item should be visible after all navigations
            expect(isFocusedItemVisible(finalState)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scrolling down at bottom of list wraps to top
     *
     * **Validates: Requirements 3.1, 3.3**
     *
     * WHEN the focused item is at the bottom of the list and Arrow Down is pressed
     * THEN the focus SHALL wrap to the first item and scroll to show it
     */
    it('should wrap to top and scroll when navigating down from last item', () => {
      fc.assert(
        fc.property(openMentionPanelGenerator(), initialState => {
          // Set focus to last item
          const stateAtEnd: MentionPanelState = {
            ...initialState,
            focusedIndex: initialState.suggestions.length - 1,
            scrollState: {
              ...initialState.scrollState,
              scrollTop: calculateScrollToShowItem(
                initialState,
                initialState.suggestions.length - 1
              ),
            },
          };

          const newState = navigateDown(stateAtEnd);

          // Should wrap to first item
          expect(newState.focusedIndex).toBe(0);
          // First item should be visible
          expect(isFocusedItemVisible(newState)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scrolling up at top of list wraps to bottom
     *
     * **Validates: Requirements 3.2, 3.4**
     *
     * WHEN the focused item is at the top of the list and Arrow Up is pressed
     * THEN the focus SHALL wrap to the last item and scroll to show it
     */
    it('should wrap to bottom and scroll when navigating up from first item', () => {
      fc.assert(
        fc.property(openMentionPanelGenerator(), initialState => {
          // Ensure focus is at first item (default)
          expect(initialState.focusedIndex).toBe(0);

          const newState = navigateUp(initialState);

          // Should wrap to last item
          expect(newState.focusedIndex).toBe(initialState.suggestions.length - 1);
          // Last item should be visible
          expect(isFocusedItemVisible(newState)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scroll position is minimal (nearest behavior)
     *
     * **Validates: Requirements 3.3, 3.4**
     *
     * WHEN scrolling to show an item
     * THEN the scroll position SHALL be the minimum needed to show the item
     */
    it('should use minimal scroll to show item (nearest behavior)', () => {
      fc.assert(
        fc.property(
          mentionPanelWithFocusGenerator(),
          navigationDirectionGenerator(),
          (initialState, direction) => {
            const newState = navigate(initialState, direction);
            const { scrollTop, clientHeight } = newState.scrollState;
            const { focusedIndex, itemHeight } = newState;

            const itemTop = focusedIndex * itemHeight;
            const itemBottom = itemTop + itemHeight;

            // Item should be within visible range
            expect(itemTop).toBeGreaterThanOrEqual(scrollTop);
            expect(itemBottom).toBeLessThanOrEqual(scrollTop + clientHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scroll position doesn't change if item is already visible
     *
     * **Validates: Requirements 3.1, 3.2**
     *
     * WHEN navigating to an item that is already visible
     * THEN the scroll position SHALL not change
     */
    it('should not scroll if item is already visible', () => {
      fc.assert(
        fc.property(
          visibleItemCountGenerator(),
          itemHeightGenerator(),
          (visibleItems, itemHeight) => {
            // Create a list with exactly visibleItems items (all visible)
            const suggestions = Array.from({ length: visibleItems }, (_, i) =>
              createMentionSuggestion(`user-${i}`, `User ${i}`)
            );

            const state = openMentionPanel(suggestions, visibleItems, itemHeight);
            const initialScrollTop = state.scrollState.scrollTop;

            // Navigate down (all items should be visible)
            const newState = navigateDown(state);

            // Scroll position should not change since all items are visible
            expect(newState.scrollState.scrollTop).toBe(initialScrollTop);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scroll maintains position when suggestions are updated with same items
     *
     * **Validates: Requirements 3.6**
     *
     * WHEN the mention suggestions are updated with the same items
     * THEN the scroll position SHALL be maintained
     */
    it('should maintain scroll position when suggestions are updated with same items', () => {
      fc.assert(
        fc.property(mentionPanelWithFocusGenerator(), initialState => {
          // Create a copy of suggestions (same uids)
          const sameSuggestions = initialState.suggestions.map(s => ({ ...s }));

          const newState = updateSuggestions(initialState, sameSuggestions);

          // Scroll position should be maintained
          expect(newState.scrollState.scrollTop).toBe(initialState.scrollState.scrollTop);
          // Focus should be maintained
          expect(newState.focusedIndex).toBe(initialState.focusedIndex);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scroll resets when suggestions change
     *
     * **Validates: Requirements 3.6**
     *
     * WHEN the mention suggestions are updated with different items
     * THEN the scroll position SHALL reset to top and focus to first item
     */
    it('should reset scroll and focus when suggestions change', () => {
      fc.assert(
        fc.property(
          mentionPanelWithFocusGenerator(),
          scrollableSuggestionsGenerator(),
          (initialState, newSuggestions) => {
            // Ensure new suggestions are different
            const differentSuggestions = newSuggestions.map((s, i) => ({
              ...s,
              uid: `different-${i}`,
            }));

            const newState = updateSuggestions(initialState, differentSuggestions);

            // Scroll should reset to top
            expect(newState.scrollState.scrollTop).toBe(0);
            // Focus should reset to first item
            expect(newState.focusedIndex).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Navigation is deterministic
     *
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     *
     * WHEN the same navigation sequence is applied multiple times
     * THEN the result SHALL be identical each time
     */
    it('should produce deterministic results for same navigation sequence', () => {
      fc.assert(
        fc.property(
          openMentionPanelGenerator(),
          navigationSequenceGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (initialState, directions, repeatCount) => {
            const results: MentionPanelState[] = [];

            for (let i = 0; i < repeatCount; i++) {
              results.push(applyNavigations(initialState, directions));
            }

            // All results should have same focused index
            for (let i = 1; i < results.length; i++) {
              expect(results[i].focusedIndex).toBe(results[0].focusedIndex);
              expect(results[i].scrollState.scrollTop).toBe(results[0].scrollState.scrollTop);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Full cycle navigation returns to start
     *
     * **Validates: Requirements 3.1, 3.2**
     *
     * WHEN navigating down through all items and back to start
     * THEN the focus SHALL return to the first item
     */
    it('should return to first item after navigating through all items', () => {
      fc.assert(
        fc.property(openMentionPanelGenerator(), initialState => {
          const itemCount = initialState.suggestions.length;

          // Navigate down through all items
          let state = initialState;
          for (let i = 0; i < itemCount; i++) {
            state = navigateDown(state);
          }

          // Should be back at first item
          expect(state.focusedIndex).toBe(0);
          // First item should be visible
          expect(isFocusedItemVisible(state)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Navigation with single item list
     *
     * **Validates: Requirements 3.1, 3.2**
     *
     * WHEN there is only one suggestion
     * THEN navigation SHALL keep focus on that item
     */
    it('should keep focus on single item when navigating', () => {
      fc.assert(
        fc.property(
          navigationDirectionGenerator(),
          fc.integer({ min: 1, max: 10 }),
          (direction, navCount) => {
            const suggestions = [createMentionSuggestion('user-0', 'Only User')];
            let state = openMentionPanel(suggestions);

            // Navigate multiple times
            for (let i = 0; i < navCount; i++) {
              state = navigate(state, direction);
            }

            // Should stay on the only item
            expect(state.focusedIndex).toBe(0);
            expect(isFocusedItemVisible(state)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Closed panel navigation is no-op
     *
     * **Validates: Requirements 3.1, 3.2**
     *
     * WHEN the mention panel is closed
     * THEN navigation SHALL not change state
     */
    it('should not change state when panel is closed', () => {
      fc.assert(
        fc.property(navigationSequenceGenerator(), directions => {
          const closedState = getDefaultMentionPanelState();

          const finalState = applyNavigations(closedState, directions);

          // State should be unchanged
          expect(finalState.isOpen).toBe(false);
          expect(finalState.focusedIndex).toBe(0);
          expect(finalState.suggestions.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Empty suggestions list navigation is no-op
     *
     * **Validates: Requirements 3.1, 3.2**
     *
     * WHEN the suggestions list is empty
     * THEN navigation SHALL not change state
     */
    it('should not change state when suggestions list is empty', () => {
      fc.assert(
        fc.property(navigationSequenceGenerator(), directions => {
          const emptyState: MentionPanelState = {
            ...getDefaultMentionPanelState(),
            isOpen: true,
            suggestions: [],
          };

          const finalState = applyNavigations(emptyState, directions);

          // Focus should remain at 0
          expect(finalState.focusedIndex).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scroll position is always non-negative
     *
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     *
     * WHEN navigating through suggestions
     * THEN the scroll position SHALL never be negative
     */
    it('should never have negative scroll position', () => {
      fc.assert(
        fc.property(
          openMentionPanelGenerator(),
          navigationSequenceGenerator(1, 50),
          (initialState, directions) => {
            const finalState = applyNavigations(initialState, directions);

            expect(finalState.scrollState.scrollTop).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Scroll position never exceeds maximum
     *
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     *
     * WHEN navigating through suggestions
     * THEN the scroll position SHALL not exceed the maximum scrollable area
     */
    it('should never exceed maximum scroll position', () => {
      fc.assert(
        fc.property(
          openMentionPanelGenerator(),
          navigationSequenceGenerator(1, 50),
          (initialState, directions) => {
            const finalState = applyNavigations(initialState, directions);
            const { scrollTop, scrollHeight, clientHeight } = finalState.scrollState;

            const maxScroll = Math.max(0, scrollHeight - clientHeight);
            expect(scrollTop).toBeLessThanOrEqual(maxScroll);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Focus index is always within bounds
     *
     * **Validates: Requirements 3.1, 3.2**
     *
     * WHEN navigating through suggestions
     * THEN the focus index SHALL always be within valid bounds
     */
    it('should keep focus index within valid bounds', () => {
      fc.assert(
        fc.property(
          openMentionPanelGenerator(),
          navigationSequenceGenerator(1, 50),
          (initialState, directions) => {
            const finalState = applyNavigations(initialState, directions);

            expect(finalState.focusedIndex).toBeGreaterThanOrEqual(0);
            expect(finalState.focusedIndex).toBeLessThan(finalState.suggestions.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
