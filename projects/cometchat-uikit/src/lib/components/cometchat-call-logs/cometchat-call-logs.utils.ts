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
  const defaultFormat: CalendarObject = {
    yesterday: 'DD MMM, hh:mm A',
    otherDays: 'DD MMM, hh:mm A',
    today: 'DD MMM, hh:mm A',
  };

  const globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.getCalendarObject());
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
    parts.push(new Date(call.initiatedAt * 1000).toLocaleString());
  }

  return parts.join(', ');
}
