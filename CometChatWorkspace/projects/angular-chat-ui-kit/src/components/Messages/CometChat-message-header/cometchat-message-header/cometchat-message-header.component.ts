import {
  Component,
  Input,
  OnInit,
  EventEmitter,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
import { DatePipe } from "@angular/common";

@Component({
  selector: "cometchat-message-header",
  templateUrl: "./cometchat-message-header.component.html",
  styleUrls: ["./cometchat-message-header.component.css"],
})
export class CometChatMessageHeaderComponent
  implements OnInit, OnChanges, OnDestroy {
  @Input() item = null;
  @Input() type = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  userListenerId = "head_user_" + new Date().getTime();
  msgListenerId = "head_message_" + new Date().getTime();
  groupListenerId = "head_group_" + new Date().getTime();
  status: string = "";
  isTyping: boolean = false;
  loggedInUser = null;

  //displays audio and video call options
  checkNotBlocked: boolean = true;

  constructor(public datepipe: DatePipe) {}

  ngOnChanges(change: SimpleChanges) {
    if (change["item"]) {
      //Check if user is blocked/unblocked
      this.checkBlocked();

      // if the person you are chatting with changes
      //Removing User Presence , typing and Group Listeners
      this.removeListeners();

      if (this.type == "group") {
        let prevProps = {
          item:
            change["item"].previousValue == null
              ? { guid: "" }
              : change["item"].previousValue,
        };
        let props = { item: change["item"].currentValue };

        if (
          prevProps.item.guid === props.item.guid &&
          prevProps.item.membersCount !== props.item.membersCount
        ) {
          this.updateHeader(enums.GROUP_MEMBER_ADDED, props.item);
        }

        if (prevProps.item.guid !== props.item.guid) {
          this.setGroupMemeberCountStatus(this.item.membersCount);
        }
      }

      //Attaching new listeners
      this.userListenerId = "head_user_" + new Date().getTime();
      this.msgListenerId = "head_message_" + new Date().getTime();
      this.groupListenerId = "head_group_" + new Date().getTime();
      this.attachListeners();
    }
  }

  ngOnInit() {
    this.attachListeners();

    this.getLoggedInUserInfo();

    if (this.type == "group") {
      this.setGroupMemeberCountStatus(this.item.membersCount);
    }
  }

  ngOnDestroy() {
    //Removing User Presence , typing and Group Listeners
    this.removeListeners();
  }

  /**
   * Gets Information of the currently logged in user
   * @param
   */
  getLoggedInUserInfo() {
    CometChat.getLoggedinUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch((error) => {
        console.log(
          "[CometChatGroupList] getUsers getLoggedInUser error",
          error
        );
      });
  }

  attachListeners() {
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          /* when someuser/friend comes online, user will be received here */

          this.updateHeader(enums.USER_ONLINE, onlineUser);
        },
        onUserOffline: (offlineUser) => {
          /* when someuser/friend went offline, user will be received here */

          this.updateHeader(enums.USER_OFFLINE, offlineUser);
        },
      })
    );

    CometChat.addMessageListener(
      this.msgListenerId,
      new CometChat.MessageListener({
        onTypingStarted: (typingIndicator) => {
          this.updateHeader(enums.TYPING_STARTED, typingIndicator);
        },
        onTypingEnded: (typingIndicator) => {
          this.updateHeader(enums.TYPING_ENDED, typingIndicator);
        },
      })
    );

    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
          this.updateHeader(enums.GROUP_MEMBER_KICKED, kickedFrom, kickedUser);
        },
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          this.updateHeader(enums.GROUP_MEMBER_BANNED, bannedFrom, bannedUser);
        },
        onMemberAddedToGroup: (
          message,
          userAdded,
          userAddedBy,
          userAddedIn
        ) => {
          this.updateHeader(enums.GROUP_MEMBER_ADDED, userAddedIn);
        },
        onGroupMemberLeft: (message, leavingUser, group) => {
          this.updateHeader(enums.GROUP_MEMBER_LEFT, group, leavingUser);
        },
        onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
          this.updateHeader(enums.GROUP_MEMBER_JOINED, joinedGroup);
        },
      })
    );
  }

  removeListeners() {
    CometChat.removeUserListener(this.userListenerId);
    CometChat.removeMessageListener(this.msgListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
  }

  /**
   * If user blocked then doesnot display audio and video call else displays
   */
  checkBlocked() {
    if (this.item.blockedByMe === true) {
      this.checkNotBlocked = false;
    } else {
      this.checkNotBlocked = true;
    }
  }

  updateHeader(key = null, item = null, groupUser = null) {
    switch (key) {
      case enums.USER_ONLINE:
      case enums.USER_OFFLINE: {
        if (this.type === "user" && this.item.uid === item.uid) {
          this.item = { ...item };
        }
        break;
      }
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        if (
          this.type === "group" &&
          this.item.guid === item.guid &&
          this.loggedInUser.uid !== groupUser.uid
        ) {
          let membersCount = parseInt(item.membersCount);
          this.item.membersCount = membersCount;
          this.setGroupMemeberCountStatus(membersCount);
        }
        break;
      case enums.GROUP_MEMBER_JOINED:
        if (this.type === "group" && this.item.guid === item.guid) {
          let membersCount = parseInt(item.membersCount);
          this.item.membersCount = membersCount;
          this.setGroupMemeberCountStatus(membersCount);
        }
        break;
      case enums.GROUP_MEMBER_ADDED:
        if (this.type === "group" && this.item.guid === item.guid) {
          let membersCount = parseInt(item.membersCount);
          this.item.membersCount = membersCount;
          this.setGroupMemeberCountStatus(membersCount);
        }
        break;
      case enums.TYPING_STARTED: {
        if (
          this.type === "group" &&
          this.type === item.receiverType &&
          this.item.guid === item.receiverId
        ) {
          this.status = item.sender.name + STRING_MESSAGES.IS_TYPING;
          this.actionGenerated.emit({
            type: enums.SHOW_REACTION,
            payLoad: item,
          });
        } else if (
          this.type === "user" &&
          this.type === item.receiverType &&
          this.item.uid === item.sender.uid
        ) {
          this.isTyping = true;
          this.status = STRING_MESSAGES.TYPING;
          this.actionGenerated.emit({
            type: enums.SHOW_REACTION,
            payLoad: item,
          });
        }
        break;
      }
      case enums.TYPING_ENDED: {
        if (
          this.type === "group" &&
          this.type === item.receiverType &&
          this.item.guid === item.receiverId
        ) {
          this.setGroupMemeberCountStatus(this.item.membersCount);

          // this.setStatusForGroup();
          this.actionGenerated.emit({
            type: enums.STOP_REACTION,
            payLoad: item,
          });
        } else if (
          this.type === "user" &&
          this.type === item.receiverType &&
          this.item.uid === item.sender.uid
        ) {
          if (this.item.status === "online") {
            this.status = null;
            this.isTyping = false;
          } else {
            this.getDate(item.lastActiveAt);
          }
          this.actionGenerated.emit({
            type: enums.STOP_REACTION,
            payLoad: item,
          });
        }
        break;
      }
    }
  }

  /**
   * Sets status of the group according to its member count
   * @param number membersCount
   */
  setGroupMemeberCountStatus(membersCount) {
    if (membersCount > 1) {
      this.status = membersCount + " members";
    } else {
      this.status = membersCount + " member";
    }
  }

  /**
   * Get Last Active Date
   * @param
   */
  getDate(date) {
    let lastActiveDate = "Last Active At: ";

    if (date === undefined) {
      lastActiveDate = "Offline";
      return lastActiveDate;
    }
    date = date * 1000;
    lastActiveDate =
      lastActiveDate + this.datepipe.transform(date, "dd MMMM yyyy, h:mm a");

    return lastActiveDate;
  }

  /**
   * Emits an action to indicate the parent component to open the user ( you are chatting with ) Detail component
   * @param
   */
  openUserDetail() {
    this.actionGenerated.emit({ type: enums.VIEW_DETAIL, payLoad: null });
  }

  /**
   * Starts audio call
   */
  audioCall() {
    this.actionGenerated.emit({ type: enums.AUDIO_CALL });
  }

  /**
   * Starts video call
   */
  videoCall() {
    this.actionGenerated.emit({ type: enums.VIDEO_CALL });
  }
  closeChatWindow() {
    this.actionGenerated.emit({ type: enums.MENU_CLICKED });
  }
}
