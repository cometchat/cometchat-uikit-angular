/**
 * Utility helpers for CometChatGroupMembers component.
 *
 * Pure functions that operate on component state passed as parameters,
 * keeping the component class lean while centralising reusable logic.
 */

import { ChangeDetectorRef, WritableSignal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { SelectionMode } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';
import { EventEmitter } from '@angular/core';

/**
 * Emits a SelectionState event reflecting the current member selection.
 */
export function emitMemberSelectionChange(
  selectionMode: SelectionMode,
  selectedMembers: Set<string>,
  lastSelectedId: string | null,
  selectionChange: EventEmitter<SelectionState>
): void {
  selectionChange.emit({
    mode: selectionMode,
    selectedIds: new Set(selectedMembers),
    lastSelectedId,
  });
}

/**
 * Performs shift-click range selection/deselection for group members.
 *
 * @param memberList - Full list of members
 * @param startIndex - Anchor index
 * @param endIndex - Currently clicked index
 * @param selectedMembers - Mutable set of selected UIDs (modified in place)
 * @param selectionChange - EventEmitter for bulk selection-change events
 * @param selectionMode - Current selection mode
 * @returns The new lastSelectedIndex value (endIndex)
 */
export function selectMemberRange(
  memberList: CometChat.GroupMember[],
  startIndex: number,
  endIndex: number,
  selectedMembers: Set<string>,
  selectionChange: EventEmitter<SelectionState>,
  selectionMode: SelectionMode
): number {
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);

  const clickedMember = memberList[endIndex];
  const clickedId = clickedMember.getUid();
  const shouldDeselect = selectedMembers.has(clickedId);

  for (let i = minIndex; i <= maxIndex; i++) {
    const uid = memberList[i].getUid();
    if (shouldDeselect) {
      selectedMembers.delete(uid);
    } else {
      selectedMembers.add(uid);
    }
  }

  emitMemberSelectionChange(selectionMode, selectedMembers, clickedId, selectionChange);
  return endIndex;
}

/**
 * Moves focus to the next member item, wrapping at the end.
 *
 * @param memberCount - Total number of members
 * @param focusedIndex - WritableSignal for the focused index
 * @param cdr - ChangeDetectorRef
 * @param scrollFocusedItemIntoView - Callback to scroll into view
 */
export function focusNextMemberItem(
  memberCount: number,
  focusedIndex: WritableSignal<number>,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): void {
  if (memberCount === 0) return;
  const current = focusedIndex();
  focusedIndex.set(current === -1 || current >= memberCount - 1 ? 0 : current + 1);
  cdr.markForCheck();
  scrollFocusedItemIntoView();
}

/**
 * Moves focus to the previous member item, wrapping at the start.
 *
 * @param memberCount - Total number of members
 * @param focusedIndex - WritableSignal for the focused index
 * @param cdr - ChangeDetectorRef
 * @param scrollFocusedItemIntoView - Callback to scroll into view
 */
export function focusPreviousMemberItem(
  memberCount: number,
  focusedIndex: WritableSignal<number>,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): void {
  if (memberCount === 0) return;
  const current = focusedIndex();
  focusedIndex.set(current <= 0 ? memberCount - 1 : current - 1);
  cdr.markForCheck();
  scrollFocusedItemIntoView();
}

/**
 * Scrolls the focused member item into view.
 *
 * @param listContainer - The native list container element
 * @param focusedIndex - Current focused index
 * @param pendingTimers - Array to push the timer reference into for cleanup
 */
export function scrollMemberItemIntoView(
  listContainer: HTMLElement | undefined,
  focusedIndex: number,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  pendingTimers.push(
    setTimeout(() => {
      if (!listContainer) return;
      const focusedElement = listContainer.querySelector(`[data-index="${focusedIndex}"]`);
      if (focusedElement) {
        focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }, 0)
  );
}
