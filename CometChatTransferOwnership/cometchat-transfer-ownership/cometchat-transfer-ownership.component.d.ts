import { OnInit, ChangeDetectorRef, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { CometChatOption, TitleAlignment, SelectionMode } from "@cometchat/uikit-resources";
import { TransferOwnershipStyle, GroupMembersStyle } from "@cometchat/uikit-shared";
import { CometChatThemeService } from "../../CometChatTheme.service";
import * as i0 from "@angular/core";
/**
*
* CometChatTransferOwnershipComponent is used to render users list to transfer wonership
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatTransferOwnershipComponent implements OnInit {
    private ref;
    private themeService;
    groupMemberRequestBuilder: CometChat.GroupMembersRequestBuilder;
    searchRequestBuilder: CometChat.GroupMembersRequestBuilder;
    subtitleView: TemplateRef<any>;
    listItemView: TemplateRef<any>;
    disableUsersPresence: boolean;
    options: ((member: CometChat.GroupMember) => CometChatOption[]) | null;
    closeButtonIconURL: string;
    hideSeparator: boolean;
    searchPlaceholder: string;
    searchIconURL: string;
    hideSearch: boolean;
    title: string;
    onError: ((error: CometChat.CometChatException) => void) | null;
    onClose: () => void;
    onTransferOwnership: (member: CometChat.GroupMember) => void;
    group: CometChat.Group;
    emptyStateView: TemplateRef<any>;
    errorStateView: TemplateRef<any>;
    loadingIconURL: string;
    loadingStateView: TemplateRef<any>;
    emptyStateText: string;
    errorStateText: string;
    statusIndicatorStyle: any;
    transferOwnershipStyle: TransferOwnershipStyle;
    transferButtonText: string;
    cancelButtonText: string;
    avatarStyle: AvatarStyle;
    groupMembersStyle: GroupMembersStyle;
    listItemStyle: ListItemStyle;
    titleAlignment: TitleAlignment;
    selectionMode: SelectionMode;
    showBackButton: boolean;
    selectedMember: CometChat.GroupMember | null;
    loggedInUser: CometChat.User | null;
    selectedUser: CometChat.User;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    transferButtonStyle: any;
    cancelButtonStyle: any;
    ngOnInit(): void;
    onOwnerSelected: (member: CometChat.GroupMember) => void;
    onTransferClick: () => void;
    closeClicked: () => void;
    setThemeStyle(): void;
    setListItemStyle(): void;
    setGroupMembersStyle(): void;
    setAvatarStyle(): void;
    setStatusStyle(): void;
    setownershipStyle(): void;
    membersStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    wrapperStyle: () => {
        height: string;
        width: string;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    getScopeStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatTransferOwnershipComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatTransferOwnershipComponent, "cometchat-transfer-ownership", never, { "groupMemberRequestBuilder": "groupMemberRequestBuilder"; "searchRequestBuilder": "searchRequestBuilder"; "subtitleView": "subtitleView"; "listItemView": "listItemView"; "disableUsersPresence": "disableUsersPresence"; "options": "options"; "closeButtonIconURL": "closeButtonIconURL"; "hideSeparator": "hideSeparator"; "searchPlaceholder": "searchPlaceholder"; "searchIconURL": "searchIconURL"; "hideSearch": "hideSearch"; "title": "title"; "onError": "onError"; "onClose": "onClose"; "onTransferOwnership": "onTransferOwnership"; "group": "group"; "emptyStateView": "emptyStateView"; "errorStateView": "errorStateView"; "loadingIconURL": "loadingIconURL"; "loadingStateView": "loadingStateView"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "statusIndicatorStyle": "statusIndicatorStyle"; "transferOwnershipStyle": "transferOwnershipStyle"; "transferButtonText": "transferButtonText"; "cancelButtonText": "cancelButtonText"; "avatarStyle": "avatarStyle"; "groupMembersStyle": "groupMembersStyle"; "listItemStyle": "listItemStyle"; "titleAlignment": "titleAlignment"; }, {}, never, never>;
}
