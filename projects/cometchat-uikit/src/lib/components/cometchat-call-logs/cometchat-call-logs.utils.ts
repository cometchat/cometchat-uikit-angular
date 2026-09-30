/**
 * Utility functions for CometChatCallLogs component.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { sanitizeCalendarObject } from '../../utils/util';

/**
 * Returns the merged CalendarObject for call initiation timestamps.
 * Merges default → global → component-level formats (component wins).
 */
export function buildCallLogDateFormat(
  componentCalendarFormat: CalendarObject | null
): CalendarObject {
  // A call log always shows the day alongside the time, but the time itself
  // follows the locale's own clock: hard-coding 'hh:mm A' printed 19:17 as
  // "07:17 午後" in Japanese and every other 24-hour locale.
  const pattern = `DD MMM, ${CometChatLocalize.getTimePattern()}`;
  const defaultFormat: CalendarObject = {
    yesterday: pattern,
    otherDays: pattern,
    today: pattern,
  };

  // Only an explicitly configured global CalendarObject overrides the default.
  // The per-language defaults are time-only ('HH:mm'), so merging them here
  // dropped the date from the call log entirely.
  const globalCalendarFormat = CometChatLocalize.hasCustomCalendarObject()
    ? sanitizeCalendarObject(CometChatLocalize.getCalendarObject())
    : {};
  const componentFormat = sanitizeCalendarObject(componentCalendarFormat);

  return { ...defaultFormat, ...globalCalendarFormat, ...componentFormat };
}

/**
 * Wraps an unknown error in a CometChatException.
 */
export function wrapCallLogsError(err: unknown): CometChat.CometChatException {
  if (err instanceof CometChat.CometChatException) return err;
  if (err instanceof Error) {
    return new CometChat.CometChatException({
      code: 'CALL_LOGS_ERROR',
      message: err.message,
      details: err.stack || '',
    });
  }
  return new CometChat.CometChatException({
    code: 'CALL_LOGS_ERROR',
    message: String(err),
    details: '',
  });
}

/**
 * Computes the accessible label for a call log item.
 * Combines contact name, call type, call status, and timestamp.
 */
export function buildCallLogAriaLabel(
  call: any,
  callUser: any,
  isSentByMe: boolean,
  isMissed: boolean
): string {
  const parts: string[] = [];

  const name = callUser?.getName?.() || '';
  if (name) parts.push(name);

  const typeKey = call?.type === 'video' ? 'accessibility_video_call' : 'accessibility_voice_call';
  parts.push(CometChatLocalize.getLocalizedString(typeKey));

  let statusKey: string;
  if (isSentByMe) {
    statusKey = 'accessibility_call_outgoing';
  } else if (isMissed) {
    statusKey = 'accessibility_call_missed';
  } else {
    statusKey = 'accessibility_call_incoming';
  }
  parts.push(CometChatLocalize.getLocalizedString(statusKey));

  if (call?.initiatedAt) {
    // Announce in the active locale; toLocaleString() with no arguments falls
    // back to the browser's locale, which need not be the one the kit renders.
    parts.push(
      new Date(call.initiatedAt * 1000).toLocaleString(CometChatLocalize.getDateLocaleLanguage(), {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    );
  }

  return parts.join(', ');
}
