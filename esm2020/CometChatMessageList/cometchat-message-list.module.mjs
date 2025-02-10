import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageListComponent } from "./cometchat-message-list/cometchat-message-list.component";
import { DatePipe } from "@angular/common";
import "@cometchat/uikit-elements";
import { CometChatMessageBubble } from "../CometChatMessageBubble/cometchat-message-bubble.module";
import { CometChatOngoingCall } from "../Calls/CometChatOngoingCall/cometchat-ongoing-call.module";
import { CometChatContacts } from "../CometChatContacts/cometchat-contacts.module";
import { CometChatMessageInformation } from "../CometChatMessageInformation/cometchat-message-information.module";
import * as i0 from "@angular/core";
export class CometChatMessageList {
}
CometChatMessageList.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageList, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatMessageList.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageList, declarations: [CometChatMessageListComponent], imports: [CommonModule,
        CometChatMessageBubble,
        CometChatOngoingCall,
        CometChatContacts,
        CometChatMessageInformation], exports: [CometChatMessageListComponent] });
CometChatMessageList.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageList, providers: [DatePipe], imports: [[
            CommonModule,
            CometChatMessageBubble,
            CometChatOngoingCall,
            CometChatContacts,
            CometChatMessageInformation,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageList, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatMessageListComponent],
                    imports: [
                        CommonModule,
                        CometChatMessageBubble,
                        CometChatOngoingCall,
                        CometChatContacts,
                        CometChatMessageInformation,
                    ],
                    exports: [CometChatMessageListComponent],
                    providers: [DatePipe],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxNQUFNLDJEQUEyRCxDQUFDO0FBQzFHLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUUzQyxPQUFPLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLDJEQUEyRCxDQUFDO0FBQ25HLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDZEQUE2RCxDQUFDO0FBQ25HLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGdEQUFnRCxDQUFDO0FBQ25GLE9BQU8sRUFBRSwyQkFBMkIsRUFBRSxNQUFNLHFFQUFxRSxDQUFDOztBQWNsSCxNQUFNLE9BQU8sb0JBQW9COztrSEFBcEIsb0JBQW9CO21IQUFwQixvQkFBb0IsaUJBWmhCLDZCQUE2QixhQUUxQyxZQUFZO1FBQ1osc0JBQXNCO1FBQ3RCLG9CQUFvQjtRQUNwQixpQkFBaUI7UUFDakIsMkJBQTJCLGFBRW5CLDZCQUE2QjttSEFJNUIsb0JBQW9CLGFBSHBCLENBQUMsUUFBUSxDQUFDLFlBUlo7WUFDUCxZQUFZO1lBQ1osc0JBQXNCO1lBQ3RCLG9CQUFvQjtZQUNwQixpQkFBaUI7WUFDakIsMkJBQTJCO1NBQzVCOzRGQUtVLG9CQUFvQjtrQkFiaEMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQztvQkFDN0MsT0FBTyxFQUFFO3dCQUNQLFlBQVk7d0JBQ1osc0JBQXNCO3dCQUN0QixvQkFBb0I7d0JBQ3BCLGlCQUFpQjt3QkFDakIsMkJBQTJCO3FCQUM1QjtvQkFDRCxPQUFPLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQztvQkFDeEMsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDO29CQUNyQixPQUFPLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztpQkFDbEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOZ01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29tbW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnRcIjtcbmltcG9ydCB7IERhdGVQaXBlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuXG5pbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgeyBDb21ldENoYXRNZXNzYWdlQnViYmxlIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdE1lc3NhZ2VCdWJibGUvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0T25nb2luZ0NhbGwgfSBmcm9tIFwiLi4vQ2FsbHMvQ29tZXRDaGF0T25nb2luZ0NhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdENvbnRhY3RzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdENvbnRhY3RzL2NvbWV0Y2hhdC1jb250YWN0cy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VJbmZvcm1hdGlvbiB9IGZyb20gXCIuLi9Db21ldENoYXRNZXNzYWdlSW5mb3JtYXRpb24vY29tZXRjaGF0LW1lc3NhZ2UtaW5mb3JtYXRpb24ubW9kdWxlXCI7XG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG4gICAgQ29tZXRDaGF0TWVzc2FnZUJ1YmJsZSxcbiAgICBDb21ldENoYXRPbmdvaW5nQ2FsbCxcbiAgICBDb21ldENoYXRDb250YWN0cyxcbiAgICBDb21ldENoYXRNZXNzYWdlSW5mb3JtYXRpb24sXG4gIF0sXG4gIGV4cG9ydHM6IFtDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudF0sXG4gIHByb3ZpZGVyczogW0RhdGVQaXBlXSxcbiAgc2NoZW1hczogW0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlTGlzdCB7fVxuIl19