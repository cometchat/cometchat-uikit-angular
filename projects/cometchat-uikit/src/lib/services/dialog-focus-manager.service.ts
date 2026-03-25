import { Injectable, inject } from '@angular/core';
import { FocusTrapService, FocusTrapConfig } from './focus-trap.service';
import { getFocusableElements } from '../utils/keyboard-utils';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Configuration for dialog focus management
 */
export interface DialogConfig extends FocusTrapConfig {
  /** Element ID for aria-labelledby */
  labelledById?: string;
  /** Element ID for aria-describedby */
  describedById?: string;
  /** Whether to close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
}

/**
 * Internal state for an active dialog
 */
interface DialogState {
  config: DialogConfig;
  escapeHandler: (e: KeyboardEvent) => void;
}

/**
 * DialogFocusManager provides focus management for modal dialogs.
 *
 * Extends FocusTrapService with dialog-specific features including
 * ARIA attribute management, Escape key handling, and initial focus
 * management. Ensures consistent focus behavior across all dialog
 * components.
 *
 * @example
 * ```typescript
 * // In a dialog component
 * private dialogFocusManager = inject(DialogFocusManager);
 *
 * @ViewChild('dialogContainer') dialogContainer!: ElementRef<HTMLElement>;
 * @ViewChild('closeButton') closeButton!: ElementRef<HTMLButtonElement>;
 *
 * ngAfterViewInit(): void {
 *   this.dialogFocusManager.openDialog({
 *     container: this.dialogContainer.nativeElement,
 *     initialFocus: this.closeButton.nativeElement,
 *     labelledById: 'dialog-title',
 *     closeOnEscape: true,
 *     onEscape: () => this.close(),
 *   });
 * }
 *
 * ngOnDestroy(): void {
 *   this.dialogFocusManager.closeDialog(this.dialogContainer.nativeElement);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DialogFocusManager {
  private focusTrapService = inject(FocusTrapService);
  private activeDialogs = new Map<HTMLElement, DialogState>();

  /**
   * Opens a dialog with focus management.
   *
   * Sets ARIA attributes, activates focus trap, and handles Escape key.
   *
   * @param config - Configuration for the dialog
   */
  openDialog(config: DialogConfig): void {
    if (!config) {
      CometChatLogger.warn('DialogFocusManager', 'Invalid config provided');
      return;
    }
    const { container, closeOnEscape = true, onEscape } = config;

    // Validate container
    if (!container) {
      CometChatLogger.warn('DialogFocusManager', 'Invalid container provided');
      return;
    }

    // Don't open if already active for this container
    if (this.activeDialogs.has(container)) {
      return;
    }

    // Set ARIA attributes
    container.setAttribute('aria-modal', 'true');

    if (config.labelledById) {
      container.setAttribute('aria-labelledby', config.labelledById);
    }
    if (config.describedById) {
      container.setAttribute('aria-describedby', config.describedById);
    }

    // Setup escape handler
    const escapeHandler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape?.();
      }
    };

    container.addEventListener('keydown', escapeHandler);

    // Store dialog state
    this.activeDialogs.set(container, { config, escapeHandler });

    // Activate focus trap
    this.focusTrapService.activate(config);
  }

  /**
   * Closes a dialog and restores focus.
   *
   * Removes ARIA attributes, deactivates focus trap, and restores
   * focus to the previously focused element.
   *
   * @param container - The dialog container element
   */
  closeDialog(container: HTMLElement): void {
    const dialog = this.activeDialogs.get(container);
    if (!dialog) return;

    // Remove escape handler
    container.removeEventListener('keydown', dialog.escapeHandler);

    // Remove ARIA attributes
    container.removeAttribute('aria-modal');
    container.removeAttribute('aria-labelledby');
    container.removeAttribute('aria-describedby');

    // Deactivate focus trap (restores focus)
    this.focusTrapService.deactivate(container);

    // Clean up
    this.activeDialogs.delete(container);
  }

  /**
   * Focuses the first focusable element or close button in a dialog.
   *
   * Looks for an element with [data-dialog-close] attribute first,
   * then falls back to the first focusable element.
   *
   * @param container - The dialog container element
   */
  focusFirstOrClose(container: HTMLElement): void {
    if (!container) return;
    const closeButton = container.querySelector('[data-dialog-close]') as HTMLElement;
    if (closeButton) {
      closeButton.focus();
      return;
    }

    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  /**
   * Checks if a dialog is currently active.
   *
   * @param container - The dialog container element
   * @returns boolean - true if the dialog is active
   */
  isDialogActive(container: HTMLElement): boolean {
    return this.activeDialogs.has(container);
  }
}
