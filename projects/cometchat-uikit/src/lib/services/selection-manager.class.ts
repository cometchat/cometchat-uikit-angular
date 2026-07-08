/**
 * SelectionManager Class
 *
 * Manages text selection and cursor position for the rich text editor.
 * Provides methods for saving/restoring selection state and manipulating cursor position.
 *
 * @module services/selection-manager
 * @see Requirements 2.8
 */

import { SelectionState } from './rich-text-editor.interfaces';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * SelectionManager handles all selection-related operations for a contenteditable element.
 *
 * This class is responsible for:
 * - Getting and manipulating the current selection
 * - Saving and restoring selection state
 * - Setting and getting cursor position
 * - Querying selection properties (hasSelection, getSelectedText, etc.)
 * - Utility operations (selectAll, collapseToEnd)
 *
 * @example
 * ```typescript
 * const element = document.querySelector('.editor');
 * const manager = new SelectionManager(element);
 *
 * // Save and restore selection
 * const state = manager.saveSelection();
 * // ... do some operations ...
 * manager.restoreSelection(state);
 *
 * // Set cursor position
 * manager.setCursorPosition('end');
 *
 * // Get selected text
 * const text = manager.getSelectedText();
 * ```
 */
export class SelectionManager {
  private element: HTMLElement;

  /**
   * Create a new SelectionManager instance
   * @param element - The contenteditable element to manage selection for
   */
  constructor(element: HTMLElement) {
    this.element = element;
  }

  // ==================== Selection Operations ====================

  /**
   * Get the current selection object
   * Returns null if no selection exists
   *
   * @returns Selection object or null
   * @see Requirements 2.8
   */
  getSelection(): Selection | null {
    return typeof window !== 'undefined' ? window.getSelection() : null;
  }

  /**
   * Get the current selection range
   * Returns null if no selection exists or selection has no ranges
   *
   * @returns Range object or null
   * @see Requirements 2.8
   */
  getRange(): Range | null {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    return selection.getRangeAt(0);
  }

  /**
   * Save the current selection state
   * Returns a SelectionState object that can be used to restore the selection later
   *
   * @returns SelectionState object
   * @see Requirements 2.8
   */
  saveSelection(): SelectionState {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return {
        anchorNode: null,
        anchorOffset: 0,
        focusNode: null,
        focusOffset: 0,
      };
    }

    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset,
    };
  }

  /**
   * Restore a previously saved selection state
   * Does nothing if the state is invalid (null nodes)
   *
   * @param state - SelectionState to restore
   * @see Requirements 2.8
   */
  restoreSelection(state: SelectionState): void {
    if (!state.anchorNode || !state.focusNode) {
      return;
    }

    const selection = this.getSelection();
    if (!selection) {
      return;
    }

    try {
      const range = document.createRange();
      range.setStart(state.anchorNode, state.anchorOffset);
      range.setEnd(state.focusNode, state.focusOffset);

      selection.removeAllRanges();
      selection.addRange(range);
    } catch (error) {
      // Selection restoration can fail if nodes are no longer in the DOM
      // or if offsets are invalid. Fail silently.
      CometChatLogger.warn('SelectionManager', 'Failed to restore selection:', error);
    }
  }

  // ==================== Cursor Operations ====================

  /**
   * Set the cursor position in the editor
   * Supports 'start', 'end', or a numeric character offset
   *
   * @param position - Where to place the cursor ('start', 'end', or number)
   * @see Requirements 2.8
   */
  setCursorPosition(position: 'start' | 'end' | number): void {
    const selection = this.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();

    if (position === 'start') {
      // Place cursor at the start of the element
      range.setStart(this.element, 0);
      range.collapse(true);
    } else if (position === 'end') {
      // Place cursor at the end of the element
      range.selectNodeContents(this.element);
      range.collapse(false);
    } else if (typeof position === 'number') {
      // Place cursor at specific character offset
      const textNode = this.getTextNodeAtOffset(position);
      if (textNode) {
        range.setStart(textNode.node, textNode.offset);
        range.collapse(true);
      } else {
        // If offset is out of bounds, place at end
        range.selectNodeContents(this.element);
        range.collapse(false);
      }
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Get the current cursor position as a character offset
   * Returns 0 if no selection exists
   *
   * @returns Character offset from start of element
   * @see Requirements 2.8
   */
  getCursorPosition(): number {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return 0;
    }

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(this.element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  }

  // ==================== Selection Queries ====================

  /**
   * Check if there is an active selection (not just a cursor)
   * Returns true if selection has non-zero length
   *
   * @returns True if there is a selection
   * @see Requirements 2.8
   */
  hasSelection(): boolean {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    return !range.collapsed;
  }

  /**
   * Get the selected text as a plain string
   * Returns empty string if no selection
   *
   * @returns Selected text
   * @see Requirements 2.8
   */
  getSelectedText(): string {
    const selection = this.getSelection();
    if (!selection) {
      return '';
    }
    return selection.toString();
  }

  /**
   * Get the selected content as HTML
   * Returns empty string if no selection
   *
   * @returns Selected HTML
   * @see Requirements 2.8
   */
  getSelectedHTML(): string {
    const range = this.getRange();
    if (!range) {
      return '';
    }

    const fragment = range.cloneContents();
    const div = document.createElement('div');
    div.appendChild(fragment);
    return div.innerHTML;
  }

  // ==================== Utilities ====================

  /**
   * Select all content in the editor
   * @see Requirements 2.8
   */
  selectAll(): void {
    const selection = this.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(this.element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Collapse the selection to the end (place cursor at end of selection)
   * @see Requirements 2.8
   */
  collapseToEnd(): void {
    const selection = this.getSelection();
    if (!selection) {
      return;
    }

    selection.collapseToEnd();
  }

  // ==================== Private Helpers ====================

  /**
   * Get the text node and offset at a specific character position
   * Used for setting cursor position by character offset
   *
   * @param offset - Character offset from start of element
   * @returns Object with node and offset, or null if not found
   * @private
   */
  private getTextNodeAtOffset(offset: number): { node: Node; offset: number } | null {
    const walker = document.createTreeWalker(this.element, NodeFilter.SHOW_TEXT, null);

    let currentOffset = 0;
    let node: Node | null;

    while ((node = walker.nextNode())) {
      const textLength = node.textContent?.length || 0;
      if (currentOffset + textLength >= offset) {
        return { node, offset: offset - currentOffset };
      }
      currentOffset += textLength;
    }

    return null;
  }
}
