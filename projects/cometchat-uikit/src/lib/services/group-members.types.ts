import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Error callback type for propagating errors to the component.
 */
export type GroupMembersErrorCallback = (error: CometChat.CometChatException) => void;
