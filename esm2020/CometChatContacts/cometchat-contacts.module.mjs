import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatContactsComponent } from "./cometchat-contacts/cometchat-contacts.component";
import { FormsModule } from "@angular/forms";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import { CometChatTabs } from "../Shared/Views/CometChatTabs/cometchat-tabs.module";
import { CometChatGroups } from "../CometChatGroups/cometchat-groups.module";
import * as i0 from "@angular/core";
export class CometChatContacts {
}
CometChatContacts.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContacts, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatContacts.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContacts, declarations: [CometChatContactsComponent], imports: [CommonModule, FormsModule, CometChatUsers, CometChatTabs, CometChatGroups], exports: [CometChatContactsComponent] });
CometChatContacts.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContacts, imports: [[CommonModule, FormsModule, CometChatUsers, CometChatTabs, CometChatGroups]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContacts, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatContactsComponent],
                    imports: [CommonModule, FormsModule, CometChatUsers, CometChatTabs, CometChatGroups],
                    exports: [CometChatContactsComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnRhY3RzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udGFjdHMvY29tZXRjaGF0LWNvbnRhY3RzLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxtREFBbUQsQ0FBQztBQUMvRixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxxREFBcUQsQ0FBQztBQUNwRixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sNENBQTRDLENBQUM7O0FBTzdFLE1BQU0sT0FBTyxpQkFBaUI7OytHQUFqQixpQkFBaUI7Z0hBQWpCLGlCQUFpQixpQkFMYiwwQkFBMEIsYUFDL0IsWUFBWSxFQUFDLFdBQVcsRUFBQyxjQUFjLEVBQUMsYUFBYSxFQUFDLGVBQWUsYUFDckUsMEJBQTBCO2dIQUd6QixpQkFBaUIsWUFKbkIsQ0FBQyxZQUFZLEVBQUMsV0FBVyxFQUFDLGNBQWMsRUFBQyxhQUFhLEVBQUMsZUFBZSxDQUFDOzRGQUlyRSxpQkFBaUI7a0JBTjdCLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsMEJBQTBCLENBQUM7b0JBQzFDLE9BQU8sRUFBRSxDQUFDLFlBQVksRUFBQyxXQUFXLEVBQUMsY0FBYyxFQUFDLGFBQWEsRUFBQyxlQUFlLENBQUM7b0JBQ2hGLE9BQU8sRUFBRSxDQUFDLDBCQUEwQixDQUFDO29CQUNyQyxPQUFPLEVBQUMsQ0FBQyxzQkFBc0IsQ0FBQztpQkFDakMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOZ01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29tbW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRDb250YWN0c0NvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1jb250YWN0cy9jb21ldGNoYXQtY29udGFjdHMuY29tcG9uZW50XCI7XG5pbXBvcnQgeyBGb3Jtc01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9mb3Jtc1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VXNlcnMgfSBmcm9tIFwiLi4vQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGFicyB9IGZyb20gXCIuLi9TaGFyZWQvVmlld3MvQ29tZXRDaGF0VGFicy9jb21ldGNoYXQtdGFicy5tb2R1bGVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEdyb3VwcyB9IGZyb20gXCIuLi9Db21ldENoYXRHcm91cHMvY29tZXRjaGF0LWdyb3Vwcy5tb2R1bGVcIjtcbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdENvbnRhY3RzQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW0NvbW1vbk1vZHVsZSxGb3Jtc01vZHVsZSxDb21ldENoYXRVc2VycyxDb21ldENoYXRUYWJzLENvbWV0Q2hhdEdyb3Vwc10sXG4gIGV4cG9ydHM6IFtDb21ldENoYXRDb250YWN0c0NvbXBvbmVudF0sXG4gIHNjaGVtYXM6W0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENvbnRhY3RzIHt9XG4iXX0=