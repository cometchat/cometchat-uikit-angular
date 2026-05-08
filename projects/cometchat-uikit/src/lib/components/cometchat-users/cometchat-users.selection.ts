/**
 * Selection helpers for CometChatUsers component.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { EventEmitter } from '@angular/core';
import { SelectionMode } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';
import { UserSelectPayload } from './cometchat-users.types';

/**
 * Emits a SelectionState event reflecting the current user selection.
 */
export function emitUserSelectionChange(
  selectionMode: SelectionMode,
  selectedUsers: Set<string>,
  lastSelectedId: string | null,
  selectionChange: EventEmitter<SelectionState>
): void {
  selectionChange.emit({
    mode: selectionMode,
    selectedIds: new Set(selectedUsers),
    lastSelectedId,
  });
}

/**
 * Performs shift-click range selection/deselection for users.
 * Returns the new lastSelectedIndex value (endIndex).
 */
export function selectUserRange(
  userList: CometChat.User[],
  startIndex: number,
  endIndex: number,
  selectedUsers: Set<string>,
  selectEmitter: EventEmitter<UserSelectPayload>,
  selectionChange: EventEmitter<SelectionState>,
  selectionMode: SelectionMode
): number {
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);
  const clickedUser = userList[endIndex];
  const clickedId = clickedUser.getUid();
  const shouldDeselect = selectedUsers.has(clickedId);

  for (let i = minIndex; i <= maxIndex; i++) {
    const user = userList[i];
    const uid = user.getUid();
    if (shouldDeselect) {
      if (selectedUsers.has(uid)) { selectedUsers.delete(uid); selectEmitter.emit({ user, selected: false }); }
    } else {
      if (!selectedUsers.has(uid)) { selectedUsers.add(uid); selectEmitter.emit({ user, selected: true }); }
    }
  }

  emitUserSelectionChange(selectionMode, selectedUsers, clickedId, selectionChange);
  return endIndex;
}

/**
 * Selects all users in the list (multiple mode only).
 */
export function selectAllUsers(
  userList: CometChat.User[],
  selectedUsers: Set<string>,
  selectEmitter: EventEmitter<UserSelectPayload>,
  selectionChange: EventEmitter<SelectionState>,
  selectionMode: SelectionMode
): void {
  if (selectionMode !== SelectionMode.multiple) return;
  userList.forEach(user => {
    const uid = user.getUid();
    if (!selectedUsers.has(uid)) { selectedUsers.add(uid); selectEmitter.emit({ user, selected: true }); }
  });
  emitUserSelectionChange(selectionMode, selectedUsers, null, selectionChange);
}

/**
 * Clears all user selections.
 */
export function clearUserSelection(
  userList: CometChat.User[],
  selectedUsers: Set<string>,
  selectEmitter: EventEmitter<UserSelectPayload>,
  selectionChange: EventEmitter<SelectionState>,
  selectionMode: SelectionMode
): void {
  userList.forEach(user => {
    if (selectedUsers.has(user.getUid())) selectEmitter.emit({ user, selected: false });
  });
  selectedUsers.clear();
  emitUserSelectionChange(selectionMode, selectedUsers, null, selectionChange);
}
