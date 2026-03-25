import { SelectionMode } from '../Enums/Enums';

/**
 * Selection state interface for tracking item selections in list components.
 * Emitted via selectionChange event from CometChatConversations, CometChatUsers,
 * CometChatGroups, and CometChatGroupMembers components.
 *
 * @remarks
 * This interface provides a standardized way to track selection state across
 * all list components in the UIKit. It includes the current selection mode,
 * the set of selected item IDs, and the ID of the last selected item.
 *
 * @example
 * ```typescript
 * // Handling selection change event
 * handleSelectionChange(state: SelectionState) {
 *   console.log('Mode:', state.mode);
 *   console.log('Selected IDs:', Array.from(state.selectedIds));
 *   console.log('Last selected:', state.lastSelectedId);
 * }
 * ```
 *
 * @see Requirements 9.1, 9.2
 */
export interface SelectionState {
  /** Current selection mode (none, single, or multiple) */
  mode: SelectionMode;
  /** Set of selected item IDs */
  selectedIds: Set<string>;
  /** ID of the last selected item, or null if no item was selected */
  lastSelectedId: string | null;
}
