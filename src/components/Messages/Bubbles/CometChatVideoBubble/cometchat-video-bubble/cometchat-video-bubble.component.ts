import { Component, Input, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

import {styles} from '../../../../Shared/Types/interface'
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
@Component({
  selector: 'cometchat-video-bubble',
  templateUrl: './cometchat-video-bubble.component.html',
  styleUrls: ['./cometchat-video-bubble.component.scss']
})
export class CometChatVideoBubbleComponent implements OnInit {

  @Input() messageObject: CometChat.BaseMessage | null = null; 

  @Input() videoUrl: string = '';

  @Input() style:styles = {
    width: "100%",
	  height: "100%",
	  border: "none",
	  background: "transparent",
	  borderRadius: "12px"
  };
  
  constructor(private messageEvents:CometChatMessageEvents) {}
  ngOnInit() {
    try {
      if(this.videoUrl && (this.videoUrl !== "")) {
        this.videoUrl = this.videoUrl;
      } else if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
        this.getUrl();
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Gets the url of video to be displayed
   */
  getUrl() {
    try {
      this.videoUrl = (this.messageObject as any).data.url;
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }

  videoBubbleStyle = {
    messageKitBlockStyle: () => {
      return {
        height: this.style.height,
        width: this.style.width,
        border: this.style.border,
        borderRadius: this.style.borderRadius,
        background: this.style.background,
      }
    }
  }

}
