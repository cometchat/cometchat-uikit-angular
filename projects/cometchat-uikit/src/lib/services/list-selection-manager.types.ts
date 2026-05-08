/**
 * Types for ListSelectionManager.
 */
import { SelectionMode } from '../Enums/Enums';

/**
 * Represents the current state of list selection.
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
