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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQWEsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDakYsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFrRyxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFOVEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBRTFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTdELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQzs7OztBQUUvRDs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTywrQkFBK0I7SUFnRTFDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxH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QUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFHRyxNQUFNO3NCQUFkLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdmF0YXJTdHlsZSwgQmFzZVN0eWxlLCBMaXN0SXRlbVN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXRHcm91cEV2ZW50cywgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cywgQ29tZXRDaGF0VGhlbWUsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBDb21ldENoYXRVc2VyRXZlbnRzLCBJR3JvdXBMZWZ0LCBJR3JvdXBNZW1iZXJBZGRlZCwgSUdyb3VwTWVtYmVySm9pbmVkLCBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsIElPd25lcnNoaXBDaGFuZ2VkLCBmb250SGVscGVyLCBsb2NhbGl6ZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcblxuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSAnQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0JztcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvbic7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IE1lc3NhZ2VIZWFkZXJTdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgTWVzc2FnZVV0aWxzIH0gZnJvbSAnLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlscyc7XG5cbi8qKlxuKlxuKiBDb21ldENoYXRNZXNzYWdlSGVhZGVyIGlzIGEgdXNlZCB0byByZW5kZXIgbGlzdGl0ZW0gY29tcG9uZW50LlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5jb21wb25lbnQuc2NzcyddLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlSGVhZGVyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuXG4gIH1cbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH1cbiAgQElucHV0KCkgbWVzc2FnZUhlYWRlclN0eWxlOiBNZXNzYWdlSGVhZGVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gIH1cbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjJweFwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICB9XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldzogYW55O1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBkaXNhYmxlVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIC8qKlxuICogQGRlcHJlY2F0ZWRcbiAqXG4gKiBUaGlzIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgYXMgb2YgdmVyc2lvbiA0LjMuNyBkdWUgdG8gbmV3ZXIgcHJvcGVydHkgJ3Bhc3N3b3JkR3JvdXBJY29uJy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHN1YnNlcXVlbnQgdmVyc2lvbnMuXG4gKi9cbiAgQElucHV0KCkgcHJvdGVjdGVkR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHBhc3N3b3JkR3JvdXBJY29uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIHByaXZhdGVHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gIEBJbnB1dCgpIG1lbnU6IGFueTtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgYmFja0J1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2JhY2tidXR0b24uc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVCYWNrQnV0dG9uOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIG9uQmFjazogKCkgPT4gdm9pZCA9ICgpID0+IHsgfVxuICBwdWJsaWMgZ3JvdXBzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJncm91cHNMaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHVzZXJMaXN0ZW5lcklkID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgc3VidGl0bGVUZXh0OiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIHB1YmxpYyBpc1R5cGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICB0aGVtZTogQ29tZXRDaGF0VGhlbWUgPSBuZXcgQ29tZXRDaGF0VGhlbWUoe30pXG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdTdGFydGVkITogU3Vic2NyaXB0aW9uO1xuICBjY1VzZXJCbG9ja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY1VzZXJVbmJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHlwaW5nRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkge1xuICB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlc1tcInVzZXJcIl0gfHwgY2hhbmdlc1tcImdyb3VwXCJdKSB7XG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKClcbiAgICAgIGlmICghdGhpcy5sb2dnZWRJblVzZXIpIHtcbiAgICAgICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlciBhcyBDb21ldENoYXQuVXNlcjtcbiAgICAgICAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cblxuICAgIH1cbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKVxuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmJhY2tCdXR0b25TdHlsZS5idXR0b25JY29uVGludCA9IHRoaXMubWVzc2FnZUhlYWRlclN0eWxlPy5iYWNrQnV0dG9uSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5vbmxpbmUgPSB0aGlzLm1lc3NhZ2VIZWFkZXJTdHlsZS5vbmxpbmVTdGF0dXNDb2xvciA/PyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKVxuXG4gIH1cbiAgLy8gc3Vic2NyaWJlIHRvIGdsb2JhbCBldmVudHNcbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT0gaXRlbT8udXNlckFkZGVkSW4hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LnVzZXJBZGRlZEluO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PSBpdGVtPy5raWNrZWRGcm9tIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5raWNrZWRGcm9tO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVySm9pbmVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVySm9pbmVkKSA9PiB7XG4gICAgICBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSA9PSBpdGVtPy5qb2luZWRHcm91cCEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuZ3JvdXAgPT0gaXRlbT8uam9pbmVkR3JvdXA7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NPd25lcnNoaXBDaGFuZ2VkLnN1YnNjcmliZSgoaXRlbTogSU93bmVyc2hpcENoYW5nZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/Lmdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5ncm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cExlZnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmxlZnRHcm91cCEuZ2V0R3VpZCgpICYmIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PSBpdGVtPy51c2VyTGVmdD8uZ2V0VWlkKCkpIHtcbiAgICAgICAgdGhpcy5ncm91cCA9PSBpdGVtPy5sZWZ0R3JvdXA7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIC8vIHVuc3Vic2NyaWJlIHRvIHN1YnNjcmliZWQgZXZlbnRzLlxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyQmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjVXNlclVuYmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBMZWZ0Py51bnN1YnNjcmliZSgpO1xuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogXCJcIixcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gICAgfSlcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH1cbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcblxuICAgIH1cbiAgICBpZighdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSl7XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlIH1cbiAgICB9ZWxzZSB7XG4gICAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0ge307XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBsZXQgdXNlclN0YXR1c1Zpc2liaWxpdHkgPSBuZXcgTWVzc2FnZVV0aWxzKCkuZ2V0VXNlclN0YXR1c1Zpc2liaWxpdHkodXNlcikgfHwgdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZTtcbiAgICBpZighdXNlclN0YXR1c1Zpc2liaWxpdHkpe1xuICAgICAgcmV0dXJuKFxuICAgICAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGdldEhlYWRlcnNTdHlsZSgpOiBNZXNzYWdlSGVhZGVyU3R5bGUge1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB0aGlzLm1lc3NhZ2VIZWFkZXJTdHlsZTtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBNZXNzYWdlSGVhZGVyU3R5bGUgPSBuZXcgTWVzc2FnZUhlYWRlclN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IGRlZmF1bHRWYWx1ZXMuYmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogZGVmYXVsdFZhbHVlcy5ib3JkZXIgfHwgYG5vbmVgLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IGRlZmF1bHRWYWx1ZXMub25saW5lU3RhdHVzQ29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogZGVmYXVsdFZhbHVlcy5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZDogZGVmYXVsdFZhbHVlcy5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQgfHwgXCJSR0IoMjQ3LCAxNjUsIDApXCIsXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IGRlZmF1bHRWYWx1ZXMuYmFja0J1dHRvbkljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IGRlZmF1bHRWYWx1ZXMuc3VidGl0bGVUZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGRlZmF1bHRWYWx1ZXMuc3VidGl0bGVUZXh0Rm9udCB8fCBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHR5cGluZ0luZGljYXRvclRleHRDb2xvcjogZGVmYXVsdFZhbHVlcy50eXBpbmdJbmRpY2F0b3JUZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB0eXBpbmdJbmRpY2F0b3JUZXh0Rm9udDogZGVmYXVsdFZhbHVlcy50eXBpbmdJbmRpY2F0b3JUZXh0Rm9udCB8fCBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIGhlaWdodDogZGVmYXVsdFZhbHVlcy5oZWlnaHQgfHwgXCI0NXB4XCIsXG4gICAgICB3aWR0aDogZGVmYXVsdFZhbHVlcy53aWR0aCB8fCBcIjEwMCVcIixcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZhdWx0U3R5bGU7XG4gIH1cbiAgcHVibGljIHN0YXR1c0NvbG9yOiBhbnkgPSB7XG4gICAgb25saW5lOiBcIiMwMGYzMDBcIixcbiAgICBwcml2YXRlOiBcIiMwMGYzMDBcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiXG4gIH1cbiAgYmFja0J1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogXCJcIlxuICB9XG4gIGNoZWNrU3RhdHVzVHlwZSA9ICgpID0+IHtcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICBsZXQgdXNlclN0YXR1c1Zpc2liaWxpdHkgPSBuZXcgTWVzc2FnZVV0aWxzKCkuZ2V0VXNlclN0YXR1c1Zpc2liaWxpdHkodGhpcy51c2VyKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgICAgcmV0dXJuIHVzZXJTdGF0dXNWaXNpYmlsaXR5ID8gbnVsbCA6IHRoaXMuc3RhdHVzQ29sb3JbdGhpcy51c2VyPy5nZXRTdGF0dXMoKV07XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yW3RoaXMuZ3JvdXA/LmdldFR5cGUoKV07XG4gICAgfVxuICAgIGVsc2UgcmV0dXJuO1xuICB9XG4gIG9uQmFja0NsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25CYWNrKSB7XG4gICAgICB0aGlzLm9uQmFjaygpXG4gICAgfVxuICB9XG4gIHVwZGF0ZVN1YnRpdGxlKCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5ncm91cD8uZ2V0TWVtYmVyc0NvdW50KCk7XG4gICAgY29uc3QgbWVtYmVyc1RleHQgPSBsb2NhbGl6ZShjb3VudCA+IDEgPyBcIk1FTUJFUlNcIiA6IFwiTUVNQkVSXCIpO1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpIHx8IHRoaXMudXNlci5nZXRIYXNCbG9ja2VkTWUoKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSB1c2VyU3RhdHVzVmlzaWJpbGl0eSA/IFwiXCIgOiB0aGlzLnVzZXIuZ2V0U3RhdHVzKCk7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBgJHtjb3VudH0gJHttZW1iZXJzVGV4dH1gO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cblxuICB9XG4gIGdldFN1YnRpdGxlVmlldygpIHtcbiAgICByZXR1cm4gdGhpcy5zdWJ0aXRsZVZpZXcodGhpcy51c2VyIHx8IHRoaXMuZ3JvdXApO1xuICB9XG4gIGNoZWNrR3JvdXBUeXBlKCk6IHN0cmluZyB7XG4gICAgbGV0IGltYWdlOiBzdHJpbmcgPSBcIlwiO1xuICAgIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuZ3JvdXA/LmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnBhc3N3b3JkR3JvdXBJY29uIHx8IHRoaXMucHJvdGVjdGVkR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZTpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpbWFnZSA9IFwiXCJcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGltYWdlXG4gIH1cbiAgdXBkYXRlVXNlclN0YXR1cyh1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFVpZCgpICYmIHRoaXMudXNlci5nZXRVaWQoKSA9PT0gdXNlci5nZXRVaWQoKSkge1xuICAgICAgdGhpcy51c2VyLnNldFN0YXR1cyh1c2VyLmdldFN0YXR1cygpKTtcbiAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgIH1cbiAgICAvLyB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhvbmxpbmVVc2VyKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhvZmZsaW5lVXNlcik7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIHRoaXMuY2NVc2VyQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbS5nZXRVaWQoKSA9PSB0aGlzLnVzZXIuZ2V0VWlkKCkpXG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlclN0YXR1cyhpdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuY2NVc2VyVW5ibG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJVbmJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0uZ2V0VWlkKCkgPT0gdGhpcy51c2VyLmdldFVpZCgpKVxuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXJTdGF0dXMoaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZykge1xuICAgICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdTdGFydGVkLnN1YnNjcmliZSgodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1R5cGluZyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zZXRUeXBpbmdJbmRpY2F0b3JUZXh0KHR5cGluZ0luZGljYXRvcilcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMub25UeXBpbmdFbmRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdFbmRlZC5zdWJzY3JpYmUoKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIHRoaXMuaXNUeXBpbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ncm91cHNMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgICBvbGRTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgICBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgaWYgKGNoYW5nZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICBjaGFuZ2VkR3JvdXAuc2V0U2NvcGUobmV3U2NvcGUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdyb3VwID0gY2hhbmdlZEdyb3VwXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGtpY2tlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBraWNrZWRCeTogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEZyb206IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgICAgaWYgKGtpY2tlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIGtpY2tlZEZyb20uc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ncm91cCA9IGtpY2tlZEZyb21cbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVTdWJ0aXRsZSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRJbjogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICBpZiAodXNlckFkZGVkLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICB1c2VyQWRkZWRJbi5zZXRIYXNKb2luZWQodHJ1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ3JvdXAgPSB1c2VyQWRkZWRJblxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICBpZiAobGVhdmluZ1VzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIGdyb3VwLnNldEhhc0pvaW5lZChmYWxzZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ3JvdXAgPSBncm91cFxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1YnRpdGxlKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBqb2luZWRVc2VyOiBDb21ldENoYXQuVXNlciwgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgICAgaWYgKGpvaW5lZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIGpvaW5lZEdyb3VwLnNldEhhc0pvaW5lZCh0cnVlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ncm91cCA9IGpvaW5lZEdyb3VwXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VidGl0bGUoKVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZCk7XG4gICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5vblR5cGluZ0VuZGVkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKVxuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cbiAgc2V0VHlwaW5nSW5kaWNhdG9yVGV4dCA9ICh0eXBpbmc6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICBjb25zdCBzZW5kZXIgPSB0eXBpbmcuZ2V0U2VuZGVyKCk7XG4gICAgY29uc3QgcmVjZWl2ZXJJZCA9IHR5cGluZy5nZXRSZWNlaXZlcklkKCk7XG4gICAgY29uc3QgbG9nZ2VkSW5Vc2VyID0gdGhpcy5sb2dnZWRJblVzZXI7XG5cbiAgICBpZiAodGhpcy51c2VyICYmIHNlbmRlci5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJiBsb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSByZWNlaXZlcklkKSB7XG4gICAgICBjb25zdCBpc0Jsb2NrZWQgPSB0aGlzLnVzZXIuZ2V0QmxvY2tlZEJ5TWUoKSB8fCB0aGlzLnVzZXIuZ2V0SGFzQmxvY2tlZE1lKCk7XG4gICAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdWJ0aXRsZVRleHQgPSBsb2NhbGl6ZShcIklTX1RZUElOR1wiKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkgPT09IHJlY2VpdmVySWQpIHtcbiAgICAgIHRoaXMuc3VidGl0bGVUZXh0ID0gYCR7c2VuZGVyLmdldE5hbWUoKX0gJHtsb2NhbGl6ZShcIklTX1RZUElOR1wiKX1gO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIGhlYWRlclN0eWxlID0gKCkgPT4ge1xuICAgIGNvbnN0IGhlYWRlclN0eWxlID0gdGhpcy5nZXRIZWFkZXJzU3R5bGUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IGhlYWRlclN0eWxlLndpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWFkZXJTdHlsZS5oZWlnaHQsXG4gICAgICBib3JkZXI6IGhlYWRlclN0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogaGVhZGVyU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDogaGVhZGVyU3R5bGUuYmFja2dyb3VuZCxcbiAgICB9XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICBjb25zdCBoZWFkZXJTdHlsZSA9IHRoaXMuZ2V0SGVhZGVyc1N0eWxlKCk7XG5cbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRTdGF0dXMoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vbmxpbmUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBoZWFkZXJTdHlsZS5zdWJ0aXRsZVRleHRGb250LFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IHRoaXMuaXNUeXBpbmcgPyBoZWFkZXJTdHlsZS50eXBpbmdJbmRpY2F0b3JUZXh0Rm9udCA6IGhlYWRlclN0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy5pc1R5cGluZyA/IGhlYWRlclN0eWxlLnR5cGluZ0luZGljYXRvclRleHRDb2xvciA6IGhlYWRlclN0eWxlLnN1YnRpdGxlVGV4dENvbG9yXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJoZWFkZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlclwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWhlYWRlcl9fYmFjay1idXR0b25cIiAqbmdJZj1cIiFoaWRlQmFja0J1dHRvblwiPlxuICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIlxuICAgICAgICBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlXCJcbiAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQmFja0NsaWNrZWQoKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1oZWFkZXJfX2xpc3RpdGVtXCI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSAqbmdJZj1cIiFsaXN0SXRlbVZpZXc7ZWxzZSBsaXN0aXRlbVwiXG4gICAgICAgIFthdmF0YXJOYW1lXT1cInVzZXI/LmdldE5hbWUoKSB8fCB0aGlzLmdyb3VwPy5nZXROYW1lKClcIlxuICAgICAgICBbYXZhdGFyVVJMXT1cInRoaXMudXNlcj8uZ2V0QXZhdGFyKCkgfHwgdGhpcy5ncm91cD8uZ2V0SWNvbigpXCJcbiAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJjaGVja1N0YXR1c1R5cGUoKVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JJY29uXT1cImNoZWNrR3JvdXBUeXBlKClcIlxuICAgICAgICBbdGl0bGVdPVwidGhpcy51c2VyPy5nZXROYW1lKCkgfHwgdGhpcy5ncm91cD8uZ2V0TmFtZSgpXCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwidHJ1ZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSh1c2VyKVwiXG4gICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXN1YnRpdGxlVmlldzsgZWxzZSBzdWJ0aXRsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIlxuICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIj5cblxuICAgICAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNzdWJ0aXRsZT5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCB9XCI+XG5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgICA8bmctdGVtcGxhdGUgI2xpc3RpdGVtPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibGlzdEl0ZW1WaWV3XCI+XG5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtaGVhZGVyX19tZW51XCIgKm5nSWY9XCJtZW51XCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnU7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCB9XCI+XG5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdfQ==