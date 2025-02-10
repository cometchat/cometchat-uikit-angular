import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CometChatSoundManager, OutgoingCallStyle } from "@cometchat/uikit-shared";
import { AvatarStyle } from '@cometchat/uikit-elements';
import { localize, CometChatUIKitConstants, fontHelper, IconButtonAlignment } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "@angular/common";
/**
*
* CometChatOutgoingCallComponent is a component whic shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatOutgoingCallComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.declineButtonText = localize("CANCEL");
        this.declineButtonIconURL = "assets/close2x.svg";
        this.onError = (error) => {
            console.log(error);
        };
        this.disableSoundForCalls = false;
        this.avatarStyle = {
            borderRadius: "50%",
            width: "180px",
            height: "180px",
        };
        this.outgoingCallStyle = {};
        this.buttonStyle = {
            height: "fit-content",
            width: "fit-content",
            buttonTextFont: "400 12px Inter",
            buttonTextColor: "RGBA(20, 20, 20, 0.58)",
            borderRadius: "8px",
            border: "none",
            buttonIconTint: "white",
            background: "",
            iconBackground: "red",
            padding: "12px"
        };
        this.subtitleText = localize("CALLING");
        this.cardStyle = {
            height: "100%",
            width: "100%",
            border: "inherite",
            borderRadius: "inherite",
            background: "transparent",
            titleFont: "700 22px Inter",
            titleColor: "black",
        };
        this.iconAlignment = IconButtonAlignment.top;
        this.iconStyle = {
            height: "16px",
            width: "16px",
            iconTint: "RGBA(20, 20, 20, 0.68)"
        };
        this.onClose = () => {
            CometChatSoundManager.pause();
            if (this.onCloseClicked) {
                this.onCloseClicked();
            }
        };
        this.wrapperStyle = () => {
            return {
                height: this.outgoingCallStyle.height,
                width: this.outgoingCallStyle.width,
                background: this.outgoingCallStyle.background,
                border: this.outgoingCallStyle.border,
                borderRadius: this.outgoingCallStyle.borderRadius
            };
        };
    }
    ngOnChanges(changes) {
        if (changes["call"] && changes["call"].currentValue) {
            if (!this.disableSoundForCalls) {
                setTimeout(() => {
                    this.playAudio();
                });
            }
            this.setThemeStyle();
        }
    }
    ngOnInit() {
    }
    playAudio() {
        if (this.customSoundForCalls) {
            CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingCall, this.customSoundForCalls);
        }
        else {
            CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingCall);
        }
    }
    ngOnDestroy() {
        CometChatSoundManager.pause();
    }
    getAvatarURL() {
        return this.call?.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user ? this.call?.getReceiver()?.getAvatar() : this.call?.getReceiver()?.getIcon();
    }
    setThemeStyle() {
        this.setAvatarStyle();
        this.setOutgoingCallStyle();
        this.cardStyle.titleColor = this.outgoingCallStyle.titleTextColor;
        this.cardStyle.titleFont = this.outgoingCallStyle.titleTextFont;
    }
    setOutgoingCallStyle() {
        let defaultStyle = new OutgoingCallStyle({
            width: "360px",
            height: "581px",
            background: this.themeService.theme.palette.getBackground(),
            border: "none",
            borderRadius: "8px",
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            subtitleTextColor: this.themeService.theme.palette.getAccent600(),
            declineButtonTextFont: fontHelper(this.themeService.theme.typography.caption1),
            declineButtonTextColor: this.themeService.theme.palette.getAccent600(),
            declineButtonIconTint: this.themeService.theme.palette.getAccent("dark"),
            declineButtonIconBackground: this.themeService.theme.palette.getError()
        });
        this.outgoingCallStyle = { ...defaultStyle, ...this.outgoingCallStyle };
        this.buttonStyle = {
            height: "fit-content",
            width: "fit-content",
            buttonTextFont: this.outgoingCallStyle.declineButtonTextFont,
            buttonTextColor: this.outgoingCallStyle.declineButtonTextColor,
            borderRadius: "8px",
            border: "none",
            buttonIconTint: this.outgoingCallStyle.declineButtonIconTint,
            background: "",
            iconBackground: this.outgoingCallStyle.declineButtonIconBackground,
            padding: "12px",
            display: "flex",
            flexDirection: "column"
        };
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "50%",
            width: "180px",
            height: "180px",
            border: `1px solid  ${this.themeService.theme.palette.getAccent100()}`,
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
    subtitleStyle() {
        return {
            textFont: this.outgoingCallStyle.subtitleTextFont,
            textColor: this.outgoingCallStyle.subtitleTextColor
        };
    }
}
CometChatOutgoingCallComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOutgoingCallComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatOutgoingCallComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatOutgoingCallComponent, selector: "cometchat-outgoing-call", inputs: { call: "call", declineButtonText: "declineButtonText", declineButtonIconURL: "declineButtonIconURL", customView: "customView", onError: "onError", disableSoundForCalls: "disableSoundForCalls", customSoundForCalls: "customSoundForCalls", avatarStyle: "avatarStyle", outgoingCallStyle: "outgoingCallStyle", onCloseClicked: "onCloseClicked" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-outgoing-call__wrapper\" [ngStyle]=\"wrapperStyle()\">\n    <div class=\"cc-outgoing-call__custom-view\" *ngIf=\"customView; else elseBlock;\">\n        <ng-container *ngTemplateOutlet=\"customView\">\n\n        </ng-container>\n    </div>\n<ng-template #elseBlock>\n    <cometchat-card [title]=\"call.getReceiver().getName()\" [cardStyle]=\"cardStyle\" [avatarName]=\"call.getReceiver().getName()\" [avatarURL]=\"getAvatarURL()\" [avatarStyle]=\"avatarStyle\" >\n        <cometchat-label slot=\"subtitleView\" [labelStyle]=\"subtitleStyle()\" [text]=\"subtitleText\"> </cometchat-label>\n        <div slot=\"bottomView\">\n            <cometchat-icon-button (cc-button-clicked)=\"onClose()\" [text]=\"declineButtonText\" [iconURL]=\"declineButtonIconURL\" [alignment]=\"iconAlignment\" [buttonStyle]=\"buttonStyle\">\n\n            </cometchat-icon-button>\n        </div>\n        </cometchat-card>\n</ng-template>\n</div>\n", styles: [".cc-outgoing-call__wrapper{height:100%;width:100%}\n"], directives: [{ type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatOutgoingCallComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-outgoing-call", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-outgoing-call__wrapper\" [ngStyle]=\"wrapperStyle()\">\n    <div class=\"cc-outgoing-call__custom-view\" *ngIf=\"customView; else elseBlock;\">\n        <ng-container *ngTemplateOutlet=\"customView\">\n\n        </ng-container>\n    </div>\n<ng-template #elseBlock>\n    <cometchat-card [title]=\"call.getReceiver().getName()\" [cardStyle]=\"cardStyle\" [avatarName]=\"call.getReceiver().getName()\" [avatarURL]=\"getAvatarURL()\" [avatarStyle]=\"avatarStyle\" >\n        <cometchat-label slot=\"subtitleView\" [labelStyle]=\"subtitleStyle()\" [text]=\"subtitleText\"> </cometchat-label>\n        <div slot=\"bottomView\">\n            <cometchat-icon-button (cc-button-clicked)=\"onClose()\" [text]=\"declineButtonText\" [iconURL]=\"declineButtonIconURL\" [alignment]=\"iconAlignment\" [buttonStyle]=\"buttonStyle\">\n\n            </cometchat-icon-button>\n        </div>\n        </cometchat-card>\n</ng-template>\n</div>\n", styles: [".cc-outgoing-call__wrapper{height:100%;width:100%}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { call: [{
                type: Input
            }], declineButtonText: [{
                type: Input
            }], declineButtonIconURL: [{
                type: Input
            }], customView: [{
                type: Input
            }], onError: [{
                type: Input
            }], disableSoundForCalls: [{
                type: Input
            }], customSoundForCalls: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], outgoingCallStyle: [{
                type: Input
            }], onCloseClicked: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW91dGdvaW5nLWNhbGwuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRPdXRnb2luZ0NhbGwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGwuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9DYWxscy9Db21ldENoYXRPdXRnb2luZ0NhbGwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGwuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHVCQUF1QixFQUFxQixTQUFTLEVBQUUsS0FBSyxFQUFpRCxNQUFNLGVBQWUsQ0FBQztBQUU1SSxPQUFPLEVBQUkscUJBQXFCLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUNyRixPQUFPLEVBQUUsV0FBVyxFQUF3QixNQUFNLDJCQUEyQixDQUFBO0FBRTdFLE9BQU8sRUFBRyxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7Ozs7QUFDakg7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sOEJBQThCO0lBOEN6QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBNUM5RSxzQkFBaUIsR0FBVyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0MseUJBQW9CLEdBQVcsb0JBQW9CLENBQUM7UUFFcEQsWUFBTyxHQUFrRCxDQUFDLEtBQW1DLEVBQUUsRUFBRTtZQUN4RyxPQUFPLENBQUMsR0FBRyxDQUFD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IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tICdAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHQnO1xuaW1wb3J0IHsgICBDb21ldENoYXRTb3VuZE1hbmFnZXIsIE91dGdvaW5nQ2FsbFN0eWxlIH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgQ2FyZFN0eWxlLCBJY29uU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZSc7XG5pbXBvcnQgeyAgbG9jYWxpemUsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBmb250SGVscGVyLCBJY29uQnV0dG9uQWxpZ25tZW50IH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuLyoqXG4qXG4qIENvbWV0Q2hhdE91dGdvaW5nQ2FsbENvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB3aGljIHNob3dzIG91dGdvaW5nIGNhbGwgc2NyZWVuIGZvciBkZWZhdWx0IGF1ZGlvIGFuZCB2aWRlbyBjYWxsLlxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1vdXRnb2luZy1jYWxsXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LW91dGdvaW5nLWNhbGwuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1vdXRnb2luZy1jYWxsLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRPdXRnb2luZ0NhbGxDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGNhbGwhOiBDb21ldENoYXQuQ2FsbDtcbiAgQElucHV0KCkgZGVjbGluZUJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSBkZWNsaW5lQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIjtcbiAgQElucHV0KCkgY3VzdG9tVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvckNhbGxzOmJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JDYWxscyE6c3RyaW5nO1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjUwJVwiLFxuICAgIHdpZHRoOiBcIjE4MHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMTgwcHhcIixcbiAgfTtcbiAgQElucHV0KCkgb3V0Z29pbmdDYWxsU3R5bGU6IE91dGdvaW5nQ2FsbFN0eWxlID0ge307XG4gIEBJbnB1dCgpIG9uQ2xvc2VDbGlja2VkITooKCk9PnZvaWQpIHwgbnVsbDtcbiAgIGJ1dHRvblN0eWxlOmFueSA9IHtcbiAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICB3aWR0aDogXCJmaXQtY29udGVudFwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIjQwMCAxMnB4IEludGVyXCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBidXR0b25JY29uVGludDogXCJ3aGl0ZVwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgaWNvbkJhY2tncm91bmQ6XCJyZWRcIixcbiAgICBwYWRkaW5nOlwiMTJweFwiXG4gIH07XG5cbiAgc3VidGl0bGVUZXh0OnN0cmluZyA9IGxvY2FsaXplKFwiQ0FMTElOR1wiKVxuICBjYXJkU3R5bGU6Q2FyZFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJpbmhlcml0ZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCJpbmhlcml0ZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB0aXRsZUZvbnQ6XCI3MDAgMjJweCBJbnRlclwiLFxuICAgIHRpdGxlQ29sb3I6XCJibGFja1wiLFxuICB9XG4gIGljb25BbGlnbm1lbnQ6SWNvbkJ1dHRvbkFsaWdubWVudCA9IEljb25CdXR0b25BbGlnbm1lbnQudG9wXG4gIGljb25TdHlsZTogSWNvblN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMTZweFwiLFxuICAgIGljb25UaW50OiBcIlJHQkEoMjAsIDIwLCAyMCwgMC42OClcIlxuICB9XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkgeyAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICBpZihjaGFuZ2VzW1wiY2FsbFwiXSAmJiBjaGFuZ2VzW1wiY2FsbFwiXS5jdXJyZW50VmFsdWUpe1xuICAgICAgICBpZighdGhpcy5kaXNhYmxlU291bmRGb3JDYWxscyl7XG5cbiAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5wbGF5QXVkaW8oKVxuICAgICAgIH0pO1xuICAgICB9XG4gICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpXG4gICB9XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG5cbiAgfVxuICBwbGF5QXVkaW8oKSB7XG4gICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JDYWxscykge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLm91dGdvaW5nQ2FsbCwgdGhpcy5jdXN0b21Tb3VuZEZvckNhbGxzKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KENvbWV0Q2hhdFNvdW5kTWFuYWdlci5Tb3VuZC5vdXRnb2luZ0NhbGwpXG4gICAgfVxuICB9XG4gIG5nT25EZXN0cm95KCl7XG4gICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBhdXNlKClcbiAgfVxuICBvbkNsb3NlID0oKT0+e1xuICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpXG4gaWYodGhpcy5vbkNsb3NlQ2xpY2tlZCl7XG4gIHRoaXMub25DbG9zZUNsaWNrZWQoKVxuXG4gfVxuICB9XG4gIGdldEF2YXRhclVSTCgpe1xuICAgIHJldHVybiB0aGlzLmNhbGw/LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciA/ICh0aGlzLmNhbGw/LmdldFJlY2VpdmVyKCkgYXMgQ29tZXRDaGF0LlVzZXIpPy5nZXRBdmF0YXIoKSA6ICh0aGlzLmNhbGw/LmdldFJlY2VpdmVyKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKT8uZ2V0SWNvbigpXG4gIH1cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKClcbiAgICB0aGlzLnNldE91dGdvaW5nQ2FsbFN0eWxlKClcbiAgICB0aGlzLmNhcmRTdHlsZS50aXRsZUNvbG9yID0gdGhpcy5vdXRnb2luZ0NhbGxTdHlsZS50aXRsZVRleHRDb2xvclxuICAgIHRoaXMuY2FyZFN0eWxlLnRpdGxlRm9udCA9IHRoaXMub3V0Z29pbmdDYWxsU3R5bGUudGl0bGVUZXh0Rm9udFxuICB9XG4gIHNldE91dGdvaW5nQ2FsbFN0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogT3V0Z29pbmdDYWxsU3R5bGUgPSBuZXcgT3V0Z29pbmdDYWxsU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMzYwcHhcIixcbiAgICAgIGhlaWdodDogXCI1ODFweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkZWNsaW5lQnV0dG9uVGV4dEZvbnQ6Zm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIGRlY2xpbmVCdXR0b25UZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlY2xpbmVCdXR0b25JY29uVGludDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBkZWNsaW5lQnV0dG9uSWNvbkJhY2tncm91bmQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpXG4gICAgfSlcbiAgICB0aGlzLm91dGdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub3V0Z29pbmdDYWxsU3R5bGUgfVxuICAgIHRoaXMuYnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG4gICAgICBidXR0b25UZXh0Rm9udDogdGhpcy5vdXRnb2luZ0NhbGxTdHlsZS5kZWNsaW5lQnV0dG9uVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMub3V0Z29pbmdDYWxsU3R5bGUuZGVjbGluZUJ1dHRvblRleHRDb2xvcixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5vdXRnb2luZ0NhbGxTdHlsZS5kZWNsaW5lQnV0dG9uSWNvblRpbnQsXG4gICAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgaWNvbkJhY2tncm91bmQ6dGhpcy5vdXRnb2luZ0NhbGxTdHlsZS5kZWNsaW5lQnV0dG9uSWNvbkJhY2tncm91bmQsXG4gICAgICBwYWRkaW5nOlwiMTJweFwiLFxuICAgICAgZGlzcGxheTpcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIlxuICAgIH1cbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiNTAlXCIsXG4gICAgICB3aWR0aDogXCIxODBweFwiLFxuICAgICAgaGVpZ2h0OiBcIjE4MHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pXG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH1cbiAgfVxuICBzdWJ0aXRsZVN0eWxlKCl7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OnRoaXMub3V0Z29pbmdDYWxsU3R5bGUuc3VidGl0bGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjp0aGlzLm91dGdvaW5nQ2FsbFN0eWxlLnN1YnRpdGxlVGV4dENvbG9yXG4gICAgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLm91dGdvaW5nQ2FsbFN0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLm91dGdvaW5nQ2FsbFN0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5vdXRnb2luZ0NhbGxTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLm91dGdvaW5nQ2FsbFN0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5vdXRnb2luZ0NhbGxTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cblxufVxuIiwiPGRpdiBjbGFzcz1cImNjLW91dGdvaW5nLWNhbGxfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1vdXRnb2luZy1jYWxsX19jdXN0b20tdmlld1wiICpuZ0lmPVwiY3VzdG9tVmlldzsgZWxzZSBlbHNlQmxvY2s7XCI+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJjdXN0b21WaWV3XCI+XG5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG48bmctdGVtcGxhdGUgI2Vsc2VCbG9jaz5cbiAgICA8Y29tZXRjaGF0LWNhcmQgW3RpdGxlXT1cImNhbGwuZ2V0UmVjZWl2ZXIoKS5nZXROYW1lKClcIiBbY2FyZFN0eWxlXT1cImNhcmRTdHlsZVwiIFthdmF0YXJOYW1lXT1cImNhbGwuZ2V0UmVjZWl2ZXIoKS5nZXROYW1lKClcIiBbYXZhdGFyVVJMXT1cImdldEF2YXRhclVSTCgpXCIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCIgPlxuICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBbbGFiZWxTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIiBbdGV4dF09XCJzdWJ0aXRsZVRleHRcIj4gPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgIDxkaXYgc2xvdD1cImJvdHRvbVZpZXdcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtaWNvbi1idXR0b24gKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQ2xvc2UoKVwiIFt0ZXh0XT1cImRlY2xpbmVCdXR0b25UZXh0XCIgW2ljb25VUkxdPVwiZGVjbGluZUJ1dHRvbkljb25VUkxcIiBbYWxpZ25tZW50XT1cImljb25BbGlnbm1lbnRcIiBbYnV0dG9uU3R5bGVdPVwiYnV0dG9uU3R5bGVcIj5cblxuICAgICAgICAgICAgPC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8L2NvbWV0Y2hhdC1jYXJkPlxuPC9uZy10ZW1wbGF0ZT5cbjwvZGl2PlxuIl19