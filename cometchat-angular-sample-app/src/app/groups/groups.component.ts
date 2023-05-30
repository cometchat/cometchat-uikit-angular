import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatTheme, CometChatThemeService, CometChatUIKitConstants, fontHelper, localize } from '@cometchat-pro/angular-ui-kit';


@Component({
  selector: 'cometchat-groups-wrapper',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {
  public localize:any = localize

  public logoutIconURL:string="assets/logout.svg";
  public soundIconURL:string="assets/sound-small.png";
  public localizeIconURL:string="assets/localize.png";
  public themeIconURL:string="assets/theme.png";
  public sidebarIconURL:string="assets/sidebar.png";
  public listwrapperIconURL:string="assets/listwrapper.png";
  public listIconURL:string="assets/list.png";
  public conversationIconURL:string="assets/conversation.png";
  public createGroupIconURL:string = "assets/create-group.svg"
  public joinGroupIconURL:string = "assets/password-group.svg"
  public groupMemberIconURL:string = "assets/group-member.svg"
  public addMemberIconURL:string = "assets/add-members.svg"
  public transferOwnershipIconURL:string = "assets/transfer-ownership-icon.svg"
  public banMembersIconURL:string = "assets/ban-members.svg"
  public detailsIconURL:string = "assets/details.svg"

  constructor(private router: Router,private route: ActivatedRoute,private themeService:CometChatThemeService) {





  }

  ngOnInit(): void {
  }
  redirect(name:string){
      let navigationExtras: NavigationExtras = {
    state: {type:CometChatUIKitConstants.MessageReceiverType.group}
};
    this.router.navigate([name],navigationExtras);


  }
  // styles
style:any={
  sidebarStyle:()=>{
    return{
      background:this.themeService.theme.palette.getSecondary()

    }
  },
  headerTitleStyle:()=>{
    return{
      font: fontHelper(this.themeService.theme.typography.heading),
      color:this.themeService.theme.palette.getAccent()
    }
  },
  cardTitleStyle:()=>{
    return{
      font: fontHelper(this.themeService.theme.typography.title2),
      color:this.themeService.theme.palette.getAccent()
    }
  },
  cardStyle:()=>{
    return{
     background:this.themeService.theme.palette.getBackground(),
     boxShadow: `${this.themeService.theme.palette.getAccent400()} 0px 0px 5px`
    }
  },
  cardDescriptionStyle:()=>{
    return{
      font: fontHelper(this.themeService.theme.typography.subtitle2),
      color:this.themeService.theme.palette.getAccent600()

    }
  },
  footerStyle:()=>{
    return{
      font: fontHelper(this.themeService.theme.typography.subtitle2),
      color:this.themeService.theme.palette.getAccent500()

    }
  },
  iconStyle:(icon:string)=>{
    return{
      WebkitMask: `url(${icon}) center center no-repeat`,
      background:this.themeService.theme.palette.getAccent() ,
      height:"28px",
      width:"fit-content"

    }
  },
  logoutIoncStyle:()=>{
    return{
      WebkitMask: `url(${this.logoutIconURL}) center center no-repeat`,
      background:"black",
      height:"24px",
      width:"24px"

    }
  },
}
}
