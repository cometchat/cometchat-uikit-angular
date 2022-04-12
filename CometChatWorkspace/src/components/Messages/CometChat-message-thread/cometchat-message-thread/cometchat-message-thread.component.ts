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
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-message-thread",
  templateUrl: "./cometchat-message-thread.component.html",
  styleUrls: ["./cometchat-message-thread.component.css"],
})
export class CometChatMessageThreadComponent implements OnInit, OnChanges {
  @ViewChild("messageWindow", { static: false }) chatWindow!: ElementRef;

  @Input() item: any = null;
  @Input() type: string = '';
  @Input() parentMessage: any = null;
  @Input() loggedInUser: any = null;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  messageList: any = [];
  replyCount: number = 0;
  reachedTopOfConversation = false;
  scrollVariable = 0;
  messageToBeEdited = null;
  replyPreview = null;
  imageView = null;
  fullScreenViewImage: boolean = false;
  typeOfMessage: String = "";

  messageToReact = null;
  THREAD: String = COMETCHAT_CONSTANTS.THREAD;

  MESSAGE_TYPE_TEXT: String = CometChat.MESSAGE_TYPE.TEXT;
  MESSAGE_TYPE_IMAGE: String = CometChat.MESSAGE_TYPE.IMAGE;
  MESSAGE_TYPE_VIDEO: String = CometChat.MESSAGE_TYPE.VIDEO;
  MESSAGE_TYPE_AUDIO: String = CometChat.MESSAGE_TYPE.AUDIO;
  MESSAGE_TYPE_FILE: String = CometChat.MESSAGE_TYPE.FILE;
  MESSAGE_TYPE_CUSTOM: String = CometChat.MESSAGE_TYPE.CUSTOM;
  CALL_TYPE_AUDIO: String = CometChat.CALL_TYPE.AUDIO;
  CALL_TYPE_VIDEO: String = CometChat.CALL_TYPE.VIDEO;
  CATEGORY_MESSAGE: String = CometChat.CATEGORY_MESSAGE;
  CATEGORY_ACTION: String = CometChat.CATEGORY_ACTION;
  CATEGORY_CALL: String = CometChat.CATEGORY_CALL;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.PARENT_MESSAGE]) {
        if (
          change[enums.PARENT_MESSAGE].previousValue &&
          change[enums.PARENT_MESSAGE].previousValue.id !==
            change[enums.PARENT_MESSAGE].currentValue.id
        ) {
          let type = change[enums.PARENT_MESSAGE].currentValue.type;

          this.typeOfMessage = "";

          setTimeout(() => {
            this.typeOfMessage = type;
          }, 200);

          this.messageList = [];
        }

        this.scrollToBottomOfChatWindow();
        if (
          change[enums.PARENT_MESSAGE].currentValue.hasOwnProperty(
            enums.REPLY_COUNT
          )
        ) {
          this.replyCount = this.parentMessage.replyCount;
        } else {
          this.replyCount = 0;
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.typeOfMessage = this.parentMessage.type;

      if (this.parentMessage.hasOwnProperty(enums.REPLY_COUNT)) {
        this.replyCount = this.parentMessage.replyCount;
      }

      let user = CometChat.getLoggedinUser().then((user) => {
        this.loggedInUser = user;
      });
    } catch (error) {
      logger(error);
    }
  }
   // update message receipt on message sent
   messageSent(messages:any) {
    const message = messages[0];
		const messageList = [...this.messageList];

		let messageKey = messageList.findIndex(m => m._id === message._id);
		if (messageKey > -1) {
			const newMessageObj = { ...message };
			messageList.splice(messageKey, 1, newMessageObj);
			messageList.sort((a, b) => a.id - b.id);
		}
    this.messageList = messageList;
		this.scrollToBottomOfChatWindow();
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    try {
      let messages = action.payLoad;

      switch (action.type) {
        case enums.NEW_CONVERSATION_OPENED: {
          this.setMessages(messages);
          this.replyCount = messages.length;
          break;
        }
        case enums.THREAD_PARENT_MESSAGE_UPDATED: {
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
        case enums.MESSAGE_SENT: {
          this.messageSent(messages);
          break;
        }

        case enums.CUSTOM_MESSAGE_RECEIVE:
        case enums.MESSAGE_RECEIVED: {
          const message = messages[0];
          if (message.parentMessageId === this.parentMessage.id) {
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Action is Generated to inform UserListScreen to close the thread window
   * @param
   */
  closeThread() {
    try {
      this.actionGenerated.emit({
        type: enums.CLOSE_THREAD_CLICKED,
        payLoad: null,
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * set Messages Directly , coz new conversation is opened , hence no need to prepend or append
   * @param Any messages
   */
  setMessages(messages: any) {
    try {
      this.messageList = [...messages];

      this.scrollToBottomOfChatWindow();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * append Messages that are sent
   * @param Any messages
   */
  appendMessage = (messages: any) => {
    try {
      let dummy = [...this.messageList];

      this.messageList = [...dummy, ...messages];

      this.scrollToBottomOfChatWindow();
    } catch (error) {
      logger(error);
    }
  };

  /**
   * prepend Fetched Messages
   * @param Any messages
   */
  prependMessages(messages: any) {
    try {
      this.messageList = [...messages, ...this.messageList];
    } catch (error) {
      logger(error);
    }
  }

  /**
   * update status of message ie. read or deliv
   * @param Any messages
   */
  updateMessages = (messages: any) => {
    try {
      this.messageList = [...messages];
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Sets The message to be edited to pass it to the message composer
   * @param Any messages
   */
  editMessage(messages: any) {
    try {
      this.messageToBeEdited = messages;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Render The Message List after Message has been successfullly edited
   * @param Any message
   */
  messageEdited(message: any) {
    try {
      const messageList = [...this.messageList];
      let messageKey = messageList.findIndex((m: any) => m.id === message.id);
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Delete the message
   * @param Any message
   */
  deleteMessage = (message: any) => {
    try {
      const messageId = message.id;
      CometChat.deleteMessage(messageId)
        .then((deletedMessage) => {
          this.removeMessages([deletedMessage]);

          const messageList = [...this.messageList];
          let messageKey = messageList.findIndex((m: any) => m.id === message.id);

          if (messageList.length - messageKey === 1 && !message.replyCount) {
            this.actionGenerated.emit({
              type: enums.MESSAGE_DELETE,
              payLoad: [deletedMessage],
            });
          }
        })
        .catch((error) => {
          logger("Message delete failed with error:", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * If the message gets deleted successfull , remove the deleted message in frontend using this function
   * @param Any messages
   */
  removeMessages = (messages: any) => {
    try {
      const deletedMessage = messages[0];
      const messagelist = [...this.messageList];

      let messageKey = messagelist.findIndex(
        (message: any) => message.id === deletedMessage.id
      );
      if (messageKey > -1) {
        let messageObj = { ...messagelist[messageKey] as {} };
        let newMessageObj = Object.assign({}, messageObj, deletedMessage);

        messagelist.splice(messageKey, 1, newMessageObj);
        this.messageList = [...messagelist];
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Checks smartReplyPreview Extension
   * @param messages
   */
  smartReplyPreview(messages: any) {
    try {
      const message = messages[0];

      if (message.hasOwnProperty(enums.METADATA)) {
        const metadata = message[enums.METADATA];
        if (metadata.hasOwnProperty(enums.INJECTED)) {
          const injectedObject = metadata[enums.INJECTED];
          if (injectedObject.hasOwnProperty(enums.EXTENSIONS)) {
            const extensionsObject = injectedObject[enums.EXTENSIONS];
            if (extensionsObject.hasOwnProperty(enums.SMART_REPLY)) {
              const smartReply = extensionsObject[enums.SMART_REPLY];
              if (smartReply.hasOwnProperty(enums.ERROR) === false) {
                this.replyPreview = message;
              } else {
                this, (this.replyPreview = null);
              }
            }
          }
        }
      }
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
   * Handles Scroll of window
   * @param e
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);

      const top = e.currentTarget.scrollTop === 0;

      if (top) {
        this.reachedTopOfConversation = top;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets the text for Reply Count
   * @param
   */
  getReplyCountText(replyCount: any): string {
    try {
      if (replyCount === 1) {
        return replyCount + " " + COMETCHAT_CONSTANTS.REPLY;
      } else if (replyCount > 1) {
        return replyCount + " " + COMETCHAT_CONSTANTS.REPLIES;
      }
    } catch (error) {
      logger(error);
    }
    return '';
  }

  /**
   * Scrolls to bottom of chat window
   */
  scrollToBottomOfChatWindow() {
    try {
      setTimeout(() => {
        this.scrollVariable =
          this.chatWindow.nativeElement.scrollHeight -
          this.chatWindow.nativeElement.clientHeight;
      }, 1);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets reaction to message
   * @param message
   */
  reactToMessage(message: any) {
    try {
      this.messageToReact = message;
    } catch (error) {
      logger(error);
    }
  }
}
