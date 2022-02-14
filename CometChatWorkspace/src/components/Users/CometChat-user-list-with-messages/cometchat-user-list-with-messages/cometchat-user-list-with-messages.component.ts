import { Component, OnInit, HostListener } from "@angular/core";
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
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-user-list-with-messages",
  templateUrl: "./cometchat-user-list-with-messages.component.html",
  styleUrls: ["./cometchat-user-list-with-messages.component.css"],
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
        })
      ),
      transition("normal<=>animated", animate(300)),
    ]),
  ],
})
export class CometChatUserListWithMessagesComponent implements OnInit {
  //It can be a user or a group
  curentItem: any = null;
  item: any;
  // Defines the types of item that was clicked --> that is .. if its a user or a group
  type: string = '';

  threadMessageView: boolean = false;
  threadMessageParent: any = null;
  threadMessageItem = null;
  threadMessageType: any = '';
  composedThreadMessage = null;
  viewDetailScreen: boolean = false;
  // To display image in full screen
  imageView = null;

  //If clicked then only show image in full screen
  fullScreenViewImage: boolean = false;

  //for audio calling
  outgoingCall = null;
  incomingCall = null;
  loggedInUser: object = {};
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
      CometChat.getLoggedinUser().then((user: any) => {
        this.loggedInUser = user;
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Checks when window size is changed in realtime
   */
  @HostListener("window:resize", [])
  onResize():boolean {
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
   * Listen to the user emitted by the userList component
   * @param Event user
   */
  userClicked(user: any) {
    try {
      if (this.checkAnimatedState !== null) {
        this.checkAnimatedState == "normal"
          ? (this.checkAnimatedState = "animated")
          : (this.checkAnimatedState = "normal");
      }

      this.curentItem = user;
      this.item = this.curentItem;

      this.viewDetailScreen = false;

      if (this.curentItem.hasOwnProperty(enums.UID)) {
        this.type = CometChat.RECEIVER_TYPE.USER;
      } else {
        this.type = CometChat.RECEIVER_TYPE.GROUP;
      }
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
      let message = action.payLoad;

      switch (action.type) {
        case enums.INCOMING_DIRECT_CALL: {
          break;
        }
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
        case enums.MENU_CLICKED: {
          this.checkAnimatedState = "normal";

          this.curentItem = null;
          break;
        }
        case enums.BLOCK_USER: {
          this.blockUser();
          break;
        }
        case enums.UNBLOCK_USER:
          this.unblockUser();
          break;
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
          //this.appendCallMessage(item);
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
      this.threadMessageItem = this.curentItem;
      this.threadMessageType = this.type;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates the thread message , it the currently open thread parent is deleted or is edited
   */
  updateThreadMessage = (message: object, action: string):boolean => {
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
   * When User Block someone
   */
  blockUser() {
    try {
      let usersList = [this.curentItem.uid];
      CometChatManager.blockUsers(usersList)
        .then((list) => {
          this.curentItem = { ...this.curentItem, blockedByMe: true };
          this.item = this.curentItem;
          logger("block success");
        })
        .catch((error) => {
          logger("Blocking user fails with error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * When User UnBlock someone
   */
  unblockUser() {
    try {
      let usersList = [this.curentItem.uid];
      CometChatManager.unblockUsers(usersList)
        .then((list) => {
          this.curentItem = { ...this.curentItem, blockedByMe: false };
          this.item = this.curentItem;
          logger("unblock success");
        })
        .catch((error) => {
          logger("unblocking user fails with error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * initiates an audio call with the person you are chatting with
   */
  audioCall() {
    try {
      let receiverId, receiverType;
      if (this.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.curentItem.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.curentItem.guid;
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
        receiverId = this.curentItem.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.curentItem.guid;
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
   * Appends Call Messages
   * @param
   */
  appendCallMessage(call: any) {
    try {
      this.callMessage = call;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * When Outgoing call is ended append Call Message
   * @param message
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
   * ACCPETS INCOMING CALL
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
          this.curentItem = { ...conversation.conversationWith };
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
   * When call is accepted and connected append call message
   * @param
   */
  callInitiated(message: any) {
    try {
      this.appendCallMessage(message);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * IncomingCall Rejected
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

      let item = this.curentItem;
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
