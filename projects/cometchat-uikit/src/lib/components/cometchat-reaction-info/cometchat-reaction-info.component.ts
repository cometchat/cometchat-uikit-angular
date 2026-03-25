import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../resources/CometChatLocalize';
import { CometChatLocalize } from '../../resources/CometChatLocalize';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLogger } from '../../utils/CometChatLogger';

/**
 * CometChatReactionInfoComponent displays a tooltip showing who reacted
 * with a specific emoji on a message.
 *
 * @example
 * ```html
 * <cometchat-reaction-info
 *   [message]="message"
 *   [reaction]="'👍'">
 * </cometchat-reaction-info>
 * ```
 */
@Component({
  selector: 'cometchat-reaction-info',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-reaction-info.component.html',
  styleUrls: ['./cometchat-reaction-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatReactionInfoComponent implements OnInit, OnChanges {
  /**
   * The message to show reaction info for.
   */
  @Input({ required: true }) message!: CometChat.BaseMessage;

  /**
   * The emoji character to show info for.
   */
  @Input({ required: true }) reaction!: string;

  /**
   * Current component state: loading, loaded, or error.
   */
  state = signal<'loading' | 'loaded' | 'error'>('loading');

  /**
   * Formatted names of users who reacted.
   */
  reactionNames = signal<string[]>([]);

  /**
   * Total count of reactions for this emoji on the message.
   */
  totalReactions = signal<number>(0);

  /**
   * UID of the currently logged-in user.
   */
  private loggedInUserUid = '';

  ngOnInit(): void {
    this.initializeAndFetch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && !changes['message'].firstChange) {
      this.fetchReactionInfo();
    }
    if (changes['reaction'] && !changes['reaction'].firstChange) {
      this.fetchReactionInfo();
    }
  }

  /**
   * Initializes the logged-in user and fetches reaction info.
   */
  private async initializeAndFetch(): Promise<void> {
    try {
      const user = await CometChat.getLoggedinUser();
      if (user) {
        this.loggedInUserUid = user.getUid();
      }
    } catch (error) {
      CometChatLogger.error('CometChatReactionInfo', 'Error getting logged-in user:', error);
    }

    this.computeTotalReactions();
    this.fetchReactionInfo();
  }

  /**
   * Computes total reaction count for this emoji from the message's reactions.
   */
  private computeTotalReactions(): void {
    try {
      const reactions = this.message.getReactions();
      if (reactions) {
        const reactionCount = reactions.find(
          (r: CometChat.ReactionCount) => r.getReaction() === this.reaction
        );
        if (reactionCount) {
          this.totalReactions.set(reactionCount.getCount());
        }
      }
    } catch (error) {
      CometChatLogger.error('CometChatReactionInfo', 'Error computing total reactions:', error);
    }
  }

  /**
   * Fetches reaction details from the SDK and formats the names.
   */
  private async fetchReactionInfo(): Promise<void> {
    this.state.set('loading');
    this.reactionNames.set([]);

    try {
      const limit = CometChatUIKitConstants.requestBuilderLimits.reactionInfoLimit;
      const request = new CometChat.ReactionsRequestBuilder()
        .setMessageId(this.message.getId())
        .setReaction(this.reaction)
        .setLimit(limit)
        .build();

      const reactions = await request.fetchNext();
      const names = this.formatReactionNames(reactions);
      this.reactionNames.set(names);
      this.state.set('loaded');
    } catch (error) {
      CometChatLogger.error('CometChatReactionInfo', 'Error fetching reactions:', error);
      this.state.set('error');
    }
  }

  /**
   * Formats reactor names: logged-in user becomes localized "You" and is placed first,
   * other names follow in order.
   */
  private formatReactionNames(reactions: CometChat.Reaction[]): string[] {
    const youText = CometChatLocalize.getLocalizedString('reaction_popup_you');
    const names: string[] = [];
    let isLoggedInUserIncluded = false;

    for (const reaction of reactions) {
      const reactedBy = reaction.getReactedBy();
      if (reactedBy.getUid() === this.loggedInUserUid) {
        isLoggedInUserIncluded = true;
      } else {
        names.push(reactedBy.getName());
      }
    }

    if (isLoggedInUserIncluded) {
      names.unshift(youText);
    }

    return names;
  }

  /**
   * Returns the formatted display text for reactor names with optional "and X others" suffix.
   */
  getDisplayText(): string {
    const names = this.reactionNames();
    const total = this.totalReactions();
    const fetchedCount = names.length;

    if (fetchedCount === 0) {
      return '';
    }

    let text = names.join(', ');

    if (total > fetchedCount) {
      const pendingCount = total - fetchedCount;
      const andText = CometChatLocalize.getLocalizedString('reaction_popup_and');
      const othersText = CometChatLocalize.getLocalizedString('reaction_popup_others');
      text += ` ${andText} ${pendingCount} ${othersText}`;
    }

    return text;
  }
}
