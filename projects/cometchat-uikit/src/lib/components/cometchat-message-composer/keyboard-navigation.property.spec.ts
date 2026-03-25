import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Keyboard Navigation
 *
 * **Feature: message-composer-bugfixes, Property 3: Tab Navigation Order**
 * **Feature: message-composer-bugfixes, Property 4: Escape Closes All Popups**
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Property 3: Tab Navigation Order
 * *For any* focusable element in the composer, pressing Tab should move focus
 * to the next element in logical order, and Shift+Tab should move to the previous element.
 *
 * Property 4: Escape Closes All Popups
 * *For any* open popup (emoji keyboard, attachment menu, mention suggestions, stickers keyboard),
 * pressing Escape should close it and return focus to the editor.
 *
 * **Validates: Requirements 2.1, 2.2, 2.6**
 */

// ==================== Mock Types ====================

/**
 * Interface representing the popup state of the message composer
 * Mirrors the signal-based state in CometChatMessageComposerComponent
 */
interface PopupState {
  isEmojiKeyboardOpen: boolean;
  isAttachmentMenuOpen: boolean;
  isMentionSuggestionsOpen: boolean;
  isStickersKeyboardOpen: boolean;
}

/**
 * Supported popup types for testing
 */
type PopupType = 'emoji' | 'attachment' | 'mention' | 'stickers';

/**
 * All supported popup types array
 */
const POPUP_TYPES: PopupType[] = ['emoji', 'attachment', 'mention', 'stickers'];

/**
 * Interface representing a focusable element in the composer
 */
interface FocusableElement {
  id: string;
  tabIndex: number;
  type: 'input' | 'button' | 'menu-item';
  isDisabled: boolean;
}

/**
 * Interface representing focus state
 */
interface FocusState {
  currentFocusIndex: number;
  focusableElements: FocusableElement[];
}

/**
 * Enum for keyboard navigation direction
 */
type NavigationDirection = 'forward' | 'backward';

// ==================== Pure Functions (Mirror Component Logic) ====================

/**
 * Get the default popup state (all popups closed)
 * Mirrors the initial state of CometChatMessageComposerComponent
 *
 * @returns Default PopupState with all popups closed
 */
function getDefaultPopupState(): PopupState {
  return {
    isEmojiKeyboardOpen: false,
    isAttachmentMenuOpen: false,
    isMentionSuggestionsOpen: false,
    isStickersKeyboardOpen: false,
  };
}

/**
 * Open a specific popup
 * Mirrors the behavior of popup toggle methods in the component
 *
 * @param state - Current popup state
 * @param popupType - The popup type to open
 * @returns New popup state with the specified popup open
 */
function openPopup(state: PopupState, popupType: PopupType): PopupState {
  // Opening a popup closes all other popups (mutual exclusion)
  const newState = getDefaultPopupState();

  switch (popupType) {
    case 'emoji':
      newState.isEmojiKeyboardOpen = true;
      break;
    case 'attachment':
      newState.isAttachmentMenuOpen = true;
      break;
    case 'mention':
      newState.isMentionSuggestionsOpen = true;
      break;
    case 'stickers':
      newState.isStickersKeyboardOpen = true;
      break;
  }

  return newState;
}

/**
 * Close all popups
 * Mirrors the closeAllPopups() method in CometChatMessageComposerComponent
 *
 * **Validates: Requirements 2.6**
 *
 * @param _state - Current popup state (unused, all popups are closed)
 * @returns New popup state with all popups closed
 */
function closeAllPopups(_state: PopupState): PopupState {
  return getDefaultPopupState();
}

/**
 * Check if any popup is open
 *
 * @param state - Current popup state
 * @returns True if any popup is open
 */
function isAnyPopupOpen(state: PopupState): boolean {
  return (
    state.isEmojiKeyboardOpen ||
    state.isAttachmentMenuOpen ||
    state.isMentionSuggestionsOpen ||
    state.isStickersKeyboardOpen
  );
}

/**
 * Check if a specific popup is open
 *
 * @param state - Current popup state
 * @param popupType - The popup type to check
 * @returns True if the specified popup is open
 */
function isPopupOpen(state: PopupState, popupType: PopupType): boolean {
  switch (popupType) {
    case 'emoji':
      return state.isEmojiKeyboardOpen;
    case 'attachment':
      return state.isAttachmentMenuOpen;
    case 'mention':
      return state.isMentionSuggestionsOpen;
    case 'stickers':
      return state.isStickersKeyboardOpen;
  }
}

