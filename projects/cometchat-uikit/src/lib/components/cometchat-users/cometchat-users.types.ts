/**
 * Types and interfaces for CometChatUsers component.
 */

export { SelectionMode, States } from '../../Enums/Enums';
export { CometChatOption } from '../../modals/CometChatOption';
export type { SelectionState } from '../../modals/SelectionState';
export type { GlobalConfig } from '../../services/global-config.service';

import { CometChat } from '@cometchat/chat-sdk-javascript';

/** Payload emitted by the `select` output. */
export interface UserSelectPayload {
  user: CometChat.User;
  selected: boolean;
}

/** Context object for user item templates. */
export interface UserItemContext {
  $implicit: CometChat.User;
}
