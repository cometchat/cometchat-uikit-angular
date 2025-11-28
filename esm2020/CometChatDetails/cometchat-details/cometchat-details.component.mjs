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
                return template.options(this.loggedInUser, this.group, template.id, this.user);
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
CometChatDetailsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatDetailsComponent, selector: "cometchat-details", inputs: { group: "group", user: "user", title: "title", closeButtonIconURL: "closeButtonIconURL", hideProfile: "hideProfile", subtitleView: "subtitleView", customProfileView: "customProfileView", data: "data", disableUsersPresence: "disableUsersPresence", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", onError: "onError", onClose: "onClose", leaveGroupConfirmButtonText: "leaveGroupConfirmButtonText", leaveGroupCancelButtonText: "leaveGroupCancelButtonText", leaveGroupDialogMessage: "leaveGroupDialogMessage", leaveGroupDialogStyle: "leaveGroupDialogStyle", deleteGroupConfirmButtonText: "deleteGroupConfirmButtonText", deleteGroupDialogMessage: "deleteGroupDialogMessage", deleteGroupCancelButtonText: "deleteGroupCancelButtonText", deleteGroupDialogStyle: "deleteGroupDialogStyle", transferOwnershipConfirmButtonText: "transferOwnershipConfirmButtonText", transferOwnershipDialogMessage: "transferOwnershipDialogMessage", transferOwnershipCancelButtonText: "transferOwnershipCancelButtonText", transferOwnershipDialogStyle: "transferOwnershipDialogStyle", addMembersConfiguration: "addMembersConfiguration", bannedMembersConfiguration: "bannedMembersConfiguration", groupMembersConfiguration: "groupMembersConfiguration", transferOwnershipConfiguration: "transferOwnershipConfiguration", statusIndicatorStyle: "statusIndicatorStyle", backdropStyle: "backdropStyle", avatarStyle: "avatarStyle", detailsStyle: "detailsStyle", listItemStyle: "listItemStyle" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-details__wrapper\" *ngIf=\"user || group\"\n  [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-details__header\">\n    <cometchat-label [text]=\"title\"\n      [labelStyle]=\"getTitleStyle()\"></cometchat-label>\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-details\" [ngStyle]=\"marginStyle()\">\n    <div class=\"cc-details__profile\" *ngIf=\"!hideProfile\">\n      <cometchat-list-item *ngIf=\"!customProfileView;else listitem\"\n        [avatarName]=\"user?.getName() ?? this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() ?? this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() ?? this.group?.getName()\"\n        [hideSeparator]=\"false\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n            </ng-container>\n          </ng-template>\n        </div>\n      </cometchat-list-item>\n    </div>\n    <div class=\"cc-details__section-list\"\n      *ngIf=\"defaultTemplate && defaultTemplate.length > 0\">\n      <div class=\"cc-details__section\" *ngFor=\"let item of defaultTemplate\">\n        <div class=\"cc-details__section-separator\" *ngIf=\"item.title\">\n          <cometchat-label [text]=\"item.title\"\n            [labelStyle]=\"getSectionHeaderStyle(item)\"></cometchat-label>\n        </div>\n        <div class=\"cc-details__options-wrapper\"\n          *ngIf=\"getTemplateOptions(item)\">\n          <div class=\"cc-details__options\"\n            *ngFor=\"let option of getTemplateOptions(item)\">\n            <div class=\"cc-details__option\"\n              *ngIf=\"!getCustomOptionView(option);else customView\"\n              (click)=\"onOptionClick(option)\">\n              <div class=\"cc-details__option-title\">\n                <cometchat-button [text]=\"option.title\"\n                  [buttonStyle]=\"getButtonStyle(option)\"></cometchat-button>\n                <div class=\"cc-details__option-tail\" *ngIf=\"option?.tail\">\n                  <ng-container *ngTemplateOutlet=\"option?.tail\"></ng-container>\n                </div>\n              </div>\n              <cometchat-divider\n                [dividerStyle]=\"dividerStyle\"></cometchat-divider>\n            </div>\n            <ng-template #customView>\n              <ng-container *ngTemplateOutlet=\"getCustomOptionView(option)\">\n              </ng-container>\n            </ng-template>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template #listitem>\n  <ng-container *ngTemplateOutlet=\"customProfileView\">\n  </ng-container>\n</ng-template>\n<div class=\"cc-details__view\" *ngIf=\"openAddMembersPage\">\n  <cometchat-add-members\n    [titleAlignment]=\"addMembersConfiguration?.titleAlignment!\"\n    [listItemStyle]=\"addMembersConfiguration?.listItemStyle!\"\n    [addMembersStyle]=\"addMembersConfiguration?.addMembersStyle!\"\n    [avatarStyle]=\"addMembersConfiguration?.avatarStyle!\"\n    [statusIndicatorStyle]=\"addMembersConfiguration?.statusIndicatorStyle!\"\n    [loadingStateView]=\"addMembersConfiguration?.loadingStateView!\"\n    [loadingIconURL]=\"addMembersConfiguration?.loadingIconURL!\"\n    [errorStateView]=\"addMembersConfiguration?.errorStateView\"\n    [emptyStateView]=\"addMembersConfiguration?.emptyStateView\"\n    [onSelect]=\"addMembersConfiguration?.onSelect!\"\n    [onError]=\"addMembersConfiguration?.onError!\"\n    [hideError]=\"addMembersConfiguration?.hideError!\"\n    [hideSearch]=\"addMembersConfiguration?.hideSearch!\"\n    [searchIconURL]=\"addMembersConfiguration?.searchIconURL!\"\n    [selectionMode]=\"addMembersConfiguration?.selectionMode!\"\n    [hideSeparator]=\"addMembersConfiguration?.hideSeparator!\"\n    [showBackButton]=\"addMembersConfiguration?.showBackButton!\"\n    [showSectionHeader]=\"addMembersConfiguration?.showSectionHeader!\"\n    [onAddMembersButtonClick]=\"addMembersConfiguration?.onAddMembersButtonClick!\"\n    [usersConfiguration]=\"addMembersConfiguration?.usersConfiguration\"\n    [backButtonIconURL]=\"addMembersConfiguration?.backButtonIconURL!\"\n    [sectionHeaderField]=\"addMembersConfiguration?.sectionHeaderField!\"\n    [closeButtonIconURL]=\"addMembersConfiguration?.closeButtonIconURL!\"\n    [options]=\"addMembersConfiguration?.options!\"\n    [menu]=\"addMembersConfiguration?.menu\"\n    [disableUsersPresence]=\"addMembersConfiguration?.disableUsersPresence!\"\n    [subtitleView]=\"addMembersConfiguration?.subtitleView\" [group]=\"group\"\n    [selectionMode]=\"selectionmodeEnum\"\n    [onClose]=\"addMembersConfiguration?.onClose || onCloseDetails\"\n    [onBack]=\"onBackForAddMembers\"\n    [usersRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [searchRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [listItemView]=\"addMembersConfiguration?.listItemView\">\n  </cometchat-add-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openBannedMembersPage\">\n  <cometchat-banned-members\n    [listItemView]=\"bannedMembersConfiguration?.listItemView\"\n    [bannedMembersRequestBuilder]=\"bannedMembersConfiguration?.bannedMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"bannedMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"bannedMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"bannedMembersConfiguration.listItemStyle\"\n    [bannedMembersStyle]=\"bannedMembersConfiguration.bannedMembersStyle\"\n    [avatarStyle]=\"bannedMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"bannedMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"bannedMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"bannedMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"bannedMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"bannedMembersConfiguration.emptyStateView\"\n    [onSelect]=\"bannedMembersConfiguration.onSelect\"\n    [onError]=\"bannedMembersConfiguration.onError\"\n    [hideError]=\"bannedMembersConfiguration.hideError\"\n    [hideSearch]=\"bannedMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"bannedMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"bannedMembersConfiguration.selectionMode\"\n    [hideSeparator]=\"bannedMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"bannedMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"bannedMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"bannedMembersConfiguration.closeButtonIconURL\"\n    [options]=\"bannedMembersConfiguration.options\"\n    [menu]=\"bannedMembersConfiguration.menu\"\n    [disableUsersPresence]=\"bannedMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"bannedMembersConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"onCloseDetails\"\n    [onBack]=\"bannedMembersConfiguration.onBack || bannedMembers\">\n  </cometchat-banned-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openViewMembersPage\">\n  <cometchat-group-members\n    [listItemView]=\"groupMembersConfiguration?.listItemView!\"\n    [groupMembersRequestBuilder]=\"groupMembersConfiguration?.groupMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"groupMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"groupMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"groupMembersConfiguration.listItemStyle\"\n    [groupMembersStyle]=\"groupMembersConfiguration.groupMembersStyle\"\n    [avatarStyle]=\"groupMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"groupMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"groupMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"groupMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"groupMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"groupMembersConfiguration.emptyStateView\"\n    [onSelect]=\"groupMembersConfiguration.onSelect\"\n    [onError]=\"groupMembersConfiguration.onError\"\n    [hideError]=\"groupMembersConfiguration.hideError\"\n    [hideSearch]=\"groupMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"groupMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"groupMembersConfiguration.selectionMode\"\n    [backdropStyle]=\"groupMembersConfiguration.backdropStyle\"\n    [hideSeparator]=\"groupMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"groupMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"groupMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"groupMembersConfiguration.closeButtonIconURL\"\n    [options]=\"groupMembersConfiguration.options\"\n    [menu]=\"groupMembersConfiguration.menu\"\n    [disableUsersPresence]=\"groupMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"groupMembersConfiguration.subtitleView\"\n    [groupScopeStyle]=\"groupMembersConfiguration.groupScopeStyle\"\n    [group]=\"group\"\n    [onClose]=\" groupMembersConfiguration.onClose || onCloseDetails\"\n    [onBack]=\"groupMembersConfiguration.onBack || viewMembers\">\n  </cometchat-group-members>\n</div>\n\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"confirmLeaveGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"leaveGroupDialogMessage\"\n    [cancelButtonText]=\"leaveGroupCancelButtonText\"\n    [confirmButtonText]=\"leaveGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"onLeaveClick()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"leaveGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"showTransferDialog\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"transferOwnershipDialogMessage\"\n    [cancelButtonText]=\"transferOwnershipCancelButtonText\"\n    [confirmButtonText]=\"transferOwnershipConfirmButtonText\"\n    (cc-confirm-clicked)=\"onTransferClick()\"\n    (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"transferOwnershipDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"openTransferOwnershipModal\">\n  <cometchat-transfer-ownership\n    [groupMembersRequestBuilder]=\"transferOwnershipConfiguration?.groupMembersRequestBuilder\"\n    [transferOwnershipStyle]=\"transferOwnershipConfiguration.transferOwnershipStyle\"\n    [onTransferOwnership]=\"transferOwnershipConfiguration.onTransferOwnership\"\n    [titleAlignment]=\"transferOwnershipConfiguration.titleAlignment\"\n    [listItemStyle]=\"transferOwnershipConfiguration.listItemStyle\"\n    [avatarStyle]=\"transferOwnershipConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"transferOwnershipConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"transferOwnershipConfiguration.loadingStateView\"\n    [loadingIconURL]=\"transferOwnershipConfiguration.loadingIconURL\"\n    [errorStateView]=\"transferOwnershipConfiguration.errorStateView\"\n    [emptyStateView]=\"transferOwnershipConfiguration.emptyStateView\"\n    [onError]=\"transferOwnershipConfiguration.onError\"\n    [hideSearch]=\"transferOwnershipConfiguration.hideSearch\"\n    [searchIconURL]=\"transferOwnershipConfiguration.searchIconURL\"\n    [hideSeparator]=\"transferOwnershipConfiguration.hideSeparator\"\n    [closeButtonIconURL]=\"transferOwnershipConfiguration.closeButtonIconURL\"\n    [options]=\"transferOwnershipConfiguration.options\"\n    [disableUsersPresence]=\"transferOwnershipConfiguration.disableUsersPresence\"\n    [subtitleView]=\"transferOwnershipConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"transferOwnershipConfiguration.onClose || openTransferOwnership\">\n  </cometchat-transfer-ownership>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"deleteGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"deleteGroupDialogMessage\"\n    [cancelButtonText]=\"deleteGroupCancelButtonText\"\n    [confirmButtonText]=\"deleteGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"deleteGroup()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"deleteGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n", styles: ["*{box-sizing:border-box;margin:0;padding:0}.cc-details__wrapper{padding:8px;border-radius:5px;height:100%;overflow:hidden}.cc-details__profile{margin-bottom:50px;height:8%}.cc-details__section-list{height:84%;width:100%;overflow-y:auto;overflow-x:hidden}.cc-details__header{display:flex;justify-content:center;align-items:center;margin-bottom:30px}.cc-details__close-button{position:absolute;right:20px}.cc-details__section{margin-bottom:32px}.cc-details__section-separator{margin-bottom:16px;padding-left:6px;height:5%}.cc-details__options-wrapper{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}.cc-details__option{display:flex;flex-direction:column;justify-content:space-evenly;min-height:50px}.cc-details__option-title{padding-bottom:12px;display:flex;align-items:center;justify-content:space-between}.cc-details__view{position:absolute;top:0;left:0;height:100%;width:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;max-width:100%;z-index:1}.cc-details__section-list::-webkit-scrollbar{background:transparent;width:8px}.cc-details__section-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-details__leavedialog,.cc-details__transferownership{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:-moz-fit-content;height:fit-content;width:100%;z-index:2}\n"], components: [{ type: i2.CometChatAddMembersComponent, selector: "cometchat-add-members", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "hideError", "searchIconURL", "hideSearch", "title", "onError", "onBack", "onClose", "onSelect", "buttonText", "group", "emptyStateView", "errorStateView", "loadingIconURL", "listItemStyle", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "onAddMembersButtonClick", "titleAlignment", "addMembersStyle", "StatusIndicatorStyle", "statusIndicatorStyle", "avatarStyle"] }, { type: i3.CometChatBannedMembersComponent, selector: "cometchat-banned-members", inputs: ["bannedMembersRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onSelect", "onBack", "onClose", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "unbanIconURL", "statusIndicatorStyle", "avatarStyle", "bannedMembersStyle", "listItemStyle"] }, { type: i4.CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "tailView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "backdropStyle", "onBack", "onClose", "onSelect", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "dropdownIconURL", "statusIndicatorStyle", "avatarStyle", "groupMembersStyle", "groupScopeStyle", "listItemStyle", "onItemClick", "onEmpty", "userPresencePlacement", "disableLoadingState", "searchKeyword"] }, { type: i5.CometChatTransferOwnershipComponent, selector: "cometchat-transfer-ownership", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "disableUsersPresence", "options", "closeButtonIconURL", "hideSeparator", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "onClose", "onTransferOwnership", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "statusIndicatorStyle", "transferOwnershipStyle", "transferButtonText", "cancelButtonText", "avatarStyle", "groupMembersStyle", "listItemStyle", "titleAlignment"] }], directives: [{ type: i6.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i6.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i6.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i6.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetailsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-details", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-details__wrapper\" *ngIf=\"user || group\"\n  [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-details__header\">\n    <cometchat-label [text]=\"title\"\n      [labelStyle]=\"getTitleStyle()\"></cometchat-label>\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-details\" [ngStyle]=\"marginStyle()\">\n    <div class=\"cc-details__profile\" *ngIf=\"!hideProfile\">\n      <cometchat-list-item *ngIf=\"!customProfileView;else listitem\"\n        [avatarName]=\"user?.getName() ?? this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() ?? this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() ?? this.group?.getName()\"\n        [hideSeparator]=\"false\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n            </ng-container>\n          </ng-template>\n        </div>\n      </cometchat-list-item>\n    </div>\n    <div class=\"cc-details__section-list\"\n      *ngIf=\"defaultTemplate && defaultTemplate.length > 0\">\n      <div class=\"cc-details__section\" *ngFor=\"let item of defaultTemplate\">\n        <div class=\"cc-details__section-separator\" *ngIf=\"item.title\">\n          <cometchat-label [text]=\"item.title\"\n            [labelStyle]=\"getSectionHeaderStyle(item)\"></cometchat-label>\n        </div>\n        <div class=\"cc-details__options-wrapper\"\n          *ngIf=\"getTemplateOptions(item)\">\n          <div class=\"cc-details__options\"\n            *ngFor=\"let option of getTemplateOptions(item)\">\n            <div class=\"cc-details__option\"\n              *ngIf=\"!getCustomOptionView(option);else customView\"\n              (click)=\"onOptionClick(option)\">\n              <div class=\"cc-details__option-title\">\n                <cometchat-button [text]=\"option.title\"\n                  [buttonStyle]=\"getButtonStyle(option)\"></cometchat-button>\n                <div class=\"cc-details__option-tail\" *ngIf=\"option?.tail\">\n                  <ng-container *ngTemplateOutlet=\"option?.tail\"></ng-container>\n                </div>\n              </div>\n              <cometchat-divider\n                [dividerStyle]=\"dividerStyle\"></cometchat-divider>\n            </div>\n            <ng-template #customView>\n              <ng-container *ngTemplateOutlet=\"getCustomOptionView(option)\">\n              </ng-container>\n            </ng-template>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template #listitem>\n  <ng-container *ngTemplateOutlet=\"customProfileView\">\n  </ng-container>\n</ng-template>\n<div class=\"cc-details__view\" *ngIf=\"openAddMembersPage\">\n  <cometchat-add-members\n    [titleAlignment]=\"addMembersConfiguration?.titleAlignment!\"\n    [listItemStyle]=\"addMembersConfiguration?.listItemStyle!\"\n    [addMembersStyle]=\"addMembersConfiguration?.addMembersStyle!\"\n    [avatarStyle]=\"addMembersConfiguration?.avatarStyle!\"\n    [statusIndicatorStyle]=\"addMembersConfiguration?.statusIndicatorStyle!\"\n    [loadingStateView]=\"addMembersConfiguration?.loadingStateView!\"\n    [loadingIconURL]=\"addMembersConfiguration?.loadingIconURL!\"\n    [errorStateView]=\"addMembersConfiguration?.errorStateView\"\n    [emptyStateView]=\"addMembersConfiguration?.emptyStateView\"\n    [onSelect]=\"addMembersConfiguration?.onSelect!\"\n    [onError]=\"addMembersConfiguration?.onError!\"\n    [hideError]=\"addMembersConfiguration?.hideError!\"\n    [hideSearch]=\"addMembersConfiguration?.hideSearch!\"\n    [searchIconURL]=\"addMembersConfiguration?.searchIconURL!\"\n    [selectionMode]=\"addMembersConfiguration?.selectionMode!\"\n    [hideSeparator]=\"addMembersConfiguration?.hideSeparator!\"\n    [showBackButton]=\"addMembersConfiguration?.showBackButton!\"\n    [showSectionHeader]=\"addMembersConfiguration?.showSectionHeader!\"\n    [onAddMembersButtonClick]=\"addMembersConfiguration?.onAddMembersButtonClick!\"\n    [usersConfiguration]=\"addMembersConfiguration?.usersConfiguration\"\n    [backButtonIconURL]=\"addMembersConfiguration?.backButtonIconURL!\"\n    [sectionHeaderField]=\"addMembersConfiguration?.sectionHeaderField!\"\n    [closeButtonIconURL]=\"addMembersConfiguration?.closeButtonIconURL!\"\n    [options]=\"addMembersConfiguration?.options!\"\n    [menu]=\"addMembersConfiguration?.menu\"\n    [disableUsersPresence]=\"addMembersConfiguration?.disableUsersPresence!\"\n    [subtitleView]=\"addMembersConfiguration?.subtitleView\" [group]=\"group\"\n    [selectionMode]=\"selectionmodeEnum\"\n    [onClose]=\"addMembersConfiguration?.onClose || onCloseDetails\"\n    [onBack]=\"onBackForAddMembers\"\n    [usersRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [searchRequestBuilder]=\"addMembersConfiguration?.usersRequestBuilder!\"\n    [listItemView]=\"addMembersConfiguration?.listItemView\">\n  </cometchat-add-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openBannedMembersPage\">\n  <cometchat-banned-members\n    [listItemView]=\"bannedMembersConfiguration?.listItemView\"\n    [bannedMembersRequestBuilder]=\"bannedMembersConfiguration?.bannedMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"bannedMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"bannedMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"bannedMembersConfiguration.listItemStyle\"\n    [bannedMembersStyle]=\"bannedMembersConfiguration.bannedMembersStyle\"\n    [avatarStyle]=\"bannedMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"bannedMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"bannedMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"bannedMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"bannedMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"bannedMembersConfiguration.emptyStateView\"\n    [onSelect]=\"bannedMembersConfiguration.onSelect\"\n    [onError]=\"bannedMembersConfiguration.onError\"\n    [hideError]=\"bannedMembersConfiguration.hideError\"\n    [hideSearch]=\"bannedMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"bannedMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"bannedMembersConfiguration.selectionMode\"\n    [hideSeparator]=\"bannedMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"bannedMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"bannedMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"bannedMembersConfiguration.closeButtonIconURL\"\n    [options]=\"bannedMembersConfiguration.options\"\n    [menu]=\"bannedMembersConfiguration.menu\"\n    [disableUsersPresence]=\"bannedMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"bannedMembersConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"onCloseDetails\"\n    [onBack]=\"bannedMembersConfiguration.onBack || bannedMembers\">\n  </cometchat-banned-members>\n</div>\n<div class=\"cc-details__view\" *ngIf=\"openViewMembersPage\">\n  <cometchat-group-members\n    [listItemView]=\"groupMembersConfiguration?.listItemView!\"\n    [groupMembersRequestBuilder]=\"groupMembersConfiguration?.groupMembersRequestBuilder!\"\n    [searchRequestBuilder]=\"groupMembersConfiguration?.searchRequestBuilder!\"\n    [titleAlignment]=\"groupMembersConfiguration.titleAlignment\"\n    [listItemStyle]=\"groupMembersConfiguration.listItemStyle\"\n    [groupMembersStyle]=\"groupMembersConfiguration.groupMembersStyle\"\n    [avatarStyle]=\"groupMembersConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"groupMembersConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"groupMembersConfiguration.loadingStateView\"\n    [loadingIconURL]=\"groupMembersConfiguration.loadingIconURL\"\n    [errorStateView]=\"groupMembersConfiguration.errorStateView\"\n    [emptyStateView]=\"groupMembersConfiguration.emptyStateView\"\n    [onSelect]=\"groupMembersConfiguration.onSelect\"\n    [onError]=\"groupMembersConfiguration.onError\"\n    [hideError]=\"groupMembersConfiguration.hideError\"\n    [hideSearch]=\"groupMembersConfiguration.hideSearch\"\n    [searchIconURL]=\"groupMembersConfiguration.searchIconURL\"\n    [selectionMode]=\"groupMembersConfiguration.selectionMode\"\n    [backdropStyle]=\"groupMembersConfiguration.backdropStyle\"\n    [hideSeparator]=\"groupMembersConfiguration.hideSeparator\"\n    [showBackButton]=\"groupMembersConfiguration.showBackButton\"\n    [backButtonIconURL]=\"groupMembersConfiguration.backButtonIconURL\"\n    [closeButtonIconURL]=\"groupMembersConfiguration.closeButtonIconURL\"\n    [options]=\"groupMembersConfiguration.options\"\n    [menu]=\"groupMembersConfiguration.menu\"\n    [disableUsersPresence]=\"groupMembersConfiguration.disableUsersPresence\"\n    [subtitleView]=\"groupMembersConfiguration.subtitleView\"\n    [groupScopeStyle]=\"groupMembersConfiguration.groupScopeStyle\"\n    [group]=\"group\"\n    [onClose]=\" groupMembersConfiguration.onClose || onCloseDetails\"\n    [onBack]=\"groupMembersConfiguration.onBack || viewMembers\">\n  </cometchat-group-members>\n</div>\n\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"confirmLeaveGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"leaveGroupDialogMessage\"\n    [cancelButtonText]=\"leaveGroupCancelButtonText\"\n    [confirmButtonText]=\"leaveGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"onLeaveClick()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"leaveGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"showTransferDialog\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"transferOwnershipDialogMessage\"\n    [cancelButtonText]=\"transferOwnershipCancelButtonText\"\n    [confirmButtonText]=\"transferOwnershipConfirmButtonText\"\n    (cc-confirm-clicked)=\"onTransferClick()\"\n    (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"transferOwnershipDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\"\n  *ngIf=\"openTransferOwnershipModal\">\n  <cometchat-transfer-ownership\n    [groupMembersRequestBuilder]=\"transferOwnershipConfiguration?.groupMembersRequestBuilder\"\n    [transferOwnershipStyle]=\"transferOwnershipConfiguration.transferOwnershipStyle\"\n    [onTransferOwnership]=\"transferOwnershipConfiguration.onTransferOwnership\"\n    [titleAlignment]=\"transferOwnershipConfiguration.titleAlignment\"\n    [listItemStyle]=\"transferOwnershipConfiguration.listItemStyle\"\n    [avatarStyle]=\"transferOwnershipConfiguration.avatarStyle\"\n    [statusIndicatorStyle]=\"transferOwnershipConfiguration.statusIndicatorStyle\"\n    [loadingStateView]=\"transferOwnershipConfiguration.loadingStateView\"\n    [loadingIconURL]=\"transferOwnershipConfiguration.loadingIconURL\"\n    [errorStateView]=\"transferOwnershipConfiguration.errorStateView\"\n    [emptyStateView]=\"transferOwnershipConfiguration.emptyStateView\"\n    [onError]=\"transferOwnershipConfiguration.onError\"\n    [hideSearch]=\"transferOwnershipConfiguration.hideSearch\"\n    [searchIconURL]=\"transferOwnershipConfiguration.searchIconURL\"\n    [hideSeparator]=\"transferOwnershipConfiguration.hideSeparator\"\n    [closeButtonIconURL]=\"transferOwnershipConfiguration.closeButtonIconURL\"\n    [options]=\"transferOwnershipConfiguration.options\"\n    [disableUsersPresence]=\"transferOwnershipConfiguration.disableUsersPresence\"\n    [subtitleView]=\"transferOwnershipConfiguration.subtitleView\" [group]=\"group\"\n    [onClose]=\"transferOwnershipConfiguration.onClose || openTransferOwnership\">\n  </cometchat-transfer-ownership>\n</cometchat-backdrop>\n<cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"deleteGroupModal\">\n  <cometchat-confirm-dialog [title]=\"''\"\n    [messageText]=\"deleteGroupDialogMessage\"\n    [cancelButtonText]=\"deleteGroupCancelButtonText\"\n    [confirmButtonText]=\"deleteGroupConfirmButtonText\"\n    (cc-confirm-clicked)=\"deleteGroup()\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"deleteGroupDialogStyle\">\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n", styles: ["*{box-sizing:border-box;margin:0;padding:0}.cc-details__wrapper{padding:8px;border-radius:5px;height:100%;overflow:hidden}.cc-details__profile{margin-bottom:50px;height:8%}.cc-details__section-list{height:84%;width:100%;overflow-y:auto;overflow-x:hidden}.cc-details__header{display:flex;justify-content:center;align-items:center;margin-bottom:30px}.cc-details__close-button{position:absolute;right:20px}.cc-details__section{margin-bottom:32px}.cc-details__section-separator{margin-bottom:16px;padding-left:6px;height:5%}.cc-details__options-wrapper{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}.cc-details__option{display:flex;flex-direction:column;justify-content:space-evenly;min-height:50px}.cc-details__option-title{padding-bottom:12px;display:flex;align-items:center;justify-content:space-between}.cc-details__view{position:absolute;top:0;left:0;height:100%;width:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;max-width:100%;z-index:1}.cc-details__section-list::-webkit-scrollbar{background:transparent;width:8px}.cc-details__section-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-details__leavedialog,.cc-details__transferownership{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:-moz-fit-content;height:fit-content;width:100%;z-index:2}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXREZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0RGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULEtBQUssRUFFTCx1QkFBdUIsR0FLeEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsV0FBVyxFQUFpQixrQkFBa0IsRUFBRSxhQUFhLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQTtBQUMxRyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBeUIsRUFBRSw4QkFBOEIsR0FBYyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hOLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUErQyxtQkFBbUIsRUFBMkYsYUFBYSxFQUE0QixNQUFNLDRCQUE0QixDQUFBO0FBQ3BULE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7Ozs7O0FBQy9EOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLHlCQUF5QjtJQTZKcEMsWUFBb0IsR0FBc0Is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Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFnQkcsNEJBQTRCO3NCQUFwQyxLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFDRywyQkFBMkI7c0JBQW5DLEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUlHLGtDQUFrQztzQkFBMUMsS0FBSztnQkFDRyw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBQ0csaUNBQWlDO3NCQUF6QyxLQUFLO2dCQUNHLDRCQUE0QjtzQkFBcEMsS0FBSztnQkFLRyx1QkFBdUI7c0JBQS9CLEtBQUs7Z0JBQ0csMEJBQTBCO3NCQUFsQyxLQUFLO2dCQUNHLHlCQUF5QjtzQkFBakMsS0FBSztnQkFDRyw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBSUcsb0JBQW9CO3NCQUE1QixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsV0FBVztzQkFBbkIsS0FBSztnQkFPRyxZQUFZO3NCQUFwQixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIElucHV0LFxuICBPbkluaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgVGVtcGxhdGVSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgQmFja2Ryb3BTdHlsZSwgQ29uZmlybURpYWxvZ1N0eWxlLCBMaXN0SXRlbVN0eWxlLCB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBBZGRNZW1iZXJzQ29uZmlndXJhdGlvbiwgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24sIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSwgRGV0YWlsc1N0eWxlLCBEZXRhaWxzVXRpbHMsIEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24sIFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiwgQmFzZVN0eWxlLCB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgSUdyb3VwTWVtYmVyQWRkZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgQ29tZXRDaGF0VXNlckV2ZW50cywgSUdyb3VwTWVtYmVySm9pbmVkLCBJT3duZXJzaGlwQ2hhbmdlZCwgQ29tZXRDaGF0RGV0YWlsc09wdGlvbiwgQ29tZXRDaGF0RGV0YWlsc1RlbXBsYXRlLCBTZWxlY3Rpb25Nb2RlLCBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcydcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdERldGFpbHNDb21wb25lbnQgcmVuZGVycyBkZXRhaWxzIG9mIHVzZXIgb3IgZ3JvdXAuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWRldGFpbHNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtZGV0YWlscy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWRldGFpbHMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXREZXRhaWxzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJERVRBSUxTXCIpO1xuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVQcm9maWxlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGN1c3RvbVByb2ZpbGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGF0YT86IENvbWV0Q2hhdERldGFpbHNUZW1wbGF0ZVtdO1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBwcml2YXRlR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Qcml2YXRlLnN2Z1wiO1xuICAvKipcbiAgKiBAZGVwcmVjYXRlZFxuICAqXG4gICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGxlYXZlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9HUk9VUFwiKTtcbiAgQElucHV0KCkgbGVhdmVHcm91cENhbmNlbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJMRUFWRV9DT05GSVJNXCIpO1xuICBASW5wdXQoKSBsZWF2ZUdyb3VwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjA2KVwiLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IFwiNjAwIDE1cHggSW50ZXJcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIG1lc3NhZ2VUZXh0Rm9udDogXCI0MDAgMTNweCBJbnRlclwiLFxuICAgIG1lc3NhZ2VUZXh0Q29sb3I6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNGMkYyRjJcIixcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVcIik7XG4gIEBJbnB1dCgpIGRlbGV0ZUdyb3VwRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVfQ09ORklSTVwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBDYW5jZWxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTkNFTFwiKTtcbiAgQElucHV0KCkgZGVsZXRlR3JvdXBEaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxODBweFwiLFxuICAgIHdpZHRoOiBcIjM2MHB4XCJcbiAgfVxuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpcm1CdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX09XTkVSU0hJUFwiKTtcbiAgQElucHV0KCkgdHJhbnNmZXJPd25lcnNoaXBEaWFsb2dNZXNzYWdlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlRSQU5TRkVSX0NPTkZJUk1cIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwQ2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIHRyYW5zZmVyT3duZXJzaGlwRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiXG4gIH1cblxuICBASW5wdXQoKSBhZGRNZW1iZXJzQ29uZmlndXJhdGlvbjogQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbjogQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24gPSBuZXcgQmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBncm91cE1lbWJlcnNDb25maWd1cmF0aW9uOiBHcm91cE1lbWJlcnNDb25maWd1cmF0aW9uID0gbmV3IEdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSB0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb246IFRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbiA9IG5ldyBUcmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24oe30pO1xuXG5cbiAgYmFja2ljb251cmwgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiXG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCJcbiAgfVxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuXG4gIH07XG4gIEBJbnB1dCgpIGRldGFpbHNTdHlsZTogRGV0YWlsc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiZ3JleVwiLFxuICAgIHRpdGxlRm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIHRpdGxlQ29sb3I6IFwiYmxhY2tcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG5cblxuICBzaG93VHJhbnNmZXJEaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZGVmYXVsdFRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGVbXSA9IFtdXG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcGVuVmlld01lbWJlcnNQYWdlOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBvcGVuQmFubmVkTWVtYmVyc1BhZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIG9wZW5BZGRNZW1iZXJzUGFnZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uZmlybUxlYXZlR3JvdXBNb2RhbDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgb3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZVxuICBzZWxlY3Rpb25tb2RlRW51bTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubXVsdGlwbGU7XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICBjbG9zZUJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogdGhpcy5kZXRhaWxzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICB9XG4gIGJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpIHx8IFwicmdiYSg1MSwgMTUzLCAyNTUpXCIsXG4gICAgYnV0dG9uVGV4dEZvbnQ6IFwiNTAwIDE2cHggSW50ZXJcIlxuICB9XG4gIGRpdmlkZXJTdHlsZTogYW55ID0ge1xuICAgIGJhY2tncm91bmQ6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiLFxuICAgIGhlaWdodDogXCIxcHhcIixcbiAgICB3aWR0aDogXCIxMDAlXCJcbiAgfVxuXG4gIGRlbGV0ZUdyb3VwTW9kYWw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZ2V0VGl0bGVTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dEZvbnQgfHwgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuZGV0YWlsc1N0eWxlLnRpdGxlVGV4dENvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KClcbiAgICB9XG4gIH1cbiAgZ2V0Q3VzdG9tT3B0aW9uVmlldyhvcHRpb246IENvbWV0Q2hhdERldGFpbHNPcHRpb24pIHtcbiAgICByZXR1cm4gb3B0aW9uPy5jdXN0b21WaWV3XG4gIH1cbiAgcHVibGljIHN1YnRpdGxlVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbWVtYmVyc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwibWVtYmVybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUoKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgICB0aGlzLmdldFRlbXBsYXRlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0VGVtcGxhdGUoKSB7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgdGhpcy5kZWZhdWx0VGVtcGxhdGUgPSB0aGlzLmRhdGFcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmRlZmF1bHRUZW1wbGF0ZSA9IERldGFpbHNVdGlscy5nZXREZWZhdWx0RGV0YWlsc1RlbXBsYXRlKHRoaXMubG9nZ2VkSW5Vc2VyLCB0aGlzLnVzZXIsIHRoaXMuZ3JvdXAsIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZClcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLm1lbWJlcnNMaXN0ZW5lcklkKVxuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgICB0aGlzLmRlZmF1bHRUZW1wbGF0ZSA9IFtdO1xuICAgIHRoaXMub25DbG9zZURldGFpbHMoKVxuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKVxuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKVxuICAgIHRoaXMuc3RhdHVzQ29sb3Iub25saW5lID0gdGhpcy5kZXRhaWxzU3R5bGUub25saW5lU3RhdHVzQ29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKClcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gIH1cblxuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8udXNlckFkZGVkSW4hO1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LnVzZXJBZGRlZEluIVxuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVySm9pbmVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVySm9pbmVkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8uam9pbmVkR3JvdXA7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIHRoaXMuZ3JvdXAgPSBpdGVtPy5raWNrZWRGcm9tITtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgdGhpcy5ncm91cCA9IGl0ZW0/LmtpY2tlZEZyb20hO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KTtcbiAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjT3duZXJzaGlwQ2hhbmdlZC5zdWJzY3JpYmUoKGl0ZW06IElPd25lcnNoaXBDaGFuZ2VkKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwID0gaXRlbT8uZ3JvdXAhO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgdGhpcy5jb25maXJtTGVhdmVHcm91cE1vZGFsID0gZmFsc2U7XG4gICAgICB0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSk7XG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBjaGVja1N0YXR1c1R5cGUgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UgJiYgIW5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eSh0aGlzLnVzZXIpXG4gICAgICByZXR1cm4gdXNlclN0YXR1c1Zpc2liaWxpdHkgPyB0aGlzLnN0YXR1c0NvbG9yW3RoaXMudXNlcj8uZ2V0U3RhdHVzKCldIDogbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbdGhpcy5ncm91cD8uZ2V0VHlwZSgpXVxuICAgIH1cbiAgICBlbHNlIHJldHVybiBudWxsO1xuICB9XG4gIHVwZGF0ZVN1YnRpdGxlKCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5ncm91cD8uZ2V0TWVtYmVyc0NvdW50KCk7XG4gICAgY29uc3QgbWVtYmVyc1RleHQgPSBsb2NhbGl6ZShjb3VudCA+IDEgPyBcIk1FTUJFUlNcIiA6IFwiTUVNQkVSXCIpO1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9ICF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlICYmICF0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSAmJiAhdGhpcy51c2VyLmdldEhhc0Jsb2NrZWRNZSgpO1xuICAgICAgICAgaWYgKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSkge1xuICAgICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IFwiXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLnVzZXIuZ2V0U3RhdHVzKCk7XG4gICAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gc3RhdHVzID8gbG9jYWxpemUoc3RhdHVzLnRvVXBwZXJDYXNlKCkpIDogbG9jYWxpemUoIFwiT0ZGTElORVwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBgJHtjb3VudH0gJHttZW1iZXJzVGV4dH1gO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgZ2V0QnV0dG9uU3R5bGUob3B0aW9uOiBDb21ldENoYXREZXRhaWxzT3B0aW9uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBvcHRpb24/LnRpdGxlRm9udCxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogb3B0aW9uPy50aXRsZUNvbG9yLFxuICAgICAgYmFja2dyb3VuZDogb3B0aW9uPy5iYWNrZ3JvdW5kQ29sb3IgfHwgXCJ0cmFuc3BhcmVudFwiXG4gICAgfVxuICB9XG4gIGNoZWNrR3JvdXBUeXBlKCk6IHN0cmluZyB7XG4gICAgbGV0IGltYWdlOiBzdHJpbmcgPSBcIlwiO1xuICAgIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuZ3JvdXA/LmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnBhc3N3b3JkR3JvdXBJY29uIHx8IHRoaXMucHJvdGVjdGVkR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZTpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpbWFnZSA9IFwiXCJcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGltYWdlXG4gIH1cbiAgdXBkYXRlVXNlclN0YXR1cyh1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFVpZCgpICYmIHRoaXMudXNlci5nZXRVaWQoKSA9PT0gdXNlci5nZXRVaWQoKSkge1xuICAgICAgdGhpcy51c2VyLnNldFN0YXR1cyh1c2VyLmdldFN0YXR1cygpKTtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgIH1cbiAgICAvLyB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UpIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKG9ubGluZVVzZXIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMob2ZmbGluZVVzZXIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgICBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgICBvbGRTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgICBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgaWYgKGNoYW5nZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICBjaGFuZ2VkR3JvdXAuc2V0U2NvcGUobmV3U2NvcGUpO1xuICAgICAgICAgICAgICB0aGlzLmdyb3VwID0gY2hhbmdlZEdyb3VwO1xuICAgICAgICAgICAgICB0aGlzLmdldFRlbXBsYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0U2VjdGlvbkhlYWRlclN0eWxlKHRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRlbXBsYXRlLnRpdGxlRm9udCxcbiAgICAgIHRleHRDb2xvcjogdGVtcGxhdGUudGl0bGVDb2xvclxuICAgIH1cbiAgfVxuICBvbk9wdGlvbkNsaWNrKG9wdGlvbjogQ29tZXRDaGF0RGV0YWlsc09wdGlvbikge1xuICAgIGNvbnN0IHsgb25DbGljaywgaWQgfSA9IG9wdGlvbjtcbiAgICBpZiAob25DbGljaykge1xuICAgICAgb25DbGljayh0aGlzLnVzZXIgPz8gdGhpcy5ncm91cCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN3aXRjaCAoaWQpIHtcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuVXNlck9wdGlvbnMudmlld1Byb2ZpbGU6XG4gICAgICAgIGlmICh0aGlzLnVzZXI/LmdldExpbmsoKSkge1xuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gdGhpcy51c2VyLmdldExpbmsoKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuVXNlck9wdGlvbnMuYmxvY2s6XG4gICAgICAgIHRoaXMuYmxvY2tVc2VyKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Vc2VyT3B0aW9ucy51bmJsb2NrOlxuICAgICAgICB0aGlzLnVuQmxvY2tVc2VyKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMudmlld01lbWJlcnM6XG4gICAgICAgIHRoaXMudmlld01lbWJlcnMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwT3B0aW9ucy5hZGRNZW1iZXJzOlxuICAgICAgICB0aGlzLmFkZE1lbWJlcnMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwT3B0aW9ucy5iYW5uZWRNZW1iZXJzOlxuICAgICAgICB0aGlzLmJhbm5lZE1lbWJlcnMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwT3B0aW9ucy5sZWF2ZTpcbiAgICAgICAgdGhpcy5sZWF2ZUdyb3VwKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE9wdGlvbnMuZGVsZXRlOlxuICAgICAgICB0aGlzLnNob3dEZWxldGVEaWFsb2coKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgb25UcmFuc2ZlckNsaWNrKCkge1xuICAgIGlmICh0aGlzLmdyb3VwLmdldE93bmVyKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93VHJhbnNmZXJEaWFsb2cgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgb25MZWF2ZUNsaWNrKCkge1xuICAgIENvbWV0Q2hhdC5sZWF2ZUdyb3VwKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSAtIDEpXG4gICAgICAgIHRoaXMuZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uQ2xvc2VEZXRhaWxzKClcbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQubmV4dCh7XG4gICAgICAgICAgdXNlckxlZnQ6IHRoaXMubG9nZ2VkSW5Vc2VyISxcbiAgICAgICAgICBsZWZ0R3JvdXA6IHRoaXMuZ3JvdXAsXG4gICAgICAgICAgbWVzc2FnZTogdGhpcy5jcmVhdGVVc2VyTGVmdEFjdGlvbih0aGlzLmxvZ2dlZEluVXNlciEsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQpXG5cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHsgdGhpcy5vbkVycm9yKGVycm9yKSB9XG4gICAgICB9KTtcbiAgfVxuICBjcmVhdGVBY3Rpb25NZXNzYWdlKGFjdGlvbk9uOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGFjdGlvbjogc3RyaW5nKSB7XG4gICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24gPSBuZXcgQ29tZXRDaGF0LkFjdGlvbih0aGlzLmdyb3VwLmdldEd1aWQoKSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uIGFzIGFueSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbihhY3Rpb24pXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25CeSh0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25Gb3IodGhpcy5ncm91cClcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbk9uKGFjdGlvbk9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0UmVjZWl2ZXIodGhpcy5ncm91cClcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRDb252ZXJzYXRpb25JZChcImdyb3VwX1wiICsgdGhpcy5ncm91cC5nZXRHdWlkKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TWVzc2FnZShgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSAke2FjdGlvbn0gJHthY3Rpb25Pbi5nZXROYW1lKCl9YClcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TmV3U2NvcGUoYWN0aW9uT24uZ2V0U2NvcGUoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyVHlwZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKTtcblxuICAgIHJldHVybiBhY3Rpb25NZXNzYWdlXG4gIH1cbiAgY3JlYXRlVXNlckxlZnRBY3Rpb24oYWN0aW9uT246IENvbWV0Q2hhdC5Vc2VyLCBhY3Rpb246IHN0cmluZykge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24odGhpcy5ncm91cC5nZXRHdWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiBhcyBhbnkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uQnkodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uRm9yKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25PbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyVHlwZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKTtcbiAgICBsZXQgbWVzc2FnZTogc3RyaW5nID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVCA/IGAke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9ICR7YWN0aW9ufWAgOiBgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSAke2FjdGlvbn0gJHthY3Rpb25Pbi5nZXROYW1lKCl9YFxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TWVzc2FnZShtZXNzYWdlKVxuICAgIHJldHVybiBhY3Rpb25NZXNzYWdlXG4gIH1cblxuICBvbkNhbmNlbENsaWNrKCkge1xuICAgIHRoaXMuY29uZmlybUxlYXZlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgIHRoaXMuZGVsZXRlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd1RyYW5zZmVyRGlhbG9nID0gZmFsc2U7XG4gIH1cbiAgYmxvY2tVc2VyKCkge1xuICAgIC8vIGJsb2NrIHVzZXJcbiAgICBpZiAodGhpcy51c2VyICYmICF0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSkge1xuICAgICAgQ29tZXRDaGF0LmJsb2NrVXNlcnMoW3RoaXMudXNlci5nZXRVaWQoKV0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnVzZXIuc2V0QmxvY2tlZEJ5TWUodHJ1ZSlcbiAgICAgICAgQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLm5leHQodGhpcy51c2VyKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKCk7XG4gICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUoKTtcbiAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgfVxuICB9XG4gIHVuQmxvY2tVc2VyKCkge1xuICAgIC8vIHVuYmxvY2sgdXNlclxuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkpIHtcbiAgICAgIENvbWV0Q2hhdC51bmJsb2NrVXNlcnMoW3RoaXMudXNlci5nZXRVaWQoKV0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnVzZXIuc2V0QmxvY2tlZEJ5TWUoZmFsc2UpXG4gICAgICAgIENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyVW5ibG9ja2VkLm5leHQodGhpcy51c2VyKVxuICAgICAgICB0aGlzLmdldFRlbXBsYXRlKCk7XG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKTtcbiAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgfVxuICB9XG4gIHZpZXdNZW1iZXJzID0gKCkgPT4ge1xuICAgIHRoaXMub3BlblZpZXdNZW1iZXJzUGFnZSA9ICF0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2U7XG4gICAgdGhpcy5vcGVuQmFubmVkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5BZGRNZW1iZXJzUGFnZSA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICB9XG4gIGFkZE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2UgPSAhdGhpcy5vcGVuQWRkTWVtYmVyc1BhZ2U7XG4gICAgdGhpcy5vcGVuQmFubmVkTWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm9wZW5WaWV3TWVtYmVyc1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgYmFubmVkTWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5BZGRNZW1iZXJzUGFnZSA9IGZhbHNlO1xuICAgIHRoaXMub3BlblZpZXdNZW1iZXJzUGFnZSA9IGZhbHNlO1xuICAgIHRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlID0gIXRoaXMub3BlbkJhbm5lZE1lbWJlcnNQYWdlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICB9XG4gIFxuICBvbkJhY2tGb3JBZGRNZW1iZXJzID0gKCkgPT4ge1xuICAgIHRoaXMuYWRkTWVtYmVycygpO1xuICAgIGlmKHRoaXMuYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uQmFjaykge1xuICAgICAgdGhpcy5hZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25CYWNrKClcbiAgICB9XG4gIH1cblxuICBsZWF2ZUdyb3VwKCkge1xuICAgIGlmICh0aGlzLmdyb3VwLmdldE93bmVyKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aGlzLnNob3dUcmFuc2ZlckRpYWxvZyA9IHRydWU7XG4gICAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnNob3dUcmFuc2ZlckRpYWxvZyA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmNvbmZpcm1MZWF2ZUdyb3VwTW9kYWwgPSB0cnVlXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgc2hvd0RlbGV0ZURpYWxvZygpIHtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwTW9kYWwgPSB0cnVlO1xuICB9XG4gIGRlbGV0ZUdyb3VwKCkge1xuICAgIHRoaXMuZGVsZXRlR3JvdXBNb2RhbCA9IGZhbHNlO1xuICAgIENvbWV0Q2hhdC5kZWxldGVHcm91cCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5kZWxldGVHcm91cE1vZGFsID0gZmFsc2U7XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwRGVsZXRlZC5uZXh0KHRoaXMuZ3JvdXApXG4gICAgICB0aGlzLm9uQ2xvc2VEZXRhaWxzKClcbiAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICB9XG4gICAgICB9KVxuICB9XG4gIG9wZW5UcmFuc2Zlck93bmVyc2hpcCA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5UcmFuc2Zlck93bmVyc2hpcE1vZGFsID0gIXRoaXMub3BlblRyYW5zZmVyT3duZXJzaGlwTW9kYWw7XG4gICAgdGhpcy5jb25maXJtTGVhdmVHcm91cE1vZGFsID0gZmFsc2U7XG4gIH1cbiAgb25DbG9zZURldGFpbHMgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMub25DbG9zZSkge1xuICAgICAgdGhpcy5vbkNsb3NlKClcbiAgICB9XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgaGlkZVVzZXJTdGF0dXMgPSB0aGlzLnVzZXIgPyBuZXcgTWVzc2FnZVV0aWxzKCkuZ2V0VXNlclN0YXR1c1Zpc2liaWxpdHkodGhpcy51c2VyKSA6IHRydWVcblxuICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSAmJiAhaGlkZVVzZXJTdGF0dXMpIHtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IHRoaXMuZGV0YWlsc1N0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogdGhpcy5kZXRhaWxzU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLmRldGFpbHNTdHlsZS5zdWJ0aXRsZVRleHRDb2xvclxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAqL1xuICBnZXRHcm91cEljb24gPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGxldCBzdGF0dXM7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHN0YXR1cyA9IG51bGxcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXR1c1xuICB9XG4gIC8qKlxuKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4qL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbKGdyb3VwPy5nZXRUeXBlKCkgYXMgc3RyaW5nKV07XG4gIH1cbiAgZ2V0VGVtcGxhdGVPcHRpb25zID0gKHRlbXBsYXRlOiBDb21ldENoYXREZXRhaWxzVGVtcGxhdGUpID0+IHtcbiAgICBpZiAodGVtcGxhdGUub3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRlbXBsYXRlLm9wdGlvbnModGhpcy5sb2dnZWRJblVzZXIsIHRoaXMuZ3JvdXAsIHRlbXBsYXRlLmlkIGFzIHN0cmluZywgdGhpcy51c2VyKTtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gW11cbiAgfVxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0RGV0YWlsc1N0eWxlKClcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKClcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKClcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldENvbmZpcm1EaWFsb2dTdHlsZSgpO1xuICAgIHRoaXMuc3RhdHVzQ29sb3IucHJpdmF0ZSA9IHRoaXMuZGV0YWlsc1N0eWxlLnByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kO1xuICAgIHRoaXMuc3RhdHVzQ29sb3Iub25saW5lID0gdGhpcy5kZXRhaWxzU3R5bGUub25saW5lU3RhdHVzQ29sb3I7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wYXNzd29yZCA9IHRoaXMuZGV0YWlsc1N0eWxlLnBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZFxuICB9XG4gIHNldENvbmZpcm1EaWFsb2dTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSBuZXcgQ29uZmlybURpYWxvZ1N0eWxlKHtcbiAgICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIzNTBweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICBsZXQgZGVmYXVsdERlbGV0ZURpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSBuZXcgQ29uZmlybURpYWxvZ1N0eWxlKHtcbiAgICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJkYXJrXCIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBtZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMzUwcHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIlxuICAgIH0pXG4gICAgdGhpcy5sZWF2ZUdyb3VwRGlhbG9nU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5sZWF2ZUdyb3VwRGlhbG9nU3R5bGUgfVxuICAgIHRoaXMudHJhbnNmZXJPd25lcnNoaXBEaWFsb2dTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnRyYW5zZmVyT3duZXJzaGlwRGlhbG9nU3R5bGUgfVxuICAgIHRoaXMuZGVsZXRlR3JvdXBEaWFsb2dTdHlsZSA9IHsgLi4uZGVmYXVsdERlbGV0ZURpYWxvZ1N0eWxlLCAuLi50aGlzLmRlbGV0ZUdyb3VwRGlhbG9nU3R5bGUgfVxuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gICAgfSlcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH1cbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcblxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgfVxuICB9XG4gIHNldERldGFpbHNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEZXRhaWxzU3R5bGUgPSBuZXcgRGV0YWlsc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kOiBcIlJHQigyNDcsIDE2NSwgMClcIixcbiAgICAgIGNsb3NlQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBwYWRkaW5nOiBcIjAgMTAwcHhcIlxuICAgIH0pXG4gICAgdGhpcy5kZXRhaWxzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5kZXRhaWxzU3R5bGUgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IHRoaXMuZGV0YWlsc1N0eWxlLndpZHRoLFxuICAgICAgaGVpZ2h0OiB0aGlzLmRldGFpbHNTdHlsZS5oZWlnaHQsXG4gICAgICBib3JkZXI6IHRoaXMuZGV0YWlsc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5kZXRhaWxzU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5kZXRhaWxzU3R5bGUuYmFja2dyb3VuZCxcbiAgICB9XG4gIH1cbiAgbWFyZ2luU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmc6IHRoaXMuZGV0YWlsc1N0eWxlPy5wYWRkaW5nXG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fd3JhcHBlclwiICpuZ0lmPVwidXNlciB8fCBncm91cFwiXG4gIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19oZWFkZXJcIj5cbiAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cInRpdGxlXCJcbiAgICAgIFtsYWJlbFN0eWxlXT1cImdldFRpdGxlU3R5bGUoKVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICBjbGFzcz1cImNjLWRldGFpbHNfX2Nsb3NlLWJ1dHRvblwiIFtidXR0b25TdHlsZV09XCJjbG9zZUJ1dHRvblN0eWxlXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvbkNsb3NlRGV0YWlscygpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNcIiBbbmdTdHlsZV09XCJtYXJnaW5TdHlsZSgpXCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3Byb2ZpbGVcIiAqbmdJZj1cIiFoaWRlUHJvZmlsZVwiPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gKm5nSWY9XCIhY3VzdG9tUHJvZmlsZVZpZXc7ZWxzZSBsaXN0aXRlbVwiXG4gICAgICAgIFthdmF0YXJOYW1lXT1cInVzZXI/LmdldE5hbWUoKSA/PyB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbYXZhdGFyVVJMXT1cInRoaXMudXNlcj8uZ2V0QXZhdGFyKCkgPz8gdGhpcy5ncm91cD8uZ2V0SWNvbigpXCJcbiAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJjaGVja1N0YXR1c1R5cGUoKVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JJY29uXT1cImNoZWNrR3JvdXBUeXBlKClcIlxuICAgICAgICBbdGl0bGVdPVwidGhpcy51c2VyPy5nZXROYW1lKCkgPz8gdGhpcy5ncm91cD8uZ2V0TmFtZSgpXCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwiZmFsc2VcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIj5cbiAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgPGRpdiAqbmdJZj1cIiFzdWJ0aXRsZVZpZXc7IGVsc2Ugc3VidGl0bGVcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwic3VidGl0bGVUZXh0XCJcbiAgICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3N1YnRpdGxlPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiB1c2VyID8/IGdyb3VwIH1cIj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19zZWN0aW9uLWxpc3RcIlxuICAgICAgKm5nSWY9XCJkZWZhdWx0VGVtcGxhdGUgJiYgZGVmYXVsdFRlbXBsYXRlLmxlbmd0aCA+IDBcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19zZWN0aW9uXCIgKm5nRm9yPVwibGV0IGl0ZW0gb2YgZGVmYXVsdFRlbXBsYXRlXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19zZWN0aW9uLXNlcGFyYXRvclwiICpuZ0lmPVwiaXRlbS50aXRsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwiaXRlbS50aXRsZVwiXG4gICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJnZXRTZWN0aW9uSGVhZGVyU3R5bGUoaXRlbSlcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19vcHRpb25zLXdyYXBwZXJcIlxuICAgICAgICAgICpuZ0lmPVwiZ2V0VGVtcGxhdGVPcHRpb25zKGl0ZW0pXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX29wdGlvbnNcIlxuICAgICAgICAgICAgKm5nRm9yPVwibGV0IG9wdGlvbiBvZiBnZXRUZW1wbGF0ZU9wdGlvbnMoaXRlbSlcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19vcHRpb25cIlxuICAgICAgICAgICAgICAqbmdJZj1cIiFnZXRDdXN0b21PcHRpb25WaWV3KG9wdGlvbik7ZWxzZSBjdXN0b21WaWV3XCJcbiAgICAgICAgICAgICAgKGNsaWNrKT1cIm9uT3B0aW9uQ2xpY2sob3B0aW9uKVwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGV0YWlsc19fb3B0aW9uLXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW3RleHRdPVwib3B0aW9uLnRpdGxlXCJcbiAgICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJnZXRCdXR0b25TdHlsZShvcHRpb24pXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX19vcHRpb24tdGFpbFwiICpuZ0lmPVwib3B0aW9uPy50YWlsXCI+XG4gICAgICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwib3B0aW9uPy50YWlsXCI+PC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRpdmlkZXJcbiAgICAgICAgICAgICAgICBbZGl2aWRlclN0eWxlXT1cImRpdmlkZXJTdHlsZVwiPjwvY29tZXRjaGF0LWRpdmlkZXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjY3VzdG9tVmlldz5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImdldEN1c3RvbU9wdGlvblZpZXcob3B0aW9uKVwiPlxuICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG48bmctdGVtcGxhdGUgI2xpc3RpdGVtPlxuICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiY3VzdG9tUHJvZmlsZVZpZXdcIj5cbiAgPC9uZy1jb250YWluZXI+XG48L25nLXRlbXBsYXRlPlxuPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3ZpZXdcIiAqbmdJZj1cIm9wZW5BZGRNZW1iZXJzUGFnZVwiPlxuICA8Y29tZXRjaGF0LWFkZC1tZW1iZXJzXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy50aXRsZUFsaWdubWVudCFcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5saXN0SXRlbVN0eWxlIVwiXG4gICAgW2FkZE1lbWJlcnNTdHlsZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uYWRkTWVtYmVyc1N0eWxlIVwiXG4gICAgW2F2YXRhclN0eWxlXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5hdmF0YXJTdHlsZSFcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc3RhdHVzSW5kaWNhdG9yU3R5bGUhXCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubG9hZGluZ1N0YXRlVmlldyFcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubG9hZGluZ0ljb25VUkwhXCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmVycm9yU3RhdGVWaWV3XCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25TZWxlY3RdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uU2VsZWN0IVwiXG4gICAgW29uRXJyb3JdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm9uRXJyb3IhXCJcbiAgICBbaGlkZUVycm9yXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5oaWRlRXJyb3IhXCJcbiAgICBbaGlkZVNlYXJjaF09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uaGlkZVNlYXJjaCFcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zZWFyY2hJY29uVVJMIVwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlbGVjdGlvbk1vZGUhXCJcbiAgICBbaGlkZVNlcGFyYXRvcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uaGlkZVNlcGFyYXRvciFcIlxuICAgIFtzaG93QmFja0J1dHRvbl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uc2hvd0JhY2tCdXR0b24hXCJcbiAgICBbc2hvd1NlY3Rpb25IZWFkZXJdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNob3dTZWN0aW9uSGVhZGVyIVwiXG4gICAgW29uQWRkTWVtYmVyc0J1dHRvbkNsaWNrXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vbkFkZE1lbWJlcnNCdXR0b25DbGljayFcIlxuICAgIFt1c2Vyc0NvbmZpZ3VyYXRpb25dPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnVzZXJzQ29uZmlndXJhdGlvblwiXG4gICAgW2JhY2tCdXR0b25JY29uVVJMXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5iYWNrQnV0dG9uSWNvblVSTCFcIlxuICAgIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlY3Rpb25IZWFkZXJGaWVsZCFcIlxuICAgIFtjbG9zZUJ1dHRvbkljb25VUkxdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LmNsb3NlQnV0dG9uSWNvblVSTCFcIlxuICAgIFtvcHRpb25zXT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5vcHRpb25zIVwiXG4gICAgW21lbnVdPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lm1lbnVcIlxuICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8uZGlzYWJsZVVzZXJzUHJlc2VuY2UhXCJcbiAgICBbc3VidGl0bGVWaWV3XT1cImFkZE1lbWJlcnNDb25maWd1cmF0aW9uPy5zdWJ0aXRsZVZpZXdcIiBbZ3JvdXBdPVwiZ3JvdXBcIlxuICAgIFtzZWxlY3Rpb25Nb2RlXT1cInNlbGVjdGlvbm1vZGVFbnVtXCJcbiAgICBbb25DbG9zZV09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8ub25DbG9zZSB8fCBvbkNsb3NlRGV0YWlsc1wiXG4gICAgW29uQmFja109XCJvbkJhY2tGb3JBZGRNZW1iZXJzXCJcbiAgICBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udXNlcnNSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFtzZWFyY2hSZXF1ZXN0QnVpbGRlcl09XCJhZGRNZW1iZXJzQ29uZmlndXJhdGlvbj8udXNlcnNSZXF1ZXN0QnVpbGRlciFcIlxuICAgIFtsaXN0SXRlbVZpZXddPVwiYWRkTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtVmlld1wiPlxuICA8L2NvbWV0Y2hhdC1hZGQtbWVtYmVycz5cbjwvZGl2PlxuPGRpdiBjbGFzcz1cImNjLWRldGFpbHNfX3ZpZXdcIiAqbmdJZj1cIm9wZW5CYW5uZWRNZW1iZXJzUGFnZVwiPlxuICA8Y29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzXG4gICAgW2xpc3RJdGVtVmlld109XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbj8ubGlzdEl0ZW1WaWV3XCJcbiAgICBbYmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uPy5iYW5uZWRNZW1iZXJzUmVxdWVzdEJ1aWxkZXIhXCJcbiAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaFJlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnRpdGxlQWxpZ25tZW50XCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbYmFubmVkTWVtYmVyc1N0eWxlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmJhbm5lZE1lbWJlcnNTdHlsZVwiXG4gICAgW2F2YXRhclN0eWxlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uc3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmVycm9yU3RhdGVWaWV3XCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvblNlbGVjdF09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdFwiXG4gICAgW29uRXJyb3JdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW2hpZGVFcnJvcl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5oaWRlRXJyb3JcIlxuICAgIFtoaWRlU2VhcmNoXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZWFyY2hcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnNlYXJjaEljb25VUkxcIlxuICAgIFtzZWxlY3Rpb25Nb2RlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnNlbGVjdGlvbk1vZGVcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgIFtzaG93QmFja0J1dHRvbl09XCJiYW5uZWRNZW1iZXJzQ29uZmlndXJhdGlvbi5zaG93QmFja0J1dHRvblwiXG4gICAgW2JhY2tCdXR0b25JY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tCdXR0b25JY29uVVJMXCJcbiAgICBbY2xvc2VCdXR0b25JY29uVVJMXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgW29wdGlvbnNdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ub3B0aW9uc1wiXG4gICAgW21lbnVdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLmRpc2FibGVVc2Vyc1ByZXNlbmNlXCJcbiAgICBbc3VidGl0bGVWaWV3XT1cImJhbm5lZE1lbWJlcnNDb25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwib25DbG9zZURldGFpbHNcIlxuICAgIFtvbkJhY2tdPVwiYmFubmVkTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25CYWNrIHx8IGJhbm5lZE1lbWJlcnNcIj5cbiAgPC9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnM+XG48L2Rpdj5cbjxkaXYgY2xhc3M9XCJjYy1kZXRhaWxzX192aWV3XCIgKm5nSWY9XCJvcGVuVmlld01lbWJlcnNQYWdlXCI+XG4gIDxjb21ldGNoYXQtZ3JvdXAtbWVtYmVyc1xuICAgIFtsaXN0SXRlbVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbj8ubGlzdEl0ZW1WaWV3IVwiXG4gICAgW2dyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24/Lmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24/LnNlYXJjaFJlcXVlc3RCdWlsZGVyIVwiXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2dyb3VwTWVtYmVyc1N0eWxlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZ3JvdXBNZW1iZXJzU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25TZWxlY3RdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdFwiXG4gICAgW29uRXJyb3JdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbaGlkZUVycm9yXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZUVycm9yXCJcbiAgICBbaGlkZVNlYXJjaF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmhpZGVTZWFyY2hcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zZWxlY3Rpb25Nb2RlXCJcbiAgICBbYmFja2Ryb3BTdHlsZV09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tkcm9wU3R5bGVcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uaGlkZVNlcGFyYXRvclwiXG4gICAgW3Nob3dCYWNrQnV0dG9uXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uc2hvd0JhY2tCdXR0b25cIlxuICAgIFtiYWNrQnV0dG9uSWNvblVSTF09XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLmJhY2tCdXR0b25JY29uVVJMXCJcbiAgICBbY2xvc2VCdXR0b25JY29uVVJMXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICBbb3B0aW9uc109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgIFttZW51XT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ubWVudVwiXG4gICAgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIlxuICAgIFtncm91cFNjb3BlU3R5bGVdPVwiZ3JvdXBNZW1iZXJzQ29uZmlndXJhdGlvbi5ncm91cFNjb3BlU3R5bGVcIlxuICAgIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwiIGdyb3VwTWVtYmVyc0NvbmZpZ3VyYXRpb24ub25DbG9zZSB8fCBvbkNsb3NlRGV0YWlsc1wiXG4gICAgW29uQmFja109XCJncm91cE1lbWJlcnNDb25maWd1cmF0aW9uLm9uQmFjayB8fCB2aWV3TWVtYmVyc1wiPlxuICA8L2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzPlxuPC9kaXY+XG5cbjxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiXG4gICpuZ0lmPVwiY29uZmlybUxlYXZlR3JvdXBNb2RhbFwiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiIFttZXNzYWdlVGV4dF09XCJsZWF2ZUdyb3VwRGlhbG9nTWVzc2FnZVwiXG4gICAgW2NhbmNlbEJ1dHRvblRleHRdPVwibGVhdmVHcm91cENhbmNlbEJ1dHRvblRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJsZWF2ZUdyb3VwQ29uZmlybUJ1dHRvblRleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25MZWF2ZUNsaWNrKClcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImxlYXZlR3JvdXBEaWFsb2dTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCIgKm5nSWY9XCJzaG93VHJhbnNmZXJEaWFsb2dcIj5cbiAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiJydcIlxuICAgIFttZXNzYWdlVGV4dF09XCJ0cmFuc2Zlck93bmVyc2hpcERpYWxvZ01lc3NhZ2VcIlxuICAgIFtjYW5jZWxCdXR0b25UZXh0XT1cInRyYW5zZmVyT3duZXJzaGlwQ2FuY2VsQnV0dG9uVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlybUJ1dHRvblRleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25UcmFuc2ZlckNsaWNrKClcIlxuICAgIChjYy1jYW5jZWwtY2xpY2tlZCk9XCJvbkNhbmNlbENsaWNrKClcIlxuICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBEaWFsb2dTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCJcbiAgKm5nSWY9XCJvcGVuVHJhbnNmZXJPd25lcnNoaXBNb2RhbFwiPlxuICA8Y29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcFxuICAgIFtncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcl09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24/Lmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICBbdHJhbnNmZXJPd25lcnNoaXBTdHlsZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24udHJhbnNmZXJPd25lcnNoaXBTdHlsZVwiXG4gICAgW29uVHJhbnNmZXJPd25lcnNoaXBdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uVHJhbnNmZXJPd25lcnNoaXBcIlxuICAgIFt0aXRsZUFsaWdubWVudF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24udGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW29uRXJyb3JdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtoaWRlU2VhcmNoXT1cInRyYW5zZmVyT3duZXJzaGlwQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICBbc2VhcmNoSWNvblVSTF09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgIFtjbG9zZUJ1dHRvbkljb25VUkxdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLmNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgW29wdGlvbnNdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ0cmFuc2Zlck93bmVyc2hpcENvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiIFtncm91cF09XCJncm91cFwiXG4gICAgW29uQ2xvc2VdPVwidHJhbnNmZXJPd25lcnNoaXBDb25maWd1cmF0aW9uLm9uQ2xvc2UgfHwgb3BlblRyYW5zZmVyT3duZXJzaGlwXCI+XG4gIDwvY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcD5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCIgKm5nSWY9XCJkZWxldGVHcm91cE1vZGFsXCI+XG4gIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cIicnXCJcbiAgICBbbWVzc2FnZVRleHRdPVwiZGVsZXRlR3JvdXBEaWFsb2dNZXNzYWdlXCJcbiAgICBbY2FuY2VsQnV0dG9uVGV4dF09XCJkZWxldGVHcm91cENhbmNlbEJ1dHRvblRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJkZWxldGVHcm91cENvbmZpcm1CdXR0b25UZXh0XCJcbiAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cImRlbGV0ZUdyb3VwKClcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImRlbGV0ZUdyb3VwRGlhbG9nU3R5bGVcIj5cbiAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==