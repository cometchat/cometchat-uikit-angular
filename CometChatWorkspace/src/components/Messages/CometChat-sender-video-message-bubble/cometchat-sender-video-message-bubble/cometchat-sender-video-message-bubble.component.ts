import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../utils/common";
import * as enums from "../../../../utils/enums";

@Component({
  selector: "cometchat-sender-video-message-bubble",
  templateUrl: "./cometchat-sender-video-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-video-message-bubble.component.css"],
})
export class CometChatSenderVideoMessageBubbleComponent implements OnInit {
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  //Sets Video Url to be displayed
  videoUrl: string = '';
  messageFrom = enums.SENDER;

  message = Object.assign({}, this.messageDetails, {
    messageFrom: this.messageFrom,
  });
  checkReaction = [];

  constructor() {}

  ngOnInit() {
    try {
      this.getUrl();
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Gets the url of video to be displayed
   */
  getUrl() {
    try {
      this.videoUrl = this.messageDetails.data.url;
    } catch (error) {
      logger(error);
    }
  }
  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    try {
      this.actionGenerated.emit(action);
    } catch (error) {
      logger(error);
    }
  }
}
