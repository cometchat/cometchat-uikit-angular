import { CometChatUIKitLoginListener, } from "@cometchat/uikit-shared";
import { ChatSdkEventInitializer, CometChatLocalize, CometChatMessageEvents, MessageStatus, } from "@cometchat/uikit-resources";
import { CometChatUIKitSharedSettings } from "@cometchat/uikit-shared";
import { CallingExtension } from "../../Calls/CallingExtension";
import { ChatConfigurator } from "../Framework/ChatConfigurator";
import { CollaborativeDocumentExtension } from "../../Extensions/CollaborativeDocument/CollaborativeDocumentExtension";
import { CollaborativeWhiteBoardExtension } from "../../Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardExtension";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { ImageModerationExtension } from "../../Extensions/ImageModeration/ImageModerationExtension";
import { LinkPreviewExtension } from "../../Extensions/LinkPreviewExtension/LinkPreviewExtension";
import { MessageTranslationExtension } from "../../Extensions/MessageTranslation/MessageTranslationExtension";
import { PollsExtension } from "../../Extensions/PollsExtension/PollsExtension";
import { SmartReplyExtension } from "../../Extensions/SmartReplies/SmartRepliesExtension";
import { StickersExtension } from "../../Extensions/Stickers/StickersExtension";
import { TextModeratorExtension } from "../../Extensions/TextModerator/TextModeratorExtension";
import { ThumbnailGenerationExtension } from "../../Extensions/ThumbnailGeneration/ThumbnailGenerationExtension";
import { AIConversationSummaryExtension } from "./../../AI/AIConversationSummary/AIConversationSummary";
import { AISmartRepliesExtension } from "./../../AI/AISmartReplies/AISmartReplies";
import { AIConversationStarterExtension } from "./../../AI/AIConversationStarter/AIConversationStarter";
import { CometChatUIKitCalls, CometChatSoundManager, } from "@cometchat/uikit-shared";
import { AIAssistBotExtension } from "../../AI/AIAssistBot/AIAssistBot";
export class CometChatUIKit {
    static getDataSource() {
        return ChatConfigurator.getDataSource();
    }
    static init(uiKitSettings) {
        // perform sdk init taking values from uiKitSettings
        CometChatUIKit.uiKitSettings = uiKitSettings;
        if (window) {
            window.CometChatUiKit = {
                name: "@cometchat/chat-uikit-angular",
                version: "4.3.1",
            };
        }
        if (CometChatUIKitSharedSettings) {
            CometChatUIKitSharedSettings.uikitSettings = CometChatUIKit?.uiKitSettings;
        }
        if (!CometChatUIKit.checkAuthSettings())
            return undefined;
        const appSettingsBuilder = new CometChat.AppSettingsBuilder();
        if (uiKitSettings.getRoles()) {
            appSettingsBuilder.subscribePresenceForRoles(uiKitSettings.getRoles());
        }
        else if (uiKitSettings.getSubscriptionType() === "ALL_USERS") {
            appSettingsBuilder.subscribePresenceForAllUsers();
        }
        else if (uiKitSettings.getSubscriptionType() === "FRIENDS") {
            appSettingsBuilder.subscribePresenceForFriends();
        }
        appSettingsBuilder.autoEstablishSocketConnection(uiKitSettings.isAutoEstablishSocketConnection());
        appSettingsBuilder.setRegion(uiKitSettings.getRegion());
        appSettingsBuilder.overrideAdminHost(uiKitSettings.getAdminHost());
        appSettingsBuilder.overrideClientHost(uiKitSettings.getClientHost());
        const appSettings = appSettingsBuilder.build();
        return new Promise((resolve, reject) => {
            CometChat.init(uiKitSettings?.appId, appSettings)
                .then(() => {
                CometChat.setSource("uikit-v4", "web", "angular");
                CometChatUIKit.getLoggedinUser()
                    ?.then((user) => {
                    if (user) {
                        CometChatUIKitLoginListener.setLoggedInUser(user);
                        ChatConfigurator.init();
                        this.initiateAfterLogin();
                    }
                    resolve(user);
                })
                    .catch((error) => {
                    reject(error);
                });
            })
                .catch((error) => {
                return reject(error);
            });
        });
    }
    static getLoggedinUser() {
        return new Promise((resolve, reject) => {
            CometChat.getLoggedinUser()
                .then((user) => {
                return resolve(user);
            })
                .catch((error) => {
                return reject(error);
            })
                .catch((error) => {
                return reject(error);
            });
        });
    }
    static enableCalling() {
        if (CometChatUIKitCalls) {
            const callAppSetting = new CometChatUIKitCalls.CallAppSettingsBuilder()
                .setAppId(CometChatUIKit.uiKitSettings?.appId)
                .setRegion(CometChatUIKit.uiKitSettings?.region)
                .build();
            CometChatUIKitCalls.init(callAppSetting).then(() => {
                console.log("CometChatCalls initialization success");
                new CallingExtension().enable();
            }, (error) => {
                console.log("CometChatCalls initialization failed with error:", error);
            });
        }
    }
    static initiateAfterLogin() {
        if (CometChatUIKit.uiKitSettings != null) {
            this.enableCalling();
            let extensionList = this.uiKitSettings?.extensions || this.defaultExtensions;
            let aiFeaturesList = Array.isArray(this.uiKitSettings?.aiFeatures)
                ? this.uiKitSettings?.aiFeatures
                : this.defaultAIFeatures;
            ChatSdkEventInitializer.attachListeners();
            CometChatUIKitLoginListener.attachListener();
            if (extensionList.length > 0) {
                extensionList.forEach((extension) => {
                    extension?.enable();
                });
            }
            if (aiFeaturesList.length > 0) {
                aiFeaturesList.forEach((aiFeatures) => {
                    aiFeatures?.enable();
                });
            }
        }
    }
    static async login(details) {
        if (!CometChatUIKit.checkAuthSettings())
            return undefined;
        return new Promise((resolve, reject) => {
            CometChatUIKit.getLoggedinUser()
                ?.then((user) => {
                if (user) {
                    CometChatUIKitLoginListener.setLoggedInUser(user);
                    resolve(user);
                    CometChatUIKitLoginListener.setLoggedInUser(user);
                    ChatConfigurator.init();
                    this.initiateAfterLogin();
                }
                else {
                    let args = details.uid
                        ? [details.uid, CometChatUIKit.uiKitSettings.authKey]
                        : [details.authToken];
                    CometChat.login(...args)
                        .then((user) => {
                        CometChatUIKitLoginListener.setLoggedInUser(user);
                        resolve(user);
                        CometChatUIKitLoginListener.setLoggedInUser(user);
                        ChatConfigurator.init();
                        this.initiateAfterLogin();
                    })
                        .catch((error) => {
                        reject(error);
                    });
                }
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    static async createUser(user) {
        if (!CometChatUIKit.checkAuthSettings())
            return undefined;
        return new Promise((resolve, reject) => {
            CometChat.createUser(user, CometChatUIKit.uiKitSettings.authKey)
                .then((user) => {
                resolve(user);
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    static async updateUser(user) {
        if (!CometChatUIKit.checkAuthSettings())
            return undefined;
        return new Promise((resolve, reject) => {
            CometChat.updateUser(user, CometChatUIKit.uiKitSettings.authKey)
                .then((user) => {
                resolve(user);
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    static async logout() {
        if (!CometChatUIKit.checkAuthSettings())
            return undefined;
        return new Promise((resolve, reject) => {
            CometChat.logout()
                .then((message) => {
                CometChatUIKitLoginListener.removeLoggedInUser();
                resolve(message);
                CometChatUIKitLoginListener.removeLoggedInUser();
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    // Error handling to give better logs
    static checkAuthSettings() {
        if (CometChatUIKit.uiKitSettings == null) {
            return false;
        }
        if (CometChatUIKit.uiKitSettings.appId == null) {
            return false;
        }
        return true;
    }
    /**
     * Sends a form message and emits events based on the message status.
     * @param message - The form message to be sent.
     * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
     */
    static sendFormMessage(message, disableLocalEvents = false) {
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.success,
                });
            }
        })
            .catch((error) => {
            message.setMetadata({ error });
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.error,
                });
            }
        });
    }
    static sendCardMessage(message, disableLocalEvents = false) {
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.success,
                });
            }
        })
            .catch((error) => {
            message.setMetadata({ error });
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.error,
                });
            }
        });
    }
    static sendCustomInteractiveMessage(message, disableLocalEvents = false) {
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.success,
                });
            }
        })
            .catch((error) => {
            message.setMetadata({ error });
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.error,
                });
            }
        });
    }
    // Helper methods to send messages
    // [sendCustomMessage] used to send a custom message
    static sendCustomMessage(message) {
        return new Promise((resolve, reject) => {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
            CometChat.sendCustomMessage(message)
                .then((message) => {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.success,
                });
                resolve(message);
            })
                .catch((error) => {
                message.setMetadata({ error: true });
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.error,
                });
                reject(error);
            });
        });
    }
    // Helper methods to send messages
    // [sendTextMessage] used to send a custom message
    static sendTextMessage(message) {
        return new Promise((resolve, reject) => {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
            CometChat.sendMessage(message)
                .then((message) => {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.success,
                });
                resolve(message);
            })
                .catch((error) => {
                message.setMetadata({ error: true });
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.error,
                });
                reject(error);
            });
        });
    }
    // Helper methods to send messages
    // [sendMediaMessage] used to send a custom message
    static sendMediaMessage(message) {
        return new Promise((resolve, reject) => {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
            CometChat.sendMediaMessage(message)
                .then((message) => {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.success,
                });
                resolve(message);
            })
                .catch((error) => {
                message.setMetadata({ error: true });
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.error,
                });
                reject(error);
            });
        });
    }
    /**
     * Sends a scheduler message and emits events based on the message status.
     * @param message - The scheduler message to be sent.
     * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
     */
    static sendSchedulerMessage(message, disableLocalEvents = false) {
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.success,
                });
            }
        })
            .catch((error) => {
            message.setMetadata({ error });
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: message,
                    status: MessageStatus.error,
                });
            }
        });
    }
}
CometChatUIKit.SoundManager = CometChatSoundManager;
CometChatUIKit.Localize = CometChatLocalize;
CometChatUIKit.defaultExtensions = [
    new StickersExtension(),
    new SmartReplyExtension(),
    new CollaborativeWhiteBoardExtension(),
    new CollaborativeDocumentExtension(),
    new MessageTranslationExtension(),
    new TextModeratorExtension(),
    new ThumbnailGenerationExtension(),
    new LinkPreviewExtension(),
    new PollsExtension(),
    new ImageModerationExtension(),
];
CometChatUIKit.defaultAIFeatures = [
    new AIConversationStarterExtension(),
    new AISmartRepliesExtension(),
    new AIConversationSummaryExtension(),
    new AIAssistBotExtension(),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tZXRDaGF0VUlLaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL1NoYXJlZC9Db21ldENoYXRVSWtpdC9Db21ldENoYXRVSUtpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQ0wsMkJBQTJCLEdBRTVCLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUVMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsc0JBQXNCLEVBR3RCLGFBQWEsR0FFZCxNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXZFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ2pFLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLHVFQUF1RSxDQUFDO0FBQ3ZILE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxNQUFNLDJFQUEyRSxDQUFDO0FBQzdILE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSwyREFBMkQsQ0FBQztBQUNyRyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSw0REFBNEQsQ0FBQztBQUNsRyxPQUFPLEVBQUUsMkJBQTJCLEVBQUUsTUFBTSxpRUFBaUUsQ0FBQztBQUM5RyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDaEYsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0scURBQXFELENBQUM7QUFDMUYsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDaEYsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sdURBQXVELENBQUM7QUFDL0YsT0FBTyxF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ZW5lcixcbiAgVUlLaXRTZXR0aW5ncyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBDYXJkTWVzc2FnZSxcbiAgQ2hhdFNka0V2ZW50SW5pdGlhbGl6ZXIsXG4gIENvbWV0Q2hhdExvY2FsaXplLFxuICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLFxuICBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gIEZvcm1NZXNzYWdlLFxuICBNZXNzYWdlU3RhdHVzLFxuICBTY2hlZHVsZXJNZXNzYWdlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVJS2l0U2hhcmVkU2V0dGluZ3MgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcblxuaW1wb3J0IHsgQ2FsbGluZ0V4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9DYWxscy9DYWxsaW5nRXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBDaGF0Q29uZmlndXJhdG9yIH0gZnJvbSBcIi4uL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb2xsYWJvcmF0aXZlRG9jdW1lbnRFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9Db2xsYWJvcmF0aXZlRG9jdW1lbnQvQ29sbGFib3JhdGl2ZURvY3VtZW50RXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBDb2xsYWJvcmF0aXZlV2hpdGVCb2FyZEV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL0NvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkL0NvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkRXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBFeHRlbnNpb25zRGF0YVNvdXJjZSB9IGZyb20gXCIuLi9GcmFtZXdvcmsvRXh0ZW5zaW9uRGF0YVNvdXJjZVwiO1xuaW1wb3J0IHsgSW1hZ2VNb2RlcmF0aW9uRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvSW1hZ2VNb2RlcmF0aW9uL0ltYWdlTW9kZXJhdGlvbkV4dGVuc2lvblwiO1xuaW1wb3J0IHsgTGlua1ByZXZpZXdFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9MaW5rUHJldmlld0V4dGVuc2lvbi9MaW5rUHJldmlld0V4dGVuc2lvblwiO1xuaW1wb3J0IHsgTWVzc2FnZVRyYW5zbGF0aW9uRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvTWVzc2FnZVRyYW5zbGF0aW9uL01lc3NhZ2VUcmFuc2xhdGlvbkV4dGVuc2lvblwiO1xuaW1wb3J0IHsgUG9sbHNFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9Qb2xsc0V4dGVuc2lvbi9Qb2xsc0V4dGVuc2lvblwiO1xuaW1wb3J0IHsgU21hcnRSZXBseUV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL1NtYXJ0UmVwbGllcy9TbWFydFJlcGxpZXNFeHRlbnNpb25cIjtcbmltcG9ydCB7IFN0aWNrZXJzRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvU3RpY2tlcnMvU3RpY2tlcnNFeHRlbnNpb25cIjtcbmltcG9ydCB7IFRleHRNb2RlcmF0b3JFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9UZXh0TW9kZXJhdG9yL1RleHRNb2RlcmF0b3JFeHRlbnNpb25cIjtcbmltcG9ydCB7IFRodW1ibmFpbEdlbmVyYXRpb25FeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9UaHVtYm5haWxHZW5lcmF0aW9uL1RodW1ibmFpbEdlbmVyYXRpb25FeHRlbnNpb25cIjtcbmltcG9ydCB7IEFJQ29udmVyc2F0aW9uU3VtbWFyeUV4dGVuc2lvbiB9IGZyb20gXCIuLy4uLy4uL0FJL0FJQ29udmVyc2F0aW9uU3VtbWFyeS9BSUNvbnZlcnNhdGlvblN1bW1hcnlcIjtcbmltcG9ydCB7IEFJU21hcnRSZXBsaWVzRXh0ZW5zaW9uIH0gZnJvbSBcIi4vLi4vLi4vQUkvQUlTbWFydFJlcGxpZXMvQUlTbWFydFJlcGxpZXNcIjtcbmltcG9ydCB7IEFJQ29udmVyc2F0aW9uU3RhcnRlckV4dGVuc2lvbiB9IGZyb20gXCIuLy4uLy4uL0FJL0FJQ29udmVyc2F0aW9uU3RhcnRlci9BSUNvbnZlcnNhdGlvblN0YXJ0ZXJcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFVJS2l0Q2FsbHMsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBBSUV4dGVuc2lvbkRhdGFTb3VyY2UgfSBmcm9tIFwiLi4vRnJhbWV3b3JrL0FJRXh0ZW5zaW9uRGF0YVNvdXJjZVwiO1xuaW1wb3J0IHsgQUlBc3Npc3RCb3RFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vQUkvQUlBc3Npc3RCb3QvQUlBc3Npc3RCb3RcIjtcblxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdFVJS2l0IHtcbiAgc3RhdGljIHVpS2l0U2V0dGluZ3M6IFVJS2l0U2V0dGluZ3M7XG4gIHN0YXRpYyBTb3VuZE1hbmFnZXI6IHR5cGVvZiBDb21ldENoYXRTb3VuZE1hbmFnZXIgPSBDb21ldENoYXRTb3VuZE1hbmFnZXI7XG4gIHN0YXRpYyBMb2NhbGl6ZTogdHlwZW9mIENvbWV0Q2hhdExvY2FsaXplID0gQ29tZXRDaGF0TG9jYWxpemU7XG4gIHN0YXRpYyBsb2dnZWRJblVzZXI/OiBDb21ldENoYXQuVXNlcjtcblxuICBzdGF0aWMgZ2V0RGF0YVNvdXJjZSgpIHtcbiAgICByZXR1cm4gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCk7XG4gIH1cbiAgc3RhdGljIGluaXQodWlLaXRTZXR0aW5nczogVUlLaXRTZXR0aW5ncyk6IFByb21pc2U8T2JqZWN0PiB8IHVuZGVmaW5lZCB7XG4gICAgLy8gcGVyZm9ybSBzZGsgaW5pdCB0YWtpbmcgdmFsdWVzIGZyb20gdWlLaXRTZXR0aW5nc1xuICAgIENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MgPSB1aUtpdFNldHRpbmdzO1xuICAgIGlmICh3aW5kb3cpIHtcbiAgICAgICg8YW55PndpbmRvdykuQ29tZXRDaGF0VWlLaXQgPSB7XG4gICAgICAgIG5hbWU6IFwiQGNvbWV0Y2hhdC9jaGF0LXVpa2l0LWFuZ3VsYXJcIixcbiAgICAgICAgdmVyc2lvbjogXCI0LjMuMVwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoQ29tZXRDaGF0VUlLaXRTaGFyZWRTZXR0aW5ncykge1xuICAgICAgQ29tZXRDaGF0VUlLaXRTaGFyZWRTZXR0aW5ncy51aWtpdFNldHRpbmdzID0gQ29tZXRDaGF0VUlLaXQ/LnVpS2l0U2V0dGluZ3M7XG4gICAgfSBpZiAoIUNvbWV0Q2hhdFVJS2l0LmNoZWNrQXV0aFNldHRpbmdzKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgYXBwU2V0dGluZ3NCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5BcHBTZXR0aW5nc0J1aWxkZXIoKTtcbiAgICBpZiAodWlLaXRTZXR0aW5ncy5nZXRSb2xlcygpKSB7XG4gICAgICBhcHBTZXR0aW5nc0J1aWxkZXIuc3Vic2NyaWJlUHJlc2VuY2VGb3JSb2xlcyh1aUtpdFNldHRpbmdzLmdldFJvbGVzKCkpO1xuICAgIH0gZWxzZSBpZiAodWlLaXRTZXR0aW5ncy5nZXRTdWJzY3JpcHRpb25UeXBlKCkgPT09IFwiQUxMX1VTRVJTXCIpIHtcbiAgICAgIGFwcFNldHRpbmdzQnVpbGRlci5zdWJzY3JpYmVQcmVzZW5jZUZvckFsbFVzZXJzKCk7XG4gICAgfSBlbHNlIGlmICh1aUtpdFNldHRpbmdzLmdldFN1YnNjcmlwdGlvblR5cGUoKSA9PT0gXCJGUklFTkRTXCIpIHtcbiAgICAgIGFwcFNldHRpbmdzQnVpbGRlci5zdWJzY3JpYmVQcmVzZW5jZUZvckZyaWVuZHMoKTtcbiAgICB9XG4gICAgYXBwU2V0dGluZ3NCdWlsZGVyLmF1dG9Fc3RhYmxpc2hTb2NrZXRDb25uZWN0aW9uKFxuICAgICAgdWlLaXRTZXR0aW5ncy5pc0F1dG9Fc3RhYmxpc2hTb2NrZXRDb25uZWN0aW9uKClcbiAgICApO1xuXG4gICAgYXBwU2V0dGluZ3NCdWlsZGVyLnNldFJlZ2lvbih1aUtpdFNldHRpbmdzLmdldFJlZ2lvbigpKTtcbiAgICBhcHBTZXR0aW5nc0J1aWxkZXIub3ZlcnJpZGVBZG1pbkhvc3QodWlLaXRTZXR0aW5ncy5nZXRBZG1pbkhvc3QoKSk7XG4gICAgYXBwU2V0dGluZ3NCdWlsZGVyLm92ZXJyaWRlQ2xpZW50SG9zdCh1aUtpdFNldHRpbmdzLmdldENsaWVudEhvc3QoKSk7XG4gICAgY29uc3QgYXBwU2V0dGluZ3MgPSBhcHBTZXR0aW5nc0J1aWxkZXIuYnVpbGQoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgQ29tZXRDaGF0LmluaXQodWlLaXRTZXR0aW5ncz8uYXBwSWQsIGFwcFNldHRpbmdzKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0LnNldFNvdXJjZShcInVpa2l0LXY0XCIsIFwid2ViXCIsIFwiYW5ndWxhclwiKTtcbiAgICAgICAgICBDb21ldENoYXRVSUtpdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgICAgICAgPy50aGVuKCh1c2VyKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnNldExvZ2dlZEluVXNlcih1c2VyKTtcbiAgICAgICAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmluaXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYXRlQWZ0ZXJMb2dpbigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlc29sdmUodXNlcik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0TG9nZ2VkaW5Vc2VyKCk6IFByb21pc2U8Q29tZXRDaGF0LlVzZXI+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh1c2VyISk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBkZWZhdWx0RXh0ZW5zaW9uczogRXh0ZW5zaW9uc0RhdGFTb3VyY2VbXSA9IFtcbiAgICBuZXcgU3RpY2tlcnNFeHRlbnNpb24oKSxcbiAgICBuZXcgU21hcnRSZXBseUV4dGVuc2lvbigpLFxuICAgIG5ldyBDb2xsYWJvcmF0aXZlV2hpdGVCb2FyZEV4dGVuc2lvbigpLFxuICAgIG5ldyBDb2xsYWJvcmF0aXZlRG9jdW1lbnRFeHRlbnNpb24oKSxcbiAgICBuZXcgTWVzc2FnZVRyYW5zbGF0aW9uRXh0ZW5zaW9uKCksXG4gICAgbmV3IFRleHRNb2RlcmF0b3JFeHRlbnNpb24oKSxcbiAgICBuZXcgVGh1bWJuYWlsR2VuZXJhdGlvbkV4dGVuc2lvbigpLFxuICAgIG5ldyBMaW5rUHJldmlld0V4dGVuc2lvbigpLFxuICAgIG5ldyBQb2xsc0V4dGVuc2lvbigpLFxuICAgIG5ldyBJbWFnZU1vZGVyYXRpb25FeHRlbnNpb24oKSxcbiAgXTtcblxuICBzdGF0aWMgZGVmYXVsdEFJRmVhdHVyZXM6IEFJRXh0ZW5zaW9uRGF0YVNvdXJjZVtdID0gW1xuICAgIG5ldyBBSUNvbnZlcnNhdGlvblN0YXJ0ZXJFeHRlbnNpb24oKSxcbiAgICBuZXcgQUlTbWFydFJlcGxpZXNFeHRlbnNpb24oKSxcbiAgICBuZXcgQUlDb252ZXJzYXRpb25TdW1tYXJ5RXh0ZW5zaW9uKCksXG4gICAgbmV3IEFJQXNzaXN0Qm90RXh0ZW5zaW9uKCksXG4gIF07XG4gIHN0YXRpYyBlbmFibGVDYWxsaW5nKCk6IHZvaWQge1xuICAgIGlmIChDb21ldENoYXRVSUtpdENhbGxzKSB7XG4gICAgICBjb25zdCBjYWxsQXBwU2V0dGluZyA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxBcHBTZXR0aW5nc0J1aWxkZXIoKVxuICAgICAgICAuc2V0QXBwSWQoQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncz8uYXBwSWQpXG4gICAgICAgIC5zZXRSZWdpb24oQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncz8ucmVnaW9uKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuaW5pdChjYWxsQXBwU2V0dGluZykudGhlbihcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29tZXRDaGF0Q2FsbHMgaW5pdGlhbGl6YXRpb24gc3VjY2Vzc1wiKTtcbiAgICAgICAgICBuZXcgQ2FsbGluZ0V4dGVuc2lvbigpLmVuYWJsZSgpO1xuICAgICAgICB9LFxuICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgXCJDb21ldENoYXRDYWxscyBpbml0aWFsaXphdGlvbiBmYWlsZWQgd2l0aCBlcnJvcjpcIixcbiAgICAgICAgICAgIGVycm9yXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBpbml0aWF0ZUFmdGVyTG9naW4oKSB7XG4gICAgaWYgKENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MgIT0gbnVsbCkge1xuICAgICAgdGhpcy5lbmFibGVDYWxsaW5nKCk7XG4gICAgICBsZXQgZXh0ZW5zaW9uTGlzdDogRXh0ZW5zaW9uc0RhdGFTb3VyY2VbXSA9XG4gICAgICAgIHRoaXMudWlLaXRTZXR0aW5ncz8uZXh0ZW5zaW9ucyB8fCB0aGlzLmRlZmF1bHRFeHRlbnNpb25zO1xuXG4gICAgICBsZXQgYWlGZWF0dXJlc0xpc3Q6IEFJRXh0ZW5zaW9uRGF0YVNvdXJjZVtdID0gQXJyYXkuaXNBcnJheShcbiAgICAgICAgdGhpcy51aUtpdFNldHRpbmdzPy5haUZlYXR1cmVzXG4gICAgICApXG4gICAgICAgID8gdGhpcy51aUtpdFNldHRpbmdzPy5haUZlYXR1cmVzXG4gICAgICAgIDogdGhpcy5kZWZhdWx0QUlGZWF0dXJlcztcbiAgICAgIENoYXRTZGtFdmVudEluaXRpYWxpemVyLmF0dGFjaExpc3RlbmVycygpO1xuICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLmF0dGFjaExpc3RlbmVyKCk7XG4gICAgICBpZiAoZXh0ZW5zaW9uTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGV4dGVuc2lvbkxpc3QuZm9yRWFjaCgoZXh0ZW5zaW9uOiBFeHRlbnNpb25zRGF0YVNvdXJjZSkgPT4ge1xuICAgICAgICAgIGV4dGVuc2lvbj8uZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYWlGZWF0dXJlc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICBhaUZlYXR1cmVzTGlzdC5mb3JFYWNoKChhaUZlYXR1cmVzOiBBSUV4dGVuc2lvbkRhdGFTb3VyY2UpID0+IHtcbiAgICAgICAgICBhaUZlYXR1cmVzPy5lbmFibGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHN0YXRpYyBhc3luYyBsb2dpbihkZXRhaWxzOiB7XG4gICAgdWlkPzogc3RyaW5nO1xuICAgIGF1dGhUb2tlbj86IHN0cmluZztcbiAgfSk6IFByb21pc2U8T2JqZWN0IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCFDb21ldENoYXRVSUtpdC5jaGVja0F1dGhTZXR0aW5ncygpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBDb21ldENoYXRVSUtpdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgICA/LnRoZW4oKHVzZXIpID0+IHtcbiAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnNldExvZ2dlZEluVXNlcih1c2VyKTtcbiAgICAgICAgICAgIHJlc29sdmUodXNlcik7XG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuc2V0TG9nZ2VkSW5Vc2VyKHVzZXIpO1xuICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5pbml0KCk7XG4gICAgICAgICAgICB0aGlzLmluaXRpYXRlQWZ0ZXJMb2dpbigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgYXJnczogYW55W10gPSBkZXRhaWxzLnVpZFxuICAgICAgICAgICAgICA/IFtkZXRhaWxzLnVpZCwgQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncy5hdXRoS2V5IV1cbiAgICAgICAgICAgICAgOiBbZGV0YWlscy5hdXRoVG9rZW5dO1xuICAgICAgICAgICAgQ29tZXRDaGF0LmxvZ2luKC4uLmFyZ3MpXG4gICAgICAgICAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5zZXRMb2dnZWRJblVzZXIodXNlcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh1c2VyKTtcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuc2V0TG9nZ2VkSW5Vc2VyKHVzZXIpO1xuICAgICAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuaW5pdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhdGVBZnRlckxvZ2luKCk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBzdGF0aWMgYXN5bmMgY3JlYXRlVXNlcih1c2VyOiBDb21ldENoYXQuVXNlcik6IFByb21pc2U8T2JqZWN0IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCFDb21ldENoYXRVSUtpdC5jaGVja0F1dGhTZXR0aW5ncygpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBDb21ldENoYXQuY3JlYXRlVXNlcih1c2VyLCBDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzLmF1dGhLZXkhKVxuICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICByZXNvbHZlKHVzZXIpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgc3RhdGljIGFzeW5jIHVwZGF0ZVVzZXIodXNlcjogQ29tZXRDaGF0LlVzZXIpOiBQcm9taXNlPE9iamVjdCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICghQ29tZXRDaGF0VUlLaXQuY2hlY2tBdXRoU2V0dGluZ3MoKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgQ29tZXRDaGF0LnVwZGF0ZVVzZXIodXNlciwgQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncy5hdXRoS2V5ISlcbiAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSh1c2VyKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHN0YXRpYyBhc3luYyBsb2dvdXQoKTogUHJvbWlzZTxPYmplY3QgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAoIUNvbWV0Q2hhdFVJS2l0LmNoZWNrQXV0aFNldHRpbmdzKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIENvbWV0Q2hhdC5sb2dvdXQoKVxuICAgICAgICAudGhlbigobWVzc2FnZTogb2JqZWN0KSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnJlbW92ZUxvZ2dlZEluVXNlcigpO1xuICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnJlbW92ZUxvZ2dlZEluVXNlcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgLy8gRXJyb3IgaGFuZGxpbmcgdG8gZ2l2ZSBiZXR0ZXIgbG9nc1xuICBzdGF0aWMgY2hlY2tBdXRoU2V0dGluZ3MoKTogYm9vbGVhbiB7XG4gICAgaWYgKENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncy5hcHBJZCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmRzIGEgZm9ybSBtZXNzYWdlIGFuZCBlbWl0cyBldmVudHMgYmFzZWQgb24gdGhlIG1lc3NhZ2Ugc3RhdHVzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSAtIFRoZSBmb3JtIG1lc3NhZ2UgdG8gYmUgc2VudC5cbiAgICogQHBhcmFtIGRpc2FibGVMb2NhbEV2ZW50cyAtIEEgYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZGlzYWJsZSBsb2NhbCBldmVudHMgb3Igbm90LiBEZWZhdWx0IHZhbHVlIGlzIGZhbHNlLlxuICAgKi9cbiAgc3RhdGljIHNlbmRGb3JtTWVzc2FnZShcbiAgICBtZXNzYWdlOiBGb3JtTWVzc2FnZSxcbiAgICBkaXNhYmxlTG9jYWxFdmVudHM6IGJvb2xlYW4gPSBmYWxzZVxuICApIHtcbiAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBDb21ldENoYXQuc2VuZEludGVyYWN0aXZlTWVzc2FnZShtZXNzYWdlKVxuICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgbWVzc2FnZS5zZXRNZXRhZGF0YSh7IGVycm9yIH0pO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHNlbmRDYXJkTWVzc2FnZShcbiAgICBtZXNzYWdlOiBDYXJkTWVzc2FnZSxcbiAgICBkaXNhYmxlTG9jYWxFdmVudHM6IGJvb2xlYW4gPSBmYWxzZVxuICApIHtcbiAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBDb21ldENoYXQuc2VuZEludGVyYWN0aXZlTWVzc2FnZShtZXNzYWdlKVxuICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgbWVzc2FnZS5zZXRNZXRhZGF0YSh7IGVycm9yIH0pO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHNlbmRDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlLFxuICAgIGRpc2FibGVMb2NhbEV2ZW50czogYm9vbGVhbiA9IGZhbHNlXG4gICkge1xuICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgfSk7XG4gICAgfVxuICAgIENvbWV0Q2hhdC5zZW5kSW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3IgfSk7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kcyB0byBzZW5kIG1lc3NhZ2VzXG4gIC8vIFtzZW5kQ3VzdG9tTWVzc2FnZV0gdXNlZCB0byBzZW5kIGEgY3VzdG9tIG1lc3NhZ2VcbiAgc3RhdGljIHNlbmRDdXN0b21NZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlXG4gICk6IFByb21pc2U8Q29tZXRDaGF0LkJhc2VNZXNzYWdlPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICB9KTtcbiAgICAgIENvbWV0Q2hhdC5zZW5kQ3VzdG9tTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2RzIHRvIHNlbmQgbWVzc2FnZXNcbiAgLy8gW3NlbmRUZXh0TWVzc2FnZV0gdXNlZCB0byBzZW5kIGEgY3VzdG9tIG1lc3NhZ2VcbiAgc3RhdGljIHNlbmRUZXh0TWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgKTogUHJvbWlzZTxDb21ldENoYXQuQmFzZU1lc3NhZ2U+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuICAgICAgQ29tZXRDaGF0LnNlbmRNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIG1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgdG8gc2VuZCBtZXNzYWdlc1xuICAvLyBbc2VuZE1lZGlhTWVzc2FnZV0gdXNlZCB0byBzZW5kIGEgY3VzdG9tIG1lc3NhZ2VcbiAgc3RhdGljIHNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZVxuICApOiBQcm9taXNlPENvbWV0Q2hhdC5CYXNlTWVzc2FnZT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgfSk7XG4gICAgICBDb21ldENoYXQuc2VuZE1lZGlhTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogU2VuZHMgYSBzY2hlZHVsZXIgbWVzc2FnZSBhbmQgZW1pdHMgZXZlbnRzIGJhc2VkIG9uIHRoZSBtZXNzYWdlIHN0YXR1cy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgLSBUaGUgc2NoZWR1bGVyIG1lc3NhZ2UgdG8gYmUgc2VudC5cbiAgICogQHBhcmFtIGRpc2FibGVMb2NhbEV2ZW50cyAtIEEgYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZGlzYWJsZSBsb2NhbCBldmVudHMgb3Igbm90LiBEZWZhdWx0IHZhbHVlIGlzIGZhbHNlLlxuICAgKi9cbiAgc3RhdGljIHNlbmRTY2hlZHVsZXJNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UsXG4gICAgZGlzYWJsZUxvY2FsRXZlbnRzOiBib29sZWFuID0gZmFsc2VcbiAgKSB7XG4gICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICB9KTtcbiAgICB9XG4gICAgQ29tZXRDaGF0LnNlbmRJbnRlcmFjdGl2ZU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIG1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBlcnJvciB9KTtcbiAgICAgICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxufVxuIl19