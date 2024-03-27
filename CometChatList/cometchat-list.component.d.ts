import { ElementRef, OnInit, SimpleChanges, TemplateRef } from "@angular/core";
import { DateStyle, SearchInputStyle } from "@cometchat/uikit-elements";
import { ListStyle } from "@cometchat/uikit-shared";
import { DatePatterns, States, TitleAlignment } from "@cometchat/uikit-resources";
import * as i0 from "@angular/core";
export declare class CometchatListComponent implements OnInit {
    listScroll: ElementRef;
    bottom: ElementRef;
    top: ElementRef;
    listItemView: TemplateRef<any>;
    onScrolledToBottom: () => void;
    onScrolledToTop: () => void;
    list: any;
    onSearch: (text: string) => void;
    getSectionHeader: (call: any, index: any) => void;
    searchText: string;
    searchIconURL: String;
    listStyle: ListStyle;
    searchPlaceholderText: String;
    hideSearch: boolean;
    hideError: boolean;
    title: string;
    titleAlignment: TitleAlignment;
    errorStateView: TemplateRef<any>;
    loadingStateView: TemplateRef<any>;
    emptyStateView: TemplateRef<any>;
    state: States;
    errorStateText: string;
    emptyStateText: string;
    loadingIconURL: string;
    showSectionHeader: boolean;
    sectionHeaderField: string;
    DateSeparatorPattern: DatePatterns;
    dateSeparatorStyle: DateStyle;
    states: typeof States;
    numberOfTopScroll: number;
    searchStyle: SearchInputStyle;
    iconStyle: any;
    constructor();
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    /**
     * listening to bottom scroll using intersection observer
     */
    ioBottom: () => void;
    /**
     * listening to top scroll using intersection observer
     */
    ioTop: () => void;
    searchEvent: (event: any) => void;
    /**
     * styling part
     */
    chatsListStyle: () => {
        height: string | undefined;
        background: string | undefined;
    };
    messageContainerStyle: () => {
        width: string | undefined;
    };
    errorStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    emptyStyle: () => {
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
    headerTitle: () => any;
    sectionHeaderStyle: () => {
        font: string | undefined;
        color: string | undefined;
    };
    headerStyle: () => {
        height: string;
        marginBottom: string;
    };
    listStyles: () => {
        height: string;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometchatListComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometchatListComponent, "cometchat-list", never, { "listItemView": "listItemView"; "onScrolledToBottom": "onScrolledToBottom"; "onScrolledToTop": "onScrolledToTop"; "list": "list"; "onSearch": "onSearch"; "getSectionHeader": "getSectionHeader"; "searchText": "searchText"; "searchIconURL": "searchIconURL"; "listStyle": "listStyle"; "searchPlaceholderText": "searchPlaceholderText"; "hideSearch": "hideSearch"; "hideError": "hideError"; "title": "title"; "titleAlignment": "titleAlignment"; "errorStateView": "errorStateView"; "loadingStateView": "loadingStateView"; "emptyStateView": "emptyStateView"; "state": "state"; "errorStateText": "errorStateText"; "emptyStateText": "emptyStateText"; "loadingIconURL": "loadingIconURL"; "showSectionHeader": "showSectionHeader"; "sectionHeaderField": "sectionHeaderField"; "DateSeparatorPattern": "DateSeparatorPattern"; "dateSeparatorStyle": "dateSeparatorStyle"; }, {}, never, never>;
}
