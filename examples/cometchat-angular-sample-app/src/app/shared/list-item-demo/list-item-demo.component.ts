import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper, localize } from '@cometchat-pro/angular-ui-kit';
import { BadgeStyle, DateStyle, ListItemStyle, AvatarStyle, ReceiptStyle } from 'my-cstom-package-lit';
import { ConversationsStyle, BaseStyle } from 'uikit-utils-lerna';
@Component({
  selector: 'list-item-demo',
  templateUrl: './list-item-demo.component.html',
  styleUrls: ['./list-item-demo.component.scss']
})
export class ListItemDemoComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
  public image:string="https://data-us.cometchat.io/assets/images/avatars/captainamerica.png";
  badgeStyle: BadgeStyle = {
    width: "25px",
    height: "15px",
    background: "#5aaeff",
    textColor: "white",
    textFont: "400 13px Inter, sans-serif",
    borderRadius:"16px"
  }
   dateStyle: DateStyle = {
    textFont: "400 11px Inter, sans-serif",
    textColor: "rgba(20, 20, 20, 0.58)",
  }
   conversationsStyle: ConversationsStyle = {
    width:"",
    height:"",
    border:"",
    borderRadius:"",
  }
   listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",

  };
   statusIndicatorStyle: any = {
    height: "10px",
    width: "10px",
    borderRadius: "16px"
  };
   avatarStyle: AvatarStyle = {};
   receiptStyle:ReceiptStyle = {}
 public user:any = {
  name:"Captain America",
  avatar:this.image,
  status:"online"
 }
 public group:any = {
  name:"Superhero Group",
  membersCount:16
 }
 public memberCount:string = `${this.group.membersCount} Members`
  constructor(private themeService:CometChatThemeService) {
  }
  iconStyle:any = {
    iconTint:"lightgrey",
    height:"20px",
    width:"20px"
  }
  ngOnInit(): void {
 this.setThemeStyle()
  }
    // sets property from theme to style object
    setThemeStyle() {
      this.setAvatarStyle();
      this.setBadgeStyle();
      this.setListItemStyle();
      this.setDateStyle();
      this.setStatusStyle();
      this.setReceiptStyle();
      this.iconStyle.iconTint =    this.themeService.theme.palette.getAccent400();
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
    setAvatarStyle(){
      let defaultStyle:AvatarStyle = new AvatarStyle({
        borderRadius: "24px",
        width: "36px",
        height: "36px",
        border: "none",
        backgroundColor: this.themeService.theme.palette.getAccent700(),
        nameTextColor: this.themeService.theme.palette.getAccent900(),
        backgroundSize: "cover",
        nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
        outerViewBorder: "",
        outerViewBorderSpacing: "",
      })
      this.avatarStyle = {...defaultStyle,...this.avatarStyle}
    }
    setStatusStyle(){
      let defaultStyle:BaseStyle = {
          height: "12px",
          width:"12px",
          border:"none",
          borderRadius:"24px",
      }
      this.statusIndicatorStyle = {...defaultStyle,...this.statusIndicatorStyle}
    }

    setDateStyle(){
      let defaultStyle:DateStyle = new DateStyle({
        textFont: fontHelper(this.themeService.theme.typography.caption2),
        textColor: this.themeService.theme.palette.getAccent600(),
        background:"transparent"
      })
      this.dateStyle = {...defaultStyle,...this.dateStyle}
    }
    setReceiptStyle(){

      let defaultStyle:ReceiptStyle = new ReceiptStyle({
  waitIconTint:this.themeService.theme.palette.getAccent700(),
  sentIconTint:this.themeService.theme.palette.getAccent600(),
  deliveredIconTint:this.themeService.theme.palette.getAccent600(),
  readIconTint:this.themeService.theme.palette.getPrimary(),
  errorIconTint:this.themeService.theme.palette.getError(),
      })
      this.receiptStyle = {...defaultStyle,...this.receiptStyle}
    }
    setBadgeStyle(){
      let defaultStyle:BadgeStyle = new BadgeStyle({
        textFont: fontHelper(this.themeService.theme.typography.subtitle2),
        textColor: this.themeService.theme.palette.getAccent("dark"),
        background:this.themeService.theme.palette.getPrimary(),
        borderRadius:"16px",
        width:"24px",
      })
      this.badgeStyle = {...defaultStyle,...this.badgeStyle}
    }
  // style
  style:any = {
    closeIconStyle:()=>{
      return{
        WebkitMask: `url(${this.closeIconURL}) center center no-repeat`,
        background:  this.themeService.theme.palette.getAccent600(),

      }
    },
    titleStyle:()=>{
      return{
       font: fontHelper(this.themeService.theme.typography.title2),
       color:this.themeService.theme.palette.getAccent(),
      }
    },
    wrapperStyle:()=>{
      return{
        background:  this.themeService.theme.palette.getBackground(),
        boxShadow: `${this.themeService.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },
    cardDescriptionStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.subtitle2),
        color:this.themeService.theme.palette.getAccent600()
      }
    },
    sectionHeaderStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.caption1),
        color:this.themeService.theme.palette.getAccent600()
      }
    }
  }
}
