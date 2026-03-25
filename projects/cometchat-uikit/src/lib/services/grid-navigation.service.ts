import { Injectable } from '@angular/core';

/**
 * Configuration for grid navigation behavior
 */
export interface GridNavigationConfig {
  /** Number of rows in the grid */
  rowCount: number;
  /** Number of columns in the grid */
  columnCount: number;
  /** Total number of items (may be less than rowCount * columnCount) */
  totalItems: number;
  /** Whether navigation should wrap around at boundaries (default: true) */
  wrap?: boolean;
  /** Callback to check if an item at index is disabled */
  isDisabled?: (index: number) => boolean;
}

/**
 * Grid position representation
 */
export interface GridPosition {
  row: number;
  column: number;
  index: number;
}

/**
 * GridNavigationService provides 2D keyboard navigation for grid components.
 *
 * Implements arrow key navigation for grids like sticker/emoji keyboards,
 * supporting ArrowUp/Down for rows, ArrowLeft/Right for columns,
 * Home/End for row navigation, and Ctrl+Home/Ctrl+End for grid navigation.
 *
 * @example
 * ```typescript
 * // In a sticker keyboard component
 * private gridNavigationService = inject(GridNavigationService);
 * focusedIndex = signal(0);
 * readonly COLUMNS = 4;
 *
 * onGridKeyDown(event: KeyboardEvent): void {
 *   const rowCount = Math.ceil(this.stickers.length / this.COLUMNS);
 *   const newIndex = this.gridNavigationService.handleKeyNavigation(
 *     event,
 *     this.focusedIndex(),
 *     { rowCount, columnCount: this.COLUMNS, totalItems: this.stickers.length, wrap: true }
 *   );
 *
 *   if (newIndex !== -1 && newIndex !== this.focusedIndex()) {
 *     this.focusedIndex.set(newIndex);
 *     this.focusSticker(newIndex);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class GridNavigationService {
  /**
   * Converts a linear index to grid position.
   *
   * @param index - The linear index
   * @param columnCount - Number of columns in the grid
   * @returns GridPosition - The row, column, and index
   */
  indexToPosition(index: number, columnCount: number): GridPosition {
    const row = Math.floor(index / columnCount);
    const column = index % columnCount;
    return { row, column, index };
  }

  /**
   * Converts grid position to linear index.
   *
   * @param row - The row number
   * @param column - The column number
   * @param columnCount - Number of columns in the grid
   * @returns number - The linear index
   */
  positionToIndex(row: number, column: number, columnCount: number): number {
    return row * columnCount + column;
  }

  /**
   * Handles keyboard navigation within a grid.
   * Returns the new focused index, or -1 if no navigation occurred.
   *
   * @param event - The keyboard event to handle
   * @param currentIndex - The currently focused index
   * @param config - Configuration for navigation behavior
   * @returns number - The new index to focus, or -1 if no navigation
   */
  handleKeyNavigation(
    event: KeyboardEvent,
    currentIndex: number,
    config: GridNavigationConfig
  ): number {
    if (!event || !config) return -1;
    const { rowCount, columnCount, totalItems, wrap = true, isDisabled } = config;

    if (totalItems === 0) return -1;

    const currentPos = this.indexToPosition(currentIndex, columnCount);
    let newRow = currentPos.row;
    let newColumn = currentPos.column;
    let newIndex = -1;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        newColumn = currentPos.column + 1;
        if (newColumn >= columnCount) {
          newColumn = wrap ? 0 : columnCount - 1;
        }
        newIndex = this.positionToIndex(newRow, newColumn, columnCount);
        break;

      case 'ArrowLeft':
        event.preventDefault();
        newColumn = currentPos.column - 1;
        if (newColumn < 0) {
          newColumn = wrap ? columnCount - 1 : 0;
        }
        newIndex = this.positionToIndex(newRow, newColumn, columnCount);
        break;

      case 'ArrowDown':
        event.preventDefault();
        newRow = currentPos.row + 1;
        if (newRow >= rowCount) {
          newRow = wrap ? 0 : rowCount - 1;
        }
        newIndex = this.positionToIndex(newRow, newColumn, columnCount);
        break;

      case 'ArrowUp':
        event.preventDefault();
        newRow = currentPos.row - 1;
        if (newRow < 0) {
          newRow = wrap ? rowCount - 1 : 0;
        }
        newIndex = this.positionToIndex(newRow, newColumn, columnCount);
        break;

      case 'Home':
        event.preventDefault();
        if (event.ctrlKey) {
          // Ctrl+Home: Go to first item in grid
          newIndex = 0;
        } else {
          // Home: Go to first item in current row
          newIndex = this.positionToIndex(newRow, 0, columnCount);
        }
        break;

      case 'End':
        event.preventDefault();
        if (event.ctrlKey) {
          // Ctrl+End: Go to last item in grid
          newIndex = totalItems - 1;
        } else {
          // End: Go to last item in current row
          const lastColumnInRow = Math.min(columnCount - 1, totalItems - 1 - newRow * columnCount);
          newIndex = this.positionToIndex(newRow, lastColumnInRow, columnCount);
        }
        break;

      default:
        return -1;
    }

    // Ensure index is within bounds
    if (newIndex >= totalItems) {
      newIndex = wrap ? newIndex % totalItems : totalItems - 1;
    }

    // Skip disabled items
    if (newIndex !== -1 && isDisabled) {
      const startIndex = newIndex;
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;

      while (isDisabled(newIndex)) {
        newIndex += direction;
        if (newIndex < 0) newIndex = wrap ? totalItems - 1 : 0;
        if (newIndex >= totalItems) newIndex = wrap ? 0 : totalItems - 1;
        if (newIndex === startIndex) break; // Prevent infinite loop
      }
    }

    return newIndex;
  }

  /**
   * Gets tabindex for an item based on roving tabindex pattern.
   *
   * @param index - The item's index
   * @param focusedIndex - The currently focused index
   * @returns number - 0 if focused, -1 otherwise
   */
  getItemTabIndex(index: number, focusedIndex: number): number {
    return index === focusedIndex ? 0 : -1;
  }

  /**
   * Calculates row and column from linear index.
   * Alias for indexToPosition with simplified return type.
   *
   * @param index - The linear index
   * @param columns - Number of columns in the grid
   * @returns Object with row and col properties
   */
  getRowCol(index: number, columns: number): { row: number; col: number } {
    return {
      row: Math.floor(index / columns),
      col: index % columns,
    };
  }

  /**
   * Calculates linear index from row and column.
   * Alias for positionToIndex.
   *
   * @param row - The row number
   * @param col - The column number
   * @param columns - Number of columns in the grid
   * @returns The linear index
   */
  getIndex(row: number, col: number, columns: number): number {
    return row * columns + col;
  }
}
