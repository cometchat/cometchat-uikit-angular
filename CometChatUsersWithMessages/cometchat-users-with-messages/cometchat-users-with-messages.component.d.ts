import { OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import { CometChatMessagesComponent } from "../../CometChatMessages/cometchat-messages/cometchat-messages.component";
import { CometChatConversationsComponent } from "../../CometChatConversations/cometchat-conversations/cometchat-conversations.component";
import '@cometchat/uikit-elements';
import { Subscription } from "rxjs";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { WithMessagesStyle, MessagesConfiguration, UsersConfiguration } from "@cometchat/uikit-shared";
import * as i0 from "@angular/core";
/**
*
* CometChatUsersWithMessagesComponent is a wrapper component for CometChatMessagesComponent and CometChatConversations component to show chats and messages in one screen
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatUsersWithMessagesComponent implements OnInit, OnChanges {
    private elementRef;
    private ref;
    private themeService;
    userRef: CometChatConversationsComponent;
    messageListRef: CometChatMessagesComponent;
    user: CometChat.User | null;
    isMobileView: boolean;
    messageText: string;
    usersWithMessagesStyle: WithMessagesStyle;
    messagesConfiguration: MessagesConfiguration;
    usersConfiguration: UsersConfiguration;
    onError: ((error: CometChat.CometChatException) => void) | null;
    theme: CometChatTheme;
    /**
     * Properties for internal use
     */
    loggedInUser: CometChat.User | null;
    labelStyle: any;
    /**
    * Events
    */
    ccUserBlocked: Subscription;
    ccUserUnBlocked: Subscription;
    sideBarStyle: any;
    constructor(elementRef: ElementRef, ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngAfterViewInit(): void;
    updateBackdropHeight(): void;
    ngOnChanges(changes: SimpleChanges): void;
    onBack: () => void;
    onItemClick: ((user: CometChat.User) => void);
    ngOnInit(): void;
    setWithMessagesStyle(): void;
    ngOnDestroy(): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    emptyMessageStyle: () => {
        background: string | undefined;
        height: string | undefined;
        width: string;
        border: string;
        borderRadius: string | undefined;
    };
    usersWrapperStyles: () => {
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        background: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatUsersWithMessagesComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatUsersWithMessagesComponent, "cometchat-users-with-messages", never, { "user": "user"; "isMobileView": "isMobileView"; "messageText": "messageText"; "usersWithMessagesStyle": "usersWithMessagesStyle"; "messagesConfiguration": "messagesConfiguration"; "usersConfiguration": "usersConfiguration"; "onError": "onError"; }, {}, never, never>;
}
