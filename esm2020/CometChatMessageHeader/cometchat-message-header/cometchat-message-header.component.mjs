import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CometChatGroupEvents, CometChatMessageEvents, CometChatTheme, CometChatUIKitConstants, fontHelper, localize } from '@cometchat/uikit-resources';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatException } from '../../Shared/Utils/ComeChatException';
import { MessageHeaderStyle } from '@cometchat/uikit-shared';
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
            buttonIconTint: "#3399FF"
        };
        this.checkStatusType = () => {
            return this.user && !this.disableUsersPresence ? this.statusColor[this.user?.getStatus()] : this.statusColor[this.group?.getType()];
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
            return {
                width: this.messageHeaderStyle.width,
                height: this.messageHeaderStyle.height,
                border: this.messageHeaderStyle.border,
                borderRadius: this.messageHeaderStyle.borderRadius,
                background: this.messageHeaderStyle.background,
            };
        };
        this.subtitleStyle = () => {
            if (this.user && this.user.getStatus() == CometChatUIKitConstants.userStatusType.online) {
                return {
                    textFont: this.messageHeaderStyle.subtitleTextFont,
                    textColor: this.themeService.theme.palette.getPrimary()
                };
            }
            else {
                return {
                    textFont: this.isTyping ? this.messageHeaderStyle.typingIndicatorTextFont : this.messageHeaderStyle.subtitleTextFont,
                    textColor: this.isTyping ? this.messageHeaderStyle.typingIndicatorTextColor : this.messageHeaderStyle.subtitleTextColor
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
        this.setHeadersStyle();
        this.subscribeToEvents();
        this.backButtonStyle.buttonIconTint = this.messageHeaderStyle?.backButtonIconTint;
        this.statusColor.online = this.messageHeaderStyle.onlineStatusColor;
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
        this.statusIndicatorStyle = { ...defaultStyle, ...this.statusIndicatorStyle };
    }
    setHeadersStyle() {
        let defaultStyle = new MessageHeaderStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `none`,
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            privateGroupIconBackground: this.themeService.theme.palette.getSuccess(),
            passwordGroupIconBackground: "RGB(247, 165, 0)",
            backButtonIconTint: this.themeService.theme.palette.getPrimary(),
            subtitleTextColor: this.themeService.theme.palette.getAccent600(),
            subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            typingIndicatorTextColor: this.themeService.theme.palette.getPrimary(),
            typingIndicatorTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
        });
        this.messageHeaderStyle = { ...defaultStyle, ...this.messageHeaderStyle };
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
            this.subtitleText = this.disableUsersPresence ? "" : this.user.getStatus();
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
                    if (changedUser.getUid() == this.loggedInUser?.getUid()) {
                        changedGroup.setScope(newScope);
                    }
                    this.group = changedGroup;
                    this.ref.detectChanges();
                    this.updateSubtitle();
                },
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    if (kickedUser.getUid() == this.loggedInUser?.getUid()) {
                        kickedFrom.setHasJoined(false);
                    }
                    this.group = kickedFrom;
                    this.ref.detectChanges();
                    this.updateSubtitle();
                },
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                    if (userAdded.getUid() == this.loggedInUser?.getUid()) {
                        userAddedIn.setHasJoined(true);
                    }
                    this.group = userAddedIn;
                    this.ref.detectChanges();
                    this.updateSubtitle();
                },
                onGroupMemberLeft: (message, leavingUser, group) => {
                    if (leavingUser.getUid() == this.loggedInUser?.getUid()) {
                        group.setHasJoined(false);
                    }
                    this.group = group;
                    this.ref.detectChanges();
                    this.updateSubtitle();
                },
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                    if (joinedUser.getUid() == this.loggedInUser?.getUid()) {
                        joinedGroup.setHasJoined(true);
                    }
                    this.group = joinedGroup;
                    this.ref.detectChanges();
                    this.updateSubtitle();
                },
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
CometChatMessageHeaderComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageHeaderComponent, selector: "cometchat-message-header", inputs: { avatarStyle: "avatarStyle", statusIndicatorStyle: "statusIndicatorStyle", messageHeaderStyle: "messageHeaderStyle", listItemStyle: "listItemStyle", subtitleView: "subtitleView", disableUsersPresence: "disableUsersPresence", disableTyping: "disableTyping", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", privateGroupIcon: "privateGroupIcon", menu: "menu", user: "user", group: "group", backButtonIconURL: "backButtonIconURL", hideBackButton: "hideBackButton", listItemView: "listItemView", onError: "onError", onBack: "onBack" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-header__wrapper\" [ngStyle]=\"headerStyle()\">\n  <div class=\"cc-message-header\">\n    <div class=\"cc-message-header__back-button\" *ngIf=\"!hideBackButton\">\n      <cometchat-button [iconURL]=\"backButtonIconURL\"\n        [buttonStyle]=\"backButtonStyle\"\n        (cc-button-clicked)=\"onBackClicked()\"></cometchat-button>\n    </div>\n    <div class=\"cc-message-header__listitem\">\n      <cometchat-list-item *ngIf=\"!listItemView;else listitem\"\n        [avatarName]=\"user?.getName() || this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() || this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() || this.group?.getName()\"\n        [hideSeparator]=\"true\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n\n            </ng-container>\n          </ng-template>\n\n        </div>\n      </cometchat-list-item>\n      <ng-template #listitem>\n        <ng-container *ngTemplateOutlet=\"listItemView\">\n\n        </ng-container>\n      </ng-template>\n    </div>\n  </div>\n  <div class=\"cc-message-header__menu\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu;context:{ $implicit: user ?? group }\">\n\n    </ng-container>\n  </div>\n</div>\n", styles: [".cc-message-header__wrapper{display:flex;align-items:center;justify-content:space-between;flex-direction:row;padding:8px;box-sizing:border-box}.cc-message-header__back-button{margin-right:8px}.cc-message-header{display:flex;align-items:center;justify-content:flex-start;height:100%;width:100%}.cc-message-header__listitem{height:100%;width:100%;display:flex;align-items:center;justify-content:flex-start}.cc-message-header__menu{width:-moz-fit-content;width:fit-content;display:flex;align-items:center;justify-content:flex-end;padding:12px}cometchat-list-item{width:100%}\n"], directives: [{ type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageHeaderComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cometchat-message-header', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-header__wrapper\" [ngStyle]=\"headerStyle()\">\n  <div class=\"cc-message-header\">\n    <div class=\"cc-message-header__back-button\" *ngIf=\"!hideBackButton\">\n      <cometchat-button [iconURL]=\"backButtonIconURL\"\n        [buttonStyle]=\"backButtonStyle\"\n        (cc-button-clicked)=\"onBackClicked()\"></cometchat-button>\n    </div>\n    <div class=\"cc-message-header__listitem\">\n      <cometchat-list-item *ngIf=\"!listItemView;else listitem\"\n        [avatarName]=\"user?.getName() || this.group?.getName()\"\n        [avatarURL]=\"this.user?.getAvatar() || this.group?.getIcon()\"\n        [listItemStyle]=\"listItemStyle\"\n        [statusIndicatorColor]=\"checkStatusType()\"\n        [statusIndicatorIcon]=\"checkGroupType()\"\n        [title]=\"this.user?.getName() || this.group?.getName()\"\n        [hideSeparator]=\"true\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [avatarStyle]=\"avatarStyle\">\n        <div slot=\"subtitleView\">\n          <div *ngIf=\"!subtitleView; else subtitle\">\n            <cometchat-label [text]=\"subtitleText\"\n              [labelStyle]=\"subtitleStyle()\">\n\n            </cometchat-label>\n          </div>\n          <ng-template #subtitle>\n            <ng-container\n              *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n\n            </ng-container>\n          </ng-template>\n\n        </div>\n      </cometchat-list-item>\n      <ng-template #listitem>\n        <ng-container *ngTemplateOutlet=\"listItemView\">\n\n        </ng-container>\n      </ng-template>\n    </div>\n  </div>\n  <div class=\"cc-message-header__menu\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu;context:{ $implicit: user ?? group }\">\n\n    </ng-container>\n  </div>\n</div>\n", styles: [".cc-message-header__wrapper{display:flex;align-items:center;justify-content:space-between;flex-direction:row;padding:8px;box-sizing:border-box}.cc-message-header__back-button{margin-right:8px}.cc-message-header{display:flex;align-items:center;justify-content:flex-start;height:100%;width:100%}.cc-message-header__listitem{height:100%;width:100%;display:flex;align-items:center;justify-content:flex-start}.cc-message-header__menu{width:-moz-fit-content;width:fit-content;display:flex;align-items:center;justify-content:flex-end;padding:12px}cometchat-list-item{width:100%}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxXQUFXLEVBQWEsYUFBYSxFQUFDLE1BQU0sMkJBQTJCLENBQUE7QUFDL0UsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixFQUFrRyxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFelAsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBRTFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDOzs7O0FBRzdEOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLCtCQUErQjtJQThEMUMsWUFBb0IsR0FBcUIsRUFBUyxZQUFrQztRQUFoRSxRQUFHLEdBQUgsR0FBRyxDQUFrQjtRQUFTLGlCQUFZLEdBQVosWUFBWSxDQUFzQjtRQTdEM0UsZ0JBQVcsR0FBZ0I7WUFDbEMsWUFBWSxFQUFFLE1BQU07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O2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFJRyxhQUFhO3NCQUFyQixLQUFLO2dCQVNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxLQUFLO3NCQUFiLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBR0csTUFBTTtzQkFBZCxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtBdmF0YXJTdHlsZSwgQmFzZVN0eWxlLCBMaXN0SXRlbVN0eWxlfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIElucHV0LCBPbkNoYW5nZXMsIE9uSW5pdCwgU2ltcGxlQ2hhbmdlcywgVGVtcGxhdGVSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRNZXNzYWdlRXZlbnRzLCBDb21ldENoYXRUaGVtZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIElHcm91cExlZnQsIElHcm91cE1lbWJlckFkZGVkLCBJR3JvdXBNZW1iZXJKb2luZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgSU93bmVyc2hpcENoYW5nZWQsIGZvbnRIZWxwZXIsIGxvY2FsaXplIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uJztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWVzc2FnZUhlYWRlclN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5cbi8qKlxuKlxuKiBDb21ldENoYXRNZXNzYWdlSGVhZGVyIGlzIGEgdXNlZCB0byByZW5kZXIgbGlzdGl0ZW0gY29tcG9uZW50LlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5jb21wb25lbnQuc2NzcyddLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlSGVhZGVyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG5cbiAgfVxuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfVxuICBASW5wdXQoKSBtZXNzYWdlSGVhZGVyU3R5bGU6IE1lc3NhZ2VIZWFkZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgfVxuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMnB4XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwiXCIsXG4gICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gIH1cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3OiBhbnk7XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAvKipcbiAgICogQGRlcHJlY2F0ZWRcbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAgKi9cbiAgQElucHV0KCkgcHJvdGVjdGVkR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHBhc3N3b3JkR3JvdXBJY29uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIHByaXZhdGVHcm91cEljb246IHN0cmluZyA9XCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgQElucHV0KCkgbWVudTogYW55O1xuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgaGlkZUJhY2tCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25FcnJvcjooKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT52b2lkKSAgfCBudWxsID0gKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25CYWNrOigpPT52b2lkID0gKCk9Pnt9XG4gIHB1YmxpYyBncm91cHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImdyb3Vwc0xpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgdXNlckxpc3RlbmVySWQgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBzdWJ0aXRsZVRleHQ6c3RyaW5nID0gXCJcIjtcbiAgcHVibGljIGxvZ2dlZEluVXNlciE6Q29tZXRDaGF0LlVzZXI7XG4gIHB1YmxpYyBpc1R5cGluZzpib29sZWFuID0gZmFsc2U7XG4gIHRoZW1lOkNvbWV0Q2hhdFRoZW1lID0gbmV3IENvbWV0Q2hhdFRoZW1lKHt9KVxuICBjY0dyb3VwTWVtYmVyQWRkZWQhOlN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOlN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6U3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyS2lja2VkITpTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOlN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITpTdWJzY3JpcHRpb247XG4gIG9uVHlwaW5nU3RhcnRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6Q2hhbmdlRGV0ZWN0b3JSZWYscHJpdmF0ZSB0aGVtZVNlcnZpY2U6Q29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSl7XG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKClcbiAgICAgIGlmKCF0aGlzLmxvZ2dlZEluVXNlcil7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOkNvbWV0Q2hhdC5Vc2VyIHwgbnVsbCk9PntcbiAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXI7XG4gICAgICAgICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxuICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICB9KS5jYXRjaCgoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgICAgICAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB9XG5cbiAgICB9XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKClcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKClcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKClcbiAgICB0aGlzLnNldEhlYWRlcnNTdHlsZSgpXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYmFja0J1dHRvblN0eWxlLmJ1dHRvbkljb25UaW50ID0gdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGU/LmJhY2tCdXR0b25JY29uVGludDtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlLm9ubGluZVN0YXR1c0NvbG9yXG5cbiAgfVxuICAgIC8vIHN1YnNjcmliZSB0byBnbG9iYWwgZXZlbnRzXG4gICAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgICAgICBpZih0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LnVzZXJBZGRlZEluIS5nZXRHdWlkKCkpe1xuICAgICAgICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LnVzZXJBZGRlZEluO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICBpZih0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSl7XG4gICAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5raWNrZWRGcm9tO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgICBpZih0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmpvaW5lZEdyb3VwIS5nZXRHdWlkKCkpe1xuICAgICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8uam9pbmVkR3JvdXA7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgIGlmKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKXtcbiAgICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjT3duZXJzaGlwQ2hhbmdlZC5zdWJzY3JpYmUoKGl0ZW06IElPd25lcnNoaXBDaGFuZ2VkKSA9PiB7XG4gICAgICAgIGlmKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uZ3JvdXAhLmdldEd1aWQoKSl7XG4gICAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5ncm91cDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNjR3JvdXBMZWZ0ID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICAgIGlmKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ubGVmdEdyb3VwIS5nZXRHdWlkKCkgJiYgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IGl0ZW0/LnVzZXJMZWZ0Py5nZXRVaWQoKSl7XG4gICAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5sZWZ0R3JvdXA7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIC8vIHVuc3Vic2NyaWJlIHRvIHN1YnNjcmliZWQgZXZlbnRzLlxuICAgIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5jY0dyb3VwTGVmdD8udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6XCJcIixcbiAgICAgIGhvdmVyQmFja2dyb3VuZDpcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsuLi5kZWZhdWx0U3R5bGUsLi4udGhpcy5saXN0SXRlbVN0eWxlfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLmF2YXRhclN0eWxlfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpCYXNlU3R5bGUgPSB7XG4gICAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICAgIHdpZHRoOlwiMTJweFwiLFxuICAgICAgICBib3JkZXI6XCJub25lXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czpcIjI0cHhcIixcblxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlfVxuICB9XG4gIHNldEhlYWRlcnNTdHlsZSgpe1xuICAgIGxldCBkZWZhdWx0U3R5bGU6TWVzc2FnZUhlYWRlclN0eWxlID0gbmV3IE1lc3NhZ2VIZWFkZXJTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOmBub25lYCxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6XCJSR0IoMjQ3LCAxNjUsIDApXCIsXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHR5cGluZ0luZGljYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB0eXBpbmdJbmRpY2F0b3JUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgfSlcbiAgICB0aGlzLm1lc3NhZ2VIZWFkZXJTdHlsZSA9IHsuLi5kZWZhdWx0U3R5bGUsLi4udGhpcy5tZXNzYWdlSGVhZGVyU3R5bGV9XG4gIH1cbiAgcHVibGljIHN0YXR1c0NvbG9yOiBhbnkgPSB7XG4gICAgb25saW5lOiBcIiMwMGYzMDBcIixcbiAgICBwcml2YXRlOiBcIiMwMGYzMDBcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiXG4gIH1cbiAgYmFja0J1dHRvblN0eWxlOmFueSA9IHtcbiAgICBoZWlnaHQ6XCIyNHB4XCIsXG4gICAgd2lkdGg6XCIyNHB4XCIsXG4gICAgYm9yZGVyOlwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czpcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOlwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDpcIiMzMzk5RkZcIlxuICB9XG4gIGNoZWNrU3RhdHVzVHlwZSA9ICgpPT4ge1xuICAgIHJldHVybiAgIHRoaXMudXNlciAmJiAhdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSA/IHRoaXMuc3RhdHVzQ29sb3JbdGhpcy51c2VyPy5nZXRTdGF0dXMoKV0gOiB0aGlzLnN0YXR1c0NvbG9yW3RoaXMuZ3JvdXA/LmdldFR5cGUoKV1cbiAgfVxuICBvbkJhY2tDbGlja2VkKCl7XG4gICAgaWYodGhpcy5vbkJhY2spe1xuICAgICAgdGhpcy5vbkJhY2soKVxuICAgIH1cbiAgfVxuICB1cGRhdGVTdWJ0aXRsZSgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuZ3JvdXA/LmdldE1lbWJlcnNDb3VudCgpO1xuICAgIGNvbnN0IG1lbWJlcnNUZXh0ID0gbG9jYWxpemUoY291bnQgPiAxID8gXCJNRU1CRVJTXCIgOiBcIk1FTUJFUlwiKTtcbiAgICBpZih0aGlzLnVzZXIpe1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlID8gXCJcIiA6IHRoaXMudXNlci5nZXRTdGF0dXMoKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSAgYCR7Y291bnR9ICR7bWVtYmVyc1RleHR9YDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG5cbiAgfVxuICBnZXRTdWJ0aXRsZVZpZXcoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3VidGl0bGVWaWV3KHRoaXMudXNlciB8fCB0aGlzLmdyb3VwKTtcbiAgfVxuICBjaGVja0dyb3VwVHlwZSgpOiBzdHJpbmcge1xuICAgIGxldCBpbWFnZTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAodGhpcy5ncm91cCkge1xuICAgICAgc3dpdGNoICh0aGlzLmdyb3VwPy5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbWFnZVxuICB9XG4gIHVwZGF0ZVVzZXJTdGF0dXModXNlcjpDb21ldENoYXQuVXNlcil7XG5cbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRVaWQoKSAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgPT09IHVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMudXNlci5zZXRTdGF0dXModXNlci5nZXRTdGF0dXMoKSk7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICB9XG4gICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICB0cnkge1xuICAgICAgaWYoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2Upe1xuICAgICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMob25saW5lVXNlcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyggb2ZmbGluZVVzZXIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVUeXBpbmcpe1xuICAgICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVHlwaW5nU3RhcnRlZC5zdWJzY3JpYmUoKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICB0aGlzLmlzVHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zZXRUeXBpbmdJbmRpY2F0b3JUZXh0KHR5cGluZ0luZGljYXRvcilcbiAgICAgIH0pO1xuICAgICAgdGhpcy5vblR5cGluZ0VuZGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ0VuZGVkLnN1YnNjcmliZSgodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgIHRoaXMuaXNUeXBpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB9KTtcbiAgICB9XG4gICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICB0aGlzLmdyb3Vwc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAoY2hhbmdlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICBjaGFuZ2VkR3JvdXAuc2V0U2NvcGUobmV3U2NvcGUpXG4gICAgICAgICAgfVxuICAgICAgICAgdGhpcy5ncm91cCA9IGNoYW5nZWRHcm91cFxuICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGtpY2tlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBraWNrZWRCeTogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEZyb206IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGlmIChraWNrZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAga2lja2VkRnJvbS5zZXRIYXNKb2luZWQoZmFsc2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZ3JvdXAgPSBraWNrZWRGcm9tXG4gICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSxcbiAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKHVzZXJBZGRlZC5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVzZXJBZGRlZEluLnNldEhhc0pvaW5lZCh0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmdyb3VwID0gdXNlckFkZGVkSW5cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgaWYgKGxlYXZpbmdVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgIHRoaXMuZ3JvdXAgPSBncm91cFxuICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBqb2luZWRVc2VyOiBDb21ldENoYXQuVXNlciwgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGlmIChqb2luZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgam9pbmVkR3JvdXAuc2V0SGFzSm9pbmVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZ3JvdXAgPSBqb2luZWRHcm91cFxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjphbnkpIHtcbmlmKHRoaXMub25FcnJvcil7XG4gIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxufVxuICAgIH1cbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpe1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZCk7XG4gICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5vblR5cGluZ0VuZGVkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCl7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpXG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKClcbiAgfVxuICBzZXRUeXBpbmdJbmRpY2F0b3JUZXh0ID0gKHR5cGluZzogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgIGNvbnN0IHNlbmRlciA9IHR5cGluZy5nZXRTZW5kZXIoKTtcbiAgICBjb25zdCByZWNlaXZlcklkID0gdHlwaW5nLmdldFJlY2VpdmVySWQoKTtcbiAgICBjb25zdCBsb2dnZWRJblVzZXIgPSB0aGlzLmxvZ2dlZEluVXNlcjtcblxuICAgIGlmICh0aGlzLnVzZXIgJiYgc2VuZGVyLmdldFVpZCgpID09PSB0aGlzLnVzZXI/LmdldFVpZCgpICYmIGxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IHJlY2VpdmVySWQpIHtcbiAgICAgIGNvbnN0IGlzQmxvY2tlZCA9IHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpIHx8IHRoaXMudXNlci5nZXRIYXNCbG9ja2VkTWUoKTtcbiAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IGxvY2FsaXplKFwiSVNfVFlQSU5HXCIpO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PT0gcmVjZWl2ZXJJZCkge1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBgJHtzZW5kZXIuZ2V0TmFtZSgpfSAke2xvY2FsaXplKFwiSVNfVFlQSU5HXCIpfWA7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgaGVhZGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB3aWR0aDogdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGUud2lkdGgsXG4gICAgICAgIGhlaWdodDogdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGUuaGVpZ2h0LFxuICAgICAgICBib3JkZXI6IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlLmJvcmRlcixcbiAgICAgICAgYm9yZGVyUmFkaXVzOnRoaXMubWVzc2FnZUhlYWRlclN0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGUuYmFja2dyb3VuZCAsXG4gICAgICB9XG4gICAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCk9PntcbiBpZih0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFN0YXR1cygpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSl7XG4gIHJldHVybntcbiAgICB0ZXh0Rm9udDogIHRoaXMubWVzc2FnZUhlYWRlclN0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgdGV4dENvbG9yOiAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgfVxuIH1cbiBlbHNle1xuICByZXR1cm57XG4gICAgdGV4dEZvbnQ6IHRoaXMuaXNUeXBpbmcgPyB0aGlzLm1lc3NhZ2VIZWFkZXJTdHlsZS50eXBpbmdJbmRpY2F0b3JUZXh0Rm9udCA6ICAgdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICB0ZXh0Q29sb3I6IHRoaXMuaXNUeXBpbmcgPyB0aGlzLm1lc3NhZ2VIZWFkZXJTdHlsZS50eXBpbmdJbmRpY2F0b3JUZXh0Q29sb3IgOiB0aGlzLm1lc3NhZ2VIZWFkZXJTdHlsZS5zdWJ0aXRsZVRleHRDb2xvclxuICB9XG4gfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJoZWFkZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlclwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlcl9fYmFjay1idXR0b25cIiAqbmdJZj1cIiFoaWRlQmFja0J1dHRvblwiPlxuICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIlxuICAgICAgICBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlXCJcbiAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQmFja0NsaWNrZWQoKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX2xpc3RpdGVtXCI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSAqbmdJZj1cIiFsaXN0SXRlbVZpZXc7ZWxzZSBsaXN0aXRlbVwiXG4gICAgICAgIFthdmF0YXJOYW1lXT1cInVzZXI/LmdldE5hbWUoKSB8fCB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbYXZhdGFyVVJMXT1cInRoaXMudXNlcj8uZ2V0QXZhdGFyKCkgfHwgdGhpcy5ncm91cD8uZ2V0SWNvbigpXCJcbiAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJjaGVja1N0YXR1c1R5cGUoKVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JJY29uXT1cImNoZWNrR3JvdXBUeXBlKClcIlxuICAgICAgICBbdGl0bGVdPVwidGhpcy51c2VyPy5nZXROYW1lKCkgfHwgdGhpcy5ncm91cD8uZ2V0TmFtZSgpXCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwidHJ1ZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXN1YnRpdGxlVmlldzsgZWxzZSBzdWJ0aXRsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIlxuICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIj5cblxuICAgICAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNzdWJ0aXRsZT5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCB9XCI+XG5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgICA8bmctdGVtcGxhdGUgI2xpc3RpdGVtPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibGlzdEl0ZW1WaWV3XCI+XG5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX19tZW51XCIgKm5nSWY9XCJtZW51XCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnU7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCB9XCI+XG5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdfQ==