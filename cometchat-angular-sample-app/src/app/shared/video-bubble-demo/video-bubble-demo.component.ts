import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { AvatarStyle } from 'my-cstom-package-lit';

@Component({
  selector: 'video-bubble-demo',
  templateUrl: './video-bubble-demo.component.html',
  styleUrls: ['./video-bubble-demo.component.scss']
})
export class VideoBubbleDemoComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
    bubbleStyle:any = {}
    videoURL:string = "assets/sample.mp4"
  constructor(private themeService:CometChatThemeService) { }


  ngOnInit(): void {
    this.bubbleStyle = {
      borderRadius:"8px",
      height:"160px",
      width:"260px",
      background:this.themeService.theme.palette.getAccent200()
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
