import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";
import { CometChat } from "@cometchat-pro/chat";

@Component({
  selector: "cometchat-receiver-audio-message-bubble",
  templateUrl: "./cometchat-receiver-audio-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-audio-message-bubble.component.css"],
})
export class CometChatReceiverAudioMessageBubbleComponent implements OnInit {
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  audioUrl: string = '';
  avatar = null;
  name: string = '';
  avatarIfGroup: boolean = false;

  checkReaction = [];

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;

  constructor() {}

  ngOnInit() {
    try {
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );

      /**
       *  If Group then displays Avatar And Name
       */
      if (this.messageDetails.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
        this.avatarIfGroup = true;
        if (!this.messageDetails.sender.avatar) {
          const uid = this.messageDetails.sender.getUid();
          const char = this.messageDetails.sender
            .getName()
            .charAt(0)
            .toUpperCase();
        }
        this.name = this.messageDetails.sender.name;
        this.avatar = this.messageDetails.sender.avatar;
      }
      this.getUrl();
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
