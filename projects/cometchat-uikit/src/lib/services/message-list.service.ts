import {inject, DestroyRef, signal, WritableSignal, Signal, NgZone} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {Observable, Subject, Subscription} from 'rxjs';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {ErrorCallback} from './message-composer.service';
import {CometChatUIKitConstants} from '../constants';
import {CometChatUIKit} from '../cometchat-uikit';
import {CometChatMessageEvents, IMessages} from '../events/CometChatMessageEvents';
import {CometChatLogger} from '../utils/CometChatLogger';
import {isRecoverableError, isRecoverableErrorMessage, isRetryableError, getUserFriendlyErrorMessage, delay as delayUtil} from './message-list.error-utils';
import {applyReactionEvent} from './message-list.reaction-utils';
import {setupMessageListener as setupMsgListener, setupGroupListener as setupGrpListener, setupCallListener as setupCallLstnr, setupConnectionListener as setupConnListener} from './message-list.listeners';
import {fetchPreviousMessagesImpl, fetchNextMessagesImpl, fetchMessagesAroundIdImpl, handleReceiptImpl} from './message-list.fetch-utils';
import {addMessageImpl, updateMessageByIdImpl, updateMessageByMuidImpl, deleteMessageImpl, editMessageImpl, removeMessageImpl, getMessageByIdImpl, updateReplyCountImpl, updateMessageReactionsImpl, deduplicateMessagesImpl, clearMessagesImpl} from './message-list.message-ops';
import {addReactionImpl, removeReactionImpl, fetchReactionsImpl} from './message-list.reaction-ops';
import {markAsReadImpl, updateLocalReadStatusImpl, markInitialMessagesAsReadImpl, markConversationAsReadImpl, markAsDeliveredImpl, markAsUnreadImpl, getMessagesInRangeImpl, getTotalMessageCountImpl} from './message-list.read-ops';
import {handleTypingStartedImpl, handleTypingEndedImpl, clearTypingIndicatorImpl, isTypingIndicatorForCurrentConversationImpl} from './message-list.typing-utils';
import {translateMessageImpl, getCachedTranslationImpl, clearTranslationCacheImpl, flagMessageImpl} from './message-list.translation-utils';
import {setupSentMessageListenerImpl, setupEditedMessageListenerImpl, handleSentMessageImpl, updateSentMessageByMuidImpl, updateSentMessageReplyCountImpl, handleEditedMessageImpl} from './message-list.sent-handler';
import {buildMessagesRequestImpl, buildNextMessagesRequestImpl, getDefaultMessageTypesImpl, getDefaultMessageCategoriesImpl, acceptsSweptRowImpl} from './message-list.request-builder';
import {isMessageForCurrentConversationImpl, isThreadReplyForCurrentConversationImpl, handleGroupActionImpl, handleCallActionImpl, handleReconnectionImpl} from './message-list.conversation-utils';
import {ThreadSubscriptionService} from './thread-subscription.service';
import {OfflineHubService} from './offline-hub.service';
import {isOfflineOn} from '../utils/offline/offline-gate';
import {HeldReceipts} from '../utils/offline/reconcile';
import {serverIdOf} from '../utils/offline/identity';
import {applyReceiptToMessage} from './message-list.fetch-utils';
import {uniqueListenerSuffix} from './message-list.types';
import {applyMessageSync, applyMessagesUpdated, applySendState, failStrandedSends, OfflineFooterState, refreshNewestWindow, setRows, upsertOffline} from './message-list.offline';

export class MessageListService {
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private threadSubscription = inject(ThreadSubscriptionService);
  private offlineHub = inject(OfflineHubService);

  // Unique per list, not just per millisecond: the SDK replaces a listener registered under an id it already has.
  private messageListenerId = ''; private groupListenerId = '';
  private callListenerId = ''; private connectionListenerId = '';

  private ccMessageSentSubscription: Subscription | null = null; private ccMessageEditedSubscription: Subscription | null = null;

  private messagesSignal: WritableSignal<CometChat.BaseMessage[]> = signal<CometChat.BaseMessage[]>([]);
  private allMessagesSignal: WritableSignal<CometChat.BaseMessage[]> = signal<CometChat.BaseMessage[]>([]);

  private loadingStateSignal: WritableSignal<boolean> = signal<boolean>(false); private errorStateSignal: WritableSignal<Error | null> = signal<Error | null>(null);
  private prevMessageIdSignal: WritableSignal<number> = signal<number>(0); private nextMessageIdSignal: WritableSignal<number> = signal<number>(0); private unreadCountSignal: WritableSignal<number> = signal<number>(0);

  private connectionStatusSignal: WritableSignal<'connected' | 'disconnected'> = signal<'connected' | 'disconnected'>('connected');

  private typingUsersSignal: WritableSignal<Map<string, CometChat.TypingIndicator>> = signal<Map<string, CometChat.TypingIndicator>>(new Map());

  private typingTimeoutsMap = new Map<string, ReturnType<typeof setTimeout>>(); private messageIdMap = new Map<number, CometChat.BaseMessage>(); private messageMuidMap = new Map<string, CometChat.BaseMessage>();

