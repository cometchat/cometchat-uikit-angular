import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../utils/common";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-sender-video-message-bubble",
  templateUrl: "./cometchat-sender-video-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-video-message-bubble.component.css"],
})
export class CometChatSenderVideoMessageBubbleComponent implements OnInit {
  @Input() MessageDetails = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  //Sets Video Url to be displayed
  videoUrl: string;
  messageFrom = "sender";

  message = Object.assign({}, this.MessageDetails, {
    messageFrom: this.messageFrom,
  });
  checkReaction: boolean = false;

  constructor() {}

  ngOnInit() {
    this.getUrl();
    this.checkReaction = checkMessageForExtensionsData(
      this.MessageDetails,
      STRING_MESSAGES.REACTIONS
    );
  }
  /**
   * Gets the url of video to be displayed
   */
  getUrl() {
    this.videoUrl = this.MessageDetails.data.url;
  }
  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    this.actionGenerated.emit(action);
  }
}
