import { Component, Input, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatTheme, CometChatThemeService, Receipts, fontHelper } from '@cometchat-pro/angular-ui-kit';
@Component({
  selector: 'message-receipt-demo',
  templateUrl: './message-receipt-demo.component.html',
  styleUrls: ['./message-receipt-demo.component.scss']
})
export class ReceiptDemoComponent implements OnInit {
	messageWaitIcon = "assets/wait.svg";
	messageSentIcon = "assets/message-sent.svg";
	messageDeliveredIcon = "assets/message-delivered.svg";
	messageReadIcon = "assets/message-read.svg";
	messageErrorIcon = "assets/warning-small.svg";
  public closeIconURL:string="assets/close2x.svg";
  receipt:typeof Receipts = Receipts

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
  constructor(private themeService:CometChatThemeService) {
  }
  ngOnInit(): void {
  }
  // style
  style:any = {
    closeIconStyle:()=>{
      return{
        WebkitMask: `url(${this.closeIconURL}) center center no-repeat`,
        background:  this.themeService.theme.palette.getAccent600(),

      }
    },
    titleStyle:()=>{
      return{
       font: fontHelper(this.themeService.theme.typography.title2),
       color:this.themeService.theme.palette.getAccent(),
      }
    },
    wrapperStyle:()=>{
      return{
        background:  this.themeService.theme.palette.getBackground(),
        boxShadow: `${this.themeService.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },
    cardDescriptionStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.subtitle2),
        color:this.themeService.theme.palette.getAccent600()
      }
    },
    sectionHeaderStyle:()=>{
      return{
        font: fontHelper(this.themeService.theme.typography.subtitle2),
        color:this.themeService.theme.palette.getAccent()
      }
    },
    cardStyle:()=>{
      return{
       background:this.themeService.theme.palette.getBackground(),
       boxShadow: `${this.themeService.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },
  }
}