/**
 * Handle Escape key press
 * Mirrors the handleKeydown behavior for Escape key
 *
 * **Validates: Requirements 2.6**
 *
 * @param state - Current popup state
 * @returns New popup state after Escape is pressed
 */
function handleEscapeKey(state: PopupState): PopupState {
  return closeAllPopups(state);
}

/**
 * Get the next focusable element index when Tab is pressed
 * Mirrors browser's native Tab navigation behavior
 *
 * **Validates: Requirements 2.1**
 *
 * @param focusState - Current focus state
 * @returns Index of the next focusable element, or -1 if none
 */
function getNextFocusableIndex(focusState: FocusState): number {
  const { currentFocusIndex, focusableElements } = focusState;

  // Find next enabled element
  for (let i = currentFocusIndex + 1; i < focusableElements.length; i++) {
    if (!focusableElements[i].isDisabled) {
      return i;
    }
  }

  // Wrap around to beginning
  for (let i = 0; i < currentFocusIndex; i++) {
    if (!focusableElements[i].isDisabled) {
      return i;
    }
  }

  // No other focusable element found, stay on current
  return currentFocusIndex;
}

/**
 * Get the previous focusable element index when Shift+Tab is pressed
 * Mirrors browser's native Shift+Tab navigation behavior
 *
 * **Validates: Requirements 2.2**
 *
 * @param focusState - Current focus state
 * @returns Index of the previous focusable element, or -1 if none
 */
function getPreviousFocusableIndex(focusState: FocusState): number {
  const { currentFocusIndex, focusableElements } = focusState;

  // Find previous enabled element
  for (let i = currentFocusIndex - 1; i >= 0; i--) {
    if (!focusableElements[i].isDisabled) {
      return i;
    }
  }

  // Wrap around to end
  for (let i = focusableElements.length - 1; i > currentFocusIndex; i--) {
    if (!focusableElements[i].isDisabled) {
      return i;
    }
  }

  // No other focusable element found, stay on current
  return currentFocusIndex;
}

/**
 * Handle Tab key navigation
 * Moves focus to next or previous element based on Shift key
 *
 * **Validates: Requirements 2.1, 2.2**
 *
 * @param focusState - Current focus state
 * @param direction - Navigation direction (forward for Tab, backward for Shift+Tab)
 * @returns New focus state with updated focus index
 */
function handleTabNavigation(focusState: FocusState, direction: NavigationDirection): FocusState {
  const newIndex =
    direction === 'forward'
      ? getNextFocusableIndex(focusState)
      : getPreviousFocusableIndex(focusState);

  return {
    ...focusState,
    currentFocusIndex: newIndex,
  };
}

/**
 * Create a focusable element
 *
 * @param id - Element ID
 * @param tabIndex - Tab index for ordering
 * @param type - Element type
 * @param isDisabled - Whether element is disabled
 * @returns FocusableElement object
 */
function createFocusableElement(
  id: string,
  tabIndex: number,
  type: 'input' | 'button' | 'menu-item',
  isDisabled: boolean
): FocusableElement {
  return { id, tabIndex, type, isDisabled };
}

/**
 * Get the default focusable elements for the message composer
 * Represents the logical tab order of the component
 *
 * @returns Array of focusable elements in tab order
 */
function getDefaultFocusableElements(): FocusableElement[] {
  return [
    createFocusableElement('text-input', 0, 'input', false),
    createFocusableElement('attachment-button', 1, 'button', false),
    createFocusableElement('emoji-button', 2, 'button', false),
    createFocusableElement('voice-button', 3, 'button', false),
    createFocusableElement('sticker-button', 4, 'button', false),
    createFocusableElement('send-button', 5, 'button', false),
  ];
}

// ==================== Test Generators ====================

/**
 * Generator for popup types
 */
const popupTypeGenerator = (): fc.Arbitrary<PopupType> => fc.constantFrom(...POPUP_TYPES);

/**
 * Generator for random popup state
 * Only one popup can be open at a time (mutual exclusion)
 */
const popupStateGenerator = (): fc.Arbitrary<PopupState> =>
  fc.oneof(
    // All popups closed
    fc.constant(getDefaultPopupState()),
    // One popup open
    popupTypeGenerator().map(popupType => openPopup(getDefaultPopupState(), popupType))
  );

/**
 * Generator for popup state with at least one popup open
 */
const openPopupStateGenerator = (): fc.Arbitrary<PopupState> =>
  popupTypeGenerator().map(popupType => openPopup(getDefaultPopupState(), popupType));

/**
 * Generator for navigation direction
 */
const navigationDirectionGenerator = (): fc.Arbitrary<NavigationDirection> =>
  fc.constantFrom('forward', 'backward');

/**
 * Generator for focusable element
 */
const focusableElementGenerator = (index: number): fc.Arbitrary<FocusableElement> =>
  fc.record({
    id: fc.constant(`element-${index}`),
    tabIndex: fc.constant(index),
    type: fc.constantFrom('input', 'button', 'menu-item') as fc.Arbitrary<
      'input' | 'button' | 'menu-item'
    >,
    isDisabled: fc.boolean(),
  });

/**
 * Generator for array of focusable elements
 */
const focusableElementsGenerator = (): fc.Arbitrary<FocusableElement[]> =>
  fc
    .integer({ min: 2, max: 10 })
    .chain(count =>
      fc.tuple(...Array.from({ length: count }, (_, i) => focusableElementGenerator(i)))
    );

/**
 * Generator for focus state with at least one enabled element
 */
const focusStateGenerator = (): fc.Arbitrary<FocusState> =>
  focusableElementsGenerator()
    .filter(elements => elements.some(e => !e.isDisabled))
    .chain(elements => {
      const enabledIndices = elements
        .map((e, i) => ({ element: e, index: i }))
        .filter(({ element }) => !element.isDisabled)
        .map(({ index }) => index);

      return fc.constantFrom(...enabledIndices).map(currentFocusIndex => ({
        currentFocusIndex,
        focusableElements: elements,
      }));
    });

/**
 * Generator for a sequence of popup operations
 */
const popupOperationSequenceGenerator = (): fc.Arbitrary<PopupType[]> =>
  fc.array(popupTypeGenerator(), { minLength: 1, maxLength: 10 });

// ==================== Property Tests ====================

