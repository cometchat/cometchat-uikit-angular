import { Component, Input, ViewChild } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import "@cometchat/uikit-elements";
import '@cometchat/uikit-shared';
import { CometChatCallEvents, CallWorkflow, localize, CometChatUIKitConstants } from '@cometchat/uikit-resources';
import { CometChatUIKitCalls, StorageUtils } from '@cometchat/uikit-shared';
import { CallscreenStyle } from '@cometchat/uikit-elements';
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "@angular/common";
/**
*
* CometChatOngoingCallComponent is a component whic shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatOngoingCallComponent {
    constructor(themeService) {
        this.themeService = themeService;
        this.ongoingCallStyle = {
            maxHeight: "100%",
            maxWidth: "100%",
            border: "none",
            borderRadius: "0",
            background: "#1c2226",
            minHeight: "400px",
            minWidth: "400px",
        };
        this.resizeIconHoverText = localize("RESIZE");
        this.sessionID = "";
        this.minimizeIconURL = "assets/reduce-size.svg";
        this.maximizeIconURL = "assets/increase-size.svg";
        this.callWorkflow = CallWorkflow.directCalling;
        this.onError = (error) => {
            console.log(error);
        };
        this.getCallBuilder = () => {
            if (this.callSettingsBuilder) {
                return this.callSettingsBuilder;
            }
            else {
                const callSettings = new CometChatUIKitCalls.CallSettingsBuilder()
                    .enableDefaultLayout(true)
                    .setIsAudioOnlyCall(false)
                    .setCallListener(new CometChatUIKitCalls.OngoingCallListener({
                    onCallEnded: () => {
                        StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
                        CometChatUIKitCalls.endSession();
                        if (this.callWorkflow == CallWorkflow.defaultCalling) {
                            CometChatUIKitCalls.endCall();
                            CometChat.clearActiveCall();
                            CometChatCallEvents.ccCallEnded.next({});
                        }
                    },
                    onCallEndButtonPressed: () => {
                        StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
                        if (this.callWorkflow == CallWorkflow.defaultCalling) {
                            CometChat.endCall(this.sessionID).then((call) => {
                                CometChatUIKitCalls.endSession();
                                CometChatCallEvents.ccCallEnded.next(call);
                            })
                                .catch((error) => {
                                if (this.onError) {
                                    this.onError(error);
                                }
                            });
                        }
                        else {
                            CometChatCallEvents.ccCallEnded.next({});
                            CometChatUIKitCalls.endSession();
                        }
                    },
                    onError: (error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                    },
                }))
                    .build();
                return callSettings;
            }
        };
        this.startCall = () => {
            if (this.loggedInUser) {
                const authToken = this.loggedInUser.getAuthToken();
                const sessionID = this.sessionID;
                CometChatUIKitCalls.generateToken(sessionID, authToken).then((res) => {
                    CometChatUIKitCalls.startSession(res?.token, this.getCallBuilder(), this.callScreenFrame.nativeElement)
                        .catch((error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                    });
                }, (err) => {
                    if (this.onError) {
                        this.onError(err);
                    }
                })
                    .catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            }
            else {
                CometChat.getLoggedinUser().then((user) => {
                    const authToken = user.getAuthToken();
                    const sessionID = this.sessionID;
                    CometChatUIKitCalls.generateToken(sessionID, authToken).then((res) => {
                        CometChatUIKitCalls.startSession(res?.token, this.getCallBuilder(), this.callScreenFrame.nativeElement);
                    }, (error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                    })
                        .catch((error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                    });
                });
            }
        };
    }
    ngOnInit() {
        this.setongoingCallStyle();
    }
    ngOnChanges(changes) {
        if (changes["sessionID"] && changes["sessionID"].currentValue) {
            this.startCall();
        }
    }
    setongoingCallStyle() {
        let defaultStyle = new CallscreenStyle({
            maxHeight: "100%",
            maxWidth: "100%",
            border: "none",
            borderRadius: "0",
            background: "#1c2226",
            minHeight: "400px",
            minWidth: "400px",
            minimizeIconTint: this.themeService.theme.palette.getAccent("dark"),
            maximizeIconTint: this.themeService.theme.palette.getAccent("dark"),
        });
        this.ongoingCallStyle = { ...defaultStyle, ...this.ongoingCallStyle };
    }
}
CometChatOngoingCallComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOngoingCallComponent, deps: [{ token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatOngoingCallComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: { ongoingCallStyle: "ongoingCallStyle", resizeIconHoverText: "resizeIconHoverText", sessionID: "sessionID", minimizeIconURL: "minimizeIconURL", maximizeIconURL: "maximizeIconURL", callSettingsBuilder: "callSettingsBuilder", callWorkflow: "callWorkflow", onError: "onError" }, viewQueries: [{ propertyName: "callScreenFrame", first: true, predicate: ["callscreenView"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<cometchat-callscreen-wrapper *ngIf=\"sessionID\" [callscreenStyle]=\"ongoingCallStyle\" [resizeIconHoverText]=\"resizeIconHoverText\"  [minimizeIconURL]=\"minimizeIconURL\" [maximizeIconURL]=\"maximizeIconURL\">\n    <div #callscreenView class=\"cc-callscreen__view\"></div>\n</cometchat-callscreen-wrapper>\n", styles: [".cc-callscreen__view{height:100%;width:100%}\n"], directives: [{ type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOngoingCallComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-ongoing-call", template: "<cometchat-callscreen-wrapper *ngIf=\"sessionID\" [callscreenStyle]=\"ongoingCallStyle\" [resizeIconHoverText]=\"resizeIconHoverText\"  [minimizeIconURL]=\"minimizeIconURL\" [maximizeIconURL]=\"maximizeIconURL\">\n    <div #callscreenView class=\"cc-callscreen__view\"></div>\n</cometchat-callscreen-wrapper>\n", styles: [".cc-callscreen__view{height:100%;width:100%}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CometChatThemeService }]; }, propDecorators: { callScreenFrame: [{
                type: ViewChild,
                args: ["callscreenView", { static: false }]
            }], ongoingCallStyle: [{
                type: Input
            }], resizeIconHoverText: [{
                type: Input
            }], sessionID: [{
                type: Input
            }], minimizeIconURL: [{
                type: Input
            }], maximizeIconURL: [{
                type: Input
            }], callSettingsBuilder: [{
                type: Input
            }], callWorkflow: [{
                type: Input
            }], onError: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQThDLFNBQVMsRUFBYyxLQUFLLEVBQWlELFNBQVMsRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDdEwsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyx5QkFBeUIsQ0FBQTtBQUNoQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ2xILE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUU1RSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7Ozs7QUFFM0Q7Ozs7Ozs7O0VBUUU7QUFNRixNQUFNLE9BQU8sNkJBQTZCO0lBd0J6QyxZQUFvQixZQUFtQztRQUFuQyxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUF0QjlDLHFCQUFnQixHQUFvQjtZQUM1QyxTQUFTLEVBQUUsTUFBTTtZQUNqQixRQUFRLEVBQUUsTUFBTTtZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFB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QUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUNuRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztTQUNuRSxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0lBQ3RFLENBQUM7OzJIQXZKVyw2QkFBNkI7K0dBQTdCLDZCQUE2QixrZUN4QjFDLHdUQUdBOzRGRHFCYSw2QkFBNkI7a0JBTHpDLFNBQVM7K0JBQ0Msd0JBQXdCOzRHQUtjLGVBQWU7c0JBQTlELFNBQVM7dUJBQUMsZ0JBQWdCLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUNyQyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBU0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIEVsZW1lbnRSZWYsIElucHV0LCBPbkNoYW5nZXMsIE9uSW5pdCwgU2ltcGxlQ2hhbmdlcywgVGVtcGxhdGVSZWYsIFZpZXdDaGlsZCwgVmlld0VuY2Fwc3VsYXRpb24gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gJ0Bjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdCc7XG5pbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJ1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbEV2ZW50cywgQ2FsbFdvcmtmbG93LCBsb2NhbGl6ZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcyc7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdENhbGxzLCBTdG9yYWdlVXRpbHMgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCc7XG5cbmltcG9ydCB7IENhbGxzY3JlZW5TdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbi8qKlxuKlxuKiBDb21ldENoYXRPbmdvaW5nQ2FsbENvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB3aGljIHNob3dzIG91dGdvaW5nIGNhbGwgc2NyZWVuIGZvciBkZWZhdWx0IGF1ZGlvIGFuZCB2aWRlbyBjYWxsLlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG5cdHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1vbmdvaW5nLWNhbGxcIixcblx0dGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtb25nb2luZy1jYWxsLmNvbXBvbmVudC5odG1sXCIsXG5cdHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtb25nb2luZy1jYWxsLmNvbXBvbmVudC5zY3NzXCJdLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRPbmdvaW5nQ2FsbENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcblx0QFZpZXdDaGlsZChcImNhbGxzY3JlZW5WaWV3XCIsIHsgc3RhdGljOiBmYWxzZSB9KSBjYWxsU2NyZWVuRnJhbWUhOiBFbGVtZW50UmVmO1xuXHRASW5wdXQoKSBvbmdvaW5nQ2FsbFN0eWxlOiBDYWxsc2NyZWVuU3R5bGUgPSB7XG5cdFx0bWF4SGVpZ2h0OiBcIjEwMCVcIixcblx0XHRtYXhXaWR0aDogXCIxMDAlXCIsXG5cdFx0Ym9yZGVyOiBcIm5vbmVcIixcblx0XHRib3JkZXJSYWRpdXM6IFwiMFwiLFxuXHRcdGJhY2tncm91bmQ6IFwiIzFjMjIyNlwiLFxuXHRcdG1pbkhlaWdodDogXCI0MDBweFwiLFxuXHRcdG1pbldpZHRoOiBcIjQwMHB4XCIsXG5cdH1cblx0QElucHV0KCkgcmVzaXplSWNvbkhvdmVyVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJSRVNJWkVcIilcblx0QElucHV0KCkgc2Vzc2lvbklEOiBzdHJpbmcgPSBcIlwiXG5cdEBJbnB1dCgpIG1pbmltaXplSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvcmVkdWNlLXNpemUuc3ZnXCJcblx0QElucHV0KCkgbWF4aW1pemVJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9pbmNyZWFzZS1zaXplLnN2Z1wiXG5cdEBJbnB1dCgpIGNhbGxTZXR0aW5nc0J1aWxkZXIhOiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyO1xuXHRASW5wdXQoKSBjYWxsV29ya2Zsb3c6IENhbGxXb3JrZmxvdyA9IENhbGxXb3JrZmxvdy5kaXJlY3RDYWxsaW5nO1xuXHRASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcblx0XHRjb25zb2xlLmxvZyhlcnJvcilcblx0fVxuXHRwdWJsaWMgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXI7XG5cdG5nT25Jbml0KCk6IHZvaWQge1xuXHRcdHRoaXMuc2V0b25nb2luZ0NhbGxTdHlsZSgpXG5cdH1cblx0Y29uc3RydWN0b3IocHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkge1xuXHR9XG5cdG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcblx0XHRpZiAoY2hhbmdlc1tcInNlc3Npb25JRFwiXSAmJiBjaGFuZ2VzW1wic2Vzc2lvbklEXCJdLmN1cnJlbnRWYWx1ZSkge1xuXHRcdFx0dGhpcy5zdGFydENhbGwoKVxuXHRcdH1cblx0fVxuXHRnZXRDYWxsQnVpbGRlciA9ICgpOiBhbnkgPT4ge1xuXHRcdGlmICh0aGlzLmNhbGxTZXR0aW5nc0J1aWxkZXIpIHtcblx0XHRcdHJldHVybiB0aGlzLmNhbGxTZXR0aW5nc0J1aWxkZXJcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjb25zdCBjYWxsU2V0dGluZ3M6IGFueSA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuXHRcdFx0XHQuZW5hYmxlRGVmYXVsdExheW91dCh0cnVlKVxuXHRcdFx0XHQuc2V0SXNBdWRpb09ubHlDYWxsKGZhbHNlKVxuXHRcdFx0XHQuc2V0Q2FsbExpc3RlbmVyKFxuXHRcdFx0XHRcdG5ldyBDb21ldENoYXRVSUtpdENhbGxzLk9uZ29pbmdDYWxsTGlzdGVuZXIoe1xuXHRcdFx0XHRcdFx0b25DYWxsRW5kZWQ6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0U3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG5cblx0XHRcdFx0XHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKClcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuY2FsbFdvcmtmbG93ID09IENhbGxXb3JrZmxvdy5kZWZhdWx0Q2FsbGluZykge1xuXHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kQ2FsbCgpO1xuXHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdC5jbGVhckFjdGl2ZUNhbGwoKTtcblx0XHRcdFx0XHRcdFx0XHRDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoe30gYXMgQ29tZXRDaGF0LkNhbGwpXG5cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uQ2FsbEVuZEJ1dHRvblByZXNzZWQ6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0U3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuY2FsbFdvcmtmbG93ID09IENhbGxXb3JrZmxvdy5kZWZhdWx0Q2FsbGluZykge1xuXHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklEKS50aGVuKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKClcblx0XHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dChjYWxsKTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vbkVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dCh7fSBhcyBDb21ldENoYXQuQ2FsbCk7XG5cdFx0XHRcdFx0XHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vbkVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdClcblx0XHRcdFx0LmJ1aWxkKCk7XG5cdFx0XHRyZXR1cm4gY2FsbFNldHRpbmdzXG5cdFx0fVxuXHR9XG5cdHN0YXJ0Q2FsbCA9ICgpID0+IHtcblx0XHRpZiAodGhpcy5sb2dnZWRJblVzZXIpIHtcblx0XHRcdGNvbnN0IGF1dGhUb2tlbiA9IHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRBdXRoVG9rZW4oKTtcblx0XHRcdGNvbnN0IHNlc3Npb25JRCA9IHRoaXMuc2Vzc2lvbklEO1xuXHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5nZW5lcmF0ZVRva2VuKHNlc3Npb25JRCwgYXV0aFRva2VuKS50aGVuKFxuXHRcdFx0XHQocmVzOiBhbnkpID0+IHtcblx0XHRcdFx0XHRDb21ldENoYXRVSUtpdENhbGxzLnN0YXJ0U2Vzc2lvbihcblx0XHRcdFx0XHRcdHJlcz8udG9rZW4sXG5cdFx0XHRcdFx0XHR0aGlzLmdldENhbGxCdWlsZGVyKCksXG5cdFx0XHRcdFx0XHR0aGlzLmNhbGxTY3JlZW5GcmFtZS5uYXRpdmVFbGVtZW50XG5cdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0LmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vbkVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHQoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRoaXMub25FcnJvcikge1xuXHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdClcblx0XHRcdFx0LmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdGlmICh0aGlzLm9uRXJyb3IpIHtcblx0XHRcdFx0XHRcdHRoaXMub25FcnJvcihlcnJvcilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Q29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuXHRcdFx0XHRjb25zdCBhdXRoVG9rZW4gPSB1c2VyIS5nZXRBdXRoVG9rZW4oKTtcblx0XHRcdFx0Y29uc3Qgc2Vzc2lvbklEID0gdGhpcy5zZXNzaW9uSUQ7XG5cdFx0XHRcdENvbWV0Q2hhdFVJS2l0Q2FsbHMuZ2VuZXJhdGVUb2tlbihzZXNzaW9uSUQsIGF1dGhUb2tlbikudGhlbihcblx0XHRcdFx0XHQocmVzOiBhbnkpID0+IHtcblx0XHRcdFx0XHRcdENvbWV0Q2hhdFVJS2l0Q2FsbHMuc3RhcnRTZXNzaW9uKFxuXHRcdFx0XHRcdFx0XHRyZXM/LnRva2VuLFxuXHRcdFx0XHRcdFx0XHR0aGlzLmdldENhbGxCdWlsZGVyKCksXG5cdFx0XHRcdFx0XHRcdHRoaXMuY2FsbFNjcmVlbkZyYW1lLm5hdGl2ZUVsZW1lbnRcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLm9uRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0KVxuXHRcdFx0XHRcdC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLm9uRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdH1cblx0fTtcblx0c2V0b25nb2luZ0NhbGxTdHlsZSgpIHtcblx0XHRsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG5cdFx0XHRtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdFx0bWF4V2lkdGg6IFwiMTAwJVwiLFxuXHRcdFx0Ym9yZGVyOiBcIm5vbmVcIixcblx0XHRcdGJvcmRlclJhZGl1czogXCIwXCIsXG5cdFx0XHRiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcblx0XHRcdG1pbkhlaWdodDogXCI0MDBweFwiLFxuXHRcdFx0bWluV2lkdGg6IFwiNDAwcHhcIixcblx0XHRcdG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcblx0XHRcdG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcblx0XHR9KTtcblx0XHR0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH1cblx0fVxufVxuIiwiPGNvbWV0Y2hhdC1jYWxsc2NyZWVuLXdyYXBwZXIgKm5nSWY9XCJzZXNzaW9uSURcIiBbY2FsbHNjcmVlblN0eWxlXT1cIm9uZ29pbmdDYWxsU3R5bGVcIiBbcmVzaXplSWNvbkhvdmVyVGV4dF09XCJyZXNpemVJY29uSG92ZXJUZXh0XCIgIFttaW5pbWl6ZUljb25VUkxdPVwibWluaW1pemVJY29uVVJMXCIgW21heGltaXplSWNvblVSTF09XCJtYXhpbWl6ZUljb25VUkxcIj5cbiAgICA8ZGl2ICNjYWxsc2NyZWVuVmlldyBjbGFzcz1cImNjLWNhbGxzY3JlZW5fX3ZpZXdcIj48L2Rpdj5cbjwvY29tZXRjaGF0LWNhbGxzY3JlZW4td3JhcHBlcj5cbiJdfQ==