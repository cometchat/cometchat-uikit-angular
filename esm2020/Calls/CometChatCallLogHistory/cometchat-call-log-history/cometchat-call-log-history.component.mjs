import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatUIKitCalls } from "@cometchat/uikit-shared";
import { AvatarStyle, DateStyle, ListItemStyle, } from "@cometchat/uikit-elements";
import { localize, fontHelper, DatePatterns, States, } from "@cometchat/uikit-resources";
import { CallLogHistoryStyle } from "@cometchat/uikit-shared";
import { CometChatException } from "../../../Shared/Utils/ComeChatException";
import { CallLogUtils } from "../../../Shared/Utils/CallLogUtils";
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "../../../CometChatList/cometchat-list.component";
import * as i3 from "@angular/common";
export class CometChatCallLogHistoryComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.title = localize("CALL_HISTORY");
        this.emptyStateText = localize("NO_CALLS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.loadingIconURL = "assets/Spinner.svg";
        this.backIconUrl = "assets/backbutton.svg";
        this.DateSeparatorPattern = DatePatterns.time;
        this.hideSeparator = false;
        this.dateSeparatorStyle = {
            height: "",
            width: "",
        };
        this.hideError = false;
        this.onError = (error) => {
            console.log(error);
        };
        this.showSectionHeader = true;
        this.sectionHeaderField = "initiatedAt";
        this.datePattern = DatePatterns.DayDateTime;
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.dateStyle = {};
        this.CallLogHistoryStyle = {
            width: "100%",
            height: "100%",
        };
        this.listItemStyle = {};
        this.state = States.loading;
        this.listStyle = {};
        this.limit = 30;
        this.callHistory = [];
        this.callsListenerId = "callsList_" + new Date().getTime();
        this.loggedInUser = null;
        this.authToken = "";
        this.showOutgoingCallscreen = false;
        this.onScrolledToBottom = null;
        this.fetchNextCallHistoryList = () => {
            this.onScrolledToBottom = null;
            this.state = States.loading;
            this.ref.detectChanges();
            try {
                this.callsRequest.fetchNext()
                    .then((callHistory) => {
                    if (callHistory?.length > 0) {
                        this.onScrolledToBottom = this.fetchNextCallHistoryList;
                        this.ref.detectChanges();
                    }
                    if ((callHistory.length <= 0 && this.callHistory?.length <= 0) ||
                        (callHistory.length === 0 && this.callHistory?.length <= 0)) {
                        this.state = States.empty;
                        this.ref.detectChanges();
                    }
                    else {
                        this.state = States.loaded;
                        this.callHistory = [...this.callHistory, ...callHistory];
                        this.ref.detectChanges();
                    }
                }, (error) => {
                    if (this.onError) {
                        this.onError(CometChatException(error));
                    }
                    this.state = States.error;
                    this.ref.detectChanges();
                })
                    .catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            }
            catch (error) {
                this.state = States.error;
                this.ref.detectChanges();
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.callLogHistoryStyle = () => {
            return {
                height: this.CallLogHistoryStyle.height,
                width: this.CallLogHistoryStyle.width,
                background: this.CallLogHistoryStyle.background,
                border: this.CallLogHistoryStyle.border,
                borderRadius: this.CallLogHistoryStyle.borderRadius,
            };
        };
        this.subtitleStyle = () => {
            return {
                font: this.CallLogHistoryStyle.dateTextColor,
                color: this.CallLogHistoryStyle.dateTextFont,
            };
        };
        this.tailViewStyle = () => {
            return {
                font: this.CallLogHistoryStyle.callDurationTextFont,
                color: this.CallLogHistoryStyle.callDurationTextColor,
            };
        };
        this.backButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.CallLogHistoryStyle.backIconTint ||
                    this.themeService.theme.palette.getPrimary(),
            };
        };
        this.getSectionHeader = (call, index) => {
            if (this.callHistory && this.callHistory.length > 0 && index === 0) {
                return this.callHistory[0]["initiatedAt"];
            }
            if (this.callHistory &&
                index > 0 &&
                CallLogUtils.isDateDifferent(this.callHistory[index - 1]["initiatedAt"], this.callHistory[index]["initiatedAt"])) {
                return call.initiatedAt;
            }
        };
        this.handleBackClick = () => {
            if (this.onBackClick) {
                this.onBackClick();
                this.ref.detectChanges();
            }
        };
        this.titleStyle = () => {
            return {
                font: this.CallLogHistoryStyle.titleFont,
                color: this.CallLogHistoryStyle.titleColor,
                background: "transparent",
            };
        };
        this.state = States.loading;
    }
    ngOnInit() {
        this.setThemeStyle();
        CometChat.getLoggedinUser()
            .then((user) => {
            this.loggedInUser = user;
            this.authToken = this.loggedInUser.getAuthToken();
            this.callsRequest = this.getRequestBuilder?.();
            this.fetchNextCallHistoryList();
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        this.state = States.loading;
    }
    handleItemClick(call) {
        if (this.onItemClick) {
            this.onItemClick(call);
        }
    }
    ngOnDestroy() {
        this.callsRequest = null;
        this.ref.detach();
    }
    getSubtitle(call) {
        return CallLogUtils.getCallStatusWithType(call, this.loggedInUser);
    }
    getRequestBuilder() {
        if (this.callLogRequestBuilder) {
            return this.callLogRequestBuilder?.build();
        }
        else {
            if (this.user) {
                return new CometChatUIKitCalls.CallLogRequestBuilder()
                    .setLimit(this.limit)
                    .setCallCategory("call")
                    .setAuthToken(this.authToken)
                    .setUid(this.user.getUid())
                    .build();
            }
            else if (this.group) {
                return new CometChatUIKitCalls.CallLogRequestBuilder()
                    .setLimit(this.limit)
                    .setCallCategory("call")
                    .setAuthToken(this.authToken)
                    .setGuid(this.group.getGuid())
                    .build();
            }
            else {
                return null;
            }
        }
    }
    setThemeStyle() {
        this.setAvatarStyle();
        this.setDateStyle();
        this.setCallLogHistoryStyle();
        this.listStyle = {
            titleTextFont: this.CallLogHistoryStyle.titleFont,
            titleTextColor: this.CallLogHistoryStyle.titleColor,
            emptyStateTextFont: this.CallLogHistoryStyle.emptyStateTextFont,
            emptyStateTextColor: this.CallLogHistoryStyle.emptyStateTextColor,
            errorStateTextFont: this.CallLogHistoryStyle.errorStateTextFont,
            errorStateTextColor: this.CallLogHistoryStyle.errorStateTextColor,
            loadingIconTint: this.CallLogHistoryStyle.loadingIconTint,
            separatorColor: this.CallLogHistoryStyle.dateSeparatorTextColor,
            sectionHeaderTextColor: this.CallLogHistoryStyle.dateSeparatorTextColor,
            sectionHeaderTextFont: this.CallLogHistoryStyle.dateSeparatorTextFont,
        };
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "36px",
            height: "36px",
            border: "none",
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
    setDateStyle() {
        let defaultStyle = new DateStyle({
            textFont: fontHelper(this.themeService.theme.typography.subtitle2),
            textColor: this.themeService.theme.palette.getAccent600(),
            background: "transparent",
        });
        this.dateStyle = { ...defaultStyle, ...this.dateStyle };
    }
    getListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: this.themeService.theme.palette.getAccent100(),
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            border: "none",
            separatorColor: "rgb(222 222 222 / 46%)" ||
                this.themeService.theme.palette.getAccent200(),
            hoverBackground: this.themeService.theme.palette.getAccent50(),
            padding: "0",
        });
        return { ...defaultStyle, ...this.listItemStyle };
    }
    setCallLogHistoryStyle() {
        let defaultStyle = new CallLogHistoryStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            backIconTint: this.themeService.theme.palette.getPrimary(),
            dateTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            dateSeparatorTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            dateSeparatorTextColor: this.themeService.theme.palette.getAccent400(),
            callDurationTextFont: fontHelper(this.themeService.theme.typography.caption1),
            callDurationTextColor: this.themeService.theme.palette.getAccent500(),
            callStatusTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            callStatusTextColor: this.themeService.theme.palette.getAccent400(),
            dividerColor: this.themeService.theme.palette.getAccent600(),
        });
        this.CallLogHistoryStyle = { ...defaultStyle, ...this.CallLogHistoryStyle };
    }
    getTailView(totalSeconds) {
        return CallLogUtils.convertMinutesToHoursMinutesSeconds(totalSeconds);
    }
}
CometChatCallLogHistoryComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogHistoryComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatCallLogHistoryComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatCallLogHistoryComponent, selector: "cometchat-call-log-history", inputs: { user: "user", group: "group", title: "title", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingStateView: "loadingStateView", subtitleView: "subtitleView", listItemView: "listItemView", menu: "menu", emptyStateText: "emptyStateText", errorStateText: "errorStateText", loadingIconURL: "loadingIconURL", backIconUrl: "backIconUrl", onItemClick: "onItemClick", onBackClick: "onBackClick", callLogRequestBuilder: "callLogRequestBuilder", DateSeparatorPattern: "DateSeparatorPattern", hideSeparator: "hideSeparator", dateSeparatorStyle: "dateSeparatorStyle", hideError: "hideError", onError: "onError", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", datePattern: "datePattern", avatarStyle: "avatarStyle", dateStyle: "dateStyle", CallLogHistoryStyle: "CallLogHistoryStyle", listItemStyle: "listItemStyle" }, ngImport: i0, template: "<div class=\"cc-call-log-history\" [ngStyle]=\"callLogHistoryStyle()\">\n  <div class=\"cc-call-log-history__header\">\n\n    <div *ngIf=\"onBackClick\">\n      <cometchat-button [iconURL]=\"backIconUrl\" class=\"cc-details__close-button\" [buttonStyle]=\"backButtonStyle()\"\n        (cc-button-clicked)=\"handleBackClick()\"></cometchat-button>\n\n    </div>\n    <div [ngStyle]=\"titleStyle()\">\n      {{title}}\n    </div>\n  </div>\n  <cometchat-list [hideSearch]=\"true\" [listItemView]=\"listItemView ? listItemView : listItem\"\n    [onScrolledToBottom]=\"onScrolledToBottom\" [list]=\"callHistory\" [hideError]=\"hideError\" [title]=\"''\"\n    [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\" [loadingStateView]=\"loadingStateView\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"emptyStateText\" [sectionHeaderField]=\"sectionHeaderField\"\n    [showSectionHeader]=\"showSectionHeader\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\"\n    [getSectionHeader]=\"getSectionHeader\">\n  </cometchat-list>\n\n  <ng-template #listItem let-call>\n\n    <cometchat-list-item [listItemStyle]=\"getListItemStyle()\" [title]=\"''\" [hideSeparator]=\"false\"\n      (cc-listitem-clicked)=\"handleItemClick(call)\">\n\n\n      <div slot=\"subtitleView\">\n        <div *ngIf=\"!subtitleView; else subtitle\" style=\"margin-left: 10px;\">\n          <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"call?.getInitiatedAt()\"\n            [pattern]=\"DateSeparatorPattern\"></cometchat-date>\n          <cometchat-label [text]=\"getSubtitle(call)\" [labelStyle]=\"subtitleStyle()\">\n          </cometchat-label>\n        </div>\n        <ng-template #subtitle>\n          <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n          </ng-container>\n        </ng-template>\n      </div>\n\n      <div slot=\"tailView\" class=\"cc-call-log-history__tail-view\">\n       \n        <div> {{ getTailView(call?.getTotalDurationInMinutes()!) }} </div>\n      </div>\n    </cometchat-list-item>\n    <ng-template #tailView>\n\n    </ng-template>\n  </ng-template>\n\n\n</div>", styles: [".cc-call-log-history{height:100%;width:100%;box-sizing:border-box;padding:10px 10px 24px}.cc-call-log-history__header{display:flex;align-items:center;gap:15px}.cc-call-log-history__tail-view{position:relative}.cc-call-log-history__tail-view>div{color:RGBA(20,20,20,.68)}.cc-menus{position:absolute;right:12px;top:6px}.cc-call-log-history__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogHistoryComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-call-log-history", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-call-log-history\" [ngStyle]=\"callLogHistoryStyle()\">\n  <div class=\"cc-call-log-history__header\">\n\n    <div *ngIf=\"onBackClick\">\n      <cometchat-button [iconURL]=\"backIconUrl\" class=\"cc-details__close-button\" [buttonStyle]=\"backButtonStyle()\"\n        (cc-button-clicked)=\"handleBackClick()\"></cometchat-button>\n\n    </div>\n    <div [ngStyle]=\"titleStyle()\">\n      {{title}}\n    </div>\n  </div>\n  <cometchat-list [hideSearch]=\"true\" [listItemView]=\"listItemView ? listItemView : listItem\"\n    [onScrolledToBottom]=\"onScrolledToBottom\" [list]=\"callHistory\" [hideError]=\"hideError\" [title]=\"''\"\n    [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\" [loadingStateView]=\"loadingStateView\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"emptyStateText\" [sectionHeaderField]=\"sectionHeaderField\"\n    [showSectionHeader]=\"showSectionHeader\" [errorStateView]=\"errorStateView\" [listStyle]=\"listStyle\" [state]=\"state\"\n    [getSectionHeader]=\"getSectionHeader\">\n  </cometchat-list>\n\n  <ng-template #listItem let-call>\n\n    <cometchat-list-item [listItemStyle]=\"getListItemStyle()\" [title]=\"''\" [hideSeparator]=\"false\"\n      (cc-listitem-clicked)=\"handleItemClick(call)\">\n\n\n      <div slot=\"subtitleView\">\n        <div *ngIf=\"!subtitleView; else subtitle\" style=\"margin-left: 10px;\">\n          <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"call?.getInitiatedAt()\"\n            [pattern]=\"DateSeparatorPattern\"></cometchat-date>\n          <cometchat-label [text]=\"getSubtitle(call)\" [labelStyle]=\"subtitleStyle()\">\n          </cometchat-label>\n        </div>\n        <ng-template #subtitle>\n          <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: user ?? group }\">\n          </ng-container>\n        </ng-template>\n      </div>\n\n      <div slot=\"tailView\" class=\"cc-call-log-history__tail-view\">\n       \n        <div> {{ getTailView(call?.getTotalDurationInMinutes()!) }} </div>\n      </div>\n    </cometchat-list-item>\n    <ng-template #tailView>\n\n    </ng-template>\n  </ng-template>\n\n\n</div>", styles: [".cc-call-log-history{height:100%;width:100%;box-sizing:border-box;padding:10px 10px 24px}.cc-call-log-history__header{display:flex;align-items:center;gap:15px}.cc-call-log-history__tail-view{position:relative}.cc-call-log-history__tail-view>div{color:RGBA(20,20,20,.68)}.cc-menus{position:absolute;right:12px;top:6px}.cc-call-log-history__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { user: [{
                type: Input
            }], group: [{
                type: Input
            }], title: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], menu: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], backIconUrl: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }], onBackClick: [{
                type: Input
            }], callLogRequestBuilder: [{
                type: Input
            }], DateSeparatorPattern: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], dateSeparatorStyle: [{
                type: Input
            }], hideError: [{
                type: Input
            }], onError: [{
                type: Input
            }], showSectionHeader: [{
                type: Input
            }], sectionHeaderField: [{
                type: Input
            }], datePattern: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], dateStyle: [{
                type: Input
            }], CallLogHistoryStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9nLWhpc3RvcnkuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRDYWxsTG9nSGlzdG9yeS9jb21ldGNoYXQtY2FsbC1sb2ctaGlzdG9yeS9jb21ldGNoYXQtY2FsbC1sb2ctaGlzdG9yeS5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dIaXN0b3J5L2NvbWV0Y2hhdC1jYWxsLWxvZy1oaXN0b3J5L2NvbWV0Y2hhdC1jYWxsLWxvZy1oaXN0b3J5LmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUNULEtBQUssR0FLTixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUFFLG1CQUFtQixFQUFnQyxNQUFNLHlCQUF5QixDQUFDO0FBQzVGLE9BQU8sRUFDTCxXQUFXLEVBQ1gsU0FBUyxFQUVULGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBR25DLE9BQU8sRUFDTCxRQUFRLEVBRVIsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEdBQ1AsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUM5RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7Ozs7O0FBUWxFLE1BQU0sT0FBTyxnQ0FBZ0M7SUFvRTNDLFlBQ1UsR0FBc0IsRUFDdEIsWUFBbUM7UUFEbkMsUUFB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bUJBQW1CO3NCQUEzQixLQUFLO2dCQUtHLGFBQWE7c0JBQXJCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcblxuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXRDYWxscywgTGlzdFN0eWxlLCBPdXRnb2luZ0NhbGxTdHlsZSB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgSWNvblN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQge1xuICBsb2NhbGl6ZSxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIGZvbnRIZWxwZXIsXG4gIERhdGVQYXR0ZXJucyxcbiAgU3RhdGVzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IENhbGxMb2dIaXN0b3J5U3R5bGUgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENhbGxMb2dVdGlscyB9IGZyb20gXCIuLi8uLi8uLi9TaGFyZWQvVXRpbHMvQ2FsbExvZ1V0aWxzXCI7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY2FsbC1sb2ctaGlzdG9yeVwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jYWxsLWxvZy1oaXN0b3J5LmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY2FsbC1sb2ctaGlzdG9yeS5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENhbGxMb2dIaXN0b3J5Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FMTF9ISVNUT1JZXCIpO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX0NBTExTX0ZPVU5EXCIpO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBiYWNrSWNvblVybDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcblxuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6IChjYWxsOiBhbnkpID0+IHZvaWQ7IFxuICBASW5wdXQoKSBvbkJhY2tDbGljayE6ICgpID0+IHZvaWQ7XG5cbiAgQElucHV0KCkgY2FsbExvZ1JlcXVlc3RCdWlsZGVyITogYW55O1xuXG4gIEBJbnB1dCgpIERhdGVTZXBhcmF0b3JQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMudGltZTtcblxuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG5cbiAgQElucHV0KCkgZGF0ZVNlcGFyYXRvclN0eWxlOiBEYXRlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIHdpZHRoOiBcIlwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIHNob3dTZWN0aW9uSGVhZGVyOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBhbnkgPSBcImluaXRpYXRlZEF0XCI7XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjMycHhcIixcbiAgICBoZWlnaHQ6IFwiMzJweFwiLFxuICB9O1xuICBASW5wdXQoKSBkYXRlU3R5bGU6IERhdGVTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBDYWxsTG9nSGlzdG9yeVN0eWxlOiBDYWxsTG9nSGlzdG9yeVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7fTtcblxuICBjYWxsc1JlcXVlc3QhOiBhbnk7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIGNjT3V0Z29pbmdDYWxsITogU3Vic2NyaXB0aW9uO1xuICBjY0NhbGxBY2NlcHRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IHt9O1xuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgY2FsbEhpc3Rvcnk6IGFueVtdID0gW107XG4gIHB1YmxpYyBjYWxsc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2FsbHNMaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBhdXRoVG9rZW46IHN0cmluZyA9IFwiXCI7XG4gIHNob3dPdXRnb2luZ0NhbGxzY3JlZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgb25TY3JvbGxlZFRvQm90dG9tOiBhbnkgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcblxuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgIHRoaXMuYXV0aFRva2VuID0gdGhpcy5sb2dnZWRJblVzZXIhLmdldEF1dGhUb2tlbigpO1xuICAgICAgICB0aGlzLmNhbGxzUmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXI/LigpO1xuICAgICAgICB0aGlzLmZldGNoTmV4dENhbGxIaXN0b3J5TGlzdCgpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuXG4gIGhhbmRsZUl0ZW1DbGljayhjYWxsOiBhbnkpIHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayhjYWxsKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmNhbGxzUmVxdWVzdCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0YWNoKCk7XG4gIH1cblxuICBmZXRjaE5leHRDYWxsSGlzdG9yeUxpc3QgPSAoKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuY2FsbHNSZXF1ZXN0IS5mZXRjaE5leHQoKVxuICAgICAgICAudGhlbihcbiAgICAgICAgICAoY2FsbEhpc3Rvcnk6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKGNhbGxIaXN0b3J5Py5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gdGhpcy5mZXRjaE5leHRDYWxsSGlzdG9yeUxpc3Q7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKGNhbGxIaXN0b3J5Lmxlbmd0aCA8PSAwICYmIHRoaXMuY2FsbEhpc3Rvcnk/Lmxlbmd0aCA8PSAwKSB8fFxuICAgICAgICAgICAgICAoY2FsbEhpc3RvcnkubGVuZ3RoID09PSAwICYmIHRoaXMuY2FsbEhpc3Rvcnk/Lmxlbmd0aCA8PSAwKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuXG4gICAgICAgICAgICAgIHRoaXMuY2FsbEhpc3RvcnkgPSBbLi4udGhpcy5jYWxsSGlzdG9yeSwgLi4uY2FsbEhpc3RvcnldO1xuXG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBnZXRTdWJ0aXRsZShjYWxsOiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBDYWxsTG9nVXRpbHMuZ2V0Q2FsbFN0YXR1c1dpdGhUeXBlKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gIH1cblxuICBnZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAodGhpcy5jYWxsTG9nUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbGxMb2dSZXF1ZXN0QnVpbGRlcj8uYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICByZXR1cm4gbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuQ2FsbExvZ1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgICAuc2V0Q2FsbENhdGVnb3J5KFwiY2FsbFwiKVxuICAgICAgICAgIC5zZXRBdXRoVG9rZW4odGhpcy5hdXRoVG9rZW4pXG4gICAgICAgICAgLnNldFVpZCh0aGlzLnVzZXIuZ2V0VWlkKCkpXG4gICAgICAgICAgLmJ1aWxkKCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxMb2dSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgLnNldENhbGxDYXRlZ29yeShcImNhbGxcIilcbiAgICAgICAgICAuc2V0QXV0aFRva2VuKHRoaXMuYXV0aFRva2VuKVxuICAgICAgICAgIC5zZXRHdWlkKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgICAgICAgIC5idWlsZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2FsbExvZ0hpc3RvcnlTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG5cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXREYXRlU3R5bGUoKTtcbiAgICB0aGlzLnNldENhbGxMb2dIaXN0b3J5U3R5bGUoKTtcbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS50aXRsZUZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlLnRpdGxlQ29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS5kYXRlU2VwYXJhdG9yVGV4dENvbG9yLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRDb2xvcjogdGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlLmRhdGVTZXBhcmF0b3JUZXh0Q29sb3IsXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dEZvbnQ6IHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS5kYXRlU2VwYXJhdG9yVGV4dEZvbnQsXG4gICAgfTtcbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0RGF0ZVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IERhdGVTdHlsZSA9IG5ldyBEYXRlU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cblxuICBnZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6XG4gICAgICAgIFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICAgIHBhZGRpbmc6IFwiMFwiLFxuICAgIH0pO1xuICAgIHJldHVybiB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cblxuICBzZXRDYWxsTG9nSGlzdG9yeVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENhbGxMb2dIaXN0b3J5U3R5bGUgPSBuZXcgQ2FsbExvZ0hpc3RvcnlTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGRhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBkYXRlU2VwYXJhdG9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgZGF0ZVNlcGFyYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGNhbGxEdXJhdGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xXG4gICAgICApLFxuICAgICAgY2FsbER1cmF0aW9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgY2FsbFN0YXR1c1RleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGNhbGxTdGF0dXNUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBkaXZpZGVyQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlIH07XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlLmRhdGVUZXh0Q29sb3IsXG4gICAgICBjb2xvcjogdGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlLmRhdGVUZXh0Rm9udCxcbiAgICB9O1xuICB9O1xuICB0YWlsVmlld1N0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUuY2FsbER1cmF0aW9uVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlLmNhbGxEdXJhdGlvblRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuXG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuQ2FsbExvZ0hpc3RvcnlTdHlsZS5iYWNrSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfTtcbiAgfTtcblxuIFxuICBnZXRTZWN0aW9uSGVhZGVyID0gKGNhbGw6IGFueSwgaW5kZXg6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLmNhbGxIaXN0b3J5ICYmIHRoaXMuY2FsbEhpc3RvcnkubGVuZ3RoID4gMCAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FsbEhpc3RvcnlbMF1bXCJpbml0aWF0ZWRBdFwiXTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLmNhbGxIaXN0b3J5ICYmXG4gICAgICBpbmRleCA+IDAgJiZcbiAgICAgIENhbGxMb2dVdGlscy5pc0RhdGVEaWZmZXJlbnQoXG4gICAgICAgIHRoaXMuY2FsbEhpc3RvcnlbaW5kZXggLSAxXVtcImluaXRpYXRlZEF0XCJdLFxuICAgICAgICB0aGlzLmNhbGxIaXN0b3J5W2luZGV4XVtcImluaXRpYXRlZEF0XCJdXG4gICAgICApXG4gICAgKSB7XG4gICAgICByZXR1cm4gY2FsbC5pbml0aWF0ZWRBdDtcbiAgICB9XG4gIH07XG5cbiAgZ2V0VGFpbFZpZXcodG90YWxTZWNvbmRzOiBhbnkpIHtcbiAgICByZXR1cm4gQ2FsbExvZ1V0aWxzLmNvbnZlcnRNaW51dGVzVG9Ib3Vyc01pbnV0ZXNTZWNvbmRzKHRvdGFsU2Vjb25kcyk7XG4gIH1cblxuICBoYW5kbGVCYWNrQ2xpY2sgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMub25CYWNrQ2xpY2spIHtcbiAgICAgIHRoaXMub25CYWNrQ2xpY2soKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG5cbiAgdGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5DYWxsTG9nSGlzdG9yeVN0eWxlLnRpdGxlRm9udCxcbiAgICAgIGNvbG9yOiB0aGlzLkNhbGxMb2dIaXN0b3J5U3R5bGUudGl0bGVDb2xvcixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLWNhbGwtbG9nLWhpc3RvcnlcIiBbbmdTdHlsZV09XCJjYWxsTG9nSGlzdG9yeVN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWNhbGwtbG9nLWhpc3RvcnlfX2hlYWRlclwiPlxuXG4gICAgPGRpdiAqbmdJZj1cIm9uQmFja0NsaWNrXCI+XG4gICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJiYWNrSWNvblVybFwiIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCIgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCJcbiAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImhhbmRsZUJhY2tDbGljaygpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuXG4gICAgPC9kaXY+XG4gICAgPGRpdiBbbmdTdHlsZV09XCJ0aXRsZVN0eWxlKClcIj5cbiAgICAgIHt7dGl0bGV9fVxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGNvbWV0Y2hhdC1saXN0IFtoaWRlU2VhcmNoXT1cInRydWVcIiBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCJcbiAgICBbb25TY3JvbGxlZFRvQm90dG9tXT1cIm9uU2Nyb2xsZWRUb0JvdHRvbVwiIFtsaXN0XT1cImNhbGxIaXN0b3J5XCIgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIiBbdGl0bGVdPVwiJydcIlxuICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiIFtlcnJvclN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwic2VjdGlvbkhlYWRlckZpZWxkXCJcbiAgICBbc2hvd1NlY3Rpb25IZWFkZXJdPVwic2hvd1NlY3Rpb25IZWFkZXJcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiIFtzdGF0ZV09XCJzdGF0ZVwiXG4gICAgW2dldFNlY3Rpb25IZWFkZXJdPVwiZ2V0U2VjdGlvbkhlYWRlclwiPlxuICA8L2NvbWV0Y2hhdC1saXN0PlxuXG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWNhbGw+XG5cbiAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbbGlzdEl0ZW1TdHlsZV09XCJnZXRMaXN0SXRlbVN0eWxlKClcIiBbdGl0bGVdPVwiJydcIiBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiXG4gICAgICAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJoYW5kbGVJdGVtQ2xpY2soY2FsbClcIj5cblxuXG4gICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cIiFzdWJ0aXRsZVZpZXc7IGVsc2Ugc3VidGl0bGVcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OiAxMHB4O1wiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbZGF0ZVN0eWxlXT1cImRhdGVTdHlsZVwiIFt0aW1lc3RhbXBdPVwiY2FsbD8uZ2V0SW5pdGlhdGVkQXQoKVwiXG4gICAgICAgICAgICBbcGF0dGVybl09XCJEYXRlU2VwYXJhdG9yUGF0dGVyblwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJnZXRTdWJ0aXRsZShjYWxsKVwiIFtsYWJlbFN0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNzdWJ0aXRsZT5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAgfVwiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1jYWxsLWxvZy1oaXN0b3J5X190YWlsLXZpZXdcIj5cbiAgICAgICBcbiAgICAgICAgPGRpdj4ge3sgZ2V0VGFpbFZpZXcoY2FsbD8uZ2V0VG90YWxEdXJhdGlvbkluTWludXRlcygpISkgfX0gPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gICAgPG5nLXRlbXBsYXRlICN0YWlsVmlldz5cblxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvbmctdGVtcGxhdGU+XG5cblxuPC9kaXY+Il19