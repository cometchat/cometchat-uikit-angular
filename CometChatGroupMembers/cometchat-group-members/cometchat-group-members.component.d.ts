import { OnInit, ChangeDetectorRef, TemplateRef, OnChanges, SimpleChanges } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, ListItemStyle, ChangeScopeStyle, MenuListStyle, BackdropStyle } from "@cometchat/uikit-elements";
import { GroupMembersStyle, ListStyle } from "@cometchat/uikit-shared";
import { CometChatOption, SelectionMode, States, TitleAlignment, UserPresencePlacement } from "@cometchat/uikit-resources";
import { CometChatThemeService } from "../../CometChatTheme.service";
import * as i0 from "@angular/core";
/**
 *
 *  CometChatGroupMembersComponent is used to render list of group members
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export declare class CometChatGroupMembersComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    groupMemberRequestBuilder: CometChat.GroupMembersRequestBuilder;
    searchRequestBuilder: CometChat.GroupMembersRequestBuilder;
    subtitleView: TemplateRef<any>;
    listItemView: TemplateRef<any>;
    tailView: TemplateRef<any>;
    disableUsersPresence: boolean;
    menu: TemplateRef<any>;
    options: ((member: CometChat.GroupMember) => CometChatOption[]) | null;
    backButtonIconURL: string;
    closeButtonIconURL: string | undefined;
    showBackButton: boolean;
    hideSeparator: boolean;
    selectionMode: SelectionMode;
    searchPlaceholder: string;
    searchIconURL: string;
    hideSearch: boolean;
    title: string;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    backdropStyle: BackdropStyle;
    onBack: () => void;
    onClose: () => void;
    onSelect: (groupMember: CometChat.GroupMember, selected: boolean) => void;
    group: CometChat.Group;
    emptyStateView: TemplateRef<any>;
    errorStateView: TemplateRef<any>;
    loadingIconURL: string;
    loadingStateView: TemplateRef<any>;
    emptyStateText: string;
    errorStateText: string;
    titleAlignment: TitleAlignment;
    dropdownIconURL: string;
    statusIndicatorStyle: any;
    avatarStyle: AvatarStyle;
    groupMembersStyle: GroupMembersStyle;
    groupScopeStyle: ChangeScopeStyle;
    listItemStyle: ListItemStyle;
    onItemClick: (user: CometChat.GroupMember) => void;
    onEmpty?: () => void;
    userPresencePlacement: UserPresencePlacement;
    disableLoadingState: boolean;
    listStyle: ListStyle;
    menuListStyle: MenuListStyle;
    modalStyle: any;
    limit: number;
    moreIconURL: string;
    searchKeyword: string;
    onScrolledToBottom: any;
    isString: (data: any) => boolean;
    isArray: (data: any) => boolean;
    getOptions: (member: CometChat.GroupMember) => string | CometChatOption[];
    selectedMember: CometChat.GroupMember | null;
    titleAlignmentEnum: typeof TitleAlignment;
    selectionmodeEnum: typeof SelectionMode;
    groupsRequest: any;
    state: States;
    timeout: any;
    groupMembers: CometChat.GroupMember[];
    scopes: string[];
    membersListenerId: string;
    loggedInUser: CometChat.User | null;
    changeScope: boolean;
    fetchingGroups: boolean;
    fetchTimeOut: any;
    previousSearchKeyword: string;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    memberScope: any[];
    membersList: CometChat.GroupMember[];
    closeClicked(): void;
    backClicked(): void;
    onClick: (groupMember: CometChat.GroupMember) => void;
    onMemberSelected(member: CometChat.GroupMember, event: any): void;
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    searchKeyWordUpdated: () => void;
    searchForGroupMembers: () => void;
    ngOnDestroy(): void;
    /**
     * @param  {CometChat.GroupMember} member
     */
    getStatusIndicatorColor: (member: CometChat.GroupMember) => string | null | undefined;
    changeMemberScope(event: any): void;
    handleMenuAction: (menu: any, groupMember: CometChat.GroupMember) => void;
    blockMember: (member: CometChat.GroupMember) => void;
    createActionMessage(actionOn: CometChat.GroupMember, action: string): import("@cometchat/chat-sdk-javascript").Action;
    kickMember: (member: CometChat.GroupMember) => void;
    /**
     * @param  {CometChat.User} member
     */
    updateMemberStatus: (member: CometChat.User) => void;
    updateMember: (member: CometChat.GroupMember | null) => void;
    attachListeners(): void;
    removeListener(): void;
    addRemoveMember: (member: CometChat.GroupMember) => void;
    fetchNextGroupMembers: () => void;
    getRequestBuilder(): import("@cometchat/chat-sdk-javascript").GroupMembersRequest;
    /**
     * @param  {string} key
     */
    onSearch: (key: string) => void;
    setThemeStyle(): void;
    setGroupMembersStyle(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    setStatusStyle(): void;
    setScopeStyle(): void;
    membersStyle: () => {
        padding: string | undefined;
    };
    backButtonStyle: () => {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        buttonIconTint: string | undefined;
    };
    closeButtonStyle: () => {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        buttonIconTint: string | undefined;
    };
    wrapperStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    getScopeStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatGroupMembersComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatGroupMembersComponent, "cometchat-group-members", never, { "groupMemberRequestBuilder": "groupMemberRequestBuilder"; "searchRequestBuilder": "searchRequestBuilder"; "subtitleView": "subtitleView"; "listItemView": "listItemView"; "tailView": "tailView"; "disableUsersPresence": "disableUsersPresence"; "menu": "menu"; "options": "options"; "backButtonIconURL": "backButtonIconURL"; "closeButtonIconURL": "closeButtonIconURL"; "showBackButton": "showBackButton"; "hideSeparator": "hideSeparator"; "selectionMode": "selectionMode"; "searchPlaceholder": "searchPlaceholder"; "searchIconURL": "searchIconURL"; "hideSearch": "hideSearch"; "title": "title"; "onError": "onError"; "backdropStyle": "backdropStyle"; "onBack": "onBack"; "onClose": "onClose"; "onSelect": "onSelect"; "group": "group"; "emptyStateView": "emptyStateView"; "errorStateView": "errorStateView"; "loadingIconURL": "loadingIconURL"; "loadingStateView": "loadingStateView"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "titleAlignment": "titleAlignment"; "dropdownIconURL": "dropdownIconURL"; "statusIndicatorStyle": "statusIndicatorStyle"; "avatarStyle": "avatarStyle"; "groupMembersStyle": "groupMembersStyle"; "groupScopeStyle": "groupScopeStyle"; "listItemStyle": "listItemStyle"; "onItemClick": "onItemClick"; "onEmpty": "onEmpty"; "userPresencePlacement": "userPresencePlacement"; "disableLoadingState": "disableLoadingState"; "searchKeyword": "searchKeyword"; }, {}, never, never>;
}
