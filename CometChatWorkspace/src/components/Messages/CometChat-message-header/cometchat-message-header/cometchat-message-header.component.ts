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
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { DatePipe } from "@angular/common";
import { logger } from "../../../../utils/common";
import { CometChatService } from "src/cometchat-pro-angular-ui-kit/CometChatWorkspace/src/utils/cometchat.service";
@Component({
  selector: "cometchat-message-header",
  templateUrl: "./cometchat-message-header.component.html",
  styleUrls: ["./cometchat-message-header.component.css"],
})
export class CometChatMessageHeaderComponent
  implements OnInit, OnChanges, OnDestroy {
  @Input() item: any = null;
  @Input() type: string = '';

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  userListenerId = enums.HEAD_USER_ + new Date().getTime();
  msgListenerId = enums.HEAD_MESSAGE_ + new Date().getTime();
  groupListenerId = enums.HEAD_GROUP_ + new Date().getTime();
  status: string = "";
  isTyping: boolean = false;
  loggedInUser: any = null;
  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;
  USER: String = CometChat.RECEIVER_TYPE.USER;
  ONLINE: String = CometChat.USER_STATUS.ONLINE;
  OFFLINE: String = CometChat.USER_STATUS.OFFLINE;
  isDirectCall = null

  //displays audio and video call options
  checkNotBlocked: boolean = true;

  constructor(public datepipe: DatePipe,private CometChatService: CometChatService) {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.ITEM]) {
        //Check if user is blocked/unblocked
        this.checkBlocked();

        // if the person you are chatting with changes
        //Removing User Presence , typing and Group Listeners
        this.removeListeners();

        if (this.type == CometChat.RECEIVER_TYPE.GROUP) {
          let prevProps = {
            item:
              change[enums.ITEM].previousValue == null
                ? { guid: "" }
                : change[enums.ITEM].previousValue,
          };
          let props = { item: change[enums.ITEM].currentValue };

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
        this.userListenerId = enums.HEAD_USER_ + new Date().getTime();
        this.msgListenerId = enums.HEAD_MESSAGE_ + new Date().getTime();
        this.groupListenerId = enums.HEAD_GROUP_ + new Date().getTime();
        this.attachListeners();
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.attachListeners();

      this.getLoggedInUserInfo();

      if (this.type == CometChat.RECEIVER_TYPE.GROUP) {
        this.setGroupMemeberCountStatus(this.item.membersCount);
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnDestroy() {
    try {
      //Removing User Presence , typing and Group Listeners
      this.removeListeners();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Gets Information of the currently logged in user
   * @param
   */
  getLoggedInUserInfo() {
    try {
      CometChat.getLoggedinUser()
        .then((user: any) => {
          this.loggedInUser = user;
        })
        .catch((error) => {
          logger("[CometChatGroupList] getUsers getLoggedInUser error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * attaches Listeners for user activity , group activities and calling
   * @param callback
   */
  attachListeners() {
    try {
      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: any) => {
            /* when someuser/friend comes online, user will be received here */

            this.updateHeader(enums.USER_ONLINE, onlineUser);
          },
          onUserOffline: (offlineUser: any) => {
            /* when someuser/friend went offline, user will be received here */

            this.updateHeader(enums.USER_OFFLINE, offlineUser);
          },
        })
      );

      CometChat.addMessageListener(
        this.msgListenerId,
        new CometChat.MessageListener({
          onTypingStarted: (typingIndicator: any) => {
            this.updateHeader(enums.TYPING_STARTED, typingIndicator);
          },
          onTypingEnded: (typingIndicator: any) => {
            this.updateHeader(enums.TYPING_ENDED, typingIndicator);
          },
        })
      );

      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberKicked: (message: any, kickedUser: any, kickedBy: any, kickedFrom: any) => {
            this.updateHeader(
              enums.GROUP_MEMBER_KICKED,
              kickedFrom,
              kickedUser
            );
          },
          onGroupMemberBanned: (message: any, bannedUser: any, bannedBy: any, bannedFrom: any) => {
            this.updateHeader(
              enums.GROUP_MEMBER_BANNED,
              bannedFrom,
              bannedUser
            );
          },
          onMemberAddedToGroup: (
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any
          ) => {
            this.updateHeader(enums.GROUP_MEMBER_ADDED, userAddedIn);
          },
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
            this.updateHeader(enums.GROUP_MEMBER_LEFT, group, leavingUser);
          },
          onGroupMemberJoined: (message: any, joinedUser: any, joinedGroup: any) => {
            this.updateHeader(enums.GROUP_MEMBER_JOINED, joinedGroup);
          },
        })
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Removes all listeners
   */
  removeListeners() {
    try {
      CometChat.removeUserListener(this.userListenerId);
      CometChat.removeMessageListener(this.msgListenerId);
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * If user blocked then doesnot display audio and video call else displays
   */
  checkBlocked() {
    try {
      if (this.item.blockedByMe === true) {
        this.checkNotBlocked = false;
      } else {
        this.checkNotBlocked = true;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates header such as typing indicator, count of group members, user status
   * @param
   */
  updateHeader(key: any = null, item: any = null, groupUser: any = null) {
    try {
      switch (key) {
        case enums.USER_ONLINE:
        case enums.USER_OFFLINE: {
          if (
            this.type === CometChat.RECEIVER_TYPE.USER &&
            this.item.uid === item.uid
          ) {
            this.item = { ...item };
          }
          break;
        }
        case enums.GROUP_MEMBER_KICKED:
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_LEFT:
          if (
            this.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.item.guid === item.guid &&
            this.loggedInUser.uid !== groupUser.uid
          ) {
            let membersCount = parseInt(item.membersCount);
            this.item.membersCount = membersCount;
            this.setGroupMemeberCountStatus(membersCount);
          }
          break;
        case enums.GROUP_MEMBER_JOINED:
          if (
            this.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.item.guid === item.guid
          ) {
            let membersCount = parseInt(item.membersCount);
            this.item.membersCount = membersCount;
            this.setGroupMemeberCountStatus(membersCount);
          }
          break;
        case enums.GROUP_MEMBER_ADDED:
          if (
            this.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.item.guid === item.guid
          ) {
            let membersCount = parseInt(item.membersCount);
            this.item.membersCount = membersCount;
            this.setGroupMemeberCountStatus(membersCount);
          }
          break;
        case enums.TYPING_STARTED: {
          if (
            this.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.type === item.receiverType &&
            this.item.guid === item.receiverId
          ) {
            this.status = item.sender.name + " " + COMETCHAT_CONSTANTS.IS_TYPING;
            this.actionGenerated.emit({
              type: enums.SHOW_REACTION,
              payLoad: item,
            });
          } else if (
            this.type === CometChat.RECEIVER_TYPE.USER &&
            this.type === item.receiverType &&
            this.item.uid === item.sender.uid
          ) {
            this.isTyping = true;
            this.item.status = CometChat.USER_STATUS.ONLINE;
            this.status = COMETCHAT_CONSTANTS.TYPING;
            this.actionGenerated.emit({
              type: enums.SHOW_REACTION,
              payLoad: item,
            });
          }
          break;
        }
        case enums.TYPING_ENDED: {
          if (
            this.type === CometChat.RECEIVER_TYPE.GROUP &&
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
            this.type === CometChat.RECEIVER_TYPE.USER &&
            this.type === item.receiverType &&
            this.item.uid === item.sender.uid
          ) {
            if (this.item.status === CometChat.USER_STATUS.ONLINE) {
              this.status = '';
              this.isTyping = false;
            } else {
              this.getLastActiveDate(item.lastActiveAt);
            }
            this.actionGenerated.emit({
              type: enums.STOP_REACTION,
              payLoad: item,
            });
          }
          break;
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets status of the group according to its member count
   * @param number membersCount
   */
  setGroupMemeberCountStatus(membersCount: number) {
    try {
      if (membersCount > 1) {
        this.status = membersCount + " members";
      } else {
        this.status = membersCount + " member";
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Get Last Active Date
   * @param
   */
  getLastActiveDate(date: any) {
      let lastActiveDate = COMETCHAT_CONSTANTS.LAST_ACTIVE_AT;

      if (date === undefined) {
        lastActiveDate = CometChat.USER_STATUS.OFFLINE;
        return lastActiveDate;
      }

      if(this.item.conversationId) {
        date = date * 1000;
        lastActiveDate =
          lastActiveDate + this.datepipe.transform(date, "dd MMMM y, h:mm a");
      } else {
        lastActiveDate =
          lastActiveDate + this.datepipe.transform(date, "dd MMMM y, h:mm a");
      }

      return lastActiveDate;
  }

  /**
   * Emits an action to indicate the parent component to open the user ( you are chatting with ) Detail component
   * @param
   */
  openUserDetail() {
    try {
      this.actionGenerated.emit({ type: enums.VIEW_DETAIL, payLoad: null });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Starts audio call
   */
  audioCall() {
 
    try {
      this.actionGenerated.emit({ type: enums.AUDIO_CALL });
    } catch (error) {
      logger(error);
    }
  }
  directVideoCall() {
    try {
      this.actionGenerated.emit({ type: enums.DIRECT_CALL });
    } catch (error) {
      logger(error);
    }
  
  }

  /**
   * Starts video call
   */
  videoCall() {
  
    try {
      this.actionGenerated.emit({ type: enums.VIDEO_CALL });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Closes Chat Window
   */
  closeChatWindow() {
    try {
      this.actionGenerated.emit({ type: enums.MENU_CLICKED });
    } catch (error) {
      logger(error);
    }
  }
}
