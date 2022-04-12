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
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  innerWidth: any;
  checkScreenSize: boolean = false;
  checkReaction = [];

  timer: any = null;
  messageFrom = enums.SENDER;
  imageLoader: boolean = false;

  messageAssign = Object.assign({}, this.messageDetails, {
    messageFrom: this.messageFrom,
  });

  message: object = this.messageAssign;
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
      if (this.messageDetails.hasOwnProperty(enums.METADATA)) {
        const metadata = this.messageDetails[enums.METADATA];

        if(metadata.hasOwnProperty(enums.INJECTED)) {
          const injectedObject = metadata[enums.INJECTED];
          if (injectedObject && injectedObject.hasOwnProperty(enums.EXTENSIONS)) {
            const extensionsObject = injectedObject[enums.EXTENSIONS];
            if (
                extensionsObject &&
                extensionsObject.hasOwnProperty(enums.THUMBNAIL_GENERATION)
               ) {
                const thumbnailGenerationObject = extensionsObject[enums.THUMBNAIL_GENERATION];

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
                })
               } 
          } else {
            this.setMessageImageUrl();
          } 
        }
        else {
          this.setMessageImageUrl();
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets image url ie. medium or small-size image
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
   * If thumnail-generation extension is not present then sets default URL
   * @param
   */
  setMessageImageUrl() {
    const metadataKey = enums.FILE_METADATA;
		const fileMetadata = this.getMessageFileMetadata (this.messageDetails, metadataKey);

		let img: any = new Image();
		let imageName:any;

    if (fileMetadata instanceof Blob) {

			const reader = new FileReader();
			reader.onload = function() {
				img.src = reader.result;
			};
			imageName = (fileMetadata as any)["name"];
			reader.readAsDataURL(fileMetadata);
    }

    else {
      img.src = this.messageDetails.data.attachments[0].url;
      img.onload = () => {
        this.imageLoader = false;
        this.imageUrl = img.src;
      };
    } 

		img.onload = () => {
			//only if there is a change in the image path, update state
			if (this.imageUrl !== img.src) {
				this.imageUrl = img.src,
        imageName = imageName;
			}
		};
	};
  

  getMessageFileMetadata(message:any, metadataKey:any) {
    let fileMetadata;
    if(message.hasOwnProperty("metadata")) {
        const metadata = message["metadata"];
        if (metadata.hasOwnProperty(metadataKey)) {
            fileMetadata = metadata[metadataKey];
        }
    }
    return fileMetadata;
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
  downloadImage(imgUrl: any) {
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
  }
}
