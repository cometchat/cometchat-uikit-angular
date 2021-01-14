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
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-conversation-list-item",
  templateUrl: "./cometchat-conversation-list-item.component.html",
  styleUrls: ["./cometchat-conversation-list-item.component.css"],
})
export class CometChatConversationListItemComponent
  implements OnInit, OnChanges {
  @Input() ConversationDetails = null;
  @Input() loggedInUser = null;
  @Output() onUserClick: EventEmitter<any> = new EventEmitter();

  setAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  lastMessageName: string;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["ConversationDetails"]) {
      if (
        change["ConversationDetails"].currentValue !==
        change["ConversationDetails"].previousValue
      ) {
        this.getLastMessage(change["ConversationDetails"].currentValue);
        this.getLastMessageTimestamp(
          change["ConversationDetails"].currentValue
        );
        this.getName(change["ConversationDetails"].currentValue);
      }
    }
  }
  ngOnInit() {
    this.getLastMessage(this.ConversationDetails);
    this.getLastMessageTimestamp(this.ConversationDetails);
    this.getName(this.ConversationDetails);
  }

  /**
   * Sets Avatar According to user type ie. user or group
   * @param
   */
  getAvatar(data) {
    if (data.conversationType === "user") {
      this.setAvatar = data.conversationWith;
    } else if (data.conversationType === "group") {
      this.setAvatar = data.conversationWith;
    }
    return this.setAvatar;
  }

  /**
   * Gets Name of Last Conversation User
   * @param
   */
  getName(data) {
    this.lastMessageName = data.conversationWith.name;
    return this.lastMessageName;
  }

  /**
   * Gets the Last Conversation with user
   * @param
   */
  getLastMessage(data) {
    if (data === null) {
      return false;
    }
    if (data.hasOwnProperty("lastMessage") === false) {
      return false;
    }
    let message = null;
    const lastMessage = data.lastMessage;

    if (lastMessage.hasOwnProperty("deletedAt")) {
      message =
        this.loggedInUser.uid === lastMessage.sender.uid
          ? STRING_MESSAGES.YOU_DELETED_THIS_MESSAGE
          : STRING_MESSAGES.THIS_MESSAGE_DELETED;
    } else {
      switch (lastMessage.category) {
        case enums.MESSAGE:
          message = this.getMessage(lastMessage);
          break;
        case enums.CALL:
          message = this.getCallMessage(lastMessage);
          break;
        case enums.ACTION:
          message = lastMessage.message;
          break;
        case enums.CUSTOM:
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
  getLastMessageTimestamp(data) {
    if (data === null) {
      return false;
    }

    if (data.hasOwnProperty("lastMessage") === false) {
      return false;
    }
    if (data.lastMessage.hasOwnProperty("sentAt") === false) {
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
      timestamp = STRING_MESSAGES.YESTERDAY;
    } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
      timestamp = messageTimestamp.toLocaleString("en-US", { weekday: "long" });
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
  getMessage(lastMessage) {
    let message = null;
    switch (lastMessage.type) {
      case CometChat.MESSAGE_TYPE.TEXT:
        message = lastMessage.text;
        break;
      case CometChat.MESSAGE_TYPE.MEDIA:
        message = STRING_MESSAGES.MEDIA_MESSAGE;
        break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        message = STRING_MESSAGES.MESSAGE_IMAGE;
        break;
      case CometChat.MESSAGE_TYPE.FILE:
        message = STRING_MESSAGES.MESSAGE_FILE;
        break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        message = STRING_MESSAGES.MESSAGE_VIDEO;
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        message = STRING_MESSAGES.MESSAGE_AUDIO;
        break;
      case CometChat.MESSAGE_TYPE.CUSTOM:
        message = STRING_MESSAGES.CUSTOM_MESSAGE;
        break;
      default:
        break;
    }
    return message;
  }

  /**
   * Displays if lastMessage was Video or Audio Call
   * @param
   */
  getCallMessage(lastMessage) {
    let message = null;
    switch (lastMessage.type) {
      case CometChat.MESSAGE_TYPE.VIDEO:
        message = STRING_MESSAGES.VIDEO_CALL;
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        message = STRING_MESSAGES.AUDIO_CALL;
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
  getCustomMessage = (lastMessage) => {
    let message = null;
    switch (lastMessage.type) {
      case enums.CUSTOM_TYPE_POLL:
        message = STRING_MESSAGES.CUSTOM_MESSAGE_POLL;
        break;
      case enums.CUSTOM_TYPE_STICKER:
        message = STRING_MESSAGES.CUSTOM_MESSAGE_STICKER;
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
  onUserClicked(userToEmit) {
    this.onUserClick.emit(userToEmit);
  }
}
