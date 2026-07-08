/**
 * SDK listener setup functions for MessageListService.
 * Extracted to keep message-list.service.ts under 400 lines.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { NgZone } from '@angular/core';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKitConstants } from '../constants';

export interface MessageListListenerHost {
  getMessageListenerId(): string;
  getGroupListenerId(): string;
  getCallListenerId(): string;
  getConnectionListenerId(): string;
  handleNewMessage(message: CometChat.BaseMessage): void;
  handleMessageEdited(message: CometChat.BaseMessage): void;
  handleMessageDeleted(message: CometChat.BaseMessage): void;
  handleReceipt(receipt: CometChat.MessageReceipt, isGroupReceipt: boolean): void;
  handleReactionEvent(reactionEvent: CometChat.ReactionEvent, action: 'added' | 'removed'): void;
  handleGroupAction(message: CometChat.Action, group: CometChat.Group): void;
  handleCallAction(call: CometChat.Call): void;
  handleReconnection(): Promise<void>;
  getMessageById(id: number): CometChat.BaseMessage | undefined;
  updateMessageById(id: number, message: CometChat.BaseMessage): boolean;
  addMessage(message: CometChat.BaseMessage): void;
  setConnectionStatus(status: 'connected' | 'disconnected'): void;
}

export function setupMessageListener(host: MessageListListenerHost, ngZone: NgZone): void {
  CometChat.addMessageListener(
    host.getMessageListenerId(),
    new CometChat.MessageListener({
      onTextMessageReceived: (m: CometChat.TextMessage) => { try { host.handleNewMessage(m); } catch (e) { CometChatLogger.error('MessageListService', 'onTextMessageReceived', e); } },
      onMediaMessageReceived: (m: CometChat.MediaMessage) => { try { host.handleNewMessage(m); } catch (e) { CometChatLogger.error('MessageListService', 'onMediaMessageReceived', e); } },
      onCustomMessageReceived: (m: CometChat.CustomMessage) => { try { host.handleNewMessage(m); } catch (e) { CometChatLogger.error('MessageListService', 'onCustomMessageReceived', e); } },
      onInteractiveMessageReceived: (m: CometChat.InteractiveMessage) => { try { host.handleNewMessage(m); } catch (e) { CometChatLogger.error('MessageListService', 'onInteractiveMessageReceived', e); } },
      onMessageEdited: (m: CometChat.BaseMessage) => { try { host.handleMessageEdited(m); } catch (e) { CometChatLogger.error('MessageListService', 'onMessageEdited', e); } },
      onMessageDeleted: (m: CometChat.BaseMessage) => { try { host.handleMessageDeleted(m); } catch (e) { CometChatLogger.error('MessageListService', 'onMessageDeleted', e); } },
      onMessagesDelivered: (r: CometChat.MessageReceipt) => { try { ngZone.run(() => host.handleReceipt(r, false)); } catch (e) { CometChatLogger.error('MessageListService', 'onMessagesDelivered', e); } },
      onMessagesRead: (r: CometChat.MessageReceipt) => { try { ngZone.run(() => host.handleReceipt(r, false)); } catch (e) { CometChatLogger.error('MessageListService', 'onMessagesRead', e); } },
      onMessagesDeliveredToAll: (r: CometChat.MessageReceipt) => { try { ngZone.run(() => host.handleReceipt(r, true)); } catch (e) { CometChatLogger.error('MessageListService', 'onMessagesDeliveredToAll', e); } },
      onMessagesReadByAll: (r: CometChat.MessageReceipt) => { try { ngZone.run(() => host.handleReceipt(r, true)); } catch (e) { CometChatLogger.error('MessageListService', 'onMessagesReadByAll', e); } },
      onMessageReactionAdded: (e: CometChat.ReactionEvent) => { try { host.handleReactionEvent(e, 'added'); } catch (err) { CometChatLogger.error('MessageListService', 'onMessageReactionAdded', err); } },
      onMessageReactionRemoved: (e: CometChat.ReactionEvent) => { try { host.handleReactionEvent(e, 'removed'); } catch (err) { CometChatLogger.error('MessageListService', 'onMessageReactionRemoved', err); } },
      onAIAssistantMessageReceived: (m: CometChat.BaseMessage) => { try { host.handleNewMessage(m); } catch (e) { CometChatLogger.error('MessageListService', 'onAIAssistantMessageReceived', e); } },
      // Persisted developer cards (category "card"). Agent cards keep
      // arriving on onAIAssistantMessageReceived above; no agent-card listener added.
      onCardMessageReceived: (m: CometChat.BaseMessage) => { try { host.handleNewMessage(m); } catch (e) { CometChatLogger.error('MessageListService', 'onCardMessageReceived', e); } },
    })
  );
}

export function setupGroupListener(host: MessageListListenerHost): void {
  CometChat.addGroupListener(
    host.getGroupListenerId(),
    new CometChat.GroupListener({
      onGroupMemberJoined: (msg: CometChat.Action, _u: CometChat.User, g: CometChat.Group) => { try { host.handleGroupAction(msg, g); } catch (e) { CometChatLogger.error('MessageListService', 'onGroupMemberJoined', e); } },
      onGroupMemberLeft: (msg: CometChat.Action, _u: CometChat.User, g: CometChat.Group) => { try { host.handleGroupAction(msg, g); } catch (e) { CometChatLogger.error('MessageListService', 'onGroupMemberLeft', e); } },
      onGroupMemberKicked: (msg: CometChat.Action, _ku: CometChat.User, _kb: CometChat.User, g: CometChat.Group) => { try { host.handleGroupAction(msg, g); } catch (e) { CometChatLogger.error('MessageListService', 'onGroupMemberKicked', e); } },
      onGroupMemberBanned: (msg: CometChat.Action, _bu: CometChat.User, _bb: CometChat.User, g: CometChat.Group) => { try { host.handleGroupAction(msg, g); } catch (e) { CometChatLogger.error('MessageListService', 'onGroupMemberBanned', e); } },
      onGroupMemberUnbanned: (msg: CometChat.Action, _uu: CometChat.User, _ub: CometChat.User, g: CometChat.Group) => { try { host.handleGroupAction(msg, g); } catch (e) { CometChatLogger.error('MessageListService', 'onGroupMemberUnbanned', e); } },
      onGroupMemberScopeChanged: (msg: CometChat.Action, _cu: CometChat.User, _ns: string, _os: string, g: CometChat.Group) => { try { host.handleGroupAction(msg, g); } catch (e) { CometChatLogger.error('MessageListService', 'onGroupMemberScopeChanged', e); } },
      onMemberAddedToGroup: (msg: CometChat.Action, _ua: CometChat.User, _ub: CometChat.User, g: CometChat.Group) => { try { host.handleGroupAction(msg, g); } catch (e) { CometChatLogger.error('MessageListService', 'onMemberAddedToGroup', e); } },
    })
  );
}

export function setupCallListener(host: MessageListListenerHost): void {
  CometChat.addCallListener(
    host.getCallListenerId(),
    new CometChat.CallListener({
      onIncomingCallReceived: (c: CometChat.Call) => { try { host.handleCallAction(c); } catch (e) { CometChatLogger.error('MessageListService', 'onIncomingCallReceived', e); } },
      onIncomingCallCancelled: (c: CometChat.Call) => { try { host.handleCallAction(c); } catch (e) { CometChatLogger.error('MessageListService', 'onIncomingCallCancelled', e); } },
      onOutgoingCallRejected: (c: CometChat.Call) => { try { host.handleCallAction(c); } catch (e) { CometChatLogger.error('MessageListService', 'onOutgoingCallRejected', e); } },
      onOutgoingCallAccepted: (c: CometChat.Call) => { try { host.handleCallAction(c); } catch (e) { CometChatLogger.error('MessageListService', 'onOutgoingCallAccepted', e); } },
      onCallEndedMessageReceived: (c: CometChat.Call) => { try { host.handleCallAction(c); } catch (e) { CometChatLogger.error('MessageListService', 'onCallEndedMessageReceived', e); } },
    })
  );
}

export function setupConnectionListener(
  host: MessageListListenerHost,
  listenerId: string
): void {
  try {
    CometChat.removeConnectionListener(listenerId);
    CometChat.addConnectionListener(
      listenerId,
      new CometChat.ConnectionListener({
        onConnected: () => {
          try { host.setConnectionStatus('connected'); host.handleReconnection(); }
          catch (e) { CometChatLogger.error('MessageListService', 'onConnected', e); }
        },
        onDisconnected: () => {
          try { host.setConnectionStatus('disconnected'); }
          catch (e) { CometChatLogger.error('MessageListService', 'onDisconnected', e); }
        },
      })
    );
  } catch (e) {
    CometChatLogger.error('MessageListService', 'setupConnectionListener', e);
  }
}
