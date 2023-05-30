import { CometChatMessageOption, CometChatMessageTemplate, CometChatTheme } from "uikit-resources-lerna";
import { DataSource } from "./DataSource";
import { CometChat } from "@cometchat-pro/chat";
import { MessageUtils,ComposerId } from "../Utils/MessageUtils";

export abstract class DataSourceDecorator implements DataSource {
    public dataSource: DataSource;
    constructor(dataSource: DataSource) {
        this.dataSource = dataSource ;
    }
   public getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
        return (this.dataSource ?? new MessageUtils()).getTextMessageOptions(loggedInUser, messageObject, theme, group);
    }
   public getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
        return (this.dataSource ?? new MessageUtils()).getImageMessageOptions(loggedInUser, messageObject, theme, group);
    }
   public getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
        return (this.dataSource ?? new MessageUtils()).getVideoMessageOptions(loggedInUser, messageObject, theme, group);
    }
   public getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
        return (this.dataSource ?? new MessageUtils()).getAudioMessageOptions(loggedInUser, messageObject, theme, group);
    }
   public getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
        return (this.dataSource ?? new MessageUtils()).getFileMessageOptions(loggedInUser, messageObject, theme, group);
    }
   public getTextMessageTemplate(): CometChatMessageTemplate {
        return (this.dataSource ?? new MessageUtils()).getTextMessageTemplate();
    }
   public getImageMessageTemplate(): CometChatMessageTemplate {
        return (this.dataSource ?? new MessageUtils()).getImageMessageTemplate();
    }
   public getVideoMessageTemplate(): CometChatMessageTemplate {
        return (this.dataSource ?? new MessageUtils()).getVideoMessageTemplate();
    }
   public getAudioMessageTemplate(): CometChatMessageTemplate {
        return (this.dataSource ?? new MessageUtils()).getAudioMessageTemplate();
    }
   public getFileMessageTemplate(): CometChatMessageTemplate {
        return (this.dataSource ?? new MessageUtils()).getFileMessageTemplate();
    }
   public getGroupActionTemplate(): CometChatMessageTemplate {
        return (this.dataSource ?? new MessageUtils()).getGroupActionTemplate();
    }
   public getAllMessageTemplates(): CometChatMessageTemplate[] {
        return (this.dataSource ?? new MessageUtils()).getAllMessageTemplates();
    }
   public getMessageTemplate(messageType: string, messageCategory: string): CometChatMessageTemplate | null {
        return (this.dataSource ?? new MessageUtils()).getMessageTemplate(messageType, messageCategory);
    }
    public getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
        return (this.dataSource ?? new MessageUtils()).getMessageOptions(loggedInUser, messageObject, theme, group);
      }

   public getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
        return (this.dataSource ?? new MessageUtils()).getCommonOptions(loggedInUser, messageObject, theme, group);
    }
    public getDeleteOption(theme: CometChatTheme): CometChatMessageOption {
        return (this.dataSource ?? new MessageUtils()).getDeleteOption(theme);
    }
    public getReplyInThreadOption(theme: CometChatTheme): CometChatMessageOption{
        return (this.dataSource ?? new MessageUtils()).getReplyInThreadOption(theme);
    }
    public getEditOption(theme: CometChatTheme): CometChatMessageOption{
        return (this.dataSource ?? new MessageUtils()).getEditOption(theme);
    }
   public getAttachmentOptions(theme: CometChatTheme = new CometChatTheme({}),user?:CometChat.User,group?:CometChat.Group, id?: ComposerId) {
        return (this.dataSource ?? new MessageUtils()).getAttachmentOptions(theme,user,group, id);
    }
   public getAllMessageTypes(): string[] {
        return (this.dataSource ?? new MessageUtils()).getAllMessageTypes();
    }
   public getAllMessageCategories(): string[] {
        return (this.dataSource ?? new MessageUtils()).getAllMessageCategories();
    }
   public getAuxiliaryOptions(id: ComposerId, user?: CometChat.User, group?: CometChat.Group): any {
        return (this.dataSource ?? new MessageUtils()).getAuxiliaryOptions(id, user, group);
    }
   public getId(): string {

        return (this.dataSource ?? new MessageUtils()).getId();
    }
   public getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string{
        return (this.dataSource ?? new MessageUtils()).getLastConversationMessage(conversation, loggedInUser);
    }
}