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
            closeIconTint: "",
            buttonBackground: "",
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
        /**
       * @param  {CometChat.GroupMember} member
       */
        this.getStatusIndicatorStyle = (member) => {
            let userStatusVisibility = new MessageUtils().getUserStatusVisibility(member) || this.disableUsersPresence;
            if (!userStatusVisibility) {
                return (this.statusIndicatorStyle);
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
        this.groupScopeStyle.closeIconTint =
            this.groupScopeStyle.closeIconTint || this.themeService.theme.palette.getPrimary();
        this.groupScopeStyle.buttonBackground =
            this.groupScopeStyle.buttonBackground || this.themeService.theme.palette.getPrimary();
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
CometChatGroupMembersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatGroupMembersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatGroupMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.12", type: CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: { groupMemberRequestBuilder: "groupMemberRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", tailView: "tailView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", backdropStyle: "backdropStyle", onBack: "onBack", onClose: "onClose", onSelect: "onSelect", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", dropdownIconURL: "dropdownIconURL", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle", groupMembersStyle: "groupMembersStyle", groupScopeStyle: "groupScopeStyle", listItemStyle: "listItemStyle", onItemClick: "onItemClick", onEmpty: "onEmpty", userPresencePlacement: "userPresencePlacement", disableLoadingState: "disableLoadingState", searchKeyword: "searchKeyword" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-group-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-group-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"\n      (cc-button-clicked)=\"backClicked()\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-group-members__wrapper\" [ngStyle]=\"membersStyle()\">\n    <div class=\"cc-group-members__menus\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n    </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\"\n      [onSearch]=\"onSearch\" [list]=\"groupMembers\" [searchText]=\"searchKeyword\"\n      [searchPlaceholderText]=\"searchPlaceholder\" [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"\n      [title]=\"title\" [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-groupMember>\n      <cometchat-list-item [title]=\"groupMember?.name\" [avatarURL]=\"groupMember?.avatar\"\n        [avatarName]=\"groupMember?.name\" [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n        [statusIndicatorStyle]=\"getStatusIndicatorStyle(groupMember)\" [statusIndicatorColor]=\"getStatusIndicatorColor(groupMember)\"\n        [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(groupMember)\"\n        [userPresencePlacement]=\"userPresencePlacement\">\n        <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-group-members__subtitle-view\">\n          <ng-container *ngTemplateOutlet=\"subtitleView\">\n          </ng-container>\n        </div>\n        <div slot=\"menuView\" class=\"cc-group-members__options\" *ngIf=\" !tailView && options\">\n          <cometchat-menu-list [data]=\"options(groupMember)\" [menuListStyle]=\"menuListStyle\"\n            (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\"></cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" class=\"cc-group-members__tail-view\">\n\n          <div *ngIf=\"tailView\">\n            <ng-container *ngTemplateOutlet=\"tailView;context:{ $implicit: groupMember }\">\n            </ng-container>\n\n          </div>\n          <div *ngIf=\"selectionMode != selectionmodeEnum.none\">\n            <div *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-group-members__selection--single\">\n              <cometchat-radio-button (cc-radio-button-changed)=\"onMemberSelected(groupMember,$event)\">\n              </cometchat-radio-button>\n            </div>\n            <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-group-members__selection--multiple\">\n              <cometchat-checkbox (cc-checkbox-changed)=\"onMemberSelected(groupMember,$event)\"></cometchat-checkbox>\n            </div>\n          </div>\n          <div *ngIf=\"!tailView\">\n            <div class=\"cc-group-members__scopechange\" slot=\"tailView\">\n\n              <cometchat-menu-list [moreIconURL]=\"moreIconURL\" *ngIf=\"isArray(getOptions(groupMember))\"\n                [topMenuSize]=\"0\" [data]=\"getOptions(groupMember)\"\n                (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\" [menuListStyle]=\"menuListStyle\">\n              </cometchat-menu-list>\n              <cometchat-label *ngIf=\" isString(getOptions(groupMember))\" [text]=\"getOptions(groupMember)\"\n                [labelStyle]=\"getScopeStyle()\">\n\n              </cometchat-label>\n\n            </div>\n          </div>\n        </div>\n      </cometchat-list-item>\n\n    </ng-template>\n  </div>\n  <div class=\"cc-group-members__close\" *ngIf=\"closeButtonIconURL\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\"\n      (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n<cometchat-backdrop *ngIf=\"changeScope && memberScope.length > 0\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-change-scope [changeScopeStyle]=\"groupScopeStyle\" [options]=\"memberScope\" [arrowIconURL]=\"dropdownIconURL\"\n    (cc-changescope-close-clicked)=\"changeScope = false;\" (cc-changescope-changed)=\"changeMemberScope($event)\">\n\n  </cometchat-change-scope>\n</cometchat-backdrop>", styles: [".cc-group-members{display:flex;height:100%;width:100%;overflow:hidden;box-sizing:border-box}.cc-group-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-group-members__wrapper{height:100%;padding:8px;width:100%}.cc-group-members__close{position:absolute;right:8px;padding:8px}.cc-group-members__tail-view{position:relative;display:flex;gap:8px;justify-content:flex-end;align-items:center}.cc-group-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.scope__changed{height:100%;width:fit-content;position:absolute;right:8px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatGroupMembersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-group-members", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-group-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-group-members__back\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\" *ngIf=\"showBackButton\"\n      (cc-button-clicked)=\"backClicked()\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-group-members__wrapper\" [ngStyle]=\"membersStyle()\">\n    <div class=\"cc-group-members__menus\">\n      <ng-container *ngTemplateOutlet=\"menu\">\n      </ng-container>\n    </div>\n    <cometchat-list [listItemView]=\"listItemView ? listItemView : listItem\" [onScrolledToBottom]=\"onScrolledToBottom\"\n      [onSearch]=\"onSearch\" [list]=\"groupMembers\" [searchText]=\"searchKeyword\"\n      [searchPlaceholderText]=\"searchPlaceholder\" [searchIconURL]=\"searchIconURL\" [hideSearch]=\"hideSearch\"\n      [title]=\"title\" [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\"\n      [titleAlignment]=\"titleAlignment\" [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\"\n      [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\">\n    </cometchat-list>\n    <ng-template #listItem let-groupMember>\n      <cometchat-list-item [title]=\"groupMember?.name\" [avatarURL]=\"groupMember?.avatar\"\n        [avatarName]=\"groupMember?.name\" [listItemStyle]=\"listItemStyle\" [avatarStyle]=\"avatarStyle\"\n        [statusIndicatorStyle]=\"getStatusIndicatorStyle(groupMember)\" [statusIndicatorColor]=\"getStatusIndicatorColor(groupMember)\"\n        [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onClick(groupMember)\"\n        [userPresencePlacement]=\"userPresencePlacement\">\n        <div slot=\"subtitleView\" *ngIf=\"subtitleView\" class=\"cc-group-members__subtitle-view\">\n          <ng-container *ngTemplateOutlet=\"subtitleView\">\n          </ng-container>\n        </div>\n        <div slot=\"menuView\" class=\"cc-group-members__options\" *ngIf=\" !tailView && options\">\n          <cometchat-menu-list [data]=\"options(groupMember)\" [menuListStyle]=\"menuListStyle\"\n            (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\"></cometchat-menu-list>\n        </div>\n        <div slot=\"tailView\" class=\"cc-group-members__tail-view\">\n\n          <div *ngIf=\"tailView\">\n            <ng-container *ngTemplateOutlet=\"tailView;context:{ $implicit: groupMember }\">\n            </ng-container>\n\n          </div>\n          <div *ngIf=\"selectionMode != selectionmodeEnum.none\">\n            <div *ngIf=\"selectionMode == selectionmodeEnum.single\" class=\"cc-group-members__selection--single\">\n              <cometchat-radio-button (cc-radio-button-changed)=\"onMemberSelected(groupMember,$event)\">\n              </cometchat-radio-button>\n            </div>\n            <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\" class=\"cc-group-members__selection--multiple\">\n              <cometchat-checkbox (cc-checkbox-changed)=\"onMemberSelected(groupMember,$event)\"></cometchat-checkbox>\n            </div>\n          </div>\n          <div *ngIf=\"!tailView\">\n            <div class=\"cc-group-members__scopechange\" slot=\"tailView\">\n\n              <cometchat-menu-list [moreIconURL]=\"moreIconURL\" *ngIf=\"isArray(getOptions(groupMember))\"\n                [topMenuSize]=\"0\" [data]=\"getOptions(groupMember)\"\n                (cc-menu-clicked)=\"handleMenuAction($event, groupMember)\" [menuListStyle]=\"menuListStyle\">\n              </cometchat-menu-list>\n              <cometchat-label *ngIf=\" isString(getOptions(groupMember))\" [text]=\"getOptions(groupMember)\"\n                [labelStyle]=\"getScopeStyle()\">\n\n              </cometchat-label>\n\n            </div>\n          </div>\n        </div>\n      </cometchat-list-item>\n\n    </ng-template>\n  </div>\n  <div class=\"cc-group-members__close\" *ngIf=\"closeButtonIconURL\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\"\n      (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>\n<cometchat-backdrop *ngIf=\"changeScope && memberScope.length > 0\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-change-scope [changeScopeStyle]=\"groupScopeStyle\" [options]=\"memberScope\" [arrowIconURL]=\"dropdownIconURL\"\n    (cc-changescope-close-clicked)=\"changeScope = false;\" (cc-changescope-changed)=\"changeMemberScope($event)\">\n\n  </cometchat-change-scope>\n</cometchat-backdrop>", styles: [".cc-group-members{display:flex;height:100%;width:100%;overflow:hidden;box-sizing:border-box}.cc-group-members__back{position:absolute;left:8px;padding:12px 8px 8px}.cc-group-members__wrapper{height:100%;padding:8px;width:100%}.cc-group-members__close{position:absolute;right:8px;padding:8px}.cc-group-members__tail-view{position:relative;display:flex;gap:8px;justify-content:flex-end;align-items:center}.cc-group-members__menus{position:absolute;right:12px;padding:12px;cursor:pointer}.scope__changed{height:100%;width:fit-content;position:absolute;right:8px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFdBQVcsRUFFWCxnQkFBZ0IsRUFDaEIsYUFBYSxFQUNiLGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFFTCxxQkFBcUIsRUFDckIsZ0JBQWdCLEVBQ2hCLGlCQUFpQixHQUVsQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFDTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUNULEtBQUssR0FLTixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsb0JBQW9CLEVBR3BCLHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFDZCxxQkFBcUIsRUFDckIsVUFBVSxFQUNWLFFBQVEsR0FDVCxNQUFNLDRCQUE0QixDQUFDO0FBR3BDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUUxRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7O0FBRS9EOzs7Ozs7OztHQVFHO0FBT0gsTUFBTSxPQUFPLDhCQUE4QjtJQXlJekMsWUFDVSxHQUFz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S0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFNRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFNRyxlQUFlO3NCQUF2QixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUs7Z0JBWUcsV0FBVztzQkFBbkIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0cscUJBQXFCO3NCQUE3QixLQUFLO2dCQUVHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkF3QkcsYUFBYTtzQkFBckIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBDaGFuZ2VTY29wZVN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxuICBNZW51TGlzdFN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHtcbiAgQmFzZVN0eWxlLFxuICBDb21ldENoYXRVSUtpdFV0aWxpdHksXG4gIEdyb3VwTWVtYmVyVXRpbHMsXG4gIEdyb3VwTWVtYmVyc1N0eWxlLFxuICBMaXN0U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uSW5pdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQge1xuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBDb21ldENoYXRUaGVtZSxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIFNlbGVjdGlvbk1vZGUsXG4gIFN0YXRlcyxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIFVzZXJQcmVzZW5jZVBsYWNlbWVudCxcbiAgZm9udEhlbHBlcixcbiAgbG9jYWxpemUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHsgU3ViamVjdCwgU3Vic2NyaXB0aW9uIH0gZnJvbSBcInJ4anNcIjtcblxuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IE1lc3NhZ2VVdGlscyB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzXCI7XG5cbi8qKlxuICpcbiAqICBDb21ldENoYXRHcm91cE1lbWJlcnNDb21wb25lbnQgaXMgdXNlZCB0byByZW5kZXIgbGlzdCBvZiBncm91cCBtZW1iZXJzXG4gKlxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuICogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4gKlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWdyb3VwLW1lbWJlcnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtZ3JvdXAtbWVtYmVycy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRHcm91cE1lbWJlcnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHNlYXJjaFJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSB0YWlsVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITpcbiAgICB8ICgobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IENvbWV0Q2hhdE9wdGlvbltdKVxuICAgIHwgbnVsbDtcbiAgQElucHV0KCkgYmFja0J1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2JhY2tidXR0b24uc3ZnXCI7XG4gIEBJbnB1dCgpIGNsb3NlQnV0dG9uSWNvblVSTDogc3RyaW5nIHwgdW5kZWZpbmVkID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIjtcbiAgQElucHV0KCkgc2hvd0JhY2tCdXR0b246IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBcIlNlYXJjaCBNZW1iZXJzXCI7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIk1FTUJFUlNcIik7XG4gIEBJbnB1dCgpIG9uRXJyb3I/OiAoKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkKSB8IG51bGwgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuICBASW5wdXQoKSBiYWNrZHJvcFN0eWxlOiBCYWNrZHJvcFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiYSgwLCAwLCAwLCAwLjUpXCIsXG4gICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgfTtcbiAgQElucHV0KCkgb25CYWNrITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKFxuICAgIGdyb3VwTWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW5cbiAgKSA9PiB2b2lkO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fVVNFUlNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQuY2VudGVyO1xuICBASW5wdXQoKSBkcm9wZG93bkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Rvd24tYXJyb3cuc3ZnXCI7XG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gIH07XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjMycHhcIixcbiAgICBoZWlnaHQ6IFwiMzJweFwiLFxuICB9O1xuICBASW5wdXQoKSBncm91cE1lbWJlcnNTdHlsZTogR3JvdXBNZW1iZXJzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgfTtcbiAgQElucHV0KCkgZ3JvdXBTY29wZVN0eWxlOiBDaGFuZ2VTY29wZVN0eWxlID0gbmV3IENoYW5nZVNjb3BlU3R5bGUoe1xuICAgIGhlaWdodDogXCIyMDBweFwiLFxuICAgIHdpZHRoOiBcIjI4MHB4XCIsXG4gICAgY2xvc2VJY29uVGludDpcIlwiLFxuICAgIGJ1dHRvbkJhY2tncm91bmQ6XCJcIixcbiAgfSk7XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImdyZXlcIixcbiAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYmEoMjIyIDIyMiAyMjIgLyA0NiUpXCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKHVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4gdm9pZDtcbiAgQElucHV0KCkgb25FbXB0eT86ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHVzZXJQcmVzZW5jZVBsYWNlbWVudDogVXNlclByZXNlbmNlUGxhY2VtZW50ID1cbiAgICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQuYm90dG9tO1xuICBASW5wdXQoKSBkaXNhYmxlTG9hZGluZ1N0YXRlOiBib29sZWFuID0gZmFsc2U7XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge307XG4gIG1lbnVMaXN0U3R5bGU6IE1lbnVMaXN0U3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgbW9yZUljb25UaW50OiBcInJnYig1MSwgMTUzLCAyNTUpXCIsXG4gIH07XG4gIG1vZGFsU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjEycHhcIixcbiAgICB3aWR0aDogXCIzNjBweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIG1vcmVJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9tb3JlaWNvbi5zdmdcIjtcbiAgQElucHV0KCkgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsO1xuICBwdWJsaWMgaXNTdHJpbmcgPSAoZGF0YTogYW55KSA9PiB0eXBlb2YgZGF0YSA9PSBcInN0cmluZ1wiO1xuICBwdWJsaWMgaXNBcnJheSA9IChkYXRhOiBhbnkpID0+IHR5cGVvZiBkYXRhID09IFwib2JqZWN0XCIgJiYgZGF0YT8ubGVuZ3RoID4gMDtcbiAgcHVibGljIGdldE9wdGlvbnMgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBsZXQgb3B0aW9ucyA9IEdyb3VwTWVtYmVyVXRpbHMuZ2V0Vmlld01lbWJlck9wdGlvbnMoXG4gICAgICBtZW1iZXIsXG4gICAgICB0aGlzLmdyb3VwLFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpLFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWVcbiAgICApO1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9O1xuICBzZWxlY3RlZE1lbWJlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciB8IG51bGw7XG4gIHRpdGxlQWxpZ25tZW50RW51bTogdHlwZW9mIFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQ7XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIHB1YmxpYyBncm91cHNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHB1YmxpYyBncm91cE1lbWJlcnM6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdID0gW107XG4gIHB1YmxpYyBzY29wZXM6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBtZW1iZXJzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJtZW1iZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgY2hhbmdlU2NvcGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hpbmdHcm91cHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZmV0Y2hUaW1lT3V0OiBhbnk7XG4gIHB1YmxpYyBwcmV2aW91c1NlYXJjaEtleXdvcmQgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkgeyB9XG5cbiAgcHVibGljIG1lbWJlclNjb3BlOiBhbnlbXSA9IFtdO1xuICBtZW1iZXJzTGlzdDogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10gPSBbXTtcblxuICBjbG9zZUNsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25DbG9zZSkge1xuICAgICAgdGhpcy5vbkNsb3NlKCk7XG4gICAgfVxuICB9XG4gIGJhY2tDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uQmFjaykge1xuICAgICAgdGhpcy5vbkJhY2soKTtcbiAgICB9XG4gIH1cbiAgb25DbGljayA9IChncm91cE1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soZ3JvdXBNZW1iZXIpO1xuICAgIH1cbiAgfTtcbiAgb25NZW1iZXJTZWxlY3RlZChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50Py5kZXRhaWw/LmNoZWNrZWQ7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QobWVtYmVyLCBzZWxlY3RlZCk7XG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnM7XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKTtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgIGlmICghdGhpcy5mZXRjaGluZ0dyb3Vwcykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0R3JvdXBNZW1iZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlc1tcInNlYXJjaEtleXdvcmRcIl0pIHtcbiAgICAgIHRoaXMuc2VhcmNoS2V5V29yZFVwZGF0ZWQoKTtcbiAgICB9XG4gIH1cblxuICBzZWFyY2hLZXlXb3JkVXBkYXRlZCA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5mZXRjaGluZ0dyb3Vwcykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZmV0Y2hUaW1lT3V0KTtcbiAgICAgIHRoaXMuZmV0Y2hUaW1lT3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuc2VhcmNoRm9yR3JvdXBNZW1iZXJzKCk7XG4gICAgICB9LCA4MDApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlYXJjaEZvckdyb3VwTWVtYmVycygpO1xuICAgIH1cbiAgfTtcblxuICBzZWFyY2hGb3JHcm91cE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXJcbiAgICAgID8gdGhpcy5zZWFyY2hSZXF1ZXN0QnVpbGRlci5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZCkuYnVpbGQoKVxuICAgICAgOiB0aGlzLmdldFJlcXVlc3RCdWlsZGVyKCk7XG4gICAgdGhpcy5ncm91cHNSZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgdGhpcy5ncm91cE1lbWJlcnMgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnMoKTtcbiAgfTtcblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cE1lbWJlcn0gbWVtYmVyXG4gICAqL1xuICBnZXRTdGF0dXNJbmRpY2F0b3JDb2xvciA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eShtZW1iZXIpIHx8IHRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2U7XG4gICAgaWYgKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUub25saW5lU3RhdHVzQ29sb3IgPz8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuICAgIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXBNZW1iZXJ9IG1lbWJlclxuICAgKi9cbiAgICBnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSA9IChtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikgPT4ge1xuICAgICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KG1lbWJlcikgfHwgdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZTtcbiAgICAgIGlmKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSl7XG4gICAgICAgIHJldHVybihcbiAgICAgICAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgY2hhbmdlTWVtYmVyU2NvcGUoZXZlbnQ6IGFueSkge1xuICAgIENvbWV0Q2hhdC51cGRhdGVHcm91cE1lbWJlclNjb3BlKFxuICAgICAgdGhpcy5ncm91cC5nZXRHdWlkKCksXG4gICAgICB0aGlzLnNlbGVjdGVkTWVtYmVyIS5nZXRVaWQoKSxcbiAgICAgIGV2ZW50Py5kZXRhaWw/LnZhbHVlXG4gICAgKVxuICAgICAgLnRoZW4oKG1lbWJlcjogYm9vbGVhbikgPT4ge1xuICAgICAgICBsZXQgc2NvcGU6IGFueSA9IGV2ZW50Py5kZXRhaWw/LnZhbHVlO1xuICAgICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXI/LnNldFNjb3BlKHNjb3BlKTtcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5zZWxlY3RlZE1lbWJlcik7XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQubmV4dCh7XG4gICAgICAgICAgc2NvcGVDaGFuZ2VkRnJvbTogdGhpcy5zZWxlY3RlZE1lbWJlcj8uZ2V0U2NvcGUoKSxcbiAgICAgICAgICBzY29wZUNoYW5nZWRUbzogc2NvcGUsXG4gICAgICAgICAgbWVzc2FnZTogdGhpcy5jcmVhdGVBY3Rpb25NZXNzYWdlKFxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE1lbWJlciEsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0VcbiAgICAgICAgICApLFxuICAgICAgICAgIGdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIHVwZGF0ZWRVc2VyOiB0aGlzLnNlbGVjdGVkTWVtYmVyISxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNoYW5nZVNjb3BlID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkTWVtYmVyID0gbnVsbDtcbiAgICAgIH0pO1xuICB9XG4gIGhhbmRsZU1lbnVBY3Rpb24gPSAobWVudTogYW55LCBncm91cE1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgaWYgKG1lbnU/LmRldGFpbD8uZGF0YT8ub25DbGljaykge1xuICAgICAgbWVudT8uZGV0YWlsPy5kYXRhPy5vbkNsaWNrKGdyb3VwTWVtYmVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGlkID0gbWVudT8uZGV0YWlsPy5kYXRhPy5pZDtcbiAgICB0aGlzLnNlbGVjdGVkTWVtYmVyID0gZ3JvdXBNZW1iZXI7XG4gICAgdGhpcy5tZW1iZXJTY29wZSA9IEdyb3VwTWVtYmVyVXRpbHMuYWxsb3dTY29wZUNoYW5nZShcbiAgICAgIHRoaXMuZ3JvdXAsXG4gICAgICBncm91cE1lbWJlclxuICAgICk7XG4gICAgaWYgKGlkID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwTWVtYmVyT3B0aW9ucy5jaGFuZ2VTY29wZSkge1xuICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IHRydWU7XG4gICAgICB0aGlzLnNjb3BlcyA9IFtdO1xuICAgIH0gZWxzZSBpZiAoaWQgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBNZW1iZXJPcHRpb25zLmJhbikge1xuICAgICAgdGhpcy5jaGFuZ2VTY29wZSA9IGZhbHNlO1xuICAgICAgdGhpcy5ibG9ja01lbWJlcihncm91cE1lbWJlcik7XG4gICAgfSBlbHNlIGlmIChpZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cE1lbWJlck9wdGlvbnMua2ljaykge1xuICAgICAgdGhpcy5raWNrTWVtYmVyKGdyb3VwTWVtYmVyKTtcbiAgICB9XG4gIH07XG4gIGJsb2NrTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgQ29tZXRDaGF0LmJhbkdyb3VwTWVtYmVyKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBtZW1iZXIuZ2V0VWlkKCkpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSAtIDEpO1xuICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobWVtYmVyKTtcbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQubmV4dCh7XG4gICAgICAgIGtpY2tlZEJ5OiB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgIGtpY2tlZEZyb206IHRoaXMuZ3JvdXAhLFxuICAgICAgICBraWNrZWRVc2VyOiBtZW1iZXIsXG4gICAgICAgIG1lc3NhZ2U6IHRoaXMuY3JlYXRlQWN0aW9uTWVzc2FnZShcbiAgICAgICAgICBtZW1iZXIsXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVEXG4gICAgICAgICksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBhY3Rpb246IHN0cmluZykge1xuXG4gICAgY29uc3QgbWVzc2FnZVV0aWxzID0gbmV3IE1lc3NhZ2VVdGlscygpXG5cbiAgICBsZXQgYWN0aW9uTWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiA9IG5ldyBDb21ldENoYXQuQWN0aW9uKFxuICAgICAgdGhpcy5ncm91cC5nZXRHdWlkKCksXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwLFxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiBhcyBhbnlcbiAgICApO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uKGFjdGlvbik7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25CeSh0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uRm9yKHRoaXMuZ3JvdXApO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uT24oYWN0aW9uT24pO1xuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0UmVjZWl2ZXIodGhpcy5ncm91cCk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKFwiZ3JvdXBfXCIgKyB0aGlzLmdyb3VwLmdldEd1aWQoKSk7XG4gICAgYWN0aW9uTWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyVHlwZShcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICApO1xuICAgIChhY3Rpb25NZXNzYWdlIGFzIGFueSkuZGF0YSA9IHtcbiAgICAgIGV4dHJhczoge1xuICAgICAgICBzY29wZToge1xuICAgICAgICAgIG5ldzogYWN0aW9uT24uZ2V0U2NvcGUoKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBhY3Rpb25NZXNzYWdlLnNldE5ld1Njb3BlKGFjdGlvbk9uLmdldFNjb3BlKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRNZXNzYWdlKFxuICAgICAgbWVzc2FnZVV0aWxzLmdldEFjdGlvbk1lc3NhZ2UoYWN0aW9uTWVzc2FnZSlcbiAgICApO1xuICAgIHJldHVybiBhY3Rpb25NZXNzYWdlO1xuICB9XG4gIGtpY2tNZW1iZXIgPSAobWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpID0+IHtcbiAgICBDb21ldENoYXQua2lja0dyb3VwTWVtYmVyKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBtZW1iZXIuZ2V0VWlkKCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuZ3JvdXAuc2V0TWVtYmVyc0NvdW50KHRoaXMuZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgLSAxKTtcbiAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobWVtYmVyKTtcbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5uZXh0KHtcbiAgICAgICAgICBraWNrZWRCeTogdGhpcy5sb2dnZWRJblVzZXIhLFxuICAgICAgICAgIGtpY2tlZEZyb206IHRoaXMuZ3JvdXAhLFxuICAgICAgICAgIGtpY2tlZFVzZXI6IG1lbWJlcixcbiAgICAgICAgICBtZXNzYWdlOiB0aGlzLmNyZWF0ZUFjdGlvbk1lc3NhZ2UoXG4gICAgICAgICAgICBtZW1iZXIsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5LSUNLRURcbiAgICAgICAgICApLFxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfSBtZW1iZXJcbiAgICovXG4gIHVwZGF0ZU1lbWJlclN0YXR1cyA9IChtZW1iZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgbGV0IG1lbWJlcmxpc3QgPSBbLi4udGhpcy5ncm91cE1lbWJlcnNdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IHVzZXJLZXkgPSBtZW1iZXJsaXN0LmZpbmRJbmRleChcbiAgICAgICh1OiBDb21ldENoYXQuR3JvdXBNZW1iZXIsIGspID0+IHUuZ2V0VWlkKCkgPT0gbWVtYmVyLmdldFVpZCgpXG4gICAgKTtcbiAgICAvL2lmIGZvdW5kIGluIHRoZSBsaXN0LCB1cGRhdGUgdXNlciBvYmplY3RcbiAgICBpZiAodXNlcktleSA+IC0xKSB7XG4gICAgICBsZXQgdXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gbWVtYmVybGlzdFt1c2VyS2V5XTtcbiAgICAgIHVzZXIuc2V0U3RhdHVzKG1lbWJlci5nZXRTdGF0dXMoKSk7XG4gICAgICBtZW1iZXJsaXN0LnNwbGljZSh1c2VyS2V5LCAxLCB1c2VyKTtcbiAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgdXBkYXRlTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyIHwgbnVsbCkgPT4ge1xuICAgIGxldCBtZW1iZXJsaXN0ID0gWy4uLnRoaXMuZ3JvdXBNZW1iZXJzXTtcbiAgICAvL3NlYXJjaCBmb3IgdXNlclxuICAgIGxldCB1c2VyS2V5ID0gbWVtYmVybGlzdC5maW5kSW5kZXgoXG4gICAgICAodTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLCBrKSA9PiB1LmdldFVpZCgpID09IG1lbWJlciEuZ2V0VWlkKClcbiAgICApO1xuICAgIC8vaWYgZm91bmQgaW4gdGhlIGxpc3QsIHVwZGF0ZSB1c2VyIG9iamVjdFxuICAgIGlmICh1c2VyS2V5ID4gLTEpIHtcbiAgICAgIGxldCB1c2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSBtZW1iZXJsaXN0W3VzZXJLZXldO1xuICAgICAgbWVtYmVybGlzdC5zcGxpY2UodXNlcktleSwgMSwgdXNlcik7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi5tZW1iZXJsaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICAvL0F0dGFjaGluZyBVc2VyIExpc3RlbmVycyB0byBkeW5hbWlsY2FsbHkgdXBkYXRlIHdoZW4gYSB1c2VyIGNvbWVzIG9ubGluZSBhbmQgZ29lcyBvZmZsaW5lXG4gICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyU3RhdHVzKG9ubGluZVVzZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyU3RhdHVzKG9mZmxpbmVVc2VyKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgIHRoaXMubWVtYmVyc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbixcbiAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgIG5ld1Njb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICBvbGRTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgY2hhbmdlZEdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKGNoYW5nZWRVc2VyLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgY2hhbmdlZEdyb3VwLnNldFNjb3BlKG5ld1Njb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIoY2hhbmdlZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKFxuICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sXG4gICAgICAgICAga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAga2lja2VkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGtpY2tlZEZyb206IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApID0+IHtcbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcihraWNrZWRVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBiYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIoYmFubmVkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkdyb3VwTWVtYmVyVW5iYW5uZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdW5iYW5uZWRGcm9tOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgaWYgKHVuYmFubmVkVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVuYmFubmVkRnJvbS5zZXRIYXNKb2luZWQoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmFkZFJlbW92ZU1lbWJlcih1bmJhbm5lZFVzZXIgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgdXNlckFkZGVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIHVzZXJBZGRlZEluOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgbGV0IG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gbmV3IENvbWV0Q2hhdC5Hcm91cE1lbWJlcihcbiAgICAgICAgICAgIHVzZXJBZGRlZC5nZXRVaWQoKSxcbiAgICAgICAgICAgIENvbWV0Q2hhdC5HUk9VUF9NRU1CRVJfU0NPUEUuUEFSVElDSVBBTlRcbiAgICAgICAgICApO1xuICAgICAgICAgIG1lbWJlci5zZXROYW1lKHVzZXJBZGRlZC5nZXROYW1lKCkpO1xuICAgICAgICAgIG1lbWJlci5zZXRHdWlkKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKTtcbiAgICAgICAgICBtZW1iZXIuc2V0VWlkKHVzZXJBZGRlZC5nZXRVaWQoKSk7XG4gICAgICAgICAgaWYgKHVzZXJBZGRlZC5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHVzZXJBZGRlZEluLnNldEhhc0pvaW5lZCh0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIobWVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGxlYXZpbmdVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgIGlmIChsZWF2aW5nVXNlci5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIGdyb3VwLnNldEhhc0pvaW5lZChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuYWRkUmVtb3ZlTWVtYmVyKGxlYXZpbmdVc2VyIGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChcbiAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLFxuICAgICAgICAgIGpvaW5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgIGpvaW5lZEdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgdGhpcy5hZGRSZW1vdmVNZW1iZXIoam9pbmVkVXNlciBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy5tZW1iZXJzTGlzdGVuZXJJZCk7XG4gICAgdGhpcy5tZW1iZXJzTGlzdGVuZXJJZCA9IFwiXCI7XG4gIH1cbiAgYWRkUmVtb3ZlTWVtYmVyID0gKG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB7XG4gICAgbGV0IG1lbWJlcmxpc3QgPSBbLi4udGhpcy5ncm91cE1lbWJlcnNdO1xuICAgIC8vc2VhcmNoIGZvciB1c2VyXG4gICAgbGV0IG1lbWJlcktleSA9IG1lbWJlcmxpc3QuZmluZEluZGV4KFxuICAgICAgKHU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciwgaykgPT4gdS5nZXRVaWQoKSA9PSBtZW1iZXIuZ2V0VWlkKClcbiAgICApO1xuICAgIC8vaWYgZm91bmQgaW4gdGhlIGxpc3QsIHVwZGF0ZSB1c2VyIG9iamVjdFxuICAgIGlmIChtZW1iZXJLZXkgPiAtMSkge1xuICAgICAgbWVtYmVybGlzdC5zcGxpY2UobWVtYmVyS2V5LCAxKTtcbiAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gWy4uLm1lbWJlcmxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdyb3VwTWVtYmVycy5wdXNoKG1lbWJlcik7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICBmZXRjaE5leHRHcm91cE1lbWJlcnMgPSAoKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIGlmIChcbiAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdCAmJlxuICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0LnBhZ2luYXRpb24gJiZcbiAgICAgICh0aGlzLmdyb3Vwc1JlcXVlc3QucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgPT0gMCB8fFxuICAgICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT1cbiAgICAgICAgdGhpcy5ncm91cHNSZXF1ZXN0LnBhZ2luYXRpb24udG90YWxfcGFnZXMpXG4gICAgKSB7XG4gICAgICB0aGlzLmZldGNoaW5nR3JvdXBzID0gdHJ1ZTtcbiAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnM7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmdyb3Vwc1JlcXVlc3QuZmV0Y2hOZXh0KCkudGhlbihcbiAgICAgICAgICAoZ3JvdXBNZW1iZXJzOiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2FkaW5nU3RhdGUpIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdyb3VwTWVtYmVycy5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5vbkVtcHR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVtcHR5KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgPSAnJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBncm91cE1lbWJlcnMubGVuZ3RoIDw9IDAgJiZcbiAgICAgICAgICAgICAgKHRoaXMuZ3JvdXBNZW1iZXJzPy5sZW5ndGggPD0gMClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gWy4uLnRoaXMuZ3JvdXBNZW1iZXJzLCAuLi5ncm91cE1lbWJlcnNdO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaEtleXdvcmQgIT0gdGhpcy5wcmV2aW91c1NlYXJjaEtleXdvcmQgfHxcbiAgICAgICAgICAgICAgICAgIFswLCAxXS5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMuZ3JvdXBzUmVxdWVzdCBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlXG4gICAgICAgICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzU2VhcmNoS2V5d29yZCA9IHRoaXMuc2VhcmNoS2V5d29yZDtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzID0gZ3JvdXBNZW1iZXJzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFsuLi50aGlzLmdyb3VwTWVtYmVycywgLi4uZ3JvdXBNZW1iZXJzXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdHcm91cHMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gdGhpcy5zZWFyY2hLZXl3b3JkO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmdHcm91cHMgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLmZldGNoaW5nR3JvdXBzID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgZ2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKCF0aGlzLnNlYXJjaEtleXdvcmQpIHtcbiAgICAgIHRoaXMucHJldmlvdXNTZWFyY2hLZXl3b3JkID0gXCJcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2VhcmNoUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlYXJjaFJlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5zZXRTZWFyY2hLZXl3b3JkKHRoaXMuc2VhcmNoS2V5d29yZClcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLnNldFNlYXJjaEtleXdvcmQodGhpcy5zZWFyY2hLZXl3b3JkKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXIodGhpcy5ncm91cC5nZXRHdWlkKCkpXG4gICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAuc2V0U2VhcmNoS2V5d29yZCh0aGlzLnNlYXJjaEtleXdvcmQpXG4gICAgICAgIC5idWlsZCgpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXlcbiAgICovXG4gIG9uU2VhcmNoID0gKGtleTogc3RyaW5nKSA9PiB7XG4gICAgdGhpcy5zZWFyY2hLZXl3b3JkID0ga2V5O1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgIHRoaXMuZ3JvdXBzUmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdTdGF0ZSkge1xuICAgICAgICB0aGlzLmdyb3VwTWVtYmVycyA9IFtdO1xuICAgICAgfVxuICAgICAgdGhpcy5mZXRjaE5leHRHcm91cE1lbWJlcnMoKTtcbiAgICB9LCA1MDApO1xuICB9O1xuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0R3JvdXBNZW1iZXJzU3R5bGUoKTtcbiAgICB0aGlzLnNldFNjb3BlU3R5bGUoKTtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuICAgIHRoaXMubWVudUxpc3RTdHlsZSA9IG5ldyBNZW51TGlzdFN0eWxlKHtcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgICBzdWJtZW51Qm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG1vcmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfSk7XG4gICAgdGhpcy5tb2RhbFN0eWxlLmJveFNoYWRvdyA9IGAwcHggMHB4IDFweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCl9YDtcbiAgICB0aGlzLm1vZGFsU3R5bGUuYmFja2dyb3VuZCA9XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKTtcbiAgICB0aGlzLmdyb3VwU2NvcGVTdHlsZS5jbG9zZUljb25UaW50ID0gIFxuICAgICAgdGhpcy5ncm91cFNjb3BlU3R5bGUuY2xvc2VJY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgICB0aGlzLmdyb3VwU2NvcGVTdHlsZS5idXR0b25CYWNrZ3JvdW5kID0gIFxuICAgICAgdGhpcy5ncm91cFNjb3BlU3R5bGUuYnV0dG9uQmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgfVxuICBzZXRHcm91cE1lbWJlcnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBHcm91cE1lbWJlcnNTdHlsZSA9IG5ldyBHcm91cE1lbWJlcnNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwibm9uZVwiLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBwYWRkaW5nOiBcIjAgMTAwcHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUgfTtcbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUudGl0bGVUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnRpdGxlVGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaEljb25UaW50LFxuICAgICAgc2VhcmNoQm9yZGVyOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaEJvcmRlcixcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hCb3JkZXJSYWRpdXMsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaEJhY2tncm91bmQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcixcbiAgICAgIHNlYXJjaFRleHRGb250OiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaFRleHRGb250LFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLnNlYXJjaFRleHRDb2xvcixcbiAgICB9O1xuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwiXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuICBzZXRTdGF0dXNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSxcbiAgICB9O1xuICB9XG4gIHNldFNjb3BlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ2hhbmdlU2NvcGVTdHlsZSA9IG5ldyBDaGFuZ2VTY29wZVN0eWxlKHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhY3RpdmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBhY3RpdmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhY3RpdmVUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGFycm93SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBvcHRpb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG9wdGlvbkJvcmRlcjogXCJub25lXCIsXG4gICAgICBvcHRpb25Cb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgaG92ZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBob3ZlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGhvdmVyVGV4dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGhlaWdodDogXCIyMDBweFwiLFxuICAgICAgd2lkdGg6IFwiMjgwcHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmdyb3VwU2NvcGVTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmdyb3VwU2NvcGVTdHlsZSB9O1xuICB9XG4gIG1lbWJlcnNTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGFkZGluZzogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5wYWRkaW5nLFxuICAgIH07XG4gIH07XG4gIC8vIHN0eWxlc1xuICBiYWNrQnV0dG9uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmJhY2tCdXR0b25JY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9O1xuICB9O1xuICBjbG9zZUJ1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5jbG9zZUJ1dHRvbkljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIH07XG4gIH07XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5iYWNrZ3JvdW5kIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcbiAgZ2V0U2NvcGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuZ3JvdXBTY29wZVN0eWxlLnRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLmdyb3VwU2NvcGVTdHlsZS50ZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX2JhY2tcIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiICpuZ0lmPVwic2hvd0JhY2tCdXR0b25cIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImJhY2tDbGlja2VkKClcIj5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX193cmFwcGVyXCIgW25nU3R5bGVdPVwibWVtYmVyc1N0eWxlKClcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fbWVudXNcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgICA8Y29tZXRjaGF0LWxpc3QgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwib25TY3JvbGxlZFRvQm90dG9tXCJcbiAgICAgIFtvblNlYXJjaF09XCJvblNlYXJjaFwiIFtsaXN0XT1cImdyb3VwTWVtYmVyc1wiIFtzZWFyY2hUZXh0XT1cInNlYXJjaEtleXdvcmRcIlxuICAgICAgW3NlYXJjaFBsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclwiIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIiBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCJcbiAgICAgIFt0aXRsZV09XCJ0aXRsZVwiIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCI+XG4gICAgPC9jb21ldGNoYXQtbGlzdD5cbiAgICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1ncm91cE1lbWJlcj5cbiAgICAgIDxjb21ldGNoYXQtbGlzdC1pdGVtIFt0aXRsZV09XCJncm91cE1lbWJlcj8ubmFtZVwiIFthdmF0YXJVUkxdPVwiZ3JvdXBNZW1iZXI/LmF2YXRhclwiXG4gICAgICAgIFthdmF0YXJOYW1lXT1cImdyb3VwTWVtYmVyPy5uYW1lXCIgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZShncm91cE1lbWJlcilcIiBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yQ29sb3IoZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2soZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgW3VzZXJQcmVzZW5jZVBsYWNlbWVudF09XCJ1c2VyUHJlc2VuY2VQbGFjZW1lbnRcIj5cbiAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX3N1YnRpdGxlLXZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiIGNsYXNzPVwiY2MtZ3JvdXAtbWVtYmVyc19fb3B0aW9uc1wiICpuZ0lmPVwiICF0YWlsVmlldyAmJiBvcHRpb25zXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhncm91cE1lbWJlcilcIiBbbWVudUxpc3RTdHlsZV09XCJtZW51TGlzdFN0eWxlXCJcbiAgICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwiaGFuZGxlTWVudUFjdGlvbigkZXZlbnQsIGdyb3VwTWVtYmVyKVwiPjwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX190YWlsLXZpZXdcIj5cblxuICAgICAgICAgIDxkaXYgKm5nSWY9XCJ0YWlsVmlld1wiPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IGdyb3VwTWVtYmVyIH1cIj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCIgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zZWxlY3Rpb24tLXNpbmdsZVwiPlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvbiAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25NZW1iZXJTZWxlY3RlZChncm91cE1lbWJlciwkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIiBjbGFzcz1cImNjLWdyb3VwLW1lbWJlcnNfX3NlbGVjdGlvbi0tbXVsdGlwbGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveCAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbk1lbWJlclNlbGVjdGVkKGdyb3VwTWVtYmVyLCRldmVudClcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgKm5nSWY9XCIhdGFpbFZpZXdcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19zY29wZWNoYW5nZVwiIHNsb3Q9XCJ0YWlsVmlld1wiPlxuXG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFttb3JlSWNvblVSTF09XCJtb3JlSWNvblVSTFwiICpuZ0lmPVwiaXNBcnJheShnZXRPcHRpb25zKGdyb3VwTWVtYmVyKSlcIlxuICAgICAgICAgICAgICAgIFt0b3BNZW51U2l6ZV09XCIwXCIgW2RhdGFdPVwiZ2V0T3B0aW9ucyhncm91cE1lbWJlcilcIlxuICAgICAgICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwiaGFuZGxlTWVudUFjdGlvbigkZXZlbnQsIGdyb3VwTWVtYmVyKVwiIFttZW51TGlzdFN0eWxlXT1cIm1lbnVMaXN0U3R5bGVcIj5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsICpuZ0lmPVwiIGlzU3RyaW5nKGdldE9wdGlvbnMoZ3JvdXBNZW1iZXIpKVwiIFt0ZXh0XT1cImdldE9wdGlvbnMoZ3JvdXBNZW1iZXIpXCJcbiAgICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJnZXRTY29wZVN0eWxlKClcIj5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cblxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuXG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1ncm91cC1tZW1iZXJzX19jbG9zZVwiICpuZ0lmPVwiY2xvc2VCdXR0b25JY29uVVJMXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGUoKVwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY2xvc2VDbGlja2VkKClcIj5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG48L2Rpdj5cbjxjb21ldGNoYXQtYmFja2Ryb3AgKm5nSWY9XCJjaGFuZ2VTY29wZSAmJiBtZW1iZXJTY29wZS5sZW5ndGggPiAwXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y29tZXRjaGF0LWNoYW5nZS1zY29wZSBbY2hhbmdlU2NvcGVTdHlsZV09XCJncm91cFNjb3BlU3R5bGVcIiBbb3B0aW9uc109XCJtZW1iZXJTY29wZVwiIFthcnJvd0ljb25VUkxdPVwiZHJvcGRvd25JY29uVVJMXCJcbiAgICAoY2MtY2hhbmdlc2NvcGUtY2xvc2UtY2xpY2tlZCk9XCJjaGFuZ2VTY29wZSA9IGZhbHNlO1wiIChjYy1jaGFuZ2VzY29wZS1jaGFuZ2VkKT1cImNoYW5nZU1lbWJlclNjb3BlKCRldmVudClcIj5cblxuICA8L2NvbWV0Y2hhdC1jaGFuZ2Utc2NvcGU+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD4iXX0=