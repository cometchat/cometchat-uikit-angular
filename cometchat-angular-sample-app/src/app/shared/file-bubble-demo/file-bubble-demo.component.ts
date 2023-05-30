import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { AvatarStyle } from 'my-cstom-package-lit';

@Component({
  selector: 'file-bubble-demo',
  templateUrl: './file-bubble-demo.component.html',
  styleUrls: ['./file-bubble-demo.component.scss']
})
export class FileBubbleDemoComponent implements OnInit {
  public closeIconURL:string="assets/close2x.svg";

  @Input() closeButton:any;
    bubbleStyle:any = {}
    fileURL:string = "assets/sample.pdf"
  constructor(private themeService:CometChatThemeService) { }


  ngOnInit(): void {
    this.bubbleStyle = {
      borderRadius:"8px",
      height:"fit-content",
      width:"220px",
      background:this.themeService.theme.palette.getAccent200(),
      titleFont: fontHelper(this.themeService.theme.typography.subtitle1),
      titleColor: this.themeService.theme.palette.getAccent(),
      subtitleFont: fontHelper(this.themeService.theme.typography.subtitle2),
      subtitleColor: this.themeService.theme.palette.getAccent600(),
      iconTint: "rgb(51, 153, 255)",
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
