import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessagesComponent } from "./cometchat-messages/cometchat-messages.component";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatMessageList } from "../CometChatMessageList/cometchat-message-list.module";
import { CometChatMessageComposer } from "../CometChatMessageComposer/cometchat-message-composer.module";
import "@cometchat/uikit-elements";
import { CometChatThreadedMessages } from "../CometChatThreadedMessages/cometchat-threaded-messages.module";
import { CometChatDetails } from "../CometChatDetails/cometchat-details.module";
import { CometChatCallButtons } from "../Calls/CometChatCallButtons/cometchat-call-buttons.module";
import { AIAssistBotMessageList } from "../Shared/Views/AIAssistBotMessageList/aiassist-bot-message-list.module";
import * as i0 from "@angular/core";
export class CometChatMessages {
}
CometChatMessages.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessages, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatMessages.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessages, declarations: [CometChatMessagesComponent], imports: [CommonModule,
        CometChatMessageHeader,
        CometChatMessageList,
        CometChatMessageComposer,
        CometChatThreadedMessages,
        CometChatDetails,
        CometChatCallButtons,
        AIAssistBotMessageList], exports: [CometChatMessagesComponent] });
CometChatMessages.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessages, imports: [[
            CommonModule,
            CometChatMessageHeader,
            CometChatMessageList,
            CometChatMessageComposer,
            CometChatThreadedMessages,
            CometChatDetails,
            CometChatCallButtons,
            AIAssistBotMessageList,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessages, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatMessagesComponent],
                    imports: [
                        CommonModule,
                        CometChatMessageHeader,
                        CometChatMessageList,
                        CometChatMessageComposer,
                        CometChatThreadedMessages,
                        CometChatDetails,
                        CometChatCallButtons,
                        AIAssistBotMessageList,
                    ],
                    exports: [CometChatMessagesComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2VzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZXMvY29tZXRjaGF0LW1lc3NhZ2VzLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxtREFBbUQsQ0FBQztBQUMvRixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSwyREFBMkQsQ0FBQztBQUNuRyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx1REFBdUQsQ0FBQztBQUM3RixPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSwrREFBK0QsQ0FBQztBQUN6RyxPQUFPLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLGlFQUFpRSxDQUFDO0FBQzVHLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDhDQUE4QyxDQUFDO0FBQ2hGLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDZEQUE2RCxDQUFDO0FBQ25HLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLHlFQUF5RSxDQUFDOztBQWlCakgsTUFBTSxPQUFPLGlCQUFpQjs7K0dBQWpCLGlCQUFpQjtnSEFBakIsaUJBQWlCLGlCQWRiLDBCQUEwQixhQUV2QyxZQUFZO1FBQ1osc0JBQXNCO1FBQ3RCLG9CQUFvQjtRQUNwQix3QkFBd0I7UUFDeEIseUJBQXlCO1FBQ3pCLGdCQUFnQjtRQUNoQixvQkFBb0I7UUFDcEIsc0JBQXNCLGFBRWQsMEJBQTBCO2dIQUd6QixpQkFBaUIsWUFibkI7WUFDUCxZQUFZO1lBQ1osc0JBQXNCO1lBQ3RCLG9CQUFvQjtZQUNwQix3QkFBd0I7WUFDeEIseUJBQXlCO1lBQ3pCLGdCQUFnQjtZQUNoQixvQkFBb0I7WUFDcEIsc0JBQXNCO1NBQ3ZCOzRGQUlVLGlCQUFpQjtrQkFmN0IsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQztvQkFDMUMsT0FBTyxFQUFFO3dCQUNQLFlBQVk7d0JBQ1osc0JBQXNCO3dCQUN0QixvQkFBb0I7d0JBQ3BCLHdCQUF3Qjt3QkFDeEIseUJBQXlCO3dCQUN6QixnQkFBZ0I7d0JBQ2hCLG9CQUFvQjt3QkFDcEIsc0JBQXNCO3FCQUN2QjtvQkFDRCxPQUFPLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQztvQkFDckMsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUM7aUJBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZXNDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtbWVzc2FnZXMvY29tZXRjaGF0LW1lc3NhZ2VzLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZUhlYWRlciB9IGZyb20gXCIuLi9Db21ldENoYXRNZXNzYWdlSGVhZGVyL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VMaXN0IH0gZnJvbSBcIi4uL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXIgfSBmcm9tIFwiLi4vQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyL2NvbWV0Y2hhdC1tZXNzYWdlLWNvbXBvc2VyLm1vZHVsZVwiO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhyZWFkZWRNZXNzYWdlcyB9IGZyb20gXCIuLi9Db21ldENoYXRUaHJlYWRlZE1lc3NhZ2VzL2NvbWV0Y2hhdC10aHJlYWRlZC1tZXNzYWdlcy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdERldGFpbHMgfSBmcm9tIFwiLi4vQ29tZXRDaGF0RGV0YWlscy9jb21ldGNoYXQtZGV0YWlscy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdENhbGxCdXR0b25zIH0gZnJvbSBcIi4uL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMubW9kdWxlXCI7XG5pbXBvcnQgeyBBSUFzc2lzdEJvdE1lc3NhZ2VMaXN0IH0gZnJvbSBcIi4uL1NoYXJlZC9WaWV3cy9BSUFzc2lzdEJvdE1lc3NhZ2VMaXN0L2FpYXNzaXN0LWJvdC1tZXNzYWdlLWxpc3QubW9kdWxlXCI7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdE1lc3NhZ2VzQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgICBDb21ldENoYXRNZXNzYWdlSGVhZGVyLFxuICAgIENvbWV0Q2hhdE1lc3NhZ2VMaXN0LFxuICAgIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlcixcbiAgICBDb21ldENoYXRUaHJlYWRlZE1lc3NhZ2VzLFxuICAgIENvbWV0Q2hhdERldGFpbHMsXG4gICAgQ29tZXRDaGF0Q2FsbEJ1dHRvbnMsXG4gICAgQUlBc3Npc3RCb3RNZXNzYWdlTGlzdCxcbiAgXSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdE1lc3NhZ2VzQ29tcG9uZW50XSxcbiAgc2NoZW1hczogW0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlcyB7fVxuIl19