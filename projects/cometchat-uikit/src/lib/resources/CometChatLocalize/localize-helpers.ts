import { CalendarObject } from './localization.interfaces';

/**
 * Formats a date using a given pattern with localization support.
 *
 * @param date - The date to format
 * @param format - The format pattern (e.g. 'HH:mm', 'DD/MM/YYYY', 'dddd')
 * @param timezone - IANA timezone string
 * @param dateLocaleLanguage - BCP 47 language tag for Intl formatting
 * @param getLocalizedString - Callback to resolve localized month/weekday names
 * @returns The formatted date string
 */
export function formatDateFromPattern(
  date: Date,
  format: string,
  timezone: string,
  dateLocaleLanguage: string,
  getLocalizedString: (key: string) => string
): string {
  // Text in [brackets] is literal: it must not be scanned for tokens, and it
  // must not influence the clock. Swap each literal for a marker first, then
  // put it back once every replacement has run.
  //
  // Without this, `[Ayer] HH:mm` printed 07:35 instead of 19:35 — the `A` in
  // "Ayer" satisfied `includes('A')` and switched the formatter to 12-hour.
  // Any localized word containing a lone D, M, H, h or m was exposed the same
  // way, and this kit puts translated words inside date patterns in ~8 places.
  const literals: string[] = [];
  const MARKER = '\u0000';
  const pattern = format.replace(/\[(.*?)\]/g, (_match, text: string) => {
    literals.push(text);
    return `${MARKER}${literals.length - 1}${MARKER}`;
  });
  const restoreLiterals = (value: string): string =>
    value.replace(new RegExp(`${MARKER}(\\d+)${MARKER}`, 'g'), (_m, index: string) => literals[Number(index)]);

  const options: Intl.DateTimeFormatOptions = {
    day: pattern.includes('D') ? '2-digit' : undefined,
    month:
      pattern.includes('MMMM') ||
      pattern.includes('MMM') ||
      pattern.includes('MM') ||
      pattern.includes('M')
        ? '2-digit'
        : undefined,
    year: pattern.includes('YYYY') ? 'numeric' : pattern.includes('YY') ? '2-digit' : undefined,
    // HH/H are the 24-hour tokens, hh/h the 12-hour ones.
    hour: /\b(HH|hh)\b/.test(pattern)
      ? '2-digit'
      : /\b[Hh]\b/.test(pattern)
        ? 'numeric'
        : undefined,
    minute: pattern.includes('mm') ? '2-digit' : pattern.includes('m') ? 'numeric' : undefined,
    // Only pass hour12 when the pattern actually asks for AM/PM; otherwise pin the cycle to
    // h23 so midnight renders as 00 rather than 24 in locales that default to h24.
    ...(pattern.includes('A') ? { hour12: true } : { hourCycle: 'h23' as const }),
    weekday: pattern.includes('dddd')
      ? 'long'
      : pattern.includes('ddd') || pattern.includes('dd')
        ? 'short'
        : undefined,
    timeZone: timezone,
  };

  const monthNames = {
    short: [
      getLocalizedString('month_january_short'),
      getLocalizedString('month_february_short'),
      getLocalizedString('month_march_short'),
      getLocalizedString('month_april_short'),
      getLocalizedString('month_may_short'),
      getLocalizedString('month_june_short'),
      getLocalizedString('month_july_short'),
      getLocalizedString('month_august_short'),
      getLocalizedString('month_september_short'),
      getLocalizedString('month_october_short'),
      getLocalizedString('month_november_short'),
      getLocalizedString('month_december_short'),
    ],
    long: [
      getLocalizedString('month_january_full'),
      getLocalizedString('month_february_full'),
      getLocalizedString('month_march_full'),
      getLocalizedString('month_april_full'),
      getLocalizedString('month_may_full'),
      getLocalizedString('month_june_full'),
      getLocalizedString('month_july_full'),
      getLocalizedString('month_august_full'),
      getLocalizedString('month_september_full'),
      getLocalizedString('month_october_full'),
      getLocalizedString('month_november_full'),
      getLocalizedString('month_december_full'),
    ],
  };

  const weekdays = {
    min: [
      getLocalizedString('weekday_sunday_min'),
      getLocalizedString('weekday_monday_min'),
      getLocalizedString('weekday_tuesday_min'),
      getLocalizedString('weekday_wednesday_min'),
      getLocalizedString('weekday_thursday_min'),
      getLocalizedString('weekday_friday_min'),
      getLocalizedString('weekday_saturday_min'),
    ],
    short: [
      getLocalizedString('weekday_sunday_short'),
      getLocalizedString('weekday_monday_short'),
      getLocalizedString('weekday_tuesday_short'),
      getLocalizedString('weekday_wednesday_short'),
      getLocalizedString('weekday_thursday_short'),
      getLocalizedString('weekday_friday_short'),
      getLocalizedString('weekday_saturday_short'),
    ],
    long: [
      getLocalizedString('weekday_sunday_full'),
      getLocalizedString('weekday_monday_full'),
      getLocalizedString('weekday_tuesday_full'),
      getLocalizedString('weekday_wednesday_full'),
      getLocalizedString('weekday_thursday_full'),
      getLocalizedString('weekday_friday_full'),
      getLocalizedString('weekday_saturday_full'),
    ],
  };

  const formatter = new Intl.DateTimeFormat(dateLocaleLanguage, options);
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
      replacements['HH'] = part.value;
      replacements['H'] = parseInt(part.value).toString();
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

  return restoreLiterals(
    pattern
    .replace(/\bDD\b/g, replacements['DD'] || '')
    .replace(/\bD\b/g, replacements['D'] || '')
    .replace(/\bMMMM\b/g, replacements['MMMM'] || '')
    .replace(/\bMMM\b/g, replacements['MMM'] || '')
    .replace(/\bMM\b/g, replacements['MM'] || '')
    .replace(/\bM\b/g, replacements['M'] || '')
    .replace(/\bYYYY\b/g, replacements['YYYY'] || '')
    .replace(/\bYY\b/g, replacements['YY'] || '')
    .replace(/\bHH\b/g, replacements['HH'] || '')
    .replace(/\bH\b/g, replacements['H'] || '')
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
    .replace(/^A$/, `${replacements['A'] || 'A'}`)
  );
}

