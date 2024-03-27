import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallLogDetailsComponent } from "./cometchat-call-log-details/cometchat-call-log-details.component";
import { CometChatCallButtons } from "../CometChatCallButtons/cometchat-call-buttons.module";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import { CometChatCallLogParticipants } from "../CometChatCallLogParticipants/cometchat-call-log-participants.module";
import { CometChatCallLogRecordings } from "../CometChatCallLogRecordings/cometchat-call-log-recordings.module";
import { CometChatCallLogs } from "../CometChatCallLogs/cometchat-call-logs.module";
import { CometChatCallLogHistory } from "../CometChatCallLogHistory/cometchat-call-log-history.module";
import * as i0 from "@angular/core";
export class CometChatCallLogDetails {
}
CometChatCallLogDetails.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogDetails, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatCallLogDetails.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogDetails, declarations: [CometChatCallLogDetailsComponent], imports: [CommonModule,
        CometChatCallButtons,
        CometChatList,
        CometChatCallLogParticipants,
        CometChatCallLogRecordings,
        CometChatCallLogHistory,
        CometChatCallLogs], exports: [CometChatCallLogDetailsComponent] });
CometChatCallLogDetails.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogDetails, imports: [[
            CommonModule,
            CometChatCallButtons,
            CometChatList,
            CometChatCallLogParticipants,
            CometChatCallLogRecordings,
            CometChatCallLogHistory,
            CometChatCallLogs,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogDetails, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatCallLogDetailsComponent],
                    imports: [
                        CommonModule,
                        CometChatCallButtons,
                        CometChatList,
                        CometChatCallLogParticipants,
                        CometChatCallLogRecordings,
                        CometChatCallLogHistory,
                        CometChatCallLogs,
                    ],
                    exports: [CometChatCallLogDetailsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9nLWRldGFpbHMubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRDYWxsTG9nRGV0YWlscy9jb21ldGNoYXQtY2FsbC1sb2ctZGV0YWlscy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLE1BQU0sbUVBQW1FLENBQUM7QUFDckgsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sdURBQXVELENBQUM7QUFDN0YsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxNQUFNLHdFQUF3RSxDQUFDO0FBQ3RILE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLG9FQUFvRSxDQUFDO0FBQ2hILE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlEQUFpRCxDQUFDO0FBQ3BGLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDhEQUE4RCxDQUFDOztBQWdCdkcsTUFBTSxPQUFPLHVCQUF1Qjs7cUhBQXZCLHVCQUF1QjtzSEFBdkIsdUJBQXVCLGlCQWJuQixnQ0FBZ0MsYUFFN0MsWUFBWTtRQUNaLG9CQUFvQjtRQUNwQixhQUFhO1FBQ2IsNEJBQTRCO1FBQzVCLDBCQUEwQjtRQUMxQix1QkFBdUI7UUFDdkIsaUJBQWlCLGFBRVQsZ0NBQWdDO3NIQUcvQix1QkFBdUIsWUFaekI7WUFDUCxZQUFZO1lBQ1osb0JBQW9CO1lBQ3BCLGFBQWE7WUFDYiw0QkFBNEI7WUFDNUIsMEJBQTBCO1lBQzFCLHVCQUF1QjtZQUN2QixpQkFBaUI7U0FDbEI7NEZBSVUsdUJBQXVCO2tCQWRuQyxRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLGdDQUFnQyxDQUFDO29CQUNoRCxPQUFPLEVBQUU7d0JBQ1AsWUFBWTt3QkFDWixvQkFBb0I7d0JBQ3BCLGFBQWE7d0JBQ2IsNEJBQTRCO3dCQUM1QiwwQkFBMEI7d0JBQzFCLHVCQUF1Qjt3QkFDdkIsaUJBQWlCO3FCQUNsQjtvQkFDRCxPQUFPLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQztvQkFDM0MsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUM7aUJBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbExvZ0RldGFpbHNDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtY2FsbC1sb2ctZGV0YWlscy9jb21ldGNoYXQtY2FsbC1sb2ctZGV0YWlscy5jb21wb25lbnRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdENhbGxCdXR0b25zIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRMaXN0IH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdExpc3QvY29tZXRjaGF0LWxpc3QubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRDYWxsTG9nUGFydGljaXBhbnRzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdENhbGxMb2dQYXJ0aWNpcGFudHMvY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdENhbGxMb2dSZWNvcmRpbmdzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdENhbGxMb2dSZWNvcmRpbmdzL2NvbWV0Y2hhdC1jYWxsLWxvZy1yZWNvcmRpbmdzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbExvZ3MgfSBmcm9tIFwiLi4vQ29tZXRDaGF0Q2FsbExvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdENhbGxMb2dIaXN0b3J5IH0gZnJvbSBcIi4uL0NvbWV0Q2hhdENhbGxMb2dIaXN0b3J5L2NvbWV0Y2hhdC1jYWxsLWxvZy1oaXN0b3J5Lm1vZHVsZVwiO1xuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDb21ldENoYXRDYWxsTG9nRGV0YWlsc0NvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG4gICAgQ29tZXRDaGF0Q2FsbEJ1dHRvbnMsXG4gICAgQ29tZXRDaGF0TGlzdCxcbiAgICBDb21ldENoYXRDYWxsTG9nUGFydGljaXBhbnRzLFxuICAgIENvbWV0Q2hhdENhbGxMb2dSZWNvcmRpbmdzLFxuICAgIENvbWV0Q2hhdENhbGxMb2dIaXN0b3J5LFxuICAgIENvbWV0Q2hhdENhbGxMb2dzLFxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0Q2FsbExvZ0RldGFpbHNDb21wb25lbnRdLFxuICBzY2hlbWFzOiBbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV0sXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENhbGxMb2dEZXRhaWxzIHt9XG4iXX0=