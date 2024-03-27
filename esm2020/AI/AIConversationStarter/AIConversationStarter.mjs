import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AIExtensionDataSource } from "../../Shared/Framework/AIExtensionDataSource";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { AIConversationStarterDecorator } from "./AIConversationStarterDecorator";
export class AIConversationStarterExtension extends AIExtensionDataSource {
    constructor() {
        super();
    }
    addExtension() {
        ChatConfigurator.enable((dataSource) => new AIConversationStarterDecorator(dataSource));
    }
    getExtensionId() {
        return "conversation-starter";
    }
    async enable() {
        if (await CometChat.isAIFeatureEnabled(this.getExtensionId())) {
            this.addExtension();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQUlDb252ZXJzYXRpb25TdGFydGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9BSS9BSUNvbnZlcnNhdGlvblN0YXJ0ZXIvQUlDb252ZXJzYXRpb25TdGFydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw4Q0FBOEMsQ0FBQztBQUNyRixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUMzRSxPQUFPLEVBQUUsOEJBQThCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNsRixNQUFNLE9BQU8sOEJBQStCLFNBQVEscUJBQXFCO0lBQ3ZFO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ1EsWUFBWTtRQUNuQixnQkFBZ0IsQ0FBQyxNQUFNLENBQ3JCLENBQUMsVUFBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLDhCQUE4QixDQUFDLFVBQVUsQ0FBQyxDQUNwRSxDQUFDO0lBQ0osQ0FBQztJQUNRLGNBQWM7UUFDckIsT0FBTyxzQkFBc0IsQ0FBQztJQUNoQyxDQUFDO0lBRVEsS0FBSyxDQUFDLE1BQU07UUFDbkIsSUFBSSxNQUFNLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRTtZQUM3RCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDckI7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBBSUV4dGVuc2lvbkRhdGFTb3VyY2UgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9BSUV4dGVuc2lvbkRhdGFTb3VyY2VcIjtcbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBBSUNvbnZlcnNhdGlvblN0YXJ0ZXJEZWNvcmF0b3IgfSBmcm9tIFwiLi9BSUNvbnZlcnNhdGlvblN0YXJ0ZXJEZWNvcmF0b3JcIjtcbmV4cG9ydCBjbGFzcyBBSUNvbnZlcnNhdGlvblN0YXJ0ZXJFeHRlbnNpb24gZXh0ZW5kcyBBSUV4dGVuc2lvbkRhdGFTb3VyY2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIG92ZXJyaWRlIGFkZEV4dGVuc2lvbigpOiB2b2lkIHtcbiAgICBDaGF0Q29uZmlndXJhdG9yLmVuYWJsZShcbiAgICAgIChkYXRhU291cmNlOiBhbnkpID0+IG5ldyBBSUNvbnZlcnNhdGlvblN0YXJ0ZXJEZWNvcmF0b3IoZGF0YVNvdXJjZSlcbiAgICApO1xuICB9XG4gIG92ZXJyaWRlIGdldEV4dGVuc2lvbklkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29udmVyc2F0aW9uLXN0YXJ0ZXJcIjtcbiAgfVxuXG4gIG92ZXJyaWRlIGFzeW5jIGVuYWJsZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoYXdhaXQgQ29tZXRDaGF0LmlzQUlGZWF0dXJlRW5hYmxlZCh0aGlzLmdldEV4dGVuc2lvbklkKCkpKSB7XG4gICAgICB0aGlzLmFkZEV4dGVuc2lvbigpO1xuICAgIH1cbiAgfVxufVxuIl19