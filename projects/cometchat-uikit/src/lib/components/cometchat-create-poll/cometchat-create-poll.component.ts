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
import { PollOption } from './cometchat-create-poll.types';

export type { PollOption };

/**
 * CometChatCreatePoll is a modal component for creating poll messages (2-12 options).
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
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];
  private messageComposerService = inject(MessageComposerService);
  private elementRef = inject(ElementRef);

  @ViewChild('modalContainer') modalContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('closeButton') closeButton!: ElementRef<HTMLButtonElement>;

  private previouslyFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private readonly FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void { event.preventDefault(); event.stopPropagation(); this.onCloseClick(); }

  @HostListener('keydown.tab', ['$event'])
  onTabKey(event: Event): void { this.handleTabKey(event as KeyboardEvent); }

  @HostListener('keydown.shift.tab', ['$event'])
  onShiftTabKey(event: Event): void { this.handleTabKey(event as KeyboardEvent, true); }

  @Input() title?: string;
  @Input() user?: CometChat.User;
  @Input() group?: CometChat.Group;
  @Input() replyToMessage?: CometChat.BaseMessage;
  @Input() defaultAnswers = 2;
  @Input() questionPlaceholderText?: string;
  @Input() answerPlaceholderText?: string;
  @Input() answerHelpText?: string;
  @Input() addAnswerText?: string;
  @Input() createPollButtonText?: string;

  @Output() closeClick = new EventEmitter<void>();
  @Output() pollCreated = new EventEmitter<void>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  question = signal<string>('');
  options = signal<PollOption[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  canCreate = computed(() => {
    const q = this.question().trim();
    const opts = this.options().filter(o => o.value.trim() !== '');
    return q.length > 0 && opts.length >= 2 && !this.isLoading();
  });
  isAddDisabled = computed(() => this.options().length >= 12);
  limitMessage = computed(() =>
    this.options().length >= 12 ? CometChatLocalize.getLocalizedString('polls_limit_reached') : ''
  );

  ngOnInit(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    this.initializeOptions();
  }

  ngAfterViewInit(): void {
    this.updateFocusableElements();
    this.pendingTimers.push(setTimeout(() => { this.closeButton?.nativeElement?.focus(); }, 0));
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.returnFocusToPreviousElement();
  }

  private updateFocusableElements(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    const focusable = element.querySelectorAll<HTMLElement>(this.FOCUSABLE_SELECTOR);
    this.focusableElements = Array.from(focusable).filter(el => el.offsetParent !== null);
  }

  private handleTabKey(event: KeyboardEvent, isShiftTab = false): void {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) { event.preventDefault(); return; }
    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;
    if (isShiftTab) {
      if (activeElement === firstElement || !this.focusableElements.includes(activeElement)) { event.preventDefault(); lastElement.focus(); }
    } else {
      if (activeElement === lastElement || !this.focusableElements.includes(activeElement)) { event.preventDefault(); firstElement.focus(); }
    }
  }

  private returnFocusToPreviousElement(): void {
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.pendingTimers.push(setTimeout(() => { this.previouslyFocusedElement?.focus(); }, 0));
    }
  }

  private initializeOptions(): void {
    const initialOptions: PollOption[] = [];
    const count = Math.max(2, this.defaultAnswers);
    for (let i = 0; i < count; i++) {
      initialOptions.push({ id: this.generateUniqueId(), value: '' });
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
