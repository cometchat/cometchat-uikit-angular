import { Component, OnInit, Input, ChangeDetectorRef, OnChanges } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'message-list-footer',
  templateUrl: './message-list-footer.component.html',
  styleUrls: ['./message-list-footer.component.scss']
})
export class MessageListFooterComponent implements OnChanges {
  placeHolder = 'Enter your text here';

  @Input() user?: any;
  @Input() group?;
  @Input() text = this.placeHolder;
  @Input() onMessageSent: (baseMessage: CometChat.BaseMessage) => void;
  @Input() onAction?: (args1: string, args2?: CometChat.BaseMessage | any) => void;

  constructor(private cdRef: ChangeDetectorRef) {
  }

  ngOnChanges() {
    this.init();
  }

  init() {
    if (this.user) {
      this.user = JSON.parse(this.user);
    } else {
      this.group = JSON.parse(this.group);
    }
  }


  onActive = (event) => {
    if (event.target.innerText === this.placeHolder) {
      event.target.innerText = '';
    }

  }
  onBlur = (event) => {
    if (event.target.innerText.trim() === '') {
      event.target.innerText = this.placeHolder;
    }
    console.log("On Blur", event.target.innerText);
  }

  onActionGenerated = (event, action) => {
    this.onAction(action);
    console.log('message_composer_icon_clicked', event, action);
  }

  onchangeDetect = (event, j?) => {
    if (event.keyCode === 13 && event.shiftKey) {
      console.log(' I am shift enter', event.srcElement.innerText);
    } else if (event.keyCode === 13) {
      event.preventDefault();
      let receiverID;

      let receiverType;
      if (this.group) {
        receiverID = this.group.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      } else {
        receiverID = this.user.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      }
      const messageText = event.srcElement.innerText.toString();
      const textMessage = new CometChat.TextMessage(
        receiverID,
        messageText,
        receiverType
      );
      event.srcElement.innerText = '';
      this.cdRef.detectChanges();
      CometChat.sendMessage(textMessage).then(
        (message: CometChat.BaseMessage) => {
          console.log('Message sent successfully:', message);
          if (this.onMessageSent) {
            this.onMessageSent(message);
          }
          if (this.onAction) {
            this.onAction('message_sent', message);
          }

        },
        error => {
          console.log('Message sending failed with error:', error);
        }
      );
      return false;
    }

  }




}
