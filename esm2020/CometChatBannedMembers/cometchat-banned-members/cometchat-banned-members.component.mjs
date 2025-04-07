import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { BannedMembersStyle, ListStyle } from '@cometchat/uikit-shared';
import { fontHelper, localize, CometChatGroupEvents, SelectionMode, States, TitleAlignment, } from '@cometchat/uikit-resources';
import '@cometchat/uikit-elements';
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { MessageUtils } from "../../Shared/Utils/MessageUtils";
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
        this.checkboxStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "4px",
            checkedBackgroundColor: "#2196F3",
            uncheckedBackgroundColor: "#ccc"
        };
        /**
       * @param  {CometChat.GroupMember} member
       */
        this.getStatusIndicatorColor = (member) => {
            let userStatusVisibility = new MessageUtils().getUserStatusVisibility(member) || this.disableUsersPresence;
            if (!userStatusVisibility) {
                return this.bannedMembersStyle.onlineStatusColor ?? this.themeService.theme.palette.getSuccess();
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
        this.checkboxStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "4px",
            checkedBackgroundColor: this.themeService.theme.palette.getPrimary(),
            uncheckedBackgroundColor: this.themeService.theme.palette.getAccent400()
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
CometChatBannedMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatBannedMembersComponent, selector: "cometchat-banned-members", inputs: { bannedMembersRequestBuilder: "bannedMembersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onSelect: "onSelect", onBack: "onBack", onClose: "onClose", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", unbanIconURL: "unbanIconURL", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", bannedMembersStyle: "bannedMembersStyle", listItemStyle: "listItemStyle" }, ngImport: i0, template: "<div class=\"cc-banned-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-banned-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"   (cc-button-clicked)=\"backClicked()\" >\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-banned-members__wrapper\" [ngStyle]=\"membersStyles()\">\n    <div class=\"cc-banned-members__menus\" *ngIf=\"menu\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n  </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n        [list]=\"bannedMembers\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n        [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"  [title]=\"title\"\n\n        [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n        [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n        [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-bannedMember>\n        <cometchat-list-item [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [statusIndicatorColor]=\"getStatusIndicatorColor(bannedMember)\" [title]=\"bannedMember?.name\" [avatarURL]=\"bannedMember?.avatar\" [avatarName]=\"bannedMember?.name\"\n            [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n [hideSeparator]=\"hideSeparator\">\n            <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-banned-members__subtitle-view\">\n                <ng-container *ngTemplateOutlet=\"subtitleView\">\n                </ng-container>\n            </div>\n            <div slot=\"menuView\"  *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(bannedMember)\"  [menuListStyle]=\"menuListStyle\"></cometchat-menu-list>\n          </div>\n          <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none; else changeScope\" class=\"cc-banned-members__tail-view\">\n            <ng-container *ngTemplateOutlet=\"tailView\">\n            </ng-container>\n        </div>\n        <ng-template  #changeScope>\n         <div  slot=\"tailView\">\n          <div class=\"cc-banned-members__unban\">\n            <cometchat-button [buttonStyle]=\"unbanIconStyle\" [iconURL]=\"unbanIconURL\" (click)=\"unBanMember(bannedMember)\">\n\n            </cometchat-button>\n          </div>\n         </div>\n        </ng-template>\n        </cometchat-list-item>\n        <ng-template #tailView>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-banned-members__selection--single\">\n            <cometchat-radio-button (cc-radio-button-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-radio-button>\n          </div>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-banned-members__selection--multiple\">\n            <cometchat-checkbox [checkboxStyle]=\"checkboxStyle\" (cc-checkbox-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-checkbox>\n          </div>\n        </ng-template>\n    </ng-template>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-banned-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-banned-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-banned-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-banned-members__tail-view{position:relative}.cc-banned-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-banned-members__unban{display:flex;align-items:center;justify-content:flex-end;width:100px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatBannedMembersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-banned-members", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-banned-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-banned-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"   (cc-button-clicked)=\"backClicked()\" >\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-banned-members__wrapper\" [ngStyle]=\"membersStyles()\">\n    <div class=\"cc-banned-members__menus\" *ngIf=\"menu\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n  </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n        [list]=\"bannedMembers\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n        [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"  [title]=\"title\"\n\n        [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n        [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n        [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-bannedMember>\n        <cometchat-list-item [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [statusIndicatorColor]=\"getStatusIndicatorColor(bannedMember)\" [title]=\"bannedMember?.name\" [avatarURL]=\"bannedMember?.avatar\" [avatarName]=\"bannedMember?.name\"\n            [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n [hideSeparator]=\"hideSeparator\">\n            <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-banned-members__subtitle-view\">\n                <ng-container *ngTemplateOutlet=\"subtitleView\">\n                </ng-container>\n            </div>\n            <div slot=\"menuView\"  *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(bannedMember)\"  [menuListStyle]=\"menuListStyle\"></cometchat-menu-list>\n          </div>\n          <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none; else changeScope\" class=\"cc-banned-members__tail-view\">\n            <ng-container *ngTemplateOutlet=\"tailView\">\n            </ng-container>\n        </div>\n        <ng-template  #changeScope>\n         <div  slot=\"tailView\">\n          <div class=\"cc-banned-members__unban\">\n            <cometchat-button [buttonStyle]=\"unbanIconStyle\" [iconURL]=\"unbanIconURL\" (click)=\"unBanMember(bannedMember)\">\n\n            </cometchat-button>\n          </div>\n         </div>\n        </ng-template>\n        </cometchat-list-item>\n        <ng-template #tailView>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-banned-members__selection--single\">\n            <cometchat-radio-button (cc-radio-button-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-radio-button>\n          </div>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-banned-members__selection--multiple\">\n            <cometchat-checkbox [checkboxStyle]=\"checkboxStyle\" (cc-checkbox-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-checkbox>\n          </div>\n        </ng-template>\n    </ng-template>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-banned-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-banned-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-banned-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-banned-members__tail-view{position:relative}.cc-banned-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-banned-members__unban{display:flex;align-items:center;justify-content:flex-end;width:100px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMvY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMvY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBZSxNQUFNLGVBQWUsQ0FBQztBQUNsSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUFFLGtCQUFrQixFQUFhLFNBQVMsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUMxRyxPQUFPLEVBQWtCLFVBQVUsRUFBRSxRQUFRLEVBQW1CLG9CQUFvQixFQUFFLGFBQWEsRUFBcUQsTUFBTSxFQUFFLGNBQWMsR0FBRyxNQUFNLDRCQUE0QixDQUFBO0FBQ25OLE9BQU8sMkJBQTJCLENBQUE7QUFDbEMsT0FBTyxFQUFFLFdBQVcsRUFBaUIsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFFckYsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFDMUUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlDQUFpQyxDQUFDOzs7OztBQUMvRDs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTywrQkFBK0I7SUFzRzFDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdB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dGVjdG9yUmVmLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVGVtcGxhdGVSZWYgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IEJhbm5lZE1lbWJlcnNTdHlsZSwgQmFzZVN0eWxlLCBMaXN0U3R5bGUsIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lLCBmb250SGVscGVyLCBsb2NhbGl6ZSwgQ29tZXRDaGF0T3B0aW9uLCBDb21ldENoYXRHcm91cEV2ZW50cywgU2VsZWN0aW9uTW9kZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgU3RhdGVzLCBUaXRsZUFsaWdubWVudCwgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcydcbmltcG9ydCAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IEF2YXRhclN0eWxlLCBDaGVja2JveFN0eWxlLCBMaXN0SXRlbVN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdEJhbm5lZE1lbWJlcnNDb21wb25lbnQgaXMgdXNlZCB0byByZW5kZXIgbGlzdCBvZiBiYW5uZWQgbWVtYmVyc1xuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1iYW5uZWQtbWVtYmVyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1iYW5uZWQtbWVtYmVycy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRCYW5uZWRNZW1iZXJzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgYmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LkJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4gQ29tZXRDaGF0T3B0aW9uW10pIHwgbnVsbDtcbiAgQElucHV0KCkgYmFja0J1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2JhY2tidXR0b24uc3ZnXCJcbiAgQElucHV0KCkgY2xvc2VCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiXG4gIEBJbnB1dCgpIHNob3dCYWNrQnV0dG9uOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gXCJTZWFyY2ggTWVtYmVyc1wiO1xuICBASW5wdXQoKSBzZWFyY2hJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9zZWFyY2guc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJCQU5ORURfTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cblxuICBASW5wdXQoKSBvblNlbGVjdCE6IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgc2VsZWN0ZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uQmFjayE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uQ2xvc2UhOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fQkFOTkVEX01FTUJFUlNfRk9VTkRcIilcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5jZW50ZXI7XG4gIEBJbnB1dCgpIHVuYmFuSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIlxuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgYm9yZGVyOiBcIlwiXG4gIH07XG4gIG1lbnVMaXN0U3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICB0ZXh0Rm9udDogXCI0MDAgMTVweCBJbnRlclwiLFxuICAgIHRleHRDb2xvcjogXCJibGFja1wiLFxuICAgIGljb25UaW50OiBcInJnYig1MSwgMTUzLCAyNTUpXCIsXG4gICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBpY29uQm9yZGVyOiBcIm5vbmVcIixcbiAgICBpY29uQm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gIH1cbiAgdW5iYW5JY29uU3R5bGU6IGFueSA9IHtcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogXCJyZ2IoNTEsIDE1MywgMjU1KVwiXG4gIH1cbiAgc2VsZWN0ZWRNZW1iZXIhOiBDb21ldENoYXQuR3JvdXBNZW1iZXI7XG4gIHRpdGxlQWxpZ25tZW50RW51bTogdHlwZW9mIFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnRcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGJhbm5lZE1lbWJlcnNTdHlsZTogQmFubmVkTWVtYmVyc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCJcIixcblxuICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImdyZXlcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG4gIHNlYXJjaEtleXdvcmQ6IHN0cmluZyA9IFwiXCI7XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0gbmV3IExpc3RTdHlsZSh7fSk7XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyBiYW5uZWRNZW1iZXJzUmVxdWVzdDogYW55O1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgdGltZW91dDogYW55O1xuICBwdWJsaWMgYmFubmVkTWVtYmVyczogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10gPSBbXTtcbiAgcHVibGljIHNjb3Blczogc3RyaW5nW10gPSBbXVxuICBwdWJsaWMgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIG1lbWJlcnNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImJhbm5lZE1lbWJlcnNfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBtZW1iZXJzTGlzdDogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10gPSBbXTtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsO1xuICBjaGVja2JveFN0eWxlOiBDaGVja2JveFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjRweFwiLFxuICAgIGNoZWNrZWRCYWNrZ3JvdW5kQ29sb3I6IFwiIzIxOTZGM1wiLFxuICAgIHVuY2hlY2tlZEJhY2tncm91bmRDb2xvcjogXCIjY2NjXCJcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dEJhbm5lZE1lbWJlcnNcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKVxuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlclxuICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgdGhpcy5mZXRjaE5leHRCYW5uZWRNZW1iZXJzKClcbiAgICB9KS5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgfVxuICAgIH0pXG5cbiAgfVxuICBiYWNrQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkJhY2spIHtcbiAgICAgIHRoaXMub25CYWNrKClcbiAgICB9XG4gIH1cbiAgY2xvc2VDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uQ2xvc2UpIHtcbiAgICAgIHRoaXMub25DbG9zZSgpXG4gICAgfVxuICB9XG4gIG9uTWVtYmVyc1NlbGVjdGVkKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQuZGV0YWlsLmNoZWNrZWRcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdChtZW1iZXIsIHNlbGVjdGVkKVxuICAgIH1cbiAgfVxuICAvKipcbiAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cE1lbWJlcn0gbWVtYmVyXG4gKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBsZXQgdXNlclN0YXR1c1Zpc2liaWxpdHkgPSBuZXcgTWVzc2FnZVV0aWxzKCkuZ2V0VXNlclN0YXR1c1Zpc2liaWxpdHkobWVtYmVyKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgIGlmICghdXNlclN0YXR1c1Zpc2liaWxpdHkpIHtcbiAgICAgIHJldHVybiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5vbmxpbmVTdGF0dXNDb2xvciA/PyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICB1bkJhbk1lbWJlciA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgIENvbWV0Q2hhdC51bmJhbkdyb3VwTWVtYmVyKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBtZW1iZXIuZ2V0VWlkKCkpLnRoZW4oKCkgPT4ge1xuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlclVuYmFubmVkLm5leHQoe1xuICAgICAgICB1bmJhbm5lZEJ5OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgIHVuYmFubmVkRnJvbTogdGhpcy5ncm91cCxcbiAgICAgICAgdW5iYW5uZWRVc2VyOiBtZW1iZXJcblxuICAgICAgfSlcbiAgICAgIHRoaXMudXBkYXRlTWVtYmVyKG1lbWJlcilcbiAgICB9KS5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnIpXG4gICAgICB9XG5cbiAgICB9KVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gbWVtYmVyXG4gICAqL1xuICB1cGRhdGVNZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBsZXQgbWVtYmVybGlzdDogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10gPSBbLi4udGhpcy5iYW5uZWRNZW1iZXJzXTtcbiAgICAvL3NlYXJjaCBmb3IgdXNlclxuICAgIGxldCB1c2VyS2V5ID0gbWVtYmVybGlzdC5maW5kSW5kZXgoKHU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgaykgPT4gdS5nZXRVaWQoKSA9PSBtZW1iZXIuZ2V0VWlkKCkpO1xuICAgIC8vaWYgZm91bmQgaW4gdGhlIGxpc3QsIHVwZGF0ZSB1c2VyIG9iamVjdFxuICAgIGlmICh1c2VyS2V5ID4gLTEpIHtcbiAgICAgIG1lbWJlcmxpc3Quc3BsaWNlKHVzZXJLZXksIDEpO1xuICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1lbWJlcmxpc3QucHVzaChtZW1iZXIpXG4gICAgICB0aGlzLmJhbm5lZE1lbWJlcnMgPSBbLi4ubWVtYmVybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICAvKipcbiAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSBtZW1iZXJcbiAqL1xuICB1cGRhdGVNZW1iZXJTdGF0dXMgPSAobWVtYmVyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCBtZW1iZXJsaXN0ID0gWy4uLnRoaXMuYmFubmVkTWVtYmVyc107XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgdXNlcktleSA9IG1lbWJlcmxpc3QuZmluZEluZGV4KCh1OiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gbWVtYmVyLmdldFVpZCgpKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICBsZXQgdXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gbWVtYmVybGlzdFt1c2VyS2V5XTtcbiAgICAgIHVzZXIuc2V0U3RhdHVzKG1lbWJlci5nZXRTdGF0dXMoKSlcbiAgICAgIG1lbWJlcmxpc3Quc3BsaWNlKHVzZXJLZXksIDEsIHVzZXIpO1xuICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cblxuICB9O1xuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgLy9BdHRhY2hpbmcgVXNlciBMaXN0ZW5lcnMgdG8gZHluYW1pbGNhbGx5IHVwZGF0ZSB3aGVuIGEgdXNlciBjb21lcyBvbmxpbmUgYW5kIGdvZXMgb2ZmbGluZVxuICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlclN0YXR1cyhvbmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlclN0YXR1cyhvZmZsaW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Hcm91cExpc3RlbmVyKHtcbiAgICAgICAgb25Hcm91cE1lbWJlckJhbm5lZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBiYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsIGJhbm5lZEZyb206IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKGJhbm5lZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyVW5iYW5uZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodW5iYW5uZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcilcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMubWVtYmVyc0xpc3RlbmVySWQpO1xuICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQgPSBcIlwiO1xuICB9XG4gIGZldGNoTmV4dEJhbm5lZE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsXG4gICAgaWYgKHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QgJiYgdGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdC5wYWdpbmF0aW9uICYmICh0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0LnBhZ2luYXRpb24uY3VycmVudF9wYWdlID09IDAgfHwgdGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdC5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSAhPSB0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0LnBhZ2luYXRpb24udG90YWxfcGFnZXMpKSB7XG4gICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0QmFubmVkTWVtYmVyc1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0LmZldGNoTmV4dCgpLnRoZW4oXG4gICAgICAgICAgKGJhbm5lZE1lbWJlcnM6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmdcbiAgICAgICAgICAgIGlmICgoYmFubmVkTWVtYmVycy5sZW5ndGggPD0gMCAmJiB0aGlzLmJhbm5lZE1lbWJlcnM/Lmxlbmd0aCA8PSAwKSB8fCAoYmFubmVkTWVtYmVycy5sZW5ndGggPT09IDAgJiYgdGhpcy5iYW5uZWRNZW1iZXJzPy5sZW5ndGggPD0gMCkpIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eVxuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZFxuICAgICAgICAgICAgICB0aGlzLmJhbm5lZE1lbWJlcnMgPSBbLi4udGhpcy5iYW5uZWRNZW1iZXJzLCAuLi5iYW5uZWRNZW1iZXJzXTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWRcbiAgICB9XG5cbiAgfVxuICBnZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAodGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgcmV0dXJuIHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKVxuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgcmV0dXJuIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyLmJ1aWxkKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBDb21ldENoYXQuQmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSlcbiAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfVxuICB9XG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmIChpdGVtPy5raWNrZWRGcm9tPy5nZXRHdWlkKCkgPT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIoaXRlbT8ua2lja2VkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICAvLyB1bnN1YnNjcmliZSB0byBzdWJzY3JpYmVkIGV2ZW50cy5cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQudW5zdWJzY3JpYmUoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXlcbiAgICovXG4gIG9uU2VhcmNoID0gKGtleTogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2VhcmNoS2V5d29yZCA9IGtleTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyID8gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlci5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZCkuYnVpbGQoKSA6IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgICAgIHRoaXMuYmFubmVkTWVtYmVycyA9IFtdO1xuICAgICAgICB0aGlzLmZldGNoTmV4dEJhbm5lZE1lbWJlcnMoKTtcbiAgICAgIH0sIDUwMCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgIH1cblxuICAgIH1cbiAgfTtcblxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0QmFuTWVtYmVyc1N0eWxlKClcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKVxuICAgIHRoaXMubWVudUxpc3RTdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCkgYXMgc3RyaW5nO1xuICAgIHRoaXMubWVudUxpc3RTdHlsZS5pY29uQmFja2dyb3VuZCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpIGFzIHN0cmluZztcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUuaWNvblRpbnQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpIGFzIHN0cmluZztcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUuc3VibWVudUJhY2tncm91bmQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSBhcyBzdHJpbmc7XG4gICAgdGhpcy5tZW51TGlzdFN0eWxlLnRleHRGb250ID0gZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKTtcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUudGV4dENvbG9yID0gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSBhcyBzdHJpbmc7XG4gICAgdGhpcy51bmJhbkljb25TdHlsZS5idXR0b25JY29uVGludCA9IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnVuYmFuSWNvblRpbnQ7XG5cbiAgfVxuICBzZXRCYW5NZW1iZXJzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFubmVkTWVtYmVyc1N0eWxlID0gbmV3IEJhbm5lZE1lbWJlcnNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwibm9uZVwiLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBwYWRkaW5nOiBcIjAgMTAwcHhcIixcbiAgICAgIHVuYmFuSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfSlcbiAgICB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmJhbm5lZE1lbWJlcnNTdHlsZSB9XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnRpdGxlVGV4dENvbG9yLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuc2VwYXJhdG9yQ29sb3IsXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaEJvcmRlcixcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuc2VhcmNoQm9yZGVyUmFkaXVzLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3IsXG4gICAgICBzZWFyY2hUZXh0Rm9udDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaFRleHRDb2xvcixcbiAgICB9XG4gICAgdGhpcy5jaGVja2JveFN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBjaGVja2VkQmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHVuY2hlY2tlZEJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKVxuICAgIH1cbiAgfVxuICBzZXRTdGF0dXNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgfVxuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSB9XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogXCJcIlxuICAgIH0pXG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pXG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH1cbiAgfVxuXG4gIG1lbWJlcnNTdHlsZXMgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmc6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnBhZGRpbmdcbiAgICB9XG4gIH1cbiAgLy8gc3R5bGVzXG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH1cbiAgfVxuICBjbG9zZUJ1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH1cbiAgfVxuICB3cmFwcGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc1wiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fYmFja1wiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCIgKm5nSWY9XCJzaG93QmFja0J1dHRvblwiICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImJhY2tDbGlja2VkKClcIiA+XG5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtYmFubmVkLW1lbWJlcnNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJtZW1iZXJzU3R5bGVzKClcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtYmFubmVkLW1lbWJlcnNfX21lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudVwiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuICAgIDxjb21ldGNoYXQtbGlzdCBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIiBbb25TZWFyY2hdPVwib25TZWFyY2hcIlxuICAgICAgICBbbGlzdF09XCJiYW5uZWRNZW1iZXJzXCIgW3NlYXJjaFRleHRdPVwic2VhcmNoS2V5d29yZFwiIFtzZWFyY2hQbGFjZWhvbGRlclRleHRdPVwic2VhcmNoUGxhY2Vob2xkZXJcIlxuICAgICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiICBbdGl0bGVdPVwidGl0bGVcIlxuXG4gICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICAgIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIiBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiIFtzdGF0ZV09XCJzdGF0ZVwiPlxuICAgIDwvY29tZXRjaGF0LWxpc3Q+XG4gICAgPG5nLXRlbXBsYXRlICNsaXN0SXRlbSBsZXQtYmFubmVkTWVtYmVyPlxuICAgICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoYmFubmVkTWVtYmVyKVwiIFt0aXRsZV09XCJiYW5uZWRNZW1iZXI/Lm5hbWVcIiBbYXZhdGFyVVJMXT1cImJhbm5lZE1lbWJlcj8uYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwiYmFubmVkTWVtYmVyPy5uYW1lXCJcbiAgICAgICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIj5cbiAgICAgICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3XCIgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fc3VidGl0bGUtdmlld1wiPlxuICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiAgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnMoYmFubmVkTWVtYmVyKVwiICBbbWVudUxpc3RTdHlsZV09XCJtZW51TGlzdFN0eWxlXCI+PC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSAhPSBzZWxlY3Rpb25tb2RlRW51bS5ub25lOyBlbHNlIGNoYW5nZVNjb3BlXCIgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fdGFpbC12aWV3XCI+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGFpbFZpZXdcIj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICAjY2hhbmdlU2NvcGU+XG4gICAgICAgICA8ZGl2ICBzbG90PVwidGFpbFZpZXdcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtYmFubmVkLW1lbWJlcnNfX3VuYmFuXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbYnV0dG9uU3R5bGVdPVwidW5iYW5JY29uU3R5bGVcIiBbaWNvblVSTF09XCJ1bmJhbkljb25VUkxcIiAoY2xpY2spPVwidW5CYW5NZW1iZXIoYmFubmVkTWVtYmVyKVwiPlxuXG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICAgICAgICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzX19zZWxlY3Rpb24tLXNpbmdsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yYWRpby1idXR0b24gKGNjLXJhZGlvLWJ1dHRvbi1jaGFuZ2VkKT1cIm9uTWVtYmVyc1NlbGVjdGVkKGJhbm5lZE1lbWJlciwkZXZlbnQpXCI+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5tdWx0aXBsZVwiIGNsYXNzPVwiY2MtYmFubmVkLW1lbWJlcnNfX3NlbGVjdGlvbi0tbXVsdGlwbGVcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtY2hlY2tib3ggW2NoZWNrYm94U3R5bGVdPVwiY2hlY2tib3hTdHlsZVwiIChjYy1jaGVja2JveC1jaGFuZ2VkKT1cIm9uTWVtYmVyc1NlbGVjdGVkKGJhbm5lZE1lbWJlciwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1jbG9zZS1idXR0b25cIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJjbG9zZUJ1dHRvbkljb25VUkxcIiBbYnV0dG9uU3R5bGVdPVwiY2xvc2VCdXR0b25TdHlsZSgpXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImNsb3NlQ2xpY2tlZCgpXCI+XG5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXX0=