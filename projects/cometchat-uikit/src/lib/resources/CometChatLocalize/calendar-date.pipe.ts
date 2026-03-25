import { Pipe, PipeTransform } from '@angular/core';
import { CometChatLocalize } from './cometchat-localize';
import { CalendarObject } from './localization.interfaces';

/**
 * Default calendar configuration for date formatting.
 */
const DEFAULT_CALENDAR: CalendarObject = {
  today: 'h:mm A',
  yesterday: '[Yesterday]',
  lastWeek: 'dddd',
  otherDays: 'DD/MM/YYYY',
  relativeTime: {
    minute: '%d minute ago',
    minutes: '%d minutes ago',
    hour: '%d hour ago',
    hours: '%d hours ago',
  },
};

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

    // Use provided calendar object or fall back to stored/default
    const calendar = calendarObject || CometChatLocalize.getCalendarObject() || DEFAULT_CALENDAR;

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

  private conversationCalendar: CalendarObject = {
    today: 'h:mm A',
    yesterday: '[Yesterday]',
    lastWeek: 'ddd',
    otherDays: 'DD/MM/YY',
  };

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

  private messageCalendar: CalendarObject = {
    today: 'h:mm A',
    yesterday: '[Yesterday] h:mm A',
    lastWeek: 'dddd h:mm A',
    otherDays: 'MMM D, YYYY h:mm A',
  };

  transform(value: number | Date | string | null | undefined): string {
    return this.calendarDatePipe.transform(value, this.messageCalendar);
  }
}
