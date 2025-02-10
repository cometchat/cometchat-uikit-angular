import { CometChatOngoingCall } from "./../CometChatOngoingCall/cometchat-ongoing-call.module";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometchatCallLogsComponent } from "./cometchat-call-logs/cometchat-call-logs.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import "@cometchat/uikit-elements";
import { CometChatOutgoingCall } from "../CometChatOutgoingCall/cometchat-outgoing-call.module";
import * as i0 from "@angular/core";
export class CometChatCallLogs {
}
CometChatCallLogs.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogs, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatCallLogs.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogs, declarations: [CometchatCallLogsComponent], imports: [CommonModule,
        CometChatList,
        CometChatOutgoingCall,
        CometChatOngoingCall], exports: [CometchatCallLogsComponent] });
CometChatCallLogs.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogs, imports: [[
            CommonModule,
            CometChatList,
            CometChatOutgoingCall,
            CometChatOngoingCall,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogs, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometchatCallLogsComponent],
                    imports: [
                        CommonModule,
                        CometChatList,
                        CometChatOutgoingCall,
                        CometChatOngoingCall,
                    ],
                    exports: [CometchatCallLogsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9ncy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHlEQUF5RCxDQUFDO0FBQy9GLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLHFEQUFxRCxDQUFDO0FBRWpHLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUMxRSxPQUFPLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHlEQUF5RCxDQUFDOztBQVloRyxNQUFNLE9BQU8saUJBQWlCOzsrR0FBakIsaUJBQWlCO2dIQUFqQixpQkFBaUIsaUJBVmIsMEJBQTBCLGFBRXZDLFlBQVk7UUFDWixhQUFhO1FBQ2IscUJBQXFCO1FBQ3JCLG9CQUFvQixhQUVaLDBCQUEwQjtnSEFHekIsaUJBQWlCLFlBVG5CO1lBQ1AsWUFBWTtZQUNaLGFBQWE7WUFDYixxQkFBcUI7WUFDckIsb0JBQW9CO1NBQ3JCOzRGQUlVLGlCQUFpQjtrQkFYN0IsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQztvQkFDMUMsT0FBTyxFQUFFO3dCQUNQLFlBQVk7d0JBQ1osYUFBYTt3QkFDYixxQkFBcUI7d0JBQ3JCLG9CQUFvQjtxQkFDckI7b0JBQ0QsT0FBTyxFQUFFLENBQUMsMEJBQTBCLENBQUM7b0JBQ3JDLE9BQU8sRUFBRSxDQUFDLHNCQUFzQixDQUFDO2lCQUNsQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbWV0Q2hhdE9uZ29pbmdDYWxsIH0gZnJvbSBcIi4vLi4vQ29tZXRDaGF0T25nb2luZ0NhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5tb2R1bGVcIjtcbmltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Y2hhdENhbGxMb2dzQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tZXRjaGF0LWNhbGwtbG9ncy9jb21ldGNoYXQtY2FsbC1sb2dzLmNvbXBvbmVudFwiO1xuXG5pbXBvcnQgeyBDb21ldENoYXRMaXN0IH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdExpc3QvY29tZXRjaGF0LWxpc3QubW9kdWxlXCI7XG5pbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgeyBDb21ldENoYXRPdXRnb2luZ0NhbGwgfSBmcm9tIFwiLi4vQ29tZXRDaGF0T3V0Z29pbmdDYWxsL2NvbWV0Y2hhdC1vdXRnb2luZy1jYWxsLm1vZHVsZVwiO1xuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRjaGF0Q2FsbExvZ3NDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbXG4gICAgQ29tbW9uTW9kdWxlLFxuICAgIENvbWV0Q2hhdExpc3QsXG4gICAgQ29tZXRDaGF0T3V0Z29pbmdDYWxsLFxuICAgIENvbWV0Q2hhdE9uZ29pbmdDYWxsLFxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRjaGF0Q2FsbExvZ3NDb21wb25lbnRdLFxuICBzY2hlbWFzOiBbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV0sXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENhbGxMb2dzIHt9XG4iXX0=