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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdEdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzL2NvbWV0Y2hhdC1ncm91cHMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cHMvY29tZXRjaGF0LWdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSx1QkFBdUIsRUFBcUIsU0FBUyxFQUFFLEtBQUssRUFBaUQsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRyxXQUFXLEVBQXlCLE1BQU0seUJBQXlCLENBQUM7QUFDOUUsT0FBTyxFQUFDLFdBQVcsRUFBQyxhQUFhLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQTtBQUduRSxPQUFPLEVBQW1CLFFBQVEsRUFBRSxvQkFBb0IsRUFBK0MsTUFBTSxFQUFFLGNBQWMsRUFBQyxhQUFhLEVBQXFELHVCQUF1QixFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3hRLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDOzs7OztBQUMxRTs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyx3QkFBd0I7SUF3RW5DLFlBQW9CLEdBQXNCLEVBQVMsWUFBa0M7UUFBakUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBUyxpQkFBWSxHQUFaLFlBQVksQ0FBc0I7UUFoRTVFLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBQy9CLGtCQUFhLEdBQWtCLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDbEQsc0JBQWlCLEdBQVcs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QXdCLHVnQ0N2QnJDLHVyRkErQ007NEZEeEJPLHdCQUF3QjtrQkFOcEMsU0FBUzsrQkFDRSxrQkFBa0IsbUJBR1osdUJBQXVCLENBQUMsTUFBTTs0SUFHckMsb0JBQW9CO3NCQUE1QixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNJLE9BQU87c0JBQWhCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBR0csUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFHRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBS0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgIEdyb3Vwc1N0eWxlICwgIExpc3RTdHlsZSwgQmFzZVN0eWxlfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7QXZhdGFyU3R5bGUsTGlzdEl0ZW1TdHlsZX0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZSc7XG5pbXBvcnQgeyBDb21ldENoYXRPcHRpb24sIGxvY2FsaXplLCBDb21ldENoYXRHcm91cEV2ZW50cywgSUdyb3VwTWVtYmVyQWRkZWQsIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCwgU3RhdGVzLCBUaXRsZUFsaWdubWVudCxTZWxlY3Rpb25Nb2RlLCBJR3JvdXBNZW1iZXJKb2luZWQsIElPd25lcnNoaXBDaGFuZ2VkLCBJR3JvdXBMZWZ0LCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgZm9udEhlbHBlciB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvbic7XG4vKipcbipcbiogQ29tZXRDaGF0R3JvdXBzIGlzIGEgd3JhcHBlciBjb21wb25lbnQgd2hpY2ggY29uc2lzdHMgb2YgQ29tZXRDaGF0TGlzdEJhc2VDb21wb25lbnQgYW5kIENvbWV0Q2hhdEdyb3VwTGlzdENvbXBvbmVudC5cbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtZ3JvdXBzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOkNoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRHcm91cHNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgZ3JvdXBzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHNlYXJjaFJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBtZW51ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgIG9wdGlvbnMhOiAoKG1lbWJlcjpDb21ldENoYXQuR3JvdXApPT5Db21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBhY3RpdmVHcm91cCE6IENvbWV0Q2hhdC5Hcm91cCB8IG51bGw7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdST1VQU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcjooZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PnZvaWQgPSAoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgfVxuICBASW5wdXQoKSBvblNlbGVjdCE6IChncm91cDpDb21ldENoYXQuR3JvdXAsc2VsZWN0ZWQ6Ym9vbGVhbik9PnZvaWQ7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjpzdHJpbmcgPVwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gIEBJbnB1dCgpIHByb3RlY3RlZEdyb3VwSWNvbjpzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19HUk9VUFNfRk9VTkRcIilcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgd2lkdGg6IFwiMTJweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCJcbiAgfTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGdyb3Vwc1N0eWxlOiBHcm91cHNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBzZXBhcmF0b3JDb2xvcjogXCJyZ2IoMjIyIDIyMiAyMjIgLyA0NiUpXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHt9O1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6KGdyb3VwOkNvbWV0Q2hhdC5Hcm91cCk9PnZvaWQ7XG4gIGdyb3Vwc1JlcXVlc3Q6IGFueVxuICBsaXN0U3R5bGU6TGlzdFN0eWxlID0ge31cbiAgcHVibGljIGxpbWl0Om51bWJlciA9IDMwO1xuICBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgdGltZW91dDogYW55O1xuICBwdWJsaWMgZ3JvdXBzTGlzdDogQ29tZXRDaGF0Lkdyb3VwW10gPSBbXTtcbiAgcHVibGljIGdyb3Vwc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiZ3JvdXBzTGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICByZXF1ZXN0QnVpbGRlciE6Q29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3Q7XG4gIGZpcnN0UmVsb2FkOmJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgb25TY3JvbGxlZFRvQm90dG9tOmFueSA9IG51bGxcbiAgY2NHcm91cE1lbWJlckFkZGVkITpTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITpTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOlN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6U3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITpTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6U3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwRGVsZXRlZCE6U3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwQ3JlYXRlZCE6U3Vic2NyaXB0aW9uO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYscHJpdmF0ZSB0aGVtZVNlcnZpY2U6Q29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZyB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpXG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgdGhpcy5mZXRjaE5leHRHcm91cExpc3QoKVxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgIH0pLmNhdGNoKChlcnJvcjpDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKT0+e1xuICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nXG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKTtcbiAgfVxuICBvbkdyb3VwU2VsZWN0ZWQoZ3JvdXA6Q29tZXRDaGF0Lkdyb3VwLGV2ZW50OmFueSl7XG4gICAgbGV0IHNlbGVjdGVkOmJvb2xlYW4gPSBldmVudD8uZGV0YWlsPy5jaGVja2VkO1xuICAgIGlmKHRoaXMub25TZWxlY3Qpe1xuICAgICAgdGhpcy5vblNlbGVjdChncm91cCxzZWxlY3RlZClcbiAgICB9XG4gIH1cbiAgICAgIC8vIHN1YnNjcmliZSB0byBnbG9iYWwgZXZlbnRzXG4gICAgICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICAgICAgdGhpcy5jY0dyb3VwRGVsZXRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBEZWxldGVkLnN1YnNjcmliZSgoZ3JvdXA6Q29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVHcm91cChncm91cClcbiAgICAgICAgICBpZih0aGlzLmFjdGl2ZUdyb3VwICYmIGdyb3VwLmdldEd1aWQoKSA9PSB0aGlzLmFjdGl2ZUdyb3VwLmdldEd1aWQoKSl7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIH1cbiAgICAgICB9KVxuICAgICAgIHRoaXMuY2NHcm91cENyZWF0ZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwQ3JlYXRlZC5zdWJzY3JpYmUoKGdyb3VwOkNvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICB0aGlzLmFkZEdyb3VwKGdyb3VwKVxuICAgICAgIGlmKCF0aGlzLmFjdGl2ZUdyb3VwKXtcbiAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPSBncm91cFxuICAgICAgIH1cbiAgICAgfSlcbiAgICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgICAgICAgaWYodGhpcy5hY3RpdmVHcm91cCAmJiB0aGlzLmFjdGl2ZUdyb3VwLmdldEd1aWQoKSA9PSBpdGVtPy51c2VyQWRkZWRJbiEuZ2V0R3VpZCgpKXtcbiAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPT0gaXRlbT8udXNlckFkZGVkSW47XG4gICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtPy51c2VyQWRkZWRJbiEpXG4gICAgICAgfSlcbiAgICAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZSgoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICBpZih0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/LmtpY2tlZEZyb20hLmdldEd1aWQoKSl7XG4gICAgICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICB9XG4gICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmtpY2tlZEZyb20hKVxuICAgICAgIH0pXG4gICAgICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgICAgaWYodGhpcy5hY3RpdmVHcm91cCAmJiB0aGlzLmFjdGl2ZUdyb3VwLmdldEd1aWQoKSA9PSBpdGVtPy5qb2luZWRHcm91cCEuZ2V0R3VpZCgpKXtcbiAgICAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy5qb2luZWRHcm91cDtcbiAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICB9XG4gICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmpvaW5lZEdyb3VwISlcbiAgICAgICB9KVxuICAgICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgIGlmKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKXtcbiAgICAgICAgICAgdGhpcy5hY3RpdmVHcm91cCA9PSBpdGVtPy5raWNrZWRGcm9tO1xuICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgIH1cbiAgICAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbT8ua2lja2VkRnJvbSEpXG4gICAgICAgfSlcbiAgICAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjT3duZXJzaGlwQ2hhbmdlZC5zdWJzY3JpYmUoKGl0ZW06IElPd25lcnNoaXBDaGFuZ2VkKSA9PiB7XG4gICAgICAgICBpZih0aGlzLmFjdGl2ZUdyb3VwICYmIHRoaXMuYWN0aXZlR3JvdXAuZ2V0R3VpZCgpID09IGl0ZW0/Lmdyb3VwIS5nZXRHdWlkKCkpe1xuICAgICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/Lmdyb3VwO1xuICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICB9XG4gICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/Lmdyb3VwISlcbiAgICAgICB9KVxuICAgICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cExlZnQpID0+IHtcbiAgICAgICAgaWYoaXRlbS5sZWZ0R3JvdXAuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZSl7XG4gICAgICAgICAgdGhpcy5yZW1vdmVHcm91cChpdGVtLmxlZnRHcm91cClcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbS5sZWZ0R3JvdXApXG4gICAgICAgIH1cbiAgICAgICB9KVxuICAgICAgfVxuICAgICAgLy8gdW5zdWJzY3JpYmUgdG8gc3Vic2NyaWJlZCBldmVudHMuXG4gICAgICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gICAgdGhpcy5ncm91cHNSZXF1ZXN0ID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIHVwZGF0ZUdyb3VwKGdyb3VwOiBDb21ldENoYXQuR3JvdXApIHtcbiAgICBsZXQgZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3RdO1xuICAgIC8vc2VhcmNoIGZvciBncm91cFxuICAgIGxldCBncm91cEtleSA9IGdyb3Vwc0xpc3QuZmluZEluZGV4KChnLCBrKSA9PiBnLmdldEd1aWQoKSA9PT0gZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICBpZiAoZ3JvdXBLZXkgPiAtMSkge1xuICAgICAgZ3JvdXBzTGlzdC5zcGxpY2UoZ3JvdXBLZXksIDEsIGdyb3VwKTtcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IGdyb3Vwc0xpc3Q7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRHcm91cEljb24gPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGxldCBzdGF0dXM7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgc3RhdHVzID0gdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIHN0YXR1cyA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzdGF0dXMgPSBudWxsXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXNcbiAgfVxuICBmZXRjaE5ld1VzZXJzKCl7XG4gICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpXG4gIGxldCBzdGF0ZSA9IHRoaXMuZmlyc3RSZWxvYWQgPyBTdGF0ZXMubG9hZGluZyA6IFN0YXRlcy5sb2FkZWQ7XG4gIHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0KHN0YXRlKVxuICB9XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKXtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgIG9uQ29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgIHRoaXMuZmV0Y2hOZXdVc2VycygpXG4gICAgICB9LFxuICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgIH0sXG4gICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICB9XG4gIH0pXG4pO1xuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIGNoYW5nZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGlmIChjaGFuZ2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGNoYW5nZWRHcm91cC5zZXRTY29wZShuZXdTY29wZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVHcm91cChjaGFuZ2VkR3JvdXApXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBraWNrZWRVc2VyOiBDb21ldENoYXQuVXNlciwga2lja2VkQnk6IENvbWV0Q2hhdC5Vc2VyLCBraWNrZWRGcm9tOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBpZiAoa2lja2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGtpY2tlZEZyb20uc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGtpY2tlZEZyb20pXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBiYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlciwgYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLCBiYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBpZiAoYmFubmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlR3JvdXAoYmFubmVkRnJvbSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGJhbm5lZEZyb20pXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyVW5iYW5uZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKHVuYmFubmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVuYmFubmVkRnJvbS5zZXRIYXNKb2luZWQoZmFsc2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuYWRkR3JvdXAodW5iYW5uZWRGcm9tKVxuICAgICAgICB9LFxuICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgdXNlckFkZGVkOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkSW46IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAodXNlckFkZGVkLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgdXNlckFkZGVkSW4uc2V0SGFzSm9pbmVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudXBkYXRlR3JvdXAodXNlckFkZGVkSW4pXG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgaWYgKGxlYXZpbmdVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGdyb3VwKVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgam9pbmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGpvaW5lZEdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBpZiAoam9pbmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGpvaW5lZEdyb3VwLnNldEhhc0pvaW5lZCh0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKGpvaW5lZEdyb3VwKVxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVHcm91cExpc3RlbmVyKHRoaXMuZ3JvdXBzTGlzdGVuZXJJZCk7XG4gIH1cbiAgZmV0Y2hOZXh0R3JvdXBMaXN0ID0gKHN0YXRlOlN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsXG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgaWYodGhpcy5yZXF1ZXN0QnVpbGRlciAmJiAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpPy5wYWdpbmF0aW9uICYmICgodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24/LmN1cnJlbnRfcGFnZSA9PSAwIHx8ICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbj8uY3VycmVudF9wYWdlICE9ICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24udG90YWxfcGFnZXMpKXtcbiAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cExpc3RcbiAgICB0cnkge1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAoZ3JvdXBMaXN0OiBDb21ldENoYXQuR3JvdXBbXSkgPT4ge1xuICAgICAgICAgIGlmICgoZ3JvdXBMaXN0Lmxlbmd0aCA8PSAwICYmIHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApIHx8IChncm91cExpc3QubGVuZ3RoID09PSAwICYmIHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZihzdGF0ZSA9PSBTdGF0ZXMubG9hZGVkKXtcbiAgICAgICAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gWy4uLmdyb3VwTGlzdF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgIHRoaXMuZ3JvdXBzTGlzdCA9IFsuLi50aGlzLmdyb3Vwc0xpc3QsIC4uLmdyb3VwTGlzdF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZFxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0aGlzLmZpcnN0UmVsb2FkKXtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpXG4gICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3JcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICkuY2F0Y2goKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG4gICAgICAgIGlmKHRoaXMub25FcnJvcil7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApe1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3JcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcblxuICAgICAgICB9XG5cbiAgICAgIH0pXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICB9XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIGVsc2V7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgb25DbGljayA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgaWYodGhpcy5vbkl0ZW1DbGljayl7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKGdyb3VwKVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgIGdldFN0YXR1c0luZGljYXRvckNvbG9yKGdyb3VwOiBDb21ldENoYXQuR3JvdXApIHtcbiAgICByZXR1cm4gKHRoaXMuc3RhdHVzQ29sb3IgYXMgYW55KVsoZ3JvdXA/LmdldFR5cGUoKSBhcyBzdHJpbmcpXTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgZ2V0TWVtYmVyQ291bnQgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIHJldHVybiBncm91cC5nZXRNZW1iZXJzQ291bnQoKSA+IDEgPyBncm91cC5nZXRNZW1iZXJzQ291bnQoKSArIFwiIFwiICsgbG9jYWxpemUoXCJNRU1CRVJTXCIpIDogZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgKyBcIiBcIiArIGxvY2FsaXplKFwiTUVNQkVSXCIpXG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIGdldEFjdGl2ZUdyb3VwID0gKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgIGlmKHRoaXMuc2VsZWN0aW9uTW9kZSA9PSBTZWxlY3Rpb25Nb2RlLm5vbmUgfHwgIXRoaXMuc2VsZWN0aW9uTW9kZSApe1xuICAgIGlmIChncm91cC5nZXRHdWlkKCkgPT0gdGhpcy5hY3RpdmVHcm91cD8uZ2V0R3VpZCgpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICB9XG4gICBlbHNlIHtcbiAgICAgcmV0dXJuIGZhbHNlXG4gICB9XG4gIH1cbiAgc2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYoIXRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIpe1xuICAgICB0aGlzLmdyb3Vwc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlcigpXG4gICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgfVxuICAgIGlmKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIpe1xuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9ICB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyLmJ1aWxkKClcbiAgICB9XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpLmJ1aWxkKClcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgcmVtb3ZlR3JvdXAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIGdyb3VwXG4gICAgbGV0IGdyb3VwS2V5ID0gZ3JvdXBzTGlzdC5maW5kSW5kZXgoKGcsIGspID0+IGcuZ2V0R3VpZCgpID09PSBncm91cC5nZXRHdWlkKCkpO1xuICAgIGlmIChncm91cEtleSA+IC0xKSB7XG4gICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEtleSwgMSk7XG4gICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogYWRkR3JvdXBcbiAgICogQHBhcmFtIGdyb3VwXG4gICAqL1xuICBhZGRHcm91cChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgdGhpcy5ncm91cHNMaXN0LnVuc2hpZnQoZ3JvdXApO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgIG9uU2VhcmNoID0gKGtleTogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2VhcmNoS2V5d29yZCA9IGtleTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgIHRoaXMuc2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gW107XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgdGhpcy5mZXRjaE5leHRHcm91cExpc3QoKTtcbiAgICAgIH0sIDUwMCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6YW55KSB7XG4gICAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSlcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGdyb3VwU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5ncm91cHNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5ncm91cHNTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuZ3JvdXBzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5ncm91cHNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuZ3JvdXBzU3R5bGUuYm9yZGVyUmFkaXVzXG4gICAgfVxuICB9XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXRHcm91cHNTdHlsZSgpXG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKClcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKClcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKClcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnByaXZhdGUgPSAgdGhpcy5ncm91cHNTdHlsZS5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZCA/PyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID0gdGhpcy5ncm91cHNTdHlsZS5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQgPz8gXCIjRjdBNTAwXCI7XG4gICAgdGhpcy5saXN0U3R5bGUgPXtcbiAgICAgIHRpdGxlVGV4dEZvbnQgOiB0aGlzLmdyb3Vwc1N0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvciA6IHRoaXMuZ3JvdXBzU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQgOiB0aGlzLmdyb3Vwc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3IgOiB0aGlzLmdyb3Vwc1N0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQgOiB0aGlzLmdyb3Vwc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3IgOiB0aGlzLmdyb3Vwc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQgOiB0aGlzLmdyb3Vwc1N0eWxlLmxvYWRpbmdJY29uVGludCxcbiAgICAgIHNlcGFyYXRvckNvbG9yIDogdGhpcy5ncm91cHNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICAgIHNlYXJjaEljb25UaW50IDogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hJY29uVGludCxcbiAgICAgIHNlYXJjaEJvcmRlciA6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoQm9yZGVyLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzIDogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hCb3JkZXJSYWRpdXMsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kIDogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hCYWNrZ3JvdW5kLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCA6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yIDogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcixcbiAgICAgIHNlYXJjaFRleHRGb250IDogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFRleHRDb2xvciA6IHRoaXMuZ3JvdXBzU3R5bGUuc2VhcmNoVGV4dENvbG9yLFxuICAgIH1cbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKVxuICAgIH0pXG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLmxpc3RJdGVtU3R5bGV9XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7Li4uZGVmYXVsdFN0eWxlLC4uLnRoaXMuYXZhdGFyU3R5bGV9XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkJhc2VTdHlsZSA9IHtcbiAgICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgICAgd2lkdGg6XCIxMnB4XCIsXG4gICAgICAgIGJvcmRlcjpcIm5vbmVcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOlwiMjRweFwiLFxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlfVxuICB9XG4gIHNldEdyb3Vwc1N0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpHcm91cHNTdHlsZSA9IG5ldyBHcm91cHNTdHlsZSh7XG4gICAgICBzdWJUaXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YlRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjpgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OmZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kOlwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OmZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OmZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MylcbiAgICB9KVxuICAgIHRoaXMuZ3JvdXBzU3R5bGUgPSB7Li4uZGVmYXVsdFN0eWxlLC4uLnRoaXMuZ3JvdXBzU3R5bGV9XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5ncm91cHNTdHlsZS5zdWJUaXRsZVRleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUuc3ViVGl0bGVUZXh0Q29sb3JcbiAgICB9XG4gIH1cbn0iLCI8ZGl2IGNsYXNzPVwiY2MtZ3JvdXBzXCIgW25nU3R5bGVdPVwiZ3JvdXBTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZW51c1wiICpuZ0lmPVwibWVudVwiPlxuXG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cblxuPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIiBbb25TZWFyY2hdPVwib25TZWFyY2hcIlxuICAgICAgW2xpc3RdPVwiZ3JvdXBzTGlzdFwiIFtzZWFyY2hUZXh0XT1cInNlYXJjaEtleXdvcmRcIiBbc2VhcmNoUGxhY2Vob2xkZXJUZXh0XT1cInNlYXJjaFBsYWNlaG9sZGVyXCJcbiAgICAgIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIiBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCIgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIiBbdGl0bGVdPVwidGl0bGVcIlxuICAgICAgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCIgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIiBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCIgW2Vycm9yU3RhdGVWaWV3XT1cImVycm9yU3RhdGVWaWV3XCIgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIiBbc3RhdGVdPVwic3RhdGVcIj5cbiAgPC9jb21ldGNoYXQtbGlzdD5cbiAgPG5nLXRlbXBsYXRlICNsaXN0SXRlbSBsZXQtZ3JvdXA+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwiZ3JvdXA/Lm5hbWVcIiBbYXZhdGFyVVJMXT1cImdyb3VwPy5hdmF0YXJcIiBbYXZhdGFyTmFtZV09XCJncm91cD8ubmFtZVwiXG4gICAgICAgICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImdldFN0YXR1c0luZGljYXRvckNvbG9yKGdyb3VwKVwiIFtzdGF0dXNJbmRpY2F0b3JJY29uXT1cImdldEdyb3VwSWNvbihncm91cClcIiBbaGlkZVNlcGFyYXRvcl09XCJoaWRlU2VwYXJhdG9yXCIgKGNjLWxpc3RpdGVtLWNsaWNrZWQpPVwib25DbGljayhncm91cClcIiBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlR3JvdXAoZ3JvdXApXCI+XG4gICAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgY2xhc3M9XCJjYy1ncm91cHNfX3N1YnRpdGxlLXZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlldztlbHNlIGdyb3VwU3VidGl0bGVcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2dyb3VwU3VidGl0bGU+XG4gICAgICAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgW25nU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCIgY2xhc3M9XCJjYy1ncm91cHNfX3N1YnRpdGxlLXZpZXdcIj4ge3tnZXRNZW1iZXJDb3VudChncm91cCl9fSA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuXG4gICAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLWdyb3Vwc19fb3B0aW9uc1wiICpuZ0lmPVwib3B0aW9uc1wiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhncm91cClcIj5cblxuICAgICAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiIGNsYXNzPVwiY2MtZ3JvdXBzX190YWlsLXZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGFpbFZpZXdcIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICAgICAgPG5nLXRlbXBsYXRlICN0YWlsVmlldz5cbiAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uIChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJvbkdyb3VwU2VsZWN0ZWQoZ3JvdXAsJGV2ZW50KVwiPjwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbkdyb3VwU2VsZWN0ZWQoZ3JvdXAsJGV2ZW50KVwiPjwvY29tZXRjaGF0LWNoZWNrYm94PlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvZGl2PiJdfQ==