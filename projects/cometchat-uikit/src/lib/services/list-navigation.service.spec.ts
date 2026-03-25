import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ListNavigationService, ListNavigationConfig } from './list-navigation.service';
import { createKeyboardEvent } from '../testing/accessibility-test-utils';

describe('ListNavigationService', () => {
  let service: ListNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListNavigationService);
  });

  // ============================================================
  // Service Creation (Requirement 5.1)
  // ============================================================
  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ============================================================
  // handleKeyNavigation - ArrowDown (Requirement 5.1, 5.4)
  // ============================================================
  describe('handleKeyNavigation', () => {
    describe('ArrowDown navigation', () => {
      it('should move to next item on ArrowDown', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = { itemCount: 5 };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(1);
      });

      it('should move through middle items sequentially', () => {
        const config: ListNavigationConfig = { itemCount: 5 };

        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 1, config)).toBe(2);
        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 2, config)).toBe(3);
        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 3, config)).toBe(4);
      });

      it('should wrap to first item when at last item with wrap enabled', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = { itemCount: 5, wrap: true };

        const result = service.handleKeyNavigation(event, 4, config);

        expect(result).toBe(0);
      });

      it('should stay at last item when at last item with wrap disabled', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = { itemCount: 5, wrap: false };

        const result = service.handleKeyNavigation(event, 4, config);

        expect(result).toBe(4);
      });

      it('should default wrap to true when not specified', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = { itemCount: 3 };

        const result = service.handleKeyNavigation(event, 2, config);

        expect(result).toBe(0);
      });
    });

    // ============================================================
    // handleKeyNavigation - ArrowUp (Requirement 5.1, 5.4)
    // ============================================================
    describe('ArrowUp navigation', () => {
      it('should move to previous item on ArrowUp', () => {
        const event = createKeyboardEvent('ArrowUp');
        const config: ListNavigationConfig = { itemCount: 5 };

        const result = service.handleKeyNavigation(event, 2, config);

        expect(result).toBe(1);
      });

      it('should move through middle items sequentially', () => {
        const config: ListNavigationConfig = { itemCount: 5 };

        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowUp'), 4, config)).toBe(3);
        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowUp'), 3, config)).toBe(2);
        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowUp'), 2, config)).toBe(1);
      });

      it('should wrap to last item when at first item with wrap enabled', () => {
        const event = createKeyboardEvent('ArrowUp');
        const config: ListNavigationConfig = { itemCount: 5, wrap: true };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(4);
      });

      it('should stay at first item when at first item with wrap disabled', () => {
        const event = createKeyboardEvent('ArrowUp');
        const config: ListNavigationConfig = { itemCount: 5, wrap: false };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(0);
      });

      it('should default wrap to true when not specified', () => {
        const event = createKeyboardEvent('ArrowUp');
        const config: ListNavigationConfig = { itemCount: 3 };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(2);
      });
    });

    // ============================================================
    // handleKeyNavigation - Home/End (Requirement 5.4)
    // ============================================================
    describe('Home key navigation', () => {
      it('should move to first item on Home', () => {
        const event = createKeyboardEvent('Home');
        const config: ListNavigationConfig = { itemCount: 5 };

        const result = service.handleKeyNavigation(event, 3, config);

        expect(result).toBe(0);
      });

      it('should return 0 when already at first item', () => {
        const event = createKeyboardEvent('Home');
        const config: ListNavigationConfig = { itemCount: 5 };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(0);
      });
    });

    describe('End key navigation', () => {
      it('should move to last item on End', () => {
        const event = createKeyboardEvent('End');
        const config: ListNavigationConfig = { itemCount: 5 };

        const result = service.handleKeyNavigation(event, 1, config);

        expect(result).toBe(4);
      });

      it('should return last index when already at last item', () => {
        const event = createKeyboardEvent('End');
        const config: ListNavigationConfig = { itemCount: 5 };

        const result = service.handleKeyNavigation(event, 4, config);

        expect(result).toBe(4);
      });
    });

    // ============================================================
    // handleKeyNavigation - preventDefault (Requirement 5.4)
    // ============================================================
    describe('event.preventDefault', () => {
      it('should call preventDefault on ArrowDown', () => {
        const event = createKeyboardEvent('ArrowDown');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyNavigation(event, 0, { itemCount: 5 });
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault on ArrowUp', () => {
        const event = createKeyboardEvent('ArrowUp');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyNavigation(event, 2, { itemCount: 5 });
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault on Home', () => {
        const event = createKeyboardEvent('Home');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyNavigation(event, 2, { itemCount: 5 });
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault on End', () => {
        const event = createKeyboardEvent('End');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyNavigation(event, 2, { itemCount: 5 });
        expect(spy).toHaveBeenCalled();
      });

      it('should NOT call preventDefault on unhandled keys', () => {
        const event = createKeyboardEvent('Enter');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyNavigation(event, 0, { itemCount: 5 });
        expect(spy).not.toHaveBeenCalled();
      });
    });

    // ============================================================
    // handleKeyNavigation - Disabled Items (Requirement 5.4)
    // ============================================================
    describe('disabled item skipping', () => {
      it('should skip disabled items when navigating down', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = {
          itemCount: 5,
          isDisabled: index => index === 1,
        };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(2);
      });

      it('should skip disabled items when navigating up', () => {
        const event = createKeyboardEvent('ArrowUp');
        const config: ListNavigationConfig = {
          itemCount: 5,
          isDisabled: index => index === 1,
        };

        const result = service.handleKeyNavigation(event, 2, config);

        expect(result).toBe(0);
      });

      it('should skip multiple consecutive disabled items', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = {
          itemCount: 5,
          isDisabled: index => index === 1 || index === 2,
        };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(3);
      });

      it('should skip disabled items on Home key', () => {
        const event = createKeyboardEvent('Home');
        const config: ListNavigationConfig = {
          itemCount: 5,
          isDisabled: index => index === 0,
        };

        const result = service.handleKeyNavigation(event, 3, config);

        expect(result).toBe(1);
      });

      it('should skip disabled items on End key', () => {
        const event = createKeyboardEvent('End');
        const config: ListNavigationConfig = {
          itemCount: 5,
          isDisabled: index => index === 4,
        };

        const result = service.handleKeyNavigation(event, 1, config);

        expect(result).toBe(3);
      });

      it('should wrap around disabled items at boundary when navigating down', () => {
        const config: ListNavigationConfig = {
          itemCount: 4,
          wrap: true,
          isDisabled: index => index === 0,
        };

        // At index 3 (last), ArrowDown wraps to 0 (disabled), should skip to 1
        const result = service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 3, config);
        expect(result).toBe(1);
      });

      it('should wrap around disabled items at boundary when navigating up', () => {
        const config: ListNavigationConfig = {
          itemCount: 4,
          wrap: true,
          isDisabled: index => index === 3,
        };

        // At index 0 (first), ArrowUp wraps to 3 (disabled), should skip to 2
        const result = service.handleKeyNavigation(createKeyboardEvent('ArrowUp'), 0, config);
        expect(result).toBe(2);
      });

      it('should handle all items disabled (returns to start index)', () => {
        const config: ListNavigationConfig = {
          itemCount: 3,
          wrap: true,
          isDisabled: () => true,
        };

        // All disabled → loops back to startIndex
        const result = service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 0, config);
        // The loop will cycle through all items and return to startIndex
        expect(result).toBe(1);
      });

      it('should clamp disabled items with wrap=false on ArrowDown', () => {
        const config: ListNavigationConfig = {
          itemCount: 4,
          wrap: false,
          isDisabled: index => index === 3,
        };

        // At index 2, ArrowDown → 3 (disabled), no wrap, clamps to 3 but still disabled
        // The loop will try to skip forward but clamp at boundary
        const result = service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 2, config);
        expect(result).toBe(3);
      });
    });

    // ============================================================
    // handleKeyNavigation - Edge Cases (Requirement 5.6)
    // ============================================================
    describe('edge cases', () => {
      it('should return -1 for empty list', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = { itemCount: 0 };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(-1);
      });

      it('should return -1 for empty list with ArrowUp', () => {
        const event = createKeyboardEvent('ArrowUp');
        const config: ListNavigationConfig = { itemCount: 0 };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(-1);
      });

      it('should return -1 for empty list with Home', () => {
        const event = createKeyboardEvent('Home');
        const config: ListNavigationConfig = { itemCount: 0 };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(-1);
      });

      it('should return -1 for empty list with End', () => {
        const event = createKeyboardEvent('End');
        const config: ListNavigationConfig = { itemCount: 0 };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(-1);
      });

      it('should return -1 for unhandled keys', () => {
        const config: ListNavigationConfig = { itemCount: 5 };

        expect(service.handleKeyNavigation(createKeyboardEvent('Enter'), 0, config)).toBe(-1);
        expect(service.handleKeyNavigation(createKeyboardEvent('Escape'), 0, config)).toBe(-1);
        expect(service.handleKeyNavigation(createKeyboardEvent('Tab'), 0, config)).toBe(-1);
        expect(service.handleKeyNavigation(createKeyboardEvent('a'), 0, config)).toBe(-1);
      });

      it('should handle single item list with ArrowDown (wraps to self)', () => {
        const event = createKeyboardEvent('ArrowDown');
        const config: ListNavigationConfig = { itemCount: 1, wrap: true };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(0);
      });

      it('should handle single item list with ArrowUp (wraps to self)', () => {
        const event = createKeyboardEvent('ArrowUp');
        const config: ListNavigationConfig = { itemCount: 1, wrap: true };

        const result = service.handleKeyNavigation(event, 0, config);

        expect(result).toBe(0);
      });

      it('should handle two-item list navigation', () => {
        const config: ListNavigationConfig = { itemCount: 2, wrap: true };

        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 0, config)).toBe(1);
        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowDown'), 1, config)).toBe(0);
        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowUp'), 0, config)).toBe(1);
        expect(service.handleKeyNavigation(createKeyboardEvent('ArrowUp'), 1, config)).toBe(0);
      });

      it('should handle Home and End on single item list', () => {
        const config: ListNavigationConfig = { itemCount: 1 };

        expect(service.handleKeyNavigation(createKeyboardEvent('Home'), 0, config)).toBe(0);
        expect(service.handleKeyNavigation(createKeyboardEvent('End'), 0, config)).toBe(0);
      });
    });
  });

  // ============================================================
  // getItemTabIndex - Focus Management (Requirement 5.4)
  // ============================================================
  describe('getItemTabIndex', () => {
    it('should return 0 for focused item', () => {
      expect(service.getItemTabIndex(2, 2)).toBe(0);
    });

    it('should return -1 for non-focused items', () => {
      expect(service.getItemTabIndex(0, 2)).toBe(-1);
      expect(service.getItemTabIndex(1, 2)).toBe(-1);
      expect(service.getItemTabIndex(3, 2)).toBe(-1);
    });

    it('should return 0 for index 0 when focusedIndex is 0', () => {
      expect(service.getItemTabIndex(0, 0)).toBe(0);
    });

    it('should return -1 when focusedIndex is out of range', () => {
      // focusedIndex beyond list size — no item should be 0
      expect(service.getItemTabIndex(0, 99)).toBe(-1);
      expect(service.getItemTabIndex(1, 99)).toBe(-1);
    });

    it('should return -1 for negative index', () => {
      expect(service.getItemTabIndex(-1, 0)).toBe(-1);
    });
  });

  // ============================================================
  // getRovingTabindexMap - Focus Management (Requirement 5.4, 5.6)
  // ============================================================
  describe('getRovingTabindexMap', () => {
    it('should return map with correct tabindex values', () => {
      const map = service.getRovingTabindexMap(5, 2);

      expect(map.size).toBe(5);
      expect(map.get(0)).toBe(-1);
      expect(map.get(1)).toBe(-1);
      expect(map.get(2)).toBe(0);
      expect(map.get(3)).toBe(-1);
      expect(map.get(4)).toBe(-1);
    });

    it('should handle first item focused', () => {
      const map = service.getRovingTabindexMap(3, 0);

      expect(map.get(0)).toBe(0);
      expect(map.get(1)).toBe(-1);
      expect(map.get(2)).toBe(-1);
    });

    it('should handle last item focused', () => {
      const map = service.getRovingTabindexMap(3, 2);

      expect(map.get(0)).toBe(-1);
      expect(map.get(1)).toBe(-1);
      expect(map.get(2)).toBe(0);
    });

    it('should return empty map for zero items', () => {
      const map = service.getRovingTabindexMap(0, 0);

      expect(map.size).toBe(0);
    });

    it('should handle single item list', () => {
      const map = service.getRovingTabindexMap(1, 0);

      expect(map.size).toBe(1);
      expect(map.get(0)).toBe(0);
    });

    it('should set all items to -1 when focusedIndex is out of range', () => {
      const map = service.getRovingTabindexMap(3, 99);

      expect(map.size).toBe(3);
      expect(map.get(0)).toBe(-1);
      expect(map.get(1)).toBe(-1);
      expect(map.get(2)).toBe(-1);
    });

    it('should set all items to -1 when focusedIndex is negative', () => {
      const map = service.getRovingTabindexMap(3, -1);

      expect(map.size).toBe(3);
      expect(map.get(0)).toBe(-1);
      expect(map.get(1)).toBe(-1);
      expect(map.get(2)).toBe(-1);
    });
  });
});
