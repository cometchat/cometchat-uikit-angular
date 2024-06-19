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
        this.emptyStateText = localize("NO_USERS_FOUND");
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
        actionMessage.setMessage(`${this.loggedInUser?.getName()} ${action} ${actionOn.getName()}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFFVCxLQUFLLEVBRUwsdUJBQXVCLEdBSXhCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQ0wsV0FBVyxFQUNYLGFBQWEsRUFDYixnQkFBZ0IsRUFDaEIsYUFBYSxHQUVkLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUNMLGdCQUFnQixFQUNoQixpQkFBaUIsRUFHakIscUJBQXFCLEdBQ3RCLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUVMLFVBQVUsRUFDVixRQUFRLEVBRVIsb0JBQW9CLEVBQ3BCLHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFDZCxxQkFBcUIsR0FDdEIsTUFBTSw0QkFBNEIsQ0FBQztBQUVwQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQzs7Ozs7QUFDMUU7Ozs7Ozs7O0dBUUc7QUFPSCxNQUFNLE9BQU8sOEJBQThCO0lBdUl6QyxZQUNVLEdBQXNCLEVBQ3RCLFlBQW1DO1FBRG5DLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FB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QWE7c0JBQXJCLEtBQUs7Z0JBTUcsTUFBTTtzQkFBZCxLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUlHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBTUcsV0FBVztzQkFBbkIsS0FBSztnQkFLRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBTUcsZUFBZTtzQkFBdkIsS0FBSztnQkFJRyxhQUFhO3NCQUFyQixLQUFLO2dCQVlHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFFRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBd0JHLGFBQWE7c0JBQXJCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIE9uSW5pdCxcbiAgSW5wdXQsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgVGVtcGxhdGVSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IFN1YmplY3QsIFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbiAgQ2hhbmdlU2NvcGVTdHlsZSxcbiAgTWVudUxpc3RTdHlsZSxcbiAgQmFja2Ryb3BTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7XG4gIEdyb3VwTWVtYmVyVXRpbHMsXG4gIEdyb3VwTWVtYmVyc1N0eWxlLFxuICBMaXN0U3R5bGUsXG4gIEJhc2VTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFRoZW1lLFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIFNlbGVjdGlvbk1vZGUsXG4gIFN0YXRlcyxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIFVzZXJQcmVzZW5jZVBsYWNlbWVudCxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuLyoqXG4gKlxuICogIENvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudCBpcyB1c2VkIHRvIHJlbmRlciBsaXN0IG9mIGdyb3VwIG1lbWJlcnNcbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtZ3JvdXAtbWVtYmVyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtZ3JvdXAtbWVtYmVycy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHRhaWxWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOlxuICAgIHwgKChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4gQ29tZXRDaGF0T3B0aW9uW10pXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgY2xvc2VCdXR0b25JY29uVVJMOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiO1xuICBASW5wdXQoKSBzaG93QmFja0J1dHRvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IFwiU2VhcmNoIE1lbWJlcnNcIjtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcj86ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuICBASW5wdXQoKSBvbkJhY2shOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkNsb3NlITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAoXG4gICAgZ3JvdXBNZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcixcbiAgICBzZWxlY3RlZDogYm9vbGVhblxuICApID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19VU0VSU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5jZW50ZXI7XG4gIEBJbnB1dCgpIGRyb3Bkb3duSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvZG93bi1hcnJvdy5zdmdcIjtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgfTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGdyb3VwTWVtYmVyc1N0eWxlOiBHcm91cE1lbWJlcnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBncm91cFNjb3BlU3R5bGU6IENoYW5nZVNjb3BlU3R5bGUgPSBuZXcgQ2hhbmdlU2NvcGVTdHlsZSh7XG4gICAgaGVpZ2h0OiBcIjIwMHB4XCIsXG4gICAgd2lkdGg6IFwiMjgwcHhcIixcbiAgfSk7XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImdyZXlcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiYSgyMjIgMjIyIDIyMiAvIDQ2JSlcIixcbiAgfTtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAodXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkVtcHR5PzogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgdXNlclByZXNlbmNlUGxhY2VtZW50OiBVc2VyUHJlc2VuY2VQbGFjZW1lbnQgPVxuICAgIFVzZXJQcmVzZW5jZVBsYWNlbWVudC5ib3R0b207XG4gIEBJbnB1dCgpIGRpc2FibGVMb2FkaW5nU3RhdGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSB7fTtcbiAgbWVudUxpc3RTdHlsZTogTWVudUxpc3RTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICAgIHN1Ym1lbnVXaWR0aDogXCIxMDAlXCIsXG4gICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgc3VibWVudUJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudUJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBtb3JlSWNvblRpbnQ6IFwicmdiKDUxLCAxNTMsIDI1NSlcIixcbiAgfTtcbiAgbW9kYWxTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyMTJweFwiLFxuICAgIHdpZHRoOiBcIjM2MHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgbW9yZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL21vcmVpY29uLnN2Z1wiO1xuICBASW5wdXQoKSBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBvblNjcm9sbGVkVG9Cb3R0b206IGFueSA9IG51bGw7XG4gIHB1YmxpYyBpc1N0cmluZyA9IChkYXRhOiBhbnkpID0+IHR5cGVvZiBkYXRhID09IFwic3RyaW5nXCI7XG4gIHB1YmxpYyBpc0FycmF5ID0gKGRhdGE6IGFueSkgPT4gdHlwZW9mIGRhdGEgPT0gXCJvYmplY3RcIiAmJiBkYXRhPy5sZW5ndGggPiAwO1xuICBwdWJsaWMgZ2V0T3B0aW9ucyA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgIGxldCBvcHRpb25zID0gR3JvdXBNZW1iZXJVdGlscy5nZXRWaWV3TWVtYmVyT3B0aW9ucyhcbiAgICAgIG1lbWJlcixcbiAgICAgIHRoaXMuZ3JvdXAsXG4gICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCksXG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZVxuICAgICk7XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH07XG4gIHNlbGVjdGVkTWVtYmVyITogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyIHwgbnVsbDtcbiAgdGl0bGVBbGlnbm1lbnRFbnVtOiB0eXBlb2YgVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudDtcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgcHVibGljIGdyb3Vwc1JlcXVlc3Q6IGFueTtcbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIHRpbWVvdXQ6IGFueTtcbiAgcHVibGljIGdyb3VwTWVtYmVyczogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10gPSBbXTtcbiAgcHVibGljIHNjb3Blczogc3RyaW5nW10gPSBbXTtcbiAgcHVibGljIG1lbWJlcnNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcIm1lbWJlcmxpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBjaGFuZ2VTY29wZTogYm9vbGVhbiA9IGZhbHNlO1xuICBmZXRjaGluZ0dyb3VwczogYm9vbGVhbiA9IGZhbHNlO1xuICBmZXRjaFRpbWVPdXQ6IGFueTtcbiAgcHVibGljIHByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2VcbiAgKSB7IH1cblxuICBwdWJsaWMgbWVtYmVyU2NvcGU6IGFueVtdID0gW107XG4gIG1lbWJlcnNMaXN0OiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFtdO1xuXG4gIGNsb3NlQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKTtcbiAgICB9XG4gIH1cbiAgYmFja0NsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25CYWNrKSB7XG4gICAgICB0aGlzLm9uQmFjaygpO1xuICAgIH1cbiAgfVxuICBvbkNsaWNrID0gKGdyb3VwTWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayhncm91cE1lbWJlcik7XG4gICAgfVxuICB9O1xuICBvbk1lbWJlclNlbGVjdGVkKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQ/LmRldGFpbD8uY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdChtZW1iZXIsIHNlbGVjdGVkKTtcbiAgICB9XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycztcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgaWYgKCF0aGlzLmZldGNoaW5nR3JvdXBzKSB7XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1wic2VhcmNoS2V5d29yZFwiXSkge1xuICAgICAgdGhpcy5zZWFyY2hLZXlXb3JkVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIHNlYXJjaEtleVdvcmRVcGRhdGVkID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLmZldGNoaW5nR3JvdXBzKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5mZXRjaFRpbWVPdXQpO1xuICAgICAgdGhpcy5mZXRjaFRpbWVPdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zZWFyY2hGb3JHcm91cE1lbWJlcnMoKTtcbiAgICAgIH0sIDgwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2VhcmNoRm9yR3JvdXBNZW1iZXJzKCk7XG4gICAgfVxuICB9O1xuXG4gIHNlYXJjaEZvckdyb3VwTWVtYmVycyA9ICgpID0+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlclxuICAgICAgPyB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKS5idWlsZCgpXG4gICAgICA6IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgPSByZXF1ZXN0O1xuICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFtdO1xuICAgIH1cbiAgICB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycygpO1xuICB9O1xuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwTWVtYmVyfSBtZW1iZXJcbiAgICovXG4gIGdldFN0YXR1c0luZGljYXRvckNvbG9yID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlKSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1lbWJlcj8uZ2V0U3RhdHVzKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLm9ubGluZVN0YXR1c0NvbG9yIHx8XG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKClcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgY2hhbmdlTWVtYmVyU2NvcGUoZXZlbnQ6IGFueSkge1xuICAgIENvbWV0Q2hhdC51cGRhdGVHcm91cE1lbWJlclNjb3BlKFxuICAgICAgdGhpcy5ncm91cC5nZXRHdWlkKCksXG4gICAgICB0aGlzLnNlbGVjdGVkTWVtYmVyIS5nZXRVaWQoKSxcbiAgICAgIGV2ZW50Py5kZXRhaWw/LnZhbHVlXG4gICAgKVxuICAgICAgLnRoZW4oKG1lbWJlcjogYm9vbGVhbikgPT4ge1xuICAgICAgICBsZXQgc2NvcGU6IGFueSA9IGV2ZW50Py5kZXRhaWw/LnZhbHVlO1xuICAgICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXI/LnNldFNjb3BlKHNjb3BlKTtcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5zZWxlY3RlZE1lbWJlcik7XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQubmV4dCh7XG4gICAgICAgICAgc2NvcGVDaGFuZ2VkRnJvbTogdGhpcy5zZWxlY3RlZE1lbWJlcj8uZ2V0U2NvcGUoKSxcbiAgICAgICAgICBzY29wZUNoYW5nZWRUbzogc2NvcGUsXG4gICAgICAgICAgbWVzc2FnZTogdGhpcy5jcmVhdGVBY3Rpb25NZXNzYWdlKFxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE1lbWJlciEsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0VcbiAgICAgICAgICApLFxuICAgICAgICAgIGdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIHVwZGF0ZWRVc2VyOiB0aGlzLnNlbGVjdGVkTWVtYmVyISxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkTWVtYmVyID0gbnVsbDtcbiAgICAgIH0pO1xuICB9XG4gIGhhbmRsZU1lbnVBY3Rpb24gPSAobWVudTogYW55LCBncm91cE1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgaWYgKG1lbnU/LmRldGFpbD8uZGF0YT8ub25DbGljaykge1xuICAgICAgbWVudT8uZGV0YWlsPy5kYXRhPy5vbkNsaWNrKGdyb3VwTWVtYmVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGlkID0gbWVudT8uZGV0YWlsPy5kYXRhPy5pZDtcbiAgICB0aGlzLnNlbGVjdGVkTWVtYmVyID0gZ3JvdXBNZW1iZXI7XG4gICAgdGhpcy5tZW1iZXJTY29wZSA9IEdyb3VwTWVtYmVyVXRpbHMuYWxsb3dTY29wZUNoYW5nZShcbiAgICAgIHRoaXMuZ3JvdXAsXG4gICAgICBncm91cE1lbWJlclxuICAgICk7XG4gICAgaWYgKGlkID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwTWVtYmVyT3B0aW9ucy5jaGFuZ2VTY29wZSkge1xuICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IHRydWU7XG4gICAgICB0aGlzLnNjb3BlcyA9IFtdO1xuICAgIH0gZWxzZSBpZiAoaWQgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBNZW1iZXJPcHRpb25zLmJhbikge1xuICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IGZhbHNlO1xuICAgICAgdGhpcy5ibG9ja01lbWJlcihncm91cE1lbWJlcik7XG4gICAgfSBlbHNlIGlmIChpZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE1lbWJlck9wdGlvbnMua2ljaykge1xuICAgICAgdGhpcy5raWNrTWVtYmVyKGdyb3VwTWVtYmVyKTtcbiAgICB9XG4gIH07XG4gIGJsb2NrTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgQ29tZXRDaGF0LmJhbkdyb3VwTWVtYmVyKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBtZW1iZXIuZ2V0VWlkKCkpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSAtIDEpO1xuICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobWVtYmVyKTtcbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQubmV4dCh7XG4gICAgICAgIGtpY2tlZEJ5OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgIGtpY2tlZEZyb206IHRoaXMuZ3JvdXAhLFxuICAgICAgICBraWNrZWRVc2VyOiBtZW1iZXIsXG4gICAgICAgIG1lc3NhZ2U6IHRoaXMuY3JlYXRlQWN0aW9uTWVzc2FnZShcbiAgICAgICAgICBtZW1iZXIsXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVEXG4gICAgICAgICksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBhY3Rpb246IHN0cmluZykge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24oXG4gICAgICB0aGlzLmdyb3VwLmdldEd1aWQoKSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcixcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uIGFzIGFueVxuICAgICk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25Gb3IodGhpcy5ncm91cCk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25Pbik7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TWVzc2FnZShcbiAgICAgIGAke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9ICR7YWN0aW9ufSAke2FjdGlvbk9uLmdldE5hbWUoKX1gXG4gICAgKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyVHlwZShcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICApO1xuICAgIChhY3Rpb25NZXNzYWdlIGFzIGFueSkuZGF0YSA9IHtcbiAgICAgIGV4dHJhczoge1xuICAgICAgICBzY29wZToge1xuICAgICAgICAgIG5ldzogYWN0aW9uT24uZ2V0U2NvcGUoKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4gYWN0aW9uTWVzc2FnZTtcbiAgfVxuICBraWNrTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgQ29tZXRDaGF0LmtpY2tHcm91cE1lbWJlcih0aGlzLmdyb3VwLmdldEd1aWQoKSwgbWVtYmVyLmdldFVpZCgpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmdyb3VwLnNldE1lbWJlcnNDb3VudCh0aGlzLmdyb3VwLmdldE1lbWJlcnNDb3VudCgpIC0gMSk7XG4gICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKG1lbWJlcik7XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQubmV4dCh7XG4gICAgICAgICAga2lja2VkQnk6IHRoaXMubG9nZ2VkSW5Vc2VyISxcbiAgICAgICAgICBraWNrZWRGcm9tOiB0aGlzLmdyb3VwISxcbiAgICAgICAgICBraWNrZWRVc2VyOiBtZW1iZXIsXG4gICAgICAgICAgbWVzc2FnZTogdGhpcy5jcmVhdGVBY3Rpb25NZXNzYWdlKFxuICAgICAgICAgICAgbWVtYmVyLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VEXG4gICAgICAgICAgKSxcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcn0gbWVtYmVyXG4gICAqL1xuICB1cGRhdGVNZW1iZXJTdGF0dXMgPSAobWVtYmVyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGxldCBtZW1iZXJsaXN0ID0gWy4uLnRoaXMuZ3JvdXBNZW1iZXJzXTtcbiAgICAvL3NlYXJjaCBmb3IgdXNlclxuICAgIGxldCB1c2VyS2V5ID0gbWVtYmVybGlzdC5maW5kSW5kZXgoXG4gICAgICAodTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBrKSA9PiB1LmdldFVpZCgpID09IG1lbWJlci5nZXRVaWQoKVxuICAgICk7XG4gICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgaWYgKHVzZXJLZXkgPiAtMSkge1xuICAgICAgbGV0IHVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciA9IG1lbWJlcmxpc3RbdXNlcktleV07XG4gICAgICB1c2VyLnNldFN0YXR1cyhtZW1iZXIuZ2V0U3RhdHVzKCkpO1xuICAgICAgbWVtYmVybGlzdC5zcGxpY2UodXNlcktleSwgMSwgdXNlcik7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi5tZW1iZXJsaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIHVwZGF0ZU1lbWJlciA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciB8IG51bGwpID0+IHtcbiAgICBsZXQgbWVtYmVybGlzdCA9IFsuLi50aGlzLmdyb3VwTWVtYmVyc107XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgdXNlcktleSA9IG1lbWJlcmxpc3QuZmluZEluZGV4KFxuICAgICAgKHU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgaykgPT4gdS5nZXRVaWQoKSA9PSBtZW1iZXIhLmdldFVpZCgpXG4gICAgKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICBsZXQgdXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gbWVtYmVybGlzdFt1c2VyS2V5XTtcbiAgICAgIG1lbWJlcmxpc3Quc3BsaWNlKHVzZXJLZXksIDEsIHVzZXIpO1xuICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbLi4ubWVtYmVybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgLy9BdHRhY2hpbmcgVXNlciBMaXN0ZW5lcnMgdG8gZHluYW1pbGNhbGx5IHVwZGF0ZSB3aGVuIGEgdXNlciBjb21lcyBvbmxpbmUgYW5kIGdvZXMgb2ZmbGluZVxuICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlclN0YXR1cyhvbmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlclN0YXR1cyhvZmZsaW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Hcm91cExpc3RlbmVyKHtcbiAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgY2hhbmdlZFVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcixcbiAgICAgICAgICBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIGNoYW5nZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGlmIChjaGFuZ2VkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGNoYW5nZWRHcm91cC5zZXRTY29wZShuZXdTY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKGNoYW5nZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGtpY2tlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBraWNrZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIoa2lja2VkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBiYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBiYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgYmFubmVkRnJvbTogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKGJhbm5lZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlclVuYmFubmVkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICB1bmJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVuYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVuYmFubmVkRnJvbTogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGlmICh1bmJhbm5lZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICB1bmJhbm5lZEZyb20uc2V0SGFzSm9pbmVkKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIodW5iYW5uZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uTWVtYmVyQWRkZWRUb0dyb3VwOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICB1c2VyQWRkZWQ6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVzZXJBZGRlZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICB1c2VyQWRkZWRJbjogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGxldCBtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciA9IG5ldyBDb21ldENoYXQuR3JvdXBNZW1iZXIoXG4gICAgICAgICAgICB1c2VyQWRkZWQuZ2V0VWlkKCksXG4gICAgICAgICAgICBDb21ldENoYXQuR1JPVVBfTUVNQkVSX1NDT1BFLlBBUlRJQ0lQQU5UXG4gICAgICAgICAgKTtcbiAgICAgICAgICBtZW1iZXIuc2V0TmFtZSh1c2VyQWRkZWQuZ2V0TmFtZSgpKTtcbiAgICAgICAgICBtZW1iZXIuc2V0R3VpZCh0aGlzLmdyb3VwLmdldEd1aWQoKSk7XG4gICAgICAgICAgbWVtYmVyLnNldFVpZCh1c2VyQWRkZWQuZ2V0VWlkKCkpO1xuICAgICAgICAgIGlmICh1c2VyQWRkZWQuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICB1c2VyQWRkZWRJbi5zZXRIYXNKb2luZWQodHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKG1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBsZWF2aW5nVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAobGVhdmluZ1VzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICBncm91cC5zZXRIYXNKb2luZWQoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihsZWF2aW5nVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBqb2luZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBqb2luZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKGpvaW5lZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMubWVtYmVyc0xpc3RlbmVySWQpO1xuICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQgPSBcIlwiO1xuICB9XG4gIGFkZFJlbW92ZU1lbWJlciA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgIGxldCBtZW1iZXJsaXN0ID0gWy4uLnRoaXMuZ3JvdXBNZW1iZXJzXTtcbiAgICAvL3NlYXJjaCBmb3IgdXNlclxuICAgIGxldCBtZW1iZXJLZXkgPSBtZW1iZXJsaXN0LmZpbmRJbmRleChcbiAgICAgICh1OiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gbWVtYmVyLmdldFVpZCgpXG4gICAgKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAobWVtYmVyS2V5ID4gLTEpIHtcbiAgICAgIG1lbWJlcmxpc3Quc3BsaWNlKG1lbWJlcktleSwgMSk7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi5tZW1iZXJsaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ncm91cE1lbWJlcnMucHVzaChtZW1iZXIpO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgZmV0Y2hOZXh0R3JvdXBNZW1iZXJzID0gKCkgPT4ge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgJiZcbiAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdC5wYWdpbmF0aW9uICYmXG4gICAgICAodGhpcy5ncm91cHNSZXF1ZXN0LnBhZ2luYXRpb24uY3VycmVudF9wYWdlID09IDAgfHxcbiAgICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0LnBhZ2luYXRpb24uY3VycmVudF9wYWdlICE9XG4gICAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdC5wYWdpbmF0aW9uLnRvdGFsX3BhZ2VzKVxuICAgICkge1xuICAgICAgdGhpcy5mZXRjaGluZ0dyb3VwcyA9IHRydWU7XG4gICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0R3JvdXBNZW1iZXJzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0LmZldGNoTmV4dCgpLnRoZW4oXG4gICAgICAgICAgKGdyb3VwTWVtYmVyczogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10pID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChncm91cE1lbWJlcnMubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub25FbXB0eSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25FbXB0eSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gJyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgZ3JvdXBNZW1iZXJzLmxlbmd0aCA8PSAwICYmXG4gICAgICAgICAgICAgICh0aGlzLmdyb3VwTWVtYmVycz8ubGVuZ3RoIDw9IDApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi50aGlzLmdyb3VwTWVtYmVycywgLi4uZ3JvdXBNZW1iZXJzXTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWFyY2hLZXl3b3JkICE9IHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkIHx8XG4gICAgICAgICAgICAgICAgICBbMCwgMV0uaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLmdyb3Vwc1JlcXVlc3QgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZVxuICAgICAgICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSB0aGlzLnNlYXJjaEtleXdvcmQ7XG4gICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IGdyb3VwTWVtYmVycztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbLi4udGhpcy5ncm91cE1lbWJlcnMsIC4uLmdyb3VwTWVtYmVyc107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZldGNoaW5nR3JvdXBzID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IHRoaXMuc2VhcmNoS2V5d29yZDtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB0aGlzLmZldGNoaW5nR3JvdXBzID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgdGhpcy5mZXRjaGluZ0dyb3VwcyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIGdldFJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmICghdGhpcy5zZWFyY2hLZXl3b3JkKSB7XG4gICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IFwiXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlclxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5ncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5XG4gICAqL1xuICBvblNlYXJjaCA9IChrZXk6IHN0cmluZykgPT4ge1xuICAgIHRoaXMuc2VhcmNoS2V5d29yZCA9IGtleTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgPSByZXF1ZXN0O1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbXTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmV0Y2hOZXh0R3JvdXBNZW1iZXJzKCk7XG4gICAgfSwgNTAwKTtcbiAgfTtcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEdyb3VwTWVtYmVyc1N0eWxlKCk7XG4gICAgdGhpcy5zZXRTY29wZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKCk7XG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpO1xuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKTtcbiAgICB0aGlzLm1lbnVMaXN0U3R5bGUgPSBuZXcgTWVudUxpc3RTdHlsZSh7XG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgc3VibWVudVdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgc3VibWVudUJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzdWJtZW51QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBtb3JlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIH0pO1xuICAgIHRoaXMubW9kYWxTdHlsZS5ib3hTaGFkb3cgPSBgMHB4IDBweCAxcHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpfWA7XG4gICAgdGhpcy5tb2RhbFN0eWxlLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCk7XG4gIH1cbiAgc2V0R3JvdXBNZW1iZXJzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogR3JvdXBNZW1iZXJzU3R5bGUgPSBuZXcgR3JvdXBNZW1iZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIm5vbmVcIixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgcGFkZGluZzogXCIwIDEwMHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmdyb3VwTWVtYmVyc1N0eWxlIH07XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnRpdGxlVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS50aXRsZVRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VwYXJhdG9yQ29sb3IsXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hJY29uVGludCxcbiAgICAgIHNlYXJjaEJvcmRlcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hCb3JkZXIsXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoQm9yZGVyUmFkaXVzLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hCYWNrZ3JvdW5kLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRGb250LFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3IsXG4gICAgICBzZWFyY2hUZXh0Rm9udDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hUZXh0Q29sb3IsXG4gICAgfTtcbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfTtcbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH07XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRTY29wZVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENoYW5nZVNjb3BlU3R5bGUgPSBuZXcgQ2hhbmdlU2NvcGVTdHlsZSh7XG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgYWN0aXZlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlVGV4dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBhcnJvd0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBvcHRpb25Cb3JkZXI6IFwibm9uZVwiLFxuICAgICAgb3B0aW9uQm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGhvdmVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgaG92ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBob3ZlclRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBidXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMjAwcHhcIixcbiAgICAgIHdpZHRoOiBcIjI4MHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5ncm91cFNjb3BlU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5ncm91cFNjb3BlU3R5bGUgfTtcbiAgfVxuICBtZW1iZXJzU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmc6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUucGFkZGluZyxcbiAgICB9O1xuICB9O1xuICAvLyBzdHlsZXNcbiAgYmFja0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5iYWNrQnV0dG9uSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfTtcbiAgfTtcbiAgY2xvc2VCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9O1xuICB9O1xuICB3cmFwcGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYmFja2dyb3VuZCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG4gIGdldFNjb3BlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLmdyb3VwU2NvcGVTdHlsZS50ZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5ncm91cFNjb3BlU3R5bGUudGV4dENvbG9yLFxuICAgIH07XG4gIH07XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc1wiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19iYWNrXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIiBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIiAqbmdJZj1cInNob3dCYWNrQnV0dG9uXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJiYWNrQ2xpY2tlZCgpXCI+XG5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fd3JhcHBlclwiIFtuZ1N0eWxlXT1cIm1lbWJlcnNTdHlsZSgpXCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX21lbnVzXCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudVwiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gICAgPGNvbWV0Y2hhdC1saXN0IFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiXG4gICAgICBbb25TZWFyY2hdPVwib25TZWFyY2hcIiBbbGlzdF09XCJncm91cE1lbWJlcnNcIiBbc2VhcmNoVGV4dF09XCJzZWFyY2hLZXl3b3JkXCJcbiAgICAgIFtzZWFyY2hQbGFjZWhvbGRlclRleHRdPVwic2VhcmNoUGxhY2Vob2xkZXJcIiBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCIgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiXG4gICAgICBbdGl0bGVdPVwidGl0bGVcIiBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIiBbbG9hZGluZ0ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIlxuICAgICAgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCIgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiXG4gICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiIFtzdGF0ZV09XCJzdGF0ZVwiPlxuICAgIDwvY29tZXRjaGF0LWxpc3Q+XG4gICAgPG5nLXRlbXBsYXRlICNsaXN0SXRlbSBsZXQtZ3JvdXBNZW1iZXI+XG4gICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwiZ3JvdXBNZW1iZXI/Lm5hbWVcIiBbYXZhdGFyVVJMXT1cImdyb3VwTWVtYmVyPy5hdmF0YXJcIlxuICAgICAgICBbYXZhdGFyTmFtZV09XCJncm91cE1lbWJlcj8ubmFtZVwiIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIiBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2soZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgW3VzZXJQcmVzZW5jZVBsYWNlbWVudF09XCJ1c2VyUHJlc2VuY2VQbGFjZW1lbnRcIj5cbiAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX3N1YnRpdGxlLXZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiIGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fb3B0aW9uc1wiICpuZ0lmPVwiICF0YWlsVmlldyAmJiBvcHRpb25zXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhncm91cE1lbWJlcilcIiBbbWVudUxpc3RTdHlsZV09XCJtZW51TGlzdFN0eWxlXCJcbiAgICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwiaGFuZGxlTWVudUFjdGlvbigkZXZlbnQsIGdyb3VwTWVtYmVyKVwiPjwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX190YWlsLXZpZXdcIj5cblxuICAgICAgICAgIDxkaXYgKm5nSWY9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IGdyb3VwTWVtYmVyIH1cIj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zZWxlY3Rpb24tLXNpbmdsZVwiPlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25NZW1iZXJTZWxlY3RlZChncm91cE1lbWJlciwkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX3NlbGVjdGlvbi0tbXVsdGlwbGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbk1lbWJlclNlbGVjdGVkKGdyb3VwTWVtYmVyLCRldmVudClcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgKm5nSWY9XCIhdGFpbFZpZXdcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zY29wZWNoYW5nZVwiIHNsb3Q9XCJ0YWlsVmlld1wiPlxuXG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFttb3JlSWNvblVSTF09XCJtb3JlSWNvblVSTFwiICpuZ0lmPVwiaXNBcnJheShnZXRPcHRpb25zKGdyb3VwTWVtYmVyKSlcIlxuICAgICAgICAgICAgICAgIFt0b3BNZW51U2l6ZV09XCIwXCIgW2RhdGFdPVwiZ2V0T3B0aW9ucyhncm91cE1lbWJlcilcIlxuICAgICAgICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwiaGFuZGxlTWVudUFjdGlvbigkZXZlbnQsIGdyb3VwTWVtYmVyKVwiIFttZW51TGlzdFN0eWxlXT1cIm1lbnVMaXN0U3R5bGVcIj5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsICpuZ0lmPVwiIGlzU3RyaW5nKGdldE9wdGlvbnMoZ3JvdXBNZW1iZXIpKVwiIFt0ZXh0XT1cImdldE9wdGlvbnMoZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJnZXRTY29wZVN0eWxlKClcIj5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cblxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuXG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19jbG9zZVwiICpuZ0lmPVwiY2xvc2VCdXR0b25JY29uVVJMXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGUoKVwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY2xvc2VDbGlja2VkKClcIj5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG48L2Rpdj5cbjxjb21ldGNoYXQtYmFja2Ryb3AgKm5nSWY9XCJjaGFuZ2VTY29wZSAmJiBtZW1iZXJTY29wZS5sZW5ndGggPiAwXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y29tZXRjaGF0LWNoYW5nZS1zY29wZSBbY2hhbmdlU2NvcGVTdHlsZV09XCJncm91cFNjb3BlU3R5bGVcIiBbb3B0aW9uc109XCJtZW1iZXJTY29wZVwiIFthcnJvd0ljb25VUkxdPVwiZHJvcGRvd25JY29uVVJMXCJcbiAgICAoY2MtY2hhbmdlc2NvcGUtY2xvc2UtY2xpY2tlZCk9XCJjaGFuZ2VTY29wZSA9IGZhbHNlO1wiIChjYy1jaGFuZ2VzY29wZS1jaGFuZ2VkKT1cImNoYW5nZU1lbWJlclNjb3BlKCRldmVudClcIj5cblxuICA8L2NvbWV0Y2hhdC1jaGFuZ2Utc2NvcGU+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD4iXX0=