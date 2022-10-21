import { Component, HostListener, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CometChatLocalize, CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-conversations-with-messages-demo',
  templateUrl: './conversations-with-messages-demo.component.html',
  styleUrls: ['./conversations-with-messages-demo.component.scss']
})
export class ConversationsWithMessagesDemoComponent implements OnInit {
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

  constructor(private router: Router,private route: ActivatedRoute,private cometchatService:CometChatServices) { 
    this.route.queryParams.subscribe(params => {
      if (this.router.getCurrentNavigation()?.extras.state) {
        if(this.router.getCurrentNavigation()?.extras.state!["pageLanguage"]){
          CometChatLocalize.init(this.router.getCurrentNavigation()?.extras.state!["pageLanguage"])
        }

      }

      
    });
    if(this.cometchatService.customTheme){
      this.theme = this.cometchatService.customTheme;
    }
    else{

      this.theme = this.cometchatService.theme;
    }
  }

  ngOnInit(): void {
    this.setTheme()
    this.onResize()
  }
  isMobileView: boolean=false;
  innerWidth!: number;
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
  ngOnDestroy(){
    CometChatLocalize.init(CometChatLocalize.getBrowserLanguage());
    this.cometchatService.customTheme = undefined;
  }
}
