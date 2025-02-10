import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageInformationComponent } from "./cometchat-message-information/cometchat-message-information.component";
import '@cometchat/uikit-elements';
import { CometChatList } from "../CometChatList/cometchat-list.module";
import * as i0 from "@angular/core";
export class CometChatMessageInformation {
}
CometChatMessageInformation.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageInformation, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatMessageInformation.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageInformation, declarations: [CometChatMessageInformationComponent], imports: [CommonModule,
        CometChatList], exports: [CometChatMessageInformationComponent] });
CometChatMessageInformation.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageInformation, imports: [[
            CommonModule,
            CometChatList
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageInformation, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatMessageInformationComponent],
                    imports: [
                        CommonModule,
                        CometChatList
                    ],
                    exports: [CometChatMessageInformationComponent],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaW5mb3JtYXRpb24ubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlSW5mb3JtYXRpb24vY29tZXRjaGF0LW1lc3NhZ2UtaW5mb3JtYXRpb24ubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxNQUFNLHlFQUF5RSxDQUFDO0FBRS9ILE9BQU8sMkJBQTJCLENBQUE7QUFDbEMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHdDQUF3QyxDQUFDOztBQVd2RSxNQUFNLE9BQU8sMkJBQTJCOzt5SEFBM0IsMkJBQTJCOzBIQUEzQiwyQkFBMkIsaUJBVHZCLG9DQUFvQyxhQUVqRCxZQUFZO1FBQ1osYUFBYSxhQUdMLG9DQUFvQzswSEFHbkMsMkJBQTJCLFlBUjdCO1lBQ1AsWUFBWTtZQUNaLGFBQWE7U0FFZDs0RkFJVSwyQkFBMkI7a0JBVnZDLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsb0NBQW9DLENBQUM7b0JBQ3BELE9BQU8sRUFBRTt3QkFDUCxZQUFZO3dCQUNaLGFBQWE7cUJBRWQ7b0JBQ0QsT0FBTyxFQUFFLENBQUMsb0NBQW9DLENBQUM7b0JBQy9DLE9BQU8sRUFBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VJbmZvcm1hdGlvbkNvbXBvbmVudCB9IGZyb20gXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWluZm9ybWF0aW9uL2NvbWV0Y2hhdC1tZXNzYWdlLWluZm9ybWF0aW9uLmNvbXBvbmVudFwiO1xuXG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBDb21ldENoYXRMaXN0IH0gZnJvbSBcIi4uL0NvbWV0Q2hhdExpc3QvY29tZXRjaGF0LWxpc3QubW9kdWxlXCI7XG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDb21ldENoYXRNZXNzYWdlSW5mb3JtYXRpb25Db21wb25lbnRdLFxuICBpbXBvcnRzOiBbXG4gICAgQ29tbW9uTW9kdWxlLFxuICAgIENvbWV0Q2hhdExpc3RcblxuICBdLFxuICBleHBvcnRzOiBbQ29tZXRDaGF0TWVzc2FnZUluZm9ybWF0aW9uQ29tcG9uZW50XSxcbiAgc2NoZW1hczpbQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQV1cbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0TWVzc2FnZUluZm9ybWF0aW9uIHt9Il19