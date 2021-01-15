import { Component, Input, OnInit } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-action-message-bubble",
  templateUrl: "./cometchat-action-message-bubble.component.html",
  styleUrls: ["./cometchat-action-message-bubble.component.css"],
})
export class CometChatActionMessageBubbleComponent implements OnInit {
  @Input() MessageDetails = null;
  @Input() loggedInUserUid;
  message;
  constructor() {}

  ngOnInit() {
    this.getMessage();
  }

  getMessage() {
    const call = this.MessageDetails;
    switch (call.status) {
      case CometChat.CALL_STATUS.INITIATED: {
        this.message = STRING_MESSAGES.CALL_INITIATED;
        if (call.type === "audio") {
          if (call.receiverType === "user") {
            this.message =
              call.callInitiator.uid === this.loggedInUserUid
                ? STRING_MESSAGES.OUTGOING_AUDIO_CALL
                : STRING_MESSAGES.INCOMING_AUDIO_CALL;
          } else if (call.receiverType === "group") {
            if (call.action === CometChat.CALL_STATUS.INITIATED) {
              this.message =
                call.callInitiator.uid === this.loggedInUserUid
                  ? STRING_MESSAGES.OUTGOING_AUDIO_CALL
                  : STRING_MESSAGES.INCOMING_AUDIO_CALL;
            } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
              this.message =
                call.sender.uid === this.loggedInUserUid
                  ? STRING_MESSAGES.CALL_REJECTED
                  : `${call.sender.name} ` + STRING_MESSAGES.REJECTED_CALL;
            }
          }
        } else if (call.type === "video") {
          if (call.receiverType === "user") {
            this.message =
              call.callInitiator.uid === this.loggedInUserUid
                ? STRING_MESSAGES.OUTGOING_VIDEO_CALL
                : STRING_MESSAGES.INCOMING_VIDEO_CALL;
          } else if (call.receiverType === "group") {
            if (call.action === CometChat.CALL_STATUS.INITIATED) {
              this.message =
                call.callInitiator.uid === this.loggedInUserUid
                  ? STRING_MESSAGES.OUTGOING_VIDEO_CALL
                  : STRING_MESSAGES.INCOMING_VIDEO_CALL;
            } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
              this.message =
                call.sender.uid === this.loggedInUserUid
                  ? STRING_MESSAGES.CALL_REJECTED
                  : `${call.sender.name} ` + STRING_MESSAGES.REJECTED_CALL;
            }
          }
        }
        break;
      }
      case CometChat.CALL_STATUS.ONGOING: {
        if (call.receiverType === "user") {
          this.message = STRING_MESSAGES.CALL_ACCEPTED;
        } else if (call.receiverType === "group") {
          if (call.action === CometChat.CALL_STATUS.ONGOING) {
            this.message =
              call.sender.uid === this.loggedInUserUid
                ? STRING_MESSAGES.CALL_ACCEPTED
                : `${call.sender.name} ` + STRING_MESSAGES.JOINED;
          } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
            this.message =
              call.sender.uid === this.loggedInUserUid
                ? STRING_MESSAGES.CALL_REJECTED
                : `${call.sender.name} ` + STRING_MESSAGES.REJECTED_CALL;
          } else if (call.action === "left") {
            this.message =
              call.sender.uid === this.loggedInUserUid
                ? "You " + STRING_MESSAGES.LEFT_THE_CALL
                : `${call.sender.name} ` + STRING_MESSAGES.LEFT_THE_CALL;
          }
        }

        break;
      }
      case CometChat.CALL_STATUS.UNANSWERED: {
        this.message = "Call unanswered";
        if (
          call.type === "audio" &&
          (call.receiverType === "user" || call.receiverType === "group")
        ) {
          this.message =
            call.callInitiator.uid === this.loggedInUserUid
              ? STRING_MESSAGES.UNANSWERED_AUDIO_CALL
              : "Missed audio call";
        } else if (
          call.type === "video" &&
          (call.receiverType === "user" || call.receiverType === "group")
        ) {
          this.message =
            call.callInitiator.uid === this.loggedInUserUid
              ? STRING_MESSAGES.UNANSWERED_VIDEO_CALL
              : "Missed video call";
        }
        break;
      }
      case CometChat.CALL_STATUS.REJECTED: {
        this.message = STRING_MESSAGES.CALL_REJECTED;
        break;
      }
      case CometChat.CALL_STATUS.ENDED:
        this.message = STRING_MESSAGES.CALL_ENDED;
        break;
      case CometChat.CALL_STATUS.CANCELLED:
        this.message = STRING_MESSAGES.CALL_CANCELLED;
        break;
      case CometChat.CALL_STATUS.BUSY:
        this.message = STRING_MESSAGES.CALL_BUSY;
        break;
      default:
        break;
    }
  }
}
