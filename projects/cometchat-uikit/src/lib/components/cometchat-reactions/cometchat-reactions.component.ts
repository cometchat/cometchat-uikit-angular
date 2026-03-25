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

/**
 * Pure function that calculates the maximum number of visible emojis
 * based on the available width of the parent container.
 *
 * Each emoji pill occupies approximately 46px of width.
 * The result is clamped between 1 and 100.
 *
 * @param availableWidth - The available width in pixels.
 * @returns The maximum number of visible emojis (1–100).
 */
export function getMaxVisibleEmojis(availableWidth: number): number {
  return Math.min(100, Math.max(1, Math.floor(availableWidth / 46)));
}

/**
 * CometChatReactionsComponent renders emoji reaction pills on a message bubble's
 * footer area. It dynamically calculates how many pills to show based on the
 * parent container width, and provides overflow handling via a "+N" button.
 *
 * @example
 * ```html
 * <cometchat-reactions
 *   [message]="message"
 *   [alignment]="alignment"
 *   (reactionClick)="onReactionClick($event)">
 * </cometchat-reactions>
 * ```
 */
@Component({
  selector: 'cometchat-reactions',
  standalone: true,
  imports: [
    CommonModule,
    CometChatPopoverComponent,
    CometChatReactionInfoComponent,
    CometChatReactionListComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-reactions.component.html',
  styleUrls: ['./cometchat-reactions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatReactionsComponent implements AfterViewInit, OnDestroy, OnChanges, DoCheck {
  /**
   * The message object containing reactions to display.
   */
  @Input({ required: true }) message!: CometChat.BaseMessage;

  /**
   * Alignment of the message bubble (left or right).
   * Used to determine popover placement for the overflow list.
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /**
   * Optional custom reactions request builder for fetching reaction details.
   */
  @Input() reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;

  /**
   * Debounce time in milliseconds for hover tooltips.
   */
  @Input() hoverDebounceTime = 500;

  /**
   * Emitted when a reaction pill is clicked.
   */
  @Output() reactionClick = new EventEmitter<{
    reaction: CometChat.ReactionCount;
    message: CometChat.BaseMessage;
  }>();

  /**
   * Emitted when a reaction list item is clicked (from the overflow popover).
   */
  @Output() reactionListItemClick = new EventEmitter<{
    reaction: CometChat.Reaction;
    message: CometChat.BaseMessage;
  }>();

  /**
   * Maximum number of emoji pills that can be displayed based on available width.
   */
  maxVisibleEmojis = signal<number>(5);

  /**
   * Placement for the "more" reaction list popover.
   */
  moreListPlacement = signal<Placement>(Placement.right);

  /**
   * Version counter that gets bumped when reactions change on the same message object.
   * Used as a dependency in computed signals to force recomputation when the message
   * object is mutated in-place (e.g., via setReactions) without changing reference.
   */
  private reactionsVersion = signal(0);

  /**
   * Computed list of reactions to display as pills.
   * When overflow exists, shows maxVisibleEmojis - 1 pills to leave room for the "+N" button.
   */
  visibleReactions = computed<CometChat.ReactionCount[]>(() => {
    // Depend on reactionsVersion to recompute when reactions are mutated in-place
    this.reactionsVersion();
    const reactions = this.getReactions();
    const max = this.maxVisibleEmojis();
    const total = reactions.length;
    const showMore = total > max && max > 2;
    const visibleCount = showMore ? max - 1 : max;
    return reactions.slice(0, visibleCount);
  });

  /**
   * Computed count of hidden reactions for the overflow button.
   */
  moreCount = computed<number>(() => {
    // Depend on reactionsVersion to recompute when reactions are mutated in-place
    this.reactionsVersion();
    const reactions = this.getReactions();
    const total = reactions.length;
    const max = this.maxVisibleEmojis();
    const showMore = total > max && max > 2;
    const visibleCount = showMore ? max - 1 : max;
    return total > visibleCount ? total - visibleCount : 0;
  });

  /** Expose Placement enum to template. */
  Placement = Placement;

  /**
   * Inline styles for the reaction info tooltip popover content.
   * Removes default popover background/shadow so the tooltip renders cleanly.
   */
  reactionInfoPopoverStyle: Record<string, string> = {
    background: 'transparent',
    boxShadow: 'none',
    border: 'none',
    padding: '0',
  };

  /**
   * Inline styles for the reaction list popover content.
   * Removes default popover chrome so the reaction-list component's own
   * background, border-radius, and shadow are fully visible.
   */
  reactionListPopoverStyle: Record<string, string> = {
    background: 'transparent',
    boxShadow: 'none',
    padding: '0',
    maxWidth: 'none',
    borderRadius: '0',
    border: 'none',
    overflow: 'visible',
  };

  /**
   * Whether the reaction list popover should remain visible even when moreCount drops to 0.
   * Set to true when the popover is opened, reset when the reaction list emits `empty`
   * or the popover is closed.
   * @see Requirement 9.1, 9.2
   */
  forceShowReactionList = signal<boolean>(false);

  /**
   * Reference to the reaction list popover for programmatic close.
   */
  @ViewChild('moreListPopover') moreListPopover?: CometChatPopoverComponent;

  /**
   * Whether the reaction list popover should be shown.
   * Stays true while forceShowReactionList is set, even if moreCount drops to 0.
   */
  showReactionListPopover = computed<boolean>(() => {
    return this.moreCount() > 0 || this.forceShowReactionList();
  });

  private resizeObserver: ResizeObserver | null = null;
  private previousWidth = 0;
  private liveAnnouncer = inject(LiveAnnouncerService);
  /** Cached reaction fingerprint for detecting in-place mutations via DoCheck. */
  private previousReactionFingerprint = '';

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.attachResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      // Bump version when message reference changes to force computed recomputation
      this.previousReactionFingerprint = this.getReactionFingerprint();
      this.reactionsVersion.update(v => v + 1);
      this.updateMoreListPlacement();
    }
    if (changes['alignment']) {
      this.updateMoreListPlacement();
    }
  }

  /**
   * Detects in-place mutations to the message's reactions array.
   * When the message object is mutated (e.g., via setReactions) without changing
   * its reference, ngOnChanges won't fire. DoCheck catches these mutations by
   * comparing a lightweight fingerprint of the reactions.
   */
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
