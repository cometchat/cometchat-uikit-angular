import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import {  getUnixTimestamp, ID } from '../../../Shared/Helpers/CometChatHelper';
import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessageEvents } from "../../CometChatMessageEvents.service";
import { messageConstants, MessageStatus, MetadataKey} from '../../../Shared/Constants/UIKitConstants';
import * as types from '../../../Shared/Types/typesDeclairation'
import { CometChatSoundManager } from "../../../Shared/PrimaryComponents/CometChatSoundManager/cometchat-sound-manager/cometchat-sound-manager";
import { smartReplyStyles } from "../interface";
      /**
 * 
 * CometChatSmartReply is used to show suggested replies when we receive a message.
 * This only works if smartReply extension is active.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
@Component({
  selector: "cometchat-smart-reply",
  templateUrl: "./cometchat-smart-reply.component.html",
  styleUrls: ["./cometchat-smart-reply.component.scss"],
  animations: [
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateY(100%)" }),
        animate("400ms ease-in", style({ transform: "translateY(0%)" })),
      ]),
    ]),
  ],
})
export class CometChatSmartReplyComponent implements OnInit {
        /**
   * This properties will come from Parent.
   */
  @Input() messageObject:types.messageObject | null  = null;
  @Input() loggedInUser:CometChat.User | null  = null;
  @Input() style:smartReplyStyles= {
    height:"",
    width:"",
    border:"",
    borderRadius:"",
    background:"",
    iconTint:"",
    textColor:"",
    textFont:"",
    textBackground:""
    

  }
  @Input() onClick!: Function;
  @Input() onClose!: Function;
  @Input() closeIconURL:string="assets/resources/plus-rotated.svg";

        /**
     * Properties for internal use
     */
  options: string[] = [];
  messageSending!: boolean;
  enableReaction!: boolean;
  enableSendButton!: boolean;
  currentMessage!: types.messageObject | null;
  constructor(private messageEvents:CometChatMessageEvents, private ref:ChangeDetectorRef) {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[messageConstants.MESSAGE_OBJECT]) {
        if (change[messageConstants.MESSAGE_OBJECT].currentValue) {
          this.generateSmartReplyOptions(
            change[messageConstants.MESSAGE_OBJECT].currentValue
          );
        }
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnInit() {


  }
  /**
   * Generate the quick replies that the current user can use
   * @param {types.messageObject} message
   */
  generateSmartReplyOptions(message: types.messageObject) {
    try {
      if (message.hasOwnProperty(MetadataKey.metadata)) {
        const metadata:any = (message as any)[MetadataKey.metadata];
        if (metadata.hasOwnProperty(MetadataKey.injected)) {
          const injectedObject = metadata[MetadataKey.injected];
          if (injectedObject.hasOwnProperty(MetadataKey.extension)) {
            const extensionsObject = injectedObject[MetadataKey.extension];
            if (extensionsObject.hasOwnProperty(MetadataKey.extensions.smartReply)) {
              const smartReplyObject = extensionsObject[MetadataKey.extensions.smartReply];
              const options = [
                smartReplyObject[MetadataKey.extensions.REPLY_POSITIVE],
                smartReplyObject[MetadataKey.extensions.REPLY_NEUTRAL],
                smartReplyObject[MetadataKey.extensions.REPLY_NEGATIVE],
              ];
              this.options = options;
            }
          }
        }
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Sends the selected option as reply
   * @param
   */
  sendReplyMessage(message: string) {
    try {
      if(this.onClick){
        this.onClick()
      }
      else{
        this.currentMessage = this.messageObject
        this.messageObject = null;
        this.sendTextMessage(message)
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  optionListStyle(){
    return {
      background:this.style.background,
      height:this.style.height,
      width:this.style.width,
      border:this.style.border,
      borderRadius:this.style.borderRadius
    }
  }
  /**
   * Closes the reply preview window
   * @param
   */
  closeReplyPreview() {
    if(this.onClose){
      this.onClose()
    }
    else{
      this.messageObject = null;

    }

  }
  getReceiverDetails() {
    let receiverId;
    let receiverType: any;
    if ( (this.currentMessage as any).receiver && (this.currentMessage as any).receiver.uid ) {
      receiverId = (this.currentMessage as any).sender?.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if ((this.currentMessage as any).receiver && (this.currentMessage as any).receiver.guid) {
      receiverId = (this.currentMessage as any).receiver.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }
    return { receiverId: receiverId, receiverType: receiverType };
  }
    /**
   * Send Text Message
   * @param
   */
     type() {
      let type;
      if((this.currentMessage as any)?.sender && (this.currentMessage as any)?.sender?.uid) {
        type = CometChat.RECEIVER_TYPE.USER
      } else if ((this.currentMessage as any)?.sender && (this.currentMessage as any)?.sender?.guid) {
        type =CometChat.RECEIVER_TYPE.GROUP
      }
      return type;
    }
     /**
      * @param  {String=""} textMsg
      */
     sendTextMessage(textMsg: String = "") : boolean {
      try {
        this.messageSending = true;
        let { receiverId, receiverType } = this.getReceiverDetails();
        let messageInput:any;
        if (textMsg !== null) {
          messageInput = textMsg.trim();
        } 
        let textMessage: any = new CometChat.TextMessage(
          receiverId,
          messageInput,
          receiverType
        );
        textMessage.setSender(this.loggedInUser);
        textMessage.setReceiverId(receiverId);
        textMessage.setSentAt(getUnixTimestamp());
        textMessage.setMuid(ID());
        this.messageEvents.publishEvents(this.messageEvents.onMessageSent, {
          message: textMessage,
          status: MessageStatus.inprogress,
        });
        // play audio after action generation
        this.playAudio();
        this.messageSending = false;
        CometChat.sendMessage(textMessage)
          .then((message) => {
            this.messageEvents.publishEvents(this.messageEvents.onMessageSent, {
              message: message,
              status: MessageStatus.success
            });
            // Change the send button to reaction button
            setTimeout(() => {
              this.enableReaction = true;
              this.enableSendButton = false;
            }, 500);
          })
          .catch((error:any) => {
            this.messageEvents.publishEvents(this.messageEvents.onMessageError, {
              message: textMessage,
              error: error
            })
            this.messageSending = false;
            this.currentMessage = null
          });
      } catch (error:any) {
          this.messageEvents.publishEvents(this.messageEvents.onError, error);
      }
      return true;
    }
  playAudio() {
        CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage)
  }
  // styles
  closeIconStyle =  () =>{
    return{
      WebkitMask: `url(${this.closeIconURL})`,
      background: this.style.iconTint,
      

    }
  }
}
