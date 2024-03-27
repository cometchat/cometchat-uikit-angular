import { CometChatTheme, CometChatMessageTemplate } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class CollaborativeWhiteBoardExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(): CometChatMessageTemplate[];
    getWhiteBoardTemplate(): CometChatMessageTemplate;
    getAttachmentOptions(theme?: CometChatTheme, user?: CometChat.User, group?: CometChat.Group, id?: any): any;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
}
