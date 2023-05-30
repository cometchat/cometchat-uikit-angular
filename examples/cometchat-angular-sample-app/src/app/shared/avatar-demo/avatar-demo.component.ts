import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { AvatarStyle } from 'my-cstom-package-lit';

@Component({
  selector: 'avatar-demo',
  templateUrl: './avatar-demo.component.html',
  styleUrls: ['./avatar-demo.component.scss']
})
export class AvatarDemoComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png"
  type: string = "";
  activeTab: string = "Image";
  public name:string="Raj"
  borderRadius:string = ""
  constructor(private themeService:CometChatThemeService) { }


  ngOnInit(): void {
console.log("open")
    this.setAvatarStyle()
  }
  updateBorderRadius(ev:any){
    this.avatarStyle = {
      borderRadius: ev + "px",
      width: "36px",
      height: "36px",
      border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
      backgroundColor: this.themeService.theme.palette.getAccent700(),
      nameTextColor: this.themeService.theme.palette.getAccent900(),
      backgroundSize: "cover",
      nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      outerViewBorder: "",
      outerViewBorderSpacing: "",
    }
  }
  handleMouseHover(type:string,event:any){
    this.type = event.type == "mouseenter" ? type : "";
  }
  setActiveTab(type:string){
    this.activeTab = type;
  }
  avatarStyle: AvatarStyle = {};
  setAvatarStyle(){
    let defaultStyle:AvatarStyle = new AvatarStyle({
      borderRadius: "",
      width: "36px",
      height: "36px",
      border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
      backgroundColor: this.themeService.theme.palette.getAccent700(),
      nameTextColor: this.themeService.theme.palette.getAccent900(),
      backgroundSize: "cover",
      nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      outerViewBorder: "",
      outerViewBorderSpacing: "",
    })
    this.avatarStyle = {...defaultStyle,...this.avatarStyle}
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
    modeTitleStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.subtitle1),
        color:this.themeService.theme.palette.getAccent(),

      }
    },
    wrapperStyle:()=>{
      return{
        background:  this.themeService.theme.palette.getBackground(),
        boxShadow: `${this.themeService.theme.palette.getAccent400()} 0px 0px 3px`

      }
    },
    modeStyle:(type:string)=>{
      return {
        font: fontHelper(this.themeService.theme.typography.subtitle1),
        color:this.themeService.theme.palette.getAccent(),
         background: this.activeTab == type || this.type == type ? this.themeService.theme.palette.getBackground() :  "transparent",
         boxShadow: this.activeTab == type || this.type == type? `${this.themeService.theme.palette.getAccent400()} 0px 0px 1px` : "none",
         borderRadius:this.activeTab == type || this.type == type? "12px" : "none",

      }
    },
    tabListStyle:()=>{
      return{
        background:this.themeService.theme.palette.getAccent100(),
        borderRadius: "12px"
      }
    },
    inputStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.subtitle2),
        color:this.themeService.theme.palette.getAccent600(),
        border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,

      }
    },
    cardDescriptionStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.subtitle2),
        color:this.themeService.theme.palette.getAccent600()

      }
    },
  }

}
