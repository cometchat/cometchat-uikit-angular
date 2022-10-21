import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatServices } from '../../../app/app.service';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';

@Component({
  selector: 'cometchat-messages-demo',
  templateUrl: './messages-demo.component.html',
  styleUrls: ['./messages-demo.component.scss']
})
export class MessagesDemoComponent implements OnInit {
  @Input() theme = new CometChatTheme({})
  public openMessages:boolean = false;
  public openMessageList:boolean = false;
  public openMessageHeader:boolean = false;
  public openMessageComposer:boolean = false;
  public image:string="https://data-us.cometchat.io/assets/images/avatars/captainamerica.png";
  public group!:CometChat.Group;
  messagesStyle:any={
    width: "100%",
    height: "100%",
    borderRadius: "none",
    border: "none",

  }
  messageListStyle:any={
    width: "100%",
    height: "100%",
    background: "transparent",
    borderRadius: "none",
    border: "none",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
  }
  messageComposerStyle:any={

  }



  ngOnInit(): void {
    CometChat.getGroup("supergroup").then((group:CometChat.Group)=>{
      this.group = group

    })
    this.setTheme();
  }
  setTheme(){
    this.messagesStyle.background = this.theme.palette.getBackground();
    this.messagesStyle.messageTextFont = fontHelper(this.theme.typography.heading);
    this.messagesStyle.messageTextColor = this.theme.palette.getAccent400();
  
  }

}
