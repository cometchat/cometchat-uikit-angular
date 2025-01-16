import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageComposerComponent } from "./cometchat-message-composer/cometchat-message-composer.component";
import "@cometchat/uikit-elements";
import { AIAssistBotMessageList } from "../Shared/Views/AIAssistBotMessageList/aiassist-bot-message-list.module";
import { CometChatUserMemberWrapper } from "../CometChatUserMemberWrapper/cometchat-user-member-wrapper.module";
import * as i0 from "@angular/core";
export class CometChatMessageComposer {
}
CometChatMessageComposer.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatMessageComposer, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatMessageComposer.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatMessageComposer, declarations: [CometChatMessageComposerComponent], imports: [CommonModule, AIAssistBotMessageList, CometChatUserMemberWrapper], exports: [CometChatMessageComposerComponent] });
CometChatMessageComposer.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatMessageComposer, imports: [[CommonModule, AIAssistBotMessageList, CometChatUserMemberWrapper]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatMessageComposer, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatMessageComposerComponent],
                    imports: [CommonModule, AIAssistBotMessageList, CometChatUserMemberWrapper],
                    exports: [CometChatMessageComposerComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxpQ0FBaUMsRUFBRSxNQUFNLG1FQUFtRSxDQUFDO0FBQ3RILE9BQU8sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0seUVBQXlFLENBQUM7QUFDakgsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sb0VBQW9FLENBQUM7O0FBT2hILE1BQU0sT0FBTyx3QkFBd0I7O3NIQUF4Qix3QkFBd0I7dUhBQXhCLHdCQUF3QixpQkFMcEIsaUNBQWlDLGFBQ3RDLFlBQVksRUFBRSxzQkFBc0IsRUFBRSwwQkFBMEIsYUFDaEUsaUNBQWlDO3VIQUdoQyx3QkFBd0IsWUFKMUIsQ0FBQyxZQUFZLEVBQUUsc0JBQXNCLEVBQUUsMEJBQTBCLENBQUM7NEZBSWhFLHdCQUF3QjtrQkFOcEMsUUFBUTttQkFBQztvQkFDUixZQUFZLEVBQUUsQ0FBQyxpQ0FBaUMsQ0FBQztvQkFDakQsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLHNCQUFzQixFQUFFLDBCQUEwQixDQUFDO29CQUMzRSxPQUFPLEVBQUUsQ0FBQyxpQ0FBaUMsQ0FBQztvQkFDNUMsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUM7aUJBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50XCI7XG5pbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgeyBBSUFzc2lzdEJvdE1lc3NhZ2VMaXN0IH0gZnJvbSBcIi4uL1NoYXJlZC9WaWV3cy9BSUFzc2lzdEJvdE1lc3NhZ2VMaXN0L2FpYXNzaXN0LWJvdC1tZXNzYWdlLWxpc3QubW9kdWxlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVc2VyTWVtYmVyV3JhcHBlciB9IGZyb20gXCIuLi9Db21ldENoYXRVc2VyTWVtYmVyV3JhcHBlci9jb21ldGNoYXQtdXNlci1tZW1iZXItd3JhcHBlci5tb2R1bGVcIjtcbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0NvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckNvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtDb21tb25Nb2R1bGUsIEFJQXNzaXN0Qm90TWVzc2FnZUxpc3QsIENvbWV0Q2hhdFVzZXJNZW1iZXJXcmFwcGVyXSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckNvbXBvbmVudF0sXG4gIHNjaGVtYXM6IFtDVVNUT01fRUxFTUVOVFNfU0NIRU1BXSxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyIHt9XG4iXX0=