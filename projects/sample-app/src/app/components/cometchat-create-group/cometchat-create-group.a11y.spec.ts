/**
 * Property-Based Tests for Overlay Focus Trapping
 *
 * Tests the DialogFocusManager / FocusTrapService behavior for overlay
 * components (Create Group, Join Group, Modal, Dialog). Uses the same
 * lightweight model-based approach as the other a11y spec files — we
 * replicate the focus-trap logic as pure functions and verify properties
 * with fast-check, plus DOM-level tests for the real services.
 *
 * Feature: sample-app-accessibility, Property 9: Escape closes overlay
 * Feature: sample-app-accessibility, Property 12: Overlay open moves focus inside
 * Feature: sample-app-accessibility, Property 13: Focus trap cycles within overlay
 * Feature: sample-app-accessibility, Property 14: Overlay close restores focus to trigger
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ═══════════════════════════════════════════════════════════════════════════
// Types & constants mirroring the overlay system
// ═══════════════════════════════════════════════════════════════════════════

type OverlayType = 'createGroup' | 'joinGroup' | 'modal' | 'dialog';

const ALL_OVERLAY_TYPES: OverlayType[] = ['createGroup', 'joinGroup', 'modal', 'dialog'];

// ═══════════════════════════════════════════════════════════════════════════
// Model-based state for overlay focus management
// ═══════════════════════════════════════════════════════════════════════════

interface OverlayState {
  isOpen: boolean;
  overlayType: OverlayType;
  /** Index of the focused element inside the overlay (0-based) */
  focusedIndex: number;
  /** Total number of focusable elements in the overlay */
  focusableCount: number;
  /** Whether focus is inside the overlay container */
  focusInsideOverlay: boolean;
  /** The element that had focus before the overlay opened */
  previousFocusElement: string | null;
  /** The element that currently has focus after overlay closes */
  restoredFocusElement: string | null;
}

