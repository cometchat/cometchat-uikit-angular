/**
 * ListManager Class
 *
 * Manages ordered and unordered lists in the rich text editor.
 * Handles list creation, toggling, indentation, and Enter key behavior.
 *
 * @module services/list-manager
 * @see Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { SelectionManager } from './selection-manager.class';

/**
 * ListManager handles all list-related operations for a contenteditable element.
 *
 * Features:
 * - Toggle between ordered and unordered lists
 * - Detect if cursor is inside a list
 * - Handle Enter key to create new list items or exit list
 * - Handle Tab key for indentation/outdentation
 * - Convert text to lists and vice versa
 *
 * @example
 * ```typescript
 * const element = document.querySelector('.editor');
 * const selectionManager = new SelectionManager(element);
 * const manager = new ListManager(element, selectionManager);
 *
 * // Toggle ordered list
 * manager.toggleOrderedList();
 *
 * // Check if in list
 * if (manager.isInList()) {
 *   const type = manager.getListType(); // 'ol' or 'ul'
 * }
 *
 * // Handle Enter key
 * manager.handleEnterKey(event);
 * ```
 */
export class ListManager {
  private element: HTMLElement;
  private selectionManager: SelectionManager;

  /**
   * Create a new ListManager instance
   * @param element - The contenteditable element to manage
   * @param selectionManager - SelectionManager instance for cursor operations
   */
  constructor(element: HTMLElement, selectionManager: SelectionManager) {
    this.element = element;
    this.selectionManager = selectionManager;
  }

  // ==================== List Operations ====================

  /**
   * Toggle ordered list formatting
   * If already in an ordered list, removes list formatting
   * If in an unordered list, converts to ordered list
   * Otherwise, creates a new ordered list
   *
   * @see Requirement 3.1
   */
  toggleOrderedList(): void {
    this.element.focus();

    const listType = this.getListType();

    if (listType === 'ol') {
      // Already in ordered list, exit it
      this.exitList();
    } else if (listType === 'ul') {
      // In unordered list, convert to ordered
      this.convertListType('ol');
    } else {
      // Not in a list, create ordered list
      this.convertToList('ol');
    }
  }

  /**
   * Toggle bullet list formatting
   * If already in a bullet list, removes list formatting
   * If in an ordered list, converts to bullet list
   * Otherwise, creates a new bullet list
   *
   * @see Requirement 3.2
   */
  toggleBulletList(): void {
    this.element.focus();

    const listType = this.getListType();

    if (listType === 'ul') {
      // Already in bullet list, exit it
      this.exitList();
    } else if (listType === 'ol') {
      // In ordered list, convert to bullet
      this.convertListType('ul');
    } else {
      // Not in a list, create bullet list
      this.convertToList('ul');
    }
  }

  /**
   * Handle Enter key press within a list
   * Creates a new list item if content exists
   * Exits the list if pressed on an empty list item
   *
   * @param event - Keyboard event (optional, for preventDefault)
   * @returns True if handled, false otherwise
   * @see Requirements 3.3, 3.4
   */
  handleEnterKey(event?: KeyboardEvent): boolean {
    if (!this.isInList()) {
      return false;
    }

    const listItem = this.getCurrentListItem();
    if (!listItem) {
      return false;
    }

    // Check if list item is empty
    const isEmpty = listItem.textContent?.trim() === '';

    if (isEmpty) {
      // Exit list on Enter in empty item
      if (event) {
        event.preventDefault();
      }
      this.exitList();
      return true;
    } else {
      // Create new list item
      if (event) {
        event.preventDefault();
      }
      this.createNewListItem();
      return true;
    }
  }

  /**
   * Handle Tab key press within a list
   * Indents the current list item
   *
   * @param event - Keyboard event (optional, for preventDefault)
   * @returns True if handled, false otherwise
   * @see Requirement 3.5
   */
  handleTabKey(event?: KeyboardEvent): boolean {
    if (!this.isInList()) {
      return false;
    }

    if (event) {
      event.preventDefault();
    }

    this.indentListItem();
    return true;
  }

