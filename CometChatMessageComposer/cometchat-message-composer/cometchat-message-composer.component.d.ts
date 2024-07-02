import "@cometchat/uikit-shared";
import "@cometchat/uikit-elements";
import { AIOptionsStyle, CometChatMentionsFormatter, CometChatTextFormatter, ComposerId, CreatePollStyle, MessageComposerStyle, SmartRepliesStyle, StickersConfiguration, StickersStyle, UserMemberWrapperConfiguration, UserMentionStyle } from "@cometchat/uikit-shared";
import { ActionSheetStyle, BackdropStyle, EmojiKeyboardStyle, MediaRecorderStyle, PopoverStyle, PreviewStyle } from "@cometchat/uikit-elements";
import { AuxiliaryButtonAlignment, CometChatActionsView, CometChatMessageComposerAction, Placement, PreviewMessageMode, States, UserMemberListType, localize } from "@cometchat/uikit-resources";
import { ChangeDetectorRef, ElementRef, EventEmitter, OnChanges, OnInit, SimpleChanges, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { Subscription } from "rxjs";
import * as i0 from "@angular/core";
/**
 *
 * CometChatMessageComposer is used to send message to user or group.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export declare class CometChatMessageComposerComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    inputElementRef: ElementRef;
    inputRef: ElementRef;
    emojiButtonRef: ElementRef;
    actionSheetRef: ElementRef;
    stickerButtonRef: ElementRef;
    mediaRecordedRef: ElementRef;
    aiButtonRef: ElementRef;
    userMemberWrapperRef: ElementRef;
    user: CometChat.User;
    group: CometChat.Group;
    disableSoundForMessages: boolean;
    customSoundForMessage: string;
    disableTypingEvents: boolean;
    text: string;
    placeholderText: string;
    headerView: TemplateRef<any>;
    onTextChange: (text: string) => void;
    attachmentIconURL: string;
    attachmentOptions: ((item: CometChat.User | CometChat.Group, composerId: ComposerId) => CometChatMessageComposerAction[]) | undefined;
    secondaryButtonView: TemplateRef<any>;
    auxilaryButtonView: TemplateRef<any>;
    auxiliaryButtonsAlignment: AuxiliaryButtonAlignment;
    sendButtonView: TemplateRef<any>;
    parentMessageId: number;
    hideLiveReaction: boolean;
    LiveReactionIconURL: string;
    backButtonIconURL: string;
    mentionsWarningText?: string;
    mentionsWarningStyle?: any;
    InfoSimpleIcon: string;
    messageComposerStyle: MessageComposerStyle;
    onSendButtonClick: ((message: CometChat.BaseMessage, previewMessageMode?: PreviewMessageMode) => void) | undefined;
    onError: ((error: CometChat.CometChatException) => void) | null;
    backdropStyle: BackdropStyle;
    actionSheetStyle: ActionSheetStyle;
    aiActionSheetStyle: any;
    hideVoiceRecording: boolean;
    mediaRecorderStyle: MediaRecorderStyle;
    aiOptionsStyle: AIOptionsStyle;
    aiIconURL: string;
    voiceRecordingIconURL: string;
    voiceRecordingCloseIconURL: string;
    voiceRecordingStartIconURL: string;
    voiceRecordingStopIconURL: string;
    voiceRecordingSubmitIconURL: string;
    childEvent: EventEmitter<void>;
    userMemberWrapperConfiguration: UserMemberWrapperConfiguration;
    userMemberListType: UserMemberListType;
    disableMentions?: boolean;
    textFormatters?: Array<CometChatTextFormatter>;
    composerId: ComposerId;
    mentionsFormatterInstanceId: string;
    composerActions: CometChatMessageComposerAction[];
    states: typeof States;
    mentionsSearchTerm: string;
    showListForMentions: boolean;
    mentionsSearchCount: number;
    lastEmptySearchTerm?: string;
    smartReplyState: States;
    showMentionsCountWarning: boolean;
    groupMembersRequestBuilder: CometChat.GroupMembersRequestBuilder;
    usersRequestBuilder: CometChat.UsersRequestBuilder;
    ccShowMentionsCountWarning: Subscription;
    loadingStateText: string;
    errorStateText: string;
    emptyStateText: string;
    showCreatePolls: boolean;
    showStickerKeyboard: boolean;
    showActionSheetItem: boolean;
    showActionSheetItemAI: boolean;
    showSmartReply: boolean;
    showAiFeatures: boolean;
    repliesArray: string[];
    aiBotList: CometChat.User[];
    currentAskAIBot: any;
    isAiMoreThanOne: boolean;
    showPreview: boolean;
    aiFeaturesCloseCallback: (() => void) | null;
    editPreviewObject: CometChat.TextMessage;
    ccMessageEdit: Subscription;
    ccComposeMessage: Subscription;
    textFormatterList: Array<CometChatTextFormatter>;
    mentionsTextFormatterInstance: CometChatMentionsFormatter;
    mentionedUsers: Array<CometChat.User | CometChat.GroupMember>;
    acceptHandlers: any;
    enableStickerKeyboard: boolean;
    toggleMediaRecorded: boolean;
    showAiBotList: boolean;
    mentionsTypeSetByUser: boolean;
    stickerConfiguration: {
        id?: string;
        configuration?: StickersConfiguration;
    };
    closeButtonIconURL: string;
    buttons: Buttons[];
    aiActionButtons: Buttons[];
    smartReplyStyle: SmartRepliesStyle;
    sendButtonStyle: any;
    liveReactionStyle: any;
    localize: typeof localize;
    emojiButtonStyle: any;
    stickerButtonStyle: any;
    mediaRecorderButtonStyle: any;
    emojiKeyboardStyle: EmojiKeyboardStyle;
    stickerKeyboardStyle: StickersStyle;
    textInputStyle: any;
    previewStyle: PreviewStyle;
    createPollStyle: CreatePollStyle;
    storeTypingInterval: any;
    emojiPopover: PopoverStyle;
    stickerPopover: PopoverStyle;
    aiPopover: PopoverStyle;
    mediaRecordedPopover: PopoverStyle;
    popoverStyle: PopoverStyle;
    sendButtonIconURL: string;
    emojiButtonIconURL: string;
    stickerButtonIconURL: string;
    actions: (CometChatMessageComposerAction | CometChatActionsView)[];
    messageText: string;
    attachmentButtonStyle: any;
    auxilaryPlacement: Placement;
    messageSending: boolean;
    messageToBeEdited: CometChat.TextMessage | null;
    editPreviewText: string | null;
    showSendButton: boolean;
    showEmojiKeyboard: boolean;
    isAiEnabled: boolean;
    smartReplies: string[];
    loggedInUser: CometChat.User | null;
    mentionStyleLocal: UserMentionStyle;
    sendMessageOnEnter: (event: any) => void;
    disableSendButton(): void;
    messageInputChanged: (event: any) => void;
    appendEmoji: (event: any) => void;
    sendReaction(): void;
    openCreatePolls: () => void;
    closeCreatePolls: () => void;
    sendRecordedMedia: (event: any) => void;
    closeMediaRecorder(event?: any): void;
    getFormattedDate(): string;
    padZero(num: number): string;
    sendRecordedAudio: (file: Blob) => boolean;
    addAttachmentCallback(): void;
    subscribeToEvents(): void;
    openEditPreview(): void;
    /**
     * Adds @ for every mention the message by matching uid
     *
     * @param {string} message
     * @returns  {void}
     */
    checkForMentions(message: CometChat.TextMessage): string;
    unsubscribeToEvents(): void;
    closeModals(): void;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    callConversationSummaryMethod(): void;
    ngOnChanges(changes: SimpleChanges): void;
    userOrGroupChanged(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    customSendMethod(message: String): void;
    /**
     * @param  {String=""} textMsg
     */
    sendTextMessage(textMsg?: String): boolean;
    onAiBackButtonClick(): void;
    editMessage(): void;
    getReceiverDetails(): {
        receiverId: string;
        receiverType: string;
        isBlocked: boolean;
    };
    playAudio(): void;
    /**
     * @param  {} timer=null
     * @param  {string=""} metadata
     */
    startTyping(timer?: null, metadata?: string): void;
    handleActions: (event: any) => void;
    endTyping(metadata?: null): void;
    /**
     * @param  {File | CometChat.MediaMessage} messageInput
     * @param  {string} messageType
     */
    sendMediaMessage(messageInput: File, messageType: string): boolean;
    inputChangeHandler: (event: any) => void;
    sendSticker: (event: any) => void;
    /**
     * @param  {any} event
     */
    onVideoChange(event: any): boolean;
    /**
     * @param  {any} event
     */
    onAudioChange(event: any): boolean;
    /**
     * @param  {any} event
     */
    onImageChange(event: any): boolean;
    /**
     * @param  {any} event
     */
    onFileChange(event: any): boolean;
    openImagePicker: () => void;
    openFilePicker: () => void;
    openvideoPicker: () => void;
    openAudioPicker: () => void;
    handleOutsideClick(): void;
    openActionSheet: (event: any) => void;
    handleAiFeaturesClose: (callback: () => void) => void;
    closeSmartReply: () => void;
    openAiFeatures: (event: any) => void;
    openEmojiKeyboard: (event: any) => void;
    openMediaRecorded: (event: any) => void;
    openStickerKeyboard: (event: any) => void;
    closePopovers(): void;
    getComposerId(): ComposerId;
    ngOnInit(): void;
    /**
     * Check for developer provided instance of MentionsTextFormatter
     * If not provided, add default
     * If provided, check if style is provided via configuration, then add style.
     */
    initializeMentionsFormatter: () => void;
    getMentionsStyle: () => UserMentionStyle;
    getSmartReplies: () => Promise<unknown>;
    enableAiFeatures(): void;
    showAiBotMessageListMethod: (action: any) => void;
    sendReply: (event: any) => void;
    composerWrapperStyle(): {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    setTheme(): void;
    setComposerStyle(): void;
    closePreview(): void;
    backButtonStyle: () => {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        buttonIconTint: string | undefined;
    };
    /**
     * Accepts search term from mentionsTextFormatter and opens the mentions select list
     *
     * @param {string} searchTerm
     * @returns {void}
     */
    searchMentions: (searchTerm: string) => void;
    /**
     * Called when clicking a user from the mentions list.
     * Add the user to mentions text formatter instance and then call rerender to style the mention
     * within message input.
     *
     * @param {CometChat.User} user
     */
    defaultMentionsItemClickHandler: (user: CometChat.User | CometChat.GroupMember) => void;
    /**
     * Close mentions list if search returns empty list
     */
    defaultOnEmptyForMentions: () => void;
    getMentionInfoIconStyle: () => {
        height: string;
        width: string;
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        borderRadius: string;
        border: string;
        buttonIconTint: string | undefined;
        padding: string;
        iconHeight: string;
        iconWidth: string;
        iconBackground: string;
        gap: string;
    };
    handleClickOutside: (event: any) => void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatMessageComposerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatMessageComposerComponent, "cometchat-message-composer", never, { "user": "user"; "group": "group"; "disableSoundForMessages": "disableSoundForMessages"; "customSoundForMessage": "customSoundForMessage"; "disableTypingEvents": "disableTypingEvents"; "text": "text"; "placeholderText": "placeholderText"; "headerView": "headerView"; "onTextChange": "onTextChange"; "attachmentIconURL": "attachmentIconURL"; "attachmentOptions": "attachmentOptions"; "secondaryButtonView": "secondaryButtonView"; "auxilaryButtonView": "auxilaryButtonView"; "auxiliaryButtonsAlignment": "auxiliaryButtonsAlignment"; "sendButtonView": "sendButtonView"; "parentMessageId": "parentMessageId"; "hideLiveReaction": "hideLiveReaction"; "LiveReactionIconURL": "LiveReactionIconURL"; "backButtonIconURL": "backButtonIconURL"; "mentionsWarningText": "mentionsWarningText"; "mentionsWarningStyle": "mentionsWarningStyle"; "messageComposerStyle": "messageComposerStyle"; "onSendButtonClick": "onSendButtonClick"; "onError": "onError"; "backdropStyle": "backdropStyle"; "actionSheetStyle": "actionSheetStyle"; "aiActionSheetStyle": "aiActionSheetStyle"; "hideVoiceRecording": "hideVoiceRecording"; "mediaRecorderStyle": "mediaRecorderStyle"; "aiOptionsStyle": "aiOptionsStyle"; "aiIconURL": "aiIconURL"; "voiceRecordingIconURL": "voiceRecordingIconURL"; "voiceRecordingCloseIconURL": "voiceRecordingCloseIconURL"; "voiceRecordingStartIconURL": "voiceRecordingStartIconURL"; "voiceRecordingStopIconURL": "voiceRecordingStopIconURL"; "voiceRecordingSubmitIconURL": "voiceRecordingSubmitIconURL"; "userMemberWrapperConfiguration": "userMemberWrapperConfiguration"; "disableMentions": "disableMentions"; "textFormatters": "textFormatters"; }, { "childEvent": "childEvent"; }, never, never>;
}
export interface Buttons {
    title: string;
    id: string;
    onClick: () => Promise<unknown>;
}
