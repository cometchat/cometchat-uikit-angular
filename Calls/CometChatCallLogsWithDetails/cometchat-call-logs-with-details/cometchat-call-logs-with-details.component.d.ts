import { OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import "@cometchat/uikit-elements";
import { CometChatThemeService } from "../../../CometChatTheme.service";
import { BackdropStyle } from "@cometchat/uikit-elements";
import { CallLogDetailsConfiguration, CallLogsConfiguration, WithDetailsStyle } from "@cometchat/uikit-shared";
import * as i0 from "@angular/core";
export declare class CometChatCallLogsWithDetailsComponent implements OnInit, OnChanges {
    private elementRef;
    private ref;
    private themeService;
    isMobileView: boolean;
    messageText: string;
    withDetailsStyle: WithDetailsStyle;
    showMoreInfo: boolean;
    backdropStyle: BackdropStyle;
    call: any;
    callLogDetailsConfiguration: CallLogDetailsConfiguration;
    callLogConfiguration: CallLogsConfiguration;
    onError: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Properties for internal use
     */
    loggedInUser: CometChat.User | null;
    activeCall: any;
    user: any | null;
    group: CometChat.Group | null;
    computedCallLogDetailsConfig: CallLogDetailsConfiguration;
    labelStyle: any;
    constructor(elementRef: ElementRef, ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    updateBackdropHeight(): void;
    onBackClick: () => void;
    setWithDetailsStyle(): void;
    onInfoClick: (call: any) => void;
    setActiveCallLog(): void;
    ngOnInit(): void;
    computedCallLogDetailsConfiguration(): CallLogDetailsConfiguration;
    emptyMessageStyle: () => {
        background: string | undefined;
        height: string | undefined;
        width: string;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    chatsWrapperStyles: () => {
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        background: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatCallLogsWithDetailsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatCallLogsWithDetailsComponent, "cometchat-call-logs-with-details", never, { "isMobileView": "isMobileView"; "messageText": "messageText"; "withDetailsStyle": "withDetailsStyle"; "showMoreInfo": "showMoreInfo"; "backdropStyle": "backdropStyle"; "call": "call"; "callLogDetailsConfiguration": "callLogDetailsConfiguration"; "callLogConfiguration": "callLogConfiguration"; "onError": "onError"; }, {}, never, never>;
}
