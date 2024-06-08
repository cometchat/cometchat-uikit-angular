import { UIKitSettings } from "@cometchat/uikit-shared";
import { CardMessage, CometChatLocalize, CustomInteractiveMessage, FormMessage, SchedulerMessage } from "@cometchat/uikit-resources";
import { ExtensionsDataSource } from "../Framework/ExtensionDataSource";
import { CometChatSoundManager } from "@cometchat/uikit-shared";
import { AIExtensionDataSource } from "../Framework/AIExtensionDataSource";
export declare class CometChatUIKit {
    static uiKitSettings: UIKitSettings;
    static SoundManager: typeof CometChatSoundManager;
    static Localize: typeof CometChatLocalize;
    static loggedInUser?: CometChat.User;
    static conversationUpdateSettings?: CometChat.ConversationUpdateSettings;
    static getDataSource(): import("@cometchat/chat-uikit-angular").DataSource;
    static init(uiKitSettings: UIKitSettings): Promise<Object> | undefined;
    static getLoggedinUser(): Promise<CometChat.User> | undefined;
    static defaultExtensions: ExtensionsDataSource[];
    static defaultAIFeatures: AIExtensionDataSource[];
    static enableCalling(): void;
    private static initiateAfterLogin;
    static login(details: {
        uid?: string;
        authToken?: string;
    }): Promise<Object | undefined>;
    static createUser(user: CometChat.User): Promise<Object | undefined>;
    static updateUser(user: CometChat.User): Promise<Object | undefined>;
    static logout(): Promise<Object | undefined>;
    static checkAuthSettings(): boolean;
    /**
     * Sends a form message and emits events based on the message status.
     * @param message - The form message to be sent.
     * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
     */
    static sendFormMessage(message: FormMessage, disableLocalEvents?: boolean): void;
    static sendCardMessage(message: CardMessage, disableLocalEvents?: boolean): void;
    static sendCustomInteractiveMessage(message: CustomInteractiveMessage, disableLocalEvents?: boolean): void;
    static sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage>;
    static sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage>;
    static sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage>;
    /**
     * Sends a scheduler message and emits events based on the message status.
     * @param message - The scheduler message to be sent.
     * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
     */
    static sendSchedulerMessage(message: SchedulerMessage, disableLocalEvents?: boolean): void;
}
