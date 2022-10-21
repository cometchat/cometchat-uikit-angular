import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessageEvents } from "../../../Messages/CometChatMessageEvents.service"
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class CometChatUIKitHelper {
  constructor(private messageEvents: CometChatMessageEvents) { }
  public onMessageSent = (messageObject: CometChat.BaseMessage, status: string) => {
    this.messageEvents.publishEvents(this.messageEvents.onMessageSent, {
      message: messageObject,
      status: status,
    });
  }
  public onMessageDelete = (messageObject: CometChat.BaseMessage) => {
    this.messageEvents.publishEvents(this.messageEvents.onMessageDelete, {
      message: messageObject,
    });
  }
  public onMessageReact = (messageObject: CometChat.BaseMessage, reaction:string) => {
    this.messageEvents.publishEvents(this.messageEvents.onMessageReact, {
      message: messageObject,
      reaction:reaction
    });
  }
  public onMessageEdit = (messageObject: CometChat.BaseMessage, status: string) => {
    this.messageEvents.publishEvents(this.messageEvents.onMessageEdit, {
      message: messageObject,
      status: status,
    });
  }
}
