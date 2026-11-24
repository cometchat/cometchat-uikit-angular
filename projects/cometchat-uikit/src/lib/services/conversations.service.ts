import { Injectable, signal, computed, inject, DestroyRef, NgZone } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents, IMessages } from '../events/CometChatMessageEvents';
import { CometChatConversationEvents } from '../events/CometChatConversationEvents';
import { MessageStatus } from '../Enums/Enums';
import { CometChatUIKitConstants } from '../constants';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatLogger } from '../utils/CometChatLogger';
import {
  setupMessageListener, removeMessageListener,
  setupUserListener, removeUserListener,
  setupGroupListener, removeGroupListener,
  setupCallListener, removeCallListener,
} from './conversations.listeners';
import {
  handleErrorWithRetry, createEnhancedError,
  getConversationEntityId, findConversationIndex,
  isAMessage, shouldLastMessageAndUnreadCountBeUpdated,
  applyReceiptToConversations, getTypingIndicatorKey,
  dedupeConversations, mergeSilentRefresh, orderPinnedFirst,
} from './conversations.utils';
import {
  setupUIEventSubscriptions, setupCallEventSubscriptions, isOlderThanShown,
} from './conversations.ui-events';
import { ConnectionStateService } from './connection-state.service';
import { OfflineHubService } from './offline-hub.service';
import { OfflineHub } from '../utils/offline/offline-hub';
import { isOfflineOn } from '../utils/offline/offline-gate';
import { isKeywordSearch, offlineStateFor } from '../utils/offline/list-states';
import {
  isSending,
  isSyncDelivered,
  localIdOf,
  muidOf,
  OfflineFailureReason,
  serverIdOf,
} from '../utils/offline/identity';
import { findRowIndex } from '../utils/offline/reconcile';
import {
  applyFirstServerPage,
  fetchConversationsTwoPhase,
  isPlainConversationsRequest,
  mergeFirstPage,
  keepLocalReadsCleared,
  reconcileSyncPage,
} from './conversations.offline';

// Re-export types for backward compatibility
export type { ConversationId, ConversationOperationContext } from './conversations.types';

/** The local handle of an own send (its local id, else its muid). */
function sendKeyOf(message: CometChat.BaseMessage): string {
  return localIdOf(message) || muidOf(message);
}

/** Most pages one offline load-more reads while its pages list no new row. */
const MAX_OFFLINE_READ_ON = 10;

/**
 * ConversationsService
 *
 * Singleton service managing conversation list state and SDK interactions.
 * Uses Angular Signals for reactive state with Observable API for backward compatibility.
 *
 * @Injectable providedIn: 'root'
 */
