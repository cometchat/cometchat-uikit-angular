/**
 * Interface for localization settings configuration.
 */
export interface LocalizationSettings {
  /** The language code to use (e.g., 'en-US', 'es', 'fr') */
  language?: string;
  /** Fallback language if the requested language is not available */
  fallbackLanguage?: string;
  /** Timezone for date/time formatting (e.g., 'America/New_York') */
  timezone?: string;
  /** Disable automatic language detection from browser */
  disableAutoDetection?: boolean;
  /** Disable date/time localization (use en-US format) */
  disableDateTimeLocalization?: boolean;
  /** Custom translations to merge with built-in translations */
  translationsForLanguage?: Record<string, Record<string, string>>;
  /** Calendar object for custom date formatting */
  calendarObject?: CalendarObject;
  /** Handler called when a translation key is missing */
  missingKeyHandler?: (key: string) => void;
}

/**
 * Interface for calendar date formatting configuration.
 */
export interface CalendarObject {
  /** Format for today's date (e.g., 'h:mm A') */
  today?: string;
  /** Format for yesterday's date (e.g., '[Yesterday] h:mm A') */
  yesterday?: string;
  /** Format for dates within the last week (e.g., 'dddd h:mm A') */
  lastWeek?: string;
  /** Format for all other dates (e.g., 'DD/MM/YYYY') */
  otherDays?: string;
  /** Relative time configuration */
  relativeTime?: RelativeTimeConfig;
}

/**
 * Interface for relative time formatting.
 */
export interface RelativeTimeConfig {
  /** Format for "1 minute ago" (use %d for the number) */
  minute?: string;
  /** Format for "X minutes ago" (use %d for the number) */
  minutes?: string;
  /** Format for "1 hour ago" (use %d for the number) */
  hour?: string;
  /** Format for "X hours ago" (use %d for the number) */
  hours?: string;
}
