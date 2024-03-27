import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { localize, CometChatUIKitConstants, fontHelper, CometChatCallEvents, CometChatMessageEvents, MessageStatus } from '@cometchat/uikit-resources';
import { CallButtonsStyle, CometChatSoundManager, CometChatUIKitUtility, OutgoingCallConfiguration, CallScreenConfiguration, CometChatUIKitCalls } from '@cometchat/uikit-shared';
import { CallscreenStyle } from '@cometchat/uikit-elements';
import '@cometchat/uikit-shared';
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "../../CometChatOngoingCall/cometchat-ongoing-call/cometchat-ongoing-call.component";
import * as i3 from "../../CometChatOutgoingCall/cometchat-outgoing-call/cometchat-outgoing-call.component";
import * as i4 from "@angular/common";
/**
*
* CometChatCallButtonsComponent is a component which shows buttons for audio and video call for 1v1 and group call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatCallButtonsComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.voiceCallIconURL = "assets/Audio-Call2x.svg";
        this.voiceCallIconText = localize("VOICE_CALL");
        this.voiceCallIconHoverText = localize("VOICE_CALL");
        this.videoCallIconURL = "assets/Video-call2x.svg";
        this.videoCallIconText = localize("VIDEO_CALL");
        this.videoCallIconHoverText = localize("VIDEO_CALL");
        this.onError = (error) => {
            console.log(error);
        };
        this.callButtonsStyle = {
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "0",
            background: "transparent"
        };
        this.outgoingCallConfiguration = new OutgoingCallConfiguration({});
        this.ongoingCallConfiguration = new CallScreenConfiguration({});
        this.disableButtons = false;
        this.showOngoingCall = false;
        this.sessionId = "";
        this.callbuttonsListenerId = "callbuttons_" + new Date().getTime();
        this.loggedInUser = null;
        this.buttonStyle = {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
        };
        this.voiceCallButtonStyle = {
            buttonIconTint: "RGB(51, 153, 255)",
            buttonTextFont: "400 12px Inter",
            buttonTextColor: "RGB(51, 153, 255)",
            padding: "8px 32px"
        };
        this.videoCallButtonStyle = {
            buttonIconTint: "RGB(51, 153, 255)",
            buttonTextFont: "400 12px Inter",
            buttonTextColor: "RGB(51, 153, 255)",
            padding: "8px 32px"
        };
        this.showOutgoingCallscreen = false;
        this.outgoingCallStyle = {
            width: "360px",
            height: "581px",
            titleTextFont: "700 22px Inter",
            titleTextColor: "RGB(20, 20, 20)",
            subtitleTextFont: "400 15px Inter",
            subtitleTextColor: "RGBA(20, 20, 20, 0.58)",
            borderRadius: "8px"
        };
        this.ongoingCallStyle = {};
        this.activeCall = null;
        this.cancelOutgoingCall = () => {
            CometChatSoundManager.pause();
            CometChat.rejectCall(this.call.getSessionId(), CometChatUIKitConstants.calls.cancelled)
                .then((call) => {
                this.disableButtons = false;
                this.showOutgoingCallscreen = false;
                CometChatCallEvents.ccCallRejected.next(call);
                this.call = null;
                this.ref.detectChanges();
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
            this.showOutgoingCallscreen = false;
            this.ref.detectChanges();
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
        this.wrapperStyle = () => {
            return {
                height: this.callButtonsStyle.height,
                width: this.callButtonsStyle.width,
                background: this.callButtonsStyle.background,
                border: this.callButtonsStyle.border,
                borderRadius: this.callButtonsStyle.borderRadius
            };
        };
    }
    ngOnInit() {
        CometChat.getLoggedinUser().then((user) => {
            this.loggedInUser = user;
        }).catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        this.setThemeStyle();
        this.attachListeners();
        this.subscribeToEvents();
    }
    ngOnDestroy() {
        this.removeListener();
        this.unsubscribeToEvents();
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
                if (this.onError) {
                    this.onError(error);
                }
            },
        }))
            .build();
        return callSettings;
    }
    closeCallScreen() {
        this.disableButtons = false;
        this.activeCall = null;
        this.showOngoingCall = false;
        this.sessionId = "";
        this.showOutgoingCallscreen = false;
        this.call = null;
        this.ref.detectChanges();
    }
    openOngoingCallScreen(call) {
        this.showOutgoingCallscreen = false;
        this.activeCall = call;
        this.sessionId = call.getSessionId();
        this.showOngoingCall = true;
        this.ref.detectChanges();
    }
    initiateCall(type) {
        const receiverType = this.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
        const receiverId = this.user ? this.user.getUid() : this.group.getGuid();
        const call = new CometChat.Call(receiverId, type, receiverType);
        CometChat.initiateCall(call)
            .then((outgoingCall) => {
            //when this component is part of chat widget trigger an event.. (outgoingcall component is used separately in chat widget)
            this.call = outgoingCall;
            this.showOutgoingCallscreen = true;
            this.ref.detectChanges();
            CometChatCallEvents.ccOutgoingCall.next(outgoingCall);
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    initiateAudioCall() {
        if (this.user) {
            this.initiateCall(CometChatUIKitConstants.MessageTypes.audio);
        }
    }
    initiateVideoCall() {
        if (this.user) {
            this.initiateCall(CometChatUIKitConstants.MessageTypes.video);
        }
        else {
            this.sessionId = this.group.getGuid();
            this.sendCustomMessage();
            this.showOngoingCall = true;
            this.ref.detectChanges();
        }
    }
    sendCustomMessage() {
        const receiverType = this.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
        const receiverId = this.user ? this.user.getUid() : this.group.getGuid();
        const customData = { "sessionID": this.sessionId, "sessionId": this.sessionId, "callType": CometChatUIKitConstants.MessageTypes.video };
        const customType = CometChatUIKitConstants.calls.meeting;
        const conversationId = `group_${this.sessionId}`;
        const customMessage = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);
        customMessage.setSender(this.loggedInUser);
        customMessage.setMetadata({ incrementUnreadCount: false });
        customMessage.setReceiver(receiverType);
        customMessage.setConversationId(conversationId);
        customMessage.sentAt = CometChatUIKitUtility.getUnixTimestamp();
        customMessage.muid = CometChatUIKitUtility.ID();
        // custom message
        CometChatMessageEvents.ccMessageSent.next({
            message: customMessage,
            status: MessageStatus.inprogress
        });
        CometChat.sendCustomMessage(customMessage).then((msg) => {
            CometChatMessageEvents.ccMessageSent.next({
                message: msg,
                status: MessageStatus.success
            });
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    getVoiceCallButtonStyle(disableButtons) {
        const buttonIconTint = disableButtons
            ? this.themeService.theme.palette.getAccent600()
            : this.callButtonsStyle.voiceCallIconTint;
        return {
            ...this.videoCallButtonStyle,
            buttonIconTint,
        };
    }
    getVideoCallButtonStyle(disableButtons) {
        const buttonIconTint = disableButtons
            ? this.themeService.theme.palette.getAccent600()
            : this.callButtonsStyle.videoCallIconTint;
        return {
            ...this.videoCallButtonStyle,
            buttonIconTint,
        };
    }
    attachListeners() {
        CometChat.addCallListener(this.callbuttonsListenerId, new CometChat.CallListener({
            onIncomingCallReceived: (call) => {
                this.call = call;
                this.disableButtons = true;
                this.ref.detectChanges();
            },
            onIncomingCallCancelled: (call) => {
                this.disableButtons = false;
                this.ref.detectChanges();
            },
            onOutgoingCallRejected: (call) => {
                this.disableButtons = false;
                this.call = null;
                this.showOutgoingCallscreen = false;
                this.ref.detectChanges();
            },
            onOutgoingCallAccepted: (call) => {
                this.call = call;
                this.openOngoingCallScreen(call);
            },
            onCallEndedMessageReceived: (call) => {
                this.disableButtons = false;
                this.call = null;
                this.ref.detectChanges();
            }
        }));
    }
    removeListener() {
        CometChat.removeCallListener(this.callbuttonsListenerId);
    }
    subscribeToEvents() {
        this.ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe((call) => {
            this.disableButtons = false;
            this.ref.detectChanges();
        });
        this.ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe((call) => {
            this.disableButtons = true;
            this.ref.detectChanges();
        });
        this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call) => {
            this.closeCallScreen();
        });
    }
    unsubscribeToEvents() {
        this.ccCallRejected?.unsubscribe();
        this.ccOutgoingCall?.unsubscribe();
        this.ccCallEnded?.unsubscribe();
    }
    setThemeStyle() {
        this.setcallButtonsStyle();
        this.setOngoingCallStyle();
    }
    setcallButtonsStyle() {
        let defaultStyle = new CallButtonsStyle({
            width: "100%",
            height: "100%",
            background: "transparent",
            border: "none",
            borderRadius: "0",
            voiceCallIconTint: this.themeService.theme.palette.getPrimary(),
            videoCallIconTint: this.themeService.theme.palette.getPrimary(),
            voiceCallIconTextFont: fontHelper(this.themeService.theme.typography.caption1),
            videoCallIconTextFont: fontHelper(this.themeService.theme.typography.caption1),
            voiceCallIconTextColor: this.themeService.theme.palette.getPrimary(),
            videoCallIconTextColor: this.themeService.theme.palette.getPrimary(),
            buttonPadding: "8px 32px",
            buttonBackground: this.themeService.theme.palette.getAccent100(),
            buttonBorder: "0",
            buttonBorderRadius: "8px"
        });
        this.callButtonsStyle = { ...defaultStyle, ...this.callButtonsStyle };
        this.voiceCallButtonStyle = {
            buttonIconTint: this.disableButtons ? this.themeService.theme.palette.getAccent600() : this.callButtonsStyle.voiceCallIconTint,
            buttonTextFont: this.callButtonsStyle.voiceCallIconTextFont,
            buttonTextColor: this.callButtonsStyle.voiceCallIconTextColor,
            padding: this.callButtonsStyle.buttonPadding,
            background: this.callButtonsStyle.buttonBackground,
            border: this.callButtonsStyle.border,
            borderRadius: this.callButtonsStyle.buttonBorderRadius,
            ...this.buttonStyle
        };
        this.videoCallButtonStyle = {
            buttonIconTint: this.disableButtons ? this.themeService.theme.palette.getAccent600() : this.callButtonsStyle.videoCallIconTint,
            buttonTextFont: this.callButtonsStyle.videoCallIconTextFont,
            buttonTextColor: this.callButtonsStyle.videoCallIconTextColor,
            padding: this.callButtonsStyle.buttonPadding,
            background: this.callButtonsStyle.buttonBackground,
            border: this.callButtonsStyle.border,
            borderRadius: this.callButtonsStyle.buttonBorderRadius,
            ...this.buttonStyle
        };
    }
}
CometChatCallButtonsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallButtonsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatCallButtonsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatCallButtonsComponent, selector: "cometchat-call-buttons", inputs: { user: "user", group: "group", voiceCallIconURL: "voiceCallIconURL", voiceCallIconText: "voiceCallIconText", voiceCallIconHoverText: "voiceCallIconHoverText", videoCallIconURL: "videoCallIconURL", videoCallIconText: "videoCallIconText", videoCallIconHoverText: "videoCallIconHoverText", onVoiceCallClick: "onVoiceCallClick", onVideoCallClick: "onVideoCallClick", onError: "onError", callButtonsStyle: "callButtonsStyle", outgoingCallConfiguration: "outgoingCallConfiguration", ongoingCallConfiguration: "ongoingCallConfiguration" }, ngImport: i0, template: "<div class=\"cc-call-buttons__wrapper\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-call-buttons-buttons\">\n    <cometchat-button [disabled]=\"disableButtons ? true : false\" *ngIf=\"user\" (cc-button-clicked)=\"initiateAudioCall()\"\n      [buttonStyle]=\"getVoiceCallButtonStyle(disableButtons)\" [text]=\"voiceCallIconText\"\n      [hoverText]=\"voiceCallIconHoverText\" [iconURL]=\"voiceCallIconURL\"></cometchat-button>\n    <cometchat-button [disabled]=\"disableButtons  ? true : false\" *ngIf=\"user || group\"\n      (cc-button-clicked)=\"initiateVideoCall()\" [buttonStyle]=\"getVideoCallButtonStyle(disableButtons)\"\n      [text]=\"videoCallIconText\" [hoverText]=\"videoCallIconHoverText\" [iconURL]=\"videoCallIconURL\"></cometchat-button>\n  </div>\n</div>\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\" [maximizeIconURL]=\"ongoingCallConfiguration.maximizeIconURL\"\n  [minimizeIconURL]=\"ongoingCallConfiguration.minimizeIconURL\"\n  [ongoingCallStyle]=\"ongoingCallConfiguration.ongoingCallStyle || ongoingCallStyle\" [sessionID]=\"sessionId\"\n  [callSettingsBuilder]=\"getCallBuilder()!\"></cometchat-ongoing-call>\n<cometchat-backdrop *ngIf=\"showOutgoingCallscreen\">\n  <cometchat-outgoing-call [customSoundForCalls]=\"outgoingCallConfiguration.customSoundForCalls\"\n    [onError]=\"outgoingCallConfiguration.onError\"\n    [disableSoundForCalls]=\"outgoingCallConfiguration.disableSoundForCalls\"\n    [avatarStyle]=\"outgoingCallConfiguration.avatarStyle\" [customView]=\"outgoingCallConfiguration.customView\"\n    [declineButtonIconURL]=\"outgoingCallConfiguration.declineButtonIconURL\"\n    [onCloseClicked]=\"outgoingCallConfiguration.onCloseClicked || cancelOutgoingCall\"\n    [outgoingCallStyle]=\"outgoingCallConfiguration.outgoingCallStyle || outgoingCallStyle\"\n    [call]=\"call!\"></cometchat-outgoing-call>\n</cometchat-backdrop>", styles: [".cc-call-buttons__wrapper{height:100%;width:100%}.cc-call-buttons-buttons{display:flex;gap:8px}\n"], components: [{ type: i2.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i3.CometChatOutgoingCallComponent, selector: "cometchat-outgoing-call", inputs: ["call", "declineButtonText", "declineButtonIconURL", "customView", "onError", "disableSoundForCalls", "customSoundForCalls", "avatarStyle", "outgoingCallStyle", "onCloseClicked"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallButtonsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-call-buttons", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-call-buttons__wrapper\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-call-buttons-buttons\">\n    <cometchat-button [disabled]=\"disableButtons ? true : false\" *ngIf=\"user\" (cc-button-clicked)=\"initiateAudioCall()\"\n      [buttonStyle]=\"getVoiceCallButtonStyle(disableButtons)\" [text]=\"voiceCallIconText\"\n      [hoverText]=\"voiceCallIconHoverText\" [iconURL]=\"voiceCallIconURL\"></cometchat-button>\n    <cometchat-button [disabled]=\"disableButtons  ? true : false\" *ngIf=\"user || group\"\n      (cc-button-clicked)=\"initiateVideoCall()\" [buttonStyle]=\"getVideoCallButtonStyle(disableButtons)\"\n      [text]=\"videoCallIconText\" [hoverText]=\"videoCallIconHoverText\" [iconURL]=\"videoCallIconURL\"></cometchat-button>\n  </div>\n</div>\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\" [maximizeIconURL]=\"ongoingCallConfiguration.maximizeIconURL\"\n  [minimizeIconURL]=\"ongoingCallConfiguration.minimizeIconURL\"\n  [ongoingCallStyle]=\"ongoingCallConfiguration.ongoingCallStyle || ongoingCallStyle\" [sessionID]=\"sessionId\"\n  [callSettingsBuilder]=\"getCallBuilder()!\"></cometchat-ongoing-call>\n<cometchat-backdrop *ngIf=\"showOutgoingCallscreen\">\n  <cometchat-outgoing-call [customSoundForCalls]=\"outgoingCallConfiguration.customSoundForCalls\"\n    [onError]=\"outgoingCallConfiguration.onError\"\n    [disableSoundForCalls]=\"outgoingCallConfiguration.disableSoundForCalls\"\n    [avatarStyle]=\"outgoingCallConfiguration.avatarStyle\" [customView]=\"outgoingCallConfiguration.customView\"\n    [declineButtonIconURL]=\"outgoingCallConfiguration.declineButtonIconURL\"\n    [onCloseClicked]=\"outgoingCallConfiguration.onCloseClicked || cancelOutgoingCall\"\n    [outgoingCallStyle]=\"outgoingCallConfiguration.outgoingCallStyle || outgoingCallStyle\"\n    [call]=\"call!\"></cometchat-outgoing-call>\n</cometchat-backdrop>", styles: [".cc-call-buttons__wrapper{height:100%;width:100%}.cc-call-buttons-buttons{display:flex;gap:8px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { user: [{
                type: Input
            }], group: [{
                type: Input
            }], voiceCallIconURL: [{
                type: Input
            }], voiceCallIconText: [{
                type: Input
            }], voiceCallIconHoverText: [{
                type: Input
            }], videoCallIconURL: [{
                type: Input
            }], videoCallIconText: [{
                type: Input
            }], videoCallIconHoverText: [{
                type: Input
            }], onVoiceCallClick: [{
                type: Input
            }], onVideoCallClick: [{
                type: Input
            }], onError: [{
                type: Input
            }], callButtonsStyle: [{
                type: Input
            }], outgoingCallConfiguration: [{
                type: Input
            }], ongoingCallConfiguration: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsdUJBQXVCLEVBQXFCLFNBQVMsRUFBRSxLQUFLLEVBQVUsTUFBTSxlQUFlLENBQUM7QUFDckcsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGFBQWEsRUFBd0MsTUFBTSw0QkFBNEIsQ0FBQztBQUU3TCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQXFCLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDcE0sT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFBO0FBQ3pELE9BQU8seUJBQXlCLENBQUE7Ozs7OztBQUNoQzs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyw2QkFBNkI7SUFnRXhDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUE3RDlF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QixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBR0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQU9HLHlCQUF5QjtzQkFBakMsS0FBSztnQkFDRyx3QkFBd0I7c0JBQWhDLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSAnQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0JztcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgbG9jYWxpemUsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBmb250SGVscGVyLCBDb21ldENoYXRDYWxsRXZlbnRzLCBDb21ldENoYXRNZXNzYWdlRXZlbnRzLCBNZXNzYWdlU3RhdHVzLCBDb21ldENoYXRMb2NhbGl6ZSwgQ29tZXRDaGF0VUlFdmVudHMgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcyc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IENhbGxCdXR0b25zU3R5bGUsIENvbWV0Q2hhdFNvdW5kTWFuYWdlciwgT3V0Z29pbmdDYWxsU3R5bGUgLENvbWV0Q2hhdFVJS2l0VXRpbGl0eSwgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbiwgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24sIENvbWV0Q2hhdFVJS2l0Q2FsbHN9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCB7Q2FsbHNjcmVlblN0eWxlfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCdcbi8qKlxuKlxuKiBDb21ldENoYXRDYWxsQnV0dG9uc0NvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB3aGljaCBzaG93cyBidXR0b25zIGZvciBhdWRpbyBhbmQgdmlkZW8gY2FsbCBmb3IgMXYxIGFuZCBncm91cCBjYWxsLlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1jYWxsLWJ1dHRvbnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtY2FsbC1idXR0b25zLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY2FsbC1idXR0b25zLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDYWxsQnV0dG9uc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIHZvaWNlQ2FsbEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL0F1ZGlvLUNhbGwyeC5zdmdcIlxuICBASW5wdXQoKSB2b2ljZUNhbGxJY29uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJWT0lDRV9DQUxMXCIpXG4gIEBJbnB1dCgpIHZvaWNlQ2FsbEljb25Ib3ZlclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVk9JQ0VfQ0FMTFwiKVxuICBASW5wdXQoKSB2aWRlb0NhbGxJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9WaWRlby1jYWxsMnguc3ZnXCJcbiAgQElucHV0KCkgdmlkZW9DYWxsSWNvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVklERU9fQ0FMTFwiKVxuICBASW5wdXQoKSB2aWRlb0NhbGxJY29uSG92ZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlZJREVPX0NBTExcIilcbiAgQElucHV0KCkgb25Wb2ljZUNhbGxDbGljayE6ICgodXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHZvaWQpIHwgbnVsbDtcbiAgQElucHV0KCkgb25WaWRlb0NhbGxDbGljayE6ICgodXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHZvaWQpIHwgbnVsbDtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgY2FsbEJ1dHRvbnNTdHlsZTogQ2FsbEJ1dHRvbnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gIH07XG4gIEBJbnB1dCgpIG91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb246T3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbiA9IG5ldyBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uKHt9KVxuICBASW5wdXQoKSBvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb246Q2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24gPSBuZXcgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24oe30pXG4gIGNhbGwhOiBDb21ldENoYXQuQ2FsbCB8IG51bGw7XG4gIHB1YmxpYyBjY091dGdvaW5nQ2FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbFJlamVjdGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBkaXNhYmxlQnV0dG9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93T25nb2luZ0NhbGw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2Vzc2lvbklkOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgY2FsbGJ1dHRvbnNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNhbGxidXR0b25zX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG4gIGJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICB9XG4gIHZvaWNlQ2FsbEJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiUkdCKDUxLCAxNTMsIDI1NSlcIixcbiAgICBidXR0b25UZXh0Rm9udDogXCI0MDAgMTJweCBJbnRlclwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIHBhZGRpbmc6IFwiOHB4IDMycHhcIlxuICB9XG4gIHZpZGVvQ2FsbEJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiUkdCKDUxLCAxNTMsIDI1NSlcIixcbiAgICBidXR0b25UZXh0Rm9udDogXCI0MDAgMTJweCBJbnRlclwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIHBhZGRpbmc6IFwiOHB4IDMycHhcIlxuICB9XG4gIHNob3dPdXRnb2luZ0NhbGxzY3JlZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgb3V0Z29pbmdDYWxsU3R5bGU6IE91dGdvaW5nQ2FsbFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjM2MHB4XCIsXG4gICAgaGVpZ2h0OiBcIjU4MXB4XCIsXG4gICAgdGl0bGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICAgIHRpdGxlVGV4dENvbG9yOiBcIlJHQigyMCwgMjAsIDIwKVwiLFxuICAgIHN1YnRpdGxlVGV4dEZvbnQ6IFwiNDAwIDE1cHggSW50ZXJcIixcbiAgICBzdWJ0aXRsZVRleHRDb2xvcjogXCJSR0JBKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gIH07XG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9XG4gIGFjdGl2ZUNhbGw6IENvbWV0Q2hhdC5DYWxsIHwgbnVsbCA9IG51bGxcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6Q29tZXRDaGF0LlVzZXIgfCBudWxsKT0+e1xuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyXG4gICAgfSkuY2F0Y2goKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG4gICAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKVxuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKClcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKClcbiAgfVxuICBnZXRDYWxsQnVpbGRlcigpOiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3MgfCB1bmRlZmluZWQge1xuICAgIGxldCBhdWRpb09ubHlDYWxsOiBib29sZWFuID0gdGhpcy5hY3RpdmVDYWxsPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvID8gdHJ1ZSA6IGZhbHNlXG4gICAgY29uc3QgY2FsbFNldHRpbmdzID0gbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzQnVpbGRlcigpXG4gICAgLmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSlcbiAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGF1ZGlvT25seUNhbGwpXG4gICAgLnNldENhbGxMaXN0ZW5lcihcbiAgICAgIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLk9uZ29pbmdDYWxsTGlzdGVuZXIoe1xuICAgICAgICBvbkNhbGxFbmRlZDogKCkgPT4ge1xuICAgICAgICAgIGlmKHRoaXMuY2FsbD8uZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKXtcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBvbkNhbGxFbmRCdXR0b25QcmVzc2VkOiAoKSA9PiB7XG4gICAgICAgICAgaWYodGhpcy5jYWxsPy5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpe1xuICAgICAgICAgICAgQ29tZXRDaGF0LmVuZENhbGwodGhpcy5zZXNzaW9uSWQpLnRoZW4oKGNhbGw6Q29tZXRDaGF0LkNhbGwpPT57XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpO1xuICAgICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoY2FsbCk7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnI6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgICAgICAgICAgICAgaWYodGhpcy5vbkVycm9yKXtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgICB9XG4gICAgICAgICBlbHNle1xuICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICB9XG5cblxuICAgICAgICB9LFxuICAgICAgICBvbkVycm9yOiAoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmKHRoaXMub25FcnJvcil7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApXG4gICAgLmJ1aWxkKCk7XG4gICAgcmV0dXJuIGNhbGxTZXR0aW5nc1xuICB9XG4gIGNsb3NlQ2FsbFNjcmVlbigpe1xuICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgIHRoaXMuYWN0aXZlQ2FsbCA9IG51bGxcbiAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlXG4gICAgdGhpcy5zZXNzaW9uSWQgPSBcIlwiXG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBvcGVuT25nb2luZ0NhbGxTY3JlZW4oY2FsbDogQ29tZXRDaGF0LkNhbGwpIHtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZUNhbGwgPSBjYWxsXG4gICAgdGhpcy5zZXNzaW9uSWQgPSBjYWxsLmdldFNlc3Npb25JZCgpXG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgaW5pdGlhdGVDYWxsKHR5cGU6IHN0cmluZykge1xuXG4gICAgY29uc3QgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgY29uc3QgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyID8gdGhpcy51c2VyLmdldFVpZCgpIDogdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICBjb25zdCBjYWxsOiBDb21ldENoYXQuQ2FsbCA9IG5ldyBDb21ldENoYXQuQ2FsbChcbiAgICAgIHJlY2VpdmVySWQsXG4gICAgICB0eXBlLFxuICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgKTtcbiAgICBDb21ldENoYXQuaW5pdGlhdGVDYWxsKGNhbGwpXG4gICAgICAudGhlbigob3V0Z29pbmdDYWxsKSA9PiB7XG4gICAgICAgIC8vd2hlbiB0aGlzIGNvbXBvbmVudCBpcyBwYXJ0IG9mIGNoYXQgd2lkZ2V0IHRyaWdnZXIgYW4gZXZlbnQuLiAob3V0Z29pbmdjYWxsIGNvbXBvbmVudCBpcyB1c2VkIHNlcGFyYXRlbHkgaW4gY2hhdCB3aWRnZXQpXG4gICAgICAgIHRoaXMuY2FsbCA9IG91dGdvaW5nQ2FsbFxuICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSB0cnVlO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5uZXh0KFxuICAgICAgICAgIG91dGdvaW5nQ2FsbFxuICAgICAgICApXG5cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgaW5pdGlhdGVBdWRpb0NhbGwoKSB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgdGhpcy5pbml0aWF0ZUNhbGwoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvKVxuICAgIH1cbiAgfVxuICBpbml0aWF0ZVZpZGVvQ2FsbCgpIHtcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICB0aGlzLmluaXRpYXRlQ2FsbChDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zZXNzaW9uSWQgPSB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgICAgdGhpcy5zZW5kQ3VzdG9tTWVzc2FnZSgpXG4gICAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IHRydWU7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcblxuICAgIH1cbiAgfVxuICBzZW5kQ3VzdG9tTWVzc2FnZSgpIHtcbiAgICBjb25zdCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlciA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICBjb25zdCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyB0aGlzLnVzZXIuZ2V0VWlkKCkgOiB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgIGNvbnN0IGN1c3RvbURhdGEgPSB7IFwic2Vzc2lvbklEXCI6IHRoaXMuc2Vzc2lvbklkLCBcInNlc3Npb25JZFwiOiB0aGlzLnNlc3Npb25JZCwgXCJjYWxsVHlwZVwiOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8gfTtcbiAgICBjb25zdCBjdXN0b21UeXBlID0gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLm1lZXRpbmc7XG4gICAgY29uc3QgY29udmVyc2F0aW9uSWQgPSBgZ3JvdXBfJHt0aGlzLnNlc3Npb25JZH1gO1xuXG4gICAgY29uc3QgY3VzdG9tTWVzc2FnZTogYW55ID0gbmV3IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSwgY3VzdG9tVHlwZSwgY3VzdG9tRGF0YSk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIpO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBpbmNyZW1lbnRVbnJlYWRDb3VudDogZmFsc2UgfSk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRSZWNlaXZlcigocmVjZWl2ZXJUeXBlIGFzIGFueSkpO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoY29udmVyc2F0aW9uSWQpO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2VudEF0ID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKTtcbiAgICBjdXN0b21NZXNzYWdlLm11aWQgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKTtcbiAgICAvLyBjdXN0b20gbWVzc2FnZVxuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgIG1lc3NhZ2U6Y3VzdG9tTWVzc2FnZSxcbiAgICAgIHN0YXR1czpNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3NcbiAgICB9KVxuICAgIENvbWV0Q2hhdC5zZW5kQ3VzdG9tTWVzc2FnZShjdXN0b21NZXNzYWdlKS50aGVuKChtc2cpID0+IHtcbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTptc2csXG4gICAgICAgIHN0YXR1czpNZXNzYWdlU3RhdHVzLnN1Y2Nlc3NcbiAgICAgIH0pXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycm9yOkNvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pPT57XG4gICAgIGlmKHRoaXMub25FcnJvcil7XG4gICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgIH1cbiAgICB9KVxuXG4gIH1cbiAgY2FuY2VsT3V0Z29pbmdDYWxsID0gKCkgPT4ge1xuICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpXG4gICAgQ29tZXRDaGF0LnJlamVjdENhbGwoXG4gICAgICB0aGlzLmNhbGwhLmdldFNlc3Npb25JZCgpLFxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuY2FuY2VsbGVkXG4gICAgKVxuICAgICAgLnRoZW4oKGNhbGwpID0+IHtcbiAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZVxuICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLm5leHQoY2FsbClcbiAgICAgICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBnZXRWb2ljZUNhbGxCdXR0b25TdHlsZShkaXNhYmxlQnV0dG9uczpib29sZWFuKXtcbiAgICBjb25zdCBidXR0b25JY29uVGludCA9IGRpc2FibGVCdXR0b25zXG4gICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudm9pY2VDYWxsSWNvblRpbnQ7XG5cbiAgcmV0dXJuIHtcbiAgICAuLi50aGlzLnZpZGVvQ2FsbEJ1dHRvblN0eWxlLFxuICAgIGJ1dHRvbkljb25UaW50LFxuICB9O1xuICB9XG4gIGdldFZpZGVvQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uSWNvblRpbnQgPSBkaXNhYmxlQnV0dG9uc1xuICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGludDtcblxuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLnZpZGVvQ2FsbEJ1dHRvblN0eWxlLFxuICAgICAgYnV0dG9uSWNvblRpbnQsXG4gICAgfTtcbiAgfVxuXG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgdGhpcy5jYWxsYnV0dG9uc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgIG9uSW5jb21pbmdDYWxsUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuY2FsbCA9IGNhbGw7XG4gICAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IHRydWVcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSxcbiAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSxcbiAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlXG4gICAgICAgICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSxcbiAgICAgICAgb25PdXRnb2luZ0NhbGxBY2NlcHRlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5jYWxsID0gY2FsbDtcbiAgICAgICAgICB0aGlzLm9wZW5PbmdvaW5nQ2FsbFNjcmVlbihjYWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6KGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlXG4gICAgICAgICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDYWxsTGlzdGVuZXIodGhpcy5jYWxsYnV0dG9uc0xpc3RlbmVySWQpO1xuICB9XG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NDYWxsUmVqZWN0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfSlcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5zdWJzY3JpYmUoKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gdHJ1ZVxuICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pXG4gICAgdGhpcy5jY0NhbGxFbmRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQuc3Vic2NyaWJlKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xudGhpcy5jbG9zZUNhbGxTY3JlZW4oKVxuICAgIH0pXG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkPy51bnN1YnNjcmliZSgpXG4gICAgdGhpcy5jY091dGdvaW5nQ2FsbD8udW5zdWJzY3JpYmUoKVxuICAgIHRoaXMuY2NDYWxsRW5kZWQ/LnVuc3Vic2NyaWJlKClcbiAgfVxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0Y2FsbEJ1dHRvbnNTdHlsZSgpXG4gICAgdGhpcy5zZXRPbmdvaW5nQ2FsbFN0eWxlKClcbiAgfVxuICBzZXRPbmdvaW5nQ2FsbFN0eWxlID0gKCkgPT4ge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgQ2FsbHNjcmVlblN0eWxlKHtcbiAgICAgIG1heEhlaWdodDogXCIxMDAlXCIsXG4gICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiIzFjMjIyNlwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjQwMHB4XCIsXG4gICAgICBtaW5XaWR0aDogXCI0MDBweFwiLFxuICAgICAgbWluaW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfSlcbiAgICB0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH1cbiAgfVxuICBzZXRjYWxsQnV0dG9uc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENhbGxCdXR0b25zU3R5bGUgPSBuZXcgQ2FsbEJ1dHRvbnNTdHlsZSh7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB2b2ljZUNhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB2aWRlb0NhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB2b2ljZUNhbGxJY29uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICB2aWRlb0NhbGxJY29uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICB2b2ljZUNhbGxJY29uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHZpZGVvQ2FsbEljb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYnV0dG9uUGFkZGluZzogXCI4cHggMzJweFwiLFxuICAgICAgYnV0dG9uQmFja2dyb3VuZDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYnV0dG9uQm9yZGVyOlwiMFwiLFxuICAgICAgYnV0dG9uQm9yZGVyUmFkaXVzOlwiOHB4XCJcbiAgICB9KVxuICAgIHRoaXMuY2FsbEJ1dHRvbnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNhbGxCdXR0b25zU3R5bGUgfVxuICAgIHRoaXMudm9pY2VDYWxsQnV0dG9uU3R5bGUgPSB7XG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5kaXNhYmxlQnV0dG9ucyA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCkgOiAgdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZvaWNlQ2FsbEljb25UaW50LFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dENvbG9yLFxuICAgICAgcGFkZGluZzogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvblBhZGRpbmcsXG4gICAgICBiYWNrZ3JvdW5kOnRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25CYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOnRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6dGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJvcmRlclJhZGl1cyxcbiAgICAgIC4uLnRoaXMuYnV0dG9uU3R5bGVcbiAgICB9XG4gICAgdGhpcy52aWRlb0NhbGxCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmRpc2FibGVCdXR0b25zID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSA6ICAgdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZpZGVvQ2FsbEljb25UaW50LFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGV4dENvbG9yLFxuICAgICAgcGFkZGluZzogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvblBhZGRpbmcsXG4gICAgICBiYWNrZ3JvdW5kOnRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25CYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOnRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6dGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJvcmRlclJhZGl1cyxcbiAgICAgIC4uLnRoaXMuYnV0dG9uU3R5bGVcbiAgICB9XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1jYWxsLWJ1dHRvbnNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtY2FsbC1idXR0b25zLWJ1dHRvbnNcIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbZGlzYWJsZWRdPVwiZGlzYWJsZUJ1dHRvbnMgPyB0cnVlIDogZmFsc2VcIiAqbmdJZj1cInVzZXJcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaW5pdGlhdGVBdWRpb0NhbGwoKVwiXG4gICAgICBbYnV0dG9uU3R5bGVdPVwiZ2V0Vm9pY2VDYWxsQnV0dG9uU3R5bGUoZGlzYWJsZUJ1dHRvbnMpXCIgW3RleHRdPVwidm9pY2VDYWxsSWNvblRleHRcIlxuICAgICAgW2hvdmVyVGV4dF09XCJ2b2ljZUNhbGxJY29uSG92ZXJUZXh0XCIgW2ljb25VUkxdPVwidm9pY2VDYWxsSWNvblVSTFwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbZGlzYWJsZWRdPVwiZGlzYWJsZUJ1dHRvbnMgID8gdHJ1ZSA6IGZhbHNlXCIgKm5nSWY9XCJ1c2VyIHx8IGdyb3VwXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJpbml0aWF0ZVZpZGVvQ2FsbCgpXCIgW2J1dHRvblN0eWxlXT1cImdldFZpZGVvQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zKVwiXG4gICAgICBbdGV4dF09XCJ2aWRlb0NhbGxJY29uVGV4dFwiIFtob3ZlclRleHRdPVwidmlkZW9DYWxsSWNvbkhvdmVyVGV4dFwiIFtpY29uVVJMXT1cInZpZGVvQ2FsbEljb25VUkxcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuPC9kaXY+XG48Y29tZXRjaGF0LW9uZ29pbmctY2FsbCAqbmdJZj1cInNob3dPbmdvaW5nQ2FsbFwiIFttYXhpbWl6ZUljb25VUkxdPVwib25nb2luZ0NhbGxDb25maWd1cmF0aW9uLm1heGltaXplSWNvblVSTFwiXG4gIFttaW5pbWl6ZUljb25VUkxdPVwib25nb2luZ0NhbGxDb25maWd1cmF0aW9uLm1pbmltaXplSWNvblVSTFwiXG4gIFtvbmdvaW5nQ2FsbFN0eWxlXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbmdvaW5nQ2FsbFN0eWxlIHx8IG9uZ29pbmdDYWxsU3R5bGVcIiBbc2Vzc2lvbklEXT1cInNlc3Npb25JZFwiXG4gIFtjYWxsU2V0dGluZ3NCdWlsZGVyXT1cImdldENhbGxCdWlsZGVyKCkhXCI+PC9jb21ldGNoYXQtb25nb2luZy1jYWxsPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cInNob3dPdXRnb2luZ0NhbGxzY3JlZW5cIj5cbiAgPGNvbWV0Y2hhdC1vdXRnb2luZy1jYWxsIFtjdXN0b21Tb3VuZEZvckNhbGxzXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY3VzdG9tU291bmRGb3JDYWxsc1wiXG4gICAgW29uRXJyb3JdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbZGlzYWJsZVNvdW5kRm9yQ2FsbHNdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5kaXNhYmxlU291bmRGb3JDYWxsc1wiXG4gICAgW2F2YXRhclN0eWxlXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIiBbY3VzdG9tVmlld109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmN1c3RvbVZpZXdcIlxuICAgIFtkZWNsaW5lQnV0dG9uSWNvblVSTF09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmRlY2xpbmVCdXR0b25JY29uVVJMXCJcbiAgICBbb25DbG9zZUNsaWNrZWRdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkNsb3NlQ2xpY2tlZCB8fCBjYW5jZWxPdXRnb2luZ0NhbGxcIlxuICAgIFtvdXRnb2luZ0NhbGxTdHlsZV09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm91dGdvaW5nQ2FsbFN0eWxlIHx8IG91dGdvaW5nQ2FsbFN0eWxlXCJcbiAgICBbY2FsbF09XCJjYWxsIVwiPjwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGw+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD4iXX0=