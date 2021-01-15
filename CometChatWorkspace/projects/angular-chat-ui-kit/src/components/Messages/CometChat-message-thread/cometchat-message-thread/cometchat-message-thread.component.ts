import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-message-thread",
  templateUrl: "./cometchat-message-thread.component.html",
  styleUrls: ["./cometchat-message-thread.component.css"],
})
export class CometChatMessageThreadComponent implements OnInit, OnChanges {
  @ViewChild("messageWindow", { static: false }) chatWindow: ElementRef;

  @Input() item = null;
  @Input() type = null;
  @Input() parentMessage = null;
  @Input() loggedInUser = null;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  messageList = [];
  replyCount: number = 0;
  reachedTopOfConversation = false;
  scrollVariable = 0;
  messageToBeEdited = null;
  replyPreview = null;
  imageView = null;
  fullScreenViewImage: boolean = false;

  messageToReact = null;
  THREAD: String = STRING_MESSAGES.THREAD;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["parentMessage"]) {
      this.messageList = [];
      this.scrollToBottomOfChatWindow();
      if (change["parentMessage"].currentValue.hasOwnProperty("replyCount")) {
        this.replyCount = this.parentMessage.replyCount;
      } else {
        this.replyCount = 0;
      }
    }
  }

  ngOnInit() {
    if (this.parentMessage.hasOwnProperty("replyCount")) {
      this.replyCount = this.parentMessage.replyCount;
    }

    let user = CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
    });
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    let messages = action.payLoad;

    // console.log("MessageThread --> action generation is ", action);

    switch (action.type) {
      case enums.NEW_CONVERSATION_OPENED: {
        this.setMessages(messages);
        this.replyCount = messages.length;
        break;
      }
      case enums.THREAD_PARENT_MESSAGE_UPDATED: {
        // console.log("messageThread --> updating thread parent ");
        this.parentMessage = messages;
        break;
      }
      case enums.MESSAGE_COMPOSED: {
        this.appendMessage(messages);
        this.replyCount = this.replyCount + messages.length;

        this.actionGenerated.emit({
          type: enums.CHANGE_THREAD_PARENT_MESSAGE_REPLY_COUNT,
          payLoad: this.replyCount,
        });
        break;
      }
      case enums.MESSAGE_UPDATED: {
        this.updateMessages(messages);
        break;
      }

      case enums.CUSTOM_MESSAGE_RECEIVE:
      case enums.MESSAGE_RECEIVED: {
        const message = messages[0];
        if (message.parentMessageId === this.parentMessage.id) {
          // const replyCount = this.state.replyCount + 1;
          this.smartReplyPreview(messages);
          this.replyCount = this.replyCount + messages.length;
          this.appendMessage(messages);
          this.actionGenerated.emit({
            type: enums.CHANGE_THREAD_PARENT_MESSAGE_REPLY_COUNT,
            payLoad: this.replyCount,
          });
        }
        break;
      }
      case enums.OLDER_MESSAGES_FETCHED: {
        this.reachedTopOfConversation = false;

        //No Need for below actions if there is nothing to prepend
        if (messages.length == 0) break;

        let prevScrollHeight = this.chatWindow.nativeElement.scrollHeight;

        this.prependMessages(messages);

        setTimeout(() => {
          this.scrollVariable =
            this.chatWindow.nativeElement.scrollHeight - prevScrollHeight;
        }, 1);

        break;
      }
      case enums.EDIT_MESSAGE: {
        this.editMessage(messages);
        break;
      }
      case enums.MESSAGE_EDIT: {
        this.messageEdited(messages);
        break;
      }
      case enums.DELETE_MESSAGE: {
        this.deleteMessage(messages);
        break;
      }
      case enums.MESSAGE_DELETE:
        this.removeMessages(messages);
        break;
      case enums.VIEW_ACTUAL_IMAGE: {
        this.actionGenerated.emit({
          type: enums.VIEW_ACTUAL_IMAGE,
          payLoad: messages,
        });
        break;
      }
      case enums.CLOSE_FULL_SCREEN_IMAGE: {
        this.actionGenerated.emit({
          type: enums.VIEW_ACTUAL_IMAGE,
          payLoad: null,
        });
        break;
      }
      case enums.REACT_TO_MESSAGE:
        this.reactToMessage(messages);
        break;
    }
  }

  /**
   * Action is Generated to inform UserListScreen to close the thread window
   * @param
   */
  closeThread() {
    this.actionGenerated.emit({
      type: enums.CLOSE_THREAD_CLICKED,
      payLoad: null,
    });
  }

  /**
   * set Messages Directly , coz new conversation is opened , hence no need to prepend or append
   * @param Any messages
   */
  setMessages(messages) {
    this.messageList = [...messages];

    this.scrollToBottomOfChatWindow();
  }

  /**
   * append Messages that are sent
   * @param Any messages
   */
  appendMessage = (messages) => {
    let dummy = [...this.messageList];

    this.messageList = [...dummy, ...messages];

    this.scrollToBottomOfChatWindow();
  };

  /**
   * prepend Fetched Messages
   * @param Any messages
   */
  prependMessages(messages) {
    this.messageList = [...messages, ...this.messageList];
  }

  /**
   * update status of message ie. read or deliv
   * @param Any messages
   */
  updateMessages = (messages) => {
    // let dummy = [...this.messageList];

    this.messageList = [...messages];
    //this.scrollToBottomOfChatWindow();
  };

  /**
   * Sets The message to be edited to pass it to the message composer
   * @param Any messages
   */
  editMessage(messages) {
    this.messageToBeEdited = messages;
  }

  /**
   * Render The Message List after Message has been successfullly edited
   * @param Any message
   */
  messageEdited(message) {
    const messageList = [...this.messageList];
    let messageKey = messageList.findIndex((m) => m.id === message.id);
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];

      const newMessageObj = Object.assign({}, messageObj, message);

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        this.actionGenerated.emit({
          type: enums.MESSAGE_EDIT,
          payLoad: [newMessageObj],
        });
      }
    }
  }

  /**
   * Delete the message
   * @param Any message
   */
  deleteMessage = (message) => {
    const messageId = message.id;
    CometChat.deleteMessage(messageId)
      .then((deletedMessage) => {
        this.removeMessages([deletedMessage]);

        const messageList = [...this.messageList];
        let messageKey = messageList.findIndex((m) => m.id === message.id);

        if (messageList.length - messageKey === 1 && !message.replyCount) {
          this.actionGenerated.emit({
            type: enums.MESSAGE_DELETE,
            payLoad: [deletedMessage],
          });
        }
      })
      .catch((error) => {
        console.log("Message delete failed with error:", error);
      });
  };

  /**
   * If the message gets deleted successfull , remove the deleted message in frontend using this function
   * @param Any messages
   */
  removeMessages = (messages) => {
    const deletedMessage = messages[0];
    const messagelist = [...this.messageList];

    let messageKey = messagelist.findIndex(
      (message) => message.id === deletedMessage.id
    );
    if (messageKey > -1) {
      let messageObj = { ...messagelist[messageKey] };
      let newMessageObj = Object.assign({}, messageObj, deletedMessage);

      messagelist.splice(messageKey, 1, newMessageObj);
      this.messageList = [...messagelist];
    }
  };

  smartReplyPreview(messages) {
    const message = messages[0];

    if (message.hasOwnProperty("metadata")) {
      const metadata = message.metadata;
      if (metadata.hasOwnProperty("@injected")) {
        const injectedObject = metadata["@injected"];
        if (injectedObject.hasOwnProperty("extensions")) {
          const extensionsObject = injectedObject["extensions"];
          if (extensionsObject.hasOwnProperty("smart-reply")) {
            const smartReply = extensionsObject["smart-reply"];
            if (smartReply.hasOwnProperty("error") === false) {
              this.replyPreview = message;
            } else {
              this, (this.replyPreview = null);
            }
          }
        }
      }
    }
  }

  /**
   * Opens the clicked Image in full screen mode
   * @param Any message
   */
  toggleImageView(message) {
    this.imageView = message;
    this.fullScreenViewImage = !this.fullScreenViewImage;
  }

  handleScroll(e) {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
      Math.round(e.currentTarget.clientHeight);

    const top = e.currentTarget.scrollTop === 0;

    if (top) {
      this.reachedTopOfConversation = top;
    }
  }

  /**
   * Sets the text for Reply Count
   * @param
   */
  getReplyCountText(replyCount) {
    if (replyCount === 1) {
      return replyCount + " reply";
    } else if (replyCount > 1) {
      return replyCount + " replies";
    }
  }

  scrollToBottomOfChatWindow() {
    setTimeout(() => {
      this.scrollVariable =
        this.chatWindow.nativeElement.scrollHeight -
        this.chatWindow.nativeElement.clientHeight;
    }, 1);
  }

  reactToMessage(message) {
    this.messageToReact = message;
  }
}
