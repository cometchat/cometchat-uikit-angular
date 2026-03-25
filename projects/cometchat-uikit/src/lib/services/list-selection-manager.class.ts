/**
 * ListSelectionManager Class
 *
 * Manages list item selection with keyboard support for accessibility.
 * Provides methods for single/multiple selection, range selection, and selection state management.
 *
 * @module services/list-selection-manager
 * @see Requirements 3.3-3.7, 5.3, 7.3, 9.3, 13.1-13.7
 */

import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { SelectionMode } from '../Enums/Enums';

/**
 * Represents the current state of list selection.
 * Used for event emission and state queries.
 *
 * @see Requirements 13.5
 */
export interface ListSelectionState {
  /** Current selection mode (single, multiple, none) */
  mode: SelectionMode;
  /** Set of selected item IDs */
  selectedIds: Set<string>;
  /** ID of the last selected item, or null if none */
  lastSelectedId: string | null;
  /** Index used as anchor for shift-select range operations */
  anchorIndex: number;
}

/**
 * ListSelectionManager handles all selection-related operations for list components.
 *
 * This class is responsible for:
 * - Managing single and multiple selection modes
 * - Handling keyboard-based selection (Space, Shift+Arrow, Shift+Space, Ctrl+A, Escape)
 * - Tracking selection state with Angular signals for reactive updates
 * - Supporting range selection with anchor index tracking
 *
 * @example
 * ```typescript
 * // Create a selection manager for users
 * const manager = new ListSelectionManager<User>(
 *   SelectionMode.multiple,
 *   (user) => user.getUid()
 * );
 *
 * // Toggle selection on Space key
 * const isNowSelected = manager.toggleSelection(user, index);
 *
 * // Extend selection on Shift+Arrow
 * manager.extendSelection(nextUser, nextIndex);
 *
 * // Select range on Shift+Space
 * manager.selectRange(allUsers, currentIndex);
 *
 * // Select all on Ctrl+A
 * manager.selectAll(allUsers);
 *
 * // Clear selection on Escape
 * manager.clearSelection();
 *
 * // Check selection state
 * const count = manager.selectedCount();
 * const hasAny = manager.hasSelection();
 * const isSelected = manager.isSelected(user);
 * ```
 *
 * @typeParam T - The type of items being selected
 * @see Requirements 3.3-3.7, 5.3, 7.3, 9.3, 13.1-13.7
 */
export class ListSelectionManager<T> {
  /** Internal signal tracking selected item IDs */
  private _selectedIds: WritableSignal<Set<string>> = signal(new Set<string>());

  /** Internal signal tracking the last selected item index */
  private _lastSelectedIndex: WritableSignal<number> = signal(-1);

  /** Internal signal tracking the anchor index for range selection */
  private _anchorIndex: WritableSignal<number> = signal(-1);

  /** Internal signal tracking the last selected item ID */
  private _lastSelectedId: WritableSignal<string | null> = signal(null);

  /**
   * Computed signal returning the count of selected items.
   * @see Requirements 13.6
   */
  readonly selectedCount: Signal<number> = computed(() => this._selectedIds().size);

  /**
   * Computed signal returning whether any items are selected.
   */
  readonly hasSelection: Signal<boolean> = computed(() => this._selectedIds().size > 0);

  /**
   * Read-only signal exposing the selected IDs set.
   */
  readonly selectedIds: Signal<Set<string>> = computed(() => new Set(this._selectedIds()));

  /**
   * Create a new ListSelectionManager instance.
   *
   * @param mode - The selection mode (single, multiple, or none)
   * @param getId - Function to extract a unique ID from an item
   */
  constructor(
    private mode: SelectionMode,
    private getId: (item: T) => string
  ) {}

  // ==================== Selection Operations ====================

