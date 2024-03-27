import { OnInit, ChangeDetectorRef } from "@angular/core";
import { ListStyle } from "@cometchat/uikit-shared";
import { AvatarStyle, DateStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CometChatThemeService } from "../../../CometChatTheme.service";
import { DatePatterns, States } from "@cometchat/uikit-resources";
import { CallLogParticipantsStyle } from "@cometchat/uikit-shared";
import * as i0 from "@angular/core";
export declare class CometChatCallLogParticipantsComponent implements OnInit {
    private ref;
    private themeService;
    title: string;
    call: any;
    backIconUrl: string;
    onBackClick: () => void;
    datePattern: DatePatterns;
    subtitleView: any;
    listItemView: any;
    onError: (error: CometChat.CometChatException) => void;
    hideSeparator: boolean;
    avatarStyle: AvatarStyle;
    dateStyle: DateStyle;
    CallLogParticipantsStyle: CallLogParticipantsStyle;
    listItemStyle: ListItemStyle;
    participantsList: any;
    loggedInUser: CometChat.User | null;
    state: States;
    listStyle: ListStyle;
    limit: number;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnInit(): void;
    getTailView(totalSeconds: any): string;
    callStyle: () => {
        height: string | undefined;
        width: string | undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    setThemeStyle(): void;
    setAvatarStyle(): void;
    setDateStyle(): void;
    getListItemStyle(): {
        activeBackground?: string | undefined;
        hoverBackground?: string | undefined;
        separatorColor?: string | undefined;
        titleFont?: string | undefined;
        titleColor?: string | undefined;
        padding?: string | undefined;
        height?: string | undefined;
        width?: string | undefined;
        border?: string | undefined;
        borderRadius?: string | undefined;
        background?: string | undefined;
    };
    setCallsStyle(): void;
    subtitleStyle: () => {
        font: string | undefined;
        color: string | undefined;
    };
    titleStyle: () => {
        font: string | undefined;
        color: string | undefined;
        background: string;
    };
    handleBackClick: () => void;
    backButtonStyle: () => {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        buttonIconTint: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatCallLogParticipantsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatCallLogParticipantsComponent, "cometchat-call-log-participants", never, { "title": "title"; "call": "call"; "backIconUrl": "backIconUrl"; "onBackClick": "onBackClick"; "datePattern": "datePattern"; "subtitleView": "subtitleView"; "listItemView": "listItemView"; "onError": "onError"; "hideSeparator": "hideSeparator"; "avatarStyle": "avatarStyle"; "dateStyle": "dateStyle"; "CallLogParticipantsStyle": "CallLogParticipantsStyle"; "listItemStyle": "listItemStyle"; }, {}, never, never>;
}
