import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-threaded-message-reply-count",
  templateUrl: "./cometchat-threaded-message-reply-count.component.html",
  styleUrls: ["./cometchat-threaded-message-reply-count.component.css"],
})
export class CometChatThreadedMessageReplyCountComponent implements OnInit {
  @Input() messageDetails: any = null;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  replies = null;
  reply: string = '';
  constructor() {}

  ngOnInit() {
    try {
      let replyCount: any = this.getReplyCount();
      if (replyCount === 1) {
        this.reply = replyCount + " " + COMETCHAT_CONSTANTS.REPLY;
      } else if (replyCount > 1) {
        this.reply = replyCount + " " + COMETCHAT_CONSTANTS.REPLIES;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * get reply count for thread
   */
  getReplyCount() {
      if (this.messageDetails.hasOwnProperty(enums.REPLY_COUNT) === false) {
        this.replies = null;
      }

      this.replies = this.messageDetails.replyCount;
      return this.replies;
  }
  /**
   * Open thread when clicked
   */
  openThreadMessage() {
    try {
      this.actionGenerated.emit({
        type: enums.VIEW_MESSAGE_THREAD,
        payLoad: this.messageDetails,
      });
    } catch (error) {
      logger(error);
    }
  }
}
