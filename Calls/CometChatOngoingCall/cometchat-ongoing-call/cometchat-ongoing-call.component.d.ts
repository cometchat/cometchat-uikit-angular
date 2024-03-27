import { ElementRef, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import "@cometchat/uikit-elements";
import '@cometchat/uikit-shared';
import { CallWorkflow } from '@cometchat/uikit-resources';
import { CometChatUIKitCalls } from '@cometchat/uikit-shared';
import { CallscreenStyle } from '@cometchat/uikit-elements';
import { CometChatThemeService } from '../../../CometChatTheme.service';
import * as i0 from "@angular/core";
/**
*
* CometChatOngoingCallComponent is a component whic shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatOngoingCallComponent implements OnInit, OnChanges {
    private themeService;
    callScreenFrame: ElementRef;
    ongoingCallStyle: CallscreenStyle;
    resizeIconHoverText: string;
    sessionID: string;
    minimizeIconURL: string;
    maximizeIconURL: string;
    callSettingsBuilder: typeof CometChatUIKitCalls.CallSettingsBuilder;
    callWorkflow: CallWorkflow;
    onError: (error: CometChat.CometChatException) => void;
    loggedInUser: CometChat.User;
    ngOnInit(): void;
    constructor(themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    getCallBuilder: () => any;
    startCall: () => void;
    setongoingCallStyle(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatOngoingCallComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatOngoingCallComponent, "cometchat-ongoing-call", never, { "ongoingCallStyle": "ongoingCallStyle"; "resizeIconHoverText": "resizeIconHoverText"; "sessionID": "sessionID"; "minimizeIconURL": "minimizeIconURL"; "maximizeIconURL": "maximizeIconURL"; "callSettingsBuilder": "callSettingsBuilder"; "callWorkflow": "callWorkflow"; "onError": "onError"; }, {}, never, never>;
}
