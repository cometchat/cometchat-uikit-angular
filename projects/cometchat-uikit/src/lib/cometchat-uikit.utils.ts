/**
 * Static helper utilities for CometChatUIKit.
 * Contains message sending helpers and user management helpers
 * extracted to keep cometchat-uikit.ts under 400 lines.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents } from './events/CometChatMessageEvents';
import { MessageStatus } from './Enums/Enums';
import { CometChatUIKitUtility } from './CometChatUIKitUtility';
import { isOfflineOn } from './utils/offline/offline-gate';
import { OfflineSendKind, sendWithStatePromise } from './utils/offline/send';

/**
 * Offline (ON) path of the `send*` statics: announce `inprogress` once, then
 * let the offline send helper report the rest. Resolves when the message is
 * sent, rejects on a final failure or a direct error, never because it was
 * queued.
 */
function sendOffline(message: CometChat.BaseMessage, kind: OfflineSendKind): Promise<CometChat.BaseMessage> {
  CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.inprogress });
  return sendWithStatePromise(message, kind).catch((error: CometChat.CometChatException) => {
    // Parity with the offline-off path, which stamps the error on the message
    // before it rejects. App code reads `metadata.error` to tell WHY a send
    // failed, and the offline path went straight to the send helper, so with
    // offline on that metadata was never written.
    stampSendError(message, error);
    throw error;
  });
}

/** What stamping an error needs of a message: metadata it can read and write. */
interface MetadataCarrier {
  getMetadata?: () => unknown;
  setMetadata?: (metadata: object) => void;
}

/**
 * Mark a message that failed to send without discarding metadata the
 * integrator set on it: the error is merged in as `metadata.error`.
 *
 * `BaseMessage` does not declare the metadata accessors (its concrete message
 * types do), so the carrier is read off it at runtime and a message type that
 * cannot carry metadata is left alone.
 */
function stampSendError(
  message: CometChat.BaseMessage,
  error: CometChat.CometChatException
): void {
  const carrier = message as unknown as MetadataCarrier | undefined;
  if (typeof carrier?.setMetadata !== 'function') return;
  const existing = carrier.getMetadata?.();
  const base = existing && typeof existing === 'object' ? existing : {};
  carrier.setMetadata({ ...(base as Record<string, unknown>), error });
}

// ── Message Sending ───────────────────────────────────────────────────────

/**
 * Sends a text message and emits inprogress/success/error events.
 */
export function sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> {
  if (isOfflineOn()) {
    message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    if (!message?.getMuid()) { message.setMuid(CometChatUIKitUtility.ID()); }
    return sendOffline(message, 'text');
  }
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
        stampSendError(message, error);
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
  if (isOfflineOn()) { return sendOffline(message, 'media'); }
  return new Promise((resolve, reject) => {
    CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.inprogress });
    CometChat.sendMediaMessage(message)
      .then((sent: CometChat.BaseMessage) => {
        CometChatMessageEvents.ccMessageSent.next({ message: sent, status: MessageStatus.success });
        return resolve(sent);
      })
      .catch((error: CometChat.CometChatException) => {
        stampSendError(message, error);
        CometChatMessageEvents.ccMessageSent.next({ message, status: MessageStatus.error });
        return reject(error);
      });
  });
}

/**
 * Sends a custom message and emits inprogress/success/error events.
 */
export function sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> {
  if (isOfflineOn()) {
    message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    if (!message?.getMuid()) { message.setMuid(CometChatUIKitUtility.ID()); }
    return sendOffline(message, 'custom');
  }
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
        stampSendError(message, error);
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
