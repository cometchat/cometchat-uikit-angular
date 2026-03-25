// Feature: storybook-enterprise-overhaul, Property 1: Locale switch updates all translated strings

import * as fc from 'fast-check';
import { CometChatLocalize } from '../../projects/cometchat-uikit/src/lib/resources/CometChatLocalize/cometchat-localize';

describe('Property 1: Locale switch updates all translated strings', () => {
  const availableLocales = CometChatLocalize.getAvailableLanguages();

  afterEach(() => {
    // Reset to default after each test
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  it('should return a non-empty string for conversation_chat_title in every supported locale', () => {
    fc.assert(
      fc.property(fc.constantFrom(...availableLocales), (locale) => {
        CometChatLocalize.setCurrentLanguage(locale);
        const result = CometChatLocalize.getLocalizedString('conversation_chat_title');
        return typeof result === 'string' && result.length > 0;
      })
    );
  });

  it('should update getCurrentLanguage to the requested locale after setCurrentLanguage', () => {
    fc.assert(
      fc.property(fc.constantFrom(...availableLocales), (locale) => {
        CometChatLocalize.setCurrentLanguage(locale);
        return CometChatLocalize.getCurrentLanguage() === locale;
      })
    );
  });

  it('should return non-empty strings for a set of common keys across all locales', () => {
    const commonKeys = [
      'conversation_chat_title',
      'conversation_subtitle_typing',
      'conversation_search_placeholder',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...availableLocales),
        fc.constantFrom(...commonKeys),
        (locale, key) => {
          CometChatLocalize.setCurrentLanguage(locale);
          const result = CometChatLocalize.getLocalizedString(key);
          return typeof result === 'string' && result.length > 0;
        }
      )
    );
  });

  it('should have all 19 expected BCP-47 locales available', () => {
    const expected = [
      'en-US', 'en-GB', 'de', 'es', 'fr', 'hi', 'hu', 'it',
      'ja', 'ko', 'lt', 'ms', 'nl', 'pt', 'ru', 'sv', 'tr', 'zh', 'zh-TW',
    ];
    for (const locale of expected) {
      expect(CometChatLocalize.isLanguageAvailable(locale)).toBe(true);
    }
  });
});
