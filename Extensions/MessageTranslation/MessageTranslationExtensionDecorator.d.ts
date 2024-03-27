import { CometChatTheme, CometChatMessageOption } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class MessageTranslationExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[];
    checkIfOptionExist(template: CometChatMessageOption[], id: string): boolean;
    getId(): string;
}
