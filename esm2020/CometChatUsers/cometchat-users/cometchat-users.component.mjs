import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, ListItemStyle, } from "@cometchat/uikit-elements";
import { SelectionMode, localize, TitleAlignment, States, CometChatUserEvents, fontHelper, } from "@cometchat/uikit-resources";
import { UsersStyle } from "@cometchat/uikit-shared";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { UserPresencePlacement } from "@cometchat/uikit-resources";
import { MessageUtils } from "../../Shared/Utils/MessageUtils";
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
            let userStatusVisibility = new MessageUtils().getUserStatusVisibility(user) || this.disableUsersPresence;
            if (!userStatusVisibility) {
                return (this.usersStyle?.onlineStatusColor ??
                    this.themeService?.theme.palette.getSuccess());
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
CometChatUsersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatUsersComponent, selector: "cometchat-users", inputs: { usersRequestBuilder: "usersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", disableUsersPresence: "disableUsersPresence", listItemView: "listItemView", menu: "menu", options: "options", activeUser: "activeUser", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", emptyStateView: "emptyStateView", onSelect: "onSelect", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", usersStyle: "usersStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", onItemClick: "onItemClick", searchKeyword: "searchKeyword", onEmpty: "onEmpty", userPresencePlacement: "userPresencePlacement", disableLoadingState: "disableLoadingState" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container  *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user }\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button  (cc-radio-button-checked)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox  (cc-checkbox-changed)=\"addMembersToList(user,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-users__selection--multiple{width:65px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-users", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container  *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user }\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button  (cc-radio-button-checked)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox  (cc-checkbox-changed)=\"addMembersToList(user,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-users__selection--multiple{width:65px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBQ1QsS0FBSyxHQUtOLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQ0wsV0FBVyxFQUVYLGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCxhQUFhLEVBQ2IsUUFBUSxFQUNSLGNBQWMsRUFDZCxNQUFNLEVBQ04sbUJBQW1CLEVBRW5CLFVBQVUsR0FDWCxNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxVQUFVLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUVoRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNuRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7O0FBTy9ELE1BQU0sT0FBTyx1QkFBdUI7SUErRWxDLFlBQ1UsR0FBc0IsRUFDdEIsWUFBbUM7UUFEbkMsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFDdEIsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBN0VwQyx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFLdEMs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QUFLO2dCQUVHLG1CQUFtQjtzQkFBM0IsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkluaXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhc2VTdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge1xuICBDb21ldENoYXRPcHRpb24sXG4gIFNlbGVjdGlvbk1vZGUsXG4gIGxvY2FsaXplLFxuICBUaXRsZUFsaWdubWVudCxcbiAgU3RhdGVzLFxuICBDb21ldENoYXRVc2VyRXZlbnRzLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgZm9udEhlbHBlcixcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBVc2Vyc1N0eWxlLCBMaXN0U3R5bGUgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBVc2VyUHJlc2VuY2VQbGFjZW1lbnQgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IE1lc3NhZ2VVdGlscyB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzXCI7XG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LXVzZXJzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRVc2Vyc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHVzZXJzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOiAoKG1lbWJlcjogQ29tZXRDaGF0LlVzZXIpID0+IENvbWV0Q2hhdE9wdGlvbltdKSB8IG51bGw7XG4gIEBJbnB1dCgpIGFjdGl2ZVVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlVTRVJTXCIpO1xuICBASW5wdXQoKSBvbkVycm9yPzogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKFxuICAgIGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uXG4gICkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfTtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblNlbGVjdCE6ICh1c2VyOiBDb21ldENoYXQuVXNlciwgc2VsZWN0ZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIHNob3dTZWN0aW9uSGVhZGVyOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBzdHJpbmcgPSBcIm5hbWVcIjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX1VTRVJTX0ZPVU5EXCIpO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmxlZnQ7XG4gIEBJbnB1dCgpIHVzZXJzU3R5bGU6IFVzZXJzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiLFxuICB9O1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICB9O1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4gdm9pZDtcbiAgQElucHV0KCkgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgb25FbXB0eT86ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHVzZXJQcmVzZW5jZVBsYWNlbWVudDogVXNlclByZXNlbmNlUGxhY2VtZW50ID1cbiAgICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQuYm90dG9tO1xuICBASW5wdXQoKSBkaXNhYmxlTG9hZGluZ1N0YXRlOiBib29sZWFuID0gZmFsc2U7XG4gIGZldGNoaW5nVXNlcnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hUaW1lT3V0OiBhbnk7XG4gIHVzZXJDaGVja2VkOiBzdHJpbmcgPSBcIlwiO1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IHt9O1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIHB1YmxpYyB1c2Vyc0xpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkOiBzdHJpbmcgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgcmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0O1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29ubmVjdGlvbkxpc3RlbmVySWQgPSBcImNvbm5lY3Rpb25fXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIHByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG4gIHB1YmxpYyBpc1dlYnNvY2tldFJlY29ubmVjdGVkOiBib29sZWFuID0gZmFsc2U7XG4gIC8qKlxuICAgKiBFdmVudHNcbiAgICovXG4gIGNjVXNlckJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlclVuQmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5maXJzdFJlbG9hZCA9IHRydWU7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIGlmICghdGhpcy5mZXRjaGluZ1VzZXJzKSB7XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpO1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG5cbiAgICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlc1tcInNlYXJjaEtleXdvcmRcIl0pIHtcbiAgICAgIHRoaXMuZmV0Y2hVc2Vyc09uU2VhcmNoS2V5V29yZENoYW5nZSgpO1xuICAgIH1cbiAgfVxuXG4gIGZldGNoVXNlcnNPblNlYXJjaEtleVdvcmRDaGFuZ2UgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuZmV0Y2hpbmdVc2Vycykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZmV0Y2hUaW1lT3V0KTtcbiAgICAgIHRoaXMuZmV0Y2hUaW1lT3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuc2VhcmNoRm9yVXNlcigpO1xuICAgICAgfSwgODAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZWFyY2hGb3JVc2VyKCk7XG4gICAgfVxuICB9O1xuXG4gIHNlYXJjaEZvclVzZXIgPSAoKSA9PiB7XG4gICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICB0aGlzLnVzZXJzTGlzdCA9IFtdO1xuICAgIH1cbiAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICB9O1xuXG4gIG9uVXNlclNlbGVjdGVkKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQ/LmRldGFpbD8uY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdCh1c2VyLCBzZWxlY3RlZCk7XG4gICAgfVxuICB9XG4gIGZldGNoTmV3VXNlcnMoKSB7XG4gICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuZmlyc3RSZWxvYWQgPyBTdGF0ZXMubG9hZGluZyA6IFN0YXRlcy5sb2FkZWQ7XG4gICAgdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3Qoc3RhdGUpO1xuICB9XG4gIC8vIHN1YnNjcmliZSB0byBnbG9iYWwgZXZlbnRzXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NVc2VyQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlVXNlciAmJiB1c2VyLmdldFVpZCgpID09IHRoaXMuYWN0aXZlVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHRoaXMuYWN0aXZlVXNlciA9IHVzZXI7XG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKHVzZXIpO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY1VzZXJVbkJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlclVuYmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlVXNlciAmJiB1c2VyLmdldFVpZCgpID09IHRoaXMuYWN0aXZlVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHRoaXMuYWN0aXZlVXNlciA9IHVzZXI7XG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKHVzZXIpO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjVXNlckJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJVbkJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy51c2Vyc1JlcXVlc3QgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgfVxuICBpc1VzZXJTZWxlY3RlZCh1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIHJldHVybiB1c2VyLmdldFVpZCgpID09PSB0aGlzLnVzZXJDaGVja2VkO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgb25DbGljayA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKHVzZXIpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBnZXRBY3RpdmVVc2VyID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZSA9PSBTZWxlY3Rpb25Nb2RlLm5vbmUgfHwgIXRoaXMuc2VsZWN0aW9uTW9kZSkge1xuICAgICAgaWYgKHVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5hY3RpdmVVc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGdldFN0YXR1c0luZGljYXRvckNvbG9yID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KHVzZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG5cbiAgICBpZiAoIXVzZXJTdGF0dXNWaXNpYmlsaXR5KSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB0aGlzLnVzZXJzU3R5bGU/Lm9ubGluZVN0YXR1c0NvbG9yID8/XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlPy50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgdXBkYXRlVXNlciA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCB1c2VybGlzdCA9IFsuLi50aGlzLnVzZXJzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgdXNlcktleSA9IHVzZXJsaXN0LmZpbmRJbmRleChcbiAgICAgICh1OiBDb21ldENoYXQuVXNlciwgaykgPT4gdS5nZXRVaWQoKSA9PSB1c2VyLmdldFVpZCgpXG4gICAgKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICB1c2VybGlzdC5zcGxpY2UodXNlcktleSwgMSwgdXNlcik7XG4gICAgICB0aGlzLnVzZXJzTGlzdCA9IFsuLi51c2VybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICBhdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IHRydWVcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3VXNlcnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgLy9BdHRhY2hpbmcgVXNlciBMaXN0ZW5lcnMgdG8gZHluYW1pbGNhbGx5IHVwZGF0ZSB3aGVuIGEgdXNlciBjb21lcyBvbmxpbmUgYW5kIGdvZXMgb2ZmbGluZVxuICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIob25saW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgIHRoaXMudXNlckxpc3RlbmVySWQgPSBcIlwiO1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCk7XG4gIH1cbiAgYWRkTWVtYmVyc1RvTGlzdCA9ICh1c2VyOiBDb21ldENoYXQuVXNlciwgZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50Py5kZXRhaWw/LmNoZWNrZWQ7XG4gICAgdGhpcy51c2VyQ2hlY2tlZCA9IHVzZXIuZ2V0VWlkKCk7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QodXNlciwgc2VsZWN0ZWQpO1xuICAgIH1cbiAgfTtcbiAgZmV0Y2hOZXh0VXNlcnNMaXN0ID0gKHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZykgPT4ge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gbnVsbDtcbiAgICBpZiAoISh0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUgJiYgc3RhdGUgPT0gU3RhdGVzLmxvYWRpbmcpKSB7XG4gICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgJiZcbiAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbiAmJlxuICAgICAgKCh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgPT0gMCB8fFxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlICE9XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi50b3RhbF9wYWdlcylcbiAgICApIHtcbiAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IHRydWU7XG4gICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAgICh1c2VyTGlzdDogQ29tZXRDaGF0LlVzZXJbXSkgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJMaXN0Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm9uRW1wdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRW1wdHkoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdXNlckxpc3QubGVuZ3RoIDw9IDAgJiZcbiAgICAgICAgICAgICAgKHRoaXMudXNlcnNMaXN0Py5sZW5ndGggPD0gMCB8fCB0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IHVzZXJMaXN0O1xuICAgICAgICAgICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbLi4udGhpcy51c2Vyc0xpc3QsIC4uLnVzZXJMaXN0XTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaEtleXdvcmQgIT0gdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgfHxcbiAgICAgICAgICAgICAgICAgIFswLCAxXS5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSB1c2VyTGlzdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbLi4udGhpcy51c2Vyc0xpc3QsIC4uLnVzZXJMaXN0XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG5cbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSB0aGlzLnNlYXJjaEtleXdvcmQ7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnVzZXJzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZldGNoaW5nVXNlcnMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgc2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKCF0aGlzLnNlYXJjaEtleXdvcmQpIHtcbiAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gXCJcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIgJiYgdGhpcy5zZWFyY2hLZXl3b3JkKSB7XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlclxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy51c2Vyc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdEJ1aWxkZXI7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5XG4gICAqL1xuICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmZldGNoaW5nVXNlcnMpIHtcbiAgICAgICAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICAgICAgICB9XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldFVzZXJzU3R5bGUoKTtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuXG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnVzZXJzU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCb3JkZXIsXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCb3JkZXJSYWRpdXMsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRGb250LFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcixcbiAgICAgIHNlYXJjaFRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hUZXh0Q29sb3IsXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuc2VjdGlvbkhlYWRlclRleHRDb2xvcixcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLnNlY3Rpb25IZWFkZXJUZXh0Rm9udCxcbiAgICB9O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgfSk7XG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuXG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9O1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlLFxuICAgIH07XG4gIH1cbiAgc2V0VXNlcnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBVc2Vyc1N0eWxlID0gbmV3IFVzZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgIH0pO1xuICAgIHRoaXMudXNlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnVzZXJzU3R5bGUgfTtcbiAgfVxuICB1c2VyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy51c2Vyc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLnVzZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy51c2Vyc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy51c2Vyc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLXVzZXJzXCIgW25nU3R5bGVdPVwidXNlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG5cbiAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuXG48L2Rpdj5cbiAgPGNvbWV0Y2hhdC1saXN0IFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiIFtvblNlYXJjaF09XCJvblNlYXJjaFwiXG4gICAgICBbbGlzdF09XCJ1c2Vyc0xpc3RcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICAgIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwic2VjdGlvbkhlYWRlckZpZWxkXCIgW3Nob3dTZWN0aW9uSGVhZGVyXT1cInNob3dTZWN0aW9uSGVhZGVyXCJcbiAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gIDwvY29tZXRjaGF0LWxpc3Q+XG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LXVzZXI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwidXNlcj8ubmFtZVwiIFthdmF0YXJVUkxdPVwidXNlcj8uYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwidXNlcj8ubmFtZVwiXG4gICAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImdldFN0YXR1c0luZGljYXRvckNvbG9yKHVzZXIpXCIgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2sodXNlcilcIiBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlVXNlcih1c2VyKVwiXG4gICAgICAgICAgW3VzZXJQcmVzZW5jZVBsYWNlbWVudF09XCJ1c2VyUHJlc2VuY2VQbGFjZW1lbnRcIj5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiB1c2VyIH1cIj5cbiAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiIGNsYXNzPVwiY2MtdXNlcnNfX29wdGlvbnNcIiAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyh1c2VyKVwiPlxuXG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSAhPSBzZWxlY3Rpb25tb2RlRW51bS5ub25lXCIgY2xhc3M9XCJjYy11c2Vyc19fdGFpbC12aWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIiBjbGFzcz1cImNjLXVzZXJzX19zZWxlY3Rpb24tLXNpbmdsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uICAoY2MtcmFkaW8tYnV0dG9uLWNoZWNrZWQpPVwiYWRkTWVtYmVyc1RvTGlzdCh1c2VyLCRldmVudClcIiBbY2hlY2tlZF09XCJpc1VzZXJTZWxlY3RlZCh1c2VyKVwiID48L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5tdWx0aXBsZVwiIGNsYXNzPVwiY2MtdXNlcnNfX3NlbGVjdGlvbi0tbXVsdGlwbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWNoZWNrYm94ICAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJhZGRNZW1iZXJzVG9MaXN0KHVzZXIsJGV2ZW50KVwiPjwvY29tZXRjaGF0LWNoZWNrYm94PlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cblxuICA8L25nLXRlbXBsYXRlPlxuPC9kaXY+XG5cbiJdfQ==