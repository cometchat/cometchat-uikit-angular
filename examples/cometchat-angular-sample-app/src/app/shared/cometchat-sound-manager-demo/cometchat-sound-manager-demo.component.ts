import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatSoundManager } from '@cometchat-pro/angular-ui-kit';
@Component({
  selector: 'cometchat-sound-manager-demo',
  templateUrl: './cometchat-sound-manager-demo.component.html',
  styleUrls: ['./cometchat-sound-manager-demo.component.scss']
})
export class CometChatSoundManagerDemoComponent implements OnInit {
  public closeIconURL:string="assets/Plus-1.png";
  @Input() theme:CometChatTheme = new CometChatTheme({});
  public buttonImage:string="assets/button-opc.png";
  @Input() closeButton:any;
  constructor() { }
  ngOnInit(): void {
  }
playIncoming = ()=>{
  CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage)
}
playOutgoing = ()=>{
  CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage)
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
    subtitleStyle:()=>{
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
