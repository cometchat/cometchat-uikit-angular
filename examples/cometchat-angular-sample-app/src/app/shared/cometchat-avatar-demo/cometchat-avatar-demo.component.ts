import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';

@Component({
  selector: 'cometchat-avatar-demo',
  templateUrl: './cometchat-avatar-demo.component.html',
  styleUrls: ['./cometchat-avatar-demo.component.scss']
})
export class CometChatAvatarDemoComponent implements OnInit {
  public closeIconURL:string="assets/Plus-1.png";
  @Input() theme:CometChatTheme = new CometChatTheme({});
  @Input() closeButton:any;
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png"
  type: string = "";
  activeTab: string = "Image";
  public name:string="Raj"

  constructor() { }
  public height:string="70px";
  public width:string="70px";
  public borderRadius:string="22px";
  public border:string="1px solid grey";
  
  public background:string = "red";
  public textFont:string="600 12px Inter";
  public textColor:string="white";

  ngOnInit(): void {
    this.background = this.theme.palette.getPrimary();
    this.textColor = this.theme.palette.getAccent("dark");
    this.textFont = fontHelper(this.theme.typography.name);
  }
  handleMouseHover(type:string,event:any){
    this.type = event.type == "mouseenter" ? type : "";
  }
  setActiveTab(type:string){
    this.activeTab = type;
  }

  // style
  style:any = {
    closeIconStyle:()=>{
      return{
        WebkitMask: `url(${this.closeIconURL}) center center no-repeat`,
        background:  this.theme.palette.getAccent600(),
        transform:"rotate(45deg)"
       
      }
    },
    titleStyle:()=>{
      return{
       font: fontHelper(this.theme.typography.title2),
       color:this.theme.palette.getAccent(),
       
      }
    },
    modeTitleStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle1),
        color:this.theme.palette.getAccent(),

      }
    },
    wrapperStyle:()=>{
      return{
        background:  this.theme.palette.getBackground(),
        boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 3px`
       
      }
    },
    modeStyle:(type:string)=>{
      return {
        font: fontHelper(this.theme.typography.subtitle1),
        color:this.theme.palette.getAccent(),
         background: this.activeTab == type || this.type == type ? this.theme.palette.getBackground() :  "transparent",
         boxShadow: this.activeTab == type || this.type == type? `${this.theme.palette.getAccent400()} 0px 0px 1px` : "none",
         borderRadius:this.activeTab == type || this.type == type? "12px" : "none",
        
      }
    },
    tabListStyle:()=>{
      return{
        background:this.theme.palette.getAccent100(),
        borderRadius: "12px"
      }
    },
    inputStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600(),
        border: `1px solid ${this.theme.palette.getAccent100()}`,

      }
    },
    cardDescriptionStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600()
  
      }
    },
  }

}
