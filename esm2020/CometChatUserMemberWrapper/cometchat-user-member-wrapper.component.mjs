import { Component, Input } from '@angular/core';
import { ListItemStyle } from '@cometchat/uikit-elements';
import { UserMemberListType } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
import * as i1 from "../CometChatTheme.service";
import * as i2 from "../CometChatUsers/cometchat-users/cometchat-users.component";
import * as i3 from "../CometChatGroupMembers/cometchat-group-members/cometchat-group-members.component";
import * as i4 from "@angular/common";
export class CometChatUserMemberWrapperComponent {
    constructor(themeService) {
        this.themeService = themeService;
        this.userMemberListTypeEnum = UserMemberListType;
        this.listItemStyle = new ListItemStyle({
            height: 'fit-content'
        });
        this.getUsersStyle = () => {
            return {
                border: '1px solid ' + this.themeService.theme.palette.getAccent300(),
                background: this.themeService.theme.palette.getBackground(),
                borderRadius: '12px 12px 12px 12px'
            };
        };
        this.getGroupMemebersStyle = () => {
            return {
                border: '1px solid ' + this.themeService.theme.palette.getAccent300(),
                padding: "0px",
                background: this.themeService.theme.palette.getBackground(),
                borderRadius: '12px 12px 12px 12px',
            };
        };
    }
}
CometChatUserMemberWrapperComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUserMemberWrapperComponent, deps: [{ token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatUserMemberWrapperComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatUserMemberWrapperComponent, selector: "cometchat-user-member-wrapper", inputs: { userMemberListType: "userMemberListType", onItemClick: "onItemClick", listItemView: "listItemView", avatarStyle: "avatarStyle", statusIndicatorStyle: "statusIndicatorStyle", searchKeyword: "searchKeyword", group: "group", subtitleView: "subtitleView", usersRequestBuilder: "usersRequestBuilder", disableUsersPresence: "disableUsersPresence", userPresencePlacement: "userPresencePlacement", hideSeperator: "hideSeperator", loadingStateView: "loadingStateView", onEmpty: "onEmpty", onError: "onError", groupMemberRequestBuilder: "groupMemberRequestBuilder", loadingIconUrl: "loadingIconUrl", disableLoadingState: "disableLoadingState" }, ngImport: i0, template: "<div class=\"cc__wrapper\">\n  <cometchat-users *ngIf=\"userMemberListType == userMemberListTypeEnum.users\" [title]=\"''\" [hideSearch]=true\n  [hideSeparator]=hideSeperator [showSectionHeader]=false [onItemClick]=\"onItemClick\" [avatarStyle]=\"avatarStyle\"\n  [statusIndicatorStyle]=\"statusIndicatorStyle\" [searchKeyword]=\"searchKeyword\" [listItemView]=\"listItemView\"\n  [usersRequestBuilder]=\"usersRequestBuilder\" [subtitleView]=\"subtitleView\" [loadingStateView]=\"loadingStateView\"\n  [onEmpty]=\"onEmpty\" [loadingIconURL]=\"loadingIconUrl\" [userPresencePlacement]=\"userPresencePlacement\"\n  [disableLoadingState]=\"disableLoadingState\" [onError]=\"onError\" [listItemStyle]=\"listItemStyle\" [usersStyle]=\"getUsersStyle()\">\n\n</cometchat-users>\n\n<cometchat-group-members *ngIf=\"userMemberListType == userMemberListTypeEnum.groupmembers\" [group]=\"group\" [title]=\"''\"\n  [hideSearch]=true [showBackButton]=hideSeperator [hideSeparator]=false\n  [groupMemberRequestBuilder]=\"groupMemberRequestBuilder\" [onItemClick]=\"onItemClick\" [avatarStyle]=\"avatarStyle\"\n  [statusIndicatorStyle]=\"statusIndicatorStyle\" [listItemView]=\"listItemView\" [subtitleView]=\"subtitleView\"\n  [options]=null [tailView]=emptyTailView [closeButtonIconURL]=undefined [searchKeyword]=\"searchKeyword\"\n  [onEmpty]=\"onEmpty\" [userPresencePlacement]=\"userPresencePlacement\"\n  [disableLoadingState]=\"disableLoadingState\" [onError]=\"onError\" [listItemStyle]=\"listItemStyle\" [groupMembersStyle]=\"getGroupMemebersStyle()\">\n</cometchat-group-members>\n\n<ng-template #emptyTailView></ng-template>\n</div>", styles: ["*{height:100%;width:100%;margin:0;padding:0}.cc__wrapper{height:100%;width:100%;overflow:hidden}\n"], components: [{ type: i2.CometChatUsersComponent, selector: "cometchat-users", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "disableUsersPresence", "listItemView", "menu", "options", "activeUser", "hideSeparator", "searchPlaceholder", "hideError", "selectionMode", "searchIconURL", "hideSearch", "title", "onError", "emptyStateView", "onSelect", "errorStateView", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "usersStyle", "listItemStyle", "statusIndicatorStyle", "avatarStyle", "onItemClick", "searchKeyword", "onEmpty", "userPresencePlacement", "disableLoadingState"] }, { type: i3.CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "tailView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "backdropStyle", "onBack", "onClose", "onSelect", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "dropdownIconURL", "statusIndicatorStyle", "avatarStyle", "groupMembersStyle", "groupScopeStyle", "listItemStyle", "onItemClick", "onEmpty", "userPresencePlacement", "disableLoadingState", "searchKeyword"] }], directives: [{ type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatUserMemberWrapperComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cometchat-user-member-wrapper', template: "<div class=\"cc__wrapper\">\n  <cometchat-users *ngIf=\"userMemberListType == userMemberListTypeEnum.users\" [title]=\"''\" [hideSearch]=true\n  [hideSeparator]=hideSeperator [showSectionHeader]=false [onItemClick]=\"onItemClick\" [avatarStyle]=\"avatarStyle\"\n  [statusIndicatorStyle]=\"statusIndicatorStyle\" [searchKeyword]=\"searchKeyword\" [listItemView]=\"listItemView\"\n  [usersRequestBuilder]=\"usersRequestBuilder\" [subtitleView]=\"subtitleView\" [loadingStateView]=\"loadingStateView\"\n  [onEmpty]=\"onEmpty\" [loadingIconURL]=\"loadingIconUrl\" [userPresencePlacement]=\"userPresencePlacement\"\n  [disableLoadingState]=\"disableLoadingState\" [onError]=\"onError\" [listItemStyle]=\"listItemStyle\" [usersStyle]=\"getUsersStyle()\">\n\n</cometchat-users>\n\n<cometchat-group-members *ngIf=\"userMemberListType == userMemberListTypeEnum.groupmembers\" [group]=\"group\" [title]=\"''\"\n  [hideSearch]=true [showBackButton]=hideSeperator [hideSeparator]=false\n  [groupMemberRequestBuilder]=\"groupMemberRequestBuilder\" [onItemClick]=\"onItemClick\" [avatarStyle]=\"avatarStyle\"\n  [statusIndicatorStyle]=\"statusIndicatorStyle\" [listItemView]=\"listItemView\" [subtitleView]=\"subtitleView\"\n  [options]=null [tailView]=emptyTailView [closeButtonIconURL]=undefined [searchKeyword]=\"searchKeyword\"\n  [onEmpty]=\"onEmpty\" [userPresencePlacement]=\"userPresencePlacement\"\n  [disableLoadingState]=\"disableLoadingState\" [onError]=\"onError\" [listItemStyle]=\"listItemStyle\" [groupMembersStyle]=\"getGroupMemebersStyle()\">\n</cometchat-group-members>\n\n<ng-template #emptyTailView></ng-template>\n</div>", styles: ["*{height:100%;width:100%;margin:0;padding:0}.cc__wrapper{height:100%;width:100%;overflow:hidden}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CometChatThemeService }]; }, propDecorators: { userMemberListType: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], searchKeyword: [{
                type: Input
            }], group: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], usersRequestBuilder: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], userPresencePlacement: [{
                type: Input
            }], hideSeperator: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], onEmpty: [{
                type: Input
            }], onError: [{
                type: Input
            }], groupMemberRequestBuilder: [{
                type: Input
            }], loadingIconUrl: [{
                type: Input
            }], disableLoadingState: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRVc2VyTWVtYmVyV3JhcHBlci9jb21ldGNoYXQtdXNlci1tZW1iZXItd3JhcHBlci5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFVzZXJNZW1iZXJXcmFwcGVyL2NvbWV0Y2hhdC11c2VyLW1lbWJlci13cmFwcGVyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBcUIsU0FBUyxFQUFFLEtBQUssRUFBeUIsTUFBTSxlQUFlLENBQUM7QUFDM0YsT0FBTyxFQUFlLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxrQkFBa0IsRUFBeUIsTUFBTSw0QkFBNEIsQ0FBQzs7Ozs7O0FBWXZGLE1BQU0sT0FBTyxtQ0FBbUM7SUFxQjlDLFlBQ1UsWUFBbUM7UUFBbkMsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBSHRDLDJCQUFzQixHQUFJLGtCQUFrQixDQUFDO1FBTzdDLGtCQUFhLEdBQUcsSUFBSSxhQUFhLENBQUM7WUFDdkMsTUFBTSxFQUFFLGFBQWE7U0FDdEIsQ0FBQyxDQUFBO1FBRUQsa0JBQWEsR0FBRyxHQUFHLEVBQUU7WUFDcEIsT0FBTTtnQkFDSixNQUFNLEVBQUUsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQ3JFLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO2dCQUMzRCxZQUFZLEVBQUUscUJBQXFCO2FBQ3BDLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRCwwQkFBcUIsR0FBRyxHQUFHLEVBQUU7WUFDNUIsT0FBTztnQkFDTCxNQUFNLEVBQUUsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQ3JFLE9BQU8sRUFBRSxLQUFLO2dCQUNkLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO2dCQUMzRCxZQUFZLEVBQUUscUJBQXFCO2FBQ3BDLENBQUM7UUFDSixDQUFDLENBQUM7SUF0QkUsQ0FBQzs7aUlBdkJNLG1DQUFtQztxSEFBbkMsbUNBQW1DLDJzQkNkaEQsOGxEQW9CTTs0RkROTyxtQ0FBbUM7a0JBUC9DLFNBQVM7K0JBQ0UsK0JBQStCOzRHQU9oQyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyx5QkFBeUI7c0JBQWpDLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0LCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgTGlzdEl0ZW1TdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnO1xuaW1wb3J0IHsgVXNlck1lbWJlckxpc3RUeXBlLCBVc2VyUHJlc2VuY2VQbGFjZW1lbnQgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcyc7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tICcuLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlJztcblxuXG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2NvbWV0Y2hhdC11c2VyLW1lbWJlci13cmFwcGVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2NvbWV0Y2hhdC11c2VyLW1lbWJlci13cmFwcGVyLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXIuY29tcG9uZW50LnNjc3MnXVxufSlcblxuXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0VXNlck1lbWJlcldyYXBwZXJDb21wb25lbnQge1xuICBASW5wdXQoKSB1c2VyTWVtYmVyTGlzdFR5cGUhOiBVc2VyTWVtYmVyTGlzdFR5cGU7XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKHVzZXJNZW1iZXI6IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSA9PiB2b2lkO1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXc6IGFueTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGUhOiBBdmF0YXJTdHlsZTtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IGFueTtcbiAgQElucHV0KCkgc2VhcmNoS2V5d29yZCE6IHN0cmluZztcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldz86IGFueTtcbiAgQElucHV0KCkgdXNlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZSE6IGJvb2xlYW47XG4gIEBJbnB1dCgpIHVzZXJQcmVzZW5jZVBsYWNlbWVudCE6IFVzZXJQcmVzZW5jZVBsYWNlbWVudDtcbiAgQElucHV0KCkgaGlkZVNlcGVyYXRvciE6IGJvb2xlYW47XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXc6IGFueTtcbiAgQElucHV0KCkgb25FbXB0eT86ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I/OiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVXJsISA6IHN0cmluZztcbiAgQElucHV0KCkgZGlzYWJsZUxvYWRpbmdTdGF0ZSE6IGJvb2xlYW47XG4gIHB1YmxpYyB1c2VyTWVtYmVyTGlzdFR5cGVFbnVtID0gIFVzZXJNZW1iZXJMaXN0VHlwZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkgeyB9XG5cblxuICBwdWJsaWMgbGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICBoZWlnaHQ6ICdmaXQtY29udGVudCdcbiAgfSlcblxuICAgZ2V0VXNlcnNTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm57XG4gICAgICBib3JkZXI6ICcxcHggc29saWQgJyArIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MzAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogJzEycHggMTJweCAxMnB4IDEycHgnXG4gICAgfTtcbiAgfTtcblxuICAgZ2V0R3JvdXBNZW1lYmVyc1N0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBib3JkZXI6ICcxcHggc29saWQgJyArIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MzAwKCksXG4gICAgICBwYWRkaW5nOiBcIjBweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMnB4IDEycHggMTJweCAxMnB4JyxcbiAgICB9O1xuICB9O1xuXG59XG4iLCI8ZGl2IGNsYXNzPVwiY2NfX3dyYXBwZXJcIj5cbiAgPGNvbWV0Y2hhdC11c2VycyAqbmdJZj1cInVzZXJNZW1iZXJMaXN0VHlwZSA9PSB1c2VyTWVtYmVyTGlzdFR5cGVFbnVtLnVzZXJzXCIgW3RpdGxlXT1cIicnXCIgW2hpZGVTZWFyY2hdPXRydWVcbiAgW2hpZGVTZXBhcmF0b3JdPWhpZGVTZXBlcmF0b3IgW3Nob3dTZWN0aW9uSGVhZGVyXT1mYWxzZSBbb25JdGVtQ2xpY2tdPVwib25JdGVtQ2xpY2tcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIiBbc2VhcmNoS2V5d29yZF09XCJzZWFyY2hLZXl3b3JkXCIgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXdcIlxuICBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJ1c2Vyc1JlcXVlc3RCdWlsZGVyXCIgW3N1YnRpdGxlVmlld109XCJzdWJ0aXRsZVZpZXdcIiBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCJcbiAgW29uRW1wdHldPVwib25FbXB0eVwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVybFwiIFt1c2VyUHJlc2VuY2VQbGFjZW1lbnRdPVwidXNlclByZXNlbmNlUGxhY2VtZW50XCJcbiAgW2Rpc2FibGVMb2FkaW5nU3RhdGVdPVwiZGlzYWJsZUxvYWRpbmdTdGF0ZVwiIFtvbkVycm9yXT1cIm9uRXJyb3JcIiBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCIgW3VzZXJzU3R5bGVdPVwiZ2V0VXNlcnNTdHlsZSgpXCI+XG5cbjwvY29tZXRjaGF0LXVzZXJzPlxuXG48Y29tZXRjaGF0LWdyb3VwLW1lbWJlcnMgKm5nSWY9XCJ1c2VyTWVtYmVyTGlzdFR5cGUgPT0gdXNlck1lbWJlckxpc3RUeXBlRW51bS5ncm91cG1lbWJlcnNcIiBbZ3JvdXBdPVwiZ3JvdXBcIiBbdGl0bGVdPVwiJydcIlxuICBbaGlkZVNlYXJjaF09dHJ1ZSBbc2hvd0JhY2tCdXR0b25dPWhpZGVTZXBlcmF0b3IgW2hpZGVTZXBhcmF0b3JdPWZhbHNlXG4gIFtncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXJcIiBbb25JdGVtQ2xpY2tdPVwib25JdGVtQ2xpY2tcIiBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIiBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlld1wiIFtzdWJ0aXRsZVZpZXddPVwic3VidGl0bGVWaWV3XCJcbiAgW29wdGlvbnNdPW51bGwgW3RhaWxWaWV3XT1lbXB0eVRhaWxWaWV3IFtjbG9zZUJ1dHRvbkljb25VUkxdPXVuZGVmaW5lZCBbc2VhcmNoS2V5d29yZF09XCJzZWFyY2hLZXl3b3JkXCJcbiAgW29uRW1wdHldPVwib25FbXB0eVwiIFt1c2VyUHJlc2VuY2VQbGFjZW1lbnRdPVwidXNlclByZXNlbmNlUGxhY2VtZW50XCJcbiAgW2Rpc2FibGVMb2FkaW5nU3RhdGVdPVwiZGlzYWJsZUxvYWRpbmdTdGF0ZVwiIFtvbkVycm9yXT1cIm9uRXJyb3JcIiBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCIgW2dyb3VwTWVtYmVyc1N0eWxlXT1cImdldEdyb3VwTWVtZWJlcnNTdHlsZSgpXCI+XG48L2NvbWV0Y2hhdC1ncm91cC1tZW1iZXJzPlxuXG48bmctdGVtcGxhdGUgI2VtcHR5VGFpbFZpZXc+PC9uZy10ZW1wbGF0ZT5cbjwvZGl2PiJdfQ==