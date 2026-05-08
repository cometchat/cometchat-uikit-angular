/**
 * Types and interfaces for CometChatGroups component.
 *
 * Re-exports shared types used by the component for convenience,
 * and defines component-specific types.
 */

// Re-export shared types used by CometChatGroups
export { SelectionMode, States } from '../../Enums/Enums';
export { CometChatOption } from '../../modals/CometChatOption';
export type { SelectionState } from '../../modals/SelectionState';
export type { GlobalConfig } from '../../services/global-config.service';

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ChangeDetectorRef, TemplateRef } from '@angular/core';
import { SelectionMode } from '../../Enums/Enums';
import { States } from '../../Enums/Enums';
import { CometChatOption } from '../../modals/CometChatOption';

/**
 * Minimal interface describing the state the groups component exposes
 * to its keyboard and selection helpers.
 */
export interface GroupsComponentState {
  groupList: CometChat.Group[];
  fetchState: States;
  selectionMode: SelectionMode;
  focusedIndex: number;
  selectedGroups: Set<string>;
  searchText: string;
  cdr: ChangeDetectorRef;
}

/**
 * Context object for group item templates.
 */
export interface GroupItemContext {
  $implicit: CometChat.Group;
}

/**
 * Payload emitted by the `select` output.
 */
export interface GroupSelectPayload {
  group: CometChat.Group;
  selected: boolean;
}
