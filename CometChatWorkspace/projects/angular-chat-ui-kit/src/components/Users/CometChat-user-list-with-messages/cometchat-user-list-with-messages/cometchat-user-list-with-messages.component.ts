import { Component, OnInit, HostListener } from "@angular/core";
import { CometChatManager } from "../../../utils/controller";
import * as enums from "../../../utils/enums";
import { CometChat } from "@cometchat-pro/chat";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";

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
  curentItem = null;
  item;
  // Defines the types of item that was clicked --> that is .. if its a user or a group
  type = null;

  threadMessageView: boolean = false;
  threadMessageParent = null;
  threadMessageItem = null;
  threadMessageType = "";
  composedthreadmessage = null;
  viewDetailScreen: boolean = false;
  // To display image in full screen
  imageView = null;

  //If clicked then only show image in full screen
  fullScreenViewImage: boolean = false;

  //for audio calling
  outgoingCall = null;
  incomingCall = null;
  loggedInUser;
  callMessage = {};
  messageToMarkRead;

  callInitialised: boolean = false;
  checkAnimatedState;
  checkIfAnimated: boolean = false;

  innerWidth;

  constructor() {}

  ngOnInit() {
    this.onResize();
    CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
    });
  }

  /**
   * Checks when window size is changed in realtime
   */
  @HostListener("window:resize", [])
  onResize() {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth >= "320" && this.innerWidth <= "767") {
      if (this.checkIfAnimated === true) {
        return false;
      }

      this.checkAnimatedState = "normal";
      this.checkIfAnimated = true;
    } else {
      this.checkAnimatedState = null;
      this.checkIfAnimated = false;
    }
  }

  /**
   * Listen to the user emitted by the userList component
   * @param Event user
   */
  userClicked(user) {
    if (this.checkAnimatedState !== null) {
      this.checkAnimatedState == "normal"
        ? (this.checkAnimatedState = "animated")
        : (this.checkAnimatedState = "normal");
    }

    this.curentItem = user;
    this.item = this.curentItem;

    //Close Thread And User Detail Screen When Chat Window Is Changed
    // this.closeThreadMessages();
    this.viewDetailScreen = false;

    if (this.curentItem.hasOwnProperty("uid")) {
      this.type = "user";
    } else {
      this.type = "group";
    }
  }
  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    //handle Events/Actions generated from MessageHeader , MessageComposer and MessageList Here

    // action.payLoad has the array of messages that is received
    let message = action.payLoad;

    // console.log("UserListScreen --> action generation is ", action);

    switch (action.type) {
      case enums.VIEW_MESSAGE_THREAD: {
        this.viewMessageThread(message);
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
        // this.toggleDetailView();

        this.composedthreadmessage = {
          ...this.threadMessageParent,
          replyCount: action.payLoad,
        };

        break;
      }
      case enums.MENU_CLICKED: {
        this.checkAnimatedState = "normal";
        // this.toggleSideBar();
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
        console.log(
          "User List screen --> call couldn't complete due to error",
          action.payLoad
        );
        break;
      }
    }
  }

  /**
   * Sets All the Intial Conditions for the threaded View of Messages and Opens thread View
   * @param Any parentMessage
   */
  viewMessageThread(parentMessage) {
    //Open Thread Screen
    this.threadMessageView = true;

    //close user ( the person you are chatting with ) Detail screen
    this.viewDetailScreen = false;

    this.threadMessageParent = parentMessage;
    this.threadMessageItem = this.curentItem;
    this.threadMessageType = this.type;
  }

  /**
   * Close the thread window
   * @param Any parentMessage
   */
  closeThreadMessages() {
    //close Thread Screen
    this.threadMessageView = false;
    this.threadMessageParent = null;
    this.threadMessageItem = null;
    this.threadMessageType = null;
  }

  /**
   * Opens the clicked Image in full screen mode
   * @param Any message
   */
  toggleImageView(message) {
    this.imageView = message;
    this.fullScreenViewImage = !this.fullScreenViewImage;
  }

  /**
   * Opens User Detail Right Side bar
   * @param Any message
   */
  toggleDetailView = () => {
    this.threadMessageView = false;
    this.viewDetailScreen = !this.viewDetailScreen;
  };

  /**
   * When User Block someone
   */
  blockUser() {
    let usersList = [this.curentItem.uid];
    CometChatManager.blockUsers(usersList)
      .then((list) => {
        this.curentItem = { ...this.curentItem, blockedByMe: true };
        this.item = this.curentItem;
        console.log("block success");
      })
      .catch((error) => {
        console.log("Blocking user fails with error", error);
      });
  }

  /**
   * When User UnBlock someone
   */
  unblockUser() {
    let usersList = [this.curentItem.uid];
    CometChatManager.unblockUsers(usersList)
      .then((list) => {
        this.curentItem = { ...this.curentItem, blockedByMe: false };
        this.item = this.curentItem;
        console.log("unblock success");
      })
      .catch((error) => {
        console.log("unblocking user fails with error", error);
      });
  }

  /**
   * initiates an audio call with the person you are chatting with
   */
  audioCall() {
    let receiverId, receiverType;
    if (this.type === "user") {
      receiverId = this.curentItem.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.type === "group") {
      receiverId = this.curentItem.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.AUDIO)
      .then((call) => {
        this.appendCallMessage(call);
        this.outgoingCall = call;
      })
      .catch((error) => {
        console.log("Call initialization failed with exception:", error);
      });
  }

  /**
   * initiates an video call with the person you are chatting with
   */
  videoCall = () => {
    let receiverId, receiverType;
    if (this.type === "user") {
      receiverId = this.curentItem.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.type === "group") {
      receiverId = this.curentItem.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.VIDEO)
      .then((call) => {
        this.appendCallMessage(call);

        this.outgoingCall = call;
      })
      .catch((error) => {
        console.log("Call initialization failed with exception:", error);
      });
  };

  appendCallMessage(call) {
    this.callMessage = call;
  }

  outgoingCallEnded(message) {
    this.outgoingCall = null;
    this.incomingCall = null;
    this.appendCallMessage(message);
  }

  /**
   * ACCPETS INCOMING CALL
   */
  acceptIncomingCall(call) {
    this.incomingCall = call;

    const type = call.receiverType;
    const id = type === "user" ? call.sender.uid : call.receiverId;

    CometChat.getConversation(id, type)
      .then((conversation: any) => {
        // this.itemClicked(conversation.conversationWith, type);
        this.curentItem = { ...conversation.conversationWith };
        this.type = type;
      })
      .catch((error) => {
        console.log("error while fetching a conversation", error);
      });
  }

  /**
   * When call is accepted and connected
   * @param
   */
  callInitiated(message) {
    this.appendCallMessage(message);
  }

  /**
   * IncomingCall Rejected
   */
  rejectedIncomingCall(call) {
    let incomingCallMessage = call.incomingCall;
    let rejectedCallMessage = call.rejectedCall;
    let receiverType = incomingCallMessage.receiverType;
    let receiverId =
      receiverType === "user"
        ? incomingCallMessage.sender.uid
        : incomingCallMessage.receiverId;

    //marking the incoming call message as read
    if (incomingCallMessage.hasOwnProperty("readAt") === false) {
      CometChat.markAsRead(incomingCallMessage.id, receiverId, receiverType);
    }

    //updating unreadcount in chats list
    this.messageToMarkRead = incomingCallMessage;

    let item = this.curentItem;
    let type = this.type;

    receiverType = rejectedCallMessage.receiverType;
    receiverId = rejectedCallMessage.receiverId;

    if (
      (type === "group" &&
        receiverType === "group" &&
        receiverId === item.guid) ||
      (type === "user" && receiverType === "user" && receiverId === item.uid)
    ) {
      this.appendCallMessage(rejectedCallMessage);
    }
  }
}
