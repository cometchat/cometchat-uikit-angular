/**
 * Keyboard navigation helpers for CometChatGroups component.
 *
 * Extracted from cometchat-groups.component.ts to isolate
 * keyboard navigation and focus management logic.
 */

import { ChangeDetectorRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Moves focus to the next group item, wrapping at the end.
 * Returns the new focusedIndex.
 */
export function focusNextGroupItem(
  groupList: CometChat.Group[],
  focusedIndex: number,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): number {
  if (groupList.length === 0) return focusedIndex;
  let newIndex: number;
  if (focusedIndex === -1) {
    newIndex = 0;
  } else if (focusedIndex < groupList.length - 1) {
    newIndex = focusedIndex + 1;
  } else {
    newIndex = 0;
  }
  cdr.markForCheck();
  scrollFocusedItemIntoView();
  return newIndex;
}

/**
 * Moves focus to the previous group item, wrapping at the start.
 * Returns the new focusedIndex.
 */
export function focusPreviousGroupItem(
  groupList: CometChat.Group[],
  focusedIndex: number,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): number {
  if (groupList.length === 0) return focusedIndex;
  let newIndex: number;
  if (focusedIndex === -1) {
    newIndex = groupList.length - 1;
  } else if (focusedIndex > 0) {
    newIndex = focusedIndex - 1;
  } else {
    newIndex = groupList.length - 1;
  }
  cdr.markForCheck();
  scrollFocusedItemIntoView();
  return newIndex;
}

/**
 * Scrolls the focused group item into view.
 */
export function scrollGroupItemIntoView(
  listContainer: HTMLElement | undefined,
  focusedIndex: number,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  pendingTimers.push(
    setTimeout(() => {
      if (!listContainer) return;
      const el = listContainer.querySelector(`[data-index="${focusedIndex}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, 0)
  );
}

/**
 * Focuses the DOM element for the group item at the given index.
 */
export function focusGroupItemAtIndex(
  listContainer: HTMLElement | undefined,
  index: number,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  pendingTimers.push(
    setTimeout(() => {
      if (!listContainer) return;
      const el = listContainer.querySelector(`[data-index="${index}"] cometchat-group-item`);
      if (el) {
        const focusable = el.querySelector('[tabindex="0"]') as HTMLElement;
        if (focusable) focusable.focus();
      }
    }, 0)
  );
}
