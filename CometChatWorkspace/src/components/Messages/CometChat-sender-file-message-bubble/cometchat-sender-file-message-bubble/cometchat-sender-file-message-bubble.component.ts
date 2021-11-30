import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../utils/common";
import * as enums from "../../../../utils/enums";

@Component({
  selector: "cometchat-sender-file-message-bubble",
  templateUrl: "./cometchat-sender-file-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-file-message-bubble.component.css"],
})
export class CometChatSenderFileMessageBubbleComponent implements OnInit {
  @Input() messageDetails = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser;
  checkReaction = [];

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  url: string;
  name: string;
  constructor() {}

  ngOnInit() {
    try {
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
      this.url = this.messageDetails.data.attachments[0].url;
      this.name = this.messageDetails.data.attachments[0].name;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    try {
      this.actionGenerated.emit(action);
    } catch (error) {
      logger(error);
    }
  }
}
