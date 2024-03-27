import { ChangeDetectorRef, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { GroupsStyle, ListStyle } from "@cometchat/uikit-shared";
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { Subscription } from 'rxjs';
import { CometChatThemeService } from '../../CometChatTheme.service';
import { CometChatOption, States, TitleAlignment, SelectionMode } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
/**
*
* CometChatGroups is a wrapper component which consists of CometChatListBaseComponent and CometChatGroupListComponent.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatGroupsComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    groupsRequestBuilder: CometChat.GroupsRequestBuilder;
    searchRequestBuilder: CometChat.GroupsRequestBuilder;
    subtitleView: TemplateRef<any>;
    listItemView: TemplateRef<any>;
    menu: TemplateRef<any>;
    options: ((member: CometChat.Group) => CometChatOption[]) | null;
    activeGroup: CometChat.Group | null;
    hideSeparator: boolean;
    selectionMode: SelectionMode;
    searchPlaceholder: string;
    hideError: boolean;
    searchIconURL: string;
    hideSearch: boolean;
    title: string;
    onError: (error: CometChat.CometChatException) => void;
    onSelect: (group: CometChat.Group, selected: boolean) => void;
    emptyStateView: TemplateRef<any>;
    errorStateView: TemplateRef<any>;
    loadingIconURL: string;
    privateGroupIcon: string;
    protectedGroupIcon: string;
    loadingStateView: TemplateRef<any>;
    emptyStateText: string;
    errorStateText: string;
    titleAlignment: TitleAlignment;
    selectionmodeEnum: typeof SelectionMode;
    state: States;
    statusIndicatorStyle: any;
    avatarStyle: AvatarStyle;
    groupsStyle: GroupsStyle;
    listItemStyle: ListItemStyle;
    onItemClick: (group: CometChat.Group) => void;
    groupsRequest: any;
    listStyle: ListStyle;
    limit: number;
    searchKeyword: string;
    timeout: any;
    groupsList: CometChat.Group[];
    groupsListenerId: string;
    loggedInUser: CometChat.User | null;
    statusColor: any;
    requestBuilder: CometChat.GroupsRequest;
    firstReload: boolean;
    connectionListenerId: string;
    onScrolledToBottom: any;
    ccGroupMemberAdded: Subscription;
    ccGroupLeft: Subscription;
    ccGroupMemberJoined: Subscription;
    ccGroupMemberKicked: Subscription;
    ccGroupMemberBanned: Subscription;
    ccOwnershipChanged: Subscription;
    ccGroupDeleted: Subscription;
    ccGroupCreated: Subscription;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnInit(): void;
    onGroupSelected(group: CometChat.Group, event: any): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    ngOnDestroy(): void;
    /**
     * @param  {CometChat.Group} group
     */
    updateGroup(group: CometChat.Group): void;
    /**
     * @param  {CometChat.Group} group
     */
    getGroupIcon: (group: CometChat.Group) => string | null | undefined;
    fetchNewUsers(): void;
    attachConnectionListeners(): void;
    attachListeners(): void;
    removeListener(): void;
    fetchNextGroupList: (state?: States) => void;
    /**
     * @param  {CometChat.Group} group
     */
    onClick: (group: CometChat.Group) => void;
    /**
     * @param  {CometChat.Group} group
     */
    getStatusIndicatorColor(group: CometChat.Group): any;
    /**
     * @param  {CometChat.Group} group
     */
    getMemberCount: (group: CometChat.Group) => string;
    /**
     * @param  {CometChat.Group} group
     */
    getActiveGroup: (group: CometChat.Group) => boolean;
    setRequestBuilder(): void;
    /**
     * @param  {CometChat.Group} group
     */
    removeGroup(group: CometChat.Group): void;
    /**
     * addGroup
     * @param group
     */
    addGroup(group: CometChat.Group): void;
    /**
     * @param  {string} key
     */
    onSearch: (key: string) => void;
    groupStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    setThemeStyle(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    setStatusStyle(): void;
    setGroupsStyle(): void;
    subtitleStyle: () => {
        font: string | undefined;
        color: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatGroupsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatGroupsComponent, "cometchat-groups", never, { "groupsRequestBuilder": "groupsRequestBuilder"; "searchRequestBuilder": "searchRequestBuilder"; "subtitleView": "subtitleView"; "listItemView": "listItemView"; "menu": "menu"; "options": "options"; "activeGroup": "activeGroup"; "hideSeparator": "hideSeparator"; "selectionMode": "selectionMode"; "searchPlaceholder": "searchPlaceholder"; "hideError": "hideError"; "searchIconURL": "searchIconURL"; "hideSearch": "hideSearch"; "title": "title"; "onError": "onError"; "onSelect": "onSelect"; "emptyStateView": "emptyStateView"; "errorStateView": "errorStateView"; "loadingIconURL": "loadingIconURL"; "privateGroupIcon": "privateGroupIcon"; "protectedGroupIcon": "protectedGroupIcon"; "loadingStateView": "loadingStateView"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "titleAlignment": "titleAlignment"; "statusIndicatorStyle": "statusIndicatorStyle"; "avatarStyle": "avatarStyle"; "groupsStyle": "groupsStyle"; "listItemStyle": "listItemStyle"; "onItemClick": "onItemClick"; }, {}, never, never>;
}
