import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
@Component({
  selector: "cometchat-message-receipt",
  templateUrl: "./cometchat-message-receipt.component.html",
  styleUrls: ["./cometchat-message-receipt.component.scss"],
})
export class CometChatMessageReceiptComponent implements OnInit, OnChanges {
  // we will receive this properties from parent component
  @Input() messageWaitIcon: string = ""; //Icon to be shown when the message is in the pending state
  @Input() messageSentIcon: string = ""; //Icon to be shown when the message is sent successfully
  @Input() messageDeliveredIcon: string = ""; //Icon to be shown when the message is delivered
  @Input() messageReadIcon: string = ""; //Icon to be shown when the message is read
  @Input() messageErrorIcon: string = ""; //Icon to be shown when the message is not sent due to an error
  @Input() messageObject!:CometChat.BaseMessage;; //CometChat SDK’s message object
  public icon: string | null= '';
  constructor(private ref:ChangeDetectorRef) { }
  /**
 * 
 * CometChatMessageReceiptComponent is used for showing message sent ,delivered and seen status.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
   ngOnInit() {
     
  }
  ngAfterContentInit(){
    this.updateMessageReceipt();
  }
  ngOnChanges(change:SimpleChanges) {
    
      this.updateMessageReceipt();
 
  }
  updateMessageReceipt(){
    if ((this.messageObject as any).error) {
      this.icon = this.messageErrorIcon;
    }else if(this.messageObject?.getReceiverType() ==  CometChat.RECEIVER_TYPE.GROUP){
      if( this.messageObject?.getSentAt() && this.messageObject?.getId()){
        this.icon = this.messageSentIcon;
      }
      else{
        this.icon = this.messageWaitIcon;
      }
    } else {
      if (this.messageObject?.getReadAt()) {
        this.icon = this.messageReadIcon;
      } else if (!this.messageObject?.getReadAt() && this.messageObject?.getDeliveredAt() ) {
        this.icon = this.messageDeliveredIcon;
      } else if ( this.messageObject?.getSentAt() && this.messageObject?.getId()) {
        this.icon = this.messageSentIcon;
      } else {
        this.icon = this.messageWaitIcon;
      }
    }
  }

  // this object contains dynamic stylings for this component
  messageReceiptStyles:any = {
    iconStyle: () => {
      return {
        background: `url(${this.icon}) center center no-repeat`,
      };
    }
  }
}
