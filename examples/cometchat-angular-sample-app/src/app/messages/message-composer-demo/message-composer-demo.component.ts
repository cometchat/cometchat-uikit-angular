import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-message-composer-demo',
  templateUrl: './message-composer-demo.component.html',
  styleUrls: ['./message-composer-demo.component.scss']
})
export class MessageComposerDemoComponent implements OnInit {
  public group!:CometChat.Group;
  @Input() theme = new CometChatTheme({})
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme
    }

  }

  ngOnInit(): void {
    CometChat.getGroup("supergroup").then((group:CometChat.Group)=>{
      this.group = group

    })
  }
  setTheme(){

    this.messageComposerStyle.background = this.theme.palette.getAccent900()
    this.messageComposerStyle.inputBackground = this.theme.palette.getSecondary()
    this.messageComposerStyle.inputTextFont = fontHelper(this.theme.typography.subtitle1)
    this.messageComposerStyle.inputTextColor = this.theme.palette.getAccent900("dark")
  }
  messageComposerStyle:any={

  }

}
