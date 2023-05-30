import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';

import { CometChatPalette, CometChatTheme, CometChatThemeService, fontHelper,  } from '@cometchat-pro/angular-ui-kit';

@Component({
  selector: 'theme-demo',
  templateUrl: './theme-demo.component.html',
  styleUrls: ['./theme-demo.component.scss']
})
export class ThemeDemoComponent implements OnInit {

  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png"
  type: string = "";
  activeTab: string = "Default";
  public buttonImage:string="assets/button-opc.png";
  constructor(private router: Router,private route: ActivatedRoute,private themeService:CometChatThemeService) { }
  public height:string="60px";
  public width:string="60px";
  public borderRadius:string="30px";
  public border:string="1px solid grey";



  ngOnInit(): void {

  }
  handleMouseHover(type:string,event:any){
    this.type = event.type == "mouseenter" ? type : "";
  }
  redirect(name:string){
    if(this.activeTab == "Default"){
      ;


    }
     else{
      this.themeService.theme = new CometChatTheme({
        palette: new CometChatPalette({
          mode: this.themeService.theme.palette.mode,
          primary: {
            light: "#D422C2",
            dark: "#D422C2",
          },
          accent: {
            light: "#07E676",
            dark: "#B6F0D3",
          },
          accent50: {
            light: "#39f",
            dark: "#141414",
          },
          accent900: {
            light: "white",
            dark: "black",
          },
        }),

      });

    }

      let navigationExtras: NavigationExtras = {
    state: {customTheme:this.activeTab == "Default" ? false : true }
};
  this.router.navigate(['/conversations-with-messages'],navigationExtras);


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
