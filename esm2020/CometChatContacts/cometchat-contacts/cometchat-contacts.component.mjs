import { Component, Input, ChangeDetectionStrategy, ViewChild } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { GroupsConfiguration, UsersConfiguration, TabItemStyle, ContactsStyle } from '@cometchat/uikit-shared';
import '@cometchat/uikit-elements';
import { fontHelper, localize, TabsVisibility, SelectionMode } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../Shared/Views/CometChatTabs/cometchat-tabs/cometchat-tabs.component";
import * as i3 from "../../CometChatUsers/cometchat-users/cometchat-users.component";
import * as i4 from "../../CometChatGroups/cometchat-groups/cometchat-groups.component";
import * as i5 from "@angular/common";
/**
*
* CometChatContactsComponent is used to render group members to add
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatContactsComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.title = localize("NEW_CHAT");
        this.usersTabTitle = localize("USERS");
        this.groupsTabTitle = localize("GROUPS");
        this.usersConfiguration = new UsersConfiguration({});
        this.groupsConfiguration = new GroupsConfiguration({});
        this.closeIconURL = "assets/close2x.svg";
        this.contactsStyle = {};
        this.selectionMode = SelectionMode.single;
        this.tabVisibility = TabsVisibility.usersAndGroups;
        this.selectionLimit = 5;
        this.tabs = [];
        this.hideSubmitButton = true;
        this.submitButtonText = "Submit";
        // public properties
        this.usersRequestBuilder = new CometChat.UsersRequestBuilder().setLimit(30).hideBlockedUsers(true);
        this.usersSearchRequestBuilder = new CometChat.UsersRequestBuilder().setLimit(30).hideBlockedUsers(true);
        this.groupsRequestBuilder = new CometChat.GroupsRequestBuilder().setLimit(30).joinedOnly(true);
        this.groupsSearchRequestBuilder = new CometChat.GroupsRequestBuilder().setLimit(30).joinedOnly(true);
        this.tabItemStyle = {};
        this.usersList = [];
        this.groupsList = [];
        this.submitButtonStyle = {
            height: "100%",
            width: "100%",
            background: "rgb(51, 153, 255)",
            padding: "8px",
            buttonTextColor: "white",
            buttonTextFont: "",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "none",
            borderRadius: "8px"
        };
        this.titleStyle = {};
        this.errorStyle = {};
        this.isLimitReached = false;
        this.tabsStyle = {};
        this.onGroupSelected = (group) => {
            var key = this.groupsList.findIndex((m) => m?.getGuid() === group.getGuid());
            if (key >= 0) {
                this.groupsList.splice(key, 1);
            }
            else {
                this.groupsList.push(group);
            }
            this.isLimitReached = this.groupsList.length + this.usersList.length >= this.selectionLimit;
            this.ref.detectChanges();
        };
        this.onUserSelected = (user) => {
            const key = this.usersList.findIndex((m) => m?.getUid() === user.getUid());
            if (key >= 0) {
                this.usersList.splice(key, 1);
            }
            else {
                this.usersList.push(user);
            }
            this.isLimitReached = this.groupsList.length + this.usersList.length >= this.selectionLimit;
            this.ref.detectChanges();
        };
        this.userClicked = (user) => {
            if (this.onItemClick) {
                this.onItemClick(user);
            }
        };
        this.groupClicked = (group) => {
            if (this.onItemClick) {
                this.onItemClick(undefined, group);
            }
        };
    }
    ngOnInit() {
        this.setcontactsStyle();
        this.usersList = [];
        this.groupsList = [];
    }
    ngAfterViewInit() {
        if (this.tabs?.length <= 0) {
            if (this.tabVisibility == TabsVisibility.usersAndGroups) {
                this.tabs = [
                    {
                        childView: this.usersRef,
                        title: this.usersTabTitle,
                        id: "users",
                        style: this.tabItemStyle
                    },
                    {
                        childView: this.groupsRef,
                        title: this.groupsTabTitle,
                        id: "groups",
                        style: this.tabItemStyle
                    }
                ];
            }
            else {
                if (this.tabVisibility == TabsVisibility.users) {
                    this.tabs = [
                        {
                            childView: this.usersRef,
                            title: this.usersTabTitle,
                            id: "users",
                            style: this.tabItemStyle
                        }
                    ];
                }
                else {
                    this.tabs = [
                        {
                            childView: this.groupsRef,
                            title: this.groupsTabTitle,
                            id: "groups",
                            style: this.tabItemStyle
                        }
                    ];
                }
            }
            this.ref.detectChanges();
        }
    }
    closeClicked() {
        if (this.onClose) {
            this.onClose();
        }
    }
    submitClicked() {
        if (this.onSubmitButtonClick) {
            this.onSubmitButtonClick(this.usersList, this.groupsList);
        }
    }
    setcontactsStyle() {
        let defaultStyle = new ContactsStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `none`,
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            errorStateTextColor: this.themeService.theme.palette.getError(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title2),
            width: "100%",
            height: "100%",
            borderRadius: "none",
            closeIconTint: this.themeService.theme.palette.getPrimary(),
            submitButtonBackground: this.themeService.theme.palette.getPrimary(),
            submitButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
            submitButtonTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            padding: "0 100px",
            tabBackground: "transparent",
            tabTitleTextFont: fontHelper(this.themeService.theme.typography.text2),
            tabTitleTextColor: this.themeService.theme.palette.getAccent(),
            activeTabTitleTextFont: fontHelper(this.themeService.theme.typography.text2),
            activeTabTitleTextColor: this.themeService.theme.palette.getAccent("light"),
            activeTabBackground: this.themeService.theme.palette.getAccent900("light"),
            activeTabBorder: "none",
            tabHeight: "fit-content",
            tabWidth: "100%"
        });
        this.contactsStyle = { ...defaultStyle, ...this.contactsStyle };
        this.submitButtonStyle.background = this.contactsStyle.submitButtonBackground;
        this.submitButtonStyle.buttonTextFont = this.contactsStyle.submitButtonTextFont;
        this.submitButtonStyle.buttonTextColor = this.contactsStyle.submitButtonTextColor;
        this.tabsStyle = {
            background: this.themeService.theme.palette.getAccent100(),
            borderRadius: "8px",
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`
        };
        this.tabItemStyle = new TabItemStyle({
            height: this.contactsStyle.tabHeight,
            width: this.contactsStyle.tabWidth,
            background: this.contactsStyle.tabBackground,
            activeBackground: this.contactsStyle.activeTabBackground,
            titleTextColor: this.contactsStyle.tabTitleTextColor,
            titleTextFont: this.contactsStyle.tabTitleTextFont,
            activeIconTint: this.themeService.theme.palette.getPrimary(),
            activeTitleTextColor: this.contactsStyle.activeTabTitleTextColor,
            activeTitleTextFont: this.contactsStyle.activeTabTitleTextFont,
            borderRadius: "8px"
        });
        this.closeButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            buttonIconTint: this.contactsStyle.closeIconTint || this.themeService.theme.palette.getPrimary()
        };
        this.wrapperStyle = {
            height: this.contactsStyle.height,
            width: this.contactsStyle.width,
            background: this.contactsStyle.background,
            border: this.contactsStyle.border,
            borderRadius: this.contactsStyle.borderRadius
        };
        this.contactsPadding = {
            padding: this.contactsStyle.padding
        };
        this.titleStyle = {
            textFont: this.contactsStyle.titleTextFont,
            textColor: this.contactsStyle.titleTextColor
        };
        this.errorStyle = {
            textFont: this.contactsStyle.errorStateTextFont,
            textColor: this.contactsStyle.errorStateTextColor
        };
    }
}
CometChatContactsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContactsComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatContactsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatContactsComponent, selector: "cometchat-contacts", inputs: { title: "title", usersTabTitle: "usersTabTitle", groupsTabTitle: "groupsTabTitle", usersConfiguration: "usersConfiguration", groupsConfiguration: "groupsConfiguration", onSubmitButtonClick: "onSubmitButtonClick", closeIconURL: "closeIconURL", contactsStyle: "contactsStyle", selectionMode: "selectionMode", onClose: "onClose", onItemClick: "onItemClick", tabVisibility: "tabVisibility", selectionLimit: "selectionLimit", tabs: "tabs", hideSubmitButton: "hideSubmitButton", submitButtonText: "submitButtonText" }, viewQueries: [{ propertyName: "usersRef", first: true, predicate: ["usersRef"], descendants: true }, { propertyName: "groupsRef", first: true, predicate: ["groupsRef"], descendants: true }], ngImport: i0, template: "<div class=\"cc-contacts\" [ngStyle]=\"wrapperStyle\">\n  <div class=\"cc-contacts-title\">\n   <cometchat-label [text]=\"title\" [labelStyle]=\"titleStyle\" ></cometchat-label>\n  </div>\n  <div class=\"cc-contacts-error\" *ngIf=\"isLimitReached\">\n    <cometchat-label [text]=\"'max limit has reached'\" [labelStyle]=\"errorStyle\" ></cometchat-label>\n   </div>\n  <div class=\"cc-contacts__wrapper\" [ngStyle]=\"contactsPadding\">\n    <div class=\"cc-tabs\">\n      <cometchat-tabs [tabs]=\"tabs\" [tabsStyle]=\"tabsStyle\" [keepAlive]=\"true\">\n        <ng-template #usersRef>\n          <cometchat-users [onItemClick]=\"userClicked\"  [usersRequestBuilder]=\"usersConfiguration.usersRequestBuilder || usersRequestBuilder\"\n          [hideSearch]=\"usersConfiguration.hideSearch\"\n          [StatusIndicatorStyle]=\"usersConfiguration.statusIndicatorStyle\"\n          [avatarStyle]=\"usersConfiguration.avatarStyle\"\n          [searchIconURL]=\"usersConfiguration.searchIconURL\"\n          [searchRequestBuilder]=\"usersConfiguration.searchRequestBuilder || usersSearchRequestBuilder\"\n          [usersStyle]=\"usersConfiguration.usersStyle\"\n          [subtitleView]=\"usersConfiguration.subtitleView\"\n          [options]=\"usersConfiguration.options\"\n          [emptyStateView]=\"usersConfiguration.emptyStateView\"\n          [onSelect]=\"usersConfiguration.onSelect || onUserSelected\"\n          [loadingIconURL]=\"usersConfiguration.loadingIconURL\"\n          [errorStateView]=\"usersConfiguration.errorStateView\"\n          [loadingStateView]=\"usersConfiguration.loadingStateView\"\n          [listItemView]=\"usersConfiguration.listItemView\"\n          [menu]=\"usersConfiguration.menu\"\n          [hideSeparator]=\"usersConfiguration.hideSeparator\"\n          [hideError]=\"usersConfiguration.hideError\"\n          [selectionMode]=\" selectionMode\"\n          [title]=\"''\"  ></cometchat-users>\n      </ng-template>\n      <ng-template #groupsRef>\n        <cometchat-groups [onItemClick]=\"groupClicked\"    [groupsRequestBuilder]=\"groupsConfiguration.groupsRequestBuilder || groupsRequestBuilder\"\n        [hideSearch]=\"groupsConfiguration.hideSearch\"\n        [StatusIndicatorStyle]=\"groupsConfiguration.statusIndicatorStyle\"\n        [avatarStyle]=\"groupsConfiguration.avatarStyle\"\n        [searchIconURL]=\"groupsConfiguration.searchIconURL\"\n        [searchRequestBuilder]=\"groupsConfiguration.searchRequestBuilder || groupsSearchRequestBuilder\"\n        [groupsStyle]=\"groupsConfiguration.groupsStyle\"\n        [subtitleView]=\"groupsConfiguration.subtitleView\"\n        [options]=\"groupsConfiguration.options\"\n        [emptyStateView]=\"groupsConfiguration.emptyStateView\"\n        [onSelect]=\"groupsConfiguration.onSelect || onGroupSelected\"\n        [loadingIconURL]=\"groupsConfiguration.loadingIconURL\"\n        [errorStateView]=\"groupsConfiguration.errorStateView\"\n        [loadingStateView]=\"groupsConfiguration.loadingStateView\"\n        [listItemView]=\"groupsConfiguration.listItemView\"\n        [menu]=\"groupsConfiguration.menu\"\n        [hideSeparator]=\"groupsConfiguration.hideSeparator\"\n        [hideError]=\"groupsConfiguration.hideError\"\n        [selectionMode]=\"selectionMode\"\n        [title]=\"''\" ></cometchat-groups>\n      </ng-template>\n      </cometchat-tabs>\n    </div>\n    <div class=\"cc-contacts__buttons\">\n      <cometchat-button [disabled]=\"isLimitReached\" class=\"cc-contacts__buttons--add\" [text]=\"submitButtonText\" [buttonStyle]=\"submitButtonStyle\" (click)=\"submitClicked()\" ></cometchat-button>\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeIconURL\" [buttonStyle]=\"closeButtonStyle\" (cc-button-clicked)=\"closeClicked()\">\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-contacts{display:flex;height:100%;width:100%;overflow:hidden;flex-direction:column}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-contacts__wrapper{height:100%;padding:8px;overflow:hidden;display:flex;flex-direction:column}.cc-close-button{position:absolute;right:8px;padding:8px}.cc-contacts__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-contacts__buttons--add{height:42px;width:100%}.cc-tabs{display:flex;height:100%;width:100%;overflow:hidden}cometchat-tabs{height:100%;width:100%}.cc-contacts-title,.cc-contacts-error{display:flex;align-items:center;justify-content:center;height:-moz-fit-content;height:fit-content;width:100%;padding:8px 0}\n"], components: [{ type: i2.CometChatTabsComponent, selector: "cometchat-tabs", inputs: ["tabAlignment", "disableDragging", "tabsStyle", "tabs", "keepAlive"] }, { type: i3.CometChatUsersComponent, selector: "cometchat-users", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "disableUsersPresence", "listItemView", "menu", "options", "activeUser", "hideSeparator", "searchPlaceholder", "hideError", "selectionMode", "searchIconURL", "hideSearch", "title", "onError", "emptyStateView", "onSelect", "errorStateView", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "usersStyle", "listItemStyle", "statusIndicatorStyle", "avatarStyle", "onItemClick", "searchKeyword", "onEmpty", "userPresencePlacement", "disableLoadingState"] }, { type: i4.CometChatGroupsComponent, selector: "cometchat-groups", inputs: ["groupsRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "menu", "options", "activeGroup", "hideSeparator", "selectionMode", "searchPlaceholder", "hideError", "searchIconURL", "hideSearch", "title", "onError", "onSelect", "emptyStateView", "errorStateView", "loadingIconURL", "privateGroupIcon", "protectedGroupIcon", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "statusIndicatorStyle", "avatarStyle", "groupsStyle", "listItemStyle", "onItemClick"] }], directives: [{ type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContactsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-contacts", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-contacts\" [ngStyle]=\"wrapperStyle\">\n  <div class=\"cc-contacts-title\">\n   <cometchat-label [text]=\"title\" [labelStyle]=\"titleStyle\" ></cometchat-label>\n  </div>\n  <div class=\"cc-contacts-error\" *ngIf=\"isLimitReached\">\n    <cometchat-label [text]=\"'max limit has reached'\" [labelStyle]=\"errorStyle\" ></cometchat-label>\n   </div>\n  <div class=\"cc-contacts__wrapper\" [ngStyle]=\"contactsPadding\">\n    <div class=\"cc-tabs\">\n      <cometchat-tabs [tabs]=\"tabs\" [tabsStyle]=\"tabsStyle\" [keepAlive]=\"true\">\n        <ng-template #usersRef>\n          <cometchat-users [onItemClick]=\"userClicked\"  [usersRequestBuilder]=\"usersConfiguration.usersRequestBuilder || usersRequestBuilder\"\n          [hideSearch]=\"usersConfiguration.hideSearch\"\n          [StatusIndicatorStyle]=\"usersConfiguration.statusIndicatorStyle\"\n          [avatarStyle]=\"usersConfiguration.avatarStyle\"\n          [searchIconURL]=\"usersConfiguration.searchIconURL\"\n          [searchRequestBuilder]=\"usersConfiguration.searchRequestBuilder || usersSearchRequestBuilder\"\n          [usersStyle]=\"usersConfiguration.usersStyle\"\n          [subtitleView]=\"usersConfiguration.subtitleView\"\n          [options]=\"usersConfiguration.options\"\n          [emptyStateView]=\"usersConfiguration.emptyStateView\"\n          [onSelect]=\"usersConfiguration.onSelect || onUserSelected\"\n          [loadingIconURL]=\"usersConfiguration.loadingIconURL\"\n          [errorStateView]=\"usersConfiguration.errorStateView\"\n          [loadingStateView]=\"usersConfiguration.loadingStateView\"\n          [listItemView]=\"usersConfiguration.listItemView\"\n          [menu]=\"usersConfiguration.menu\"\n          [hideSeparator]=\"usersConfiguration.hideSeparator\"\n          [hideError]=\"usersConfiguration.hideError\"\n          [selectionMode]=\" selectionMode\"\n          [title]=\"''\"  ></cometchat-users>\n      </ng-template>\n      <ng-template #groupsRef>\n        <cometchat-groups [onItemClick]=\"groupClicked\"    [groupsRequestBuilder]=\"groupsConfiguration.groupsRequestBuilder || groupsRequestBuilder\"\n        [hideSearch]=\"groupsConfiguration.hideSearch\"\n        [StatusIndicatorStyle]=\"groupsConfiguration.statusIndicatorStyle\"\n        [avatarStyle]=\"groupsConfiguration.avatarStyle\"\n        [searchIconURL]=\"groupsConfiguration.searchIconURL\"\n        [searchRequestBuilder]=\"groupsConfiguration.searchRequestBuilder || groupsSearchRequestBuilder\"\n        [groupsStyle]=\"groupsConfiguration.groupsStyle\"\n        [subtitleView]=\"groupsConfiguration.subtitleView\"\n        [options]=\"groupsConfiguration.options\"\n        [emptyStateView]=\"groupsConfiguration.emptyStateView\"\n        [onSelect]=\"groupsConfiguration.onSelect || onGroupSelected\"\n        [loadingIconURL]=\"groupsConfiguration.loadingIconURL\"\n        [errorStateView]=\"groupsConfiguration.errorStateView\"\n        [loadingStateView]=\"groupsConfiguration.loadingStateView\"\n        [listItemView]=\"groupsConfiguration.listItemView\"\n        [menu]=\"groupsConfiguration.menu\"\n        [hideSeparator]=\"groupsConfiguration.hideSeparator\"\n        [hideError]=\"groupsConfiguration.hideError\"\n        [selectionMode]=\"selectionMode\"\n        [title]=\"''\" ></cometchat-groups>\n      </ng-template>\n      </cometchat-tabs>\n    </div>\n    <div class=\"cc-contacts__buttons\">\n      <cometchat-button [disabled]=\"isLimitReached\" class=\"cc-contacts__buttons--add\" [text]=\"submitButtonText\" [buttonStyle]=\"submitButtonStyle\" (click)=\"submitClicked()\" ></cometchat-button>\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeIconURL\" [buttonStyle]=\"closeButtonStyle\" (cc-button-clicked)=\"closeClicked()\">\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-contacts{display:flex;height:100%;width:100%;overflow:hidden;flex-direction:column}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-contacts__wrapper{height:100%;padding:8px;overflow:hidden;display:flex;flex-direction:column}.cc-close-button{position:absolute;right:8px;padding:8px}.cc-contacts__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-contacts__buttons--add{height:42px;width:100%}.cc-tabs{display:flex;height:100%;width:100%;overflow:hidden}cometchat-tabs{height:100%;width:100%}.cc-contacts-title,.cc-contacts-error{display:flex;align-items:center;justify-content:center;height:-moz-fit-content;height:fit-content;width:100%;padding:8px 0}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { usersRef: [{
                type: ViewChild,
                args: ["usersRef"]
            }], groupsRef: [{
                type: ViewChild,
                args: ["groupsRef"]
            }], title: [{
                type: Input
            }], usersTabTitle: [{
                type: Input
            }], groupsTabTitle: [{
                type: Input
            }], usersConfiguration: [{
                type: Input
            }], groupsConfiguration: [{
                type: Input
            }], onSubmitButtonClick: [{
                type: Input
            }], closeIconURL: [{
                type: Input
            }], contactsStyle: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], onClose: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }], tabVisibility: [{
                type: Input
            }], selectionLimit: [{
                type: Input
            }], tabs: [{
                type: Input
            }], hideSubmitButton: [{
                type: Input
            }], submitButtonText: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnRhY3RzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udGFjdHMvY29tZXRjaGF0LWNvbnRhY3RzL2NvbWV0Y2hhdC1jb250YWN0cy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdENvbnRhY3RzL2NvbWV0Y2hhdC1jb250YWN0cy9jb21ldGNoYXQtY29udGFjdHMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBVSxLQUFLLEVBQXFCLHVCQUF1QixFQUFlLFNBQVMsRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBYSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDMUgsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBb0IsY0FBYyxFQUFFLGFBQWEsRUFBRSxNQUFNLDRCQUE0QixDQUFBOzs7Ozs7O0FBRWxIOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLDBCQUEwQjtJQXdCckMsWUFBb0IsR0FBc0IsRUFBVSxZQUFtQztRQUFuRSxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQXJCOUUsVUFBSyxHQUFXLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyQyxrQkFBYSxHQUFXLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQyxtQkFBYyxHQUFXLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1Qyx1QkFB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LGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgSW5wdXQsIENoYW5nZURldGVjdG9yUmVmLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVGVtcGxhdGVSZWYsIFZpZXdDaGlsZCwgQWZ0ZXJWaWV3SW5pdCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBCYXNlU3R5bGUsIEdyb3Vwc0NvbmZpZ3VyYXRpb24sIFVzZXJzQ29uZmlndXJhdGlvbiwgVGFiSXRlbVN0eWxlLCBDb250YWN0c1N0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdFRhYkl0ZW0sIFRhYnNWaXNpYmlsaXR5LCBTZWxlY3Rpb25Nb2RlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnXG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdENvbnRhY3RzQ29tcG9uZW50IGlzIHVzZWQgdG8gcmVuZGVyIGdyb3VwIG1lbWJlcnMgdG8gYWRkXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWNvbnRhY3RzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNvbnRhY3RzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY29udGFjdHMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDb250YWN0c0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgQWZ0ZXJWaWV3SW5pdCB7XG4gIEBWaWV3Q2hpbGQoXCJ1c2Vyc1JlZlwiKSB1c2Vyc1JlZiE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJncm91cHNSZWZcIikgZ3JvdXBzUmVmITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiTkVXX0NIQVRcIik7XG4gIEBJbnB1dCgpIHVzZXJzVGFiVGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiVVNFUlNcIik7XG4gIEBJbnB1dCgpIGdyb3Vwc1RhYlRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdST1VQU1wiKTtcbiAgQElucHV0KCkgdXNlcnNDb25maWd1cmF0aW9uOiBVc2Vyc0NvbmZpZ3VyYXRpb24gPSBuZXcgVXNlcnNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgZ3JvdXBzQ29uZmlndXJhdGlvbjogR3JvdXBzQ29uZmlndXJhdGlvbiA9IG5ldyBHcm91cHNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgb25TdWJtaXRCdXR0b25DbGljayE6ICh1c2Vycz86IENvbWV0Q2hhdC5Vc2VyW10sIGdyb3Vwcz86IENvbWV0Q2hhdC5Hcm91cFtdKSA9PiB2b2lkO1xuICBASW5wdXQoKSBjbG9zZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCJcbiAgQElucHV0KCkgY29udGFjdHNTdHlsZTogQ29udGFjdHNTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5zaW5nbGU7XG4gIEBJbnB1dCgpIG9uQ2xvc2UhOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6ICh1c2VyPzogQ29tZXRDaGF0LlVzZXIsIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwKSA9PiB2b2lkO1xuICBASW5wdXQoKSB0YWJWaXNpYmlsaXR5OiBUYWJzVmlzaWJpbGl0eSA9IFRhYnNWaXNpYmlsaXR5LnVzZXJzQW5kR3JvdXBzXG4gIEBJbnB1dCgpIHNlbGVjdGlvbkxpbWl0OiBudW1iZXIgPSA1O1xuICBASW5wdXQoKSB0YWJzOiBDb21ldENoYXRUYWJJdGVtW10gPSBbXVxuICBASW5wdXQoKSBoaWRlU3VibWl0QnV0dG9uOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgc3VibWl0QnV0dG9uVGV4dDogc3RyaW5nID0gXCJTdWJtaXRcIjtcbiAgLy8gcHVibGljIHByb3BlcnRpZXNcbiAgcHVibGljIHVzZXJzUmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyKCkuc2V0TGltaXQoMzApLmhpZGVCbG9ja2VkVXNlcnModHJ1ZSk7XG4gIHB1YmxpYyB1c2Vyc1NlYXJjaFJlcXVlc3RCdWlsZGVyOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcigpLnNldExpbWl0KDMwKS5oaWRlQmxvY2tlZFVzZXJzKHRydWUpO1xuICBwdWJsaWMgZ3JvdXBzUmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgzMCkuam9pbmVkT25seSh0cnVlKTtcbiAgcHVibGljIGdyb3Vwc1NlYXJjaFJlcXVlc3RCdWlsZGVyOiBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyKCkuc2V0TGltaXQoMzApLmpvaW5lZE9ubHkodHJ1ZSk7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkge1xuICB9XG4gIHB1YmxpYyB0YWJJdGVtU3R5bGU6IFRhYkl0ZW1TdHlsZSA9IHt9O1xuICBwdWJsaWMgdXNlcnNMaXN0OiBDb21ldENoYXQuVXNlcltdID0gW107XG4gIHB1YmxpYyBncm91cHNMaXN0OiBDb21ldENoYXQuR3JvdXBbXSA9IFtdO1xuICBwdWJsaWMgc3VibWl0QnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYig1MSwgMTUzLCAyNTUpXCIsXG4gICAgcGFkZGluZzogXCI4cHhcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICBidXR0b25UZXh0Rm9udDogXCJcIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gIH1cbiAgcHVibGljIGNsb3NlQnV0dG9uU3R5bGU6IGFueTtcbiAgcHVibGljIHdyYXBwZXJTdHlsZTogYW55O1xuICBwdWJsaWMgY29udGFjdHNQYWRkaW5nOiBhbnk7XG4gIHB1YmxpYyB0aXRsZVN0eWxlOiBhbnkgPSB7fTtcbiAgcHVibGljIGVycm9yU3R5bGU6IGFueSA9IHt9O1xuICBwdWJsaWMgaXNMaW1pdFJlYWNoZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHRhYnNTdHlsZTogQmFzZVN0eWxlID0ge307XG4gIG9uR3JvdXBTZWxlY3RlZCA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgdmFyIGtleSA9IHRoaXMuZ3JvdXBzTGlzdC5maW5kSW5kZXgoKG06IGFueSkgPT4gbT8uZ2V0R3VpZCgpID09PSBncm91cC5nZXRHdWlkKCkpO1xuICAgIGlmIChrZXkgPj0gMCkge1xuICAgICAgdGhpcy5ncm91cHNMaXN0LnNwbGljZShrZXksIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdyb3Vwc0xpc3QucHVzaChncm91cCk7XG4gICAgfVxuICAgIHRoaXMuaXNMaW1pdFJlYWNoZWQgPSB0aGlzLmdyb3Vwc0xpc3QubGVuZ3RoICsgdGhpcy51c2Vyc0xpc3QubGVuZ3RoID49IHRoaXMuc2VsZWN0aW9uTGltaXQ7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvblVzZXJTZWxlY3RlZCA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGNvbnN0IGtleSA9IHRoaXMudXNlcnNMaXN0LmZpbmRJbmRleCgobTogYW55KSA9PiBtPy5nZXRVaWQoKSA9PT0gdXNlci5nZXRVaWQoKSk7XG4gICAgaWYgKGtleSA+PSAwKSB7XG4gICAgICB0aGlzLnVzZXJzTGlzdC5zcGxpY2Uoa2V5LCAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51c2Vyc0xpc3QucHVzaCh1c2VyKTtcbiAgICB9XG4gICAgdGhpcy5pc0xpbWl0UmVhY2hlZCA9IHRoaXMuZ3JvdXBzTGlzdC5sZW5ndGggKyB0aGlzLnVzZXJzTGlzdC5sZW5ndGggPj0gdGhpcy5zZWxlY3Rpb25MaW1pdDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0Y29udGFjdHNTdHlsZSgpO1xuICAgIHRoaXMudXNlcnNMaXN0ID0gW11cbiAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbXVxuICB9XG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy50YWJzPy5sZW5ndGggPD0gMCkge1xuICAgICAgaWYgKHRoaXMudGFiVmlzaWJpbGl0eSA9PSBUYWJzVmlzaWJpbGl0eS51c2Vyc0FuZEdyb3Vwcykge1xuICAgICAgICB0aGlzLnRhYnMgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2hpbGRWaWV3OiB0aGlzLnVzZXJzUmVmLFxuICAgICAgICAgICAgdGl0bGU6IHRoaXMudXNlcnNUYWJUaXRsZSxcbiAgICAgICAgICAgIGlkOiBcInVzZXJzXCIsXG4gICAgICAgICAgICBzdHlsZTogdGhpcy50YWJJdGVtU3R5bGVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNoaWxkVmlldzogdGhpcy5ncm91cHNSZWYsXG4gICAgICAgICAgICB0aXRsZTogdGhpcy5ncm91cHNUYWJUaXRsZSxcbiAgICAgICAgICAgIGlkOiBcImdyb3Vwc1wiLFxuICAgICAgICAgICAgc3R5bGU6IHRoaXMudGFiSXRlbVN0eWxlXG4gICAgICAgICAgfV1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAodGhpcy50YWJWaXNpYmlsaXR5ID09IFRhYnNWaXNpYmlsaXR5LnVzZXJzKSB7XG4gICAgICAgICAgdGhpcy50YWJzID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjaGlsZFZpZXc6IHRoaXMudXNlcnNSZWYsXG4gICAgICAgICAgICAgIHRpdGxlOiB0aGlzLnVzZXJzVGFiVGl0bGUsXG4gICAgICAgICAgICAgIGlkOiBcInVzZXJzXCIsXG4gICAgICAgICAgICAgIHN0eWxlOiB0aGlzLnRhYkl0ZW1TdHlsZVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGlzLnRhYnMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNoaWxkVmlldzogdGhpcy5ncm91cHNSZWYsXG4gICAgICAgICAgICAgIHRpdGxlOiB0aGlzLmdyb3Vwc1RhYlRpdGxlLFxuICAgICAgICAgICAgICBpZDogXCJncm91cHNcIixcbiAgICAgICAgICAgICAgc3R5bGU6IHRoaXMudGFiSXRlbVN0eWxlXG4gICAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9XG4gIH1cbiAgdXNlckNsaWNrZWQgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayh1c2VyKVxuICAgIH1cbiAgfVxuICBncm91cENsaWNrZWQgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKHVuZGVmaW5lZCwgZ3JvdXApXG4gICAgfVxuICB9XG4gIGNsb3NlQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKVxuICAgIH1cbiAgfVxuICBzdWJtaXRDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uU3VibWl0QnV0dG9uQ2xpY2spIHtcbiAgICAgIHRoaXMub25TdWJtaXRCdXR0b25DbGljayh0aGlzLnVzZXJzTGlzdCwgdGhpcy5ncm91cHNMaXN0KVxuICAgIH1cbiAgfVxuICBzZXRjb250YWN0c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbnRhY3RzU3R5bGUgPSBuZXcgQ29udGFjdHNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIm5vbmVcIixcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VibWl0QnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBzdWJtaXRCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBzdWJtaXRCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBwYWRkaW5nOiBcIjAgMTAwcHhcIixcbiAgICAgIHRhYkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRhYlRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICB0YWJUaXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRhYlRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBhY3RpdmVUYWJUaXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJsaWdodFwiKSxcbiAgICAgIGFjdGl2ZVRhYkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBhY3RpdmVUYWJCb3JkZXI6IFwibm9uZVwiLFxuICAgICAgdGFiSGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB0YWJXaWR0aDogXCIxMDAlXCJcbiAgICB9KVxuICAgIHRoaXMuY29udGFjdHNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNvbnRhY3RzU3R5bGUgfVxuICAgIHRoaXMuc3VibWl0QnV0dG9uU3R5bGUuYmFja2dyb3VuZCA9IHRoaXMuY29udGFjdHNTdHlsZS5zdWJtaXRCdXR0b25CYWNrZ3JvdW5kO1xuICAgIHRoaXMuc3VibWl0QnV0dG9uU3R5bGUuYnV0dG9uVGV4dEZvbnQgPSB0aGlzLmNvbnRhY3RzU3R5bGUuc3VibWl0QnV0dG9uVGV4dEZvbnQ7XG4gICAgdGhpcy5zdWJtaXRCdXR0b25TdHlsZS5idXR0b25UZXh0Q29sb3IgPSB0aGlzLmNvbnRhY3RzU3R5bGUuc3VibWl0QnV0dG9uVGV4dENvbG9yO1xuICAgIHRoaXMudGFic1N0eWxlID0ge1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gXG4gICAgfVxuICAgIHRoaXMudGFiSXRlbVN0eWxlID0gbmV3IFRhYkl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IHRoaXMuY29udGFjdHNTdHlsZS50YWJIZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5jb250YWN0c1N0eWxlLnRhYldpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jb250YWN0c1N0eWxlLnRhYkJhY2tncm91bmQsXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLmNvbnRhY3RzU3R5bGUuYWN0aXZlVGFiQmFja2dyb3VuZCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLmNvbnRhY3RzU3R5bGUudGFiVGl0bGVUZXh0Q29sb3IsXG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmNvbnRhY3RzU3R5bGUudGFiVGl0bGVUZXh0Rm9udCxcbiAgICAgIGFjdGl2ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGFjdGl2ZVRpdGxlVGV4dENvbG9yOiB0aGlzLmNvbnRhY3RzU3R5bGUuYWN0aXZlVGFiVGl0bGVUZXh0Q29sb3IsXG4gICAgICBhY3RpdmVUaXRsZVRleHRGb250OiB0aGlzLmNvbnRhY3RzU3R5bGUuYWN0aXZlVGFiVGl0bGVUZXh0Rm9udCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIlxuICAgIH0pXG4gICAgdGhpcy5jbG9zZUJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuY29udGFjdHNTdHlsZS5jbG9zZUljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfVxuICAgIHRoaXMud3JhcHBlclN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmNvbnRhY3RzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuY29udGFjdHNTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuY29udGFjdHNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmNvbnRhY3RzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNvbnRhY3RzU3R5bGUuYm9yZGVyUmFkaXVzXG4gICAgfVxuICAgIHRoaXMuY29udGFjdHNQYWRkaW5nID0ge1xuICAgICAgcGFkZGluZzogdGhpcy5jb250YWN0c1N0eWxlLnBhZGRpbmdcbiAgICB9XG4gICAgdGhpcy50aXRsZVN0eWxlID0ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuY29udGFjdHNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLmNvbnRhY3RzU3R5bGUudGl0bGVUZXh0Q29sb3JcbiAgICB9XG4gICAgdGhpcy5lcnJvclN0eWxlID0ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMuY29udGFjdHNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuY29udGFjdHNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yXG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY29udGFjdHNcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGVcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWNvbnRhY3RzLXRpdGxlXCI+XG4gICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cInRpdGxlXCIgW2xhYmVsU3R5bGVdPVwidGl0bGVTdHlsZVwiID48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1jb250YWN0cy1lcnJvclwiICpuZ0lmPVwiaXNMaW1pdFJlYWNoZWRcIj5cbiAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cIidtYXggbGltaXQgaGFzIHJlYWNoZWQnXCIgW2xhYmVsU3R5bGVdPVwiZXJyb3JTdHlsZVwiID48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udGFjdHNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJjb250YWN0c1BhZGRpbmdcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtdGFic1wiPlxuICAgICAgPGNvbWV0Y2hhdC10YWJzIFt0YWJzXT1cInRhYnNcIiBbdGFic1N0eWxlXT1cInRhYnNTdHlsZVwiIFtrZWVwQWxpdmVdPVwidHJ1ZVwiPlxuICAgICAgICA8bmctdGVtcGxhdGUgI3VzZXJzUmVmPlxuICAgICAgICAgIDxjb21ldGNoYXQtdXNlcnMgW29uSXRlbUNsaWNrXT1cInVzZXJDbGlja2VkXCIgIFt1c2Vyc1JlcXVlc3RCdWlsZGVyXT1cInVzZXJzQ29uZmlndXJhdGlvbi51c2Vyc1JlcXVlc3RCdWlsZGVyIHx8IHVzZXJzUmVxdWVzdEJ1aWxkZXJcIlxuICAgICAgICAgIFtoaWRlU2VhcmNoXT1cInVzZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICAgICAgICBbU3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwidXNlcnNDb25maWd1cmF0aW9uLnN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwidXNlcnNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICAgICAgICBbc2VhcmNoSWNvblVSTF09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgICAgICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cInVzZXJzQ29uZmlndXJhdGlvbi5zZWFyY2hSZXF1ZXN0QnVpbGRlciB8fCB1c2Vyc1NlYXJjaFJlcXVlc3RCdWlsZGVyXCJcbiAgICAgICAgICBbdXNlcnNTdHlsZV09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24udXNlcnNTdHlsZVwiXG4gICAgICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgICAgICBbb3B0aW9uc109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24ub3B0aW9uc1wiXG4gICAgICAgICAgW2VtcHR5U3RhdGVWaWV3XT1cInVzZXJzQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgICAgICAgW29uU2VsZWN0XT1cInVzZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdCB8fCBvblVzZXJTZWxlY3RlZFwiXG4gICAgICAgICAgW2xvYWRpbmdJY29uVVJMXT1cInVzZXJzQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgICAgICAgW2Vycm9yU3RhdGVWaWV3XT1cInVzZXJzQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgICAgIFtsaXN0SXRlbVZpZXddPVwidXNlcnNDb25maWd1cmF0aW9uLmxpc3RJdGVtVmlld1wiXG4gICAgICAgICAgW21lbnVdPVwidXNlcnNDb25maWd1cmF0aW9uLm1lbnVcIlxuICAgICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cInVzZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VwYXJhdG9yXCJcbiAgICAgICAgICBbaGlkZUVycm9yXT1cInVzZXJzQ29uZmlndXJhdGlvbi5oaWRlRXJyb3JcIlxuICAgICAgICAgIFtzZWxlY3Rpb25Nb2RlXT1cIiBzZWxlY3Rpb25Nb2RlXCJcbiAgICAgICAgICBbdGl0bGVdPVwiJydcIiAgPjwvY29tZXRjaGF0LXVzZXJzPlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjZ3JvdXBzUmVmPlxuICAgICAgICA8Y29tZXRjaGF0LWdyb3VwcyBbb25JdGVtQ2xpY2tdPVwiZ3JvdXBDbGlja2VkXCIgICAgW2dyb3Vwc1JlcXVlc3RCdWlsZGVyXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uZ3JvdXBzUmVxdWVzdEJ1aWxkZXIgfHwgZ3JvdXBzUmVxdWVzdEJ1aWxkZXJcIlxuICAgICAgICBbaGlkZVNlYXJjaF09XCJncm91cHNDb25maWd1cmF0aW9uLmhpZGVTZWFyY2hcIlxuICAgICAgICBbU3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgIFthdmF0YXJTdHlsZV09XCJncm91cHNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICAgICAgW3NlYXJjaEljb25VUkxdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5zZWFyY2hJY29uVVJMXCJcbiAgICAgICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uc2VhcmNoUmVxdWVzdEJ1aWxkZXIgfHwgZ3JvdXBzU2VhcmNoUmVxdWVzdEJ1aWxkZXJcIlxuICAgICAgICBbZ3JvdXBzU3R5bGVdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5ncm91cHNTdHlsZVwiXG4gICAgICAgIFtzdWJ0aXRsZVZpZXddPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIlxuICAgICAgICBbb3B0aW9uc109XCJncm91cHNDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgICAgICBbZW1wdHlTdGF0ZVZpZXddPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgICAgIFtvblNlbGVjdF09XCJncm91cHNDb25maWd1cmF0aW9uLm9uU2VsZWN0IHx8IG9uR3JvdXBTZWxlY3RlZFwiXG4gICAgICAgIFtsb2FkaW5nSWNvblVSTF09XCJncm91cHNDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgW2Vycm9yU3RhdGVWaWV3XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgICAgICBbbG9hZGluZ1N0YXRlVmlld109XCJncm91cHNDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgICBbbGlzdEl0ZW1WaWV3XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1WaWV3XCJcbiAgICAgICAgW21lbnVdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5tZW51XCJcbiAgICAgICAgW2hpZGVTZXBhcmF0b3JdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5oaWRlU2VwYXJhdG9yXCJcbiAgICAgICAgW2hpZGVFcnJvcl09XCJncm91cHNDb25maWd1cmF0aW9uLmhpZGVFcnJvclwiXG4gICAgICAgIFtzZWxlY3Rpb25Nb2RlXT1cInNlbGVjdGlvbk1vZGVcIlxuICAgICAgICBbdGl0bGVdPVwiJydcIiA+PC9jb21ldGNoYXQtZ3JvdXBzPlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvY29tZXRjaGF0LXRhYnM+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLWNvbnRhY3RzX19idXR0b25zXCI+XG4gICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbZGlzYWJsZWRdPVwiaXNMaW1pdFJlYWNoZWRcIiBjbGFzcz1cImNjLWNvbnRhY3RzX19idXR0b25zLS1hZGRcIiBbdGV4dF09XCJzdWJtaXRCdXR0b25UZXh0XCIgW2J1dHRvblN0eWxlXT1cInN1Ym1pdEJ1dHRvblN0eWxlXCIgKGNsaWNrKT1cInN1Ym1pdENsaWNrZWQoKVwiID48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY2xvc2UtYnV0dG9uXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VJY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGVcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY2xvc2VDbGlja2VkKClcIj5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXX0=