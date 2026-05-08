/**
 * Date format utilities for CometChatMessageList component.
 *
 * Extracted from cometchat-message-list.component.ts to isolate
 * calendar object construction and date separator logic.
 */

import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';

// ==================== Default Calendar Objects ====================

/**
 * Returns the default CalendarObject for date separator labels.
 * e.g. "Today", "Yesterday", "Monday", "12/01/2024"
 */
export function getDefaultSeparatorDateFormat(): CalendarObject {
  return {
    yesterday: CometChatLocalize.getLocalizedString('yesterday'),
    today: CometChatLocalize.getLocalizedString('today'),
    lastWeek: 'dddd',
    otherDays: 'DD/MM/YYYY'
  };
}

/**
 * Returns the default CalendarObject for the sticky date header.
 * Same format as separator but used for the floating date chip.
 */
export function getDefaultStickyDateFormat(): CalendarObject {
  return {
    yesterday: CometChatLocalize.getLocalizedString('yesterday'),
    today: CometChatLocalize.getLocalizedString('today'),
    lastWeek: 'dddd',
    otherDays: 'DD/MM/YYYY'
  };
}

/**
 * Returns the default CalendarObject for individual message timestamps.
 * e.g. "3:45 PM"
 */
export function getDefaultMessageDateFormat(): CalendarObject {
  return {
    yesterday: CometChatLocalize.getLocalizedString('yesterday'),
    today: CometChatLocalize.getLocalizedString('today'),
    lastWeek: 'dddd',
    otherDays: 'DD/MM/YYYY'
  };
}

// ==================== Date Separator Key ====================

/**
 * Returns a normalized date string (YYYY-MM-DD) for a Unix timestamp.
 * Used as the key for grouping messages under date separators.
 *
 * @param timestamp - Unix timestamp in seconds
 */
export function getDateSeparatorKey(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether two Unix timestamps fall on the same calendar day.
 *
 * @param ts1 - First Unix timestamp in seconds
 * @param ts2 - Second Unix timestamp in seconds
 */
export function isSameDay(ts1: number, ts2: number): boolean {
  return getDateSeparatorKey(ts1) === getDateSeparatorKey(ts2);
}
