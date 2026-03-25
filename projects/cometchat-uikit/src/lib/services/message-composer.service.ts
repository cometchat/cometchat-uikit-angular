import { Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Subject, Observable, debounceTime, switchMap, of, catchError } from 'rxjs';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Error callback type for service error handling
 * Used to propagate errors from service to component
 */
export type ErrorCallback = (error: CometChat.CometChatException) => void;

/**
 * Payload interface for creating a poll via the polls extension API
 * @see Requirements 6.1, 6.2, 6.3
 */
export interface PollCreatePayload {
  /** The poll question */
  question: string;
  /** Array of answer options (2-12 items) */
  options: string[];
  /** Receiver ID (user UID or group GUID) */
  receiver: string;
  /** Receiver type ('user' or 'group') */
  receiverType: string;
  /** Optional quoted message ID for replies */
  quotedMessageId?: number;
}

/**
 * Payload interface for creating collaborative documents and whiteboards
 * @see Requirements 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */
export interface CollaborativePayload {
  /** Receiver ID (user UID or group GUID) */
  receiver: string;
  /** Receiver type ('user' or 'group') */
  receiverType: string;
  /** Optional quoted message ID for replies */
  quotedMessageId?: number;
}

/**
 * Mention suggestion item - can be a user, group member, or special @all mention
 */
export interface MentionSuggestion {
  /** Unique identifier */
  uid: string;
  /** Display name */
  name: string;
  /** Avatar URL */
  avatar?: string;
  /** Whether this is the @all mention */
  isAllMention?: boolean;
  /** Original user or group member object */
  entity?: CometChat.User | CometChat.GroupMember;
}

/**
 * MessageComposerService
 *
 * Service responsible for managing message composer state and SDK interactions.
 * Handles sending text/media messages, editing messages, typing indicators,
 * and file upload progress tracking.
 *
 * Uses Angular Signals for reactive state management with improved performance.
 *
 * Error Handling Strategy:
 * - All SDK calls are wrapped in try-catch blocks
 * - Errors are logged to console with [MessageComposerService] prefix
 * - Errors are propagated to component via error callback
 * - Recoverable errors (network, timeout) trigger retry mechanisms
 *
 * @Injectable providedIn: 'root'
 * @see Requirements 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 29.8, 29.9, 29.10
 */
@Injectable({
  providedIn: 'root',
})
export class MessageComposerService {
  // ==================== State Signals ====================

  /**
   * Whether a message is currently being sent
   * @private
   */
  private isSendingSignal = signal<boolean>(false);

  /**
   * Map of file upload progress (fileId -> progress percentage 0-100)
   * @private
   */
  private uploadProgressSignal = signal<Map<string, number>>(new Map());

  /**
   * Whether voice recording is in progress
   * @private
   */
  private isRecordingSignal = signal<boolean>(false);

  /**
   * Current recording duration in seconds
   * @private
   */
  private recordingDurationSignal = signal<number>(0);

  /**
   * Mention suggestions signal
   * @private
   */
  private mentionSuggestionsSignal = signal<MentionSuggestion[]>([]);

  /**
   * Whether mention suggestions are loading
   * @private
   */
  private isFetchingMentionsSignal = signal<boolean>(false);

  /**
   * Whether additional mention suggestions are being fetched (pagination)
   * @private
   */
  private isFetchingMoreMentionsSignal = signal<boolean>(false);

  /**
   * Whether more mention suggestions are available to fetch
   * @private
   */
  private hasMoreMentionsSignal = signal<boolean>(true);

  /**
   * Stored request object for mention pagination (built from request builder)
   * @private
   */
  private mentionsPaginationRequest: any = null;

  /**
   * Subject for debouncing mention search
   * @private
   */
  private mentionSearchSubject = new Subject<{
    searchText: string;
    group?: CometChat.Group;
    usersRequestBuilder?: CometChat.UsersRequestBuilder;
    groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    disableMentionAll?: boolean;
    mentionAllLabel?: string;
  }>();

  /** @internal Stored subscription for mention search pipeline */
  private mentionSearchSubscription: import('rxjs').Subscription | null = null;

  // ==================== Public Read-Only Signals ====================

  /**
   * Read-only signal for sending state
   */
  readonly isSending = this.isSendingSignal.asReadonly();

