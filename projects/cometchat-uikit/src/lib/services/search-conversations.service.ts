import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, States } from '../Enums/Enums';
import { CometChatUIKitConstants } from '../constants';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { hasValidSearchCriteria } from '../components/cometchat-search/search-filter.utils';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { Subject, Subscription } from 'rxjs';
import { ConnectionStateService } from './connection-state.service';
import { isOfflineOn } from '../utils/offline/offline-gate';
import { isNotConnectedError } from '../utils/offline/reconcile';
import { SearchFailureHold } from './search-failure-hold';
import { mergeSnapshotPage, readPageTwoPhase } from '../utils/offline/two-phase';

/**
 * Service managing conversation search state, SDK queries,
 * and real-time listener lifecycle.
 */
@Injectable()
export class SearchConversationsService {
  readonly conversations: WritableSignal<CometChat.Conversation[]> = signal<CometChat.Conversation[]>([]);
  readonly fetchState: WritableSignal<States> = signal<States>(States.loaded);
  readonly hasMoreResults: WritableSignal<boolean> = signal<boolean>(false);
  /**
   * Offline (D83): a search the service re-ran by itself on reconnect failed. A search the user or
   * app started rejects to its caller instead; this is the channel for the one nobody awaits.
   */
  readonly reconnectSearchError$ = new Subject<CometChat.CometChatException>();
  /**
   * Offline (D84 rule 7): the search could not reach the server and nothing saved matches, so the list
   * says "Connect to search" (`fetchState` is `empty`; no `searchError`). It runs once more by itself
   * when the connection is back (rule 8). Always false with offline off.
   */
  readonly connectToSearch: WritableSignal<boolean> = signal<boolean>(false);
  /**
   * Offline (D84, Android): the search failed with a real error and nothing is shown, inside the search
   * component. The component decides, once both scopes have answered, whether that is the error view or
   * the plain empty state (`fetchState` is `empty`; no `searchError` from this scope). Always false with
   * offline off, and outside the search component.
   */
  readonly searchFailed: WritableSignal<boolean> = signal<boolean>(false);
  readonly typingIndicatorMap: WritableSignal<Map<string, CometChat.TypingIndicator>> = signal<Map<string, CometChat.TypingIndicator>>(new Map());

  private searchRequest: CometChat.ConversationsRequest | null = null;
  private isLoadingMore = false;
  /** Bumped by every new search and reset: an answer for an older one is dropped. */
  private generation = 0;
  private loggedInUser: CometChat.User | null = null;
  // Listener IDs for cleanup
  private messageListenerId = '';
  private userListenerId = '';
  private groupListenerId = '';
  private callListenerId = '';
  private typingListenerId = '';
  private receiptSubscriptions: Subscription[] = [];
  private readonly connectionState = inject(ConnectionStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly failureHold = inject(SearchFailureHold, { optional: true });
  /**
   * Offline (D84): "Connect to search" is up because the device was not connected, so the same search
   * runs once more by itself when the connection is back. A non-network error never sets it.
   */
  private reloadOnConnect = false;
  private lastSearch: {
    keyword: string;
    filters: CometChatSearchFilter[];
    customBuilder?: CometChat.ConversationsRequestBuilder;
  } | null = null;

  constructor() {
    this.connectionState.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rerunAfterReconnect());
  }

  /** Offline on, "Connect to search" up because of no connection: run the last search once more (D84 rule 8). */
  private rerunAfterReconnect(): void {
    if (!isOfflineOn() || !this.reloadOnConnect || !this.connectToSearch() || !this.lastSearch) return;
    this.reloadOnConnect = false;
    const { keyword, filters, customBuilder } = this.lastSearch;
    this.search(keyword, filters, customBuilder).catch(error => this.reconnectSearchError$.next(error));
  }

