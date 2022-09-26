import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import {  checkMessageForExtensionsData,checkHasOwnProperty } from '../../../../Shared/Helpers/CometChatHelper';
import { styles } from "../../styles";
import { MetadataKey } from "../../../../Shared/Constants/UIKitConstants";
import { CometChatMessageEvents } from "../../../CometChatMessageEvents.service";
@Component({
  selector: 'cometchat-text-bubble',
  templateUrl: './cometchat-text-bubble.component.html',
  styleUrls: ['./cometchat-text-bubble.component.scss'],
})
export class CometChatTextBubbleComponent implements OnInit {
  @Input() messageObject!: CometChat.BaseMessage;
  @Input() text: string = "";
  @Input() style:styles = {
    width: "100%",
    height: "100%",
    border: "none",
    background: "transparent",
    borderRadius: "inherit",
    textFont: "400 15px Inter, sans-serif",
    textColor: "white",
  };
  linkPreview: boolean = false;
  linkTitle: string = '';
  linkDescription: string = '';
  linkUrl: string = '';
  linkText: string = '';
  linkImage: string = '';
  public textMessage: string = ""
  constructor(private messageEvents:CometChatMessageEvents) {
  }
  ngOnInit(): void {
    try {
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes["messageObject"].currentValue &&
      changes["messageObject"].previousValue !== changes["messageObject"].currentValue) {
      let text = this.getExtensionData(this.messageObject)
      this.textMessage = text || (this.messageObject as any).data.text;
      this.messageObject = changes["messageObject"].currentValue;
      this.checkLinkPreview();
    }
    if (this.text && this.text !== this.textMessage) {
      this.textMessage = this.text;
    }
  }
  // checking link preview extension in message object
  checkLinkPreview() {
    try {
      if (checkHasOwnProperty(this.messageObject,MetadataKey.metadata)) {
        const metadata:any = (this.messageObject as CometChat.TextMessage).getMetadata();
        const injectedObject = metadata[MetadataKey.injected];
        if (injectedObject && checkHasOwnProperty(injectedObject,MetadataKey.extension)) {
          const extensionsObject = injectedObject.extensions;
          if (
            extensionsObject &&
            checkHasOwnProperty(extensionsObject,MetadataKey.extensions.linkpreview)
          ) {
            const linkPreviewObject = extensionsObject[MetadataKey.extensions.linkpreview];
            if (
              linkPreviewObject &&
              checkHasOwnProperty(linkPreviewObject,MetadataKey.links) &&
              linkPreviewObject[MetadataKey.links].length
            ) {
              this.linkPreview = true;
              const linkObject = linkPreviewObject[MetadataKey.links][0];
              this.linkTitle = linkObject.title;
              this.linkDescription = linkObject.description;
              if (linkObject.url !== (this.messageObject as any).data.text) {
                this.linkUrl = 'https://' + (this.messageObject as any).data.text;
              } else {
                this.linkUrl = 'https://' + linkObject.url;
              }
              this.linkImage = linkObject.image;
              const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
              const linkText = linkObject["url"].match(pattern)
                ? "View on Youtube"
                : "Visit";
              this.linkText = linkText;
            }
          }
        }
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * checking for extension and setting text message
   * @param  {CometChat.BaseMessage} messageObject
   */
  getExtensionData(messageObject: CometChat.BaseMessage) {
    let messageText
    //xss extensions data
    const xssData = checkMessageForExtensionsData(messageObject, "xss-filter");
    if (xssData && checkHasOwnProperty(xssData,"sanitized_text") && checkHasOwnProperty(xssData,"hasXSS") && xssData.hasXSS === "yes") {
      messageText = xssData.sanitized_text;
    }
    //datamasking extensions data
    const maskedData = checkMessageForExtensionsData(messageObject, "data-masking");
    if (maskedData && checkHasOwnProperty(maskedData,"data") && checkHasOwnProperty(maskedData.data,"sensitive_data") && checkHasOwnProperty(maskedData.data,"message_masked") && maskedData.data.sensitive_data === "yes") {
      messageText = maskedData.data.message_masked;

    }
    //profanity extensions data
    const profaneData = checkMessageForExtensionsData(messageObject, "profanity-filter");
    if (profaneData && checkHasOwnProperty(profaneData,"profanity") && checkHasOwnProperty(profaneData,"message_clean") && profaneData.profanity === "yes") {
      messageText = profaneData.message_clean;
    }

    return messageText
  }
  // styling for text bubble
  textBubbleStyle = {
    messageKitBlockStyle: () => {
      return {
        width: this.style.width,
        height: this.style.height,
        border: this.style.border,
        borderRadius: this.style.borderRadius,
        background: this.style.background,
      }
    },
    messageBlockStyle: () => {
      return {
        font: this.style.textFont,
        color: this.style.textColor,
      }
    },
    linkPreviewTitleStyle: ()=>{
      return {
        font: this.style.linkPreviewTitleFont,
        color: this.style.linkPreviewTitleColor,
      }

    },

    linkPreviewUrlStyle: ()=>{
      return {
        font: this.style.linkPreviewSubtitleFont,
        color: this.style.linkPreviewSubtitleColor,
      }

    },
    linkPreviewContainer:()=>{
      return{
        height: this.linkImage ?  "164px" : "64px"
      }
    }
  }
}
