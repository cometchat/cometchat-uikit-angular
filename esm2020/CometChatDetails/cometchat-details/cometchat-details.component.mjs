import { Component, Input, ChangeDetectionStrategy, } from "@angular/core";
import '@cometchat/uikit-elements';
import { AvatarStyle, ConfirmDialogStyle, ListItemStyle, } from '@cometchat/uikit-elements';
import { AddMembersConfiguration, BannedMembersConfiguration, CometChatUIKitUtility, DetailsStyle, DetailsUtils, GroupMembersConfiguration, TransferOwnershipConfiguration, } from "@cometchat/uikit-shared";
import { fontHelper, localize, CometChatGroupEvents, CometChatUIKitConstants, CometChatUserEvents, SelectionMode } from '@cometchat/uikit-resources';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
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
        this.checkStatusType = () => {
            return this.user && !this.disableUsersPresence ? this.statusColor[this.user?.getStatus()] : this.statusColor[this.group?.getType()];
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
            if (this.user && this.user.getStatus() == CometChatUIKitConstants.userStatusType.online) {
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
            this.openAddMembersPage = false;
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
        this.subtitleText = this.user ? this.user.getStatus() : `${count} ${membersText}`;
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
CometChatDetailsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatDetailsComponent, selector: "cometchat-details", inputs: { group: "group", user: "user", title: "title", closeButtonIconURL: "closeButtonIconURL", hideProfile: "hideProfile", subtitleView: "subtitleView", customProfileView: "customProfileView", data: "data", disableUsersPresence: "disableUsersPresence", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", onError: "onError", onClose: "onClose", leaveGroupConfirmButtonText: "leaveGroupConfirmButtonText", leaveGroupCancelButtonText: "leaveGroupCancelButtonText", leaveGroupDialogMessage: "leaveGroupDialogMessage", leaveGroupDialogStyle: "leaveGroupDialogStyle", deleteGroupConfirmButtonText: "deleteGroupConfirmButtonText", deleteGroupDialogMessage: "deleteGroupDialogMessage", deleteGroupCancelButtonText: "deleteGroupCancelButtonText", deleteGroupDialogStyle: "deleteGroupDialogStyle", transferOwnershipConfirmButtonText: "transferOwnershipConfirmButtonText", transferOwnershipDialogMessage: "transferOwnershipDialogMessage", transferOwnershipCancelButtonText: "transferOwnershipCancelButtonText", transferOwnershipDialogStyle: "transferOwnershipDialogStyle", addMembersConfiguration: "addMembersConfiguration", bannedMembersConfiguration: "bannedMembersConfiguration", groupMembersConfiguration: "groupMembersConfiguration", transferOwnershipConfiguration: "transferOwnershipConfiguration", statusIndicatorStyle: "statusIndicatorStyle", backdropStyle: "backdropStyle", avatarStyle: "avatarStyle", detailsStyle: "detailsStyle", listItemStyle: "listItemStyle" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-details__wrapper\" *ngIf=\"user || group\"\n  [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-details__header\">\n    <cometchat-label [text]=\"title\"\n      [labelStyle]=\"getTitleStyle()\"></cometchat-label>\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-details\" [ngStyle]=\"marginStyle()\">\n    <div class=\"cc-details__profile\" *ngIf=\"!hideProfile\">\n      <cometchat-list-item *ngIf=\"!customProfileView;else listitem\"\n        [avatarName]=\"user?.getName() ?? this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() ?? this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() ?? this.group?.getName()\"\n        [hideSeparator]=\"false\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n            </ng-container>\n          </ng-template>\n        </div>\n      </cometchat-list-item>\n    </div>\n    <div class=\"cc-details__section-list\"\n      *ngIf=\"defaultTemplate && defaultTemplate.length > 0\">\n      <div class=\"cc-details__section\" *ngFor=\"let item of defaultTemplate\">\n        <div class=\"cc-details__section-separator\" *ngIf=\"item.title\">\n          <cometchat-label [text]=\"item.title\"\n            [labelStyle]=\"getSectionHeaderStyle(item)\"></cometchat-label>\n        </div>\n        <div class=\"cc-details__options-wrapper\"\n          *ngIf=\"getTemplateOptions(item)\">\n          <div class=\"cc-details__options\"\n            *ngFor=\"let option of getTemplateOptions(item)\">\n            <div class=\"cc-details__option\"\n              *ngIf=\"!getCustomOptionView(option);else customView\"\n              (click)=\"onOptionClick(option)\">\n              <div class=\"cc-details__option-title\">\n                <cometchat-button [text]=\"option.title\"\n                  [buttonStyle]=\"getButtonStyle(option)\"></cometchat-button>\n                <div class=\"cc-details__option-tail\" *ngIf=\"option?.tail\">\n                  <ng-container *ngTemplateOutlet=\"option?.tail\"></ng-container>\n                </div>\n              </div>\n              <cometchat-divider\n                [dividerStyle]=\"dividerStyle\"></cometchat-divider>\n            </div>\n            <ng-template #customView>\n              <ng-container *ngTemplateOutlet=\"getCustomOptionView(option)\">\n              </ng-container>\n            </ng-template>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template #listitem>\n  <ng-container *ngTemplateOutlet=\"customProfileView\">\n  </ng-container>\n</ng-template>\n<div class=\"cc-details__view\" *ngIf=\"openAddMembersPage\">\n  <cometchat-add-members\n    [titleAlignment]=\"addMembersConfiguration?.titleAlignment!\"\n    [listItemStyle]=\"addMembersConfiguration?.listItemStyle!\"\n    [addMembersStyle]=\"addMembersConfiguration?.addMembersStyle!\"\n    [avatarStyle]=\"addMembersConfiguration?.avatarStyle!\"\n    [statusIndicatorStyle]=\"addMembersConfiguration?.statusIndicatorStyle!\"\n    [loadingStateView]=\"addMembersConfiguration?.loadingStateView!\"\n    [loadingIconURL]=\"addMembersConfiguration?.loadingIconURL!\"\n    [errorStateView]=\"addMembersConfiguration?.errorStateView\"\n    [emptyStateView]=\"addMembersConfiguration?.emptyStateView\"\n    [onSelect]=\"addMembersConfiguration?.onSelect!\"\n    [onError]=\"addMembersConfiguration?.onError!\"\n    [hideError]=\"addMembersConfiguration?.hideError!\"\n    [hideSearch]=\"addMembersConfiguration?.hideSearch!\"\n    [searchIconURL]=\"addMembersConfiguration?.searchIconURL!\"\n    [selectionMode]=\"addMembersConfiguration?.selectionMode!\"\n    [hideSeparator]=\"addMembersConfiguration?.hideSeparator!\"\n    [showBackButton]=\"addMembersConfiguration?.showBackButton!\"\n    [showSectionHeader]=\"addMembersConfiguration?.showSectionHeader!\"\n    [onAddMembersButtonClick]=\"addMembersConfiguration?.onAddMembersButtonClick!\"\n    [usersConfiguration]=\"addMembersConfiguration?.usersConfiguration\"\n    [backButtonIconURL]=\"addMembersConfiguration?.backButtonIconURL!\"\n    [sectionHeaderField]=\"addMembersConfiguration?.sectionHeaderField!\"\n    [closeButtonIconURL]=\"addMembersConfiguration?.closeButtonIconURL!\"\n    [options]=\"addMembersConfiguration?.options!\"\n    [menu]=\"addMembersConfiguration?.menu\"\n    [disableUsersPresence]=\"addMembersConfiguration?.disableUsersPresence!\"\n    [subtitleView]=\"addMembersConfiguration?.subtitleView\" [group]=\"group\"\n    [selectionMode]=\"selectionmodeEnum\"\n    [onClose]=\"addMembersConfiguration?.onClose || onCloseDetails\"\n    [onBack]=\"addMembersConfiguration?.onBack || addMembers\"\n    [usersRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [searchRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [listItemView]=\"addMembersConfiguration?.listItemView\">\n  </cometchat-add-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openBannedMembersPage\">\n  <cometchat-banned-members\n    [listItemView]=\"bannedMembersConfiguration?.listItemView\"\n    [bannedMembersRequestBuilder]=\"bannedMembersConfiguration?.bannedMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"bannedMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"bannedMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"bannedMembersConfiguration.listItemStyle\"\n    [bannedMembersStyle]=\"bannedMembersConfiguration.bannedMembersStyle\"\n    [avatarStyle]=\"bannedMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"bannedMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"bannedMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"bannedMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"bannedMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"bannedMembersConfiguration.emptyStateView\"\n    [onSelect]=\"bannedMembersConfiguration.onSelect\"\n    [onError]=\"bannedMembersConfiguration.onError\"\n    [hideError]=\"bannedMembersConfiguration.hideError\"\n    [hideSearch]=\"bannedMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"bannedMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"bannedMembersConfiguration.selectionMode\"\n    [hideSeparator]=\"bannedMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"bannedMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"bannedMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"bannedMembersConfiguration.closeButtonIconURL\"\n    [options]=\"bannedMembersConfiguration.options\"\n    [menu]=\"bannedMembersConfiguration.menu\"\n    [disableUsersPresence]=\"bannedMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"bannedMembersConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"onCloseDetails\"\n    [onBack]=\"bannedMembersConfiguration.onBack || bannedMembers\">\n  </cometchat-banned-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openViewMembersPage\">\n  <cometchat-group-members\n    [groupMembersRequestBuilder]=\"groupMembersConfiguration?.groupMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"groupMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"groupMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"groupMembersConfiguration.listItemStyle\"\n    [groupMembersStyle]=\"groupMembersConfiguration.groupMembersStyle\"\n    [avatarStyle]=\"groupMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"groupMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"groupMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"groupMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"groupMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"groupMembersConfiguration.emptyStateView\"\n    [onSelect]=\"groupMembersConfiguration.onSelect\"\n    [onError]=\"groupMembersConfiguration.onError\"\n    [hideError]=\"groupMembersConfiguration.hideError\"\n    [hideSearch]=\"groupMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"groupMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"groupMembersConfiguration.selectionMode\"\n    [backdropStyle]=\"groupMembersConfiguration.backdropStyle\"\n    [hideSeparator]=\"groupMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"groupMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"groupMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"groupMembersConfiguration.closeButtonIconURL\"\n    [options]=\"groupMembersConfiguration.options\"\n    [menu]=\"groupMembersConfiguration.menu\"\n    [disableUsersPresence]=\"groupMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"groupMembersConfiguration.subtitleView\"\n    [groupScopeStyle]=\"groupMembersConfiguration.groupScopeStyle\"\n    [group]=\"group\"\n    [onClose]=\" groupMembersConfiguration.onClose || onCloseDetails\"\n    [onBack]=\"groupMembersConfiguration.onBack || viewMembers\">\n  </cometchat-group-members>\n</div>\n\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"confirmLeaveGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"leaveGroupDialogMessage\"\n    [cancelButtonText]=\"leaveGroupCancelButtonText\"\n    [confirmButtonText]=\"leaveGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"onLeaveClick()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"leaveGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"showTransferDialog\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"transferOwnershipDialogMessage\"\n    [cancelButtonText]=\"transferOwnershipCancelButtonText\"\n    [confirmButtonText]=\"transferOwnershipConfirmButtonText\"\n    (cc-confirm-clicked)=\"onTransferClick()\"\n    (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"transferOwnershipDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"openTransferOwnershipModal\">\n  <cometchat-transfer-ownership\n    [groupMembersRequestBuilder]=\"transferOwnershipConfiguration?.groupMembersRequestBuilder\"\n    [transferOwnershipStyle]=\"transferOwnershipConfiguration.transferOwnershipStyle\"\n    [onTransferOwnership]=\"transferOwnershipConfiguration.onTransferOwnership\"\n    [titleAlignment]=\"transferOwnershipConfiguration.titleAlignment\"\n    [listItemStyle]=\"transferOwnershipConfiguration.listItemStyle\"\n    [avatarStyle]=\"transferOwnershipConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"transferOwnershipConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"transferOwnershipConfiguration.loadingStateView\"\n    [loadingIconURL]=\"transferOwnershipConfiguration.loadingIconURL\"\n    [errorStateView]=\"transferOwnershipConfiguration.errorStateView\"\n    [emptyStateView]=\"transferOwnershipConfiguration.emptyStateView\"\n    [onError]=\"transferOwnershipConfiguration.onError\"\n    [hideSearch]=\"transferOwnershipConfiguration.hideSearch\"\n    [searchIconURL]=\"transferOwnershipConfiguration.searchIconURL\"\n    [hideSeparator]=\"transferOwnershipConfiguration.hideSeparator\"\n    [closeButtonIconURL]=\"transferOwnershipConfiguration.closeButtonIconURL\"\n    [options]=\"transferOwnershipConfiguration.options\"\n    [disableUsersPresence]=\"transferOwnershipConfiguration.disableUsersPresence\"\n    [subtitleView]=\"transferOwnershipConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"transferOwnershipConfiguration.onClose || openTransferOwnership\">\n  </cometchat-transfer-ownership>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"deleteGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"deleteGroupDialogMessage\"\n    [cancelButtonText]=\"deleteGroupCancelButtonText\"\n    [confirmButtonText]=\"deleteGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"deleteGroup()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"deleteGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n", styles: ["*{box-sizing:border-box;margin:0;padding:0}.cc-details__wrapper{padding:8px;border-radius:5px;height:100%;overflow:hidden}.cc-details__profile{margin-bottom:50px;height:8%}.cc-details__section-list{height:84%;width:100%;overflow-y:auto;overflow-x:hidden}.cc-details__header{display:flex;justify-content:center;align-items:center;margin-bottom:30px}.cc-details__close-button{position:absolute;right:20px}.cc-details__section{margin-bottom:32px}.cc-details__section-separator{margin-bottom:16px;padding-left:6px;height:5%}.cc-details__options-wrapper{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}.cc-details__option{display:flex;flex-direction:column;justify-content:space-evenly;min-height:50px}.cc-details__option-title{padding-bottom:12px;display:flex;align-items:center;justify-content:space-between}.cc-details__view{position:absolute;top:0;left:0;height:100%;width:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;max-width:100%;z-index:1}.cc-details__section-list::-webkit-scrollbar{background:transparent;width:8px}.cc-details__section-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-details__leavedialog,.cc-details__transferownership{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:-moz-fit-content;height:fit-content;width:100%;z-index:2}\n"], components: [{ type: i2.CometChatAddMembersComponent, selector: "cometchat-add-members", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "hideError", "searchIconURL", "hideSearch", "title", "onError", "onBack", "onClose", "onSelect", "buttonText", "group", "emptyStateView", "errorStateView", "loadingIconURL", "listItemStyle", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "onAddMembersButtonClick", "titleAlignment", "addMembersStyle", "StatusIndicatorStyle", "avatarStyle"] }, { type: i3.CometChatBannedMembersComponent, selector: "cometchat-banned-members", inputs: ["bannedMembersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onSelect", "onBack", "onClose", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "unbanIconURL", "statusIndicatorStyle", "avatarStyle", "bannedMembersStyle", "listItemStyle"] }, { type: i4.CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "tailView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "backdropStyle", "onBack", "onClose", "onSelect", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "dropdownIconURL", "statusIndicatorStyle", "avatarStyle", "groupMembersStyle", "groupScopeStyle", "listItemStyle", "onItemClick", "onEmpty", "userPresencePlacement", "disableLoadingState", "searchKeyword"] }, { type: i5.CometChatTransferOwnershipComponent, selector: "cometchat-transfer-ownership", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "options", "closeButtonIconURL", "hideSeparator", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onClose", "onTransferOwnership", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "statusIndicatorStyle", "transferOwnershipStyle", "transferButtonText", "cancelButtonText", "avatarStyle", "groupMembersStyle", "listItemStyle", "titleAlignment"] }], directives: [{ type: i6.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i6.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i6.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i6.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetailsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-details", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-details__wrapper\" *ngIf=\"user || group\"\n  [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-details__header\">\n    <cometchat-label [text]=\"title\"\n      [labelStyle]=\"getTitleStyle()\"></cometchat-label>\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-details\" [ngStyle]=\"marginStyle()\">\n    <div class=\"cc-details__profile\" *ngIf=\"!hideProfile\">\n      <cometchat-list-item *ngIf=\"!customProfileView;else listitem\"\n        [avatarName]=\"user?.getName() ?? this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() ?? this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() ?? this.group?.getName()\"\n        [hideSeparator]=\"false\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n            </ng-container>\n          </ng-template>\n        </div>\n      </cometchat-list-item>\n    </div>\n    <div class=\"cc-details__section-list\"\n      *ngIf=\"defaultTemplate && defaultTemplate.length > 0\">\n      <div class=\"cc-details__section\" *ngFor=\"let item of defaultTemplate\">\n        <div class=\"cc-details__section-separator\" *ngIf=\"item.title\">\n          <cometchat-label [text]=\"item.title\"\n            [labelStyle]=\"getSectionHeaderStyle(item)\"></cometchat-label>\n        </div>\n        <div class=\"cc-details__options-wrapper\"\n          *ngIf=\"getTemplateOptions(item)\">\n          <div class=\"cc-details__options\"\n            *ngFor=\"let option of getTemplateOptions(item)\">\n            <div class=\"cc-details__option\"\n              *ngIf=\"!getCustomOptionView(option);else customView\"\n              (click)=\"onOptionClick(option)\">\n              <div class=\"cc-details__option-title\">\n                <cometchat-button [text]=\"option.title\"\n                  [buttonStyle]=\"getButtonStyle(option)\"></cometchat-button>\n                <div class=\"cc-details__option-tail\" *ngIf=\"option?.tail\">\n                  <ng-container *ngTemplateOutlet=\"option?.tail\"></ng-container>\n                </div>\n              </div>\n              <cometchat-divider\n                [dividerStyle]=\"dividerStyle\"></cometchat-divider>\n            </div>\n            <ng-template #customView>\n              <ng-container *ngTemplateOutlet=\"getCustomOptionView(option)\">\n              </ng-container>\n            </ng-template>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template #listitem>\n  <ng-container *ngTemplateOutlet=\"customProfileView\">\n  </ng-container>\n</ng-template>\n<div class=\"cc-details__view\" *ngIf=\"openAddMembersPage\">\n  <cometchat-add-members\n    [titleAlignment]=\"addMembersConfiguration?.titleAlignment!\"\n    [listItemStyle]=\"addMembersConfiguration?.listItemStyle!\"\n    [addMembersStyle]=\"addMembersConfiguration?.addMembersStyle!\"\n    [avatarStyle]=\"addMembersConfiguration?.avatarStyle!\"\n    [statusIndicatorStyle]=\"addMembersConfiguration?.statusIndicatorStyle!\"\n    [loadingStateView]=\"addMembersConfiguration?.loadingStateView!\"\n    [loadingIconURL]=\"addMembersConfiguration?.loadingIconURL!\"\n    [errorStateView]=\"addMembersConfiguration?.errorStateView\"\n    [emptyStateView]=\"addMembersConfiguration?.emptyStateView\"\n    [onSelect]=\"addMembersConfiguration?.onSelect!\"\n    [onError]=\"addMembersConfiguration?.onError!\"\n    [hideError]=\"addMembersConfiguration?.hideError!\"\n    [hideSearch]=\"addMembersConfiguration?.hideSearch!\"\n    [searchIconURL]=\"addMembersConfiguration?.searchIconURL!\"\n    [selectionMode]=\"addMembersConfiguration?.selectionMode!\"\n    [hideSeparator]=\"addMembersConfiguration?.hideSeparator!\"\n    [showBackButton]=\"addMembersConfiguration?.showBackButton!\"\n    [showSectionHeader]=\"addMembersConfiguration?.showSectionHeader!\"\n    [onAddMembersButtonClick]=\"addMembersConfiguration?.onAddMembersButtonClick!\"\n    [usersConfiguration]=\"addMembersConfiguration?.usersConfiguration\"\n    [backButtonIconURL]=\"addMembersConfiguration?.backButtonIconURL!\"\n    [sectionHeaderField]=\"addMembersConfiguration?.sectionHeaderField!\"\n    [closeButtonIconURL]=\"addMembersConfiguration?.closeButtonIconURL!\"\n    [options]=\"addMembersConfiguration?.options!\"\n    [menu]=\"addMembersConfiguration?.menu\"\n    [disableUsersPresence]=\"addMembersConfiguration?.disableUsersPresence!\"\n    [subtitleView]=\"addMembersConfiguration?.subtitleView\" [group]=\"group\"\n    [selectionMode]=\"selectionmodeEnum\"\n    [onClose]=\"addMembersConfiguration?.onClose || onCloseDetails\"\n    [onBack]=\"addMembersConfiguration?.onBack || addMembers\"\n    [usersRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [searchRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [listItemView]=\"addMembersConfiguration?.listItemView\">\n  </cometchat-add-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openBannedMembersPage\">\n  <cometchat-banned-members\n    [listItemView]=\"bannedMembersConfiguration?.listItemView\"\n    [bannedMembersRequestBuilder]=\"bannedMembersConfiguration?.bannedMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"bannedMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"bannedMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"bannedMembersConfiguration.listItemStyle\"\n    [bannedMembersStyle]=\"bannedMembersConfiguration.bannedMembersStyle\"\n    [avatarStyle]=\"bannedMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"bannedMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"bannedMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"bannedMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"bannedMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"bannedMembersConfiguration.emptyStateView\"\n    [onSelect]=\"bannedMembersConfiguration.onSelect\"\n    [onError]=\"bannedMembersConfiguration.onError\"\n    [hideError]=\"bannedMembersConfiguration.hideError\"\n    [hideSearch]=\"bannedMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"bannedMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"bannedMembersConfiguration.selectionMode\"\n    [hideSeparator]=\"bannedMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"bannedMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"bannedMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"bannedMembersConfiguration.closeButtonIconURL\"\n    [options]=\"bannedMembersConfiguration.options\"\n    [menu]=\"bannedMembersConfiguration.menu\"\n    [disableUsersPresence]=\"bannedMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"bannedMembersConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"onCloseDetails\"\n    [onBack]=\"bannedMembersConfiguration.onBack || bannedMembers\">\n  </cometchat-banned-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openViewMembersPage\">\n  <cometchat-group-members\n    [groupMembersRequestBuilder]=\"groupMembersConfiguration?.groupMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"groupMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"groupMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"groupMembersConfiguration.listItemStyle\"\n    [groupMembersStyle]=\"groupMembersConfiguration.groupMembersStyle\"\n    [avatarStyle]=\"groupMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"groupMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"groupMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"groupMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"groupMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"groupMembersConfiguration.emptyStateView\"\n    [onSelect]=\"groupMembersConfiguration.onSelect\"\n    [onError]=\"groupMembersConfiguration.onError\"\n    [hideError]=\"groupMembersConfiguration.hideError\"\n    [hideSearch]=\"groupMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"groupMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"groupMembersConfiguration.selectionMode\"\n    [backdropStyle]=\"groupMembersConfiguration.backdropStyle\"\n    [hideSeparator]=\"groupMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"groupMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"groupMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"groupMembersConfiguration.closeButtonIconURL\"\n    [options]=\"groupMembersConfiguration.options\"\n    [menu]=\"groupMembersConfiguration.menu\"\n    [disableUsersPresence]=\"groupMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"groupMembersConfiguration.subtitleView\"\n    [groupScopeStyle]=\"groupMembersConfiguration.groupScopeStyle\"\n    [group]=\"group\"\n    [onClose]=\" groupMembersConfiguration.onClose || onCloseDetails\"\n    [onBack]=\"groupMembersConfiguration.onBack || viewMembers\">\n  </cometchat-group-members>\n</div>\n\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"confirmLeaveGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"leaveGroupDialogMessage\"\n    [cancelButtonText]=\"leaveGroupCancelButtonText\"\n    [confirmButtonText]=\"leaveGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"onLeaveClick()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"leaveGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"showTransferDialog\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"transferOwnershipDialogMessage\"\n    [cancelButtonText]=\"transferOwnershipCancelButtonText\"\n    [confirmButtonText]=\"transferOwnershipConfirmButtonText\"\n    (cc-confirm-clicked)=\"onTransferClick()\"\n    (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"transferOwnershipDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"openTransferOwnershipModal\">\n  <cometchat-transfer-ownership\n    [groupMembersRequestBuilder]=\"transferOwnershipConfiguration?.groupMembersRequestBuilder\"\n    [transferOwnershipStyle]=\"transferOwnershipConfiguration.transferOwnershipStyle\"\n    [onTransferOwnership]=\"transferOwnershipConfiguration.onTransferOwnership\"\n    [titleAlignment]=\"transferOwnershipConfiguration.titleAlignment\"\n    [listItemStyle]=\"transferOwnershipConfiguration.listItemStyle\"\n    [avatarStyle]=\"transferOwnershipConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"transferOwnershipConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"transferOwnershipConfiguration.loadingStateView\"\n    [loadingIconURL]=\"transferOwnershipConfiguration.loadingIconURL\"\n    [errorStateView]=\"transferOwnershipConfiguration.errorStateView\"\n    [emptyStateView]=\"transferOwnershipConfiguration.emptyStateView\"\n    [onError]=\"transferOwnershipConfiguration.onError\"\n    [hideSearch]=\"transferOwnershipConfiguration.hideSearch\"\n    [searchIconURL]=\"transferOwnershipConfiguration.searchIconURL\"\n    [hideSeparator]=\"transferOwnershipConfiguration.hideSeparator\"\n    [closeButtonIconURL]=\"transferOwnershipConfiguration.closeButtonIconURL\"\n    [options]=\"transferOwnershipConfiguration.options\"\n    [disableUsersPresence]=\"transferOwnershipConfiguration.disableUsersPresence\"\n    [subtitleView]=\"transferOwnershipConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"transferOwnershipConfiguration.onClose || openTransferOwnership\">\n  </cometchat-transfer-ownership>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"deleteGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"deleteGroupDialogMessage\"\n    [cancelButtonText]=\"deleteGroupCancelButtonText\"\n    [confirmButtonText]=\"deleteGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"deleteGroup()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"deleteGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n", styles: ["*{box-sizing:border-box;margin:0;padding:0}.cc-details__wrapper{padding:8px;border-radius:5px;height:100%;overflow:hidden}.cc-details__profile{margin-bottom:50px;height:8%}.cc-details__section-list{height:84%;width:100%;overflow-y:auto;overflow-x:hidden}.cc-details__header{display:flex;justify-content:center;align-items:center;margin-bottom:30px}.cc-details__close-button{position:absolute;right:20px}.cc-details__section{margin-bottom:32px}.cc-details__section-separator{margin-bottom:16px;padding-left:6px;height:5%}.cc-details__options-wrapper{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}.cc-details__option{display:flex;flex-direction:column;justify-content:space-evenly;min-height:50px}.cc-details__option-title{padding-bottom:12px;display:flex;align-items:center;justify-content:space-between}.cc-details__view{position:absolute;top:0;left:0;height:100%;width:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;max-width:100%;z-index:1}.cc-details__section-list::-webkit-scrollbar{background:transparent;width:8px}.cc-details__section-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-details__leavedialog,.cc-details__transferownership{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:-moz-fit-content;height:fit-content;width:100%;z-index:2}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXREZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0RGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULEtBQUssRUFFTCx1QkFBdUIsR0FLeEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsV0FBVyxFQUFpQixrQkFBa0IsRUFBRSxhQUFhLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQTtBQUMxRyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBeUIsRUFBRSw4QkFBOEIsR0FBYyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hOLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUErQyxtQkFBbUIsRUFBMkYsYUFBYSxFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDMVIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDOzs7Ozs7OztBQUMxRTs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyx5QkFBeUI7SUE0SnBDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxp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bkluaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgVGVtcGxhdGVSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgQmFja2Ryb3BTdHlsZSwgQ29uZmlybURpYWxvZ1N0eWxlLCBMaXN0SXRlbVN0eWxlLCB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBZGRNZW1iZXJzQ29uZmlndXJhdGlvbiwgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24sIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSwgRGV0YWlsc1N0eWxlLCBEZXRhaWxzVXRpbHMsIEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24sIFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiwgQmFzZVN0eWxlLCB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgSUdyb3VwTWVtYmVyQWRkZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgQ29tZXRDaGF0VXNlckV2ZW50cywgSUdyb3VwTWVtYmVySm9pbmVkLCBJT3duZXJzaGlwQ2hhbmdlZCwgQ29tZXRDaGF0RGV0YWlsc09wdGlvbiwgQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlLCBTZWxlY3Rpb25Nb2RlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdERldGFpbHNDb21wb25lbnQgcmVuZGVycyBkZXRhaWxzIG9mIHVzZXIgb3IgZ3JvdXAuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWRldGFpbHNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXREZXRhaWxzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJERVRBSUxTXCIpO1xuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVQcm9maWxlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGN1c3RvbVByb2ZpbGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGF0YT86IENvbWV0Q2hhdERldGFpbHNUZW1wbGF0ZVtdO1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBwcml2YXRlR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Qcml2YXRlLnN2Z1wiO1xuICAvKipcbiAgKiBAZGVwcmVjYXRlZFxuICAqXG4gICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGxlYXZlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9HUk9VUFwiKTtcbiAgQElucHV0KCkgbGVhdmVHcm91cENhbmNlbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9DT05GSVJNXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjA2KVwiLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IFwiNjAwIDE1cHggSW50ZXJcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIG1lc3NhZ2VUZXh0Rm9udDogXCI0MDAgMTNweCBJbnRlclwiLFxuICAgIG1lc3NhZ2VUZXh0Q29sb3I6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNGMkYyRjJcIixcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVcIik7XG4gIEBJbnB1dCgpIGRlbGV0ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVfQ09ORklSTVwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDYW5jZWxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTkNFTFwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBEaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxODBweFwiLFxuICAgIHdpZHRoOiBcIjM2MHB4XCJcbiAgfVxuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpcm1CdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX09XTkVSU0hJUFwiKTtcbiAgQElucHV0KCkgdHJhbnNmZXJPd25lcnNoaXBEaWFsb2dNZXNzYWdlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX0NPTkZJUk1cIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwQ2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cblxuICBASW5wdXQoKSBhZGRNZW1iZXJzQ29uZmlndXJhdGlvbjogQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbjogQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBncm91cE1lbWJlcnNDb25maWd1cmF0aW9uOiBHcm91cE1lbWJlcnNDb25maWd1cmF0aW9uID0gbmV3IEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb246IFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiA9IG5ldyBUcmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24oe30pO1xuXG5cbiAgYmFja2ljb251cmwgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiXG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCJcbiAgfVxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuXG4gIH07XG4gIEBJbnB1dCgpIGRldGFpbHNTdHlsZTogRGV0YWlsc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiZ3JleVwiLFxuICAgIHRpdGxlRm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlQ29sb3I6IFwiYmxhY2tcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG5cblxuICBzaG93VHJhbnNmZXJEaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZGVmYXVsdFRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGVbXSA9IFtdXG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcGVuVmlld01lbWJlcnNQYWdlOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBvcGVuQmFubmVkTWVtYmVyc1BhZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIG9wZW5BZGRNZW1iZXJzUGFnZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uZmlybUxlYXZlR3JvdXBNb2RhbDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgb3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZVxuICBzZWxlY3Rpb25tb2RlRW51bTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubXVsdGlwbGU7XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICBjbG9zZUJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogdGhpcy5kZXRhaWxzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICB9XG4gIGJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpIHx8IFwicmdiYSg1MSwgMTUzLCAyNTUpXCIsXG4gICAgYnV0dG9uVGV4dEZvbnQ6IFwiNTAwIDE2cHggSW50ZXJcIlxuICB9XG4gIGRpdmlkZXJTdHlsZTogYW55ID0ge1xuICAgIGJhY2tncm91bmQ6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiLFxuICAgIGhlaWdodDogXCIxcHhcIixcbiAgICB3aWR0aDogXCIxMDAlXCJcbiAgfVxuXG4gIGRlbGV0ZUdyb3VwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZ2V0VGl0bGVTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dEZvbnQgfHwgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dENvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KClcbiAgICB9XG4gIH1cbiAgZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICByZXR1cm4gb3B0aW9uPy5jdXN0b21WaWV3XG4gIH1cbiAgcHVibGljIHN1YnRpdGxlVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUoKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgICB0aGlzLmdldFRlbXBsYXRlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0VGVtcGxhdGUoKSB7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSB0aGlzLmRhdGFcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmRlZmF1bHRUZW1wbGF0ZSA9IERldGFpbHNVdGlscy5nZXREZWZhdWx0RGV0YWlsc1RlbXBsYXRlKHRoaXMubG9nZ2VkSW5Vc2VyLCB0aGlzLnVzZXIsIHRoaXMuZ3JvdXAsIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZClcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSBbXTtcbiAgICB0aGlzLm9uQ2xvc2VEZXRhaWxzKClcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKVxuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKClcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKClcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuZGV0YWlsc1N0eWxlLm9ubGluZVN0YXR1c0NvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxuICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICB9XG5cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LnVzZXJBZGRlZEluITtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy51c2VyQWRkZWRJbiFcbiAgICAgIHRoaXMub3BlbkFkZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LmpvaW5lZEdyb3VwO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8ua2lja2VkRnJvbSE7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy5raWNrZWRGcm9tITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/Lmdyb3VwITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKTtcbiAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgY2hlY2tTdGF0dXNUeXBlID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLnVzZXIgJiYgIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UgPyB0aGlzLnN0YXR1c0NvbG9yW3RoaXMudXNlcj8uZ2V0U3RhdHVzKCldIDogdGhpcy5zdGF0dXNDb2xvclt0aGlzLmdyb3VwPy5nZXRUeXBlKCldXG4gIH1cbiAgdXBkYXRlU3VidGl0bGUoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLmdyb3VwPy5nZXRNZW1iZXJzQ291bnQoKTtcbiAgICBjb25zdCBtZW1iZXJzVGV4dCA9IGxvY2FsaXplKGNvdW50ID4gMSA/IFwiTUVNQkVSU1wiIDogXCJNRU1CRVJcIik7XG4gICAgdGhpcy5zdWJ0aXRsZVRleHQgPSB0aGlzLnVzZXIgPyB0aGlzLnVzZXIuZ2V0U3RhdHVzKCkgOiBgJHtjb3VudH0gJHttZW1iZXJzVGV4dH1gO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBnZXRCdXR0b25TdHlsZShvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IG9wdGlvbj8udGl0bGVGb250LFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiBvcHRpb24/LnRpdGxlQ29sb3IsXG4gICAgICBiYWNrZ3JvdW5kOiBvcHRpb24/LmJhY2tncm91bmRDb2xvciB8fCBcInRyYW5zcGFyZW50XCJcbiAgICB9XG4gIH1cbiAgY2hlY2tHcm91cFR5cGUoKTogc3RyaW5nIHtcbiAgICBsZXQgaW1hZ2U6IHN0cmluZyA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHN3aXRjaCAodGhpcy5ncm91cD8uZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucGFzc3dvcmRHcm91cEljb24gfHwgdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGltYWdlID0gXCJcIlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW1hZ2VcbiAgfVxuICB1cGRhdGVVc2VyU3RhdHVzKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgaWYgKHRoaXMudXNlciAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgJiYgdGhpcy51c2VyLmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpKSB7XG4gICAgICB0aGlzLnVzZXIuc2V0U3RhdHVzKHVzZXIuZ2V0U3RhdHVzKCkpO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgfVxuICAgIC8vIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSkge1xuICAgICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMob25saW5lVXNlcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhvZmZsaW5lVXNlcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0U2VjdGlvbkhlYWRlclN0eWxlKHRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRlbXBsYXRlLnRpdGxlRm9udCxcbiAgICAgIHRleHRDb2xvcjogdGVtcGxhdGUudGl0bGVDb2xvclxuICAgIH1cbiAgfVxuICBvbk9wdGlvbkNsaWNrKG9wdGlvbjogQ29tZXRDaGF0RGV0YWlsc09wdGlvbikge1xuICAgIGNvbnN0IHsgb25DbGljaywgaWQgfSA9IG9wdGlvbjtcbiAgICBpZiAob25DbGljaykge1xuICAgICAgb25DbGljayh0aGlzLnVzZXIgPz8gdGhpcy5ncm91cCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN3aXRjaCAoaWQpIHtcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuVXNlck9wdGlvbnMudmlld1Byb2ZpbGU6XG4gICAgICAgIGlmICh0aGlzLnVzZXI/LmdldExpbmsoKSkge1xuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gdGhpcy51c2VyLmdldExpbmsoKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuVXNlck9wdGlvbnMuYmxvY2s6XG4gICAgICAgIHRoaXMuYmxvY2tVc2VyKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Vc2VyT3B0aW9ucy51bmJsb2NrOlxuICAgICAgICB0aGlzLnVuQmxvY2tVc2VyKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMudmlld01lbWJlcnM6XG4gICAgICAgIHRoaXMudmlld01lbWJlcnMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwT3B0aW9ucy5hZGRNZW1iZXJzOlxuICAgICAgICB0aGlzLmFkZE1lbWJlcnMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwT3B0aW9ucy5iYW5uZWRNZW1iZXJzOlxuICAgICAgICB0aGlzLmJhbm5lZE1lbWJlcnMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwT3B0aW9ucy5sZWF2ZTpcbiAgICAgICAgdGhpcy5sZWF2ZUdyb3VwKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuZGVsZXRlOlxuICAgICAgICB0aGlzLnNob3dEZWxldGVEaWFsb2coKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgb25UcmFuc2ZlckNsaWNrKCkge1xuICAgIGlmICh0aGlzLmdyb3VwLmdldE93bmVyKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93VHJhbnNmZXJEaWFsb2cgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgb25MZWF2ZUNsaWNrKCkge1xuICAgIENvbWV0Q2hhdC5sZWF2ZUdyb3VwKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSAtIDEpXG4gICAgICAgIHRoaXMuZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uQ2xvc2VEZXRhaWxzKClcbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQubmV4dCh7XG4gICAgICAgICAgdXNlckxlZnQ6IHRoaXMubG9nZ2VkSW5Vc2VyISxcbiAgICAgICAgICBsZWZ0R3JvdXA6IHRoaXMuZ3JvdXAsXG4gICAgICAgICAgbWVzc2FnZTogdGhpcy5jcmVhdGVVc2VyTGVmdEFjdGlvbih0aGlzLmxvZ2dlZEluVXNlciEsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQpXG5cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHsgdGhpcy5vbkVycm9yKGVycm9yKSB9XG4gICAgICB9KTtcbiAgfVxuICBjcmVhdGVBY3Rpb25NZXNzYWdlKGFjdGlvbk9uOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGFjdGlvbjogc3RyaW5nKSB7XG4gICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24gPSBuZXcgQ29tZXRDaGF0LkFjdGlvbih0aGlzLmdyb3VwLmdldEd1aWQoKSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uIGFzIGFueSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbihhY3Rpb24pXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25CeSh0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25Gb3IodGhpcy5ncm91cClcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbk9uKGFjdGlvbk9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0UmVjZWl2ZXIodGhpcy5ncm91cClcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRDb252ZXJzYXRpb25JZChcImdyb3VwX1wiICsgdGhpcy5ncm91cC5nZXRHdWlkKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TWVzc2FnZShgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSAke2FjdGlvbn0gJHthY3Rpb25Pbi5nZXROYW1lKCl9YClcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TmV3U2NvcGUoYWN0aW9uT24uZ2V0U2NvcGUoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyVHlwZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKTtcblxuICAgIHJldHVybiBhY3Rpb25NZXNzYWdlXG4gIH1cbiAgY3JlYXRlVXNlckxlZnRBY3Rpb24oYWN0aW9uT246IENvbWV0Q2hhdC5Vc2VyLCBhY3Rpb246IHN0cmluZykge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24odGhpcy5ncm91cC5nZXRHdWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiBhcyBhbnkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uQnkodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uRm9yKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25PbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyVHlwZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKTtcbiAgICBsZXQgbWVzc2FnZTogc3RyaW5nID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVCA/IGAke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9ICR7YWN0aW9ufWAgOiBgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSAke2FjdGlvbn0gJHthY3Rpb25Pbi5nZXROYW1lKCl9YFxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TWVzc2FnZShtZXNzYWdlKVxuICAgIHJldHVybiBhY3Rpb25NZXNzYWdlXG4gIH1cblxuICBvbkNhbmNlbENsaWNrKCkge1xuICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgIHRoaXMuZGVsZXRlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gZmFsc2U7XG4gIH1cbiAgYmxvY2tVc2VyKCkge1xuICAgIC8vIGJsb2NrIHVzZXJcbiAgICBpZiAodGhpcy51c2VyICYmICF0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSkge1xuICAgICAgQ29tZXRDaGF0LmJsb2NrVXNlcnMoW3RoaXMudXNlci5nZXRVaWQoKV0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnVzZXIuc2V0QmxvY2tlZEJ5TWUodHJ1ZSlcbiAgICAgICAgQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLm5leHQodGhpcy51c2VyKVxuICAgICAgICB0aGlzLmdldFRlbXBsYXRlKCk7XG4gICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgIH1cbiAgfVxuICB1bkJsb2NrVXNlcigpIHtcbiAgICAvLyB1bmJsb2NrIHVzZXJcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpKSB7XG4gICAgICBDb21ldENoYXQudW5ibG9ja1VzZXJzKFt0aGlzLnVzZXIuZ2V0VWlkKCldKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy51c2VyLnNldEJsb2NrZWRCeU1lKGZhbHNlKVxuICAgICAgICBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlclVuYmxvY2tlZC5uZXh0KHRoaXMudXNlcilcbiAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZSgpXG4gICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgIH1cbiAgfVxuICB2aWV3TWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSAhdGhpcy5vcGVuVmlld01lbWJlcnNQYWdlO1xuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfVxuICBhZGRNZW1iZXJzID0gKCkgPT4ge1xuICAgIHRoaXMub3BlbkFkZE1lbWJlcnNQYWdlID0gIXRoaXMub3BlbkFkZE1lbWJlcnNQYWdlO1xuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5vcGVuVmlld01lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGJhbm5lZE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5CYW5uZWRNZW1iZXJzUGFnZSA9ICF0aGlzLm9wZW5CYW5uZWRNZW1iZXJzUGFnZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfVxuXG4gIGxlYXZlR3JvdXAoKSB7XG4gICAgaWYgKHRoaXMuZ3JvdXAuZ2V0T3duZXIoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IHRydWVcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBzaG93RGVsZXRlRGlhbG9nKCkge1xuICAgIHRoaXMuZGVsZXRlR3JvdXBNb2RhbCA9IHRydWU7XG4gIH1cbiAgZGVsZXRlR3JvdXAoKSB7XG4gICAgdGhpcy5kZWxldGVHcm91cE1vZGFsID0gZmFsc2U7XG4gICAgQ29tZXRDaGF0LmRlbGV0ZUdyb3VwKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBEZWxldGVkLm5leHQodGhpcy5ncm91cClcbiAgICAgIHRoaXMub25DbG9zZURldGFpbHMoKVxuICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gIH1cbiAgb3BlblRyYW5zZmVyT3duZXJzaGlwID0gKCkgPT4ge1xuICAgIHRoaXMub3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWwgPSAhdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbDtcbiAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgfVxuICBvbkNsb3NlRGV0YWlscyA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKVxuICAgIH1cbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFN0YXR1cygpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogdGhpcy5kZXRhaWxzU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLmRldGFpbHNTdHlsZS5zdWJ0aXRsZVRleHRDb2xvclxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAqL1xuICBnZXRHcm91cEljb24gPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGxldCBzdGF0dXM7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHN0YXR1cyA9IG51bGxcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXR1c1xuICB9XG4gIC8qKlxuKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4qL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbKGdyb3VwPy5nZXRUeXBlKCkgYXMgc3RyaW5nKV07XG4gIH1cbiAgZ2V0VGVtcGxhdGVPcHRpb25zID0gKHRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGUpID0+IHtcbiAgICBpZiAodGVtcGxhdGUub3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRlbXBsYXRlLm9wdGlvbnModGhpcy51c2VyLCB0aGlzLmdyb3VwLCB0ZW1wbGF0ZS5pZCBhcyBzdHJpbmcpXG4gICAgfVxuICAgIGVsc2UgcmV0dXJuIFtdXG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldERldGFpbHNTdHlsZSgpXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpXG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpXG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKCk7XG4gICAgdGhpcy5zZXRDb25maXJtRGlhbG9nU3R5bGUoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnByaXZhdGUgPSB0aGlzLmRldGFpbHNTdHlsZS5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuZGV0YWlsc1N0eWxlLm9ubGluZVN0YXR1c0NvbG9yO1xuICAgIHRoaXMuc3RhdHVzQ29sb3IucGFzc3dvcmQgPSB0aGlzLmRldGFpbHNTdHlsZS5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmRcbiAgfVxuICBzZXRDb25maXJtRGlhbG9nU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0gbmV3IENvbmZpcm1EaWFsb2dTdHlsZSh7XG4gICAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJkYXJrXCIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBtZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMzUwcHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIlxuICAgIH0pXG4gICAgbGV0IGRlZmF1bHREZWxldGVEaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0gbmV3IENvbmZpcm1EaWFsb2dTdHlsZSh7XG4gICAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjM1MHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgICB9KVxuICAgIHRoaXMubGVhdmVHcm91cERpYWxvZ1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGVhdmVHcm91cERpYWxvZ1N0eWxlIH1cbiAgICB0aGlzLnRyYW5zZmVyT3duZXJzaGlwRGlhbG9nU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy50cmFuc2Zlck93bmVyc2hpcERpYWxvZ1N0eWxlIH1cbiAgICB0aGlzLmRlbGV0ZUdyb3VwRGlhbG9nU3R5bGUgPSB7IC4uLmRlZmF1bHREZWxldGVEaWFsb2dTdHlsZSwgLi4udGhpcy5kZWxldGVHcm91cERpYWxvZ1N0eWxlIH1cbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pXG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pXG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH1cbiAgfVxuICBzZXRTdGF0dXNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG5cbiAgICB9XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlIH1cbiAgfVxuICBzZXREZXRhaWxzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogRGV0YWlsc1N0eWxlID0gbmV3IERldGFpbHNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZDogXCJSR0IoMjQ3LCAxNjUsIDApXCIsXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcGFkZGluZzogXCIwIDEwMHB4XCJcbiAgICB9KVxuICAgIHRoaXMuZGV0YWlsc1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGV0YWlsc1N0eWxlIH1cbiAgfVxuICB3cmFwcGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiB0aGlzLmRldGFpbHNTdHlsZS53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5kZXRhaWxzU3R5bGUuaGVpZ2h0LFxuICAgICAgYm9yZGVyOiB0aGlzLmRldGFpbHNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuZGV0YWlsc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuZGV0YWlsc1N0eWxlLmJhY2tncm91bmQsXG4gICAgfVxuICB9XG4gIG1hcmdpblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBwYWRkaW5nOiB0aGlzLmRldGFpbHNTdHlsZT8ucGFkZGluZ1xuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3dyYXBwZXJcIiAqbmdJZj1cInVzZXIgfHwgZ3JvdXBcIlxuICBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19faGVhZGVyXCI+XG4gICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJ0aXRsZVwiXG4gICAgICBbbGFiZWxTdHlsZV09XCJnZXRUaXRsZVN0eWxlKClcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJjbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgICAgY2xhc3M9XCJjYy1kZXRhaWxzX19jbG9zZS1idXR0b25cIiBbYnV0dG9uU3R5bGVdPVwiY2xvc2VCdXR0b25TdHlsZVwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib25DbG9zZURldGFpbHMoKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzXCIgW25nU3R5bGVdPVwibWFyZ2luU3R5bGUoKVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19wcm9maWxlXCIgKm5nSWY9XCIhaGlkZVByb2ZpbGVcIj5cbiAgICAgIDxjb21ldGNoYXQtbGlzdC1pdGVtICpuZ0lmPVwiIWN1c3RvbVByb2ZpbGVWaWV3O2Vsc2UgbGlzdGl0ZW1cIlxuICAgICAgICBbYXZhdGFyTmFtZV09XCJ1c2VyPy5nZXROYW1lKCkgPz8gdGhpcy5ncm91cD8uZ2V0TmFtZSgpXCJcbiAgICAgICAgW2F2YXRhclVSTF09XCJ0aGlzLnVzZXI/LmdldEF2YXRhcigpID8/IHRoaXMuZ3JvdXA/LmdldEljb24oKVwiXG4gICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiY2hlY2tTdGF0dXNUeXBlKClcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJjaGVja0dyb3VwVHlwZSgpXCJcbiAgICAgICAgW3RpdGxlXT1cInRoaXMudXNlcj8uZ2V0TmFtZSgpID8/IHRoaXMuZ3JvdXA/LmdldE5hbWUoKVwiXG4gICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cImZhbHNlXCIgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCI+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgIDxkaXYgKm5nSWY9XCIhc3VidGl0bGVWaWV3OyBlbHNlIHN1YnRpdGxlXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cInN1YnRpdGxlVGV4dFwiXG4gICAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNzdWJ0aXRsZT5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCB9XCI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fc2VjdGlvbi1saXN0XCJcbiAgICAgICpuZ0lmPVwiZGVmYXVsdFRlbXBsYXRlICYmIGRlZmF1bHRUZW1wbGF0ZS5sZW5ndGggPiAwXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fc2VjdGlvblwiICpuZ0Zvcj1cImxldCBpdGVtIG9mIGRlZmF1bHRUZW1wbGF0ZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fc2VjdGlvbi1zZXBhcmF0b3JcIiAqbmdJZj1cIml0ZW0udGl0bGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cIml0ZW0udGl0bGVcIlxuICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwiZ2V0U2VjdGlvbkhlYWRlclN0eWxlKGl0ZW0pXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fb3B0aW9ucy13cmFwcGVyXCJcbiAgICAgICAgICAqbmdJZj1cImdldFRlbXBsYXRlT3B0aW9ucyhpdGVtKVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19vcHRpb25zXCJcbiAgICAgICAgICAgICpuZ0Zvcj1cImxldCBvcHRpb24gb2YgZ2V0VGVtcGxhdGVPcHRpb25zKGl0ZW0pXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fb3B0aW9uXCJcbiAgICAgICAgICAgICAgKm5nSWY9XCIhZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb24pO2Vsc2UgY3VzdG9tVmlld1wiXG4gICAgICAgICAgICAgIChjbGljayk9XCJvbk9wdGlvbkNsaWNrKG9wdGlvbilcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbi10aXRsZVwiPlxuICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFt0ZXh0XT1cIm9wdGlvbi50aXRsZVwiXG4gICAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiZ2V0QnV0dG9uU3R5bGUob3B0aW9uKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fb3B0aW9uLXRhaWxcIiAqbmdJZj1cIm9wdGlvbj8udGFpbFwiPlxuICAgICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm9wdGlvbj8udGFpbFwiPjwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1kaXZpZGVyXG4gICAgICAgICAgICAgICAgW2RpdmlkZXJTdHlsZV09XCJkaXZpZGVyU3R5bGVcIj48L2NvbWV0Y2hhdC1kaXZpZGVyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgI2N1c3RvbVZpZXc+XG4gICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRDdXN0b21PcHRpb25WaWV3KG9wdGlvbilcIj5cbiAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvZGl2PlxuPG5nLXRlbXBsYXRlICNsaXN0aXRlbT5cbiAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImN1c3RvbVByb2ZpbGVWaWV3XCI+XG4gIDwvbmctY29udGFpbmVyPlxuPC9uZy10ZW1wbGF0ZT5cbjxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX192aWV3XCIgKm5nSWY9XCJvcGVuQWRkTWVtYmVyc1BhZ2VcIj5cbiAgPGNvbWV0Y2hhdC1hZGQtbWVtYmVyc1xuICAgIFt0aXRsZUFsaWdubWVudF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udGl0bGVBbGlnbm1lbnQhXCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubGlzdEl0ZW1TdHlsZSFcIlxuICAgIFthZGRNZW1iZXJzU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmFkZE1lbWJlcnNTdHlsZSFcIlxuICAgIFthdmF0YXJTdHlsZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uYXZhdGFyU3R5bGUhXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnN0YXR1c0luZGljYXRvclN0eWxlIVwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmxvYWRpbmdTdGF0ZVZpZXchXCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmxvYWRpbmdJY29uVVJMIVwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5lcnJvclN0YXRlVmlld1wiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5lbXB0eVN0YXRlVmlld1wiXG4gICAgW29uU2VsZWN0XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vblNlbGVjdCFcIlxuICAgIFtvbkVycm9yXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkVycm9yIVwiXG4gICAgW2hpZGVFcnJvcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uaGlkZUVycm9yIVwiXG4gICAgW2hpZGVTZWFyY2hdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmhpZGVTZWFyY2ghXCJcbiAgICBbc2VhcmNoSWNvblVSTF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VhcmNoSWNvblVSTCFcIlxuICAgIFtzZWxlY3Rpb25Nb2RlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zZWxlY3Rpb25Nb2RlIVwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmhpZGVTZXBhcmF0b3IhXCJcbiAgICBbc2hvd0JhY2tCdXR0b25dPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNob3dCYWNrQnV0dG9uIVwiXG4gICAgW3Nob3dTZWN0aW9uSGVhZGVyXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zaG93U2VjdGlvbkhlYWRlciFcIlxuICAgIFtvbkFkZE1lbWJlcnNCdXR0b25DbGlja109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25BZGRNZW1iZXJzQnV0dG9uQ2xpY2shXCJcbiAgICBbdXNlcnNDb25maWd1cmF0aW9uXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy51c2Vyc0NvbmZpZ3VyYXRpb25cIlxuICAgIFtiYWNrQnV0dG9uSWNvblVSTF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uYmFja0J1dHRvbkljb25VUkwhXCJcbiAgICBbc2VjdGlvbkhlYWRlckZpZWxkXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zZWN0aW9uSGVhZGVyRmllbGQhXCJcbiAgICBbY2xvc2VCdXR0b25JY29uVVJMXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5jbG9zZUJ1dHRvbkljb25VUkwhXCJcbiAgICBbb3B0aW9uc109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub3B0aW9ucyFcIlxuICAgIFttZW51XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5tZW51XCJcbiAgICBbZGlzYWJsZVVzZXJzUHJlc2VuY2VdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmRpc2FibGVVc2Vyc1ByZXNlbmNlIVwiXG4gICAgW3N1YnRpdGxlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc3VidGl0bGVWaWV3XCIgW2dyb3VwXT1cImdyb3VwXCJcbiAgICBbc2VsZWN0aW9uTW9kZV09XCJzZWxlY3Rpb25tb2RlRW51bVwiXG4gICAgW29uQ2xvc2VdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQ2xvc2UgfHwgb25DbG9zZURldGFpbHNcIlxuICAgIFtvbkJhY2tdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQmFjayB8fCBhZGRNZW1iZXJzXCJcbiAgICBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udXNlcnNSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFtzZWFyY2hSZXF1ZXN0QnVpbGRlcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udXNlcnNSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFtsaXN0SXRlbVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtVmlld1wiPlxuICA8L2NvbWV0Y2hhdC1hZGQtbWVtYmVycz5cbjwvZGl2PlxuPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3ZpZXdcIiAqbmdJZj1cIm9wZW5CYW5uZWRNZW1iZXJzUGFnZVwiPlxuICA8Y29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzXG4gICAgW2xpc3RJdGVtVmlld109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubGlzdEl0ZW1WaWV3XCJcbiAgICBbYmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uPy5iYW5uZWRNZW1iZXJzUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaFJlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnRpdGxlQWxpZ25tZW50XCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbYmFubmVkTWVtYmVyc1N0eWxlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmJhbm5lZE1lbWJlcnNTdHlsZVwiXG4gICAgW2F2YXRhclN0eWxlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmVycm9yU3RhdGVWaWV3XCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvblNlbGVjdF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdFwiXG4gICAgW29uRXJyb3JdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW2hpZGVFcnJvcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5oaWRlRXJyb3JcIlxuICAgIFtoaWRlU2VhcmNoXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZWFyY2hcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnNlYXJjaEljb25VUkxcIlxuICAgIFtzZWxlY3Rpb25Nb2RlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnNlbGVjdGlvbk1vZGVcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgIFtzaG93QmFja0J1dHRvbl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5zaG93QmFja0J1dHRvblwiXG4gICAgW2JhY2tCdXR0b25JY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tCdXR0b25JY29uVVJMXCJcbiAgICBbY2xvc2VCdXR0b25JY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgW29wdGlvbnNdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ub3B0aW9uc1wiXG4gICAgW21lbnVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmRpc2FibGVVc2Vyc1ByZXNlbmNlXCJcbiAgICBbc3VidGl0bGVWaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwib25DbG9zZURldGFpbHNcIlxuICAgIFtvbkJhY2tdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25CYWNrIHx8IGJhbm5lZE1lbWJlcnNcIj5cbiAgPC9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnM+XG48L2Rpdj5cbjxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX192aWV3XCIgKm5nSWY9XCJvcGVuVmlld01lbWJlcnNQYWdlXCI+XG4gIDxjb21ldGNoYXQtZ3JvdXAtbWVtYmVyc1xuICAgIFtncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcl09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uPy5ncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFtzZWFyY2hSZXF1ZXN0QnVpbGRlcl09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uPy5zZWFyY2hSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFt0aXRsZUFsaWdubWVudF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLnRpdGxlQWxpZ25tZW50XCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmxpc3RJdGVtU3R5bGVcIlxuICAgIFtncm91cE1lbWJlcnNTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmdyb3VwTWVtYmVyc1N0eWxlXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubG9hZGluZ0ljb25VUkxcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmVycm9yU3RhdGVWaWV3XCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW29uU2VsZWN0XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25TZWxlY3RcIlxuICAgIFtvbkVycm9yXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW2hpZGVFcnJvcl09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVFcnJvclwiXG4gICAgW2hpZGVTZWFyY2hdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICBbc2VhcmNoSWNvblVSTF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLnNlYXJjaEljb25VUkxcIlxuICAgIFtzZWxlY3Rpb25Nb2RlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VsZWN0aW9uTW9kZVwiXG4gICAgW2JhY2tkcm9wU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5iYWNrZHJvcFN0eWxlXCJcbiAgICBbaGlkZVNlcGFyYXRvcl09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgIFtzaG93QmFja0J1dHRvbl09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLnNob3dCYWNrQnV0dG9uXCJcbiAgICBbYmFja0J1dHRvbkljb25VUkxdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5iYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgW2Nsb3NlQnV0dG9uSWNvblVSTF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgW29wdGlvbnNdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vcHRpb25zXCJcbiAgICBbbWVudV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm1lbnVcIlxuICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmRpc2FibGVVc2Vyc1ByZXNlbmNlXCJcbiAgICBbc3VidGl0bGVWaWV3XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICBbZ3JvdXBTY29wZVN0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZ3JvdXBTY29wZVN0eWxlXCJcbiAgICBbZ3JvdXBdPVwiZ3JvdXBcIlxuICAgIFtvbkNsb3NlXT1cIiBncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9uQ2xvc2UgfHwgb25DbG9zZURldGFpbHNcIlxuICAgIFtvbkJhY2tdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkJhY2sgfHwgdmlld01lbWJlcnNcIj5cbiAgPC9jb21ldGNoYXQtZ3JvdXAtbWVtYmVycz5cbjwvZGl2PlxuXG48Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIlxuICAqbmdJZj1cImNvbmZpcm1MZWF2ZUdyb3VwTW9kYWxcIj5cbiAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiJydcIiBbbWVzc2FnZVRleHRdPVwibGVhdmVHcm91cERpYWxvZ01lc3NhZ2VcIlxuICAgIFtjYW5jZWxCdXR0b25UZXh0XT1cImxlYXZlR3JvdXBDYW5jZWxCdXR0b25UZXh0XCJcbiAgICBbY29uZmlybUJ1dHRvblRleHRdPVwibGVhdmVHcm91cENvbmZpcm1CdXR0b25UZXh0XCJcbiAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uTGVhdmVDbGljaygpXCIgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgW2NvbmZpcm1EaWFsb2dTdHlsZV09XCJsZWF2ZUdyb3VwRGlhbG9nU3R5bGVcIj5cbiAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbjxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiICpuZ0lmPVwic2hvd1RyYW5zZmVyRGlhbG9nXCI+XG4gIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cIicnXCJcbiAgICBbbWVzc2FnZVRleHRdPVwidHJhbnNmZXJPd25lcnNoaXBEaWFsb2dNZXNzYWdlXCJcbiAgICBbY2FuY2VsQnV0dG9uVGV4dF09XCJ0cmFuc2Zlck93bmVyc2hpcENhbmNlbEJ1dHRvblRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpcm1CdXR0b25UZXh0XCJcbiAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uVHJhbnNmZXJDbGljaygpXCJcbiAgICAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cInRyYW5zZmVyT3duZXJzaGlwRGlhbG9nU3R5bGVcIj5cbiAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbjxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiXG4gICpuZ0lmPVwib3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWxcIj5cbiAgPGNvbWV0Y2hhdC10cmFuc2Zlci1vd25lcnNoaXBcbiAgICBbZ3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXJdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uPy5ncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgW3RyYW5zZmVyT3duZXJzaGlwU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnRyYW5zZmVyT3duZXJzaGlwU3R5bGVcIlxuICAgIFtvblRyYW5zZmVyT3duZXJzaGlwXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5vblRyYW5zZmVyT3duZXJzaGlwXCJcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnRpdGxlQWxpZ25tZW50XCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2F2YXRhclN0eWxlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ubG9hZGluZ0ljb25VUkxcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvbkVycm9yXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbaGlkZVNlYXJjaF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uaGlkZVNlYXJjaFwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnNlYXJjaEljb25VUkxcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5oaWRlU2VwYXJhdG9yXCJcbiAgICBbY2xvc2VCdXR0b25JY29uVVJMXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5jbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgIFtvcHRpb25zXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5vcHRpb25zXCJcbiAgICBbZGlzYWJsZVVzZXJzUHJlc2VuY2VdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmRpc2FibGVVc2Vyc1ByZXNlbmNlXCJcbiAgICBbc3VidGl0bGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIiBbZ3JvdXBdPVwiZ3JvdXBcIlxuICAgIFtvbkNsb3NlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5vbkNsb3NlIHx8IG9wZW5UcmFuc2Zlck93bmVyc2hpcFwiPlxuICA8L2NvbWV0Y2hhdC10cmFuc2Zlci1vd25lcnNoaXA+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbjxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiICpuZ0lmPVwiZGVsZXRlR3JvdXBNb2RhbFwiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiXG4gICAgW21lc3NhZ2VUZXh0XT1cImRlbGV0ZUdyb3VwRGlhbG9nTWVzc2FnZVwiXG4gICAgW2NhbmNlbEJ1dHRvblRleHRdPVwiZGVsZXRlR3JvdXBDYW5jZWxCdXR0b25UZXh0XCJcbiAgICBbY29uZmlybUJ1dHRvblRleHRdPVwiZGVsZXRlR3JvdXBDb25maXJtQnV0dG9uVGV4dFwiXG4gICAgKGNjLWNvbmZpcm0tY2xpY2tlZCk9XCJkZWxldGVHcm91cCgpXCIgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgW2NvbmZpcm1EaWFsb2dTdHlsZV09XCJkZWxldGVHcm91cERpYWxvZ1N0eWxlXCI+XG4gIDwvY29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG4iXX0=