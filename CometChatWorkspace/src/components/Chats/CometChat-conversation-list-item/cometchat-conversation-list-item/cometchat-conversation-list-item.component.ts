import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  EventEmitter,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-conversation-list-item",
  templateUrl: "./cometchat-conversation-list-item.component.html",
  styleUrls: ["./cometchat-conversation-list-item.component.css"],
})
export class CometChatConversationListItemComponent
  implements OnInit, OnChanges {
  @Input() conversationDetails: any = null;
  @Input() loggedInUser: any = null;
  @Output() onUserClick: EventEmitter<any> = new EventEmitter();

  @Output() onDeleteConversation: EventEmitter<any> = new EventEmitter();

  setAvatar: string = "";
  lastMessage: string = "";
  lastMessageTimestamp: string = "";
  lastMessageName: string = "";

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.CONVERSATION_DETAILS]) {
        if (
          change[enums.CONVERSATION_DETAILS].currentValue !==
          change[enums.CONVERSATION_DETAILS].previousValue
        ) {
          this.getLastMessage(change[enums.CONVERSATION_DETAILS].currentValue);
          this.getLastMessageTimestamp(
            change[enums.CONVERSATION_DETAILS].currentValue
          );
          this.getName(change[enums.CONVERSATION_DETAILS].currentValue);
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.getLastMessage(this.conversationDetails);
      this.getLastMessageTimestamp(this.conversationDetails);
      this.getName(this.conversationDetails);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets Avatar According to user type ie. user or group
   * @param
   */
  getAvatar(data: any) {
      if (data.conversationType === CometChat.RECEIVER_TYPE.USER) {
        this.setAvatar = data.conversationWith;
      } else if (data.conversationType === CometChat.RECEIVER_TYPE.GROUP) {
        this.setAvatar = data.conversationWith;
      }
      return this.setAvatar;
  }

  /**
   * Gets Name of Last Conversation User
   * @param
   */
  getName(data: any) {
      this.lastMessageName = data.conversationWith.name;
      return this.lastMessageName;
  }

  /**
   * Gets the Last Conversation with user
   * @param
   */
  getLastMessage(data: any) {
      if (data === null) {
        return false;
      }
      if (data.hasOwnProperty(enums.LAST_MESSAGE) === false) {
        return false;
      }
      let message = null;
      const lastMessage = data.lastMessage;

      if (lastMessage.hasOwnProperty(enums.DELETED_AT)) {
        message =
          this.loggedInUser.uid === lastMessage.sender.uid
            ? COMETCHAT_CONSTANTS.YOU_DELETED_THIS_MESSAGE
            : COMETCHAT_CONSTANTS.THIS_MESSAGE_DELETED;
      } else {
        switch (lastMessage.category) {
          case CometChat.CATEGORY_MESSAGE:
            message = this.getMessage(lastMessage);
            break;
          case CometChat.CATEGORY_CALL:
            message = this.getCallMessage(lastMessage);
            break;
          case CometChat.CATEGORY_ACTION:
            message = lastMessage.message;
            break;
          case CometChat.MESSAGE_TYPE.CUSTOM:
            message = this.getCustomMessage(lastMessage);
            break;
  
          default:
            break;
        }
      }
      this.lastMessage = message;
      return this.lastMessage;
  }

  /**
   * Gets Time when the last conversation was done
   * @param
   */
  getLastMessageTimestamp(data: any) {
      if (data === null) {
        return false;
      }

      if (data.hasOwnProperty(enums.LAST_MESSAGE) === false) {
        return false;
      }
      if (data.lastMessage.hasOwnProperty(enums.SENT_AT) === false) {
        return false;
      }
      let timestamp = null;

      const messageTimestamp: any = new Date(data.lastMessage.sentAt * 1000);
      const currentTimestamp = Date.now();
      const diffTimestamp = currentTimestamp - messageTimestamp;
      if (diffTimestamp < 24 * 60 * 60 * 1000) {
        timestamp = messageTimestamp.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
      } else if (diffTimestamp < 48 * 60 * 60 * 1000) {
        timestamp = COMETCHAT_CONSTANTS.YESTERDAY;
      } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
        timestamp = messageTimestamp.toLocaleString("en-US", {
          weekday: "long",
        });
      } else {
        timestamp = messageTimestamp.toLocaleDateString("en-US", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        });
      }
      this.lastMessageTimestamp = timestamp;
      return this.lastMessageTimestamp;
  }

  /**
   * Gets the MessageType i.e if text then display text else displays image,video,etc
   * @param
   */
  getMessage(lastMessage: any) {
    try {
      let message = null;
      switch (lastMessage.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          message = lastMessage.text;
          break;
          
        case CometChat.MESSAGE_TYPE.MEDIA:
          message = COMETCHAT_CONSTANTS.MEDIA_MESSAGE;
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          message = COMETCHAT_CONSTANTS.MESSAGE_IMAGE;
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          message = COMETCHAT_CONSTANTS.MESSAGE_FILE;
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          message = COMETCHAT_CONSTANTS.MESSAGE_VIDEO;
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          message = COMETCHAT_CONSTANTS.MESSAGE_AUDIO;
          break;
        case CometChat.MESSAGE_TYPE.CUSTOM:
          message = COMETCHAT_CONSTANTS.CUSTOM_MESSAGE;
          break;
        default:
          break;
      }
      return message;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Displays if lastMessage was Video or Audio Call
   * @param
   */
  getCallMessage(lastMessage: any) {
      let message = null;
      switch (lastMessage.type) {
        case CometChat.MESSAGE_TYPE.VIDEO:
          message = COMETCHAT_CONSTANTS.VIDEO_CALL;
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          message = COMETCHAT_CONSTANTS.AUDIO_CALL;
          break;
        default:
          break;
      }

      return message;
  }

  /**
   * Displays lastMessage was Custom Message i.e Poll or Sticker
   * @param
   */
  getCustomMessage = (lastMessage: any) => {
      let message = null;
      switch (lastMessage.type) {
        case enums.CUSTOM_TYPE_POLL:
          message = COMETCHAT_CONSTANTS.CUSTOM_MESSAGE_POLL;
          break;
        case enums.CUSTOM_TYPE_STICKER:
          message = COMETCHAT_CONSTANTS.CUSTOM_MESSAGE_STICKER;
          break;
          case enums.CALL_TYPE_DIRECT:
            message = COMETCHAT_CONSTANTS.VIDEO_CALL;
            break;
        default:
          break;
      }

      return message;
  };

  /**
   * Emitting the user clicked so that it can be used in the parent component
   * @param Any userToEmit
   */
  onUserClicked(userToEmit: object) {
    try {
      this.onUserClick.emit(userToEmit);
    } catch (error) {
      logger(error);
    }
  }

  /*
   * Emitting the conversation to delete to the cometchat-conversation-list component
   */
  deleteConversation(conversation: object) { 
    this.onDeleteConversation.emit(conversation); 
  }
}
