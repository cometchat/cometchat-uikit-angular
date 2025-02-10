import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallLogParticipantsComponent } from "./cometchat-call-log-participants/cometchat-call-log-participants.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import "@cometchat/uikit-elements";
import * as i0 from "@angular/core";
export class CometChatCallLogParticipants {
}
CometChatCallLogParticipants.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogParticipants, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatCallLogParticipants.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogParticipants, declarations: [CometChatCallLogParticipantsComponent], imports: [CommonModule, CometChatList], exports: [CometChatCallLogParticipantsComponent] });
CometChatCallLogParticipants.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogParticipants, imports: [[CommonModule, CometChatList]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogParticipants, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatCallLogParticipantsComponent],
                    imports: [CommonModule, CometChatList],
                    exports: [CometChatCallLogParticipantsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dQYXJ0aWNpcGFudHMvY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLHFDQUFxQyxFQUFFLE1BQU0sNkVBQTZFLENBQUM7QUFFcEksT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQzFFLE9BQU8sMkJBQTJCLENBQUM7O0FBT25DLE1BQU0sT0FBTyw0QkFBNEI7OzBIQUE1Qiw0QkFBNEI7MkhBQTVCLDRCQUE0QixpQkFMeEIscUNBQXFDLGFBQzFDLFlBQVksRUFBRSxhQUFhLGFBQzNCLHFDQUFxQzsySEFHcEMsNEJBQTRCLFlBSjlCLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQzs0RkFJM0IsNEJBQTRCO2tCQU54QyxRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLHFDQUFxQyxDQUFDO29CQUNyRCxPQUFPLEVBQUUsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDO29CQUN0QyxPQUFPLEVBQUUsQ0FBQyxxQ0FBcUMsQ0FBQztvQkFDaEQsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUM7aUJBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbExvZ1BhcnRpY2lwYW50c0NvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1jYWxsLWxvZy1wYXJ0aWNpcGFudHMvY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy5jb21wb25lbnRcIjtcblxuaW1wb3J0IHsgQ29tZXRDaGF0TGlzdCB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRMaXN0L2NvbWV0Y2hhdC1saXN0Lm1vZHVsZVwiO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0Q2FsbExvZ1BhcnRpY2lwYW50c0NvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtDb21tb25Nb2R1bGUsIENvbWV0Q2hhdExpc3RdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0Q2FsbExvZ1BhcnRpY2lwYW50c0NvbXBvbmVudF0sXG4gIHNjaGVtYXM6IFtDVVNUT01fRUxFTUVOVFNfU0NIRU1BXSxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0Q2FsbExvZ1BhcnRpY2lwYW50cyB7fVxuIl19