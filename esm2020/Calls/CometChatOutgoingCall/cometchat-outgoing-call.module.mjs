import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatOutgoingCallComponent } from "./cometchat-outgoing-call/cometchat-outgoing-call.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import "@cometchat/uikit-elements";
import * as i0 from "@angular/core";
export class CometChatOutgoingCall {
}
CometChatOutgoingCall.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOutgoingCall, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatOutgoingCall.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOutgoingCall, declarations: [CometChatOutgoingCallComponent], imports: [CommonModule,
        CometChatList], exports: [CometChatOutgoingCallComponent] });
CometChatOutgoingCall.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOutgoingCall, imports: [[
            CommonModule,
            CometChatList,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOutgoingCall, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatOutgoingCallComponent],
                    imports: [
                        CommonModule,
                        CometChatList,
                    ],
                    exports: [CometChatOutgoingCallComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW91dGdvaW5nLWNhbGwubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRPdXRnb2luZ0NhbGwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGwubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLDZEQUE2RCxDQUFDO0FBQzdHLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUMxRSxPQUFRLDJCQUEyQixDQUFDOztBQVVwQyxNQUFNLE9BQU8scUJBQXFCOzttSEFBckIscUJBQXFCO29IQUFyQixxQkFBcUIsaUJBUmpCLDhCQUE4QixhQUUzQyxZQUFZO1FBQ2hCLGFBQWEsYUFFRCw4QkFBOEI7b0hBRzdCLHFCQUFxQixZQVB2QjtZQUNQLFlBQVk7WUFDaEIsYUFBYTtTQUNWOzRGQUlVLHFCQUFxQjtrQkFUakMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztvQkFDOUMsT0FBTyxFQUFFO3dCQUNQLFlBQVk7d0JBQ2hCLGFBQWE7cUJBQ1Y7b0JBQ0QsT0FBTyxFQUFFLENBQUMsOEJBQThCLENBQUM7b0JBQ3pDLE9BQU8sRUFBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdE91dGdvaW5nQ2FsbENvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1vdXRnb2luZy1jYWxsL2NvbWV0Y2hhdC1vdXRnb2luZy1jYWxsLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TGlzdCB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRMaXN0L2NvbWV0Y2hhdC1saXN0Lm1vZHVsZVwiO1xuaW1wb3J0ICBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdE91dGdvaW5nQ2FsbENvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG5Db21ldENoYXRMaXN0LFxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0T3V0Z29pbmdDYWxsQ29tcG9uZW50XSxcbiAgc2NoZW1hczpbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV1cbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0T3V0Z29pbmdDYWxsIHt9XG4iXX0=