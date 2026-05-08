import {inject, DestroyRef, signal, WritableSignal, Signal, NgZone} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {Observable, Subscription} from 'rxjs';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {ErrorCallback} from './message-composer.service';
import {CometChatUIKitConstants} from '../constants';
import {CometChatUIKit} from '../cometchat-uikit';
import {CometChatMessageEvents, IMessages} from '../events/CometChatMessageEvents';
import {MessageStatus} from '../Enums/Enums';
import {CometChatUIKitUtility} from '../CometChatUIKitUtility';
import {CometChatLogger} from '../utils/CometChatLogger';
import {isRecoverableError, isRecoverableErrorMessage, isRetryableError, getUserFriendlyErrorMessage, getRetryDelay, delay as delayUtil} from './message-list.error-utils';
import {applyReactionEvent, isReactionForCurrentConversation, isReceiptForCurrentConversation, applyReadReceipt, applyDeliveryReceipt} from './message-list.reaction-utils';
import {setupMessageListener as setupMsgListener, setupGroupListener as setupGrpListener, setupCallListener as setupCallLstnr, setupConnectionListener as setupConnListener} from './message-list.listeners';
import {fetchPreviousMessagesImpl, fetchNextMessagesImpl, fetchMessagesAroundIdImpl, handleReceiptImpl} from './message-list.fetch-utils';
import {addMessageImpl, updateMessageByIdImpl, updateMessageByMuidImpl, deleteMessageImpl, editMessageImpl, removeMessageImpl, getMessageByIdImpl, updateReplyCountImpl, updateMessageReactionsImpl, deduplicateMessagesImpl, clearMessagesImpl, clearMessagesAndStateImpl} from './message-list.message-ops';
import {addReactionImpl, removeReactionImpl, fetchReactionsImpl} from './message-list.reaction-ops';
import {markAsReadImpl, updateLocalReadStatusImpl, markInitialMessagesAsReadImpl, markAsDeliveredImpl, markAsUnreadImpl, getMessagesInRangeImpl, getTotalMessageCountImpl} from './message-list.read-ops';
import {handleTypingStartedImpl, handleTypingEndedImpl, clearTypingIndicatorImpl, isTypingIndicatorForCurrentConversationImpl} from './message-list.typing-utils';
import {translateMessageImpl, getCachedTranslationImpl, clearTranslationCacheImpl, flagMessageImpl} from './message-list.translation-utils';
import {setupSentMessageListenerImpl, setupEditedMessageListenerImpl, handleSentMessageImpl, updateSentMessageByMuidImpl, updateSentMessageReplyCountImpl, handleEditedMessageImpl} from './message-list.sent-handler';
import {buildMessagesRequestImpl, buildNextMessagesRequestImpl, getDefaultMessageTypesImpl, getDefaultMessageCategoriesImpl} from './message-list.request-builder';
import {isMessageForCurrentConversationImpl, isThreadReplyForCurrentConversationImpl, handleGroupActionImpl, handleCallActionImpl, handleReconnectionImpl} from './message-list.conversation-utils';

export class MessageListService {
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  private messageListenerId = `message_list_${Date.now()}`; private groupListenerId = `message_list_group_${Date.now()}`;
  private callListenerId = `message_list_call_${Date.now()}`; private connectionListenerId = `message_list_connection_${Date.now()}`;

  private ccMessageSentSubscription: Subscription | null = null; private ccMessageEditedSubscription: Subscription | null = null;

  private messagesSignal: WritableSignal<CometChat.BaseMessage[]> = signal<CometChat.BaseMessage[]>([]);
  private allMessagesSignal: WritableSignal<CometChat.BaseMessage[]> = signal<CometChat.BaseMessage[]>([]);

  private loadingStateSignal: WritableSignal<boolean> = signal<boolean>(false); private errorStateSignal: WritableSignal<Error | null> = signal<Error | null>(null);
  private prevMessageIdSignal: WritableSignal<number> = signal<number>(0); private nextMessageIdSignal: WritableSignal<number> = signal<number>(0); private unreadCountSignal: WritableSignal<number> = signal<number>(0);

  private connectionStatusSignal: WritableSignal<'connected' | 'disconnected'> = signal<'connected' | 'disconnected'>('connected');

