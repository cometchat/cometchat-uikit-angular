import { AvatarStyle, BaseStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CallButtonsStyle, DetailsConfiguration, MessageComposerConfiguration, MessageComposerStyle, MessageHeaderConfiguration, MessageHeaderStyle, MessageListConfiguration, MessagesStyle, ThreadedMessagesConfiguration } from "@cometchat/uikit-shared";
import { ChangeDetectorRef, ElementRef, EventEmitter, OnChanges, OnInit, SimpleChanges, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatMessageComposerComponent } from "../../CometChatMessageComposer/cometchat-message-composer/cometchat-message-composer.component";
import { CometChatMessageListComponent } from "../../CometChatMessageList/cometchat-message-list/cometchat-message-list.component";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { Subscription } from "rxjs";
import * as i0 from "@angular/core";
/**
 *
 * CometChatMessages is a wrapper component for messageList, messageHeader, messageComposer and liveReaction component.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export declare class CometChatMessagesComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    private elementRef;
    messageComposerRef: CometChatMessageComposerComponent;
    messageListRef: CometChatMessageListComponent;
    user: CometChat.User;
    group: CometChat.Group;
    currentAskAIBot: CometChat.User;
    hideMessageComposer: boolean;
    disableTyping: boolean;
    messageHeaderConfiguration: MessageHeaderConfiguration;
    messageListConfiguration: MessageListConfiguration;
    messageComposerConfiguration: MessageComposerConfiguration;
    threadedMessageConfiguration: ThreadedMessagesConfiguration;
    detailsConfiguration: DetailsConfiguration;
    customSoundForIncomingMessages: string;
    customSoundForOutgoingMessages: string;
    disableSoundForMessages: boolean;
    messagesStyle: MessagesStyle;
    messageHeaderView: TemplateRef<any>;
    messageComposerView: TemplateRef<any>;
    messageListView: TemplateRef<any>;
    hideMessageHeader: boolean;
    hideDetails: boolean;
    auxiliaryMenu: TemplateRef<any>;
    conversationSummaryClicked: EventEmitter<void>;
    loggedInUser: CometChat.User | null;
    callButtonsStyle: CallButtonsStyle;
    messageToBeEdited: CometChat.BaseMessage | null;
    liveReaction: boolean;
    reactionName: string;
    messageToReact: CometChat.BaseMessage | null;
    composerStyles: MessageComposerStyle;
    liveReactionTimeout: any;
    openThreadedMessages: boolean;
    showAiBotChat: boolean;
    subtitleView: TemplateRef<any>;
    disableUsersPresence: boolean;
    /**
   * @deprecated
   *
   * This property is deprecated as of version 4.3.7 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
   */
    protectedGroupIcon: string;
    passwordGroupIcon: string | undefined;
    privateGroupIcon: string;
    menu: TemplateRef<any>;
    headerStyle: MessageHeaderStyle;
    backButtonIconURL: string;
    hideBackIcon: boolean;
    listItemView: TemplateRef<any>;
    onError: (error: CometChat.CometChatException) => void;
    onBack: () => void;
    avatarStyle: AvatarStyle;
    statusIndicatorStyle: BaseStyle;
    messageHeaderStyle: MessageHeaderStyle;
    listItemStyle: ListItemStyle;
    infoIconStyle: string;
    detailsButtonStyle: any;
    enableCalling: boolean;
    liveReactionStyle: BaseStyle;
    ccLiveReaction: Subscription;
    ccGroupDeleted: Subscription;
    ccGroupLeft: Subscription;
    ccUserBlocked: Subscription;
    ccUserUnBlocked: Subscription;
    ccShowPanel: Subscription;
    threadMessageObject: CometChat.BaseMessage | null;
    parentBubbleView: TemplateRef<any>;
    openDetails: boolean;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService, elementRef: ElementRef);
    ngOnInit(): void;
    subscribeToEvents(): void;
    setDetailsTemplate(): import("@cometchat/uikit-resources").CometChatDetailsTemplate[] | undefined;
    unsubscribeToEvents(): void;
    setMessagesStyle(): void;
    getAuxilaryView(): any;
    openThreadView: (message: CometChat.BaseMessage, bubble: TemplateRef<any>) => void;
    openDetailsPage: () => void;
    closeDetailsPage: () => void;
    closeThreadView: () => void;
    /**
     * @param  {string} reactionName
     */
    liveReactionStart: (reactionName: string) => void;
    ngOnChanges(change: SimpleChanges): void;
    ngOnDestroy(): void;
    chatListStyle(): {
        background: string | undefined;
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    /**
     * public methods
     * messageListRef methods
     * This metthod will append message in message list
     * @param  {CometChat.BaseMessage} message
     */
    addMessage(message: CometChat.BaseMessage): void;
    /**
     * This method will update the message in messageList
     * @param  {CometChat.BaseMessage} message
     */
    updateMessage(message: CometChat.BaseMessage, muid?: boolean): void;
    /**
     * This method will remove  the message from messageList
     * @param  {CometChat.BaseMessage} message
     */
    removeMessage(message: CometChat.BaseMessage): void;
    /**
     * This method will delete and remove  the message from messageList
     * @param  {CometChat.BaseMessage} message
     */
    deleteMessage(message: CometChat.BaseMessage): void;
    /**
     * this method will send a text message
     * @param  {string} text
     */
    sendTextMessage(text: string): void;
    /**
     * this method will open preview of the message
     * @param  {CometChat.BaseMessage} message
     * @param  {string} mode
     */
    previewMessage(message: CometChat.TextMessage, mode?: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatMessagesComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatMessagesComponent, "cometchat-messages", never, { "user": "user"; "group": "group"; "currentAskAIBot": "currentAskAIBot"; "hideMessageComposer": "hideMessageComposer"; "disableTyping": "disableTyping"; "messageHeaderConfiguration": "messageHeaderConfiguration"; "messageListConfiguration": "messageListConfiguration"; "messageComposerConfiguration": "messageComposerConfiguration"; "threadedMessageConfiguration": "threadedMessageConfiguration"; "detailsConfiguration": "detailsConfiguration"; "customSoundForIncomingMessages": "customSoundForIncomingMessages"; "customSoundForOutgoingMessages": "customSoundForOutgoingMessages"; "disableSoundForMessages": "disableSoundForMessages"; "messagesStyle": "messagesStyle"; "messageHeaderView": "messageHeaderView"; "messageComposerView": "messageComposerView"; "messageListView": "messageListView"; "hideMessageHeader": "hideMessageHeader"; "hideDetails": "hideDetails"; "auxiliaryMenu": "auxiliaryMenu"; }, {}, never, never>;
}
