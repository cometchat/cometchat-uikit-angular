import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';

@Component({
  selector: 'status-indicator-demo',
  templateUrl: './status-indicator-demo.component.html',
  styleUrls: ['./status-indicator-demo.component.scss']
})
export class StatusIndicatorDemoComponent implements OnInit {

  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png"
  type: string = "";
  activeTab: string = "online";
  public name:string="Raj"

  constructor(private themeService:CometChatThemeService) { }
  public height:string="60px";
  public width:string="60px";
  public borderRadius:string="30px";
  public border:string="1px solid grey";

  public background:string | undefined = "";
  public statusIndicatorStyle:any = {
    height:"18px",
    width:"18px",
    borderRadius:"50%"
  }
  ngOnInit(): void {
    this.background = this.themeService.theme.palette.getSuccess();
  }
  handleMouseHover(type:string,event:any){
    this.type = event.type == "mouseenter" ? type : "";
  }
  setActiveTab(type:string){
    this.activeTab = type;
    if(type == "online"){
      this.background = this.themeService.theme.palette.getSuccess();
    }
    else{
      this.background = this.themeService.theme.palette.getAccent600();
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
    modeStyle:(type:string)=>{
      return {
        font: fontHelper(this.themeService.theme.typography.subtitle1),
        color:this.themeService.theme.palette.getAccent(),
         background: this.activeTab == type || this.type == type ? this.themeService.theme.palette.getBackground() :  "transparent",
         boxShadow: this.activeTab == type || this.type == type? `${this.themeService.theme.palette.getAccent400()} 0px 0px 1px` : "none",
         borderRadius:this.activeTab == type || this.type == type? "8px" : "none",

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
