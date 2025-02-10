import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupsWithMessagesComponent } from "./cometchat-groups-with-messages/cometchat-groups-with-messages.component";
import { CometChatMessages } from "../CometChatMessages/cometchat-messages.module";
import { CometChatGroups } from "../CometChatGroups/cometchat-groups.module";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import * as i0 from "@angular/core";
export class CometChatGroupsWithMessages {
}
CometChatGroupsWithMessages.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsWithMessages, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatGroupsWithMessages.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsWithMessages, declarations: [CometChatGroupsWithMessagesComponent], imports: [CommonModule,
        CometChatGroups,
        CometChatMessages,
        CometChatMessageHeader], exports: [CometChatGroupsWithMessagesComponent] });
CometChatGroupsWithMessages.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsWithMessages, imports: [[
            CommonModule,
            CometChatGroups,
            CometChatMessages,
            CometChatMessageHeader
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupsWithMessages, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatGroupsWithMessagesComponent],
                    imports: [
                        CommonModule,
                        CometChatGroups,
                        CometChatMessages,
                        CometChatMessageHeader
                    ],
                    exports: [CometChatGroupsWithMessagesComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3Vwcy13aXRoLW1lc3NhZ2VzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0R3JvdXBzV2l0aE1lc3NhZ2VzL2NvbWV0Y2hhdC1ncm91cHMtd2l0aC1tZXNzYWdlcy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLG9DQUFvQyxFQUFFLE1BQU0sMkVBQTJFLENBQUM7QUFDakksT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDbkYsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDRDQUE0QyxDQUFDO0FBQzdFLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLDJEQUEyRCxDQUFDOztBQWFuRyxNQUFNLE9BQU8sMkJBQTJCOzt5SEFBM0IsMkJBQTJCOzBIQUEzQiwyQkFBMkIsaUJBVnZCLG9DQUFvQyxhQUVqRCxZQUFZO1FBQ1osZUFBZTtRQUNmLGlCQUFpQjtRQUNqQixzQkFBc0IsYUFFZCxvQ0FBb0M7MEhBR25DLDJCQUEyQixZQVQ3QjtZQUNQLFlBQVk7WUFDWixlQUFlO1lBQ2YsaUJBQWlCO1lBQ2pCLHNCQUFzQjtTQUN2Qjs0RkFJVSwyQkFBMkI7a0JBWHZDLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsb0NBQW9DLENBQUM7b0JBQ3BELE9BQU8sRUFBRTt3QkFDUCxZQUFZO3dCQUNaLGVBQWU7d0JBQ2YsaUJBQWlCO3dCQUNqQixzQkFBc0I7cUJBQ3ZCO29CQUNELE9BQU8sRUFBRSxDQUFDLG9DQUFvQyxDQUFDO29CQUMvQyxPQUFPLEVBQUMsQ0FBQyxzQkFBc0IsQ0FBQztpQkFDakMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOZ01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29tbW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRHcm91cHNXaXRoTWVzc2FnZXNDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtZ3JvdXBzLXdpdGgtbWVzc2FnZXMvY29tZXRjaGF0LWdyb3Vwcy13aXRoLW1lc3NhZ2VzLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZXMgfSBmcm9tIFwiLi4vQ29tZXRDaGF0TWVzc2FnZXMvY29tZXRjaGF0LW1lc3NhZ2VzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0R3JvdXBzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdEdyb3Vwcy9jb21ldGNoYXQtZ3JvdXBzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZUhlYWRlciB9IGZyb20gXCIuLi9Db21ldENoYXRNZXNzYWdlSGVhZGVyL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5tb2R1bGVcIjtcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0R3JvdXBzV2l0aE1lc3NhZ2VzQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgICBDb21ldENoYXRHcm91cHMsXG4gICAgQ29tZXRDaGF0TWVzc2FnZXMsXG4gICAgQ29tZXRDaGF0TWVzc2FnZUhlYWRlclxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0R3JvdXBzV2l0aE1lc3NhZ2VzQ29tcG9uZW50XSxcbiAgc2NoZW1hczpbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV1cbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0R3JvdXBzV2l0aE1lc3NhZ2VzIHt9XG4iXX0=