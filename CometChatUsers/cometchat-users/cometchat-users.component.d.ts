import { ChangeDetectorRef, OnInit, SimpleChanges, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, BaseStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { Subscription } from "rxjs";
import { CometChatOption, SelectionMode, TitleAlignment, States } from "@cometchat/uikit-resources";
import { UsersStyle, ListStyle } from "@cometchat/uikit-shared";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { UserPresencePlacement } from "@cometchat/uikit-resources";
import * as i0 from "@angular/core";
export declare class CometChatUsersComponent implements OnInit {
    private ref;
    private themeService;
    usersRequestBuilder: CometChat.UsersRequestBuilder;
    searchRequestBuilder: CometChat.UsersRequestBuilder;
    subtitleView: TemplateRef<any>;
    disableUsersPresence: boolean;
    listItemView: TemplateRef<any>;
    menu: TemplateRef<any>;
    options: ((member: CometChat.User) => CometChatOption[]) | null;
    activeUser: CometChat.User | null;
    hideSeparator: boolean;
    searchPlaceholder: string;
    hideError: boolean;
    selectionMode: SelectionMode;
    searchIconURL: string;
    hideSearch: boolean;
    title: string;
    onError?: (error: CometChat.CometChatException) => void;
    emptyStateView: TemplateRef<any>;
    onSelect: (user: CometChat.User, selected: boolean) => void;
    errorStateView: TemplateRef<any>;
    loadingIconURL: string;
    showSectionHeader: boolean;
    sectionHeaderField: string;
    loadingStateView: TemplateRef<any>;
    emptyStateText: string;
    errorStateText: string;
    titleAlignment: TitleAlignment;
    usersStyle: UsersStyle;
    listItemStyle: ListItemStyle;
    statusIndicatorStyle: BaseStyle;
    avatarStyle: AvatarStyle;
    onItemClick: (user: CometChat.User) => void;
    searchKeyword: string;
    onEmpty?: () => void;
    userPresencePlacement: UserPresencePlacement;
    disableLoadingState: boolean;
    fetchingUsers: boolean;
    fetchTimeOut: any;
    userChecked: string;
    listStyle: ListStyle;
    usersRequest: any;
    state: States;
    timeout: any;
    selectionmodeEnum: typeof SelectionMode;
    usersList: CometChat.User[];
    limit: number;
    userListenerId: string;
    loggedInUser: CometChat.User | null;
    requestBuilder: CometChat.UsersRequest;
    firstReload: boolean;
    connectionListenerId: string;
    previousSearchKeyword: string;
    isWebsocketReconnected: boolean;
    /**
     * Events
     */
    ccUserBlocked: Subscription;
    ccUserUnBlocked: Subscription;
    onScrolledToBottom: any;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    fetchUsersOnSearchKeyWordChange: () => void;
    searchForUser: () => void;
    onUserSelected(user: CometChat.User, event: any): void;
    fetchNewUsers(): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    ngOnDestroy(): void;
    isUserSelected(user: CometChat.User): boolean;
    /**
     * @param  {CometChat.User} user
     */
    onClick: (user: CometChat.User) => void;
    /**
     * @param  {CometChat.User} user
     */
    getActiveUser: (user: CometChat.User) => boolean;
    /**
     * @param  {CometChat.User} user
     */
    getStatusIndicatorColor: (user: CometChat.User) => string | null | undefined;
    /**
     * @param  {CometChat.User} user
     */
    getStatusIndicatorStyle: (user: CometChat.User) => BaseStyle | null;
    /**
     * @param  {CometChat.User} user
     */
    updateUser: (user: CometChat.User) => void;
    attachConnectionListeners(): void;
    attachListeners(): void;
    removeListener(): void;
    addMembersToList: (user: CometChat.User, event: any) => void;
    fetchNextUsersList: (state?: States) => void;
    setRequestBuilder(): import("@cometchat/chat-sdk-javascript").UsersRequest;
    /**
     * @param  {string} key
     */
    onSearch: (key: string) => void;
    setThemeStyle(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    setStatusStyle(): void;
    setUsersStyle(): void;
    userStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatUsersComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatUsersComponent, "cometchat-users", never, { "usersRequestBuilder": "usersRequestBuilder"; "searchRequestBuilder": "searchRequestBuilder"; "subtitleView": "subtitleView"; "disableUsersPresence": "disableUsersPresence"; "listItemView": "listItemView"; "menu": "menu"; "options": "options"; "activeUser": "activeUser"; "hideSeparator": "hideSeparator"; "searchPlaceholder": "searchPlaceholder"; "hideError": "hideError"; "selectionMode": "selectionMode"; "searchIconURL": "searchIconURL"; "hideSearch": "hideSearch"; "title": "title"; "onError": "onError"; "emptyStateView": "emptyStateView"; "onSelect": "onSelect"; "errorStateView": "errorStateView"; "loadingIconURL": "loadingIconURL"; "showSectionHeader": "showSectionHeader"; "sectionHeaderField": "sectionHeaderField"; "loadingStateView": "loadingStateView"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "titleAlignment": "titleAlignment"; "usersStyle": "usersStyle"; "listItemStyle": "listItemStyle"; "statusIndicatorStyle": "statusIndicatorStyle"; "avatarStyle": "avatarStyle"; "onItemClick": "onItemClick"; "searchKeyword": "searchKeyword"; "onEmpty": "onEmpty"; "userPresencePlacement": "userPresencePlacement"; "disableLoadingState": "disableLoadingState"; }, {}, never, never>;
}