  private currentUser: CometChat.User | null = null; private currentGroup: CometChat.Group | null = null; private parentMessageId: number | null = null;
  /**
   * The thread's parent message in a thread view, when the caller has it.
   *
   * Held as a whole message rather than an id because it is the authority on
   * whether the thread is followed — a reply arriving over the socket carries no
   * subscription flag and has to inherit the parent's.
   */
  private parentMessage: CometChat.BaseMessage | null = null;
  private isAgentChatMode = false; private messagesRequestBuilder: CometChat.MessagesRequestBuilder | null = null; private hideGroupActionMessages = false;
  private messagesRequest: CometChat.MessagesRequest | null = null; private nextMessagesRequest: CometChat.MessagesRequest | null = null; private errorCallback: ErrorCallback | null = null;
  private customMessageTypes = new Set<string>(); private customMessageCategories = new Set<string>(); private replacedMessageTypes: Set<string> | null = null; private replacedMessageCategories: Set<string> | null = null;
  private readonly DEFAULT_MESSAGE_LIMIT = 30; private readonly TYPING_INDICATOR_TIMEOUT = 5000; private readonly MAX_RETRY_ATTEMPTS = 3; private readonly RETRY_DELAYS = [1000, 2000, 4000] as const;
  private fetchGeneration = 0; private retryAttempts = new Map<string, number>(); private translationCache = new Map<string, string>();

  // ── Offline support (ON path only; inert while offline is off) ──
  private offlineFooterSignal: WritableSignal<OfflineFooterState> = signal<OfflineFooterState>('none');
  /**
   * `connect_to_load_more` when an offline read could not go past the saved messages.
   *
   * @internal
   */
  readonly offlineFooter: Signal<OfflineFooterState> = this.offlineFooterSignal.asReadonly();
  private offlineFooterRetryableSignal: WritableSignal<boolean> = signal(false);
  /**
   * The footer shows and the connection is back: scrolling to that end loads
   * again, as tapping the footer does (UIK-READ-03). `false` while still offline.
   *
   * @internal
   */
  readonly offlineFooterRetryable: Signal<boolean> = this.offlineFooterRetryableSignal.asReadonly();
  private newestWindowResetSignal: WritableSignal<number> = signal(0);
  /**
   * Offline: bumped when a PARTIAL sweep's refresh reset the list to the newest window (README §3.7).
   *
   * @internal
   */
  readonly newestWindowReset: Signal<number> = this.newestWindowResetSignal.asReadonly();
  private heldReceipts = new HeldReceipts();
  private offlinePathUsed = false;
  /** See {@link OfflineListContext.offlinePreviousExhausted}. */
  private offlinePreviousExhausted = false;
  /** See {@link OfflineListContext.offlineBlocked}. */
  private offlineBlocked: { previous: boolean; next: boolean } | undefined;
  private connectionWatched = false;
  private readonly offlineConnectToLoadSignal: WritableSignal<boolean> = signal(false);
  /**
   * Offline (D84 rule 3): the chat was read with no connection and nothing on screen, so the list shows
   * "Connect to load messages" in place of its error view (the app's own error view still wins; the error
   * state is set and `error` fired once). The first page is read once by itself when the connection is
   * back (rule 8). Always false with offline off.
   *
   * @internal
   */
  readonly offlineConnectToLoad: Signal<boolean> = this.offlineConnectToLoadSignal.asReadonly();
  /** See {@link OfflineListContext.offlineReloadOnConnect}: the same state as {@link offlineConnectToLoad}. */
  private get offlineReloadOnConnect(): boolean { return this.offlineConnectToLoadSignal(); }
  private set offlineReloadOnConnect(value: boolean) { this.offlineConnectToLoadSignal.set(value); }
  private readonly edgeReloadSubject = new Subject<void>();
  /**
   * Offline (D84 rule 9): the connection is back while an edge shows "Connect to load more"; the list
   * loads that page once by itself. Never emits with offline off.
   *
   * @internal
   */
  readonly edgeReload$: Observable<void> = this.edgeReloadSubject.asObservable();
  private readonly loadErrorSubject = new Subject<Error>();
  /**
   * Offline (D83): a first-page load the user or app started failed while messages were on screen.
   * The rows stay; the list's `error` output reports it. Never emits with offline off.
   *
   * @internal
   */
  readonly loadError$: Observable<Error> = this.loadErrorSubject.asObservable();
  /**
   * Offline (D83): report a failed load over rows on screen (see {@link loadError$}).
   *
   * @internal
   */
  reportLoadError(error: unknown): void {
    this.loadErrorSubject.next(error as Error);
  }
  private offlineSubscriptions: Subscription[] = [];
  private applyReceiptToMessage = applyReceiptToMessage;

