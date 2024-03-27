import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUsersComponent } from "./cometchat-users/cometchat-users.component";
import { FormsModule } from "@angular/forms";
import '@cometchat/uikit-elements';
import { CometChatList } from "../CometChatList/cometchat-list.module";
import * as i0 from "@angular/core";
export class CometChatUsers {
}
CometChatUsers.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsers, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatUsers.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsers, declarations: [CometChatUsersComponent], imports: [CommonModule,
        FormsModule,
        CometChatList], exports: [CometChatUsersComponent] });
CometChatUsers.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsers, imports: [[
            CommonModule,
            FormsModule,
            CometChatList
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUsers, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatUsersComponent],
                    imports: [
                        CommonModule,
                        FormsModule,
                        CometChatList
                    ],
                    exports: [CometChatUsersComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXJzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUN0RixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sd0NBQXdDLENBQUM7O0FBV3ZFLE1BQU0sT0FBTyxjQUFjOzs0R0FBZCxjQUFjOzZHQUFkLGNBQWMsaUJBVFYsdUJBQXVCLGFBRXBDLFlBQVk7UUFDWixXQUFXO1FBQ1gsYUFBYSxhQUVMLHVCQUF1Qjs2R0FHdEIsY0FBYyxZQVJoQjtZQUNQLFlBQVk7WUFDWixXQUFXO1lBQ1gsYUFBYTtTQUNkOzRGQUlVLGNBQWM7a0JBVjFCLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsdUJBQXVCLENBQUM7b0JBQ3ZDLE9BQU8sRUFBRTt3QkFDUCxZQUFZO3dCQUNaLFdBQVc7d0JBQ1gsYUFBYTtxQkFDZDtvQkFDRCxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDbEMsT0FBTyxFQUFDLENBQUMsc0JBQXNCLENBQUM7aUJBQ2pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VXNlcnNDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtdXNlcnMvY29tZXRjaGF0LXVzZXJzLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgRm9ybXNNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvZm9ybXNcIjtcbmltcG9ydCAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdExpc3QgfSBmcm9tIFwiLi4vQ29tZXRDaGF0TGlzdC9jb21ldGNoYXQtbGlzdC5tb2R1bGVcIjtcbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdFVzZXJzQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgICBGb3Jtc01vZHVsZSxcbiAgICBDb21ldENoYXRMaXN0XG4gIF0sXG4gIGV4cG9ydHM6IFtDb21ldENoYXRVc2Vyc0NvbXBvbmVudF0sXG4gIHNjaGVtYXM6W0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdFVzZXJzIHt9XG4iXX0=