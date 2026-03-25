/**
 * CometChatPollBubbleComponent
 *
 * A standalone Angular component that renders poll messages with voting functionality
 * within chat conversations. It extracts poll data from CometChat CustomMessage metadata
 * and displays the poll question, voting options with radio buttons, vote counts,
 * progress bars, and voter avatars.
 *
 * @module components/cometchat-poll-bubble
 * @see Requirements 11.1
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { LiveAnnouncerService } from '../../services/live-announcer.service';

// ============================================================================
// Constants
// ============================================================================

/**
 * Constants for accessing poll data from message metadata.
 * Poll data is stored at the path `@injected.extensions.polls`.
 *
 * @see Requirements 1.3
 */
const POLLS_CONSTANTS = {
  /** Key for injected metadata */
  INJECTED_KEY: '@injected',
  /** Key for extensions within injected metadata */
  EXTENSION_KEY: 'extensions',
  /** Key for polls data within extensions */
  POLLS_KEY: 'polls',
};

// ============================================================================
// Poll Data Interfaces
// ============================================================================

/**
 * Represents voter information for a poll option.
 * Contains the voter's display name and optional avatar URL.
 *
 * @see Requirements 1.6, 1.7
 */
export interface VoterInfo {
  /** Voter's display name */
  name: string;
  /** Voter's avatar URL (optional) */
  avatar?: string;
}

/**
 * Represents the vote result for a single poll option.
 * Contains the vote count and a map of voters who selected this option.
 *
 * @see Requirements 1.5, 1.6
 */
export interface PollOptionResult {
  /** Number of votes for this option */
  count: number;
  /** Map of voter UIDs to voter information */
  voters: Record<string, VoterInfo>;
}

/**
 * Represents the complete poll results including total votes and per-option results.
 *
 * @see Requirements 1.5, 1.6
 */
export interface PollResults {
  /** Total number of votes across all options */
  total: number;
  /** Per-option vote results, keyed by option ID */
  options: Record<string, PollOptionResult>;
}

/**
 * Represents the complete poll data extracted from message metadata.
 * This is the raw poll data structure stored at `@injected.extensions.polls`.
 *
 * @see Requirements 1.3, 1.4, 1.5, 1.6
 */
export interface PollData {
  /** Unique identifier for the poll */
  id: string | number;
  /** The poll question text */
  question: string;
  /** Map of option IDs to option text */
  options: Record<string, string>;
  /** Poll results including total votes and per-option results */
  results: PollResults;
}

/**
 * Represents a processed poll option ready for display in the poll bubble.
 * This is the transformed data structure used for rendering poll options in the UI.
 * Named PollBubbleOption to distinguish from PollOption in cometchat-create-poll.
 *
 * @see Requirements 1.4, 1.5, 1.6, 1.7
 */
export interface PollBubbleOption {
  /** Option identifier */
  id: string;
  /** Option display text */
  text: string;
  /** Number of votes for this option */
  count: number;
  /** Percentage of total votes (e.g., "45%") */
  percent: string;
  /** Whether the logged-in user selected this option */
  selectedByLoggedInUser: boolean;
  /** Array of voter objects (up to 3) for avatar display */
  voters: VoterInfo[];
}

// ============================================================================
// Event Interfaces
// ============================================================================

/**
 * Event emitted when a vote is successfully submitted.
 * Contains information about the poll, selected option, and the message.
 *
 * @see Requirements 14.3
 */
export interface PollVoteEvent {
  /** The poll ID */
  pollId: string | number;
  /** The selected option ID */
  optionId: string;
  /** The selected option text */
  optionText: string;
  /** The message containing the poll */
  message: CometChat.CustomMessage;
}

/**
 * Event emitted when vote submission fails.
 * Contains information about the poll, attempted option, error, and the message.
 *
 * @see Requirements 14.4
 */
export interface PollVoteErrorEvent {
  /** The poll ID */
  pollId: string | number;
  /** The attempted option ID */
  optionId: string;
  /** The error that occurred */
  error: Error;
  /** The message containing the poll */
  message: CometChat.CustomMessage;
}

/**
 * CometChatPollBubbleComponent renders poll messages with voting functionality.
 *
 * @example
 * ```html
 * <cometchat-poll-bubble
 *   [message]="pollMessage"
 *   [alignment]="'left'"
 *   [loggedInUser]="currentUser"
 *   (voteSubmit)="onVoteSubmit($event)"
 *   (voteError)="onVoteError($event)">
 * </cometchat-poll-bubble>
 * ```
 */
