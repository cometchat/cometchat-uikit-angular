import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  OnDestroy,
  OnInit,
  AfterViewInit,
  inject,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatUIKitConstants } from '../../../constants';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

/**
 * Maximum number of conversation starters to display.
 * @see Requirement 3.2 - Display up to 4 starter suggestions
 */
const MAX_STARTERS = 4;

/**
 * CometChatConversationStarterComponent displays AI-generated conversation starter suggestions.
 *
 * This component shows up to 4 conversation starter suggestions for new or empty conversations.
 * It integrates with the CometChat AI extension to generate contextual prompts.
 *
 * Features:
 * - Displays up to 4 starter suggestions as clickable chips
 * - Loading state while fetching suggestions
 * - Error state handling
 * - Keyboard accessible (Tab navigation, Enter/Space to select)
 * - ArrowLeft/ArrowRight navigation with wrap-around
 * - Screen reader announcements when starters appear
 * - Full ARIA accessibility support
 *
 * @example
 * ```html
 * <!-- Basic usage with user -->
 * <cometchat-conversation-starter
 *   [user]="activeUser"
 *   (starterClick)="onStarterClick($event)">
 * </cometchat-conversation-starter>
 *
 * <!-- Usage with group -->
 * <cometchat-conversation-starter
 *   [group]="activeGroup"
 *   (starterClick)="onStarterClick($event)">
 * </cometchat-conversation-starter>
 * ```
 *
 * @see Requirement 3.1 - Display conversation starters when showConversationStarters is true and conversation is empty
 * @see Requirement 3.2 - Display up to 4 starter suggestions
 * @see Requirement 3.3 - Emit conversationStarterClick event when clicked
 * @see Requirement 3.7 - Display loading state while fetching suggestions
 * @see Requirement 25.1 - Container focusable via Tab navigation
 * @see Requirement 25.2 - ArrowRight/ArrowLeft navigation between options
 * @see Requirement 25.3 - Enter/Space to send message
 * @see Requirement 25.4 - role="group" and aria-label="Conversation starters"
 * @see Requirement 25.5 - aria-label with starter text on each button
 * @see Requirement 25.6 - Announce "Conversation starters available" when component appears
 */
