import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { BannedMembersStyle, ListStyle } from '@cometchat/uikit-shared';
import { fontHelper, localize, CometChatGroupEvents, SelectionMode, CometChatUIKitConstants, States, TitleAlignment, } from '@cometchat/uikit-resources';
import '@cometchat/uikit-elements';
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatList/cometchat-list.component";
import * as i3 from "@angular/common";
/**
*
* CometChatBannedMembersComponent is used to render list of banned members
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatBannedMembersComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.disableUsersPresence = true;
        this.backButtonIconURL = "assets/backbutton.svg";
        this.closeButtonIconURL = "assets/close2x.svg";
        this.showBackButton = true;
        this.hideSeparator = false;
        this.selectionMode = SelectionMode.none;
        this.searchPlaceholder = "Search Members";
        this.searchIconURL = "assets/search.svg";
        this.hideSearch = true;
        this.title = localize("BANNED_MEMBERS");
        this.onError = (error) => {
            console.log(error);
        };
        this.loadingIconURL = "assets/Spinner.svg";
        this.emptyStateText = localize("NO_BANNED_MEMBERS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.titleAlignment = TitleAlignment.center;
        this.unbanIconURL = "assets/close2x.svg";
        this.statusIndicatorStyle = {
            height: "10px",
            width: "10px",
            borderRadius: "16px",
            border: ""
        };
        this.menuListStyle = {
            width: "",
            height: "",
            border: "none",
            borderRadius: "8px",
            background: "white",
            textFont: "400 15px Inter",
            textColor: "black",
            iconTint: "rgb(51, 153, 255)",
            iconBackground: "transparent",
            iconBorder: "none",
            iconBorderRadius: "0",
            submenuWidth: "100%",
            submenuHeight: "100%",
            submenuBorder: "1px solid #e8e8e8",
            submenuBorderRadius: "8px",
            submenuBackground: "white",
        };
        this.unbanIconStyle = {
            border: "none",
            background: "transparent",
            buttonIconTint: "rgb(51, 153, 255)"
        };
        this.titleAlignmentEnum = TitleAlignment;
        this.selectionmodeEnum = SelectionMode;
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.bannedMembersStyle = {
            width: "100%",
            height: "100%",
            background: "",
            border: "",
            borderRadius: "",
            padding: "0 100px"
        };
        this.listItemStyle = {
            height: "100%",
            width: "100%",
            background: "",
            activeBackground: "transparent",
            borderRadius: "grey",
            titleFont: "",
            titleColor: "",
            border: "",
            hoverBackground: "transparent",
            separatorColor: "rgb(222 222 222 / 46%)"
        };
        this.searchKeyword = "";
        this.listStyle = new ListStyle({});
        this.limit = 30;
        this.state = States.loading;
        this.bannedMembers = [];
        this.scopes = [];
        this.membersListenerId = "bannedMembers_" + new Date().getTime();
        this.membersList = [];
        this.onScrolledToBottom = null;
        /**
       * @param  {CometChat.GroupMember} member
       */
        this.getStatusIndicatorColor = (member) => {
            if (!this.disableUsersPresence) {
                if (member?.getStatus() == CometChatUIKitConstants.userStatusType.online) {
                    return this.bannedMembersStyle.onlineStatusColor || this.themeService.theme.palette.getSuccess();
                }
                else {
                    return null;
                }
            }
            return null;
        };
        this.unBanMember = (member) => {
            CometChat.unbanGroupMember(this.group.getGuid(), member.getUid()).then(() => {
                CometChatGroupEvents.ccGroupMemberUnbanned.next({
                    unbannedBy: this.loggedInUser,
                    unbannedFrom: this.group,
                    unbannedUser: member
                });
                this.updateMember(member);
            }).catch((err) => {
                if (this.onError) {
                    this.onError(err);
                }
            });
        };
        /**
         * @param  {CometChat.User} member
         */
        this.updateMember = (member) => {
            let memberlist = [...this.bannedMembers];
            //search for user
            let userKey = memberlist.findIndex((u, k) => u.getUid() == member.getUid());
            //if found in the list, update user object
            if (userKey > -1) {
                memberlist.splice(userKey, 1);
                this.bannedMembers = [...memberlist];
                this.ref.detectChanges();
            }
            else {
                memberlist.push(member);
                this.bannedMembers = [...memberlist];
                this.ref.detectChanges();
            }
        };
        /**
       * @param  {CometChat.User} member
       */
        this.updateMemberStatus = (member) => {
            if (!this.disableUsersPresence) {
                let memberlist = [...this.bannedMembers];
                //search for user
                let userKey = memberlist.findIndex((u, k) => u.getUid() == member.getUid());
                //if found in the list, update user object
                if (userKey > -1) {
                    let user = memberlist[userKey];
                    user.setStatus(member.getStatus());
                    memberlist.splice(userKey, 1, user);
                    this.bannedMembers = [...memberlist];
                    this.ref.detectChanges();
                }
            }
        };
        this.fetchNextBannedMembers = () => {
            this.onScrolledToBottom = null;
            if (this.bannedMembersRequest && this.bannedMembersRequest.pagination && (this.bannedMembersRequest.pagination.current_page == 0 || this.bannedMembersRequest.pagination.current_page != this.bannedMembersRequest.pagination.total_pages)) {
                this.onScrolledToBottom = this.fetchNextBannedMembers;
                this.state = States.loading;
                this.ref.detectChanges();
                try {
                    this.bannedMembersRequest.fetchNext().then((bannedMembers) => {
                        this.state = States.loading;
                        if ((bannedMembers.length <= 0 && this.bannedMembers?.length <= 0) || (bannedMembers.length === 0 && this.bannedMembers?.length <= 0)) {
                            this.state = States.empty;
                            this.ref.detectChanges();
                        }
                        else {
                            this.state = States.loaded;
                            this.bannedMembers = [...this.bannedMembers, ...bannedMembers];
                            this.ref.detectChanges();
                        }
                    }, (error) => {
                        if (this.onError) {
                            this.onError(CometChatException(error));
                        }
                        this.state = States.error;
                        this.ref.detectChanges();
                    });
                }
                catch (error) {
                    if (this.onError) {
                        this.onError(CometChatException(error));
                    }
                    this.state = States.error;
                    this.ref.detectChanges();
                }
            }
            else {
                this.state = States.loaded;
            }
        };
        /**
         * @param  {string} key
         */
        this.onSearch = (key) => {
            try {
                this.searchKeyword = key;
                clearTimeout(this.timeout);
                this.timeout = setTimeout(() => {
                    const request = this.searchRequestBuilder ? this.searchRequestBuilder.setSearchKeyword(this.searchKeyword).build() : this.getRequestBuilder();
                    this.bannedMembersRequest = request;
                    this.bannedMembers = [];
                    this.fetchNextBannedMembers();
                }, 500);
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.membersStyles = () => {
            return {
                padding: this.bannedMembersStyle.padding
            };
        };
        // styles
        this.backButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.bannedMembersStyle.backButtonIconTint || this.themeService.theme.palette.getPrimary()
            };
        };
        this.closeButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.bannedMembersStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
            };
        };
        this.wrapperStyle = () => {
            return {
                height: this.bannedMembersStyle.height,
                width: this.bannedMembersStyle.width,
                background: this.bannedMembersStyle.background,
                border: this.bannedMembersStyle.border,
                borderRadius: this.bannedMembersStyle.borderRadius
            };
        };
    }
    ngOnInit() {
        this.attachListeners();
        this.onScrolledToBottom = this.fetchNextBannedMembers;
        this.setThemeStyle();
        CometChat.getLoggedinUser().then((user) => {
            this.loggedInUser = user;
            this.bannedMembersRequest = this.getRequestBuilder();
            this.fetchNextBannedMembers();
        }).catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    backClicked() {
        if (this.onBack) {
            this.onBack();
        }
    }
    closeClicked() {
        if (this.onClose) {
            this.onClose();
        }
    }
    onMembersSelected(member, event) {
        let selected = event.detail.checked;
        if (this.onSelect) {
            this.onSelect(member, selected);
        }
    }
    attachListeners() {
        //Attaching User Listeners to dynamilcally update when a user comes online and goes offline
        CometChat.addUserListener(this.membersListenerId, new CometChat.UserListener({
            onUserOnline: (onlineUser) => {
                /* when someuser/friend comes online, user will be received here */
                this.updateMemberStatus(onlineUser);
            },
            onUserOffline: (offlineUser) => {
                /* when someuser/friend went offline, user will be received here */
                this.updateMemberStatus(offlineUser);
            },
        }));
        CometChat.addGroupListener(this.membersListenerId, new CometChat.GroupListener({
            onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                this.updateMember(bannedUser);
            },
            onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                this.updateMember(unbannedUser);
            },
        }));
    }
    removeListener() {
        CometChat.removeUserListener(this.membersListenerId);
        this.membersListenerId = "";
    }
    getRequestBuilder() {
        if (this.searchRequestBuilder) {
            return this.searchRequestBuilder.build();
        }
        else if (this.bannedMembersRequestBuilder) {
            return this.bannedMembersRequestBuilder.build();
        }
        else {
            return new CometChat.BannedMembersRequestBuilder(this.group?.getGuid())
                .setLimit(this.limit)
                .setSearchKeyword(this.searchKeyword)
                .build();
        }
    }
    subscribeToEvents() {
        this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
            if (item?.kickedFrom?.getGuid() == this.group.getGuid()) {
                this.updateMember(item?.kickedUser);
            }
        });
    }
    // unsubscribe to subscribed events.
    unsubscribeToEvents() {
        this.ccGroupMemberBanned.unsubscribe();
    }
    setThemeStyle() {
        this.setBanMembersStyle();
        this.setListItemStyle();
        this.setAvatarStyle();
        this.setStatusStyle();
        this.menuListStyle.background = this.themeService.theme.palette.getBackground();
        this.menuListStyle.iconBackground = this.themeService.theme.palette.getBackground();
        this.menuListStyle.iconTint = this.themeService.theme.palette.getAccent400();
        this.menuListStyle.submenuBackground = this.themeService.theme.palette.getBackground();
        this.menuListStyle.textFont = fontHelper(this.themeService.theme.typography.caption1);
        this.menuListStyle.textColor = this.themeService.theme.palette.getAccent500();
        this.unbanIconStyle.buttonIconTint = this.bannedMembersStyle.unbanIconTint;
    }
    setBanMembersStyle() {
        let defaultStyle = new BannedMembersStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            separatorColor: this.themeService.theme.palette.getAccent400(),
            width: "100%",
            height: "100%",
            borderRadius: "none",
            searchIconTint: this.themeService.theme.palette.getAccent600(),
            searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            searchBackground: this.themeService.theme.palette.getAccent100(),
            searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchTextColor: this.themeService.theme.palette.getAccent600(),
            searchTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchBorderRadius: "8px",
            closeButtonIconTint: this.themeService.theme.palette.getPrimary(),
            backButtonIconTint: this.themeService.theme.palette.getPrimary(),
            padding: "0 100px",
            unbanIconTint: this.themeService.theme.palette.getPrimary()
        });
        this.bannedMembersStyle = { ...defaultStyle, ...this.bannedMembersStyle };
        this.listStyle = {
            titleTextFont: this.bannedMembersStyle.titleTextFont,
            titleTextColor: this.bannedMembersStyle.titleTextColor,
            emptyStateTextFont: this.bannedMembersStyle.emptyStateTextFont,
            emptyStateTextColor: this.bannedMembersStyle.emptyStateTextColor,
            errorStateTextFont: this.bannedMembersStyle.errorStateTextFont,
            errorStateTextColor: this.bannedMembersStyle.errorStateTextColor,
            loadingIconTint: this.bannedMembersStyle.loadingIconTint,
            separatorColor: this.bannedMembersStyle.separatorColor,
            searchIconTint: this.bannedMembersStyle.searchIconTint,
            searchBorder: this.bannedMembersStyle.searchBorder,
            searchBorderRadius: this.bannedMembersStyle.searchBorderRadius,
            searchBackground: this.bannedMembersStyle.searchBackground,
            searchPlaceholderTextFont: this.bannedMembersStyle.searchPlaceholderTextFont,
            searchPlaceholderTextColor: this.bannedMembersStyle.searchPlaceholderTextColor,
            searchTextFont: this.bannedMembersStyle.searchTextFont,
            searchTextColor: this.bannedMembersStyle.searchTextColor,
        };
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
    setListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: "",
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            hoverBackground: ""
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
}
CometChatBannedMembersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatBannedMembersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatBannedMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatBannedMembersComponent, selector: "cometchat-banned-members", inputs: { bannedMembersRequestBuilder: "bannedMembersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onSelect: "onSelect", onBack: "onBack", onClose: "onClose", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", unbanIconURL: "unbanIconURL", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", bannedMembersStyle: "bannedMembersStyle", listItemStyle: "listItemStyle" }, ngImport: i0, template: "<div class=\"cc-banned-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-banned-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"   (cc-button-clicked)=\"backClicked()\" >\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-banned-members__wrapper\" [ngStyle]=\"membersStyles()\">\n    <div class=\"cc-banned-members__menus\" *ngIf=\"menu\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n  </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n        [list]=\"bannedMembers\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n        [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"  [title]=\"title\"\n\n        [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n        [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n        [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-bannedMember>\n        <cometchat-list-item [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [statusIndicatorColor]=\"getStatusIndicatorColor(bannedMember)\" [title]=\"bannedMember?.name\" [avatarURL]=\"bannedMember?.avatar\" [avatarName]=\"bannedMember?.name\"\n            [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n [hideSeparator]=\"hideSeparator\">\n            <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-banned-members__subtitle-view\">\n                <ng-container *ngTemplateOutlet=\"subtitleView\">\n                </ng-container>\n            </div>\n            <div slot=\"menuView\"  *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(bannedMember)\"  [menuListStyle]=\"menuListStyle\"></cometchat-menu-list>\n          </div>\n          <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none; else changeScope\" class=\"cc-banned-members__tail-view\">\n            <ng-container *ngTemplateOutlet=\"tailView\">\n            </ng-container>\n        </div>\n        <ng-template  #changeScope>\n         <div  slot=\"tailView\">\n          <div class=\"cc-banned-members__unban\">\n            <cometchat-button [buttonStyle]=\"unbanIconStyle\" [iconURL]=\"unbanIconURL\" (click)=\"unBanMember(bannedMember)\">\n\n            </cometchat-button>\n          </div>\n         </div>\n        </ng-template>\n        </cometchat-list-item>\n        <ng-template #tailView>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-banned-members__selection--single\">\n            <cometchat-radio-button (cc-radio-button-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-radio-button>\n          </div>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-banned-members__selection--multiple\">\n            <cometchat-checkbox (cc-checkbox-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-checkbox>\n          </div>\n        </ng-template>\n    </ng-template>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-banned-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-banned-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-banned-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-banned-members__tail-view{position:relative}.cc-banned-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-banned-members__unban{display:flex;align-items:center;justify-content:flex-end;width:100px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatBannedMembersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-banned-members", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-banned-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-banned-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"   (cc-button-clicked)=\"backClicked()\" >\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-banned-members__wrapper\" [ngStyle]=\"membersStyles()\">\n    <div class=\"cc-banned-members__menus\" *ngIf=\"menu\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n  </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n        [list]=\"bannedMembers\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n        [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"  [title]=\"title\"\n\n        [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n        [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n        [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-bannedMember>\n        <cometchat-list-item [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [statusIndicatorColor]=\"getStatusIndicatorColor(bannedMember)\" [title]=\"bannedMember?.name\" [avatarURL]=\"bannedMember?.avatar\" [avatarName]=\"bannedMember?.name\"\n            [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n [hideSeparator]=\"hideSeparator\">\n            <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-banned-members__subtitle-view\">\n                <ng-container *ngTemplateOutlet=\"subtitleView\">\n                </ng-container>\n            </div>\n            <div slot=\"menuView\"  *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(bannedMember)\"  [menuListStyle]=\"menuListStyle\"></cometchat-menu-list>\n          </div>\n          <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none; else changeScope\" class=\"cc-banned-members__tail-view\">\n            <ng-container *ngTemplateOutlet=\"tailView\">\n            </ng-container>\n        </div>\n        <ng-template  #changeScope>\n         <div  slot=\"tailView\">\n          <div class=\"cc-banned-members__unban\">\n            <cometchat-button [buttonStyle]=\"unbanIconStyle\" [iconURL]=\"unbanIconURL\" (click)=\"unBanMember(bannedMember)\">\n\n            </cometchat-button>\n          </div>\n         </div>\n        </ng-template>\n        </cometchat-list-item>\n        <ng-template #tailView>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-banned-members__selection--single\">\n            <cometchat-radio-button (cc-radio-button-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-radio-button>\n          </div>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-banned-members__selection--multiple\">\n            <cometchat-checkbox (cc-checkbox-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-checkbox>\n          </div>\n        </ng-template>\n    </ng-template>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-banned-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-banned-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-banned-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-banned-members__tail-view{position:relative}.cc-banned-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-banned-members__unban{display:flex;align-items:center;justify-content:flex-end;width:100px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { bannedMembersRequestBuilder: [{
                type: Input
            }], searchRequestBuilder: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], menu: [{
                type: Input
            }], options: [{
                type: Input
            }], backButtonIconURL: [{
                type: Input
            }], closeButtonIconURL: [{
                type: Input
            }], showBackButton: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], searchPlaceholder: [{
                type: Input
            }], searchIconURL: [{
                type: Input
            }], hideSearch: [{
                type: Input
            }], title: [{
                type: Input
            }], onError: [{
                type: Input
            }], onSelect: [{
                type: Input
            }], onBack: [{
                type: Input
            }], onClose: [{
                type: Input
            }], group: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], unbanIconURL: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], bannedMembersStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMvY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMvY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVcsS0FBSyxFQUFxQix1QkFBdUIsRUFBZSxNQUFNLGVBQWUsQ0FBQztBQUNuSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUFFLGtCQUFrQixFQUFZLFNBQVMsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RyxPQUFPLEVBQWlCLFVBQVUsRUFBRSxRQUFRLEVBQWtCLG9CQUFvQixFQUFDLGFBQWEsRUFBRSx1QkFBdUIsRUFBNEIsTUFBTSxFQUFFLGNBQWMsR0FBRSxNQUFNLDRCQUE0QixDQUFBO0FBQy9NLE9BQU8sMkJBQTJCLENBQUE7QUFDbEMsT0FBUSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQTtBQUV0RSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQzs7Ozs7QUFDMUU7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sK0JBQStCO0lBc0cxQyxZQUFvQixHQUFzQixFQUFTLFlBQWtDO1FBQWpFLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVMsaUJBQVksR0FBWixZQUFZLENB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QUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBSUcsUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxNQUFNO3NCQUFkLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBZ0NHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBS0csa0JBQWtCO3NCQUExQixLQUFLO2dCQVNHLGFBQWE7c0JBQXJCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgIElucHV0LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIFRlbXBsYXRlUmVmIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBCYW5uZWRNZW1iZXJzU3R5bGUsQmFzZVN0eWxlLCBMaXN0U3R5bGUsQ29tZXRDaGF0VUlLaXRVdGlsaXR5ICB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCB7Q29tZXRDaGF0VGhlbWUsIGZvbnRIZWxwZXIsIGxvY2FsaXplLENvbWV0Q2hhdE9wdGlvbiwgQ29tZXRDaGF0R3JvdXBFdmVudHMsU2VsZWN0aW9uTW9kZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgU3RhdGVzLCBUaXRsZUFsaWdubWVudCx9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJ1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0ICB7IEF2YXRhclN0eWxlLCBMaXN0SXRlbVN0eWxlfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbi8qKlxuKlxuKiBDb21ldENoYXRCYW5uZWRNZW1iZXJzQ29tcG9uZW50IGlzIHVzZWQgdG8gcmVuZGVyIGxpc3Qgb2YgYmFubmVkIG1lbWJlcnNcbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtYmFubmVkLW1lbWJlcnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1iYW5uZWQtbWVtYmVycy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOkNoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRCYW5uZWRNZW1iZXJzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgYmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LkJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTpib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOiAoKG1lbWJlcjpDb21ldENoYXQuR3JvdXBNZW1iZXIpPT5Db21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDpzdHJpbmcgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiXG4gIEBJbnB1dCgpIGNsb3NlQnV0dG9uSWNvblVSTDpzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiXG4gIEBJbnB1dCgpIHNob3dCYWNrQnV0dG9uOmJvb2xlYW49dHJ1ZTtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gXCJTZWFyY2ggTWVtYmVyc1wiO1xuICBASW5wdXQoKSBzZWFyY2hJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9zZWFyY2guc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJCQU5ORURfTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcjooKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT52b2lkKSB8IG51bGwgPSAoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgfVxuXG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKG1lbWJlcjpDb21ldENoYXQuR3JvdXBNZW1iZXIsIHNlbGVjdGVkOmJvb2xlYW4pPT52b2lkO1xuICBASW5wdXQoKSBvbkJhY2shOigpPT52b2lkO1xuICBASW5wdXQoKSBvbkNsb3NlITooKT0+dm9pZDtcbiAgQElucHV0KCkgZ3JvdXAhOkNvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fQkFOTkVEX01FTUJFUlNfRk9VTkRcIilcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5jZW50ZXI7XG4gIEBJbnB1dCgpIHVuYmFuSWNvblVSTDpzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiXG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6XCJcIlxuICB9O1xuICBtZW51TGlzdFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgdGV4dEZvbnQ6IFwiNDAwIDE1cHggSW50ZXJcIixcbiAgICB0ZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBpY29uVGludDogXCJyZ2IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgaWNvbkJvcmRlcjogXCJub25lXCIsXG4gICAgaWNvbkJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgc3VibWVudVdpZHRoOiBcIjEwMCVcIixcbiAgICBzdWJtZW51SGVpZ2h0OiBcIjEwMCVcIixcbiAgICBzdWJtZW51Qm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBzdWJtZW51QmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICB9XG4gIHVuYmFuSWNvblN0eWxlOmFueSA9IHtcbiAgICBib3JkZXI6XCJub25lXCIsXG4gICAgYmFja2dyb3VuZDpcInRyYW5zcGFyZW50XCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6XCJyZ2IoNTEsIDE1MywgMjU1KVwiXG4gIH1cbiAgc2VsZWN0ZWRNZW1iZXIhOkNvbWV0Q2hhdC5Hcm91cE1lbWJlcjtcbiAgdGl0bGVBbGlnbm1lbnRFbnVtOnR5cGVvZiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjMycHhcIixcbiAgICBoZWlnaHQ6IFwiMzJweFwiLFxuICB9O1xuICBASW5wdXQoKSBiYW5uZWRNZW1iZXJzU3R5bGU6IEJhbm5lZE1lbWJlcnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG5cbiAgICBwYWRkaW5nOlwiMCAxMDBweFwiXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImdyZXlcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgaG92ZXJCYWNrZ3JvdW5kOlwidHJhbnNwYXJlbnRcIixcbiAgICBzZXBhcmF0b3JDb2xvcjogXCJyZ2IoMjIyIDIyMiAyMjIgLyA0NiUpXCJcbiAgfTtcbiAgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgbGlzdFN0eWxlOkxpc3RTdHlsZSA9IG5ldyBMaXN0U3R5bGUoe30pO1xuICBwdWJsaWMgbGltaXQ6bnVtYmVyID0gMzA7XG4gIHB1YmxpYyBiYW5uZWRNZW1iZXJzUmVxdWVzdDphbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHB1YmxpYyBiYW5uZWRNZW1iZXJzOiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFtdO1xuICBwdWJsaWMgc2NvcGVzOnN0cmluZ1tdID0gW11cbiAgcHVibGljIGNjR3JvdXBNZW1iZXJCYW5uZWQhOlN1YnNjcmlwdGlvbjtcbiAgcHVibGljIG1lbWJlcnNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImJhbm5lZE1lbWJlcnNfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYscHJpdmF0ZSB0aGVtZVNlcnZpY2U6Q29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7ICB9XG4gIG1lbWJlcnNMaXN0OkNvbWV0Q2hhdC5Hcm91cE1lbWJlcltdID0gW107XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTphbnkgPSBudWxsXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0QmFubmVkTWVtYmVyc1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpXG4gQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCk9PntcbiAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlclxuICB0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0ID0gIHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKVxuICB0aGlzLmZldGNoTmV4dEJhbm5lZE1lbWJlcnMoKVxuIH0pLmNhdGNoKChlcnJvcjpDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKT0+e1xuICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgfVxufSlcblxuICB9XG4gIGJhY2tDbGlja2VkKCl7XG4gICAgaWYodGhpcy5vbkJhY2spe1xuICAgICAgdGhpcy5vbkJhY2soKVxuICAgIH1cbiAgfVxuICBjbG9zZUNsaWNrZWQoKXtcbiAgICBpZih0aGlzLm9uQ2xvc2Upe1xuICAgICAgdGhpcy5vbkNsb3NlKClcbiAgICB9XG4gIH1cbiAgb25NZW1iZXJzU2VsZWN0ZWQobWVtYmVyOkNvbWV0Q2hhdC5Hcm91cE1lbWJlcixldmVudDphbnkpe1xuICAgIGxldCBzZWxlY3RlZDpib29sZWFuID0gZXZlbnQuZGV0YWlsLmNoZWNrZWRcbiAgICBpZih0aGlzLm9uU2VsZWN0KXtcbiAgICAgIHRoaXMub25TZWxlY3QobWVtYmVyLHNlbGVjdGVkKVxuICAgIH1cbiAgfVxuICAgIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXBNZW1iZXJ9IG1lbWJlclxuICAgKi9cbiAgICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvciA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlKSB7XG4gICAgICAgIGlmIChtZW1iZXI/LmdldFN0YXR1cygpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5vbmxpbmVTdGF0dXNDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxudW5CYW5NZW1iZXIgPSAobWVtYmVyOkNvbWV0Q2hhdC5Hcm91cE1lbWJlcik9PntcbiAgQ29tZXRDaGF0LnVuYmFuR3JvdXBNZW1iZXIodGhpcy5ncm91cC5nZXRHdWlkKCksICBtZW1iZXIuZ2V0VWlkKCkpLnRoZW4oKCk9PntcbiAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyVW5iYW5uZWQubmV4dCh7XG4gICAgICB1bmJhbm5lZEJ5OnRoaXMubG9nZ2VkSW5Vc2VyISxcbiAgICAgIHVuYmFubmVkRnJvbTp0aGlzLmdyb3VwLFxuICAgICAgdW5iYW5uZWRVc2VyOm1lbWJlclxuXG4gICAgfSlcbiAgICB0aGlzLnVwZGF0ZU1lbWJlcihtZW1iZXIpXG4gIH0pLmNhdGNoKChlcnI6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgdGhpcy5vbkVycm9yKGVycilcbiAgICB9XG5cbiAgfSlcbn1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSBtZW1iZXJcbiAgICovXG4gICB1cGRhdGVNZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBsZXQgbWVtYmVybGlzdDpDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFsuLi50aGlzLmJhbm5lZE1lbWJlcnNdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IHVzZXJLZXkgPSBtZW1iZXJsaXN0LmZpbmRJbmRleCgodTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBrKSA9PiB1LmdldFVpZCgpID09IG1lbWJlci5nZXRVaWQoKSk7XG4gICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgaWYgKHVzZXJLZXkgPiAtMSkge1xuICAgICAgbWVtYmVybGlzdC5zcGxpY2UodXNlcktleSwgMSk7XG4gICAgICB0aGlzLmJhbm5lZE1lbWJlcnMgPSBbLi4ubWVtYmVybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICBtZW1iZXJsaXN0LnB1c2gobWVtYmVyKVxuICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IG1lbWJlclxuICAgKi9cbiAgICB1cGRhdGVNZW1iZXJTdGF0dXMgPSAobWVtYmVyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICBpZighdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSl7XG4gICAgICBsZXQgbWVtYmVybGlzdCA9IFsuLi50aGlzLmJhbm5lZE1lbWJlcnNdO1xuICAgICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICAgIGxldCB1c2VyS2V5ID0gbWVtYmVybGlzdC5maW5kSW5kZXgoKHU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgaykgPT4gdS5nZXRVaWQoKSA9PSBtZW1iZXIuZ2V0VWlkKCkpO1xuICAgICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICAgIGxldCB1c2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSBtZW1iZXJsaXN0W3VzZXJLZXldO1xuICAgICAgICB1c2VyLnNldFN0YXR1cyhtZW1iZXIuZ2V0U3RhdHVzKCkpXG4gICAgICAgIG1lbWJlcmxpc3Quc3BsaWNlKHVzZXJLZXksIDEsIHVzZXIpO1xuICAgICAgICB0aGlzLmJhbm5lZE1lbWJlcnMgPSBbLi4ubWVtYmVybGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICAgfVxuICAgIH07XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICAgICAgLy9BdHRhY2hpbmcgVXNlciBMaXN0ZW5lcnMgdG8gZHluYW1pbGNhbGx5IHVwZGF0ZSB3aGVuIGEgdXNlciBjb21lcyBvbmxpbmUgYW5kIGdvZXMgb2ZmbGluZVxuICAgICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlclN0YXR1cyhvbmxpbmVVc2VyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXJTdGF0dXMob2ZmbGluZVVzZXIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGJhbm5lZEJ5OiBDb21ldENoYXQuVXNlciwgYmFubmVkRnJvbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKGJhbm5lZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJVbmJhbm5lZDogKFxuICAgICAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgICAgICB1bmJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgICB1bmJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgICAgdW5iYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih1bmJhbm5lZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy5tZW1iZXJzTGlzdGVuZXJJZCk7XG4gICAgdGhpcy5tZW1iZXJzTGlzdGVuZXJJZCA9IFwiXCI7XG4gIH1cbiAgZmV0Y2hOZXh0QmFubmVkTWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IG51bGxcbiAgICBpZih0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0ICYmIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QucGFnaW5hdGlvbiAmJiAodGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdC5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8IHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT0gIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QucGFnaW5hdGlvbi50b3RhbF9wYWdlcykpe1xuICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dEJhbm5lZE1lbWJlcnNcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZ1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdC5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAgIChiYW5uZWRNZW1iZXJzOiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nXG4gICAgICAgICAgICBpZiAoKGJhbm5lZE1lbWJlcnMubGVuZ3RoIDw9IDAgJiYgdGhpcy5iYW5uZWRNZW1iZXJzPy5sZW5ndGggPD0gMCkgfHwgKGJhbm5lZE1lbWJlcnMubGVuZ3RoID09PSAwICYmIHRoaXMuYmFubmVkTWVtYmVycz8ubGVuZ3RoIDw9IDApKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHlcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWRcbiAgICAgICAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzID0gWy4uLnRoaXMuYmFubmVkTWVtYmVycywgLi4uYmFubmVkTWVtYmVyc107XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZFxuICAgIH1cblxuICB9XG4gIGdldFJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIpe1xuICAgICAgcmV0dXJuIHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKVxuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgcmV0dXJuIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyLmJ1aWxkKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBDb21ldENoYXQuQmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSlcbiAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfVxuICB9XG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOklHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYoaXRlbT8ua2lja2VkRnJvbT8uZ2V0R3VpZCgpID09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKXtcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIoaXRlbT8ua2lja2VkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICAvLyB1bnN1YnNjcmliZSB0byBzdWJzY3JpYmVkIGV2ZW50cy5cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQudW5zdWJzY3JpYmUoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXlcbiAgICovXG4gICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlciA/IHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpLmJ1aWxkKCkgOiB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QgPSByZXF1ZXN0O1xuICAgICAgICB0aGlzLmJhbm5lZE1lbWJlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5mZXRjaE5leHRCYW5uZWRNZW1iZXJzKCk7XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOmFueSkge1xuICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG5cbiAgICB9XG4gIH07XG5cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEJhbk1lbWJlcnNTdHlsZSgpXG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKClcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKClcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKClcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUuYmFja2dyb3VuZCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpIGFzIHN0cmluZztcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUuaWNvbkJhY2tncm91bmQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSAgYXMgc3RyaW5nO1xuICAgIHRoaXMubWVudUxpc3RTdHlsZS5pY29uVGludCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCkgIGFzIHN0cmluZztcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUuc3VibWVudUJhY2tncm91bmQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSAgYXMgc3RyaW5nO1xuICAgIHRoaXMubWVudUxpc3RTdHlsZS50ZXh0Rm9udCA9IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSk7XG4gICAgdGhpcy5tZW51TGlzdFN0eWxlLnRleHRDb2xvciA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCkgIGFzIHN0cmluZztcbiAgICB0aGlzLnVuYmFuSWNvblN0eWxlLmJ1dHRvbkljb25UaW50ID0gIHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnVuYmFuSWNvblRpbnQ7XG5cbiAgfVxuICBzZXRCYW5NZW1iZXJzU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkJhbm5lZE1lbWJlcnNTdHlsZSA9IG5ldyBCYW5uZWRNZW1iZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjpgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OmZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgICBzZWFyY2hJY29uVGludDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6Zm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6Zm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czpcIjhweFwiLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHBhZGRpbmc6XCIwIDEwMHB4XCIsXG4gICAgICB1bmJhbkljb25UaW50OnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfSlcbiAgICB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZSA9IHsuLi5kZWZhdWx0U3R5bGUsLi4udGhpcy5iYW5uZWRNZW1iZXJzU3R5bGV9XG4gICAgdGhpcy5saXN0U3R5bGUgPXtcbiAgICAgIHRpdGxlVGV4dEZvbnQgOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3IgOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udCA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3IgOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250IDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvciA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQgOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvciA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQgOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5zZWFyY2hJY29uVGludCxcbiAgICAgIHNlYXJjaEJvcmRlciA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaEJvcmRlcixcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1cyA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQgOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5zZWFyY2hCYWNrZ3JvdW5kLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvciA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQgOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5zZWFyY2hUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFRleHRDb2xvciA6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaFRleHRDb2xvcixcbiAgICB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkJhc2VTdHlsZSA9IHtcbiAgICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgICAgd2lkdGg6XCIxMnB4XCIsXG4gICAgICAgIGJvcmRlcjpcIm5vbmVcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOlwiMjRweFwiLFxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlfVxuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6XCJcIlxuICAgIH0pXG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLmxpc3RJdGVtU3R5bGV9XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7Li4uZGVmYXVsdFN0eWxlLC4uLnRoaXMuYXZhdGFyU3R5bGV9XG4gIH1cblxuICAgbWVtYmVyc1N0eWxlcyA9ICgpPT57XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmc6dGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUucGFkZGluZ1xuICAgIH1cbiAgfVxuICAvLyBzdHlsZXNcbiAgYmFja0J1dHRvblN0eWxlID0gKCk9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgaGVpZ2h0OlwiMjRweFwiLFxuICAgICB3aWR0aDpcIjI0cHhcIixcbiAgICAgYm9yZGVyOlwibm9uZVwiLFxuICAgICBib3JkZXJSYWRpdXM6XCIwXCIsXG4gICAgIGJhY2tncm91bmQ6XCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6dGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuYmFja0J1dHRvbkljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfVxuICB9XG4gIGNsb3NlQnV0dG9uU3R5bGUgPSAoKT0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OlwiMjRweFwiLFxuICAgICAgd2lkdGg6XCIyNHB4XCIsXG4gICAgICBib3JkZXI6XCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOlwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OnRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLmNsb3NlQnV0dG9uSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICB9XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCk9PntcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLmJvcmRlclJhZGl1c1xuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzX19iYWNrXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIiBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIiAqbmdJZj1cInNob3dCYWNrQnV0dG9uXCIgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiYmFja0NsaWNrZWQoKVwiID5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fd3JhcHBlclwiIFtuZ1N0eWxlXT1cIm1lbWJlcnNTdHlsZXMoKVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gICAgPGNvbWV0Y2hhdC1saXN0IFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiIFtvblNlYXJjaF09XCJvblNlYXJjaFwiXG4gICAgICAgIFtsaXN0XT1cImJhbm5lZE1lbWJlcnNcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICAgIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIiBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCIgIFt0aXRsZV09XCJ0aXRsZVwiXG5cbiAgICAgICAgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCIgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCIgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiXG4gICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gICAgPC9jb21ldGNoYXQtbGlzdD5cbiAgICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1iYW5uZWRNZW1iZXI+XG4gICAgICAgIDxjb21ldGNoYXQtbGlzdC1pdGVtIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihiYW5uZWRNZW1iZXIpXCIgW3RpdGxlXT1cImJhbm5lZE1lbWJlcj8ubmFtZVwiIFthdmF0YXJVUkxdPVwiYmFubmVkTWVtYmVyPy5hdmF0YXJcIiBbYXZhdGFyTmFtZV09XCJiYW5uZWRNZW1iZXI/Lm5hbWVcIlxuICAgICAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiPlxuICAgICAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiICAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhiYW5uZWRNZW1iZXIpXCIgIFttZW51TGlzdFN0eWxlXT1cIm1lbnVMaXN0U3R5bGVcIj48L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmU7IGVsc2UgY2hhbmdlU2NvcGVcIiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzX190YWlsLXZpZXdcIj5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8bmctdGVtcGxhdGUgICNjaGFuZ2VTY29wZT5cbiAgICAgICAgIDxkaXYgIHNsb3Q9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fdW5iYW5cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtidXR0b25TdHlsZV09XCJ1bmJhbkljb25TdHlsZVwiIFtpY29uVVJMXT1cInVuYmFuSWNvblVSTFwiIChjbGljayk9XCJ1bkJhbk1lbWJlcihiYW5uZWRNZW1iZXIpXCI+XG5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiIGNsYXNzPVwiY2MtYmFubmVkLW1lbWJlcnNfX3NlbGVjdGlvbi0tc2luZ2xlXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25NZW1iZXJzU2VsZWN0ZWQoYmFubmVkTWVtYmVyLCRldmVudClcIj48L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCIgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fc2VsZWN0aW9uLS1tdWx0aXBsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbk1lbWJlcnNTZWxlY3RlZChiYW5uZWRNZW1iZXIsJGV2ZW50KVwiPjwvY29tZXRjaGF0LWNoZWNrYm94PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY2xvc2UtYnV0dG9uXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGUoKVwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJjbG9zZUNsaWNrZWQoKVwiPlxuXG4gICAgPC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19