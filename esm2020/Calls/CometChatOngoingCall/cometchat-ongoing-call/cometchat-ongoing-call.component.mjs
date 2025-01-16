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
CometChatOngoingCallComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatOngoingCallComponent, deps: [{ token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatOngoingCallComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.12", type: CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: { ongoingCallStyle: "ongoingCallStyle", resizeIconHoverText: "resizeIconHoverText", sessionID: "sessionID", minimizeIconURL: "minimizeIconURL", maximizeIconURL: "maximizeIconURL", callSettingsBuilder: "callSettingsBuilder", callWorkflow: "callWorkflow", onError: "onError" }, viewQueries: [{ propertyName: "callScreenFrame", first: true, predicate: ["callscreenView"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<cometchat-callscreen-wrapper *ngIf=\"sessionID\" [callscreenStyle]=\"ongoingCallStyle\" [resizeIconHoverText]=\"resizeIconHoverText\"  [minimizeIconURL]=\"minimizeIconURL\" [maximizeIconURL]=\"maximizeIconURL\">\n    <div #callscreenView class=\"cc-callscreen__view\"></div>\n</cometchat-callscreen-wrapper>\n", styles: [".cc-callscreen__view{height:100%;width:100%}\n"], directives: [{ type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatOngoingCallComponent, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQThDLFNBQVMsRUFBYyxLQUFLLEVBQWlELFNBQVMsRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDdEwsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyx5QkFBeUIsQ0FBQTtBQUNoQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ2xILE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUU1RSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7Ozs7QUFFM0Q7Ozs7Ozs7O0VBUUU7QUFNRixNQUFNLE9BQU8sNkJBQTZCO0lBd0J6QyxZQUFvQixZQUFtQztRQUFuQyxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUF0QjlDLHFCQUFnQixHQUFvQjtZQUM1QyxTQUFTLEVBQUUsTUFBTTtZQUNqQixRQUFRLEVBQUUsTUFBTTtZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFB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LENBQUM7WUFDbkUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7U0FDbkUsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtJQUN0RSxDQUFDOzsySEF0SlcsNkJBQTZCOytHQUE3Qiw2QkFBNkIsa2VDeEIxQyx3VEFHQTs0RkRxQmEsNkJBQTZCO2tCQUx6QyxTQUFTOytCQUNDLHdCQUF3Qjs0R0FLYyxlQUFlO3NCQUE5RCxTQUFTO3VCQUFDLGdCQUFnQixFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDckMsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQVNHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmLCBWaWV3Q2hpbGQsIFZpZXdFbmNhcHN1bGF0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCdcbmltcG9ydCB7IENvbWV0Q2hhdENhbGxFdmVudHMsIENhbGxXb3JrZmxvdywgbG9jYWxpemUsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXRDYWxscywgU3RvcmFnZVV0aWxzIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuXG5pbXBvcnQgeyBDYWxsc2NyZWVuU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZSc7XG4vKipcbipcbiogQ29tZXRDaGF0T25nb2luZ0NhbGxDb21wb25lbnQgaXMgYSBjb21wb25lbnQgd2hpYyBzaG93cyBvdXRnb2luZyBjYWxsIHNjcmVlbiBmb3IgZGVmYXVsdCBhdWRpbyBhbmQgdmlkZW8gY2FsbC5cbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuXHRzZWxlY3RvcjogXCJjb21ldGNoYXQtb25nb2luZy1jYWxsXCIsXG5cdHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuaHRtbFwiLFxuXHRzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuc2Nzc1wiXSxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0T25nb2luZ0NhbGxDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG5cdEBWaWV3Q2hpbGQoXCJjYWxsc2NyZWVuVmlld1wiLCB7IHN0YXRpYzogZmFsc2UgfSkgY2FsbFNjcmVlbkZyYW1lITogRWxlbWVudFJlZjtcblx0QElucHV0KCkgb25nb2luZ0NhbGxTdHlsZTogQ2FsbHNjcmVlblN0eWxlID0ge1xuXHRcdG1heEhlaWdodDogXCIxMDAlXCIsXG5cdFx0bWF4V2lkdGg6IFwiMTAwJVwiLFxuXHRcdGJvcmRlcjogXCJub25lXCIsXG5cdFx0Ym9yZGVyUmFkaXVzOiBcIjBcIixcblx0XHRiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcblx0XHRtaW5IZWlnaHQ6IFwiNDAwcHhcIixcblx0XHRtaW5XaWR0aDogXCI0MDBweFwiLFxuXHR9XG5cdEBJbnB1dCgpIHJlc2l6ZUljb25Ib3ZlclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiUkVTSVpFXCIpXG5cdEBJbnB1dCgpIHNlc3Npb25JRDogc3RyaW5nID0gXCJcIlxuXHRASW5wdXQoKSBtaW5pbWl6ZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3JlZHVjZS1zaXplLnN2Z1wiXG5cdEBJbnB1dCgpIG1heGltaXplSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvaW5jcmVhc2Utc2l6ZS5zdmdcIlxuXHRASW5wdXQoKSBjYWxsU2V0dGluZ3NCdWlsZGVyITogdHlwZW9mIENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzQnVpbGRlcjtcblx0QElucHV0KCkgY2FsbFdvcmtmbG93OiBDYWxsV29ya2Zsb3cgPSBDYWxsV29ya2Zsb3cuZGlyZWN0Q2FsbGluZztcblx0QElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG5cdFx0Y29uc29sZS5sb2coZXJyb3IpXG5cdH1cblx0cHVibGljIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuXHRuZ09uSW5pdCgpOiB2b2lkIHtcblx0XHR0aGlzLnNldG9uZ29pbmdDYWxsU3R5bGUoKVxuXHR9XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHtcblx0fVxuXHRuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG5cdFx0aWYgKGNoYW5nZXNbXCJzZXNzaW9uSURcIl0gJiYgY2hhbmdlc1tcInNlc3Npb25JRFwiXS5jdXJyZW50VmFsdWUpIHtcblx0XHRcdHRoaXMuc3RhcnRDYWxsKClcblx0XHR9XG5cdH1cblx0Z2V0Q2FsbEJ1aWxkZXIgPSAoKTogYW55ID0+IHtcblx0XHRpZiAodGhpcy5jYWxsU2V0dGluZ3NCdWlsZGVyKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5jYWxsU2V0dGluZ3NCdWlsZGVyXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Y29uc3QgY2FsbFNldHRpbmdzOiBhbnkgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcblx0XHRcdFx0LmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSlcblx0XHRcdFx0LnNldElzQXVkaW9Pbmx5Q2FsbChmYWxzZSlcblx0XHRcdFx0LnNldENhbGxMaXN0ZW5lcihcblx0XHRcdFx0XHRuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5PbmdvaW5nQ2FsbExpc3RlbmVyKHtcblx0XHRcdFx0XHRcdG9uQ2FsbEVuZGVkOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG51bGwpO1xuXG5cdFx0XHRcdFx0XHRcdENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmNhbGxXb3JrZmxvdyA9PSBDYWxsV29ya2Zsb3cuZGVmYXVsdENhbGxpbmcpIHtcblx0XHRcdFx0XHRcdFx0XHRDb21ldENoYXRVSUtpdENhbGxzLmVuZENhbGwoKTtcblx0XHRcdFx0XHRcdFx0XHRDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoe30gYXMgQ29tZXRDaGF0LkNhbGwpXG5cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uQ2FsbEVuZEJ1dHRvblByZXNzZWQ6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0U3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuY2FsbFdvcmtmbG93ID09IENhbGxXb3JrZmxvdy5kZWZhdWx0Q2FsbGluZykge1xuXHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklEKS50aGVuKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKClcblx0XHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dChjYWxsKTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vbkVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dCh7fSBhcyBDb21ldENoYXQuQ2FsbCk7XG5cdFx0XHRcdFx0XHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vbkVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdClcblx0XHRcdFx0LmJ1aWxkKCk7XG5cdFx0XHRyZXR1cm4gY2FsbFNldHRpbmdzXG5cdFx0fVxuXHR9XG5cdHN0YXJ0Q2FsbCA9ICgpID0+IHtcblx0XHRpZiAodGhpcy5sb2dnZWRJblVzZXIpIHtcblx0XHRcdGNvbnN0IGF1dGhUb2tlbiA9IHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRBdXRoVG9rZW4oKTtcblx0XHRcdGNvbnN0IHNlc3Npb25JRCA9IHRoaXMuc2Vzc2lvbklEO1xuXHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5nZW5lcmF0ZVRva2VuKHNlc3Npb25JRCwgYXV0aFRva2VuKS50aGVuKFxuXHRcdFx0XHQocmVzOiBhbnkpID0+IHtcblx0XHRcdFx0XHRDb21ldENoYXRVSUtpdENhbGxzLnN0YXJ0U2Vzc2lvbihcblx0XHRcdFx0XHRcdHJlcz8udG9rZW4sXG5cdFx0XHRcdFx0XHR0aGlzLmdldENhbGxCdWlsZGVyKCksXG5cdFx0XHRcdFx0XHR0aGlzLmNhbGxTY3JlZW5GcmFtZS5uYXRpdmVFbGVtZW50XG5cdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0LmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vbkVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHQoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRoaXMub25FcnJvcikge1xuXHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdClcblx0XHRcdFx0LmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdFx0XHRcdGlmICh0aGlzLm9uRXJyb3IpIHtcblx0XHRcdFx0XHRcdHRoaXMub25FcnJvcihlcnJvcilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Q29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuXHRcdFx0XHRjb25zdCBhdXRoVG9rZW4gPSB1c2VyIS5nZXRBdXRoVG9rZW4oKTtcblx0XHRcdFx0Y29uc3Qgc2Vzc2lvbklEID0gdGhpcy5zZXNzaW9uSUQ7XG5cdFx0XHRcdENvbWV0Q2hhdFVJS2l0Q2FsbHMuZ2VuZXJhdGVUb2tlbihzZXNzaW9uSUQsIGF1dGhUb2tlbikudGhlbihcblx0XHRcdFx0XHQocmVzOiBhbnkpID0+IHtcblx0XHRcdFx0XHRcdENvbWV0Q2hhdFVJS2l0Q2FsbHMuc3RhcnRTZXNzaW9uKFxuXHRcdFx0XHRcdFx0XHRyZXM/LnRva2VuLFxuXHRcdFx0XHRcdFx0XHR0aGlzLmdldENhbGxCdWlsZGVyKCksXG5cdFx0XHRcdFx0XHRcdHRoaXMuY2FsbFNjcmVlbkZyYW1lLm5hdGl2ZUVsZW1lbnRcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLm9uRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0KVxuXHRcdFx0XHRcdC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLm9uRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdH1cblx0fTtcblx0c2V0b25nb2luZ0NhbGxTdHlsZSgpIHtcblx0XHRsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG5cdFx0XHRtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdFx0bWF4V2lkdGg6IFwiMTAwJVwiLFxuXHRcdFx0Ym9yZGVyOiBcIm5vbmVcIixcblx0XHRcdGJvcmRlclJhZGl1czogXCIwXCIsXG5cdFx0XHRiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcblx0XHRcdG1pbkhlaWdodDogXCI0MDBweFwiLFxuXHRcdFx0bWluV2lkdGg6IFwiNDAwcHhcIixcblx0XHRcdG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcblx0XHRcdG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcblx0XHR9KTtcblx0XHR0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH1cblx0fVxufVxuIiwiPGNvbWV0Y2hhdC1jYWxsc2NyZWVuLXdyYXBwZXIgKm5nSWY9XCJzZXNzaW9uSURcIiBbY2FsbHNjcmVlblN0eWxlXT1cIm9uZ29pbmdDYWxsU3R5bGVcIiBbcmVzaXplSWNvbkhvdmVyVGV4dF09XCJyZXNpemVJY29uSG92ZXJUZXh0XCIgIFttaW5pbWl6ZUljb25VUkxdPVwibWluaW1pemVJY29uVVJMXCIgW21heGltaXplSWNvblVSTF09XCJtYXhpbWl6ZUljb25VUkxcIj5cbiAgICA8ZGl2ICNjYWxsc2NyZWVuVmlldyBjbGFzcz1cImNjLWNhbGxzY3JlZW5fX3ZpZXdcIj48L2Rpdj5cbjwvY29tZXRjaGF0LWNhbGxzY3JlZW4td3JhcHBlcj5cbiJdfQ==