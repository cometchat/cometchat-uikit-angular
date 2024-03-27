import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatUIKitConstants, localize, MentionsTargetElement } from "@cometchat/uikit-resources";
import { CometChatMentionsTextFormatter, CometChatUIKitLoginListener, CometChatUIKitUtility, } from "@cometchat/uikit-shared";
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
                    if (textFormatters[i] instanceof CometChatMentionsTextFormatter) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGV4dE1vZGVyYXRvckV4dGVuc2lvbkRlY29yYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvRXh0ZW5zaW9ucy9UZXh0TW9kZXJhdG9yL1RleHRNb2RlcmF0b3JFeHRlbnNpb25EZWNvcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN0RyxPQUFPLEVBQ0wsOEJBQThCLEVBRTlCLDJCQUEyQixFQUMzQixxQkFBcUIsR0FDdEIsTUFBTSx5QkFBeUIsQ0FBQztBQUVqQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSw0Q0FBNEMsQ0FBQztBQUNqRixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUMzRSxNQUFNLE9BQU8sK0JBQWdDLFNBQVEsbUJBQW1CO0lBQ3RFLFlBQVksVUFBc0I7UUFDaEMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFUSxLQUFLO1FBQ1osT0FBTyxlQUFlLENBQUM7SUFDekIsQ0FBQztJQUNELGdCQUFnQixDQUFDLE9BQThCO1FBQzdDLElBQUksSUFBSSxHQUFXLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25FLElBQUksSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDNUIsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7SUFDSCxDQUFDO0lBQ1EsMEJBQTBCLENBQ2pDLFlBQW9DLEVBQ3BDLFlBQTRCLEVBQzVCLHdCQUE2QjtRQUU3QixN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MkJBQTJCLEVBQUUsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQ3hEO29CQUNBLFFBQVEsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztpQkFDOUM7cUJBQU07b0JBQ0wsUUFBUSxHQUFHLEdBQUcsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLFFBQVEsRUFBRSxDQUFDO2lCQUM5RDthQUNGO1lBQ0QsT0FBTyxRQUFRLENBQUM7U0FDakI7YUFBTTtZQUNMLE9BQU8sS0FBSyxDQUFDLDBCQUEwQixDQUNyQyxZQUFZLEVBQ1osWUFBWSxFQUNaLHdCQUF3QixDQUN6QixDQUFDO1NBQ0g7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdENvbnN0YW50cywgbG9jYWxpemUsIE1lbnRpb25zVGFyZ2V0RWxlbWVudCB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0TWVudGlvbnNUZXh0Rm9ybWF0dGVyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBEYXRhU291cmNlIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9GcmFtZXdvcmsvRGF0YVNvdXJjZVwiO1xuaW1wb3J0IHsgRGF0YVNvdXJjZURlY29yYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0RhdGFTb3VyY2VEZWNvcmF0b3JcIjtcbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5leHBvcnQgY2xhc3MgVGV4dE1vZGVyYXRvckV4dGVuc2lvbkRlY29yYXRvciBleHRlbmRzIERhdGFTb3VyY2VEZWNvcmF0b3Ige1xuICBjb25zdHJ1Y3RvcihkYXRhU291cmNlOiBEYXRhU291cmNlKSB7XG4gICAgc3VwZXIoZGF0YVNvdXJjZSk7XG4gIH1cblxuICBvdmVycmlkZSBnZXRJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcInRleHRtb2RlcmF0b3JcIjtcbiAgfVxuICBnZXRNb2RlcmF0ZWR0ZXh0KG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk6IHN0cmluZyB7XG4gICAgbGV0IHRleHQ6IHN0cmluZyA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRFeHRlbnNpb25EYXRhKG1lc3NhZ2UpO1xuICAgIGlmICh0ZXh0Py50cmltKCk/Lmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgfVxuICB9XG4gIG92ZXJyaWRlIGdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGFkZGl0aW9uYWxDb25maWd1cmF0aW9uczogYW55XG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgbWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlID0gY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKCk7XG5cbiAgICBpZiAoXG4gICAgICBtZXNzYWdlICYmXG4gICAgICAhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbWVzc2FnZS5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0ICYmXG4gICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlXG4gICAgKSB7XG4gICAgICBsZXQgc3VidGl0bGUgPSB0aGlzLmdldE1vZGVyYXRlZHRleHQobWVzc2FnZSk7XG4gICAgICBsZXQgbWVzc2FnZU9iaiA9IGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpO1xuXG4gICAgICBsZXQgY29uZmlnID0ge1xuICAgICAgICAuLi5hZGRpdGlvbmFsQ29uZmlndXJhdGlvbnMsXG4gICAgICAgIHRleHRGb3JtYXR0ZXJzOlxuICAgICAgICAgIGFkZGl0aW9uYWxDb25maWd1cmF0aW9ucz8udGV4dEZvcm1hdHRlcnMgJiZcbiAgICAgICAgICBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnM/LnRleHRGb3JtYXR0ZXJzLmxlbmd0aFxuICAgICAgICAgICAgPyBbLi4uYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zLnRleHRGb3JtYXR0ZXJzXVxuICAgICAgICAgICAgOiBbdGhpcy5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoeyB0aGVtZTogYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zLnRoZW1lLCBkaXNhYmxlTWVudGlvbnM6IGFkZGl0aW9uYWxDb25maWd1cmF0aW9ucy5kaXNhYmxlTWVudGlvbnMgfSldLFxuICAgICAgfTtcblxuICAgICAgbGV0IHRleHRGb3JtYXR0ZXJzOiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPiA9IGNvbmZpZy50ZXh0Rm9ybWF0dGVycztcbiAgICAgIGlmIChjb25maWcgJiYgIWNvbmZpZy5kaXNhYmxlTWVudGlvbnMpIHtcbiAgICAgICAgbGV0IG1lbnRpb25zVGV4dEZvcm1hdHRlciE6IENvbWV0Q2hhdE1lbnRpb25zVGV4dEZvcm1hdHRlcjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zVGV4dEZvcm1hdHRlcikge1xuICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbXG4gICAgICAgICAgICAgIGlcbiAgICAgICAgICAgIF0gYXMgQ29tZXRDaGF0TWVudGlvbnNUZXh0Rm9ybWF0dGVyO1xuICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldE1lc3NhZ2UobWVzc2FnZU9iaik7XG4gICAgICAgICAgICBpZiAobWVzc2FnZU9iai5nZXRNZW50aW9uZWRVc2VycygpLmxlbmd0aCkge1xuICAgICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgICAgICAgICAgICBtZXNzYWdlT2JqLmdldE1lbnRpb25lZFVzZXJzKClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRMb2dnZWRJblVzZXIoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZihtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghbWVudGlvbnNUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID1cbiAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lbnRpb25zVGV4dEZvcm1hdHRlcih7XG4gICAgICAgICAgICAgIG1lc3NhZ2VPYmosXG4gICAgICAgICAgICAgIC4uLmNvbmZpZyxcbiAgICAgICAgICAgICAgYWxpZ25tZW50OiBudWxsLFxuICAgICAgICAgICAgICB0aGVtZTogYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zLnRoZW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgdGV4dEZvcm1hdHRlcnMucHVzaChtZW50aW9uc1RleHRGb3JtYXR0ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZU9iaiAmJlxuICAgICAgICBtZXNzYWdlT2JqIGluc3RhbmNlb2YgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICApIHtcbiAgICAgICAgZm9yKGxldCBpID0wOyBpIDwgdGV4dEZvcm1hdHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBzdWJ0aXRsZSA9IHRleHRGb3JtYXR0ZXJzW2ldLmdldEZvcm1hdHRlZFRleHQoc3VidGl0bGUsIHttZW50aW9uc1RhcmdldEVsZW1lbnQ6IE1lbnRpb25zVGFyZ2V0RWxlbWVudC5jb252ZXJzYXRpb259KSE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZSAmJlxuICAgICAgICBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvblR5cGUoKSAhPSBDb21ldENoYXQuUkVDRUlWRVJfVFlQRS5VU0VSXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyPy5nZXRMb2dnZWRJblVzZXIoKT8uZ2V0VWlkKClcbiAgICAgICAgKSB7XG4gICAgICAgICAgc3VidGl0bGUgPSBgJHtsb2NhbGl6ZShcIllPVVwiKX06ICR7c3VidGl0bGV9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdWJ0aXRsZSA9IGAke21lc3NhZ2U/LmdldFNlbmRlcigpLmdldE5hbWUoKX06ICAke3N1YnRpdGxlfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBzdWJ0aXRsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLmdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgICAgICBjb252ZXJzYXRpb24sXG4gICAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgICAgYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIl19