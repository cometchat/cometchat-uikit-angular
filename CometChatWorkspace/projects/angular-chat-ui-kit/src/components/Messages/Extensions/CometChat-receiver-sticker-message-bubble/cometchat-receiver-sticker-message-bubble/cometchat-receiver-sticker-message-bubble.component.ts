import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import { STRING_MESSAGES } from "../../../../utils/messageConstants";

@Component({
  selector: "cometchat-receiver-sticker-message-bubble",
  templateUrl: "./cometchat-receiver-sticker-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-sticker-message-bubble.component.css"],
})
export class CometChatReceiverStickerMessageBubbleComponent
  implements OnInit, OnChanges {
  @Input() MessageDetails = null;
  @Input() showToolTip = true;
  @Input() loggedInUser;

  @Input() showReplyCount = true;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  avatar = null;
  //Sets Username of Avatar
  name: string = null;
  //If Group then only show avatar
  //If Group then only show avatar
  avatarIfGroup: boolean = false;

  stickerName: string;
  stickerUrl: string;

  checkReaction: boolean = false;

  messageFrom = "receiver";

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["MessageDetails"]) {
      if (
        change["MessageDetails"].previousValue !==
        change["MessageDetails"].currentValue
      ) {
        const message = Object.assign({}, this.MessageDetails, {
          messageFrom: this.messageFrom,
        });
        this.MessageDetails = message;
      }
    }
  }

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
        const char = this.MessageDetails.sender
          .getName()
          .charAt(0)
          .toUpperCase();
      }
      this.name = this.MessageDetails.sender.name;
      this.avatar = this.MessageDetails.sender.avatar;
    }
    this.getSticker();
  }

  /**
   * Get Sticker Details
   */
  getSticker() {
    let stickerData = null;
    if (
      this.MessageDetails.hasOwnProperty("data") &&
      this.MessageDetails.data.hasOwnProperty("customData")
    ) {
      stickerData = this.MessageDetails.data.customData;
      if (stickerData.hasOwnProperty("sticker_url")) {
        this.stickerName = stickerData.hasOwnProperty("sticker_name")
          ? stickerData.sticker_name
          : "Sticker";
        this.stickerUrl = stickerData.sticker_url;
      }
    }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    this.actionGenerated.emit(action);
  }
}
