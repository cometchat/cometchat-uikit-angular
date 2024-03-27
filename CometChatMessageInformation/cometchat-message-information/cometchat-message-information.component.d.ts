import { ChangeDetectorRef, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChatMessageTemplate, Receipts, States } from '@cometchat/uikit-resources';
import { DateStyle, LabelStyle, ListItemStyle, ReceiptStyle } from '@cometchat/uikit-elements';
import { ListStyle, MessageInformationStyle } from '@cometchat/uikit-shared';
import { CometChatThemeService } from '../../CometChatTheme.service';
import { Subscription } from "rxjs";
import * as i0 from "@angular/core";
/**
*
* CometChatMessageInformationComponent is a used to render listitem component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatMessageInformationComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    closeIconURL: string;
    message: CometChat.BaseMessage;
    title: string;
    template: CometChatMessageTemplate;
    bubbleView: TemplateRef<any>;
    subtitleView: TemplateRef<any>;
    listItemView: TemplateRef<any>;
    receiptDatePattern: (timestamp: number) => string;
    onError: ((error: CometChat.CometChatException) => void) | null;
    messageInformationStyle: MessageInformationStyle;
    readIcon: string;
    deliveredIcon: string;
    onClose: () => void;
    listItemStyle: ListItemStyle;
    emptyStateText: string;
    errorStateText: string;
    emptyStateView: TemplateRef<any>;
    loadingIconURL: string;
    loadingStateView: TemplateRef<any>;
    errorStateView: TemplateRef<any>;
    onMessagesDelivered: Subscription;
    onMessagesRead: Subscription;
    receipts: CometChat.MessageReceipt[];
    receiptStyle: ReceiptStyle;
    isUserType: boolean;
    deliveredReceipt: Receipts;
    readReceipt: Receipts;
    listStyle: ListStyle;
    messageText: string;
    receiptInfoText: string;
    emptyLabelStyle: LabelStyle;
    dateStyle: DateStyle;
    dividerStyle: any;
    states: States;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    getDatePattern(timestamp: number): string | undefined;
    ngOnInit(): void;
    setTheme(): void;
    setListItemStyle(): void;
    setMessageInfoStyle(): void;
    ngOnDestroy(): void;
    addMessageEventListeners(): void;
    getAvatarUrl(): string;
    getUserReceipt(): number;
    getMessageReceipt(): import("@cometchat/uikit-shared/dist/Utils/MessageReceiptUtils").receipts;
    getMessageReceipts(): void;
    closeClicked(): void;
    closeButtonStyle: () => {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        buttonIconTint: string | undefined;
    };
    getSubtitleStyle(): {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    getTitleStyle(): {
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
    getCaptionStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatMessageInformationComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatMessageInformationComponent, "cometchat-message-information", never, { "closeIconURL": "closeIconURL"; "message": "message"; "title": "title"; "template": "template"; "bubbleView": "bubbleView"; "subtitleView": "subtitleView"; "listItemView": "listItemView"; "receiptDatePattern": "receiptDatePattern"; "onError": "onError"; "messageInformationStyle": "messageInformationStyle"; "readIcon": "readIcon"; "deliveredIcon": "deliveredIcon"; "onClose": "onClose"; "listItemStyle": "listItemStyle"; "emptyStateText": "emptyStateText"; "errorStateText": "errorStateText"; "emptyStateView": "emptyStateView"; "loadingIconURL": "loadingIconURL"; "loadingStateView": "loadingStateView"; "errorStateView": "errorStateView"; }, {}, never, never>;
}
