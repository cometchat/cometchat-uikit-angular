import { LocalizationSettings, CalendarObject } from './localization.interfaces';
import { LANGUAGE_CALENDAR_DEFAULTS, DEFAULT_TIMEZONES } from './localize-data';
import { formatDateFromPattern, formatDate as formatDateHelper, isYesterday } from './localize-helpers';

// Import all translation files
import translationDE from './resources/de/translation.json';
import translationENUS from './resources/en-us/translation.json';
import translationENGB from './resources/en-gb/translation.json';
import translationES from './resources/es/translation.json';
import translationFR from './resources/fr/translation.json';
import translationHI from './resources/hi/translation.json';
import translationMS from './resources/ms/translation.json';
import translationPT from './resources/pt/translation.json';
import translationRU from './resources/ru/translation.json';
import translationZH from './resources/zh/translation.json';
import translationZHTW from './resources/zh-tw/translation.json';
import translationSV from './resources/sv/translation.json';
import translationLT from './resources/lt/translation.json';
import translationHU from './resources/hu/translation.json';
import translationTR from './resources/tr/translation.json';
import translationNL from './resources/nl/translation.json';
import translationIT from './resources/it/translation.json';
import translationJA from './resources/ja/translation.json';
import translationKO from './resources/ko/translation.json';

/**
 * The `CometChatLocalize` class handles localization for the CometChat Angular UIKit.
 *
 * It provides functionality to:
 * - Detect the user's browser language settings
 * - Set and switch the application's language at runtime
 * - Translate keys to localized strings
 * - Format dates with localization support
 * - Add custom translations
 *
 * @example
 * // Initialize with settings
 * CometChatLocalize.init({
 *   language: 'es',
 *   timezone: 'Europe/Madrid'
 * });
 *
 * // Get a translated string
 * const text = CometChatLocalize.getLocalizedString('conversation_chat_title');
 *
 * // Switch language at runtime
 * CometChatLocalize.setCurrentLanguage('fr');
 */
export class CometChatLocalize {
  /** Current active language */
  private static language = 'en-US';

  /** Fallback language when translation is not found */
  private static fallbackLanguage = 'en-US';

  /** Current timezone for date formatting */
  private static timezone = 'America/New_York';

  /** All available translations */
  private static translations: Record<string, Record<string, string>> = {
    'en-US': translationENUS,
    'en-GB': translationENGB,
    ru: translationRU,
    fr: translationFR,
    de: translationDE,
    zh: translationZH,
    'zh-TW': translationZHTW,
    es: translationES,
    hi: translationHI,
    ms: translationMS,
    pt: translationPT,
    sv: translationSV,
    lt: translationLT,
    hu: translationHU,
    it: translationIT,
    ja: translationJA,
    ko: translationKO,
    nl: translationNL,
    tr: translationTR,
  };

  /** Current localization settings */
  private static localizationSettings: LocalizationSettings = {};

  /** Calendar object for date formatting */
  private static calendarObject: CalendarObject = {};

  /** Whether a custom global CalendarObject was explicitly set by the developer */
  private static customCalendarObjectSet = false;

  /** Language-specific default CalendarObjects */
  private static languageCalendarDefaults: Record<string, CalendarObject> = LANGUAGE_CALENDAR_DEFAULTS;

  /** Whether to disable automatic language detection */
  private static disableAutoDetection = false;

  /** Whether to disable date/time localization */
  private static disableDateTimeLocalization = false;

  /** Default timezones for each language */
  private static defaultTimezones: Record<string, string> = DEFAULT_TIMEZONES;

  /**
   * Initializes the localization service with the provided settings.
   *
   * @param settings - The localization settings to apply
   *
   * @example
   * CometChatLocalize.init({
   *   language: 'es',
   *   timezone: 'Europe/Madrid',
   *   fallbackLanguage: 'en-US',
   *   disableAutoDetection: false
   * });
   */
  static init(settings: LocalizationSettings): void {
    this.localizationSettings = settings;
    this.disableAutoDetection = settings.disableAutoDetection || false;
    this.disableDateTimeLocalization = settings.disableDateTimeLocalization || false;

    if (!settings.language) {
      this.language = this.getDefaultLanguage();
    } else {
      this.language = settings.language;
    }

    this.timezone = settings.timezone || this.getDefaultTimeZone();

    if (settings.calendarObject) {
      this.calendarObject = settings.calendarObject;
      this.customCalendarObjectSet = true;
    }

    this.fallbackLanguage = settings.fallbackLanguage || this.fallbackLanguage;

    if (settings.translationsForLanguage) {
      this.addTranslation(settings.translationsForLanguage);
    }
  }

  /**
   * Adds custom translations to the existing translations.
   *
   * @param resources - Object containing language codes as keys and translation objects as values
   *
   * @example
   * CometChatLocalize.addTranslation({
   *   'en-US': { 'custom_key': 'Custom Value' },
   *   'es': { 'custom_key': 'Valor Personalizado' }
   * });
   */
  static addTranslation(resources: Record<string, Record<string, string>>): void {
    for (const resource in resources) {
      if (!this.translations[resource]) {
        this.translations[resource] = resources[resource];
      } else {
        Object.assign(this.translations[resource], resources[resource]);
      }
    }
  }

  /**
   * Returns the browser's preferred language.
   *
   * @returns The browser language code (e.g., 'en-US')
   */
  static getBrowserLanguage(): string {
    if (typeof navigator === 'undefined') {
      return 'en-US';
    }
    return (navigator.languages && navigator.languages[0]) || navigator.language || 'en-US';
  }

