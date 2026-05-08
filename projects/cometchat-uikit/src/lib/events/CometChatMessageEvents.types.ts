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
