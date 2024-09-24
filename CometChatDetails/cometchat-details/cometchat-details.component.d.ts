import { OnInit, ChangeDetectorRef, TemplateRef, OnChanges, SimpleChanges } from "@angular/core";
import { Subscription } from "rxjs";
import '@cometchat/uikit-elements';
import { AvatarStyle, BackdropStyle, ConfirmDialogStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { AddMembersConfiguration, BannedMembersConfiguration, DetailsStyle, GroupMembersConfiguration, TransferOwnershipConfiguration } from "@cometchat/uikit-shared";
import { CometChatDetailsOption, CometChatDetailsTemplate, SelectionMode } from '@cometchat/uikit-resources';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatThemeService } from "../../CometChatTheme.service";
import * as i0 from "@angular/core";
/**
*
* CometChatDetailsComponent renders details of user or group.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatDetailsComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    group: CometChat.Group;
    user: CometChat.User;
    title: string;
    closeButtonIconURL: string;
    hideProfile: boolean;
    subtitleView: TemplateRef<any>;
    customProfileView: TemplateRef<any>;
    data?: CometChatDetailsTemplate[];
    disableUsersPresence: boolean;
    privateGroupIcon: string;
    /**
    * @deprecated
    *
    * This property is deprecated as of version 4.3.7 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
    */
    protectedGroupIcon: string;
    passwordGroupIcon: string | undefined;
    onError: ((error: CometChat.CometChatException) => void) | null;
    onClose: () => void;
    leaveGroupConfirmButtonText: string;
    leaveGroupCancelButtonText: string;
    leaveGroupDialogMessage: string;
    leaveGroupDialogStyle: ConfirmDialogStyle;
    deleteGroupConfirmButtonText: string;
    deleteGroupDialogMessage: string;
    deleteGroupCancelButtonText: string;
    deleteGroupDialogStyle: ConfirmDialogStyle;
    transferOwnershipConfirmButtonText: string;
    transferOwnershipDialogMessage: string;
    transferOwnershipCancelButtonText: string;
    transferOwnershipDialogStyle: ConfirmDialogStyle;
    addMembersConfiguration: AddMembersConfiguration;
    bannedMembersConfiguration: BannedMembersConfiguration;
    groupMembersConfiguration: GroupMembersConfiguration;
    transferOwnershipConfiguration: TransferOwnershipConfiguration;
    backiconurl: string;
    statusIndicatorStyle: any;
    backdropStyle: BackdropStyle;
    avatarStyle: AvatarStyle;
    detailsStyle: DetailsStyle;
    listItemStyle: ListItemStyle;
    showTransferDialog: boolean;
    defaultTemplate: CometChatDetailsTemplate[];
    loggedInUser: CometChat.User | null;
    openViewMembersPage: boolean;
    openBannedMembersPage: boolean;
    openAddMembersPage: boolean;
    confirmLeaveGroupModal: boolean;
    openTransferOwnershipModal: boolean;
    selectionmodeEnum: SelectionMode;
    ccGroupMemberAdded: Subscription;
    ccGroupMemberJoined: Subscription;
    ccGroupMemberKicked: Subscription;
    ccGroupMemberBanned: Subscription;
    ccOwnershipChanged: Subscription;
    statusColor: any;
    closeButtonStyle: any;
    buttonStyle: any;
    dividerStyle: any;
    deleteGroupModal: boolean;
    getTitleStyle(): {
        textFont: string;
        textColor: string | undefined;
    };
    getCustomOptionView(option: CometChatDetailsOption): any;
    subtitleText: string;
    userListenerId: string;
    membersListenerId: string;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    getTemplate(): void;
    removeListener(): void;
    ngOnDestroy(): void;
    ngOnInit(): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    checkStatusType: () => any;
    updateSubtitle(): void;
    getButtonStyle(option: CometChatDetailsOption): {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        buttonTextFont: string | undefined;
        buttonTextColor: string | undefined;
        background: string;
    };
    checkGroupType(): string;
    updateUserStatus(user: CometChat.User): void;
    attachListeners(): void;
    getSectionHeaderStyle(template: CometChatDetailsTemplate): {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    onOptionClick(option: CometChatDetailsOption): void;
    onTransferClick(): void;
    onLeaveClick(): void;
    createActionMessage(actionOn: CometChat.GroupMember, action: string): import("@cometchat/chat-sdk-javascript").Action;
    createUserLeftAction(actionOn: CometChat.User, action: string): import("@cometchat/chat-sdk-javascript").Action;
    onCancelClick(): void;
    blockUser(): void;
    unBlockUser(): void;
    viewMembers: () => void;
    addMembers: () => void;
    bannedMembers: () => void;
    onBackForAddMembers: () => void;
    leaveGroup(): void;
    showDeleteDialog(): void;
    deleteGroup(): void;
    openTransferOwnership: () => void;
    onCloseDetails: () => void;
    subtitleStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    /**
   * @param  {CometChat.Group} group
   */
    getGroupIcon: (group: CometChat.Group) => string | null | undefined;
    /**
  * @param  {CometChat.Group} group
  */
    getStatusIndicatorColor(group: CometChat.Group): any;
    getTemplateOptions: (template: CometChatDetailsTemplate) => CometChatDetailsOption[];
    setThemeStyle(): void;
    setConfirmDialogStyle(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    setStatusStyle(): void;
    setDetailsStyle(): void;
    wrapperStyle: () => {
        width: string | undefined;
        height: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        background: string | undefined;
    };
    marginStyle: () => {
        padding: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatDetailsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatDetailsComponent, "cometchat-details", never, { "group": "group"; "user": "user"; "title": "title"; "closeButtonIconURL": "closeButtonIconURL"; "hideProfile": "hideProfile"; "subtitleView": "subtitleView"; "customProfileView": "customProfileView"; "data": "data"; "disableUsersPresence": "disableUsersPresence"; "privateGroupIcon": "privateGroupIcon"; "protectedGroupIcon": "protectedGroupIcon"; "passwordGroupIcon": "passwordGroupIcon"; "onError": "onError"; "onClose": "onClose"; "leaveGroupConfirmButtonText": "leaveGroupConfirmButtonText"; "leaveGroupCancelButtonText": "leaveGroupCancelButtonText"; "leaveGroupDialogMessage": "leaveGroupDialogMessage"; "leaveGroupDialogStyle": "leaveGroupDialogStyle"; "deleteGroupConfirmButtonText": "deleteGroupConfirmButtonText"; "deleteGroupDialogMessage": "deleteGroupDialogMessage"; "deleteGroupCancelButtonText": "deleteGroupCancelButtonText"; "deleteGroupDialogStyle": "deleteGroupDialogStyle"; "transferOwnershipConfirmButtonText": "transferOwnershipConfirmButtonText"; "transferOwnershipDialogMessage": "transferOwnershipDialogMessage"; "transferOwnershipCancelButtonText": "transferOwnershipCancelButtonText"; "transferOwnershipDialogStyle": "transferOwnershipDialogStyle"; "addMembersConfiguration": "addMembersConfiguration"; "bannedMembersConfiguration": "bannedMembersConfiguration"; "groupMembersConfiguration": "groupMembersConfiguration"; "transferOwnershipConfiguration": "transferOwnershipConfiguration"; "statusIndicatorStyle": "statusIndicatorStyle"; "backdropStyle": "backdropStyle"; "avatarStyle": "avatarStyle"; "detailsStyle": "detailsStyle"; "listItemStyle": "listItemStyle"; }, {}, never, never>;
}
