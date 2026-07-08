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
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CometChat, FlagReason } from '@cometchat/chat-sdk-javascript';
import { CometChatButtonComponent } from '../cometchat-button/cometchat-button.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { CometChatLogger } from '../../../utils/CometChatLogger';

/**
 * CometChatFlagMessageDialog is a dialog for flagging/reporting inappropriate messages.
 * Fetches flag reasons from the SDK, allows reason selection and optional remark.
 * @see Requirements 9.2, 9.3
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
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  @Input() message!: CometChat.BaseMessage;
  @Input() hideRemarkField = false;

  @Output() confirm = new EventEmitter<{ message: CometChat.BaseMessage; reasonId: string; remark: string; }>();

  /** Emitted when the dialog is cancelled. */
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('dialogContainer', { static: false }) dialogContainer!: ElementRef<HTMLDivElement>;

  private liveAnnouncer = inject(LiveAnnouncerService);
  private cdr = inject(ChangeDetectorRef);

  titleId = `cometchat-flag-message-dialog-title-${Math.random().toString(36).substr(2, 9)}`;
  descriptionId = `cometchat-flag-message-dialog-desc-${Math.random().toString(36).substr(2, 9)}`;

  private hasAnnouncedCharacterLimit = false;
  isLoading = signal(false);
  isError = signal(false);
  remarkText = signal('');
  flagReasons = signal<FlagReason[]>([]);
  selectedReason = signal<FlagReason | null>(null);
  isLoadingReasons = signal(true);
  readonly MAX_REMARK_LENGTH = 500;
  private previouslyFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;

  get errorMessage(): string { return CometChatLocalize.getLocalizedString('flag_message_error'); }
  get dialogTitle(): string { return CometChatLocalize.getLocalizedString('flag_message_title'); }
  get dialogSubtitle(): string { return CometChatLocalize.getLocalizedString('flag_message_subtitle'); }
  get remarkLabel(): string { return CometChatLocalize.getLocalizedString('flag_message_remark_label'); }
  get remarkOptional(): string { return CometChatLocalize.getLocalizedString('flag_message_remark_optional'); }
  get remarkPlaceholder(): string { return CometChatLocalize.getLocalizedString('flag_message_remark_placeholder'); }
  get confirmButtonText(): string { return CometChatLocalize.getLocalizedString('flag_message_confirm_yes'); }
  get cancelButtonText(): string { return CometChatLocalize.getLocalizedString('flag_message_confirm_no'); }
  get characterLimitMessage(): string { return CometChatLocalize.getLocalizedString('flag_message_character_limit_reached'); }
  get remainingCharacters(): number { return this.MAX_REMARK_LENGTH - this.remarkText().length; }
  get isCharacterLimitReached(): boolean { return this.remarkText().length >= this.MAX_REMARK_LENGTH; }

  get isSubmitDisabled(): boolean {
    return !this.selectedReason() || this.isLoading();
  }

  /**
   * Gets the localized label for a flag reason.
   * Falls back to the reason's name if no localization key exists.
   */
  getReasonLabel(reason: FlagReason): string {
    const key = `flag_message_reason_id_${reason.id}`;
    const localized = CometChatLocalize.getLocalizedString(key);
    // If the key returns the key itself (not found), fall back to reason.name
    return localized && localized !== key ? localized : reason.name;
  }

  ngOnInit(): void {
    // Store the currently focused element to restore later
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Add keyboard event listener for Escape key
    this.keydownListener = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownListener);

    // Fetch flag reasons from the SDK
    this.fetchFlagReasons();
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
   * Fetches available flag reasons from the CometChat SDK.
   * @see React UIKit: CometChat.getFlagReasons()
   */
  private async fetchFlagReasons(): Promise<void> {
    try {
      const reasons = await CometChat.getFlagReasons();
      this.flagReasons.set(reasons);
    } catch (error) {
      CometChatLogger.error('CometChatFlagMessageDialog', 'fetchFlagReasons: Failed to fetch flag reasons', error);
      // Don't block the dialog — user can still submit without a reason selection
    } finally {
      this.isLoadingReasons.set(false);
      this.cdr.markForCheck();
      // Reason buttons render asynchronously after this resolves; rebuild the
      // focus-trap boundaries so Tab cycling includes them. Don't move focus.
      this.pendingTimers.push(setTimeout(() => this.setupFocusTrap(), 0));
    }
  }

  /**
   * Toggles the selected flag reason.
   * Clicking the same reason again deselects it.
   */
  toggleReason(reason: FlagReason): void {
    if (this.selectedReason()?.id === reason.id) {
      this.selectedReason.set(null);
    } else {
      this.selectedReason.set(reason);
      this.isError.set(false);
    }
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
   * Validates that a reason is selected, sets loading state, and emits confirm event.
   * @see Requirement 9.4
   */
  handleSubmitClick(): void {
    const reason = this.selectedReason();
    if (!reason) {
      return;
    }
    this.isLoading.set(true);
    this.isError.set(false);
    this.confirm.emit({
      message: this.message,
      reasonId: reason.id,
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
