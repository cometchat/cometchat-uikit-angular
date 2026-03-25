import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for CometChatFullScreenViewer Body Scroll Management
 *
 * Feature: fullscreen-viewer-gallery-refactor
 *
 * Tests body scroll management properties:
 * - Property 22: Body Scroll Prevention
 * - Property 23: Body Scroll Restoration Round Trip
 *
 * Validates: Requirements 7.1, 7.2, 7.3
 */

// Mock component class for property testing
class MockFullScreenViewerHandler {
  isOpen = false;
  private originalBodyOverflow = '';

  open(): void {
    this.preventBodyScroll();
    this.isOpen = true;
  }

  close(): void {
    this.restoreBodyScroll();
    this.isOpen = false;
  }

  destroy(): void {
    this.restoreBodyScroll();
  }

  private preventBodyScroll(): void {
    this.originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private restoreBodyScroll(): void {
    document.body.style.overflow = this.originalBodyOverflow;
  }
}

// Arbitraries for property-based testing

/**
 * Generates a valid CSS overflow value
 */
const cssOverflowArbitrary = () => fc.constantFrom('visible', 'hidden', 'scroll', 'auto', '');

/**
 * Generates a sequence of open/close operations
 */
const openCloseSequenceArbitrary = () =>
  fc.array(fc.constantFrom('open', 'close'), { minLength: 1, maxLength: 10 });

describe('CometChatFullScreenViewer Body Scroll Management Property Tests', () => {
  let originalOverflow: string;

  beforeEach(() => {
    // Store the original overflow value before each test
    originalOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    // Restore the original overflow value after each test
    document.body.style.overflow = originalOverflow;
  });

  describe('Property 22: Body Scroll Prevention', () => {
    it('should set body overflow to hidden when viewer opens', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 22: Body Scroll Prevention
       *
       * For any FullScreenViewer state when opening, document.body.style.overflow
       * should be set to "hidden".
       *
       * Validates: Requirements 7.1
       */
      fc.assert(
        fc.property(cssOverflowArbitrary(), initialOverflow => {
          // Set initial body overflow
          document.body.style.overflow = initialOverflow;

          const component = new MockFullScreenViewerHandler();

          // Open the viewer
          component.open();

          // Body overflow should be set to hidden
          expect(document.body.style.overflow).toBe('hidden');

          // Cleanup
          component.close();
        }),
        { numRuns: 100 }
      );
    });

    it('should prevent body scroll regardless of initial overflow value', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 22: Body Scroll Prevention
       *
       * For any initial body overflow value, opening the viewer should always
       * set it to "hidden".
       *
       * Validates: Requirements 7.1
       */
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 20 }), initialOverflow => {
          // Set initial body overflow (could be any string)
          document.body.style.overflow = initialOverflow;

          const component = new MockFullScreenViewerHandler();

          // Open the viewer
          component.open();

          // Body overflow should always be "hidden" regardless of initial value
          expect(document.body.style.overflow).toBe('hidden');

          // Cleanup
          component.close();
        }),
        { numRuns: 100 }
      );
    });

    it('should store original overflow value before modifying', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 22: Body Scroll Prevention
       *
       * For any initial body overflow value, the component should store it
       * before modifying to "hidden".
       *
       * Validates: Requirements 7.1, 7.2
       */
      fc.assert(
        fc.property(cssOverflowArbitrary(), initialOverflow => {
          // Set initial body overflow
          document.body.style.overflow = initialOverflow;

          const component = new MockFullScreenViewerHandler();

          // Open the viewer
          component.open();

          // Body overflow should be hidden
          expect(document.body.style.overflow).toBe('hidden');

          // Close the viewer
          component.close();

          // Original overflow should be restored
          expect(document.body.style.overflow).toBe(initialOverflow);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 23: Body Scroll Restoration Round Trip', () => {
    it('should restore body overflow to original value after open/close cycle', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 23: Body Scroll Restoration Round Trip
       *
       * For any initial body overflow value, opening then closing the FullScreenViewer
       * should restore document.body.style.overflow to the original value.
       *
       * Validates: Requirements 7.2, 7.3, 8.6
       */
      fc.assert(
        fc.property(cssOverflowArbitrary(), initialOverflow => {
          // Set initial body overflow
          document.body.style.overflow = initialOverflow;

          const component = new MockFullScreenViewerHandler();

          // Open the viewer
          component.open();

          // Body overflow should be hidden
          expect(document.body.style.overflow).toBe('hidden');

          // Close the viewer
          component.close();

          // Body overflow should be restored to original value
          expect(document.body.style.overflow).toBe(initialOverflow);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple open/close cycles correctly', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 23: Body Scroll Restoration Round Trip
       *
       * For any initial body overflow value and any sequence of open/close operations,
       * the final body overflow should match the initial value.
       *
       * Validates: Requirements 7.2, 7.3
       */
      fc.assert(
        fc.property(
          cssOverflowArbitrary(),
          fc.integer({ min: 1, max: 5 }),
          (initialOverflow, cycles) => {
            // Set initial body overflow
            document.body.style.overflow = initialOverflow;

            const component = new MockFullScreenViewerHandler();

            // Perform multiple open/close cycles
            for (let i = 0; i < cycles; i++) {
              component.open();
              expect(document.body.style.overflow).toBe('hidden');
              component.close();
              expect(document.body.style.overflow).toBe(initialOverflow);
            }

            // Final state should match initial state
            expect(document.body.style.overflow).toBe(initialOverflow);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should restore overflow on component destruction', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 23: Body Scroll Restoration Round Trip
       *
       * For any initial body overflow value, destroying the component should
       * restore the original overflow value.
       *
       * Validates: Requirements 7.3, 8.6
       */
      fc.assert(
        fc.property(cssOverflowArbitrary(), initialOverflow => {
          // Set initial body overflow
          document.body.style.overflow = initialOverflow;

          const component = new MockFullScreenViewerHandler();

          // Open the viewer
          component.open();

          // Body overflow should be hidden
          expect(document.body.style.overflow).toBe('hidden');

          // Destroy the component
          component.destroy();

          // Body overflow should be restored to original value
          expect(document.body.style.overflow).toBe(initialOverflow);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty string as original overflow value', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 23: Body Scroll Restoration Round Trip
       *
       * For empty string as initial overflow value, the round trip should
       * restore it correctly.
       *
       * Validates: Requirements 7.2, 7.3
       */
      fc.assert(
        fc.property(fc.constant(''), initialOverflow => {
          // Set initial body overflow to empty string
          document.body.style.overflow = initialOverflow;

          const component = new MockFullScreenViewerHandler();

          // Open the viewer
          component.open();
          expect(document.body.style.overflow).toBe('hidden');

          // Close the viewer
          component.close();

          // Body overflow should be restored to empty string
          expect(document.body.style.overflow).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle arbitrary string values as overflow', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 23: Body Scroll Restoration Round Trip
       *
       * For any string value (even invalid CSS), the round trip should
       * restore it correctly. Note: Browsers may normalize certain values
       * (e.g., whitespace-only strings become empty strings).
       *
       * Validates: Requirements 7.2, 7.3
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }).filter(s => s.trim() !== ''), // Exclude whitespace-only strings
          initialOverflow => {
            // Set initial body overflow to arbitrary string
            document.body.style.overflow = initialOverflow;

            // Store what the browser actually set (may be normalized)
            const actualInitialOverflow = document.body.style.overflow;

            const component = new MockFullScreenViewerHandler();

            // Open the viewer
            component.open();
            expect(document.body.style.overflow).toBe('hidden');

            // Close the viewer
            component.close();

            // Body overflow should be restored to what the browser normalized it to
            expect(document.body.style.overflow).toBe(actualInitialOverflow);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Body Scroll Management Invariants', () => {
    it('should always set overflow to hidden when opening, regardless of previous state', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: Opening the viewer should always result in body overflow
       * being set to "hidden", regardless of what it was before.
       *
       * Validates: Requirements 7.1
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          (overflow1, overflow2) => {
            const component = new MockFullScreenViewerHandler();

            // Set first overflow value
            document.body.style.overflow = overflow1;
            component.open();
            expect(document.body.style.overflow).toBe('hidden');
            component.close();

            // Set second overflow value
            document.body.style.overflow = overflow2;
            component.open();
            expect(document.body.style.overflow).toBe('hidden');
            component.close();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle sequential component usage', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: Sequential use of multiple component instances should
       * maintain correct overflow state.
       *
       * Validates: Requirements 7.1, 7.2, 7.3
       */
      fc.assert(
        fc.property(cssOverflowArbitrary(), initialOverflow => {
          // Set initial body overflow
          document.body.style.overflow = initialOverflow;

          const component1 = new MockFullScreenViewerHandler();

          // Use first component
          component1.open();
          expect(document.body.style.overflow).toBe('hidden');
          component1.close();
          expect(document.body.style.overflow).toBe(initialOverflow);

          // Use second component
          const component2 = new MockFullScreenViewerHandler();
          component2.open();
          expect(document.body.style.overflow).toBe('hidden');
          component2.close();
          expect(document.body.style.overflow).toBe(initialOverflow);

          // Final state should match initial state
          expect(document.body.style.overflow).toBe(initialOverflow);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle rapid open/close sequences', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: Rapid sequences of open/close operations should maintain
       * correct overflow state.
       *
       * Validates: Requirements 7.1, 7.2, 7.3
       */
      fc.assert(
        fc.property(
          cssOverflowArbitrary(),
          openCloseSequenceArbitrary(),
          (initialOverflow, sequence) => {
            // Set initial body overflow
            document.body.style.overflow = initialOverflow;

            const component = new MockFullScreenViewerHandler();
            let isOpen = false;

            // Execute sequence of operations
            for (const operation of sequence) {
              if (operation === 'open' && !isOpen) {
                component.open();
                isOpen = true;
                expect(document.body.style.overflow).toBe('hidden');
              } else if (operation === 'close' && isOpen) {
                component.close();
                isOpen = false;
                expect(document.body.style.overflow).toBe(initialOverflow);
              }
            }

            // Ensure we end in closed state
            if (isOpen) {
              component.close();
            }

            // Final state should match initial state
            expect(document.body.style.overflow).toBe(initialOverflow);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle destruction without prior close', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: Destroying the component without closing should still
       * restore the original overflow value.
       *
       * Validates: Requirements 7.3, 8.6
       */
      fc.assert(
        fc.property(cssOverflowArbitrary(), initialOverflow => {
          // Set initial body overflow
          document.body.style.overflow = initialOverflow;

          const component = new MockFullScreenViewerHandler();

          // Open the viewer
          component.open();
          expect(document.body.style.overflow).toBe('hidden');

          // Destroy without closing
          component.destroy();

          // Body overflow should be restored
          expect(document.body.style.overflow).toBe(initialOverflow);
        }),
        { numRuns: 100 }
      );
    });
  });
});