  private typingUsersSignal: WritableSignal<Map<string, CometChat.TypingIndicator>> = signal<Map<string, CometChat.TypingIndicator>>(new Map());

  private typingTimeoutsMap = new Map<string, ReturnType<typeof setTimeout>>(); private messageIdMap = new Map<number, CometChat.BaseMessage>(); private messageMuidMap = new Map<string, CometChat.BaseMessage>();

  private currentUser: CometChat.User | null = null; private currentGroup: CometChat.Group | null = null; private parentMessageId: number | null = null;
  private isAgentChatMode = false; private messagesRequestBuilder: CometChat.MessagesRequestBuilder | null = null; private hideGroupActionMessages = false;
  private messagesRequest: CometChat.MessagesRequest | null = null; private nextMessagesRequest: CometChat.MessagesRequest | null = null; private errorCallback: ErrorCallback | null = null;
  private customMessageTypes: Set<string> = new Set(); private customMessageCategories: Set<string> = new Set(); private replacedMessageTypes: Set<string> | null = null; private replacedMessageCategories: Set<string> | null = null;
  private readonly DEFAULT_MESSAGE_LIMIT = 30; private readonly TYPING_INDICATOR_TIMEOUT = 5000; private readonly MAX_RETRY_ATTEMPTS = 3; private readonly RETRY_DELAYS = [1000, 2000, 4000] as const;
  private fetchGeneration = 0; private retryAttempts = new Map<string, number>(); private translationCache = new Map<string, string>();

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
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
    this.setupSentMessageListener();
    this.setupEditedMessageListener();
    this.setupMessageListener();
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
    const timestamp = Date.now();
    this.messageListenerId = `message_list_${timestamp}`;
    this.groupListenerId = `message_list_group_${timestamp}`;
    this.callListenerId = `message_list_call_${timestamp}`;
    this.connectionListenerId = `message_list_connection_${timestamp}`;
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
  private deduplicateMessages(messages: CometChat.BaseMessage[]): CometChat.BaseMessage[] { return deduplicateMessagesImpl(this as any, messages); }
  private isRecoverableError(error: unknown): boolean { return isRecoverableError(error); }
  private isRecoverableErrorMessage(message: string): boolean { return isRecoverableErrorMessage(message); }
  private getUserFriendlyErrorMessage(error: unknown, context: string): string { return getUserFriendlyErrorMessage(error, context); }
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
    const enhancedError = new Error(this.getUserFriendlyErrorMessage(error, context));
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
  async markInitialMessagesAsRead(): Promise<void> {
    const messages = this.messagesSignal();
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    return markInitialMessagesAsReadImpl(this as any, messages, loggedInUser, (msg) => this.markAsRead(msg));
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
  handleNewMessage(message: CometChat.BaseMessage): void {
    if (!this.parentMessageId && message.getParentMessageId() && !this.isAgentChatMode) {
      if (this.isThreadReplyForCurrentConversation(message)) { this.updateSentMessageReplyCount(message); }
      return;
    }
    if (!this.isMessageForCurrentConversation(message)) { return; }
    // In agent chat mode without parentMessageId: don't add incoming messages
    // if the list is empty (user hasn't sent anything in this session yet).
    // This prevents stale AI responses from a previous session appearing in a new chat.
    if (this.isAgentChatMode && !this.parentMessageId && this.messagesSignal().length === 0) {
      return;
    }
    this.addMessage(message);
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
  handleReactionEvent(reactionEvent: CometChat.ReactionEvent): void {
    const reaction = reactionEvent.getReaction();
    if (!reaction) { CometChatLogger.warn('MessageListService', 'handleReactionEvent: No reaction in event'); return; }
    const messageId = reaction.getMessageId();
    if (!messageId || typeof messageId !== 'number') { CometChatLogger.warn('MessageListService', 'handleReactionEvent: Invalid message ID:', messageId); return; }
    const message = this.getMessageById(messageId);
    if (!message) {
      return;
    }
    const eventReactions = (reaction as unknown as CometChat.ReactionEvent & { getReactions?(): CometChat.ReactionCount[] }).getReactions?.();
    const updatedReactions: CometChat.ReactionCount[] =
      eventReactions || message.getReactions() || [];
    this.updateMessageReactions(messageId, updatedReactions);
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
