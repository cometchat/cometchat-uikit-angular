/**
 * HistoryManager Class
 *
 * Implements undo/redo functionality using a command pattern with history stacks.
 * Groups rapid typing into single undo steps for better user experience.
 *
 * @module services/history-manager
 * @see Requirements 6.1, 6.2
 */

import { HistoryEntry } from './rich-text-editor.interfaces';

/**
 * HistoryManager handles undo/redo operations for the rich text editor.
 *
 * Features:
 * - Maintains separate undo and redo stacks
 * - Groups rapid typing (within 500ms) into single undo steps
 * - Stores cursor position with each history entry
 * - Limits stack size to prevent memory issues
 * - Provides canUndo/canRedo queries
 *
 * @example
 * ```typescript
 * const manager = new HistoryManager();
 *
 * // Push a new history entry
 * manager.push({
 *   html: '<p>Hello</p>',
 *   cursorPosition: 5,
 *   timestamp: Date.now()
 * });
 *
 * // Undo
 * const previous = manager.undo();
 * if (previous) {
 *   // Restore previous state
 * }
 *
 * // Redo
 * const next = manager.redo();
 * ```
 */
export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxStackSize = 100;
  private groupDelay = 500; // milliseconds
  private lastTimestamp = 0;

  /**
   * Create a new HistoryManager instance
   * @param maxStackSize - Maximum number of entries to keep (default: 100)
   * @param groupDelay - Time window for grouping operations in ms (default: 500)
   */
  constructor(maxStackSize = 100, groupDelay = 500) {
    this.maxStackSize = maxStackSize;
    this.groupDelay = groupDelay;
  }

  // ==================== Operations ====================

  /**
   * Push a new history entry onto the undo stack
   * Groups entries if they occur within the groupDelay window
   * Clears the redo stack when a new entry is pushed
   *
   * @param entry - History entry to push
   * @see Requirements 6.1, 6.2
   */
  push(entry: HistoryEntry): void {
    // Check if we should group this entry with the previous one
    if (this.shouldGroup(entry.timestamp)) {
      // Replace the last entry instead of adding a new one
      if (this.undoStack.length > 0) {
        this.undoStack[this.undoStack.length - 1] = entry;
      } else {
        this.undoStack.push(entry);
      }
    } else {
      // Add as a new entry
      this.undoStack.push(entry);

      // Handle stack overflow
      if (this.undoStack.length > this.maxStackSize) {
        this.undoStack.shift(); // Remove oldest entry
      }
    }

    // Update last timestamp
    this.lastTimestamp = entry.timestamp;

    // Clear redo stack when new entry is pushed
    this.redoStack = [];
  }

  /**
   * Undo the last operation
   * Moves the current state to the redo stack and returns the previous state
   *
   * @returns Previous history entry, or null if nothing to undo
   * @see Requirements 6.1
   */
  undo(): HistoryEntry | null {
    if (!this.canUndo()) {
      return null;
    }

    // Pop from undo stack
    const current = this.undoStack.pop()!;

    // Push to redo stack
    this.redoStack.push(current);

    // Handle redo stack overflow
    if (this.redoStack.length > this.maxStackSize) {
      this.redoStack.shift();
    }

    // Return the previous entry (now at top of undo stack)
    // If undo stack is empty, return null (we're at the initial state)
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  /**
   * Redo the last undone operation
   * Moves the state from redo stack back to undo stack
   *
   * @returns Next history entry, or null if nothing to redo
   * @see Requirements 6.2
   */
  redo(): HistoryEntry | null {
    if (!this.canRedo()) {
      return null;
    }

    // Pop from redo stack
    const next = this.redoStack.pop()!;

    // Push back to undo stack
    this.undoStack.push(next);

    // Handle undo stack overflow
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    return next;
  }

  // ==================== Queries ====================

  /**
   * Check if undo is available
   * @returns True if there are entries in the undo stack
   * @see Requirements 6.1
   */
  canUndo(): boolean {
    return this.undoStack.length > 1; // Need at least 2 entries (current + previous)
  }

  /**
   * Check if redo is available
   * @returns True if there are entries in the redo stack
   * @see Requirements 6.2
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // ==================== Utilities ====================

  /**
   * Determine if a new entry should be grouped with the previous one
   * Groups entries that occur within the groupDelay window
   *
   * @param timestamp - Timestamp of the new entry
   * @returns True if should group with previous entry
   * @see Requirements 6.1, 6.2
   */
  shouldGroup(timestamp: number): boolean {
    if (this.undoStack.length === 0) {
      return false;
    }

    const timeSinceLastEntry = timestamp - this.lastTimestamp;
    return timeSinceLastEntry < this.groupDelay;
  }

  /**
   * Clear all history
   * Resets both undo and redo stacks
   * @see Requirements 6.1, 6.2
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.lastTimestamp = 0;
  }

  /**
   * Get the current history entry (top of undo stack)
   * @returns Current history entry, or null if stack is empty
   */
  getCurrent(): HistoryEntry | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  /**
   * Get the size of the undo stack
   * @returns Number of entries in undo stack
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   * @returns Number of entries in redo stack
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }
}
