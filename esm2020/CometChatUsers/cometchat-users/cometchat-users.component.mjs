import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChildren, } from "@angular/core";
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
        this.selectedUsers = {};
        this.checkboxStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "4px",
            checkedBackgroundColor: "#2196F3",
            uncheckedBackgroundColor: "#ccc"
        };
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
            this.onRowClicked(user.getUid());
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
        this.getStatusIndicatorStyle = (user) => {
            let userStatusVisibility = new MessageUtils().getUserStatusVisibility(user) || this.disableUsersPresence;
            if (!userStatusVisibility) {
                return (this.statusIndicatorStyle);
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
            if (this.selectionMode === this.selectionmodeEnum.single) {
                this.userChecked = user.getUid();
            }
            if (this.onSelect) {
                this.onSelect(user, selected);
            }
            if (selected) {
                this.selectedUsers[user.getUid()] = user;
            }
            else {
                delete this.selectedUsers[user.getUid()];
            }
            this.ref.detectChanges();
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
        return user.getUid() === this.userChecked
            || this.selectedUsers?.[user.getUid()];
    }
    onRowClicked(uid) {
        const userCheckbox = this.checkboxes.find(checkboxRef => uid === checkboxRef.nativeElement.getAttribute('data-uid'));
        const userRadio = this.radios.find(radioRef => uid === radioRef.nativeElement.getAttribute('data-uid'));
        let input = null;
        if (userCheckbox && this.selectionMode === this.selectionmodeEnum.multiple) {
            const root = userCheckbox.nativeElement.shadowRoot || userCheckbox.nativeElement;
            input = root.querySelector('input[type="checkbox"]');
        }
        else if (userRadio && this.selectionMode === this.selectionmodeEnum.single) {
            const root = userRadio.nativeElement.shadowRoot || userRadio.nativeElement;
            input = root.querySelector('input[type="radio"]');
        }
        if (input)
            input.click();
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
        this.checkboxStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "4px",
            checkedBackgroundColor: this.themeService.theme.palette.getPrimary(),
            uncheckedBackgroundColor: this.themeService.theme.palette.getAccent400()
        };
    }
}
CometChatUsersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatUsersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatUsersComponent, selector: "cometchat-users", inputs: { usersRequestBuilder: "usersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", disableUsersPresence: "disableUsersPresence", listItemView: "listItemView", menu: "menu", options: "options", activeUser: "activeUser", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", emptyStateView: "emptyStateView", onSelect: "onSelect", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", usersStyle: "usersStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", onItemClick: "onItemClick", searchKeyword: "searchKeyword", onEmpty: "onEmpty", userPresencePlacement: "userPresencePlacement", disableLoadingState: "disableLoadingState" }, viewQueries: [{ propertyName: "checkboxes", predicate: ["checkboxElement"], descendants: true, read: ElementRef }, { propertyName: "radios", predicate: ["radioElement"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"getStatusIndicatorStyle(user)\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container  *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user }\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button [attr.data-uid]=\"user?.uid\" #radioElement (cc-radio-button-changed)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox [attr.data-uid]=\"user?.uid\" #checkboxElement [checkboxStyle]=\"checkboxStyle\"  (cc-checkbox-changed)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-users", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"getStatusIndicatorStyle(user)\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container  *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user }\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button [attr.data-uid]=\"user?.uid\" #radioElement (cc-radio-button-changed)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox [attr.data-uid]=\"user?.uid\" #checkboxElement [checkboxStyle]=\"checkboxStyle\"  (cc-checkbox-changed)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}\n"] }]
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
            }], checkboxes: [{
                type: ViewChildren,
                args: ['checkboxElement', { read: ElementRef }]
            }], radios: [{
                type: ViewChildren,
                args: ['radioElement', { read: ElementRef }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBQ1QsVUFBVSxFQUNWLEtBQUssRUFNTCxZQUFZLEdBQ2IsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFDTCxXQUFXLEVBR1gsYUFBYSxHQUNkLE1BQU0sMkJBQTJCLENBQUM7QUFFbkMsT0FBTyxFQUVMLGFBQWEsRUFDYixRQUFRLEVBQ1IsY0FBYyxFQUNkLE1BQU0sRUFDTixtQkFBbUIsRUFFbkIsVUFBVSxHQUNYLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLFVBQVUsRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBRWhFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ25FLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQzs7Ozs7QUFPL0QsTUFBTSxPQUFPLHVCQUF1QjtJQTBGbEMsWUFDVSxHQUFzQixFQUN0QixZQUFtQztRQURuQyxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUN0QixpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUF4RnBDLHlCQUFvQixH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bkIsS0FBSztnQkFLRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFFRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ2lELFVBQVU7c0JBQWhFLFlBQVk7dUJBQUMsaUJBQWlCLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFO2dCQUNELE1BQU07c0JBQXpELFlBQVk7dUJBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkluaXQsXG4gIFF1ZXJ5TGlzdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZHJlbixcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYXNlU3R5bGUsXG4gIENoZWNrYm94U3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBTZWxlY3Rpb25Nb2RlLFxuICBsb2NhbGl6ZSxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIFN0YXRlcyxcbiAgQ29tZXRDaGF0VXNlckV2ZW50cyxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIGZvbnRIZWxwZXIsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHsgVXNlcnNTdHlsZSwgTGlzdFN0eWxlIH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuaW1wb3J0IHsgVXNlclByZXNlbmNlUGxhY2VtZW50IH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC11c2Vyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0VXNlcnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB1c2Vyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHNlYXJjaFJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBhY3RpdmVVc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJVU0VSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcj86IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAodXNlcjogQ29tZXRDaGF0LlVzZXIsIHNlbGVjdGVkOiBib29sZWFuKSA9PiB2b2lkO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBzaG93U2VjdGlvbkhlYWRlcjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHNlY3Rpb25IZWFkZXJGaWVsZDogc3RyaW5nID0gXCJuYW1lXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19VU0VSU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBASW5wdXQoKSB1c2Vyc1N0eWxlOiBVc2Vyc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIixcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgfTtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHNlYXJjaEtleXdvcmQ6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIG9uRW1wdHk/OiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSB1c2VyUHJlc2VuY2VQbGFjZW1lbnQ6IFVzZXJQcmVzZW5jZVBsYWNlbWVudCA9XG4gICAgVXNlclByZXNlbmNlUGxhY2VtZW50LmJvdHRvbTtcbiAgQElucHV0KCkgZGlzYWJsZUxvYWRpbmdTdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBAVmlld0NoaWxkcmVuKCdjaGVja2JveEVsZW1lbnQnLCB7IHJlYWQ6IEVsZW1lbnRSZWYgfSkgY2hlY2tib3hlcyE6IFF1ZXJ5TGlzdDxFbGVtZW50UmVmPjtcbiAgQFZpZXdDaGlsZHJlbigncmFkaW9FbGVtZW50JywgeyByZWFkOiBFbGVtZW50UmVmIH0pIHJhZGlvcyE6IFF1ZXJ5TGlzdDxFbGVtZW50UmVmPjtcbiAgZmV0Y2hpbmdVc2VyczogYm9vbGVhbiA9IGZhbHNlO1xuICBmZXRjaFRpbWVPdXQ6IGFueTtcbiAgdXNlckNoZWNrZWQ6IHN0cmluZyA9IFwiXCI7XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge307XG4gIHB1YmxpYyB1c2Vyc1JlcXVlc3Q6IGFueTtcbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIHRpbWVvdXQ6IGFueTtcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgcHVibGljIHVzZXJzTGlzdDogQ29tZXRDaGF0LlVzZXJbXSA9IFtdO1xuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgdXNlckxpc3RlbmVySWQ6IHN0cmluZyA9IFwidXNlcmxpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICByZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3Q7XG4gIGZpcnN0UmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgcHJldmlvdXNTZWFyY2hLZXl3b3JkID0gXCJcIjtcbiAgcHVibGljIGlzV2Vic29ja2V0UmVjb25uZWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHNlbGVjdGVkVXNlcnM6IHtbdWlkOiBzdHJpbmddOiBDb21ldENoYXQuVXNlcn0gPSB7fTtcbiAgY2hlY2tib3hTdHlsZTogQ2hlY2tib3hTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI0cHhcIixcbiAgICBjaGVja2VkQmFja2dyb3VuZENvbG9yOiBcIiMyMTk2RjNcIixcbiAgICB1bmNoZWNrZWRCYWNrZ3JvdW5kQ29sb3I6IFwiI2NjY1wiXG4gIH1cbiAgLyoqXG4gICAqIEV2ZW50c1xuICAgKi9cbiAgY2NVc2VyQmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NVc2VyVW5CbG9ja2VkITogU3Vic2NyaXB0aW9uO1xuICBvblNjcm9sbGVkVG9Cb3R0b206IGFueSA9IG51bGw7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgaWYgKCF0aGlzLmZldGNoaW5nVXNlcnMpIHtcbiAgICAgICAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKCk7XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcblxuICAgICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1wic2VhcmNoS2V5d29yZFwiXSkge1xuICAgICAgdGhpcy5mZXRjaFVzZXJzT25TZWFyY2hLZXlXb3JkQ2hhbmdlKCk7XG4gICAgfVxuICB9XG5cbiAgZmV0Y2hVc2Vyc09uU2VhcmNoS2V5V29yZENoYW5nZSA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5mZXRjaGluZ1VzZXJzKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5mZXRjaFRpbWVPdXQpO1xuICAgICAgdGhpcy5mZXRjaFRpbWVPdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zZWFyY2hGb3JVc2VyKCk7XG4gICAgICB9LCA4MDApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlYXJjaEZvclVzZXIoKTtcbiAgICB9XG4gIH07XG5cbiAgc2VhcmNoRm9yVXNlciA9ICgpID0+IHtcbiAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgIHRoaXMudXNlcnNMaXN0ID0gW107XG4gICAgfVxuICAgIHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0KCk7XG4gIH07XG5cbiAgb25Vc2VyU2VsZWN0ZWQodXNlcjogQ29tZXRDaGF0LlVzZXIsIGV2ZW50OiBhbnkpIHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudD8uZGV0YWlsPy5jaGVja2VkO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIHNlbGVjdGVkKTtcbiAgICB9XG4gIH1cbiAgZmV0Y2hOZXdVc2VycygpIHtcbiAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgbGV0IHN0YXRlID0gdGhpcy5maXJzdFJlbG9hZCA/IFN0YXRlcy5sb2FkaW5nIDogU3RhdGVzLmxvYWRlZDtcbiAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdChzdGF0ZSk7XG4gIH1cbiAgLy8gc3Vic2NyaWJlIHRvIGdsb2JhbCBldmVudHNcbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLnN1YnNjcmliZShcbiAgICAgICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmVVc2VyICYmIHVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5hY3RpdmVVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmVVc2VyID0gdXNlcjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIodXNlcik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjVXNlclVuQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyVW5ibG9ja2VkLnN1YnNjcmliZShcbiAgICAgICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmVVc2VyICYmIHVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5hY3RpdmVVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmVVc2VyID0gdXNlcjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIodXNlcik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NVc2VyQmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjVXNlclVuQmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnVzZXJzUmVxdWVzdCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0YWNoKCk7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICB9XG4gIGlzVXNlclNlbGVjdGVkKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgcmV0dXJuIHVzZXIuZ2V0VWlkKCkgPT09IHRoaXMudXNlckNoZWNrZWQgXG4gICAgfHwgdGhpcy5zZWxlY3RlZFVzZXJzPy5bdXNlci5nZXRVaWQoKV07XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBvbkNsaWNrID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2sodXNlcik7XG4gICAgfVxuICAgIHRoaXMub25Sb3dDbGlja2VkKHVzZXIuZ2V0VWlkKCkpO1xuICB9O1xuXG4gIG9uUm93Q2xpY2tlZCh1aWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHVzZXJDaGVja2JveCA9IHRoaXMuY2hlY2tib3hlcy5maW5kKGNoZWNrYm94UmVmID0+IHVpZCA9PT0gY2hlY2tib3hSZWYubmF0aXZlRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdWlkJykpO1xuICAgIGNvbnN0IHVzZXJSYWRpbyA9IHRoaXMucmFkaW9zLmZpbmQocmFkaW9SZWYgPT4gdWlkID09PSByYWRpb1JlZi5uYXRpdmVFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS11aWQnKSk7XG4gICAgbGV0IGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICBpZiAodXNlckNoZWNrYm94ICYmIHRoaXMuc2VsZWN0aW9uTW9kZSA9PT0gdGhpcy5zZWxlY3Rpb25tb2RlRW51bS5tdWx0aXBsZSkge1xuICAgICAgY29uc3Qgcm9vdDogYW55ID0gdXNlckNoZWNrYm94Lm5hdGl2ZUVsZW1lbnQuc2hhZG93Um9vdCB8fCB1c2VyQ2hlY2tib3gubmF0aXZlRWxlbWVudDtcbiAgICAgIGlucHV0ID0gcm9vdC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodXNlclJhZGlvICYmIHRoaXMuc2VsZWN0aW9uTW9kZSA9PT0gdGhpcy5zZWxlY3Rpb25tb2RlRW51bS5zaW5nbGUpIHtcbiAgICAgIGNvbnN0IHJvb3Q6IGFueSA9IHVzZXJSYWRpby5uYXRpdmVFbGVtZW50LnNoYWRvd1Jvb3QgfHwgdXNlclJhZGlvLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBpbnB1dCA9IHJvb3QucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cInJhZGlvXCJdJyk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0KSBpbnB1dC5jbGljaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBnZXRBY3RpdmVVc2VyID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZSA9PSBTZWxlY3Rpb25Nb2RlLm5vbmUgfHwgIXRoaXMuc2VsZWN0aW9uTW9kZSkge1xuICAgICAgaWYgKHVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5hY3RpdmVVc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGdldFN0YXR1c0luZGljYXRvckNvbG9yID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KHVzZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG5cbiAgICBpZiAoIXVzZXJTdGF0dXNWaXNpYmlsaXR5KSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB0aGlzLnVzZXJzU3R5bGU/Lm9ubGluZVN0YXR1c0NvbG9yID8/XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlPy50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG4gIFxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGdldFN0YXR1c0luZGljYXRvclN0eWxlID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KHVzZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG4gICAgaWYoIXVzZXJTdGF0dXNWaXNpYmlsaXR5KXtcbiAgICAgIHJldHVybihcbiAgICAgICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZVxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIHVwZGF0ZVVzZXIgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBsZXQgdXNlcmxpc3QgPSBbLi4udGhpcy51c2Vyc0xpc3RdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IHVzZXJLZXkgPSB1c2VybGlzdC5maW5kSW5kZXgoXG4gICAgICAodTogQ29tZXRDaGF0LlVzZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gdXNlci5nZXRVaWQoKVxuICAgICk7XG4gICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgaWYgKHVzZXJLZXkgPiAtMSkge1xuICAgICAgdXNlcmxpc3Quc3BsaWNlKHVzZXJLZXksIDEsIHVzZXIpO1xuICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbLi4udXNlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSB0cnVlXG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT5jb25uZWN0ZWRcIik7XG4gICAgICAgICAgdGhpcy5mZXRjaE5ld1VzZXJzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluQ29ubmVjdGluZzogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IEluIGNvbm5lY3RpbmdcIik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRGlzY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gT24gRGlzY29ubmVjdGVkXCIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIC8vQXR0YWNoaW5nIFVzZXIgTGlzdGVuZXJzIHRvIGR5bmFtaWxjYWxseSB1cGRhdGUgd2hlbiBhIHVzZXIgY29tZXMgb25saW5lIGFuZCBnb2VzIG9mZmxpbmVcbiAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgdGhpcy51c2VyTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKG9ubGluZVVzZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcihvZmZsaW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZVVzZXJMaXN0ZW5lcih0aGlzLnVzZXJMaXN0ZW5lcklkKTtcbiAgICB0aGlzLnVzZXJMaXN0ZW5lcklkID0gXCJcIjtcbiAgICBDb21ldENoYXQucmVtb3ZlQ29ubmVjdGlvbkxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQpO1xuICB9XG4gIGFkZE1lbWJlcnNUb0xpc3QgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIsIGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudD8uZGV0YWlsPy5jaGVja2VkO1xuICAgIGlmKHRoaXMuc2VsZWN0aW9uTW9kZSA9PT0gdGhpcy5zZWxlY3Rpb25tb2RlRW51bS5zaW5nbGUpe1xuICAgICAgdGhpcy51c2VyQ2hlY2tlZCA9IHVzZXIuZ2V0VWlkKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIHNlbGVjdGVkKTtcbiAgICB9XG4gICAgaWYgKHNlbGVjdGVkKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkVXNlcnNbdXNlci5nZXRVaWQoKV0gPSB1c2VyO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFVzZXJzW3VzZXIuZ2V0VWlkKCldO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7IFxuICB9O1xuICBmZXRjaE5leHRVc2Vyc0xpc3QgPSAoc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIGlmICghKHRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSAmJiBzdGF0ZSA9PSBTdGF0ZXMubG9hZGluZykpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciAmJlxuICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uICYmXG4gICAgICAoKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT1cbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLnRvdGFsX3BhZ2VzKVxuICAgICkge1xuICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gdHJ1ZTtcbiAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3Q7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLmZldGNoTmV4dCgpLnRoZW4oXG4gICAgICAgICAgKHVzZXJMaXN0OiBDb21ldENoYXQuVXNlcltdKSA9PiB7XG4gICAgICAgICAgICBpZiAodXNlckxpc3QubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub25FbXB0eSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25FbXB0eSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gXCJcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB1c2VyTGlzdC5sZW5ndGggPD0gMCAmJlxuICAgICAgICAgICAgICAodGhpcy51c2Vyc0xpc3Q/Lmxlbmd0aCA8PSAwIHx8IHRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gdXNlckxpc3Q7XG4gICAgICAgICAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IFsuLi50aGlzLnVzZXJzTGlzdCwgLi4udXNlckxpc3RdO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoS2V5d29yZCAhPSB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCB8fFxuICAgICAgICAgICAgICAgICAgWzAsIDFdLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IHVzZXJMaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IFsuLi50aGlzLnVzZXJzTGlzdCwgLi4udXNlckxpc3RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcblxuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgICB0aGlzLmF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IHRoaXMuc2VhcmNoS2V5d29yZDtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLmZldGNoaW5nVXNlcnMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudXNlcnNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBzZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAoIXRoaXMuc2VhcmNoS2V5d29yZCkge1xuICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlciAmJiB0aGlzLnNlYXJjaEtleXdvcmQpIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnVzZXJzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0QnVpbGRlcjtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXlcbiAgICovXG4gIG9uU2VhcmNoID0gKGtleTogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2VhcmNoS2V5d29yZCA9IGtleTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IFtdO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZmV0Y2hpbmdVc2Vycykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0VXNlcnNTdHlsZSgpO1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKCk7XG5cbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudXNlcnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hJY29uVGludCxcbiAgICAgIHNlYXJjaEJvcmRlcjogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaEJvcmRlcixcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCYWNrZ3JvdW5kLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaFRleHRDb2xvcixcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWN0aW9uSGVhZGVyVGV4dENvbG9yLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuc2VjdGlvbkhlYWRlclRleHRGb250LFxuICAgIH07XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICAgIGhlaWdodDogXCIyOHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG5cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH07XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRVc2Vyc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFVzZXJzU3R5bGUgPSBuZXcgVXNlcnNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgfSk7XG4gICAgdGhpcy51c2Vyc1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMudXNlcnNTdHlsZSB9O1xuICAgIHRoaXMuY2hlY2tib3hTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjRweFwiLFxuICAgICAgY2hlY2tlZEJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB1bmNoZWNrZWRCYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKClcbiAgICB9XG4gIH1cbiAgdXNlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMudXNlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy51c2Vyc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy51c2Vyc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMudXNlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMudXNlcnNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy11c2Vyc1wiIFtuZ1N0eWxlXT1cInVzZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZW51c1wiICpuZ0lmPVwibWVudVwiPlxuXG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cblxuPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIiBbb25TZWFyY2hdPVwib25TZWFyY2hcIlxuICAgICAgW2xpc3RdPVwidXNlcnNMaXN0XCIgW3NlYXJjaFRleHRdPVwic2VhcmNoS2V5d29yZFwiIFtzZWFyY2hQbGFjZWhvbGRlclRleHRdPVwic2VhcmNoUGxhY2Vob2xkZXJcIlxuICAgICAgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIiBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgICBbc2VjdGlvbkhlYWRlckZpZWxkXT1cInNlY3Rpb25IZWFkZXJGaWVsZFwiIFtzaG93U2VjdGlvbkhlYWRlcl09XCJzaG93U2VjdGlvbkhlYWRlclwiXG4gICAgICBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIiBbbG9hZGluZ0ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIlxuICAgICAgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCIgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiXG4gICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiIFtzdGF0ZV09XCJzdGF0ZVwiPlxuICA8L2NvbWV0Y2hhdC1saXN0PlxuICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC11c2VyPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cInVzZXI/Lm5hbWVcIiBbYXZhdGFyVVJMXT1cInVzZXI/LmF2YXRhclwiIFthdmF0YXJOYW1lXT1cInVzZXI/Lm5hbWVcIlxuICAgICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUodXNlcilcIlxuICAgICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcih1c2VyKVwiIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkNsaWNrKHVzZXIpXCIgW2lzQWN0aXZlXT1cImdldEFjdGl2ZVVzZXIodXNlcilcIlxuICAgICAgICAgIFt1c2VyUHJlc2VuY2VQbGFjZW1lbnRdPVwidXNlclByZXNlbmNlUGxhY2VtZW50XCI+XG4gICAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciB9XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLXVzZXJzX19vcHRpb25zXCIgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnModXNlcilcIj5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiIGNsYXNzPVwiY2MtdXNlcnNfX3RhaWwtdmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCIgY2xhc3M9XCJjYy11c2Vyc19fc2VsZWN0aW9uLS1zaW5nbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiBbYXR0ci5kYXRhLXVpZF09XCJ1c2VyPy51aWRcIiAjcmFkaW9FbGVtZW50IChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJhZGRNZW1iZXJzVG9MaXN0KHVzZXIsJGV2ZW50KVwiIFtjaGVja2VkXT1cImlzVXNlclNlbGVjdGVkKHVzZXIpXCIgPjwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCIgY2xhc3M9XCJjYy11c2Vyc19fc2VsZWN0aW9uLS1tdWx0aXBsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtY2hlY2tib3ggW2F0dHIuZGF0YS11aWRdPVwidXNlcj8udWlkXCIgI2NoZWNrYm94RWxlbWVudCBbY2hlY2tib3hTdHlsZV09XCJjaGVja2JveFN0eWxlXCIgIChjYy1jaGVja2JveC1jaGFuZ2VkKT1cImFkZE1lbWJlcnNUb0xpc3QodXNlciwkZXZlbnQpXCIgW2NoZWNrZWRdPVwiaXNVc2VyU2VsZWN0ZWQodXNlcilcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvZGl2PlxuIl19