import { LocalizationSettings, CalendarObject } from './localization.interfaces';
import { LANGUAGE_CALENDAR_DEFAULTS, DEFAULT_TIMEZONES } from './localize-data';
import {
  formatDateFromPattern,
  formatDate as formatDateHelper,
  isYesterday,
  formatDurationLong,
  formatDurationShort,
} from './localize-helpers';

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
    if (this.translations[this.language]) return this.language;

    // The browser reports a region-tagged code and `init` stores it verbatim,
    // but the bundles are keyed by base language. Without this step `de-DE`
    // found no bundle and fell straight to `fallbackLanguage`, so the whole UI
    // rendered in English for anyone whose browser reports a region — which is
    // most of them. Delete read "Delete" rather than "Löschen".
    // Chinese script: an explicit subtag wins, since `zh-Hans-HK` asks for
    // Simplified even though Hong Kong ordinarily writes Traditional. Only
    // when no script is given does the region decide.
    const tag = this.language || '';
    if (/^zh\b/i.test(tag)) {
      const script = /\bHans\b/i.test(tag) ? 'Hans' : /\bHant\b/i.test(tag) ? 'Hant' : null;
      const traditional =
        script === 'Hant' || (script === null && /\b(HK|MO|TW)\b/i.test(tag));
      const bundle = traditional ? 'zh-TW' : 'zh';
      if (this.translations[bundle]) return bundle;
    }

    const base = this.language?.split('-')[0];
    if (base && this.translations[base]) return base;

    return this.fallbackLanguage;
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
    // Resolved the same way as the pattern getters, so a region-tagged code
    // such as `de-DE` returns the German defaults rather than an empty object.
    return this.localizedCalendarDefaults();
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
   * The default timezone for the active language.
   *
   * Keyed by base language like the calendar table, so a region-tagged code
   * resolves instead of dropping straight to UTC.
   *
   * @returns An IANA timezone identifier
   */
  private static resolveDefaultTimezone(): string {
    const locale = this.language || '';
    return this.defaultTimezones[locale] || this.defaultTimezones[locale.split('-')[0]] || 'UTC';
  }

  /**
   * Gets the default timezone based on language or system detection.
   */
  private static getDefaultTimeZone(): string {
    try {
      if (this.disableAutoDetection) {
        return this.resolveDefaultTimezone();
      }
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return this.resolveDefaultTimezone();
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
   * Whether the integrator set a global CalendarObject explicitly.
   *
   * `getCalendarObject()` falls back to the per-language defaults, so its
   * return value alone cannot tell a deliberate override from a default.
   * Components that merge their own format with the global one need that
   * distinction, or the language default silently wins over their format.
   *
   * @returns True when `setGlobalCalendarObject` (or an init-time CalendarObject) was used
   */
  static hasCustomCalendarObject(): boolean {
    return this.customCalendarObjectSet;
  }

  /**
   * Derives a CalendarObject from the platform's own data for a locale the kit
   * has no entry for.
   *
   * `Intl` knows the conventions of every locale the browser supports, so a
   * region-tagged code with no base-language entry — `en-AU`, `en-NZ` — still
   * gets its own field order and clock instead of falling back to US English.
   *
   * @param locale - BCP 47 language tag
   * @returns The derived defaults, or null when the platform cannot format the locale
   */
  private static readonly derivedCalendarCache = new Map<string, CalendarObject | null>();

  /**
   * Turns `Intl` date parts into a pattern string.
   *
   * Literal parts are wrapped in brackets so the formatter treats them as text.
   * Without that, a locale whose separator contains a letter — `bg-BG` ends its
   * date with ` г.` — would have that letter parsed as a date token.
   *
   * @param parts - Formatted parts for a sample date
   * @param monthToken - The token to substitute for the month part
   * @returns A pattern usable by formatDate
   */
  private static patternFromParts(parts: Intl.DateTimeFormatPart[], monthToken: string): string {
    return parts
      .map(part => {
        if (part.type === 'day') return 'DD';
        if (part.type === 'month') return monthToken;
        if (part.type === 'year') return 'YYYY';
        return /[A-Za-z]/.test(part.value) ? `[${part.value}]` : part.value;
      })
      .join('')
      .trim();
  }

  private static calendarDefaultsFromIntl(locale: string): CalendarObject | null {
    // The derived object embeds the translated "yesterday", so the text
    // language is part of the identity — caching on the date locale alone
    // would keep the old word after a language switch.
    const cacheKey = `${this.getCurrentLanguage()}|${locale}`;
    const cached = this.derivedCalendarCache.get(cacheKey);
    if (cached !== undefined) return cached;

    let result: CalendarObject | null = null;
    try {
      // A date whose parts are mutually unambiguous, so the order is readable.
      const sample = new Date(Date.UTC(2026, 10, 22));
      const parts = new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).formatToParts(sample);
      if (parts.some(part => part.type === 'day')) {
        const hour12 = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12;
        result = {
          today: hour12 ? 'hh:mm A' : 'HH:mm',
          // Without this the object still has keys, so `cometchat-date` and
          // CalendarDatePipe use it instead of reaching their own defaults —
          // and a message from yesterday lost its "Yesterday" label entirely.
          yesterday: `[${this.getLocalizedString('yesterday')}]`,
          lastWeek: 'dddd',
          otherDays: this.patternFromParts(parts, 'MM'),
        };
      }
    } catch {
      result = null;
    }
    this.derivedCalendarCache.set(cacheKey, result);
    return result;
  }

  /**
   * The date pattern for a locale with the month written as a name.
   *
   * Message separators read better as "22 Nov, 2026" than "22/11/2026", and the
   * month name is already localized. Only the field order needs deriving.
   *
   * @returns A pattern such as `DD MMM YYYY`, or null when the platform cannot format the locale
   */
  private static monthNameDatePattern(locale: string): string | null {
    try {
      const sample = new Date(Date.UTC(2026, 10, 22));
      const parts = new Intl.DateTimeFormat(locale, {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).formatToParts(sample);
      if (!parts.some(part => part.type === 'day')) return null;

      // Some locales have no short month *name*: ja, zh, zh-TW and lt all
      // return a numeric month with the unit as a separate literal, so the
      // pattern becomes `YYYY年MMM月DD日`. Filling MMM from month_*_short —
      // which is already "11月" in ja and "十一月" in zh — doubled the
      // character: 2026年11月月22日. There is no month name to use, so these
      // locales take the numeric pattern instead.
      const month = parts.find(part => part.type === 'month');
      if (!month || /^\d+$/.test(month.value)) return null;

      return this.patternFromParts(parts, 'MMM');
    } catch {
      return null;
    }
  }

  /**
   * The calendar defaults for the active locale.
   *
   * The browser reports a region-tagged code (`de-DE`, `fr-FR`, `pt-BR`), and
   * the kit adopts it verbatim via `setCurrentLanguage(getBrowserLanguage())`.
   * `LANGUAGE_CALENDAR_DEFAULTS` is keyed by base language, so a direct lookup
   * misses and — before this resolver existed — both pattern getters fell
   * straight through to the hard-coded en-US values. German users saw
   * `MM/DD/YYYY` and a 12-hour clock, so 04/05 read as the wrong day.
   *
   * Order: exact tag, then base language, then the platform's own data for the
   * tag, then the fallback language, then en-US.
   *
   * The platform is consulted before `fallbackLanguage` on purpose. The
   * fallback exists to decide which *strings* to show when a translation is
   * missing; it says nothing about how the reader writes a date. For `en-AU`
   * there is no `en` entry, so deferring to a fallback of `en-US` would hand an
   * Australian reader `MM/DD/YYYY`, while the platform correctly says
   * `DD/MM/YYYY`.
   *
   * @returns The defaults to build time and date patterns from
   */
  private static resolveCalendarDefaults(): CalendarObject {
    const locale = this.getDateLocaleLanguage();
    const tagged = [locale, locale.split('-')[0]];
    for (const candidate of tagged) {
      const defaults = this.languageCalendarDefaults[candidate];
      if (defaults?.today && defaults?.otherDays) return defaults;
    }

    const derived = this.calendarDefaultsFromIntl(locale);
    if (derived?.today && derived?.otherDays) return derived;

    const fallbacks = [this.fallbackLanguage, this.fallbackLanguage?.split('-')[0]];
    for (const candidate of fallbacks) {
      const defaults = candidate ? this.languageCalendarDefaults[candidate] : undefined;
      if (defaults?.today && defaults?.otherDays) return defaults;
    }
    return this.languageCalendarDefaults['en-US'];
  }

  private static readonly resolvedCalendarCache = new Map<string, CalendarObject>();

  /**
   * The active locale's calendar defaults, with the "yesterday" label taken
   * from the translations rather than the table.
   *
   * The table's label is tied to the *date* locale, but the word is UI text.
   * With `disableDateTimeLocalization: true` the date locale is pinned to
   * `en-US`, so a German UI rendered "Yesterday" beside "Sonntag".
   *
   * Cached, because the pattern getters run inside template getters on every
   * change-detection pass and this would otherwise allocate each time.
   *
   * @returns Calendar defaults safe to hand to formatDate
   */
  private static localizedCalendarDefaults(): CalendarObject {
    const key = `${this.getCurrentLanguage()}|${this.getDateLocaleLanguage()}`;
    const cached = this.resolvedCalendarCache.get(key);
    if (cached) return cached;

    const word = this.getLocalizedString('yesterday');
    const resolved: CalendarObject = {
      ...this.resolveCalendarDefaults(),
      ...(word ? { yesterday: `[${word}]` } : {}),
    };
    this.resolvedCalendarCache.set(key, resolved);
    return resolved;
  }

  /**
   * Gets the time-of-day pattern the active locale writes clock times with.
   *
   * Most locales use a 24-hour clock ('HH:mm'); `en-US` and `hi` use a 12-hour
   * clock with a meridiem ('hh:mm A'). Components that need a date *and* a time
   * should build their pattern around this instead of hard-coding 'hh:mm A',
   * which rendered "19:17" as "07:17 午後" in Japanese.
   *
   * @returns The locale's time pattern
   *
   * @example
   * const pattern = `DD MMM, ${CometChatLocalize.getTimePattern()}`;
   */
  static getTimePattern(): string {
    return this.resolveCalendarDefaults().today || 'hh:mm A';
  }

  /**
   * Gets the numeric date pattern the active locale writes full dates with,
   * e.g. 'MM/DD/YYYY' for `en-US`, 'DD.MM.YYYY' for `de` and 'YYYY/MM/DD' for `ja`.
   *
   * Components that need an explicit fallback for older dates should use this
   * rather than hard-coding 'DD/MM/YYYY', which shows every locale one country's
   * field order.
   *
   * @param style - 'numeric' for 22/11/2026, 'monthName' for 22 Nov 2026 in the locale's order
   * @returns The locale's date pattern
   */
  static getDatePattern(style: 'numeric' | 'monthName' = 'numeric'): string {
    if (style === 'monthName') {
      const derived = this.monthNameDatePattern(this.getDateLocaleLanguage());
      if (derived) return derived;
    }
    return this.resolveCalendarDefaults().otherDays || 'DD/MM/YYYY';
  }

  /**
   * Formats a duration in the active locale.
   *
   * Uses `Intl.NumberFormat` unit formatting rather than translation keys so
   * that each language gets its own plural form: 2 minutes reads "2 minutes"
   * in English, "2 minutos" in Spanish and "2分" in Japanese.
   *
   * @param seconds - The duration in seconds; negative and non-finite values count as 0
   * @param style - 'long' for "2 minutes 30 seconds", 'short' for "2 min 30 sec"
   * @returns The localized duration string
   *
   * @example
   * CometChatLocalize.formatDuration(150); // "2 minutes 30 seconds"
   * CometChatLocalize.formatDuration(3723, 'short'); // "1 hr 2 min 3 sec"
   */
  static formatDuration(seconds: number, style: 'long' | 'short' = 'long'): string {
    const locale = this.getDateLocaleLanguage();
    return style === 'short'
      ? formatDurationShort(seconds, locale)
      : formatDurationLong(seconds, locale);
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
