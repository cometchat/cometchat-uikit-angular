import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'cometchat-conversation-view',
  templateUrl: './conversation-view.component.html',
  styleUrls: ['./conversation-view.component.scss']
})
export class ConversationViewComponent implements OnChanges {

  @Input() conversation?: CometChat.Conversation | any;
  name?: string;
  image?: string;
  text?: string;
  count = 0;
  conversationType: string;
  status: string;
  @Input() selected: boolean = true;

  constructor() {

  }

  ngOnChanges() {
    if (typeof (this.conversation) === 'string') {
      this.conversation = Object.assign(JSON.parse(this.conversation) as CometChat.Conversation);
      this.name = this.conversation.conversationWith.name;
      this.count = this.conversation.unreadMessageCount;
      this.conversationType = this.conversation.conversationType;
      this.status = this.conversation.conversationWith.status;
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
        switch (this.conversation.lastMessage.category) {
          case 'message':
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
              case CometChat.MESSAGE_TYPE.AUDIO: {
                this.text = 'AUDIO Message';
                break;
              }
              case CometChat.MESSAGE_TYPE.CUSTOM: {
                this.text = 'Custom Message';
                break;
              }
            }
            break;
          case 'call':
          case CometChat.MESSAGE_TYPE.VIDEO: {
            this.text = 'Video call';
            break;
          }
          case CometChat.MESSAGE_TYPE.AUDIO: {
            this.text = 'Audio call';
            break;
          }
            break;
          case 'action':
            this.text = this.conversation.lastMessage.message;
            break;
          case 'custom':
            this.text = 'some custom message';
            break
        }
        // switch (this.conversation.lastMessage.type) {
        //   case CometChat.MESSAGE_TYPE.TEXT: {
        //     this.text = this.conversation.lastMessage.text;
        //     break;
        //   }
        //   case CometChat.MESSAGE_TYPE.MEDIA: {
        //     this.text = 'Media Message';
        //     break;
        //   }
        //   case CometChat.MESSAGE_TYPE.IMAGE: {
        //     this.text = 'Image Message';
        //     break;
        //   }
        //   case CometChat.MESSAGE_TYPE.FILE: {
        //     this.text = 'File Message';
        //     break;
        //   }
        //   case CometChat.MESSAGE_TYPE.VIDEO: {
        //     this.text = 'Video Message';
        //     break;
        //   }
        //   case CometChat.MESSAGE_TYPE.AUDIO: {
        //     this.text = 'AUDIO Message';
        //     break;
        //   }
        //   case CometChat.MESSAGE_TYPE.CUSTOM: {
        //     this.text = 'Custom Message';
        //     break;
        //   }
        // }
      } else {
        this.text = 'Last Message not found';
      }

    }
  }



}
