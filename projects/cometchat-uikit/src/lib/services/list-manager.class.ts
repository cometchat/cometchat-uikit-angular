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

export class ListManager {
  private element: HTMLElement;
  private selectionManager: SelectionManager;

  constructor(element: HTMLElement, selectionManager: SelectionManager) {
    this.element = element;
    this.selectionManager = selectionManager;
  }

  // ==================== List Operations ====================

  /** Toggle ordered list. Exits if already in OL, converts UL→OL, or creates new OL. @see Req 3.1 */
  toggleOrderedList(): void {
    this.element.focus();
    const listType = this.getListType();
    if (listType === 'ol') { this.exitList(); }
    else if (listType === 'ul') { this.convertListType('ol'); }
    else { this.convertToList('ol'); }
  }

  /** Toggle bullet list. Exits if already in UL, converts OL→UL, or creates new UL. @see Req 3.2 */
  toggleBulletList(): void {
    this.element.focus();
    const listType = this.getListType();
    if (listType === 'ul') { this.exitList(); }
    else if (listType === 'ol') { this.convertListType('ul'); }
    else { this.convertToList('ul'); }
  }

  /**
   * Handle Enter key: creates new list item or exits list on empty item.
   * @returns True if handled. @see Requirements 3.3, 3.4
   */
  handleEnterKey(event?: KeyboardEvent): boolean {
    if (!this.isInList()) return false;
    const listItem = this.getCurrentListItem();
    if (!listItem) return false;
    event?.preventDefault();
    if (listItem.textContent?.trim() === '') { this.exitList(); }
    else { this.createNewListItem(); }
    return true;
  }

  /** Handle Tab key: indents current list item. @returns True if handled. @see Req 3.5 */
  handleTabKey(event?: KeyboardEvent): boolean {
    if (!this.isInList()) return false;
    event?.preventDefault();
    this.indentListItem();
    return true;
  }

  /** Handle Shift+Tab key: outdents current list item. @returns True if handled. @see Req 3.5 */
  handleShiftTabKey(event?: KeyboardEvent): boolean {
    if (!this.isInList()) return false;
    event?.preventDefault();
    this.outdentListItem();
    return true;
  }

  // ==================== List Queries ====================

  /** @returns True if cursor is inside a list (ol or ul). */
  isInList(): boolean { return this.getListType() !== null; }

  /** @returns 'ol', 'ul', or null depending on cursor position. */
  getListType(): 'ol' | 'ul' | null {
    const listElement = this.getParentList();
    if (!listElement) return null;
    const tagName = listElement.tagName.toLowerCase();
    return tagName === 'ol' || tagName === 'ul' ? tagName : null;
  }

  // ==================== List Utilities ====================

  /** Convert current selection to a list of the given type. */
  convertToList(type: 'ol' | 'ul'): void {
    const selection = this.selectionManager.getSelection();
    if (!selection) return;
    try {
      if (document.execCommand) {
        document.execCommand(type === 'ol' ? 'insertOrderedList' : 'insertUnorderedList', false);
      } else {
        this.manuallyCreateList(type);
      }
    } catch {
      this.manuallyCreateList(type);
    }
  }

  /** Exit the current list, converting items back to text nodes with br tags. */
  exitList(): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const listItem = this.getCurrentListItem();
    if (!listItem) return;
    const list = listItem.parentElement;
    if (!list || (list.tagName.toLowerCase() !== 'ol' && list.tagName.toLowerCase() !== 'ul')) return;

    const isEmpty = listItem.textContent?.trim() === '';
    const hasOnlyBr = listItem.innerHTML.trim() === '<br>' || listItem.innerHTML.trim() === '';

