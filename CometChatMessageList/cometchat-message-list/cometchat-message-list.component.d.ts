import { ChangeDetectorRef, ElementRef, NgZone, OnChanges, OnDestroy, OnInit, QueryList, SimpleChanges, TemplateRef } from "@angular/core";
import { AvatarStyle, BackdropStyle, BaseStyle, CallscreenStyle, ConfirmDialogStyle, DateStyle, DocumentBubbleStyle, EmojiKeyboardStyle, FullScreenViewerStyle, MenuListStyle, PanelStyle, ReceiptStyle } from "@cometchat/uikit-elements";
import { CardBubbleStyle, FormBubbleStyle, ImageModerationStyle, MessageInformationConfiguration, MessageListStyle, MessageTranslationStyle, PollsBubbleStyle, SchedulerBubbleStyle, SmartRepliesConfiguration, SmartRepliesStyle, ReactionsStyle, ReactionListConfiguration, ReactionInfoConfiguration, ReactionsConfiguration, CometChatTextFormatter } from "@cometchat/uikit-shared";
import { CometChatMessageOption, CometChatMessageTemplate, CometChatTheme, CometChatUIKitConstants, DatePatterns, DocumentIconAlignment, MessageBubbleAlignment, MessageListAlignment, SchedulerMessage, States, TimestampAlignment, localize } from "@cometchat/uikit-resources";
import { LinkPreviewStyle } from "@cometchat/uikit-shared";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { Subscription } from "rxjs";
import * as i0 from "@angular/core";
/**
 *
 * CometChatMessageList is a wrapper component for messageBubble
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export declare class CometChatMessageListComponent implements OnInit, OnDestroy, OnChanges {
    private ngZone;
    private ref;
    private themeService;
    listScroll: ElementRef;
    bottom: ElementRef;
    top: ElementRef;
    textBubble: TemplateRef<any>;
    threadMessageBubble: TemplateRef<any>;
    fileBubble: TemplateRef<any>;
    audioBubble: TemplateRef<any>;
    videoBubble: TemplateRef<any>;
    imageBubble: TemplateRef<any>;
    formBubble: TemplateRef<any>;
    cardBubble: TemplateRef<any>;
    stickerBubble: TemplateRef<any>;
    documentBubble: TemplateRef<any>;
    whiteboardBubble: TemplateRef<any>;
    popoverRef: any;
    directCalling: TemplateRef<any>;
    schedulerBubble: TemplateRef<any>;
    pollBubble: TemplateRef<any>;
    messageBubbleRef: QueryList<ElementRef>;
    hideError: boolean;
    errorStateView: TemplateRef<any>;
    loadingStateView: TemplateRef<any>;
    emptyStateView: TemplateRef<any>;
    errorStateText: string;
    emptyStateText: string;
    loadingIconURL: string;
    user: CometChat.User;
    group: CometChat.Group;
    disableReceipt: boolean;
    disableSoundForMessages: boolean;
    customSoundForMessages: string;
    readIcon: string;
    deliveredIcon: string;
    sentIcon: string;
    waitIcon: string;
    errorIcon: string;
    aiErrorIcon: string;
    aiEmptyIcon: string;
    alignment: MessageListAlignment;
    showAvatar: boolean;
    datePattern: DatePatterns;
    timestampAlignment: TimestampAlignment;
    DateSeparatorPattern: DatePatterns;
    templates: CometChatMessageTemplate[];
    messagesRequestBuilder: CometChat.MessagesRequestBuilder;
    newMessageIndicatorText: string;
    scrollToBottomOnNewMessages: boolean;
    thresholdValue: number;
    unreadMessageThreshold: number;
    reactionsConfiguration: ReactionsConfiguration;
    disableReactions: Boolean;
    emojiKeyboardStyle: EmojiKeyboardStyle;
    apiConfiguration?: (user?: CometChat.User, group?: CometChat.Group) => Promise<Object>;
    onThreadRepliesClick: ((message: CometChat.BaseMessage, view: TemplateRef<any>) => void) | null;
    headerView: TemplateRef<any>;
    footerView: TemplateRef<any>;
    parentMessageId: number;
    threadIndicatorIcon: string;
    avatarStyle: AvatarStyle;
    backdropStyle: BackdropStyle;
    dateSeparatorStyle: DateStyle;
    messageListStyle: MessageListStyle;
    onError: ((error: CometChat.CometChatException) => void) | null;
    messageInformationConfiguration: MessageInformationConfiguration;
    disableMentions: boolean;
    state: States;
    optionsStyle: MenuListStyle;
    receiptStyle: ReceiptStyle;
    documentBubbleAlignment: DocumentIconAlignment;
    callBubbleAlignment: DocumentIconAlignment;
    imageModerationStyle: ImageModerationStyle;
    timestampEnum: typeof TimestampAlignment;
    chatChanged: boolean;
    starterErrorStateText: string;
    starterEmptyStateText: string;
    starterLoadingStateText: string;
    summaryErrorStateText: string;
    summaryEmptyStateText: string;
    summaryLoadingStateText: string;
    requestBuilder: any;
    closeImageModeration: any;
    timeStampColor: string;
    timeStampFont: string;
    smartReplyStyle: SmartRepliesStyle;
    conversationStarterStyle: SmartRepliesStyle;
    conversationSummaryStyle: PanelStyle;
    showSmartReply: boolean;
    enableConversationStarter: boolean;
    showConversationStarter: boolean;
    conversationStarterState: States;
    conversationStarterReplies: string[];
    enableConversationSummary: boolean;
    showConversationSummary: boolean;
    conversationSummaryState: States;
    conversationSummary: string[];
    getUnreadCount: any;
    ccHidePanel: Subscription;
    ccShowPanel: Subscription;
    smartReplyMessage: CometChat.BaseMessage | null;
    enableSmartReply: boolean;
    smartReplyConfig: SmartRepliesConfiguration;
    timeStampBackground: string;
    linkPreviewStyle: LinkPreviewStyle;
    unreadMessagesStyle: {};
    modalStyle: {
        height: string;
        width: string;
        closeIconTint: string;
    };
    dividerStyle: BaseStyle;
    pollBubbleStyle: PollsBubbleStyle;
    labelStyle: any;
    imageBubbleStyle: any;
    messagesList: CometChat.BaseMessage[];
    bubbleDateStyle: DateStyle;
    whiteboardIconURL: string;
    documentIconURL: string;
    directCallIconURL: string;
    placeholderIconURL: string;
    downloadIconURL: string;
    translationStyle: MessageTranslationStyle;
    documentBubbleStyle: DocumentBubbleStyle;
    callBubbleStyle: DocumentBubbleStyle;
    whiteboardTitle: string;
    whiteboardSubitle: string;
    whiteboardButtonText: string;
    documentTitle: string;
    documentSubitle: string;
    documentButtonText: string;
    joinCallButtonText: string;
    topObserver: IntersectionObserver;
    bottomObserver: IntersectionObserver;
    localize: typeof localize;
    reinitialized: boolean;
    addReactionIconURL: string;
    MessageTypesConstant: typeof CometChatUIKitConstants.MessageTypes;
    callConstant: string;
    typesMap: any;
    messageTypesMap: any;
    theme: CometChatTheme;
    groupListenerId: string;
    callListenerId: string;
    loggedInUser: CometChat.User;
    states: typeof States;
    MessageCategory: Readonly<{
        message: string;
        custom: string;
        action: string;
        call: string;
        interactive: string;
    }>;
    numberOfTopScroll: number;
    keepRecentMessages: boolean;
    messageTemplate: CometChatMessageTemplate[];
    openContactsView: boolean;
    messageCount: number;
    isOnBottom: boolean;
    UnreadCount: CometChat.BaseMessage[];
    newMessageCount: number | string;
    type: string;
    confirmText: string;
    cancelText: string;
    warningText: string;
    ccMessageDelete: Subscription;
    ccMessageReact: Subscription;
    ccMessageRead: Subscription;
    ccMessageEdit: Subscription;
    ccLiveReaction: Subscription;
    ccMessageSent: Subscription;
    ccMessageEdited: Subscription;
    ccGroupMemberAdded: Subscription;
    ccGroupLeft: Subscription;
    ccGroupMemberJoined: Subscription;
    ccGroupMemberKicked: Subscription;
    ccGroupMemberBanned: Subscription;
    ccOwnershipChanged: Subscription;
    ccGroupDeleted: Subscription;
    ccGroupCreated: Subscription;
    ccOutgoingCall: Subscription;
    ccCallRejected: Subscription;
    ccCallEnded: Subscription;
    ccCallAccepted: Subscription;
    ccGroupMemberScopeChanged: Subscription;
    onTextMessageReceived: Subscription;
    onMessageReactionAdded: Subscription;
    onMessageReactionRemoved: Subscription;
    onCustomMessageReceived: Subscription;
    onFormMessageReceived: Subscription;
    onSchedulerMessageReceived: Subscription;
    onCardMessageReceived: Subscription;
    onCustomInteractiveMessageReceived: Subscription;
    onMediaMessageReceived: Subscription;
    onMessagesDelivered: Subscription;
    onMessagesRead: Subscription;
    onMessageDeleted: Subscription;
    onMessageEdited: Subscription;
    onTransientMessageReceived: Subscription;
    onInteractionGoalCompleted: Subscription;
    threadedAlignment: MessageBubbleAlignment;
    messageInfoAlignment: MessageBubbleAlignment;
    openEmojiKeyboard: boolean;
    keyboardAlignment: string;
    popoverStyle: any;
    videoBubbleStyle: BaseStyle;
    threadViewAlignment: MessageBubbleAlignment;
    whiteboardURL: string | URL | undefined;
    enableDataMasking: boolean;
    enableThumbnailGeneration: boolean;
    enableLinkPreview: boolean;
    enablePolls: boolean;
    enableReactions: boolean;
    enableImageModeration: boolean;
    enableStickers: boolean;
    enableWhiteboard: boolean;
    enableDocument: boolean;
    showOngoingCall: boolean;
    enableCalling: boolean;
    ongoingCallStyle: CallscreenStyle;
    sessionId: string;
    openMessageInfoPage: boolean;
    messageInfoObject: CometChat.BaseMessage;
    firstReload: boolean;
    isWebsocketReconnected: boolean;
    connectionListenerId: string;
    lastMessageId: number;
    isConnectionReestablished: boolean;
    textFormatters?: Array<CometChatTextFormatter>;
    closeIconURL: string;
    threadOpenIcon: string;
    confirmDialogStyle: ConfirmDialogStyle;
    messageToReact: CometChat.BaseMessage | null;
    limit: number;
    types: string[];
    categories: string[];
    constructor(ngZone: NgZone, ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    sendMessage(message: CometChat.BaseMessage, receiverId: string, receiverType: string): Promise<unknown>;
    closeContactsPage: () => void;
    addReaction: (event: any) => void;
    getCallBubbleTitle(message: CometChat.BaseMessage): any;
    getCallActionMessage: (call: CometChat.Call) => string;
    ngOnDestroy(): void;
    /**
     * Creates a new ReactionsStyle object with the defined or default styles.
     *
     * @returns {ReactionsStyle} Returns an instance of ReactionsStyle with the set or default styles.
     */
    getReactionsStyle(): ReactionsStyle;
    isMobileView: () => boolean;
    getBubbleById(id: string): ElementRef | undefined;
    showEmojiKeyboard: (id: number, event: any) => void;
    setBubbleView: () => void;
    openThreadView: (message: CometChat.BaseMessage) => void;
    threadCallback: (id: number) => void;
    deleteCallback: (id: number) => void;
    editCallback: (id: number) => void;
    copyCallback: (id: number) => void;
    messagePrivatelyCallback: (id: number) => void;
    messageInfoCallback: (id: number) => void;
    openMessageInfo(messageObject: CometChat.BaseMessage): void;
    closeMessageInfoPage: () => void;
    sendMessagePrivately(messageObject: CometChat.BaseMessage): void;
    getMessageById(id: number | string): false | import("@cometchat/chat-sdk-javascript").BaseMessage;
    isTranslated(message: CometChat.TextMessage): any;
    updateTranslatedMessage: (translation: any) => void;
    translateMessage: (id: number) => void;
    setOptionsCallback(options: CometChatMessageOption[], id: number): CometChatMessageOption[];
    /**
     * send message options based on type
     * @param  {CometChat.BaseMessage} msgObject
     */
    setMessageOptions(msgObject: CometChat.BaseMessage): CometChatMessageOption[];
    /**
     * Reacts to a message by either adding or removing the reaction.
     *
     * @param {string} emoji - The emoji used for the reaction.
     * @param {CometChat.BaseMessage} message - The message that was reacted to.
     */
    reactToMessage(emoji: string, message: CometChat.BaseMessage): void;
    /**
     * Filters out the 'add reaction' option if reactions are disabled.
     *
     * @param {CometChatMessageOption[]} options - The original set of message options.
     * @returns {CometChatMessageOption[]} The filtered set of message options.
     */
    filterEmojiOptions: (options: CometChatMessageOption[]) => CometChatMessageOption[];
    getClonedReactionObject(message: CometChat.BaseMessage): import("@cometchat/chat-sdk-javascript").BaseMessage;
    /**
     * passing style based on message object
     * @param  {CometChat.BaseMessage} messageObject
     */
    setMessageBubbleStyle(msg: CometChat.BaseMessage): BaseStyle;
    getSessionId(message: CometChat.CustomMessage): any;
    getWhiteboardDocument(message: CometChat.CustomMessage): any;
    openLinkURL(event: any): void;
    getSticker(message: CometChat.CustomMessage): any;
    /**
     * Checks if the 'statusInfoView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getContentView: (message: CometChat.BaseMessage) => TemplateRef<any> | null;
    /**
     * Checks if the 'headerView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getHeaderView(message: CometChat.BaseMessage): TemplateRef<any> | null;
    /**
     * Checks if the 'footerView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getFooterView(message: CometChat.BaseMessage): TemplateRef<any> | null;
    /**
     * Checks if the 'bottomView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getBottomView(message: CometChat.BaseMessage): TemplateRef<any> | null;
    /**
     * Checks if the 'statusInfoView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getStatusInfoView(message: CometChat.BaseMessage): TemplateRef<any> | null;
    isAudioOrVideoMessage(message: CometChat.BaseMessage): boolean;
    setBubbleAlignment: (message: CometChat.BaseMessage) => MessageBubbleAlignment;
    getFormMessageBubbleStyle(): FormBubbleStyle;
    getCardMessageBubbleStyle(): CardBubbleStyle;
    getCallBubbleStyle(message: CometChat.BaseMessage): {
        titleFont: string;
        titleColor: string | undefined;
        iconTint: string | undefined;
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        buttonBackground: string | undefined;
        width: string;
    };
    getBubbleWrapper: (message: CometChat.BaseMessage) => TemplateRef<any> | null;
    getBubbleAlignment(message: CometChat.BaseMessage): MessageBubbleAlignment.left | MessageBubbleAlignment.right;
    setTranslationStyle: (message: CometChat.BaseMessage) => MessageTranslationStyle;
    getCallTypeIcon(message: CometChat.BaseMessage): "assets/Audio-Call.svg" | "assets/Video-call.svg";
    callStatusStyle(message: CometChat.BaseMessage): {
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        borderRadius: string;
        border: string;
        buttonIconTint: string | undefined;
        background: string;
        iconBackground: string;
        padding: string;
        gap: string;
        height: string;
        justifyContent: string;
    } | null;
    setTextBubbleStyle: (message: CometChat.BaseMessage) => {
        textFont: string;
        textColor: string | undefined;
        bubblePadding: string;
    } | {
        textFont: string;
        textColor: string | undefined;
        bubblePadding?: undefined;
    };
    setFileBubbleStyle(message: CometChat.BaseMessage): any;
    ngAfterViewInit(): void;
    startDirectCall: (sessionId: string) => void;
    launchCollaborativeWhiteboardDocument: (url: string) => void;
    /**
     * Extracting  types and categories from template
     *
     */
    checkMessageTemplate(): void;
    getPollBubbleData(message: CometChat.CustomMessage, type?: string): any;
    getThreadCount(message: CometChat.BaseMessage): string;
    showEnabledExtensions(): void;
    openConfirmDialog: boolean;
    openFullscreenView: boolean;
    imageurlToOpen: string;
    fullScreenViewerStyle: FullScreenViewerStyle;
    openImageInFullScreen(message: any): void;
    closeImageInFullScreen(): void;
    openWarningDialog(event: any): void;
    onConfirmClick: () => void;
    onCancelClick(): void;
    getTextMessage(message: CometChat.TextMessage): string;
    getLinkPreview(message: CometChat.TextMessage): any;
    getImageThumbnail(msg: CometChat.MediaMessage): string;
    getLinkPreviewDetails(key: string, message: CometChat.TextMessage): string;
    ngOnInit(): void;
    setOngoingCallStyle: () => void;
    setAvatarStyle(): void;
    setDateStyle(): void;
    setMessagesStyle(): void;
    getReceiptStyle(message: CometChat.BaseMessage): {
        waitIconTint?: string | undefined;
        sentIconTint?: string | undefined;
        deliveredIconTint?: string | undefined;
        readIconTint?: string | undefined;
        errorIconTint?: string | undefined;
        height?: string | undefined;
        width?: string | undefined;
        border?: string | undefined;
        borderRadius?: string | undefined;
        background?: string | undefined;
    };
    createRequestBuilder(): void;
    computeUnreadCount(): void;
    /**
     * Listener To Receive Messages in Real Time
     * @param
     */
    fetchPreviousMessages: () => void;
    fetchActionMessages(): void;
    fetchNextMessage: () => void;
    appendMessages: (messages: CometChat.BaseMessage[]) => void;
    attachConnectionListener(): void;
    addMessageEventListeners(): void;
    /**
     *
     * @param
     */
    /**
     * Updates messageList on basis of user activity or group activity or calling activity
     * @param  {any=null} key
     * @param  {CometChat.MessageReceipt | CometChat.BaseMessage} message
     * @param  {CometChat.Group | null=null} group
     * @param  {any=null} options
     */
    messageUpdate(key?: string | null, message?: CometChat.MessageReceipt | CometChat.BaseMessage | any, group?: CometChat.Group | null, options?: any): void;
    /**
     * Updates a message's reactions based on a new reaction.
     *
     * @param {CometChat.ReactionEvent} message - The new message reaction.
     * @param {boolean} isAdded - True if the reaction was added, false if it was removed.
     * @returns {boolean} Returns false if the message was not found, true otherwise.
     */
    onReactionUpdated(message: CometChat.ReactionEvent, isAdded: boolean): boolean;
    /**
     * translate message then call update message
     * @param  {CometChat.BaseMessage} message
     */
    /**
     * @param  {CometChat.BaseMessage} message
     */
    markMessageAsDelivered: (message: CometChat.BaseMessage) => void;
    /**
     * When Message is Received
     * @param message
     */
    /**
     * @param  {CometChat.BaseMessage} message
     */
    messageReceived(message: CometChat.BaseMessage): void;
    /**
     * Updating the reply count of Thread Parent Message
     * @param  {CometChat.BaseMessage} messages
     */
    updateReplyCount(messages: CometChat.BaseMessage): void;
    /**
     * @param  {CometChat.BaseMessage} message
     * @param  {string} type
     */
    messageReceivedHandler: (message: CometChat.BaseMessage) => void;
    playAudio(): void;
    getCallBuilder: () => any;
    reInitializeMessageList(): void;
    reInitializeMessageBuilder: () => void;
    getMessageReceipt(message: CometChat.BaseMessage): import("@cometchat/uikit-shared/dist/Utils/MessageReceiptUtils").receipts;
    messageReadAndDelivered(message: CometChat.MessageReceipt): void;
    /**
     * @param  {CometChat.BaseMessage} readMessage
     */
    markAllMessagAsRead(messageKey: number): void;
    markAllMessagAsDelivered(messageKey: number): void;
    /**
     * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
     * @param {CometChat.BaseMessage} message
     */
    /**
     * Detects if the message that was edit is your current open conversation window
     * @param {CometChat.BaseMessage} message
     */
    messageEdited: (message: CometChat.BaseMessage) => void;
    updateInteractiveMessage: (receipt: CometChat.InteractionReceipt) => void;
    /**
     * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
     * @param {CometChat.BaseMessage} message
     */
    updateEditedMessage: (message: CometChat.BaseMessage) => void;
    /**
     * Emits an Action Indicating that Group Data has been updated
     * @param
     */
    /**
     * When custom messages are received eg. Poll, Stickers emits action to update message list
     * @param message
     */
    /**
     * @param  {CometChat.BaseMessage} message
     */
    customMessageReceived(message: CometChat.BaseMessage): any;
    /**
     * @param  {CometChat.BaseMessage} message
     * @param  {string} type
     */
    customMessageReceivedHandler: (message: CometChat.BaseMessage) => void;
    /**
     * Compares two dates and sets Date on a a new day
     */
    /**
     * @param  {number} firstDate
     * @param  {number} secondDate
     */
    isDateDifferent(firstDate: number | undefined, secondDate: number | undefined): boolean;
    /**
     * Returns formatters for the text bubbles
     *
     * @param {CometChat.BaseMessage} message
     * @returns
     */
    getTextFormatters: (message: CometChat.BaseMessage) => CometChatTextFormatter[];
    /**
     * prepend Fetched Messages
     * @param {CometChat.BaseMessage} messages
     */
    prependMessages(messages: CometChat.BaseMessage[]): void;
    /**
     * listening to bottom scroll using intersection observer
     */
    ioBottom(): void;
    /**
     * listening to top scroll using intersection observer
     */
    ioTop(): void;
    addMessage: (message: CometChat.BaseMessage) => void;
    /**
     * callback for copy message
     * @param  {CometChat.TextMessage} object
     */
    onCopyMessage: (object: CometChat.TextMessage) => void;
    /**
     * This is to ensure that the uid doesn't get copied when clicking on the copy option.
     * This function changes the uid regex to '@userName' without formatting
     *
     * @param {CometChat.TextMessage} message
     * @returns
     */
    getMentionsTextWithoutStyle(message: CometChat.TextMessage): string;
    /**
     * callback for deleteMessage
     * @param  {CometChat.BaseMessage} object
     */
    /**
     * @param  {CometChat.BaseMessage} messages
     */
    messageSent(messages: CometChat.BaseMessage): void;
    /**
     * callback for editMessage option
     * @param  {CometChat.BaseMessage} object
     */
    onEditMessage: (object: CometChat.BaseMessage) => void;
    updateMessage(message: CometChat.BaseMessage, muid?: boolean): void;
    removeMessage: (message: CometChat.BaseMessage) => void;
    /**
     * Returns the style configuration for the thread view of a message.
     *
     * @param {CometChat.BaseMessage} message - The message that the style configuration is for.
     * @returns {Object} The style configuration object.
     */
    getThreadViewStyle(message: CometChat.BaseMessage): {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        buttonIconTint: string | undefined;
        display: string;
        flexFlow: string;
        alignItems: string;
        buttonTextColor: string | undefined;
        buttonTextFont: string | undefined;
        iconHeight: string;
        iconWidth: string;
        gap: string;
    };
    /**
     * Checks if a message was sent by the currently logged in user.
     *
     * @param {CometChat.BaseMessage} message - The message to check.
     * @returns {boolean} Returns true if the message is sent by the logged in user, false otherwise.
     */
    isSentByMe(message: CometChat.BaseMessage): boolean;
    deleteMessage: (message: CometChat.BaseMessage) => void;
    scrollToBottom: () => void;
    showHeaderTitle(message: CometChat.BaseMessage): boolean;
    /**
     * Updates the count of unread reply messages for a given message.
     *
     * @param {CometChat.BaseMessage} message - The message for which the reply count is being updated.
     */
    updateUnreadReplyCount: (message: CometChat.BaseMessage) => void;
    /**
     * Method to subscribe  the required Rxjs events when the CometChatMessageListComponent loads
     */
    subscribeToEvents(): void;
    closeSmartReply: () => void;
    closeConversationSummary: () => void;
    showStatusInfo(message: CometChat.BaseMessage): boolean;
    sendReply: (event: any) => void;
    sendConversationStarter: (event: any) => void;
    fetchConversationStarter(): void;
    fetchConversationSummary(): string[];
    getReplies(): string[] | null;
    /**
     * Method to unsubscribe all the Rxjs events when the CometChatMessageListComponent gets destroy
     */
    unsubscribeToEvents(): void;
    /**
     * Returns the appropriate thread icon based on the sender of the message.
     *
     * @param {CometChat.BaseMessage} message - The message for which the thread icon is being determined.
     * @returns {boolean} The icon for the thread. If the message was sent by the logged in user, returns 'threadRightArrow'. Otherwise, returns 'threadIndicatorIcon'.
     */
    getThreadIconAlignment(message: CometChat.BaseMessage): boolean;
    /**
     * styling part
     */
    getBubbleDateStyle: (message: CometChat.BaseMessage) => {
        textColor: string | undefined;
        textFont: string;
        padding: string;
        display: string;
    };
    chatsListStyle: () => {
        height: string | undefined;
        background: string | undefined;
    };
    messageContainerStyle: () => {
        width: string | undefined;
    };
    errorStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    conversationStarterStateStyle: () => {
        textFont: string;
        textColor: string | undefined;
    };
    conversationSummaryStateStyle: () => {
        textFont: string;
        textColor: string | undefined;
    };
    emptyStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    loadingStyle: () => {
        iconTint: string | undefined;
    };
    conversationStarterLoader: () => {
        iconTint: string | undefined;
    };
    conversationSummaryLoader: () => {
        iconTint: string | undefined;
    };
    getSchedulerBubbleStyle: (messgae: SchedulerMessage) => SchedulerBubbleStyle;
    /**
     * Configuration for the reaction list.
     * This includes styles for the avatar, list items, and reaction history.
     * @returns {ReactionListConfiguration} - The configured reaction list.
     */
    getReactionListConfiguration(): ReactionListConfiguration;
    /**
     * Handles when a reaction item is clicked.
     * @param {CometChat.Reaction} reaction - The clicked reaction.
     * @param {CometChat.BaseMessage} message - The message the reaction is associated with.
     */
    onReactionItemClicked?: ((reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void) | undefined;
    /**
     * Handles adding a reaction when clicked.
     * @param {CometChat.ReactionCount} reaction - The clicked reaction.
     * @param {CometChat.BaseMessage} message - The message the reaction is associated with.
     */
    addReactionOnClick: (reaction: CometChat.ReactionCount, message: CometChat.BaseMessage) => void;
    /**
     * Configuration for the reaction info.
     * This includes styles for the reaction info display.
     * @returns {ReactionInfoConfiguration} - The configured reaction info.
     */
    getReactionInfoConfiguration(): ReactionInfoConfiguration;
    /**
     * Get style object based on message type.
     * @param {CometChat.BaseMessage} message - The message object.
     * @return {object} The style object.
     */
    getStatusInfoStyle: (message: CometChat.BaseMessage) => {
        justifyContent: string;
        height: string;
        borderRadius: string;
        padding: string;
        paddingTop: string;
        position: string;
        marginTop: string;
        marginRight: string;
        background: string | undefined;
        width: string;
        alignSelf: string;
        marginBottom: string;
        display: string;
        alignItems: string;
        gap: string;
    } | {
        justifyContent: string;
        alignItems: string;
        padding: string;
        display: string;
        gap: string;
    };
    wrapperStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    listStyle: () => {
        height: string;
    };
    /**
     * Styling for reactions component
     *
     */
    getReactionsWrapperStyle(message: CometChat.BaseMessage): {
        width: string;
        paddingTop: string;
        boxSizing: string;
        display: string;
        marginTop: string;
        justifyContent: string;
    };
    /**
     * Styling for unread thread replies
     * @returns LabelStyle
     */
    getUnreadRepliesCountStyle: () => {
        borderRadius: string;
        width: string;
        height: string;
        border: string;
        background: string | undefined;
        color: string | undefined;
        font: string | undefined;
        display: string;
        justifyContent: string;
        alignItems: string;
    };
    getThreadViewAlignment(message: CometChat.BaseMessage): {
        display: string;
        justifyContent: string;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatMessageListComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatMessageListComponent, "cometchat-message-list", never, { "hideError": "hideError"; "errorStateView": "errorStateView"; "loadingStateView": "loadingStateView"; "emptyStateView": "emptyStateView"; "errorStateText": "errorStateText"; "emptyStateText": "emptyStateText"; "loadingIconURL": "loadingIconURL"; "user": "user"; "group": "group"; "disableReceipt": "disableReceipt"; "disableSoundForMessages": "disableSoundForMessages"; "customSoundForMessages": "customSoundForMessages"; "readIcon": "readIcon"; "deliveredIcon": "deliveredIcon"; "sentIcon": "sentIcon"; "waitIcon": "waitIcon"; "errorIcon": "errorIcon"; "aiErrorIcon": "aiErrorIcon"; "aiEmptyIcon": "aiEmptyIcon"; "alignment": "alignment"; "showAvatar": "showAvatar"; "datePattern": "datePattern"; "timestampAlignment": "timestampAlignment"; "DateSeparatorPattern": "DateSeparatorPattern"; "templates": "templates"; "messagesRequestBuilder": "messagesRequestBuilder"; "newMessageIndicatorText": "newMessageIndicatorText"; "scrollToBottomOnNewMessages": "scrollToBottomOnNewMessages"; "thresholdValue": "thresholdValue"; "unreadMessageThreshold": "unreadMessageThreshold"; "reactionsConfiguration": "reactionsConfiguration"; "disableReactions": "disableReactions"; "emojiKeyboardStyle": "emojiKeyboardStyle"; "apiConfiguration": "apiConfiguration"; "onThreadRepliesClick": "onThreadRepliesClick"; "headerView": "headerView"; "footerView": "footerView"; "parentMessageId": "parentMessageId"; "threadIndicatorIcon": "threadIndicatorIcon"; "avatarStyle": "avatarStyle"; "backdropStyle": "backdropStyle"; "dateSeparatorStyle": "dateSeparatorStyle"; "messageListStyle": "messageListStyle"; "onError": "onError"; "messageInformationConfiguration": "messageInformationConfiguration"; "disableMentions": "disableMentions"; "textFormatters": "textFormatters"; }, {}, never, never>;
}
