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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUJ1YmJsZS9jb21ldGNoYXQtbWVzc2FnZS1idWJibGUvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0TWVzc2FnZUJ1YmJsZS9jb21ldGNoYXQtbWVzc2FnZS1idWJibGUvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBeUMsTUFBTSxlQUFlLENBQUM7QUFFNUksT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBRXpELE9BQU8sRUFBMEIsY0FBYyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7Ozs7QUFPNUcsTUFBTSxPQUFPLCtCQUErQjtJQW1DMUMsWUFBb0IsR0FBc0IsRUFBVSxZQUFtQztRQUFuRSxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQWxDOUUsdUJBQWtCLEdBQWM7WUFDdkMsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFVBQVUsRUFBRSxFQUFFO1lBQ2QsWUFBWSxFQUFFLE1BQU07WUFDcEIsTUFBTSxFQUFFLE1BQU07U0FDZixDQUFDO1FBQ08sY0FBUyxHQUEyQixzQkFBc0IsQ0FBQyxLQUFLLENBQUM7UUFDakUsWUFBTyxHQUE2QixFQUFFLENBQUM7UUFDdkMsT0FBRSxHQUFxQixTQUFTLENBQUM7UUFTMUMsaUJBQVksR0FBa0I7WUFD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Q0gsQ0FBQzs7NkhBOUhVLCtCQUErQjtpSEFBL0IsK0JBQStCLG1kQ1g1QywycURBNkNBOzRGRGxDYSwrQkFBK0I7a0JBTjNDLFNBQVM7K0JBQ0UsMEJBQTBCLG1CQUduQix1QkFBdUIsQ0FBQyxNQUFNOzRJQUd0QyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBT0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csRUFBRTtzQkFBVixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFZRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgSW5wdXQsIENoYW5nZURldGVjdG9yUmVmLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVGVtcGxhdGVSZWYsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQmFzZVN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0IHsgTWVudUxpc3RTdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcbmltcG9ydCB7IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24sIENvbWV0Q2hhdFRoZW1lLCBNZXNzYWdlQnViYmxlQWxpZ25tZW50IH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnO1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2NvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZS5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2NvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZS5jb21wb25lbnQuc2NzcyddLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlQnViYmxlQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBtZXNzYWdlQnViYmxlU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcImF1dG9cIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIlxuICB9O1xuICBASW5wdXQoKSBhbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICBASW5wdXQoKSBvcHRpb25zOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10gPSBbXTtcbiAgQElucHV0KCkgaWQ/OiBudW1iZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIGxlYWRpbmdWaWV3ITogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gIEBJbnB1dCgpIGhlYWRlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgcmVwbHlWaWV3ITogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gIEBJbnB1dCgpIGNvbnRlbnRWaWV3ITogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gIEBJbnB1dCgpIHRocmVhZFZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgQElucHV0KCkgZm9vdGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsO1xuICBASW5wdXQoKSBib3R0b21WaWV3ITogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gIEBJbnB1dCgpIHN0YXR1c0luZm9WaWV3ITogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gIG9wdGlvbnNTdHlsZTogTWVudUxpc3RTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVXaWR0aDogXCIxMDAlXCIsXG4gICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgc3VibWVudUJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgbW9yZUljb25UaW50OiBcImdyZXlcIlxuICB9XG4gIEBJbnB1dCgpIG1vcmVJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9tb3JlaWNvbi5zdmdcIjtcbiAgQElucHV0KCkgdG9wTWVudVNpemU6IG51bWJlciA9IDM7XG4gIHB1YmxpYyB0aGVtZTogQ29tZXRDaGF0VGhlbWUgPSBuZXcgQ29tZXRDaGF0VGhlbWUoe30pXG4gIHB1YmxpYyB1aWtpdENvbnN0YW50OiB0eXBlb2YgTWVzc2FnZUJ1YmJsZUFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQ7XG4gIHB1YmxpYyBpc0hvdmVyaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkgeyB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9wdGlvbnNTdHlsZSA9IG5ldyBNZW51TGlzdFN0eWxlKHtcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgc3VibWVudVdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgc3VibWVudUJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzdWJtZW51QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBtb3JlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KClcbiAgICB9KVxuICB9XG4gIC8qKlxuICAgKiBoaWRlIHNob3cgbWVudSBvcHRpb25zIG9uIGhvdmVyXG4gICAqIEBwYXJhbSAge01vdXNlRXZlbnR9IGV2ZW50P1xuICAgKi9cbiAgaGlkZVNob3dNZW51T3B0aW9uKGV2ZW50PzogTW91c2VFdmVudCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5pc0hvdmVyaW5nID0gZXZlbnQ/LnR5cGUgPT09IFwibW91c2VlbnRlclwiO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0sIDApO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGV2ZW50XG4gICAqL1xuICBvbk9wdGlvbkNsaWNrKGV2ZW50OiBhbnkpIHtcbiAgICBjb25zdCBvbkNsaWNrID0gZXZlbnQ/LmRldGFpbD8uZGF0YT8ub25DbGljaztcbiAgICBpZiAob25DbGljaykge1xuICAgICAgb25DbGljayh0aGlzLmlkLCBldmVudD8uZGV0YWlsPy5ldmVudCk7XG4gICAgfVxuICAgIHRoaXMuaXNIb3ZlcmluZyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICB3cmFwcGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgc3dpdGNoICh0aGlzLmFsaWdubWVudCkge1xuICAgICAgY2FzZSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0OlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcImZsZXgtZW5kXCJcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0OlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcImZsZXgtc3RhcnRcIlxuICAgICAgICB9O1xuICAgICAgY2FzZSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmNlbnRlcjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIlxuICAgICAgICB9O1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIlxuICAgICAgICB9O1xuICAgIH1cbiAgfTtcbiAgYnViYmxlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMubWVzc2FnZUJ1YmJsZVN0eWxlLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgYWxpZ25JdGVtczogXCJmbGV4LXN0YXJ0XCJcbiAgICB9XG4gIH1cbiAgYnViYmxlQWxpZ25tZW50U3R5bGUoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJmbGV4LXN0YXJ0XCIsXG4gICAgICBhbGlnbkl0ZW1zOiB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQgPyBcImZsZXgtc3RhcnRcIiA6IFwiZmxleC1lbmRcIixcbiAgICB9XG4gIH1cbiAgb3B0aW9uc1N0eWxlczogYW55ID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBqdXN0aWZ5Q29udGVudDogdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0ID8gXCJmbGV4LXN0YXJ0XCIgOiBcImZsZXgtZW5kXCIsXG4gICAgICB0b3A6IHRoaXMuaGVhZGVyVmlldyAmJiB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQgPyBcIi04cHhcIiA6IFwiLTI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMub3B0aW9uc1N0eWxlPy5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMub3B0aW9uc1N0eWxlPy5ib3JkZXJSYWRpdXMsXG4gICAgfVxuICB9XG4gIHRpdGxlU3R5bGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdCA/IFwiZmxleC1zdGFydFwiIDogXCJmbGV4LWVuZFwiLFxuICAgICAgYWxpZ25JdGVtczogXCJmbGV4LXN0YXJ0XCJcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWJ1YmJsZV9fd3JhcHBlclwiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWJ1YmJsZV9fY29udGFpbmVyXCJcbiAgICAobW91c2VlbnRlcik9XCJoaWRlU2hvd01lbnVPcHRpb24oJGV2ZW50KVwiXG4gICAgKG1vdXNlbGVhdmUpPVwiaGlkZVNob3dNZW51T3B0aW9uKCRldmVudClcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1idWJibGVfX2F2YXRhclwiICpuZ0lmPVwibGVhZGluZ1ZpZXdcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJsZWFkaW5nVmlld1wiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtYnViYmxlXCIgW25nU3R5bGVdPVwiYnViYmxlQWxpZ25tZW50U3R5bGUoKVwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtYnViYmxlX190aXRsZVwiIFtuZ1N0eWxlXT1cInRpdGxlU3R5bGUoKVwiXG4gICAgICAgICpuZ0lmPVwiaGVhZGVyVmlld1wiPlxuICAgICAgICA8bmctY29udGFpbmVyIFtuZ1RlbXBsYXRlT3V0bGV0XT1cImhlYWRlclZpZXdcIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlb3B0aW9uc1wiXG4gICAgICAgICpuZ0lmPVwib3B0aW9ucyAmJiBvcHRpb25zLmxlbmd0aCA+PSAxICYmIGlzSG92ZXJpbmdcIlxuICAgICAgICBbbmdTdHlsZV09XCJvcHRpb25zU3R5bGVzKClcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW21vcmVJY29uVVJMXT1cIm1vcmVJY29uVVJMXCJcbiAgICAgICAgICBbdG9wTWVudVNpemVdPVwidG9wTWVudVNpemVcIiBbbWVudUxpc3RTdHlsZV09XCJvcHRpb25zU3R5bGVcIlxuICAgICAgICAgIFtkYXRhXT1cIm9wdGlvbnNcIiAoY2MtbWVudS1jbGlja2VkKT1cIm9uT3B0aW9uQ2xpY2soJGV2ZW50KVwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWJ1YmJsZV9fY29udGVudFwiIFtuZ1N0eWxlXT1cImJ1YmJsZVN0eWxlKClcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInJlcGx5Vmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImNvbnRlbnRWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdGF0dXNJbmZvVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiYm90dG9tVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICA8ZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImZvb3RlclZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRocmVhZFZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXX0=