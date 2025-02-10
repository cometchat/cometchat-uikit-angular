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
    }
}
CometChatGroupsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatGroupsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatGroupsComponent, selector: "cometchat-groups", inputs: { groupsRequestBuilder: "groupsRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", menu: "menu", options: "options", activeGroup: "activeGroup", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", hideError: "hideError", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onSelect: "onSelect", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", groupsStyle: "groupsStyle", listItemStyle: "listItemStyle", onItemClick: "onItemClick" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-groups\" [ngStyle]=\"groupStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"groupsList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-group>\n      <cometchat-list-item [title]=\"group?.name\" [avatarURL]=\"group?.avatar\" [avatarName]=\"group?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(group)\" [statusIndicatorIcon]=\"getGroupIcon(group)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(group)\" [isActive]=\"getActiveGroup(group)\">\n          <div slot=\"subtitleView\" class=\"cc-groups__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n              <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: group }\">\n              </ng-container>\n          </div>\n          <ng-template #groupSubtitle>\n             <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-groups__subtitle-view\"> {{getMemberCount(group)}} </div>\n          </ng-template>\n\n          <div slot=\"menuView\" class=\"cc-groups__options\" *ngIf=\"options\">\n            <cometchat-menu-list [data]=\"options(group)\">\n\n            </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-groups__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      </cometchat-list-item>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\">\n          <cometchat-radio-button (cc-radio-button-changed)=\"onGroupSelected(group,$event)\"></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n          <cometchat-checkbox (cc-checkbox-changed)=\"onGroupSelected(group,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n  </ng-template>\n</div>", styles: [".cc-groups{height:100%;width:100%;box-sizing:border-box}.cc-groups__tail-view{position:relative}.cc-menus{position:absolute;right:12px;top:6px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-groups", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-groups\" [ngStyle]=\"groupStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"groupsList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-group>\n      <cometchat-list-item [title]=\"group?.name\" [avatarURL]=\"group?.avatar\" [avatarName]=\"group?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(group)\" [statusIndicatorIcon]=\"getGroupIcon(group)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(group)\" [isActive]=\"getActiveGroup(group)\">\n          <div slot=\"subtitleView\" class=\"cc-groups__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n              <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: group }\">\n              </ng-container>\n          </div>\n          <ng-template #groupSubtitle>\n             <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-groups__subtitle-view\"> {{getMemberCount(group)}} </div>\n          </ng-template>\n\n          <div slot=\"menuView\" class=\"cc-groups__options\" *ngIf=\"options\">\n            <cometchat-menu-list [data]=\"options(group)\">\n\n            </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-groups__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      </cometchat-list-item>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\">\n          <cometchat-radio-button (cc-radio-button-changed)=\"onGroupSelected(group,$event)\"></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n          <cometchat-checkbox (cc-checkbox-changed)=\"onGroupSelected(group,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n  </ng-template>\n</div>", styles: [".cc-groups{height:100%;width:100%;box-sizing:border-box}.cc-groups__tail-view{position:relative}.cc-menus{position:absolute;right:12px;top:6px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdEdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzL2NvbWV0Y2hhdC1ncm91cHMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cHMvY29tZXRjaGF0LWdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSx1QkFBdUIsRUFBcUIsU0FBUyxFQUFFLEtBQUssRUFBaUQsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxXQUFXLEVBQXdCLE1BQU0seUJBQXlCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUd0RSxPQUFPLEVBQW1CLFFBQVEsRUFBRSxvQkFBb0IsRUFBK0MsTUFBTSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQXFELHVCQUF1QixFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3pRLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDOzs7OztBQUMxRTs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyx3QkFBd0I7SUE4RW5DLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUF0RTlFLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBQy9CLGtCQUFhLEdBQWtCLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDbEQsc0JBQWlCLEdBQVcs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Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFHRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBS0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgR3JvdXBzU3R5bGUsIExpc3RTdHlsZSwgQmFzZVN0eWxlIH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgTGlzdEl0ZW1TdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgQ29tZXRDaGF0T3B0aW9uLCBsb2NhbGl6ZSwgQ29tZXRDaGF0R3JvdXBFdmVudHMsIElHcm91cE1lbWJlckFkZGVkLCBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsIFN0YXRlcywgVGl0bGVBbGlnbm1lbnQsIFNlbGVjdGlvbk1vZGUsIElHcm91cE1lbWJlckpvaW5lZCwgSU93bmVyc2hpcENoYW5nZWQsIElHcm91cExlZnQsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBmb250SGVscGVyIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uJztcbi8qKlxuKlxuKiBDb21ldENoYXRHcm91cHMgaXMgYSB3cmFwcGVyIGNvbXBvbmVudCB3aGljaCBjb25zaXN0cyBvZiBDb21ldENoYXRMaXN0QmFzZUNvbXBvbmVudCBhbmQgQ29tZXRDaGF0R3JvdXBMaXN0Q29tcG9uZW50LlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1ncm91cHNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRHcm91cHNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGdyb3Vwc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzZWFyY2hSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOiAoKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBhY3RpdmVHcm91cCE6IENvbWV0Q2hhdC5Hcm91cCB8IG51bGw7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdST1VQU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25TZWxlY3QhOiAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCwgc2VsZWN0ZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKiBcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAgKi9cbiAgQElucHV0KCkgcHJvdGVjdGVkR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHBhc3N3b3JkR3JvdXBJY29uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19HUk9VUFNfRk9VTkRcIilcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgd2lkdGg6IFwiMTJweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCJcbiAgfTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGdyb3Vwc1N0eWxlOiBHcm91cHNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBzZXBhcmF0b3JDb2xvcjogXCJyZ2IoMjIyIDIyMiAyMjIgLyA0NiUpXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHt9O1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB2b2lkO1xuICBncm91cHNSZXF1ZXN0OiBhbnlcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSB7fVxuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgdGltZW91dDogYW55O1xuICBwdWJsaWMgZ3JvdXBzTGlzdDogQ29tZXRDaGF0Lkdyb3VwW10gPSBbXTtcbiAgcHVibGljIGdyb3Vwc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiZ3JvdXBzTGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICByZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0O1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29ubmVjdGlvbkxpc3RlbmVySWQgPSBcImNvbm5lY3Rpb25fXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsXG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cERlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBDcmVhdGVkITogU3Vic2NyaXB0aW9uO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cExpc3RcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKClcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICB0aGlzLmZldGNoTmV4dEdyb3VwTGlzdCgpXG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZ1xuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKCk7XG4gIH1cbiAgb25Hcm91cFNlbGVjdGVkKGdyb3VwOiBDb21ldENoYXQuR3JvdXAsIGV2ZW50OiBhbnkpIHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudD8uZGV0YWlsPy5jaGVja2VkO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KGdyb3VwLCBzZWxlY3RlZClcbiAgICB9XG4gIH1cbiAgLy8gc3Vic2NyaWJlIHRvIGdsb2JhbCBldmVudHNcbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwRGVsZXRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBEZWxldGVkLnN1YnNjcmliZSgoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgdGhpcy5yZW1vdmVHcm91cChncm91cClcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIGdyb3VwLmdldEd1aWQoKSA9PSB0aGlzLmFjdGl2ZUdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBDcmVhdGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cENyZWF0ZWQuc3Vic2NyaWJlKChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICB0aGlzLmFkZEdyb3VwKGdyb3VwKVxuICAgICAgaWYgKCF0aGlzLmFjdGl2ZUdyb3VwKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPSBncm91cFxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8udXNlckFkZGVkSW4hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LnVzZXJBZGRlZEluO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbT8udXNlckFkZGVkSW4hKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmtpY2tlZEZyb20hKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uam9pbmVkR3JvdXAhLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LmpvaW5lZEdyb3VwO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbT8uam9pbmVkR3JvdXAhKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmtpY2tlZEZyb20hKVxuICAgIH0pXG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uZ3JvdXAhLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/Lmdyb3VwO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/Lmdyb3VwISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cExlZnQpID0+IHtcbiAgICAgIGlmIChpdGVtLmxlZnRHcm91cC5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlR3JvdXAoaXRlbS5sZWZ0R3JvdXApXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtLmxlZnRHcm91cClcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIC8vIHVuc3Vic2NyaWJlIHRvIHN1YnNjcmliZWQgZXZlbnRzLlxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKClcbiAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgdXBkYXRlR3JvdXAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIGdyb3VwXG4gICAgbGV0IGdyb3VwS2V5ID0gZ3JvdXBzTGlzdC5maW5kSW5kZXgoKGcsIGspID0+IGcuZ2V0R3VpZCgpID09PSBncm91cC5nZXRHdWlkKCkpO1xuICAgIGlmIChncm91cEtleSA+IC0xKSB7XG4gICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEtleSwgMSwgZ3JvdXApO1xuICAgICAgdGhpcy5ncm91cHNMaXN0ID0gZ3JvdXBzTGlzdDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIGdldEdyb3VwSWNvbiA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgbGV0IHN0YXR1cztcbiAgICBpZiAoZ3JvdXApIHtcbiAgICAgIHN3aXRjaCAoZ3JvdXAuZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBzdGF0dXMgPSB0aGlzLnBhc3N3b3JkR3JvdXBJY29uIHx8IHRoaXMucHJvdGVjdGVkR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZTpcbiAgICAgICAgICBzdGF0dXMgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgc3RhdHVzID0gbnVsbFxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RhdHVzXG4gIH1cbiAgZmV0Y2hOZXdVc2VycygpIHtcbiAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKClcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmZpcnN0UmVsb2FkID8gU3RhdGVzLmxvYWRpbmcgOiBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0KHN0YXRlKVxuICB9XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENvbm5lY3Rpb25MaXN0ZW5lcihcbiAgICAgIHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNvbm5lY3Rpb25MaXN0ZW5lcih7XG4gICAgICAgIG9uQ29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT5jb25uZWN0ZWRcIik7XG4gICAgICAgICAgdGhpcy5mZXRjaE5ld1VzZXJzKClcbiAgICAgICAgfSxcbiAgICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGZpbmRHcm91cEluZGV4ID0gKGdyb3VwVG9GaW5kOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICBsZXQgZ3JvdXBJbmRleCA9IHRoaXMuZ3JvdXBzTGlzdC5maW5kSW5kZXgoKGcsIGspID0+IGcuZ2V0R3VpZCgpID09PSBncm91cFRvRmluZC5nZXRHdWlkKCkpO1xuICAgIHJldHVybiBncm91cEluZGV4O1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIGNoYW5nZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4geyAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBncm91cEluZGV4ID0gdGhpcy5maW5kR3JvdXBJbmRleChjaGFuZ2VkR3JvdXApO1xuICAgICAgICAgICBpZihncm91cEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAgICAgICAgICAgY29uc3QgZ3JvdXBGb3VuZCA9IGdyb3Vwc0xpc3RbZ3JvdXBJbmRleF07XG4gICAgICAgICAgICAgIGlmIChjaGFuZ2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgICAgZ3JvdXBGb3VuZC5zZXRTY29wZShuZXdTY29wZSlcbiAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGdyb3Vwc0xpc3Quc3BsaWNlKGdyb3VwSW5kZXgsIDEsIGdyb3VwRm91bmQpO1xuICAgICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlciwga2lja2VkRnJvbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgY29uc3QgZ3JvdXBJbmRleCA9IHRoaXMuZmluZEdyb3VwSW5kZXgoa2lja2VkRnJvbSk7XG4gICAgICAgICAgaWYgKGdyb3VwSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAgICAgICAgIGxldCBncm91cEZvdW5kID0gZ3JvdXBzTGlzdFtncm91cEluZGV4XTtcbiAgICAgICAgICAgIGlmIChraWNrZWRVc2VyLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgZ3JvdXBGb3VuZC5zZXRIYXNKb2luZWQoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JvdXBGb3VuZC5zZXRNZW1iZXJzQ291bnQoa2lja2VkRnJvbS5nZXRNZW1iZXJzQ291bnQoKSk7XG4gICAgICAgICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEluZGV4LCAxLCBncm91cEZvdW5kKTtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGJhbm5lZEJ5OiBDb21ldENoYXQuVXNlciwgYmFubmVkRnJvbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgY29uc3QgZ3JvdXBJbmRleCA9IHRoaXMuZmluZEdyb3VwSW5kZXgoYmFubmVkRnJvbSk7XG4gICAgICAgICAgaWYgKGdyb3VwSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAgICAgICAgIGxldCBncm91cEZvdW5kID0gZ3JvdXBzTGlzdFtncm91cEluZGV4XTtcbiAgXG4gICAgICAgICAgICBpZiAoYmFubmVkVXNlci5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIHRoaXMucmVtb3ZlR3JvdXAoYmFubmVkRnJvbSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0TWVtYmVyc0NvdW50KGJhbm5lZEZyb20uZ2V0TWVtYmVyc0NvdW50KCkpO1xuICBcbiAgICAgICAgICAgIGdyb3Vwc0xpc3Quc3BsaWNlKGdyb3VwSW5kZXgsIDEsIGdyb3VwRm91bmQpO1xuICAgICAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gZ3JvdXBzTGlzdDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJVbmJhbm5lZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsIHVuYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLCB1bmJhbm5lZEZyb206IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwSW5kZXggPSB0aGlzLmZpbmRHcm91cEluZGV4KHVuYmFubmVkRnJvbSk7XG4gICAgICAgICAgaWYgKGdyb3VwSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAgICAgICAgIGxldCBncm91cEZvdW5kID0gZ3JvdXBzTGlzdFtncm91cEluZGV4XTtcbiAgXG4gICAgICAgICAgICBpZiAodW5iYW5uZWRVc2VyLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgZ3JvdXBGb3VuZC5zZXRIYXNKb2luZWQoZmFsc2UpOyBcbiAgICAgICAgICAgIH1cbiAgXG4gICAgICAgICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEluZGV4LCAxLCBncm91cEZvdW5kKTtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkR3JvdXAodW5iYW5uZWRGcm9tKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsIHVzZXJBZGRlZEJ5OiBDb21ldENoYXQuVXNlciwgdXNlckFkZGVkSW46IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGlmKHRoaXMuc2VhcmNoS2V5d29yZCkgcmV0dXJuO1xuICAgICAgICAgIGNvbnN0IGdyb3VwSW5kZXggPSB0aGlzLmZpbmRHcm91cEluZGV4KHVzZXJBZGRlZEluKTtcbiAgICAgICAgICBpZiAoZ3JvdXBJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3RdO1xuICAgICAgICAgICAgbGV0IGdyb3VwRm91bmQgPSBncm91cHNMaXN0W2dyb3VwSW5kZXhdO1xuICBcbiAgICAgICAgICAgIGlmICh1c2VyQWRkZWQuZ2V0VWlkKCkgPT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICBncm91cEZvdW5kLnNldEhhc0pvaW5lZCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0TWVtYmVyc0NvdW50KHVzZXJBZGRlZEluLmdldE1lbWJlcnNDb3VudCgpKTtcbiAgICAgICAgICAgIGdyb3Vwc0xpc3Quc3BsaWNlKGdyb3VwSW5kZXgsIDEsIGdyb3VwRm91bmQpO1xuICAgICAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gZ3JvdXBzTGlzdDtcbiAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICB1c2VyQWRkZWRJbi5zZXRIYXNKb2luZWQodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmFkZEdyb3VwKHVzZXJBZGRlZEluKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyTGVmdDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGxlYXZpbmdVc2VyOiBDb21ldENoYXQuVXNlciwgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwSW5kZXggPSB0aGlzLmZpbmRHcm91cEluZGV4KGdyb3VwKTtcbiAgICAgICAgICBpZiAoZ3JvdXBJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3RdO1xuICAgICAgICAgICAgbGV0IGdyb3VwRm91bmQgPSBncm91cHNMaXN0W2dyb3VwSW5kZXhdO1xuICBcbiAgICAgICAgICAgIGlmIChsZWF2aW5nVXNlci5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0SGFzSm9pbmVkKGZhbHNlKTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncm91cEZvdW5kLnNldE1lbWJlcnNDb3VudChncm91cC5nZXRNZW1iZXJzQ291bnQoKSk7XG4gIFxuICAgICAgICAgICAgZ3JvdXBzTGlzdC5zcGxpY2UoZ3JvdXBJbmRleCwgMSwgZ3JvdXBGb3VuZCk7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGpvaW5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBqb2luZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgY29uc3QgZ3JvdXBJbmRleCA9IHRoaXMuZmluZEdyb3VwSW5kZXgoam9pbmVkR3JvdXApO1xuICAgICAgICAgIGlmIChncm91cEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgICAgICAgICBsZXQgZ3JvdXBGb3VuZCA9IGdyb3Vwc0xpc3RbZ3JvdXBJbmRleF07XG4gIFxuICAgICAgICAgICAgaWYgKGpvaW5lZFVzZXIuZ2V0VWlkKCkgPT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICBncm91cEZvdW5kLnNldEhhc0pvaW5lZCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdyb3VwRm91bmQuc2V0TWVtYmVyc0NvdW50KGpvaW5lZEdyb3VwLmdldE1lbWJlcnNDb3VudCgpKTtcbiAgXG4gICAgICAgICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEluZGV4LCAxLCBncm91cEZvdW5kKTtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVHcm91cExpc3RlbmVyKHRoaXMuZ3JvdXBzTGlzdGVuZXJJZCk7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKVxuICB9XG4gIGZldGNoTmV4dEdyb3VwTGlzdCA9IChzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmcpID0+IHtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IG51bGxcbiAgICB0aGlzLnN0YXRlID0gc3RhdGVcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICBpZiAodGhpcy5yZXF1ZXN0QnVpbGRlciAmJiAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpPy5wYWdpbmF0aW9uICYmICgodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24/LmN1cnJlbnRfcGFnZSA9PSAwIHx8ICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbj8uY3VycmVudF9wYWdlICE9ICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi50b3RhbF9wYWdlcykpIHtcbiAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cExpc3RcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuZmV0Y2hOZXh0KCkudGhlbihcbiAgICAgICAgICAoZ3JvdXBMaXN0OiBDb21ldENoYXQuR3JvdXBbXSkgPT4ge1xuICAgICAgICAgICAgaWYgKChncm91cExpc3QubGVuZ3RoIDw9IDAgJiYgdGhpcy5ncm91cHNMaXN0Py5sZW5ndGggPD0gMCkgfHwgKGdyb3VwTGlzdC5sZW5ndGggPT09IDAgJiYgdGhpcy5ncm91cHNMaXN0Py5sZW5ndGggPD0gMCkpIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKHN0YXRlID09IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbLi4uZ3JvdXBMaXN0XVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3QsIC4uLmdyb3VwTGlzdF07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWRcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKClcbiAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3JcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuXG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgb25DbGljayA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soZ3JvdXApXG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgcmV0dXJuICh0aGlzLnN0YXR1c0NvbG9yIGFzIGFueSlbKGdyb3VwPy5nZXRUeXBlKCkgYXMgc3RyaW5nKV07XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIGdldE1lbWJlckNvdW50ID0gKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICByZXR1cm4gZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgPiAxID8gZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgKyBcIiBcIiArIGxvY2FsaXplKFwiTUVNQkVSU1wiKSA6IGdyb3VwLmdldE1lbWJlcnNDb3VudCgpICsgXCIgXCIgKyBsb2NhbGl6ZShcIk1FTUJFUlwiKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRBY3RpdmVHcm91cCA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZSA9PSBTZWxlY3Rpb25Nb2RlLm5vbmUgfHwgIXRoaXMuc2VsZWN0aW9uTW9kZSkge1xuICAgICAgaWYgKGdyb3VwLmdldEd1aWQoKSA9PSB0aGlzLmFjdGl2ZUdyb3VwPy5nZXRHdWlkKCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHNldFJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmICghdGhpcy5ncm91cHNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgIH1cbiAgICBpZiAodGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKVxuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5ncm91cHNSZXF1ZXN0QnVpbGRlci5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZCkuYnVpbGQoKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICByZW1vdmVHcm91cChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAvL3NlYXJjaCBmb3IgZ3JvdXBcbiAgICBsZXQgZ3JvdXBLZXkgPSBncm91cHNMaXN0LmZpbmRJbmRleCgoZywgaykgPT4gZy5nZXRHdWlkKCkgPT09IGdyb3VwLmdldEd1aWQoKSk7XG4gICAgaWYgKGdyb3VwS2V5ID4gLTEpIHtcbiAgICAgIGdyb3Vwc0xpc3Quc3BsaWNlKGdyb3VwS2V5LCAxKTtcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBhZGRHcm91cFxuICAgKiBAcGFyYW0gZ3JvdXBcbiAgICovXG4gIGFkZEdyb3VwKGdyb3VwOiBDb21ldENoYXQuR3JvdXApIHtcbiAgICB0aGlzLmdyb3Vwc0xpc3QudW5zaGlmdChncm91cCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5XG4gICAqL1xuICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IFtdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0KCk7XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICB9O1xuICBncm91cFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuZ3JvdXBzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuZ3JvdXBzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmdyb3Vwc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuZ3JvdXBzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmdyb3Vwc1N0eWxlLmJvcmRlclJhZGl1c1xuICAgIH1cbiAgfVxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0R3JvdXBzU3R5bGUoKVxuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpXG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpXG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID0gdGhpcy5ncm91cHNTdHlsZS5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZCA/PyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID0gdGhpcy5ncm91cHNTdHlsZS5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQgPz8gXCIjRjdBNTAwXCI7XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5ncm91cHNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmdyb3Vwc1N0eWxlLmxvYWRpbmdJY29uVGludCxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoQm9yZGVyLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoVGV4dENvbG9yLFxuICAgIH1cbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKClcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgfVxuICB9XG4gIHNldEdyb3Vwc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEdyb3Vwc1N0eWxlID0gbmV3IEdyb3Vwc1N0eWxlKHtcbiAgICAgIHN1YlRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc3ViVGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZDogXCJSR0IoMjQ3LCAxNjUsIDApXCIsXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKVxuICAgIH0pXG4gICAgdGhpcy5ncm91cHNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmdyb3Vwc1N0eWxlIH1cbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmdyb3Vwc1N0eWxlLnN1YlRpdGxlVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5ncm91cHNTdHlsZS5zdWJUaXRsZVRleHRDb2xvclxuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWdyb3Vwc1wiIFtuZ1N0eWxlXT1cImdyb3VwU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cblxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG5cbjwvZGl2PlxuICA8Y29tZXRjaGF0LWxpc3QgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwib25TY3JvbGxlZFRvQm90dG9tXCIgW29uU2VhcmNoXT1cIm9uU2VhcmNoXCJcbiAgICAgIFtsaXN0XT1cImdyb3Vwc0xpc3RcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gIDwvY29tZXRjaGF0LWxpc3Q+XG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWdyb3VwPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cImdyb3VwPy5uYW1lXCIgW2F2YXRhclVSTF09XCJncm91cD8uYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwiZ3JvdXA/Lm5hbWVcIlxuICAgICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihncm91cClcIiBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJnZXRHcm91cEljb24oZ3JvdXApXCIgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2soZ3JvdXApXCIgW2lzQWN0aXZlXT1cImdldEFjdGl2ZUdyb3VwKGdyb3VwKVwiPlxuICAgICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIGNsYXNzPVwiY2MtZ3JvdXBzX19zdWJ0aXRsZS12aWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXc7ZWxzZSBncm91cFN1YnRpdGxlXCI+XG4gICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogZ3JvdXAgfVwiPlxuICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2dyb3VwU3VidGl0bGU+XG4gICAgICAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgW25nU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCIgY2xhc3M9XCJjYy1ncm91cHNfX3N1YnRpdGxlLXZpZXdcIj4ge3tnZXRNZW1iZXJDb3VudChncm91cCl9fSA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuXG4gICAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLWdyb3Vwc19fb3B0aW9uc1wiICpuZ0lmPVwib3B0aW9uc1wiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhncm91cClcIj5cblxuICAgICAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiIGNsYXNzPVwiY2MtZ3JvdXBzX190YWlsLXZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGFpbFZpZXdcIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICAgICAgPG5nLXRlbXBsYXRlICN0YWlsVmlldz5cbiAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uIChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJvbkdyb3VwU2VsZWN0ZWQoZ3JvdXAsJGV2ZW50KVwiPjwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbkdyb3VwU2VsZWN0ZWQoZ3JvdXAsJGV2ZW50KVwiPjwvY29tZXRjaGF0LWNoZWNrYm94PlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvZGl2PiJdfQ==