import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-add-group-member-list",
  templateUrl: "./cometchat-add-group-member-list.component.html",
  styleUrls: ["./cometchat-add-group-member-list.component.css"],
})
export class CometChatAddGroupMemberListComponent implements OnInit, OnDestroy {
  @Input() item: any = null;
  @Input() type: string = '';
  @Input() memberList: any  = [];
  @Input() bannedMemberList = [];
  @Input() friendsOnly: boolean = false;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  decoratorMessage = COMETCHAT_CONSTANTS.LOADING_MESSSAGE;
  userlist: any = [];
  membersToAdd: any = [];
  membersToRemove = [];
  filteredList: any = [];
  timeout: any;
  addBtnText: String = COMETCHAT_CONSTANTS.ADD;

  membersRequest: any = null;
  userListenerId = enums.USER_LIST_ + new Date().getTime();

  USERS: String = COMETCHAT_CONSTANTS.USERS;
  SEARCH: String = COMETCHAT_CONSTANTS.SEARCH;

  constructor() {}

  ngOnInit() {
    try {
      this.membersRequest = this.createMemberRequest();
      this.getUsers();
      this.attachListeners(this.userUpdated);
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
   * Attaches the user listeners
   * @param function callback
   */
  attachListeners(callback: any) {
    try {
      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: any) => {
            /* when someuser/friend comes online, user will be received here */
            callback(onlineUser);
          },
          onUserOffline: (offlineUser: any) => {
            /* when someuser/friend went offline, user will be received here */
            callback(offlineUser);
          },
        })
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Removes all the attached listeners
   * @param
   */
  removeListeners() {
    try {
      CometChat.removeUserListener(this.userListenerId);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates user , based on user activity detected through listeners
   * @param Any user
   */
  userUpdated = (user: any) => {
    try {
      let userlist = [...this.userlist];

      //search for user
      let userKey = userlist.findIndex((u, k) => u.uid === user.uid);

      //if found in the list, update user object
      if (userKey > -1) {
        let userObj = userlist[userKey];
        let newUserObj = Object.assign({}, userObj, user);
        userlist.splice(userKey, 1, newUserObj);

        this.userlist = userlist;
      }
    } catch (error) {
      logger(error);
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
  searchUsers = (e: any) => {
    try {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      let val = e.target.value;
      this.timeout = setTimeout(() => {
        this.decoratorMessage = COMETCHAT_CONSTANTS.LOADING_MESSSAGE;

        this.membersRequest = this.createMemberRequest(val);

        this.userlist = [];
        this.membersToAdd = [];
        this.membersToRemove = [];
        this.filteredList = [];
        this.getUsers();
      }, 500);
    } catch (error) {
      logger(error);
    }
  };

  /**
   * fetches a list of users based on the member request config
   * @param
   */
  getUsers = () => {
    try {
      CometChat.getLoggedinUser()
        .then((user) => {
          this.fetchNextUsers()
            .then((userList: any) => {
              const filteredUserList = userList.filter((user: any) => {
                const found = this.memberList.find(
                  (member: any) => user.uid === member.uid
                );
                const foundBanned = this.bannedMemberList.find(
                  (member: any) => user.uid === member.uid
                );
                if (found || foundBanned) {
                  return false;
                }
                return true;
              });

              this.userlist = [...this.userlist, ...userList];

              this.filteredList = [...this.filteredList, ...filteredUserList];

              if (this.filteredList.length === 0) {
                this.decoratorMessage = COMETCHAT_CONSTANTS.NO_USERS_FOUND;
              } else {
                this.decoratorMessage = "";
              }
            })
            .catch((error: any) => {
              this.decoratorMessage = COMETCHAT_CONSTANTS.ERROR;
              logger("[CometChatAddMembers] getUsers fetchNext error", error);
            });
        })
        .catch((error) => {
          this.decoratorMessage = COMETCHAT_CONSTANTS.ERROR;
          logger("[CometChatAddMembers] getUsers getLoggedInUser error", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handles all the events emitted by child components
   * @param Event action
   */
  actionHandler(action: any) {
    try {
      let data = action.payLoad;

      switch (action.type) {
        case enums.MEMBER_UPDATED: {
          this.membersUpdated(data.user, data.userState);
          break;
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates the memberToAdd list
   * @param Any user
   */
  membersUpdated = (user: any, userState: any) => {
    try {
      if (userState) {
        const members: any = [...this.membersToAdd];
        members.push(user);
        this.membersToAdd = [...members];
      } else {
        const membersToAdd = [...this.membersToAdd];
        const IndexFound = membersToAdd.findIndex(
          (member: any) => member.uid === user.uid
        );
        if (IndexFound > -1) {
          membersToAdd.splice(IndexFound, 1);
          this.membersToAdd = [...membersToAdd];
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * adds all the members of the memberToAdd list to the group
   * @param
   */
  updateMembers = () => {
    try {
      if (this.addBtnText == COMETCHAT_CONSTANTS.ADDING_MESSSAGE) {
        return;
      }

      this.addBtnText = COMETCHAT_CONSTANTS.ADDING_MESSSAGE;

      const guid = this.item.guid;
      const membersList: CometChat.GroupMember[] = [];

      this.membersToAdd.forEach((newmember: any) => {
        //if a selected member is already part of the member list, don't add
        const IndexFound = this.memberList.findIndex(
          (member: any) => member.uid === newmember.uid
        );
        if (IndexFound === -1) {
          const newMember = new CometChat.GroupMember(
            newmember.uid,
            CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
          );
          membersList.push(newMember);

          newmember[enums.TYPE] = enums.ADD;
        }
      });

      if (membersList.length) {
        const membersToAdd: any = [];
        CometChat.addMembersToGroup(guid, membersList, [])
          .then((response: any) => {
            if (Object.keys(response).length) {
              for (const member in response) {
                if (response[member] === enums.SUCCESS) {
                  const found = this.userlist.find(
                    (user: any) => user.uid === member
                  );
                  found[enums.SCOPE] = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
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
            logger("addMembersToGroup failed with exception:", error);
          })
          .finally(() => {
            this.addBtnText = COMETCHAT_CONSTANTS.ADD;
          });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * fetches a nexts set of list  of users based on the member request config
   * @param
   */
  fetchNextUsers() {
    try {
      return this.membersRequest.fetchNext();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles scroll action on addMemberList and fetches more members that can be added to group ,  if user scrolls to bottom of memberList
   * @param Event action
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);
      if (bottom) this.getUsers();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * emits an action to close the addMember modal
   */
  closeAddMembersView() {
    try {
      this.actionGenerated.emit({
        type: enums.CLOSE_ADD_VIEW_MEMBER,
        payLoad: null,
      });
    } catch (error) {
      logger(error);
    }
  }
}
