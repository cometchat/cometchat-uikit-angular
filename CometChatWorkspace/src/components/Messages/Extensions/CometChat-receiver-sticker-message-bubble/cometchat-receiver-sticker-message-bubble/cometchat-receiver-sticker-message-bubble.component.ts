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
import { CometChat } from "@cometchat-pro/chat";

@Component({
  selector: "cometchat-receiver-sticker-message-bubble",
  templateUrl: "./cometchat-receiver-sticker-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-sticker-message-bubble.component.css"],
})
export class CometChatReceiverStickerMessageBubbleComponent
  implements OnInit, OnChanges {
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() loggedInUser: any;

  @Input() showReplyCount = true;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  avatar = null;
  name: string = '';
  avatarIfGroup: boolean = false;

  stickerName: string = '';
  stickerUrl: string = '';

  checkReaction = [];

  messageFrom = enums.RECEIVER;

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;

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
      this.getSticker();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Get Sticker Details
   */
  getSticker() {
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
