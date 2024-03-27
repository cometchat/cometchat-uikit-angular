import { Component, Input, ViewChild } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import "@cometchat/uikit-elements";
import '@cometchat/uikit-shared';
import { CometChatCallEvents, CallWorkflow, localize } from '@cometchat/uikit-resources';
import { CometChatUIKitCalls } from '@cometchat/uikit-shared';
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
                        CometChatUIKitCalls.endSession();
                        if (this.callWorkflow == CallWorkflow.defaultCalling) {
                            CometChatUIKitCalls.endCall();
                            CometChatCallEvents.ccCallEnded.next({});
                        }
                    },
                    onCallEndButtonPressed: () => {
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
        if (changes && changes["sessionID"].currentValue) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdE9uZ29pbmdDYWxsL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwvY29tZXRjaGF0LW9uZ29pbmctY2FsbC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQThDLFNBQVMsRUFBYyxLQUFLLEVBQWlELFNBQVMsRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDdEwsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQVEsMkJBQTJCLENBQUM7QUFDcEMsT0FBTyx5QkFBeUIsQ0FBQTtBQUNoQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3pGLE9BQU8sRUFBRyxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRS9ELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQTs7OztBQUV6RDs7Ozs7Ozs7RUFRRTtBQU1GLE1BQU0sT0FBTyw2QkFBNkI7SUF3QnhDLFlBQW9CLFlBQWtDO1FBQWxDLGlCQUFZLEdBQVosWUFBWSxDQUFzQjtRQXRCN0MscUJBQWdCLEdBQW9CO1lBQzNDLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsWUFBWSxFQUFFLEdBQUc7WUFDakIsVUFBVSxFQUFF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MkhBbEpZLDZCQUE2QjsrR0FBN0IsNkJBQTZCLGtlQ3hCMUMsd1RBR0E7NEZEcUJhLDZCQUE2QjtrQkFMekMsU0FBUzsrQkFDRSx3QkFBd0I7NEdBS2MsZUFBZTtzQkFBOUQsU0FBUzt1QkFBQyxnQkFBZ0IsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7Z0JBQ3JDLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFTRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudCwgRWxlbWVudFJlZiwgSW5wdXQsIE9uQ2hhbmdlcywgT25Jbml0LCBTaW1wbGVDaGFuZ2VzLCBUZW1wbGF0ZVJlZiwgVmlld0NoaWxkLCBWaWV3RW5jYXBzdWxhdGlvbiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSAnQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0JztcbmltcG9ydCAgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJ1xuaW1wb3J0IHsgQ29tZXRDaGF0Q2FsbEV2ZW50cywgQ2FsbFdvcmtmbG93LCBsb2NhbGl6ZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcbmltcG9ydCB7ICBDb21ldENoYXRVSUtpdENhbGxzIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuXG5pbXBvcnQge0NhbGxzY3JlZW5TdHlsZX0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuLyoqXG4qXG4qIENvbWV0Q2hhdE9uZ29pbmdDYWxsQ29tcG9uZW50IGlzIGEgY29tcG9uZW50IHdoaWMgc2hvd3Mgb3V0Z29pbmcgY2FsbCBzY3JlZW4gZm9yIGRlZmF1bHQgYXVkaW8gYW5kIHZpZGVvIGNhbGwuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LW9uZ29pbmctY2FsbFwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGwuY29tcG9uZW50LnNjc3NcIl0sXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE9uZ29pbmdDYWxsQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBAVmlld0NoaWxkKFwiY2FsbHNjcmVlblZpZXdcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGNhbGxTY3JlZW5GcmFtZSE6IEVsZW1lbnRSZWY7XG4gIEBJbnB1dCgpIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHtcbiAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogXCIjMWMyMjI2XCIsXG5cdCAgbWluSGVpZ2h0OlwiNDAwcHhcIixcblx0ICBtaW5XaWR0aDpcIjQwMHB4XCIsXG4gIH1cbiAgQElucHV0KCkgcmVzaXplSWNvbkhvdmVyVGV4dDpzdHJpbmcgPSBsb2NhbGl6ZShcIlJFU0laRVwiKVxuICBASW5wdXQoKSBzZXNzaW9uSUQ6c3RyaW5nID0gXCJcIlxuICBASW5wdXQoKSBtaW5pbWl6ZUljb25VUkw6c3RyaW5nID0gXCJhc3NldHMvcmVkdWNlLXNpemUuc3ZnXCJcbiAgQElucHV0KCkgbWF4aW1pemVJY29uVVJMOnN0cmluZyA9IFwiYXNzZXRzL2luY3JlYXNlLXNpemUuc3ZnXCJcbiAgQElucHV0KCkgY2FsbFNldHRpbmdzQnVpbGRlciE6dHlwZW9mIENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzQnVpbGRlcjtcbiAgQElucHV0KCkgY2FsbFdvcmtmbG93OkNhbGxXb3JrZmxvdyA9IENhbGxXb3JrZmxvdy5kaXJlY3RDYWxsaW5nO1xuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgfVxuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyITpDb21ldENoYXQuVXNlcjtcbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRvbmdvaW5nQ2FsbFN0eWxlKClcbiAgfVxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRoZW1lU2VydmljZTpDb21ldENoYXRUaGVtZVNlcnZpY2Upe1xuICB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgIGlmKGNoYW5nZXMgJiYgY2hhbmdlc1tcInNlc3Npb25JRFwiXS5jdXJyZW50VmFsdWUpe1xuICAgIHRoaXMuc3RhcnRDYWxsKClcbiAgIH1cbiAgfVxuICAgZ2V0Q2FsbEJ1aWxkZXIgPSAoKTphbnkgPT4ge1xuaWYodGhpcy5jYWxsU2V0dGluZ3NCdWlsZGVyKXtcblx0cmV0dXJuIHRoaXMuY2FsbFNldHRpbmdzQnVpbGRlclxufVxuZWxzZXtcblx0Y29uc3QgY2FsbFNldHRpbmdzOmFueSA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuXHQuZW5hYmxlRGVmYXVsdExheW91dCh0cnVlKVxuXHQuc2V0SXNBdWRpb09ubHlDYWxsKGZhbHNlKVxuXHQuc2V0Q2FsbExpc3RlbmVyKFxuXHQgIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLk9uZ29pbmdDYWxsTGlzdGVuZXIoe1xuXHRcdG9uQ2FsbEVuZGVkOiAoKSA9PiB7XG5cdFx0XHRDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKVxuXHRcdFx0aWYodGhpcy5jYWxsV29ya2Zsb3cgPT0gQ2FsbFdvcmtmbG93LmRlZmF1bHRDYWxsaW5nKXtcblx0XHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5lbmRDYWxsKCk7XG5cdFx0XHRcdENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dCh7fSBhcyBDb21ldENoYXQuQ2FsbClcblxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuXHRcdFx0aWYodGhpcy5jYWxsV29ya2Zsb3cgPT0gQ2FsbFdvcmtmbG93LmRlZmF1bHRDYWxsaW5nKXtcblx0XHRcdFx0Q29tZXRDaGF0LmVuZENhbGwodGhpcy5zZXNzaW9uSUQpLnRoZW4oKGNhbGw6Q29tZXRDaGF0LkNhbGwpPT57XG5cdFx0XHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKClcblx0XHRcdFx0XHRDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoY2FsbCk7XG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0ICAuY2F0Y2goKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG5cdFx0XHRcdFx0aWYodGhpcy5vbkVycm9yKXtcblx0XHRcdFx0XHRcdHRoaXMub25FcnJvcihlcnJvcilcblx0XHRcdFx0XHQgfVxuXHRcdFx0XHQgIH0pXG5cdFx0XHR9XG5cdFx0XHRlbHNle1xuXHRcdFx0XHRDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoe30gYXMgQ29tZXRDaGF0LkNhbGwpO1xuXHRcdFx0XHRDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcblx0XHRcdH1cblxuXHRcdCAgfSxcblx0XHRvbkVycm9yOiAoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuXHRcdCBpZih0aGlzLm9uRXJyb3Ipe1xuXHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdCB9XG5cdFx0fSxcblx0ICB9KVxuXHQpXG5cdC5idWlsZCgpO1xuXHRyZXR1cm4gY2FsbFNldHRpbmdzXG59XG4gIH1cbnN0YXJ0Q2FsbCA9ICgpID0+IHtcblx0aWYodGhpcy5sb2dnZWRJblVzZXIpe1xuXHRcdGNvbnN0IGF1dGhUb2tlbiA9IHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRBdXRoVG9rZW4oKTtcblx0XHRjb25zdCBzZXNzaW9uSUQgPSB0aGlzLnNlc3Npb25JRDtcblx0XHRDb21ldENoYXRVSUtpdENhbGxzLmdlbmVyYXRlVG9rZW4oc2Vzc2lvbklELCBhdXRoVG9rZW4pLnRoZW4oXG5cdFx0XHQocmVzOmFueSkgPT4ge1xuXHRcdFx0XHRDb21ldENoYXRVSUtpdENhbGxzLnN0YXJ0U2Vzc2lvbihcblx0XHRcdFx0XHRyZXM/LnRva2VuLFxuXHRcdFx0XHRcdHRoaXMuZ2V0Q2FsbEJ1aWxkZXIoKSxcblx0XHRcdFx0XHR0aGlzLmNhbGxTY3JlZW5GcmFtZS5uYXRpdmVFbGVtZW50XG5cdFx0XHRcdClcblx0XHRcdFx0LmNhdGNoKChlcnJvcjpDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKT0+e1xuXHRcdFx0XHRcdGlmKHRoaXMub25FcnJvcil7XG5cdFx0XHRcdFx0XHR0aGlzLm9uRXJyb3IoZXJyb3IpXG5cdFx0XHRcdFx0IH1cblx0XHRcdFx0fSlcblx0XHRcdH0sXG5cdFx0XHQoZXJyOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcblx0XHRcdFx0aWYodGhpcy5vbkVycm9yKXtcblx0XHRcdFx0XHR0aGlzLm9uRXJyb3IoZXJyKVxuXHRcdFx0XHQgfVxuXHRcdFx0fVxuXHRcdClcblx0XHQuY2F0Y2goKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG5cdFx0XHRpZih0aGlzLm9uRXJyb3Ipe1xuXHRcdFx0XHR0aGlzLm9uRXJyb3IoZXJyb3IpXG5cdFx0XHQgfVxuXHRcdH0pXG5cdH1cblx0ZWxzZXtcblx0XHRDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjpDb21ldENoYXQuVXNlciB8IG51bGwpPT57XG5cdFx0XHRjb25zdCBhdXRoVG9rZW4gPSB1c2VyIS5nZXRBdXRoVG9rZW4oKTtcblx0XHRcdGNvbnN0IHNlc3Npb25JRCA9IHRoaXMuc2Vzc2lvbklEO1xuXHRcdFx0Q29tZXRDaGF0VUlLaXRDYWxscy5nZW5lcmF0ZVRva2VuKHNlc3Npb25JRCwgYXV0aFRva2VuKS50aGVuKFxuXHRcdFx0XHQocmVzOmFueSkgPT4ge1xuXHRcdFx0XHRcdENvbWV0Q2hhdFVJS2l0Q2FsbHMuc3RhcnRTZXNzaW9uKFxuXHRcdFx0XHRcdFx0cmVzPy50b2tlbixcblx0XHRcdFx0XHQgdGhpcy5nZXRDYWxsQnVpbGRlcigpLFxuICAgICAgICAgICB0aGlzLmNhbGxTY3JlZW5GcmFtZS5uYXRpdmVFbGVtZW50XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSxcblx0XHRcdFx0KGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcblx0XHRcdFx0XHRpZih0aGlzLm9uRXJyb3Ipe1xuXHRcdFx0XHRcdFx0dGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdFx0XHRcdCB9XG5cdFx0XHRcdH1cblx0XHRcdClcblx0XHRcdC5jYXRjaCgoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9Pntcblx0XHRcdFx0aWYodGhpcy5vbkVycm9yKXtcblx0XHRcdFx0XHR0aGlzLm9uRXJyb3IoZXJyb3IpXG5cdFx0XHRcdCB9XG5cdFx0XHR9KVxuXHRcdH0pXG5cdH1cbn07XG5zZXRvbmdvaW5nQ2FsbFN0eWxlKCl7XG4gIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgQ2FsbHNjcmVlblN0eWxlKHtcbiAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogXCIjMWMyMjI2XCIsXG5cdG1pbkhlaWdodDpcIjQwMHB4XCIsXG5cdG1pbldpZHRoOlwiNDAwcHhcIixcblx0bWluaW1pemVJY29uVGludDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG5cdG1heGltaXplSWNvblRpbnQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICB9KTtcbiAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLm9uZ29pbmdDYWxsU3R5bGV9XG59XG59XG4iLCI8Y29tZXRjaGF0LWNhbGxzY3JlZW4td3JhcHBlciAqbmdJZj1cInNlc3Npb25JRFwiIFtjYWxsc2NyZWVuU3R5bGVdPVwib25nb2luZ0NhbGxTdHlsZVwiIFtyZXNpemVJY29uSG92ZXJUZXh0XT1cInJlc2l6ZUljb25Ib3ZlclRleHRcIiAgW21pbmltaXplSWNvblVSTF09XCJtaW5pbWl6ZUljb25VUkxcIiBbbWF4aW1pemVJY29uVVJMXT1cIm1heGltaXplSWNvblVSTFwiPlxuICAgIDxkaXYgI2NhbGxzY3JlZW5WaWV3IGNsYXNzPVwiY2MtY2FsbHNjcmVlbl9fdmlld1wiPjwvZGl2PlxuPC9jb21ldGNoYXQtY2FsbHNjcmVlbi13cmFwcGVyPlxuIl19