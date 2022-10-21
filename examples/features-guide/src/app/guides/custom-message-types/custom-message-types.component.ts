import { Component, Input, OnInit } from '@angular/core';
import { CometChatMessageTemplate, MessageTypes, MessageStatus,getUnixTimestamp,ID ,CometChatUIKitHelper} from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';
import {} from '@cometchat-pro/angular-ui-kit'
@Component({
  selector: 'custom-message-types',
  templateUrl: './custom-message-types.component.html',
  styleUrls: ['./custom-message-types.component.scss']
})
export class CustomMessageTypesComponent implements OnInit {
 @Input() customView:any;
  public user!:CometChat.User;
  public amount:number = 0;
  sentMessageInputData = {
    thumbnail: false,
    title: false,
    time: true,
    readReceipt: true,
  };
  receivedMessageInputData = {
    thumbnail: true,
    title: true,
    time: true,
    readReceipt: false,
  };
  messageTypes:any = []
  openPaymentView:boolean = false
  constructor( private uikithelper:CometChatUIKitHelper) { }
  openPaymentTab:any = ()=>{
    this.openPaymentView = true
  }
  closePaymentTab = () => {
    this.openPaymentView = false
  }
  sendPayment = ()=>{
    if(this.amount){
        let receiverId = "superhero2"
        let receiverType = "user"
        const customData = {
          amount: this.amount
        };
        const customType = "payment";
        const customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(
          receiverId,
          receiverType,
          customType,
          customData
        );
        customMessage.setMetadata({ incrementUnreadCount: true });
        (customMessage as any).setSentAt(getUnixTimestamp());
        customMessage.setMuid(ID());
        this.uikithelper.onMessageSent(customMessage, MessageStatus.inprogress)
        CometChat.sendCustomMessage(customMessage)
        .then((message) => {
          this.uikithelper.onMessageSent(message, MessageStatus.success)
        })
        .catch((error:any) => {
        });
      this.openPaymentView = false;
    }
  }
  ngOnInit(): void {
    let messageTypes:any = CometChatMessageTemplate.getDefaultTypes();
    let paymentTemplate =  new CometChatMessageTemplate({
      type:"payment",
      icon:"assets/credit-card.png",
      name:"Payment",
      customView:this.customView,
      actionCallback : this.openPaymentTab
    })
    messageTypes.push(paymentTemplate)
    this.messageTypes = messageTypes;
    CometChat.getUser("superhero2").then((user:CometChat.User)=>{
      this.user = user
    })
  }
}