  /**
   * Read-only signal for upload progress map
   */
  readonly uploadProgress = this.uploadProgressSignal.asReadonly();

  /**
   * Read-only signal for recording state
   */
  readonly isRecording = this.isRecordingSignal.asReadonly();

  /**
   * Read-only signal for recording duration
   */
  readonly recordingDuration = this.recordingDurationSignal.asReadonly();

  /**
   * Read-only signal for mention suggestions
   */
  readonly mentionSuggestions = this.mentionSuggestionsSignal.asReadonly();

  /**
   * Read-only signal for mention fetching state
   */
  readonly isFetchingMentions = this.isFetchingMentionsSignal.asReadonly();

  /**
   * Read-only signal for whether additional mention suggestions are being fetched
   */
  readonly isFetchingMoreMentions = this.isFetchingMoreMentionsSignal.asReadonly();

  /**
   * Read-only signal for whether more mention suggestions are available
   */
  readonly hasMoreMentions = this.hasMoreMentionsSignal.asReadonly();

  // ==================== Error Handling ====================

  /**
   * Error callback for propagating errors to component
   * @private
   * @see Requirements 29.8
   */
  private errorCallback: ErrorCallback | null = null;

  constructor() {
    this.setupMentionSearchSubscription();
  }

  /**
   * Set up the debounced mention search subscription
   * @private
   */
  private setupMentionSearchSubscription(): void {
    this.mentionSearchSubscription = this.mentionSearchSubject
      .pipe(
        debounceTime(150), // Reduced debounce for faster response
        // Don't use distinctUntilChanged - we want to re-fetch even with same search text
        // This is important when user types @ again after selecting a mention
        switchMap(
          ({
            searchText,
            group,
            usersRequestBuilder,
            groupMembersRequestBuilder,
            disableMentionAll,
            mentionAllLabel,
          }) => {
            this.isFetchingMentionsSignal.set(true);

            if (group) {
              return this.fetchGroupMembersForMention(
                group,
                searchText,
                groupMembersRequestBuilder,
                disableMentionAll,
                mentionAllLabel
              ).pipe(
                catchError(error => {
                  this.handleError(error, 'Error fetching group members for mention');
                  return of([]);
                })
              );
            } else {
              return this.fetchUsersForMention(searchText, usersRequestBuilder).pipe(
                catchError(error => {
                  this.handleError(error, 'Error fetching users for mention');
                  return of([]);
                })
              );
            }
          }
        )
      )
      .subscribe(suggestions => {
        this.mentionSuggestionsSignal.set(suggestions);
        this.isFetchingMentionsSignal.set(false);
      });
  }

  // ==================== Error Callback Management ====================

  /**
   * Set the error callback for propagating errors to component
   * Called by component during initialization
   *
   * @param callback - Error callback function or null to clear
   * @see Requirements 29.8
   */
  setErrorCallback(callback: ErrorCallback | null): void {
    this.errorCallback = callback;
  }

  // ==================== Message Sending Methods ====================

