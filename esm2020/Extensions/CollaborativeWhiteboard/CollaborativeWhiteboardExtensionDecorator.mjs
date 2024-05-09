import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatTheme, CometChatMessageTemplate, CometChatMessageComposerAction, fontHelper, CometChatUIKitConstants, localize, } from "@cometchat/uikit-resources";
import { CollaborativeWhiteboardConstants, } from "@cometchat/uikit-shared";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class CollaborativeWhiteBoardExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource) {
        super(dataSource);
    }
    getAllMessageTypes() {
        const types = super.getAllMessageTypes();
        if (!types.includes(CollaborativeWhiteboardConstants.extension_whiteboard)) {
            types.push(CollaborativeWhiteboardConstants.extension_whiteboard);
        }
        return types;
    }
    getId() {
        return "collaborativewhiteboard";
    }
    getAllMessageCategories() {
        const categories = super.getAllMessageCategories();
        if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
            categories.push(CometChatUIKitConstants.MessageCategory.custom);
        }
        return categories;
    }
    checkIfTemplateExist(template, type) {
        return template.some((obj) => obj.type === type);
    }
    getAllMessageTemplates() {
        const templates = super.getAllMessageTemplates();
        if (!this.checkIfTemplateExist(templates, CollaborativeWhiteboardConstants.extension_whiteboard)) {
            templates.push(this.getWhiteBoardTemplate());
        }
        return templates;
    }
    getWhiteBoardTemplate() {
        return new CometChatMessageTemplate({
            type: CollaborativeWhiteboardConstants.extension_whiteboard,
            category: CometChatUIKitConstants.MessageCategory.custom,
            options: (loggedInUser, messageObject, theme, group) => {
                return ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
            },
        });
    }
    getAttachmentOptions(theme = new CometChatTheme({}), user, group, id) {
        if (!id?.parentMessageId) {
            let receiverType = user
                ? CometChatUIKitConstants.MessageReceiverType.user
                : CometChatUIKitConstants.MessageReceiverType.group;
            let receiverId = user
                ? user.getUid()
                : group?.getGuid();
            const messageComposerActions = super.getAttachmentOptions(theme, user, group, id);
            let newAction = new CometChatMessageComposerAction({
                id: CollaborativeWhiteboardConstants.whiteboard,
                title: localize("COLLABORATIVE_WHITEBOARD"),
                iconURL: "assets/collaborativewhiteboard.svg",
                iconTint: theme.palette.getAccent700(),
                titleColor: theme.palette.getAccent600(),
                titleFont: fontHelper(theme.typography.subtitle1),
                background: theme.palette.getAccent100(),
                onClick: () => {
                    CometChat.callExtension(CollaborativeWhiteboardConstants.whiteboard, CollaborativeWhiteboardConstants.post, CollaborativeWhiteboardConstants.v1_create, {
                        receiver: receiverId,
                        receiverType: receiverType,
                    })
                        .then((res) => { })
                        .catch((error) => {
                        console.log(error);
                    });
                },
            });
            messageComposerActions.push(newAction);
            return messageComposerActions;
        }
        else {
            return super.getAttachmentOptions(theme, user, group, id);
        }
    }
    getLastConversationMessage(conversation, loggedInUser, additionalConfigurations) {
        const message = conversation.getLastMessage();
        if (message != null &&
            message.getType() ==
                CollaborativeWhiteboardConstants.extension_whiteboard &&
            message.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
            return localize("CUSTOM_MESSAGE_WHITEBOARD");
        }
        else {
            return super.getLastConversationMessage(conversation, loggedInUser, additionalConfigurations);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRFeHRlbnNpb25EZWNvcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0V4dGVuc2lvbnMvQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmQvQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRFeHRlbnNpb25EZWNvcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFDTCxjQUFjLEVBQ2Qsd0JBQXdCLEVBQ3hCLDhCQUE4QixFQUM5QixVQUFVLEVBQ1YsdUJBQXVCLEVBQ3ZCLFFBQVEsR0FDVCxNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFFTCxnQ0FBZ0MsR0FDakMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUUzRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSw0Q0FBNEMsQ0FBQztBQUVqRixNQUFNLE9BQU8seUNBQTBDLFNBQVEsbUJBQW1CO0lBQ2hGLFlBQVksVUFBc0I7UUFDaEMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFUSxrQkFBa0I7UUFDekIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDekMsSUFDRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsZ0NBQWdDLENBQUMsb0JBQW9CLENBQUMsRUFDdEU7WUFDQSxLQUFLLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDbkU7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDUSxLQUFLO1FBQ1osT0FBTyx5QkFBeUIsQ0FBQztJQUNuQyxDQUFDO0lBRVEsdUJBQXVCO1FBQzlCLE1B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QkFDRSxRQUFRLEVBQUUsVUFBVTt3QkFDcEIsWUFBWSxFQUFFLFlBQVk7cUJBQzNCLENBQ0Y7eUJBQ0UsSUFBSSxDQUFDLENBQUMsR0FBUSxFQUFFLEVBQUUsR0FBRSxDQUFDLENBQUM7eUJBQ3RCLEtBQUssQ0FBQyxDQUFDLEtBQW1DLEVBQUUsRUFBRTt3QkFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDckIsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQzthQUNGLENBQUMsQ0FBQztZQUNMLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxPQUFPLHNCQUFzQixDQUFDO1NBQy9CO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztTQUMzRDtJQUNILENBQUM7SUFDUSwwQkFBMEIsQ0FDakMsWUFBb0MsRUFDcEMsWUFBNEIsRUFDNUIsd0JBQTZCO1FBRTdCLE1BQU0sT0FBTyxHQUNYLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNoQyxJQUNFLE9BQU8sSUFBSSxJQUFJO1lBQ2YsT0FBTyxDQUFDLE9BQU8sRUFBRTtnQkFDZixnQ0FBZ0MsQ0FBQyxvQkFBb0I7WUFDdkQsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQ3ZFO1lBQ0EsT0FBTyxRQUFRLENBQUMsMkJBQTJCLENBQUMsQ0FBQztTQUM5QzthQUFNO1lBQ0wsT0FBTyxLQUFLLENBQUMsMEJBQTBCLENBQ3JDLFlBQVksRUFDWixZQUFZLEVBQ1osd0JBQXdCLENBQ3pCLENBQUM7U0FDSDtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFRoZW1lLFxuICBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUsXG4gIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbixcbiAgZm9udEhlbHBlcixcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIGxvY2FsaXplLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkQ29uZmlndXJhdGlvbixcbiAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IERhdGFTb3VyY2UgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9EYXRhU291cmNlXCI7XG5pbXBvcnQgeyBEYXRhU291cmNlRGVjb3JhdG9yIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9GcmFtZXdvcmsvRGF0YVNvdXJjZURlY29yYXRvclwiO1xuXG5leHBvcnQgY2xhc3MgQ29sbGFib3JhdGl2ZVdoaXRlQm9hcmRFeHRlbnNpb25EZWNvcmF0b3IgZXh0ZW5kcyBEYXRhU291cmNlRGVjb3JhdG9yIHtcbiAgY29uc3RydWN0b3IoZGF0YVNvdXJjZTogRGF0YVNvdXJjZSkge1xuICAgIHN1cGVyKGRhdGFTb3VyY2UpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0QWxsTWVzc2FnZVR5cGVzKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCB0eXBlcyA9IHN1cGVyLmdldEFsbE1lc3NhZ2VUeXBlcygpO1xuICAgIGlmIChcbiAgICAgICF0eXBlcy5pbmNsdWRlcyhDb2xsYWJvcmF0aXZlV2hpdGVib2FyZENvbnN0YW50cy5leHRlbnNpb25fd2hpdGVib2FyZClcbiAgICApIHtcbiAgICAgIHR5cGVzLnB1c2goQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMuZXh0ZW5zaW9uX3doaXRlYm9hcmQpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZXM7XG4gIH1cbiAgb3ZlcnJpZGUgZ2V0SWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb2xsYWJvcmF0aXZld2hpdGVib2FyZFwiO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0QWxsTWVzc2FnZUNhdGVnb3JpZXMoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGNhdGVnb3JpZXMgPSBzdXBlci5nZXRBbGxNZXNzYWdlQ2F0ZWdvcmllcygpO1xuICAgIGlmICghY2F0ZWdvcmllcy5pbmNsdWRlcyhDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY3VzdG9tKSkge1xuICAgICAgY2F0ZWdvcmllcy5wdXNoKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jdXN0b20pO1xuICAgIH1cbiAgICByZXR1cm4gY2F0ZWdvcmllcztcbiAgfVxuICBjaGVja0lmVGVtcGxhdGVFeGlzdChcbiAgICB0ZW1wbGF0ZTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlW10sXG4gICAgdHlwZTogc3RyaW5nXG4gICk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0ZW1wbGF0ZS5zb21lKChvYmopID0+IG9iai50eXBlID09PSB0eXBlKTtcbiAgfVxuICBvdmVycmlkZSBnZXRBbGxNZXNzYWdlVGVtcGxhdGVzKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZVtdIHtcbiAgICBjb25zdCB0ZW1wbGF0ZXMgPSBzdXBlci5nZXRBbGxNZXNzYWdlVGVtcGxhdGVzKCk7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuY2hlY2tJZlRlbXBsYXRlRXhpc3QoXG4gICAgICAgIHRlbXBsYXRlcyxcbiAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMuZXh0ZW5zaW9uX3doaXRlYm9hcmRcbiAgICAgIClcbiAgICApIHtcbiAgICAgIHRlbXBsYXRlcy5wdXNoKHRoaXMuZ2V0V2hpdGVCb2FyZFRlbXBsYXRlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGVzO1xuICB9XG4gIGdldFdoaXRlQm9hcmRUZW1wbGF0ZSgpOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKHtcbiAgICAgIHR5cGU6IENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkQ29uc3RhbnRzLmV4dGVuc2lvbl93aGl0ZWJvYXJkLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jdXN0b20sXG4gICAgICBvcHRpb25zOiAoXG4gICAgICAgIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgIG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICAgICAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lLFxuICAgICAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgKSA9PiB7XG4gICAgICAgIHJldHVybiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRDb21tb25PcHRpb25zKFxuICAgICAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgICAgIHRoZW1lLFxuICAgICAgICAgIGdyb3VwXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG4gIG92ZXJyaWRlIGdldEF0dGFjaG1lbnRPcHRpb25zKFxuICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSksXG4gICAgdXNlcj86IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwLFxuICAgIGlkPzogYW55XG4gICkge1xuICAgIGlmICghaWQ/LnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgbGV0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdXNlclxuICAgICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgICBsZXQgcmVjZWl2ZXJJZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdXNlclxuICAgICAgICA/IHVzZXIuZ2V0VWlkKClcbiAgICAgICAgOiBncm91cD8uZ2V0R3VpZCgpO1xuICAgICAgY29uc3QgbWVzc2FnZUNvbXBvc2VyQWN0aW9uczogQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uW10gPVxuICAgICAgICBzdXBlci5nZXRBdHRhY2htZW50T3B0aW9ucyh0aGVtZSwgdXNlciwgZ3JvdXAsIGlkKTtcbiAgICAgIGxldCBuZXdBY3Rpb246IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiA9XG4gICAgICAgIG5ldyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24oe1xuICAgICAgICAgIGlkOiBDb2xsYWJvcmF0aXZlV2hpdGVib2FyZENvbnN0YW50cy53aGl0ZWJvYXJkLFxuICAgICAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIkNPTExBQk9SQVRJVkVfV0hJVEVCT0FSRFwiKSxcbiAgICAgICAgICBpY29uVVJMOiBcImFzc2V0cy9jb2xsYWJvcmF0aXZld2hpdGVib2FyZC5zdmdcIixcbiAgICAgICAgICBpY29uVGludDogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgICAgICB0aXRsZUNvbG9yOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICAgICAgYmFja2dyb3VuZDogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICBDb21ldENoYXQuY2FsbEV4dGVuc2lvbihcbiAgICAgICAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMud2hpdGVib2FyZCxcbiAgICAgICAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMucG9zdCxcbiAgICAgICAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMudjFfY3JlYXRlLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVjZWl2ZXI6IHJlY2VpdmVySWQsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZXJUeXBlOiByZWNlaXZlclR5cGUsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgLnRoZW4oKHJlczogYW55KSA9PiB7fSlcbiAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICBtZXNzYWdlQ29tcG9zZXJBY3Rpb25zLnB1c2gobmV3QWN0aW9uKTtcbiAgICAgIHJldHVybiBtZXNzYWdlQ29tcG9zZXJBY3Rpb25zO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VwZXIuZ2V0QXR0YWNobWVudE9wdGlvbnModGhlbWUsIHVzZXIsIGdyb3VwLCBpZCk7XG4gICAgfVxuICB9XG4gIG92ZXJyaWRlIGdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGFkZGl0aW9uYWxDb25maWd1cmF0aW9uczogYW55XG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgdW5kZWZpbmVkID1cbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpO1xuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UgIT0gbnVsbCAmJlxuICAgICAgbWVzc2FnZS5nZXRUeXBlKCkgPT1cbiAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMuZXh0ZW5zaW9uX3doaXRlYm9hcmQgJiZcbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY3VzdG9tXG4gICAgKSB7XG4gICAgICByZXR1cm4gbG9jYWxpemUoXCJDVVNUT01fTUVTU0FHRV9XSElURUJPQVJEXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VwZXIuZ2V0TGFzdENvbnZlcnNhdGlvbk1lc3NhZ2UoXG4gICAgICAgIGNvbnZlcnNhdGlvbixcbiAgICAgICAgbG9nZ2VkSW5Vc2VyLFxuICAgICAgICBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnNcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG4iXX0=