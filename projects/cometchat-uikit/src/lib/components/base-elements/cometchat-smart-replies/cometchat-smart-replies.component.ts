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
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

/**
 * Maximum number of smart replies to display.
 * @see Requirement 2.5 - Display up to 3 reply suggestions
 */
const MAX_REPLIES = 3;

/**
 * CometChatSmartRepliesComponent displays AI-generated reply suggestions.
 *
 * This component shows up to 3 smart reply suggestions based on the last received message.
 * It supports configurable trigger keywords and delay duration before showing suggestions.
 *
 * Features:
 * - Displays up to 3 reply suggestions as clickable chips
 * - Configurable trigger keywords (default: what, when, why, who, where, how, ?)
 * - Configurable delay before showing (default: 10 seconds)
 * - Loading state while fetching suggestions
 * - Keyboard accessible (Tab navigation, Enter/Space to select)
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <cometchat-smart-replies
 *   [message]="lastReceivedMessage"
 *   [user]="activeUser"
 *   (replyClick)="onSmartReplyClick($event)">
 * </cometchat-smart-replies>
 *
 * <!-- With custom keywords and delay -->
 * <cometchat-smart-replies
 *   [message]="lastReceivedMessage"
 *   [user]="activeUser"
 *   [keywords]="['help', 'question', '?']"
 *   [delayDuration]="5000"
 *   (replyClick)="onSmartReplyClick($event)">
 * </cometchat-smart-replies>
 * ```
 *
 * @see Requirement 2.1 - Display smart reply suggestions when showSmartReplies is true
 * @see Requirement 2.3 - Only appear for messages containing trigger keywords
 * @see Requirement 2.4 - Appear after configurable delay (default 10 seconds)
 * @see Requirement 2.5 - Display up to 3 reply suggestions
 * @see Requirement 2.6 - Emit smartReplyClick event when clicked
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
  /**
   * Reference to the LiveAnnouncerService for screen reader announcements.
   * @see Requirement 24.6 - Announce "Smart replies available" when component appears
   */
  private liveAnnouncer = inject(LiveAnnouncerService);

  /**
   * Reference to reply button elements for keyboard navigation.
   */
  @ViewChildren('replyButton') replyButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  /**
   * Currently focused reply index for keyboard navigation.
   * @see Requirement 24.2 - ArrowRight/ArrowLeft navigation
   */
  focusedIndex = signal(0);

  /**
   * The message to generate replies for.
   * Smart replies are generated based on this message's content.
   *
   * @see Requirement 2.2 - Generated based on the last received message
   */
  @Input() message?: CometChat.BaseMessage;

  /**
   * The user context for generating smart replies.
   * Required for 1-on-1 conversations.
   */
  @Input() user?: CometChat.User;

  /**
   * The group context for generating smart replies.
   * Required for group conversations.
   */
  @Input() group?: CometChat.Group;

  /**
   * Keywords that trigger smart replies.
   * If the message contains any of these keywords, smart replies will be shown.
   * An empty array means smart replies will be shown for all messages.
   *
   * @default ['what', 'when', 'why', 'who', 'where', 'how', '?']
   * @see Requirement 2.3 - Only appear for messages containing trigger keywords
   */
  @Input() keywords: string[] = ['what', 'when', 'why', 'who', 'where', 'how', '?'];

  /**
   * Delay in milliseconds before showing smart replies.
   * This gives users time to start typing their own response.
   * Set to 0 to fetch smart replies instantly without delay.
   *
   * @default 10000 (10 seconds)
   * @see Requirement 2.4 - Appear after configurable delay
   */
  @Input() delayDuration = 10000;

  /**
   * Emitted when a smart reply is clicked.
   * The event payload is the reply text that was clicked.
   *
   * @see Requirement 2.6 - Emit smartReplyClick event when clicked
   */
  @Output() replyClick = new EventEmitter<string>();

  /**
   * Emitted when the close button is clicked.
   */
  @Output() closeClick = new EventEmitter<void>();

  /**
   * Loading state signal.
   * True when fetching smart replies from the AI extension.
   */
  isLoading = signal(false);

  /**
   * Generated replies signal.
   * Contains up to 3 reply suggestions.
   *
   * @see Requirement 2.5 - Display up to 3 reply suggestions
   */
  replies = signal<string[]>([]);

  /**
   * Error state signal.
   * True when there was an error fetching smart replies.
   */
  hasError = signal(false);

  /**
   * Timeout ID for the delay timer.
   * Used to cancel the timer when component is destroyed or message changes.
   */
  private delayTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Handles changes to input properties.
   * Resets state and starts delay timer when message changes.
   *
   * @see Requirement 2.4 - Appear after configurable delay
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.resetState();
      this.startDelayTimer();
    }
  }

  /**
   * Announces smart replies availability after view is initialized.
   * @see Requirement 24.6 - Announce "Smart replies available" when component appears
   */
  ngAfterViewInit(): void {
    // Subscribe to changes in replies to announce when they become available
    // This is handled in fetchSmartReplies after replies are set
  }

  /**
   * Cleanup on component destruction.
   * Clears any pending timeout.
   */
  ngOnDestroy(): void {
    this.clearDelayTimeout();
  }

  /**
   * Handles click on a smart reply.
   * Emits the replyClick event with the selected reply text.
   *
   * @param reply - The reply text that was clicked
   * @see Requirement 2.6 - Emit smartReplyClick event when clicked
   */
  onReplyClick(reply: string): void {
    this.replyClick.emit(reply);
  }
  /**
   * Handles close button click.
   * Emits the closeClick event.
   */
  onCloseClick(): void {
    this.closeClick.emit();
  }

  /**
   * Handles keyboard events on reply items.
   * Supports Enter and Space keys for selection, ArrowLeft/ArrowRight for navigation.
   *
   * @param event - The keyboard event
   * @param reply - The reply text
   * @param index - The index of the reply in the list
   * @see Requirement 24.2 - ArrowRight/ArrowLeft navigation with wrap-around
   * @see Requirement 24.3 - Enter/Space to send reply
   */
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
      return 'Loading smart reply suggestions';
    }
    if (count === 0) {
      return 'No smart reply suggestions available';
    }
    return `${count} smart reply suggestion${count > 1 ? 's' : ''} available`;
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
      console.warn('[CometChatSmartReplies] No user or group provided for smart replies');
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
      console.error('[CometChatSmartReplies] Error fetching smart replies:', error);
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
