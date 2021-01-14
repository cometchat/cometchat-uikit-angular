import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { CometChatManager } from "../../../utils/controller";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-shared-media",
  templateUrl: "./cometchat-shared-media.component.html",
  styleUrls: ["./cometchat-shared-media.component.css"],
})
export class CometChatSharedMediaComponent implements OnInit {
  @ViewChild("mediaContainer", { static: false }) mediaWindow: ElementRef;

  @Input() type = null;
  @Input() item = null;

  //Sets type of media message to be fetched
  messageType: string = "image";
  //To get all the media message that user requests
  messageList = [];

  displaySharedMedia: any;
  messageContainer;
  mediaMessageListenerId = "messages_" + new Date().getTime();
  mediaMessageRequest = null;
  loggedInUser;

  //If No speciifc type of media message is sent/received
  checkMediaMessage: boolean = false;
  displayMessage: string;

  scrollVariable = 0;
  scrolltoBottom: boolean;

  imageClick: boolean = true;
  videoClick: boolean = false;
  docsClick: boolean = false;

  SHARED_MEDIA: String = STRING_MESSAGES.SHARED_MEDIA;
  PHOTOS: String = STRING_MESSAGES.PHOTOS;
  VIDEOS: String = STRING_MESSAGES.VIDEOS;
  DOCUMENT: String = STRING_MESSAGES.DOCUMENT;

  constructor() {}

  ngOnInit() {
    this.displaySharedMedia = this.mediaMessageRequestBuilder(
      this.item,
      this.type,
      this.messageType
    );
    this.getMessages(true);
    this.addMediaMessageEventListeners(this.messageUpdated);
  }

  /**
   * Removing Listeners
   */
  ngOnDestroy() {
    CometChat.removeMessageListener(this.mediaMessageListenerId);
  }
  /**
   * Builds the user request
   */
  mediaMessageRequestBuilder(item, type, messageType) {
    if (type === "user") {
      this.mediaMessageRequest = new CometChat.MessagesRequestBuilder()
        .setUID(item.uid)
        .setLimit(10)
        .setCategory("message")
        .setType(messageType)
        .build();
    } else {
      this.mediaMessageRequest = new CometChat.MessagesRequestBuilder()
        .setGUID(item.guid)
        .setLimit(10)
        .setCategory("message")
        .setType(messageType)
        .build();
    }
  }

  /**
   * Listener To Receive Media Messages in Real Time
   *  @param
   */
  addMediaMessageEventListeners(callback) {
    CometChat.addMessageListener(
      this.mediaMessageListenerId,
      new CometChat.MessageListener({
        onMediaMessageReceived: (mediaMessage) => {
          callback(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage);
        },
        onMessageDeleted: (deletedMessage) => {
          callback(enums.MESSAGE_DELETED, deletedMessage);
        },
      })
    );
  }

  /**
   * CallBack for listeners
   */
  messageUpdated(key, message) {
    switch (key) {
      case enums.MESSAGE_DELETED:
        this.messageDeleted(message);
        break;
      case enums.MEDIA_MESSAGE_RECEIVED:
        this.messageReceived(message);
        break;
      default:
        break;
    }
  }

  /**
   * If User Deletes Message
   * @param
   */
  messageDeleted(deletedMessage) {
    const messageType = deletedMessage.data.type;
    if (
      this.type === "group" &&
      deletedMessage.getReceiverType() === "group" &&
      deletedMessage.getReceiver().guid === this.item.guid &&
      messageType === this.messageType
    ) {
      const messageList = [...this.messageList];
      const filteredMessages = messageList.filter(
        (message) => message.id !== deletedMessage.id
      );
      this.messageList = filteredMessages;
      this.scrolltoBottom = false;
    }
  }
  /**
   * When a message is recieved
   * @param
   */
  messageReceived(message) {
    const messageType = message.data.type;
    if (
      this.type === "group" &&
      message.getReceiverType() === "group" &&
      message.getReceiver().guid === this.item.guid &&
      messageType === this.messageType
    ) {
      let messages = [...this.messageList];
      messages = messages.concat(message);
      this.messageList = messages;
      this.scrolltoBottom = true;
    }
  }

  /**
   *   Gets the Media Message that are displayed
   * @param
   */
  getMessages(scrollToBottom = false) {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;

        this.fetchPreviousMessages()
          .then((messages) => {
            const messageList = [...messages, ...this.messageList];

            if (messageList.length === 0) {
              this.checkMediaMessage = true;
              this.displayMessage = STRING_MESSAGES.NO_RECORDS_FOUND;
            }
            if (scrollToBottom) {
              this.messageList = messageList;
              this.scrollToBottom();
            } else {
              //No Need for below actions if there is nothing to prepend
              if (messages.length !== 0) {
                let prevScrollHeight = this.mediaWindow.nativeElement
                  .scrollHeight;

                this.messageList = messageList;

                // this.prependMessages(messages);

                setTimeout(() => {
                  this.scrollVariable =
                    this.mediaWindow.nativeElement.scrollTop +
                    this.mediaWindow.nativeElement.scrollHeight -
                    prevScrollHeight;
                });
              }
            }
          })
          .catch((error) => {
            //TODO Handle the erros in contact list.
            console.error(
              "[SharedMediaView] getMessages fetchPrevious error",
              error
            );
          });
      })
      .catch((error) => {
        console.log(
          "[SharedMediaView] getMessages getLoggedInUser error",
          error
        );
      });
  }

  /**
   * Fetches All the previous Messages
   */
  fetchPreviousMessages() {
    return this.mediaMessageRequest.fetchPrevious();
  }

  /**
   * Scrolls to Bottom of Chat Window
   */
  scrollToBottom() {
    setTimeout(() => {
      this.scrollVariable =
        this.mediaWindow.nativeElement.scrollHeight -
        this.mediaWindow.nativeElement.clientHeight;
    });
  }

  /**
   * Handles the scroll
   * @param
   */
  handleScroll(e) {
    const top = Math.round(e.currentTarget.scrollTop) === 0;
    if (top && this.messageList.length) {
      this.getMessages();
    }
  }

  /**
   * Sets the type of message i.e image,video or file
   * @param
   */
  mediaClickHandler(type) {
    if (type === "image") {
      this.imageClick = true;
      this.videoClick = false;
      this.docsClick = false;
    } else if (type === "video") {
      this.imageClick = false;
      this.videoClick = true;
      this.docsClick = false;
    } else if (type === "file") {
      this.imageClick = false;
      this.videoClick = false;
      this.docsClick = true;
    }

    this.checkMediaMessage = false;
    this.messageList = [];
    this.messageType = type;
    this.displaySharedMedia = this.mediaMessageRequestBuilder(
      this.item,
      this.type,
      this.messageType
    );
    this.getMessages(true);
  }
}
