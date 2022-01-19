import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";
import { CometChat } from "@cometchat-pro/chat";

@Component({
  selector: "cometchat-sender-audio-message-bubble",
  templateUrl: "./cometchat-sender-audio-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-audio-message-bubble.component.css"],
})
export class CometChatSenderAudioMessageBubbleComponent implements OnInit {
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;

  checkReaction = [];

  audioUrl: string = '';
  message = Object.assign({}, this.messageDetails, {
    messageFrom: enums.SENDER,
  });
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;

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
   * Gets the url of audio to be displayed
   */
  getUrl() {
    try {
      this.audioUrl = this.messageDetails.data.url;
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
