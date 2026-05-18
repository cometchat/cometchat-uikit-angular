import { Injectable, signal, computed, inject, DestroyRef, NgZone } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';
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
} from './conversations.utils';
import {
  setupUIEventSubscriptions, setupCallEventSubscriptions,
} from './conversations.ui-events';

// Re-export types for backward compatibility
export type { ConversationId, ConversationOperationContext } from './conversations.types';

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

  // ==================== State Signals ====================
  private conversationsSignal = signal<CometChat.Conversation[]>([]);
  private loadingStateSignal = signal<boolean>(false);
  private errorStateSignal = signal<Error | null>(null);
  private activeConversationSignal = signal<CometChat.Conversation | null>(null);
  private typingIndicatorsSignal = signal<Map<string, CometChat.TypingIndicator>>(new Map());
  private allConversationsSignal = signal<CometChat.Conversation[]>([]);

  // ==================== Public Signal API ====================
  readonly conversations = this.conversationsSignal.asReadonly();
  readonly loadingState = this.loadingStateSignal.asReadonly();
  readonly errorState = this.errorStateSignal.asReadonly();
  readonly activeConversation = this.activeConversationSignal.asReadonly();
  readonly typingIndicators = this.typingIndicatorsSignal.asReadonly();

  // ==================== Observable API (backward compat) ====================
  readonly conversations$: Observable<CometChat.Conversation[]> = toObservable(this.conversationsSignal);
  readonly loadingState$: Observable<boolean> = toObservable(this.loadingStateSignal);
  readonly errorState$: Observable<Error | null> = toObservable(this.errorStateSignal);
  readonly activeConversation$: Observable<CometChat.Conversation | null> = toObservable(this.activeConversationSignal);
  readonly typingIndicators$: Observable<Map<string, CometChat.TypingIndicator>> = toObservable(this.typingIndicatorsSignal);

  readonly hasConversations = computed(() => this.conversationsSignal().length > 0);
  readonly isLoading = computed(() => this.loadingStateSignal());
  readonly hasError = computed(() => this.errorStateSignal() !== null);

  // ==================== Configuration ====================
  private conversationsRequest?: CometChat.ConversationsRequest;
  private requestBuilder?: CometChat.ConversationsRequestBuilder;
  private messageListenerId = `conversations_${Date.now()}`;
  private userListenerId = `conversations_user_${Date.now()}`;
  private groupListenerId = `conversations_group_${Date.now()}`;
  private callListenerId = `conversations_call_${Date.now()}`;
  private retryAttempts = new Map<string, number>();

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
      removeConversationSilently: id => this.removeConversationSilently(id),
      updateGroupOnConversation: g => this.updateGroupOnConversation(g),
      updateUserOnConversation: u => this.updateUserOnConversation(u),
      addConversationToTop: conv => { const c = [conv, ...this.allConversationsSignal()]; this.allConversationsSignal.set(c); this.conversationsSignal.set(c); },
      removeConversationFromList: id => this.removeConversationSilently(id),
      requestBuilder: this.requestBuilder,
    });

    this.destroyRef.onDestroy(() => { this.removeListeners(); this.resetState(); });
  }

  // ==================== Error Handling ====================
  clearError(): void { this.errorStateSignal.set(null); }
  private setError(e: Error): void { this.errorStateSignal.set(e); }

  // ==================== Public Methods ====================
  setConversationsRequestBuilder(builder: CometChat.ConversationsRequestBuilder): void { this.requestBuilder = builder; this.conversationsRequest = undefined; }
  setActiveConversation(conversation: CometChat.Conversation | null): void { this.activeConversationSignal.set(conversation); }
  getConversations(): CometChat.Conversation[] { return this.conversationsSignal(); }

  async fetchConversations(builder?: CometChat.ConversationsRequestBuilder): Promise<void> {
    try {
      this.allConversationsSignal.set([]); this.conversationsSignal.set([]);
      this.loadingStateSignal.set(true); this.errorStateSignal.set(null);
      const t0 = Date.now();
      const b = builder || this.requestBuilder || new CometChat.ConversationsRequestBuilder().setLimit(30);
      this.conversationsRequest = b.build();
      const conversations = await this.conversationsRequest.fetchNext();
      await new Promise<void>(r => setTimeout(r, Math.max(0, 1000 - (Date.now() - t0))));
      this.allConversationsSignal.set(conversations); this.conversationsSignal.set(conversations);
      this.loadingStateSignal.set(false);
    } catch (error) {
      this.loadingStateSignal.set(false);
      await handleErrorWithRetry(error, 'fetchConversations', this.retryAttempts, this.setError.bind(this), () => this.fetchConversations(builder));
    }
  }

  async fetchNextConversations(): Promise<boolean> {
    if (!this.conversationsRequest) return false;
    if (this.loadingStateSignal()) return true;
    try {
      this.loadingStateSignal.set(true); this.errorStateSignal.set(null);
      const next = await this.conversationsRequest.fetchNext();
      const updated = [...this.conversationsSignal(), ...next];
      this.allConversationsSignal.set(updated); this.conversationsSignal.set(updated);
      this.loadingStateSignal.set(false);
      return next.length > 0;
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
      if (me && msg.getSender().getUid() !== me.getUid() && !isActiveConversation)
        conversation.setUnreadMessageCount((conversation.getUnreadMessageCount() ?? 0) + 1);
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
  }

  // ==================== SDK Listener Setup ====================

  private setupSDKListeners(): void {
    const nm = (m: CometChat.BaseMessage) => this.handleNewMessage(m);
    setupMessageListener(this.messageListenerId, {
      onTextMessageReceived: nm, onMediaMessageReceived: nm,
      onCustomMessageReceived: nm, onInteractiveMessageReceived: nm,
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
      if (me && message.getSender().getUid() !== me.getUid() && !message.getDeliveredAt() && !isActive)
        CometChat.markAsDelivered(message).catch(() => {});
      this.refreshSingleConversation(message);
    } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling new message:', e); }
  }

  private handleMessageUpdate(m: CometChat.BaseMessage): void { try { this.refreshSingleConversation(m); } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling message update:', e); } }
  private handleMessageDelete(m: CometChat.BaseMessage): void { try { this.refreshSingleConversation(m); } catch (e) { CometChatLogger.error('ConversationsService', 'Error handling message delete:', e); } }

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
