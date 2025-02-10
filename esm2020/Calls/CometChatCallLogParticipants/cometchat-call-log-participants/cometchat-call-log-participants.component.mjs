import { Component, ChangeDetectionStrategy, Input, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, DateStyle, ListItemStyle, } from "@cometchat/uikit-elements";
import { fontHelper, DatePatterns, States, localize, } from "@cometchat/uikit-resources";
import { CallLogParticipantsStyle } from "@cometchat/uikit-shared";
import { CallLogUtils } from "../../../Shared/Utils/CallLogUtils";
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "../../../CometChatList/cometchat-list.component";
import * as i3 from "@angular/common";
export class CometChatCallLogParticipantsComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.title = localize("PARTICIPANTS");
        this.backIconUrl = "assets/backbutton.svg";
        this.datePattern = DatePatterns.DayDateTime;
        this.onError = (error) => {
            console.log(error);
        };
        this.hideSeparator = false;
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.dateStyle = {};
        this.CallLogParticipantsStyle = {
            width: "100%",
            height: "100%",
        };
        this.listItemStyle = {};
        this.participantsList = [];
        this.loggedInUser = null;
        this.state = States.loaded;
        this.listStyle = {};
        this.limit = 30;
        this.callStyle = () => {
            return {
                height: this.CallLogParticipantsStyle.height,
                width: this.CallLogParticipantsStyle.width,
                background: this.CallLogParticipantsStyle.background,
                border: this.CallLogParticipantsStyle.border,
                borderRadius: this.CallLogParticipantsStyle.borderRadius,
            };
        };
        this.subtitleStyle = () => {
            return {
                font: this.CallLogParticipantsStyle.callStatusFont,
                color: this.CallLogParticipantsStyle.callStatusColor,
            };
        };
        this.titleStyle = () => {
            return {
                font: this.CallLogParticipantsStyle.titleFont,
                color: this.CallLogParticipantsStyle.titleColor,
                background: "transparent",
            };
        };
        this.handleBackClick = () => {
            if (this.onBackClick) {
                this.onBackClick();
            }
        };
        this.backButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.CallLogParticipantsStyle.backIconTint ||
                    this.themeService.theme.palette.getPrimary(),
            };
        };
        this.state = States.loading;
    }
    ngOnInit() {
        this.setThemeStyle();
        CometChat.getLoggedInUser()?.then((user) => {
            this.participantsList = this.call?.getParticipants();
            this.ref.detectChanges();
            this.state = States.loaded;
            this.loggedInUser = user;
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    getTailView(totalSeconds) {
        return CallLogUtils.convertMinutesToHoursMinutesSeconds(totalSeconds);
    }
    setThemeStyle() {
        this.setAvatarStyle();
        this.setDateStyle();
        this.setCallsStyle();
        this.listStyle = {
            titleTextFont: this.CallLogParticipantsStyle.titleFont,
            titleTextColor: this.CallLogParticipantsStyle.titleColor,
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
            titleColor: this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent50(),
            hoverBackground: this.themeService.theme.palette.getAccent50(),
        });
        return { ...defaultStyle, ...this.listItemStyle };
    }
    setCallsStyle() {
        let defaultStyle = new CallLogParticipantsStyle({
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            callStatusFont: fontHelper(this.themeService.theme.typography.subtitle2),
            callStatusColor: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            backIconTint: this.themeService.theme.palette.getPrimary(),
        });
        this.CallLogParticipantsStyle = {
            ...defaultStyle,
            ...this.CallLogParticipantsStyle,
        };
    }
}
CometChatCallLogParticipantsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogParticipantsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatCallLogParticipantsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatCallLogParticipantsComponent, selector: "cometchat-call-log-participants", inputs: { title: "title", call: "call", backIconUrl: "backIconUrl", onBackClick: "onBackClick", datePattern: "datePattern", subtitleView: "subtitleView", listItemView: "listItemView", onError: "onError", hideSeparator: "hideSeparator", avatarStyle: "avatarStyle", dateStyle: "dateStyle", CallLogParticipantsStyle: "CallLogParticipantsStyle", listItemStyle: "listItemStyle" }, ngImport: i0, template: "<div class=\"cc-call-log-participants\">\n\n  <div class=\"cc-call-log-participants__header\">\n\n    <div *ngIf=\"onBackClick\">\n      <cometchat-button [iconURL]=\"backIconUrl\" class=\"cc-details__close-button\" [buttonStyle]=\"backButtonStyle()\"\n        (cc-button-clicked)=\"handleBackClick()\"></cometchat-button>\n\n    </div>\n    <div [ngStyle]=\"titleStyle()\">\n      {{title}}\n    </div>\n  </div>\n\n  <cometchat-list  [hideSearch]=\"true\" [listItemView]=\"listItemView ? listItemView : listItem\" [list]=\"participantsList\"\n    [listStyle]=\"listStyle\">\n  </cometchat-list>\n  <ng-template #listItem let-participant>\n    <cometchat-list-item [title]=\"participant.name\" [avatarURL]=\"participant.avatar\" [avatarName]=\"participant.name\"\n      [hideSeparator]=\"hideSeparator\" [listItemStyle]=\"getListItemStyle()\">\n      <div slot=\"subtitleView\" class=\"cc-call-log-participants__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n        <ng-container *ngTemplateOutlet=\"subtitleView\">\n        </ng-container>\n      </div>\n      <ng-template #groupSubtitle>\n        <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-log-participants__subtitle-view\">\n          <div class=\"cc-call__type\">\n            {{ getTailView(participant.totalDurationInMinutes)! }}\n          </div>\n        </div>\n      </ng-template>\n\n      <div slot=\"tailView\" class=\"cc-call-log-participants__tail-view\">\n        <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"call?.getInitiatedAt()!\"\n          [pattern]=\"datePattern\"></cometchat-date>\n\n\n      </div>\n    </cometchat-list-item>\n    <ng-template #tailView>\n\n    </ng-template>\n  </ng-template>\n</div>", styles: [".cc-call-log-participants{height:100%;width:100%;box-sizing:border-box;padding:10px 10px 24px}.cc-call-log-participants__header{display:flex;align-items:center;gap:15px;padding:4px 0}.cc-call-logs-participants__tail-view{position:relative}.cc-call-logs-participants__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatCallLogParticipantsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-call-log-participants", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-call-log-participants\">\n\n  <div class=\"cc-call-log-participants__header\">\n\n    <div *ngIf=\"onBackClick\">\n      <cometchat-button [iconURL]=\"backIconUrl\" class=\"cc-details__close-button\" [buttonStyle]=\"backButtonStyle()\"\n        (cc-button-clicked)=\"handleBackClick()\"></cometchat-button>\n\n    </div>\n    <div [ngStyle]=\"titleStyle()\">\n      {{title}}\n    </div>\n  </div>\n\n  <cometchat-list  [hideSearch]=\"true\" [listItemView]=\"listItemView ? listItemView : listItem\" [list]=\"participantsList\"\n    [listStyle]=\"listStyle\">\n  </cometchat-list>\n  <ng-template #listItem let-participant>\n    <cometchat-list-item [title]=\"participant.name\" [avatarURL]=\"participant.avatar\" [avatarName]=\"participant.name\"\n      [hideSeparator]=\"hideSeparator\" [listItemStyle]=\"getListItemStyle()\">\n      <div slot=\"subtitleView\" class=\"cc-call-log-participants__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n        <ng-container *ngTemplateOutlet=\"subtitleView\">\n        </ng-container>\n      </div>\n      <ng-template #groupSubtitle>\n        <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-log-participants__subtitle-view\">\n          <div class=\"cc-call__type\">\n            {{ getTailView(participant.totalDurationInMinutes)! }}\n          </div>\n        </div>\n      </ng-template>\n\n      <div slot=\"tailView\" class=\"cc-call-log-participants__tail-view\">\n        <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"call?.getInitiatedAt()!\"\n          [pattern]=\"datePattern\"></cometchat-date>\n\n\n      </div>\n    </cometchat-list-item>\n    <ng-template #tailView>\n\n    </ng-template>\n  </ng-template>\n</div>", styles: [".cc-call-log-participants{height:100%;width:100%;box-sizing:border-box;padding:10px 10px 24px}.cc-call-log-participants__header{display:flex;align-items:center;gap:15px;padding:4px 0}.cc-call-logs-participants__tail-view{position:relative}.cc-call-logs-participants__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { title: [{
                type: Input
            }], call: [{
                type: Input
            }], backIconUrl: [{
                type: Input
            }], onBackClick: [{
                type: Input
            }], datePattern: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], onError: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], dateStyle: [{
                type: Input
            }], CallLogParticipantsStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dQYXJ0aWNpcGFudHMvY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy9jb21ldGNoYXQtY2FsbC1sb2ctcGFydGljaXBhbnRzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ2FsbHMvQ29tZXRDaGF0Q2FsbExvZ1BhcnRpY2lwYW50cy9jb21ldGNoYXQtY2FsbC1sb2ctcGFydGljaXBhbnRzL2NvbWV0Y2hhdC1jYWxsLWxvZy1wYXJ0aWNpcGFudHMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFFVCx1QkFBdUIsRUFFdkIsS0FBSyxHQUlOLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQ0wsV0FBVyxFQUNYLFNBQVMsRUFDVCxhQUFhLEdBQ2QsTUFBTSwyQkFBMkIsQ0FBQztBQUVuQyxPQUFPLEVBQ0wsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sUUFBUSxHQUNULE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDbkUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG9DQUFvQyxDQUFDOzs7OztBQVFsRSxNQUFNLE9BQU8scUNBQXFDO0lBaUNoRCxZQUNVLEdBQXNCLEVBQ3RCLFlBQW1DO1FBRG5DLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQ3RCLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQWxDcEMsVUFB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O2tCQU5qRCxTQUFTOytCQUNFLGlDQUFpQyxtQkFHMUIsdUJBQXVCLENBQUMsTUFBTTs0SUFHdEMsS0FBSztzQkFBYixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFJRyxhQUFhO3NCQUFyQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBPbkluaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5cbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IExpc3RTdHlsZSwgQmFzZVN0eWxlIH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIGZvbnRIZWxwZXIsXG4gIERhdGVQYXR0ZXJucyxcbiAgU3RhdGVzLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBDYWxsTG9nUGFydGljaXBhbnRzU3R5bGUgfSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IENhbGxMb2dVdGlscyB9IGZyb20gXCIuLi8uLi8uLi9TaGFyZWQvVXRpbHMvQ2FsbExvZ1V0aWxzXCI7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY2FsbC1sb2ctcGFydGljaXBhbnRzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWNhbGwtbG9nLXBhcnRpY2lwYW50cy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENhbGxMb2dQYXJ0aWNpcGFudHNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJQQVJUSUNJUEFOVFNcIik7XG4gIEBJbnB1dCgpIGNhbGwhOiBhbnk7XG4gIEBJbnB1dCgpIGJhY2tJY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiO1xuICBASW5wdXQoKSBvbkJhY2tDbGljayE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IGFueTtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogYW55O1xuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuXG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGRhdGVTdHlsZTogRGF0ZVN0eWxlID0ge307XG4gIEBJbnB1dCgpIENhbGxMb2dQYXJ0aWNpcGFudHNTdHlsZTogQ2FsbExvZ1BhcnRpY2lwYW50c1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge307XG5cbiAgcHVibGljIHBhcnRpY2lwYW50c0xpc3Q6IGFueSA9IFtdO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkZWQ7XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0ge307XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2VcbiAgKSB7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG5cbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgIFxuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRJblVzZXIoKT8udGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMucGFydGljaXBhbnRzTGlzdCA9IHRoaXMuY2FsbD8uZ2V0UGFydGljaXBhbnRzKCk7XG4gICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBnZXRUYWlsVmlldyh0b3RhbFNlY29uZHM6IGFueSkge1xuICAgIHJldHVybiBDYWxsTG9nVXRpbHMuY29udmVydE1pbnV0ZXNUb0hvdXJzTWludXRlc1NlY29uZHModG90YWxTZWNvbmRzKTtcbiAgfVxuICBjYWxsU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5DYWxsTG9nUGFydGljaXBhbnRzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuQ2FsbExvZ1BhcnRpY2lwYW50c1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5DYWxsTG9nUGFydGljaXBhbnRzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5DYWxsTG9nUGFydGljaXBhbnRzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLkNhbGxMb2dQYXJ0aWNpcGFudHNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXREYXRlU3R5bGUoKTtcbiAgICB0aGlzLnNldENhbGxzU3R5bGUoKTtcbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMuQ2FsbExvZ1BhcnRpY2lwYW50c1N0eWxlLnRpdGxlRm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLkNhbGxMb2dQYXJ0aWNpcGFudHNTdHlsZS50aXRsZUNvbG9yLFxuICAgIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuICBzZXREYXRlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogRGF0ZVN0eWxlID0gbmV3IERhdGVTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTdHlsZSB9O1xuICB9XG5cbiAgZ2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjQ1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgfSk7XG4gICAgcmV0dXJuIHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfTtcbiAgfVxuXG4gIHNldENhbGxzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ2FsbExvZ1BhcnRpY2lwYW50c1N0eWxlID0gbmV3IENhbGxMb2dQYXJ0aWNpcGFudHNTdHlsZSh7XG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGNhbGxTdGF0dXNGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGNhbGxTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICBiYWNrSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIH0pO1xuICAgIHRoaXMuQ2FsbExvZ1BhcnRpY2lwYW50c1N0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5DYWxsTG9nUGFydGljaXBhbnRzU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLkNhbGxMb2dQYXJ0aWNpcGFudHNTdHlsZS5jYWxsU3RhdHVzRm9udCxcbiAgICAgIGNvbG9yOiB0aGlzLkNhbGxMb2dQYXJ0aWNpcGFudHNTdHlsZS5jYWxsU3RhdHVzQ29sb3IsXG4gICAgfTtcbiAgfTtcbiAgdGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5DYWxsTG9nUGFydGljaXBhbnRzU3R5bGUudGl0bGVGb250LFxuICAgICAgY29sb3I6IHRoaXMuQ2FsbExvZ1BhcnRpY2lwYW50c1N0eWxlLnRpdGxlQ29sb3IsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgfTtcblxuICBoYW5kbGVCYWNrQ2xpY2sgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMub25CYWNrQ2xpY2spIHtcbiAgICAgIHRoaXMub25CYWNrQ2xpY2soKTtcbiAgICB9XG4gIH07XG5cbiAgYmFja0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5DYWxsTG9nUGFydGljaXBhbnRzU3R5bGUuYmFja0ljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIH07XG4gIH07XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY2FsbC1sb2ctcGFydGljaXBhbnRzXCI+XG5cbiAgPGRpdiBjbGFzcz1cImNjLWNhbGwtbG9nLXBhcnRpY2lwYW50c19faGVhZGVyXCI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwib25CYWNrQ2xpY2tcIj5cbiAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tJY29uVXJsXCIgY2xhc3M9XCJjYy1kZXRhaWxzX19jbG9zZS1idXR0b25cIiBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIlxuICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaGFuZGxlQmFja0NsaWNrKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IFtuZ1N0eWxlXT1cInRpdGxlU3R5bGUoKVwiPlxuICAgICAge3t0aXRsZX19XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuXG4gIDxjb21ldGNoYXQtbGlzdCAgW2hpZGVTZWFyY2hdPVwidHJ1ZVwiIFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbbGlzdF09XCJwYXJ0aWNpcGFudHNMaXN0XCJcbiAgICBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiPlxuICA8L2NvbWV0Y2hhdC1saXN0PlxuICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1wYXJ0aWNpcGFudD5cbiAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwicGFydGljaXBhbnQubmFtZVwiIFthdmF0YXJVUkxdPVwicGFydGljaXBhbnQuYXZhdGFyXCIgW2F2YXRhck5hbWVdPVwicGFydGljaXBhbnQubmFtZVwiXG4gICAgICBbaGlkZVNlcGFyYXRvcl09XCJoaWRlU2VwYXJhdG9yXCIgW2xpc3RJdGVtU3R5bGVdPVwiZ2V0TGlzdEl0ZW1TdHlsZSgpXCI+XG4gICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWNhbGwtbG9nLXBhcnRpY2lwYW50c19fc3VidGl0bGUtdmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgZ3JvdXBTdWJ0aXRsZVwiPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2dyb3VwU3VidGl0bGU+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiIGNsYXNzPVwiY2MtY2FsbC1sb2ctcGFydGljaXBhbnRzX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGxfX3R5cGVcIj5cbiAgICAgICAgICAgIHt7IGdldFRhaWxWaWV3KHBhcnRpY2lwYW50LnRvdGFsRHVyYXRpb25Jbk1pbnV0ZXMpISB9fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG5cbiAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1jYWxsLWxvZy1wYXJ0aWNpcGFudHNfX3RhaWwtdmlld1wiPlxuICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW2RhdGVTdHlsZV09XCJkYXRlU3R5bGVcIiBbdGltZXN0YW1wXT1cImNhbGw/LmdldEluaXRpYXRlZEF0KCkhXCJcbiAgICAgICAgICBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiPjwvY29tZXRjaGF0LWRhdGU+XG5cblxuICAgICAgPC9kaXY+XG4gICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICAgIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG5cbiAgICA8L25nLXRlbXBsYXRlPlxuICA8L25nLXRlbXBsYXRlPlxuPC9kaXY+Il19