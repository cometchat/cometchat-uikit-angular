import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallLogHistoryComponent } from "./cometchat-call-log-history/cometchat-call-log-history.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import "@cometchat/uikit-elements";
import * as i0 from "@angular/core";
export class CometChatCallLogHistory {
}
CometChatCallLogHistory.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogHistory, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatCallLogHistory.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogHistory, declarations: [CometChatCallLogHistoryComponent], imports: [CommonModule, CometChatList], exports: [CometChatCallLogHistoryComponent] });
CometChatCallLogHistory.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogHistory, imports: [[CommonModule, CometChatList]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogHistory, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatCallLogHistoryComponent],
                    imports: [CommonModule, CometChatList],
                    exports: [CometChatCallLogHistoryComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9nLWhpc3RvcnkubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRDYWxsTG9nSGlzdG9yeS9jb21ldGNoYXQtY2FsbC1sb2ctaGlzdG9yeS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLE1BQU0sbUVBQW1FLENBQUM7QUFFckgsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQzFFLE9BQU8sMkJBQTJCLENBQUM7O0FBT25DLE1BQU0sT0FBTyx1QkFBdUI7O3FIQUF2Qix1QkFBdUI7c0hBQXZCLHVCQUF1QixpQkFMbkIsZ0NBQWdDLGFBQ3JDLFlBQVksRUFBRSxhQUFhLGFBQzNCLGdDQUFnQztzSEFHL0IsdUJBQXVCLFlBSnpCLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQzs0RkFJM0IsdUJBQXVCO2tCQU5uQyxRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLGdDQUFnQyxDQUFDO29CQUNoRCxPQUFPLEVBQUUsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDO29CQUN0QyxPQUFPLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQztvQkFDM0MsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUM7aUJBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbExvZ0hpc3RvcnlDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtY2FsbC1sb2ctaGlzdG9yeS9jb21ldGNoYXQtY2FsbC1sb2ctaGlzdG9yeS5jb21wb25lbnRcIjtcblxuaW1wb3J0IHsgQ29tZXRDaGF0TGlzdCB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRMaXN0L2NvbWV0Y2hhdC1saXN0Lm1vZHVsZVwiO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0Q2FsbExvZ0hpc3RvcnlDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlLCBDb21ldENoYXRMaXN0XSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdENhbGxMb2dIaXN0b3J5Q29tcG9uZW50XSxcbiAgc2NoZW1hczogW0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDYWxsTG9nSGlzdG9yeSB7fVxuIl19