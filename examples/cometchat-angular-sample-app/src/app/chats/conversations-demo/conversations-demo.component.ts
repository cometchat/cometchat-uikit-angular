import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-conversations-demo',
  templateUrl: './conversations-demo.component.html',
  styleUrls: ['./conversations-demo.component.scss']
})
export class ConversationsDemoComponent implements OnInit {
  @Input() theme = new CometChatTheme({})
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme

    }

  }

  ngOnInit(): void {
  }

}
