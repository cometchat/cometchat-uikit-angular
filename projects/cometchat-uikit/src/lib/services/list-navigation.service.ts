import { Injectable } from '@angular/core';

/**
 * Configuration for list navigation behavior
 */
export interface ListNavigationConfig {
  /** Total number of items in the list */
  itemCount: number;
  /** Whether navigation should wrap around at boundaries (default: true) */
  wrap?: boolean;
  /** Callback to check if an item at index is disabled */
  isDisabled?: (index: number) => boolean;
}

/**
 * ListNavigationService provides keyboard navigation for list components.
 *
 * Implements roving tabindex pattern and arrow key navigation for
 * accessible list navigation. Supports ArrowUp/ArrowDown, Home/End,
 * and wrap-around behavior.
 *
 * @example
 * ```typescript
 * // In a list component
 * private listNavigationService = inject(ListNavigationService);
 * focusedIndex = signal(0);
 *
 * onKeyDown(event: KeyboardEvent): void {
 *   const newIndex = this.listNavigationService.handleKeyNavigation(
 *     event,
 *     this.focusedIndex(),
 *     { itemCount: this.items.length, wrap: true }
 *   );
 *
 *   if (newIndex !== -1 && newIndex !== this.focusedIndex()) {
 *     this.focusedIndex.set(newIndex);
 *     this.focusItem(newIndex);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ListNavigationService {
  /**
   * Handles keyboard navigation within a list.
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
    config: ListNavigationConfig
  ): number {
    if (!event || !config) return -1;
    const { itemCount, wrap = true, isDisabled } = config;

    if (itemCount === 0) return -1;

    let newIndex = -1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex + 1;
        if (newIndex >= itemCount) {
          newIndex = wrap ? 0 : itemCount - 1;
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = wrap ? itemCount - 1 : 0;
        }
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = itemCount - 1;
        break;

      default:
        return -1;
    }

    // Skip disabled items
    if (isDisabled) {
      const startIndex = newIndex;
      // For Home, skip forward; for End, skip backward; for arrows, use arrow direction
      let direction: number;
      if (event.key === 'Home') {
        direction = 1; // Skip forward from first item
      } else if (event.key === 'End') {
        direction = -1; // Skip backward from last item
      } else {
        direction = event.key === 'ArrowDown' ? 1 : -1;
      }

      while (isDisabled(newIndex)) {
        newIndex += direction;

        if (wrap) {
          if (newIndex < 0) newIndex = itemCount - 1;
          if (newIndex >= itemCount) newIndex = 0;
        } else {
          newIndex = Math.max(0, Math.min(itemCount - 1, newIndex));
        }

        // Prevent infinite loop if all items are disabled
        if (newIndex === startIndex) break;
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
   * Updates tabindex values for roving tabindex pattern.
   * Returns a map of index -> tabindex value.
   *
   * This is useful when you need to batch-update tabindex values
   * for all items in a list at once.
   *
   * @param itemCount - Total number of items in the list
   * @param focusedIndex - The currently focused index
   * @returns Map<number, number> - Map of index to tabindex value
   *
   * @example
   * ```typescript
   * const tabindexMap = this.listNavigationService.getRovingTabindexMap(5, 2);
   * // Returns: Map { 0 => -1, 1 => -1, 2 => 0, 3 => -1, 4 => -1 }
   * ```
   */
  getRovingTabindexMap(itemCount: number, focusedIndex: number): Map<number, number> {
    const map = new Map<number, number>();
    for (let i = 0; i < itemCount; i++) {
      map.set(i, i === focusedIndex ? 0 : -1);
    }
    return map;
  }
}
