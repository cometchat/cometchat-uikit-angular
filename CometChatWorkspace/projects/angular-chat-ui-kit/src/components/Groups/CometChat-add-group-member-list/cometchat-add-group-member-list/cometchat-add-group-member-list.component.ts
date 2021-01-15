import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-add-group-member-list",
  templateUrl: "./cometchat-add-group-member-list.component.html",
  styleUrls: ["./cometchat-add-group-member-list.component.css"],
})
export class CometChatAddGroupMemberListComponent implements OnInit, OnDestroy {
  @Input() item = null;
  @Input() type = null;
  @Input() memberlist = [];
  @Input() bannedmemberlist = [];
  @Input() friendsOnly: boolean = false;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  decoratorMessage = STRING_MESSAGES.LOADING_MESSSAGE;
  userlist = [];
  membersToAdd = [];
  membersToRemove = [];
  filteredlist = [];
  timeout;
  addBtnText: String = STRING_MESSAGES.ADD;

  membersRequest = null;
  userListenerId = "userlist_" + new Date().getTime();

  USERS: String = STRING_MESSAGES.USERS;
  SEARCH: String = STRING_MESSAGES.SEARCH;

  constructor() {}

  ngOnInit() {
    this.membersRequest = this.createMemberRequest();
    this.getUsers();
    this.attachListeners(this.userUpdated);
  }

  ngOnDestroy() {
    this.removeListeners();
  }

