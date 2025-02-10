import { CometChatMessages } from "./../../CometChatMessages/cometchat-messages.module";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallLogsWithDetailsComponent } from "./cometchat-call-logs-with-details/cometchat-call-logs-with-details.component";
import { CometChatCallLogs } from "../CometChatCallLogs/cometchat-call-logs.module";
import { CometChatCallLogDetails } from "../CometChatCallLogDetails/cometchat-call-log-details.module";
import { CometChatOutgoingCall } from "../CometChatOutgoingCall/cometchat-outgoing-call.module";
import * as i0 from "@angular/core";
export class CometChatCallLogsWithDetails {
}
CometChatCallLogsWithDetails.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogsWithDetails, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatCallLogsWithDetails.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogsWithDetails, declarations: [CometChatCallLogsWithDetailsComponent], imports: [CommonModule,
        CometChatCallLogs,
        CometChatCallLogDetails,
        CometChatOutgoingCall,
        CometChatMessages], exports: [CometChatCallLogsWithDetailsComponent] });
CometChatCallLogsWithDetails.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogsWithDetails, imports: [[
            CommonModule,
            CometChatCallLogs,
            CometChatCallLogDetails,
            CometChatOutgoingCall,
            CometChatMessages,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogsWithDetails, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatCallLogsWithDetailsComponent],
                    imports: [
                        CommonModule,
                        CometChatCallLogs,
                        CometChatCallLogDetails,
                        CometChatOutgoingCall,
                        CometChatMessages,
                    ],
                    exports: [CometChatCallLogsWithDetailsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9ncy13aXRoLWRldGFpbHMubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRDYWxsTG9nc1dpdGhEZXRhaWxzL2NvbWV0Y2hhdC1jYWxsLWxvZ3Mtd2l0aC1kZXRhaWxzLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxxREFBcUQsQ0FBQztBQUN4RixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUscUNBQXFDLEVBQUUsTUFBTSwrRUFBK0UsQ0FBQztBQUN0SSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxpREFBaUQsQ0FBQztBQUNwRixPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw4REFBOEQsQ0FBQztBQUN2RyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSx5REFBeUQsQ0FBQzs7QUFjaEcsTUFBTSxPQUFPLDRCQUE0Qjs7MEhBQTVCLDRCQUE0QjsySEFBNUIsNEJBQTRCLGlCQVh4QixxQ0FBcUMsYUFFbEQsWUFBWTtRQUNaLGlCQUFpQjtRQUNqQix1QkFBdUI7UUFDdkIscUJBQXFCO1FBQ3JCLGlCQUFpQixhQUVULHFDQUFxQzsySEFHcEMsNEJBQTRCLFlBVjlCO1lBQ1AsWUFBWTtZQUNaLGlCQUFpQjtZQUNqQix1QkFBdUI7WUFDdkIscUJBQXFCO1lBQ3JCLGlCQUFpQjtTQUNsQjs0RkFJVSw0QkFBNEI7a0JBWnhDLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMscUNBQXFDLENBQUM7b0JBQ3JELE9BQU8sRUFBRTt3QkFDUCxZQUFZO3dCQUNaLGlCQUFpQjt3QkFDakIsdUJBQXVCO3dCQUN2QixxQkFBcUI7d0JBQ3JCLGlCQUFpQjtxQkFDbEI7b0JBQ0QsT0FBTyxFQUFFLENBQUMscUNBQXFDLENBQUM7b0JBQ2hELE9BQU8sRUFBRSxDQUFDLHNCQUFzQixDQUFDO2lCQUNsQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VzIH0gZnJvbSBcIi4vLi4vLi4vQ29tZXRDaGF0TWVzc2FnZXMvY29tZXRjaGF0LW1lc3NhZ2VzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbExvZ3NXaXRoRGV0YWlsc0NvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1jYWxsLWxvZ3Mtd2l0aC1kZXRhaWxzL2NvbWV0Y2hhdC1jYWxsLWxvZ3Mtd2l0aC1kZXRhaWxzLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbExvZ3MgfSBmcm9tIFwiLi4vQ29tZXRDaGF0Q2FsbExvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdENhbGxMb2dEZXRhaWxzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdENhbGxMb2dEZXRhaWxzL2NvbWV0Y2hhdC1jYWxsLWxvZy1kZXRhaWxzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0T3V0Z29pbmdDYWxsIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdE91dGdvaW5nQ2FsbC9jb21ldGNoYXQtb3V0Z29pbmctY2FsbC5tb2R1bGVcIjtcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0Q2FsbExvZ3NXaXRoRGV0YWlsc0NvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG4gICAgQ29tZXRDaGF0Q2FsbExvZ3MsXG4gICAgQ29tZXRDaGF0Q2FsbExvZ0RldGFpbHMsXG4gICAgQ29tZXRDaGF0T3V0Z29pbmdDYWxsLFxuICAgIENvbWV0Q2hhdE1lc3NhZ2VzLFxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0Q2FsbExvZ3NXaXRoRGV0YWlsc0NvbXBvbmVudF0sXG4gIHNjaGVtYXM6IFtDVVNUT01fRUxFTUVOVFNfU0NIRU1BXSxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0Q2FsbExvZ3NXaXRoRGV0YWlscyB7fVxuIl19