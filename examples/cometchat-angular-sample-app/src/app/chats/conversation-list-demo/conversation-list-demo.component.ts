import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-conversation-list-demo',
  templateUrl: './conversation-list-demo.component.html',
  styleUrls: ['./conversation-list-demo.component.scss']
})
export class ConversationListDemoComponent implements OnInit {

  @Input() theme = new CometChatTheme({})
  conversationListStyle:any = {
    
  }
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme

    }

  }

  ngOnInit(): void {
    this.setheme()
  }
  setheme(){
    this.conversationListStyle.background =   this.theme.palette.getBackground(); 
    this.conversationListStyle.errorStateTextFont = fontHelper(this.theme.typography.heading)
    this.conversationListStyle.errorStateTextColor = this.theme.palette.getAccent400()
    this.conversationListStyle.emptyStateTextFont =  fontHelper(this.theme.typography.heading)
    this.conversationListStyle.emptyStateTextColor = this.theme.palette.getAccent400()
  }

}
