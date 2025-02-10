import { Component, Input, ChangeDetectionStrategy, } from "@angular/core";
import '@cometchat/uikit-elements';
import { AvatarStyle, ConfirmDialogStyle, ListItemStyle, } from '@cometchat/uikit-elements';
import { AddMembersConfiguration, BannedMembersConfiguration, CometChatUIKitUtility, DetailsStyle, DetailsUtils, GroupMembersConfiguration, TransferOwnershipConfiguration, } from "@cometchat/uikit-shared";
import { fontHelper, localize, CometChatGroupEvents, CometChatUIKitConstants, CometChatUserEvents, SelectionMode } from '@cometchat/uikit-resources';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { MessageUtils } from "../../Shared/Utils/MessageUtils";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatAddMembers/cometchat-add-members/cometchat-add-members.component";
import * as i3 from "../../CometChatBannedMembers/cometchat-banned-members/cometchat-banned-members.component";
import * as i4 from "../../CometChatGroupMembers/cometchat-group-members/cometchat-group-members.component";
import * as i5 from "../../CometChatTransferOwnership/cometchat-transfer-ownership/cometchat-transfer-ownership.component";
import * as i6 from "@angular/common";
/**
*
* CometChatDetailsComponent renders details of user or group.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatDetailsComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.title = localize("DETAILS");
        this.closeButtonIconURL = "assets/close2x.svg";
        this.hideProfile = false;
        this.disableUsersPresence = false;
        this.privateGroupIcon = "assets/Private.svg";
        /**
        * @deprecated
        *
        * This property is deprecated as of version 4.3.7 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
        */
        this.protectedGroupIcon = "assets/Locked.svg";
        this.passwordGroupIcon = undefined;
        this.onError = (error) => {
            console.log(error);
        };
        this.leaveGroupConfirmButtonText = localize("LEAVE_GROUP");
        this.leaveGroupCancelButtonText = localize("CANCEL");
        this.leaveGroupDialogMessage = localize("LEAVE_CONFIRM");
        this.leaveGroupDialogStyle = {
            confirmButtonBackground: "RGB(51, 153, 255)",
            cancelButtonBackground: "RGBA(20, 20, 20, 0.06)",
            confirmButtonTextColor: "white",
            confirmButtonTextFont: "600 15px Inter",
            cancelButtonTextColor: "black",
            cancelButtonTextFont: "600 15px Inter",
            titleFont: "",
            titleColor: "",
            messageTextFont: "400 13px Inter",
            messageTextColor: "RGBA(20, 20, 20, 0.58)",
            background: "white",
            border: "1px solid #F2F2F2",
            height: "180px",
            width: "360px"
        };
        this.deleteGroupConfirmButtonText = localize("DELETE");
        this.deleteGroupDialogMessage = localize("DELETE_CONFIRM");
        this.deleteGroupCancelButtonText = localize("CANCEL");
        this.deleteGroupDialogStyle = {
            height: "180px",
            width: "360px"
        };
        this.transferOwnershipConfirmButtonText = localize("TRANSFER_OWNERSHIP");
        this.transferOwnershipDialogMessage = localize("TRANSFER_CONFIRM");
        this.transferOwnershipCancelButtonText = localize("CANCEL");
        this.transferOwnershipDialogStyle = {
            height: "180px",
            width: "360px"
        };
        this.addMembersConfiguration = new AddMembersConfiguration({});
        this.bannedMembersConfiguration = new BannedMembersConfiguration({});
        this.groupMembersConfiguration = new GroupMembersConfiguration({});
        this.transferOwnershipConfiguration = new TransferOwnershipConfiguration({});
        this.backiconurl = "assets/backbutton.svg";
        this.statusIndicatorStyle = {
            height: "10px",
            width: "10px",
            borderRadius: "16px",
            border: ""
        };
        this.backdropStyle = {
            height: "100%",
            width: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            position: "fixed"
        };
        this.avatarStyle = {
            borderRadius: "16px",
            width: "28px",
            height: "28px",
            border: "none",
        };
        this.detailsStyle = {
            width: "100%",
            height: "100%",
            border: "",
            borderRadius: ""
        };
        this.listItemStyle = {
            height: "100%",
            width: "100%",
            background: "",
            activeBackground: "transparent",
            borderRadius: "grey",
            titleFont: "600 15px Inter",
            titleColor: "black",
            border: "",
            hoverBackground: "transparent",
            separatorColor: "rgb(222 222 222 / 46%)"
        };
        this.showTransferDialog = false;
        this.defaultTemplate = [];
        this.loggedInUser = null;
        this.openViewMembersPage = false;
        this.openBannedMembersPage = false;
        this.openAddMembersPage = false;
        this.confirmLeaveGroupModal = false;
        this.openTransferOwnershipModal = false;
        this.selectionmodeEnum = SelectionMode.multiple;
        this.statusColor = {
            private: "",
            password: "#F7A500",
            public: ""
        };
        this.closeButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            buttonIconTint: this.detailsStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
        };
        this.buttonStyle = {
            height: "100%",
            width: "100%",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            buttonTextColor: this.themeService.theme.palette.getPrimary() || "rgba(51, 153, 255)",
            buttonTextFont: "500 16px Inter"
        };
        this.dividerStyle = {
            background: "rgb(222 222 222 / 46%)",
            height: "1px",
            width: "100%"
        };
        this.deleteGroupModal = false;
        this.subtitleText = "";
        this.userListenerId = "userlist_" + new Date().getTime();
        this.membersListenerId = "memberlist_" + new Date().getTime();
        this.checkStatusType = () => {
            if (this.user) {
                let userStatusVisibility = !this.disableUsersPresence && !new MessageUtils().getUserStatusVisibility(this.user);
                return userStatusVisibility ? this.statusColor[this.user?.getStatus()] : null;
            }
            else if (this.group) {
                return this.statusColor[this.group?.getType()];
            }
            else
                return null;
        };
        this.viewMembers = () => {
            this.openViewMembersPage = !this.openViewMembersPage;
            this.openBannedMembersPage = false;
            this.openAddMembersPage = false;
            this.ref.detectChanges();
        };
        this.addMembers = () => {
            this.openAddMembersPage = !this.openAddMembersPage;
            this.openBannedMembersPage = false;
            this.openViewMembersPage = false;
            this.ref.detectChanges();
        };
        this.bannedMembers = () => {
            this.openAddMembersPage = false;
            this.openViewMembersPage = false;
            this.openBannedMembersPage = !this.openBannedMembersPage;
            this.ref.detectChanges();
        };
        this.onBackForAddMembers = () => {
            this.addMembers();
            if (this.addMembersConfiguration?.onBack) {
                this.addMembersConfiguration?.onBack();
            }
        };
        this.openTransferOwnership = () => {
            this.openTransferOwnershipModal = !this.openTransferOwnershipModal;
            this.confirmLeaveGroupModal = false;
        };
        this.onCloseDetails = () => {
            if (this.onClose) {
                this.onClose();
            }
        };
        this.subtitleStyle = () => {
            let hideUserStatus = this.user ? new MessageUtils().getUserStatusVisibility(this.user) : true;
            if (!this.disableUsersPresence && !hideUserStatus) {
                return {
                    textFont: this.detailsStyle.subtitleTextFont,
                    textColor: this.themeService.theme.palette.getPrimary()
                };
            }
            else {
                return {
                    textFont: this.detailsStyle.subtitleTextFont,
                    textColor: this.detailsStyle.subtitleTextColor
                };
            }
        };
        /**
       * @param  {CometChat.Group} group
       */
        this.getGroupIcon = (group) => {
            let status;
            if (group) {
                switch (group.getType()) {
                    case CometChatUIKitConstants.GroupTypes.password:
                        status = this.passwordGroupIcon || this.protectedGroupIcon;
                        break;
                    case CometChatUIKitConstants.GroupTypes.private:
                        status = this.privateGroupIcon;
                        break;
                    default:
                        status = null;
                        break;
                }
            }
            return status;
        };
        this.getTemplateOptions = (template) => {
            if (template.options) {
                return template.options(this.user, this.group, template.id);
            }
            else
                return [];
        };
        this.wrapperStyle = () => {
            return {
                width: this.detailsStyle.width,
                height: this.detailsStyle.height,
                border: this.detailsStyle.border,
                borderRadius: this.detailsStyle.borderRadius,
                background: this.detailsStyle.background,
            };
        };
        this.marginStyle = () => {
            return {
                padding: this.detailsStyle?.padding
            };
        };
    }
    getTitleStyle() {
        return {
            textFont: this.detailsStyle.titleTextFont || fontHelper(this.themeService.theme.typography.title1),
            textColor: this.detailsStyle.titleTextColor || this.themeService.theme.palette.getAccent()
        };
    }
    getCustomOptionView(option) {
        return option?.customView;
    }
    ngOnChanges(changes) {
        if (changes["user"] || changes["group"]) {
            if (this.loggedInUser) {
                this.getTemplate();
            }
            else {
                CometChat.getLoggedinUser().then((user) => {
                    this.loggedInUser = user;
                    this.getTemplate();
                }).catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            }
        }
    }
    getTemplate() {
        if (this.data) {
            this.defaultTemplate = this.data;
            this.ref.detectChanges();
        }
        else {
            this.defaultTemplate = DetailsUtils.getDefaultDetailsTemplate(this.loggedInUser, this.user, this.group, this.themeService.theme);
            this.ref.detectChanges();
        }
    }
    removeListener() {
        CometChat.removeUserListener(this.userListenerId);
        CometChat.removeGroupListener(this.membersListenerId);
    }
    ngOnDestroy() {
        this.removeListener();
        this.defaultTemplate = [];
        this.onCloseDetails();
        this.unsubscribeToEvents();
    }
    ngOnInit() {
        this.setThemeStyle();
        this.subscribeToEvents();
        this.statusColor.online = this.detailsStyle.onlineStatusColor || this.themeService.theme.palette.getSuccess();
        this.attachListeners();
        this.updateSubtitle();
    }
    subscribeToEvents() {
        this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item) => {
            this.group = item?.userAddedIn;
            this.group = item?.userAddedIn;
            this.updateSubtitle();
            this.ref.detectChanges();
        });
        this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item) => {
            this.group = item?.joinedGroup;
            this.updateSubtitle();
            this.ref.detectChanges();
        });
        this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item) => {
            this.group = item?.kickedFrom;
            this.updateSubtitle();
            this.ref.detectChanges();
        });
        this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
            this.group = item?.kickedFrom;
            this.updateSubtitle();
            this.ref.detectChanges();
        });
        this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item) => {
            this.group = item?.group;
            this.updateSubtitle();
            this.confirmLeaveGroupModal = false;
            this.openTransferOwnershipModal = false;
            this.ref.detectChanges();
        });
    }
    unsubscribeToEvents() {
        this.ccGroupMemberAdded?.unsubscribe();
        this.ccGroupMemberJoined?.unsubscribe();
        this.ccGroupMemberKicked?.unsubscribe();
        this.ccGroupMemberBanned?.unsubscribe();
        this.ccOwnershipChanged?.unsubscribe();
    }
    updateSubtitle() {
        const count = this.group?.getMembersCount();
        const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
        if (this.user) {
            let userStatusVisibility = !this.disableUsersPresence && !this.user.getBlockedByMe() && !this.user.getHasBlockedMe();
            this.subtitleText = userStatusVisibility ? this.user.getStatus() : "";
        }
        else if (this.group) {
            this.subtitleText = `${count} ${membersText}`;
        }
        this.ref.detectChanges();
    }
    getButtonStyle(option) {
        return {
            height: "100%",
            width: "100%",
            border: "none",
            borderRadius: "0",
            buttonTextFont: option?.titleFont,
            buttonTextColor: option?.titleColor,
            background: option?.backgroundColor || "transparent"
        };
    }
    checkGroupType() {
        let image = "";
        if (this.group) {
            switch (this.group?.getType()) {
                case CometChatUIKitConstants.GroupTypes.password:
                    image = this.passwordGroupIcon || this.protectedGroupIcon;
                    break;
                case CometChatUIKitConstants.GroupTypes.private:
                    image = this.privateGroupIcon;
                    break;
                default:
                    image = "";
                    break;
            }
        }
        return image;
    }
    updateUserStatus(user) {
        if (this.user && this.user.getUid() && this.user.getUid() === user.getUid()) {
            this.user.setStatus(user.getStatus());
            this.updateSubtitle();
        }
        // this.ref.detectChanges();
    }
    attachListeners() {
        try {
            if (!this.disableUsersPresence) {
                CometChat.addUserListener(this.userListenerId, new CometChat.UserListener({
                    onUserOnline: (onlineUser) => {
                        /* when someuser/friend comes online, user will be received here */
                        this.updateUserStatus(onlineUser);
                    },
                    onUserOffline: (offlineUser) => {
                        /* when someuser/friend went offline, user will be received here */
                        this.updateUserStatus(offlineUser);
                    },
                }));
            }
            CometChat.addGroupListener(this.membersListenerId, new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    if (changedUser.getUid() == this.loggedInUser?.getUid()) {
                        changedGroup.setScope(newScope);
                        this.group = changedGroup;
                        this.getTemplate();
                    }
                },
            }));
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    getSectionHeaderStyle(template) {
        return {
            textFont: template.titleFont,
            textColor: template.titleColor
        };
    }
    onOptionClick(option) {
        const { onClick, id } = option;
        if (onClick) {
            onClick(this.user ?? this.group);
            return;
        }
        switch (id) {
            case CometChatUIKitConstants.UserOptions.viewProfile:
                if (this.user?.getLink()) {
                    window.location.href = this.user.getLink();
                }
                break;
            case CometChatUIKitConstants.UserOptions.block:
                this.blockUser();
                break;
            case CometChatUIKitConstants.UserOptions.unblock:
                this.unBlockUser();
                break;
            case CometChatUIKitConstants.GroupOptions.viewMembers:
                this.viewMembers();
                break;
            case CometChatUIKitConstants.GroupOptions.addMembers:
                this.addMembers();
                break;
            case CometChatUIKitConstants.GroupOptions.bannedMembers:
                this.bannedMembers();
                break;
            case CometChatUIKitConstants.GroupOptions.leave:
                this.leaveGroup();
                break;
            case CometChatUIKitConstants.GroupOptions.delete:
                this.showDeleteDialog();
                break;
            default:
                break;
        }
    }
    onTransferClick() {
        if (this.group.getOwner() == this.loggedInUser?.getUid()) {
            this.openTransferOwnershipModal = true;
            this.confirmLeaveGroupModal = false;
            this.showTransferDialog = false;
        }
    }
    onLeaveClick() {
        CometChat.leaveGroup(this.group.getGuid())
            .then((response) => {
            this.group.setMembersCount(this.group.getMembersCount() - 1);
            this.group.setHasJoined(false);
            this.updateSubtitle();
            this.ref.detectChanges();
            this.openTransferOwnershipModal = false;
            this.confirmLeaveGroupModal = false;
            this.onCloseDetails();
            CometChatGroupEvents.ccGroupLeft.next({
                userLeft: this.loggedInUser,
                leftGroup: this.group,
                message: this.createUserLeftAction(this.loggedInUser, CometChatUIKitConstants.groupMemberAction.LEFT)
            });
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    createActionMessage(actionOn, action) {
        let actionMessage = new CometChat.Action(this.group.getGuid(), CometChatUIKitConstants.MessageTypes.groupMember, CometChatUIKitConstants.MessageReceiverType.group, CometChatUIKitConstants.MessageCategory.action);
        actionMessage.setAction(action);
        actionMessage.setActionBy(this.loggedInUser);
        actionMessage.setActionFor(this.group);
        actionMessage.setActionOn(actionOn);
        actionMessage.setReceiver(this.group);
        actionMessage.setSender(this.loggedInUser);
        actionMessage.setConversationId("group_" + this.group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setMessage(`${this.loggedInUser?.getName()} ${action} ${actionOn.getName()}`);
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        actionMessage.setNewScope(actionOn.getScope());
        actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
        return actionMessage;
    }
    createUserLeftAction(actionOn, action) {
        let actionMessage = new CometChat.Action(this.group.getGuid(), CometChatUIKitConstants.MessageTypes.groupMember, CometChatUIKitConstants.MessageReceiverType.group, CometChatUIKitConstants.MessageCategory.action);
        actionMessage.setAction(action);
        actionMessage.setActionBy(this.loggedInUser);
        actionMessage.setActionFor(this.group);
        actionMessage.setActionOn(actionOn);
        actionMessage.setReceiver(this.group);
        actionMessage.setSender(this.loggedInUser);
        actionMessage.setConversationId("group_" + this.group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
        let message = CometChatUIKitConstants.groupMemberAction.LEFT ? `${this.loggedInUser?.getName()} ${action}` : `${this.loggedInUser?.getName()} ${action} ${actionOn.getName()}`;
        actionMessage.setMessage(message);
        return actionMessage;
    }
    onCancelClick() {
        this.confirmLeaveGroupModal = false;
        this.deleteGroupModal = false;
        this.showTransferDialog = false;
    }
    blockUser() {
        // block user
        if (this.user && !this.user.getBlockedByMe()) {
            CometChat.blockUsers([this.user.getUid()]).then(() => {
                this.user.setBlockedByMe(true);
                CometChatUserEvents.ccUserBlocked.next(this.user);
                this.updateSubtitle();
                this.getTemplate();
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
        }
    }
    unBlockUser() {
        // unblock user
        if (this.user && this.user.getBlockedByMe()) {
            CometChat.unblockUsers([this.user.getUid()]).then(() => {
                this.user.setBlockedByMe(false);
                CometChatUserEvents.ccUserUnblocked.next(this.user);
                this.getTemplate();
                this.updateSubtitle();
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
        }
    }
    leaveGroup() {
        if (this.group.getOwner() == this.loggedInUser?.getUid()) {
            this.showTransferDialog = true;
            this.confirmLeaveGroupModal = false;
        }
        else {
            this.showTransferDialog = false;
        }
        this.confirmLeaveGroupModal = true;
        this.ref.detectChanges();
    }
    showDeleteDialog() {
        this.deleteGroupModal = true;
    }
    deleteGroup() {
        this.deleteGroupModal = false;
        CometChat.deleteGroup(this.group?.getGuid()).then(() => {
            this.deleteGroupModal = false;
            CometChatGroupEvents.ccGroupDeleted.next(this.group);
            this.onCloseDetails();
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    /**
  * @param  {CometChat.Group} group
  */
    getStatusIndicatorColor(group) {
        return this.statusColor[group?.getType()];
    }
    setThemeStyle() {
        this.setDetailsStyle();
        this.setAvatarStyle();
        this.setStatusStyle();
        this.setListItemStyle();
        this.setConfirmDialogStyle();
        this.statusColor.private = this.detailsStyle.privateGroupIconBackground;
        this.statusColor.online = this.detailsStyle.onlineStatusColor;
        this.statusColor.password = this.detailsStyle.passwordGroupIconBackground;
    }
    setConfirmDialogStyle() {
        let defaultStyle = new ConfirmDialogStyle({
            confirmButtonBackground: this.themeService.theme.palette.getPrimary(),
            cancelButtonBackground: this.themeService.theme.palette.getSecondary(),
            confirmButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
            confirmButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            cancelButtonTextColor: this.themeService.theme.palette.getAccent900("dark"),
            cancelButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            messageTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            messageTextColor: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            height: "100%",
            width: "350px",
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            borderRadius: "8px"
        });
        let defaultDeleteDialogStyle = new ConfirmDialogStyle({
            confirmButtonBackground: this.themeService.theme.palette.getError(),
            cancelButtonBackground: this.themeService.theme.palette.getSecondary(),
            confirmButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
            confirmButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            cancelButtonTextColor: this.themeService.theme.palette.getAccent900("dark"),
            cancelButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            messageTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            messageTextColor: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            height: "100%",
            width: "350px",
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            borderRadius: "8px"
        });
        this.leaveGroupDialogStyle = { ...defaultStyle, ...this.leaveGroupDialogStyle };
        this.transferOwnershipDialogStyle = { ...defaultStyle, ...this.transferOwnershipDialogStyle };
        this.deleteGroupDialogStyle = { ...defaultDeleteDialogStyle, ...this.deleteGroupDialogStyle };
    }
    setListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: "transparent",
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            hoverBackground: "transparent"
        });
        this.listItemStyle = { ...defaultStyle, ...this.listItemStyle };
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "36px",
            height: "36px",
            border: "none",
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
    setStatusStyle() {
        let defaultStyle = {
            height: "12px",
            width: "12px",
            border: "none",
            borderRadius: "24px",
        };
        this.statusIndicatorStyle = { ...defaultStyle, ...this.statusIndicatorStyle };
    }
    setDetailsStyle() {
        let defaultStyle = new DetailsStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            privateGroupIconBackground: this.themeService.theme.palette.getSuccess(),
            passwordGroupIconBackground: "RGB(247, 165, 0)",
            closeButtonIconTint: this.themeService.theme.palette.getPrimary(),
            width: "100%",
            height: "100%",
            borderRadius: "",
            subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            subtitleTextColor: this.themeService.theme.palette.getAccent600(),
            padding: "0 100px"
        });
        this.detailsStyle = { ...defaultStyle, ...this.detailsStyle };
    }
}
CometChatDetailsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetailsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatDetailsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatDetailsComponent, selector: "cometchat-details", inputs: { group: "group", user: "user", title: "title", closeButtonIconURL: "closeButtonIconURL", hideProfile: "hideProfile", subtitleView: "subtitleView", customProfileView: "customProfileView", data: "data", disableUsersPresence: "disableUsersPresence", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", onError: "onError", onClose: "onClose", leaveGroupConfirmButtonText: "leaveGroupConfirmButtonText", leaveGroupCancelButtonText: "leaveGroupCancelButtonText", leaveGroupDialogMessage: "leaveGroupDialogMessage", leaveGroupDialogStyle: "leaveGroupDialogStyle", deleteGroupConfirmButtonText: "deleteGroupConfirmButtonText", deleteGroupDialogMessage: "deleteGroupDialogMessage", deleteGroupCancelButtonText: "deleteGroupCancelButtonText", deleteGroupDialogStyle: "deleteGroupDialogStyle", transferOwnershipConfirmButtonText: "transferOwnershipConfirmButtonText", transferOwnershipDialogMessage: "transferOwnershipDialogMessage", transferOwnershipCancelButtonText: "transferOwnershipCancelButtonText", transferOwnershipDialogStyle: "transferOwnershipDialogStyle", addMembersConfiguration: "addMembersConfiguration", bannedMembersConfiguration: "bannedMembersConfiguration", groupMembersConfiguration: "groupMembersConfiguration", transferOwnershipConfiguration: "transferOwnershipConfiguration", statusIndicatorStyle: "statusIndicatorStyle", backdropStyle: "backdropStyle", avatarStyle: "avatarStyle", detailsStyle: "detailsStyle", listItemStyle: "listItemStyle" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-details__wrapper\" *ngIf=\"user || group\"\n  [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-details__header\">\n    <cometchat-label [text]=\"title\"\n      [labelStyle]=\"getTitleStyle()\"></cometchat-label>\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-details\" [ngStyle]=\"marginStyle()\">\n    <div class=\"cc-details__profile\" *ngIf=\"!hideProfile\">\n      <cometchat-list-item *ngIf=\"!customProfileView;else listitem\"\n        [avatarName]=\"user?.getName() ?? this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() ?? this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() ?? this.group?.getName()\"\n        [hideSeparator]=\"false\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n            </ng-container>\n          </ng-template>\n        </div>\n      </cometchat-list-item>\n    </div>\n    <div class=\"cc-details__section-list\"\n      *ngIf=\"defaultTemplate && defaultTemplate.length > 0\">\n      <div class=\"cc-details__section\" *ngFor=\"let item of defaultTemplate\">\n        <div class=\"cc-details__section-separator\" *ngIf=\"item.title\">\n          <cometchat-label [text]=\"item.title\"\n            [labelStyle]=\"getSectionHeaderStyle(item)\"></cometchat-label>\n        </div>\n        <div class=\"cc-details__options-wrapper\"\n          *ngIf=\"getTemplateOptions(item)\">\n          <div class=\"cc-details__options\"\n            *ngFor=\"let option of getTemplateOptions(item)\">\n            <div class=\"cc-details__option\"\n              *ngIf=\"!getCustomOptionView(option);else customView\"\n              (click)=\"onOptionClick(option)\">\n              <div class=\"cc-details__option-title\">\n                <cometchat-button [text]=\"option.title\"\n                  [buttonStyle]=\"getButtonStyle(option)\"></cometchat-button>\n                <div class=\"cc-details__option-tail\" *ngIf=\"option?.tail\">\n                  <ng-container *ngTemplateOutlet=\"option?.tail\"></ng-container>\n                </div>\n              </div>\n              <cometchat-divider\n                [dividerStyle]=\"dividerStyle\"></cometchat-divider>\n            </div>\n            <ng-template #customView>\n              <ng-container *ngTemplateOutlet=\"getCustomOptionView(option)\">\n              </ng-container>\n            </ng-template>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template #listitem>\n  <ng-container *ngTemplateOutlet=\"customProfileView\">\n  </ng-container>\n</ng-template>\n<div class=\"cc-details__view\" *ngIf=\"openAddMembersPage\">\n  <cometchat-add-members\n    [titleAlignment]=\"addMembersConfiguration?.titleAlignment!\"\n    [listItemStyle]=\"addMembersConfiguration?.listItemStyle!\"\n    [addMembersStyle]=\"addMembersConfiguration?.addMembersStyle!\"\n    [avatarStyle]=\"addMembersConfiguration?.avatarStyle!\"\n    [statusIndicatorStyle]=\"addMembersConfiguration?.statusIndicatorStyle!\"\n    [loadingStateView]=\"addMembersConfiguration?.loadingStateView!\"\n    [loadingIconURL]=\"addMembersConfiguration?.loadingIconURL!\"\n    [errorStateView]=\"addMembersConfiguration?.errorStateView\"\n    [emptyStateView]=\"addMembersConfiguration?.emptyStateView\"\n    [onSelect]=\"addMembersConfiguration?.onSelect!\"\n    [onError]=\"addMembersConfiguration?.onError!\"\n    [hideError]=\"addMembersConfiguration?.hideError!\"\n    [hideSearch]=\"addMembersConfiguration?.hideSearch!\"\n    [searchIconURL]=\"addMembersConfiguration?.searchIconURL!\"\n    [selectionMode]=\"addMembersConfiguration?.selectionMode!\"\n    [hideSeparator]=\"addMembersConfiguration?.hideSeparator!\"\n    [showBackButton]=\"addMembersConfiguration?.showBackButton!\"\n    [showSectionHeader]=\"addMembersConfiguration?.showSectionHeader!\"\n    [onAddMembersButtonClick]=\"addMembersConfiguration?.onAddMembersButtonClick!\"\n    [usersConfiguration]=\"addMembersConfiguration?.usersConfiguration\"\n    [backButtonIconURL]=\"addMembersConfiguration?.backButtonIconURL!\"\n    [sectionHeaderField]=\"addMembersConfiguration?.sectionHeaderField!\"\n    [closeButtonIconURL]=\"addMembersConfiguration?.closeButtonIconURL!\"\n    [options]=\"addMembersConfiguration?.options!\"\n    [menu]=\"addMembersConfiguration?.menu\"\n    [disableUsersPresence]=\"addMembersConfiguration?.disableUsersPresence!\"\n    [subtitleView]=\"addMembersConfiguration?.subtitleView\" [group]=\"group\"\n    [selectionMode]=\"selectionmodeEnum\"\n    [onClose]=\"addMembersConfiguration?.onClose || onCloseDetails\"\n    [onBack]=\"onBackForAddMembers\"\n    [usersRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [searchRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [listItemView]=\"addMembersConfiguration?.listItemView\">\n  </cometchat-add-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openBannedMembersPage\">\n  <cometchat-banned-members\n    [listItemView]=\"bannedMembersConfiguration?.listItemView\"\n    [bannedMembersRequestBuilder]=\"bannedMembersConfiguration?.bannedMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"bannedMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"bannedMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"bannedMembersConfiguration.listItemStyle\"\n    [bannedMembersStyle]=\"bannedMembersConfiguration.bannedMembersStyle\"\n    [avatarStyle]=\"bannedMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"bannedMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"bannedMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"bannedMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"bannedMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"bannedMembersConfiguration.emptyStateView\"\n    [onSelect]=\"bannedMembersConfiguration.onSelect\"\n    [onError]=\"bannedMembersConfiguration.onError\"\n    [hideError]=\"bannedMembersConfiguration.hideError\"\n    [hideSearch]=\"bannedMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"bannedMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"bannedMembersConfiguration.selectionMode\"\n    [hideSeparator]=\"bannedMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"bannedMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"bannedMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"bannedMembersConfiguration.closeButtonIconURL\"\n    [options]=\"bannedMembersConfiguration.options\"\n    [menu]=\"bannedMembersConfiguration.menu\"\n    [disableUsersPresence]=\"bannedMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"bannedMembersConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"onCloseDetails\"\n    [onBack]=\"bannedMembersConfiguration.onBack || bannedMembers\">\n  </cometchat-banned-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openViewMembersPage\">\n  <cometchat-group-members\n    [groupMembersRequestBuilder]=\"groupMembersConfiguration?.groupMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"groupMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"groupMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"groupMembersConfiguration.listItemStyle\"\n    [groupMembersStyle]=\"groupMembersConfiguration.groupMembersStyle\"\n    [avatarStyle]=\"groupMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"groupMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"groupMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"groupMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"groupMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"groupMembersConfiguration.emptyStateView\"\n    [onSelect]=\"groupMembersConfiguration.onSelect\"\n    [onError]=\"groupMembersConfiguration.onError\"\n    [hideError]=\"groupMembersConfiguration.hideError\"\n    [hideSearch]=\"groupMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"groupMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"groupMembersConfiguration.selectionMode\"\n    [backdropStyle]=\"groupMembersConfiguration.backdropStyle\"\n    [hideSeparator]=\"groupMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"groupMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"groupMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"groupMembersConfiguration.closeButtonIconURL\"\n    [options]=\"groupMembersConfiguration.options\"\n    [menu]=\"groupMembersConfiguration.menu\"\n    [disableUsersPresence]=\"groupMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"groupMembersConfiguration.subtitleView\"\n    [groupScopeStyle]=\"groupMembersConfiguration.groupScopeStyle\"\n    [group]=\"group\"\n    [onClose]=\" groupMembersConfiguration.onClose || onCloseDetails\"\n    [onBack]=\"groupMembersConfiguration.onBack || viewMembers\">\n  </cometchat-group-members>\n</div>\n\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"confirmLeaveGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"leaveGroupDialogMessage\"\n    [cancelButtonText]=\"leaveGroupCancelButtonText\"\n    [confirmButtonText]=\"leaveGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"onLeaveClick()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"leaveGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"showTransferDialog\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"transferOwnershipDialogMessage\"\n    [cancelButtonText]=\"transferOwnershipCancelButtonText\"\n    [confirmButtonText]=\"transferOwnershipConfirmButtonText\"\n    (cc-confirm-clicked)=\"onTransferClick()\"\n    (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"transferOwnershipDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"openTransferOwnershipModal\">\n  <cometchat-transfer-ownership\n    [groupMembersRequestBuilder]=\"transferOwnershipConfiguration?.groupMembersRequestBuilder\"\n    [transferOwnershipStyle]=\"transferOwnershipConfiguration.transferOwnershipStyle\"\n    [onTransferOwnership]=\"transferOwnershipConfiguration.onTransferOwnership\"\n    [titleAlignment]=\"transferOwnershipConfiguration.titleAlignment\"\n    [listItemStyle]=\"transferOwnershipConfiguration.listItemStyle\"\n    [avatarStyle]=\"transferOwnershipConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"transferOwnershipConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"transferOwnershipConfiguration.loadingStateView\"\n    [loadingIconURL]=\"transferOwnershipConfiguration.loadingIconURL\"\n    [errorStateView]=\"transferOwnershipConfiguration.errorStateView\"\n    [emptyStateView]=\"transferOwnershipConfiguration.emptyStateView\"\n    [onError]=\"transferOwnershipConfiguration.onError\"\n    [hideSearch]=\"transferOwnershipConfiguration.hideSearch\"\n    [searchIconURL]=\"transferOwnershipConfiguration.searchIconURL\"\n    [hideSeparator]=\"transferOwnershipConfiguration.hideSeparator\"\n    [closeButtonIconURL]=\"transferOwnershipConfiguration.closeButtonIconURL\"\n    [options]=\"transferOwnershipConfiguration.options\"\n    [disableUsersPresence]=\"transferOwnershipConfiguration.disableUsersPresence\"\n    [subtitleView]=\"transferOwnershipConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"transferOwnershipConfiguration.onClose || openTransferOwnership\">\n  </cometchat-transfer-ownership>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"deleteGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"deleteGroupDialogMessage\"\n    [cancelButtonText]=\"deleteGroupCancelButtonText\"\n    [confirmButtonText]=\"deleteGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"deleteGroup()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"deleteGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n", styles: ["*{box-sizing:border-box;margin:0;padding:0}.cc-details__wrapper{padding:8px;border-radius:5px;height:100%;overflow:hidden}.cc-details__profile{margin-bottom:50px;height:8%}.cc-details__section-list{height:84%;width:100%;overflow-y:auto;overflow-x:hidden}.cc-details__header{display:flex;justify-content:center;align-items:center;margin-bottom:30px}.cc-details__close-button{position:absolute;right:20px}.cc-details__section{margin-bottom:32px}.cc-details__section-separator{margin-bottom:16px;padding-left:6px;height:5%}.cc-details__options-wrapper{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}.cc-details__option{display:flex;flex-direction:column;justify-content:space-evenly;min-height:50px}.cc-details__option-title{padding-bottom:12px;display:flex;align-items:center;justify-content:space-between}.cc-details__view{position:absolute;top:0;left:0;height:100%;width:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;max-width:100%;z-index:1}.cc-details__section-list::-webkit-scrollbar{background:transparent;width:8px}.cc-details__section-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-details__leavedialog,.cc-details__transferownership{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:-moz-fit-content;height:fit-content;width:100%;z-index:2}\n"], components: [{ type: i2.CometChatAddMembersComponent, selector: "cometchat-add-members", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "hideError", "searchIconURL", "hideSearch", "title", "onError", "onBack", "onClose", "onSelect", "buttonText", "group", "emptyStateView", "errorStateView", "loadingIconURL", "listItemStyle", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "onAddMembersButtonClick", "titleAlignment", "addMembersStyle", "StatusIndicatorStyle", "statusIndicatorStyle", "avatarStyle"] }, { type: i3.CometChatBannedMembersComponent, selector: "cometchat-banned-members", inputs: ["bannedMembersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onSelect", "onBack", "onClose", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "unbanIconURL", "statusIndicatorStyle", "avatarStyle", "bannedMembersStyle", "listItemStyle"] }, { type: i4.CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "tailView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "backdropStyle", "onBack", "onClose", "onSelect", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "dropdownIconURL", "statusIndicatorStyle", "avatarStyle", "groupMembersStyle", "groupScopeStyle", "listItemStyle", "onItemClick", "onEmpty", "userPresencePlacement", "disableLoadingState", "searchKeyword"] }, { type: i5.CometChatTransferOwnershipComponent, selector: "cometchat-transfer-ownership", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "options", "closeButtonIconURL", "hideSeparator", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onClose", "onTransferOwnership", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "statusIndicatorStyle", "transferOwnershipStyle", "transferButtonText", "cancelButtonText", "avatarStyle", "groupMembersStyle", "listItemStyle", "titleAlignment"] }], directives: [{ type: i6.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i6.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i6.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i6.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetailsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-details", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-details__wrapper\" *ngIf=\"user || group\"\n  [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-details__header\">\n    <cometchat-label [text]=\"title\"\n      [labelStyle]=\"getTitleStyle()\"></cometchat-label>\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-details\" [ngStyle]=\"marginStyle()\">\n    <div class=\"cc-details__profile\" *ngIf=\"!hideProfile\">\n      <cometchat-list-item *ngIf=\"!customProfileView;else listitem\"\n        [avatarName]=\"user?.getName() ?? this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() ?? this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() ?? this.group?.getName()\"\n        [hideSeparator]=\"false\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n            </ng-container>\n          </ng-template>\n        </div>\n      </cometchat-list-item>\n    </div>\n    <div class=\"cc-details__section-list\"\n      *ngIf=\"defaultTemplate && defaultTemplate.length > 0\">\n      <div class=\"cc-details__section\" *ngFor=\"let item of defaultTemplate\">\n        <div class=\"cc-details__section-separator\" *ngIf=\"item.title\">\n          <cometchat-label [text]=\"item.title\"\n            [labelStyle]=\"getSectionHeaderStyle(item)\"></cometchat-label>\n        </div>\n        <div class=\"cc-details__options-wrapper\"\n          *ngIf=\"getTemplateOptions(item)\">\n          <div class=\"cc-details__options\"\n            *ngFor=\"let option of getTemplateOptions(item)\">\n            <div class=\"cc-details__option\"\n              *ngIf=\"!getCustomOptionView(option);else customView\"\n              (click)=\"onOptionClick(option)\">\n              <div class=\"cc-details__option-title\">\n                <cometchat-button [text]=\"option.title\"\n                  [buttonStyle]=\"getButtonStyle(option)\"></cometchat-button>\n                <div class=\"cc-details__option-tail\" *ngIf=\"option?.tail\">\n                  <ng-container *ngTemplateOutlet=\"option?.tail\"></ng-container>\n                </div>\n              </div>\n              <cometchat-divider\n                [dividerStyle]=\"dividerStyle\"></cometchat-divider>\n            </div>\n            <ng-template #customView>\n              <ng-container *ngTemplateOutlet=\"getCustomOptionView(option)\">\n              </ng-container>\n            </ng-template>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template #listitem>\n  <ng-container *ngTemplateOutlet=\"customProfileView\">\n  </ng-container>\n</ng-template>\n<div class=\"cc-details__view\" *ngIf=\"openAddMembersPage\">\n  <cometchat-add-members\n    [titleAlignment]=\"addMembersConfiguration?.titleAlignment!\"\n    [listItemStyle]=\"addMembersConfiguration?.listItemStyle!\"\n    [addMembersStyle]=\"addMembersConfiguration?.addMembersStyle!\"\n    [avatarStyle]=\"addMembersConfiguration?.avatarStyle!\"\n    [statusIndicatorStyle]=\"addMembersConfiguration?.statusIndicatorStyle!\"\n    [loadingStateView]=\"addMembersConfiguration?.loadingStateView!\"\n    [loadingIconURL]=\"addMembersConfiguration?.loadingIconURL!\"\n    [errorStateView]=\"addMembersConfiguration?.errorStateView\"\n    [emptyStateView]=\"addMembersConfiguration?.emptyStateView\"\n    [onSelect]=\"addMembersConfiguration?.onSelect!\"\n    [onError]=\"addMembersConfiguration?.onError!\"\n    [hideError]=\"addMembersConfiguration?.hideError!\"\n    [hideSearch]=\"addMembersConfiguration?.hideSearch!\"\n    [searchIconURL]=\"addMembersConfiguration?.searchIconURL!\"\n    [selectionMode]=\"addMembersConfiguration?.selectionMode!\"\n    [hideSeparator]=\"addMembersConfiguration?.hideSeparator!\"\n    [showBackButton]=\"addMembersConfiguration?.showBackButton!\"\n    [showSectionHeader]=\"addMembersConfiguration?.showSectionHeader!\"\n    [onAddMembersButtonClick]=\"addMembersConfiguration?.onAddMembersButtonClick!\"\n    [usersConfiguration]=\"addMembersConfiguration?.usersConfiguration\"\n    [backButtonIconURL]=\"addMembersConfiguration?.backButtonIconURL!\"\n    [sectionHeaderField]=\"addMembersConfiguration?.sectionHeaderField!\"\n    [closeButtonIconURL]=\"addMembersConfiguration?.closeButtonIconURL!\"\n    [options]=\"addMembersConfiguration?.options!\"\n    [menu]=\"addMembersConfiguration?.menu\"\n    [disableUsersPresence]=\"addMembersConfiguration?.disableUsersPresence!\"\n    [subtitleView]=\"addMembersConfiguration?.subtitleView\" [group]=\"group\"\n    [selectionMode]=\"selectionmodeEnum\"\n    [onClose]=\"addMembersConfiguration?.onClose || onCloseDetails\"\n    [onBack]=\"onBackForAddMembers\"\n    [usersRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [searchRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [listItemView]=\"addMembersConfiguration?.listItemView\">\n  </cometchat-add-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openBannedMembersPage\">\n  <cometchat-banned-members\n    [listItemView]=\"bannedMembersConfiguration?.listItemView\"\n    [bannedMembersRequestBuilder]=\"bannedMembersConfiguration?.bannedMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"bannedMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"bannedMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"bannedMembersConfiguration.listItemStyle\"\n    [bannedMembersStyle]=\"bannedMembersConfiguration.bannedMembersStyle\"\n    [avatarStyle]=\"bannedMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"bannedMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"bannedMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"bannedMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"bannedMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"bannedMembersConfiguration.emptyStateView\"\n    [onSelect]=\"bannedMembersConfiguration.onSelect\"\n    [onError]=\"bannedMembersConfiguration.onError\"\n    [hideError]=\"bannedMembersConfiguration.hideError\"\n    [hideSearch]=\"bannedMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"bannedMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"bannedMembersConfiguration.selectionMode\"\n    [hideSeparator]=\"bannedMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"bannedMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"bannedMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"bannedMembersConfiguration.closeButtonIconURL\"\n    [options]=\"bannedMembersConfiguration.options\"\n    [menu]=\"bannedMembersConfiguration.menu\"\n    [disableUsersPresence]=\"bannedMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"bannedMembersConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"onCloseDetails\"\n    [onBack]=\"bannedMembersConfiguration.onBack || bannedMembers\">\n  </cometchat-banned-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openViewMembersPage\">\n  <cometchat-group-members\n    [groupMembersRequestBuilder]=\"groupMembersConfiguration?.groupMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"groupMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"groupMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"groupMembersConfiguration.listItemStyle\"\n    [groupMembersStyle]=\"groupMembersConfiguration.groupMembersStyle\"\n    [avatarStyle]=\"groupMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"groupMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"groupMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"groupMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"groupMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"groupMembersConfiguration.emptyStateView\"\n    [onSelect]=\"groupMembersConfiguration.onSelect\"\n    [onError]=\"groupMembersConfiguration.onError\"\n    [hideError]=\"groupMembersConfiguration.hideError\"\n    [hideSearch]=\"groupMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"groupMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"groupMembersConfiguration.selectionMode\"\n    [backdropStyle]=\"groupMembersConfiguration.backdropStyle\"\n    [hideSeparator]=\"groupMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"groupMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"groupMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"groupMembersConfiguration.closeButtonIconURL\"\n    [options]=\"groupMembersConfiguration.options\"\n    [menu]=\"groupMembersConfiguration.menu\"\n    [disableUsersPresence]=\"groupMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"groupMembersConfiguration.subtitleView\"\n    [groupScopeStyle]=\"groupMembersConfiguration.groupScopeStyle\"\n    [group]=\"group\"\n    [onClose]=\" groupMembersConfiguration.onClose || onCloseDetails\"\n    [onBack]=\"groupMembersConfiguration.onBack || viewMembers\">\n  </cometchat-group-members>\n</div>\n\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"confirmLeaveGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"leaveGroupDialogMessage\"\n    [cancelButtonText]=\"leaveGroupCancelButtonText\"\n    [confirmButtonText]=\"leaveGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"onLeaveClick()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"leaveGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"showTransferDialog\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"transferOwnershipDialogMessage\"\n    [cancelButtonText]=\"transferOwnershipCancelButtonText\"\n    [confirmButtonText]=\"transferOwnershipConfirmButtonText\"\n    (cc-confirm-clicked)=\"onTransferClick()\"\n    (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"transferOwnershipDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"openTransferOwnershipModal\">\n  <cometchat-transfer-ownership\n    [groupMembersRequestBuilder]=\"transferOwnershipConfiguration?.groupMembersRequestBuilder\"\n    [transferOwnershipStyle]=\"transferOwnershipConfiguration.transferOwnershipStyle\"\n    [onTransferOwnership]=\"transferOwnershipConfiguration.onTransferOwnership\"\n    [titleAlignment]=\"transferOwnershipConfiguration.titleAlignment\"\n    [listItemStyle]=\"transferOwnershipConfiguration.listItemStyle\"\n    [avatarStyle]=\"transferOwnershipConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"transferOwnershipConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"transferOwnershipConfiguration.loadingStateView\"\n    [loadingIconURL]=\"transferOwnershipConfiguration.loadingIconURL\"\n    [errorStateView]=\"transferOwnershipConfiguration.errorStateView\"\n    [emptyStateView]=\"transferOwnershipConfiguration.emptyStateView\"\n    [onError]=\"transferOwnershipConfiguration.onError\"\n    [hideSearch]=\"transferOwnershipConfiguration.hideSearch\"\n    [searchIconURL]=\"transferOwnershipConfiguration.searchIconURL\"\n    [hideSeparator]=\"transferOwnershipConfiguration.hideSeparator\"\n    [closeButtonIconURL]=\"transferOwnershipConfiguration.closeButtonIconURL\"\n    [options]=\"transferOwnershipConfiguration.options\"\n    [disableUsersPresence]=\"transferOwnershipConfiguration.disableUsersPresence\"\n    [subtitleView]=\"transferOwnershipConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"transferOwnershipConfiguration.onClose || openTransferOwnership\">\n  </cometchat-transfer-ownership>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"deleteGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"deleteGroupDialogMessage\"\n    [cancelButtonText]=\"deleteGroupCancelButtonText\"\n    [confirmButtonText]=\"deleteGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"deleteGroup()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"deleteGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n", styles: ["*{box-sizing:border-box;margin:0;padding:0}.cc-details__wrapper{padding:8px;border-radius:5px;height:100%;overflow:hidden}.cc-details__profile{margin-bottom:50px;height:8%}.cc-details__section-list{height:84%;width:100%;overflow-y:auto;overflow-x:hidden}.cc-details__header{display:flex;justify-content:center;align-items:center;margin-bottom:30px}.cc-details__close-button{position:absolute;right:20px}.cc-details__section{margin-bottom:32px}.cc-details__section-separator{margin-bottom:16px;padding-left:6px;height:5%}.cc-details__options-wrapper{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}.cc-details__option{display:flex;flex-direction:column;justify-content:space-evenly;min-height:50px}.cc-details__option-title{padding-bottom:12px;display:flex;align-items:center;justify-content:space-between}.cc-details__view{position:absolute;top:0;left:0;height:100%;width:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;max-width:100%;z-index:1}.cc-details__section-list::-webkit-scrollbar{background:transparent;width:8px}.cc-details__section-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-details__leavedialog,.cc-details__transferownership{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:-moz-fit-content;height:fit-content;width:100%;z-index:2}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { group: [{
                type: Input
            }], user: [{
                type: Input
            }], title: [{
                type: Input
            }], closeButtonIconURL: [{
                type: Input
            }], hideProfile: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], customProfileView: [{
                type: Input
            }], data: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], privateGroupIcon: [{
                type: Input
            }], protectedGroupIcon: [{
                type: Input
            }], passwordGroupIcon: [{
                type: Input
            }], onError: [{
                type: Input
            }], onClose: [{
                type: Input
            }], leaveGroupConfirmButtonText: [{
                type: Input
            }], leaveGroupCancelButtonText: [{
                type: Input
            }], leaveGroupDialogMessage: [{
                type: Input
            }], leaveGroupDialogStyle: [{
                type: Input
            }], deleteGroupConfirmButtonText: [{
                type: Input
            }], deleteGroupDialogMessage: [{
                type: Input
            }], deleteGroupCancelButtonText: [{
                type: Input
            }], deleteGroupDialogStyle: [{
                type: Input
            }], transferOwnershipConfirmButtonText: [{
                type: Input
            }], transferOwnershipDialogMessage: [{
                type: Input
            }], transferOwnershipCancelButtonText: [{
                type: Input
            }], transferOwnershipDialogStyle: [{
                type: Input
            }], addMembersConfiguration: [{
                type: Input
            }], bannedMembersConfiguration: [{
                type: Input
            }], groupMembersConfiguration: [{
                type: Input
            }], transferOwnershipConfiguration: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], backdropStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], detailsStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXREZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0RGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULEtBQUssRUFFTCx1QkFBdUIsR0FLeEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsV0FBVyxFQUFpQixrQkFBa0IsRUFBRSxhQUFhLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQTtBQUMxRyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBeUIsRUFBRSw4QkFBOEIsR0FBYyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hOLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUErQyxtQkFBbUIsRUFBMkYsYUFBYSxFQUE0QixNQUFNLDRCQUE0QixDQUFBO0FBQ3BULE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7Ozs7O0FBQy9EOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLHlCQUF5QjtJQTZKcEMsWUFBb0IsR0FBc0Is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QkFDRyw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBQ0csaUNBQWlDO3NCQUF6QyxLQUFLO2dCQUNHLDRCQUE0QjtzQkFBcEMsS0FBSztnQkFLRyx1QkFBdUI7c0JBQS9CLEtBQUs7Z0JBQ0csMEJBQTBCO3NCQUFsQyxLQUFLO2dCQUNHLHlCQUF5QjtzQkFBakMsS0FBSztnQkFDRyw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBSUcsb0JBQW9CO3NCQUE1QixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsV0FBVztzQkFBbkIsS0FBSztnQkFPRyxZQUFZO3NCQUFwQixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIElucHV0LFxuICBPbkluaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgVGVtcGxhdGVSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgQmFja2Ryb3BTdHlsZSwgQ29uZmlybURpYWxvZ1N0eWxlLCBMaXN0SXRlbVN0eWxlLCB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBZGRNZW1iZXJzQ29uZmlndXJhdGlvbiwgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24sIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSwgRGV0YWlsc1N0eWxlLCBEZXRhaWxzVXRpbHMsIEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24sIFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiwgQmFzZVN0eWxlLCB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgSUdyb3VwTWVtYmVyQWRkZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgQ29tZXRDaGF0VXNlckV2ZW50cywgSUdyb3VwTWVtYmVySm9pbmVkLCBJT3duZXJzaGlwQ2hhbmdlZCwgQ29tZXRDaGF0RGV0YWlsc09wdGlvbiwgQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlLCBTZWxlY3Rpb25Nb2RlLCBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcydcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdERldGFpbHNDb21wb25lbnQgcmVuZGVycyBkZXRhaWxzIG9mIHVzZXIgb3IgZ3JvdXAuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWRldGFpbHNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXREZXRhaWxzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJERVRBSUxTXCIpO1xuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVQcm9maWxlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGN1c3RvbVByb2ZpbGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGF0YT86IENvbWV0Q2hhdERldGFpbHNUZW1wbGF0ZVtdO1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBwcml2YXRlR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Qcml2YXRlLnN2Z1wiO1xuICAvKipcbiAgKiBAZGVwcmVjYXRlZFxuICAqXG4gICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGxlYXZlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9HUk9VUFwiKTtcbiAgQElucHV0KCkgbGVhdmVHcm91cENhbmNlbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9DT05GSVJNXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjA2KVwiLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IFwiNjAwIDE1cHggSW50ZXJcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIG1lc3NhZ2VUZXh0Rm9udDogXCI0MDAgMTNweCBJbnRlclwiLFxuICAgIG1lc3NhZ2VUZXh0Q29sb3I6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNGMkYyRjJcIixcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVcIik7XG4gIEBJbnB1dCgpIGRlbGV0ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVfQ09ORklSTVwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDYW5jZWxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTkNFTFwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBEaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxODBweFwiLFxuICAgIHdpZHRoOiBcIjM2MHB4XCJcbiAgfVxuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpcm1CdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX09XTkVSU0hJUFwiKTtcbiAgQElucHV0KCkgdHJhbnNmZXJPd25lcnNoaXBEaWFsb2dNZXNzYWdlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX0NPTkZJUk1cIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwQ2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cblxuICBASW5wdXQoKSBhZGRNZW1iZXJzQ29uZmlndXJhdGlvbjogQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbjogQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBncm91cE1lbWJlcnNDb25maWd1cmF0aW9uOiBHcm91cE1lbWJlcnNDb25maWd1cmF0aW9uID0gbmV3IEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb246IFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiA9IG5ldyBUcmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24oe30pO1xuXG5cbiAgYmFja2ljb251cmwgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiXG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCJcbiAgfVxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuXG4gIH07XG4gIEBJbnB1dCgpIGRldGFpbHNTdHlsZTogRGV0YWlsc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiZ3JleVwiLFxuICAgIHRpdGxlRm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlQ29sb3I6IFwiYmxhY2tcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG5cblxuICBzaG93VHJhbnNmZXJEaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZGVmYXVsdFRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGVbXSA9IFtdXG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcGVuVmlld01lbWJlcnNQYWdlOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBvcGVuQmFubmVkTWVtYmVyc1BhZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIG9wZW5BZGRNZW1iZXJzUGFnZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uZmlybUxlYXZlR3JvdXBNb2RhbDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgb3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZVxuICBzZWxlY3Rpb25tb2RlRW51bTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubXVsdGlwbGU7XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICBjbG9zZUJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogdGhpcy5kZXRhaWxzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICB9XG4gIGJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpIHx8IFwicmdiYSg1MSwgMTUzLCAyNTUpXCIsXG4gICAgYnV0dG9uVGV4dEZvbnQ6IFwiNTAwIDE2cHggSW50ZXJcIlxuICB9XG4gIGRpdmlkZXJTdHlsZTogYW55ID0ge1xuICAgIGJhY2tncm91bmQ6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiLFxuICAgIGhlaWdodDogXCIxcHhcIixcbiAgICB3aWR0aDogXCIxMDAlXCJcbiAgfVxuXG4gIGRlbGV0ZUdyb3VwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZ2V0VGl0bGVTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dEZvbnQgfHwgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dENvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KClcbiAgICB9XG4gIH1cbiAgZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICByZXR1cm4gb3B0aW9uPy5jdXN0b21WaWV3XG4gIH1cbiAgcHVibGljIHN1YnRpdGxlVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbWVtYmVyc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwibWVtYmVybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUoKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgICB0aGlzLmdldFRlbXBsYXRlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0VGVtcGxhdGUoKSB7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSB0aGlzLmRhdGFcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmRlZmF1bHRUZW1wbGF0ZSA9IERldGFpbHNVdGlscy5nZXREZWZhdWx0RGV0YWlsc1RlbXBsYXRlKHRoaXMubG9nZ2VkSW5Vc2VyLCB0aGlzLnVzZXIsIHRoaXMuZ3JvdXAsIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZClcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLm1lbWJlcnNMaXN0ZW5lcklkKVxuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgICB0aGlzLmRlZmF1bHRUZW1wbGF0ZSA9IFtdO1xuICAgIHRoaXMub25DbG9zZURldGFpbHMoKVxuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKVxuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKVxuICAgIHRoaXMuc3RhdHVzQ29sb3Iub25saW5lID0gdGhpcy5kZXRhaWxzU3R5bGUub25saW5lU3RhdHVzQ29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKClcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gIH1cblxuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8udXNlckFkZGVkSW4hO1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LnVzZXJBZGRlZEluIVxuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVySm9pbmVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVySm9pbmVkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8uam9pbmVkR3JvdXA7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy5raWNrZWRGcm9tITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LmtpY2tlZEZyb20hO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KTtcbiAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjT3duZXJzaGlwQ2hhbmdlZC5zdWJzY3JpYmUoKGl0ZW06IElPd25lcnNoaXBDaGFuZ2VkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8uZ3JvdXAhO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgdGhpcy5jb25maXJtTGVhdmVHcm91cE1vZGFsID0gZmFsc2U7XG4gICAgICB0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSk7XG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBjaGVja1N0YXR1c1R5cGUgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UgJiYgIW5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eSh0aGlzLnVzZXIpXG4gICAgICByZXR1cm4gdXNlclN0YXR1c1Zpc2liaWxpdHkgPyB0aGlzLnN0YXR1c0NvbG9yW3RoaXMudXNlcj8uZ2V0U3RhdHVzKCldIDogbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbdGhpcy5ncm91cD8uZ2V0VHlwZSgpXVxuICAgIH1cbiAgICBlbHNlIHJldHVybiBudWxsO1xuICB9XG4gIHVwZGF0ZVN1YnRpdGxlKCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5ncm91cD8uZ2V0TWVtYmVyc0NvdW50KCk7XG4gICAgY29uc3QgbWVtYmVyc1RleHQgPSBsb2NhbGl6ZShjb3VudCA+IDEgPyBcIk1FTUJFUlNcIiA6IFwiTUVNQkVSXCIpO1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9ICF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlICYmICF0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSAmJiAhdGhpcy51c2VyLmdldEhhc0Jsb2NrZWRNZSgpO1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSB1c2VyU3RhdHVzVmlzaWJpbGl0eSA/IHRoaXMudXNlci5nZXRTdGF0dXMoKSA6IFwiXCI7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gYCR7Y291bnR9ICR7bWVtYmVyc1RleHR9YDtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGdldEJ1dHRvblN0eWxlKG9wdGlvbjogQ29tZXRDaGF0RGV0YWlsc09wdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25UZXh0Rm9udDogb3B0aW9uPy50aXRsZUZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IG9wdGlvbj8udGl0bGVDb2xvcixcbiAgICAgIGJhY2tncm91bmQ6IG9wdGlvbj8uYmFja2dyb3VuZENvbG9yIHx8IFwidHJhbnNwYXJlbnRcIlxuICAgIH1cbiAgfVxuICBjaGVja0dyb3VwVHlwZSgpOiBzdHJpbmcge1xuICAgIGxldCBpbWFnZTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAodGhpcy5ncm91cCkge1xuICAgICAgc3dpdGNoICh0aGlzLmdyb3VwPy5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbWFnZVxuICB9XG4gIHVwZGF0ZVVzZXJTdGF0dXModXNlcjogQ29tZXRDaGF0LlVzZXIpIHtcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRVaWQoKSAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgPT09IHVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMudXNlci5zZXRTdGF0dXModXNlci5nZXRTdGF0dXMoKSk7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICB9XG4gICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlKSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy51c2VyTGlzdGVuZXJJZCxcbiAgICAgICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhvbmxpbmVVc2VyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwLnNldFNjb3BlKG5ld1Njb3BlKTtcbiAgICAgICAgICAgICAgdGhpcy5ncm91cCA9IGNoYW5nZWRHcm91cDtcbiAgICAgICAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldFNlY3Rpb25IZWFkZXJTdHlsZSh0ZW1wbGF0ZTogQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0ZW1wbGF0ZS50aXRsZUZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRlbXBsYXRlLnRpdGxlQ29sb3JcbiAgICB9XG4gIH1cbiAgb25PcHRpb25DbGljayhvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICBjb25zdCB7IG9uQ2xpY2ssIGlkIH0gPSBvcHRpb247XG4gICAgaWYgKG9uQ2xpY2spIHtcbiAgICAgIG9uQ2xpY2sodGhpcy51c2VyID8/IHRoaXMuZ3JvdXApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzd2l0Y2ggKGlkKSB7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLlVzZXJPcHRpb25zLnZpZXdQcm9maWxlOlxuICAgICAgICBpZiAodGhpcy51c2VyPy5nZXRMaW5rKCkpIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHRoaXMudXNlci5nZXRMaW5rKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLlVzZXJPcHRpb25zLmJsb2NrOlxuICAgICAgICB0aGlzLmJsb2NrVXNlcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuVXNlck9wdGlvbnMudW5ibG9jazpcbiAgICAgICAgdGhpcy51bkJsb2NrVXNlcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBPcHRpb25zLnZpZXdNZW1iZXJzOlxuICAgICAgICB0aGlzLnZpZXdNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuYWRkTWVtYmVyczpcbiAgICAgICAgdGhpcy5hZGRNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuYmFubmVkTWVtYmVyczpcbiAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMubGVhdmU6XG4gICAgICAgIHRoaXMubGVhdmVHcm91cCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBPcHRpb25zLmRlbGV0ZTpcbiAgICAgICAgdGhpcy5zaG93RGVsZXRlRGlhbG9nKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIG9uVHJhbnNmZXJDbGljaygpIHtcbiAgICBpZiAodGhpcy5ncm91cC5nZXRPd25lcigpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IHRydWU7XG4gICAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIG9uTGVhdmVDbGljaygpIHtcbiAgICBDb21ldENoYXQubGVhdmVHcm91cCh0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIHRoaXMuZ3JvdXAuc2V0TWVtYmVyc0NvdW50KHRoaXMuZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgLSAxKVxuICAgICAgICB0aGlzLmdyb3VwLnNldEhhc0pvaW5lZChmYWxzZSlcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkNsb3NlRGV0YWlscygpXG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0Lm5leHQoe1xuICAgICAgICAgIHVzZXJMZWZ0OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgICAgbGVmdEdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIG1lc3NhZ2U6IHRoaXMuY3JlYXRlVXNlckxlZnRBY3Rpb24odGhpcy5sb2dnZWRJblVzZXIhLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUKVxuXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7IHRoaXMub25FcnJvcihlcnJvcikgfVxuICAgICAgfSk7XG4gIH1cbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBhY3Rpb246IHN0cmluZykge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24odGhpcy5ncm91cC5nZXRHdWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiBhcyBhbnkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uQnkodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uRm9yKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25PbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UoYCR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX0gJHthY3Rpb259ICR7YWN0aW9uT24uZ2V0TmFtZSgpfWApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE5ld1Njb3BlKGFjdGlvbk9uLmdldFNjb3BlKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlclR5cGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCk7XG5cbiAgICByZXR1cm4gYWN0aW9uTWVzc2FnZVxuICB9XG4gIGNyZWF0ZVVzZXJMZWZ0QWN0aW9uKGFjdGlvbk9uOiBDb21ldENoYXQuVXNlciwgYWN0aW9uOiBzdHJpbmcpIHtcbiAgICBsZXQgYWN0aW9uTWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiA9IG5ldyBDb21ldENoYXQuQWN0aW9uKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gYXMgYW55KVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uKGFjdGlvbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkZvcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uT24oYWN0aW9uT24pXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKFwiZ3JvdXBfXCIgKyB0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlclR5cGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCk7XG4gICAgbGV0IG1lc3NhZ2U6IHN0cmluZyA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQgPyBgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSAke2FjdGlvbn1gIDogYCR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX0gJHthY3Rpb259ICR7YWN0aW9uT24uZ2V0TmFtZSgpfWBcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UobWVzc2FnZSlcbiAgICByZXR1cm4gYWN0aW9uTWVzc2FnZVxuICB9XG5cbiAgb25DYW5jZWxDbGljaygpIHtcbiAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dUcmFuc2ZlckRpYWxvZyA9IGZhbHNlO1xuICB9XG4gIGJsb2NrVXNlcigpIHtcbiAgICAvLyBibG9jayB1c2VyXG4gICAgaWYgKHRoaXMudXNlciAmJiAhdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkpIHtcbiAgICAgIENvbWV0Q2hhdC5ibG9ja1VzZXJzKFt0aGlzLnVzZXIuZ2V0VWlkKCldKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy51c2VyLnNldEJsb2NrZWRCeU1lKHRydWUpXG4gICAgICAgIENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5uZXh0KHRoaXMudXNlcilcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgICB0aGlzLmdldFRlbXBsYXRlKCk7XG4gICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgIH1cbiAgfVxuICB1bkJsb2NrVXNlcigpIHtcbiAgICAvLyB1bmJsb2NrIHVzZXJcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpKSB7XG4gICAgICBDb21ldENoYXQudW5ibG9ja1VzZXJzKFt0aGlzLnVzZXIuZ2V0VWlkKCldKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy51c2VyLnNldEJsb2NrZWRCeU1lKGZhbHNlKVxuICAgICAgICBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlclVuYmxvY2tlZC5uZXh0KHRoaXMudXNlcilcbiAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKCk7XG4gICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgIH1cbiAgfVxuICB2aWV3TWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSAhdGhpcy5vcGVuVmlld01lbWJlcnNQYWdlO1xuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfVxuICBhZGRNZW1iZXJzID0gKCkgPT4ge1xuICAgIHRoaXMub3BlbkFkZE1lbWJlcnNQYWdlID0gIXRoaXMub3BlbkFkZE1lbWJlcnNQYWdlO1xuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5vcGVuVmlld01lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGJhbm5lZE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5CYW5uZWRNZW1iZXJzUGFnZSA9ICF0aGlzLm9wZW5CYW5uZWRNZW1iZXJzUGFnZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfVxuICBcbiAgb25CYWNrRm9yQWRkTWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLmFkZE1lbWJlcnMoKTtcbiAgICBpZih0aGlzLmFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkJhY2spIHtcbiAgICAgIHRoaXMuYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQmFjaygpXG4gICAgfVxuICB9XG5cbiAgbGVhdmVHcm91cCgpIHtcbiAgICBpZiAodGhpcy5ncm91cC5nZXRPd25lcigpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgdGhpcy5zaG93VHJhbnNmZXJEaWFsb2cgPSB0cnVlO1xuICAgICAgdGhpcy5jb25maXJtTGVhdmVHcm91cE1vZGFsID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zaG93VHJhbnNmZXJEaWFsb2cgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5jb25maXJtTGVhdmVHcm91cE1vZGFsID0gdHJ1ZVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIHNob3dEZWxldGVEaWFsb2coKSB7XG4gICAgdGhpcy5kZWxldGVHcm91cE1vZGFsID0gdHJ1ZTtcbiAgfVxuICBkZWxldGVHcm91cCgpIHtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICBDb21ldENoYXQuZGVsZXRlR3JvdXAodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZGVsZXRlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cERlbGV0ZWQubmV4dCh0aGlzLmdyb3VwKVxuICAgICAgdGhpcy5vbkNsb3NlRGV0YWlscygpXG4gICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgfVxuICAgICAgfSlcbiAgfVxuICBvcGVuVHJhbnNmZXJPd25lcnNoaXAgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9ICF0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsO1xuICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICB9XG4gIG9uQ2xvc2VEZXRhaWxzID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLm9uQ2xvc2UpIHtcbiAgICAgIHRoaXMub25DbG9zZSgpXG4gICAgfVxuICB9XG4gIHN1YnRpdGxlU3R5bGUgPSAoKSA9PiB7XG4gICAgbGV0IGhpZGVVc2VyU3RhdHVzID0gdGhpcy51c2VyID8gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KHRoaXMudXNlcikgOiB0cnVlXG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UgJiYgIWhpZGVVc2VyU3RhdHVzKSB7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiB0aGlzLmRldGFpbHNTdHlsZS5zdWJ0aXRsZVRleHRGb250LFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy5kZXRhaWxzU3R5bGUuc3VidGl0bGVUZXh0Q29sb3JcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gKi9cbiAgZ2V0R3JvdXBJY29uID0gKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICBsZXQgc3RhdHVzO1xuICAgIGlmIChncm91cCkge1xuICAgICAgc3dpdGNoIChncm91cC5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIHN0YXR1cyA9IHRoaXMucGFzc3dvcmRHcm91cEljb24gfHwgdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIHN0YXR1cyA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzdGF0dXMgPSBudWxsXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXNcbiAgfVxuICAvKipcbiogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yWyhncm91cD8uZ2V0VHlwZSgpIGFzIHN0cmluZyldO1xuICB9XG4gIGdldFRlbXBsYXRlT3B0aW9ucyA9ICh0ZW1wbGF0ZTogQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlKSA9PiB7XG4gICAgaWYgKHRlbXBsYXRlLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0ZW1wbGF0ZS5vcHRpb25zKHRoaXMudXNlciwgdGhpcy5ncm91cCwgdGVtcGxhdGUuaWQgYXMgc3RyaW5nKVxuICAgIH1cbiAgICBlbHNlIHJldHVybiBbXVxuICB9XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXREZXRhaWxzU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKVxuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0Q29uZmlybURpYWxvZ1N0eWxlKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID0gdGhpcy5kZXRhaWxzU3R5bGUucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5vbmxpbmUgPSB0aGlzLmRldGFpbHNTdHlsZS5vbmxpbmVTdGF0dXNDb2xvcjtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID0gdGhpcy5kZXRhaWxzU3R5bGUucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kXG4gIH1cbiAgc2V0Q29uZmlybURpYWxvZ1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjM1MHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgICB9KVxuICAgIGxldCBkZWZhdWx0RGVsZXRlRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIzNTBweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICB0aGlzLmxlYXZlR3JvdXBEaWFsb2dTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxlYXZlR3JvdXBEaWFsb2dTdHlsZSB9XG4gICAgdGhpcy50cmFuc2Zlck93bmVyc2hpcERpYWxvZ1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMudHJhbnNmZXJPd25lcnNoaXBEaWFsb2dTdHlsZSB9XG4gICAgdGhpcy5kZWxldGVHcm91cERpYWxvZ1N0eWxlID0geyAuLi5kZWZhdWx0RGVsZXRlRGlhbG9nU3R5bGUsIC4uLnRoaXMuZGVsZXRlR3JvdXBEaWFsb2dTdHlsZSB9XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuXG4gICAgfVxuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSB9XG4gIH1cbiAgc2V0RGV0YWlsc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IERldGFpbHNTdHlsZSA9IG5ldyBEZXRhaWxzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiXG4gICAgfSlcbiAgICB0aGlzLmRldGFpbHNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRldGFpbHNTdHlsZSB9XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogdGhpcy5kZXRhaWxzU3R5bGUud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMuZGV0YWlsc1N0eWxlLmhlaWdodCxcbiAgICAgIGJvcmRlcjogdGhpcy5kZXRhaWxzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmRldGFpbHNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmRldGFpbHNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgIH1cbiAgfVxuICBtYXJnaW5TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGFkZGluZzogdGhpcy5kZXRhaWxzU3R5bGU/LnBhZGRpbmdcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX193cmFwcGVyXCIgKm5nSWY9XCJ1c2VyIHx8IGdyb3VwXCJcbiAgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX2hlYWRlclwiPlxuICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwidGl0bGVcIlxuICAgICAgW2xhYmVsU3R5bGVdPVwiZ2V0VGl0bGVTdHlsZSgpXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGVcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQ2xvc2VEZXRhaWxzKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc1wiIFtuZ1N0eWxlXT1cIm1hcmdpblN0eWxlKClcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fcHJvZmlsZVwiICpuZ0lmPVwiIWhpZGVQcm9maWxlXCI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSAqbmdJZj1cIiFjdXN0b21Qcm9maWxlVmlldztlbHNlIGxpc3RpdGVtXCJcbiAgICAgICAgW2F2YXRhck5hbWVdPVwidXNlcj8uZ2V0TmFtZSgpID8/IHRoaXMuZ3JvdXA/LmdldE5hbWUoKVwiXG4gICAgICAgIFthdmF0YXJVUkxdPVwidGhpcy51c2VyPy5nZXRBdmF0YXIoKSA/PyB0aGlzLmdyb3VwPy5nZXRJY29uKClcIlxuICAgICAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImNoZWNrU3RhdHVzVHlwZSgpXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckljb25dPVwiY2hlY2tHcm91cFR5cGUoKVwiXG4gICAgICAgIFt0aXRsZV09XCJ0aGlzLnVzZXI/LmdldE5hbWUoKSA/PyB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXN1YnRpdGxlVmlldzsgZWxzZSBzdWJ0aXRsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIlxuICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3VidGl0bGU+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb24tbGlzdFwiXG4gICAgICAqbmdJZj1cImRlZmF1bHRUZW1wbGF0ZSAmJiBkZWZhdWx0VGVtcGxhdGUubGVuZ3RoID4gMFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb25cIiAqbmdGb3I9XCJsZXQgaXRlbSBvZiBkZWZhdWx0VGVtcGxhdGVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb24tc2VwYXJhdG9yXCIgKm5nSWY9XCJpdGVtLnRpdGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJpdGVtLnRpdGxlXCJcbiAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImdldFNlY3Rpb25IZWFkZXJTdHlsZShpdGVtKVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbnMtd3JhcHBlclwiXG4gICAgICAgICAgKm5nSWY9XCJnZXRUZW1wbGF0ZU9wdGlvbnMoaXRlbSlcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fb3B0aW9uc1wiXG4gICAgICAgICAgICAqbmdGb3I9XCJsZXQgb3B0aW9uIG9mIGdldFRlbXBsYXRlT3B0aW9ucyhpdGVtKVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvblwiXG4gICAgICAgICAgICAgICpuZ0lmPVwiIWdldEN1c3RvbU9wdGlvblZpZXcob3B0aW9uKTtlbHNlIGN1c3RvbVZpZXdcIlxuICAgICAgICAgICAgICAoY2xpY2spPVwib25PcHRpb25DbGljayhvcHRpb24pXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19vcHRpb24tdGl0bGVcIj5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbdGV4dF09XCJvcHRpb24udGl0bGVcIlxuICAgICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldEJ1dHRvblN0eWxlKG9wdGlvbilcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbi10YWlsXCIgKm5nSWY9XCJvcHRpb24/LnRhaWxcIj5cbiAgICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJvcHRpb24/LnRhaWxcIj48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtZGl2aWRlclxuICAgICAgICAgICAgICAgIFtkaXZpZGVyU3R5bGVdPVwiZGl2aWRlclN0eWxlXCI+PC9jb21ldGNoYXQtZGl2aWRlcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICNjdXN0b21WaWV3PlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb24pXCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L2Rpdj5cbjxuZy10ZW1wbGF0ZSAjbGlzdGl0ZW0+XG4gIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJjdXN0b21Qcm9maWxlVmlld1wiPlxuICA8L25nLWNvbnRhaW5lcj5cbjwvbmctdGVtcGxhdGU+XG48ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fdmlld1wiICpuZ0lmPVwib3BlbkFkZE1lbWJlcnNQYWdlXCI+XG4gIDxjb21ldGNoYXQtYWRkLW1lbWJlcnNcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnRpdGxlQWxpZ25tZW50IVwiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtU3R5bGUhXCJcbiAgICBbYWRkTWVtYmVyc1N0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5hZGRNZW1iZXJzU3R5bGUhXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmF2YXRhclN0eWxlIVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zdGF0dXNJbmRpY2F0b3JTdHlsZSFcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5sb2FkaW5nU3RhdGVWaWV3IVwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5sb2FkaW5nSWNvblVSTCFcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvblNlbGVjdF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25TZWxlY3QhXCJcbiAgICBbb25FcnJvcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25FcnJvciFcIlxuICAgIFtoaWRlRXJyb3JdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmhpZGVFcnJvciFcIlxuICAgIFtoaWRlU2VhcmNoXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5oaWRlU2VhcmNoIVwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaEljb25VUkwhXCJcbiAgICBbc2VsZWN0aW9uTW9kZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VsZWN0aW9uTW9kZSFcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5oaWRlU2VwYXJhdG9yIVwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zaG93QmFja0J1dHRvbiFcIlxuICAgIFtzaG93U2VjdGlvbkhlYWRlcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2hvd1NlY3Rpb25IZWFkZXIhXCJcbiAgICBbb25BZGRNZW1iZXJzQnV0dG9uQ2xpY2tdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQWRkTWVtYmVyc0J1dHRvbkNsaWNrIVwiXG4gICAgW3VzZXJzQ29uZmlndXJhdGlvbl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udXNlcnNDb25maWd1cmF0aW9uXCJcbiAgICBbYmFja0J1dHRvbkljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmJhY2tCdXR0b25JY29uVVJMIVwiXG4gICAgW3NlY3Rpb25IZWFkZXJGaWVsZF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VjdGlvbkhlYWRlckZpZWxkIVwiXG4gICAgW2Nsb3NlQnV0dG9uSWNvblVSTF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uY2xvc2VCdXR0b25JY29uVVJMIVwiXG4gICAgW29wdGlvbnNdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9wdGlvbnMhXCJcbiAgICBbbWVudV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5kaXNhYmxlVXNlcnNQcmVzZW5jZSFcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwic2VsZWN0aW9ubW9kZUVudW1cIlxuICAgIFtvbkNsb3NlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkNsb3NlIHx8IG9uQ2xvc2VEZXRhaWxzXCJcbiAgICBbb25CYWNrXT1cIm9uQmFja0ZvckFkZE1lbWJlcnNcIlxuICAgIFt1c2Vyc1JlcXVlc3RCdWlsZGVyXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy51c2Vyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy51c2Vyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW2xpc3RJdGVtVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubGlzdEl0ZW1WaWV3XCI+XG4gIDwvY29tZXRjaGF0LWFkZC1tZW1iZXJzPlxuPC9kaXY+XG48ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fdmlld1wiICpuZ0lmPVwib3BlbkJhbm5lZE1lbWJlcnNQYWdlXCI+XG4gIDxjb21ldGNoYXQtYmFubmVkLW1lbWJlcnNcbiAgICBbbGlzdEl0ZW1WaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uPy5saXN0SXRlbVZpZXdcIlxuICAgIFtiYW5uZWRNZW1iZXJzUmVxdWVzdEJ1aWxkZXJdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFtzZWFyY2hSZXF1ZXN0QnVpbGRlcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VhcmNoUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmxpc3RJdGVtU3R5bGVcIlxuICAgIFtiYW5uZWRNZW1iZXJzU3R5bGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uYmFubmVkTWVtYmVyc1N0eWxlXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW29uU2VsZWN0XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLm9uU2VsZWN0XCJcbiAgICBbb25FcnJvcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbaGlkZUVycm9yXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVFcnJvclwiXG4gICAgW2hpZGVTZWFyY2hdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlYXJjaFwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VsZWN0aW9uTW9kZVwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlcGFyYXRvclwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnNob3dCYWNrQnV0dG9uXCJcbiAgICBbYmFja0J1dHRvbkljb25VUkxdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uYmFja0J1dHRvbkljb25VUkxcIlxuICAgIFtjbG9zZUJ1dHRvbkljb25VUkxdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICBbb3B0aW9uc109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vcHRpb25zXCJcbiAgICBbbWVudV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5tZW51XCJcbiAgICBbZGlzYWJsZVVzZXJzUHJlc2VuY2VdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCIgW2dyb3VwXT1cImdyb3VwXCJcbiAgICBbb25DbG9zZV09XCJvbkNsb3NlRGV0YWlsc1wiXG4gICAgW29uQmFja109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkJhY2sgfHwgYmFubmVkTWVtYmVyc1wiPlxuICA8L2NvbWV0Y2hhdC1iYW5uZWQtbWVtYmVycz5cbjwvZGl2PlxuPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3ZpZXdcIiAqbmdJZj1cIm9wZW5WaWV3TWVtYmVyc1BhZ2VcIj5cbiAgPGNvbWV0Y2hhdC1ncm91cC1tZW1iZXJzXG4gICAgW2dyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaFJlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2dyb3VwTWVtYmVyc1N0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZ3JvdXBNZW1iZXJzU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25TZWxlY3RdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdFwiXG4gICAgW29uRXJyb3JdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbaGlkZUVycm9yXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZUVycm9yXCJcbiAgICBbaGlkZVNlYXJjaF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZWFyY2hcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zZWxlY3Rpb25Nb2RlXCJcbiAgICBbYmFja2Ryb3BTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tkcm9wU3R5bGVcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlcGFyYXRvclwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2hvd0JhY2tCdXR0b25cIlxuICAgIFtiYWNrQnV0dG9uSWNvblVSTF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tCdXR0b25JY29uVVJMXCJcbiAgICBbY2xvc2VCdXR0b25JY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICBbb3B0aW9uc109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgIFttZW51XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIlxuICAgIFtncm91cFNjb3BlU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5ncm91cFNjb3BlU3R5bGVcIlxuICAgIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwiIGdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25DbG9zZSB8fCBvbkNsb3NlRGV0YWlsc1wiXG4gICAgW29uQmFja109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9uQmFjayB8fCB2aWV3TWVtYmVyc1wiPlxuICA8L2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzPlxuPC9kaXY+XG5cbjxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiXG4gICpuZ0lmPVwiY29uZmlybUxlYXZlR3JvdXBNb2RhbFwiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiIFttZXNzYWdlVGV4dF09XCJsZWF2ZUdyb3VwRGlhbG9nTWVzc2FnZVwiXG4gICAgW2NhbmNlbEJ1dHRvblRleHRdPVwibGVhdmVHcm91cENhbmNlbEJ1dHRvblRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJsZWF2ZUdyb3VwQ29uZmlybUJ1dHRvblRleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25MZWF2ZUNsaWNrKClcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImxlYXZlR3JvdXBEaWFsb2dTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCIgKm5nSWY9XCJzaG93VHJhbnNmZXJEaWFsb2dcIj5cbiAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiJydcIlxuICAgIFttZXNzYWdlVGV4dF09XCJ0cmFuc2Zlck93bmVyc2hpcERpYWxvZ01lc3NhZ2VcIlxuICAgIFtjYW5jZWxCdXR0b25UZXh0XT1cInRyYW5zZmVyT3duZXJzaGlwQ2FuY2VsQnV0dG9uVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlybUJ1dHRvblRleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25UcmFuc2ZlckNsaWNrKClcIlxuICAgIChjYy1jYW5jZWwtY2xpY2tlZCk9XCJvbkNhbmNlbENsaWNrKClcIlxuICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBEaWFsb2dTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCJcbiAgKm5nSWY9XCJvcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbFwiPlxuICA8Y29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcFxuICAgIFtncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcl09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24/Lmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICBbdHJhbnNmZXJPd25lcnNoaXBTdHlsZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24udHJhbnNmZXJPd25lcnNoaXBTdHlsZVwiXG4gICAgW29uVHJhbnNmZXJPd25lcnNoaXBdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uVHJhbnNmZXJPd25lcnNoaXBcIlxuICAgIFt0aXRsZUFsaWdubWVudF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW29uRXJyb3JdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtoaWRlU2VhcmNoXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICBbc2VhcmNoSWNvblVSTF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgIFtjbG9zZUJ1dHRvbkljb25VUkxdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgW29wdGlvbnNdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uQ2xvc2UgfHwgb3BlblRyYW5zZmVyT3duZXJzaGlwXCI+XG4gIDwvY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcD5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCIgKm5nSWY9XCJkZWxldGVHcm91cE1vZGFsXCI+XG4gIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cIicnXCJcbiAgICBbbWVzc2FnZVRleHRdPVwiZGVsZXRlR3JvdXBEaWFsb2dNZXNzYWdlXCJcbiAgICBbY2FuY2VsQnV0dG9uVGV4dF09XCJkZWxldGVHcm91cENhbmNlbEJ1dHRvblRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJkZWxldGVHcm91cENvbmZpcm1CdXR0b25UZXh0XCJcbiAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cImRlbGV0ZUdyb3VwKClcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImRlbGV0ZUdyb3VwRGlhbG9nU3R5bGVcIj5cbiAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==