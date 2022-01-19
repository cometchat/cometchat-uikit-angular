import { Component, Input, OnInit } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-action-message-bubble",
  templateUrl: "./cometchat-action-message-bubble.component.html",
  styleUrls: ["./cometchat-action-message-bubble.component.css"],
})
export class CometChatActionMessageBubbleComponent implements OnInit {
  @Input() messageDetails = null;
  @Input() loggedInUserUid: any;
  message: any;
  constructor() {}

  ngOnInit() {
    try {
      this.getMessage();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets the Call Messages
   */
  getMessage() {
    try {
      const call: any = this.messageDetails;
      switch (call.status) {
        case CometChat.CALL_STATUS.INITIATED: {
          this.message = COMETCHAT_CONSTANTS.CALL_INITIATED;
          if (call.type === CometChat.CALL_TYPE.AUDIO) {
            if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
              this.message =
                call.callInitiator.uid === this.loggedInUserUid
                  ? COMETCHAT_CONSTANTS.OUTGOING_AUDIO_CALL
                  : COMETCHAT_CONSTANTS.INCOMING_AUDIO_CALL;
            } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
              if (call.action === CometChat.CALL_STATUS.INITIATED) {
                this.message =
                  call.callInitiator.uid === this.loggedInUserUid
                    ? COMETCHAT_CONSTANTS.OUTGOING_AUDIO_CALL
                    : COMETCHAT_CONSTANTS.INCOMING_AUDIO_CALL;
              } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
                this.message =
                  call.sender.uid === this.loggedInUserUid
                    ? COMETCHAT_CONSTANTS.CALL_REJECTED
                    : `${call.sender.name} ` +
                      COMETCHAT_CONSTANTS.REJECTED_CALL;
              }
            }
          } else if (call.type === CometChat.CALL_TYPE.VIDEO) {
            if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
              this.message =
                call.callInitiator.uid === this.loggedInUserUid
                  ? COMETCHAT_CONSTANTS.OUTGOING_VIDEO_CALL
                  : COMETCHAT_CONSTANTS.INCOMING_VIDEO_CALL;
            } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
              if (call.action === CometChat.CALL_STATUS.INITIATED) {
                this.message =
                  call.callInitiator.uid === this.loggedInUserUid
                    ? COMETCHAT_CONSTANTS.OUTGOING_VIDEO_CALL
                    : COMETCHAT_CONSTANTS.INCOMING_VIDEO_CALL;
              } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
                this.message =
                  call.sender.uid === this.loggedInUserUid
                    ? COMETCHAT_CONSTANTS.CALL_REJECTED
                    : `${call.sender.name} ` +
                      COMETCHAT_CONSTANTS.REJECTED_CALL;
              }
            }
          }
          break;
        }
        case CometChat.CALL_STATUS.ONGOING: {
          if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
            this.message = COMETCHAT_CONSTANTS.CALL_ACCEPTED;
          } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
            if (call.action === CometChat.CALL_STATUS.ONGOING) {
              this.message =
                call.sender.uid === this.loggedInUserUid
                  ? COMETCHAT_CONSTANTS.CALL_ACCEPTED
                  : `${call.sender.name} ` + COMETCHAT_CONSTANTS.JOINED;
            } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
              this.message =
                call.sender.uid === this.loggedInUserUid
                  ? COMETCHAT_CONSTANTS.CALL_REJECTED
                  : `${call.sender.name} ` + COMETCHAT_CONSTANTS.REJECTED_CALL;
            } else if (call.action === enums.LEFT) {
              this.message =
                call.sender.uid === this.loggedInUserUid
                  ? COMETCHAT_CONSTANTS.YOU +
                    " " +
                    COMETCHAT_CONSTANTS.LEFT_THE_CALL
                  : `${call.sender.name} ` + COMETCHAT_CONSTANTS.LEFT_THE_CALL;
            }
          }

          break;
        }
        case CometChat.CALL_STATUS.UNANSWERED: {
          this.message = COMETCHAT_CONSTANTS.CALL_UNANSWERED;
          if (
            call.type === CometChat.CALL_TYPE.AUDIO &&
            (call.receiverType === CometChat.RECEIVER_TYPE.USER ||
              call.receiverType === CometChat.RECEIVER_TYPE.GROUP)
          ) {
            this.message =
              call.callInitiator.uid === this.loggedInUserUid
                ? COMETCHAT_CONSTANTS.UNANSWERED_AUDIO_CALL
                : COMETCHAT_CONSTANTS.MISSED_AUDIO_CALL;
          } else if (
            call.type === CometChat.CALL_TYPE.VIDEO &&
            (call.receiverType === CometChat.RECEIVER_TYPE.USER ||
              call.receiverType === CometChat.RECEIVER_TYPE.GROUP)
          ) {
            this.message =
              call.callInitiator.uid === this.loggedInUserUid
                ? COMETCHAT_CONSTANTS.UNANSWERED_VIDEO_CALL
                : COMETCHAT_CONSTANTS.MISSED_VIDEO_CALL;
          }
          break;
        }
        case CometChat.CALL_STATUS.REJECTED: {
          this.message = COMETCHAT_CONSTANTS.CALL_REJECTED;
          break;
        }
        case CometChat.CALL_STATUS.ENDED:
          this.message = COMETCHAT_CONSTANTS.CALL_ENDED;
          break;
        case CometChat.CALL_STATUS.CANCELLED:
          this.message = COMETCHAT_CONSTANTS.CALL_CANCELLED;
          break;
        case CometChat.CALL_STATUS.BUSY:
          this.message = COMETCHAT_CONSTANTS.CALL_BUSY;
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  }
}
