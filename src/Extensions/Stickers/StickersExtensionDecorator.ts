import {  DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CometChatMessageEvents, CometChatTheme, CometChatUIKitConstants, MessageStatus } from "uikit-resources-lerna";
import { CometChatMessageTemplate } from "uikit-resources-lerna";
import {CometChat} from '@cometchat-pro/chat'
import {localize} from 'uikit-resources-lerna'
import {StickersConfiguration} from 'uikit-utils-lerna'
import {StickersConstants} from 'uikit-utils-lerna'
import { DataSource } from "../../Shared/Framework/DataSource";
import { CometChatSoundManager,CometChatUIKitUtility } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ComposerId } from "../../Shared/Utils/MessageUtils";
export class StickersExtensionDecorator extends DataSourceDecorator {
    public configuration?:StickersConfiguration;
    public newDataScorce!:DataSource;
 constructor(dataSource:DataSource,configuration:StickersConfiguration = new StickersConfiguration({})){
     super(dataSource)
     this.newDataScorce = dataSource;
     this.configuration = configuration;
     if(!this.configuration?.ccStickerClicked){

      this.configuration!.ccStickerClicked = this.sendStickerMessage

     }
 }
 getDataScorce(){
   return this.newDataScorce;
 }
 sendStickerMessage = (sticker:{name:string,url:string},loggedInUser:CometChat.User,user:CometChat.User,group:CometChat.Group,parentMessageid:number,onError:((error:any)=>void) | null | undefined,customSoundForMessages:string = "", disableSoundForMessages:boolean = false)=>{
   let receiverId:string = user?.getUid() || group?.getGuid()
   let receiverType:string = user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group
  try {
    const customData = {
      sticker_url: sticker.url,
      sticker_name: sticker.name,
    };
    const customType = StickersConstants.sticker;
    const customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      customData
    );
    if (parentMessageid) {
      customMessage.setParentMessageId(parentMessageid);
    }
    customMessage.setMetadata({ incrementUnreadCount: true });
    (customMessage as any).setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    customMessage.setMuid(CometChatUIKitUtility.ID());
    CometChatMessageEvents.ccMessageSent.next(
      {
        message: customMessage,
        status: MessageStatus.inprogress
      }
    )
    if (!disableSoundForMessages) {
      CometChatSoundManager.play(customSoundForMessages ?? CometChatSoundManager.Sound.outgoingMessage)
    }
    CometChat.sendCustomMessage(customMessage)
      .then((message) => {

        CometChatMessageEvents.ccMessageSent.next({
          message: message,
          status: MessageStatus.success
        })
      })
      .catch((error:any) => {
        customMessage.setMetadata({
          error:true
        })
        CometChatMessageEvents.ccMessageSent.next({
          message: customMessage,
         status: MessageStatus.error,
     });

      });
  } catch (error:any) {
    if(onError){
      onError(error)
    }
  }
 }
override getAllMessageTemplates(): CometChatMessageTemplate[] {
  let template:CometChatMessageTemplate[] =  super.getAllMessageTemplates()
   if(!this.checkIfTemplateExist(template,StickersConstants.sticker)){
    template.push(this.getStickerTemplate())
     return template
   }
   return template

}
override getAuxiliaryOptions(id: ComposerId, user?: CometChat.User, group?: CometChat.Group) {
  return {configuration:this.configuration,id:StickersConstants.sticker}
}
getStickerTemplate():CometChatMessageTemplate{

return new CometChatMessageTemplate({
type:StickersConstants.sticker,
category:CometChatUIKitConstants.MessageCategory.custom,
options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group)=>{
 return ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group)
}
})
}
checkIfTemplateExist(template:CometChatMessageTemplate[], type:string):boolean{
  return template.some(obj => obj.type === type)
}

 override getAllMessageCategories(): string[] {
  let categories:string[] =  super.getAllMessageCategories()
  if(!categories.some(category => category === CometChatUIKitConstants.MessageCategory.custom)){
    categories.push(CometChatUIKitConstants.MessageCategory.custom)
  }
    return categories
 }


   override getAllMessageTypes(): string[] {
       let types:string[] =  super.getAllMessageTypes()
       if(!types.some(category => category === CometChatUIKitConstants.MessageCategory.custom)){
        types.push(StickersConstants.sticker)

       }
        return types

   }

  override getId(): string {
    return "stickers";
  }
  override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
    const message: CometChat.BaseMessage | undefined = conversation.getLastMessage();
    if (message != null && message.getType() == StickersConstants.sticker && message.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
      return localize("CUSTOM_MESSAGE_STICKER");
    } else {
      return super.getLastConversationMessage(conversation,loggedInUser);
    }
  }

}
