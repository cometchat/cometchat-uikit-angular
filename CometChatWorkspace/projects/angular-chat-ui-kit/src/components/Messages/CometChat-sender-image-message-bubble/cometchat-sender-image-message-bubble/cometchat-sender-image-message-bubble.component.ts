import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  HostListener,
} from "@angular/core";
import * as enums from "../../../../utils/enums";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../utils/common";

@Component({
  selector: "cometchat-sender-image-message-bubble",
  templateUrl: "./cometchat-sender-image-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-image-message-bubble.component.css"],
})
export class CometChatSenderImageMessageBubbleComponent implements OnInit {
  @Input() messageDetails = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  innerWidth;
  checkScreenSize: boolean = false;
  checkReaction = [];

  timer = null;
  messageFrom = enums.SENDER;
  imageLoader: boolean = false;

  messageAssign = Object.assign({}, this.messageDetails, {
    messageFrom: this.messageFrom,
  });

  message = this.messageAssign;
  imageUrl = "";
  fullScreenView = false;
  img: any;

  constructor() {}

  ngOnInit() {
    try {
      this.onResize();

      this.setImage();
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
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
   * Checks if thumnail-generation extension is present And then Sets the image
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
            const imageToDownload = this.chooseImage(thumbnailGenerationObject);
            this.downloadImage(imageToDownload)
              .then((response) => {
                this.img = new Image();
                this.img.src = imageToDownload;
                this.img.onload = () => {
                  this.imageLoader = false;
                  this.imageUrl = this.img.src;
                  URL.revokeObjectURL(this.img.src);
                };
              })
              .catch((err) => {
                logger(err);
              });
          }
        }
      } else {
        this.setMessageImageUrl();
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets image url ie. medium or small-size image
   * @param
   */
  chooseImage(thumbnailGenerationObject) {
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
   * If thumnail-generation extension is not present then sets default URL
   * @param
   */
  setMessageImageUrl() {
    try {
      let img = new Image();
      img.src = this.messageDetails.data.url;
      img.onload = () => {
        this.imageLoader = false;
        this.imageUrl = img.src;
      };
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Emits action to open image in full-screen view
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
  actionHandler(action) {
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
  downloadImage(imgUrl) {
    try {
      const promise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(enums.GET, imgUrl, true);
        xhr.responseType = enums.BLOB;

        xhr.onload = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              this.timer = null;
              resolve(imgUrl);
            } else if (xhr.status === 403) {
              this.timer = setTimeout(() => {
                this.downloadImage(imgUrl)
                  .then((response) => resolve(imgUrl))
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
    } catch (error) {
      logger(error);
    }
  }
}
