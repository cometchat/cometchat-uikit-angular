/**
 * Property-Based Tests for UIKit Localization Audit
 *
 * These tests validate that the 9 new localization keys added by the
 * localization audit exist in all 19 language translation files.
 *
 * @see Design Document: Correctness Properties
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import de from './resources/de/translation.json';
import enGb from './resources/en-gb/translation.json';
import enUs from './resources/en-us/translation.json';
import es from './resources/es/translation.json';
import fr from './resources/fr/translation.json';
import hi from './resources/hi/translation.json';
import hu from './resources/hu/translation.json';
import itLang from './resources/it/translation.json';
import ja from './resources/ja/translation.json';
import ko from './resources/ko/translation.json';
import lt from './resources/lt/translation.json';
import ms from './resources/ms/translation.json';
import nl from './resources/nl/translation.json';
import pt from './resources/pt/translation.json';
import ru from './resources/ru/translation.json';
import sv from './resources/sv/translation.json';
import tr from './resources/tr/translation.json';
import zh from './resources/zh/translation.json';
import zhTw from './resources/zh-tw/translation.json';

/** All 19 language files keyed by language code */
const languageFiles: Record<string, Record<string, string>> = {
  de,
  'en-gb': enGb,
  'en-us': enUs,
  es,
  fr,
  hi,
  hu,
  it: itLang,
  ja,
  ko,
  lt,
  ms,
  nl,
  pt,
  ru,
  sv,
  tr,
  zh,
  'zh-tw': zhTw,
};

const languageCodes = Object.keys(languageFiles);

/** The 9 new keys added by the localization audit */
const auditKeys = [
  'media_recorder_aria_label',
  'toast_close_aria_label',
  'action_sheet_aria_label',
  'context_menu_aria_label',
  'link_popover_aria_label',
  'sticker_categories_aria_label',
  'dropdown_placeholder',
  'checkbox_aria_label',
  'file_bubble_unknown_file',
] as const;

// Minimum 100 iterations per property test as per design document
const testConfig = { numRuns: 100 };

/**
 * Feature: uikit-localization-audit, Property 1: Translation key parity across all language files
 *
 * For any audit key present in en-us/translation.json, that key must also exist
 * in every other language's translation.json file (all 19 files), and no language
 * file should be missing any of the audit keys.
 *
 * **Validates: Requirements 3.3, 6.6, 6.7**
 */
describe('Feature: uikit-localization-audit, Property 1: Translation key parity across all language files', () => {
  it('should have every audit key present in all 19 language files', () => {
    fc.assert(
      fc.property(fc.constantFrom(...auditKeys), fc.constantFrom(...languageCodes), (key, lang) => {
        const translations = languageFiles[lang];
        expect(translations).toBeDefined();
        expect(key in translations, `Key "${key}" is missing in ${lang}/translation.json`).toBe(
          true
        );
      }),
      testConfig
    );
  });

  it('should have every audit key in en-us as the reference', () => {
    fc.assert(
      fc.property(fc.constantFrom(...auditKeys), key => {
        expect(key in enUs, `Audit key "${key}" is missing in en-us/translation.json`).toBe(true);
      }),
      testConfig
    );
  });

  it('should have non-empty values for all audit keys in every language', () => {
    fc.assert(
      fc.property(fc.constantFrom(...auditKeys), fc.constantFrom(...languageCodes), (key, lang) => {
        const value = languageFiles[lang][key];
        expect(
          typeof value === 'string' && value.length > 0,
          `Key "${key}" has empty or non-string value in ${lang}/translation.json`
        ).toBe(true);
      }),
      testConfig
    );
  });

  it('should have all 9 audit keys present in every language file (exhaustive check)', () => {
    for (const lang of languageCodes) {
      for (const key of auditKeys) {
        expect(
          key in languageFiles[lang],
          `Key "${key}" is missing in ${lang}/translation.json`
        ).toBe(true);
      }
    }
  });
});

