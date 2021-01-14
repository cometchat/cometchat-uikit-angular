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
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

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
  grouplist = [];
  groupRequest = null;
  groupListenerId = "grouplist_" + new Date().getTime();

  openCreateGroupView: boolean = false;
  GROUPS: String = STRING_MESSAGES.GROUPS;
  SEARCH: String = STRING_MESSAGES.SEARCH;

  @Output() onGroupClick: EventEmitter<any> = new EventEmitter();

  constructor(private ref: ChangeDetectorRef) {
    setInterval(() => {
      if (!this.ref["destroyed"]) {
        this.ref.detectChanges();
      }
    }, 5000);
  }

  ngOnChanges(change: SimpleChanges) {
    if (change["groupToUpdate"]) {
      let prevProps = { groupToUpdate: null };
      let props = { groupToUpdate: null };

      prevProps["groupToUpdate"] = change["groupToUpdate"].previousValue;
      props["groupToUpdate"] = change["groupToUpdate"].currentValue;

      if (
        prevProps.groupToUpdate &&
        (prevProps.groupToUpdate.guid !== props.groupToUpdate.guid ||
          (prevProps.groupToUpdate.guid === props.groupToUpdate.guid &&
            (prevProps.groupToUpdate.membersCount !==
              props.groupToUpdate.membersCount ||
              prevProps.groupToUpdate.scope !== props.groupToUpdate.scope)))
      ) {
        const groups = [...this.grouplist];
        const groupToUpdate = this.groupToUpdate;

        const groupKey = groups.findIndex(
          (group) => group.guid === groupToUpdate.guid
        );
        if (groupKey > -1) {
          const groupObj = groups[groupKey];
          const newGroupObj = Object.assign({}, groupObj, groupToUpdate, {
            scope: groupToUpdate["scope"],
            membersCount: groupToUpdate["membersCount"],
          });

          groups.splice(groupKey, 1, newGroupObj);

          this.grouplist = groups;
        }
      }
    }

    if (change["groupToLeave"]) {
      let prevProps = { groupToLeave: null };
      let props = { groupToLeave: null };

      prevProps["groupToLeave"] = change["groupToLeave"].previousValue;
      props["groupToLeave"] = change["groupToLeave"].currentValue;

      if (
        prevProps.groupToLeave &&
        prevProps.groupToLeave.guid !== props.groupToLeave.guid
      ) {
        const groups = [...this.grouplist];
        const groupKey = groups.findIndex(
          (member) => member.guid === props.groupToLeave.guid
        );

        if (groupKey > -1) {
          const groupToLeave = props.groupToLeave;
          const groupObj = { ...groups[groupKey] };
          const membersCount = parseInt(groupToLeave["membersCount"]) - 1;

          let newgroupObj = Object.assign({}, groupObj, {
            membersCount: membersCount,
            hasJoined: false,
          });

          groups.splice(groupKey, 1, newgroupObj);

          this.grouplist = groups;
        }
      }
    }

    if (change["groupToDelete"]) {
      let prevProps = { groupToDelete: null };
      let props = { groupToDelete: null };

      prevProps["groupToDelete"] = change["groupToDelete"].previousValue;
      props["groupToDelete"] = change["groupToDelete"].currentValue;

      if (
        prevProps.groupToDelete &&
        prevProps.groupToDelete.guid !== props.groupToDelete.guid
      ) {
        const groups = [...this.grouplist];
        const groupKey = groups.findIndex(
          (member) => member.guid === props.groupToDelete.guid
        );
        if (groupKey > -1) {
          groups.splice(groupKey, 1);

          this.grouplist = groups;

          if (groups.length === 0) {
            this.decoratorMessage = STRING_MESSAGES.NO_GROUPS_FOUND;
          }
        }
      }
    }
  }

  ngOnInit() {
    this.groupRequest = this.groupListRequestBuilder(this.searchKey);
    this.getGroups();
    this.attachListeners(this.groupUpdated);
  }

  ngOnDestroy() {
    //Removing Group Listeners
    CometChat.removeGroupListener(this.groupListenerId);
  }

  /**
   * Listener for group activities happening in real time
   * @param function callback
   */

  attachListeners(callback) {
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
  }

  /**
   * Builds a request for fetching a list of group matching the serach key
   * @param String searchKey
   */
  groupListRequestBuilder(searchKey = "") {
    let groupRequest = null;

    if (searchKey !== "") {
      groupRequest = new CometChat.GroupsRequestBuilder()
        .setLimit(30)
        .setSearchKeyword(searchKey)
        .build();
    } else {
      groupRequest = new CometChat.GroupsRequestBuilder().setLimit(30).build();
    }
    return groupRequest;
  }

  /**
   * If a group Doesnt have an icon , it will generate one for it , using first Letter of the Group Name
   * @param Any group
   */
  setAvatar(group) {
    if (group.hasOwnProperty("icon") === false) {
      const guid = group.guid;
      const char = group.name.charAt(0).toUpperCase();
    }
    return group;
  }

  getGroups = () => {
    this.decoratorMessage = STRING_MESSAGES.LOADING_MESSSAGE;

    CometChat.getLoggedinUser()
      .then((user) => {
        this.loggedInUser = user;
        this.fetchNextGroups()
          .then((groupList) => {
            if (groupList.length === 0) {
              this.decoratorMessage = STRING_MESSAGES.NO_GROUPS_FOUND;
            }

            groupList.forEach((group) => (group = this.setAvatar(group)));
            this.grouplist = [...this.grouplist, ...groupList];

            this.decoratorMessage = "";

            if (this.grouplist.length === 0) {
              this.decoratorMessage = STRING_MESSAGES.NO_GROUPS_FOUND;
            }
          })
          .catch((error) => {
            this.decoratorMessage = STRING_MESSAGES.ERROR;
            console.error(
              "[CometChatGroupList] getGroups fetchNextGroups error",
              error
            );
          });
      })
      .catch((error) => {
        this.decoratorMessage = STRING_MESSAGES.ERROR;
        console.log(
          "[CometChatGroupList] getUsers getLoggedInUser error",
          error
        );
      });
  };

  /**
   * Fetches list of groups according to the group request config
   * @param Event action
   */
  fetchNextGroups() {
    return this.groupRequest.fetchNext();
  }

  /**
   * Fetches list of groups according to the group request config
   * @param Event action
   */
  createGroupActionHandler = (group) => {
    this.setAvatar(group);
    const groupList = [group, ...this.grouplist];

    // this.handleClick(group);
    this.grouplist = [group, ...this.grouplist];
  };

  /**
   * Emitting the Group clicked so that it can be used in the parent component
   * @param Any group
   */
  groupClicked(group) {
    if (group.hasJoined === false) {
      let password = "";
      if (group.type === CometChat.GROUP_TYPE.PASSWORD) {
        password = prompt("Enter your password");
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
  }

  /**
   * Helps the current user to join a password protected group , if the password entered by the user is correct
   * @param Event event
   */
  joinGroup(guid: any, groupType: any, password: string) {
    CometChat.joinGroup(guid, groupType, password)
      .then((response) => {
        console.log("Group joining success with response", response);

        const groups = [...this.grouplist];

        let groupKey = groups.findIndex((g, k) => g.guid === guid);
        if (groupKey > -1) {
          const groupObj = groups[groupKey];
          const newGroupObj = Object.assign({}, groupObj, response, {
            scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
          });

          groups.splice(groupKey, 1, newGroupObj);

          this.grouplist = groups;
          if (this.enableSelectedGroupStyling) {
            this.selectedGroup = newGroupObj;
          }

          this.onGroupClick.emit(newGroupObj);
        }
      })
      .catch((error) => {
        console.log("Group joining failed with exception:", error);
      });
  }

  /**
   * Searches for a list of groups matching the search key
   * @param Event event
   */
  searchGroup(event) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    let val = event.target.value;
    this.timeout = setTimeout(() => {
      this.groupRequest = this.groupListRequestBuilder(val);

      this.grouplist = [];
      this.getGroups();
    }, 1000);
  }

  groupUpdated = (key, message, group, options) => {
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
  };

  updateMemberRemoved = (group, options) => {
    let grouplist = [...this.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {
      if (options && this.loggedInUser.uid === options.user.uid) {
        let groupObj = { ...grouplist[groupKey] };

        let newgroupObj = Object.assign({}, groupObj, group);

        grouplist.splice(groupKey, 1, newgroupObj);

        this.grouplist = grouplist;
      } else {
        let groupObj = { ...grouplist[groupKey] };
        let membersCount = parseInt(group.membersCount);

        let newgroupObj = Object.assign({}, groupObj, {
          membersCount: membersCount,
        });

        grouplist.splice(groupKey, 1, newgroupObj);
        this.grouplist = grouplist;
      }
    }
  };

  updateMemberAdded = (group, options) => {
    let grouplist = [...this.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {
      let groupObj = { ...grouplist[groupKey] };

      let membersCount = parseInt(group.membersCount);

      let scope = group.hasOwnProperty("scope") ? group.scope : "";
      let hasJoined = group.hasOwnProperty("hasJoined")
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

      grouplist.splice(groupKey, 1, newgroupObj);
      this.grouplist = grouplist;
    } else {
      let groupObj = { ...group };

      let scope = groupObj.hasOwnProperty("scope") ? groupObj.scope : {};
      let hasJoined = groupObj.hasOwnProperty("hasJoined")
        ? groupObj.hasJoined
        : false;
      let membersCount = parseInt(groupObj.membersCount);
      this.setAvatar(groupObj);
      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        hasJoined = true;
      }

      let newgroupObj = Object.assign({}, groupObj, {
        membersCount: membersCount,
        scope: scope,
        hasJoined: hasJoined,
      });

      const groupList = [newgroupObj, ...this.grouplist];
      this.grouplist = grouplist;
    }
  };

  updateMemberJoined = (group, options) => {
    let grouplist = [...this.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {
      let groupObj = { ...grouplist[groupKey] };

      let scope = groupObj.scope;
      let membersCount = parseInt(group.membersCount);

      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
      }

      let newgroupObj = Object.assign({}, groupObj, {
        membersCount: membersCount,
        scope: scope,
      });

      grouplist.splice(groupKey, 1, newgroupObj);
      this.grouplist = grouplist;
    }
  };

  updateMemberChanged = (group, options) => {
    let grouplist = [...this.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {
      let groupObj = { ...grouplist[groupKey] };
      if (options && this.loggedInUser.uid === options.user.uid) {
        let newgroupObj = Object.assign({}, groupObj, { scope: options.scope });

        grouplist.splice(groupKey, 1, newgroupObj);
        this.grouplist = grouplist;
      }
    }
  };

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    let data = action.payLoad;

    // console.log("Comet Chat Group List --> action generation is ", action);

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
  }

  /**
   * Handles scroll action on GroupList and fetches more groups if user scrolls to bottom of group list
   * @param Event action
   */
  handleScroll(e) {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
      Math.round(e.currentTarget.clientHeight);

    if (bottom) this.getGroups();
  }

  /**
   * toggles between opening and closing of groupCreationView / group creation form
   * @param
   */
  toggleCreateGroupView() {
    this.openCreateGroupView = !this.openCreateGroupView;
  }
}
