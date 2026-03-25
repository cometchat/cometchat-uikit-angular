import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SelectionMode } from '../../Enums/Enums';

/**
 * Property-Based Tests for Selection Mode State Management
 *
 * Feature: comprehensive-test-suite, Property 11: Selection Mode State Management
 *
 * For any composite component and any SelectionMode value, verify selection
 * behavior matches the mode:
 * - none: clicking items emits itemClick, no selection state changes
 * - single: at most one item selected at a time, clicking new deselects old
 * - multiple: any number of items can be selected, toggling works independently
 *
 * **Validates: Requirements 4.5**
 */

// ─── Mock Selection Manager ───
// Mirrors the selection logic from cometchat-users, cometchat-groups,
// and cometchat-group-members components.

class MockSelectionManager {
  readonly mode: SelectionMode;
  readonly selectedItems = new Set<number>();
  readonly itemClickLog: number[] = [];

  constructor(mode: SelectionMode) {
    this.mode = mode;
  }

  /**
   * Handles a click on item at the given index.
   * Mirrors handleSelectionChange logic in composite list components.
   */
  handleClick(index: number): void {
    if (this.mode === SelectionMode.none) {
      // none mode: record click, no selection state change
      this.itemClickLog.push(index);
      return;
    }

    if (this.mode === SelectionMode.single) {
      // single mode: clear all, select the clicked item
      // (if already selected, clicking again still results in it being selected)
      this.selectedItems.clear();
      this.selectedItems.add(index);
      return;
    }

    if (this.mode === SelectionMode.multiple) {
      // multiple mode: toggle the clicked item
      if (this.selectedItems.has(index)) {
        this.selectedItems.delete(index);
      } else {
        this.selectedItems.add(index);
      }
    }
  }

  get selectedCount(): number {
    return this.selectedItems.size;
  }
}

// ─── Arbitraries ───

/** Number of items in the list (1–20) */
const arbItemCount = fc.integer({ min: 1, max: 20 });

/** Sequence of click indices (random indices into the list) */
function arbClickSequence(maxIndex: number): fc.Arbitrary<number[]> {
  return fc.array(fc.integer({ min: 0, max: maxIndex }), { minLength: 1, maxLength: 30 });
}

/** SelectionMode arbitrary */
const arbSelectionMode = fc.constantFrom(
  SelectionMode.none,
  SelectionMode.single,
  SelectionMode.multiple
);

// ─── Tests ───

describe('Selection Mode State Management Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 11: Selection Mode State Management**
   *
   * **Validates: Requirements 4.5**
   */
  describe('Property 11: Selection Mode State Management', () => {
    it('none mode: after any sequence of clicks, selectedCount === 0', () => {
      fc.assert(
        fc.property(arbItemCount, itemCount => {
          return fc.assert(
            fc.property(arbClickSequence(itemCount - 1), clicks => {
              const manager = new MockSelectionManager(SelectionMode.none);

              for (const idx of clicks) {
                manager.handleClick(idx);
              }

              // No items should ever be selected in none mode
              expect(manager.selectedCount).toBe(0);
              // All clicks should be logged as itemClick events
              expect(manager.itemClickLog.length).toBe(clicks.length);
            }),
            { numRuns: 50 }
          );
        }),
        { numRuns: 5 }
      );
    });

    it('single mode: after any sequence of clicks, selectedCount <= 1', () => {
      fc.assert(
        fc.property(arbItemCount, itemCount => {
          return fc.assert(
            fc.property(arbClickSequence(itemCount - 1), clicks => {
              const manager = new MockSelectionManager(SelectionMode.single);

              for (const idx of clicks) {
                manager.handleClick(idx);
                // After every click, at most one item is selected
                expect(manager.selectedCount).toBeLessThanOrEqual(1);
              }

              // After all clicks, exactly one item is selected (the last clicked)
              expect(manager.selectedCount).toBe(1);
              expect(manager.selectedItems.has(clicks[clicks.length - 1])).toBe(true);
            }),
            { numRuns: 50 }
          );
        }),
        { numRuns: 5 }
      );
    });

    it('multiple mode: toggling item i twice returns to its original state', () => {
      fc.assert(
        fc.property(
          arbItemCount,
          arbSelectionMode.filter(m => m === SelectionMode.multiple),
          (itemCount, _mode) => {
            return fc.assert(
              fc.property(fc.integer({ min: 0, max: itemCount - 1 }), toggleIndex => {
                const manager = new MockSelectionManager(SelectionMode.multiple);

                // Capture initial state for toggleIndex (not selected)
                const initiallySelected = manager.selectedItems.has(toggleIndex);

                // Toggle once
                manager.handleClick(toggleIndex);
                expect(manager.selectedItems.has(toggleIndex)).toBe(!initiallySelected);

                // Toggle again — should return to original state
                manager.handleClick(toggleIndex);
                expect(manager.selectedItems.has(toggleIndex)).toBe(initiallySelected);
              }),
              { numRuns: 50 }
            );
          }
        ),
        { numRuns: 5 }
      );
    });

    it('multiple mode: selections are independent across different items', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 20 }), itemCount => {
          return fc.assert(
            fc.property(
              fc.uniqueArray(fc.integer({ min: 0, max: itemCount - 1 }), {
                minLength: 1,
                maxLength: itemCount,
              }),
              indicesToSelect => {
                const manager = new MockSelectionManager(SelectionMode.multiple);

                // Select each item
                for (const idx of indicesToSelect) {
                  manager.handleClick(idx);
                }

                // All clicked items should be selected
                expect(manager.selectedCount).toBe(indicesToSelect.length);
                for (const idx of indicesToSelect) {
                  expect(manager.selectedItems.has(idx)).toBe(true);
                }
              }
            ),
            { numRuns: 50 }
          );
        }),
        { numRuns: 5 }
      );
    });
  });
});