    if (isEmpty || hasOnlyBr) {
      listItem.remove();
      const br = document.createElement('br');
      if (list.parentNode) list.parentNode.insertBefore(br, list.nextSibling);
      if (list.children.length === 0) list.remove();
      const newRange = document.createRange();
      newRange.setStart(br.parentNode!, Array.from(br.parentNode!.childNodes).indexOf(br));
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedListItems = this.getSelectedListItems(range);
    if (selectedListItems.length === 0) selectedListItems.push(listItem);

    const fragment = document.createDocumentFragment();
    const insertedNodes: Node[] = [];

    selectedListItems.forEach((item, index) => {
      const textNode = document.createTextNode(item.textContent || '');
      fragment.appendChild(textNode);
      insertedNodes.push(textNode);
      if (index < selectedListItems.length - 1) {
        const br = document.createElement('br');
        fragment.appendChild(br);
        insertedNodes.push(br);
      }
    });

    if (list.parentNode) list.parentNode.insertBefore(fragment, list.nextSibling);
    selectedListItems.forEach(item => item.remove());
    if (list.children.length === 0) list.remove();

    if (insertedNodes.length > 0) {
      const newRange = document.createRange();
      newRange.setStartBefore(insertedNodes[0]);
      newRange.setEndAfter(insertedNodes[insertedNodes.length - 1]);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /** Indent the current list item (creates nested list, max 5 levels). */
  indentListItem(): void {
    const listItem = this.getCurrentListItem();
    if (!listItem) return;
    const previousSibling = listItem.previousElementSibling;
    if (!previousSibling || previousSibling.tagName.toLowerCase() !== 'li') return;
    const listType = this.getListType();
    if (!listType) return;

    let currentDepth = 0;
    let ancestor: Element | null = listItem.parentElement;
    while (ancestor && ancestor !== this.element) {
      if (ancestor.tagName.toLowerCase() === 'ol' || ancestor.tagName.toLowerCase() === 'ul') currentDepth++;
      ancestor = ancestor.parentElement;
    }
    if (currentDepth >= 5) return;

    let nestedList = previousSibling.querySelector(`:scope > ${listType}`);
    if (!nestedList) {
      nestedList = document.createElement(listType);
      previousSibling.appendChild(nestedList);
    }
    nestedList.appendChild(listItem);

    const ulStyles = ['disc', 'circle', 'square'];
    const olStyles = ['decimal', 'lower-alpha', 'lower-roman'];
    const styles = listType === 'ul' ? ulStyles : olStyles;
    let depth = 0;
    let el: Element | null = nestedList.parentElement;
    while (el && el !== this.element) {
      if (el.tagName.toLowerCase() === listType) depth++;
      el = el.parentElement;
    }
    (nestedList as HTMLElement).style.listStyleType = styles[depth % 3];
  }

  /** Outdent the current list item (moves up one level, or exits list at top level). */
  outdentListItem(): void {
    const listItem = this.getCurrentListItem();
    if (!listItem) return;
    const parentList = listItem.parentElement;
    if (!parentList || (parentList.tagName.toLowerCase() !== 'ol' && parentList.tagName.toLowerCase() !== 'ul')) return;
    const grandparentListItem = parentList.parentElement;
    if (!grandparentListItem || grandparentListItem.tagName.toLowerCase() !== 'li') {
      this.exitList();
      return;
    }
    const grandparentList = grandparentListItem.parentElement;
    if (!grandparentList) return;
    grandparentList.insertBefore(listItem, grandparentListItem.nextSibling);
    if (parentList.children.length === 0) parentList.remove();
  }

  // ==================== Private Helpers ====================

  private getSelectedListItems(range: Range): HTMLElement[] {
    const listItems: HTMLElement[] = [];
    const commonAncestor = range.commonAncestorContainer;
    const searchRoot: HTMLElement = commonAncestor.nodeType === Node.ELEMENT_NODE
      ? commonAncestor as HTMLElement
      : commonAncestor.parentElement || this.element;

    searchRoot.querySelectorAll('li').forEach(li => {
      if (this.isNodeInRange(li, range)) listItems.push(li as HTMLElement);
    });

    if (listItems.length === 0) {
      const currentItem = this.getCurrentListItem();
      if (currentItem) listItems.push(currentItem);
    }
    return listItems;
  }

  private isNodeInRange(node: Node, range: Range): boolean {
    try {
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);
      return (
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0
      );
    } catch { return false; }
  }

  private getParentList(): HTMLElement | null {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node = selection.anchorNode;
    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'ol' || tag === 'ul') return el;
      }
      node = node.parentNode;
    }
    return null;
  }

  private getCurrentListItem(): HTMLElement | null {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node = selection.anchorNode;
    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'li') {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }
    return null;
  }

  createNewListItem(): void {
    const listItem = this.getCurrentListItem();
    if (!listItem) return;
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const currentRange = selection.getRangeAt(0);
    const afterCursorRange = document.createRange();
    afterCursorRange.setStart(currentRange.endContainer, currentRange.endOffset);
    afterCursorRange.setEnd(listItem, listItem.childNodes.length);
    const afterContent = afterCursorRange.extractContents();

    const newItem = document.createElement('li');
    if ((afterContent.textContent || '').trim()) {
      newItem.appendChild(afterContent);
    } else {
      newItem.innerHTML = '<br>';
    }
    if (!listItem.textContent?.trim()) listItem.innerHTML = '<br>';

    if (listItem.nextSibling) {
      listItem.parentNode?.insertBefore(newItem, listItem.nextSibling);
    } else {
      listItem.parentNode?.appendChild(newItem);
    }

    const newRange = document.createRange();
    newRange.setStart(newItem, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  private convertListType(newType: 'ol' | 'ul'): void {
    const list = this.getParentList();
    if (!list) return;
    const newList = document.createElement(newType);
    newList.className = list.className;
    while (list.firstChild) newList.appendChild(list.firstChild);
    list.parentNode?.replaceChild(newList, list);

    // ENG-35758: When converting UL→OL the browser retains the internal list
    // counter from the transplanted <li> nodes and may render them all as "1.".
    // Force a counter reset by toggling the list-style and restoring it so the
    // browser recalculates the ordinal values from 1.
    if (newType === 'ol') {
      newList.setAttribute('start', '1');
      // Remove and re-append each <li> so the browser recounts from scratch.
      const items = Array.from(newList.querySelectorAll(':scope > li'));
      items.forEach(li => {
        newList.removeChild(li);
        newList.appendChild(li);
      });
    }
  }

  private manuallyCreateList(type: 'ol' | 'ul'): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString() || 'List item';
    const list = document.createElement(type);
    const listItem = document.createElement('li');
    listItem.textContent = selectedText;
    list.appendChild(listItem);
    range.deleteContents();
    range.insertNode(list);
    const newRange = document.createRange();
    newRange.setStart(listItem, listItem.childNodes.length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}
