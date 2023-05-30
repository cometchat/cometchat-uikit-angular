import { Component, HostListener, OnInit } from '@angular/core';
import { GroupsStyle } from 'uikit-utils-lerna';
import {CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { ListItemStyle } from 'my-cstom-package-lit';
import 'my-cstom-package-lit'
import { CometChat } from '@cometchat-pro/chat';
@Component({
  selector: 'cometchat-banned-members-demo',
  templateUrl: './banned-members-demo.component.html',
  styleUrls: ['./banned-members-demo.component.scss']
})
export class BannedMembersDemoComponent implements OnInit {
  group!:CometChat.Group;
  constructor(private themeService:CometChatThemeService) {
    CometChat.getGroup("supergroup").then((group:CometChat.Group)=>{
      this.group = group
    })
    .catch((error:CometChat.CometChatException)=>{
      console.log(error)
    })
  }
  ngOnInit(): void {
  }
  wrapperStyle = () => {
    return {
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
    }
  }
}
