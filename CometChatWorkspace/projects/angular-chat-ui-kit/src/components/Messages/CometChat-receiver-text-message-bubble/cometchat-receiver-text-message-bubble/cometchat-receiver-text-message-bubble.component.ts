import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../utils/common";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-receiver-text-message-bubble",
  templateUrl: "./cometchat-receiver-text-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-text-message-bubble.component.css"],
})
export class CometChatReceiverTextMessageBubbleComponent implements OnInit {
  @Input() item = null;
  @Input() type = "";
  @Input() MessageDetails = null;
  @Input() showReplyCount = true;
  @Input() loggedInUser;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  @Input() showToolTip = true;

  linkPreview: boolean = false;
  linkTitle: string;
  linkDescription: string;
  linkUrl: string;
  linkText: string;
  linkImage: string;
  checkReaction: boolean = false;

  constructor() {}

  ngOnInit() {
    this.checkLinkPreview();
    this.checkReaction = checkMessageForExtensionsData(
      this.MessageDetails,
      STRING_MESSAGES.REACTIONS
    );
  }

  /**
   * Check If extension has enabled LinkPreview
   */
  checkLinkPreview() {
    if (this.MessageDetails.hasOwnProperty("metadata")) {
      const metadata = this.MessageDetails.metadata;
      const injectedObject = metadata["@injected"];
      if (injectedObject && injectedObject.hasOwnProperty("extensions")) {
        const extensionsObject = injectedObject["extensions"];
        if (
          extensionsObject &&
          extensionsObject.hasOwnProperty("link-preview")
        ) {
          const linkPreviewObject = extensionsObject["link-preview"];
          if (
            linkPreviewObject &&
            linkPreviewObject.hasOwnProperty("links") &&
            linkPreviewObject["links"].length
          ) {
            this.linkPreview = true;
            const linkObject = linkPreviewObject["links"][0];
            this.linkTitle = linkObject.title;
            this.linkDescription = linkObject.description;
            this.linkUrl = linkObject.url;
            this.linkImage = linkObject.image;
            const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
            const linkText = linkObject["url"].match(pattern)
              ? STRING_MESSAGES.VIEW_ON_YOUTUBE
              : STRING_MESSAGES.VISIT;
            this.linkText = linkText;
            // const actualMessage = messageText;
          }
        }
      }
    }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    this.actionGenerated.emit(action);
  }
}
