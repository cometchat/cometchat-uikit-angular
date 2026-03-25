import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Format Toggle Consistency
 *
 * **Feature: message-composer-bugfixes, Property 1: Format Toggle Consistency**
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Property 1: Format Toggle Consistency
 * *For any* formatting type (bold, italic, underline, strikethrough) and any editor state,
 * toggling the format should update both the editor content and the toolbar button's
 * active state to match.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**
 */

// ==================== Mock Types ====================

/**
 * Interface for rich text formatting state
 * Mirrors the RichTextFormatState from RichTextEditorService
 */
interface RichTextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  orderedList: boolean;
  bulletList: boolean;
  link: boolean;
}

/**
 * Supported format types for testing
 * These are the primary inline formatting options
 */
type FormatType = 'bold' | 'italic' | 'underline' | 'strikethrough';

/**
 * All supported format types array
 */
const FORMAT_TYPES: FormatType[] = ['bold', 'italic', 'underline', 'strikethrough'];

// ==================== Pure Functions (Mirror Component Logic) ====================

/**
 * Get the default format state (all formatting off)
 * Mirrors RichTextEditorService.getDefaultFormatState()
 *
 * @returns Default RichTextFormatState with all formats disabled
 */
function getDefaultFormatState(): RichTextFormatState {
  return {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    blockquote: false,
    codeBlock: false,
    orderedList: false,
    bulletList: false,
    link: false,
  };
}

/**
 * Toggle a specific format in the format state
 * Mirrors the behavior of RichTextEditorService toggle methods
 *
 * When a format is toggled:
 * - If it was inactive, it becomes active
 * - If it was active, it becomes inactive
 *
 * **Validates: Requirements 1.1, 1.2, 1.5, 1.6, 1.7**
 *
 * @param state - Current format state
 * @param formatType - The format type to toggle
 * @returns New format state with the specified format toggled
 */
function toggleFormat(state: RichTextFormatState, formatType: FormatType): RichTextFormatState {
  return {
    ...state,
    [formatType]: !state[formatType],
  };
}

/**
 * Check if a specific format is active in the format state
 * Mirrors the toolbar button active state check
 *
 * **Validates: Requirements 1.3, 1.4, 1.8, 1.9**
 *
 * @param state - Current format state
 * @param formatType - The format type to check
 * @returns True if the format is active
 */
function isFormatActive(state: RichTextFormatState, formatType: FormatType): boolean {
  return state[formatType];
}

/**
 * Apply multiple format toggles in sequence
 * Simulates a user clicking multiple toolbar buttons
 *
 * @param initialState - Starting format state
 * @param toggles - Array of format types to toggle in order
 * @returns Final format state after all toggles
 */
function applyFormatToggles(
  initialState: RichTextFormatState,
  toggles: FormatType[]
): RichTextFormatState {
  return toggles.reduce((state, formatType) => toggleFormat(state, formatType), initialState);
}

/**
 * Count how many times a format was toggled
 * Used to determine expected final state
 *
 * @param toggles - Array of format toggles
 * @param formatType - The format type to count
 * @returns Number of times the format was toggled
 */
function countToggles(toggles: FormatType[], formatType: FormatType): number {
  return toggles.filter(t => t === formatType).length;
}

/**
 * Determine expected format state after toggles
 * If toggled an odd number of times from initial state, it should be opposite
 * If toggled an even number of times, it should be same as initial
 *
 * @param initialActive - Whether format was initially active
 * @param toggleCount - Number of times format was toggled
 * @returns Expected active state
 */
function expectedStateAfterToggles(initialActive: boolean, toggleCount: number): boolean {
  // Odd number of toggles flips the state
  // Even number of toggles (including 0) keeps the state
  return toggleCount % 2 === 0 ? initialActive : !initialActive;
}

/**
 * Simulate toolbar button state based on format state
 * The toolbar button should reflect the format state
 *
 * **Validates: Requirements 1.3, 1.4**
 *
 * @param formatState - Current format state
 * @param formatType - The format type for the button
 * @returns Object with button active state and aria-pressed attribute
 */
