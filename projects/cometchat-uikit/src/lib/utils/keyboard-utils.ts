/**
 * Keyboard Utility Functions for CometChat UIKit Accessibility
 *
 * Provides stateless utility functions for keyboard event handling,
 * navigation, and focus management across components.
 */

/**
 * Checks if the event key is an activation key (Enter or Space)
 * @param event - The keyboard event to check
 * @returns boolean - true if the key is Enter or Space
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Checks if the event key is an arrow key
 * @param event - The keyboard event to check
 * @returns boolean - true if the key is an arrow key
 */
export function isArrowKey(event: KeyboardEvent): boolean {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
}

/**
 * Options for handleActivation function
 */
export interface HandleActivationOptions {
  /** Whether to call preventDefault on the event (default: true) */
  preventDefault?: boolean;
  /** Whether to call stopPropagation on the event (default: false) */
  stopPropagation?: boolean;
}

/**
 * Handles activation key press with event prevention
 * Returns true if activation occurred
 * @param event - The keyboard event to handle
 * @param callback - The callback to execute on activation
 * @param options - Optional configuration for event handling
 * @returns boolean - true if activation occurred
 */
export function handleActivation(
  event: KeyboardEvent,
  callback: () => void,
  options?: HandleActivationOptions
): boolean {
  if (isActivationKey(event)) {
    if (options?.preventDefault !== false) {
      event.preventDefault();
    }
    if (options?.stopPropagation) {
      event.stopPropagation();
    }
    callback();
    return true;
  }
  return false;
}

/**
 * Direction type for arrow key navigation
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Options for getNextIndex function
 */
export interface GetNextIndexOptions {
  /** Whether to wrap around at list boundaries (default: true) */
  wrap?: boolean;
  /** Callback to determine if an index should be skipped (e.g., disabled items) */
  skipDisabled?: (index: number) => boolean;
}

/**
 * Calculates next index for arrow key navigation with wrap-around
 * @param currentIndex - The current focused index
 * @param direction - The navigation direction
 * @param totalItems - The total number of items in the list
 * @param options - Optional configuration for navigation behavior
 * @returns number - The next index to focus
 */
export function getNextIndex(
  currentIndex: number,
  direction: NavigationDirection,
  totalItems: number,
  options?: GetNextIndexOptions
): number {
  // Handle edge cases
  if (totalItems <= 0) {
    return 0;
  }

  const wrap = options?.wrap !== false;
  const isForward = direction === 'down' || direction === 'right';

  let nextIndex = isForward ? currentIndex + 1 : currentIndex - 1;

  if (wrap) {
    if (nextIndex < 0) {
      nextIndex = totalItems - 1;
    }
    if (nextIndex >= totalItems) {
      nextIndex = 0;
    }
  } else {
    nextIndex = Math.max(0, Math.min(totalItems - 1, nextIndex));
  }

  // Skip disabled items if callback provided
  if (options?.skipDisabled) {
    const startIndex = nextIndex;
    let iterations = 0;
    const maxIterations = totalItems; // Prevent infinite loop

    while (options.skipDisabled(nextIndex) && iterations < maxIterations) {
      nextIndex = isForward ? nextIndex + 1 : nextIndex - 1;

      if (wrap) {
        if (nextIndex < 0) {
          nextIndex = totalItems - 1;
        }
        if (nextIndex >= totalItems) {
          nextIndex = 0;
        }
      } else {
        nextIndex = Math.max(0, Math.min(totalItems - 1, nextIndex));
      }

      iterations++;

      // If we've wrapped back to start, all items are disabled
      if (nextIndex === startIndex) {
        break;
      }
    }
  }

  return nextIndex;
}

/**
 * Selector for focusable elements
 */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Gets all focusable elements within a container
 * @param container - The container element to search within
 * @returns HTMLElement[] - Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[];
}

/**
 * Maps a keyboard event key to a navigation direction
 * @param event - The keyboard event
 * @returns NavigationDirection | null - The direction or null if not an arrow key
 */
export function getNavigationDirection(event: KeyboardEvent): NavigationDirection | null {
  switch (event.key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      return null;
  }
}

/**
 * Checks if the event key is the Escape key
 * @param event - The keyboard event to check
 * @returns boolean - true if the key is Escape
 */
export function isEscapeKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape';
}

/**
 * Checks if the event key is the Tab key
 * @param event - The keyboard event to check
 * @returns boolean - true if the key is Tab
 */
export function isTabKey(event: KeyboardEvent): boolean {
  return event.key === 'Tab';
}

/**
 * Checks if the event key is the Home key
 * @param event - The keyboard event to check
 * @returns boolean - true if the key is Home
 */
export function isHomeKey(event: KeyboardEvent): boolean {
  return event.key === 'Home';
}

/**
 * Checks if the event key is the End key
 * @param event - The keyboard event to check
 * @returns boolean - true if the key is End
 */
export function isEndKey(event: KeyboardEvent): boolean {
  return event.key === 'End';
}
