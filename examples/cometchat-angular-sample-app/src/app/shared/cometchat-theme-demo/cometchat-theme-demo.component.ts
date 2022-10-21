import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { CometChatServices } from '../../../app/app.service';
import { CometChatTheme, fontHelper, Palette, Typography } from '@cometchat-pro/angular-ui-kit';

@Component({
  selector: 'cometchat-theme-demo',
  templateUrl: './cometchat-theme-demo.component.html',
  styleUrls: ['./cometchat-theme-demo.component.scss']
})
export class CometChatThemeDemoComponent implements OnInit {

  public closeIconURL:string="assets/Plus-1.png";
  @Input() theme:CometChatTheme = new CometChatTheme({});
  @Input() closeButton:any;
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png"
  type: string = "";
  activeTab: string = "Default";
  public buttonImage:string="assets/button-opc.png";
  constructor(private router: Router,private route: ActivatedRoute,private cometchatService:CometChatServices) { }
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
      this.cometchatService.theme = this.theme;


    }
     else{
      this.cometchatService.customTheme = new CometChatTheme({
        palette: new Palette({
          mode: "light",
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
    state: {pageName:name }
};
  this.router.navigate(['/conversations-with-messages']);


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
         borderRadius:this.activeTab == type || this.type == type? "8px" : "none",
        
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
    buttonStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle1),
        color:this.theme.palette.getAccent("dark"),
        backgroundColor:this.theme.palette.getPrimary(),
        backgroundImage: `url(${this.buttonImage})`

      }
    },
  }


}
