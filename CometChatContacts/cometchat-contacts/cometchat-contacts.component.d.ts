import { OnInit, ChangeDetectorRef, TemplateRef, AfterViewInit } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { BaseStyle, GroupsConfiguration, UsersConfiguration, TabItemStyle, ContactsStyle } from '@cometchat/uikit-shared';
import '@cometchat/uikit-elements';
import { CometChatTabItem, TabsVisibility, SelectionMode } from '@cometchat/uikit-resources';
import { CometChatThemeService } from "../../CometChatTheme.service";
import * as i0 from "@angular/core";
/**
*
* CometChatContactsComponent is used to render group members to add
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatContactsComponent implements OnInit, AfterViewInit {
    private ref;
    private themeService;
    usersRef: TemplateRef<any>;
    groupsRef: TemplateRef<any>;
    title: string;
    usersTabTitle: string;
    groupsTabTitle: string;
    usersConfiguration: UsersConfiguration;
    groupsConfiguration: GroupsConfiguration;
    onSubmitButtonClick: (users?: CometChat.User[], groups?: CometChat.Group[]) => void;
    closeIconURL: string;
    contactsStyle: ContactsStyle;
    selectionMode: SelectionMode;
    onClose: () => void;
    onItemClick: (user?: CometChat.User, group?: CometChat.Group) => void;
    tabVisibility: TabsVisibility;
    selectionLimit: number;
    tabs: CometChatTabItem[];
    hideSubmitButton: boolean;
    submitButtonText: string;
    usersRequestBuilder: CometChat.UsersRequestBuilder;
    usersSearchRequestBuilder: CometChat.UsersRequestBuilder;
    groupsRequestBuilder: CometChat.GroupsRequestBuilder;
    groupsSearchRequestBuilder: CometChat.GroupsRequestBuilder;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    tabItemStyle: TabItemStyle;
    usersList: CometChat.User[];
    groupsList: CometChat.Group[];
    submitButtonStyle: any;
    closeButtonStyle: any;
    wrapperStyle: any;
    contactsPadding: any;
    titleStyle: any;
    errorStyle: any;
    isLimitReached: boolean;
    tabsStyle: BaseStyle;
    onGroupSelected: (group: CometChat.Group) => void;
    onUserSelected: (user: CometChat.User) => void;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    userClicked: (user: CometChat.User) => void;
    groupClicked: (group: CometChat.Group) => void;
    closeClicked(): void;
    submitClicked(): void;
    setcontactsStyle(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatContactsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatContactsComponent, "cometchat-contacts", never, { "title": "title"; "usersTabTitle": "usersTabTitle"; "groupsTabTitle": "groupsTabTitle"; "usersConfiguration": "usersConfiguration"; "groupsConfiguration": "groupsConfiguration"; "onSubmitButtonClick": "onSubmitButtonClick"; "closeIconURL": "closeIconURL"; "contactsStyle": "contactsStyle"; "selectionMode": "selectionMode"; "onClose": "onClose"; "onItemClick": "onItemClick"; "tabVisibility": "tabVisibility"; "selectionLimit": "selectionLimit"; "tabs": "tabs"; "hideSubmitButton": "hideSubmitButton"; "submitButtonText": "submitButtonText"; }, {}, never, never>;
}
