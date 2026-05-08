import * as fc from 'fast-check';

/**
 * Property-based tests for JSON formatting logic used in
 * CometChatToolCallArgumentBubble and CometChatToolCallResultBubble.
 *
 * Feature: ai-assistant-chat
 */

/** Mirrors the formatting logic from the component's formattedArgs computed signal. */
function formatArguments(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

describe('CometChatToolCallArgumentBubble — Property Tests', () => {
  /**
   * Property 12: JSON formatting round-trip
   * For any valid JSON string, parsing the formatted output should produce an object
   * deeply equal to parsing the original input: JSON.parse(format(x)) deep-equals JSON.parse(x).
   *
   * Validates: Requirements 7.3, 8.3, 15.1
   * Feature: ai-assistant-chat, Property 12: JSON formatting round-trip
   */
  it('Property 12: JSON.parse(format(x)) deep-equals JSON.parse(x) for all valid JSON strings', () => {
    fc.assert(
      fc.property(
        fc.jsonValue(),
        (value) => {
          const raw = JSON.stringify(value);
          const formatted = formatArguments(raw);
          expect(JSON.parse(formatted)).toEqual(JSON.parse(raw));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Invalid JSON passthrough
   * For any string that is not valid JSON, the formatted output should equal the raw input unchanged.
   *
   * Validates: Requirements 7.4, 8.4, 15.2
   * Feature: ai-assistant-chat, Property 13: Invalid JSON passthrough
   */
  it('Property 13: formatted output equals raw input for all invalid JSON strings', () => {
    // Generate strings that are guaranteed to be invalid JSON by prepending a non-JSON character
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false; // skip valid JSON
          } catch {
            return true; // keep invalid JSON
          }
        }),
        (invalidJson) => {
          const formatted = formatArguments(invalidJson);
          expect(formatted).toBe(invalidJson);
        }
      ),
      { numRuns: 100 }
    );
  });
});
