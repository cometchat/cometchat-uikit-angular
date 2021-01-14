import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
import * as enums from "../../../utils/enums";
@Component({
  selector: "cometchat-sticker-keyboard",
  templateUrl: "./cometchat-sticker-keyboard.component.html",
  styleUrls: ["./cometchat-sticker-keyboard.component.css"],
})
export class CometChatStickerKeyboardComponent implements OnInit {
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  decoratorMessage: string = STRING_MESSAGES.LOADING_MESSSAGE;
  loading: boolean = true;
  stickerList = [];
  stickerSet = {};
  activeStickerList = [];
  activeStickerSet = null;
  categoryStickerUrl = [];
  constructor() {}

  ngOnInit() {
    this.getStickers();
  }

  /**
   * Fetches all the information of stickers
   */
  getStickers() {
    CometChat.callExtension("stickers", "GET", "v1/fetch", null)
      .then((stickers) => {
        // Stickers received
        let activeStickerSet = null;
        const customStickers = stickers.hasOwnProperty("customStickers")
          ? stickers["customStickers"]
          : [];
        const defaultStickers = stickers.hasOwnProperty("defaultStickers")
          ? stickers["defaultStickers"]
          : [];
        defaultStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        customStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        const stickerList = [...defaultStickers, ...customStickers];

        if (stickerList.length === 0) {
          this.decoratorMessage = STRING_MESSAGES.NO_STICKERS_FOUND;
        }

        const stickerSet = stickerList.reduce((r, sticker, index) => {
          const { stickerSetName } = sticker;
          if (index === 0) {
            activeStickerSet = stickerSetName;
          }

          r[stickerSetName] = [...(r[stickerSetName] || []), { ...sticker }];

          return r;
        }, {});
        let activeStickerList = [];
        if (Object.keys(stickerSet).length) {
          Object.keys(stickerSet).forEach((key) => {
            stickerSet[key].sort(function (a, b) {
              return a.stickerOrder - b.stickerOrder;
            });
          });

          activeStickerList = stickerSet[activeStickerSet];
        }

        this.stickerList = stickerList;
        this.stickerSet = stickerSet;
        this.activeStickerList = activeStickerList;
        this.activeStickerSet = activeStickerSet;

        if (stickerList.length !== 0) {
          this.loading = false;
        }
        Object.keys(this.stickerSet).map((sectionItem) => {
          const url = this.stickerSet[sectionItem][0];
          this.categoryStickerUrl.push(url);
        });
      })
      .catch((error) => {
        // Some error occured
        console.warn("Error: ", error);
        this.decoratorMessage = STRING_MESSAGES.NO_STICKERS_FOUND;
        this.activeStickerList = [];
        this.stickerSet = {};
      });
  }

  /**
   * Gets The sticker collection when sticker category is changed
   * @param
   */
  stickerSetClicked(sectionItem) {
    // sectionItem = "bear";
    this.activeStickerList = [];
    const stickerSet = { ...this.stickerSet };
    const activeStickerList = stickerSet[sectionItem];
    this.activeStickerSet = sectionItem;
    this.activeStickerList = activeStickerList;
  }

  /**
   * Sends Sticker as Message
   * @param
   */
  sendStickerMessage(stickerItem) {
    this.actionGenerated.emit({
      type: enums.SEND_STICKER,
      payLoad: stickerItem,
    });
  }

  /**
   * Close Sticker Window
   * @param
   */
  closeStickerWindow(message) {
    this.actionGenerated.emit({
      type: message,
    });
  }
}
