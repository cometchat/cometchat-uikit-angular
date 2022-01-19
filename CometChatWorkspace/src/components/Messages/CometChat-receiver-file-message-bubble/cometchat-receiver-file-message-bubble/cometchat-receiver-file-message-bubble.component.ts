import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";
import { CometChat } from "@cometchat-pro/chat";

@Component({
  selector: "cometchat-receiver-file-message-bubble",
  templateUrl: "./cometchat-receiver-file-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-file-message-bubble.component.css"],
})
export class CometChatReceiverFileMessageBubbleComponent implements OnInit {
  @Input() messageDetails: any = null;
  name: string = '';
  url: string = '';
  avatar = null;
  avatarName: string = '';
  avatarIfGroup: boolean = false;
  checkReaction = [];

  @Input() showReplyCount = true;

  @Input() showToolTip = true;
  @Input() loggedInUser: any;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;

  constructor() {}

  ngOnInit() {
    try {
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );

      //If Group then displays Avatar And Name
      if (this.messageDetails.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
        this.avatarIfGroup = true;
        if (!this.messageDetails.sender.avatar) {
          const uid = this.messageDetails.sender.getUid();
          const char = this.messageDetails.sender
            .getName()
            .charAt(0)
            .toUpperCase();
        }
        this.avatarName = this.messageDetails.sender.name;
        this.avatar = this.messageDetails.sender.avatar;
      }
      //Gets File name and file url
      this.name = this.messageDetails.data.attachments[0].name;
      this.url = this.messageDetails.data.attachments[0].url;
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
