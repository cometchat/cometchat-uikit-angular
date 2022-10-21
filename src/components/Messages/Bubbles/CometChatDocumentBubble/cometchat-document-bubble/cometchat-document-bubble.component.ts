import { Component, OnInit, Input } from '@angular/core';
import { MetadataKey } from '../../../../Shared/Constants/UIKitConstants';
import { checkHasOwnProperty } from '../../../../Shared/Helpers/CometChatHelper';
import { CometChat } from '@cometchat-pro/chat';
import { documentStyles } from '../../styles';
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
import { CometChatTheme, fontHelper } from '../../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';
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
  @Input() theme: CometChatTheme = new CometChatTheme({});
  @Input() style: documentStyles = {
    width: "100%",
    height: "100%",
    titleFont: "",
    titleColor: "",
    subTitleFont: "",
    subTitleColor: "",
    iconTint: "",
    background: "transparent",
    borderRadius: "none",
    border: "",
    buttonTextFont: "",
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
        background: this.style.iconTint || this.theme.palette.getAccent400("light"),
      }
    },
    titleStyle: () => {
      return {
        font: this.style.titleFont || fontHelper(this.theme.typography.title2),
        color: this.style.titleColor || this.theme.palette.getAccent("light")
      }
    },
    subtitleStyle: () => {
      return {
        font: this.style.subTitleFont ||  fontHelper(this.theme.typography.subtitle2),
        color: this.style.subTitleColor || this.theme.palette.getAccent600("light")
      }
    },
    buttonStyle: () => {
      return {
        font: this.style.buttonTextFont ||  fontHelper(this.theme.typography.title2),
        color: this.style.buttonTextColor || this.theme.palette.getPrimary(),
        cursor: "pointer"
      }
    }
  }
}
