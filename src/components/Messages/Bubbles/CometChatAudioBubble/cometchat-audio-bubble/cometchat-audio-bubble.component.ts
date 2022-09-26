import { Component, OnInit, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import {styles} from '../../../../Shared/Types/interface'
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';

@Component({
  selector: 'cometchat-audio-bubble',
  templateUrl: './cometchat-audio-bubble.component.html',
  styleUrls: ['./cometchat-audio-bubble.component.scss']
})
export class CometChatAudioBubbleComponent implements OnInit {
  @Input() messageObject: CometChat.BaseMessage | null = null;
  @Input() audioUrl: string = '';
  @Input() style:styles = {
	  width: "",
	  height: "",
	  border: "",
	  background: "",
	  borderRadius: "",
  };

  constructor(private messageEvents:CometChatMessageEvents) {}
  ngOnInit() {
    try {
      if(this.audioUrl && (this.audioUrl !== "")) {
        this.audioUrl = this.audioUrl;
      } else if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
        this.getUrl();
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Gets the url of audio to be displayed
   */
  getUrl() {
    try {
      this.audioUrl = (this.messageObject as CometChat.TextMessage).getData().attachments[0].url;
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  audioBubbleStyle(){
    return {
      height:this.style.height,
      width:this.style.width,
      background:this.style.background,
      border:this.style.border,
      borderRadius:this.style.borderRadius
    }
  }
 
}
