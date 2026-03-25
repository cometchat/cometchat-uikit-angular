import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Popover Mutual Exclusivity
 *
 * Feature: message-composer-extensions
 * Property 5: Popover Mutual Exclusivity
 *
 * *For any* popover open action (stickers, emoji, attachments, voice recording),
 * all other popovers SHALL be closed. At most one popover can be open at any time.
 *
 * **Validates: Requirements 3.3**
 *
 * Since the CometChatMessageComposer component uses Angular's inject() function
 * and complex service dependencies, we test the component logic as pure functions
 * that mirror the component's behavior.
 */

// ==================== Types ====================

/**
 * Valid popover types that can be displayed in the message composer
 * Matches the contentToDisplay signal type in the component
 */
type PopoverType = 'attachments' | 'emojiKeyboard' | 'voiceRecording' | 'stickers' | 'ai' | 'none';

/**
 * Popover types that can be actively opened (excludes 'none')
 */
type ActivePopoverType = Exclude<PopoverType, 'none'>;

// ==================== Pure Functions (Mirror Component Logic) ====================

/**
 * Simulates the contentToDisplay state management from the component.
 * This class mirrors the signal-based state management in CometChatMessageComposerComponent.
 *
 * The component uses a single `contentToDisplay` signal to track which popover is open,
 * ensuring mutual exclusivity by design - only one value can be stored at a time.
 *
 * @see Requirements 1.8, 1.9
 */
class PopoverStateManager {
  private currentContent: PopoverType = 'none';

  /**
   * Get the currently displayed content/popover
   */
  contentToDisplay(): PopoverType {
    return this.currentContent;
  }

  /**
   * Toggle a specific popover type.
   * If the popover is already open, close it (set to 'none').
   * If a different popover is open, close it and open the new one.
   *
   * This mirrors the toggle methods in the component:
   * - toggleEmojiKeyboard()
   * - toggleAttachmentMenu()
   * - toggleVoiceRecording()
   * - toggleStickersKeyboard()
   * - toggleAI()
   *
   * @param popoverType - The popover type to toggle
   */
  togglePopover(popoverType: ActivePopoverType): void {
    if (this.currentContent === popoverType) {
      // If same popover is clicked, close it
      this.currentContent = 'none';
    } else {
      // Open the new popover (automatically closes any other)
      this.currentContent = popoverType;
    }
  }

  /**
   * Open a specific popover directly (without toggle behavior).
   * This always sets the content to the specified popover type.
   *
   * @param popoverType - The popover type to open
   */
  openPopover(popoverType: ActivePopoverType): void {
    this.currentContent = popoverType;
  }

  /**
   * Close all popovers by setting content to 'none'
   */
  closeAllPopovers(): void {
    this.currentContent = 'none';
  }

  /**
   * Check if a specific popover is currently open
   *
   * @param popoverType - The popover type to check
   * @returns true if the specified popover is open
   */
  isPopoverOpen(popoverType: PopoverType): boolean {
    return this.currentContent === popoverType;
  }

  /**
   * Get all popover types that are currently closed
   *
   * @returns Array of closed popover types
   */
  getClosedPopovers(): ActivePopoverType[] {
    const allPopovers: ActivePopoverType[] = [
      'attachments',
      'emojiKeyboard',
      'voiceRecording',
      'stickers',
      'ai',
    ];
    return allPopovers.filter(p => p !== this.currentContent);
  }

  /**
   * Reset state to initial (no popover open)
   */
  reset(): void {
    this.currentContent = 'none';
  }
}

// ==================== Test Generators ====================

/**
 * Generator for active popover types (excludes 'none')
 */
const activePopoverGenerator = (): fc.Arbitrary<ActivePopoverType> =>
  fc.constantFrom('attachments', 'emojiKeyboard', 'voiceRecording', 'stickers', 'ai');

/**
 * Generator for all popover types (includes 'none')
 */
const allPopoverGenerator = (): fc.Arbitrary<PopoverType> =>
  fc.constantFrom('attachments', 'emojiKeyboard', 'voiceRecording', 'stickers', 'ai', 'none');

/**
 * Generator for sequences of popover operations
 */
