import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatTheme, fontHelper } from '../../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
import { fileBubbleStyle } from '../../styles';

@Component({
  selector: 'cometchat-file-bubble',
  templateUrl: './cometchat-file-bubble.component.html',
  styleUrls: ['./cometchat-file-bubble.component.scss']
})
export class CometChatFileBubbleComponent implements OnInit,OnChanges {

@Input() messageObject: CometChat.BaseMessage | null = null;
@Input() title: string = '';  
@Input() fileUrl: string = '';
@Input() subtitle = "shared document";
@Input() iconUrl = "assets/resources/download.svg"
@Input() mimeType:string=""
@Input() theme: CometChatTheme = new CometChatTheme({});

@Input() style :fileBubbleStyle= {
	width: "100%",
	height: "100%",
	border: "none",
	background: "transparent",
	borderRadius: "none",
	titleFont: "600 15px Inter, sans-serif",
	titleColor: "rgb(20, 20, 20)",
	subtitleFont: "400 13px Inter, sans-serif",
	subtitleColor: "rgba(20, 20, 20, 0.58)",
	iconTint: "rgb(51, 153, 255)",
};


  constructor(private ref:ChangeDetectorRef, private messageEvents:CometChatMessageEvents) {}
  ngOnChanges(changes: SimpleChanges): void {
    try {
      if(this.title && (this.title !== "")) {
        this.title = this.title;
      } else if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
      this.title = (this.messageObject as any).data.attachments[0].name;
      }

      if(this.fileUrl && (this.fileUrl !== "")) {
        this.fileUrl = this.fileUrl;
      } else if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
        this.fileUrl = (this.messageObject as any).data.attachments[0].url;
      }
    } catch (error:any) {
      this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }

  ngOnInit() {
  }
// downloading file on click
  downloadFile = () => {
    if (!this.fileUrl) {
      throw new Error("Resource URL not provided! You need to provide one");
    } 
    fetch(this.fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobURL;
        if (this.title && this.title.length) a.download = this.title;
          document.body.appendChild(a);
          a.click();
        })
      .catch((error:any) =>   this.messageEvents.publishEvents(this.messageEvents.onError, error));
  };

// styling for file bubble
  fileBubbleStyle = {

    messageKitBlockStyle: () => {
      return {
        width: this.style.width,
        height: this.style.height,
        border: this.style.border,
        borderRadius: this.style.borderRadius,
        background: this.style.background,
      }
    },

    messageTitleStyle: () => {
      return {
        font: this.style?.titleFont || fontHelper(this.theme.typography.title2),
        color: this.style?.titleColor || this.theme.palette.getAccent900("dark"),
      }
    },

    messageSubTitleStyle: () => {
      return {
        font: this.style?.subtitleFont ||  fontHelper(this.theme.typography.subtitle2),
        color: this.style?.subtitleColor || this.theme.palette.getAccent600("light"),
      }
    },

    messageFileIconStyle: () => {
      return {
        WebkitMask:`url(${this.iconUrl}) `,
        background:this.style.iconTint || this.theme.palette.getPrimary(),

      }
    }
  }
}
