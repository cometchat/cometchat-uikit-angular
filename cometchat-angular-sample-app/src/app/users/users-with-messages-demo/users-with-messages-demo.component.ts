import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';


@Component({
  selector: 'cometchat-users-with-messages-demo',
  templateUrl: './users-with-messages-demo.component.html',
  styleUrls: ['./users-with-messages-demo.component.scss']
})
export class UsersWithMessagesDemoComponent implements OnInit {

  ngOnInit(): void {


    this.setTheme()
    this.onResize()
  }
  constructor(private themeService:CometChatThemeService) {


  }
  innerWidth!: number;
  isMobileView: boolean=false;
  withMessagesStyle:any={
    width: "100%",
    height: "100%",
    background: "transparent",
    borderRadius: "none",
    border: "none",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
  }

    /**
   * Checks when window size is changed in realtime
   */
     @HostListener("window:resize", [])
     onResize(): boolean {
       try {
         this.innerWidth = window.innerWidth;
         if (
           this.innerWidth >= 320 &&
           this.innerWidth <= 760
         ) {
           this.isMobileView = true;
         } else {
           this.isMobileView = false
         }
       } catch (error) {

       }
       return true;
     }
  setTheme(){

    this.withMessagesStyle.background = this.themeService.theme.palette.getBackground();
    this.withMessagesStyle.messageTextFont = fontHelper(this.themeService.theme.typography.heading);
    this.withMessagesStyle.messageTextColor = this.themeService.theme.palette.getAccent400();

  }


}
