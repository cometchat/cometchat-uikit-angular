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
        else {
            this.addMembersToList(user, { detail: { checked: false } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy9jb21ldGNoYXQtdXNlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBQ1QsVUFBVSxFQUNWLEtBQUssRUFNTCxZQUFZLEdBQ2IsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFDTCxXQUFXLEVBR1gsYUFBYSxHQUNkLE1BQU0sMkJBQTJCLENBQUM7QUFFbkMsT0FBTyxFQUVMLGFBQWEsRUFDYixRQUFRLEVBQ1IsY0FBYyxFQUNkLE1BQU0sRUFDTixtQkFBbUIsRUFFbkIsVUFBVSxHQUNYLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLFVBQVUsRUFBYSx3QkFBd0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTFGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ25FLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQzs7Ozs7QUFPL0QsTUFBTSxPQUFPLHVCQUF1QjtJQWdIbEMsWUFDVSxHQUFzQixFQUN0QixZQUFtQztRQURuQyxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUN0QixpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUE5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QWM7c0JBQXRCLEtBQUs7Z0JBQ0csUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFLRyxhQUFhO3NCQUFyQixLQUFLO2dCQUlHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFLRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFDRyx3QkFBd0I7c0JBQWhDLEtBQUs7Z0JBRUcsV0FBVztzQkFBbkIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBRUcsbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNpRCxVQUFVO3NCQUFoRSxZQUFZO3VCQUFDLGlCQUFpQixFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtnQkFDRCxNQUFNO3NCQUF6RCxZQUFZO3VCQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25Jbml0LFxuICBRdWVyeUxpc3QsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGRyZW4sXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgQmFzZVN0eWxlLFxuICBDaGVja2JveFN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdE9wdGlvbixcbiAgU2VsZWN0aW9uTW9kZSxcbiAgbG9jYWxpemUsXG4gIFRpdGxlQWxpZ25tZW50LFxuICBTdGF0ZXMsXG4gIENvbWV0Q2hhdFVzZXJFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBmb250SGVscGVyLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IFVzZXJzU3R5bGUsIExpc3RTdHlsZSwgU2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlIH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuaW1wb3J0IHsgVXNlclByZXNlbmNlUGxhY2VtZW50IH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC11c2Vyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC11c2Vycy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0VXNlcnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB1c2Vyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHNlYXJjaFJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBhY3RpdmVVc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJVU0VSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcj86IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAodXNlcjogQ29tZXRDaGF0LlVzZXIsIHNlbGVjdGVkOiBib29sZWFuKSA9PiB2b2lkO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBzaG93U2VjdGlvbkhlYWRlcjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHNlY3Rpb25IZWFkZXJGaWVsZDogc3RyaW5nID0gXCJuYW1lXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19VU0VSU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBASW5wdXQoKSB1c2Vyc1N0eWxlOiBVc2Vyc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIixcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgfTtcbiAgQElucHV0KCkgc2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlOiBTZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUgPSB7fTtcbiAgQElucHV0KCkgc2hvd1NlbGVjdGVkVXNlcnNQcmV2aWV3OiBib29sZWFuID0gZmFsc2U7XG4gIFxuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4gdm9pZDtcbiAgQElucHV0KCkgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgb25FbXB0eT86ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHVzZXJQcmVzZW5jZVBsYWNlbWVudDogVXNlclByZXNlbmNlUGxhY2VtZW50ID1cbiAgICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQuYm90dG9tO1xuICBASW5wdXQoKSBkaXNhYmxlTG9hZGluZ1N0YXRlOiBib29sZWFuID0gZmFsc2U7XG4gIEBWaWV3Q2hpbGRyZW4oJ2NoZWNrYm94RWxlbWVudCcsIHsgcmVhZDogRWxlbWVudFJlZiB9KSBjaGVja2JveGVzITogUXVlcnlMaXN0PEVsZW1lbnRSZWY+O1xuICBAVmlld0NoaWxkcmVuKCdyYWRpb0VsZW1lbnQnLCB7IHJlYWQ6IEVsZW1lbnRSZWYgfSkgcmFkaW9zITogUXVlcnlMaXN0PEVsZW1lbnRSZWY+O1xuICBmZXRjaGluZ1VzZXJzOiBib29sZWFuID0gZmFsc2U7XG4gIGZldGNoVGltZU91dDogYW55O1xuICB1c2VyQ2hlY2tlZDogc3RyaW5nID0gXCJcIjtcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSB7fTtcbiAgcHVibGljIHVzZXJzUmVxdWVzdDogYW55O1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgdGltZW91dDogYW55O1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgdXNlcnNMaXN0OiBDb21ldENoYXQuVXNlcltdID0gW107XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZDogc3RyaW5nID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIHJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdDtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBwcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICBwdWJsaWMgaXNXZWJzb2NrZXRSZWNvbm5lY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc2VsZWN0ZWRVc2Vyczoge1t1aWQ6IHN0cmluZ106IENvbWV0Q2hhdC5Vc2VyfSA9IHt9O1xuICBjaGVja2JveFN0eWxlOiBDaGVja2JveFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjRweFwiLFxuICAgIGNoZWNrZWRCYWNrZ3JvdW5kQ29sb3I6IFwiIzIxOTZGM1wiLFxuICAgIHVuY2hlY2tlZEJhY2tncm91bmRDb2xvcjogXCIjY2NjXCJcbiAgfVxuXG5cbiAgcmVtb3ZlTWVtYmVyQnV0dG9uU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIxNnB4XCIsXG4gICAgaWNvbkhlaWdodDogXCIxNnB4XCIsXG4gICAgaWNvbldpZHRoOlwiMTZweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjUwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBidXR0b25JY29uVGludDogXCJibGFja1wiXG4gIH07XG4gIHNlbGVjdGVkVXNlcnNQcmV2aWV3V3JhcHBlciA9IHt9XG5cbiAgLy8gQnVsayBzZWxlY3Rpb24gcHJvcGVydGllc1xuICBwcml2YXRlIGxhc3RTZWxlY3RlZEluZGV4OiBudW1iZXIgPSAtMTtcbiAgcHJpdmF0ZSBpc1NoaWZ0UHJlc3NlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBzZWxlY3RlZFVzZXJQaWxsU3R5bGUgPSB7fTtcblxuICAvKipcbiAgICogRXZlbnRzXG4gICAqL1xuICBjY1VzZXJCbG9ja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY1VzZXJVbkJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTogYW55ID0gbnVsbDtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2VcbiAgKSB7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICBpZiAoIXRoaXMuZmV0Y2hpbmdVc2Vycykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuXG4gICAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3Q7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJzZWFyY2hLZXl3b3JkXCJdKSB7XG4gICAgICB0aGlzLmZldGNoVXNlcnNPblNlYXJjaEtleVdvcmRDaGFuZ2UoKTtcbiAgICB9XG4gIH1cblxuICBmZXRjaFVzZXJzT25TZWFyY2hLZXlXb3JkQ2hhbmdlID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLmZldGNoaW5nVXNlcnMpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmZldGNoVGltZU91dCk7XG4gICAgICB0aGlzLmZldGNoVGltZU91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNlYXJjaEZvclVzZXIoKTtcbiAgICAgIH0sIDgwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2VhcmNoRm9yVXNlcigpO1xuICAgIH1cbiAgfTtcblxuICBzZWFyY2hGb3JVc2VyID0gKCkgPT4ge1xuICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgdGhpcy51c2Vyc0xpc3QgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3QoKTtcbiAgfTtcblxuICBvblVzZXJTZWxlY3RlZCh1c2VyOiBDb21ldENoYXQuVXNlciwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50Py5kZXRhaWw/LmNoZWNrZWQ7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QodXNlciwgc2VsZWN0ZWQpO1xuICAgIH1cbiAgfVxuICBmZXRjaE5ld1VzZXJzKCkge1xuICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmZpcnN0UmVsb2FkID8gU3RhdGVzLmxvYWRpbmcgOiBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0KHN0YXRlKTtcbiAgfVxuICAvLyBzdWJzY3JpYmUgdG8gZ2xvYmFsIGV2ZW50c1xuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjVXNlckJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlckJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZVVzZXIgJiYgdXNlci5nZXRVaWQoKSA9PSB0aGlzLmFjdGl2ZVVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICB0aGlzLmFjdGl2ZVVzZXIgPSB1c2VyO1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcih1c2VyKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NVc2VyVW5CbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJVbmJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZVVzZXIgJiYgdXNlci5nZXRVaWQoKSA9PSB0aGlzLmFjdGl2ZVVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICB0aGlzLmFjdGl2ZVVzZXIgPSB1c2VyO1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcih1c2VyKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyVW5CbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMudXNlcnNSZXF1ZXN0ID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gIH1cbiAgaXNVc2VyU2VsZWN0ZWQodXNlcjogQ29tZXRDaGF0LlVzZXIpIHtcbiAgICByZXR1cm4gdXNlci5nZXRVaWQoKSA9PT0gdGhpcy51c2VyQ2hlY2tlZCBcbiAgICB8fCB0aGlzLnNlbGVjdGVkVXNlcnM/Llt1c2VyLmdldFVpZCgpXTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIG9uQ2xpY2sgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayh1c2VyKTtcbiAgICB9XG4gICAgdGhpcy5vblJvd0NsaWNrZWQodXNlci5nZXRVaWQoKSk7XG4gIH07XG5cbiAgb25Sb3dDbGlja2VkKHVpZDogc3RyaW5nKSB7XG4gICAgY29uc3QgdXNlckNoZWNrYm94ID0gdGhpcy5jaGVja2JveGVzLmZpbmQoY2hlY2tib3hSZWYgPT4gdWlkID09PSBjaGVja2JveFJlZi5uYXRpdmVFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS11aWQnKSk7XG4gICAgY29uc3QgdXNlclJhZGlvID0gdGhpcy5yYWRpb3MuZmluZChyYWRpb1JlZiA9PiB1aWQgPT09IHJhZGlvUmVmLm5hdGl2ZUVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXVpZCcpKTtcbiAgICBsZXQgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgIGlmICh1c2VyQ2hlY2tib3ggJiYgdGhpcy5zZWxlY3Rpb25Nb2RlID09PSB0aGlzLnNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlKSB7XG4gICAgICBjb25zdCByb290OiBhbnkgPSB1c2VyQ2hlY2tib3gubmF0aXZlRWxlbWVudC5zaGFkb3dSb290IHx8IHVzZXJDaGVja2JveC5uYXRpdmVFbGVtZW50O1xuICAgICAgaW5wdXQgPSByb290LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXScpO1xuICAgIH1cbiAgICBlbHNlIGlmICh1c2VyUmFkaW8gJiYgdGhpcy5zZWxlY3Rpb25Nb2RlID09PSB0aGlzLnNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZSkge1xuICAgICAgY29uc3Qgcm9vdDogYW55ID0gdXNlclJhZGlvLm5hdGl2ZUVsZW1lbnQuc2hhZG93Um9vdCB8fCB1c2VyUmFkaW8ubmF0aXZlRWxlbWVudDtcbiAgICAgIGlucHV0ID0gcm9vdC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwicmFkaW9cIl0nKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQpIGlucHV0LmNsaWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGdldEFjdGl2ZVVzZXIgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBpZiAodGhpcy5zZWxlY3Rpb25Nb2RlID09IFNlbGVjdGlvbk1vZGUubm9uZSB8fCAhdGhpcy5zZWxlY3Rpb25Nb2RlKSB7XG4gICAgICBpZiAodXNlci5nZXRVaWQoKSA9PSB0aGlzLmFjdGl2ZVVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBsZXQgdXNlclN0YXR1c1Zpc2liaWxpdHkgPSBuZXcgTWVzc2FnZVV0aWxzKCkuZ2V0VXNlclN0YXR1c1Zpc2liaWxpdHkodXNlcikgfHwgdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZTtcblxuICAgIGlmICghdXNlclN0YXR1c1Zpc2liaWxpdHkpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMudXNlcnNTdHlsZT8ub25saW5lU3RhdHVzQ29sb3IgPz9cbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2U/LnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBsZXQgdXNlclN0YXR1c1Zpc2liaWxpdHkgPSBuZXcgTWVzc2FnZVV0aWxzKCkuZ2V0VXNlclN0YXR1c1Zpc2liaWxpdHkodXNlcikgfHwgdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZTtcbiAgICBpZighdXNlclN0YXR1c1Zpc2liaWxpdHkpe1xuICAgICAgcmV0dXJuKFxuICAgICAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gdXNlclxuICAgKi9cbiAgdXBkYXRlVXNlciA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCB1c2VybGlzdCA9IFsuLi50aGlzLnVzZXJzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgdXNlcktleSA9IHVzZXJsaXN0LmZpbmRJbmRleChcbiAgICAgICh1OiBDb21ldENoYXQuVXNlciwgaykgPT4gdS5nZXRVaWQoKSA9PSB1c2VyLmdldFVpZCgpXG4gICAgKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICB1c2VybGlzdC5zcGxpY2UodXNlcktleSwgMSwgdXNlcik7XG4gICAgICB0aGlzLnVzZXJzTGlzdCA9IFsuLi51c2VybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICBhdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IHRydWVcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3VXNlcnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgLy9BdHRhY2hpbmcgVXNlciBMaXN0ZW5lcnMgdG8gZHluYW1pbGNhbGx5IHVwZGF0ZSB3aGVuIGEgdXNlciBjb21lcyBvbmxpbmUgYW5kIGdvZXMgb2ZmbGluZVxuICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIob25saW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgIHRoaXMudXNlckxpc3RlbmVySWQgPSBcIlwiO1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCk7XG4gIH1cbiAgYWRkTWVtYmVyc1RvTGlzdCA9ICh1c2VyOiBDb21ldENoYXQuVXNlciwgZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50Py5kZXRhaWw/LmNoZWNrZWQ7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gdGhpcy51c2Vyc0xpc3QuZmluZEluZGV4KHUgPT4gdS5nZXRVaWQoKSA9PT0gdXNlci5nZXRVaWQoKSk7XG4gICAgXG4gICAgLy8gQ2hlY2sgaWYgc2hpZnQga2V5IHdhcyBwcmVzc2VkIGZvciBidWxrIHNlbGVjdGlvblxuICAgIGlmICh0aGlzLmlzU2hpZnRQcmVzc2VkICYmIHRoaXMubGFzdFNlbGVjdGVkSW5kZXggIT09IC0xICYmIGN1cnJlbnRJbmRleCAhPT0gLTEpIHtcbiAgICAgIHRoaXMuaGFuZGxlQnVsa1NlbGVjdGlvbihjdXJyZW50SW5kZXgsIHNlbGVjdGVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVndWxhciBzaW5nbGUgc2VsZWN0aW9uXG4gICAgICBpZih0aGlzLnNlbGVjdGlvbk1vZGUgPT09IHRoaXMuc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlKXtcbiAgICAgICAgdGhpcy51c2VyQ2hlY2tlZCA9IHVzZXIuZ2V0VWlkKCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICAgIHRoaXMub25TZWxlY3QodXNlciwgc2VsZWN0ZWQpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAoc2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFVzZXJzW3VzZXIuZ2V0VWlkKCldID0gdXNlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkVXNlcnNbdXNlci5nZXRVaWQoKV07XG4gICAgICB9XG4gICAgICB0aGlzLmxhc3RTZWxlY3RlZEluZGV4ID0gY3VycmVudEluZGV4O1xuICAgIH1cbiAgICBcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7IFxuICB9O1xuICBnZXRVc2VyTmFtZVN0eWxlKCl7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZvbnQ6IHRoaXMuc2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlLnRleHRGb250IHx8ICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkubmFtZSksXG4gICAgICBjb2xvcjogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUudGV4dENvbG9yIHx8ICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgY2hlY2tib3ggY2xpY2sgdG8gZGV0ZWN0IHNoaWZ0IGtleVxuICAgKi9cbiAgb25DaGVja2JveENsaWNrID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBldmVudDogRXZlbnQpID0+IHtcbiAgICB0aGlzLmlzU2hpZnRQcmVzc2VkID0gKGV2ZW50IGFzIE1vdXNlRXZlbnQpLnNoaWZ0S2V5O1xuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGUgY2hlY2tib3ggY2hhbmdlZCBldmVudCBcbiAgICovXG4gIG9uQ2hlY2tib3hDaGFuZ2VkID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBldmVudDogYW55KSA9PiB7XG4gICAgdGhpcy5hZGRNZW1iZXJzVG9MaXN0KHVzZXIsIGV2ZW50KTtcbiAgICAvLyBSZXNldCBzaGlmdCBmbGFnIGFmdGVyIHByb2Nlc3NpbmdcbiAgICB0aGlzLmlzU2hpZnRQcmVzc2VkID0gZmFsc2U7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBrZXlib2FyZCBldmVudHMgZm9yIGFjY2Vzc2liaWxpdHlcbiAgICovXG4gIG9uS2V5RG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIC8vIFRyYWNrIHNoaWZ0IGtleSBzdGF0ZSBmb3Iga2V5Ym9hcmQgbmF2aWdhdGlvblxuICAgIGlmIChldmVudC5rZXkgPT09ICdTaGlmdCcpIHtcbiAgICAgIHRoaXMuaXNTaGlmdFByZXNzZWQgPSB0cnVlO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlIGtleWJvYXJkIGV2ZW50cyBmb3IgYWNjZXNzaWJpbGl0eSAgXG4gICAqL1xuICBvbktleVVwID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJ1NoaWZ0Jykge1xuICAgICAgdGhpcy5pc1NoaWZ0UHJlc3NlZCA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlIGJ1bGsgc2VsZWN0aW9uIHdoZW4gc2hpZnQrY2xpY2sgaXMgdXNlZFxuICAgKi9cbiAgcHJpdmF0ZSBoYW5kbGVCdWxrU2VsZWN0aW9uKGN1cnJlbnRJbmRleDogbnVtYmVyLCBzZWxlY3RlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBNYXRoLm1pbih0aGlzLmxhc3RTZWxlY3RlZEluZGV4LCBjdXJyZW50SW5kZXgpO1xuICAgIGNvbnN0IGVuZEluZGV4ID0gTWF0aC5tYXgodGhpcy5sYXN0U2VsZWN0ZWRJbmRleCwgY3VycmVudEluZGV4KTtcbiAgICBjb25zdCBzaG91bGRTZWxlY3QgPSBzZWxlY3RlZDtcbiAgICBcbiAgICAvLyBBcHBseSBzZWxlY3Rpb24vZGVzZWxlY3Rpb24gdG8gYWxsIHVzZXJzIGluIHJhbmdlXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPD0gZW5kSW5kZXg7IGkrKykge1xuICAgICAgY29uc3QgdXNlciA9IHRoaXMudXNlcnNMaXN0W2ldO1xuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgY29uc3Qgd2FzU2VsZWN0ZWQgPSAhIXRoaXMuc2VsZWN0ZWRVc2Vyc1t1c2VyLmdldFVpZCgpXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChzaG91bGRTZWxlY3QgJiYgIXdhc1NlbGVjdGVkKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RlZFVzZXJzW3VzZXIuZ2V0VWlkKCldID0gdXNlcjtcbiAgICAgICAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgICAgICAgdGhpcy5vblNlbGVjdCh1c2VyLCB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVDaGVja2JveFN0YXRlKHVzZXIuZ2V0VWlkKCksIHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGRTZWxlY3QgJiYgd2FzU2VsZWN0ZWQpIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFVzZXJzW3VzZXIuZ2V0VWlkKCldO1xuICAgICAgICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICAgICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVDaGVja2JveFN0YXRlKHVzZXIuZ2V0VWlkKCksIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmxhc3RTZWxlY3RlZEluZGV4ID0gY3VycmVudEluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBjaGVja2JveCBzdGF0ZSBwcm9ncmFtbWF0aWNhbGx5XG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUNoZWNrYm94U3RhdGUodXNlcklkOiBzdHJpbmcsIGNoZWNrZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNoZWNrYm94ZXMpIHtcbiAgICAgICAgY29uc3QgdXNlckNoZWNrYm94ID0gdGhpcy5jaGVja2JveGVzLmZpbmQoY2hlY2tib3hSZWYgPT4gXG4gICAgICAgICAgdXNlcklkID09PSBjaGVja2JveFJlZi5uYXRpdmVFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS11aWQnKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgaWYgKHVzZXJDaGVja2JveCkge1xuICAgICAgICAgIGNvbnN0IHJvb3Q6IGFueSA9IHVzZXJDaGVja2JveC5uYXRpdmVFbGVtZW50LnNoYWRvd1Jvb3QgfHwgdXNlckNoZWNrYm94Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgY29uc3QgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgPSByb290LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXScpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5jaGVja2VkICE9PSBjaGVja2VkKSB7XG4gICAgICAgICAgICBpbnB1dC5jaGVja2VkID0gY2hlY2tlZDtcbiAgICAgICAgICAgIGNvbnN0IGNoYW5nZUV2ZW50ID0gbmV3IEV2ZW50KCdjaGFuZ2UnLCB7IGJ1YmJsZXM6IHRydWUgfSk7XG4gICAgICAgICAgICBpbnB1dC5kaXNwYXRjaEV2ZW50KGNoYW5nZUV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYXJyYXkgb2Ygc2VsZWN0ZWQgdXNlcnMgZm9yIHByZXZpZXdcbiAgICovXG4gIGdldFNlbGVjdGVkVXNlcnNBcnJheSgpOiBDb21ldENoYXQuVXNlcltdIHtcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyh0aGlzLnNlbGVjdGVkVXNlcnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjb3VudCBvZiBzZWxlY3RlZCB1c2Vyc1xuICAgKi9cbiAgZ2V0U2VsZWN0ZWRVc2Vyc0NvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuc2VsZWN0ZWRVc2VycykubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSB1c2VyIGZyb20gc2VsZWN0aW9uIGJ5IHRyaWdnZXJpbmcgY2hlY2tib3ggY2xpY2tcbiAgICovXG4gIHJlbW92ZVNlbGVjdGVkVXNlcih1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGNvbnN0IHVzZXJDaGVja2JveCA9IHRoaXMuY2hlY2tib3hlcy5maW5kKGNoZWNrYm94UmVmID0+IFxuICAgICAgdXNlci5nZXRVaWQoKSA9PT0gY2hlY2tib3hSZWYubmF0aXZlRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdWlkJylcbiAgICApO1xuXG4gICAgaWYgKHVzZXJDaGVja2JveCkge1xuICAgICAgY29uc3Qgcm9vdDogYW55ID0gdXNlckNoZWNrYm94Lm5hdGl2ZUVsZW1lbnQuc2hhZG93Um9vdCB8fCB1c2VyQ2hlY2tib3gubmF0aXZlRWxlbWVudDtcbiAgICAgIGNvbnN0IGlucHV0ID0gcm9vdC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKTtcbiAgICAgIFxuICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgIGlucHV0LmNsaWNrKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICB0aGlzLmFkZE1lbWJlcnNUb0xpc3QodXNlcix7ZGV0YWlsOntjaGVja2VkOmZhbHNlfX0pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYWNrIGJ5IGZ1bmN0aW9uIGZvciBuZ0ZvciBwZXJmb3JtYW5jZVxuICAgKi9cbiAgdHJhY2tCeVVzZXJJZChpbmRleDogbnVtYmVyLCB1c2VyOiBDb21ldENoYXQuVXNlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIHVzZXIuZ2V0VWlkKCk7XG4gIH1cbiAgZmV0Y2hOZXh0VXNlcnNMaXN0ID0gKHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZykgPT4ge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gbnVsbDtcbiAgICBpZiAoISh0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUgJiYgc3RhdGUgPT0gU3RhdGVzLmxvYWRpbmcpKSB7XG4gICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgJiZcbiAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbiAmJlxuICAgICAgKCh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgPT0gMCB8fFxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlICE9XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi50b3RhbF9wYWdlcylcbiAgICApIHtcbiAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IHRydWU7XG4gICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0VXNlcnNMaXN0O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAgICh1c2VyTGlzdDogQ29tZXRDaGF0LlVzZXJbXSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2codXNlckxpc3QpXG4gICAgICAgICAgICBpZiAodXNlckxpc3QubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub25FbXB0eSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25FbXB0eSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gXCJcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB1c2VyTGlzdC5sZW5ndGggPD0gMCAmJlxuICAgICAgICAgICAgICAodGhpcy51c2Vyc0xpc3Q/Lmxlbmd0aCA8PSAwIHx8IHRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gdXNlckxpc3Q7XG4gICAgICAgICAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IFsuLi50aGlzLnVzZXJzTGlzdCwgLi4udXNlckxpc3RdO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoS2V5d29yZCAhPSB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCB8fFxuICAgICAgICAgICAgICAgICAgWzAsIDFdLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IHVzZXJMaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IFsuLi50aGlzLnVzZXJzTGlzdCwgLi4udXNlckxpc3RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcblxuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgICB0aGlzLmF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mZXRjaGluZ1VzZXJzID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IHRoaXMuc2VhcmNoS2V5d29yZDtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLmZldGNoaW5nVXNlcnMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudXNlcnNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmV0Y2hpbmdVc2VycyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBzZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAoIXRoaXMuc2VhcmNoS2V5d29yZCkge1xuICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlciAmJiB0aGlzLnNlYXJjaEtleXdvcmQpIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnVzZXJzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0QnVpbGRlcjtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXlcbiAgICovXG4gIG9uU2VhcmNoID0gKGtleTogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2VhcmNoS2V5d29yZCA9IGtleTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgICAgICB0aGlzLnVzZXJzTGlzdCA9IFtdO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZmV0Y2hpbmdVc2VycyB8fCAodGhpcy5mZXRjaGluZ1VzZXJzICYmIGtleSA9PSBcIlwiKSkge1xuICAgICAgICAgIHRoaXMudXNlcnNMaXN0ID0gW107XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRVc2Vyc0xpc3QoKTtcbiAgICAgICAgfVxuICAgICAgfSwgNTAwKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXRVc2Vyc1N0eWxlKCk7XG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKCk7XG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpO1xuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKTtcbiAgICB0aGlzLnNldFNlbGVjdGVkVXNlclN0eWxlKCk7XG5cbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudXNlcnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hJY29uVGludCxcbiAgICAgIHNlYXJjaEJvcmRlcjogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaEJvcmRlcixcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hCYWNrZ3JvdW5kLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IHRoaXMudXNlcnNTdHlsZS5zZWFyY2hUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy51c2Vyc1N0eWxlLnNlYXJjaFRleHRDb2xvcixcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Q29sb3I6IHRoaXMudXNlcnNTdHlsZS5zZWN0aW9uSGVhZGVyVGV4dENvbG9yLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRGb250OiB0aGlzLnVzZXJzU3R5bGUuc2VjdGlvbkhlYWRlclRleHRGb250LFxuICAgIH07XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICAgIGhlaWdodDogXCIyOHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG5cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH07XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRVc2Vyc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFVzZXJzU3R5bGUgPSBuZXcgVXNlcnNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgfSk7XG4gICAgdGhpcy51c2Vyc1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMudXNlcnNTdHlsZSB9O1xuICAgIHRoaXMuY2hlY2tib3hTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjRweFwiLFxuICAgICAgY2hlY2tlZEJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB1bmNoZWNrZWRCYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKClcbiAgICB9XG4gIH1cblxuICBzZXRTZWxlY3RlZFVzZXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBTZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUgPSBuZXcgU2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMDAwcHhcIixcbiAgICAgIHdpZHRoOiBcIjE0MHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5uYW1lKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfSk7XG4gICAgdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUgfTtcbiAgICB0aGlzLnJlbW92ZU1lbWJlckJ1dHRvblN0eWxlLmJ1dHRvbkljb25UaW50ID0gdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUuY2xvc2VJY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpITtcbiAgICB0aGlzLnNlbGVjdGVkVXNlclBpbGxTdHlsZSA9IHtcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUuYm9yZGVyUmFkaXVzIHx8ICBcIjEwMDBweFwiLFxuICAgICAgd2lkdGg6IHRoaXMuc2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlLndpZHRoIHx8IFwiMTQwcHhcIixcbiAgICAgIGhlaWdodDogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUuaGVpZ2h0IHx8IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlcjogdGhpcy5zZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUuYm9yZGVyIHx8IGBub25lYCxcbiAgICAgIGNvbG9yOiB0aGlzLnNlbGVjdGVkVXNlclByZXZpZXdTdHlsZS50ZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGZvbnQ6IHRoaXMuc2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlLnRleHRGb250IHx8IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5uYW1lKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuc2VsZWN0ZWRVc2VyUHJldmlld1N0eWxlLmJhY2tncm91bmQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgfVxuICAgIHRoaXMuc2VsZWN0ZWRVc2Vyc1ByZXZpZXdXcmFwcGVyID0ge1xuICAgICAgYm9yZGVyVG9wOmAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJCb3R0b206YG5vbmVgLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy51c2Vyc1N0eWxlLmJhY2tncm91bmQgfHwgXCJ0cmFuc3BhcmVudFwiXG4gICAgfVxuICB9XG5cbiAgdXNlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMudXNlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy51c2Vyc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy51c2Vyc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMudXNlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMudXNlcnNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy11c2Vyc1wiIFtuZ1N0eWxlXT1cInVzZXJTdHlsZSgpXCIgKGtleWRvd24pPVwib25LZXlEb3duKCRldmVudClcIiAoa2V5dXApPVwib25LZXlVcCgkZXZlbnQpXCIgdGFiaW5kZXg9XCIwXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZW51c1wiICpuZ0lmPVwibWVudVwiPlxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuXG4gIDwhLS0gVXNlcnMgTGlzdCAtLT5cbiAgPGRpdiBjbGFzcz1cImNjLXVzZXJzX19saXN0XCIgW2NsYXNzLmNjLXVzZXJzX19saXN0LS13aXRoLXNlbGVjdGlvbl09XCJnZXRTZWxlY3RlZFVzZXJzQ291bnQoKSA+IDBcIj5cbiAgICA8Y29tZXRjaGF0LWxpc3QgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwib25TY3JvbGxlZFRvQm90dG9tXCIgW29uU2VhcmNoXT1cIm9uU2VhcmNoXCJcbiAgICAgICAgW2xpc3RdPVwidXNlcnNMaXN0XCIgW3NlYXJjaFRleHRdPVwic2VhcmNoS2V5d29yZFwiIFtzZWFyY2hQbGFjZWhvbGRlclRleHRdPVwic2VhcmNoUGxhY2Vob2xkZXJcIlxuICAgICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICAgICAgW3NlY3Rpb25IZWFkZXJGaWVsZF09XCJzZWN0aW9uSGVhZGVyRmllbGRcIiBbc2hvd1NlY3Rpb25IZWFkZXJdPVwic2hvd1NlY3Rpb25IZWFkZXJcIlxuICAgICAgICBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIiBbbG9hZGluZ0ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIlxuICAgICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCIgW2Vycm9yU3RhdGVWaWV3XT1cImVycm9yU3RhdGVWaWV3XCIgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIiBbc3RhdGVdPVwic3RhdGVcIj5cbiAgICA8L2NvbWV0Y2hhdC1saXN0PlxuICA8L2Rpdj5cblxuICA8IS0tIFNlbGVjdGVkIFVzZXJzIFByZXZpZXcgU2VjdGlvbiAtLT5cbiAgPGRpdiBjbGFzcz1cImNjLXNlbGVjdGVkLXVzZXJzXCIgW3N0eWxlXT1cInNlbGVjdGVkVXNlcnNQcmV2aWV3V3JhcHBlclwiICpuZ0lmPVwic2hvd1NlbGVjdGVkVXNlcnNQcmV2aWV3ICYmIGdldFNlbGVjdGVkVXNlcnNDb3VudCgpID4gMFwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1zZWxlY3RlZC11c2Vyc19fbGlzdFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLXNlbGVjdGVkLXVzZXJcIiAqbmdGb3I9XCJsZXQgdXNlciBvZiBnZXRTZWxlY3RlZFVzZXJzQXJyYXkoKTsgdHJhY2tCeTogdHJhY2tCeVVzZXJJZFwiIFtzdHlsZV09XCJzZWxlY3RlZFVzZXJQaWxsU3R5bGVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLXNlbGVjdGVkLXVzZXJfX2F2YXRhclwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtYXZhdGFyIFxuICAgICAgICAgICAgW2ltYWdlXT1cInVzZXI/LmdldEF2YXRhcigpIHx8ICcnXCIgXG4gICAgICAgICAgICBbbmFtZV09XCJ1c2VyPy5nZXROYW1lKClcIiBcbiAgICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWF2YXRhcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1zZWxlY3RlZC11c2VyX19uYW1lXCIgW3N0eWxlXT1cImdldFVzZXJOYW1lU3R5bGUoKVwiPnt7dXNlcj8uZ2V0TmFtZSgpfX08L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLXNlbGVjdGVkLXVzZXJfX3JlbW92ZVwiIChjbGljayk9XCJyZW1vdmVTZWxlY3RlZFVzZXIodXNlcilcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBcbiAgICAgICAgICAgIFtpY29uVVJMXT1cIidhc3NldHMvY2xvc2UyeC5zdmcnXCIgXG4gICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwicmVtb3ZlTWVtYmVyQnV0dG9uU3R5bGVcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC11c2VyPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cInVzZXI/Lm5hbWVcIiBbYXZhdGFyVVJMXT1cInVzZXI/LmF2YXRhclwiIFthdmF0YXJOYW1lXT1cInVzZXI/Lm5hbWVcIlxuICAgICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUodXNlcilcIlxuICAgICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcih1c2VyKVwiIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkNsaWNrKHVzZXIpXCIgW2lzQWN0aXZlXT1cImdldEFjdGl2ZVVzZXIodXNlcilcIlxuICAgICAgICAgIFt1c2VyUHJlc2VuY2VQbGFjZW1lbnRdPVwidXNlclByZXNlbmNlUGxhY2VtZW50XCI+XG4gICAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciB9XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLXVzZXJzX19vcHRpb25zXCIgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnModXNlcilcIj5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiIGNsYXNzPVwiY2MtdXNlcnNfX3RhaWwtdmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCIgY2xhc3M9XCJjYy11c2Vyc19fc2VsZWN0aW9uLS1zaW5nbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiBbYXR0ci5kYXRhLXVpZF09XCJ1c2VyPy51aWRcIiAjcmFkaW9FbGVtZW50IChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJhZGRNZW1iZXJzVG9MaXN0KHVzZXIsJGV2ZW50KVwiIFtjaGVja2VkXT1cImlzVXNlclNlbGVjdGVkKHVzZXIpXCIgPjwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCIgY2xhc3M9XCJjYy11c2Vyc19fc2VsZWN0aW9uLS1tdWx0aXBsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtY2hlY2tib3ggXG4gICAgICAgICAgICBbYXR0ci5kYXRhLXVpZF09XCJ1c2VyPy51aWRcIiBcbiAgICAgICAgICAgICNjaGVja2JveEVsZW1lbnQgXG4gICAgICAgICAgICBbY2hlY2tib3hTdHlsZV09XCJjaGVja2JveFN0eWxlXCIgIFxuICAgICAgICAgICAgKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwib25DaGVja2JveENoYW5nZWQodXNlciwgJGV2ZW50KVwiXG4gICAgICAgICAgICAoY2xpY2spPVwib25DaGVja2JveENsaWNrKHVzZXIsICRldmVudClcIiBcbiAgICAgICAgICAgIFtjaGVja2VkXT1cImlzVXNlclNlbGVjdGVkKHVzZXIpXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtY2hlY2tib3g+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cblxuICA8L25nLXRlbXBsYXRlPlxuPC9kaXY+XG4iXX0=