@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private connectionState = inject(ConnectionStateService);
  private offlineHub = inject(OfflineHubService);

  // ==================== State Signals ====================
  private conversationsSignal = signal<CometChat.Conversation[]>([]);
  private loadingStateSignal = signal<boolean>(false);
  private errorStateSignal = signal<Error | null>(null);
  /**
   * Offline (D84): the offline state ("Connect to load chats" or "Connect to search") is up
   * because the device was not connected, so the first page loads once by itself when the
   * connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;
  /**
   * Offline (D84 rule 3): the first page was read with no connection and nothing on screen, so the
   * list shows "Connect to load chats" in place of its error view (the app's own error view still
   * wins). The error state is set and `error` fires once. Always false with offline off.
   */
  private readonly connectToLoadSignal = signal(false);
  readonly connectToLoad = this.connectToLoadSignal.asReadonly();
  /**
   * Offline (D84 rule 7): a list with a search keyword could not be read with no connection and
   * nothing is saved for it, so it says "Connect to search" (no error state, no `error`). A filter
   * alone is the plain list. Always false with offline off.
   */
  private readonly connectToSearchSignal = signal(false);
  readonly connectToSearch = this.connectToSearchSignal.asReadonly();
  private clearOfflineStates(): void {
    if (this.connectToLoadSignal()) this.connectToLoadSignal.set(false);
    if (this.connectToSearchSignal()) this.connectToSearchSignal.set(false);
  }
  /**
   * Offline (D83): a first-page load the user or app started failed while conversations were
   * on screen. The rows stay and no error view shows; this is how the failure reaches `onError`.
   * Never emits with offline off.
   */
  private readonly keptRowsErrorSubject = new Subject<Error>();
  readonly keptRowsError$: Observable<Error> = this.keptRowsErrorSubject.asObservable();
  private activeConversationSignal = signal<CometChat.Conversation | null>(null);
  private typingIndicatorsSignal = signal<Map<string, CometChat.TypingIndicator>>(new Map());
  private allConversationsSignal = signal<CometChat.Conversation[]>([]);

  // ==================== Public Signal API ====================
  /**
   * The conversation list as the UI should show it: pinned chats first.
   *
   * Ordering lives here rather than in the mutation methods so that no insert
   * path can bypass it — the stored signal stays purely recency-ordered and
   * this view applies the pin rule once, for every reader.
   */
  readonly conversations = computed(() => orderPinnedFirst(this.conversationsSignal()));
  readonly loadingState = this.loadingStateSignal.asReadonly();
  readonly errorState = this.errorStateSignal.asReadonly();
  readonly activeConversation = this.activeConversationSignal.asReadonly();
  readonly typingIndicators = this.typingIndicatorsSignal.asReadonly();

  // ==================== Observable API (backward compat) ====================
  readonly conversations$: Observable<CometChat.Conversation[]> = toObservable(this.conversations);
  readonly loadingState$: Observable<boolean> = toObservable(this.loadingStateSignal);
  readonly errorState$: Observable<Error | null> = toObservable(this.errorStateSignal);
  readonly activeConversation$: Observable<CometChat.Conversation | null> = toObservable(this.activeConversationSignal);
  readonly typingIndicators$: Observable<Map<string, CometChat.TypingIndicator>> = toObservable(this.typingIndicatorsSignal);

  readonly hasConversations = computed(() => this.conversationsSignal().length > 0);
  readonly isLoading = computed(() => this.loadingStateSignal());
  readonly hasError = computed(() => this.errorStateSignal() !== null);

  // Tracks whether more pages are available for pagination.
  // Reset to true whenever a fresh first-page fetch completes (e.g. on reconnect).
  private hasMoreSignal = signal<boolean>(true);
  readonly hasMore = this.hasMoreSignal.asReadonly();

  // ==================== Configuration ====================
  private conversationsRequest?: CometChat.ConversationsRequest;
  private requestBuilder?: CometChat.ConversationsRequestBuilder;
  private messageListenerId = `conversations_${Date.now()}`;
  private userListenerId = `conversations_user_${Date.now()}`;
  private groupListenerId = `conversations_group_${Date.now()}`;
  private callListenerId = `conversations_call_${Date.now()}`;
  private retryAttempts = new Map<string, number>();
  /** Guard: only re-fetch on reconnect after the first fetch has completed. */
  private initialFetchDone = false;
  /** The builder of the last first-page fetch: a reconnect re-runs the request on screen. */
  private activeBuilder?: CometChat.ConversationsRequestBuilder;
  /**
   * Whether that request is anything but the plain list (filtered, tagged, searched, unread,
   * pinned-by, agentic). With offline on it follows what the request does, not whether the app
   * passed a builder: a builder that only sets a limit is the plain list.
   */
  private customRequestActive = false;
  /** Offline path: a sync page's resync of a filtered list is running; further sync pages wait for it. */
  private resyncInFlight = false;
  /** Offline path: bumped per first-page read, so a late page of an older read is dropped. */
  private offlineReadGen = 0;
  /** Offline path: page one's read is still waiting for its server phase (the cached page may already show). */
  private firstPageInFlight = false;
  /** A load-more asked for while page one was in flight; it runs when that read lands. */
  private loadMoreDeferred = false;
  /** Set once this list has run an offline-path read; scopes session cleanup. */
  private offlinePathUsed = false;
  /** An offline read past the cache closed paging; the connection coming back opens it again. */
  private pagingClosedOffline = false;
  /**
   * The preview each own pending send replaced, by its local handle: a send the
   * SDK discards takes its chat's preview back to it. `listed` is false when the
   * send's chat was not listed before it.
   */
  private previewsBeforeSend = new Map<string, { listed: boolean; last?: CometChat.BaseMessage }>();

  private ccMessageSentSubscription: Subscription | null = null;
  private ccMessageDeletedSubscription: Subscription | null = null;
  private callEventSubscriptions: Subscription[] = [];
  private uiEventSubscriptions: Subscription[] = [];

  constructor() {
    this.setupSDKListeners();
    this.setupSentMessageListener();
    this.setupDeletedMessageListener();
    this.callEventSubscriptions = setupCallEventSubscriptions(c => this.refreshSingleConversation(c));
    this.uiEventSubscriptions = setupUIEventSubscriptions({
      refreshSingleConversation: m => this.refreshSingleConversation(m),
      refreshForGroupAction: m => this.refreshForGroupAction(m),
      removeConversationSilently: id => this.removeConversationSilently(id),
      updateGroupOnConversation: g => this.updateGroupOnConversation(g),
      updateUserOnConversation: u => this.updateUserOnConversation(u),
      addConversationToTop: conv => { const c = dedupeConversations([conv, ...this.allConversationsSignal()]); this.allConversationsSignal.set(c); this.conversationsSignal.set(c); },
      removeConversationFromList: id => this.removeConversationSilently(id),
      requestBuilder: this.requestBuilder,
    });

    // Single shared connection listener — re-fetch on WebSocket reconnect.
    // Guard: only fires after the initial fetch has completed, so the startup
    // onConnected event (which arrives around the same time as the first fetch)
    // does not cause a duplicate load.
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.initialFetchDone) return;
        // Kill switch: offline was switched off under un-acked previews.
        if (this.offlinePathUsed && !isOfflineOn()) this.failStrandedPreviews();
        // Offline path: no refetch (the SDK's sweep and onConversationSyncCompleted
        // reconcile, UIK-SYNC-01), except a load-more an offline refusal closed.
        if (isOfflineOn()) {
          // The offline state is up because the device was offline: the first page loads once now (D84 rule 8).
          if (
            this.reloadOnConnect &&
            (this.connectToLoadSignal() || this.connectToSearchSignal()) &&
            this.allConversationsSignal().length === 0
          ) {
            this.reloadOnConnect = false;
            void this.fetchConversations(this.activeBuilder);
            return;
          }
          return this.reopenPagingClosedOffline();
        }
        CometChatLogger.info('ConversationsService', 'WebSocket reconnected — refreshing conversation list');
        const builder = this.activeBuilder ?? this.requestBuilder
          ?? new CometChat.ConversationsRequestBuilder().setLimit(30);
        // silent=true: skip loading state and shimmer delay — just swap the list
        this.fetchConversations(builder, true).catch(e =>
          CometChatLogger.error('ConversationsService', 'Error refreshing conversations on reconnect:', e)
        );
      });

    this.setupOfflineStreams();

    this.destroyRef.onDestroy(() => { this.removeListeners(); this.resetState(); });
  }

  /**
   * Kill switch (UIK-LIFE-03): a preview still showing an un-acked own send
   * turns failed (direct). The message list, when open, raises the notice.
   */
  private failStrandedPreviews(): void {
    const hub = OfflineHub.getInstance();
    for (const conversation of this.allConversationsSignal()) {
      const last = conversation.getLastMessage?.() as CometChat.BaseMessage | undefined;
      if (last && serverIdOf(last) === 0 && isSending(last) && hub.directFailureOf(last) === undefined) {
        hub.markStranded(last);
      }
    }
  }

  /**
   * Offline hub streams. With offline off the hub never emits, so none of
   * these handlers runs.
   */
  private setupOfflineStreams(): void {
    // An own send moves its chat to the top with that preview from the moment
    // it is pending (BEH-CONV-01); a failed one updates the preview mark. A fresh
    // reference so the OnPush item re-renders.
    this.offlineHub.sendState$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event.gen !== this.offlineHub.gen || !event.message) return;
      // A send the SDK dropped (discarded, or rejected as DISCARDED) is not a failed send.
      const dropped =
        event.state === 'discarded' ||
        (event.state === 'failed' &&
          (event.reason === OfflineFailureReason.discarded ||
            event.reason === OfflineFailureReason.queueOverflow));
      if (dropped) {
        this.restorePreviewAfterDiscard(event.message);
      } else if (event.state === 'sending' || event.state === 'failed') {
        const message = Object.create(Object.getPrototypeOf(event.message), Object.getOwnPropertyDescriptors(event.message)) as CometChat.BaseMessage;
        if (event.state === 'sending') this.rememberPreviewBeforeSend(event.message);
        this.refreshSingleConversation(message);
      } else {
        this.previewsBeforeSend.delete(sendKeyOf(event.message));
      }
    });
    this.offlineHub.conversationSync$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event.gen !== this.offlineHub.gen || !this.initialFetchDone || !isOfflineOn()) return;
      if (this.customRequestActive) {
        // A filtered list does not reconcile against the unfiltered sync page:
        // it re-runs its own request, two-phase, once, and merges the answer into
        // the rows shown. A sync page that lands while that runs starts no second one.
        if (this.resyncInFlight) return;
        this.resyncInFlight = true;
        void this.fetchConversations(this.activeBuilder, true).finally(() => {
          this.resyncInFlight = false;
        });
        return;
      }
      const next = keepLocalReadsCleared(
        reconcileSyncPage(this.allConversationsSignal(), event.conversations),
        (id, type) => this.offlineHub.wasReadLocally(id, type)
      );
      this.allConversationsSignal.set(next); this.conversationsSignal.set(next);
    });
    this.offlineHub.cacheReset$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.offlinePathUsed) return;
      void this.fetchConversations(this.activeBuilder);
    });
    this.offlineHub.session$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.offlinePathUsed) return;
      this.offlineReadGen++;
      this.firstPageInFlight = false;
      this.resyncInFlight = false;
      this.loadMoreDeferred = false;
      this.previewsBeforeSend.clear();
      this.reloadOnConnect = false;
      this.clearOfflineStates();
      this.allConversationsSignal.set([]); this.conversationsSignal.set([]);
      this.loadingStateSignal.set(false);
    });
  }

  /**
   * After a reconnect (offline on): a load-more the user asked for that was
   * refused offline closed paging. It opens again and that load runs now: the end
   * of the list is where the user left it and its scroll trigger already fired.
   */
  private reopenPagingClosedOffline(): void {
    if (!this.pagingClosedOffline) return;
    this.pagingClosedOffline = false;
    this.hasMoreSignal.set(true);
    void this.fetchNextConversations(true);
  }

  /** Remember the preview an own pending send is about to replace (once per send). */
  private rememberPreviewBeforeSend(message: CometChat.BaseMessage): void {
    const key = sendKeyOf(message);
    if (!key || this.previewsBeforeSend.has(key)) return;
    const row = this.allConversationsSignal().find(
      c => c.getConversationId() === message.getConversationId()
    );
    const last = row?.getLastMessage?.() as CometChat.BaseMessage | undefined;
    if (last && findRowIndex([last], message) !== -1) return;
    this.previewsBeforeSend.set(key, { listed: !!row, last });
  }

  /**
   * A send the SDK discarded was never sent: its chat's preview goes back to the
   * message before it, in place, instead of showing it as a failed send. A chat
   * the send itself had listed is removed again.
   */
  private restorePreviewAfterDiscard(message: CometChat.BaseMessage): void {
    const key = sendKeyOf(message);
    const before = key ? this.previewsBeforeSend.get(key) : undefined;
    this.previewsBeforeSend.delete(key);
    if (!before) return;
    const convs = this.allConversationsSignal();
    const idx = convs.findIndex(c => c.getConversationId() === message.getConversationId());
    if (idx === -1) return;
    const row = convs[idx];
    const last = row.getLastMessage?.() as CometChat.BaseMessage | undefined;
    if (!last || findRowIndex([last], message) === -1) return;
    if (!before.listed) {
      this.removeConversationSilently(getConversationEntityId(row));
      return;
    }
    if (!before.last) return;
    // A fresh reference so the OnPush item re-renders.
    const restored = Object.create(
      Object.getPrototypeOf(row),
      Object.getOwnPropertyDescriptors(row)
    ) as CometChat.Conversation;
    restored.setLastMessage(before.last);
    const next = [...convs];
    next[idx] = restored;
    this.allConversationsSignal.set(next); this.conversationsSignal.set(next);
  }

  /**
   * Offline path of {@link fetchConversations}: the cached page paints first, the server page replaces it.
   * `silent` is the kit's own resync of a filtered list: its pages merge into the rows shown
   * instead (rows below page one stay; only rows its cached phase delivered and the server lacks go).
   */
  private async fetchConversationsOffline(builder: CometChat.ConversationsRequestBuilder, silent: boolean): Promise<void> {
    this.offlinePathUsed = true;
    const gen = ++this.offlineReadGen;
    const stale = () => gen !== this.offlineReadGen;
    this.firstPageInFlight = true;
    if (!silent) { this.allConversationsSignal.set([]); this.conversationsSignal.set([]); this.loadingStateSignal.set(true); }
    this.errorStateSignal.set(null);
    this.reloadOnConnect = false;
    this.clearOfflineStates();
    const request = builder.build();
    this.conversationsRequest = request;
    this.customRequestActive = !isPlainConversationsRequest(request);
    const cachedKeys = new Set<string>();
    await fetchConversationsTwoPhase(request, {
      onCached: page => {
        if (stale()) return;
        if (silent) page.forEach(c => cachedKeys.add(getConversationEntityId(c)));
        const merged = silent
          ? mergeFirstPage(this.allConversationsSignal(), page, new Set())
          : dedupeConversations([...this.allConversationsSignal(), ...page]);
        this.allConversationsSignal.set(merged); this.conversationsSignal.set(merged);
        if (merged.length > 0) { this.clearOfflineStates(); this.loadingStateSignal.set(false); }
      },
      onServer: page => {
        if (stale()) return;
        const merged = silent
          ? mergeFirstPage(this.allConversationsSignal(), page, cachedKeys)
          : applyFirstServerPage(this.allConversationsSignal(), page);
        this.allConversationsSignal.set(merged); this.conversationsSignal.set(merged);
        this.reloadOnConnect = false;
        this.clearOfflineStates();
        this.loadingStateSignal.set(false);
        this.hasMoreSignal.set(true);
        this.initialFetchDone = true;
      },
      onError: (error, notConnected) => {
        if (stale()) return;
        this.loadingStateSignal.set(false);
        this.initialFetchDone = true;
        const enhanced = createEnhancedError(error, 'fetchConversations');
        if (this.allConversationsSignal().length === 0) {
          // Nothing on screen. Offline: "Connect to search" when the request carries a keyword (no
          // error state, no `error`), else the offline state in the error state (`error` once, D84
          // rules 3 and 7); any other failure is the error view with Retry (rule 4). One more load
          // when the connection is back if that is why it failed (rule 8).
          this.reloadOnConnect = notConnected;
          const state = offlineStateFor(notConnected, isKeywordSearch(request));
          this.connectToSearchSignal.set(state === 'connect_to_search');
          this.connectToLoadSignal.set(state === 'connect_to_load');
          if (state !== 'connect_to_search') this.setError(enhanced);
        } else if (!silent && !notConnected) {
          // Saved chats on screen: they stay, no error view. A real failure of a load the user or app
          // started reaches `error` once (rule 5); offline (rule 2) and a load the kit started
          // (silent) report nothing.
          this.keptRowsErrorSubject.next(enhanced);
        }
      },
    });
    // Page one has landed: a load-more asked for meanwhile runs now (a newer read takes over otherwise).
    if (stale()) return;
    this.firstPageInFlight = false;
    if (this.loadMoreDeferred) {
      this.loadMoreDeferred = false;
      // A failed first page with nothing on screen shows the error view: nothing to load more of.
      if (this.errorStateSignal() === null) void this.fetchNextConversations();
    }
  }

  /**
   * Offline path of {@link fetchNextConversations}. A server page that lists no
   * new row (the reconnect sync already listed them) is not the end: the read
   * goes on, up to {@link MAX_OFFLINE_READ_ON} pages, or the list would stop
   * growing with the scroll trigger already spent. A read refused offline closes
   * paging until the connection is back.
   */
  private async fetchNextConversationsOffline(
    request: CometChat.ConversationsRequest,
    automatic = false
  ): Promise<boolean> {
    let hasMore = false;
    const gen = this.offlineReadGen;
    this.loadingStateSignal.set(true); this.errorStateSignal.set(null);
    for (let reads = 0; reads < MAX_OFFLINE_READ_ON; reads++) {
      const listedBefore = this.conversationsSignal().length;
      let grew = false;
      let refused = false;
      hasMore = false;
      await fetchConversationsTwoPhase(request, {
        onCached: page => {
          if (gen !== this.offlineReadGen) return;
          const updated = dedupeConversations([...this.conversationsSignal(), ...page]);
          this.allConversationsSignal.set(updated); this.conversationsSignal.set(updated);
        },
        onServer: page => {
          if (gen !== this.offlineReadGen) return;
          const updated = dedupeConversations([...this.conversationsSignal(), ...page]);
          this.allConversationsSignal.set(updated); this.conversationsSignal.set(updated);
          grew = updated.length > listedBefore;
          // Only an empty page from the server ends the list (BEH-READ-09b).
          hasMore = page.length > 0;
          this.hasMoreSignal.set(hasMore);
        },
        onError: (error, notConnected) => {
          if (gen !== this.offlineReadGen) return;
          if (!notConnected) {
            // The reconnect reopened this read by itself: a failure with rows shown stays quiet.
            if (!(automatic && this.conversationsSignal().length > 0))
              this.errorStateSignal.set(createEnhancedError(error, 'fetchNextConversations'));
          } else {
            refused = true;
            this.pagingClosedOffline = true;
            this.hasMoreSignal.set(false);
          }
        },
      });
      if (gen !== this.offlineReadGen || refused || !hasMore || grew) break;
    }
    this.loadingStateSignal.set(false);
    return hasMore;
  }

  // ==================== Error Handling ====================
  clearError(): void { this.errorStateSignal.set(null); }
  private setError(e: Error): void { this.errorStateSignal.set(e); }

  // ==================== Public Methods ====================
  setConversationsRequestBuilder(builder: CometChat.ConversationsRequestBuilder): void { this.requestBuilder = builder; this.conversationsRequest = undefined; }
  setActiveConversation(conversation: CometChat.Conversation | null): void { this.activeConversationSignal.set(conversation); }
  getConversations(): CometChat.Conversation[] { return this.conversationsSignal(); }

  async fetchConversations(builder?: CometChat.ConversationsRequestBuilder, silent = false): Promise<void> {
    if (!silent || builder !== this.activeBuilder) {
      this.activeBuilder = builder ?? this.requestBuilder;
      this.customRequestActive = !!(builder ?? this.requestBuilder);
    }
    if (isOfflineOn()) {
      return this.fetchConversationsOffline(builder || this.requestBuilder || new CometChat.ConversationsRequestBuilder().setLimit(30), silent);
    }
    try {
      if (!silent) {
        // Normal load: clear immediately and show shimmer
        this.allConversationsSignal.set([]); this.conversationsSignal.set([]);
        this.loadingStateSignal.set(true);
      }
      // Silent reconnect load: keep existing list visible until new data arrives
      this.errorStateSignal.set(null);
      const t0 = Date.now();
      const b = builder || this.requestBuilder || new CometChat.ConversationsRequestBuilder().setLimit(30);
      this.conversationsRequest = b.build();
      const conversations = await this.conversationsRequest.fetchNext();
      // A realtime listener (e.g. a group-action message for a just-created group)
      // can insert a conversation while this fetch is in flight. Merge those in front
      // of the fetched page and dedupe by entity id so the same conversation is never
      // listed twice — keep the realtime copy, drop the duplicate from the page.
      // A silent reconnect reload follows the server's order, since the rows on
      // screen are the stale ones (D1) - but a row a realtime event updated
      // while this fetch was in flight is newer than the fetch and is kept.
      // A normal load keeps the realtime copy.
      const merged = silent
        ? mergeSilentRefresh(conversations, this.allConversationsSignal())
        : dedupeConversations([...this.allConversationsSignal(), ...conversations]);
      this.allConversationsSignal.set(merged); this.conversationsSignal.set(merged);
      // Only apply shimmer minimum delay on the initial (non-silent) fetch
      if (!silent) {
        await new Promise<void>(r => setTimeout(r, Math.max(0, 1000 - (Date.now() - t0))));
      }
      this.loadingStateSignal.set(false);
      // After a fresh first-page fetch, pagination is available again
      this.hasMoreSignal.set(true);
      this.initialFetchDone = true;
    } catch (error) {
      this.loadingStateSignal.set(false);
      // The first page has been attempted, even though it failed. Without this the reconnect
      // subscription's `initialFetchDone` guard never opens, so a list whose first load failed
      // offline stayed on the error view for the rest of the session: the reconnect that would
      // have reloaded it returned early. The offline path already reports the attempt the same
      // way (`onError` above). `handleErrorWithRetry` retries and then throws, so this is set
      // before it runs.
      this.initialFetchDone = true;
      await handleErrorWithRetry(error, 'fetchConversations', this.retryAttempts, this.setError.bind(this), () => this.fetchConversations(builder));
    }
  }

  async fetchNextConversations(automatic = false): Promise<boolean> {
    if (!this.conversationsRequest) return false;
    if (this.loadingStateSignal()) return true;
    if (isOfflineOn()) {
      // Page one's server read is still running on this request: the SDK refuses a second read on it,
      // and its rows would replace anything below page one. Asked again once page one lands.
      if (this.firstPageInFlight) { this.loadMoreDeferred = true; return true; }
      // The error view is up with nothing on screen: only a retry or the reconnect reload leaves it.
      if (this.errorStateSignal() !== null && this.conversationsSignal().length === 0) return false;
      return this.fetchNextConversationsOffline(this.conversationsRequest, automatic);
    }
    try {
      this.loadingStateSignal.set(true); this.errorStateSignal.set(null);
      const next = await this.conversationsRequest.fetchNext();
      // Dedupe so a conversation already promoted to the list by a realtime event
      // isn't added again when it also comes back in the next page.
      const updated = dedupeConversations([...this.conversationsSignal(), ...next]);
      this.allConversationsSignal.set(updated); this.conversationsSignal.set(updated);
      this.loadingStateSignal.set(false);
      const hasMore = next.length > 0;
      this.hasMoreSignal.set(hasMore);
      return hasMore;
    } catch (error) {
      this.loadingStateSignal.set(false);
      this.errorStateSignal.set(createEnhancedError(error, 'fetchNextConversations'));
      return false;
    }
  }

  async deleteConversation(conversationWith: string, conversationType: string): Promise<void> {
    try {
      this.errorStateSignal.set(null);
      await CometChat.deleteConversation(conversationWith, conversationType);
      this.removeConversation(conversationWith);
    } catch (error) {
      await handleErrorWithRetry(error, 'deleteConversation', this.retryAttempts, this.setError.bind(this), () => this.deleteConversation(conversationWith, conversationType));
    }
  }

  searchConversations(searchText: string): void {
    if (!searchText?.trim()) { this.conversationsSignal.set([...this.allConversationsSignal()]); return; }
    const lower = searchText.toLowerCase();
    this.conversationsSignal.set(this.allConversationsSignal().filter(conv => {
      const name = conv.getConversationWith().getName().toLowerCase();
      const last = conv.getLastMessage();
      const text = last instanceof CometChat.TextMessage ? last.getText().toLowerCase() : '';
      return name.includes(lower) || text.includes(lower);
    }));
  }

  removeConversation(id: string): void {
    const convs = [...this.allConversationsSignal()];
    const toRemove = convs.find(c => getConversationEntityId(c) === id);
    const filtered = convs.filter(c => getConversationEntityId(c) !== id);
    this.allConversationsSignal.set(filtered); this.conversationsSignal.set(filtered);
    if (toRemove) CometChatConversationEvents.ccConversationDeleted.next(toRemove);
  }

  findConversation(id: string): CometChat.Conversation | null {
    return this.allConversationsSignal().find(c => getConversationEntityId(c) === id) || null;
  }

  updateConversationList(conversation: CometChat.Conversation, message?: CometChat.BaseMessage): void {
    const msg = message || conversation.getLastMessage();
    if (msg) {
      if (!isAMessage(msg) || !shouldLastMessageAndUnreadCountBeUpdated(msg)) return;
      const me = CometChatUIKit.getLoggedInUser();
      const active = this.activeConversationSignal();
      const isActiveConversation = active && msg.getConversationId() === active.getConversationId();
      // Only increment unread count if:
      // 1. The message is not from the logged-in user
      // 2. The conversation is NOT currently active (open)
      // When the conversation is active, the message list handles the unread count:
      // - If user is at bottom: markAsRead keeps count at 0 (no flash)
      // - If user is scrolled up: handleNewMessagesImpl explicitly calls
      //   updateConversationUnreadCount to increment the count
      // A message the SDK's catch-up sweep delivered is already counted in the
      // synced conversation's unread count: no +1 for it (UIK-SYNC-02).
      const alreadyCounted = isOfflineOn() && isSyncDelivered(msg);
      if (me && msg.getSender().getUid() !== me.getUid() && !isActiveConversation && !alreadyCounted) {
        conversation.setUnreadMessageCount((conversation.getUnreadMessageCount() ?? 0) + 1);
        // The chat is unread again for real, so the read this device made while
        // offline no longer speaks for it (D3).
        this.offlineHub.forgetLocalRead(
          getConversationEntityId(conversation),
          String(conversation.getConversationType() ?? '')
        );
      }
      if (msg instanceof CometChat.Action &&
          msg.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
          conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group) {
        const af = msg.getActionFor(); const rv = msg.getReceiver();
        if (af instanceof CometChat.Group && rv instanceof CometChat.Group && rv.getGuid() === af.getGuid()) {
          const g = conversation.getConversationWith() as CometChat.Group;
          g.setMembersCount(af.getMembersCount()); conversation.setConversationWith(g);
        }
      }
      conversation.setLastMessage(msg);
    }
    const convs = [...this.allConversationsSignal()];
    const idx = findConversationIndex(convs, getConversationEntityId(conversation));
    if (idx !== -1) convs.splice(idx, 1);
    const updated = [conversation, ...convs];
    this.allConversationsSignal.set(updated); this.conversationsSignal.set(updated);
  }

  replaceConversation(newConversation: CometChat.Conversation): boolean {
    const id = getConversationEntityId(newConversation);
    const convs = [...this.allConversationsSignal()];
    const idx = findConversationIndex(convs, id);
    if (idx === -1) return false;
    convs[idx] = newConversation;
    this.allConversationsSignal.set(convs); this.conversationsSignal.set(convs);
    return true;
  }

  /**
   * A pin or unpin event (another device, an admin, or this client's own call) puts its pin state
   * on the row it names. The SDK's event carries a partial conversation (its user or group has no
   * name or avatar, and it has no last message), so the row is never swapped for it: the row keeps
   * its user/group, last message and unread count, and the pinned-first view re-sorts it. This
   * matches the Android UI Kit's `withPinState`. Returns false when no row matches.
   */
  applyPinState(conversation: CometChat.Conversation): boolean {
    const key = pinKeyOf(conversation);
    if (!key) return false;
    const convs = [...this.allConversationsSignal()];
    const idx = convs.findIndex(c => samePinKey(pinKeyOf(c), key));
    if (idx === -1) return false;
    const old = convs[idx];
    const row = withPinState(old, conversation);
    convs[idx] = row;
    this.allConversationsSignal.set(convs);
    this.conversationsSignal.set(this.conversationsSignal().map(c => (c === old ? row : c)));
    return true;
  }

  /**
   * Offline path of a pin or unpin event (UIK-CONV-01). The event may come from
   * another device, an admin or the reconnect sweep, so it is matched by
   * (type, with), case-insensitive; a 1:1 event whose peer is the user is
   * ignored. A chat not on screen is fetched and inserted (dropped if the fetch
   * fails), except in a filtered list, which only updates rows it shows.
   */
  async applyPinEvent(conversation: CometChat.Conversation): Promise<void> {
    const key = pinKeyOf(conversation);
    if (!key) return;
    const me = CometChatUIKit.getLoggedInUser()?.getUid?.()?.toLowerCase();
    if (key.type === CometChat.RECEIVER_TYPE.USER && me && key.with === me) return;
    const gen = this.offlineReadGen;
    // A fetched conversation is complete, so it replaces a row that appeared meanwhile.
    const replace = (incoming: CometChat.Conversation): boolean => {
      const convs = [...this.allConversationsSignal()];
      const idx = convs.findIndex(c => samePinKey(pinKeyOf(c), key));
      if (idx === -1) return false;
      // Keep the row's last message if the fetched copy has none.
      if (!incoming.getLastMessage?.() && convs[idx].getLastMessage?.()) incoming.setLastMessage(convs[idx].getLastMessage());
      convs[idx] = incoming;
      this.allConversationsSignal.set(convs); this.conversationsSignal.set(convs);
      return true;
    };
    if (this.applyPinState(conversation) || this.customRequestActive) return;
    if (!conversation.getLastMessage?.() && !conversation.isPinned?.()) return; // an unpin of a chat not shown changes nothing
    try {
      const fetched = await CometChat.getConversation(key.with, key.type);
      if (gen !== this.offlineReadGen || !fetched) return;
      if (!replace(fetched)) this.insertConversationAt(fetched, 0);
    } catch (error) {
      CometChatLogger.warn('ConversationsService', 'Pinned chat could not be fetched; ignored:', error);
    }
  }

  moveConversationToTop(id: string): boolean {
    const convs = [...this.allConversationsSignal()];
    const idx = findConversationIndex(convs, id);
    if (idx === -1) return false;
    convs.unshift(...convs.splice(idx, 1));
    this.allConversationsSignal.set(convs); this.conversationsSignal.set(convs);
    return true;
  }

  insertConversationAt(conversation: CometChat.Conversation, index: number): void {
    const convs = [...this.allConversationsSignal()];
    convs.splice(Math.max(0, Math.min(index, convs.length)), 0, conversation);
    this.allConversationsSignal.set(convs); this.conversationsSignal.set(convs);
  }

  getConversationIndex(id: string): number { return findConversationIndex(this.allConversationsSignal(), id); }

  // ==================== Receipt Methods ====================

  updateConversationUnreadCount(id: string, count: number): void {
    try {
      const convs = [...this.allConversationsSignal()];
      const idx = findConversationIndex(convs, id);
      if (idx === -1) return;
      convs[idx].setUnreadMessageCount(count);
      this.allConversationsSignal.set(convs); this.conversationsSignal.set(convs);
    } catch (e) { CometChatLogger.error('ConversationsService', 'Error updating unread count:', e); }
  }

  updateConversationReadStatus(id: string, message: CometChat.BaseMessage): void {
    try {
      const convs = [...this.allConversationsSignal()];
      const idx = findConversationIndex(convs, id);
      if (idx === -1) return;
      const conv = convs[idx];
      conv.setUnreadMessageCount(0);
      const last = conv.getLastMessage();
      if (last && last.getId() === message.getId()) {
        const readAt = message.getReadAt();
        if (readAt) { last.setReadAt(readAt); conv.setLastMessage(last); }
      }
      this.allConversationsSignal.set(convs); this.conversationsSignal.set(convs);
    } catch (e) { CometChatLogger.error('ConversationsService', 'Error updating read status:', e); }
  }

  private handleReceipt(receipt: CometChat.MessageReceipt, isGroup: boolean): void {
    try {
      const { updated, conversations } = applyReceiptToConversations([...this.allConversationsSignal()], receipt, isGroup);
      if (updated) { this.allConversationsSignal.set(conversations); this.conversationsSignal.set(conversations); }
    } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling receipt:', e); }
  }

  // ==================== Cleanup ====================

  cleanup(): void { this.removeListeners(); this.resetState(); }

  removeListeners(): void {
    removeMessageListener(this.messageListenerId); removeUserListener(this.userListenerId);
    removeGroupListener(this.groupListenerId); removeCallListener(this.callListenerId);
    // Connection listener is owned by ConnectionStateService — nothing to remove here.
    this.ccMessageSentSubscription?.unsubscribe(); this.ccMessageSentSubscription = null;
    this.ccMessageDeletedSubscription?.unsubscribe(); this.ccMessageDeletedSubscription = null;
    this.callEventSubscriptions.forEach(s => s.unsubscribe()); this.callEventSubscriptions = [];
    this.uiEventSubscriptions.forEach(s => s.unsubscribe()); this.uiEventSubscriptions = [];
  }

  private resetState(): void {
    this.allConversationsSignal.set([]); this.conversationsSignal.set([]);
    this.loadingStateSignal.set(false); this.errorStateSignal.set(null);
    this.activeConversationSignal.set(null); this.typingIndicatorsSignal.set(new Map());
    this.retryAttempts.clear();
    this.hasMoreSignal.set(true);
    this.initialFetchDone = false;
    this.reloadOnConnect = false;
    this.clearOfflineStates();
  }

  // ==================== SDK Listener Setup ====================

  private setupSDKListeners(): void {
    const nm = (m: CometChat.BaseMessage) => this.handleNewMessage(m);
    setupMessageListener(this.messageListenerId, {
      onTextMessageReceived: nm, onMediaMessageReceived: nm,
      onCustomMessageReceived: nm, onInteractiveMessageReceived: nm,
      onCardMessageReceived: nm,
      onAIAssistantMessageReceived: nm,
      onMessageEdited: m => this.handleMessageUpdate(m),
      onMessageDeleted: m => this.handleMessageDelete(m),
      onMessagesDelivered: r => this.handleReceipt(r, false),
      onMessagesRead: r => this.handleReceipt(r, false),
      onMessagesDeliveredToAll: r => this.handleReceipt(r, true),
      onMessagesReadByAll: r => this.handleReceipt(r, true),
      onTypingStarted: t => this.handleTypingStarted(t),
      onTypingEnded: t => this.handleTypingEnded(t),
    }, this.ngZone);
    setupUserListener(this.userListenerId, u => this.handleUserStatusChange(u), this.ngZone);
    setupGroupListener(this.groupListenerId, nm, this.ngZone);
    setupCallListener(this.callListenerId, c => this.refreshSingleConversation(c), this.ngZone);
  }

  private setupSentMessageListener(): void {
    this.ccMessageSentSubscription = CometChatMessageEvents.ccMessageSent.subscribe((data: IMessages) => {
      if (data.status === MessageStatus.success) this.refreshSingleConversation(data.message);
    });
  }

  private setupDeletedMessageListener(): void {
    this.ccMessageDeletedSubscription = CometChatMessageEvents.ccMessageDeleted.subscribe(
      (message: CometChat.BaseMessage) => this.handleMessageDelete(message)
    );
  }

  // ==================== Private Message Handlers ====================

  private handleNewMessage(message: CometChat.BaseMessage): void {
    try {
      const s = CometChatUIKit.conversationUpdateSettings;
      const cat = message.getCategory();
      if (s && !s.shouldUpdateOnCustomMessages?.() && cat === CometChatUIKitConstants.MessageCategory.custom) return;
      if (s && !s.shouldUpdateOnGroupActions?.() && cat === CometChatUIKitConstants.MessageCategory.action) return;
      const active = this.activeConversationSignal();
      const isActive = active && message.getConversationId() === active.getConversationId();
      const me = CometChatUIKit.getLoggedInUser();
      // Swept messages are not receipted one by one (UIK-SYNC-02).
      const swept = isOfflineOn() && isSyncDelivered(message);
      if (me && message.getSender().getUid() !== me.getUid() && !message.getDeliveredAt() && !isActive && !swept)
        CometChat.markAsDelivered(message).catch(() => {});
      this.refreshSingleConversation(message);
    } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling new message:', e); }
  }

  private handleMessageUpdate(m: CometChat.BaseMessage): void { try { this.refreshSingleConversation(m); } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling message update:', e); } }
  private handleMessageDelete(m: CometChat.BaseMessage): void { try { this.refreshSingleConversation(m); } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling message delete:', e); } }

  /**
   * A kick, ban or scope change updates the row's preview and order only when
   * it is newer than the row's last message. A live action always is; one the
   * offline hub replays after the sync may not be (Android isOlderThan).
   */
  private refreshForGroupAction(action: CometChat.BaseMessage): void {
    const row = this.allConversationsSignal().find(c => c.getConversationId() === action.getConversationId());
    const shown = row?.getLastMessage();
    if (shown && isOlderThanShown(action, shown)) return;
    this.refreshSingleConversation(action);
  }

  private refreshSingleConversation(message: CometChat.BaseMessage, removeConv = false): void {
    try {
      const idx = this.allConversationsSignal().findIndex(c => c.getConversationId() === message.getConversationId());
      if (idx >= 0) {
        const conv = this.allConversationsSignal()[idx];
        removeConv ? this.removeConversation(getConversationEntityId(conv)) : this.updateConversationList(conv, message);
      } else {
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((c: CometChat.Conversation) => this.updateConversationList(c, message))
          .catch((e: CometChat.CometChatException) => CometChatLogger.error('ConversationsService', 'Error getting conversation from message:', e));
      }
    } catch (e) { CometChatLogger.error('ConversationsService', 'Error in refreshSingleConversation:', e); }
  }

  private handleTypingStarted(t: CometChat.TypingIndicator): void {
    try { const m = new Map(this.typingIndicatorsSignal()); m.set(getTypingIndicatorKey(t), t); this.typingIndicatorsSignal.set(m); }
    catch (e) { CometChatLogger.error('ConversationsService', 'Error handling typing started:', e); }
  }

  private handleTypingEnded(t: CometChat.TypingIndicator): void {
    try { const m = new Map(this.typingIndicatorsSignal()); m.delete(getTypingIndicatorKey(t)); this.typingIndicatorsSignal.set(m); }
    catch (e) { CometChatLogger.error('ConversationsService', 'Error handling typing ended:', e); }
  }

  private handleUserStatusChange(user: CometChat.User): void {
    try {
      this.conversationsSignal.set(this.conversationsSignal().map(conv => {
        const cw = conv.getConversationWith();
        if (cw instanceof CometChat.User && cw.getUid() === user.getUid()) cw.setStatus(user.getStatus());
        return conv;
      }));
    } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling user status change:', e); }
  }

  private updateGroupOnConversation(group: CometChat.Group): void {
    const guid = group.getGuid();
    const updated = this.allConversationsSignal().map(conv => {
      const cw = conv.getConversationWith();
      if (cw instanceof CometChat.Group && cw.getGuid() === guid) conv.setConversationWith(group);
      return conv;
    });
    this.allConversationsSignal.set([...updated]); this.conversationsSignal.set([...updated]);
  }

  private updateUserOnConversation(user: CometChat.User): void {
    const uid = user.getUid();
    const updated = this.allConversationsSignal().map(conv => {
      const cw = conv.getConversationWith();
      if (cw instanceof CometChat.User && cw.getUid() === uid) conv.setConversationWith(user);
      return conv;
    });
    this.allConversationsSignal.set([...updated]); this.conversationsSignal.set([...updated]);
  }

  private removeConversationSilently(id: string): void {
    const filtered = this.allConversationsSignal().filter(c => getConversationEntityId(c) !== id);
    this.allConversationsSignal.set(filtered); this.conversationsSignal.set(filtered);
  }
}

/** (type, with) of a conversation, lower-cased: how pin events are matched (UIK-CONV-01). */
function pinKeyOf(conversation: CometChat.Conversation): { type: string; with: string } | null {
  const type = conversation?.getConversationType?.();
  const peer: any = conversation?.getConversationWith?.();
  const id = peer?.getUid?.() ?? peer?.getGuid?.();
  if (!type || !id) return null;
  return { type: String(type).toLowerCase(), with: String(id).toLowerCase() };
}

function samePinKey(a: { type: string; with: string } | null, b: { type: string; with: string }): boolean {
  return !!a && a.type === b.type && a.with === b.with;
}

/** A copy of `row` carrying the pin state of `event`; every other field stays the row's. */
function withPinState(row: CometChat.Conversation, event: CometChat.Conversation): CometChat.Conversation {
  const copy = Object.assign(Object.create(Object.getPrototypeOf(row)), row) as CometChat.Conversation;
  copy.setPinnedAt?.(event.getPinnedAt?.());
  copy.setPinnedBy?.(event.getPinnedBy?.());
  return copy;
}
