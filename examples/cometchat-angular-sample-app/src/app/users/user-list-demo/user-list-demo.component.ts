import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-user-list-demo',
  templateUrl: './user-list-demo.component.html',
  styleUrls: ['./user-list-demo.component.scss']
})
export class UserListDemoComponent implements OnInit {
  userListStyle:any = {
    
  }
  @Input() theme = new CometChatTheme({})

  ngOnInit(): void {

    
    this.setTheme()
    this.onResize()
  }
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme

    }

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
    this.userListStyle.background =   this.theme.palette.getBackground(); 
    this.userListStyle.errorStateTextFont = fontHelper(this.theme.typography.heading)
    this.userListStyle.errorStateTextColor = this.theme.palette.getAccent400()
    this.userListStyle.emptyStateTextFont =  fontHelper(this.theme.typography.heading)
    this.userListStyle.emptyStateTextColor = this.theme.palette.getAccent400()
  }


}
