import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallLogRecordingsComponent } from "./cometchat-call-log-recordings/cometchat-call-log-recordings.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import "@cometchat/uikit-elements";
import * as i0 from "@angular/core";
export class CometChatCallLogRecordings {
}
CometChatCallLogRecordings.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogRecordings, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatCallLogRecordings.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogRecordings, declarations: [CometChatCallLogRecordingsComponent], imports: [CommonModule, CometChatList], exports: [CometChatCallLogRecordingsComponent] });
CometChatCallLogRecordings.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogRecordings, imports: [[CommonModule, CometChatList]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogRecordings, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatCallLogRecordingsComponent],
                    imports: [CommonModule, CometChatList],
                    exports: [CometChatCallLogRecordingsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9nLXJlY29yZGluZ3MubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRDYWxsTG9nUmVjb3JkaW5ncy9jb21ldGNoYXQtY2FsbC1sb2ctcmVjb3JkaW5ncy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLG1DQUFtQyxFQUFFLE1BQU0seUVBQXlFLENBQUM7QUFFOUgsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQzFFLE9BQU8sMkJBQTJCLENBQUM7O0FBT25DLE1BQU0sT0FBTywwQkFBMEI7O3dIQUExQiwwQkFBMEI7eUhBQTFCLDBCQUEwQixpQkFMdEIsbUNBQW1DLGFBQ3hDLFlBQVksRUFBRSxhQUFhLGFBQzNCLG1DQUFtQzt5SEFHbEMsMEJBQTBCLFlBSjVCLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQzs0RkFJM0IsMEJBQTBCO2tCQU50QyxRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLG1DQUFtQyxDQUFDO29CQUNuRCxPQUFPLEVBQUUsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDO29CQUN0QyxPQUFPLEVBQUUsQ0FBQyxtQ0FBbUMsQ0FBQztvQkFDOUMsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUM7aUJBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbExvZ1JlY29yZGluZ3NDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtY2FsbC1sb2ctcmVjb3JkaW5ncy9jb21ldGNoYXQtY2FsbC1sb2ctcmVjb3JkaW5ncy5jb21wb25lbnRcIjtcblxuaW1wb3J0IHsgQ29tZXRDaGF0TGlzdCB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRMaXN0L2NvbWV0Y2hhdC1saXN0Lm1vZHVsZVwiO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0Q2FsbExvZ1JlY29yZGluZ3NDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlLCBDb21ldENoYXRMaXN0XSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdENhbGxMb2dSZWNvcmRpbmdzQ29tcG9uZW50XSxcbiAgc2NoZW1hczogW0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDYWxsTG9nUmVjb3JkaW5ncyB7fVxuIl19