  /**
   * Attaches the user listeners
   * @param function callback
   */
  attachListeners(callback) {
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          /* when someuser/friend comes online, user will be received here */
          callback(onlineUser);
        },
        onUserOffline: (offlineUser) => {
          /* when someuser/friend went offline, user will be received here */
          callback(offlineUser);
        },
      })
    );
  }

  /**
   * Removes all the attached listeners
   * @param
   */
  removeListeners() {
    CometChat.removeUserListener(this.userListenerId);
  }

  /**
   * Updates user , based on user activity detected through listeners
   * @param Any user
   */
  userUpdated = (user) => {
    let userlist = [...this.userlist];

    //search for user
    let userKey = userlist.findIndex((u, k) => u.uid === user.uid);

    //if found in the list, update user object
    if (userKey > -1) {
      let userObj = userlist[userKey]; //{...userlist[userKey]};
      let newUserObj = Object.assign({}, userObj, user);
      userlist.splice(userKey, 1, newUserObj);

      this.userlist = userlist;
    }
  };

  /**
   * Builds a request for fetching a list of users matching the serach key
   * @param String searchKey
   */
  createMemberRequest(searchKey = "") {
    let membersRequest = null;

    if (searchKey !== "") {
      membersRequest = new CometChat.UsersRequestBuilder()
        .setLimit(30)
        .friendsOnly(this.friendsOnly)
        .setSearchKeyword(searchKey)
        .build();
    } else {
      membersRequest = new CometChat.UsersRequestBuilder()
        .setLimit(30)
        .friendsOnly(this.friendsOnly)
        .build();
    }
    return membersRequest;
  }

  /**
   * Searches for a list of users matching the search key
   * @param Event e
   */
  searchUsers = (e) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    let val = e.target.value;
    this.timeout = setTimeout(() => {
      this.decoratorMessage = STRING_MESSAGES.LOADING_MESSSAGE;

      this.membersRequest = this.createMemberRequest(val);

      this.userlist = [];
      this.membersToAdd = [];
      this.membersToRemove = [];
      this.filteredlist = [];
      this.getUsers();
    }, 500);
  };

  /**
   * fetches a list of users based on the member request config
   * @param
   */
  getUsers = () => {
    CometChat.getLoggedinUser()
      .then((user) => {
        this.fetchNextUsers()
          .then((userList) => {
            const filteredUserList = userList.filter((user) => {
              const found = this.memberlist.find(
                (member) => user.uid === member.uid
              );
              const foundbanned = this.bannedmemberlist.find(
                (member) => user.uid === member.uid
              );
              if (found || foundbanned) {
                return false;
              }
              return true;
            });

            this.userlist = [...this.userlist, ...userList];

            this.filteredlist = [...this.filteredlist, ...filteredUserList];

            if (this.filteredlist.length === 0) {
              this.decoratorMessage = STRING_MESSAGES.NO_USERS_FOUND;
            } else {
              this.decoratorMessage = "";
            }
          })
          .catch((error) => {
            this.decoratorMessage = STRING_MESSAGES.ERROR;
            console.error(
              "[CometChatAddMembers] getUsers fetchNext error",
              error
            );
          });
      })
      .catch((error) => {
        this.decoratorMessage = STRING_MESSAGES.ERROR;
        console.log(
          "[CometChatAddMembers] getUsers getLoggedInUser error",
          error
        );
      });
  };

  /**
   * Handles all the events emitted by child components
   * @param Event action
   */
  actionHandler(action) {
    let data = action.payLoad;

    // console.log("comet chat add members --> action generated is ", action);

    switch (action.type) {
      case enums.MEMBER_UPDATED: {
        this.membersUpdated(data.user, data.userState);
        break;
      }
    }
  }

  /**
   * Updates the memberToAdd list
   * @param Any user
   */
  membersUpdated = (user, userState) => {
    if (userState) {
      const members = [...this.membersToAdd];
      members.push(user);
      this.membersToAdd = [...members];
    } else {
      const membersToAdd = [...this.membersToAdd];
      const IndexFound = membersToAdd.findIndex(
        (member) => member.uid === user.uid
      );
      if (IndexFound > -1) {
        membersToAdd.splice(IndexFound, 1);
        this.membersToAdd = [...membersToAdd];
      }
    }
  };

  /**
   * adds all the members of the memberToAdd list to the group
   * @param
   */
  updateMembers = () => {
    if (this.addBtnText == STRING_MESSAGES.ADDING_MESSSAGE) {
      return;
    }

    this.addBtnText = STRING_MESSAGES.ADDING_MESSSAGE;

    const guid = this.item.guid;
    const membersList = [];

    this.membersToAdd.forEach((newmember) => {
      //if a selected member is already part of the member list, don't add
      const IndexFound = this.memberlist.findIndex(
        (member) => member.uid === newmember.uid
      );
      if (IndexFound === -1) {
        const newMember = new CometChat.GroupMember(
          newmember.uid,
          CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
        );
        membersList.push(newMember);

        newmember["type"] = "add";
      }
    });

    if (membersList.length) {
      const membersToAdd = [];
      CometChat.addMembersToGroup(guid, membersList, [])
        .then((response) => {
          if (Object.keys(response).length) {
            for (const member in response) {
              if (response[member] === "success") {
                const found = this.userlist.find((user) => user.uid === member);
                found["scope"] = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
                membersToAdd.push(found);
              }
            }
            this.actionGenerated.emit({
              type: enums.ADD_GROUP_PARTICIPANTS,
              payLoad: membersToAdd,
            });
          }
          this.closeAddMembersView();
        })
        .catch((error) => {
          console.log("addMembersToGroup failed with exception:", error);
        })
        .finally(() => {
          this.addBtnText = STRING_MESSAGES.ADD;
        });
    }
  };

  /**
   * fetches a nexts set of list  of users based on the member request config
   * @param
   */
  fetchNextUsers() {
    return this.membersRequest.fetchNext();
  }

  /**
   * Handles scroll action on addMemberList and fetches more members that can be added to group ,  if user scrolls to bottom of memberList
   * @param Event action
   */
  handleScroll(e) {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
      Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getUsers();
  }

  closeAddMembersView() {
    this.actionGenerated.emit({
      type: enums.CLOSE_ADD_VIEW_MEMBER,
      payLoad: null,
    });
  }
}
