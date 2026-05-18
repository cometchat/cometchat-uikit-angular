import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatUIKitConstants } from '../../../constants';
import { CometChatLogger } from '../../../utils/CometChatLogger';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

/** Maximum number of smart replies to display. @see Requirement 2.5 */
const MAX_REPLIES = 3;

/**
 * CometChatSmartRepliesComponent displays up to 3 AI-generated reply suggestions.
 * @see Requirements 2.1, 2.3-2.6
 */
@Component({
  selector: 'cometchat-smart-replies',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-smart-replies.component.html',
  styleUrls: ['./cometchat-smart-replies.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatSmartRepliesComponent implements OnDestroy, OnChanges, AfterViewInit {
  private liveAnnouncer = inject(LiveAnnouncerService);

  @ViewChildren('replyButton') replyButtons!: QueryList<ElementRef<HTMLButtonElement>>;
  focusedIndex = signal(0);

  @Input() message?: CometChat.BaseMessage;
  @Input() user?: CometChat.User;
  @Input() group?: CometChat.Group;
  @Input() keywords: string[] = ['what', 'when', 'why', 'who', 'where', 'how', '?'];
  @Input() delayDuration = 10000;

  @Output() replyClick = new EventEmitter<string>();
  @Output() closeClick = new EventEmitter<void>();

  isLoading = signal(false);
  replies = signal<string[]>([]);
  hasError = signal(false);

  private delayTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) { this.resetState(); this.startDelayTimer(); }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void { this.clearDelayTimeout(); }

  onReplyClick(reply: string): void { this.replyClick.emit(reply); }
  onCloseClick(): void { this.closeClick.emit(); }

  /** Handle keyboard events on reply items. @see Requirements 24.2, 24.3 */
  onReplyKeydown(event: KeyboardEvent, reply: string, index: number): void {
    const repliesCount = this.replies().length;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onReplyClick(reply);
        break;
      case 'ArrowRight':
        event.preventDefault();
        // Move to next reply with wrap-around
        const nextIndex = (index + 1) % repliesCount;
        this.focusReply(nextIndex);
        break;

      case 'ArrowLeft':
        event.preventDefault();
        // Move to previous reply with wrap-around
        const prevIndex = (index - 1 + repliesCount) % repliesCount;
        this.focusReply(prevIndex);
        break;

      case 'Home':
        event.preventDefault();
        this.focusReply(0);
        break;

      case 'End':
        event.preventDefault();
        this.focusReply(repliesCount - 1);
        break;
    }
  }

  /**
   * Focuses a reply button by index.
   * Updates the focused index and moves DOM focus.
   *
   * @param index - The index of the reply to focus
   */
  private focusReply(index: number): void {
    this.focusedIndex.set(index);
    const buttons = this.replyButtons?.toArray();
    if (buttons && buttons[index]) {
      buttons[index].nativeElement.focus();
    }
  }

  /**
   * Gets the tabindex for a reply button based on roving tabindex pattern.
   * Only the focused reply has tabindex="0", others have tabindex="-1".
   *
   * @param index - The index of the reply
   * @returns 0 if focused, -1 otherwise
   */
  getReplyTabIndex(index: number): number {
    return index === this.focusedIndex() ? 0 : -1;
  }

  /**
   * Handles focus event on a reply button.
   * Updates the focused index when a button receives focus.
   *
   * @param index - The index of the focused reply
   */
  onReplyFocus(index: number): void {
    this.focusedIndex.set(index);
  }

  /**
   * Checks if there are any replies to display.
   */
  get hasReplies(): boolean {
    return this.replies().length > 0;
  }

  /**
   * Checks if the component should be visible.
   * Shows when loading, has replies, or has error.
   */
  get isVisible(): boolean {
    return this.isLoading() || this.hasReplies || this.hasError();
  }

  /**
   * Generates an accessible label for the smart replies container.
   */
  get ariaLabel(): string {
    const count = this.replies().length;
    if (this.isLoading()) {
      return CometChatLocalize.getLocalizedString('accessibility_loading');
    }
    if (count === 0) {
      return CometChatLocalize.getLocalizedString('accessibility_no_results');
    }
    return CometChatLocalize.getLocalizedString('accessibility_smart_replies');
  }

  /**
   * Determines if smart replies should be shown for the current message.
   *
   * Returns false if:
   * - No message is provided
   * - Message is not a text message
   *
   * Returns true if:
   * - Keywords array is empty (show for all messages)
   * - Message text contains any of the keywords (case-insensitive)
   *
   * @returns True if smart replies should be shown, false otherwise
   * @see Requirement 2.2 - Generated based on the last received message
   * @see Requirement 2.3 - Only appear for messages containing trigger keywords
   */
  shouldShowSmartReplies(): boolean {
    // Return false if no message
    if (!this.message) {
      return false;
    }

    // Return false if message is not a text message
    if (!(this.message instanceof CometChat.TextMessage)) {
      return false;
    }

    // Return true if keywords array is empty (show for all messages)
    if (!this.keywords || this.keywords.length === 0) {
      return true;
    }

    // Get message text in lowercase for case-insensitive matching
    const messageText = (this.message as CometChat.TextMessage).getText()?.toLowerCase() || '';

    // Check if message contains any of the keywords
    // Escape special regex characters in keywords, but handle '?' specially
    const escapedKeywords = this.keywords.map((word: string) =>
      word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    );

    // Build regex pattern: word boundaries for regular words, direct match for '?'
    const regularKeywords = escapedKeywords.filter(word => word !== '\\?');
    const hasQuestionMark = this.keywords.includes('?');

    let pattern = '';
    if (regularKeywords.length > 0) {
      pattern = `(?:\\b(${regularKeywords.join('|')})\\b)`;
    }
    if (hasQuestionMark) {
      pattern = pattern ? `${pattern}|\\?` : '\\?';
    }

    if (!pattern) {
      return false;
    }

    const regex = new RegExp(pattern, 'i');
    return regex.test(messageText);
  }

  /**
   * Fetches smart replies from the CometChat AI extension.
   *
   * Sets loading state, calls the API, and updates the replies signal.
   * Limits results to 3 replies as per requirement.
   * Handles errors gracefully by setting the error state.
   * Announces availability to screen readers when replies are loaded.
   *
   * @see Requirement 2.5 - Display up to 3 reply suggestions
   * @see Requirement 2.9 - Use the CometChat AI extension for generation
   * @see Requirement 24.6 - Announce "Smart replies available" when component appears
   */
  async fetchSmartReplies(): Promise<void> {
    // Determine receiver ID and type
    const receiverId = this.user?.getUid() || this.group?.getGuid();
    const receiverType = this.user
      ? CometChatUIKitConstants.MessageReceiverType.user
      : CometChatUIKitConstants.MessageReceiverType.group;

    if (!receiverId) {
      CometChatLogger.warn('CometChatSmartReplies', 'No user or group provided for smart replies');
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      // Call CometChat AI extension to get smart replies
      const response = await CometChat.getSmartReplies(receiverId, receiverType);

      // Convert response object to array of reply strings
      // The API returns an object with reply keys, we need the values
      const repliesArray = Object.values(response as Record<string, string>);

      // Limit to MAX_REPLIES (3) as per requirement 2.5
      const limitedReplies = repliesArray.slice(0, MAX_REPLIES);

      this.replies.set(limitedReplies);

      // Reset focused index when new replies are loaded
      this.focusedIndex.set(0);

      // Announce smart replies availability to screen readers
      if (limitedReplies.length > 0) {
        this.liveAnnouncer.announce(
          CometChatLocalize.getLocalizedString('accessibility_smart_replies_available'),
          'polite'
        );
      }
    } catch (error) {
      CometChatLogger.error('CometChatSmartReplies', 'Error fetching smart replies:', error);
      this.hasError.set(true);
      this.replies.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Starts the delay timer for showing smart replies.
   *
   * Checks if smart replies should be shown, then starts a timer.
   * When the timer fires, fetches smart replies from the AI extension.
   *
   * @see Requirement 2.4 - Appear after configurable delay (default 10 seconds)
   */
  private startDelayTimer(): void {
    // Check if smart replies should be shown
    if (!this.shouldShowSmartReplies()) {
      return;
    }

    // If delay is 0, fetch immediately
    if (this.delayDuration === 0) {
      this.fetchSmartReplies();
      return;
    }

    // Start delay timer
    this.delayTimeoutId = setTimeout(() => {
      this.fetchSmartReplies();
    }, this.delayDuration);
  }

  /**
   * Resets the component state.
   * Called when the message changes.
   */
  private resetState(): void {
    this.clearDelayTimeout();
    this.replies.set([]);
    this.hasError.set(false);
    this.isLoading.set(false);
  }

  /**
   * Clears the delay timeout if one exists.
   */
  private clearDelayTimeout(): void {
    if (this.delayTimeoutId !== null) {
      clearTimeout(this.delayTimeoutId);
      this.delayTimeoutId = null;
    }
  }
}
