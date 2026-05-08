/**
 * Types and interfaces for CometChatGroupMembers component.
 *
 * Re-exports shared types used by the component for convenience,
 * and defines component-specific types.
 */

// Re-export shared types used by CometChatGroupMembers
export { SelectionMode, States } from '../../Enums/Enums';
export { CometChatOption } from '../../modals/CometChatOption';
export type { SelectionState } from '../../modals/SelectionState';
export type { GlobalConfig } from '../../services/global-config.service';

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { SelectionMode } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';
import { EventEmitter } from '@angular/core';
import { CometChatOption } from '../../modals/CometChatOption';

/**
 * Payload emitted by the `select` output.
 */
export interface MemberSelectPayload {
  member: CometChat.GroupMember;
  selected: boolean;
}

/**
 * Context object for group member item templates.
 */
export interface GroupMemberItemContext {
  $implicit: CometChat.GroupMember;
}
