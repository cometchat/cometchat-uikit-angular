/**
 * Types and utilities for CometChatCallBubble component.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Possible call status values from CometChat.Call.getStatus().
 * @see Requirements 1.4
 */
export type CallBubbleStatus =
  | 'initiated'
  | 'ongoing'
  | 'ended'
  | 'missed'
  | 'cancelled'
  | 'rejected'
  | 'busy'
  | 'unanswered';

/**
 * Event emitted when the action button is clicked.
 * @see Requirements 12.2, 12.3
 */
export interface CallButtonClickEvent {
  /** The session ID of the call */
  sessionId: string;
  /** The call message object */
  message: CometChat.Call;
}

/** All valid call statuses for normalization */
export const VALID_CALL_STATUSES: CallBubbleStatus[] = [
  'initiated',
  'ongoing',
  'ended',
  'missed',
  'cancelled',
  'rejected',
  'busy',
  'unanswered',
];

/** Statuses that indicate a missed/failed incoming call */
export const MISSED_CALL_STATUSES: CallBubbleStatus[] = [
  'unanswered',
  'missed',
  'cancelled',
  'rejected',
  'busy',
];

/** Month names for date formatting */
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Normalizes the raw call status to a valid CallBubbleStatus value.
 */
export function normalizeCallStatus(rawStatus: string | undefined | null): CallBubbleStatus {
  if (!rawStatus) return 'ended';
  const normalized = rawStatus.toLowerCase() as CallBubbleStatus;
  return VALID_CALL_STATUSES.includes(normalized) ? normalized : 'ended';
}

/**
 * Formats the call timestamp as a readable date/time string.
 *
 * Routed through CometChatLocalize so the month abbreviation comes from the
 * `month_*_short` keys and the time follows the active locale's own pattern —
 * 24-hour in most locales, 12-hour with AM/PM only where that is the convention.
 * Previously this was hand-rolled with English month names and a fixed AM/PM,
 * so every locale rendered US-style ("17 Sep, 02:51 PM").
 */
export function formatCallDateTime(timestamp: number): string {
  const seconds = timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;
  // The locale's own time pattern (HH:mm for most, hh:mm A where AM/PM is the norm).
  const timePattern = CometChatLocalize.getTimePattern();
  const pattern = `DD MMM, ${timePattern}`;
  return CometChatLocalize.formatDate(seconds, {
    today: pattern,
    yesterday: pattern,
    lastWeek: pattern,
    otherDays: pattern,
  });
}

/**
 * Formats call duration in human-readable format.
 * - Duration < 1 hour: "M:SS"
 * - Duration >= 1 hour: "H:MM:SS"
 * - Invalid inputs: "0:00"
 * @see Requirements 11.1, 11.2, 11.4
 */
export function formatCallDuration(durationInSeconds: number): string {
  if (!durationInSeconds || durationInSeconds < 0 || !isFinite(durationInSeconds)) {
    return '0:00';
  }

  const totalSeconds = Math.floor(durationInSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
