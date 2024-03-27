import { ChangeDetectorRef, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { IncomingCallStyle, CometChatUIKitCalls } from "@cometchat/uikit-shared";
import { CallscreenStyle } from '@cometchat/uikit-elements';
import { AvatarStyle, IconStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { Subscription } from 'rxjs';
import { CometChatThemeService } from '../../../CometChatTheme.service';
import * as i0 from "@angular/core";
/**
*
* CometChatIncomingCallComponent is a component which shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatIncomingCallComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    call: CometChat.Call | null;
    disableSoundForCalls: boolean;
    customSoundForCalls: string;
    onAccept: (call: CometChat.Call) => void;
    onDecline: (call: CometChat.Call) => void;
    acceptButtonText: string;
    declineButtonText: string;
    subtitleView: TemplateRef<any>;
    onError: (error: CometChat.CometChatException) => void;
    listItemStyle: ListItemStyle;
    avatarStyle: AvatarStyle;
    incomingCallStyle: IncomingCallStyle;
    incomingcallListenerId: string;
    subtitleText: string;
    buttonStyle: any;
    ongoingCallStyle: CallscreenStyle;
    showOngoingCall: boolean;
    showIncomingCallScreen: boolean;
    sessionId: string;
    acceptButtonStyle: any;
    declineButtonStyle: any;
    loggedInUser: CometChat.User | null;
    iconStyle: IconStyle;
    activeCall: CometChat.Call | null;
    ccCallEnded: Subscription;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    playAudio(): void;
    isCallActive(call: CometChat.Call): boolean;
    showCall(call: CometChat.Call): void;
    attachListeners(): void;
    removeListener(): void;
    localStorageChange: (event: any) => any;
    ngOnInit(): void;
    closeCallScreen(): void;
    ngOnDestroy(): void;
    setOngoingCallStyle: () => void;
    getCallTypeIcon(): "assets/Audio-Call.svg" | "assets/Video-call.svg";
    acceptIncomingCall(): void;
    checkForActiveCallAndEndCall: () => Promise<unknown>;
    rejectIncomingCall(reason?: string): void;
    getCallBuilder(): typeof CometChatUIKitCalls.CallSettings | undefined;
    setThemeStyle(): void;
    setListItemStyle(): void;
    setincomingCallStyle(): void;
    setAvatarStyle(): void;
    subtitleStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    wrapperStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        padding: string;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatIncomingCallComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatIncomingCallComponent, "cometchat-incoming-call", never, { "call": "call"; "disableSoundForCalls": "disableSoundForCalls"; "customSoundForCalls": "customSoundForCalls"; "onAccept": "onAccept"; "onDecline": "onDecline"; "acceptButtonText": "acceptButtonText"; "declineButtonText": "declineButtonText"; "subtitleView": "subtitleView"; "onError": "onError"; "listItemStyle": "listItemStyle"; "avatarStyle": "avatarStyle"; "incomingCallStyle": "incomingCallStyle"; }, {}, never, never>;
}
