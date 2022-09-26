import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessageEvents } from "../Messages/CometChatMessageEvents.service"
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class helperService {
  constructor(private messageEv:CometChatMessageEvents){}
 public  addMessage = (messageObject:CometChat.BaseMessage,status:string)=> { 
  this.messageEv.publishEvents( this.messageEv.onMessageSent, {
            message: messageObject,
            status: status,
          });
  
  }

}
   

