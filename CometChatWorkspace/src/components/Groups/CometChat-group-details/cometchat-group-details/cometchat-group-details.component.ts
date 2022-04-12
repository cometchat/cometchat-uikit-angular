import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";
import { CometChatService } from "./../../../../utils/cometchat.service";

@Component({
  selector: "cometchat-group-details",
  templateUrl: "./cometchat-group-details.component.html",
  styleUrls: ["./cometchat-group-details.component.css"],
})
export class CometChatGroupDetailsComponent implements OnInit, OnDestroy {
  @Input() item: any = null;
  @Input() type: string = '';

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  guid = null;
  groupMemberRequest: any = null;
  bannedGroupMemberRequest: any = null;

  userListenerId = enums.GROUP_DETAIL_USER_ + new Date().getTime();
  groupListenerId = enums.GROUP_DETAIL_GROUP_ + new Date().getTime();

  memberList: any = [];
  bannedMemberList: any = [];
  administratorsList: any = [];
  moderatorsList: any = [];
  loggedInUser = null;

  openViewMember: boolean = false;
  openBanMember: boolean = false;
  openAddMemberView: boolean = false;

  currentMemberScope: String = "";

  ADMIN: String = CometChat.GROUP_MEMBER_SCOPE.ADMIN;
  MODERATOR: String = COMETCHAT_CONSTANTS.MODERATOR;
  PARTICIPANT: String = COMETCHAT_CONSTANTS.PARTICIPANT;
  ADD_MEMBERS: String = COMETCHAT_CONSTANTS.ADD_MEMBERS;
  DELETE_AND_EXIT: String = COMETCHAT_CONSTANTS.DELETE_AND_EXIT;
  LEAVE_GROUP: String = COMETCHAT_CONSTANTS.LEAVE_GROUP;
  BANNED_MEMBERS: String = COMETCHAT_CONSTANTS.BANNED_MEMBERS;
  OPTIONS: String = COMETCHAT_CONSTANTS.OPTIONS;
  VIEW_MEMBERS: String = COMETCHAT_CONSTANTS.VIEW_MEMBERS;
  DETAILS: String = COMETCHAT_CONSTANTS.DETAILS;

  constructor(private CometChatService: CometChatService) {}

  ngOnInit() {
    try {
      this.groupMemberRequest = this.createGroupMemberRequest(this.item.guid);
      this.getGroupMembers();

      this.bannedGroupMemberRequest = this.createBannedMemberRequest(
        this.item.guid
      );
      this.getBannedGroupMembers();

      this.currentMemberScope = this.checkMemberScope(this.item);

      this.addEventListeners(this.groupUpdated);
    } catch (error) {
      logger(error);
    }
  }