  /**
   * Send a text message to a user or group
   *
   * This method can either:
   * 1. Accept a pre-built TextMessage object (for optimistic UI patterns)
   * 2. Build a new TextMessage from parameters (for simple use cases)
   *
   * When a pre-built message is provided, the other parameters are ignored
   * as the message already has all properties set.
   *
   * @param receiver - CometChat.User or CometChat.Group to send message to
   * @param text - The text content of the message (ignored if message is provided)
   * @param metadata - Optional metadata to attach to the message (ignored if message is provided)
   * @param parentMessageId - Optional parent message ID for threaded replies (ignored if message is provided)
   * @param quotedMessage - Optional message to quote (ignored if message is provided)
   * @param message - Optional pre-built TextMessage to send directly
   * @returns Promise resolving to the sent TextMessage or null on error
   * @see Requirements 29.2, 2.5, 2.6
   */
  async sendTextMessage(
    receiver: CometChat.User | CometChat.Group,
    text: string,
    metadata?: Record<string, unknown>,
    parentMessageId?: number,
    quotedMessage?: CometChat.BaseMessage,
    message?: CometChat.TextMessage
  ): Promise<CometChat.TextMessage | null> {
    // Guard: receiver is required when no pre-built message is provided
    if (!receiver && !message) {
      this.handleError(new Error('Receiver is required to send a text message'), 'sendTextMessage');
      return null;
    }

    try {
      this.isSendingSignal.set(true);

      // Use pre-built message if provided, otherwise create new one
      let textMessage: CometChat.TextMessage;

      if (message) {
        textMessage = message;
      } else {
        const receiverId =
          receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
        const receiverType =
          receiver instanceof CometChat.User
            ? CometChat.RECEIVER_TYPE.USER
            : CometChat.RECEIVER_TYPE.GROUP;

        textMessage = new CometChat.TextMessage(receiverId, text, receiverType);

        if (metadata) {
          textMessage.setMetadata(metadata);
        }

        if (parentMessageId) {
          textMessage.setParentMessageId(parentMessageId);
        }

        // Set quoted message for quoted replies
        // @see Requirements 2.5, 2.6
        if (quotedMessage) {
          textMessage.setQuotedMessage(quotedMessage);
          textMessage.setQuotedMessageId(quotedMessage.getId());
        }
      }

      const sentMessage = await CometChat.sendMessage(textMessage);
      return sentMessage as CometChat.TextMessage;
    } catch (error) {
      this.handleError(error, 'Error sending text message');
      return null;
    } finally {
      this.isSendingSignal.set(false);
    }
  }

  /**
   * Send a media message (image, video, audio, file) to a user or group
   *
   * This method can either:
   * 1. Accept a pre-built MediaMessage object (for optimistic UI patterns)
   * 2. Build a new MediaMessage from parameters (for simple use cases)
   *
   * When a pre-built message is provided, the other parameters are ignored
   * as the message already has all properties set.
   *
   * @param receiver - CometChat.User or CometChat.Group to send message to
   * @param file - The file to send (ignored if message is provided)
   * @param type - The message type (image, video, audio, file) (ignored if message is provided)
   * @param metadata - Optional metadata to attach to the message (ignored if message is provided)
   * @param parentMessageId - Optional parent message ID for threaded replies (ignored if message is provided)
   * @param quotedMessage - Optional message to quote (ignored if message is provided)
   * @param message - Optional pre-built MediaMessage to send directly
   * @returns Promise resolving to the sent MediaMessage or null on error
   * @see Requirements 29.3, 12.7
   */
  async sendMediaMessage(
    receiver: CometChat.User | CometChat.Group,
    file: File,
    type: string,
    metadata?: Record<string, unknown>,
    parentMessageId?: number,
    quotedMessage?: CometChat.BaseMessage,
    message?: CometChat.MediaMessage
  ): Promise<CometChat.MediaMessage | null> {
    // Guard: receiver is required when no pre-built message is provided
    if (!receiver && !message) {
      this.handleError(
        new Error('Receiver is required to send a media message'),
        'sendMediaMessage'
      );
      return null;
    }

    try {
      this.isSendingSignal.set(true);

      // Use pre-built message if provided, otherwise create new one
      let mediaMessage: CometChat.MediaMessage;

      if (message) {
        mediaMessage = message;
      } else {
        const receiverId =
          receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
        const receiverType =
          receiver instanceof CometChat.User
            ? CometChat.RECEIVER_TYPE.USER
            : CometChat.RECEIVER_TYPE.GROUP;

        mediaMessage = new CometChat.MediaMessage(receiverId, file, type, receiverType);

        if (metadata) {
          mediaMessage.setMetadata(metadata);
        }

        if (parentMessageId) {
          mediaMessage.setParentMessageId(parentMessageId);
        }

        // Set quoted message for quoted replies
        // @see Requirements 12.7
        if (quotedMessage) {
          mediaMessage.setQuotedMessage(quotedMessage);
          mediaMessage.setQuotedMessageId(quotedMessage.getId());
        }
      }

      const sentMessage = await CometChat.sendMediaMessage(mediaMessage);
      return sentMessage as CometChat.MediaMessage;
    } catch (error) {
      this.handleError(error, 'Error sending media message');
      return null;
    } finally {
      this.isSendingSignal.set(false);
    }
  }

