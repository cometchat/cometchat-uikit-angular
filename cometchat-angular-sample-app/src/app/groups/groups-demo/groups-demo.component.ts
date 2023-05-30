import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupsStyle } from 'uikit-utils-lerna';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { ListItemStyle } from 'my-cstom-package-lit';

@Component({
  selector: 'cometchat-groups-demo',
  templateUrl: './groups-demo.component.html',
  styleUrls: ['./groups-demo.component.scss']
})
export class GroupsDemoComponent implements OnInit {

  public openUsersWithMessages:boolean = false;
  public openUsers:boolean = false;
  public openUserList:boolean = false;
  public openUserDataItem:boolean = false;
  withMessagesStyle:any={
    width: "100%",
    height: "100%",
    background: "transparent",
    borderRadius: "none",
    border: "none",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
  }
  public image:string="https://data-us.cometchat.io/assets/images/avatars/captainamerica.png";
  public user:any = {
    getName:()=> "Raj Dubey",
    getAvatar:()=> this.image,
    getUid:()=>"uid123",
    getStatus:()=>"online"
  };

  groupsStyle:any = {

  }



  constructor(private themeService:CometChatThemeService) {


  }

  ngOnInit(): void {


    this.setGroupsStyle()
    this.onResize()
  }
  innerWidth!: number;
  isMobileView: boolean=false;
  listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",

  };
    /**
   * Checks when window size is changed in realtime
   */
     @HostListener("window:resize", [])
     onResize(): boolean {
       try {
         this.innerWidth = window.innerWidth;
         if (
           this.innerWidth >= 320 &&
           this.innerWidth <= 760
         ) {
           this.isMobileView = true;
         } else {
           this.isMobileView = false
         }
       } catch (error) {

       }
       return true;
     }
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
    setGroupsStyle(){
      let defaultStyle:GroupsStyle = new GroupsStyle({
        subTitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
        subTitleTextColor: this.themeService.theme.palette.getAccent600(),
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
        privateGroupIconBackground:this.themeService.theme.palette.getSuccess(),
        passwordGroupIconBackground:"RGB(247, 165, 0)",
        searchIconTint:this.themeService.theme.palette.getAccent600(),
        searchPlaceholderTextColor:this.themeService.theme.palette.getAccent600(),
        searchBackground:this.themeService.theme.palette.getAccent100(),
        searchPlaceholderTextFont:fontHelper(this.themeService.theme.typography.text3),
        searchTextColor:this.themeService.theme.palette.getAccent600(),
        searchTextFont:fontHelper(this.themeService.theme.typography.text3)
      })
      this.groupsStyle = {...defaultStyle,...this.groupsStyle}
    }


}
