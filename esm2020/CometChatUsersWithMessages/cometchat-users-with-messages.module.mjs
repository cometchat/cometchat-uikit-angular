import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUsersWithMessagesComponent } from "./cometchat-users-with-messages/cometchat-users-with-messages.component";
import { CometChatMessages } from "../CometChatMessages/cometchat-messages.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import * as i0 from "@angular/core";
export class CometChatUsersWithMessages {
}
CometChatUsersWithMessages.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersWithMessages, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatUsersWithMessages.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersWithMessages, declarations: [CometChatUsersWithMessagesComponent], imports: [CommonModule,
        CometChatUsers,
        CometChatMessages], exports: [CometChatUsersWithMessagesComponent] });
CometChatUsersWithMessages.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersWithMessages, imports: [[
            CommonModule,
            CometChatUsers,
            CometChatMessages,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsersWithMessages, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatUsersWithMessagesComponent],
                    imports: [
                        CommonModule,
                        CometChatUsers,
                        CometChatMessages,
                    ],
                    exports: [CometChatUsersWithMessagesComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLXdpdGgtbWVzc2FnZXMubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRVc2Vyc1dpdGhNZXNzYWdlcy9jb21ldGNoYXQtdXNlcnMtd2l0aC1tZXNzYWdlcy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLG1DQUFtQyxFQUFFLE1BQU0seUVBQXlFLENBQUM7QUFDOUgsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDbkYsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDBDQUEwQyxDQUFDOztBQVkxRSxNQUFNLE9BQU8sMEJBQTBCOzt3SEFBMUIsMEJBQTBCO3lIQUExQiwwQkFBMEIsaUJBVHRCLG1DQUFtQyxhQUVoRCxZQUFZO1FBQ1osY0FBYztRQUNkLGlCQUFpQixhQUVULG1DQUFtQzt5SEFHbEMsMEJBQTBCLFlBUjVCO1lBQ1AsWUFBWTtZQUNaLGNBQWM7WUFDZCxpQkFBaUI7U0FDbEI7NEZBSVUsMEJBQTBCO2tCQVZ0QyxRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLG1DQUFtQyxDQUFDO29CQUNuRCxPQUFPLEVBQUU7d0JBQ1AsWUFBWTt3QkFDWixjQUFjO3dCQUNkLGlCQUFpQjtxQkFDbEI7b0JBQ0QsT0FBTyxFQUFFLENBQUMsbUNBQW1DLENBQUM7b0JBQzlDLE9BQU8sRUFBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVzZXJzV2l0aE1lc3NhZ2VzQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tZXRjaGF0LXVzZXJzLXdpdGgtbWVzc2FnZXMvY29tZXRjaGF0LXVzZXJzLXdpdGgtbWVzc2FnZXMuY29tcG9uZW50XCI7XG5pbXBvcnQgeyBDb21ldENoYXRNZXNzYWdlcyB9IGZyb20gXCIuLi9Db21ldENoYXRNZXNzYWdlcy9jb21ldGNoYXQtbWVzc2FnZXMubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVc2VycyB9IGZyb20gXCIuLi9Db21ldENoYXRVc2Vycy9jb21ldGNoYXQtdXNlcnMubW9kdWxlXCI7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdFVzZXJzV2l0aE1lc3NhZ2VzQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgICBDb21ldENoYXRVc2VycyxcbiAgICBDb21ldENoYXRNZXNzYWdlcyxcbiAgXSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdFVzZXJzV2l0aE1lc3NhZ2VzQ29tcG9uZW50XSxcbiAgc2NoZW1hczpbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV1cbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0VXNlcnNXaXRoTWVzc2FnZXMge31cbiJdfQ==