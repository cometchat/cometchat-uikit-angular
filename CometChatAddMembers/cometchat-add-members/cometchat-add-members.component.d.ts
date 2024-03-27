import { OnInit, ChangeDetectorRef, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AddMembersStyle, UsersStyle, BaseStyle } from '@cometchat/uikit-shared';
import '@cometchat/uikit-elements';
import { CometChatOption, TitleAlignment, SelectionMode } from '@cometchat/uikit-resources';
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { CometChatThemeService } from "../../CometChatTheme.service";
import * as i0 from "@angular/core";
/**
*
* CometChatAddMembersComponentComponent is used to render group members to add
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatAddMembersComponent implements OnInit {
    private ref;
    private themeService;
    usersRequestBuilder: CometChat.UsersRequestBuilder;
    searchRequestBuilder: CometChat.UsersRequestBuilder;
    subtitleView: TemplateRef<any>;
    listItemView: TemplateRef<any>;
    disableUsersPresence: boolean;
    menu: TemplateRef<any>;
    options: ((member: CometChat.User) => CometChatOption[]) | null;
    backButtonIconURL: string;
    closeButtonIconURL: string;
    showBackButton: boolean;
    hideSeparator: boolean;
    selectionMode: SelectionMode;
    searchPlaceholder: string;
    hideError: boolean;
    searchIconURL: string;
    hideSearch: boolean;
    title: string;
    onError: ((error: CometChat.CometChatException) => void) | null;
    onBack: () => void;
    onClose: () => void;
    onSelect: (user: CometChat.User, selected: boolean) => void;
    buttonText: string;
    group: CometChat.Group;
    emptyStateView: TemplateRef<any>;
    errorStateView: TemplateRef<any>;
    loadingIconURL: string;
    listItemStyle: ListItemStyle;
    showSectionHeader: boolean;
    sectionHeaderField: string;
    loadingStateView: TemplateRef<any>;
    emptyStateText: string;
    errorStateText: string;
    onAddMembersButtonClick: (guid: string, members: CometChat.User[]) => void;
    titleAlignment: TitleAlignment;
    titleAlignmentEnum: typeof TitleAlignment;
    selectionmodeEnum: typeof SelectionMode;
    addMembersStyle: AddMembersStyle;
    StatusIndicatorStyle: BaseStyle;
    avatarStyle: AvatarStyle;
    loggedInUser: CometChat.User | null;
    actionMessagesList: CometChat.Action[];
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    addMemberButtonStyle: any;
    searchKeyword: string;
    usersRequest: any;
    timeout: any;
    usersList: CometChat.User[];
    userListenerId: string;
    usersStyle: UsersStyle;
    membersList: any[];
    addedMembers: CometChat.GroupMember[];
    ngOnInit(): void;
    /**
     * @param  {string} uid
     */
    addRemoveUsers: (user: CometChat.User, selected: boolean) => void;
    closeClicked(): void;
    backClicked(): void;
    addMembersToGroup: () => void;
    createActionMessage(actionOn: CometChat.GroupMember): void;
    setAddMembersStyle(): void;
    setUsersStyle(): void;
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
    addMembersStyles: () => {
        padding: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatAddMembersComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatAddMembersComponent, "cometchat-add-members", never, { "usersRequestBuilder": "usersRequestBuilder"; "searchRequestBuilder": "searchRequestBuilder"; "subtitleView": "subtitleView"; "listItemView": "listItemView"; "disableUsersPresence": "disableUsersPresence"; "menu": "menu"; "options": "options"; "backButtonIconURL": "backButtonIconURL"; "closeButtonIconURL": "closeButtonIconURL"; "showBackButton": "showBackButton"; "hideSeparator": "hideSeparator"; "selectionMode": "selectionMode"; "searchPlaceholder": "searchPlaceholder"; "hideError": "hideError"; "searchIconURL": "searchIconURL"; "hideSearch": "hideSearch"; "title": "title"; "onError": "onError"; "onBack": "onBack"; "onClose": "onClose"; "onSelect": "onSelect"; "buttonText": "buttonText"; "group": "group"; "emptyStateView": "emptyStateView"; "errorStateView": "errorStateView"; "loadingIconURL": "loadingIconURL"; "listItemStyle": "listItemStyle"; "showSectionHeader": "showSectionHeader"; "sectionHeaderField": "sectionHeaderField"; "loadingStateView": "loadingStateView"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "onAddMembersButtonClick": "onAddMembersButtonClick"; "titleAlignment": "titleAlignment"; "addMembersStyle": "addMembersStyle"; "StatusIndicatorStyle": "StatusIndicatorStyle"; "avatarStyle": "avatarStyle"; }, {}, never, never>;
}
