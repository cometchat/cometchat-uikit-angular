import { Component, Input, ChangeDetectionStrategy, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, ListItemStyle, ChangeScopeStyle, MenuListStyle, } from "@cometchat/uikit-elements";
import { GroupMemberUtils, GroupMembersStyle, CometChatUIKitUtility, } from "@cometchat/uikit-shared";
import { fontHelper, localize, CometChatGroupEvents, CometChatUIKitConstants, SelectionMode, States, TitleAlignment, UserPresencePlacement, } from "@cometchat/uikit-resources";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatList/cometchat-list.component";
import * as i3 from "@angular/common";
/**
 *
 *  CometChatGroupMembersComponent is used to render list of group members
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export class CometChatGroupMembersComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.disableUsersPresence = false;
        this.backButtonIconURL = "assets/backbutton.svg";
        this.closeButtonIconURL = "assets/close2x.svg";
        this.showBackButton = true;
        this.hideSeparator = false;
        this.selectionMode = SelectionMode.none;
        this.searchPlaceholder = "Search Members";
        this.searchIconURL = "assets/search.svg";
        this.hideSearch = true;
        this.title = localize("MEMBERS");
        this.onError = (error) => {
            console.log(error);
        };
        this.backdropStyle = {
            height: "100%",
            width: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
        };
        this.loadingIconURL = "assets/Spinner.svg";
        this.emptyStateText = localize("NO_GROUPS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.titleAlignment = TitleAlignment.center;
        this.dropdownIconURL = "assets/down-arrow.svg";
        this.statusIndicatorStyle = {
            height: "10px",
            width: "10px",
            borderRadius: "16px",
            border: "",
        };
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.groupMembersStyle = {
            width: "100%",
            height: "100%",
            border: "",
            borderRadius: "",
        };
        this.groupScopeStyle = new ChangeScopeStyle({
            height: "200px",
            width: "280px",
        });
        this.listItemStyle = {
            height: "100%",
            width: "100%",
            background: "",
            activeBackground: "transparent",
            borderRadius: "grey",
            titleFont: "",
            titleColor: "",
            border: "",
            hoverBackground: "transparent",
            separatorColor: "rgba(222 222 222 / 46%)",
        };
        this.userPresencePlacement = UserPresencePlacement.bottom;
        this.disableLoadingState = false;
        this.listStyle = {};
        this.menuListStyle = {
            width: "",
            height: "",
            border: "none",
            borderRadius: "8px",
            background: "white",
            submenuWidth: "100%",
            submenuHeight: "100%",
            submenuBorder: "1px solid #e8e8e8",
            submenuBorderRadius: "8px",
            submenuBackground: "white",
            moreIconTint: "rgb(51, 153, 255)",
        };
        this.modalStyle = {
            height: "212px",
            width: "360px",
            background: "white",
            borderRadius: "12px",
            border: "none",
        };
        this.limit = 30;
        this.moreIconURL = "assets/moreicon.svg";
        this.searchKeyword = "";
        this.onScrolledToBottom = null;
        this.isString = (data) => typeof data == "string";
        this.isArray = (data) => typeof data == "object" && data?.length > 0;
        this.getOptions = (member) => {
            let options = GroupMemberUtils.getViewMemberOptions(member, this.group, this.loggedInUser?.getUid(), this.themeService.theme);
            return options;
        };
        this.titleAlignmentEnum = TitleAlignment;
        this.selectionmodeEnum = SelectionMode;
        this.state = States.loading;
        this.groupMembers = [];
        this.scopes = [];
        this.membersListenerId = "memberlist_" + new Date().getTime();
        this.changeScope = false;
        this.fetchingGroups = false;
        this.previousSearchKeyword = "";
        this.memberScope = [];
        this.membersList = [];
        this.onClick = (groupMember) => {
            if (this.onItemClick) {
                this.onItemClick(groupMember);
            }
        };
        this.searchKeyWordUpdated = () => {
            if (this.fetchingGroups) {
                clearTimeout(this.fetchTimeOut);
                this.fetchTimeOut = setTimeout(() => {
                    this.searchForGroupMembers();
                }, 800);
            }
            else {
                this.searchForGroupMembers();
            }
        };
        this.searchForGroupMembers = () => {
            const request = this.searchRequestBuilder
                ? this.searchRequestBuilder.setSearchKeyword(this.searchKeyword).build()
                : this.getRequestBuilder();
            this.groupsRequest = request;
            if (!this.disableLoadingState) {
                this.groupMembers = [];
            }
            this.fetchNextGroupMembers();
        };
        /**
         * @param  {CometChat.GroupMember} member
         */
        this.getStatusIndicatorColor = (member) => {
            if (!this.disableUsersPresence) {
                if (member?.getStatus() == CometChatUIKitConstants.userStatusType.online) {
                    return (this.groupMembersStyle.onlineStatusColor ||
                        this.themeService.theme.palette.getSuccess());
                }
                else {
                    return null;
                }
            }
            return null;
        };
        this.handleMenuAction = (menu, groupMember) => {
            if (menu?.detail?.data?.onClick) {
                menu?.detail?.data?.onClick(groupMember);
                return;
            }
            let id = menu?.detail?.data?.id;
            this.selectedMember = groupMember;
            this.memberScope = GroupMemberUtils.allowScopeChange(this.group, groupMember);
            if (id == CometChatUIKitConstants.GroupMemberOptions.changeScope) {
                this.changeScope = true;
                this.scopes = [];
            }
            else if (id == CometChatUIKitConstants.GroupMemberOptions.ban) {
                this.changeScope = false;
                this.blockMember(groupMember);
            }
            else if (id == CometChatUIKitConstants.GroupMemberOptions.kick) {
                this.kickMember(groupMember);
            }
        };
        this.blockMember = (member) => {
            CometChat.banGroupMember(this.group.getGuid(), member.getUid()).then(() => {
                this.group.setMembersCount(this.group.getMembersCount() - 1);
                this.addRemoveMember(member);
                CometChatGroupEvents.ccGroupMemberBanned.next({
                    kickedBy: this.loggedInUser,
                    kickedFrom: this.group,
                    kickedUser: member,
                    message: this.createActionMessage(member, CometChatUIKitConstants.groupMemberAction.BANNED),
                });
            });
        };
        this.kickMember = (member) => {
            CometChat.kickGroupMember(this.group.getGuid(), member.getUid())
                .then(() => {
                this.group.setMembersCount(this.group.getMembersCount() - 1);
                this.addRemoveMember(member);
                CometChatGroupEvents.ccGroupMemberKicked.next({
                    kickedBy: this.loggedInUser,
                    kickedFrom: this.group,
                    kickedUser: member,
                    message: this.createActionMessage(member, CometChatUIKitConstants.groupMemberAction.KICKED),
                });
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
        };
        /**
         * @param  {CometChat.User} member
         */
        this.updateMemberStatus = (member) => {
            let memberlist = [...this.groupMembers];
            //search for user
            let userKey = memberlist.findIndex((u, k) => u.getUid() == member.getUid());
            //if found in the list, update user object
            if (userKey > -1) {
                let user = memberlist[userKey];
                user.setStatus(member.getStatus());
                memberlist.splice(userKey, 1, user);
                this.groupMembers = [...memberlist];
                this.ref.detectChanges();
            }
        };
        this.updateMember = (member) => {
            let memberlist = [...this.groupMembers];
            //search for user
            let userKey = memberlist.findIndex((u, k) => u.getUid() == member.getUid());
            //if found in the list, update user object
            if (userKey > -1) {
                let user = memberlist[userKey];
                memberlist.splice(userKey, 1, user);
                this.groupMembers = [...memberlist];
                this.ref.detectChanges();
            }
        };
        this.addRemoveMember = (member) => {
            let memberlist = [...this.groupMembers];
            //search for user
            let memberKey = memberlist.findIndex((u, k) => u.getUid() == member.getUid());
            //if found in the list, update user object
            if (memberKey > -1) {
                memberlist.splice(memberKey, 1);
                this.groupMembers = [...memberlist];
                this.ref.detectChanges();
            }
            else {
                this.groupMembers.push(member);
                this.ref.detectChanges();
            }
        };
        this.fetchNextGroupMembers = () => {
            this.onScrolledToBottom = null;
            if (this.groupsRequest &&
                this.groupsRequest.pagination &&
                (this.groupsRequest.pagination.current_page == 0 ||
                    this.groupsRequest.pagination.current_page !=
                        this.groupsRequest.pagination.total_pages)) {
                this.fetchingGroups = true;
                this.onScrolledToBottom = this.fetchNextGroupMembers;
                try {
                    this.groupsRequest.fetchNext().then((groupMembers) => {
                        if (!this.disableLoadingState) {
                            this.state = States.loading;
                        }
                        if (groupMembers.length <= 0) {
                            if (this.onEmpty) {
                                this.onEmpty();
                                this.previousSearchKeyword = '';
                            }
                        }
                        if (groupMembers.length <= 0 &&
                            (this.groupMembers?.length <= 0)) {
                            this.state = States.empty;
                            this.ref.detectChanges();
                        }
                        else {
                            if (!this.disableLoadingState) {
                                this.groupMembers = [...this.groupMembers, ...groupMembers];
                            }
                            else {
                                if (this.searchKeyword != this.previousSearchKeyword ||
                                    [0, 1].includes(this.groupsRequest.pagination.current_page)) {
                                    this.previousSearchKeyword = this.searchKeyword;
                                    this.groupMembers = groupMembers;
                                }
                                else {
                                    this.groupMembers = [...this.groupMembers, ...groupMembers];
                                }
                            }
                            this.state = States.loaded;
                            this.ref.detectChanges();
                        }
                        this.fetchingGroups = false;
                        this.previousSearchKeyword = this.searchKeyword;
                    }, (error) => {
                        if (this.onError) {
                            this.onError(CometChatException(error));
                        }
                        this.state = States.error;
                        this.ref.detectChanges();
                        this.fetchingGroups = false;
                    });
                }
                catch (error) {
                    if (this.onError) {
                        this.onError(CometChatException(error));
                    }
                    this.state = States.error;
                    this.ref.detectChanges();
                    this.fetchingGroups = false;
                }
            }
            else {
                this.state = States.loaded;
                return;
            }
        };
        /**
         * @param  {string} key
         */
        this.onSearch = (key) => {
            this.searchKeyword = key;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                const request = this.getRequestBuilder();
                this.groupsRequest = request;
                if (!this.disableLoadingState) {
                    this.groupMembers = [];
                }
                this.fetchNextGroupMembers();
            }, 500);
        };
        this.membersStyle = () => {
            return {
                padding: this.groupMembersStyle.padding,
            };
        };
        // styles
        this.backButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.groupMembersStyle.backButtonIconTint ||
                    this.themeService.theme.palette.getPrimary(),
            };
        };
        this.closeButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.groupMembersStyle.closeButtonIconTint ||
                    this.themeService.theme.palette.getPrimary(),
            };
        };
        this.wrapperStyle = () => {
            return {
                height: this.groupMembersStyle.height,
                width: this.groupMembersStyle.width,
                background: this.groupMembersStyle.background ||
                    this.themeService.theme.palette.getBackground(),
                border: this.groupMembersStyle.border,
                borderRadius: this.groupMembersStyle.borderRadius,
            };
        };
        this.getScopeStyle = () => {
            return {
                textFont: this.groupScopeStyle.textFont,
                textColor: this.groupScopeStyle.textColor,
            };
        };
    }
    closeClicked() {
        if (this.onClose) {
            this.onClose();
        }
    }
    backClicked() {
        if (this.onBack) {
            this.onBack();
        }
    }
    onMemberSelected(member, event) {
        let selected = event?.detail?.checked;
        if (this.onSelect) {
            this.onSelect(member, selected);
        }
    }
    ngOnInit() {
        this.onScrolledToBottom = this.fetchNextGroupMembers;
        this.setThemeStyle();
        this.attachListeners();
        CometChat.getLoggedinUser()
            .then((user) => {
            this.loggedInUser = user;
            this.groupsRequest = this.getRequestBuilder();
            if (!this.fetchingGroups) {
                this.fetchNextGroupMembers();
            }
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    ngOnChanges(changes) {
        if (changes["searchKeyword"]) {
            this.searchKeyWordUpdated();
        }
    }
    ngOnDestroy() {
        this.removeListener();
    }
    changeMemberScope(event) {
        CometChat.updateGroupMemberScope(this.group.getGuid(), this.selectedMember.getUid(), event?.detail?.value)
            .then((member) => {
            let scope = event?.detail?.value;
            this.changeScope = false;
            this.selectedMember?.setScope(scope);
            this.updateMember(this.selectedMember);
            CometChatGroupEvents.ccGroupMemberScopeChanged.next({
                scopeChangedFrom: this.selectedMember?.getScope(),
                scopeChangedTo: scope,
                message: this.createActionMessage(this.selectedMember, CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE),
                group: this.group,
                updatedUser: this.selectedMember,
            });
            this.selectedMember = null;
            this.changeScope = false;
        })
            .catch((err) => {
            this.changeScope = false;
            this.selectedMember = null;
        });
    }
    createActionMessage(actionOn, action) {
        let actionMessage = new CometChat.Action(this.group.getGuid(), CometChatUIKitConstants.MessageTypes.groupMember, CometChatUIKitConstants.MessageReceiverType.group, CometChatUIKitConstants.MessageCategory.action);
        actionMessage.setAction(action);
        actionMessage.setActionBy(this.loggedInUser);
        actionMessage.setActionFor(this.group);
        actionMessage.setActionOn(actionOn);
        actionMessage.setReceiver(this.group);
        actionMessage.setSender(this.loggedInUser);
        actionMessage.setConversationId("group_" + this.group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setMessage(`${this.loggedInUser?.getName()} ${action} ${actionOn.getUid()}`);
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
        actionMessage.data = {
            extras: {
                scope: {
                    new: actionOn.getScope(),
                },
            },
        };
        return actionMessage;
    }
    attachListeners() {
        //Attaching User Listeners to dynamilcally update when a user comes online and goes offline
        CometChat.addUserListener(this.membersListenerId, new CometChat.UserListener({
            onUserOnline: (onlineUser) => {
                /* when someuser/friend comes online, user will be received here */
                this.updateMemberStatus(onlineUser);
            },
            onUserOffline: (offlineUser) => {
                /* when someuser/friend went offline, user will be received here */
                this.updateMemberStatus(offlineUser);
            },
        }));
        CometChat.addGroupListener(this.membersListenerId, new CometChat.GroupListener({
            onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                if (changedUser.getUid() == this.loggedInUser?.getUid()) {
                    changedGroup.setScope(newScope);
                }
                this.updateMember(changedUser);
            },
            onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                this.addRemoveMember(kickedUser);
            },
            onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                this.addRemoveMember(bannedUser);
            },
            onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                if (unbannedUser.getUid() == this.loggedInUser?.getUid()) {
                    unbannedFrom.setHasJoined(false);
                }
                this.addRemoveMember(unbannedUser);
            },
            onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                let member = new CometChat.GroupMember(userAdded.getUid(), CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
                member.setName(userAdded.getName());
                member.setGuid(this.group.getGuid());
                member.setUid(userAdded.getUid());
                if (userAdded.getUid() == this.loggedInUser?.getUid()) {
                    userAddedIn.setHasJoined(true);
                }
                this.addRemoveMember(member);
            },
            onGroupMemberLeft: (message, leavingUser, group) => {
                if (leavingUser.getUid() == this.loggedInUser?.getUid()) {
                    group.setHasJoined(false);
                }
                this.addRemoveMember(leavingUser);
            },
            onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                this.addRemoveMember(joinedUser);
            },
        }));
    }
    removeListener() {
        CometChat.removeUserListener(this.membersListenerId);
        this.membersListenerId = "";
    }
    getRequestBuilder() {
        if (!this.searchKeyword) {
            this.previousSearchKeyword = "";
        }
        if (this.searchRequestBuilder) {
            return this.searchRequestBuilder
                .setSearchKeyword(this.searchKeyword)
                .build();
        }
        else if (this.groupMemberRequestBuilder) {
            return this.groupMemberRequestBuilder
                .setSearchKeyword(this.searchKeyword)
                .build();
        }
        else {
            return new CometChat.GroupMembersRequestBuilder(this.group.getGuid())
                .setLimit(this.limit)
                .setSearchKeyword(this.searchKeyword)
                .build();
        }
    }
    setThemeStyle() {
        this.setGroupMembersStyle();
        this.setScopeStyle();
        this.setListItemStyle();
        this.setAvatarStyle();
        this.setStatusStyle();
        this.menuListStyle = new MenuListStyle({
            border: "none",
            borderRadius: "8px",
            background: "transparent",
            submenuWidth: "100%",
            submenuHeight: "100%",
            submenuBorder: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            submenuBorderRadius: "8px",
            submenuBackground: this.themeService.theme.palette.getBackground(),
            moreIconTint: this.themeService.theme.palette.getPrimary(),
        });
        this.modalStyle.boxShadow = `0px 0px 1px ${this.themeService.theme.palette.getAccent600()}`;
        this.modalStyle.background =
            this.themeService.theme.palette.getBackground();
    }
    setGroupMembersStyle() {
        let defaultStyle = new GroupMembersStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            separatorColor: this.themeService.theme.palette.getAccent400(),
            width: "100%",
            height: "100%",
            borderRadius: "none",
            searchIconTint: this.themeService.theme.palette.getAccent600(),
            searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            searchBackground: this.themeService.theme.palette.getAccent100(),
            searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchTextColor: this.themeService.theme.palette.getAccent600(),
            searchTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchBorderRadius: "8px",
            closeButtonIconTint: this.themeService.theme.palette.getPrimary(),
            backButtonIconTint: this.themeService.theme.palette.getPrimary(),
            padding: "0 100px",
        });
        this.groupMembersStyle = { ...defaultStyle, ...this.groupMembersStyle };
        this.listStyle = {
            titleTextFont: this.groupMembersStyle.titleTextFont ||
                fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.groupMembersStyle.titleTextColor ||
                this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: this.groupMembersStyle.emptyStateTextFont,
            emptyStateTextColor: this.groupMembersStyle.emptyStateTextColor,
            errorStateTextFont: this.groupMembersStyle.errorStateTextFont,
            errorStateTextColor: this.groupMembersStyle.errorStateTextColor,
            loadingIconTint: this.groupMembersStyle.loadingIconTint,
            separatorColor: this.groupMembersStyle.separatorColor,
            searchIconTint: this.groupMembersStyle.searchIconTint,
            searchBorder: this.groupMembersStyle.searchBorder,
            searchBorderRadius: this.groupMembersStyle.searchBorderRadius,
            searchBackground: this.groupMembersStyle.searchBackground,
            searchPlaceholderTextFont: this.groupMembersStyle.searchPlaceholderTextFont,
            searchPlaceholderTextColor: this.groupMembersStyle.searchPlaceholderTextColor,
            searchTextFont: this.groupMembersStyle.searchTextFont,
            searchTextColor: this.groupMembersStyle.searchTextColor,
        };
    }
    setListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: "",
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            hoverBackground: "",
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
        this.statusIndicatorStyle = {
            ...defaultStyle,
            ...this.statusIndicatorStyle,
        };
    }
    setScopeStyle() {
        let defaultStyle = new ChangeScopeStyle({
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            activeTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            activeTextColor: this.themeService.theme.palette.getAccent(),
            activeTextBackground: this.themeService.theme.palette.getAccent200(),
            arrowIconTint: this.themeService.theme.palette.getAccent900(),
            textFont: fontHelper(this.themeService.theme.typography.subtitle1),
            textColor: this.themeService.theme.palette.getAccent600(),
            optionBackground: this.themeService.theme.palette.getBackground(),
            optionBorder: "none",
            optionBorderRadius: "0",
            hoverTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            hoverTextColor: this.themeService.theme.palette.getAccent900(),
            hoverTextBackground: this.themeService.theme.palette.getAccent100(),
            buttonTextFont: fontHelper(this.themeService.theme.typography.title2),
            buttonTextColor: this.themeService.theme.palette.getAccent("dark"),
            buttonBackground: this.themeService.theme.palette.getPrimary(),
            closeIconTint: this.themeService.theme.palette.getPrimary(),
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            borderRadius: "8px",
            height: "200px",
            width: "280px",
        });
        this.groupScopeStyle = { ...defaultStyle, ...this.groupScopeStyle };
    }
}
CometChatGroupMembersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupMembersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatGroupMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: { groupMemberRequestBuilder: "groupMemberRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", tailView: "tailView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", backdropStyle: "backdropStyle", onBack: "onBack", onClose: "onClose", onSelect: "onSelect", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", dropdownIconURL: "dropdownIconURL", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", groupMembersStyle: "groupMembersStyle", groupScopeStyle: "groupScopeStyle", listItemStyle: "listItemStyle", onItemClick: "onItemClick", onEmpty: "onEmpty", userPresencePlacement: "userPresencePlacement", disableLoadingState: "disableLoadingState", searchKeyword: "searchKeyword" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-group-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-group-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"\n      (cc-button-clicked)=\"backClicked()\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-group-members__wrapper\" [ngStyle]=\"membersStyle()\">\n    <div class=\"cc-group-members__menus\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n    </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\"\n      [onSearch]=\"onSearch\" [list]=\"groupMembers\" [searchText]=\"searchKeyword\"\n      [searchPlaceholderText]=\"searchPlaceholder\" [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"\n      [title]=\"title\" [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-groupMember>\n      <cometchat-list-item [title]=\"groupMember?.name\" [avatarURL]=\"groupMember?.avatar\"\n        [avatarName]=\"groupMember?.name\" [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n        [statusIndicatorStyle]=\"statusIndicatorStyle\" [statusIndicatorColor]=\"getStatusIndicatorColor(groupMember)\"\n        [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(groupMember)\"\n        [userPresencePlacement]=\"userPresencePlacement\">\n        <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-group-members__subtitle-view\">\n          <ng-container *ngTemplateOutlet=\"subtitleView\">\n          </ng-container>\n        </div>\n        <div slot=\"menuView\" class=\"cc-group-members__options\" *ngIf=\" !tailView && options\">\n          <cometchat-menu-list [data]=\"options(groupMember)\" [menuListStyle]=\"menuListStyle\"\n            (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\"></cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" class=\"cc-group-members__tail-view\">\n\n          <div *ngIf=\"tailView\">\n            <ng-container *ngTemplateOutlet=\"tailView;context:{ $implicit: groupMember }\">\n            </ng-container>\n\n          </div>\n          <div *ngIf=\"selectionMode != selectionmodeEnum.none\">\n            <div *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-group-members__selection--single\">\n              <cometchat-radio-button (cc-radio-button-changed)=\"onMemberSelected(groupMember,$event)\">\n              </cometchat-radio-button>\n            </div>\n            <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-group-members__selection--multiple\">\n              <cometchat-checkbox (cc-checkbox-changed)=\"onMemberSelected(groupMember,$event)\"></cometchat-checkbox>\n            </div>\n          </div>\n          <div *ngIf=\"!tailView\">\n            <div class=\"cc-group-members__scopechange\" slot=\"tailView\">\n\n              <cometchat-menu-list [moreIconURL]=\"moreIconURL\" *ngIf=\"isArray(getOptions(groupMember))\"\n                [topMenuSize]=\"0\" [data]=\"getOptions(groupMember)\"\n                (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\" [menuListStyle]=\"menuListStyle\">\n              </cometchat-menu-list>\n              <cometchat-label *ngIf=\" isString(getOptions(groupMember))\" [text]=\"getOptions(groupMember)\"\n                [labelStyle]=\"getScopeStyle()\">\n\n              </cometchat-label>\n\n            </div>\n          </div>\n        </div>\n      </cometchat-list-item>\n\n    </ng-template>\n  </div>\n  <div class=\"cc-group-members__close\" *ngIf=\"closeButtonIconURL\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\"\n      (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n<cometchat-backdrop *ngIf=\"changeScope && memberScope.length > 0\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-change-scope [changeScopeStyle]=\"groupScopeStyle\" [options]=\"memberScope\" [arrowIconURL]=\"dropdownIconURL\"\n    (cc-changescope-close-clicked)=\"changeScope = false;\" (cc-changescope-changed)=\"changeMemberScope($event)\">\n\n  </cometchat-change-scope>\n</cometchat-backdrop>", styles: [".cc-group-members{display:flex;height:100%;width:100%;overflow:hidden;box-sizing:border-box}.cc-group-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-group-members__wrapper{height:100%;padding:8px;width:100%}.cc-group-members__close{position:absolute;right:8px;padding:8px}.cc-group-members__tail-view{position:relative;display:flex;gap:8px;justify-content:flex-end;align-items:center}.cc-group-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.scope__changed{height:100%;width:-moz-fit-content;width:fit-content;position:absolute;right:8px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupMembersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-group-members", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-group-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-group-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"\n      (cc-button-clicked)=\"backClicked()\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-group-members__wrapper\" [ngStyle]=\"membersStyle()\">\n    <div class=\"cc-group-members__menus\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n    </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\"\n      [onSearch]=\"onSearch\" [list]=\"groupMembers\" [searchText]=\"searchKeyword\"\n      [searchPlaceholderText]=\"searchPlaceholder\" [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"\n      [title]=\"title\" [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-groupMember>\n      <cometchat-list-item [title]=\"groupMember?.name\" [avatarURL]=\"groupMember?.avatar\"\n        [avatarName]=\"groupMember?.name\" [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n        [statusIndicatorStyle]=\"statusIndicatorStyle\" [statusIndicatorColor]=\"getStatusIndicatorColor(groupMember)\"\n        [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(groupMember)\"\n        [userPresencePlacement]=\"userPresencePlacement\">\n        <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-group-members__subtitle-view\">\n          <ng-container *ngTemplateOutlet=\"subtitleView\">\n          </ng-container>\n        </div>\n        <div slot=\"menuView\" class=\"cc-group-members__options\" *ngIf=\" !tailView && options\">\n          <cometchat-menu-list [data]=\"options(groupMember)\" [menuListStyle]=\"menuListStyle\"\n            (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\"></cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" class=\"cc-group-members__tail-view\">\n\n          <div *ngIf=\"tailView\">\n            <ng-container *ngTemplateOutlet=\"tailView;context:{ $implicit: groupMember }\">\n            </ng-container>\n\n          </div>\n          <div *ngIf=\"selectionMode != selectionmodeEnum.none\">\n            <div *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-group-members__selection--single\">\n              <cometchat-radio-button (cc-radio-button-changed)=\"onMemberSelected(groupMember,$event)\">\n              </cometchat-radio-button>\n            </div>\n            <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-group-members__selection--multiple\">\n              <cometchat-checkbox (cc-checkbox-changed)=\"onMemberSelected(groupMember,$event)\"></cometchat-checkbox>\n            </div>\n          </div>\n          <div *ngIf=\"!tailView\">\n            <div class=\"cc-group-members__scopechange\" slot=\"tailView\">\n\n              <cometchat-menu-list [moreIconURL]=\"moreIconURL\" *ngIf=\"isArray(getOptions(groupMember))\"\n                [topMenuSize]=\"0\" [data]=\"getOptions(groupMember)\"\n                (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\" [menuListStyle]=\"menuListStyle\">\n              </cometchat-menu-list>\n              <cometchat-label *ngIf=\" isString(getOptions(groupMember))\" [text]=\"getOptions(groupMember)\"\n                [labelStyle]=\"getScopeStyle()\">\n\n              </cometchat-label>\n\n            </div>\n          </div>\n        </div>\n      </cometchat-list-item>\n\n    </ng-template>\n  </div>\n  <div class=\"cc-group-members__close\" *ngIf=\"closeButtonIconURL\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\"\n      (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n<cometchat-backdrop *ngIf=\"changeScope && memberScope.length > 0\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-change-scope [changeScopeStyle]=\"groupScopeStyle\" [options]=\"memberScope\" [arrowIconURL]=\"dropdownIconURL\"\n    (cc-changescope-close-clicked)=\"changeScope = false;\" (cc-changescope-changed)=\"changeMemberScope($event)\">\n\n  </cometchat-change-scope>\n</cometchat-backdrop>", styles: [".cc-group-members{display:flex;height:100%;width:100%;overflow:hidden;box-sizing:border-box}.cc-group-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-group-members__wrapper{height:100%;padding:8px;width:100%}.cc-group-members__close{position:absolute;right:8px;padding:8px}.cc-group-members__tail-view{position:relative;display:flex;gap:8px;justify-content:flex-end;align-items:center}.cc-group-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.scope__changed{height:100%;width:-moz-fit-content;width:fit-content;position:absolute;right:8px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { groupMemberRequestBuilder: [{
                type: Input
            }], searchRequestBuilder: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], tailView: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], menu: [{
                type: Input
            }], options: [{
                type: Input
            }], backButtonIconURL: [{
                type: Input
            }], closeButtonIconURL: [{
                type: Input
            }], showBackButton: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], searchPlaceholder: [{
                type: Input
            }], searchIconURL: [{
                type: Input
            }], hideSearch: [{
                type: Input
            }], title: [{
                type: Input
            }], onError: [{
                type: Input
            }], backdropStyle: [{
                type: Input
            }], onBack: [{
                type: Input
            }], onClose: [{
                type: Input
            }], onSelect: [{
                type: Input
            }], group: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], dropdownIconURL: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], groupMembersStyle: [{
                type: Input
            }], groupScopeStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }], onEmpty: [{
                type: Input
            }], userPresencePlacement: [{
                type: Input
            }], disableLoadingState: [{
                type: Input
            }], searchKeyword: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFFVCxLQUFLLEVBRUwsdUJBQXVCLEdBSXhCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQ0wsV0FBVyxFQUNYLGFBQWEsRUFDYixnQkFBZ0IsRUFDaEIsYUFBYSxHQUVkLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUNMLGdCQUFnQixFQUNoQixpQkFBaUIsRUFHakIscUJBQXFCLEdBQ3RCLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUVMLFVBQVUsRUFDVixRQUFRLEVBRVIsb0JBQW9CLEVBQ3BCLHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFDZCxxQkFBcUIsR0FDdEIsTUFBTSw0QkFBNEIsQ0FBQztBQUVwQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQzs7Ozs7QUFDMUU7Ozs7Ozs7O0dBUUc7QUFPSCxNQUFNLE9BQU8sOEJBQThCO0lBdUl6QyxZQUNVLEdBQXNCLEVBQ3RCLFlBQW1DO1FBRG5DLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FB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QWE7c0JBQXJCLEtBQUs7Z0JBTUcsTUFBTTtzQkFBZCxLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUlHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBTUcsV0FBVztzQkFBbkIsS0FBSztnQkFLRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBTUcsZUFBZTtzQkFBdkIsS0FBSztnQkFJRyxhQUFhO3NCQUFyQixLQUFLO2dCQVlHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFFRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBd0JHLGFBQWE7c0JBQXJCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIE9uSW5pdCxcbiAgSW5wdXQsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgVGVtcGxhdGVSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IFN1YmplY3QsIFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbiAgQ2hhbmdlU2NvcGVTdHlsZSxcbiAgTWVudUxpc3RTdHlsZSxcbiAgQmFja2Ryb3BTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7XG4gIEdyb3VwTWVtYmVyVXRpbHMsXG4gIEdyb3VwTWVtYmVyc1N0eWxlLFxuICBMaXN0U3R5bGUsXG4gIEJhc2VTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFRoZW1lLFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIFNlbGVjdGlvbk1vZGUsXG4gIFN0YXRlcyxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIFVzZXJQcmVzZW5jZVBsYWNlbWVudCxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuLyoqXG4gKlxuICogIENvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudCBpcyB1c2VkIHRvIHJlbmRlciBsaXN0IG9mIGdyb3VwIG1lbWJlcnNcbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtZ3JvdXAtbWVtYmVyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtZ3JvdXAtbWVtYmVycy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHRhaWxWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOlxuICAgIHwgKChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4gQ29tZXRDaGF0T3B0aW9uW10pXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgY2xvc2VCdXR0b25JY29uVVJMOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiO1xuICBASW5wdXQoKSBzaG93QmFja0J1dHRvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IFwiU2VhcmNoIE1lbWJlcnNcIjtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcj86ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuICBASW5wdXQoKSBvbkJhY2shOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkNsb3NlITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAoXG4gICAgZ3JvdXBNZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcixcbiAgICBzZWxlY3RlZDogYm9vbGVhblxuICApID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19HUk9VUFNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQuY2VudGVyO1xuICBASW5wdXQoKSBkcm9wZG93bkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Rvd24tYXJyb3cuc3ZnXCI7XG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gIH07XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjMycHhcIixcbiAgICBoZWlnaHQ6IFwiMzJweFwiLFxuICB9O1xuICBASW5wdXQoKSBncm91cE1lbWJlcnNTdHlsZTogR3JvdXBNZW1iZXJzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgfTtcbiAgQElucHV0KCkgZ3JvdXBTY29wZVN0eWxlOiBDaGFuZ2VTY29wZVN0eWxlID0gbmV3IENoYW5nZVNjb3BlU3R5bGUoe1xuICAgIGhlaWdodDogXCIyMDBweFwiLFxuICAgIHdpZHRoOiBcIjI4MHB4XCIsXG4gIH0pO1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlclJhZGl1czogXCJncmV5XCIsXG4gICAgdGl0bGVGb250OiBcIlwiLFxuICAgIHRpdGxlQ29sb3I6IFwiXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYmEoMjIyIDIyMiAyMjIgLyA0NiUpXCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKHVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4gdm9pZDtcbiAgQElucHV0KCkgb25FbXB0eT86ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHVzZXJQcmVzZW5jZVBsYWNlbWVudDogVXNlclByZXNlbmNlUGxhY2VtZW50ID1cbiAgICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQuYm90dG9tO1xuICBASW5wdXQoKSBkaXNhYmxlTG9hZGluZ1N0YXRlOiBib29sZWFuID0gZmFsc2U7XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge307XG4gIG1lbnVMaXN0U3R5bGU6IE1lbnVMaXN0U3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgbW9yZUljb25UaW50OiBcInJnYig1MSwgMTUzLCAyNTUpXCIsXG4gIH07XG4gIG1vZGFsU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjEycHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIG1vcmVJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9tb3JlaWNvbi5zdmdcIjtcbiAgQElucHV0KCkgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsO1xuICBwdWJsaWMgaXNTdHJpbmcgPSAoZGF0YTogYW55KSA9PiB0eXBlb2YgZGF0YSA9PSBcInN0cmluZ1wiO1xuICBwdWJsaWMgaXNBcnJheSA9IChkYXRhOiBhbnkpID0+IHR5cGVvZiBkYXRhID09IFwib2JqZWN0XCIgJiYgZGF0YT8ubGVuZ3RoID4gMDtcbiAgcHVibGljIGdldE9wdGlvbnMgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBsZXQgb3B0aW9ucyA9IEdyb3VwTWVtYmVyVXRpbHMuZ2V0Vmlld01lbWJlck9wdGlvbnMoXG4gICAgICBtZW1iZXIsXG4gICAgICB0aGlzLmdyb3VwLFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpLFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWVcbiAgICApO1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9O1xuICBzZWxlY3RlZE1lbWJlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciB8IG51bGw7XG4gIHRpdGxlQWxpZ25tZW50RW51bTogdHlwZW9mIFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQ7XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIHB1YmxpYyBncm91cHNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHB1YmxpYyBncm91cE1lbWJlcnM6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdID0gW107XG4gIHB1YmxpYyBzY29wZXM6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBtZW1iZXJzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJtZW1iZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgY2hhbmdlU2NvcGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hpbmdHcm91cHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hUaW1lT3V0OiBhbnk7XG4gIHB1YmxpYyBwcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge31cblxuICBwdWJsaWMgbWVtYmVyU2NvcGU6IGFueVtdID0gW107XG4gIG1lbWJlcnNMaXN0OiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFtdO1xuXG4gIGNsb3NlQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKTtcbiAgICB9XG4gIH1cbiAgYmFja0NsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25CYWNrKSB7XG4gICAgICB0aGlzLm9uQmFjaygpO1xuICAgIH1cbiAgfVxuICBvbkNsaWNrID0gKGdyb3VwTWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayhncm91cE1lbWJlcik7XG4gICAgfVxuICB9O1xuICBvbk1lbWJlclNlbGVjdGVkKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQ/LmRldGFpbD8uY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdChtZW1iZXIsIHNlbGVjdGVkKTtcbiAgICB9XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycztcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgaWYgKCF0aGlzLmZldGNoaW5nR3JvdXBzKSB7XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1wic2VhcmNoS2V5d29yZFwiXSkge1xuICAgICAgdGhpcy5zZWFyY2hLZXlXb3JkVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIHNlYXJjaEtleVdvcmRVcGRhdGVkID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLmZldGNoaW5nR3JvdXBzKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5mZXRjaFRpbWVPdXQpO1xuICAgICAgdGhpcy5mZXRjaFRpbWVPdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zZWFyY2hGb3JHcm91cE1lbWJlcnMoKTtcbiAgICAgIH0sIDgwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2VhcmNoRm9yR3JvdXBNZW1iZXJzKCk7XG4gICAgfVxuICB9O1xuXG4gIHNlYXJjaEZvckdyb3VwTWVtYmVycyA9ICgpID0+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlclxuICAgICAgPyB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKS5idWlsZCgpXG4gICAgICA6IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgPSByZXF1ZXN0O1xuICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFtdO1xuICAgIH1cbiAgICB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycygpO1xuICB9O1xuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwTWVtYmVyfSBtZW1iZXJcbiAgICovXG4gIGdldFN0YXR1c0luZGljYXRvckNvbG9yID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlKSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1lbWJlcj8uZ2V0U3RhdHVzKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLm9ubGluZVN0YXR1c0NvbG9yIHx8XG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKClcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgY2hhbmdlTWVtYmVyU2NvcGUoZXZlbnQ6IGFueSkge1xuICAgIENvbWV0Q2hhdC51cGRhdGVHcm91cE1lbWJlclNjb3BlKFxuICAgICAgdGhpcy5ncm91cC5nZXRHdWlkKCksXG4gICAgICB0aGlzLnNlbGVjdGVkTWVtYmVyIS5nZXRVaWQoKSxcbiAgICAgIGV2ZW50Py5kZXRhaWw/LnZhbHVlXG4gICAgKVxuICAgICAgLnRoZW4oKG1lbWJlcjogYm9vbGVhbikgPT4ge1xuICAgICAgICBsZXQgc2NvcGU6IGFueSA9IGV2ZW50Py5kZXRhaWw/LnZhbHVlO1xuICAgICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXI/LnNldFNjb3BlKHNjb3BlKTtcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5zZWxlY3RlZE1lbWJlcik7XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQubmV4dCh7XG4gICAgICAgICAgc2NvcGVDaGFuZ2VkRnJvbTogdGhpcy5zZWxlY3RlZE1lbWJlcj8uZ2V0U2NvcGUoKSxcbiAgICAgICAgICBzY29wZUNoYW5nZWRUbzogc2NvcGUsXG4gICAgICAgICAgbWVzc2FnZTogdGhpcy5jcmVhdGVBY3Rpb25NZXNzYWdlKFxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE1lbWJlciEsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0VcbiAgICAgICAgICApLFxuICAgICAgICAgIGdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIHVwZGF0ZWRVc2VyOiB0aGlzLnNlbGVjdGVkTWVtYmVyISxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkTWVtYmVyID0gbnVsbDtcbiAgICAgIH0pO1xuICB9XG4gIGhhbmRsZU1lbnVBY3Rpb24gPSAobWVudTogYW55LCBncm91cE1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgaWYgKG1lbnU/LmRldGFpbD8uZGF0YT8ub25DbGljaykge1xuICAgICAgbWVudT8uZGV0YWlsPy5kYXRhPy5vbkNsaWNrKGdyb3VwTWVtYmVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGlkID0gbWVudT8uZGV0YWlsPy5kYXRhPy5pZDtcbiAgICB0aGlzLnNlbGVjdGVkTWVtYmVyID0gZ3JvdXBNZW1iZXI7XG4gICAgdGhpcy5tZW1iZXJTY29wZSA9IEdyb3VwTWVtYmVyVXRpbHMuYWxsb3dTY29wZUNoYW5nZShcbiAgICAgIHRoaXMuZ3JvdXAsXG4gICAgICBncm91cE1lbWJlclxuICAgICk7XG4gICAgaWYgKGlkID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwTWVtYmVyT3B0aW9ucy5jaGFuZ2VTY29wZSkge1xuICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IHRydWU7XG4gICAgICB0aGlzLnNjb3BlcyA9IFtdO1xuICAgIH0gZWxzZSBpZiAoaWQgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBNZW1iZXJPcHRpb25zLmJhbikge1xuICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IGZhbHNlO1xuICAgICAgdGhpcy5ibG9ja01lbWJlcihncm91cE1lbWJlcik7XG4gICAgfSBlbHNlIGlmIChpZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE1lbWJlck9wdGlvbnMua2ljaykge1xuICAgICAgdGhpcy5raWNrTWVtYmVyKGdyb3VwTWVtYmVyKTtcbiAgICB9XG4gIH07XG4gIGJsb2NrTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgQ29tZXRDaGF0LmJhbkdyb3VwTWVtYmVyKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBtZW1iZXIuZ2V0VWlkKCkpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSAtIDEpO1xuICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobWVtYmVyKTtcbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQubmV4dCh7XG4gICAgICAgIGtpY2tlZEJ5OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgIGtpY2tlZEZyb206IHRoaXMuZ3JvdXAhLFxuICAgICAgICBraWNrZWRVc2VyOiBtZW1iZXIsXG4gICAgICAgIG1lc3NhZ2U6IHRoaXMuY3JlYXRlQWN0aW9uTWVzc2FnZShcbiAgICAgICAgICBtZW1iZXIsXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVEXG4gICAgICAgICksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBhY3Rpb246IHN0cmluZykge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24oXG4gICAgICB0aGlzLmdyb3VwLmdldEd1aWQoKSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcixcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uIGFzIGFueVxuICAgICk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25Gb3IodGhpcy5ncm91cCk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25Pbik7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TWVzc2FnZShcbiAgICAgIGAke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9ICR7YWN0aW9ufSAke2FjdGlvbk9uLmdldFVpZCgpfWBcbiAgICApO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0UmVjZWl2ZXJUeXBlKFxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICk7XG4gICAgKGFjdGlvbk1lc3NhZ2UgYXMgYW55KS5kYXRhID0ge1xuICAgICAgZXh0cmFzOiB7XG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgbmV3OiBhY3Rpb25Pbi5nZXRTY29wZSgpLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiBhY3Rpb25NZXNzYWdlO1xuICB9XG4gIGtpY2tNZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBDb21ldENoYXQua2lja0dyb3VwTWVtYmVyKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBtZW1iZXIuZ2V0VWlkKCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuZ3JvdXAuc2V0TWVtYmVyc0NvdW50KHRoaXMuZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgLSAxKTtcbiAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobWVtYmVyKTtcbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5uZXh0KHtcbiAgICAgICAgICBraWNrZWRCeTogdGhpcy5sb2dnZWRJblVzZXIhLFxuICAgICAgICAgIGtpY2tlZEZyb206IHRoaXMuZ3JvdXAhLFxuICAgICAgICAgIGtpY2tlZFVzZXI6IG1lbWJlcixcbiAgICAgICAgICBtZXNzYWdlOiB0aGlzLmNyZWF0ZUFjdGlvbk1lc3NhZ2UoXG4gICAgICAgICAgICBtZW1iZXIsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5LSUNLRURcbiAgICAgICAgICApLFxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSBtZW1iZXJcbiAgICovXG4gIHVwZGF0ZU1lbWJlclN0YXR1cyA9IChtZW1iZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgbGV0IG1lbWJlcmxpc3QgPSBbLi4udGhpcy5ncm91cE1lbWJlcnNdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IHVzZXJLZXkgPSBtZW1iZXJsaXN0LmZpbmRJbmRleChcbiAgICAgICh1OiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gbWVtYmVyLmdldFVpZCgpXG4gICAgKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICBsZXQgdXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gbWVtYmVybGlzdFt1c2VyS2V5XTtcbiAgICAgIHVzZXIuc2V0U3RhdHVzKG1lbWJlci5nZXRTdGF0dXMoKSk7XG4gICAgICBtZW1iZXJsaXN0LnNwbGljZSh1c2VyS2V5LCAxLCB1c2VyKTtcbiAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgdXBkYXRlTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyIHwgbnVsbCkgPT4ge1xuICAgIGxldCBtZW1iZXJsaXN0ID0gWy4uLnRoaXMuZ3JvdXBNZW1iZXJzXTtcbiAgICAvL3NlYXJjaCBmb3IgdXNlclxuICAgIGxldCB1c2VyS2V5ID0gbWVtYmVybGlzdC5maW5kSW5kZXgoXG4gICAgICAodTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBrKSA9PiB1LmdldFVpZCgpID09IG1lbWJlciEuZ2V0VWlkKClcbiAgICApO1xuICAgIC8vaWYgZm91bmQgaW4gdGhlIGxpc3QsIHVwZGF0ZSB1c2VyIG9iamVjdFxuICAgIGlmICh1c2VyS2V5ID4gLTEpIHtcbiAgICAgIGxldCB1c2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSBtZW1iZXJsaXN0W3VzZXJLZXldO1xuICAgICAgbWVtYmVybGlzdC5zcGxpY2UodXNlcktleSwgMSwgdXNlcik7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi5tZW1iZXJsaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICAvL0F0dGFjaGluZyBVc2VyIExpc3RlbmVycyB0byBkeW5hbWlsY2FsbHkgdXBkYXRlIHdoZW4gYSB1c2VyIGNvbWVzIG9ubGluZSBhbmQgZ29lcyBvZmZsaW5lXG4gICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyU3RhdHVzKG9ubGluZVVzZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyU3RhdHVzKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgIG5ld1Njb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICBvbGRTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgY2hhbmdlZEdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKGNoYW5nZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgY2hhbmdlZEdyb3VwLnNldFNjb3BlKG5ld1Njb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIoY2hhbmdlZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAga2lja2VkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGtpY2tlZEZyb206IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihraWNrZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBiYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIoYmFubmVkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyVW5iYW5uZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKHVuYmFubmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVuYmFubmVkRnJvbS5zZXRIYXNKb2luZWQoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcih1bmJhbm5lZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgbGV0IG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gbmV3IENvbWV0Q2hhdC5Hcm91cE1lbWJlcihcbiAgICAgICAgICAgIHVzZXJBZGRlZC5nZXRVaWQoKSxcbiAgICAgICAgICAgIENvbWV0Q2hhdC5HUk9VUF9NRU1CRVJfU0NPUEUuUEFSVElDSVBBTlRcbiAgICAgICAgICApO1xuICAgICAgICAgIG1lbWJlci5zZXROYW1lKHVzZXJBZGRlZC5nZXROYW1lKCkpO1xuICAgICAgICAgIG1lbWJlci5zZXRHdWlkKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICAgICAgICBtZW1iZXIuc2V0VWlkKHVzZXJBZGRlZC5nZXRVaWQoKSk7XG4gICAgICAgICAgaWYgKHVzZXJBZGRlZC5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVzZXJBZGRlZEluLnNldEhhc0pvaW5lZCh0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGxlYXZpbmdVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGlmIChsZWF2aW5nVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGdyb3VwLnNldEhhc0pvaW5lZChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKGxlYXZpbmdVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGpvaW5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGpvaW5lZEdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIoam9pbmVkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy5tZW1iZXJzTGlzdGVuZXJJZCk7XG4gICAgdGhpcy5tZW1iZXJzTGlzdGVuZXJJZCA9IFwiXCI7XG4gIH1cbiAgYWRkUmVtb3ZlTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgbGV0IG1lbWJlcmxpc3QgPSBbLi4udGhpcy5ncm91cE1lbWJlcnNdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IG1lbWJlcktleSA9IG1lbWJlcmxpc3QuZmluZEluZGV4KFxuICAgICAgKHU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgaykgPT4gdS5nZXRVaWQoKSA9PSBtZW1iZXIuZ2V0VWlkKClcbiAgICApO1xuICAgIC8vaWYgZm91bmQgaW4gdGhlIGxpc3QsIHVwZGF0ZSB1c2VyIG9iamVjdFxuICAgIGlmIChtZW1iZXJLZXkgPiAtMSkge1xuICAgICAgbWVtYmVybGlzdC5zcGxpY2UobWVtYmVyS2V5LCAxKTtcbiAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycy5wdXNoKG1lbWJlcik7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICBmZXRjaE5leHRHcm91cE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIGlmIChcbiAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdCAmJlxuICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0LnBhZ2luYXRpb24gJiZcbiAgICAgICh0aGlzLmdyb3Vwc1JlcXVlc3QucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgPT0gMCB8fFxuICAgICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT1cbiAgICAgICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QucGFnaW5hdGlvbi50b3RhbF9wYWdlcylcbiAgICApIHtcbiAgICAgIHRoaXMuZmV0Y2hpbmdHcm91cHMgPSB0cnVlO1xuICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycztcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdC5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAgIChncm91cE1lbWJlcnM6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihncm91cE1lbWJlcnMubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub25FbXB0eSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25FbXB0eSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gJyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgZ3JvdXBNZW1iZXJzLmxlbmd0aCA8PSAwICYmXG4gICAgICAgICAgICAgICh0aGlzLmdyb3VwTWVtYmVycz8ubGVuZ3RoIDw9IDApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi50aGlzLmdyb3VwTWVtYmVycywgLi4uZ3JvdXBNZW1iZXJzXTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNlYXJjaEtleXdvcmQgIT0gdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgfHxcbiAgICAgICAgICAgICAgICAgIFswLCAxXS5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMuZ3JvdXBzUmVxdWVzdCBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlXG4gICAgICAgICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IHRoaXMuc2VhcmNoS2V5d29yZDtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gZ3JvdXBNZW1iZXJzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi50aGlzLmdyb3VwTWVtYmVycywgLi4uZ3JvdXBNZW1iZXJzXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdHcm91cHMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gdGhpcy5zZWFyY2hLZXl3b3JkO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdHcm91cHMgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLmZldGNoaW5nR3JvdXBzID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgZ2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYoIXRoaXMuc2VhcmNoS2V5d29yZCkge1xuICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgcmV0dXJuIHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlclxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcih0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgb25TZWFyY2ggPSAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gW107XG4gICAgICB9XG4gICAgICB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycygpO1xuICAgIH0sIDUwMCk7XG4gIH07XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXRHcm91cE1lbWJlcnNTdHlsZSgpO1xuICAgIHRoaXMuc2V0U2NvcGVTdHlsZSgpO1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKCk7XG4gICAgdGhpcy5tZW51TGlzdFN0eWxlID0gbmV3IE1lbnVMaXN0U3R5bGUoe1xuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHN1Ym1lbnVXaWR0aDogXCIxMDAlXCIsXG4gICAgICBzdWJtZW51SGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHN1Ym1lbnVCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc3VibWVudUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbW9yZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9KTtcbiAgICB0aGlzLm1vZGFsU3R5bGUuYm94U2hhZG93ID0gYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gO1xuICAgIHRoaXMubW9kYWxTdHlsZS5iYWNrZ3JvdW5kID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpO1xuICB9XG4gIHNldEdyb3VwTWVtYmVyc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEdyb3VwTWVtYmVyc1N0eWxlID0gbmV3IEdyb3VwTWVtYmVyc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGNsb3NlQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYmFja0J1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5ncm91cE1lbWJlcnNTdHlsZSB9O1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS50aXRsZVRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUudGl0bGVUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmxvYWRpbmdJY29uVGludCxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoQm9yZGVyLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoVGV4dENvbG9yLFxuICAgIH07XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9O1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlLFxuICAgIH07XG4gIH1cbiAgc2V0U2NvcGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDaGFuZ2VTY29wZVN0eWxlID0gbmV3IENoYW5nZVNjb3BlU3R5bGUoe1xuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIGFjdGl2ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgYXJyb3dJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9wdGlvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgb3B0aW9uQm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIG9wdGlvbkJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjIwMHB4XCIsXG4gICAgICB3aWR0aDogXCIyODBweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZ3JvdXBTY29wZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZ3JvdXBTY29wZVN0eWxlIH07XG4gIH1cbiAgbWVtYmVyc1N0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBwYWRkaW5nOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnBhZGRpbmcsXG4gICAgfTtcbiAgfTtcbiAgLy8gc3R5bGVzXG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYmFja0J1dHRvbkljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIH07XG4gIH07XG4gIGNsb3NlQnV0dG9uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmNsb3NlQnV0dG9uSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfTtcbiAgfTtcbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xuICBnZXRTY29wZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5ncm91cFNjb3BlU3R5bGUudGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuZ3JvdXBTY29wZVN0eWxlLnRleHRDb2xvcixcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fYmFja1wiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCIgKm5nSWY9XCJzaG93QmFja0J1dHRvblwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiYmFja0NsaWNrZWQoKVwiPlxuXG4gICAgPC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJtZW1iZXJzU3R5bGUoKVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19tZW51c1wiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxjb21ldGNoYXQtbGlzdCBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIlxuICAgICAgW29uU2VhcmNoXT1cIm9uU2VhcmNoXCIgW2xpc3RdPVwiZ3JvdXBNZW1iZXJzXCIgW3NlYXJjaFRleHRdPVwic2VhcmNoS2V5d29yZFwiXG4gICAgICBbc2VhcmNoUGxhY2Vob2xkZXJUZXh0XT1cInNlYXJjaFBsYWNlaG9sZGVyXCIgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIlxuICAgICAgW3RpdGxlXT1cInRpdGxlXCIgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCIgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIiBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCIgW2Vycm9yU3RhdGVWaWV3XT1cImVycm9yU3RhdGVWaWV3XCIgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIiBbc3RhdGVdPVwic3RhdGVcIj5cbiAgICA8L2NvbWV0Y2hhdC1saXN0PlxuICAgIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWdyb3VwTWVtYmVyPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cImdyb3VwTWVtYmVyPy5uYW1lXCIgW2F2YXRhclVSTF09XCJncm91cE1lbWJlcj8uYXZhdGFyXCJcbiAgICAgICAgW2F2YXRhck5hbWVdPVwiZ3JvdXBNZW1iZXI/Lm5hbWVcIiBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInN0YXR1c0luZGljYXRvclN0eWxlXCIgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImdldFN0YXR1c0luZGljYXRvckNvbG9yKGdyb3VwTWVtYmVyKVwiXG4gICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkNsaWNrKGdyb3VwTWVtYmVyKVwiXG4gICAgICAgIFt1c2VyUHJlc2VuY2VQbGFjZW1lbnRdPVwidXNlclByZXNlbmNlUGxhY2VtZW50XCI+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3XCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX29wdGlvbnNcIiAqbmdJZj1cIiAhdGFpbFZpZXcgJiYgb3B0aW9uc1wiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnMoZ3JvdXBNZW1iZXIpXCIgW21lbnVMaXN0U3R5bGVdPVwibWVudUxpc3RTdHlsZVwiXG4gICAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cImhhbmRsZU1lbnVBY3Rpb24oJGV2ZW50LCBncm91cE1lbWJlcilcIj48L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fdGFpbC12aWV3XCI+XG5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwidGFpbFZpZXdcIj5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiBncm91cE1lbWJlciB9XCI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIj5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiIGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fc2VsZWN0aW9uLS1zaW5nbGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1yYWRpby1idXR0b24gKGNjLXJhZGlvLWJ1dHRvbi1jaGFuZ2VkKT1cIm9uTWVtYmVyU2VsZWN0ZWQoZ3JvdXBNZW1iZXIsJGV2ZW50KVwiPlxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zZWxlY3Rpb24tLW11bHRpcGxlXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtY2hlY2tib3ggKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwib25NZW1iZXJTZWxlY3RlZChncm91cE1lbWJlciwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXRhaWxWaWV3XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fc2NvcGVjaGFuZ2VcIiBzbG90PVwidGFpbFZpZXdcIj5cblxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbbW9yZUljb25VUkxdPVwibW9yZUljb25VUkxcIiAqbmdJZj1cImlzQXJyYXkoZ2V0T3B0aW9ucyhncm91cE1lbWJlcikpXCJcbiAgICAgICAgICAgICAgICBbdG9wTWVudVNpemVdPVwiMFwiIFtkYXRhXT1cImdldE9wdGlvbnMoZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cImhhbmRsZU1lbnVBY3Rpb24oJGV2ZW50LCBncm91cE1lbWJlcilcIiBbbWVudUxpc3RTdHlsZV09XCJtZW51TGlzdFN0eWxlXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCAqbmdJZj1cIiBpc1N0cmluZyhnZXRPcHRpb25zKGdyb3VwTWVtYmVyKSlcIiBbdGV4dF09XCJnZXRPcHRpb25zKGdyb3VwTWVtYmVyKVwiXG4gICAgICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwiZ2V0U2NvcGVTdHlsZSgpXCI+XG5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cblxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fY2xvc2VcIiAqbmdJZj1cImNsb3NlQnV0dG9uSWNvblVSTFwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImNsb3NlQnV0dG9uSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJjbG9zZUJ1dHRvblN0eWxlKClcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImNsb3NlQ2xpY2tlZCgpXCI+XG5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuPC9kaXY+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwiY2hhbmdlU2NvcGUgJiYgbWVtYmVyU2NvcGUubGVuZ3RoID4gMFwiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNvbWV0Y2hhdC1jaGFuZ2Utc2NvcGUgW2NoYW5nZVNjb3BlU3R5bGVdPVwiZ3JvdXBTY29wZVN0eWxlXCIgW29wdGlvbnNdPVwibWVtYmVyU2NvcGVcIiBbYXJyb3dJY29uVVJMXT1cImRyb3Bkb3duSWNvblVSTFwiXG4gICAgKGNjLWNoYW5nZXNjb3BlLWNsb3NlLWNsaWNrZWQpPVwiY2hhbmdlU2NvcGUgPSBmYWxzZTtcIiAoY2MtY2hhbmdlc2NvcGUtY2hhbmdlZCk9XCJjaGFuZ2VNZW1iZXJTY29wZSgkZXZlbnQpXCI+XG5cbiAgPC9jb21ldGNoYXQtY2hhbmdlLXNjb3BlPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+Il19