
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../utils/common";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import * as enums from "../../../../utils/enums";

@Component({
  selector: "cometchat-sender-text-message-bubble",
  templateUrl: "./cometchat-sender-text-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-text-message-bubble.component.css"],
})
export class CometChatSenderTextMessageBubbleComponent implements OnInit {
  @Input() messageDetails: any = null;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  @Input() showToolTip = true;

  linkPreview: boolean = false;
  linkTitle: string = '';
  linkDescription: string = '';
  linkUrl: string = '';
  linkText: string = '';
  linkImage: string = '';
  checkReaction = [];
  constructor() {}

  ngOnInit() {
    try {
      this.checkLinkPreview();
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Check If extension has enabled LinkPreview
   */
  checkLinkPreview() {
    try {
      if (this.messageDetails.hasOwnProperty(enums.METADATA)) {
        const metadata = this.messageDetails[enums.METADATA];
        const injectedObject = metadata[enums.INJECTED];
        if (injectedObject && injectedObject.hasOwnProperty(enums.EXTENSIONS)) {
          const extensionsObject = injectedObject[enums.EXTENSIONS];
          if (
            extensionsObject &&
            extensionsObject.hasOwnProperty(enums.LINK_PREVIEW)
          ) {
            const linkPreviewObject = extensionsObject[enums.LINK_PREVIEW];
            if (
              linkPreviewObject &&
              linkPreviewObject.hasOwnProperty(enums.LINKS) &&
              linkPreviewObject[enums.LINKS].length
            ) {
              this.linkPreview = true;
              const linkObject = linkPreviewObject[enums.LINKS][0];
              this.linkTitle = linkObject.title;
              this.linkDescription = linkObject.description;

              if (linkObject.url !== this.messageDetails.data.text) {
                this.linkUrl = this.messageDetails.data.text;
              } else {
                this.linkUrl = linkObject.url;
              }

              this.linkImage = linkObject.image;
              const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
              const linkText = linkObject["url"].match(pattern)
                ? COMETCHAT_CONSTANTS.VIEW_ON_YOUTUBE
                : COMETCHAT_CONSTANTS.VISIT;
              this.linkText = linkText;
            }
          }
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