  ngOnDestroy() {
    try {
      this.removeListeners();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    try {
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Listener for activities happening in group in real time
   * @param
   */
  addEventListeners(callback: any) {
    try {
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            message: any,
            changedUser: any,
            newScope: any,
            oldScope: any,
            changedGroup: any
          ) => {
            callback(enums.GROUP_MEMBER_SCOPE_CHANGED, message, changedGroup, {
              user: changedUser,
              scope: newScope,
            });
          },
          onGroupMemberKicked: (message: any, kickedUser: any, kickedBy: any, kickedFrom: any) => {
            callback(enums.GROUP_MEMBER_KICKED, message, kickedFrom, {
              user: kickedUser,
              hasJoined: false,
            });
          },
          onGroupMemberBanned: (message: any, bannedUser: any, bannedBy: any, bannedFrom: any) => {
            callback(enums.GROUP_MEMBER_BANNED, message, bannedFrom, {
              user: bannedUser,
            });
          },
          onGroupMemberUnbanned: (
            message: any,
            unbannedUser: any,
            unbannedBy: any,
            unbannedFrom: any
          ) => {
            callback(enums.GROUP_MEMBER_UNBANNED, message, unbannedFrom, {
              user: unbannedUser,
              hasJoined: false,
            });
          },
          onMemberAddedToGroup: (
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any
          ) => {
            callback(enums.GROUP_MEMBER_ADDED, message, userAddedIn, {
              user: userAdded,
              hasJoined: true,
            });
          },
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
            callback(enums.GROUP_MEMBER_LEFT, message, group, {
              user: leavingUser,
            });
          },
          onGroupMemberJoined: (message: any, joinedUser: any, joinedGroup: any) => {
            callback(enums.GROUP_MEMBER_JOINED, message, joinedGroup, {
              user: joinedUser,
            });
          },
        })
      );

      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: object) => {
            /* when someuser/friend comes online, user will be received here */
            callback(
              enums.USER_ONLINE,
              null,
              { guid: this.guid },
              { user: onlineUser }
            );
          },
          onUserOffline: (offlineUser: object) => {
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Removes all the real time group listeners attached to the group that is opened
   * @param
   */
  removeListeners() {
    try {
      CometChat.removeUserListener(this.userListenerId);
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Creates a Group MemberList request object
   * @param
   */
  createGroupMemberRequest(guid: any) {
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
    try {
      const administratorsList: any = [],
        moderatorsList: Array<any> = [];
      CometChat.getLoggedinUser()
        .then((user: any) => {
          this.loggedInUser = user;
          this.fetchNextGroupMembers()
            .then((groupMembers: any) => {
              groupMembers.forEach((member: any) => {
                if (member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
                  administratorsList.push(member);
                }

                if (member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
                  moderatorsList.push(member);
                }
              });

              this.memberList = [...this.memberList, ...groupMembers];
              this.administratorsList = [
                ...this.administratorsList,
                ...administratorsList,
              ];
              this.moderatorsList = [...this.moderatorsList, ...moderatorsList];
            })
            .catch((error: any) => {
              logger(
                "[CometChatGroupDetail] getGroupMembers fetchNextGroupMembers error",
                error
              );
            });
        })
        .catch((error) => {
          logger(
            "[CometChatGroupDetail] getGroupMembers getLoggedInUser error",
            error
          );
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Creates a Banned MemberList request object
   * @param
   */
  createBannedMemberRequest(guid: any) {
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
  getBannedGroupMembers = (): boolean => {
    try {
      if (this.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
        return false;
      }

      CometChat.getLoggedinUser()
        .then((user) => {
          this.fetchNextBannedGroupMembers()
            .then((bannedMembers: any) => {
              this.bannedMemberList = [
                ...this.bannedMemberList,
                ...bannedMembers,
              ];
            })
            .catch((error: any) => {
              logger(
                "[CometChatGroupDetail] getGroupMembers fetchNextGroupMembers error",
                error
              );
            });
        })
        .catch((error) => {
          logger(
            "[CometChatGroupDetail] getGroupMembers getLoggedInUser error",
            error
          );
        });
    } catch (error) {
      logger(error);
    }
    return true;
  };

  /**
   * Updates group infomation based on activities happening in the group
   */
  groupUpdated = (key: any = null, message = null, group: any = null, options: any = null): boolean => {
    try {
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
              scope: options[enums.SCOPE],
            });
            this.updateParticipants(updatedMember);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
    return true;
  };

  /**
   * Adds the members that are banned to bannedMemberList
   * @param any members
   */
  banMembers = (members: any) => {
    try {
      // this.bannedMemberList.push(members)
      this.bannedMemberList = [...this.bannedMemberList, ...members];
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates group member data and information based on group actions
   * @param any member
   */
  groupMemberUpdated = (member: any) => {
    try {
      let memberList = [...this.memberList];
      //search for user
      let memberKey = memberList.findIndex((m, k) => m.uid === member.uid);
      //if found in the list, update user object
      if (memberKey > -1) {
        let memberObj = memberList[memberKey];
        let newMemberObj = Object.assign({}, memberObj, member);
        memberList.splice(memberKey, 1, newMemberObj);

        this.memberList = memberList;
      }

      let bannedMemberList = [...this.bannedMemberList];
      //search for user
      let bannedMemberKey = bannedMemberList.findIndex(
        (m: any, k) => m.uid === member.uid
      );
      //if found in the list, update user object
      if (bannedMemberKey > -1) {
        let bannedMemberObj = bannedMemberList[bannedMemberKey];
        let newBannedMemberObj = Object.assign({}, bannedMemberObj, member);
        bannedMemberList.splice(bannedMemberKey, 1, newBannedMemberObj);

        this.bannedMemberList = bannedMemberList;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * fetches next list of group members as the user scrolls to the bottom
   * @param
   */
  fetchNextGroupMembers() {
    try {
      return this.groupMemberRequest.fetchNext();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * fetches next list of Banned members as the user scrolls to the bottom of banned member list
   * @param
   */
  fetchNextBannedGroupMembers() {
    try {
      return this.bannedGroupMemberRequest.fetchNext();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Helps to Add Particpants to the current group
   */
  addParticipants = (members: any, triggerUpdate = true) => {
    try {
      const memberList = [...this.memberList, ...members];

      this.memberList = memberList;

      this.actionGenerated.emit({
        type: enums.MEMBERS_ADDED,
        payLoad: members,
      });
      if (triggerUpdate) {
        this.actionGenerated.emit({
          type: enums.MEMBERS_UPDATED,
          payLoad: { item: this.item, count: memberList.length },
        });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates Group Participant's data according to the group activities
   */
  updateParticipants = (updatedMember: any) => {
    try {
      const memberList = [...this.memberList];

      const memberKey = memberList.findIndex(
        (member: any) => member.uid === updatedMember.uid
      );
      if (memberKey > -1) {
        const memberObj = memberList[memberKey];
        const newMemberObj = Object.assign({}, memberObj, updatedMember, {
          scope: updatedMember[enums.SCOPE],
        });

        memberList.splice(memberKey, 1, newMemberObj);

        this.actionGenerated.emit({
          type: enums.MEMBER_SCOPE_CHANGED,
          payLoad: [newMemberObj],
        });

        this.memberList = [...memberList];
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Removes the participant from the group member list , when the member is banned
   */
  removeParticipants = (member: any, triggerUpdate = true) => {
    try {
      const groupmembers = [...this.memberList];
      const filteredMembers = groupmembers.filter((groupmember: any) => {
        if (groupmember.uid === member.uid) {
          return false;
        }
        return true;
      });

      this.memberList = [...filteredMembers];

      if (triggerUpdate) {
        this.actionGenerated.emit({
          type: enums.MEMBERS_UPDATED,
          payLoad: {
            item: this.item,
            count: filteredMembers.length,
          },
        });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Removes the participant from the banned member list , when the member is unbanned
   * @param
   */
  unbanMembers(members: any) {
    try {
      const bannedMembers = [...this.bannedMemberList];
      const unbannedMembers: any = [];

      const filteredBannedMembers = bannedMembers.filter((bannedmember: any) => {
        const found = members.find((member: any) => bannedmember.uid === member.uid);
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

      this.bannedMemberList = [...filteredBannedMembers];
    } catch (error) {
      logger(error);
    }
  }
  /* helps the user to leave the group
   * @param
   */
  leaveGroup = () => {
    try {
      const guid = this.item.guid;
      CometChat.leaveGroup(guid)
        .then((hasLeft) => {
          logger("Group left successfully:", hasLeft);
          this.CometChatService.onLeaveGroup.next(this.item);
        })
        .catch((error) => {
          logger("Group leaving failed with exception:", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * helps the user (that is admin of the group) to delete the group
   * @param
   */
  deleteGroup = () => {
    try {
      const guid = this.item.guid;
      CometChat.deleteGroup(guid)
        .then((response) => {
          logger("Groups deleted successfully:", response);
          this.actionGenerated.emit({
            type: enums.DELETE_GROUP,
            payLoad: this.item,
          });
        })
        .catch((error) => {
          logger("Group delete failed with exception:", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Returns the role/scope that the current user has , for the group that is currently opened
   * @param Any member
   */
  checkMemberScope (group: any) {
      //group.scope is key which holds the role of the current user in this group

      if (group.scope == COMETCHAT_CONSTANTS.OWNER) {
        return this.ADMIN;
      }

      if (group.scope == CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
        return this.ADMIN;
      } else if (group.scope == CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
        return this.MODERATOR;
      } else {
        return this.PARTICIPANT;
      }
  };

  /**
   * opens/closes view member modal
   */
  toggleViewMember() {
    try {
      this.openViewMember = !this.openViewMember;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * opens/closes ban member view
   */
  toggleBanMember() {
    try {
      this.openBanMember = !this.openBanMember;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * opens/closes add member view
   */
  toggleAddMemberView(show: boolean) {
    try {
      this.openAddMemberView = show;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Close thread when opened in small screen
   */
  closeThreadView() {
    try {
      this.actionGenerated.emit({
        type: enums.CLOSE_DETAIL_CLICKED,
      });
    } catch (error) {
      logger(error);
    }
  }
}
