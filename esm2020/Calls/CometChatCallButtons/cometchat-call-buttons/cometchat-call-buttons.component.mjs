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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsdUJBQXVCLEVBQXFCLFNBQVMsRUFBRSxLQUFLLEVBQVUsTUFBTSxlQUFlLENBQUM7QUFDckcsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGFBQWEsRUFBd0MsTUFBTSw0QkFBNEIsQ0FBQztBQUU3TCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQXFCLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ25OLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUMzRCxPQUFPLHlCQUF5QixDQUFBOzs7Ozs7QUFDaEM7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sNkJBQTZCO0lBZ0V4QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENB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QUMzRCxlQUFlLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQjtZQUM3RCxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWE7WUFDNUMsVUFBVSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0I7WUFDbEQsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNO1lBQ3BDLFlBQVksRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCO1lBQ3RELEdBQUcsSUFBSSxDQUFDLFdBQVc7U0FDcEIsQ0FBQTtJQUNILENBQUM7OzJIQTFYVSw2QkFBNkI7K0dBQTdCLDZCQUE2Qiw0bEJDdkIxQyx5MURBdUJxQjs0RkRBUiw2QkFBNkI7a0JBTnpDLFNBQVM7K0JBQ0Usd0JBQXdCLG1CQUdqQix1QkFBdUIsQ0FBQyxNQUFNOzRJQUd0QyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUdHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFPRyx5QkFBeUI7c0JBQWpDLEtBQUs7Z0JBQ0csd0JBQXdCO3NCQUFoQyxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIElucHV0LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gJ0Bjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdCc7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IGxvY2FsaXplLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgZm9udEhlbHBlciwgQ29tZXRDaGF0Q2FsbEV2ZW50cywgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cywgTWVzc2FnZVN0YXR1cywgQ29tZXRDaGF0TG9jYWxpemUsIENvbWV0Q2hhdFVJRXZlbnRzIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBDYWxsQnV0dG9uc1N0eWxlLCBDb21ldENoYXRTb3VuZE1hbmFnZXIsIE91dGdvaW5nQ2FsbFN0eWxlLCBDb21ldENoYXRVSUtpdFV0aWxpdHksIE91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24sIENhbGxTY3JlZW5Db25maWd1cmF0aW9uLCBDb21ldENoYXRVSUtpdENhbGxzLCBTdG9yYWdlVXRpbHMgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCc7XG5pbXBvcnQgeyBDYWxsc2NyZWVuU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCdcbi8qKlxuKlxuKiBDb21ldENoYXRDYWxsQnV0dG9uc0NvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB3aGljaCBzaG93cyBidXR0b25zIGZvciBhdWRpbyBhbmQgdmlkZW8gY2FsbCBmb3IgMXYxIGFuZCBncm91cCBjYWxsLlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1jYWxsLWJ1dHRvbnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtY2FsbC1idXR0b25zLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY2FsbC1idXR0b25zLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDYWxsQnV0dG9uc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIHZvaWNlQ2FsbEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL0F1ZGlvLUNhbGwyeC5zdmdcIlxuICBASW5wdXQoKSB2b2ljZUNhbGxJY29uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJWT0lDRV9DQUxMXCIpXG4gIEBJbnB1dCgpIHZvaWNlQ2FsbEljb25Ib3ZlclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVk9JQ0VfQ0FMTFwiKVxuICBASW5wdXQoKSB2aWRlb0NhbGxJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9WaWRlby1jYWxsMnguc3ZnXCJcbiAgQElucHV0KCkgdmlkZW9DYWxsSWNvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVklERU9fQ0FMTFwiKVxuICBASW5wdXQoKSB2aWRlb0NhbGxJY29uSG92ZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlZJREVPX0NBTExcIilcbiAgQElucHV0KCkgb25Wb2ljZUNhbGxDbGljayE6ICgodXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHZvaWQpIHwgbnVsbDtcbiAgQElucHV0KCkgb25WaWRlb0NhbGxDbGljayE6ICgodXNlcjogQ29tZXRDaGF0LlVzZXIsIGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHZvaWQpIHwgbnVsbDtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgY2FsbEJ1dHRvbnNTdHlsZTogQ2FsbEJ1dHRvbnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gIH07XG4gIEBJbnB1dCgpIG91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb246IE91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24gPSBuZXcgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbih7fSlcbiAgQElucHV0KCkgb25nb2luZ0NhbGxDb25maWd1cmF0aW9uOiBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbiA9IG5ldyBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbih7fSlcbiAgY2FsbCE6IENvbWV0Q2hhdC5DYWxsIHwgbnVsbDtcbiAgcHVibGljIGNjT3V0Z29pbmdDYWxsITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGRpc2FibGVCdXR0b25zOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuICBzZXNzaW9uSWQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBjYWxsYnV0dG9uc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2FsbGJ1dHRvbnNfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsID0gbnVsbDtcbiAgYnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gIH1cbiAgdm9pY2VDYWxsQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBidXR0b25JY29uVGludDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIjQwMCAxMnB4IEludGVyXCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOiBcIlJHQig1MSwgMTUzLCAyNTUpXCIsXG4gICAgcGFkZGluZzogXCI4cHggMzJweFwiXG4gIH1cbiAgdmlkZW9DYWxsQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBidXR0b25JY29uVGludDogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIjQwMCAxMnB4IEludGVyXCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOiBcIlJHQig1MSwgMTUzLCAyNTUpXCIsXG4gICAgcGFkZGluZzogXCI4cHggMzJweFwiXG4gIH1cbiAgc2hvd091dGdvaW5nQ2FsbHNjcmVlbjogYm9vbGVhbiA9IGZhbHNlO1xuICBvdXRnb2luZ0NhbGxTdHlsZTogT3V0Z29pbmdDYWxsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzYwcHhcIixcbiAgICBoZWlnaHQ6IFwiNTgxcHhcIixcbiAgICB0aXRsZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gICAgdGl0bGVUZXh0Q29sb3I6IFwiUkdCKDIwLCAyMCwgMjApXCIsXG4gICAgc3VidGl0bGVUZXh0Rm9udDogXCI0MDAgMTVweCBJbnRlclwiLFxuICAgIHN1YnRpdGxlVGV4dENvbG9yOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgfTtcbiAgb25nb2luZ0NhbGxTdHlsZTogQ2FsbHNjcmVlblN0eWxlID0ge31cbiAgYWN0aXZlQ2FsbDogQ29tZXRDaGF0LkNhbGwgfCBudWxsID0gbnVsbFxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXJcbiAgICB9KS5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKClcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigpO1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpXG4gIH1cbiAgZ2V0Q2FsbEJ1aWxkZXIoKTogdHlwZW9mIENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzIHwgdW5kZWZpbmVkIHtcbiAgICBsZXQgYXVkaW9Pbmx5Q2FsbDogYm9vbGVhbiA9IHRoaXMuYWN0aXZlQ2FsbD8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbyA/IHRydWUgOiBmYWxzZVxuICAgIGNvbnN0IGNhbGxTZXR0aW5ncyA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuICAgICAgLmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSlcbiAgICAgIC5zZXRJc0F1ZGlvT25seUNhbGwoYXVkaW9Pbmx5Q2FsbClcbiAgICAgIC5zZXRDYWxsTGlzdGVuZXIoXG4gICAgICAgIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLk9uZ29pbmdDYWxsTGlzdGVuZXIoe1xuICAgICAgICAgIG9uQ2FsbEVuZGVkOiAoKSA9PiB7XG4gICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBudWxsKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGw/LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikge1xuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG4gICAgICAgICAgICBpZiAodGhpcy5jYWxsPy5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0LmVuZENhbGwodGhpcy5zZXNzaW9uSWQpLnRoZW4oKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxFbmRlZC5uZXh0KGNhbGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycilcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYnVpbGQoKTtcbiAgICByZXR1cm4gY2FsbFNldHRpbmdzXG4gIH1cbiAgY2xvc2VDYWxsU2NyZWVuKCkge1xuICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgIHRoaXMuYWN0aXZlQ2FsbCA9IG51bGxcbiAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlXG4gICAgdGhpcy5zZXNzaW9uSWQgPSBcIlwiXG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBvcGVuT25nb2luZ0NhbGxTY3JlZW4oY2FsbDogQ29tZXRDaGF0LkNhbGwpIHtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZUNhbGwgPSBjYWxsXG4gICAgdGhpcy5zZXNzaW9uSWQgPSBjYWxsLmdldFNlc3Npb25JZCgpXG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgaW5pdGlhdGVDYWxsKHR5cGU6IHN0cmluZykge1xuXG4gICAgY29uc3QgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgY29uc3QgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyID8gdGhpcy51c2VyLmdldFVpZCgpIDogdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICBjb25zdCBjYWxsOiBDb21ldENoYXQuQ2FsbCA9IG5ldyBDb21ldENoYXQuQ2FsbChcbiAgICAgIHJlY2VpdmVySWQsXG4gICAgICB0eXBlLFxuICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgKTtcbiAgICBDb21ldENoYXQuaW5pdGlhdGVDYWxsKGNhbGwpXG4gICAgICAudGhlbigob3V0Z29pbmdDYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuY2FsbCA9IG91dGdvaW5nQ2FsbFxuICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSB0cnVlO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5uZXh0KFxuICAgICAgICAgIG91dGdvaW5nQ2FsbFxuICAgICAgICApXG5cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgaW5pdGlhdGVBdWRpb0NhbGwoKSB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgdGhpcy5pbml0aWF0ZUNhbGwoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvKVxuICAgIH1cbiAgfVxuICBpbml0aWF0ZVZpZGVvQ2FsbCgpIHtcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICB0aGlzLmluaXRpYXRlQ2FsbChDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zZXNzaW9uSWQgPSB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgICAgdGhpcy5zZW5kQ3VzdG9tTWVzc2FnZSgpXG4gICAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IHRydWU7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcblxuICAgIH1cbiAgfVxuICBzZW5kQ3VzdG9tTWVzc2FnZSgpIHtcbiAgICBjb25zdCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlciA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICBjb25zdCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyB0aGlzLnVzZXIuZ2V0VWlkKCkgOiB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgIGNvbnN0IGN1c3RvbURhdGEgPSB7IFwic2Vzc2lvbklEXCI6IHRoaXMuc2Vzc2lvbklkLCBcInNlc3Npb25JZFwiOiB0aGlzLnNlc3Npb25JZCwgXCJjYWxsVHlwZVwiOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8gfTtcbiAgICBjb25zdCBjdXN0b21UeXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMubWVldGluZztcbiAgICBjb25zdCBjb252ZXJzYXRpb25JZCA9IGBncm91cF8ke3RoaXMuc2Vzc2lvbklkfWA7XG5cbiAgICBjb25zdCBjdXN0b21NZXNzYWdlOiBhbnkgPSBuZXcgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBjdXN0b21UeXBlLCBjdXN0b21EYXRhKTtcbiAgICBjdXN0b21NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlcik7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRNZXRhZGF0YSh7IGluY3JlbWVudFVucmVhZENvdW50OiB0cnVlIH0pO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2V0UmVjZWl2ZXIoKHJlY2VpdmVyVHlwZSBhcyBhbnkpKTtcbiAgICBjdXN0b21NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKGNvbnZlcnNhdGlvbklkKTtcbiAgICBjdXN0b21NZXNzYWdlLnNlbnRBdCA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCk7XG4gICAgY3VzdG9tTWVzc2FnZS5tdWlkID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCk7XG4gICAgLy8gY3VzdG9tIG1lc3NhZ2VcbiAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICBtZXNzYWdlOiBjdXN0b21NZXNzYWdlLFxuICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3NcbiAgICB9KVxuXG4gICAgQ29tZXRDaGF0LnNlbmRDdXN0b21NZXNzYWdlKGN1c3RvbU1lc3NhZ2UpLnRoZW4oKG1zZykgPT4ge1xuICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbXNnKVxuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtc2csXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzXG4gICAgICB9KVxuICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgfVxuICBjYW5jZWxPdXRnb2luZ0NhbGwgPSAoKSA9PiB7XG4gICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKClcbiAgICBDb21ldENoYXQucmVqZWN0Q2FsbChcbiAgICAgIHRoaXMuY2FsbCEuZ2V0U2Vzc2lvbklkKCksXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5jYW5jZWxsZWRcbiAgICApXG4gICAgICAudGhlbigoY2FsbCkgPT4ge1xuICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlXG4gICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsUmVqZWN0ZWQubmV4dChjYWxsKVxuICAgICAgICB0aGlzLmNhbGwgPSBudWxsO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIGdldFZvaWNlQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uSWNvblRpbnQgPSBkaXNhYmxlQnV0dG9uc1xuICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGludDtcblxuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLnZpZGVvQ2FsbEJ1dHRvblN0eWxlLFxuICAgICAgYnV0dG9uSWNvblRpbnQsXG4gICAgfTtcbiAgfVxuICBnZXRWaWRlb0NhbGxCdXR0b25TdHlsZShkaXNhYmxlQnV0dG9uczogYm9vbGVhbikge1xuICAgIGNvbnN0IGJ1dHRvbkljb25UaW50ID0gZGlzYWJsZUJ1dHRvbnNcbiAgICAgID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKVxuICAgICAgOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudmlkZW9DYWxsSWNvblRpbnQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy52aWRlb0NhbGxCdXR0b25TdHlsZSxcbiAgICAgIGJ1dHRvbkljb25UaW50LFxuICAgIH07XG4gIH1cblxuICBhdHRhY2hMaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENhbGxMaXN0ZW5lcihcbiAgICAgIHRoaXMuY2FsbGJ1dHRvbnNMaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5DYWxsTGlzdGVuZXIoe1xuICAgICAgICBvbkluY29taW5nQ2FsbFJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNhbGwgPSBjYWxsO1xuICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jYWxsICYmIHRoaXMuY2FsbC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICAgICAgICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbEFjY2VwdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jYWxsICYmIHRoaXMuY2FsbC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpICYmIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbikge1xuICAgICAgICAgICAgdGhpcy5jYWxsID0gY2FsbDtcbiAgICAgICAgICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIGNhbGwpO1xuICAgICAgICAgICAgdGhpcy5vcGVuT25nb2luZ0NhbGxTY3JlZW4oY2FsbCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICAgICAgICB0aGlzLmNhbGwgPSBudWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxidXR0b25zTGlzdGVuZXJJZCk7XG4gIH1cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsUmVqZWN0ZWQuc3Vic2NyaWJlKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KVxuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSB0cnVlXG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9KVxuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZSgoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKClcbiAgICB9KVxuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZD8udW5zdWJzY3JpYmUoKVxuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGw/LnVuc3Vic2NyaWJlKClcbiAgICB0aGlzLmNjQ2FsbEVuZGVkPy51bnN1YnNjcmliZSgpXG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldGNhbGxCdXR0b25zU3R5bGUoKVxuICAgIHRoaXMuc2V0T25nb2luZ0NhbGxTdHlsZSgpXG4gIH1cbiAgc2V0T25nb2luZ0NhbGxTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG4gICAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcbiAgICAgIG1pbkhlaWdodDogXCI0MDBweFwiLFxuICAgICAgbWluV2lkdGg6IFwiNDAwcHhcIixcbiAgICAgIG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBtYXhpbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH0pXG4gICAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub25nb2luZ0NhbGxTdHlsZSB9XG4gIH1cbiAgc2V0Y2FsbEJ1dHRvbnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDYWxsQnV0dG9uc1N0eWxlID0gbmV3IENhbGxCdXR0b25zU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdm9pY2VDYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdmlkZW9DYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdm9pY2VDYWxsSWNvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgdmlkZW9DYWxsSWNvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgdm9pY2VDYWxsSWNvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB2aWRlb0NhbGxJY29uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJ1dHRvblBhZGRpbmc6IFwiOHB4IDMycHhcIixcbiAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBidXR0b25Cb3JkZXI6IFwiMFwiLFxuICAgICAgYnV0dG9uQm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICB0aGlzLmNhbGxCdXR0b25zU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jYWxsQnV0dG9uc1N0eWxlIH1cbiAgICB0aGlzLnZvaWNlQ2FsbEJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuZGlzYWJsZUJ1dHRvbnMgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpIDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZvaWNlQ2FsbEljb25UaW50LFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52b2ljZUNhbGxJY29uVGV4dENvbG9yLFxuICAgICAgcGFkZGluZzogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvblBhZGRpbmcsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYnV0dG9uQmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJvcmRlclJhZGl1cyxcbiAgICAgIC4uLnRoaXMuYnV0dG9uU3R5bGVcbiAgICB9XG4gICAgdGhpcy52aWRlb0NhbGxCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmRpc2FibGVCdXR0b25zID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGludCxcbiAgICAgIGJ1dHRvblRleHRGb250OiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudmlkZW9DYWxsSWNvblRleHRGb250LFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudmlkZW9DYWxsSWNvblRleHRDb2xvcixcbiAgICAgIHBhZGRpbmc6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25QYWRkaW5nLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25Cb3JkZXJSYWRpdXMsXG4gICAgICAuLi50aGlzLmJ1dHRvblN0eWxlXG4gICAgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYm9yZGVyUmFkaXVzXG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY2FsbC1idXR0b25zX193cmFwcGVyXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWNhbGwtYnV0dG9ucy1idXR0b25zXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2Rpc2FibGVkXT1cImRpc2FibGVCdXR0b25zID8gdHJ1ZSA6IGZhbHNlXCIgKm5nSWY9XCJ1c2VyXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImluaXRpYXRlQXVkaW9DYWxsKClcIlxuICAgICAgW2J1dHRvblN0eWxlXT1cImdldFZvaWNlQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zKVwiIFt0ZXh0XT1cInZvaWNlQ2FsbEljb25UZXh0XCJcbiAgICAgIFtob3ZlclRleHRdPVwidm9pY2VDYWxsSWNvbkhvdmVyVGV4dFwiIFtpY29uVVJMXT1cInZvaWNlQ2FsbEljb25VUkxcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2Rpc2FibGVkXT1cImRpc2FibGVCdXR0b25zICA/IHRydWUgOiBmYWxzZVwiICpuZ0lmPVwidXNlciB8fCBncm91cFwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaW5pdGlhdGVWaWRlb0NhbGwoKVwiIFtidXR0b25TdHlsZV09XCJnZXRWaWRlb0NhbGxCdXR0b25TdHlsZShkaXNhYmxlQnV0dG9ucylcIlxuICAgICAgW3RleHRdPVwidmlkZW9DYWxsSWNvblRleHRcIiBbaG92ZXJUZXh0XT1cInZpZGVvQ2FsbEljb25Ib3ZlclRleHRcIiBbaWNvblVSTF09XCJ2aWRlb0NhbGxJY29uVVJMXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbjwvZGl2PlxuPGNvbWV0Y2hhdC1vbmdvaW5nLWNhbGwgKm5nSWY9XCJzaG93T25nb2luZ0NhbGxcIiBbbWF4aW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5tYXhpbWl6ZUljb25VUkxcIlxuICBbbWluaW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5taW5pbWl6ZUljb25VUkxcIlxuICBbb25nb2luZ0NhbGxTdHlsZV09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub25nb2luZ0NhbGxTdHlsZSB8fCBvbmdvaW5nQ2FsbFN0eWxlXCIgW3Nlc3Npb25JRF09XCJzZXNzaW9uSWRcIlxuICBbY2FsbFNldHRpbmdzQnVpbGRlcl09XCJnZXRDYWxsQnVpbGRlcigpIVwiPjwvY29tZXRjaGF0LW9uZ29pbmctY2FsbD5cbjxjb21ldGNoYXQtYmFja2Ryb3AgKm5nSWY9XCJzaG93T3V0Z29pbmdDYWxsc2NyZWVuXCI+XG4gIDxjb21ldGNoYXQtb3V0Z29pbmctY2FsbCBbY3VzdG9tU291bmRGb3JDYWxsc109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmN1c3RvbVNvdW5kRm9yQ2FsbHNcIlxuICAgIFtvbkVycm9yXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW2Rpc2FibGVTb3VuZEZvckNhbGxzXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uZGlzYWJsZVNvdW5kRm9yQ2FsbHNcIlxuICAgIFthdmF0YXJTdHlsZV09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCIgW2N1c3RvbVZpZXddPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5jdXN0b21WaWV3XCJcbiAgICBbZGVjbGluZUJ1dHRvbkljb25VUkxdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5kZWNsaW5lQnV0dG9uSWNvblVSTFwiXG4gICAgW29uQ2xvc2VDbGlja2VkXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub25DbG9zZUNsaWNrZWQgfHwgY2FuY2VsT3V0Z29pbmdDYWxsXCJcbiAgICBbb3V0Z29pbmdDYWxsU3R5bGVdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vdXRnb2luZ0NhbGxTdHlsZSB8fCBvdXRnb2luZ0NhbGxTdHlsZVwiXG4gICAgW2NhbGxdPVwiY2FsbCFcIj48L2NvbWV0Y2hhdC1vdXRnb2luZy1jYWxsPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+Il19