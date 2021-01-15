import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../utils/common";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-receiver-file-message-bubble",
  templateUrl: "./cometchat-receiver-file-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-file-message-bubble.component.css"],
})
export class CometChatReceiverFileMessageBubbleComponent implements OnInit {
  @Input() MessageDetails = null;
  name: string;
  url: string;
  avatar = null;
  //Sets Username of Avatar
  avatarName: string = null;
  //If Group then only show avatar
  avatarIfGroup: boolean = false;
  checkReaction: boolean = false;

  @Input() showReplyCount = true;

  @Input() showToolTip = true;
  @Input() loggedInUser;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  constructor() {}

  ngOnInit() {
    this.checkReaction = checkMessageForExtensionsData(
      this.MessageDetails,
      STRING_MESSAGES.REACTIONS
    );

    //If Group then displays Avatar And Name
    if (this.MessageDetails.receiverType === "group") {
      this.avatarIfGroup = true;
      if (!this.MessageDetails.sender.avatar) {
        const uid = this.MessageDetails.sender.getUid();
        const char = this.MessageDetails.sender
          .getName()
          .charAt(0)
          .toUpperCase();
      }
      this.avatarName = this.MessageDetails.sender.name;
      this.avatar = this.MessageDetails.sender.avatar;
    }
    //Gets File name and file url
    this.name = this.MessageDetails.data.attachments[0].name;
    this.url = this.MessageDetails.data.attachments[0].url;
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    this.actionGenerated.emit(action);
  }
}
