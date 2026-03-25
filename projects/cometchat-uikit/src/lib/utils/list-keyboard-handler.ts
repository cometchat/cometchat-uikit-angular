/**
 * Shared List Keyboard Handler Utilities
 *
 * Extracted from cometchat-groups and cometchat-users components to consolidate
 * duplicate keyboard selection and navigation logic (~98 + 56 shared lines).
 *
 * These utilities handle:
 * - Ctrl/Cmd+A select all, Ctrl/Cmd+Shift+A deselect all
 * - Type-ahead search delegation
 * - Arrow key navigation
 * - Enter/Space activation
 * - Escape to clear selection
 * - Shift+Space range selection
 * - Shift+Arrow extend selection
 */

import { ChangeDetectorRef } from '@angular/core';
import { SelectionMode, States } from '../Enums/Enums';

/**
 * Interface that a list component must implement to use the shared keyboard handler.
 * Each component provides its own list data, focus management, and selection logic.
 */
export interface ListKeyboardHost<T> {
  /** The current list of items */
  readonly itemList: T[];
  /** Current fetch state — only handle keys when States.loaded */
  readonly fetchState: States;
  /** Current selection mode */
  readonly selectionMode: SelectionMode;
  /** Current focused index (mutable) */
  focusedIndex: number;
  /** CSS class of the component root (e.g. 'cometchat-groups') */
  readonly componentClass: string;
  /** CSS class of the search bar (e.g. 'cometchat-groups__search-bar') */
  readonly searchBarClass: string;
  /** Size of the selected items set */
  readonly selectedCount: number;

  /** Change detector for marking dirty */
  readonly cdr: ChangeDetectorRef;

  // Selection actions
  clearSelection(): void;
  selectAll(): void;
  handleSelectionChange(item: T): void;
  selectRangeFromAnchor(index: number): void;
  extendSelectionTo(index: number): void;

  // Navigation actions
  focusNextItem(): void;
  focusPreviousItem(): void;
  selectFocusedItem(): void;
  scrollFocusedItemIntoView(): void;
  focusItemAtIndex(index: number): void;
  handleEscapeKey(): void;

  // Announcements
  announceSelectionCount(): void;
  announceSelectionCleared(): void;

  // Type-ahead
  handleTypeAhead(key: string, focusedIndex: number): number;
}

/**
 * Handles the main keydown event for a list component.
 * Returns true if the event was handled and should not propagate further.
 */
export function handleListKeyDown<T>(event: KeyboardEvent, host: ListKeyboardHost<T>): boolean {
  // Skip if list is empty or not loaded
  if (host.itemList.length === 0 || host.fetchState !== States.loaded) {
    return false;
  }

  // Only handle keyboard events if the event target is within the component
  const target = event.target as HTMLElement;
  const isWithinComponent = target.closest(`.${host.componentClass}`) !== null;
  if (!isWithinComponent) {
    return false;
  }

  // Don't handle keyboard events when focus is in the search bar
  const isInSearchBar =
    target.closest(`.${host.searchBarClass}`) !== null || target.tagName === 'INPUT';

  // Handle Ctrl/Cmd+Shift+A for deselect all (check BEFORE Ctrl/Cmd+A)
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
    if (host.selectionMode === SelectionMode.multiple) {
      event.preventDefault();
      host.clearSelection();
      host.announceSelectionCleared();
      return true;
    }
  }

  // Handle Ctrl/Cmd+A for select all
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'a') {
    if (host.selectionMode === SelectionMode.multiple) {
      event.preventDefault();
      host.selectAll();
      host.announceSelectionCount();
      return true;
    }
  }

  // Handle selection mode keyboard shortcuts
  if (host.selectionMode !== SelectionMode.none) {
    const handled = handleSelectionKeyboard(event, isInSearchBar, host);
    if (handled) return true;
  }

  // Handle type-ahead search for printable characters
  if (
    !isInSearchBar &&
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    const newIndex = host.handleTypeAhead(event.key, host.focusedIndex);

    if (newIndex !== -1) {
      host.focusedIndex = newIndex;
      host.cdr.markForCheck();
      host.scrollFocusedItemIntoView();
      host.focusItemAtIndex(newIndex);
    }
    return true;
  }

  switch (event.key) {
    case 'ArrowDown':
      if (!isInSearchBar) {
        event.preventDefault();
        event.stopPropagation();
        host.focusNextItem();
      }
      return !isInSearchBar;

    case 'ArrowUp':
      if (!isInSearchBar) {
        event.preventDefault();
        event.stopPropagation();
        host.focusPreviousItem();
      }
      return !isInSearchBar;

    case 'Enter':
      if (!isInSearchBar) {
        event.preventDefault();
        host.selectFocusedItem();
      }
      return !isInSearchBar;

    case ' ':
      if (!isInSearchBar && host.selectionMode === SelectionMode.none) {
        event.preventDefault();
        host.selectFocusedItem();
        return true;
      }
      return false;

    case 'Escape':
      event.preventDefault();
      if (host.selectionMode !== SelectionMode.none && host.selectedCount > 0) {
        host.clearSelection();
        host.announceSelectionCleared();
      } else {
        host.handleEscapeKey();
      }
      return true;
  }

  return false;
}

/**
 * Handles selection-related keyboard shortcuts (Space toggle, Shift+Space range, Shift+Arrow extend).
 * Returns true if the event was handled.
 */
export function handleSelectionKeyboard<T>(
  event: KeyboardEvent,
  isInSearchBar: boolean,
  host: ListKeyboardHost<T>
): boolean {
  if (isInSearchBar) return false;

  const focusedIndex = host.focusedIndex;
  const items = host.itemList;

  // Space toggles selection in selection mode
  if (event.key === ' ' && !event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      host.handleSelectionChange(items[focusedIndex]);
      host.announceSelectionCount();
    }
    return true;
  }

  // Shift+Space for range selection
  if (event.key === ' ' && event.shiftKey && host.selectionMode === SelectionMode.multiple) {
    event.preventDefault();
    event.stopPropagation();
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      host.selectRangeFromAnchor(focusedIndex);
      host.announceSelectionCount();
    }
    return true;
  }

  // Shift+ArrowDown extends selection to next item
  if (
    event.key === 'ArrowDown' &&
    event.shiftKey &&
    host.selectionMode === SelectionMode.multiple
  ) {
    event.preventDefault();
    event.stopPropagation();
    const nextIndex = focusedIndex + 1;
    if (nextIndex < items.length) {
      host.extendSelectionTo(nextIndex);
      host.focusedIndex = nextIndex;
      host.cdr.markForCheck();
      host.scrollFocusedItemIntoView();
      host.focusItemAtIndex(nextIndex);
      host.announceSelectionCount();
    }
    return true;
  }

  // Shift+ArrowUp extends selection to previous item
  if (event.key === 'ArrowUp' && event.shiftKey && host.selectionMode === SelectionMode.multiple) {
    event.preventDefault();
    event.stopPropagation();
    const prevIndex = focusedIndex - 1;
    if (prevIndex >= 0) {
      host.extendSelectionTo(prevIndex);
      host.focusedIndex = prevIndex;
      host.cdr.markForCheck();
      host.scrollFocusedItemIntoView();
      host.focusItemAtIndex(prevIndex);
      host.announceSelectionCount();
    }
    return true;
  }

  return false;
}
