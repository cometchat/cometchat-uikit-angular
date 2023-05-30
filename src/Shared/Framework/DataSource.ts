import { CometChatMessageOption, CometChatMessageTemplate, CometChatTheme } from "uikit-resources-lerna";
import { CometChat } from "@cometchat-pro/chat";
import { ComposerId } from "../Utils/MessageUtils";

export abstract class DataSource {
    abstract getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    abstract getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    abstract getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    abstract getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    abstract getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    abstract getTextMessageTemplate(): CometChatMessageTemplate;
    abstract getImageMessageTemplate(): CometChatMessageTemplate;
    abstract getVideoMessageTemplate(): CometChatMessageTemplate;
    abstract getAudioMessageTemplate(): CometChatMessageTemplate;
    abstract getFileMessageTemplate(): CometChatMessageTemplate;
    abstract getGroupActionTemplate(): CometChatMessageTemplate;
    abstract getAllMessageTemplates(theme?: CometChatTheme): Array<CometChatMessageTemplate>;
    abstract getMessageTemplate(messageType: string, messageCategory: string): CometChatMessageTemplate | null;
    abstract getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    abstract getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    abstract getAttachmentOptions(theme?: CometChatTheme,user?:CometChat.User,group?:CometChat.Group, id?: ComposerId): any;
    abstract getAllMessageTypes(): Array<string>;
    abstract getAllMessageCategories(): Array<string>;
    abstract getAuxiliaryOptions(id: ComposerId, user?: CometChat.User, group?: CometChat.Group): any;
    abstract getId(): string;
    abstract getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string;
    abstract getDeleteOption(theme:CometChatTheme):CometChatMessageOption
    abstract getReplyInThreadOption(theme:CometChatTheme):CometChatMessageOption
    abstract getEditOption(theme:CometChatTheme):CometChatMessageOption
}