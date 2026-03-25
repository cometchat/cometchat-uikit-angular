/**
 * Bug Condition Exploration Test
 *
 * Property 1: Bug Condition — Computed signals do not re-evaluate when @Input backing fields change
 *
 * This test explores the bug where `computed()` signals in cometchat-conversations
 * read plain class fields (`this._hideReceipts`, `this.hideReceiptsExplicitlySet`)
 * instead of Angular signals. Because `computed()` can only track reactive `signal()`
 * sources, these computed values evaluate once at initialization and never re-run
 * when `@Input` setters reassign the plain backing fields at runtime.
 *
 * EXPECTED: Test FAILS on unfixed code (this is correct — it proves the bug exists).
 * After the fix converts backing fields to signal(), these tests will PASS.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';

// ============================================
// Bug Condition Exploration Tests
// ============================================
//
// The bug chain:
// 1. Parent component sets @Input (e.g., hideReceipts = true) via setter
// 2. Setter assigns value to plain field: this._hideReceipts = value
// 3. Setter sets plain flag: this.hideReceiptsExplicitlySet = true
// 4. effectiveHideReceipts computed() reads these plain fields
// 5. computed() evaluates once, returns correct initial value
// 6. Parent changes @Input (hideReceipts = false) → setter updates plain fields
// 7. computed() NEVER re-evaluates because plain fields are not reactive
// 8. effectiveHideReceipts() returns STALE initial value
//
// We construct the component via TestBed.runInInjectionContext so inject()
// calls at field level work correctly (COMETCHAT_GLOBAL_CONFIG, services, etc.)
// ============================================

/**
 * Create a CometChatConversationsComponent instance with proper Angular DI context.
 * Uses TestBed.runInInjectionContext so inject() calls at field level work correctly.
 *
 * We do NOT provide COMETCHAT_GLOBAL_CONFIG so the component falls through to
 * tier-3 defaults, isolating the test to the @Input → computed path.
 */
function createComponent(): CometChatConversationsComponent {
  let comp!: CometChatConversationsComponent;
  TestBed.runInInjectionContext(() => {
    comp = new CometChatConversationsComponent();
  });
  return comp;
}

describe('Bug Condition Exploration: Computed signals do not re-evaluate when @Input backing fields change', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      // No COMETCHAT_GLOBAL_CONFIG provider — forces tier-3 defaults
      // so the only way effectiveXxx returns a non-default value is via @Input setter
    });
  });

  // ---------------------------------------------------------------
  // Test Case 1: Boolean field staleness (hideReceipts)
  // ---------------------------------------------------------------
  describe('Test Case 1: Boolean field staleness — hideReceipts', () => {
    it('effectiveHideReceipts() should reflect the latest hideReceipts @Input value after runtime change', () => {
      const comp = createComponent();

      // Step 1: Set hideReceipts = true via setter
      comp.hideReceipts = true;
      expect(comp.effectiveHideReceipts()).toBe(true);

      // Step 2: Change hideReceipts = false at runtime
      comp.hideReceipts = false;

      // EXPECTED (correct behavior): effectiveHideReceipts() returns false
      // BUG (unfixed code): effectiveHideReceipts() returns true (stale)
      expect(comp.effectiveHideReceipts()).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // Test Case 2: String field staleness (customSoundForMessages)
  // ---------------------------------------------------------------
  describe('Test Case 2: String field staleness — customSoundForMessages', () => {
    it('effectiveCustomSoundForMessages() should reflect the latest customSoundForMessages @Input value after runtime change', () => {
      const comp = createComponent();

      // Step 1: Set customSoundForMessages = 'a.mp3'
      comp.customSoundForMessages = 'a.mp3';
      expect(comp.effectiveCustomSoundForMessages()).toBe('a.mp3');

      // Step 2: Change customSoundForMessages = 'b.mp3' at runtime
      comp.customSoundForMessages = 'b.mp3';

      // EXPECTED (correct behavior): returns 'b.mp3'
      // BUG (unfixed code): returns 'a.mp3' (stale)
      expect(comp.effectiveCustomSoundForMessages()).toBe('b.mp3');
    });
  });

  // ---------------------------------------------------------------
  // Property Test: For any sequence of @Input setter calls with
  // arbitrary values, effectiveXxx() always reflects the latest value
  // ---------------------------------------------------------------
  describe('Property: effectiveHideReceipts always reflects latest hideReceipts value', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 1.3**
     *
     * For any pair of distinct boolean values (initial, updated) set via the
     * hideReceipts @Input setter, after reading the computed once (to cache it),
     * then changing the input, effectiveHideReceipts() must return the updated value.
     *
     * On unfixed code, the computed caches the first-read value and never
     * re-evaluates, producing a counterexample where initial !== updated.
     *
     * Key insight: The bug only manifests when the computed is READ, then the
     * backing field changes, then the computed is READ again. A single read
     * after multiple sets will return the current plain field value (correct
     * by accident). The two-read pattern is essential to surface the staleness.
     */
    it('after reading effectiveHideReceipts(), changing hideReceipts, and reading again, the computed reflects the new value', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean().filter((v) => true), // any boolean for second value
          (initial: boolean, updated: boolean) => {
            // Skip when initial === updated (no observable staleness)
            fc.pre(initial !== updated);

            const comp = createComponent();

            // Set initial value and READ the computed (caches it)
            comp.hideReceipts = initial;
            const firstRead = comp.effectiveHideReceipts();
            expect(firstRead).toBe(initial);

            // Change the input at runtime
            comp.hideReceipts = updated;

            // Read again — MUST reflect the updated value
            // BUG: returns `initial` (stale cached value)
            expect(comp.effectiveHideReceipts()).toBe(updated);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: effectiveCustomSoundForMessages always reflects latest customSoundForMessages value', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 1.3**
     *
     * For any pair of distinct string values (initial, updated) set via the
     * customSoundForMessages @Input setter, after reading the computed once,
     * then changing the input, effectiveCustomSoundForMessages() must return
     * the updated value.
     */
    it('after reading effectiveCustomSoundForMessages(), changing customSoundForMessages, and reading again, the computed reflects the new value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (initial: string, updated: string) => {
            fc.pre(initial !== updated);

            const comp = createComponent();

            // Set initial value and READ the computed (caches it)
            comp.customSoundForMessages = initial;
            const firstRead = comp.effectiveCustomSoundForMessages();
            expect(firstRead).toBe(initial);

            // Change the input at runtime
            comp.customSoundForMessages = updated;

            // Read again — MUST reflect the updated value
            // BUG: returns `initial` (stale cached value)
            expect(comp.effectiveCustomSoundForMessages()).toBe(updated);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
