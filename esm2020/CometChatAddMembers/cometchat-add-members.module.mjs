import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatAddMembersComponent } from "./cometchat-add-members/cometchat-add-members.component";
import { FormsModule } from "@angular/forms";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import '@cometchat/uikit-elements';
import * as i0 from "@angular/core";
export class CometChatAddMembers {
}
CometChatAddMembers.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembers, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatAddMembers.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembers, declarations: [CometChatAddMembersComponent], imports: [CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers], exports: [CometChatAddMembersComponent] });
CometChatAddMembers.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembers, imports: [[CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembers, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatAddMembersComponent],
                    imports: [CommonModule, FormsModule, CometChatMessageHeader, CometChatUsers],
                    exports: [CometChatAddMembersComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWFkZC1tZW1iZXJzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxNQUFNLHlEQUF5RCxDQUFDO0FBQ3ZHLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSwyREFBMkQsQ0FBQztBQUNuRyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDMUUsT0FBTywyQkFBMkIsQ0FBQTs7QUFPbEMsTUFBTSxPQUFPLG1CQUFtQjs7aUhBQW5CLG1CQUFtQjtrSEFBbkIsbUJBQW1CLGlCQUxmLDRCQUE0QixhQUNqQyxZQUFZLEVBQUMsV0FBVyxFQUFDLHNCQUFzQixFQUFDLGNBQWMsYUFDOUQsNEJBQTRCO2tIQUczQixtQkFBbUIsWUFKckIsQ0FBQyxZQUFZLEVBQUMsV0FBVyxFQUFDLHNCQUFzQixFQUFDLGNBQWMsQ0FBQzs0RkFJOUQsbUJBQW1CO2tCQU4vQixRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLDRCQUE0QixDQUFDO29CQUM1QyxPQUFPLEVBQUUsQ0FBQyxZQUFZLEVBQUMsV0FBVyxFQUFDLHNCQUFzQixFQUFDLGNBQWMsQ0FBQztvQkFDekUsT0FBTyxFQUFFLENBQUMsNEJBQTRCLENBQUM7b0JBQ3ZDLE9BQU8sRUFBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdEFkZE1lbWJlcnNDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgRm9ybXNNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvZm9ybXNcIjtcbmltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXIgfSBmcm9tIFwiLi4vQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVc2VycyB9IGZyb20gXCIuLi9Db21ldENoYXRVc2Vycy9jb21ldGNoYXQtdXNlcnMubW9kdWxlXCI7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDb21ldENoYXRBZGRNZW1iZXJzQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW0NvbW1vbk1vZHVsZSxGb3Jtc01vZHVsZSxDb21ldENoYXRNZXNzYWdlSGVhZGVyLENvbWV0Q2hhdFVzZXJzXSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdEFkZE1lbWJlcnNDb21wb25lbnRdLFxuICBzY2hlbWFzOltDVVNUT01fRUxFTUVOVFNfU0NIRU1BXVxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRBZGRNZW1iZXJzIHt9XG4iXX0=