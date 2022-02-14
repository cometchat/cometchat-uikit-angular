import { Component, OnInit, HostListener } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { CometChatManager } from "../../../../utils/controller";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-group-list-with-messages",
  templateUrl: "./cometchat-group-list-with-messages.component.html",
  styleUrls: ["./cometchat-group-list-with-messages.component.css"],
  animations: [
    trigger("FadeInFadeOut", [
      state(
        "normal",
        style({
          left: "0%",
        })
      ),
      state(
        "animated",
        style({
          left: "-100%",
          zIndex: "0",
        })
      ),
      transition("normal<=>animated", animate(300)),
    ]),
  ],
})
export class CometChatGroupListWithMessagesComponent implements OnInit {
  //It can be a user or a group
  item: any = null;

  // Defines the types of item that was clicked --> that is .. if its a user or a group
  type: string = "";

  loggedInUser: any = null;

  threadMessageView: boolean = false;
  threadMessageParent: any = null;
  threadMessageItem = null;
  threadMessageType: any = "";
  composedThreadMessage = null;
  viewDetailScreen: boolean = false;
  // To display image in full screen
  imageView = null;

  //If clicked then only show image in full screen
  fullScreenViewImage: boolean = false;

  groupToUpdate = {};
  groupToLeave = {};
  groupToDelete = {};
  groupMessage: any[] = [];

  //for audio calling
  outgoingCall = null;
  incomingCall = null;
  callMessage = null;
  messageToMarkRead: any;

  callInitialised: boolean = false;
  checkAnimatedState: any;
  checkIfAnimated: boolean = false;
  innerWidth: any;

  constructor() {}

