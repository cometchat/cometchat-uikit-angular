import { CometChatMessageTemplate } from "@cometchat/uikit-resources";
import { DataSource } from "../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../Shared/Framework/DataSourceDecorator";
export declare class CallingExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    onLogout(): void;
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateTypeExist(template: CometChatMessageTemplate[], type: string): boolean;
    checkIfTemplateCategoryExist(template: CometChatMessageTemplate[], category: string): boolean;
    getAllMessageTemplates(): CometChatMessageTemplate[];
    getDirectCallTemplate(): CometChatMessageTemplate;
    getDefaultCallTemplate(): CometChatMessageTemplate[];
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalParams?: any): string;
}