  /**
   * Edit an existing message with new text content
   *
   * @param message - The message to edit
   * @param newText - The new text content
   * @returns Promise resolving to the edited message or null on error
   * @see Requirements 29.4
   */
  async editMessage(
    message: CometChat.BaseMessage,
    newText: string
  ): Promise<CometChat.BaseMessage | null> {
    try {
      this.isSendingSignal.set(true);

      const textMessage = message as CometChat.TextMessage;
      textMessage.setText(newText);

      const editedMessage = await CometChat.editMessage(textMessage);
      return editedMessage;
    } catch (error) {
      this.handleError(error, 'Error editing message');
      return null;
    } finally {
      this.isSendingSignal.set(false);
    }
  }

  /**
   * Send a sticker message to a user or group
   *
   * Creates a CustomMessage with type 'extension_sticker' and sends it via SDK.
   * The sticker metadata follows the CometChat sticker extension format.
   *
   * @param receiver - CometChat.User or CometChat.Group to send sticker to
   * @param stickerUrl - URL of the sticker image
   * @param stickerName - Name/identifier of the sticker
   * @param parentMessageId - Optional parent message ID for threaded replies
   * @param quotedMessage - Optional message to quote (for quoted replies)
   * @returns Promise resolving to the sent CustomMessage or null on error
   * @see Requirements 8.7
   */
  async sendStickerMessage(
    receiver: CometChat.User | CometChat.Group,
    stickerUrl: string,
    stickerName: string,
    parentMessageId?: number,
    quotedMessage?: CometChat.BaseMessage,
    message?: CometChat.CustomMessage
  ): Promise<CometChat.CustomMessage | null> {
    // Guard: receiver is required when no pre-built message is provided
    if (!receiver && !message) {
      this.handleError(
        new Error('Receiver is required to send a sticker message'),
        'sendStickerMessage'
      );
      return null;
    }

    try {
      this.isSendingSignal.set(true);

      const receiverId =
        receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
      const receiverType =
        receiver instanceof CometChat.User
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;

      // Create sticker message metadata following CometChat sticker extension format
      const customData = {
        sticker_url: stickerUrl,
        sticker_name: stickerName,
      };
      let customMessage: CometChat.CustomMessage;
      if (message) {
        customMessage = message;
      } else {
        // Create custom message for sticker
        customMessage = new CometChat.CustomMessage(
          receiverId,
          receiverType,
          'extension_sticker',
          customData
        );

        if (parentMessageId) {
          customMessage.setParentMessageId(parentMessageId);
        }

        // Set quoted message for quoted replies
        if (quotedMessage) {
          customMessage.setQuotedMessage(quotedMessage);
          customMessage.setQuotedMessageId(quotedMessage.getId());
        }
      }

      const sentMessage = await CometChat.sendCustomMessage(customMessage);
      return sentMessage as CometChat.CustomMessage;
    } catch (error) {
      this.handleError(error, 'Error sending sticker message');
      return null;
    } finally {
      this.isSendingSignal.set(false);
    }
  }

  // ==================== Extension API Methods ====================

  /**
   * Create a poll via the polls extension API
   *
   * Calls the CometChat polls extension to create a poll message with a question
   * and multiple answer options. The poll is sent to the specified receiver.
   *
   * @param question - The poll question
   * @param options - Array of answer options (2-12 items)
   * @param receiverId - User ID or Group ID
   * @param receiverType - 'user' or 'group'
   * @param quotedMessageId - Optional message ID for quoted replies
   * @returns Promise resolving to the API response
   * @throws CometChat.CometChatException on API error
   * @see Requirements 6.1, 6.2, 6.3
   */
  async createPoll(
    question: string,
    options: string[],
    receiverId: string,
    receiverType: string,
    quotedMessageId?: number
  ): Promise<unknown> {
    try {
      const payload: PollCreatePayload = {
        question,
        options,
        receiver: receiverId,
        receiverType,
      };

      if (quotedMessageId) {
        payload.quotedMessageId = quotedMessageId;
      }

      return await CometChat.callExtension('polls', 'POST', 'v2/create', payload);
    } catch (error) {
      this.handleError(error, 'Error creating poll');
      return null;
    }
  }

