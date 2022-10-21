import { Component, OnInit } from '@angular/core';
import { MessageComposerConfiguration, MessageTypes } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'exclude-message-types',
  templateUrl: './exclude-message-types.component.html',
  styleUrls: ['./exclude-message-types.component.scss']
})
export class ExcludeMessageTypesComponent implements OnInit {

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
  excludeMessageType = [MessageTypes.text, MessageTypes.image, MessageTypes.file ,MessageTypes.poll,MessageTypes.sticker,MessageTypes.document]
  constructor() { }

  ngOnInit(): void {
    CometChat.getUser("superhero2").then((user:CometChat.User)=>{
      this.user = user

    })
  }

}