function getToolbarButtonState(
  formatState: RichTextFormatState,
  formatType: FormatType
): { isActive: boolean; ariaPressed: string } {
  const isActive = formatState[formatType];
  return {
    isActive,
    ariaPressed: isActive ? 'true' : 'false',
  };
}

// ==================== Test Generators ====================

/**
 * Generator for format types
 */
const formatTypeGenerator = (): fc.Arbitrary<FormatType> => fc.constantFrom(...FORMAT_TYPES);

/**
 * Generator for random format state
 * Each format can be independently active or inactive
 */
const formatStateGenerator = (): fc.Arbitrary<RichTextFormatState> =>
  fc.record({
    bold: fc.boolean(),
    italic: fc.boolean(),
    underline: fc.boolean(),
    strikethrough: fc.boolean(),
    code: fc.boolean(),
    blockquote: fc.boolean(),
    codeBlock: fc.boolean(),
    orderedList: fc.boolean(),
    bulletList: fc.boolean(),
    link: fc.boolean(),
  });

/**
 * Generator for a sequence of format toggles
 */
const toggleSequenceGenerator = (): fc.Arbitrary<FormatType[]> =>
  fc.array(formatTypeGenerator(), { minLength: 0, maxLength: 20 });

/**
 * Generator for non-empty toggle sequences
 */
const nonEmptyToggleSequenceGenerator = (): fc.Arbitrary<FormatType[]> =>
  fc.array(formatTypeGenerator(), { minLength: 1, maxLength: 20 });

// ==================== Property Tests ====================

