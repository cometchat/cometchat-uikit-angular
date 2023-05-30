import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { CometChatTheme, CometChatThemeService, CometChatUIKitConstants, localize } from '@cometchat-pro/angular-ui-kit';
import { fontHelper } from '@cometchat-pro/angular-ui-kit';


@Component({
  selector: 'cometchat-users-wrapper',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  public localize:any = localize

  public logoutIconURL:string="assets/logout.svg";
  public soundIconURL:string="assets/sound-small.png";
  public localizeIconURL:string="assets/localize.png";
  public themeIconURL:string="assets/theme.png";
  public sidebarIconURL:string="assets/sidebar.png";
  public listwrapperIconURL:string="assets/listwrapper.png";
  public listIconURL:string="assets/list.png";
  public conversationIconURL:string="assets/conversation.png";
  public detailsIconURL:string = "assets/details.svg"
  constructor(private router: Router,private route: ActivatedRoute,private themeService:CometChatThemeService) {


  }

  ngOnInit(): void {
  }
  redirect(name:string){

    let navigationExtras: NavigationExtras = {
      state: {type:CometChatUIKitConstants.MessageReceiverType.user}
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


