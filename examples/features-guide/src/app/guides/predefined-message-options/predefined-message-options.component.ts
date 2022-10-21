import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { MessageOptions, MessageOptionForConstants, CometChatMessageTemplate, MessageTypes, MessageOption, CometChatUIKitHelper, MessageStatus } from '@cometchat-pro/angular-ui-kit';
@Component({
  selector: 'predefined-message-options',
  templateUrl: './predefined-message-options.component.html',
  styleUrls: ['./predefined-message-options.component.scss']
})
export class PredefinedMessageOptionsComponent implements OnInit {
 editedText:string="";
 openPreview:boolean=false;
 messageToBeEdited!:CometChat.TextMessage;
 messageTypes:CometChatMessageTemplate[] = [new CometChatMessageTemplate({})]
  public user!:CometChat.User;
  constructor(private uikithelper:CometChatUIKitHelper) { }
   onEditeMessage = (message:CometChat.TextMessage)=>{
    this.openPreview = true;
    this.messageToBeEdited = message
   }
   editMessage = ()=>{
     this.openPreview=false
    if(this.editedText){
      //  code here
      const messageToBeEdited: any = this.messageToBeEdited;
      let receiverId = "superhero2"
      let receiverType = "user"
      let messageText = this.editedText.trim();
      let textMessage: any = new CometChat.TextMessage(
        receiverId,
        messageText,
        receiverType
      );
      textMessage.setId(messageToBeEdited.id);
      CometChat.editMessage(textMessage)
        .then((message) => {
          this.uikithelper.onMessageEdit(message, MessageStatus.success)
        })
}    
   }
  ngOnInit(): void {
    this.messageTypes = CometChatMessageTemplate.getDefaultTypes() as CometChatMessageTemplate[];
    let index = this.messageTypes.findIndex(
      (m) => m.type === MessageTypes.text
    );
    if(index >=0){
      let optionKey = this.messageTypes[index].options.findIndex(
        (m) => m.id === MessageOption.editMessage
      );
      if(optionKey >=0){
        this.messageTypes[index].options[optionKey].callBack = this.onEditeMessage
      }
    }
    CometChat.getUser("superhero2").then((user:CometChat.User)=>{
      this.user = user
    })
  }
}
