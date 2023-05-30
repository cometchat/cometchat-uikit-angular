import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';

import { MessageListStyle } from 'uikit-utils-lerna';

@Component({
  selector: 'cometchat-message-list-demo',
  templateUrl: './message-list-demo.component.html',
  styleUrls: ['./message-list-demo.component.scss']
})
export class MessageListDemoComponent implements OnInit {

  public user!:CometChat.User;
  constructor(private themeService:CometChatThemeService) {

    CometChat.getUser("superhero5").then((user:CometChat.User)=>{
      this.user = user

    })
    .catch((error:CometChat.CometChatException)=>{
      console.log(error)
    })

  }
  messageListStyle: MessageListStyle = {
    nameTextFont: "600 15px Inter",
    nameTextColor: "white",
    TimestampTextFont: "",
    TimestampTextColor: "",
    threadReplySeparatorColor: "",
    threadReplyTextFont: "",
    threadReplyIconTint: "",
    threadReplyTextColor: "",
    emptyStateTextFont: "700 22px Inter",
    emptyStateTextColor: "#bcbcbc",
    errorStateTextFont: "700 22px Inter",
    errorStateTextColor: "#bcbcbc",
    loadingIconTint: "grey",
  };
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

    this.setMessagesStyle()
  }
  setMessagesStyle(){
    let defaultStyle:MessageListStyle = new MessageListStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`none`,
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      nameTextFont: fontHelper(this.themeService.theme.typography.title2),
      nameTextColor: this.themeService.theme.palette.getAccent600(),
      threadReplySeparatorColor: this.themeService.theme.palette.getAccent400(),
      threadReplyTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      threadReplyIconTint: this.themeService.theme.palette.getAccent600(),
      threadReplyTextColor: this.themeService.theme.palette.getAccent600(),
      TimestampTextFont: fontHelper(this.themeService.theme.typography.caption2),
      TimestampTextColor: this.themeService.theme.palette.getAccent600(),
    })
    this.messageListStyle = {...defaultStyle,...this.messageListStyle}
  }

}
