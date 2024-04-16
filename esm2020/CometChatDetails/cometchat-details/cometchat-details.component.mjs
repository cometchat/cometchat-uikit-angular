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
        this.protectedGroupIcon = "assets/Locked.svg";
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
        };
        this.addMembers = () => {
            this.openAddMembersPage = !this.openAddMembersPage;
            this.openBannedMembersPage = false;
            this.openViewMembersPage = false;
        };
        this.bannedMembers = () => {
            this.openAddMembersPage = false;
            this.openViewMembersPage = false;
            this.openBannedMembersPage = !this.openBannedMembersPage;
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
                        status = this.protectedGroupIcon;
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
                    image = this.protectedGroupIcon;
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
CometChatDetailsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatDetailsComponent, selector: "cometchat-details", inputs: { group: "group", user: "user", title: "title", closeButtonIconURL: "closeButtonIconURL", hideProfile: "hideProfile", subtitleView: "subtitleView", customProfileView: "customProfileView", data: "data", disableUsersPresence: "disableUsersPresence", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", onError: "onError", onClose: "onClose", leaveGroupConfirmButtonText: "leaveGroupConfirmButtonText", leaveGroupCancelButtonText: "leaveGroupCancelButtonText", leaveGroupDialogMessage: "leaveGroupDialogMessage", leaveGroupDialogStyle: "leaveGroupDialogStyle", deleteGroupConfirmButtonText: "deleteGroupConfirmButtonText", deleteGroupDialogMessage: "deleteGroupDialogMessage", deleteGroupCancelButtonText: "deleteGroupCancelButtonText", deleteGroupDialogStyle: "deleteGroupDialogStyle", transferOwnershipConfirmButtonText: "transferOwnershipConfirmButtonText", transferOwnershipDialogMessage: "transferOwnershipDialogMessage", transferOwnershipCancelButtonText: "transferOwnershipCancelButtonText", transferOwnershipDialogStyle: "transferOwnershipDialogStyle", addMembersConfiguration: "addMembersConfiguration", bannedMembersConfiguration: "bannedMembersConfiguration", groupMembersConfiguration: "groupMembersConfiguration", transferOwnershipConfiguration: "transferOwnershipConfiguration", statusIndicatorStyle: "statusIndicatorStyle", backdropStyle: "backdropStyle", avatarStyle: "avatarStyle", detailsStyle: "detailsStyle", listItemStyle: "listItemStyle" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-details__wrapper\" *ngIf=\"user || group\"\n  [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-details__header\">\n    <cometchat-label [text]=\"title\"\n      [labelStyle]=\"getTitleStyle()\"></cometchat-label>\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-details\" [ngStyle]=\"marginStyle()\">\n    <div class=\"cc-details__profile\" *ngIf=\"!hideProfile\">\n      <cometchat-list-item *ngIf=\"!customProfileView;else listitem\"\n        [avatarName]=\"user?.getName() ?? this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() ?? this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() ?? this.group?.getName()\"\n        [hideSeparator]=\"false\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n            </ng-container>\n          </ng-template>\n        </div>\n      </cometchat-list-item>\n    </div>\n    <div class=\"cc-details__section-list\"\n      *ngIf=\"defaultTemplate && defaultTemplate.length > 0\">\n      <div class=\"cc-details__section\" *ngFor=\"let item of defaultTemplate\">\n        <div class=\"cc-details__section-separator\" *ngIf=\"item.title\">\n          <cometchat-label [text]=\"item.title\"\n            [labelStyle]=\"getSectionHeaderStyle(item)\"></cometchat-label>\n        </div>\n        <div class=\"cc-details__options-wrapper\"\n          *ngIf=\"getTemplateOptions(item)\">\n          <div class=\"cc-details__options\"\n            *ngFor=\"let option of getTemplateOptions(item)\">\n            <div class=\"cc-details__option\"\n              *ngIf=\"!getCustomOptionView(option);else customView\"\n              (click)=\"onOptionClick(option)\">\n              <div class=\"cc-details__option-title\">\n                <cometchat-button [text]=\"option.title\"\n                  [buttonStyle]=\"getButtonStyle(option)\"></cometchat-button>\n                <div class=\"cc-details__option-tail\" *ngIf=\"option?.tail\">\n                  <ng-container *ngTemplateOutlet=\"option?.tail\"></ng-container>\n                </div>\n              </div>\n              <cometchat-divider\n                [dividerStyle]=\"dividerStyle\"></cometchat-divider>\n            </div>\n            <ng-template #customView>\n              <ng-container *ngTemplateOutlet=\"getCustomOptionView(option)\">\n              </ng-container>\n            </ng-template>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template #listitem>\n  <ng-container *ngTemplateOutlet=\"customProfileView\">\n  </ng-container>\n</ng-template>\n<div class=\"cc-details__view\" *ngIf=\"openAddMembersPage\">\n  <cometchat-add-members\n    [titleAlignment]=\"addMembersConfiguration?.titleAlignment!\"\n    [listItemStyle]=\"addMembersConfiguration?.listItemStyle!\"\n    [addMembersStyle]=\"addMembersConfiguration?.addMembersStyle!\"\n    [avatarStyle]=\"addMembersConfiguration?.avatarStyle!\"\n    [statusIndicatorStyle]=\"addMembersConfiguration?.statusIndicatorStyle!\"\n    [loadingStateView]=\"addMembersConfiguration?.loadingStateView!\"\n    [loadingIconURL]=\"addMembersConfiguration?.loadingIconURL!\"\n    [errorStateView]=\"addMembersConfiguration?.errorStateView\"\n    [emptyStateView]=\"addMembersConfiguration?.emptyStateView\"\n    [onSelect]=\"addMembersConfiguration?.onSelect!\"\n    [onError]=\"addMembersConfiguration?.onError!\"\n    [hideError]=\"addMembersConfiguration?.hideError!\"\n    [hideSearch]=\"addMembersConfiguration?.hideSearch!\"\n    [searchIconURL]=\"addMembersConfiguration?.searchIconURL!\"\n    [selectionMode]=\"addMembersConfiguration?.selectionMode!\"\n    [hideSeparator]=\"addMembersConfiguration?.hideSeparator!\"\n    [showBackButton]=\"addMembersConfiguration?.showBackButton!\"\n    [showSectionHeader]=\"addMembersConfiguration?.showSectionHeader!\"\n    [onAddMembersButtonClick]=\"addMembersConfiguration?.onAddMembersButtonClick!\"\n    [usersConfiguration]=\"addMembersConfiguration?.usersConfiguration\"\n    [backButtonIconURL]=\"addMembersConfiguration?.backButtonIconURL!\"\n    [sectionHeaderField]=\"addMembersConfiguration?.sectionHeaderField!\"\n    [closeButtonIconURL]=\"addMembersConfiguration?.closeButtonIconURL!\"\n    [options]=\"addMembersConfiguration?.options!\"\n    [menu]=\"addMembersConfiguration?.menu\"\n    [disableUsersPresence]=\"addMembersConfiguration?.disableUsersPresence!\"\n    [subtitleView]=\"addMembersConfiguration?.subtitleView\" [group]=\"group\"\n    [selectionMode]=\"selectionmodeEnum\"\n    [onClose]=\"addMembersConfiguration?.onClose || onCloseDetails\"\n    [onBack]=\"addMembersConfiguration?.onBack || addMembers\"\n    [usersRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [searchRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [listItemView]=\"addMembersConfiguration?.listItemView\">\n  </cometchat-add-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openBannedMembersPage\">\n  <cometchat-banned-members\n    [listItemView]=\"bannedMembersConfiguration?.listItemView\"\n    [bannedMembersRequestBuilder]=\"bannedMembersConfiguration?.bannedMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"bannedMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"bannedMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"bannedMembersConfiguration.listItemStyle\"\n    [bannedMembersStyle]=\"bannedMembersConfiguration.bannedMembersStyle\"\n    [avatarStyle]=\"bannedMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"bannedMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"bannedMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"bannedMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"bannedMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"bannedMembersConfiguration.emptyStateView\"\n    [onSelect]=\"bannedMembersConfiguration.onSelect\"\n    [onError]=\"bannedMembersConfiguration.onError\"\n    [hideError]=\"bannedMembersConfiguration.hideError\"\n    [hideSearch]=\"bannedMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"bannedMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"bannedMembersConfiguration.selectionMode\"\n    [hideSeparator]=\"bannedMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"bannedMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"bannedMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"bannedMembersConfiguration.closeButtonIconURL\"\n    [options]=\"bannedMembersConfiguration.options\"\n    [menu]=\"bannedMembersConfiguration.menu\"\n    [disableUsersPresence]=\"bannedMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"bannedMembersConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"onCloseDetails\"\n    [onBack]=\"bannedMembersConfiguration.onBack || bannedMembers\">\n  </cometchat-banned-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openViewMembersPage\">\n  <cometchat-group-members\n    [groupMembersRequestBuilder]=\"groupMembersConfiguration?.groupMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"groupMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"groupMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"groupMembersConfiguration.listItemStyle\"\n    [groupMembersStyle]=\"groupMembersConfiguration.groupMembersStyle\"\n    [avatarStyle]=\"groupMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"groupMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"groupMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"groupMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"groupMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"groupMembersConfiguration.emptyStateView\"\n    [onSelect]=\"groupMembersConfiguration.onSelect\"\n    [onError]=\"groupMembersConfiguration.onError\"\n    [hideError]=\"groupMembersConfiguration.hideError\"\n    [hideSearch]=\"groupMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"groupMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"groupMembersConfiguration.selectionMode\"\n    [backdropStyle]=\"groupMembersConfiguration.backdropStyle\"\n    [hideSeparator]=\"groupMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"groupMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"groupMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"groupMembersConfiguration.closeButtonIconURL\"\n    [options]=\"groupMembersConfiguration.options\"\n    [menu]=\"groupMembersConfiguration.menu\"\n    [disableUsersPresence]=\"groupMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"groupMembersConfiguration.subtitleView\"\n    [groupScopeStyle]=\"groupMembersConfiguration.groupScopeStyle\"\n    [group]=\"group\"\n    [onClose]=\" groupMembersConfiguration.onClose || onCloseDetails\"\n    [onBack]=\"groupMembersConfiguration.onBack || viewMembers\">\n  </cometchat-group-members>\n</div>\n\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"confirmLeaveGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"leaveGroupDialogMessage\"\n    [cancelButtonText]=\"leaveGroupCancelButtonText\"\n    [confirmButtonText]=\"leaveGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"onLeaveClick()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"leaveGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"showTransferDialog\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"transferOwnershipDialogMessage\"\n    [cancelButtonText]=\"transferOwnershipCancelButtonText\"\n    [confirmButtonText]=\"transferOwnershipConfirmButtonText\"\n    (cc-confirm-clicked)=\"onTransferClick()\"\n    (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"transferOwnershipDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"openTransferOwnershipModal\">\n  <cometchat-transfer-ownership\n    [groupMembersRequestBuilder]=\"transferOwnershipConfiguration?.groupMembersRequestBuilder\"\n    [transferOwnershipStyle]=\"transferOwnershipConfiguration.transferOwnershipStyle\"\n    [onTransferOwnership]=\"transferOwnershipConfiguration.onTransferOwnership\"\n    [titleAlignment]=\"transferOwnershipConfiguration.titleAlignment\"\n    [listItemStyle]=\"transferOwnershipConfiguration.listItemStyle\"\n    [avatarStyle]=\"transferOwnershipConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"transferOwnershipConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"transferOwnershipConfiguration.loadingStateView\"\n    [loadingIconURL]=\"transferOwnershipConfiguration.loadingIconURL\"\n    [errorStateView]=\"transferOwnershipConfiguration.errorStateView\"\n    [emptyStateView]=\"transferOwnershipConfiguration.emptyStateView\"\n    [onError]=\"transferOwnershipConfiguration.onError\"\n    [hideSearch]=\"transferOwnershipConfiguration.hideSearch\"\n    [searchIconURL]=\"transferOwnershipConfiguration.searchIconURL\"\n    [hideSeparator]=\"transferOwnershipConfiguration.hideSeparator\"\n    [closeButtonIconURL]=\"transferOwnershipConfiguration.closeButtonIconURL\"\n    [options]=\"transferOwnershipConfiguration.options\"\n    [disableUsersPresence]=\"transferOwnershipConfiguration.disableUsersPresence\"\n    [subtitleView]=\"transferOwnershipConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"transferOwnershipConfiguration.onClose || openTransferOwnership\">\n  </cometchat-transfer-ownership>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"deleteGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"deleteGroupDialogMessage\"\n    [cancelButtonText]=\"deleteGroupCancelButtonText\"\n    [confirmButtonText]=\"deleteGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"deleteGroup()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"deleteGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n", styles: ["*{box-sizing:border-box;margin:0;padding:0}.cc-details__wrapper{padding:8px;border-radius:5px;height:100%;overflow:hidden}.cc-details__profile{margin-bottom:50px;height:8%}.cc-details__section-list{height:84%;width:100%;overflow-y:auto;overflow-x:hidden}.cc-details__header{display:flex;justify-content:center;align-items:center;margin-bottom:30px}.cc-details__close-button{position:absolute;right:20px}.cc-details__section{margin-bottom:32px}.cc-details__section-separator{margin-bottom:16px;padding-left:6px;height:5%}.cc-details__options-wrapper{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}.cc-details__option{display:flex;flex-direction:column;justify-content:space-evenly;min-height:50px}.cc-details__option-title{padding-bottom:12px;display:flex;align-items:center;justify-content:space-between}.cc-details__view{position:absolute;top:0;left:0;height:100%;width:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;max-width:100%;z-index:1}.cc-details__section-list::-webkit-scrollbar{background:transparent;width:8px}.cc-details__section-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-details__leavedialog,.cc-details__transferownership{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:-moz-fit-content;height:fit-content;width:100%;z-index:2}\n"], components: [{ type: i2.CometChatAddMembersComponent, selector: "cometchat-add-members", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "hideError", "searchIconURL", "hideSearch", "title", "onError", "onBack", "onClose", "onSelect", "buttonText", "group", "emptyStateView", "errorStateView", "loadingIconURL", "listItemStyle", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "onAddMembersButtonClick", "titleAlignment", "addMembersStyle", "StatusIndicatorStyle", "avatarStyle"] }, { type: i3.CometChatBannedMembersComponent, selector: "cometchat-banned-members", inputs: ["bannedMembersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onSelect", "onBack", "onClose", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "unbanIconURL", "statusIndicatorStyle", "avatarStyle", "bannedMembersStyle", "listItemStyle"] }, { type: i4.CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "tailView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "backdropStyle", "onBack", "onClose", "onSelect", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "dropdownIconURL", "statusIndicatorStyle", "avatarStyle", "groupMembersStyle", "groupScopeStyle", "listItemStyle", "onItemClick", "onEmpty", "userPresencePlacement", "disableLoadingState", "searchKeyword"] }, { type: i5.CometChatTransferOwnershipComponent, selector: "cometchat-transfer-ownership", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "options", "closeButtonIconURL", "hideSeparator", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onClose", "onTransferOwnership", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "statusIndicatorStyle", "transferOwnershipStyle", "transferButtonText", "cancelButtonText", "avatarStyle", "groupMembersStyle", "listItemStyle", "titleAlignment"] }], directives: [{ type: i6.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i6.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i6.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i6.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXREZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0RGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULEtBQUssRUFFTCx1QkFBdUIsR0FLeEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsV0FBVyxFQUFpQixrQkFBa0IsRUFBRSxhQUFhLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQTtBQUMxRyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBeUIsRUFBRSw4QkFBOEIsR0FBYyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hOLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUErQyxtQkFBbUIsRUFBMkYsYUFBYSxFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDMVIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDOzs7Ozs7OztBQUMxRTs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyx5QkFBeUI7SUFzSnBDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxp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Q0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBR0csT0FBTztzQkFBZixLQUFLO2dCQUNHLDJCQUEyQjtzQkFBbkMsS0FBSztnQkFDRywwQkFBMEI7c0JBQWxDLEtBQUs7Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFnQkcsNEJBQTRCO3NCQUFwQyxLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFDRywyQkFBMkI7c0JBQW5DLEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUlHLGtDQUFrQztzQkFBMUMsS0FBSztnQkFDRyw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBQ0csaUNBQWlDO3NCQUF6QyxLQUFLO2dCQUNHLDRCQUE0QjtzQkFBcEMsS0FBSztnQkFLRyx1QkFBdUI7c0JBQS9CLEtBQUs7Z0JBQ0csMEJBQTBCO3NCQUFsQyxLQUFLO2dCQUNHLHlCQUF5QjtzQkFBakMsS0FBSztnQkFDRyw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBSUcsb0JBQW9CO3NCQUE1QixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsV0FBVztzQkFBbkIsS0FBSztnQkFPRyxZQUFZO3NCQUFwQixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIElucHV0LFxuICBPbkluaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgVGVtcGxhdGVSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgQmFja2Ryb3BTdHlsZSwgQ29uZmlybURpYWxvZ1N0eWxlLCBMaXN0SXRlbVN0eWxlLCB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBZGRNZW1iZXJzQ29uZmlndXJhdGlvbiwgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24sIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSwgRGV0YWlsc1N0eWxlLCBEZXRhaWxzVXRpbHMsIEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24sIFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiwgQmFzZVN0eWxlLCB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgSUdyb3VwTWVtYmVyQWRkZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgQ29tZXRDaGF0VXNlckV2ZW50cywgSUdyb3VwTWVtYmVySm9pbmVkLCBJT3duZXJzaGlwQ2hhbmdlZCwgQ29tZXRDaGF0RGV0YWlsc09wdGlvbiwgQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlLCBTZWxlY3Rpb25Nb2RlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdERldGFpbHNDb21wb25lbnQgcmVuZGVycyBkZXRhaWxzIG9mIHVzZXIgb3IgZ3JvdXAuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWRldGFpbHNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXREZXRhaWxzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJERVRBSUxTXCIpO1xuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVQcm9maWxlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGN1c3RvbVByb2ZpbGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGF0YT86IENvbWV0Q2hhdERldGFpbHNUZW1wbGF0ZVtdO1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBwcml2YXRlR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Qcml2YXRlLnN2Z1wiO1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGxlYXZlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9HUk9VUFwiKTtcbiAgQElucHV0KCkgbGVhdmVHcm91cENhbmNlbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9DT05GSVJNXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjA2KVwiLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IFwiNjAwIDE1cHggSW50ZXJcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIG1lc3NhZ2VUZXh0Rm9udDogXCI0MDAgMTNweCBJbnRlclwiLFxuICAgIG1lc3NhZ2VUZXh0Q29sb3I6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNGMkYyRjJcIixcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVcIik7XG4gIEBJbnB1dCgpIGRlbGV0ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVfQ09ORklSTVwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDYW5jZWxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTkNFTFwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBEaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxODBweFwiLFxuICAgIHdpZHRoOiBcIjM2MHB4XCJcbiAgfVxuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpcm1CdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX09XTkVSU0hJUFwiKTtcbiAgQElucHV0KCkgdHJhbnNmZXJPd25lcnNoaXBEaWFsb2dNZXNzYWdlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX0NPTkZJUk1cIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwQ2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cblxuICBASW5wdXQoKSBhZGRNZW1iZXJzQ29uZmlndXJhdGlvbjogQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbjogQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBncm91cE1lbWJlcnNDb25maWd1cmF0aW9uOiBHcm91cE1lbWJlcnNDb25maWd1cmF0aW9uID0gbmV3IEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb246IFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiA9IG5ldyBUcmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24oe30pO1xuXG5cbiAgYmFja2ljb251cmwgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiXG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCJcbiAgfVxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuXG4gIH07XG4gIEBJbnB1dCgpIGRldGFpbHNTdHlsZTogRGV0YWlsc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiZ3JleVwiLFxuICAgIHRpdGxlRm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlQ29sb3I6IFwiYmxhY2tcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG5cblxuICBzaG93VHJhbnNmZXJEaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZGVmYXVsdFRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGVbXSA9IFtdXG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcGVuVmlld01lbWJlcnNQYWdlOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBvcGVuQmFubmVkTWVtYmVyc1BhZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIG9wZW5BZGRNZW1iZXJzUGFnZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uZmlybUxlYXZlR3JvdXBNb2RhbDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgb3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZVxuICBzZWxlY3Rpb25tb2RlRW51bTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubXVsdGlwbGU7XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICBjbG9zZUJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogdGhpcy5kZXRhaWxzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICB9XG4gIGJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpIHx8IFwicmdiYSg1MSwgMTUzLCAyNTUpXCIsXG4gICAgYnV0dG9uVGV4dEZvbnQ6IFwiNTAwIDE2cHggSW50ZXJcIlxuICB9XG4gIGRpdmlkZXJTdHlsZTogYW55ID0ge1xuICAgIGJhY2tncm91bmQ6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiLFxuICAgIGhlaWdodDogXCIxcHhcIixcbiAgICB3aWR0aDogXCIxMDAlXCJcbiAgfVxuXG4gIGRlbGV0ZUdyb3VwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZ2V0VGl0bGVTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dEZvbnQgfHwgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dENvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KClcbiAgICB9XG4gIH1cbiAgZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICByZXR1cm4gb3B0aW9uPy5jdXN0b21WaWV3XG4gIH1cbiAgcHVibGljIHN1YnRpdGxlVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUoKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgICB0aGlzLmdldFRlbXBsYXRlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0VGVtcGxhdGUoKSB7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSB0aGlzLmRhdGFcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmRlZmF1bHRUZW1wbGF0ZSA9IERldGFpbHNVdGlscy5nZXREZWZhdWx0RGV0YWlsc1RlbXBsYXRlKHRoaXMubG9nZ2VkSW5Vc2VyLCB0aGlzLnVzZXIsIHRoaXMuZ3JvdXAsIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZClcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSBbXTtcbiAgICB0aGlzLm9uQ2xvc2VEZXRhaWxzKClcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKVxuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKClcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKClcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuZGV0YWlsc1N0eWxlLm9ubGluZVN0YXR1c0NvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxuICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICB9XG5cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LnVzZXJBZGRlZEluITtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy51c2VyQWRkZWRJbiFcbiAgICAgIHRoaXMub3BlbkFkZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LmpvaW5lZEdyb3VwO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8ua2lja2VkRnJvbSE7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy5raWNrZWRGcm9tITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/Lmdyb3VwITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKTtcbiAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgY2hlY2tTdGF0dXNUeXBlID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLnVzZXIgJiYgIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UgPyB0aGlzLnN0YXR1c0NvbG9yW3RoaXMudXNlcj8uZ2V0U3RhdHVzKCldIDogdGhpcy5zdGF0dXNDb2xvclt0aGlzLmdyb3VwPy5nZXRUeXBlKCldXG4gIH1cbiAgdXBkYXRlU3VidGl0bGUoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLmdyb3VwPy5nZXRNZW1iZXJzQ291bnQoKTtcbiAgICBjb25zdCBtZW1iZXJzVGV4dCA9IGxvY2FsaXplKGNvdW50ID4gMSA/IFwiTUVNQkVSU1wiIDogXCJNRU1CRVJcIik7XG4gICAgdGhpcy5zdWJ0aXRsZVRleHQgPSB0aGlzLnVzZXIgPyB0aGlzLnVzZXIuZ2V0U3RhdHVzKCkgOiBgJHtjb3VudH0gJHttZW1iZXJzVGV4dH1gO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBnZXRCdXR0b25TdHlsZShvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IG9wdGlvbj8udGl0bGVGb250LFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiBvcHRpb24/LnRpdGxlQ29sb3IsXG4gICAgICBiYWNrZ3JvdW5kOiBvcHRpb24/LmJhY2tncm91bmRDb2xvciB8fCBcInRyYW5zcGFyZW50XCJcbiAgICB9XG4gIH1cbiAgY2hlY2tHcm91cFR5cGUoKTogc3RyaW5nIHtcbiAgICBsZXQgaW1hZ2U6IHN0cmluZyA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHN3aXRjaCAodGhpcy5ncm91cD8uZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucHJvdGVjdGVkR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZTpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpbWFnZSA9IFwiXCJcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGltYWdlXG4gIH1cbiAgdXBkYXRlVXNlclN0YXR1cyh1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFVpZCgpICYmIHRoaXMudXNlci5nZXRVaWQoKSA9PT0gdXNlci5nZXRVaWQoKSkge1xuICAgICAgdGhpcy51c2VyLnNldFN0YXR1cyh1c2VyLmdldFN0YXR1cygpKTtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgIH1cbiAgICAvLyB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UpIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKG9ubGluZVVzZXIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMob2ZmbGluZVVzZXIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldFNlY3Rpb25IZWFkZXJTdHlsZSh0ZW1wbGF0ZTogQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0ZW1wbGF0ZS50aXRsZUZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRlbXBsYXRlLnRpdGxlQ29sb3JcbiAgICB9XG4gIH1cbiAgb25PcHRpb25DbGljayhvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICBjb25zdCB7IG9uQ2xpY2ssIGlkIH0gPSBvcHRpb247XG4gICAgaWYgKG9uQ2xpY2spIHtcbiAgICAgIG9uQ2xpY2sodGhpcy51c2VyID8/IHRoaXMuZ3JvdXApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzd2l0Y2ggKGlkKSB7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLlVzZXJPcHRpb25zLnZpZXdQcm9maWxlOlxuICAgICAgICBpZiAodGhpcy51c2VyPy5nZXRMaW5rKCkpIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHRoaXMudXNlci5nZXRMaW5rKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLlVzZXJPcHRpb25zLmJsb2NrOlxuICAgICAgICB0aGlzLmJsb2NrVXNlcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuVXNlck9wdGlvbnMudW5ibG9jazpcbiAgICAgICAgdGhpcy51bkJsb2NrVXNlcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBPcHRpb25zLnZpZXdNZW1iZXJzOlxuICAgICAgICB0aGlzLnZpZXdNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuYWRkTWVtYmVyczpcbiAgICAgICAgdGhpcy5hZGRNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuYmFubmVkTWVtYmVyczpcbiAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMubGVhdmU6XG4gICAgICAgIHRoaXMubGVhdmVHcm91cCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBPcHRpb25zLmRlbGV0ZTpcbiAgICAgICAgdGhpcy5zaG93RGVsZXRlRGlhbG9nKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIG9uVHJhbnNmZXJDbGljaygpIHtcbiAgICBpZiAodGhpcy5ncm91cC5nZXRPd25lcigpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IHRydWU7XG4gICAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIG9uTGVhdmVDbGljaygpIHtcbiAgICBDb21ldENoYXQubGVhdmVHcm91cCh0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIHRoaXMuZ3JvdXAuc2V0TWVtYmVyc0NvdW50KHRoaXMuZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgLSAxKVxuICAgICAgICB0aGlzLmdyb3VwLnNldEhhc0pvaW5lZChmYWxzZSlcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkNsb3NlRGV0YWlscygpXG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0Lm5leHQoe1xuICAgICAgICAgIHVzZXJMZWZ0OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgICAgbGVmdEdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIG1lc3NhZ2U6IHRoaXMuY3JlYXRlVXNlckxlZnRBY3Rpb24odGhpcy5sb2dnZWRJblVzZXIhLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUKVxuXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7IHRoaXMub25FcnJvcihlcnJvcikgfVxuICAgICAgfSk7XG4gIH1cbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBhY3Rpb246IHN0cmluZykge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24odGhpcy5ncm91cC5nZXRHdWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiBhcyBhbnkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uQnkodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uRm9yKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25PbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UoYCR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX0gJHthY3Rpb259ICR7YWN0aW9uT24uZ2V0TmFtZSgpfWApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE5ld1Njb3BlKGFjdGlvbk9uLmdldFNjb3BlKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlclR5cGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCk7XG5cbiAgICByZXR1cm4gYWN0aW9uTWVzc2FnZVxuICB9XG4gIGNyZWF0ZVVzZXJMZWZ0QWN0aW9uKGFjdGlvbk9uOiBDb21ldENoYXQuVXNlciwgYWN0aW9uOiBzdHJpbmcpIHtcbiAgICBsZXQgYWN0aW9uTWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiA9IG5ldyBDb21ldENoYXQuQWN0aW9uKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gYXMgYW55KVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uKGFjdGlvbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkZvcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uT24oYWN0aW9uT24pXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKFwiZ3JvdXBfXCIgKyB0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlclR5cGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCk7XG4gICAgbGV0IG1lc3NhZ2U6IHN0cmluZyA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQgPyBgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSAke2FjdGlvbn1gIDogYCR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX0gJHthY3Rpb259ICR7YWN0aW9uT24uZ2V0TmFtZSgpfWBcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UobWVzc2FnZSlcbiAgICByZXR1cm4gYWN0aW9uTWVzc2FnZVxuICB9XG5cbiAgb25DYW5jZWxDbGljaygpIHtcbiAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dUcmFuc2ZlckRpYWxvZyA9IGZhbHNlO1xuICB9XG4gIGJsb2NrVXNlcigpIHtcbiAgICAvLyBibG9jayB1c2VyXG4gICAgaWYgKHRoaXMudXNlciAmJiAhdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkpIHtcbiAgICAgIENvbWV0Q2hhdC5ibG9ja1VzZXJzKFt0aGlzLnVzZXIuZ2V0VWlkKCldKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy51c2VyLnNldEJsb2NrZWRCeU1lKHRydWUpXG4gICAgICAgIENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5uZXh0KHRoaXMudXNlcilcbiAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZSgpO1xuICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICB9XG4gIH1cbiAgdW5CbG9ja1VzZXIoKSB7XG4gICAgLy8gdW5ibG9jayB1c2VyXG4gICAgaWYgKHRoaXMudXNlciAmJiB0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSkge1xuICAgICAgQ29tZXRDaGF0LnVuYmxvY2tVc2VycyhbdGhpcy51c2VyLmdldFVpZCgpXSkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMudXNlci5zZXRCbG9ja2VkQnlNZShmYWxzZSlcbiAgICAgICAgQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJVbmJsb2NrZWQubmV4dCh0aGlzLnVzZXIpXG4gICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUoKVxuICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICB9XG4gIH1cbiAgdmlld01lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuVmlld01lbWJlcnNQYWdlID0gIXRoaXMub3BlblZpZXdNZW1iZXJzUGFnZVxuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2VcbiAgICB0aGlzLm9wZW5BZGRNZW1iZXJzUGFnZSA9IGZhbHNlXG4gIH1cbiAgYWRkTWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5BZGRNZW1iZXJzUGFnZSA9ICF0aGlzLm9wZW5BZGRNZW1iZXJzUGFnZVxuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2VcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSBmYWxzZVxuICB9XG4gIGJhbm5lZE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSBmYWxzZVxuICAgIHRoaXMub3BlblZpZXdNZW1iZXJzUGFnZSA9IGZhbHNlXG4gICAgdGhpcy5vcGVuQmFubmVkTWVtYmVyc1BhZ2UgPSAhdGhpcy5vcGVuQmFubmVkTWVtYmVyc1BhZ2VcbiAgfVxuXG4gIGxlYXZlR3JvdXAoKSB7XG4gICAgaWYgKHRoaXMuZ3JvdXAuZ2V0T3duZXIoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IHRydWVcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBzaG93RGVsZXRlRGlhbG9nKCkge1xuICAgIHRoaXMuZGVsZXRlR3JvdXBNb2RhbCA9IHRydWU7XG4gIH1cbiAgZGVsZXRlR3JvdXAoKSB7XG4gICAgdGhpcy5kZWxldGVHcm91cE1vZGFsID0gZmFsc2U7XG4gICAgQ29tZXRDaGF0LmRlbGV0ZUdyb3VwKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBEZWxldGVkLm5leHQodGhpcy5ncm91cClcbiAgICAgIHRoaXMub25DbG9zZURldGFpbHMoKVxuICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gIH1cbiAgb3BlblRyYW5zZmVyT3duZXJzaGlwID0gKCkgPT4ge1xuICAgIHRoaXMub3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWwgPSAhdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbDtcbiAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgfVxuICBvbkNsb3NlRGV0YWlscyA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKVxuICAgIH1cbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFN0YXR1cygpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogdGhpcy5kZXRhaWxzU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLmRldGFpbHNTdHlsZS5zdWJ0aXRsZVRleHRDb2xvclxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAqL1xuICBnZXRHcm91cEljb24gPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGxldCBzdGF0dXM7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIHN0YXR1cyA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzdGF0dXMgPSBudWxsXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXNcbiAgfVxuICAvKipcbiogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yWyhncm91cD8uZ2V0VHlwZSgpIGFzIHN0cmluZyldO1xuICB9XG4gIGdldFRlbXBsYXRlT3B0aW9ucyA9ICh0ZW1wbGF0ZTogQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlKSA9PiB7XG4gICAgaWYgKHRlbXBsYXRlLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0ZW1wbGF0ZS5vcHRpb25zKHRoaXMudXNlciwgdGhpcy5ncm91cCwgdGVtcGxhdGUuaWQgYXMgc3RyaW5nKVxuICAgIH1cbiAgICBlbHNlIHJldHVybiBbXVxuICB9XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXREZXRhaWxzU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKVxuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0Q29uZmlybURpYWxvZ1N0eWxlKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID0gdGhpcy5kZXRhaWxzU3R5bGUucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5vbmxpbmUgPSB0aGlzLmRldGFpbHNTdHlsZS5vbmxpbmVTdGF0dXNDb2xvcjtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID0gdGhpcy5kZXRhaWxzU3R5bGUucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kXG4gIH1cbiAgc2V0Q29uZmlybURpYWxvZ1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjM1MHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgICB9KVxuICAgIGxldCBkZWZhdWx0RGVsZXRlRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIzNTBweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICB0aGlzLmxlYXZlR3JvdXBEaWFsb2dTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxlYXZlR3JvdXBEaWFsb2dTdHlsZSB9XG4gICAgdGhpcy50cmFuc2Zlck93bmVyc2hpcERpYWxvZ1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMudHJhbnNmZXJPd25lcnNoaXBEaWFsb2dTdHlsZSB9XG4gICAgdGhpcy5kZWxldGVHcm91cERpYWxvZ1N0eWxlID0geyAuLi5kZWZhdWx0RGVsZXRlRGlhbG9nU3R5bGUsIC4uLnRoaXMuZGVsZXRlR3JvdXBEaWFsb2dTdHlsZSB9XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuXG4gICAgfVxuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSB9XG4gIH1cbiAgc2V0RGV0YWlsc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IERldGFpbHNTdHlsZSA9IG5ldyBEZXRhaWxzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiXG4gICAgfSlcbiAgICB0aGlzLmRldGFpbHNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRldGFpbHNTdHlsZSB9XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogdGhpcy5kZXRhaWxzU3R5bGUud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMuZGV0YWlsc1N0eWxlLmhlaWdodCxcbiAgICAgIGJvcmRlcjogdGhpcy5kZXRhaWxzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmRldGFpbHNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmRldGFpbHNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgIH1cbiAgfVxuICBtYXJnaW5TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGFkZGluZzogdGhpcy5kZXRhaWxzU3R5bGU/LnBhZGRpbmdcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX193cmFwcGVyXCIgKm5nSWY9XCJ1c2VyIHx8IGdyb3VwXCJcbiAgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX2hlYWRlclwiPlxuICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwidGl0bGVcIlxuICAgICAgW2xhYmVsU3R5bGVdPVwiZ2V0VGl0bGVTdHlsZSgpXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGVcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQ2xvc2VEZXRhaWxzKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc1wiIFtuZ1N0eWxlXT1cIm1hcmdpblN0eWxlKClcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fcHJvZmlsZVwiICpuZ0lmPVwiIWhpZGVQcm9maWxlXCI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSAqbmdJZj1cIiFjdXN0b21Qcm9maWxlVmlldztlbHNlIGxpc3RpdGVtXCJcbiAgICAgICAgW2F2YXRhck5hbWVdPVwidXNlcj8uZ2V0TmFtZSgpID8/IHRoaXMuZ3JvdXA/LmdldE5hbWUoKVwiXG4gICAgICAgIFthdmF0YXJVUkxdPVwidGhpcy51c2VyPy5nZXRBdmF0YXIoKSA/PyB0aGlzLmdyb3VwPy5nZXRJY29uKClcIlxuICAgICAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImNoZWNrU3RhdHVzVHlwZSgpXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckljb25dPVwiY2hlY2tHcm91cFR5cGUoKVwiXG4gICAgICAgIFt0aXRsZV09XCJ0aGlzLnVzZXI/LmdldE5hbWUoKSA/PyB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXN1YnRpdGxlVmlldzsgZWxzZSBzdWJ0aXRsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIlxuICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3VidGl0bGU+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb24tbGlzdFwiXG4gICAgICAqbmdJZj1cImRlZmF1bHRUZW1wbGF0ZSAmJiBkZWZhdWx0VGVtcGxhdGUubGVuZ3RoID4gMFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb25cIiAqbmdGb3I9XCJsZXQgaXRlbSBvZiBkZWZhdWx0VGVtcGxhdGVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb24tc2VwYXJhdG9yXCIgKm5nSWY9XCJpdGVtLnRpdGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJpdGVtLnRpdGxlXCJcbiAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImdldFNlY3Rpb25IZWFkZXJTdHlsZShpdGVtKVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbnMtd3JhcHBlclwiXG4gICAgICAgICAgKm5nSWY9XCJnZXRUZW1wbGF0ZU9wdGlvbnMoaXRlbSlcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fb3B0aW9uc1wiXG4gICAgICAgICAgICAqbmdGb3I9XCJsZXQgb3B0aW9uIG9mIGdldFRlbXBsYXRlT3B0aW9ucyhpdGVtKVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvblwiXG4gICAgICAgICAgICAgICpuZ0lmPVwiIWdldEN1c3RvbU9wdGlvblZpZXcob3B0aW9uKTtlbHNlIGN1c3RvbVZpZXdcIlxuICAgICAgICAgICAgICAoY2xpY2spPVwib25PcHRpb25DbGljayhvcHRpb24pXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19vcHRpb24tdGl0bGVcIj5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbdGV4dF09XCJvcHRpb24udGl0bGVcIlxuICAgICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldEJ1dHRvblN0eWxlKG9wdGlvbilcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbi10YWlsXCIgKm5nSWY9XCJvcHRpb24/LnRhaWxcIj5cbiAgICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJvcHRpb24/LnRhaWxcIj48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtZGl2aWRlclxuICAgICAgICAgICAgICAgIFtkaXZpZGVyU3R5bGVdPVwiZGl2aWRlclN0eWxlXCI+PC9jb21ldGNoYXQtZGl2aWRlcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICNjdXN0b21WaWV3PlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb24pXCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L2Rpdj5cbjxuZy10ZW1wbGF0ZSAjbGlzdGl0ZW0+XG4gIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJjdXN0b21Qcm9maWxlVmlld1wiPlxuICA8L25nLWNvbnRhaW5lcj5cbjwvbmctdGVtcGxhdGU+XG48ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fdmlld1wiICpuZ0lmPVwib3BlbkFkZE1lbWJlcnNQYWdlXCI+XG4gIDxjb21ldGNoYXQtYWRkLW1lbWJlcnNcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnRpdGxlQWxpZ25tZW50IVwiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtU3R5bGUhXCJcbiAgICBbYWRkTWVtYmVyc1N0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5hZGRNZW1iZXJzU3R5bGUhXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmF2YXRhclN0eWxlIVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zdGF0dXNJbmRpY2F0b3JTdHlsZSFcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5sb2FkaW5nU3RhdGVWaWV3IVwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5sb2FkaW5nSWNvblVSTCFcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvblNlbGVjdF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25TZWxlY3QhXCJcbiAgICBbb25FcnJvcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25FcnJvciFcIlxuICAgIFtoaWRlRXJyb3JdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmhpZGVFcnJvciFcIlxuICAgIFtoaWRlU2VhcmNoXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5oaWRlU2VhcmNoIVwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaEljb25VUkwhXCJcbiAgICBbc2VsZWN0aW9uTW9kZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VsZWN0aW9uTW9kZSFcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5oaWRlU2VwYXJhdG9yIVwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zaG93QmFja0J1dHRvbiFcIlxuICAgIFtzaG93U2VjdGlvbkhlYWRlcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2hvd1NlY3Rpb25IZWFkZXIhXCJcbiAgICBbb25BZGRNZW1iZXJzQnV0dG9uQ2xpY2tdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQWRkTWVtYmVyc0J1dHRvbkNsaWNrIVwiXG4gICAgW3VzZXJzQ29uZmlndXJhdGlvbl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udXNlcnNDb25maWd1cmF0aW9uXCJcbiAgICBbYmFja0J1dHRvbkljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmJhY2tCdXR0b25JY29uVVJMIVwiXG4gICAgW3NlY3Rpb25IZWFkZXJGaWVsZF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VjdGlvbkhlYWRlckZpZWxkIVwiXG4gICAgW2Nsb3NlQnV0dG9uSWNvblVSTF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uY2xvc2VCdXR0b25JY29uVVJMIVwiXG4gICAgW29wdGlvbnNdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9wdGlvbnMhXCJcbiAgICBbbWVudV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5kaXNhYmxlVXNlcnNQcmVzZW5jZSFcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwic2VsZWN0aW9ubW9kZUVudW1cIlxuICAgIFtvbkNsb3NlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkNsb3NlIHx8IG9uQ2xvc2VEZXRhaWxzXCJcbiAgICBbb25CYWNrXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkJhY2sgfHwgYWRkTWVtYmVyc1wiXG4gICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnVzZXJzUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnVzZXJzUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbbGlzdEl0ZW1WaWV3XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5saXN0SXRlbVZpZXdcIj5cbiAgPC9jb21ldGNoYXQtYWRkLW1lbWJlcnM+XG48L2Rpdj5cbjxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX192aWV3XCIgKm5nSWY9XCJvcGVuQmFubmVkTWVtYmVyc1BhZ2VcIj5cbiAgPGNvbWV0Y2hhdC1iYW5uZWQtbWVtYmVyc1xuICAgIFtsaXN0SXRlbVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtVmlld1wiXG4gICAgW2Jhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbj8uYmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zZWFyY2hSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFt0aXRsZUFsaWdubWVudF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi50aXRsZUFsaWdubWVudFwiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2Jhbm5lZE1lbWJlcnNTdHlsZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5iYW5uZWRNZW1iZXJzU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ubG9hZGluZ0ljb25VUkxcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25TZWxlY3RdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25TZWxlY3RcIlxuICAgIFtvbkVycm9yXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtoaWRlRXJyb3JdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZUVycm9yXCJcbiAgICBbaGlkZVNlYXJjaF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICBbc2VhcmNoSWNvblVSTF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5zZWFyY2hJY29uVVJMXCJcbiAgICBbc2VsZWN0aW9uTW9kZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5zZWxlY3Rpb25Nb2RlXCJcbiAgICBbaGlkZVNlcGFyYXRvcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VwYXJhdG9yXCJcbiAgICBbc2hvd0JhY2tCdXR0b25dPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2hvd0JhY2tCdXR0b25cIlxuICAgIFtiYWNrQnV0dG9uSWNvblVSTF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5iYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgW2Nsb3NlQnV0dG9uSWNvblVSTF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5jbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgIFtvcHRpb25zXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgIFttZW51XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLm1lbnVcIlxuICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5kaXNhYmxlVXNlcnNQcmVzZW5jZVwiXG4gICAgW3N1YnRpdGxlVmlld109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIiBbZ3JvdXBdPVwiZ3JvdXBcIlxuICAgIFtvbkNsb3NlXT1cIm9uQ2xvc2VEZXRhaWxzXCJcbiAgICBbb25CYWNrXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLm9uQmFjayB8fCBiYW5uZWRNZW1iZXJzXCI+XG4gIDwvY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzPlxuPC9kaXY+XG48ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fdmlld1wiICpuZ0lmPVwib3BlblZpZXdNZW1iZXJzUGFnZVwiPlxuICA8Y29tZXRjaGF0LWdyb3VwLW1lbWJlcnNcbiAgICBbZ3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXJdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbj8uZ3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VhcmNoUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi50aXRsZUFsaWdubWVudFwiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbZ3JvdXBNZW1iZXJzU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5ncm91cE1lbWJlcnNTdHlsZVwiXG4gICAgW2F2YXRhclN0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLnN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvblNlbGVjdF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9uU2VsZWN0XCJcbiAgICBbb25FcnJvcl09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtoaWRlRXJyb3JdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5oaWRlRXJyb3JcIlxuICAgIFtoaWRlU2VhcmNoXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlYXJjaFwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zZWFyY2hJY29uVVJMXCJcbiAgICBbc2VsZWN0aW9uTW9kZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLnNlbGVjdGlvbk1vZGVcIlxuICAgIFtiYWNrZHJvcFN0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uYmFja2Ryb3BTdHlsZVwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VwYXJhdG9yXCJcbiAgICBbc2hvd0JhY2tCdXR0b25dPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zaG93QmFja0J1dHRvblwiXG4gICAgW2JhY2tCdXR0b25JY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uYmFja0J1dHRvbkljb25VUkxcIlxuICAgIFtjbG9zZUJ1dHRvbkljb25VUkxdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5jbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgIFtvcHRpb25zXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ub3B0aW9uc1wiXG4gICAgW21lbnVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5tZW51XCJcbiAgICBbZGlzYWJsZVVzZXJzUHJlc2VuY2VdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5kaXNhYmxlVXNlcnNQcmVzZW5jZVwiXG4gICAgW3N1YnRpdGxlVmlld109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiXG4gICAgW2dyb3VwU2NvcGVTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmdyb3VwU2NvcGVTdHlsZVwiXG4gICAgW2dyb3VwXT1cImdyb3VwXCJcbiAgICBbb25DbG9zZV09XCIgZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkNsb3NlIHx8IG9uQ2xvc2VEZXRhaWxzXCJcbiAgICBbb25CYWNrXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25CYWNrIHx8IHZpZXdNZW1iZXJzXCI+XG4gIDwvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnM+XG48L2Rpdj5cblxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCJcbiAgKm5nSWY9XCJjb25maXJtTGVhdmVHcm91cE1vZGFsXCI+XG4gIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cIicnXCIgW21lc3NhZ2VUZXh0XT1cImxlYXZlR3JvdXBEaWFsb2dNZXNzYWdlXCJcbiAgICBbY2FuY2VsQnV0dG9uVGV4dF09XCJsZWF2ZUdyb3VwQ2FuY2VsQnV0dG9uVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cImxlYXZlR3JvdXBDb25maXJtQnV0dG9uVGV4dFwiXG4gICAgKGNjLWNvbmZpcm0tY2xpY2tlZCk9XCJvbkxlYXZlQ2xpY2soKVwiIChjYy1jYW5jZWwtY2xpY2tlZCk9XCJvbkNhbmNlbENsaWNrKClcIlxuICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwibGVhdmVHcm91cERpYWxvZ1N0eWxlXCI+XG4gIDwvY29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG48Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIiAqbmdJZj1cInNob3dUcmFuc2ZlckRpYWxvZ1wiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiXG4gICAgW21lc3NhZ2VUZXh0XT1cInRyYW5zZmVyT3duZXJzaGlwRGlhbG9nTWVzc2FnZVwiXG4gICAgW2NhbmNlbEJ1dHRvblRleHRdPVwidHJhbnNmZXJPd25lcnNoaXBDYW5jZWxCdXR0b25UZXh0XCJcbiAgICBbY29uZmlybUJ1dHRvblRleHRdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maXJtQnV0dG9uVGV4dFwiXG4gICAgKGNjLWNvbmZpcm0tY2xpY2tlZCk9XCJvblRyYW5zZmVyQ2xpY2soKVwiXG4gICAgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgW2NvbmZpcm1EaWFsb2dTdHlsZV09XCJ0cmFuc2Zlck93bmVyc2hpcERpYWxvZ1N0eWxlXCI+XG4gIDwvY29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG48Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIlxuICAqbmdJZj1cIm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsXCI+XG4gIDxjb21ldGNoYXQtdHJhbnNmZXItb3duZXJzaGlwXG4gICAgW2dyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbj8uZ3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXJcIlxuICAgIFt0cmFuc2Zlck93bmVyc2hpcFN0eWxlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi50cmFuc2Zlck93bmVyc2hpcFN0eWxlXCJcbiAgICBbb25UcmFuc2Zlck93bmVyc2hpcF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ub25UcmFuc2Zlck93bmVyc2hpcFwiXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi50aXRsZUFsaWdubWVudFwiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmxpc3RJdGVtU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uc3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmVycm9yU3RhdGVWaWV3XCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25FcnJvcl09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW2hpZGVTZWFyY2hdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmhpZGVTZWFyY2hcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5zZWFyY2hJY29uVVJMXCJcbiAgICBbaGlkZVNlcGFyYXRvcl09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uaGlkZVNlcGFyYXRvclwiXG4gICAgW2Nsb3NlQnV0dG9uSWNvblVSTF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICBbb3B0aW9uc109XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ub3B0aW9uc1wiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5kaXNhYmxlVXNlcnNQcmVzZW5jZVwiXG4gICAgW3N1YnRpdGxlVmlld109XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCIgW2dyb3VwXT1cImdyb3VwXCJcbiAgICBbb25DbG9zZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ub25DbG9zZSB8fCBvcGVuVHJhbnNmZXJPd25lcnNoaXBcIj5cbiAgPC9jb21ldGNoYXQtdHJhbnNmZXItb3duZXJzaGlwPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG48Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIiAqbmdJZj1cImRlbGV0ZUdyb3VwTW9kYWxcIj5cbiAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiJydcIlxuICAgIFttZXNzYWdlVGV4dF09XCJkZWxldGVHcm91cERpYWxvZ01lc3NhZ2VcIlxuICAgIFtjYW5jZWxCdXR0b25UZXh0XT1cImRlbGV0ZUdyb3VwQ2FuY2VsQnV0dG9uVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cImRlbGV0ZUdyb3VwQ29uZmlybUJ1dHRvblRleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwiZGVsZXRlR3JvdXAoKVwiIChjYy1jYW5jZWwtY2xpY2tlZCk9XCJvbkNhbmNlbENsaWNrKClcIlxuICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwiZGVsZXRlR3JvdXBEaWFsb2dTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuIl19