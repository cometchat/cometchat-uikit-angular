/**
 * Selection helpers for CometChatGroups component.
 *
 * Pure functions that encapsulate selection logic, operating on state
 * passed as parameters so the component class stays lean.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { EventEmitter } from '@angular/core';
import { SelectionMode } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';
import { GroupSelectPayload } from './cometchat-groups.types';

/**
 * Emits a SelectionState event reflecting the current selection.
 *
 * @param selectionMode - Current selection mode
 * @param selectedGroups - Set of currently selected group GUIDs
 * @param lastSelectedId - GUID of the last selected/deselected group, or null
 * @param selectionChange - EventEmitter to emit on
 */
export function emitGroupSelectionChange(
  selectionMode: SelectionMode,
  selectedGroups: Set<string>,
  lastSelectedId: string | null,
  selectionChange: EventEmitter<SelectionState>
): void {
  selectionChange.emit({
    mode: selectionMode,
    selectedIds: new Set(selectedGroups),
    lastSelectedId,
  });
}

/**
 * Performs shift-click range selection/deselection.
 *
 * The action (select vs deselect) is determined by the clicked item's current state:
 * - If clicked item is already selected → deselect all in range
 * - If clicked item is not selected → select all in range
 *
 * @param groupList - Full list of groups
 * @param startIndex - Anchor index (previous selection)
 * @param endIndex - Currently clicked index
 * @param selectedGroups - Mutable set of selected GUIDs (modified in place)
 * @param selectEmitter - EventEmitter for individual select events
 * @param selectionChange - EventEmitter for bulk selection-change events
 * @param selectionMode - Current selection mode
 * @returns The new lastSelectedIndex value (endIndex)
 */
export function selectGroupRange(
  groupList: CometChat.Group[],
  startIndex: number,
  endIndex: number,
  selectedGroups: Set<string>,
  selectEmitter: EventEmitter<GroupSelectPayload>,
  selectionChange: EventEmitter<SelectionState>,
  selectionMode: SelectionMode
): number {
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);

  const clickedGroup = groupList[endIndex];
  const clickedId = clickedGroup.getGuid();
  const shouldDeselect = selectedGroups.has(clickedId);

  for (let i = minIndex; i <= maxIndex; i++) {
    const group = groupList[i];
    const id = group.getGuid();

    if (shouldDeselect) {
      if (selectedGroups.has(id)) {
        selectedGroups.delete(id);
        selectEmitter.emit({ group, selected: false });
      }
    } else {
      if (!selectedGroups.has(id)) {
        selectedGroups.add(id);
        selectEmitter.emit({ group, selected: true });
      }
    }
  }

  emitGroupSelectionChange(selectionMode, selectedGroups, clickedId, selectionChange);
  return endIndex;
}

/**
 * Selects all groups in the list (multiple mode only).
 * Emits individual select events for newly selected groups, then a single selectionChange.
 *
 * @param groupList - Full list of groups
 * @param selectedGroups - Mutable set of selected GUIDs (modified in place)
 * @param selectEmitter - EventEmitter for individual select events
 * @param selectionChange - EventEmitter for bulk selection-change events
 * @param selectionMode - Current selection mode
 */
export function selectAllGroups(
  groupList: CometChat.Group[],
  selectedGroups: Set<string>,
  selectEmitter: EventEmitter<GroupSelectPayload>,
  selectionChange: EventEmitter<SelectionState>,
  selectionMode: SelectionMode
): void {
  if (selectionMode !== SelectionMode.multiple) return;

  groupList.forEach(group => {
    const guid = group.getGuid();
    if (!selectedGroups.has(guid)) {
      selectedGroups.add(guid);
      selectEmitter.emit({ group, selected: true });
    }
  });

  emitGroupSelectionChange(selectionMode, selectedGroups, null, selectionChange);
}

/**
 * Clears all selections.
 * Emits individual select events for previously selected groups, then a single selectionChange.
 *
 * @param groupList - Full list of groups
 * @param selectedGroups - Mutable set of selected GUIDs (modified in place)
 * @param selectEmitter - EventEmitter for individual select events
 * @param selectionChange - EventEmitter for bulk selection-change events
 * @param selectionMode - Current selection mode
 */
export function clearGroupSelection(
  groupList: CometChat.Group[],
  selectedGroups: Set<string>,
  selectEmitter: EventEmitter<GroupSelectPayload>,
  selectionChange: EventEmitter<SelectionState>,
  selectionMode: SelectionMode
): void {
  groupList.forEach(group => {
    const guid = group.getGuid();
    if (selectedGroups.has(guid)) {
      selectEmitter.emit({ group, selected: false });
    }
  });

  selectedGroups.clear();
  emitGroupSelectionChange(selectionMode, selectedGroups, null, selectionChange);
}
