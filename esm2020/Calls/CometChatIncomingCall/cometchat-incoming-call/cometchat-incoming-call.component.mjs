import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { StorageUtils, IncomingCallStyle, CometChatSoundManager, CometChatUIKitCalls } from "@cometchat/uikit-shared";
import { CallscreenStyle } from '@cometchat/uikit-elements';
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { localize, CometChatUIKitConstants, fontHelper, CometChatCallEvents } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "../../CometChatOngoingCall/cometchat-ongoing-call/cometchat-ongoing-call.component";
import * as i3 from "@angular/common";
/**
*
* CometChatIncomingCallComponent is a component which shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatIncomingCallComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.disableSoundForCalls = false;
        this.acceptButtonText = localize("ACCEPT");
        this.declineButtonText = localize("DECLINE");
        this.onError = (error) => {
            console.log(error);
        };
        this.listItemStyle = {
            height: "100%",
            width: "100%",
            background: "",
            activeBackground: "",
            border: "",
        };
        this.avatarStyle = {
            borderRadius: "16px",
            width: "38px",
            height: "38px",
        };
        this.incomingCallStyle = {
            width: "fit-content",
            height: "fit-content",
        };
        this.incomingcallListenerId = "incomingcall_" + new Date().getTime();
        this.subtitleText = localize("INCOMING_CALL");
        this.buttonStyle = {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "8px 28px"
        };
        this.ongoingCallStyle = {};
        this.showOngoingCall = false;
        this.showIncomingCallScreen = false;
        this.sessionId = "";
        this.acceptButtonStyle = {};
        this.declineButtonStyle = {};
        this.loggedInUser = null;
        this.iconStyle = {
            height: "16px",
            width: "16px",
            iconTint: "RGBA(20, 20, 20, 0.68)"
        };
        this.activeCall = null;
        this.localStorageChange = (event) => {
            if (event?.key !== CometChatUIKitConstants.calls.activecall) {
                return false;
            }
            if (event.newValue || event.oldValue) {
                let call;
                if (event.newValue) {
                    call = JSON.parse(event.newValue);
                }
                else if (event.oldValue) {
                    call = JSON.parse(event.oldValue);
                }
                if (this.call?.getSessionId() === call?.sessionId) {
                    this.showIncomingCallScreen = false;
                    CometChatSoundManager.pause();
                    this.call = null;
                    this.ref.detectChanges();
                }
            }
            return;
        };
        this.setOngoingCallStyle = () => {
            let defaultStyle = new CallscreenStyle({
                maxHeight: "100%",
                maxWidth: "100%",
                border: "none",
                borderRadius: "0",
                background: "#1c2226",
                minHeight: "400px",
                minWidth: "400px",
                minimizeIconTint: this.themeService.theme.palette.getAccent900(),
                maximizeIconTint: this.themeService.theme.palette.getAccent900(),
            });
            this.ongoingCallStyle = { ...defaultStyle, ...this.ongoingCallStyle };
        };
        this.checkForActiveCallAndEndCall = () => {
            let call = CometChat.getActiveCall();
            return new Promise((resolve, reject) => {
                if (!call) {
                    return resolve({ success: true });
                }
                let sessionID = call?.getSessionId();
                CometChat.endCall(sessionID)
                    .then((response) => {
                    return resolve(response);
                })
                    .catch((error) => {
                    return reject(error);
                });
            });
        };
        this.subtitleStyle = () => {
            return {
                textFont: this.incomingCallStyle.subtitleTextFont,
                textColor: this.incomingCallStyle.subtitleTextColor
            };
        };
        this.wrapperStyle = () => {
            return {
                height: this.incomingCallStyle.height,
                width: this.incomingCallStyle.width,
                background: this.incomingCallStyle.background,
                border: this.incomingCallStyle.border,
                borderRadius: this.incomingCallStyle.borderRadius,
                padding: "8px"
            };
        };
    }
    ngOnChanges(changes) {
        if (changes["call"] && changes["call"]?.currentValue) {
            this.showCall(this.call);
        }
    }
    playAudio() {
        if (this.customSoundForCalls) {
            CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall, this.customSoundForCalls);
        }
        else {
            CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall);
        }
    }
    isCallActive(call) {
        let isCurrentCall = false;
        if (StorageUtils.getItem(CometChatUIKitConstants.calls.activecall)) {
            let oldCall = StorageUtils.getItem(CometChatUIKitConstants.calls.activecall);
            if (oldCall && oldCall.sessionId == call.getSessionId()) {
                isCurrentCall = true;
            }
            else {
                isCurrentCall = false;
            }
        }
        else {
            isCurrentCall = false;
        }
        return isCurrentCall;
    }
    showCall(call) {
        if (!this.isCallActive(call) && this.loggedInUser?.getUid() != call?.getSender()?.getUid() && !this.call) {
            if (!this.disableSoundForCalls) {
                setTimeout(() => {
                    this.playAudio();
                }, 100);
            }
            this.call = call;
            this.showIncomingCallScreen = true;
            this.ref.detectChanges();
        }
        else {
            if (this.loggedInUser?.getUid() == call?.getSender()?.getUid()) {
                CometChatSoundManager.pause();
                return;
            }
            CometChatSoundManager.pause();
            this.rejectIncomingCall(CometChatUIKitConstants.calls.busy, call);
        }
    }
    attachListeners() {
        CometChat.addCallListener(this.incomingcallListenerId, new CometChat.CallListener({
            onIncomingCallReceived: (call) => {
                if (!CometChat.getActiveCall() && !StorageUtils.getItem(CometChatUIKitConstants.calls.activecall)) {
                    this.showCall(call);
                    this.ref.detectChanges();
                }
                else {
                    CometChatSoundManager.pause();
                    this.rejectIncomingCall(CometChatUIKitConstants.calls.busy, call);
                }
            },
            onIncomingCallCancelled: (call) => {
                CometChatSoundManager.pause();
                this.call = null;
                this.ref.detectChanges();
            },
            onOutgoingCallRejected: (call) => {
                if (this.call && call.getReceiverId() == call.getReceiverId() && this.showIncomingCallScreen) {
                    CometChatSoundManager.pause();
                    this.closeCallScreen();
                }
            },
            onOutgoingCallAccepted: (call) => {
                if (this.call && call.getReceiverId() == call.getReceiverId() && this.showIncomingCallScreen) {
                    CometChatSoundManager.pause();
                    this.closeCallScreen();
                }
            },
        }));
    }
    removeListener() {
        CometChat.removeCallListener(this.incomingcallListenerId);
    }
    ngOnInit() {
        CometChat.getLoggedinUser().then((user) => {
            this.loggedInUser = user;
        }).catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        StorageUtils.attachChangeDetection(this.localStorageChange);
        this.attachListeners();
        this.setThemeStyle();
        this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call) => {
            this.closeCallScreen();
        });
    }
    closeCallScreen() {
        this.showOngoingCall = false;
        this.activeCall = null;
        this.call = null;
        this.sessionId = "";
        this.ref.detectChanges();
    }
    ngOnDestroy() {
        StorageUtils.detachChangeDetection(this.localStorageChange);
        this.removeListener();
        this.ccCallEnded?.unsubscribe();
    }
    getCallTypeIcon() {
        if (this.call?.getType() == CometChatUIKitConstants.MessageTypes.audio) {
            return "assets/Audio-Call.svg";
        }
        else {
            return "assets/Video-call.svg";
        }
    }
    acceptIncomingCall() {
        CometChatSoundManager.pause();
        if (this.onAccept && this.call) {
            this.onAccept(this.call);
        }
        else {
            this.checkForActiveCallAndEndCall()
                .then((response) => {
                CometChat.acceptCall(this.call.getSessionId())
                    .then((call) => {
                    CometChatCallEvents.ccCallAccepted.next(call);
                    StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, call);
                    this.showOngoingCall = true;
                    this.activeCall = call;
                    this.sessionId = call?.getSessionId();
                    this.showIncomingCallScreen = false;
                    this.call = call;
                    this.ref.detectChanges();
                })
                    .catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
        }
    }
    rejectIncomingCall(reason = CometChatUIKitConstants.calls.rejected, call) {
        let currentCall = call ?? this.call;
        CometChatSoundManager.pause();
        if (this.onDecline && currentCall) {
            this.onDecline(currentCall);
        }
        else {
            CometChat.rejectCall(currentCall.getSessionId(), reason)
                .then((rejectedCall) => {
                CometChatSoundManager.pause();
                CometChatCallEvents.ccCallRejected.next(rejectedCall);
                if (!call) {
                    this.showOngoingCall = false;
                    this.activeCall = null;
                    this.call = null;
                    this.ref.detectChanges();
                }
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
        }
    }
    getCallBuilder() {
        let audioOnlyCall = this.activeCall?.getType() == CometChatUIKitConstants.MessageTypes.audio ? true : false;
        const callSettings = new CometChatUIKitCalls.CallSettingsBuilder()
            .enableDefaultLayout(true)
            .setIsAudioOnlyCall(audioOnlyCall)
            .setCallListener(new CometChatUIKitCalls.OngoingCallListener({
            onCallEnded: () => {
                StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
                if (this.call?.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                    CometChatUIKitCalls.endSession();
                    this.closeCallScreen();
                }
            },
            onCallEndButtonPressed: () => {
                StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
                if (this.call?.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                    CometChat.endCall(this.sessionId).then((call) => {
                        CometChatUIKitCalls.endSession();
                        CometChatCallEvents.ccCallEnded.next(call);
                        this.closeCallScreen();
                    })
                        .catch((err) => {
                        if (this.onError) {
                            this.onError(err);
                        }
                    });
                }
                else {
                    this.closeCallScreen();
                }
            },
            onError: (error) => {
                console.log("Error :", error);
            },
        }))
            .build();
        return callSettings;
    }
    setThemeStyle() {
        this.setincomingCallStyle();
        this.setAvatarStyle();
        this.setOngoingCallStyle();
        this.iconStyle.iconTint = this.incomingCallStyle.subtitleTextColor;
    }
    setListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "100%",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: "transparent",
            borderRadius: "0",
            titleFont: this.incomingCallStyle.titleTextFont,
            titleColor: this.incomingCallStyle.titleTextColor,
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            hoverBackground: "transparent"
        });
        this.listItemStyle = { ...defaultStyle, ...this.listItemStyle };
    }
    setincomingCallStyle() {
        let defaultStyle = new IncomingCallStyle({
            width: "fit-content",
            height: "fit-content",
            background: this.themeService.theme.palette.getAccent800("light"),
            border: "none",
            borderRadius: "8px",
            titleTextFont: fontHelper(this.themeService.theme.typography.title2),
            titleTextColor: this.themeService.theme.palette.getAccent("dark"),
            subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            subtitleTextColor: this.themeService.theme.palette.getAccent800("dark"),
            acceptButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            acceptButtonTextColor: this.themeService.theme.palette.getAccent("dark"),
            acceptButtonBackground: this.themeService.theme.palette.getPrimary(),
            acceptButtonBorderRadius: "8px",
            acceptButtonBorder: "none",
            declineButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            declineButtonTextColor: this.themeService.theme.palette.getAccent("dark"),
            declineButtonBackground: this.themeService.theme.palette.getError(),
            declineButtonBorderRadius: "8px",
            declineButtonBorder: "none",
        });
        this.incomingCallStyle = { ...defaultStyle, ...this.incomingCallStyle };
        this.setListItemStyle();
        this.acceptButtonStyle = {
            border: this.incomingCallStyle.acceptButtonBorder,
            borderRadius: this.incomingCallStyle.acceptButtonBorderRadius,
            background: this.incomingCallStyle.acceptButtonBackground,
            buttonTextFont: this.incomingCallStyle.acceptButtonTextFont,
            buttonTextColor: this.incomingCallStyle.acceptButtonTextColor,
            ...this.buttonStyle
        };
        this.declineButtonStyle = {
            border: this.incomingCallStyle.declineButtonBorder,
            borderRadius: this.incomingCallStyle.declineButtonBorderRadius,
            background: this.incomingCallStyle.declineButtonBackground,
            buttonTextFont: this.incomingCallStyle.declineButtonTextFont,
            buttonTextColor: this.incomingCallStyle.declineButtonTextColor,
            ...this.buttonStyle
        };
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "16px",
            width: "38px",
            height: "38px",
            border: "none",
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
}
CometChatIncomingCallComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatIncomingCallComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatIncomingCallComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatIncomingCallComponent, selector: "cometchat-incoming-call", inputs: { call: "call", disableSoundForCalls: "disableSoundForCalls", customSoundForCalls: "customSoundForCalls", onAccept: "onAccept", onDecline: "onDecline", acceptButtonText: "acceptButtonText", declineButtonText: "declineButtonText", subtitleView: "subtitleView", onError: "onError", listItemStyle: "listItemStyle", avatarStyle: "avatarStyle", incomingCallStyle: "incomingCallStyle" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-incoming-call__wrapper\" [ngStyle]=\"wrapperStyle()\" *ngIf=\"call && showIncomingCallScreen\">\n    <div class=\"cc-incoming-call__listitem\">\n        <cometchat-list-item [title]=\"call.getSender().getName()\"\n        [listItemStyle]=\"listItemStyle\"\n        [hideSeparator]=\"true\" >\n        <div slot=\"subtitleView\" class=\"cc-incoming-call__subtitle-view\" *ngIf=\"subtitleView;else subtitle\">\n            <ng-container *ngTemplateOutlet=\"subtitleView\">\n            </ng-container>\n        </div>\n        <ng-template #subtitle>\n           <div slot=\"subtitleView\"  class=\"cc-incoming-call__subtitle-view\">\n          <div class=\"cc-call__icon\">\n            <cometchat-icon [iconStyle]=\"iconStyle\" [URL]=\"getCallTypeIcon()\"></cometchat-icon>\n          </div>\n          <cometchat-label class=\"cc-call__type\" [text]=\"subtitleText\" [labelStyle]=\"subtitleStyle()\">\n\n          </cometchat-label>\n          </div>\n        </ng-template>\n      <div slot=\"tailView\"  class=\"cc-incoming-call__tail-view\">\n        <div class=\"tail__view\">\n          <div class=\"cc-incoming-call__avatar\">\n            <cometchat-avatar [avatarStyle]=\"avatarStyle\" [image]=\"call.getSender().getAvatar()\" [name]=\"call.getSender().getName()\">\n\n            </cometchat-avatar>\n          </div>\n        </div>\n        </div>\n    </cometchat-list-item>\n    </div>\n    <div class=\"cc-incoming-call-buttons\">\n        <cometchat-button (cc-button-clicked)=\"rejectIncomingCall()\"  [buttonStyle]=\"declineButtonStyle\" [text]=\"declineButtonText\"></cometchat-button>\n        <cometchat-button (cc-button-clicked)=\"acceptIncomingCall()\"  [buttonStyle]=\"acceptButtonStyle\" [text]=\"acceptButtonText\" ></cometchat-button>\n        </div>\n</div>\n<cometchat-ongoing-call *ngIf=\"showOngoingCall && activeCall && !showIncomingCallScreen\" [ongoingCallStyle]=\"ongoingCallStyle\" [sessionID]=\"sessionId\"  [callSettingsBuilder]=\"getCallBuilder()!\"></cometchat-ongoing-call>\n", styles: [".cc-incoming-call__wrapper{position:absolute;left:8px;top:8px;height:-moz-fit-content;height:fit-content;width:-moz-fit-content;width:fit-content;min-height:104px;min-width:230px;z-index:100;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;align-items:flex-start}.cc-incoming-call-buttons{display:flex;gap:8px}.cc-incoming-call__tail-view{position:relative}.cc-incoming-call__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}.cc-incoming-call__listitem{width:100%;margin-left:-4px}\n"], components: [{ type: i2.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }], directives: [{ type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatIncomingCallComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-incoming-call", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-incoming-call__wrapper\" [ngStyle]=\"wrapperStyle()\" *ngIf=\"call && showIncomingCallScreen\">\n    <div class=\"cc-incoming-call__listitem\">\n        <cometchat-list-item [title]=\"call.getSender().getName()\"\n        [listItemStyle]=\"listItemStyle\"\n        [hideSeparator]=\"true\" >\n        <div slot=\"subtitleView\" class=\"cc-incoming-call__subtitle-view\" *ngIf=\"subtitleView;else subtitle\">\n            <ng-container *ngTemplateOutlet=\"subtitleView\">\n            </ng-container>\n        </div>\n        <ng-template #subtitle>\n           <div slot=\"subtitleView\"  class=\"cc-incoming-call__subtitle-view\">\n          <div class=\"cc-call__icon\">\n            <cometchat-icon [iconStyle]=\"iconStyle\" [URL]=\"getCallTypeIcon()\"></cometchat-icon>\n          </div>\n          <cometchat-label class=\"cc-call__type\" [text]=\"subtitleText\" [labelStyle]=\"subtitleStyle()\">\n\n          </cometchat-label>\n          </div>\n        </ng-template>\n      <div slot=\"tailView\"  class=\"cc-incoming-call__tail-view\">\n        <div class=\"tail__view\">\n          <div class=\"cc-incoming-call__avatar\">\n            <cometchat-avatar [avatarStyle]=\"avatarStyle\" [image]=\"call.getSender().getAvatar()\" [name]=\"call.getSender().getName()\">\n\n            </cometchat-avatar>\n          </div>\n        </div>\n        </div>\n    </cometchat-list-item>\n    </div>\n    <div class=\"cc-incoming-call-buttons\">\n        <cometchat-button (cc-button-clicked)=\"rejectIncomingCall()\"  [buttonStyle]=\"declineButtonStyle\" [text]=\"declineButtonText\"></cometchat-button>\n        <cometchat-button (cc-button-clicked)=\"acceptIncomingCall()\"  [buttonStyle]=\"acceptButtonStyle\" [text]=\"acceptButtonText\" ></cometchat-button>\n        </div>\n</div>\n<cometchat-ongoing-call *ngIf=\"showOngoingCall && activeCall && !showIncomingCallScreen\" [ongoingCallStyle]=\"ongoingCallStyle\" [sessionID]=\"sessionId\"  [callSettingsBuilder]=\"getCallBuilder()!\"></cometchat-ongoing-call>\n", styles: [".cc-incoming-call__wrapper{position:absolute;left:8px;top:8px;height:-moz-fit-content;height:fit-content;width:-moz-fit-content;width:fit-content;min-height:104px;min-width:230px;z-index:100;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;align-items:flex-start}.cc-incoming-call-buttons{display:flex;gap:8px}.cc-incoming-call__tail-view{position:relative}.cc-incoming-call__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}.cc-incoming-call__listitem{width:100%;margin-left:-4px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { call: [{
                type: Input
            }], disableSoundForCalls: [{
                type: Input
            }], customSoundForCalls: [{
                type: Input
            }], onAccept: [{
                type: Input
            }], onDecline: [{
                type: Input
            }], acceptButtonText: [{
                type: Input
            }], declineButtonText: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], onError: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], incomingCallStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWluY29taW5nLWNhbGwuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRJbmNvbWluZ0NhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRJbmNvbWluZ0NhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3RILE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUMzRCxPQUFPLEVBQUUsV0FBVyxFQUFhLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBR2pGLE9BQU8sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUE0RCxNQUFNLDRCQUE0QixDQUFDOzs7OztBQUMxSzs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyw4QkFBOEI7SUFxRHpDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUFuRDlFLHlCQUFvQixHQUFZ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WSxFQUFFO1lBQy9ELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzdELGNBQWMsRUFBRSxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUV0RSxzQkFBc0IsRUFBRSxFQUFFO1NBQzNCLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUM3RCxDQUFDOzs0SEF0WlUsOEJBQThCO2dIQUE5Qiw4QkFBOEIsMGRDdkIzQyxtL0RBb0NBOzRGRGJhLDhCQUE4QjtrQkFOMUMsU0FBUzsrQkFDRSx5QkFBeUIsbUJBR2xCLHVCQUF1QixDQUFDLE1BQU07NElBR3RDLElBQUk7c0JBQVosS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLFFBQVE7c0JBQWhCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUdHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBT0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxpQkFBaUI7c0JBQXpCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudCwgSW5wdXQsIE9uQ2hhbmdlcywgT25Jbml0LCBTaW1wbGVDaGFuZ2VzLCBUZW1wbGF0ZVJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSAnQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0JztcbmltcG9ydCB7IFN0b3JhZ2VVdGlscywgSW5jb21pbmdDYWxsU3R5bGUsIENvbWV0Q2hhdFNvdW5kTWFuYWdlciwgQ29tZXRDaGF0VUlLaXRDYWxscyB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQ2FsbHNjcmVlblN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IEF2YXRhclN0eWxlLCBJY29uU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IGxvY2FsaXplLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgZm9udEhlbHBlciwgQ29tZXRDaGF0Q2FsbEV2ZW50cywgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cywgTWVzc2FnZVN0YXR1cywgQ29tZXRDaGF0TG9jYWxpemUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcyc7XG4vKipcbipcbiogQ29tZXRDaGF0SW5jb21pbmdDYWxsQ29tcG9uZW50IGlzIGEgY29tcG9uZW50IHdoaWNoIHNob3dzIG91dGdvaW5nIGNhbGwgc2NyZWVuIGZvciBkZWZhdWx0IGF1ZGlvIGFuZCB2aWRlbyBjYWxsLlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1pbmNvbWluZy1jYWxsXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWluY29taW5nLWNhbGwuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1pbmNvbWluZy1jYWxsLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRJbmNvbWluZ0NhbGxDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGNhbGwhOiBDb21ldENoYXQuQ2FsbCB8IG51bGw7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvckNhbGxzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGN1c3RvbVNvdW5kRm9yQ2FsbHMhOiBzdHJpbmc7XG4gIEBJbnB1dCgpIG9uQWNjZXB0ITogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkRlY2xpbmUhOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGFjY2VwdEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQUNDRVBUXCIpO1xuICBASW5wdXQoKSBkZWNsaW5lQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJERUNMSU5FXCIpO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgfVxuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYWN0aXZlQmFja2dyb3VuZDogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gIH07XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjM4cHhcIixcbiAgICBoZWlnaHQ6IFwiMzhweFwiLFxuICB9O1xuICBASW5wdXQoKSBpbmNvbWluZ0NhbGxTdHlsZTogSW5jb21pbmdDYWxsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgfTtcbiAgcHVibGljIGluY29taW5nY2FsbExpc3RlbmVySWQ6IHN0cmluZyA9IFwiaW5jb21pbmdjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHN1YnRpdGxlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJJTkNPTUlOR19DQUxMXCIpXG4gIGJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIHBhZGRpbmc6IFwiOHB4IDI4cHhcIlxuICB9XG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9XG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93SW5jb21pbmdDYWxsU2NyZWVuOiBib29sZWFuID0gZmFsc2VcbiAgc2Vzc2lvbklkOiBzdHJpbmcgPSBcIlwiO1xuICBhY2NlcHRCdXR0b25TdHlsZTogYW55ID0ge31cbiAgZGVjbGluZUJ1dHRvblN0eWxlOiBhbnkgPSB7fVxuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBpY29uU3R5bGU6IEljb25TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICBpY29uVGludDogXCJSR0JBKDIwLCAyMCwgMjAsIDAuNjgpXCJcbiAgfVxuICBhY3RpdmVDYWxsOiBDb21ldENoYXQuQ2FsbCB8IG51bGwgPSBudWxsO1xuICBjY0NhbGxFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1wiY2FsbFwiXSAmJiBjaGFuZ2VzW1wiY2FsbFwiXT8uY3VycmVudFZhbHVlKSB7XG4gICAgICB0aGlzLnNob3dDYWxsKHRoaXMuY2FsbCEpXG4gICAgfVxuICB9XG4gIHBsYXlBdWRpbygpIHtcbiAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvckNhbGxzKSB7XG4gICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdDYWxsLCB0aGlzLmN1c3RvbVNvdW5kRm9yQ2FsbHMpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nQ2FsbClcbiAgICB9XG4gIH1cbiAgaXNDYWxsQWN0aXZlKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgbGV0IGlzQ3VycmVudENhbGw6IGJvb2xlYW4gPSBmYWxzZVxuICAgIGlmIChTdG9yYWdlVXRpbHMuZ2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsKSkge1xuICAgICAgbGV0IG9sZENhbGw6IGFueSA9IFN0b3JhZ2VVdGlscy5nZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwpXG4gICAgICBpZiAob2xkQ2FsbCAmJiBvbGRDYWxsLnNlc3Npb25JZCA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgIGlzQ3VycmVudENhbGwgPSB0cnVlXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaXNDdXJyZW50Q2FsbCA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaXNDdXJyZW50Q2FsbCA9IGZhbHNlXG4gICAgfVxuICAgIHJldHVybiBpc0N1cnJlbnRDYWxsXG4gIH1cblxuICBzaG93Q2FsbChjYWxsOiBDb21ldENoYXQuQ2FsbCkge1xuICAgIGlmICghdGhpcy5pc0NhbGxBY3RpdmUoY2FsbCkgJiYgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IGNhbGw/LmdldFNlbmRlcigpPy5nZXRVaWQoKSAmJiAhdGhpcy5jYWxsKSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yQ2FsbHMpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKVxuICAgICAgICB9LCAxMDApO1xuICAgICAgfVxuICAgICAgdGhpcy5jYWxsID0gY2FsbDtcbiAgICAgIHRoaXMuc2hvd0luY29taW5nQ2FsbFNjcmVlbiA9IHRydWU7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PSBjYWxsPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkpIHtcbiAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpO1xuICAgICAgdGhpcy5yZWplY3RJbmNvbWluZ0NhbGwoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYnVzeSwgY2FsbCk7XG4gICAgfVxuICB9XG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgdGhpcy5pbmNvbWluZ2NhbGxMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5DYWxsTGlzdGVuZXIoe1xuICAgICAgICBvbkluY29taW5nQ2FsbFJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAoIUNvbWV0Q2hhdC5nZXRBY3RpdmVDYWxsKCkgJiYgIVN0b3JhZ2VVdGlscy5nZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwpKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dDYWxsKGNhbGwpO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKCk7XG4gICAgICAgICAgICB0aGlzLnJlamVjdEluY29taW5nQ2FsbChDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5idXN5LCBjYWxsKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpXG4gICAgICAgICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSxcbiAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuY2FsbCAmJiBjYWxsLmdldFJlY2VpdmVySWQoKSA9PSBjYWxsLmdldFJlY2VpdmVySWQoKSAmJiB0aGlzLnNob3dJbmNvbWluZ0NhbGxTY3JlZW4pIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSxcbiAgICAgICAgb25PdXRnb2luZ0NhbGxBY2NlcHRlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuY2FsbCAmJiBjYWxsLmdldFJlY2VpdmVySWQoKSA9PSBjYWxsLmdldFJlY2VpdmVySWQoKSAmJiB0aGlzLnNob3dJbmNvbWluZ0NhbGxTY3JlZW4pIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmluY29taW5nY2FsbExpc3RlbmVySWQpO1xuICB9XG4gIGxvY2FsU3RvcmFnZUNoYW5nZSA9IChldmVudDogYW55KTogYW55ID0+IHtcbiAgICBpZiAoZXZlbnQ/LmtleSAhPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZXZlbnQubmV3VmFsdWUgfHwgZXZlbnQub2xkVmFsdWUpIHtcbiAgICAgIGxldCBjYWxsO1xuICAgICAgaWYgKGV2ZW50Lm5ld1ZhbHVlKSB7XG4gICAgICAgIGNhbGwgPSBKU09OLnBhcnNlKGV2ZW50Lm5ld1ZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQub2xkVmFsdWUpIHtcbiAgICAgICAgY2FsbCA9IEpTT04ucGFyc2UoZXZlbnQub2xkVmFsdWUpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY2FsbD8uZ2V0U2Vzc2lvbklkKCkgPT09IGNhbGw/LnNlc3Npb25JZCkge1xuICAgICAgICB0aGlzLnNob3dJbmNvbWluZ0NhbGxTY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKCk7XG4gICAgICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuXG4gIH07XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlclxuICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgICBTdG9yYWdlVXRpbHMuYXR0YWNoQ2hhbmdlRGV0ZWN0aW9uKHRoaXMubG9jYWxTdG9yYWdlQ2hhbmdlKVxuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKVxuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKClcbiAgICB9KVxuICB9XG4gIGNsb3NlQ2FsbFNjcmVlbigpIHtcbiAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlXG4gICAgdGhpcy5hY3RpdmVDYWxsID0gbnVsbFxuICAgIHRoaXMuY2FsbCA9IG51bGxcbiAgICB0aGlzLnNlc3Npb25JZCA9IFwiXCJcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBTdG9yYWdlVXRpbHMuZGV0YWNoQ2hhbmdlRGV0ZWN0aW9uKHRoaXMubG9jYWxTdG9yYWdlQ2hhbmdlKVxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKVxuICAgIHRoaXMuY2NDYWxsRW5kZWQ/LnVuc3Vic2NyaWJlKClcbiAgfVxuICBzZXRPbmdvaW5nQ2FsbFN0eWxlID0gKCkgPT4ge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgQ2FsbHNjcmVlblN0eWxlKHtcbiAgICAgIG1heEhlaWdodDogXCIxMDAlXCIsXG4gICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiIzFjMjIyNlwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjQwMHB4XCIsXG4gICAgICBtaW5XaWR0aDogXCI0MDBweFwiLFxuICAgICAgbWluaW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfSlcbiAgICB0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH1cbiAgfVxuICBnZXRDYWxsVHlwZUljb24oKSB7XG4gICAgaWYgKHRoaXMuY2FsbD8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbykge1xuICAgICAgcmV0dXJuIFwiYXNzZXRzL0F1ZGlvLUNhbGwuc3ZnXCJcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gXCJhc3NldHMvVmlkZW8tY2FsbC5zdmdcIlxuICAgIH1cbiAgfVxuICBhY2NlcHRJbmNvbWluZ0NhbGwoKSB7XG4gICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKClcbiAgICBpZiAodGhpcy5vbkFjY2VwdCAmJiB0aGlzLmNhbGwpIHtcbiAgICAgIHRoaXMub25BY2NlcHQodGhpcy5jYWxsKVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5jaGVja0ZvckFjdGl2ZUNhbGxBbmRFbmRDYWxsKClcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0LmFjY2VwdENhbGwodGhpcy5jYWxsIS5nZXRTZXNzaW9uSWQoKSlcbiAgICAgICAgICAgIC50aGVuKChjYWxsKSA9PiB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsQWNjZXB0ZWQubmV4dChjYWxsKVxuICAgICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBjYWxsKVxuICAgICAgICAgICAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ2FsbCA9IGNhbGw7XG4gICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbklkID0gY2FsbD8uZ2V0U2Vzc2lvbklkKCk7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd0luY29taW5nQ2FsbFNjcmVlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLmNhbGwgPSBjYWxsO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjaGVja0ZvckFjdGl2ZUNhbGxBbmRFbmRDYWxsID0gKCkgPT4ge1xuICAgIGxldCBjYWxsOiBDb21ldENoYXQuQ2FsbCA9IENvbWV0Q2hhdC5nZXRBY3RpdmVDYWxsKClcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKCFjYWxsKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICAgIGxldCBzZXNzaW9uSUQgPSBjYWxsPy5nZXRTZXNzaW9uSWQoKTtcbiAgICAgIENvbWV0Q2hhdC5lbmRDYWxsKHNlc3Npb25JRClcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuICByZWplY3RJbmNvbWluZ0NhbGwocmVhc29uOiBzdHJpbmcgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5yZWplY3RlZCwgY2FsbD86IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgbGV0IGN1cnJlbnRDYWxsID0gY2FsbCA/PyB0aGlzLmNhbGw7XG4gICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKClcbiAgICBpZiAodGhpcy5vbkRlY2xpbmUgJiYgY3VycmVudENhbGwpIHtcbiAgICAgIHRoaXMub25EZWNsaW5lKGN1cnJlbnRDYWxsKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIENvbWV0Q2hhdC5yZWplY3RDYWxsKGN1cnJlbnRDYWxsIS5nZXRTZXNzaW9uSWQoKSwgcmVhc29uKVxuICAgICAgICAudGhlbigocmVqZWN0ZWRDYWxsKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKClcbiAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLm5leHQocmVqZWN0ZWRDYWxsKVxuICAgICAgICAgIGlmICghY2FsbCkge1xuICAgICAgICAgICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSBmYWxzZVxuICAgICAgICAgICAgdGhpcy5hY3RpdmVDYWxsID0gbnVsbFxuICAgICAgICAgICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGdldENhbGxCdWlsZGVyKCk6IHR5cGVvZiBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5ncyB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGF1ZGlvT25seUNhbGw6IGJvb2xlYW4gPSB0aGlzLmFjdGl2ZUNhbGw/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8gPyB0cnVlIDogZmFsc2VcbiAgICBjb25zdCBjYWxsU2V0dGluZ3MgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcbiAgICAgIC5lbmFibGVEZWZhdWx0TGF5b3V0KHRydWUpXG4gICAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGF1ZGlvT25seUNhbGwpXG4gICAgICAuc2V0Q2FsbExpc3RlbmVyKFxuICAgICAgICBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5PbmdvaW5nQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkNhbGxFbmRlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG4gICAgICAgICAgICBpZiAodGhpcy5jYWxsPy5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2FsbEVuZEJ1dHRvblByZXNzZWQ6ICgpID0+IHtcbiAgICAgICAgICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG51bGwpO1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbD8uZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklkKS50aGVuKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dChjYWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycilcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKVxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uRXJyb3I6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIDpcIiwgZXJyb3IpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYnVpbGQoKTtcbiAgICByZXR1cm4gY2FsbFNldHRpbmdzXG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldGluY29taW5nQ2FsbFN0eWxlKClcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKClcbiAgICB0aGlzLnNldE9uZ29pbmdDYWxsU3R5bGUoKVxuICAgIHRoaXMuaWNvblN0eWxlLmljb25UaW50ID0gdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5zdWJ0aXRsZVRleHRDb2xvclxuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pXG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9XG4gIH1cbiAgc2V0aW5jb21pbmdDYWxsU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogSW5jb21pbmdDYWxsU3R5bGUgPSBuZXcgSW5jb21pbmdDYWxsU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ4MDAoXCJsaWdodFwiKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDgwMChcImRhcmtcIiksXG4gICAgICBhY2NlcHRCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGFjY2VwdEJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYWNjZXB0QnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhY2NlcHRCdXR0b25Cb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBhY2NlcHRCdXR0b25Cb3JkZXI6IFwibm9uZVwiLFxuICAgICAgZGVjbGluZUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgZGVjbGluZUJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgZGVjbGluZUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGRlY2xpbmVCdXR0b25Cb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBkZWNsaW5lQnV0dG9uQm9yZGVyOiBcIm5vbmVcIixcbiAgICB9KVxuICAgIHRoaXMuaW5jb21pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5pbmNvbWluZ0NhbGxTdHlsZSB9XG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKCk7XG4gICAgdGhpcy5hY2NlcHRCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJvcmRlcjogdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5hY2NlcHRCdXR0b25Cb3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYWNjZXB0QnV0dG9uQm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5hY2NlcHRCdXR0b25CYWNrZ3JvdW5kLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYWNjZXB0QnV0dG9uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYWNjZXB0QnV0dG9uVGV4dENvbG9yLFxuICAgICAgLi4udGhpcy5idXR0b25TdHlsZVxuICAgIH1cbiAgICB0aGlzLmRlY2xpbmVCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJvcmRlcjogdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5kZWNsaW5lQnV0dG9uQm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmluY29taW5nQ2FsbFN0eWxlLmRlY2xpbmVCdXR0b25Cb3JkZXJSYWRpdXMsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmluY29taW5nQ2FsbFN0eWxlLmRlY2xpbmVCdXR0b25CYWNrZ3JvdW5kLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuZGVjbGluZUJ1dHRvblRleHRGb250LFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLmluY29taW5nQ2FsbFN0eWxlLmRlY2xpbmVCdXR0b25UZXh0Q29sb3IsXG4gICAgICAuLi50aGlzLmJ1dHRvblN0eWxlXG4gICAgfVxuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgICB3aWR0aDogXCIzOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KVxuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5zdWJ0aXRsZVRleHRDb2xvclxuICAgIH1cbiAgfVxuICB3cmFwcGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgICAgcGFkZGluZzogXCI4cHhcIlxuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWluY29taW5nLWNhbGxfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiICpuZ0lmPVwiY2FsbCAmJiBzaG93SW5jb21pbmdDYWxsU2NyZWVuXCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLWluY29taW5nLWNhbGxfX2xpc3RpdGVtXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbGlzdC1pdGVtIFt0aXRsZV09XCJjYWxsLmdldFNlbmRlcigpLmdldE5hbWUoKVwiXG4gICAgICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgICAgICBbaGlkZVNlcGFyYXRvcl09XCJ0cnVlXCIgPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWluY29taW5nLWNhbGxfX3N1YnRpdGxlLXZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlldztlbHNlIHN1YnRpdGxlXCI+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjc3VidGl0bGU+XG4gICAgICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiICBjbGFzcz1cImNjLWluY29taW5nLWNhbGxfX3N1YnRpdGxlLXZpZXdcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY2FsbF9faWNvblwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1pY29uIFtpY29uU3R5bGVdPVwiaWNvblN0eWxlXCIgW1VSTF09XCJnZXRDYWxsVHlwZUljb24oKVwiPjwvY29tZXRjaGF0LWljb24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBjbGFzcz1cImNjLWNhbGxfX3R5cGVcIiBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIiBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIj5cblxuICAgICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiAgY2xhc3M9XCJjYy1pbmNvbWluZy1jYWxsX190YWlsLXZpZXdcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInRhaWxfX3ZpZXdcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtaW5jb21pbmctY2FsbF9fYXZhdGFyXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIiBbaW1hZ2VdPVwiY2FsbC5nZXRTZW5kZXIoKS5nZXRBdmF0YXIoKVwiIFtuYW1lXT1cImNhbGwuZ2V0U2VuZGVyKCkuZ2V0TmFtZSgpXCI+XG5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWF2YXRhcj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtaW5jb21pbmctY2FsbC1idXR0b25zXCI+XG4gICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIChjYy1idXR0b24tY2xpY2tlZCk9XCJyZWplY3RJbmNvbWluZ0NhbGwoKVwiICBbYnV0dG9uU3R5bGVdPVwiZGVjbGluZUJ1dHRvblN0eWxlXCIgW3RleHRdPVwiZGVjbGluZUJ1dHRvblRleHRcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIChjYy1idXR0b24tY2xpY2tlZCk9XCJhY2NlcHRJbmNvbWluZ0NhbGwoKVwiICBbYnV0dG9uU3R5bGVdPVwiYWNjZXB0QnV0dG9uU3R5bGVcIiBbdGV4dF09XCJhY2NlcHRCdXR0b25UZXh0XCIgPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgPC9kaXY+XG48L2Rpdj5cbjxjb21ldGNoYXQtb25nb2luZy1jYWxsICpuZ0lmPVwic2hvd09uZ29pbmdDYWxsICYmIGFjdGl2ZUNhbGwgJiYgIXNob3dJbmNvbWluZ0NhbGxTY3JlZW5cIiBbb25nb2luZ0NhbGxTdHlsZV09XCJvbmdvaW5nQ2FsbFN0eWxlXCIgW3Nlc3Npb25JRF09XCJzZXNzaW9uSWRcIiAgW2NhbGxTZXR0aW5nc0J1aWxkZXJdPVwiZ2V0Q2FsbEJ1aWxkZXIoKSFcIj48L2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGw+XG4iXX0=