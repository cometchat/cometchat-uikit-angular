import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupMembersComponent } from "./cometchat-group-members/cometchat-group-members.component";
import { FormsModule } from "@angular/forms";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import '@cometchat/uikit-elements';
import { CometChatList } from "../CometChatList/cometchat-list.module";
import * as i0 from "@angular/core";
export class CometChatGroupMembers {
}
CometChatGroupMembers.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupMembers, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatGroupMembers.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupMembers, declarations: [CometChatGroupMembersComponent], imports: [CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers, CometChatList], exports: [CometChatGroupMembersComponent] });
CometChatGroupMembers.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupMembers, imports: [[CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers, CometChatList]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatGroupMembers, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatGroupMembersComponent],
                    imports: [CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers, CometChatList],
                    exports: [CometChatGroupMembersComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRHcm91cE1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLDZEQUE2RCxDQUFDO0FBQzdHLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSwyREFBMkQsQ0FBQztBQUNuRyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDMUUsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sd0NBQXdDLENBQUM7O0FBT3ZFLE1BQU0sT0FBTyxxQkFBcUI7O21IQUFyQixxQkFBcUI7b0hBQXJCLHFCQUFxQixpQkFMakIsOEJBQThCLGFBQ25DLFlBQVksRUFBQyxXQUFXLEVBQUMsc0JBQXNCLEVBQUMsY0FBYyxFQUFDLGFBQWEsYUFDNUUsOEJBQThCO29IQUc3QixxQkFBcUIsWUFKdkIsQ0FBQyxZQUFZLEVBQUMsV0FBVyxFQUFDLHNCQUFzQixFQUFDLGNBQWMsRUFBQyxhQUFhLENBQUM7NEZBSTVFLHFCQUFxQjtrQkFOakMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztvQkFDOUMsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFDLFdBQVcsRUFBQyxzQkFBc0IsRUFBQyxjQUFjLEVBQUMsYUFBYSxDQUFDO29CQUN2RixPQUFPLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztvQkFDekMsT0FBTyxFQUFDLENBQUMsc0JBQXNCLENBQUM7aUJBQ2pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0R3JvdXBNZW1iZXJzQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMvY29tZXRjaGF0LWdyb3VwLW1lbWJlcnMuY29tcG9uZW50XCI7XG5pbXBvcnQgeyBGb3Jtc01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9mb3Jtc1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZUhlYWRlciB9IGZyb20gXCIuLi9Db21ldENoYXRNZXNzYWdlSGVhZGVyL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVzZXJzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy5tb2R1bGVcIjtcbmltcG9ydCAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdExpc3QgfSBmcm9tIFwiLi4vQ29tZXRDaGF0TGlzdC9jb21ldGNoYXQtbGlzdC5tb2R1bGVcIjtcbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtDb21tb25Nb2R1bGUsRm9ybXNNb2R1bGUsQ29tZXRDaGF0TWVzc2FnZUhlYWRlcixDb21ldENoYXRVc2VycyxDb21ldENoYXRMaXN0XSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdEdyb3VwTWVtYmVyc0NvbXBvbmVudF0sXG4gIHNjaGVtYXM6W0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdEdyb3VwTWVtYmVycyB7fVxuIl19