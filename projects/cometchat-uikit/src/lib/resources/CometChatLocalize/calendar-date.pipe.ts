import { Pipe, PipeTransform } from '@angular/core';
import { CometChatLocalize } from './cometchat-localize';
import { CalendarObject } from './localization.interfaces';

/**
 * Default calendar configuration for date formatting.
 *
 * Built per call rather than held as a constant: the clock, the field order and
 * the relative-time wording all follow the active language, and a constant
 * froze them at English and a 12-hour clock for every locale.
 */
function defaultCalendar(): CalendarObject {
  const t = (key: string) => CometChatLocalize.getLocalizedString(key);
  return {
    today: CometChatLocalize.getTimePattern(),
    yesterday: `[${t('yesterday')}]`,
    lastWeek: 'dddd',
    otherDays: CometChatLocalize.getDatePattern(),
    relativeTime: {
      minute: t('message_header_minute_ago'),
      minutes: t('message_header_minutes_ago'),
      hour: t('message_header_hour_ago'),
      hours: t('message_header_hours_ago'),
    },
  };
}

/**
 * Angular pipe for formatting dates with localization and relative time support.
 *
 * This pipe extends Angular's built-in DatePipe functionality by adding:
 * - Relative time formatting ("5 minutes ago", "Yesterday")
 * - Localized day and month names
 * - Configurable calendar patterns
 *
 * @example
 * // Basic usage with Unix timestamp (seconds):
 * <span>{{ message.sentAt | calendarDate }}</span>
 * // Outputs: "5 minutes ago" or "Yesterday" or "Monday" or "15/01/2024"
 *
 * @example
 * // With custom calendar configuration:
 * <span>{{ timestamp | calendarDate:customCalendar }}</span>
 *
 * @example
 * // In component:
 * customCalendar: CalendarObject = {
 *   today: 'h:mm A',
 *   yesterday: '[Yesterday at] h:mm A',
 *   lastWeek: 'dddd [at] h:mm A',
 *   otherDays: 'MMMM D, YYYY'
 * };
 */
@Pipe({
  name: 'calendarDate',
  standalone: true,
  pure: false, // Impure to update when language changes
})
export class CalendarDatePipe implements PipeTransform {
  /**
   * Transforms a timestamp to a formatted date string.
   *
   * @param value - Unix timestamp in seconds, milliseconds, Date object, or date string
   * @param calendarObject - Optional custom calendar configuration
   * @returns Formatted date string
   */
  transform(
    value: number | Date | string | null | undefined,
    calendarObject?: CalendarObject
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Convert to Unix timestamp in seconds
    let timestamp: number;

    if (typeof value === 'number') {
      // Check if it's milliseconds (13 digits) or seconds (10 digits)
      timestamp = value > 9999999999 ? Math.floor(value / 1000) : value;
    } else if (value instanceof Date) {
      timestamp = Math.floor(value.getTime() / 1000);
    } else if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (isNaN(parsed)) {
        return '';
      }
      timestamp = Math.floor(parsed / 1000);
    } else {
      return '';
    }

    // Use provided calendar object or fall back to stored/default. The global
    // object is `{}` for a language with no entry, which is truthy — without the
    // key check that empty object won, and every date fell through to DD/MM/YYYY.
    const globalCalendar = CometChatLocalize.getCalendarObject();
    const calendar =
      calendarObject ||
      (globalCalendar && Object.keys(globalCalendar).length > 0 ? globalCalendar : defaultCalendar());

    return CometChatLocalize.formatDate(timestamp, calendar);
  }
}

/**
 * Simplified calendar date pipe for conversation list timestamps.
 *
 * Uses a compact format suitable for conversation list items.
 */
@Pipe({
  name: 'conversationDate',
  standalone: true,
  pure: false,
})
export class ConversationDatePipe implements PipeTransform {
  private calendarDatePipe = new CalendarDatePipe();

  /** The compact conversation-list format, in the active locale. */
  private get conversationCalendar(): CalendarObject {
    return {
      today: CometChatLocalize.getTimePattern(),
      yesterday: `[${CometChatLocalize.getLocalizedString('yesterday')}]`,
      lastWeek: 'ddd',
      // The conversation list wants a compact date, but still in the reader's
      // field order — a two-digit year is the only thing fixed here.
      otherDays: CometChatLocalize.getDatePattern().replace('YYYY', 'YY'),
    };
  }

  transform(value: number | Date | string | null | undefined): string {
    return this.calendarDatePipe.transform(value, this.conversationCalendar);
  }
}

/**
 * Calendar date pipe for message timestamps.
 *
 * Uses a format suitable for message bubbles with time display.
 */
@Pipe({
  name: 'messageDate',
  standalone: true,
  pure: false,
})
export class MessageDatePipe implements PipeTransform {
  private calendarDatePipe = new CalendarDatePipe();

  /** The message-bubble format, in the active locale. */
  private get messageCalendar(): CalendarObject {
    const time = CometChatLocalize.getTimePattern();
    return {
      today: time,
      yesterday: `[${CometChatLocalize.getLocalizedString('yesterday')}] ${time}`,
      lastWeek: `dddd ${time}`,
      otherDays: `${CometChatLocalize.getDatePattern('monthName')} ${time}`,
    };
  }

  transform(value: number | Date | string | null | undefined): string {
    return this.calendarDatePipe.transform(value, this.messageCalendar);
  }
}
