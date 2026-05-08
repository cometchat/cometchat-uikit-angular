/**
 * Utility helpers for CometChatPaginatedList component.
 * Extracted to keep the component file under 400 lines.
 */

import { ElementRef, QueryList } from '@angular/core';

/**
 * Checks if the user is currently focused on a search input or text input.
 * Used to prevent focus stealing from the search bar when results are fetched.
 */
export function isUserInSearchInput(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  const tagName = activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') return true;
  if (activeElement.getAttribute('contenteditable') === 'true') return true;
  return false;
}

/**
 * Focuses a list item element by index, optionally scrolling it into view.
 *
 * @param index - The index of the item to focus
 * @param listItemElements - QueryList of list item ElementRefs
 * @param scrollIntoView - Whether to scroll the item into view
 * @param initialFocusSet - Whether initial focus has already been set (controls scroll behavior)
 */
export function focusListItem(
  index: number,
  listItemElements: QueryList<ElementRef<HTMLElement>> | undefined,
  scrollIntoView: boolean,
  initialFocusSet: boolean
): void {
  const itemElements = listItemElements?.toArray();
  if (!itemElements || !itemElements[index]) return;
  const element = itemElements[index].nativeElement;
  if (scrollIntoView && initialFocusSet) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  element.focus({ preventScroll: true });
}

/**
 * Focuses a state container element (empty state or error state).
 *
 * @param container - The ElementRef of the container to focus
 */
export function focusStateContainer(container: ElementRef<HTMLElement> | undefined): void {
  if (container?.nativeElement) {
    container.nativeElement.focus({ preventScroll: true });
  }
}