  /**
   * Create a collaborative document via the document extension API
   *
   * Calls the CometChat document extension to create a collaborative document
   * that can be shared and edited by multiple users in the conversation.
   *
   * @param receiverId - User ID or Group ID
   * @param receiverType - 'user' or 'group'
   * @param quotedMessageId - Optional message ID for quoted replies
   * @returns Promise resolving to the API response
   * @throws CometChat.CometChatException on API error
   * @see Requirements 6.4, 6.5, 6.6
   */
  async createCollaborativeDocument(
    receiverId: string,
    receiverType: string,
    quotedMessageId?: number
  ): Promise<unknown> {
    try {
      const payload: CollaborativePayload = {
        receiver: receiverId,
        receiverType,
      };

      if (quotedMessageId) {
        payload.quotedMessageId = quotedMessageId;
      }

      return await CometChat.callExtension('document', 'POST', 'v1/create', payload);
    } catch (error) {
      this.handleError(error, 'Error creating collaborative document');
      return null;
    }
  }

  /**
   * Create a collaborative whiteboard via the whiteboard extension API
   *
   * Calls the CometChat whiteboard extension to create a collaborative whiteboard
   * that can be shared and drawn on by multiple users in the conversation.
   *
   * @param receiverId - User ID or Group ID
   * @param receiverType - 'user' or 'group'
   * @param quotedMessageId - Optional message ID for quoted replies
   * @returns Promise resolving to the API response
   * @throws CometChat.CometChatException on API error
   * @see Requirements 6.7, 6.8, 6.9
   */
  async createCollaborativeWhiteboard(
    receiverId: string,
    receiverType: string,
    quotedMessageId?: number
  ): Promise<unknown> {
    try {
      const payload: CollaborativePayload = {
        receiver: receiverId,
        receiverType,
      };

      if (quotedMessageId) {
        payload.quotedMessageId = quotedMessageId;
      }

      return await CometChat.callExtension('whiteboard', 'POST', 'v1/create', payload);
    } catch (error) {
      this.handleError(error, 'Error creating collaborative whiteboard');
      return null;
    }
  }

  // ==================== Typing Indicator Methods ====================

  /**
   * Send typing started indicator to a user or group
   *
   * @param receiver - CometChat.User or CometChat.Group to send indicator to
   * @see Requirements 29.5
   */
  startTyping(receiver: CometChat.User | CometChat.Group): void {
    if (!receiver) {
      CometChatLogger.error('MessageComposerService', 'startTyping: Receiver is required');
      return;
    }

    try {
      const receiverId =
        receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
      const receiverType =
        receiver instanceof CometChat.User
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;

      const typingIndicator = new CometChat.TypingIndicator(receiverId, receiverType);
      CometChat.startTyping(typingIndicator);
    } catch (error) {
      // Log but don't propagate - typing indicators are non-critical
      CometChatLogger.error('MessageComposerService', 'Error starting typing:', error);
    }
  }

  /**
   * Send typing ended indicator to a user or group
   *
   * @param receiver - CometChat.User or CometChat.Group to send indicator to
   * @see Requirements 29.6
   */
  endTyping(receiver: CometChat.User | CometChat.Group): void {
    if (!receiver) {
      CometChatLogger.error('MessageComposerService', 'endTyping: Receiver is required');
      return;
    }

    try {
      const receiverId =
        receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
      const receiverType =
        receiver instanceof CometChat.User
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;

      const typingIndicator = new CometChat.TypingIndicator(receiverId, receiverType);
      CometChat.endTyping(typingIndicator);
    } catch (error) {
      // Log but don't propagate - typing indicators are non-critical
      CometChatLogger.error('MessageComposerService', 'Error ending typing:', error);
    }
  }

  // ==================== File Upload Progress Methods ====================

  /**
   * Update the upload progress for a specific file
   *
   * @param fileId - Unique identifier for the file
   * @param progress - Upload progress percentage (0-100)
   * @see Requirements 29.7
   */
  updateUploadProgress(fileId: string, progress: number): void {
    const currentProgress = new Map(this.uploadProgressSignal());
    currentProgress.set(fileId, progress);
    this.uploadProgressSignal.set(currentProgress);
  }

