import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, ConversationInputData, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-conversation-listitem-demo',
  templateUrl: './conversation-listitem-demo.component.html',
  styleUrls: ['./conversation-listitem-demo.component.scss']
})
export class ConversationListitemDemoComponent implements OnInit {

  public closeIconURL:string="assets/Plus-1.png";
  @Input() theme:CometChatTheme = new CometChatTheme({});
  public image:string="https://data-us.cometchat.io/assets/images/avatars/captainamerica.png";
  public dataItemStyle:any = {
    background:"",
    titleColor:"",
    titleFont:"",
    subTitleColor:"",
    subTitleFont:"",
    borderRadius:"8px"
  
  };
  public lastMessage = {
    sentAt:1165370496,
    id:"2121",
    text:"hello",
    getText:()=>"hell",
    sender:{
      name: "dummy man",
      avatar: this.image,
      uid:"uid123",
      status:"online"
    },
    getSentAt:()=>20129012109,
    getDeliveredAt:()=>null,
    getReadAt:()=>null,
    getId:()=>12120,
    getReceiverType:()=> "user"
  }
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme

    }

  }
  public user:any = {
    getName:()=> "Raj Dubey",
    getAvatar:()=> this.image,
    getUid:()=>"uid123",
    getStatus:()=>"online"
  };
  public group: any={
    getName:()=> "new group",
    getMembersCount:()=> 12,
    getGuid:()=> "new__group123",
    getType:()=>"public",
    getIcon:()=>null
  };
  public conversationObject:any = {
    getConversationType:()=>"user",
    unreadMessageCount:12,
    conversationWith: {
      uid:"newuser12",
      type:"user",
      name:"raj dubey",
    },
    conversationId:"conversation121212",
    lastMessage: this.lastMessage
  }
  public inputdata:ConversationInputData = {
    thumbnail:true,
    title:true,
    subtitle: ()=> "heyy! nice to meet you.",
    time:true,
    unreadCount:true,
    readReceipt:true
  }
  ngOnInit(): void {
    this.dataItemStyle.background = "transparent";
    this.dataItemStyle.titleColor = this.theme.palette.getAccent();

    this.dataItemStyle.subTitleColor = this.theme.palette.getAccent600();
    this.dataItemStyle.titleFont = fontHelper(this.theme.typography.title2);
    this.dataItemStyle.subTitleFont = fontHelper(this.theme.typography.subtitle2);
  }
  // style
  style:any = {

    wrapperStyle:()=>{
      return{
        background:  this.theme.palette.getBackground(),
        boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },

  }
}
