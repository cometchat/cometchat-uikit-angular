/**
 * UI event subscription setup for ConversationsService.
 *
 * Subscribes to CometChatGroupEvents, CometChatUserEvents,
 * CometChatMessageEvents, and CometChatConversationEvents so the
 * conversations list stays in sync with actions taken by the logged-in user.
 */

import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents, IMessages } from '../events/CometChatMessageEvents';
import { CometChatConversationEvents } from '../events/CometChatConversationEvents';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import {
  CometChatGroupEvents,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
  IGroupLeft,
} from '../events/CometChatGroupEvents';
import { CometChatUserEvents } from '../events/CometChatUserEvents';
import { MessageStatus } from '../Enums/Enums';
import { CometChatUIKitConstants } from '../constants';
import { CometChatLogger } from '../utils/CometChatLogger';
import { getConversationEntityId } from './conversations.utils';

/**
 * Whether `message` is older than `shown`, the row's current last message
 * (Android ConversationListOffline.isOlderThan): the same message is not older;
 * otherwise the earlier sentAt is older, and on a tie the lower id.
 */
export function isOlderThanShown(message: CometChat.BaseMessage, shown: CometChat.BaseMessage): boolean {
  const id = message.getId?.() ?? 0;
  const shownId = shown.getId?.() ?? 0;
  if (id && id === shownId) return false;
  const sentAt = message.getSentAt?.() ?? 0;
  const shownSentAt = shown.getSentAt?.() ?? 0;
  if (sentAt !== shownSentAt) return sentAt < shownSentAt;
  return id !== 0 && id < shownId;
}

export interface UIEventHandlers {
  refreshSingleConversation: (message: CometChat.BaseMessage) => void;
  /**
   * Like refreshSingleConversation, for a kick, ban or scope change: it updates
   * the row's preview and order only when the action is newer than the row's
   * last message, since the offline hub replays swept actions after the sync.
   */
  refreshForGroupAction: (action: CometChat.BaseMessage) => void;
  removeConversationSilently: (id: string) => void;
  updateGroupOnConversation: (group: CometChat.Group) => void;
  updateUserOnConversation: (user: CometChat.User) => void;
  addConversationToTop: (conv: CometChat.Conversation) => void;
  removeConversationFromList: (id: string) => void;
  requestBuilder?: CometChat.ConversationsRequestBuilder;
}

export function setupUIEventSubscriptions(handlers: UIEventHandlers): Subscription[] {
  const subs: Subscription[] = [];

  // ccGroupCreated: fetch conversation from SDK and add to list
  subs.push(
    CometChatGroupEvents.ccGroupCreated.subscribe((group: CometChat.Group) => {
      CometChat.getConversation(group.getGuid(), CometChatUIKitConstants.MessageReceiverType.group)
        .then((conv: CometChat.Conversation) => { if (conv) handlers.addConversationToTop(conv); })
        .catch((e: CometChat.CometChatException) =>
          CometChatLogger.error('conversations.ui-events', 'Error fetching conversation for created group:', e)
        );
    })
  );

  // ccGroupDeleted / ccGroupLeft: remove from list
  subs.push(CometChatGroupEvents.ccGroupDeleted.subscribe((g: CometChat.Group) => handlers.removeConversationSilently(g.getGuid())));
  subs.push(CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => handlers.removeConversationSilently(item.leftGroup.getGuid())));

  // ccGroupMemberScopeChanged: update last message
  subs.push(CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((item: IGroupMemberScopeChanged) =>
    handlers.refreshForGroupAction(item.message)
  ));

  // ccGroupMemberAdded: update group + last message
  subs.push(CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
    const message = item.messages[item.messages.length - 1];
    if (message) { handlers.updateGroupOnConversation(item.userAddedIn); handlers.refreshSingleConversation(message); }
  }));

  // ccGroupMemberKicked / ccGroupMemberBanned
  subs.push(CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
    handlers.updateGroupOnConversation(item.kickedFrom); handlers.refreshForGroupAction(item.message);
  }));
  subs.push(CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
    handlers.updateGroupOnConversation(item.kickedFrom); handlers.refreshForGroupAction(item.message);
  }));

  // ccUserBlocked: remove or update depending on request builder setting
  subs.push(CometChatUserEvents.ccUserBlocked.subscribe((user: CometChat.User) => {
    const req = handlers.requestBuilder;
    if (req && req.build()?.isIncludeBlockedUsers?.()) { handlers.updateUserOnConversation(user); return; }
    handlers.removeConversationSilently(user.getUid());
  }));

  // ccUserUnblocked: update user on conversation
  subs.push(CometChatUserEvents.ccUserUnblocked.subscribe((user: CometChat.User) => handlers.updateUserOnConversation(user)));

  // ccMessageEdited: update last message on success
  subs.push(CometChatMessageEvents.ccMessageEdited.subscribe((data: IMessages) => {
    if (data.status === MessageStatus.success) handlers.refreshSingleConversation(data.message);
  }));

  // ccConversationDeleted: remove from list without re-publishing event
  subs.push(CometChatConversationEvents.ccConversationDeleted.subscribe((conversation: CometChat.Conversation) => {
    if (conversation) handlers.removeConversationFromList(getConversationEntityId(conversation));
  }));

  return subs;
}

export function setupCallEventSubscriptions(
  onCallEvent: (call: CometChat.Call) => void
): Subscription[] {
  return [
    CometChatCallEvents.ccOutgoingCall.subscribe((c: CometChat.Call) => { if (c) onCallEvent(c); }),
    CometChatCallEvents.ccCallAccepted.subscribe((c: CometChat.Call) => { if (c) onCallEvent(c); }),
    CometChatCallEvents.ccCallRejected.subscribe((c: CometChat.Call) => { if (c) onCallEvent(c); }),
    CometChatCallEvents.ccCallEnded.subscribe((c: CometChat.Call) => { if (c) onCallEvent(c); }),
  ];
}
