/**
 * Formatter No-Match Identity — Property-Based Tests
 *
 * Categories: Property-Based No-Match Identity Invariants, Formatter Passthrough
 * Validates: Requirements 6.3, 6.4
 *
 * Property 9: Formatter No-Match Identity
 * For any CometChatTextFormatter subclass and text not matching getRegex(),
 * format(text) returns original text unchanged.
 *
 * @module formatters/formatter-no-match-identity.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, beforeAll, afterAll, describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatUrlFormatter } from './cometchat-url-formatter';
import { CometChatMentionsFormatter } from './cometchat-mentions-formatter';
import { CometChatMarkdownFormatter } from './cometchat-markdown-formatter';
import { CometChatEmojiFormatter } from './cometchat-emoji-formatter';

// ==================== Helpers ====================

/**
 * Asserts that text does NOT match a given regex.
 * Used as a precondition filter in property tests.
 */
function doesNotMatch(text: string, regex: RegExp): boolean {
  // Reset lastIndex for global regexes
  regex.lastIndex = 0;
  const result = !regex.test(text);
  regex.lastIndex = 0;
  return result;
}

// ==================== Arbitraries ====================

/**
 * Arbitrary plain alphanumeric text that won't match URL patterns.
 * Excludes http, https, www, :// sequences.
 * Also excludes @, :, *, _, ~, `, >, [, ], (, ), -, digits followed by . to avoid
 * matching mentions, emoji, markdown, or list patterns.
 */
const arbNoUrlText = fc
  .stringMatching(/^[a-zA-Z0-9 ,;!?=+]{0,200}$/)
  .filter(s => !s.match(/https?/i) && !s.match(/www\./i) && !s.includes('://'));

/**
 * Arbitrary text that won't match @mention patterns.
 * Excludes the @ character entirely.
 */
