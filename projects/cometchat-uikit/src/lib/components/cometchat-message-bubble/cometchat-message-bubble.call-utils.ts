/**
 * Call bubble utilities for CometChatMessageBubble component.
 *
 * Extracted from cometchat-message-bubble.component.ts to isolate
 * call message text generation, icon resolution, and status classification.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ==================== Call Status Classification ====================

/**
 * Checks whether a call message represents a missed call for the given user.
 *
 * @param call - The call message
 * @param loggedInUid - UID of the currently logged-in user
 */
export function isMissedCall(
  call: CometChat.Call,
  loggedInUid: string
): boolean {
  const status = call.getStatus();
  const initiatorUid = call.getCallInitiator()?.getUid();
  const isCaller = initiatorUid === loggedInUid;

  if (status === CometChat.CALL_STATUS.UNANSWERED) {
    // Missed if the logged-in user was the receiver (not the caller)
    return !isCaller;
  }
  if (status === CometChat.CALL_STATUS.REJECTED) {
    return !isCaller;
  }
  if (status === CometChat.CALL_STATUS.CANCELLED) {
    return !isCaller;
  }
  return false;
}

// ==================== Call Message Text ====================

/**
 * Returns the localized display text for a call message bubble.
 *
 * @param message - The call message
 * @param loggedInUid - UID of the currently logged-in user
 */
export function getCallMessageText(
  message: CometChat.BaseMessage,
  loggedInUid: string
): string {
  if (!(message instanceof CometChat.Call)) {
    return CometChatLocalize.getLocalizedString('call_message_unknown');
  }

  const call = message as CometChat.Call;
  const status = call.getStatus();
  const callType = call.getType();
  const initiatorUid = call.getCallInitiator()?.getUid();
  const isCaller = initiatorUid === loggedInUid;
  const isVideo = callType === CometChat.CALL_TYPE.VIDEO;

  switch (status) {
    case CometChat.CALL_STATUS.INITIATED:
      return isCaller
        ? CometChatLocalize.getLocalizedString(
            isVideo ? 'call_outgoing_video' : 'call_outgoing_audio'
          )
        : CometChatLocalize.getLocalizedString(
            isVideo ? 'call_incoming_video' : 'call_incoming_audio'
          );

    case CometChat.CALL_STATUS.ONGOING:
      return CometChatLocalize.getLocalizedString('call_message_ongoing');

    case CometChat.CALL_STATUS.ENDED:
      return CometChatLocalize.getLocalizedString('call_message_ended');

    case CometChat.CALL_STATUS.UNANSWERED:
    case CometChat.CALL_STATUS.REJECTED:
    case CometChat.CALL_STATUS.CANCELLED:
      return isCaller
        ? CometChatLocalize.getLocalizedString('call_message_cancelled')
        : CometChatLocalize.getLocalizedString(
            isVideo ? 'call_missed_video' : 'call_missed_audio'
          );

    case CometChat.CALL_STATUS.BUSY:
      return CometChatLocalize.getLocalizedString('call_message_busy');

    default:
      return CometChatLocalize.getLocalizedString('call_message_unknown');
  }
}

// ==================== Call Icon Resolution ====================

/**
 * Returns the icon name for a call message based on its type and status.
 *
 * @param message - The call message
 * @param loggedInUid - UID of the currently logged-in user
 */
export function getCallIconName(
  message: CometChat.BaseMessage,
  loggedInUid: string
): string {
  if (!(message instanceof CometChat.Call)) return 'call';

  const call = message as CometChat.Call;
  const callType = call.getType();
  const isVideo = callType === CometChat.CALL_TYPE.VIDEO;
  const missed = isMissedCall(call, loggedInUid);

  if (missed) {
    return isVideo ? 'missed-video-call' : 'missed-audio-call';
  }
  return isVideo ? 'video-call' : 'audio-call';
}

/**
 * Returns whether the call icon should use the error/missed color.
 */
export function isCallIconErrorColor(
  message: CometChat.BaseMessage,
  loggedInUid: string
): boolean {
  if (!(message instanceof CometChat.Call)) return false;
  return isMissedCall(message as CometChat.Call, loggedInUid);
}

// ==================== Call Button Text ====================

/**
 * Returns the localized text for the call bubble's join/callback button.
 *
 * @param message - The call message
 */
export function getCallButtonText(message: CometChat.BaseMessage): string {
  if (!(message instanceof CometChat.Call)) return '';

  const call = message as CometChat.Call;
  const status = call.getStatus();

  if (status === CometChat.CALL_STATUS.ONGOING) {
    return CometChatLocalize.getLocalizedString('call_join');
  }
  return CometChatLocalize.getLocalizedString('call_callback');
}