@Component({
  selector: 'cometchat-poll-bubble',
  standalone: true,
  templateUrl: './cometchat-poll-bubble.component.html',
  styleUrls: ['./cometchat-poll-bubble.component.css'],
  imports: [CommonModule, TranslatePipe, CometChatRadioButtonComponent, CometChatAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatPollBubbleComponent implements OnInit, OnChanges {
  /**
   * The CometChat CustomMessage containing poll data in its metadata.
   * Poll data is extracted from the path `@injected.extensions.polls`.
   */
  @Input({ required: true }) message!: CometChat.CustomMessage;

  /**
   * Determines the visual styling variant of the poll bubble.
   * LEFT = receiver variant, RIGHT = sender variant.
   * @default MessageBubbleAlignment.left
   * @see Requirements 1.2, 7.1
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /**
   * The currently logged-in user. Used to determine which poll options
   * the user has selected.
   * @see Requirements 1.9
   */
  @Input() loggedInUser?: CometChat.User;

  /**
   * When true, disables all interactive elements (voting).
   * Used in thread header to prevent interaction with the parent message.
   * @default false
   */
  @Input() disableInteraction = false;

  /**
   * Emitted when a vote is successfully submitted.
   * Contains the poll ID, selected option details, and the message.
   */
  @Output() voteSubmit = new EventEmitter<PollVoteEvent>();

  /**
   * Emitted when vote submission fails.
   * Contains the poll ID, attempted option, error details, and the message.
   */
  @Output() voteError = new EventEmitter<PollVoteErrorEvent>();

  /**
   * Emitted after successful vote submission with the updated poll data.
   * Contains the complete poll data including updated vote counts and percentages.
   * @see Requirements 1.6
   */
  @Output() voteUpdate = new EventEmitter<PollData>();

  // ============================================================================
  // Internal State
  // ============================================================================

  /**
   * Parsed poll data extracted from message metadata.
   * Contains the poll question, options, and results.
   * @see Requirements 1.3, 1.4, 1.5, 1.6
   */
  protected pollData: PollData | null = null;

  /**
   * Processed poll options ready for display.
   * Each option includes vote count, percentage, and voter information.
   * @see Requirements 3.1, 3.2, 3.3, 3.4
   */
  protected pollOptions: PollBubbleOption[] = [];

  /**
   * Indicates if a vote submission is currently in progress.
   * Used to prevent multiple simultaneous vote submissions.
   * @see Requirements 6.6
   */
  protected isVoting = false;

  /**
   * Indicates if the poll is an outgoing message (sent by logged-in user).
   * Used to determine sender/receiver styling variant.
   * @see Requirements 7.1, 7.2
   */
  protected isOutgoing = false;

  // ============================================================================
  // Template Exposed Properties
  // ============================================================================

  /** Expose MessageBubbleAlignment enum to template */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  /** LiveAnnouncerService for screen reader announcements */
  private liveAnnouncer = inject(LiveAnnouncerService);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Process message and extract poll data on initialization
    this.processMessage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-process message when inputs change
    if (changes['message']) {
      this.processMessage();
    }

    // Update isOutgoing when alignment changes
    if (changes['alignment']) {
      this.isOutgoing = this.alignment === MessageBubbleAlignment.right;
      this.cdr.markForCheck();
    }

    // Re-process poll options when loggedInUser changes (to update selectedByLoggedInUser)
    if (changes['loggedInUser'] && this.pollData) {
      this.processPollOptions();
      this.cdr.markForCheck();
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Process the message and extract poll data.
   * @private
   */
  private processMessage(): void {
    // Update isOutgoing based on alignment
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;

    // Extract poll data from message metadata
    this.extractPollData();

    // Poll options processing will be implemented in task 2.3
    this.cdr.markForCheck();
  }

  /**
   * Extracts poll data from a CustomMessage's metadata.
   * Poll data is stored at the path `@injected.extensions.polls`.
   *
   * Handles the following error cases gracefully:
   * - Null/undefined message
   * - Missing metadata
   * - Missing @injected key
   * - Missing extensions key
   * - Missing polls key
   * - Malformed poll data
   *
   * @private
   * @see Requirements 1.3, 1.4, 1.5, 1.6, 1.8
   */
  private extractPollData(): void {
    try {
      // Handle null/undefined message gracefully
      if (!this.message) {
        console.warn('[CometChatPollBubble] Message is null or undefined');
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      // Get metadata from message and cast to Record type for indexing
      const metadata = this.message.getMetadata() as Record<string, any> | null;
      if (!metadata) {
        console.warn('[CometChatPollBubble] Message has no metadata');
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      // Extract @injected key
      const injected = metadata[POLLS_CONSTANTS.INJECTED_KEY];
      if (!injected) {
        console.warn('[CometChatPollBubble] No @injected key in metadata');
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      // Extract extensions key
      const extensions = injected[POLLS_CONSTANTS.EXTENSION_KEY];
      if (!extensions) {
        console.warn('[CometChatPollBubble] No extensions key in metadata');
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      // Extract polls data
      const pollsData = extensions[POLLS_CONSTANTS.POLLS_KEY];
      if (!pollsData) {
        console.warn('[CometChatPollBubble] No poll data found in message metadata');
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      // Build PollData object with fallbacks for missing properties
      this.pollData = {
        id: pollsData.id || this.message.getId(),
        question: pollsData.question || '',
        options: pollsData.options || {},
        results: pollsData.results || { total: 0, options: {} },
      };

      // Process poll options after successfully extracting poll data
      this.processPollOptions();
    } catch (error) {
      console.error('[CometChatPollBubble] Error extracting poll data:', error);
      this.pollData = null;
      this.pollOptions = [];
    }
  }

  /**
   * Updates vote counts optimistically before server confirmation.
   * Handles both new votes and vote changes.
   *
   * This method:
   * - Finds if user already voted for another option
   * - Decrements the previous option count if changing vote
   * - Increments the selected option count (only if not already selected)
   * - Updates the poll data with new results
   * - Calls processPollOptions() to update the UI
   *
   * @param selectedOption - The poll option that was selected
   * @private
   * @see Requirements 1.1, 1.3
   */
  private updateVoteOptimistically(selectedOption: PollBubbleOption): void {
    if (!this.pollData) return;

    const loggedInUserUid = this.loggedInUser?.getUid();
    if (!loggedInUserUid) return;

    // Find if user already voted for another option
    const previouslySelectedOption = this.pollOptions.find(opt => opt.selectedByLoggedInUser);

    // Update results - create deep copy to avoid mutation
    const newResults = { ...this.pollData.results };
    newResults.options = { ...newResults.options };

    // Decrement previous option if user is changing vote
    if (previouslySelectedOption && previouslySelectedOption.id !== selectedOption.id) {
      const prevOptionResult = newResults.options[previouslySelectedOption.id];
      if (prevOptionResult) {
        newResults.options[previouslySelectedOption.id] = {
          ...prevOptionResult,
          count: Math.max(0, prevOptionResult.count - 1),
          voters: { ...prevOptionResult.voters },
        };
        delete newResults.options[previouslySelectedOption.id].voters[loggedInUserUid];
      }
      newResults.total = Math.max(0, newResults.total - 1);
    }

    // Increment selected option (only if not already selected)
    if (!selectedOption.selectedByLoggedInUser) {
      const selectedOptionResult = newResults.options[selectedOption.id] || {
        count: 0,
        voters: {},
      };
      newResults.options[selectedOption.id] = {
        ...selectedOptionResult,
        count: selectedOptionResult.count + 1,
        voters: {
          ...selectedOptionResult.voters,
          [loggedInUserUid]: {
            name: this.loggedInUser?.getName() || '',
            avatar: this.loggedInUser?.getAvatar(),
          },
        },
      };
      newResults.total = newResults.total + 1;
    }

    // Update poll data
    this.pollData = {
      ...this.pollData,
      results: newResults,
    };

    // Reprocess poll options to update UI
    this.processPollOptions();
  }

  /**
   * Processes raw poll data into display-ready poll options.
   *
   * This method:
   * - Calculates vote percentages for each option
   * - Determines if the logged-in user has selected each option
   * - Limits voters to a maximum of 3 per option for avatar display
   *
   * @private
   * @see Requirements 1.7, 1.9, 4.3
   */
  private processPollOptions(): void {
    if (!this.pollData) {
      this.pollOptions = [];
      return;
    }

    const totalVotes = this.pollData.results?.total || 0;
    const optionKeys = Object.keys(this.pollData.options || {});
    const loggedInUserUid = this.loggedInUser?.getUid();

    this.pollOptions = optionKeys.map(optionId => {
      const optionResult = this.pollData!.results?.options?.[optionId];
      const voteCount = optionResult?.count || 0;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

      // Check if logged-in user voted for this option
      const selectedByLoggedInUser = loggedInUserUid
        ? optionResult?.voters?.hasOwnProperty(loggedInUserUid) || false
        : false;

      // Extract up to 3 voters for avatar display
      const voters = optionResult?.voters ? Object.values(optionResult.voters).slice(0, 3) : [];

      return {
        id: optionId,
        text: this.pollData!.options[optionId],
        count: voteCount,
        percent: `${percentage}%`,
        selectedByLoggedInUser,
        voters,
      };
    });
  }

  // ============================================================================
  // Protected Methods (Template Event Handlers)
  // ============================================================================

  /**
   * Handles click on a poll option to submit a vote.
   *
   * Uses optimistic UI pattern:
   * 1. Stores previous state for potential rollback
   * 2. Updates local state immediately (optimistic update)
   * 3. Submits vote to server
   * 4. On error, rolls back to previous state
   *
   * @param option - The poll option that was clicked
   * @protected
   * @see Requirements 1.2, 1.4, 6.1, 6.2, 6.3, 6.6
   */
  protected async onOptionClick(option: PollBubbleOption): Promise<void> {
    if (this.disableInteraction || this.isVoting || !this.pollData) {
      return;
    }

    this.isVoting = true;

    // Store previous state for rollback on error
    const previousPollData = { ...this.pollData };
    const previousOptions = [...this.pollOptions];

    // Optimistic update - update local state immediately
    this.updateVoteOptimistically(option);
    this.cdr.markForCheck();

    try {
      await CometChat.callExtension('polls', 'POST', 'v2/vote', {
        vote: option.id,
        id: this.pollData.id,
      });

      this.voteSubmit.emit({
        pollId: this.pollData.id,
        optionId: option.id,
        optionText: option.text,
        message: this.message,
      });

      // Emit updated poll data after successful vote
      if (this.pollData) {
        this.voteUpdate.emit(this.pollData);
      }

      // Announce vote submission for screen readers
      const announcement = CometChatLocalize.getLocalizedString(
        'accessibility_vote_submitted'
      ).replace('{option}', option.text);
      this.liveAnnouncer.announce(announcement, 'polite');
    } catch (error) {
      console.error('[CometChatPollBubble] Vote submission failed:', error);

      // Rollback on error - restore previous state
      this.pollData = previousPollData;
      this.pollOptions = previousOptions;
      this.cdr.markForCheck();

      this.voteError.emit({
        pollId: this.pollData.id,
        optionId: option.id,
        error: error instanceof Error ? error : new Error(String(error)),
        message: this.message,
      });
    } finally {
      this.isVoting = false;
      this.cdr.markForCheck();
    }
  }

  // ============================================================================
  // Accessibility Methods
  // ============================================================================

  /**
   * Handles keyboard events on poll options.
   * Submits vote when Enter or Space is pressed.
   *
   * @param event - The keyboard event
   * @param option - The poll option that received the keyboard event
   * @protected
   * @see Requirements 11.2
   */
  protected onOptionKeyDown(event: KeyboardEvent, option: PollBubbleOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onOptionClick(option);
    }
  }

  /**
   * Gets the aria-label for the poll bubble container.
   * Format: "Poll: [question]"
   *
   * @returns The aria-label string for the poll container
   * @protected
   * @see Requirements 11.3
   */
  protected get pollAriaLabel(): string {
    const question = this.pollData?.question || '';
    return CometChatLocalize.getLocalizedString('accessibility_poll_question').replace(
      '{question}',
      question
    );
  }

  /**
   * Gets the role for poll options based on poll type.
   * Returns 'radio' for single-choice polls (default).
   * Note: Multi-choice polls would return 'checkbox' but are not currently supported.
   *
   * @returns The ARIA role for poll options
   * @protected
   * @see Requirements 11.4
   */
  protected get optionRole(): string {
    // Currently only single-choice polls are supported
    return 'radio';
  }

  /**
   * Gets the aria-checked value for a poll option.
   *
   * @param option - The poll option to check
   * @returns 'true' if selected, 'false' otherwise
   * @protected
   * @see Requirements 11.5
   */
  protected getOptionAriaChecked(option: PollBubbleOption): string {
    return option.selectedByLoggedInUser ? 'true' : 'false';
  }

  /**
   * Gets the aria-disabled value for poll options.
   * Options are disabled when a vote is being submitted.
   *
   * @returns 'true' if voting is in progress, null otherwise
   * @protected
   * @see Requirements 11.5
   */
  protected get optionsAriaDisabled(): string | null {
    return this.isVoting ? 'true' : null;
  }

  /**
   * Gets the aria-label for a poll option including vote count and percentage.
   *
   * @param option - The poll option
   * @returns The aria-label string for the option
   * @protected
   * @see Requirements 11.5
   */
  protected getOptionAriaLabel(option: PollBubbleOption): string {
    const votesLabel = CometChatLocalize.getLocalizedString(
      option.count === 1 ? 'poll_bubble_vote' : 'poll_bubble_votes'
    );
    return `${option.text}, ${option.count} ${votesLabel}, ${option.percent}`;
  }
}
