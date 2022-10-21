import { Component, Input, OnInit } from '@angular/core';
import { CometChatMessageTemplate, CometChatUIKitHelper, getUnixTimestamp, ID, MessageOption, MessageStatus, MessageTypes } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'custom-message-bubble',
  templateUrl: './custom-message-bubble.component.html',
  styleUrls: ['./custom-message-bubble.component.scss']
})
export class CustomMessageBubbleComponent implements OnInit {
  @Input() customTextView!:any;
  showMessagebubble:boolean=false
  public user!:CometChat.User;
  sentMessageInputData = {
    thumbnail: false,
    title: false,
    time: true,
    readReceipt: true,
  };
  receivedMessageInputData = {
    thumbnail: true,
    title: true,
    time: true,
    readReceipt: false,
  };
  messageTypes:any = []
  constructor(private uikithelper:CometChatUIKitHelper) { }

  ngOnInit(): void {
    let textMessage: any = new CometChat.TextMessage(
      "superhero2",
      "https://www.youtube.com",
      "user"
    );
    textMessage.setSentAt(getUnixTimestamp());
    textMessage.setMuid(ID());
    this.uikithelper.onMessageSent(textMessage, MessageStatus.inprogress)
    CometChat.sendMessage(textMessage)
    .then((message: CometChat.TextMessage | CometChat.BaseMessage) => {
      let messageObject: CometChat.BaseMessage = message;
      this.uikithelper.onMessageSent(messageObject, MessageStatus.success)
      this.showMessagebubble = true
      // Change the send button to reaction button
    })
   
    this.messageTypes = [
      new CometChatMessageTemplate({
        type: MessageTypes.text,
        customView: this.customTextView,
        category:"text",
        
    
      })
    ]
    CometChat.getUser("superhero2").then((user:CometChat.User)=>{
      this.user = user

    })
  }
}
