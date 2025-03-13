import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { localize, CometChatUIKitConstants, fontHelper, CometChatCallEvents, CometChatMessageEvents, MessageStatus } from '@cometchat/uikit-resources';
import { CallButtonsStyle, CometChatSoundManager, CometChatUIKitUtility, OutgoingCallConfiguration, CallScreenConfiguration, CometChatUIKitCalls, StorageUtils } from '@cometchat/uikit-shared';
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
                height: this.callButtonsStyle?.height,
                width: this.callButtonsStyle?.width,
                background: this.callButtonsStyle?.background,
                border: this.callButtonsStyle?.border,
                borderRadius: this.callButtonsStyle?.borderRadius
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
        const audioOnlyCall = this.activeCall?.getType() === CometChatUIKitConstants.MessageTypes.audio;
        const builder = this.ongoingCallConfiguration?.callSettingsBuilder ? this.ongoingCallConfiguration.callSettingsBuilder(audioOnlyCall, this.user, this.group)
            : new CometChatUIKitCalls.CallSettingsBuilder().enableDefaultLayout(true).setIsAudioOnlyCall(audioOnlyCall);
        builder.setCallListener(new CometChatUIKitCalls.OngoingCallListener({
            onCallEnded: () => {
                StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
                if (this.call?.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                    CometChatUIKitCalls.endSession();
                    CometChat.clearActiveCall();
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
                if (this.onError) {
                    this.onError(error);
                }
            },
        }));
        return builder.build();
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
        customMessage.shouldUpdateConversation(true);
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
            StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, msg);
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
            : this.callButtonsStyle?.voiceCallIconTint;
        return {
            ...this.videoCallButtonStyle,
            buttonIconTint,
        };
    }
    getVideoCallButtonStyle(disableButtons) {
        const buttonIconTint = disableButtons
            ? this.themeService.theme.palette.getAccent600()
            : this.callButtonsStyle?.videoCallIconTint;
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
                if (this.call && this.call.getSessionId() == call.getSessionId() && this.showOutgoingCallscreen) {
                    this.call = call;
                    StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, call);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsdUJBQXVCLEVBQXFCLFNBQVMsRUFBRSxLQUFLLEVBQVUsTUFBTSxlQUFlLENBQUM7QUFDckcsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGFBQWEsRUFBd0MsTUFBTSw0QkFBNEIsQ0FBQztBQUU3TCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQXFCLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ25OLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUMzRCxPQUFPLHlCQUF5QixDQUFBOzs7Ozs7QUFDaEM7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sNkJBQTZCO0lBZ0V4QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENB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O3NCQUFoQyxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIElucHV0LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gJ0Bjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdCc7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IGxvY2FsaXplLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgZm9udEhlbHBlciwgQ29tZXRDaGF0Q2FsbEV2ZW50cywgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cywgTWVzc2FnZVN0YXR1cywgQ29tZXRDaGF0TG9jYWxpemUsIENvbWV0Q2hhdFVJRXZlbnRzIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBDYWxsQnV0dG9uc1N0eWxlLCBDb21ldENoYXRTb3VuZE1hbmFnZXIsIE91dGdvaW5nQ2FsbFN0eWxlLCBDb21ldENoYXRVSUtpdFV0aWxpdHksIE91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24sIENhbGxTY3JlZW5Db25maWd1cmF0aW9uLCBDb21ldENoYXRVSUtpdENhbGxzLCBTdG9yYWdlVXRpbHMgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCc7XG5pbXBvcnQgeyBDYWxsc2NyZWVuU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCdcbi8qKlxuKlxuKiBDb21ldENoYXRDYWxsQnV0dG9uc0NvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB3aGljaCBzaG93cyBidXR0b25zIGZvciBhdWRpbyBhbmQgdmlkZW8gY2FsbCBmb3IgMXYxIGFuZCBncm91cCBjYWxsLlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1jYWxsLWJ1dHRvbnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtY2FsbC1idXR0b25zLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY2FsbC1idXR0b25zLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDYWxsQnV0dG9uc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIHZvaWNlQ2FsbEljb25VUkw6IHN0cmluZyB8IHVuZGVmaW5lZCA9IFwiYXNzZXRzL0F1ZGlvLUNhbGwyeC5zdmdcIlxuICBASW5wdXQoKSB2b2ljZUNhbGxJY29uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJWT0lDRV9DQUxMXCIpXG4gIEBJbnB1dCgpIHZvaWNlQ2FsbEljb25Ib3ZlclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVk9JQ0VfQ0FMTFwiKVxuICBASW5wdXQoKSB2aWRlb0NhbGxJY29uVVJMOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcImFzc2V0cy9WaWRlby1jYWxsMnguc3ZnXCJcbiAgQElucHV0KCkgdmlkZW9DYWxsSWNvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVklERU9fQ0FMTFwiKVxuICBASW5wdXQoKSB2aWRlb0NhbGxJY29uSG92ZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlZJREVPX0NBTExcIilcbiAgQElucHV0KCkgb25Wb2ljZUNhbGxDbGljaz86ICgodXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHZvaWQpIHwgbnVsbDtcbiAgQElucHV0KCkgb25WaWRlb0NhbGxDbGljaz86ICgodXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHZvaWQpIHwgbnVsbDtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgY2FsbEJ1dHRvbnNTdHlsZTogQ2FsbEJ1dHRvbnNTdHlsZSB8IHVuZGVmaW5lZCA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gIH07XG4gIEBJbnB1dCgpIG91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb246IE91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24gPSBuZXcgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbih7fSlcbiAgQElucHV0KCkgb25nb2luZ0NhbGxDb25maWd1cmF0aW9uOiBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbiA9IG5ldyBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbih7fSlcbiAgY2FsbCE6IENvbWV0Q2hhdC5DYWxsIHwgbnVsbDtcbiAgcHVibGljIGNjT3V0Z29pbmdDYWxsITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGRpc2FibGVCdXR0b25zOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuICBzZXNzaW9uSWQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBjYWxsYnV0dG9uc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2FsbGJ1dHRvbnNfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsID0gbnVsbDtcbiAgYnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gIH1cbiAgdm9pY2VDYWxsQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBidXR0b25JY29uVGludDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIjQwMCAxMnB4IEludGVyXCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOiBcIlJHQig1MSwgMTUzLCAyNTUpXCIsXG4gICAgcGFkZGluZzogXCI4cHggMzJweFwiXG4gIH1cbiAgdmlkZW9DYWxsQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBidXR0b25JY29uVGludDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIjQwMCAxMnB4IEludGVyXCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOiBcIlJHQig1MSwgMTUzLCAyNTUpXCIsXG4gICAgcGFkZGluZzogXCI4cHggMzJweFwiXG4gIH1cbiAgc2hvd091dGdvaW5nQ2FsbHNjcmVlbjogYm9vbGVhbiA9IGZhbHNlO1xuICBvdXRnb2luZ0NhbGxTdHlsZTogT3V0Z29pbmdDYWxsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzYwcHhcIixcbiAgICBoZWlnaHQ6IFwiNTgxcHhcIixcbiAgICB0aXRsZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gICAgdGl0bGVUZXh0Q29sb3I6IFwiUkdCKDIwLCAyMCwgMjApXCIsXG4gICAgc3VidGl0bGVUZXh0Rm9udDogXCI0MDAgMTVweCBJbnRlclwiLFxuICAgIHN1YnRpdGxlVGV4dENvbG9yOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgfTtcbiAgb25nb2luZ0NhbGxTdHlsZTogQ2FsbHNjcmVlblN0eWxlID0ge31cbiAgYWN0aXZlQ2FsbDogQ29tZXRDaGF0LkNhbGwgfCBudWxsID0gbnVsbFxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXJcbiAgICB9KS5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKClcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpO1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cbiAgZ2V0Q2FsbEJ1aWxkZXIoKTogdHlwZW9mIENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBhdWRpb09ubHlDYWxsOiBib29sZWFuID0gdGhpcy5hY3RpdmVDYWxsPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbztcbiAgICBjb25zdCBidWlsZGVyID0gdGhpcy5vbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24/LmNhbGxTZXR0aW5nc0J1aWxkZXIgPyB0aGlzLm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5jYWxsU2V0dGluZ3NCdWlsZGVyKGF1ZGlvT25seUNhbGwsIHRoaXMudXNlciwgdGhpcy5ncm91cClcbiAgICAgICAgICAgICAgICAgICAgOiBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKCkuZW5hYmxlRGVmYXVsdExheW91dCh0cnVlKS5zZXRJc0F1ZGlvT25seUNhbGwoYXVkaW9Pbmx5Q2FsbCk7XG4gICAgYnVpbGRlci5zZXRDYWxsTGlzdGVuZXIoXG4gICAgICAgIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLk9uZ29pbmdDYWxsTGlzdGVuZXIoe1xuICAgICAgICAgIG9uQ2FsbEVuZGVkOiAoKSA9PiB7XG4gICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBudWxsKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGw/LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikge1xuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0LmNsZWFyQWN0aXZlQ2FsbCgpO1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkNhbGxFbmRCdXR0b25QcmVzc2VkOiAoKSA9PiB7XG4gICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBudWxsKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGw/LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikge1xuICAgICAgICAgICAgICBDb21ldENoYXQuZW5kQ2FsbCh0aGlzLnNlc3Npb25JZCkudGhlbigoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcbiAgICAgICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoY2FsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICByZXR1cm4gYnVpbGRlci5idWlsZCgpO1xuICB9XG4gIGNsb3NlQ2FsbFNjcmVlbigpIHtcbiAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICB0aGlzLmFjdGl2ZUNhbGwgPSBudWxsXG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSBmYWxzZVxuICAgIHRoaXMuc2Vzc2lvbklkID0gXCJcIlxuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgb3Blbk9uZ29pbmdDYWxsU2NyZWVuKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5hY3RpdmVDYWxsID0gY2FsbFxuICAgIHRoaXMuc2Vzc2lvbklkID0gY2FsbC5nZXRTZXNzaW9uSWQoKVxuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gdHJ1ZVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIGluaXRpYXRlQ2FsbCh0eXBlOiBzdHJpbmcpIHtcblxuICAgIGNvbnN0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgIGNvbnN0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlciA/IHRoaXMudXNlci5nZXRVaWQoKSA6IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpXG4gICAgY29uc3QgY2FsbDogQ29tZXRDaGF0LkNhbGwgPSBuZXcgQ29tZXRDaGF0LkNhbGwoXG4gICAgICByZWNlaXZlcklkLFxuICAgICAgdHlwZSxcbiAgICAgIHJlY2VpdmVyVHlwZVxuICAgICk7XG4gICAgQ29tZXRDaGF0LmluaXRpYXRlQ2FsbChjYWxsKVxuICAgICAgLnRoZW4oKG91dGdvaW5nQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLmNhbGwgPSBvdXRnb2luZ0NhbGxcbiAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NPdXRnb2luZ0NhbGwubmV4dChcbiAgICAgICAgICBvdXRnb2luZ0NhbGxcbiAgICAgICAgKVxuXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGluaXRpYXRlQXVkaW9DYWxsKCkge1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIHRoaXMuaW5pdGlhdGVDYWxsKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbylcbiAgICB9XG4gIH1cbiAgaW5pdGlhdGVWaWRlb0NhbGwoKSB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgdGhpcy5pbml0aWF0ZUNhbGwoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc2Vzc2lvbklkID0gdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICAgIHRoaXMuc2VuZEN1c3RvbU1lc3NhZ2UoKVxuICAgICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG5cbiAgICB9XG4gIH1cbiAgc2VuZEN1c3RvbU1lc3NhZ2UoKSB7XG4gICAgY29uc3QgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgY29uc3QgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyID8gdGhpcy51c2VyLmdldFVpZCgpIDogdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICBjb25zdCBjdXN0b21EYXRhID0geyBcInNlc3Npb25JRFwiOiB0aGlzLnNlc3Npb25JZCwgXCJzZXNzaW9uSWRcIjogdGhpcy5zZXNzaW9uSWQsIFwiY2FsbFR5cGVcIjogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvIH07XG4gICAgY29uc3QgY3VzdG9tVHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLm1lZXRpbmc7XG4gICAgY29uc3QgY29udmVyc2F0aW9uSWQgPSBgZ3JvdXBfJHt0aGlzLnNlc3Npb25JZH1gO1xuXG4gICAgY29uc3QgY3VzdG9tTWVzc2FnZTogYW55ID0gbmV3IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSwgY3VzdG9tVHlwZSwgY3VzdG9tRGF0YSk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIpO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2hvdWxkVXBkYXRlQ29udmVyc2F0aW9uKHRydWUpO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2V0TWV0YWRhdGEoeyBpbmNyZW1lbnRVbnJlYWRDb3VudDogdHJ1ZSB9KTtcbiAgICBjdXN0b21NZXNzYWdlLnNldFJlY2VpdmVyKChyZWNlaXZlclR5cGUgYXMgYW55KSk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRDb252ZXJzYXRpb25JZChjb252ZXJzYXRpb25JZCk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZW50QXQgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpO1xuICAgIGN1c3RvbU1lc3NhZ2UubXVpZCA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpO1xuICAgIC8vIGN1c3RvbSBtZXNzYWdlXG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgbWVzc2FnZTogY3VzdG9tTWVzc2FnZSxcbiAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzXG4gICAgfSlcblxuICAgIENvbWV0Q2hhdC5zZW5kQ3VzdG9tTWVzc2FnZShjdXN0b21NZXNzYWdlKS50aGVuKChtc2cpID0+IHtcbiAgICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG1zZylcbiAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgbWVzc2FnZTogbXNnLFxuICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzc1xuICAgICAgfSlcbiAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gIH1cbiAgY2FuY2VsT3V0Z29pbmdDYWxsID0gKCkgPT4ge1xuICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpXG4gICAgQ29tZXRDaGF0LnJlamVjdENhbGwoXG4gICAgICB0aGlzLmNhbGwhLmdldFNlc3Npb25JZCgpLFxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuY2FuY2VsbGVkXG4gICAgKVxuICAgICAgLnRoZW4oKGNhbGwpID0+IHtcbiAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZVxuICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLm5leHQoY2FsbClcbiAgICAgICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBnZXRWb2ljZUNhbGxCdXR0b25TdHlsZShkaXNhYmxlQnV0dG9uczogYm9vbGVhbikge1xuICAgIGNvbnN0IGJ1dHRvbkljb25UaW50ID0gZGlzYWJsZUJ1dHRvbnNcbiAgICAgID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKVxuICAgICAgOiB0aGlzLmNhbGxCdXR0b25zU3R5bGU/LnZvaWNlQ2FsbEljb25UaW50O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMudmlkZW9DYWxsQnV0dG9uU3R5bGUsXG4gICAgICBidXR0b25JY29uVGludCxcbiAgICB9O1xuICB9XG4gIGdldFZpZGVvQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uSWNvblRpbnQgPSBkaXNhYmxlQnV0dG9uc1xuICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZT8udmlkZW9DYWxsSWNvblRpbnQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy52aWRlb0NhbGxCdXR0b25TdHlsZSxcbiAgICAgIGJ1dHRvbkljb25UaW50LFxuICAgIH07XG4gIH1cblxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENhbGxMaXN0ZW5lcihcbiAgICAgIHRoaXMuY2FsbGJ1dHRvbnNMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5DYWxsTGlzdGVuZXIoe1xuICAgICAgICBvbkluY29taW5nQ2FsbFJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNhbGwgPSBjYWxsO1xuICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jYWxsICYmIHRoaXMuY2FsbC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICAgICAgICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbEFjY2VwdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jYWxsICYmIHRoaXMuY2FsbC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpICYmIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbikge1xuICAgICAgICAgICAgdGhpcy5jYWxsID0gY2FsbDtcbiAgICAgICAgICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIGNhbGwpO1xuICAgICAgICAgICAgdGhpcy5vcGVuT25nb2luZ0NhbGxTY3JlZW4oY2FsbCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICAgICAgICB0aGlzLmNhbGwgPSBudWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxidXR0b25zTGlzdGVuZXJJZCk7XG4gIH1cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsUmVqZWN0ZWQuc3Vic2NyaWJlKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KVxuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSB0cnVlXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KVxuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKClcbiAgICB9KVxuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZD8udW5zdWJzY3JpYmUoKVxuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGw/LnVuc3Vic2NyaWJlKClcbiAgICB0aGlzLmNjQ2FsbEVuZGVkPy51bnN1YnNjcmliZSgpXG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldGNhbGxCdXR0b25zU3R5bGUoKVxuICAgIHRoaXMuc2V0T25nb2luZ0NhbGxTdHlsZSgpXG4gIH1cbiAgc2V0T25nb2luZ0NhbGxTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG4gICAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcbiAgICAgIG1pbkhlaWdodDogXCI0MDBweFwiLFxuICAgICAgbWluV2lkdGg6IFwiNDAwcHhcIixcbiAgICAgIG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBtYXhpbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH0pXG4gICAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub25nb2luZ0NhbGxTdHlsZSB9XG4gIH1cbiAgc2V0Y2FsbEJ1dHRvbnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDYWxsQnV0dG9uc1N0eWxlID0gbmV3IENhbGxCdXR0b25zU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdm9pY2VDYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdmlkZW9DYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdm9pY2VDYWxsSWNvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgdmlkZW9DYWxsSWNvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgdm9pY2VDYWxsSWNvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB2aWRlb0NhbGxJY29uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJ1dHRvblBhZGRpbmc6IFwiOHB4IDMycHhcIixcbiAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBidXR0b25Cb3JkZXI6IFwiMFwiLFxuICAgICAgYnV0dG9uQm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICB0aGlzLmNhbGxCdXR0b25zU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jYWxsQnV0dG9uc1N0eWxlIH1cbiAgICB0aGlzLnZvaWNlQ2FsbEJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuZGlzYWJsZUJ1dHRvbnMgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpIDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZvaWNlQ2FsbEljb25UaW50LFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dENvbG9yLFxuICAgICAgcGFkZGluZzogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvblBhZGRpbmcsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYnV0dG9uQmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJvcmRlclJhZGl1cyxcbiAgICAgIC4uLnRoaXMuYnV0dG9uU3R5bGVcbiAgICB9XG4gICAgdGhpcy52aWRlb0NhbGxCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmRpc2FibGVCdXR0b25zID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGludCxcbiAgICAgIGJ1dHRvblRleHRGb250OiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudmlkZW9DYWxsSWNvblRleHRGb250LFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudmlkZW9DYWxsSWNvblRleHRDb2xvcixcbiAgICAgIHBhZGRpbmc6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25QYWRkaW5nLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25Cb3JkZXJSYWRpdXMsXG4gICAgICAuLi50aGlzLmJ1dHRvblN0eWxlXG4gICAgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmNhbGxCdXR0b25zU3R5bGU/LmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLmNhbGxCdXR0b25zU3R5bGU/LndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlPy5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmNhbGxCdXR0b25zU3R5bGU/LmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jYWxsQnV0dG9uc1N0eWxlPy5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1jYWxsLWJ1dHRvbnNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtY2FsbC1idXR0b25zLWJ1dHRvbnNcIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbZGlzYWJsZWRdPVwiZGlzYWJsZUJ1dHRvbnMgPyB0cnVlIDogZmFsc2VcIiAqbmdJZj1cInVzZXJcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaW5pdGlhdGVBdWRpb0NhbGwoKVwiXG4gICAgICBbYnV0dG9uU3R5bGVdPVwiZ2V0Vm9pY2VDYWxsQnV0dG9uU3R5bGUoZGlzYWJsZUJ1dHRvbnMpXCIgW3RleHRdPVwidm9pY2VDYWxsSWNvblRleHRcIlxuICAgICAgW2hvdmVyVGV4dF09XCJ2b2ljZUNhbGxJY29uSG92ZXJUZXh0XCIgW2ljb25VUkxdPVwidm9pY2VDYWxsSWNvblVSTFwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbZGlzYWJsZWRdPVwiZGlzYWJsZUJ1dHRvbnMgID8gdHJ1ZSA6IGZhbHNlXCIgKm5nSWY9XCJ1c2VyIHx8IGdyb3VwXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJpbml0aWF0ZVZpZGVvQ2FsbCgpXCIgW2J1dHRvblN0eWxlXT1cImdldFZpZGVvQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zKVwiXG4gICAgICBbdGV4dF09XCJ2aWRlb0NhbGxJY29uVGV4dFwiIFtob3ZlclRleHRdPVwidmlkZW9DYWxsSWNvbkhvdmVyVGV4dFwiIFtpY29uVVJMXT1cInZpZGVvQ2FsbEljb25VUkxcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuPC9kaXY+XG48Y29tZXRjaGF0LW9uZ29pbmctY2FsbCAqbmdJZj1cInNob3dPbmdvaW5nQ2FsbFwiIFttYXhpbWl6ZUljb25VUkxdPVwib25nb2luZ0NhbGxDb25maWd1cmF0aW9uLm1heGltaXplSWNvblVSTFwiXG4gIFttaW5pbWl6ZUljb25VUkxdPVwib25nb2luZ0NhbGxDb25maWd1cmF0aW9uLm1pbmltaXplSWNvblVSTFwiXG4gIFtvbmdvaW5nQ2FsbFN0eWxlXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbmdvaW5nQ2FsbFN0eWxlIHx8IG9uZ29pbmdDYWxsU3R5bGVcIiBbc2Vzc2lvbklEXT1cInNlc3Npb25JZFwiXG4gIFtjYWxsU2V0dGluZ3NCdWlsZGVyXT1cImdldENhbGxCdWlsZGVyKCkhXCI+PC9jb21ldGNoYXQtb25nb2luZy1jYWxsPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cInNob3dPdXRnb2luZ0NhbGxzY3JlZW5cIj5cbiAgPGNvbWV0Y2hhdC1vdXRnb2luZy1jYWxsIFtjdXN0b21Tb3VuZEZvckNhbGxzXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY3VzdG9tU291bmRGb3JDYWxsc1wiXG4gICAgW29uRXJyb3JdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbZGlzYWJsZVNvdW5kRm9yQ2FsbHNdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5kaXNhYmxlU291bmRGb3JDYWxsc1wiXG4gICAgW2F2YXRhclN0eWxlXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIiBbY3VzdG9tVmlld109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmN1c3RvbVZpZXdcIlxuICAgIFtkZWNsaW5lQnV0dG9uSWNvblVSTF09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmRlY2xpbmVCdXR0b25JY29uVVJMXCJcbiAgICBbb25DbG9zZUNsaWNrZWRdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkNsb3NlQ2xpY2tlZCB8fCBjYW5jZWxPdXRnb2luZ0NhbGxcIlxuICAgIFtvdXRnb2luZ0NhbGxTdHlsZV09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm91dGdvaW5nQ2FsbFN0eWxlIHx8IG91dGdvaW5nQ2FsbFN0eWxlXCJcbiAgICBbY2FsbF09XCJjYWxsIVwiPjwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGw+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD4iXX0=