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
CometChatBannedMembersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatBannedMembersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatBannedMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.12", type: CometChatBannedMembersComponent, selector: "cometchat-banned-members", inputs: { bannedMembersRequestBuilder: "bannedMembersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onSelect: "onSelect", onBack: "onBack", onClose: "onClose", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", unbanIconURL: "unbanIconURL", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", bannedMembersStyle: "bannedMembersStyle", listItemStyle: "listItemStyle" }, ngImport: i0, template: "<div class=\"cc-banned-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-banned-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"   (cc-button-clicked)=\"backClicked()\" >\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-banned-members__wrapper\" [ngStyle]=\"membersStyles()\">\n    <div class=\"cc-banned-members__menus\" *ngIf=\"menu\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n  </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n        [list]=\"bannedMembers\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n        [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"  [title]=\"title\"\n\n        [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n        [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n        [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-bannedMember>\n        <cometchat-list-item [statusIndicatorStyle]=\"statusIndicatorStyle\"\n        [statusIndicatorColor]=\"getStatusIndicatorColor(bannedMember)\" [title]=\"bannedMember?.name\" [avatarURL]=\"bannedMember?.avatar\" [avatarName]=\"bannedMember?.name\"\n            [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n [hideSeparator]=\"hideSeparator\">\n            <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-banned-members__subtitle-view\">\n                <ng-container *ngTemplateOutlet=\"subtitleView\">\n                </ng-container>\n            </div>\n            <div slot=\"menuView\"  *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(bannedMember)\"  [menuListStyle]=\"menuListStyle\"></cometchat-menu-list>\n          </div>\n          <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none; else changeScope\" class=\"cc-banned-members__tail-view\">\n            <ng-container *ngTemplateOutlet=\"tailView\">\n            </ng-container>\n        </div>\n        <ng-template  #changeScope>\n         <div  slot=\"tailView\">\n          <div class=\"cc-banned-members__unban\">\n            <cometchat-button [buttonStyle]=\"unbanIconStyle\" [iconURL]=\"unbanIconURL\" (click)=\"unBanMember(bannedMember)\">\n\n            </cometchat-button>\n          </div>\n         </div>\n        </ng-template>\n        </cometchat-list-item>\n        <ng-template #tailView>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-banned-members__selection--single\">\n            <cometchat-radio-button (cc-radio-button-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-radio-button>\n          </div>\n          <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-banned-members__selection--multiple\">\n            <cometchat-checkbox (cc-checkbox-changed)=\"onMembersSelected(bannedMember,$event)\"></cometchat-checkbox>\n          </div>\n        </ng-template>\n    </ng-template>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-banned-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-banned-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-banned-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-banned-members__tail-view{position:relative}.cc-banned-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-banned-members__unban{display:flex;align-items:center;justify-content:flex-end;width:100px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatBannedMembersComponent, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMvY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMvY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBZSxNQUFNLGVBQWUsQ0FBQztBQUNsSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUFFLGtCQUFrQixFQUFhLFNBQVMsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUMxRyxPQUFPLEVBQWtCLFVBQVUsRUFBRSxRQUFRLEVBQW1CLG9CQUFvQixFQUFFLGFBQWEsRUFBcUQsTUFBTSxFQUFFLGNBQWMsR0FBRyxNQUFNLDRCQUE0QixDQUFBO0FBQ25OLE9BQU8sMkJBQTJCLENBQUE7QUFDbEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUV0RSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7O0FBQy9EOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLCtCQUErQjtJQXNHMUMsWUFBb0IsR0FBc0IsRUFBVSxZQUFtQztRQUFuRSxRQUFHLEdBQUgsR0FB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c0JBQWxCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFJRyxRQUFRO3NCQUFoQixLQUFLO2dCQUNHLE1BQU07c0JBQWQsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFnQ0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBU0csYUFBYTtzQkFBckIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgT25Jbml0LCBJbnB1dCwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBUZW1wbGF0ZVJlZiB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQmFubmVkTWVtYmVyc1N0eWxlLCBCYXNlU3R5bGUsIExpc3RTdHlsZSwgQ29tZXRDaGF0VUlLaXRVdGlsaXR5IH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWUsIGZvbnRIZWxwZXIsIGxvY2FsaXplLCBDb21ldENoYXRPcHRpb24sIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBTZWxlY3Rpb25Nb2RlLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkLCBTdGF0ZXMsIFRpdGxlQWxpZ25tZW50LCB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJ1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQXZhdGFyU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IE1lc3NhZ2VVdGlscyB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzXCI7XG4vKipcbipcbiogQ29tZXRDaGF0QmFubmVkTWVtYmVyc0NvbXBvbmVudCBpcyB1c2VkIHRvIHJlbmRlciBsaXN0IG9mIGJhbm5lZCBtZW1iZXJzXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdEJhbm5lZE1lbWJlcnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSBiYW5uZWRNZW1iZXJzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQmFubmVkTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzZWFyY2hSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5CYW5uZWRNZW1iZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOiAoKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIlxuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCJcbiAgQElucHV0KCkgc2hvd0JhY2tCdXR0b246IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBcIlNlYXJjaCBNZW1iZXJzXCI7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkJBTk5FRF9NRU1CRVJTXCIpO1xuICBASW5wdXQoKSBvbkVycm9yOiAoKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkKSB8IG51bGwgPSAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgfVxuXG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBzZWxlY3RlZDogYm9vbGVhbikgPT4gdm9pZDtcbiAgQElucHV0KCkgb25CYWNrITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19CQU5ORURfTUVNQkVSU19GT1VORFwiKVxuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmNlbnRlcjtcbiAgQElucHV0KCkgdW5iYW5JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiXG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6IFwiXCJcbiAgfTtcbiAgbWVudUxpc3RTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICAgIHRleHRGb250OiBcIjQwMCAxNXB4IEludGVyXCIsXG4gICAgdGV4dENvbG9yOiBcImJsYWNrXCIsXG4gICAgaWNvblRpbnQ6IFwicmdiKDUxLCAxNTMsIDI1NSlcIixcbiAgICBpY29uQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGljb25Cb3JkZXI6IFwibm9uZVwiLFxuICAgIGljb25Cb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIHN1Ym1lbnVXaWR0aDogXCIxMDAlXCIsXG4gICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgc3VibWVudUJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudUJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgfVxuICB1bmJhbkljb25TdHlsZTogYW55ID0ge1xuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcInJnYig1MSwgMTUzLCAyNTUpXCJcbiAgfVxuICBzZWxlY3RlZE1lbWJlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcjtcbiAgdGl0bGVBbGlnbm1lbnRFbnVtOiB0eXBlb2YgVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudFxuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIzMnB4XCIsXG4gICAgaGVpZ2h0OiBcIjMycHhcIixcbiAgfTtcbiAgQElucHV0KCkgYmFubmVkTWVtYmVyc1N0eWxlOiBCYW5uZWRNZW1iZXJzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuXG4gICAgcGFkZGluZzogXCIwIDEwMHB4XCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiZ3JleVwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBzZXBhcmF0b3JDb2xvcjogXCJyZ2IoMjIyIDIyMiAyMjIgLyA0NiUpXCJcbiAgfTtcbiAgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSBuZXcgTGlzdFN0eWxlKHt9KTtcbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgcHVibGljIGJhbm5lZE1lbWJlcnNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHB1YmxpYyBiYW5uZWRNZW1iZXJzOiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFtdO1xuICBwdWJsaWMgc2NvcGVzOiBzdHJpbmdbXSA9IFtdXG4gIHB1YmxpYyBjY0dyb3VwTWVtYmVyQmFubmVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgbWVtYmVyc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiYmFubmVkTWVtYmVyc19cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkgeyB9XG4gIG1lbWJlcnNMaXN0OiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFtdO1xuICBvblNjcm9sbGVkVG9Cb3R0b206IGFueSA9IG51bGxcbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRCYW5uZWRNZW1iZXJzXG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKClcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXJcbiAgICAgIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKClcbiAgICAgIHRoaXMuZmV0Y2hOZXh0QmFubmVkTWVtYmVycygpXG4gICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgIH1cbiAgICB9KVxuXG4gIH1cbiAgYmFja0NsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25CYWNrKSB7XG4gICAgICB0aGlzLm9uQmFjaygpXG4gICAgfVxuICB9XG4gIGNsb3NlQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKVxuICAgIH1cbiAgfVxuICBvbk1lbWJlcnNTZWxlY3RlZChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50LmRldGFpbC5jaGVja2VkXG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QobWVtYmVyLCBzZWxlY3RlZClcbiAgICB9XG4gIH1cbiAgLyoqXG4gKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXBNZW1iZXJ9IG1lbWJlclxuICovXG4gIGdldFN0YXR1c0luZGljYXRvckNvbG9yID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KG1lbWJlcikgfHwgdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZTtcbiAgICBpZiAoIXVzZXJTdGF0dXNWaXNpYmlsaXR5KSB7XG4gICAgICByZXR1cm4gdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUub25saW5lU3RhdHVzQ29sb3IgPz8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsXG4gIH1cbiAgdW5CYW5NZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBDb21ldENoYXQudW5iYW5Hcm91cE1lbWJlcih0aGlzLmdyb3VwLmdldEd1aWQoKSwgbWVtYmVyLmdldFVpZCgpKS50aGVuKCgpID0+IHtcbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJVbmJhbm5lZC5uZXh0KHtcbiAgICAgICAgdW5iYW5uZWRCeTogdGhpcy5sb2dnZWRJblVzZXIhLFxuICAgICAgICB1bmJhbm5lZEZyb206IHRoaXMuZ3JvdXAsXG4gICAgICAgIHVuYmFubmVkVXNlcjogbWVtYmVyXG5cbiAgICAgIH0pXG4gICAgICB0aGlzLnVwZGF0ZU1lbWJlcihtZW1iZXIpXG4gICAgfSkuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKVxuICAgICAgfVxuXG4gICAgfSlcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IG1lbWJlclxuICAgKi9cbiAgdXBkYXRlTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgbGV0IG1lbWJlcmxpc3Q6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdID0gWy4uLnRoaXMuYmFubmVkTWVtYmVyc107XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgdXNlcktleSA9IG1lbWJlcmxpc3QuZmluZEluZGV4KCh1OiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gbWVtYmVyLmdldFVpZCgpKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICBtZW1iZXJsaXN0LnNwbGljZSh1c2VyS2V5LCAxKTtcbiAgICAgIHRoaXMuYmFubmVkTWVtYmVycyA9IFsuLi5tZW1iZXJsaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtZW1iZXJsaXN0LnB1c2gobWVtYmVyKVxuICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gbWVtYmVyXG4gKi9cbiAgdXBkYXRlTWVtYmVyU3RhdHVzID0gKG1lbWJlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBsZXQgbWVtYmVybGlzdCA9IFsuLi50aGlzLmJhbm5lZE1lbWJlcnNdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IHVzZXJLZXkgPSBtZW1iZXJsaXN0LmZpbmRJbmRleCgodTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBrKSA9PiB1LmdldFVpZCgpID09IG1lbWJlci5nZXRVaWQoKSk7XG4gICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgaWYgKHVzZXJLZXkgPiAtMSkge1xuICAgICAgbGV0IHVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciA9IG1lbWJlcmxpc3RbdXNlcktleV07XG4gICAgICB1c2VyLnNldFN0YXR1cyhtZW1iZXIuZ2V0U3RhdHVzKCkpXG4gICAgICBtZW1iZXJsaXN0LnNwbGljZSh1c2VyS2V5LCAxLCB1c2VyKTtcbiAgICAgIHRoaXMuYmFubmVkTWVtYmVycyA9IFsuLi5tZW1iZXJsaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG5cbiAgfTtcbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIC8vQXR0YWNoaW5nIFVzZXIgTGlzdGVuZXJzIHRvIGR5bmFtaWxjYWxseSB1cGRhdGUgd2hlbiBhIHVzZXIgY29tZXMgb25saW5lIGFuZCBnb2VzIG9mZmxpbmVcbiAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgdGhpcy5tZW1iZXJzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXJTdGF0dXMob25saW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXJTdGF0dXMob2ZmbGluZVVzZXIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgdGhpcy5tZW1iZXJzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBiYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlciwgYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLCBiYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcihiYW5uZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcilcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlclVuYmFubmVkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICB1bmJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVuYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVuYmFubmVkRnJvbTogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHVuYmFubmVkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZVVzZXJMaXN0ZW5lcih0aGlzLm1lbWJlcnNMaXN0ZW5lcklkKTtcbiAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkID0gXCJcIjtcbiAgfVxuICBmZXRjaE5leHRCYW5uZWRNZW1iZXJzID0gKCkgPT4ge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gbnVsbFxuICAgIGlmICh0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0ICYmIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QucGFnaW5hdGlvbiAmJiAodGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdC5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8IHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT0gdGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdC5wYWdpbmF0aW9uLnRvdGFsX3BhZ2VzKSkge1xuICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dEJhbm5lZE1lbWJlcnNcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZ1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdC5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAgIChiYW5uZWRNZW1iZXJzOiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nXG4gICAgICAgICAgICBpZiAoKGJhbm5lZE1lbWJlcnMubGVuZ3RoIDw9IDAgJiYgdGhpcy5iYW5uZWRNZW1iZXJzPy5sZW5ndGggPD0gMCkgfHwgKGJhbm5lZE1lbWJlcnMubGVuZ3RoID09PSAwICYmIHRoaXMuYmFubmVkTWVtYmVycz8ubGVuZ3RoIDw9IDApKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHlcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWRcbiAgICAgICAgICAgICAgdGhpcy5iYW5uZWRNZW1iZXJzID0gWy4uLnRoaXMuYmFubmVkTWVtYmVycywgLi4uYmFubmVkTWVtYmVyc107XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3JcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkXG4gICAgfVxuXG4gIH1cbiAgZ2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyLmJ1aWxkKClcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5iYW5uZWRNZW1iZXJzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlci5idWlsZCgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgQ29tZXRDaGF0LkJhbm5lZE1lbWJlcnNSZXF1ZXN0QnVpbGRlcih0aGlzLmdyb3VwPy5nZXRHdWlkKCkpXG4gICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH1cbiAgfVxuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICBpZiAoaXRlbT8ua2lja2VkRnJvbT8uZ2V0R3VpZCgpID09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKGl0ZW0/LmtpY2tlZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgLy8gdW5zdWJzY3JpYmUgdG8gc3Vic2NyaWJlZCBldmVudHMuXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkLnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5XG4gICAqL1xuICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlciA/IHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpLmJ1aWxkKCkgOiB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIHRoaXMuYmFubmVkTWVtYmVyc1JlcXVlc3QgPSByZXF1ZXN0O1xuICAgICAgICB0aGlzLmJhbm5lZE1lbWJlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5mZXRjaE5leHRCYW5uZWRNZW1iZXJzKCk7XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG5cbiAgICB9XG4gIH07XG5cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEJhbk1lbWJlcnNTdHlsZSgpXG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKClcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKClcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKClcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUuYmFja2dyb3VuZCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpIGFzIHN0cmluZztcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUuaWNvbkJhY2tncm91bmQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSBhcyBzdHJpbmc7XG4gICAgdGhpcy5tZW51TGlzdFN0eWxlLmljb25UaW50ID0gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSBhcyBzdHJpbmc7XG4gICAgdGhpcy5tZW51TGlzdFN0eWxlLnN1Ym1lbnVCYWNrZ3JvdW5kID0gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCkgYXMgc3RyaW5nO1xuICAgIHRoaXMubWVudUxpc3RTdHlsZS50ZXh0Rm9udCA9IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSk7XG4gICAgdGhpcy5tZW51TGlzdFN0eWxlLnRleHRDb2xvciA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCkgYXMgc3RyaW5nO1xuICAgIHRoaXMudW5iYW5JY29uU3R5bGUuYnV0dG9uSWNvblRpbnQgPSB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS51bmJhbkljb25UaW50O1xuXG4gIH1cbiAgc2V0QmFuTWVtYmVyc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhbm5lZE1lbWJlcnNTdHlsZSA9IG5ldyBCYW5uZWRNZW1iZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIm5vbmVcIixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgcGFkZGluZzogXCIwIDEwMHB4XCIsXG4gICAgICB1bmJhbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH0pXG4gICAgdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUgfVxuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaEljb25UaW50LFxuICAgICAgc2VhcmNoQm9yZGVyOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5zZWFyY2hCb3JkZXIsXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaEJhY2tncm91bmQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRGb250LFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLnNlYXJjaFRleHRGb250LFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5zZWFyY2hUZXh0Q29sb3IsXG4gICAgfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlIH1cbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcIlwiXG4gICAgfSlcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH1cbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfVxuICB9XG5cbiAgbWVtYmVyc1N0eWxlcyA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGFkZGluZzogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUucGFkZGluZ1xuICAgIH1cbiAgfVxuICAvLyBzdHlsZXNcbiAgYmFja0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUuYmFja0J1dHRvbkljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfVxuICB9XG4gIGNsb3NlQnV0dG9uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5jbG9zZUJ1dHRvbkljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5iYW5uZWRNZW1iZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmJhbm5lZE1lbWJlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuYmFubmVkTWVtYmVyc1N0eWxlLmJvcmRlclJhZGl1c1xuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzX19iYWNrXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIiBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIiAqbmdJZj1cInNob3dCYWNrQnV0dG9uXCIgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiYmFja0NsaWNrZWQoKVwiID5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fd3JhcHBlclwiIFtuZ1N0eWxlXT1cIm1lbWJlcnNTdHlsZXMoKVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gICAgPGNvbWV0Y2hhdC1saXN0IFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiIFtvblNlYXJjaF09XCJvblNlYXJjaFwiXG4gICAgICAgIFtsaXN0XT1cImJhbm5lZE1lbWJlcnNcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICAgIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIiBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCIgIFt0aXRsZV09XCJ0aXRsZVwiXG5cbiAgICAgICAgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCIgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCIgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiXG4gICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gICAgPC9jb21ldGNoYXQtbGlzdD5cbiAgICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1iYW5uZWRNZW1iZXI+XG4gICAgICAgIDxjb21ldGNoYXQtbGlzdC1pdGVtIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihiYW5uZWRNZW1iZXIpXCIgW3RpdGxlXT1cImJhbm5lZE1lbWJlcj8ubmFtZVwiIFthdmF0YXJVUkxdPVwiYmFubmVkTWVtYmVyPy5hdmF0YXJcIiBbYXZhdGFyTmFtZV09XCJiYW5uZWRNZW1iZXI/Lm5hbWVcIlxuICAgICAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiPlxuICAgICAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiICAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhiYW5uZWRNZW1iZXIpXCIgIFttZW51TGlzdFN0eWxlXT1cIm1lbnVMaXN0U3R5bGVcIj48L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmU7IGVsc2UgY2hhbmdlU2NvcGVcIiBjbGFzcz1cImNjLWJhbm5lZC1tZW1iZXJzX190YWlsLXZpZXdcIj5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8bmctdGVtcGxhdGUgICNjaGFuZ2VTY29wZT5cbiAgICAgICAgIDxkaXYgIHNsb3Q9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fdW5iYW5cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtidXR0b25TdHlsZV09XCJ1bmJhbkljb25TdHlsZVwiIFtpY29uVVJMXT1cInVuYmFuSWNvblVSTFwiIChjbGljayk9XCJ1bkJhbk1lbWJlcihiYW5uZWRNZW1iZXIpXCI+XG5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiIGNsYXNzPVwiY2MtYmFubmVkLW1lbWJlcnNfX3NlbGVjdGlvbi0tc2luZ2xlXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25NZW1iZXJzU2VsZWN0ZWQoYmFubmVkTWVtYmVyLCRldmVudClcIj48L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCIgY2xhc3M9XCJjYy1iYW5uZWQtbWVtYmVyc19fc2VsZWN0aW9uLS1tdWx0aXBsZVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbk1lbWJlcnNTZWxlY3RlZChiYW5uZWRNZW1iZXIsJGV2ZW50KVwiPjwvY29tZXRjaGF0LWNoZWNrYm94PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY2xvc2UtYnV0dG9uXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGUoKVwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJjbG9zZUNsaWNrZWQoKVwiPlxuXG4gICAgPC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19