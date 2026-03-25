import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatButtonComponent } from '../base-elements/cometchat-button/cometchat-button.component';
import { TranslatePipe } from '../../resources/CometChatLocalize';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageComposerService } from '../../services/message-composer.service';

/**
 * Interface representing a poll option with unique ID and value.
 */
export interface PollOption {
  /** Unique identifier for the option */
  id: string;
  /** Option text value */
  value: string;
}

/**
 * CometChatCreatePoll is a modal component for creating poll messages.
 * It allows users to enter a question and multiple answer options (2-12).
 *
 * Features:
 * - Question input field
 * - Dynamic answer options (add/remove)
 * - Validation for question and minimum 2 options
 * - Maximum 12 options limit
 * - Loading state during poll creation
 * - Error handling and display
 * - Full keyboard accessibility
 * - Focus trap within modal
 *
 * @example
 * ```html
 * <cometchat-create-poll
 *   [user]="selectedUser"
 *   [group]="selectedGroup"
 *   [replyToMessage]="messageToReply"
 *   (closeClick)="onCloseModal()"
 *   (pollCreated)="onPollCreated()"
 *   (error)="onError($event)"
 * ></cometchat-create-poll>
 * ```
 *
 * @see Requirements 1.1-1.23
 */
@Component({
  selector: 'cometchat-create-poll',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, CometChatButtonComponent],
  templateUrl: './cometchat-create-poll.component.html',
  styleUrls: ['./cometchat-create-poll.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatCreatePollComponent implements OnInit, OnDestroy, AfterViewInit {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Injected Services ====================

  /** MessageComposerService for creating polls via extension API */
  private messageComposerService = inject(MessageComposerService);

  /** ElementRef for focus trap implementation */
  private elementRef = inject(ElementRef);

  // ==================== View Children ====================

  /** Reference to the modal container for focus management */
  @ViewChild('modalContainer') modalContainer!: ElementRef<HTMLDivElement>;

  /** Reference to the close button for initial focus */
  @ViewChild('closeButton') closeButton!: ElementRef<HTMLButtonElement>;

  // ==================== Focus Trap State ====================

  /** Element that had focus before modal opened (for focus restoration) */
  private previouslyFocusedElement: HTMLElement | null = null;

  /** All focusable elements within the modal */
  private focusableElements: HTMLElement[] = [];

  /** Selector for focusable elements */
  private readonly FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // ==================== Host Listeners ====================

  /**
   * Handles Escape key press to close the modal.
   * @see Requirement 7.3
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.onCloseClick();
  }

  /**
   * Handles Tab key for focus trap.
   * @see Requirements 7.1, 1.23
   */
  @HostListener('keydown.tab', ['$event'])
  onTabKey(event: Event): void {
    this.handleTabKey(event as KeyboardEvent);
  }

  /**
   * Handles Shift+Tab key for focus trap.
   * @see Requirements 7.1, 1.23
   */
  @HostListener('keydown.shift.tab', ['$event'])
  onShiftTabKey(event: Event): void {
    this.handleTabKey(event as KeyboardEvent, true);
  }

  // ==================== Inputs ====================

  /** Title for the poll creation form */
  @Input() title?: string;

  /** User to send poll to (for 1-on-1 conversations) */
  @Input() user?: CometChat.User;

  /** Group to send poll to (for group conversations) */
  @Input() group?: CometChat.Group;

  /** Message to reply to (for quoted replies) */
  @Input() replyToMessage?: CometChat.BaseMessage;

  /** Default number of answer options (minimum 2) */
  @Input() defaultAnswers = 2;

  /** Placeholder text for question input */
  @Input() questionPlaceholderText?: string;

  /** Placeholder text for answer inputs */
  @Input() answerPlaceholderText?: string;

  /** Help text for answers section */
  @Input() answerHelpText?: string;

  /** Text for add option button */
  @Input() addAnswerText?: string;

  /** Text for create button */
  @Input() createPollButtonText?: string;

  // ==================== Outputs ====================

  /** Emitted when close button is clicked */
  @Output() closeClick = new EventEmitter<void>();

  /** Emitted when poll is created successfully */
  @Output() pollCreated = new EventEmitter<void>();

  /** Emitted when an error occurs */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  // ==================== Internal State ====================

  /** Poll question text */
  question = signal<string>('');

  /** Array of poll options */
  options = signal<PollOption[]>([]);

  /** Whether poll creation is in progress */
  isLoading = signal<boolean>(false);

  /** Error message to display */
  errorMessage = signal<string>('');

  /** Whether create button should be enabled */
  canCreate = computed(() => {
    const q = this.question().trim();
    const opts = this.options().filter(o => o.value.trim() !== '');
    return q.length > 0 && opts.length >= 2 && !this.isLoading();
  });

  /** Whether add option button should be disabled */
  isAddDisabled = computed(() => this.options().length >= 12);

  /** Maximum options reached message */
  limitMessage = computed(() =>
    this.options().length >= 12 ? CometChatLocalize.getLocalizedString('polls_limit_reached') : ''
  );

  // ==================== Lifecycle ====================

  ngOnInit(): void {
    // Store the currently focused element for focus restoration
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Initialize options array with default number of options
    this.initializeOptions();
  }

  ngAfterViewInit(): void {
    // Set up focus trap after view is initialized
    this.updateFocusableElements();

    // Set initial focus to the close button
    // Use setTimeout to ensure the modal is fully rendered
    this.pendingTimers.push(setTimeout(() => {
      if (this.closeButton?.nativeElement) {
        this.closeButton.nativeElement.focus();
      }
    }, 0));
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    // Return focus to the previously focused element
    // @see Requirement 7.2
    this.returnFocusToPreviousElement();
  }

  // ==================== Focus Trap Methods ====================

  /**
   * Updates the list of focusable elements within the modal.
   * Should be called when the modal content changes (e.g., options added/removed).
   */
  private updateFocusableElements(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    const focusable = element.querySelectorAll<HTMLElement>(this.FOCUSABLE_SELECTOR);
    this.focusableElements = Array.from(focusable).filter(
      el => el.offsetParent !== null // Filter out hidden elements
    );
  }

  /**
   * Handles Tab key navigation to implement focus trap.
   * @param event - The keyboard event
   * @param isShiftTab - Whether Shift+Tab was pressed
   * @see Requirements 7.1, 1.23
   */
  private handleTabKey(event: KeyboardEvent, isShiftTab = false): void {
    // Update focusable elements in case the DOM has changed
    this.updateFocusableElements();

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (isShiftTab) {
      // If on first element and pressing Shift+Tab, wrap to last element
      if (activeElement === firstElement || !this.focusableElements.includes(activeElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // If on last element and pressing Tab, wrap to first element
      if (activeElement === lastElement || !this.focusableElements.includes(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Returns focus to the element that was focused before the modal opened.
   * @see Requirement 7.2
   */
  private returnFocusToPreviousElement(): void {
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      // Use setTimeout to ensure focus is returned after the modal is fully closed
      this.pendingTimers.push(setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0));
    }
  }

  // ==================== Private Methods ====================

  /**
   * Initializes the options array with the default number of empty options.
   */
  private initializeOptions(): void {
    const initialOptions: PollOption[] = [];
    const count = Math.max(2, this.defaultAnswers);
    for (let i = 0; i < count; i++) {
      initialOptions.push({
        id: this.generateUniqueId(),
        value: '',
      });
    }
    this.options.set(initialOptions);
  }

  /**
   * Generates a unique ID for poll options.
   */
  private generateUniqueId(): string {
    return `option-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // ==================== Public Methods ====================

  /**
   * Handles close button click.
   * Emits closeClick event.
   */
  onCloseClick(): void {
    this.closeClick.emit();
  }

  /**
   * Handles question input change.
   * @param value - The new question value
   */
  onQuestionChange(value: string): void {
    this.question.set(value);
    // Clear error when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  /**
   * Handles option value change.
   * @param index - The index of the option to update
   * @param value - The new option value
   */
  onOptionChange(index: number, value: string): void {
    this.updateOption(index, value);
    // Clear error when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  /**
   * Updates an option value.
   * @param index - The index of the option to update
   * @param value - The new option value
   */
  updateOption(index: number, value: string): void {
    const currentOptions = [...this.options()];
    if (currentOptions[index]) {
      currentOptions[index] = { ...currentOptions[index], value };
      this.options.set(currentOptions);
    }
  }

  /**
   * Adds a new empty option to the poll.
   * Maximum 12 options allowed.
   * @see Requirements 1.4, 1.5
   */
  addOption(): void {
    if (this.options().length >= 12) {
      return;
    }
    const currentOptions = [...this.options()];
    currentOptions.push({
      id: this.generateUniqueId(),
      value: '',
    });
    this.options.set(currentOptions);

    // Update focusable elements after DOM change
    this.pendingTimers.push(setTimeout(() => {
      this.updateFocusableElements();
      // Focus the newly added input
      const inputs = this.elementRef.nativeElement.querySelectorAll(
        '.cometchat-create-poll__option-input'
      );
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      if (lastInput) {
        lastInput.focus();
      }
    }, 0));
  }

  /**
   * Removes an option from the poll.
   * Minimum 2 options required.
   * @param index - The index of the option to remove
   * @see Requirements 1.7, 1.8
   */
  removeOption(index: number): void {
    if (this.options().length <= 2) {
      return;
    }
    const currentOptions = [...this.options()];
    currentOptions.splice(index, 1);
    this.options.set(currentOptions);

    // Update focusable elements after DOM change
    this.pendingTimers.push(setTimeout(() => {
      this.updateFocusableElements();
      // Focus the previous option input or the first one if we removed the first
      const inputs = this.elementRef.nativeElement.querySelectorAll(
        '.cometchat-create-poll__option-input'
      );
      const focusIndex = Math.min(index, inputs.length - 1);
      const inputToFocus = inputs[focusIndex] as HTMLInputElement;
      if (inputToFocus) {
        inputToFocus.focus();
      }
    }, 0));
  }

  /**
   * Determines if the remove button should be shown for an option.
   * Only show remove button when there are more than 2 options.
   * @param _index - The index of the option (unused, kept for template compatibility)
   * @returns Whether to show the remove button
   * @see Requirement 1.7
   */
  canRemoveOption(_index: number): boolean {
    return this.options().length > 2;
  }

  /**
   * Handles create poll button click.
   * Validates input and creates the poll.
   * @see Requirements 1.9, 1.10, 1.11, 1.12, 1.15, 1.16, 1.17
   */
  async onCreateClick(): Promise<void> {
    // Validate question
    const questionText = this.question().trim();
    if (!questionText) {
      this.errorMessage.set(CometChatLocalize.getLocalizedString('polls_required_fields_warning'));
      return;
    }

    // Validate options (at least 2 non-empty)
    const validOptions = this.getValidOptions();
    if (validOptions.length < 2) {
      this.errorMessage.set(CometChatLocalize.getLocalizedString('polls_required_fields_warning'));
      return;
    }

    // Determine receiver
    const receiver = this.user || this.group;
    if (!receiver) {
      this.errorMessage.set(CometChatLocalize.getLocalizedString('polls_error'));
      return;
    }

    const receiverId = this.user ? this.user.getUid() : this.group!.getGuid();
    const receiverType = this.user ? 'user' : 'group';
    const quotedMessageId = this.replyToMessage?.getId();

    // Set loading state
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.messageComposerService.createPoll(
        questionText,
        validOptions,
        receiverId,
        receiverType,
        quotedMessageId
      );

      // Success - emit event and close
      this.pollCreated.emit();
    } catch (error) {
      // Handle error
      this.errorMessage.set(CometChatLocalize.getLocalizedString('polls_error'));
      this.error.emit(this.toCometchatException(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Converts an unknown error to CometChat.CometChatException
   * @param error - The error to convert
   * @returns CometChat.CometChatException
   */
  private toCometchatException(error: unknown): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) {
      return error;
    }
    return new CometChat.CometChatException({
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }

  /**
   * Gets the valid (non-empty) options.
   * @returns Array of non-empty option values
   */
  getValidOptions(): string[] {
    return this.options()
      .map(o => o.value.trim())
      .filter(v => v !== '');
  }

  /**
   * Track by function for ngFor optimization.
   * @param _index - The index of the item (unused)
   * @param option - The poll option
   * @returns The unique ID of the option
   */
  trackByOptionId(_index: number, option: PollOption): string {
    return option.id;
  }
}
