import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService } from '@cometchat-pro/angular-ui-kit';


@Component({
  selector: 'cometchat-conversations-demo',
  templateUrl: './conversations-demo.component.html',
  styleUrls: ['./conversations-demo.component.scss']
})
export class ConversationsDemoComponent implements OnInit {
  constructor(private themeService:CometChatThemeService) {

  }

  ngOnInit(): void {

  }

}
