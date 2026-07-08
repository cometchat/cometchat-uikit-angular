/**
 * SDK listener setup helpers for ConversationsService.
 *
 * Registers and removes CometChat SDK listeners (message, user, group, call)
 * and keeps that boilerplate out of the main service file.
 */

import { NgZone } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';

// ─── Message Listener ─────────────────────────────────────────────────────────

export interface MessageListenerCallbacks {
  onTextMessageReceived: (m: CometChat.TextMessage) => void;
  onMediaMessageReceived: (m: CometChat.MediaMessage) => void;
  onCustomMessageReceived: (m: CometChat.CustomMessage) => void;
  onInteractiveMessageReceived: (m: CometChat.InteractiveMessage) => void;
  onCardMessageReceived: (m: CometChat.CardMessage) => void;
  onAIAssistantMessageReceived: (m: CometChat.BaseMessage) => void;
  onMessageEdited: (m: CometChat.BaseMessage) => void;
  onMessageDeleted: (m: CometChat.BaseMessage) => void;
  onMessagesDelivered: (r: CometChat.MessageReceipt) => void;
  onMessagesRead: (r: CometChat.MessageReceipt) => void;
  onMessagesDeliveredToAll: (r: CometChat.MessageReceipt) => void;
  onMessagesReadByAll: (r: CometChat.MessageReceipt) => void;
  onTypingStarted: (t: CometChat.TypingIndicator) => void;
  onTypingEnded: (t: CometChat.TypingIndicator) => void;
}

export function setupMessageListener(
  listenerId: string,
  callbacks: MessageListenerCallbacks,
  ngZone: NgZone
): void {
  try {
    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (m: CometChat.TextMessage) => ngZone.run(() => callbacks.onTextMessageReceived(m)),
        onMediaMessageReceived: (m: CometChat.MediaMessage) => ngZone.run(() => callbacks.onMediaMessageReceived(m)),
        onCustomMessageReceived: (m: CometChat.CustomMessage) => ngZone.run(() => callbacks.onCustomMessageReceived(m)),
        onInteractiveMessageReceived: (m: CometChat.InteractiveMessage) => ngZone.run(() => callbacks.onInteractiveMessageReceived(m)),
        // Developer card (category "card"); keep the conversation list's
        // last message in sync, same as text/media/custom/interactive.
        onCardMessageReceived: (m: CometChat.CardMessage) => ngZone.run(() => callbacks.onCardMessageReceived(m)),
        onAIAssistantMessageReceived: (m: CometChat.BaseMessage) => ngZone.run(() => callbacks.onAIAssistantMessageReceived(m)),
        onMessageEdited: (m: CometChat.BaseMessage) => ngZone.run(() => callbacks.onMessageEdited(m)),
        onMessageDeleted: (m: CometChat.BaseMessage) => ngZone.run(() => callbacks.onMessageDeleted(m)),
        onMessagesDelivered: (r: CometChat.MessageReceipt) => ngZone.run(() => callbacks.onMessagesDelivered(r)),
        onMessagesRead: (r: CometChat.MessageReceipt) => ngZone.run(() => callbacks.onMessagesRead(r)),
        onMessagesDeliveredToAll: (r: CometChat.MessageReceipt) => ngZone.run(() => callbacks.onMessagesDeliveredToAll(r)),
        onMessagesReadByAll: (r: CometChat.MessageReceipt) => ngZone.run(() => callbacks.onMessagesReadByAll(r)),
        onTypingStarted: (t: CometChat.TypingIndicator) => ngZone.run(() => callbacks.onTypingStarted(t)),
        onTypingEnded: (t: CometChat.TypingIndicator) => ngZone.run(() => callbacks.onTypingEnded(t)),
      })
    );
  } catch (error) {
    CometChatLogger.error('conversations.listeners', 'Error setting up message listener:', error);
  }
}

export function removeMessageListener(listenerId: string): void {
  try { CometChat.removeMessageListener(listenerId); }
  catch (e) { CometChatLogger.error('conversations.listeners', 'Error removing message listener:', e); }
}

// ─── User Listener ────────────────────────────────────────────────────────────

export function setupUserListener(
  listenerId: string,
  onStatusChange: (user: CometChat.User) => void,
  ngZone: NgZone
): void {
  try {
    CometChat.addUserListener(
      listenerId,
      new CometChat.UserListener({
        onUserOnline: (u: CometChat.User) => ngZone.run(() => onStatusChange(u)),
        onUserOffline: (u: CometChat.User) => ngZone.run(() => onStatusChange(u)),
      })
    );
  } catch (error) {
    CometChatLogger.error('conversations.listeners', 'Error setting up user listener:', error);
  }
}

export function removeUserListener(listenerId: string): void {
  try { CometChat.removeUserListener(listenerId); }
  catch (e) { CometChatLogger.error('conversations.listeners', 'Error removing user listener:', e); }
}

// ─── Group Listener ───────────────────────────────────────────────────────────

export function setupGroupListener(
  listenerId: string,
  onGroupAction: (message: CometChat.Action) => void,
  ngZone: NgZone
): void {
  try {
    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberJoined: (m: CometChat.Action) => ngZone.run(() => onGroupAction(m)),
        onGroupMemberLeft: (m: CometChat.Action) => ngZone.run(() => onGroupAction(m)),
        onGroupMemberKicked: (m: CometChat.Action) => ngZone.run(() => onGroupAction(m)),
        onGroupMemberBanned: (m: CometChat.Action) => ngZone.run(() => onGroupAction(m)),
        onGroupMemberUnbanned: (m: CometChat.Action) => ngZone.run(() => onGroupAction(m)),
        onGroupMemberScopeChanged: (m: CometChat.Action) => ngZone.run(() => onGroupAction(m)),
        onMemberAddedToGroup: (m: CometChat.Action) => ngZone.run(() => onGroupAction(m)),
      })
    );
  } catch (error) {
    CometChatLogger.error('conversations.listeners', 'Error setting up group listener:', error);
  }
}

export function removeGroupListener(listenerId: string): void {
  try { CometChat.removeGroupListener(listenerId); }
  catch (e) { CometChatLogger.error('conversations.listeners', 'Error removing group listener:', e); }
}

// ─── Call Listener ────────────────────────────────────────────────────────────

export function setupCallListener(
  listenerId: string,
  onCallEvent: (call: CometChat.Call) => void,
  ngZone: NgZone
): void {
  try {
    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (c: CometChat.Call) => ngZone.run(() => onCallEvent(c)),
        onIncomingCallCancelled: (c: CometChat.Call) => ngZone.run(() => onCallEvent(c)),
        onOutgoingCallAccepted: (c: CometChat.Call) => ngZone.run(() => onCallEvent(c)),
        onOutgoingCallRejected: (c: CometChat.Call) => ngZone.run(() => onCallEvent(c)),
        onCallEndedMessageReceived: (c: CometChat.Call) => ngZone.run(() => onCallEvent(c)),
      })
    );
  } catch (error) {
    CometChatLogger.error('conversations.listeners', 'Error setting up call listener:', error);
  }
}

export function removeCallListener(listenerId: string): void {
  try { CometChat.removeCallListener(listenerId); }
  catch (e) { CometChatLogger.error('conversations.listeners', 'Error removing call listener:', e); }
}
