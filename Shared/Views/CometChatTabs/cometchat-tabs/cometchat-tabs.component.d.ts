import { OnInit, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CometChatTabItem, TabAlignment } from '@cometchat/uikit-resources';
import { BaseStyle } from '@cometchat/uikit-shared';
import '@cometchat/uikit-elements';
import * as i0 from "@angular/core";
export declare class CometChatTabsComponent implements OnInit {
    private ref;
    tabAlignment: TabAlignment;
    disableDragging: boolean;
    tabsStyle: BaseStyle;
    tabs: CometChatTabItem[];
    keepAlive: boolean;
    activeTab: CometChatTabItem;
    previousTab: CometChatTabItem;
    childView: TemplateRef<any> | null;
    constructor(ref: ChangeDetectorRef);
    openViewOnCLick: (tabItem: CometChatTabItem) => void;
    ngOnInit(): void;
    ngOnChanges(): void;
    getButtonStyle(tab: CometChatTabItem): {
        display?: undefined;
        justifyContent?: undefined;
        alignItems?: undefined;
        padding: string;
        background: string | undefined;
        buttonTextFont: string | undefined;
        buttonTextColor: string | undefined;
        buttonIconTint: string | undefined;
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        gap: string;
        cursor: string;
    } | {
        display: string;
        justifyContent: string;
        alignItems: string;
        padding: string;
        background: string | undefined;
        buttonTextFont: string | undefined;
        buttonTextColor: string | undefined;
        buttonIconTint: string | undefined;
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        gap: string;
        cursor: string;
    };
    showTabs(tab: CometChatTabItem): {
        display: string;
    };
    getTabsStyle(): {
        position: string;
        top: string;
        left: string;
        bottom?: undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    } | {
        position: string;
        bottom: string;
        left: string;
        top?: undefined;
        background: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    getWrapperStyle(): {
        display: string;
        justifyContent: string;
        flexDirection: string;
    };
    getTabsPlacement(): {
        display: string;
        flexDirection: string;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatTabsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatTabsComponent, "cometchat-tabs", never, { "tabAlignment": "tabAlignment"; "disableDragging": "disableDragging"; "tabsStyle": "tabsStyle"; "tabs": "tabs"; "keepAlive": "keepAlive"; }, {}, never, never>;
}
