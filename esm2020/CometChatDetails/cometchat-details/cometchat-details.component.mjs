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
            if (!userStatusVisibility) {
                this.subtitleText = "";
            }
            else {
                const status = this.user.getStatus();
                this.subtitleText = status ? localize(status.toUpperCase()) : localize("OFFLINE");
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXREZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0RGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULEtBQUssRUFFTCx1QkFBdUIsR0FLeEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsV0FBVyxFQUFpQixrQkFBa0IsRUFBRSxhQUFhLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQTtBQUMxRyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBeUIsRUFBRSw4QkFBOEIsR0FBYyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hOLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUErQyxtQkFBbUIsRUFBMkYsYUFBYSxFQUE0QixNQUFNLDRCQUE0QixDQUFBO0FBQ3BULE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7Ozs7O0FBQy9EOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLHlCQUF5QjtJQTZKcEMsWUFBb0IsR0FBc0Is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S0FBSztnQkFDRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBZ0JHLDRCQUE0QjtzQkFBcEMsS0FBSztnQkFDRyx3QkFBd0I7c0JBQWhDLEtBQUs7Z0JBQ0csMkJBQTJCO3NCQUFuQyxLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFJRyxrQ0FBa0M7c0JBQTFDLEtBQUs7Z0JBQ0csOEJBQThCO3NCQUF0QyxLQUFLO2dCQUNHLGlDQUFpQztzQkFBekMsS0FBSztnQkFDRyw0QkFBNEI7c0JBQXBDLEtBQUs7Z0JBS0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLDBCQUEwQjtzQkFBbEMsS0FBSztnQkFDRyx5QkFBeUI7c0JBQWpDLEtBQUs7Z0JBQ0csOEJBQThCO3NCQUF0QyxLQUFLO2dCQUlHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFNRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLFdBQVc7c0JBQW5CLEtBQUs7Z0JBT0csWUFBWTtzQkFBcEIsS0FBSztnQkFNRyxhQUFhO3NCQUFyQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBJbnB1dCxcbiAgT25Jbml0LFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIFRlbXBsYXRlUmVmLFxuICBPbkNoYW5nZXMsXG4gIFNpbXBsZUNoYW5nZXMsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQXZhdGFyU3R5bGUsIEJhY2tkcm9wU3R5bGUsIENvbmZpcm1EaWFsb2dTdHlsZSwgTGlzdEl0ZW1TdHlsZSwgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24sIEJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLCBDb21ldENoYXRVSUtpdFV0aWxpdHksIERldGFpbHNTdHlsZSwgRGV0YWlsc1V0aWxzLCBHcm91cE1lbWJlcnNDb25maWd1cmF0aW9uLCBUcmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24sIEJhc2VTdHlsZSwgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IGZvbnRIZWxwZXIsIGxvY2FsaXplLCBDb21ldENoYXRHcm91cEV2ZW50cywgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIElHcm91cE1lbWJlckFkZGVkLCBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsIENvbWV0Q2hhdFVzZXJFdmVudHMsIElHcm91cE1lbWJlckpvaW5lZCwgSU93bmVyc2hpcENoYW5nZWQsIENvbWV0Q2hhdERldGFpbHNPcHRpb24sIENvbWV0Q2hhdERldGFpbHNUZW1wbGF0ZSwgU2VsZWN0aW9uTW9kZSwgSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuaW1wb3J0IHsgTWVzc2FnZVV0aWxzIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9NZXNzYWdlVXRpbHNcIjtcbi8qKlxuKlxuKiBDb21ldENoYXREZXRhaWxzQ29tcG9uZW50IHJlbmRlcnMgZGV0YWlscyBvZiB1c2VyIG9yIGdyb3VwLlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1kZXRhaWxzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1kZXRhaWxzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0RGV0YWlsc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiREVUQUlMU1wiKTtcbiAgQElucHV0KCkgY2xvc2VCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlUHJvZmlsZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBjdXN0b21Qcm9maWxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRhdGE/OiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGVbXTtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgLyoqXG4gICogQGRlcHJlY2F0ZWRcbiAgKlxuICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgKi9cbiAgQElucHV0KCkgcHJvdGVjdGVkR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHBhc3N3b3JkR3JvdXBJY29uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIG9uQ2xvc2UhOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwQ29uZmlybUJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTEVBVkVfR1JPVVBcIik7XG4gIEBJbnB1dCgpIGxlYXZlR3JvdXBDYW5jZWxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTkNFTFwiKTtcbiAgQElucHV0KCkgbGVhdmVHcm91cERpYWxvZ01lc3NhZ2U6IHN0cmluZyA9IGxvY2FsaXplKFwiTEVBVkVfQ09ORklSTVwiKTtcbiAgQElucHV0KCkgbGVhdmVHcm91cERpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IFwiUkdCKDUxLCAxNTMsIDI1NSlcIixcbiAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC4wNilcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOiBcIndoaXRlXCIsXG4gICAgY29uZmlybUJ1dHRvblRleHRGb250OiBcIjYwMCAxNXB4IEludGVyXCIsXG4gICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOiBcImJsYWNrXCIsXG4gICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IFwiNjAwIDE1cHggSW50ZXJcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBtZXNzYWdlVGV4dEZvbnQ6IFwiNDAwIDEzcHggSW50ZXJcIixcbiAgICBtZXNzYWdlVGV4dENvbG9yOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBiYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjRjJGMkYyXCIsXG4gICAgaGVpZ2h0OiBcIjE4MHB4XCIsXG4gICAgd2lkdGg6IFwiMzYwcHhcIlxuICB9XG4gIEBJbnB1dCgpIGRlbGV0ZUdyb3VwQ29uZmlybUJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiREVMRVRFXCIpO1xuICBASW5wdXQoKSBkZWxldGVHcm91cERpYWxvZ01lc3NhZ2U6IHN0cmluZyA9IGxvY2FsaXplKFwiREVMRVRFX0NPTkZJUk1cIik7XG4gIEBJbnB1dCgpIGRlbGV0ZUdyb3VwQ2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIGRlbGV0ZUdyb3VwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cbiAgQElucHV0KCkgdHJhbnNmZXJPd25lcnNoaXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJUUkFOU0ZFUl9PV05FUlNISVBcIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJUUkFOU0ZFUl9DT05GSVJNXCIpO1xuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENhbmNlbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcERpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjE4MHB4XCIsXG4gICAgd2lkdGg6IFwiMzYwcHhcIlxuICB9XG5cbiAgQElucHV0KCkgYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb246IEFkZE1lbWJlcnNDb25maWd1cmF0aW9uID0gbmV3IEFkZE1lbWJlcnNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb246IEJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uID0gbmV3IEJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbjogR3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbiA9IG5ldyBHcm91cE1lbWJlcnNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgdHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uOiBUcmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24gPSBuZXcgVHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uKHt9KTtcblxuXG4gIGJhY2tpY29udXJsID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIlxuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgYm9yZGVyOiBcIlwiXG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiXG4gIH1cbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMjhweFwiLFxuICAgIGhlaWdodDogXCIyOHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcblxuICB9O1xuICBASW5wdXQoKSBkZXRhaWxzU3R5bGU6IERldGFpbHNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImdyZXlcIixcbiAgICB0aXRsZUZvbnQ6IFwiNjAwIDE1cHggSW50ZXJcIixcbiAgICB0aXRsZUNvbG9yOiBcImJsYWNrXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIlxuICB9O1xuXG5cbiAgc2hvd1RyYW5zZmVyRGlhbG9nOiBib29sZWFuID0gZmFsc2U7XG4gIGRlZmF1bHRUZW1wbGF0ZTogQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlW10gPSBbXVxuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgb3BlblZpZXdNZW1iZXJzUGFnZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgb3BlbkJhbm5lZE1lbWJlcnNQYWdlOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBvcGVuQWRkTWVtYmVyc1BhZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbmZpcm1MZWF2ZUdyb3VwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIG9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsOiBib29sZWFuID0gZmFsc2VcbiAgc2VsZWN0aW9ubW9kZUVudW06IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm11bHRpcGxlO1xuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIHN0YXR1c0NvbG9yOiBhbnkgPSB7XG4gICAgcHJpdmF0ZTogXCJcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiXG4gIH1cbiAgY2xvc2VCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLmNsb3NlQnV0dG9uSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgfVxuICBidXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSB8fCBcInJnYmEoNTEsIDE1MywgMjU1KVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIjUwMCAxNnB4IEludGVyXCJcbiAgfVxuICBkaXZpZGVyU3R5bGU6IGFueSA9IHtcbiAgICBiYWNrZ3JvdW5kOiBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIixcbiAgICBoZWlnaHQ6IFwiMXB4XCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiXG4gIH1cblxuICBkZWxldGVHcm91cE1vZGFsOiBib29sZWFuID0gZmFsc2U7XG4gIGdldFRpdGxlU3R5bGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLmRldGFpbHNTdHlsZS50aXRsZVRleHRGb250IHx8IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLmRldGFpbHNTdHlsZS50aXRsZVRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpXG4gICAgfVxuICB9XG4gIGdldEN1c3RvbU9wdGlvblZpZXcob3B0aW9uOiBDb21ldENoYXREZXRhaWxzT3B0aW9uKSB7XG4gICAgcmV0dXJuIG9wdGlvbj8uY3VzdG9tVmlld1xuICB9XG4gIHB1YmxpYyBzdWJ0aXRsZVRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZCA9IFwidXNlcmxpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIG1lbWJlcnNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcIm1lbWJlcmxpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICB0aGlzLmdldFRlbXBsYXRlKClcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyXG4gICAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZSgpXG4gICAgICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldFRlbXBsYXRlKCkge1xuICAgIGlmICh0aGlzLmRhdGEpIHtcbiAgICAgIHRoaXMuZGVmYXVsdFRlbXBsYXRlID0gdGhpcy5kYXRhXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSBEZXRhaWxzVXRpbHMuZ2V0RGVmYXVsdERldGFpbHNUZW1wbGF0ZSh0aGlzLmxvZ2dlZEluVXNlciwgdGhpcy51c2VyLCB0aGlzLmdyb3VwLCB0aGlzLnRoZW1lU2VydmljZS50aGVtZSlcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpXG4gICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5tZW1iZXJzTGlzdGVuZXJJZClcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSBbXTtcbiAgICB0aGlzLm9uQ2xvc2VEZXRhaWxzKClcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKVxuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKClcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKClcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuZGV0YWlsc1N0eWxlLm9ubGluZVN0YXR1c0NvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxuICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICB9XG5cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LnVzZXJBZGRlZEluITtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy51c2VyQWRkZWRJbiFcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LmpvaW5lZEdyb3VwO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8ua2lja2VkRnJvbSE7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy5raWNrZWRGcm9tITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/Lmdyb3VwITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKTtcbiAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgY2hlY2tTdGF0dXNUeXBlID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9ICF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlICYmICFuZXcgTWVzc2FnZVV0aWxzKCkuZ2V0VXNlclN0YXR1c1Zpc2liaWxpdHkodGhpcy51c2VyKVxuICAgICAgcmV0dXJuIHVzZXJTdGF0dXNWaXNpYmlsaXR5ID8gdGhpcy5zdGF0dXNDb2xvclt0aGlzLnVzZXI/LmdldFN0YXR1cygpXSA6IG51bGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yW3RoaXMuZ3JvdXA/LmdldFR5cGUoKV1cbiAgICB9XG4gICAgZWxzZSByZXR1cm4gbnVsbDtcbiAgfVxuICB1cGRhdGVTdWJ0aXRsZSgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuZ3JvdXA/LmdldE1lbWJlcnNDb3VudCgpO1xuICAgIGNvbnN0IG1lbWJlcnNUZXh0ID0gbG9jYWxpemUoY291bnQgPiAxID8gXCJNRU1CRVJTXCIgOiBcIk1FTUJFUlwiKTtcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICBsZXQgdXNlclN0YXR1c1Zpc2liaWxpdHkgPSAhdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSAmJiAhdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkgJiYgIXRoaXMudXNlci5nZXRIYXNCbG9ja2VkTWUoKTtcbiAgICAgICAgIGlmICghdXNlclN0YXR1c1Zpc2liaWxpdHkpIHtcbiAgICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy51c2VyLmdldFN0YXR1cygpO1xuICAgICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IHN0YXR1cyA/IGxvY2FsaXplKHN0YXR1cy50b1VwcGVyQ2FzZSgpKSA6IGxvY2FsaXplKCBcIk9GRkxJTkVcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gYCR7Y291bnR9ICR7bWVtYmVyc1RleHR9YDtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGdldEJ1dHRvblN0eWxlKG9wdGlvbjogQ29tZXRDaGF0RGV0YWlsc09wdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25UZXh0Rm9udDogb3B0aW9uPy50aXRsZUZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IG9wdGlvbj8udGl0bGVDb2xvcixcbiAgICAgIGJhY2tncm91bmQ6IG9wdGlvbj8uYmFja2dyb3VuZENvbG9yIHx8IFwidHJhbnNwYXJlbnRcIlxuICAgIH1cbiAgfVxuICBjaGVja0dyb3VwVHlwZSgpOiBzdHJpbmcge1xuICAgIGxldCBpbWFnZTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAodGhpcy5ncm91cCkge1xuICAgICAgc3dpdGNoICh0aGlzLmdyb3VwPy5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbWFnZVxuICB9XG4gIHVwZGF0ZVVzZXJTdGF0dXModXNlcjogQ29tZXRDaGF0LlVzZXIpIHtcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRVaWQoKSAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgPT09IHVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMudXNlci5zZXRTdGF0dXModXNlci5nZXRTdGF0dXMoKSk7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICB9XG4gICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlKSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy51c2VyTGlzdGVuZXJJZCxcbiAgICAgICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhvbmxpbmVVc2VyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwLnNldFNjb3BlKG5ld1Njb3BlKTtcbiAgICAgICAgICAgICAgdGhpcy5ncm91cCA9IGNoYW5nZWRHcm91cDtcbiAgICAgICAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldFNlY3Rpb25IZWFkZXJTdHlsZSh0ZW1wbGF0ZTogQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0ZW1wbGF0ZS50aXRsZUZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRlbXBsYXRlLnRpdGxlQ29sb3JcbiAgICB9XG4gIH1cbiAgb25PcHRpb25DbGljayhvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICBjb25zdCB7IG9uQ2xpY2ssIGlkIH0gPSBvcHRpb247XG4gICAgaWYgKG9uQ2xpY2spIHtcbiAgICAgIG9uQ2xpY2sodGhpcy51c2VyID8/IHRoaXMuZ3JvdXApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzd2l0Y2ggKGlkKSB7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLlVzZXJPcHRpb25zLnZpZXdQcm9maWxlOlxuICAgICAgICBpZiAodGhpcy51c2VyPy5nZXRMaW5rKCkpIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHRoaXMudXNlci5nZXRMaW5rKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLlVzZXJPcHRpb25zLmJsb2NrOlxuICAgICAgICB0aGlzLmJsb2NrVXNlcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuVXNlck9wdGlvbnMudW5ibG9jazpcbiAgICAgICAgdGhpcy51bkJsb2NrVXNlcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBPcHRpb25zLnZpZXdNZW1iZXJzOlxuICAgICAgICB0aGlzLnZpZXdNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuYWRkTWVtYmVyczpcbiAgICAgICAgdGhpcy5hZGRNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuYmFubmVkTWVtYmVyczpcbiAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMubGVhdmU6XG4gICAgICAgIHRoaXMubGVhdmVHcm91cCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBPcHRpb25zLmRlbGV0ZTpcbiAgICAgICAgdGhpcy5zaG93RGVsZXRlRGlhbG9nKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIG9uVHJhbnNmZXJDbGljaygpIHtcbiAgICBpZiAodGhpcy5ncm91cC5nZXRPd25lcigpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IHRydWU7XG4gICAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIG9uTGVhdmVDbGljaygpIHtcbiAgICBDb21ldENoYXQubGVhdmVHcm91cCh0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIHRoaXMuZ3JvdXAuc2V0TWVtYmVyc0NvdW50KHRoaXMuZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgLSAxKVxuICAgICAgICB0aGlzLmdyb3VwLnNldEhhc0pvaW5lZChmYWxzZSlcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkNsb3NlRGV0YWlscygpXG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0Lm5leHQoe1xuICAgICAgICAgIHVzZXJMZWZ0OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgICAgbGVmdEdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIG1lc3NhZ2U6IHRoaXMuY3JlYXRlVXNlckxlZnRBY3Rpb24odGhpcy5sb2dnZWRJblVzZXIhLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUKVxuXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7IHRoaXMub25FcnJvcihlcnJvcikgfVxuICAgICAgfSk7XG4gIH1cbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBhY3Rpb246IHN0cmluZykge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24odGhpcy5ncm91cC5nZXRHdWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiBhcyBhbnkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uQnkodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uRm9yKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25PbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UoYCR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX0gJHthY3Rpb259ICR7YWN0aW9uT24uZ2V0TmFtZSgpfWApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE5ld1Njb3BlKGFjdGlvbk9uLmdldFNjb3BlKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlclR5cGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCk7XG5cbiAgICByZXR1cm4gYWN0aW9uTWVzc2FnZVxuICB9XG4gIGNyZWF0ZVVzZXJMZWZ0QWN0aW9uKGFjdGlvbk9uOiBDb21ldENoYXQuVXNlciwgYWN0aW9uOiBzdHJpbmcpIHtcbiAgICBsZXQgYWN0aW9uTWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiA9IG5ldyBDb21ldENoYXQuQWN0aW9uKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gYXMgYW55KVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uKGFjdGlvbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkZvcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uT24oYWN0aW9uT24pXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKFwiZ3JvdXBfXCIgKyB0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlclR5cGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCk7XG4gICAgbGV0IG1lc3NhZ2U6IHN0cmluZyA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQgPyBgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSAke2FjdGlvbn1gIDogYCR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX0gJHthY3Rpb259ICR7YWN0aW9uT24uZ2V0TmFtZSgpfWBcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UobWVzc2FnZSlcbiAgICByZXR1cm4gYWN0aW9uTWVzc2FnZVxuICB9XG5cbiAgb25DYW5jZWxDbGljaygpIHtcbiAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dUcmFuc2ZlckRpYWxvZyA9IGZhbHNlO1xuICB9XG4gIGJsb2NrVXNlcigpIHtcbiAgICAvLyBibG9jayB1c2VyXG4gICAgaWYgKHRoaXMudXNlciAmJiAhdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkpIHtcbiAgICAgIENvbWV0Q2hhdC5ibG9ja1VzZXJzKFt0aGlzLnVzZXIuZ2V0VWlkKCldKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy51c2VyLnNldEJsb2NrZWRCeU1lKHRydWUpXG4gICAgICAgIENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5uZXh0KHRoaXMudXNlcilcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgICB0aGlzLmdldFRlbXBsYXRlKCk7XG4gICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgIH1cbiAgfVxuICB1bkJsb2NrVXNlcigpIHtcbiAgICAvLyB1bmJsb2NrIHVzZXJcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpKSB7XG4gICAgICBDb21ldENoYXQudW5ibG9ja1VzZXJzKFt0aGlzLnVzZXIuZ2V0VWlkKCldKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy51c2VyLnNldEJsb2NrZWRCeU1lKGZhbHNlKVxuICAgICAgICBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlclVuYmxvY2tlZC5uZXh0KHRoaXMudXNlcilcbiAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKCk7XG4gICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgIH1cbiAgfVxuICB2aWV3TWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSAhdGhpcy5vcGVuVmlld01lbWJlcnNQYWdlO1xuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfVxuICBhZGRNZW1iZXJzID0gKCkgPT4ge1xuICAgIHRoaXMub3BlbkFkZE1lbWJlcnNQYWdlID0gIXRoaXMub3BlbkFkZE1lbWJlcnNQYWdlO1xuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5vcGVuVmlld01lbWJlcnNQYWdlID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGJhbm5lZE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5CYW5uZWRNZW1iZXJzUGFnZSA9ICF0aGlzLm9wZW5CYW5uZWRNZW1iZXJzUGFnZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfVxuICBcbiAgb25CYWNrRm9yQWRkTWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLmFkZE1lbWJlcnMoKTtcbiAgICBpZih0aGlzLmFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkJhY2spIHtcbiAgICAgIHRoaXMuYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQmFjaygpXG4gICAgfVxuICB9XG5cbiAgbGVhdmVHcm91cCgpIHtcbiAgICBpZiAodGhpcy5ncm91cC5nZXRPd25lcigpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgdGhpcy5zaG93VHJhbnNmZXJEaWFsb2cgPSB0cnVlO1xuICAgICAgdGhpcy5jb25maXJtTGVhdmVHcm91cE1vZGFsID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zaG93VHJhbnNmZXJEaWFsb2cgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5jb25maXJtTGVhdmVHcm91cE1vZGFsID0gdHJ1ZVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIHNob3dEZWxldGVEaWFsb2coKSB7XG4gICAgdGhpcy5kZWxldGVHcm91cE1vZGFsID0gdHJ1ZTtcbiAgfVxuICBkZWxldGVHcm91cCgpIHtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICBDb21ldENoYXQuZGVsZXRlR3JvdXAodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZGVsZXRlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cERlbGV0ZWQubmV4dCh0aGlzLmdyb3VwKVxuICAgICAgdGhpcy5vbkNsb3NlRGV0YWlscygpXG4gICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgfVxuICAgICAgfSlcbiAgfVxuICBvcGVuVHJhbnNmZXJPd25lcnNoaXAgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbCA9ICF0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsO1xuICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICB9XG4gIG9uQ2xvc2VEZXRhaWxzID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLm9uQ2xvc2UpIHtcbiAgICAgIHRoaXMub25DbG9zZSgpXG4gICAgfVxuICB9XG4gIHN1YnRpdGxlU3R5bGUgPSAoKSA9PiB7XG4gICAgbGV0IGhpZGVVc2VyU3RhdHVzID0gdGhpcy51c2VyID8gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KHRoaXMudXNlcikgOiB0cnVlXG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UgJiYgIWhpZGVVc2VyU3RhdHVzKSB7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiB0aGlzLmRldGFpbHNTdHlsZS5zdWJ0aXRsZVRleHRGb250LFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy5kZXRhaWxzU3R5bGUuc3VidGl0bGVUZXh0Q29sb3JcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gKi9cbiAgZ2V0R3JvdXBJY29uID0gKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICBsZXQgc3RhdHVzO1xuICAgIGlmIChncm91cCkge1xuICAgICAgc3dpdGNoIChncm91cC5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIHN0YXR1cyA9IHRoaXMucGFzc3dvcmRHcm91cEljb24gfHwgdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIHN0YXR1cyA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzdGF0dXMgPSBudWxsXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXNcbiAgfVxuICAvKipcbiogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yWyhncm91cD8uZ2V0VHlwZSgpIGFzIHN0cmluZyldO1xuICB9XG4gIGdldFRlbXBsYXRlT3B0aW9ucyA9ICh0ZW1wbGF0ZTogQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlKSA9PiB7XG4gICAgaWYgKHRlbXBsYXRlLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0ZW1wbGF0ZS5vcHRpb25zKHRoaXMudXNlciwgdGhpcy5ncm91cCwgdGVtcGxhdGUuaWQgYXMgc3RyaW5nKVxuICAgIH1cbiAgICBlbHNlIHJldHVybiBbXVxuICB9XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXREZXRhaWxzU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKVxuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0Q29uZmlybURpYWxvZ1N0eWxlKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID0gdGhpcy5kZXRhaWxzU3R5bGUucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5vbmxpbmUgPSB0aGlzLmRldGFpbHNTdHlsZS5vbmxpbmVTdGF0dXNDb2xvcjtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID0gdGhpcy5kZXRhaWxzU3R5bGUucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kXG4gIH1cbiAgc2V0Q29uZmlybURpYWxvZ1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjM1MHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgICB9KVxuICAgIGxldCBkZWZhdWx0RGVsZXRlRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIzNTBweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICB0aGlzLmxlYXZlR3JvdXBEaWFsb2dTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxlYXZlR3JvdXBEaWFsb2dTdHlsZSB9XG4gICAgdGhpcy50cmFuc2Zlck93bmVyc2hpcERpYWxvZ1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMudHJhbnNmZXJPd25lcnNoaXBEaWFsb2dTdHlsZSB9XG4gICAgdGhpcy5kZWxldGVHcm91cERpYWxvZ1N0eWxlID0geyAuLi5kZWZhdWx0RGVsZXRlRGlhbG9nU3R5bGUsIC4uLnRoaXMuZGVsZXRlR3JvdXBEaWFsb2dTdHlsZSB9XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuXG4gICAgfVxuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSB9XG4gIH1cbiAgc2V0RGV0YWlsc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IERldGFpbHNTdHlsZSA9IG5ldyBEZXRhaWxzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiXG4gICAgfSlcbiAgICB0aGlzLmRldGFpbHNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRldGFpbHNTdHlsZSB9XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogdGhpcy5kZXRhaWxzU3R5bGUud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMuZGV0YWlsc1N0eWxlLmhlaWdodCxcbiAgICAgIGJvcmRlcjogdGhpcy5kZXRhaWxzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmRldGFpbHNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmRldGFpbHNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgIH1cbiAgfVxuICBtYXJnaW5TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGFkZGluZzogdGhpcy5kZXRhaWxzU3R5bGU/LnBhZGRpbmdcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX193cmFwcGVyXCIgKm5nSWY9XCJ1c2VyIHx8IGdyb3VwXCJcbiAgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX2hlYWRlclwiPlxuICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwidGl0bGVcIlxuICAgICAgW2xhYmVsU3R5bGVdPVwiZ2V0VGl0bGVTdHlsZSgpXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGVcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQ2xvc2VEZXRhaWxzKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc1wiIFtuZ1N0eWxlXT1cIm1hcmdpblN0eWxlKClcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fcHJvZmlsZVwiICpuZ0lmPVwiIWhpZGVQcm9maWxlXCI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSAqbmdJZj1cIiFjdXN0b21Qcm9maWxlVmlldztlbHNlIGxpc3RpdGVtXCJcbiAgICAgICAgW2F2YXRhck5hbWVdPVwidXNlcj8uZ2V0TmFtZSgpID8/IHRoaXMuZ3JvdXA/LmdldE5hbWUoKVwiXG4gICAgICAgIFthdmF0YXJVUkxdPVwidGhpcy51c2VyPy5nZXRBdmF0YXIoKSA/PyB0aGlzLmdyb3VwPy5nZXRJY29uKClcIlxuICAgICAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImNoZWNrU3RhdHVzVHlwZSgpXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckljb25dPVwiY2hlY2tHcm91cFR5cGUoKVwiXG4gICAgICAgIFt0aXRsZV09XCJ0aGlzLnVzZXI/LmdldE5hbWUoKSA/PyB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXN1YnRpdGxlVmlldzsgZWxzZSBzdWJ0aXRsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIlxuICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3VidGl0bGU+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb24tbGlzdFwiXG4gICAgICAqbmdJZj1cImRlZmF1bHRUZW1wbGF0ZSAmJiBkZWZhdWx0VGVtcGxhdGUubGVuZ3RoID4gMFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb25cIiAqbmdGb3I9XCJsZXQgaXRlbSBvZiBkZWZhdWx0VGVtcGxhdGVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3NlY3Rpb24tc2VwYXJhdG9yXCIgKm5nSWY9XCJpdGVtLnRpdGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJpdGVtLnRpdGxlXCJcbiAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImdldFNlY3Rpb25IZWFkZXJTdHlsZShpdGVtKVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbnMtd3JhcHBlclwiXG4gICAgICAgICAgKm5nSWY9XCJnZXRUZW1wbGF0ZU9wdGlvbnMoaXRlbSlcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fb3B0aW9uc1wiXG4gICAgICAgICAgICAqbmdGb3I9XCJsZXQgb3B0aW9uIG9mIGdldFRlbXBsYXRlT3B0aW9ucyhpdGVtKVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvblwiXG4gICAgICAgICAgICAgICpuZ0lmPVwiIWdldEN1c3RvbU9wdGlvblZpZXcob3B0aW9uKTtlbHNlIGN1c3RvbVZpZXdcIlxuICAgICAgICAgICAgICAoY2xpY2spPVwib25PcHRpb25DbGljayhvcHRpb24pXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19vcHRpb24tdGl0bGVcIj5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbdGV4dF09XCJvcHRpb24udGl0bGVcIlxuICAgICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldEJ1dHRvblN0eWxlKG9wdGlvbilcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbi10YWlsXCIgKm5nSWY9XCJvcHRpb24/LnRhaWxcIj5cbiAgICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJvcHRpb24/LnRhaWxcIj48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtZGl2aWRlclxuICAgICAgICAgICAgICAgIFtkaXZpZGVyU3R5bGVdPVwiZGl2aWRlclN0eWxlXCI+PC9jb21ldGNoYXQtZGl2aWRlcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICNjdXN0b21WaWV3PlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb24pXCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L2Rpdj5cbjxuZy10ZW1wbGF0ZSAjbGlzdGl0ZW0+XG4gIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJjdXN0b21Qcm9maWxlVmlld1wiPlxuICA8L25nLWNvbnRhaW5lcj5cbjwvbmctdGVtcGxhdGU+XG48ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fdmlld1wiICpuZ0lmPVwib3BlbkFkZE1lbWJlcnNQYWdlXCI+XG4gIDxjb21ldGNoYXQtYWRkLW1lbWJlcnNcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnRpdGxlQWxpZ25tZW50IVwiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtU3R5bGUhXCJcbiAgICBbYWRkTWVtYmVyc1N0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5hZGRNZW1iZXJzU3R5bGUhXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmF2YXRhclN0eWxlIVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zdGF0dXNJbmRpY2F0b3JTdHlsZSFcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5sb2FkaW5nU3RhdGVWaWV3IVwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5sb2FkaW5nSWNvblVSTCFcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvblNlbGVjdF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25TZWxlY3QhXCJcbiAgICBbb25FcnJvcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25FcnJvciFcIlxuICAgIFtoaWRlRXJyb3JdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmhpZGVFcnJvciFcIlxuICAgIFtoaWRlU2VhcmNoXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5oaWRlU2VhcmNoIVwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaEljb25VUkwhXCJcbiAgICBbc2VsZWN0aW9uTW9kZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VsZWN0aW9uTW9kZSFcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5oaWRlU2VwYXJhdG9yIVwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zaG93QmFja0J1dHRvbiFcIlxuICAgIFtzaG93U2VjdGlvbkhlYWRlcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2hvd1NlY3Rpb25IZWFkZXIhXCJcbiAgICBbb25BZGRNZW1iZXJzQnV0dG9uQ2xpY2tdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQWRkTWVtYmVyc0J1dHRvbkNsaWNrIVwiXG4gICAgW3VzZXJzQ29uZmlndXJhdGlvbl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udXNlcnNDb25maWd1cmF0aW9uXCJcbiAgICBbYmFja0J1dHRvbkljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmJhY2tCdXR0b25JY29uVVJMIVwiXG4gICAgW3NlY3Rpb25IZWFkZXJGaWVsZF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VjdGlvbkhlYWRlckZpZWxkIVwiXG4gICAgW2Nsb3NlQnV0dG9uSWNvblVSTF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uY2xvc2VCdXR0b25JY29uVVJMIVwiXG4gICAgW29wdGlvbnNdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9wdGlvbnMhXCJcbiAgICBbbWVudV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5kaXNhYmxlVXNlcnNQcmVzZW5jZSFcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwic2VsZWN0aW9ubW9kZUVudW1cIlxuICAgIFtvbkNsb3NlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkNsb3NlIHx8IG9uQ2xvc2VEZXRhaWxzXCJcbiAgICBbb25CYWNrXT1cIm9uQmFja0ZvckFkZE1lbWJlcnNcIlxuICAgIFt1c2Vyc1JlcXVlc3RCdWlsZGVyXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy51c2Vyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy51c2Vyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW2xpc3RJdGVtVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubGlzdEl0ZW1WaWV3XCI+XG4gIDwvY29tZXRjaGF0LWFkZC1tZW1iZXJzPlxuPC9kaXY+XG48ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fdmlld1wiICpuZ0lmPVwib3BlbkJhbm5lZE1lbWJlcnNQYWdlXCI+XG4gIDxjb21ldGNoYXQtYmFubmVkLW1lbWJlcnNcbiAgICBbbGlzdEl0ZW1WaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uPy5saXN0SXRlbVZpZXdcIlxuICAgIFtiYW5uZWRNZW1iZXJzUmVxdWVzdEJ1aWxkZXJdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFtzZWFyY2hSZXF1ZXN0QnVpbGRlcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2VhcmNoUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmxpc3RJdGVtU3R5bGVcIlxuICAgIFtiYW5uZWRNZW1iZXJzU3R5bGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uYmFubmVkTWVtYmVyc1N0eWxlXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW29uU2VsZWN0XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLm9uU2VsZWN0XCJcbiAgICBbb25FcnJvcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbaGlkZUVycm9yXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVFcnJvclwiXG4gICAgW2hpZGVTZWFyY2hdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlYXJjaFwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VsZWN0aW9uTW9kZVwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlcGFyYXRvclwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnNob3dCYWNrQnV0dG9uXCJcbiAgICBbYmFja0J1dHRvbkljb25VUkxdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uYmFja0J1dHRvbkljb25VUkxcIlxuICAgIFtjbG9zZUJ1dHRvbkljb25VUkxdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICBbb3B0aW9uc109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vcHRpb25zXCJcbiAgICBbbWVudV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5tZW51XCJcbiAgICBbZGlzYWJsZVVzZXJzUHJlc2VuY2VdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCIgW2dyb3VwXT1cImdyb3VwXCJcbiAgICBbb25DbG9zZV09XCJvbkNsb3NlRGV0YWlsc1wiXG4gICAgW29uQmFja109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkJhY2sgfHwgYmFubmVkTWVtYmVyc1wiPlxuICA8L2NvbWV0Y2hhdC1iYW5uZWQtbWVtYmVycz5cbjwvZGl2PlxuPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3ZpZXdcIiAqbmdJZj1cIm9wZW5WaWV3TWVtYmVyc1BhZ2VcIj5cbiAgPGNvbWV0Y2hhdC1ncm91cC1tZW1iZXJzXG4gICAgW2dyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaFJlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2dyb3VwTWVtYmVyc1N0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZ3JvdXBNZW1iZXJzU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25TZWxlY3RdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdFwiXG4gICAgW29uRXJyb3JdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbaGlkZUVycm9yXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZUVycm9yXCJcbiAgICBbaGlkZVNlYXJjaF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZWFyY2hcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zZWxlY3Rpb25Nb2RlXCJcbiAgICBbYmFja2Ryb3BTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tkcm9wU3R5bGVcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlcGFyYXRvclwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2hvd0JhY2tCdXR0b25cIlxuICAgIFtiYWNrQnV0dG9uSWNvblVSTF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tCdXR0b25JY29uVVJMXCJcbiAgICBbY2xvc2VCdXR0b25JY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICBbb3B0aW9uc109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgIFttZW51XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIlxuICAgIFtncm91cFNjb3BlU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5ncm91cFNjb3BlU3R5bGVcIlxuICAgIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwiIGdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25DbG9zZSB8fCBvbkNsb3NlRGV0YWlsc1wiXG4gICAgW29uQmFja109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9uQmFjayB8fCB2aWV3TWVtYmVyc1wiPlxuICA8L2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzPlxuPC9kaXY+XG5cbjxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiXG4gICpuZ0lmPVwiY29uZmlybUxlYXZlR3JvdXBNb2RhbFwiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiIFttZXNzYWdlVGV4dF09XCJsZWF2ZUdyb3VwRGlhbG9nTWVzc2FnZVwiXG4gICAgW2NhbmNlbEJ1dHRvblRleHRdPVwibGVhdmVHcm91cENhbmNlbEJ1dHRvblRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJsZWF2ZUdyb3VwQ29uZmlybUJ1dHRvblRleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25MZWF2ZUNsaWNrKClcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImxlYXZlR3JvdXBEaWFsb2dTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCIgKm5nSWY9XCJzaG93VHJhbnNmZXJEaWFsb2dcIj5cbiAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiJydcIlxuICAgIFttZXNzYWdlVGV4dF09XCJ0cmFuc2Zlck93bmVyc2hpcERpYWxvZ01lc3NhZ2VcIlxuICAgIFtjYW5jZWxCdXR0b25UZXh0XT1cInRyYW5zZmVyT3duZXJzaGlwQ2FuY2VsQnV0dG9uVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlybUJ1dHRvblRleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25UcmFuc2ZlckNsaWNrKClcIlxuICAgIChjYy1jYW5jZWwtY2xpY2tlZCk9XCJvbkNhbmNlbENsaWNrKClcIlxuICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBEaWFsb2dTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCJcbiAgKm5nSWY9XCJvcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbFwiPlxuICA8Y29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcFxuICAgIFtncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcl09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24/Lmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICBbdHJhbnNmZXJPd25lcnNoaXBTdHlsZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24udHJhbnNmZXJPd25lcnNoaXBTdHlsZVwiXG4gICAgW29uVHJhbnNmZXJPd25lcnNoaXBdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uVHJhbnNmZXJPd25lcnNoaXBcIlxuICAgIFt0aXRsZUFsaWdubWVudF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW29uRXJyb3JdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtoaWRlU2VhcmNoXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICBbc2VhcmNoSWNvblVSTF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgIFtjbG9zZUJ1dHRvbkljb25VUkxdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgW29wdGlvbnNdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uQ2xvc2UgfHwgb3BlblRyYW5zZmVyT3duZXJzaGlwXCI+XG4gIDwvY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcD5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCIgKm5nSWY9XCJkZWxldGVHcm91cE1vZGFsXCI+XG4gIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cIicnXCJcbiAgICBbbWVzc2FnZVRleHRdPVwiZGVsZXRlR3JvdXBEaWFsb2dNZXNzYWdlXCJcbiAgICBbY2FuY2VsQnV0dG9uVGV4dF09XCJkZWxldGVHcm91cENhbmNlbEJ1dHRvblRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJkZWxldGVHcm91cENvbmZpcm1CdXR0b25UZXh0XCJcbiAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cImRlbGV0ZUdyb3VwKClcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImRlbGV0ZUdyb3VwRGlhbG9nU3R5bGVcIj5cbiAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==