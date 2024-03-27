import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TabAlignment } from '@cometchat/uikit-resources';
import '@cometchat/uikit-elements';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
export class CometChatTabsComponent {
    constructor(ref) {
        this.ref = ref;
        this.tabAlignment = TabAlignment.top;
        this.disableDragging = true;
        this.tabsStyle = { height: "100%", width: "100%" };
        this.tabs = [];
        this.keepAlive = false;
        this.openViewOnCLick = (tabItem) => {
            if (tabItem && tabItem.childView) {
                this.childView = tabItem.childView;
                this.activeTab = tabItem;
                this.ref.detectChanges();
            }
        };
    }
    ngOnInit() {
    }
    ngOnChanges() {
        let index = this.tabs.findIndex((item) => item.isActive === true);
        if (this.tabs.length > 0) {
            this.openViewOnCLick(this.tabs[index && index >= 0 ? index : 0]);
        }
    }
    getButtonStyle(tab) {
        const { style = {} } = tab || {};
        const { id } = this.activeTab || {};
        const active = id === tab?.id;
        var textStyle = tab.iconURL ? {} : {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "7px"
        };
        return {
            background: active ? style.activeBackground : style.background,
            buttonTextFont: active ? style.activeTitleTextFont : style.titleTextFont,
            buttonTextColor: active ? style.activeTitleTextColor : style.titleTextColor,
            buttonIconTint: active ? style.activeIconTint : style.iconTint,
            height: style.height,
            width: style.width,
            border: style.border,
            borderRadius: style.borderRadius,
            gap: "0",
            padding: "0",
            cursor: "pointer",
            ...textStyle
        };
    }
    showTabs(tab) {
        return {
            display: tab.id == this.activeTab.id ? "block" : "none"
        };
    }
    getTabsStyle() {
        const alignment = (() => {
            switch (this.tabAlignment) {
                case TabAlignment.top:
                    return {
                        top: "0",
                        left: "0",
                    };
                default:
                    return {
                        bottom: "0",
                        left: "0",
                    };
            }
        })();
        return {
            background: this.tabsStyle.background,
            border: this.tabsStyle.border,
            borderRadius: this.tabsStyle.borderRadius,
            ...alignment,
            position: this.disableDragging ? "initial" : "absolute"
        };
    }
    getWrapperStyle() {
        return (() => {
            switch (this.tabAlignment) {
                case TabAlignment.top:
                    return {
                        display: "flex",
                        justifyContent: "flex-start",
                        flexDirection: "column"
                    };
                default:
                    return {
                        display: "flex",
                        justifyContent: "flex-start",
                        flexDirection: "column-reverse"
                    };
            }
        })();
    }
    getTabsPlacement() {
        return {
            display: "flex",
            flexDirection: "row"
        };
    }
}
CometChatTabsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatTabsComponent, deps: [{ token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
CometChatTabsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatTabsComponent, selector: "cometchat-tabs", inputs: { tabAlignment: "tabAlignment", disableDragging: "disableDragging", tabsStyle: "tabsStyle", tabs: "tabs", keepAlive: "keepAlive" }, usesOnChanges: true, ngImport: i0, template: " <div class=\"cc-tabs-wrapper\" [ngStyle]=\"getWrapperStyle()\">\n   <div class=\"cc-tabs\" [ngStyle]=\"getTabsStyle()\">\n      <cometchat-draggable [draggableStyle]=\"tabsStyle\" *ngIf=\"!disableDragging; else fixedTabs\">\n         <ng-container *ngTemplateOutlet=\"tabsContainer\">\n         </ng-container>\n      </cometchat-draggable>\n      <ng-template #fixedTabs>\n         <ng-container *ngTemplateOutlet=\"tabsContainer\">\n         </ng-container>\n      </ng-template>\n    </div>\n    <div class=\"cc-child-view\" *ngIf=\"!keepAlive; else aliveTabs\">\n\n\n      <ng-container [ngTemplateOutlet]=\"childView\" >\n\n      </ng-container>\n   </div>\n\n\n</div>\n<ng-template #previousChild>\n   <ng-container [ngTemplateOutlet]=\"previousTab.childView\" >\n\n   </ng-container>\n</ng-template>\n<ng-template #tabsContainer>\n   <div class=\"cc__tab-item\" [ngStyle]=\"getTabsPlacement()\">\n      <cometchat-icon-button [alignment]=\"'column'\" *ngFor=\"let tab of tabs\" [iconURL]=\"tab.iconURL\" [text]=\"tab.title\" [buttonStyle]=\"getButtonStyle(tab)\" (cc-button-clicked)=\"openViewOnCLick(tab)\"></cometchat-icon-button>\n   </div>\n\n</ng-template>\n\n<ng-template #aliveTabs>\n   <div class=\"cc-child-view\" >\n      <div [ngStyle]=\"showTabs(tab)\" class=\"cc-child-container\" *ngFor=\"let tab of tabs\">\n        <ng-container [ngTemplateOutlet]=\"tab.childView\" >\n\n        </ng-container>\n      </div>\n\n        </div>\n</ng-template>", styles: [".cc-tabs-wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:flex-start}.cc-child-view{height:100%;width:100%;overflow:hidden}.cc-tabs{height:-moz-fit-content;height:fit-content;margin:8px 0 12px}.cc__tab-item{display:flex;height:100%;width:100%}cometchat-icon-button{height:inherit;width:inherit}.cc-child-container{height:100%;width:100%;display:none}\n"], directives: [{ type: i1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatTabsComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cometchat-tabs', changeDetection: ChangeDetectionStrategy.OnPush, template: " <div class=\"cc-tabs-wrapper\" [ngStyle]=\"getWrapperStyle()\">\n   <div class=\"cc-tabs\" [ngStyle]=\"getTabsStyle()\">\n      <cometchat-draggable [draggableStyle]=\"tabsStyle\" *ngIf=\"!disableDragging; else fixedTabs\">\n         <ng-container *ngTemplateOutlet=\"tabsContainer\">\n         </ng-container>\n      </cometchat-draggable>\n      <ng-template #fixedTabs>\n         <ng-container *ngTemplateOutlet=\"tabsContainer\">\n         </ng-container>\n      </ng-template>\n    </div>\n    <div class=\"cc-child-view\" *ngIf=\"!keepAlive; else aliveTabs\">\n\n\n      <ng-container [ngTemplateOutlet]=\"childView\" >\n\n      </ng-container>\n   </div>\n\n\n</div>\n<ng-template #previousChild>\n   <ng-container [ngTemplateOutlet]=\"previousTab.childView\" >\n\n   </ng-container>\n</ng-template>\n<ng-template #tabsContainer>\n   <div class=\"cc__tab-item\" [ngStyle]=\"getTabsPlacement()\">\n      <cometchat-icon-button [alignment]=\"'column'\" *ngFor=\"let tab of tabs\" [iconURL]=\"tab.iconURL\" [text]=\"tab.title\" [buttonStyle]=\"getButtonStyle(tab)\" (cc-button-clicked)=\"openViewOnCLick(tab)\"></cometchat-icon-button>\n   </div>\n\n</ng-template>\n\n<ng-template #aliveTabs>\n   <div class=\"cc-child-view\" >\n      <div [ngStyle]=\"showTabs(tab)\" class=\"cc-child-container\" *ngFor=\"let tab of tabs\">\n        <ng-container [ngTemplateOutlet]=\"tab.childView\" >\n\n        </ng-container>\n      </div>\n\n        </div>\n</ng-template>", styles: [".cc-tabs-wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:flex-start}.cc-child-view{height:100%;width:100%;overflow:hidden}.cc-tabs{height:-moz-fit-content;height:fit-content;margin:8px 0 12px}.cc__tab-item{display:flex;height:100%;width:100%}cometchat-icon-button{height:inherit;width:inherit}.cc-child-container{height:100%;width:100%;display:none}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }]; }, propDecorators: { tabAlignment: [{
                type: Input
            }], disableDragging: [{
                type: Input
            }], tabsStyle: [{
                type: Input
            }], tabs: [{
                type: Input
            }], keepAlive: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXRhYnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9TaGFyZWQvVmlld3MvQ29tZXRDaGF0VGFicy9jb21ldGNoYXQtdGFicy9jb21ldGNoYXQtdGFicy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL1NoYXJlZC9WaWV3cy9Db21ldENoYXRUYWJzL2NvbWV0Y2hhdC10YWJzL2NvbWV0Y2hhdC10YWJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUE2Qyx1QkFBdUIsRUFBZ0IsTUFBTSxlQUFlLENBQUM7QUFDM0ksT0FBTyxFQUFvQixZQUFZLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUU1RSxPQUFPLDJCQUEyQixDQUFBOzs7QUFRbEMsTUFBTSxPQUFPLHNCQUFzQjtJQVNqQyxZQUFvQixHQUFxQjtRQUFyQixRQUFHLEdBQUgsR0FBRyxDQUFrQjtRQVJoQyxpQkFBWSxHQUFnQixZQUFZLENBQUMsR0FBRyxDQUFDO1FBQzdDLG9CQUFlLEdBQVcsSUFBSSxDQUFBO1FBQzdCLGNBQVMsR0FBYSxFQUFDLE1BQU0sRUFBQyxNQUFNLEVBQUMsS0FBSyxFQUFDLE1BQU0sRUFBQyxDQUFBO1FBQ25ELFNBQUksR0FBc0IsRUFBRSxDQUFDO1FBQzdCLGNBQVMsR0FBVyxLQUFLLENBQUM7UUFLbkMsb0JBQWUsR0FBRyxDQUFDLE9BQXdCLEVBQUMsRUFBRTtZQUM1QyxJQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFDO2dCQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFB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QUNwQyxNQUFNLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNO1lBQzVCLFlBQVksRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVk7WUFDdkMsR0FBRyxTQUFTO1lBQ1osUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVTtTQUN4RCxDQUFDO0lBQ0osQ0FBQztJQUNELGVBQWU7UUFDYixPQUFXLENBQUMsR0FBRyxFQUFFO1lBQ2YsUUFBUSxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUN6QixLQUFLLFlBQVksQ0FBQyxHQUFHO29CQUNuQixPQUFPO3dCQUNOLE9BQU8sRUFBQyxNQUFNO3dCQUNkLGNBQWMsRUFBQyxZQUFZO3dCQUMzQixhQUFhLEVBQUMsUUFBUTtxQkFDdEIsQ0FBQztnQkFDSjtvQkFDRSxPQUFPO3dCQUNMLE9BQU8sRUFBQyxNQUFNO3dCQUNkLGNBQWMsRUFBQyxZQUFZO3dCQUMzQixhQUFhLEVBQUMsZ0JBQWdCO3FCQUM5QixDQUFDO2FBQ047UUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1AsQ0FBQztJQUNELGdCQUFnQjtRQUNkLE9BQU87WUFDTCxPQUFPLEVBQUMsTUFBTTtZQUNkLGFBQWEsRUFBRSxLQUFLO1NBQ3JCLENBQUE7SUFDSCxDQUFDOztvSEE3R1Usc0JBQXNCO3dHQUF0QixzQkFBc0IsdU5DWG5DLDQ3Q0EwQ2M7NEZEL0JELHNCQUFzQjtrQkFObEMsU0FBUzsrQkFDRSxnQkFBZ0IsbUJBR1QsdUJBQXVCLENBQUMsTUFBTTt3R0FHdEMsWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgSW5wdXQsIFRlbXBsYXRlUmVmLCBWaWV3Q2hpbGQsIENoYW5nZURldGVjdG9yUmVmLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgQ29udGVudENoaWxkIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21ldENoYXRUYWJJdGVtLCBUYWJBbGlnbm1lbnQgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcyc7XG5pbXBvcnQgeyBCYXNlU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCc7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2NvbWV0Y2hhdC10YWJzJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2NvbWV0Y2hhdC10YWJzLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vY29tZXRjaGF0LXRhYnMuY29tcG9uZW50LnNjc3MnXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdFRhYnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB0YWJBbGlnbm1lbnQ6VGFiQWxpZ25tZW50ID0gVGFiQWxpZ25tZW50LnRvcDtcbiAgQElucHV0KCkgZGlzYWJsZURyYWdnaW5nOmJvb2xlYW4gPSB0cnVlXG4gIEBJbnB1dCgpICB0YWJzU3R5bGU6QmFzZVN0eWxlID0ge2hlaWdodDpcIjEwMCVcIix3aWR0aDpcIjEwMCVcIn1cbiAgQElucHV0KCkgdGFiczpDb21ldENoYXRUYWJJdGVtW10gPSBbXTtcbiAgQElucHV0KCkga2VlcEFsaXZlOmJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGFjdGl2ZVRhYiE6Q29tZXRDaGF0VGFiSXRlbTtcbiAgcHVibGljIHByZXZpb3VzVGFiITpDb21ldENoYXRUYWJJdGVtXG4gIHB1YmxpYyBjaGlsZFZpZXchOlRlbXBsYXRlUmVmPGFueT4gfCBudWxsO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjpDaGFuZ2VEZXRlY3RvclJlZil7fVxuICBvcGVuVmlld09uQ0xpY2sgPSAodGFiSXRlbTpDb21ldENoYXRUYWJJdGVtKT0+e1xuICAgIGlmKHRhYkl0ZW0gJiYgdGFiSXRlbS5jaGlsZFZpZXcpe1xuICAgICAgdGhpcy5jaGlsZFZpZXcgPSB0YWJJdGVtLmNoaWxkVmlldztcbiAgICAgIHRoaXMuYWN0aXZlVGFiID0gdGFiSXRlbVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgfVxuXG5cbiAgfVxuXG5cblxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuXG4gIH1cblxuICBuZ09uQ2hhbmdlcygpe1xuICAgIGxldCBpbmRleCA9IHRoaXMudGFicy5maW5kSW5kZXgoKGl0ZW06IENvbWV0Q2hhdFRhYkl0ZW0pID0+IGl0ZW0uaXNBY3RpdmUgPT09IHRydWUpXG4gICAgaWYodGhpcy50YWJzLmxlbmd0aCA+IDApe1xuICAgICAgdGhpcy5vcGVuVmlld09uQ0xpY2sodGhpcy50YWJzWyBpbmRleCAmJiBpbmRleCA+PSAwID8gaW5kZXggOiAwXSlcbiAgICB9XG4gIH1cbiAgIGdldEJ1dHRvblN0eWxlKHRhYjogQ29tZXRDaGF0VGFiSXRlbSkge1xuICAgIGNvbnN0IHsgc3R5bGUgPSB7fSB9ID0gdGFiIHx8IHt9O1xuICAgIGNvbnN0IHsgaWQgfSA9IHRoaXMuYWN0aXZlVGFiIHx8IHt9O1xuICAgIGNvbnN0IGFjdGl2ZSA9IGlkID09PSB0YWI/LmlkO1xuICAgIHZhciB0ZXh0U3R5bGUgPSB0YWIuaWNvblVSTCA/IHt9IDoge1xuICAgICAgZGlzcGxheTpcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OlwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOlwiY2VudGVyXCIsXG4gICAgICBwYWRkaW5nOlwiN3B4XCJcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGJhY2tncm91bmQ6IGFjdGl2ZSA/IHN0eWxlLmFjdGl2ZUJhY2tncm91bmQgIDogc3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJ1dHRvblRleHRGb250OiBhY3RpdmUgPyBzdHlsZS5hY3RpdmVUaXRsZVRleHRGb250ICA6IHN0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IGFjdGl2ZSA/IHN0eWxlLmFjdGl2ZVRpdGxlVGV4dENvbG9yICA6IHN0eWxlLnRpdGxlVGV4dENvbG9yLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IGFjdGl2ZSA/IHN0eWxlLmFjdGl2ZUljb25UaW50ICA6IHN0eWxlLmljb25UaW50LFxuICAgICAgaGVpZ2h0OiBzdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogc3R5bGUud2lkdGgsXG4gICAgICBib3JkZXI6IHN0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogc3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgICAgZ2FwOiBcIjBcIixcbiAgICAgIHBhZGRpbmc6IFwiMFwiLFxuICAgICAgY3Vyc29yOlwicG9pbnRlclwiLFxuICAgICAgLi4udGV4dFN0eWxlXG4gICAgfTtcbiAgfVxuICBzaG93VGFicyh0YWI6Q29tZXRDaGF0VGFiSXRlbSl7XG5yZXR1cm4ge1xuICBkaXNwbGF5OiB0YWIuaWQgPT0gdGhpcy5hY3RpdmVUYWIuaWQgPyBcImJsb2NrXCIgOiBcIm5vbmVcIlxufVxuICB9XG4gICBnZXRUYWJzU3R5bGUoKSB7XG4gICAgY29uc3QgYWxpZ25tZW50ID0gKCgpID0+IHtcbiAgICAgIHN3aXRjaCAodGhpcy50YWJBbGlnbm1lbnQpIHtcbiAgICAgICAgY2FzZSBUYWJBbGlnbm1lbnQudG9wOlxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IFwiMFwiLFxuICAgICAgICAgICAgbGVmdDogXCIwXCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYm90dG9tOiBcIjBcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgICAgIH07XG4gICAgICB9XG4gICAgfSkoKTtcbiAgICByZXR1cm4ge1xuICAgICBiYWNrZ3JvdW5kOnRoaXMudGFic1N0eWxlLmJhY2tncm91bmQsXG4gICAgIGJvcmRlcjp0aGlzLnRhYnNTdHlsZS5ib3JkZXIsXG4gICAgIGJvcmRlclJhZGl1czp0aGlzLnRhYnNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICAuLi5hbGlnbm1lbnQsXG4gICAgICBwb3NpdGlvbjogdGhpcy5kaXNhYmxlRHJhZ2dpbmcgPyBcImluaXRpYWxcIiA6IFwiYWJzb2x1dGVcIlxuICAgIH07XG4gIH1cbiAgZ2V0V3JhcHBlclN0eWxlKCl7XG4gICAgcmV0dXJuICAgICAoKCkgPT4ge1xuICAgICAgc3dpdGNoICh0aGlzLnRhYkFsaWdubWVudCkge1xuICAgICAgICBjYXNlIFRhYkFsaWdubWVudC50b3A6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgZGlzcGxheTpcImZsZXhcIixcbiAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6XCJmbGV4LXN0YXJ0XCIsXG4gICAgICAgICAgIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIlxuICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRpc3BsYXk6XCJmbGV4XCIsXG4gICAgICAgICAgICBqdXN0aWZ5Q29udGVudDpcImZsZXgtc3RhcnRcIixcbiAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246XCJjb2x1bW4tcmV2ZXJzZVwiXG4gICAgICAgICAgIH07XG4gICAgICB9XG4gICAgfSkoKTtcbiAgfVxuICBnZXRUYWJzUGxhY2VtZW50KCl7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc3BsYXk6XCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcInJvd1wiXG4gICAgfVxuICB9XG59XG4iLCIgPGRpdiBjbGFzcz1cImNjLXRhYnMtd3JhcHBlclwiIFtuZ1N0eWxlXT1cImdldFdyYXBwZXJTdHlsZSgpXCI+XG4gICA8ZGl2IGNsYXNzPVwiY2MtdGFic1wiIFtuZ1N0eWxlXT1cImdldFRhYnNTdHlsZSgpXCI+XG4gICAgICA8Y29tZXRjaGF0LWRyYWdnYWJsZSBbZHJhZ2dhYmxlU3R5bGVdPVwidGFic1N0eWxlXCIgKm5nSWY9XCIhZGlzYWJsZURyYWdnaW5nOyBlbHNlIGZpeGVkVGFic1wiPlxuICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhYnNDb250YWluZXJcIj5cbiAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9jb21ldGNoYXQtZHJhZ2dhYmxlPlxuICAgICAgPG5nLXRlbXBsYXRlICNmaXhlZFRhYnM+XG4gICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGFic0NvbnRhaW5lclwiPlxuICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1jaGlsZC12aWV3XCIgKm5nSWY9XCIha2VlcEFsaXZlOyBlbHNlIGFsaXZlVGFic1wiPlxuXG5cbiAgICAgIDxuZy1jb250YWluZXIgW25nVGVtcGxhdGVPdXRsZXRdPVwiY2hpbGRWaWV3XCIgPlxuXG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgIDwvZGl2PlxuXG5cbjwvZGl2PlxuPG5nLXRlbXBsYXRlICNwcmV2aW91c0NoaWxkPlxuICAgPG5nLWNvbnRhaW5lciBbbmdUZW1wbGF0ZU91dGxldF09XCJwcmV2aW91c1RhYi5jaGlsZFZpZXdcIiA+XG5cbiAgIDwvbmctY29udGFpbmVyPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjdGFic0NvbnRhaW5lcj5cbiAgIDxkaXYgY2xhc3M9XCJjY19fdGFiLWl0ZW1cIiBbbmdTdHlsZV09XCJnZXRUYWJzUGxhY2VtZW50KClcIj5cbiAgICAgIDxjb21ldGNoYXQtaWNvbi1idXR0b24gW2FsaWdubWVudF09XCInY29sdW1uJ1wiICpuZ0Zvcj1cImxldCB0YWIgb2YgdGFic1wiIFtpY29uVVJMXT1cInRhYi5pY29uVVJMXCIgW3RleHRdPVwidGFiLnRpdGxlXCIgW2J1dHRvblN0eWxlXT1cImdldEJ1dHRvblN0eWxlKHRhYilcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib3BlblZpZXdPbkNMaWNrKHRhYilcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgIDwvZGl2PlxuXG48L25nLXRlbXBsYXRlPlxuXG48bmctdGVtcGxhdGUgI2FsaXZlVGFicz5cbiAgIDxkaXYgY2xhc3M9XCJjYy1jaGlsZC12aWV3XCIgPlxuICAgICAgPGRpdiBbbmdTdHlsZV09XCJzaG93VGFicyh0YWIpXCIgY2xhc3M9XCJjYy1jaGlsZC1jb250YWluZXJcIiAqbmdGb3I9XCJsZXQgdGFiIG9mIHRhYnNcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciBbbmdUZW1wbGF0ZU91dGxldF09XCJ0YWIuY2hpbGRWaWV3XCIgPlxuXG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG5cbiAgICAgICAgPC9kaXY+XG48L25nLXRlbXBsYXRlPiJdfQ==