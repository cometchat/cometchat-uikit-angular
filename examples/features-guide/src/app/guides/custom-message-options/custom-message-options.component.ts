import { Component, OnInit } from '@angular/core';
import { MessageOption, MessageOptionForConstants, MessageOptions } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'custom-message-options',
  templateUrl: './custom-message-options.component.html',
  styleUrls: ['./custom-message-options.component.scss']
})
export class CustomMessageOptionsComponent implements OnInit {
public pinnedMessage:any
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
  customOptions:MessageOptions[] = [

  ]
  constructor() { }
   messagePinned = (message:CometChat.BaseMessage)=>{
    this.pinnedMessage = message
    CometChat.callExtension('pin-message', 'POST', 'v1/pin', {
      "msgId": message.getId() // The ID of the message to be pinned. Here 280.
  }).then(response => {
    this.pinnedMessage = message
  })
  .catch(error => {
    this.pinnedMessage = null
      // Error occurred
  });
   
   }
  ngOnInit(): void {
    this.customOptions = [
      new MessageOptions({
        id:"custom__option",
        title:"pin message",
        optionFor: MessageOptionForConstants.both,
        iconURL:"assets/pin.png",
        callBack:this.messagePinned

    
      })
    ]
    CometChat.getUser("superhero2").then((user:CometChat.User)=>{
      this.user = user

    })
  }

}
