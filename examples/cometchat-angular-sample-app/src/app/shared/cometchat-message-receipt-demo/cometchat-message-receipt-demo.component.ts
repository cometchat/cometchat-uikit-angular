import { Component, Input, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { dataItemStyle } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Messages/CometChatMessageHeader/headerInterface';
import { InputData } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Shared/InputData/inputData';
@Component({
  selector: 'cometchat-message-receipt-demo',
  templateUrl: './cometchat-message-receipt-demo.component.html',
  styleUrls: ['./cometchat-message-receipt-demo.component.scss']
})
export class CometChatMessageReceiptDemoComponent implements OnInit {
	messageWaitIcon = "assets/wait.svg";
	messageSentIcon = "assets/message-sent.svg";
	messageDeliveredIcon = "assets/message-delivered.svg";
	messageReadIcon = "assets/message-read.svg";
	messageErrorIcon = "assets/warning-small.svg";
  public closeIconURL:string="assets/Plus-1.png";
  @Input() theme:CometChatTheme = new CometChatTheme({});
  @Input() closeButton:any;
  public errorMessage:any = {
    error:"something went wrong"
  }
  public sentMessage:any = {
    getSentAt:()=>20129012109,
    getDeliveredAt:()=>null,
    getReadAt:()=>null,
    getId:()=>12120,
    getReceiverType:()=> "user"
  }
  public progressMessage:any = {
    getMuid:()=>"12121212",
    getSentAt:()=>0,
    getReadAt:()=>0,
    getId:()=>0,
    getDeliveredAt:()=>0,
    getReceiverType:()=> "user"
  }
  public deliveredMessage:any = {
    getDeliveredAt:()=>20129012109,
    getSentAt:()=>0,
    getReadAt:()=>0,
    getId:()=>12120,
    getReceiverType:()=> "user"
  }
  public readMessage:any = {
    getDeliveredAt:()=>0,
    getReadAt:()=>20129012109,
    getSentAt:()=>0,
    getId:()=>12120,
    getReceiverType:()=> "user"
  }
  constructor() { 
  }
  ngOnInit(): void {
  }
  // style
  style:any = {
    closeIconStyle:()=>{
      return{
        WebkitMask: `url(${this.closeIconURL}) center center no-repeat`,
        background:  this.theme.palette.getAccent600(),
        transform:"rotate(45deg)"
      }
    },
    titleStyle:()=>{
      return{
       font: fontHelper(this.theme.typography.title2),
       color:this.theme.palette.getAccent(),
      }
    },
    wrapperStyle:()=>{
      return{
        background:  this.theme.palette.getBackground(),
        boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },
    cardDescriptionStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600()
      }
    },
    sectionHeaderStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent()
      }
    },
    cardStyle:()=>{
      return{
       background:this.theme.palette.getBackground(),
       boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },
  }
}
