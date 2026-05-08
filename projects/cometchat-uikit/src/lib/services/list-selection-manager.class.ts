/**
 * ListSelectionManager Class
 *
 * Manages list item selection with keyboard support for accessibility.
 * Provides methods for single/multiple selection, range selection, and selection state management.
 * @see Requirements 3.3-3.7, 5.3, 7.3, 9.3, 13.1-13.7
 */

import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { SelectionMode } from '../Enums/Enums';
import { ListSelectionState } from './list-selection-manager.types';

export type { ListSelectionState };

/**
 * ListSelectionManager handles all selection-related operations for list components.
 * Supports single/multiple selection, range selection, and keyboard navigation.
 * @typeParam T - The type of items being selected
 * @see Requirements 3.3-3.7, 5.3, 7.3, 9.3, 13.1-13.7
 */
export class ListSelectionManager<T> {
  private _selectedIds: WritableSignal<Set<string>> = signal(new Set<string>());
  private _lastSelectedIndex: WritableSignal<number> = signal(-1);
  private _anchorIndex: WritableSignal<number> = signal(-1);

  private _lastSelectedId: WritableSignal<string | null> = signal(null);

  /** Count of selected items. @see Requirements 13.6 */
  readonly selectedCount: Signal<number> = computed(() => this._selectedIds().size);
  /** Whether any items are selected. */
  readonly hasSelection: Signal<boolean> = computed(() => this._selectedIds().size > 0);
  /** Read-only signal exposing the selected IDs set. */
  readonly selectedIds: Signal<Set<string>> = computed(() => new Set(this._selectedIds()));

  constructor(
    private mode: SelectionMode,
    private getId: (item: T) => string
  ) {}

  /** Toggles selection for an item (Space key behavior). @see Requirements 3.3, 5.3, 7.3, 9.3, 13.1-13.3 */
  toggleSelection(item: T, index: number): boolean {
    if (this.mode === SelectionMode.none) {
      return false;
    }

    const id = this.getId(item);
    const currentSelection = this._selectedIds();
    const wasSelected = currentSelection.has(id);

    if (this.mode === SelectionMode.single) {
      const newSelection = new Set<string>();
      if (!wasSelected) newSelection.add(id);
      this._selectedIds.set(newSelection);
    } else if (this.mode === SelectionMode.multiple) {
      const newSelection = new Set(currentSelection);
      if (wasSelected) { newSelection.delete(id); } else { newSelection.add(id); }
      this._selectedIds.set(newSelection);
    }

    this._lastSelectedIndex.set(index);
    this._anchorIndex.set(index);
    this._lastSelectedId.set(wasSelected ? null : id);

    return !wasSelected;
  }

  /** Extends selection to include an item (Shift+Arrow behavior). @see Requirements 3.4, 3.5 */
  extendSelection(item: T, index: number): void {
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

  /** Selects all items between anchor and current index (Shift+Space). @see Requirements 13.4 */
  selectRange(items: T[], currentIndex: number): void {
    if (this.mode !== SelectionMode.multiple) return;

    const anchor = this._anchorIndex();
    if (anchor === -1) {
      if (currentIndex >= 0 && currentIndex < items.length) {
        this.toggleSelection(items[currentIndex], currentIndex);
      }
      return;
    }

    const start = Math.min(anchor, currentIndex);
    const end = Math.max(anchor, currentIndex);
    const newSelection = new Set(this._selectedIds());
    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < items.length) newSelection.add(this.getId(items[i]));
    }
    this._selectedIds.set(newSelection);
    this._lastSelectedIndex.set(currentIndex);
    if (currentIndex >= 0 && currentIndex < items.length) {
      this._lastSelectedId.set(this.getId(items[currentIndex]));
    }
  }

  /** Selects all items (Ctrl/Cmd+A). @see Requirements 3.6 */
  selectAll(items: T[]): void {
    if (this.mode !== SelectionMode.multiple) return;
    const newSelection = new Set<string>();
    items.forEach(item => newSelection.add(this.getId(item)));
    this._selectedIds.set(newSelection);
  }

  /** Clears all selections (Escape). @see Requirements 3.7 */
  clearSelection(): void {
    this._selectedIds.set(new Set());
    this._lastSelectedIndex.set(-1);
    this._anchorIndex.set(-1);
    this._lastSelectedId.set(null);
  }

  /** Checks if an item is currently selected. */
  isSelected(item: T): boolean { return this._selectedIds().has(this.getId(item)); }

  /** Checks if an item ID is currently selected. */
  isSelectedById(id: string): boolean { return this._selectedIds().has(id); }

  /** Gets the current selection state. @see Requirements 13.5 */
  getSelectionState(): ListSelectionState {
    return { mode: this.mode, selectedIds: new Set(this._selectedIds()), lastSelectedId: this._lastSelectedId(), anchorIndex: this._anchorIndex() };
  }

  /** Gets the array of selected item IDs. */
  getSelectedIdsArray(): string[] { return Array.from(this._selectedIds()); }

  /** Sets the selection mode. Clears selection when switching to single/none. */
  setMode(mode: SelectionMode): void {
    const previousMode = this.mode;
    this.mode = mode;
    if (previousMode === SelectionMode.multiple && mode === SelectionMode.single && this._selectedIds().size > 1) {
      this.clearSelection();
    }
    if (mode === SelectionMode.none) this.clearSelection();
  }

  /** Gets the current selection mode. */
  getMode(): SelectionMode { return this.mode; }

  /** Sets the anchor index for range selection. */
  setAnchorIndex(index: number): void { this._anchorIndex.set(index); }

  /** Gets the current anchor index, or -1 if not set. */
  getAnchorIndex(): number { return this._anchorIndex(); }

  /** Gets the last selected index, or -1 if none. */
  getLastSelectedIndex(): number { return this._lastSelectedIndex(); }

  /** Programmatically selects an item without toggling. */
  select(item: T, index: number): void {
    if (this.mode === SelectionMode.none) return;
    const id = this.getId(item);
    if (this.mode === SelectionMode.single) {
      this._selectedIds.set(new Set([id]));
    } else {
      const newSelection = new Set(this._selectedIds());
      newSelection.add(id);
      this._selectedIds.set(newSelection);
    }
    this._lastSelectedIndex.set(index);
    this._anchorIndex.set(index);
    this._lastSelectedId.set(id);
  }

  /** Programmatically deselects an item. */
  deselect(item: T): void {
    const newSelection = new Set(this._selectedIds());
    newSelection.delete(this.getId(item));
    this._selectedIds.set(newSelection);
  }

  /** Programmatically deselects an item by ID. */
  deselectById(id: string): void {
    const newSelection = new Set(this._selectedIds());
    newSelection.delete(id);
    this._selectedIds.set(newSelection);
  }

  /** Sets the selection to a specific set of items. */
  setSelection(items: T[]): void {
    if (this.mode === SelectionMode.none) return;
    if (this.mode === SelectionMode.single && items.length > 1) {
      this._selectedIds.set(new Set([this.getId(items[0])]));
    } else {
      const newSelection = new Set<string>();
      items.forEach(item => newSelection.add(this.getId(item)));
      this._selectedIds.set(newSelection);
    }
  }

  /** Sets the selection to a specific set of item IDs. */
  setSelectionByIds(ids: string[]): void {
    if (this.mode === SelectionMode.none) return;
    if (this.mode === SelectionMode.single && ids.length > 1) {
      this._selectedIds.set(new Set([ids[0]]));
    } else {
      this._selectedIds.set(new Set(ids));
    }
  }
}