  /**
   * Handle Shift+Tab key press within a list
   * Outdents the current list item
   *
   * @param event - Keyboard event (optional, for preventDefault)
   * @returns True if handled, false otherwise
   * @see Requirement 3.5
   */
  handleShiftTabKey(event?: KeyboardEvent): boolean {
    if (!this.isInList()) {
      return false;
    }

    if (event) {
      event.preventDefault();
    }

    this.outdentListItem();
    return true;
  }

  // ==================== List Queries ====================

  /**
   * Check if the cursor is currently inside a list
   * @returns True if inside a list (ol or ul)
   * @see Requirements 3.1, 3.2
   */
  isInList(): boolean {
    return this.getListType() !== null;
  }

  /**
   * Get the type of list the cursor is currently in
   * @returns 'ol' for ordered list, 'ul' for unordered list, or null if not in a list
   * @see Requirements 3.1, 3.2
   */
  getListType(): 'ol' | 'ul' | null {
    const listElement = this.getParentList();
    if (!listElement) {
      return null;
    }

    const tagName = listElement.tagName.toLowerCase();
    return tagName === 'ol' || tagName === 'ul' ? tagName : null;
  }

  // ==================== List Utilities ====================

  /**
   * Convert the current selection or line to a list
   * @param type - List type ('ol' or 'ul')
   * @see Requirements 3.1, 3.2
   */
  convertToList(type: 'ol' | 'ul'): void {
    const selection = this.selectionManager.getSelection();
    if (!selection) {
      return;
    }

    try {
      // Use execCommand if available
      if (document.execCommand) {
        const command = type === 'ol' ? 'insertOrderedList' : 'insertUnorderedList';
        document.execCommand(command, false);
      } else {
        // Fallback: manual list creation
        this.manuallyCreateList(type);
      }
    } catch (error) {
      // Fallback to manual creation
      this.manuallyCreateList(type);
    }
  }

  /**
   * Exit the current list
   * Converts the current list item(s) back to their original format
   * For empty list items, simply places cursor after the list
   * For non-empty items, converts to text nodes with <br> tags
   * @see Requirements 3.3, 3.4
   */
  exitList(): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const listItem = this.getCurrentListItem();
    if (!listItem) {
      return;
    }

    const list = listItem.parentElement;
    if (!list || (list.tagName.toLowerCase() !== 'ol' && list.tagName.toLowerCase() !== 'ul')) {
      return;
    }

    // Check if the list item is empty
    const isEmpty = listItem.textContent?.trim() === '';
    const hasOnlyBr = listItem.innerHTML.trim() === '<br>' || listItem.innerHTML.trim() === '';

    if (isEmpty || hasOnlyBr) {
      // Empty list item - remove it and place cursor after the list
      listItem.remove();

      // Always create a line break after the list for cursor placement
      const br = document.createElement('br');

      if (list.children.length === 0) {
        // List is now empty, remove it
        if (list.parentNode) {
          list.parentNode.insertBefore(br, list.nextSibling);
        }
        list.remove();
      } else {
        // List still has items, insert br after the list
        if (list.parentNode) {
          list.parentNode.insertBefore(br, list.nextSibling);
        }
      }

      // Place cursor at the br element
      const newRange = document.createRange();
      newRange.setStart(br.parentNode!, Array.from(br.parentNode!.childNodes).indexOf(br));
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      return;
    }

    // Non-empty list item - convert to text node
    const range = selection.getRangeAt(0);

    // Get all list items that are within the selection
    const selectedListItems = this.getSelectedListItems(range);

    if (selectedListItems.length === 0) {
      selectedListItems.push(listItem);
    }

    // Create a document fragment to hold all the converted content
    const fragment = document.createDocumentFragment();
    const insertedNodes: Node[] = [];

    // Convert each selected list item to text nodes with <br>
    selectedListItems.forEach((item, index) => {
      // Get the text content
      const textContent = item.textContent || '';

      // Create text node
      const textNode = document.createTextNode(textContent);
      fragment.appendChild(textNode);
      insertedNodes.push(textNode);

      // Add a <br> after each item (except the last one)
      if (index < selectedListItems.length - 1) {
        const br = document.createElement('br');
        fragment.appendChild(br);
        insertedNodes.push(br);
      }
    });

