import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-group-details",
  templateUrl: "./cometchat-group-details.component.html",
  styleUrls: ["./cometchat-group-details.component.css"],
})
export class CometChatGroupDetailsComponent implements OnInit, OnDestroy {
  @Input() item = null;
  @Input() type = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  guid = null;
  groupMemberRequest = null;
  bannedGroupMemberRequest = null;

  userListenerId = "group_detail_user_" + new Date().getTime();
  groupListenerId = "group_detail_group_" + new Date().getTime();

  memberlist = [];
  bannedmemberlist = [];
  administratorslist = [];
  moderatorslist = [];
  loggedInUser = null;

  openViewMember: boolean = false;
  openBanMember: boolean = false;
  openAddMemberView: boolean = false;

  currentMemberScope = "";

  ADD_MEMBERS: String = STRING_MESSAGES.ADD_MEMBERS;
  DELETE_AND_EXIT: String = STRING_MESSAGES.DELETE_AND_EXIT;
  LEAVE_GROUP: String = STRING_MESSAGES.LEAVE_GROUP;
  BANNED_MEMBERS: String = STRING_MESSAGES.BANNED_MEMBERS;
  OPTIONS: String = STRING_MESSAGES.OPTIONS;
  VIEW_MEMBERS: String = STRING_MESSAGES.VIEW_MEMBERS;
  DETAILS: String = STRING_MESSAGES.DETAILS;

  constructor() {}

  ngOnInit() {
    this.groupMemberRequest = this.createGroupMemberRequest(this.item.guid);
    this.getGroupMembers();

    this.bannedGroupMemberRequest = this.createBannedMemberRequest(
      this.item.guid
    );
    this.getBannedGroupMembers();

    this.currentMemberScope = this.checkMemberScope(this.item);

    this.addEventListeners(this.groupUpdated);
  }

  ngOnDestroy() {
    this.removeListeners();
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    let data = action.payLoad;

    switch (action.type) {
      case enums.OPEN_VIEW_MEMBER: {
        this.toggleViewMember();
        break;
      }
      case enums.CLOSE_ADD_VIEW_MEMBER: {
        this.toggleAddMemberView(false);
        break;
      }
      case enums.UPDATE_GROUP_PARTICIPANTS: {
        this.updateParticipants(data);
        break;
      }
      case enums.ADD_GROUP_PARTICIPANTS: {
        this.addParticipants(data);
        break;
      }
      case enums.REMOVE_GROUP_PARTICIPANTS: {
        this.removeParticipants(data);
        break;
      }
      case enums.BAN_MEMBER: {
        this.toggleBanMember();
        break;
      }
      case enums.UNBAN_GROUP_MEMBERS:
        this.unbanMembers(data);
        break;
    }
  }

