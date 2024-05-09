import { OnInit, ChangeDetectorRef, TemplateRef, OnChanges, SimpleChanges } from "@angular/core";
import "@cometchat/uikit-elements";
import { AvatarStyle, DateStyle, IconStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CallButtonsStyle, CallButtonsConfiguration, CallLogDetailsStyle, CallLogParticipantsConfiguration, CallLogHistoryConfiguration, CallLogRecordingsConfiguration } from "@cometchat/uikit-shared";
import { CometChatDetailsOption, CometChatDetailsTemplate, DatePatterns, CometChatCallDetailsOption } from "@cometchat/uikit-resources";
import { CometChatThemeService } from "../../../CometChatTheme.service";
import * as i0 from "@angular/core";
export declare class CometChatCallLogDetailsComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    call: any;
    group: CometChat.Group;
    user: CometChat.User;
    title: string;
    onBackClick: () => void;
    hideProfile: boolean;
    subtitleView: TemplateRef<any>;
    customProfileView: TemplateRef<any>;
    backIconUrl: string;
    greaterThanIconURL: string;
    callButtonsConfiguration: CallButtonsConfiguration;
    callLogParticipantsConfiguration: CallLogParticipantsConfiguration;
    callLogHistoryConfiguration: CallLogHistoryConfiguration;
    callLogRecordingsConfiguration: CallLogRecordingsConfiguration;
    onError: ((error: CometChat.CometChatException) => void) | null;
    datePattern: DatePatterns;
    datePattern2: DatePatterns;
    data: CometChatDetailsTemplate[];
    avatarStyle: AvatarStyle;
    callDetailsStyle: CallLogDetailsStyle;
    listItemStyle: ListItemStyle;
    dateStyle: DateStyle;
    callButtonsStyle: CallButtonsStyle;
    iconStyle: IconStyle;
    defaultTemplate: CometChatDetailsTemplate[];
    authToken: string;
    loggedInUser: CometChat.User | null;
    showCallLogDetailOptionList: Boolean;
    showCometChatMessages: Boolean;
    showParticipantsList: Boolean;
    showCallRecordingList: Boolean;
    showCallHistory: Boolean;
    dividerStyle: any;
    getTitleStyle(): {
        textFont: string;
        textColor: string | undefined;
    };
    userListenerId: string;
    requestBuilder: any;
    limit: number;
    onItemClick: (call: any) => void;
    types: string[];
    categories: string[];
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    removeListener(): void;
    ngOnInit(): void;
    trackByFnOption(index: number, option: any): string;
    getTemplate(): void;
    getTemplateOptions: (template: CometChatDetailsTemplate) => CometChatDetailsOption[];
    getCustomOptionView(option: CometChatDetailsOption): any;
    getSectionHeaderStyle(template: CometChatDetailsTemplate): {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    onOptionClick: (option: CometChatCallDetailsOption) => void;
    getButtonStyle(option: CometChatDetailsOption): {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        buttonTextFont: string | undefined;
        buttonTextColor: string | undefined;
        background: string;
    };
    handlePageOnBackClick: () => void;
    subtitleStyle(template: CometChatDetailsTemplate): {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    showDataSectionStyle(template: CometChatDetailsTemplate): {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    setThemeStyle(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    setDetailsStyle(): void;
    setDateStyle(): void;
    wrapperStyle: () => {
        width: string | undefined;
        height: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        background: string | undefined;
    };
    getTailView(totalSeconds: number): string;
    getSubtitle(call: any): string;
    backButtonStyle: () => {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        buttonIconTint: string | undefined;
    };
    getListItemStyle(option: CometChatDetailsOption): {
        height: string;
        width: string;
        background: string | undefined;
        borderRadius: string;
        titleFont: string;
        border: string;
        separatorColor: string | undefined;
        hoverBackground: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatCallLogDetailsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatCallLogDetailsComponent, "cometchat-call-log-details", never, { "call": "call"; "group": "group"; "user": "user"; "title": "title"; "onBackClick": "onBackClick"; "hideProfile": "hideProfile"; "subtitleView": "subtitleView"; "customProfileView": "customProfileView"; "backIconUrl": "backIconUrl"; "greaterThanIconURL": "greaterThanIconURL"; "callButtonsConfiguration": "callButtonsConfiguration"; "callLogParticipantsConfiguration": "callLogParticipantsConfiguration"; "callLogHistoryConfiguration": "callLogHistoryConfiguration"; "callLogRecordingsConfiguration": "callLogRecordingsConfiguration"; "onError": "onError"; "datePattern": "datePattern"; "datePattern2": "datePattern2"; "data": "data"; "avatarStyle": "avatarStyle"; "callDetailsStyle": "callDetailsStyle"; "listItemStyle": "listItemStyle"; "dateStyle": "dateStyle"; "callButtonsStyle": "callButtonsStyle"; }, {}, never, never>;
}