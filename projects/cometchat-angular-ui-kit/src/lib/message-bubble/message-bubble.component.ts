import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent implements OnChanges {

  @Input() sender = false;
  @Input() message;
  cometchat = CometChat;
  messagesConstants = {};

  constructor() { }


  ngOnChanges() {
    this.message = JSON.parse(this.message);
    this.messagesConstants = CometChat.MessageConstatnts;
  }

}




