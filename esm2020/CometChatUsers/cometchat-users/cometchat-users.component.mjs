import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChildren, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, ListItemStyle, } from "@cometchat/uikit-elements";
import { SelectionMode, localize, TitleAlignment, States, CometChatUserEvents, fontHelper, } from "@cometchat/uikit-resources";
import { UsersStyle, SelectedUserPreviewStyle } from "@cometchat/uikit-shared";
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
        this.selectedUserPreviewStyle = {};
        this.showSelectedUsersPreview = false;
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
        this.removeMemberButtonStyle = {
            height: "16px",
            width: "16px",
            iconHeight: "16px",
            iconWidth: "16px",
            border: "none",
            borderRadius: "50%",
            background: "transparent",
            buttonIconTint: "black"
        };
        this.selectedUsersPreviewWrapper = {};
        // Bulk selection properties
        this.lastSelectedIndex = -1;
        this.isShiftPressed = false;
        this.selectedUserPillStyle = {};
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
            const currentIndex = this.usersList.findIndex(u => u.getUid() === user.getUid());
            // Check if shift key was pressed for bulk selection
            if (this.isShiftPressed && this.lastSelectedIndex !== -1 && currentIndex !== -1) {
                this.handleBulkSelection(currentIndex, selected);
            }
            else {
                // Regular single selection
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
                this.lastSelectedIndex = currentIndex;
            }
            this.ref.detectChanges();
        };
        /**
         * Handle checkbox click to detect shift key
         */
        this.onCheckboxClick = (user, event) => {
            this.isShiftPressed = event.shiftKey;
        };
        /**
         * Handle checkbox changed event
         */
        this.onCheckboxChanged = (user, event) => {
            this.addMembersToList(user, event);
            // Reset shift flag after processing
            this.isShiftPressed = false;
        };
        /**
         * Handle keyboard events for accessibility
         */
        this.onKeyDown = (event) => {
            // Track shift key state for keyboard navigation
            if (event.key === 'Shift') {
                this.isShiftPressed = true;
            }
        };
        /**
         * Handle keyboard events for accessibility
         */
        this.onKeyUp = (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = false;
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
                        console.log(userList);
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
                    if (!this.fetchingUsers || (this.fetchingUsers && key == "")) {
                        this.usersList = [];
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
    getUserNameStyle() {
        return {
            font: this.selectedUserPreviewStyle.textFont || fontHelper(this.themeService.theme.typography.name),
            color: this.selectedUserPreviewStyle.textColor || this.themeService.theme.palette.getAccent(),
        };
    }
    /**
     * Handle bulk selection when shift+click is used
     */
    handleBulkSelection(currentIndex, selected) {
        const startIndex = Math.min(this.lastSelectedIndex, currentIndex);
        const endIndex = Math.max(this.lastSelectedIndex, currentIndex);
        const shouldSelect = selected;
        // Apply selection/deselection to all users in range
        for (let i = startIndex; i <= endIndex; i++) {
            const user = this.usersList[i];
            if (user) {
                const wasSelected = !!this.selectedUsers[user.getUid()];
                if (shouldSelect && !wasSelected) {
                    this.selectedUsers[user.getUid()] = user;
                    if (this.onSelect) {
                        this.onSelect(user, true);
                    }
                    this.updateCheckboxState(user.getUid(), true);
                }
                else if (!shouldSelect && wasSelected) {
                    delete this.selectedUsers[user.getUid()];
                    if (this.onSelect) {
                        this.onSelect(user, false);
                    }
                    this.updateCheckboxState(user.getUid(), false);
                }
            }
        }
        this.lastSelectedIndex = currentIndex;
    }
    /**
     * Update checkbox state programmatically
     */
    updateCheckboxState(userId, checked) {
        setTimeout(() => {
            if (this.checkboxes) {
                const userCheckbox = this.checkboxes.find(checkboxRef => userId === checkboxRef.nativeElement.getAttribute('data-uid'));
                if (userCheckbox) {
                    const root = userCheckbox.nativeElement.shadowRoot || userCheckbox.nativeElement;
                    const input = root.querySelector('input[type="checkbox"]');
                    if (input && input.checked !== checked) {
                        input.checked = checked;
                        const changeEvent = new Event('change', { bubbles: true });
                        input.dispatchEvent(changeEvent);
                    }
                }
            }
        }, 0);
    }
    /**
     * Get array of selected users for preview
     */
    getSelectedUsersArray() {
        return Object.values(this.selectedUsers);
    }
    /**
     * Get count of selected users
     */
    getSelectedUsersCount() {
        return Object.keys(this.selectedUsers).length;
    }
    /**
     * Remove user from selection by triggering checkbox click
     */
    removeSelectedUser(user) {
        const userCheckbox = this.checkboxes.find(checkboxRef => user.getUid() === checkboxRef.nativeElement.getAttribute('data-uid'));
        if (userCheckbox) {
            const root = userCheckbox.nativeElement.shadowRoot || userCheckbox.nativeElement;
            const input = root.querySelector('input[type="checkbox"]');
            if (input) {
                input.click();
            }
        }
    }
    /**
     * Track by function for ngFor performance
     */
    trackByUserId(index, user) {
        return user.getUid();
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
        this.setSelectedUserStyle();
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
    setSelectedUserStyle() {
        let defaultStyle = new SelectedUserPreviewStyle({
            borderRadius: "1000px",
            width: "140px",
            height: "fit-content",
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            textColor: this.themeService.theme.palette.getAccent(),
            textFont: fontHelper(this.themeService.theme.typography.name),
            background: this.themeService.theme.palette.getBackground(),
            closeIconTint: this.themeService.theme.palette.getPrimary(),
        });
        this.selectedUserPreviewStyle = { ...defaultStyle, ...this.selectedUserPreviewStyle };
        this.removeMemberButtonStyle.buttonIconTint = this.selectedUserPreviewStyle.closeIconTint || this.themeService.theme.palette.getAccent600();
        this.selectedUserPillStyle = {
            borderRadius: this.selectedUserPreviewStyle.borderRadius || "1000px",
            width: this.selectedUserPreviewStyle.width || "140px",
            height: this.selectedUserPreviewStyle.height || "fit-content",
            border: this.selectedUserPreviewStyle.border || `none`,
            color: this.selectedUserPreviewStyle.textColor || this.themeService.theme.palette.getAccent(),
            font: this.selectedUserPreviewStyle.textFont || fontHelper(this.themeService.theme.typography.name),
            background: this.selectedUserPreviewStyle.background || this.themeService.theme.palette.getBackground(),
        };
        this.selectedUsersPreviewWrapper = {
            borderTop: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            borderBottom: `none`,
            background: this.usersStyle.background || "transparent"
        };
    }
}
CometChatUsersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatUsersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatUsersComponent, selector: "cometchat-users", inputs: { usersRequestBuilder: "usersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", disableUsersPresence: "disableUsersPresence", listItemView: "listItemView", menu: "menu", options: "options", activeUser: "activeUser", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", emptyStateView: "emptyStateView", onSelect: "onSelect", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", usersStyle: "usersStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", selectedUserPreviewStyle: "selectedUserPreviewStyle", showSelectedUsersPreview: "showSelectedUsersPreview", onItemClick: "onItemClick", searchKeyword: "searchKeyword", onEmpty: "onEmpty", userPresencePlacement: "userPresencePlacement", disableLoadingState: "disableLoadingState" }, viewQueries: [{ propertyName: "checkboxes", predicate: ["checkboxElement"], descendants: true, read: ElementRef }, { propertyName: "radios", predicate: ["radioElement"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\" (keydown)=\"onKeyDown($event)\" (keyup)=\"onKeyUp($event)\" tabindex=\"0\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n  </div>\n\n  <!-- Users List -->\n  <div class=\"cc-users__list\" [class.cc-users__list--with-selection]=\"getSelectedUsersCount() > 0\">\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n        [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n        [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n        [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n        [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n        [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n        [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n  </div>\n\n  <!-- Selected Users Preview Section -->\n  <div class=\"cc-selected-users\" [style]=\"selectedUsersPreviewWrapper\" *ngIf=\"showSelectedUsersPreview && getSelectedUsersCount() > 0\">\n    <div class=\"cc-selected-users__list\">\n      <div class=\"cc-selected-user\" *ngFor=\"let user of getSelectedUsersArray(); trackBy: trackByUserId\" [style]=\"selectedUserPillStyle\">\n        <div class=\"cc-selected-user__avatar\">\n          <cometchat-avatar \n            [image]=\"user?.getAvatar() || ''\" \n            [name]=\"user?.getName()\" \n            [avatarStyle]=\"avatarStyle\">\n          </cometchat-avatar>\n        </div>\n        <div class=\"cc-selected-user__name\" [style]=\"getUserNameStyle()\">{{user?.getName()}}</div>\n        <div class=\"cc-selected-user__remove\" (click)=\"removeSelectedUser(user)\">\n          <cometchat-button \n            [iconURL]=\"'assets/close2x.svg'\" \n            [buttonStyle]=\"removeMemberButtonStyle\">\n          </cometchat-button>\n        </div>\n      </div>\n    </div>\n  </div>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"getStatusIndicatorStyle(user)\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container  *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user }\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button [attr.data-uid]=\"user?.uid\" #radioElement (cc-radio-button-changed)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox \n            [attr.data-uid]=\"user?.uid\" \n            #checkboxElement \n            [checkboxStyle]=\"checkboxStyle\"  \n            (cc-checkbox-changed)=\"onCheckboxChanged(user, $event)\"\n            (click)=\"onCheckboxClick(user, $event)\" \n            [checked]=\"isUserSelected(user)\">\n          </cometchat-checkbox>\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-selected-users{padding:12px;background:transparent;max-height:150px;overflow-x:hidden;overflow-y:auto}.cc-selected-users__list{display:flex;flex-wrap:wrap;gap:8px}.cc-selected-user{display:flex;align-items:center;border-radius:20px;padding:4px 8px 4px 4px;width:140px;animation:slideInUp .3s ease-out}.cc-selected-user__avatar{flex-shrink:0}.cc-selected-user__name{flex:1;margin:0 8px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-selected-user__remove{flex-shrink:0;cursor:pointer}.cc-selected-user__remove:hover{opacity:.7}.cc-users__list{flex:1;overflow:hidden}.cc-selected-users::-webkit-scrollbar{background:transparent;width:8px}.cc-selected-users::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-users__list--with-selection .cc-users__selection--multiple{position:relative}@keyframes slideInUp{0%{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i3.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-users", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-users\" [ngStyle]=\"userStyle()\" (keydown)=\"onKeyDown($event)\" (keyup)=\"onKeyUp($event)\" tabindex=\"0\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n  </div>\n\n  <!-- Users List -->\n  <div class=\"cc-users__list\" [class.cc-users__list--with-selection]=\"getSelectedUsersCount() > 0\">\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n        [list]=\"usersList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n        [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n        [sectionHeaderField]=\"sectionHeaderField\" [showSectionHeader]=\"showSectionHeader\"\n        [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n        [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n        [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n  </div>\n\n  <!-- Selected Users Preview Section -->\n  <div class=\"cc-selected-users\" [style]=\"selectedUsersPreviewWrapper\" *ngIf=\"showSelectedUsersPreview && getSelectedUsersCount() > 0\">\n    <div class=\"cc-selected-users__list\">\n      <div class=\"cc-selected-user\" *ngFor=\"let user of getSelectedUsersArray(); trackBy: trackByUserId\" [style]=\"selectedUserPillStyle\">\n        <div class=\"cc-selected-user__avatar\">\n          <cometchat-avatar \n            [image]=\"user?.getAvatar() || ''\" \n            [name]=\"user?.getName()\" \n            [avatarStyle]=\"avatarStyle\">\n          </cometchat-avatar>\n        </div>\n        <div class=\"cc-selected-user__name\" [style]=\"getUserNameStyle()\">{{user?.getName()}}</div>\n        <div class=\"cc-selected-user__remove\" (click)=\"removeSelectedUser(user)\">\n          <cometchat-button \n            [iconURL]=\"'assets/close2x.svg'\" \n            [buttonStyle]=\"removeMemberButtonStyle\">\n          </cometchat-button>\n        </div>\n      </div>\n    </div>\n  </div>\n  <ng-template #listItem let-user>\n      <cometchat-list-item [title]=\"user?.name\" [avatarURL]=\"user?.avatar\" [avatarName]=\"user?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"getStatusIndicatorStyle(user)\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(user)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(user)\" [isActive]=\"getActiveUser(user)\"\n          [userPresencePlacement]=\"userPresencePlacement\">\n          <div slot=\"subtitleView\" *ngIf=\"subtitleView\">\n              <ng-container  *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user }\">\n              </ng-container>\n          </div>\n\n          <div slot=\"menuView\" class=\"cc-users__options\" *ngIf=\"options\">\n              <cometchat-menu-list [data]=\"options(user)\">\n\n              </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\"  *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-users__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-users__selection--single\">\n          <cometchat-radio-button [attr.data-uid]=\"user?.uid\" #radioElement (cc-radio-button-changed)=\"addMembersToList(user,$event)\" [checked]=\"isUserSelected(user)\" ></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-users__selection--multiple\">\n          <cometchat-checkbox \n            [attr.data-uid]=\"user?.uid\" \n            #checkboxElement \n            [checkboxStyle]=\"checkboxStyle\"  \n            (cc-checkbox-changed)=\"onCheckboxChanged(user, $event)\"\n            (click)=\"onCheckboxClick(user, $event)\" \n            [checked]=\"isUserSelected(user)\">\n          </cometchat-checkbox>\n        </div>\n      </ng-template>\n      </cometchat-list-item>\n\n  </ng-template>\n</div>\n", styles: [".cc-users{height:100%;width:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden}.cc-menus{position:absolute;right:12px;padding:12px;cursor:pointer}.cc-selected-users{padding:12px;background:transparent;max-height:150px;overflow-x:hidden;overflow-y:auto}.cc-selected-users__list{display:flex;flex-wrap:wrap;gap:8px}.cc-selected-user{display:flex;align-items:center;border-radius:20px;padding:4px 8px 4px 4px;width:140px;animation:slideInUp .3s ease-out}.cc-selected-user__avatar{flex-shrink:0}.cc-selected-user__name{flex:1;margin:0 8px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-selected-user__remove{flex-shrink:0;cursor:pointer}.cc-selected-user__remove:hover{opacity:.7}.cc-users__list{flex:1;overflow:hidden}.cc-selected-users::-webkit-scrollbar{background:transparent;width:8px}.cc-selected-users::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-users__list--with-selection .cc-users__selection--multiple{position:relative}@keyframes slideInUp{0%{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}\n"] }]
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
            }], selectedUserPreviewStyle: [{
                type: Input
            }], showSelectedUsersPreview: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBQ1QsVUFBVSxFQUNWLEtBQUssRUFNTCxZQUFZLEdBQ2IsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFDTCxXQUFXLEVBR1gsYUFBYSxHQUNkLE1BQU0sMkJBQTJCLENBQUM7QUFFbkMsT0FBTyxFQUVMLGFBQWEsRUFDYixRQUFRLEVBQ1IsY0FBYyxFQUNkLE1BQU0sRUFDTixtQkFBbUIsRUFFbkIsVUFBVSxHQUNYLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLFVBQVUsRUFBYSx3QkFBd0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTFGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ25FLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQzs7Ozs7QUFPL0QsTUFBTSxPQUFPLHVCQUF1QjtJQWdIbEMsWUFDVSxHQUFzQixFQUN0QixZQUFtQztRQURuQyxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUN0QixpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUE5R3BDLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQUt0QyxrQkFBYSxHQUFZLEtBQUssQ0FBQztRQUMvQixzQkFBaUIsR0FBVyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0MsY0FBUyxHQUFZLEtBQUssQ0FBQztRQUMzQixrQkFBYSxHQUFrQixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ2xELGtCQUFhLEdBQVcsbUJBQW1CLENBQUM7UUFDNUMsZUFBVSxHQUFZLEtBQUssQ0FBQztRQUM1QixVQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLFlBQU8sR0FBbUQsQ0FDakUsS0FBbUMsRUFDbkMsRUFBRTtZQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDO1FBSU8sbUJBQWMsR0FBVyxvQkFBb0IsQ0FBQztRQUM5QyxzQkFBaUIsR0FBWSxJQUFJLENBQUM7UUFDbEMsdUJBQWtCLEdBQVcsTUFBTSxDQUFDO1FBRXBDLG1CQUFjLEdBQVcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDcEQsbUJBQWMsR0FBVyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNyRCxtQkFBYyxHQUFtQixjQUFjLENBQUMsSUFBSSxDQUFDO1FBQ3JELGVBQVUsR0FBZTtZQUNoQyxLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxNQUFNO1lBQ2QsY0FBYyxFQUFFLHdCQUF3QjtTQUN6QyxDQUFDO1FBQ08sa0JBQWEsR0FBa0I7WUFDdEMsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtTQUNkLENBQUM7UUFDTyx5QkFBb0IsR0FBYztZQUN6QyxNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsWUFBWSxFQUFFLE1BQU07U0FDckIsQ0FBQztRQUNPLGdCQUFXLEdBQWdCO1lBQ2xDLFlBQVksRUFBRSxNQUFNO1lBQ3BCLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07U0FDZixDQUFDO1FBQ08sNkJBQXdCLEdBQTZCLEVBQUUsQ0FBQztRQUN4RCw2QkFBd0IsR0FBWSxLQUFLLENBQUM7UUFHMUMsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFFM0IsMEJBQXFCLEdBQzVCLHFCQUFxQixDQUFDLE1BQU0sQ0FBQztRQUN0Qix3QkFBbUIsR0FBWSxLQUFLLENBQUM7UUFHOUMsa0JBQWEsR0FBWSxLQUFLLENBQUM7UUFFL0IsZ0JBQVcsR0FBVyxFQUFFLENBQUM7UUFDekIsY0FBUyxHQUFjLEVBQUUsQ0FBQztRQUVuQixVQUFLLEdBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUV0QyxzQkFBaUIsR0FBeUIsYUFBYSxDQUFDO1FBQ2pELGNBQVMsR0FBcUIsRUFBRSxDQUFDO1FBQ2pDLFVBQUssR0FBVyxFQUFFLENBQUM7UUFDbkIsbUJBQWMsR0FBVyxXQUFXLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUduRSxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUN0Qix5QkFBb0IsR0FBRyxhQUFhLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1RCwwQkFBcUIsR0FBRyxFQUFFLENBQUM7UUFDM0IsMkJBQXNCLEdBQVksS0FBSyxDQUFDO1FBQ3hDLGtCQUFhLEdBQW9DLEVBQUUsQ0FBQztRQUMzRCxrQkFBYSxHQUFrQjtZQUM3QixNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxZQUFZLEVBQUUsS0FBSztZQUNuQixzQkFBc0IsRUFBRSxTQUFTO1lBQ2pDLHdCQUF3QixFQUFFLE1BQU07U0FDakMsQ0FBQTtRQUdELDRCQUF1QixHQUFHO1lBQ3hCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixVQUFVLEVBQUUsTUFBTTtZQUNsQixTQUFTLEVBQUMsTUFBTTtZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxLQUFLO1lBQ25CLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLGNBQWMsRUFBRSxPQUFPO1NBQ3hCLENBQUM7UUFDRixnQ0FBMkIsR0FBRyxFQUFFLENBQUE7UUFFaEMsNEJBQTRCO1FBQ3BCLHNCQUFpQixHQUFXLENBQUMsQ0FBQyxDQUFDO1FBQy9CLG1CQUFjLEdBQVksS0FBSyxDQUFDO1FBQ3hDLDBCQUFxQixHQUFHLEVBQUUsQ0FBQztRQU8zQix1QkFBa0IsR0FBUSxJQUFJLENBQUM7UUFzQy9CLG9DQUErQixHQUFHLEdBQUcsRUFBRTtZQUNyQyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ3RCLFlBQVksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtvQkFDbEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN2QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDVDtpQkFBTTtnQkFDTCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDdEI7UUFDSCxDQUFDLENBQUM7UUFFRixrQkFBYSxHQUFHLEdBQUcsRUFBRTtZQUNuQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFO2dCQUM3QixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQzthQUNyQjtZQUNELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQztRQWlERjs7V0FFRztRQUNILFlBQU8sR0FBRyxDQUFDLElBQW9CLEVBQUUsRUFBRTtZQUNqQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDeEI7WUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQztRQW1CRjs7V0FFRztRQUNILGtCQUFhLEdBQUcsQ0FBQyxJQUFvQixFQUFFLEVBQUU7WUFDdkMsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLGFBQWEsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUNuRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUM5QyxPQUFPLElBQUksQ0FBQztpQkFDYjtxQkFBTTtvQkFDTCxPQUFPLEtBQUssQ0FBQztpQkFDZDthQUNGOztnQkFBTSxPQUFPLEtBQUssQ0FBQztRQUN0QixDQUFDLENBQUM7UUFDRjs7V0FFRztRQUNILDRCQUF1QixHQUFHLENBQUMsSUFBb0IsRUFBRSxFQUFFO1lBQ2pELElBQUksb0JBQW9CLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUM7WUFFekcsSUFBSSxDQUFDLG9CQUFvQixFQUFFO2dCQUN6QixPQUFPLENBQ0wsSUFBSSxDQUFDLFVBQVUsRUFBRSxpQkFBaUI7b0JBQ2xDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FDOUMsQ0FBQzthQUNIO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUM7UUFFRjs7V0FFRztRQUNILDRCQUF1QixHQUFHLENBQUMsSUFBb0IsRUFBRSxFQUFFO1lBQ2pELElBQUksb0JBQW9CLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUM7WUFDekcsSUFBRyxDQUFDLG9CQUFvQixFQUFDO2dCQUN2QixPQUFNLENBQ0osSUFBSSxDQUFDLG9CQUFvQixDQUMxQixDQUFBO2FBQ0Y7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsQ0FBQTtRQUNEOztXQUVHO1FBQ0gsZUFBVSxHQUFHLENBQUMsSUFBb0IsRUFBRSxFQUFFO1lBQ3BDLElBQUksUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkMsaUJBQWlCO1lBQ2pCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQzlCLENBQUMsQ0FBaUIsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQ3RELENBQUM7WUFDRiwwQ0FBMEM7WUFDMUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hCLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDMUI7UUFDSCxDQUFDLENBQUM7UUEyQ0YscUJBQWdCLEdBQUcsQ0FBQyxJQUFvQixFQUFFLEtBQVUsRUFBRSxFQUFFO1lBQ3RELElBQUksUUFBUSxHQUFZLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDO1lBQy9DLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRWpGLG9EQUFvRDtZQUNwRCxJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLENBQUMsQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDL0UsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNsRDtpQkFBTTtnQkFDTCwyQkFBMkI7Z0JBQzNCLElBQUcsSUFBSSxDQUFDLGFBQWEsS0FBSyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFDO29CQUN0RCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDbEM7Z0JBRUQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztpQkFDL0I7Z0JBRUQsSUFBSSxRQUFRLEVBQUU7b0JBQ1osSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7aUJBQzFDO3FCQUFNO29CQUNMLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztpQkFDMUM7Z0JBQ0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFlBQVksQ0FBQzthQUN2QztZQUVELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDO1FBUUY7O1dBRUc7UUFDSCxvQkFBZSxHQUFHLENBQUMsSUFBb0IsRUFBRSxLQUFZLEVBQUUsRUFBRTtZQUN2RCxJQUFJLENBQUMsY0FBYyxHQUFJLEtBQW9CLENBQUMsUUFBUSxDQUFDO1FBQ3ZELENBQUMsQ0FBQztRQUVGOztXQUVHO1FBQ0gsc0JBQWlCLEdBQUcsQ0FBQyxJQUFvQixFQUFFLEtBQVUsRUFBRSxFQUFFO1lBQ3ZELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkMsb0NBQW9DO1lBQ3BDLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1FBQzlCLENBQUMsQ0FBQztRQUVGOztXQUVHO1FBQ0gsY0FBUyxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO1lBQ25DLGdEQUFnRDtZQUNoRCxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssT0FBTyxFQUFFO2dCQUN6QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQzthQUM1QjtRQUNILENBQUMsQ0FBQztRQUVGOztXQUVHO1FBQ0gsWUFBTyxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO1lBQ2pDLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxPQUFPLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO2FBQzdCO1FBQ0gsQ0FBQyxDQUFDO1FBZ0dGLHVCQUFrQixHQUFHLENBQUMsUUFBZ0IsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ3RELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDL0IsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixJQUFJLEtBQUssSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzFELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ3BCO1lBQ0QsSUFDRSxJQUFJLENBQUMsY0FBYztnQkFDbEIsSUFBSSxDQUFDLGNBQXNCLENBQUMsVUFBVTtnQkFDdkMsQ0FBRSxJQUFJLENBQUMsY0FBc0IsQ0FBQyxVQUFVLENBQUMsWUFBWSxJQUFJLENBQUM7b0JBQ3ZELElBQUksQ0FBQyxjQUFzQixDQUFDLFVBQVUsQ0FBQyxZQUFZO3dCQUNuRCxJQUFJLENBQUMsY0FBc0IsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQ3REO2dCQUNBLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO2dCQUMxQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDO2dCQUNsRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN6QixJQUFJO29CQUNGLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUNsQyxDQUFDLFFBQTBCLEVBQUUsRUFBRTt3QkFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTt3QkFDckIsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTs0QkFDeEIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dDQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0NBQ2YsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEVBQUUsQ0FBQzs2QkFDakM7eUJBQ0Y7d0JBQ0QsSUFDRSxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUM7NEJBQ3BCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUN6RDs0QkFDQSxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7NEJBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7eUJBQzFCOzZCQUFNOzRCQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUU7Z0NBQzdCLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFO29DQUMvQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztvQ0FDMUIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztpQ0FDckM7cUNBQ0k7b0NBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDO2lDQUVuRDs2QkFDRjtpQ0FBTTtnQ0FDTCxJQUNFLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLHFCQUFxQjtvQ0FDaEQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUNaLElBQUksQ0FBQyxjQUFzQixDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQ3JELEVBQ0Q7b0NBQ0EsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7aUNBQzNCO3FDQUFNO29DQUNMLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQztpQ0FDbkQ7NkJBQ0Y7NEJBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDOzRCQUUzQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3lCQUMxQjt3QkFDRCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7NEJBQ3BCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDOzRCQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQzt5QkFDMUI7d0JBQ0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7d0JBQzNCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO29CQUNsRCxDQUFDLEVBQ0QsQ0FBQyxLQUFVLEVBQUUsRUFBRTt3QkFDYixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7NEJBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzt5QkFDekM7d0JBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO3dCQUMxQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQzt3QkFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQyxDQUNGLENBQUM7aUJBQ0g7Z0JBQUMsT0FBTyxLQUFVLEVBQUU7b0JBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTt3QkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3FCQUN6QztvQkFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUMsRUFBRTt3QkFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO3dCQUMxQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtvQkFDRCxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztpQkFDNUI7YUFDRjtRQUNILENBQUMsQ0FBQztRQXNCRjs7V0FFRztRQUNILGFBQVEsR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFO1lBQ3pCLElBQUk7Z0JBQ0YsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUM7Z0JBQ3pCLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtvQkFDN0IsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUU7d0JBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO3dCQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtvQkFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFO3dCQUM1RCxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQzt3QkFDcEIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7cUJBQzNCO2dCQUNILENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNUO1lBQUMsT0FBTyxLQUFVLEVBQUU7Z0JBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUN6QzthQUNGO1FBQ0gsQ0FBQyxDQUFDO1FBNElGLGNBQVMsR0FBRyxHQUFHLEVBQUU7WUFDZixPQUFPO2dCQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU07Z0JBQzlCLEtBQUssRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUs7Z0JBQzVCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVU7Z0JBQ3RDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU07Z0JBQzlCLFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVk7YUFDM0MsQ0FBQztRQUNKLENBQUMsQ0FBQztRQXZwQkEsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0lBQzlCLENBQUM7SUFDRCxRQUFRO1FBQ04sSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQzVCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFFcEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pCLFNBQVMsQ0FBQyxlQUFlLEVBQUU7YUFDeEIsSUFBSSxDQUFDLENBQUMsSUFBMkIsRUFBRSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUN2QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzthQUMzQjtZQUNELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUV6QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ3BELENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLEtBQW1DLEVBQUUsRUFBRTtZQUM3QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDckI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxXQUFXLENBQUMsT0FBc0I7UUFDaEMsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDNUIsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7U0FDeEM7SUFDSCxDQUFDO0lBcUJELGNBQWMsQ0FBQyxJQUFvQixFQUFFLEtBQVU7UUFDN0MsSUFBSSxRQUFRLEdBQVksS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7UUFDL0MsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztJQUNELGFBQWE7UUFDWCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN6QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzlELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsNkJBQTZCO0lBQzdCLGlCQUFpQjtRQUNmLElBQUksQ0FBQyxhQUFhLEdBQUcsbUJBQW1CLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FDOUQsQ0FBQyxJQUFvQixFQUFFLEVBQUU7WUFDdkIsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNoRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtRQUNILENBQUMsQ0FDRixDQUFDO1FBQ0YsSUFBSSxDQUFDLGVBQWUsR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUNsRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtZQUN2QixJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2hFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzFCO1FBQ0gsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0lBQ0QsbUJBQW1CO1FBQ2pCLElBQUksQ0FBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsV0FBVztRQUNULElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBQ0QsY0FBYyxDQUFDLElBQW9CO1FBQ2pDLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxXQUFXO2VBQ3RDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBV0QsWUFBWSxDQUFDLEdBQVc7UUFDdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssV0FBVyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNySCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxRQUFRLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3hHLElBQUksS0FBSyxHQUE0QixJQUFJLENBQUM7UUFFMUMsSUFBSSxZQUFZLElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFO1lBQzFFLE1BQU0sSUFBSSxHQUFRLFlBQVksQ0FBQyxhQUFhLENBQUMsVUFBVSxJQUFJLFlBQVksQ0FBQyxhQUFhLENBQUM7WUFDdEYsS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsQ0FBQztTQUN0RDthQUNJLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRTtZQUMxRSxNQUFNLElBQUksR0FBUSxTQUFTLENBQUMsYUFBYSxDQUFDLFVBQVUsSUFBSSxTQUFTLENBQUMsYUFBYSxDQUFDO1lBQ2hGLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbkQ7UUFFRCxJQUFJLEtBQUs7WUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQXlERCx5QkFBeUI7UUFDdkIsU0FBUyxDQUFDLHFCQUFxQixDQUM3QixJQUFJLENBQUMsb0JBQW9CLEVBQ3pCLElBQUksU0FBUyxDQUFDLGtCQUFrQixDQUFDO1lBQy9CLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUE7Z0JBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUNELGNBQWMsRUFBRSxHQUFHLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7Z0JBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztZQUN2RCxDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBQ0QsZUFBZTtRQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3pCLDJGQUEyRjtRQUMzRixTQUFTLENBQUMsZUFBZSxDQUN2QixJQUFJLENBQUMsY0FBYyxFQUNuQixJQUFJLFNBQVMsQ0FBQyxZQUFZLENBQUM7WUFDekIsWUFBWSxFQUFFLENBQUMsVUFBMEIsRUFBRSxFQUFFO2dCQUMzQyxtRUFBbUU7Z0JBQ25FLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELGFBQWEsRUFBRSxDQUFDLFdBQTJCLEVBQUUsRUFBRTtnQkFDN0MsbUVBQW1FO2dCQUNuRSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQy9CLENBQUM7U0FDRixDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFDRCxjQUFjO1FBQ1osU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixTQUFTLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDaEUsQ0FBQztJQTRCRCxnQkFBZ0I7UUFDZCxPQUFPO1lBQ0wsSUFBSSxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLElBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDcEcsS0FBSyxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLElBQUssSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtTQUMvRixDQUFBO0lBQ0gsQ0FBQztJQXFDRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLFlBQW9CLEVBQUUsUUFBaUI7UUFDakUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDaEUsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDO1FBRTlCLG9EQUFvRDtRQUNwRCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLElBQUksUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzNDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxJQUFJLEVBQUU7Z0JBQ1IsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBRXhELElBQUksWUFBWSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFDekMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO3dCQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztxQkFDM0I7b0JBQ0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDL0M7cUJBQU0sSUFBSSxDQUFDLFlBQVksSUFBSSxXQUFXLEVBQUU7b0JBQ3ZDLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztvQkFDekMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO3dCQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDNUI7b0JBQ0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDaEQ7YUFDRjtTQUNGO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFlBQVksQ0FBQztJQUN4QyxDQUFDO0lBRUQ7O09BRUc7SUFDSyxtQkFBbUIsQ0FBQyxNQUFjLEVBQUUsT0FBZ0I7UUFDMUQsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNkLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDbkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FDdEQsTUFBTSxLQUFLLFdBQVcsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUM5RCxDQUFDO2dCQUVGLElBQUksWUFBWSxFQUFFO29CQUNoQixNQUFNLElBQUksR0FBUSxZQUFZLENBQUMsYUFBYSxDQUFDLFVBQVUsSUFBSSxZQUFZLENBQUMsYUFBYSxDQUFDO29CQUN0RixNQUFNLEtBQUssR0FBcUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO29CQUU3RSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRTt3QkFDdEMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7d0JBQ3hCLE1BQU0sV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3dCQUMzRCxLQUFLLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO3FCQUNsQztpQkFDRjthQUNGO1FBQ0gsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ1IsQ0FBQztJQUVEOztPQUVHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVEOztPQUVHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2hELENBQUM7SUFFRDs7T0FFRztJQUNILGtCQUFrQixDQUFDLElBQW9CO1FBQ3JDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQ3RELElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxXQUFXLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FDckUsQ0FBQztRQUVGLElBQUksWUFBWSxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxHQUFRLFlBQVksQ0FBQyxhQUFhLENBQUMsVUFBVSxJQUFJLFlBQVksQ0FBQyxhQUFhLENBQUM7WUFDdEYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBRTNELElBQUksS0FBSyxFQUFFO2dCQUNULEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNmO1NBQ0Y7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhLENBQUMsS0FBYSxFQUFFLElBQW9CO1FBQy9DLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUF1RkQsaUJBQWlCO1FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDdkIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztTQUNqQztRQUNELElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbkQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsb0JBQW9CO2lCQUM1QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO2lCQUNwQyxLQUFLLEVBQUUsQ0FBQztTQUNaO2FBQU0sSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDbkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsbUJBQW1CO2lCQUMzQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO2lCQUNwQyxLQUFLLEVBQUUsQ0FBQztTQUNaO2FBQU07WUFDTCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFO2lCQUN0RCxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDcEIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztpQkFDcEMsS0FBSyxFQUFFLENBQUM7U0FDWjtRQUNELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUM3QixDQUFDO0lBeUJELGFBQWE7UUFDWCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsU0FBUyxHQUFHO1lBQ2YsYUFBYSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYTtZQUM1QyxjQUFjLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjO1lBQzlDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCO1lBQ3RELG1CQUFtQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CO1lBQ3hELGtCQUFrQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCO1lBQ3RELG1CQUFtQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CO1lBQ3hELGVBQWUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWU7WUFDaEQsY0FBYyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYztZQUM5QyxjQUFjLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjO1lBQzlDLFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVk7WUFDMUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0I7WUFDdEQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7WUFDbEQseUJBQXlCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyx5QkFBeUI7WUFDcEUsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQywwQkFBMEI7WUFDdEUsY0FBYyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYztZQUM5QyxlQUFlLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlO1lBQ2hELHNCQUFzQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsc0JBQXNCO1lBQzlELHFCQUFxQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMscUJBQXFCO1NBQzdELENBQUM7UUFDRixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRCxnQkFBZ0I7UUFDZCxJQUFJLFlBQVksR0FBa0IsSUFBSSxhQUFhLENBQUM7WUFDbEQsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQzNELGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDaEUsWUFBWSxFQUFFLEdBQUc7WUFDakIsU0FBUyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ2hFLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3ZELE1BQU0sRUFBRSxNQUFNO1lBQ2QsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDOUQsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7U0FDL0QsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ2xFLENBQUM7SUFDRCxjQUFjO1FBQ1osSUFBSSxZQUFZLEdBQWdCLElBQUksV0FBVyxDQUFDO1lBQzlDLFlBQVksRUFBRSxNQUFNO1lBQ3BCLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQy9ELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzdELGNBQWMsRUFBRSxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUV0RSxzQkFBc0IsRUFBRSxFQUFFO1NBQzNCLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0lBRUQsY0FBYztRQUNaLElBQUksWUFBWSxHQUFjO1lBQzVCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxNQUFNO1NBQ3JCLENBQUM7UUFDRixJQUFJLENBQUMsb0JBQW9CLEdBQUc7WUFDMUIsR0FBRyxZQUFZO1lBQ2YsR0FBRyxJQUFJLENBQUMsb0JBQW9CO1NBQzdCLENBQUM7SUFDSixDQUFDO0lBQ0QsYUFBYTtRQUNYLElBQUksWUFBWSxHQUFlLElBQUksVUFBVSxDQUFDO1lBQzVDLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQzNELE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwRSxhQUFhLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDcEUsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDM0Qsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDekUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNuRSxrQkFBa0IsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUN6RSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ25FLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQy9ELGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzlELGlCQUFpQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDL0Qsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUN0RSxxQkFBcUIsRUFBRSxVQUFVLENBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQzdDO1lBQ0QsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDOUQsMEJBQTBCLEVBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDaEQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNoRSx5QkFBeUIsRUFBRSxVQUFVLENBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQ3pDO1lBQ0QsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDL0QsY0FBYyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1NBQ3JFLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxRCxJQUFJLENBQUMsYUFBYSxHQUFHO1lBQ25CLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxLQUFLO1lBQ25CLHNCQUFzQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDcEUsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtTQUN6RSxDQUFBO0lBQ0gsQ0FBQztJQUVELG9CQUFvQjtRQUNsQixJQUFJLFlBQVksR0FBNkIsSUFBSSx3QkFBd0IsQ0FBQztZQUN4RSxZQUFZLEVBQUUsUUFBUTtZQUN0QixLQUFLLEVBQUUsT0FBTztZQUNkLE1BQU0sRUFBRSxhQUFhO1lBQ3JCLE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUN0RCxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDN0QsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDM0QsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7U0FDNUQsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLHdCQUF3QixHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUN0RixJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRyxDQUFDO1FBQzdJLElBQUksQ0FBQyxxQkFBcUIsR0FBRztZQUMzQixZQUFZLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksSUFBSyxRQUFRO1lBQ3JFLEtBQUssRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxJQUFJLE9BQU87WUFDckQsTUFBTSxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLElBQUksYUFBYTtZQUM3RCxNQUFNLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sSUFBSSxNQUFNO1lBQ3RELEtBQUssRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDN0YsSUFBSSxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDbkcsVUFBVSxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtTQUN4RyxDQUFBO1FBQ0QsSUFBSSxDQUFDLDJCQUEyQixHQUFHO1lBQ2pDLFNBQVMsRUFBQyxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUN2RSxZQUFZLEVBQUMsTUFBTTtZQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLElBQUksYUFBYTtTQUN4RCxDQUFBO0lBQ0gsQ0FBQzs7cUhBandCVSx1QkFBdUI7eUdBQXZCLHVCQUF1QixvMkNBMkRPLFVBQVUsb0ZBQ2IsVUFBVSxrREN0R2xELDB0SUE4RUE7NEZEcENhLHVCQUF1QjtrQkFObkMsU0FBUzsrQkFDRSxpQkFBaUIsbUJBR1YsdUJBQXVCLENBQUMsTUFBTTs0SUFHdEMsbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBS0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUtHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBSUcsb0JBQW9CO3NCQUE1QixLQUFLO2dCQUtHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBS0csd0JBQXdCO3NCQUFoQyxLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFFRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFFRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ2lELFVBQVU7c0JBQWhFLFlBQVk7dUJBQUMsaUJBQWlCLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFO2dCQUNELE1BQU07c0JBQXpELFlBQVk7dUJBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkluaXQsXG4gIFF1ZXJ5TGlzdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZHJlbixcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYXNlU3R5bGUsXG4gIENoZWNrYm94U3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBTZWxlY3Rpb25Nb2RlLFxuICBsb2NhbGl6ZSxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIFN0YXRlcyxcbiAgQ29tZXRDaGF0VXNlckV2ZW50cyxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIGZvbnRIZWxwZXIsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHsgVXNlcnNTdHlsZSwgTGlzdFN0eWxlLCBTZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBVc2VyUHJlc2VuY2VQbGFjZW1lbnQgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IE1lc3NhZ2VVdGlscyB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzXCI7XG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LXVzZXJzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRVc2Vyc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHVzZXJzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOiAoKG1lbWJlcjogQ29tZXRDaGF0LlVzZXIpID0+IENvbWV0Q2hhdE9wdGlvbltdKSB8IG51bGw7XG4gIEBJbnB1dCgpIGFjdGl2ZVVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlVTRVJTXCIpO1xuICBASW5wdXQoKSBvbkVycm9yPzogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKFxuICAgIGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uXG4gICkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfTtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblNlbGVjdCE6ICh1c2VyOiBDb21ldENoYXQuVXNlciwgc2VsZWN0ZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIHNob3dTZWN0aW9uSGVhZGVyOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBzdHJpbmcgPSBcIm5hbWVcIjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX1VTRVJTX0ZPVU5EXCIpO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmxlZnQ7XG4gIEBJbnB1dCgpIHVzZXJzU3R5bGU6IFVzZXJzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiLFxuICB9O1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICB9O1xuICBASW5wdXQoKSBzZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGU6IFNlbGVjdGVkVXNlclByZXZpZXdTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBzaG93U2VsZWN0ZWRVc2Vyc1ByZXZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgXG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB2b2lkO1xuICBASW5wdXQoKSBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBvbkVtcHR5PzogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgdXNlclByZXNlbmNlUGxhY2VtZW50OiBVc2VyUHJlc2VuY2VQbGFjZW1lbnQgPVxuICAgIFVzZXJQcmVzZW5jZVBsYWNlbWVudC5ib3R0b207XG4gIEBJbnB1dCgpIGRpc2FibGVMb2FkaW5nU3RhdGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQFZpZXdDaGlsZHJlbignY2hlY2tib3hFbGVtZW50JywgeyByZWFkOiBFbGVtZW50UmVmIH0pIGNoZWNrYm94ZXMhOiBRdWVyeUxpc3Q8RWxlbWVudFJlZj47XG4gIEBWaWV3Q2hpbGRyZW4oJ3JhZGlvRWxlbWVudCcsIHsgcmVhZDogRWxlbWVudFJlZiB9KSByYWRpb3MhOiBRdWVyeUxpc3Q8RWxlbWVudFJlZj47XG4gIGZldGNoaW5nVXNlcnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hUaW1lT3V0OiBhbnk7XG4gIHVzZXJDaGVja2VkOiBzdHJpbmcgPSBcIlwiO1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IHt9O1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIHB1YmxpYyB1c2Vyc0xpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkOiBzdHJpbmcgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgcmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0O1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29ubmVjdGlvbkxpc3RlbmVySWQgPSBcImNvbm5lY3Rpb25fXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIHByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG4gIHB1YmxpYyBpc1dlYnNvY2tldFJlY29ubmVjdGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzZWxlY3RlZFVzZXJzOiB7W3VpZDogc3RyaW5nXTogQ29tZXRDaGF0LlVzZXJ9ID0ge307XG4gIGNoZWNrYm94U3R5bGU6IENoZWNrYm94U3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgY2hlY2tlZEJhY2tncm91bmRDb2xvcjogXCIjMjE5NkYzXCIsXG4gICAgdW5jaGVja2VkQmFja2dyb3VuZENvbG9yOiBcIiNjY2NcIlxuICB9XG5cblxuICByZW1vdmVNZW1iZXJCdXR0b25TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICBpY29uSGVpZ2h0OiBcIjE2cHhcIixcbiAgICBpY29uV2lkdGg6XCIxNnB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiNTAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcImJsYWNrXCJcbiAgfTtcbiAgc2VsZWN0ZWRVc2Vyc1ByZXZpZXdXcmFwcGVyID0ge31cblxuICAvLyBCdWxrIHNlbGVjdGlvbiBwcm9wZXJ0aWVzXG4gIHByaXZhdGUgbGFzdFNlbGVjdGVkSW5kZXg6IG51bWJlciA9IC0xO1xuICBwcml2YXRlIGlzU2hpZnRQcmVzc2VkOiBib29sZWFuID0gZmFsc2U7XG4gIHNlbGVjdGVkVXNlclBpbGxTdHlsZSA9IHt9O1xuXG4gIC8qKlxuICAgKiBFdmVudHNcbiAgICovXG4gIGNjVXNlckJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlclVuQmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5maXJzdFJlbG9hZCA9IHRydWU7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIGlmICghdGhpcy5mZXRjaGluZ1VzZXJzKSB7XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpO1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG5cbiAgICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlc1tcInNlYXJjaEtleXdvcmRcIl0pIHtcbiAgICAgIHRoaXMuZmV0Y2hVc2Vyc09uU2VhcmNoS2V5V29yZENoYW5nZSgpO1xuICAgIH1cbiAgfVxuXG4gIGZldGNoVXNlcnNPblNlYXJjaEtleVdvcmRDaGFuZ2UgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuZmV0Y2hpbmdVc2Vycykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZmV0Y2hUaW1lT3V0KTtcbiAgICAgIHRoaXMuZmV0Y2hUaW1lT3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuc2VhcmNoRm9yVXNlcigpO1xuICAgICAgfSwgODAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZWFyY2hGb3JVc2VyKCk7XG4gICAgfVxuICB9O1xuXG4gIHNlYXJjaEZvclVzZXIgPSAoKSA9PiB7XG4gICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICB0aGlzLnVzZXJzTGlzdCA9IFtdO1xuICAgIH1cbiAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICB9O1xuXG4gIG9uVXNlclNlbGVjdGVkKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQ/LmRldGFpbD8uY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdCh1c2VyLCBzZWxlY3RlZCk7XG4gICAgfVxuICB9XG4gIGZldGNoTmV3VXNlcnMoKSB7XG4gICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuZmlyc3RSZWxvYWQgPyBTdGF0ZXMubG9hZGluZyA6IFN0YXRlcy5sb2FkZWQ7XG4gICAgdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3Qoc3RhdGUpO1xuICB9XG4gIC8vIHN1YnNjcmliZSB0byBnbG9iYWwgZXZlbnRzXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NVc2VyQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlVXNlciAmJiB1c2VyLmdldFVpZCgpID09IHRoaXMuYWN0aXZlVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHRoaXMuYWN0aXZlVXNlciA9IHVzZXI7XG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKHVzZXIpO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY1VzZXJVbkJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlclVuYmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlVXNlciAmJiB1c2VyLmdldFVpZCgpID09IHRoaXMuYWN0aXZlVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHRoaXMuYWN0aXZlVXNlciA9IHVzZXI7XG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKHVzZXIpO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjVXNlckJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJVbkJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy51c2Vyc1JlcXVlc3QgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgfVxuICBpc1VzZXJTZWxlY3RlZCh1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIHJldHVybiB1c2VyLmdldFVpZCgpID09PSB0aGlzLnVzZXJDaGVja2VkIFxuICAgIHx8IHRoaXMuc2VsZWN0ZWRVc2Vycz8uW3VzZXIuZ2V0VWlkKCldO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgb25DbGljayA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKHVzZXIpO1xuICAgIH1cbiAgICB0aGlzLm9uUm93Q2xpY2tlZCh1c2VyLmdldFVpZCgpKTtcbiAgfTtcblxuICBvblJvd0NsaWNrZWQodWlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCB1c2VyQ2hlY2tib3ggPSB0aGlzLmNoZWNrYm94ZXMuZmluZChjaGVja2JveFJlZiA9PiB1aWQgPT09IGNoZWNrYm94UmVmLm5hdGl2ZUVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXVpZCcpKTtcbiAgICBjb25zdCB1c2VyUmFkaW8gPSB0aGlzLnJhZGlvcy5maW5kKHJhZGlvUmVmID0+IHVpZCA9PT0gcmFkaW9SZWYubmF0aXZlRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdWlkJykpO1xuICAgIGxldCBpbnB1dDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHVzZXJDaGVja2JveCAmJiB0aGlzLnNlbGVjdGlvbk1vZGUgPT09IHRoaXMuc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGUpIHtcbiAgICAgIGNvbnN0IHJvb3Q6IGFueSA9IHVzZXJDaGVja2JveC5uYXRpdmVFbGVtZW50LnNoYWRvd1Jvb3QgfHwgdXNlckNoZWNrYm94Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBpbnB1dCA9IHJvb3QucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHVzZXJSYWRpbyAmJiB0aGlzLnNlbGVjdGlvbk1vZGUgPT09IHRoaXMuc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlKSB7XG4gICAgICBjb25zdCByb290OiBhbnkgPSB1c2VyUmFkaW8ubmF0aXZlRWxlbWVudC5zaGFkb3dSb290IHx8IHVzZXJSYWRpby5uYXRpdmVFbGVtZW50O1xuICAgICAgaW5wdXQgPSByb290LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dCkgaW5wdXQuY2xpY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgZ2V0QWN0aXZlVXNlciA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIGlmICh1c2VyLmdldFVpZCgpID09IHRoaXMuYWN0aXZlVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvciA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eSh1c2VyKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuXG4gICAgaWYgKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgdGhpcy51c2Vyc1N0eWxlPy5vbmxpbmVTdGF0dXNDb2xvciA/P1xuICAgICAgICB0aGlzLnRoZW1lU2VydmljZT8udGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKClcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuICBcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eSh1c2VyKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgIGlmKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSl7XG4gICAgICByZXR1cm4oXG4gICAgICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGVcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICB1cGRhdGVVc2VyID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgbGV0IHVzZXJsaXN0ID0gWy4uLnRoaXMudXNlcnNMaXN0XTtcbiAgICAvL3NlYXJjaCBmb3IgdXNlclxuICAgIGxldCB1c2VyS2V5ID0gdXNlcmxpc3QuZmluZEluZGV4KFxuICAgICAgKHU6IENvbWV0Q2hhdC5Vc2VyLCBrKSA9PiB1LmdldFVpZCgpID09IHVzZXIuZ2V0VWlkKClcbiAgICApO1xuICAgIC8vaWYgZm91bmQgaW4gdGhlIGxpc3QsIHVwZGF0ZSB1c2VyIG9iamVjdFxuICAgIGlmICh1c2VyS2V5ID4gLTEpIHtcbiAgICAgIHVzZXJsaXN0LnNwbGljZSh1c2VyS2V5LCAxLCB1c2VyKTtcbiAgICAgIHRoaXMudXNlcnNMaXN0ID0gWy4uLnVzZXJsaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENvbm5lY3Rpb25MaXN0ZW5lcihcbiAgICAgIHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNvbm5lY3Rpb25MaXN0ZW5lcih7XG4gICAgICAgIG9uQ29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gdHJ1ZVxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+Y29ubmVjdGVkXCIpO1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXdVc2VycygpO1xuICAgICAgICB9LFxuICAgICAgICBpbkNvbm5lY3Rpbmc6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBJbiBjb25uZWN0aW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAvL0F0dGFjaGluZyBVc2VyIExpc3RlbmVycyB0byBkeW5hbWlsY2FsbHkgdXBkYXRlIHdoZW4gYSB1c2VyIGNvbWVzIG9ubGluZSBhbmQgZ29lcyBvZmZsaW5lXG4gICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcihvbmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIob2ZmbGluZVVzZXIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZCk7XG4gICAgdGhpcy51c2VyTGlzdGVuZXJJZCA9IFwiXCI7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKTtcbiAgfVxuICBhZGRNZW1iZXJzVG9MaXN0ID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBldmVudDogYW55KSA9PiB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQ/LmRldGFpbD8uY2hlY2tlZDtcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSB0aGlzLnVzZXJzTGlzdC5maW5kSW5kZXgodSA9PiB1LmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpKTtcbiAgICBcbiAgICAvLyBDaGVjayBpZiBzaGlmdCBrZXkgd2FzIHByZXNzZWQgZm9yIGJ1bGsgc2VsZWN0aW9uXG4gICAgaWYgKHRoaXMuaXNTaGlmdFByZXNzZWQgJiYgdGhpcy5sYXN0U2VsZWN0ZWRJbmRleCAhPT0gLTEgJiYgY3VycmVudEluZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy5oYW5kbGVCdWxrU2VsZWN0aW9uKGN1cnJlbnRJbmRleCwgc2VsZWN0ZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZWd1bGFyIHNpbmdsZSBzZWxlY3Rpb25cbiAgICAgIGlmKHRoaXMuc2VsZWN0aW9uTW9kZSA9PT0gdGhpcy5zZWxlY3Rpb25tb2RlRW51bS5zaW5nbGUpe1xuICAgICAgICB0aGlzLnVzZXJDaGVja2VkID0gdXNlci5nZXRVaWQoKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgICAgdGhpcy5vblNlbGVjdCh1c2VyLCBzZWxlY3RlZCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkVXNlcnNbdXNlci5nZXRVaWQoKV0gPSB1c2VyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRVc2Vyc1t1c2VyLmdldFVpZCgpXTtcbiAgICAgIH1cbiAgICAgIHRoaXMubGFzdFNlbGVjdGVkSW5kZXggPSBjdXJyZW50SW5kZXg7XG4gICAgfVxuICAgIFxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTsgXG4gIH07XG4gIGdldFVzZXJOYW1lU3R5bGUoKXtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUudGV4dEZvbnQgfHwgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5uYW1lKSxcbiAgICAgIGNvbG9yOiB0aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZS50ZXh0Q29sb3IgfHwgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBjaGVja2JveCBjbGljayB0byBkZXRlY3Qgc2hpZnQga2V5XG4gICAqL1xuICBvbkNoZWNrYm94Q2xpY2sgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIsIGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIHRoaXMuaXNTaGlmdFByZXNzZWQgPSAoZXZlbnQgYXMgTW91c2VFdmVudCkuc2hpZnRLZXk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBjaGVja2JveCBjaGFuZ2VkIGV2ZW50IFxuICAgKi9cbiAgb25DaGVja2JveENoYW5nZWQgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIsIGV2ZW50OiBhbnkpID0+IHtcbiAgICB0aGlzLmFkZE1lbWJlcnNUb0xpc3QodXNlciwgZXZlbnQpO1xuICAgIC8vIFJlc2V0IHNoaWZ0IGZsYWcgYWZ0ZXIgcHJvY2Vzc2luZ1xuICAgIHRoaXMuaXNTaGlmdFByZXNzZWQgPSBmYWxzZTtcbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlIGtleWJvYXJkIGV2ZW50cyBmb3IgYWNjZXNzaWJpbGl0eVxuICAgKi9cbiAgb25LZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgLy8gVHJhY2sgc2hpZnQga2V5IHN0YXRlIGZvciBrZXlib2FyZCBuYXZpZ2F0aW9uXG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJ1NoaWZ0Jykge1xuICAgICAgdGhpcy5pc1NoaWZ0UHJlc3NlZCA9IHRydWU7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGUga2V5Ym9hcmQgZXZlbnRzIGZvciBhY2Nlc3NpYmlsaXR5ICBcbiAgICovXG4gIG9uS2V5VXAgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQua2V5ID09PSAnU2hpZnQnKSB7XG4gICAgICB0aGlzLmlzU2hpZnRQcmVzc2VkID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGUgYnVsayBzZWxlY3Rpb24gd2hlbiBzaGlmdCtjbGljayBpcyB1c2VkXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZUJ1bGtTZWxlY3Rpb24oY3VycmVudEluZGV4OiBudW1iZXIsIHNlbGVjdGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IE1hdGgubWluKHRoaXMubGFzdFNlbGVjdGVkSW5kZXgsIGN1cnJlbnRJbmRleCk7XG4gICAgY29uc3QgZW5kSW5kZXggPSBNYXRoLm1heCh0aGlzLmxhc3RTZWxlY3RlZEluZGV4LCBjdXJyZW50SW5kZXgpO1xuICAgIGNvbnN0IHNob3VsZFNlbGVjdCA9IHNlbGVjdGVkO1xuICAgIFxuICAgIC8vIEFwcGx5IHNlbGVjdGlvbi9kZXNlbGVjdGlvbiB0byBhbGwgdXNlcnMgaW4gcmFuZ2VcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8PSBlbmRJbmRleDsgaSsrKSB7XG4gICAgICBjb25zdCB1c2VyID0gdGhpcy51c2Vyc0xpc3RbaV07XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICBjb25zdCB3YXNTZWxlY3RlZCA9ICEhdGhpcy5zZWxlY3RlZFVzZXJzW3VzZXIuZ2V0VWlkKCldO1xuICAgICAgICBcbiAgICAgICAgaWYgKHNob3VsZFNlbGVjdCAmJiAhd2FzU2VsZWN0ZWQpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdGVkVXNlcnNbdXNlci5nZXRVaWQoKV0gPSB1c2VyO1xuICAgICAgICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICAgICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUNoZWNrYm94U3RhdGUodXNlci5nZXRVaWQoKSwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXNob3VsZFNlbGVjdCAmJiB3YXNTZWxlY3RlZCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkVXNlcnNbdXNlci5nZXRVaWQoKV07XG4gICAgICAgICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgICAgICAgIHRoaXMub25TZWxlY3QodXNlciwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUNoZWNrYm94U3RhdGUodXNlci5nZXRVaWQoKSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubGFzdFNlbGVjdGVkSW5kZXggPSBjdXJyZW50SW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGNoZWNrYm94IHN0YXRlIHByb2dyYW1tYXRpY2FsbHlcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlQ2hlY2tib3hTdGF0ZSh1c2VySWQ6IHN0cmluZywgY2hlY2tlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY2hlY2tib3hlcykge1xuICAgICAgICBjb25zdCB1c2VyQ2hlY2tib3ggPSB0aGlzLmNoZWNrYm94ZXMuZmluZChjaGVja2JveFJlZiA9PiBcbiAgICAgICAgICB1c2VySWQgPT09IGNoZWNrYm94UmVmLm5hdGl2ZUVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXVpZCcpXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICBpZiAodXNlckNoZWNrYm94KSB7XG4gICAgICAgICAgY29uc3Qgcm9vdDogYW55ID0gdXNlckNoZWNrYm94Lm5hdGl2ZUVsZW1lbnQuc2hhZG93Um9vdCB8fCB1c2VyQ2hlY2tib3gubmF0aXZlRWxlbWVudDtcbiAgICAgICAgICBjb25zdCBpbnB1dDogSFRNTElucHV0RWxlbWVudCA9IHJvb3QucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LmNoZWNrZWQgIT09IGNoZWNrZWQpIHtcbiAgICAgICAgICAgIGlucHV0LmNoZWNrZWQgPSBjaGVja2VkO1xuICAgICAgICAgICAgY29uc3QgY2hhbmdlRXZlbnQgPSBuZXcgRXZlbnQoJ2NoYW5nZScsIHsgYnViYmxlczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGlucHV0LmRpc3BhdGNoRXZlbnQoY2hhbmdlRXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhcnJheSBvZiBzZWxlY3RlZCB1c2VycyBmb3IgcHJldmlld1xuICAgKi9cbiAgZ2V0U2VsZWN0ZWRVc2Vyc0FycmF5KCk6IENvbWV0Q2hhdC5Vc2VyW10ge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKHRoaXMuc2VsZWN0ZWRVc2Vycyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvdW50IG9mIHNlbGVjdGVkIHVzZXJzXG4gICAqL1xuICBnZXRTZWxlY3RlZFVzZXJzQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5zZWxlY3RlZFVzZXJzKS5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHVzZXIgZnJvbSBzZWxlY3Rpb24gYnkgdHJpZ2dlcmluZyBjaGVja2JveCBjbGlja1xuICAgKi9cbiAgcmVtb3ZlU2VsZWN0ZWRVc2VyKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgY29uc3QgdXNlckNoZWNrYm94ID0gdGhpcy5jaGVja2JveGVzLmZpbmQoY2hlY2tib3hSZWYgPT4gXG4gICAgICB1c2VyLmdldFVpZCgpID09PSBjaGVja2JveFJlZi5uYXRpdmVFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS11aWQnKVxuICAgICk7XG5cbiAgICBpZiAodXNlckNoZWNrYm94KSB7XG4gICAgICBjb25zdCByb290OiBhbnkgPSB1c2VyQ2hlY2tib3gubmF0aXZlRWxlbWVudC5zaGFkb3dSb290IHx8IHVzZXJDaGVja2JveC5uYXRpdmVFbGVtZW50O1xuICAgICAgY29uc3QgaW5wdXQgPSByb290LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXScpO1xuICAgICAgXG4gICAgICBpZiAoaW5wdXQpIHtcbiAgICAgICAgaW5wdXQuY2xpY2soKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJhY2sgYnkgZnVuY3Rpb24gZm9yIG5nRm9yIHBlcmZvcm1hbmNlXG4gICAqL1xuICB0cmFja0J5VXNlcklkKGluZGV4OiBudW1iZXIsIHVzZXI6IENvbWV0Q2hhdC5Vc2VyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdXNlci5nZXRVaWQoKTtcbiAgfVxuICBmZXRjaE5leHRVc2Vyc0xpc3QgPSAoc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIGlmICghKHRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSAmJiBzdGF0ZSA9PSBTdGF0ZXMubG9hZGluZykpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciAmJlxuICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uICYmXG4gICAgICAoKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT1cbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLnRvdGFsX3BhZ2VzKVxuICAgICkge1xuICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gdHJ1ZTtcbiAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3Q7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLmZldGNoTmV4dCgpLnRoZW4oXG4gICAgICAgICAgKHVzZXJMaXN0OiBDb21ldENoYXQuVXNlcltdKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1c2VyTGlzdClcbiAgICAgICAgICAgIGlmICh1c2VyTGlzdC5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5vbkVtcHR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVtcHR5KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHVzZXJMaXN0Lmxlbmd0aCA8PSAwICYmXG4gICAgICAgICAgICAgICh0aGlzLnVzZXJzTGlzdD8ubGVuZ3RoIDw9IDAgfHwgdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSB1c2VyTGlzdDtcbiAgICAgICAgICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gWy4uLnRoaXMudXNlcnNMaXN0LCAuLi51c2VyTGlzdF07XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hLZXl3b3JkICE9IHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkIHx8XG4gICAgICAgICAgICAgICAgICBbMCwgMV0uaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2VcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gdXNlckxpc3Q7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gWy4uLnRoaXMudXNlcnNMaXN0LCAuLi51c2VyTGlzdF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuXG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpO1xuICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZldGNoaW5nVXNlcnMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gdGhpcy5zZWFyY2hLZXl3b3JkO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy51c2Vyc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHNldFJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmICghdGhpcy5zZWFyY2hLZXl3b3JkKSB7XG4gICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyICYmIHRoaXMuc2VhcmNoS2V5d29yZCkge1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudXNlcnNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlcnNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlcXVlc3RCdWlsZGVyO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgb25TZWFyY2ggPSAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5zZWFyY2hLZXl3b3JkID0ga2V5O1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5mZXRjaGluZ1VzZXJzIHx8ICh0aGlzLmZldGNoaW5nVXNlcnMgJiYga2V5ID09IFwiXCIpKSB7XG4gICAgICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbXTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV4dFVzZXJzTGlzdCgpO1xuICAgICAgICB9XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldFVzZXJzU3R5bGUoKTtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0U2VsZWN0ZWRVc2VyU3R5bGUoKTtcblxuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnRpdGxlVGV4dENvbG9yLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy51c2Vyc1N0eWxlLmxvYWRpbmdJY29uVGludCxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnVzZXJzU3R5bGUuc2VwYXJhdG9yQ29sb3IsXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaEljb25UaW50LFxuICAgICAgc2VhcmNoQm9yZGVyOiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoQm9yZGVyLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoQm9yZGVyUmFkaXVzLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaEJhY2tncm91bmQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3IsXG4gICAgICBzZWFyY2hUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaFRleHRGb250LFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnVzZXJzU3R5bGUuc2VhcmNoVGV4dENvbG9yLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnNlY3Rpb25IZWFkZXJUZXh0Q29sb3IsXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWN0aW9uSGVhZGVyVGV4dEZvbnQsXG4gICAgfTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgIH0pO1xuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfTtcbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cblxuICBzZXRTdGF0dXNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSxcbiAgICB9O1xuICB9XG4gIHNldFVzZXJzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogVXNlcnNTdHlsZSA9IG5ldyBVc2Vyc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICB9KTtcbiAgICB0aGlzLnVzZXJzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy51c2Vyc1N0eWxlIH07XG4gICAgdGhpcy5jaGVja2JveFN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBjaGVja2VkQmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHVuY2hlY2tlZEJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKVxuICAgIH1cbiAgfVxuXG4gIHNldFNlbGVjdGVkVXNlclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFNlbGVjdGVkVXNlclByZXZpZXdTdHlsZSA9IG5ldyBTZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwMDBweFwiLFxuICAgICAgd2lkdGg6IFwiMTQwcHhcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5Lm5hbWUpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9KTtcbiAgICB0aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZSB9O1xuICAgIHRoaXMucmVtb3ZlTWVtYmVyQnV0dG9uU3R5bGUuYnV0dG9uSWNvblRpbnQgPSB0aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZS5jbG9zZUljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCkhO1xuICAgIHRoaXMuc2VsZWN0ZWRVc2VyUGlsbFN0eWxlID0ge1xuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZS5ib3JkZXJSYWRpdXMgfHwgIFwiMTAwMHB4XCIsXG4gICAgICB3aWR0aDogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUud2lkdGggfHwgXCIxNDBweFwiLFxuICAgICAgaGVpZ2h0OiB0aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZS5oZWlnaHQgfHwgXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyOiB0aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZS5ib3JkZXIgfHwgYG5vbmVgLFxuICAgICAgY29sb3I6IHRoaXMuc2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlLnRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZm9udDogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUudGV4dEZvbnQgfHwgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5Lm5hbWUpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUuYmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICB9XG4gICAgdGhpcy5zZWxlY3RlZFVzZXJzUHJldmlld1dyYXBwZXIgPSB7XG4gICAgICBib3JkZXJUb3A6YDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlckJvdHRvbTpgbm9uZWAsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuYmFja2dyb3VuZCB8fCBcInRyYW5zcGFyZW50XCJcbiAgICB9XG4gIH1cblxuICB1c2VyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy51c2Vyc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLnVzZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnVzZXJzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy51c2Vyc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy51c2Vyc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLXVzZXJzXCIgW25nU3R5bGVdPVwidXNlclN0eWxlKClcIiAoa2V5ZG93bik9XCJvbktleURvd24oJGV2ZW50KVwiIChrZXl1cCk9XCJvbktleVVwKCRldmVudClcIiB0YWJpbmRleD1cIjBcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG5cbiAgPCEtLSBVc2VycyBMaXN0IC0tPlxuICA8ZGl2IGNsYXNzPVwiY2MtdXNlcnNfX2xpc3RcIiBbY2xhc3MuY2MtdXNlcnNfX2xpc3QtLXdpdGgtc2VsZWN0aW9uXT1cImdldFNlbGVjdGVkVXNlcnNDb3VudCgpID4gMFwiPlxuICAgIDxjb21ldGNoYXQtbGlzdCBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIiBbb25TZWFyY2hdPVwib25TZWFyY2hcIlxuICAgICAgICBbbGlzdF09XCJ1c2Vyc0xpc3RcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICAgIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIiBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCIgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIiBbdGl0bGVdPVwidGl0bGVcIlxuICAgICAgICBbc2VjdGlvbkhlYWRlckZpZWxkXT1cInNlY3Rpb25IZWFkZXJGaWVsZFwiIFtzaG93U2VjdGlvbkhlYWRlcl09XCJzaG93U2VjdGlvbkhlYWRlclwiXG4gICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICAgIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIiBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiIFtzdGF0ZV09XCJzdGF0ZVwiPlxuICAgIDwvY29tZXRjaGF0LWxpc3Q+XG4gIDwvZGl2PlxuXG4gIDwhLS0gU2VsZWN0ZWQgVXNlcnMgUHJldmlldyBTZWN0aW9uIC0tPlxuICA8ZGl2IGNsYXNzPVwiY2Mtc2VsZWN0ZWQtdXNlcnNcIiBbc3R5bGVdPVwic2VsZWN0ZWRVc2Vyc1ByZXZpZXdXcmFwcGVyXCIgKm5nSWY9XCJzaG93U2VsZWN0ZWRVc2Vyc1ByZXZpZXcgJiYgZ2V0U2VsZWN0ZWRVc2Vyc0NvdW50KCkgPiAwXCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLXNlbGVjdGVkLXVzZXJzX19saXN0XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2Mtc2VsZWN0ZWQtdXNlclwiICpuZ0Zvcj1cImxldCB1c2VyIG9mIGdldFNlbGVjdGVkVXNlcnNBcnJheSgpOyB0cmFja0J5OiB0cmFja0J5VXNlcklkXCIgW3N0eWxlXT1cInNlbGVjdGVkVXNlclBpbGxTdHlsZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2Mtc2VsZWN0ZWQtdXNlcl9fYXZhdGFyXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1hdmF0YXIgXG4gICAgICAgICAgICBbaW1hZ2VdPVwidXNlcj8uZ2V0QXZhdGFyKCkgfHwgJydcIiBcbiAgICAgICAgICAgIFtuYW1lXT1cInVzZXI/LmdldE5hbWUoKVwiIFxuICAgICAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLXNlbGVjdGVkLXVzZXJfX25hbWVcIiBbc3R5bGVdPVwiZ2V0VXNlck5hbWVTdHlsZSgpXCI+e3t1c2VyPy5nZXROYW1lKCl9fTwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2Mtc2VsZWN0ZWQtdXNlcl9fcmVtb3ZlXCIgKGNsaWNrKT1cInJlbW92ZVNlbGVjdGVkVXNlcih1c2VyKVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFxuICAgICAgICAgICAgW2ljb25VUkxdPVwiJ2Fzc2V0cy9jbG9zZTJ4LnN2ZydcIiBcbiAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJyZW1vdmVNZW1iZXJCdXR0b25TdHlsZVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LXVzZXI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwidXNlcj8ubmFtZVwiIFthdmF0YXJVUkxdPVwidXNlcj8uYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwidXNlcj8ubmFtZVwiXG4gICAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSh1c2VyKVwiXG4gICAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImdldFN0YXR1c0luZGljYXRvckNvbG9yKHVzZXIpXCIgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2sodXNlcilcIiBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlVXNlcih1c2VyKVwiXG4gICAgICAgICAgW3VzZXJQcmVzZW5jZVBsYWNlbWVudF09XCJ1c2VyUHJlc2VuY2VQbGFjZW1lbnRcIj5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiB1c2VyIH1cIj5cbiAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiIGNsYXNzPVwiY2MtdXNlcnNfX29wdGlvbnNcIiAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyh1c2VyKVwiPlxuXG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSAhPSBzZWxlY3Rpb25tb2RlRW51bS5ub25lXCIgY2xhc3M9XCJjYy11c2Vyc19fdGFpbC12aWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIiBjbGFzcz1cImNjLXVzZXJzX19zZWxlY3Rpb24tLXNpbmdsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uIFthdHRyLmRhdGEtdWlkXT1cInVzZXI/LnVpZFwiICNyYWRpb0VsZW1lbnQgKGNjLXJhZGlvLWJ1dHRvbi1jaGFuZ2VkKT1cImFkZE1lbWJlcnNUb0xpc3QodXNlciwkZXZlbnQpXCIgW2NoZWNrZWRdPVwiaXNVc2VyU2VsZWN0ZWQodXNlcilcIiA+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIiBjbGFzcz1cImNjLXVzZXJzX19zZWxlY3Rpb24tLW11bHRpcGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCBcbiAgICAgICAgICAgIFthdHRyLmRhdGEtdWlkXT1cInVzZXI/LnVpZFwiIFxuICAgICAgICAgICAgI2NoZWNrYm94RWxlbWVudCBcbiAgICAgICAgICAgIFtjaGVja2JveFN0eWxlXT1cImNoZWNrYm94U3R5bGVcIiAgXG4gICAgICAgICAgICAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbkNoZWNrYm94Q2hhbmdlZCh1c2VyLCAkZXZlbnQpXCJcbiAgICAgICAgICAgIChjbGljayk9XCJvbkNoZWNrYm94Q2xpY2sodXNlciwgJGV2ZW50KVwiIFxuICAgICAgICAgICAgW2NoZWNrZWRdPVwiaXNVc2VyU2VsZWN0ZWQodXNlcilcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1jaGVja2JveD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuXG4gIDwvbmctdGVtcGxhdGU+XG48L2Rpdj5cbiJdfQ==