  /**
   * Toggles selection for an item (Space key behavior).
   *
   * In single mode: clears other selections and toggles the current item.
   * In multiple mode: toggles the current item without affecting others.
   * In none mode: does nothing.
   *
   * @param item - The item to toggle selection for
   * @param index - The index of the item in the list
   * @returns True if the item is now selected, false if deselected
   * @see Requirements 3.3, 5.3, 7.3, 9.3, 13.1, 13.2, 13.3
   */
  toggleSelection(item: T, index: number): boolean {
    if (this.mode === SelectionMode.none) {
      return false;
    }

    const id = this.getId(item);
    const currentSelection = this._selectedIds();
    const wasSelected = currentSelection.has(id);

    if (this.mode === SelectionMode.single) {
      // Single mode: clear others, toggle this one
      // Requirement 13.1: Single selection mode allows only one item selected at a time
      const newSelection = new Set<string>();
      if (!wasSelected) {
        newSelection.add(id);
      }
      this._selectedIds.set(newSelection);
    } else if (this.mode === SelectionMode.multiple) {
      // Multiple mode: toggle this one
      // Requirement 13.2: Multiple selection mode allows multiple items selected
      // Requirement 13.3: Space on selected item deselects it
      const newSelection = new Set(currentSelection);
      if (wasSelected) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      this._selectedIds.set(newSelection);
    }

    // Update tracking indices
    this._lastSelectedIndex.set(index);
    this._anchorIndex.set(index);
    this._lastSelectedId.set(wasSelected ? null : id);

    return !wasSelected;
  }

  /**
   * Extends selection to include an item (Shift+Arrow behavior).
   *
   * Only works in multiple selection mode.
   * Adds the item to the current selection without clearing others.
   *
   * @param item - The item to add to selection
   * @param index - The index of the item in the list
   * @see Requirements 3.4, 3.5
   */
  extendSelection(item: T, index: number): void {
    // Requirement 3.4, 3.5: Shift+ArrowDown/Up extends selection
    if (this.mode !== SelectionMode.multiple) {
      return;
    }

    const id = this.getId(item);
    const newSelection = new Set(this._selectedIds());
    newSelection.add(id);
    this._selectedIds.set(newSelection);
    this._lastSelectedIndex.set(index);
    this._lastSelectedId.set(id);
  }

