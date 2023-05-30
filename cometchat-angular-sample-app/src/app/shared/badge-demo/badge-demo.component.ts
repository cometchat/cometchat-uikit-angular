import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { BadgeStyle } from 'my-cstom-package-lit';

@Component({
  selector: 'badge-demo',
  templateUrl: './badge-demo.component.html',
  styleUrls: ['./badge-demo.component.scss']
})
export class BadgeComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
  count:number = 10
  badgeStyle: BadgeStyle = {

  }
  public background:string = ""
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png";
  type: string = "";
  public name:string="Raj";
  public colors:any[] = []


  constructor(private themeService:CometChatThemeService) { }


  ngOnInit(): void {
    this.setColorPicker()
    this.setBadgeStyle()
  }
  setBadgeStyle(){
    let defaultStyle:BadgeStyle = new BadgeStyle({
      textFont: fontHelper(this.themeService.theme.typography.subtitle2),
      textColor: this.themeService.theme.palette.getAccent("dark"),
      background:this.themeService.theme.palette.getPrimary(),
      borderRadius:"16px",
      width:"fit-content",
      height:"16px"
    })
    this.badgeStyle = {...defaultStyle,...this.badgeStyle}
  }
  setColorPicker(){
    this.colors = [
      this.themeService.theme.palette.getPrimary(),
      this.themeService.theme.palette.getError(),
      this.themeService.theme.palette.getAccent600(),
      this.themeService.theme.palette.getSuccess(),


    ]

  }
  handleMouseHover(type:string,event:any){
    this.type = event.type == "mouseenter" ? type : "";
  }
  setActiveTab(type:string){
    this.background = type
  this.badgeStyle = {
    textFont: fontHelper(this.themeService.theme.typography.subtitle2),
    textColor: this.themeService.theme.palette.getAccent("dark"),
    background:type,
    width:  "fit-content",
    height:"16px",
    borderRadius:"16px",
  }

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
    modeStyle:(color:string)=>{
      return {

         background: color,


      }
    },
    tabListStyle:()=>{
      return{
        background:this.themeService.theme.palette.getSecondary(),

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
