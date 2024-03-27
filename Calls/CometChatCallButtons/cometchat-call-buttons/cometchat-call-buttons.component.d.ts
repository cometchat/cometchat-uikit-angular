import { ChangeDetectorRef, OnInit } from '@angular/core';
import { CometChatThemeService } from '../../../CometChatTheme.service';
import { Subscription } from 'rxjs';
import { CallButtonsStyle, OutgoingCallStyle, OutgoingCallConfiguration, CallScreenConfiguration, CometChatUIKitCalls } from '@cometchat/uikit-shared';
import { CallscreenStyle } from '@cometchat/uikit-elements';
import '@cometchat/uikit-shared';
import * as i0 from "@angular/core";
/**
*
* CometChatCallButtonsComponent is a component which shows buttons for audio and video call for 1v1 and group call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatCallButtonsComponent implements OnInit {
    private ref;
    private themeService;
    user: CometChat.User;
    group: CometChat.Group;
    voiceCallIconURL: string;
    voiceCallIconText: string;
    voiceCallIconHoverText: string;
    videoCallIconURL: string;
    videoCallIconText: string;
    videoCallIconHoverText: string;
    onVoiceCallClick: ((user: CometChat.User, group: CometChat.Group) => void) | null;
    onVideoCallClick: ((user: CometChat.User, group: CometChat.Group) => void) | null;
    onError: (error: CometChat.CometChatException) => void;
    callButtonsStyle: CallButtonsStyle;
    outgoingCallConfiguration: OutgoingCallConfiguration;
    ongoingCallConfiguration: CallScreenConfiguration;
    call: CometChat.Call | null;
    ccOutgoingCall: Subscription;
    ccCallRejected: Subscription;
    ccCallEnded: Subscription;
    disableButtons: boolean;
    showOngoingCall: boolean;
    sessionId: string;
    callbuttonsListenerId: string;
    loggedInUser: CometChat.User | null;
    buttonStyle: any;
    voiceCallButtonStyle: any;
    videoCallButtonStyle: any;
    showOutgoingCallscreen: boolean;
    outgoingCallStyle: OutgoingCallStyle;
    ongoingCallStyle: CallscreenStyle;
    activeCall: CometChat.Call | null;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnInit(): void;
    ngOnDestroy(): void;
    getCallBuilder(): typeof CometChatUIKitCalls.CallSettings | undefined;
    closeCallScreen(): void;
    openOngoingCallScreen(call: CometChat.Call): void;
    initiateCall(type: string): void;
    initiateAudioCall(): void;
    initiateVideoCall(): void;
    sendCustomMessage(): void;
    cancelOutgoingCall: () => void;
    getVoiceCallButtonStyle(disableButtons: boolean): any;
    getVideoCallButtonStyle(disableButtons: boolean): any;
    attachListeners(): void;
    removeListener(): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    setThemeStyle(): void;
    setOngoingCallStyle: () => void;
    setcallButtonsStyle(): void;
    wrapperStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatCallButtonsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatCallButtonsComponent, "cometchat-call-buttons", never, { "user": "user"; "group": "group"; "voiceCallIconURL": "voiceCallIconURL"; "voiceCallIconText": "voiceCallIconText"; "voiceCallIconHoverText": "voiceCallIconHoverText"; "videoCallIconURL": "videoCallIconURL"; "videoCallIconText": "videoCallIconText"; "videoCallIconHoverText": "videoCallIconHoverText"; "onVoiceCallClick": "onVoiceCallClick"; "onVideoCallClick": "onVideoCallClick"; "onError": "onError"; "callButtonsStyle": "callButtonsStyle"; "outgoingCallConfiguration": "outgoingCallConfiguration"; "ongoingCallConfiguration": "ongoingCallConfiguration"; }, {}, never, never>;
}