  /**
   * Selects all items between the anchor index and current index (Shift+Space behavior).
   *
   * Only works in multiple selection mode.
   * If no anchor is set, behaves like toggleSelection.
   *
   * @param items - The full list of items
   * @param currentIndex - The current focused index
   * @see Requirements 13.4
   */
  selectRange(items: T[], currentIndex: number): void {
    // Requirement 13.4: Shift+Space selects all items between last selected and current
    if (this.mode !== SelectionMode.multiple) {
      return;
    }

    const anchor = this._anchorIndex();
    if (anchor === -1) {
      // No anchor set, just toggle the current item
      if (currentIndex >= 0 && currentIndex < items.length) {
        this.toggleSelection(items[currentIndex], currentIndex);
      }
      return;
    }

    const start = Math.min(anchor, currentIndex);
    const end = Math.max(anchor, currentIndex);

    const newSelection = new Set(this._selectedIds());
    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < items.length) {
        newSelection.add(this.getId(items[i]));
      }
    }
    this._selectedIds.set(newSelection);
    this._lastSelectedIndex.set(currentIndex);

    if (currentIndex >= 0 && currentIndex < items.length) {
      this._lastSelectedId.set(this.getId(items[currentIndex]));
    }
  }

  /**
   * Selects all items in the list (Ctrl/Cmd+A behavior).
   *
   * Only works in multiple selection mode.
   *
   * @param items - The full list of items to select
   * @see Requirements 3.6
   */
  selectAll(items: T[]): void {
    // Requirement 3.6: Ctrl+A (or Cmd+A on Mac) selects all items
    if (this.mode !== SelectionMode.multiple) {
      return;
    }

    const newSelection = new Set<string>();
    items.forEach(item => newSelection.add(this.getId(item)));
    this._selectedIds.set(newSelection);
  }

  /**
   * Clears all selections (Escape behavior).
   *
   * Resets all selection state including anchor index.
   *
   * @see Requirements 3.7
   */
  clearSelection(): void {
    // Requirement 3.7: Escape clears all selections
    this._selectedIds.set(new Set());
    this._lastSelectedIndex.set(-1);
    this._anchorIndex.set(-1);
    this._lastSelectedId.set(null);
  }

  // ==================== Selection Queries ====================

  /**
   * Checks if an item is currently selected.
   *
   * @param item - The item to check
   * @returns True if the item is selected
   */
  isSelected(item: T): boolean {
    return this._selectedIds().has(this.getId(item));
  }

  /**
   * Checks if an item ID is currently selected.
   *
   * @param id - The item ID to check
   * @returns True if the item with this ID is selected
   */
  isSelectedById(id: string): boolean {
    return this._selectedIds().has(id);
  }

  /**
   * Gets the current selection state for event emission.
   *
   * @returns The current selection state
   * @see Requirements 13.5
   */
  getSelectionState(): ListSelectionState {
    return {
      mode: this.mode,
      selectedIds: new Set(this._selectedIds()),
      lastSelectedId: this._lastSelectedId(),
      anchorIndex: this._anchorIndex(),
    };
  }

  /**
   * Gets the array of selected item IDs.
   *
   * @returns Array of selected item IDs
   */
  getSelectedIdsArray(): string[] {
    return Array.from(this._selectedIds());
  }

  // ==================== State Management ====================

  /**
   * Sets the selection mode.
   *
   * When changing from multiple to single mode, clears selection if more than one item is selected.
   *
   * @param mode - The new selection mode
   */
  setMode(mode: SelectionMode): void {
    const previousMode = this.mode;
    this.mode = mode;

    // If switching from multiple to single and more than one item is selected, clear selection
    if (previousMode === SelectionMode.multiple && mode === SelectionMode.single) {
      if (this._selectedIds().size > 1) {
        this.clearSelection();
      }
    }

    // If switching to none mode, clear all selections
    if (mode === SelectionMode.none) {
      this.clearSelection();
    }
  }

  /**
   * Gets the current selection mode.
   *
   * @returns The current selection mode
   */
  getMode(): SelectionMode {
    return this.mode;
  }

  /**
   * Sets the anchor index for range selection.
   *
   * @param index - The anchor index
   */
  setAnchorIndex(index: number): void {
    this._anchorIndex.set(index);
  }

  /**
   * Gets the current anchor index.
   *
   * @returns The anchor index, or -1 if not set
   */
  getAnchorIndex(): number {
    return this._anchorIndex();
  }

  /**
   * Gets the last selected index.
   *
   * @returns The last selected index, or -1 if none
   */
  getLastSelectedIndex(): number {
    return this._lastSelectedIndex();
  }

  /**
   * Programmatically selects an item without toggling.
   *
   * @param item - The item to select
   * @param index - The index of the item
   */
  select(item: T, index: number): void {
    if (this.mode === SelectionMode.none) {
      return;
    }

    const id = this.getId(item);

    if (this.mode === SelectionMode.single) {
      // Single mode: replace selection
      const newSelection = new Set<string>();
      newSelection.add(id);
      this._selectedIds.set(newSelection);
    } else if (this.mode === SelectionMode.multiple) {
      // Multiple mode: add to selection
      const newSelection = new Set(this._selectedIds());
      newSelection.add(id);
      this._selectedIds.set(newSelection);
    }

    this._lastSelectedIndex.set(index);
    this._anchorIndex.set(index);
    this._lastSelectedId.set(id);
  }

  /**
   * Programmatically deselects an item.
   *
   * @param item - The item to deselect
   */
  deselect(item: T): void {
    const id = this.getId(item);
    const newSelection = new Set(this._selectedIds());
    newSelection.delete(id);
    this._selectedIds.set(newSelection);
  }

  /**
   * Programmatically deselects an item by ID.
   *
   * @param id - The ID of the item to deselect
   */
  deselectById(id: string): void {
    const newSelection = new Set(this._selectedIds());
    newSelection.delete(id);
    this._selectedIds.set(newSelection);
  }

  /**
   * Sets the selection to a specific set of items.
   *
   * @param items - The items to select
   */
  setSelection(items: T[]): void {
    if (this.mode === SelectionMode.none) {
      return;
    }

    if (this.mode === SelectionMode.single && items.length > 1) {
      // In single mode, only select the first item
      const newSelection = new Set<string>();
      newSelection.add(this.getId(items[0]));
      this._selectedIds.set(newSelection);
    } else {
      const newSelection = new Set<string>();
      items.forEach(item => newSelection.add(this.getId(item)));
      this._selectedIds.set(newSelection);
    }
  }

  /**
   * Sets the selection to a specific set of item IDs.
   *
   * @param ids - The IDs of items to select
   */
  setSelectionByIds(ids: string[]): void {
    if (this.mode === SelectionMode.none) {
      return;
    }

    if (this.mode === SelectionMode.single && ids.length > 1) {
      // In single mode, only select the first item
      const newSelection = new Set<string>();
      newSelection.add(ids[0]);
      this._selectedIds.set(newSelection);
    } else {
      this._selectedIds.set(new Set(ids));
    }
  }
}
