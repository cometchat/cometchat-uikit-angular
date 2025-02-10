import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatOngoingCallComponent } from "./cometchat-ongoing-call/cometchat-ongoing-call.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import * as i0 from "@angular/core";
export class CometChatOngoingCall {
}
CometChatOngoingCall.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOngoingCall, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatOngoingCall.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOngoingCall, declarations: [CometChatOngoingCallComponent], imports: [CommonModule,
        CometChatList], exports: [CometChatOngoingCallComponent] });
CometChatOngoingCall.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOngoingCall, imports: [[
            CommonModule,
            CometChatList,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOngoingCall, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatOngoingCallComponent],
                    imports: [
                        CommonModule,
                        CometChatList,
                    ],
                    exports: [CometChatOngoingCallComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW9uZ29pbmctY2FsbC5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxNQUFNLDJEQUEyRCxDQUFDO0FBQzFHLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQzs7QUFXMUUsTUFBTSxPQUFPLG9CQUFvQjs7a0hBQXBCLG9CQUFvQjttSEFBcEIsb0JBQW9CLGlCQVJoQiw2QkFBNkIsYUFFMUMsWUFBWTtRQUNoQixhQUFhLGFBRUQsNkJBQTZCO21IQUc1QixvQkFBb0IsWUFQdEI7WUFDUCxZQUFZO1lBQ2hCLGFBQWE7U0FDVjs0RkFJVSxvQkFBb0I7a0JBVGhDLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsNkJBQTZCLENBQUM7b0JBQzdDLE9BQU8sRUFBRTt3QkFDUCxZQUFZO3dCQUNoQixhQUFhO3FCQUNWO29CQUNELE9BQU8sRUFBRSxDQUFDLDZCQUE2QixDQUFDO29CQUN4QyxPQUFPLEVBQUMsQ0FBQyxzQkFBc0IsQ0FBQztpQkFDakMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOZ01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29tbW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRPbmdvaW5nQ2FsbENvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdExpc3QgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0TGlzdC9jb21ldGNoYXQtbGlzdC5tb2R1bGVcIjtcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0T25nb2luZ0NhbGxDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbXG4gICAgQ29tbW9uTW9kdWxlLFxuQ29tZXRDaGF0TGlzdCxcbiAgXSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdE9uZ29pbmdDYWxsQ29tcG9uZW50XSxcbiAgc2NoZW1hczpbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV1cbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0T25nb2luZ0NhbGwge31cbiJdfQ==