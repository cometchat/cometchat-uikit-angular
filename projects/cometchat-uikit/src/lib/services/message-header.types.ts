/**
 * Types and interfaces for MessageHeaderService
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Error callback type for service error handling
 * Used to propagate errors from service to component
 */
export type ErrorCallback = (error: CometChat.CometChatException) => void;
