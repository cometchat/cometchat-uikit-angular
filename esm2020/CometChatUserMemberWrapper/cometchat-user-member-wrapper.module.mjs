import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import "@cometchat/uikit-elements";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import { CometChatUserMemberWrapperComponent } from "./cometchat-user-member-wrapper.component";
import { CometChatGroupMembers } from "../CometChatGroupMembers/cometchat-group-members.module";
import * as i0 from "@angular/core";
export class CometChatUserMemberWrapper {
}
CometChatUserMemberWrapper.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatUserMemberWrapper, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatUserMemberWrapper.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatUserMemberWrapper, declarations: [CometChatUserMemberWrapperComponent], imports: [CommonModule, CometChatUsers, CometChatGroupMembers], exports: [CometChatUserMemberWrapperComponent] });
CometChatUserMemberWrapper.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatUserMemberWrapper, imports: [[CommonModule, CometChatUsers, CometChatGroupMembers]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatUserMemberWrapper, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatUserMemberWrapperComponent],
                    imports: [CommonModule, CometChatUsers, CometChatGroupMembers],
                    exports: [CometChatUserMemberWrapperComponent],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXIubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRVc2VyTWVtYmVyV3JhcHBlci9jb21ldGNoYXQtdXNlci1tZW1iZXItd3JhcHBlci5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUEwQixRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxtQ0FBbUMsRUFBRSxNQUFNLDJDQUEyQyxDQUFBO0FBQy9GLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHlEQUF5RCxDQUFDOztBQU1oRyxNQUFNLE9BQU8sMEJBQTBCOzt3SEFBMUIsMEJBQTBCO3lIQUExQiwwQkFBMEIsaUJBSnRCLG1DQUFtQyxhQUN4QyxZQUFZLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixhQUNuRCxtQ0FBbUM7eUhBRWxDLDBCQUEwQixZQUg1QixDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUscUJBQXFCLENBQUM7NEZBR25ELDBCQUEwQjtrQkFMdEMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQyxtQ0FBbUMsQ0FBQztvQkFDbkQsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsQ0FBQztvQkFDOUQsT0FBTyxFQUFFLENBQUMsbUNBQW1DLENBQUM7aUJBQy9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VXNlcnMgfSBmcm9tIFwiLi4vQ29tZXRDaGF0VXNlcnMvY29tZXRjaGF0LXVzZXJzLm1vZHVsZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VXNlck1lbWJlcldyYXBwZXJDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtdXNlci1tZW1iZXItd3JhcHBlci5jb21wb25lbnRcIlxuaW1wb3J0IHsgQ29tZXRDaGF0R3JvdXBNZW1iZXJzIH0gZnJvbSBcIi4uL0NvbWV0Q2hhdEdyb3VwTWVtYmVycy9jb21ldGNoYXQtZ3JvdXAtbWVtYmVycy5tb2R1bGVcIjtcbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdFVzZXJNZW1iZXJXcmFwcGVyQ29tcG9uZW50XSxcbiAgaW1wb3J0czogW0NvbW1vbk1vZHVsZSwgQ29tZXRDaGF0VXNlcnMsIENvbWV0Q2hhdEdyb3VwTWVtYmVyc10sXG4gIGV4cG9ydHM6IFtDb21ldENoYXRVc2VyTWVtYmVyV3JhcHBlckNvbXBvbmVudF0sXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdFVzZXJNZW1iZXJXcmFwcGVyIHt9XG4iXX0=