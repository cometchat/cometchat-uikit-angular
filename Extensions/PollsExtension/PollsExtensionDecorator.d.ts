import { CometChatMessageTemplate, CometChatTheme } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class PollsExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    getId(): string;
    getAllMessageTypes(): string[];
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(): CometChatMessageTemplate[];
    getPollsTemplate(): CometChatMessageTemplate;
    getAttachmentOptions(theme?: CometChatTheme, user?: CometChat.User, group?: CometChat.Group, id?: any): any;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
}
