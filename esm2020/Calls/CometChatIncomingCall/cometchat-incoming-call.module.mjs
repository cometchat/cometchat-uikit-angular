import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatIncomingCallComponent } from "./cometchat-incoming-call/cometchat-incoming-call.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import "@cometchat/uikit-elements";
import { CometChatOngoingCall } from "../CometChatOngoingCall/cometchat-ongoing-call.module";
import * as i0 from "@angular/core";
export class CometChatIncomingCall {
}
CometChatIncomingCall.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatIncomingCall, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatIncomingCall.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatIncomingCall, declarations: [CometChatIncomingCallComponent], imports: [CommonModule,
        CometChatList,
        CometChatOngoingCall], exports: [CometChatIncomingCallComponent] });
CometChatIncomingCall.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatIncomingCall, imports: [[
            CommonModule,
            CometChatList,
            CometChatOngoingCall
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatIncomingCall, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatIncomingCallComponent],
                    imports: [
                        CommonModule,
                        CometChatList,
                        CometChatOngoingCall
                    ],
                    exports: [CometChatIncomingCallComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWluY29taW5nLWNhbGwubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRJbmNvbWluZ0NhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLDZEQUE2RCxDQUFDO0FBQzdHLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUMxRSxPQUFRLDJCQUEyQixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHVEQUF1RCxDQUFDOztBQVc3RixNQUFNLE9BQU8scUJBQXFCOzttSEFBckIscUJBQXFCO29IQUFyQixxQkFBcUIsaUJBVGpCLDhCQUE4QixhQUUzQyxZQUFZO1FBQ2hCLGFBQWE7UUFDYixvQkFBb0IsYUFFUiw4QkFBOEI7b0hBRzdCLHFCQUFxQixZQVJ2QjtZQUNQLFlBQVk7WUFDaEIsYUFBYTtZQUNiLG9CQUFvQjtTQUNqQjs0RkFJVSxxQkFBcUI7a0JBVmpDLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsOEJBQThCLENBQUM7b0JBQzlDLE9BQU8sRUFBRTt3QkFDUCxZQUFZO3dCQUNoQixhQUFhO3dCQUNiLG9CQUFvQjtxQkFDakI7b0JBQ0QsT0FBTyxFQUFFLENBQUMsOEJBQThCLENBQUM7b0JBQ3pDLE9BQU8sRUFBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdEluY29taW5nQ2FsbENvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1pbmNvbWluZy1jYWxsL2NvbWV0Y2hhdC1pbmNvbWluZy1jYWxsLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TGlzdCB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRMaXN0L2NvbWV0Y2hhdC1saXN0Lm1vZHVsZVwiO1xuaW1wb3J0ICBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7IENvbWV0Q2hhdE9uZ29pbmdDYWxsIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwubW9kdWxlXCI7XG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDb21ldENoYXRJbmNvbWluZ0NhbGxDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbXG4gICAgQ29tbW9uTW9kdWxlLFxuQ29tZXRDaGF0TGlzdCxcbkNvbWV0Q2hhdE9uZ29pbmdDYWxsXG4gIF0sXG4gIGV4cG9ydHM6IFtDb21ldENoYXRJbmNvbWluZ0NhbGxDb21wb25lbnRdLFxuICBzY2hlbWFzOltDVVNUT01fRUxFTUVOVFNfU0NIRU1BXVxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRJbmNvbWluZ0NhbGwge31cbiJdfQ==