import { CometChatUIKitLoginListener, CometChatUIKitUtility, InteractiveMessageUtils, } from "@cometchat/uikit-shared";
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
                version: "4.3.4",
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
        message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        if (!message?.getMuid()) {
            message.setMuid(CometChatUIKitUtility.ID());
        }
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            let interactiveMessage = InteractiveMessageUtils.convertInteractiveMessage(message);
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: interactiveMessage,
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
        message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        if (!message?.getMuid()) {
            message.setMuid(CometChatUIKitUtility.ID());
        }
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            let interactiveMessage = InteractiveMessageUtils.convertInteractiveMessage(message);
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: interactiveMessage,
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
        message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        if (!message?.getMuid()) {
            message.setMuid(CometChatUIKitUtility.ID());
        }
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            let interactiveMessage = InteractiveMessageUtils.convertInteractiveMessage(message);
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: interactiveMessage,
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
            message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            if (!message?.getMuid()) {
                message.setMuid(CometChatUIKitUtility.ID());
            }
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
            message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            if (!message?.getMuid()) {
                message.setMuid(CometChatUIKitUtility.ID());
            }
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
            message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            if (!message?.getMuid()) {
                message.setMuid(CometChatUIKitUtility.ID());
            }
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
        message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        if (!message?.getMuid()) {
            message.setMuid(CometChatUIKitUtility.ID());
        }
        if (!disableLocalEvents) {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.inprogress,
            });
        }
        CometChat.sendInteractiveMessage(message)
            .then((message) => {
            let interactiveMessage = InteractiveMessageUtils.convertInteractiveMessage(message);
            if (!disableLocalEvents) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: interactiveMessage,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tZXRDaGF0VUlLaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL1NoYXJlZC9Db21ldENoYXRVSWtpdC9Db21ldENoYXRVSUtpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQ0wsMkJBQTJCLEVBQzNCLHFCQUFxQixFQUNyQix1QkFBdUIsR0FFeEIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBRUwsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixzQkFBc0IsRUFHdEIsYUFBYSxHQUVkLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLDRCQUE0QixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFdkUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDaEUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDakUsT0FBTyxFQUFFLDhCQUE4QixFQUFFLE1BQU0sdUVBQXVFLENBQUM7QUFDdkgsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLE1BQU0sMkVBQTJFLENBQUM7QUFDN0gsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDJEQUEyRCxDQUFDO0FBQ3JHLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDREQUE0RCxDQUFDO0FBQ2xHLE9BQU8sRUFBRSwyQkFBMkIsRUFBRSxNQUFNLGlFQUFpRSxDQUFDO0FBQzlHLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxnREFBZ0QsQ0FBQztBQUNoRixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxxREFBcUQsQ0FBQztBQUMxRixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNoRixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFB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QUM1QixDQUFDLENBQUM7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQzs7QUF0ZU0sMkJBQVksR0FBaUMscUJBQXFCLENBQUM7QUFDbkUsdUJBQVEsR0FBNkIsaUJBQWlCLENBQUM7QUF5RXZELGdDQUFpQixHQUEyQjtJQUNqRCxJQUFJLGlCQUFpQixFQUFFO0lBQ3ZCLElBQUksbUJBQW1CLEVBQUU7SUFDekIsSUFBSSxnQ0FBZ0MsRUFBRTtJQUN0QyxJQUFJLDhCQUE4QixFQUFFO0lBQ3BDLElBQUksMkJBQTJCLEVBQUU7SUFDakMsSUFBSSxzQkFBc0IsRUFBRTtJQUM1QixJQUFJLDRCQUE0QixFQUFFO0lBQ2xDLElBQUksb0JBQW9CLEVBQUU7SUFDMUIsSUFBSSxjQUFjLEVBQUU7SUFDcEIsSUFBSSx3QkFBd0IsRUFBRTtDQUMvQixDQUFDO0FBRUssZ0NBQWlCLEdBQTRCO0lBQ2xELElBQUksOEJBQThCLEVBQUU7SUFDcEMsSUFBSSx1QkFBdUIsRUFBRTtJQUM3QixJQUFJLDhCQUE4QixFQUFFO0lBQ3BDLElBQUksb0JBQW9CLEVBQUU7Q0FDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHtcbiAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLFxuICBDb21ldENoYXRVSUtpdFV0aWxpdHksXG4gIEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLFxuICBVSUtpdFNldHRpbmdzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIENhcmRNZXNzYWdlLFxuICBDaGF0U2RrRXZlbnRJbml0aWFsaXplcixcbiAgQ29tZXRDaGF0TG9jYWxpemUsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSxcbiAgRm9ybU1lc3NhZ2UsXG4gIE1lc3NhZ2VTdGF0dXMsXG4gIFNjaGVkdWxlck1lc3NhZ2UsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXRTaGFyZWRTZXR0aW5ncyB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuXG5pbXBvcnQgeyBDYWxsaW5nRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0NhbGxzL0NhbGxpbmdFeHRlbnNpb25cIjtcbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbGxhYm9yYXRpdmVEb2N1bWVudEV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL0NvbGxhYm9yYXRpdmVEb2N1bWVudC9Db2xsYWJvcmF0aXZlRG9jdW1lbnRFeHRlbnNpb25cIjtcbmltcG9ydCB7IENvbGxhYm9yYXRpdmVXaGl0ZUJvYXJkRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmQvQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRFeHRlbnNpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IEV4dGVuc2lvbnNEYXRhU291cmNlIH0gZnJvbSBcIi4uL0ZyYW1ld29yay9FeHRlbnNpb25EYXRhU291cmNlXCI7XG5pbXBvcnQgeyBJbWFnZU1vZGVyYXRpb25FeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9JbWFnZU1vZGVyYXRpb24vSW1hZ2VNb2RlcmF0aW9uRXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBMaW5rUHJldmlld0V4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL0xpbmtQcmV2aWV3RXh0ZW5zaW9uL0xpbmtQcmV2aWV3RXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBNZXNzYWdlVHJhbnNsYXRpb25FeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9NZXNzYWdlVHJhbnNsYXRpb24vTWVzc2FnZVRyYW5zbGF0aW9uRXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBQb2xsc0V4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL1BvbGxzRXh0ZW5zaW9uL1BvbGxzRXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBTbWFydFJlcGx5RXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvU21hcnRSZXBsaWVzL1NtYXJ0UmVwbGllc0V4dGVuc2lvblwiO1xuaW1wb3J0IHsgU3RpY2tlcnNFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9TdGlja2Vycy9TdGlja2Vyc0V4dGVuc2lvblwiO1xuaW1wb3J0IHsgVGV4dE1vZGVyYXRvckV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL1RleHRNb2RlcmF0b3IvVGV4dE1vZGVyYXRvckV4dGVuc2lvblwiO1xuaW1wb3J0IHsgVGh1bWJuYWlsR2VuZXJhdGlvbkV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL1RodW1ibmFpbEdlbmVyYXRpb24vVGh1bWJuYWlsR2VuZXJhdGlvbkV4dGVuc2lvblwiO1xuaW1wb3J0IHsgQUlDb252ZXJzYXRpb25TdW1tYXJ5RXh0ZW5zaW9uIH0gZnJvbSBcIi4vLi4vLi4vQUkvQUlDb252ZXJzYXRpb25TdW1tYXJ5L0FJQ29udmVyc2F0aW9uU3VtbWFyeVwiO1xuaW1wb3J0IHsgQUlTbWFydFJlcGxpZXNFeHRlbnNpb24gfSBmcm9tIFwiLi8uLi8uLi9BSS9BSVNtYXJ0UmVwbGllcy9BSVNtYXJ0UmVwbGllc1wiO1xuaW1wb3J0IHsgQUlDb252ZXJzYXRpb25TdGFydGVyRXh0ZW5zaW9uIH0gZnJvbSBcIi4vLi4vLi4vQUkvQUlDb252ZXJzYXRpb25TdGFydGVyL0FJQ29udmVyc2F0aW9uU3RhcnRlclwiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0VUlLaXRDYWxscyxcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IEFJRXh0ZW5zaW9uRGF0YVNvdXJjZSB9IGZyb20gXCIuLi9GcmFtZXdvcmsvQUlFeHRlbnNpb25EYXRhU291cmNlXCI7XG5pbXBvcnQgeyBBSUFzc2lzdEJvdEV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9BSS9BSUFzc2lzdEJvdC9BSUFzc2lzdEJvdFwiO1xuXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0VUlLaXQge1xuICBzdGF0aWMgdWlLaXRTZXR0aW5nczogVUlLaXRTZXR0aW5ncztcbiAgc3RhdGljIFNvdW5kTWFuYWdlcjogdHlwZW9mIENvbWV0Q2hhdFNvdW5kTWFuYWdlciA9IENvbWV0Q2hhdFNvdW5kTWFuYWdlcjtcbiAgc3RhdGljIExvY2FsaXplOiB0eXBlb2YgQ29tZXRDaGF0TG9jYWxpemUgPSBDb21ldENoYXRMb2NhbGl6ZTtcbiAgc3RhdGljIGxvZ2dlZEluVXNlcj86IENvbWV0Q2hhdC5Vc2VyO1xuXG4gIHN0YXRpYyBnZXREYXRhU291cmNlKCkge1xuICAgIHJldHVybiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKTtcbiAgfVxuICBzdGF0aWMgaW5pdCh1aUtpdFNldHRpbmdzOiBVSUtpdFNldHRpbmdzKTogUHJvbWlzZTxPYmplY3Q+IHwgdW5kZWZpbmVkIHtcbiAgICAvLyBwZXJmb3JtIHNkayBpbml0IHRha2luZyB2YWx1ZXMgZnJvbSB1aUtpdFNldHRpbmdzXG4gICAgQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncyA9IHVpS2l0U2V0dGluZ3M7XG4gICAgaWYgKHdpbmRvdykge1xuICAgICAgKDxhbnk+d2luZG93KS5Db21ldENoYXRVaUtpdCA9IHtcbiAgICAgICAgbmFtZTogXCJAY29tZXRjaGF0L2NoYXQtdWlraXQtYW5ndWxhclwiLFxuICAgICAgICB2ZXJzaW9uOiBcIjQuMy40XCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChDb21ldENoYXRVSUtpdFNoYXJlZFNldHRpbmdzKSB7XG4gICAgICBDb21ldENoYXRVSUtpdFNoYXJlZFNldHRpbmdzLnVpa2l0U2V0dGluZ3MgPSBDb21ldENoYXRVSUtpdD8udWlLaXRTZXR0aW5ncztcbiAgICB9IGlmICghQ29tZXRDaGF0VUlLaXQuY2hlY2tBdXRoU2V0dGluZ3MoKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBjb25zdCBhcHBTZXR0aW5nc0J1aWxkZXIgPSBuZXcgQ29tZXRDaGF0LkFwcFNldHRpbmdzQnVpbGRlcigpO1xuICAgIGlmICh1aUtpdFNldHRpbmdzLmdldFJvbGVzKCkpIHtcbiAgICAgIGFwcFNldHRpbmdzQnVpbGRlci5zdWJzY3JpYmVQcmVzZW5jZUZvclJvbGVzKHVpS2l0U2V0dGluZ3MuZ2V0Um9sZXMoKSk7XG4gICAgfSBlbHNlIGlmICh1aUtpdFNldHRpbmdzLmdldFN1YnNjcmlwdGlvblR5cGUoKSA9PT0gXCJBTExfVVNFUlNcIikge1xuICAgICAgYXBwU2V0dGluZ3NCdWlsZGVyLnN1YnNjcmliZVByZXNlbmNlRm9yQWxsVXNlcnMoKTtcbiAgICB9IGVsc2UgaWYgKHVpS2l0U2V0dGluZ3MuZ2V0U3Vic2NyaXB0aW9uVHlwZSgpID09PSBcIkZSSUVORFNcIikge1xuICAgICAgYXBwU2V0dGluZ3NCdWlsZGVyLnN1YnNjcmliZVByZXNlbmNlRm9yRnJpZW5kcygpO1xuICAgIH1cbiAgICBhcHBTZXR0aW5nc0J1aWxkZXIuYXV0b0VzdGFibGlzaFNvY2tldENvbm5lY3Rpb24oXG4gICAgICB1aUtpdFNldHRpbmdzLmlzQXV0b0VzdGFibGlzaFNvY2tldENvbm5lY3Rpb24oKVxuICAgICk7XG5cbiAgICBhcHBTZXR0aW5nc0J1aWxkZXIuc2V0UmVnaW9uKHVpS2l0U2V0dGluZ3MuZ2V0UmVnaW9uKCkpO1xuICAgIGFwcFNldHRpbmdzQnVpbGRlci5vdmVycmlkZUFkbWluSG9zdCh1aUtpdFNldHRpbmdzLmdldEFkbWluSG9zdCgpKTtcbiAgICBhcHBTZXR0aW5nc0J1aWxkZXIub3ZlcnJpZGVDbGllbnRIb3N0KHVpS2l0U2V0dGluZ3MuZ2V0Q2xpZW50SG9zdCgpKTtcbiAgICBjb25zdCBhcHBTZXR0aW5ncyA9IGFwcFNldHRpbmdzQnVpbGRlci5idWlsZCgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBDb21ldENoYXQuaW5pdCh1aUtpdFNldHRpbmdzPy5hcHBJZCwgYXBwU2V0dGluZ3MpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBDb21ldENoYXQuc2V0U291cmNlKFwidWlraXQtdjRcIiwgXCJ3ZWJcIiwgXCJhbmd1bGFyXCIpO1xuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgICAgICA/LnRoZW4oKHVzZXIpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuc2V0TG9nZ2VkSW5Vc2VyKHVzZXIpO1xuICAgICAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuaW5pdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhdGVBZnRlckxvZ2luKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzb2x2ZSh1c2VyKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRMb2dnZWRpblVzZXIoKTogUHJvbWlzZTxDb21ldENoYXQuVXNlcj4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHVzZXIhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGRlZmF1bHRFeHRlbnNpb25zOiBFeHRlbnNpb25zRGF0YVNvdXJjZVtdID0gW1xuICAgIG5ldyBTdGlja2Vyc0V4dGVuc2lvbigpLFxuICAgIG5ldyBTbWFydFJlcGx5RXh0ZW5zaW9uKCksXG4gICAgbmV3IENvbGxhYm9yYXRpdmVXaGl0ZUJvYXJkRXh0ZW5zaW9uKCksXG4gICAgbmV3IENvbGxhYm9yYXRpdmVEb2N1bWVudEV4dGVuc2lvbigpLFxuICAgIG5ldyBNZXNzYWdlVHJhbnNsYXRpb25FeHRlbnNpb24oKSxcbiAgICBuZXcgVGV4dE1vZGVyYXRvckV4dGVuc2lvbigpLFxuICAgIG5ldyBUaHVtYm5haWxHZW5lcmF0aW9uRXh0ZW5zaW9uKCksXG4gICAgbmV3IExpbmtQcmV2aWV3RXh0ZW5zaW9uKCksXG4gICAgbmV3IFBvbGxzRXh0ZW5zaW9uKCksXG4gICAgbmV3IEltYWdlTW9kZXJhdGlvbkV4dGVuc2lvbigpLFxuICBdO1xuXG4gIHN0YXRpYyBkZWZhdWx0QUlGZWF0dXJlczogQUlFeHRlbnNpb25EYXRhU291cmNlW10gPSBbXG4gICAgbmV3IEFJQ29udmVyc2F0aW9uU3RhcnRlckV4dGVuc2lvbigpLFxuICAgIG5ldyBBSVNtYXJ0UmVwbGllc0V4dGVuc2lvbigpLFxuICAgIG5ldyBBSUNvbnZlcnNhdGlvblN1bW1hcnlFeHRlbnNpb24oKSxcbiAgICBuZXcgQUlBc3Npc3RCb3RFeHRlbnNpb24oKSxcbiAgXTtcbiAgc3RhdGljIGVuYWJsZUNhbGxpbmcoKTogdm9pZCB7XG4gICAgaWYgKENvbWV0Q2hhdFVJS2l0Q2FsbHMpIHtcbiAgICAgIGNvbnN0IGNhbGxBcHBTZXR0aW5nID0gbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbEFwcFNldHRpbmdzQnVpbGRlcigpXG4gICAgICAgIC5zZXRBcHBJZChDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzPy5hcHBJZClcbiAgICAgICAgLnNldFJlZ2lvbihDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzPy5yZWdpb24pXG4gICAgICAgIC5idWlsZCgpO1xuICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5pbml0KGNhbGxBcHBTZXR0aW5nKS50aGVuKFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb21ldENoYXRDYWxscyBpbml0aWFsaXphdGlvbiBzdWNjZXNzXCIpO1xuICAgICAgICAgIG5ldyBDYWxsaW5nRXh0ZW5zaW9uKCkuZW5hYmxlKCk7XG4gICAgICAgIH0sXG4gICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBcIkNvbWV0Q2hhdENhbGxzIGluaXRpYWxpemF0aW9uIGZhaWxlZCB3aXRoIGVycm9yOlwiLFxuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGluaXRpYXRlQWZ0ZXJMb2dpbigpIHtcbiAgICBpZiAoQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncyAhPSBudWxsKSB7XG4gICAgICB0aGlzLmVuYWJsZUNhbGxpbmcoKTtcbiAgICAgIGxldCBleHRlbnNpb25MaXN0OiBFeHRlbnNpb25zRGF0YVNvdXJjZVtdID1cbiAgICAgICAgdGhpcy51aUtpdFNldHRpbmdzPy5leHRlbnNpb25zIHx8IHRoaXMuZGVmYXVsdEV4dGVuc2lvbnM7XG5cbiAgICAgIGxldCBhaUZlYXR1cmVzTGlzdDogQUlFeHRlbnNpb25EYXRhU291cmNlW10gPSBBcnJheS5pc0FycmF5KFxuICAgICAgICB0aGlzLnVpS2l0U2V0dGluZ3M/LmFpRmVhdHVyZXNcbiAgICAgIClcbiAgICAgICAgPyB0aGlzLnVpS2l0U2V0dGluZ3M/LmFpRmVhdHVyZXNcbiAgICAgICAgOiB0aGlzLmRlZmF1bHRBSUZlYXR1cmVzO1xuICAgICAgQ2hhdFNka0V2ZW50SW5pdGlhbGl6ZXIuYXR0YWNoTGlzdGVuZXJzKCk7XG4gICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuYXR0YWNoTGlzdGVuZXIoKTtcbiAgICAgIGlmIChleHRlbnNpb25MaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgZXh0ZW5zaW9uTGlzdC5mb3JFYWNoKChleHRlbnNpb246IEV4dGVuc2lvbnNEYXRhU291cmNlKSA9PiB7XG4gICAgICAgICAgZXh0ZW5zaW9uPy5lbmFibGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhaUZlYXR1cmVzTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFpRmVhdHVyZXNMaXN0LmZvckVhY2goKGFpRmVhdHVyZXM6IEFJRXh0ZW5zaW9uRGF0YVNvdXJjZSkgPT4ge1xuICAgICAgICAgIGFpRmVhdHVyZXM/LmVuYWJsZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgc3RhdGljIGFzeW5jIGxvZ2luKGRldGFpbHM6IHtcbiAgICB1aWQ/OiBzdHJpbmc7XG4gICAgYXV0aFRva2VuPzogc3RyaW5nO1xuICB9KTogUHJvbWlzZTxPYmplY3QgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAoIUNvbWV0Q2hhdFVJS2l0LmNoZWNrQXV0aFNldHRpbmdzKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIENvbWV0Q2hhdFVJS2l0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgID8udGhlbigodXNlcikgPT4ge1xuICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuc2V0TG9nZ2VkSW5Vc2VyKHVzZXIpO1xuICAgICAgICAgICAgcmVzb2x2ZSh1c2VyKTtcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5zZXRMb2dnZWRJblVzZXIodXNlcik7XG4gICAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmluaXQoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhdGVBZnRlckxvZ2luKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBhcmdzOiBhbnlbXSA9IGRldGFpbHMudWlkXG4gICAgICAgICAgICAgID8gW2RldGFpbHMudWlkLCBDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzLmF1dGhLZXkhXVxuICAgICAgICAgICAgICA6IFtkZXRhaWxzLmF1dGhUb2tlbl07XG4gICAgICAgICAgICBDb21ldENoYXQubG9naW4oLi4uYXJncylcbiAgICAgICAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnNldExvZ2dlZEluVXNlcih1c2VyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHVzZXIpO1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5zZXRMb2dnZWRJblVzZXIodXNlcik7XG4gICAgICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5pbml0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0aWF0ZUFmdGVyTG9naW4oKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHN0YXRpYyBhc3luYyBjcmVhdGVVc2VyKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKTogUHJvbWlzZTxPYmplY3QgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAoIUNvbWV0Q2hhdFVJS2l0LmNoZWNrQXV0aFNldHRpbmdzKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIENvbWV0Q2hhdC5jcmVhdGVVc2VyKHVzZXIsIENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MuYXV0aEtleSEpXG4gICAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIHJlc29sdmUodXNlcik7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBzdGF0aWMgYXN5bmMgdXBkYXRlVXNlcih1c2VyOiBDb21ldENoYXQuVXNlcik6IFByb21pc2U8T2JqZWN0IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCFDb21ldENoYXRVSUtpdC5jaGVja0F1dGhTZXR0aW5ncygpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBDb21ldENoYXQudXBkYXRlVXNlcih1c2VyLCBDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzLmF1dGhLZXkhKVxuICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICByZXNvbHZlKHVzZXIpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgc3RhdGljIGFzeW5jIGxvZ291dCgpOiBQcm9taXNlPE9iamVjdCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICghQ29tZXRDaGF0VUlLaXQuY2hlY2tBdXRoU2V0dGluZ3MoKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgQ29tZXRDaGF0LmxvZ291dCgpXG4gICAgICAgIC50aGVuKChtZXNzYWdlOiBvYmplY3QpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIucmVtb3ZlTG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIucmVtb3ZlTG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvLyBFcnJvciBoYW5kbGluZyB0byBnaXZlIGJldHRlciBsb2dzXG4gIHN0YXRpYyBjaGVja0F1dGhTZXR0aW5ncygpOiBib29sZWFuIHtcbiAgICBpZiAoQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzLmFwcElkID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYSBmb3JtIG1lc3NhZ2UgYW5kIGVtaXRzIGV2ZW50cyBiYXNlZCBvbiB0aGUgbWVzc2FnZSBzdGF0dXMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIC0gVGhlIGZvcm0gbWVzc2FnZSB0byBiZSBzZW50LlxuICAgKiBAcGFyYW0gZGlzYWJsZUxvY2FsRXZlbnRzIC0gQSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0byBkaXNhYmxlIGxvY2FsIGV2ZW50cyBvciBub3QuIERlZmF1bHQgdmFsdWUgaXMgZmFsc2UuXG4gICAqL1xuICBzdGF0aWMgc2VuZEZvcm1NZXNzYWdlKFxuICAgIG1lc3NhZ2U6IEZvcm1NZXNzYWdlLFxuICAgIGRpc2FibGVMb2NhbEV2ZW50czogYm9vbGVhbiA9IGZhbHNlXG4gICkge1xuICAgIG1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgIGlmICghbWVzc2FnZT8uZ2V0TXVpZCgpKSB7XG4gICAgICBtZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgIH1cbiAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBDb21ldENoYXQuc2VuZEludGVyYWN0aXZlTWVzc2FnZShtZXNzYWdlKVxuICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBsZXQgaW50ZXJhY3RpdmVNZXNzYWdlOiBGb3JtTWVzc2FnZSA9IEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLmNvbnZlcnRJbnRlcmFjdGl2ZU1lc3NhZ2UoXG4gICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuSW50ZXJhY3RpdmVNZXNzYWdlXG4gICAgICAgICkgYXMgRm9ybU1lc3NhZ2U7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogaW50ZXJhY3RpdmVNZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIG1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBlcnJvciB9KTtcbiAgICAgICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBzZW5kQ2FyZE1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ2FyZE1lc3NhZ2UsXG4gICAgZGlzYWJsZUxvY2FsRXZlbnRzOiBib29sZWFuID0gZmFsc2VcbiAgKSB7XG4gICAgbWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgaWYgKCFtZXNzYWdlPy5nZXRNdWlkKCkpIHtcbiAgICAgIG1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgfVxuICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgQ29tZXRDaGF0LnNlbmRJbnRlcmFjdGl2ZU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgbGV0IGludGVyYWN0aXZlTWVzc2FnZTogQ2FyZE1lc3NhZ2UgPSBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICApIGFzIENhcmRNZXNzYWdlO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGludGVyYWN0aXZlTWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3IgfSk7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgc2VuZEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZShcbiAgICBtZXNzYWdlOiBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gICAgZGlzYWJsZUxvY2FsRXZlbnRzOiBib29sZWFuID0gZmFsc2VcbiAgKSB7XG4gICAgbWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgaWYgKCFtZXNzYWdlPy5nZXRNdWlkKCkpIHtcbiAgICAgIG1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgfVxuICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgfSk7XG4gICAgfVxuICAgIENvbWV0Q2hhdC5zZW5kSW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGxldCBpbnRlcmFjdGl2ZU1lc3NhZ2U6IEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSA9IEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLmNvbnZlcnRJbnRlcmFjdGl2ZU1lc3NhZ2UoXG4gICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuSW50ZXJhY3RpdmVNZXNzYWdlXG4gICAgICAgICkgYXMgQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGludGVyYWN0aXZlTWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3IgfSk7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kcyB0byBzZW5kIG1lc3NhZ2VzXG4gIC8vIFtzZW5kQ3VzdG9tTWVzc2FnZV0gdXNlZCB0byBzZW5kIGEgY3VzdG9tIG1lc3NhZ2VcbiAgc3RhdGljIHNlbmRDdXN0b21NZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlXG4gICk6IFByb21pc2U8Q29tZXRDaGF0LkJhc2VNZXNzYWdlPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIG1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgICAgaWYgKCFtZXNzYWdlPy5nZXRNdWlkKCkpIHtcbiAgICAgICAgbWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICB9KTtcblxuICAgICAgQ29tZXRDaGF0LnNlbmRDdXN0b21NZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIG1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgdG8gc2VuZCBtZXNzYWdlc1xuICAvLyBbc2VuZFRleHRNZXNzYWdlXSB1c2VkIHRvIHNlbmQgYSBjdXN0b20gbWVzc2FnZVxuICBzdGF0aWMgc2VuZFRleHRNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICApOiBQcm9taXNlPENvbWV0Q2hhdC5CYXNlTWVzc2FnZT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBtZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICAgIGlmICghbWVzc2FnZT8uZ2V0TXVpZCgpKSB7XG4gICAgICAgIG1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgfSk7XG5cbiAgICAgIENvbWV0Q2hhdC5zZW5kTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2RzIHRvIHNlbmQgbWVzc2FnZXNcbiAgLy8gW3NlbmRNZWRpYU1lc3NhZ2VdIHVzZWQgdG8gc2VuZCBhIGN1c3RvbSBtZXNzYWdlXG4gIHN0YXRpYyBzZW5kTWVkaWFNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2VcbiAgKTogUHJvbWlzZTxDb21ldENoYXQuQmFzZU1lc3NhZ2U+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgICBpZiAoIW1lc3NhZ2U/LmdldE11aWQoKSkge1xuICAgICAgICBtZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgICAgfVxuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuXG4gICAgICBDb21ldENoYXQuc2VuZE1lZGlhTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogU2VuZHMgYSBzY2hlZHVsZXIgbWVzc2FnZSBhbmQgZW1pdHMgZXZlbnRzIGJhc2VkIG9uIHRoZSBtZXNzYWdlIHN0YXR1cy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgLSBUaGUgc2NoZWR1bGVyIG1lc3NhZ2UgdG8gYmUgc2VudC5cbiAgICogQHBhcmFtIGRpc2FibGVMb2NhbEV2ZW50cyAtIEEgYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZGlzYWJsZSBsb2NhbCBldmVudHMgb3Igbm90LiBEZWZhdWx0IHZhbHVlIGlzIGZhbHNlLlxuICAgKi9cbiAgc3RhdGljIHNlbmRTY2hlZHVsZXJNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UsXG4gICAgZGlzYWJsZUxvY2FsRXZlbnRzOiBib29sZWFuID0gZmFsc2VcbiAgKSB7XG5cbiAgICBtZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICBpZiAoIW1lc3NhZ2U/LmdldE11aWQoKSkge1xuICAgICAgbWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICB9XG5cbiAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIENvbWV0Q2hhdC5zZW5kSW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGxldCBpbnRlcmFjdGl2ZU1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UgPSBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICApIGFzIFNjaGVkdWxlck1lc3NhZ2U7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogaW50ZXJhY3RpdmVNZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIG1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBlcnJvciB9KTtcbiAgICAgICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxufVxuIl19