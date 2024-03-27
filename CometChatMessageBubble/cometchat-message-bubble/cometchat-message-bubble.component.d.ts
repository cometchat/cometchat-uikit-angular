import { OnInit, ChangeDetectorRef, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { BaseStyle } from '@cometchat/uikit-shared';
import { MenuListStyle } from '@cometchat/uikit-elements';
import { CometChatThemeService } from '../../CometChatTheme.service';
import { CometChatMessageOption, CometChatTheme, MessageBubbleAlignment } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
export declare class CometChatMessageBubbleComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    messageBubbleStyle: BaseStyle;
    alignment: MessageBubbleAlignment;
    options: CometChatMessageOption[];
    id?: number | string;
    leadingView: TemplateRef<any> | null;
    headerView: TemplateRef<any> | null;
    replyView: TemplateRef<any> | null;
    contentView: TemplateRef<any> | null;
    threadView: TemplateRef<any> | null;
    footerView: TemplateRef<any> | null;
    bottomView: TemplateRef<any> | null;
    statusInfoView: TemplateRef<any> | null;
    optionsStyle: MenuListStyle;
    moreIconURL: string;
    topMenuSize: number;
    theme: CometChatTheme;
    uikitConstant: typeof MessageBubbleAlignment;
    isHovering: boolean;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnInit(): void;
    /**
     * hide show menu options on hover
     * @param  {MouseEvent} event?
     */
    hideShowMenuOption(event?: MouseEvent): void;
    /**
     * @param  {any} event
     */
    onOptionClick(event: any): void;
    wrapperStyle: () => {
        display: string;
        justifyContent: string;
    };
    bubbleStyle: () => {
        display: string;
        flexDirection: string;
        alignItems: string;
        height?: string | undefined;
        width?: string | undefined;
        border?: string | undefined;
        borderRadius?: string | undefined;
        background?: string | undefined;
    };
    bubbleAlignmentStyle(): any;
    optionsStyles: any;
    titleStyle(): {
        display: string;
        justifyContent: string;
        alignItems: string;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatMessageBubbleComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatMessageBubbleComponent, "cometchat-message-bubble", never, { "messageBubbleStyle": "messageBubbleStyle"; "alignment": "alignment"; "options": "options"; "id": "id"; "leadingView": "leadingView"; "headerView": "headerView"; "replyView": "replyView"; "contentView": "contentView"; "threadView": "threadView"; "footerView": "footerView"; "bottomView": "bottomView"; "statusInfoView": "statusInfoView"; "moreIconURL": "moreIconURL"; "topMenuSize": "topMenuSize"; }, {}, never, never>;
}
