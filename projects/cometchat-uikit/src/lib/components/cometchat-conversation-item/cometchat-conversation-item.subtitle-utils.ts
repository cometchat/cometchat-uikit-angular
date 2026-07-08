/**
 * Subtitle computation utilities for CometChatConversationItem component.
 *
 * Extracted from cometchat-conversation-item.component.ts to isolate
 * the subtitle text/icon resolution logic for different message types.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitConstants } from '../../constants';

// ==================== Subtitle Icon Resolution ====================

/**
 * Returns the icon name suffix for the subtitle area based on message type.
 * Returns 'none' for text messages without links, or 'unsupported' for unknown types.
 *
 * @param message - The last message in the conversation
 * @param loggedInUid - UID of the currently logged-in user (for call direction)
 */
export function getSubtitleIconName(
  message: CometChat.BaseMessage | undefined,
  loggedInUid: string
): string {
  if (!message) return 'none';
  if (message.getDeletedAt()) return 'deleted';

  const messageType = message.getType();
  const messageCategory = message.getCategory();

  if (messageCategory === 'action') return 'none';
  if (messageCategory === 'interactive') return 'none';

  if (messageCategory === 'call') {
    return getCallIconNameForSubtitle(message as CometChat.Call, loggedInUid);
  }

  if (messageCategory === 'custom' && messageType === 'meeting') {
    return getMeetingIconName(message as CometChat.CustomMessage);
  }

  switch (messageType) {
    case 'text': {
      const text = (message as CometChat.TextMessage).getText() || '';
      if (isURL(text) || hasMarkdownLink(text)) return 'link';
      return 'none';
    }
    case 'image': return 'image';
    case 'video': return 'video';
    case 'audio': return 'audio';
    case 'file': return 'file';
    case CometChatUIKitConstants.ExtensionTypes.poll: return 'poll';
    case CometChatUIKitConstants.ExtensionTypes.sticker: return 'sticker';
    case CometChatUIKitConstants.ExtensionTypes.document: return 'collaborative-document';
    case CometChatUIKitConstants.ExtensionTypes.whiteboard: return 'collaborative-whiteboard';
    default: return 'unsupported';
  }
}

// ==================== Call Icon Helpers ====================

/**
 * Returns the icon name for a call message in the subtitle.
 */
export function getCallIconNameForSubtitle(
  call: CometChat.Call,
  loggedInUid: string
): string {
  const callType = call.getType?.() || '';
  const missed = isMissedCallForUser(call, loggedInUid);

  if (missed) {
    return callType === CometChatUIKitConstants.MessageTypes.audio
      ? 'incoming-audio-call'
      : 'incoming-video-call';
  }
  return callType === CometChatUIKitConstants.MessageTypes.audio
    ? 'outgoing-audio-call'
    : 'outgoing-video-call';
}

/**
 * Determines if a call was missed by the given user.
 * A call is missed when the user did NOT initiate it and the status is
 * unanswered, cancelled, busy, or rejected.
 */
export function isMissedCallForUser(
  call: CometChat.Call,
  loggedInUid: string
): boolean {
  const callStatus = call.getStatus?.() || '';

  let initiatorUid = '';
  try {
    initiatorUid = call.getCallInitiator?.()?.getUid?.() || '';
  } catch {
    try {
      initiatorUid = (call as any).getInitiator?.()?.getUid?.() || '';
    } catch {
      // Cannot determine initiator
    }
  }

  const sentByMe = !initiatorUid || initiatorUid === loggedInUid;
  if (sentByMe) return false;

  const missedStatuses = [
    CometChatUIKitConstants.calls.unanswered,
    CometChatUIKitConstants.calls.cancelled,
    CometChatUIKitConstants.calls.busy,
    CometChatUIKitConstants.calls.rejected,
  ];
  return missedStatuses.includes(callStatus);
}

// ==================== Meeting Icon Helper ====================

/**
 * Returns the icon name for a group meeting (direct call) message.
 */
export function getMeetingIconName(message: CometChat.CustomMessage): string {
  try {
    const customData = message.getCustomData?.() as Record<string, any> | undefined;
    const callType = customData?.['callType'] || '';
    if (callType === CometChatUIKitConstants.MessageTypes.audio) return 'meeting-audio-call';
    return 'meeting-video-call';
  } catch {
    return 'meeting-video-call';
  }
}

// ==================== Action Message Text ====================

/**
 * Returns the localized text for a group action message.
 */
export function getActionMessageText(
  message: CometChat.BaseMessage,
  loggedInUid: string
): string {
  const action = message as CometChat.Action;
  const actionOn = action.getActionOn?.();
  const actionBy = action.getActionBy?.();
  const actionType = action.getAction?.() || '';

  const byName = (actionBy as CometChat.User)?.getName?.() || '';
  const onName = (actionOn as CometChat.User)?.getName?.() || '';
  const isSelf = (actionBy as CometChat.User)?.getUid?.() === loggedInUid;
  const byText = isSelf
    ? CometChatLocalize.getLocalizedString('conversation_you')
    : byName;

  switch (actionType) {
    case CometChatUIKitConstants.groupMemberAction.JOINED:
      return `${byText} ${CometChatLocalize.getLocalizedString('conversation_action_joined')}`;
    case CometChatUIKitConstants.groupMemberAction.LEFT:
      return `${byText} ${CometChatLocalize.getLocalizedString('conversation_action_left')}`;
    case CometChatUIKitConstants.groupMemberAction.KICKED:
      return `${byText} ${CometChatLocalize.getLocalizedString('conversation_action_kicked')} ${onName}`;
    case CometChatUIKitConstants.groupMemberAction.BANNED:
      return `${byText} ${CometChatLocalize.getLocalizedString('conversation_action_banned')} ${onName}`;
    case CometChatUIKitConstants.groupMemberAction.UNBANNED:
      return `${byText} ${CometChatLocalize.getLocalizedString('conversation_action_unbanned')} ${onName}`;
    case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
      return `${byText} ${CometChatLocalize.getLocalizedString('conversation_action_scope_changed')} ${onName}`;
    case CometChatUIKitConstants.groupMemberAction.ADDED:
      return `${byText} ${CometChatLocalize.getLocalizedString('conversation_action_added')} ${onName}`;
    default:
      return CometChatLocalize.getLocalizedString('conversation_action_default');
  }
}

// ==================== URL / Markdown Link Detection ====================

/**
 * Checks if a string is a plain HTTP/HTTPS URL.
 */
export function isURL(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if a string contains a markdown link [text](url).
 */
export function hasMarkdownLink(text: string): boolean {
  return /\[([^\]]+)\]\(([^)]+)\)/.test(text);
}

// ==================== Sender Name Prefix ====================

/**
 * Returns the sender name prefix for group conversation subtitles.
 * e.g. "You: " or "Alice: "
 *
 * @param message - The last message
 * @param loggedInUid - UID of the currently logged-in user
 * @param isGroupConversation - Whether this is a group conversation
 */
export function getSenderNamePrefix(
  message: CometChat.BaseMessage | undefined,
  loggedInUid: string,
  isGroupConversation: boolean
): string {
  if (!message || !isGroupConversation) return '';

  const category = message.getCategory();
  if (category === 'action' || category === 'call') return '';

  const sender = message.getSender?.();
  if (!sender) return '';

  const senderUid = sender.getUid?.() || '';
  if (senderUid === loggedInUid) {
    return `${CometChatLocalize.getLocalizedString('conversation_you')}: `;
  }
  return `${sender.getName?.() || ''}: `;
}
