import { CometChatUIKitLoginListener, CometChatUIKitUtility, InteractiveMessageUtils, StorageUtils, } from "@cometchat/uikit-shared";
import { ChatSdkEventInitializer, CometChatLocalize, CometChatMessageEvents, CometChatUIKitConstants, MessageStatus, } from "@cometchat/uikit-resources";
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
                version: "4.3.20",
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
                if (this.uiKitSettings?.getCallingExtension()) {
                    this.uiKitSettings?.getCallingExtension().enable();
                }
                else {
                    this.defaultCallingExtension.enable();
                }
            }, (error) => {
                console.log("CometChatCalls initialization failed with error:", error);
            });
        }
    }
    static initiateAfterLogin() {
        if (CometChatUIKit.uiKitSettings != null) {
            CometChat.getConversationUpdateSettings().then((res) => {
                CometChatUIKit.conversationUpdateSettings = res;
            });
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
                StorageUtils.removeItem(CometChatUIKitConstants.calls.activecall);
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
            if (CometChatUIKitLoginListener.getLoggedInUser()) {
                message.setSender(CometChatUIKitLoginListener.getLoggedInUser());
            }
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
            if (CometChatUIKitLoginListener.getLoggedInUser()) {
                message.setSender(CometChatUIKitLoginListener.getLoggedInUser());
            }
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
            if (CometChatUIKitLoginListener.getLoggedInUser()) {
                message.setSender(CometChatUIKitLoginListener.getLoggedInUser());
            }
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
                if (CometChatUIKitLoginListener.getLoggedInUser()) {
                    message.setSender(CometChatUIKitLoginListener.getLoggedInUser());
                }
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
                if (CometChatUIKitLoginListener.getLoggedInUser()) {
                    message.setSender(CometChatUIKitLoginListener.getLoggedInUser());
                }
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
                if (CometChatUIKitLoginListener.getLoggedInUser()) {
                    message.setSender(CometChatUIKitLoginListener.getLoggedInUser());
                }
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
            if (CometChatUIKitLoginListener.getLoggedInUser()) {
                message.setSender(CometChatUIKitLoginListener.getLoggedInUser());
            }
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
/**
  * Default callingExtension included in the UI Kit.
  * @type {CallingExtensionDataSource}
  */
CometChatUIKit.defaultCallingExtension = new CallingExtension();
CometChatUIKit.defaultAIFeatures = [
    new AIConversationStarterExtension(),
    new AISmartRepliesExtension(),
    new AIConversationSummaryExtension(),
    new AIAssistBotExtension(),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tZXRDaGF0VUlLaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL1NoYXJlZC9Db21ldENoYXRVSWtpdC9Db21ldENoYXRVSUtpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBRUwsMkJBQTJCLEVBQzNCLHFCQUFxQixFQUNyQix1QkFBdUIsRUFDdkIsWUFBWSxHQUViLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUVMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsc0JBQXNCLEVBQ3RCLHVCQUF1QixFQUd2QixhQUFhLEdBRWQsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV2RSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUNoRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUNqRSxPQUFPLEVBQUUsOEJBQThCLEVBQUUsTUFBTSx1RUFBdUUsQ0FBQztBQUN2SCxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsTUFBTSwyRUFBMkUsQ0FBQztBQUM3SCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sMkRBQTJELENBQUM7QUFDckcsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sNERBQTRELENBQUM7QUFDbEcsT0FBTyxFQUFFLDJCQUEyQixFQUFFLE1BQU0saUVBQWlFLENBQUM7QUFDOUcsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGdEQUFnRCxDQUFDO0FBQ2hGLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHFEQUFxRCxDQUFDO0FBQzFGLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBQ2hGLE9B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QVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFO2dCQUN2QixzQkFBc0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDO29CQUN4QyxPQUFPLEVBQUUsT0FBTztvQkFDaEIsTUFBTSxFQUFFLGFBQWEsQ0FBQyxLQUFLO2lCQUM1QixDQUFDLENBQUM7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQzs7QUEzZ0JNLDJCQUFZLEdBQWlDLHFCQUFxQixDQUFDO0FBQ25FLHVCQUFRLEdBQTZCLGlCQUFpQixDQUFDO0FBeUV2RCxnQ0FBaUIsR0FBMkI7SUFDakQsSUFBSSxpQkFBaUIsRUFBRTtJQUN2QixJQUFJLG1CQUFtQixFQUFFO0lBQ3pCLElBQUksZ0NBQWdDLEVBQUU7SUFDdEMsSUFBSSw4QkFBOEIsRUFBRTtJQUNwQyxJQUFJLDJCQUEyQixFQUFFO0lBQ2pDLElBQUksc0JBQXNCLEVBQUU7SUFDNUIsSUFBSSw0QkFBNEIsRUFBRTtJQUNsQyxJQUFJLG9CQUFvQixFQUFFO0lBQzFCLElBQUksY0FBYyxFQUFFO0lBQ3BCLElBQUksd0JBQXdCLEVBQUU7Q0FDL0IsQ0FBQztBQUVGOzs7SUFHSTtBQUNHLHNDQUF1QixHQUErQixJQUFJLGdCQUFnQixFQUFFLENBQUE7QUFFNUUsZ0NBQWlCLEdBQTRCO0lBQ2xELElBQUksOEJBQThCLEVBQUU7SUFDcEMsSUFBSSx1QkFBdUIsRUFBRTtJQUM3QixJQUFJLDhCQUE4QixFQUFFO0lBQ3BDLElBQUksb0JBQW9CLEVBQUU7Q0FDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHtcbiAgQ2FsbGluZ0V4dGVuc2lvbkRhdGFTb3VyY2UsXG4gIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lcixcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscyxcbiAgU3RvcmFnZVV0aWxzLFxuICBVSUtpdFNldHRpbmdzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIENhcmRNZXNzYWdlLFxuICBDaGF0U2RrRXZlbnRJbml0aWFsaXplcixcbiAgQ29tZXRDaGF0TG9jYWxpemUsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gIEZvcm1NZXNzYWdlLFxuICBNZXNzYWdlU3RhdHVzLFxuICBTY2hlZHVsZXJNZXNzYWdlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVJS2l0U2hhcmVkU2V0dGluZ3MgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcblxuaW1wb3J0IHsgQ2FsbGluZ0V4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9DYWxscy9DYWxsaW5nRXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBDaGF0Q29uZmlndXJhdG9yIH0gZnJvbSBcIi4uL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb2xsYWJvcmF0aXZlRG9jdW1lbnRFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9Db2xsYWJvcmF0aXZlRG9jdW1lbnQvQ29sbGFib3JhdGl2ZURvY3VtZW50RXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBDb2xsYWJvcmF0aXZlV2hpdGVCb2FyZEV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL0NvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkL0NvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkRXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBFeHRlbnNpb25zRGF0YVNvdXJjZSB9IGZyb20gXCIuLi9GcmFtZXdvcmsvRXh0ZW5zaW9uRGF0YVNvdXJjZVwiO1xuaW1wb3J0IHsgSW1hZ2VNb2RlcmF0aW9uRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvSW1hZ2VNb2RlcmF0aW9uL0ltYWdlTW9kZXJhdGlvbkV4dGVuc2lvblwiO1xuaW1wb3J0IHsgTGlua1ByZXZpZXdFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9MaW5rUHJldmlld0V4dGVuc2lvbi9MaW5rUHJldmlld0V4dGVuc2lvblwiO1xuaW1wb3J0IHsgTWVzc2FnZVRyYW5zbGF0aW9uRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvTWVzc2FnZVRyYW5zbGF0aW9uL01lc3NhZ2VUcmFuc2xhdGlvbkV4dGVuc2lvblwiO1xuaW1wb3J0IHsgUG9sbHNFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9Qb2xsc0V4dGVuc2lvbi9Qb2xsc0V4dGVuc2lvblwiO1xuaW1wb3J0IHsgU21hcnRSZXBseUV4dGVuc2lvbiB9IGZyb20gXCIuLi8uLi9FeHRlbnNpb25zL1NtYXJ0UmVwbGllcy9TbWFydFJlcGxpZXNFeHRlbnNpb25cIjtcbmltcG9ydCB7IFN0aWNrZXJzRXh0ZW5zaW9uIH0gZnJvbSBcIi4uLy4uL0V4dGVuc2lvbnMvU3RpY2tlcnMvU3RpY2tlcnNFeHRlbnNpb25cIjtcbmltcG9ydCB7IFRleHRNb2RlcmF0b3JFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9UZXh0TW9kZXJhdG9yL1RleHRNb2RlcmF0b3JFeHRlbnNpb25cIjtcbmltcG9ydCB7IFRodW1ibmFpbEdlbmVyYXRpb25FeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vRXh0ZW5zaW9ucy9UaHVtYm5haWxHZW5lcmF0aW9uL1RodW1ibmFpbEdlbmVyYXRpb25FeHRlbnNpb25cIjtcbmltcG9ydCB7IEFJQ29udmVyc2F0aW9uU3VtbWFyeUV4dGVuc2lvbiB9IGZyb20gXCIuLy4uLy4uL0FJL0FJQ29udmVyc2F0aW9uU3VtbWFyeS9BSUNvbnZlcnNhdGlvblN1bW1hcnlcIjtcbmltcG9ydCB7IEFJU21hcnRSZXBsaWVzRXh0ZW5zaW9uIH0gZnJvbSBcIi4vLi4vLi4vQUkvQUlTbWFydFJlcGxpZXMvQUlTbWFydFJlcGxpZXNcIjtcbmltcG9ydCB7IEFJQ29udmVyc2F0aW9uU3RhcnRlckV4dGVuc2lvbiB9IGZyb20gXCIuLy4uLy4uL0FJL0FJQ29udmVyc2F0aW9uU3RhcnRlci9BSUNvbnZlcnNhdGlvblN0YXJ0ZXJcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFVJS2l0Q2FsbHMsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBBSUV4dGVuc2lvbkRhdGFTb3VyY2UgfSBmcm9tIFwiLi4vRnJhbWV3b3JrL0FJRXh0ZW5zaW9uRGF0YVNvdXJjZVwiO1xuaW1wb3J0IHsgQUlBc3Npc3RCb3RFeHRlbnNpb24gfSBmcm9tIFwiLi4vLi4vQUkvQUlBc3Npc3RCb3QvQUlBc3Npc3RCb3RcIjtcblxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdFVJS2l0IHtcbiAgc3RhdGljIHVpS2l0U2V0dGluZ3M6IFVJS2l0U2V0dGluZ3M7XG4gIHN0YXRpYyBTb3VuZE1hbmFnZXI6IHR5cGVvZiBDb21ldENoYXRTb3VuZE1hbmFnZXIgPSBDb21ldENoYXRTb3VuZE1hbmFnZXI7XG4gIHN0YXRpYyBMb2NhbGl6ZTogdHlwZW9mIENvbWV0Q2hhdExvY2FsaXplID0gQ29tZXRDaGF0TG9jYWxpemU7XG4gIHN0YXRpYyBsb2dnZWRJblVzZXI/OiBDb21ldENoYXQuVXNlcjtcbiAgc3RhdGljIGNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPzogQ29tZXRDaGF0LkNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzO1xuICBzdGF0aWMgZ2V0RGF0YVNvdXJjZSgpIHtcbiAgICByZXR1cm4gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCk7XG4gIH1cbiAgc3RhdGljIGluaXQodWlLaXRTZXR0aW5nczogVUlLaXRTZXR0aW5ncyk6IFByb21pc2U8T2JqZWN0PiB8IHVuZGVmaW5lZCB7XG4gICAgLy8gcGVyZm9ybSBzZGsgaW5pdCB0YWtpbmcgdmFsdWVzIGZyb20gdWlLaXRTZXR0aW5nc1xuICAgIENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MgPSB1aUtpdFNldHRpbmdzO1xuICAgIGlmICh3aW5kb3cpIHtcbiAgICAgICg8YW55PndpbmRvdykuQ29tZXRDaGF0VWlLaXQgPSB7XG4gICAgICAgIG5hbWU6IFwiQGNvbWV0Y2hhdC9jaGF0LXVpa2l0LWFuZ3VsYXJcIixcbiAgICAgICAgdmVyc2lvbjogXCI0LjMuMjBcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKENvbWV0Q2hhdFVJS2l0U2hhcmVkU2V0dGluZ3MpIHtcbiAgICAgIENvbWV0Q2hhdFVJS2l0U2hhcmVkU2V0dGluZ3MudWlraXRTZXR0aW5ncyA9IENvbWV0Q2hhdFVJS2l0Py51aUtpdFNldHRpbmdzO1xuICAgIH0gaWYgKCFDb21ldENoYXRVSUtpdC5jaGVja0F1dGhTZXR0aW5ncygpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGFwcFNldHRpbmdzQnVpbGRlciA9IG5ldyBDb21ldENoYXQuQXBwU2V0dGluZ3NCdWlsZGVyKCk7XG4gICAgaWYgKHVpS2l0U2V0dGluZ3MuZ2V0Um9sZXMoKSkge1xuICAgICAgYXBwU2V0dGluZ3NCdWlsZGVyLnN1YnNjcmliZVByZXNlbmNlRm9yUm9sZXModWlLaXRTZXR0aW5ncy5nZXRSb2xlcygpKTtcbiAgICB9IGVsc2UgaWYgKHVpS2l0U2V0dGluZ3MuZ2V0U3Vic2NyaXB0aW9uVHlwZSgpID09PSBcIkFMTF9VU0VSU1wiKSB7XG4gICAgICBhcHBTZXR0aW5nc0J1aWxkZXIuc3Vic2NyaWJlUHJlc2VuY2VGb3JBbGxVc2VycygpO1xuICAgIH0gZWxzZSBpZiAodWlLaXRTZXR0aW5ncy5nZXRTdWJzY3JpcHRpb25UeXBlKCkgPT09IFwiRlJJRU5EU1wiKSB7XG4gICAgICBhcHBTZXR0aW5nc0J1aWxkZXIuc3Vic2NyaWJlUHJlc2VuY2VGb3JGcmllbmRzKCk7XG4gICAgfVxuICAgIGFwcFNldHRpbmdzQnVpbGRlci5hdXRvRXN0YWJsaXNoU29ja2V0Q29ubmVjdGlvbihcbiAgICAgIHVpS2l0U2V0dGluZ3MuaXNBdXRvRXN0YWJsaXNoU29ja2V0Q29ubmVjdGlvbigpXG4gICAgKTtcblxuICAgIGFwcFNldHRpbmdzQnVpbGRlci5zZXRSZWdpb24odWlLaXRTZXR0aW5ncy5nZXRSZWdpb24oKSk7XG4gICAgYXBwU2V0dGluZ3NCdWlsZGVyLm92ZXJyaWRlQWRtaW5Ib3N0KHVpS2l0U2V0dGluZ3MuZ2V0QWRtaW5Ib3N0KCkpO1xuICAgIGFwcFNldHRpbmdzQnVpbGRlci5vdmVycmlkZUNsaWVudEhvc3QodWlLaXRTZXR0aW5ncy5nZXRDbGllbnRIb3N0KCkpO1xuICAgIGNvbnN0IGFwcFNldHRpbmdzID0gYXBwU2V0dGluZ3NCdWlsZGVyLmJ1aWxkKCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIENvbWV0Q2hhdC5pbml0KHVpS2l0U2V0dGluZ3M/LmFwcElkLCBhcHBTZXR0aW5ncylcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdC5zZXRTb3VyY2UoXCJ1aWtpdC12NFwiLCBcIndlYlwiLCBcImFuZ3VsYXJcIik7XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgICAgID8udGhlbigodXNlcikgPT4ge1xuICAgICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5zZXRMb2dnZWRJblVzZXIodXNlcik7XG4gICAgICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5pbml0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0aWF0ZUFmdGVyTG9naW4oKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXNvbHZlKHVzZXIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldExvZ2dlZGluVXNlcigpOiBQcm9taXNlPENvbWV0Q2hhdC5Vc2VyPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUodXNlciEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZGVmYXVsdEV4dGVuc2lvbnM6IEV4dGVuc2lvbnNEYXRhU291cmNlW10gPSBbXG4gICAgbmV3IFN0aWNrZXJzRXh0ZW5zaW9uKCksXG4gICAgbmV3IFNtYXJ0UmVwbHlFeHRlbnNpb24oKSxcbiAgICBuZXcgQ29sbGFib3JhdGl2ZVdoaXRlQm9hcmRFeHRlbnNpb24oKSxcbiAgICBuZXcgQ29sbGFib3JhdGl2ZURvY3VtZW50RXh0ZW5zaW9uKCksXG4gICAgbmV3IE1lc3NhZ2VUcmFuc2xhdGlvbkV4dGVuc2lvbigpLFxuICAgIG5ldyBUZXh0TW9kZXJhdG9yRXh0ZW5zaW9uKCksXG4gICAgbmV3IFRodW1ibmFpbEdlbmVyYXRpb25FeHRlbnNpb24oKSxcbiAgICBuZXcgTGlua1ByZXZpZXdFeHRlbnNpb24oKSxcbiAgICBuZXcgUG9sbHNFeHRlbnNpb24oKSxcbiAgICBuZXcgSW1hZ2VNb2RlcmF0aW9uRXh0ZW5zaW9uKCksXG4gIF07XG5cbiAgLyoqXG4gICAgKiBEZWZhdWx0IGNhbGxpbmdFeHRlbnNpb24gaW5jbHVkZWQgaW4gdGhlIFVJIEtpdC5cbiAgICAqIEB0eXBlIHtDYWxsaW5nRXh0ZW5zaW9uRGF0YVNvdXJjZX1cbiAgICAqL1xuICBzdGF0aWMgZGVmYXVsdENhbGxpbmdFeHRlbnNpb246IENhbGxpbmdFeHRlbnNpb25EYXRhU291cmNlID0gbmV3IENhbGxpbmdFeHRlbnNpb24oKVxuXG4gIHN0YXRpYyBkZWZhdWx0QUlGZWF0dXJlczogQUlFeHRlbnNpb25EYXRhU291cmNlW10gPSBbXG4gICAgbmV3IEFJQ29udmVyc2F0aW9uU3RhcnRlckV4dGVuc2lvbigpLFxuICAgIG5ldyBBSVNtYXJ0UmVwbGllc0V4dGVuc2lvbigpLFxuICAgIG5ldyBBSUNvbnZlcnNhdGlvblN1bW1hcnlFeHRlbnNpb24oKSxcbiAgICBuZXcgQUlBc3Npc3RCb3RFeHRlbnNpb24oKSxcbiAgXTtcbiAgc3RhdGljIGVuYWJsZUNhbGxpbmcoKTogdm9pZCB7XG4gICAgaWYgKENvbWV0Q2hhdFVJS2l0Q2FsbHMpIHtcbiAgICAgIGNvbnN0IGNhbGxBcHBTZXR0aW5nID0gbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbEFwcFNldHRpbmdzQnVpbGRlcigpXG4gICAgICAgIC5zZXRBcHBJZChDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzPy5hcHBJZClcbiAgICAgICAgLnNldFJlZ2lvbihDb21ldENoYXRVSUtpdC51aUtpdFNldHRpbmdzPy5yZWdpb24pXG4gICAgICAgIC5idWlsZCgpO1xuICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5pbml0KGNhbGxBcHBTZXR0aW5nKS50aGVuKFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb21ldENoYXRDYWxscyBpbml0aWFsaXphdGlvbiBzdWNjZXNzXCIpO1xuICAgICAgICAgIGlmICh0aGlzLnVpS2l0U2V0dGluZ3M/LmdldENhbGxpbmdFeHRlbnNpb24oKSkge1xuICAgICAgICAgICAgdGhpcy51aUtpdFNldHRpbmdzPy5nZXRDYWxsaW5nRXh0ZW5zaW9uKCkuZW5hYmxlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0Q2FsbGluZ0V4dGVuc2lvbi5lbmFibGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBcIkNvbWV0Q2hhdENhbGxzIGluaXRpYWxpemF0aW9uIGZhaWxlZCB3aXRoIGVycm9yOlwiLFxuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGluaXRpYXRlQWZ0ZXJMb2dpbigpIHtcbiAgICBpZiAoQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncyAhPSBudWxsKSB7XG4gICAgICBDb21ldENoYXQuZ2V0Q29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3MoKS50aGVuKChyZXM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncykgPT4ge1xuXG4gICAgICAgIENvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzID0gcmVzO1xuICAgICAgfSlcbiAgICAgIHRoaXMuZW5hYmxlQ2FsbGluZygpO1xuICAgICAgbGV0IGV4dGVuc2lvbkxpc3Q6IEV4dGVuc2lvbnNEYXRhU291cmNlW10gPVxuICAgICAgICB0aGlzLnVpS2l0U2V0dGluZ3M/LmV4dGVuc2lvbnMgfHwgdGhpcy5kZWZhdWx0RXh0ZW5zaW9ucztcblxuICAgICAgbGV0IGFpRmVhdHVyZXNMaXN0OiBBSUV4dGVuc2lvbkRhdGFTb3VyY2VbXSA9IEFycmF5LmlzQXJyYXkoXG4gICAgICAgIHRoaXMudWlLaXRTZXR0aW5ncz8uYWlGZWF0dXJlc1xuICAgICAgKVxuICAgICAgICA/IHRoaXMudWlLaXRTZXR0aW5ncz8uYWlGZWF0dXJlc1xuICAgICAgICA6IHRoaXMuZGVmYXVsdEFJRmVhdHVyZXM7XG4gICAgICBDaGF0U2RrRXZlbnRJbml0aWFsaXplci5hdHRhY2hMaXN0ZW5lcnMoKTtcbiAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5hdHRhY2hMaXN0ZW5lcigpO1xuICAgICAgaWYgKGV4dGVuc2lvbkxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICBleHRlbnNpb25MaXN0LmZvckVhY2goKGV4dGVuc2lvbjogRXh0ZW5zaW9uc0RhdGFTb3VyY2UpID0+IHtcbiAgICAgICAgICBleHRlbnNpb24/LmVuYWJsZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFpRmVhdHVyZXNMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgYWlGZWF0dXJlc0xpc3QuZm9yRWFjaCgoYWlGZWF0dXJlczogQUlFeHRlbnNpb25EYXRhU291cmNlKSA9PiB7XG4gICAgICAgICAgYWlGZWF0dXJlcz8uZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBzdGF0aWMgYXN5bmMgbG9naW4oZGV0YWlsczoge1xuICAgIHVpZD86IHN0cmluZztcbiAgICBhdXRoVG9rZW4/OiBzdHJpbmc7XG4gIH0pOiBQcm9taXNlPE9iamVjdCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICghQ29tZXRDaGF0VUlLaXQuY2hlY2tBdXRoU2V0dGluZ3MoKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgQ29tZXRDaGF0VUlLaXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgPy50aGVuKCh1c2VyKSA9PiB7XG4gICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5zZXRMb2dnZWRJblVzZXIodXNlcik7XG4gICAgICAgICAgICByZXNvbHZlKHVzZXIpO1xuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnNldExvZ2dlZEluVXNlcih1c2VyKTtcbiAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuaW5pdCgpO1xuICAgICAgICAgICAgdGhpcy5pbml0aWF0ZUFmdGVyTG9naW4oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IGFyZ3M6IGFueVtdID0gZGV0YWlscy51aWRcbiAgICAgICAgICAgICAgPyBbZGV0YWlscy51aWQsIENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MuYXV0aEtleSFdXG4gICAgICAgICAgICAgIDogW2RldGFpbHMuYXV0aFRva2VuXTtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5sb2dpbiguLi5hcmdzKVxuICAgICAgICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuc2V0TG9nZ2VkSW5Vc2VyKHVzZXIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUodXNlcik7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnNldExvZ2dlZEluVXNlcih1c2VyKTtcbiAgICAgICAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmluaXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYXRlQWZ0ZXJMb2dpbigpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVVzZXIodXNlcjogQ29tZXRDaGF0LlVzZXIpOiBQcm9taXNlPE9iamVjdCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICghQ29tZXRDaGF0VUlLaXQuY2hlY2tBdXRoU2V0dGluZ3MoKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgQ29tZXRDaGF0LmNyZWF0ZVVzZXIodXNlciwgQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncy5hdXRoS2V5ISlcbiAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSh1c2VyKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHN0YXRpYyBhc3luYyB1cGRhdGVVc2VyKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKTogUHJvbWlzZTxPYmplY3QgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAoIUNvbWV0Q2hhdFVJS2l0LmNoZWNrQXV0aFNldHRpbmdzKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIENvbWV0Q2hhdC51cGRhdGVVc2VyKHVzZXIsIENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MuYXV0aEtleSEpXG4gICAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIHJlc29sdmUodXNlcik7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBzdGF0aWMgYXN5bmMgbG9nb3V0KCk6IFByb21pc2U8T2JqZWN0IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCFDb21ldENoYXRVSUtpdC5jaGVja0F1dGhTZXR0aW5ncygpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBDb21ldENoYXQubG9nb3V0KClcbiAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IG9iamVjdCkgPT4ge1xuICAgICAgICAgIFN0b3JhZ2VVdGlscy5yZW1vdmVJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwpXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnJlbW92ZUxvZ2dlZEluVXNlcigpO1xuICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLnJlbW92ZUxvZ2dlZEluVXNlcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgLy8gRXJyb3IgaGFuZGxpbmcgdG8gZ2l2ZSBiZXR0ZXIgbG9nc1xuICBzdGF0aWMgY2hlY2tBdXRoU2V0dGluZ3MoKTogYm9vbGVhbiB7XG4gICAgaWYgKENvbWV0Q2hhdFVJS2l0LnVpS2l0U2V0dGluZ3MgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoQ29tZXRDaGF0VUlLaXQudWlLaXRTZXR0aW5ncy5hcHBJZCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmRzIGEgZm9ybSBtZXNzYWdlIGFuZCBlbWl0cyBldmVudHMgYmFzZWQgb24gdGhlIG1lc3NhZ2Ugc3RhdHVzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSAtIFRoZSBmb3JtIG1lc3NhZ2UgdG8gYmUgc2VudC5cbiAgICogQHBhcmFtIGRpc2FibGVMb2NhbEV2ZW50cyAtIEEgYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZGlzYWJsZSBsb2NhbCBldmVudHMgb3Igbm90LiBEZWZhdWx0IHZhbHVlIGlzIGZhbHNlLlxuICAgKi9cbiAgc3RhdGljIHNlbmRGb3JtTWVzc2FnZShcbiAgICBtZXNzYWdlOiBGb3JtTWVzc2FnZSxcbiAgICBkaXNhYmxlTG9jYWxFdmVudHM6IGJvb2xlYW4gPSBmYWxzZVxuICApIHtcbiAgICBtZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICBpZiAoIW1lc3NhZ2U/LmdldE11aWQoKSkge1xuICAgICAgbWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICAgIGlmIChDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkpIHtcbiAgICAgICAgbWVzc2FnZS5zZXRTZW5kZXIoQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLmdldExvZ2dlZEluVXNlcigpISlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICB9KTtcbiAgICB9XG4gICAgQ29tZXRDaGF0LnNlbmRJbnRlcmFjdGl2ZU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgbGV0IGludGVyYWN0aXZlTWVzc2FnZTogRm9ybU1lc3NhZ2UgPSBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICApIGFzIEZvcm1NZXNzYWdlO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGludGVyYWN0aXZlTWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3IgfSk7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgc2VuZENhcmRNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENhcmRNZXNzYWdlLFxuICAgIGRpc2FibGVMb2NhbEV2ZW50czogYm9vbGVhbiA9IGZhbHNlXG4gICkge1xuICAgIG1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgIGlmICghbWVzc2FnZT8uZ2V0TXVpZCgpKSB7XG4gICAgICBtZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgICAgaWYgKENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSkge1xuICAgICAgICBtZXNzYWdlLnNldFNlbmRlcihDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIENvbWV0Q2hhdC5zZW5kSW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGxldCBpbnRlcmFjdGl2ZU1lc3NhZ2U6IENhcmRNZXNzYWdlID0gSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMuY29udmVydEludGVyYWN0aXZlTWVzc2FnZShcbiAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2VcbiAgICAgICAgKSBhcyBDYXJkTWVzc2FnZTtcbiAgICAgICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBpbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgbWVzc2FnZS5zZXRNZXRhZGF0YSh7IGVycm9yIH0pO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHNlbmRDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlLFxuICAgIGRpc2FibGVMb2NhbEV2ZW50czogYm9vbGVhbiA9IGZhbHNlXG4gICkge1xuICAgIG1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgIGlmICghbWVzc2FnZT8uZ2V0TXVpZCgpKSB7XG4gICAgICBtZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgICAgaWYgKENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSkge1xuICAgICAgICBtZXNzYWdlLnNldFNlbmRlcihDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBDb21ldENoYXQuc2VuZEludGVyYWN0aXZlTWVzc2FnZShtZXNzYWdlKVxuICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBsZXQgaW50ZXJhY3RpdmVNZXNzYWdlOiBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UgPSBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICApIGFzIEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZTtcbiAgICAgICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBpbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgbWVzc2FnZS5zZXRNZXRhZGF0YSh7IGVycm9yIH0pO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgdG8gc2VuZCBtZXNzYWdlc1xuICAvLyBbc2VuZEN1c3RvbU1lc3NhZ2VdIHVzZWQgdG8gc2VuZCBhIGN1c3RvbSBtZXNzYWdlXG4gIHN0YXRpYyBzZW5kQ3VzdG9tTWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZVxuICApOiBQcm9taXNlPENvbWV0Q2hhdC5CYXNlTWVzc2FnZT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBtZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICAgIGlmICghbWVzc2FnZT8uZ2V0TXVpZCgpKSB7XG4gICAgICAgIG1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgICAgIGlmIChDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkpIHtcbiAgICAgICAgICBtZXNzYWdlLnNldFNlbmRlcihDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgfSk7XG5cbiAgICAgIENvbWV0Q2hhdC5zZW5kQ3VzdG9tTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2RzIHRvIHNlbmQgbWVzc2FnZXNcbiAgLy8gW3NlbmRUZXh0TWVzc2FnZV0gdXNlZCB0byBzZW5kIGEgY3VzdG9tIG1lc3NhZ2VcbiAgc3RhdGljIHNlbmRUZXh0TWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgKTogUHJvbWlzZTxDb21ldENoYXQuQmFzZU1lc3NhZ2U+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgICBpZiAoIW1lc3NhZ2U/LmdldE11aWQoKSkge1xuICAgICAgICBtZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgICAgICBpZiAoQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLmdldExvZ2dlZEluVXNlcigpKSB7XG4gICAgICAgICAgbWVzc2FnZS5zZXRTZW5kZXIoQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLmdldExvZ2dlZEluVXNlcigpISlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgIH0pO1xuXG4gICAgICBDb21ldENoYXQuc2VuZE1lc3NhZ2UobWVzc2FnZSlcbiAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgbWVzc2FnZS5zZXRNZXRhZGF0YSh7IGVycm9yOiB0cnVlIH0pO1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kcyB0byBzZW5kIG1lc3NhZ2VzXG4gIC8vIFtzZW5kTWVkaWFNZXNzYWdlXSB1c2VkIHRvIHNlbmQgYSBjdXN0b20gbWVzc2FnZVxuICBzdGF0aWMgc2VuZE1lZGlhTWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlXG4gICk6IFByb21pc2U8Q29tZXRDaGF0LkJhc2VNZXNzYWdlPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIG1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgICAgaWYgKCFtZXNzYWdlPy5nZXRNdWlkKCkpIHtcbiAgICAgICAgbWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICAgICAgaWYgKENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSkge1xuICAgICAgICAgIG1lc3NhZ2Uuc2V0U2VuZGVyKENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSEpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICB9KTtcblxuICAgICAgQ29tZXRDaGF0LnNlbmRNZWRpYU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgbWVzc2FnZS5zZXRNZXRhZGF0YSh7IGVycm9yOiB0cnVlIH0pO1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFNlbmRzIGEgc2NoZWR1bGVyIG1lc3NhZ2UgYW5kIGVtaXRzIGV2ZW50cyBiYXNlZCBvbiB0aGUgbWVzc2FnZSBzdGF0dXMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIC0gVGhlIHNjaGVkdWxlciBtZXNzYWdlIHRvIGJlIHNlbnQuXG4gICAqIEBwYXJhbSBkaXNhYmxlTG9jYWxFdmVudHMgLSBBIGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGRpc2FibGUgbG9jYWwgZXZlbnRzIG9yIG5vdC4gRGVmYXVsdCB2YWx1ZSBpcyBmYWxzZS5cbiAgICovXG4gIHN0YXRpYyBzZW5kU2NoZWR1bGVyTWVzc2FnZShcbiAgICBtZXNzYWdlOiBTY2hlZHVsZXJNZXNzYWdlLFxuICAgIGRpc2FibGVMb2NhbEV2ZW50czogYm9vbGVhbiA9IGZhbHNlXG4gICkge1xuXG4gICAgbWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgaWYgKCFtZXNzYWdlPy5nZXRNdWlkKCkpIHtcbiAgICAgIG1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgICBpZiAoQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLmdldExvZ2dlZEluVXNlcigpKSB7XG4gICAgICAgIG1lc3NhZ2Uuc2V0U2VuZGVyKENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSEpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFkaXNhYmxlTG9jYWxFdmVudHMpIHtcbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBDb21ldENoYXQuc2VuZEludGVyYWN0aXZlTWVzc2FnZShtZXNzYWdlKVxuICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBsZXQgaW50ZXJhY3RpdmVNZXNzYWdlOiBTY2hlZHVsZXJNZXNzYWdlID0gSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMuY29udmVydEludGVyYWN0aXZlTWVzc2FnZShcbiAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2VcbiAgICAgICAgKSBhcyBTY2hlZHVsZXJNZXNzYWdlO1xuICAgICAgICBpZiAoIWRpc2FibGVMb2NhbEV2ZW50cykge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGludGVyYWN0aXZlTWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBtZXNzYWdlLnNldE1ldGFkYXRhKHsgZXJyb3IgfSk7XG4gICAgICAgIGlmICghZGlzYWJsZUxvY2FsRXZlbnRzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cbn1cbiJdfQ==