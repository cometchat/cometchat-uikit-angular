import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { ListItemStyle } from 'my-cstom-package-lit';
import { UsersStyle } from 'uikit-utils-lerna';


@Component({
  selector: 'cometchat-users-demo',
  templateUrl: './users-demo.component.html',
  styleUrls: ['./users-demo.component.scss']
})
export class UsersDemoComponent implements OnInit {


  usersStyle:any = {

  }



  constructor(private themeService:CometChatThemeService) {


  }

  ngOnInit(): void {
    this.setUsersStyle()
  }
  innerWidth!: number;
  isMobileView: boolean=false;
  listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",

  };
     setListItemStyle(){
      let defaultStyle:ListItemStyle = new ListItemStyle({
        height: "100%",
        width: "100%",
        background: this.themeService.theme.palette.getBackground(),
        borderRadius: "0",
        titleFont: fontHelper(this.themeService.theme.typography.title2),
        titleColor: this.themeService.theme.palette.getAccent(),
        border: "none",
        separatorColor:this.themeService.theme.palette.getAccent200(),
      })
      this.listItemStyle = {...defaultStyle,...this.listItemStyle}
    }
     setUsersStyle(){
      let defaultStyle:UsersStyle = new UsersStyle({
        background:this.themeService.theme.palette.getBackground(),
        border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
        titleTextFont:fontHelper(this.themeService.theme.typography.title1),
        titleTextColor:this.themeService.theme.palette.getAccent(),
        emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
        emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
        errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
        errorStateTextColor:this.themeService.theme.palette.getAccent600(),
        loadingIconTint:this.themeService.theme.palette.getAccent600(),
        separatorColor:this.themeService.theme.palette.getAccent400(),
        onlineStatusColor:this.themeService.theme.palette.getSuccess(),
        sectionHeaderTextColor:this.themeService.theme.palette.getAccent600(),
        sectionHeaderTextFont:fontHelper(this.themeService.theme.typography.subtitle2),
        searchIconTint:this.themeService.theme.palette.getAccent600(),
        searchPlaceholderTextColor:this.themeService.theme.palette.getAccent600(),
        searchBackground:this.themeService.theme.palette.getAccent100(),
        searchPlaceholderTextFont:fontHelper(this.themeService.theme.typography.text3),
        searchTextColor:this.themeService.theme.palette.getAccent600(),
        searchTextFont:fontHelper(this.themeService.theme.typography.text3)
      })
      this.usersStyle = {...defaultStyle,...this.usersStyle}
    }


}
