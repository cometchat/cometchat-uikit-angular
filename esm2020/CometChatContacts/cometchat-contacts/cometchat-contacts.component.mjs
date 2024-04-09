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
        this.selectionMode = SelectionMode.none;
        this.tabVisibility = TabsVisibility.usersAndGroups;
        this.selectionLimit = 5;
        this.tabs = [];
        this.hideSubmitButton = true;
        this.submitButtonText = "Submit";
        this.selection = SelectionMode;
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
CometChatContactsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatContactsComponent, selector: "cometchat-contacts", inputs: { title: "title", usersTabTitle: "usersTabTitle", groupsTabTitle: "groupsTabTitle", usersConfiguration: "usersConfiguration", groupsConfiguration: "groupsConfiguration", onSubmitButtonClick: "onSubmitButtonClick", closeIconURL: "closeIconURL", contactsStyle: "contactsStyle", selectionMode: "selectionMode", onClose: "onClose", onItemClick: "onItemClick", tabVisibility: "tabVisibility", selectionLimit: "selectionLimit", tabs: "tabs", hideSubmitButton: "hideSubmitButton", submitButtonText: "submitButtonText" }, viewQueries: [{ propertyName: "usersRef", first: true, predicate: ["usersRef"], descendants: true }, { propertyName: "groupsRef", first: true, predicate: ["groupsRef"], descendants: true }], ngImport: i0, template: "<div class=\"cc-contacts\" [ngStyle]=\"wrapperStyle\">\n  <div class=\"cc-contacts-title\">\n    <cometchat-label [text]=\"title\" [labelStyle]=\"titleStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts-error\" *ngIf=\"isLimitReached\">\n    <cometchat-label [text]=\"'max limit has reached'\"\n      [labelStyle]=\"errorStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts__wrapper\" [ngStyle]=\"contactsPadding\">\n    <div class=\"cc-tabs\">\n      <cometchat-tabs [tabs]=\"tabs\" [tabsStyle]=\"tabsStyle\" [keepAlive]=\"true\">\n        <ng-template #usersRef>\n          <cometchat-users [onItemClick]=\"userClicked\"\n            [usersRequestBuilder]=\"usersConfiguration.usersRequestBuilder || usersRequestBuilder\"\n            [hideSearch]=\"usersConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"usersConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"usersConfiguration.avatarStyle\"\n            [searchIconURL]=\"usersConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"usersConfiguration.searchRequestBuilder || usersSearchRequestBuilder\"\n            [usersStyle]=\"usersConfiguration.usersStyle\"\n            [subtitleView]=\"usersConfiguration.subtitleView\"\n            [options]=\"usersConfiguration.options\"\n            [emptyStateView]=\"usersConfiguration.emptyStateView\"\n            [onSelect]=\"usersConfiguration.onSelect || onUserSelected\"\n            [loadingIconURL]=\"usersConfiguration.loadingIconURL\"\n            [errorStateView]=\"usersConfiguration.errorStateView\"\n            [loadingStateView]=\"usersConfiguration.loadingStateView\"\n            [listItemView]=\"usersConfiguration.listItemView\"\n            [menu]=\"usersConfiguration.menu\"\n            [hideSeparator]=\"usersConfiguration.hideSeparator\"\n            [hideError]=\"usersConfiguration.hideError\"\n            [selectionMode]=\" selectionMode\" [title]=\"''\"></cometchat-users>\n        </ng-template>\n        <ng-template #groupsRef>\n          <cometchat-groups [onItemClick]=\"groupClicked\"\n            [groupsRequestBuilder]=\"groupsConfiguration.groupsRequestBuilder || groupsRequestBuilder\"\n            [hideSearch]=\"groupsConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"groupsConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"groupsConfiguration.avatarStyle\"\n            [searchIconURL]=\"groupsConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"groupsConfiguration.searchRequestBuilder || groupsSearchRequestBuilder\"\n            [groupsStyle]=\"groupsConfiguration.groupsStyle\"\n            [subtitleView]=\"groupsConfiguration.subtitleView\"\n            [options]=\"groupsConfiguration.options\"\n            [emptyStateView]=\"groupsConfiguration.emptyStateView\"\n            [onSelect]=\"groupsConfiguration.onSelect || onGroupSelected\"\n            [loadingIconURL]=\"groupsConfiguration.loadingIconURL\"\n            [errorStateView]=\"groupsConfiguration.errorStateView\"\n            [loadingStateView]=\"groupsConfiguration.loadingStateView\"\n            [listItemView]=\"groupsConfiguration.listItemView\"\n            [menu]=\"groupsConfiguration.menu\"\n            [hideSeparator]=\"groupsConfiguration.hideSeparator\"\n            [hideError]=\"groupsConfiguration.hideError\"\n            [selectionMode]=\"selectionMode\" [title]=\"''\"></cometchat-groups>\n        </ng-template>\n      </cometchat-tabs>\n    </div>\n    <div class=\"cc-contacts__buttons\" *ngIf=\"selectionMode != selection.none\">\n      <cometchat-button [disabled]=\"isLimitReached\"\n        class=\"cc-contacts__buttons--add\" [text]=\"submitButtonText\"\n        [buttonStyle]=\"submitButtonStyle\"\n        (click)=\"submitClicked()\"></cometchat-button>\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeIconURL\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"closeClicked()\">\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-contacts{display:flex;height:100%;width:100%;overflow:hidden;flex-direction:column}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-contacts__wrapper{height:100%;padding:8px;overflow:hidden;display:flex;flex-direction:column}.cc-close-button{position:absolute;right:8px;padding:8px}.cc-contacts__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-contacts__buttons--add{height:42px;width:100%}.cc-tabs{display:flex;height:100%;width:100%;overflow:hidden}cometchat-tabs{height:100%;width:100%}.cc-contacts-title,.cc-contacts-error{display:flex;align-items:center;justify-content:center;height:-moz-fit-content;height:fit-content;width:100%;padding:8px 0}\n"], components: [{ type: i2.CometChatTabsComponent, selector: "cometchat-tabs", inputs: ["tabAlignment", "disableDragging", "tabsStyle", "tabs", "keepAlive"] }, { type: i3.CometChatUsersComponent, selector: "cometchat-users", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "disableUsersPresence", "listItemView", "menu", "options", "activeUser", "hideSeparator", "searchPlaceholder", "hideError", "selectionMode", "searchIconURL", "hideSearch", "title", "onError", "emptyStateView", "onSelect", "errorStateView", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "usersStyle", "listItemStyle", "statusIndicatorStyle", "avatarStyle", "onItemClick", "searchKeyword", "onEmpty", "userPresencePlacement", "disableLoadingState"] }, { type: i4.CometChatGroupsComponent, selector: "cometchat-groups", inputs: ["groupsRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "menu", "options", "activeGroup", "hideSeparator", "selectionMode", "searchPlaceholder", "hideError", "searchIconURL", "hideSearch", "title", "onError", "onSelect", "emptyStateView", "errorStateView", "loadingIconURL", "privateGroupIcon", "protectedGroupIcon", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "statusIndicatorStyle", "avatarStyle", "groupsStyle", "listItemStyle", "onItemClick"] }], directives: [{ type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContactsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-contacts", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-contacts\" [ngStyle]=\"wrapperStyle\">\n  <div class=\"cc-contacts-title\">\n    <cometchat-label [text]=\"title\" [labelStyle]=\"titleStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts-error\" *ngIf=\"isLimitReached\">\n    <cometchat-label [text]=\"'max limit has reached'\"\n      [labelStyle]=\"errorStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts__wrapper\" [ngStyle]=\"contactsPadding\">\n    <div class=\"cc-tabs\">\n      <cometchat-tabs [tabs]=\"tabs\" [tabsStyle]=\"tabsStyle\" [keepAlive]=\"true\">\n        <ng-template #usersRef>\n          <cometchat-users [onItemClick]=\"userClicked\"\n            [usersRequestBuilder]=\"usersConfiguration.usersRequestBuilder || usersRequestBuilder\"\n            [hideSearch]=\"usersConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"usersConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"usersConfiguration.avatarStyle\"\n            [searchIconURL]=\"usersConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"usersConfiguration.searchRequestBuilder || usersSearchRequestBuilder\"\n            [usersStyle]=\"usersConfiguration.usersStyle\"\n            [subtitleView]=\"usersConfiguration.subtitleView\"\n            [options]=\"usersConfiguration.options\"\n            [emptyStateView]=\"usersConfiguration.emptyStateView\"\n            [onSelect]=\"usersConfiguration.onSelect || onUserSelected\"\n            [loadingIconURL]=\"usersConfiguration.loadingIconURL\"\n            [errorStateView]=\"usersConfiguration.errorStateView\"\n            [loadingStateView]=\"usersConfiguration.loadingStateView\"\n            [listItemView]=\"usersConfiguration.listItemView\"\n            [menu]=\"usersConfiguration.menu\"\n            [hideSeparator]=\"usersConfiguration.hideSeparator\"\n            [hideError]=\"usersConfiguration.hideError\"\n            [selectionMode]=\" selectionMode\" [title]=\"''\"></cometchat-users>\n        </ng-template>\n        <ng-template #groupsRef>\n          <cometchat-groups [onItemClick]=\"groupClicked\"\n            [groupsRequestBuilder]=\"groupsConfiguration.groupsRequestBuilder || groupsRequestBuilder\"\n            [hideSearch]=\"groupsConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"groupsConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"groupsConfiguration.avatarStyle\"\n            [searchIconURL]=\"groupsConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"groupsConfiguration.searchRequestBuilder || groupsSearchRequestBuilder\"\n            [groupsStyle]=\"groupsConfiguration.groupsStyle\"\n            [subtitleView]=\"groupsConfiguration.subtitleView\"\n            [options]=\"groupsConfiguration.options\"\n            [emptyStateView]=\"groupsConfiguration.emptyStateView\"\n            [onSelect]=\"groupsConfiguration.onSelect || onGroupSelected\"\n            [loadingIconURL]=\"groupsConfiguration.loadingIconURL\"\n            [errorStateView]=\"groupsConfiguration.errorStateView\"\n            [loadingStateView]=\"groupsConfiguration.loadingStateView\"\n            [listItemView]=\"groupsConfiguration.listItemView\"\n            [menu]=\"groupsConfiguration.menu\"\n            [hideSeparator]=\"groupsConfiguration.hideSeparator\"\n            [hideError]=\"groupsConfiguration.hideError\"\n            [selectionMode]=\"selectionMode\" [title]=\"''\"></cometchat-groups>\n        </ng-template>\n      </cometchat-tabs>\n    </div>\n    <div class=\"cc-contacts__buttons\" *ngIf=\"selectionMode != selection.none\">\n      <cometchat-button [disabled]=\"isLimitReached\"\n        class=\"cc-contacts__buttons--add\" [text]=\"submitButtonText\"\n        [buttonStyle]=\"submitButtonStyle\"\n        (click)=\"submitClicked()\"></cometchat-button>\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeIconURL\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"closeClicked()\">\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-contacts{display:flex;height:100%;width:100%;overflow:hidden;flex-direction:column}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-contacts__wrapper{height:100%;padding:8px;overflow:hidden;display:flex;flex-direction:column}.cc-close-button{position:absolute;right:8px;padding:8px}.cc-contacts__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-contacts__buttons--add{height:42px;width:100%}.cc-tabs{display:flex;height:100%;width:100%;overflow:hidden}cometchat-tabs{height:100%;width:100%}.cc-contacts-title,.cc-contacts-error{display:flex;align-items:center;justify-content:center;height:-moz-fit-content;height:fit-content;width:100%;padding:8px 0}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnRhY3RzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udGFjdHMvY29tZXRjaGF0LWNvbnRhY3RzL2NvbWV0Y2hhdC1jb250YWN0cy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdENvbnRhY3RzL2NvbWV0Y2hhdC1jb250YWN0cy9jb21ldGNoYXQtY29udGFjdHMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBVSxLQUFLLEVBQXFCLHVCQUF1QixFQUFlLFNBQVMsRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBYSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDMUgsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBb0IsY0FBYyxFQUFFLGFBQWEsRUFBRSxNQUFNLDRCQUE0QixDQUFBOzs7Ozs7O0FBRWxIOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLDBCQUEwQjtJQXlCckMsWUFBb0IsR0FBc0IsRUFBVSxZQUFtQztRQUFuRSxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQXRCOUUsVUFBSyxHQUFXLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyQyxrQkFBYSxHQUFXLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQyxtQkFBYyxHQUFXLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1Qyx1QkFB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QkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgSW5wdXQsIENoYW5nZURldGVjdG9yUmVmLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVGVtcGxhdGVSZWYsIFZpZXdDaGlsZCwgQWZ0ZXJWaWV3SW5pdCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBCYXNlU3R5bGUsIEdyb3Vwc0NvbmZpZ3VyYXRpb24sIFVzZXJzQ29uZmlndXJhdGlvbiwgVGFiSXRlbVN0eWxlLCBDb250YWN0c1N0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdFRhYkl0ZW0sIFRhYnNWaXNpYmlsaXR5LCBTZWxlY3Rpb25Nb2RlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnXG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdENvbnRhY3RzQ29tcG9uZW50IGlzIHVzZWQgdG8gcmVuZGVyIGdyb3VwIG1lbWJlcnMgdG8gYWRkXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWNvbnRhY3RzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNvbnRhY3RzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY29udGFjdHMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDb250YWN0c0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgQWZ0ZXJWaWV3SW5pdCB7XG4gIEBWaWV3Q2hpbGQoXCJ1c2Vyc1JlZlwiKSB1c2Vyc1JlZiE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJncm91cHNSZWZcIikgZ3JvdXBzUmVmITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiTkVXX0NIQVRcIik7XG4gIEBJbnB1dCgpIHVzZXJzVGFiVGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiVVNFUlNcIik7XG4gIEBJbnB1dCgpIGdyb3Vwc1RhYlRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdST1VQU1wiKTtcbiAgQElucHV0KCkgdXNlcnNDb25maWd1cmF0aW9uOiBVc2Vyc0NvbmZpZ3VyYXRpb24gPSBuZXcgVXNlcnNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgZ3JvdXBzQ29uZmlndXJhdGlvbjogR3JvdXBzQ29uZmlndXJhdGlvbiA9IG5ldyBHcm91cHNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgb25TdWJtaXRCdXR0b25DbGljayE6ICh1c2Vycz86IENvbWV0Q2hhdC5Vc2VyW10sIGdyb3Vwcz86IENvbWV0Q2hhdC5Hcm91cFtdKSA9PiB2b2lkO1xuICBASW5wdXQoKSBjbG9zZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCJcbiAgQElucHV0KCkgY29udGFjdHNTdHlsZTogQ29udGFjdHNTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBvbkNsb3NlITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAodXNlcj86IENvbWV0Q2hhdC5Vc2VyLCBncm91cD86IENvbWV0Q2hhdC5Hcm91cCkgPT4gdm9pZDtcbiAgQElucHV0KCkgdGFiVmlzaWJpbGl0eTogVGFic1Zpc2liaWxpdHkgPSBUYWJzVmlzaWJpbGl0eS51c2Vyc0FuZEdyb3Vwc1xuICBASW5wdXQoKSBzZWxlY3Rpb25MaW1pdDogbnVtYmVyID0gNTtcbiAgQElucHV0KCkgdGFiczogQ29tZXRDaGF0VGFiSXRlbVtdID0gW11cbiAgQElucHV0KCkgaGlkZVN1Ym1pdEJ1dHRvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHN1Ym1pdEJ1dHRvblRleHQ6IHN0cmluZyA9IFwiU3VibWl0XCI7XG4gIHNlbGVjdGlvbjogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICAvLyBwdWJsaWMgcHJvcGVydGllc1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0QnVpbGRlcjogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgzMCkuaGlkZUJsb2NrZWRVc2Vycyh0cnVlKTtcbiAgcHVibGljIHVzZXJzU2VhcmNoUmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyKCkuc2V0TGltaXQoMzApLmhpZGVCbG9ja2VkVXNlcnModHJ1ZSk7XG4gIHB1YmxpYyBncm91cHNSZXF1ZXN0QnVpbGRlcjogQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlcigpLnNldExpbWl0KDMwKS5qb2luZWRPbmx5KHRydWUpO1xuICBwdWJsaWMgZ3JvdXBzU2VhcmNoUmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgzMCkuam9pbmVkT25seSh0cnVlKTtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7XG4gIH1cbiAgcHVibGljIHRhYkl0ZW1TdHlsZTogVGFiSXRlbVN0eWxlID0ge307XG4gIHB1YmxpYyB1c2Vyc0xpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgcHVibGljIGdyb3Vwc0xpc3Q6IENvbWV0Q2hhdC5Hcm91cFtdID0gW107XG4gIHB1YmxpYyBzdWJtaXRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDUxLCAxNTMsIDI1NSlcIixcbiAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIlwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgfVxuICBwdWJsaWMgY2xvc2VCdXR0b25TdHlsZTogYW55O1xuICBwdWJsaWMgd3JhcHBlclN0eWxlOiBhbnk7XG4gIHB1YmxpYyBjb250YWN0c1BhZGRpbmc6IGFueTtcbiAgcHVibGljIHRpdGxlU3R5bGU6IGFueSA9IHt9O1xuICBwdWJsaWMgZXJyb3JTdHlsZTogYW55ID0ge307XG4gIHB1YmxpYyBpc0xpbWl0UmVhY2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgdGFic1N0eWxlOiBCYXNlU3R5bGUgPSB7fTtcbiAgb25Hcm91cFNlbGVjdGVkID0gKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICB2YXIga2V5ID0gdGhpcy5ncm91cHNMaXN0LmZpbmRJbmRleCgobTogYW55KSA9PiBtPy5nZXRHdWlkKCkgPT09IGdyb3VwLmdldEd1aWQoKSk7XG4gICAgaWYgKGtleSA+PSAwKSB7XG4gICAgICB0aGlzLmdyb3Vwc0xpc3Quc3BsaWNlKGtleSwgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdC5wdXNoKGdyb3VwKTtcbiAgICB9XG4gICAgdGhpcy5pc0xpbWl0UmVhY2hlZCA9IHRoaXMuZ3JvdXBzTGlzdC5sZW5ndGggKyB0aGlzLnVzZXJzTGlzdC5sZW5ndGggPj0gdGhpcy5zZWxlY3Rpb25MaW1pdDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIG9uVXNlclNlbGVjdGVkID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy51c2Vyc0xpc3QuZmluZEluZGV4KChtOiBhbnkpID0+IG0/LmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpKTtcbiAgICBpZiAoa2V5ID49IDApIHtcbiAgICAgIHRoaXMudXNlcnNMaXN0LnNwbGljZShrZXksIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVzZXJzTGlzdC5wdXNoKHVzZXIpO1xuICAgIH1cbiAgICB0aGlzLmlzTGltaXRSZWFjaGVkID0gdGhpcy5ncm91cHNMaXN0Lmxlbmd0aCArIHRoaXMudXNlcnNMaXN0Lmxlbmd0aCA+PSB0aGlzLnNlbGVjdGlvbkxpbWl0O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRjb250YWN0c1N0eWxlKCk7XG4gICAgdGhpcy51c2Vyc0xpc3QgPSBbXVxuICAgIHRoaXMuZ3JvdXBzTGlzdCA9IFtdXG4gIH1cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIGlmICh0aGlzLnRhYnM/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICBpZiAodGhpcy50YWJWaXNpYmlsaXR5ID09IFRhYnNWaXNpYmlsaXR5LnVzZXJzQW5kR3JvdXBzKSB7XG4gICAgICAgIHRoaXMudGFicyA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjaGlsZFZpZXc6IHRoaXMudXNlcnNSZWYsXG4gICAgICAgICAgICB0aXRsZTogdGhpcy51c2Vyc1RhYlRpdGxlLFxuICAgICAgICAgICAgaWQ6IFwidXNlcnNcIixcbiAgICAgICAgICAgIHN0eWxlOiB0aGlzLnRhYkl0ZW1TdHlsZVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2hpbGRWaWV3OiB0aGlzLmdyb3Vwc1JlZixcbiAgICAgICAgICAgIHRpdGxlOiB0aGlzLmdyb3Vwc1RhYlRpdGxlLFxuICAgICAgICAgICAgaWQ6IFwiZ3JvdXBzXCIsXG4gICAgICAgICAgICBzdHlsZTogdGhpcy50YWJJdGVtU3R5bGVcbiAgICAgICAgICB9XVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLnRhYlZpc2liaWxpdHkgPT0gVGFic1Zpc2liaWxpdHkudXNlcnMpIHtcbiAgICAgICAgICB0aGlzLnRhYnMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNoaWxkVmlldzogdGhpcy51c2Vyc1JlZixcbiAgICAgICAgICAgICAgdGl0bGU6IHRoaXMudXNlcnNUYWJUaXRsZSxcbiAgICAgICAgICAgICAgaWQ6IFwidXNlcnNcIixcbiAgICAgICAgICAgICAgc3R5bGU6IHRoaXMudGFiSXRlbVN0eWxlXG4gICAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMudGFicyA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2hpbGRWaWV3OiB0aGlzLmdyb3Vwc1JlZixcbiAgICAgICAgICAgICAgdGl0bGU6IHRoaXMuZ3JvdXBzVGFiVGl0bGUsXG4gICAgICAgICAgICAgIGlkOiBcImdyb3Vwc1wiLFxuICAgICAgICAgICAgICBzdHlsZTogdGhpcy50YWJJdGVtU3R5bGVcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgIH1cbiAgfVxuICB1c2VyQ2xpY2tlZCA9ICh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKHVzZXIpXG4gICAgfVxuICB9XG4gIGdyb3VwQ2xpY2tlZCA9IChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2sodW5kZWZpbmVkLCBncm91cClcbiAgICB9XG4gIH1cbiAgY2xvc2VDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uQ2xvc2UpIHtcbiAgICAgIHRoaXMub25DbG9zZSgpXG4gICAgfVxuICB9XG4gIHN1Ym1pdENsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25TdWJtaXRCdXR0b25DbGljaykge1xuICAgICAgdGhpcy5vblN1Ym1pdEJ1dHRvbkNsaWNrKHRoaXMudXNlcnNMaXN0LCB0aGlzLmdyb3Vwc0xpc3QpXG4gICAgfVxuICB9XG4gIHNldGNvbnRhY3RzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29udGFjdHNTdHlsZSA9IG5ldyBDb250YWN0c1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwibm9uZVwiLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBzdWJtaXRCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1Ym1pdEJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIHN1Ym1pdEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiLFxuICAgICAgdGFiQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGFiVGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRhYlRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlVGFiVGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGFjdGl2ZVRhYlRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImxpZ2h0XCIpLFxuICAgICAgYWN0aXZlVGFiQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGFjdGl2ZVRhYkJvcmRlcjogXCJub25lXCIsXG4gICAgICB0YWJIZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHRhYldpZHRoOiBcIjEwMCVcIlxuICAgIH0pXG4gICAgdGhpcy5jb250YWN0c1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuY29udGFjdHNTdHlsZSB9XG4gICAgdGhpcy5zdWJtaXRCdXR0b25TdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5jb250YWN0c1N0eWxlLnN1Ym1pdEJ1dHRvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5zdWJtaXRCdXR0b25TdHlsZS5idXR0b25UZXh0Rm9udCA9IHRoaXMuY29udGFjdHNTdHlsZS5zdWJtaXRCdXR0b25UZXh0Rm9udDtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvblN0eWxlLmJ1dHRvblRleHRDb2xvciA9IHRoaXMuY29udGFjdHNTdHlsZS5zdWJtaXRCdXR0b25UZXh0Q29sb3I7XG4gICAgdGhpcy50YWJzU3R5bGUgPSB7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWBcbiAgICB9XG4gICAgdGhpcy50YWJJdGVtU3R5bGUgPSBuZXcgVGFiSXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogdGhpcy5jb250YWN0c1N0eWxlLnRhYkhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLmNvbnRhY3RzU3R5bGUudGFiV2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmNvbnRhY3RzU3R5bGUudGFiQmFja2dyb3VuZCxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMuY29udGFjdHNTdHlsZS5hY3RpdmVUYWJCYWNrZ3JvdW5kLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuY29udGFjdHNTdHlsZS50YWJUaXRsZVRleHRDb2xvcixcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMuY29udGFjdHNTdHlsZS50YWJUaXRsZVRleHRGb250LFxuICAgICAgYWN0aXZlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYWN0aXZlVGl0bGVUZXh0Q29sb3I6IHRoaXMuY29udGFjdHNTdHlsZS5hY3RpdmVUYWJUaXRsZVRleHRDb2xvcixcbiAgICAgIGFjdGl2ZVRpdGxlVGV4dEZvbnQ6IHRoaXMuY29udGFjdHNTdHlsZS5hY3RpdmVUYWJUaXRsZVRleHRGb250LFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gICAgfSlcbiAgICB0aGlzLmNsb3NlQnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5jb250YWN0c1N0eWxlLmNsb3NlSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICB9XG4gICAgdGhpcy53cmFwcGVyU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IHRoaXMuY29udGFjdHNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5jb250YWN0c1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jb250YWN0c1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY29udGFjdHNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY29udGFjdHNTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gICAgdGhpcy5jb250YWN0c1BhZGRpbmcgPSB7XG4gICAgICBwYWRkaW5nOiB0aGlzLmNvbnRhY3RzU3R5bGUucGFkZGluZ1xuICAgIH1cbiAgICB0aGlzLnRpdGxlU3R5bGUgPSB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5jb250YWN0c1N0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMuY29udGFjdHNTdHlsZS50aXRsZVRleHRDb2xvclxuICAgIH1cbiAgICB0aGlzLmVycm9yU3R5bGUgPSB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5jb250YWN0c1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5jb250YWN0c1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3JcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1jb250YWN0c1wiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udGFjdHMtdGl0bGVcIj5cbiAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cInRpdGxlXCIgW2xhYmVsU3R5bGVdPVwidGl0bGVTdHlsZVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWNvbnRhY3RzLWVycm9yXCIgKm5nSWY9XCJpc0xpbWl0UmVhY2hlZFwiPlxuICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwiJ21heCBsaW1pdCBoYXMgcmVhY2hlZCdcIlxuICAgICAgW2xhYmVsU3R5bGVdPVwiZXJyb3JTdHlsZVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWNvbnRhY3RzX193cmFwcGVyXCIgW25nU3R5bGVdPVwiY29udGFjdHNQYWRkaW5nXCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLXRhYnNcIj5cbiAgICAgIDxjb21ldGNoYXQtdGFicyBbdGFic109XCJ0YWJzXCIgW3RhYnNTdHlsZV09XCJ0YWJzU3R5bGVcIiBba2VlcEFsaXZlXT1cInRydWVcIj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICN1c2Vyc1JlZj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXVzZXJzIFtvbkl0ZW1DbGlja109XCJ1c2VyQ2xpY2tlZFwiXG4gICAgICAgICAgICBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24udXNlcnNSZXF1ZXN0QnVpbGRlciB8fCB1c2Vyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgICAgICAgIFtoaWRlU2VhcmNoXT1cInVzZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICAgICAgICAgIFtTdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgICAgICAgICAgW2F2YXRhclN0eWxlXT1cInVzZXJzQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICAgICAgICBbc2VhcmNoSWNvblVSTF09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgICAgICAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNDb25maWd1cmF0aW9uLnNlYXJjaFJlcXVlc3RCdWlsZGVyIHx8IHVzZXJzU2VhcmNoUmVxdWVzdEJ1aWxkZXJcIlxuICAgICAgICAgICAgW3VzZXJzU3R5bGVdPVwidXNlcnNDb25maWd1cmF0aW9uLnVzZXJzU3R5bGVcIlxuICAgICAgICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgICAgICAgIFtvcHRpb25zXT1cInVzZXJzQ29uZmlndXJhdGlvbi5vcHRpb25zXCJcbiAgICAgICAgICAgIFtlbXB0eVN0YXRlVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW29uU2VsZWN0XT1cInVzZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdCB8fCBvblVzZXJTZWxlY3RlZFwiXG4gICAgICAgICAgICBbbG9hZGluZ0ljb25VUkxdPVwidXNlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgICAgIFtlcnJvclN0YXRlVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW2xpc3RJdGVtVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1WaWV3XCJcbiAgICAgICAgICAgIFttZW51XT1cInVzZXJzQ29uZmlndXJhdGlvbi5tZW51XCJcbiAgICAgICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cInVzZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VwYXJhdG9yXCJcbiAgICAgICAgICAgIFtoaWRlRXJyb3JdPVwidXNlcnNDb25maWd1cmF0aW9uLmhpZGVFcnJvclwiXG4gICAgICAgICAgICBbc2VsZWN0aW9uTW9kZV09XCIgc2VsZWN0aW9uTW9kZVwiIFt0aXRsZV09XCInJ1wiPjwvY29tZXRjaGF0LXVzZXJzPlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8bmctdGVtcGxhdGUgI2dyb3Vwc1JlZj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWdyb3VwcyBbb25JdGVtQ2xpY2tdPVwiZ3JvdXBDbGlja2VkXCJcbiAgICAgICAgICAgIFtncm91cHNSZXF1ZXN0QnVpbGRlcl09XCJncm91cHNDb25maWd1cmF0aW9uLmdyb3Vwc1JlcXVlc3RCdWlsZGVyIHx8IGdyb3Vwc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgICAgICAgIFtoaWRlU2VhcmNoXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uaGlkZVNlYXJjaFwiXG4gICAgICAgICAgICBbU3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICAgICAgICBbc2VhcmNoSWNvblVSTF09XCJncm91cHNDb25maWd1cmF0aW9uLnNlYXJjaEljb25VUkxcIlxuICAgICAgICAgICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uc2VhcmNoUmVxdWVzdEJ1aWxkZXIgfHwgZ3JvdXBzU2VhcmNoUmVxdWVzdEJ1aWxkZXJcIlxuICAgICAgICAgICAgW2dyb3Vwc1N0eWxlXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uZ3JvdXBzU3R5bGVcIlxuICAgICAgICAgICAgW3N1YnRpdGxlVmlld109XCJncm91cHNDb25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiXG4gICAgICAgICAgICBbb3B0aW9uc109XCJncm91cHNDb25maWd1cmF0aW9uLm9wdGlvbnNcIlxuICAgICAgICAgICAgW2VtcHR5U3RhdGVWaWV3XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW29uU2VsZWN0XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24ub25TZWxlY3QgfHwgb25Hcm91cFNlbGVjdGVkXCJcbiAgICAgICAgICAgIFtsb2FkaW5nSWNvblVSTF09XCJncm91cHNDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgICAgIFtlcnJvclN0YXRlVmlld109XCJncm91cHNDb25maWd1cmF0aW9uLmVycm9yU3RhdGVWaWV3XCJcbiAgICAgICAgICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgICAgICAgICBbbGlzdEl0ZW1WaWV3XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1WaWV3XCJcbiAgICAgICAgICAgIFttZW51XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24ubWVudVwiXG4gICAgICAgICAgICBbaGlkZVNlcGFyYXRvcl09XCJncm91cHNDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgICAgICAgICAgW2hpZGVFcnJvcl09XCJncm91cHNDb25maWd1cmF0aW9uLmhpZGVFcnJvclwiXG4gICAgICAgICAgICBbc2VsZWN0aW9uTW9kZV09XCJzZWxlY3Rpb25Nb2RlXCIgW3RpdGxlXT1cIicnXCI+PC9jb21ldGNoYXQtZ3JvdXBzPlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9jb21ldGNoYXQtdGFicz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtY29udGFjdHNfX2J1dHRvbnNcIiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9uLm5vbmVcIj5cbiAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtkaXNhYmxlZF09XCJpc0xpbWl0UmVhY2hlZFwiXG4gICAgICAgIGNsYXNzPVwiY2MtY29udGFjdHNfX2J1dHRvbnMtLWFkZFwiIFt0ZXh0XT1cInN1Ym1pdEJ1dHRvblRleHRcIlxuICAgICAgICBbYnV0dG9uU3R5bGVdPVwic3VibWl0QnV0dG9uU3R5bGVcIlxuICAgICAgICAoY2xpY2spPVwic3VibWl0Q2xpY2tlZCgpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWNsb3NlLWJ1dHRvblwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImNsb3NlSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJjbG9zZUJ1dHRvblN0eWxlXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJjbG9zZUNsaWNrZWQoKVwiPlxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdfQ==