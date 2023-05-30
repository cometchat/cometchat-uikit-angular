import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';

import { CometChatLocalize, CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
@Component({
  selector: 'localize-demo',
  templateUrl: './localize-demo.component.html',
  styleUrls: ['./localize-demo.component.scss']
})
export class LocalizeDemoComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png"
  type: string = "";
  activeTab: string = "English";
  public buttonImage:string="assets/button-opc.png";
  constructor(private router: Router,private route: ActivatedRoute,private themeService:CometChatThemeService) { }
  public height:string="60px";
  public width:string="60px";
  public borderRadius:string="30px";
  public border:string="1px solid grey";
  ngOnInit(): void {
  }
  redirect(name:string){
    let language = "en"
    if(this.activeTab == "English"){
      language = "en"
    }
    else{
      language = "hi"
    }

      let navigationExtras: NavigationExtras = {
    state: {pageName:name,pageLanguage:language }
};
  this.router.navigate(['/conversations-with-messages'],navigationExtras);
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
    buttonStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.subtitle1),
        color:this.themeService.theme.palette.getAccent("dark"),
        backgroundColor:this.themeService.theme.palette.getPrimary(),
        backgroundImage: `url(${this.buttonImage})`
      }
    },
  }
}
