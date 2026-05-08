/**
 * Static helper utilities for CometChatUIKit.
 * Contains message sending helpers and user management helpers
 * extracted to keep cometchat-uikit.ts under 400 lines.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents } from './events/CometChatMessageEvents';
import { MessageStatus } from './Enums/Enums';
import { CometChatUIKitUtility } from './CometChatUIKitUtility';

// ── Message Sending ───────────────────────────────────────────────────────

/**
 * Sends a text message and emits inprogress/success/error events.
 */
export function sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> {
  return new Promise((resolve, reject) => {
    message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    if (!message?.getMuid()) { message.setMuid(CometChatUIKitUtility.ID()); }
    CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.inprogress });
    CometChat.sendMessage(message)
      .then((sent: CometChat.BaseMessage) => {
        CometChatMessageEvents.ccMessageSent.next({ message: sent, status: MessageStatus.success });
        return resolve(sent);
      })
      .catch((error: CometChat.CometChatException) => {
        message.setMetadata({ error });
        CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.error });
        return reject(error);
      });
  });
}

/**
 * Sends a media message and emits inprogress/success/error events.
 */
export function sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage> {
  message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
  if (!message?.getMuid()) { message.setMuid(CometChatUIKitUtility.ID()); }
  return new Promise((resolve, reject) => {
    CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.inprogress });
    CometChat.sendMediaMessage(message)
      .then((sent: CometChat.BaseMessage) => {
        CometChatMessageEvents.ccMessageSent.next({ message: sent, status: MessageStatus.success });
        return resolve(sent);
      })
      .catch((error: CometChat.CometChatException) => {
        message.setMetadata({ error });
        CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.error });
        return reject(error);
      });
  });
}

/**
 * Sends a custom message and emits inprogress/success/error events.
 */
export function sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> {
  return new Promise((resolve, reject) => {
    message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    if (!message?.getMuid()) { message.setMuid(CometChatUIKitUtility.ID()); }
    CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.inprogress });
    CometChat.sendCustomMessage(message)
      .then((sent: CometChat.BaseMessage) => {
        CometChatMessageEvents.ccMessageSent.next({ message: sent, status: MessageStatus.success });
        return resolve(sent);
      })
      .catch((error: CometChat.CometChatException) => {
        message.setMetadata({ error });
        CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.error });
        return reject(error);
      });
  });
}

// ── User Management ───────────────────────────────────────────────────────

/**
 * Creates a new CometChat user using the provided auth key.
 */
export function createUser(user: CometChat.User, authKey: string): Promise<CometChat.User> {
  return new Promise((resolve, reject) => {
    CometChat.createUser(user, authKey)
      .then((created: CometChat.User) => resolve(created))
      .catch((error: CometChat.CometChatException) => reject(error));
  });
}

/**
 * Updates an existing CometChat user using the provided auth key.
 */
export function updateUser(user: CometChat.User, authKey: string): Promise<CometChat.User> {
  return new Promise((resolve, reject) => {
    CometChat.updateUser(user, authKey)
      .then((updated: CometChat.User) => resolve(updated))
      .catch((error: CometChat.CometChatException) => reject(error));
  });
}
