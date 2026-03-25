/**
 * Formatter Reset Clears State — Property-Based Tests
 *
 * Categories: Property-Based Reset Invariants, Formatter State Clearing
 * Validates: Requirements 6.5
 *
 * Property 10: Formatter Reset Clears State
 * For any CometChatTextFormatter subclass, after format() then reset(),
 * getOriginalText/getFormattedText/getMetadata return empty/cleared values.
 *
 * @module formatters/formatter-reset.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, beforeAll, afterAll, describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatTextFormatter } from './cometchat-text-formatter';
import { CometChatUrlFormatter } from './cometchat-url-formatter';
import { CometChatMentionsFormatter } from './cometchat-mentions-formatter';
import { CometChatMarkdownFormatter } from './cometchat-markdown-formatter';
import { CometChatEmojiFormatter } from './cometchat-emoji-formatter';

// ==================== Helpers ====================

/** Creates a fresh instance of each concrete formatter subclass. */
function createAllFormatters(): { name: string; formatter: CometChatTextFormatter }[] {
  return [
    { name: 'CometChatUrlFormatter', formatter: new CometChatUrlFormatter() },
    { name: 'CometChatMentionsFormatter', formatter: new CometChatMentionsFormatter() },
    { name: 'CometChatMarkdownFormatter', formatter: new CometChatMarkdownFormatter() },
    { name: 'CometChatEmojiFormatter', formatter: new CometChatEmojiFormatter() },
  ];
}

/** Asserts that a formatter is in a fully cleared state after reset. */
function assertResetState(formatter: CometChatTextFormatter): void {
  expect(formatter.getOriginalText()).toBe('');
  expect(formatter.getFormattedText()).toBe('');
  expect(formatter.getMetadata()).toEqual({});
}

// ==================== Arbitraries ====================

/** Arbitrary plain text strings (ASCII letters, digits, spaces, basic punctuation). */
const arbPlainText = fc.stringMatching(/^[a-zA-Z0-9 ,.\-!?;:'"()+=]{1,300}$/);

/** Arbitrary unicode strings including multi-byte characters. */
const arbUnicodeText = fc.string({ minLength: 1, maxLength: 200 });

/** Arbitrary strings that contain URL patterns. */
const arbTextWithUrls = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/),
    fc.webUrl(),
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/)
  )
  .map(([before, url, after]) => `${before} ${url} ${after}`);

/** Arbitrary strings that contain markdown syntax. */
const arbTextWithMarkdown = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/),
    fc.constantFrom('**bold**', '*italic*', '__underline__', '~~strike~~', '`code`'),
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/)
  )
  .map(([before, md, after]) => `${before} ${md} ${after}`);

/** Arbitrary strings that contain known emoji shortcodes. */
const arbTextWithEmoji = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/),
    fc.constantFrom('smile', 'heart', 'fire', 'star', 'thumbsup', 'wave', 'grin', 'check'),
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/)
  )
  .map(([before, code, after]) => `${before} :${code}: ${after}`);

/** Arbitrary positive integer for cycle counts. */
const arbCycleCount = fc.integer({ min: 2, max: 10 });

// ==================== Tests ====================

