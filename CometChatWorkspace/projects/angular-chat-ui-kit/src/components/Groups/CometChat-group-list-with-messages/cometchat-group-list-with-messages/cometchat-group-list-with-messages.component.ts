import { Component, OnInit, HostListener } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { CometChatManager } from "../../../utils/controller";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
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
  item = null;

  // Defines the types of item that was clicked --> that is .. if its a user or a group
  type = null;

  loggedInUser = null;

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

  groupToUpdate = {};
  groupToLeave = {};
  groupToDelete = {};
  groupMessage = [];

  //for audio calling
  outgoingCall = null;
  incomingCall = null;
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
   * Listen to the group emitted by the groupList component
   * @param Event user
   */
  groupClicked(group) {
    if (this.checkAnimatedState !== null) {
      this.checkAnimatedState == "normal"
        ? (this.checkAnimatedState = "animated")
        : (this.checkAnimatedState = "normal");
    }
    this.item = group;

    //Close Thread And User Detail Screen When Chat Window Is Changed
    this.closeThreadMessages();
    this.viewDetailScreen = false;

    if (this.item.hasOwnProperty("uid")) {
      this.type = "user";
    } else {
      this.type = "group";
    }
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
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    let message = action.payLoad;

    let data = action.payLoad;

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
      }
      case enums.MENU_CLICKED: {
        this.checkAnimatedState = "normal";
        this.item = null;
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
    this.threadMessageItem = this.item;
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
   * updates the message list with a message notifying that , scope a some user is changed
   * @param Any members
   */
  memberScopeChanged = (members) => {
    const messageList = [];

    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} made ${eachMember.name} ${eachMember.scope}`;
      const sentAt = new Date();
      const messageObj = {
        category: "action",
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.groupMessage = messageList;
  };

  /**
   * updates the messageList with messages about the members that were added
   * @param Any members
   */
  membersAdded = (members) => {
    const messageList = [];
    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} added ${eachMember.name}`;
      const sentAt = new Date();
      const messageObj = {
        category: "action",
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.groupMessage = messageList;
  };

  /**
   * updates The count of  number of members present in a group based on group activities , like adding a member or kicking a member
   * @param Any members
   */
  updateMembersCount = (item, count) => {
    const group = Object.assign({}, this.item, { membersCount: count });

    this.item = group;
    this.groupToUpdate = group;
  };

  /**
   * Updates Current Group Information
   * @param
   */
  groupUpdated = (message, key, group, options) => {
    switch (key) {
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_KICKED: {
        if (options.user.uid === this.loggedInUser.uid) {
          this.item = null;
          this.type = "group";
          this.viewDetailScreen = false;
        }
        break;
      }
      case enums.GROUP_MEMBER_SCOPE_CHANGED: {
        if (options.user.uid === this.loggedInUser.uid) {
          const newObj = Object.assign({}, this.item, {
            scope: options["scope"],
          });

          this.item = newObj;
          this.type = "group";
          this.viewDetailScreen = false;
        }
        break;
      }
      default:
        break;
    }
  };

  /**
   *  Unbans the user
   * @param
   */
  memberUnbanned(members) {
    const messageList = [];
    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} unbanned ${eachMember.name}`;
      const date: any = new Date();
      const sentAt: any = (date / 1000) | 0;
      const messageObj = {
        category: "action",
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.groupMessage = messageList;
  }
  /* Closes group screen and all , after user has left the group
   * @param
   */
  leaveGroup = (group) => {
    this.groupToLeave = group;
    this.toggleDetailView();
    this.item = null;
  };

  /**
   * Closes group screen and all , after user has deleted the group
   * @param
   */
  deleteGroup = (group) => {
    this.groupToDelete = group;
    this.toggleDetailView();
    this.item = null;
  };

  /**
   * initiates an audio call with the person you are chatting with
   */
  audioCall() {
    let receiverId, receiverType;
    if (this.type === "user") {
      receiverId = this.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.type === "group") {
      receiverId = this.item.guid;
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
      receiverId = this.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.type === "group") {
      receiverId = this.item.guid;
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
        this.item = { ...conversation.conversationWith };
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

    let item = this.item;
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
