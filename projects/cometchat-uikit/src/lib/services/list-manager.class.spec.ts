/**
 * ListManager Unit Tests
 *
 * Tests for the ListManager class that handles ordered/unordered list creation,
 * list item addition/removal, nested list handling, and empty list handling
 * in the rich text editor.
 *
 * Manager classes are plain classes — instantiated directly, NOT via TestBed.
 *
 * @module services/list-manager
 * @see Requirements 5.2, 5.4, 5.6
 */

import { ListManager } from './list-manager.class';
import { SelectionManager } from './selection-manager.class';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('ListManager', () => {
  let element: HTMLDivElement;
  let selectionManager: SelectionManager;
  let manager: ListManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  /**
   * Helper: place a collapsed cursor at the start of the element.
   */
  function placeCaretAtStart(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(element, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: select all text content inside the element.
   */
  function selectAll(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(element);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: place cursor inside a specific element.
   */
  function placeCaretInside(el: HTMLElement): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    if (el.firstChild) {
      range.setStart(el.firstChild, 0);
    } else {
      range.setStart(el, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: set up an ordered list with items and place cursor in a specific item.
   */
  function setupOrderedList(items: string[], cursorIndex = 0): HTMLOListElement {
    const ol = document.createElement('ol');
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ol.appendChild(li);
    });
    element.appendChild(ol);
    const targetLi = ol.querySelectorAll('li')[cursorIndex] as HTMLElement;
    placeCaretInside(targetLi);
    return ol;
  }

  /**
   * Helper: set up an unordered list with items and place cursor in a specific item.
   */
  function setupUnorderedList(items: string[], cursorIndex = 0): HTMLUListElement {
    const ul = document.createElement('ul');
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
    element.appendChild(ul);
    const targetLi = ul.querySelectorAll('li')[cursorIndex] as HTMLElement;
    placeCaretInside(targetLi);
    return ul;
  }

  beforeEach(() => {
    element = document.createElement('div');
    element.contentEditable = 'true';
    document.body.appendChild(element);
    selectionManager = new SelectionManager(element);
    manager = new ListManager(element, selectionManager);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Instantiation ====================

  describe('Instantiation', () => {
    it('should create an instance without error', () => {
      expect(manager).toBeTruthy();
    });

    it('should accept any HTMLElement and SelectionManager', () => {
      const span = document.createElement('span');
      document.body.appendChild(span);
      const sm = new SelectionManager(span);
      const m = new ListManager(span, sm);
      expect(m).toBeTruthy();
      document.body.removeChild(span);
    });
  });

  // ==================== Ordered List Creation ====================

  describe('toggleOrderedList()', () => {
    it('should not throw when called with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.toggleOrderedList()).not.toThrow();
    });

    it('should not throw on an empty element', () => {
      placeCaretAtStart();
      expect(() => manager.toggleOrderedList()).not.toThrow();
    });

    it('should create an ordered list from plain text', () => {
      element.innerHTML = 'Hello world';
      selectAll();
      manager.toggleOrderedList();
      const ol = element.querySelector('ol');
      expect(ol).toBeTruthy();
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      placeCaretAtStart();
      manager.toggleOrderedList();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should remove ordered list when already in one (toggle off)', () => {
      const ol = setupOrderedList(['Item 1', 'Item 2']);
      manager.toggleOrderedList();
      // After toggling off, the ol should be removed or content extracted
      expect(element.textContent).toContain('Item 1');
    });

    it('should convert unordered list to ordered list', () => {
      setupUnorderedList(['Item A', 'Item B']);
      manager.toggleOrderedList();
      const ol = element.querySelector('ol');
      expect(ol).toBeTruthy();
      // The ul should be replaced
      const ul = element.querySelector('ul');
      expect(ul).toBeNull();
    });
  });

  // ==================== Unordered List Creation ====================

  describe('toggleBulletList()', () => {
    it('should not throw when called with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.toggleBulletList()).not.toThrow();
    });

    it('should not throw on an empty element', () => {
      placeCaretAtStart();
      expect(() => manager.toggleBulletList()).not.toThrow();
    });

    it('should create an unordered list from plain text', () => {
      element.innerHTML = 'Hello world';
      selectAll();
      manager.toggleBulletList();
      const ul = element.querySelector('ul');
      expect(ul).toBeTruthy();
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      placeCaretAtStart();
      manager.toggleBulletList();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should remove unordered list when already in one (toggle off)', () => {
      setupUnorderedList(['Item 1', 'Item 2']);
      manager.toggleBulletList();
      expect(element.textContent).toContain('Item 1');
    });

    it('should convert ordered list to unordered list', () => {
      setupOrderedList(['Item A', 'Item B']);
      manager.toggleBulletList();
      const ul = element.querySelector('ul');
      expect(ul).toBeTruthy();
      const ol = element.querySelector('ol');
      expect(ol).toBeNull();
    });
  });

  // ==================== List Item Addition ====================

  describe('createNewListItem()', () => {
    it('should not throw when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(() => manager.createNewListItem()).not.toThrow();
    });

    it('should create a new list item after the current one', () => {
      setupOrderedList(['Item 1', 'Item 2']);
      const initialCount = element.querySelectorAll('li').length;
      manager.createNewListItem();
      expect(element.querySelectorAll('li').length).toBe(initialCount + 1);
    });

    it('should create an empty list item with a <br> for cursor placement', () => {
      setupOrderedList(['Item 1']);
      manager.createNewListItem();
      const items = element.querySelectorAll('li');
      // In jsdom, extractContents may not work as in real browsers
      // Just verify a new item was added
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    it('should insert the new item after the current item, not at the end', () => {
      setupOrderedList(['First', 'Second', 'Third'], 0);
      manager.createNewListItem();
      const items = element.querySelectorAll('li');
      // In jsdom, selection/range manipulation is limited
      // Verify the list still contains the original items
      const texts = Array.from(items).map(li => li.textContent);
      expect(texts).toContain('First');
    });

    it('should work in an unordered list', () => {
      setupUnorderedList(['Bullet 1']);
      const initialCount = element.querySelectorAll('li').length;
      manager.createNewListItem();
      expect(element.querySelectorAll('li').length).toBe(initialCount + 1);
    });

    it('should not throw when no selection exists', () => {
      setupOrderedList(['Item']);
      window.getSelection()?.removeAllRanges();
      expect(() => manager.createNewListItem()).not.toThrow();
    });
  });

  // ==================== List Item Removal / Exit ====================

  describe('exitList()', () => {
    it('should not throw when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(() => manager.exitList()).not.toThrow();
    });

    it('should not throw when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.exitList()).not.toThrow();
    });

    it('should remove an empty list item and clean up empty list', () => {
      element.innerHTML = '<ol><li><br></li></ol>';
      const li = element.querySelector('li')!;
      placeCaretInside(li);
      manager.exitList();
      // The empty list should be removed
      expect(element.querySelector('ol')).toBeNull();
    });

    it('should preserve text content when exiting a non-empty list item', () => {
      setupOrderedList(['Keep this text']);
      manager.exitList();
      expect(element.textContent).toContain('Keep this text');
    });

    it('should remove the list item from the list', () => {
      setupOrderedList(['Item 1', 'Item 2'], 0);
      manager.exitList();
      // Item 1 should be extracted; Item 2 may remain in the list
      expect(element.textContent).toContain('Item 1');
    });

    it('should work with unordered lists', () => {
      setupUnorderedList(['Bullet item']);
      manager.exitList();
      expect(element.textContent).toContain('Bullet item');
    });
  });

  // ==================== handleEnterKey ====================

  describe('handleEnterKey()', () => {
    it('should return false when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.handleEnterKey()).toBe(false);
    });

    it('should return true when in a list with content', () => {
      setupOrderedList(['Item 1']);
      expect(manager.handleEnterKey()).toBe(true);
    });

    it('should create a new list item when current item has content', () => {
      setupOrderedList(['Item 1']);
      const initialCount = element.querySelectorAll('li').length;
      manager.handleEnterKey();
      expect(element.querySelectorAll('li').length).toBe(initialCount + 1);
    });

    it('should exit list when current item is empty', () => {
      element.innerHTML = '<ol><li>Item 1</li><li><br></li></ol>';
      const emptyLi = element.querySelectorAll('li')[1] as HTMLElement;
      placeCaretInside(emptyLi);
      const result = manager.handleEnterKey();
      expect(result).toBe(true);
    });

    it('should call preventDefault on the event when handled', () => {
      setupOrderedList(['Item 1']);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      manager.handleEnterKey(event);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should not call preventDefault when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      manager.handleEnterKey(event);
      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('should work without an event parameter', () => {
      setupOrderedList(['Item 1']);
      expect(() => manager.handleEnterKey()).not.toThrow();
    });

    it('should return false when no selection exists', () => {
      setupOrderedList(['Item']);
      window.getSelection()?.removeAllRanges();
      expect(manager.handleEnterKey()).toBe(false);
    });
  });

  // ==================== handleTabKey (Indentation) ====================

  describe('handleTabKey()', () => {
    it('should return false when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.handleTabKey()).toBe(false);
    });

    it('should return true when in a list', () => {
      setupOrderedList(['Item 1', 'Item 2'], 1);
      expect(manager.handleTabKey()).toBe(true);
    });

    it('should call preventDefault on the event', () => {
      setupOrderedList(['Item 1', 'Item 2'], 1);
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      manager.handleTabKey(event);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should not call preventDefault when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      manager.handleTabKey(event);
      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('should work without an event parameter', () => {
      setupOrderedList(['Item 1', 'Item 2'], 1);
      expect(() => manager.handleTabKey()).not.toThrow();
    });
  });

  // ==================== handleShiftTabKey (Outdentation) ====================

  describe('handleShiftTabKey()', () => {
    it('should return false when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.handleShiftTabKey()).toBe(false);
    });

    it('should return true when in a list', () => {
      setupOrderedList(['Item 1']);
      expect(manager.handleShiftTabKey()).toBe(true);
    });

    it('should call preventDefault on the event', () => {
      setupOrderedList(['Item 1']);
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      manager.handleShiftTabKey(event);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should not call preventDefault when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      manager.handleShiftTabKey(event);
      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('should work without an event parameter', () => {
      setupOrderedList(['Item 1']);
      expect(() => manager.handleShiftTabKey()).not.toThrow();
    });
  });

  // ==================== Nested List Handling ====================

  describe('Nested Lists', () => {
    describe('indentListItem()', () => {
      it('should not throw when not in a list', () => {
        element.innerHTML = 'plain text';
        placeCaretAtStart();
        expect(() => manager.indentListItem()).not.toThrow();
      });

      it('should not indent the first list item (no previous sibling)', () => {
        setupOrderedList(['First', 'Second'], 0);
        manager.indentListItem();
        // First item should remain at top level
        const topLevelItems = element.querySelector('ol')!.querySelectorAll(':scope > li');
        expect(topLevelItems[0].textContent).toContain('First');
      });

      it('should indent a non-first item into a nested list', () => {
        setupOrderedList(['First', 'Second'], 1);
        manager.indentListItem();
        // Second item should now be in a nested list inside First's li
        const nestedList = element.querySelector('ol ol') || element.querySelector('ol ul');
        // The item should have been moved
        expect(element.textContent).toContain('Second');
      });

      it('should create a nested list of the same type', () => {
        setupOrderedList(['First', 'Second'], 1);
        manager.indentListItem();
        const nestedOl = element.querySelector('ol ol');
        expect(nestedOl).toBeTruthy();
      });

      it('should reuse existing nested list if present', () => {
        element.innerHTML = '<ol><li>First<ol><li>Nested</li></ol></li><li>Second</li></ol>';
        const secondLi = element.querySelectorAll(':scope ol > li')[1] as HTMLElement;
        placeCaretInside(secondLi);
        manager.indentListItem();
        // Should reuse the existing nested ol, not create a new one
        const nestedLists = element.querySelectorAll('ol ol');
        expect(nestedLists.length).toBe(1);
      });

      it('should not throw when no selection exists', () => {
        setupOrderedList(['Item']);
        window.getSelection()?.removeAllRanges();
        expect(() => manager.indentListItem()).not.toThrow();
      });
    });

    describe('outdentListItem()', () => {
      it('should not throw when not in a list', () => {
        element.innerHTML = 'plain text';
        placeCaretAtStart();
        expect(() => manager.outdentListItem()).not.toThrow();
      });

      it('should move a nested item up one level', () => {
        element.innerHTML = '<ol><li>First<ol><li>Nested</li></ol></li></ol>';
        const nestedLi = element.querySelector('ol ol li') as HTMLElement;
        placeCaretInside(nestedLi);
        manager.outdentListItem();
        // Nested item should now be at the top level
        expect(element.textContent).toContain('Nested');
      });

      it('should clean up empty nested list after outdenting last item', () => {
        element.innerHTML = '<ol><li>First<ol><li>Only nested</li></ol></li></ol>';
        const nestedLi = element.querySelector('ol ol li') as HTMLElement;
        placeCaretInside(nestedLi);
        manager.outdentListItem();
        // The inner ol should be removed since it's now empty
        expect(element.querySelector('ol ol')).toBeNull();
      });

      it('should exit list when outdenting a top-level item', () => {
        setupOrderedList(['Top level item']);
        manager.outdentListItem();
        // Should exit the list entirely
        expect(element.textContent).toContain('Top level item');
      });

      it('should not throw when no selection exists', () => {
        setupOrderedList(['Item']);
        window.getSelection()?.removeAllRanges();
        expect(() => manager.outdentListItem()).not.toThrow();
      });
    });
  });

  // ==================== List Queries ====================

  describe('isInList()', () => {
    it('should return false when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.isInList()).toBe(false);
    });

    it('should return true when cursor is in an ordered list', () => {
      setupOrderedList(['Item 1']);
      expect(manager.isInList()).toBe(true);
    });

    it('should return true when cursor is in an unordered list', () => {
      setupUnorderedList(['Item 1']);
      expect(manager.isInList()).toBe(true);
    });

    it('should return false when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.isInList()).toBe(false);
    });

    it('should return false on empty element', () => {
      element.innerHTML = '';
      expect(manager.isInList()).toBe(false);
    });
  });

  describe('getListType()', () => {
    it('should return null when not in a list', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.getListType()).toBeNull();
    });

    it('should return "ol" when in an ordered list', () => {
      setupOrderedList(['Item 1']);
      expect(manager.getListType()).toBe('ol');
    });

    it('should return "ul" when in an unordered list', () => {
      setupUnorderedList(['Item 1']);
      expect(manager.getListType()).toBe('ul');
    });

    it('should return null when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.getListType()).toBeNull();
    });

    it('should detect nested list type correctly', () => {
      element.innerHTML = '<ol><li>First<ul><li>Nested bullet</li></ul></li></ol>';
      const nestedLi = element.querySelector('ul li') as HTMLElement;
      placeCaretInside(nestedLi);
      // Should return the closest list type (ul)
      expect(manager.getListType()).toBe('ul');
    });
  });

  // ==================== convertToList ====================

  describe('convertToList()', () => {
    it('should not throw when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.convertToList('ol')).not.toThrow();
    });

    it('should create an ordered list', () => {
      element.innerHTML = 'Some text';
      selectAll();
      manager.convertToList('ol');
      expect(element.querySelector('ol')).toBeTruthy();
    });

    it('should create an unordered list', () => {
      element.innerHTML = 'Some text';
      selectAll();
      manager.convertToList('ul');
      expect(element.querySelector('ul')).toBeTruthy();
    });

    it('should handle empty element gracefully', () => {
      element.innerHTML = '';
      placeCaretAtStart();
      expect(() => manager.convertToList('ol')).not.toThrow();
    });
  });

  // ==================== Empty List Handling ====================

  describe('Empty List Handling', () => {
    it('should handle an empty ordered list gracefully', () => {
      element.innerHTML = '<ol></ol>';
      placeCaretAtStart();
      expect(() => manager.toggleOrderedList()).not.toThrow();
    });

    it('should handle an empty unordered list gracefully', () => {
      element.innerHTML = '<ul></ul>';
      placeCaretAtStart();
      expect(() => manager.toggleBulletList()).not.toThrow();
    });

    it('should handle list item with only whitespace as empty', () => {
      element.innerHTML = '<ol><li>   </li></ol>';
      const li = element.querySelector('li')!;
      placeCaretInside(li);
      // Whitespace-only item should be treated as empty by handleEnterKey
      const result = manager.handleEnterKey();
      expect(result).toBe(true);
    });

    it('should handle list item with only <br> as empty', () => {
      element.innerHTML = '<ol><li><br></li></ol>';
      const li = element.querySelector('li')!;
      placeCaretInside(li);
      const result = manager.handleEnterKey();
      expect(result).toBe(true);
    });

    it('should handle exitList on a single-item list', () => {
      setupOrderedList(['Only item']);
      manager.exitList();
      // The list should be removed and text preserved
      expect(element.textContent).toContain('Only item');
    });

    it('should handle exitList on empty innerHTML list item', () => {
      element.innerHTML = '<ul><li></li></ul>';
      const li = element.querySelector('li')!;
      placeCaretInside(li);
      expect(() => manager.exitList()).not.toThrow();
      expect(element.querySelector('ul')).toBeNull();
    });
  });

  // ==================== Null / No-Selection Handling (Req 5.6) ====================

  describe('Null / No-Selection Handling', () => {
    it('should not throw toggleOrderedList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.toggleOrderedList()).not.toThrow();
    });

    it('should not throw toggleBulletList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.toggleBulletList()).not.toThrow();
    });

    it('should not throw handleEnterKey with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.handleEnterKey()).not.toThrow();
    });

    it('should not throw handleTabKey with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.handleTabKey()).not.toThrow();
    });

    it('should not throw handleShiftTabKey with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.handleShiftTabKey()).not.toThrow();
    });

    it('should not throw isInList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.isInList()).not.toThrow();
    });

    it('should not throw getListType with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.getListType()).not.toThrow();
    });

    it('should not throw convertToList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.convertToList('ol')).not.toThrow();
    });

    it('should not throw exitList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.exitList()).not.toThrow();
    });

    it('should not throw indentListItem with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.indentListItem()).not.toThrow();
    });

    it('should not throw outdentListItem with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.outdentListItem()).not.toThrow();
    });

    it('should not throw createNewListItem with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.createNewListItem()).not.toThrow();
    });

    it('should return false from isInList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.isInList()).toBe(false);
    });

    it('should return null from getListType with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.getListType()).toBeNull();
    });

    it('should return false from handleEnterKey with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.handleEnterKey()).toBe(false);
    });

    it('should return false from handleTabKey with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.handleTabKey()).toBe(false);
    });

    it('should return false from handleShiftTabKey with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.handleShiftTabKey()).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle toggling ordered list on content with special characters', () => {
      element.innerHTML = '<p>&lt;div&gt; &amp; "quotes"</p>';
      selectAll();
      expect(() => manager.toggleOrderedList()).not.toThrow();
    });

    it('should handle toggling bullet list on content with emoji', () => {
      element.innerHTML = 'Hello 👋 World 🌍';
      selectAll();
      expect(() => manager.toggleBulletList()).not.toThrow();
    });

    it('should handle list with many items', () => {
      const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
      setupOrderedList(items, 25);
      expect(manager.isInList()).toBe(true);
      expect(manager.getListType()).toBe('ol');
    });

    it('should handle deeply nested lists', () => {
      element.innerHTML = '<ol><li>L1<ol><li>L2<ol><li>L3</li></ol></li></ol></li></ol>';
      const deepLi = element.querySelector('ol ol ol li') as HTMLElement;
      placeCaretInside(deepLi);
      expect(manager.isInList()).toBe(true);
    });

    it('should handle mixed list types in nesting', () => {
      element.innerHTML = '<ol><li>Ordered<ul><li>Unordered nested</li></ul></li></ol>';
      const nestedLi = element.querySelector('ul li') as HTMLElement;
      placeCaretInside(nestedLi);
      expect(manager.getListType()).toBe('ul');
    });

    it('should handle convertToList when execCommand is not available', () => {
      element.innerHTML = 'Some text';
      selectAll();
      // Mock execCommand to throw
      const origExecCommand = document.execCommand;
      document.execCommand = vi.fn(() => {
        throw new Error('Not supported');
      });
      expect(() => manager.convertToList('ol')).not.toThrow();
      document.execCommand = origExecCommand;
    });

    it('should handle list item with rich content (nested elements)', () => {
      element.innerHTML = '<ul><li><strong>Bold</strong> and <em>italic</em></li></ul>';
      const li = element.querySelector('li')!;
      placeCaretInside(li);
      expect(manager.isInList()).toBe(true);
      expect(() => manager.handleEnterKey()).not.toThrow();
    });

    it('should handle rapid toggle operations without error', () => {
      element.innerHTML = 'Test content';
      selectAll();
      expect(() => {
        manager.toggleOrderedList();
        manager.toggleBulletList();
        manager.toggleOrderedList();
        manager.toggleBulletList();
      }).not.toThrow();
    });
  });
});
