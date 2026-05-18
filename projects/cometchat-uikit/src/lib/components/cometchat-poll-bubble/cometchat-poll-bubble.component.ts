/**
 * CometChatPollBubbleComponent
 *
 * Renders poll messages with voting functionality within chat conversations.
 * Extracts poll data from CometChat CustomMessage metadata and displays
 * the poll question, options with radio buttons, vote counts, progress bars,
 * and voter avatars.
 *
 * @module components/cometchat-poll-bubble
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
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { LiveAnnouncerService } from '../../services/live-announcer.service';

// Re-export types for backward compatibility
export type {
  VoterInfo,
  PollOptionResult,
  PollResults,
  PollData,
  PollBubbleOption,
  PollVoteEvent,
  PollVoteErrorEvent,
} from './cometchat-poll-bubble.types';

import {
  POLLS_CONSTANTS,
  PollData,
  PollBubbleOption,
  PollVoteEvent,
  PollVoteErrorEvent,
  VoterInfo,
} from './cometchat-poll-bubble.types';

@Component({
  selector: 'cometchat-poll-bubble',
  standalone: true,
  templateUrl: './cometchat-poll-bubble.component.html',
  styleUrls: ['./cometchat-poll-bubble.component.css'],
  imports: [CommonModule, TranslatePipe, CometChatRadioButtonComponent, CometChatAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatPollBubbleComponent implements OnInit, OnChanges {
  /** The CometChat CustomMessage containing poll data in its metadata. */
  @Input({ required: true }) message!: CometChat.CustomMessage;

  /** Visual styling variant: LEFT = receiver, RIGHT = sender. */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /** The currently logged-in user (used to determine selected options). */
  @Input() loggedInUser?: CometChat.User;

  /** When true, disables all interactive elements (voting). */
  @Input() disableInteraction = false;

  /** Emitted when a vote is successfully submitted. */
  @Output() voteSubmit = new EventEmitter<PollVoteEvent>();

  /** Emitted when vote submission fails. */
  @Output() voteError = new EventEmitter<PollVoteErrorEvent>();

  /** Emitted after successful vote submission with updated poll data. */
  @Output() voteUpdate = new EventEmitter<PollData>();

  // ============================================================================
  // Internal State
  // ============================================================================

  protected pollData: PollData | null = null;
  protected pollOptions: PollBubbleOption[] = [];
  protected isVoting = false;
  protected isOutgoing = false;

  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  private liveAnnouncer = inject(LiveAnnouncerService);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.processMessage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.processMessage();
    }
    if (changes['alignment']) {
      this.isOutgoing = this.alignment === MessageBubbleAlignment.right;
      this.cdr.markForCheck();
    }
    if (changes['loggedInUser'] && this.pollData) {
      this.processPollOptions();
      this.cdr.markForCheck();
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private processMessage(): void {
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;
    this.extractPollData();
    this.cdr.markForCheck();
  }

  private extractPollData(): void {
    try {
      if (!this.message) {
      CometChatLogger.warn('CometChatPollBubble', 'Message is null or undefined');
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      const metadata = this.message.getMetadata() as Record<string, any> | null;
      if (!metadata) {
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      const injected = metadata[POLLS_CONSTANTS.INJECTED_KEY];
      const extensions = injected?.[POLLS_CONSTANTS.EXTENSION_KEY];
      const pollsData = extensions?.[POLLS_CONSTANTS.POLLS_KEY];

      if (!pollsData) {
        this.pollData = null;
        this.pollOptions = [];
        return;
      }

      this.pollData = {
        id: pollsData.id || this.message.getId(),
        question: pollsData.question || '',
        options: pollsData.options || {},
        results: pollsData.results || { total: 0, options: {} },
      };

      this.processPollOptions();
    } catch (error) {
      CometChatLogger.error('CometChatPollBubble', 'Error extracting poll data:', error);
      this.pollData = null;
      this.pollOptions = [];
    }
  }

  private updateVoteOptimistically(selectedOption: PollBubbleOption): void {
    if (!this.pollData) return;
    const loggedInUserUid = this.loggedInUser?.getUid();
    if (!loggedInUserUid) return;

    const previouslySelectedOption = this.pollOptions.find(opt => opt.selectedByLoggedInUser);
    const newResults = { ...this.pollData.results, options: { ...this.pollData.results.options } };

    if (previouslySelectedOption && previouslySelectedOption.id !== selectedOption.id) {
      const prev = newResults.options[previouslySelectedOption.id];
      if (prev) {
        newResults.options[previouslySelectedOption.id] = {
          ...prev,
          count: Math.max(0, prev.count - 1),
          voters: { ...prev.voters },
        };
        delete newResults.options[previouslySelectedOption.id].voters[loggedInUserUid];
      }
      newResults.total = Math.max(0, newResults.total - 1);
    }

    if (!selectedOption.selectedByLoggedInUser) {
      const sel = newResults.options[selectedOption.id] || { count: 0, voters: {} };
      newResults.options[selectedOption.id] = {
        ...sel,
        count: sel.count + 1,
        voters: {
          ...sel.voters,
          [loggedInUserUid]: {
            name: this.loggedInUser?.getName() || '',
            avatar: this.loggedInUser?.getAvatar(),
          } as VoterInfo,
        },
      };
      newResults.total = newResults.total + 1;
    }

    this.pollData = { ...this.pollData, results: newResults };
    this.processPollOptions();
  }

  private processPollOptions(): void {
    if (!this.pollData) {
      this.pollOptions = [];
      return;
    }

    const totalVotes = this.pollData.results?.total || 0;
    const loggedInUserUid = this.loggedInUser?.getUid();

    this.pollOptions = Object.keys(this.pollData.options || {}).map(optionId => {
      const optionResult = this.pollData!.results?.options?.[optionId];
      const voteCount = optionResult?.count || 0;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      const selectedByLoggedInUser = loggedInUserUid
        ? optionResult?.voters?.hasOwnProperty(loggedInUserUid) || false
        : false;
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

  protected async onOptionClick(option: PollBubbleOption): Promise<void> {
    if (this.disableInteraction || this.isVoting || !this.pollData) return;

    this.isVoting = true;
    const previousPollData = { ...this.pollData };
    const previousOptions = [...this.pollOptions];

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

      if (this.pollData) this.voteUpdate.emit(this.pollData);

      this.liveAnnouncer.announce(
        CometChatLocalize.getLocalizedString('accessibility_vote_submitted')
          .replace('{option}', option.text),
        'polite'
      );
    } catch (error) {
      CometChatLogger.error('CometChatPollBubble', 'Vote submission failed:', error);
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

  protected onOptionKeyDown(event: KeyboardEvent, option: PollBubbleOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onOptionClick(option);
    }
  }

  protected get pollAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('accessibility_poll_question')
      .replace('{question}', this.pollData?.question || '');
  }

  protected get optionRole(): string {
    return 'radio';
  }

  protected getOptionAriaChecked(option: PollBubbleOption): string {
    return option.selectedByLoggedInUser ? 'true' : 'false';
  }

  protected get optionsAriaDisabled(): string | null {
    return this.isVoting ? 'true' : null;
  }

  protected getOptionAriaLabel(option: PollBubbleOption): string {
    const votesLabel = CometChatLocalize.getLocalizedString(
      option.count === 1 ? 'poll_bubble_vote' : 'poll_bubble_votes'
    );
    return `${option.text}, ${option.count} ${votesLabel}, ${option.percent}`;
  }
}
