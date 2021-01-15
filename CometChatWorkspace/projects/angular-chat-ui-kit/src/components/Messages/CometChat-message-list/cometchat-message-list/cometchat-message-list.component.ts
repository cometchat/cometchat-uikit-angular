import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { DatePipe } from "@angular/common";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-message-list",
  templateUrl: "./cometchat-message-list.component.html",
  styleUrls: ["./cometchat-message-list.component.css"],
})
export class CometChatMessageListComponent
  implements OnInit, OnDestroy, OnChanges {
  @Input() item = null;
  @Input() type = null;
  @Input() parentMessageId = null;

  @Input() messages = [];
  @Input() reachedTopOfConversation = [];

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  messagesRequest;
  limit = 50;
  decoratorMessage = STRING_MESSAGES.LOADING_MESSSAGE;
  times = 0;
  lastScrollTop = 0;
  loggedInUser;
  msgListenerId = "message_" + new Date().getTime();
  groupListenerId = "group_" + new Date().getTime();
  callListenerId = "call_" + new Date().getTime();
  prevUser;

  categories = [
    enums.CATEGORY_MESSAGE,
    enums.CATEGORY_CUSTOM,
    enums.CATEGORY_ACTION,
    enums.CATEGORY_CALL,
  ];
  types = [
    enums.MESSAGE_TYPE_TEXT,
    enums.MESSAGE_TYPE_IMAGE,
    enums.MESSAGE_TYPE_VIDEO,
    enums.MESSAGE_TYPE_AUDIO,
    enums.MESSAGE_TYPE_FILE,
    enums.CUSTOM_TYPE_POLL,
    enums.CUSTOM_TYPE_STICKER,
    enums.ACTION_TYPE_GROUPMEMBER,
    enums.CALL_TYPE_AUDIO,
    enums.CALL_TYPE_VIDEO,
  ];

  constructor(private ref: ChangeDetectorRef, public datepipe: DatePipe) {
    setInterval(() => {
      if (!this.ref["destroyed"]) {
        this.ref.detectChanges();
      }
    }, 2500);
  }

  ngOnChanges(change: SimpleChanges) {
    if (change["item"]) {
      //Removing Previous Conversation Listeners
      CometChat.removeMessageListener(this.msgListenerId);
      CometChat.removeGroupListener(this.groupListenerId);
      CometChat.removeCallListener(this.callListenerId);

      this.msgListenerId = "message_" + new Date().getTime();
      this.groupListenerId = "group_" + new Date().getTime();
      this.callListenerId = "call_" + new Date().getTime();

      this.createMessageRequestObjectAndGetMessages();

      // Attach MessageListeners for the new conversation
      this.addMessageEventListeners();
    }

    if (change["reachedTopOfConversation"]) {
      if (change["reachedTopOfConversation"].currentValue) {
        this.getMessages(false, false, true);
      }
    }

    // new thread opened
    if (change["parentMessageId"]) {
      //Removing Previous thread Listeners
      CometChat.removeMessageListener(this.msgListenerId);
      this.msgListenerId = "message_" + new Date().getTime();
      this.createMessageRequestObjectAndGetMessages();

      // Attach MessageListeners for the new conversation
      this.addMessageEventListeners();
    }

    if (change["messages"]) {
      if (change["messages"].currentValue.length > 0) {
        this.decoratorMessage = "";
      }
    }
  }

  ngOnInit() {
    this.createMessageRequestObjectAndGetMessages();

    // Attach MessageListeners Here
    this.addMessageEventListeners();
  }

  ngOnDestroy() {
    // removinf the changeDetector Ref
    //this.ref.detach();

    //Removing Message Listeners
    CometChat.removeMessageListener(this.msgListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
    CometChat.removeCallListener(this.callListenerId);
  }

  /**
   * Creates a Message Request object ( holding the config , that is the two user involved in conversation ) and gets all the messages
   * @param
   */
  createMessageRequestObjectAndGetMessages() {
    if (this.parentMessageId) {
      this.messagesRequest = this.buildMessageRequestObject(
        this.item,
        this.type,
        this.parentMessageId
      );
    } else {
      this.messagesRequest = this.buildMessageRequestObject(
        this.item,
        this.type
      );
    }

    this.getMessages(false, true);
  }

  /**
   * Listener To Receive Messages in Real Time
   * @param
   */
  addMessageEventListeners() {
    CometChat.addMessageListener(
      this.msgListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMessage) => {
          // console.log("Text message received successfully", textMessage);
          this.messageUpdated(enums.TEXT_MESSAGE_RECEIVED, textMessage);
        },
        onMediaMessageReceived: (mediaMessage) => {
          // console.log("Media message received successfully", mediaMessage);
          this.messageUpdated(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage);
        },
        onCustomMessageReceived: (customMessage) => {
          // console.log("Custom message received successfully", customMessage);
          this.messageUpdated(enums.CUSTOM_MESSAGE_RECEIVED, customMessage);
          // Handle custom message
        },
        onMessagesDelivered: (messageReceipt) => {
          // console.log("Text Message Delivered successfully ", messageReceipt);

          this.messageUpdated(enums.MESSAGE_DELIVERED, messageReceipt);
        },
        onMessagesRead: (messageReceipt) => {
          // console.log("Text Message Read successfully ", messageReceipt);

          this.messageUpdated(enums.MESSAGE_READ, messageReceipt);
        },
        onMessageDeleted: (deletedMessage) => {
          this.messageUpdated(enums.MESSAGE_DELETED, deletedMessage);
        },
        onMessageEdited: (editedMessage) => {
          this.messageUpdated(enums.MESSAGE_EDITED, editedMessage);
        },
      })
    );

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
          this.messageUpdated(
            enums.GROUP_MEMBER_SCOPE_CHANGED,
            message,
            changedGroup,
            { user: changedUser, scope: newScope }
          );
        },
        onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
          this.messageUpdated(enums.GROUP_MEMBER_KICKED, message, kickedFrom, {
            user: kickedUser,
            hasJoined: false,
          });
        },
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          this.messageUpdated(enums.GROUP_MEMBER_BANNED, message, bannedFrom, {
            user: bannedUser,
          });
        },
        onGroupMemberUnbanned: (
          message,
          unbannedUser,
          unbannedBy,
          unbannedFrom
        ) => {
          this.messageUpdated(
            enums.GROUP_MEMBER_UNBANNED,
            message,
            unbannedFrom,
            { user: unbannedUser }
          );
        },
        onMemberAddedToGroup: (
          message,
          userAdded,
          userAddedBy,
          userAddedIn
        ) => {
          this.messageUpdated(enums.GROUP_MEMBER_ADDED, message, userAddedIn, {
            user: userAdded,
            hasJoined: true,
          });
        },
        onGroupMemberLeft: (message, leavingUser, group) => {
          this.messageUpdated(enums.GROUP_MEMBER_LEFT, message, group, {
            user: leavingUser,
          });
        },
        onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
          this.messageUpdated(enums.GROUP_MEMBER_JOINED, message, joinedGroup, {
            user: joinedUser,
          });
        },
      })
    );

    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          this.messageUpdated(enums.INCOMING_CALL_RECEIVED, call);
        },
        onIncomingCallCancelled: (call) => {
          this.messageUpdated(enums.INCOMING_CALL_CANCELLED, call);
        },
        onOutgoingCallAccepted: (call) => {
          this.messageUpdated(enums.OUTGOING_CALL_ACCEPTED, call);
        },
        onOutgoingCallRejected: (call) => {
          this.messageUpdated(enums.OUTGOING_CALL_REJECTED, call);
        },
      })
    );
  }

  /**
   * This Build Message Request Configuration Object , that helps in getting messages of a particular conversation
   * @param
   */
  buildMessageRequestObject(item = null, type = null, parentMessageId = null) {
    let messageRequestBuilt;

    if (type === "user") {
      if (parentMessageId) {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setUID(item.uid)
          .setParentMessageId(parentMessageId)
          .setCategories(this.categories)
          .setTypes(this.types)
          .setLimit(this.limit)
          .build();
      } else {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setUID(item.uid)
          .setCategories(this.categories)
          .setTypes(this.types)
          .hideReplies(true)
          .setLimit(this.limit)
          .build();
      }
    } else if (type === "group") {
      if (parentMessageId) {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setGUID(item.guid)
          .setParentMessageId(parentMessageId)
          .setCategories(this.categories)
          .setTypes(this.types)
          .setLimit(this.limit)
          .build();
      } else {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setGUID(item.guid)
          .setCategories(this.categories)
          .setTypes(this.types)
          .hideReplies(true)
          .setLimit(this.limit)
          .build();
      }
    }

    return messageRequestBuilt;
  }

  /**
   * Gets Messages For a particular conversation bases on MessageRequestConfig
   * @param
   */
  getMessages(
    scrollToBottom = false,
    newConversation = false,
    scrollToTop = false
  ) {
    this.decoratorMessage = STRING_MESSAGES.LOADING_MESSSAGE;
    const actionMessages = [];

    let user = CometChat.getLoggedinUser().then(
      (user) => {
        this.loggedInUser = user;

        this.messagesRequest.fetchPrevious().then(
          (messageList) => {
            // No Messages Found
            if (messageList.length === 0 && this.messages.length === 0) {
              this.decoratorMessage = STRING_MESSAGES.NO_MESSAGES_FOUND;
            } else {
              this.decoratorMessage = "";
            }

            messageList.forEach((message) => {
              if (
                message.category === "action" &&
                message.sender.uid === "app_system"
              ) {
                actionMessages.push(message);
              }

              //if the sender of the message is not the loggedin user, mark it as read.
              if (
                message.getSender().getUid() !== user.getUid() &&
                !message.getReadAt()
              ) {
                if (message.getReceiverType() === "user") {
                  CometChat.markAsRead(
                    message.getId().toString(),
                    message.getSender().getUid(),
                    message.getReceiverType()
                  );
                } else if (message.getReceiverType() === "group") {
                  CometChat.markAsRead(
                    message.getId().toString(),
                    message.getReceiverId(),
                    message.getReceiverType()
                  );
                }

                this.actionGenerated.emit({
                  type: enums.MESSAGE__READ,
                  payLoad: message,
                });
              }
            });

            ++this.times;

            let actionGeneratedType = "messageFetched";
            if (scrollToBottom === true) {
              actionGeneratedType = "messageFetchedAgain";
            }

            if (scrollToTop) {
              actionGeneratedType = "olderMessagesFetched";
            }

            // Only called when the active user changes the the conversation , that is switches to some other person
            // to chat with
            if (newConversation) {
              actionGeneratedType = "newConversationOpened";
            }

            if (
              (this.times === 1 && actionMessages.length > 5) ||
              (this.times > 1 && actionMessages.length === 30)
            ) {
              this.actionGenerated.emit({
                type: enums.MESSAGE_FETCHED,
                payLoad: messageList,
              });
              this.getMessages(true, false);
            } else {
              // Implement Scroll Logic from React
              // this.lastScrollTop = this.messagesEnd.scrollHeight;

              this.actionGenerated.emit({
                type: actionGeneratedType,
                payLoad: messageList,
              });
            }
          },
          (error) => {
            // console.log("Message fetching failed with error:", error);
          }
        );
      },
      (error) => {
        console.log("No Logged In User Found", { error });
      }
    );
  }

  messageUpdated(key = null, message = null, group = null, options = null) {
    //there are many cases to be filled Here

    switch (key) {
      case enums.TEXT_MESSAGE_RECEIVED:
      case enums.MEDIA_MESSAGE_RECEIVED:
        this.messageReceived(message);
        break;
      case enums.MESSAGE_DELIVERED:
      case enums.MESSAGE_READ:
        this.messageReadAndDelivered(message);
        break;
      case enums.MESSAGE_DELETED: {
        this.messageDeleted(message);
        break;
      }
      case enums.MESSAGE_EDITED: {
        this.messageEdited(message);
        break;
      }
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
      case enums.GROUP_MEMBER_JOINED:
      case enums.GROUP_MEMBER_LEFT:
      case enums.GROUP_MEMBER_ADDED:
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_UNBANNED: {
        this.groupUpdated(key, message, group, options);
        break;
      }
      case enums.CUSTOM_MESSAGE_RECEIVED:
        this.customMessageReceived(message);
        break;
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
      case enums.OUTGOING_CALL_ACCEPTED:
      case enums.OUTGOING_CALL_REJECTED:
        this.callUpdated(message);
        break;
    }
  }

  messageReceived(message) {
    //new messages
    if (
      this.type === "group" &&
      message.getReceiverType() === "group" &&
      message.getReceiverId() === this.item.guid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType()
        );
      }

      this.actionGenerated.emit({
        type: enums.MESSAGE_RECEIVED,
        payLoad: [message],
      });
    } else if (
      this.type === "user" &&
      message.getReceiverType() === "user" &&
      message.getSender().uid === this.item.uid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().uid,
          message.getReceiverType()
        );
      }

      this.actionGenerated.emit({
        type: enums.MESSAGE_RECEIVED,
        payLoad: [message],
      });
    }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    this.actionGenerated.emit(action);
  }

  messageReadAndDelivered(message) {
    if (
      message.getReceiverType() === "user" &&
      message.getSender().getUid() === this.item.uid &&
      message.getReceiver() === this.loggedInUser.uid
    ) {
      let messageList = [...this.messages];

      if (message.getReceiptType() === "delivery") {
        //search for message
        let messageKey = messageList.findIndex(
          (m) => m.id === message.messageId
        );

        if (messageKey > -1) {
          let messageObj = { ...messageList[messageKey] };
          let newMessageObj = Object.assign({}, messageObj, {
            deliveredAt: message.getDeliveredAt(),
          });
          messageList.splice(messageKey, 1, newMessageObj);

          this.actionGenerated.emit({
            type: enums.MESSAGE_UPDATED,
            payLoad: messageList,
          });
        }
      } else if (message.getReceiptType() === "read") {
        //search for message
        let messageKey = messageList.findIndex(
          (m) => m.id === message.messageId
        );

        if (messageKey > -1) {
          let messageObj = { ...messageList[messageKey] };
          let newMessageObj = Object.assign({}, messageObj, {
            readAt: message.getReadAt(),
          });
          messageList.splice(messageKey, 1, newMessageObj);

          this.actionGenerated.emit({
            type: enums.MESSAGE_UPDATED,
            payLoad: messageList,
          });
        }
      }
    } else if (
      message.getReceiverType() === "group" &&
      message.getReceiver().guid === this.item.guid
    ) {
      //not implemented in React Also
    }
  }

  /**
   * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
   * @param Any message
   */
  messageDeleted(message) {
    if (
      this.type === "group" &&
      message.getReceiverType() === "group" &&
      message.getReceiver().guid === this.item.guid
    ) {
      this.actionGenerated.emit({
        type: enums.MESSAGE_DELETE,
        payLoad: [message],
      });
    } else if (
      this.type === "user" &&
      message.getReceiverType() === "user" &&
      message.getSender().uid === this.item.uid
    ) {
      this.actionGenerated.emit({
        type: enums.MESSAGE_DELETE,
        payLoad: [message],
      });
    }
  }

  /**
   * Detects if the message that was edit is you current open conversation window
   * @param Any message
   */
  messageEdited = (message) => {
    if (
      this.type === "group" &&
      message.getReceiverType() === "group" &&
      message.getReceiver().guid === this.item.guid
    ) {
      this.updateEditedMessage(message);
    } else if (
      this.type === "user" &&
      message.getReceiverType() === "user" &&
      this.loggedInUser.uid === message.getReceiverId() &&
      message.getSender().uid === this.item.uid
    ) {
      this.updateEditedMessage(message);
    } else if (
      this.type === "user" &&
      message.getReceiverType() === "user" &&
      this.loggedInUser.uid === message.getSender().uid &&
      message.getReceiverId() === this.item.uid
    ) {
      this.updateEditedMessage(message);
    }
  };

  /**
   * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
   * @param Any message
   */
  updateEditedMessage = (message) => {
    //If the updated message is the current message that is opened in thread view then update thread view also
    if (message.id == this.parentMessageId) {
      this.actionGenerated.emit({
        type: enums.THREAD_PARENT_MESSAGE_UPDATED,
        payLoad: message,
      });
    }
    const messageList = [...this.messages];
    let messageKey = messageList.findIndex((m, k) => m.id === message.id);

    if (messageKey > -1) {
      const messageObj = messageList[messageKey];
      const newMessageObj = Object.assign({}, messageObj, message);

      messageList.splice(messageKey, 1, newMessageObj);
      this.actionGenerated.emit({
        type: enums.MESSAGE_UPDATED,
        payLoad: messageList,
      });
    }
  };

  /**
   * Emits an Action Indicating that Group Data has been updated
   * @param
   */
  groupUpdated = (key, message, group, options) => {
    if (
      this.type === "group" &&
      message.getReceiverType() === "group" &&
      message.getReceiver().guid === this.item.guid
    ) {
      this.actionGenerated.emit({
        type: enums.GROUP_UPDATED,
        payLoad: { message, key, group, options },
      });
    }
  };

  customMessageReceived(message) {
    if (
      this.type === "group" &&
      message.getReceiverType() === "group" &&
      message.getReceiverId() === this.item.guid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType()
        );
      }

      if (
        message.hasOwnProperty("metadata") &&
        message.type !== enums.CUSTOM_TYPE_STICKER &&
        message.type !== enums.CUSTOM_TYPE_POLL
      ) {
        this.actionGenerated.emit({
          type: enums.CUSTOM_MESSAGE_RECEIVE,
          payLoad: [message],
        });
      } else if (message.type === enums.CUSTOM_TYPE_STICKER) {
        this.actionGenerated.emit({
          type: enums.CUSTOM_MESSAGE_RECEIVE,
          payLoad: [message],
        });
      } else if (message.type === enums.CUSTOM_TYPE_POLL) {
        //customdata (poll extension) does not have metadata

        //The poll message that  is received by the message listeners , will not be appended to message list
        //if the current loggedIn user is the sender/creator of the poll message
        if (message.sender.uid === this.loggedInUser.uid) {
          return false;
        }

        const newMessage = this.addMetadataToCustomData(message);
        this.actionGenerated.emit({
          type: enums.CUSTOM_MESSAGE_RECEIVE,
          payLoad: [newMessage],
        });
      }
    } else if (
      this.type === "user" &&
      message.getReceiverType() === "user" &&
      message.getSender().uid === this.item.uid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().uid,
          message.getReceiverType()
        );
      }

      if (
        message.hasOwnProperty("metadata") &&
        message.type !== enums.CUSTOM_TYPE_STICKER &&
        message.type !== enums.CUSTOM_TYPE_POLL
      ) {
        this.actionGenerated.emit({
          type: enums.CUSTOM_MESSAGE_RECEIVE,
          payLoad: [message],
        });
      } else if (message.type === enums.CUSTOM_TYPE_STICKER) {
        this.actionGenerated.emit({
          type: enums.CUSTOM_MESSAGE_RECEIVE,
          payLoad: [message],
        });
      } else if (message.type === enums.CUSTOM_TYPE_POLL) {
        //customdata (poll extension) does not have metadata

        const newMessage = this.addMetadataToCustomData(message);
        this.actionGenerated.emit({
          type: enums.CUSTOM_MESSAGE_RECEIVE,
          payLoad: [newMessage],
        });
      }
    }
  }
  addMetadataToCustomData = (message) => {
    const customData = message.data.customData;
    const options = customData.options;

    const resultOptions = {};
    for (const option in options) {
      resultOptions[option] = {
        text: options[option],
        count: 0,
      };
    }

    const polls = {
      id: message.id,
      options: options,
      results: {
        total: 0,
        options: resultOptions,
        question: customData.question,
      },
      question: customData.question,
    };

    return {
      ...message,
      metadata: { "@injected": { extensions: { polls: polls } } },
    };
  };

  callUpdated(message) {
    if (
      this.type === "group" &&
      message.getReceiverType() === "group" &&
      message.getReceiverId() === this.item.guid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType()
        );
      }

      this.actionGenerated.emit({
        type: enums.CALL_UPDATED,
        payLoad: message,
      });
    } else if (
      this.type === "user" &&
      message.getReceiverType() === "user" &&
      message.getSender().uid === this.item.uid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().uid,
          message.getReceiverType()
        );
      }

      this.actionGenerated.emit({
        type: enums.CALL_UPDATED,
        payLoad: message,
      });
    }
  }

  /**
   * Compares two dates and return true if they are not equal
   */
  isDateDifferent(firstDate, secondDate) {
    let firstDateObj: Date, secondDateObj: Date;
    firstDateObj = new Date(firstDate * 1000);
    secondDateObj = new Date(secondDate * 1000);
    if (
      firstDateObj.getDate() === secondDateObj.getDate() &&
      firstDateObj.getMonth() === secondDateObj.getMonth() &&
      firstDateObj.getFullYear() === secondDateObj.getFullYear()
    ) {
      return false;
    }
    return true;
  }
}
