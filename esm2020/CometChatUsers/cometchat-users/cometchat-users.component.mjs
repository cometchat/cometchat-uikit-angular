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
        if (this.searchRequestBuilder) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBQ1QsS0FBSyxHQUtOLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQ0wsV0FBVyxFQUVYLGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCxhQUFhLEVBQ2IsUUFBUSxFQUNSLGNBQWMsRUFDZCxNQUFNLEVBQ04sbUJBQW1CLEVBQ25CLHVCQUF1QixFQUN2QixVQUFVLEdBQ1gsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUUsVUFBVSxFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFFaEUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFDMUUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7Ozs7O0FBT25FLE1BQU0sT0FBTyx1QkFBdUI7SUErRWxDLFlBQ1UsR0FBc0IsRUFDdEIsWUFBbUM7UUFEbkMsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFDdEIsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBN0VwQyx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFLdEMsa0JBQWEsR0FBWSxLQUFLLENBQUM7UUFDL0Isc0JB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S0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkluaXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhc2VTdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge1xuICBDb21ldENoYXRPcHRpb24sXG4gIFNlbGVjdGlvbk1vZGUsXG4gIGxvY2FsaXplLFxuICBUaXRsZUFsaWdubWVudCxcbiAgU3RhdGVzLFxuICBDb21ldENoYXRVc2VyRXZlbnRzLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgZm9udEhlbHBlcixcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBVc2Vyc1N0eWxlLCBMaXN0U3R5bGUgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBVc2VyUHJlc2VuY2VQbGFjZW1lbnQgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtdXNlcnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdFVzZXJzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgdXNlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzZWFyY2hSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBtZW51ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb3B0aW9ucyE6ICgobWVtYmVyOiBDb21ldENoYXQuVXNlcikgPT4gQ29tZXRDaGF0T3B0aW9uW10pIHwgbnVsbDtcbiAgQElucHV0KCkgYWN0aXZlVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gbG9jYWxpemUoXCJTRUFSQ0hcIik7XG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBzZWFyY2hJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9zZWFyY2guc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiVVNFUlNcIik7XG4gIEBJbnB1dCgpIG9uRXJyb3I/OiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBzZWxlY3RlZDogYm9vbGVhbikgPT4gdm9pZDtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgc2hvd1NlY3Rpb25IZWFkZXI6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBzZWN0aW9uSGVhZGVyRmllbGQ6IHN0cmluZyA9IFwibmFtZVwiO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fVVNFUlNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQubGVmdDtcbiAgQElucHV0KCkgdXNlcnNTdHlsZTogVXNlcnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBzZXBhcmF0b3JDb2xvcjogXCJyZ2IoMjIyIDIyMiAyMjIgLyA0NiUpXCIsXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gIH07XG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgfTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMjhweFwiLFxuICAgIGhlaWdodDogXCIyOHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB2b2lkO1xuICBASW5wdXQoKSBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBvbkVtcHR5PzogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgdXNlclByZXNlbmNlUGxhY2VtZW50OiBVc2VyUHJlc2VuY2VQbGFjZW1lbnQgPVxuICAgIFVzZXJQcmVzZW5jZVBsYWNlbWVudC5ib3R0b207XG4gIEBJbnB1dCgpIGRpc2FibGVMb2FkaW5nU3RhdGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hpbmdVc2VyczogYm9vbGVhbiA9IGZhbHNlO1xuICBmZXRjaFRpbWVPdXQ6IGFueTtcbiAgdXNlckNoZWNrZWQ6IHN0cmluZyA9IFwiXCI7XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge307XG4gIHB1YmxpYyB1c2Vyc1JlcXVlc3Q6IGFueTtcbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIHRpbWVvdXQ6IGFueTtcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgcHVibGljIHVzZXJzTGlzdDogQ29tZXRDaGF0LlVzZXJbXSA9IFtdO1xuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgdXNlckxpc3RlbmVySWQ6IHN0cmluZyA9IFwidXNlcmxpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICByZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3Q7XG4gIGZpcnN0UmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgcHJldmlvdXNTZWFyY2hLZXl3b3JkID0gXCJcIjtcbiAgcHVibGljIGlzV2Vic29ja2V0UmVjb25uZWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqXG4gICAqIEV2ZW50c1xuICAgKi9cbiAgY2NVc2VyQmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NVc2VyVW5CbG9ja2VkITogU3Vic2NyaXB0aW9uO1xuICBvblNjcm9sbGVkVG9Cb3R0b206IGFueSA9IG51bGw7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgaWYgKCF0aGlzLmZldGNoaW5nVXNlcnMpIHtcbiAgICAgICAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKCk7XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcblxuICAgICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1wic2VhcmNoS2V5d29yZFwiXSkge1xuICAgICAgdGhpcy5mZXRjaFVzZXJzT25TZWFyY2hLZXlXb3JkQ2hhbmdlKCk7XG4gICAgfVxuICB9XG5cbiAgZmV0Y2hVc2Vyc09uU2VhcmNoS2V5V29yZENoYW5nZSA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5mZXRjaGluZ1VzZXJzKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5mZXRjaFRpbWVPdXQpO1xuICAgICAgdGhpcy5mZXRjaFRpbWVPdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zZWFyY2hGb3JVc2VyKCk7XG4gICAgICB9LCA4MDApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlYXJjaEZvclVzZXIoKTtcbiAgICB9XG4gIH07XG5cbiAgc2VhcmNoRm9yVXNlciA9ICgpID0+IHtcbiAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgIHRoaXMudXNlcnNMaXN0ID0gW107XG4gICAgfVxuICAgIHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0KCk7XG4gIH07XG5cbiAgb25Vc2VyU2VsZWN0ZWQodXNlcjogQ29tZXRDaGF0LlVzZXIsIGV2ZW50OiBhbnkpIHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudD8uZGV0YWlsPy5jaGVja2VkO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIHNlbGVjdGVkKTtcbiAgICB9XG4gIH1cbiAgZmV0Y2hOZXdVc2VycygpIHtcbiAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgbGV0IHN0YXRlID0gdGhpcy5maXJzdFJlbG9hZCA/IFN0YXRlcy5sb2FkaW5nIDogU3RhdGVzLmxvYWRlZDtcbiAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdChzdGF0ZSk7XG4gIH1cbiAgLy8gc3Vic2NyaWJlIHRvIGdsb2JhbCBldmVudHNcbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLnN1YnNjcmliZShcbiAgICAgICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmVVc2VyICYmIHVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5hY3RpdmVVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmVVc2VyID0gdXNlcjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIodXNlcik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjVXNlclVuQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyVW5ibG9ja2VkLnN1YnNjcmliZShcbiAgICAgICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmVVc2VyICYmIHVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5hY3RpdmVVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmVVc2VyID0gdXNlcjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIodXNlcik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NVc2VyQmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjVXNlclVuQmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnVzZXJzUmVxdWVzdCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0YWNoKCk7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICB9XG4gIGlzVXNlclNlbGVjdGVkKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgcmV0dXJuIHVzZXIuZ2V0VWlkKCkgPT09IHRoaXMudXNlckNoZWNrZWQ7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBvbkNsaWNrID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2sodXNlcik7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGdldEFjdGl2ZVVzZXIgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBpZiAodGhpcy5zZWxlY3Rpb25Nb2RlID09IFNlbGVjdGlvbk1vZGUubm9uZSB8fCAhdGhpcy5zZWxlY3Rpb25Nb2RlKSB7XG4gICAgICBpZiAodXNlci5nZXRVaWQoKSA9PSB0aGlzLmFjdGl2ZVVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UpIHtcbiAgICAgIGlmICh1c2VyPy5nZXRTdGF0dXMoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vbmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICB0aGlzLnVzZXJzU3R5bGUub25saW5lU3RhdHVzQ29sb3IgfHxcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIHVwZGF0ZVVzZXIgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBsZXQgdXNlcmxpc3QgPSBbLi4udGhpcy51c2Vyc0xpc3RdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IHVzZXJLZXkgPSB1c2VybGlzdC5maW5kSW5kZXgoXG4gICAgICAodTogQ29tZXRDaGF0LlVzZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gdXNlci5nZXRVaWQoKVxuICAgICk7XG4gICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgaWYgKHVzZXJLZXkgPiAtMSkge1xuICAgICAgdXNlcmxpc3Quc3BsaWNlKHVzZXJLZXksIDEsIHVzZXIpO1xuICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbLi4udXNlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSB0cnVlXG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT5jb25uZWN0ZWRcIik7XG4gICAgICAgICAgdGhpcy5mZXRjaE5ld1VzZXJzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluQ29ubmVjdGluZzogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IEluIGNvbm5lY3RpbmdcIik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRGlzY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gT24gRGlzY29ubmVjdGVkXCIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIC8vQXR0YWNoaW5nIFVzZXIgTGlzdGVuZXJzIHRvIGR5bmFtaWxjYWxseSB1cGRhdGUgd2hlbiBhIHVzZXIgY29tZXMgb25saW5lIGFuZCBnb2VzIG9mZmxpbmVcbiAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgdGhpcy51c2VyTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKG9ubGluZVVzZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcihvZmZsaW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZVVzZXJMaXN0ZW5lcih0aGlzLnVzZXJMaXN0ZW5lcklkKTtcbiAgICB0aGlzLnVzZXJMaXN0ZW5lcklkID0gXCJcIjtcbiAgICBDb21ldENoYXQucmVtb3ZlQ29ubmVjdGlvbkxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQpO1xuICB9XG4gIGFkZE1lbWJlcnNUb0xpc3QgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIsIGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudD8uZGV0YWlsPy5jaGVja2VkO1xuICAgIHRoaXMudXNlckNoZWNrZWQgPSB1c2VyLmdldFVpZCgpO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIHNlbGVjdGVkKTtcbiAgICB9XG4gIH07XG4gIGZldGNoTmV4dFVzZXJzTGlzdCA9IChzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmcpID0+IHtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IG51bGw7XG4gICAgaWYgKCEodGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlICYmIHN0YXRlID09IFN0YXRlcy5sb2FkaW5nKSkge1xuICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyICYmXG4gICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24gJiZcbiAgICAgICgodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlID09IDAgfHxcbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSAhPVxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24udG90YWxfcGFnZXMpXG4gICAgKSB7XG4gICAgICB0aGlzLmZldGNoaW5nVXNlcnMgPSB0cnVlO1xuICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuZmV0Y2hOZXh0KCkudGhlbihcbiAgICAgICAgICAodXNlckxpc3Q6IENvbWV0Q2hhdC5Vc2VyW10pID0+IHtcbiAgICAgICAgICAgIGlmICh1c2VyTGlzdC5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5vbkVtcHR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVtcHR5KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHVzZXJMaXN0Lmxlbmd0aCA8PSAwICYmXG4gICAgICAgICAgICAgICh0aGlzLnVzZXJzTGlzdD8ubGVuZ3RoIDw9IDAgfHwgdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSB1c2VyTGlzdDtcbiAgICAgICAgICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gWy4uLnRoaXMudXNlcnNMaXN0LCAuLi51c2VyTGlzdF07XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hLZXl3b3JkICE9IHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkIHx8XG4gICAgICAgICAgICAgICAgICBbMCwgMV0uaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2VcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gdXNlckxpc3Q7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gWy4uLnRoaXMudXNlcnNMaXN0LCAuLi51c2VyTGlzdF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuXG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpO1xuICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZldGNoaW5nVXNlcnMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gdGhpcy5zZWFyY2hLZXl3b3JkO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy51c2Vyc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHNldFJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmICghdGhpcy5zZWFyY2hLZXl3b3JkKSB7XG4gICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyKSB7XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlclxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy51c2Vyc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdEJ1aWxkZXI7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5XG4gICAqL1xuICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmZldGNoaW5nVXNlcnMpIHtcbiAgICAgICAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICAgICAgICB9XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldFVzZXJzU3R5bGUoKTtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuXG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnVzZXJzU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCb3JkZXIsXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCb3JkZXJSYWRpdXMsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRGb250LFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcixcbiAgICAgIHNlYXJjaFRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hUZXh0Q29sb3IsXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuc2VjdGlvbkhlYWRlclRleHRDb2xvcixcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLnNlY3Rpb25IZWFkZXJUZXh0Rm9udCxcbiAgICB9O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgfSk7XG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuXG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9O1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlLFxuICAgIH07XG4gIH1cbiAgc2V0VXNlcnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBVc2Vyc1N0eWxlID0gbmV3IFVzZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgIH0pO1xuICAgIHRoaXMudXNlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnVzZXJzU3R5bGUgfTtcbiAgfVxuICB1c2VyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy51c2Vyc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLnVzZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy51c2Vyc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy51c2Vyc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLXVzZXJzXCIgW25nU3R5bGVdPVwidXNlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG5cbiAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuXG48L2Rpdj5cbiAgPGNvbWV0Y2hhdC1saXN0IFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiIFtvblNlYXJjaF09XCJvblNlYXJjaFwiXG4gICAgICBbbGlzdF09XCJ1c2Vyc0xpc3RcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICAgIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwic2VjdGlvbkhlYWRlckZpZWxkXCIgW3Nob3dTZWN0aW9uSGVhZGVyXT1cInNob3dTZWN0aW9uSGVhZGVyXCJcbiAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gIDwvY29tZXRjaGF0LWxpc3Q+XG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LXVzZXI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwidXNlcj8ubmFtZVwiIFthdmF0YXJVUkxdPVwidXNlcj8uYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwidXNlcj8ubmFtZVwiXG4gICAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImdldFN0YXR1c0luZGljYXRvckNvbG9yKHVzZXIpXCIgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2sodXNlcilcIiBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlVXNlcih1c2VyKVwiXG4gICAgICAgICAgW3VzZXJQcmVzZW5jZVBsYWNlbWVudF09XCJ1c2VyUHJlc2VuY2VQbGFjZW1lbnRcIj5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLXVzZXJzX19vcHRpb25zXCIgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnModXNlcilcIj5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiIGNsYXNzPVwiY2MtdXNlcnNfX3RhaWwtdmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCIgY2xhc3M9XCJjYy11c2Vyc19fc2VsZWN0aW9uLS1zaW5nbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAgKGNjLXJhZGlvLWJ1dHRvbi1jaGVja2VkKT1cImFkZE1lbWJlcnNUb0xpc3QodXNlciwkZXZlbnQpXCIgW2NoZWNrZWRdPVwiaXNVc2VyU2VsZWN0ZWQodXNlcilcIiA+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIiBjbGFzcz1cImNjLXVzZXJzX19zZWxlY3Rpb24tLW11bHRpcGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAgKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwiYWRkTWVtYmVyc1RvTGlzdCh1c2VyLCRldmVudClcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvZGl2PlxuXG4iXX0=