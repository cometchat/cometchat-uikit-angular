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
        this.protectedGroupIcon = "assets/Locked.svg";
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
                        status = this.protectedGroupIcon;
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
                if (changedUser.getUid() == this.loggedInUser?.getUid()) {
                    changedGroup.setScope(newScope);
                }
                this.updateGroup(changedGroup);
            },
            onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                if (kickedUser.getUid() == this.loggedInUser?.getUid()) {
                    kickedFrom.setHasJoined(false);
                }
                this.updateGroup(kickedFrom);
            },
            onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                if (bannedUser.getUid() == this.loggedInUser?.getUid()) {
                    this.removeGroup(bannedFrom);
                }
                else {
                    this.updateGroup(bannedFrom);
                }
            },
            onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                if (unbannedUser.getUid() == this.loggedInUser?.getUid()) {
                    unbannedFrom.setHasJoined(false);
                }
                this.addGroup(unbannedFrom);
            },
            onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                if (userAdded.getUid() == this.loggedInUser?.getUid()) {
                    userAddedIn.setHasJoined(true);
                }
                this.updateGroup(userAddedIn);
            },
            onGroupMemberLeft: (message, leavingUser, group) => {
                if (leavingUser.getUid() == this.loggedInUser?.getUid()) {
                    group.setHasJoined(false);
                }
                this.updateGroup(group);
            },
            onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                if (joinedUser.getUid() == this.loggedInUser?.getUid()) {
                    joinedGroup.setHasJoined(true);
                }
                this.updateGroup(joinedGroup);
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
CometChatGroupsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatGroupsComponent, selector: "cometchat-groups", inputs: { groupsRequestBuilder: "groupsRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", menu: "menu", options: "options", activeGroup: "activeGroup", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", hideError: "hideError", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onSelect: "onSelect", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", groupsStyle: "groupsStyle", listItemStyle: "listItemStyle", onItemClick: "onItemClick" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-groups\" [ngStyle]=\"groupStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"groupsList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-group>\n      <cometchat-list-item [title]=\"group?.name\" [avatarURL]=\"group?.avatar\" [avatarName]=\"group?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(group)\" [statusIndicatorIcon]=\"getGroupIcon(group)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(group)\" [isActive]=\"getActiveGroup(group)\">\n          <div slot=\"subtitleView\" class=\"cc-groups__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n              <ng-container *ngTemplateOutlet=\"subtitleView\">\n              </ng-container>\n          </div>\n          <ng-template #groupSubtitle>\n             <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-groups__subtitle-view\"> {{getMemberCount(group)}} </div>\n          </ng-template>\n\n          <div slot=\"menuView\" class=\"cc-groups__options\" *ngIf=\"options\">\n            <cometchat-menu-list [data]=\"options(group)\">\n\n            </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-groups__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      </cometchat-list-item>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\">\n          <cometchat-radio-button (cc-radio-button-changed)=\"onGroupSelected(group,$event)\"></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n          <cometchat-checkbox (cc-checkbox-changed)=\"onGroupSelected(group,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n  </ng-template>\n</div>", styles: [".cc-groups{height:100%;width:100%;box-sizing:border-box}.cc-groups__tail-view{position:relative}.cc-menus{position:absolute;right:12px;top:6px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-groups", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-groups\" [ngStyle]=\"groupStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"groupsList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-group>\n      <cometchat-list-item [title]=\"group?.name\" [avatarURL]=\"group?.avatar\" [avatarName]=\"group?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(group)\" [statusIndicatorIcon]=\"getGroupIcon(group)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(group)\" [isActive]=\"getActiveGroup(group)\">\n          <div slot=\"subtitleView\" class=\"cc-groups__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n              <ng-container *ngTemplateOutlet=\"subtitleView\">\n              </ng-container>\n          </div>\n          <ng-template #groupSubtitle>\n             <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-groups__subtitle-view\"> {{getMemberCount(group)}} </div>\n          </ng-template>\n\n          <div slot=\"menuView\" class=\"cc-groups__options\" *ngIf=\"options\">\n            <cometchat-menu-list [data]=\"options(group)\">\n\n            </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-groups__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      </cometchat-list-item>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\">\n          <cometchat-radio-button (cc-radio-button-changed)=\"onGroupSelected(group,$event)\"></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n          <cometchat-checkbox (cc-checkbox-changed)=\"onGroupSelected(group,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n  </ng-template>\n</div>", styles: [".cc-groups{height:100%;width:100%;box-sizing:border-box}.cc-groups__tail-view{position:relative}.cc-menus{position:absolute;right:12px;top:6px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdEdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzL2NvbWV0Y2hhdC1ncm91cHMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cHMvY29tZXRjaGF0LWdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSx1QkFBdUIsRUFBcUIsU0FBUyxFQUFFLEtBQUssRUFBaUQsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxXQUFXLEVBQXdCLE1BQU0seUJBQXlCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUd0RSxPQUFPLEVBQW1CLFFBQVEsRUFBRSxvQkFBb0IsRUFBK0MsTUFBTSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQXFELHVCQUF1QixFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3pRLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDOzs7OztBQUMxRTs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyx3QkFBd0I7SUF3RW5DLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUFoRTlFLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBQy9CLGtCQUFhLEdBQWtCLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDbEQsc0JBQWlCLEdBQVcs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eSwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudCwgSW5wdXQsIE9uQ2hhbmdlcywgT25Jbml0LCBTaW1wbGVDaGFuZ2VzLCBUZW1wbGF0ZVJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSAnQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0JztcbmltcG9ydCB7IEdyb3Vwc1N0eWxlLCBMaXN0U3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQXZhdGFyU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IENvbWV0Q2hhdE9wdGlvbiwgbG9jYWxpemUsIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBJR3JvdXBNZW1iZXJBZGRlZCwgSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkLCBTdGF0ZXMsIFRpdGxlQWxpZ25tZW50LCBTZWxlY3Rpb25Nb2RlLCBJR3JvdXBNZW1iZXJKb2luZWQsIElPd25lcnNoaXBDaGFuZ2VkLCBJR3JvdXBMZWZ0LCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgZm9udEhlbHBlciB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvbic7XG4vKipcbipcbiogQ29tZXRDaGF0R3JvdXBzIGlzIGEgd3JhcHBlciBjb21wb25lbnQgd2hpY2ggY29uc2lzdHMgb2YgQ29tZXRDaGF0TGlzdEJhc2VDb21wb25lbnQgYW5kIENvbWV0Q2hhdEdyb3VwTGlzdENvbXBvbmVudC5cbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtZ3JvdXBzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0R3JvdXBzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBncm91cHNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cCkgPT4gQ29tZXRDaGF0T3B0aW9uW10pIHwgbnVsbDtcbiAgQElucHV0KCkgYWN0aXZlR3JvdXAhOiBDb21ldENoYXQuR3JvdXAgfCBudWxsO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJHUk9VUFNcIik7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKGdyb3VwOiBDb21ldENoYXQuR3JvdXAsIHNlbGVjdGVkOiBib29sZWFuKSA9PiB2b2lkO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIHByaXZhdGVHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gIEBJbnB1dCgpIHByb3RlY3RlZEdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvTG9ja2VkLnN2Z1wiO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fR1JPVVBTX0ZPVU5EXCIpXG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQubGVmdDtcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiXG4gIH07XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjMycHhcIixcbiAgICBoZWlnaHQ6IFwiMzJweFwiLFxuICB9O1xuICBASW5wdXQoKSBncm91cHNTdHlsZTogR3JvdXBzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4gdm9pZDtcbiAgZ3JvdXBzUmVxdWVzdDogYW55XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge31cbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHRpbWVvdXQ6IGFueTtcbiAgcHVibGljIGdyb3Vwc0xpc3Q6IENvbWV0Q2hhdC5Hcm91cFtdID0gW107XG4gIHB1YmxpYyBncm91cHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImdyb3Vwc0xpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIHN0YXR1c0NvbG9yOiBhbnkgPSB7XG4gICAgcHJpdmF0ZTogXCJcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiXG4gIH1cbiAgcmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBzUmVxdWVzdDtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTogYW55ID0gbnVsbFxuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVySm9pbmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyS2lja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITogU3Vic2NyaXB0aW9uO1xuICBjY093bmVyc2hpcENoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwQ3JlYXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZyB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpXG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgdGhpcy5mZXRjaE5leHRHcm91cExpc3QoKVxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmdcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpO1xuICB9XG4gIG9uR3JvdXBTZWxlY3RlZChncm91cDogQ29tZXRDaGF0Lkdyb3VwLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQ/LmRldGFpbD8uY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdChncm91cCwgc2VsZWN0ZWQpXG4gICAgfVxuICB9XG4gIC8vIHN1YnNjcmliZSB0byBnbG9iYWwgZXZlbnRzXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cERlbGV0ZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwRGVsZXRlZC5zdWJzY3JpYmUoKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgIHRoaXMucmVtb3ZlR3JvdXAoZ3JvdXApXG4gICAgICBpZiAodGhpcy5hY3RpdmVHcm91cCAmJiBncm91cC5nZXRHdWlkKCkgPT0gdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwQ3JlYXRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBDcmVhdGVkLnN1YnNjcmliZSgoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgdGhpcy5hZGRHcm91cChncm91cClcbiAgICAgIGlmICghdGhpcy5hY3RpdmVHcm91cCkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID0gZ3JvdXBcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckFkZGVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyQWRkZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LnVzZXJBZGRlZEluIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy51c2VyQWRkZWRJbjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LnVzZXJBZGRlZEluISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtPy5raWNrZWRGcm9tISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJKb2luZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJKb2luZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmpvaW5lZEdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy5qb2luZWRHcm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmpvaW5lZEdyb3VwISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LmtpY2tlZEZyb207XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtPy5raWNrZWRGcm9tISlcbiAgICB9KVxuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NPd25lcnNoaXBDaGFuZ2VkLnN1YnNjcmliZSgoaXRlbTogSU93bmVyc2hpcENoYW5nZWQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/Lmdyb3VwIS5nZXRHdWlkKCkpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy5ncm91cDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtPy5ncm91cCEpXG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBMZWZ0ID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICBpZiAoaXRlbS5sZWZ0R3JvdXAuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZSkge1xuICAgICAgICB0aGlzLnJlbW92ZUdyb3VwKGl0ZW0ubGVmdEdyb3VwKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbS5sZWZ0R3JvdXApXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICAvLyB1bnN1YnNjcmliZSB0byBzdWJzY3JpYmVkIGV2ZW50cy5cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBMZWZ0Py51bnN1YnNjcmliZSgpO1xuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gICAgdGhpcy5ncm91cHNSZXF1ZXN0ID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIHVwZGF0ZUdyb3VwKGdyb3VwOiBDb21ldENoYXQuR3JvdXApIHtcbiAgICBsZXQgZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3RdO1xuICAgIC8vc2VhcmNoIGZvciBncm91cFxuICAgIGxldCBncm91cEtleSA9IGdyb3Vwc0xpc3QuZmluZEluZGV4KChnLCBrKSA9PiBnLmdldEd1aWQoKSA9PT0gZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICBpZiAoZ3JvdXBLZXkgPiAtMSkge1xuICAgICAgZ3JvdXBzTGlzdC5zcGxpY2UoZ3JvdXBLZXksIDEsIGdyb3VwKTtcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRHcm91cEljb24gPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGxldCBzdGF0dXM7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIHN0YXR1cyA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzdGF0dXMgPSBudWxsXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXNcbiAgfVxuICBmZXRjaE5ld1VzZXJzKCkge1xuICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKVxuICAgIGxldCBzdGF0ZSA9IHRoaXMuZmlyc3RSZWxvYWQgPyBTdGF0ZXMubG9hZGluZyA6IFN0YXRlcy5sb2FkZWQ7XG4gICAgdGhpcy5mZXRjaE5leHRHcm91cExpc3Qoc3RhdGUpXG4gIH1cbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3VXNlcnMoKVxuICAgICAgICB9LFxuICAgICAgICBpbkNvbm5lY3Rpbmc6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBJbiBjb25uZWN0aW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIGNoYW5nZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGlmIChjaGFuZ2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGNoYW5nZWRHcm91cC5zZXRTY29wZShuZXdTY29wZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVHcm91cChjaGFuZ2VkR3JvdXApXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBraWNrZWRVc2VyOiBDb21ldENoYXQuVXNlciwga2lja2VkQnk6IENvbWV0Q2hhdC5Vc2VyLCBraWNrZWRGcm9tOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBpZiAoa2lja2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGtpY2tlZEZyb20uc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGtpY2tlZEZyb20pXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBiYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlciwgYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLCBiYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBpZiAoYmFubmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlR3JvdXAoYmFubmVkRnJvbSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGJhbm5lZEZyb20pXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyVW5iYW5uZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKHVuYmFubmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVuYmFubmVkRnJvbS5zZXRIYXNKb2luZWQoZmFsc2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuYWRkR3JvdXAodW5iYW5uZWRGcm9tKVxuICAgICAgICB9LFxuICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgdXNlckFkZGVkOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkSW46IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAodXNlckFkZGVkLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgdXNlckFkZGVkSW4uc2V0SGFzSm9pbmVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudXBkYXRlR3JvdXAodXNlckFkZGVkSW4pXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgaWYgKGxlYXZpbmdVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGdyb3VwKVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgam9pbmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGpvaW5lZEdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBpZiAoam9pbmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGpvaW5lZEdyb3VwLnNldEhhc0pvaW5lZCh0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGpvaW5lZEdyb3VwKVxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVHcm91cExpc3RlbmVyKHRoaXMuZ3JvdXBzTGlzdGVuZXJJZCk7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKVxuICB9XG4gIGZldGNoTmV4dEdyb3VwTGlzdCA9IChzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmcpID0+IHtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IG51bGxcbiAgICB0aGlzLnN0YXRlID0gc3RhdGVcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICBpZiAodGhpcy5yZXF1ZXN0QnVpbGRlciAmJiAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpPy5wYWdpbmF0aW9uICYmICgodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24/LmN1cnJlbnRfcGFnZSA9PSAwIHx8ICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbj8uY3VycmVudF9wYWdlICE9ICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi50b3RhbF9wYWdlcykpIHtcbiAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cExpc3RcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuZmV0Y2hOZXh0KCkudGhlbihcbiAgICAgICAgICAoZ3JvdXBMaXN0OiBDb21ldENoYXQuR3JvdXBbXSkgPT4ge1xuICAgICAgICAgICAgaWYgKChncm91cExpc3QubGVuZ3RoIDw9IDAgJiYgdGhpcy5ncm91cHNMaXN0Py5sZW5ndGggPD0gMCkgfHwgKGdyb3VwTGlzdC5sZW5ndGggPT09IDAgJiYgdGhpcy5ncm91cHNMaXN0Py5sZW5ndGggPD0gMCkpIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKHN0YXRlID09IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbLi4uZ3JvdXBMaXN0XVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3QsIC4uLmdyb3VwTGlzdF07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWRcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKClcbiAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3JcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuXG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgb25DbGljayA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soZ3JvdXApXG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgcmV0dXJuICh0aGlzLnN0YXR1c0NvbG9yIGFzIGFueSlbKGdyb3VwPy5nZXRUeXBlKCkgYXMgc3RyaW5nKV07XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIGdldE1lbWJlckNvdW50ID0gKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICByZXR1cm4gZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgPiAxID8gZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgKyBcIiBcIiArIGxvY2FsaXplKFwiTUVNQkVSU1wiKSA6IGdyb3VwLmdldE1lbWJlcnNDb3VudCgpICsgXCIgXCIgKyBsb2NhbGl6ZShcIk1FTUJFUlwiKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRBY3RpdmVHcm91cCA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZSA9PSBTZWxlY3Rpb25Nb2RlLm5vbmUgfHwgIXRoaXMuc2VsZWN0aW9uTW9kZSkge1xuICAgICAgaWYgKGdyb3VwLmdldEd1aWQoKSA9PSB0aGlzLmFjdGl2ZUdyb3VwPy5nZXRHdWlkKCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHNldFJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmICghdGhpcy5ncm91cHNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgIH1cbiAgICBpZiAodGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKVxuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5ncm91cHNSZXF1ZXN0QnVpbGRlci5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZCkuYnVpbGQoKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICByZW1vdmVHcm91cChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgbGV0IGdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0XTtcbiAgICAvL3NlYXJjaCBmb3IgZ3JvdXBcbiAgICBsZXQgZ3JvdXBLZXkgPSBncm91cHNMaXN0LmZpbmRJbmRleCgoZywgaykgPT4gZy5nZXRHdWlkKCkgPT09IGdyb3VwLmdldEd1aWQoKSk7XG4gICAgaWYgKGdyb3VwS2V5ID4gLTEpIHtcbiAgICAgIGdyb3Vwc0xpc3Quc3BsaWNlKGdyb3VwS2V5LCAxKTtcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBhZGRHcm91cFxuICAgKiBAcGFyYW0gZ3JvdXBcbiAgICovXG4gIGFkZEdyb3VwKGdyb3VwOiBDb21ldENoYXQuR3JvdXApIHtcbiAgICB0aGlzLmdyb3Vwc0xpc3QudW5zaGlmdChncm91cCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5XG4gICAqL1xuICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IFtdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0KCk7XG4gICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICB9O1xuICBncm91cFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuZ3JvdXBzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuZ3JvdXBzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmdyb3Vwc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuZ3JvdXBzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmdyb3Vwc1N0eWxlLmJvcmRlclJhZGl1c1xuICAgIH1cbiAgfVxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0R3JvdXBzU3R5bGUoKVxuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpXG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpXG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID0gdGhpcy5ncm91cHNTdHlsZS5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZCA/PyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID0gdGhpcy5ncm91cHNTdHlsZS5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQgPz8gXCIjRjdBNTAwXCI7XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5ncm91cHNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmdyb3Vwc1N0eWxlLmxvYWRpbmdJY29uVGludCxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoQm9yZGVyLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoVGV4dENvbG9yLFxuICAgIH1cbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKClcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgfVxuICB9XG4gIHNldEdyb3Vwc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEdyb3Vwc1N0eWxlID0gbmV3IEdyb3Vwc1N0eWxlKHtcbiAgICAgIHN1YlRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc3ViVGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZDogXCJSR0IoMjQ3LCAxNjUsIDApXCIsXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKVxuICAgIH0pXG4gICAgdGhpcy5ncm91cHNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmdyb3Vwc1N0eWxlIH1cbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmdyb3Vwc1N0eWxlLnN1YlRpdGxlVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5ncm91cHNTdHlsZS5zdWJUaXRsZVRleHRDb2xvclxuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWdyb3Vwc1wiIFtuZ1N0eWxlXT1cImdyb3VwU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cblxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG5cbjwvZGl2PlxuICA8Y29tZXRjaGF0LWxpc3QgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwib25TY3JvbGxlZFRvQm90dG9tXCIgW29uU2VhcmNoXT1cIm9uU2VhcmNoXCJcbiAgICAgIFtsaXN0XT1cImdyb3Vwc0xpc3RcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCIgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiXG4gICAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gIDwvY29tZXRjaGF0LWxpc3Q+XG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWdyb3VwPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cImdyb3VwPy5uYW1lXCIgW2F2YXRhclVSTF09XCJncm91cD8uYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwiZ3JvdXA/Lm5hbWVcIlxuICAgICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgICAgICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJnZXRTdGF0dXNJbmRpY2F0b3JDb2xvcihncm91cClcIiBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJnZXRHcm91cEljb24oZ3JvdXApXCIgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2soZ3JvdXApXCIgW2lzQWN0aXZlXT1cImdldEFjdGl2ZUdyb3VwKGdyb3VwKVwiPlxuICAgICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIGNsYXNzPVwiY2MtZ3JvdXBzX19zdWJ0aXRsZS12aWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXc7ZWxzZSBncm91cFN1YnRpdGxlXCI+XG4gICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNncm91cFN1YnRpdGxlPlxuICAgICAgICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiIGNsYXNzPVwiY2MtZ3JvdXBzX19zdWJ0aXRsZS12aWV3XCI+IHt7Z2V0TWVtYmVyQ291bnQoZ3JvdXApfX0gPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuICAgICAgICAgIDxkaXYgc2xvdD1cIm1lbnVWaWV3XCIgY2xhc3M9XCJjYy1ncm91cHNfX29wdGlvbnNcIiAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnMoZ3JvdXApXCI+XG5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIiBjbGFzcz1cImNjLWdyb3Vwc19fdGFpbC12aWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25Hcm91cFNlbGVjdGVkKGdyb3VwLCRldmVudClcIj48L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5tdWx0aXBsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtY2hlY2tib3ggKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwib25Hcm91cFNlbGVjdGVkKGdyb3VwLCRldmVudClcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvbmctdGVtcGxhdGU+XG48L2Rpdj4iXX0=