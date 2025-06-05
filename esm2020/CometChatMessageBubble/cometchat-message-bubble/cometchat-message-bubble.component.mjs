import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MenuListStyle } from '@cometchat/uikit-elements';
import { CometChatTheme, CometChatUIKitConstants, MessageBubbleAlignment } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "@angular/common";
export class CometChatMessageBubbleComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.messageBubbleStyle = {
            width: "100%",
            height: "auto",
            background: "",
            borderRadius: "12px",
            border: "none"
        };
        this.alignment = MessageBubbleAlignment.right;
        this.options = [];
        this.id = undefined;
        this.optionsStyle = {
            width: "",
            height: "",
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            submenuWidth: "100%",
            submenuHeight: "inherit",
            submenuBorder: "1px solid #e8e8e8",
            submenuBorderRadius: "8px",
            moreIconTint: "grey"
        };
        this.moreIconURL = "assets/moreicon.svg";
        this.topMenuSize = 3;
        this.theme = new CometChatTheme({});
        this.uikitConstant = MessageBubbleAlignment;
        this.isHovering = false;
        this.wrapperStyle = () => {
            switch (this.alignment) {
                case MessageBubbleAlignment.right:
                    return {
                        display: "flex",
                        justifyContent: "flex-end"
                    };
                case MessageBubbleAlignment.left:
                    return {
                        display: "flex",
                        justifyContent: "flex-start"
                    };
                case MessageBubbleAlignment.center:
                    return {
                        display: "flex",
                        justifyContent: "center"
                    };
                default:
                    return {
                        display: "flex",
                        justifyContent: "center"
                    };
            }
        };
        this.bubbleStyle = () => {
            return {
                ...this.messageBubbleStyle,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
            };
        };
        this.optionsStyles = () => {
            return {
                justifyContent: this.alignment == MessageBubbleAlignment.left ? "flex-start" : "flex-end",
                top: this.headerView && this.alignment == MessageBubbleAlignment.left ? "-8px" : "-28px",
                background: this.optionsStyle?.background,
                border: 'none',
                borderRadius: this.optionsStyle?.borderRadius,
            };
        };
    }
    ngOnChanges(changes) {
    }
    ngOnInit() {
        this.optionsStyle = new MenuListStyle({
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            borderRadius: "8px",
            background: this.themeService.theme.palette.getBackground(),
            submenuWidth: "100%",
            submenuHeight: "100%",
            submenuBorder: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            submenuBorderRadius: "8px",
            submenuBackground: this.themeService.theme.palette.getBackground(),
            moreIconTint: this.themeService.theme.palette.getAccent()
        });
    }
    /**
     * hide show menu options on hover
     * @param  {MouseEvent} event?
     */
    hideShowMenuOption(event) {
        setTimeout(() => {
            this.isHovering = event?.type === "mouseenter";
            this.ref.detectChanges();
        }, 0);
    }
    /**
     * @param  {any} event
     */
    onOptionClick(event) {
        const onClick = event?.detail?.data?.onClick;
        if (onClick) {
            onClick(this.id, event?.detail?.event);
        }
        if (event?.detail?.data && event?.detail?.data?.id != CometChatUIKitConstants.MessageOption.reactToMessage) {
            this.isHovering = false;
            this.ref.detectChanges();
        }
    }
    bubbleAlignmentStyle() {
        return {
            display: "flex",
            justifyContent: "flex-start",
            alignItems: this.alignment == MessageBubbleAlignment.left ? "flex-start" : "flex-end",
        };
    }
    titleStyle() {
        return {
            display: "flex",
            justifyContent: this.alignment == MessageBubbleAlignment.left ? "flex-start" : "flex-end",
            alignItems: "flex-start"
        };
    }
}
CometChatMessageBubbleComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageBubbleComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageBubbleComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: { messageBubbleStyle: "messageBubbleStyle", alignment: "alignment", options: "options", id: "id", leadingView: "leadingView", headerView: "headerView", replyView: "replyView", contentView: "contentView", threadView: "threadView", footerView: "footerView", bottomView: "bottomView", statusInfoView: "statusInfoView", moreIconURL: "moreIconURL", topMenuSize: "topMenuSize" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-bubble__wrapper\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-message-bubble__container\"\n    (mouseenter)=\"hideShowMenuOption($event)\"\n    (mouseleave)=\"hideShowMenuOption($event)\">\n    <div class=\"cc-message-bubble__avatar\" *ngIf=\"leadingView\">\n      <ng-container *ngTemplateOutlet=\"leadingView\">\n      </ng-container>\n    </div>\n    <div class=\"cc-message-bubble\" [ngStyle]=\"bubbleAlignmentStyle()\">\n      <div class=\"cc-message-bubble__title\" [ngStyle]=\"titleStyle()\"\n        *ngIf=\"headerView\">\n        <ng-container [ngTemplateOutlet]=\"headerView\">\n        </ng-container>\n      </div>\n      <div class=\"cc-messageoptions\"\n        *ngIf=\"options && options.length >= 1 && isHovering\"\n        [ngStyle]=\"optionsStyles()\">\n        <cometchat-menu-list [parentClassName]=\"'cc-message-list__wrapper'\" [moreIconURL]=\"moreIconURL\"\n          [topMenuSize]=\"topMenuSize\" [menuListStyle]=\"optionsStyle\"\n          [data]=\"options\" (cc-menu-clicked)=\"onOptionClick($event)\">\n        </cometchat-menu-list>\n      </div>\n      <div class=\"cc-message-bubble__content\" [ngStyle]=\"bubbleStyle()\">\n        <ng-container *ngTemplateOutlet=\"replyView\">\n        </ng-container>\n        <ng-container *ngTemplateOutlet=\"contentView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"statusInfoView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"bottomView\">\n        </ng-container>\n\n        <div>\n        </div>\n      </div>\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n      <ng-container *ngTemplateOutlet=\"threadView\">\n      </ng-container>\n\n    </div>\n  </div>\n</div>\n", styles: ["*{box-sizing:border-box}.cc-message-bubble__wrapper{position:relative}.cc-message-bubble__container{padding-right:8px;border-radius:inherit;display:flex;height:-moz-fit-content;height:fit-content;width:-moz-fit-content;width:fit-content;max-width:65%}.cc-message-bubble{flex:1 1 0;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;min-width:0;padding:8px 2px;border-radius:inherit;height:100%}.cc-message-bubble__avatar{position:relative;border-radius:inherit;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;padding:8px 4px;margin-top:5px}.cc-message-bubble__title:empty:before{display:none}.cc-message-bubble__title:empty:after{display:block;width:100%;height:20px;padding:0 8px}.cc-message-bubble__content{border-radius:8px;width:100%;overflow:hidden}.cc-message-bubble__content .ng-star-inserted{border-radius:inherit}.cc-messageoptions{position:absolute;top:-4px;display:flex;align-items:center;justify-content:flex-end;z-index:1}\n"], directives: [{ type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageBubbleComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cometchat-message-bubble', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-bubble__wrapper\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-message-bubble__container\"\n    (mouseenter)=\"hideShowMenuOption($event)\"\n    (mouseleave)=\"hideShowMenuOption($event)\">\n    <div class=\"cc-message-bubble__avatar\" *ngIf=\"leadingView\">\n      <ng-container *ngTemplateOutlet=\"leadingView\">\n      </ng-container>\n    </div>\n    <div class=\"cc-message-bubble\" [ngStyle]=\"bubbleAlignmentStyle()\">\n      <div class=\"cc-message-bubble__title\" [ngStyle]=\"titleStyle()\"\n        *ngIf=\"headerView\">\n        <ng-container [ngTemplateOutlet]=\"headerView\">\n        </ng-container>\n      </div>\n      <div class=\"cc-messageoptions\"\n        *ngIf=\"options && options.length >= 1 && isHovering\"\n        [ngStyle]=\"optionsStyles()\">\n        <cometchat-menu-list [parentClassName]=\"'cc-message-list__wrapper'\" [moreIconURL]=\"moreIconURL\"\n          [topMenuSize]=\"topMenuSize\" [menuListStyle]=\"optionsStyle\"\n          [data]=\"options\" (cc-menu-clicked)=\"onOptionClick($event)\">\n        </cometchat-menu-list>\n      </div>\n      <div class=\"cc-message-bubble__content\" [ngStyle]=\"bubbleStyle()\">\n        <ng-container *ngTemplateOutlet=\"replyView\">\n        </ng-container>\n        <ng-container *ngTemplateOutlet=\"contentView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"statusInfoView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"bottomView\">\n        </ng-container>\n\n        <div>\n        </div>\n      </div>\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n      <ng-container *ngTemplateOutlet=\"threadView\">\n      </ng-container>\n\n    </div>\n  </div>\n</div>\n", styles: ["*{box-sizing:border-box}.cc-message-bubble__wrapper{position:relative}.cc-message-bubble__container{padding-right:8px;border-radius:inherit;display:flex;height:-moz-fit-content;height:fit-content;width:-moz-fit-content;width:fit-content;max-width:65%}.cc-message-bubble{flex:1 1 0;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;min-width:0;padding:8px 2px;border-radius:inherit;height:100%}.cc-message-bubble__avatar{position:relative;border-radius:inherit;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;padding:8px 4px;margin-top:5px}.cc-message-bubble__title:empty:before{display:none}.cc-message-bubble__title:empty:after{display:block;width:100%;height:20px;padding:0 8px}.cc-message-bubble__content{border-radius:8px;width:100%;overflow:hidden}.cc-message-bubble__content .ng-star-inserted{border-radius:inherit}.cc-messageoptions{position:absolute;top:-4px;display:flex;align-items:center;justify-content:flex-end;z-index:1}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { messageBubbleStyle: [{
                type: Input
            }], alignment: [{
                type: Input
            }], options: [{
                type: Input
            }], id: [{
                type: Input
            }], leadingView: [{
                type: Input
            }], headerView: [{
                type: Input
            }], replyView: [{
                type: Input
            }], contentView: [{
                type: Input
            }], threadView: [{
                type: Input
            }], footerView: [{
                type: Input
            }], bottomView: [{
                type: Input
            }], statusInfoView: [{
                type: Input
            }], moreIconURL: [{
                type: Input
            }], topMenuSize: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUJ1YmJsZS9jb21ldGNoYXQtbWVzc2FnZS1idWJibGUvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUJ1YmJsZS9jb21ldGNoYXQtbWVzc2FnZS1idWJibGUvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBeUMsTUFBTSxlQUFlLENBQUM7QUFFNUksT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBRXpELE9BQU8sRUFBMEIsY0FBYyxFQUFFLHVCQUF1QixFQUFFLHNCQUFzQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7Ozs7QUFPckksTUFBTSxPQUFPLCtCQUErQjtJQW1DMUMsWUFBb0IsR0FBc0IsRUFBVSxZQUFtQztRQUFuRSxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQWxDOUUsdUJBQWtCLEdBQWM7WUFDdkMsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFVBQVUsRUFBRSxFQUFFO1lBQ2QsWUFBWSxFQUFFLE1BQU07WUFDcEIsTUFBTSxFQUFFLE1BQU07U0FDZixDQUFDO1FBQ08sY0FBUyxHQUEyQixzQkFBc0IsQ0FBQyxLQUFLLENBQUM7UUFDakUsWUFBTyxHQUE2QixFQUFFLENBQUM7UUFDdkMsT0FBRSxHQUFxQixTQUFTLENBQUM7UUFTMUMsaUJB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QUFNO1lBQ2YsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFVBQVU7WUFDekYsVUFBVSxFQUFFLFlBQVk7U0FDekIsQ0FBQTtJQUNILENBQUM7OzZIQWhJVSwrQkFBK0I7aUhBQS9CLCtCQUErQixtZENYNUMsNHREQTZDQTs0RkRsQ2EsK0JBQStCO2tCQU4zQyxTQUFTOytCQUNFLDBCQUEwQixtQkFHbkIsdUJBQXVCLENBQUMsTUFBTTs0SUFHdEMsa0JBQWtCO3NCQUExQixLQUFLO2dCQU9HLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLEVBQUU7c0JBQVYsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBWUcsV0FBVztzQkFBbkIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQsIElucHV0LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIFRlbXBsYXRlUmVmLCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZXMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEJhc2VTdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCB7IE1lbnVMaXN0U3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZSc7XG5pbXBvcnQgeyBDb21ldENoYXRNZXNzYWdlT3B0aW9uLCBDb21ldENoYXRUaGVtZSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcyc7XG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjb21ldGNoYXQtbWVzc2FnZS1idWJibGUnLFxuICB0ZW1wbGF0ZVVybDogJy4vY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5zY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VCdWJibGVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIG1lc3NhZ2VCdWJibGVTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiYXV0b1wiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiXG4gIH07XG4gIEBJbnB1dCgpIGFsaWdubWVudDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ7XG4gIEBJbnB1dCgpIG9wdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSA9IFtdO1xuICBASW5wdXQoKSBpZD86IG51bWJlciB8IHN0cmluZyA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgbGVhZGluZ1ZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgaGVhZGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsO1xuICBASW5wdXQoKSByZXBseVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgY29udGVudFZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgdGhyZWFkVmlldyE6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsO1xuICBASW5wdXQoKSBmb290ZXJWaWV3ITogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gIEBJbnB1dCgpIGJvdHRvbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgc3RhdHVzSW5mb1ZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgb3B0aW9uc1N0eWxlOiBNZW51TGlzdFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudVdpZHRoOiBcIjEwMCVcIixcbiAgICBzdWJtZW51SGVpZ2h0OiBcImluaGVyaXRcIixcbiAgICBzdWJtZW51Qm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBtb3JlSWNvblRpbnQ6IFwiZ3JleVwiXG4gIH1cbiAgQElucHV0KCkgbW9yZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL21vcmVpY29uLnN2Z1wiO1xuICBASW5wdXQoKSB0b3BNZW51U2l6ZTogbnVtYmVyID0gMztcbiAgcHVibGljIHRoZW1lOiBDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSlcbiAgcHVibGljIHVpa2l0Q29uc3RhbnQ6IHR5cGVvZiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudDtcbiAgcHVibGljIGlzSG92ZXJpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMub3B0aW9uc1N0eWxlID0gbmV3IE1lbnVMaXN0U3R5bGUoe1xuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgICBzdWJtZW51Qm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG1vcmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKVxuICAgIH0pXG4gIH1cbiAgLyoqXG4gICAqIGhpZGUgc2hvdyBtZW51IG9wdGlvbnMgb24gaG92ZXJcbiAgICogQHBhcmFtICB7TW91c2VFdmVudH0gZXZlbnQ/XG4gICAqL1xuICBoaWRlU2hvd01lbnVPcHRpb24oZXZlbnQ/OiBNb3VzZUV2ZW50KSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmlzSG92ZXJpbmcgPSBldmVudD8udHlwZSA9PT0gXCJtb3VzZWVudGVyXCI7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSwgMCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gZXZlbnRcbiAgICovXG4gIG9uT3B0aW9uQ2xpY2soZXZlbnQ6IGFueSkge1xuICAgIGNvbnN0IG9uQ2xpY2sgPSBldmVudD8uZGV0YWlsPy5kYXRhPy5vbkNsaWNrO1xuICAgIGlmIChvbkNsaWNrKSB7XG4gICAgICBvbkNsaWNrKHRoaXMuaWQsIGV2ZW50Py5kZXRhaWw/LmV2ZW50KTtcbiAgICB9XG4gICAgaWYoZXZlbnQ/LmRldGFpbD8uZGF0YSAmJiBldmVudD8uZGV0YWlsPy5kYXRhPy5pZCAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlYWN0VG9NZXNzYWdlKSB7XG4gICAgICB0aGlzLmlzSG92ZXJpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICBzd2l0Y2ggKHRoaXMuYWxpZ25tZW50KSB7XG4gICAgICBjYXNlIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiZmxleC1lbmRcIlxuICAgICAgICB9O1xuICAgICAgY2FzZSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiZmxleC1zdGFydFwiXG4gICAgICAgIH07XG4gICAgICBjYXNlIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQuY2VudGVyOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiXG4gICAgICAgIH07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiXG4gICAgICAgIH07XG4gICAgfVxuICB9O1xuICBidWJibGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy5tZXNzYWdlQnViYmxlU3R5bGUsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtc3RhcnRcIlxuICAgIH1cbiAgfVxuICBidWJibGVBbGlnbm1lbnRTdHlsZSgpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImZsZXgtc3RhcnRcIixcbiAgICAgIGFsaWduSXRlbXM6IHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdCA/IFwiZmxleC1zdGFydFwiIDogXCJmbGV4LWVuZFwiLFxuICAgIH1cbiAgfVxuICBvcHRpb25zU3R5bGVzOiBhbnkgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGp1c3RpZnlDb250ZW50OiB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQgPyBcImZsZXgtc3RhcnRcIiA6IFwiZmxleC1lbmRcIixcbiAgICAgIHRvcDogdGhpcy5oZWFkZXJWaWV3ICYmIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdCA/IFwiLThweFwiIDogXCItMjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5vcHRpb25zU3R5bGU/LmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5vcHRpb25zU3R5bGU/LmJvcmRlclJhZGl1cyxcbiAgICB9XG4gIH1cbiAgdGl0bGVTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0ID8gXCJmbGV4LXN0YXJ0XCIgOiBcImZsZXgtZW5kXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtc3RhcnRcIlxuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtYnViYmxlX193cmFwcGVyXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtYnViYmxlX19jb250YWluZXJcIlxuICAgIChtb3VzZWVudGVyKT1cImhpZGVTaG93TWVudU9wdGlvbigkZXZlbnQpXCJcbiAgICAobW91c2VsZWF2ZSk9XCJoaWRlU2hvd01lbnVPcHRpb24oJGV2ZW50KVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWJ1YmJsZV9fYXZhdGFyXCIgKm5nSWY9XCJsZWFkaW5nVmlld1wiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImxlYWRpbmdWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1idWJibGVcIiBbbmdTdHlsZV09XCJidWJibGVBbGlnbm1lbnRTdHlsZSgpXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1idWJibGVfX3RpdGxlXCIgW25nU3R5bGVdPVwidGl0bGVTdHlsZSgpXCJcbiAgICAgICAgKm5nSWY9XCJoZWFkZXJWaWV3XCI+XG4gICAgICAgIDxuZy1jb250YWluZXIgW25nVGVtcGxhdGVPdXRsZXRdPVwiaGVhZGVyVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2VvcHRpb25zXCJcbiAgICAgICAgKm5nSWY9XCJvcHRpb25zICYmIG9wdGlvbnMubGVuZ3RoID49IDEgJiYgaXNIb3ZlcmluZ1wiXG4gICAgICAgIFtuZ1N0eWxlXT1cIm9wdGlvbnNTdHlsZXMoKVwiPlxuICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbcGFyZW50Q2xhc3NOYW1lXT1cIidjYy1tZXNzYWdlLWxpc3RfX3dyYXBwZXInXCIgW21vcmVJY29uVVJMXT1cIm1vcmVJY29uVVJMXCJcbiAgICAgICAgICBbdG9wTWVudVNpemVdPVwidG9wTWVudVNpemVcIiBbbWVudUxpc3RTdHlsZV09XCJvcHRpb25zU3R5bGVcIlxuICAgICAgICAgIFtkYXRhXT1cIm9wdGlvbnNcIiAoY2MtbWVudS1jbGlja2VkKT1cIm9uT3B0aW9uQ2xpY2soJGV2ZW50KVwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWJ1YmJsZV9fY29udGVudFwiIFtuZ1N0eWxlXT1cImJ1YmJsZVN0eWxlKClcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInJlcGx5Vmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImNvbnRlbnRWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdGF0dXNJbmZvVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiYm90dG9tVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICA8ZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImZvb3RlclZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRocmVhZFZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXX0=