  /**
   * Translates a key to the localized string in the current language.
   *
   * @param key - The translation key to look up
   * @returns The translated string, or empty string if not found
   *
   * @example
   * const title = CometChatLocalize.getLocalizedString('conversation_chat_title');
   * // Returns "Chats" in English
   */
  static getLocalizedString(key: string): string {
    const language = this.getCurrentLanguage();
    const translations = this.translations[language];

    if (key && translations && translations[key] && translations[key] !== '') {
      return translations[key];
    }

    // Try fallback language
    const fallbackTranslations = this.translations[this.fallbackLanguage];
    if (key && fallbackTranslations && fallbackTranslations[key]) {
      return fallbackTranslations[key];
    }

    // Call missing key handler if provided
    if (this.localizationSettings.missingKeyHandler) {
      this.localizationSettings.missingKeyHandler(key);
    }

    return '';
  }

  /**
   * Gets the current active language.
   *
   * @returns The current language code
   */
  static getCurrentLanguage(): string {
    return this.translations[this.language] ? this.language : this.fallbackLanguage;
  }

  /**
   * Sets the current language and reinitializes with the new language.
   *
   * @param language - The language code to set
   *
   * @example
   * CometChatLocalize.setCurrentLanguage('fr');
   */
  static setCurrentLanguage(language: string): void {
    this.language = language;
    if (!this.customCalendarObjectSet) {
      this.calendarObject = this.languageCalendarDefaults[language] || {};
    }
    CometChatLocalize.init({ ...this.localizationSettings, language });
  }

  /**
   * Gets the default language based on settings or browser detection.
   *
   * @returns The default language code
   */
  static getDefaultLanguage(): string {
    if (this.disableAutoDetection) {
      return this.fallbackLanguage;
    }
    return this.getBrowserLanguage();
  }

  /**
   * Gets the language to use for date localization.
   *
   * @returns The language code for date formatting
   */
  static getDateLocaleLanguage(): string {
    if (this.disableDateTimeLocalization) {
      return 'en-US';
    }
    return this.language;
  }

  /**
   * Gets the current timezone.
   *
   * @returns The current timezone string
   */
  static getTimezone(): string {
    return this.timezone;
  }

  /**
   * Gets the calendar object for date formatting.
   * Returns: custom CalendarObject if explicitly set, else language-specific default, else empty object.
   *
   * @returns The calendar object configuration
   */
  static getCalendarObject(): CalendarObject {
    if (this.customCalendarObjectSet) {
      return this.calendarObject;
    }
    return this.languageCalendarDefaults[this.language] || {};
  }

  /**
   * Sets the global CalendarObject at runtime.
   * Marks the CalendarObject as explicitly set so language switching won't override it.
   *
   * @param calendarObject - The CalendarObject to set globally
   *
   * @example
   * CometChatLocalize.setGlobalCalendarObject({
   *   today: 'HH:mm',
   *   yesterday: '[Yesterday]',
   *   lastWeek: 'dddd',
   *   otherDays: 'DD/MM/YYYY'
   * });
   */
  static setGlobalCalendarObject(calendarObject: CalendarObject): void {
    this.calendarObject = calendarObject;
    this.customCalendarObjectSet = true;
  }

  /**
   * Gets the default timezone based on language or system detection.
   */
  private static getDefaultTimeZone(): string {
    try {
      if (this.disableAutoDetection) {
        return this.defaultTimezones[this.language] || 'UTC';
      }
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return this.defaultTimezones[this.language] || 'UTC';
    }
  }

  /**
   * Formats a date using a given pattern with localization support.
   * Delegates to the standalone helper in localize-helpers.ts.
   */
  private static formatDateFromPattern(date: Date, format: string): string {
    return formatDateFromPattern(
      date,
      format,
      this.timezone,
      this.getDateLocaleLanguage(),
      (key: string) => this.getLocalizedString(key)
    );
  }

  /**
   * Formats a Unix timestamp based on the provided calendar configuration.
   *
   * @param timestamp - Unix timestamp in seconds
   * @param calendarObject - Calendar configuration for formatting
   * @returns Formatted date string
   *
   * @example
   * const formatted = CometChatLocalize.formatDate(1640000000, {
   *   today: 'h:mm A',
   *   yesterday: '[Yesterday] h:mm A',
   *   lastWeek: 'dddd h:mm A',
   *   otherDays: 'DD/MM/YYYY'
   * });
   */
  static formatDate(timestamp: number, calendarObject: CalendarObject): string {
    return formatDateHelper(
      timestamp,
      calendarObject,
      this.timezone,
      this.getDateLocaleLanguage(),
      (key: string) => this.getLocalizedString(key)
    );
  }

  /**
   * Gets all available language codes.
   *
   * @returns Array of available language codes
   */
  static getAvailableLanguages(): string[] {
    return Object.keys(this.translations);
  }

  /**
   * Checks if a language is available.
   *
   * @param language - The language code to check
   * @returns True if the language is available
   */
  static isLanguageAvailable(language: string): boolean {
    return !!this.translations[language];
  }
}

/**
 * Helper function to get a localized string.
 * Shorthand for CometChatLocalize.getLocalizedString()
 *
 * @param key - The translation key
 * @returns The translated string
 */
export const getLocalizedString = (key: string): string =>
  CometChatLocalize.getLocalizedString(key);
