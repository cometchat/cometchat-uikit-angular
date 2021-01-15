import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../utils/common";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-receiver-video-message-bubble",
  templateUrl: "./cometchat-receiver-video-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-video-message-bubble.component.css"],
})
export class CometChatReceiverVideoMessageBubbleComponent implements OnInit {
  @Input() MessageDetails = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  //Sets the User Avatar if group
  avatar = null;
  //Sets Username of Avatar
  name: string = null;

  videoUrl: string;

  checkReaction: boolean = false;

  //if group then only show avatar
  avatarIfGroup: boolean = false;

  message = Object.assign({}, this.MessageDetails, { messageFrom: "receiver" });

  constructor() {}

  ngOnInit() {
    this.checkReaction = checkMessageForExtensionsData(
      this.MessageDetails,
      STRING_MESSAGES.REACTIONS
    );

    /**
     *  If Group then displays Avatar And Name
     */
    if (this.MessageDetails.receiverType === "group") {
      this.avatarIfGroup = true;
      if (!this.MessageDetails.sender.avatar) {
        const uid = this.MessageDetails.sender.getUid();
        const char = this.MessageDetails.sender.getName().charAt(0);
      }
      this.name = this.MessageDetails.sender.name;
      this.avatar = this.MessageDetails.sender.avatar;
    }
    this.getUrl();
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
