import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CometChatTheme, fontHelper, localize } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../app.service';

@Component({
  selector: 'cometchat-shared-wrapper',
  templateUrl: './shared.component.html',
  styleUrls: ['./shared.component.scss']
})
export class SharedComponent implements OnInit {
  @Input() theme = new CometChatTheme({})
  public localize:any = localize
  public logoutIconURL:string="assets/logout.svg";
  public soundIconURL:string="assets/sound-small.png";
  public localizeIconURL:string="assets/localize.png";
  public themeIconURL:string="assets/theme.png";
  public conversationIconURL:string="assets/conversation.png";
  public avatarIconURL:string="assets/avatar.png";
  public statusIconURL:string="assets/status.png";
  public badgeIconURL:string="assets/badge.png";
  public receiptIconURL:string="assets/receipt.png";
  public openDataItem:boolean=false;
  public openAvatar:boolean=false;
  public openBadgeCount:boolean=false;
  public openMessageReceipt:boolean=false;
  public openConversationListItem:boolean=false
  public openStatusIndicator:boolean = false;
  public openSoundManager:boolean=false;
  public openTheme:boolean=false;
  public openLocalize:boolean =false;
  


  constructor(private router: Router,private route: ActivatedRoute, private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme
   
    }

  }

  ngOnInit(): void {
  }
  openModal = (name:string)=>{
    if(name == 'dataItem'){
      this.openDataItem = true;
    }
    else if(name == "avatar"){
      this.openAvatar = true;
    }
    else if(name == "badgeCount"){
      this.openBadgeCount = true
    }
    else if(name == "messageReceipt"){
      this.openMessageReceipt=true
    }
    else if(name == "conversationListItem"){
      this.openConversationListItem=true
    }
    else if(name == 'statusIndicator'){
      this.openStatusIndicator = true;
    }
    else if(name == 'soundManager'){
      this.openSoundManager = true;
    }
    else if(name == 'theme'){
      this.openTheme = true;
    }
    else if(name == 'localize'){
      this.openLocalize = true;
    }
    
  }
  closeModal = ()=>{
    this.openDataItem = false;
    this.openBadgeCount = false
    this.openAvatar = false;
    this.openMessageReceipt=false;
    this.openConversationListItem=false;
    this.openStatusIndicator = false;
    this.openSoundManager = false;
    this.openTheme = false;
    this.openLocalize =false;
  }
  // styles
style:any={
  sidebarStyle:()=>{
    return{
      background:this.theme.palette.getSecondary()

    }
  },
  headerTitleStyle:()=>{
    return{
      font: fontHelper(this.theme.typography.heading),
      color:this.theme.palette.getAccent()
    }
  },
  sectionHeaderStyle:()=>{
    return{
      font: fontHelper(this.theme.typography.subtitle2),
      color:this.theme.palette.getAccent400()
    }
  },
  cardTitleStyle:()=>{
    return{
      font: fontHelper(this.theme.typography.title2),
      color:this.theme.palette.getAccent()
    }
  },
  cardStyle:()=>{
    return{
     background:this.theme.palette.getBackground(),
     boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 5px`
    }
  },
  cardDescriptionStyle:()=>{
    return{
      font: fontHelper(this.theme.typography.subtitle2),
      color:this.theme.palette.getAccent600()

    }
  },
  footerStyle:()=>{
    return{
      font: fontHelper(this.theme.typography.subtitle2),
      color:this.theme.palette.getAccent500()

    }
  },
  iconStyle:(icon:string)=>{
    return{
      WebkitMask: `url(${icon}) center center no-repeat`,
      background:this.theme.palette.getAccent() ,
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
