/**
 * Property-Based Tests for CometChatConversationSummaryComponent
 *
 * **Feature: ai-features**
 *
 * Tests the Conversation Summary panel component's core behavior
 * of displaying summary text for valid responses.
 *
 * Properties tested:
 * - Property 1: Summary text display for valid responses
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CometChatConversationSummaryComponent } from '../cometchat-conversation-summary.component';
import { States } from '../../../../Enums/Enums';

// ==================== Generators ====================

/**
 * Generates arbitrary non-empty strings (after trimming) to simulate
 * valid summary responses from the SDK.
 *
 * The component checks `summary && summary.trim().length > 0`, so we
 * ensure generated strings have at least one non-whitespace character.
 */
const nonEmptySummaryString = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

// ==================== Tests ====================

describe('Feature: ai-features, Property 1: Summary text display for valid responses', () => {
  /**
   * **Validates: Requirements 1.3**
   *
   * For any valid non-empty summary string returned by the
   * `getConversationSummary` callback, the component transitions to
   * `loaded` state and `summaryText` contains exactly that string.
   */
  it('should set state to loaded and summaryText to the returned string for any non-empty summary', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptySummaryString, async summary => {
        const component = new CometChatConversationSummaryComponent();

        component.getConversationSummary = () => Promise.resolve(summary);

        // Trigger the fetch lifecycle
        component.ngOnInit();

        // Allow the async fetchSummary to resolve
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(component.state()).toBe(States.loaded);
        expect(component.summaryText()).toBe(summary);
      }),
      { numRuns: 100 }
    );
  });
});