  /**
   * Initiate a conversation search.
   */
  async search(
    keyword: string,
    filters: CometChatSearchFilter[],
    customBuilder?: CometChat.ConversationsRequestBuilder
  ): Promise<void> {
    const gen = ++this.generation;
    const stale = () => gen !== this.generation;
    this.isLoadingMore = false;
    this.fetchState.set(States.loading);
    this.conversations.set([]);
    this.hasMoreResults.set(false);
    this.reloadOnConnect = false;
    this.connectToSearch.set(false);
    this.searchFailed.set(false);
    this.failureHold?.drop('conversations');
    this.lastSearch = { keyword, filters, customBuilder };
    this.keywordSearch = keyword.trim() !== '';

    if (!hasValidSearchCriteria(keyword, filters)) {
      this.fetchState.set(States.empty);
      return;
    }

    try {
      this.searchRequest = this.buildRequest(keyword, filters, customBuilder);
      const limit = filters.length > 0 ? 30 : 3;
      // Offline on, filters without a keyword: cached rows first, then the server's (README §3.9).
      if (isOfflineOn() && !this.keywordSearch) {
        await this.searchTwoPhase(this.searchRequest, limit, stale);
        return;
      }
      const results = await this.searchRequest.fetchNext();
      if (stale()) return;

      if (results.length > 0) {
        this.conversations.set(results);
        this.fetchState.set(States.loaded);
        this.hasMoreResults.set(results.length >= limit);
      } else {
        this.fetchState.set(States.empty);
        this.hasMoreResults.set(false);
      }
    } catch (error) {
      // An older search's failure says nothing about the current one.
      if (stale()) return;
      // Offline on, no connection: the conversations already on screen stay and nothing is reported (D84 rule 2); with
      // nothing on screen a keyword search is "Connect to search", an offline state with no `searchError`
      // (rule 7), and runs once more when the connection is back (rule 8). A search by filter alone is not
      // "Connect to search" (Android): it is the plain empty state, with no report and no re-run.
      const rowsShown = isOfflineOn() && this.conversations().length > 0;
      if (isOfflineOn() && isNotConnectedError(error)) {
        const connectToSearch = this.keywordSearch && !rowsShown;
        this.reloadOnConnect = connectToSearch;
        this.connectToSearch.set(connectToSearch);
        this.fetchState.set(rowsShown ? States.loaded : States.empty);
        return;
      }
      // Offline on, inside the search component, a real failure with nothing on screen waits for the other
      // scope (Android's final state): the component makes it the error view only when that scope failed too,
      // reports it when that scope has results, and otherwise it is the plain empty state with no report.
      if (isOfflineOn() && !rowsShown && this.failureHold) {
        this.failureHold.hold('conversations', error);
        this.searchFailed.set(true);
        this.fetchState.set(States.empty);
        return;
      }
      // Any other failure: results on screen stay (and it is reported once, rule 5); with nothing on
      // screen it is the error view (rule 4). The caller reports it: this is the search's `onError`.
      this.fetchState.set(rowsShown ? States.loaded : States.error);
      throw error;
    }
  }

  /** Whether the current search has a keyword (and so has no cache to read). */
  private keywordSearch = false;

  /** Filters without a keyword on the offline path: cached then server, deduped by conversation id. */
  private async searchTwoPhase(request: CometChat.ConversationsRequest, limit: number, stale: () => boolean): Promise<void> {
    const keyOf = (c: CometChat.Conversation) => c.getConversationId();
    let cachedKeys = new Set<string>();
    const { server, unreachable } = await readPageTwoPhase<CometChat.Conversation>(request, 'conversations', cached => {
      if (stale() || cached.length === 0) return;
      cachedKeys = new Set(cached.map(keyOf));
      this.conversations.set(cached);
      this.fetchState.set(States.loaded);
    });
    if (stale()) return;
    if (server === null) {
      // Offline and nothing newer: `search()` keeps the cached rows, or says "Connect to search" when
      // nothing is on screen (D84 rules 2 and 7).
      this.hasMoreResults.set(false);
      throw unreachable ?? new Error('not connected');
    }
    const merged = mergeSnapshotPage(this.conversations(), cachedKeys, server, keyOf);
    this.conversations.set(merged);
    this.fetchState.set(merged.length > 0 ? States.loaded : States.empty);
    this.hasMoreResults.set(server.length >= limit);
  }

