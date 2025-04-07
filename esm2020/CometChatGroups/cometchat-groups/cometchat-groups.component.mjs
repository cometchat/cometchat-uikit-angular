import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { GroupsStyle } from "@cometchat/uikit-shared";
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { localize, CometChatGroupEvents, States, TitleAlignment, SelectionMode, CometChatUIKitConstants, fontHelper } from '@cometchat/uikit-resources';
import { CometChatException } from '../../Shared/Utils/ComeChatException';
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatList/cometchat-list.component";
import * as i3 from "@angular/common";
/**
*
* CometChatGroups is a wrapper component which consists of CometChatListBaseComponent and CometChatGroupListComponent.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatGroupsComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.hideSeparator = false;
        this.selectionMode = SelectionMode.none;
        this.searchPlaceholder = localize("SEARCH");
        this.hideError = false;
        this.searchIconURL = "assets/search.svg";
        this.hideSearch = false;
        this.title = localize("GROUPS");
        this.onError = (error) => {
            console.log(error);
        };
        this.loadingIconURL = "assets/Spinner.svg";
        this.privateGroupIcon = "assets/Private.svg";
        /**
        * @deprecated
        *
        * This property is deprecated as of version 4.3.7 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
        */
        this.protectedGroupIcon = "assets/Locked.svg";
        this.passwordGroupIcon = undefined;
        this.emptyStateText = localize("NO_GROUPS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.titleAlignment = TitleAlignment.left;
        this.selectionmodeEnum = SelectionMode;
        this.state = States.loading;
        this.statusIndicatorStyle = {
            height: "12px",
            width: "12px",
            borderRadius: "16px"
        };
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.groupsStyle = {
            width: "100%",
            height: "100%",
            separatorColor: "rgb(222 222 222 / 46%)"
        };
        this.listItemStyle = {};
        this.listStyle = {};
        this.limit = 30;
        this.searchKeyword = "";
        this.groupsList = [];
        this.groupsListenerId = "groupsList_" + new Date().getTime();
        this.loggedInUser = null;
        this.statusColor = {
            private: "",
            password: "#F7A500",
            public: ""
        };
        this.firstReload = false;
        this.connectionListenerId = "connection_" + new Date().getTime();
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
         * @param  {CometChat.Group} group
         */
        this.getGroupIcon = (group) => {
            let status;
            if (group) {
                switch (group.getType()) {
                    case CometChatUIKitConstants.GroupTypes.password:
                        status = this.passwordGroupIcon || this.protectedGroupIcon;
                        break;
                    case CometChatUIKitConstants.GroupTypes.private:
                        status = this.privateGroupIcon;
                        break;
                    default:
                        status = null;
                        break;
                }
            }
            return status;
        };
        this.findGroupIndex = (groupToFind) => {
            let groupIndex = this.groupsList.findIndex((g, k) => g.getGuid() === groupToFind.getGuid());
            return groupIndex;
        };
        this.fetchNextGroupList = (state = States.loading) => {
            this.onScrolledToBottom = null;
            this.state = state;
            this.ref.detectChanges();
            if (this.requestBuilder && this.requestBuilder?.pagination && (this.requestBuilder.pagination?.current_page == 0 || this.requestBuilder.pagination?.current_page != this.requestBuilder.pagination.total_pages)) {
                this.onScrolledToBottom = this.fetchNextGroupList;
                try {
                    this.requestBuilder.fetchNext().then((groupList) => {
                        if ((groupList.length <= 0 && this.groupsList?.length <= 0) || (groupList.length === 0 && this.groupsList?.length <= 0)) {
                            this.state = States.empty;
                            this.ref.detectChanges();
                        }
                        else {
                            if (state == States.loaded) {
                                this.groupsList = [...groupList];
                            }
                            else {
                                this.groupsList = [...this.groupsList, ...groupList];
                            }
                            this.state = States.loaded;
                            this.ref.detectChanges();
                        }
                        if (this.firstReload) {
                            this.attachConnectionListeners();
                            this.firstReload = false;
                        }
                    }, (error) => {
                        if (this.onError) {
                            this.onError(CometChatException(error));
                        }
                        this.state = States.error;
                        this.ref.detectChanges();
                    }).catch((error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                        if (this.groupsList?.length <= 0) {
                            this.state = States.error;
                            this.ref.detectChanges();
                        }
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
                this.ref.detectChanges();
            }
        };
        /**
         * @param  {CometChat.Group} group
         */
        this.onClick = (group) => {
            if (this.onItemClick) {
                this.onItemClick(group);
            }
        };
        /**
         * @param  {CometChat.Group} group
         */
        this.getMemberCount = (group) => {
            return group.getMembersCount() > 1 ? group.getMembersCount() + " " + localize("MEMBERS") : group.getMembersCount() + " " + localize("MEMBER");
        };
        /**
         * @param  {CometChat.Group} group
         */
        this.getActiveGroup = (group) => {
            if (this.selectionMode == SelectionMode.none || !this.selectionMode) {
                if (group.getGuid() == this.activeGroup?.getGuid()) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
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
                    this.groupsList = [];
                    this.ref.detectChanges();
                    this.fetchNextGroupList();
                }, 500);
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.groupStyle = () => {
            return {
                height: this.groupsStyle.height,
                width: this.groupsStyle.width,
                background: this.groupsStyle.background,
                border: this.groupsStyle.border,
                borderRadius: this.groupsStyle.borderRadius
            };
        };
        this.subtitleStyle = () => {
            return {
                font: this.groupsStyle.subTitleTextFont,
                color: this.groupsStyle.subTitleTextColor
            };
        };
        this.state = States.loading;
    }
    ngOnChanges(changes) {
    }
    ngOnInit() {
        this.firstReload = true;
        this.onScrolledToBottom = this.fetchNextGroupList;
        this.setThemeStyle();
        this.subscribeToEvents();
        CometChat.getLoggedinUser().then((user) => {
            this.setRequestBuilder();
            this.fetchNextGroupList();
            this.loggedInUser = user;
        }).catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        this.state = States.loading;
        this.attachListeners();
    }
    onGroupSelected(group, event) {
        let selected = event?.detail?.checked;
        if (this.onSelect) {
            this.onSelect(group, selected);
        }
    }
    // subscribe to global events
    subscribeToEvents() {
        this.ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe((group) => {
            this.removeGroup(group);
            if (this.activeGroup && group.getGuid() == this.activeGroup.getGuid()) {
                this.activeGroup = null;
                this.ref.detectChanges();
            }
        });
        this.ccGroupCreated = CometChatGroupEvents.ccGroupCreated.subscribe((group) => {
            this.addGroup(group);
            if (!this.activeGroup) {
                this.activeGroup = group;
            }
        });
        this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item) => {
            if (this.activeGroup && this.activeGroup.getGuid() == item?.userAddedIn.getGuid()) {
                this.activeGroup == item?.userAddedIn;
                this.ref.detectChanges();
            }
            this.updateGroup(item?.userAddedIn);
        });
        this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
            if (this.activeGroup && this.activeGroup.getGuid() == item?.kickedFrom.getGuid()) {
                this.activeGroup == item?.kickedFrom;
                this.ref.detectChanges();
            }
            this.updateGroup(item?.kickedFrom);
        });
        this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item) => {
            if (this.activeGroup && this.activeGroup.getGuid() == item?.joinedGroup.getGuid()) {
                this.activeGroup == item?.joinedGroup;
                this.ref.detectChanges();
            }
            this.updateGroup(item?.joinedGroup);
        });
        this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item) => {
            if (this.activeGroup && this.activeGroup.getGuid() == item?.kickedFrom.getGuid()) {
                this.activeGroup == item?.kickedFrom;
                this.ref.detectChanges();
            }
            this.updateGroup(item?.kickedFrom);
        });
        this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item) => {
            if (this.activeGroup && this.activeGroup.getGuid() == item?.group.getGuid()) {
                this.activeGroup == item?.group;
                this.ref.detectChanges();
            }
            this.updateGroup(item?.group);
        });
        this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item) => {
            if (item.leftGroup.getType() == CometChatUIKitConstants.GroupTypes.private) {
                this.removeGroup(item.leftGroup);
            }
            else {
                this.updateGroup(item.leftGroup);
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
        this.ccGroupLeft?.unsubscribe();
    }
    ngOnDestroy() {
        this.unsubscribeToEvents();
        this.groupsRequest = null;
        this.ref.detach();
        this.removeListener();
    }
    /**
     * @param  {CometChat.Group} group
     */
    updateGroup(group) {
        let groupsList = [...this.groupsList];
        //search for group
        let groupKey = groupsList.findIndex((g, k) => g.getGuid() === group.getGuid());
        if (groupKey > -1) {
            groupsList.splice(groupKey, 1, group);
            this.groupsList = groupsList;
            this.ref.detectChanges();
        }
    }
    fetchNewUsers() {
        this.setRequestBuilder();
        let state = this.firstReload ? States.loading : States.loaded;
        this.fetchNextGroupList(state);
    }
    attachConnectionListeners() {
        CometChat.addConnectionListener(this.connectionListenerId, new CometChat.ConnectionListener({
            onConnected: () => {
                console.log("ConnectionListener =>connected");
                this.fetchNewUsers();
            },
            inConnecting: () => {
                console.log("ConnectionListener => In connecting");
            },
            onDisconnected: () => {
                console.log("ConnectionListener => On Disconnected");
            }
        }));
    }
    attachListeners() {
        CometChat.addGroupListener(this.groupsListenerId, new CometChat.GroupListener({
            onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                const groupIndex = this.findGroupIndex(changedGroup);
                if (groupIndex > -1) {
                    let groupsList = [...this.groupsList];
                    const groupFound = groupsList[groupIndex];
                    if (changedUser.getUid() == this.loggedInUser?.getUid()) {
                        groupFound.setScope(newScope);
                        this.ref.detectChanges();
                    }
                    groupsList.splice(groupIndex, 1, groupFound);
                    this.groupsList = groupsList;
                }
            },
            onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                const groupIndex = this.findGroupIndex(kickedFrom);
                if (groupIndex > -1) {
                    let groupsList = [...this.groupsList];
                    let groupFound = groupsList[groupIndex];
                    if (kickedUser.getUid() === this.loggedInUser?.getUid()) {
                        groupFound.setHasJoined(false);
                    }
                    groupFound.setMembersCount(kickedFrom.getMembersCount());
                    groupsList.splice(groupIndex, 1, groupFound);
                    this.groupsList = groupsList;
                    this.ref.detectChanges();
                }
            },
            onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                const groupIndex = this.findGroupIndex(bannedFrom);
                if (groupIndex > -1) {
                    let groupsList = [...this.groupsList];
                    let groupFound = groupsList[groupIndex];
                    if (bannedUser.getUid() === this.loggedInUser?.getUid()) {
                        this.removeGroup(bannedFrom);
                        return;
                    }
                    groupFound.setMembersCount(bannedFrom.getMembersCount());
                    groupsList.splice(groupIndex, 1, groupFound);
                    this.groupsList = groupsList;
                    this.ref.detectChanges();
                }
            },
            onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                const groupIndex = this.findGroupIndex(unbannedFrom);
                if (groupIndex > -1) {
                    let groupsList = [...this.groupsList];
                    let groupFound = groupsList[groupIndex];
                    if (unbannedUser.getUid() === this.loggedInUser?.getUid()) {
                        groupFound.setHasJoined(false);
                    }
                    groupsList.splice(groupIndex, 1, groupFound);
                    this.groupsList = groupsList;
                }
                else {
                    this.addGroup(unbannedFrom);
                }
                this.ref.detectChanges();
            },
            onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                if (this.searchKeyword)
                    return;
                const groupIndex = this.findGroupIndex(userAddedIn);
                if (groupIndex > -1) {
                    let groupsList = [...this.groupsList];
                    let groupFound = groupsList[groupIndex];
                    if (userAdded.getUid() === this.loggedInUser?.getUid()) {
                        groupFound.setHasJoined(true);
                    }
                    groupFound.setMembersCount(userAddedIn.getMembersCount());
                    groupsList.splice(groupIndex, 1, groupFound);
                    this.groupsList = groupsList;
                }
                else {
                    userAddedIn.setHasJoined(true);
                    this.addGroup(userAddedIn);
                }
                this.ref.detectChanges();
            },
            onGroupMemberLeft: (message, leavingUser, group) => {
                const groupIndex = this.findGroupIndex(group);
                if (groupIndex > -1) {
                    let groupsList = [...this.groupsList];
                    let groupFound = groupsList[groupIndex];
                    if (leavingUser.getUid() === this.loggedInUser?.getUid()) {
                        groupFound.setHasJoined(false);
                    }
                    groupFound.setMembersCount(group.getMembersCount());
                    groupsList.splice(groupIndex, 1, groupFound);
                    this.groupsList = groupsList;
                    this.ref.detectChanges();
                }
            },
            onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                const groupIndex = this.findGroupIndex(joinedGroup);
                if (groupIndex > -1) {
                    let groupsList = [...this.groupsList];
                    let groupFound = groupsList[groupIndex];
                    if (joinedUser.getUid() === this.loggedInUser?.getUid()) {
                        groupFound.setHasJoined(true);
                    }
                    groupFound.setMembersCount(joinedGroup.getMembersCount());
                    groupsList.splice(groupIndex, 1, groupFound);
                    this.groupsList = groupsList;
                    this.ref.detectChanges();
                }
            },
        }));
    }
    removeListener() {
        CometChat.removeGroupListener(this.groupsListenerId);
        CometChat.removeConnectionListener(this.connectionListenerId);
    }
    /**
     * @param  {CometChat.Group} group
     */
    getStatusIndicatorColor(group) {
        return this.statusColor[group?.getType()];
    }
    setRequestBuilder() {
        if (!this.groupsRequestBuilder) {
            this.groupsRequestBuilder = new CometChat.GroupsRequestBuilder()
                .setLimit(this.limit)
                .setSearchKeyword(this.searchKeyword);
        }
        if (this.searchRequestBuilder) {
            this.requestBuilder = this.searchRequestBuilder.build();
        }
        this.requestBuilder = this.groupsRequestBuilder.setSearchKeyword(this.searchKeyword).build();
    }
    /**
     * @param  {CometChat.Group} group
     */
    removeGroup(group) {
        let groupsList = [...this.groupsList];
        //search for group
        let groupKey = groupsList.findIndex((g, k) => g.getGuid() === group.getGuid());
        if (groupKey > -1) {
            groupsList.splice(groupKey, 1);
            this.groupsList = groupsList;
            this.ref.detectChanges();
        }
    }
    /**
     * addGroup
     * @param group
     */
    addGroup(group) {
        this.groupsList.unshift(group);
        this.ref.detectChanges();
    }
    setThemeStyle() {
        this.setGroupsStyle();
        this.setListItemStyle();
        this.setAvatarStyle();
        this.setStatusStyle();
        this.statusColor.private = this.groupsStyle.privateGroupIconBackground ?? this.themeService.theme.palette.getSuccess();
        this.statusColor.password = this.groupsStyle.passwordGroupIconBackground ?? "#F7A500";
        this.listStyle = {
            titleTextFont: this.groupsStyle.titleTextFont,
            titleTextColor: this.groupsStyle.titleTextColor,
            emptyStateTextFont: this.groupsStyle.emptyStateTextFont,
            emptyStateTextColor: this.groupsStyle.emptyStateTextColor,
            errorStateTextFont: this.groupsStyle.errorStateTextFont,
            errorStateTextColor: this.groupsStyle.errorStateTextColor,
            loadingIconTint: this.groupsStyle.loadingIconTint,
            separatorColor: this.groupsStyle.separatorColor,
            searchIconTint: this.groupsStyle.searchIconTint,
            searchBorder: this.groupsStyle.searchBorder,
            searchBorderRadius: this.groupsStyle.searchBorderRadius,
            searchBackground: this.groupsStyle.searchBackground,
            searchPlaceholderTextFont: this.groupsStyle.searchPlaceholderTextFont,
            searchPlaceholderTextColor: this.groupsStyle.searchPlaceholderTextColor,
            searchTextFont: this.groupsStyle.searchTextFont,
            searchTextColor: this.groupsStyle.searchTextColor,
        };
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
            hoverBackground: this.themeService.theme.palette.getAccent50()
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
        this.statusIndicatorStyle = { ...defaultStyle, ...this.statusIndicatorStyle };
    }
    setGroupsStyle() {
        let defaultStyle = new GroupsStyle({
            subTitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            subTitleTextColor: this.themeService.theme.palette.getAccent600(),
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
            privateGroupIconBackground: this.themeService.theme.palette.getSuccess(),
            passwordGroupIconBackground: "RGB(247, 165, 0)",
            searchIconTint: this.themeService.theme.palette.getAccent600(),
            searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            searchBackground: this.themeService.theme.palette.getAccent100(),
            searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchTextColor: this.themeService.theme.palette.getAccent600(),
            searchTextFont: fontHelper(this.themeService.theme.typography.text3)
        });
        this.groupsStyle = { ...defaultStyle, ...this.groupsStyle };
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
CometChatGroupsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatGroupsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatGroupsComponent, selector: "cometchat-groups", inputs: { groupsRequestBuilder: "groupsRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", menu: "menu", options: "options", activeGroup: "activeGroup", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", hideError: "hideError", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onSelect: "onSelect", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", groupsStyle: "groupsStyle", listItemStyle: "listItemStyle", onItemClick: "onItemClick" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-groups\" [ngStyle]=\"groupStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"groupsList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-group>\n      <cometchat-list-item [title]=\"group?.name\" [avatarURL]=\"group?.icon\" [avatarName]=\"group?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(group)\" [statusIndicatorIcon]=\"getGroupIcon(group)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(group)\" [isActive]=\"getActiveGroup(group)\">\n          <div slot=\"subtitleView\" class=\"cc-groups__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n              <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: group }\">\n              </ng-container>\n          </div>\n          <ng-template #groupSubtitle>\n             <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-groups__subtitle-view\"> {{getMemberCount(group)}} </div>\n          </ng-template>\n\n          <div slot=\"menuView\" class=\"cc-groups__options\" *ngIf=\"options\">\n            <cometchat-menu-list [data]=\"options(group)\">\n\n            </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-groups__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      </cometchat-list-item>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\">\n          <cometchat-radio-button (cc-radio-button-changed)=\"onGroupSelected(group,$event)\"></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n          <cometchat-checkbox [checkboxStyle]=\"checkboxStyle\" (cc-checkbox-changed)=\"onGroupSelected(group,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n  </ng-template>\n</div>", styles: [".cc-groups{height:100%;width:100%;box-sizing:border-box}.cc-groups__tail-view{position:relative}.cc-menus{position:absolute;right:12px;top:6px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-groups", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-groups\" [ngStyle]=\"groupStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"groupsList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-group>\n      <cometchat-list-item [title]=\"group?.name\" [avatarURL]=\"group?.icon\" [avatarName]=\"group?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(group)\" [statusIndicatorIcon]=\"getGroupIcon(group)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(group)\" [isActive]=\"getActiveGroup(group)\">\n          <div slot=\"subtitleView\" class=\"cc-groups__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n              <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: group }\">\n              </ng-container>\n          </div>\n          <ng-template #groupSubtitle>\n             <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-groups__subtitle-view\"> {{getMemberCount(group)}} </div>\n          </ng-template>\n\n          <div slot=\"menuView\" class=\"cc-groups__options\" *ngIf=\"options\">\n            <cometchat-menu-list [data]=\"options(group)\">\n\n            </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-groups__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      </cometchat-list-item>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\">\n          <cometchat-radio-button (cc-radio-button-changed)=\"onGroupSelected(group,$event)\"></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n          <cometchat-checkbox [checkboxStyle]=\"checkboxStyle\" (cc-checkbox-changed)=\"onGroupSelected(group,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n  </ng-template>\n</div>", styles: [".cc-groups{height:100%;width:100%;box-sizing:border-box}.cc-groups__tail-view{position:relative}.cc-menus{position:absolute;right:12px;top:6px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { groupsRequestBuilder: [{
                type: Input
            }], searchRequestBuilder: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], menu: [{
                type: Input
            }], options: [{
                type: Input
            }], activeGroup: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], searchPlaceholder: [{
                type: Input
            }], hideError: [{
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
            }], emptyStateView: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], privateGroupIcon: [{
                type: Input
            }], protectedGroupIcon: [{
                type: Input
            }], passwordGroupIcon: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], groupsStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdEdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzL2NvbWV0Y2hhdC1ncm91cHMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cHMvY29tZXRjaGF0LWdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSx1QkFBdUIsRUFBcUIsU0FBUyxFQUFFLEtBQUssRUFBaUQsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxXQUFXLEVBQXdCLE1BQU0seUJBQXlCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFdBQVcsRUFBaUIsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFHckYsT0FBTyxFQUFtQixRQUFRLEVBQUUsb0JBQW9CLEVBQStDLE1BQU0sRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFxRCx1QkFBdUIsRUFBRSxVQUFVLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN6USxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQzs7Ozs7QUFDMUU7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sd0JBQXdCO0lBc0ZuQyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBOUU5RSxrQkFBYSxHQUFZLEtBQUssQ0FBQztRQUMvQixrQkFBYSxHQUFrQixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ2xELHNCQUFpQixHQUFX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QUFyQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBR0csUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBTUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBR0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUtHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBS0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudCwgSW5wdXQsIE9uQ2hhbmdlcywgT25Jbml0LCBTaW1wbGVDaGFuZ2VzLCBUZW1wbGF0ZVJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSAnQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0JztcbmltcG9ydCB7IEdyb3Vwc1N0eWxlLCBMaXN0U3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQXZhdGFyU3R5bGUsIENoZWNrYm94U3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IENvbWV0Q2hhdE9wdGlvbiwgbG9jYWxpemUsIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBJR3JvdXBNZW1iZXJBZGRlZCwgSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkLCBTdGF0ZXMsIFRpdGxlQWxpZ25tZW50LCBTZWxlY3Rpb25Nb2RlLCBJR3JvdXBNZW1iZXJKb2luZWQsIElPd25lcnNoaXBDaGFuZ2VkLCBJR3JvdXBMZWZ0LCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgZm9udEhlbHBlciB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvbic7XG4vKipcbipcbiogQ29tZXRDaGF0R3JvdXBzIGlzIGEgd3JhcHBlciBjb21wb25lbnQgd2hpY2ggY29uc2lzdHMgb2YgQ29tZXRDaGF0TGlzdEJhc2VDb21wb25lbnQgYW5kIENvbWV0Q2hhdEdyb3VwTGlzdENvbXBvbmVudC5cbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtZ3JvdXBzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0R3JvdXBzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBncm91cHNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cCkgPT4gQ29tZXRDaGF0T3B0aW9uW10pIHwgbnVsbDtcbiAgQElucHV0KCkgYWN0aXZlR3JvdXAhOiBDb21ldENoYXQuR3JvdXAgfCBudWxsO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJHUk9VUFNcIik7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKGdyb3VwOiBDb21ldENoYXQuR3JvdXAsIHNlbGVjdGVkOiBib29sZWFuKSA9PiB2b2lkO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIHByaXZhdGVHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gICAvKipcbiAgICogQGRlcHJlY2F0ZWRcbiAgICogXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgICovXG4gIEBJbnB1dCgpIHByb3RlY3RlZEdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvTG9ja2VkLnN2Z1wiO1xuICBASW5wdXQoKSBwYXNzd29yZEdyb3VwSWNvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fR1JPVVBTX0ZPVU5EXCIpXG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQubGVmdDtcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiXG4gIH07XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjMycHhcIixcbiAgICBoZWlnaHQ6IFwiMzJweFwiLFxuICB9O1xuICBASW5wdXQoKSBncm91cHNTdHlsZTogR3JvdXBzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4gdm9pZDtcbiAgZ3JvdXBzUmVxdWVzdDogYW55XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge31cbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHRpbWVvdXQ6IGFueTtcbiAgcHVibGljIGdyb3Vwc0xpc3Q6IENvbWV0Q2hhdC5Hcm91cFtdID0gW107XG4gIHB1YmxpYyBncm91cHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImdyb3Vwc0xpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIHN0YXR1c0NvbG9yOiBhbnkgPSB7XG4gICAgcHJpdmF0ZTogXCJcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiXG4gIH1cbiAgcmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBzUmVxdWVzdDtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTogYW55ID0gbnVsbFxuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVySm9pbmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyS2lja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITogU3Vic2NyaXB0aW9uO1xuICBjY093bmVyc2hpcENoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwQ3JlYXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2hlY2tib3hTdHlsZTogQ2hlY2tib3hTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI0cHhcIixcbiAgICBjaGVja2VkQmFja2dyb3VuZENvbG9yOiBcIiMyMTk2RjNcIixcbiAgICB1bmNoZWNrZWRCYWNrZ3JvdW5kQ29sb3I6IFwiI2NjY1wiXG4gIH1cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZyB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpXG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgdGhpcy5mZXRjaE5leHRHcm91cExpc3QoKVxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmdcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpO1xuICB9XG4gIG9uR3JvdXBTZWxlY3RlZChncm91cDogQ29tZXRDaGF0Lkdyb3VwLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQ/LmRldGFpbD8uY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdChncm91cCwgc2VsZWN0ZWQpXG4gICAgfVxuICB9XG4gIC8vIHN1YnNjcmliZSB0byBnbG9iYWwgZXZlbnRzXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cERlbGV0ZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwRGVsZXRlZC5zdWJzY3JpYmUoKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgIHRoaXMucmVtb3ZlR3JvdXAoZ3JvdXApXG4gICAgICBpZiAodGhpcy5hY3RpdmVHcm91cCAmJiBncm91cC5nZXRHdWlkKCkgPT0gdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwQ3JlYXRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBDcmVhdGVkLnN1YnNjcmliZSgoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgdGhpcy5hZGRHcm91cChncm91cClcbiAgICAgIGlmICghdGhpcy5hY3RpdmVHcm91cCkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID0gZ3JvdXBcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckFkZGVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyQWRkZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LnVzZXJBZGRlZEluIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy51c2VyQWRkZWRJbjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LnVzZXJBZGRlZEluISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtPy5raWNrZWRGcm9tISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJKb2luZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJKb2luZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmpvaW5lZEdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy5qb2luZWRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmpvaW5lZEdyb3VwISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtPy5raWNrZWRGcm9tISlcbiAgICB9KVxuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NPd25lcnNoaXBDaGFuZ2VkLnN1YnNjcmliZSgoaXRlbTogSU93bmVyc2hpcENoYW5nZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/Lmdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy5ncm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtPy5ncm91cCEpXG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBMZWZ0ID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICBpZiAoaXRlbS5sZWZ0R3JvdXAuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZSkge1xuICAgICAgICB0aGlzLnJlbW92ZUdyb3VwKGl0ZW0ubGVmdEdyb3VwKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbS5sZWZ0R3JvdXApXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICAvLyB1bnN1YnNjcmliZSB0byBzdWJzY3JpYmVkIGV2ZW50cy5cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBMZWZ0Py51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gICAgdGhpcy5ncm91cHNSZXF1ZXN0ID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIHVwZGF0ZUdyb3VwKGdyb3VwOiBDb21ldENoYXQuR3JvdXApIHtcbiAgICBsZXQgZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3RdO1xuICAgIC8vc2VhcmNoIGZvciBncm91cFxuICAgIGxldCBncm91cEtleSA9IGdyb3Vwc0xpc3QuZmluZEluZGV4KChnLCBrKSA9PiBnLmdldEd1aWQoKSA9PT0gZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICBpZiAoZ3JvdXBLZXkgPiAtMSkge1xuICAgICAgZ3JvdXBzTGlzdC5zcGxpY2UoZ3JvdXBLZXksIDEsIGdyb3VwKTtcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRHcm91cEljb24gPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGxldCBzdGF0dXM7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHN0YXR1cyA9IG51bGxcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXR1c1xuICB9XG4gIGZldGNoTmV3VXNlcnMoKSB7XG4gICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpXG4gICAgbGV0IHN0YXRlID0gdGhpcy5maXJzdFJlbG9hZCA/IFN0YXRlcy5sb2FkaW5nIDogU3RhdGVzLmxvYWRlZDtcbiAgICB0aGlzLmZldGNoTmV4dEdyb3VwTGlzdChzdGF0ZSlcbiAgfVxuICBhdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+Y29ubmVjdGVkXCIpO1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXdVc2VycygpXG4gICAgICAgIH0sXG4gICAgICAgIGluQ29ubmVjdGluZzogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IEluIGNvbm5lY3RpbmdcIik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRGlzY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gT24gRGlzY29ubmVjdGVkXCIpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBmaW5kR3JvdXBJbmRleCA9IChncm91cFRvRmluZDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgbGV0IGdyb3VwSW5kZXggPSB0aGlzLmdyb3Vwc0xpc3QuZmluZEluZGV4KChnLCBrKSA9PiBnLmdldEd1aWQoKSA9PT0gZ3JvdXBUb0ZpbmQuZ2V0R3VpZCgpKTtcbiAgICByZXR1cm4gZ3JvdXBJbmRleDtcbiAgfVxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICB0aGlzLmdyb3Vwc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHsgICAgICAgICAgXG4gICAgICAgICAgY29uc3QgZ3JvdXBJbmRleCA9IHRoaXMuZmluZEdyb3VwSW5kZXgoY2hhbmdlZEdyb3VwKTtcbiAgICAgICAgICAgaWYoZ3JvdXBJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgICAgICAgICAgIGNvbnN0IGdyb3VwRm91bmQgPSBncm91cHNMaXN0W2dyb3VwSW5kZXhdO1xuICAgICAgICAgICAgICBpZiAoY2hhbmdlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0U2NvcGUobmV3U2NvcGUpXG4gICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEluZGV4LCAxLCBncm91cEZvdW5kKTtcbiAgICAgICAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gZ3JvdXBzTGlzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGtpY2tlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBraWNrZWRCeTogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEZyb206IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwSW5kZXggPSB0aGlzLmZpbmRHcm91cEluZGV4KGtpY2tlZEZyb20pO1xuICAgICAgICAgIGlmIChncm91cEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgICAgICAgICBsZXQgZ3JvdXBGb3VuZCA9IGdyb3Vwc0xpc3RbZ3JvdXBJbmRleF07XG4gICAgICAgICAgICBpZiAoa2lja2VkVXNlci5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0SGFzSm9pbmVkKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0TWVtYmVyc0NvdW50KGtpY2tlZEZyb20uZ2V0TWVtYmVyc0NvdW50KCkpO1xuICAgICAgICAgICAgZ3JvdXBzTGlzdC5zcGxpY2UoZ3JvdXBJbmRleCwgMSwgZ3JvdXBGb3VuZCk7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckJhbm5lZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBiYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsIGJhbm5lZEZyb206IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwSW5kZXggPSB0aGlzLmZpbmRHcm91cEluZGV4KGJhbm5lZEZyb20pO1xuICAgICAgICAgIGlmIChncm91cEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgICAgICAgICBsZXQgZ3JvdXBGb3VuZCA9IGdyb3Vwc0xpc3RbZ3JvdXBJbmRleF07XG4gIFxuICAgICAgICAgICAgaWYgKGJhbm5lZFVzZXIuZ2V0VWlkKCkgPT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICB0aGlzLnJlbW92ZUdyb3VwKGJhbm5lZEZyb20pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncm91cEZvdW5kLnNldE1lbWJlcnNDb3VudChiYW5uZWRGcm9tLmdldE1lbWJlcnNDb3VudCgpKTtcbiAgXG4gICAgICAgICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEluZGV4LCAxLCBncm91cEZvdW5kKTtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyVW5iYW5uZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCB1bmJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCB1bmJhbm5lZEJ5OiBDb21ldENoYXQuVXNlciwgdW5iYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBjb25zdCBncm91cEluZGV4ID0gdGhpcy5maW5kR3JvdXBJbmRleCh1bmJhbm5lZEZyb20pO1xuICAgICAgICAgIGlmIChncm91cEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgICAgICAgICBsZXQgZ3JvdXBGb3VuZCA9IGdyb3Vwc0xpc3RbZ3JvdXBJbmRleF07XG4gIFxuICAgICAgICAgICAgaWYgKHVuYmFubmVkVXNlci5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0SGFzSm9pbmVkKGZhbHNlKTsgXG4gICAgICAgICAgICB9XG4gIFxuICAgICAgICAgICAgZ3JvdXBzTGlzdC5zcGxpY2UoZ3JvdXBJbmRleCwgMSwgZ3JvdXBGb3VuZCk7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFkZEdyb3VwKHVuYmFubmVkRnJvbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCB1c2VyQWRkZWQ6IENvbWV0Q2hhdC5Vc2VyLCB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBpZih0aGlzLnNlYXJjaEtleXdvcmQpIHJldHVybjtcbiAgICAgICAgICBjb25zdCBncm91cEluZGV4ID0gdGhpcy5maW5kR3JvdXBJbmRleCh1c2VyQWRkZWRJbik7XG4gICAgICAgICAgaWYgKGdyb3VwSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAgICAgICAgIGxldCBncm91cEZvdW5kID0gZ3JvdXBzTGlzdFtncm91cEluZGV4XTtcbiAgXG4gICAgICAgICAgICBpZiAodXNlckFkZGVkLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgZ3JvdXBGb3VuZC5zZXRIYXNKb2luZWQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncm91cEZvdW5kLnNldE1lbWJlcnNDb3VudCh1c2VyQWRkZWRJbi5nZXRNZW1iZXJzQ291bnQoKSk7XG4gICAgICAgICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEluZGV4LCAxLCBncm91cEZvdW5kKTtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgdXNlckFkZGVkSW4uc2V0SGFzSm9pbmVkKHRydWUpO1xuICAgICAgICAgICAgdGhpcy5hZGRHcm91cCh1c2VyQWRkZWRJbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBsZWF2aW5nVXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBjb25zdCBncm91cEluZGV4ID0gdGhpcy5maW5kR3JvdXBJbmRleChncm91cCk7XG4gICAgICAgICAgaWYgKGdyb3VwSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAgICAgICAgIGxldCBncm91cEZvdW5kID0gZ3JvdXBzTGlzdFtncm91cEluZGV4XTtcbiAgXG4gICAgICAgICAgICBpZiAobGVhdmluZ1VzZXIuZ2V0VWlkKCkgPT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICBncm91cEZvdW5kLnNldEhhc0pvaW5lZChmYWxzZSk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JvdXBGb3VuZC5zZXRNZW1iZXJzQ291bnQoZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkpO1xuICBcbiAgICAgICAgICAgIGdyb3Vwc0xpc3Quc3BsaWNlKGdyb3VwSW5kZXgsIDEsIGdyb3VwRm91bmQpO1xuICAgICAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gZ3JvdXBzTGlzdDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBqb2luZWRVc2VyOiBDb21ldENoYXQuVXNlciwgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwSW5kZXggPSB0aGlzLmZpbmRHcm91cEluZGV4KGpvaW5lZEdyb3VwKTtcbiAgICAgICAgICBpZiAoZ3JvdXBJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3RdO1xuICAgICAgICAgICAgbGV0IGdyb3VwRm91bmQgPSBncm91cHNMaXN0W2dyb3VwSW5kZXhdO1xuICBcbiAgICAgICAgICAgIGlmIChqb2luZWRVc2VyLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgZ3JvdXBGb3VuZC5zZXRIYXNKb2luZWQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncm91cEZvdW5kLnNldE1lbWJlcnNDb3VudChqb2luZWRHcm91cC5nZXRNZW1iZXJzQ291bnQoKSk7XG4gIFxuICAgICAgICAgICAgZ3JvdXBzTGlzdC5zcGxpY2UoZ3JvdXBJbmRleCwgMSwgZ3JvdXBGb3VuZCk7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3Vwc0xpc3RlbmVySWQpO1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZClcbiAgfVxuICBmZXRjaE5leHRHcm91cExpc3QgPSAoc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsXG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgaWYgKHRoaXMucmVxdWVzdEJ1aWxkZXIgJiYgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KT8ucGFnaW5hdGlvbiAmJiAoKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uPy5jdXJyZW50X3BhZ2UgPT0gMCB8fCAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24/LmN1cnJlbnRfcGFnZSAhPSAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24udG90YWxfcGFnZXMpKSB7XG4gICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLmZldGNoTmV4dCgpLnRoZW4oXG4gICAgICAgICAgKGdyb3VwTGlzdDogQ29tZXRDaGF0Lkdyb3VwW10pID0+IHtcbiAgICAgICAgICAgIGlmICgoZ3JvdXBMaXN0Lmxlbmd0aCA8PSAwICYmIHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApIHx8IChncm91cExpc3QubGVuZ3RoID09PSAwICYmIHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChzdGF0ZSA9PSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gWy4uLmdyb3VwTGlzdF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0LCAuLi5ncm91cExpc3RdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkXG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpXG4gICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgKS5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmdyb3Vwc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcblxuICAgICAgICAgIH1cblxuICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIG9uQ2xpY2sgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKGdyb3VwKVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIHJldHVybiAodGhpcy5zdGF0dXNDb2xvciBhcyBhbnkpWyhncm91cD8uZ2V0VHlwZSgpIGFzIHN0cmluZyldO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRNZW1iZXJDb3VudCA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgcmV0dXJuIGdyb3VwLmdldE1lbWJlcnNDb3VudCgpID4gMSA/IGdyb3VwLmdldE1lbWJlcnNDb3VudCgpICsgXCIgXCIgKyBsb2NhbGl6ZShcIk1FTUJFUlNcIikgOiBncm91cC5nZXRNZW1iZXJzQ291bnQoKSArIFwiIFwiICsgbG9jYWxpemUoXCJNRU1CRVJcIilcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgZ2V0QWN0aXZlR3JvdXAgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIGlmIChncm91cC5nZXRHdWlkKCkgPT0gdGhpcy5hY3RpdmVHcm91cD8uZ2V0R3VpZCgpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICBzZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAoIXRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICB9XG4gICAgaWYgKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyLmJ1aWxkKClcbiAgICB9XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpLmJ1aWxkKClcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgcmVtb3ZlR3JvdXAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIGdyb3VwXG4gICAgbGV0IGdyb3VwS2V5ID0gZ3JvdXBzTGlzdC5maW5kSW5kZXgoKGcsIGspID0+IGcuZ2V0R3VpZCgpID09PSBncm91cC5nZXRHdWlkKCkpO1xuICAgIGlmIChncm91cEtleSA+IC0xKSB7XG4gICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEtleSwgMSk7XG4gICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogYWRkR3JvdXBcbiAgICogQHBhcmFtIGdyb3VwXG4gICAqL1xuICBhZGRHcm91cChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgdGhpcy5ncm91cHNMaXN0LnVuc2hpZnQoZ3JvdXApO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgb25TZWFyY2ggPSAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5zZWFyY2hLZXl3b3JkID0ga2V5O1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLmZldGNoTmV4dEdyb3VwTGlzdCgpO1xuICAgICAgfSwgNTAwKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgZ3JvdXBTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmdyb3Vwc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLmdyb3Vwc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5ncm91cHNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmdyb3Vwc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5ncm91cHNTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEdyb3Vwc1N0eWxlKClcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKVxuICAgIHRoaXMuc3RhdHVzQ29sb3IucHJpdmF0ZSA9IHRoaXMuZ3JvdXBzU3R5bGUucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQgPz8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wYXNzd29yZCA9IHRoaXMuZ3JvdXBzU3R5bGUucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kID8/IFwiI0Y3QTUwMFwiO1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5ncm91cHNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy5ncm91cHNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEljb25UaW50LFxuICAgICAgc2VhcmNoQm9yZGVyOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEJvcmRlcixcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hCb3JkZXJSYWRpdXMsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEJhY2tncm91bmQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcixcbiAgICAgIHNlYXJjaFRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFRleHRGb250LFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFRleHRDb2xvcixcbiAgICB9XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpXG4gICAgfSlcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH1cbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlIH1cbiAgfVxuICBzZXRHcm91cHNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBHcm91cHNTdHlsZSA9IG5ldyBHcm91cHNTdHlsZSh7XG4gICAgICBzdWJUaXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YlRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MylcbiAgICB9KVxuICAgIHRoaXMuZ3JvdXBzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5ncm91cHNTdHlsZSB9XG4gICAgdGhpcy5jaGVja2JveFN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBjaGVja2VkQmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHVuY2hlY2tlZEJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKVxuICAgIH1cbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmdyb3Vwc1N0eWxlLnN1YlRpdGxlVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5ncm91cHNTdHlsZS5zdWJUaXRsZVRleHRDb2xvclxuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWdyb3Vwc1wiIFtuZ1N0eWxlXT1cImdyb3VwU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cblxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG5cbjwvZGl2PlxuICA8Y29tZXRjaGF0LWxpc3QgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwib25TY3JvbGxlZFRvQm90dG9tXCIgW29uU2VhcmNoXT1cIm9uU2VhcmNoXCJcbiAgICAgIFtsaXN0XT1cImdyb3Vwc0xpc3RcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gIDwvY29tZXRjaGF0LWxpc3Q+XG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWdyb3VwPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cImdyb3VwPy5uYW1lXCIgW2F2YXRhclVSTF09XCJncm91cD8uaWNvblwiIFthdmF0YXJOYW1lXT1cImdyb3VwPy5uYW1lXCJcbiAgICAgICAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCIgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICAgICAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXApXCIgW3N0YXR1c0luZGljYXRvckljb25dPVwiZ2V0R3JvdXBJY29uKGdyb3VwKVwiIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkNsaWNrKGdyb3VwKVwiIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVHcm91cChncm91cClcIj5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWdyb3Vwc19fc3VidGl0bGUtdmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgZ3JvdXBTdWJ0aXRsZVwiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IGdyb3VwIH1cIj5cbiAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNncm91cFN1YnRpdGxlPlxuICAgICAgICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiIGNsYXNzPVwiY2MtZ3JvdXBzX19zdWJ0aXRsZS12aWV3XCI+IHt7Z2V0TWVtYmVyQ291bnQoZ3JvdXApfX0gPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuICAgICAgICAgIDxkaXYgc2xvdD1cIm1lbnVWaWV3XCIgY2xhc3M9XCJjYy1ncm91cHNfX29wdGlvbnNcIiAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnMoZ3JvdXApXCI+XG5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIiBjbGFzcz1cImNjLWdyb3Vwc19fdGFpbC12aWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25Hcm91cFNlbGVjdGVkKGdyb3VwLCRldmVudClcIj48L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5tdWx0aXBsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtY2hlY2tib3ggW2NoZWNrYm94U3R5bGVdPVwiY2hlY2tib3hTdHlsZVwiIChjYy1jaGVja2JveC1jaGFuZ2VkKT1cIm9uR3JvdXBTZWxlY3RlZChncm91cCwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICA8L25nLXRlbXBsYXRlPlxuPC9kaXY+Il19