  ngOnInit() {
    try {
      this.onResize();

      CometChat.getLoggedinUser().then((user) => {
        this.loggedInUser = user;
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Listen to the group emitted by the groupList component
   * @param Event user
   */
  groupClicked(group: any) {
    try {
      if (this.checkAnimatedState !== null) {
        this.checkAnimatedState == "normal"
          ? (this.checkAnimatedState = "animated")
          : (this.checkAnimatedState = "normal");
      }
      this.item = group;

      //Close Thread And User Detail Screen When Chat Window Is Changed
      this.closeThreadMessages();
      this.viewDetailScreen = false;

      if (this.item.hasOwnProperty(enums.UID)) {
        this.type = CometChat.RECEIVER_TYPE.USER;
      } else {
        this.type = CometChat.RECEIVER_TYPE.GROUP;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Checks when window size is changed in realtime
   */
  @HostListener("window:resize", [])
  onResize(): boolean {
    try {
      this.innerWidth = window.innerWidth;
      if (
        this.innerWidth >= enums.BREAKPOINT_MIN_WIDTH &&
        this.innerWidth <= enums.BREAKPOINT_MAX_WIDTH
      ) {
        if (this.checkIfAnimated === true) {
          return false;
        }
        this.checkAnimatedState = "normal";

        this.checkIfAnimated = true;
      } else {
        this.checkAnimatedState = null;
        this.checkIfAnimated = false;
      }
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    try {
      let message = action.payLoad;

      let data = action.payLoad;

      switch (action.type) {
        case enums.VIEW_MESSAGE_THREAD: {
          this.viewMessageThread(message);
          break;
        }
        case enums.THREAD_PARENT_MESSAGE_UPDATED: {
          this.updateThreadMessage(action.payLoad[0], action.updateType);
          break;
        }
        case enums.CLOSE_THREAD_CLICKED: {
          this.closeThreadMessages();
          break;
        }
        case enums.VIEW_ACTUAL_IMAGE: {
          this.toggleImageView(action.payLoad);
          break;
        }
        case enums.CLOSE_FULL_SCREEN_IMAGE: {
          this.toggleImageView(null);
          break;
        }
        case enums.VIEW_DETAIL:
        case enums.CLOSE_DETAIL_CLICKED: {
          this.toggleDetailView();
          break;
        }
        case enums.CHANGE_THREAD_PARENT_MESSAGE_REPLY_COUNT: {
          this.composedThreadMessage = {
            ...this.threadMessageParent,
            replyCount: action.payLoad,
          };

          break;
        }

        case enums.MEMBER_SCOPE_CHANGED: {
          this.memberScopeChanged(action.payLoad);
          break;
        }
        case enums.MEMBERS_ADDED: {
          this.membersAdded(data);
          break;
        }
        case enums.MEMBERS_UPDATED: {
          this.updateMembersCount(data.item, data.count);
          break;
        }
        case enums.GROUP_UPDATED:
          this.groupUpdated(data.message, data.key, data.group, data.options);
          break;
        case enums.MEMBER_UNBANNED:
          this.memberUnbanned(data);
          break;
        case enums.LEFT_GROUP: {
          this.leaveGroup(data);
          break;
        }
        case enums.DELETE_GROUP: {
          this.deleteGroup(data);
          break;
        }
        case enums.AUDIO_CALL: {
          this.audioCall();
          break;
        }
        case enums.DIRECT_CALL: {
          // this.directVideoCall()
      
          break;
        }
   
        
        case enums.VIDEO_CALL:
          this.videoCall();
          break;
        case enums.OUT_GOING_CALL_REJECTED:
        case enums.OUTGOING_CALL_REJECTED:
        case enums.OUTGOING_CALL_CANCELLED:
        case enums.CALL_ENDED_BY_USER:
        case enums.CALL_ENDED: {
          this.outgoingCallEnded(message);
          break;
        }
        case enums.USER_JOINED_CALL:
        case enums.USER_LEFT_CALL: {
          break;
        }
        case enums.ACCEPT_INCOMING_CALL: {
          this.acceptIncomingCall(message);
          break;
        }
        case enums.ACCEPTED_INCOMING_CALL: {
          this.callInitiated(message);
          break;
        }
        case enums.REJECTED_INCOMING_CALL: {
          this.rejectedIncomingCall(message);
          break;
        }
        case enums.CALL_ERROR: {
          logger(
            "User List screen --> call couldn't complete due to error",
            action.payLoad
          );
          break;
        }
        case enums.MENU_CLICKED: {
          this.checkAnimatedState = "normal";
          this.item = null;
          break;
        }
      }
    } catch (error) {
      logger(error);
    }
  }
  

  /**
   * Sets All the Intial Conditions for the threaded View of Messages and Opens thread View
   * @param Any parentMessage
   */
  viewMessageThread(parentMessage: object) {
    try {
      //Open Thread Screen
      this.threadMessageView = true;

      //close user ( the person you are chatting with ) Detail screen
      this.viewDetailScreen = false;

      this.threadMessageParent = parentMessage;
      this.threadMessageItem = this.item;
      this.threadMessageType = this.type;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates the thread message , it the currently open thread parent is deleted or is edited
   */
  updateThreadMessage = (message: any, action: string): boolean => {
    try {
      if (this.threadMessageView === false) {
        return false;
      }

      if (action === enums.DELETE) {
        this.threadMessageParent = { ...message };
        this.threadMessageView = false;
      } else {
        this.threadMessageParent = { ...message };
      }
    } catch (error) {
      logger(error);
    }
    return true;
  };

  /**
   * Close the thread window
   * @param Any parentMessage
   */
  closeThreadMessages() {
    try {
      //close Thread Screen
      this.threadMessageView = false;
      this.threadMessageParent = null;
      this.threadMessageItem = null;
      this.threadMessageType = null;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Opens the clicked Image in full screen mode
   * @param Any message
   */
  toggleImageView(message: any) {
    try {
      this.imageView = message;
      this.fullScreenViewImage = !this.fullScreenViewImage;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Opens User Detail Right Side bar
   * @param Any message
   */
  toggleDetailView = () => {
    try {
      this.threadMessageView = false;
      this.viewDetailScreen = !this.viewDetailScreen;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * updates the message list with a message notifying that , scope a some user is changed
   * @param Any members
   */
  memberScopeChanged = (members: any) => {
    try {
      const messageList: any[] = [];

      members.forEach((eachMember: any) => {
        const message = `${this.loggedInUser.name} made ${eachMember.name} ${eachMember.scope}`;
        const date: any = new Date();
        const sentAt: any = (date / 1000) | 0;
        const messageObj = {
          category: CometChat.CATEGORY_ACTION,
          message: message,
          type: enums.ACTION_TYPE_GROUPMEMBER,
          sentAt: sentAt,
        };
        messageList.push(messageObj);
      });

      this.groupMessage = messageList;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * updates the messageList with messages about the members that were added
   * @param Any members
   */
  membersAdded = (members: any) => {
    try {
      const messageList: any[] = [];
      members.forEach((eachMember: any) => {
        const message = `${this.loggedInUser.name} added ${eachMember.name}`;
        const date: any = new Date();
        const sentAt: any = (date / 1000) | 0;
        const messageObj = {
          category: CometChat.CATEGORY_ACTION,
          message: message,
          type: enums.ACTION_TYPE_GROUPMEMBER,
          sentAt: sentAt,
        };
        messageList.push(messageObj);
      });

      this.groupMessage = messageList;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * updates The count of  number of members present in a group based on group activities , like adding a member or kicking a member
   * @param Any members
   */
  updateMembersCount = (item: any, count: any) => {
    try {
      const group = Object.assign({}, this.item, { membersCount: count });

      this.item = group;
      this.groupToUpdate = group;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates Current Group Information
   * @param
   */
  groupUpdated = (message: any, key: any, group: any, options: { [x: string]: any; user: { uid: any; }; }) => {
    try {
      switch (key) {
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_KICKED: {
          if (options.user.uid === this.loggedInUser.uid) {
            this.item = null;
            this.type = CometChat.RECEIVER_TYPE.GROUP;
            this.viewDetailScreen = false;
          }
          break;
        }
        case enums.GROUP_MEMBER_SCOPE_CHANGED: {
          if (options.user.uid === this.loggedInUser.uid) {
            const newObj = Object.assign({}, this.item, {
              scope: options[enums.SCOPE],
            });

            this.item = newObj;
            this.type = CometChat.RECEIVER_TYPE.GROUP;
            this.viewDetailScreen = false;
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   *  Unbans the user
   * @param
   */
  memberUnbanned(members: any) {
    try {
      const messageList: any[] = [];
      members.forEach((eachMember: any) => {
        const message = `${this.loggedInUser.name} unbanned ${eachMember.name}`;
        const date: any = new Date();
        const sentAt: any = (date / 1000) | 0;
        const messageObj = {
          category: CometChat.CATEGORY_ACTION,
          message: message,
          type: enums.ACTION_TYPE_GROUPMEMBER,
          sentAt: sentAt,
        };
        messageList.push(messageObj);
      });

      this.groupMessage = messageList;
    } catch (error) {
      logger(error);
    }
  }
  /* Closes group screen and all , after user has left the group
   * @param
   */
  leaveGroup = (group: object) => {
    try {
      this.toggleDetailView();
      this.item = null;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Closes group screen and all , after user has deleted the group
   * @param
   */
  deleteGroup = (group: object) => {
    try {
      this.groupToDelete = group;
      this.toggleDetailView();
      this.item = null;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * initiates an audio call with the person you are chatting with
   */
  audioCall() {
    try {
      let receiverId, receiverType;
      if (this.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.item.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.item.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }

      CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.AUDIO)
        .then((call: any) => {
          this.appendCallMessage(call);
          this.outgoingCall = call;
        })
        .catch((error) => {
          logger("Call initialization failed with exception:", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * initiates an video call with the person you are chatting with
   */
  videoCall = () => {
    try {
      let receiverId, receiverType;
      if (this.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.item.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.item.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }

      CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.VIDEO)
        .then((call: any) => {
          this.appendCallMessage(call);

          this.outgoingCall = call;
        })
        .catch((error) => {
          logger("Call initialization failed with exception:", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Appends call activities as messages to messageList
   */
  appendCallMessage(call: any) {
    try {
      this.callMessage = call;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * closes call screen
   */
  outgoingCallEnded(message: object) {
    try {
      this.outgoingCall = null;
      this.incomingCall = null;
      this.appendCallMessage(message);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * opens call screen when user accepts the incoming call
   */
  acceptIncomingCall(call: any) {
    try {
      this.incomingCall = call;

      const type = call.receiverType;
      const id =
        type === CometChat.RECEIVER_TYPE.USER
          ? call.sender.uid
          : call.receiverId;

      CometChat.getConversation(id, type)
        .then((conversation: any) => {
          this.item = { ...conversation.conversationWith };
          this.type = type;
        })
        .catch((error) => {
          logger("error while fetching a conversation", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * appends call accepted message , When call is accepted and connected
   * @param
   */
  callInitiated(message: object) {
    try {
      this.appendCallMessage(message);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * closes call screen and sets call settings to initial when IncomingCall Rejected
   */
  rejectedIncomingCall(call: any) {
    try {
      let incomingCallMessage = call.incomingCall;
      let rejectedCallMessage = call.rejectedCall;
      let receiverType = incomingCallMessage.receiverType;
      let receiverId =
        receiverType === CometChat.RECEIVER_TYPE.USER
          ? incomingCallMessage.sender.uid
          : incomingCallMessage.receiverId;

      //marking the incoming call message as read
      if (incomingCallMessage.hasOwnProperty(enums.READ_AT) === false) {
        CometChat.markAsRead(incomingCallMessage);
      }

      //updating unreadcount in chats list
      this.messageToMarkRead = incomingCallMessage;

      let item = this.item;
      let type = this.type;

      receiverType = rejectedCallMessage.receiverType;
      receiverId = rejectedCallMessage.receiverId;

      if (
        (type === CometChat.RECEIVER_TYPE.GROUP &&
          receiverType === CometChat.RECEIVER_TYPE.GROUP &&
          receiverId === item.guid) ||
        (type === CometChat.RECEIVER_TYPE.USER &&
          receiverType === CometChat.RECEIVER_TYPE.USER &&
          receiverId === item.uid)
      ) {
        this.appendCallMessage(rejectedCallMessage);
      }
    } catch (error) {
      logger(error);
    }
  }
}
