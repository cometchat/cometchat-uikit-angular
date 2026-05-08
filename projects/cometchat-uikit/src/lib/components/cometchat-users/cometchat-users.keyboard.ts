/**
 * Keyboard navigation helpers for CometChatUsers component.
 */

import { ChangeDetectorRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Moves focus to the next user item, wrapping at the end.
 * Returns the new focusedIndex.
 */
export function focusNextUserItem(
  userList: CometChat.User[],
  focusedIndex: number,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): number {
  if (userList.length === 0) return focusedIndex;
  let newIndex: number;
  if (focusedIndex === -1) { newIndex = 0; }
  else if (focusedIndex < userList.length - 1) { newIndex = focusedIndex + 1; }
  else { newIndex = 0; }
  cdr.markForCheck();
  scrollFocusedItemIntoView();
  return newIndex;
}

/**
 * Moves focus to the previous user item, wrapping at the start.
 * Returns the new focusedIndex.
 */
export function focusPreviousUserItem(
  userList: CometChat.User[],
  focusedIndex: number,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): number {
  if (userList.length === 0) return focusedIndex;
  let newIndex: number;
  if (focusedIndex === -1) { newIndex = userList.length - 1; }
  else if (focusedIndex > 0) { newIndex = focusedIndex - 1; }
  else { newIndex = userList.length - 1; }
  cdr.markForCheck();
  scrollFocusedItemIntoView();
  return newIndex;
}

/**
 * Scrolls the focused user item into view.
 */
export function scrollUserItemIntoView(
  listContainer: HTMLElement | undefined,
  focusedIndex: number,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  pendingTimers.push(setTimeout(() => {
    if (!listContainer) return;
    const el = listContainer.querySelector(`[data-index="${focusedIndex}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, 0));
}

/**
 * Focuses the DOM element for the user item at the given index.
 */
export function focusUserItemAtIndex(
  listContainer: HTMLElement | undefined,
  index: number,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  pendingTimers.push(setTimeout(() => {
    if (!listContainer) return;
    const el = listContainer.querySelector(`[data-index="${index}"] cometchat-user-item`);
    if (el) {
      const focusable = el.querySelector('[tabindex="0"]') as HTMLElement;
      if (focusable) focusable.focus();
    }
  }, 0));
}
