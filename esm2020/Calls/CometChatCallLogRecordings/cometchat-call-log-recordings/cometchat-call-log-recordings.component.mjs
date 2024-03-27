import { Component, Input, ChangeDetectionStrategy, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, DateStyle, ListItemStyle, } from "@cometchat/uikit-elements";
import { localize, fontHelper, DatePatterns, States, } from "@cometchat/uikit-resources";
import { CallLogRecordingsStyle, } from "@cometchat/uikit-shared";
import { CallLogUtils } from "../../../Shared/Utils/CallLogUtils";
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "../../../CometChatList/cometchat-list.component";
import * as i3 from "@angular/common";
export class CometChatCallLogRecordingsComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.title = localize("RECORDING");
        this.backIconURL = "assets/backbutton.svg";
        this.datePattern = DatePatterns.DayDateTime;
        this.downloadIconURL = "assets/download.svg";
        this.hideDownloadButton = false;
        this.onError = (error) => {
            console.log(error);
        };
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.dateStyle = {};
        this.CallLogRecordingsStyle = {
            width: "100%",
            height: "100%",
        };
        this.listItemStyle = {};
        this.recordingsList = [];
        this.loggedInUser = null;
        this.state = States.loading;
        this.listStyle = {};
        this.limit = 30;
        this.iconStyle = {
            height: "16px",
            width: "16px",
            iconTint: "RGBA(20, 20, 20, 0.68)",
        };
        this.download = async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to download file (HTTP status: ${response.status})`);
                }
                const blob = await response.blob();
                // Create a temporary link element
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = "file.mp4"; // Set the desired file name here
                link.style.display = "none";
                // Append the link to the body and trigger the download
                document.body.appendChild(link);
                link.click();
                // Clean up
                document.body.removeChild(link);
            }
            catch (error) {
                console.error("Error downloading file:", error);
            }
        };
        this.callStyle = () => {
            return {
                height: this.CallLogRecordingsStyle.height,
                width: this.CallLogRecordingsStyle.width,
                background: this.CallLogRecordingsStyle.background,
                border: this.CallLogRecordingsStyle.border,
                borderRadius: this.CallLogRecordingsStyle.borderRadius,
            };
        };
        this.subtitleStyle = () => {
            return {
                font: this.CallLogRecordingsStyle.recordingDurationFont,
                color: this.CallLogRecordingsStyle.recordingDurationColor,
            };
        };
        this.backButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.CallLogRecordingsStyle?.backIconTint,
            };
        };
        this.downLoadIconStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.CallLogRecordingsStyle?.backIconTint,
            };
        };
        this.handleBackClick = () => {
            if (this.onBackClick) {
                this.onBackClick();
                this.ref.detectChanges();
            }
        };
        this.titleStyle = () => {
            return {
                font: this.CallLogRecordingsStyle.titleFont,
                color: this.CallLogRecordingsStyle.titleColor,
                background: "transparent",
            };
        };
        this.state = States.loading;
    }
    ngOnInit() {
        this.setThemeStyle();
        CometChat.getLoggedInUser()
            .then((user) => {
            this.loggedInUser = user;
            this.recordingsList = this.call?.getRecordings();
            this.state = States.loaded;
            this.ref.detectChanges();
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    handleDownloadClick(item) {
        if (this.onDownloadClick) {
            this.onDownloadClick(item);
        }
        else {
            this.download(item?.getRecordingURL());
        }
    }
    getSubtitle(totalSeconds) {
        return CallLogUtils.convertMinutesToHoursMinutesSeconds(totalSeconds);
    }
    setThemeStyle() {
        this.iconStyle.iconTint = this.themeService.theme.palette.getAccent600();
        this.setAvatarStyle();
        this.setDateStyle();
        this.setCallRecordingsStyle();
        this.listStyle = {
            titleTextFont: this.CallLogRecordingsStyle.titleFont,
            titleTextColor: this.CallLogRecordingsStyle.titleColor,
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
            textFont: fontHelper(this.themeService.theme.typography.caption2),
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
    setCallRecordingsStyle() {
        let defaultStyle = new CallLogRecordingsStyle({
            recordingDurationFont: fontHelper(this.themeService.theme.typography.subtitle2),
            recordingDurationColor: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            backIconTint: this.themeService.theme.palette.getPrimary(),
            dateTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            dateTextColor: this.themeService.theme.palette.getAccent600(),
        });
        this.CallLogRecordingsStyle = {
            ...this.CallLogRecordingsStyle,
            ...defaultStyle,
        };
    }
}
CometChatCallLogRecordingsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogRecordingsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatCallLogRecordingsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatCallLogRecordingsComponent, selector: "cometchat-call-log-recordings", inputs: { title: "title", call: "call", onBackClick: "onBackClick", backIconURL: "backIconURL", datePattern: "datePattern", subtitleView: "subtitleView", listItemView: "listItemView", downloadIconURL: "downloadIconURL", onDownloadClick: "onDownloadClick", hideDownloadButton: "hideDownloadButton", onError: "onError", avatarStyle: "avatarStyle", dateStyle: "dateStyle", CallLogRecordingsStyle: "CallLogRecordingsStyle", listItemStyle: "listItemStyle", options: "options" }, ngImport: i0, template: "<div class=\"cc-call-log-recordings\" [ngStyle]=\"callStyle()\">\n\n  <div class=\"cc-call-log-recordings__header\">\n\n    <div *ngIf=\"onBackClick\">\n      <cometchat-button [iconURL]=\"backIconURL\" class=\"cc-details__close-button\" [buttonStyle]=\"backButtonStyle()\"\n        (cc-button-clicked)=\"handleBackClick()\"></cometchat-button>\n\n    </div>\n    <div [ngStyle]=\"titleStyle()\">\n      {{title}}\n    </div>\n  </div>\n  <cometchat-list [hideSearch]=\"true\" [listItemView]=\"listItem\" [list]=\"recordingsList\"\n    [title]=\"''\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n\n  <ng-template #listItem let-recording>\n    <cometchat-list-item [title]=\"recording.rid\" [avatarURL]=\"recording?.avatar\" [listItemStyle]=\"getListItemStyle()\">\n  \n      <div slot=\"subtitleView\"  *ngIf=\"subtitleView;else defaultSubtitleView\">\n        <ng-container *ngTemplateOutlet=\"subtitleView\">\n        </ng-container>\n      </div>\n      <ng-template #defaultSubtitleView>\n        <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-log-recordings__subtitle-view\">\n          <div class=\"cc-call__type\">\n            {{getSubtitle(recording.duration)}}\n\n          </div>\n        </div>\n      </ng-template>\n\n\n      <div slot=\"tailView\" class=\"cc-call-log-recordings__tail-view\">\n\n\n        <div class=\"tail__view\">\n          <div class=\"cc-call-log-recordings__date\">\n            <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"recording?.endTime\"\n              [pattern]=\"datePattern\"></cometchat-date>\n            <cometchat-button *ngIf=\"!hideDownloadButton\" [iconURL]=\"downloadIconURL\" class=\"cc-details__close-button\"\n              [buttonStyle]=\"downLoadIconStyle()\"\n              (cc-button-clicked)=\"handleDownloadClick(recording)\"></cometchat-button>\n          </div>\n        </div>\n\n      </div>\n    </cometchat-list-item>\n\n  </ng-template>\n</div>", styles: [".cc-call-log-recordings{height:100%;width:100%;box-sizing:border-box;padding:5px 5px 24px}.cc-call-log-recordings__header{display:flex;align-items:center;gap:15px}.cc-call-log-recordings__date{display:flex;flex-direction:row;gap:3px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogRecordingsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-call-log-recordings", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-call-log-recordings\" [ngStyle]=\"callStyle()\">\n\n  <div class=\"cc-call-log-recordings__header\">\n\n    <div *ngIf=\"onBackClick\">\n      <cometchat-button [iconURL]=\"backIconURL\" class=\"cc-details__close-button\" [buttonStyle]=\"backButtonStyle()\"\n        (cc-button-clicked)=\"handleBackClick()\"></cometchat-button>\n\n    </div>\n    <div [ngStyle]=\"titleStyle()\">\n      {{title}}\n    </div>\n  </div>\n  <cometchat-list [hideSearch]=\"true\" [listItemView]=\"listItem\" [list]=\"recordingsList\"\n    [title]=\"''\" [listStyle]=\"listStyle\" [state]=\"state\">\n  </cometchat-list>\n\n  <ng-template #listItem let-recording>\n    <cometchat-list-item [title]=\"recording.rid\" [avatarURL]=\"recording?.avatar\" [listItemStyle]=\"getListItemStyle()\">\n  \n      <div slot=\"subtitleView\"  *ngIf=\"subtitleView;else defaultSubtitleView\">\n        <ng-container *ngTemplateOutlet=\"subtitleView\">\n        </ng-container>\n      </div>\n      <ng-template #defaultSubtitleView>\n        <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-log-recordings__subtitle-view\">\n          <div class=\"cc-call__type\">\n            {{getSubtitle(recording.duration)}}\n\n          </div>\n        </div>\n      </ng-template>\n\n\n      <div slot=\"tailView\" class=\"cc-call-log-recordings__tail-view\">\n\n\n        <div class=\"tail__view\">\n          <div class=\"cc-call-log-recordings__date\">\n            <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"recording?.endTime\"\n              [pattern]=\"datePattern\"></cometchat-date>\n            <cometchat-button *ngIf=\"!hideDownloadButton\" [iconURL]=\"downloadIconURL\" class=\"cc-details__close-button\"\n              [buttonStyle]=\"downLoadIconStyle()\"\n              (cc-button-clicked)=\"handleDownloadClick(recording)\"></cometchat-button>\n          </div>\n        </div>\n\n      </div>\n    </cometchat-list-item>\n\n  </ng-template>\n</div>", styles: [".cc-call-log-recordings{height:100%;width:100%;box-sizing:border-box;padding:5px 5px 24px}.cc-call-log-recordings__header{display:flex;align-items:center;gap:15px}.cc-call-log-recordings__date{display:flex;flex-direction:row;gap:3px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { title: [{
                type: Input
            }], call: [{
                type: Input
            }], onBackClick: [{
                type: Input
            }], backIconURL: [{
                type: Input
            }], datePattern: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], downloadIconURL: [{
                type: Input
            }], onDownloadClick: [{
                type: Input
            }], hideDownloadButton: [{
                type: Input
            }], onError: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], dateStyle: [{
                type: Input
            }], CallLogRecordingsStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], options: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9nLXJlY29yZGluZ3MuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRDYWxsTG9nUmVjb3JkaW5ncy9jb21ldGNoYXQtY2FsbC1sb2ctcmVjb3JkaW5ncy9jb21ldGNoYXQtY2FsbC1sb2ctcmVjb3JkaW5ncy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dSZWNvcmRpbmdzL2NvbWV0Y2hhdC1jYWxsLWxvZy1yZWNvcmRpbmdzL2NvbWV0Y2hhdC1jYWxsLWxvZy1yZWNvcmRpbmdzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxTQUFTLEVBR1QsS0FBSyxFQUNMLHVCQUF1QixHQUV4QixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUNMLFdBQVcsRUFDWCxTQUFTLEVBRVQsYUFBYSxHQUNkLE1BQU0sMkJBQTJCLENBQUM7QUFFbkMsT0FBTyxFQUVMLFFBQVEsRUFDUixVQUFVLEVBQ1YsWUFBWSxFQUVaLE1BQU0sR0FDUCxNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFDTCxzQkFBc0IsR0FFdkIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7Ozs7O0FBT2xFLE1BQU0sT0FBTyxtQ0FBbUM7SUEyQzlDLFlBQ1UsR0FBc0IsRUFDdEIsWUFBbUM7UUFEbkMsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFDdEIsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBNUNwQyxVQUFLLEdBQVcsUUFBUSxD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LEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUlHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBT0csT0FBTztzQkFBZixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBPbkluaXQsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBJbnB1dCxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIFRlbXBsYXRlUmVmLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuXG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBMaXN0U3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgSWNvblN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdE9wdGlvbixcbiAgbG9jYWxpemUsXG4gIGZvbnRIZWxwZXIsXG4gIERhdGVQYXR0ZXJucyxcbiAgU2VsZWN0aW9uTW9kZSxcbiAgU3RhdGVzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENhbGxMb2dSZWNvcmRpbmdzU3R5bGUsXG4gIENhbGxpbmdEZXRhaWxzVXRpbHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQ2FsbExvZ1V0aWxzIH0gZnJvbSBcIi4uLy4uLy4uL1NoYXJlZC9VdGlscy9DYWxsTG9nVXRpbHNcIjtcbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY2FsbC1sb2ctcmVjb3JkaW5nc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jYWxsLWxvZy1yZWNvcmRpbmdzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY2FsbC1sb2ctcmVjb3JkaW5ncy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENhbGxMb2dSZWNvcmRpbmdzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiUkVDT1JESU5HXCIpO1xuICBASW5wdXQoKSBjYWxsITogYW55O1xuICBASW5wdXQoKSBvbkJhY2tDbGljayE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGJhY2tJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiO1xuICBASW5wdXQoKSBkYXRlUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGVUaW1lO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBhbnk7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IGFueTtcbiAgQElucHV0KCkgZG93bmxvYWRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9kb3dubG9hZC5zdmdcIjtcbiAgQElucHV0KCkgb25Eb3dubG9hZENsaWNrITogKGl0ZW06IGFueSkgPT4gdm9pZDtcblxuICBASW5wdXQoKSBoaWRlRG93bmxvYWRCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcblxuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuXG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjMycHhcIixcbiAgICBoZWlnaHQ6IFwiMzJweFwiLFxuICB9O1xuICBASW5wdXQoKSBkYXRlU3R5bGU6IERhdGVTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBDYWxsTG9nUmVjb3JkaW5nc1N0eWxlOiBDYWxsTG9nUmVjb3JkaW5nc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge307XG4gIHB1YmxpYyByZWNvcmRpbmdzTGlzdDogYW55ID0gW107XG4gIHB1YmxpYyBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCA9IG51bGw7XG5cbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSB7fTtcbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgQElucHV0KCkgb3B0aW9ucyE6ICgobWVtYmVyOiBDb21ldENoYXQuQ2FsbCkgPT4gQ29tZXRDaGF0T3B0aW9uW10pIHwgbnVsbDtcbiAgaWNvblN0eWxlOiBJY29uU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIxNnB4XCIsXG4gICAgaWNvblRpbnQ6IFwiUkdCQSgyMCwgMjAsIDIwLCAwLjY4KVwiLFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgIFxuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRJblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgIHRoaXMucmVjb3JkaW5nc0xpc3QgPSB0aGlzLmNhbGw/LmdldFJlY29yZGluZ3MoKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG5cbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBoYW5kbGVEb3dubG9hZENsaWNrKGl0ZW06IGFueSkge1xuICAgIGlmICh0aGlzLm9uRG93bmxvYWRDbGljaykge1xuICAgICAgdGhpcy5vbkRvd25sb2FkQ2xpY2soaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZG93bmxvYWQoaXRlbT8uZ2V0UmVjb3JkaW5nVVJMKCkpO1xuICAgIH1cbiAgfVxuXG4gIGRvd25sb2FkID0gYXN5bmMgKHVybDogYW55KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBGYWlsZWQgdG8gZG93bmxvYWQgZmlsZSAoSFRUUCBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfSlgXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuXG4gICAgICAvLyBDcmVhdGUgYSB0ZW1wb3JhcnkgbGluayBlbGVtZW50XG4gICAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICBsaW5rLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgIGxpbmsuZG93bmxvYWQgPSBcImZpbGUubXA0XCI7IC8vIFNldCB0aGUgZGVzaXJlZCBmaWxlIG5hbWUgaGVyZVxuICAgICAgbGluay5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgICAgIC8vIEFwcGVuZCB0aGUgbGluayB0byB0aGUgYm9keSBhbmQgdHJpZ2dlciB0aGUgZG93bmxvYWRcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGluayk7XG4gICAgICBsaW5rLmNsaWNrKCk7XG5cbiAgICAgIC8vIENsZWFuIHVwXG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmspO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZG93bmxvYWRpbmcgZmlsZTpcIiwgZXJyb3IpO1xuICAgIH1cbiAgfTtcblxuICBnZXRTdWJ0aXRsZSh0b3RhbFNlY29uZHM6IG51bWJlcikge1xuICAgIHJldHVybiBDYWxsTG9nVXRpbHMuY29udmVydE1pbnV0ZXNUb0hvdXJzTWludXRlc1NlY29uZHModG90YWxTZWNvbmRzKTtcbiAgfVxuXG4gIGNhbGxTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLkNhbGxMb2dSZWNvcmRpbmdzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuQ2FsbExvZ1JlY29yZGluZ3NTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuQ2FsbExvZ1JlY29yZGluZ3NTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLkNhbGxMb2dSZWNvcmRpbmdzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLkNhbGxMb2dSZWNvcmRpbmdzU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5pY29uU3R5bGUuaWNvblRpbnQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc2V0Q2FsbFJlY29yZGluZ3NTdHlsZSgpO1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5DYWxsTG9nUmVjb3JkaW5nc1N0eWxlLnRpdGxlRm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLkNhbGxMb2dSZWNvcmRpbmdzU3R5bGUudGl0bGVDb2xvcixcbiAgICB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuICBzZXREYXRlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogRGF0ZVN0eWxlID0gbmV3IERhdGVTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTdHlsZSB9O1xuICB9XG5cbiAgZ2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOlxuICAgICAgICBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIiB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBwYWRkaW5nOiBcIjBcIixcbiAgICB9KTtcbiAgICByZXR1cm4geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG4gIHNldENhbGxSZWNvcmRpbmdzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ2FsbExvZ1JlY29yZGluZ3NTdHlsZSA9IG5ldyBDYWxsTG9nUmVjb3JkaW5nc1N0eWxlKHtcbiAgICAgIHJlY29yZGluZ0R1cmF0aW9uRm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICByZWNvcmRpbmdEdXJhdGlvbkNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuXG4gICAgICBiYWNrSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gICAgdGhpcy5DYWxsTG9nUmVjb3JkaW5nc1N0eWxlID0ge1xuICAgICAgLi4udGhpcy5DYWxsTG9nUmVjb3JkaW5nc1N0eWxlLFxuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgIH07XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5DYWxsTG9nUmVjb3JkaW5nc1N0eWxlLnJlY29yZGluZ0R1cmF0aW9uRm9udCxcbiAgICAgIGNvbG9yOiB0aGlzLkNhbGxMb2dSZWNvcmRpbmdzU3R5bGUucmVjb3JkaW5nRHVyYXRpb25Db2xvcixcbiAgICB9O1xuICB9O1xuXG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuQ2FsbExvZ1JlY29yZGluZ3NTdHlsZT8uYmFja0ljb25UaW50LFxuICAgIH07XG4gIH07XG4gIGRvd25Mb2FkSWNvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5DYWxsTG9nUmVjb3JkaW5nc1N0eWxlPy5iYWNrSWNvblRpbnQsXG4gICAgfTtcbiAgfTtcblxuICBoYW5kbGVCYWNrQ2xpY2sgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMub25CYWNrQ2xpY2spIHtcbiAgICAgIHRoaXMub25CYWNrQ2xpY2soKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIHRpdGxlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZvbnQ6IHRoaXMuQ2FsbExvZ1JlY29yZGluZ3NTdHlsZS50aXRsZUZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5DYWxsTG9nUmVjb3JkaW5nc1N0eWxlLnRpdGxlQ29sb3IsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgfTtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1jYWxsLWxvZy1yZWNvcmRpbmdzXCIgW25nU3R5bGVdPVwiY2FsbFN0eWxlKClcIj5cblxuICA8ZGl2IGNsYXNzPVwiY2MtY2FsbC1sb2ctcmVjb3JkaW5nc19faGVhZGVyXCI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwib25CYWNrQ2xpY2tcIj5cbiAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tJY29uVVJMXCIgY2xhc3M9XCJjYy1kZXRhaWxzX19jbG9zZS1idXR0b25cIiBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIlxuICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaGFuZGxlQmFja0NsaWNrKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IFtuZ1N0eWxlXT1cInRpdGxlU3R5bGUoKVwiPlxuICAgICAge3t0aXRsZX19XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8Y29tZXRjaGF0LWxpc3QgW2hpZGVTZWFyY2hdPVwidHJ1ZVwiIFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1cIiBbbGlzdF09XCJyZWNvcmRpbmdzTGlzdFwiXG4gICAgW3RpdGxlXT1cIicnXCIgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIiBbc3RhdGVdPVwic3RhdGVcIj5cbiAgPC9jb21ldGNoYXQtbGlzdD5cblxuICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1yZWNvcmRpbmc+XG4gICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cInJlY29yZGluZy5yaWRcIiBbYXZhdGFyVVJMXT1cInJlY29yZGluZz8uYXZhdGFyXCIgW2xpc3RJdGVtU3R5bGVdPVwiZ2V0TGlzdEl0ZW1TdHlsZSgpXCI+XG4gIFxuICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgZGVmYXVsdFN1YnRpdGxlVmlld1wiPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRTdWJ0aXRsZVZpZXc+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiIGNsYXNzPVwiY2MtY2FsbC1sb2ctcmVjb3JkaW5nc19fc3VidGl0bGUtdmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jYWxsX190eXBlXCI+XG4gICAgICAgICAgICB7e2dldFN1YnRpdGxlKHJlY29yZGluZy5kdXJhdGlvbil9fVxuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuXG4gICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtY2FsbC1sb2ctcmVjb3JkaW5nc19fdGFpbC12aWV3XCI+XG5cblxuICAgICAgICA8ZGl2IGNsYXNzPVwidGFpbF9fdmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jYWxsLWxvZy1yZWNvcmRpbmdzX19kYXRlXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW2RhdGVTdHlsZV09XCJkYXRlU3R5bGVcIiBbdGltZXN0YW1wXT1cInJlY29yZGluZz8uZW5kVGltZVwiXG4gICAgICAgICAgICAgIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwiIWhpZGVEb3dubG9hZEJ1dHRvblwiIFtpY29uVVJMXT1cImRvd25sb2FkSWNvblVSTFwiIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImRvd25Mb2FkSWNvblN0eWxlKClcIlxuICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaGFuZGxlRG93bmxvYWRDbGljayhyZWNvcmRpbmcpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgPC9kaXY+XG4gICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuXG4gIDwvbmctdGVtcGxhdGU+XG48L2Rpdj4iXX0=