import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";
import { CometChat } from "@cometchat-pro/chat";

@Component({
  selector: "cometchat-sender-directcall-bubble",
  templateUrl: "./cometchat-sender-directcall-bubble.component.html",
  styleUrls: ["./cometchat-sender-directcall-bubble.component.css"],
})
export class CometChatSenderDirectCallBubbleComponent implements OnInit {
  @Input() item = null;
  @Input() type: string = "";
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

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;

  constructor() {}

  ngOnInit() {
    try {
      this.setLoggedInUser() 
      this.checkLinkPreview();
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
    } catch (error) {
      logger(error);
    }
  }
  setLoggedInUser() {
    try {
      CometChat.getLoggedinUser()
        .then((user) => {
          this.loggedInUser = user;
        })
        .catch((error) => {
          logger("failed to get the loggedIn user", error);
        });
    } catch (error) {
      logger(error);
    }
  }
  // join direct call
  joinCallData(sessionid:string){
    // this.actionGenerated.emit({
    //   type:"joinDirectCall",
    //   sessionid:sessionid
    // })
      this.actionGenerated.emit({
      type:"sessionid",
      sessionid:sessionid
    })

 


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
              this.linkUrl = linkObject.url;
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
