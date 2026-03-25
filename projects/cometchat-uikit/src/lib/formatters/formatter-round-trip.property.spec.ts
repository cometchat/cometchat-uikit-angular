/**
 * Formatter Round-Trip Preservation — Property-Based Tests
 *
 * Categories: Property-Based Round-Trip Invariants, Formatter State Preservation
 * Validates: Requirements 12.2, 6.1
 *
 * Property 2: Formatter Round-Trip Preservation
 * For any CometChatTextFormatter subclass and any plain text input,
 * format(text) then getOriginalText() returns the original input.
 *
 * @module formatters/formatter-round-trip.property
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

/**
 * Creates a fresh instance of each concrete formatter subclass.
 * Used to test the round-trip property across all subclasses.
 */
function createAllFormatters(): { name: string; formatter: CometChatTextFormatter }[] {
  return [
    { name: 'CometChatUrlFormatter', formatter: new CometChatUrlFormatter() },
    { name: 'CometChatMentionsFormatter', formatter: new CometChatMentionsFormatter() },
    { name: 'CometChatMarkdownFormatter', formatter: new CometChatMarkdownFormatter() },
    { name: 'CometChatEmojiFormatter', formatter: new CometChatEmojiFormatter() },
  ];
}

// ==================== Arbitraries ====================

/** Arbitrary plain text strings (ASCII letters, digits, spaces, basic punctuation). */
const arbPlainText = fc.stringMatching(/^[a-zA-Z0-9 ,.\-!?;:'"()+=]{0,300}$/);

/** Arbitrary unicode strings including multi-byte characters. */
const arbUnicodeText = fc.string({ minLength: 0, maxLength: 200 });

/** Arbitrary strings that contain URL patterns. */
const arbTextWithUrls = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/),
    fc.webUrl(),
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/)
  )
  .map(([before, url, after]) => `${before} ${url} ${after}`);

/** Arbitrary strings that contain @mention patterns. */
const arbTextWithMentions = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/),
    fc.stringMatching(/^[a-zA-Z]{3,12}$/),
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/)
  )
  .map(([before, name, after]) => `${before} @${name} ${after}`);

/** Arbitrary strings that contain emoji shortcodes. */
const arbTextWithEmoji = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/),
    fc.constantFrom('smile', 'heart', 'fire', 'star', 'thumbsup', 'wave', 'grin', 'check'),
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/)
  )
  .map(([before, code, after]) => `${before} :${code}: ${after}`);

/** Arbitrary strings that contain markdown syntax. */
const arbTextWithMarkdown = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/),
    fc.constantFrom('**bold**', '*italic*', '__underline__', '~~strike~~', '`code`'),
    fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/)
  )
  .map(([before, md, after]) => `${before} ${md} ${after}`);

// ==================== Tests ====================

describe('Property 2: Formatter Round-Trip Preservation', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- Core round-trip: format(text) then getOriginalText() === text ----------

  describe('CometChatUrlFormatter round-trip', () => {
    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For any plain text, URL formatter stores original text correctly.
     */
    it('getOriginalText() returns original after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For text containing URLs, URL formatter preserves original text.
     */
    it('getOriginalText() returns original after format() with URL-containing text', () => {
      fc.assert(
        fc.property(arbTextWithUrls, text => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('CometChatMentionsFormatter round-trip', () => {
    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For any plain text, mentions formatter stores original text correctly.
     */
    it('getOriginalText() returns original after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatMentionsFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For text containing @mentions, mentions formatter preserves original text.
     */
    it('getOriginalText() returns original after format() with mention-containing text', () => {
      fc.assert(
        fc.property(arbTextWithMentions, text => {
          const formatter = new CometChatMentionsFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('CometChatMarkdownFormatter round-trip', () => {
    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For any plain text, markdown formatter stores original text correctly.
     */
    it('getOriginalText() returns original after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatMarkdownFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For text containing markdown syntax, markdown formatter preserves original text.
     */
    it('getOriginalText() returns original after format() with markdown-containing text', () => {
      fc.assert(
        fc.property(arbTextWithMarkdown, text => {
          const formatter = new CometChatMarkdownFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('CometChatEmojiFormatter round-trip', () => {
    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For any plain text, emoji formatter stores original text correctly.
     */
    it('getOriginalText() returns original after format() with plain text', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatEmojiFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For text containing emoji shortcodes, emoji formatter preserves original text.
     */
    it('getOriginalText() returns original after format() with emoji-containing text', () => {
      fc.assert(
        fc.property(arbTextWithEmoji, text => {
          const formatter = new CometChatEmojiFormatter();
          formatter.format(text);
          expect(formatter.getOriginalText()).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- Cross-formatter: all subclasses with arbitrary unicode ----------

  describe('All formatters with unicode text', () => {
    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * For any unicode string and any formatter subclass,
     * format(text) then getOriginalText() returns the original input.
     */
    it('getOriginalText() returns original for all formatters with unicode input', () => {
      const allFormatters = createAllFormatters();

      for (const { name, formatter } of allFormatters) {
        fc.assert(
          fc.property(arbUnicodeText, text => {
            formatter.reset();
            formatter.format(text);
            expect(formatter.getOriginalText()).toBe(text);
          }),
          { numRuns: 100 }
        );
      }
    });
  });

  // ---------- Edge cases ----------

  describe('Edge cases', () => {
    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * Empty string round-trip: format('') then getOriginalText() returns ''.
     */
    it('getOriginalText() returns empty string after format("") for all formatters', () => {
      const allFormatters = createAllFormatters();

      for (const { name, formatter } of allFormatters) {
        formatter.format('');
        expect(formatter.getOriginalText()).toBe('');
      }
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * After reset(), getOriginalText() returns empty string.
     */
    it('getOriginalText() returns empty string after reset() for all formatters', () => {
      const allFormatters = createAllFormatters();

      for (const { name, formatter } of allFormatters) {
        formatter.format('some text');
        expect(formatter.getOriginalText()).toBe('some text');
        formatter.reset();
        expect(formatter.getOriginalText()).toBe('');
      }
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * Consecutive format() calls: getOriginalText() always returns the LAST input.
     */
    it('getOriginalText() returns the most recent input after consecutive format() calls', () => {
      fc.assert(
        fc.property(arbPlainText, arbPlainText, (text1, text2) => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text1);
          expect(formatter.getOriginalText()).toBe(text1);
          formatter.format(text2);
          expect(formatter.getOriginalText()).toBe(text2);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * URL formatter handles null input gracefully — getOriginalText() returns ''.
     */
    it('URL formatter getOriginalText() returns empty string for null input', () => {
      const formatter = new CometChatUrlFormatter();
      formatter.format(null as any);
      expect(formatter.getOriginalText()).toBe('');
    });

    /**
     * **Validates: Requirements 12.2, 6.1**
     *
     * Strings with special regex characters don't break the round-trip.
     */
    it('getOriginalText() handles strings with regex special characters', () => {
      const arbRegexChars = fc.stringMatching(/^[\[\]\(\)\{\}\.\*\+\?\^\$\|\\]{1,50}$/);

      fc.assert(
        fc.property(arbRegexChars, text => {
          const allFormatters = createAllFormatters();
          for (const { formatter } of allFormatters) {
            formatter.reset();
            formatter.format(text);
            expect(formatter.getOriginalText()).toBe(text);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
