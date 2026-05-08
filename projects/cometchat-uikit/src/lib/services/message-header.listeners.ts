/**
 * SDK listener setup helpers for MessageHeaderService.
 *
 * These functions set up and tear down CometChat SDK listeners
 * (user status, typing, group member, connection) and are called
 * from MessageHeaderService to keep the main service file lean.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';

// ─── User Status Listener ────────────────────────────────────────────────────

/**
 * Register a CometChat UserListener under the given ID.
 * Calls `onOnline` / `onOffline` when any user's status changes.
 */
export function addUserStatusListener(
  listenerId: string,
  onOnline: (user: CometChat.User) => void,
  onOffline: (user: CometChat.User) => void
): void {
  CometChat.addUserListener(
    listenerId,
    new CometChat.UserListener({
      onUserOnline: onOnline,
      onUserOffline: onOffline,
    })
  );
}

/** Remove the user status listener registered under `listenerId`. */
export function removeUserStatusListener(listenerId: string): void {
  try {
    CometChat.removeUserListener(listenerId);
  } catch (error) {
    CometChatLogger.error('message-header.listeners', 'Error removing user status listener:', error);
  }
}

// ─── Typing Listener ─────────────────────────────────────────────────────────

/**
 * Register a CometChat MessageListener under the given ID.
 * Calls `onStarted` / `onEnded` for typing indicator events.
 */
export function addTypingListener(
  listenerId: string,
  onStarted: (indicator: CometChat.TypingIndicator) => void,
  onEnded: (indicator: CometChat.TypingIndicator) => void
): void {
  CometChat.addMessageListener(
    listenerId,
    new CometChat.MessageListener({
      onTypingStarted: onStarted,
      onTypingEnded: onEnded,
    })
  );
}

/** Remove the message (typing) listener registered under `listenerId`. */
export function removeTypingListener(listenerId: string): void {
  try {
    CometChat.removeMessageListener(listenerId);
  } catch (error) {
    CometChatLogger.error('message-header.listeners', 'Error removing typing listener:', error);
  }
}

// ─── Group Member Listener ───────────────────────────────────────────────────

export interface GroupMemberListenerCallbacks {
  onJoined: (message: CometChat.Action, user: CometChat.User, group: CometChat.Group) => void;
  onLeft: (message: CometChat.Action, user: CometChat.User, group: CometChat.Group) => void;
  onKicked: (
    message: CometChat.Action,
    kicked: CometChat.User,
    by: CometChat.User,
    from: CometChat.Group
  ) => void;
  onBanned: (
    message: CometChat.Action,
    banned: CometChat.User,
    by: CometChat.User,
    from: CometChat.Group
  ) => void;
  onAdded: (
    message: CometChat.Action,
    added: CometChat.User,
    by: CometChat.User,
    into: CometChat.Group
  ) => void;
  onScopeChanged: (
    message: CometChat.Action,
    user: CometChat.User,
    newScope: string,
    oldScope: string,
    group: CometChat.Group
  ) => void;
}

/**
 * Register a CometChat GroupListener under the given ID.
 */
export function addGroupMemberListener(
  listenerId: string,
  callbacks: GroupMemberListenerCallbacks
): void {
  CometChat.addGroupListener(
    listenerId,
    new CometChat.GroupListener({
      onGroupMemberJoined: callbacks.onJoined,
      onGroupMemberLeft: callbacks.onLeft,
      onGroupMemberKicked: callbacks.onKicked,
      onGroupMemberBanned: callbacks.onBanned,
      onMemberAddedToGroup: callbacks.onAdded,
      onGroupMemberScopeChanged: callbacks.onScopeChanged,
    })
  );
}

/** Remove the group listener registered under `listenerId`. */
export function removeGroupMemberListener(listenerId: string): void {
  try {
    CometChat.removeGroupListener(listenerId);
  } catch (error) {
    CometChatLogger.error('message-header.listeners', 'Error removing group member listener:', error);
  }
}

// ─── Connection Listener ─────────────────────────────────────────────────────

/**
 * Register a CometChat ConnectionListener under the given ID.
 */
export function addConnectionListener(
  listenerId: string,
  onConnected: () => void,
  onDisconnected: () => void
): void {
  CometChat.addConnectionListener(
    listenerId,
    new CometChat.ConnectionListener({
      onConnected,
      onDisconnected,
    })
  );
}

/** Remove the connection listener registered under `listenerId`. */
export function removeConnectionListener(listenerId: string): void {
  try {
    CometChat.removeConnectionListener(listenerId);
  } catch (error) {
    CometChatLogger.error('message-header.listeners', 'Error removing connection listener:', error);
  }
}
