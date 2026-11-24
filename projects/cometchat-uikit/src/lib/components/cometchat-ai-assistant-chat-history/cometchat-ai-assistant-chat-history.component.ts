import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitConstants } from '../../constants';
import { isOfflineOn } from '../../utils/offline/offline-gate';
import { mergeSnapshotPage, readPageTwoPhase } from '../../utils/offline/two-phase';
import { OfflineListSession, watchOfflineSession } from '../../utils/offline/list-session';
import { OfflineHubService } from '../../services/offline-hub.service';
import { ConnectionStateService } from '../../services/connection-state.service';

/**
 * CometChatAIAssistantChatHistory renders a sidebar list of past AI conversations.
 * Latest messages appear at the top; scrolling to the bottom fetches older messages.
 *
 * Requirements: 9.1–9.20, 12.2, 12.7, 13.1, 13.8, 16.1, 16.2, 16.4
 */
@Component({
  selector: 'cometchat-ai-assistant-chat-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TranslatePipe],
  templateUrl: './cometchat-ai-assistant-chat-history.component.html',
  styleUrls: ['./cometchat-ai-assistant-chat-history.component.css'],
})
export class CometChatAIAssistantChatHistory implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  /** Offline: logout / user switch clears the list, a cache reset reloads it (UIK-LIFE-01/02). */
  private readonly offlineSession = new OfflineListSession();
  private readonly offlineHub = inject(OfflineHubService);
  private readonly connectionState = inject(ConnectionStateService);
  /**
   * Offline (D83): the error view is up because the device was not connected, so the first page
   * is read once more by itself when the connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  // ── Shared constants ──────────────────────────────────────────────────────
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  // ── Signal inputs ─────────────────────────────────────────────────────────
  readonly user = input<CometChat.User>();
  readonly group = input<CometChat.Group>();
  readonly loadLastAgentConversation = input<boolean>(false);
  readonly showNewChat = input<boolean>(true);
  readonly emptyStateTemplate = input<TemplateRef<void>>();
  readonly errorStateTemplate = input<TemplateRef<void>>();

  // ── Signal outputs ────────────────────────────────────────────────────────
  readonly messageClick = output<CometChat.TextMessage>();
  readonly newChatClick = output<CometChat.TextMessage | null>();
  readonly closeClick = output<void>();
  readonly empty = output<void>();

  // ── State signals ─────────────────────────────────────────────────────────
  readonly messages = signal<CometChat.TextMessage[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly focusedIndex = signal(0);

  // ── Private state ─────────────────────────────────────────────────────────
  private _messagesRequest: CometChat.MessagesRequest | null = null;
  private _hasMore = true;
  private _isFirstPage = true;
  private _activeParentMessageId: number | null = null;

  // ── Computed: messages with date separator metadata ───────────────────────
  /**
   * Produces a flat list of items for rendering: each message paired with
   * a date-separator flag. Computed so no template method calls are needed.
   */
  readonly messageItems = computed(() => {
    const msgs = this.messages();
    return msgs.map((msg, index) => {
      const prevMsg = index > 0 ? msgs[index - 1] : null;
      const showSeparator = prevMsg
        ? !this._isSameDay(prevMsg.getSentAt() * 1000, msg.getSentAt() * 1000)
        : true;
      return { message: msg, showSeparator };
    });
  });

  readonly isEmpty = computed(
    () => !this.isLoading() && !this.hasError() && this.messages().length === 0
  );

  ngOnInit(): void {
    this._buildRequest();
    this.fetchMessages();
    this._subscribeToMessageSent();
    watchOfflineSession(this.offlineHub, this.destroyRef, this.offlineSession, {
      clear: () => {
        this.messages.set([]);
        this.isLoading.set(false);
        this.hasError.set(false);
        this._messagesRequest = null;
        this._hasMore = true;
        this._isFirstPage = true;
      },
      reload: () => {
        this._buildRequest();
        this.fetchMessages();
      },
    });
    // Offline (D83): an error view that is up because the device was offline loads once on reconnect.
    this.connectionState.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (isOfflineOn() && this.reloadOnConnect && this.hasError() && this.messages().length === 0) {
        this.reloadOnConnect = false;
        this._buildRequest();
        this.fetchMessages();
      }
    });
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /** Called by the scroll handler when the list reaches the bottom — fetches older messages. */
  onScrollToBottom(): void {
    if (!this._hasMore || this.isLoading()) return;
    this.fetchMessages();
  }

  /** Handles scroll events on the list container. */
  onListScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    if (atBottom) {
      this.onScrollToBottom();
    }
  }

  /**
   * Fetches the next page of messages.
   *
   * The SDK's fetchPrevious() returns messages oldest-first within each page.
   * We reverse each page so the array is always newest-first (index 0 = newest).
   * Subsequent pages (older) are appended to the end of the array (bottom of list).
   */
  fetchMessages(): void {
    if (!this._messagesRequest || !this._hasMore) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    if (isOfflineOn()) {
      void this.fetchMessagesOffline(this._messagesRequest);
      return;
    }

    this._messagesRequest
      .fetchPrevious()
      .then((fetchedMessages: CometChat.BaseMessage[]) => {
        const textMessages = fetchedMessages.filter(
          (m): m is CometChat.TextMessage => m instanceof CometChat.TextMessage
        );

        if (fetchedMessages.length === 0) {
          this._hasMore = false;
        }

        // Reverse so newest is at index 0 (top of list).
        // Each subsequent page contains older messages — append to bottom.
        const reversed = [...textMessages].reverse();

        if (this._isFirstPage) {
          this.messages.set(reversed);
        } else {
          this.messages.update((prev) => [...prev, ...reversed]);
        }

        this.isLoading.set(false);

        // Auto-emit most recent message (index 0 = newest after reverse) on first load
        if (this._isFirstPage && this.loadLastAgentConversation() && reversed.length > 0) {
          this.messageClick.emit(reversed[0]);
        }

        if (this._isFirstPage && this.messages().length === 0) {
          this.empty.emit();
        }

        this._isFirstPage = false;
      })
      .catch(() => {
        this.isLoading.set(false);
        if (this.messages().length === 0) {
          this.hasError.set(true);
        }
      });
  }

  /**
   * Offline path of {@link fetchMessages}: the cached page paints at once, the server page then
   * replaces it in place. Rows are deduped by id and kept newest-first, so "load more" never
   * repeats one; an offline read past the cache keeps what is shown with no error.
   */
  private async fetchMessagesOffline(request: CometChat.MessagesRequest): Promise<void> {
    this.offlineSession.markRan();
    const epoch = this.offlineSession.epoch;
    const keyOf = (m: CometChat.TextMessage) => String(m.getId());
    const newestFirst = (rows: CometChat.TextMessage[]) =>
      [...rows].sort((a, b) => (b.getSentAt() - a.getSentAt()) || (b.getId() - a.getId()));
    const asText = (page: CometChat.BaseMessage[]) =>
      page.filter((m): m is CometChat.TextMessage => m instanceof CometChat.TextMessage);
    const first = this._isFirstPage;
    this.reloadOnConnect = false;
    let cachedKeys = new Set<string>();
    try {
      const { server } = await readPageTwoPhase<CometChat.BaseMessage>(request, 'messages', cached => {
        const text = asText(cached);
        if (this.offlineSession.isStale(epoch) || text.length === 0) return;
        cachedKeys = new Set(text.map(keyOf));
        this.messages.set(newestFirst(mergeSnapshotPage(this.messages(), new Set<string>(), text, keyOf)));
      }, 'previous');
      if (this.offlineSession.isStale(epoch)) return;
      if (server === null) {
        // Offline and nothing newer: keep what is shown. With nothing on screen it is the error
        // view (D83), read once more when the connection is back.
        this.isLoading.set(false);
        if (this.messages().length === 0) {
          this.reloadOnConnect = true;
          this.hasError.set(true);
        } else {
          this._isFirstPage = false;
        }
        return;
      }
      const text = asText(server);
      // Only an empty server page ends the list (BEH-READ-09b).
      if (server.length === 0) this._hasMore = false;
      this.messages.set(newestFirst(mergeSnapshotPage(this.messages(), cachedKeys, text, keyOf)));
      this.isLoading.set(false);
      const newest = this.messages()[0];
      if (first && this.loadLastAgentConversation() && newest) this.messageClick.emit(newest);
      if (first && this.messages().length === 0) this.empty.emit();
      this._isFirstPage = false;
    } catch {
      if (this.offlineSession.isStale(epoch)) return;
      this.isLoading.set(false);
      if (this.messages().length === 0) this.hasError.set(true);
    }
  }

  /** Handles clicking a message item. */
  onMessageClick(message: CometChat.TextMessage): void {
    this._activeParentMessageId = message.getId();
    this.messageClick.emit(message);
  }

  /** Handles deleting a message. */
  onDeleteMessage(message: CometChat.TextMessage, event: Event): void {
    event.stopPropagation();
    const messageId = message.getId().toString();

    CometChat.deleteMessage(messageId)
      .then(() => {
        this.messages.update((prev) => prev.filter((m) => m.getId() !== message.getId()));

        if (this._activeParentMessageId === message.getId()) {
          this._activeParentMessageId = null;
          this.newChatClick.emit(null);
        }
      })
      .catch(() => {
        // Silently ignore delete errors — message stays in list
      });
  }

  /** Emits closeClick output. */
  onCloseClick(): void {
    this.closeClick.emit();
  }

  /** Emits newChatClick with null. */
  onNewChatClick(): void {
    this._activeParentMessageId = null;
    this.newChatClick.emit(null);
  }

  // ── Roving tabindex keyboard navigation ───────────────────────────────────

  onKeyDown(event: KeyboardEvent, index: number): void {
    const msgs = this.messages();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveFocusTo(Math.min(index + 1, msgs.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocusTo(Math.max(index - 1, 0));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onMessageClick(msgs[index]);
    }
  }

  /**
   * Updates the roving tabindex anchor and moves DOM focus to that option, so
   * arrow-key navigation actually moves keyboard focus (not just the tabindex).
   */
  private moveFocusTo(index: number): void {
    this.focusedIndex.set(index);
    const host = this.hostRef.nativeElement as HTMLElement;
    const items = host.querySelectorAll('.cometchat-ai-assistant-chat-history__item[role="option"]');
    (items[index] as HTMLElement | undefined)?.focus();
  }

  /** Returns tabindex for a given list item index. */
  getTabIndex(index: number): number {
    return index === this.focusedIndex() ? 0 : -1;
  }

  // ── Date formatting helper ────────────────────────────────────────────────

  formatDate(timestampSeconds: number): string {
    const date = new Date(timestampSeconds * 1000);
    // The kit's own language, not the browser's.
    return date.toLocaleDateString(CometChatLocalize.getDateLocaleLanguage(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _buildRequest(): void {
    const user = this.user();
    const group = this.group();

    const builder = new CometChat.MessagesRequestBuilder()
      .hideReplies(true)
      .setLimit(30)
      .hideDeletedMessages(true);

    if (user) {
      builder.setUID(user.getUid());
    } else if (group) {
      builder.setGUID(group.getGuid());
    }

    this._messagesRequest = builder.build();
  }

  private _subscribeToMessageSent(): void {
    CometChatMessageEvents.ccMessageSent
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.status === MessageStatus.success) {
          const msg = event.message;
          if (msg instanceof CometChat.TextMessage) {
            // Prepend so new messages appear at the top (newest-first order)
            this.messages.update((prev) => [msg, ...prev]);
          }
        }
      });
  }

  private _isSameDay(tsA: number, tsB: number): boolean {
    const a = new Date(tsA);
    const b = new Date(tsB);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
