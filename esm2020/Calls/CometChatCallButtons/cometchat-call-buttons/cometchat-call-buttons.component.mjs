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
CometChatCallButtonsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatCallButtonsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatCallButtonsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.12", type: CometChatCallButtonsComponent, selector: "cometchat-call-buttons", inputs: { user: "user", group: "group", voiceCallIconURL: "voiceCallIconURL", voiceCallIconText: "voiceCallIconText", voiceCallIconHoverText: "voiceCallIconHoverText", videoCallIconURL: "videoCallIconURL", videoCallIconText: "videoCallIconText", videoCallIconHoverText: "videoCallIconHoverText", onVoiceCallClick: "onVoiceCallClick", onVideoCallClick: "onVideoCallClick", onError: "onError", callButtonsStyle: "callButtonsStyle", outgoingCallConfiguration: "outgoingCallConfiguration", ongoingCallConfiguration: "ongoingCallConfiguration" }, ngImport: i0, template: "<div class=\"cc-call-buttons__wrapper\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-call-buttons-buttons\">\n    <cometchat-button [disabled]=\"disableButtons ? true : false\" *ngIf=\"user\" (cc-button-clicked)=\"initiateAudioCall()\"\n      [buttonStyle]=\"getVoiceCallButtonStyle(disableButtons)\" [text]=\"voiceCallIconText\"\n      [hoverText]=\"voiceCallIconHoverText\" [iconURL]=\"voiceCallIconURL\"></cometchat-button>\n    <cometchat-button [disabled]=\"disableButtons  ? true : false\" *ngIf=\"user || group\"\n      (cc-button-clicked)=\"initiateVideoCall()\" [buttonStyle]=\"getVideoCallButtonStyle(disableButtons)\"\n      [text]=\"videoCallIconText\" [hoverText]=\"videoCallIconHoverText\" [iconURL]=\"videoCallIconURL\"></cometchat-button>\n  </div>\n</div>\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\" [maximizeIconURL]=\"ongoingCallConfiguration.maximizeIconURL\"\n  [minimizeIconURL]=\"ongoingCallConfiguration.minimizeIconURL\"\n  [ongoingCallStyle]=\"ongoingCallConfiguration.ongoingCallStyle || ongoingCallStyle\" [sessionID]=\"sessionId\"\n  [callSettingsBuilder]=\"getCallBuilder()!\"></cometchat-ongoing-call>\n<cometchat-backdrop *ngIf=\"showOutgoingCallscreen\">\n  <cometchat-outgoing-call [customSoundForCalls]=\"outgoingCallConfiguration.customSoundForCalls\"\n    [onError]=\"outgoingCallConfiguration.onError\"\n    [disableSoundForCalls]=\"outgoingCallConfiguration.disableSoundForCalls\"\n    [avatarStyle]=\"outgoingCallConfiguration.avatarStyle\" [customView]=\"outgoingCallConfiguration.customView\"\n    [declineButtonIconURL]=\"outgoingCallConfiguration.declineButtonIconURL\"\n    [onCloseClicked]=\"outgoingCallConfiguration.onCloseClicked || cancelOutgoingCall\"\n    [outgoingCallStyle]=\"outgoingCallConfiguration.outgoingCallStyle || outgoingCallStyle\"\n    [call]=\"call!\"></cometchat-outgoing-call>\n</cometchat-backdrop>", styles: [".cc-call-buttons__wrapper{height:100%;width:100%}.cc-call-buttons-buttons{display:flex;gap:8px}\n"], components: [{ type: i2.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i3.CometChatOutgoingCallComponent, selector: "cometchat-outgoing-call", inputs: ["call", "declineButtonText", "declineButtonIconURL", "customView", "onError", "disableSoundForCalls", "customSoundForCalls", "avatarStyle", "outgoingCallStyle", "onCloseClicked"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatCallButtonsComponent, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxCdXR0b25zL2NvbWV0Y2hhdC1jYWxsLWJ1dHRvbnMvY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsdUJBQXVCLEVBQXFCLFNBQVMsRUFBRSxLQUFLLEVBQVUsTUFBTSxlQUFlLENBQUM7QUFDckcsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGFBQWEsRUFBd0MsTUFBTSw0QkFBNEIsQ0FBQztBQUU3TCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQXFCLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ25OLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUMzRCxPQUFPLHlCQUF5QixDQUFBOzs7Ozs7QUFDaEM7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sNkJBQTZCO0lBZ0V4QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBN0Q5RSxxQkFBZ0IsR0FBdUIseUJBQXlCLENBQUE7UUFDaEUsc0JBQWlCLEdBQVcsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ2xELDJCQUFzQixHQUFXLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUN2RCxxQkFBZ0IsR0FBdUIseUJBQXlCLENBQUE7UUFDaEUsc0JBQWlCLEdBQVcsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ2xELDJCQUFzQixHQUFXLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUd2RCxZQUFPLEdBQWtELENBQUMsS0FBbUMsRUFBRSxFQUFFO1lBQ3hHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDcEIsQ0FBQyxDQUFBO1FBQ1EscUJBQWdCLEdBQWlDO1lBQ3hELEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxHQUFHO1lBQ2pCLFVBQVUsRUFBRSxhQUFhO1NBQzFCLENBQUM7UUFDTyw4QkFBeUIsR0FBOEIsSUFBSSx5QkFBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN4Riw2QkFBd0IsR0FBNEIsSUFBSSx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUtyRixtQkFBYyxHQUFZLEtBQUssQ0FBQztRQUN2QyxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUNqQyxjQUFTLEdBQVcsRUFBRSxDQUFDO1FBQ2hCLDBCQUFxQixHQUFXLGNBQWMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RFLGlCQUFZLEdBQTBCLElBQUksQ0FBQztRQUNsRCxnQkFBVyxHQUFRO1lBQ2pCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixPQUFPLEVBQUUsTUFBTTtZQUNmLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLGNBQWMsRUFBRSxRQUFRO1lBQ3hCLFVBQVUsRUFBRSxRQUFRO1NBQ3JCLENBQUE7UUFDRCx5QkFBb0IsR0FBUTtZQUMxQixjQUFjLEVBQUUsbUJBQW1CO1lBQ25DLGNBQWMsRUFBRSxnQkFBZ0I7WUFDaEMsZUFBZSxFQUFFLG1CQUFtQjtZQUNwQyxPQUFPLEVBQUUsVUFBVTtTQUNwQixDQUFBO1FBQ0QseUJBQW9CLEdBQVE7WUFDMUIsY0FBYyxFQUFFLG1CQUFtQjtZQUNuQyxjQUFjLEVBQUUsZ0JBQWdCO1lBQ2hDLGVBQWUsRUFBRSxtQkFBbUI7WUFDcEMsT0FBTyxFQUFFLFVBQVU7U0FDcEIsQ0FBQTtRQUNELDJCQUFzQixHQUFZLEtBQUssQ0FBQztRQUN4QyxzQkFBaUIsR0FBc0I7WUFDckMsS0FBSyxFQUFFLE9BQU87WUFDZCxNQUFNLEVBQUUsT0FBTztZQUNmLGFBQWEsRUFBRSxnQkFBZ0I7WUFDL0IsY0FBYyxFQUFFLGlCQUFpQjtZQUNqQyxnQkFBZ0IsRUFBRSxnQkFBZ0I7WUFDbEMsaUJBQWlCLEVBQUUsd0JBQXdCO1lBQzNDLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUM7UUFDRixxQkFBZ0IsR0FBb0IsRUFBRSxDQUFBO1FBQ3RDLGVBQVUsR0FBMEIsSUFBSSxDQUFBO1FBNEp4Qyx1QkFBa0IsR0FBRyxHQUFHLEVBQUU7WUFDeEIscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUE7WUFDN0IsU0FBUyxDQUFDLFVBQVUsQ0FDbEIsSUFBSSxDQUFDLElBQUssQ0FBQyxZQUFZLEVBQUUsRUFDekIsdUJBQXVCLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDeEM7aUJBQ0UsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUE7Z0JBQ25DLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQzdDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFBO1lBQzFCLENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDZixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7aUJBQ3BCO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDTCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsS0FBSyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7UUFDMUIsQ0FBQyxDQUFBO1FBcUZELHdCQUFtQixHQUFHLEdBQUcsRUFBRTtZQUN6QixJQUFJLFlBQVksR0FBRyxJQUFJLGVBQWUsQ0FBQztnQkFDckMsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxZQUFZLEVBQUUsR0FBRztnQkFDakIsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLFNBQVMsRUFBRSxPQUFPO2dCQUNsQixRQUFRLEVBQUUsT0FBTztnQkFDakIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDaEUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTthQUNqRSxDQUFDLENBQUE7WUFDRixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1FBQ3ZFLENBQUMsQ0FBQTtRQXlDRCxpQkFBWSxHQUFHLEdBQUcsRUFBRTtZQUNsQixPQUFPO2dCQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsTUFBTTtnQkFDckMsS0FBSyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLO2dCQUNuQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFVBQVU7Z0JBQzdDLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsTUFBTTtnQkFDckMsWUFBWSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZO2FBQ2xELENBQUE7UUFDSCxDQUFDLENBQUE7SUFsVTBGLENBQUM7SUFDNUYsUUFBUTtRQUNOLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUEyQixFQUFFLEVBQUU7WUFDL0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUE7UUFDMUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBbUMsRUFBRSxFQUFFO1lBQy9DLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUNwQjtRQUNILENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtRQUN0QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtJQUMxQixDQUFDO0lBQ0QsV0FBVztRQUNULElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtJQUM1QixDQUFDO0lBQ0QsY0FBYztRQUNaLE1BQU0sYUFBYSxHQUFZLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLEtBQUssdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQUN6RyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVJLENBQUMsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDNUgsT0FBTyxDQUFDLGVBQWUsQ0FDbkIsSUFBSSxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQztZQUMxQyxXQUFXLEVBQUUsR0FBRyxFQUFFO2dCQUNoQixZQUFZLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUU7b0JBQ3BGLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7aUJBQ3hCO1lBRUgsQ0FBQztZQUNELHNCQUFzQixFQUFFLEdBQUcsRUFBRTtnQkFDM0IsWUFBWSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLElBQUksdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFO29CQUNwRixTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFvQixFQUFFLEVBQUU7d0JBQzlELG1CQUFtQixDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUNqQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMzQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3pCLENBQUMsQ0FBQzt5QkFDQyxLQUFLLENBQUMsQ0FBQyxHQUFpQyxFQUFFLEVBQUU7d0JBQzNDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTs0QkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTt5QkFDbEI7b0JBRUgsQ0FBQyxDQUFDLENBQUE7aUJBQ0w7cUJBQ0k7b0JBQ0gsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2lCQUN4QjtZQUdILENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFtQyxFQUFFLEVBQUU7Z0JBQy9DLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtpQkFDcEI7WUFDSCxDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUE7UUFDSCxPQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBQ0QsZUFBZTtRQUNiLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFBO1FBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO1FBQ3RCLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFBO1FBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO1FBQ25CLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtJQUMxQixDQUFDO0lBQ0QscUJBQXFCLENBQUMsSUFBb0I7UUFDeEMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztRQUNwQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQTtRQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtRQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFBO0lBQzFCLENBQUM7SUFDRCxZQUFZLENBQUMsSUFBWTtRQUV2QixNQUFNLFlBQVksR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQTtRQUM3SSxNQUFNLFVBQVUsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ2hGLE1BQU0sSUFBSSxHQUFtQixJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQzdDLFVBQVUsRUFDVixJQUFJLEVBQ0osWUFBWSxDQUNiLENBQUM7UUFDRixTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQzthQUN6QixJQUFJLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQTtZQUN4QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7WUFDeEIsbUJBQW1CLENBQUMsY0FBYyxDQUFDLElBQUksQ0FDckMsWUFBWSxDQUNiLENBQUE7UUFFSCxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNmLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUNwQjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELGlCQUFpQjtRQUNmLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtZQUNiLElBQUksQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQzlEO0lBQ0gsQ0FBQztJQUNELGlCQUFpQjtRQUNmLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtZQUNiLElBQUksQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQzlEO2FBQ0k7WUFDSCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUE7WUFDckMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUE7WUFDeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtTQUV6QjtJQUNILENBQUM7SUFDRCxpQkFBaUI7UUFDZixNQUFNLFlBQVksR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQTtRQUM3SSxNQUFNLFVBQVUsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ2hGLE1BQU0sVUFBVSxHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN4SSxNQUFNLFVBQVUsR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3pELE1BQU0sY0FBYyxHQUFHLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRWpELE1BQU0sYUFBYSxHQUFRLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN6RyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDMUQsYUFBYSxDQUFDLFdBQVcsQ0FBRSxZQUFvQixDQUFDLENBQUM7UUFDakQsYUFBYSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hELGFBQWEsQ0FBQyxNQUFNLEdBQUcscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUNoRSxhQUFhLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2hELGlCQUFpQjtRQUNqQixzQkFBc0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDO1lBQ3hDLE9BQU8sRUFBRSxhQUFhO1lBQ3RCLE1BQU0sRUFBRSxhQUFhLENBQUMsVUFBVTtTQUNqQyxDQUFDLENBQUE7UUFFRixTQUFTLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDdEQsWUFBWSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ25FLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxHQUFHO2dCQUNaLE1BQU0sRUFBRSxhQUFhLENBQUMsT0FBTzthQUM5QixDQUFDLENBQUE7UUFDSixDQUFDLENBQUM7YUFDQyxLQUFLLENBQUMsQ0FBQyxLQUFtQyxFQUFFLEVBQUU7WUFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQ3BCO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFTixDQUFDO0lBc0JELHVCQUF1QixDQUFDLGNBQXVCO1FBQzdDLE1BQU0sY0FBYyxHQUFHLGNBQWM7WUFDbkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDaEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQztRQUU3QyxPQUFPO1lBQ0wsR0FBRyxJQUFJLENBQUMsb0JBQW9CO1lBQzVCLGNBQWM7U0FDZixDQUFDO0lBQ0osQ0FBQztJQUNELHVCQUF1QixDQUFDLGNBQXVCO1FBQzdDLE1BQU0sY0FBYyxHQUFHLGNBQWM7WUFDbkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDaEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQztRQUU3QyxPQUFPO1lBQ0wsR0FBRyxJQUFJLENBQUMsb0JBQW9CO1lBQzVCLGNBQWM7U0FDZixDQUFDO0lBQ0osQ0FBQztJQUVELGVBQWU7UUFDYixTQUFTLENBQUMsZUFBZSxDQUN2QixJQUFJLENBQUMscUJBQXFCLEVBQzFCLElBQUksU0FBUyxDQUFDLFlBQVksQ0FBQztZQUN6QixzQkFBc0IsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFDRCx1QkFBdUIsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUE7Z0JBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7WUFDMUIsQ0FBQztZQUNELHNCQUFzQixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO2dCQUMvQyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQ2hFLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFBO29CQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztvQkFDakIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztvQkFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtpQkFDekI7WUFFSCxDQUFDO1lBQ0Qsc0JBQXNCLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7Z0JBQy9DLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUU7b0JBQy9GLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUNqQixZQUFZLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3JFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDbEM7WUFFSCxDQUFDO1lBQ0QsMEJBQTBCLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFBO2dCQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtZQUMxQixDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBQ0QsY0FBYztRQUNaLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBQ0QsaUJBQWlCO1FBQ2YsSUFBSSxDQUFDLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBb0IsRUFBRSxFQUFFO1lBQzFGLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFBO1lBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7UUFDMUIsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsY0FBYyxHQUFHLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFvQixFQUFFLEVBQUU7WUFDMUYsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUE7WUFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtRQUMxQixDQUFDLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxXQUFXLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQW9CLEVBQUUsRUFBRTtZQUNwRixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7UUFDeEIsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBQ0QsbUJBQW1CO1FBQ2pCLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxFQUFFLENBQUE7UUFDbEMsSUFBSSxDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsQ0FBQTtRQUNsQyxJQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxDQUFBO0lBQ2pDLENBQUM7SUFDRCxhQUFhO1FBQ1gsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7UUFDMUIsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7SUFDNUIsQ0FBQztJQWVELG1CQUFtQjtRQUNqQixJQUFJLFlBQVksR0FBcUIsSUFBSSxnQkFBZ0IsQ0FBQztZQUN4RCxLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxNQUFNO1lBQ2QsVUFBVSxFQUFFLGFBQWE7WUFDekIsTUFBTSxFQUFFLE1BQU07WUFDZCxZQUFZLEVBQUUsR0FBRztZQUNqQixpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQy9ELGlCQUFpQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDL0QscUJBQXFCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDOUUscUJBQXFCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDOUUsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUNwRSxzQkFBc0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQ3BFLGFBQWEsRUFBRSxVQUFVO1lBQ3pCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDaEUsWUFBWSxFQUFFLEdBQUc7WUFDakIsa0JBQWtCLEVBQUUsS0FBSztTQUMxQixDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1FBQ3JFLElBQUksQ0FBQyxvQkFBb0IsR0FBRztZQUMxQixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCO1lBQzlILGNBQWMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCO1lBQzNELGVBQWUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCO1lBQzdELE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYTtZQUM1QyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQjtZQUNsRCxNQUFNLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU07WUFDcEMsWUFBWSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0I7WUFDdEQsR0FBRyxJQUFJLENBQUMsV0FBVztTQUNwQixDQUFBO1FBQ0QsSUFBSSxDQUFDLG9CQUFvQixHQUFHO1lBQzFCLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUI7WUFDOUgsY0FBYyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUI7WUFDM0QsZUFBZSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0I7WUFDN0QsT0FBTyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhO1lBQzVDLFVBQVUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCO1lBQ2xELE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTTtZQUNwQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQjtZQUN0RCxHQUFHLElBQUksQ0FBQyxXQUFXO1NBQ3BCLENBQUE7SUFDSCxDQUFDOzsySEF6WFUsNkJBQTZCOytHQUE3Qiw2QkFBNkIsNGxCQ3ZCMUMseTFEQXVCcUI7NEZEQVIsNkJBQTZCO2tCQU56QyxTQUFTOytCQUNFLHdCQUF3QixtQkFHakIsdUJBQXVCLENBQUMsTUFBTTs0SUFHdEMsSUFBSTtzQkFBWixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFHRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBT0cseUJBQXlCO3NCQUFqQyxLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZSc7XG5pbXBvcnQgeyBsb2NhbGl6ZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIGZvbnRIZWxwZXIsIENvbWV0Q2hhdENhbGxFdmVudHMsIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsIE1lc3NhZ2VTdGF0dXMsIENvbWV0Q2hhdExvY2FsaXplLCBDb21ldENoYXRVSUV2ZW50cyB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgQ2FsbEJ1dHRvbnNTdHlsZSwgQ29tZXRDaGF0U291bmRNYW5hZ2VyLCBPdXRnb2luZ0NhbGxTdHlsZSwgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LCBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLCBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbiwgQ29tZXRDaGF0VUlLaXRDYWxscywgU3RvcmFnZVV0aWxzIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0IHsgQ2FsbHNjcmVlblN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnXG4vKipcbipcbiogQ29tZXRDaGF0Q2FsbEJ1dHRvbnNDb21wb25lbnQgaXMgYSBjb21wb25lbnQgd2hpY2ggc2hvd3MgYnV0dG9ucyBmb3IgYXVkaW8gYW5kIHZpZGVvIGNhbGwgZm9yIDF2MSBhbmQgZ3JvdXAgY2FsbC5cbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY2FsbC1idXR0b25zXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWNhbGwtYnV0dG9ucy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0Q2FsbEJ1dHRvbnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSB2b2ljZUNhbGxJY29uVVJMOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcImFzc2V0cy9BdWRpby1DYWxsMnguc3ZnXCJcbiAgQElucHV0KCkgdm9pY2VDYWxsSWNvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiVk9JQ0VfQ0FMTFwiKVxuICBASW5wdXQoKSB2b2ljZUNhbGxJY29uSG92ZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlZPSUNFX0NBTExcIilcbiAgQElucHV0KCkgdmlkZW9DYWxsSWNvblVSTDogc3RyaW5nIHwgdW5kZWZpbmVkID0gXCJhc3NldHMvVmlkZW8tY2FsbDJ4LnN2Z1wiXG4gIEBJbnB1dCgpIHZpZGVvQ2FsbEljb25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlZJREVPX0NBTExcIilcbiAgQElucHV0KCkgdmlkZW9DYWxsSWNvbkhvdmVyVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJWSURFT19DQUxMXCIpXG4gIEBJbnB1dCgpIG9uVm9pY2VDYWxsQ2xpY2s/OiAoKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB2b2lkKSB8IG51bGw7XG4gIEBJbnB1dCgpIG9uVmlkZW9DYWxsQ2xpY2s/OiAoKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB2b2lkKSB8IG51bGw7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIGNhbGxCdXR0b25zU3R5bGU6IENhbGxCdXR0b25zU3R5bGUgfCB1bmRlZmluZWQgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICB9O1xuICBASW5wdXQoKSBvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uOiBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uID0gbmV3IE91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24oe30pXG4gIEBJbnB1dCgpIG9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbjogQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24gPSBuZXcgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24oe30pXG4gIGNhbGwhOiBDb21ldENoYXQuQ2FsbCB8IG51bGw7XG4gIHB1YmxpYyBjY091dGdvaW5nQ2FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbFJlamVjdGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBkaXNhYmxlQnV0dG9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93T25nb2luZ0NhbGw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2Vzc2lvbklkOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgY2FsbGJ1dHRvbnNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNhbGxidXR0b25zX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG4gIGJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICB9XG4gIHZvaWNlQ2FsbEJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiUkdCKDUxLCAxNTMsIDI1NSlcIixcbiAgICBidXR0b25UZXh0Rm9udDogXCI0MDAgMTJweCBJbnRlclwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIHBhZGRpbmc6IFwiOHB4IDMycHhcIlxuICB9XG4gIHZpZGVvQ2FsbEJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiUkdCKDUxLCAxNTMsIDI1NSlcIixcbiAgICBidXR0b25UZXh0Rm9udDogXCI0MDAgMTJweCBJbnRlclwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJSR0IoNTEsIDE1MywgMjU1KVwiLFxuICAgIHBhZGRpbmc6IFwiOHB4IDMycHhcIlxuICB9XG4gIHNob3dPdXRnb2luZ0NhbGxzY3JlZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgb3V0Z29pbmdDYWxsU3R5bGU6IE91dGdvaW5nQ2FsbFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjM2MHB4XCIsXG4gICAgaGVpZ2h0OiBcIjU4MXB4XCIsXG4gICAgdGl0bGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICAgIHRpdGxlVGV4dENvbG9yOiBcIlJHQigyMCwgMjAsIDIwKVwiLFxuICAgIHN1YnRpdGxlVGV4dEZvbnQ6IFwiNDAwIDE1cHggSW50ZXJcIixcbiAgICBzdWJ0aXRsZVRleHRDb2xvcjogXCJSR0JBKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gIH07XG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9XG4gIGFjdGl2ZUNhbGw6IENvbWV0Q2hhdC5DYWxsIHwgbnVsbCA9IG51bGxcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyXG4gICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpXG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKVxuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKVxuICB9XG4gIGdldENhbGxCdWlsZGVyKCk6IHR5cGVvZiBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5ncyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgYXVkaW9Pbmx5Q2FsbDogYm9vbGVhbiA9IHRoaXMuYWN0aXZlQ2FsbD8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW87XG4gICAgY29uc3QgYnVpbGRlciA9IHRoaXMub25nb2luZ0NhbGxDb25maWd1cmF0aW9uPy5jYWxsU2V0dGluZ3NCdWlsZGVyID8gdGhpcy5vbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY2FsbFNldHRpbmdzQnVpbGRlcihhdWRpb09ubHlDYWxsLCB0aGlzLnVzZXIsIHRoaXMuZ3JvdXApXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbFNldHRpbmdzQnVpbGRlcigpLmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSkuc2V0SXNBdWRpb09ubHlDYWxsKGF1ZGlvT25seUNhbGwpO1xuICAgIGJ1aWxkZXIuc2V0Q2FsbExpc3RlbmVyKFxuICAgICAgICBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5PbmdvaW5nQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkNhbGxFbmRlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG4gICAgICAgICAgICBpZiAodGhpcy5jYWxsPy5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2FsbEVuZEJ1dHRvblByZXNzZWQ6ICgpID0+IHtcbiAgICAgICAgICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG51bGwpO1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbD8uZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklkKS50aGVuKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dChjYWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpXG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgIHJldHVybiBidWlsZGVyLmJ1aWxkKCk7XG4gIH1cbiAgY2xvc2VDYWxsU2NyZWVuKCkge1xuICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgIHRoaXMuYWN0aXZlQ2FsbCA9IG51bGxcbiAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlXG4gICAgdGhpcy5zZXNzaW9uSWQgPSBcIlwiXG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBvcGVuT25nb2luZ0NhbGxTY3JlZW4oY2FsbDogQ29tZXRDaGF0LkNhbGwpIHtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZUNhbGwgPSBjYWxsXG4gICAgdGhpcy5zZXNzaW9uSWQgPSBjYWxsLmdldFNlc3Npb25JZCgpXG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgaW5pdGlhdGVDYWxsKHR5cGU6IHN0cmluZykge1xuXG4gICAgY29uc3QgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgY29uc3QgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyID8gdGhpcy51c2VyLmdldFVpZCgpIDogdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICBjb25zdCBjYWxsOiBDb21ldENoYXQuQ2FsbCA9IG5ldyBDb21ldENoYXQuQ2FsbChcbiAgICAgIHJlY2VpdmVySWQsXG4gICAgICB0eXBlLFxuICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgKTtcbiAgICBDb21ldENoYXQuaW5pdGlhdGVDYWxsKGNhbGwpXG4gICAgICAudGhlbigob3V0Z29pbmdDYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuY2FsbCA9IG91dGdvaW5nQ2FsbFxuICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSB0cnVlO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5uZXh0KFxuICAgICAgICAgIG91dGdvaW5nQ2FsbFxuICAgICAgICApXG5cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgaW5pdGlhdGVBdWRpb0NhbGwoKSB7XG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgdGhpcy5pbml0aWF0ZUNhbGwoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvKVxuICAgIH1cbiAgfVxuICBpbml0aWF0ZVZpZGVvQ2FsbCgpIHtcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICB0aGlzLmluaXRpYXRlQ2FsbChDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zZXNzaW9uSWQgPSB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgICAgdGhpcy5zZW5kQ3VzdG9tTWVzc2FnZSgpXG4gICAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IHRydWU7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcblxuICAgIH1cbiAgfVxuICBzZW5kQ3VzdG9tTWVzc2FnZSgpIHtcbiAgICBjb25zdCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlciA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICBjb25zdCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXIgPyB0aGlzLnVzZXIuZ2V0VWlkKCkgOiB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgIGNvbnN0IGN1c3RvbURhdGEgPSB7IFwic2Vzc2lvbklEXCI6IHRoaXMuc2Vzc2lvbklkLCBcInNlc3Npb25JZFwiOiB0aGlzLnNlc3Npb25JZCwgXCJjYWxsVHlwZVwiOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8gfTtcbiAgICBjb25zdCBjdXN0b21UeXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMubWVldGluZztcbiAgICBjb25zdCBjb252ZXJzYXRpb25JZCA9IGBncm91cF8ke3RoaXMuc2Vzc2lvbklkfWA7XG5cbiAgICBjb25zdCBjdXN0b21NZXNzYWdlOiBhbnkgPSBuZXcgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBjdXN0b21UeXBlLCBjdXN0b21EYXRhKTtcbiAgICBjdXN0b21NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlcik7XG4gICAgY3VzdG9tTWVzc2FnZS5zaG91bGRVcGRhdGVDb252ZXJzYXRpb24odHJ1ZSk7XG4gICAgY3VzdG9tTWVzc2FnZS5zZXRNZXRhZGF0YSh7IGluY3JlbWVudFVucmVhZENvdW50OiB0cnVlIH0pO1xuICAgIGN1c3RvbU1lc3NhZ2Uuc2V0UmVjZWl2ZXIoKHJlY2VpdmVyVHlwZSBhcyBhbnkpKTtcbiAgICBjdXN0b21NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKGNvbnZlcnNhdGlvbklkKTtcbiAgICBjdXN0b21NZXNzYWdlLnNlbnRBdCA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCk7XG4gICAgY3VzdG9tTWVzc2FnZS5tdWlkID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCk7XG4gICAgLy8gY3VzdG9tIG1lc3NhZ2VcbiAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICBtZXNzYWdlOiBjdXN0b21NZXNzYWdlLFxuICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3NcbiAgICB9KVxuXG4gICAgQ29tZXRDaGF0LnNlbmRDdXN0b21NZXNzYWdlKGN1c3RvbU1lc3NhZ2UpLnRoZW4oKG1zZykgPT4ge1xuICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbXNnKVxuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICBtZXNzYWdlOiBtc2csXG4gICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzXG4gICAgICB9KVxuICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgfVxuICBjYW5jZWxPdXRnb2luZ0NhbGwgPSAoKSA9PiB7XG4gICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKClcbiAgICBDb21ldENoYXQucmVqZWN0Q2FsbChcbiAgICAgIHRoaXMuY2FsbCEuZ2V0U2Vzc2lvbklkKCksXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5jYW5jZWxsZWRcbiAgICApXG4gICAgICAudGhlbigoY2FsbCkgPT4ge1xuICAgICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlXG4gICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsUmVqZWN0ZWQubmV4dChjYWxsKVxuICAgICAgICB0aGlzLmNhbGwgPSBudWxsO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIGdldFZvaWNlQ2FsbEJ1dHRvblN0eWxlKGRpc2FibGVCdXR0b25zOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uSWNvblRpbnQgPSBkaXNhYmxlQnV0dG9uc1xuICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICA6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZT8udm9pY2VDYWxsSWNvblRpbnQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy52aWRlb0NhbGxCdXR0b25TdHlsZSxcbiAgICAgIGJ1dHRvbkljb25UaW50LFxuICAgIH07XG4gIH1cbiAgZ2V0VmlkZW9DYWxsQnV0dG9uU3R5bGUoZGlzYWJsZUJ1dHRvbnM6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBidXR0b25JY29uVGludCA9IGRpc2FibGVCdXR0b25zXG4gICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgICAgIDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlPy52aWRlb0NhbGxJY29uVGludDtcblxuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLnZpZGVvQ2FsbEJ1dHRvblN0eWxlLFxuICAgICAgYnV0dG9uSWNvblRpbnQsXG4gICAgfTtcbiAgfVxuXG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgdGhpcy5jYWxsYnV0dG9uc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgIG9uSW5jb21pbmdDYWxsUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuY2FsbCA9IGNhbGw7XG4gICAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICBvbkluY29taW5nQ2FsbENhbmNlbGxlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IGZhbHNlXG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIH0sXG4gICAgICAgIG9uT3V0Z29pbmdDYWxsUmVqZWN0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmNhbGwgJiYgdGhpcy5jYWxsLmdldFNlc3Npb25JZCgpID09IGNhbGwuZ2V0U2Vzc2lvbklkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgICAgICAgICAgdGhpcy5jYWxsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmNhbGwgJiYgdGhpcy5jYWxsLmdldFNlc3Npb25JZCgpID09IGNhbGwuZ2V0U2Vzc2lvbklkKCkgJiYgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGwgPSBjYWxsO1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgY2FsbCk7XG4gICAgICAgICAgICB0aGlzLm9wZW5PbmdvaW5nQ2FsbFNjcmVlbihjYWxsKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSxcbiAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuZGlzYWJsZUJ1dHRvbnMgPSBmYWxzZVxuICAgICAgICAgIHRoaXMuY2FsbCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQucmVtb3ZlQ2FsbExpc3RlbmVyKHRoaXMuY2FsbGJ1dHRvbnNMaXN0ZW5lcklkKTtcbiAgfVxuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICB0aGlzLmRpc2FibGVCdXR0b25zID0gZmFsc2VcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pXG4gICAgdGhpcy5jY091dGdvaW5nQ2FsbCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NPdXRnb2luZ0NhbGwuc3Vic2NyaWJlKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgdGhpcy5kaXNhYmxlQnV0dG9ucyA9IHRydWVcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH0pXG4gICAgdGhpcy5jY0NhbGxFbmRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQuc3Vic2NyaWJlKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKVxuICAgIH0pXG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkPy51bnN1YnNjcmliZSgpXG4gICAgdGhpcy5jY091dGdvaW5nQ2FsbD8udW5zdWJzY3JpYmUoKVxuICAgIHRoaXMuY2NDYWxsRW5kZWQ/LnVuc3Vic2NyaWJlKClcbiAgfVxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0Y2FsbEJ1dHRvbnNTdHlsZSgpXG4gICAgdGhpcy5zZXRPbmdvaW5nQ2FsbFN0eWxlKClcbiAgfVxuICBzZXRPbmdvaW5nQ2FsbFN0eWxlID0gKCkgPT4ge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgQ2FsbHNjcmVlblN0eWxlKHtcbiAgICAgIG1heEhlaWdodDogXCIxMDAlXCIsXG4gICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiIzFjMjIyNlwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjQwMHB4XCIsXG4gICAgICBtaW5XaWR0aDogXCI0MDBweFwiLFxuICAgICAgbWluaW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfSlcbiAgICB0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH1cbiAgfVxuICBzZXRjYWxsQnV0dG9uc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENhbGxCdXR0b25zU3R5bGUgPSBuZXcgQ2FsbEJ1dHRvbnNTdHlsZSh7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB2b2ljZUNhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB2aWRlb0NhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB2b2ljZUNhbGxJY29uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICB2aWRlb0NhbGxJY29uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICB2b2ljZUNhbGxJY29uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHZpZGVvQ2FsbEljb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYnV0dG9uUGFkZGluZzogXCI4cHggMzJweFwiLFxuICAgICAgYnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJ1dHRvbkJvcmRlcjogXCIwXCIsXG4gICAgICBidXR0b25Cb3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgICB9KVxuICAgIHRoaXMuY2FsbEJ1dHRvbnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNhbGxCdXR0b25zU3R5bGUgfVxuICAgIHRoaXMudm9pY2VDYWxsQnV0dG9uU3R5bGUgPSB7XG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5kaXNhYmxlQnV0dG9ucyA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCkgOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUudm9pY2VDYWxsSWNvblRpbnQsXG4gICAgICBidXR0b25UZXh0Rm9udDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZvaWNlQ2FsbEljb25UZXh0Rm9udCxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZvaWNlQ2FsbEljb25UZXh0Q29sb3IsXG4gICAgICBwYWRkaW5nOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYnV0dG9uUGFkZGluZyxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS5idXR0b25CYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYnV0dG9uQm9yZGVyUmFkaXVzLFxuICAgICAgLi4udGhpcy5idXR0b25TdHlsZVxuICAgIH1cbiAgICB0aGlzLnZpZGVvQ2FsbEJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuZGlzYWJsZUJ1dHRvbnMgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpIDogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLnZpZGVvQ2FsbEljb25UaW50LFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZS52aWRlb0NhbGxJY29uVGV4dENvbG9yLFxuICAgICAgcGFkZGluZzogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvblBhZGRpbmcsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmNhbGxCdXR0b25zU3R5bGUuYnV0dG9uQmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jYWxsQnV0dG9uc1N0eWxlLmJ1dHRvbkJvcmRlclJhZGl1cyxcbiAgICAgIC4uLnRoaXMuYnV0dG9uU3R5bGVcbiAgICB9XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZT8uaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZT8ud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmNhbGxCdXR0b25zU3R5bGU/LmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY2FsbEJ1dHRvbnNTdHlsZT8uYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNhbGxCdXR0b25zU3R5bGU/LmJvcmRlclJhZGl1c1xuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWNhbGwtYnV0dG9uc19fd3JhcHBlclwiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1jYWxsLWJ1dHRvbnMtYnV0dG9uc1wiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtkaXNhYmxlZF09XCJkaXNhYmxlQnV0dG9ucyA/IHRydWUgOiBmYWxzZVwiICpuZ0lmPVwidXNlclwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJpbml0aWF0ZUF1ZGlvQ2FsbCgpXCJcbiAgICAgIFtidXR0b25TdHlsZV09XCJnZXRWb2ljZUNhbGxCdXR0b25TdHlsZShkaXNhYmxlQnV0dG9ucylcIiBbdGV4dF09XCJ2b2ljZUNhbGxJY29uVGV4dFwiXG4gICAgICBbaG92ZXJUZXh0XT1cInZvaWNlQ2FsbEljb25Ib3ZlclRleHRcIiBbaWNvblVSTF09XCJ2b2ljZUNhbGxJY29uVVJMXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtkaXNhYmxlZF09XCJkaXNhYmxlQnV0dG9ucyAgPyB0cnVlIDogZmFsc2VcIiAqbmdJZj1cInVzZXIgfHwgZ3JvdXBcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImluaXRpYXRlVmlkZW9DYWxsKClcIiBbYnV0dG9uU3R5bGVdPVwiZ2V0VmlkZW9DYWxsQnV0dG9uU3R5bGUoZGlzYWJsZUJ1dHRvbnMpXCJcbiAgICAgIFt0ZXh0XT1cInZpZGVvQ2FsbEljb25UZXh0XCIgW2hvdmVyVGV4dF09XCJ2aWRlb0NhbGxJY29uSG92ZXJUZXh0XCIgW2ljb25VUkxdPVwidmlkZW9DYWxsSWNvblVSTFwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG48L2Rpdj5cbjxjb21ldGNoYXQtb25nb2luZy1jYWxsICpuZ0lmPVwic2hvd09uZ29pbmdDYWxsXCIgW21heGltaXplSWNvblVSTF09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ubWF4aW1pemVJY29uVVJMXCJcbiAgW21pbmltaXplSWNvblVSTF09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ubWluaW1pemVJY29uVVJMXCJcbiAgW29uZ29pbmdDYWxsU3R5bGVdPVwib25nb2luZ0NhbGxDb25maWd1cmF0aW9uLm9uZ29pbmdDYWxsU3R5bGUgfHwgb25nb2luZ0NhbGxTdHlsZVwiIFtzZXNzaW9uSURdPVwic2Vzc2lvbklkXCJcbiAgW2NhbGxTZXR0aW5nc0J1aWxkZXJdPVwiZ2V0Q2FsbEJ1aWxkZXIoKSFcIj48L2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGw+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwic2hvd091dGdvaW5nQ2FsbHNjcmVlblwiPlxuICA8Y29tZXRjaGF0LW91dGdvaW5nLWNhbGwgW2N1c3RvbVNvdW5kRm9yQ2FsbHNdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5jdXN0b21Tb3VuZEZvckNhbGxzXCJcbiAgICBbb25FcnJvcl09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtkaXNhYmxlU291bmRGb3JDYWxsc109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmRpc2FibGVTb3VuZEZvckNhbGxzXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiIFtjdXN0b21WaWV3XT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY3VzdG9tVmlld1wiXG4gICAgW2RlY2xpbmVCdXR0b25JY29uVVJMXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uZGVjbGluZUJ1dHRvbkljb25VUkxcIlxuICAgIFtvbkNsb3NlQ2xpY2tlZF09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm9uQ2xvc2VDbGlja2VkIHx8IGNhbmNlbE91dGdvaW5nQ2FsbFwiXG4gICAgW291dGdvaW5nQ2FsbFN0eWxlXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub3V0Z29pbmdDYWxsU3R5bGUgfHwgb3V0Z29pbmdDYWxsU3R5bGVcIlxuICAgIFtjYWxsXT1cImNhbGwhXCI+PC9jb21ldGNoYXQtb3V0Z29pbmctY2FsbD5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPiJdfQ==