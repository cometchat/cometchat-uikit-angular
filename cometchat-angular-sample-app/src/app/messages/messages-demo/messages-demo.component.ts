import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CometChat } from '@cometchat-pro/chat';

import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { MessagesStyle } from 'uikit-utils-lerna';

@Component({
  selector: 'cometchat-messages-demo',
  templateUrl: './messages-demo.component.html',
  styleUrls: ['./messages-demo.component.scss']
})
export class MessagesDemoComponent implements OnInit {

  public openMessages:boolean = false;
  public openMessageList:boolean = false;
  public openMessageHeader:boolean = false;
  public openMessageComposer:boolean = false;
  public image:string="https://data-us.cometchat.io/assets/images/avatars/captainamerica.png";
  public user!:CometChat.User;
  messagesStyle: MessagesStyle = {

  };

constructor(private themeService:CometChatThemeService){
  CometChat.getUser("superhero5").then((user:CometChat.User)=>{
    this.user = user

  })
  .catch((error:CometChat.CometChatException)=>{
    console.log(error)
  })
}

  ngOnInit(): void {


    this.setMessagesStyle()
  }
  setMessagesStyle(){
    let defaultStyle:MessagesStyle = new MessagesStyle({
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "none",
      border: "none",
      messageTextColor: this.themeService.theme.palette.getAccent600(),
      messageTextFont: fontHelper(this.themeService.theme.typography.title1),
    })
    this.messagesStyle = {
      ...defaultStyle,
      ...this.messagesStyle
    }
  }

}
