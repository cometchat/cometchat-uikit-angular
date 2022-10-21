import { NullVisitor } from '@angular/compiler/src/render3/r3_ast';
import { Component,
  Input,
  OnInit,
 } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import {styles} from '../../../../Shared/Types/interface'

  import { checkHasOwnProperty } from '../../../../Shared/Helpers/CometChatHelper';
import {  stickerEnums  } from '../../../../Shared/Constants/UIKitConstants';
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
import { CometChatTheme } from '../../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';

@Component({
  selector: 'cometchat-sticker-bubble',
  templateUrl: './cometchat-sticker-bubble.component.html',
  styleUrls: ['./cometchat-sticker-bubble.component.scss']
})
export class CometChatStickerBubbleComponent implements OnInit {

  @Input() messageObject: CometChat.BaseMessage | null = null;
  @Input() stickerName: string = '';
  @Input() stickerUrl: string = '';

  @Input() style:styles = {
		width: "100%",
	  height: "100%",
	  border: "none",
	  background: "transparent",
	  borderRadius: "12px"
  };
  @Input() theme: CometChatTheme = new CometChatTheme({});

  constructor(private messageEvents:CometChatMessageEvents) { }

  ngOnInit(): void {
    try {
      if(this.stickerName && (this.stickerName !== "")) {
        this.stickerName = this.stickerName;
      }
      if(this.stickerUrl && (this.stickerUrl !== "")) {
        this.stickerUrl = this.stickerUrl;
      }
      else if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
        this.getSticker();
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Get Sticker Details
   */
   getSticker() {
    try {
      let stickerData = null;
      if (
        checkHasOwnProperty(this.messageObject,stickerEnums.data) &&
       checkHasOwnProperty( (this.messageObject as CometChat.CustomMessage).getData(),stickerEnums.customData)
      ) {
        stickerData = (this.messageObject as any).data.customData;
        if (checkHasOwnProperty(stickerData,stickerEnums.sticker_url)) {
          this.stickerName = checkHasOwnProperty(stickerData,stickerEnums.sticker_name)
            ? stickerData.sticker_name
            : stickerEnums.sticker
          this.stickerUrl = stickerData.sticker_url;
        }
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }

  stickerBubbleStyle = {
    messageKitBlockStyle: () => {
      return {
        height: this.style.height,
        width: this.style.width,
        borderRadius: this.style.borderRadius,
        background: this.style.background,
      }
    }
  }

}
