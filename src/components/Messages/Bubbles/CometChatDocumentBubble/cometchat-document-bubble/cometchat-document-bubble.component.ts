import { Component, OnInit, Input } from '@angular/core';
import { MetadataKey } from '../../../../Shared/Constants/UIKitConstants';
import { checkHasOwnProperty } from '../../../../Shared/Helpers/CometChatHelper';
import { CometChat } from '@cometchat-pro/chat';
import { documentStyles } from '../../styles';
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
@Component({
  selector: 'cometchat-document-bubble',
  templateUrl: './cometchat-document-bubble.component.html',
  styleUrls: ['./cometchat-document-bubble.component.scss']
})
export class CometChatDocumentBubbleComponent implements OnInit {
  @Input() messageObject: CometChat.BaseMessage | null = null;
  @Input() title: string = " Collaborative Document";
  @Input() subTitle: string = "Open document to edit content togather ";
  @Input() iconURL: string = "assets/resources/collaborativedocument.svg"
  @Input() buttonText: string = "Launch";
  documentURL: string = ""
  @Input() style: documentStyles = {
    width: "100%",
    height: "100%",
    titleFont: "600 15px inter",
    titleColor: "black",
    subTitleFont: "400 13px inter",
    subTitleColor: "grey",
    iconTint: "grey",
    background: "transparent",
    borderRadius: "none",
    border: "",
    buttonTextFont: "600 15px inter",
    buttonTextColor: "rgb(51, 153, 255)",
    buttonBackground: "transparent",
  };
  constructor(private messageEvents:CometChatMessageEvents) { }
  ngOnInit(): void {
    //Gets file url
    if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
      this.getCollaborativeDocumentURL();
    }
  }
  // getting extension data 
  getCollaborativeDocumentURL() {
    try {
      if ((this.messageObject as CometChat.TextMessage).getData()) {
        const data: any = (this.messageObject as CometChat.TextMessage).getData();
        if ( checkHasOwnProperty(data ,MetadataKey.metadata)) {
          const metadata = data[MetadataKey.metadata];
          if (checkHasOwnProperty(metadata,MetadataKey.injected)) {
            const injectedObject = metadata[MetadataKey.injected];
            if (injectedObject && checkHasOwnProperty(injectedObject,MetadataKey.extension)) {
              const extensionObject = injectedObject.extensions;
              this.documentURL = extensionObject[MetadataKey.extensions.document].document_url;
            }
          }
        }
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  // launcgh collaborative document on click
  launchCollaborativeDocument() {
    window.open(this.documentURL, "", "fullscreen=yes, scrollbars=auto");
  }
  // styling for documentBubble
  documentBubbleStyle = {
    documentIcon: () => {
      return {
        WebkitMask: `url(${this.iconURL})`,
        background: this.style.iconTint,
      }
    },
    titleStyle: () => {
      return {
        font: this.style.titleFont,
        color: this.style.titleColor
      }
    },
    subtitleStyle: () => {
      return {
        font: this.style.subTitleFont,
        color: this.style.subTitleColor
      }
    },
    buttonStyle: () => {
      return {
        font: this.style.buttonTextFont,
        color: this.style.buttonTextColor,
        cursor: "pointer"
      }
    }
  }
}
