import "@cometchat/uikit-elements";
import { AvatarStyle, BackdropStyle, BadgeStyle, ConfirmDialogStyle, DateStyle, ListItemStyle, ReceiptStyle } from "@cometchat/uikit-elements";
import { BaseStyle, CometChatTextFormatter, ConversationsStyle, ListStyle } from "@cometchat/uikit-shared";
import { CometChatOption, DatePatterns, SelectionMode, States, TitleAlignment } from "@cometchat/uikit-resources";
import { ChangeDetectorRef, NgZone, OnChanges, OnInit, SimpleChanges, TemplateRef } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { Subscription } from "rxjs";
import * as i0 from "@angular/core";
/**
 *
 * CometChatConversation is a wrapper component consists of CometChatListBaseComponent and ConversationListComponent.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export declare class CometChatConversationsComponent implements OnInit, OnChanges {
    private ngZone;
    private ref;
    private themeService;
    private sanitizer;
    /**
     * This properties will come from Parent.
     */
    subtitleView: TemplateRef<any>;
    title: string;
    options: ((conversation: CometChat.Conversation) => CometChatOption[]) | null;
    searchPlaceHolder: string;
    disableUsersPresence: boolean;
    disableReceipt: boolean;
    disableTyping: boolean;
    deliveredIcon: string;
    readIcon: string;
    errorIcon: string;
    datePattern: DatePatterns;
    onError: (error: CometChat.CometChatException) => void;
    sentIcon: string;
    privateGroupIcon: string;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.7 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
     */
    protectedGroupIcon: string;
    passwordGroupIcon: string | undefined;
    customSoundForMessages: string;
    activeConversation: CometChat.Conversation | null;
    searchIconURL: string;
    hideSearch: boolean;
    conversationsRequestBuilder: CometChat.ConversationsRequestBuilder;
    emptyStateView: TemplateRef<any>;
    onSelect: (conversation: CometChat.Conversation, selected: boolean) => void;
    loadingIconURL: string;
    errorStateView: TemplateRef<any>;
    loadingStateView: TemplateRef<any>;
    emptyStateText: string;
    errorStateText: string;
    titleAlignment: TitleAlignment;
    listItemView: TemplateRef<any>;
    menu: TemplateRef<any>;
    hideSeparator: boolean;
    searchPlaceholder: string;
    hideError: boolean;
    selectionMode: SelectionMode;
    disableSoundForMessages: boolean;
    confirmDialogTitle: any;
    confirmButtonText: string;
    cancelButtonText: string;
    confirmDialogMessage: string;
    onItemClick: (conversation: CometChat.Conversation) => void;
    deleteConversationDialogStyle: ConfirmDialogStyle;
    backdropStyle: BackdropStyle;
    badgeStyle: BadgeStyle;
    dateStyle: DateStyle;
    conversationsStyle: ConversationsStyle;
    listItemStyle: ListItemStyle;
    statusIndicatorStyle: any;
    typingIndicatorText: string;
    threadIndicatorText: string;
    avatarStyle: AvatarStyle;
    receiptStyle: ReceiptStyle;
    ccGroupMemberAdded: Subscription;
    ccGroupMemberJoined: Subscription;
    ccGroupMemberKicked: Subscription;
    ccGroupMemberBanned: Subscription;
    ccGroupMemberScopeChanged: Subscription;
    ccOwnershipChanged: Subscription;
    ccMessageEdit: Subscription;
    ccMessageSent: Subscription;
    ccMessageEdited: Subscription;
    ccMessageDelete: Subscription;
    ccGroupDeleted: Subscription;
    ccGroupLeft: Subscription;
    ccUserBlocked: Subscription;
    ccUserUnblocked: Subscription;
    ccMessageRead: Subscription;
    onTextMessageReceived: Subscription;
    onMediaMessageReceived: Subscription;
    onCustomMessageReceived: Subscription;
    onFormMessageReceived: Subscription;
    onSchedulerMessageReceived: Subscription;
    onCardMessageReceived: Subscription;
    onCustomInteractiveMessageReceived: Subscription;
    onMessagesRead: Subscription;
    onMessageDeleted: Subscription;
    onMessageEdited: Subscription;
    onMessagesDelivered: Subscription;
    onTypingStarted: Subscription;
    onTypingEnded: Subscription;
    ccOutgoingCall: Subscription;
    ccCallRejected: Subscription;
    ccCallEnded: Subscription;
    ccCallAccepted: Subscription;
    iconStyle: any;
    listStyle: ListStyle;
    menustyle: {
        width: string;
        height: string;
        border: string;
        borderRadius: string;
        background: string;
        textFont: string;
        textColor: string;
        iconTint: string;
        iconBackground: string;
        iconBorder: string;
        iconBorderRadius: string;
        submenuWidth: string;
        submenuHeight: string;
        submenuBorder: string;
        submenuBorderRadius: string;
        submenuBackground: string;
    };
    typingIndicator: CometChat.TypingIndicator | null;
    typingListenerId: string;
    callListenerId: string;
    connectionListenerId: string;
    selectionmodeEnum: typeof SelectionMode;
    isDialogOpen: boolean;
    isEmpty: boolean;
    isLoading: boolean;
    state: States;
    statusColor: any;
    limit: number;
    isError: boolean;
    conversationList: CometChat.Conversation[];
    scrolledToBottom: boolean;
    checkItemChange: boolean;
    conversationOptions: CometChatOption[];
    showConfirmDialog: boolean;
    conversationToBeDeleted: CometChat.Conversation | null;
    userListenerId: string;
    groupListenerId: string;
    groupToUpdate: CometChat.Group | {};
    conversationType?: string;
    safeHtml: SafeHtml;
    enablePolls: boolean;
    enableStickers: boolean;
    enableWhiteboard: boolean;
    enableDocument: boolean;
    threadIconURL: string;
    confirmDialogStyle: ConfirmDialogStyle;
    subtitleValue: string;
    modalStyle: BaseStyle;
    firstReload: boolean;
    isActive: boolean;
    contactsNotFound: boolean;
    chatSearch: boolean;
    requestBuilder: CometChat.ConversationsRequest;
    /**
     * Properties for internal use
     */
    localize: (str: string) => any;
    /**
     * This properties will come from Parent.
     */
    loggedInUser: CometChat.User | null;
    disableMentions: boolean;
    textFormatters?: Array<CometChatTextFormatter>;
    /**
     * Properties for internal use
     */
    /**
     * passing this callback to menuList component on delete click
     * @param  {CometChat.Conversation} conversation
     */
    deleteConversationOnClick: (() => void) | null;
    onConfirmClick: () => void;
    onConversationSelected(conversation: CometChat.Conversation, event: any): void;
    setStatusIndicatorStyle: (conversation: CometChat.Conversation) => any;
    /**
     * @param  {CometChat.Conversation} conversation
     */
    checkStatusType(conversation: CometChat.Conversation): any;
    getExtensionData(messageObject: CometChat.BaseMessage): any;
    setSubtitle: (conversationObject: CometChat.Conversation) => SafeHtml;
    checkGroupType(conversation: CometChat.Conversation): string;
    onCancelClick: () => void;
    getMessageReceipt: (conversation: CometChat.Conversation) => import("@cometchat/uikit-shared/dist/Utils/MessageReceiptUtils").receipts;
    getDate(): DatePatterns;
    optionsStyle: {
        background: string;
        border: string;
    };
    constructor(ngZone: NgZone, ref: ChangeDetectorRef, themeService: CometChatThemeService, sanitizer: DomSanitizer);
    ngOnInit(): void;
    /**
    * Determines if the last message should trigger an update based on its category and type.
    *
    * @param message - The last message sent or received in the conversation.
    * @returns {boolean} - Returns true if the message should trigger an update, false otherwise.
    */
    checkIfLastMessageShouldUpdate(message: CometChat.BaseMessage): boolean | undefined;
    shouldIncrementForCustomMessage(message: CometChat.CustomMessage): any;
    attachConnectionListeners(): void;
    updateConversationObject(conversation: CometChat.Conversation): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    getConversationFromUser(user: CometChat.User): import("@cometchat/chat-sdk-javascript").Conversation | null;
    getConversationFromGroup(group: CometChat.Group): CometChat.Conversation | null;
    ngOnChanges(change: SimpleChanges): void;
    ngOnDestroy(): void;
    setConversationOptions(): void;
    onClick(conversation: CometChat.Conversation): void;
    resetUnreadCount(): void;
    setThemeStyle(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    setStatusStyle(): void;
    setConversationsStyle(): void;
    setDateStyle(): void;
    setReceiptStyle(): void;
    setBadgeStyle(): void;
    setConfirmDialogStyle(): void;
    /**
     * @param  {Object={}} config
     * @param  {Object} defaultConfig?
     * @returns defaultConfig
     */
    /**
     * @param  {CometChat.Conversation} conversation
     */
    /**
     * Fetches the coversation based on the conversationRequest config
     */
    fetchNextConversation(): any;
    updateEditedMessage(message: CometChat.TextMessage): void;
    /**
     * attaches Listeners for user activity , group activities and calling
     * @param callback
     */
    /**
     * @param  {Function} callback
     */
    attachListeners(callback: any): void;
    fetchNewConversations(): void;
    removeConversationFromMessage(group: CometChat.Group): void;
    /**
     * Removes all listeners
     */
    removeListeners(): void;
    /**
     * Fetches Conversations Details with all the users
     */
    getConversation: (states?: States) => void;
    isReceiptDisable(conversation: CometChat.Conversation): boolean;
    /**
     * Updates the conversation list's last message , badgeCount , user presence based on activities propagated by listeners
     */
    conversationUpdated: (key: any, item: import("@cometchat/chat-sdk-javascript").Group | import("@cometchat/chat-sdk-javascript").User | null | undefined, message: CometChat.BaseMessage, options?: null) => void;
    /**
     * @param  {CometChat.BaseMessage} message
     */
    markMessageAsDelivered: (message: CometChat.BaseMessage) => void;
    /**
     * @param  {CometChat.BaseMessage} readMessage
     */
    getUinx: () => string;
    markAsRead(readMessage: CometChat.MessageReceipt): void;
    /**
     * Updates Detail when user comes online/offline
     * @param
     */
    /**
     * @param  {CometChat.User|CometChat.Group|null} user
     */
    updateUser(user: CometChat.User | CometChat.Group | null): void;
    /**
     *
     * Gets the last message
     * @param conversation
    /**
     * @param  {CometChat.BaseMessage} message
     * @param  {CometChat.Conversation|{}} conversation
     */
    makeLastMessage(message: CometChat.BaseMessage, conversation?: CometChat.Conversation | {}): import("@cometchat/chat-sdk-javascript").BaseMessage;
    updateConversationWithForGroup(message: CometChat.Action, conversation: CometChat.Conversation): void;
    /**
     *
     * Updates Conversations as Text/Custom Messages are received
     * @param
     *
     */
    /**
     * @param  {CometChat.BaseMessage} message
     * @param  {boolean} notification
     */
    updateConversation(message: CometChat.BaseMessage, notification?: boolean): void;
    updateDeliveredMessage(messageReceipt: CometChat.MessageReceipt): void;
    /**
     *
     * Gets The Count of Unread Messages
     * @param
     */
    /**
     * @param  {any} conversation
     * @param  {any} operator
     */
    makeUnreadMessageCount(conversation: CometChat.Conversation, operator?: any): number;
    /**
     * Changes detail of conversations
     * @param
     */
    /**
     * @param  {CometChat.BaseMessage} message
     */
    makeConversation(message: CometChat.BaseMessage): Promise<unknown>;
    /**
     * Updates Conversation View when message is edited or deleted
     */
    conversationEditedDeleted(message: CometChat.BaseMessage): void;
    /**
     * If User scrolls to the bottom of the current Conversation list than fetch next items of the Conversation list and append
     * @param Event
     */
    /**
     * Plays Audio When Message is Received
     */
    playAudio(): void;
    /**
     * @param  {CometChat.Conversation|{}} conversation
     */
    updateConversationList(conversation: CometChat.Conversation | null): void;
    /**
     * showing dialog for confirm and cancel
     * @param  {CometChat.Conversation|{}} conversation
     */
    showConfirmationDialog: (conversation: CometChat.Conversation) => void;
    onOptionClick(event: any, conversation: CometChat.Conversation): void;
    /**
     * show confirm dialog screen
     * @param  {CometChat.Conversation|{}} conversaton
     */
    getActiveConversation(conversation: CometChat.Conversation): boolean | null;
    /**
     * handle confirm dialog response
     * @param  {string} value
     */
    deleteSelectedConversation(): void;
    updateLastMessage(message: CometChat.BaseMessage): void;
    removeConversation(conversation: CometChat.Conversation): void;
    styles: any;
    subtitleStyle: (conversation: any) => {
        font: string | undefined;
        color: string | undefined;
    };
    itemThreadIndicatorStyle: () => {
        textFont: string;
        textColor: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatConversationsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatConversationsComponent, "cometchat-conversations", never, { "subtitleView": "subtitleView"; "title": "title"; "options": "options"; "searchPlaceHolder": "searchPlaceHolder"; "disableUsersPresence": "disableUsersPresence"; "disableReceipt": "disableReceipt"; "disableTyping": "disableTyping"; "deliveredIcon": "deliveredIcon"; "readIcon": "readIcon"; "errorIcon": "errorIcon"; "datePattern": "datePattern"; "onError": "onError"; "sentIcon": "sentIcon"; "privateGroupIcon": "privateGroupIcon"; "protectedGroupIcon": "protectedGroupIcon"; "passwordGroupIcon": "passwordGroupIcon"; "customSoundForMessages": "customSoundForMessages"; "activeConversation": "activeConversation"; "searchIconURL": "searchIconURL"; "hideSearch": "hideSearch"; "conversationsRequestBuilder": "conversationsRequestBuilder"; "emptyStateView": "emptyStateView"; "onSelect": "onSelect"; "loadingIconURL": "loadingIconURL"; "errorStateView": "errorStateView"; "loadingStateView": "loadingStateView"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "titleAlignment": "titleAlignment"; "listItemView": "listItemView"; "menu": "menu"; "hideSeparator": "hideSeparator"; "searchPlaceholder": "searchPlaceholder"; "hideError": "hideError"; "selectionMode": "selectionMode"; "disableSoundForMessages": "disableSoundForMessages"; "confirmDialogTitle": "confirmDialogTitle"; "confirmButtonText": "confirmButtonText"; "cancelButtonText": "cancelButtonText"; "confirmDialogMessage": "confirmDialogMessage"; "onItemClick": "onItemClick"; "deleteConversationDialogStyle": "deleteConversationDialogStyle"; "backdropStyle": "backdropStyle"; "badgeStyle": "badgeStyle"; "dateStyle": "dateStyle"; "conversationsStyle": "conversationsStyle"; "listItemStyle": "listItemStyle"; "statusIndicatorStyle": "statusIndicatorStyle"; "typingIndicatorText": "typingIndicatorText"; "threadIndicatorText": "threadIndicatorText"; "avatarStyle": "avatarStyle"; "receiptStyle": "receiptStyle"; "loggedInUser": "loggedInUser"; "disableMentions": "disableMentions"; "textFormatters": "textFormatters"; }, {}, never, never>;
}
