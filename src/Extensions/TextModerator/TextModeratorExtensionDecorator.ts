import { CometChat } from "@cometchat-pro/chat";
import { CometChatUIKitConstants } from "uikit-resources-lerna";
import {CometChatUIKitUtility} from 'uikit-utils-lerna'
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class TextModeratorExtensionDecorator extends DataSourceDecorator {
  constructor(dataSource:DataSource){
    super(dataSource)
  }

  override getId(): string {
    return "textmoderator";
  }
  getModeratedtext(message:CometChat.TextMessage):string{
    let text:string = CometChatUIKitUtility.getExtensionData(message)
    if(text?.trim()?.length > 0){
      return text
    }
    else{
      return message.getText()
    }
  }
  override getLastConversationMessage(
    conversation: CometChat.Conversation,
    loggedInUser:CometChat.User
  ): string {
    const message:CometChat.TextMessage = conversation.getLastMessage();
    if (
      message && !message.getDeletedAt() &&
      message.getType() === CometChatUIKitConstants.MessageTypes.text &&
      message.getCategory() === CometChatUIKitConstants.MessageCategory.message
    ) {
      return this.getModeratedtext(message);
    } else {
      return super.getLastConversationMessage(conversation,loggedInUser);
    }
  }
}
