import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../utils/common";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-sender-file-message-bubble",
  templateUrl: "./cometchat-sender-file-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-file-message-bubble.component.css"],
})
export class CometChatSenderFileMessageBubbleComponent implements OnInit {
  @Input() MessageDetails = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser;
  checkReaction: boolean = false;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  url: string;
  name: string;
  constructor() {}

  ngOnInit() {
    this.checkReaction = checkMessageForExtensionsData(
      this.MessageDetails,
      STRING_MESSAGES.REACTIONS
    );
    this.url = this.MessageDetails.data.attachments[0].url;
    this.name = this.MessageDetails.data.attachments[0].name;
  }
  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    this.actionGenerated.emit(action);
  }
}