  private buildMessagesRequest(messageId?: number): CometChat.MessagesRequest { return buildMessagesRequestImpl(this as any, messageId); }
  private buildNextMessagesRequest(messageId?: number): CometChat.MessagesRequest { return buildNextMessagesRequestImpl(this as any, messageId); }
  private getDefaultMessageTypes(): string[] { return getDefaultMessageTypesImpl(this as any); }
  private getDefaultMessageCategories(): string[] { return getDefaultMessageCategoriesImpl(this as any); }
  readonly messages: Signal<CometChat.BaseMessage[]> = this.messagesSignal.asReadonly();

  readonly allMessages: Signal<CometChat.BaseMessage[]> = this.allMessagesSignal.asReadonly();

  readonly loadingState: Signal<boolean> = this.loadingStateSignal.asReadonly();

  readonly errorState: Signal<Error | null> = this.errorStateSignal.asReadonly();

  readonly prevMessageId: Signal<number> = this.prevMessageIdSignal.asReadonly();

  readonly nextMessageId: Signal<number> = this.nextMessageIdSignal.asReadonly();

  readonly unreadCount: Signal<number> = this.unreadCountSignal.asReadonly();

  readonly connectionStatus: Signal<'connected' | 'disconnected'> =
    this.connectionStatusSignal.asReadonly();

  readonly typingUsers: Signal<Map<string, CometChat.TypingIndicator>> =
    this.typingUsersSignal.asReadonly();

  readonly messages$: Observable<CometChat.BaseMessage[]> = toObservable(this.messagesSignal);

  readonly loadingState$: Observable<boolean> = toObservable(this.loadingStateSignal);

  readonly errorState$: Observable<Error | null> = toObservable(this.errorStateSignal);

  constructor() {
    this.regenerateListenerIds();
    this.destroyRef.onDestroy(() => {
      // The offline streams live as long as the service; cleanup() also runs on
      // a refresh, which keeps listening to the hub.
      this.offlineSubscriptions.forEach(sub => sub.unsubscribe());
      this.offlineSubscriptions = [];
      this.cleanup();
    });
    this.setupSentMessageListener();
    this.setupEditedMessageListener();
    this.setupMessageListener();
    this.setupOfflineStreams();
  }

  /**
   * Subscribe to the offline hub. With offline off the hub never emits, so
   * none of these handlers runs and the list behaves exactly as before.
   */
  private setupOfflineStreams(): void {
    const ctx = this as any;
    this.offlineSubscriptions.push(
      this.offlineHub.sendState$.subscribe(event => applySendState(ctx, event)),
      this.offlineHub.messageSync$.subscribe(event => applyMessageSync(ctx, event)),
      this.offlineHub.messagesUpdated$.subscribe(event => applyMessagesUpdated(ctx, event)),
      this.offlineHub.syncFailed$.subscribe(event => {
        if (event.phase === 'message' && event.gen === this.offlineHub.gen && this.offlinePathUsed && (this.currentUser || this.currentGroup)) {
          void refreshNewestWindow(ctx);
        }
      }),
      this.offlineHub.cacheReset$.subscribe(() => this.reloadAfterOfflineReset()),
      this.offlineHub.session$.subscribe(() => {
        // Logout or user switch: no frame of the old session's rows. Scoped to
        // lists that ran the offline path, so offline-off screens are untouched.
        if (!this.offlinePathUsed) return;
        this.heldReceipts.clear();
        this.offlineReloadOnConnect = false;
        this.offlineFooterSignal.set('none');
        this.offlineFooterRetryableSignal.set(false);
        this.offlineBlocked = undefined;
        this.fetchGeneration++;
        setRows(ctx, []);
        this.loadingStateSignal.set(false);
      }),
    );

  }

  /** The SDK rebuilt its offline cache: reload this chat from scratch, two-phase. */
  private reloadAfterOfflineReset(): void {
    if (!this.offlinePathUsed || (!this.currentUser && !this.currentGroup)) return;
    this.heldReceipts.clear();
    this.clearMessagesAndState();
    this.messagesRequest = this.buildMessagesRequest();
    this.nextMessagesRequest = this.buildNextMessagesRequest();
    void this.fetchPreviousMessages();
  }

  /**
   * Kill switch (UIK-LIFE-03): when offline support has been switched off under
   * un-acked rows, they turn failed (direct) with one notice. Runs only for a
   * list that used the offline path.
   *
   * @internal
   */
  checkKillSwitch(): void {
    if (this.offlinePathUsed && !isOfflineOn()) failStrandedSends(this as any);
  }