describe('Keyboard Navigation Property Tests', () => {
  /**
   * **Feature: message-composer-bugfixes, Property 3: Tab Navigation Order**
   *
   * *For any* focusable element in the composer, pressing Tab should move focus
   * to the next element in logical order, and Shift+Tab should move to the previous element.
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  describe('Property 3: Tab Navigation Order', () => {
    /**
     * Test: Tab moves focus to next enabled element
     *
     * **Validates: Requirements 2.1**
     *
     * WHEN the user presses Tab
     * THEN the focus SHALL move to the next focusable element in logical order
     */
    it('should move focus to next enabled element when Tab is pressed', () => {
      fc.assert(
        fc.property(focusStateGenerator(), focusState => {
          const newState = handleTabNavigation(focusState, 'forward');
          const newElement = focusState.focusableElements[newState.currentFocusIndex];

          // New focused element should not be disabled
          expect(newElement.isDisabled).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Shift+Tab moves focus to previous enabled element
     *
     * **Validates: Requirements 2.2**
     *
     * WHEN the user presses Shift+Tab
     * THEN the focus SHALL move to the previous focusable element
     */
    it('should move focus to previous enabled element when Shift+Tab is pressed', () => {
      fc.assert(
        fc.property(focusStateGenerator(), focusState => {
          const newState = handleTabNavigation(focusState, 'backward');
          const newElement = focusState.focusableElements[newState.currentFocusIndex];

          // New focused element should not be disabled
          expect(newElement.isDisabled).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Tab navigation wraps around at the end
     *
     * **Validates: Requirements 2.1**
     *
     * WHEN focus is on the last element and Tab is pressed
     * THEN focus SHALL wrap to the first enabled element
     */
    it('should wrap focus to first element when Tab is pressed at end', () => {
      fc.assert(
        fc.property(fc.integer({ min: 3, max: 8 }), elementCount => {
          // Create elements where all are enabled
          const elements: FocusableElement[] = Array.from({ length: elementCount }, (_, i) =>
            createFocusableElement(`element-${i}`, i, 'button', false)
          );

          // Start at last element
          const focusState: FocusState = {
            currentFocusIndex: elementCount - 1,
            focusableElements: elements,
          };

          const newState = handleTabNavigation(focusState, 'forward');

          // Should wrap to first element
          expect(newState.currentFocusIndex).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Shift+Tab navigation wraps around at the beginning
     *
     * **Validates: Requirements 2.2**
     *
     * WHEN focus is on the first element and Shift+Tab is pressed
     * THEN focus SHALL wrap to the last enabled element
     */
    it('should wrap focus to last element when Shift+Tab is pressed at beginning', () => {
      fc.assert(
        fc.property(fc.integer({ min: 3, max: 8 }), elementCount => {
          // Create elements where all are enabled
          const elements: FocusableElement[] = Array.from({ length: elementCount }, (_, i) =>
            createFocusableElement(`element-${i}`, i, 'button', false)
          );

          // Start at first element
          const focusState: FocusState = {
            currentFocusIndex: 0,
            focusableElements: elements,
          };

          const newState = handleTabNavigation(focusState, 'backward');

          // Should wrap to last element
          expect(newState.currentFocusIndex).toBe(elementCount - 1);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Tab skips disabled elements
     *
     * **Validates: Requirements 2.1**
     *
     * WHEN Tab is pressed and next element is disabled
     * THEN focus SHALL skip to the next enabled element
     */
    it('should skip disabled elements when navigating forward', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 8 }),
          fc.integer({ min: 1, max: 3 }),
          (elementCount, disabledCount) => {
            // Create elements with some disabled in the middle
            const elements: FocusableElement[] = Array.from({ length: elementCount }, (_, i) =>
              createFocusableElement(
                `element-${i}`,
                i,
                'button',
                // Disable elements 1 through disabledCount (keep first and last enabled)
                i > 0 && i <= disabledCount && i < elementCount - 1
              )
            );

            // Start at first element
            const focusState: FocusState = {
              currentFocusIndex: 0,
              focusableElements: elements,
            };

            const newState = handleTabNavigation(focusState, 'forward');
            const newElement = elements[newState.currentFocusIndex];

            // Should skip to an enabled element
            expect(newElement.isDisabled).toBe(false);
            // Should not be the same element (since there are other enabled elements)
            expect(newState.currentFocusIndex).not.toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Shift+Tab skips disabled elements
     *
     * **Validates: Requirements 2.2**
     *
     * WHEN Shift+Tab is pressed and previous element is disabled
     * THEN focus SHALL skip to the previous enabled element
     */
    it('should skip disabled elements when navigating backward', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 8 }),
          fc.integer({ min: 1, max: 3 }),
          (elementCount, disabledCount) => {
            // Create elements with some disabled in the middle
            const elements: FocusableElement[] = Array.from({ length: elementCount }, (_, i) =>
              createFocusableElement(
                `element-${i}`,
                i,
                'button',
                // Disable elements from (elementCount - 1 - disabledCount) to (elementCount - 2)
                i >= elementCount - 1 - disabledCount && i < elementCount - 1
              )
            );

            // Start at last element
            const focusState: FocusState = {
              currentFocusIndex: elementCount - 1,
              focusableElements: elements,
            };

            const newState = handleTabNavigation(focusState, 'backward');
            const newElement = elements[newState.currentFocusIndex];

            // Should skip to an enabled element
            expect(newElement.isDisabled).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Tab and Shift+Tab are inverse operations
     *
     * **Validates: Requirements 2.1, 2.2**
     *
     * WHEN Tab is pressed followed by Shift+Tab (with all elements enabled)
     * THEN focus SHALL return to the original element
     */
    it('should return to original element after Tab then Shift+Tab', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }),
          fc.integer({ min: 0, max: 7 }),
          (elementCount, startIndex) => {
            // Ensure startIndex is within bounds
            const validStartIndex = startIndex % elementCount;

            // Create elements where all are enabled
            const elements: FocusableElement[] = Array.from({ length: elementCount }, (_, i) =>
              createFocusableElement(`element-${i}`, i, 'button', false)
            );

            const initialState: FocusState = {
              currentFocusIndex: validStartIndex,
              focusableElements: elements,
            };

            // Tab forward then backward
            const afterTab = handleTabNavigation(initialState, 'forward');
            const afterShiftTab = handleTabNavigation(afterTab, 'backward');

            // Should return to original position
            expect(afterShiftTab.currentFocusIndex).toBe(validStartIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Navigation is deterministic
     *
     * **Validates: Requirements 2.1, 2.2**
     *
     * WHEN the same navigation sequence is applied multiple times
     * THEN the result SHALL be identical each time
     */
    it('should produce deterministic results for same navigation sequence', () => {
      fc.assert(
        fc.property(
          focusStateGenerator(),
          fc.array(navigationDirectionGenerator(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 2, max: 5 }),
          (initialState, directions, repeatCount) => {
            const results: number[] = [];

            for (let i = 0; i < repeatCount; i++) {
              let state = initialState;
              for (const direction of directions) {
                state = handleTabNavigation(state, direction);
              }
              results.push(state.currentFocusIndex);
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toBe(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Default composer has correct tab order
     *
     * **Validates: Requirements 2.1, 2.2**
     *
     * WHEN navigating through default composer elements
     * THEN focus SHALL follow the logical order: input -> attachment -> emoji -> voice -> sticker -> send
     */
    it('should follow logical tab order in default composer', () => {
      const elements = getDefaultFocusableElements();
      const initialState: FocusState = {
        currentFocusIndex: 0,
        focusableElements: elements,
      };

      // Navigate through all elements
      let state = initialState;
      const visitedIds: string[] = [elements[state.currentFocusIndex].id];

      for (let i = 0; i < elements.length - 1; i++) {
        state = handleTabNavigation(state, 'forward');
        visitedIds.push(elements[state.currentFocusIndex].id);
      }

      // Should visit elements in order
      expect(visitedIds).toEqual([
        'text-input',
        'attachment-button',
        'emoji-button',
        'voice-button',
        'sticker-button',
        'send-button',
      ]);
    });
  });

  /**
   * **Feature: message-composer-bugfixes, Property 4: Escape Closes All Popups**
   *
   * *For any* open popup (emoji keyboard, attachment menu, mention suggestions, stickers keyboard),
   * pressing Escape should close it and return focus to the editor.
   *
   * **Validates: Requirements 2.6**
   */
  describe('Property 4: Escape Closes All Popups', () => {
    /**
     * Test: Escape closes any single open popup
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN a popup is open and Escape is pressed
     * THEN the popup SHALL close
     */
    it('should close any open popup when Escape is pressed', () => {
      fc.assert(
        fc.property(openPopupStateGenerator(), popupState => {
          // Verify at least one popup is open
          expect(isAnyPopupOpen(popupState)).toBe(true);

          // Press Escape
          const newState = handleEscapeKey(popupState);

          // All popups should be closed
          expect(isAnyPopupOpen(newState)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Escape closes emoji keyboard
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN the emoji keyboard is open and Escape is pressed
     * THEN the emoji keyboard SHALL close
     */
    it('should close emoji keyboard when Escape is pressed', () => {
      fc.assert(
        fc.property(fc.constant('emoji' as PopupType), popupType => {
          const openState = openPopup(getDefaultPopupState(), popupType);
          expect(openState.isEmojiKeyboardOpen).toBe(true);

          const closedState = handleEscapeKey(openState);
          expect(closedState.isEmojiKeyboardOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Escape closes attachment menu
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN the attachment menu is open and Escape is pressed
     * THEN the attachment menu SHALL close
     */
    it('should close attachment menu when Escape is pressed', () => {
      fc.assert(
        fc.property(fc.constant('attachment' as PopupType), popupType => {
          const openState = openPopup(getDefaultPopupState(), popupType);
          expect(openState.isAttachmentMenuOpen).toBe(true);

          const closedState = handleEscapeKey(openState);
          expect(closedState.isAttachmentMenuOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Escape closes mention suggestions
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN the mention suggestions panel is open and Escape is pressed
     * THEN the mention suggestions panel SHALL close
     */
    it('should close mention suggestions when Escape is pressed', () => {
      fc.assert(
        fc.property(fc.constant('mention' as PopupType), popupType => {
          const openState = openPopup(getDefaultPopupState(), popupType);
          expect(openState.isMentionSuggestionsOpen).toBe(true);

          const closedState = handleEscapeKey(openState);
          expect(closedState.isMentionSuggestionsOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Escape closes stickers keyboard
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN the stickers keyboard is open and Escape is pressed
     * THEN the stickers keyboard SHALL close
     */
    it('should close stickers keyboard when Escape is pressed', () => {
      fc.assert(
        fc.property(fc.constant('stickers' as PopupType), popupType => {
          const openState = openPopup(getDefaultPopupState(), popupType);
          expect(openState.isStickersKeyboardOpen).toBe(true);

          const closedState = handleEscapeKey(openState);
          expect(closedState.isStickersKeyboardOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Escape is idempotent when no popup is open
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN no popup is open and Escape is pressed
     * THEN the state SHALL remain unchanged (all popups closed)
     */
    it('should be idempotent when no popup is open', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), pressCount => {
          let state = getDefaultPopupState();

          // Press Escape multiple times
          for (let i = 0; i < pressCount; i++) {
            state = handleEscapeKey(state);
          }

          // State should still have all popups closed
          expect(isAnyPopupOpen(state)).toBe(false);
          expect(state.isEmojiKeyboardOpen).toBe(false);
          expect(state.isAttachmentMenuOpen).toBe(false);
          expect(state.isMentionSuggestionsOpen).toBe(false);
          expect(state.isStickersKeyboardOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Multiple Escape presses keep popups closed
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN a popup is open and Escape is pressed multiple times
     * THEN all popups SHALL remain closed after the first press
     */
    it('should keep popups closed after multiple Escape presses', () => {
      fc.assert(
        fc.property(
          openPopupStateGenerator(),
          fc.integer({ min: 2, max: 10 }),
          (initialState, pressCount) => {
            let state = initialState;

            // Press Escape multiple times
            for (let i = 0; i < pressCount; i++) {
              state = handleEscapeKey(state);
              // After first press, all popups should be closed
              expect(isAnyPopupOpen(state)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Opening a new popup closes the previous one
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN a popup is open and another popup is opened
     * THEN the first popup SHALL close (mutual exclusion)
     */
    it('should close previous popup when opening a new one', () => {
      fc.assert(
        fc.property(popupTypeGenerator(), popupTypeGenerator(), (firstPopup, secondPopup) => {
          // Open first popup
          let state = openPopup(getDefaultPopupState(), firstPopup);
          expect(isPopupOpen(state, firstPopup)).toBe(true);

          // Open second popup
          state = openPopup(state, secondPopup);

          // Only second popup should be open
          expect(isPopupOpen(state, secondPopup)).toBe(true);

          // If different popups, first should be closed
          if (firstPopup !== secondPopup) {
            expect(isPopupOpen(state, firstPopup)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Escape after sequence of popup operations closes all
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN multiple popups are opened in sequence and Escape is pressed
     * THEN all popups SHALL be closed
     */
    it('should close all popups after any sequence of popup operations', () => {
      fc.assert(
        fc.property(popupOperationSequenceGenerator(), operations => {
          // Apply all popup operations
          let state = getDefaultPopupState();
          for (const popupType of operations) {
            state = openPopup(state, popupType);
          }

          // Press Escape
          state = handleEscapeKey(state);

          // All popups should be closed
          expect(isAnyPopupOpen(state)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Only one popup can be open at a time
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN any popup is opened
     * THEN at most one popup SHALL be open at any time
     */
    it('should have at most one popup open at any time', () => {
      fc.assert(
        fc.property(popupStateGenerator(), state => {
          // Count open popups
          const openCount = [
            state.isEmojiKeyboardOpen,
            state.isAttachmentMenuOpen,
            state.isMentionSuggestionsOpen,
            state.isStickersKeyboardOpen,
          ].filter(Boolean).length;

          // At most one popup should be open
          expect(openCount).toBeLessThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Escape returns state to default
     *
     * **Validates: Requirements 2.6**
     *
     * WHEN Escape is pressed on any popup state
     * THEN the state SHALL equal the default popup state
     */
    it('should return to default state after Escape', () => {
      fc.assert(
        fc.property(popupStateGenerator(), state => {
          const afterEscape = handleEscapeKey(state);
          const defaultState = getDefaultPopupState();

          // Should equal default state
          expect(afterEscape.isEmojiKeyboardOpen).toBe(defaultState.isEmojiKeyboardOpen);
          expect(afterEscape.isAttachmentMenuOpen).toBe(defaultState.isAttachmentMenuOpen);
          expect(afterEscape.isMentionSuggestionsOpen).toBe(defaultState.isMentionSuggestionsOpen);
          expect(afterEscape.isStickersKeyboardOpen).toBe(defaultState.isStickersKeyboardOpen);
        }),
        { numRuns: 100 }
      );
    });
  });
});
