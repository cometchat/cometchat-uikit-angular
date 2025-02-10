import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageHeaderComponent } from "./cometchat-message-header/cometchat-message-header.component";
import { DatePipe } from "@angular/common";
import '@cometchat/uikit-elements';
import * as i0 from "@angular/core";
export class CometChatMessageHeader {
}
CometChatMessageHeader.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageHeader, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CometChatMessageHeader.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageHeader, declarations: [CometChatMessageHeaderComponent], imports: [CommonModule], exports: [CometChatMessageHeaderComponent] });
CometChatMessageHeader.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageHeader, providers: [DatePipe], imports: [[
            CommonModule,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageHeader, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CometChatMessageHeaderComponent],
                    imports: [
                        CommonModule,
                    ],
                    exports: [CometChatMessageHeaderComponent],
                    providers: [DatePipe],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUhlYWRlci9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSwrQkFBK0IsRUFBRSxNQUFNLCtEQUErRCxDQUFDO0FBRWhILE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUUzQyxPQUFPLDJCQUEyQixDQUFBOztBQVdsQyxNQUFNLE9BQU8sc0JBQXNCOztvSEFBdEIsc0JBQXNCO3FIQUF0QixzQkFBc0IsaUJBVGxCLCtCQUErQixhQUU1QyxZQUFZLGFBR0osK0JBQStCO3FIQUk5QixzQkFBc0IsYUFIdEIsQ0FBQyxRQUFRLENBQUMsWUFMWjtZQUNQLFlBQVk7U0FFYjs0RkFLVSxzQkFBc0I7a0JBVmxDLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsK0JBQStCLENBQUM7b0JBQy9DLE9BQU8sRUFBRTt3QkFDUCxZQUFZO3FCQUViO29CQUNELE9BQU8sRUFBRSxDQUFDLCtCQUErQixDQUFDO29CQUMxQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUM7b0JBQ3JCLE9BQU8sRUFBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5nTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXJDb21wb25lbnQgfSBmcm9tIFwiLi9jb21ldGNoYXQtbWVzc2FnZS1oZWFkZXIvY29tZXRjaGF0LW1lc3NhZ2UtaGVhZGVyLmNvbXBvbmVudFwiO1xuXG5pbXBvcnQgeyBEYXRlUGlwZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcblxuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ29tZXRDaGF0TWVzc2FnZUhlYWRlckNvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG5cbiAgXSxcbiAgZXhwb3J0czogW0NvbWV0Q2hhdE1lc3NhZ2VIZWFkZXJDb21wb25lbnRdLFxuICBwcm92aWRlcnM6IFtEYXRlUGlwZV0sXG4gIHNjaGVtYXM6W0NVU1RPTV9FTEVNRU5UU19TQ0hFTUFdXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VIZWFkZXIge30iXX0=