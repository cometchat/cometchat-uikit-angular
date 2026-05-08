import { Injectable, signal, WritableSignal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, States } from '../Enums/Enums';
import { CometChatUIKitConstants } from '../constants';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { hasValidSearchCriteria } from '../components/cometchat-search/search-filter.utils';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { Subscription } from 'rxjs';

/**
 * Service managing conversation search state, SDK queries,
 * and real-time listener lifecycle.
 */
@Injectable({ providedIn: 'root' })
export class SearchConversationsService {
  readonly conversations: WritableSignal<CometChat.Conversation[]> = signal<CometChat.Conversation[]>([]);
  readonly fetchState: WritableSignal<States> = signal<States>(States.loaded);
  readonly hasMoreResults: WritableSignal<boolean> = signal<boolean>(false);
  readonly typingIndicatorMap: WritableSignal<Map<string, CometChat.TypingIndicator>> = signal<Map<string, CometChat.TypingIndicator>>(new Map());

  private searchRequest: CometChat.ConversationsRequest | null = null;
  private isLoadingMore = false;
  private loggedInUser: CometChat.User | null = null;
  // Listener IDs for cleanup
  private messageListenerId = '';
  private userListenerId = '';
  private groupListenerId = '';
  private callListenerId = '';
  private typingListenerId = '';
  private receiptSubscriptions: Subscription[] = [];

  /**
   * Initiate a conversation search.
   */
  async search(
    keyword: string,
    filters: CometChatSearchFilter[],
    customBuilder?: CometChat.ConversationsRequestBuilder
  ): Promise<void> {
    this.fetchState.set(States.loading);
    this.conversations.set([]);
    this.hasMoreResults.set(false);

    if (!hasValidSearchCriteria(keyword, filters)) {
      this.fetchState.set(States.empty);
      return;
    }

    try {
      this.searchRequest = this.buildRequest(keyword, filters, customBuilder);
      const limit = filters.length > 0 ? 30 : 3;
      const results = await this.searchRequest.fetchNext();

      if (results.length > 0) {
        this.conversations.set(results);
        this.fetchState.set(States.loaded);
        this.hasMoreResults.set(results.length >= limit);
      } else {
        this.fetchState.set(States.empty);
        this.hasMoreResults.set(false);
      }
    } catch (error) {
      this.fetchState.set(States.error);
      throw error;
    }
  }

  /** Load the next page of results. */
  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.searchRequest) {
      return;
    }
    this.isLoadingMore = true;

    try {
      const results = await this.searchRequest.fetchNext();
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
    } finally {
      this.isLoadingMore = false;
    }
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
    this.detachListeners();
    this.conversations.set([]);
    this.fetchState.set(States.loaded);
    this.hasMoreResults.set(false);
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
