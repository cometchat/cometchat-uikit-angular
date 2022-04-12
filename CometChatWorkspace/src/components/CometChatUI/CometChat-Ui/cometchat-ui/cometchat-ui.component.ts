import { Component, OnInit, HostListener, Output, EventEmitter, ViewChild } from "@angular/core";
import { CometChatManager } from "../../../../utils/controller";
import * as enums from "../../../../utils/enums";
import { CometChat } from "@cometchat-pro/chat";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { getUnixTimestamp, ID, logger } from "../../../../utils/common";
import { CometChatService } from "./../../../../utils/cometchat.service";

@Component({
  selector: "CometChatUI",
  templateUrl: "./cometchat-ui.component.html",
  styleUrls: ["./cometchat-ui.component.css"],
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
export class CometChatUIComponent implements OnInit {
  // emit listener for direct call
  item: any = null;
  curentItem: any;
  type: string = '';
  viewDetailScreen: boolean = false;
  threadMessageView: boolean = false;
  threadMessageItem = null;
  threadMessageType: string = '';
  threadMessageParent: object = {};
  lastMessage: any;
  loggedInUser: any;
  groupToUpdate: object = {};
  groupToLeave = {};
  groupToDelete: object = {};
  groupMessage: object = {};
  composedThreadMessage: any = null;
  fullScreenViewImage: boolean = false;
  imageView: object = {};
  // for direct call
  joinDirectCall:any;
  incomingDirectCall:any;

  //for audio calling
  outgoingCall = null;
  incomingCall = null;
  callMessage = null;
  messageToMarkRead: any;


  checkAnimatedState: any;
  checkIfAnimated: boolean = false;
  innerWidth: any;

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;
  USER: String = CometChat.RECEIVER_TYPE.USER;

  constructor(private CometChatService: CometChatService) { }

  ngOnInit() {
    // if(this.item.guid){
    //   this.fetchCustomMessage()

    // }


    try {
      this.onResize();
      CometChat.getLoggedinUser()
        .then((user) => {
          this.loggedInUser = user;
        })
        .catch((error) => {
          logger("[CometChatUnified] getLoggedInUser error", error);
        });

      /*
       * Updating cometchat-messages component on deletion of conversation.
       */
      this.CometChatService.conversationDeleted.subscribe((conversation: any) => {
        if (this.item && this.type === CometChat.RECEIVER_TYPE.USER
          && conversation.conversationType === CometChat.RECEIVER_TYPE.USER
          && this.item.uid === conversation.conversationWith.uid) {
          this.item = null;
        } else if (this.item && this.type === CometChat.RECEIVER_TYPE.GROUP
          && conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP
          && this.item.guid === conversation.conversationWith.guid) {
          this.item = null;
        }
      })


      /*
       * Updating view on leaving group
       */
      this.CometChatService.onLeaveGroup.subscribe((group: any) => {
        this.toggleDetailView();
        this.item = null;
      })
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
   * Handles all the actions propagated from the child component
   */
  actionHandler(action: any = null, item = null, count = null) {

    try {
      let message = action.payLoad;

      let data = action.payLoad;

      switch (action.type) {
        case enums.BLOCK_USER:
          this.blockUser();
          break;
        case enums.DIRECT_CALL_STARTED:
          this.appendCallMessage(message)
          break;

        case enums.UNBLOCK_USER:
          this.unblockUser();
          break;
        case enums.VIEW_DETAIL:
        case enums.CLOSE_DETAIL_CLICKED:
          this.toggleDetailView();
          break;
        case enums.VIEW_MESSAGE_THREAD:
          this.viewMessageThread(message);
          break;
        case enums.THREAD_PARENT_MESSAGE_UPDATED: {
          this.updateThreadMessage(action.payLoad[0], action.updateType);
          break;
        }

        case enums.CLOSE_THREAD_CLICKED:
          this.closeThreadMessages();
          break;
        case enums.VIEW_ACTUAL_IMAGE:
          this.toggleImageView(message);
          break;
        case enums.CLOSE_FULL_SCREEN_IMAGE: {
          this.toggleImageView({});
          break;
        }
        case enums.MESSAGE_COMPOSED:
        case enums.MESSAGE_EDIT:
        case enums.MESSAGE_DELETE:
          this.updateLastMessage(message[0]);
          break;
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
        case enums.DELETE_GROUP: {
          this.deleteGroup(data);
          break;
        }
        case enums.AUDIO_CALL: {

          this.audioCall();
          break;
        }
        case enums.DIRECT_CALL: {
          this.directVideoCall()
          break;
        }

        case enums.INCOMING_DIRECT_CALL: {

          this.startIncomingCall(message)
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
        case enums.DIRECT_CALL_ENDED:

          this.updateDirectCall()

          break;

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
        case enums.TAB_CHANGED: {
          this.viewDetailScreen = false;
          break;
        }
        case enums.SESSION_ID: {
          this.sendSessionId(action)
          break;
        }

        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  }


  /**
   * updates lastMessage , so that it can be updated in the conversationList
   */
  updateLastMessage(message: object) {

    try {

      this.lastMessage = message;
    } catch (error) {
      logger(error);
    }
  }
  updateDirectCall() {
    this.joinDirectCall = null;
    this.outgoingCall = null
    this.type = "group"

  }

  /**
   * Sets All the Intial Conditions for the threaded View of Messages and Opens thread View
   */
  viewMessageThread(parentMessage: any) {
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
  // incoming direct call
  startIncomingCall(message:object) {
    this.type = enums.INCOMING_DIRECT_CALL
    this.incomingDirectCall = message

  }
  /**
   * Updates the thread message , it the currently open thread parent is deleted or is edited
   */
  updateThreadMessage = (message: object, action: string): boolean => {
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
  // session id join data
  sendSessionId(action:any) {
    this.type = action.type;
    this.joinDirectCall = action.sessionid ? action.sessionid : action.payLoad
  }

  /*
   * Close the thread window
   */
  closeThreadMessages() {
    try {
      //close Thread Screen
      this.threadMessageView = false;
      this.threadMessageParent = {};
      this.threadMessageItem = null;
      this.threadMessageType = '';
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Opens User Detail Right Side bar
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
   * Opens the clicked Image in full screen mode
   */
  toggleImageView(message: object) {
    try {
      this.imageView = message;
      this.fullScreenViewImage = !this.fullScreenViewImage;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * When loggedInUser Blocks someone
   */
  blockUser() {
    try {
      let usersList = [this.item.uid];
      CometChatManager.blockUsers(usersList)
        .then((list) => {
          this.item = { ...this.item, blockedByMe: true };
          this.curentItem = this.item;
        })
        .catch((error) => {
          logger("Blocking user fails with error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * When loggedInUser UnBlocks someone
   */
  unblockUser() {
    try {
      let usersList = [this.item.uid];
      CometChatManager.unblockUsers(usersList)
        .then((list) => {
          this.item = { ...this.item, blockedByMe: false };
          this.curentItem = this.item;
        })
        .catch((error) => {
          logger("unblocking user fails with error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets the item information with the item that was clicked from userList , conversationList or groupList
   */
  userClicked(user: any) {
    try {
      if (this.checkAnimatedState !== null) {
        this.checkAnimatedState == "normal"
          ? (this.checkAnimatedState = "animated")
          : (this.checkAnimatedState = "normal");
      }
      this.item = user;
      if (this.item.hasOwnProperty(enums.UID)) {
        this.type = CometChat.RECEIVER_TYPE.USER;
      } else {
        this.type = CometChat.RECEIVER_TYPE.GROUP;
      }

      //close detail screen when switching between users/groups
      this.viewDetailScreen = false;
    } catch (error) {
      logger(error);
    }
  }

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
   *  Unbans the user , that was previously banned from the group
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

  /**
   * Closes group screen and all , after user has deleted the group
   * @param
   */
  deleteGroup = (group: any) => {
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
   * appends call activities as messages to messageList
   */
  appendCallMessage(call: any) {
    try {
      this.callMessage = call;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * closes the call screen and resets all call settings to initial stage as current call ended
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
   * ACCPETS INCOMING CALL and opens the call screen
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
   * When call is accepted and connected , appends the activity of accepting the call as message
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
   * closes call screen and all resets all call settings as  IncomingCall was Rejected
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
  directVideoCall() {
    this.type = enums.DIRECT_CALL

  }
  outgoingDirectCall(action:object) {
    this.appendCallMessage(this.makeCustomMessage(action))

  }
  makeCustomMessage(action:any) {
    const receiverType = CometChat.RECEIVER_TYPE.GROUP;
    const customData = { "sessionID": action.sessionid, "sessionId": action.sessionid, "callType": CometChat.CALL_TYPE.VIDEO };
    const customType = enums.DIRECT_CALL;
    const conversationId = `group_${action.sessionid}`;

    const customMessage: any = new CometChat.CustomMessage(action.sessionid, receiverType, customType, customData);
    customMessage.setSender(this.loggedInUser);
    customMessage.setReceiver((receiverType as any));
    customMessage.setConversationId(conversationId);
    customMessage.composedAt = getUnixTimestamp();
    customMessage.id = ID();
    return customMessage
  }
}
