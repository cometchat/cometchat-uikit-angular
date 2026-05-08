/**
 * Types and utilities for CometChatCallBubble component.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

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
 * Format: "DD MMM, hh:mm A" (e.g., "28 Feb, 01:15 PM")
 */
export function formatCallDateTime(timestamp: number): string {
  const timestampMs = timestamp > 9999999999 ? timestamp : timestamp * 1000;
  const date = new Date(timestampMs);

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');

  return `${day} ${month}, ${hoursStr}:${minutes} ${ampm}`;
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
