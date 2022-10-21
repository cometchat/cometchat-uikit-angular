import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-message-list-demo',
  templateUrl: './message-list-demo.component.html',
  styleUrls: ['./message-list-demo.component.scss']
})
export class MessageListDemoComponent implements OnInit {
  @Input() theme = new CometChatTheme({})
  public group!:CometChat.Group;
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme
    }

  }
  messageListStyle:any={
    width: "100%",
    height: "100%",
    background: "transparent",
    borderRadius: "none",
    border: "none",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
  }
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

  ngOnInit(): void {
    CometChat.getGroup("supergroup").then((group:CometChat.Group)=>{
      this.group = group

    })
    this.setTheme()
  }
  setTheme(){

    this.messageListStyle.background = this.theme.palette.getBackground()

  }

}
