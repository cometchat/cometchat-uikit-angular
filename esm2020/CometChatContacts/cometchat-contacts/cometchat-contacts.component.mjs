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
            this.isLimitReached = this.groupsList.length + this.usersList.length > this.selectionLimit;
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
CometChatContactsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatContactsComponent, selector: "cometchat-contacts", inputs: { title: "title", usersTabTitle: "usersTabTitle", groupsTabTitle: "groupsTabTitle", usersConfiguration: "usersConfiguration", groupsConfiguration: "groupsConfiguration", onSubmitButtonClick: "onSubmitButtonClick", closeIconURL: "closeIconURL", contactsStyle: "contactsStyle", selectionMode: "selectionMode", onClose: "onClose", onItemClick: "onItemClick", tabVisibility: "tabVisibility", selectionLimit: "selectionLimit", tabs: "tabs", hideSubmitButton: "hideSubmitButton", submitButtonText: "submitButtonText" }, viewQueries: [{ propertyName: "usersRef", first: true, predicate: ["usersRef"], descendants: true }, { propertyName: "groupsRef", first: true, predicate: ["groupsRef"], descendants: true }], ngImport: i0, template: "<div class=\"cc-contacts\" [ngStyle]=\"wrapperStyle\">\n  <div class=\"cc-contacts-title\">\n    <cometchat-label [text]=\"title\" [labelStyle]=\"titleStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts-error\" *ngIf=\"isLimitReached\">\n    <cometchat-label [text]=\"'max limit has reached'\"\n      [labelStyle]=\"errorStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts__wrapper\" [ngStyle]=\"contactsPadding\">\n    <div class=\"cc-tabs\">\n      <cometchat-tabs [tabs]=\"tabs\" [tabsStyle]=\"tabsStyle\" [keepAlive]=\"true\">\n        <ng-template #usersRef>\n          <cometchat-users [onItemClick]=\"usersConfiguration.onItemClick || userClicked\"\n            [usersRequestBuilder]=\"usersConfiguration.usersRequestBuilder || usersRequestBuilder\"\n            [hideSearch]=\"usersConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"usersConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"usersConfiguration.avatarStyle\"\n            [searchIconURL]=\"usersConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"usersConfiguration.searchRequestBuilder || usersSearchRequestBuilder\"\n            [usersStyle]=\"usersConfiguration.usersStyle\"\n            [subtitleView]=\"usersConfiguration.subtitleView\"\n            [options]=\"usersConfiguration.options\"\n            [emptyStateView]=\"usersConfiguration.emptyStateView\"\n            [onSelect]=\"usersConfiguration.onSelect || onUserSelected\"\n            [loadingIconURL]=\"usersConfiguration.loadingIconURL\"\n            [errorStateView]=\"usersConfiguration.errorStateView\"\n            [loadingStateView]=\"usersConfiguration.loadingStateView\"\n            [listItemView]=\"usersConfiguration.listItemView\"\n            [menu]=\"usersConfiguration.menu\"\n            [hideSeparator]=\"usersConfiguration.hideSeparator\"\n            [hideError]=\"usersConfiguration.hideError\"\n            [selectionMode]=\"selectionMode\" [title]=\"''\"\n            [disableUsersPresence]=\"usersConfiguration.disableUsersPresence\"\n            ></cometchat-users>\n        </ng-template>\n        <ng-template #groupsRef>\n          <cometchat-groups [onItemClick]=\"groupsConfiguration.onItemClick || groupClicked\"\n            [groupsRequestBuilder]=\"groupsConfiguration.groupsRequestBuilder || groupsRequestBuilder\"\n            [hideSearch]=\"groupsConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"groupsConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"groupsConfiguration.avatarStyle\"\n            [searchIconURL]=\"groupsConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"groupsConfiguration.searchRequestBuilder || groupsSearchRequestBuilder\"\n            [groupsStyle]=\"groupsConfiguration.groupsStyle\"\n            [subtitleView]=\"groupsConfiguration.subtitleView\"\n            [options]=\"groupsConfiguration.options\"\n            [emptyStateView]=\"groupsConfiguration.emptyStateView\"\n            [onSelect]=\"groupsConfiguration.onSelect || onGroupSelected\"\n            [loadingIconURL]=\"groupsConfiguration.loadingIconURL\"\n            [errorStateView]=\"groupsConfiguration.errorStateView\"\n            [loadingStateView]=\"groupsConfiguration.loadingStateView\"\n            [listItemView]=\"groupsConfiguration.listItemView\"\n            [menu]=\"groupsConfiguration.menu\"\n            [hideSeparator]=\"groupsConfiguration.hideSeparator\"\n            [hideError]=\"groupsConfiguration.hideError\"\n            [selectionMode]=\"selectionMode\" [title]=\"''\"></cometchat-groups>\n        </ng-template>\n      </cometchat-tabs>\n    </div>\n    <div class=\"cc-contacts__buttons\" *ngIf=\"selectionMode != selection.none && !hideSubmitButton\">\n      <cometchat-button [disabled]=\"isLimitReached\"\n        class=\"cc-contacts__buttons--add\" [text]=\"submitButtonText\"\n        [buttonStyle]=\"submitButtonStyle\"\n        (click)=\"submitClicked()\"></cometchat-button>\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeIconURL\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"closeClicked()\">\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-contacts{display:flex;height:100%;width:100%;overflow:hidden;flex-direction:column}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-contacts__wrapper{height:100%;padding:8px;overflow:hidden;display:flex;flex-direction:column}.cc-close-button{position:absolute;right:8px;padding:8px}.cc-contacts__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-contacts__buttons--add{height:42px;width:100%}.cc-tabs{display:flex;height:100%;width:100%;overflow:hidden}cometchat-tabs{height:100%;width:100%}.cc-contacts-title,.cc-contacts-error{display:flex;align-items:center;justify-content:center;height:-moz-fit-content;height:fit-content;width:100%;padding:8px 0}\n"], components: [{ type: i2.CometChatTabsComponent, selector: "cometchat-tabs", inputs: ["tabAlignment", "disableDragging", "tabsStyle", "tabs", "keepAlive"] }, { type: i3.CometChatUsersComponent, selector: "cometchat-users", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "disableUsersPresence", "listItemView", "menu", "options", "activeUser", "hideSeparator", "searchPlaceholder", "hideError", "selectionMode", "searchIconURL", "hideSearch", "title", "onError", "emptyStateView", "onSelect", "errorStateView", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "usersStyle", "listItemStyle", "statusIndicatorStyle", "avatarStyle", "onItemClick", "searchKeyword", "onEmpty", "userPresencePlacement", "disableLoadingState"] }, { type: i4.CometChatGroupsComponent, selector: "cometchat-groups", inputs: ["groupsRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "menu", "options", "activeGroup", "hideSeparator", "selectionMode", "searchPlaceholder", "hideError", "searchIconURL", "hideSearch", "title", "onError", "onSelect", "emptyStateView", "errorStateView", "loadingIconURL", "privateGroupIcon", "protectedGroupIcon", "passwordGroupIcon", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "statusIndicatorStyle", "avatarStyle", "groupsStyle", "listItemStyle", "onItemClick"] }], directives: [{ type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatContactsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-contacts", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-contacts\" [ngStyle]=\"wrapperStyle\">\n  <div class=\"cc-contacts-title\">\n    <cometchat-label [text]=\"title\" [labelStyle]=\"titleStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts-error\" *ngIf=\"isLimitReached\">\n    <cometchat-label [text]=\"'max limit has reached'\"\n      [labelStyle]=\"errorStyle\"></cometchat-label>\n  </div>\n  <div class=\"cc-contacts__wrapper\" [ngStyle]=\"contactsPadding\">\n    <div class=\"cc-tabs\">\n      <cometchat-tabs [tabs]=\"tabs\" [tabsStyle]=\"tabsStyle\" [keepAlive]=\"true\">\n        <ng-template #usersRef>\n          <cometchat-users [onItemClick]=\"usersConfiguration.onItemClick || userClicked\"\n            [usersRequestBuilder]=\"usersConfiguration.usersRequestBuilder || usersRequestBuilder\"\n            [hideSearch]=\"usersConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"usersConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"usersConfiguration.avatarStyle\"\n            [searchIconURL]=\"usersConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"usersConfiguration.searchRequestBuilder || usersSearchRequestBuilder\"\n            [usersStyle]=\"usersConfiguration.usersStyle\"\n            [subtitleView]=\"usersConfiguration.subtitleView\"\n            [options]=\"usersConfiguration.options\"\n            [emptyStateView]=\"usersConfiguration.emptyStateView\"\n            [onSelect]=\"usersConfiguration.onSelect || onUserSelected\"\n            [loadingIconURL]=\"usersConfiguration.loadingIconURL\"\n            [errorStateView]=\"usersConfiguration.errorStateView\"\n            [loadingStateView]=\"usersConfiguration.loadingStateView\"\n            [listItemView]=\"usersConfiguration.listItemView\"\n            [menu]=\"usersConfiguration.menu\"\n            [hideSeparator]=\"usersConfiguration.hideSeparator\"\n            [hideError]=\"usersConfiguration.hideError\"\n            [selectionMode]=\"selectionMode\" [title]=\"''\"\n            [disableUsersPresence]=\"usersConfiguration.disableUsersPresence\"\n            ></cometchat-users>\n        </ng-template>\n        <ng-template #groupsRef>\n          <cometchat-groups [onItemClick]=\"groupsConfiguration.onItemClick || groupClicked\"\n            [groupsRequestBuilder]=\"groupsConfiguration.groupsRequestBuilder || groupsRequestBuilder\"\n            [hideSearch]=\"groupsConfiguration.hideSearch\"\n            [StatusIndicatorStyle]=\"groupsConfiguration.statusIndicatorStyle\"\n            [avatarStyle]=\"groupsConfiguration.avatarStyle\"\n            [searchIconURL]=\"groupsConfiguration.searchIconURL\"\n            [searchRequestBuilder]=\"groupsConfiguration.searchRequestBuilder || groupsSearchRequestBuilder\"\n            [groupsStyle]=\"groupsConfiguration.groupsStyle\"\n            [subtitleView]=\"groupsConfiguration.subtitleView\"\n            [options]=\"groupsConfiguration.options\"\n            [emptyStateView]=\"groupsConfiguration.emptyStateView\"\n            [onSelect]=\"groupsConfiguration.onSelect || onGroupSelected\"\n            [loadingIconURL]=\"groupsConfiguration.loadingIconURL\"\n            [errorStateView]=\"groupsConfiguration.errorStateView\"\n            [loadingStateView]=\"groupsConfiguration.loadingStateView\"\n            [listItemView]=\"groupsConfiguration.listItemView\"\n            [menu]=\"groupsConfiguration.menu\"\n            [hideSeparator]=\"groupsConfiguration.hideSeparator\"\n            [hideError]=\"groupsConfiguration.hideError\"\n            [selectionMode]=\"selectionMode\" [title]=\"''\"></cometchat-groups>\n        </ng-template>\n      </cometchat-tabs>\n    </div>\n    <div class=\"cc-contacts__buttons\" *ngIf=\"selectionMode != selection.none && !hideSubmitButton\">\n      <cometchat-button [disabled]=\"isLimitReached\"\n        class=\"cc-contacts__buttons--add\" [text]=\"submitButtonText\"\n        [buttonStyle]=\"submitButtonStyle\"\n        (click)=\"submitClicked()\"></cometchat-button>\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeIconURL\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"closeClicked()\">\n    </cometchat-button>\n  </div>\n</div>\n", styles: [".cc-contacts{display:flex;height:100%;width:100%;overflow:hidden;flex-direction:column}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-contacts__wrapper{height:100%;padding:8px;overflow:hidden;display:flex;flex-direction:column}.cc-close-button{position:absolute;right:8px;padding:8px}.cc-contacts__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-contacts__buttons--add{height:42px;width:100%}.cc-tabs{display:flex;height:100%;width:100%;overflow:hidden}cometchat-tabs{height:100%;width:100%}.cc-contacts-title,.cc-contacts-error{display:flex;align-items:center;justify-content:center;height:-moz-fit-content;height:fit-content;width:100%;padding:8px 0}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnRhY3RzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udGFjdHMvY29tZXRjaGF0LWNvbnRhY3RzL2NvbWV0Y2hhdC1jb250YWN0cy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdENvbnRhY3RzL2NvbWV0Y2hhdC1jb250YWN0cy9jb21ldGNoYXQtY29udGFjdHMuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBVSxLQUFLLEVBQXFCLHVCQUF1QixFQUFlLFNBQVMsRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBYSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDMUgsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBb0IsY0FBYyxFQUFFLGFBQWEsRUFBRSxNQUFNLDRCQUE0QixDQUFBOzs7Ozs7O0FBRWxIOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLDBCQUEwQjtJQXlCckMsWUFBb0IsR0FBc0IsRUFBVSxZQUFtQztRQUFuRSxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQXRCOUUsVUFBSyxHQUFXLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyQyxrQkFBYSxHQUFXLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQyxtQkFBYyxHQUFXLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1Qyx1QkFBa0IsR0FBdUIsSUFBSSxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRSx3QkFBbUIsR0FBd0IsSUFBSSxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV2RSxpQkFBWSxHQUFXLG9CQUFvQixDQUFBO1FBQzNDLGtCQUFhLEdBQWtCLEVBQUUsQ0FBQztRQUNsQyxrQkFBYSxHQUFrQixhQUFhLENBQUMsSUFBSSxDQUFDO1FBR2xELGtCQUFhLEdBQW1CLGNBQWMsQ0FBQyxjQUFjLENBQUE7UUFDN0QsbUJBQWMsR0FBVyxDQUFDLENBQUM7UUFDM0IsU0FBSSxHQUF1QixFQUFFLENBQUE7UUFDN0IscUJBQWdCLEdBQVksSUFBSSxDQUFDO1FBQ2pDLHFCQUFnQixHQUFXLFFBQVEsQ0FBQztRQUM3QyxjQUFTLEdBQXlCLGFBQWEsQ0FBQztRQUNoRCxvQkFBb0I7UUFDYix3QkFBbUIsR0FBa0MsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0gsOEJBQXlCLEdBQWtDLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25JLHlCQUFvQixHQUFtQyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUgsK0JBQTBCLEdBQW1DLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUdoSSxpQkFBWSxHQUFpQixFQUFFLENBQUM7UUFDaEMsY0FBUyxHQUFxQixFQUFFLENBQUM7UUFDakMsZUFBVSxHQUFzQixFQUFFLENBQUM7UUFDbkMsc0JBQWlCLEdBQVE7WUFDOUIsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLFVBQVUsRUFBRSxtQkFBbUI7WUFDL0IsT0FBTyxFQUFFLEtBQUs7WUFDZCxlQUFlLEVBQUUsT0FBTztZQUN4QixjQUFjLEVBQUUsRUFBRTtZQUNsQixPQUFPLEVBQUUsTUFBTTtZQUNmLGNBQWMsRUFBRSxRQUFRO1lBQ3hCLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsWUFBWSxFQUFFLEtBQUs7U0FDcEIsQ0FBQTtRQUlNLGVBQVUsR0FBUSxFQUFFLENBQUM7UUFDckIsZUFBVSxHQUFRLEVBQUUsQ0FBQztRQUNyQixtQkFBYyxHQUFZLEtBQUssQ0FBQztRQUNoQyxjQUFTLEdBQWMsRUFBRSxDQUFDO1FBQ2pDLG9CQUFlLEdBQUcsQ0FBQyxLQUFzQixFQUFFLEVBQUU7WUFDM0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNsRixJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ2hDO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQzdCO1lBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQzVGLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDO1FBQ0YsbUJBQWMsR0FBRyxDQUFDLElBQW9CLEVBQUUsRUFBRTtZQUN4QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ2hGLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRTtnQkFDWixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDL0I7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0I7WUFDRCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDM0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUM7UUErQ0YsZ0JBQVcsR0FBRyxDQUFDLElBQW9CLEVBQUUsRUFBRTtZQUNyQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7YUFDdkI7UUFDSCxDQUFDLENBQUE7UUFDRCxpQkFBWSxHQUFHLENBQUMsS0FBc0IsRUFBRSxFQUFFO1lBQ3hDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUE7YUFDbkM7UUFDSCxDQUFDLENBQUE7SUFuR0QsQ0FBQztJQTRDRCxRQUFRO1FBRU4sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFDbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUE7SUFDdEIsQ0FBQztJQUNELGVBQWU7UUFDYixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUMxQixJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksY0FBYyxDQUFDLGNBQWMsRUFBRTtnQkFDdkQsSUFBSSxDQUFDLElBQUksR0FBRztvQkFDVjt3QkFDRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVE7d0JBQ3hCLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYTt3QkFDekIsRUFBRSxFQUFFLE9BQU87d0JBQ1gsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZO3FCQUN6QjtvQkFDRDt3QkFDRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7d0JBQ3pCLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYzt3QkFDMUIsRUFBRSxFQUFFLFFBQVE7d0JBQ1osS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZO3FCQUN6QjtpQkFBQyxDQUFBO2FBQ0w7aUJBQ0k7Z0JBQ0gsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7b0JBQzlDLElBQUksQ0FBQyxJQUFJLEdBQUc7d0JBQ1Y7NEJBQ0UsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFROzRCQUN4QixLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWE7NEJBQ3pCLEVBQUUsRUFBRSxPQUFPOzRCQUNYLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWTt5QkFDekI7cUJBQUMsQ0FBQTtpQkFDTDtxQkFDSTtvQkFDSCxJQUFJLENBQUMsSUFBSSxHQUFHO3dCQUNWOzRCQUNFLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUzs0QkFDekIsS0FBSyxFQUFFLElBQUksQ0FBQyxjQUFjOzRCQUMxQixFQUFFLEVBQUUsUUFBUTs0QkFDWixLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVk7eUJBQ3pCO3FCQUFDLENBQUE7aUJBQ0w7YUFDRjtZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7U0FDekI7SUFDSCxDQUFDO0lBV0QsWUFBWTtRQUNWLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7U0FDZjtJQUNILENBQUM7SUFDRCxhQUFhO1FBQ1gsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1NBQzFEO0lBQ0gsQ0FBQztJQUNELGdCQUFnQjtRQUNkLElBQUksWUFBWSxHQUFrQixJQUFJLGFBQWEsQ0FBQztZQUNsRCxVQUFVLEVBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUM1RCxNQUFNLEVBQUUsTUFBTTtZQUNkLGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUNwRSxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUMzRCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQy9ELGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ3pFLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxZQUFZLEVBQUUsTUFBTTtZQUNwQixhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUMzRCxzQkFBc0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQ3BFLHFCQUFxQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDO1lBQzVFLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQzlFLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLGFBQWEsRUFBRSxhQUFhO1lBQzVCLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3RFLGlCQUFpQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDOUQsc0JBQXNCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDNUUsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDM0UsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUM7WUFDMUUsZUFBZSxFQUFFLE1BQU07WUFDdkIsU0FBUyxFQUFFLGFBQWE7WUFDeEIsUUFBUSxFQUFFLE1BQU07U0FDakIsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO1FBQy9ELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQztRQUM5RSxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUM7UUFDaEYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDO1FBQ2xGLElBQUksQ0FBQyxTQUFTLEdBQUc7WUFDZixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUMxRCxZQUFZLEVBQUUsS0FBSztZQUNuQixNQUFNLEVBQUUsYUFBYSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUU7U0FDckUsQ0FBQTtRQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUM7WUFDbkMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUztZQUNwQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRO1lBQ2xDLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWE7WUFDNUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUI7WUFDeEQsY0FBYyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsaUJBQWlCO1lBQ3BELGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQjtZQUNsRCxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUM1RCxvQkFBb0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLHVCQUF1QjtZQUNoRSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLHNCQUFzQjtZQUM5RCxZQUFZLEVBQUUsS0FBSztTQUNwQixDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsZ0JBQWdCLEdBQUc7WUFDdEIsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxNQUFNO1lBQ2QsWUFBWSxFQUFFLEdBQUc7WUFDakIsVUFBVSxFQUFFLGFBQWE7WUFDekIsY0FBYyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7U0FDakcsQ0FBQTtRQUNELElBQUksQ0FBQyxZQUFZLEdBQUc7WUFDbEIsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUNqQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLO1lBQy9CLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVU7WUFDekMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUNqQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZO1NBQzlDLENBQUE7UUFDRCxJQUFJLENBQUMsZUFBZSxHQUFHO1lBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDcEMsQ0FBQTtRQUNELElBQUksQ0FBQyxVQUFVLEdBQUc7WUFDaEIsUUFBUSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYTtZQUMxQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjO1NBQzdDLENBQUE7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHO1lBQ2hCLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQjtZQUMvQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUI7U0FDbEQsQ0FBQTtJQUNILENBQUM7O3dIQWpOVSwwQkFBMEI7NEdBQTFCLDBCQUEwQixtd0JDckJ2Qyx3b0lBd0VBOzRGRG5EYSwwQkFBMEI7a0JBTnRDLFNBQVM7K0JBQ0Usb0JBQW9CLG1CQUdiLHVCQUF1QixDQUFDLE1BQU07NElBR3hCLFFBQVE7c0JBQTlCLFNBQVM7dUJBQUMsVUFBVTtnQkFDRyxTQUFTO3NCQUFoQyxTQUFTO3VCQUFDLFdBQVc7Z0JBQ2IsS0FBSztzQkFBYixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgSW5wdXQsIENoYW5nZURldGVjdG9yUmVmLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVGVtcGxhdGVSZWYsIFZpZXdDaGlsZCwgQWZ0ZXJWaWV3SW5pdCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBCYXNlU3R5bGUsIEdyb3Vwc0NvbmZpZ3VyYXRpb24sIFVzZXJzQ29uZmlndXJhdGlvbiwgVGFiSXRlbVN0eWxlLCBDb250YWN0c1N0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdFRhYkl0ZW0sIFRhYnNWaXNpYmlsaXR5LCBTZWxlY3Rpb25Nb2RlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnXG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdENvbnRhY3RzQ29tcG9uZW50IGlzIHVzZWQgdG8gcmVuZGVyIGdyb3VwIG1lbWJlcnMgdG8gYWRkXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWNvbnRhY3RzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNvbnRhY3RzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY29udGFjdHMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDb250YWN0c0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgQWZ0ZXJWaWV3SW5pdCB7XG4gIEBWaWV3Q2hpbGQoXCJ1c2Vyc1JlZlwiKSB1c2Vyc1JlZiE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJncm91cHNSZWZcIikgZ3JvdXBzUmVmITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiTkVXX0NIQVRcIik7XG4gIEBJbnB1dCgpIHVzZXJzVGFiVGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiVVNFUlNcIik7XG4gIEBJbnB1dCgpIGdyb3Vwc1RhYlRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdST1VQU1wiKTtcbiAgQElucHV0KCkgdXNlcnNDb25maWd1cmF0aW9uOiBVc2Vyc0NvbmZpZ3VyYXRpb24gPSBuZXcgVXNlcnNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgZ3JvdXBzQ29uZmlndXJhdGlvbjogR3JvdXBzQ29uZmlndXJhdGlvbiA9IG5ldyBHcm91cHNDb25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgb25TdWJtaXRCdXR0b25DbGljayE6ICh1c2Vycz86IENvbWV0Q2hhdC5Vc2VyW10sIGdyb3Vwcz86IENvbWV0Q2hhdC5Hcm91cFtdKSA9PiB2b2lkO1xuICBASW5wdXQoKSBjbG9zZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCJcbiAgQElucHV0KCkgY29udGFjdHNTdHlsZTogQ29udGFjdHNTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBvbkNsb3NlITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAodXNlcj86IENvbWV0Q2hhdC5Vc2VyLCBncm91cD86IENvbWV0Q2hhdC5Hcm91cCkgPT4gdm9pZDtcbiAgQElucHV0KCkgdGFiVmlzaWJpbGl0eTogVGFic1Zpc2liaWxpdHkgPSBUYWJzVmlzaWJpbGl0eS51c2Vyc0FuZEdyb3Vwc1xuICBASW5wdXQoKSBzZWxlY3Rpb25MaW1pdDogbnVtYmVyID0gNTtcbiAgQElucHV0KCkgdGFiczogQ29tZXRDaGF0VGFiSXRlbVtdID0gW11cbiAgQElucHV0KCkgaGlkZVN1Ym1pdEJ1dHRvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHN1Ym1pdEJ1dHRvblRleHQ6IHN0cmluZyA9IFwiU3VibWl0XCI7XG4gIHNlbGVjdGlvbjogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICAvLyBwdWJsaWMgcHJvcGVydGllc1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0QnVpbGRlcjogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgzMCkuaGlkZUJsb2NrZWRVc2Vycyh0cnVlKTtcbiAgcHVibGljIHVzZXJzU2VhcmNoUmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyKCkuc2V0TGltaXQoMzApLmhpZGVCbG9ja2VkVXNlcnModHJ1ZSk7XG4gIHB1YmxpYyBncm91cHNSZXF1ZXN0QnVpbGRlcjogQ29tZXRDaGF0Lkdyb3Vwc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlcigpLnNldExpbWl0KDMwKS5qb2luZWRPbmx5KHRydWUpO1xuICBwdWJsaWMgZ3JvdXBzU2VhcmNoUmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5Hcm91cHNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuR3JvdXBzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgzMCkuam9pbmVkT25seSh0cnVlKTtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7XG4gIH1cbiAgcHVibGljIHRhYkl0ZW1TdHlsZTogVGFiSXRlbVN0eWxlID0ge307XG4gIHB1YmxpYyB1c2Vyc0xpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgcHVibGljIGdyb3Vwc0xpc3Q6IENvbWV0Q2hhdC5Hcm91cFtdID0gW107XG4gIHB1YmxpYyBzdWJtaXRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDUxLCAxNTMsIDI1NSlcIixcbiAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIlwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgfVxuICBwdWJsaWMgY2xvc2VCdXR0b25TdHlsZTogYW55O1xuICBwdWJsaWMgd3JhcHBlclN0eWxlOiBhbnk7XG4gIHB1YmxpYyBjb250YWN0c1BhZGRpbmc6IGFueTtcbiAgcHVibGljIHRpdGxlU3R5bGU6IGFueSA9IHt9O1xuICBwdWJsaWMgZXJyb3JTdHlsZTogYW55ID0ge307XG4gIHB1YmxpYyBpc0xpbWl0UmVhY2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgdGFic1N0eWxlOiBCYXNlU3R5bGUgPSB7fTtcbiAgb25Hcm91cFNlbGVjdGVkID0gKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICB2YXIga2V5ID0gdGhpcy5ncm91cHNMaXN0LmZpbmRJbmRleCgobTogYW55KSA9PiBtPy5nZXRHdWlkKCkgPT09IGdyb3VwLmdldEd1aWQoKSk7XG4gICAgaWYgKGtleSA+PSAwKSB7XG4gICAgICB0aGlzLmdyb3Vwc0xpc3Quc3BsaWNlKGtleSwgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ3JvdXBzTGlzdC5wdXNoKGdyb3VwKTtcbiAgICB9XG4gICAgdGhpcy5pc0xpbWl0UmVhY2hlZCA9IHRoaXMuZ3JvdXBzTGlzdC5sZW5ndGggKyB0aGlzLnVzZXJzTGlzdC5sZW5ndGggPj0gdGhpcy5zZWxlY3Rpb25MaW1pdDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIG9uVXNlclNlbGVjdGVkID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy51c2Vyc0xpc3QuZmluZEluZGV4KChtOiBhbnkpID0+IG0/LmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpKTtcbiAgICBpZiAoa2V5ID49IDApIHtcbiAgICAgIHRoaXMudXNlcnNMaXN0LnNwbGljZShrZXksIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVzZXJzTGlzdC5wdXNoKHVzZXIpO1xuICAgIH1cbiAgICB0aGlzLmlzTGltaXRSZWFjaGVkID0gdGhpcy5ncm91cHNMaXN0Lmxlbmd0aCArIHRoaXMudXNlcnNMaXN0Lmxlbmd0aCA+IHRoaXMuc2VsZWN0aW9uTGltaXQ7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBuZ09uSW5pdCgpOiB2b2lkIHtcblxuICAgIHRoaXMuc2V0Y29udGFjdHNTdHlsZSgpO1xuICAgIHRoaXMudXNlcnNMaXN0ID0gW11cbiAgICB0aGlzLmdyb3Vwc0xpc3QgPSBbXVxuICB9XG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy50YWJzPy5sZW5ndGggPD0gMCkge1xuICAgICAgaWYgKHRoaXMudGFiVmlzaWJpbGl0eSA9PSBUYWJzVmlzaWJpbGl0eS51c2Vyc0FuZEdyb3Vwcykge1xuICAgICAgICB0aGlzLnRhYnMgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2hpbGRWaWV3OiB0aGlzLnVzZXJzUmVmLFxuICAgICAgICAgICAgdGl0bGU6IHRoaXMudXNlcnNUYWJUaXRsZSxcbiAgICAgICAgICAgIGlkOiBcInVzZXJzXCIsXG4gICAgICAgICAgICBzdHlsZTogdGhpcy50YWJJdGVtU3R5bGVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNoaWxkVmlldzogdGhpcy5ncm91cHNSZWYsXG4gICAgICAgICAgICB0aXRsZTogdGhpcy5ncm91cHNUYWJUaXRsZSxcbiAgICAgICAgICAgIGlkOiBcImdyb3Vwc1wiLFxuICAgICAgICAgICAgc3R5bGU6IHRoaXMudGFiSXRlbVN0eWxlXG4gICAgICAgICAgfV1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAodGhpcy50YWJWaXNpYmlsaXR5ID09IFRhYnNWaXNpYmlsaXR5LnVzZXJzKSB7XG4gICAgICAgICAgdGhpcy50YWJzID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjaGlsZFZpZXc6IHRoaXMudXNlcnNSZWYsXG4gICAgICAgICAgICAgIHRpdGxlOiB0aGlzLnVzZXJzVGFiVGl0bGUsXG4gICAgICAgICAgICAgIGlkOiBcInVzZXJzXCIsXG4gICAgICAgICAgICAgIHN0eWxlOiB0aGlzLnRhYkl0ZW1TdHlsZVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGlzLnRhYnMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNoaWxkVmlldzogdGhpcy5ncm91cHNSZWYsXG4gICAgICAgICAgICAgIHRpdGxlOiB0aGlzLmdyb3Vwc1RhYlRpdGxlLFxuICAgICAgICAgICAgICBpZDogXCJncm91cHNcIixcbiAgICAgICAgICAgICAgc3R5bGU6IHRoaXMudGFiSXRlbVN0eWxlXG4gICAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICB9XG4gIH1cbiAgdXNlckNsaWNrZWQgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayh1c2VyKVxuICAgIH1cbiAgfVxuICBncm91cENsaWNrZWQgPSAoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKHVuZGVmaW5lZCwgZ3JvdXApXG4gICAgfVxuICB9XG4gIGNsb3NlQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKVxuICAgIH1cbiAgfVxuICBzdWJtaXRDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uU3VibWl0QnV0dG9uQ2xpY2spIHtcbiAgICAgIHRoaXMub25TdWJtaXRCdXR0b25DbGljayh0aGlzLnVzZXJzTGlzdCwgdGhpcy5ncm91cHNMaXN0KVxuICAgIH1cbiAgfVxuICBzZXRjb250YWN0c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbnRhY3RzU3R5bGUgPSBuZXcgQ29udGFjdHNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1Ym1pdEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VibWl0QnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgc3VibWl0QnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgcGFkZGluZzogXCIwIDEwMHB4XCIsXG4gICAgICB0YWJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB0YWJUaXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGFiVGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhY3RpdmVUYWJUaXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgYWN0aXZlVGFiVGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwibGlnaHRcIiksXG4gICAgICBhY3RpdmVUYWJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgYWN0aXZlVGFiQm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHRhYkhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgdGFiV2lkdGg6IFwiMTAwJVwiXG4gICAgfSlcbiAgICB0aGlzLmNvbnRhY3RzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jb250YWN0c1N0eWxlIH1cbiAgICB0aGlzLnN1Ym1pdEJ1dHRvblN0eWxlLmJhY2tncm91bmQgPSB0aGlzLmNvbnRhY3RzU3R5bGUuc3VibWl0QnV0dG9uQmFja2dyb3VuZDtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvblN0eWxlLmJ1dHRvblRleHRGb250ID0gdGhpcy5jb250YWN0c1N0eWxlLnN1Ym1pdEJ1dHRvblRleHRGb250O1xuICAgIHRoaXMuc3VibWl0QnV0dG9uU3R5bGUuYnV0dG9uVGV4dENvbG9yID0gdGhpcy5jb250YWN0c1N0eWxlLnN1Ym1pdEJ1dHRvblRleHRDb2xvcjtcbiAgICB0aGlzLnRhYnNTdHlsZSA9IHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YFxuICAgIH1cbiAgICB0aGlzLnRhYkl0ZW1TdHlsZSA9IG5ldyBUYWJJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiB0aGlzLmNvbnRhY3RzU3R5bGUudGFiSGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuY29udGFjdHNTdHlsZS50YWJXaWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuY29udGFjdHNTdHlsZS50YWJCYWNrZ3JvdW5kLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy5jb250YWN0c1N0eWxlLmFjdGl2ZVRhYkJhY2tncm91bmQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy5jb250YWN0c1N0eWxlLnRhYlRpdGxlVGV4dENvbG9yLFxuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5jb250YWN0c1N0eWxlLnRhYlRpdGxlVGV4dEZvbnQsXG4gICAgICBhY3RpdmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhY3RpdmVUaXRsZVRleHRDb2xvcjogdGhpcy5jb250YWN0c1N0eWxlLmFjdGl2ZVRhYlRpdGxlVGV4dENvbG9yLFxuICAgICAgYWN0aXZlVGl0bGVUZXh0Rm9udDogdGhpcy5jb250YWN0c1N0eWxlLmFjdGl2ZVRhYlRpdGxlVGV4dEZvbnQsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgICB9KVxuICAgIHRoaXMuY2xvc2VCdXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmNvbnRhY3RzU3R5bGUuY2xvc2VJY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH1cbiAgICB0aGlzLndyYXBwZXJTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogdGhpcy5jb250YWN0c1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLmNvbnRhY3RzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmNvbnRhY3RzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5jb250YWN0c1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jb250YWN0c1N0eWxlLmJvcmRlclJhZGl1c1xuICAgIH1cbiAgICB0aGlzLmNvbnRhY3RzUGFkZGluZyA9IHtcbiAgICAgIHBhZGRpbmc6IHRoaXMuY29udGFjdHNTdHlsZS5wYWRkaW5nXG4gICAgfVxuICAgIHRoaXMudGl0bGVTdHlsZSA9IHtcbiAgICAgIHRleHRGb250OiB0aGlzLmNvbnRhY3RzU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5jb250YWN0c1N0eWxlLnRpdGxlVGV4dENvbG9yXG4gICAgfVxuICAgIHRoaXMuZXJyb3JTdHlsZSA9IHtcbiAgICAgIHRleHRGb250OiB0aGlzLmNvbnRhY3RzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLmNvbnRhY3RzU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvclxuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWNvbnRhY3RzXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1jb250YWN0cy10aXRsZVwiPlxuICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwidGl0bGVcIiBbbGFiZWxTdHlsZV09XCJ0aXRsZVN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udGFjdHMtZXJyb3JcIiAqbmdJZj1cImlzTGltaXRSZWFjaGVkXCI+XG4gICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCInbWF4IGxpbWl0IGhhcyByZWFjaGVkJ1wiXG4gICAgICBbbGFiZWxTdHlsZV09XCJlcnJvclN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udGFjdHNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJjb250YWN0c1BhZGRpbmdcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtdGFic1wiPlxuICAgICAgPGNvbWV0Y2hhdC10YWJzIFt0YWJzXT1cInRhYnNcIiBbdGFic1N0eWxlXT1cInRhYnNTdHlsZVwiIFtrZWVwQWxpdmVdPVwidHJ1ZVwiPlxuICAgICAgICA8bmctdGVtcGxhdGUgI3VzZXJzUmVmPlxuICAgICAgICAgIDxjb21ldGNoYXQtdXNlcnMgW29uSXRlbUNsaWNrXT1cInVzZXJzQ29uZmlndXJhdGlvbi5vbkl0ZW1DbGljayB8fCB1c2VyQ2xpY2tlZFwiXG4gICAgICAgICAgICBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24udXNlcnNSZXF1ZXN0QnVpbGRlciB8fCB1c2Vyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgICAgICAgIFtoaWRlU2VhcmNoXT1cInVzZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICAgICAgICAgIFtTdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgICAgICAgICAgW2F2YXRhclN0eWxlXT1cInVzZXJzQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICAgICAgICBbc2VhcmNoSWNvblVSTF09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgICAgICAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNDb25maWd1cmF0aW9uLnNlYXJjaFJlcXVlc3RCdWlsZGVyIHx8IHVzZXJzU2VhcmNoUmVxdWVzdEJ1aWxkZXJcIlxuICAgICAgICAgICAgW3VzZXJzU3R5bGVdPVwidXNlcnNDb25maWd1cmF0aW9uLnVzZXJzU3R5bGVcIlxuICAgICAgICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgICAgICAgIFtvcHRpb25zXT1cInVzZXJzQ29uZmlndXJhdGlvbi5vcHRpb25zXCJcbiAgICAgICAgICAgIFtlbXB0eVN0YXRlVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW29uU2VsZWN0XT1cInVzZXJzQ29uZmlndXJhdGlvbi5vblNlbGVjdCB8fCBvblVzZXJTZWxlY3RlZFwiXG4gICAgICAgICAgICBbbG9hZGluZ0ljb25VUkxdPVwidXNlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgICAgIFtlcnJvclN0YXRlVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlcnNDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW2xpc3RJdGVtVmlld109XCJ1c2Vyc0NvbmZpZ3VyYXRpb24ubGlzdEl0ZW1WaWV3XCJcbiAgICAgICAgICAgIFttZW51XT1cInVzZXJzQ29uZmlndXJhdGlvbi5tZW51XCJcbiAgICAgICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cInVzZXJzQ29uZmlndXJhdGlvbi5oaWRlU2VwYXJhdG9yXCJcbiAgICAgICAgICAgIFtoaWRlRXJyb3JdPVwidXNlcnNDb25maWd1cmF0aW9uLmhpZGVFcnJvclwiXG4gICAgICAgICAgICBbc2VsZWN0aW9uTW9kZV09XCJzZWxlY3Rpb25Nb2RlXCIgW3RpdGxlXT1cIicnXCJcbiAgICAgICAgICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ1c2Vyc0NvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgICAgICAgICAgPjwvY29tZXRjaGF0LXVzZXJzPlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8bmctdGVtcGxhdGUgI2dyb3Vwc1JlZj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWdyb3VwcyBbb25JdGVtQ2xpY2tdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5vbkl0ZW1DbGljayB8fCBncm91cENsaWNrZWRcIlxuICAgICAgICAgICAgW2dyb3Vwc1JlcXVlc3RCdWlsZGVyXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uZ3JvdXBzUmVxdWVzdEJ1aWxkZXIgfHwgZ3JvdXBzUmVxdWVzdEJ1aWxkZXJcIlxuICAgICAgICAgICAgW2hpZGVTZWFyY2hdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5oaWRlU2VhcmNoXCJcbiAgICAgICAgICAgIFtTdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJncm91cHNDb25maWd1cmF0aW9uLnN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJncm91cHNDb25maWd1cmF0aW9uLmF2YXRhclN0eWxlXCJcbiAgICAgICAgICAgIFtzZWFyY2hJY29uVVJMXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uc2VhcmNoSWNvblVSTFwiXG4gICAgICAgICAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5zZWFyY2hSZXF1ZXN0QnVpbGRlciB8fCBncm91cHNTZWFyY2hSZXF1ZXN0QnVpbGRlclwiXG4gICAgICAgICAgICBbZ3JvdXBzU3R5bGVdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5ncm91cHNTdHlsZVwiXG4gICAgICAgICAgICBbc3VidGl0bGVWaWV3XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgICAgICAgIFtvcHRpb25zXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24ub3B0aW9uc1wiXG4gICAgICAgICAgICBbZW1wdHlTdGF0ZVZpZXddPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgICAgICAgICBbb25TZWxlY3RdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5vblNlbGVjdCB8fCBvbkdyb3VwU2VsZWN0ZWRcIlxuICAgICAgICAgICAgW2xvYWRpbmdJY29uVVJMXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24ubG9hZGluZ0ljb25VUkxcIlxuICAgICAgICAgICAgW2Vycm9yU3RhdGVWaWV3XT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgICAgICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICAgICAgICAgIFtsaXN0SXRlbVZpZXddPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXdcIlxuICAgICAgICAgICAgW21lbnVdPVwiZ3JvdXBzQ29uZmlndXJhdGlvbi5tZW51XCJcbiAgICAgICAgICAgIFtoaWRlU2VwYXJhdG9yXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uaGlkZVNlcGFyYXRvclwiXG4gICAgICAgICAgICBbaGlkZUVycm9yXT1cImdyb3Vwc0NvbmZpZ3VyYXRpb24uaGlkZUVycm9yXCJcbiAgICAgICAgICAgIFtzZWxlY3Rpb25Nb2RlXT1cInNlbGVjdGlvbk1vZGVcIiBbdGl0bGVdPVwiJydcIj48L2NvbWV0Y2hhdC1ncm91cHM+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8L2NvbWV0Y2hhdC10YWJzPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1jb250YWN0c19fYnV0dG9uc1wiICpuZ0lmPVwic2VsZWN0aW9uTW9kZSAhPSBzZWxlY3Rpb24ubm9uZSAmJiAhaGlkZVN1Ym1pdEJ1dHRvblwiPlxuICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2Rpc2FibGVkXT1cImlzTGltaXRSZWFjaGVkXCJcbiAgICAgICAgY2xhc3M9XCJjYy1jb250YWN0c19fYnV0dG9ucy0tYWRkXCIgW3RleHRdPVwic3VibWl0QnV0dG9uVGV4dFwiXG4gICAgICAgIFtidXR0b25TdHlsZV09XCJzdWJtaXRCdXR0b25TdHlsZVwiXG4gICAgICAgIChjbGljayk9XCJzdWJtaXRDbGlja2VkKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY2xvc2UtYnV0dG9uXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VJY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGVcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImNsb3NlQ2xpY2tlZCgpXCI+XG4gICAgPC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19