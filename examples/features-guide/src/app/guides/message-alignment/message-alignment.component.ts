import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'message-alignment',
  templateUrl: './message-alignment.component.html',
  styleUrls: ['./message-alignment.component.scss']
})
export class MessageAlignmentComponent implements OnInit {
  public group!:CometChat.Group;

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
  constructor() { }

  ngOnInit(): void {
    CometChat.getGroup("supergroup").then((group:CometChat.Group)=>{
      this.group = group

    })
  }

}
