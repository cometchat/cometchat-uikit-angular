import { Component, Input, ViewChild, } from "@angular/core";
import { DatePatterns, localize, States, TitleAlignment, } from "@cometchat/uikit-resources";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
export class CometchatListComponent {
    constructor() {
        this.list = [];
        this.searchText = localize("SEARCH");
        this.searchIconURL = "assets/search.svg";
        this.listStyle = {
            height: "100%",
            width: "100%",
        };
        this.searchPlaceholderText = "";
        this.hideSearch = false;
        this.hideError = false;
        this.title = "";
        this.titleAlignment = TitleAlignment.left;
        this.state = States.loaded;
        this.errorStateText = "";
        this.emptyStateText = "";
        this.loadingIconURL = "assets/Spinner.svg";
        this.showSectionHeader = false;
        this.sectionHeaderField = "name";
        this.DateSeparatorPattern = DatePatterns.DayDate;
        this.dateSeparatorStyle = {
            height: "",
            width: "",
        };
        this.states = States;
        this.numberOfTopScroll = 0;
        this.searchStyle = {};
        this.iconStyle = {};
        /**
         * listening to bottom scroll using intersection observer
         */
        this.ioBottom = () => {
            const options = {
                root: this.listScroll?.nativeElement,
                rootMargin: "-100% 0px 100px 0px",
                threshold: 0,
            };
            const callback = (entries) => {
                if (entries[0].isIntersecting &&
                    this.onScrolledToBottom &&
                    this.list?.length > 0) {
                    this.onScrolledToBottom();
                }
            };
            var observer = new IntersectionObserver(callback, options);
            observer.observe(this.bottom?.nativeElement);
        };
        /**
         * listening to top scroll using intersection observer
         */
        this.ioTop = () => {
            const options = {
                root: this.listScroll?.nativeElement,
                rootMargin: "200px 0px 0px 0px",
                threshold: 1.0,
            };
            const callback = (entries) => {
                if (entries[0].isIntersecting) {
                    this.numberOfTopScroll++;
                    if (this.onScrolledToTop && this.numberOfTopScroll > 1) {
                        this.onScrolledToTop();
                    }
                }
            };
            var observer = new IntersectionObserver(callback, options);
            // observer.observe(this.top.nativeElement);
        };
        this.searchEvent = (event) => {
            this.searchText = event?.detail?.searchText;
            if (this.onSearch) {
                this.onSearch(this.searchText);
            }
        };
        /**
         * styling part
         */
        this.chatsListStyle = () => {
            return {
                height: this.listStyle.height,
                background: this.listStyle.background,
            };
        };
        this.messageContainerStyle = () => {
            return {
                width: this.listStyle.width,
            };
        };
        this.errorStyle = () => {
            return {
                textFont: this.listStyle.errorStateTextFont,
                textColor: this.listStyle.errorStateTextColor,
            };
        };
        this.emptyStyle = () => {
            return {
                textFont: this.listStyle.emptyStateTextFont,
                textColor: this.listStyle.emptyStateTextColor,
            };
        };
        this.wrapperStyle = () => {
            return {
                height: this.listStyle.height,
                width: this.listStyle.width,
                background: this.listStyle.background,
                border: this.listStyle.border,
                borderRadius: this.listStyle.borderRadius,
            };
        };
        this.headerTitle = () => {
            let postiton = this.titleAlignment == TitleAlignment.left
                ? { textAlign: "left" }
                : { textAlign: "center" };
            return {
                font: this.listStyle.titleTextFont,
                color: this.listStyle.titleTextColor,
                ...postiton,
            };
        };
        this.sectionHeaderStyle = () => {
            return {
                font: this.listStyle?.sectionHeaderTextFont,
                color: this.listStyle?.sectionHeaderTextColor,
            };
        };
        this.headerStyle = () => {
            return {
                height: "fit-content",
                marginBottom: "12px",
            };
        };
        this.listStyles = () => {
            return {
                height: "100%",
            };
        };
    }
    ngOnInit() {
        this.iconStyle = this.listStyle.loadingIconTint;
        (this.searchStyle.searchTextFont = this.listStyle?.searchTextFont),
            (this.searchStyle.searchTextColor = this.listStyle?.searchTextColor),
            (this.searchStyle.placeholderTextFont =
                this.listStyle?.searchPlaceholderTextFont),
            (this.searchStyle.placeholderTextColor =
                this.listStyle?.searchPlaceholderTextColor),
            (this.searchStyle.searchIconTint = this.listStyle?.searchIconTint);
        (this.searchStyle.background = this.listStyle?.searchBackground),
            (this.searchStyle.borderRadius = this.listStyle.searchBorderRadius);
        this.searchStyle.border = this.listStyle.searchBorder;
    }
    ngAfterViewInit() {
        this.ioBottom();
    }
    ngOnChanges(changes) { }
}
CometchatListComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometchatListComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
CometchatListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometchatListComponent, selector: "cometchat-list", inputs: { listItemView: "listItemView", onScrolledToBottom: "onScrolledToBottom", onScrolledToTop: "onScrolledToTop", list: "list", onSearch: "onSearch", getSectionHeader: "getSectionHeader", searchText: "searchText", searchIconURL: "searchIconURL", listStyle: "listStyle", searchPlaceholderText: "searchPlaceholderText", hideSearch: "hideSearch", hideError: "hideError", title: "title", titleAlignment: "titleAlignment", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateView: "emptyStateView", state: "state", errorStateText: "errorStateText", emptyStateText: "emptyStateText", loadingIconURL: "loadingIconURL", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", DateSeparatorPattern: "DateSeparatorPattern", dateSeparatorStyle: "dateSeparatorStyle" }, viewQueries: [{ propertyName: "listScroll", first: true, predicate: ["listScroll"], descendants: true }, { propertyName: "bottom", first: true, predicate: ["bottom"], descendants: true }, { propertyName: "top", first: true, predicate: ["top"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-list__wrapper\">\n  <div class=\"list__header\" [ngStyle]=\"headerStyle()\">\n    <div *ngIf=\"title\" class=\"list__title\" [ngStyle]=\"headerTitle()\"> {{title}}\n    </div>\n    <div class=\"cc-list__search-input\">\n      <cometchat-search-input [searchInputStyle]=\"searchStyle\"\n        [placeholderText]=\"searchPlaceholderText\" *ngIf=\"!hideSearch\"\n        [searchIconURL]=\"searchIconURL\"\n        (cc-search-changed)=\"searchEvent($event)\"></cometchat-search-input>\n    </div>\n  </div>\n  <div class=\"cc-list\" #listScroll [ngStyle]=\"listStyles()\">\n    <div class=\"list__top\" #top>\n    </div>\n    <div class=\"decorator__message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"loading__view\" *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\" [loaderStyle]=\"iconStyle\">\n        </cometchat-loader>\n        <span class=\"custom__view--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"error__view\" *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error  && !hideError && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"custom__view--error\"\n          *ngIf=\"state == states.error  && !hideError && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"empty__view\" *ngIf=\"state == states.empty\">\n        <cometchat-label [labelStyle]=\"emptyStyle()\"\n          *ngIf=\"state == states.empty && !emptyStateView\"\n          [text]=\"emptyStateText\">\n        </cometchat-label>\n        <span class=\"custom__view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"listitem__view\" *ngFor=\"let item of list; let i = index\">\n      <div class=\"list__section\" *ngIf=\"showSectionHeader\">\n        <div *ngIf=\"!getSectionHeader\">\n          <div *ngIf=\"i > 0; else elseBlock\" class=\"section__separator\">\n            <div *ngIf=\"\n                list[i - 1][sectionHeaderField][0].toUpperCase() !==\n                list[i][sectionHeaderField][0].toUpperCase()\n              \" class=\"section__header\" [ngStyle]=\"sectionHeaderStyle()\">\n              {{ list[i][sectionHeaderField][0].toUpperCase() }}\n            </div>\n          </div>\n          <ng-template #elseBlock>\n            <div class=\"section__header\" [ngStyle]=\"sectionHeaderStyle()\">\n              {{\n              list[i][sectionHeaderField][0].toUpperCase()\n              }}\n            </div>\n          </ng-template>\n        </div>\n        <div *ngIf=\"getSectionHeader && getSectionHeader(item,i)\"\n          [ngStyle]=\"sectionHeaderStyle()\">\n          <cometchat-date [timestamp]=\"getSectionHeader(item,i)\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </div>\n\n      </div>\n      <ng-container\n        *ngTemplateOutlet=\"listItemView;context:{ $implicit: item }\">\n      </ng-container>\n    </div>\n    <div class=\"list__bottom\" #bottom>\n    </div>\n  </div>\n</div>\n", styles: [".cc-list{display:flex;flex-direction:column;width:100%;overflow-y:auto;overflow-x:hidden}.cc-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column}.listitem__view{display:flex;flex-direction:column}.section__header{padding:4px}.list__title{width:90%;margin:4px 0;padding-left:8px}.user__section{padding:8px}.cc-list__search-input{height:-moz-fit-content;height:fit-content;margin:0 8px}.list__header{width:100%}.list__section{margin-left:8px}.decorator__message--loading{display:block;height:24px;width:24px;margin-right:30px}.decorator__message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.list__title{margin-bottom:8px}.cc-list::-webkit-scrollbar{background:transparent;width:8px}.cc-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.error__view,.empty__view{text-align:center;width:100%;text-overflow:ellipsis;text-wrap:balance}\n"], directives: [{ type: i1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometchatListComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-list", template: "<div class=\"cc-list__wrapper\">\n  <div class=\"list__header\" [ngStyle]=\"headerStyle()\">\n    <div *ngIf=\"title\" class=\"list__title\" [ngStyle]=\"headerTitle()\"> {{title}}\n    </div>\n    <div class=\"cc-list__search-input\">\n      <cometchat-search-input [searchInputStyle]=\"searchStyle\"\n        [placeholderText]=\"searchPlaceholderText\" *ngIf=\"!hideSearch\"\n        [searchIconURL]=\"searchIconURL\"\n        (cc-search-changed)=\"searchEvent($event)\"></cometchat-search-input>\n    </div>\n  </div>\n  <div class=\"cc-list\" #listScroll [ngStyle]=\"listStyles()\">\n    <div class=\"list__top\" #top>\n    </div>\n    <div class=\"decorator__message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"loading__view\" *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\" [loaderStyle]=\"iconStyle\">\n        </cometchat-loader>\n        <span class=\"custom__view--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"error__view\" *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error  && !hideError && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"custom__view--error\"\n          *ngIf=\"state == states.error  && !hideError && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"empty__view\" *ngIf=\"state == states.empty\">\n        <cometchat-label [labelStyle]=\"emptyStyle()\"\n          *ngIf=\"state == states.empty && !emptyStateView\"\n          [text]=\"emptyStateText\">\n        </cometchat-label>\n        <span class=\"custom__view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"listitem__view\" *ngFor=\"let item of list; let i = index\">\n      <div class=\"list__section\" *ngIf=\"showSectionHeader\">\n        <div *ngIf=\"!getSectionHeader\">\n          <div *ngIf=\"i > 0; else elseBlock\" class=\"section__separator\">\n            <div *ngIf=\"\n                list[i - 1][sectionHeaderField][0].toUpperCase() !==\n                list[i][sectionHeaderField][0].toUpperCase()\n              \" class=\"section__header\" [ngStyle]=\"sectionHeaderStyle()\">\n              {{ list[i][sectionHeaderField][0].toUpperCase() }}\n            </div>\n          </div>\n          <ng-template #elseBlock>\n            <div class=\"section__header\" [ngStyle]=\"sectionHeaderStyle()\">\n              {{\n              list[i][sectionHeaderField][0].toUpperCase()\n              }}\n            </div>\n          </ng-template>\n        </div>\n        <div *ngIf=\"getSectionHeader && getSectionHeader(item,i)\"\n          [ngStyle]=\"sectionHeaderStyle()\">\n          <cometchat-date [timestamp]=\"getSectionHeader(item,i)\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </div>\n\n      </div>\n      <ng-container\n        *ngTemplateOutlet=\"listItemView;context:{ $implicit: item }\">\n      </ng-container>\n    </div>\n    <div class=\"list__bottom\" #bottom>\n    </div>\n  </div>\n</div>\n", styles: [".cc-list{display:flex;flex-direction:column;width:100%;overflow-y:auto;overflow-x:hidden}.cc-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column}.listitem__view{display:flex;flex-direction:column}.section__header{padding:4px}.list__title{width:90%;margin:4px 0;padding-left:8px}.user__section{padding:8px}.cc-list__search-input{height:-moz-fit-content;height:fit-content;margin:0 8px}.list__header{width:100%}.list__section{margin-left:8px}.decorator__message--loading{display:block;height:24px;width:24px;margin-right:30px}.decorator__message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.list__title{margin-bottom:8px}.cc-list::-webkit-scrollbar{background:transparent;width:8px}.cc-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.error__view,.empty__view{text-align:center;width:100%;text-overflow:ellipsis;text-wrap:balance}\n"] }]
        }], ctorParameters: function () { return []; }, propDecorators: { listScroll: [{
                type: ViewChild,
                args: ["listScroll", { static: false }]
            }], bottom: [{
                type: ViewChild,
                args: ["bottom", { static: false }]
            }], top: [{
                type: ViewChild,
                args: ["top", { static: false }]
            }], listItemView: [{
                type: Input
            }], onScrolledToBottom: [{
                type: Input
            }], onScrolledToTop: [{
                type: Input
            }], list: [{
                type: Input
            }], onSearch: [{
                type: Input
            }], getSectionHeader: [{
                type: Input
            }], searchText: [{
                type: Input
            }], searchIconURL: [{
                type: Input
            }], listStyle: [{
                type: Input
            }], searchPlaceholderText: [{
                type: Input
            }], hideSearch: [{
                type: Input
            }], hideError: [{
                type: Input
            }], title: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], state: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], showSectionHeader: [{
                type: Input
            }], sectionHeaderField: [{
                type: Input
            }], DateSeparatorPattern: [{
                type: Input
            }], dateSeparatorStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWxpc3QuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRMaXN0L2NvbWV0Y2hhdC1saXN0LmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TGlzdC9jb21ldGNoYXQtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUVULEtBQUssRUFJTCxTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFPdkIsT0FBTyxFQUNMLFlBQVksRUFDWixRQUFRLEVBQ1IsTUFBTSxFQUNOLGNBQWMsR0FDZixNQUFNLDRCQUE0QixDQUFDOzs7QUFNcEMsTUFBTSxPQUFPLHNCQUFzQjtJQXVDakM7UUFoQ1MsU0FBSSxHQUFRLEVBQUUsQ0FBQztRQUdmLGVBQVUsR0FBVyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsa0JBQWEsR0FBVyxtQkFBbUIsQ0FBQztRQUM1QyxjQUFTLEdBQWM7WUFDOUIsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtTQUNkLENBQUM7UUFDTywwQkFBcUIsR0FBVyxFQUFFLENBQUM7UUFDbkMsZUFBVSxHQUFZLEtBQUssQ0FBQztRQUM1QixjQUFTLEdBQVksS0FBSyxDQUFDO1FBQzNCLFVBQUssR0FBVyxFQUFFLENBQUM7UUFDbkIsbUJBQWMsR0FBbUIsY0FBYyxDQUFDLElBQUksQ0FBQztRQUlyRCxVQUFLLEdBQVcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM5QixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUM1QixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUM1QixtQkFBYyxHQUFXLG9CQUFvQixDQUFDO1FBQzlDLHNCQUFpQixHQUFZLEtBQUssQ0FBQztRQUNu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QUE1QixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIE9uSW5pdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IERhdGVTdHlsZSwgU2VhcmNoSW5wdXRTdHlsZSB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQge1xuICBMaXN0U3R5bGUsXG4gIE1lc3NhZ2VMaXN0U3R5bGUsXG4gIFVzZXJzU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgRGF0ZVBhdHRlcm5zLFxuICBsb2NhbGl6ZSxcbiAgU3RhdGVzLFxuICBUaXRsZUFsaWdubWVudCxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWxpc3RcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtbGlzdC5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWxpc3QuY29tcG9uZW50LnNjc3NcIl0sXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Y2hhdExpc3RDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBAVmlld0NoaWxkKFwibGlzdFNjcm9sbFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgbGlzdFNjcm9sbCE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJib3R0b21cIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGJvdHRvbSE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJ0b3BcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHRvcCE6IEVsZW1lbnRSZWY7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47IC8vY3VzdG9tIHZpZXdcbiAgQElucHV0KCkgb25TY3JvbGxlZFRvQm90dG9tITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25TY3JvbGxlZFRvVG9wITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgbGlzdDogYW55ID0gW107XG4gIEBJbnB1dCgpIG9uU2VhcmNoITogKHRleHQ6IHN0cmluZykgPT4gdm9pZDtcbiAgQElucHV0KCkgZ2V0U2VjdGlvbkhlYWRlciE6IChjYWxsOiBhbnksIGluZGV4OiBhbnkpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHNlYXJjaFRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBzZWFyY2hJY29uVVJMOiBTdHJpbmcgPSBcImFzc2V0cy9zZWFyY2guc3ZnXCI7XG4gIEBJbnB1dCgpIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlclRleHQ6IFN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGVkO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBzaG93U2VjdGlvbkhlYWRlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWN0aW9uSGVhZGVyRmllbGQ6IHN0cmluZyA9IFwibmFtZVwiO1xuICBASW5wdXQoKSBEYXRlU2VwYXJhdG9yUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGU7XG4gIEBJbnB1dCgpIGRhdGVTZXBhcmF0b3JTdHlsZTogRGF0ZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCJcIixcbiAgICB3aWR0aDogXCJcIixcbiAgfTtcbiAgcHVibGljIHN0YXRlczogdHlwZW9mIFN0YXRlcyA9IFN0YXRlcztcbiAgcHVibGljIG51bWJlck9mVG9wU2Nyb2xsOiBudW1iZXIgPSAwO1xuICBzZWFyY2hTdHlsZTogU2VhcmNoSW5wdXRTdHlsZSA9IHt9O1xuICBpY29uU3R5bGU6IGFueSA9IHt9O1xuICBjb25zdHJ1Y3RvcigpIHsgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmljb25TdHlsZSA9IHRoaXMubGlzdFN0eWxlLmxvYWRpbmdJY29uVGludDtcbiAgICAodGhpcy5zZWFyY2hTdHlsZS5zZWFyY2hUZXh0Rm9udCA9IHRoaXMubGlzdFN0eWxlPy5zZWFyY2hUZXh0Rm9udCksXG4gICAgICAodGhpcy5zZWFyY2hTdHlsZS5zZWFyY2hUZXh0Q29sb3IgPSB0aGlzLmxpc3RTdHlsZT8uc2VhcmNoVGV4dENvbG9yKSxcbiAgICAgICh0aGlzLnNlYXJjaFN0eWxlLnBsYWNlaG9sZGVyVGV4dEZvbnQgPVxuICAgICAgICB0aGlzLmxpc3RTdHlsZT8uc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udCksXG4gICAgICAodGhpcy5zZWFyY2hTdHlsZS5wbGFjZWhvbGRlclRleHRDb2xvciA9XG4gICAgICAgIHRoaXMubGlzdFN0eWxlPy5zZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvciksXG4gICAgICAodGhpcy5zZWFyY2hTdHlsZS5zZWFyY2hJY29uVGludCA9IHRoaXMubGlzdFN0eWxlPy5zZWFyY2hJY29uVGludCk7XG4gICAgKHRoaXMuc2VhcmNoU3R5bGUuYmFja2dyb3VuZCA9IHRoaXMubGlzdFN0eWxlPy5zZWFyY2hCYWNrZ3JvdW5kKSxcbiAgICAgICh0aGlzLnNlYXJjaFN0eWxlLmJvcmRlclJhZGl1cyA9IHRoaXMubGlzdFN0eWxlLnNlYXJjaEJvcmRlclJhZGl1cyk7XG4gICAgdGhpcy5zZWFyY2hTdHlsZS5ib3JkZXIgPSB0aGlzLmxpc3RTdHlsZS5zZWFyY2hCb3JkZXI7XG4gIH1cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIHRoaXMuaW9Cb3R0b20oKTtcbiAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7IH1cbiAgLyoqXG4gICAqIGxpc3RlbmluZyB0byBib3R0b20gc2Nyb2xsIHVzaW5nIGludGVyc2VjdGlvbiBvYnNlcnZlclxuICAgKi9cbiAgaW9Cb3R0b20gPSAoKSA9PiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIHJvb3Q6IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudCxcbiAgICAgIHJvb3RNYXJnaW46IFwiLTEwMCUgMHB4IDEwMHB4IDBweFwiLFxuICAgICAgdGhyZXNob2xkOiAwLFxuICAgIH07XG4gICAgY29uc3QgY2FsbGJhY2sgPSAoZW50cmllczogYW55KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIGVudHJpZXNbMF0uaXNJbnRlcnNlY3RpbmcgJiZcbiAgICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gJiZcbiAgICAgICAgdGhpcy5saXN0Py5sZW5ndGggPiAwXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20oKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBvYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoXG4gICAgICBjYWxsYmFjayxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICAgIG9ic2VydmVyLm9ic2VydmUodGhpcy5ib3R0b20/Lm5hdGl2ZUVsZW1lbnQpO1xuICB9O1xuICAvKipcbiAgICogbGlzdGVuaW5nIHRvIHRvcCBzY3JvbGwgdXNpbmcgaW50ZXJzZWN0aW9uIG9ic2VydmVyXG4gICAqL1xuICBpb1RvcCA9ICgpID0+IHtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgcm9vdDogdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LFxuICAgICAgcm9vdE1hcmdpbjogXCIyMDBweCAwcHggMHB4IDBweFwiLFxuICAgICAgdGhyZXNob2xkOiAxLjAsXG4gICAgfTtcbiAgICBjb25zdCBjYWxsYmFjayA9IChlbnRyaWVzOiBhbnkpID0+IHtcbiAgICAgIGlmIChlbnRyaWVzWzBdLmlzSW50ZXJzZWN0aW5nKSB7XG4gICAgICAgIHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwrKztcbiAgICAgICAgaWYgKHRoaXMub25TY3JvbGxlZFRvVG9wICYmIHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwgPiAxKSB7XG4gICAgICAgICAgdGhpcy5vblNjcm9sbGVkVG9Ub3AoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9ic2VydmVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgIGNhbGxiYWNrLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gICAgLy8gb2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLnRvcC5uYXRpdmVFbGVtZW50KTtcbiAgfTtcbiAgc2VhcmNoRXZlbnQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIHRoaXMuc2VhcmNoVGV4dCA9IGV2ZW50Py5kZXRhaWw/LnNlYXJjaFRleHQ7XG4gICAgaWYgKHRoaXMub25TZWFyY2gpIHtcbiAgICAgIHRoaXMub25TZWFyY2godGhpcy5zZWFyY2hUZXh0KTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBzdHlsaW5nIHBhcnRcbiAgICovXG4gIGNoYXRzTGlzdFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubGlzdFN0eWxlLmhlaWdodCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubGlzdFN0eWxlLmJhY2tncm91bmQsXG4gICAgfTtcbiAgfTtcbiAgbWVzc2FnZUNvbnRhaW5lclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogdGhpcy5saXN0U3R5bGUud2lkdGgsXG4gICAgfTtcbiAgfTtcbiAgZXJyb3JTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMubGlzdFN0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5saXN0U3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuICBlbXB0eVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5saXN0U3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLmxpc3RTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmxpc3RTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5saXN0U3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmxpc3RTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmxpc3RTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubGlzdFN0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xuICBoZWFkZXJUaXRsZSA9ICgpID0+IHtcbiAgICBsZXQgcG9zdGl0b246IGFueSA9XG4gICAgICB0aGlzLnRpdGxlQWxpZ25tZW50ID09IFRpdGxlQWxpZ25tZW50LmxlZnRcbiAgICAgICAgPyB7IHRleHRBbGlnbjogXCJsZWZ0XCIgfVxuICAgICAgICA6IHsgdGV4dEFsaWduOiBcImNlbnRlclwiIH07XG4gICAgcmV0dXJuIHtcbiAgICAgIGZvbnQ6IHRoaXMubGlzdFN0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5saXN0U3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICAuLi5wb3N0aXRvbixcbiAgICB9O1xuICB9O1xuICBzZWN0aW9uSGVhZGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZvbnQ6IHRoaXMubGlzdFN0eWxlPy5zZWN0aW9uSGVhZGVyVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5saXN0U3R5bGU/LnNlY3Rpb25IZWFkZXJUZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbiAgaGVhZGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgbWFyZ2luQm90dG9tOiBcIjEycHhcIixcbiAgICB9O1xuICB9O1xuICBsaXN0U3R5bGVzID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIH07XG4gIH07XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbGlzdF9fd3JhcHBlclwiPlxuICA8ZGl2IGNsYXNzPVwibGlzdF9faGVhZGVyXCIgW25nU3R5bGVdPVwiaGVhZGVyU3R5bGUoKVwiPlxuICAgIDxkaXYgKm5nSWY9XCJ0aXRsZVwiIGNsYXNzPVwibGlzdF9fdGl0bGVcIiBbbmdTdHlsZV09XCJoZWFkZXJUaXRsZSgpXCI+IHt7dGl0bGV9fVxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1saXN0X19zZWFyY2gtaW5wdXRcIj5cbiAgICAgIDxjb21ldGNoYXQtc2VhcmNoLWlucHV0IFtzZWFyY2hJbnB1dFN0eWxlXT1cInNlYXJjaFN0eWxlXCJcbiAgICAgICAgW3BsYWNlaG9sZGVyVGV4dF09XCJzZWFyY2hQbGFjZWhvbGRlclRleHRcIiAqbmdJZj1cIiFoaWRlU2VhcmNoXCJcbiAgICAgICAgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiXG4gICAgICAgIChjYy1zZWFyY2gtY2hhbmdlZCk9XCJzZWFyY2hFdmVudCgkZXZlbnQpXCI+PC9jb21ldGNoYXQtc2VhcmNoLWlucHV0PlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWxpc3RcIiAjbGlzdFNjcm9sbCBbbmdTdHlsZV09XCJsaXN0U3R5bGVzKClcIj5cbiAgICA8ZGl2IGNsYXNzPVwibGlzdF9fdG9wXCIgI3RvcD5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiZGVjb3JhdG9yX19tZXNzYWdlXCJcbiAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgfHwgc3RhdGUgPT0gc3RhdGVzLmVycm9yICB8fCBzdGF0ZSA9PSBzdGF0ZXMuZW1wdHkgXCJcbiAgICAgIFtuZ1N0eWxlXT1cIm1lc3NhZ2VDb250YWluZXJTdHlsZSgpXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibG9hZGluZ19fdmlld1wiICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbG9hZGVyIFtpY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCIgW2xvYWRlclN0eWxlXT1cImljb25TdHlsZVwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1sb2FkZXI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY3VzdG9tX192aWV3LS1sb2FkaW5nXCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5sb2FkaW5nICAmJiBsb2FkaW5nU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImxvYWRpbmdTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZXJyb3JfX3ZpZXdcIiAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lcnJvciAgJiYgIWhpZGVFcnJvciBcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbbGFiZWxTdHlsZV09XCJlcnJvclN0eWxlKClcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICAmJiAhaGlkZUVycm9yICYmICFlcnJvclN0YXRlVmlld1wiXG4gICAgICAgICAgW3RleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY3VzdG9tX192aWV3LS1lcnJvclwiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgICYmICFoaWRlRXJyb3IgJiYgZXJyb3JTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZXJyb3JTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZW1wdHlfX3ZpZXdcIiAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eVwiPlxuICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFtsYWJlbFN0eWxlXT1cImVtcHR5U3R5bGUoKVwiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZW1wdHkgJiYgIWVtcHR5U3RhdGVWaWV3XCJcbiAgICAgICAgICBbdGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjdXN0b21fX3ZpZXctLWVtcHR5XCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eSAmJiBlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwibGlzdGl0ZW1fX3ZpZXdcIiAqbmdGb3I9XCJsZXQgaXRlbSBvZiBsaXN0OyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibGlzdF9fc2VjdGlvblwiICpuZ0lmPVwic2hvd1NlY3Rpb25IZWFkZXJcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cIiFnZXRTZWN0aW9uSGVhZGVyXCI+XG4gICAgICAgICAgPGRpdiAqbmdJZj1cImkgPiAwOyBlbHNlIGVsc2VCbG9ja1wiIGNsYXNzPVwic2VjdGlvbl9fc2VwYXJhdG9yXCI+XG4gICAgICAgICAgICA8ZGl2ICpuZ0lmPVwiXG4gICAgICAgICAgICAgICAgbGlzdFtpIC0gMV1bc2VjdGlvbkhlYWRlckZpZWxkXVswXS50b1VwcGVyQ2FzZSgpICE9PVxuICAgICAgICAgICAgICAgIGxpc3RbaV1bc2VjdGlvbkhlYWRlckZpZWxkXVswXS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgIFwiIGNsYXNzPVwic2VjdGlvbl9faGVhZGVyXCIgW25nU3R5bGVdPVwic2VjdGlvbkhlYWRlclN0eWxlKClcIj5cbiAgICAgICAgICAgICAge3sgbGlzdFtpXVtzZWN0aW9uSGVhZGVyRmllbGRdWzBdLnRvVXBwZXJDYXNlKCkgfX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjZWxzZUJsb2NrPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlY3Rpb25fX2hlYWRlclwiIFtuZ1N0eWxlXT1cInNlY3Rpb25IZWFkZXJTdHlsZSgpXCI+XG4gICAgICAgICAgICAgIHt7XG4gICAgICAgICAgICAgIGxpc3RbaV1bc2VjdGlvbkhlYWRlckZpZWxkXVswXS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiAqbmdJZj1cImdldFNlY3Rpb25IZWFkZXIgJiYgZ2V0U2VjdGlvbkhlYWRlcihpdGVtLGkpXCJcbiAgICAgICAgICBbbmdTdHlsZV09XCJzZWN0aW9uSGVhZGVyU3R5bGUoKVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbdGltZXN0YW1wXT1cImdldFNlY3Rpb25IZWFkZXIoaXRlbSxpKVwiXG4gICAgICAgICAgICBbcGF0dGVybl09XCJEYXRlU2VwYXJhdG9yUGF0dGVyblwiIFtkYXRlU3R5bGVdPVwiZGF0ZVNlcGFyYXRvclN0eWxlXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImxpc3RJdGVtVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiBpdGVtIH1cIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJsaXN0X19ib3R0b21cIiAjYm90dG9tPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19