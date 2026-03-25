/**
 * ListSelectionManager Unit Tests
 *
 * Tests for the ListSelectionManager class that handles list item selection with keyboard support.
 *
 * @module services/list-selection-manager.spec
 * @see Requirements 3.3-3.7, 5.3, 7.3, 9.3, 13.1-13.7
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ListSelectionManager, ListSelectionState } from './list-selection-manager.class';
import { SelectionMode } from '../Enums/Enums';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

// Test item type
interface TestItem {
  id: string;
  name: string;
}

// Helper to create test items
function createTestItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
  }));
}

// ID extractor function
const getId = (item: TestItem) => item.id;

describe('ListSelectionManager', () => {
  let items: TestItem[];

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    items = createTestItems(10);
  });

  describe('constructor', () => {
    it('should create instance with single selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      expect(manager.getMode()).toBe(SelectionMode.single);
      expect(manager.selectedCount()).toBe(0);
      expect(manager.hasSelection()).toBe(false);
    });

    it('should create instance with multiple selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(manager.getMode()).toBe(SelectionMode.multiple);
      expect(manager.selectedCount()).toBe(0);
      expect(manager.hasSelection()).toBe(false);
    });

    it('should create instance with none selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      expect(manager.getMode()).toBe(SelectionMode.none);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('toggleSelection (Space key behavior)', () => {
    describe('single selection mode', () => {
      let manager: ListSelectionManager<TestItem>;

      beforeEach(() => {
        manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      });

      /**
       * Requirement 13.1: Single selection mode allows only one item selected at a time
       */
      it('should select an item when not selected', () => {
        const result = manager.toggleSelection(items[0], 0);
        expect(result).toBe(true);
        expect(manager.isSelected(items[0])).toBe(true);
        expect(manager.selectedCount()).toBe(1);
      });

      /**
       * Requirement 13.3: Space on selected item deselects it
       */
      it('should deselect an item when already selected', () => {
        manager.toggleSelection(items[0], 0);
        const result = manager.toggleSelection(items[0], 0);
        expect(result).toBe(false);
        expect(manager.isSelected(items[0])).toBe(false);
        expect(manager.selectedCount()).toBe(0);
      });

      /**
       * Requirement 13.1: Single selection mode allows only one item selected at a time
       */
      it('should clear previous selection when selecting new item', () => {
        manager.toggleSelection(items[0], 0);
        manager.toggleSelection(items[1], 1);
        expect(manager.isSelected(items[0])).toBe(false);
        expect(manager.isSelected(items[1])).toBe(true);
        expect(manager.selectedCount()).toBe(1);
      });

      it('should update anchor index on toggle', () => {
        manager.toggleSelection(items[2], 2);
        expect(manager.getAnchorIndex()).toBe(2);
      });

      it('should update last selected index on toggle', () => {
        manager.toggleSelection(items[3], 3);
        expect(manager.getLastSelectedIndex()).toBe(3);
      });
    });

    describe('multiple selection mode', () => {
      let manager: ListSelectionManager<TestItem>;

      beforeEach(() => {
        manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      });

      /**
       * Requirement 13.2: Multiple selection mode allows multiple items selected
       */
      it('should select an item when not selected', () => {
        const result = manager.toggleSelection(items[0], 0);
        expect(result).toBe(true);
        expect(manager.isSelected(items[0])).toBe(true);
        expect(manager.selectedCount()).toBe(1);
      });

      /**
       * Requirement 13.3: Space on selected item deselects it
       */
      it('should deselect an item when already selected', () => {
        manager.toggleSelection(items[0], 0);
        const result = manager.toggleSelection(items[0], 0);
        expect(result).toBe(false);
        expect(manager.isSelected(items[0])).toBe(false);
        expect(manager.selectedCount()).toBe(0);
      });

      /**
       * Requirement 13.2: Multiple selection mode allows multiple items selected
       */
      it('should allow multiple items to be selected', () => {
        manager.toggleSelection(items[0], 0);
        manager.toggleSelection(items[1], 1);
        manager.toggleSelection(items[2], 2);
        expect(manager.isSelected(items[0])).toBe(true);
        expect(manager.isSelected(items[1])).toBe(true);
        expect(manager.isSelected(items[2])).toBe(true);
        expect(manager.selectedCount()).toBe(3);
      });

      it('should not affect other selections when toggling', () => {
        manager.toggleSelection(items[0], 0);
        manager.toggleSelection(items[1], 1);
        manager.toggleSelection(items[0], 0); // Deselect first
        expect(manager.isSelected(items[0])).toBe(false);
        expect(manager.isSelected(items[1])).toBe(true);
        expect(manager.selectedCount()).toBe(1);
      });
    });

    describe('none selection mode', () => {
      it('should not select anything in none mode', () => {
        const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
        const result = manager.toggleSelection(items[0], 0);
        expect(result).toBe(false);
        expect(manager.isSelected(items[0])).toBe(false);
        expect(manager.selectedCount()).toBe(0);
      });
    });
  });

  describe('extendSelection (Shift+Arrow behavior)', () => {
    /**
     * Requirements 3.4, 3.5: Shift+ArrowDown/Up extends selection to include next/previous item
     */
    describe('multiple selection mode', () => {
      let manager: ListSelectionManager<TestItem>;

      beforeEach(() => {
        manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      });

      it('should add item to selection', () => {
        manager.toggleSelection(items[0], 0);
        manager.extendSelection(items[1], 1);
        expect(manager.isSelected(items[0])).toBe(true);
        expect(manager.isSelected(items[1])).toBe(true);
        expect(manager.selectedCount()).toBe(2);
      });

      it('should extend selection to multiple items', () => {
        manager.toggleSelection(items[0], 0);
        manager.extendSelection(items[1], 1);
        manager.extendSelection(items[2], 2);
        manager.extendSelection(items[3], 3);
        expect(manager.selectedCount()).toBe(4);
      });

      it('should update last selected index', () => {
        manager.extendSelection(items[5], 5);
        expect(manager.getLastSelectedIndex()).toBe(5);
      });

      it('should not remove existing selections', () => {
        manager.toggleSelection(items[0], 0);
        manager.toggleSelection(items[5], 5);
        manager.extendSelection(items[2], 2);
        expect(manager.isSelected(items[0])).toBe(true);
        expect(manager.isSelected(items[5])).toBe(true);
        expect(manager.isSelected(items[2])).toBe(true);
      });
    });

    it('should do nothing in single selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.toggleSelection(items[0], 0);
      manager.extendSelection(items[1], 1);
      expect(manager.isSelected(items[0])).toBe(true);
      expect(manager.isSelected(items[1])).toBe(false);
      expect(manager.selectedCount()).toBe(1);
    });

    it('should do nothing in none selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      manager.extendSelection(items[0], 0);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('selectRange (Shift+Space behavior)', () => {
    /**
     * Requirement 13.4: Shift+Space selects all items between last selected and current
     */
    describe('multiple selection mode', () => {
      let manager: ListSelectionManager<TestItem>;

      beforeEach(() => {
        manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      });

      it('should select range from anchor to current index (forward)', () => {
        manager.toggleSelection(items[2], 2); // Sets anchor to 2
        manager.selectRange(items, 5);
        expect(manager.isSelected(items[2])).toBe(true);
        expect(manager.isSelected(items[3])).toBe(true);
        expect(manager.isSelected(items[4])).toBe(true);
        expect(manager.isSelected(items[5])).toBe(true);
        expect(manager.selectedCount()).toBe(4);
      });

      it('should select range from anchor to current index (backward)', () => {
        manager.toggleSelection(items[5], 5); // Sets anchor to 5
        manager.selectRange(items, 2);
        expect(manager.isSelected(items[2])).toBe(true);
        expect(manager.isSelected(items[3])).toBe(true);
        expect(manager.isSelected(items[4])).toBe(true);
        expect(manager.isSelected(items[5])).toBe(true);
        expect(manager.selectedCount()).toBe(4);
      });

      it('should preserve existing selections outside range', () => {
        manager.toggleSelection(items[0], 0);
        manager.setAnchorIndex(2);
        manager.selectRange(items, 4);
        expect(manager.isSelected(items[0])).toBe(true);
        expect(manager.isSelected(items[2])).toBe(true);
        expect(manager.isSelected(items[3])).toBe(true);
        expect(manager.isSelected(items[4])).toBe(true);
      });

      it('should toggle selection if no anchor is set', () => {
        manager.selectRange(items, 3);
        expect(manager.isSelected(items[3])).toBe(true);
        expect(manager.selectedCount()).toBe(1);
      });

      it('should handle same anchor and current index', () => {
        manager.toggleSelection(items[3], 3);
        manager.selectRange(items, 3);
        expect(manager.isSelected(items[3])).toBe(true);
        expect(manager.selectedCount()).toBe(1);
      });
    });

    it('should do nothing in single selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.toggleSelection(items[2], 2);
      manager.selectRange(items, 5);
      expect(manager.selectedCount()).toBe(1);
      expect(manager.isSelected(items[2])).toBe(true);
    });

    it('should do nothing in none selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      manager.selectRange(items, 5);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('selectAll (Ctrl/Cmd+A behavior)', () => {
    /**
     * Requirement 3.6: Ctrl+A (or Cmd+A on Mac) selects all items
     */
    it('should select all items in multiple selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.selectAll(items);
      expect(manager.selectedCount()).toBe(10);
      items.forEach(item => {
        expect(manager.isSelected(item)).toBe(true);
      });
    });

    it('should do nothing in single selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.selectAll(items);
      expect(manager.selectedCount()).toBe(0);
    });

    it('should do nothing in none selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      manager.selectAll(items);
      expect(manager.selectedCount()).toBe(0);
    });

    it('should handle empty items array', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.selectAll([]);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('clearSelection (Escape behavior)', () => {
    /**
     * Requirement 3.7: Escape clears all selections
     */
    it('should clear all selections', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[1], 1);
      manager.toggleSelection(items[2], 2);
      expect(manager.selectedCount()).toBe(3);

      manager.clearSelection();
      expect(manager.selectedCount()).toBe(0);
      expect(manager.hasSelection()).toBe(false);
    });

    it('should reset anchor index', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[5], 5);
      expect(manager.getAnchorIndex()).toBe(5);

      manager.clearSelection();
      expect(manager.getAnchorIndex()).toBe(-1);
    });

    it('should reset last selected index', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[3], 3);
      expect(manager.getLastSelectedIndex()).toBe(3);

      manager.clearSelection();
      expect(manager.getLastSelectedIndex()).toBe(-1);
    });

    it('should work in single selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.toggleSelection(items[0], 0);
      manager.clearSelection();
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('isSelected', () => {
    it('should return true for selected items', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      expect(manager.isSelected(items[0])).toBe(true);
    });

    it('should return false for unselected items', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      expect(manager.isSelected(items[1])).toBe(false);
    });
  });

  describe('isSelectedById', () => {
    it('should return true for selected item IDs', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      expect(manager.isSelectedById('item-0')).toBe(true);
    });

    it('should return false for unselected item IDs', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(manager.isSelectedById('item-0')).toBe(false);
    });
  });

  describe('getSelectionState', () => {
    /**
     * Requirement 13.5: Emit selectionChange event with current selection state
     */
    it('should return current selection state', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[2], 2);

      const state: ListSelectionState = manager.getSelectionState();
      expect(state.mode).toBe(SelectionMode.multiple);
      expect(state.selectedIds.size).toBe(2);
      expect(state.selectedIds.has('item-0')).toBe(true);
      expect(state.selectedIds.has('item-2')).toBe(true);
      expect(state.anchorIndex).toBe(2);
    });

    it('should return empty state when nothing selected', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      const state = manager.getSelectionState();
      expect(state.mode).toBe(SelectionMode.single);
      expect(state.selectedIds.size).toBe(0);
      expect(state.anchorIndex).toBe(-1);
    });
  });

  describe('getSelectedIdsArray', () => {
    it('should return array of selected IDs', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[2], 2);
      manager.toggleSelection(items[4], 4);

      const ids = manager.getSelectedIdsArray();
      expect(ids).toHaveLength(3);
      expect(ids).toContain('item-0');
      expect(ids).toContain('item-2');
      expect(ids).toContain('item-4');
    });

    it('should return empty array when nothing selected', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(manager.getSelectedIdsArray()).toEqual([]);
    });
  });

  describe('setMode', () => {
    it('should change selection mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.setMode(SelectionMode.multiple);
      expect(manager.getMode()).toBe(SelectionMode.multiple);
    });

    it('should clear selection when changing from multiple to single with multiple selected', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[1], 1);
      manager.toggleSelection(items[2], 2);

      manager.setMode(SelectionMode.single);
      expect(manager.selectedCount()).toBe(0);
    });

    it('should preserve single selection when changing from multiple to single', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);

      manager.setMode(SelectionMode.single);
      expect(manager.selectedCount()).toBe(1);
      expect(manager.isSelected(items[0])).toBe(true);
    });

    it('should clear selection when changing to none mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[1], 1);

      manager.setMode(SelectionMode.none);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('select', () => {
    it('should select item without toggling in single mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.select(items[0], 0);
      expect(manager.isSelected(items[0])).toBe(true);

      // Selecting again should not deselect
      manager.select(items[0], 0);
      expect(manager.isSelected(items[0])).toBe(true);
    });

    it('should replace selection in single mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.select(items[0], 0);
      manager.select(items[1], 1);
      expect(manager.isSelected(items[0])).toBe(false);
      expect(manager.isSelected(items[1])).toBe(true);
    });

    it('should add to selection in multiple mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.select(items[0], 0);
      manager.select(items[1], 1);
      expect(manager.isSelected(items[0])).toBe(true);
      expect(manager.isSelected(items[1])).toBe(true);
    });

    it('should do nothing in none mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      manager.select(items[0], 0);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('deselect', () => {
    it('should deselect item', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[1], 1);

      manager.deselect(items[0]);
      expect(manager.isSelected(items[0])).toBe(false);
      expect(manager.isSelected(items[1])).toBe(true);
    });

    it('should do nothing if item not selected', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.deselect(items[0]);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('deselectById', () => {
    it('should deselect item by ID', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[1], 1);

      manager.deselectById('item-0');
      expect(manager.isSelectedById('item-0')).toBe(false);
      expect(manager.isSelectedById('item-1')).toBe(true);
    });
  });

  describe('setSelection', () => {
    it('should set selection to specific items in multiple mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.setSelection([items[1], items[3], items[5]]);
      expect(manager.selectedCount()).toBe(3);
      expect(manager.isSelected(items[1])).toBe(true);
      expect(manager.isSelected(items[3])).toBe(true);
      expect(manager.isSelected(items[5])).toBe(true);
    });

    it('should only select first item in single mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.setSelection([items[1], items[3], items[5]]);
      expect(manager.selectedCount()).toBe(1);
      expect(manager.isSelected(items[1])).toBe(true);
    });

    it('should do nothing in none mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      manager.setSelection([items[1], items[3]]);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('setSelectionByIds', () => {
    it('should set selection by IDs in multiple mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.setSelectionByIds(['item-1', 'item-3', 'item-5']);
      expect(manager.selectedCount()).toBe(3);
      expect(manager.isSelectedById('item-1')).toBe(true);
      expect(manager.isSelectedById('item-3')).toBe(true);
      expect(manager.isSelectedById('item-5')).toBe(true);
    });

    it('should only select first ID in single mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.setSelectionByIds(['item-1', 'item-3', 'item-5']);
      expect(manager.selectedCount()).toBe(1);
      expect(manager.isSelectedById('item-1')).toBe(true);
    });

    it('should do nothing in none mode', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      manager.setSelectionByIds(['item-1', 'item-3']);
      expect(manager.selectedCount()).toBe(0);
    });
  });

  describe('setAnchorIndex / getAnchorIndex', () => {
    it('should set and get anchor index', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.setAnchorIndex(5);
      expect(manager.getAnchorIndex()).toBe(5);
    });

    it('should default anchor index to -1', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(manager.getAnchorIndex()).toBe(-1);
    });

    it('should allow overwriting anchor index', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.setAnchorIndex(3);
      manager.setAnchorIndex(7);
      expect(manager.getAnchorIndex()).toBe(7);
    });
  });

  describe('empty list handling', () => {
    it('selectRange should handle empty items array gracefully', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.setAnchorIndex(0);
      manager.selectRange([], 0);
      expect(manager.selectedCount()).toBe(0);
    });

    it('setSelection should handle empty items array', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.setSelection([]);
      expect(manager.selectedCount()).toBe(0);
    });

    it('setSelectionByIds should handle empty IDs array', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      manager.setSelectionByIds([]);
      expect(manager.selectedCount()).toBe(0);
    });

    it('clearSelection on already empty selection should not throw', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(() => manager.clearSelection()).not.toThrow();
      expect(manager.selectedCount()).toBe(0);
    });

    it('clearSelection in none mode should not throw', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      expect(() => manager.clearSelection()).not.toThrow();
    });
  });

  describe('boundary and edge case inputs', () => {
    it('selectRange should clamp out-of-bounds indices', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.setAnchorIndex(0);
      // currentIndex beyond array length — should not throw, only selects valid indices
      manager.selectRange(items, 100);
      // Should select from 0 to 9 (all valid items)
      expect(manager.selectedCount()).toBe(10);
    });

    it('selectRange with negative currentIndex and valid anchor should not throw', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.setAnchorIndex(3);
      expect(() => manager.selectRange(items, -1)).not.toThrow();
    });

    it('selectRange with no anchor and out-of-bounds index should not throw', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(() => manager.selectRange(items, 999)).not.toThrow();
      expect(manager.selectedCount()).toBe(0);
    });

    it('select should update tracking indices', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.select(items[7], 7);
      expect(manager.getLastSelectedIndex()).toBe(7);
      expect(manager.getAnchorIndex()).toBe(7);
    });

    it('toggleSelection should track lastSelectedId as null on deselect', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.toggleSelection(items[0], 0);
      manager.toggleSelection(items[0], 0); // deselect
      const state = manager.getSelectionState();
      expect(state.lastSelectedId).toBeNull();
    });

    it('getSelectionState should return a defensive copy of selectedIds', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);
      const state = manager.getSelectionState();
      state.selectedIds.add('injected-id');
      expect(manager.isSelectedById('injected-id')).toBe(false);
    });

    it('deselectById with non-existent ID should not throw', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(() => manager.deselectById('non-existent')).not.toThrow();
      expect(manager.selectedCount()).toBe(0);
    });

    it('isSelectedById with non-existent ID should return false', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(manager.isSelectedById('does-not-exist')).toBe(false);
    });

    it('setMode from single to multiple should preserve existing selection', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.toggleSelection(items[0], 0);
      manager.setMode(SelectionMode.multiple);
      expect(manager.isSelected(items[0])).toBe(true);
      // Now should allow multiple
      manager.toggleSelection(items[1], 1);
      expect(manager.selectedCount()).toBe(2);
    });

    it('setMode from none to multiple should allow selections', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.none, getId);
      manager.setMode(SelectionMode.multiple);
      manager.toggleSelection(items[0], 0);
      expect(manager.isSelected(items[0])).toBe(true);
    });

    it('setSelection with single item in single mode should work', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.setSelection([items[3]]);
      expect(manager.selectedCount()).toBe(1);
      expect(manager.isSelected(items[3])).toBe(true);
    });

    it('setSelectionByIds with single ID in single mode should work', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.single, getId);
      manager.setSelectionByIds(['item-4']);
      expect(manager.selectedCount()).toBe(1);
      expect(manager.isSelectedById('item-4')).toBe(true);
    });
  });

  describe('computed signals', () => {
    it('selectedCount should update reactively', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(manager.selectedCount()).toBe(0);

      manager.toggleSelection(items[0], 0);
      expect(manager.selectedCount()).toBe(1);

      manager.toggleSelection(items[1], 1);
      expect(manager.selectedCount()).toBe(2);

      manager.toggleSelection(items[0], 0);
      expect(manager.selectedCount()).toBe(1);
    });

    it('hasSelection should update reactively', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      expect(manager.hasSelection()).toBe(false);

      manager.toggleSelection(items[0], 0);
      expect(manager.hasSelection()).toBe(true);

      manager.clearSelection();
      expect(manager.hasSelection()).toBe(false);
    });

    it('selectedIds should return a new set that does not affect internal state', () => {
      const manager = new ListSelectionManager<TestItem>(SelectionMode.multiple, getId);
      manager.toggleSelection(items[0], 0);

      const ids = manager.selectedIds();
      expect(ids.has('item-0')).toBe(true);

      // Modifying the returned set should not affect internal state
      ids.add('item-999');
      expect(manager.isSelectedById('item-999')).toBe(false);
      expect(manager.selectedCount()).toBe(1);
    });
  });
});
