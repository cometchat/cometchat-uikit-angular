import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-group-list",
  templateUrl: "./cometchat-group-list.component.html",
  styleUrls: ["./cometchat-group-list.component.css"],
})
export class CometChatGroupListComponent
  implements OnInit, OnDestroy, OnChanges {
  @Input() enableSelectedGroupStyling = false;
  @Input() groupToUpdate = null;
  @Input() groupToLeave = null;
  @Input() groupToDelete = null;

  timeout;
  loggedInUser = null;
  decoratorMessage = "";
  searchKey = "";
  selectedGroup = null;
  groupList = [];
  groupRequest = null;
  groupListenerId = enums.GROUP_LIST_ + new Date().getTime();

  openCreateGroupView: boolean = false;
  GROUPS: String = COMETCHAT_CONSTANTS.GROUPS;
  SEARCH: String = COMETCHAT_CONSTANTS.SEARCH;

  @Output() onGroupClick: EventEmitter<any> = new EventEmitter();

  constructor(private ref: ChangeDetectorRef) {
    setInterval(() => {
      if (!this.ref[enums.DESTROYED]) {
        this.ref.detectChanges();
      }
    }, 5000);
  }

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.GROUP_TO_UPDATE]) {
        let prevProps = { groupToUpdate: null };
        let props = { groupToUpdate: null };

        prevProps[enums.GROUP_TO_UPDATE] =
          change[enums.GROUP_TO_UPDATE].previousValue;
        props[enums.GROUP_TO_UPDATE] =
          change[enums.GROUP_TO_UPDATE].currentValue;

        if (
          prevProps.groupToUpdate &&
          (prevProps.groupToUpdate.guid !== props.groupToUpdate.guid ||
            (prevProps.groupToUpdate.guid === props.groupToUpdate.guid &&
              (prevProps.groupToUpdate.membersCount !==
                props.groupToUpdate.membersCount ||
                prevProps.groupToUpdate.scope !== props.groupToUpdate.scope)))
        ) {
          const groups = [...this.groupList];
          const groupToUpdate = this.groupToUpdate;

          const groupKey = groups.findIndex(
            (group) => group.guid === groupToUpdate.guid
          );
          if (groupKey > -1) {
            const groupObj = groups[groupKey];
            const newGroupObj = Object.assign({}, groupObj, groupToUpdate, {
              scope: groupToUpdate[enums.SCOPE],
              membersCount: groupToUpdate[enums.MEMBERS_COUNT],
            });

            groups.splice(groupKey, 1, newGroupObj);

            this.groupList = groups;
          }
        }
      }

      if (change[enums.GROUP_TO_LEAVE]) {
        let prevProps = { groupToLeave: null };
        let props = { groupToLeave: null };

        prevProps[enums.GROUP_TO_LEAVE] =
          change[enums.GROUP_TO_LEAVE].previousValue;
        props[enums.GROUP_TO_LEAVE] = change[enums.GROUP_TO_LEAVE].currentValue;

        if (
          prevProps.groupToLeave &&
          prevProps.groupToLeave.guid !== props.groupToLeave.guid
        ) {
          const groups = [...this.groupList];
          const groupKey = groups.findIndex(
            (member) => member.guid === props.groupToLeave.guid
          );

          if (groupKey > -1) {
            const groupToLeave = props.groupToLeave;
            const groupObj = { ...groups[groupKey] };
            const membersCount =
              parseInt(groupToLeave[enums.MEMBERS_COUNT]) - 1;

            let newgroupObj = Object.assign({}, groupObj, {
              membersCount: membersCount,
              hasJoined: false,
            });

            groups.splice(groupKey, 1, newgroupObj);

            this.groupList = groups;
          }
        }
      }

      if (change[enums.GROUP_TO_DELETE]) {
        let prevProps = { groupToDelete: null };
        let props = { groupToDelete: null };

        prevProps[enums.GROUP_TO_DELETE] =
          change[enums.GROUP_TO_DELETE].previousValue;
        props[enums.GROUP_TO_DELETE] =
          change[enums.GROUP_TO_DELETE].currentValue;

        if (
          prevProps.groupToDelete &&
          prevProps.groupToDelete.guid !== props.groupToDelete.guid
        ) {
          const groups = [...this.groupList];
          const groupKey = groups.findIndex(
            (member) => member.guid === props.groupToDelete.guid
          );
          if (groupKey > -1) {
            groups.splice(groupKey, 1);

            this.groupList = groups;

            if (groups.length === 0) {
              this.decoratorMessage = COMETCHAT_CONSTANTS.NO_GROUPS_FOUND;
            }
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.groupRequest = this.groupListRequestBuilder(this.searchKey);
      this.getGroups();
      this.attachListeners(this.groupUpdated);
    } catch (error) {
      logger(error);
    }
  }

  ngOnDestroy() {
    try {
      //Removing Group Listeners
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Listener for group activities happening in real time
   * @param function callback
   */
  attachListeners(callback) {
    try {
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
              hasJoined: false,
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Builds a request for fetching a list of group matching the serach key
   * @param String searchKey
   */
  groupListRequestBuilder(searchKey = "") {
    try {
      let groupRequest = null;

      if (searchKey !== "") {
        groupRequest = new CometChat.GroupsRequestBuilder()
          .setLimit(30)
          .setSearchKeyword(searchKey)
          .build();
      } else {
        groupRequest = new CometChat.GroupsRequestBuilder()
          .setLimit(30)
          .build();
      }
      return groupRequest;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Fetches list of groups according to the group request config , if a user is loggedIn correctly
   */
  getGroups = () => {
    try {
      this.decoratorMessage = COMETCHAT_CONSTANTS.LOADING_MESSSAGE;

      CometChat.getLoggedinUser()
        .then((user) => {
          this.loggedInUser = user;
          this.fetchNextGroups()
            .then((groupList) => {
              if (groupList.length === 0) {
                this.decoratorMessage = COMETCHAT_CONSTANTS.NO_GROUPS_FOUND;
              }

              this.groupList = [...this.groupList, ...groupList];

              this.decoratorMessage = "";

              if (this.groupList.length === 0) {
                this.decoratorMessage = COMETCHAT_CONSTANTS.NO_GROUPS_FOUND;
              }
            })
            .catch((error) => {
              this.decoratorMessage = COMETCHAT_CONSTANTS.ERROR;
              logger(
                "[CometChatGroupList] getGroups fetchNextGroups error",
                error
              );
            });
        })
        .catch((error) => {
          this.decoratorMessage = COMETCHAT_CONSTANTS.ERROR;
          logger("[CometChatGroupList] getUsers getLoggedInUser error", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Fetches list of groups according to the group request config
   * @param Event action
   */
  fetchNextGroups() {
    try {
      return this.groupRequest.fetchNext();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Fetches list of groups according to the group request config
   * @param Event action
   */
  createGroupActionHandler = (group) => {
    try {
      const groupList = [group, ...this.groupList];
      this.groupList = groupList;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Emitting the Group clicked so that it can be used in the parent component
   * @param Any group
   */
  groupClicked(group) {
    try {
      if (group.hasJoined === false) {
        let password = "";
        if (group.type === CometChat.GROUP_TYPE.PASSWORD) {
          password = prompt(COMETCHAT_CONSTANTS.ENTER_YOUR_PASSWORD);
        }

        const guid = group.guid;
        const groupType = group.type;

        this.joinGroup(guid, groupType, password);
      } else {
        this.onGroupClick.emit(group);

        if (this.enableSelectedGroupStyling) {
          this.selectedGroup = group;
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Helps the current user to join a password protected group , if the password entered by the user is correct
   * @param Event event
   */
  joinGroup(guid: any, groupType: any, password: string) {
    try {
      CometChat.joinGroup(guid, groupType, password)
        .then((response) => {
          logger("Group joining success with response", response);

          const groups = [...this.groupList];

          let groupKey = groups.findIndex((g, k) => g.guid === guid);
          if (groupKey > -1) {
            const groupObj = groups[groupKey];
            const newGroupObj = Object.assign({}, groupObj, response, {
              scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
            });

            groups.splice(groupKey, 1, newGroupObj);

            this.groupList = groups;
            if (this.enableSelectedGroupStyling) {
              this.selectedGroup = newGroupObj;
            }

            this.onGroupClick.emit(newGroupObj);
          }
        })
        .catch((error) => {
          logger("Group joining failed with exception:", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Searches for a list of groups matching the search key
   * @param Event event
   */
  searchGroup(event) {
    try {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      let val = event.target.value;
      this.timeout = setTimeout(() => {
        this.groupRequest = this.groupListRequestBuilder(val);

        this.groupList = [];
        this.getGroups();
      }, 1000);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates group information based on activities in the group
   */
  groupUpdated = (key, message, group, options) => {
    try {
      switch (key) {
        case enums.GROUP_MEMBER_SCOPE_CHANGED:
          this.updateMemberChanged(group, options);
          break;
        case enums.GROUP_MEMBER_KICKED:
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_LEFT:
          this.updateMemberRemoved(group, options);

          break;
        case enums.GROUP_MEMBER_ADDED:
          this.updateMemberAdded(group, options);

          break;
        case enums.GROUP_MEMBER_JOINED:
          this.updateMemberJoined(group, options);

          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates the member count of a group when a person is removed from the group
   */
  updateMemberRemoved = (group, options) => {
    try {
      let groupList = [...this.groupList];

      //search for group
      let groupKey = groupList.findIndex((g, k) => g.guid === group.guid);

      if (groupKey > -1) {
        if (options && this.loggedInUser.uid === options.user.uid) {
          let groupObj = { ...groupList[groupKey] };

          let newgroupObj = Object.assign({}, groupObj, group);

          groupList.splice(groupKey, 1, newgroupObj);

          this.groupList = groupList;
        } else {
          let groupObj = { ...groupList[groupKey] };
          let membersCount = parseInt(group.membersCount);

          let newgroupObj = Object.assign({}, groupObj, {
            membersCount: membersCount,
          });

          groupList.splice(groupKey, 1, newgroupObj);
          this.groupList = groupList;
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates the member count of a group when a person (  or group of people  ) is added to the group
   */
  updateMemberAdded = (group, options) => {
    try {
      let groupList = [...this.groupList];

      //search for group
      let groupKey = groupList.findIndex((g, k) => g.guid === group.guid);

      if (groupKey > -1) {
        let groupObj = { ...groupList[groupKey] };

        let membersCount = parseInt(group.membersCount);

        let scope = group.hasOwnProperty(enums.SCOPE) ? group.scope : "";
        let hasJoined = group.hasOwnProperty(enums.HAS_JOINED)
          ? group.hasJoined
          : false;

        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          hasJoined = true;
        }

        let newgroupObj = Object.assign({}, groupObj, {
          membersCount: membersCount,
          scope: scope,
          hasJoined: hasJoined,
        });

        groupList.splice(groupKey, 1, newgroupObj);
        this.groupList = groupList;
      } else {
        let groupObj = { ...group };

        let scope = groupObj.hasOwnProperty(enums.SCOPE) ? groupObj.scope : {};
        let hasJoined = groupObj.hasOwnProperty(enums.HAS_JOINED)
          ? groupObj.hasJoined
          : false;
        let membersCount = parseInt(groupObj.membersCount);

        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          hasJoined = true;
        }

        let newgroupObj = Object.assign({}, groupObj, {
          membersCount: membersCount,
          scope: scope,
          hasJoined: hasJoined,
        });

        const groupList = [newgroupObj, ...this.groupList];
        this.groupList = groupList;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates the member count of a group based when a user joins the group
   */
  updateMemberJoined = (group, options) => {
    try {
      let groupList = [...this.groupList];

      //search for group
      let groupKey = groupList.findIndex((g, k) => g.guid === group.guid);

      if (groupKey > -1) {
        let groupObj = { ...groupList[groupKey] };

        let scope = groupObj.scope;
        let membersCount = parseInt(group.membersCount);

        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        }

        let newgroupObj = Object.assign({}, groupObj, {
          membersCount: membersCount,
          scope: scope,
        });

        groupList.splice(groupKey, 1, newgroupObj);
        this.groupList = groupList;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates the member count of a group based on activities happening in the group
   */
  updateMemberChanged = (group, options) => {
    try {
      let groupList = [...this.groupList];

      //search for group
      let groupKey = groupList.findIndex((g, k) => g.guid === group.guid);

      if (groupKey > -1) {
        let groupObj = { ...groupList[groupKey] };
        if (options && this.loggedInUser.uid === options.user.uid) {
          let newgroupObj = Object.assign({}, groupObj, {
            scope: options.scope,
          });

          groupList.splice(groupKey, 1, newgroupObj);
          this.groupList = groupList;
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    try {
      let data = action.payLoad;

      switch (action.type) {
        case enums.CLOSE_CREATE_GROUP_VIEW: {
          this.toggleCreateGroupView();
          break;
        }
        case enums.GROUP_CREATED: {
          this.toggleCreateGroupView();
          this.createGroupActionHandler(data);
          break;
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles scroll action on GroupList and fetches more groups if user scrolls to bottom of group list
   * @param Event action
   */
  handleScroll(e) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);

      if (bottom) this.getGroups();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * toggles between opening and closing of groupCreationView / group creation form
   * @param
   */
  toggleCreateGroupView() {
    try {
      this.openCreateGroupView = !this.openCreateGroupView;
    } catch (error) {
      logger(error);
    }
  }
}
