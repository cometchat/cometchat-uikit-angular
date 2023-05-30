import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatSoundManager } from 'uikit-utils-lerna';
@Component({
  selector: 'sound-manager-demo',
  templateUrl: './sound-manager-demo.component.html',
  styleUrls: ['./sound-manager-demo.component.scss']
})
export class SoundManagerDemoComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  public buttonImage:string="assets/button-opc.png";
  @Input() closeButton:any;
  constructor(private themeService:CometChatThemeService) { }
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
        background:  this.themeService.theme.palette.getAccent600(),

      }
    },
    titleStyle:()=>{
      return{
       font: fontHelper(this.themeService.theme.typography.title2),
       color:this.themeService.theme.palette.getAccent(),
      }
    },
    subtitleStyle:()=>{
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