@Component({
  selector: 'cometchat-conversation-starter',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-conversation-starter.component.html',
  styleUrls: ['./cometchat-conversation-starter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationStarterComponent implements OnInit, OnDestroy, AfterViewInit {
  /**
   * Reference to the LiveAnnouncerService for screen reader announcements.
   * @see Requirement 25.6 - Announce "Conversation starters available" when component appears
   */
  private liveAnnouncer = inject(LiveAnnouncerService);

  /**
   * Reference to starter button elements for keyboard navigation.
   */
  @ViewChildren('starterButton') starterButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  /**
   * Currently focused starter index for keyboard navigation.
   * @see Requirement 25.2 - ArrowRight/ArrowLeft navigation
   */
  focusedIndex = signal(0);

  /**
   * The user context for generating conversation starters.
   * Required for 1-on-1 conversations.
   */
  @Input() user?: CometChat.User;

  /**
   * The group context for generating conversation starters.
   * Required for group conversations.
   */
  @Input() group?: CometChat.Group;

  /**
   * Emitted when a conversation starter is clicked.
   * The event payload is the starter text that was clicked.
   *
   * @see Requirement 3.3 - Emit conversationStarterClick event when clicked
   */
  @Output() starterClick = new EventEmitter<string>();

  /**
   * Loading state signal.
   * True when fetching conversation starters from the AI extension.
   *
   * @see Requirement 3.7 - Display loading state while fetching suggestions
   */
  isLoading = signal(false);

  /**
   * Generated starters signal.
   * Contains up to 4 starter suggestions.
   *
   * @see Requirement 3.2 - Display up to 4 starter suggestions
   */
  starters = signal<string[]>([]);

  /**
   * Error state signal.
   * True when there was an error fetching conversation starters.
   */
  hasError = signal(false);

  /**
   * Initializes the component and fetches conversation starters.
   */
  ngOnInit(): void {
    this.fetchConversationStarters();
  }

  /**
   * Announces conversation starters availability after view is initialized.
   * @see Requirement 25.6 - Announce "Conversation starters available" when component appears
   */
  ngAfterViewInit(): void {
    // Announcement is handled in fetchConversationStarters after starters are loaded
  }

  /**
   * Cleanup on component destruction.
   */
  ngOnDestroy(): void {
    // Reset state on destruction
    this.reset();
  }

  /**
   * Handles click on a conversation starter.
   * Emits the starterClick event with the selected starter text.
   *
   * @param starter - The starter text that was clicked
   * @see Requirement 3.3 - Emit conversationStarterClick event when clicked
   */
  onStarterClick(starter: string): void {
    this.starterClick.emit(starter);
  }

  /**
   * Handles keyboard events on starter items.
   * Supports Enter and Space keys for selection, ArrowLeft/ArrowRight for navigation.
   *
   * @param event - The keyboard event
   * @param starter - The starter text
   * @param index - The index of the starter in the list
   * @see Requirement 25.2 - ArrowRight/ArrowLeft navigation with wrap-around
   * @see Requirement 25.3 - Enter/Space to send message
   */
  onStarterKeydown(event: KeyboardEvent, starter: string, index: number): void {
    const startersCount = this.starters().length;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onStarterClick(starter);
        break;

      case 'ArrowRight':
        event.preventDefault();
        // Move to next starter with wrap-around
        const nextIndex = (index + 1) % startersCount;
        this.focusStarter(nextIndex);
        break;

      case 'ArrowLeft':
        event.preventDefault();
        // Move to previous starter with wrap-around
        const prevIndex = (index - 1 + startersCount) % startersCount;
        this.focusStarter(prevIndex);
        break;

      case 'Home':
        event.preventDefault();
        this.focusStarter(0);
        break;

      case 'End':
        event.preventDefault();
        this.focusStarter(startersCount - 1);
        break;
    }
  }

  /**
   * Focuses a starter button by index.
   * Updates the focused index and moves DOM focus.
   *
   * @param index - The index of the starter to focus
   */
  private focusStarter(index: number): void {
    this.focusedIndex.set(index);
    const buttons = this.starterButtons?.toArray();
    if (buttons && buttons[index]) {
      buttons[index].nativeElement.focus();
    }
  }

  /**
   * Gets the tabindex for a starter button based on roving tabindex pattern.
   * Only the focused starter has tabindex="0", others have tabindex="-1".
   *
   * @param index - The index of the starter
   * @returns 0 if focused, -1 otherwise
   * @see Requirement 25.1 - Container focusable via Tab navigation
   */
  getStarterTabIndex(index: number): number {
    return index === this.focusedIndex() ? 0 : -1;
  }

  /**
   * Handles focus event on a starter button.
   * Updates the focused index when a button receives focus.
   *
   * @param index - The index of the focused starter
   */
  onStarterFocus(index: number): void {
    this.focusedIndex.set(index);
  }

  /**
   * Checks if there are any starters to display.
   */
  get hasStarters(): boolean {
    return this.starters().length > 0;
  }

  /**
   * Checks if the component should be visible.
   * Shows when loading, has starters, or has error.
   */
  get isVisible(): boolean {
    return this.isLoading() || this.hasStarters || this.hasError();
  }

  /**
   * Generates an accessible label for the conversation starters container.
   */
  get ariaLabel(): string {
    const count = this.starters().length;
    if (this.isLoading()) {
      return 'Loading conversation starter suggestions';
    }
    if (count === 0) {
      return 'No conversation starter suggestions available';
    }
    return `${count} conversation starter suggestion${count > 1 ? 's' : ''} available`;
  }

  /**
   * Fetches conversation starters from the CometChat AI extension.
   *
   * Sets loading state, calls the API, and updates the starters signal.
   * Limits results to 4 starters as per requirement.
   * Handles errors gracefully by setting the error state.
   * Announces availability to screen readers when starters are loaded.
   *
   * @see Requirement 3.2 - Display up to 4 starter suggestions
   * @see Requirement 3.6 - Use the CometChat AI extension for generation
   * @see Requirement 3.7 - Display loading state while fetching suggestions
   * @see Requirement 25.6 - Announce "Conversation starters available" when component appears
   */
  async fetchConversationStarters(): Promise<void> {
    // Determine receiver ID and type
    const receiverId = this.user?.getUid() || this.group?.getGuid();
    const receiverType = this.user
      ? CometChatUIKitConstants.MessageReceiverType.user
      : CometChatUIKitConstants.MessageReceiverType.group;

    if (!receiverId) {
      console.warn(
        '[CometChatConversationStarter] No user or group provided for conversation starters'
      );
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      // Call CometChat AI extension to get conversation starters
      const response = await CometChat.getConversationStarter(receiverId, receiverType);

      // Convert response to array of starter strings
      // The API returns an array of strings or an object with starter keys
      let startersArray: string[];
      if (Array.isArray(response)) {
        startersArray = response;
      } else if (typeof response === 'object' && response !== null) {
        startersArray = Object.values(response as Record<string, string>);
      } else {
        startersArray = [];
      }

      // Limit to MAX_STARTERS (4) as per requirement 3.2
      const limitedStarters = startersArray.slice(0, MAX_STARTERS);

      this.starters.set(limitedStarters);

      // Reset focused index when new starters are loaded
      this.focusedIndex.set(0);

      // Announce conversation starters availability to screen readers
      if (limitedStarters.length > 0) {
        this.liveAnnouncer.announce(
          CometChatLocalize.getLocalizedString('accessibility_conversation_starters_available'),
          'polite'
        );
      }
    } catch (error) {
      console.error('[CometChatConversationStarter] Error fetching conversation starters:', error);
      this.hasError.set(true);
      this.starters.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Resets the component state.
   * Can be called externally to refresh starters.
   */
  reset(): void {
    this.starters.set([]);
    this.hasError.set(false);
    this.isLoading.set(false);
  }

  /**
   * Refreshes the conversation starters by fetching new ones.
   */
  refresh(): void {
    this.reset();
    this.fetchConversationStarters();
  }
}
