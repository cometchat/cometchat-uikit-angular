import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatDetailsComponent } from "./cometchat-details/cometchat-details.component";
import { CometChatAddMembers } from "../CometChatAddMembers/cometchat-add-members.module";
import { CometChatBannedMembers } from "../CometChatBannedMembers/cometchat-banned-members.module";
import { CometChatGroupMembers } from "../CometChatGroupMembers/cometchat-group-members.module";
import { CometChatTransferOwnership } from "../CometChatTransferOwnership/cometchat-transfer-ownership.module";
import * as i0 from "@angular/core";
export class CometChatDetails {
}
CometChatDetails.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetails, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatDetails.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetails, declarations: [CometChatDetailsComponent], imports: [CommonModule, CometChatAddMembers, CometChatBannedMembers, CometChatGroupMembers, CometChatTransferOwnership], exports: [CometChatDetailsComponent] });
CometChatDetails.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetails, imports: [[
            CommonModule, CometChatAddMembers, CometChatBannedMembers, CometChatGroupMembers, CometChatTransferOwnership
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatDetails, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatDetailsComponent],
                    imports: [
                        CommonModule, CometChatAddMembers, CometChatBannedMembers, CometChatGroupMembers, CometChatTransferOwnership
                    ],
                    exports: [CometChatDetailsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWRldGFpbHMubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXREZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxpREFBaUQsQ0FBQztBQUM1RixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxxREFBcUQsQ0FBQztBQUMxRixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSwyREFBMkQsQ0FBQztBQUNuRyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSx5REFBeUQsQ0FBQztBQUNoRyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxtRUFBbUUsQ0FBQzs7QUFVL0csTUFBTSxPQUFPLGdCQUFnQjs7OEdBQWhCLGdCQUFnQjsrR0FBaEIsZ0JBQWdCLGlCQVBaLHlCQUF5QixhQUV0QyxZQUFZLEVBQUMsbUJBQW1CLEVBQUMsc0JBQXNCLEVBQUMscUJBQXFCLEVBQUMsMEJBQTBCLGFBRWhHLHlCQUF5QjsrR0FHeEIsZ0JBQWdCLFlBTmxCO1lBQ1AsWUFBWSxFQUFDLG1CQUFtQixFQUFDLHNCQUFzQixFQUFDLHFCQUFxQixFQUFDLDBCQUEwQjtTQUN6Rzs0RkFJVSxnQkFBZ0I7a0JBUjVCLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMseUJBQXlCLENBQUM7b0JBQ3pDLE9BQU8sRUFBRTt3QkFDUCxZQUFZLEVBQUMsbUJBQW1CLEVBQUMsc0JBQXNCLEVBQUMscUJBQXFCLEVBQUMsMEJBQTBCO3FCQUN6RztvQkFDRCxPQUFPLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQztvQkFDcEMsT0FBTyxFQUFDLENBQUMsc0JBQXNCLENBQUM7aUJBQ2pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RGV0YWlsc0NvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1kZXRhaWxzL2NvbWV0Y2hhdC1kZXRhaWxzLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0QWRkTWVtYmVycyB9IGZyb20gXCIuLi9Db21ldENoYXRBZGRNZW1iZXJzL2NvbWV0Y2hhdC1hZGQtbWVtYmVycy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEJhbm5lZE1lbWJlcnMgfSBmcm9tIFwiLi4vQ29tZXRDaGF0QmFubmVkTWVtYmVycy9jb21ldGNoYXQtYmFubmVkLW1lbWJlcnMubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRHcm91cE1lbWJlcnMgfSBmcm9tIFwiLi4vQ29tZXRDaGF0R3JvdXBNZW1iZXJzL2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VHJhbnNmZXJPd25lcnNoaXAgfSBmcm9tIFwiLi4vQ29tZXRDaGF0VHJhbnNmZXJPd25lcnNoaXAvY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcC5tb2R1bGVcIjtcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0RGV0YWlsc0NvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsQ29tZXRDaGF0QWRkTWVtYmVycyxDb21ldENoYXRCYW5uZWRNZW1iZXJzLENvbWV0Q2hhdEdyb3VwTWVtYmVycyxDb21ldENoYXRUcmFuc2Zlck93bmVyc2hpcFxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0RGV0YWlsc0NvbXBvbmVudF0sXG4gIHNjaGVtYXM6W0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdERldGFpbHMge31cbiJdfQ==