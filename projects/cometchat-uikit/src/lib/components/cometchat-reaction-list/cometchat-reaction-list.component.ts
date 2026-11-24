import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar';
import { TranslatePipe } from '../../resources/CometChatLocalize';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { isOfflineOn } from '../../utils/offline/offline-gate';
import { mergeSnapshotPage, readPageTwoPhase } from '../../utils/offline/two-phase';
import { OfflineListSession, watchOfflineSession } from '../../utils/offline/list-session';
import { OfflineHubService } from '../../services/offline-hub.service';
import { ConnectionStateService } from '../../services/connection-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * ENG-57325 (offline, D84 rule 3): while the list says "Connect to load reactions" and no rows have
 * loaded, its tabs take "All" and the per-emoji counts from the message's own reactions, as Android
 * does; `null` otherwise, so loaded rows (and the online error view) keep their counts.
 */
function connectToLoadCounts(
  connectToLoad: boolean,
  loadedRows: number,
  message?: CometChat.BaseMessage,
): CometChat.ReactionCount[] | null {
  if (!connectToLoad || loadedRows > 0) return null;
  return message?.getReactions?.() ?? [];
}

/**
 * CometChatReactionListComponent displays all users who reacted to a message,
 * grouped by emoji type with filtering support.
 */
@Component({
  selector: 'cometchat-reaction-list',
  standalone: true,
  imports: [CommonModule, CometChatAvatarComponent, TranslatePipe],
  templateUrl: './cometchat-reaction-list.component.html',
  styleUrls: ['./cometchat-reaction-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatReactionListComponent implements OnInit, OnChanges {
  @Input() message!: CometChat.BaseMessage;
  @Input() reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;

  @Output() itemClick = new EventEmitter<{ reaction: CometChat.Reaction; message: CometChat.BaseMessage; }>();
  @Output() empty = new EventEmitter<void>();

  groupedReactions = signal<Map<string, CometChat.Reaction[]>>(new Map());
  selectedEmoji = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  /**
   * Offline (D84 rule 3): nothing on screen and no connection, so the list says "Connect to load
   * reactions" in place of its error state, with no Retry. Always false with offline off.
   */
  readonly offlineConnectToLoad = signal(false);
  private allReactions = signal<CometChat.Reaction[]>([]);
  private loggedInUserUid = '';
  private reactionsRequest: CometChat.ReactionsRequest | null = null;
  hasMoreReactions = signal<boolean>(true);

  emojiTabs = computed(
    () =>
      connectToLoadCounts(this.offlineConnectToLoad(), this.allReactions().length, this.message)?.map(c => c.getReaction()) ??
      Array.from(this.groupedReactions().keys()),
  );

  filteredReactions = computed(() => {
    const selected = this.selectedEmoji();
    if (selected === null) return this.allReactions();
    return this.groupedReactions().get(selected) || [];
  });

  totalReactionCount = computed(() => {
    const counts = connectToLoadCounts(this.offlineConnectToLoad(), this.allReactions().length, this.message);
    return counts ? counts.reduce((sum, c) => sum + c.getCount(), 0) : this.allReactions().length;
  });

  /** Offline: logout / user switch clears the list, a cache reset reloads it (UIK-LIFE-01/02). */
  private readonly offlineSession = new OfflineListSession();

  /**
   * Offline (D83): the error view is up because the device was not connected, so the reactions are
   * read once more by themselves when the connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    watchOfflineSession(inject(OfflineHubService), destroyRef, this.offlineSession, {
      clear: () => this.clearForSession(),
      reload: () => { if (this.message) this.resetAndFetchReactions(); },
    });
    inject(ConnectionStateService).reconnected$.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      if (isOfflineOn() && this.reloadOnConnect && this.hasError() && this.allReactions().length === 0 && this.message) {
        this.reloadOnConnect = false;
        this.resetAndFetchReactions();
      }
    });
  }

  private clearForSession(): void {
    this.allReactions.set([]);
    this.groupedReactions.set(new Map());
    this.selectedEmoji.set(null);
    this.hasMoreReactions.set(true);
    this.hasError.set(false);
    this.offlineConnectToLoad.set(false);
    this.reloadOnConnect = false;
    this.isLoading.set(false);
    this.reactionsRequest = null;
  }

  ngOnInit(): void { this.initializeLoggedInUser(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) this.resetAndFetchReactions();
  }

  private async initializeLoggedInUser(): Promise<void> {
    try {
      const user = await CometChat.getLoggedinUser();
      if (user) this.loggedInUserUid = user.getUid();
    } catch (error) {
      CometChatLogger.error('CometChatReactionList', 'Error getting logged-in user:', error);
    }
  }

  private resetAndFetchReactions(): void {
    this.allReactions.set([]);
    this.groupedReactions.set(new Map());
    this.selectedEmoji.set(null);
    this.hasMoreReactions.set(true);
    this.hasError.set(false);
    this.offlineConnectToLoad.set(false);
    this.reactionsRequest = null;
    this.fetchReactions();
  }

  /**
   * Fetches reactions for the message.
   */
  async fetchReactions(): Promise<void> {
    if (!this.message || this.isLoading() || !this.hasMoreReactions()) {
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);
    this.offlineConnectToLoad.set(false);

    try {
      if (!this.reactionsRequest) {
        this.reactionsRequest = this.createReactionsRequest();
      }

      if (isOfflineOn()) {
        await this.fetchReactionsOffline(this.reactionsRequest);
        return;
      }

      const reactions = await this.reactionsRequest.fetchNext();

      if (reactions.length === 0) {
        this.hasMoreReactions.set(false);
      } else {
        const currentReactions = this.allReactions();
        const updatedReactions = [...currentReactions, ...reactions];
        this.allReactions.set(updatedReactions);
        this.groupReactionsByEmoji(updatedReactions);

        if (reactions.length < CometChatUIKitConstants.requestBuilderLimits.reactionListLimit) {
          this.hasMoreReactions.set(false);
        }
      }
    } catch (error) {
      CometChatLogger.error('CometChatReactionList', 'Error fetching reactions:', error);
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Offline path of the page read: the cached page paints at once, the server page then replaces
   * it in place; rows are deduped by reaction id so "load more" never repeats one, and an offline
   * read past the cache keeps what is shown with no error.
   */
  private async fetchReactionsOffline(request: CometChat.ReactionsRequest): Promise<void> {
    // A person reacts with an emoji once per message: (emoji, reactor) identifies a row.
    this.offlineSession.markRan();
    const epoch = this.offlineSession.epoch;
    const keyOf = (reaction: CometChat.Reaction) => `${reaction.getReaction()}:${reaction.getUid?.() ?? reaction.getReactedBy()?.getUid()}`;
    let cachedKeys = new Set<string>();
    const show = (rows: CometChat.Reaction[]) => {
      this.allReactions.set(rows);
      this.groupReactionsByEmoji(rows);
    };
    try {
      this.reloadOnConnect = false;
      const { server } = await readPageTwoPhase<CometChat.Reaction>(request, 'reactions', page => {
        if (this.offlineSession.isStale(epoch) || page.length === 0) return;
        cachedKeys = new Set(page.map(keyOf));
        show(mergeSnapshotPage(this.allReactions(), new Set<string>(), page, keyOf));
      });
      if (this.offlineSession.isStale(epoch)) return;
      if (!server) {
        // Offline and nothing newer (D84): with nothing on screen it is "Connect to load reactions", read
        // once more when the connection is back; with reactions on screen they stay. This list has no
        // error output.
        if (this.allReactions().length === 0) {
          this.reloadOnConnect = true;
          this.offlineConnectToLoad.set(true);
          this.hasError.set(true);
        }
        return;
      }
      show(mergeSnapshotPage(this.allReactions(), cachedKeys, server, keyOf));
      // Only an empty server page ends the list (BEH-READ-09b).
      if (server.length === 0) this.hasMoreReactions.set(false);
    } catch (error) {
      CometChatLogger.error('CometChatReactionList', 'Error fetching reactions:', error);
      if (!this.offlineSession.isStale(epoch) && this.allReactions().length === 0) this.hasError.set(true);
    }
  }

  /**
   * Creates a reactions request builder.
   */
  private createReactionsRequest(): CometChat.ReactionsRequest {
    if (this.reactionsRequestBuilder) {
      return this.reactionsRequestBuilder.build();
    }

    return new CometChat.ReactionsRequestBuilder()
      .setMessageId(this.message.getId())
      .setLimit(CometChatUIKitConstants.requestBuilderLimits.reactionListLimit)
      .build();
  }

  /**
   * Groups reactions by emoji type.
   */
  private groupReactionsByEmoji(reactions: CometChat.Reaction[]): void {
    const grouped = new Map<string, CometChat.Reaction[]>();

    for (const reaction of reactions) {
      const emoji = reaction.getReaction();
      if (!grouped.has(emoji)) {
        grouped.set(emoji, []);
      }
      grouped.get(emoji)!.push(reaction);
    }

    this.groupedReactions.set(grouped);
  }

  /**
   * Selects an emoji tab to filter reactions.
   */
  selectEmoji(emoji: string | null): void {
    this.selectedEmoji.set(emoji);
  }

  /**
   * Handles click on a reaction item.
   * Only emits for the current user's reactions (to remove them).
   * Non-user reactions are read-only and not clickable.
   * After removal, updates the local list and emits `empty` if no reactions remain.
   * Stops event propagation to prevent the popover from closing.
   * @see Requirement 4.4
   * @see Requirement 9.1, 9.2
   */
  onItemClick(event: MouseEvent, reaction: CometChat.Reaction): void {
    // Stop propagation to prevent popover from closing
    event.stopPropagation();

    if (!this.isCurrentUser(reaction)) {
      return;
    }

    this.itemClick.emit({
      reaction,
      message: this.message,
    });

    // Remove the reaction from the local list optimistically
    const emoji = reaction.getReaction();
    // isCurrentUser passed: the row is the logged-in user's (its reactor may be missing, ANG-3).
    const uid = this.loggedInUserUid;
    const updatedReactions = this.allReactions().filter(
      r => !(r.getReaction() === emoji && (r.getReactedBy()?.getUid() ?? r.getUid?.()) === uid)
    );
    this.allReactions.set(updatedReactions);
    this.groupReactionsByEmoji(updatedReactions);

    // If the selected emoji tab is now empty, reset to "All"
    if (this.selectedEmoji() !== null) {
      const grouped = this.groupedReactions();
      if (!grouped.has(this.selectedEmoji()!)) {
        this.selectedEmoji.set(null);
      }
    }

    // Emit empty when all reactions are removed
    if (updatedReactions.length === 0) {
      this.empty.emit();
    }
  }

  /**
   * Handles keyboard navigation for tabs.
   */
  onTabKeyDown(event: KeyboardEvent, emoji: string | null, index: number): void {
    const tabs = this.emojiTabs();
    const totalTabs = tabs.length + 1; // +1 for "All" tab

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPreviousTab(index, totalTabs);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.focusNextTab(index, totalTabs);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectEmoji(emoji);
        break;
      case 'Home':
        event.preventDefault();
        this.focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusTab(totalTabs - 1);
        break;
    }
  }

  /**
   * Handles keyboard navigation for reaction items.
   * Only triggers click for the current user's reactions.
   */
  onItemKeyDown(event: KeyboardEvent, reaction: CometChat.Reaction): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        if (this.isCurrentUser(reaction)) {
          // Create a synthetic MouseEvent to pass to onItemClick
          const syntheticEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          this.onItemClick(syntheticEvent, reaction);
        }
        break;
    }
  }

  /**
   * Focuses the previous tab.
   */
  private focusPreviousTab(currentIndex: number, totalTabs: number): void {
    const prevIndex = currentIndex === 0 ? totalTabs - 1 : currentIndex - 1;
    this.focusTab(prevIndex);
  }

  /**
   * Focuses the next tab.
   */
  private focusNextTab(currentIndex: number, totalTabs: number): void {
    const nextIndex = currentIndex === totalTabs - 1 ? 0 : currentIndex + 1;
    this.focusTab(nextIndex);
  }

  /**
   * Focuses a tab by index.
   */
  private focusTab(index: number): void {
    const tabElements = document.querySelectorAll('.cometchat-reaction-list__tabs-tab');
    if (tabElements[index]) {
      (tabElements[index] as HTMLElement).focus();
    }
  }

  /**
   * Gets the display name for a reaction's user.
   */
  getDisplayName(reaction: CometChat.Reaction): string {
    const reactedBy = reaction.getReactedBy();
    if (this.isCurrentUser(reaction)) {
      return ''; // Will use localization key 'reaction_list_you'
    }
    return reactedBy?.getName() || '';
  }

  /**
   * Checks if the reaction is from the logged-in user.
   */
  isCurrentUser(reaction: CometChat.Reaction): boolean {
    // A reactor the SDK did not hand back (ANG-3) is never the logged-in user.
    const uid = reaction.getReactedBy()?.getUid() ?? reaction.getUid?.();
    return !!uid && uid === this.loggedInUserUid;
  }

  /**
   * Gets the count for a specific emoji.
   */
  getEmojiCount(emoji: string): number {
    const counts = connectToLoadCounts(this.offlineConnectToLoad(), this.allReactions().length, this.message);
    if (counts) return counts.find(c => c.getReaction() === emoji)?.getCount() || 0;
    const grouped = this.groupedReactions();
    return grouped.get(emoji)?.length || 0;
  }

  /**
   * Loads more reactions when scrolling.
   */
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (scrollBottom < 50 && !this.isLoading() && this.hasMoreReactions()) {
      this.fetchReactions();
    }
  }

  /**
   * Retries fetching reactions after an error.
   */
  retry(): void {
    this.hasError.set(false);
    this.fetchReactions();
  }

  /**
   * TrackBy function for reaction items.
   */
  trackByReaction(index: number, reaction: CometChat.Reaction): string {
    return `${reaction.getReactedBy()?.getUid() ?? reaction.getUid?.()}-${reaction.getReaction()}`;
  }

  /**
   * TrackBy function for emoji tabs.
   */
  trackByEmoji(index: number, emoji: string): string {
    return emoji;
  }
}
