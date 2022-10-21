import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-groups-with-messages-demo',
  templateUrl: './groups-with-messages-demo.component.html',
  styleUrls: ['./groups-with-messages-demo.component.scss']
})
export class GroupsWithMessagesDemoComponent implements OnInit {
  @Input() theme = new CometChatTheme({})
  withMessagesStyle:any={
    width: "100%",
    height: "100%",
    background: "transparent",
    borderRadius: "none",
    border: "none",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
  }

  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme

    }

  }

  ngOnInit(): void {
 

    this.setTheme()
    this.onResize()
  }
  innerWidth!: number;
  isMobileView: boolean=false;
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
    this.withMessagesStyle.background = this.theme.palette.getBackground();
    this.withMessagesStyle.messageTextFont = fontHelper(this.theme.typography.heading);
    this.withMessagesStyle.messageTextColor = this.theme.palette.getAccent400();


  }

}
