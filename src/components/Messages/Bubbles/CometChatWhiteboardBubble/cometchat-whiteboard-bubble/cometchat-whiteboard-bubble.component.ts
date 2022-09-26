import { Component, OnInit, Input } from '@angular/core';
import { MetadataKey } from '../../../../Shared/Constants/UIKitConstants';
import { checkHasOwnProperty } from '../../../../Shared/Helpers/CometChatHelper';
import { DomSanitizer } from '@angular/platform-browser';
import { whiteboardStyles } from '../../styles';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
@Component({
  selector: 'cometchat-whiteboard-bubble',
  templateUrl: './cometchat-whiteboard-bubble.component.html',
  styleUrls: ['./cometchat-whiteboard-bubble.component.scss']
})
export class CometChatWhiteboardBubbleComponent implements OnInit {
  @Input() messageObject!: CometChat.BaseMessage;;
  @Input() title: string = " Collaborative Whiteboard";
  @Input() subTitle: string = "Open whiteboard to draw together";
  @Input() iconUrl: string = "assets/resources/collaborativewhiteboard.svg"
  buttonText: string = "Launch";
  whiteboardURL: string = "";
  @Input() style: whiteboardStyles = {
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
  constructor(protected _sanitizer: DomSanitizer, private messageEvents:CometChatMessageEvents) { }
  ngOnInit(): void {
    //Gets file url
    if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
      this.getWhiteBoardURL();
    }
  }
  // getting extension data 
  getWhiteBoardURL() {
    try {
      if (checkHasOwnProperty(this.messageObject,"data")) {
        const data = (this.messageObject as CometChat.CustomMessage).getData();
        if (checkHasOwnProperty(data,MetadataKey.metadata)) {
          const metadata = data[MetadataKey.metadata];
          if (checkHasOwnProperty(metadata,MetadataKey.injected)) {
            const injectedObject = metadata[MetadataKey.injected];
            if (injectedObject && checkHasOwnProperty(injectedObject,"extensions")) {
              const extensionObject = injectedObject.extensions;
              this.whiteboardURL = extensionObject[MetadataKey.extensions.whiteboard].board_url;
            }
          }
        }
      }
    } catch (error:any) {
      this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  // launcgh collaborative whiteboard on click
  launchCollaborativeWhiteboard() {
    window.open(this.whiteboardURL, "", "fullscreen=yes, scrollbars=auto");
  }
  // styling for documentBubble
  whiteboardBubbleStyle = {
    whiteBoardIcon: () => {
      return {
        WebkitMask: `url(${this.iconUrl})`,
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
