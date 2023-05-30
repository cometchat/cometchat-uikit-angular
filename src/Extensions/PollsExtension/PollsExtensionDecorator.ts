
import { CometChat } from "@cometchat-pro/chat";
import { CometChatUIKitConstants, CometChatMessageTemplate, CometChatTheme, CometChatMessageComposerAction, localize, fontHelper } from "uikit-resources-lerna";
import {  PollsConstants } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class PollsExtensionDecorator extends DataSourceDecorator {
  constructor(dataSource:DataSource){
    super(dataSource)
  }

  override getId(): string {
    return "polls";
  }
  override getAllMessageTypes(): string[] {
    const types = super.getAllMessageTypes();
    if (!types.includes(PollsConstants.extension_poll)) {
        types.push(PollsConstants.extension_poll);
    }
    return types;
}
  override getAllMessageCategories(): string[] {
    const categories = super.getAllMessageCategories();
    if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
        categories.push(CometChatUIKitConstants.MessageCategory.custom);
    }
    return categories;
}
checkIfTemplateExist(template:CometChatMessageTemplate[], type:string):boolean{
    return template.some(obj => obj.type === type)
  }
  override getAllMessageTemplates(): CometChatMessageTemplate[] {
    const templates = super.getAllMessageTemplates();

    if (!this.checkIfTemplateExist(templates, PollsConstants.extension_poll)) {
      templates.push(this.getPollsTemplate())
    }

    return templates

  }
getPollsTemplate():CometChatMessageTemplate{
return new CometChatMessageTemplate({
  type:PollsConstants.extension_poll,
  category:CometChatUIKitConstants.MessageCategory.custom,
  options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group)=>{
    return ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group)
   }

})
}
override getAttachmentOptions(theme: CometChatTheme = new CometChatTheme({}),user?:CometChat.User,group?:CometChat.Group, id?: any) {
if (!id?.parentMessageId) {
    const messageComposerActions:CometChatMessageComposerAction[] = super.getAttachmentOptions(theme,user,group,id);
    let newAction:CometChatMessageComposerAction = new CometChatMessageComposerAction({
        id: PollsConstants.extension_poll,
        title:localize("POLLS"),
        iconURL:"assets/polls.svg",
        iconTint:theme.palette.getAccent700(),
        titleColor:theme.palette.getAccent600(),
        titleFont:fontHelper(theme.typography.subtitle1),
        background:theme.palette.getAccent100(),
        onClick:null

    })
    messageComposerActions.push(newAction)
    return messageComposerActions;
} else {
    return super.getAttachmentOptions(theme, user,group, id);
}
}
override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
  const message: CometChat.BaseMessage | undefined = conversation.getLastMessage();
  if (message != null && message.getType() == PollsConstants.extension_poll && message.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
    return localize("CUSTOM_MESSAGE_POLL");
  } else {
    return super.getLastConversationMessage(conversation,loggedInUser);
  }
}

}
