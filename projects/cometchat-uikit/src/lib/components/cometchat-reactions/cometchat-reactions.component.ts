import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  DoCheck,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  computed,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPopoverComponent } from '../base-elements/cometchat-popover';
import { CometChatReactionInfoComponent } from '../cometchat-reaction-info';
import { CometChatReactionListComponent } from '../cometchat-reaction-list';
import { TranslatePipe } from '../../resources/CometChatLocalize';
import { MessageBubbleAlignment, Placement } from '../../Enums/Enums';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { getMaxVisibleEmojis } from './cometchat-reactions.utils';

export { getMaxVisibleEmojis };

/**
 * CometChatReactionsComponent renders emoji reaction pills on a message bubble's footer.
 * Dynamically calculates visible pills based on container width with overflow handling.
 */
@Component({
  selector: 'cometchat-reactions',
  standalone: true,
  imports: [CommonModule, CometChatPopoverComponent, CometChatReactionInfoComponent, CometChatReactionListComponent, TranslatePipe],
  templateUrl: './cometchat-reactions.component.html',
  styleUrls: ['./cometchat-reactions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatReactionsComponent implements AfterViewInit, OnDestroy, OnChanges, DoCheck {
  @Input({ required: true }) message!: CometChat.BaseMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;
  @Input() reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  @Input() hoverDebounceTime = 500;

  @Output() reactionClick = new EventEmitter<{ reaction: CometChat.ReactionCount; message: CometChat.BaseMessage; }>();
  @Output() reactionListItemClick = new EventEmitter<{ reaction: CometChat.Reaction; message: CometChat.BaseMessage; }>();

  maxVisibleEmojis = signal<number>(5);

  moreListPlacement = signal<Placement>(Placement.right);
  private reactionsVersion = signal(0);

  visibleReactions = computed<CometChat.ReactionCount[]>(() => {
    this.reactionsVersion();
    const reactions = this.getReactions();
    const max = this.maxVisibleEmojis();
    const total = reactions.length;
    const showMore = total > max && max > 2;
    const visibleCount = showMore ? max - 1 : max;
    return reactions.slice(0, visibleCount);
  });

  moreCount = computed<number>(() => {
    this.reactionsVersion();
    const reactions = this.getReactions();
    const total = reactions.length;
    const max = this.maxVisibleEmojis();
    const showMore = total > max && max > 2;
    const visibleCount = showMore ? max - 1 : max;
    return total > visibleCount ? total - visibleCount : 0;
  });

  Placement = Placement;

  reactionInfoPopoverStyle: Record<string, string> = { background: 'transparent', boxShadow: 'none', border: 'none', padding: '0' };
  reactionListPopoverStyle: Record<string, string> = { background: 'transparent', boxShadow: 'none', padding: '0', maxWidth: 'none', borderRadius: '0', border: 'none', overflow: 'visible' };

  forceShowReactionList = signal<boolean>(false);

  @ViewChild('moreListPopover') moreListPopover?: CometChatPopoverComponent;

  showReactionListPopover = computed<boolean>(() => this.moreCount() > 0 || this.forceShowReactionList());

  private resizeObserver: ResizeObserver | null = null;
  private previousWidth = 0;
  private liveAnnouncer = inject(LiveAnnouncerService);
  private previousReactionFingerprint = '';

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void { this.attachResizeObserver(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.previousReactionFingerprint = this.getReactionFingerprint();
      this.reactionsVersion.update(v => v + 1);
      this.updateMoreListPlacement();
    }
    if (changes['alignment']) this.updateMoreListPlacement();
  }

  /** Detects in-place mutations to the message's reactions array via DoCheck. */
  ngDoCheck(): void {
    const currentFingerprint = this.getReactionFingerprint();
    if (currentFingerprint !== this.previousReactionFingerprint) {
      this.previousReactionFingerprint = currentFingerprint;
      this.reactionsVersion.update(v => v + 1);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Handles click on a reaction pill.
   * Announces the reaction toggle for screen readers.
   */
  onPillClick(reaction: CometChat.ReactionCount): void {
    this.toggleReaction(reaction);
  }

  /**
   * Handles keyboard events on reaction pills.
   * Supports Enter and Space to toggle reaction.
   * @see Requirements 18.2
   */
  onReactionKeyDown(event: KeyboardEvent, reaction: CometChat.ReactionCount): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleReaction(reaction);
    }
  }

  /**
   * Toggles a reaction and announces the change for screen readers.
   * @see Requirements 18.2, 18.6
   */
  private toggleReaction(reaction: CometChat.ReactionCount): void {
    // Announce reaction toggle for screen readers
    const emoji = reaction.getReaction();
    const isReactedByMe = reaction.getReactedByMe();
    const messageKey = isReactedByMe
      ? 'accessibility_reaction_removed'
      : 'accessibility_reaction_added';
    const message = CometChatLocalize.getLocalizedString(messageKey).replace('{emoji}', emoji);
    this.liveAnnouncer.announce(message, 'polite', 2000);

    this.reactionClick.emit({ reaction, message: this.message });
  }

  /**
   * Gets aria-label for a reaction pill including emoji, count, and user reaction status.
   * @see Requirements 18.5
   */
  getReactionAriaLabel(reaction: CometChat.ReactionCount): string {
    const emoji = reaction.getReaction();
    const count = reaction.getCount();
    const isReactedByMe = reaction.getReactedByMe();

    if (isReactedByMe) {
      return CometChatLocalize.getLocalizedString('accessibility_reaction_you_reacted')
        .replace('{emoji}', emoji)
        .replace('{count}', count.toString());
    }
    return CometChatLocalize.getLocalizedString('accessibility_reaction_count')
      .replace('{emoji}', emoji)
      .replace('{count}', count.toString());
  }

  /**
   * Handles keyboard events on the more reactions button.
   * Supports Enter and Space to open the reaction list popover.
   */
  onMoreReactionsKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.updateMoreListPlacement();
    }
  }

  /**
   * Handles click on a reaction list item from the overflow popover.
   */
  onListItemClick(event: { reaction: CometChat.Reaction; message: CometChat.BaseMessage }): void {
    this.reactionListItemClick.emit(event);
  }

  /**
   * Handles the reaction list becoming empty after all reactions are removed.
   * Closes the popover and resets the force-show flag.
   * @see Requirement 9.2
   */
  onReactionListEmpty(): void {
    this.forceShowReactionList.set(false);
    this.moreListPopover?.closePopover();
  }

  /**
   * Called when the reaction list popover is opened.
   * Sets the force-show flag to prevent premature close on reaction removal.
   * @see Requirement 9.1
   */
  onMoreListPopoverOpened(): void {
    this.forceShowReactionList.set(true);
  }

  /**
   * Called when the reaction list popover is closed (outside click, escape, etc.).
   * Resets the force-show flag.
   * @see Requirement 9.3
   */
  onMoreListPopoverClosed(): void {
    this.forceShowReactionList.set(false);
  }

  /**
   * Updates the more list placement before opening the overflow popover.
   */
  updateMoreListPlacement(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.moreListPlacement.set(this.checkBubblePosition());
    } else {
      this.moreListPlacement.set(
        this.alignment === MessageBubbleAlignment.left ? Placement.right : Placement.left
      );
    }
  }

  /**
   * Returns the reactions array from the message, or an empty array.
   */
  private getReactions(): CometChat.ReactionCount[] {
    try {
      return this.message?.getReactions() || [];
    } catch {
      return [];
    }
  }

  /**
   * Generates a lightweight fingerprint of the current reactions for change detection.
   * Used by ngDoCheck to detect in-place mutations to the message's reactions.
   */
  private getReactionFingerprint(): string {
    try {
      const reactions = this.message?.getReactions();
      if (!reactions || reactions.length === 0) return '';
      return reactions
        .map(r => `${r.getReaction()}${r.getCount()}${r.getReactedByMe() ? 'm' : ''}`)
        .join('|');
    } catch {
      return '';
    }
  }

  /**
   * Attaches a ResizeObserver to the parent's content view element
   * to dynamically recalculate maxVisibleEmojis when the container resizes.
   */
  private attachResizeObserver(): void {
    try {
      const parentNode = this.elementRef.nativeElement?.parentNode?.parentNode;
      if (!parentNode) {
        return;
      }

      const contentView =
        parentNode.querySelector('.cometchat-message-bubble__body-content-view') ||
        parentNode.firstElementChild;

      if (!contentView || this.resizeObserver) {
        return;
      }

      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          if (this.previousWidth !== newWidth) {
            this.previousWidth = newWidth;
            this.maxVisibleEmojis.set(getMaxVisibleEmojis(newWidth));
          }
        }
      });

      this.resizeObserver.observe(contentView);
    } catch {
      // ResizeObserver not supported — keep default maxVisibleEmojis = 5
    }
  }

  /**
   * Checks the bubble's vertical position to determine popover placement on mobile.
   */
  private checkBubblePosition(): Placement {
    try {
      const bubble = this.elementRef.nativeElement?.parentNode;
      if (bubble) {
        const rect = bubble.getBoundingClientRect();
        const isAtTop = rect.top < window.innerHeight / 2;
        return isAtTop ? Placement.bottom : Placement.top;
      }
    } catch {
      // Fallback
    }
    return Placement.bottom;
  }

  /**
   * TrackBy function for reaction pills.
   */
  trackByReaction(index: number, reaction: CometChat.ReactionCount): string {
    return reaction.getReaction();
  }
}
