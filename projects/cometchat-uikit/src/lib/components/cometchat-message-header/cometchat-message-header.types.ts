/**
 * Types and interfaces for CometChatMessageHeader component.
 */

export type { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
export type { GlobalConfig } from '../../services/global-config.service';
export { CometChatOption } from '../../modals';

import { CometChat } from '@cometchat/chat-sdk-javascript';

/** Template context for user/group templates. */
export interface MessageHeaderTemplateContext {
  user?: CometChat.User;
  group?: CometChat.Group;
}

/** Typing indicator state. */
export interface TypingState {
  isTyping: boolean;
  typingUsers: CometChat.User[];
}