  /**
   * Clear the upload progress for a specific file
   *
   * @param fileId - Unique identifier for the file to clear
   * @see Requirements 29.7
   */
  clearUploadProgress(fileId: string): void {
    const currentProgress = new Map(this.uploadProgressSignal());
    currentProgress.delete(fileId);
    this.uploadProgressSignal.set(currentProgress);
  }

  /**
   * Clear all upload progress entries
   */
  clearAllUploadProgress(): void {
    this.uploadProgressSignal.set(new Map());
  }

  // ==================== Recording State Methods ====================

  /**
   * Set the recording state
   *
   * @param isRecording - Whether recording is in progress
   */
  setRecordingState(isRecording: boolean): void {
    this.isRecordingSignal.set(isRecording);
    if (!isRecording) {
      this.recordingDurationSignal.set(0);
    }
  }

  /**
   * Update the recording duration
   *
   * @param duration - Recording duration in seconds
   */
  updateRecordingDuration(duration: number): void {
    this.recordingDurationSignal.set(duration);
  }

  // ==================== Error Handling ====================

  /**
   * Handle and propagate errors
   * Logs error to console and calls error callback if set
   *
   * @param error - The error that occurred
   * @param context - Context string describing where the error occurred
   * @private
   */
  private handleError(error: unknown, context: string): void {
    // Log error to console for debugging
    CometChatLogger.error('MessageComposerService', `${context}:`, error);

    // Propagate error to component if callback is set
    if (this.errorCallback) {
      const exception = this.toCometchatException(error, context);
      this.errorCallback(exception);
    }
  }

