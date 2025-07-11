import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CometChatGroupEvents, CometChatMessageEvents, CometChatTheme, CometChatUIKitConstants, CometChatUserEvents, fontHelper, localize } from '@cometchat/uikit-resources';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatException } from '../../Shared/Utils/ComeChatException';
import { MessageHeaderStyle } from '@cometchat/uikit-shared';
import { MessageUtils } from '../../Shared/Utils/MessageUtils';
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "@angular/common";
/**
*
* CometChatMessageHeader is a used to render listitem component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatMessageHeaderComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.avatarStyle = {
            borderRadius: "16px",
            width: "28px",
            height: "28px",
            border: "none",
        };
        this.statusIndicatorStyle = {
            borderRadius: "16px",
            width: "10px",
            height: "10px",
            border: "none",
        };
        this.messageHeaderStyle = {
            width: "100%",
            height: "100%",
        };
        this.listItemStyle = {
            width: "",
            height: "100%",
            border: "none",
            borderRadius: "2px",
            separatorColor: "",
            activeBackground: "transparent",
            hoverBackground: "transparent"
        };
        this.disableUsersPresence = false;
        this.disableTyping = false;
        /**
       * @deprecated
       *
       * This property is deprecated as of version 4.3.7 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
       */
        this.protectedGroupIcon = "assets/Locked.svg";
        this.passwordGroupIcon = undefined;
        this.privateGroupIcon = "assets/Private.svg";
        this.backButtonIconURL = "assets/backbutton.svg";
        this.hideBackButton = false;
        this.onError = (error) => {
            console.log(error);
        };
        this.onBack = () => { };
        this.groupsListenerId = "groupsList_" + new Date().getTime();
        this.userListenerId = "userlist_" + new Date().getTime();
        this.subtitleText = "";
        this.isTyping = false;
        this.theme = new CometChatTheme({});
        /**
         * @param  {CometChat.User} user
         */
        this.getStatusIndicatorStyle = (user) => {
            let userStatusVisibility = new MessageUtils().getUserStatusVisibility(user) || this.disableUsersPresence;
            if (!userStatusVisibility) {
                return (this.statusIndicatorStyle);
            }
            return null;
        };
        this.statusColor = {
            online: "#00f300",
            private: "#00f300",
            password: "#F7A500",
            public: ""
        };
        this.backButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "none",
            background: "transparent",
            buttonIconTint: ""
        };
        this.checkStatusType = () => {
            if (this.user) {
                let userStatusVisibility = new MessageUtils().getUserStatusVisibility(this.user) || this.disableUsersPresence;
                return userStatusVisibility ? null : this.statusColor[this.user?.getStatus()];
            }
            else if (this.group) {
                return this.statusColor[this.group?.getType()];
            }
            else
                return;
        };
        this.handleGroupEvent = (group, user, hasJoined, newScope) => {
            if (this.group.getGuid() !== group.getGuid()) {
                return;
            }
            if (user.getUid() === this.loggedInUser?.getUid()) {
                group.setHasJoined(hasJoined);
                if (newScope) {
                    group.setScope(newScope);
                }
            }
            this.group = group;
            this.ref.detectChanges();
            this.updateSubtitle();
        };
        this.setTypingIndicatorText = (typing) => {
            const sender = typing.getSender();
            const receiverId = typing.getReceiverId();
            const loggedInUser = this.loggedInUser;
            if (this.user && sender.getUid() === this.user?.getUid() && loggedInUser?.getUid() === receiverId) {
                const isBlocked = this.user.getBlockedByMe() || this.user.getHasBlockedMe();
                if (isBlocked) {
                    return;
                }
                this.subtitleText = localize("IS_TYPING");
                this.ref.detectChanges();
            }
            else if (this.group && this.group.getGuid() === receiverId) {
                this.subtitleText = `${sender.getName()} ${localize("IS_TYPING")}`;
                this.ref.detectChanges();
            }
        };
        this.headerStyle = () => {
            const headerStyle = this.getHeadersStyle();
            return {
                width: headerStyle.width,
                height: headerStyle.height,
                border: headerStyle.border,
                borderRadius: headerStyle.borderRadius,
                background: headerStyle.background,
            };
        };
        this.subtitleStyle = () => {
            const headerStyle = this.getHeadersStyle();
            if (this.user && this.user.getStatus() == CometChatUIKitConstants.userStatusType.online) {
                return {
                    textFont: headerStyle.subtitleTextFont,
                    textColor: this.themeService.theme.palette.getPrimary()
                };
            }
            else {
                return {
                    textFont: this.isTyping ? headerStyle.typingIndicatorTextFont : headerStyle.subtitleTextFont,
                    textColor: this.isTyping ? headerStyle.typingIndicatorTextColor : headerStyle.subtitleTextColor
                };
            }
        };
    }
    ngOnChanges(changes) {
        if (changes["user"] || changes["group"]) {
            this.removeListener();
            if (!this.loggedInUser) {
                CometChat.getLoggedinUser().then((user) => {
                    this.loggedInUser = user;
                    this.attachListeners();
                    this.updateSubtitle();
                }).catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            }
            else {
                this.attachListeners();
                this.updateSubtitle();
            }
        }
    }
    ngOnInit() {
        this.setListItemStyle();
        this.setAvatarStyle();
        this.setStatusStyle();
        this.subscribeToEvents();
        this.backButtonStyle.buttonIconTint = this.messageHeaderStyle?.backButtonIconTint || this.themeService.theme.palette.getPrimary();
        this.statusColor.online = this.messageHeaderStyle.onlineStatusColor ?? this.themeService.theme.palette.getSuccess();
    }
    // subscribe to global events
    subscribeToEvents() {
        this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item) => {
            if (this.group && this.group.getGuid() == item?.userAddedIn.getGuid()) {
                this.group == item?.userAddedIn;
                this.ref.detectChanges();
                this.updateSubtitle();
            }
        });
        this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
            if (this.group && this.group.getGuid() == item?.kickedFrom.getGuid()) {
                this.group == item?.kickedFrom;
                this.ref.detectChanges();
                this.updateSubtitle();
            }
        });
        this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item) => {
            if (this.group && this.group.getGuid() == item?.joinedGroup.getGuid()) {
                this.group == item?.joinedGroup;
                this.ref.detectChanges();
                this.updateSubtitle();
            }
        });
        this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item) => {
            if (this.group && this.group.getGuid() == item?.kickedFrom.getGuid()) {
                this.group == item?.kickedFrom;
                this.ref.detectChanges();
                this.updateSubtitle();
            }
        });
        this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item) => {
            if (this.group && this.group.getGuid() == item?.group.getGuid()) {
                this.group == item?.group;
                this.ref.detectChanges();
                this.updateSubtitle();
            }
        });
        this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item) => {
            if (this.group && this.group.getGuid() == item?.leftGroup.getGuid() && this.loggedInUser?.getUid() == item?.userLeft?.getUid()) {
                this.group == item?.leftGroup;
                this.ref.detectChanges();
                this.updateSubtitle();
            }
        });
    }
    // unsubscribe to subscribed events.
    unsubscribeToEvents() {
        this.ccGroupMemberAdded?.unsubscribe();
        this.ccGroupMemberBanned?.unsubscribe();
        this.ccGroupMemberJoined?.unsubscribe();
        this.ccGroupMemberKicked?.unsubscribe();
        this.ccOwnershipChanged?.unsubscribe();
        this.ccUserBlocked?.unsubscribe();
        this.ccUserUnblocked?.unsubscribe();
        this.ccGroupLeft?.unsubscribe();
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
            separatorColor: "",
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
        if (!this.disableUsersPresence) {
            this.statusIndicatorStyle = { ...defaultStyle, ...this.statusIndicatorStyle };
        }
        else {
            this.statusIndicatorStyle = {};
        }
    }
    getHeadersStyle() {
        const defaultValues = this.messageHeaderStyle;
        let defaultStyle = new MessageHeaderStyle({
            background: defaultValues.background || this.themeService.theme.palette.getBackground(),
            border: defaultValues.border || `none`,
            onlineStatusColor: defaultValues.onlineStatusColor || this.themeService.theme.palette.getSuccess(),
            privateGroupIconBackground: defaultValues.privateGroupIconBackground || this.themeService.theme.palette.getSuccess(),
            passwordGroupIconBackground: defaultValues.passwordGroupIconBackground || "RGB(247, 165, 0)",
            backButtonIconTint: defaultValues.backButtonIconTint || this.themeService.theme.palette.getPrimary(),
            subtitleTextColor: defaultValues.subtitleTextColor || this.themeService.theme.palette.getAccent600(),
            subtitleTextFont: defaultValues.subtitleTextFont || fontHelper(this.themeService.theme.typography.subtitle2),
            typingIndicatorTextColor: defaultValues.typingIndicatorTextColor || this.themeService.theme.palette.getPrimary(),
            typingIndicatorTextFont: defaultValues.typingIndicatorTextFont || fontHelper(this.themeService.theme.typography.subtitle1),
            height: defaultValues.height || "45px",
            width: defaultValues.width || "100%",
        });
        return defaultStyle;
    }
    onBackClicked() {
        if (this.onBack) {
            this.onBack();
        }
    }
    updateSubtitle() {
        const count = this.group?.getMembersCount();
        const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
        if (this.user) {
            const userStatusVisibility = this.user.getBlockedByMe() || this.user.getHasBlockedMe() || this.disableUsersPresence;
            if (userStatusVisibility) {
                this.subtitleText = "";
            }
            else {
                const status = this.user.getStatus();
                this.subtitleText = status ? localize(status.toUpperCase()) : localize("OFFLINE");
            }
            this.ref.detectChanges();
        }
        else {
            this.subtitleText = `${count} ${membersText}`;
            this.ref.detectChanges();
        }
    }
    getSubtitleView() {
        return this.subtitleView(this.user || this.group);
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
            if (this.user) {
                this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((item) => {
                    if (item.getUid() == this.user.getUid())
                        this.updateUserStatus(item);
                });
                this.ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe((item) => {
                    if (item.getUid() == this.user.getUid())
                        this.updateUserStatus(item);
                });
            }
            if (!this.disableTyping) {
                this.onTypingStarted = CometChatMessageEvents.onTypingStarted.subscribe((typingIndicator) => {
                    this.isTyping = true;
                    this.setTypingIndicatorText(typingIndicator);
                });
                this.onTypingEnded = CometChatMessageEvents.onTypingEnded.subscribe((typingIndicator) => {
                    this.isTyping = false;
                    this.updateSubtitle();
                });
            }
            CometChat.addGroupListener(this.groupsListenerId, new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    this.handleGroupEvent(changedGroup, changedUser, true, newScope);
                },
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    this.handleGroupEvent(kickedFrom, kickedUser, false);
                },
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                    this.handleGroupEvent(userAddedIn, userAdded, true);
                },
                onGroupMemberLeft: (message, leavingUser, group) => {
                    this.handleGroupEvent(group, leavingUser, false);
                },
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                    this.handleGroupEvent(joinedGroup, joinedUser, true);
                }
            }));
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    removeListener() {
        CometChat.removeUserListener(this.userListenerId);
        this.onTypingStarted?.unsubscribe();
        this.onTypingEnded?.unsubscribe();
    }
    ngOnDestroy() {
        this.removeListener();
        this.unsubscribeToEvents();
    }
}
CometChatMessageHeaderComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageHeaderComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageHeaderComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageHeaderComponent, selector: "cometchat-message-header", inputs: { avatarStyle: "avatarStyle", statusIndicatorStyle: "statusIndicatorStyle", messageHeaderStyle: "messageHeaderStyle", listItemStyle: "listItemStyle", subtitleView: "subtitleView", disableUsersPresence: "disableUsersPresence", disableTyping: "disableTyping", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", privateGroupIcon: "privateGroupIcon", menu: "menu", user: "user", group: "group", backButtonIconURL: "backButtonIconURL", hideBackButton: "hideBackButton", listItemView: "listItemView", onError: "onError", onBack: "onBack" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-header__wrapper\" [ngStyle]=\"headerStyle()\">\n  <div class=\"cc-message-header\">\n    <div class=\"cc-message-header__back-button\" *ngIf=\"!hideBackButton\">\n      <cometchat-button [iconURL]=\"backButtonIconURL\"\n        [buttonStyle]=\"backButtonStyle\"\n        (cc-button-clicked)=\"onBackClicked()\"></cometchat-button>\n    </div>\n    <div class=\"cc-message-header__listitem\">\n      <cometchat-list-item *ngIf=\"!listItemView;else listitem\"\n        [avatarName]=\"user?.getName() || this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() || this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() || this.group?.getName()\"\n        [hideSeparator]=\"true\" [statusIndicatorStyle]=\"getStatusIndicatorStyle(user)\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n\n            </ng-container>\n          </ng-template>\n\n        </div>\n      </cometchat-list-item>\n      <ng-template #listitem>\n        <ng-container *ngTemplateOutlet=\"listItemView\">\n\n        </ng-container>\n      </ng-template>\n    </div>\n  </div>\n  <div class=\"cc-message-header__menu\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu;context:{ $implicit: user ?? group }\">\n\n    </ng-container>\n  </div>\n</div>\n", styles: [".cc-message-header__wrapper{display:flex;align-items:center;justify-content:space-between;flex-direction:row;padding:8px;box-sizing:border-box}.cc-message-header__back-button{margin-right:8px}.cc-message-header{display:flex;align-items:center;justify-content:flex-start;height:100%;width:100%}.cc-message-header__listitem{height:100%;width:100%;display:flex;align-items:center;justify-content:flex-start}.cc-message-header__menu{width:-moz-fit-content;width:fit-content;display:flex;align-items:center;justify-content:flex-end;padding:12px}cometchat-list-item{width:100%}\n"], directives: [{ type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageHeaderComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cometchat-message-header', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-header__wrapper\" [ngStyle]=\"headerStyle()\">\n  <div class=\"cc-message-header\">\n    <div class=\"cc-message-header__back-button\" *ngIf=\"!hideBackButton\">\n      <cometchat-button [iconURL]=\"backButtonIconURL\"\n        [buttonStyle]=\"backButtonStyle\"\n        (cc-button-clicked)=\"onBackClicked()\"></cometchat-button>\n    </div>\n    <div class=\"cc-message-header__listitem\">\n      <cometchat-list-item *ngIf=\"!listItemView;else listitem\"\n        [avatarName]=\"user?.getName() || this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() || this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() || this.group?.getName()\"\n        [hideSeparator]=\"true\" [statusIndicatorStyle]=\"getStatusIndicatorStyle(user)\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n\n            </ng-container>\n          </ng-template>\n\n        </div>\n      </cometchat-list-item>\n      <ng-template #listitem>\n        <ng-container *ngTemplateOutlet=\"listItemView\">\n\n        </ng-container>\n      </ng-template>\n    </div>\n  </div>\n  <div class=\"cc-message-header__menu\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu;context:{ $implicit: user ?? group }\">\n\n    </ng-container>\n  </div>\n</div>\n", styles: [".cc-message-header__wrapper{display:flex;align-items:center;justify-content:space-between;flex-direction:row;padding:8px;box-sizing:border-box}.cc-message-header__back-button{margin-right:8px}.cc-message-header{display:flex;align-items:center;justify-content:flex-start;height:100%;width:100%}.cc-message-header__listitem{height:100%;width:100%;display:flex;align-items:center;justify-content:flex-start}.cc-message-header__menu{width:-moz-fit-content;width:fit-content;display:flex;align-items:center;justify-content:flex-end;padding:12px}cometchat-list-item{width:100%}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { avatarStyle: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], messageHeaderStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], disableTyping: [{
                type: Input
            }], protectedGroupIcon: [{
                type: Input
            }], passwordGroupIcon: [{
                type: Input
            }], privateGroupIcon: [{
                type: Input
            }], menu: [{
                type: Input
            }], user: [{
                type: Input
            }], group: [{
                type: Input
            }], backButtonIconURL: [{
                type: Input
            }], hideBackButton: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], onError: [{
                type: Input
            }], onBack: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQWEsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDakYsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFrRyxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFOVEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBRTFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTdELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQzs7OztBQUUvRDs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTywrQkFBK0I7SUFnRTFDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxH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SUFDSCxDQUFDO0lBQ0QsY0FBYztRQUNaLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFDRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO0lBQzVCLENBQUM7OzZIQXpZVSwrQkFBK0I7aUhBQS9CLCtCQUErQixtcEJDMUI1QywyeERBOENBOzRGRHBCYSwrQkFBK0I7a0JBTjNDLFNBQVM7K0JBQ0UsMEJBQTBCLG1CQUduQix1QkFBdUIsQ0FBQyxNQUFNOzRJQUd0QyxXQUFXO3NCQUFuQixLQUFLO2dCQU9HLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFNRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBSUcsYUFBYTtzQkFBckIsS0FBSztnQkFTRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUdHLE1BQU07c0JBQWQsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF2YXRhclN0eWxlLCBCYXNlU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIElucHV0LCBPbkNoYW5nZXMsIE9uSW5pdCwgU2ltcGxlQ2hhbmdlcywgVGVtcGxhdGVSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRNZXNzYWdlRXZlbnRzLCBDb21ldENoYXRUaGVtZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIENvbWV0Q2hhdFVzZXJFdmVudHMsIElHcm91cExlZnQsIElHcm91cE1lbWJlckFkZGVkLCBJR3JvdXBNZW1iZXJKb2luZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgSU93bmVyc2hpcENoYW5nZWQsIGZvbnRIZWxwZXIsIGxvY2FsaXplIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uJztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWVzc2FnZUhlYWRlclN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tICcuLi8uLi9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzJztcblxuLyoqXG4qXG4qIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXIgaXMgYSB1c2VkIHRvIHJlbmRlciBsaXN0aXRlbSBjb21wb25lbnQuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjb21ldGNoYXQtbWVzc2FnZS1oZWFkZXInLFxuICB0ZW1wbGF0ZVVybDogJy4vY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5zY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG5cbiAgfVxuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfVxuICBASW5wdXQoKSBtZXNzYWdlSGVhZGVyU3R5bGU6IE1lc3NhZ2VIZWFkZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgfVxuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMnB4XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwiXCIsXG4gICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gIH1cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3OiBhbnk7XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqXG4gKiBAZGVwcmVjYXRlZFxuICpcbiAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgQElucHV0KCkgbWVudTogYW55O1xuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgaGlkZUJhY2tCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25CYWNrOiAoKSA9PiB2b2lkID0gKCkgPT4geyB9XG4gIHB1YmxpYyBncm91cHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImdyb3Vwc0xpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgdXNlckxpc3RlbmVySWQgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBzdWJ0aXRsZVRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgcHVibGljIGlzVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIHRoZW1lOiBDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSlcbiAgY2NHcm91cE1lbWJlckFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTGVmdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ1N0YXJ0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlckJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlclVuYmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKVxuICAgICAgaWYgKCF0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuXG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpXG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYmFja0J1dHRvblN0eWxlLmJ1dHRvbkljb25UaW50ID0gdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGU/LmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlLm9ubGluZVN0YXR1c0NvbG9yID8/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG5cbiAgfVxuICAvLyBzdWJzY3JpYmUgdG8gZ2xvYmFsIGV2ZW50c1xuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PSBpdGVtPy51c2VyQWRkZWRJbiEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8udXNlckFkZGVkSW47XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJKb2luZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJKb2luZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmpvaW5lZEdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5qb2luZWRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uZ3JvdXAhLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/Lmdyb3VwO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ubGVmdEdyb3VwIS5nZXRHdWlkKCkgJiYgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IGl0ZW0/LnVzZXJMZWZ0Py5nZXRVaWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmxlZnRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgLy8gdW5zdWJzY3JpYmUgdG8gc3Vic2NyaWJlZCBldmVudHMuXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyVW5ibG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiBcIlwiLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuXG4gICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlKXtcbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgfVxuICAgIH1lbHNlIHtcbiAgICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7fTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eSh1c2VyKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgIGlmKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSl7XG4gICAgICByZXR1cm4oXG4gICAgICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGVcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZ2V0SGVhZGVyc1N0eWxlKCk6IE1lc3NhZ2VIZWFkZXJTdHlsZSB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlO1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IE1lc3NhZ2VIZWFkZXJTdHlsZSA9IG5ldyBNZXNzYWdlSGVhZGVyU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogZGVmYXVsdFZhbHVlcy5iYWNrZ3JvdW5kIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBkZWZhdWx0VmFsdWVzLmJvcmRlciB8fCBgbm9uZWAsXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogZGVmYXVsdFZhbHVlcy5vbmxpbmVTdGF0dXNDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kOiBkZWZhdWx0VmFsdWVzLnByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kOiBkZWZhdWx0VmFsdWVzLnBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZCB8fCBcIlJHQigyNDcsIDE2NSwgMClcIixcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDogZGVmYXVsdFZhbHVlcy5iYWNrQnV0dG9uSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogZGVmYXVsdFZhbHVlcy5zdWJ0aXRsZVRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZGVmYXVsdFZhbHVlcy5zdWJ0aXRsZVRleHRGb250IHx8IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdHlwaW5nSW5kaWNhdG9yVGV4dENvbG9yOiBkZWZhdWx0VmFsdWVzLnR5cGluZ0luZGljYXRvclRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHR5cGluZ0luZGljYXRvclRleHRGb250OiBkZWZhdWx0VmFsdWVzLnR5cGluZ0luZGljYXRvclRleHRGb250IHx8IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgaGVpZ2h0OiBkZWZhdWx0VmFsdWVzLmhlaWdodCB8fCBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBkZWZhdWx0VmFsdWVzLndpZHRoIHx8IFwiMTAwJVwiLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmF1bHRTdHlsZTtcbiAgfVxuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBvbmxpbmU6IFwiIzAwZjMwMFwiLFxuICAgIHByaXZhdGU6IFwiIzAwZjMwMFwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICBiYWNrQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcIlwiXG4gIH1cbiAgY2hlY2tTdGF0dXNUeXBlID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eSh0aGlzLnVzZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG4gICAgICByZXR1cm4gdXNlclN0YXR1c1Zpc2liaWxpdHkgPyBudWxsIDogdGhpcy5zdGF0dXNDb2xvclt0aGlzLnVzZXI/LmdldFN0YXR1cygpXTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbdGhpcy5ncm91cD8uZ2V0VHlwZSgpXTtcbiAgICB9XG4gICAgZWxzZSByZXR1cm47XG4gIH1cbiAgb25CYWNrQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkJhY2spIHtcbiAgICAgIHRoaXMub25CYWNrKClcbiAgICB9XG4gIH1cbiAgdXBkYXRlU3VidGl0bGUoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLmdyb3VwPy5nZXRNZW1iZXJzQ291bnQoKTtcbiAgICBjb25zdCBtZW1iZXJzVGV4dCA9IGxvY2FsaXplKGNvdW50ID4gMSA/IFwiTUVNQkVSU1wiIDogXCJNRU1CRVJcIik7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgY29uc3QgdXNlclN0YXR1c1Zpc2liaWxpdHkgPSB0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSB8fCB0aGlzLnVzZXIuZ2V0SGFzQmxvY2tlZE1lKCkgfHwgdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZTtcbiAgICAgIGlmICh1c2VyU3RhdHVzVmlzaWJpbGl0eSkge1xuICAgICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IFwiXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLnVzZXIuZ2V0U3RhdHVzKCk7XG4gICAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gc3RhdHVzID8gbG9jYWxpemUoc3RhdHVzLnRvVXBwZXJDYXNlKCkpIDogbG9jYWxpemUoIFwiT0ZGTElORVwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IGAke2NvdW50fSAke21lbWJlcnNUZXh0fWA7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuXG4gIH1cbiAgZ2V0U3VidGl0bGVWaWV3KCkge1xuICAgIHJldHVybiB0aGlzLnN1YnRpdGxlVmlldyh0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCk7XG4gIH1cbiAgY2hlY2tHcm91cFR5cGUoKTogc3RyaW5nIHtcbiAgICBsZXQgaW1hZ2U6IHN0cmluZyA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHN3aXRjaCAodGhpcy5ncm91cD8uZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucGFzc3dvcmRHcm91cEljb24gfHwgdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGltYWdlID0gXCJcIlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW1hZ2VcbiAgfVxuICB1cGRhdGVVc2VyU3RhdHVzKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgaWYgKHRoaXMudXNlciAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgJiYgdGhpcy51c2VyLmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpKSB7XG4gICAgICB0aGlzLnVzZXIuc2V0U3RhdHVzKHVzZXIuZ2V0U3RhdHVzKCkpO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgfVxuICAgIC8vIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIGhhbmRsZUdyb3VwRXZlbnQgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCwgdXNlcjogQ29tZXRDaGF0LlVzZXIsIGhhc0pvaW5lZDogYm9vbGVhbiwgbmV3U2NvcGU/OiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSkgPT4ge1xuICAgIGlmICh0aGlzLmdyb3VwLmdldEd1aWQoKSAhPT0gZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh1c2VyLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgIGdyb3VwLnNldEhhc0pvaW5lZChoYXNKb2luZWQpO1xuICAgICAgaWYgKG5ld1Njb3BlKSB7XG4gICAgICAgIGdyb3VwLnNldFNjb3BlKG5ld1Njb3BlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ncm91cCA9IGdyb3VwO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKCk7XG4gIH07XG4gIFxuXG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICB0cnkge1xuICAgICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgICAgdGhpcy51c2VyTGlzdGVuZXJJZCxcbiAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMob25saW5lVXNlcik7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMob2ZmbGluZVVzZXIpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICB0aGlzLmNjVXNlckJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlckJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0uZ2V0VWlkKCkgPT0gdGhpcy51c2VyLmdldFVpZCgpKVxuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMoaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICB0aGlzLmNjVXNlclVuYmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyVW5ibG9ja2VkLnN1YnNjcmliZShcbiAgICAgICAgICAoaXRlbTogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChpdGVtLmdldFVpZCgpID09IHRoaXMudXNlci5nZXRVaWQoKSlcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKGl0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmcpIHtcbiAgICAgICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVHlwaW5nU3RhcnRlZC5zdWJzY3JpYmUoKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIHRoaXMuaXNUeXBpbmcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuc2V0VHlwaW5nSW5kaWNhdG9yVGV4dCh0eXBpbmdJbmRpY2F0b3IpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm9uVHlwaW5nRW5kZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVHlwaW5nRW5kZWQuc3Vic2NyaWJlKCh0eXBpbmdJbmRpY2F0b3I6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICAgICAgICB0aGlzLmlzVHlwaW5nID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICAgIHRoaXMuZ3JvdXBzTGlzdGVuZXJJZCxcbiAgICAgICAgbmV3IENvbWV0Q2hhdC5Hcm91cExpc3RlbmVyKHtcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgY2hhbmdlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSwgY2hhbmdlZEdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlR3JvdXBFdmVudChjaGFuZ2VkR3JvdXAsIGNoYW5nZWRVc2VyLCB0cnVlLCBuZXdTY29wZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlciwga2lja2VkRnJvbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUdyb3VwRXZlbnQoa2lja2VkRnJvbSwga2lja2VkVXNlciwgZmFsc2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCB1c2VyQWRkZWQ6IENvbWV0Q2hhdC5Vc2VyLCB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlR3JvdXBFdmVudCh1c2VyQWRkZWRJbiwgdXNlckFkZGVkLCB0cnVlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUdyb3VwRXZlbnQoZ3JvdXAsIGxlYXZpbmdVc2VyLCBmYWxzZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgam9pbmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGpvaW5lZEdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlR3JvdXBFdmVudChqb2luZWRHcm91cCwgam9pbmVkVXNlciwgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgIHRoaXMub25UeXBpbmdTdGFydGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMub25UeXBpbmdFbmRlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKClcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKVxuICB9XG4gIHNldFR5cGluZ0luZGljYXRvclRleHQgPSAodHlwaW5nOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgY29uc3Qgc2VuZGVyID0gdHlwaW5nLmdldFNlbmRlcigpO1xuICAgIGNvbnN0IHJlY2VpdmVySWQgPSB0eXBpbmcuZ2V0UmVjZWl2ZXJJZCgpO1xuICAgIGNvbnN0IGxvZ2dlZEluVXNlciA9IHRoaXMubG9nZ2VkSW5Vc2VyO1xuXG4gICAgaWYgKHRoaXMudXNlciAmJiBzZW5kZXIuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiYgbG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gcmVjZWl2ZXJJZCkge1xuICAgICAgY29uc3QgaXNCbG9ja2VkID0gdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkgfHwgdGhpcy51c2VyLmdldEhhc0Jsb2NrZWRNZSgpO1xuICAgICAgaWYgKGlzQmxvY2tlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gbG9jYWxpemUoXCJJU19UWVBJTkdcIik7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09PSByZWNlaXZlcklkKSB7XG4gICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IGAke3NlbmRlci5nZXROYW1lKCl9ICR7bG9jYWxpemUoXCJJU19UWVBJTkdcIil9YDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICBoZWFkZXJTdHlsZSA9ICgpID0+IHtcbiAgICBjb25zdCBoZWFkZXJTdHlsZSA9IHRoaXMuZ2V0SGVhZGVyc1N0eWxlKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiBoZWFkZXJTdHlsZS53aWR0aCxcbiAgICAgIGhlaWdodDogaGVhZGVyU3R5bGUuaGVpZ2h0LFxuICAgICAgYm9yZGVyOiBoZWFkZXJTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IGhlYWRlclN0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgIGJhY2tncm91bmQ6IGhlYWRlclN0eWxlLmJhY2tncm91bmQsXG4gICAgfVxuICB9XG4gIHN1YnRpdGxlU3R5bGUgPSAoKSA9PiB7XG4gICAgY29uc3QgaGVhZGVyU3R5bGUgPSB0aGlzLmdldEhlYWRlcnNTdHlsZSgpO1xuXG4gICAgaWYgKHRoaXMudXNlciAmJiB0aGlzLnVzZXIuZ2V0U3RhdHVzKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogaGVhZGVyU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiB0aGlzLmlzVHlwaW5nID8gaGVhZGVyU3R5bGUudHlwaW5nSW5kaWNhdG9yVGV4dEZvbnQgOiBoZWFkZXJTdHlsZS5zdWJ0aXRsZVRleHRGb250LFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMuaXNUeXBpbmcgPyBoZWFkZXJTdHlsZS50eXBpbmdJbmRpY2F0b3JUZXh0Q29sb3IgOiBoZWFkZXJTdHlsZS5zdWJ0aXRsZVRleHRDb2xvclxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX193cmFwcGVyXCIgW25nU3R5bGVdPVwiaGVhZGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX2JhY2stYnV0dG9uXCIgKm5nSWY9XCIhaGlkZUJhY2tCdXR0b25cIj5cbiAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tCdXR0b25JY29uVVJMXCJcbiAgICAgICAgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZVwiXG4gICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvbkJhY2tDbGlja2VkKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX19saXN0aXRlbVwiPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gKm5nSWY9XCIhbGlzdEl0ZW1WaWV3O2Vsc2UgbGlzdGl0ZW1cIlxuICAgICAgICBbYXZhdGFyTmFtZV09XCJ1c2VyPy5nZXROYW1lKCkgfHwgdGhpcy5ncm91cD8uZ2V0TmFtZSgpXCJcbiAgICAgICAgW2F2YXRhclVSTF09XCJ0aGlzLnVzZXI/LmdldEF2YXRhcigpIHx8IHRoaXMuZ3JvdXA/LmdldEljb24oKVwiXG4gICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiY2hlY2tTdGF0dXNUeXBlKClcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJjaGVja0dyb3VwVHlwZSgpXCJcbiAgICAgICAgW3RpdGxlXT1cInRoaXMudXNlcj8uZ2V0TmFtZSgpIHx8IHRoaXMuZ3JvdXA/LmdldE5hbWUoKVwiXG4gICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cInRydWVcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUodXNlcilcIlxuICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIj5cbiAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgPGRpdiAqbmdJZj1cIiFzdWJ0aXRsZVZpZXc7IGVsc2Ugc3VidGl0bGVcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwic3VidGl0bGVUZXh0XCJcbiAgICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCI+XG5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3VidGl0bGU+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuXG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICAgICAgPG5nLXRlbXBsYXRlICNsaXN0aXRlbT5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImxpc3RJdGVtVmlld1wiPlxuXG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlcl9fbWVudVwiICpuZ0lmPVwibWVudVwiPlxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuXG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXX0=