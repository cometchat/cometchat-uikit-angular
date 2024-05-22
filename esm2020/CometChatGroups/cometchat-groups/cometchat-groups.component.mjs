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
CometChatGroupsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatGroupsComponent, selector: "cometchat-groups", inputs: { groupsRequestBuilder: "groupsRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", menu: "menu", options: "options", activeGroup: "activeGroup", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", hideError: "hideError", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onSelect: "onSelect", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", groupsStyle: "groupsStyle", listItemStyle: "listItemStyle", onItemClick: "onItemClick" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-groups\" [ngStyle]=\"groupStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n</div>\n  <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\" [onSearch]=\"onSearch\"\n      [list]=\"groupsList\" [searchText]=\"searchKeyword\" [searchPlaceholderText]=\"searchPlaceholder\"\n      [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\" [hideError]=\"hideError\" [title]=\"title\"\n      [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n  <ng-template #listItem let-group>\n      <cometchat-list-item [title]=\"group?.name\" [avatarURL]=\"group?.avatar\" [avatarName]=\"group?.name\"\n          [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n          [statusIndicatorColor]=\"getStatusIndicatorColor(group)\" [statusIndicatorIcon]=\"getGroupIcon(group)\" [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(group)\" [isActive]=\"getActiveGroup(group)\">\n          <div slot=\"subtitleView\" class=\"cc-groups__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n              <ng-container *ngTemplateOutlet=\"subtitleView\">\n              </ng-container>\n          </div>\n          <ng-template #groupSubtitle>\n             <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-groups__subtitle-view\"> {{getMemberCount(group)}} </div>\n          </ng-template>\n\n          <div slot=\"menuView\" class=\"cc-groups__options\" *ngIf=\"options\">\n            <cometchat-menu-list [data]=\"options(group)\">\n\n            </cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" *ngIf=\"selectionMode != selectionmodeEnum.none\" class=\"cc-groups__tail-view\">\n          <ng-container *ngTemplateOutlet=\"tailView\">\n          </ng-container>\n      </div>\n      </cometchat-list-item>\n      <ng-template #tailView>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.single\">\n          <cometchat-radio-button (cc-radio-button-changed)=\"onGroupSelected(group,$event)\"></cometchat-radio-button>\n\n        </div>\n        <div  *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n          <cometchat-checkbox (cc-checkbox-changed)=\"onGroupSelected(group,$event)\"></cometchat-checkbox>\n\n        </div>\n      </ng-template>\n  </ng-template>\n</div>", styles: [".cc-groups{height:100%;width:100%;box-sizing:border-box}.cc-groups__tail-view{position:relative}.cc-menus{position:absolute;right:12px;top:6px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3Vwcy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdEdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzL2NvbWV0Y2hhdC1ncm91cHMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cHMvY29tZXRjaGF0LWdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSx1QkFBdUIsRUFBcUIsU0FBUyxFQUFFLEtBQUssRUFBaUQsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSxXQUFXLEVBQXdCLE1BQU0seUJBQXlCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUd0RSxPQUFPLEVBQW1CLFFBQVEsRUFBRSxvQkFBb0IsRUFBK0MsTUFBTSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQXFELHVCQUF1QixFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3pRLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDOzs7OztBQUMxRTs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyx3QkFBd0I7SUE4RW5DLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUF0RTlFLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBQy9CLGtCQUFhLEdBQWtCLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDbEQsc0JBQWlCLEdBQVcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFDM0Isa0JBQWEsR0FBVyxtQkFBbUIsQ0FBQztRQUM1QyxlQUFVLEdBQVksS0FBSyxDQUFDO1FBQzVCLFVBQUssR0FBVyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsWUFBTyxHQUFrRCxDQUFDLEtBQW1DLEVBQUUsRUFBRTtZQUN4RyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3BCLENBQUMsQ0FBQTtRQUlRLG1CQUFjLEdBQVcsb0JBQW9CLENBQUM7UUFDOUMscUJBQWdCLEdBQVcsb0JBQW9CLENBQUM7UUFDeEQ7Ozs7VUFJRTtRQUNNLHVCQUFrQixHQUFXLG1CQUFtQixDQUFDO1FBQ2pELHNCQUFpQixHQUF1QixTQUFTLENBQUM7UUFFbEQsbUJBQWMsR0FBVyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUNwRCxtQkFBYyxHQUFXLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JELG1CQUFjLEdBQW1CLGNBQWMsQ0FBQyxJQUFJLENBQUM7UUFDOUQsc0JBQWlCLEdBQXlCLGFBQWEsQ0FBQztRQUNqRCxVQUFLLEdBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUM3Qix5QkFBb0IsR0FBUTtZQUNuQyxNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsWUFBWSxFQUFFLE1BQU07U0FDckIsQ0FBQztRQUNPLGdCQUFXLEdBQWdCO1lBQ2xDLFlBQVksRUFBRSxNQUFNO1lBQ3BCLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07U0FDZixDQUFDO1FBQ08sZ0JBQVcsR0FBZ0I7WUFDbEMsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLGNBQWMsRUFBRSx3QkFBd0I7U0FDekMsQ0FBQztRQUNPLGtCQUFhLEdBQWtCLEVBQUUsQ0FBQztRQUczQyxjQUFTLEdBQWMsRUFBRSxDQUFBO1FBQ2xCLFVBQUssR0FBVyxFQUFFLENBQUM7UUFDMUIsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFFcEIsZUFBVSxHQUFzQixFQUFFLENBQUM7UUFDbkMscUJBQWdCLEdBQVcsYUFBYSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEUsaUJBQVksR0FBMEIsSUFBSSxDQUFDO1FBQzNDLGdCQUFXLEdBQVE7WUFDeEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxRQUFRLEVBQUUsU0FBUztZQUNuQixNQUFNLEVBQUUsRUFBRTtTQUNYLENBQUE7UUFFRCxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUN0Qix5QkFBb0IsR0FBRyxhQUFhLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuRSx1QkFBa0IsR0FBUSxJQUFJLENBQUE7UUEwSDlCOztXQUVHO1FBQ0gsaUJBQVksR0FBRyxDQUFDLEtBQXNCLEVBQUUsRUFBRTtZQUN4QyxJQUFJLE1BQU0sQ0FBQztZQUNYLElBQUksS0FBSyxFQUFFO2dCQUNULFFBQVEsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFO29CQUN2QixLQUFLLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxRQUFRO3dCQUM5QyxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQzt3QkFDM0QsTUFBTTtvQkFDUixLQUFLLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxPQUFPO3dCQUM3QyxNQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO3dCQUMvQixNQUFNO29CQUNSO3dCQUNFLE1BQU0sR0FBRyxJQUFJLENBQUE7d0JBQ2IsTUFBTTtpQkFDVDthQUNGO1lBQ0QsT0FBTyxNQUFNLENBQUE7UUFDZixDQUFDLENBQUE7UUE4RkQsdUJBQWtCLEdBQUcsQ0FBQyxRQUFnQixNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDdEQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtZQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtZQUNsQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFBO1lBQ3hCLElBQUksSUFBSSxDQUFDLGNBQWMsSUFBSyxJQUFJLENBQUMsY0FBc0IsRUFBRSxVQUFVLElBQUksQ0FBRSxJQUFJLENBQUMsY0FBc0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxJQUFJLENBQUMsSUFBSyxJQUFJLENBQUMsY0FBc0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxJQUFLLElBQUksQ0FBQyxjQUFzQixDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDblAsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQTtnQkFDakQsSUFBSTtvQkFDRixJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FDbEMsQ0FBQyxTQUE0QixFQUFFLEVBQUU7d0JBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFOzRCQUN2SCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7NEJBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7eUJBQzFCOzZCQUFNOzRCQUNMLElBQUksS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0NBQzFCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFBOzZCQUNqQztpQ0FDSTtnQ0FDSCxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7NkJBQ3REOzRCQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQTs0QkFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt5QkFDMUI7d0JBQ0QsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFOzRCQUNwQixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQTs0QkFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7eUJBQzFCO29CQUNILENBQUMsRUFDRCxDQUFDLEtBQVUsRUFBRSxFQUFFO3dCQUNiLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTs0QkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO3lCQUN4Qzt3QkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7d0JBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzNCLENBQUMsQ0FDRixDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQW1DLEVBQUUsRUFBRTt3QkFDOUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFOzRCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO3lCQUNwQjt3QkFDRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUMsRUFBRTs0QkFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFBOzRCQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFBO3lCQUV6QjtvQkFFSCxDQUFDLENBQUMsQ0FBQTtpQkFDSDtnQkFBQyxPQUFPLEtBQVUsRUFBRTtvQkFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO3dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7cUJBQ3hDO29CQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQTtvQkFDekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDMUI7YUFDRjtpQkFDSTtnQkFDSCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7YUFDekI7UUFDSCxDQUFDLENBQUE7UUFDRDs7V0FFRztRQUNILFlBQU8sR0FBRyxDQUFDLEtBQXNCLEVBQUUsRUFBRTtZQUNuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDeEI7UUFDSCxDQUFDLENBQUE7UUFPRDs7V0FFRztRQUNILG1CQUFjLEdBQUcsQ0FBQyxLQUFzQixFQUFFLEVBQUU7WUFDMUMsT0FBTyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDL0ksQ0FBQyxDQUFBO1FBQ0Q7O1dBRUc7UUFDSCxtQkFBYyxHQUFHLENBQUMsS0FBc0IsRUFBRSxFQUFFO1lBQzFDLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDbkUsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRTtvQkFDbEQsT0FBTyxJQUFJLENBQUM7aUJBQ2I7cUJBQ0k7b0JBQ0gsT0FBTyxLQUFLLENBQUE7aUJBQ2I7YUFDRjtpQkFDSTtnQkFDSCxPQUFPLEtBQUssQ0FBQTthQUNiO1FBQ0gsQ0FBQyxDQUFBO1FBaUNEOztXQUVHO1FBQ0gsYUFBUSxHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDekIsSUFBSTtnQkFDRixJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQztnQkFDekIsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUM3QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM1QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDVDtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtpQkFDeEM7YUFDRjtRQUNILENBQUMsQ0FBQztRQUNGLGVBQVUsR0FBRyxHQUFHLEVBQUU7WUFDaEIsT0FBTztnQkFDTCxNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNO2dCQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLO2dCQUM3QixVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVO2dCQUN2QyxNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNO2dCQUMvQixZQUFZLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZO2FBQzVDLENBQUE7UUFDSCxDQUFDLENBQUE7UUEyRkQsa0JBQWEsR0FBRyxHQUFHLEVBQUU7WUFDbkIsT0FBTztnQkFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0I7Z0JBQ3ZDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQjthQUMxQyxDQUFBO1FBQ0gsQ0FBQyxDQUFBO1FBM2QwRixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUE7SUFBQyxDQUFDO0lBQ3hILFdBQVcsQ0FBQyxPQUFzQjtJQUNsQyxDQUFDO0lBQ0QsUUFBUTtRQUNOLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUE7UUFDakQsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFBO1FBQ3hCLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUEyQixFQUFFLEVBQUU7WUFDL0QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUE7WUFDekIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBbUMsRUFBRSxFQUFFO1lBQy9DLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUNwQjtRQUNILENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1FBQzNCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBQ0QsZUFBZSxDQUFDLEtBQXNCLEVBQUUsS0FBVTtRQUNoRCxJQUFJLFFBQVEsR0FBWSxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQztRQUMvQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDL0I7SUFDSCxDQUFDO0lBQ0QsNkJBQTZCO0lBQzdCLGlCQUFpQjtRQUNmLElBQUksQ0FBQyxjQUFjLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQXNCLEVBQUUsRUFBRTtZQUM3RixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3ZCLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDckUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7YUFDekI7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxjQUFjLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQXNCLEVBQUUsRUFBRTtZQUM3RixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTthQUN6QjtRQUNILENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQXVCLEVBQUUsRUFBRTtZQUN0RyxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUUsV0FBWSxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUNsRixJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRSxXQUFXLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7YUFDekI7WUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxXQUFZLENBQUMsQ0FBQTtRQUN0QyxDQUFDLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUE4QixFQUFFLEVBQUU7WUFDL0csSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLFVBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDakYsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUUsVUFBVSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFBO2FBQ3pCO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsVUFBVyxDQUFDLENBQUE7UUFDckMsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBd0IsRUFBRSxFQUFFO1lBQ3pHLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRSxXQUFZLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ2xGLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFLFdBQVcsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQTthQUN6QjtZQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFdBQVksQ0FBQyxDQUFBO1FBQ3RDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQThCLEVBQUUsRUFBRTtZQUMvRyxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUUsVUFBVyxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUNqRixJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRSxVQUFVLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7YUFDekI7WUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxVQUFXLENBQUMsQ0FBQTtRQUNyQyxDQUFDLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUF1QixFQUFFLEVBQUU7WUFDdEcsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLEtBQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDNUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUUsS0FBSyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzFCO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBTSxDQUFDLENBQUE7UUFDaEMsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFnQixFQUFFLEVBQUU7WUFDakYsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUU7Z0JBQzFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO2FBQ2pDO2lCQUNJO2dCQUNILElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO2FBQ2pDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBQ0Qsb0NBQW9DO0lBQ3BDLG1CQUFtQjtRQUNqQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUNELFdBQVc7UUFDVCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtRQUMxQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBQ0Q7O09BRUc7SUFDSCxXQUFXLENBQUMsS0FBc0I7UUFDaEMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0QyxrQkFBa0I7UUFDbEIsSUFBSSxRQUFRLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMvRSxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUNqQixVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUMxQjtJQUNILENBQUM7SUFxQkQsYUFBYTtRQUNYLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFBO1FBQ3hCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDOUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ2hDLENBQUM7SUFDRCx5QkFBeUI7UUFDdkIsU0FBUyxDQUFDLHFCQUFxQixDQUM3QixJQUFJLENBQUMsb0JBQW9CLEVBQ3pCLElBQUksU0FBUyxDQUFDLGtCQUFrQixDQUFDO1lBQy9CLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO1lBQ3RCLENBQUM7WUFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUNELGNBQWMsRUFBRSxHQUFHLEVBQUU7Z0JBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztZQUN2RCxDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBQ0QsZUFBZTtRQUNiLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FDeEIsSUFBSSxDQUFDLGdCQUFnQixFQUNyQixJQUFJLFNBQVMsQ0FBQyxhQUFhLENBQUM7WUFDMUIseUJBQXlCLEVBQUUsQ0FDekIsT0FBeUIsRUFDekIsV0FBMkIsRUFDM0IsUUFBb0MsRUFDcEMsUUFBb0MsRUFDcEMsWUFBNkIsRUFDN0IsRUFBRTtnQkFDRixJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUN2RCxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFBO2lCQUNoQztnQkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ2hDLENBQUM7WUFDRCxtQkFBbUIsRUFBRSxDQUFDLE9BQXlCLEVBQUUsVUFBMEIsRUFBRSxRQUF3QixFQUFFLFVBQTJCLEVBQUUsRUFBRTtnQkFDcEksSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDdEQsVUFBVSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQTtpQkFDL0I7Z0JBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM5QixDQUFDO1lBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxPQUF5QixFQUFFLFVBQTBCLEVBQUUsUUFBd0IsRUFBRSxVQUEyQixFQUFFLEVBQUU7Z0JBQ3BJLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3RELElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUE7aUJBQzdCO3FCQUNJO29CQUNILElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUE7aUJBQzdCO1lBQ0gsQ0FBQztZQUNELHFCQUFxQixFQUFFLENBQ3JCLE9BQXlCLEVBQ3pCLFlBQTRCLEVBQzVCLFVBQTBCLEVBQzFCLFlBQTZCLEVBQzdCLEVBQUU7Z0JBQ0YsSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDeEQsWUFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQTtpQkFDakM7Z0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUM3QixDQUFDO1lBQ0Qsb0JBQW9CLEVBQUUsQ0FDcEIsT0FBeUIsRUFDekIsU0FBeUIsRUFDekIsV0FBMkIsRUFDM0IsV0FBNEIsRUFDNUIsRUFBRTtnQkFDRixJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUNyRCxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBO2lCQUMvQjtnQkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQy9CLENBQUM7WUFDRCxpQkFBaUIsRUFBRSxDQUFDLE9BQXlCLEVBQUUsV0FBMkIsRUFBRSxLQUFzQixFQUFFLEVBQUU7Z0JBQ3BHLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3ZELEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7aUJBQzFCO2dCQUNELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDekIsQ0FBQztZQUNELG1CQUFtQixFQUFFLENBQUMsT0FBeUIsRUFBRSxVQUEwQixFQUFFLFdBQTRCLEVBQUUsRUFBRTtnQkFDM0csSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDdEQsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQTtpQkFDL0I7Z0JBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUMvQixDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBQ0QsY0FBYztRQUNaLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNyRCxTQUFTLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUE7SUFDL0QsQ0FBQztJQW1FRDs7T0FFRztJQUNILHVCQUF1QixDQUFDLEtBQXNCO1FBQzVDLE9BQVEsSUFBSSxDQUFDLFdBQW1CLENBQUUsS0FBSyxFQUFFLE9BQU8sRUFBYSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQXVCRCxpQkFBaUI7UUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRTtpQkFDN0QsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7aUJBQ3BCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtTQUN4QztRQUNELElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFBO1NBQ3hEO1FBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFBO0lBQzlGLENBQUM7SUFDRDs7T0FFRztJQUNILFdBQVcsQ0FBQyxLQUFzQjtRQUNoQyxJQUFJLFVBQVUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RDLGtCQUFrQjtRQUNsQixJQUFJLFFBQVEsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDMUI7SUFDSCxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLEtBQXNCO1FBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7SUFDMUIsQ0FBQztJQTZCRCxhQUFhO1FBQ1gsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtRQUNyQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7UUFDckIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdkgsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQywyQkFBMkIsSUFBSSxTQUFTLENBQUM7UUFDdEYsSUFBSSxDQUFDLFNBQVMsR0FBRztZQUNmLGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWE7WUFDN0MsY0FBYyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYztZQUMvQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQjtZQUN2RCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQjtZQUN6RCxrQkFBa0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQjtZQUN2RCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQjtZQUN6RCxlQUFlLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGNBQWMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWM7WUFDL0MsY0FBYyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYztZQUMvQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZO1lBQzNDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsa0JBQWtCO1lBQ3ZELGdCQUFnQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCO1lBQ25ELHlCQUF5QixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMseUJBQXlCO1lBQ3JFLDBCQUEwQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsMEJBQTBCO1lBQ3ZFLGNBQWMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWM7WUFDL0MsZUFBZSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZTtTQUNsRCxDQUFBO0lBQ0gsQ0FBQztJQUNELGdCQUFnQjtRQUNkLElBQUksWUFBWSxHQUFrQixJQUFJLGFBQWEsQ0FBQztZQUNsRCxNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDM0QsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNoRSxZQUFZLEVBQUUsR0FBRztZQUNqQixTQUFTLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDaEUsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDdkQsTUFBTSxFQUFFLE1BQU07WUFDZCxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM5RCxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtTQUMvRCxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUE7SUFDakUsQ0FBQztJQUNELGNBQWM7UUFDWixJQUFJLFlBQVksR0FBZ0IsSUFBSSxXQUFXLENBQUM7WUFDOUMsWUFBWSxFQUFFLE1BQU07WUFDcEIsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxNQUFNO1lBQ2QsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDL0QsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDN0QsY0FBYyxFQUFFLE9BQU87WUFDdkIsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBRXRFLHNCQUFzQixFQUFFLEVBQUU7U0FDM0IsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzdELENBQUM7SUFDRCxjQUFjO1FBQ1osSUFBSSxZQUFZLEdBQWM7WUFDNUIsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxNQUFNO1lBQ2QsWUFBWSxFQUFFLE1BQU07U0FDckIsQ0FBQTtRQUNELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUE7SUFDL0UsQ0FBQztJQUNELGNBQWM7UUFDWixJQUFJLFlBQVksR0FBZ0IsSUFBSSxXQUFXLENBQUM7WUFDOUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDMUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNqRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUMzRCxNQUFNLEVBQUUsYUFBYSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDcEUsYUFBYSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ3BFLGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQzNELGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ3pFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDbkUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDekUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNuRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUMvRCxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM5RCwwQkFBMEIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQ3hFLDJCQUEyQixFQUFFLGtCQUFrQjtZQUMvQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM5RCwwQkFBMEIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDaEUseUJBQXlCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDL0UsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDL0QsY0FBYyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1NBQ3JFLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUM3RCxDQUFDOztzSEFuaUJVLHdCQUF3QjswR0FBeEIsd0JBQXdCLCtpQ0N2QnJDLHVyRkErQ007NEZEeEJPLHdCQUF3QjtrQkFOcEMsU0FBUzsrQkFDRSxrQkFBa0IsbUJBR1gsdUJBQXVCLENBQUMsTUFBTTs0SUFHdEMsb0JBQW9CO3NCQUE1QixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFHRyxRQUFRO3NCQUFoQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFNRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFHRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBS0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgR3JvdXBzU3R5bGUsIExpc3RTdHlsZSwgQmFzZVN0eWxlIH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgTGlzdEl0ZW1TdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgQ29tZXRDaGF0T3B0aW9uLCBsb2NhbGl6ZSwgQ29tZXRDaGF0R3JvdXBFdmVudHMsIElHcm91cE1lbWJlckFkZGVkLCBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsIFN0YXRlcywgVGl0bGVBbGlnbm1lbnQsIFNlbGVjdGlvbk1vZGUsIElHcm91cE1lbWJlckpvaW5lZCwgSU93bmVyc2hpcENoYW5nZWQsIElHcm91cExlZnQsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBmb250SGVscGVyIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uJztcbi8qKlxuKlxuKiBDb21ldENoYXRHcm91cHMgaXMgYSB3cmFwcGVyIGNvbXBvbmVudCB3aGljaCBjb25zaXN0cyBvZiBDb21ldENoYXRMaXN0QmFzZUNvbXBvbmVudCBhbmQgQ29tZXRDaGF0R3JvdXBMaXN0Q29tcG9uZW50LlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1ncm91cHNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtZ3JvdXBzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRHcm91cHNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGdyb3Vwc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzZWFyY2hSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOiAoKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBhY3RpdmVHcm91cCE6IENvbWV0Q2hhdC5Hcm91cCB8IG51bGw7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdST1VQU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25TZWxlY3QhOiAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCwgc2VsZWN0ZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKiBcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAgKi9cbiAgQElucHV0KCkgcHJvdGVjdGVkR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHBhc3N3b3JkR3JvdXBJY29uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19HUk9VUFNfRk9VTkRcIilcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgd2lkdGg6IFwiMTJweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCJcbiAgfTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGdyb3Vwc1N0eWxlOiBHcm91cHNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBzZXBhcmF0b3JDb2xvcjogXCJyZ2IoMjIyIDIyMiAyMjIgLyA0NiUpXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHt9O1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB2b2lkO1xuICBncm91cHNSZXF1ZXN0OiBhbnlcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSB7fVxuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgdGltZW91dDogYW55O1xuICBwdWJsaWMgZ3JvdXBzTGlzdDogQ29tZXRDaGF0Lkdyb3VwW10gPSBbXTtcbiAgcHVibGljIGdyb3Vwc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiZ3JvdXBzTGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCJcbiAgfVxuICByZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0O1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29ubmVjdGlvbkxpc3RlbmVySWQgPSBcImNvbm5lY3Rpb25fXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsXG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cERlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBDcmVhdGVkITogU3Vic2NyaXB0aW9uO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cExpc3RcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKClcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICB0aGlzLmZldGNoTmV4dEdyb3VwTGlzdCgpXG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZ1xuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKCk7XG4gIH1cbiAgb25Hcm91cFNlbGVjdGVkKGdyb3VwOiBDb21ldENoYXQuR3JvdXAsIGV2ZW50OiBhbnkpIHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudD8uZGV0YWlsPy5jaGVja2VkO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KGdyb3VwLCBzZWxlY3RlZClcbiAgICB9XG4gIH1cbiAgLy8gc3Vic2NyaWJlIHRvIGdsb2JhbCBldmVudHNcbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwRGVsZXRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBEZWxldGVkLnN1YnNjcmliZSgoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgdGhpcy5yZW1vdmVHcm91cChncm91cClcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUdyb3VwICYmIGdyb3VwLmdldEd1aWQoKSA9PSB0aGlzLmFjdGl2ZUdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLmNjR3JvdXBDcmVhdGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cENyZWF0ZWQuc3Vic2NyaWJlKChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICB0aGlzLmFkZEdyb3VwKGdyb3VwKVxuICAgICAgaWYgKCF0aGlzLmFjdGl2ZUdyb3VwKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPSBncm91cFxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8udXNlckFkZGVkSW4hLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LnVzZXJBZGRlZEluO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbT8udXNlckFkZGVkSW4hKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmtpY2tlZEZyb20hKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckpvaW5lZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlckpvaW5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uam9pbmVkR3JvdXAhLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/LmpvaW5lZEdyb3VwO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlR3JvdXAoaXRlbT8uam9pbmVkR3JvdXAhKVxuICAgIH0pXG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8ua2lja2VkRnJvbSEuZ2V0R3VpZCgpKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlR3JvdXAgPT0gaXRlbT8ua2lja2VkRnJvbTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/LmtpY2tlZEZyb20hKVxuICAgIH0pXG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY093bmVyc2hpcENoYW5nZWQuc3Vic2NyaWJlKChpdGVtOiBJT3duZXJzaGlwQ2hhbmdlZCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlR3JvdXAgJiYgdGhpcy5hY3RpdmVHcm91cC5nZXRHdWlkKCkgPT0gaXRlbT8uZ3JvdXAhLmdldEd1aWQoKSkge1xuICAgICAgICB0aGlzLmFjdGl2ZUdyb3VwID09IGl0ZW0/Lmdyb3VwO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwKGl0ZW0/Lmdyb3VwISlcbiAgICB9KVxuICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoKGl0ZW06IElHcm91cExlZnQpID0+IHtcbiAgICAgIGlmIChpdGVtLmxlZnRHcm91cC5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlR3JvdXAoaXRlbS5sZWZ0R3JvdXApXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy51cGRhdGVHcm91cChpdGVtLmxlZnRHcm91cClcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIC8vIHVuc3Vic2NyaWJlIHRvIHN1YnNjcmliZWQgZXZlbnRzLlxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKClcbiAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgdXBkYXRlR3JvdXAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIGdyb3VwXG4gICAgbGV0IGdyb3VwS2V5ID0gZ3JvdXBzTGlzdC5maW5kSW5kZXgoKGcsIGspID0+IGcuZ2V0R3VpZCgpID09PSBncm91cC5nZXRHdWlkKCkpO1xuICAgIGlmIChncm91cEtleSA+IC0xKSB7XG4gICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEtleSwgMSwgZ3JvdXApO1xuICAgICAgdGhpcy5ncm91cHNMaXN0ID0gZ3JvdXBzTGlzdDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIGdldEdyb3VwSWNvbiA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgbGV0IHN0YXR1cztcbiAgICBpZiAoZ3JvdXApIHtcbiAgICAgIHN3aXRjaCAoZ3JvdXAuZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBzdGF0dXMgPSB0aGlzLnBhc3N3b3JkR3JvdXBJY29uIHx8IHRoaXMucHJvdGVjdGVkR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZTpcbiAgICAgICAgICBzdGF0dXMgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgc3RhdHVzID0gbnVsbFxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RhdHVzXG4gIH1cbiAgZmV0Y2hOZXdVc2VycygpIHtcbiAgICB0aGlzLnNldFJlcXVlc3RCdWlsZGVyKClcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmZpcnN0UmVsb2FkID8gU3RhdGVzLmxvYWRpbmcgOiBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0KHN0YXRlKVxuICB9XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENvbm5lY3Rpb25MaXN0ZW5lcihcbiAgICAgIHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNvbm5lY3Rpb25MaXN0ZW5lcih7XG4gICAgICAgIG9uQ29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT5jb25uZWN0ZWRcIik7XG4gICAgICAgICAgdGhpcy5mZXRjaE5ld1VzZXJzKClcbiAgICAgICAgfSxcbiAgICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICB0aGlzLmdyb3Vwc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAoY2hhbmdlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICBjaGFuZ2VkR3JvdXAuc2V0U2NvcGUobmV3U2NvcGUpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudXBkYXRlR3JvdXAoY2hhbmdlZEdyb3VwKVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlciwga2lja2VkRnJvbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgaWYgKGtpY2tlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICBraWNrZWRGcm9tLnNldEhhc0pvaW5lZChmYWxzZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVHcm91cChraWNrZWRGcm9tKVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsIGJhbm5lZEJ5OiBDb21ldENoYXQuVXNlciwgYmFubmVkRnJvbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgaWYgKGJhbm5lZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUdyb3VwKGJhbm5lZEZyb20pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVHcm91cChiYW5uZWRGcm9tKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlclVuYmFubmVkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICB1bmJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVuYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVuYmFubmVkRnJvbTogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGlmICh1bmJhbm5lZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICB1bmJhbm5lZEZyb20uc2V0SGFzSm9pbmVkKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmFkZEdyb3VwKHVuYmFubmVkRnJvbSlcbiAgICAgICAgfSxcbiAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKHVzZXJBZGRlZC5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVzZXJBZGRlZEluLnNldEhhc0pvaW5lZCh0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUdyb3VwKHVzZXJBZGRlZEluKVxuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyTGVmdDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGxlYXZpbmdVc2VyOiBDb21ldENoYXQuVXNlciwgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGlmIChsZWF2aW5nVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGdyb3VwLnNldEhhc0pvaW5lZChmYWxzZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVHcm91cChncm91cClcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGpvaW5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBqb2luZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgaWYgKGpvaW5lZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICBqb2luZWRHcm91cC5zZXRIYXNKb2luZWQodHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVHcm91cChqb2luZWRHcm91cClcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3Vwc0xpc3RlbmVySWQpO1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZClcbiAgfVxuICBmZXRjaE5leHRHcm91cExpc3QgPSAoc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsXG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgaWYgKHRoaXMucmVxdWVzdEJ1aWxkZXIgJiYgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KT8ucGFnaW5hdGlvbiAmJiAoKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uPy5jdXJyZW50X3BhZ2UgPT0gMCB8fCAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24/LmN1cnJlbnRfcGFnZSAhPSAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24udG90YWxfcGFnZXMpKSB7XG4gICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0R3JvdXBMaXN0XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLmZldGNoTmV4dCgpLnRoZW4oXG4gICAgICAgICAgKGdyb3VwTGlzdDogQ29tZXRDaGF0Lkdyb3VwW10pID0+IHtcbiAgICAgICAgICAgIGlmICgoZ3JvdXBMaXN0Lmxlbmd0aCA8PSAwICYmIHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApIHx8IChncm91cExpc3QubGVuZ3RoID09PSAwICYmIHRoaXMuZ3JvdXBzTGlzdD8ubGVuZ3RoIDw9IDApKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChzdGF0ZSA9PSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHNMaXN0ID0gWy4uLmdyb3VwTGlzdF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbLi4udGhpcy5ncm91cHNMaXN0LCAuLi5ncm91cExpc3RdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkXG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpXG4gICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgKS5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmdyb3Vwc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yXG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcblxuICAgICAgICAgIH1cblxuICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvclxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXBcbiAgICovXG4gIG9uQ2xpY2sgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKGdyb3VwKVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIHJldHVybiAodGhpcy5zdGF0dXNDb2xvciBhcyBhbnkpWyhncm91cD8uZ2V0VHlwZSgpIGFzIHN0cmluZyldO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwXG4gICAqL1xuICBnZXRNZW1iZXJDb3VudCA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgcmV0dXJuIGdyb3VwLmdldE1lbWJlcnNDb3VudCgpID4gMSA/IGdyb3VwLmdldE1lbWJlcnNDb3VudCgpICsgXCIgXCIgKyBsb2NhbGl6ZShcIk1FTUJFUlNcIikgOiBncm91cC5nZXRNZW1iZXJzQ291bnQoKSArIFwiIFwiICsgbG9jYWxpemUoXCJNRU1CRVJcIilcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgZ2V0QWN0aXZlR3JvdXAgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIGlmIChncm91cC5nZXRHdWlkKCkgPT0gdGhpcy5hY3RpdmVHcm91cD8uZ2V0R3VpZCgpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICBzZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAoIXRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICB9XG4gICAgaWYgKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyLmJ1aWxkKClcbiAgICB9XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuZ3JvdXBzUmVxdWVzdEJ1aWxkZXIuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpLmJ1aWxkKClcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cFxuICAgKi9cbiAgcmVtb3ZlR3JvdXAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBncm91cHNMaXN0ID0gWy4uLnRoaXMuZ3JvdXBzTGlzdF07XG4gICAgLy9zZWFyY2ggZm9yIGdyb3VwXG4gICAgbGV0IGdyb3VwS2V5ID0gZ3JvdXBzTGlzdC5maW5kSW5kZXgoKGcsIGspID0+IGcuZ2V0R3VpZCgpID09PSBncm91cC5nZXRHdWlkKCkpO1xuICAgIGlmIChncm91cEtleSA+IC0xKSB7XG4gICAgICBncm91cHNMaXN0LnNwbGljZShncm91cEtleSwgMSk7XG4gICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBncm91cHNMaXN0O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogYWRkR3JvdXBcbiAgICogQHBhcmFtIGdyb3VwXG4gICAqL1xuICBhZGRHcm91cChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgdGhpcy5ncm91cHNMaXN0LnVuc2hpZnQoZ3JvdXApO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgb25TZWFyY2ggPSAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5zZWFyY2hLZXl3b3JkID0ga2V5O1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLmZldGNoTmV4dEdyb3VwTGlzdCgpO1xuICAgICAgfSwgNTAwKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgZ3JvdXBTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmdyb3Vwc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLmdyb3Vwc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5ncm91cHNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmdyb3Vwc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5ncm91cHNTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEdyb3Vwc1N0eWxlKClcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKVxuICAgIHRoaXMuc3RhdHVzQ29sb3IucHJpdmF0ZSA9IHRoaXMuZ3JvdXBzU3R5bGUucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQgPz8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wYXNzd29yZCA9IHRoaXMuZ3JvdXBzU3R5bGUucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kID8/IFwiI0Y3QTUwMFwiO1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5ncm91cHNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMuZ3JvdXBzU3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy5ncm91cHNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEljb25UaW50LFxuICAgICAgc2VhcmNoQm9yZGVyOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEJvcmRlcixcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hCb3JkZXJSYWRpdXMsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaEJhY2tncm91bmQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy5ncm91cHNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcixcbiAgICAgIHNlYXJjaFRleHRGb250OiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFRleHRGb250LFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLmdyb3Vwc1N0eWxlLnNlYXJjaFRleHRDb2xvcixcbiAgICB9XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpXG4gICAgfSlcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH1cbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlIH1cbiAgfVxuICBzZXRHcm91cHNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBHcm91cHNTdHlsZSA9IG5ldyBHcm91cHNTdHlsZSh7XG4gICAgICBzdWJUaXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YlRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MylcbiAgICB9KVxuICAgIHRoaXMuZ3JvdXBzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5ncm91cHNTdHlsZSB9XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5ncm91cHNTdHlsZS5zdWJUaXRsZVRleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuZ3JvdXBzU3R5bGUuc3ViVGl0bGVUZXh0Q29sb3JcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1ncm91cHNcIiBbbmdTdHlsZV09XCJncm91cFN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG5cbiAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuXG48L2Rpdj5cbiAgPGNvbWV0Y2hhdC1saXN0IFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiIFtvblNlYXJjaF09XCJvblNlYXJjaFwiXG4gICAgICBbbGlzdF09XCJncm91cHNMaXN0XCIgW3NlYXJjaFRleHRdPVwic2VhcmNoS2V5d29yZFwiIFtzZWFyY2hQbGFjZWhvbGRlclRleHRdPVwic2VhcmNoUGxhY2Vob2xkZXJcIlxuICAgICAgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIiBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgICBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIiBbbG9hZGluZ0ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIlxuICAgICAgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCIgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiXG4gICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiIFtzdGF0ZV09XCJzdGF0ZVwiPlxuICA8L2NvbWV0Y2hhdC1saXN0PlxuICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1ncm91cD5cbiAgICAgIDxjb21ldGNoYXQtbGlzdC1pdGVtIFt0aXRsZV09XCJncm91cD8ubmFtZVwiIFthdmF0YXJVUkxdPVwiZ3JvdXA/LmF2YXRhclwiIFthdmF0YXJOYW1lXT1cImdyb3VwPy5uYW1lXCJcbiAgICAgICAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCIgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICAgICAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXApXCIgW3N0YXR1c0luZGljYXRvckljb25dPVwiZ2V0R3JvdXBJY29uKGdyb3VwKVwiIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkNsaWNrKGdyb3VwKVwiIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVHcm91cChncm91cClcIj5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWdyb3Vwc19fc3VidGl0bGUtdmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgZ3JvdXBTdWJ0aXRsZVwiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjZ3JvdXBTdWJ0aXRsZT5cbiAgICAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBbbmdTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIiBjbGFzcz1cImNjLWdyb3Vwc19fc3VidGl0bGUtdmlld1wiPiB7e2dldE1lbWJlckNvdW50KGdyb3VwKX19IDwvZGl2PlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG5cbiAgICAgICAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiIGNsYXNzPVwiY2MtZ3JvdXBzX19vcHRpb25zXCIgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbZGF0YV09XCJvcHRpb25zKGdyb3VwKVwiPlxuXG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiICpuZ0lmPVwic2VsZWN0aW9uTW9kZSAhPSBzZWxlY3Rpb25tb2RlRW51bS5ub25lXCIgY2xhc3M9XCJjYy1ncm91cHNfX3RhaWwtdmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1yYWRpby1idXR0b24gKGNjLXJhZGlvLWJ1dHRvbi1jaGFuZ2VkKT1cIm9uR3JvdXBTZWxlY3RlZChncm91cCwkZXZlbnQpXCI+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2ICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWNoZWNrYm94IChjYy1jaGVja2JveC1jaGFuZ2VkKT1cIm9uR3JvdXBTZWxlY3RlZChncm91cCwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICA8L25nLXRlbXBsYXRlPlxuPC9kaXY+Il19