    // Insert the fragment after the list
    if (list.parentNode) {
      list.parentNode.insertBefore(fragment, list.nextSibling);
    }

    // Remove the list items
    selectedListItems.forEach(item => item.remove());

    // Clean up empty list
    if (list.children.length === 0) {
      list.remove();
    }

    // Restore selection to the converted content
    if (insertedNodes.length > 0) {
      const newRange = document.createRange();
      const firstNode = insertedNodes[0];
      const lastNode = insertedNodes[insertedNodes.length - 1];

      // Select from start of first node to end of last node
      newRange.setStartBefore(firstNode);
      newRange.setEndAfter(lastNode);

      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Indent the current list item
   * Creates a nested list if needed
   * @see Requirement 3.5
   */
  indentListItem(): void {
    const listItem = this.getCurrentListItem();
    if (!listItem) {
      return;
    }

    const previousSibling = listItem.previousElementSibling;
    if (!previousSibling || previousSibling.tagName.toLowerCase() !== 'li') {
      // Can't indent the first item
      return;
    }

    const listType = this.getListType();
    if (!listType) {
      return;
    }

    // Enforce max 5 levels of nesting — count ancestor list elements
    let currentDepth = 0;
    let ancestor: Element | null = listItem.parentElement;
    while (ancestor && ancestor !== this.element) {
      if (ancestor.tagName.toLowerCase() === 'ol' || ancestor.tagName.toLowerCase() === 'ul') {
        currentDepth++;
      }
      ancestor = ancestor.parentElement;
    }
    if (currentDepth >= 5) {
      return;
    }

    // Check if previous sibling already has a nested list
    let nestedList = previousSibling.querySelector(`:scope > ${listType}`);

    if (!nestedList) {
      // Create a new nested list
      nestedList = document.createElement(listType);
      previousSibling.appendChild(nestedList);
    }

    // Move the current item into the nested list
    nestedList.appendChild(listItem);

    // Set cycling list-style-type for nested lists
    if (listType === 'ul') {
      const styles = ['disc', 'circle', 'square'];
      let depth = 0;
      let el: Element | null = nestedList.parentElement;
      while (el && el !== this.element) {
        if (el.tagName.toLowerCase() === 'ul') {
          depth++;
        }
        el = el.parentElement;
      }
      (nestedList as HTMLElement).style.listStyleType = styles[depth % 3];
    } else if (listType === 'ol') {
      const styles = ['decimal', 'lower-alpha', 'lower-roman'];
      let depth = 0;
      let el: Element | null = nestedList.parentElement;
      while (el && el !== this.element) {
        if (el.tagName.toLowerCase() === 'ol') {
          depth++;
        }
        el = el.parentElement;
      }
      (nestedList as HTMLElement).style.listStyleType = styles[depth % 3];
    }
  }

  /**
   * Outdent the current list item
   * Moves the item up one level in the list hierarchy
   * @see Requirement 3.5
   */
  outdentListItem(): void {
    const listItem = this.getCurrentListItem();
    if (!listItem) {
      return;
    }

    const parentList = listItem.parentElement;
    if (
      !parentList ||
      (parentList.tagName.toLowerCase() !== 'ol' && parentList.tagName.toLowerCase() !== 'ul')
    ) {
      return;
    }

    const grandparentListItem = parentList.parentElement;
    if (!grandparentListItem || grandparentListItem.tagName.toLowerCase() !== 'li') {
      // Already at top level, convert to paragraph
      this.exitList();
      return;
    }

    const grandparentList = grandparentListItem.parentElement;
    if (!grandparentList) {
      return;
    }

    // Insert the item after its grandparent list item
    grandparentList.insertBefore(listItem, grandparentListItem.nextSibling);

    // If the parent list is now empty, remove it
    if (parentList.children.length === 0) {
      parentList.remove();
    }
  }

  // ==================== Private Helpers ====================

  /**
   * Get all list items that are within the current selection
   * @param range - The selection range
   * @returns Array of list item elements
   * @private
   */
  private getSelectedListItems(range: Range): HTMLElement[] {
    const listItems: HTMLElement[] = [];

    // Get the common ancestor container
    const commonAncestor = range.commonAncestorContainer;

    // Find the root element to search within
    let searchRoot: HTMLElement;
    if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      searchRoot = commonAncestor as HTMLElement;
    } else {
      searchRoot = commonAncestor.parentElement || this.element;
    }

    // Find all list items within the search root
    const allListItems = searchRoot.querySelectorAll('li');

    // Filter to only those that intersect with the selection
    allListItems.forEach(li => {
      if (this.isNodeInRange(li, range)) {
        listItems.push(li as HTMLElement);
      }
    });

    // If no list items found in the search, check if we're inside a single list item
    if (listItems.length === 0) {
      const currentItem = this.getCurrentListItem();
      if (currentItem) {
        listItems.push(currentItem);
      }
    }

    return listItems;
  }

