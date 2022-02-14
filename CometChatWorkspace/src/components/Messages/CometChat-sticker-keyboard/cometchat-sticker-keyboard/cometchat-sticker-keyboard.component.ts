import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-sticker-keyboard",
  templateUrl: "./cometchat-sticker-keyboard.component.html",
  styleUrls: ["./cometchat-sticker-keyboard.component.css"],
})
export class CometChatStickerKeyboardComponent implements OnInit {
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  decoratorMessage: string = COMETCHAT_CONSTANTS.LOADING_MESSSAGE;
  loading: boolean = true;
  stickerList: any = [];
  stickerSet: any = {};
  activeStickerList: any = [];
  activeStickerSet: any ;
  categoryStickerUrl: any = [];
  constructor() {}

  ngOnInit() {
    try {
      this.getStickers();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Fetches all the information of stickers
   */
  getStickers() {
    try {
      CometChat.callExtension(enums.STICKERS, enums.GET, enums.V1_FETCH, '')
        .then((stickers: any) => {
          // Stickers received
          let activeStickerSet = null;
          const customStickers = [];
          if(stickers.hasOwnProperty(enums.CUSTOM_STICKERS)) {
            customStickers.push(stickers[enums.CUSTOM_STICKERS]);
          }
          const defaultStickers = stickers.hasOwnProperty(
            enums.DEFAULT_STICKERS
          )
            ? stickers[enums.DEFAULT_STICKERS]
            : [];
          defaultStickers.sort(function (a: any, b: any) {
            return a.stickerSetOrder - b.stickerSetOrder;
          });

          customStickers.sort(function (a: any, b: any) {
            return a.stickerSetOrder - b.stickerSetOrder;
          });

          const stickerList = [...defaultStickers, ...customStickers];

          if (stickerList.length === 0) {
            this.decoratorMessage = COMETCHAT_CONSTANTS.NO_STICKERS_FOUND;
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
              stickerSet[key].sort(function (a: any, b: any) {
                return a.stickerOrder - b.stickerOrder;
              });
            });
          if(activeStickerSet !== null) {
            activeStickerList = stickerSet[activeStickerSet];
          }
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
          this.decoratorMessage = COMETCHAT_CONSTANTS.NO_STICKERS_FOUND;
          this.activeStickerList = [];
          this.stickerSet = {};
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Gets The sticker collection when sticker category is changed
   * @param
   */
  stickerSetClicked(sectionItem: any) {
    try {
      this.activeStickerList = [];
      const stickerSet: any = { ...this.stickerSet };
      const activeStickerList = stickerSet[sectionItem];
      this.activeStickerSet = sectionItem;
      this.activeStickerList = activeStickerList;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sends Sticker as Message
   * @param
   */
  sendStickerMessage(stickerItem: any) {
    try {
      this.actionGenerated.emit({
        type: enums.SEND_STICKER,
        payLoad: stickerItem,
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Close Sticker Window
   * @param
   */
  closeStickerWindow(message: any) {
    try {
      this.actionGenerated.emit({
        type: message,
      });
    } catch (error) {
      logger(error);
    }
  }
}
