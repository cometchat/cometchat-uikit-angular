import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatBannedMembersComponent } from "./cometchat-banned-members/cometchat-banned-members.component";
import { FormsModule } from "@angular/forms";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import '@cometchat/uikit-elements';
import { CometChatList } from "../CometChatList/cometchat-list.module";
import * as i0 from "@angular/core";
export class CometChatBannedMembers {
}
CometChatBannedMembers.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatBannedMembers, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatBannedMembers.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatBannedMembers, declarations: [CometChatBannedMembersComponent], imports: [CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers, CometChatList], exports: [CometChatBannedMembersComponent] });
CometChatBannedMembers.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatBannedMembers, imports: [[CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers, CometChatList]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatBannedMembers, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatBannedMembersComponent],
                    imports: [CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers, CometChatList],
                    exports: [CometChatBannedMembersComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWJhbm5lZC1tZW1iZXJzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSwrQkFBK0IsRUFBRSxNQUFNLCtEQUErRCxDQUFDO0FBQ2hILE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSwyREFBMkQsQ0FBQztBQUNuRyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDMUUsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sd0NBQXdDLENBQUM7O0FBT3ZFLE1BQU0sT0FBTyxzQkFBc0I7O29IQUF0QixzQkFBc0I7cUhBQXRCLHNCQUFzQixpQkFMbEIsK0JBQStCLGFBQ3BDLFlBQVksRUFBQyxXQUFXLEVBQUMsc0JBQXNCLEVBQUMsY0FBYyxFQUFDLGFBQWEsYUFDNUUsK0JBQStCO3FIQUc5QixzQkFBc0IsWUFKeEIsQ0FBQyxZQUFZLEVBQUMsV0FBVyxFQUFDLHNCQUFzQixFQUFDLGNBQWMsRUFBQyxhQUFhLENBQUM7NEZBSTVFLHNCQUFzQjtrQkFObEMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQywrQkFBK0IsQ0FBQztvQkFDL0MsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFDLFdBQVcsRUFBQyxzQkFBc0IsRUFBQyxjQUFjLEVBQUMsYUFBYSxDQUFDO29CQUN2RixPQUFPLEVBQUUsQ0FBQywrQkFBK0IsQ0FBQztvQkFDMUMsT0FBTyxFQUFDLENBQUMsc0JBQXNCLENBQUM7aUJBQ2pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0QmFubmVkTWVtYmVyc0NvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1iYW5uZWQtbWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMuY29tcG9uZW50XCI7XG5pbXBvcnQgeyBGb3Jtc01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9mb3Jtc1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZUhlYWRlciB9IGZyb20gXCIuLi9Db21ldENoYXRNZXNzYWdlSGVhZGVyL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVzZXJzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdFVzZXJzL2NvbWV0Y2hhdC11c2Vycy5tb2R1bGVcIjtcbmltcG9ydCAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdExpc3QgfSBmcm9tIFwiLi4vQ29tZXRDaGF0TGlzdC9jb21ldGNoYXQtbGlzdC5tb2R1bGVcIjtcbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdEJhbm5lZE1lbWJlcnNDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlLEZvcm1zTW9kdWxlLENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXIsQ29tZXRDaGF0VXNlcnMsQ29tZXRDaGF0TGlzdF0sXG4gIGV4cG9ydHM6IFtDb21ldENoYXRCYW5uZWRNZW1iZXJzQ29tcG9uZW50XSxcbiAgc2NoZW1hczpbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV1cbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0QmFubmVkTWVtYmVycyB7fVxuIl19