/**
 * Feature: uikit-localization-audit, Property 2: No empty translation values
 *
 * For any randomly selected key and language, the value in that language's
 * translation.json must be a non-empty string. This ensures getLocalizedString()
 * never returns an empty string for a key that exists, eliminating the need
 * for fallback `|| 'string'` patterns.
 *
 * **Validates: Requirements 2.2, 3.2, 3.3, 6.4**
 */
describe('Feature: uikit-localization-audit, Property 2: No empty translation values', () => {
  it('should have a non-empty string value for any audit key in any language', () => {
    fc.assert(
      fc.property(fc.constantFrom(...auditKeys), fc.constantFrom(...languageCodes), (key, lang) => {
        const value = languageFiles[lang][key];
        expect(typeof value).toBe('string');
        expect(
          value.length,
          `Key "${key}" has empty value in ${lang}/translation.json`
        ).toBeGreaterThan(0);
      }),
      testConfig
    );
  });
});

import { CometChatLocalize } from './cometchat-localize';

/**
 * Mapping from JSON directory language codes (lowercase) to CometChatLocalize
 * internal language codes (mixed case) used in the translations map.
 */
const jsonToInternalLangCode: Record<string, string> = {
  de: 'de',
  'en-gb': 'en-GB',
  'en-us': 'en-US',
  es: 'es',
  fr: 'fr',
  hi: 'hi',
  hu: 'hu',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  lt: 'lt',
  ms: 'ms',
  nl: 'nl',
  pt: 'pt',
  ru: 'ru',
  sv: 'sv',
  tr: 'tr',
  zh: 'zh',
  'zh-tw': 'zh-TW',
};

/** All keys from en-us translation file for Property 3 */
const allEnUsKeys = Object.keys(enUs);

/**
 * Feature: uikit-localization-audit, Property 3: TranslatePipe returns active language value
 *
 * For any valid localization key and any supported language, when that language
 * is set as the current language via setCurrentLanguage(), CometChatLocalize.getLocalizedString(key)
 * must return the exact string stored in that language's translation.json for that key.
 *
 * Note: TranslatePipe.transform() delegates directly to CometChatLocalize.getLocalizedString()
 * so testing the static method is equivalent and avoids Angular DI setup.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */
describe('Feature: uikit-localization-audit, Property 3: TranslatePipe returns active language value', () => {
  afterEach(() => {
    // Reset to default language after each test
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  it('should return the exact value from the active language translation.json for any key', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allEnUsKeys),
        fc.constantFrom(...languageCodes),
        (key, jsonLangCode) => {
          const internalLangCode = jsonToInternalLangCode[jsonLangCode];
          const expectedValue = languageFiles[jsonLangCode][key];

          // Set the language via CometChatLocalize
          CometChatLocalize.setCurrentLanguage(internalLangCode);

          // Get the localized string (same as TranslatePipe.transform delegates to)
          const actualValue = CometChatLocalize.getLocalizedString(key);

          // If the key exists in this language file, the value must match exactly
          if (expectedValue !== undefined && expectedValue !== '') {
            expect(
              actualValue,
              `Key "${key}" in language "${jsonLangCode}": expected "${expectedValue}" but got "${actualValue}"`
            ).toBe(expectedValue);
          }
        }
      ),
      testConfig
    );
  });

  it('should return the correct value for audit keys across all languages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...auditKeys),
        fc.constantFrom(...languageCodes),
        (key, jsonLangCode) => {
          const internalLangCode = jsonToInternalLangCode[jsonLangCode];
          const expectedValue = languageFiles[jsonLangCode][key];

          CometChatLocalize.setCurrentLanguage(internalLangCode);
          const actualValue = CometChatLocalize.getLocalizedString(key);

          expect(
            actualValue,
            `Audit key "${key}" in "${jsonLangCode}": expected "${expectedValue}" but got "${actualValue}"`
          ).toBe(expectedValue);
        }
      ),
      testConfig
    );
  });
});

