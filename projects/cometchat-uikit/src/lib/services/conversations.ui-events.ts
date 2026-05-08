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

export interface UIEventHandlers {
  refreshSingleConversation: (message: CometChat.BaseMessage) => void;
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
    handlers.refreshSingleConversation(item.message)
  ));

  // ccGroupMemberAdded: update group + last message
  subs.push(CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
    const message = item.messages[item.messages.length - 1];
    if (message) { handlers.updateGroupOnConversation(item.userAddedIn); handlers.refreshSingleConversation(message); }
  }));

  // ccGroupMemberKicked / ccGroupMemberBanned
  subs.push(CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
    handlers.updateGroupOnConversation(item.kickedFrom); handlers.refreshSingleConversation(item.message);
  }));
  subs.push(CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
    handlers.updateGroupOnConversation(item.kickedFrom); handlers.refreshSingleConversation(item.message);
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