  /**
   * Watch the connection. Subscribed on the first ON-path operation, so an offline-off list adds
   * no listener. Two things follow it:
   * - "The next connection event" of UIK-LIFE-03: the kill-switch check.
   * - A reconnect (taken from the SDK's connect events): the list's own reconnect handler runs,
   *   which reads the first page once by itself when the error view is up because the device
   *   was offline (D83), and lets a "Connect to load more" footer load on scroll.
   */
  private watchConnection(): void {
    if (this.connectionWatched) return;
    this.connectionWatched = true;
    this.offlineSubscriptions.push(
      this.offlineHub.connects$.subscribe(() => {
        this.checkKillSwitch();
        // The SDK fires `onDisconnected` only when the socket closes while its status is neither
        // DISCONNECTED nor CONNECTING (`CometChat.js`, WS ready-state CLOSED), so an app opened
        // with no connection - and a drop inside the launch connect window, while the status is
        // still CONNECTING - is never reported. `reconnected$` is a connect that follows a
        // reported disconnect (`connection-state.service.ts`), so in those runs nothing reaches
        // it and the list stayed on "Connect to load messages" until it was reopened.
        // The connect itself is the signal, which is why this follows `connects$` and not the
        // state: with the drop unreported the state never changed, so it still read `true` from
        // the connect before it and the connect that ended the outage set `true` over `true` -
        // a `toObservable` of it emits nothing, and watching it here left this read unreachable
        // in exactly the run it was written for (ENG-57333, Angular QA 5 major 2).
        // An empty list reads its first page once per connection, as Android does
        // (`MessageListOfflineSync.onConnected`). The read is one-shot
        // (`reloadAfterOfflineError` clears the flag before it fetches), so this and the
        // reconnect subscription below can never make two reads.
        void this.reloadAfterOfflineError();
      }),
      this.offlineHub.reconnected$.subscribe(() => {
        this.ngZone.run(() => void this.handleReconnection());
      })
    );
  }

  /**
   * The realtime connection is back (offline on). A "Connect to load more" row now loads on scroll as
   * well as on tap (UIK-READ-03), and the page behind it loads once by itself (D84 rule 9): the list
   * hears {@link edgeReload$} and reads each blocked edge, the older one first.
   *
   * @internal
   */
  markOfflineConnected(): void {
    if (this.offlineFooterSignal() !== 'connect_to_load_more') return;
    if (!this.offlineFooterRetryableSignal()) this.offlineFooterRetryableSignal.set(true);
    this.edgeReloadSubject.next();
  }

  /**
   * The edges that show "Connect to load more" (the older one, the newer one, or both).
   *
   * @internal
   */
  offlineBlockedEdges(): { previous: boolean; next: boolean } {
    if (this.offlineFooterSignal() !== 'connect_to_load_more') return { previous: false, next: false };
    return { previous: this.offlineBlocked?.previous === true, next: this.offlineBlocked?.next === true };
  }

  /**
   * Offline (D83), on reconnect: the error view is up because the device was offline, so the
   * first page is read once by itself. Returns whether that read was started.
   *
   * @internal
   */
  async reloadAfterOfflineError(): Promise<boolean> {
    if (
      !this.offlineReloadOnConnect ||
      this.errorStateSignal() === null ||
      // Only a row the server has counts as "this chat has loaded something". A message the
      // user sent from the "Connect to load messages" screen is a row with no server id, and
      // counting it made this read give up: the chat stayed on that screen for the rest of the
      // session even though its first page had never loaded. The server page it reads cannot
      // drop the un-acked row (`reconcileServerPage` keeps every row without a server id).
      this.allMessagesSignal().some(row => serverIdOf(row) > 0) ||
      (!this.currentUser && !this.currentGroup)
    ) {
      return false;
    }
    this.offlineReloadOnConnect = false;
    this.errorStateSignal.set(null);
    this.messagesRequest = this.buildMessagesRequest();
    this.nextMessagesRequest = this.buildNextMessagesRequest();
    await this.fetchPreviousMessages();
    return true;
  }

  /**
   * The edge a tap on "Connect to load more" reads: the older one, unless only the newer one was blocked.
   *
   * @internal
   */
  offlineRetryDirection(): 'previous' | 'next' {
    return this.offlineBlocked?.next && !this.offlineBlocked.previous ? 'next' : 'previous';
  }

