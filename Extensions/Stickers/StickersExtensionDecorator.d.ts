import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CometChatMessageTemplate } from "@cometchat/uikit-resources";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { StickersConfiguration } from "@cometchat/uikit-shared";
import { DataSource } from "../../Shared/Framework/DataSource";
import { ComposerId } from "../../Shared/Utils/MessageUtils";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
export declare class StickersExtensionDecorator extends DataSourceDecorator {
    configuration?: StickersConfiguration;
    newDataScorce: DataSource;
    constructor(dataSource: DataSource);
    getDataScorce(): DataSource;
    sendStickerMessage: (sticker: {
        name: string;
        url: string;
    }, loggedInUser: CometChat.User, user: CometChat.User, group: CometChat.Group, parentMessageid: number, onError: ((error: CometChat.CometChatException) => void) | null | undefined, customSoundForMessages?: string, disableSoundForMessages?: boolean) => void;
    getAllMessageTemplates(): CometChatMessageTemplate[];
    getAuxiliaryOptions(id: ComposerId, user?: CometChat.User, group?: CometChat.Group): {
        configuration: StickersConfiguration | undefined;
        id: "extension_sticker";
    };
    getStickerTemplate(): CometChatMessageTemplate;
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageCategories(): string[];
    getAllMessageTypes(): string[];
    getId(): string;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
}