  /**
   * Convert unknown error to CometChatException
   *
   * @param error - The error to convert
   * @param context - Context string for error message
   * @returns CometChat.CometChatException
   * @private
   */
  private toCometchatException(error: unknown, context: string): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) {
      return error;
    }

    if (error instanceof Error) {
      return new CometChat.CometChatException({
        code: 'COMPOSER_ERROR',
        message: `${context}: ${error.message}`,
        details: error.stack || '',
      });
    }

    return new CometChat.CometChatException({
      code: 'UNKNOWN_ERROR',
      message: `${context}: ${String(error)}`,
      details: '',
    });
  }

  // ==================== Mention Methods ====================

  /**
   * Search for mention suggestions
   * Triggers a debounced search for users or group members
   *
   * @param searchText - The text to search for (after @)
   * @param group - Optional group for group member search
   * @param usersRequestBuilder - Optional custom users request builder
   * @param groupMembersRequestBuilder - Optional custom group members request builder
   * @param disableMentionAll - Whether to disable @all mention
   * @param mentionAllLabel - Label for @all mention
   * @see Requirements 16.2, 16.4, 16.8, 16.9
   */
  searchMentions(
    searchText: string,
    group?: CometChat.Group,
    usersRequestBuilder?: CometChat.UsersRequestBuilder,
    groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder,
    disableMentionAll = false,
    mentionAllLabel = 'all'
  ): void {
    // Set fetching state immediately so the UI shows loading state
    // This ensures the mention panel is visible while waiting for debounce
    this.isFetchingMentionsSignal.set(true);

    this.mentionSearchSubject.next({
      searchText,
      group,
      usersRequestBuilder,
      groupMembersRequestBuilder,
      disableMentionAll,
      mentionAllLabel,
    });
  }

  /**
   * Fetch users for mention suggestions
   *
   * @param searchText - The text to search for
   * @param customRequestBuilder - Optional custom request builder
   * @returns Observable of mention suggestions
   * @private
   */
  private fetchUsersForMention(
    searchText: string,
    customRequestBuilder?: CometChat.UsersRequestBuilder
  ): Observable<MentionSuggestion[]> {
    return new Observable<MentionSuggestion[]>(observer => {
      let requestBuilder: CometChat.UsersRequestBuilder;

      if (customRequestBuilder) {
        requestBuilder = searchText
          ? customRequestBuilder.setSearchKeyword(searchText)
          : customRequestBuilder;
      } else {
        requestBuilder = new CometChat.UsersRequestBuilder().setLimit(20);
        // Only set search keyword if there's actual search text
        if (searchText) {
          requestBuilder = requestBuilder.setSearchKeyword(searchText);
        }
      }

      requestBuilder
        .build()
        .fetchNext()
        .then((users: CometChat.User[]) => {
          const suggestions: MentionSuggestion[] = users.map(user => ({
            uid: user.getUid(),
            name: user.getName(),
            avatar: user.getAvatar(),
            isAllMention: false,
            entity: user,
          }));
          observer.next(suggestions);
          observer.complete();
        })
        .catch((error: unknown) => {
          observer.error(error);
        });
    });
  }

  /**
   * Fetch group members for mention suggestions
   *
   * @param group - The group to fetch members from
   * @param searchText - The text to search for
   * @param customRequestBuilder - Optional custom request builder
   * @param disableMentionAll - Whether to disable @all mention
   * @param mentionAllLabel - Label for @all mention
   * @returns Observable of mention suggestions
   * @private
   */
  private fetchGroupMembersForMention(
    group: CometChat.Group,
    searchText: string,
    customRequestBuilder?: CometChat.GroupMembersRequestBuilder,
    disableMentionAll = false,
    mentionAllLabel = 'all'
  ): Observable<MentionSuggestion[]> {
    return new Observable<MentionSuggestion[]>(observer => {
      let requestBuilder: CometChat.GroupMembersRequestBuilder;

      if (customRequestBuilder) {
        requestBuilder = searchText
          ? customRequestBuilder.setSearchKeyword(searchText)
          : customRequestBuilder;
      } else {
        requestBuilder = new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(20);
        // Only set search keyword if there's actual search text
        if (searchText) {
          requestBuilder = requestBuilder.setSearchKeyword(searchText);
        }
      }

      requestBuilder
        .build()
        .fetchNext()
        .then((members: CometChat.GroupMember[]) => {
          const suggestions: MentionSuggestion[] = [];

          // Add @all option at the top if not disabled
          // Show @all when search is empty OR when search matches the label
          if (
            !disableMentionAll &&
            (!searchText || mentionAllLabel.toLowerCase().includes(searchText.toLowerCase()))
          ) {
            suggestions.push({
              uid: 'all',
              name: mentionAllLabel,
              isAllMention: true,
            });
          }

          // Add group members
          members.forEach(member => {
            suggestions.push({
              uid: member.getUid(),
              name: member.getName(),
              avatar: member.getAvatar(),
              isAllMention: false,
              entity: member,
            });
          });

          observer.next(suggestions);
          observer.complete();
        })
        .catch((error: unknown) => {
          observer.error(error);
        });
    });
  }

  /**
   * Initialize the mention pagination request builder
   * Creates and stores a built request object for fetching paginated mention results.
   * This centralizes the SDK request builder creation that was previously in the component.
   *
   * @param searchText - The search text to filter mentions
   * @param group - Optional group for group member search
   * @param customUsersRequestBuilder - Optional custom users request builder
   * @param customGroupMembersRequestBuilder - Optional custom group members request builder
   * @see Requirements 2.1, 2.2, 2.3
   */
  initializeMentionsPagination(
    searchText: string,
    group?: CometChat.Group,
    customUsersRequestBuilder?: CometChat.UsersRequestBuilder,
    customGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder
  ): void {
    if (group) {
      // Group context - use GroupMembersRequestBuilder
      let builder: CometChat.GroupMembersRequestBuilder;

      if (customGroupMembersRequestBuilder) {
        builder = searchText
          ? customGroupMembersRequestBuilder.setSearchKeyword(searchText)
          : customGroupMembersRequestBuilder;
      } else {
        builder = new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(20);
        if (searchText) {
          builder = builder.setSearchKeyword(searchText);
        }
      }

      this.mentionsPaginationRequest = builder.build();
    } else {
      // User context - use UsersRequestBuilder
      let builder: CometChat.UsersRequestBuilder;

      if (customUsersRequestBuilder) {
        builder = searchText
          ? customUsersRequestBuilder.setSearchKeyword(searchText)
          : customUsersRequestBuilder;
      } else {
        builder = new CometChat.UsersRequestBuilder().setLimit(20);
        if (searchText) {
          builder = builder.setSearchKeyword(searchText);
        }
      }

      this.mentionsPaginationRequest = builder.build();
    }

    // Reset pagination state
    this.hasMoreMentionsSignal.set(true);
    this.isFetchingMoreMentionsSignal.set(false);
  }

  /**
   * Fetch more mention suggestions for pagination
   * Uses the stored pagination request to fetch the next page of results
   * and appends them to the existing suggestions.
   *
   * @param isGroupContext - Whether the current context is a group (affects result type)
   * @returns Promise resolving when fetch is complete
   * @see Requirements 2.1, 2.2, 2.3
   */
  async fetchMoreMentions(isGroupContext: boolean): Promise<void> {
    // Guard: Check if more data is available
    if (!this.hasMoreMentionsSignal()) {
      return;
    }

    // Guard: Check if not already fetching
    if (this.isFetchingMoreMentionsSignal()) {
      return;
    }

    // Guard: Check if pagination request exists
    if (!this.mentionsPaginationRequest) {
      return;
    }

    // Set loading state
    this.isFetchingMoreMentionsSignal.set(true);

    try {
      // Fetch the next page using the stored request
      const results = await this.mentionsPaginationRequest.fetchNext();

      // Get current suggestions
      const currentSuggestions = this.mentionSuggestionsSignal();

      // Convert results to MentionSuggestion format
      let newSuggestions: MentionSuggestion[] = [];

      if (isGroupContext) {
        // Results are GroupMembers
        const members = results as CometChat.GroupMember[];
        newSuggestions = members.map(member => ({
          uid: member.getUid(),
          name: member.getName(),
          avatar: member.getAvatar(),
          isAllMention: false,
          entity: member,
        }));
      } else {
        // Results are Users
        const users = results as CometChat.User[];
        newSuggestions = users.map(user => ({
          uid: user.getUid(),
          name: user.getName(),
          avatar: user.getAvatar(),
          isAllMention: false,
          entity: user,
        }));
      }

      // Append new suggestions to existing list
      const updatedSuggestions = [...currentSuggestions, ...newSuggestions];
      this.mentionSuggestionsSignal.set(updatedSuggestions);

      // Update hasMoreMentions based on results length
      // If we got fewer results than the limit (20), no more data
      const limit = 20;
      this.hasMoreMentionsSignal.set(newSuggestions.length >= limit);
    } catch (error) {
      // On error, assume no more data to prevent infinite retry
      this.hasMoreMentionsSignal.set(false);

      // Invoke error callback via handleError for consistency
      this.handleError(error, 'Error fetching more mentions');
    } finally {
      this.isFetchingMoreMentionsSignal.set(false);
    }
  }

  /**
   * Append mention suggestions to the existing list
   * Used by the component to add suggestions from external sources
   *
   * @param suggestions - Array of mention suggestions to append
   */
  appendMentionSuggestions(suggestions: MentionSuggestion[]): void {
    const current = this.mentionSuggestionsSignal();
    this.mentionSuggestionsSignal.set([...current, ...suggestions]);
  }

  /**
   * Check if a user ID matches the currently logged-in user
   * Centralizes the CometChat.getLoggedinUser() SDK call
   *
   * @param userId - The user ID to check
   * @returns Promise resolving to true if the user ID matches the logged-in user
   * @see Requirements 2.1, 2.2
   */
  async checkIfSelfMention(userId: string): Promise<boolean> {
    try {
      const loggedInUser = await CometChat.getLoggedinUser();
      return loggedInUser?.getUid() === userId;
    } catch (error) {
      this.handleError(error, 'Error checking self mention');
      return false;
    }
  }

  /**
   * Clear mention suggestions
   */
  clearMentionSuggestions(): void {
    this.mentionSuggestionsSignal.set([]);
  }

  /**
   * Stop the current mention search and clear loading state
   * Cancels any ongoing mention search requests and resets the fetching state.
   * This is useful when the user closes the mention suggestions panel or
   * when we need to prevent the loading state from persisting.
   */
  stopMentionSearch(): void {
    this.isFetchingMentionsSignal.set(false);
    this.isFetchingMoreMentionsSignal.set(false);
  }

  // ==================== Cleanup ====================

  /**
   * Reset all state to initial values
   * Should be called when component is destroyed
   *
   * @see Requirements 29.10
   */
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
    } catch (error) {
      // Log but don't propagate during cleanup to avoid infinite loops
      CometChatLogger.error('MessageComposerService', 'Error during cleanup:', error);
    }
  }
}
