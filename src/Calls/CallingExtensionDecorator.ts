import { CometChat } from "@cometchat-pro/chat";
import { CometChatUIKitConstants, CometChatMessageTemplate, CometChatTheme, CometChatMessageComposerAction, localize, fontHelper } from "uikit-resources-lerna";
import { CallingDetailsUtils, CollaborativeDocumentConfiguration, CollaborativeDocumentConstants } from "uikit-utils-lerna";
import { ChatConfigurator } from "../Shared/Framework/ChatConfigurator";
import { DataSource } from "../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../Shared/Framework/DataSourceDecorator";
import {  } from "uikit-utils-lerna";

export class CallingExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource) {
        super(dataSource);
       this.onLogout()
    }
    // end active call when user logs out
    onLogout(){
      var listenerID: string = "logout_listener";
      CometChat.addLoginListener(
      listenerID,
      new CometChat.LoginListener({
        logoutSuccess: () => {
         let call:CometChat.Call =  CometChat.getActiveCall()
            if(call){
              CometChat.endCall(call.getSessionId())

            }
            else{
              return
            }
        },
        logoutFailure: (error: CometChat.CometChatException) => {
            console.log("LoginListener :: logoutFailure", error);
        }
    })
);
    }
    override getAllMessageTypes(): string[] {
        const types = super.getAllMessageTypes();
        if (!types.includes( CometChatUIKitConstants.calls.meeting)) {
            types.push( CometChatUIKitConstants.calls.meeting);
        }
        if (!types.includes(CometChatUIKitConstants.MessageTypes.audio)) {
            types.push(CometChatUIKitConstants.MessageTypes.audio);
        }
        if (!types.includes(CometChatUIKitConstants.MessageTypes.video)) {
            types.push(CometChatUIKitConstants.MessageTypes.video);
        }
        return types;
    }
    override getId(): string {
        return "calling";
      }
    override getAllMessageCategories(): string[] {
        const categories = super.getAllMessageCategories();
        if (!categories.includes(CometChatUIKitConstants.MessageCategory.call)) {
            categories.push(CometChatUIKitConstants.MessageCategory.call);
        }
        if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
            categories.push(CometChatUIKitConstants.MessageCategory.custom);
        }
        return categories;
    }
    checkIfTemplateTypeExist(template:CometChatMessageTemplate[], type:string):boolean{
        return template.some(obj => obj.type === type)
      }
      checkIfTemplateCategoryExist(template:CometChatMessageTemplate[], category:string):boolean{
        return template.some(obj => obj.category === category)
      }
    override getAllMessageTemplates(): CometChatMessageTemplate[] {
        const templates = super.getAllMessageTemplates();
        if(!this.checkIfTemplateTypeExist(templates, CometChatUIKitConstants.calls.meeting)){
             templates.push(this.getDirectCallTemplate())
           }
           if(!this.checkIfTemplateCategoryExist(templates,CometChatUIKitConstants.MessageCategory.call)){
            templates.push(...this.getDefaultCallTemplate())
          }
             return templates

    }
    getDirectCallTemplate():CometChatMessageTemplate{
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.calls.meeting,
      category:CometChatUIKitConstants.MessageCategory.custom,
      options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group)=>{
        return ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group)
       }
    })
    }
    getDefaultCallTemplate():CometChatMessageTemplate[]{
      let templates:CometChatMessageTemplate[] = [
        new CometChatMessageTemplate({
            type:CometChatUIKitConstants.MessageTypes.audio ,
            category:CometChatUIKitConstants.MessageCategory.call,
          }),
          new CometChatMessageTemplate({
            type:CometChatUIKitConstants.MessageTypes.video,
            category:CometChatUIKitConstants.MessageCategory.call,
          })

      ]
      return templates
    }
   public override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
     let actionMessage:string = "";

    if(conversation.getLastMessage() && conversation.getLastMessage().category == CometChatUIKitConstants.MessageCategory.call){
      let call:CometChat.Call =conversation.getLastMessage();

      actionMessage = CallingDetailsUtils.getCallStatus(call,loggedInUser)
    }
    else if (conversation.getLastMessage() && conversation.getLastMessage().type ==  CometChatUIKitConstants.calls.meeting){
      let message:CometChat.CustomMessage = conversation.getLastMessage()
      if(!message.getSender() || message.getSender().getUid() == loggedInUser.getUid()){
        actionMessage = localize("YOU_INITIATED_GROUP_CALL")
      }
      else {
        actionMessage = `${message.getSender().getName()}  ${localize("INITIATED_GROUP_CALL")}`
      }

    }
    else{
      actionMessage = super.getLastConversationMessage(conversation,loggedInUser);
    }
    return actionMessage

   }
}