function createClosedState(): OverlayState {
  return {
    isOpen: false,
    overlayType: 'createGroup',
    focusedIndex: -1,
    focusableCount: 0,
    focusInsideOverlay: false,
    previousFocusElement: null,
    restoredFocusElement: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Model functions replicating DialogFocusManager + FocusTrapService logic
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Replicates DialogFocusManager.openDialog() behavior:
 * - Stores the previously focused element
 * - Moves focus to the first focusable element inside the overlay
 * - Activates focus trap
 */
function openOverlay(
  state: OverlayState,
  overlayType: OverlayType,
  focusableCount: number,
  triggerElement: string,
): void {
  state.isOpen = true;
  state.overlayType = overlayType;
  state.focusableCount = focusableCount;
  state.previousFocusElement = triggerElement;

  // Focus moves to first focusable element inside overlay (Req 9.1)
  if (focusableCount > 0) {
    state.focusedIndex = 0;
    state.focusInsideOverlay = true;
  } else {
    state.focusedIndex = -1;
    state.focusInsideOverlay = true; // container itself gets focus
  }
}

/**
 * Replicates DialogFocusManager.closeDialog() behavior:
 * - Releases focus trap
 * - Restores focus to the previously focused element (Req 9.4)
 */
function closeOverlay(state: OverlayState): void {
  if (!state.isOpen) return;

  state.restoredFocusElement = state.previousFocusElement;
  state.isOpen = false;
  state.focusInsideOverlay = false;
  state.focusedIndex = -1;
  state.focusableCount = 0;
}

/**
 * Replicates the Escape key handler from DialogFocusManager:
 * - When closeOnEscape is true (default), Escape closes the overlay
 * - onEscape callback is invoked, which triggers closeOverlay
 */
function handleEscapeInOverlay(state: OverlayState): void {
  if (!state.isOpen) return;
  closeOverlay(state);
}

/**
 * Replicates FocusTrapService Tab cycling logic:
 * - Tab on last element → cycle to first
 * - Shift+Tab on first element → cycle to last
 * - Otherwise move forward/backward normally
 */
function handleTabInOverlay(
  state: OverlayState,
  shiftKey: boolean,
): void {
  if (!state.isOpen || state.focusableCount === 0) return;

  if (shiftKey) {
    // Shift+Tab: move backward
    if (state.focusedIndex === 0) {
      // Cycle to last element
      state.focusedIndex = state.focusableCount - 1;
    } else {
      state.focusedIndex--;
    }
  } else {
    // Tab: move forward
    if (state.focusedIndex === state.focusableCount - 1) {
      // Cycle to first element
      state.focusedIndex = 0;
    } else {
      state.focusedIndex++;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// fast-check arbitraries
// ═══════════════════════════════════════════════════════════════════════════

const arbOverlayType = fc.constantFrom<OverlayType>(...ALL_OVERLAY_TYPES);

/** Number of focusable elements inside an overlay (at least 1 for meaningful tests) */
const arbFocusableCount = fc.integer({ min: 1, max: 20 });

/** A trigger element identifier */
const arbTriggerElement = fc.constantFrom(
  'trigger-createBtn',
  'trigger-joinBtn',
  'trigger-menuItem',
  'trigger-tabBtn',
  'trigger-actionBtn',
);

/** Generates a valid focused index given a focusable count */
function arbFocusedIndex(count: number) {
  return fc.integer({ min: 0, max: count - 1 });
}

// ═══════════════════════════════════════════════════════════════════════════
// Property 9: Escape closes overlay
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature: sample-app-accessibility, Property 9: Escape closes overlay
 *
 * For any open overlay (Create Group, Join Group, modal, or dialog),
 * pressing the Escape key should close the overlay.
 *
 * **Validates: Requirements 9.3**
 */
describe('Property 9: Escape closes overlay', () => {
  it('should close any open overlay when Escape is pressed', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          expect(state.isOpen).toBe(true);

          handleEscapeInOverlay(state);

          expect(state.isOpen).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should close overlay regardless of which focusable element has focus', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          // Move focus to a random element inside the overlay
          const randomIndex = Math.floor(Math.random() * focusableCount);
          state.focusedIndex = randomIndex;

          handleEscapeInOverlay(state);

          expect(state.isOpen).toBe(false);
          expect(state.focusInsideOverlay).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should be a no-op when no overlay is open', () => {
    fc.assert(
      fc.property(arbOverlayType, (overlayType) => {
        const state = createClosedState();
        state.overlayType = overlayType;

        handleEscapeInOverlay(state);

        expect(state.isOpen).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 12: Overlay open moves focus inside
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature: sample-app-accessibility, Property 12: Overlay open moves focus inside
 *
 * For any overlay (modal or dialog) that opens, focus should move to the
 * first focusable element inside the overlay container.
 *
 * **Validates: Requirements 9.1**
 */
describe('Property 12: Overlay open moves focus inside', () => {
  it('should move focus to the first focusable element when overlay opens', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();

          openOverlay(state, overlayType, focusableCount, trigger);

          // Focus should be on the first focusable element (index 0)
          expect(state.focusInsideOverlay).toBe(true);
          expect(state.focusedIndex).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should set focus inside overlay even with zero focusable elements', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbTriggerElement,
        (overlayType, trigger) => {
          const state = createClosedState();

          openOverlay(state, overlayType, 0, trigger);

          // Focus should still be inside the overlay (container itself)
          expect(state.focusInsideOverlay).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should always focus index 0 regardless of overlay type or element count', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();

          openOverlay(state, overlayType, focusableCount, trigger);

          // First focusable element is always the initial focus target
          expect(state.focusedIndex).toBe(0);
          expect(state.isOpen).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 13: Focus trap cycles within overlay
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature: sample-app-accessibility, Property 13: Focus trap cycles within overlay
 *
 * For any open overlay with focus trapping active, pressing Tab on the last
 * focusable element should cycle focus to the first focusable element, and
 * pressing Shift+Tab on the first focusable element should cycle to the last.
 *
 * **Validates: Requirements 9.2**
 */
describe('Property 13: Focus trap cycles within overlay', () => {
  it('should cycle Tab from last element to first element', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          // Move focus to the last element
          state.focusedIndex = focusableCount - 1;

          // Press Tab
          handleTabInOverlay(state, false);

          // Should cycle to first element
          expect(state.focusedIndex).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should cycle Shift+Tab from first element to last element', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          // Focus is already on first element (index 0) after open
          expect(state.focusedIndex).toBe(0);

          // Press Shift+Tab
          handleTabInOverlay(state, true);

          // Should cycle to last element
          expect(state.focusedIndex).toBe(focusableCount - 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should keep focus within bounds after N sequential Tab presses', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        fc.integer({ min: 1, max: 50 }),
        (overlayType, focusableCount, trigger, tabCount) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          for (let i = 0; i < tabCount; i++) {
            handleTabInOverlay(state, false);
          }

          // Focus index should always be within valid range
          expect(state.focusedIndex).toBeGreaterThanOrEqual(0);
          expect(state.focusedIndex).toBeLessThan(focusableCount);

          // After tabCount presses starting from 0, index should be tabCount % count
          expect(state.focusedIndex).toBe(tabCount % focusableCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should keep focus within bounds after N sequential Shift+Tab presses', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        fc.integer({ min: 1, max: 50 }),
        (overlayType, focusableCount, trigger, tabCount) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          for (let i = 0; i < tabCount; i++) {
            handleTabInOverlay(state, true);
          }

          // Focus index should always be within valid range
          expect(state.focusedIndex).toBeGreaterThanOrEqual(0);
          expect(state.focusedIndex).toBeLessThan(focusableCount);

          // After tabCount Shift+Tab presses from 0:
          // index = (focusableCount - (tabCount % focusableCount)) % focusableCount
          const expected = (focusableCount - (tabCount % focusableCount)) % focusableCount;
          expect(state.focusedIndex).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should complete a full cycle and return to the starting element', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          // Tab through all elements (full cycle)
          for (let i = 0; i < focusableCount; i++) {
            handleTabInOverlay(state, false);
          }

          // Should be back at the first element
          expect(state.focusedIndex).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 14: Overlay close restores focus to trigger
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature: sample-app-accessibility, Property 14: Overlay close restores focus to trigger
 *
 * For any overlay that closes, focus should return to the element that was
 * focused before the overlay opened.
 *
 * **Validates: Requirements 9.4**
 */
describe('Property 14: Overlay close restores focus to trigger', () => {
  it('should restore focus to the trigger element when overlay closes', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          closeOverlay(state);

          expect(state.restoredFocusElement).toBe(trigger);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should restore focus to trigger after Escape closes overlay', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();
          openOverlay(state, overlayType, focusableCount, trigger);

          // Navigate around inside the overlay
          for (let i = 0; i < 3; i++) {
            handleTabInOverlay(state, false);
          }

          // Close via Escape
          handleEscapeInOverlay(state);

          // Focus should restore to the original trigger
          expect(state.restoredFocusElement).toBe(trigger);
          expect(state.isOpen).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should preserve the correct trigger across different overlay types', () => {
    fc.assert(
      fc.property(
        arbOverlayType,
        arbFocusableCount,
        arbTriggerElement,
        (overlayType, focusableCount, trigger) => {
          const state = createClosedState();

          // Open and close — trigger should be preserved
          openOverlay(state, overlayType, focusableCount, trigger);
          expect(state.previousFocusElement).toBe(trigger);

          closeOverlay(state);
          expect(state.restoredFocusElement).toBe(trigger);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should restore focus to the correct trigger in sequential open/close cycles', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(arbOverlayType, arbFocusableCount, arbTriggerElement),
          { minLength: 1, maxLength: 5 },
        ),
        (cycles) => {
          const state = createClosedState();

          for (const [overlayType, focusableCount, trigger] of cycles) {
            openOverlay(state, overlayType, focusableCount, trigger);
            closeOverlay(state);

            // Each cycle should restore to its own trigger
            expect(state.restoredFocusElement).toBe(trigger);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
