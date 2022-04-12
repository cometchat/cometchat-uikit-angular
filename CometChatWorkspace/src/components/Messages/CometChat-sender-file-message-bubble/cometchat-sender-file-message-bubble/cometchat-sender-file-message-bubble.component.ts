import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChange, SimpleChanges } from "@angular/core";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../utils/common";
import * as enums from "../../../../utils/enums";

@Component({
  selector: "cometchat-sender-file-message-bubble",
  templateUrl: "./cometchat-sender-file-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-file-message-bubble.component.css"],
})
export class CometChatSenderFileMessageBubbleComponent implements OnInit,OnChanges {
  @Input() messageDetails: any = null;
  @Input() showToolTip = true;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;
  checkReaction = [];

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  url: string = '';
  name: string = '';
  constructor() {}
  ngOnChanges(changes: SimpleChanges) {
  //  this.messageDetails = changes.messageDetails.currentValue
    
  }

  ngOnInit() {
    try {
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
      this.setFile();
    } catch (error) {
      logger(error);
    }
  }

  setFile() {
    if(this.messageDetails.data.hasOwnProperty("attachments")) {
      this.url = this.messageDetails.data.attachments[0].url;
      this.name = this.messageDetails.data.attachments[0].name;
    }
    else {
      const metadataKey = enums.FILE_METADATA;
		  const fileMetadata = this.getMessageFileMetadata (this.messageDetails, metadataKey);
      this.name = fileMetadata["name"];
    }
  }

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
  



