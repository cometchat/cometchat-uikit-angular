import { Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { CometChatLogger } from '../utils/CometChatLogger';
import type { ErrorCallback, MentionSuggestion, PollCreatePayload, CollaborativePayload } from './message-composer.types';
import {
  handleComposerError,
  getReceiverId,
  getReceiverType,
  fetchUsersForMention,
  fetchGroupMembersForMention,
  buildMentionsPaginationRequest,
  resultsToMentionSuggestions,
} from './message-composer.utils';

// Re-export types for backward compatibility
export type { ErrorCallback, MentionSuggestion, PollCreatePayload, CollaborativePayload } from './message-composer.types';

/**
 * MessageComposerService
 *
 * Manages message composer state and SDK interactions.
 * Handles sending text/media messages, editing, typing indicators,
 * file upload progress, and mention suggestions.
 *
 * @Injectable — provided at component level via CometChatMessageComposerComponent providers
 * @see Requirements 29.1–29.10
 */
@Injectable()
export class MessageComposerService {
  // ==================== State Signals ====================
  private isSendingSignal = signal<boolean>(false);
  private uploadProgressSignal = signal<Map<string, number>>(new Map());
  private isRecordingSignal = signal<boolean>(false);
  private recordingDurationSignal = signal<number>(0);
  private mentionSuggestionsSignal = signal<MentionSuggestion[]>([]);
  private isFetchingMentionsSignal = signal<boolean>(false);
  private isFetchingMoreMentionsSignal = signal<boolean>(false);
  private hasMoreMentionsSignal = signal<boolean>(true);
  private mentionsPaginationRequest: any = null;

  private mentionSearchSubject = new Subject<{
    searchText: string;
    group?: CometChat.Group;
    usersRequestBuilder?: CometChat.UsersRequestBuilder;
    groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    disableMentionAll?: boolean;
    mentionAllLabel?: string;
  }>();

  private mentionSearchSubscription: import('rxjs').Subscription | null = null;

  // ==================== Public Read-Only Signals ====================
  readonly isSending = this.isSendingSignal.asReadonly();
  readonly uploadProgress = this.uploadProgressSignal.asReadonly();
  readonly isRecording = this.isRecordingSignal.asReadonly();
  readonly recordingDuration = this.recordingDurationSignal.asReadonly();
  readonly mentionSuggestions = this.mentionSuggestionsSignal.asReadonly();
  readonly isFetchingMentions = this.isFetchingMentionsSignal.asReadonly();
  readonly isFetchingMoreMentions = this.isFetchingMoreMentionsSignal.asReadonly();
  readonly hasMoreMentions = this.hasMoreMentionsSignal.asReadonly();

  private errorCallback: ErrorCallback | null = null;

  constructor() {
    this.setupMentionSearchSubscription();
  }

  private setupMentionSearchSubscription(): void {
    this.mentionSearchSubscription = this.mentionSearchSubject
      .pipe(
        debounceTime(150),
        switchMap(({ searchText, group, usersRequestBuilder, groupMembersRequestBuilder, disableMentionAll, mentionAllLabel }) => {
          this.isFetchingMentionsSignal.set(true);
          if (group) {
            return fetchGroupMembersForMention(group, searchText, groupMembersRequestBuilder, disableMentionAll, mentionAllLabel).pipe(
              catchError(error => { this.handleError(error, 'Error fetching group members for mention'); return of([]); })
            );
          }
          return fetchUsersForMention(searchText, usersRequestBuilder).pipe(
            catchError(error => { this.handleError(error, 'Error fetching users for mention'); return of([]); })
          );
        })
      )
      .subscribe(suggestions => {
        this.mentionSuggestionsSignal.set(suggestions);
        this.isFetchingMentionsSignal.set(false);
      });
  }

  // ==================== Error Callback ====================

  setErrorCallback(callback: ErrorCallback | null): void { this.errorCallback = callback; }

  private handleError(error: unknown, context: string): void {
    handleComposerError(error, context, this.errorCallback);
  }

  // ==================== Message Sending ====================

  async sendTextMessage(
    receiver: CometChat.User | CometChat.Group,
    text: string,
    metadata?: Record<string, unknown>,
    parentMessageId?: number,
    quotedMessage?: CometChat.BaseMessage,
    message?: CometChat.TextMessage
  ): Promise<CometChat.TextMessage | null> {
    if (!receiver && !message) { this.handleError(new Error('Receiver is required'), 'sendTextMessage'); return null; }
    try {
      this.isSendingSignal.set(true);
      let textMessage: CometChat.TextMessage;
      if (message) {
        textMessage = message;
      } else {
        textMessage = new CometChat.TextMessage(getReceiverId(receiver), text, getReceiverType(receiver));
        if (metadata) textMessage.setMetadata(metadata);
        if (parentMessageId) textMessage.setParentMessageId(parentMessageId);
        if (quotedMessage) { textMessage.setQuotedMessage(quotedMessage); textMessage.setQuotedMessageId(quotedMessage.getId()); }
      }
      return (await CometChat.sendMessage(textMessage)) as CometChat.TextMessage;
    } catch (error) { this.handleError(error, 'Error sending text message'); return null; }
    finally { this.isSendingSignal.set(false); }
  }

  async sendMediaMessage(
    receiver: CometChat.User | CometChat.Group,
    file: File,
    type: string,
    metadata?: Record<string, unknown>,
    parentMessageId?: number,
    quotedMessage?: CometChat.BaseMessage,
    message?: CometChat.MediaMessage
  ): Promise<CometChat.MediaMessage | null> {
    if (!receiver && !message) { this.handleError(new Error('Receiver is required'), 'sendMediaMessage'); return null; }
    try {
      this.isSendingSignal.set(true);
      let mediaMessage: CometChat.MediaMessage;
      if (message) {
        mediaMessage = message;
      } else {
        mediaMessage = new CometChat.MediaMessage(getReceiverId(receiver), file, type, getReceiverType(receiver));
        if (metadata) mediaMessage.setMetadata(metadata);
        if (parentMessageId) mediaMessage.setParentMessageId(parentMessageId);
        if (quotedMessage) { mediaMessage.setQuotedMessage(quotedMessage); mediaMessage.setQuotedMessageId(quotedMessage.getId()); }
      }
      return (await CometChat.sendMediaMessage(mediaMessage)) as CometChat.MediaMessage;
    } catch (error) { this.handleError(error, 'Error sending media message'); return null; }
    finally { this.isSendingSignal.set(false); }
  }

  async editMessage(message: CometChat.BaseMessage, newText: string): Promise<CometChat.BaseMessage | null> {
    try {
      this.isSendingSignal.set(true);
      const textMessage = message as CometChat.TextMessage;
      textMessage.setText(newText);
      return await CometChat.editMessage(textMessage);
    } catch (error) { this.handleError(error, 'Error editing message'); return null; }
    finally { this.isSendingSignal.set(false); }
  }

  async sendStickerMessage(
    receiver: CometChat.User | CometChat.Group,
    stickerUrl: string,
    stickerName: string,
    parentMessageId?: number,
    quotedMessage?: CometChat.BaseMessage,
    message?: CometChat.CustomMessage
  ): Promise<CometChat.CustomMessage | null> {
    if (!receiver && !message) { this.handleError(new Error('Receiver is required'), 'sendStickerMessage'); return null; }
    try {
      this.isSendingSignal.set(true);
      let customMessage: CometChat.CustomMessage;
      if (message) {
        customMessage = message;
      } else {
        customMessage = new CometChat.CustomMessage(getReceiverId(receiver), getReceiverType(receiver), 'extension_sticker', { sticker_url: stickerUrl, sticker_name: stickerName });
        if (parentMessageId) customMessage.setParentMessageId(parentMessageId);
        if (quotedMessage) { customMessage.setQuotedMessage(quotedMessage); customMessage.setQuotedMessageId(quotedMessage.getId()); }
      }
      return (await CometChat.sendCustomMessage(customMessage)) as CometChat.CustomMessage;
    } catch (error) { this.handleError(error, 'Error sending sticker message'); return null; }
    finally { this.isSendingSignal.set(false); }
  }

  // ==================== Extension API ====================

  async createPoll(question: string, options: string[], receiverId: string, receiverType: string, quotedMessageId?: number): Promise<unknown> {
    try {
      const payload: PollCreatePayload = { question, options, receiver: receiverId, receiverType };
      if (quotedMessageId) payload.quotedMessageId = quotedMessageId;
      return await CometChat.callExtension('polls', 'POST', 'v2/create', payload);
    } catch (error) { this.handleError(error, 'Error creating poll'); return null; }
  }

  async createCollaborativeDocument(receiverId: string, receiverType: string, quotedMessageId?: number): Promise<unknown> {
    try {
      const payload: CollaborativePayload = { receiver: receiverId, receiverType };
      if (quotedMessageId) payload.quotedMessageId = quotedMessageId;
      return await CometChat.callExtension('document', 'POST', 'v1/create', payload);
    } catch (error) { this.handleError(error, 'Error creating collaborative document'); return null; }
  }

  async createCollaborativeWhiteboard(receiverId: string, receiverType: string, quotedMessageId?: number): Promise<unknown> {
    try {
      const payload: CollaborativePayload = { receiver: receiverId, receiverType };
      if (quotedMessageId) payload.quotedMessageId = quotedMessageId;
      return await CometChat.callExtension('whiteboard', 'POST', 'v1/create', payload);
    } catch (error) { this.handleError(error, 'Error creating collaborative whiteboard'); return null; }
  }

  // ==================== Typing Indicators ====================

  startTyping(receiver: CometChat.User | CometChat.Group): void {
    if (!receiver) { CometChatLogger.error('MessageComposerService', 'startTyping: Receiver is required'); return; }
    try {
      const indicator = new CometChat.TypingIndicator(getReceiverId(receiver), getReceiverType(receiver));
      CometChat.startTyping(indicator);
    } catch (error) { CometChatLogger.error('MessageComposerService', 'Error starting typing:', error); }
  }

  endTyping(receiver: CometChat.User | CometChat.Group): void {
    if (!receiver) { CometChatLogger.error('MessageComposerService', 'endTyping: Receiver is required'); return; }
    try {
      const indicator = new CometChat.TypingIndicator(getReceiverId(receiver), getReceiverType(receiver));
      CometChat.endTyping(indicator);
    } catch (error) { CometChatLogger.error('MessageComposerService', 'Error ending typing:', error); }
  }

  // ==================== Upload Progress ====================

  updateUploadProgress(fileId: string, progress: number): void {
    const map = new Map(this.uploadProgressSignal());
    map.set(fileId, progress);
    this.uploadProgressSignal.set(map);
  }

  clearUploadProgress(fileId: string): void {
    const map = new Map(this.uploadProgressSignal());
    map.delete(fileId);
    this.uploadProgressSignal.set(map);
  }

  clearAllUploadProgress(): void { this.uploadProgressSignal.set(new Map()); }

  // ==================== Recording State ====================

  setRecordingState(isRecording: boolean): void {
    this.isRecordingSignal.set(isRecording);
    if (!isRecording) this.recordingDurationSignal.set(0);
  }

  updateRecordingDuration(duration: number): void { this.recordingDurationSignal.set(duration); }

  // ==================== Mention Methods ====================

  searchMentions(
    searchText: string,
    group?: CometChat.Group,
    usersRequestBuilder?: CometChat.UsersRequestBuilder,
    groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder,
    disableMentionAll = false,
    mentionAllLabel = 'all'
  ): void {
    this.isFetchingMentionsSignal.set(true);
    this.mentionSearchSubject.next({ searchText, group, usersRequestBuilder, groupMembersRequestBuilder, disableMentionAll, mentionAllLabel });
  }

  initializeMentionsPagination(
    searchText: string,
    group?: CometChat.Group,
    customUsersRequestBuilder?: CometChat.UsersRequestBuilder,
    customGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder
  ): void {
    this.mentionsPaginationRequest = buildMentionsPaginationRequest(searchText, group, customUsersRequestBuilder, customGroupMembersRequestBuilder);
    this.hasMoreMentionsSignal.set(true);
    this.isFetchingMoreMentionsSignal.set(false);
  }

  async fetchMoreMentions(isGroupContext: boolean): Promise<void> {
    if (!this.hasMoreMentionsSignal() || this.isFetchingMoreMentionsSignal() || !this.mentionsPaginationRequest) return;
    this.isFetchingMoreMentionsSignal.set(true);
    try {
      const results = await this.mentionsPaginationRequest.fetchNext();
      const newSuggestions = resultsToMentionSuggestions(results, isGroupContext);
      this.mentionSuggestionsSignal.set([...this.mentionSuggestionsSignal(), ...newSuggestions]);
      this.hasMoreMentionsSignal.set(newSuggestions.length >= 20);
    } catch (error) {
      this.hasMoreMentionsSignal.set(false);
      this.handleError(error, 'Error fetching more mentions');
    } finally { this.isFetchingMoreMentionsSignal.set(false); }
  }

  appendMentionSuggestions(suggestions: MentionSuggestion[]): void {
    this.mentionSuggestionsSignal.set([...this.mentionSuggestionsSignal(), ...suggestions]);
  }

  async checkIfSelfMention(userId: string): Promise<boolean> {
    try {
      const loggedInUser = await CometChat.getLoggedinUser();
      return loggedInUser?.getUid() === userId;
    } catch (error) { this.handleError(error, 'Error checking self mention'); return false; }
  }

  clearMentionSuggestions(): void { this.mentionSuggestionsSignal.set([]); }

  stopMentionSearch(): void {
    this.isFetchingMentionsSignal.set(false);
    this.isFetchingMoreMentionsSignal.set(false);
  }

  // ==================== Cleanup ====================

  cleanup(): void {
    try {
      this.isSendingSignal.set(false);
      this.uploadProgressSignal.set(new Map());
      this.isRecordingSignal.set(false);
      this.recordingDurationSignal.set(0);
      this.mentionSuggestionsSignal.set([]);
      this.isFetchingMentionsSignal.set(false);
      this.isFetchingMoreMentionsSignal.set(false);
      this.hasMoreMentionsSignal.set(true);
      this.mentionsPaginationRequest = null;
      this.errorCallback = null;
    } catch (error) { CometChatLogger.error('MessageComposerService', 'Error during cleanup:', error); }
  }
}