  /** Load the next page of results. */
  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.searchRequest) {
      return;
    }
    this.isLoadingMore = true;
    const gen = this.generation;
    const stale = () => gen !== this.generation;

    try {
      if (isOfflineOn() && !this.keywordSearch) {
        await this.loadMoreTwoPhase(this.searchRequest, stale);
        return;
      }
      const results = await this.searchRequest.fetchNext();
      if (stale()) return;
      if (results.length > 0) {
        this.conversations.update(prev => {
          const existingIds = new Set(prev.map(c => c.getConversationId()));
          const newItems = results.filter(c => !existingIds.has(c.getConversationId()));
          return [...prev, ...newItems];
        });
        this.hasMoreResults.set(results.length >= 30);
      } else {
        this.hasMoreResults.set(false);
      }
    } catch (error) {
      if (stale()) return;
      // Offline past the cache: keep the rows; the next scroll tries again.
      if (!(isOfflineOn() && isNotConnectedError(error))) throw error;
    } finally {
      // A newer search owns the flag.
      if (!stale()) this.isLoadingMore = false;
    }
  }

  /** Next page of a keyword-less search on the offline path; "load more" never repeats a row. */
  private async loadMoreTwoPhase(request: CometChat.ConversationsRequest, stale: () => boolean): Promise<void> {
    const keyOf = (c: CometChat.Conversation) => c.getConversationId();
    let cachedKeys = new Set<string>();
    const { server } = await readPageTwoPhase<CometChat.Conversation>(request, 'conversations', cached => {
      if (stale() || cached.length === 0) return;
      cachedKeys = new Set(cached.map(keyOf));
      this.conversations.update(prev => mergeSnapshotPage(prev, new Set<string>(), cached, keyOf));
    });
    if (stale() || server === null) return;
    this.conversations.update(prev => mergeSnapshotPage(prev, cachedKeys, server, keyOf));
    this.hasMoreResults.set(server.length >= 30);
  }

  /** Attach all real-time SDK listeners. */
  attachListeners(loggedInUser: CometChat.User): void {
    this.loggedInUser = loggedInUser;
    this.attachMessageListener();
    this.attachUserListener();
    this.attachGroupListener();
    this.attachCallListener();
    this.attachTypingListener();
    this.attachReceiptListener();
  }

  /** Detach all real-time SDK listeners. */
  detachListeners(): void {
    if (this.messageListenerId) {
      CometChat.removeMessageListener(this.messageListenerId);
    }
    if (this.userListenerId) {
      CometChat.removeUserListener(this.userListenerId);
    }
    if (this.groupListenerId) {
      CometChat.removeGroupListener(this.groupListenerId);
    }
    if (this.callListenerId) {
      CometChat.removeCallListener(this.callListenerId);
    }
    if (this.typingListenerId) {
      CometChat.removeMessageListener(this.typingListenerId);
    }
    this.receiptSubscriptions.forEach(s => s.unsubscribe());
    this.receiptSubscriptions = [];
  }

  /** Reset all state and detach listeners. */
  reset(): void {
    this.generation++;
    this.detachListeners();
    this.conversations.set([]);
    this.fetchState.set(States.loaded);
    this.hasMoreResults.set(false);
    this.reloadOnConnect = false;
    this.connectToSearch.set(false);
    this.searchFailed.set(false);
    this.failureHold?.drop('conversations');
    this.lastSearch = null;
    this.typingIndicatorMap.set(new Map());
    this.searchRequest = null;
    this.isLoadingMore = false;
    this.loggedInUser = null;
  }

  // --- Request building ---

  private buildRequest(
    keyword: string,
    filters: CometChatSearchFilter[],
    customBuilder?: CometChat.ConversationsRequestBuilder
  ): CometChat.ConversationsRequest {
    let builder = customBuilder ?? new CometChat.ConversationsRequestBuilder();
    const limit = filters.length > 0 ? 30 : 3;

    builder = builder.setLimit(limit);

    if (keyword.trim() !== '') {
      builder = builder.setSearchKeyword(keyword);
    }
    if (filters.includes(CometChatSearchFilter.Unread)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      builder = (builder as any).setUnread(true);
    }
    if (filters.includes(CometChatSearchFilter.Groups)) {
      builder = builder.setConversationType(
        CometChatUIKitConstants.MessageReceiverType.group
      );
    }

    return builder.build();
  }

  // --- Real-time listeners ---

  private attachMessageListener(): void {
    this.messageListenerId = 'SearchConv_Msg_' + Date.now();
    CometChat.addMessageListener(
      this.messageListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (msg: CometChat.TextMessage) => this.handleNewMessage(msg),
        onMediaMessageReceived: (msg: CometChat.MediaMessage) => this.handleNewMessage(msg),
        onCustomMessageReceived: (msg: CometChat.CustomMessage) => this.handleNewMessage(msg),
        onMessageEdited: (msg: CometChat.BaseMessage) => this.handleMessageUpdate(msg),
        onMessageDeleted: (msg: CometChat.BaseMessage) => this.handleMessageUpdate(msg),
      })
    );
  }

  private attachUserListener(): void {
    this.userListenerId = 'SearchConv_User_' + Date.now();
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (user: CometChat.User) => this.handleUserStatusChange(user),
        onUserOffline: (user: CometChat.User) => this.handleUserStatusChange(user),
      })
    );
  }

  private attachGroupListener(): void {
    this.groupListenerId = 'SearchConv_Group_' + Date.now();
    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberJoined: (msg: CometChat.Action) => this.handleNewMessage(msg),
        onGroupMemberLeft: (msg: CometChat.Action, user: CometChat.User) => {
          if (this.loggedInUser?.getUid() === user.getUid()) {
            this.removeConversationByGroup(msg);
          } else {
            this.handleNewMessage(msg);
          }
        },
        onGroupMemberKicked: (msg: CometChat.Action, _: unknown, kicked: CometChat.User) => {
          if (this.loggedInUser?.getUid() === kicked.getUid()) {
            this.removeConversationByGroup(msg);
          } else {
            this.handleNewMessage(msg);
          }
        },
        onGroupMemberBanned: (msg: CometChat.Action, banned: CometChat.User) => {
          if (this.loggedInUser?.getUid() === banned.getUid()) {
            this.removeConversationByGroup(msg);
          } else {
            this.handleNewMessage(msg);
          }
        },
        onMemberAddedToGroup: (msg: CometChat.Action) => this.handleNewMessage(msg),
        onGroupMemberScopeChanged: (msg: CometChat.Action) => this.handleNewMessage(msg),
      })
    );
  }

  private attachCallListener(): void {
    this.callListenerId = 'SearchConv_Call_' + Date.now();
    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => this.handleNewMessage(call),
        onOutgoingCallAccepted: (call: CometChat.Call) => this.handleNewMessage(call),
        onOutgoingCallRejected: (call: CometChat.Call) => this.handleNewMessage(call),
        onIncomingCallCancelled: (call: CometChat.Call) => this.handleNewMessage(call),
      })
    );
  }

  private attachTypingListener(): void {
    this.typingListenerId = 'SearchConv_Typing_' + Date.now();
    CometChat.addMessageListener(
      this.typingListenerId,
      new CometChat.MessageListener({
        onTypingStarted: (indicator: CometChat.TypingIndicator) => {
          this.handleTypingStarted(indicator);
        },
        onTypingEnded: (indicator: CometChat.TypingIndicator) => {
          this.handleTypingEnded(indicator);
        },
      })
    );
  }

  private attachReceiptListener(): void {
    const delivered = CometChatMessageEvents.onMessagesDelivered.subscribe(
      (receipt: CometChat.MessageReceipt) => {
        if (receipt.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
          this.handleReceipt(receipt, false);
        }
      }
    );
    const read = CometChatMessageEvents.onMessagesRead.subscribe(
      (receipt: CometChat.MessageReceipt) => {
        if (receipt.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
          this.handleReceipt(receipt, true);
        }
      }
    );
    this.receiptSubscriptions.push(delivered, read);
  }

  // --- Event handlers ---

  private handleNewMessage(message: CometChat.BaseMessage): void {
    const convId = message.getConversationId();
    this.conversations.update(list => {
      const idx = list.findIndex(c => c.getConversationId() === convId);
      if (idx === -1) {
        return list;
      }
      const updated = this.cloneConversation(list[idx]);
      updated.setLastMessage(message);

      // Increment unread if not sent by logged-in user
      if (message.getSender()?.getUid() !== this.loggedInUser?.getUid()) {
        updated.setUnreadMessageCount((updated.getUnreadMessageCount() ?? 0) + 1);
      }

      // Move to top
      const rest = list.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
  }

  private handleMessageUpdate(message: CometChat.BaseMessage): void {
    const msgId = message.getId();
    this.conversations.update(list =>
      list.map(conv => {
        const lastMsg = conv.getLastMessage();
        if (lastMsg && lastMsg.getId() === msgId) {
          const updated = this.cloneConversation(conv);
          updated.setLastMessage(message);
          return updated;
        }
        return conv;
      })
    );
  }

  private handleUserStatusChange(user: CometChat.User): void {
    const uid = user.getUid();
    this.conversations.update(list =>
      list.map(conv => {
        const convWith = conv.getConversationWith();
        if (convWith instanceof CometChat.User && convWith.getUid() === uid) {
          const updated = this.cloneConversation(conv);
          updated.setConversationWith(user);
          return updated;
        }
        return conv;
      })
    );
  }

  private handleTypingStarted(indicator: CometChat.TypingIndicator): void {
    const id = this.getTypingId(indicator);
    if (!id) {
      return;
    }
    this.typingIndicatorMap.update(map => {
      const next = new Map(map);
      next.set(id, indicator);
      return next;
    });
  }

  private handleTypingEnded(indicator: CometChat.TypingIndicator): void {
    const id = this.getTypingId(indicator);
    if (!id) {
      return;
    }
    this.typingIndicatorMap.update(map => {
      if (!map.has(id)) {
        return map;
      }
      const next = new Map(map);
      next.delete(id);
      return next;
    });
  }

  private handleReceipt(receipt: CometChat.MessageReceipt, isRead: boolean): void {
    const receiptMsgId = typeof receipt.getMessageId === 'function' ? receipt.getMessageId() : '';
    this.conversations.update(list =>
      list.map(conv => {
        const lastMsg = conv.getLastMessage();
        if (
          lastMsg &&
          String(lastMsg.getId()) === receiptMsgId &&
          conv.getConversationWith() instanceof CometChat.User
        ) {
          const updated = this.cloneConversation(conv);
          if (isRead) {
            updated.getLastMessage()?.setReadAt(receipt.getReadAt());
            updated.setUnreadMessageCount(0);
          } else {
            updated.getLastMessage()?.setDeliveredAt(receipt.getDeliveredAt());
          }
          return updated;
        }
        return conv;
      })
    );
  }

  private removeConversationByGroup(message: CometChat.Action): void {
    const convId = message.getConversationId();
    this.conversations.update(list => {
      const filtered = list.filter(c => c.getConversationId() !== convId);
      if (filtered.length === 0) {
        this.fetchState.set(States.empty);
      }
      return filtered;
    });
  }

  // --- Helpers ---

  private getTypingId(indicator: CometChat.TypingIndicator): string | null {
    const isGroup =
      indicator.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group;
    if (isGroup) {
      return indicator.getReceiverId() ?? null;
    }
    return indicator.getSender()?.getUid() ?? null;
  }

  private cloneConversation(conv: CometChat.Conversation): CometChat.Conversation {
    return CometChatUIKitUtility.clone(conv);
  }
}
