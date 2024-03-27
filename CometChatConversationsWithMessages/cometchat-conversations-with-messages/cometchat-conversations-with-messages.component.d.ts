import { OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import { WithMessagesStyle, MessagesConfiguration, ConversationsConfiguration, ContactsConfiguration } from '@cometchat/uikit-shared';
import { CometChatTheme } from '@cometchat/uikit-resources';
import '@cometchat/uikit-elements';
import { Subscription } from "rxjs";
import { CometChatThemeService } from "../../CometChatTheme.service";
import * as i0 from "@angular/core";
/**
*
* CometChatConversationsWithMessagesComponent is a wrapper component for CometChatMessagesComponent and CometChatConversations component to show chats and messages in one screen
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatConversationsWithMessagesComponent implements OnInit, OnChanges {
    private elementRef;
    private ref;
    private themeService;
    user: CometChat.User | null;
    group: CometChat.Group | null;
    isMobileView: boolean;
    messageText: string;
    conversationsWithMessagesStyle: WithMessagesStyle;
    messagesConfiguration: MessagesConfiguration;
    conversationConfiguration: ConversationsConfiguration;
    onError: ((error: CometChat.CometChatException) => void) | null;
    startNewConversationIconURL: string;
    hideStartNewConversation: boolean;
    StartConversationConfiguration: ContactsConfiguration;
    theme: CometChatTheme;
    /**
     * Properties for internal use
     */
    showStartConversation: boolean;
    loggedInUser: CometChat.User | null;
    activeConversation: CometChat.Conversation | null;
    labelStyle: any;
    hideSearch: boolean;
    startConversationButtonStyle: any;
    /**
    * Events
    */
    ccGroupMemberAdded: Subscription;
    ccGroupLeft: Subscription;
    ccOpenChat: Subscription;
    ccGroupMemberJoined: Subscription;
    ccGroupMemberKicked: Subscription;
    ccGroupMemberBanned: Subscription;
    ccOwnershipChanged: Subscription;
    ccGroupDeleted: Subscription;
    sideBarStyle: any;
    ccConversationDeleted: Subscription;
    constructor(elementRef: ElementRef, ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    triggerStartConversation(): void;
    onBack: () => void;
    setWithMessagesStyle(): void;
    onContactSelected: (users?: import("@cometchat/chat-sdk-javascript").User[] | undefined, groups?: import("@cometchat/chat-sdk-javascript").Group[] | undefined) => void;
    onItemClick: ((conversation: CometChat.Conversation) => void);
    ngAfterViewInit(): void;
    updateBackdropHeight(): void;
    setActiveChat(): void;
    closeStartConversation: () => void;
    ngOnInit(): void;
    ngOnDestroy(): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    /**
     * remove active chat screen after deleting the conversation.
     * @param  {CometChat.Conversation} conversation
     */
    removeActiveChatList(conversation: CometChat.Conversation): void;
    emptyMessageStyle: () => {
        background: string | undefined;
        height: string | undefined;
        width: string;
        border: string;
        borderRadius: string | undefined;
    };
    chatsWrapperStyles: () => {
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        background: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatConversationsWithMessagesComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatConversationsWithMessagesComponent, "cometchat-conversations-with-messages", never, { "user": "user"; "group": "group"; "isMobileView": "isMobileView"; "messageText": "messageText"; "conversationsWithMessagesStyle": "conversationsWithMessagesStyle"; "messagesConfiguration": "messagesConfiguration"; "conversationConfiguration": "conversationConfiguration"; "onError": "onError"; "startNewConversationIconURL": "startNewConversationIconURL"; "hideStartNewConversation": "hideStartNewConversation"; "StartConversationConfiguration": "StartConversationConfiguration"; }, {}, never, never>;
}
