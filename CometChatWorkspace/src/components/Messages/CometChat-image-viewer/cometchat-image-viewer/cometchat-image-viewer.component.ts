import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-image-viewer",
  templateUrl: "./cometchat-image-viewer.component.html",
  styleUrls: ["./cometchat-image-viewer.component.css"],
})
export class CometChatImageViewerComponent implements OnInit {
  @Input() messageDetails: any;
  @Input() open: any;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  imageUrl: string = '';
  constructor() {}

  ngOnInit() {
    try {
      this.getUrl();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Gets the Url of image
   */
  getUrl() {
    try {
      let img = new Image();
      img.src = this.messageDetails.data.url;
      this.imageUrl = img.src;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Emits action to close full screen view
   */
  close() {
    try {
      this.actionGenerated.emit({
        type: enums.CLOSE_FULL_SCREEN_IMAGE,
      });
    } catch (error) {
      logger(error);
    }
  }
}
