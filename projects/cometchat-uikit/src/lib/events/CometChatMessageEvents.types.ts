/**
 * Types for CometChatMessageEvents.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageStatus } from '../Enums/Enums';

/**
 * Interface for message-related events
 */
export interface IMessages {
  message: CometChat.BaseMessage;
  status: MessageStatus;
  /**
   * Optional parent message ID to scope edit events to a specific thread context.
   * When set: event originated from a thread composer/list.
   * When absent/null/0: event originated from the main conversation composer/list.
   */
  parentMessageId?: number | null;
}

/** An own message's send state on the offline path. */
export type MessageSendState = 'sending' | 'sent' | 'failed' | 'discarded';

/** Payload of `CometChatMessageEvents.ccMessageSendStateChanged` (offline support only). */
export interface IMessageSendStateChanged {
  message: CometChat.BaseMessage;
  state: MessageSendState;
  /** The SDK's `MessageFailureReason` for `failed` and `discarded`. */
  reason?: string;
}

/** Payload of `CometChatMessageEvents.ccOfflineCacheReset` (offline support only). */
export interface IOfflineCacheReset {
  /** The SDK's `OfflineCacheResetReason`. */
  reason: string;
  /** Unsent messages the reset lost; `null` when unknown. */
  pendingMessagesLost: number | null;
}
