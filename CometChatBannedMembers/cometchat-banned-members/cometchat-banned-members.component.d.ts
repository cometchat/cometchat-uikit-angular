import { OnInit, ChangeDetectorRef, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { Subscription } from "rxjs";
import { BannedMembersStyle, ListStyle } from '@cometchat/uikit-shared';
import { CometChatOption, SelectionMode, States, TitleAlignment } from '@cometchat/uikit-resources';
import '@cometchat/uikit-elements';
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { CometChatThemeService } from "../../CometChatTheme.service";
import * as i0 from "@angular/core";
/**
*
* CometChatBannedMembersComponent is used to render list of banned members
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatBannedMembersComponent implements OnInit {
    private ref;
    private themeService;
    bannedMembersRequestBuilder: CometChat.BannedMembersRequestBuilder;
    searchRequestBuilder: CometChat.BannedMembersRequestBuilder;
    subtitleView: TemplateRef<any>;
    listItemView: TemplateRef<any>;
    disableUsersPresence: boolean;
    menu: TemplateRef<any>;
    options: ((member: CometChat.GroupMember) => CometChatOption[]) | null;
    backButtonIconURL: string;
    closeButtonIconURL: string;
    showBackButton: boolean;
    hideSeparator: boolean;
    selectionMode: SelectionMode;
    searchPlaceholder: string;
    searchIconURL: string;
    hideSearch: boolean;
    title: string;
    onError: ((error: CometChat.CometChatException) => void) | null;
    onSelect: (member: CometChat.GroupMember, selected: boolean) => void;
    onBack: () => void;
    onClose: () => void;
    group: CometChat.Group;
    emptyStateView: TemplateRef<any>;
    errorStateView: TemplateRef<any>;
    loadingIconURL: string;
    loadingStateView: TemplateRef<any>;
    emptyStateText: string;
    errorStateText: string;
    titleAlignment: TitleAlignment;
    unbanIconURL: string;
    statusIndicatorStyle: any;
    menuListStyle: {
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
    unbanIconStyle: any;
    selectedMember: CometChat.GroupMember;
    titleAlignmentEnum: typeof TitleAlignment;
    selectionmodeEnum: typeof SelectionMode;
    avatarStyle: AvatarStyle;
    bannedMembersStyle: BannedMembersStyle;
    listItemStyle: ListItemStyle;
    searchKeyword: string;
    listStyle: ListStyle;
    limit: number;
    bannedMembersRequest: any;
    state: States;
    timeout: any;
    bannedMembers: CometChat.GroupMember[];
    scopes: string[];
    ccGroupMemberBanned: Subscription;
    membersListenerId: string;
    loggedInUser: CometChat.User | null;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    membersList: CometChat.GroupMember[];
    onScrolledToBottom: any;
    ngOnInit(): void;
    backClicked(): void;
    closeClicked(): void;
    onMembersSelected(member: CometChat.GroupMember, event: any): void;
    /**
   * @param  {CometChat.GroupMember} member
   */
    getStatusIndicatorColor: (member: CometChat.GroupMember) => string | null | undefined;
    unBanMember: (member: CometChat.GroupMember) => void;
    /**
     * @param  {CometChat.User} member
     */
    updateMember: (member: CometChat.GroupMember) => void;
    /**
   * @param  {CometChat.User} member
   */
    updateMemberStatus: (member: CometChat.User) => void;
    attachListeners(): void;
    removeListener(): void;
    fetchNextBannedMembers: () => void;
    getRequestBuilder(): import("@cometchat/chat-sdk-javascript").BannedMembersRequest;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    /**
     * @param  {string} key
     */
    onSearch: (key: string) => void;
    setThemeStyle(): void;
    setBanMembersStyle(): void;
    setStatusStyle(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    membersStyles: () => {
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
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatBannedMembersComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatBannedMembersComponent, "cometchat-banned-members", never, { "bannedMembersRequestBuilder": "bannedMembersRequestBuilder"; "searchRequestBuilder": "searchRequestBuilder"; "subtitleView": "subtitleView"; "listItemView": "listItemView"; "disableUsersPresence": "disableUsersPresence"; "menu": "menu"; "options": "options"; "backButtonIconURL": "backButtonIconURL"; "closeButtonIconURL": "closeButtonIconURL"; "showBackButton": "showBackButton"; "hideSeparator": "hideSeparator"; "selectionMode": "selectionMode"; "searchPlaceholder": "searchPlaceholder"; "searchIconURL": "searchIconURL"; "hideSearch": "hideSearch"; "title": "title"; "onError": "onError"; "onSelect": "onSelect"; "onBack": "onBack"; "onClose": "onClose"; "group": "group"; "emptyStateView": "emptyStateView"; "errorStateView": "errorStateView"; "loadingIconURL": "loadingIconURL"; "loadingStateView": "loadingStateView"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "titleAlignment": "titleAlignment"; "unbanIconURL": "unbanIconURL"; "statusIndicatorStyle": "statusIndicatorStyle"; "avatarStyle": "avatarStyle"; "bannedMembersStyle": "bannedMembersStyle"; "listItemStyle": "listItemStyle"; }, {}, never, never>;
}
