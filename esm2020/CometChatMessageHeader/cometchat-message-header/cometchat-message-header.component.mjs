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
            hoverBackground: "transparent",
            cursor: 'default'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQWEsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDakYsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFrRyxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFOVEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBRTFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTdELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQzs7OztBQUUvRDs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTywrQkFBK0I7SUFnRTFDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxH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Q0FBQyxDQUFBO2FBQ3hDO1NBQ0Y7SUFDSCxDQUFDO0lBQ0QsY0FBYztRQUNaLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFDRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO0lBQzVCLENBQUM7OzZIQTFZVSwrQkFBK0I7aUhBQS9CLCtCQUErQixtcEJDMUI1QywyeERBOENBOzRGRHBCYSwrQkFBK0I7a0JBTjNDLFNBQVM7K0JBQ0UsMEJBQTBCLG1CQUduQix1QkFBdUIsQ0FBQyxNQUFNOzRJQUd0QyxXQUFXO3NCQUFuQixLQUFLO2dCQU9HLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFNRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBSUcsYUFBYTtzQkFBckIsS0FBSztnQkFTRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUdHLE1BQU07c0JBQWQsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF2YXRhclN0eWxlLCBCYXNlU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIElucHV0LCBPbkNoYW5nZXMsIE9uSW5pdCwgU2ltcGxlQ2hhbmdlcywgVGVtcGxhdGVSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRNZXNzYWdlRXZlbnRzLCBDb21ldENoYXRUaGVtZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIENvbWV0Q2hhdFVzZXJFdmVudHMsIElHcm91cExlZnQsIElHcm91cE1lbWJlckFkZGVkLCBJR3JvdXBNZW1iZXJKb2luZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgSU93bmVyc2hpcENoYW5nZWQsIGZvbnRIZWxwZXIsIGxvY2FsaXplIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uJztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWVzc2FnZUhlYWRlclN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tICcuLi8uLi9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzJztcblxuLyoqXG4qXG4qIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXIgaXMgYSB1c2VkIHRvIHJlbmRlciBsaXN0aXRlbSBjb21wb25lbnQuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjb21ldGNoYXQtbWVzc2FnZS1oZWFkZXInLFxuICB0ZW1wbGF0ZVVybDogJy4vY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5zY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG5cbiAgfVxuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfVxuICBASW5wdXQoKSBtZXNzYWdlSGVhZGVyU3R5bGU6IE1lc3NhZ2VIZWFkZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgfVxuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMnB4XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwiXCIsXG4gICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gIH1cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3OiBhbnk7XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqXG4gKiBAZGVwcmVjYXRlZFxuICpcbiAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgQElucHV0KCkgbWVudTogYW55O1xuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgaGlkZUJhY2tCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25CYWNrOiAoKSA9PiB2b2lkID0gKCkgPT4geyB9XG4gIHB1YmxpYyBncm91cHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImdyb3Vwc0xpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgdXNlckxpc3RlbmVySWQgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBzdWJ0aXRsZVRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgcHVibGljIGlzVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIHRoZW1lOiBDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSlcbiAgY2NHcm91cE1lbWJlckFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTGVmdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ1N0YXJ0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlckJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlclVuYmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKVxuICAgICAgaWYgKCF0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuXG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpXG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYmFja0J1dHRvblN0eWxlLmJ1dHRvbkljb25UaW50ID0gdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGU/LmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlLm9ubGluZVN0YXR1c0NvbG9yID8/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG5cbiAgfVxuICAvLyBzdWJzY3JpYmUgdG8gZ2xvYmFsIGV2ZW50c1xuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PSBpdGVtPy51c2VyQWRkZWRJbiEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8udXNlckFkZGVkSW47XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJKb2luZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJKb2luZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmpvaW5lZEdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5qb2luZWRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uZ3JvdXAhLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/Lmdyb3VwO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ubGVmdEdyb3VwIS5nZXRHdWlkKCkgJiYgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IGl0ZW0/LnVzZXJMZWZ0Py5nZXRVaWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmxlZnRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgLy8gdW5zdWJzY3JpYmUgdG8gc3Vic2NyaWJlZCBldmVudHMuXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyVW5ibG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiBcIlwiLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBjdXJzb3I6ICdkZWZhdWx0J1xuICAgIH0pXG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pXG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH1cbiAgfVxuICBzZXRTdGF0dXNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG5cbiAgICB9XG4gICAgaWYoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2Upe1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSB9XG4gICAgfWVsc2Uge1xuICAgICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHt9O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGdldFN0YXR1c0luZGljYXRvclN0eWxlID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KHVzZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG4gICAgaWYoIXVzZXJTdGF0dXNWaXNpYmlsaXR5KXtcbiAgICAgIHJldHVybihcbiAgICAgICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZVxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBnZXRIZWFkZXJzU3R5bGUoKTogTWVzc2FnZUhlYWRlclN0eWxlIHtcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzID0gdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGU7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTWVzc2FnZUhlYWRlclN0eWxlID0gbmV3IE1lc3NhZ2VIZWFkZXJTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBkZWZhdWx0VmFsdWVzLmJhY2tncm91bmQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGRlZmF1bHRWYWx1ZXMuYm9yZGVyIHx8IGBub25lYCxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiBkZWZhdWx0VmFsdWVzLm9ubGluZVN0YXR1c0NvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ6IGRlZmF1bHRWYWx1ZXMucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IGRlZmF1bHRWYWx1ZXMucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kIHx8IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgYmFja0J1dHRvbkljb25UaW50OiBkZWZhdWx0VmFsdWVzLmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1YnRpdGxlVGV4dENvbG9yOiBkZWZhdWx0VmFsdWVzLnN1YnRpdGxlVGV4dENvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBkZWZhdWx0VmFsdWVzLnN1YnRpdGxlVGV4dEZvbnQgfHwgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0eXBpbmdJbmRpY2F0b3JUZXh0Q29sb3I6IGRlZmF1bHRWYWx1ZXMudHlwaW5nSW5kaWNhdG9yVGV4dENvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdHlwaW5nSW5kaWNhdG9yVGV4dEZvbnQ6IGRlZmF1bHRWYWx1ZXMudHlwaW5nSW5kaWNhdG9yVGV4dEZvbnQgfHwgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBoZWlnaHQ6IGRlZmF1bHRWYWx1ZXMuaGVpZ2h0IHx8IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IGRlZmF1bHRWYWx1ZXMud2lkdGggfHwgXCIxMDAlXCIsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGVmYXVsdFN0eWxlO1xuICB9XG4gIHB1YmxpYyBzdGF0dXNDb2xvcjogYW55ID0ge1xuICAgIG9ubGluZTogXCIjMDBmMzAwXCIsXG4gICAgcHJpdmF0ZTogXCIjMDBmMzAwXCIsXG4gICAgcGFzc3dvcmQ6IFwiI0Y3QTUwMFwiLFxuICAgIHB1YmxpYzogXCJcIlxuICB9XG4gIGJhY2tCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiXCJcbiAgfVxuICBjaGVja1N0YXR1c1R5cGUgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KHRoaXMudXNlcikgfHwgdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZTtcbiAgICAgIHJldHVybiB1c2VyU3RhdHVzVmlzaWJpbGl0eSA/IG51bGwgOiB0aGlzLnN0YXR1c0NvbG9yW3RoaXMudXNlcj8uZ2V0U3RhdHVzKCldO1xuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0dXNDb2xvclt0aGlzLmdyb3VwPy5nZXRUeXBlKCldO1xuICAgIH1cbiAgICBlbHNlIHJldHVybjtcbiAgfVxuICBvbkJhY2tDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uQmFjaykge1xuICAgICAgdGhpcy5vbkJhY2soKVxuICAgIH1cbiAgfVxuICB1cGRhdGVTdWJ0aXRsZSgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuZ3JvdXA/LmdldE1lbWJlcnNDb3VudCgpO1xuICAgIGNvbnN0IG1lbWJlcnNUZXh0ID0gbG9jYWxpemUoY291bnQgPiAxID8gXCJNRU1CRVJTXCIgOiBcIk1FTUJFUlwiKTtcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICBjb25zdCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpIHx8IHRoaXMudXNlci5nZXRIYXNCbG9ja2VkTWUoKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgICAgaWYgKHVzZXJTdGF0dXNWaXNpYmlsaXR5KSB7XG4gICAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gXCJcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMudXNlci5nZXRTdGF0dXMoKTtcbiAgICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBzdGF0dXMgPyBsb2NhbGl6ZShzdGF0dXMudG9VcHBlckNhc2UoKSkgOiBsb2NhbGl6ZSggXCJPRkZMSU5FXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gYCR7Y291bnR9ICR7bWVtYmVyc1RleHR9YDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG5cbiAgfVxuICBnZXRTdWJ0aXRsZVZpZXcoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3VidGl0bGVWaWV3KHRoaXMudXNlciB8fCB0aGlzLmdyb3VwKTtcbiAgfVxuICBjaGVja0dyb3VwVHlwZSgpOiBzdHJpbmcge1xuICAgIGxldCBpbWFnZTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAodGhpcy5ncm91cCkge1xuICAgICAgc3dpdGNoICh0aGlzLmdyb3VwPy5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbWFnZVxuICB9XG4gIHVwZGF0ZVVzZXJTdGF0dXModXNlcjogQ29tZXRDaGF0LlVzZXIpIHtcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRVaWQoKSAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgPT09IHVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMudXNlci5zZXRTdGF0dXModXNlci5nZXRTdGF0dXMoKSk7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICB9XG4gICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgaGFuZGxlR3JvdXBFdmVudCA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwLCB1c2VyOiBDb21ldENoYXQuVXNlciwgaGFzSm9pbmVkOiBib29sZWFuLCBuZXdTY29wZT86IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlKSA9PiB7XG4gICAgaWYgKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpICE9PSBncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHVzZXIuZ2V0VWlkKCkgPT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgZ3JvdXAuc2V0SGFzSm9pbmVkKGhhc0pvaW5lZCk7XG4gICAgICBpZiAobmV3U2NvcGUpIHtcbiAgICAgICAgZ3JvdXAuc2V0U2NvcGUobmV3U2NvcGUpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmdyb3VwID0gZ3JvdXA7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKTtcbiAgfTtcbiAgXG5cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhvbmxpbmVVc2VyKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhvZmZsaW5lVXNlcik7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIHRoaXMuY2NVc2VyQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbS5nZXRVaWQoKSA9PSB0aGlzLnVzZXIuZ2V0VWlkKCkpXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhpdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuY2NVc2VyVW5ibG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJVbmJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0uZ2V0VWlkKCkgPT0gdGhpcy51c2VyLmdldFVpZCgpKVxuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMoaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZykge1xuICAgICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdTdGFydGVkLnN1YnNjcmliZSgodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1R5cGluZyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zZXRUeXBpbmdJbmRpY2F0b3JUZXh0KHR5cGluZ0luZGljYXRvcilcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMub25UeXBpbmdFbmRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdFbmRlZC5zdWJzY3JpYmUoKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIHRoaXMuaXNUeXBpbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ncm91cHNMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsIG5ld1Njb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSwgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLCBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVHcm91cEV2ZW50KGNoYW5nZWRHcm91cCwgY2hhbmdlZFVzZXIsIHRydWUsIG5ld1Njb3BlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBraWNrZWRVc2VyOiBDb21ldENoYXQuVXNlciwga2lja2VkQnk6IENvbWV0Q2hhdC5Vc2VyLCBraWNrZWRGcm9tOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlR3JvdXBFdmVudChraWNrZWRGcm9tLCBraWNrZWRVc2VyLCBmYWxzZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsIHVzZXJBZGRlZEJ5OiBDb21ldENoYXQuVXNlciwgdXNlckFkZGVkSW46IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVHcm91cEV2ZW50KHVzZXJBZGRlZEluLCB1c2VyQWRkZWQsIHRydWUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBsZWF2aW5nVXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlR3JvdXBFdmVudChncm91cCwgbGVhdmluZ1VzZXIsIGZhbHNlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBqb2luZWRVc2VyOiBDb21ldENoYXQuVXNlciwgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVHcm91cEV2ZW50KGpvaW5lZEdyb3VwLCBqb2luZWRVc2VyLCB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZCk7XG4gICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5vblR5cGluZ0VuZGVkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKVxuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cbiAgc2V0VHlwaW5nSW5kaWNhdG9yVGV4dCA9ICh0eXBpbmc6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICBjb25zdCBzZW5kZXIgPSB0eXBpbmcuZ2V0U2VuZGVyKCk7XG4gICAgY29uc3QgcmVjZWl2ZXJJZCA9IHR5cGluZy5nZXRSZWNlaXZlcklkKCk7XG4gICAgY29uc3QgbG9nZ2VkSW5Vc2VyID0gdGhpcy5sb2dnZWRJblVzZXI7XG5cbiAgICBpZiAodGhpcy51c2VyICYmIHNlbmRlci5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJiBsb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSByZWNlaXZlcklkKSB7XG4gICAgICBjb25zdCBpc0Jsb2NrZWQgPSB0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSB8fCB0aGlzLnVzZXIuZ2V0SGFzQmxvY2tlZE1lKCk7XG4gICAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBsb2NhbGl6ZShcIklTX1RZUElOR1wiKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT09IHJlY2VpdmVySWQpIHtcbiAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gYCR7c2VuZGVyLmdldE5hbWUoKX0gJHtsb2NhbGl6ZShcIklTX1RZUElOR1wiKX1gO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIGhlYWRlclN0eWxlID0gKCkgPT4ge1xuICAgIGNvbnN0IGhlYWRlclN0eWxlID0gdGhpcy5nZXRIZWFkZXJzU3R5bGUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IGhlYWRlclN0eWxlLndpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWFkZXJTdHlsZS5oZWlnaHQsXG4gICAgICBib3JkZXI6IGhlYWRlclN0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogaGVhZGVyU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDogaGVhZGVyU3R5bGUuYmFja2dyb3VuZCxcbiAgICB9XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICBjb25zdCBoZWFkZXJTdHlsZSA9IHRoaXMuZ2V0SGVhZGVyc1N0eWxlKCk7XG5cbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRTdGF0dXMoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vbmxpbmUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBoZWFkZXJTdHlsZS5zdWJ0aXRsZVRleHRGb250LFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IHRoaXMuaXNUeXBpbmcgPyBoZWFkZXJTdHlsZS50eXBpbmdJbmRpY2F0b3JUZXh0Rm9udCA6IGhlYWRlclN0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy5pc1R5cGluZyA/IGhlYWRlclN0eWxlLnR5cGluZ0luZGljYXRvclRleHRDb2xvciA6IGhlYWRlclN0eWxlLnN1YnRpdGxlVGV4dENvbG9yXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJoZWFkZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlclwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlcl9fYmFjay1idXR0b25cIiAqbmdJZj1cIiFoaWRlQmFja0J1dHRvblwiPlxuICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIlxuICAgICAgICBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlXCJcbiAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQmFja0NsaWNrZWQoKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX2xpc3RpdGVtXCI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSAqbmdJZj1cIiFsaXN0SXRlbVZpZXc7ZWxzZSBsaXN0aXRlbVwiXG4gICAgICAgIFthdmF0YXJOYW1lXT1cInVzZXI/LmdldE5hbWUoKSB8fCB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbYXZhdGFyVVJMXT1cInRoaXMudXNlcj8uZ2V0QXZhdGFyKCkgfHwgdGhpcy5ncm91cD8uZ2V0SWNvbigpXCJcbiAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJjaGVja1N0YXR1c1R5cGUoKVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JJY29uXT1cImNoZWNrR3JvdXBUeXBlKClcIlxuICAgICAgICBbdGl0bGVdPVwidGhpcy51c2VyPy5nZXROYW1lKCkgfHwgdGhpcy5ncm91cD8uZ2V0TmFtZSgpXCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwidHJ1ZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSh1c2VyKVwiXG4gICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXN1YnRpdGxlVmlldzsgZWxzZSBzdWJ0aXRsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIlxuICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIj5cblxuICAgICAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNzdWJ0aXRsZT5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCB9XCI+XG5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgICA8bmctdGVtcGxhdGUgI2xpc3RpdGVtPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibGlzdEl0ZW1WaWV3XCI+XG5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX19tZW51XCIgKm5nSWY9XCJtZW51XCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnU7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCB9XCI+XG5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdfQ==