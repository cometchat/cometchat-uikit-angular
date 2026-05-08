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