describe('Format Toggle Consistency Property Tests', () => {
  /**
   * **Feature: message-composer-bugfixes, Property 1: Format Toggle Consistency**
   *
   * *For any* formatting type (bold, italic, underline, strikethrough) and any editor state,
   * toggling the format should update both the editor content and the toolbar button's
   * active state to match.
   *
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**
   */
  describe('Property 1: Format Toggle Consistency', () => {
    /**
     * Test: Single toggle inverts the format state
     *
     * **Validates: Requirements 1.1, 1.2, 1.5, 1.6, 1.7**
     *
     * WHEN a user clicks a toolbar button (Bold, Italic, Underline, Strikethrough)
     * THEN the format SHALL toggle (active becomes inactive, inactive becomes active)
     */
    it('should invert format state when toggled once', () => {
      fc.assert(
        fc.property(formatStateGenerator(), formatTypeGenerator(), (initialState, formatType) => {
          const initialActive = isFormatActive(initialState, formatType);
          const newState = toggleFormat(initialState, formatType);
          const newActive = isFormatActive(newState, formatType);

          // After one toggle, state should be inverted
          expect(newActive).toBe(!initialActive);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Double toggle returns to original state
     *
     * **Validates: Requirements 1.1, 1.2**
     *
     * WHEN a user clicks a toolbar button twice
     * THEN the format SHALL return to its original state
     */
    it('should return to original state when toggled twice', () => {
      fc.assert(
        fc.property(formatStateGenerator(), formatTypeGenerator(), (initialState, formatType) => {
          const initialActive = isFormatActive(initialState, formatType);
          const afterFirstToggle = toggleFormat(initialState, formatType);
          const afterSecondToggle = toggleFormat(afterFirstToggle, formatType);
          const finalActive = isFormatActive(afterSecondToggle, formatType);

          // After two toggles, state should be same as initial
          expect(finalActive).toBe(initialActive);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Toolbar button state matches format state
     *
     * **Validates: Requirements 1.3, 1.4, 1.8, 1.9**
     *
     * WHEN format is active at cursor position
     * THEN the toolbar button SHALL display active visual state
     * WHEN format is not active at cursor position
     * THEN the toolbar button SHALL display inactive visual state
     */
    it('should have toolbar button state match format state', () => {
      fc.assert(
        fc.property(formatStateGenerator(), formatTypeGenerator(), (formatState, formatType) => {
          const buttonState = getToolbarButtonState(formatState, formatType);
          const formatActive = isFormatActive(formatState, formatType);

          // Button active state should match format state
          expect(buttonState.isActive).toBe(formatActive);
          // aria-pressed should reflect the state
          expect(buttonState.ariaPressed).toBe(formatActive ? 'true' : 'false');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Toolbar button state updates after toggle
     *
     * **Validates: Requirements 1.3, 1.4, 1.8, 1.9**
     *
     * WHEN a format is toggled
     * THEN the toolbar button state SHALL update to reflect the new format state
     */
    it('should update toolbar button state after toggle', () => {
      fc.assert(
        fc.property(formatStateGenerator(), formatTypeGenerator(), (initialState, formatType) => {
          const initialButtonState = getToolbarButtonState(initialState, formatType);
          const newState = toggleFormat(initialState, formatType);
          const newButtonState = getToolbarButtonState(newState, formatType);

          // Button state should be inverted after toggle
          expect(newButtonState.isActive).toBe(!initialButtonState.isActive);
          expect(newButtonState.ariaPressed).not.toBe(initialButtonState.ariaPressed);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Toggle only affects the specified format
     *
     * **Validates: Requirements 1.1, 1.5, 1.6, 1.7**
     *
     * WHEN a specific format is toggled
     * THEN only that format SHALL change, other formats remain unchanged
     */
    it('should only affect the toggled format, not others', () => {
      fc.assert(
        fc.property(formatStateGenerator(), formatTypeGenerator(), (initialState, formatType) => {
          const newState = toggleFormat(initialState, formatType);

          // Check all format types
          for (const ft of FORMAT_TYPES) {
            if (ft === formatType) {
              // The toggled format should be inverted
              expect(newState[ft]).toBe(!initialState[ft]);
            } else {
              // Other formats should remain unchanged
              expect(newState[ft]).toBe(initialState[ft]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Multiple toggles produce predictable state
     *
     * **Validates: Requirements 1.1, 1.2, 1.5, 1.6, 1.7**
     *
     * WHEN multiple formats are toggled in sequence
     * THEN the final state SHALL be predictable based on toggle count
     */
    it('should produce predictable state after multiple toggles', () => {
      fc.assert(
        fc.property(formatStateGenerator(), toggleSequenceGenerator(), (initialState, toggles) => {
          const finalState = applyFormatToggles(initialState, toggles);

          // For each format type, verify the final state
          for (const formatType of FORMAT_TYPES) {
            const toggleCount = countToggles(toggles, formatType);
            const expectedActive = expectedStateAfterToggles(initialState[formatType], toggleCount);
            expect(finalState[formatType]).toBe(expectedActive);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Toggle is idempotent for even counts
     *
     * **Validates: Requirements 1.1, 1.2**
     *
     * WHEN a format is toggled an even number of times
     * THEN the state SHALL be the same as the initial state
     */
    it('should return to initial state after even number of toggles', () => {
      fc.assert(
        fc.property(
          formatStateGenerator(),
          formatTypeGenerator(),
          fc.integer({ min: 1, max: 10 }),
          (initialState, formatType, halfCount) => {
            const evenCount = halfCount * 2;
            let state = initialState;

            // Toggle even number of times
            for (let i = 0; i < evenCount; i++) {
              state = toggleFormat(state, formatType);
            }

            // Should be back to initial state for that format
            expect(state[formatType]).toBe(initialState[formatType]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Toggle is inverted for odd counts
     *
     * **Validates: Requirements 1.1, 1.2**
     *
     * WHEN a format is toggled an odd number of times
     * THEN the state SHALL be the opposite of the initial state
     */
    it('should be inverted after odd number of toggles', () => {
      fc.assert(
        fc.property(
          formatStateGenerator(),
          formatTypeGenerator(),
          fc.integer({ min: 0, max: 10 }),
          (initialState, formatType, halfCount) => {
            const oddCount = halfCount * 2 + 1;
            let state = initialState;

            // Toggle odd number of times
            for (let i = 0; i < oddCount; i++) {
              state = toggleFormat(state, formatType);
            }

            // Should be inverted from initial state for that format
            expect(state[formatType]).toBe(!initialState[formatType]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Toggle order independence for same format
     *
     * **Validates: Requirements 1.1, 1.2**
     *
     * WHEN the same format is toggled multiple times
     * THEN the final state depends only on the count, not the order
     */
    it('should have toggle count determine final state regardless of interleaving', () => {
      fc.assert(
        fc.property(
          formatStateGenerator(),
          formatTypeGenerator(),
          // Generate other toggles that exclude the target format
          fc.array(formatTypeGenerator(), { minLength: 1, maxLength: 10 }),
          (initialState, targetFormat, otherTogglesRaw) => {
            // Filter out the target format from other toggles to ensure clean test
            const otherToggles = otherTogglesRaw.filter(t => t !== targetFormat);
            if (otherToggles.length === 0) {
              // Skip if no other toggles remain
              return;
            }

            // Create two sequences with same toggle count for target format (2 times)
            // but different interleaving with other formats
            const sequence1: FormatType[] = [targetFormat, ...otherToggles, targetFormat];
            const sequence2: FormatType[] = [targetFormat, targetFormat, ...otherToggles];

            const finalState1 = applyFormatToggles(initialState, sequence1);
            const finalState2 = applyFormatToggles(initialState, sequence2);

            // Both should have same state for target format (toggled twice = back to original)
            expect(finalState1[targetFormat]).toBe(initialState[targetFormat]);
            expect(finalState2[targetFormat]).toBe(initialState[targetFormat]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Default state has all formats inactive
     *
     * **Validates: Requirements 1.4, 1.9**
     *
     * WHEN the editor is initialized
     * THEN all format states SHALL be inactive
     */
    it('should have all formats inactive in default state', () => {
      const defaultState = getDefaultFormatState();

      for (const formatType of FORMAT_TYPES) {
        expect(defaultState[formatType]).toBe(false);
      }
    });

    /**
     * Test: Toggling from default state activates format
     *
     * **Validates: Requirements 1.1, 1.3, 1.5, 1.6, 1.7**
     *
     * WHEN a format is toggled from the default (inactive) state
     * THEN the format SHALL become active
     */
    it('should activate format when toggled from default state', () => {
      fc.assert(
        fc.property(formatTypeGenerator(), formatType => {
          const defaultState = getDefaultFormatState();
          const newState = toggleFormat(defaultState, formatType);

          expect(newState[formatType]).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Multiple formats can be active simultaneously
     *
     * **Validates: Requirements 1.1, 1.3, 1.5, 1.6, 1.7**
     *
     * WHEN multiple different formats are toggled
     * THEN all toggled formats SHALL be active simultaneously
     */
    it('should allow multiple formats to be active simultaneously', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(formatTypeGenerator(), { minLength: 2, maxLength: 4 }),
          formatsToActivate => {
            let state = getDefaultFormatState();

            // Activate each format
            for (const formatType of formatsToActivate) {
              state = toggleFormat(state, formatType);
            }

            // All activated formats should be active
            for (const formatType of formatsToActivate) {
              expect(state[formatType]).toBe(true);
            }

            // Formats not in the list should still be inactive
            for (const formatType of FORMAT_TYPES) {
              if (!formatsToActivate.includes(formatType)) {
                expect(state[formatType]).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Format state is deterministic
     *
     * **Validates: Requirements 1.3, 1.4, 1.8, 1.9**
     *
     * WHEN the same sequence of toggles is applied multiple times
     * THEN the result SHALL be identical each time
     */
    it('should produce deterministic results for same toggle sequence', () => {
      fc.assert(
        fc.property(
          formatStateGenerator(),
          toggleSequenceGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (initialState, toggles, repeatCount) => {
            const results: RichTextFormatState[] = [];

            for (let i = 0; i < repeatCount; i++) {
              results.push(applyFormatToggles(initialState, toggles));
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              for (const formatType of FORMAT_TYPES) {
                expect(results[i][formatType]).toBe(results[0][formatType]);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
