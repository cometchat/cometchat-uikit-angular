import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  HostListener,
} from "@angular/core";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";
import { CometChat } from "@cometchat-pro/chat";

@Component({
  selector: "cometchat-receiver-image-message-bubble",
  templateUrl: "./cometchat-receiver-image-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-image-message-bubble.component.css"],
})
export class CometChatReceiverImageMessageBubbleComponent implements OnInit {
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  messageFrom = enums.RECEIVER;

  messageAssign = Object.assign({}, this.messageDetails, {
    messageFrom: this.messageFrom,
  });
  imageLoader: boolean = false;
  innerWidth: any;
  checkScreenSize: boolean = false;
  checkReaction = [];
  avatar = null;
  name: string = '';
  avatarIfGroup: boolean = false;

  message: object = this.messageAssign;
  imageUrl = "";
  timer: any = null;

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;

  constructor() {}

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
        this.name = this.messageDetails.sender.name;
        this.avatar = this.messageDetails.sender.avatar;
      }
      this.setImage();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Checks when window size is changed in realtime
   */
  @HostListener("window:resize", [])
  onResize() {
    try {
      this.innerWidth = window.innerWidth;
      if (
        this.innerWidth >= enums.BREAKPOINT_MIN_WIDTH &&
        this.innerWidth <= enums.BREAKPOINT_MAX_WIDTH
      ) {
        this.checkScreenSize = true;
      } else {
        if (this.checkScreenSize === true) {
          this.setImage();
        }
        this.checkScreenSize = false;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Checks if thumnail-generation extension is present or not And then Sets the image
   */
  setImage() {
    try {
      this.imageLoader = true;
      if (this.messageDetails.hasOwnProperty(enums.METADATA)) {
        const metadata = this.messageDetails[enums.METADATA];

        const injectedObject = metadata[enums.INJECTED];
        if (injectedObject && injectedObject.hasOwnProperty(enums.EXTENSIONS)) {
          const extensionsObject = injectedObject[enums.EXTENSIONS];
          if (
            extensionsObject &&
            extensionsObject.hasOwnProperty(enums.THUMBNAIL_GENERATION)
          ) {
            const thumbnailGenerationObject =
              extensionsObject[enums.THUMBNAIL_GENERATION];

            const mq = window.matchMedia(
              "(min-width:360px) and (max-width: 767px)"
            );

            const imageToDownload = this.chooseImage(thumbnailGenerationObject);
            this.downloadImage(imageToDownload).then((response) => {
              let img = new Image();
              img.src = imageToDownload;
              img.onload = () => {
                this.imageLoader = false;
                this.imageUrl = img.src;
                URL.revokeObjectURL(img.src);
              };
            });
          } else {
            this.setMessageImageUrl();
          }
        } else {
          this.setMessageImageUrl();
        }
      } else {
        this.setMessageImageUrl();
      }
      // this.setMessageImageUrl();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * If thumbnail-extension is not present then set default URL
   */
  setMessageImageUrl = () => {
    try {
      let img = new Image();
      img.src = this.messageDetails.data.attachments[0].url;
      img.onload = () => {
        this.imageLoader = false;
        this.imageUrl = img.src;
      };
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Sets image url i.e medium-size or small-size
   * @param
   */
  chooseImage(thumbnailGenerationObject: any) {
    try {
      const smallUrl = thumbnailGenerationObject[enums.URL_SMALL];
      const mediumUrl = thumbnailGenerationObject[enums.URL_MEDIUM];
      const mq = window.matchMedia("(min-width:360px) and (max-width: 767px)");
      let imageToShow = mediumUrl;
      if (mq.matches) {
        imageToShow = smallUrl;
      }

      return imageToShow;
    } catch (error) {
      logger(error);
    }
  }

  /**
   *   Emits action to view image in full screen
   */
  open() {
    try {
      this.actionGenerated.emit({
        type: enums.VIEW_ACTUAL_IMAGE,
        payLoad: { ...this.message, ...this.messageDetails },
      });
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

  /**
   * Downloads image from server
   * @param imgUrl
   */
  downloadImage(imgUrl: string) {
      const promise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(enums.GET, imgUrl, true);
        xhr.responseType = enums.BLOB;

        xhr.onload = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              this.timer = null;
              resolve(xhr.response);
            } else if (xhr.status === 403) {
              this.timer = setTimeout(() => {
                this.downloadImage(imgUrl)
                  .then((response) => resolve(response))
                  .catch((error) => reject(error));
              }, 800);
            }
          } else {
            reject(xhr.statusText);
          }
        };

        xhr.onerror = (event) =>
          reject(new Error("There was a network error."));
        xhr.ontimeout = (event) =>
          reject(new Error("There was a timeout error."));
        xhr.send();
      });

      return promise;
  }
}
