import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatThreadedMessagesComponent } from "./cometchat-threaded-messages/cometchat-threaded-messages.component";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatMessageList } from "../CometChatMessageList/cometchat-message-list.module";
import { CometChatMessageComposer } from "../CometChatMessageComposer/cometchat-message-composer.module";
import '@cometchat/uikit-elements';
import * as i0 from "@angular/core";
export class CometChatThreadedMessages {
}
CometChatThreadedMessages.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatThreadedMessages, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatThreadedMessages.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatThreadedMessages, declarations: [CometChatThreadedMessagesComponent], imports: [CommonModule,
        CometChatMessageHeader,
        CometChatMessageList,
        CometChatMessageComposer], exports: [CometChatThreadedMessagesComponent] });
CometChatThreadedMessages.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatThreadedMessages, imports: [[
            CommonModule,
            CometChatMessageHeader,
            CometChatMessageList,
            CometChatMessageComposer,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatThreadedMessages, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatThreadedMessagesComponent],
                    imports: [
                        CommonModule,
                        CometChatMessageHeader,
                        CometChatMessageList,
                        CometChatMessageComposer,
                    ],
                    exports: [CometChatThreadedMessagesComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXRocmVhZGVkLW1lc3NhZ2VzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VGhyZWFkZWRNZXNzYWdlcy9jb21ldGNoYXQtdGhyZWFkZWQtbWVzc2FnZXMubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxrQ0FBa0MsRUFBRSxNQUFNLHFFQUFxRSxDQUFDO0FBQ3pILE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLDJEQUEyRCxDQUFDO0FBQ25HLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHVEQUF1RCxDQUFDO0FBQzdGLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLCtEQUErRCxDQUFDO0FBQ3pHLE9BQU8sMkJBQTJCLENBQUE7O0FBYWxDLE1BQU0sT0FBTyx5QkFBeUI7O3VIQUF6Qix5QkFBeUI7d0hBQXpCLHlCQUF5QixpQkFWckIsa0NBQWtDLGFBRS9DLFlBQVk7UUFDYixzQkFBc0I7UUFDdEIsb0JBQW9CO1FBQ3BCLHdCQUF3QixhQUVmLGtDQUFrQzt3SEFHakMseUJBQXlCLFlBVDNCO1lBQ1AsWUFBWTtZQUNiLHNCQUFzQjtZQUN0QixvQkFBb0I7WUFDcEIsd0JBQXdCO1NBQ3hCOzRGQUlVLHlCQUF5QjtrQkFYckMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQyxrQ0FBa0MsQ0FBQztvQkFDbEQsT0FBTyxFQUFFO3dCQUNQLFlBQVk7d0JBQ2Isc0JBQXNCO3dCQUN0QixvQkFBb0I7d0JBQ3BCLHdCQUF3QjtxQkFDeEI7b0JBQ0QsT0FBTyxFQUFFLENBQUMsa0NBQWtDLENBQUM7b0JBQzdDLE9BQU8sRUFBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRocmVhZGVkTWVzc2FnZXNDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtdGhyZWFkZWQtbWVzc2FnZXMvY29tZXRjaGF0LXRocmVhZGVkLW1lc3NhZ2VzLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZUhlYWRlciB9IGZyb20gXCIuLi9Db21ldENoYXRNZXNzYWdlSGVhZGVyL2NvbWV0Y2hhdC1tZXNzYWdlLWhlYWRlci5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VMaXN0IH0gZnJvbSBcIi4uL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXIgfSBmcm9tIFwiLi4vQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyL2NvbWV0Y2hhdC1tZXNzYWdlLWNvbXBvc2VyLm1vZHVsZVwiO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDb21ldENoYXRUaHJlYWRlZE1lc3NhZ2VzQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXIsXG4gICBDb21ldENoYXRNZXNzYWdlTGlzdCxcbiAgIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlcixcbiAgXSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdFRocmVhZGVkTWVzc2FnZXNDb21wb25lbnRdLFxuICBzY2hlbWFzOltDVVNUT01fRUxFTUVOVFNfU0NIRU1BXVxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRUaHJlYWRlZE1lc3NhZ2VzIHt9XG4iXX0=