describe('Property 10: Formatter Reset Clears State', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- 1. URL formatter: format then reset clears all state ----------

  describe('CometChatUrlFormatter reset', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * For any text, URL formatter format() then reset() clears
     * originalText, formattedText, and metadata.
     */
    it('reset() clears all base state after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);
          formatter.reset();
          assertResetState(formatter);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 6.5**
     *
     * For text containing URLs, reset() clears state and detected URLs.
     */
    it('reset() clears state and urls after format() with URL-containing text', () => {
      fc.assert(
        fc.property(arbTextWithUrls, text => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);
          // Verify state was populated
          expect(formatter.getOriginalText()).toBe(text);
          formatter.reset();
          assertResetState(formatter);
          expect(formatter.getUrls()).toEqual([]);
          expect(formatter.hasUrls()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 2. Mentions formatter: format then reset clears all state ----------

  describe('CometChatMentionsFormatter reset', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * For any text, mentions formatter format() then reset() clears
     * originalText, formattedText, metadata, and mentions.
     */
    it('reset() clears all state after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatMentionsFormatter();
          formatter.format(text);
          formatter.reset();
          assertResetState(formatter);
          expect(formatter.getMentions()).toEqual([]);
          expect(formatter.hasMentions()).toBe(false);
        }),
        { numRuns: 150 }
      );
    });
  });

  // ---------- 3. Markdown formatter: format then reset clears all state ----------

  describe('CometChatMarkdownFormatter reset', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * For any text, markdown formatter format() then reset() clears
     * originalText, formattedText, and metadata.
     */
    it('reset() clears all state after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatMarkdownFormatter();
          formatter.format(text);
          formatter.reset();
          assertResetState(formatter);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 6.5**
     *
     * For text containing markdown syntax, reset() clears all state.
     */
    it('reset() clears state after format() with markdown-containing text', () => {
      fc.assert(
        fc.property(arbTextWithMarkdown, text => {
          const formatter = new CometChatMarkdownFormatter();
          formatter.format(text);
          // formattedText should differ from originalText for markdown input
          expect(formatter.getOriginalText()).toBe(text);
          formatter.reset();
          assertResetState(formatter);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 4. Emoji formatter: format then reset clears all state ----------

  describe('CometChatEmojiFormatter reset', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * For any text, emoji formatter format() then reset() clears
     * originalText, formattedText, metadata, and shortcodes.
     */
    it('reset() clears all state after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatEmojiFormatter();
          formatter.format(text);
          formatter.reset();
          assertResetState(formatter);
          expect(formatter.getShortcodes()).toEqual([]);
          expect(formatter.hasShortcodes()).toBe(false);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 6.5**
     *
     * For text containing emoji shortcodes, reset() clears state and shortcodes.
     */
    it('reset() clears state and shortcodes after format() with emoji text', () => {
      fc.assert(
        fc.property(arbTextWithEmoji, text => {
          const formatter = new CometChatEmojiFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
          formatter.reset();
          assertResetState(formatter);
          expect(formatter.getShortcodes()).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 5. Cross-formatter: all subclasses with unicode text ----------

  describe('All formatters reset with unicode text', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * For any unicode string and any formatter subclass,
     * format(text) then reset() clears all state.
     */
    it('reset() clears state for all formatters with unicode input', () => {
      fc.assert(
        fc.property(arbUnicodeText, text => {
          const allFormatters = createAllFormatters();
          for (const { formatter } of allFormatters) {
            formatter.format(text);
            expect(formatter.getOriginalText()).toBe(text);
            formatter.reset();
            assertResetState(formatter);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 6. Formatter reusability after reset ----------

  describe('Formatter reusability after reset', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * After reset(), formatting new text works correctly —
     * the formatter is reusable.
     */
    it('format() works correctly after reset() for all formatters', () => {
      fc.assert(
        fc.property(arbPlainText, arbPlainText, (text1, text2) => {
          const allFormatters = createAllFormatters();
          for (const { formatter } of allFormatters) {
            // First format
            formatter.format(text1);
            expect(formatter.getOriginalText()).toBe(text1);

            // Reset
            formatter.reset();
            assertResetState(formatter);

            // Second format — should work as if fresh
            formatter.format(text2);
            expect(formatter.getOriginalText()).toBe(text2);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 7. Reset on already-empty formatter (idempotent) ----------

  describe('Reset idempotency', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * Calling reset() on a fresh (never-formatted) formatter does not throw
     * and leaves state in cleared condition.
     */
    it('reset() on fresh formatter is safe and idempotent', () => {
      const allFormatters = createAllFormatters();
      for (const { formatter } of allFormatters) {
        // Reset without ever calling format()
        expect(() => formatter.reset()).not.toThrow();
        assertResetState(formatter);
      }
    });

    /**
     * **Validates: Requirements 6.5**
     *
     * Calling reset() multiple times in a row does not throw
     * and state remains cleared.
     */
    it('multiple consecutive reset() calls are safe', () => {
      fc.assert(
        fc.property(arbPlainText, fc.integer({ min: 2, max: 10 }), (text, resetCount) => {
          const allFormatters = createAllFormatters();
          for (const { formatter } of allFormatters) {
            formatter.format(text);
            for (let i = 0; i < resetCount; i++) {
              formatter.reset();
              assertResetState(formatter);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 8. Multiple format-reset cycles ----------

  describe('Multiple format-reset cycles', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * For any sequence of format-reset cycles with different inputs,
     * each reset clears state completely and each format stores new input.
     */
    it('repeated format-reset cycles maintain correct state', () => {
      fc.assert(
        fc.property(fc.array(arbPlainText, { minLength: 2, maxLength: 8 }), texts => {
          const allFormatters = createAllFormatters();
          for (const { formatter } of allFormatters) {
            for (const text of texts) {
              formatter.format(text);
              expect(formatter.getOriginalText()).toBe(text);
              formatter.reset();
              assertResetState(formatter);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 9. URL formatter: reset clears detected URLs specifically ----------

  describe('URL formatter subclass-specific reset', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * After formatting text with URLs and resetting, getUrls() returns
     * empty array and hasUrls() returns false.
     */
    it('reset() clears URL-specific state for URL-containing text', () => {
      fc.assert(
        fc.property(arbTextWithUrls, text => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);
          // URLs should have been detected
          const urlsBefore = formatter.getUrls();
          expect(urlsBefore.length).toBeGreaterThan(0);
          expect(formatter.hasUrls()).toBe(true);

          formatter.reset();
          expect(formatter.getUrls()).toEqual([]);
          expect(formatter.hasUrls()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 10. Emoji formatter: reset clears shortcodes specifically ----------

  describe('Emoji formatter subclass-specific reset', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * After formatting text with emoji shortcodes and resetting,
     * getShortcodes() returns empty array and hasShortcodes() returns false.
     */
    it('reset() clears emoji-specific state for emoji-containing text', () => {
      fc.assert(
        fc.property(arbTextWithEmoji, text => {
          const formatter = new CometChatEmojiFormatter();
          formatter.format(text);
          // Shortcodes should have been detected
          const shortcodesBefore = formatter.getShortcodes();
          expect(shortcodesBefore.length).toBeGreaterThan(0);
          expect(formatter.hasShortcodes()).toBe(true);

          formatter.reset();
          expect(formatter.getShortcodes()).toEqual([]);
          expect(formatter.hasShortcodes()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 11. Null input format then reset ----------

  describe('Null/undefined input handling', () => {
    /**
     * **Validates: Requirements 6.5**
     *
     * Formatting null input then resetting clears state correctly.
     */
    it('reset() clears state after format(null) for URL formatter', () => {
      const formatter = new CometChatUrlFormatter();
      formatter.format(null as any);
      expect(formatter.getOriginalText()).toBe('');
      formatter.reset();
      assertResetState(formatter);
      expect(formatter.getUrls()).toEqual([]);
    });
  });
});

// ==================== Property 22: Formatter Idempotence ====================

describe('Property 22: Formatter Idempotence — format(format(x)) === format(x)', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For any plain text string, applying CometChatUrlFormatter.format() twice
   * SHALL produce the same result as applying it once.
   */
  it('CometChatUrlFormatter: format(format(x)) === format(x) for plain text', () => {
    fc.assert(
      fc.property(arbPlainText, text => {
        const f1 = new CometChatUrlFormatter();
        const f2 = new CometChatUrlFormatter();
        const once = f1.format(text);
        const twice = f2.format(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For text containing URLs, applying CometChatUrlFormatter.format() twice
   * SHALL produce the same result as applying it once (links are not double-wrapped).
   */
  it('CometChatUrlFormatter: format(format(x)) === format(x) for URL-containing text', () => {
    fc.assert(
      fc.property(arbTextWithUrls, text => {
        const f1 = new CometChatUrlFormatter();
        const f2 = new CometChatUrlFormatter();
        const once = f1.format(text);
        const twice = f2.format(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For any plain text string, applying CometChatMentionsFormatter.format() twice
   * SHALL produce the same result as applying it once.
   */
  it('CometChatMentionsFormatter: format(format(x)) === format(x) for plain text', () => {
    fc.assert(
      fc.property(arbPlainText, text => {
        const f1 = new CometChatMentionsFormatter();
        const f2 = new CometChatMentionsFormatter();
        const once = f1.format(text);
        const twice = f2.format(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For any plain text string, applying CometChatMarkdownFormatter.format() twice
   * SHALL produce the same result as applying it once.
   */
  it('CometChatMarkdownFormatter: format(format(x)) === format(x) for plain text', () => {
    fc.assert(
      fc.property(arbPlainText, text => {
        const f1 = new CometChatMarkdownFormatter();
        const f2 = new CometChatMarkdownFormatter();
        const once = f1.format(text);
        const twice = f2.format(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For text containing markdown syntax, applying CometChatMarkdownFormatter.format() twice
   * SHALL produce the same result as applying it once (HTML tags are not re-processed).
   */
  it('CometChatMarkdownFormatter: format(format(x)) === format(x) for markdown text', () => {
    fc.assert(
      fc.property(arbTextWithMarkdown, text => {
        const f1 = new CometChatMarkdownFormatter();
        const f2 = new CometChatMarkdownFormatter();
        const once = f1.format(text);
        const twice = f2.format(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For any plain text string, applying CometChatEmojiFormatter.format() twice
   * SHALL produce the same result as applying it once.
   */
  it('CometChatEmojiFormatter: format(format(x)) === format(x) for plain text', () => {
    fc.assert(
      fc.property(arbPlainText, text => {
        const f1 = new CometChatEmojiFormatter();
        const f2 = new CometChatEmojiFormatter();
        const once = f1.format(text);
        const twice = f2.format(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For text containing emoji shortcodes, applying CometChatEmojiFormatter.format() twice
   * SHALL produce the same result as applying it once (emoji chars are not re-processed).
   */
  it('CometChatEmojiFormatter: format(format(x)) === format(x) for emoji text', () => {
    fc.assert(
      fc.property(arbTextWithEmoji, text => {
        const f1 = new CometChatEmojiFormatter();
        const f2 = new CometChatEmojiFormatter();
        const once = f1.format(text);
        const twice = f2.format(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 15.2, 15.7**
   *
   * For any unicode string, all formatter subclasses satisfy idempotence.
   */
  it('All formatters: format(format(x)) === format(x) for unicode text', () => {
    fc.assert(
      fc.property(arbUnicodeText, text => {
        const formatters = createAllFormatters();
        for (const { name, formatter } of formatters) {
          const f2 = createAllFormatters().find(f => f.name === name)!.formatter;
          const once = formatter.format(text);
          const twice = f2.format(once);
          expect(twice).toBe(once);
        }
      }),
      { numRuns: 100 }
    );
  });
});
