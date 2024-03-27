import { OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import { CometChatMessagesComponent } from "../../CometChatMessages/cometchat-messages/cometchat-messages.component";
import { CometChatConversationsComponent } from "../../CometChatConversations/cometchat-conversations/cometchat-conversations.component";
import { WithMessagesStyle, MessagesConfiguration, GroupsConfiguration, CreateGroupConfiguration, JoinGroupConfiguration, MessageHeaderStyle } from '@cometchat/uikit-shared';
import '@cometchat/uikit-elements';
import { Subscription } from "rxjs";
import { BackdropStyle, CreateGroupStyle, JoinGroupStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { CometChatTheme } from "@cometchat/uikit-resources";
import * as i0 from "@angular/core";
/**
*
* CometChatGroupsWithMessagesComponent is a wrapper component for CometChatMessagesComponent and CometChatConversations component to show chats and messages in one screen
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatGroupsWithMessagesComponent implements OnInit, OnChanges {
    private elementRef;
    private ref;
    private themeService;
    groupRef: CometChatConversationsComponent;
    messageListRef: CometChatMessagesComponent;
    group: CometChat.Group | null;
    isMobileView: boolean;
    hideCreateGroup: boolean;
    messageText: string;
    groupsWithMessagesStyle: WithMessagesStyle;
    messagesConfiguration: MessagesConfiguration;
    createGroupConfiguration: CreateGroupConfiguration;
    joinGroupConfiguration: JoinGroupConfiguration;
    groupsConfiguration: GroupsConfiguration;
    onError: ((error: CometChat.CometChatException) => void) | null;
    theme: CometChatTheme;
    backdropStyle: BackdropStyle;
    createGroupStyle: CreateGroupStyle;
    joinGroupStyle: JoinGroupStyle;
    messageHeaderStyle: MessageHeaderStyle;
    listItemStyle: ListItemStyle;
    /**
     * Properties for internal use
     */
    createIconURL: string;
    loggedInUser: CometChat.User | null;
    createGroupButtonStyle: any;
    labelStyle: any;
    openCreateGroupPage: boolean;
    openPasswordModal: boolean;
    protectedGroup: CometChat.Group | null;
    user: CometChat.User | null;
    /**
    * Events
    */
    ccGroupMemberAdded: Subscription;
    ccGroupLeft: Subscription;
    ccGroupMemberJoined: Subscription;
    ccGroupMemberKicked: Subscription;
    ccGroupMemberBanned: Subscription;
    ccOwnershipChanged: Subscription;
    ccGroupDeleted: Subscription;
    ccGroupCreated: Subscription;
    ccOpenChat: Subscription;
    sideBarStyle: any;
    constructor(elementRef: ElementRef, ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterViewInit(): void;
    onBack: () => void;
    openCreateGroup(): void;
    closeCreateGroup: () => void;
    closeJoinGroup: () => void;
    onItemClick: ((group: CometChat.Group) => void);
    updateBackdropHeight(): void;
    ngOnInit(): void;
    setWithMessagesStyle(): void;
    setCreateGroupStyles: () => void;
    setJoinGroupStyles: () => void;
    setHeadersStyle(): void;
    setListItemStyle(): void;
    ngOnDestroy(): void;
    onGroupJoined: (event: any) => void;
    updatedCreatedGroup(event: any): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    emptyMessageStyle: () => {
        background: string | undefined;
        height: string | undefined;
        width: string;
        border: string;
        borderRadius: string | undefined;
    };
    groupsWrapperStyles: () => {
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        background: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatGroupsWithMessagesComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatGroupsWithMessagesComponent, "cometchat-groups-with-messages", never, { "group": "group"; "isMobileView": "isMobileView"; "hideCreateGroup": "hideCreateGroup"; "messageText": "messageText"; "groupsWithMessagesStyle": "groupsWithMessagesStyle"; "messagesConfiguration": "messagesConfiguration"; "createGroupConfiguration": "createGroupConfiguration"; "joinGroupConfiguration": "joinGroupConfiguration"; "groupsConfiguration": "groupsConfiguration"; "onError": "onError"; }, {}, never, never>;
}
