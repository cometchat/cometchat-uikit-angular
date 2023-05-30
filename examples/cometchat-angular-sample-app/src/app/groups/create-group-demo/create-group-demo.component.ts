import { Component, HostListener, OnInit } from '@angular/core';
import { GroupsStyle } from 'uikit-utils-lerna';
import {CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CreateGroupStyle, JoinGroupStyle, ListItemStyle } from 'my-cstom-package-lit';
import 'my-cstom-package-lit'
import { CometChat } from '@cometchat-pro/chat';
@Component({
  selector: 'cometchat-create-group-demo',
  templateUrl: './create-group-demo.component.html',
  styleUrls: ['./create-group-demo.component.scss']
})
export class CreateGroupDemoComponent implements OnInit {
  createGroupStyle:CreateGroupStyle = {}

  constructor(private themeService:CometChatThemeService) {


  }
createGroup = (ev:any)=>{
console.log("Group Created.")
}
  ngOnInit(): void {
    this.setCreateGroupStyles()
  }

  setCreateGroupStyles = ()=>{
    this.createGroupStyle = new CreateGroupStyle({
      boxShadow: `${this.themeService.theme.palette.getAccent100()} 4px 16px 32px 4px`,
      groupTypeTextFont:  fontHelper(this.themeService.theme.typography.subtitle2),
      groupTypeBorder: `1px solid ${this.themeService.theme.palette.getAccent600()}`,
      groupTypeBorderRadius: "0",
      groupTypeTextColor:  this.themeService.theme.palette.getAccent(),
      groupTypeTextBackground: "transparent",
      groupTypeBackground: this.themeService.theme.palette.getAccent100(),
      groupTypeBoxShadow: "",
      activeGroupTypeTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      activeGroupTypeTextColor: this.themeService.theme.palette.getAccent(),
      activeGroupTypeBackground: this.themeService.theme.palette.getAccent900(),
      activeGroupTypeBoxShadow: `${this.themeService.theme.palette.getAccent200()} 0 3px 8px 0`,
      activeGroupTypeBorderRadius: "8px",
      activeGroupTypeBorder: "none",
      groupTypeTextBoxShadow: "none",
      groupTypeTextBorderRadius: "0",
      closeIconTint: this.themeService.theme.palette.getPrimary(),
      titleTextFont:  fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:  this.themeService.theme.palette.getAccent(),
      errorTextFont:  fontHelper(this.themeService.theme.typography.subtitle1),
      errorTextBackground: this.themeService.theme.palette.getError(),
      errorTextBorderRadius: "8px",
      errorTextBorder: "none",
      errorTextColor:  this.themeService.theme.palette.getError(),
      nameInputPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      nameInputPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      nameInputBackground: this.themeService.theme.palette.getAccent100(),
      nameInputTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      nameInputTextColor: this.themeService.theme.palette.getAccent(),
      nameInputBorder:  "none",
      nameInputBorderRadius:  "8px",
      nameInputBoxShadow: `${this.themeService.theme.palette.getAccent100()} 0 0 0 1px`,
      passwordInputPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      passwordInputBackground: this.themeService.theme.palette.getAccent100(),
      passwordInputBorder:  "none",
      passwordInputBorderRadius:  "8px",
      passwordInputBoxShadow: `${this.themeService.theme.palette.getAccent100()} 0 0 0 1px`,
      passwordInputTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputTextColor: this.themeService.theme.palette.getAccent(),
      createGroupButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
      createGroupButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
      createGroupButtonBackground: this.themeService.theme.palette.getPrimary(),
      createGroupButtonBorderRadius: "8px",
      createGroupButtonBorder: "none",
      height:"620px",
      width:"360px",
      borderRadius:"8px",
      background:this.themeService.theme.palette.getBackground()
    })


  }


}
