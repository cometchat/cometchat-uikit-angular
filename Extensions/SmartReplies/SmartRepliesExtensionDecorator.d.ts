import { CometChat } from "@cometchat/chat-sdk-javascript";
import { SmartRepliesConfiguration } from "@cometchat/uikit-shared";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class SmartReplyExtensionDecorator extends DataSourceDecorator {
    configuration?: SmartRepliesConfiguration;
    private LISTENER_ID;
    private activeUser;
    private activeGroup;
    currentMessage: CometChat.BaseMessage | null;
    loggedInUser: CometChat.User | null;
    constructor(dataSource: DataSource);
    sendReply: (reply: string, message: CometChat.BaseMessage, onError: ((error: CometChat.CometChatException) => void) | null | undefined, customSoundForMessages?: string, disableSoundForMessages?: boolean) => void;
    private addMessageListener;
    getId(): string;
}