  /**
   * Check if a node intersects with a range
   * @param node - The node to check
   * @param range - The range to check against
   * @returns True if the node intersects with the range
   * @private
   */
  private isNodeInRange(node: Node, range: Range): boolean {
    try {
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);

      // Check if ranges intersect
      // Ranges intersect if: start1 < end2 && start2 < end1
      return (
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the parent list element (ol or ul) containing the cursor
   * @returns List element or null
   * @private
   */
  private getParentList(): HTMLElement | null {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let node = selection.anchorNode;

    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'ol' || tagName === 'ul') {
          return element;
        }
      }
      node = node.parentNode;
    }

    return null;
  }

  /**
   * Get the current list item (li) containing the cursor
   * @returns List item element or null
   * @private
   */
  private getCurrentListItem(): HTMLElement | null {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let node = selection.anchorNode;

    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'li') {
          return element;
        }
      }
      node = node.parentNode;
    }

    return null;
  }

  /**
   * Create a new list item after the current one
   * @public
   */
  createNewListItem(): void {
    const listItem = this.getCurrentListItem();
    if (!listItem) {
      return;
    }

    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const currentRange = selection.getRangeAt(0);

    // Create a range from cursor to end of list item
    const afterCursorRange = document.createRange();
    afterCursorRange.setStart(currentRange.endContainer, currentRange.endOffset);
    afterCursorRange.setEnd(listItem, listItem.childNodes.length);

    // Extract the content after the cursor
    const afterContent = afterCursorRange.extractContents();

    // Create new list item with the extracted content
    const newItem = document.createElement('li');
    const afterText = afterContent.textContent || '';
    if (afterText.trim()) {
      newItem.appendChild(afterContent);
    } else {
      newItem.innerHTML = '<br>';
    }

    // If current item is now empty, add a <br>
    if (!listItem.textContent?.trim()) {
      listItem.innerHTML = '<br>';
    }

    // Insert after current item
    if (listItem.nextSibling) {
      listItem.parentNode?.insertBefore(newItem, listItem.nextSibling);
    } else {
      listItem.parentNode?.appendChild(newItem);
    }

    // Place cursor at start of new item
    const newRange = document.createRange();
    newRange.setStart(newItem, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Convert list type (ol <-> ul)
   * @param newType - Target list type
   * @private
   */
  private convertListType(newType: 'ol' | 'ul'): void {
    const list = this.getParentList();
    if (!list) {
      return;
    }

    // Create new list of the target type
    const newList = document.createElement(newType);
    newList.className = list.className;

    // Move all list items to the new list
    while (list.firstChild) {
      newList.appendChild(list.firstChild);
    }

    // Replace the old list with the new one
    list.parentNode?.replaceChild(newList, list);
  }

  /**
   * Manually create a list (fallback when execCommand is not available)
   * @param type - List type ('ol' or 'ul')
   * @private
   */
  private manuallyCreateList(type: 'ol' | 'ul'): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // Get the selected text or current line
    const selectedText = selection.toString() || 'List item';

    // Create the list structure
    const list = document.createElement(type);
    const listItem = document.createElement('li');
    listItem.textContent = selectedText;
    list.appendChild(listItem);

    // Delete the selected content
    range.deleteContents();

    // Insert the list
    range.insertNode(list);

    // Place cursor at the end of the list item
    const newRange = document.createRange();
    newRange.setStart(listItem, listItem.childNodes.length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}
