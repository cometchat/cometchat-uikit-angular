import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, ListItemStyle, } from "@cometchat/uikit-elements";
import { SelectionMode, localize, TitleAlignment, States, CometChatUserEvents, CometChatUIKitConstants, fontHelper, } from "@cometchat/uikit-resources";
import { UsersStyle } from "@cometchat/uikit-shared";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { UserPresencePlacement } from "@cometchat/uikit-resources";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatList/cometchat-list.component";
import * as i3 from "@angular/common";
export class CometChatUsersComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.disableUsersPresence = false;
        this.hideSeparator = false;
        this.searchPlaceholder = localize("SEARCH");
        this.hideError = false;
        this.selectionMode = SelectionMode.none;
        this.searchIconURL = "assets/search.svg";
        this.hideSearch = false;
        this.title = localize("USERS");
        this.onError = (error) => {
            console.log(error);
        };
        this.loadingIconURL = "assets/Spinner.svg";
        this.showSectionHeader = true;
        this.sectionHeaderField = "name";
        this.emptyStateText = localize("NO_USERS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.titleAlignment = TitleAlignment.left;
        this.usersStyle = {
            width: "100%",
            height: "100%",
            separatorColor: "rgb(222 222 222 / 46%)",
        };
        this.listItemStyle = {
            height: "100%",
            width: "100%",
        };
        this.statusIndicatorStyle = {
            height: "10px",
            width: "10px",
            borderRadius: "16px",
        };
        this.avatarStyle = {
            borderRadius: "16px",
            width: "28px",
            height: "28px",
        };
        this.searchKeyword = "";
        this.userPresencePlacement = UserPresencePlacement.bottom;
        this.disableLoadingState = false;
        this.fetchingUsers = false;
        this.userChecked = "";
        this.listStyle = {};
        this.state = States.loading;
        this.selectionmodeEnum = SelectionMode;
        this.usersList = [];
        this.limit = 30;
        this.userListenerId = "userlist_" + new Date().getTime();
        this.firstReload = false;
        this.connectionListenerId = "connection_" + new Date().getTime();
        this.previousSearchKeyword = "";
        this.isWebsocketReconnected = false;
        this.onScrolledToBottom = null;
        this.fetchUsersOnSearchKeyWordChange = () => {
            if (this.fetchingUsers) {
                clearTimeout(this.fetchTimeOut);
                this.fetchTimeOut = setTimeout(() => {
                    this.searchForUser();
                }, 800);
            }
            else {
                this.searchForUser();
            }
        };
        this.searchForUser = () => {
            this.setRequestBuilder();
            if (!this.disableLoadingState) {
                this.usersList = [];
            }
            this.fetchNextUsersList();
        };
        /**
         * @param  {CometChat.User} user
         */
        this.onClick = (user) => {
            if (this.onItemClick) {
                this.onItemClick(user);
            }
        };
        /**
         * @param  {CometChat.User} user
         */
        this.getActiveUser = (user) => {
            if (this.selectionMode == SelectionMode.none || !this.selectionMode) {
                if (user.getUid() == this.activeUser?.getUid()) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else
                return false;
        };
        /**
         * @param  {CometChat.User} user
         */
        this.getStatusIndicatorColor = (user) => {
            if (!this.disableUsersPresence) {
                if (user?.getStatus() == CometChatUIKitConstants.userStatusType.online) {
                    return (this.usersStyle.onlineStatusColor ||
                        this.themeService.theme.palette.getSuccess());
                }
                else {
                    return null;
                }
            }
            return null;
        };
        /**
         * @param  {CometChat.User} user
         */
        this.updateUser = (user) => {
            let userlist = [...this.usersList];
            //search for user
            let userKey = userlist.findIndex((u, k) => u.getUid() == user.getUid());
            //if found in the list, update user object
            if (userKey > -1) {
                userlist.splice(userKey, 1, user);
                this.usersList = [...userlist];
                this.ref.detectChanges();
            }
        };
        this.addMembersToList = (user, event) => {
            let selected = event?.detail?.checked;
            this.userChecked = user.getUid();
            if (this.onSelect) {
                this.onSelect(user, selected);
            }
        };
        this.fetchNextUsersList = (state = States.loading) => {
            this.onScrolledToBottom = null;
            if (!(this.disableLoadingState && state == States.loading)) {
                this.state = state;
            }
            if (this.requestBuilder &&
                this.requestBuilder.pagination &&
                (this.requestBuilder.pagination.current_page == 0 ||
                    this.requestBuilder.pagination.current_page !=
                        this.requestBuilder.pagination.total_pages)) {
                this.fetchingUsers = true;
                this.onScrolledToBottom = this.fetchNextUsersList;
                this.ref.detectChanges();
                try {
                    this.requestBuilder.fetchNext().then((userList) => {
                        if (userList.length <= 0) {
                            if (this.onEmpty) {
                                this.onEmpty();
                                this.previousSearchKeyword = "";
                            }
                        }
                        if (userList.length <= 0 &&
                            (this.usersList?.length <= 0 || this.disableLoadingState)) {
                            this.state = States.empty;
                            this.ref.detectChanges();
                        }
                        else {
                            if (!this.disableLoadingState) {
                                if (this.isWebsocketReconnected) {
                                    this.usersList = userList;
                                    this.isWebsocketReconnected = false;
                                }
                                else {
                                    this.usersList = [...this.usersList, ...userList];
                                }
                            }
                            else {
                                if (this.searchKeyword != this.previousSearchKeyword ||
                                    [0, 1].includes(this.requestBuilder.pagination.current_page)) {
                                    this.usersList = userList;
                                }
                                else {
                                    this.usersList = [...this.usersList, ...userList];
                                }
                            }
                            this.state = States.loaded;
                            this.ref.detectChanges();
                        }
                        if (this.firstReload) {
                            this.attachConnectionListeners();
                            this.firstReload = false;
                        }
                        this.fetchingUsers = false;
                        this.previousSearchKeyword = this.searchKeyword;
                    }, (error) => {
                        if (this.onError) {
                            this.onError(CometChatException(error));
                        }
                        this.state = States.error;
                        this.fetchingUsers = false;
                        this.ref.detectChanges();
                    });
                }
                catch (error) {
                    if (this.onError) {
                        this.onError(CometChatException(error));
                    }
                    if (this.usersList?.length <= 0) {
                        this.state = States.error;
                        this.ref.detectChanges();
                    }
                    this.fetchingUsers = false;
                }
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
                    this.setRequestBuilder();
                    if (!this.disableLoadingState) {
                        this.usersList = [];
                        this.ref.detectChanges();
                    }
                    if (!this.fetchingUsers) {
                        this.fetchNextUsersList();
                    }
                }, 500);
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.userStyle = () => {
            return {
                height: this.usersStyle.height,
                width: this.usersStyle.width,
                background: this.usersStyle.background,
                border: this.usersStyle.border,
                borderRadius: this.usersStyle.borderRadius,
            };
        };
        this.state = States.loading;
    }
    ngOnInit() {
        this.firstReload = true;
        this.state = States.loading;
        this.isWebsocketReconnected = false;
        this.setThemeStyle();
        this.subscribeToEvents();
        CometChat.getLoggedinUser()
            .then((user) => {
            this.setRequestBuilder();
            if (!this.fetchingUsers) {
                this.fetchNextUsersList();
            }
            this.attachListeners();
            this.loggedInUser = user;
            this.onScrolledToBottom = this.fetchNextUsersList;
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    ngOnChanges(changes) {
        if (changes["searchKeyword"]) {
            this.fetchUsersOnSearchKeyWordChange();
        }
    }
    onUserSelected(user, event) {
        let selected = event?.detail?.checked;
        if (this.onSelect) {
            this.onSelect(user, selected);
        }
    }
    fetchNewUsers() {
        this.setRequestBuilder();
        let state = this.firstReload ? States.loading : States.loaded;
        this.fetchNextUsersList(state);
    }
    // subscribe to global events
    subscribeToEvents() {
        this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((user) => {
            if (this.activeUser && user.getUid() == this.activeUser.getUid()) {
                this.activeUser = user;
                this.updateUser(user);
                this.ref.detectChanges();
            }
        });
        this.ccUserUnBlocked = CometChatUserEvents.ccUserUnblocked.subscribe((user) => {
            if (this.activeUser && user.getUid() == this.activeUser.getUid()) {
                this.activeUser = user;
                this.updateUser(user);
                this.ref.detectChanges();
            }
        });
    }
    unsubscribeToEvents() {
        this.ccUserBlocked?.unsubscribe();
        this.ccUserUnBlocked?.unsubscribe();
    }
    ngOnDestroy() {
        this.usersRequest = null;
        this.ref.detach();
        this.removeListener();
        this.state = States.loaded;
        this.unsubscribeToEvents();
    }
    isUserSelected(user) {
        return user.getUid() === this.userChecked;
    }
    attachConnectionListeners() {
        CometChat.addConnectionListener(this.connectionListenerId, new CometChat.ConnectionListener({
            onConnected: () => {
                this.isWebsocketReconnected = true;
                console.log("ConnectionListener =>connected");
                this.fetchNewUsers();
            },
            inConnecting: () => {
                console.log("ConnectionListener => In connecting");
            },
            onDisconnected: () => {
                this.isWebsocketReconnected = false;
                console.log("ConnectionListener => On Disconnected");
            },
        }));
    }
    attachListeners() {
        this.state = States.loading;
        this.ref.detectChanges();
        //Attaching User Listeners to dynamilcally update when a user comes online and goes offline
        CometChat.addUserListener(this.userListenerId, new CometChat.UserListener({
            onUserOnline: (onlineUser) => {
                /* when someuser/friend comes online, user will be received here */
                this.updateUser(onlineUser);
            },
            onUserOffline: (offlineUser) => {
                /* when someuser/friend went offline, user will be received here */
                this.updateUser(offlineUser);
            },
        }));
    }
    removeListener() {
        CometChat.removeUserListener(this.userListenerId);
        this.userListenerId = "";
        CometChat.removeConnectionListener(this.connectionListenerId);
    }
    setRequestBuilder() {
        if (!this.searchKeyword) {
            this.previousSearchKeyword = "";
        }
        if (this.searchRequestBuilder && this.searchKeyword) {
            this.requestBuilder = this.searchRequestBuilder
                .setSearchKeyword(this.searchKeyword)
                .build();
        }
        else if (this.usersRequestBuilder) {
            this.requestBuilder = this.usersRequestBuilder
                .setSearchKeyword(this.searchKeyword)
                .build();
        }
        else {
            this.requestBuilder = new CometChat.UsersRequestBuilder()
                .setLimit(this.limit)
                .setSearchKeyword(this.searchKeyword)
                .build();
        }
        return this.requestBuilder;
    }
    setThemeStyle() {
        this.setUsersStyle();
        this.setListItemStyle();
        this.setAvatarStyle();
        this.setStatusStyle();
        this.listStyle = {
            titleTextFont: this.usersStyle.titleTextFont,
            titleTextColor: this.usersStyle.titleTextColor,
            emptyStateTextFont: this.usersStyle.emptyStateTextFont,
            emptyStateTextColor: this.usersStyle.emptyStateTextColor,
            errorStateTextFont: this.usersStyle.errorStateTextFont,
            errorStateTextColor: this.usersStyle.errorStateTextColor,
            loadingIconTint: this.usersStyle.loadingIconTint,
            separatorColor: this.usersStyle.separatorColor,
            searchIconTint: this.usersStyle.searchIconTint,
            searchBorder: this.usersStyle.searchBorder,
            searchBorderRadius: this.usersStyle.searchBorderRadius,
            searchBackground: this.usersStyle.searchBackground,
            searchPlaceholderTextFont: this.usersStyle.searchPlaceholderTextFont,
            searchPlaceholderTextColor: this.usersStyle.searchPlaceholderTextColor,
            searchTextFont: this.usersStyle.searchTextFont,
            searchTextColor: this.usersStyle.searchTextColor,
            sectionHeaderTextColor: this.usersStyle.sectionHeaderTextColor,
            sectionHeaderTextFont: this.usersStyle.sectionHeaderTextFont,
        };
        this.ref.detectChanges();
    }
    setListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: this.themeService.theme.palette.getAccent100(),
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            hoverBackground: this.themeService.theme.palette.getAccent50(),
        });
        this.listItemStyle = { ...defaultStyle, ...this.listItemStyle };
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "28px",
            height: "28px",
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
        this.statusIndicatorStyle = {
            ...defaultStyle,
            ...this.statusIndicatorStyle,
        };
    }
    setUsersStyle() {
        let defaultStyle = new UsersStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            separatorColor: this.themeService.theme.palette.getAccent400(),
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            sectionHeaderTextColor: this.themeService.theme.palette.getAccent600(),
            sectionHeaderTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            searchIconTint: this.themeService.theme.palette.getAccent600(),
            searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            searchBackground: this.themeService.theme.palette.getAccent100(),
            searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchTextColor: this.themeService.theme.palette.getAccent600(),
            searchTextFont: fontHelper(this.themeService.theme.typography.text3),
        });
        this.usersStyle = { ...defaultStyle, ...this.usersStyle };
    }
}
CometChatUsersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatUsersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatUsersComponent, selector: "cometchat-users", inputs: { usersRequestBuilder: "usersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", disableUsersPresence: "disableUsersPresence", listItemView: "listItemView", menu: "menu", options: "options", activeUser: "activeUser", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", emptyStateView: "emptyStateView", onSelect: "onSelect", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", usersStyle: "usersStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", onItemClick: "onItemClick", searchKeyword: "searchKeyword", onEmpty: "onEmpty", userPresencePlacement: "userPresencePlacement", disableLoadingState: "disableLoadingState" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container *ngTemplateOutlet=\"subtitleView\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button  (cc-radio-button-checked)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox  (cc-checkbox-changed)=\"addMembersToList(user,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-users__selection--multiple{width:65px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-users", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container *ngTemplateOutlet=\"subtitleView\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button  (cc-radio-button-checked)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox  (cc-checkbox-changed)=\"addMembersToList(user,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-users__selection--multiple{width:65px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { usersRequestBuilder: [{
                type: Input
            }], searchRequestBuilder: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], menu: [{
                type: Input
            }], options: [{
                type: Input
            }], activeUser: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], searchPlaceholder: [{
                type: Input
            }], hideError: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], searchIconURL: [{
                type: Input
            }], hideSearch: [{
                type: Input
            }], title: [{
                type: Input
            }], onError: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], onSelect: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], showSectionHeader: [{
                type: Input
            }], sectionHeaderField: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], usersStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }], searchKeyword: [{
                type: Input
            }], onEmpty: [{
                type: Input
            }], userPresencePlacement: [{
                type: Input
            }], disableLoadingState: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBQ1QsS0FBSyxHQUtOLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQ0wsV0FBVyxFQUVYLGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCxhQUFhLEVBQ2IsUUFBUSxFQUNSLGNBQWMsRUFDZCxNQUFNLEVBQ04sbUJBQW1CLEVBQ25CLHVCQUF1QixFQUN2QixVQUFVLEdBQ1gsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUUsVUFBVSxFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFFaEUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFDMUUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7Ozs7O0FBT25FLE1BQU0sT0FBTyx1QkFBdUI7SUErRWxDLFlBQ1UsR0FBc0IsRUFDdEIsWUFBbUM7UUFEbkMsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFDdEIsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBN0VwQyx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFLdEMsa0JBQWEsR0FBWSxLQUFLLENBQUM7UUFDL0Isc0JB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Z0JBRUcsbUJBQW1CO3NCQUEzQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uSW5pdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgQmFzZVN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdE9wdGlvbixcbiAgU2VsZWN0aW9uTW9kZSxcbiAgbG9jYWxpemUsXG4gIFRpdGxlQWxpZ25tZW50LFxuICBTdGF0ZXMsXG4gIENvbWV0Q2hhdFVzZXJFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBmb250SGVscGVyLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IFVzZXJzU3R5bGUsIExpc3RTdHlsZSB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IFVzZXJQcmVzZW5jZVBsYWNlbWVudCB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC11c2Vyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0VXNlcnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB1c2Vyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHNlYXJjaFJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBhY3RpdmVVc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJVU0VSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcj86IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAodXNlcjogQ29tZXRDaGF0LlVzZXIsIHNlbGVjdGVkOiBib29sZWFuKSA9PiB2b2lkO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBzaG93U2VjdGlvbkhlYWRlcjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHNlY3Rpb25IZWFkZXJGaWVsZDogc3RyaW5nID0gXCJuYW1lXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19VU0VSU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBASW5wdXQoKSB1c2Vyc1N0eWxlOiBVc2Vyc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIixcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgfTtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHNlYXJjaEtleXdvcmQ6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIG9uRW1wdHk/OiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSB1c2VyUHJlc2VuY2VQbGFjZW1lbnQ6IFVzZXJQcmVzZW5jZVBsYWNlbWVudCA9XG4gICAgVXNlclByZXNlbmNlUGxhY2VtZW50LmJvdHRvbTtcbiAgQElucHV0KCkgZGlzYWJsZUxvYWRpbmdTdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBmZXRjaGluZ1VzZXJzOiBib29sZWFuID0gZmFsc2U7XG4gIGZldGNoVGltZU91dDogYW55O1xuICB1c2VyQ2hlY2tlZDogc3RyaW5nID0gXCJcIjtcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSB7fTtcbiAgcHVibGljIHVzZXJzUmVxdWVzdDogYW55O1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgdGltZW91dDogYW55O1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgdXNlcnNMaXN0OiBDb21ldENoYXQuVXNlcltdID0gW107XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZDogc3RyaW5nID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIHJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdDtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBwcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICBwdWJsaWMgaXNXZWJzb2NrZXRSZWNvbm5lY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuICAvKipcbiAgICogRXZlbnRzXG4gICAqL1xuICBjY1VzZXJCbG9ja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY1VzZXJVbkJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTogYW55ID0gbnVsbDtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2VcbiAgKSB7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICBpZiAoIXRoaXMuZmV0Y2hpbmdVc2Vycykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuXG4gICAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3Q7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJzZWFyY2hLZXl3b3JkXCJdKSB7XG4gICAgICB0aGlzLmZldGNoVXNlcnNPblNlYXJjaEtleVdvcmRDaGFuZ2UoKTtcbiAgICB9XG4gIH1cblxuICBmZXRjaFVzZXJzT25TZWFyY2hLZXlXb3JkQ2hhbmdlID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLmZldGNoaW5nVXNlcnMpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmZldGNoVGltZU91dCk7XG4gICAgICB0aGlzLmZldGNoVGltZU91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNlYXJjaEZvclVzZXIoKTtcbiAgICAgIH0sIDgwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2VhcmNoRm9yVXNlcigpO1xuICAgIH1cbiAgfTtcblxuICBzZWFyY2hGb3JVc2VyID0gKCkgPT4ge1xuICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3QoKTtcbiAgfTtcblxuICBvblVzZXJTZWxlY3RlZCh1c2VyOiBDb21ldENoYXQuVXNlciwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50Py5kZXRhaWw/LmNoZWNrZWQ7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QodXNlciwgc2VsZWN0ZWQpO1xuICAgIH1cbiAgfVxuICBmZXRjaE5ld1VzZXJzKCkge1xuICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmZpcnN0UmVsb2FkID8gU3RhdGVzLmxvYWRpbmcgOiBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0KHN0YXRlKTtcbiAgfVxuICAvLyBzdWJzY3JpYmUgdG8gZ2xvYmFsIGV2ZW50c1xuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjVXNlckJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlckJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZVVzZXIgJiYgdXNlci5nZXRVaWQoKSA9PSB0aGlzLmFjdGl2ZVVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICB0aGlzLmFjdGl2ZVVzZXIgPSB1c2VyO1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcih1c2VyKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NVc2VyVW5CbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJVbmJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZVVzZXIgJiYgdXNlci5nZXRVaWQoKSA9PSB0aGlzLmFjdGl2ZVVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICB0aGlzLmFjdGl2ZVVzZXIgPSB1c2VyO1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcih1c2VyKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyVW5CbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMudXNlcnNSZXF1ZXN0ID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gIH1cbiAgaXNVc2VyU2VsZWN0ZWQodXNlcjogQ29tZXRDaGF0LlVzZXIpIHtcbiAgICByZXR1cm4gdXNlci5nZXRVaWQoKSA9PT0gdGhpcy51c2VyQ2hlY2tlZDtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIG9uQ2xpY2sgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayh1c2VyKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgZ2V0QWN0aXZlVXNlciA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIGlmICh1c2VyLmdldFVpZCgpID09IHRoaXMuYWN0aXZlVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvciA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSkge1xuICAgICAgaWYgKHVzZXI/LmdldFN0YXR1cygpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIHRoaXMudXNlcnNTdHlsZS5vbmxpbmVTdGF0dXNDb2xvciB8fFxuICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgdXBkYXRlVXNlciA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCB1c2VybGlzdCA9IFsuLi50aGlzLnVzZXJzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgdXNlcktleSA9IHVzZXJsaXN0LmZpbmRJbmRleChcbiAgICAgICh1OiBDb21ldENoYXQuVXNlciwgaykgPT4gdS5nZXRVaWQoKSA9PSB1c2VyLmdldFVpZCgpXG4gICAgKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICB1c2VybGlzdC5zcGxpY2UodXNlcktleSwgMSwgdXNlcik7XG4gICAgICB0aGlzLnVzZXJzTGlzdCA9IFsuLi51c2VybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICBhdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IHRydWVcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3VXNlcnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgLy9BdHRhY2hpbmcgVXNlciBMaXN0ZW5lcnMgdG8gZHluYW1pbGNhbGx5IHVwZGF0ZSB3aGVuIGEgdXNlciBjb21lcyBvbmxpbmUgYW5kIGdvZXMgb2ZmbGluZVxuICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIob25saW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgIHRoaXMudXNlckxpc3RlbmVySWQgPSBcIlwiO1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCk7XG4gIH1cbiAgYWRkTWVtYmVyc1RvTGlzdCA9ICh1c2VyOiBDb21ldENoYXQuVXNlciwgZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50Py5kZXRhaWw/LmNoZWNrZWQ7XG4gICAgdGhpcy51c2VyQ2hlY2tlZCA9IHVzZXIuZ2V0VWlkKCk7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QodXNlciwgc2VsZWN0ZWQpO1xuICAgIH1cbiAgfTtcbiAgZmV0Y2hOZXh0VXNlcnNMaXN0ID0gKHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZykgPT4ge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gbnVsbDtcbiAgICBpZiAoISh0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUgJiYgc3RhdGUgPT0gU3RhdGVzLmxvYWRpbmcpKSB7XG4gICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgJiZcbiAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbiAmJlxuICAgICAgKCh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgPT0gMCB8fFxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlICE9XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi50b3RhbF9wYWdlcylcbiAgICApIHtcbiAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IHRydWU7XG4gICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAgICh1c2VyTGlzdDogQ29tZXRDaGF0LlVzZXJbXSkgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJMaXN0Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm9uRW1wdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRW1wdHkoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdXNlckxpc3QubGVuZ3RoIDw9IDAgJiZcbiAgICAgICAgICAgICAgKHRoaXMudXNlcnNMaXN0Py5sZW5ndGggPD0gMCB8fCB0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IHVzZXJMaXN0O1xuICAgICAgICAgICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbLi4udGhpcy51c2Vyc0xpc3QsIC4uLnVzZXJMaXN0XTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaEtleXdvcmQgIT0gdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgfHxcbiAgICAgICAgICAgICAgICAgIFswLCAxXS5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSB1c2VyTGlzdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbLi4udGhpcy51c2Vyc0xpc3QsIC4uLnVzZXJMaXN0XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG5cbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSB0aGlzLnNlYXJjaEtleXdvcmQ7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnVzZXJzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZldGNoaW5nVXNlcnMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgc2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKCF0aGlzLnNlYXJjaEtleXdvcmQpIHtcbiAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gXCJcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIgJiYgdGhpcy5zZWFyY2hLZXl3b3JkKSB7XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlclxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy51c2Vyc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdEJ1aWxkZXI7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5XG4gICAqL1xuICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmZldGNoaW5nVXNlcnMpIHtcbiAgICAgICAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICAgICAgICB9XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldFVzZXJzU3R5bGUoKTtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuXG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnVzZXJzU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCb3JkZXIsXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCb3JkZXJSYWRpdXMsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRGb250LFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcixcbiAgICAgIHNlYXJjaFRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hUZXh0Q29sb3IsXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuc2VjdGlvbkhlYWRlclRleHRDb2xvcixcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLnNlY3Rpb25IZWFkZXJUZXh0Rm9udCxcbiAgICB9O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgfSk7XG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuXG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9O1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlLFxuICAgIH07XG4gIH1cbiAgc2V0VXNlcnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBVc2Vyc1N0eWxlID0gbmV3IFVzZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgIH0pO1xuICAgIHRoaXMudXNlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnVzZXJzU3R5bGUgfTtcbiAgfVxuICB1c2VyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy51c2Vyc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLnVzZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy51c2Vyc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy51c2Vyc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLXVzZXJzXCIgW25nU3R5bGVdPVwidXNlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG5cbiAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuXG48L2Rpdj5cbiAgPGNvbWV0Y2hhdC1saXN0IFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiIFtvblNlYXJjaF09XCJvblNlYXJjaFwiXG4gICAgICBbbGlzdF09XCJ1c2Vyc0xpc3RcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICAgIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwic2VjdGlvbkhlYWRlckZpZWxkXCIgW3Nob3dTZWN0aW9uSGVhZGVyXT1cInNob3dTZWN0aW9uSGVhZGVyXCJcbiAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gIDwvY29tZXRjaGF0LWxpc3Q+XG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LXVzZXI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwidXNlcj8ubmFtZVwiIFthdmF0YXJVUkxdPVwidXNlcj8uYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwidXNlcj8ubmFtZVwiXG4gICAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImdldFN0YXR1c0luZGljYXRvckNvbG9yKHVzZXIpXCIgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2sodXNlcilcIiBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlVXNlcih1c2VyKVwiXG4gICAgICAgICAgW3VzZXJQcmVzZW5jZVBsYWNlbWVudF09XCJ1c2VyUHJlc2VuY2VQbGFjZW1lbnRcIj5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLXVzZXJzX19vcHRpb25zXCIgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnModXNlcilcIj5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiIGNsYXNzPVwiY2MtdXNlcnNfX3RhaWwtdmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCIgY2xhc3M9XCJjYy11c2Vyc19fc2VsZWN0aW9uLS1zaW5nbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAgKGNjLXJhZGlvLWJ1dHRvbi1jaGVja2VkKT1cImFkZE1lbWJlcnNUb0xpc3QodXNlciwkZXZlbnQpXCIgW2NoZWNrZWRdPVwiaXNVc2VyU2VsZWN0ZWQodXNlcilcIiA+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIiBjbGFzcz1cImNjLXVzZXJzX19zZWxlY3Rpb24tLW11bHRpcGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAgKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwiYWRkTWVtYmVyc1RvTGlzdCh1c2VyLCRldmVudClcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvZGl2PlxuXG4iXX0=