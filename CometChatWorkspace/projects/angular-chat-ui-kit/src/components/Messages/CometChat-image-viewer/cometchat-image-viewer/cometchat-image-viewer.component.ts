import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import * as enums from "../../../utils/enums";

@Component({
  selector: "cometchat-image-viewer",
  templateUrl: "./cometchat-image-viewer.component.html",
  styleUrls: ["./cometchat-image-viewer.component.css"],
})
export class CometChatImageViewerComponent implements OnInit {
  @Input() MessageDetails;
  @Input() open;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  imageUrl: string;
  constructor() {}

  ngOnInit() {
    this.getUrl();
  }
  getUrl() {
    let img = new Image();
    img.src = this.MessageDetails.data.url;
    this.imageUrl = img.src;
  }

  close() {
    this.actionGenerated.emit({
      type: enums.CLOSE_FULL_SCREEN_IMAGE,
    });
  }
}
