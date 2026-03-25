/**
 * CometChatLocalize Tests
 *
 * Categories: Initialization, Translation, Language Switching,
 *             Missing Key Fallback, Custom Translations, Date Formatting,
 *             Edge Cases
 * Validates: Requirements 9.1, 9.2, 9.3, 14.4, 14.5, 15.7
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../../test-setup';
import { CometChatLocalize, getLocalizedString } from './cometchat-localize';

describe('CometChatLocalize', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    // Reset to default state before each test
    CometChatLocalize.init({
      language: 'en-US',
      disableAutoDetection: true,
    });
  });

  // ---------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------
  describe('Initialization', () => {
    it('should default to en-US when initialized with disableAutoDetection', () => {
      CometChatLocalize.init({ disableAutoDetection: true });
      expect(CometChatLocalize.getCurrentLanguage()).toBe('en-US');
    });

    it('should initialize with a specific language', () => {
      CometChatLocalize.init({
        language: 'fr',
        disableAutoDetection: true,
      });
      expect(CometChatLocalize.getCurrentLanguage()).toBe('fr');
    });

    it('should set timezone from init settings', () => {
      CometChatLocalize.init({
        language: 'en-US',
        timezone: 'Asia/Tokyo',
        disableAutoDetection: true,
      });
      expect(CometChatLocalize.getTimezone()).toBe('Asia/Tokyo');
    });

    it('should apply calendarObject from init settings', () => {
      const customCalendar = {
        today: 'HH:mm',
        yesterday: '[Hier]',
        otherDays: 'YYYY-MM-DD',
      };
      CometChatLocalize.init({
        language: 'en-US',
        disableAutoDetection: true,
        calendarObject: customCalendar,
      });
      expect(CometChatLocalize.getCalendarObject()).toEqual(customCalendar);
    });

    it('should merge translationsForLanguage provided during init', () => {
      CometChatLocalize.init({
        language: 'en-US',
        disableAutoDetection: true,
        translationsForLanguage: {
          'en-US': { init_custom_key: 'Init Custom Value' },
        },
      });
      expect(CometChatLocalize.getLocalizedString('init_custom_key')).toBe('Init Custom Value');
    });
  });

  // ---------------------------------------------------------------
  // Translation — Requirement 9.1
  // ---------------------------------------------------------------
  describe('Translation', () => {
    it('should return correct English translation for a known key (Req 9.1)', () => {
      const result = CometChatLocalize.getLocalizedString('conversation_chat_title');
      expect(result).toBe('Chats');
    });

    it('should return correct translation for another known key', () => {
      expect(CometChatLocalize.getLocalizedString('user_title')).toBe('Users');
    });

    it('should return correct translation for group_title', () => {
      expect(CometChatLocalize.getLocalizedString('group_title')).toBe('Groups');
    });

    it('should work via the getLocalizedString helper function', () => {
      expect(getLocalizedString('conversation_chat_title')).toBe('Chats');
    });
  });

  // ---------------------------------------------------------------
  // Language Switching — Requirement 9.2
  // ---------------------------------------------------------------
  describe('Language Switching', () => {
    it('should return French translation after switching to fr (Req 9.2)', () => {
      CometChatLocalize.setCurrentLanguage('fr');
      expect(CometChatLocalize.getLocalizedString('conversation_chat_title')).toBe('Discussions');
    });

    it('should return French user_title after switching to fr', () => {
      CometChatLocalize.setCurrentLanguage('fr');
      expect(CometChatLocalize.getLocalizedString('user_title')).toBe('Utilisateurs');
    });

    it('should reflect the new language via getCurrentLanguage', () => {
      CometChatLocalize.setCurrentLanguage('es');
      expect(CometChatLocalize.getCurrentLanguage()).toBe('es');
    });

    it('should switch between multiple languages correctly', () => {
      CometChatLocalize.setCurrentLanguage('fr');
      const frResult = CometChatLocalize.getLocalizedString('user_title');
      expect(frResult).toBe('Utilisateurs');

      CometChatLocalize.setCurrentLanguage('en-US');
      const enResult = CometChatLocalize.getLocalizedString('user_title');
      expect(enResult).toBe('Users');

      // They must differ
      expect(frResult).not.toBe(enResult);
    });

    it('should fall back to fallback language when set to an invalid language', () => {
      CometChatLocalize.setCurrentLanguage('nonexistent-lang');
      expect(CometChatLocalize.getCurrentLanguage()).toBe('en-US');
    });

    it('should use custom fallbackLanguage when provided', () => {
      CometChatLocalize.init({
        language: 'en-US',
        fallbackLanguage: 'fr',
        disableAutoDetection: true,
      });
      CometChatLocalize.setCurrentLanguage('nonexistent-lang');
      expect(CometChatLocalize.getCurrentLanguage()).toBe('fr');
    });

    it('should preserve custom translations after language round-trip', () => {
      CometChatLocalize.addTranslation({
        'en-US': { roundtrip_key: 'Roundtrip Value' },
      });
      CometChatLocalize.setCurrentLanguage('fr');
      CometChatLocalize.setCurrentLanguage('en-US');
      expect(CometChatLocalize.getLocalizedString('roundtrip_key')).toBe('Roundtrip Value');
    });
  });

  // ---------------------------------------------------------------
  // Missing Key Fallback — Requirement 9.3
  // ---------------------------------------------------------------
  describe('Missing Key Fallback', () => {
    it('should return empty string for a completely unknown key (Req 9.3)', () => {
      const result = CometChatLocalize.getLocalizedString('this_key_absolutely_does_not_exist');
      expect(result).toBe('');
    });

    it('should return empty string for an empty key', () => {
      expect(CometChatLocalize.getLocalizedString('')).toBe('');
    });

    it('should fall back to fallback language when key missing in current language', () => {
      CometChatLocalize.init({
        language: 'en-US',
        fallbackLanguage: 'en-US',
        disableAutoDetection: true,
      });
      CometChatLocalize.addTranslation({
        'en-US': { only_in_english: 'English Only' },
      });
      CometChatLocalize.setCurrentLanguage('fr');
      expect(CometChatLocalize.getLocalizedString('only_in_english')).toBe('English Only');
    });

    it('should return empty string when key missing in both current and fallback', () => {
      CometChatLocalize.setCurrentLanguage('fr');
      expect(CometChatLocalize.getLocalizedString('completely_nonexistent_xyz')).toBe('');
    });

    it('should call missingKeyHandler when key is not found', () => {
      const handler = vi.fn();
      CometChatLocalize.init({
        language: 'en-US',
        disableAutoDetection: true,
        missingKeyHandler: handler,
      });
      CometChatLocalize.getLocalizedString('missing_handler_test_key');
      expect(handler).toHaveBeenCalledWith('missing_handler_test_key');
    });

    it('should NOT call missingKeyHandler when key exists', () => {
      const handler = vi.fn();
      CometChatLocalize.init({
        language: 'en-US',
        disableAutoDetection: true,
        missingKeyHandler: handler,
      });
      CometChatLocalize.getLocalizedString('conversation_chat_title');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // Custom Translations
  // ---------------------------------------------------------------
  describe('Custom Translations', () => {
    it('should add and retrieve a custom translation', () => {
      CometChatLocalize.addTranslation({
        'en-US': { custom_key: 'Custom Value' },
      });
      expect(CometChatLocalize.getLocalizedString('custom_key')).toBe('Custom Value');
    });

    it('should override an existing key via addTranslation', () => {
      CometChatLocalize.addTranslation({
        'en-US': { conversation_chat_title: 'My Chats' },
      });
      expect(CometChatLocalize.getLocalizedString('conversation_chat_title')).toBe('My Chats');
    });

    it('should add translations for multiple languages at once', () => {
      CometChatLocalize.addTranslation({
        'en-US': { multi_key: 'English Multi' },
        es: { multi_key: 'Spanish Multi' },
        fr: { multi_key: 'French Multi' },
      });
      expect(CometChatLocalize.getLocalizedString('multi_key')).toBe('English Multi');
      CometChatLocalize.setCurrentLanguage('es');
      expect(CometChatLocalize.getLocalizedString('multi_key')).toBe('Spanish Multi');
      CometChatLocalize.setCurrentLanguage('fr');
      expect(CometChatLocalize.getLocalizedString('multi_key')).toBe('French Multi');
    });

    it('should not lose existing keys when adding new translations', () => {
      const original = CometChatLocalize.getLocalizedString('conversation_chat_title');
      CometChatLocalize.addTranslation({
        'en-US': { brand_new_key: 'Brand New' },
      });
      expect(CometChatLocalize.getLocalizedString('conversation_chat_title')).toBe(original);
      expect(CometChatLocalize.getLocalizedString('brand_new_key')).toBe('Brand New');
    });

    it('should register a completely new language via addTranslation', () => {
      expect(CometChatLocalize.isLanguageAvailable('pirate')).toBe(false);
      CometChatLocalize.addTranslation({
        pirate: { greeting: 'Ahoy!' },
      });
      expect(CometChatLocalize.isLanguageAvailable('pirate')).toBe(true);
      CometChatLocalize.setCurrentLanguage('pirate');
      expect(CometChatLocalize.getLocalizedString('greeting')).toBe('Ahoy!');
    });
  });

  // ---------------------------------------------------------------
  // Available Languages
  // ---------------------------------------------------------------
  describe('Available Languages', () => {
    it('should list all built-in languages', () => {
      const expected = [
        'en-US',
        'en-GB',
        'ru',
        'fr',
        'de',
        'zh',
        'zh-TW',
        'es',
        'hi',
        'ms',
        'pt',
        'sv',
        'lt',
        'hu',
        'it',
        'ja',
        'ko',
        'nl',
        'tr',
      ];
      const available = CometChatLocalize.getAvailableLanguages();
      for (const lang of expected) {
        expect(available).toContain(lang);
      }
    });

    it('should return true for available language and false for unavailable', () => {
      expect(CometChatLocalize.isLanguageAvailable('en-US')).toBe(true);
      expect(CometChatLocalize.isLanguageAvailable('xx-YY')).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // Date Locale Language
  // ---------------------------------------------------------------
  describe('Date Locale Language', () => {
    it('should return current language for date locale by default', () => {
      CometChatLocalize.init({ language: 'fr', disableAutoDetection: true });
      expect(CometChatLocalize.getDateLocaleLanguage()).toBe('fr');
    });

    it('should return en-US when disableDateTimeLocalization is true', () => {
      CometChatLocalize.init({
        language: 'fr',
        disableAutoDetection: true,
        disableDateTimeLocalization: true,
      });
      expect(CometChatLocalize.getDateLocaleLanguage()).toBe('en-US');
    });
  });

  // ---------------------------------------------------------------
  // Browser Language Detection
  // ---------------------------------------------------------------
  describe('Browser Language Detection', () => {
    it('should return a non-empty string from getBrowserLanguage', () => {
      const lang = CometChatLocalize.getBrowserLanguage();
      expect(typeof lang).toBe('string');
      expect(lang.length).toBeGreaterThan(0);
    });

    it('should use fallback when auto-detection is disabled and no language set', () => {
      CometChatLocalize.init({ disableAutoDetection: true });
      expect(CometChatLocalize.getDefaultLanguage()).toBe('en-US');
    });
  });

  // ---------------------------------------------------------------
  // Date Formatting
  // ---------------------------------------------------------------
  describe('Date Formatting', () => {
    it('should format a current timestamp with today pattern', () => {
      const now = Math.floor(Date.now() / 1000);
      const result = CometChatLocalize.formatDate(now, {
        today: 'h:mm A',
        yesterday: '[Yesterday]',
        lastWeek: 'dddd',
        otherDays: 'DD/MM/YYYY',
      });
      expect(result).toBeTruthy();
    });

    it('should format relative time with minutes pattern', () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
      const result = CometChatLocalize.formatDate(fiveMinutesAgo, {
        today: 'h:mm A',
        relativeTime: { minutes: '%d minutes ago' },
      });
      expect(result).toContain('minutes ago');
    });

    it('should format relative time with single minute pattern', () => {
      const thirtySecondsAgo = Math.floor(Date.now() / 1000) - 30;
      const result = CometChatLocalize.formatDate(thirtySecondsAgo, {
        today: 'h:mm A',
        relativeTime: { minute: '%d minute ago', minutes: '%d minutes ago' },
      });
      expect(result).toBe('1 minute ago');
    });

    it('should format relative time with hours pattern', () => {
      const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
      const result = CometChatLocalize.formatDate(twoHoursAgo, {
        today: 'h:mm A',
        relativeTime: { hours: '%d hours ago' },
      });
      expect(result).toBe('2 hours ago');
    });

    it('should format old date with otherDays DD/MM/YYYY pattern', () => {
      const sixtyDaysAgo = Math.floor(Date.now() / 1000) - 60 * 86400;
      const result = CometChatLocalize.formatDate(sixtyDaysAgo, {
        today: 'h:mm A',
        yesterday: '[Yesterday]',
        lastWeek: 'dddd',
        otherDays: 'DD/MM/YYYY',
      });
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle millisecond timestamps', () => {
      const nowMs = Date.now();
      const result = CometChatLocalize.formatDate(nowMs, {
        today: 'h:mm A',
        otherDays: 'DD/MM/YYYY',
      });
      expect(result).toBeTruthy();
    });

    it('should use default DD/MM/YYYY when otherDays not specified', () => {
      const veryOld = Math.floor(Date.now() / 1000) - 365 * 86400;
      const result = CometChatLocalize.formatDate(veryOld, {});
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  // ---------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle key with empty string translation value', () => {
      CometChatLocalize.addTranslation({
        'en-US': { empty_value_key: '' },
      });
      // Empty string value triggers fallback behavior
      expect(CometChatLocalize.getLocalizedString('empty_value_key')).toBe('');
    });

    it('should retain calendar object when re-init called without one', () => {
      const customCalendar = { today: 'HH:mm', otherDays: 'YYYY-MM-DD' };
      CometChatLocalize.init({
        language: 'en-US',
        disableAutoDetection: true,
        calendarObject: customCalendar,
      });
      CometChatLocalize.init({ language: 'en-US', disableAutoDetection: true });
      expect(CometChatLocalize.getCalendarObject()).toEqual(customCalendar);
    });

    it('should use a default timezone when none specified', () => {
      CometChatLocalize.init({ language: 'en-US', disableAutoDetection: true });
      const tz = CometChatLocalize.getTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });
  });
});
