import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MenuListStyle } from '@cometchat/uikit-elements';
import { CometChatTheme, MessageBubbleAlignment } from '@cometchat/uikit-resources';
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
            submenuHeight: "100%",
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
        this.isHovering = event?.type === "mouseenter";
        this.ref.detectChanges();
    }
    /**
     * @param  {any} event
     */
    onOptionClick(event) {
        const onClick = event?.detail?.data?.onClick;
        if (onClick) {
            onClick(this.id, event?.detail?.event);
        }
        this.isHovering = false;
        this.ref.detectChanges();
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
CometChatMessageBubbleComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: { messageBubbleStyle: "messageBubbleStyle", alignment: "alignment", options: "options", id: "id", leadingView: "leadingView", headerView: "headerView", replyView: "replyView", contentView: "contentView", threadView: "threadView", footerView: "footerView", bottomView: "bottomView", statusInfoView: "statusInfoView", moreIconURL: "moreIconURL", topMenuSize: "topMenuSize" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-bubble__wrapper\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-message-bubble__container\"\n    (mouseenter)=\"hideShowMenuOption($event)\"\n    (mouseleave)=\"hideShowMenuOption($event)\">\n    <div class=\"cc-message-bubble__avatar\" *ngIf=\"leadingView\">\n      <ng-container *ngTemplateOutlet=\"leadingView\">\n      </ng-container>\n    </div>\n    <div class=\"cc-message-bubble\" [ngStyle]=\"bubbleAlignmentStyle()\">\n      <div class=\"cc-message-bubble__title\" [ngStyle]=\"titleStyle()\"\n        *ngIf=\"headerView\">\n        <ng-container [ngTemplateOutlet]=\"headerView\">\n        </ng-container>\n      </div>\n      <div class=\"cc-messageoptions\"\n        *ngIf=\"options && options.length >= 1 && isHovering\"\n        [ngStyle]=\"optionsStyles()\">\n        <cometchat-menu-list [moreIconURL]=\"moreIconURL\"\n          [topMenuSize]=\"topMenuSize\" [menuListStyle]=\"optionsStyle\"\n          [data]=\"options\" (cc-menu-clicked)=\"onOptionClick($event)\">\n        </cometchat-menu-list>\n      </div>\n      <div class=\"cc-message-bubble__content\" [ngStyle]=\"bubbleStyle()\">\n        <ng-container *ngTemplateOutlet=\"replyView\">\n        </ng-container>\n        <ng-container *ngTemplateOutlet=\"contentView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"statusInfoView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"bottomView\">\n        </ng-container>\n\n        <div>\n        </div>\n      </div>\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n      <ng-container *ngTemplateOutlet=\"threadView\">\n      </ng-container>\n\n    </div>\n  </div>\n</div>\n", styles: ["*{box-sizing:border-box}.cc-message-bubble__wrapper{position:relative}.cc-message-bubble__container{padding-right:8px;border-radius:inherit;display:flex;height:-moz-fit-content;height:fit-content;width:-moz-fit-content;width:fit-content;max-width:65%}.cc-message-bubble{flex:1 1 0;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;min-width:0;padding:8px 2px;border-radius:inherit;height:100%}.cc-message-bubble__avatar{position:relative;border-radius:inherit;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;padding:8px 4px;margin-top:5px}.cc-message-bubble__title:empty:before{display:none}.cc-message-bubble__title:empty:after{display:block;width:100%;height:20px;padding:0 8px}.cc-message-bubble__content{border-radius:8px;width:100%;overflow:hidden}.cc-message-bubble__content .ng-star-inserted{border-radius:inherit}.cc-messageoptions{position:absolute;top:-4px;display:flex;align-items:center;justify-content:flex-end;z-index:1}\n"], directives: [{ type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageBubbleComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cometchat-message-bubble', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-bubble__wrapper\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-message-bubble__container\"\n    (mouseenter)=\"hideShowMenuOption($event)\"\n    (mouseleave)=\"hideShowMenuOption($event)\">\n    <div class=\"cc-message-bubble__avatar\" *ngIf=\"leadingView\">\n      <ng-container *ngTemplateOutlet=\"leadingView\">\n      </ng-container>\n    </div>\n    <div class=\"cc-message-bubble\" [ngStyle]=\"bubbleAlignmentStyle()\">\n      <div class=\"cc-message-bubble__title\" [ngStyle]=\"titleStyle()\"\n        *ngIf=\"headerView\">\n        <ng-container [ngTemplateOutlet]=\"headerView\">\n        </ng-container>\n      </div>\n      <div class=\"cc-messageoptions\"\n        *ngIf=\"options && options.length >= 1 && isHovering\"\n        [ngStyle]=\"optionsStyles()\">\n        <cometchat-menu-list [moreIconURL]=\"moreIconURL\"\n          [topMenuSize]=\"topMenuSize\" [menuListStyle]=\"optionsStyle\"\n          [data]=\"options\" (cc-menu-clicked)=\"onOptionClick($event)\">\n        </cometchat-menu-list>\n      </div>\n      <div class=\"cc-message-bubble__content\" [ngStyle]=\"bubbleStyle()\">\n        <ng-container *ngTemplateOutlet=\"replyView\">\n        </ng-container>\n        <ng-container *ngTemplateOutlet=\"contentView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"statusInfoView\">\n        </ng-container>\n\n        <ng-container *ngTemplateOutlet=\"bottomView\">\n        </ng-container>\n\n        <div>\n        </div>\n      </div>\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n      <ng-container *ngTemplateOutlet=\"threadView\">\n      </ng-container>\n\n    </div>\n  </div>\n</div>\n", styles: ["*{box-sizing:border-box}.cc-message-bubble__wrapper{position:relative}.cc-message-bubble__container{padding-right:8px;border-radius:inherit;display:flex;height:-moz-fit-content;height:fit-content;width:-moz-fit-content;width:fit-content;max-width:65%}.cc-message-bubble{flex:1 1 0;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;min-width:0;padding:8px 2px;border-radius:inherit;height:100%}.cc-message-bubble__avatar{position:relative;border-radius:inherit;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;padding:8px 4px;margin-top:5px}.cc-message-bubble__title:empty:before{display:none}.cc-message-bubble__title:empty:after{display:block;width:100%;height:20px;padding:0 8px}.cc-message-bubble__content{border-radius:8px;width:100%;overflow:hidden}.cc-message-bubble__content .ng-star-inserted{border-radius:inherit}.cc-messageoptions{position:absolute;top:-4px;display:flex;align-items:center;justify-content:flex-end;z-index:1}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUJ1YmJsZS9jb21ldGNoYXQtbWVzc2FnZS1idWJibGUvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUJ1YmJsZS9jb21ldGNoYXQtbWVzc2FnZS1idWJibGUvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBeUMsTUFBTSxlQUFlLENBQUM7QUFFNUksT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBRXpELE9BQU8sRUFBMEIsY0FBYyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7Ozs7QUFPNUcsTUFBTSxPQUFPLCtCQUErQjtJQW1DMUMsWUFBb0IsR0FBc0IsRUFBVSxZQUFtQztRQUFuRSxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQWxDOUUsdUJBQWtCLEdBQWM7WUFDdkMsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFVBQVUsRUFBRSxFQUFFO1lBQ2QsWUFBWSxFQUFFLE1BQU07WUFDcEIsTUFBTSxFQUFFLE1BQU07U0FDZixDQUFDO1FBQ08sY0FBUyxHQUEyQixzQkFBc0IsQ0FBQyxLQUFLLENBQUM7UUFDakUsWUFBTyxHQUE2QixFQUFFLENBQUM7UUFDdkMsT0FBRSxHQUFxQixTQUFTLENBQUM7UUFTMUMsaUJBQVksR0FBa0I7WUFD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bENhLCtCQUErQjtrQkFOM0MsU0FBUzsrQkFDRSwwQkFBMEIsbUJBR25CLHVCQUF1QixDQUFDLE1BQU07NElBR3RDLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFPRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxFQUFFO3NCQUFWLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQVlHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgT25Jbml0LCBJbnB1dCwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBUZW1wbGF0ZVJlZiwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBCYXNlU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCc7XG5pbXBvcnQgeyBNZW51TGlzdFN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gJy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbiwgQ29tZXRDaGF0VGhlbWUsIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcyc7XG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjb21ldGNoYXQtbWVzc2FnZS1idWJibGUnLFxuICB0ZW1wbGF0ZVVybDogJy4vY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5zY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VCdWJibGVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIG1lc3NhZ2VCdWJibGVTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiYXV0b1wiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiXG4gIH07XG4gIEBJbnB1dCgpIGFsaWdubWVudDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ7XG4gIEBJbnB1dCgpIG9wdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSA9IFtdO1xuICBASW5wdXQoKSBpZD86IG51bWJlciB8IHN0cmluZyA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgbGVhZGluZ1ZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgaGVhZGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsO1xuICBASW5wdXQoKSByZXBseVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgY29udGVudFZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgdGhyZWFkVmlldyE6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsO1xuICBASW5wdXQoKSBmb290ZXJWaWV3ITogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gIEBJbnB1dCgpIGJvdHRvbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgc3RhdHVzSW5mb1ZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgb3B0aW9uc1N0eWxlOiBNZW51TGlzdFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudVdpZHRoOiBcIjEwMCVcIixcbiAgICBzdWJtZW51SGVpZ2h0OiBcIjEwMCVcIixcbiAgICBzdWJtZW51Qm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBtb3JlSWNvblRpbnQ6IFwiZ3JleVwiXG4gIH1cbiAgQElucHV0KCkgbW9yZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL21vcmVpY29uLnN2Z1wiO1xuICBASW5wdXQoKSB0b3BNZW51U2l6ZTogbnVtYmVyID0gMztcbiAgcHVibGljIHRoZW1lOiBDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSlcbiAgcHVibGljIHVpa2l0Q29uc3RhbnQ6IHR5cGVvZiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudDtcbiAgcHVibGljIGlzSG92ZXJpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMub3B0aW9uc1N0eWxlID0gbmV3IE1lbnVMaXN0U3R5bGUoe1xuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgICBzdWJtZW51Qm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG1vcmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKVxuICAgIH0pXG4gIH1cbiAgLyoqXG4gICAqIGhpZGUgc2hvdyBtZW51IG9wdGlvbnMgb24gaG92ZXJcbiAgICogQHBhcmFtICB7TW91c2VFdmVudH0gZXZlbnQ/XG4gICAqL1xuICBoaWRlU2hvd01lbnVPcHRpb24oZXZlbnQ/OiBNb3VzZUV2ZW50KSB7XG4gICAgdGhpcy5pc0hvdmVyaW5nID0gZXZlbnQ/LnR5cGUgPT09IFwibW91c2VlbnRlclwiO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25PcHRpb25DbGljayhldmVudDogYW55KSB7XG4gICAgY29uc3Qgb25DbGljayA9IGV2ZW50Py5kZXRhaWw/LmRhdGE/Lm9uQ2xpY2s7XG4gICAgaWYgKG9uQ2xpY2spIHtcbiAgICAgIG9uQ2xpY2sodGhpcy5pZCwgZXZlbnQ/LmRldGFpbD8uZXZlbnQpO1xuICAgIH1cbiAgICB0aGlzLmlzSG92ZXJpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHN3aXRjaCAodGhpcy5hbGlnbm1lbnQpIHtcbiAgICAgIGNhc2UgTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5yaWdodDpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJmbGV4LWVuZFwiXG4gICAgICAgIH07XG4gICAgICBjYXNlIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJmbGV4LXN0YXJ0XCJcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5jZW50ZXI6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCJcbiAgICAgICAgfTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCJcbiAgICAgICAgfTtcbiAgICB9XG4gIH07XG4gIGJ1YmJsZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLm1lc3NhZ2VCdWJibGVTdHlsZSxcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1zdGFydFwiXG4gICAgfVxuICB9XG4gIGJ1YmJsZUFsaWdubWVudFN0eWxlKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiZmxleC1zdGFydFwiLFxuICAgICAgYWxpZ25JdGVtczogdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0ID8gXCJmbGV4LXN0YXJ0XCIgOiBcImZsZXgtZW5kXCIsXG4gICAgfVxuICB9XG4gIG9wdGlvbnNTdHlsZXM6IGFueSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAganVzdGlmeUNvbnRlbnQ6IHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdCA/IFwiZmxleC1zdGFydFwiIDogXCJmbGV4LWVuZFwiLFxuICAgICAgdG9wOiB0aGlzLmhlYWRlclZpZXcgJiYgdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0ID8gXCItOHB4XCIgOiBcIi0yOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLm9wdGlvbnNTdHlsZT8uYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLm9wdGlvbnNTdHlsZT8uYm9yZGVyUmFkaXVzLFxuICAgIH1cbiAgfVxuICB0aXRsZVN0eWxlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQgPyBcImZsZXgtc3RhcnRcIiA6IFwiZmxleC1lbmRcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1zdGFydFwiXG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1idWJibGVfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1idWJibGVfX2NvbnRhaW5lclwiXG4gICAgKG1vdXNlZW50ZXIpPVwiaGlkZVNob3dNZW51T3B0aW9uKCRldmVudClcIlxuICAgIChtb3VzZWxlYXZlKT1cImhpZGVTaG93TWVudU9wdGlvbigkZXZlbnQpXCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtYnViYmxlX19hdmF0YXJcIiAqbmdJZj1cImxlYWRpbmdWaWV3XCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibGVhZGluZ1ZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWJ1YmJsZVwiIFtuZ1N0eWxlXT1cImJ1YmJsZUFsaWdubWVudFN0eWxlKClcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWJ1YmJsZV9fdGl0bGVcIiBbbmdTdHlsZV09XCJ0aXRsZVN0eWxlKClcIlxuICAgICAgICAqbmdJZj1cImhlYWRlclZpZXdcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciBbbmdUZW1wbGF0ZU91dGxldF09XCJoZWFkZXJWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZW9wdGlvbnNcIlxuICAgICAgICAqbmdJZj1cIm9wdGlvbnMgJiYgb3B0aW9ucy5sZW5ndGggPj0gMSAmJiBpc0hvdmVyaW5nXCJcbiAgICAgICAgW25nU3R5bGVdPVwib3B0aW9uc1N0eWxlcygpXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFttb3JlSWNvblVSTF09XCJtb3JlSWNvblVSTFwiXG4gICAgICAgICAgW3RvcE1lbnVTaXplXT1cInRvcE1lbnVTaXplXCIgW21lbnVMaXN0U3R5bGVdPVwib3B0aW9uc1N0eWxlXCJcbiAgICAgICAgICBbZGF0YV09XCJvcHRpb25zXCIgKGNjLW1lbnUtY2xpY2tlZCk9XCJvbk9wdGlvbkNsaWNrKCRldmVudClcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1idWJibGVfX2NvbnRlbnRcIiBbbmdTdHlsZV09XCJidWJibGVTdHlsZSgpXCI+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJyZXBseVZpZXdcIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJjb250ZW50Vmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3RhdHVzSW5mb1ZpZXdcIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImJvdHRvbVZpZXdcIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJmb290ZXJWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0aHJlYWRWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19