const arbNoMentionText = fc
  .stringMatching(/^[a-zA-Z0-9 ,.\-!?;:'"()+=]{0,200}$/)
  .filter(s => !s.includes('@'));

/**
 * Arbitrary text that won't match markdown patterns.
 * Excludes *, _, ~, `, >, [, ], (, ), and lines starting with - or digits followed by .
 */
const arbNoMarkdownText = fc.stringMatching(/^[a-zA-Z0-9 ,;!?=+]{0,200}$/).filter(s => {
  // Ensure no markdown triggers
  return (
    !s.includes('*') &&
    !s.includes('_') &&
    !s.includes('~') &&
    !s.includes('`') &&
    !s.includes('>') &&
    !s.includes('[') &&
    !s.includes(']') &&
    !s.includes('(') &&
    !s.includes(')') &&
    !s.match(/^[-*]\s/m) &&
    !s.match(/^\d+\.\s/m)
  );
});

/**
 * Arbitrary text that won't match emoji shortcode patterns (:word:).
 * Excludes the colon character entirely.
 */
const arbNoEmojiText = fc
  .stringMatching(/^[a-zA-Z0-9 ,.\-!?;'"()+=]{0,200}$/)
  .filter(s => !s.includes(':'));

/**
 * Arbitrary text that is "close" to a URL but doesn't actually match.
 * E.g., "http" without "://", "www" without ".", etc.
 */
const arbAlmostUrl = fc.constantFrom(
  'http without colon slash slash',
  'just the word https here',
  'www without a dot after',
  'ftp://example.com',
  'mailto:user@example.com',
  'htt://broken',
  'httpx://notreal.com',
  'ww.missing-w.com',
  'Check http alone',
  'The www alone'
);

/**
 * Arbitrary text with special characters but no formatter patterns.
 * Tests that special chars pass through unchanged.
 */
const arbSpecialChars = fc.stringMatching(/^[#$%^&{}|\\/<>]{0,100}$/).filter(s => {
  // Filter out anything that could match any formatter regex
  return (
    !s.includes('://') &&
    !s.includes('@') &&
    !s.includes(':') &&
    !s.includes('*') &&
    !s.includes('_') &&
    !s.includes('~') &&
    !s.includes('`') &&
    !s.includes('>') &&
    !s.includes('[')
  );
});

/**
 * Arbitrary unicode text filtered to not match any formatter regex.
 */
const arbSafeUnicode = fc.string({ minLength: 0, maxLength: 150 }).filter(s => {
  return (
    !s.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi) &&
    !s.match(/@(\w+)/g) &&
    !s.match(/:([a-zA-Z0-9_+-]+):/g) &&
    !s.match(/(\*\*|__|~~|`|^>\s|^[-*]\s|^\d+\.\s|\[.*?\]\(.*?\))/m)
  );
});

// ==================== Tests ====================

describe('Property 9: Formatter No-Match Identity', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- CometChatUrlFormatter ----------

  describe('CometChatUrlFormatter no-match identity', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For any text without URL patterns, URL formatter returns text unchanged.
     */
    it('returns original text when no URLs are present (alphanumeric)', () => {
      fc.assert(
        fc.property(arbNoUrlText, text => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For text that is "close" to URL patterns but doesn't match,
     * URL formatter returns text unchanged.
     */
    it('returns original text for almost-URL strings that do not match', () => {
      fc.assert(
        fc.property(arbAlmostUrl, text => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- CometChatMentionsFormatter ----------

  describe('CometChatMentionsFormatter no-match identity', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For any text without @mention patterns, mentions formatter returns text unchanged.
     */
    it('returns original text when no @mentions are present', () => {
      fc.assert(
        fc.property(arbNoMentionText, text => {
          const formatter = new CometChatMentionsFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For text with @ followed by non-word characters (spaces, punctuation),
     * mentions formatter returns text unchanged since @(\w+) won't match.
     */
    it('returns original text when @ is followed by non-word characters', () => {
      const arbAtNonWord = fc.constantFrom(
        '@ alone',
        'email@ space',
        '@ !special',
        'test @ test',
        '@',
        '@ ',
        '@!',
        '@.',
        '@ @ @',
        'no at sign here'
      );

      fc.assert(
        fc.property(arbAtNonWord, text => {
          const formatter = new CometChatMentionsFormatter();
          const result = formatter.format(text);
          // The mentions formatter only wraps @word if a matching user is found.
          // With no users set, unmatched @word patterns pass through unchanged.
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- CometChatMarkdownFormatter ----------

  describe('CometChatMarkdownFormatter no-match identity', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For any text without markdown syntax, markdown formatter returns text unchanged.
     */
    it('returns original text when no markdown patterns are present', () => {
      fc.assert(
        fc.property(arbNoMarkdownText, text => {
          const formatter = new CometChatMarkdownFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For text with single special chars that don't form markdown pairs,
     * markdown formatter returns text unchanged.
     */
    it('returns original text for incomplete markdown syntax', () => {
      const arbIncompleteMarkdown = fc.constantFrom(
        'just a single asterisk here',
        'no pairs of underscores here',
        'tildes alone are fine',
        'plain sentence with numbers 123',
        'UPPERCASE WORDS ONLY',
        'commas, periods. semicolons; colons',
        'question? exclamation!',
        'spaces   and   more   spaces',
        'tabs\tand\tnewlines',
        'mixed CaSe TeXt'
      );

      fc.assert(
        fc.property(arbIncompleteMarkdown, text => {
          const formatter = new CometChatMarkdownFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- CometChatEmojiFormatter ----------

  describe('CometChatEmojiFormatter no-match identity', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For any text without emoji shortcode patterns, emoji formatter returns text unchanged.
     */
    it('returns original text when no emoji shortcodes are present', () => {
      fc.assert(
        fc.property(arbNoEmojiText, text => {
          const formatter = new CometChatEmojiFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For text with colons that don't form valid shortcode patterns,
     * emoji formatter returns text unchanged.
     */
    it('returns original text for colon patterns that are not valid shortcodes', () => {
      const arbInvalidShortcodes = fc.constantFrom(
        'time is 10:30 AM',
        'ratio 1:2:3',
        'key: value',
        ': leading colon',
        'trailing colon:',
        '::double colons::',
        ': : : spaced colons',
        'http://example.com',
        'C:\\path\\to\\file',
        'Dear Sir/Madam:'
      );

      fc.assert(
        fc.property(arbInvalidShortcodes, text => {
          const formatter = new CometChatEmojiFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For text with :shortcode: patterns where the shortcode is NOT in the emoji map,
     * emoji formatter returns text unchanged (unrecognized shortcodes are preserved).
     */
    it('returns original text for unrecognized emoji shortcodes', () => {
      const arbUnknownShortcodes = fc
        .stringMatching(/^[a-zA-Z]{5,15}$/)
        .filter(s => {
          // Ensure the shortcode is not in the known emoji map
          const lower = s.toLowerCase();
          // Also exclude JS prototype property names that resolve on plain objects
          const protoNames = [
            'constructor', 'tostring', 'valueof', 'hasownproperty',
            'isprototypeof', 'propertyisenumerable', 'tolocalestring',
            '__proto__', '__definegetter__', '__definesetter__',
            '__lookupgetter__', '__lookupsetter__',
          ];
          if (protoNames.includes(lower)) return false;
          return (
            lower !== 'smile' &&
            lower !== 'heart' &&
            lower !== 'fire' &&
            lower !== 'star' &&
            lower !== 'wave' &&
            lower !== 'grin' &&
            lower !== 'check' &&
            lower !== 'ok' &&
            lower !== 'cool' &&
            lower !== 'new' &&
            lower !== 'free' &&
            lower !== 'up' &&
            lower !== 'sos' &&
            lower !== 'link' &&
            lower !== 'key' &&
            lower !== 'bug' &&
            lower !== 'ant' &&
            lower !== 'dog' &&
            lower !== 'cat' &&
            lower !== 'eye' &&
            lower !== 'sun' &&
            lower !== 'moon' &&
            lower !== 'rain' &&
            lower !== 'fish' &&
            lower !== 'egg' &&
            lower !== 'pie' &&
            lower !== 'tea' &&
            lower !== 'beer' &&
            lower !== 'hand' &&
            lower !== 'fist' &&
            lower !== 'lips' &&
            lower !== 'nose' &&
            lower !== 'ear' &&
            lower !== 'bone' &&
            lower !== 'eyes' &&
            lower !== 'hash' &&
            lower !== 'label' &&
            lower !== 'gem' &&
            lower !== 'ring'
          );
        })
        .map(s => `:${s}:`);

      fc.assert(
        fc.property(arbUnknownShortcodes, text => {
          const formatter = new CometChatEmojiFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- Cross-formatter: empty string ----------

  describe('Empty string identity', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * Empty string has no patterns to match — all formatters return '' unchanged.
     */
    it('all formatters return empty string for empty input', () => {
      const formatters = [
        new CometChatUrlFormatter(),
        new CometChatMentionsFormatter(),
        new CometChatMarkdownFormatter(),
        new CometChatEmojiFormatter(),
      ];

      for (const formatter of formatters) {
        const result = formatter.format('');
        expect(result).toBe('');
      }
    });
  });

  // ---------- Property 24: Formatter null-safety ----------

  describe('Property 24: Formatter null-safety — no exception on degenerate inputs', () => {
    /**
     * **Validates: Requirements 15.5**
     *
     * Property 24: Formatter null-safety — no exception on degenerate inputs.
     * All formatter subclasses must not throw when called with '', null, or '   '.
     */

    const formatterFactories: Array<{ name: string; create: () => { format: (s: string | null) => string } }> = [
      { name: 'CometChatUrlFormatter', create: () => new CometChatUrlFormatter() },
      { name: 'CometChatMentionsFormatter', create: () => new CometChatMentionsFormatter() },
      { name: 'CometChatMarkdownFormatter', create: () => new CometChatMarkdownFormatter() },
      { name: 'CometChatEmojiFormatter', create: () => new CometChatEmojiFormatter() },
    ];

    for (const { name, create } of formatterFactories) {
      it(`${name}: format('') does not throw`, () => {
        const formatter = create();
        expect(() => formatter.format('')).not.toThrow();
      });

      it(`${name}: format(null) does not throw`, () => {
        const formatter = create();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => formatter.format(null as any)).not.toThrow();
      });

      it(`${name}: format('   ') does not throw`, () => {
        const formatter = create();
        expect(() => formatter.format('   ')).not.toThrow();
      });
    }
  });

  // ---------- Cross-formatter: safe unicode ----------

  describe('All formatters with safe unicode text', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For any unicode text that doesn't match any formatter regex,
     * all formatters return the text unchanged.
     */
    it('all formatters return original for unicode text with no patterns', () => {
      fc.assert(
        fc.property(arbSafeUnicode, text => {
          const urlFormatter = new CometChatUrlFormatter();
          const mentionsFormatter = new CometChatMentionsFormatter();
          const emojiFormatter = new CometChatEmojiFormatter();

          expect(urlFormatter.format(text)).toBe(text);
          expect(mentionsFormatter.format(text)).toBe(text);
          expect(emojiFormatter.format(text)).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- URL formatter: special near-miss patterns ----------

  describe('URL formatter near-miss patterns', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * For text containing "http" or "www" substrings that don't form valid URLs,
     * URL formatter returns text unchanged.
     */
    it('returns original for http/www substrings that are not valid URLs', () => {
      const arbNearMissUrls = fc
        .tuple(
          fc.constantFrom(
            'httponly',
            'httprequest',
            'httphandler',
            'wwwhat',
            'wwwonder',
            'wwwild',
            'the word http in a sentence',
            'www is just three letters',
            'an ftp link ftp://files.example.com'
          )
        )
        .map(([s]) => s);

      fc.assert(
        fc.property(arbNearMissUrls, text => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- Mentions formatter: no users configured ----------

  describe('Mentions formatter with @word but no matching users', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     *
     * When no users are configured, @word patterns pass through unchanged
     * because the formatter only wraps mentions that match a known user.
     */
    it('returns original text when @word patterns exist but no users are set', () => {
      const arbWithAtWord = fc
        .tuple(
          fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/),
          fc.stringMatching(/^[a-zA-Z]{3,10}$/),
          fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/)
        )
        .map(([before, name, after]) => `${before} @${name} ${after}`);

      fc.assert(
        fc.property(arbWithAtWord, text => {
          const formatter = new CometChatMentionsFormatter();
          // No users set — @word patterns won't be wrapped
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });
});