/**
 * Feature: uikit-localization-audit, Property 4: Language switch round-trip
 *
 * For any two supported languages A and B and any key, switching from A to B
 * and back to A must result in getLocalizedString(key) returning the same value
 * it returned before the switch.
 *
 * **Validates: Requirements 4.1, 4.2**
 */
describe('Feature: uikit-localization-audit, Property 4: Language switch round-trip', () => {
  afterEach(() => {
    // Reset to default language after each test
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  it('should return the same value after switching A→B→A for any key and any two languages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...languageCodes),
        fc.constantFrom(...languageCodes),
        fc.constantFrom(...allEnUsKeys),
        (langCodeA, langCodeB, key) => {
          const internalA = jsonToInternalLangCode[langCodeA];
          const internalB = jsonToInternalLangCode[langCodeB];

          // Step 1: Set language to A and record the value
          CometChatLocalize.setCurrentLanguage(internalA);
          const valueBefore = CometChatLocalize.getLocalizedString(key);

          // Step 2: Switch to B
          CometChatLocalize.setCurrentLanguage(internalB);

          // Step 3: Switch back to A
          CometChatLocalize.setCurrentLanguage(internalA);

          // Step 4: Verify the value matches the original
          const valueAfter = CometChatLocalize.getLocalizedString(key);

          expect(
            valueAfter,
            `Round-trip failed for key "${key}" with languages ${langCodeA}→${langCodeB}→${langCodeA}: ` +
              `expected "${valueBefore}" but got "${valueAfter}"`
          ).toBe(valueBefore);
        }
      ),
      testConfig
    );
  });
});

/**
 * Feature: uikit-localization-audit, Property 12: Localization key round-trip produces identical output
 *
 * For any localization key `k`, calling `CometChatLocalize.getLocalizedString(k)` to get
 * value `v`, then registering `v` as a new key `k2` via `addTranslation()`, then calling
 * `getLocalizedString(k2)` should return `v` unchanged.
 *
 * This verifies that translation values are stored and retrieved verbatim — no mutation,
 * encoding, or transformation occurs during registration or lookup.
 *
 * **Validates: Requirements 6.7**
 */
describe('Feature: uikit-localization-audit, Property 12: Localization key round-trip produces identical output', () => {
  afterEach(() => {
    // Reset to default language after each test
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  it('should return the same value when a translation value is re-registered as a new key (round-trip)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allEnUsKeys),
        fc.constantFrom(...languageCodes),
        (key, jsonLangCode) => {
          const internalLangCode = jsonToInternalLangCode[jsonLangCode];
          CometChatLocalize.setCurrentLanguage(internalLangCode);

          // Step 1: Get the localized value v for key k
          const v = CometChatLocalize.getLocalizedString(key);

          // Only test keys that have a non-empty value in this language
          if (!v || v === '') return true;

          // Step 2: Register v as a new key k2 in the current language
          const k2 = `__roundtrip_test_${key}_${jsonLangCode}__`;
          CometChatLocalize.addTranslation({ [internalLangCode]: { [k2]: v } });

          // Step 3: Retrieve k2 and verify it equals v
          const result = CometChatLocalize.getLocalizedString(k2);

          expect(
            result,
            `Round-trip failed for key "${key}" in "${jsonLangCode}": ` +
              `registered value "${v}" as key "${k2}", but got "${result}" back`
          ).toBe(v);

          return true;
        }
      ),
      testConfig
    );
  });

  it('should cover all registered en-us keys in the round-trip property', () => {
    // Exhaustive check: every key in en-us passes the round-trip in en-US
    CometChatLocalize.setCurrentLanguage('en-US');

    for (const key of allEnUsKeys) {
      const v = CometChatLocalize.getLocalizedString(key);
      if (!v || v === '') continue;

      const k2 = `__exhaustive_roundtrip_${key}__`;
      CometChatLocalize.addTranslation({ 'en-US': { [k2]: v } });

      const result = CometChatLocalize.getLocalizedString(k2);
      expect(
        result,
        `Exhaustive round-trip failed for key "${key}": registered "${v}" as "${k2}", got "${result}"`
      ).toBe(v);
    }
  });
});
