import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatUIKitConstants, localize, MentionsTargetElement } from "@cometchat/uikit-resources";
import { CometChatMentionsFormatter, CometChatUIKitLoginListener, CometChatUIKitUtility, } from "@cometchat/uikit-shared";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
export class TextModeratorExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource) {
        super(dataSource);
    }
    getId() {
        return "textmoderator";
    }
    getModeratedtext(message) {
        let text = CometChatUIKitUtility.getExtensionData(message);
        if (text?.trim()?.length > 0) {
            return text;
        }
        else {
            return message.getText();
        }
    }
    getLastConversationMessage(conversation, loggedInUser, additionalConfigurations) {
        const message = conversation.getLastMessage();
        if (message &&
            !message.getDeletedAt() &&
            message.getType() === CometChatUIKitConstants.MessageTypes.text &&
            message.getCategory() === CometChatUIKitConstants.MessageCategory.message) {
            let subtitle = this.getModeratedtext(message);
            let messageObj = conversation.getLastMessage();
            let config = {
                ...additionalConfigurations,
                textFormatters: additionalConfigurations?.textFormatters &&
                    additionalConfigurations?.textFormatters.length
                    ? [...additionalConfigurations.textFormatters]
                    : [this.getMentionsTextFormatter({ theme: additionalConfigurations.theme, disableMentions: additionalConfigurations.disableMentions })],
            };
            let textFormatters = config.textFormatters;
            if (config && !config.disableMentions) {
                let mentionsTextFormatter;
                for (let i = 0; i < textFormatters.length; i++) {
                    if (textFormatters[i] instanceof CometChatMentionsFormatter) {
                        mentionsTextFormatter = textFormatters[i];
                        mentionsTextFormatter.setMessage(messageObj);
                        if (messageObj.getMentionedUsers().length) {
                            mentionsTextFormatter.setCometChatUserGroupMembers(messageObj.getMentionedUsers());
                        }
                        mentionsTextFormatter.setLoggedInUser(CometChatUIKitLoginListener.getLoggedInUser());
                        if (mentionsTextFormatter) {
                            break;
                        }
                    }
                }
                if (!mentionsTextFormatter) {
                    mentionsTextFormatter =
                        ChatConfigurator.getDataSource().getMentionsTextFormatter({
                            messageObj,
                            ...config,
                            alignment: null,
                            theme: additionalConfigurations.theme,
                        });
                    textFormatters.push(mentionsTextFormatter);
                }
            }
            if (messageObj &&
                messageObj instanceof CometChat.TextMessage) {
                for (let i = 0; i < textFormatters.length; i++) {
                    subtitle = textFormatters[i].getFormattedText(subtitle, { mentionsTargetElement: MentionsTargetElement.conversation });
                }
            }
            if (message &&
                conversation?.getConversationType() != CometChat.RECEIVER_TYPE.USER) {
                if (message?.getSender().getUid() ==
                    CometChatUIKitLoginListener?.getLoggedInUser()?.getUid()) {
                    subtitle = `${localize("YOU")}: ${subtitle}`;
                }
                else {
                    subtitle = `${message?.getSender().getName()}:  ${subtitle}`;
                }
            }
            return subtitle;
        }
        else {
            return super.getLastConversationMessage(conversation, loggedInUser, additionalConfigurations);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGV4dE1vZGVyYXRvckV4dGVuc2lvbkRlY29yYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvRXh0ZW5zaW9ucy9UZXh0TW9kZXJhdG9yL1RleHRNb2RlcmF0b3JFeHRlbnNpb25EZWNvcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN0RyxPQUFPLEVBQ0wsMEJBQTBCLEVBRTFCLDJCQUEyQixFQUMzQixxQkFBcUIsR0FDdEIsTUFBTSx5QkFBeUIsQ0FBQztBQUVqQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSw0Q0FBNEMsQ0FBQztBQUNqRixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUMzRSxNQUFNLE9BQU8sK0JBQWdDLFNBQVEsbUJBQW1CO0lBQ3RFLFlBQVksVUFBc0I7UUFDaEMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFUSxLQUFLO1FBQ1osT0FBTyxlQUFlLENBQUM7SUFDekIsQ0FBQztJQUNELGdCQUFnQixDQUFDLE9BQThCO1FBQzdDLElBQUksSUFBSSxHQUFXLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25FLElBQUksSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDNUIsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7SUFDSCxDQUFDO0lBQ1EsMEJBQTBCLENBQ2pDLFlBQW9DLEVBQ3BDLFlBQTRCLEVBQzVCLHdCQUE2QjtRQUU3QixNQUFNLE9BQU8sR0FBMEIsWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXJFLElBQ0UsT0FBTztZQUNQLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUN2QixPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUk7WUFDL0QsT0FBTyxDQUFDLFdBQVcsRUFBRSxLQUFLLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQ3pFO1lBQ0EsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlDLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUUvQyxJQUFJLE1BQU0sR0FBRztnQkFDWCxHQUFHLHdCQUF3QjtnQkFDM0IsY0FBYyxFQUNaLHdCQUF3QixFQUFFLGNBQWM7b0JBQ3RDLHdCQUF3QixFQUFFLGNBQWMsQ0FBQyxNQUFNO29CQUMvQyxDQUFDLENBQUMsQ0FBQyxHQUFHLHdCQUF3QixDQUFDLGNBQWMsQ0FBQztvQkFDOUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsd0JBQXdCLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQzthQUM1SSxDQUFDO1lBRUYsSUFBSSxjQUFjLEdBQWtDLE1BQU0sQ0FBQyxjQUFjLENBQUM7WUFDMUUsSUFBSSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFO2dCQUNyQyxJQUFJLHFCQUFrRCxDQUFDO2dCQUN2RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDOUMsSUFBSSxjQUFjLENBQUMsQ0FBQyxDQUFDLFlBQVksMEJBQTBCLEVBQUU7d0JBQzNELHFCQUFxQixHQUFHLGNBQWMsQ0FDcEMsQ0FBQyxDQUM0QixDQUFDO3dCQUNoQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQzdDLElBQUksVUFBVSxDQUFDLGlCQUFpQixFQUFFLENBQUMsTUFBTSxFQUFFOzRCQUN6QyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FDaEQsVUFBVSxDQUFDLGlCQUFpQixFQUFFLENBQy9CLENBQUM7eUJBQ0g7d0JBQ0QscUJBQXFCLENBQUMsZUFBZSxDQUNuQywyQkFBMkIsQ0FBQyxlQUFlLEVBQUcsQ0FDL0MsQ0FBQzt3QkFDRixJQUFJLHFCQUFxQixFQUFFOzRCQUN6QixNQUFNO3lCQUNQO3FCQUNGO2lCQUNGO2dCQUNELElBQUksQ0FBQyxxQkFBcUIsRUFBRTtvQkFDMUIscUJBQXFCO3dCQUNuQixnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQzs0QkFDeEQsVUFBVTs0QkFDVixHQUFHLE1BQU07NEJBQ1QsU0FBUyxFQUFFLElBQUk7NEJBQ2YsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEtBQUs7eUJBQ3RDLENBQUMsQ0FBQztvQkFDTCxjQUFjLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7aUJBQzVDO2FBQ0Y7WUFFRCxJQUNFLFVBQVU7Z0JBQ1YsVUFBVSxZQUFZLFNBQVMsQ0FBQyxXQUFXLEVBQzNDO2dCQUNBLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM5QyxRQUFRLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxFQUFFLHFCQUFxQixFQUFFLHFCQUFxQixDQUFDLFlBQVksRUFBRSxDQUFFLENBQUM7aUJBQ3pIO2FBQ0Y7WUFDRCxJQUNFLE9BQU87Z0JBQ1AsWUFBWSxFQUFFLG1CQUFtQixFQUFFLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQ25FO2dCQUNBLElBQ0UsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRTtvQkFDN0IsMkJBQTJCLEVBQUUsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQ3hEO29CQUNBLFFBQVEsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztpQkFDOUM7cUJBQU07b0JBQ0wsUUFBUSxHQUFHLEdBQUcsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLFFBQVEsRUFBRSxDQUFDO2lCQUM5RDthQUNGO1lBQ0QsT0FBTyxRQUFRLENBQUM7U0FDakI7YUFBTTtZQUNMLE9BQU8sS0FBSyxDQUFDLDBCQUEwQixDQUNyQyxZQUFZLEVBQ1osWUFBWSxFQUNaLHdCQUF3QixDQUN6QixDQUFDO1NBQ0g7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdENvbnN0YW50cywgbG9jYWxpemUsIE1lbnRpb25zVGFyZ2V0RWxlbWVudCB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFRleHRGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lcixcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IERhdGFTb3VyY2UgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9EYXRhU291cmNlXCI7XG5pbXBvcnQgeyBEYXRhU291cmNlRGVjb3JhdG9yIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9GcmFtZXdvcmsvRGF0YVNvdXJjZURlY29yYXRvclwiO1xuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmV4cG9ydCBjbGFzcyBUZXh0TW9kZXJhdG9yRXh0ZW5zaW9uRGVjb3JhdG9yIGV4dGVuZHMgRGF0YVNvdXJjZURlY29yYXRvciB7XG4gIGNvbnN0cnVjdG9yKGRhdGFTb3VyY2U6IERhdGFTb3VyY2UpIHtcbiAgICBzdXBlcihkYXRhU291cmNlKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwidGV4dG1vZGVyYXRvclwiO1xuICB9XG4gIGdldE1vZGVyYXRlZHRleHQobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogc3RyaW5nIHtcbiAgICBsZXQgdGV4dDogc3RyaW5nID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldEV4dGVuc2lvbkRhdGEobWVzc2FnZSk7XG4gICAgaWYgKHRleHQ/LnRyaW0oKT8ubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLmdldFRleHQoKTtcbiAgICB9XG4gIH1cbiAgb3ZlcnJpZGUgZ2V0TGFzdENvbnZlcnNhdGlvbk1lc3NhZ2UoXG4gICAgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uLFxuICAgIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zOiBhbnlcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgPSBjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKTtcblxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UgJiZcbiAgICAgICFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlLmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQgJiZcbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2VcbiAgICApIHtcbiAgICAgIGxldCBzdWJ0aXRsZSA9IHRoaXMuZ2V0TW9kZXJhdGVkdGV4dChtZXNzYWdlKTtcbiAgICAgIGxldCBtZXNzYWdlT2JqID0gY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKCk7XG5cbiAgICAgIGxldCBjb25maWcgPSB7XG4gICAgICAgIC4uLmFkZGl0aW9uYWxDb25maWd1cmF0aW9ucyxcbiAgICAgICAgdGV4dEZvcm1hdHRlcnM6XG4gICAgICAgICAgYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zPy50ZXh0Rm9ybWF0dGVycyAmJlxuICAgICAgICAgICAgYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zPy50ZXh0Rm9ybWF0dGVycy5sZW5ndGhcbiAgICAgICAgICAgID8gWy4uLmFkZGl0aW9uYWxDb25maWd1cmF0aW9ucy50ZXh0Rm9ybWF0dGVyc11cbiAgICAgICAgICAgIDogW3RoaXMuZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHsgdGhlbWU6IGFkZGl0aW9uYWxDb25maWd1cmF0aW9ucy50aGVtZSwgZGlzYWJsZU1lbnRpb25zOiBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnMuZGlzYWJsZU1lbnRpb25zIH0pXSxcbiAgICAgIH07XG5cbiAgICAgIGxldCB0ZXh0Rm9ybWF0dGVyczogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSBjb25maWcudGV4dEZvcm1hdHRlcnM7XG4gICAgICBpZiAoY29uZmlnICYmICFjb25maWcuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICAgIGxldCBtZW50aW9uc1RleHRGb3JtYXR0ZXIhOiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tcbiAgICAgICAgICAgICAgaVxuICAgICAgICAgICAgXSBhcyBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRNZXNzYWdlKG1lc3NhZ2VPYmopO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2VPYmouZ2V0TWVudGlvbmVkVXNlcnMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgICAgICAgbWVzc2FnZU9iai5nZXRNZW50aW9uZWRVc2VycygpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0TG9nZ2VkSW5Vc2VyKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKG1lbnRpb25zVGV4dEZvcm1hdHRlcikge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPVxuICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgICAgICAgbWVzc2FnZU9iaixcbiAgICAgICAgICAgICAgLi4uY29uZmlnLFxuICAgICAgICAgICAgICBhbGlnbm1lbnQ6IG51bGwsXG4gICAgICAgICAgICAgIHRoZW1lOiBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnMudGhlbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0Rm9ybWF0dGVycy5wdXNoKG1lbnRpb25zVGV4dEZvcm1hdHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlT2JqICYmXG4gICAgICAgIG1lc3NhZ2VPYmogaW5zdGFuY2VvZiBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgc3VidGl0bGUgPSB0ZXh0Rm9ybWF0dGVyc1tpXS5nZXRGb3JtYXR0ZWRUZXh0KHN1YnRpdGxlLCB7IG1lbnRpb25zVGFyZ2V0RWxlbWVudDogTWVudGlvbnNUYXJnZXRFbGVtZW50LmNvbnZlcnNhdGlvbiB9KSE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZSAmJlxuICAgICAgICBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvblR5cGUoKSAhPSBDb21ldENoYXQuUkVDRUlWRVJfVFlQRS5VU0VSXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyPy5nZXRMb2dnZWRJblVzZXIoKT8uZ2V0VWlkKClcbiAgICAgICAgKSB7XG4gICAgICAgICAgc3VidGl0bGUgPSBgJHtsb2NhbGl6ZShcIllPVVwiKX06ICR7c3VidGl0bGV9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdWJ0aXRsZSA9IGAke21lc3NhZ2U/LmdldFNlbmRlcigpLmdldE5hbWUoKX06ICAke3N1YnRpdGxlfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBzdWJ0aXRsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLmdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgICAgICBjb252ZXJzYXRpb24sXG4gICAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgICAgYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIl19