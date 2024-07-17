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
            buttonIconTint: ""
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxXQUFXLEVBQWEsYUFBYSxFQUFDLE1BQU0sMkJBQTJCLENBQUE7QUFDL0UsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixFQUFrRyxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFelAsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBRTFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDOzs7O0FBRzdEOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLCtCQUErQjtJQThEMUMsWUFBb0IsR0FBcUIsRUFBUyxZQUFrQztRQUFoRSxRQUFHLEdBQUgsR0FBRyxDQUFrQjtRQUFTLGlCQUFZLEdBQVosWUFBWSxDQUFzQjtRQTdEM0UsZ0JBQVcsR0FBZ0I7WUFDbEMsWUFBWSxFQUFFLE1BQU07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QUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFDRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO0lBQzVCLENBQUM7OzZIQS9XVSwrQkFBK0I7aUhBQS9CLCtCQUErQixtcEJDekI1QyxreERBOENBOzRGRHJCYSwrQkFBK0I7a0JBTjNDLFNBQVM7K0JBQ0UsMEJBQTBCLG1CQUduQix1QkFBdUIsQ0FBQyxNQUFNOzRJQUd0QyxXQUFXO3NCQUFuQixLQUFLO2dCQU9HLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFNRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBSUcsYUFBYTtzQkFBckIsS0FBSztnQkFTRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUdHLE1BQU07c0JBQWQsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QXZhdGFyU3R5bGUsIEJhc2VTdHlsZSwgTGlzdEl0ZW1TdHlsZX0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXRHcm91cEV2ZW50cywgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cywgQ29tZXRDaGF0VGhlbWUsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBJR3JvdXBMZWZ0LCBJR3JvdXBNZW1iZXJBZGRlZCwgSUdyb3VwTWVtYmVySm9pbmVkLCBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsIElPd25lcnNoaXBDaGFuZ2VkLCBmb250SGVscGVyLCBsb2NhbGl6ZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcblxuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSAnQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0JztcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvbic7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IE1lc3NhZ2VIZWFkZXJTdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuXG4vKipcbipcbiogQ29tZXRDaGF0TWVzc2FnZUhlYWRlciBpcyBhIHVzZWQgdG8gcmVuZGVyIGxpc3RpdGVtIGNvbXBvbmVudC5cbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlcicsXG4gIHRlbXBsYXRlVXJsOiAnLi9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIuY29tcG9uZW50LnNjc3MnXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0TWVzc2FnZUhlYWRlckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCxPbkNoYW5nZXMge1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuXG4gIH1cbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH1cbiAgQElucHV0KCkgbWVzc2FnZUhlYWRlclN0eWxlOiBNZXNzYWdlSGVhZGVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gIH1cbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjJweFwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICB9XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldzogYW55O1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBkaXNhYmxlVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gICAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgICovXG4gIEBJbnB1dCgpIHByb3RlY3RlZEdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvTG9ja2VkLnN2Z1wiO1xuICBASW5wdXQoKSBwYXNzd29yZEdyb3VwSWNvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBASW5wdXQoKSBwcml2YXRlR3JvdXBJY29uOiBzdHJpbmcgPVwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gIEBJbnB1dCgpIG1lbnU6IGFueTtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgYmFja0J1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2JhY2tidXR0b24uc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVCYWNrQnV0dG9uOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9uRXJyb3I6KChlcnJvcjpDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKT0+dm9pZCkgIHwgbnVsbCA9IChlcnJvcjpDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKT0+e1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIG9uQmFjazooKT0+dm9pZCA9ICgpPT57fVxuICBwdWJsaWMgZ3JvdXBzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJncm91cHNMaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHVzZXJMaXN0ZW5lcklkID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgc3VidGl0bGVUZXh0OnN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXIhOkNvbWV0Q2hhdC5Vc2VyO1xuICBwdWJsaWMgaXNUeXBpbmc6Ym9vbGVhbiA9IGZhbHNlO1xuICB0aGVtZTpDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSlcbiAgY2NHcm91cE1lbWJlckFkZGVkITpTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITpTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOlN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6U3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITpTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6U3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ1N0YXJ0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHlwaW5nRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOkNoYW5nZURldGVjdG9yUmVmLHByaXZhdGUgdGhlbWVTZXJ2aWNlOkNvbWV0Q2hhdFRoZW1lU2VydmljZSkge1xuICB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZihjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pe1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpXG4gICAgICBpZighdGhpcy5sb2dnZWRJblVzZXIpe1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjpDb21ldENoYXQuVXNlciB8IG51bGwpPT57XG4gICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG4gICAgICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuXG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpXG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYmFja0J1dHRvblN0eWxlLmJ1dHRvbkljb25UaW50ID0gdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGU/LmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlLm9ubGluZVN0YXR1c0NvbG9yXG5cbiAgfVxuICAgIC8vIHN1YnNjcmliZSB0byBnbG9iYWwgZXZlbnRzXG4gICAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgICAgICBpZih0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LnVzZXJBZGRlZEluIS5nZXRHdWlkKCkpe1xuICAgICAgICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LnVzZXJBZGRlZEluO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICBpZih0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSl7XG4gICAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5raWNrZWRGcm9tO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgICBpZih0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmpvaW5lZEdyb3VwIS5nZXRHdWlkKCkpe1xuICAgICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8uam9pbmVkR3JvdXA7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgIGlmKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKXtcbiAgICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjT3duZXJzaGlwQ2hhbmdlZC5zdWJzY3JpYmUoKGl0ZW06IElPd25lcnNoaXBDaGFuZ2VkKSA9PiB7XG4gICAgICAgIGlmKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uZ3JvdXAhLmdldEd1aWQoKSl7XG4gICAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5ncm91cDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNjR3JvdXBMZWZ0ID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICAgIGlmKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ubGVmdEdyb3VwIS5nZXRHdWlkKCkgJiYgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IGl0ZW0/LnVzZXJMZWZ0Py5nZXRVaWQoKSl7XG4gICAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5sZWZ0R3JvdXA7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIC8vIHVuc3Vic2NyaWJlIHRvIHN1YnNjcmliZWQgZXZlbnRzLlxuICAgIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5jY0dyb3VwTGVmdD8udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6XCJcIixcbiAgICAgIGhvdmVyQmFja2dyb3VuZDpcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsuLi5kZWZhdWx0U3R5bGUsLi4udGhpcy5saXN0SXRlbVN0eWxlfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLmF2YXRhclN0eWxlfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpCYXNlU3R5bGUgPSB7XG4gICAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICAgIHdpZHRoOlwiMTJweFwiLFxuICAgICAgICBib3JkZXI6XCJub25lXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czpcIjI0cHhcIixcblxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlfVxuICB9XG4gIGdldEhlYWRlcnNTdHlsZSgpOiBNZXNzYWdlSGVhZGVyU3R5bGUge1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB0aGlzLm1lc3NhZ2VIZWFkZXJTdHlsZTtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBNZXNzYWdlSGVhZGVyU3R5bGUgPSBuZXcgTWVzc2FnZUhlYWRlclN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IGRlZmF1bHRWYWx1ZXMuYmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogZGVmYXVsdFZhbHVlcy5ib3JkZXIgfHwgYG5vbmVgLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IGRlZmF1bHRWYWx1ZXMub25saW5lU3RhdHVzQ29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogZGVmYXVsdFZhbHVlcy5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZDogZGVmYXVsdFZhbHVlcy5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQgfHwgXCJSR0IoMjQ3LCAxNjUsIDApXCIsXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IGRlZmF1bHRWYWx1ZXMuYmFja0J1dHRvbkljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IGRlZmF1bHRWYWx1ZXMuc3VidGl0bGVUZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGRlZmF1bHRWYWx1ZXMuc3VidGl0bGVUZXh0Rm9udCB8fCBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHR5cGluZ0luZGljYXRvclRleHRDb2xvcjogZGVmYXVsdFZhbHVlcy50eXBpbmdJbmRpY2F0b3JUZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB0eXBpbmdJbmRpY2F0b3JUZXh0Rm9udDogZGVmYXVsdFZhbHVlcy50eXBpbmdJbmRpY2F0b3JUZXh0Rm9udCB8fCBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIGhlaWdodDogZGVmYXVsdFZhbHVlcy5oZWlnaHQgfHwgXCI0NXB4XCIsXG4gICAgICB3aWR0aDogZGVmYXVsdFZhbHVlcy53aWR0aCB8fCBcIjEwMCVcIixcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZhdWx0U3R5bGU7XG4gIH1cbiAgcHVibGljIHN0YXR1c0NvbG9yOiBhbnkgPSB7XG4gICAgb25saW5lOiBcIiMwMGYzMDBcIixcbiAgICBwcml2YXRlOiBcIiMwMGYzMDBcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiXG4gIH1cbiAgYmFja0J1dHRvblN0eWxlOmFueSA9IHtcbiAgICBoZWlnaHQ6XCIyNHB4XCIsXG4gICAgd2lkdGg6XCIyNHB4XCIsXG4gICAgYm9yZGVyOlwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czpcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOlwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogXCJcIlxuICB9XG4gIGNoZWNrU3RhdHVzVHlwZSA9ICgpPT4ge1xuICAgIHJldHVybiAgIHRoaXMudXNlciAmJiAhdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSA/IHRoaXMuc3RhdHVzQ29sb3JbdGhpcy51c2VyPy5nZXRTdGF0dXMoKV0gOiB0aGlzLnN0YXR1c0NvbG9yW3RoaXMuZ3JvdXA/LmdldFR5cGUoKV1cbiAgfVxuICBvbkJhY2tDbGlja2VkKCl7XG4gICAgaWYodGhpcy5vbkJhY2spe1xuICAgICAgdGhpcy5vbkJhY2soKVxuICAgIH1cbiAgfVxuICB1cGRhdGVTdWJ0aXRsZSgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuZ3JvdXA/LmdldE1lbWJlcnNDb3VudCgpO1xuICAgIGNvbnN0IG1lbWJlcnNUZXh0ID0gbG9jYWxpemUoY291bnQgPiAxID8gXCJNRU1CRVJTXCIgOiBcIk1FTUJFUlwiKTtcbiAgICBpZih0aGlzLnVzZXIpe1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlID8gXCJcIiA6IHRoaXMudXNlci5nZXRTdGF0dXMoKVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSAgYCR7Y291bnR9ICR7bWVtYmVyc1RleHR9YDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG5cbiAgfVxuICBnZXRTdWJ0aXRsZVZpZXcoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3VidGl0bGVWaWV3KHRoaXMudXNlciB8fCB0aGlzLmdyb3VwKTtcbiAgfVxuICBjaGVja0dyb3VwVHlwZSgpOiBzdHJpbmcge1xuICAgIGxldCBpbWFnZTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAodGhpcy5ncm91cCkge1xuICAgICAgc3dpdGNoICh0aGlzLmdyb3VwPy5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbWFnZVxuICB9XG4gIHVwZGF0ZVVzZXJTdGF0dXModXNlcjpDb21ldENoYXQuVXNlcil7XG5cbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRVaWQoKSAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgPT09IHVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMudXNlci5zZXRTdGF0dXModXNlci5nZXRTdGF0dXMoKSk7XG4gICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICB9XG4gICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICB0cnkge1xuICAgICAgaWYoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2Upe1xuICAgICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMob25saW5lVXNlcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyggb2ZmbGluZVVzZXIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVUeXBpbmcpe1xuICAgICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVHlwaW5nU3RhcnRlZC5zdWJzY3JpYmUoKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICB0aGlzLmlzVHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zZXRUeXBpbmdJbmRpY2F0b3JUZXh0KHR5cGluZ0luZGljYXRvcilcbiAgICAgIH0pO1xuICAgICAgdGhpcy5vblR5cGluZ0VuZGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ0VuZGVkLnN1YnNjcmliZSgodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgIHRoaXMuaXNUeXBpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB9KTtcbiAgICB9XG4gICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICB0aGlzLmdyb3Vwc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAoY2hhbmdlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICBjaGFuZ2VkR3JvdXAuc2V0U2NvcGUobmV3U2NvcGUpXG4gICAgICAgICAgfVxuICAgICAgICAgdGhpcy5ncm91cCA9IGNoYW5nZWRHcm91cFxuICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGtpY2tlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBraWNrZWRCeTogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEZyb206IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGlmIChraWNrZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAga2lja2VkRnJvbS5zZXRIYXNKb2luZWQoZmFsc2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZ3JvdXAgPSBraWNrZWRGcm9tXG4gICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSxcbiAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKHVzZXJBZGRlZC5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVzZXJBZGRlZEluLnNldEhhc0pvaW5lZCh0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmdyb3VwID0gdXNlckFkZGVkSW5cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgaWYgKGxlYXZpbmdVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgIHRoaXMuZ3JvdXAgPSBncm91cFxuICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBqb2luZWRVc2VyOiBDb21ldENoYXQuVXNlciwgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGlmIChqb2luZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgam9pbmVkR3JvdXAuc2V0SGFzSm9pbmVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZ3JvdXAgPSBqb2luZWRHcm91cFxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjphbnkpIHtcbmlmKHRoaXMub25FcnJvcil7XG4gIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxufVxuICAgIH1cbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpe1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZCk7XG4gICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5vblR5cGluZ0VuZGVkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCl7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpXG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKClcbiAgfVxuICBzZXRUeXBpbmdJbmRpY2F0b3JUZXh0ID0gKHR5cGluZzogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgIGNvbnN0IHNlbmRlciA9IHR5cGluZy5nZXRTZW5kZXIoKTtcbiAgICBjb25zdCByZWNlaXZlcklkID0gdHlwaW5nLmdldFJlY2VpdmVySWQoKTtcbiAgICBjb25zdCBsb2dnZWRJblVzZXIgPSB0aGlzLmxvZ2dlZEluVXNlcjtcblxuICAgIGlmICh0aGlzLnVzZXIgJiYgc2VuZGVyLmdldFVpZCgpID09PSB0aGlzLnVzZXI/LmdldFVpZCgpICYmIGxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IHJlY2VpdmVySWQpIHtcbiAgICAgIGNvbnN0IGlzQmxvY2tlZCA9IHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpIHx8IHRoaXMudXNlci5nZXRIYXNCbG9ja2VkTWUoKTtcbiAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IGxvY2FsaXplKFwiSVNfVFlQSU5HXCIpO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PT0gcmVjZWl2ZXJJZCkge1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBgJHtzZW5kZXIuZ2V0TmFtZSgpfSAke2xvY2FsaXplKFwiSVNfVFlQSU5HXCIpfWA7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgaGVhZGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgY29uc3QgaGVhZGVyU3R5bGUgPSB0aGlzLmdldEhlYWRlcnNTdHlsZSgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd2lkdGg6IGhlYWRlclN0eWxlLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGhlYWRlclN0eWxlLmhlaWdodCxcbiAgICAgICAgYm9yZGVyOiBoZWFkZXJTdHlsZS5ib3JkZXIsXG4gICAgICAgIGJvcmRlclJhZGl1czpoZWFkZXJTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICAgIGJhY2tncm91bmQ6IGhlYWRlclN0eWxlLmJhY2tncm91bmQgLFxuICAgICAgfVxuICAgIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpPT57XG4gICAgY29uc3QgaGVhZGVyU3R5bGUgPSB0aGlzLmdldEhlYWRlcnNTdHlsZSgpO1xuXG4gaWYodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRTdGF0dXMoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vbmxpbmUpe1xuICByZXR1cm57XG4gICAgdGV4dEZvbnQ6ICBoZWFkZXJTdHlsZS5zdWJ0aXRsZVRleHRGb250LFxuICAgIHRleHRDb2xvcjogIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gIH1cbiB9XG4gZWxzZXtcbiAgcmV0dXJue1xuICAgIHRleHRGb250OiB0aGlzLmlzVHlwaW5nID8gaGVhZGVyU3R5bGUudHlwaW5nSW5kaWNhdG9yVGV4dEZvbnQgOiAgIGhlYWRlclN0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgdGV4dENvbG9yOiB0aGlzLmlzVHlwaW5nID8gaGVhZGVyU3R5bGUudHlwaW5nSW5kaWNhdG9yVGV4dENvbG9yIDogaGVhZGVyU3R5bGUuc3VidGl0bGVUZXh0Q29sb3JcbiAgfVxuIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX193cmFwcGVyXCIgW25nU3R5bGVdPVwiaGVhZGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX2JhY2stYnV0dG9uXCIgKm5nSWY9XCIhaGlkZUJhY2tCdXR0b25cIj5cbiAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tCdXR0b25JY29uVVJMXCJcbiAgICAgICAgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZVwiXG4gICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvbkJhY2tDbGlja2VkKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX19saXN0aXRlbVwiPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gKm5nSWY9XCIhbGlzdEl0ZW1WaWV3O2Vsc2UgbGlzdGl0ZW1cIlxuICAgICAgICBbYXZhdGFyTmFtZV09XCJ1c2VyPy5nZXROYW1lKCkgfHwgdGhpcy5ncm91cD8uZ2V0TmFtZSgpXCJcbiAgICAgICAgW2F2YXRhclVSTF09XCJ0aGlzLnVzZXI/LmdldEF2YXRhcigpIHx8IHRoaXMuZ3JvdXA/LmdldEljb24oKVwiXG4gICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiY2hlY2tTdGF0dXNUeXBlKClcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJjaGVja0dyb3VwVHlwZSgpXCJcbiAgICAgICAgW3RpdGxlXT1cInRoaXMudXNlcj8uZ2V0TmFtZSgpIHx8IHRoaXMuZ3JvdXA/LmdldE5hbWUoKVwiXG4gICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cInRydWVcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIj5cbiAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgPGRpdiAqbmdJZj1cIiFzdWJ0aXRsZVZpZXc7IGVsc2Ugc3VidGl0bGVcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwic3VidGl0bGVUZXh0XCJcbiAgICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCI+XG5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3VidGl0bGU+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuXG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICAgICAgPG5nLXRlbXBsYXRlICNsaXN0aXRlbT5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImxpc3RJdGVtVmlld1wiPlxuXG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlcl9fbWVudVwiICpuZ0lmPVwibWVudVwiPlxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuXG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXX0=