/**
 * Checks if a Unix timestamp (seconds) represents yesterday's date in the given timezone.
 *
 * @param timestamp - Unix timestamp in seconds
 * @param timeZone - IANA timezone string
 * @returns True if the timestamp falls on yesterday's date
 */
export function isYesterday(timestamp: number, timeZone: string): boolean {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  return fmt(new Date(timestamp * 1000)) === fmt(yesterday);
}

/**
 * Formats a Unix timestamp based on the provided calendar configuration.
 *
 * @param timestamp - Unix timestamp in seconds
 * @param calendarObject - Calendar configuration for formatting
 * @param timezone - IANA timezone string
 * @param dateLocaleLanguage - BCP 47 language tag for Intl formatting
 * @param getLocalizedString - Callback to resolve localized strings
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number,
  calendarObject: CalendarObject,
  timezone: string,
  dateLocaleLanguage: string,
  getLocalizedString: (key: string) => string
): string {
  const now = new Date();
  const date = new Date(timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp);

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  const nowFormatted = fmt(now);
  const dateFormatted = fmt(date);

  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  const applyPattern = (pattern: string) =>
    formatDateFromPattern(date, pattern, timezone, dateLocaleLanguage, getLocalizedString);

  // Handle relative time
  if (calendarObject.relativeTime && Object.keys(calendarObject.relativeTime).length > 0) {
    if (diffInSeconds < 60) {
      if (calendarObject.relativeTime.minute) {
        return calendarObject.relativeTime.minute.includes('%d')
          ? calendarObject.relativeTime.minute.replace('%d', '1')
          : calendarObject.relativeTime.minute;
      } else if (calendarObject.today) {
        return applyPattern(calendarObject.today);
      }
    }
    if (diffInMinutes < 60) {
      if (calendarObject.relativeTime.minutes) {
        return calendarObject.relativeTime.minutes.includes('%d')
          ? calendarObject.relativeTime.minutes.replace('%d', String(diffInMinutes))
          : calendarObject.relativeTime.minutes;
      } else if (calendarObject.today) {
        return applyPattern(calendarObject.today);
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

  if (nowFormatted === dateFormatted && calendarObject.today) {
    return applyPattern(calendarObject.today);
  }
  if (isYesterday(timestamp, timezone) && calendarObject.yesterday) {
    return applyPattern(calendarObject.yesterday);
  }
  if (diffInDays <= 7 && calendarObject.lastWeek) {
    return applyPattern(calendarObject.lastWeek);
  }
  return applyPattern(calendarObject.otherDays || 'DD/MM/YYYY');
}

/** Cached `Intl.NumberFormat` instances, keyed by locale + unit + display width. */
const UNIT_FORMATTERS = new Map<string, Intl.NumberFormat>();

/**
 * Formats a count of a time unit in the given locale, e.g. `2` + `minute` →
 * "2 minutes" (en), "2 minutos" (es), "2分" (ja).
 *
 * `Intl.NumberFormat` is used rather than translation keys because plural rules
 * differ per language — Russian and Lithuanian pick a different form for 1, 2-4
 * and 5+, which a single "%d minutes" string cannot express.
 *
 * @param value - The number of units
 * @param unit - A sanctioned Intl unit identifier ('hour' | 'minute' | 'second')
 * @param locale - BCP 47 language tag
 * @param unitDisplay - 'long' for "2 minutes", 'narrow' for "2m"
 * @returns The localized unit string
 */
function formatTimeUnit(
  value: number,
  unit: 'hour' | 'minute' | 'second',
  locale: string,
  unitDisplay: 'long' | 'short' | 'narrow'
): string {
  const cacheKey = `${locale}|${unit}|${unitDisplay}`;
  let formatter = UNIT_FORMATTERS.get(cacheKey);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay });
    } catch {
      // Unknown locale, or an engine without `style: 'unit'`.
      try {
        formatter = new Intl.NumberFormat('en-US', { style: 'unit', unit, unitDisplay });
      } catch {
        return unitDisplay === 'long'
          ? `${value} ${unit}${value === 1 ? '' : 's'}`
          : `${value}${unit.charAt(0)}`;
      }
    }
    UNIT_FORMATTERS.set(cacheKey, formatter);
  }
  return formatter.format(value);
}

/** Clamps an arbitrary input to a whole, non-negative number of seconds. */
function toWholeSeconds(seconds: number): number {
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
}

/**
 * Formats a duration for screen readers, e.g. "2 minutes 30 seconds".
 * Units that are zero are dropped, so 60 reads as "1 minute" and 45 as
 * "45 seconds". Hours are rolled into minutes, matching the previous behaviour.
 *
 * @param seconds - The duration in seconds
 * @param locale - BCP 47 language tag
 * @returns The localized duration
 */
export function formatDurationLong(seconds: number, locale: string): string {
  const total = toWholeSeconds(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;

  if (minutes === 0) {
    return formatTimeUnit(remainingSeconds, 'second', locale, 'long');
  }
  if (remainingSeconds === 0) {
    return formatTimeUnit(minutes, 'minute', locale, 'long');
  }
  return `${formatTimeUnit(minutes, 'minute', locale, 'long')} ${formatTimeUnit(remainingSeconds, 'second', locale, 'long')}`;
}

/**
 * Formats a duration compactly, e.g. "1 hr 2 min 3 sec" (en), "1 時間 2 分 3 秒" (ja).
 * Leading units that are zero are dropped; a zero duration reads as "0 sec".
 *
 * Uses CLDR's 'short' unit width rather than 'narrow'. Narrow is more compact in
 * English ("1h 2m 3s"), but CLDR's narrow forms for Japanese are the Latin
 * letters h/m/s — so a Japanese call log still read "1m 0s", which is the bug
 * this was meant to fix. Short is correct in every locale and still compact.
 *
 * @param seconds - The duration in seconds
 * @param locale - BCP 47 language tag
 * @returns The localized duration
 */
export function formatDurationShort(seconds: number, locale: string): string {
  const total = toWholeSeconds(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(formatTimeUnit(hours, 'hour', locale, 'short'));
  if (hours > 0 || minutes > 0) parts.push(formatTimeUnit(minutes, 'minute', locale, 'short'));
  parts.push(formatTimeUnit(remainingSeconds, 'second', locale, 'short'));

  return parts.join(' ');
}

/**
 * Wraps a CalendarObject factory so it rebuilds only when the language changes.
 *
 * A getter that returns a fresh object literal hands `<cometchat-date>` a new
 * identity on every change-detection pass, so `ngOnChanges` fires and the date
 * is reformatted — once per list item, per pass. The contents only ever depend
 * on the active language, so one instance per language is enough.
 *
 * The key must cover every input the object depends on. These objects hold a
 * translated word ("Yesterday") as well as date patterns, so the text language
 * belongs in the key too: with `disableDateTimeLocalization: true` the date
 * locale is pinned to `en-US`, and keying on that alone meant switching
 * language never rebuilt the object and the old word stuck.
 *
 * The key is passed in rather than read here: this module is imported by
 * `cometchat-localize`, so reaching back into it would be a cycle.
 *
 * @param build - Produces the object for the current language
 * @returns A function that returns a stable object for a given cache key
 */
export function cachedByLanguage<T>(build: () => T): (language: string) => T {
  let cachedLanguage: string | null = null;
  let cached: T;
  return (language: string): T => {
    if (cachedLanguage !== language) {
      cached = build();
      cachedLanguage = language;
    }
    return cached;
  };
}
