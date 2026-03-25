/**
 * GridNavigationService Tests
 *
 * Categories: Service Creation, indexToPosition, positionToIndex, getRowCol,
 *             getIndex, getItemTabIndex, Arrow Key Navigation, Home/End,
 *             Boundary Wrapping, Empty/Null Grid, Disabled Items
 *
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 10.4, 14.4, 14.5, 15.7
 *
 * @module services/grid-navigation
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { GridNavigationService, GridNavigationConfig } from './grid-navigation.service';

describe('GridNavigationService', () => {
  let service: GridNavigationService;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GridNavigationService],
    });
    service = TestBed.inject(GridNavigationService);
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
  // indexToPosition (Requirement 5.4)
  // ============================================================
  describe('indexToPosition', () => {
    it('should convert index 0 to row 0, column 0', () => {
      const pos = service.indexToPosition(0, 4);
      expect(pos).toEqual({ row: 0, column: 0, index: 0 });
    });

    it('should convert index within first row', () => {
      const pos = service.indexToPosition(3, 4);
      expect(pos).toEqual({ row: 0, column: 3, index: 3 });
    });

    it('should convert index at start of second row', () => {
      const pos = service.indexToPosition(4, 4);
      expect(pos).toEqual({ row: 1, column: 0, index: 4 });
    });

    it('should convert index in middle of grid', () => {
      const pos = service.indexToPosition(7, 3);
      expect(pos).toEqual({ row: 2, column: 1, index: 7 });
    });

    it('should handle single-column grid', () => {
      const pos = service.indexToPosition(5, 1);
      expect(pos).toEqual({ row: 5, column: 0, index: 5 });
    });
  });

  // ============================================================
  // positionToIndex (Requirement 5.4)
  // ============================================================
  describe('positionToIndex', () => {
    it('should convert row 0, column 0 to index 0', () => {
      expect(service.positionToIndex(0, 0, 4)).toBe(0);
    });

    it('should convert first row positions correctly', () => {
      expect(service.positionToIndex(0, 3, 4)).toBe(3);
    });

    it('should convert second row start correctly', () => {
      expect(service.positionToIndex(1, 0, 4)).toBe(4);
    });

    it('should convert arbitrary position correctly', () => {
      expect(service.positionToIndex(2, 1, 3)).toBe(7);
    });

    it('should be inverse of indexToPosition', () => {
      const pos = service.indexToPosition(11, 5);
      expect(service.positionToIndex(pos.row, pos.column, 5)).toBe(11);
    });
  });

  // ============================================================
  // getRowCol (Requirement 5.4)
  // ============================================================
  describe('getRowCol', () => {
    it('should return row and col for index 0', () => {
      expect(service.getRowCol(0, 4)).toEqual({ row: 0, col: 0 });
    });

    it('should return correct row and col for arbitrary index', () => {
      expect(service.getRowCol(7, 3)).toEqual({ row: 2, col: 1 });
    });

    it('should handle single-column grid', () => {
      expect(service.getRowCol(3, 1)).toEqual({ row: 3, col: 0 });
    });
  });

  // ============================================================
  // getIndex (Requirement 5.4)
  // ============================================================
  describe('getIndex', () => {
    it('should return 0 for row 0, col 0', () => {
      expect(service.getIndex(0, 0, 4)).toBe(0);
    });

    it('should return correct index for arbitrary position', () => {
      expect(service.getIndex(2, 1, 3)).toBe(7);
    });

    it('should be inverse of getRowCol', () => {
      const { row, col } = service.getRowCol(9, 4);
      expect(service.getIndex(row, col, 4)).toBe(9);
    });
  });

  // ============================================================
  // getItemTabIndex (Requirement 5.4)
  // ============================================================
  describe('getItemTabIndex', () => {
    it('should return 0 when index matches focusedIndex', () => {
      expect(service.getItemTabIndex(3, 3)).toBe(0);
    });

    it('should return -1 when index does not match focusedIndex', () => {
      expect(service.getItemTabIndex(2, 3)).toBe(-1);
    });

    it('should return 0 for index 0 when focusedIndex is 0', () => {
      expect(service.getItemTabIndex(0, 0)).toBe(0);
    });
  });

  // ============================================================
  // handleKeyNavigation - Arrow Keys (Requirement 5.1, 5.4)
  // ============================================================
  describe('handleKeyNavigation - Arrow Keys', () => {
    const config: GridNavigationConfig = {
      rowCount: 3,
      columnCount: 4,
      totalItems: 12,
      wrap: true,
    };

    function makeKeyEvent(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
      return new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...opts,
      });
    }

    describe('ArrowRight', () => {
      it('should move to next column', () => {
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowRight'), 0, config);
        expect(result).toBe(1);
      });

      it('should wrap to first column when at last column with wrap=true', () => {
        // index 3 is row 0, col 3 (last column in 4-col grid)
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowRight'), 3, config);
        expect(result).toBe(0);
      });

      it('should stay at last column when at last column with wrap=false', () => {
        const noWrapConfig = { ...config, wrap: false };
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowRight'), 3, noWrapConfig);
        expect(result).toBe(3);
      });
    });

    describe('ArrowLeft', () => {
      it('should move to previous column', () => {
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowLeft'), 2, config);
        expect(result).toBe(1);
      });

      it('should wrap to last column when at first column with wrap=true', () => {
        // index 0 is row 0, col 0
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowLeft'), 0, config);
        expect(result).toBe(3);
      });

      it('should stay at first column when at first column with wrap=false', () => {
        const noWrapConfig = { ...config, wrap: false };
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowLeft'), 0, noWrapConfig);
        expect(result).toBe(0);
      });
    });

    describe('ArrowDown', () => {
      it('should move to next row', () => {
        // index 1 is row 0, col 1 → row 1, col 1 = index 5
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 1, config);
        expect(result).toBe(5);
      });

      it('should wrap to first row when at last row with wrap=true', () => {
        // index 9 is row 2, col 1 → wrap to row 0, col 1 = index 1
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 9, config);
        expect(result).toBe(1);
      });

      it('should stay at last row when at last row with wrap=false', () => {
        const noWrapConfig = { ...config, wrap: false };
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 9, noWrapConfig);
        expect(result).toBe(9);
      });
    });

    describe('ArrowUp', () => {
      it('should move to previous row', () => {
        // index 5 is row 1, col 1 → row 0, col 1 = index 1
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowUp'), 5, config);
        expect(result).toBe(1);
      });

      it('should wrap to last row when at first row with wrap=true', () => {
        // index 1 is row 0, col 1 → wrap to row 2, col 1 = index 9
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowUp'), 1, config);
        expect(result).toBe(9);
      });

      it('should stay at first row when at first row with wrap=false', () => {
        const noWrapConfig = { ...config, wrap: false };
        const result = service.handleKeyNavigation(makeKeyEvent('ArrowUp'), 1, noWrapConfig);
        expect(result).toBe(1);
      });
    });
  });

  // ============================================================
  // handleKeyNavigation - Home/End (Requirement 5.4)
  // ============================================================
  describe('handleKeyNavigation - Home/End', () => {
    const config: GridNavigationConfig = {
      rowCount: 3,
      columnCount: 4,
      totalItems: 12,
      wrap: true,
    };

    function makeKeyEvent(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
      return new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...opts,
      });
    }

    it('Home should go to first item in current row', () => {
      // index 6 is row 1, col 2 → row 1, col 0 = index 4
      const result = service.handleKeyNavigation(makeKeyEvent('Home'), 6, config);
      expect(result).toBe(4);
    });

    it('Ctrl+Home should go to first item in grid', () => {
      const result = service.handleKeyNavigation(
        makeKeyEvent('Home', { ctrlKey: true }),
        6,
        config
      );
      expect(result).toBe(0);
    });

    it('End should go to last item in current row', () => {
      // index 4 is row 1, col 0 → row 1, col 3 = index 7
      const result = service.handleKeyNavigation(makeKeyEvent('End'), 4, config);
      expect(result).toBe(7);
    });

    it('Ctrl+End should go to last item in grid', () => {
      const result = service.handleKeyNavigation(makeKeyEvent('End', { ctrlKey: true }), 4, config);
      expect(result).toBe(11);
    });
  });

  // ============================================================
  // handleKeyNavigation - Boundary Wrapping (Requirement 5.4, 5.6)
  // ============================================================
  describe('handleKeyNavigation - Boundary Wrapping', () => {
    function makeKeyEvent(key: string): KeyboardEvent {
      return new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
    }

    it('should clamp index to totalItems-1 when wrapping produces out-of-bounds', () => {
      // Incomplete last row: 3x4 grid with only 10 items (last row has 2 items)
      const config: GridNavigationConfig = {
        rowCount: 3,
        columnCount: 4,
        totalItems: 10,
        wrap: true,
      };
      // index 3 is row 0, col 3 → ArrowDown → row 1, col 3 = index 7 (valid)
      const result = service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 3, config);
      expect(result).toBe(7);
    });

    it('should wrap out-of-bounds index using modulo when wrap=true', () => {
      // 3x4 grid with 10 items. index 7 is row 1, col 3 → ArrowDown → row 2, col 3 = index 11 (>= 10)
      // With wrap: 11 % 10 = 1
      const config: GridNavigationConfig = {
        rowCount: 3,
        columnCount: 4,
        totalItems: 10,
        wrap: true,
      };
      const result = service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 7, config);
      expect(result).toBe(1);
    });

    it('should clamp to totalItems-1 when wrap=false and index exceeds bounds', () => {
      const config: GridNavigationConfig = {
        rowCount: 3,
        columnCount: 4,
        totalItems: 10,
        wrap: false,
      };
      // index 7 is row 1, col 3 → ArrowDown → row 2, col 3 = index 11 (>= 10)
      // With wrap=false: clamp to 9
      const result = service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 7, config);
      expect(result).toBe(9);
    });

    it('End on last row with incomplete items should go to last valid item in row', () => {
      const config: GridNavigationConfig = {
        rowCount: 3,
        columnCount: 4,
        totalItems: 10,
        wrap: true,
      };
      // index 8 is row 2, col 0 → End → last item in row 2
      // lastColumnInRow = min(3, 10 - 1 - 2*4) = min(3, 1) = 1
      // index = 2*4 + 1 = 9
      const result = service.handleKeyNavigation(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
        8,
        config
      );
      expect(result).toBe(9);
    });
  });

  // ============================================================
  // handleKeyNavigation - Empty/Null Grid (Requirement 5.6)
  // ============================================================
  describe('handleKeyNavigation - Empty/Null Grid', () => {
    function makeKeyEvent(key: string): KeyboardEvent {
      return new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
    }

    it('should return -1 for empty grid (totalItems=0)', () => {
      const config: GridNavigationConfig = {
        rowCount: 0,
        columnCount: 4,
        totalItems: 0,
        wrap: true,
      };
      expect(service.handleKeyNavigation(makeKeyEvent('ArrowRight'), 0, config)).toBe(-1);
      expect(service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 0, config)).toBe(-1);
      expect(service.handleKeyNavigation(makeKeyEvent('Home'), 0, config)).toBe(-1);
    });

    it('should return -1 for unrecognized keys', () => {
      const config: GridNavigationConfig = {
        rowCount: 3,
        columnCount: 4,
        totalItems: 12,
      };
      expect(service.handleKeyNavigation(makeKeyEvent('Enter'), 0, config)).toBe(-1);
      expect(service.handleKeyNavigation(makeKeyEvent('Escape'), 0, config)).toBe(-1);
      expect(service.handleKeyNavigation(makeKeyEvent('Tab'), 0, config)).toBe(-1);
      expect(service.handleKeyNavigation(makeKeyEvent('a'), 0, config)).toBe(-1);
    });

    it('should handle single-item grid', () => {
      const config: GridNavigationConfig = {
        rowCount: 1,
        columnCount: 1,
        totalItems: 1,
        wrap: true,
      };
      // ArrowRight wraps: col 0+1=1 >= 1 → wrap to col 0 → index 0
      expect(service.handleKeyNavigation(makeKeyEvent('ArrowRight'), 0, config)).toBe(0);
      expect(service.handleKeyNavigation(makeKeyEvent('ArrowDown'), 0, config)).toBe(0);
    });
  });

  // ============================================================
  // handleKeyNavigation - Disabled Items (Requirement 5.4)
  // ============================================================
  describe('handleKeyNavigation - Disabled Items', () => {
    function makeKeyEvent(key: string): KeyboardEvent {
      return new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
    }

    it('should skip disabled items when navigating forward', () => {
      const config: GridNavigationConfig = {
        rowCount: 1,
        columnCount: 4,
        totalItems: 4,
        wrap: true,
        isDisabled: index => index === 1,
      };
      // From index 0, ArrowRight → index 1 (disabled) → skip to index 2
      const result = service.handleKeyNavigation(makeKeyEvent('ArrowRight'), 0, config);
      expect(result).toBe(2);
    });

    it('should skip disabled items when navigating backward', () => {
      const config: GridNavigationConfig = {
        rowCount: 1,
        columnCount: 4,
        totalItems: 4,
        wrap: true,
        isDisabled: index => index === 1,
      };
      // From index 2, ArrowLeft → index 1 (disabled) → skip to index 0
      const result = service.handleKeyNavigation(makeKeyEvent('ArrowLeft'), 2, config);
      expect(result).toBe(0);
    });

    it('should handle all items disabled (returns to start index)', () => {
      const config: GridNavigationConfig = {
        rowCount: 1,
        columnCount: 3,
        totalItems: 3,
        wrap: true,
        isDisabled: () => true,
      };
      // All disabled → loops back to startIndex
      const result = service.handleKeyNavigation(makeKeyEvent('ArrowRight'), 0, config);
      expect(result).toBe(1); // loops through all and returns to startIndex (1)
    });
  });

  // ============================================================
  // handleKeyNavigation - wrap default (Requirement 5.4)
  // ============================================================
  describe('handleKeyNavigation - wrap defaults to true', () => {
    it('should wrap by default when wrap is not specified', () => {
      const config: GridNavigationConfig = {
        rowCount: 3,
        columnCount: 4,
        totalItems: 12,
        // wrap not specified, should default to true
      };
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      // index 3 is row 0, col 3 → ArrowRight → wraps to col 0 = index 0
      const result = service.handleKeyNavigation(event, 3, config);
      expect(result).toBe(0);
    });
  });
});
