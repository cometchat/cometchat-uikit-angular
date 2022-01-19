import { Component, Input, OnInit } from "@angular/core";
import { getSentAtTime } from "../../../../utils/common";
import { logger } from "../../../../utils/common";
import { CometChat } from "@cometchat-pro/chat";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
@Component({
  selector: "cometchat-delete-message-bubble",
  templateUrl: "./cometchat-delete-message-bubble.component.html",
  styleUrls: ["./cometchat-delete-message-bubble.component.css"],
})
export class CometChatDeleteMessageBubbleComponent implements OnInit {
  @Input() messageDetails:any = null;

  @Input() loggedInUser:any = null;

  loggedInUserDeletedThisMessage: boolean = false;

  time: any;

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;
  THIS_MESSAGE_DELETED: String = COMETCHAT_CONSTANTS.THIS_MESSAGE_DELETED;
  YOU_DELETED_THIS_MESSAGE: String =
    COMETCHAT_CONSTANTS.YOU_DELETED_THIS_MESSAGE;

  constructor() {}

  ngOnInit() {
    try {
      if (this.messageDetails.deletedBy === this.loggedInUser.uid) {
        this.loggedInUserDeletedThisMessage = true;
      }
      this.time = getSentAtTime(this.messageDetails);
    } catch (error) {
      logger(error);
    }
  }
}
