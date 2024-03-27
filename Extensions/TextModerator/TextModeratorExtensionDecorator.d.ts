import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class TextModeratorExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    getId(): string;
    getModeratedtext(message: CometChat.TextMessage): string;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
}
