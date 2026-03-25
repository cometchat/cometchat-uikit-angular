import { Injectable } from '@angular/core';
import { getFocusableElements } from '../utils/keyboard-utils';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Configuration for focus trap behavior
 */
export interface FocusTrapConfig {
  /** The container element to trap focus within */
  container: HTMLElement;
  /** Where to set initial focus: 'first' focusable, 'container', or specific element */
  initialFocus?: HTMLElement | 'first' | 'container';
  /** Whether to restore focus to previous element on deactivate (default: true) */
  returnFocusOnDeactivate?: boolean;
}

/**
 * Internal state for an active focus trap
 */
interface FocusTrapState {
  previousFocus: HTMLElement | null;
  keydownHandler: (e: KeyboardEvent) => void;
}

/**
 * FocusTrapService manages focus trapping within modal components.
 *
 * Focus trapping ensures that Tab and Shift+Tab navigation cycles within
 * a container element, preventing focus from escaping to elements outside
 * the modal. This is essential for accessibility in dialogs, popovers,
 * and other modal components.
 *
 * @example
 * ```typescript
 * // In a dialog component
 * @ViewChild('dialogContainer') dialogContainer!: ElementRef<HTMLElement>;
 *
 * constructor(private focusTrapService: FocusTrapService) {}
 *
 * openDialog(): void {
 *   this.focusTrapService.activate({
 *     container: this.dialogContainer.nativeElement,
 *     initialFocus: 'first',
 *     returnFocusOnDeactivate: true
 *   });
 * }
 *
 * closeDialog(): void {
 *   this.focusTrapService.deactivate(this.dialogContainer.nativeElement);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class FocusTrapService {
  private activeTraps = new Map<HTMLElement, FocusTrapState>();

  /**
   * Activates focus trap within a container.
   *
   * When activated, Tab and Shift+Tab navigation will cycle within the
   * container's focusable elements. The previously focused element is
   * stored for restoration when the trap is deactivated.
   *
   * @param config - Configuration for the focus trap
   */
  activate(config: FocusTrapConfig): void {
    if (!config) {
      CometChatLogger.warn('FocusTrapService', 'Invalid config provided');
      return;
    }
    const { container, initialFocus = 'first', returnFocusOnDeactivate = true } = config;

    // Validate container
    if (!container) {
      CometChatLogger.warn('FocusTrapService', 'Invalid container provided');
      return;
    }

    // Don't activate if already active for this container
    if (this.activeTraps.has(container)) {
      return;
    }

    // Store the currently focused element for restoration
    const previousFocus = document.activeElement as HTMLElement;

    // Create keydown handler for Tab cycling
    const keydownHandler = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(container);

      // If no focusable elements, prevent Tab from leaving container
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element -> cycle to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> cycle to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    // Attach keydown listener to container
    container.addEventListener('keydown', keydownHandler);

    // Store trap state
    this.activeTraps.set(container, {
      previousFocus: returnFocusOnDeactivate ? previousFocus : null,
      keydownHandler,
    });

    // Set initial focus (use setTimeout to ensure DOM is ready)
    setTimeout(() => {
      this.setInitialFocus(container, initialFocus);
    }, 0);
  }

  /**
   * Deactivates focus trap and optionally restores focus.
   *
   * Removes the keydown listener and restores focus to the element
   * that was focused before the trap was activated (if configured).
   *
   * @param container - The container element to deactivate the trap for
   */
  deactivate(container: HTMLElement): void {
    const trap = this.activeTraps.get(container);

    if (!trap) {
      return;
    }

    // Remove keydown listener
    container.removeEventListener('keydown', trap.keydownHandler);

    // Restore focus to previous element
    if (trap.previousFocus && typeof trap.previousFocus.focus === 'function') {
      // Use setTimeout to ensure focus restoration happens after any DOM updates
      setTimeout(() => {
        // Verify the element is still in the DOM and focusable
        if (trap.previousFocus && document.body.contains(trap.previousFocus)) {
          trap.previousFocus.focus({ preventScroll: true });
        } else {
          // Previous element was removed from DOM (e.g., deleted item).
          // Find the closest ancestor of the container that is still in the DOM
          // and focus it with preventScroll to avoid scroll jumps.
          const parent = container.parentElement?.closest('[tabindex], [role], button, a, input, select, textarea, .cometchat') as HTMLElement | null;
          if (parent && document.body.contains(parent)) {
            parent.focus({ preventScroll: true });
          }
        }
      }, 0);
    }

    // Remove from active traps
    this.activeTraps.delete(container);
  }

  /**
   * Checks if a container has an active focus trap.
   *
   * @param container - The container element to check
   * @returns boolean - true if the container has an active focus trap
   */
  isActive(container: HTMLElement): boolean {
    return this.activeTraps.has(container);
  }

  /**
   * Checks if any focus trap is currently active.
   *
   * Useful for parent components (e.g., message list) to determine
   * whether keyboard events should be suppressed because an overlay
   * with a focus trap is open.
   *
   * @returns boolean - true if at least one focus trap is active
   */
  hasActiveTraps(): boolean {
    return this.activeTraps.size > 0;
  }

  /**
   * Sets initial focus based on configuration.
   *
   * @param container - The container element
   * @param initialFocus - Where to set initial focus
   */
  private setInitialFocus(
    container: HTMLElement,
    initialFocus: HTMLElement | 'first' | 'container'
  ): void {
    if (initialFocus === 'container') {
      // Focus the container itself (requires tabindex)
      container.focus();
    } else if (initialFocus === 'first') {
      // Focus the first focusable element
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // Fallback to container if no focusable elements
        container.focus();
      }
    } else if (initialFocus instanceof HTMLElement) {
      // Focus the specified element
      initialFocus.focus();
    }
  }
}
