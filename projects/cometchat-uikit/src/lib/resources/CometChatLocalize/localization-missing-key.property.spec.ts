/**
 * Property-Based Tests for Localization Missing Key Fallback
 *
 * Categories: Property-Based Localization Invariants
 * Validates: Requirements 9.3
 *
 * Property 15: Localization Missing Key Fallback
 * For any string key not in the translation dictionary,
 * getLocalizedString(key) returns a deterministic fallback (empty string).
 *
 * Note: The actual CometChatLocalize implementation returns '' for missing keys
 * (after checking current language, then fallback language). This test suite
 * verifies that invariant holds across arbitrary generated keys.
 *
 * @module resources/CometChatLocalize/localization-missing-key.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../../test-setup';
import { CometChatLocalize } from './cometchat-localize';

// ==================== Arbitraries ====================

/** Keys using alphanumeric + underscore, prefixed to avoid collision with real keys. */
const arbMissingKey = fc.stringMatching(/^[a-z0-9_]{1,50}$/).map(s => `__test_missing_${s}`);

/** Pure random strings (may include unicode). */
const arbUnicodeKey = fc.string({ minLength: 1, maxLength: 40 });

/** Keys built from special-character tokens. */
const SPECIAL_CHARS = [
  '!',
  '@',
  '#',
  '$',
  '%',
  '^',
  '&',
  '*',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  '|',
  ';',
  ':',
  ',',
  '.',
  '<',
  '>',
  '?',
  '~',
  '+',
  '-',
  '=',
];
const arbSpecialCharKey = fc
  .array(fc.constantFrom(...SPECIAL_CHARS), { minLength: 1, maxLength: 30 })
  .map(chars => `__nonexistent_${chars.join('')}`);

/** Very long keys (100-500 chars). */
const arbLongKey = fc.string({ minLength: 100, maxLength: 500 }).map(s => `__missing_long_${s}`);

/** Keys containing whitespace. */
const arbWhitespaceKey = fc
  .tuple(fc.constantFrom('  ', '\t', '\n', ' \t\n '), fc.string({ minLength: 1, maxLength: 20 }))
  .map(([ws, s]) => `__ws_${ws}${s}`);

/** Numeric-looking keys. */
const arbNumericKey = fc.integer({ min: 0, max: 999999 }).map(n => `__num_${n}_key`);

// ==================== Tests ====================

