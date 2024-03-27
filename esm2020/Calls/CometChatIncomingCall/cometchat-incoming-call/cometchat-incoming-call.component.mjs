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
        if (changes["call"] && changes["call"].currentValue) {
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
            CometChatSoundManager.pause();
            this.rejectIncomingCall(CometChatUIKitConstants.calls.busy);
        }
    }
    attachListeners() {
        CometChat.addCallListener(this.incomingcallListenerId, new CometChat.CallListener({
            onIncomingCallReceived: (call) => {
                this.showCall(call);
                this.ref.detectChanges();
            },
            onIncomingCallCancelled: (call) => {
                CometChatSoundManager.pause();
                this.call = null;
                this.ref.detectChanges();
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
    rejectIncomingCall(reason = CometChatUIKitConstants.calls.rejected) {
        CometChatSoundManager.pause();
        if (this.onDecline && this.call) {
            this.onDecline(this.call);
        }
        else {
            CometChat.rejectCall(this.call.getSessionId(), reason)
                .then((rejectedCall) => {
                StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, rejectedCall);
                CometChatCallEvents.ccCallRejected.next(rejectedCall);
                this.showOngoingCall = false;
                this.activeCall = null;
                this.call = null;
                this.ref.detectChanges();
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
                if (this.call?.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                    CometChatUIKitCalls.endSession();
                    this.closeCallScreen();
                }
            },
            onCallEndButtonPressed: () => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWluY29taW5nLWNhbGwuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRJbmNvbWluZ0NhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRJbmNvbWluZ0NhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwvY29tZXRjaGF0LWluY29taW5nLWNhbGwuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUM1SSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3RILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQTtBQUN6RCxPQUFPLEVBQUUsV0FBVyxFQUFjLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBR2xGLE9BQU8sRUFBRyxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUE0RCxNQUFNLDRCQUE0QixDQUFDOzs7OztBQUMzSzs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyw4QkFBOEI7SUFxRHpDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUFuRDlFLHlCQUFvQixHQUFX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LEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFFdEUsc0JBQXNCLEVBQUUsRUFBRTtTQUMzQixDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDN0QsQ0FBQzs7NEhBM1hVLDhCQUE4QjtnSEFBOUIsOEJBQThCLDBkQ3ZCM0MsbS9EQW9DQTs0RkRiYSw4QkFBOEI7a0JBTjFDLFNBQVM7K0JBQ0UseUJBQXlCLG1CQUdsQix1QkFBdUIsQ0FBQyxNQUFNOzRJQUd0QyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUNHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFHRyxhQUFhO3NCQUFyQixLQUFLO2dCQU9HLFdBQVc7c0JBQW5CLEtBQUs7Z0JBS0csaUJBQWlCO3NCQUF6QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIElucHV0LCBPbkNoYW5nZXMsIE9uSW5pdCwgU2ltcGxlQ2hhbmdlcywgVGVtcGxhdGVSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gJ0Bjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdCc7XG5pbXBvcnQgeyBTdG9yYWdlVXRpbHMsIEluY29taW5nQ2FsbFN0eWxlLCBDb21ldENoYXRTb3VuZE1hbmFnZXIsIENvbWV0Q2hhdFVJS2l0Q2FsbHMgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7Q2FsbHNjcmVlblN0eWxlfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQXZhdGFyU3R5bGUsICBJY29uU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7ICBsb2NhbGl6ZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIGZvbnRIZWxwZXIsIENvbWV0Q2hhdENhbGxFdmVudHMsIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsIE1lc3NhZ2VTdGF0dXMsIENvbWV0Q2hhdExvY2FsaXplIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuLyoqXG4qXG4qIENvbWV0Q2hhdEluY29taW5nQ2FsbENvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB3aGljaCBzaG93cyBvdXRnb2luZyBjYWxsIHNjcmVlbiBmb3IgZGVmYXVsdCBhdWRpbyBhbmQgdmlkZW8gY2FsbC5cbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtaW5jb21pbmctY2FsbFwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1pbmNvbWluZy1jYWxsLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtaW5jb21pbmctY2FsbC5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0SW5jb21pbmdDYWxsQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGNhbGwhOiBDb21ldENoYXQuQ2FsbCB8IG51bGw7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvckNhbGxzOmJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JDYWxscyE6c3RyaW5nO1xuICBASW5wdXQoKSBvbkFjY2VwdCE6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25EZWNsaW5lITogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB2b2lkO1xuICBASW5wdXQoKSBhY2NlcHRCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkFDQ0VQVFwiKTtcbiAgQElucHV0KCkgZGVjbGluZUJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiREVDTElORVwiKTtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIzOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjM4cHhcIixcbiAgfTtcbiAgQElucHV0KCkgaW5jb21pbmdDYWxsU3R5bGU6IEluY29taW5nQ2FsbFN0eWxlID0ge1xuICAgIHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG4gICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gIH07XG4gIHB1YmxpYyBpbmNvbWluZ2NhbGxMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImluY29taW5nY2FsbF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBzdWJ0aXRsZVRleHQ6c3RyaW5nID0gbG9jYWxpemUoXCJJTkNPTUlOR19DQUxMXCIpXG4gIGJ1dHRvblN0eWxlOmFueSA9IHtcbiAgICBoZWlnaHQ6XCIxMDAlXCIsXG4gICAgd2lkdGg6XCIxMDAlXCIsXG4gICAgZGlzcGxheTpcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOlwiY29sdW1uXCIsXG4gICAganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIixcbiAgICBhbGlnbkl0ZW1zOlwiY2VudGVyXCIsXG4gICAgcGFkZGluZzpcIjhweCAyOHB4XCJcbiAgfVxuICBvbmdvaW5nQ2FsbFN0eWxlOiBDYWxsc2NyZWVuU3R5bGUgPSB7fVxuICBzaG93T25nb2luZ0NhbGw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0luY29taW5nQ2FsbFNjcmVlbjpib29sZWFuID0gZmFsc2VcbiAgc2Vzc2lvbklkOiBzdHJpbmcgPSBcIlwiO1xuICBhY2NlcHRCdXR0b25TdHlsZTogYW55ID0ge31cbiAgZGVjbGluZUJ1dHRvblN0eWxlOiBhbnkgPSB7fVxuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBpY29uU3R5bGU6IEljb25TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICBpY29uVGludDogXCJSR0JBKDIwLCAyMCwgMjAsIDAuNjgpXCJcbiAgfVxuYWN0aXZlQ2FsbDpDb21ldENoYXQuQ2FsbCB8IG51bGwgPSBudWxsO1xuY2NDYWxsRW5kZWQhOlN1YnNjcmlwdGlvbjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7ICB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgIGlmKGNoYW5nZXNbXCJjYWxsXCJdICYmIGNoYW5nZXNbXCJjYWxsXCJdLmN1cnJlbnRWYWx1ZSApe1xuICAgdGhpcy5zaG93Q2FsbCh0aGlzLmNhbGwhKVxuICAgfVxuICB9XG4gIHBsYXlBdWRpbygpIHtcbiAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvckNhbGxzKSB7XG4gICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdDYWxsLCB0aGlzLmN1c3RvbVNvdW5kRm9yQ2FsbHMpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nQ2FsbClcbiAgICB9XG4gIH1cbiAgaXNDYWxsQWN0aXZlKGNhbGw6Q29tZXRDaGF0LkNhbGwpe1xuICAgIGxldCBpc0N1cnJlbnRDYWxsOmJvb2xlYW4gPSBmYWxzZVxuICAgIGlmKFN0b3JhZ2VVdGlscy5nZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwpKXtcbiAgICAgbGV0IG9sZENhbGw6YW55ID0gIFN0b3JhZ2VVdGlscy5nZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwpXG4gICAgIGlmKG9sZENhbGwgJiYgb2xkQ2FsbC5zZXNzaW9uSWQgPT0gY2FsbC5nZXRTZXNzaW9uSWQoKSl7XG4gICAgICBpc0N1cnJlbnRDYWxsID0gIHRydWVcbiAgICAgfVxuICAgICBlbHNle1xuICAgICAgaXNDdXJyZW50Q2FsbCA9ICBmYWxzZVxuICAgICB9XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICBpc0N1cnJlbnRDYWxsID0gIGZhbHNlXG4gICAgfVxuICAgcmV0dXJuIGlzQ3VycmVudENhbGxcbiAgfVxuXG4gIHNob3dDYWxsKGNhbGw6Q29tZXRDaGF0LkNhbGwpe1xuICAgIGlmKCF0aGlzLmlzQ2FsbEFjdGl2ZShjYWxsKSAmJiB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gY2FsbD8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpICYmICF0aGlzLmNhbGwpe1xuICAgICAgaWYoIXRoaXMuZGlzYWJsZVNvdW5kRm9yQ2FsbHMpe1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLnBsYXlBdWRpbygpXG4gICAgICAgIH0sIDEwMCk7XG4gICAgICB9XG4gICAgICB0aGlzLmNhbGwgPSBjYWxsXG4gICAgICB0aGlzLnNob3dJbmNvbWluZ0NhbGxTY3JlZW4gPSB0cnVlXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpXG4gICAgICB0aGlzLnJlamVjdEluY29taW5nQ2FsbChDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5idXN5KVxuICAgIH1cbiAgfVxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENhbGxMaXN0ZW5lcihcbiAgICAgIHRoaXMuaW5jb21pbmdjYWxsTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5zaG93Q2FsbChjYWxsKVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9LFxuICAgICAgICBvbkluY29taW5nQ2FsbENhbmNlbGxlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKClcbiAgICAgICAgICB0aGlzLmNhbGwgPSBudWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDYWxsTGlzdGVuZXIodGhpcy5pbmNvbWluZ2NhbGxMaXN0ZW5lcklkKTtcbiAgfVxuICBsb2NhbFN0b3JhZ2VDaGFuZ2UgPSAoZXZlbnQ6YW55KTphbnkgPT4ge1xuXHRcdGlmIChldmVudD8ua2V5ICE9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdGlmIChldmVudC5uZXdWYWx1ZSB8fCBldmVudC5vbGRWYWx1ZSkge1xuXHRcdFx0bGV0IGNhbGw7XG5cdFx0XHRpZiAoZXZlbnQubmV3VmFsdWUpIHtcblx0XHRcdFx0Y2FsbCA9IEpTT04ucGFyc2UoZXZlbnQubmV3VmFsdWUpO1xuXHRcdFx0fSBlbHNlIGlmIChldmVudC5vbGRWYWx1ZSkge1xuXHRcdFx0XHRjYWxsID0gSlNPTi5wYXJzZShldmVudC5vbGRWYWx1ZSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodGhpcy5jYWxsPy5nZXRTZXNzaW9uSWQoKSA9PT0gY2FsbD8uc2Vzc2lvbklkKSB7XG4gICAgICAgIHRoaXMuc2hvd0luY29taW5nQ2FsbFNjcmVlbiA9IGZhbHNlXG5cdFx0XHRcdENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpXG5cdFx0XHRcdHRoaXMuY2FsbCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuXHRcdFx0fVxuXHRcdH1cbiAgICByZXR1cm5cblx0fTtcbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6Q29tZXRDaGF0LlVzZXIgfCBudWxsKT0+e1xuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyXG4gICAgfSkuY2F0Y2goKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG4gICAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgICBTdG9yYWdlVXRpbHMuYXR0YWNoQ2hhbmdlRGV0ZWN0aW9uKHRoaXMubG9jYWxTdG9yYWdlQ2hhbmdlKVxuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgdGhpcy5zZXRUaGVtZVN0eWxlKClcbiAgdGhpcy5jY0NhbGxFbmRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQuc3Vic2NyaWJlKChjYWxsOkNvbWV0Q2hhdC5DYWxsKT0+e1xudGhpcy5jbG9zZUNhbGxTY3JlZW4oKVxuICB9KVxuICB9XG4gIGNsb3NlQ2FsbFNjcmVlbigpe1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gZmFsc2VcbiAgICB0aGlzLmFjdGl2ZUNhbGwgPSBudWxsXG4gICAgdGhpcy5jYWxsID0gbnVsbFxuICAgIHRoaXMuc2Vzc2lvbklkID0gXCJcIlxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIG5nT25EZXN0cm95KCl7XG4gICAgU3RvcmFnZVV0aWxzLmRldGFjaENoYW5nZURldGVjdGlvbih0aGlzLmxvY2FsU3RvcmFnZUNoYW5nZSlcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKClcbiAgICB0aGlzLmNjQ2FsbEVuZGVkPy51bnN1YnNjcmliZSgpXG4gIH1cbiAgc2V0T25nb2luZ0NhbGxTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG4gICAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcbiAgICAgIG1pbkhlaWdodDogXCI0MDBweFwiLFxuICAgICAgbWluV2lkdGg6IFwiNDAwcHhcIixcbiAgICAgIG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBtYXhpbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH0pXG4gICAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub25nb2luZ0NhbGxTdHlsZSB9XG4gIH1cbiAgZ2V0Q2FsbFR5cGVJY29uKCkge1xuICAgIGlmICh0aGlzLmNhbGw/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8pIHtcbiAgICAgIHJldHVybiBcImFzc2V0cy9BdWRpby1DYWxsLnN2Z1wiXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFwiYXNzZXRzL1ZpZGVvLWNhbGwuc3ZnXCJcbiAgICB9XG4gIH1cbmFjY2VwdEluY29taW5nQ2FsbCgpe1xuICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGF1c2UoKVxuICBpZih0aGlzLm9uQWNjZXB0ICYmIHRoaXMuY2FsbCl7XG4gICAgdGhpcy5vbkFjY2VwdCh0aGlzLmNhbGwpXG4gIH1cblxuICBlbHNle1xuICAgIHRoaXMuY2hlY2tGb3JBY3RpdmVDYWxsQW5kRW5kQ2FsbCgpXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICBDb21ldENoYXQuYWNjZXB0Q2FsbCh0aGlzLmNhbGwhLmdldFNlc3Npb25JZCgpKVxuICAgICAgICAudGhlbigoY2FsbCkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsQWNjZXB0ZWQubmV4dChjYWxsKVxuICAgICAgICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIGNhbGwpXG4gICAgICAgICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlXG4gICAgICAgICAgdGhpcy5hY3RpdmVDYWxsID0gY2FsbFxuICAgICAgICAgIHRoaXMuc2Vzc2lvbklkID0gY2FsbD8uZ2V0U2Vzc2lvbklkKClcbiAgICAgICAgICB0aGlzLnNob3dJbmNvbWluZ0NhbGxTY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLmNhbGwgPSBjYWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5jaGVja0ZvckFjdGl2ZUNhbGxBbmRFbmRDYWxsID0gKCkgPT4ge1xuICBsZXQgY2FsbDpDb21ldENoYXQuQ2FsbCA9IENvbWV0Q2hhdC5nZXRBY3RpdmVDYWxsKClcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBpZiAoIWNhbGwpIHtcbiAgICAgIHJldHVybiByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICB9XG4gICAgbGV0IHNlc3Npb25JRCA9IGNhbGw/LmdldFNlc3Npb25JZCgpO1xuICAgIENvbWV0Q2hhdC5lbmRDYWxsKHNlc3Npb25JRClcbiAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuICB9KTtcbn07XG5yZWplY3RJbmNvbWluZ0NhbGwocmVhc29uOnN0cmluZyA9ICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5yZWplY3RlZCl7XG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpXG4gIGlmKHRoaXMub25EZWNsaW5lICYmIHRoaXMuY2FsbCl7XG4gICAgdGhpcy5vbkRlY2xpbmUodGhpcy5jYWxsKVxuICB9XG5lbHNle1xuXG5cdENvbWV0Q2hhdC5yZWplY3RDYWxsKHRoaXMuY2FsbCEuZ2V0U2Vzc2lvbklkKCksIHJlYXNvbilcbiAgLnRoZW4oKHJlamVjdGVkQ2FsbCkgPT4ge1xuICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIHJlamVjdGVkQ2FsbClcbiAgICAgQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5uZXh0KHJlamVjdGVkQ2FsbClcbiAgICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSBmYWxzZVxuICAgICB0aGlzLmFjdGl2ZUNhbGwgPSBudWxsXG4gICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9KVxuICAuY2F0Y2goKGVycm9yKSA9PiB7XG5pZih0aGlzLm9uRXJyb3Ipe1xuICB0aGlzLm9uRXJyb3IoZXJyb3IpXG59XG4gIH0pO1xufVxufVxuZ2V0Q2FsbEJ1aWxkZXIoKTogdHlwZW9mIENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzIHwgdW5kZWZpbmVkIHtcbiAgbGV0IGF1ZGlvT25seUNhbGw6IGJvb2xlYW4gPSB0aGlzLmFjdGl2ZUNhbGw/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8gPyB0cnVlIDogZmFsc2VcbiAgY29uc3QgY2FsbFNldHRpbmdzICA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuICAuZW5hYmxlRGVmYXVsdExheW91dCh0cnVlKVxuICAuc2V0SXNBdWRpb09ubHlDYWxsKGF1ZGlvT25seUNhbGwpXG4gIC5zZXRDYWxsTGlzdGVuZXIoXG4gICAgbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuT25nb2luZ0NhbGxMaXN0ZW5lcih7XG4gICAgICBvbkNhbGxFbmRlZDogKCkgPT4ge1xuICAgICAgICBpZih0aGlzLmNhbGw/LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcil7XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICB9XG5cbiAgICAgIH0sXG4gICAgICBvbkNhbGxFbmRCdXR0b25QcmVzc2VkOiAoKSA9PiB7XG4gICAgICBcbiAgICAgICAgaWYodGhpcy5jYWxsPy5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpe1xuICAgICAgICAgIENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklkKS50aGVuKChjYWxsOkNvbWV0Q2hhdC5DYWxsKT0+e1xuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoY2FsbCk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycjpDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKT0+e1xuICAgICAgICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH0pXG4gICAgICAgfVxuICAgICAgIGVsc2V7XG4gICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKClcbiAgICAgICB9XG5cblxuICAgICAgfSxcbiAgICAgIG9uRXJyb3I6IChlcnJvcjphbnkpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciA6XCIsIGVycm9yKTtcbiAgICAgIH0sXG4gICAgfSlcbiAgKVxuICAuYnVpbGQoKTtcbiAgcmV0dXJuIGNhbGxTZXR0aW5nc1xufVxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0aW5jb21pbmdDYWxsU3R5bGUoKVxuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKVxuICAgIHRoaXMuc2V0T25nb2luZ0NhbGxTdHlsZSgpXG4gICAgdGhpcy5pY29uU3R5bGUuaWNvblRpbnQgPSB0aGlzLmluY29taW5nQ2FsbFN0eWxlLnN1YnRpdGxlVGV4dENvbG9yXG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpe1xuICAgIGxldCBkZWZhdWx0U3R5bGU6TGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDpcInRyYW5zcGFyZW50XCJcbiAgICB9KVxuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsuLi5kZWZhdWx0U3R5bGUsLi4udGhpcy5saXN0SXRlbVN0eWxlfVxuICB9XG4gIHNldGluY29taW5nQ2FsbFN0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogSW5jb21pbmdDYWxsU3R5bGUgPSBuZXcgSW5jb21pbmdDYWxsU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ4MDAoXCJsaWdodFwiKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDgwMChcImRhcmtcIiksXG4gICAgICBhY2NlcHRCdXR0b25UZXh0Rm9udDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgYWNjZXB0QnV0dG9uVGV4dENvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIGFjY2VwdEJ1dHRvbkJhY2tncm91bmQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhY2NlcHRCdXR0b25Cb3JkZXJSYWRpdXM6XCI4cHhcIixcbiAgICAgIGFjY2VwdEJ1dHRvbkJvcmRlcjpcIm5vbmVcIixcbiAgICAgIGRlY2xpbmVCdXR0b25UZXh0Rm9udDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgZGVjbGluZUJ1dHRvblRleHRDb2xvcjp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBkZWNsaW5lQnV0dG9uQmFja2dyb3VuZDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBkZWNsaW5lQnV0dG9uQm9yZGVyUmFkaXVzOlwiOHB4XCIsXG4gICAgICBkZWNsaW5lQnV0dG9uQm9yZGVyOlwibm9uZVwiLFxuICAgIH0pXG4gICAgdGhpcy5pbmNvbWluZ0NhbGxTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmluY29taW5nQ2FsbFN0eWxlIH1cbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLmFjY2VwdEJ1dHRvblN0eWxlID0ge1xuICAgICAgYm9yZGVyOnRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYWNjZXB0QnV0dG9uQm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOnRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYWNjZXB0QnV0dG9uQm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDp0aGlzLmluY29taW5nQ2FsbFN0eWxlLmFjY2VwdEJ1dHRvbkJhY2tncm91bmQsXG4gICAgICBidXR0b25UZXh0Rm9udDp0aGlzLmluY29taW5nQ2FsbFN0eWxlLmFjY2VwdEJ1dHRvblRleHRGb250LFxuICAgICAgYnV0dG9uVGV4dENvbG9yOnRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYWNjZXB0QnV0dG9uVGV4dENvbG9yLFxuICAgICAgLi4udGhpcy5idXR0b25TdHlsZVxuICAgIH1cbiAgICB0aGlzLmRlY2xpbmVCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJvcmRlcjp0aGlzLmluY29taW5nQ2FsbFN0eWxlLmRlY2xpbmVCdXR0b25Cb3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6dGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5kZWNsaW5lQnV0dG9uQm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDp0aGlzLmluY29taW5nQ2FsbFN0eWxlLmRlY2xpbmVCdXR0b25CYWNrZ3JvdW5kLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6dGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5kZWNsaW5lQnV0dG9uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6dGhpcy5pbmNvbWluZ0NhbGxTdHlsZS5kZWNsaW5lQnV0dG9uVGV4dENvbG9yLFxuICAgICAgLi4udGhpcy5idXR0b25TdHlsZVxuICAgIH1cbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMzhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBcbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfVxuICB9XG4gIHN1YnRpdGxlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLmluY29taW5nQ2FsbFN0eWxlLnN1YnRpdGxlVGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuc3VidGl0bGVUZXh0Q29sb3JcbiAgICB9XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmluY29taW5nQ2FsbFN0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuaW5jb21pbmdDYWxsU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmluY29taW5nQ2FsbFN0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgIHBhZGRpbmc6XCI4cHhcIlxuICAgIH1cbiAgfVxufSIsIjxkaXYgY2xhc3M9XCJjYy1pbmNvbWluZy1jYWxsX193cmFwcGVyXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIiAqbmdJZj1cImNhbGwgJiYgc2hvd0luY29taW5nQ2FsbFNjcmVlblwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1pbmNvbWluZy1jYWxsX19saXN0aXRlbVwiPlxuICAgICAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwiY2FsbC5nZXRTZW5kZXIoKS5nZXROYW1lKClcIlxuICAgICAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwidHJ1ZVwiID5cbiAgICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgY2xhc3M9XCJjYy1pbmNvbWluZy1jYWxsX19zdWJ0aXRsZS12aWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXc7ZWxzZSBzdWJ0aXRsZVwiPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8bmctdGVtcGxhdGUgI3N1YnRpdGxlPlxuICAgICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiAgY2xhc3M9XCJjYy1pbmNvbWluZy1jYWxsX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGxfX2ljb25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtaWNvbiBbaWNvblN0eWxlXT1cImljb25TdHlsZVwiIFtVUkxdPVwiZ2V0Q2FsbFR5cGVJY29uKClcIj48L2NvbWV0Y2hhdC1pY29uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgY2xhc3M9XCJjYy1jYWxsX190eXBlXCIgW3RleHRdPVwic3VidGl0bGVUZXh0XCIgW2xhYmVsU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCI+XG5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgIGNsYXNzPVwiY2MtaW5jb21pbmctY2FsbF9fdGFpbC12aWV3XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ0YWlsX192aWV3XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWluY29taW5nLWNhbGxfX2F2YXRhclwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1hdmF0YXIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCIgW2ltYWdlXT1cImNhbGwuZ2V0U2VuZGVyKCkuZ2V0QXZhdGFyKClcIiBbbmFtZV09XCJjYWxsLmdldFNlbmRlcigpLmdldE5hbWUoKVwiPlxuXG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLWluY29taW5nLWNhbGwtYnV0dG9uc1wiPlxuICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwicmVqZWN0SW5jb21pbmdDYWxsKClcIiAgW2J1dHRvblN0eWxlXT1cImRlY2xpbmVCdXR0b25TdHlsZVwiIFt0ZXh0XT1cImRlY2xpbmVCdXR0b25UZXh0XCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiYWNjZXB0SW5jb21pbmdDYWxsKClcIiAgW2J1dHRvblN0eWxlXT1cImFjY2VwdEJ1dHRvblN0eWxlXCIgW3RleHRdPVwiYWNjZXB0QnV0dG9uVGV4dFwiID48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgIDwvZGl2PlxuPC9kaXY+XG48Y29tZXRjaGF0LW9uZ29pbmctY2FsbCAqbmdJZj1cInNob3dPbmdvaW5nQ2FsbCAmJiBhY3RpdmVDYWxsICYmICFzaG93SW5jb21pbmdDYWxsU2NyZWVuXCIgW29uZ29pbmdDYWxsU3R5bGVdPVwib25nb2luZ0NhbGxTdHlsZVwiIFtzZXNzaW9uSURdPVwic2Vzc2lvbklkXCIgIFtjYWxsU2V0dGluZ3NCdWlsZGVyXT1cImdldENhbGxCdWlsZGVyKCkhXCI+PC9jb21ldGNoYXQtb25nb2luZy1jYWxsPlxuIl19