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
  signal,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CometChatButtonComponent } from '../cometchat-button/cometchat-button.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';

/**
 * CometChatFlagMessageDialog is a dialog component for flagging/reporting inappropriate messages.
 * It includes a title, description, optional remark text field, and action buttons (confirm/cancel).
 *
 * @example
 * ```html
 * <cometchat-flag-message-dialog
 *   [message]="messageToFlag"
 *   [hideRemarkField]="false"
 *   (confirm)="onFlagConfirm($event)"
 *   (cancel)="onFlagCancel()"
 * ></cometchat-flag-message-dialog>
 * ```
 *
 * @see Requirement 9.2 - THE Flag_Message_Dialog SHALL display a confirmation prompt
 * @see Requirement 9.3 - WHEN `hideFlagRemarkField` is false, THE Flag_Message_Dialog SHALL include a remark text field
 */
@Component({
  selector: 'cometchat-flag-message-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, CometChatButtonComponent],
  templateUrl: './cometchat-flag-message-dialog.component.html',
  styleUrls: ['./cometchat-flag-message-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatFlagMessageDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  /**
   * The message to flag/report.
   * @see Requirement 9.2
   */
  @Input() message!: CometChat.BaseMessage;

  /**
   * Whether to hide the remark text field.
   * When false, users can provide additional context about why they're flagging the message.
   * @see Requirement 9.3
   */
  @Input() hideRemarkField = false;

  /**
   * Emitted when the flag is confirmed.
   * Contains the message and optional remark.
   * @see Requirement 9.4
   */
  @Output() confirm = new EventEmitter<{ message: CometChat.BaseMessage; remark: string }>();

  /**
   * Emitted when the dialog is cancelled.
   */
  @Output() cancel = new EventEmitter<void>();

  /** Reference to the dialog container element */
  @ViewChild('dialogContainer', { static: false }) dialogContainer!: ElementRef<HTMLDivElement>;

  /** Inject LiveAnnouncerService for accessibility announcements */
  private liveAnnouncer = inject(LiveAnnouncerService);

  /** Unique ID for the title element for aria-labelledby */
  titleId = `cometchat-flag-message-dialog-title-${Math.random().toString(36).substr(2, 9)}`;

  /** Unique ID for the description element for aria-describedby */
  descriptionId = `cometchat-flag-message-dialog-desc-${Math.random().toString(36).substr(2, 9)}`;

  /** Track if character limit announcement has been made */
  private hasAnnouncedCharacterLimit = false;

  /** Internal loading state - shows loading animation on confirm button */
  isLoading = signal(false);

  /** Internal error state - shows error message when true */
  isError = signal(false);

  /** The remark text entered by the user */
  remarkText = signal('');

  /** Maximum character limit for remark */
  readonly MAX_REMARK_LENGTH = 500;

  /** Store the previously focused element for restoration */
  private previouslyFocusedElement: HTMLElement | null = null;

  /** Store all focusable elements within the dialog */
  private focusableElements: HTMLElement[] = [];

  /** Keyboard event listener reference for cleanup */
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;

  /** Error message from localization */
  get errorMessage(): string {
    return CometChatLocalize.getLocalizedString('flag_message_error');
  }

  /** Dialog title from localization */
  get dialogTitle(): string {
    return CometChatLocalize.getLocalizedString('flag_message_title');
  }

  /** Dialog subtitle from localization */
  get dialogSubtitle(): string {
    return CometChatLocalize.getLocalizedString('flag_message_subtitle');
  }

  /** Remark label from localization */
  get remarkLabel(): string {
    return CometChatLocalize.getLocalizedString('flag_message_remark_label');
  }

  /** Remark optional text from localization */
  get remarkOptional(): string {
    return CometChatLocalize.getLocalizedString('flag_message_remark_optional');
  }

  /** Remark placeholder from localization */
  get remarkPlaceholder(): string {
    return CometChatLocalize.getLocalizedString('flag_message_remark_placeholder');
  }

  /** Confirm button text from localization */
  get confirmButtonText(): string {
    return CometChatLocalize.getLocalizedString('flag_message_confirm_yes');
  }

  /** Cancel button text from localization */
  get cancelButtonText(): string {
    return CometChatLocalize.getLocalizedString('flag_message_confirm_no');
  }

  /** Character limit reached message from localization */
  get characterLimitMessage(): string {
    return CometChatLocalize.getLocalizedString('flag_message_character_limit_reached');
  }

  /** Remaining characters count */
  get remainingCharacters(): number {
    return this.MAX_REMARK_LENGTH - this.remarkText().length;
  }

  /** Whether character limit is reached */
  get isCharacterLimitReached(): boolean {
    return this.remarkText().length >= this.MAX_REMARK_LENGTH;
  }

  ngOnInit(): void {
    // Store the currently focused element to restore later
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Add keyboard event listener for Escape key
    this.keydownListener = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownListener);
  }

  ngAfterViewInit(): void {
    // Set up focus trapping after view is initialized
    this.setupFocusTrap();

    // Focus the first focusable element (cancel button)
    this.pendingTimers.push(setTimeout(() => {
      if (this.focusableElements.length > 0) {
        this.focusableElements[0].focus();
      }
    }, 0));
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    // Remove keyboard event listener
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }

    // Restore focus to the previously focused element
    this.restoreFocus();
  }

  /**
   * Sets up focus trapping within the dialog.
   * Finds all focusable elements and adds Tab key handling.
   */
  private setupFocusTrap(): void {
    if (!this.dialogContainer) {
      return;
    }

    // Find all focusable elements within the dialog
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const elements = this.dialogContainer.nativeElement.querySelectorAll(
      focusableSelectors.join(', ')
    );

    this.focusableElements = Array.from(elements) as HTMLElement[];
  }

  /**
   * Handles keyboard events for accessibility.
   * - Escape key: closes the dialog
   * - Tab key: traps focus within the dialog
   */
  private handleKeydown(event: KeyboardEvent): void {
    // Handle Escape key to close dialog
    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleCancelClick();
      return;
    }

    // Handle Tab key for focus trapping
    if (event.key === 'Tab' && this.focusableElements.length > 0) {
      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // If Shift+Tab on first element, move to last element
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, move to first element
      else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Restores focus to the element that was focused before the dialog opened.
   */
  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      // Use setTimeout to ensure the dialog is fully removed from DOM
      this.pendingTimers.push(setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0));
    }
  }

  /**
   * Handles remark text input change.
   * Enforces character limit and announces when limit is reached.
   * @param event - The input event
   * @see Requirement 13.12
   */
  onRemarkInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    let value = target.value;

    // Enforce character limit
    if (value.length > this.MAX_REMARK_LENGTH) {
      value = value.substring(0, this.MAX_REMARK_LENGTH);
      target.value = value;
    }

    this.remarkText.set(value);

    // Announce character limit reached (only once per reaching limit)
    if (value.length >= this.MAX_REMARK_LENGTH && !this.hasAnnouncedCharacterLimit) {
      this.hasAnnouncedCharacterLimit = true;
      this.liveAnnouncer.announce(this.characterLimitMessage, 'polite');
    } else if (value.length < this.MAX_REMARK_LENGTH) {
      // Reset flag when user deletes characters
      this.hasAnnouncedCharacterLimit = false;
    }
  }

  /**
   * Handles confirm button click.
   * Sets loading state and emits confirm event.
   * @see Requirement 9.4
   */
  handleSubmitClick(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.confirm.emit({
      message: this.message,
      remark: this.remarkText(),
    });
  }

  /**
   * Handles cancel button click.
   * Emits cancel event.
   */
  handleCancelClick(): void {
    this.cancel.emit();
  }

  /**
   * Called by parent to indicate success.
   * Resets loading and error states.
   */
  setSuccess(): void {
    this.isLoading.set(false);
    this.isError.set(false);
  }

  /**
   * Called by parent to indicate error.
   * Shows error message and resets loading state.
   */
  setError(): void {
    this.isError.set(true);
    this.isLoading.set(false);
  }
}
