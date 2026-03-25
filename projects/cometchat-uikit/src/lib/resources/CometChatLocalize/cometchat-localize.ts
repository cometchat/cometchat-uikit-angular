import { LocalizationSettings, CalendarObject } from './localization.interfaces';

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
  private static languageCalendarDefaults: Record<string, CalendarObject> = {
    'en-US': { today: 'hh:mm A', yesterday: '[Yesterday]', lastWeek: 'dddd', otherDays: 'MM/DD/YYYY' },
    'en-GB': { today: 'HH:mm', yesterday: '[Yesterday]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
    de: { today: 'HH:mm', yesterday: '[Gestern]', lastWeek: 'dddd', otherDays: 'DD.MM.YYYY' },
    fr: { today: 'HH:mm', yesterday: '[Hier]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
    es: { today: 'HH:mm', yesterday: '[Ayer]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
    ja: { today: 'HH:mm', yesterday: '[昨日]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
    ko: { today: 'HH:mm', yesterday: '[어제]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
    zh: { today: 'HH:mm', yesterday: '[昨天]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
    'zh-TW': { today: 'HH:mm', yesterday: '[昨天]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
    ru: { today: 'HH:mm', yesterday: '[Вчера]', lastWeek: 'dddd', otherDays: 'DD.MM.YYYY' },
    hi: { today: 'hh:mm A', yesterday: '[कल]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
    ms: { today: 'HH:mm', yesterday: '[Semalam]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
    pt: { today: 'HH:mm', yesterday: '[Ontem]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
    sv: { today: 'HH:mm', yesterday: '[Igår]', lastWeek: 'dddd', otherDays: 'YYYY-MM-DD' },
    lt: { today: 'HH:mm', yesterday: '[Vakar]', lastWeek: 'dddd', otherDays: 'YYYY-MM-DD' },
    hu: { today: 'HH:mm', yesterday: '[Tegnap]', lastWeek: 'dddd', otherDays: 'YYYY.MM.DD' },
    it: { today: 'HH:mm', yesterday: '[Ieri]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
    nl: { today: 'HH:mm', yesterday: '[Gisteren]', lastWeek: 'dddd', otherDays: 'DD-MM-YYYY' },
    tr: { today: 'HH:mm', yesterday: '[Dün]', lastWeek: 'dddd', otherDays: 'DD.MM.YYYY' },
  };

  /** Whether to disable automatic language detection */
  private static disableAutoDetection = false;

  /** Whether to disable date/time localization */
  private static disableDateTimeLocalization = false;

  /** Default timezones for each language */
  private static defaultTimezones: Record<string, string> = {
    'en-US': 'America/New_York',
    'en-GB': 'Europe/London',
    ru: 'Europe/Moscow',
    fr: 'Europe/Paris',
    de: 'Europe/Berlin',
    zh: 'Asia/Shanghai',
    'zh-TW': 'Asia/Taipei',
    es: 'Europe/Madrid',
    hi: 'Asia/Kolkata',
    ms: 'Asia/Kuala_Lumpur',
    pt: 'Europe/Lisbon',
    sv: 'Europe/Stockholm',
    lt: 'Europe/Vilnius',
    hu: 'Europe/Budapest',
    it: 'Europe/Rome',
    ja: 'Asia/Tokyo',
    ko: 'Asia/Seoul',
    nl: 'Europe/Amsterdam',
    tr: 'Europe/Istanbul',
  };

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
   *
   * @param date - The date to format
   * @param format - The format pattern
   * @returns The formatted date string
   */
  private static formatDateFromPattern(date: Date, format: string): string {
    const options: Intl.DateTimeFormatOptions = {
      day: format.includes('D') ? '2-digit' : undefined,
      month:
        format.includes('MMMM') ||
        format.includes('MMM') ||
        format.includes('MM') ||
        format.includes('M')
          ? '2-digit'
          : undefined,
      year: format.includes('YYYY') ? 'numeric' : format.includes('YY') ? '2-digit' : undefined,
      hour: format.includes('hh') ? '2-digit' : format.includes('h') ? 'numeric' : undefined,
      minute: format.includes('mm') ? '2-digit' : format.includes('m') ? 'numeric' : undefined,
      hour12: format.includes('A'),
      weekday: format.includes('dddd')
        ? 'long'
        : format.includes('ddd') || format.includes('dd')
          ? 'short'
          : undefined,
      timeZone: this.timezone,
    };

    const monthNames = {
      short: [
        this.getLocalizedString('month_january_short'),
        this.getLocalizedString('month_february_short'),
        this.getLocalizedString('month_march_short'),
        this.getLocalizedString('month_april_short'),
        this.getLocalizedString('month_may_short'),
        this.getLocalizedString('month_june_short'),
        this.getLocalizedString('month_july_short'),
        this.getLocalizedString('month_august_short'),
        this.getLocalizedString('month_september_short'),
        this.getLocalizedString('month_october_short'),
        this.getLocalizedString('month_november_short'),
        this.getLocalizedString('month_december_short'),
      ],
      long: [
        this.getLocalizedString('month_january_full'),
        this.getLocalizedString('month_february_full'),
        this.getLocalizedString('month_march_full'),
        this.getLocalizedString('month_april_full'),
        this.getLocalizedString('month_may_full'),
        this.getLocalizedString('month_june_full'),
        this.getLocalizedString('month_july_full'),
        this.getLocalizedString('month_august_full'),
        this.getLocalizedString('month_september_full'),
        this.getLocalizedString('month_october_full'),
        this.getLocalizedString('month_november_full'),
        this.getLocalizedString('month_december_full'),
      ],
    };

    const weekdays = {
      min: [
        this.getLocalizedString('weekday_sunday_min'),
        this.getLocalizedString('weekday_monday_min'),
        this.getLocalizedString('weekday_tuesday_min'),
        this.getLocalizedString('weekday_wednesday_min'),
        this.getLocalizedString('weekday_thursday_min'),
        this.getLocalizedString('weekday_friday_min'),
        this.getLocalizedString('weekday_saturday_min'),
      ],
      short: [
        this.getLocalizedString('weekday_sunday_short'),
        this.getLocalizedString('weekday_monday_short'),
        this.getLocalizedString('weekday_tuesday_short'),
        this.getLocalizedString('weekday_wednesday_short'),
        this.getLocalizedString('weekday_thursday_short'),
        this.getLocalizedString('weekday_friday_short'),
        this.getLocalizedString('weekday_saturday_short'),
      ],
      long: [
        this.getLocalizedString('weekday_sunday_full'),
        this.getLocalizedString('weekday_monday_full'),
        this.getLocalizedString('weekday_tuesday_full'),
        this.getLocalizedString('weekday_wednesday_full'),
        this.getLocalizedString('weekday_thursday_full'),
        this.getLocalizedString('weekday_friday_full'),
        this.getLocalizedString('weekday_saturday_full'),
      ],
    };

    const formatter = new Intl.DateTimeFormat(this.getDateLocaleLanguage(), options);
    const parts = formatter.formatToParts(date);
    const dayIndex = date.getDay();

    const replacements: Record<string, string> = {};
    parts.forEach(part => {
      if (part.type === 'day') {
        replacements['DD'] = part.value;
        replacements['D'] = parseInt(part.value).toString();
      }
      if (part.type === 'month') {
        const monthIndex = parseInt(part.value) - 1;
        replacements['MM'] = part.value;
        replacements['M'] = parseInt(part.value).toString();
        replacements['MMM'] = monthNames.short[monthIndex] || part.value;
        replacements['MMMM'] = monthNames.long[monthIndex] || part.value;
      }
      if (part.type === 'year') {
        replacements['YYYY'] = part.value;
        replacements['YY'] = part.value.slice(-2);
      }
      if (part.type === 'hour') {
        replacements['hh'] = part.value;
        replacements['h'] = parseInt(part.value).toString();
      }
      if (part.type === 'minute') {
        replacements['mm'] = part.value;
        replacements['m'] = parseInt(part.value).toString();
      }
      if (part.type === 'dayPeriod') {
        replacements['A'] = part.value;
      }
      if (part.type === 'weekday') {
        replacements['dddd'] = weekdays.long[dayIndex] || '';
        replacements['ddd'] = weekdays.short[dayIndex] || '';
        replacements['dd'] = weekdays.min[dayIndex] || '';
      }
    });

    return format
      .replace(/\[(.*?)\]/g, '$1')
      .replace(/\bDD\b/g, replacements['DD'] || '')
      .replace(/\bD\b/g, replacements['D'] || '')
      .replace(/\bMMMM\b/g, replacements['MMMM'] || '')
      .replace(/\bMMM\b/g, replacements['MMM'] || '')
      .replace(/\bMM\b/g, replacements['MM'] || '')
      .replace(/\bM\b/g, replacements['M'] || '')
      .replace(/\bYYYY\b/g, replacements['YYYY'] || '')
      .replace(/\bYY\b/g, replacements['YY'] || '')
      .replace(/\bhh\b/g, replacements['hh'] || '')
      .replace(/\bh\b/g, replacements['h'] || '')
      .replace(/\bmm\b/g, replacements['mm'] || '')
      .replace(/\bm\b/g, replacements['m'] || '')
      .replace(/\bdddd\b/g, replacements['dddd'] || '')
      .replace(/\bddd\b/g, replacements['ddd'] || '')
      .replace(/\bdd\b/g, replacements['dd'] || '')
      .replace(/\sA\s/g, ` ${replacements['A'] || 'A'} `)
      .replace(/^A\s/g, `${replacements['A'] || 'A'} `)
      .replace(/\sA$/, ` ${replacements['A'] || 'A'}`)
      .replace(/^A$/, `${replacements['A'] || 'A'}`);
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
    const timeZone = this.timezone;
    const now = new Date();
    const date = new Date(timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp);

    const nowFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const dateFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);

    const nowTime = now.getTime();
    const dateTime = date.getTime();
    const diffInSeconds = Math.floor((nowTime - dateTime) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Handle relative time
    if (calendarObject.relativeTime && Object.keys(calendarObject.relativeTime).length > 0) {
      if (diffInSeconds < 60) {
        if (calendarObject.relativeTime.minute) {
          return calendarObject.relativeTime.minute.includes('%d')
            ? calendarObject.relativeTime.minute.replace('%d', '1')
            : calendarObject.relativeTime.minute;
        } else if (calendarObject.today) {
          return this.formatDateFromPattern(date, calendarObject.today);
        }
      }
      if (diffInMinutes < 60) {
        if (calendarObject.relativeTime.minutes) {
          return calendarObject.relativeTime.minutes.includes('%d')
            ? calendarObject.relativeTime.minutes.replace('%d', String(diffInMinutes))
            : calendarObject.relativeTime.minutes;
        } else if (calendarObject.today) {
          return this.formatDateFromPattern(date, calendarObject.today);
        }
      }
      if (diffInHours < 24) {
        if (calendarObject.relativeTime.hour && diffInHours === 1) {
          return calendarObject.relativeTime.hour.replace('%d', '1');
        }
        if (calendarObject.relativeTime.hours) {
          return calendarObject.relativeTime.hours.replace('%d', String(diffInHours));
        }
      }
    }

    // Handle today
    if (nowFormatted === dateFormatted && calendarObject.today) {
      return this.formatDateFromPattern(date, calendarObject.today);
    }

    // Handle yesterday
    if (this.isYesterday(timestamp, timeZone) && calendarObject.yesterday) {
      return this.formatDateFromPattern(date, calendarObject.yesterday);
    }

    // Handle last week
    if (diffInDays <= 7 && calendarObject.lastWeek) {
      return this.formatDateFromPattern(date, calendarObject.lastWeek);
    }

    // Handle other days
    return this.formatDateFromPattern(date, calendarObject.otherDays || 'DD/MM/YYYY');
  }

  /**
   * Checks if a timestamp represents yesterday's date.
   */
  private static isYesterday(timestamp: number, timeZone: string): boolean {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const timestampDate = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(timestamp * 1000));

    const yesterdayDate = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(yesterday);

    return timestampDate === yesterdayDate;
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
