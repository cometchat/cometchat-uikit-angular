import { Injectable, OnDestroy } from '@angular/core';

/**
 * Configuration for type-ahead search behavior
 */
export interface TypeAheadConfig<T> {
  /** Function to get searchable text from an item */
  getSearchText: (item: T) => string;
  /** Timeout in ms before buffer resets (default: 500) */
  timeout?: number;
}

/**
 * TypeAheadService provides character-based search for list components.
 *
 * Implements type-ahead search pattern where characters typed in quick
 * succession are collected into a buffer and matched against item names.
 * The buffer resets after a configurable timeout (default 500ms).
 *
 * Supports wrap-around search from current position to find the next
 * matching item.
 *
 * @example
 * ```typescript
 * // In a list component
 * private typeAheadService = inject(TypeAheadService);
 * focusedIndex = signal(0);
 *
 * onKeyDown(event: KeyboardEvent): void {
 *   // Only handle printable characters
 *   if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
 *     const newIndex = this.typeAheadService.handleCharacter(
 *       event.key,
 *       this.items,
 *       this.focusedIndex(),
 *       { getSearchText: (item) => item.name }
 *     );
 *
 *     if (newIndex !== -1) {
 *       this.focusedIndex.set(newIndex);
 *       this.focusItem(newIndex);
 *     }
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TypeAheadService implements OnDestroy {
  private buffer = '';
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly DEFAULT_TIMEOUT = 500;

  /**
   * Handles a character input for type-ahead search.
   * Returns the index of the matching item, or -1 if no match.
   *
   * Characters are collected into a buffer and matched against item names.
   * The search starts from the current position + 1 and wraps around to
   * find the next matching item.
   *
   * @param char - The character typed by the user
   * @param items - The list of items to search
   * @param currentIndex - The currently focused index
   * @param config - Configuration for search behavior
   * @returns number - The index of the matching item, or -1 if no match
   */
  handleCharacter<T>(
    char: string,
    items: T[],
    currentIndex: number,
    config: TypeAheadConfig<T>
  ): number {
    // Guard against null/undefined parameters
    if (!char || !items || !config) {
      return -1;
    }

    // Only handle printable characters (single character, not space)
    if (char.length !== 1 || char === ' ') {
      return -1;
    }

    // Clear existing timeout
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    // Add character to buffer
    this.buffer += char.toLowerCase();

    // Set timeout to clear buffer
    this.timeoutId = setTimeout(() => {
      this.buffer = '';
      this.timeoutId = null;
    }, config.timeout ?? this.DEFAULT_TIMEOUT);

    // Search for matching item starting from current index + 1
    const searchFrom = currentIndex + 1;

    // First, search from current position to end
    for (let i = searchFrom; i < items.length; i++) {
      const text = config.getSearchText(items[i]).toLowerCase();
      if (text.startsWith(this.buffer)) {
        return i;
      }
    }

    // Then, search from start to current position (wrap around)
    for (let i = 0; i < searchFrom && i < items.length; i++) {
      const text = config.getSearchText(items[i]).toLowerCase();
      if (text.startsWith(this.buffer)) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Clears the type-ahead buffer manually.
   *
   * Call this when the list loses focus or when you want to reset
   * the search state.
   */
  clearBuffer(): void {
    this.buffer = '';
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Cleanup on service destruction.
   */
  ngOnDestroy(): void {
    this.clearBuffer();
  }
}
