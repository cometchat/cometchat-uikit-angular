import { Component, OnInit, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'conversation-view',
  templateUrl: './conversation-view.component.html',
  styleUrls: ['./conversation-view.component.scss']
})
export class ConversationViewComponent implements OnInit {

  @Input() conversation?: CometChat.Conversation | any;
  name?: string;
  image?: string;
  text?: string;
  count = 0;

  constructor() {

  }

  ngOnInit() {
    this.conversation = Object.assign(JSON.parse(this.conversation) as CometChat.Conversation);
    this.name = this.conversation.conversationWith.name;
    this.count = this.conversation.unreadMessageCount;
    switch (this.conversation.conversationType) {
      case 'user': {
        this.image = this.conversation.conversationWith.avatar;
        break;
      }
      case 'group': {
        this.image = this.conversation.conversationWith.icon;
        break;
      }
    }

    if (this.conversation.lastMessage) {
      switch (this.conversation.lastMessage.type) {
        case CometChat.MESSAGE_TYPE.TEXT: {
          this.text = this.conversation.lastMessage.text;
          break;
        }
        case CometChat.MESSAGE_TYPE.MEDIA: {
          this.text = 'Media Message';
          break;
        }
        case CometChat.MESSAGE_TYPE.IMAGE: {
          this.text = 'Image Message';
          break;
        }
        case CometChat.MESSAGE_TYPE.FILE: {
          this.text = 'File Message';
          break;
        }
        case CometChat.MESSAGE_TYPE.VIDEO: {
          this.text = 'Video Message';
          break;
        }
        case CometChat.MESSAGE_TYPE.CUSTOM: {
          this.text = 'Custom Message';
          break;
        }
      }
    } else {
      this.text = 'Last Message not found';
    }


  }



}