describe('Property 15: Localization Missing Key Fallback', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    CometChatLocalize.init({
      language: 'en-US',
      disableAutoDetection: true,
    });
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any string key prefixed to avoid collision with real translation keys,
   * getLocalizedString(key) returns empty string (the fallback behavior).
   */
  it('returns empty string for any arbitrary missing key', () => {
    fc.assert(
      fc.property(arbMissingKey, key => {
        const result = CometChatLocalize.getLocalizedString(key);
        expect(result).toBe('');
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any unicode string not in the dictionary, getLocalizedString returns
   * empty string without throwing.
   */
  it('returns empty string for arbitrary unicode keys not in dictionary', () => {
    fc.assert(
      fc.property(arbUnicodeKey, key => {
        const prefixed = `__unicode_${key}`;
        const result = CometChatLocalize.getLocalizedString(prefixed);
        expect(result).toBe('');
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any key containing special characters, getLocalizedString returns
   * empty string without throwing.
   */
  it('returns empty string for keys with special characters', () => {
    fc.assert(
      fc.property(arbSpecialCharKey, key => {
        const result = CometChatLocalize.getLocalizedString(key);
        expect(result).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any very long key (100-500 chars), getLocalizedString returns
   * empty string without throwing or hanging.
   */
  it('returns empty string for very long keys', () => {
    fc.assert(
      fc.property(arbLongKey, key => {
        const result = CometChatLocalize.getLocalizedString(key);
        expect(result).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any key containing whitespace characters, getLocalizedString returns
   * empty string.
   */
  it('returns empty string for keys with whitespace', () => {
    fc.assert(
      fc.property(arbWhitespaceKey, key => {
        const result = CometChatLocalize.getLocalizedString(key);
        expect(result).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any numeric-looking key, getLocalizedString returns empty string.
   */
  it('returns empty string for numeric-looking keys', () => {
    fc.assert(
      fc.property(arbNumericKey, key => {
        const result = CometChatLocalize.getLocalizedString(key);
        expect(result).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * Empty string key returns empty string (falsy key short-circuits).
   */
  it('returns empty string for empty string key', () => {
    const result = CometChatLocalize.getLocalizedString('');
    expect(result).toBe('');
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * Positive control: known keys return non-empty translations, confirming
   * the fallback behavior is specific to missing keys.
   */
  it('known keys return non-empty translations (positive control)', () => {
    const knownKeys = ['conversation_chat_title', 'user_title', 'group_title'];
    for (const key of knownKeys) {
      const result = CometChatLocalize.getLocalizedString(key);
      expect(result).not.toBe('');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any missing key, the fallback behavior (empty string) holds
   * regardless of which language is currently active.
   */
  it('missing key fallback holds across language switches', () => {
    const languages = ['en-US', 'fr', 'de', 'es', 'hi', 'ja'];
    fc.assert(
      fc.property(arbMissingKey, fc.constantFrom(...languages), (key, lang) => {
        CometChatLocalize.setCurrentLanguage(lang);
        const result = CometChatLocalize.getLocalizedString(key);
        expect(result).toBe('');
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any missing key, getLocalizedString always returns a string type
   * (never null, undefined, or other types).
   */
  it('always returns string type for missing keys', () => {
    fc.assert(
      fc.property(arbMissingKey, key => {
        const result = CometChatLocalize.getLocalizedString(key);
        expect(typeof result).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * Keys that are close to real keys but not exact matches still return
   * empty string. This verifies no fuzzy matching occurs.
   */
  it('returns empty string for near-miss keys (no fuzzy matching)', () => {
    const nearMissKeys = [
      'conversation_chat_titl',
      'conversation_chat_title_',
      'Conversation_chat_title',
      'conversation_chat_titles',
      'user_titl',
      'user_title_extra',
      'USER_TITLE',
      'group_titlee',
    ];
    for (const key of nearMissKeys) {
      const result = CometChatLocalize.getLocalizedString(key);
      expect(result).toBe('');
    }
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any missing key, if a missingKeyHandler is configured, it is called
   * with the exact key that was looked up.
   */
  it('invokes missingKeyHandler with the exact missing key', () => {
    const handler = vi.fn();
    CometChatLocalize.init({
      language: 'en-US',
      disableAutoDetection: true,
      missingKeyHandler: handler,
    });

    fc.assert(
      fc.property(arbMissingKey, key => {
        handler.mockClear();
        CometChatLocalize.getLocalizedString(key);
        expect(handler).toHaveBeenCalledWith(key);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any generated key, after adding it as a custom translation,
   * getLocalizedString returns the custom value (not empty string).
   * This confirms the fallback only applies to truly missing keys.
   */
  it('custom translation overrides fallback for previously missing keys', () => {
    fc.assert(
      fc.property(arbMissingKey, fc.string({ minLength: 1, maxLength: 50 }), (key, value) => {
        // Clean up any key added in a previous iteration
        const translations = (CometChatLocalize as any).translations;
        if (translations?.['en-US']?.[key] !== undefined) {
          delete translations['en-US'][key];
        }

        expect(CometChatLocalize.getLocalizedString(key)).toBe('');

        CometChatLocalize.addTranslation({ 'en-US': { [key]: value } });

        const result = CometChatLocalize.getLocalizedString(key);
        if (value === '') {
          expect(result).toBe('');
        } else {
          expect(result).toBe(value);
        }

        // Clean up after assertion
        delete translations['en-US'][key];
      }),
      { numRuns: 100 }
    );
  });
});
