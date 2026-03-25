import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatButtonComponent } from '../cometchat-button/cometchat-button.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { FocusTrapService } from '../../../services/focus-trap.service';

/**
 * CometChatConfirmDialog is a dialog component for confirmation actions.
 * It includes a title, description, and action buttons (confirm/cancel).
 * Can be used for displaying warning, alert, and info popups.
 *
 * Accessibility features:
 * - role="dialog" and aria-modal="true" for screen readers
 * - aria-labelledby references the dialog title
 * - Focus trap keeps Tab navigation within the dialog
 * - Escape key closes the dialog
 * - Focus is restored to the previously focused element on close
 *
 * @example
 * ```html
 * <cometchat-confirm-dialog
 *   [title]="'Delete Conversation?'"
 *   [messageText]="'Are you sure you want to delete this conversation?'"
 *   [confirmButtonText]="'Delete'"
 *   [cancelButtonText]="'Cancel'"
 *   (confirmClick)="onConfirm()"
 *   (cancelClick)="onCancel()"
 * ></cometchat-confirm-dialog>
 * ```
 */
@Component({
  selector: 'cometchat-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatButtonComponent],
  templateUrl: './cometchat-confirm-dialog.component.html',
  styleUrls: ['./cometchat-confirm-dialog.component.css'],
})
export class CometChatConfirmDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Dialog title - defaults to localized "conversation_delete_title" */
  @Input() title: string = CometChatLocalize.getLocalizedString('conversation_delete_title');

  /** Dialog message text - defaults to localized "conversation_delete_subtitle" */
  @Input() messageText: string = CometChatLocalize.getLocalizedString(
    'conversation_delete_subtitle'
  );

  /** Cancel button text - defaults to localized "conversation_delete_confirm_no" */
  @Input() cancelButtonText: string = CometChatLocalize.getLocalizedString(
    'conversation_delete_confirm_no'
  );

  /** Confirm button text - defaults to localized "conversation_delete_confirm_yes" */
  @Input() confirmButtonText: string = CometChatLocalize.getLocalizedString(
    'conversation_delete_confirm_yes'
  );

  /** Custom icon URL for the dialog icon. When set, overrides the default delete icon via inline style. */
  @Input() iconURL: string = '';

  /** Emitted when confirm button is clicked */
  @Output() confirmClick = new EventEmitter<void>();

  /** Emitted when cancel button is clicked */
  @Output() cancelClick = new EventEmitter<void>();

  /** Reference to the dialog container element */
  @ViewChild('dialogContainer', { static: false }) dialogContainer!: ElementRef<HTMLDivElement>;

  /** Unique ID for the title element for aria-labelledby */
  titleId = `cometchat-confirm-dialog-title-${Math.random().toString(36).substr(2, 9)}`;

  /** Internal loading state - shows loading animation on confirm button */
  isLoading = false;

  /** Internal error state - shows error message when true */
  isError = false;

  /** FocusTrapService for managing focus within the dialog */
  private focusTrapService = inject(FocusTrapService);

  /** Keyboard event listener reference for cleanup */
  private escapeKeyListener: ((event: KeyboardEvent) => void) | null = null;

  /** Error message from localization */
  get errorMessage(): string {
    return CometChatLocalize.getLocalizedString('conversation_delete_error');
  }

  ngOnInit(): void {
    // Add keyboard event listener for Escape key
    this.escapeKeyListener = this.handleEscapeKey.bind(this);
    document.addEventListener('keydown', this.escapeKeyListener);
  }

  ngAfterViewInit(): void {
    // Activate focus trap after view is initialized
    if (this.dialogContainer?.nativeElement) {
      this.focusTrapService.activate({
        container: this.dialogContainer.nativeElement,
        initialFocus: 'container',
        returnFocusOnDeactivate: true,
      });
    }
  }

  ngOnDestroy(): void {
    // Remove keyboard event listener
    if (this.escapeKeyListener) {
      document.removeEventListener('keydown', this.escapeKeyListener);
    }

    // Deactivate focus trap (this also restores focus)
    if (this.dialogContainer?.nativeElement) {
      this.focusTrapService.deactivate(this.dialogContainer.nativeElement);
    }
  }

  /**
   * Handles Escape key to close the dialog.
   * Focus trap Tab cycling is handled by FocusTrapService.
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleCancelClick();
    }
  }

  /**
   * Handles confirm button click.
   * Sets loading state and emits confirmClick event.
   */
  handleSubmitClick(): void {
    this.isLoading = true;
    this.isError = false;
    this.confirmClick.emit();
  }

  /**
   * Handles cancel button click.
   * Emits cancelClick event.
   */
  handleCancelClick(): void {
    this.cancelClick.emit();
  }

  /**
   * Called by parent to indicate success.
   * Resets loading and error states.
   */
  setSuccess(): void {
    this.isLoading = false;
    this.isError = false;
  }

  /**
   * Called by parent to indicate error.
   * Shows error message and resets loading state.
   */
  setError(): void {
    this.isError = true;
    this.isLoading = false;
  }
}
