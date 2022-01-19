import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../../utils/common";
import * as enums from "../../../../../utils/enums";

@Component({
  selector: "cometchat-sender-sticker-message-bubble",
  templateUrl: "./cometchat-sender-sticker-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-sticker-message-bubble.component.css"],
})
export class CometChatSenderStickerMessageBubbleComponent
  implements OnInit, OnChanges {
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() loggedInUser: any;

  @Input() showReplyCount = true;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  messageFrom = enums.SENDER;
  message: any;
  stickerUrl: string = '';
  stickerName: string = '';
  checkReaction = [];

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.MESSAGE_DETAILS]) {
        if (
          change[enums.MESSAGE_DETAILS].previousValue !==
          change[enums.MESSAGE_DETAILS].currentValue
        ) {
          const message = Object.assign({}, this.messageDetails, {
            messageFrom: this.messageFrom,
          });
          this.messageDetails = message;
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      let stickerData = null;
      if (
        this.messageDetails.hasOwnProperty(enums.DATA) &&
        this.messageDetails.data.hasOwnProperty(enums.CUSTOM_DATA)
      ) {
        stickerData = this.messageDetails.data.customData;
        if (stickerData.hasOwnProperty(enums.STICKER_URL)) {
          this.stickerName = stickerData.hasOwnProperty(enums.STICKER_NAME)
            ? stickerData.sticker_name
            : enums.STICKER;
          this.stickerUrl = stickerData.sticker_url;
        }
      }
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles all the events emitted by child components
   */
  actionHandler(action: any) {
    try {
      this.actionGenerated.emit(action);
    } catch (error) {
      logger(error);
    }
  }
}
