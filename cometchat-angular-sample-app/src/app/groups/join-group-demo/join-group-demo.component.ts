import { Component, HostListener, OnInit } from '@angular/core';
import { GroupsStyle } from 'uikit-utils-lerna';
import {CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { JoinGroupStyle, ListItemStyle } from 'my-cstom-package-lit';
import 'my-cstom-package-lit'
@Component({
  selector: 'cometchat-join-group-demo',
  templateUrl: './join-group-demo.component.html',
  styleUrls: ['./join-group-demo.component.scss']
})
export class JoinGroupDemoComponent implements OnInit {

  joinGroupStyle:JoinGroupStyle = {}

  constructor(private themeService:CometChatThemeService) {


  }

  ngOnInit(): void {
    this.setJoinGroupStyles()
  }
  setJoinGroupStyles = ()=>{
    this.joinGroupStyle = new JoinGroupStyle({
      boxShadow: `${this.themeService.theme.palette.getAccent100()} 0px 16px 32px 0px`,
      titleTextFont:  fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:  this.themeService.theme.palette.getAccent(),
      passwordInputPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      passwordInputBackground: this.themeService.theme.palette.getAccent100(),
      passwordInputBorder:  "none",
      passwordInputBorderRadius:  "8px",
      passwordInputBoxShadow: `${this.themeService.theme.palette.getAccent100()} 0 0 0 1px`,
      passwordInputTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputTextColor: this.themeService.theme.palette.getAccent(),
      height:"100%",
      width:"100%",
joinButtonTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
joinButtonTextColor: this.themeService.theme.palette.getAccent("dark"),
joinButtonBackground: this.themeService.theme.palette.getPrimary(),
joinButtonBorderRadius: "8px",
joinButtonBorder: "none",
background:this.themeService.theme.palette.getBackground()
    })


  }





}
