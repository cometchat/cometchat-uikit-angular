import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-message-header-demo',
  templateUrl: './message-header-demo.component.html',
  styleUrls: ['./message-header-demo.component.scss']
})
export class MessageHeaderDemoComponent implements OnInit {
  public group!:CometChat.Group;
  @Input() theme = new CometChatTheme({})
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme
    }

  }

  ngOnInit(): void {
    CometChat.getGroup("supergroup").then((group:CometChat.Group)=>{
      this.group = group

    })
  }

}
