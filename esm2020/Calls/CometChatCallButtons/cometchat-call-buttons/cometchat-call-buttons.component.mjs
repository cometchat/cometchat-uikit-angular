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
        customMessage.setMetadata({ incrementUnreadCount: true });
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
                if (this.call && this.call.getSessionId() == call.getSessionId()) {
                    this.disableButtons = false;
                    this.call = null;
                    this.showOutgoingCallscreen = false;
                    this.ref.detectChanges();
                }
            },
            onOutgoingCallAccepted: (call) => {
                if (this.call && this.call.getSessionId() == call.getSessionId()) {
                    this.call = call;
                    this.openOngoingCallScreen(call);
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsdUJBQXVCLEVBQXFCLFNBQVMsRUFBRSxLQUFLLEVBQVUsTUFBTSxlQUFlLENBQUM7QUFDckcsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGFBQWEsRUFBd0MsTUFBTSw0QkFBNEIsQ0FBQztBQUU3TCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQXFCLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDck0sT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBQzNELE9BQU8seUJBQXlCLENBQUE7Ozs7OztBQUNoQzs7Ozs7Ozs7RUFRRTtBQU9GLE1BQU0sT0FBTyw2QkFBNkI7SUFnRXhDLFlBQW9CLEdBQXNCLEVBQVUsWUFBbUM7UUFBbkUsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUE3RDlF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NEZEQVIsNkJBQTZCO2tCQU56QyxTQUFTOytCQUNFLHdCQUF3QixtQkFHakIsdUJBQXVCLENBQUMsTUFBTTs0SUFHdEMsSUFBSTtzQkFBWixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFHRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBT0cseUJBQXlCO3NCQUFqQyxLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZSc7XG5pbXBvcnQgeyBsb2NhbGl6ZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIGZvbnRIZWxwZXIsIENvbWV0Q2hhdENhbGxFdmVudHMsIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsIE1lc3NhZ2VTdGF0dXMsIENvbWV0Q2hhdExvY2FsaXplLCBDb21ldENoYXRVSUV2ZW50cyB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgQ2FsbEJ1dHRvbnNTdHlsZSwgQ29tZXRDaGF0U291bmRNYW5hZ2VyLCBPdXRnb2luZ0NhbGxTdHlsZSwgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LCBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLCBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbiwgQ29tZXRDaGF0VUlLaXRDYWxscyB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCB7IENhbGxzY3JlZW5TdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJ1xuLyoqXG4qXG4qIENvbWV0Q2hhdENhbGxCdXR0b25zQ29tcG9uZW50IGlzIGEgY29tcG9uZW50IHdoaWNoIHNob3dzIGJ1dHRvbnMgZm9yIGF1ZGlvIGFuZCB2aWRlbyBjYWxsIGZvciAxdjEgYW5kIGdyb3VwIGNhbGwuXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWNhbGwtYnV0dG9uc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENhbGxCdXR0b25zQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgdm9pY2VDYWxsSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvQXVkaW8tQ2FsbDJ4LnN2Z1wiXG4gIEBJbnB1dCgpIHZvaWNlQ2FsbEljb25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlZPSUNFX0NBTExcIilcbiAgQElucHV0KCkgdm9pY2VDYWxsSWNvbkhvdmVyVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJWT0lDRV9DQUxMXCIpXG4gIEBJbnB1dCgpIHZpZGVvQ2FsbEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1ZpZGVvLWNhbGwyeC5zdmdcIlxuICBASW5wdXQoKSB2aWRlb0NhbGxJY29uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJWSURFT19DQUxMXCIpXG4gIEBJbnB1dCgpIHZpZGVvQ2FsbEljb25Ib3ZlclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVklERU9fQ0FMTFwiKVxuICBASW5wdXQoKSBvblZvaWNlQ2FsbENsaWNrITogKCh1c2VyOiBDb21ldENoYXQuVXNlciwgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4gdm9pZCkgfCBudWxsO1xuICBASW5wdXQoKSBvblZpZGVvQ2FsbENsaWNrITogKCh1c2VyOiBDb21ldENoYXQuVXNlciwgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4gdm9pZCkgfCBudWxsO1xuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgfVxuICBASW5wdXQoKSBjYWxsQnV0dG9uc1N0eWxlOiBDYWxsQnV0dG9uc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgfTtcbiAgQElucHV0KCkgb3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbjogT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbiA9IG5ldyBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uKHt9KVxuICBASW5wdXQoKSBvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb246IENhbGxTY3JlZW5Db25maWd1cmF0aW9uID0gbmV3IENhbGxTY3JlZW5Db25maWd1cmF0aW9uKHt9KVxuICBjYWxsITogQ29tZXRDaGF0LkNhbGwgfCBudWxsO1xuICBwdWJsaWMgY2NPdXRnb2luZ0NhbGwhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxSZWplY3RlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgZGlzYWJsZUJ1dHRvbnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd09uZ29pbmdDYWxsOiBib29sZWFuID0gZmFsc2U7XG4gIHNlc3Npb25JZDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIGNhbGxidXR0b25zTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjYWxsYnV0dG9uc19cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBidXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgfVxuICB2b2ljZUNhbGxCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGJ1dHRvbkljb25UaW50OiBcIlJHQig1MSwgMTUzLCAyNTUpXCIsXG4gICAgYnV0dG9uVGV4dEZvbnQ6IFwiNDAwIDEycHggSW50ZXJcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IFwiUkdCKDUxLCAxNTMsIDI1NSlcIixcbiAgICBwYWRkaW5nOiBcIjhweCAzMnB4XCJcbiAgfVxuICB2aWRlb0NhbGxCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGJ1dHRvbkljb25UaW50OiBcIlJHQig1MSwgMTUzLCAyNTUpXCIsXG4gICAgYnV0dG9uVGV4dEZvbnQ6IFwiNDAwIDEycHggSW50ZXJcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IFwiUkdCKDUxLCAxNTMsIDI1NSlcIixcbiAgICBwYWRkaW5nOiBcIjhweCAzMnB4XCJcbiAgfVxuICBzaG93T3V0Z29pbmdDYWxsc2NyZWVuOiBib29sZWFuID0gZmFsc2U7XG4gIG91dGdvaW5nQ2FsbFN0eWxlOiBPdXRnb2luZ0NhbGxTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIzNjBweFwiLFxuICAgIGhlaWdodDogXCI1ODFweFwiLFxuICAgIHRpdGxlVGV4dEZvbnQ6IFwiNzAwIDIycHggSW50ZXJcIixcbiAgICB0aXRsZVRleHRDb2xvcjogXCJSR0IoMjAsIDIwLCAyMClcIixcbiAgICBzdWJ0aXRsZVRleHRGb250OiBcIjQwMCAxNXB4IEludGVyXCIsXG4gICAgc3VidGl0bGVUZXh0Q29sb3I6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIlxuICB9O1xuICBvbmdvaW5nQ2FsbFN0eWxlOiBDYWxsc2NyZWVuU3R5bGUgPSB7fVxuICBhY3RpdmVDYWxsOiBDb21ldENoYXQuQ2FsbCB8IG51bGwgPSBudWxsXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkgeyB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlclxuICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKVxuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKClcbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKClcbiAgfVxuICBnZXRDYWxsQnVpbGRlcigpOiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3MgfCB1bmRlZmluZWQge1xuICAgIGxldCBhdWRpb09ubHlDYWxsOiBib29sZWFuID0gdGhpcy5hY3RpdmVDYWxsPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvID8gdHJ1ZSA6IGZhbHNlXG4gICAgY29uc3QgY2FsbFNldHRpbmdzID0gbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzQnVpbGRlcigpXG4gICAgICAuZW5hYmxlRGVmYXVsdExheW91dCh0cnVlKVxuICAgICAgLnNldElzQXVkaW9Pbmx5Q2FsbChhdWRpb09ubHlDYWxsKVxuICAgICAgLnNldENhbGxMaXN0ZW5lcihcbiAgICAgICAgbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuT25nb2luZ0NhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25DYWxsRW5kZWQ6ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGw/LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikge1xuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbD8uZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklkKS50aGVuKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dChjYWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpXG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgcmV0dXJuIGNhbGxTZXR0aW5nc1xuICB9XG4gIGNsb3NlQ2FsbFNjcmVlbigpIHtcbiAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICB0aGlzLmFjdGl2ZUNhbGwgPSBudWxsXG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSBmYWxzZVxuICAgIHRoaXMuc2Vzc2lvbklkID0gXCJcIlxuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgb3Blbk9uZ29pbmdDYWxsU2NyZWVuKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5hY3RpdmVDYWxsID0gY2FsbFxuICAgIHRoaXMuc2Vzc2lvbklkID0gY2FsbC5nZXRTZXNzaW9uSWQoKVxuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gdHJ1ZVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIGluaXRpYXRlQ2FsbCh0eXBlOiBzdHJpbmcpIHtcblxuICAgIGNvbnN0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgIGNvbnN0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlciA/IHRoaXMudXNlci5nZXRVaWQoKSA6IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpXG4gICAgY29uc3QgY2FsbDogQ29tZXRDaGF0LkNhbGwgPSBuZXcgQ29tZXRDaGF0LkNhbGwoXG4gICAgICByZWNlaXZlcklkLFxuICAgICAgdHlwZSxcbiAgICAgIHJlY2VpdmVyVHlwZVxuICAgICk7XG4gICAgQ29tZXRDaGF0LmluaXRpYXRlQ2FsbChjYWxsKVxuICAgICAgLnRoZW4oKG91dGdvaW5nQ2FsbCkgPT4ge1xuICAgICAgICAvL3doZW4gdGhpcyBjb21wb25lbnQgaXMgcGFydCBvZiBjaGF0IHdpZGdldCB0cmlnZ2VyIGFuIGV2ZW50Li4gKG91dGdvaW5nY2FsbCBjb21wb25lbnQgaXMgdXNlZCBzZXBhcmF0ZWx5IGluIGNoYXQgd2lkZ2V0KVxuICAgICAgICB0aGlzLmNhbGwgPSBvdXRnb2luZ0NhbGxcbiAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NPdXRnb2luZ0NhbGwubmV4dChcbiAgICAgICAgICBvdXRnb2luZ0NhbGxcbiAgICAgICAgKVxuXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGluaXRpYXRlQXVkaW9DYWxsKCkge1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIHRoaXMuaW5pdGlhdGVDYWxsKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbylcbiAgICB9XG4gIH1cbiAgaW5pdGlhdGVWaWRlb0NhbGwoKSB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgdGhpcy5pbml0aWF0ZUNhbGwoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc2Vzc2lvbklkID0gdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICAgIHRoaXMuc2VuZEN1c3RvbU1lc3NhZ2UoKVxuICAgICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG5cbiAgICB9XG4gIH1cbiAgc2VuZEN1c3RvbU1lc3NhZ2UoKSB7XG4gICAgY29uc3QgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgY29uc3QgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyID8gdGhpcy51c2VyLmdldFVpZCgpIDogdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICBjb25zdCBjdXN0b21EYXRhID0geyBcInNlc3Npb25JRFwiOiB0aGlzLnNlc3Npb25JZCwgXCJzZXNzaW9uSWRcIjogdGhpcy5zZXNzaW9uSWQsIFwiY2FsbFR5cGVcIjogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvIH07XG4gICAgY29uc3QgY3VzdG9tVHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLm1lZXRpbmc7XG4gICAgY29uc3QgY29udmVyc2F0aW9uSWQgPSBgZ3JvdXBfJHt0aGlzLnNlc3Npb25JZH1gO1xuXG4gICAgY29uc3QgY3VzdG9tTWVzc2FnZTogYW55ID0gbmV3IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSwgY3VzdG9tVHlwZSwgY3VzdG9tRGF0YSk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIpO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBpbmNyZW1lbnRVbnJlYWRDb3VudDogdHJ1ZSB9KTtcbiAgICBjdXN0b21NZXNzYWdlLnNldFJlY2VpdmVyKChyZWNlaXZlclR5cGUgYXMgYW55KSk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRDb252ZXJzYXRpb25JZChjb252ZXJzYXRpb25JZCk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZW50QXQgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpO1xuICAgIGN1c3RvbU1lc3NhZ2UubXVpZCA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpO1xuICAgIC8vIGN1c3RvbSBtZXNzYWdlXG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgbWVzc2FnZTogY3VzdG9tTWVzc2FnZSxcbiAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzXG4gICAgfSlcbiAgICBDb21ldENoYXQuc2VuZEN1c3RvbU1lc3NhZ2UoY3VzdG9tTWVzc2FnZSkudGhlbigobXNnKSA9PiB7XG4gICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgIG1lc3NhZ2U6IG1zZyxcbiAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3NcbiAgICAgIH0pXG4gICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgfVxuICAgICAgfSlcblxuICB9XG4gIGNhbmNlbE91dGdvaW5nQ2FsbCA9ICgpID0+IHtcbiAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGF1c2UoKVxuICAgIENvbWV0Q2hhdC5yZWplY3RDYWxsKFxuICAgICAgdGhpcy5jYWxsIS5nZXRTZXNzaW9uSWQoKSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmNhbmNlbGxlZFxuICAgIClcbiAgICAgIC50aGVuKChjYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2VcbiAgICAgICAgQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5uZXh0KGNhbGwpXG4gICAgICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgZ2V0Vm9pY2VDYWxsQnV0dG9uU3R5bGUoZGlzYWJsZUJ1dHRvbnM6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBidXR0b25JY29uVGludCA9IGRpc2FibGVCdXR0b25zXG4gICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgICAgIDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZvaWNlQ2FsbEljb25UaW50O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMudmlkZW9DYWxsQnV0dG9uU3R5bGUsXG4gICAgICBidXR0b25JY29uVGludCxcbiAgICB9O1xuICB9XG4gIGdldFZpZGVvQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uSWNvblRpbnQgPSBkaXNhYmxlQnV0dG9uc1xuICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGludDtcblxuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLnZpZGVvQ2FsbEJ1dHRvblN0eWxlLFxuICAgICAgYnV0dG9uSWNvblRpbnQsXG4gICAgfTtcbiAgfVxuXG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgdGhpcy5jYWxsYnV0dG9uc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgIG9uSW5jb21pbmdDYWxsUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuY2FsbCA9IGNhbGw7XG4gICAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IHRydWVcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSxcbiAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jYWxsICYmIHRoaXMuY2FsbC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICAgICAgICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbEFjY2VwdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jYWxsICYmIHRoaXMuY2FsbC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGwgPSBjYWxsO1xuICAgICAgICAgICAgdGhpcy5vcGVuT25nb2luZ0NhbGxTY3JlZW4oY2FsbCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICAgICAgICB0aGlzLmNhbGwgPSBudWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxidXR0b25zTGlzdGVuZXJJZCk7XG4gIH1cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsUmVqZWN0ZWQuc3Vic2NyaWJlKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KVxuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSB0cnVlXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KVxuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKClcbiAgICB9KVxuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZD8udW5zdWJzY3JpYmUoKVxuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGw/LnVuc3Vic2NyaWJlKClcbiAgICB0aGlzLmNjQ2FsbEVuZGVkPy51bnN1YnNjcmliZSgpXG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldGNhbGxCdXR0b25zU3R5bGUoKVxuICAgIHRoaXMuc2V0T25nb2luZ0NhbGxTdHlsZSgpXG4gIH1cbiAgc2V0T25nb2luZ0NhbGxTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG4gICAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcbiAgICAgIG1pbkhlaWdodDogXCI0MDBweFwiLFxuICAgICAgbWluV2lkdGg6IFwiNDAwcHhcIixcbiAgICAgIG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBtYXhpbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH0pXG4gICAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub25nb2luZ0NhbGxTdHlsZSB9XG4gIH1cbiAgc2V0Y2FsbEJ1dHRvbnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDYWxsQnV0dG9uc1N0eWxlID0gbmV3IENhbGxCdXR0b25zU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdm9pY2VDYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdmlkZW9DYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdm9pY2VDYWxsSWNvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgdmlkZW9DYWxsSWNvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgdm9pY2VDYWxsSWNvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB2aWRlb0NhbGxJY29uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJ1dHRvblBhZGRpbmc6IFwiOHB4IDMycHhcIixcbiAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBidXR0b25Cb3JkZXI6IFwiMFwiLFxuICAgICAgYnV0dG9uQm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICB0aGlzLmNhbGxCdXR0b25zU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jYWxsQnV0dG9uc1N0eWxlIH1cbiAgICB0aGlzLnZvaWNlQ2FsbEJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuZGlzYWJsZUJ1dHRvbnMgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpIDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZvaWNlQ2FsbEljb25UaW50LFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dENvbG9yLFxuICAgICAgcGFkZGluZzogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvblBhZGRpbmcsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYnV0dG9uQmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJvcmRlclJhZGl1cyxcbiAgICAgIC4uLnRoaXMuYnV0dG9uU3R5bGVcbiAgICB9XG4gICAgdGhpcy52aWRlb0NhbGxCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmRpc2FibGVCdXR0b25zID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGludCxcbiAgICAgIGJ1dHRvblRleHRGb250OiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudmlkZW9DYWxsSWNvblRleHRGb250LFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudmlkZW9DYWxsSWNvblRleHRDb2xvcixcbiAgICAgIHBhZGRpbmc6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25QYWRkaW5nLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25Cb3JkZXJSYWRpdXMsXG4gICAgICAuLi50aGlzLmJ1dHRvblN0eWxlXG4gICAgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYm9yZGVyUmFkaXVzXG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY2FsbC1idXR0b25zX193cmFwcGVyXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWNhbGwtYnV0dG9ucy1idXR0b25zXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2Rpc2FibGVkXT1cImRpc2FibGVCdXR0b25zID8gdHJ1ZSA6IGZhbHNlXCIgKm5nSWY9XCJ1c2VyXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImluaXRpYXRlQXVkaW9DYWxsKClcIlxuICAgICAgW2J1dHRvblN0eWxlXT1cImdldFZvaWNlQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zKVwiIFt0ZXh0XT1cInZvaWNlQ2FsbEljb25UZXh0XCJcbiAgICAgIFtob3ZlclRleHRdPVwidm9pY2VDYWxsSWNvbkhvdmVyVGV4dFwiIFtpY29uVVJMXT1cInZvaWNlQ2FsbEljb25VUkxcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2Rpc2FibGVkXT1cImRpc2FibGVCdXR0b25zICA/IHRydWUgOiBmYWxzZVwiICpuZ0lmPVwidXNlciB8fCBncm91cFwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaW5pdGlhdGVWaWRlb0NhbGwoKVwiIFtidXR0b25TdHlsZV09XCJnZXRWaWRlb0NhbGxCdXR0b25TdHlsZShkaXNhYmxlQnV0dG9ucylcIlxuICAgICAgW3RleHRdPVwidmlkZW9DYWxsSWNvblRleHRcIiBbaG92ZXJUZXh0XT1cInZpZGVvQ2FsbEljb25Ib3ZlclRleHRcIiBbaWNvblVSTF09XCJ2aWRlb0NhbGxJY29uVVJMXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbjwvZGl2PlxuPGNvbWV0Y2hhdC1vbmdvaW5nLWNhbGwgKm5nSWY9XCJzaG93T25nb2luZ0NhbGxcIiBbbWF4aW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5tYXhpbWl6ZUljb25VUkxcIlxuICBbbWluaW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5taW5pbWl6ZUljb25VUkxcIlxuICBbb25nb2luZ0NhbGxTdHlsZV09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub25nb2luZ0NhbGxTdHlsZSB8fCBvbmdvaW5nQ2FsbFN0eWxlXCIgW3Nlc3Npb25JRF09XCJzZXNzaW9uSWRcIlxuICBbY2FsbFNldHRpbmdzQnVpbGRlcl09XCJnZXRDYWxsQnVpbGRlcigpIVwiPjwvY29tZXRjaGF0LW9uZ29pbmctY2FsbD5cbjxjb21ldGNoYXQtYmFja2Ryb3AgKm5nSWY9XCJzaG93T3V0Z29pbmdDYWxsc2NyZWVuXCI+XG4gIDxjb21ldGNoYXQtb3V0Z29pbmctY2FsbCBbY3VzdG9tU291bmRGb3JDYWxsc109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmN1c3RvbVNvdW5kRm9yQ2FsbHNcIlxuICAgIFtvbkVycm9yXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW2Rpc2FibGVTb3VuZEZvckNhbGxzXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uZGlzYWJsZVNvdW5kRm9yQ2FsbHNcIlxuICAgIFthdmF0YXJTdHlsZV09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCIgW2N1c3RvbVZpZXddPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5jdXN0b21WaWV3XCJcbiAgICBbZGVjbGluZUJ1dHRvbkljb25VUkxdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5kZWNsaW5lQnV0dG9uSWNvblVSTFwiXG4gICAgW29uQ2xvc2VDbGlja2VkXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub25DbG9zZUNsaWNrZWQgfHwgY2FuY2VsT3V0Z29pbmdDYWxsXCJcbiAgICBbb3V0Z29pbmdDYWxsU3R5bGVdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vdXRnb2luZ0NhbGxTdHlsZSB8fCBvdXRnb2luZ0NhbGxTdHlsZVwiXG4gICAgW2NhbGxdPVwiY2FsbCFcIj48L2NvbWV0Y2hhdC1vdXRnb2luZy1jYWxsPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+Il19