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
            let userStatusVisibility = this.user.getBlockedByMe() || this.user.getHasBlockedMe() || this.disableUsersPresence;
            this.subtitleText = userStatusVisibility ? "" : this.user.getStatus();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQWEsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDakYsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFrRyxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFOVEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBRTFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTdELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQzs7OztBQUUvRDs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTywrQkFBK0I7SUFnRTFDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxH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QUFFLFdBQVcsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFDRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO0lBQzVCLENBQUM7OzZIQXZZVSwrQkFBK0I7aUhBQS9CLCtCQUErQixtcEJDMUI1QyxreERBOENBOzRGRHBCYSwrQkFBK0I7a0JBTjNDLFNBQVM7K0JBQ0UsMEJBQTBCLG1CQUduQix1QkFBdUIsQ0FBQyxNQUFNOzRJQUd0QyxXQUFXO3NCQUFuQixLQUFLO2dCQU9HLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFNRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBSUcsYUFBYTtzQkFBckIsS0FBSztnQkFTRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUdHLE1BQU07c0JBQWQsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF2YXRhclN0eWxlLCBCYXNlU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIElucHV0LCBPbkNoYW5nZXMsIE9uSW5pdCwgU2ltcGxlQ2hhbmdlcywgVGVtcGxhdGVSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRNZXNzYWdlRXZlbnRzLCBDb21ldENoYXRUaGVtZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIENvbWV0Q2hhdFVzZXJFdmVudHMsIElHcm91cExlZnQsIElHcm91cE1lbWJlckFkZGVkLCBJR3JvdXBNZW1iZXJKb2luZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgSU93bmVyc2hpcENoYW5nZWQsIGZvbnRIZWxwZXIsIGxvY2FsaXplIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uJztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWVzc2FnZUhlYWRlclN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tICcuLi8uLi9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzJztcblxuLyoqXG4qXG4qIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXIgaXMgYSB1c2VkIHRvIHJlbmRlciBsaXN0aXRlbSBjb21wb25lbnQuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjb21ldGNoYXQtbWVzc2FnZS1oZWFkZXInLFxuICB0ZW1wbGF0ZVVybDogJy4vY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5zY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG5cbiAgfVxuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfVxuICBASW5wdXQoKSBtZXNzYWdlSGVhZGVyU3R5bGU6IE1lc3NhZ2VIZWFkZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgfVxuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMnB4XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwiXCIsXG4gICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gIH1cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3OiBhbnk7XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqXG4gKiBAZGVwcmVjYXRlZFxuICpcbiAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgQElucHV0KCkgbWVudTogYW55O1xuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgaGlkZUJhY2tCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25CYWNrOiAoKSA9PiB2b2lkID0gKCkgPT4geyB9XG4gIHB1YmxpYyBncm91cHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImdyb3Vwc0xpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgdXNlckxpc3RlbmVySWQgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBzdWJ0aXRsZVRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgcHVibGljIGlzVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIHRoZW1lOiBDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSlcbiAgY2NHcm91cE1lbWJlckFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTGVmdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ1N0YXJ0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlckJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlclVuYmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKVxuICAgICAgaWYgKCF0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuXG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpXG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYmFja0J1dHRvblN0eWxlLmJ1dHRvbkljb25UaW50ID0gdGhpcy5tZXNzYWdlSGVhZGVyU3R5bGU/LmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlLm9ubGluZVN0YXR1c0NvbG9yID8/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG5cbiAgfVxuICAvLyBzdWJzY3JpYmUgdG8gZ2xvYmFsIGV2ZW50c1xuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PSBpdGVtPy51c2VyQWRkZWRJbiEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8udXNlckFkZGVkSW47XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJKb2luZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJKb2luZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmpvaW5lZEdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5qb2luZWRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uZ3JvdXAhLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/Lmdyb3VwO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpO1xuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ubGVmdEdyb3VwIS5nZXRHdWlkKCkgJiYgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IGl0ZW0/LnVzZXJMZWZ0Py5nZXRVaWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmxlZnRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgLy8gdW5zdWJzY3JpYmUgdG8gc3Vic2NyaWJlZCBldmVudHMuXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyVW5ibG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiBcIlwiLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuXG4gICAgfVxuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSB9XG4gIH1cbiAgZ2V0SGVhZGVyc1N0eWxlKCk6IE1lc3NhZ2VIZWFkZXJTdHlsZSB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlO1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IE1lc3NhZ2VIZWFkZXJTdHlsZSA9IG5ldyBNZXNzYWdlSGVhZGVyU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogZGVmYXVsdFZhbHVlcy5iYWNrZ3JvdW5kIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBkZWZhdWx0VmFsdWVzLmJvcmRlciB8fCBgbm9uZWAsXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogZGVmYXVsdFZhbHVlcy5vbmxpbmVTdGF0dXNDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kOiBkZWZhdWx0VmFsdWVzLnByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kOiBkZWZhdWx0VmFsdWVzLnBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZCB8fCBcIlJHQigyNDcsIDE2NSwgMClcIixcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDogZGVmYXVsdFZhbHVlcy5iYWNrQnV0dG9uSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogZGVmYXVsdFZhbHVlcy5zdWJ0aXRsZVRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZGVmYXVsdFZhbHVlcy5zdWJ0aXRsZVRleHRGb250IHx8IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdHlwaW5nSW5kaWNhdG9yVGV4dENvbG9yOiBkZWZhdWx0VmFsdWVzLnR5cGluZ0luZGljYXRvclRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHR5cGluZ0luZGljYXRvclRleHRGb250OiBkZWZhdWx0VmFsdWVzLnR5cGluZ0luZGljYXRvclRleHRGb250IHx8IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgaGVpZ2h0OiBkZWZhdWx0VmFsdWVzLmhlaWdodCB8fCBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBkZWZhdWx0VmFsdWVzLndpZHRoIHx8IFwiMTAwJVwiLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmF1bHRTdHlsZTtcbiAgfVxuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBvbmxpbmU6IFwiIzAwZjMwMFwiLFxuICAgIHByaXZhdGU6IFwiIzAwZjMwMFwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICBiYWNrQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcIlwiXG4gIH1cbiAgY2hlY2tTdGF0dXNUeXBlID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eSh0aGlzLnVzZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG4gICAgICByZXR1cm4gdXNlclN0YXR1c1Zpc2liaWxpdHkgPyBudWxsIDogdGhpcy5zdGF0dXNDb2xvclt0aGlzLnVzZXI/LmdldFN0YXR1cygpXTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbdGhpcy5ncm91cD8uZ2V0VHlwZSgpXTtcbiAgICB9XG4gICAgZWxzZSByZXR1cm47XG4gIH1cbiAgb25CYWNrQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkJhY2spIHtcbiAgICAgIHRoaXMub25CYWNrKClcbiAgICB9XG4gIH1cbiAgdXBkYXRlU3VidGl0bGUoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLmdyb3VwPy5nZXRNZW1iZXJzQ291bnQoKTtcbiAgICBjb25zdCBtZW1iZXJzVGV4dCA9IGxvY2FsaXplKGNvdW50ID4gMSA/IFwiTUVNQkVSU1wiIDogXCJNRU1CRVJcIik7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkgfHwgdGhpcy51c2VyLmdldEhhc0Jsb2NrZWRNZSgpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG4gICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID8gXCJcIiA6IHRoaXMudXNlci5nZXRTdGF0dXMoKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IGAke2NvdW50fSAke21lbWJlcnNUZXh0fWA7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuXG4gIH1cbiAgZ2V0U3VidGl0bGVWaWV3KCkge1xuICAgIHJldHVybiB0aGlzLnN1YnRpdGxlVmlldyh0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCk7XG4gIH1cbiAgY2hlY2tHcm91cFR5cGUoKTogc3RyaW5nIHtcbiAgICBsZXQgaW1hZ2U6IHN0cmluZyA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHN3aXRjaCAodGhpcy5ncm91cD8uZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucGFzc3dvcmRHcm91cEljb24gfHwgdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGltYWdlID0gXCJcIlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW1hZ2VcbiAgfVxuICB1cGRhdGVVc2VyU3RhdHVzKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgaWYgKHRoaXMudXNlciAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkgJiYgdGhpcy51c2VyLmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpKSB7XG4gICAgICB0aGlzLnVzZXIuc2V0U3RhdHVzKHVzZXIuZ2V0U3RhdHVzKCkpO1xuICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgfVxuICAgIC8vIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKG9ubGluZVVzZXIpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgdGhpcy5jY1VzZXJCbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLnN1YnNjcmliZShcbiAgICAgICAgICAoaXRlbTogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChpdGVtLmdldFVpZCgpID09IHRoaXMudXNlci5nZXRVaWQoKSlcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyU3RhdHVzKGl0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jY1VzZXJVbmJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlclVuYmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbS5nZXRVaWQoKSA9PSB0aGlzLnVzZXIuZ2V0VWlkKCkpXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhpdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVHlwaW5nKSB7XG4gICAgICAgIHRoaXMub25UeXBpbmdTdGFydGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ1N0YXJ0ZWQuc3Vic2NyaWJlKCh0eXBpbmdJbmRpY2F0b3I6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICAgICAgICB0aGlzLmlzVHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnNldFR5cGluZ0luZGljYXRvclRleHQodHlwaW5nSW5kaWNhdG9yKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5vblR5cGluZ0VuZGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ0VuZGVkLnN1YnNjcmliZSgodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1R5cGluZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdyb3Vwc0xpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIG5ld1Njb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICAgIGNoYW5nZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2hhbmdlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIGNoYW5nZWRHcm91cC5zZXRTY29wZShuZXdTY29wZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ3JvdXAgPSBjaGFuZ2VkR3JvdXBcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlciwga2lja2VkRnJvbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICBpZiAoa2lja2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAga2lja2VkRnJvbS5zZXRIYXNKb2luZWQoZmFsc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdyb3VwID0ga2lja2VkRnJvbVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uTWVtYmVyQWRkZWRUb0dyb3VwOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgICAgdXNlckFkZGVkOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVzZXJBZGRlZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGlmICh1c2VyQWRkZWQuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIHVzZXJBZGRlZEluLnNldEhhc0pvaW5lZCh0cnVlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ncm91cCA9IHVzZXJBZGRlZEluXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBsZWF2aW5nVXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgIGlmIChsZWF2aW5nVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ncm91cCA9IGdyb3VwXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGpvaW5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBqb2luZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICBpZiAoam9pbmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgam9pbmVkR3JvdXAuc2V0SGFzSm9pbmVkKHRydWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdyb3VwID0gam9pbmVkR3JvdXBcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZVVzZXJMaXN0ZW5lcih0aGlzLnVzZXJMaXN0ZW5lcklkKTtcbiAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLm9uVHlwaW5nRW5kZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpXG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKClcbiAgfVxuICBzZXRUeXBpbmdJbmRpY2F0b3JUZXh0ID0gKHR5cGluZzogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgIGNvbnN0IHNlbmRlciA9IHR5cGluZy5nZXRTZW5kZXIoKTtcbiAgICBjb25zdCByZWNlaXZlcklkID0gdHlwaW5nLmdldFJlY2VpdmVySWQoKTtcbiAgICBjb25zdCBsb2dnZWRJblVzZXIgPSB0aGlzLmxvZ2dlZEluVXNlcjtcblxuICAgIGlmICh0aGlzLnVzZXIgJiYgc2VuZGVyLmdldFVpZCgpID09PSB0aGlzLnVzZXI/LmdldFVpZCgpICYmIGxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IHJlY2VpdmVySWQpIHtcbiAgICAgIGNvbnN0IGlzQmxvY2tlZCA9IHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpIHx8IHRoaXMudXNlci5nZXRIYXNCbG9ja2VkTWUoKTtcbiAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN1YnRpdGxlVGV4dCA9IGxvY2FsaXplKFwiSVNfVFlQSU5HXCIpO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PT0gcmVjZWl2ZXJJZCkge1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBgJHtzZW5kZXIuZ2V0TmFtZSgpfSAke2xvY2FsaXplKFwiSVNfVFlQSU5HXCIpfWA7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgaGVhZGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgY29uc3QgaGVhZGVyU3R5bGUgPSB0aGlzLmdldEhlYWRlcnNTdHlsZSgpO1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogaGVhZGVyU3R5bGUud2lkdGgsXG4gICAgICBoZWlnaHQ6IGhlYWRlclN0eWxlLmhlaWdodCxcbiAgICAgIGJvcmRlcjogaGVhZGVyU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiBoZWFkZXJTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICBiYWNrZ3JvdW5kOiBoZWFkZXJTdHlsZS5iYWNrZ3JvdW5kLFxuICAgIH1cbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIGNvbnN0IGhlYWRlclN0eWxlID0gdGhpcy5nZXRIZWFkZXJzU3R5bGUoKTtcblxuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFN0YXR1cygpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IGhlYWRlclN0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogdGhpcy5pc1R5cGluZyA/IGhlYWRlclN0eWxlLnR5cGluZ0luZGljYXRvclRleHRGb250IDogaGVhZGVyU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLmlzVHlwaW5nID8gaGVhZGVyU3R5bGUudHlwaW5nSW5kaWNhdG9yVGV4dENvbG9yIDogaGVhZGVyU3R5bGUuc3VidGl0bGVUZXh0Q29sb3JcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlcl9fd3JhcHBlclwiIFtuZ1N0eWxlXT1cImhlYWRlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyXCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX19iYWNrLWJ1dHRvblwiICpuZ0lmPVwiIWhpZGVCYWNrQnV0dG9uXCI+XG4gICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgICAgIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGVcIlxuICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib25CYWNrQ2xpY2tlZCgpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlcl9fbGlzdGl0ZW1cIj5cbiAgICAgIDxjb21ldGNoYXQtbGlzdC1pdGVtICpuZ0lmPVwiIWxpc3RJdGVtVmlldztlbHNlIGxpc3RpdGVtXCJcbiAgICAgICAgW2F2YXRhck5hbWVdPVwidXNlcj8uZ2V0TmFtZSgpIHx8IHRoaXMuZ3JvdXA/LmdldE5hbWUoKVwiXG4gICAgICAgIFthdmF0YXJVUkxdPVwidGhpcy51c2VyPy5nZXRBdmF0YXIoKSB8fCB0aGlzLmdyb3VwPy5nZXRJY29uKClcIlxuICAgICAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImNoZWNrU3RhdHVzVHlwZSgpXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvckljb25dPVwiY2hlY2tHcm91cFR5cGUoKVwiXG4gICAgICAgIFt0aXRsZV09XCJ0aGlzLnVzZXI/LmdldE5hbWUoKSB8fCB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbaGlkZVNlcGFyYXRvcl09XCJ0cnVlXCIgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCI+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgIDxkaXYgKm5nSWY9XCIhc3VidGl0bGVWaWV3OyBlbHNlIHN1YnRpdGxlXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cInN1YnRpdGxlVGV4dFwiXG4gICAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiPlxuXG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3N1YnRpdGxlPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiB1c2VyID8/IGdyb3VwIH1cIj5cblxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjbGlzdGl0ZW0+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJsaXN0SXRlbVZpZXdcIj5cblxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX21lbnVcIiAqbmdJZj1cIm1lbnVcIj5cbiAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudTtjb250ZXh0OnsgJGltcGxpY2l0OiB1c2VyID8/IGdyb3VwIH1cIj5cblxuICAgIDwvbmctY29udGFpbmVyPlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19