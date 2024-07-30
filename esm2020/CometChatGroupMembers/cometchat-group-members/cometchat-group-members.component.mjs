import { AvatarStyle, ChangeScopeStyle, ListItemStyle, MenuListStyle, } from "@cometchat/uikit-elements";
import { CometChatUIKitUtility, GroupMemberUtils, GroupMembersStyle, } from "@cometchat/uikit-shared";
import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { CometChatGroupEvents, CometChatUIKitConstants, SelectionMode, States, TitleAlignment, UserPresencePlacement, fontHelper, localize, } from "@cometchat/uikit-resources";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { MessageUtils } from "../../Shared/Utils/MessageUtils";
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
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.themeService.theme.palette.getAccent(),
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
            let userStatusVisibility = new MessageUtils().getUserStatusVisibility(member) || this.disableUsersPresence;
            if (!userStatusVisibility) {
                return this.groupMembersStyle.onlineStatusColor ?? this.themeService.theme.palette.getSuccess();
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
        const messageUtils = new MessageUtils();
        let actionMessage = new CometChat.Action(this.group.getGuid(), CometChatUIKitConstants.MessageTypes.groupMember, CometChatUIKitConstants.MessageReceiverType.group, CometChatUIKitConstants.MessageCategory.action);
        actionMessage.setAction(action);
        actionMessage.setActionBy(this.loggedInUser);
        actionMessage.setActionFor(this.group);
        actionMessage.setActionOn(actionOn);
        actionMessage.setReceiver(this.group);
        actionMessage.setSender(this.loggedInUser);
        actionMessage.setConversationId("group_" + this.group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
        actionMessage.data = {
            extras: {
                scope: {
                    new: actionOn.getScope(),
                },
            },
        };
        actionMessage.setNewScope(actionOn.getScope());
        actionMessage.setMessage(messageUtils.getActionMessage(actionMessage));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFdBQVcsRUFFWCxnQkFBZ0IsRUFDaEIsYUFBYSxFQUNiLGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFFTCxxQkFBcUIsRUFDckIsZ0JBQWdCLEVBQ2hCLGlCQUFpQixHQUVsQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFDTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUNULEtBQUssR0FLTixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsb0JBQW9CLEVBR3BCLHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFDZCxxQkFBcUIsRUFDckIsVUFBVSxFQUNWLFFBQVEsR0FDVCxNQUFNLDRCQUE0QixDQUFDO0FBR3BDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUUxRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7O0FBRS9EOzs7Ozs7OztHQVFHO0FBT0gsTUFBTSxPQUFPLDhCQUE4QjtJQXVJekMsWUFDVSxHQUFz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YTtzQkFBckIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFLRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLE1BQU07c0JBQWQsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csUUFBUTtzQkFBaEIsS0FBSztnQkFJRyxLQUFLO3NCQUFiLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQU1HLFdBQVc7c0JBQW5CLEtBQUs7Z0JBS0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQU1HLGVBQWU7c0JBQXZCLEtBQUs7Z0JBSUcsYUFBYTtzQkFBckIsS0FBSztnQkFZRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBRUcsbUJBQW1CO3NCQUEzQixLQUFLO2dCQXdCRyxhQUFhO3NCQUFyQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIENoYW5nZVNjb3BlU3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG4gIE1lbnVMaXN0U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQge1xuICBCYXNlU3R5bGUsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbiAgR3JvdXBNZW1iZXJVdGlscyxcbiAgR3JvdXBNZW1iZXJzU3R5bGUsXG4gIExpc3RTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdEdyb3VwRXZlbnRzLFxuICBDb21ldENoYXRPcHRpb24sXG4gIENvbWV0Q2hhdFRoZW1lLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgU2VsZWN0aW9uTW9kZSxcbiAgU3RhdGVzLFxuICBUaXRsZUFsaWdubWVudCxcbiAgVXNlclByZXNlbmNlUGxhY2VtZW50LFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBTdWJqZWN0LCBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgTWVzc2FnZVV0aWxzIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9NZXNzYWdlVXRpbHNcIjtcblxuLyoqXG4gKlxuICogIENvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudCBpcyB1c2VkIHRvIHJlbmRlciBsaXN0IG9mIGdyb3VwIG1lbWJlcnNcbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtZ3JvdXAtbWVtYmVyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtZ3JvdXAtbWVtYmVycy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHRhaWxWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOlxuICAgIHwgKChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4gQ29tZXRDaGF0T3B0aW9uW10pXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgY2xvc2VCdXR0b25JY29uVVJMOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiO1xuICBASW5wdXQoKSBzaG93QmFja0J1dHRvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IFwiU2VhcmNoIE1lbWJlcnNcIjtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcj86ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuICBASW5wdXQoKSBvbkJhY2shOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkNsb3NlITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAoXG4gICAgZ3JvdXBNZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcixcbiAgICBzZWxlY3RlZDogYm9vbGVhblxuICApID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19VU0VSU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5jZW50ZXI7XG4gIEBJbnB1dCgpIGRyb3Bkb3duSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvZG93bi1hcnJvdy5zdmdcIjtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgfTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGdyb3VwTWVtYmVyc1N0eWxlOiBHcm91cE1lbWJlcnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBncm91cFNjb3BlU3R5bGU6IENoYW5nZVNjb3BlU3R5bGUgPSBuZXcgQ2hhbmdlU2NvcGVTdHlsZSh7XG4gICAgaGVpZ2h0OiBcIjIwMHB4XCIsXG4gICAgd2lkdGg6IFwiMjgwcHhcIixcbiAgfSk7XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImdyZXlcIixcbiAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYmEoMjIyIDIyMiAyMjIgLyA0NiUpXCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKHVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4gdm9pZDtcbiAgQElucHV0KCkgb25FbXB0eT86ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHVzZXJQcmVzZW5jZVBsYWNlbWVudDogVXNlclByZXNlbmNlUGxhY2VtZW50ID1cbiAgICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQuYm90dG9tO1xuICBASW5wdXQoKSBkaXNhYmxlTG9hZGluZ1N0YXRlOiBib29sZWFuID0gZmFsc2U7XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge307XG4gIG1lbnVMaXN0U3R5bGU6IE1lbnVMaXN0U3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgbW9yZUljb25UaW50OiBcInJnYig1MSwgMTUzLCAyNTUpXCIsXG4gIH07XG4gIG1vZGFsU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjEycHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIG1vcmVJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9tb3JlaWNvbi5zdmdcIjtcbiAgQElucHV0KCkgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsO1xuICBwdWJsaWMgaXNTdHJpbmcgPSAoZGF0YTogYW55KSA9PiB0eXBlb2YgZGF0YSA9PSBcInN0cmluZ1wiO1xuICBwdWJsaWMgaXNBcnJheSA9IChkYXRhOiBhbnkpID0+IHR5cGVvZiBkYXRhID09IFwib2JqZWN0XCIgJiYgZGF0YT8ubGVuZ3RoID4gMDtcbiAgcHVibGljIGdldE9wdGlvbnMgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBsZXQgb3B0aW9ucyA9IEdyb3VwTWVtYmVyVXRpbHMuZ2V0Vmlld01lbWJlck9wdGlvbnMoXG4gICAgICBtZW1iZXIsXG4gICAgICB0aGlzLmdyb3VwLFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpLFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWVcbiAgICApO1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9O1xuICBzZWxlY3RlZE1lbWJlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciB8IG51bGw7XG4gIHRpdGxlQWxpZ25tZW50RW51bTogdHlwZW9mIFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQ7XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIHB1YmxpYyBncm91cHNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHB1YmxpYyBncm91cE1lbWJlcnM6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdID0gW107XG4gIHB1YmxpYyBzY29wZXM6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBtZW1iZXJzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJtZW1iZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgY2hhbmdlU2NvcGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hpbmdHcm91cHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hUaW1lT3V0OiBhbnk7XG4gIHB1YmxpYyBwcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkgeyB9XG5cbiAgcHVibGljIG1lbWJlclNjb3BlOiBhbnlbXSA9IFtdO1xuICBtZW1iZXJzTGlzdDogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10gPSBbXTtcblxuICBjbG9zZUNsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25DbG9zZSkge1xuICAgICAgdGhpcy5vbkNsb3NlKCk7XG4gICAgfVxuICB9XG4gIGJhY2tDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uQmFjaykge1xuICAgICAgdGhpcy5vbkJhY2soKTtcbiAgICB9XG4gIH1cbiAgb25DbGljayA9IChncm91cE1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soZ3JvdXBNZW1iZXIpO1xuICAgIH1cbiAgfTtcbiAgb25NZW1iZXJTZWxlY3RlZChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50Py5kZXRhaWw/LmNoZWNrZWQ7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QobWVtYmVyLCBzZWxlY3RlZCk7XG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnM7XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKTtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIGlmICghdGhpcy5mZXRjaGluZ0dyb3Vwcykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0R3JvdXBNZW1iZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlc1tcInNlYXJjaEtleXdvcmRcIl0pIHtcbiAgICAgIHRoaXMuc2VhcmNoS2V5V29yZFVwZGF0ZWQoKTtcbiAgICB9XG4gIH1cblxuICBzZWFyY2hLZXlXb3JkVXBkYXRlZCA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5mZXRjaGluZ0dyb3Vwcykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZmV0Y2hUaW1lT3V0KTtcbiAgICAgIHRoaXMuZmV0Y2hUaW1lT3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuc2VhcmNoRm9yR3JvdXBNZW1iZXJzKCk7XG4gICAgICB9LCA4MDApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlYXJjaEZvckdyb3VwTWVtYmVycygpO1xuICAgIH1cbiAgfTtcblxuICBzZWFyY2hGb3JHcm91cE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXJcbiAgICAgID8gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlci5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZCkuYnVpbGQoKVxuICAgICAgOiB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgdGhpcy5ncm91cHNSZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnMoKTtcbiAgfTtcblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cE1lbWJlcn0gbWVtYmVyXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvciA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eShtZW1iZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG4gICAgaWYgKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUub25saW5lU3RhdHVzQ29sb3IgPz8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuICBjaGFuZ2VNZW1iZXJTY29wZShldmVudDogYW55KSB7XG4gICAgQ29tZXRDaGF0LnVwZGF0ZUdyb3VwTWVtYmVyU2NvcGUoXG4gICAgICB0aGlzLmdyb3VwLmdldEd1aWQoKSxcbiAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIhLmdldFVpZCgpLFxuICAgICAgZXZlbnQ/LmRldGFpbD8udmFsdWVcbiAgICApXG4gICAgICAudGhlbigobWVtYmVyOiBib29sZWFuKSA9PiB7XG4gICAgICAgIGxldCBzY29wZTogYW55ID0gZXZlbnQ/LmRldGFpbD8udmFsdWU7XG4gICAgICAgIHRoaXMuY2hhbmdlU2NvcGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE1lbWJlcj8uc2V0U2NvcGUoc2NvcGUpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLnNlbGVjdGVkTWVtYmVyKTtcbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZC5uZXh0KHtcbiAgICAgICAgICBzY29wZUNoYW5nZWRGcm9tOiB0aGlzLnNlbGVjdGVkTWVtYmVyPy5nZXRTY29wZSgpLFxuICAgICAgICAgIHNjb3BlQ2hhbmdlZFRvOiBzY29wZSxcbiAgICAgICAgICBtZXNzYWdlOiB0aGlzLmNyZWF0ZUFjdGlvbk1lc3NhZ2UoXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkTWVtYmVyISxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRVxuICAgICAgICAgICksXG4gICAgICAgICAgZ3JvdXA6IHRoaXMuZ3JvdXAsXG4gICAgICAgICAgdXBkYXRlZFVzZXI6IHRoaXMuc2VsZWN0ZWRNZW1iZXIhLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE1lbWJlciA9IG51bGw7XG4gICAgICAgIHRoaXMuY2hhbmdlU2NvcGUgPSBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIgPSBudWxsO1xuICAgICAgfSk7XG4gIH1cbiAgaGFuZGxlTWVudUFjdGlvbiA9IChtZW51OiBhbnksIGdyb3VwTWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBpZiAobWVudT8uZGV0YWlsPy5kYXRhPy5vbkNsaWNrKSB7XG4gICAgICBtZW51Py5kZXRhaWw/LmRhdGE/Lm9uQ2xpY2soZ3JvdXBNZW1iZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgaWQgPSBtZW51Py5kZXRhaWw/LmRhdGE/LmlkO1xuICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIgPSBncm91cE1lbWJlcjtcbiAgICB0aGlzLm1lbWJlclNjb3BlID0gR3JvdXBNZW1iZXJVdGlscy5hbGxvd1Njb3BlQ2hhbmdlKFxuICAgICAgdGhpcy5ncm91cCxcbiAgICAgIGdyb3VwTWVtYmVyXG4gICAgKTtcbiAgICBpZiAoaWQgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBNZW1iZXJPcHRpb25zLmNoYW5nZVNjb3BlKSB7XG4gICAgICB0aGlzLmNoYW5nZVNjb3BlID0gdHJ1ZTtcbiAgICAgIHRoaXMuc2NvcGVzID0gW107XG4gICAgfSBlbHNlIGlmIChpZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE1lbWJlck9wdGlvbnMuYmFuKSB7XG4gICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICB0aGlzLmJsb2NrTWVtYmVyKGdyb3VwTWVtYmVyKTtcbiAgICB9IGVsc2UgaWYgKGlkID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwTWVtYmVyT3B0aW9ucy5raWNrKSB7XG4gICAgICB0aGlzLmtpY2tNZW1iZXIoZ3JvdXBNZW1iZXIpO1xuICAgIH1cbiAgfTtcbiAgYmxvY2tNZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBDb21ldENoYXQuYmFuR3JvdXBNZW1iZXIodGhpcy5ncm91cC5nZXRHdWlkKCksIG1lbWJlci5nZXRVaWQoKSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmdyb3VwLnNldE1lbWJlcnNDb3VudCh0aGlzLmdyb3VwLmdldE1lbWJlcnNDb3VudCgpIC0gMSk7XG4gICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihtZW1iZXIpO1xuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5uZXh0KHtcbiAgICAgICAga2lja2VkQnk6IHRoaXMubG9nZ2VkSW5Vc2VyISxcbiAgICAgICAga2lja2VkRnJvbTogdGhpcy5ncm91cCEsXG4gICAgICAgIGtpY2tlZFVzZXI6IG1lbWJlcixcbiAgICAgICAgbWVzc2FnZTogdGhpcy5jcmVhdGVBY3Rpb25NZXNzYWdlKFxuICAgICAgICAgIG1lbWJlcixcbiAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORURcbiAgICAgICAgKSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuICBjcmVhdGVBY3Rpb25NZXNzYWdlKGFjdGlvbk9uOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGFjdGlvbjogc3RyaW5nKSB7XG5cbiAgICBjb25zdCBtZXNzYWdlVXRpbHMgPSBuZXcgTWVzc2FnZVV0aWxzKClcblxuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24oXG4gICAgICB0aGlzLmdyb3VwLmdldEd1aWQoKSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcixcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uIGFzIGFueVxuICAgICk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oYWN0aW9uKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25Gb3IodGhpcy5ncm91cCk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25Pbik7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0UmVjZWl2ZXJUeXBlKFxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICk7XG4gICAgKGFjdGlvbk1lc3NhZ2UgYXMgYW55KS5kYXRhID0ge1xuICAgICAgZXh0cmFzOiB7XG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgbmV3OiBhY3Rpb25Pbi5nZXRTY29wZSgpLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TmV3U2NvcGUoYWN0aW9uT24uZ2V0U2NvcGUoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UoXG4gICAgICBtZXNzYWdlVXRpbHMuZ2V0QWN0aW9uTWVzc2FnZShhY3Rpb25NZXNzYWdlKVxuICAgICk7XG4gICAgcmV0dXJuIGFjdGlvbk1lc3NhZ2U7XG4gIH1cbiAga2lja01lbWJlciA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgIENvbWV0Q2hhdC5raWNrR3JvdXBNZW1iZXIodGhpcy5ncm91cC5nZXRHdWlkKCksIG1lbWJlci5nZXRVaWQoKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSAtIDEpO1xuICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihtZW1iZXIpO1xuICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLm5leHQoe1xuICAgICAgICAgIGtpY2tlZEJ5OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgICAga2lja2VkRnJvbTogdGhpcy5ncm91cCEsXG4gICAgICAgICAga2lja2VkVXNlcjogbWVtYmVyLFxuICAgICAgICAgIG1lc3NhZ2U6IHRoaXMuY3JlYXRlQWN0aW9uTWVzc2FnZShcbiAgICAgICAgICAgIG1lbWJlcixcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRFxuICAgICAgICAgICksXG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ9IG1lbWJlclxuICAgKi9cbiAgdXBkYXRlTWVtYmVyU3RhdHVzID0gKG1lbWJlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBsZXQgbWVtYmVybGlzdCA9IFsuLi50aGlzLmdyb3VwTWVtYmVyc107XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgdXNlcktleSA9IG1lbWJlcmxpc3QuZmluZEluZGV4KFxuICAgICAgKHU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgaykgPT4gdS5nZXRVaWQoKSA9PSBtZW1iZXIuZ2V0VWlkKClcbiAgICApO1xuICAgIC8vaWYgZm91bmQgaW4gdGhlIGxpc3QsIHVwZGF0ZSB1c2VyIG9iamVjdFxuICAgIGlmICh1c2VyS2V5ID4gLTEpIHtcbiAgICAgIGxldCB1c2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSBtZW1iZXJsaXN0W3VzZXJLZXldO1xuICAgICAgdXNlci5zZXRTdGF0dXMobWVtYmVyLmdldFN0YXR1cygpKTtcbiAgICAgIG1lbWJlcmxpc3Quc3BsaWNlKHVzZXJLZXksIDEsIHVzZXIpO1xuICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbLi4ubWVtYmVybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICB1cGRhdGVNZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgfCBudWxsKSA9PiB7XG4gICAgbGV0IG1lbWJlcmxpc3QgPSBbLi4udGhpcy5ncm91cE1lbWJlcnNdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IHVzZXJLZXkgPSBtZW1iZXJsaXN0LmZpbmRJbmRleChcbiAgICAgICh1OiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gbWVtYmVyIS5nZXRVaWQoKVxuICAgICk7XG4gICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgaWYgKHVzZXJLZXkgPiAtMSkge1xuICAgICAgbGV0IHVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciA9IG1lbWJlcmxpc3RbdXNlcktleV07XG4gICAgICBtZW1iZXJsaXN0LnNwbGljZSh1c2VyS2V5LCAxLCB1c2VyKTtcbiAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIC8vQXR0YWNoaW5nIFVzZXIgTGlzdGVuZXJzIHRvIGR5bmFtaWxjYWxseSB1cGRhdGUgd2hlbiBhIHVzZXIgY29tZXMgb25saW5lIGFuZCBnb2VzIG9mZmxpbmVcbiAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgdGhpcy5tZW1iZXJzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXJTdGF0dXMob25saW5lVXNlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXJTdGF0dXMob2ZmbGluZVVzZXIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgdGhpcy5tZW1iZXJzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICBjaGFuZ2VkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAoY2hhbmdlZFVzZXIuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICBjaGFuZ2VkR3JvdXAuc2V0U2NvcGUobmV3U2NvcGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcihjaGFuZ2VkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBraWNrZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBraWNrZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAga2lja2VkRnJvbTogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKGtpY2tlZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckJhbm5lZDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGJhbm5lZEZyb206IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihiYW5uZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJVbmJhbm5lZDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgdW5iYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICB1bmJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICB1bmJhbm5lZEZyb206IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBpZiAodW5iYW5uZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgdW5iYW5uZWRGcm9tLnNldEhhc0pvaW5lZChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKHVuYmFubmVkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgdXNlckFkZGVkOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkSW46IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICBsZXQgbWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSBuZXcgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKFxuICAgICAgICAgICAgdXNlckFkZGVkLmdldFVpZCgpLFxuICAgICAgICAgICAgQ29tZXRDaGF0LkdST1VQX01FTUJFUl9TQ09QRS5QQVJUSUNJUEFOVFxuICAgICAgICAgICk7XG4gICAgICAgICAgbWVtYmVyLnNldE5hbWUodXNlckFkZGVkLmdldE5hbWUoKSk7XG4gICAgICAgICAgbWVtYmVyLnNldEd1aWQodGhpcy5ncm91cC5nZXRHdWlkKCkpO1xuICAgICAgICAgIG1lbWJlci5zZXRVaWQodXNlckFkZGVkLmdldFVpZCgpKTtcbiAgICAgICAgICBpZiAodXNlckFkZGVkLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgdXNlckFkZGVkSW4uc2V0SGFzSm9pbmVkKHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihtZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyTGVmdDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKGxlYXZpbmdVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgZ3JvdXAuc2V0SGFzSm9pbmVkKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobGVhdmluZ1VzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAgam9pbmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihqb2luZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZVVzZXJMaXN0ZW5lcih0aGlzLm1lbWJlcnNMaXN0ZW5lcklkKTtcbiAgICB0aGlzLm1lbWJlcnNMaXN0ZW5lcklkID0gXCJcIjtcbiAgfVxuICBhZGRSZW1vdmVNZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBsZXQgbWVtYmVybGlzdCA9IFsuLi50aGlzLmdyb3VwTWVtYmVyc107XG4gICAgLy9zZWFyY2ggZm9yIHVzZXJcbiAgICBsZXQgbWVtYmVyS2V5ID0gbWVtYmVybGlzdC5maW5kSW5kZXgoXG4gICAgICAodTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBrKSA9PiB1LmdldFVpZCgpID09IG1lbWJlci5nZXRVaWQoKVxuICAgICk7XG4gICAgLy9pZiBmb3VuZCBpbiB0aGUgbGlzdCwgdXBkYXRlIHVzZXIgb2JqZWN0XG4gICAgaWYgKG1lbWJlcktleSA+IC0xKSB7XG4gICAgICBtZW1iZXJsaXN0LnNwbGljZShtZW1iZXJLZXksIDEpO1xuICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbLi4ubWVtYmVybGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzLnB1c2gobWVtYmVyKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIGZldGNoTmV4dEdyb3VwTWVtYmVycyA9ICgpID0+IHtcbiAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IG51bGw7XG4gICAgaWYgKFxuICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0ICYmXG4gICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QucGFnaW5hdGlvbiAmJlxuICAgICAgKHRoaXMuZ3JvdXBzUmVxdWVzdC5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8XG4gICAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdC5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSAhPVxuICAgICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QucGFnaW5hdGlvbi50b3RhbF9wYWdlcylcbiAgICApIHtcbiAgICAgIHRoaXMuZmV0Y2hpbmdHcm91cHMgPSB0cnVlO1xuICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycztcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdC5mZXRjaE5leHQoKS50aGVuKFxuICAgICAgICAgIChncm91cE1lbWJlcnM6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ3JvdXBNZW1iZXJzLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm9uRW1wdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRW1wdHkoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9ICcnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGdyb3VwTWVtYmVycy5sZW5ndGggPD0gMCAmJlxuICAgICAgICAgICAgICAodGhpcy5ncm91cE1lbWJlcnM/Lmxlbmd0aCA8PSAwKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbLi4udGhpcy5ncm91cE1lbWJlcnMsIC4uLmdyb3VwTWVtYmVyc107XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VhcmNoS2V5d29yZCAhPSB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCB8fFxuICAgICAgICAgICAgICAgICAgWzAsIDFdLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAodGhpcy5ncm91cHNSZXF1ZXN0IGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2VcbiAgICAgICAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gdGhpcy5zZWFyY2hLZXl3b3JkO1xuICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBncm91cE1lbWJlcnM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gWy4uLnRoaXMuZ3JvdXBNZW1iZXJzLCAuLi5ncm91cE1lbWJlcnNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mZXRjaGluZ0dyb3VwcyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSB0aGlzLnNlYXJjaEtleXdvcmQ7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgdGhpcy5mZXRjaGluZ0dyb3VwcyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIHRoaXMuZmV0Y2hpbmdHcm91cHMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuICBnZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAoIXRoaXMuc2VhcmNoS2V5d29yZCkge1xuICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgcmV0dXJuIHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlclxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcih0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgb25TZWFyY2ggPSAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICB0aGlzLnNlYXJjaEtleXdvcmQgPSBrZXk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ1N0YXRlKSB7XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gW107XG4gICAgICB9XG4gICAgICB0aGlzLmZldGNoTmV4dEdyb3VwTWVtYmVycygpO1xuICAgIH0sIDUwMCk7XG4gIH07XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXRHcm91cE1lbWJlcnNTdHlsZSgpO1xuICAgIHRoaXMuc2V0U2NvcGVTdHlsZSgpO1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKCk7XG4gICAgdGhpcy5tZW51TGlzdFN0eWxlID0gbmV3IE1lbnVMaXN0U3R5bGUoe1xuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHN1Ym1lbnVXaWR0aDogXCIxMDAlXCIsXG4gICAgICBzdWJtZW51SGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHN1Ym1lbnVCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc3VibWVudUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbW9yZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9KTtcbiAgICB0aGlzLm1vZGFsU3R5bGUuYm94U2hhZG93ID0gYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gO1xuICAgIHRoaXMubW9kYWxTdHlsZS5iYWNrZ3JvdW5kID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpO1xuICB9XG4gIHNldEdyb3VwTWVtYmVyc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEdyb3VwTWVtYmVyc1N0eWxlID0gbmV3IEdyb3VwTWVtYmVyc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGNsb3NlQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYmFja0J1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5ncm91cE1lbWJlcnNTdHlsZSB9O1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS50aXRsZVRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUudGl0bGVUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmxvYWRpbmdJY29uVGludCxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoSWNvblRpbnQsXG4gICAgICBzZWFyY2hCb3JkZXI6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoQm9yZGVyLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoQmFja2dyb3VuZCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoVGV4dEZvbnQsXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuc2VhcmNoVGV4dENvbG9yLFxuICAgIH07XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9O1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlLFxuICAgIH07XG4gIH1cbiAgc2V0U2NvcGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDaGFuZ2VTY29wZVN0eWxlID0gbmV3IENoYW5nZVNjb3BlU3R5bGUoe1xuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIGFjdGl2ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgYXJyb3dJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9wdGlvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgb3B0aW9uQm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIG9wdGlvbkJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjIwMHB4XCIsXG4gICAgICB3aWR0aDogXCIyODBweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZ3JvdXBTY29wZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZ3JvdXBTY29wZVN0eWxlIH07XG4gIH1cbiAgbWVtYmVyc1N0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBwYWRkaW5nOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnBhZGRpbmcsXG4gICAgfTtcbiAgfTtcbiAgLy8gc3R5bGVzXG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYmFja0J1dHRvbkljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIH07XG4gIH07XG4gIGNsb3NlQnV0dG9uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmNsb3NlQnV0dG9uSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfTtcbiAgfTtcbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xuICBnZXRTY29wZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5ncm91cFNjb3BlU3R5bGUudGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuZ3JvdXBTY29wZVN0eWxlLnRleHRDb2xvcixcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fYmFja1wiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCIgKm5nSWY9XCJzaG93QmFja0J1dHRvblwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiYmFja0NsaWNrZWQoKVwiPlxuXG4gICAgPC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJtZW1iZXJzU3R5bGUoKVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19tZW51c1wiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxjb21ldGNoYXQtbGlzdCBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIlxuICAgICAgW29uU2VhcmNoXT1cIm9uU2VhcmNoXCIgW2xpc3RdPVwiZ3JvdXBNZW1iZXJzXCIgW3NlYXJjaFRleHRdPVwic2VhcmNoS2V5d29yZFwiXG4gICAgICBbc2VhcmNoUGxhY2Vob2xkZXJUZXh0XT1cInNlYXJjaFBsYWNlaG9sZGVyXCIgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIlxuICAgICAgW3RpdGxlXT1cInRpdGxlXCIgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCIgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIiBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCIgW2Vycm9yU3RhdGVWaWV3XT1cImVycm9yU3RhdGVWaWV3XCIgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIiBbc3RhdGVdPVwic3RhdGVcIj5cbiAgICA8L2NvbWV0Y2hhdC1saXN0PlxuICAgIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWdyb3VwTWVtYmVyPlxuICAgICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cImdyb3VwTWVtYmVyPy5uYW1lXCIgW2F2YXRhclVSTF09XCJncm91cE1lbWJlcj8uYXZhdGFyXCJcbiAgICAgICAgW2F2YXRhck5hbWVdPVwiZ3JvdXBNZW1iZXI/Lm5hbWVcIiBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInN0YXR1c0luZGljYXRvclN0eWxlXCIgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImdldFN0YXR1c0luZGljYXRvckNvbG9yKGdyb3VwTWVtYmVyKVwiXG4gICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkNsaWNrKGdyb3VwTWVtYmVyKVwiXG4gICAgICAgIFt1c2VyUHJlc2VuY2VQbGFjZW1lbnRdPVwidXNlclByZXNlbmNlUGxhY2VtZW50XCI+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3XCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX29wdGlvbnNcIiAqbmdJZj1cIiAhdGFpbFZpZXcgJiYgb3B0aW9uc1wiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnMoZ3JvdXBNZW1iZXIpXCIgW21lbnVMaXN0U3R5bGVdPVwibWVudUxpc3RTdHlsZVwiXG4gICAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cImhhbmRsZU1lbnVBY3Rpb24oJGV2ZW50LCBncm91cE1lbWJlcilcIj48L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fdGFpbC12aWV3XCI+XG5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwidGFpbFZpZXdcIj5cbiAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiBncm91cE1lbWJlciB9XCI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIj5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiIGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fc2VsZWN0aW9uLS1zaW5nbGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1yYWRpby1idXR0b24gKGNjLXJhZGlvLWJ1dHRvbi1jaGFuZ2VkKT1cIm9uTWVtYmVyU2VsZWN0ZWQoZ3JvdXBNZW1iZXIsJGV2ZW50KVwiPlxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zZWxlY3Rpb24tLW11bHRpcGxlXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtY2hlY2tib3ggKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwib25NZW1iZXJTZWxlY3RlZChncm91cE1lbWJlciwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2ICpuZ0lmPVwiIXRhaWxWaWV3XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fc2NvcGVjaGFuZ2VcIiBzbG90PVwidGFpbFZpZXdcIj5cblxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbbW9yZUljb25VUkxdPVwibW9yZUljb25VUkxcIiAqbmdJZj1cImlzQXJyYXkoZ2V0T3B0aW9ucyhncm91cE1lbWJlcikpXCJcbiAgICAgICAgICAgICAgICBbdG9wTWVudVNpemVdPVwiMFwiIFtkYXRhXT1cImdldE9wdGlvbnMoZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cImhhbmRsZU1lbnVBY3Rpb24oJGV2ZW50LCBncm91cE1lbWJlcilcIiBbbWVudUxpc3RTdHlsZV09XCJtZW51TGlzdFN0eWxlXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCAqbmdJZj1cIiBpc1N0cmluZyhnZXRPcHRpb25zKGdyb3VwTWVtYmVyKSlcIiBbdGV4dF09XCJnZXRPcHRpb25zKGdyb3VwTWVtYmVyKVwiXG4gICAgICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwiZ2V0U2NvcGVTdHlsZSgpXCI+XG5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cblxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fY2xvc2VcIiAqbmdJZj1cImNsb3NlQnV0dG9uSWNvblVSTFwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImNsb3NlQnV0dG9uSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJjbG9zZUJ1dHRvblN0eWxlKClcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImNsb3NlQ2xpY2tlZCgpXCI+XG5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuPC9kaXY+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwiY2hhbmdlU2NvcGUgJiYgbWVtYmVyU2NvcGUubGVuZ3RoID4gMFwiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNvbWV0Y2hhdC1jaGFuZ2Utc2NvcGUgW2NoYW5nZVNjb3BlU3R5bGVdPVwiZ3JvdXBTY29wZVN0eWxlXCIgW29wdGlvbnNdPVwibWVtYmVyU2NvcGVcIiBbYXJyb3dJY29uVVJMXT1cImRyb3Bkb3duSWNvblVSTFwiXG4gICAgKGNjLWNoYW5nZXNjb3BlLWNsb3NlLWNsaWNrZWQpPVwiY2hhbmdlU2NvcGUgPSBmYWxzZTtcIiAoY2MtY2hhbmdlc2NvcGUtY2hhbmdlZCk9XCJjaGFuZ2VNZW1iZXJTY29wZSgkZXZlbnQpXCI+XG5cbiAgPC9jb21ldGNoYXQtY2hhbmdlLXNjb3BlPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+Il19