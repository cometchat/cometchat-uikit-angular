import { Component, OnInit } from '@angular/core';
import { MessageOption, MessageTypes } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'exclude-message-options',
  templateUrl: './exclude-message-options.component.html',
  styleUrls: ['./exclude-message-options.component.scss']
})
export class ExcludeMessageOptionsComponent implements OnInit {

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
  excludeMessageOptions = [MessageOption.editMessage, MessageOption.deleteMessage,MessageOption.copyMessage]
  constructor() { }

  ngOnInit(): void {
    CometChat.getUser("superhero2").then((user:CometChat.User)=>{
      this.user = user

    })
  }

}
