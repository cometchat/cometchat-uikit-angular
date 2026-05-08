/**
 * Types for CometChatIncomingCall component.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

/** Template context passed to all template overrides. */
export interface IncomingCallTemplateContext {
  call: CometChat.Call;
  callerName: string;
  callerAvatar: string;
  callType: string;
}