  /**
   * Listener for activities happening in group in real time
   * @param
   */
  addEventListeners(callback) {
    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message,
          changedUser,
          newScope,
          oldScope,
          changedGroup
        ) => {
          callback(enums.GROUP_MEMBER_SCOPE_CHANGED, message, changedGroup, {
            user: changedUser,
            scope: newScope,
          });
        },
        onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
          callback(enums.GROUP_MEMBER_KICKED, message, kickedFrom, {
            user: kickedUser,
            hasJoined: false,
          });
        },
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          callback(enums.GROUP_MEMBER_BANNED, message, bannedFrom, {
            user: bannedUser,
          });
        },
        onGroupMemberUnbanned: (
          message,
          unbannedUser,
          unbannedBy,
          unbannedFrom
        ) => {
          callback(enums.GROUP_MEMBER_UNBANNED, message, unbannedFrom, {
            user: unbannedUser,
            hasJoined: false,
          });
        },
        onMemberAddedToGroup: (
          message,
          userAdded,
          userAddedBy,
          userAddedIn
        ) => {
          callback(enums.GROUP_MEMBER_ADDED, message, userAddedIn, {
            user: userAdded,
            hasJoined: true,
          });
        },
        onGroupMemberLeft: (message, leavingUser, group) => {
          callback(enums.GROUP_MEMBER_LEFT, message, group, {
            user: leavingUser,
          });
        },
        onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
          callback(enums.GROUP_MEMBER_JOINED, message, joinedGroup, {
            user: joinedUser,
          });
        },
      })
    );

    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          /* when someuser/friend comes online, user will be received here */
          callback(
            enums.USER_ONLINE,
            null,
            { guid: this.guid },
            { user: onlineUser }
          );
        },
        onUserOffline: (offlineUser) => {
          /* when someuser/friend went offline, user will be received here */
          callback(
            enums.USER_OFFLINE,
            null,
            { guid: this.guid },
            { user: offlineUser }
          );
        },
      })
    );
  }

  /**
   * Removes all the real time group listeners attached to the group that is opened
   * @param
   */
  removeListeners() {
    CometChat.removeUserListener(this.userListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
  }

  /**
   * Creates a Group MemberList request object
   * @param
   */
  createGroupMemberRequest(guid) {
    let groupMemberRequest = new CometChat.GroupMembersRequestBuilder(guid)
      .setLimit(10)
      .build();

    return groupMemberRequest;
  }

  /**
   * Fetches list of group member accroding to the group member request object
   * @param
   */
  getGroupMembers() {
    const administratorslist = [],
      moderatorslist = [];
    CometChat.getLoggedinUser()
      .then((user) => {
        this.loggedInUser = user;
        this.fetchNextGroupMembers()
          .then((groupMembers) => {
            groupMembers.forEach((member) => {
              if (member.scope === "admin") {
                administratorslist.push(member);
              }

              if (member.scope === "moderator") {
                moderatorslist.push(member);
              }
            });

            this.memberlist = [...this.memberlist, ...groupMembers];
            this.administratorslist = [
              ...this.administratorslist,
              ...administratorslist,
            ];
            this.moderatorslist = [...this.moderatorslist, ...moderatorslist];
          })
          .catch((error) => {
            console.error(
              "[CometChatGroupDetail] getGroupMembers fetchNextGroupMembers error",
              error
            );
          });
      })
      .catch((error) => {
        console.log(
          "[CometChatGroupDetail] getGroupMembers getLoggedInUser error",
          error
        );
      });
  }

  /**
   * Creates a Banned MemberList request object
   * @param
   */
  createBannedMemberRequest(guid) {
    let bannedGroupMemberRequest = new CometChat.BannedMembersRequestBuilder(
      guid
    )
      .setLimit(10)
      .build();

    return bannedGroupMemberRequest;
  }

  /**
   * Fetches list of Banned members accroding to the  banned members request object
   * @param
   */
  getBannedGroupMembers = () => {
    if (this.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
      return false;
    }

    CometChat.getLoggedinUser()
      .then((user) => {
        this.fetchNextBannedGroupMembers()
          .then((bannedMembers) => {
            this.bannedmemberlist = [
              ...this.bannedmemberlist,
              ...bannedMembers,
            ];
          })
          .catch((error) => {
            console.error(
              "[CometChatGroupDetail] getGroupMembers fetchNextGroupMembers error",
              error
            );
          });
      })
      .catch((error) => {
        console.log(
          "[CometChatGroupDetail] getGroupMembers getLoggedInUser error",
          error
        );
      });
  };

  groupUpdated = (key = null, message = null, group = null, options = null) => {
    const guid = this.item.guid;
    if (guid !== group.guid) {
      return false;
    }

    switch (key) {
      case enums.USER_ONLINE:
      case enums.USER_OFFLINE:
        this.groupMemberUpdated(options.user);
        break;
      case enums.GROUP_MEMBER_ADDED:
      case enums.GROUP_MEMBER_JOINED:
        {
          const member = options.user;

          const updatedMember = Object.assign({}, member, {
            scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
          });

          this.addParticipants([updatedMember], false);
        }
        break;
      case enums.GROUP_MEMBER_LEFT:
      case enums.GROUP_MEMBER_KICKED:
        {
          const member = options.user;
          this.removeParticipants(member, false);
        }
        break;
      case enums.GROUP_MEMBER_BANNED:
        {
          const member = options.user;
          this.banMembers([member]);
          this.removeParticipants(member, false);
        }
        break;
      case enums.GROUP_MEMBER_UNBANNED:
        {
          const member = options.user;
          this.unbanMembers([member]);
        }
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
        {
          const member = options.user;
          const updatedMember = Object.assign({}, member, {
            scope: options["scope"],
          });
          this.updateParticipants(updatedMember);
        }
        break;
      default:
        break;
    }
  };

  /**
   * Adds the members that are banned to bannedMemberList
   * @param any members
   */
  banMembers = (members) => {
    this.bannedmemberlist = [...this.bannedmemberlist, ...members];
  };

  /**
   * Updates group member data and information based on group actions
   * @param any member
   */
  groupMemberUpdated = (member) => {
    let memberlist = [...this.memberlist];
    //search for user
    let memberKey = memberlist.findIndex((m, k) => m.uid === member.uid);
    //if found in the list, update user object
    if (memberKey > -1) {
      let memberObj = memberlist[memberKey];
      let newMemberObj = Object.assign({}, memberObj, member);
      memberlist.splice(memberKey, 1, newMemberObj);

      this.memberlist = memberlist;
    }

    let bannedmemberlist = [...this.bannedmemberlist];
    //search for user
    let bannedMemberKey = bannedmemberlist.findIndex(
      (m, k) => m.uid === member.uid
    );
    //if found in the list, update user object
    if (bannedMemberKey > -1) {
      let bannedMemberObj = bannedmemberlist[bannedMemberKey];
      let newBannedMemberObj = Object.assign({}, bannedMemberObj, member);
      bannedmemberlist.splice(bannedMemberKey, 1, newBannedMemberObj);

      this.bannedmemberlist = bannedmemberlist;
    }
  };

  /**
   * fetches next list of group members as the user scrolls to the bottom
   * @param
   */
  fetchNextGroupMembers() {
    return this.groupMemberRequest.fetchNext();
  }

  /**
   * fetches next list of Banned members as the user scrolls to the bottom
   * @param
   */
  fetchNextBannedGroupMembers() {
    return this.bannedGroupMemberRequest.fetchNext();
  }

  /**
   * Add Particpants to the current group
   * @param
   */
  addParticipants = (members, triggerUpdate = true) => {
    const memberlist = [...this.memberlist, ...members];

    this.memberlist = memberlist;

    this.actionGenerated.emit({ type: enums.MEMBERS_ADDED, payLoad: members });
    if (triggerUpdate) {
      this.actionGenerated.emit({
        type: enums.MEMBERS_UPDATED,
        payLoad: { item: this.item, count: memberlist.length },
      });
    }
  };

  /**
   * Updates Group Participant's data according to the group activities
   * @param
   */
  updateParticipants = (updatedMember) => {
    const memberlist = [...this.memberlist];

    const memberKey = memberlist.findIndex(
      (member) => member.uid === updatedMember.uid
    );
    if (memberKey > -1) {
      const memberObj = memberlist[memberKey];
      const newMemberObj = Object.assign({}, memberObj, updatedMember, {
        scope: updatedMember["scope"],
      });

      memberlist.splice(memberKey, 1, newMemberObj);

      this.actionGenerated.emit({
        type: enums.MEMBER_SCOPE_CHANGED,
        payLoad: [newMemberObj],
      });

      this.memberlist = [...memberlist];
    }
  };

  /**
   * Removes the participant from the group member list , when the member is banned
   * @param Any member
   */
  removeParticipants = (member, triggerUpdate = true) => {
    const groupmembers = [...this.memberlist];
    const filteredMembers = groupmembers.filter((groupmember) => {
      if (groupmember.uid === member.uid) {
        return false;
      }
      return true;
    });

    this.memberlist = [...filteredMembers];

    if (triggerUpdate) {
      this.actionGenerated.emit({
        type: enums.MEMBERS_UPDATED,
        payLoad: {
          item: this.item,
          count: filteredMembers.length,
        },
      });
    }
  };

  /**
   * Removes the participant from the banned member list , when the member is unbanned
   * @param
   */
  unbanMembers(members) {
    const bannedMembers = [...this.bannedmemberlist];
    const unbannedMembers = [];

    const filteredBannedMembers = bannedMembers.filter((bannedmember) => {
      const found = members.find((member) => bannedmember.uid === member.uid);
      if (found) {
        unbannedMembers.push(found);
        return false;
      }
      return true;
    });

    this.actionGenerated.emit({
      type: enums.MEMBER_UNBANNED,
      payLoad: unbannedMembers,
    });

    this.bannedmemberlist = [...filteredBannedMembers];
  }
  /* helps the user to leave the group
   * @param
   */
  leaveGroup = () => {
    const guid = this.item.guid;
    CometChat.leaveGroup(guid)
      .then((hasLeft) => {
        console.log("Group left successfully:", hasLeft);
        this.actionGenerated.emit({
          type: enums.LEFT_GROUP,
          payLoad: this.item,
        });
      })
      .catch((error) => {
        console.log("Group leaving failed with exception:", error);
      });
  };

  /**
   * helps the user (that is admin of the group) to delete the group
   * @param
   */
  deleteGroup = () => {
    const guid = this.item.guid;
    CometChat.deleteGroup(guid)
      .then((response) => {
        console.log("Groups deleted successfully:", response);
        this.actionGenerated.emit({
          type: enums.DELETE_GROUP,
          payLoad: this.item,
        });
      })
      .catch((error) => {
        console.log("Group delete failed with exception:", error);
      });
  };

  /**
   * Returns the role/scope that the current user has , for the group that is currently opened
   * @param Any member
   */
  checkMemberScope = (group) => {
    //group.scope is key which holds the role of the current user in this group

    if (group.scope == STRING_MESSAGES.OWNER) {
      return "admin";
    }

    if (group.scope == CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
      return "admin";
    } else if (group.scope == CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
      return "moderator";
    } else {
      return "participant";
    }
  };

  toggleViewMember() {
    this.openViewMember = !this.openViewMember;
  }
  toggleBanMember() {
    this.openBanMember = !this.openBanMember;
  }
  toggleAddMemberView(show) {
    this.openAddMemberView = show;
  }
  /**
   * Close thread when opened in small screen
   */
  closeThreadView() {
    this.actionGenerated.emit({
      type: enums.CLOSE_DETAIL_CLICKED,
    });
  }
}
