import { ChangeDetectorRef, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { OutgoingCallStyle } from "@cometchat/uikit-shared";
import { AvatarStyle, CardStyle, IconStyle } from '@cometchat/uikit-elements';
import { CometChatThemeService } from '../../../CometChatTheme.service';
import { IconButtonAlignment } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
/**
*
* CometChatOutgoingCallComponent is a component whic shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatOutgoingCallComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    call: CometChat.Call;
    declineButtonText: string;
    declineButtonIconURL: string;
    customView: TemplateRef<any>;
    onError: (error: CometChat.CometChatException) => void;
    disableSoundForCalls: boolean;
    customSoundForCalls: string;
    avatarStyle: AvatarStyle;
    outgoingCallStyle: OutgoingCallStyle;
    onCloseClicked: (() => void) | null;
    buttonStyle: any;
    subtitleText: string;
    cardStyle: CardStyle;
    iconAlignment: IconButtonAlignment;
    iconStyle: IconStyle;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnInit(): void;
    playAudio(): void;
    ngOnDestroy(): void;
    onClose: () => void;
    getAvatarURL(): string;
    setThemeStyle(): void;
    setOutgoingCallStyle(): void;
    setAvatarStyle(): void;
    subtitleStyle(): {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    wrapperStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatOutgoingCallComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatOutgoingCallComponent, "cometchat-outgoing-call", never, { "call": "call"; "declineButtonText": "declineButtonText"; "declineButtonIconURL": "declineButtonIconURL"; "customView": "customView"; "onError": "onError"; "disableSoundForCalls": "disableSoundForCalls"; "customSoundForCalls": "customSoundForCalls"; "avatarStyle": "avatarStyle"; "outgoingCallStyle": "outgoingCallStyle"; "onCloseClicked": "onCloseClicked"; }, {}, never, never>;
}
