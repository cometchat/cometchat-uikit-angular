import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';

@Component({
  selector: 'cometchat-badge-count-demo',
  templateUrl: './cometchat-badge-count-demo.component.html',
  styleUrls: ['./cometchat-badge-count-demo.component.scss']
})
export class CometChatBadgeCountComponent implements OnInit {
  public closeIconURL:string="assets/Plus-1.png";
  @Input() theme:CometChatTheme = new CometChatTheme({});
  @Input() closeButton:any;
public image:string="https://data-us.cometchat.io/assets/images/avatars/ironman.png";
  type: string = "";
  public name:string="Raj";
  public colors:string[] = []
    

  constructor() { }
  public height:string="30px";
  public width:string="50px";
  public borderRadius:string="22px";
  public count:number=22;

  
  public background:string = "red";
  public textFont:string="600 12px Inter";
  public textColor:string="white";

  ngOnInit(): void {
    // this.theme.palette.setMode("dark")
    this.background = this.theme.palette.getPrimary();
    this.textColor = this.theme.palette.getAccent("dark");
    this.textFont = fontHelper(this.theme.typography.name);
    this.setColorPicker()
  }
  setColorPicker(){
    this.colors = [
      this.theme.palette.getPrimary(),
      this.theme.palette.getError(),
      this.theme.palette.getAccent600(),
      this.theme.palette.getSuccess(),
      this.theme.palette.getAccent700()

    ]

  }
  handleMouseHover(type:string,event:any){
    this.type = event.type == "mouseenter" ? type : "";
  }
  setActiveTab(type:string){
    this.background = type;
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
    modeStyle:(color:string)=>{
      return {

         background: this.background ==  color || this.type ==  color ? color : this.theme.palette.getSecondary(),

        
      }
    },
    tabListStyle:()=>{
      return{
        background:this.theme.palette.getSecondary(),
  
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
