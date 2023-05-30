import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { AvatarStyle } from 'my-cstom-package-lit';

@Component({
  selector: 'text-bubble-demo',
  templateUrl: './text-bubble-demo.component.html',
  styleUrls: ['./text-bubble-demo.component.scss']
})
export class TextBubbleDemoComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
    senderBubbleStyle:any = {}
    receiverBubbleStyle:any = {}
  constructor(private themeService:CometChatThemeService) { }


  ngOnInit(): void {
    this.senderBubbleStyle = {
      borderRadius:"8px",
      background:this.themeService.theme.palette.getPrimary(),
      textFont: fontHelper(this.themeService.theme.typography.text2),
      textColor: this.themeService.theme.palette.getAccent("dark"),
    }
    this.receiverBubbleStyle = {
      borderRadius:"8px",
      background:this.themeService.theme.palette.getAccent200(),
      textFont: fontHelper(this.themeService.theme.typography.text2),
      textColor: this.themeService.theme.palette.getAccent(),
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

  }


}