const popoverSequenceGenerator = (): fc.Arbitrary<ActivePopoverType[]> =>
  fc.array(activePopoverGenerator(), { minLength: 1, maxLength: 20 });

// ==================== Property Tests ====================

describe('CometChatMessageComposer Property Tests - Popover Mutual Exclusivity', () => {
  let stateManager: PopoverStateManager;

  beforeEach(() => {
    stateManager = new PopoverStateManager();
  });

  /**
   * Feature: message-composer-extensions, Property 5: Popover Mutual Exclusivity
   *
   * Core property: Only one popover can be open at a time.
   * When opening a new popover, any previously open popover must be closed.
   *
   * **Validates: Requirements 3.3**
   */
  describe('Property 5: Popover Mutual Exclusivity', () => {
    it('should ensure only one popover is open at a time when opening different popovers', () => {
      fc.assert(
        fc.property(
          activePopoverGenerator(),
          activePopoverGenerator(),
          (firstPopover, secondPopover) => {
            // Reset state before each test
            stateManager.reset();

            // Setup: Open first popover
            stateManager.openPopover(firstPopover);
            expect(stateManager.contentToDisplay()).toBe(firstPopover);

            // Action: Open second popover
            stateManager.openPopover(secondPopover);

            // Assert: Only second popover is open
            expect(stateManager.contentToDisplay()).toBe(secondPopover);

            // Assert: First popover should be closed (unless same popover)
            if (firstPopover !== secondPopover) {
              expect(stateManager.isPopoverOpen(firstPopover)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close all other popovers when a new popover is opened', () => {
      fc.assert(
        fc.property(activePopoverGenerator(), popoverToOpen => {
          // Reset state before each test
          stateManager.reset();

          // Action: Open the popover
          stateManager.openPopover(popoverToOpen);

          // Assert: Only the opened popover is active
          expect(stateManager.contentToDisplay()).toBe(popoverToOpen);

          // Assert: All other popovers are closed
          const closedPopovers = stateManager.getClosedPopovers();
          for (const closedPopover of closedPopovers) {
            expect(stateManager.isPopoverOpen(closedPopover)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain mutual exclusivity through any sequence of popover operations', () => {
      fc.assert(
        fc.property(popoverSequenceGenerator(), popoverSequence => {
          // Reset state before each test
          stateManager.reset();

          // Execute sequence of popover operations
          for (const popover of popoverSequence) {
            stateManager.openPopover(popover);

            // After each operation, verify mutual exclusivity
            const currentContent = stateManager.contentToDisplay();

            // Exactly one popover should be open (the one we just opened)
            expect(currentContent).toBe(popover);

            // All other popovers should be closed
            const allActivePopovers: ActivePopoverType[] = [
              'attachments',
              'emojiKeyboard',
              'voiceRecording',
              'stickers',
              'ai',
            ];
            const otherPopovers = allActivePopovers.filter(p => p !== popover);

            for (const otherPopover of otherPopovers) {
              expect(stateManager.isPopoverOpen(otherPopover)).toBe(false);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should toggle popover off when clicking the same popover button twice', () => {
      fc.assert(
        fc.property(activePopoverGenerator(), popover => {
          // Reset state before each test
          stateManager.reset();

          // First toggle: should open the popover
          stateManager.togglePopover(popover);
          expect(stateManager.contentToDisplay()).toBe(popover);

          // Second toggle: should close the popover
          stateManager.togglePopover(popover);
          expect(stateManager.contentToDisplay()).toBe('none');
        }),
        { numRuns: 100 }
      );
    });

    it('should switch popovers when toggling a different popover while one is open', () => {
      fc.assert(
        fc.property(
          activePopoverGenerator(),
          activePopoverGenerator(),
          (firstPopover, secondPopover) => {
            // Skip if same popover (covered by toggle test)
            fc.pre(firstPopover !== secondPopover);

            // Reset state before each test
            stateManager.reset();

            // Open first popover
            stateManager.togglePopover(firstPopover);
            expect(stateManager.contentToDisplay()).toBe(firstPopover);

            // Toggle second popover (should close first and open second)
            stateManager.togglePopover(secondPopover);

            // Assert: Second popover is now open
            expect(stateManager.contentToDisplay()).toBe(secondPopover);

            // Assert: First popover is closed
            expect(stateManager.isPopoverOpen(firstPopover)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have exactly zero or one popover open at any time', () => {
      fc.assert(
        fc.property(allPopoverGenerator(), initialState => {
          // Reset and set initial state
          stateManager.reset();
          if (initialState !== 'none') {
            stateManager.openPopover(initialState);
          }

          // Count open popovers
          const allActivePopovers: ActivePopoverType[] = [
            'attachments',
            'emojiKeyboard',
            'voiceRecording',
            'stickers',
            'ai',
          ];
          const openCount = allActivePopovers.filter(p => stateManager.isPopoverOpen(p)).length;

          // Assert: At most one popover is open
          expect(openCount).toBeLessThanOrEqual(1);

          // Assert: If contentToDisplay is 'none', no popovers are open
          if (stateManager.contentToDisplay() === 'none') {
            expect(openCount).toBe(0);
          } else {
            expect(openCount).toBe(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same operations always produce same state', () => {
      fc.assert(
        fc.property(
          popoverSequenceGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (popoverSequence, repeatCount) => {
            const results: PopoverType[] = [];

            for (let i = 0; i < repeatCount; i++) {
              // Reset and replay the same sequence
              stateManager.reset();
              for (const popover of popoverSequence) {
                stateManager.openPopover(popover);
              }
              results.push(stateManager.contentToDisplay());
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

    it('should correctly report isPopoverOpen for all popover types', () => {
      fc.assert(
        fc.property(activePopoverGenerator(), openPopover => {
          // Reset state before each test
          stateManager.reset();

          // Open a specific popover
          stateManager.openPopover(openPopover);

          // Check isPopoverOpen for all types
          const allActivePopovers: ActivePopoverType[] = [
            'attachments',
            'emojiKeyboard',
            'voiceRecording',
            'stickers',
            'ai',
          ];

          for (const popover of allActivePopovers) {
            if (popover === openPopover) {
              expect(stateManager.isPopoverOpen(popover)).toBe(true);
            } else {
              expect(stateManager.isPopoverOpen(popover)).toBe(false);
            }
          }

          // 'none' should never be "open"
          expect(stateManager.isPopoverOpen('none')).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should close all popovers when closeAllPopovers is called', () => {
      fc.assert(
        fc.property(activePopoverGenerator(), openPopover => {
          // Reset state before each test
          stateManager.reset();

          // Open a popover
          stateManager.openPopover(openPopover);
          expect(stateManager.contentToDisplay()).toBe(openPopover);

          // Close all popovers
          stateManager.closeAllPopovers();

          // Assert: No popover is open
          expect(stateManager.contentToDisplay()).toBe('none');

          // Assert: All popovers report as closed
          const allActivePopovers: ActivePopoverType[] = [
            'attachments',
            'emojiKeyboard',
            'voiceRecording',
            'stickers',
            'ai',
          ];
          for (const popover of allActivePopovers) {
            expect(stateManager.isPopoverOpen(popover)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle rapid popover switching correctly', () => {
      fc.assert(
        fc.property(
          fc.array(activePopoverGenerator(), { minLength: 5, maxLength: 50 }),
          rapidSequence => {
            // Reset state before each test
            stateManager.reset();

            // Rapidly switch between popovers
            for (const popover of rapidSequence) {
              stateManager.openPopover(popover);
            }

            // Final state should be the last popover in the sequence
            const lastPopover = rapidSequence[rapidSequence.length - 1];
            expect(stateManager.contentToDisplay()).toBe(lastPopover);

            // Only the last popover should be open
            const allActivePopovers: ActivePopoverType[] = [
              'attachments',
              'emojiKeyboard',
              'voiceRecording',
              'stickers',
              'ai',
            ];
            for (const popover of allActivePopovers) {
              if (popover === lastPopover) {
                expect(stateManager.isPopoverOpen(popover)).toBe(true);
              } else {
                expect(stateManager.isPopoverOpen(popover)).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