  /**
   * Retry the "Connect to load more" row's read. With a `direction` (the reload on reconnect, which
   * reads each blocked edge in turn) the other edge keeps its mark until its own read runs.
   *
   * @internal
   */
  retryOfflineRead(direction?: 'previous' | 'next'): Promise<boolean> {
    const edge = direction ?? this.offlineRetryDirection();
    const other = edge === 'previous' ? 'next' : 'previous';
    const keepOther = direction !== undefined && this.offlineBlocked?.[other] === true;
    this.offlineFooterSignal.set('none');
    this.offlineFooterRetryableSignal.set(false);
    this.offlineBlocked = keepOther
      ? { previous: other === 'previous', next: other === 'next' }
      : undefined;
    return edge === 'next' ? this.fetchNextMessages() : this.fetchPreviousMessages();
  }
  cleanup(): void {
    this.removeMessageListener();
    this.removeGroupListener();
    this.removeCallListener();
    this.removeConnectionListener();
    this.removeSentMessageListener();
    this.removeEditedMessageListener();
    this.resetState();
    this.errorCallback = null;
    this.regenerateListenerIds();
  }
  private resetState(): void {
    this.messagesSignal.set([]);
    this.allMessagesSignal.set([]);
    this.loadingStateSignal.set(false);
    this.errorStateSignal.set(null);
    this.prevMessageIdSignal.set(0);
    this.nextMessageIdSignal.set(0);
    this.unreadCountSignal.set(0);
    this.connectionStatusSignal.set('connected');
    this.messageIdMap.clear();
    this.messageMuidMap.clear();
    this.retryAttempts.clear();
    this.typingTimeoutsMap.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.typingTimeoutsMap.clear();
    this.typingUsersSignal.set(new Map());
    this.currentUser = null;
    this.currentGroup = null;
    this.parentMessageId = null;
    this.messagesRequestBuilder = null;
    this.hideGroupActionMessages = false;
    this.messagesRequest = null;
    this.nextMessagesRequest = null;
    this.translationCache.clear();
  }
  private regenerateListenerIds(): void {
    const suffix = uniqueListenerSuffix();
    this.messageListenerId = `message_list_${suffix}`;
    this.groupListenerId = `message_list_group_${suffix}`;
    this.callListenerId = `message_list_call_${suffix}`;
    this.connectionListenerId = `message_list_connection_${suffix}`;
  }
  private normalizeMessageId(messageId: string | number): number { return typeof messageId === 'string' ? parseInt(messageId, 10) : messageId; }
  private removeMessageListener(): void {
    try {
      CometChat.removeMessageListener(this.messageListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing message listener:', error);
    }
  }
  private removeGroupListener(): void {
    try {
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing group listener:', error);
    }
  }
  private removeCallListener(): void {
    try {
      CometChat.removeCallListener(this.callListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing call listener:', error);
    }
  }
  private removeConnectionListener(): void {
    try {
      CometChat.removeConnectionListener(this.connectionListenerId);
    } catch (error) {
      CometChatLogger.error('MessageListService', 'Error removing connection listener:', error);
    }
  }
  private removeSentMessageListener(): void {
    if (this.ccMessageSentSubscription) { this.ccMessageSentSubscription.unsubscribe(); this.ccMessageSentSubscription = null; }
  }
  private removeEditedMessageListener(): void {
    if (this.ccMessageEditedSubscription) { this.ccMessageEditedSubscription.unsubscribe(); this.ccMessageEditedSubscription = null; }
  }
  getMessageListenerId(): string { return this.messageListenerId; }
  getGroupListenerId(): string { return this.groupListenerId; }
  getCallListenerId(): string { return this.callListenerId; }
  getConnectionListenerId(): string { return this.connectionListenerId; }
  setUser(user: CometChat.User): void {
    if (!user) { const e = new Error('[MessageListService] setUser: User is required'); CometChatLogger.error('MessageListService', e.message); if (this.errorCallback) this.errorCallback(e as unknown as CometChat.CometChatException); return; }
    this.clearMessagesAndState(); this.removeGroupListener(); this.removeCallListener(); this.removeConnectionListener();
    this.currentUser = user; this.currentGroup = null; this.messagesRequest = this.buildMessagesRequest(); this.nextMessagesRequest = this.buildNextMessagesRequest();
  }
  setGroup(group: CometChat.Group): void {
    if (!group) { const e = new Error('[MessageListService] setGroup: Group is required'); CometChatLogger.error('MessageListService', e.message); if (this.errorCallback) this.errorCallback(e as unknown as CometChat.CometChatException); return; }
    this.clearMessagesAndState(); this.removeGroupListener(); this.removeCallListener(); this.removeConnectionListener();
    this.currentGroup = group; this.currentUser = null; this.messagesRequest = this.buildMessagesRequest(); this.nextMessagesRequest = this.buildNextMessagesRequest();
  }
  clearConversation(): void {
    this.clearMessagesAndState();
    this.removeGroupListener();
    this.removeCallListener();
    this.removeConnectionListener();
    this.currentUser = null;
    this.currentGroup = null;
    this.messagesRequest = null;
    this.nextMessagesRequest = null;
  }
  setIsAgentChat(value: boolean): void { this.isAgentChatMode = value; }
  setParentMessageId(parentMessageId: number | null): void {
    this.parentMessageId = parentMessageId;
    if (this.currentUser || this.currentGroup) {
      this.clearMessagesAndState();
      this.messagesRequest = this.buildMessagesRequest();
      this.nextMessagesRequest = this.buildNextMessagesRequest();
    }
  }
  /**
   * Hand the list the thread's parent message. Purely for subscription state —
   * scoping still runs off `parentMessageId`, which the caller derives from the
   * same message — so this never rebuilds the request.
   */
  setParentMessage(parentMessage: CometChat.BaseMessage | null): void {
    this.parentMessage = parentMessage;
  }
  updateParentMessageIdInPlace(parentMessageId: number): void {
    this.parentMessageId = parentMessageId;
    if (this.currentUser || this.currentGroup) { this.messagesRequest = this.buildMessagesRequest(); this.nextMessagesRequest = this.buildNextMessagesRequest(); }
  }
  setMessagesRequestBuilder(builder: CometChat.MessagesRequestBuilder | null): void {
    this.messagesRequestBuilder = builder;
    if (this.currentUser || this.currentGroup) { this.messagesRequest = this.buildMessagesRequest(); this.nextMessagesRequest = this.buildNextMessagesRequest(); }
  }
  setHideGroupActionMessages(hide: boolean): void {
    this.hideGroupActionMessages = hide;
    if (this.currentUser || this.currentGroup) { this.messagesRequest = this.buildMessagesRequest(); this.nextMessagesRequest = this.buildNextMessagesRequest(); }
  }
  addCustomMessageTypes(types: string[]): void { if (!types) return; types.filter(t => t != null && t !== '').forEach(t => this.customMessageTypes.add(t)); }
  addCustomMessageCategories(categories: string[]): void { if (!categories) return; categories.filter(c => c != null && c !== '').forEach(c => this.customMessageCategories.add(c)); }
  removeCustomMessageTypes(types: string[]): void { if (!types) return; types.forEach(t => this.customMessageTypes.delete(t)); }
  removeCustomMessageCategories(categories: string[]): void { if (!categories) return; categories.forEach(c => this.customMessageCategories.delete(c)); }
  setMessageTypes(types: string[] | null): void {
    if (types === null) { this.replacedMessageTypes = null; return; }
    this.replacedMessageTypes = new Set(types.filter(t => t != null && t !== ''));
  }
  setMessageCategories(categories: string[] | null): void {
    if (categories === null) { this.replacedMessageCategories = null; return; }
    this.replacedMessageCategories = new Set(categories.filter(c => c != null && c !== ''));
  }
  getAllMessageTypes(): string[] {
    return this.getDefaultMessageTypes();
  }
  getAllMessageCategories(): string[] {
    return this.getDefaultMessageCategories();
  }
  setErrorCallback(callback: ErrorCallback | null): void { this.errorCallback = callback; }
  private clearMessagesAndState(): void {
    this.fetchGeneration++;
    this.heldReceipts.clear();
    this.offlineReloadOnConnect = false;
    this.offlineFooterSignal.set('none');
    this.offlineFooterRetryableSignal.set(false);
    this.offlineBlocked = undefined;
    this.messagesSignal.set([]);
    this.allMessagesSignal.set([]);
    this.messageIdMap.clear();
    this.messageMuidMap.clear();
    this.prevMessageIdSignal.set(0);
    this.nextMessageIdSignal.set(0);
    this.unreadCountSignal.set(0);
    this.errorStateSignal.set(null);
    // Set loading to true immediately so the UI shows shimmer right away
    // (prevents blank flash between clearing messages and fetch starting)
    this.loadingStateSignal.set(true);
    this.messagesRequest = null;
    this.nextMessagesRequest = null;
  }
  async fetchPreviousMessages(): Promise<boolean> { return fetchPreviousMessagesImpl(this as any); }
  async fetchNextMessages(): Promise<boolean> { return fetchNextMessagesImpl(this as any); }
  async fetchMessagesAroundId(messageId: number): Promise<void> { return fetchMessagesAroundIdImpl(this as any, messageId); }
  /** Returns the current fetch generation — used by fetchWithUnreadPivot to detect stale async calls. */
  getFetchGeneration(): number { return this.fetchGeneration; }
  private deduplicateMessages(messages: CometChat.BaseMessage[]): CometChat.BaseMessage[] { return deduplicateMessagesImpl(this as any, messages); }
  private isRecoverableError(error: unknown): boolean { return isRecoverableError(error); }
  private isRecoverableErrorMessage(message: string): boolean { return isRecoverableErrorMessage(message); }
  private getUserFriendlyErrorMessage(error: unknown): string { return getUserFriendlyErrorMessage(error); }
  private delay(ms: number): Promise<void> { return delayUtil(ms); }
  private async handleErrorWithRetry(error: unknown, context: string, retryFn?: () => Promise<void>): Promise<void> {
    CometChatLogger.error('MessageListService', `Error in ${context}:`, error);
    const currentAttempt = this.retryAttempts.get(context) || 0;
    if (this.isRecoverableError(error) && currentAttempt < this.MAX_RETRY_ATTEMPTS && retryFn) {
      this.retryAttempts.set(context, currentAttempt + 1);
      const retryDelay = this.RETRY_DELAYS[currentAttempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
      await this.delay(retryDelay);
      try { await retryFn(); this.retryAttempts.delete(context); return; } catch (retryError) { return this.handleErrorWithRetry(retryError, context, retryFn); }
    }
    this.retryAttempts.delete(context);
    const enhancedError = new Error(this.getUserFriendlyErrorMessage(error));
    (enhancedError as Error & { originalError: unknown }).originalError = error;
    (enhancedError as Error & { context: string }).context = context;
    if (this.errorCallback) this.errorCallback(error as CometChat.CometChatException);
  }
  clearError(): void { this.errorStateSignal.set(null); }
  setLoadingState(value: boolean): void { this.loadingStateSignal.set(value); }
  addMessage(message: CometChat.BaseMessage): void { addMessageImpl(this as any, message); }
  updateMessageById(messageId: number, message: CometChat.BaseMessage): boolean { return updateMessageByIdImpl(this as any, messageId, message); }
  updateMessageByMuid(muid: string, message: CometChat.BaseMessage): boolean { return updateMessageByMuidImpl(this as any, muid, message); }
  deleteMessage(messageId: number): boolean { return deleteMessageImpl(this as any, messageId); }
  async editMessage(message: CometChat.BaseMessage, newText: string): Promise<CometChat.BaseMessage> { return editMessageImpl(this as any, message, newText); }
  removeMessage(messageId: number): boolean { return removeMessageImpl(this as any, messageId); }
  getMessageById(messageId: number): CometChat.BaseMessage | undefined { return getMessageByIdImpl(this as any, messageId); }
  updateReplyCount(parentMessageId: number, count: number): boolean { return updateReplyCountImpl(this as any, parentMessageId, count); }
  updateMessageReactions(messageId: number, reactions: CometChat.ReactionCount[]): boolean { return updateMessageReactionsImpl(this as any, messageId, reactions); }
  async addReaction(messageId: number, emoji: string): Promise<void> { return addReactionImpl(this as any, messageId, emoji); }
  async removeReaction(messageId: number, emoji: string): Promise<void> { return removeReactionImpl(this as any, messageId, emoji); }
  async fetchReactions(messageId: number, builder?: CometChat.ReactionsRequestBuilder): Promise<CometChat.Reaction[]> { return fetchReactionsImpl(this as any, messageId, builder); }
  async markAsRead(message: CometChat.BaseMessage): Promise<void> { return markAsReadImpl(this as any, message); }
  /**
   * Clear the conversation's unread count on the SERVER.
   *
   * Skipped inside a thread: a thread is not a conversation of its own, and
   * reading replies must not mark the parent chat read — the same guard React
   * applies via `parentMessageId`.
   */
  async markConversationAsRead(): Promise<void> {
    if (this.parentMessageId) { return; }
    if (this.currentGroup) {
      return markConversationAsReadImpl(
        this.currentGroup.getGuid(),
        CometChatUIKitConstants.MessageReceiverType.group
      );
    }
    if (this.currentUser) {
      return markConversationAsReadImpl(
        this.currentUser.getUid(),
        CometChatUIKitConstants.MessageReceiverType.user
      );
    }
  }
  async markInitialMessagesAsRead(): Promise<void> {
    const messages = this.messagesSignal();
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    return markInitialMessagesAsReadImpl(this as any, messages, loggedInUser, (msg) => this.markAsRead(msg), () => this.markConversationAsRead());
  }
  updateLocalReadStatus(messageIds: number[]): void { updateLocalReadStatusImpl(this as any, messageIds); }
  async markAsDelivered(message: CometChat.BaseMessage): Promise<void> { return markAsDeliveredImpl(this as any, message); }
  getMessagesInRange(startIndex: number, endIndex: number): CometChat.BaseMessage[] { return getMessagesInRangeImpl(this as any, startIndex, endIndex); }
  getTotalMessageCount(): number { return getTotalMessageCountImpl(this as any); }
  clearMessages(): void { clearMessagesImpl(this as any); }
  async markAsUnread(message: CometChat.BaseMessage): Promise<CometChat.Conversation> { return markAsUnreadImpl(this as any, message); }
  private isRetryableError(error: unknown): boolean { return isRetryableError(error); }
  private setupSentMessageListener(): void { setupSentMessageListenerImpl(this as any); }
  private setupEditedMessageListener(): void { setupEditedMessageListenerImpl(this as any); }
  private handleEditedMessage(message: CometChat.BaseMessage): void { handleEditedMessageImpl(this as any, message); }
  private handleSentMessage(data: IMessages): void { handleSentMessageImpl(this as any, data); }
  private updateSentMessageByMuid(message: CometChat.BaseMessage): void { updateSentMessageByMuidImpl(this as any, message); }
  private updateSentMessageReplyCount(message: CometChat.BaseMessage): void { updateSentMessageReplyCountImpl(this as any, message); }
  private setupMessageListener(): void { setupMsgListener(this, this.ngZone); }
  private isMessageForCurrentConversation(message: CometChat.BaseMessage): boolean { return isMessageForCurrentConversationImpl(this as any, message); }
  private acceptsSweptRow(message: CometChat.BaseMessage): boolean { return acceptsSweptRowImpl(this as any, message); }
  handleNewMessage(message: CometChat.BaseMessage): void {
    if (!this.parentMessageId && message.getParentMessageId() && !this.isAgentChatMode) {
      if (this.isThreadReplyForCurrentConversation(message)) { this.updateSentMessageReplyCount(message); }
      // The reply is not displayed here, so nothing is stamped — but a reply that
      // mentions the logged-in user subscribes them, and the surfaces that ARE
      // mounted (the parent's action sheet) have to hear about it.
      this.applyIncomingReplySubscription(message);
      return;
    }
    if (!this.isMessageForCurrentConversation(message)) { return; }
    // A socket-delivered reply carries no subscription flag. In a thread view we
    // hold the authoritative parent, so reconcile before the message is added and
    // rendered — otherwise the bubble reads un-followed inside a followed thread.
    this.applyIncomingReplySubscription(message);
    // In agent chat mode without parentMessageId: don't add incoming messages
    // if the list is empty (user hasn't sent anything in this session yet).
    // This prevents stale AI responses from a previous session appearing in a new chat.
    if (this.isAgentChatMode && !this.parentMessageId && this.messagesSignal().length === 0) {
      return;
    }
    // Offline path: a swept message can be older than live ones already shown,
    // so every insert goes into its sorted place (BEH-READ-10).
    if (isOfflineOn()) { upsertOffline(this as any, [message]); return; }
    this.addMessage(message);
  }
  /**
   * Reconcile a realtime reply's subscription flag against the held parent.
   *
   * A no-op for anything that isn't a thread reply, and harmless without a
   * logged-in user — a mention can only match a uid we know.
   */
  private applyIncomingReplySubscription(message: CometChat.BaseMessage): void {
    const loggedInUserUid = CometChatUIKit.getLoggedInUser()?.getUid() ?? '';
    if (!loggedInUserUid) return;
    this.threadSubscription.applyIncomingReply({
      reply: message,
      parentMessage: this.parentMessage,
      loggedInUserUid,
    });
  }
  private isThreadReplyForCurrentConversation(message: CometChat.BaseMessage): boolean { return isThreadReplyForCurrentConversationImpl(this as any, message); }
  handleMessageEdited(message: CometChat.BaseMessage): void {
    if (!this.isMessageForCurrentConversation(message)) { return; }
    this.updateMessageById(message.getId(), message);
    CometChatMessageEvents.onMessageEdited.next(message);
  }
  handleMessageDeleted(message: CometChat.BaseMessage): void {
    if (!this.isMessageForCurrentConversation(message)) { return; }
    this.deleteMessage(message.getId());
    CometChatMessageEvents.onMessageDeleted.next(message);
  }
  handleReceipt(receipt: CometChat.MessageReceipt, isGroupReceipt: boolean): void { handleReceiptImpl(this as any, receipt, isGroupReceipt); }
  handleReactionEvent(reactionEvent: CometChat.ReactionEvent, action: 'added' | 'removed'): void {
    const reaction = reactionEvent.getReaction();
    if (!reaction) { CometChatLogger.warn('MessageListService', 'handleReactionEvent: No reaction in event'); return; }
    const messageId = reaction.getMessageId();
    const numericMessageId = typeof messageId === 'string' ? parseInt(messageId, 10) : Number(messageId);
    if (!numericMessageId || isNaN(numericMessageId)) { CometChatLogger.warn('MessageListService', 'handleReactionEvent: Invalid message ID:', messageId); return; }
    const message = this.getMessageById(numericMessageId);
    if (!message) { return; }
    const emoji = reaction.getReaction();
    const reactedBy = reaction.getReactedBy();
    if (!emoji || !reactedBy) { return; }
    const currentReactions = message.getReactions() || [];
    const updatedReactions = applyReactionEvent(currentReactions, emoji, action, reactedBy);
    this.updateMessageReactions(numericMessageId, updatedReactions);
  }
  private setupGroupListener(): void { setupGrpListener(this); }
  private setupCallListener(): void { setupCallLstnr(this); }
  private setupConnectionListener(): void { setupConnListener(this, this.connectionListenerId); }
  setConnectionStatus(status: 'connected' | 'disconnected'): void { this.connectionStatusSignal.set(status); }
  handleGroupAction(message: CometChat.Action, group: CometChat.Group): void { handleGroupActionImpl(this as any, message, group); }
  handleCallAction(call: CometChat.Call): void { handleCallActionImpl(this as any, call); }
  async handleReconnection(): Promise<void> { return handleReconnectionImpl(this as any); }
  handleTypingStarted(indicator: CometChat.TypingIndicator): void { handleTypingStartedImpl(this as any, indicator); }
  handleTypingEnded(indicator: CometChat.TypingIndicator): void { handleTypingEndedImpl(this as any, indicator); }
  private clearTypingIndicator(userUid: string): void { clearTypingIndicatorImpl(this as any, userUid); }
  private isTypingIndicatorForCurrentConversation(indicator: CometChat.TypingIndicator): boolean { return isTypingIndicatorForCurrentConversationImpl(this as any, indicator); }
  async translateMessage(message: CometChat.BaseMessage, language: string): Promise<string> { return translateMessageImpl(this as any, message, language); }
  getCachedTranslation(messageId: number, language: string): string | undefined { return getCachedTranslationImpl(this as any, messageId, language); }
  clearTranslationCache(): void { clearTranslationCacheImpl(this as any); }
  async flagMessage(message: CometChat.BaseMessage, reasonId: string, remark?: string): Promise<void> { return flagMessageImpl(this as any, message, reasonId, remark); }
}
