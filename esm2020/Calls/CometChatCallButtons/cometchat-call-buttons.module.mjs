import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallButtonsComponent } from "./cometchat-call-buttons/cometchat-call-buttons.component";
import "@cometchat/uikit-elements";
import { CometChatOutgoingCall } from "../CometChatOutgoingCall/cometchat-outgoing-call.module";
import { CometChatOngoingCall } from "../CometChatOngoingCall/cometchat-ongoing-call.module";
import * as i0 from "@angular/core";
export class CometChatCallButtons {
}
CometChatCallButtons.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallButtons, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatCallButtons.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallButtons, declarations: [CometChatCallButtonsComponent], imports: [CommonModule,
        CometChatOutgoingCall,
        CometChatOngoingCall], exports: [CometChatCallButtonsComponent] });
CometChatCallButtons.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallButtons, imports: [[
            CommonModule,
            CometChatOutgoingCall,
            CometChatOngoingCall
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallButtons, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatCallButtonsComponent],
                    imports: [
                        CommonModule,
                        CometChatOutgoingCall,
                        CometChatOngoingCall
                    ],
                    exports: [CometChatCallButtonsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxNQUFNLDJEQUEyRCxDQUFDO0FBRTFHLE9BQVEsMkJBQTJCLENBQUM7QUFDcEMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0seURBQXlELENBQUM7QUFDaEcsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sdURBQXVELENBQUM7O0FBVzdGLE1BQU0sT0FBTyxvQkFBb0I7O2tIQUFwQixvQkFBb0I7bUhBQXBCLG9CQUFvQixpQkFUaEIsNkJBQTZCLGFBRTFDLFlBQVk7UUFDaEIscUJBQXFCO1FBQ3JCLG9CQUFvQixhQUVSLDZCQUE2QjttSEFHNUIsb0JBQW9CLFlBUnRCO1lBQ1AsWUFBWTtZQUNoQixxQkFBcUI7WUFDckIsb0JBQW9CO1NBQ2pCOzRGQUlVLG9CQUFvQjtrQkFWaEMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQztvQkFDN0MsT0FBTyxFQUFFO3dCQUNQLFlBQVk7d0JBQ2hCLHFCQUFxQjt3QkFDckIsb0JBQW9CO3FCQUNqQjtvQkFDRCxPQUFPLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQztvQkFDeEMsT0FBTyxFQUFDLENBQUMsc0JBQXNCLENBQUM7aUJBQ2pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbEJ1dHRvbnNDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtY2FsbC1idXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMuY29tcG9uZW50XCI7XG5pbXBvcnQgeyBDb21ldENoYXRMaXN0IH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdExpc3QvY29tZXRjaGF0LWxpc3QubW9kdWxlXCI7XG5pbXBvcnQgIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0T3V0Z29pbmdDYWxsIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdE91dGdvaW5nQ2FsbC9jb21ldGNoYXQtb3V0Z29pbmctY2FsbC5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdE9uZ29pbmdDYWxsIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwubW9kdWxlXCI7XG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDb21ldENoYXRDYWxsQnV0dG9uc0NvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG5Db21ldENoYXRPdXRnb2luZ0NhbGwsXG5Db21ldENoYXRPbmdvaW5nQ2FsbFxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0Q2FsbEJ1dHRvbnNDb21wb25lbnRdLFxuICBzY2hlbWFzOltDVVNUT01fRUxFTUVOVFNfU0NIRU1BXVxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDYWxsQnV0dG9ucyB7fVxuIl19