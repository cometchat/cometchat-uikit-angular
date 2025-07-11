import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AddMembersStyle, UsersStyle, CometChatUIKitUtility } from '@cometchat/uikit-shared';
import '@cometchat/uikit-elements';
import { fontHelper, localize, CometChatGroupEvents, CometChatUIKitConstants, TitleAlignment, SelectionMode } from '@cometchat/uikit-resources';
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatUsers/cometchat-users/cometchat-users.component";
import * as i3 from "@angular/common";
/**
*
* CometChatAddMembersComponentComponent is used to render group members to add
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatAddMembersComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.disableUsersPresence = false;
        this.backButtonIconURL = "assets/backbutton.svg";
        this.closeButtonIconURL = "assets/close2x.svg";
        this.showBackButton = true;
        this.hideSeparator = false;
        this.selectionMode = SelectionMode.multiple;
        this.searchPlaceholder = localize("SEARCH");
        this.hideError = false;
        this.searchIconURL = "assets/search.svg";
        this.hideSearch = false;
        this.title = localize("ADD_MEMBERS");
        this.onError = (error) => {
            console.log(error);
        };
        this.buttonText = localize("ADD_MEMBERS");
        this.loadingIconURL = "assets/Spinner.svg";
        this.listItemStyle = {};
        this.showSectionHeader = false;
        this.sectionHeaderField = "name";
        this.emptyStateText = localize("NO_USERS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.titleAlignment = TitleAlignment.center;
        this.titleAlignmentEnum = TitleAlignment;
        this.selectionmodeEnum = SelectionMode;
        this.addMembersStyle = {};
        /**
         * @deprecated This property is deprecated as of version 4.3.14. Use `statusIndicatorStyle` instead.
         */
        this.StatusIndicatorStyle = {};
        this.statusIndicatorStyle = {};
        this.avatarStyle = {};
        this.actionMessagesList = [];
        this.addMemberButtonStyle = {
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
        this.searchKeyword = "";
        this.usersList = [];
        this.userListenerId = "userlist_" + new Date().getTime();
        this.usersStyle = {
            width: "100%",
            height: "100%",
            background: "",
            border: "",
            borderRadius: "",
            searchBackground: "#efefef",
            onlineStatusColor: "",
            separatorColor: "rgb(222 222 222 / 46%)",
            sectionHeaderTextFont: "",
            sectionHeaderTextColor: ""
        };
        this.membersList = [];
        this.addedMembers = [];
        /**
         * @param  {string} uid
         */
        this.addRemoveUsers = (user, selected) => {
            if (this.onSelect) {
                this.onSelect(user, selected);
            }
            else {
                let key = this.membersList.findIndex((m) => m.getUid() === user.getUid());
                if (key >= 0) {
                    this.membersList.splice(key, 1);
                }
                else {
                    let member = new CometChat.GroupMember(user.getUid(), CometChatUIKitConstants.groupMemberScope.participant);
                    member.setName(user.getName());
                    member.setGuid(this.group.getGuid());
                    this.membersList.push(member);
                }
            }
            this.ref.detectChanges();
        };
        this.addMembersToGroup = () => {
            if (this.group && this.membersList.length > 0) {
                if (this.onAddMembersButtonClick) {
                    this.onAddMembersButtonClick(this.group.getGuid(), this.membersList);
                    this.ref.detectChanges();
                    return;
                }
                else {
                    CometChat.addMembersToGroup(this.group.getGuid(), this.membersList, []).then((response) => {
                        for (const key in response) {
                            if (response.hasOwnProperty(key) && response[key] === "success") {
                                const matchingUser = this.membersList.find((user) => user.getUid() === key);
                                if (matchingUser) {
                                    this.createActionMessage(matchingUser);
                                    if (!matchingUser.getScope()) {
                                        matchingUser.setScope(CometChatUIKitConstants.groupMemberScope.participant);
                                    }
                                    this.addedMembers.push(matchingUser);
                                }
                            }
                        }
                        this.group.setMembersCount(this.group.getMembersCount() + this.addedMembers?.length || 0);
                        CometChatGroupEvents.ccGroupMemberAdded.next({
                            messages: this.actionMessagesList,
                            usersAdded: this.addedMembers,
                            userAddedIn: this.group,
                            userAddedBy: this.loggedInUser
                        });
                        this.membersList = [];
                        this.addedMembers = [];
                        this.actionMessagesList = [];
                        if (this.onBack) {
                            this.onBack();
                        }
                        this.ref.detectChanges();
                    })
                        .catch((err) => {
                        console.log(err);
                        this.membersList = [];
                        this.ref.detectChanges();
                    });
                }
            }
            else {
                return;
            }
        };
        // styles
        this.backButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.addMembersStyle.backButtonIconTint || this.themeService.theme.palette.getPrimary()
            };
        };
        this.closeButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.addMembersStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
            };
        };
        this.wrapperStyle = () => {
            return {
                height: this.addMembersStyle.height,
                width: this.addMembersStyle.width,
                background: this.addMembersStyle.background,
                border: this.addMembersStyle.border,
                borderRadius: this.addMembersStyle.borderRadius
            };
        };
        this.addMembersStyles = () => {
            return {
                padding: this.addMembersStyle.padding
            };
        };
    }
    ngOnInit() {
        this.setUsersStyle();
        this.setAddMembersStyle();
        this.membersList = [];
        this.addedMembers = [];
        this.actionMessagesList = [];
        CometChat.getLoggedinUser().then((user) => {
            this.loggedInUser = user;
        }).catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    closeClicked() {
        if (this.onClose) {
            this.onClose();
        }
    }
    backClicked() {
        if (this.onBack) {
            this.onBack();
        }
    }
    createActionMessage(actionOn) {
        let actionMessage = new CometChat.Action(this.group.getGuid(), CometChatUIKitConstants.MessageTypes.groupMember, CometChatUIKitConstants.MessageReceiverType.group, CometChatUIKitConstants.MessageCategory.action);
        actionMessage.setAction(CometChatUIKitConstants.groupMemberAction.ADDED);
        actionMessage.setActionBy(this.loggedInUser);
        actionMessage.setActionFor(this.group);
        actionMessage.setActionOn(actionOn);
        actionMessage.setReceiver(this.group);
        actionMessage.setSender(this.loggedInUser);
        actionMessage.setConversationId("group_" + this.group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setMessage(`${this.loggedInUser?.getName()} added ${actionOn.getName()}`);
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        this.actionMessagesList.push(actionMessage);
    }
    setAddMembersStyle() {
        let defaultStyle = new AddMembersStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `none`,
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            separatorColor: this.themeService.theme.palette.getAccent400(),
            width: "100%",
            height: "100%",
            borderRadius: "none",
            searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            searchTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            searchTextColor: this.themeService.theme.palette.getAccent400(),
            searchIconTint: this.themeService.theme.palette.getAccent600(),
            searchBorder: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            searchBorderRadius: "8px",
            searchBackground: this.themeService.theme.palette.getAccent50(),
            closeButtonIconTint: this.themeService.theme.palette.getPrimary(),
            backButtonIconTint: this.themeService.theme.palette.getPrimary(),
            addMembersButtonBackground: this.themeService.theme.palette.getPrimary(),
            addMembersButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
            addMembersButtonTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            padding: "0 100px"
        });
        this.addMembersStyle = { ...defaultStyle, ...this.addMembersStyle };
        this.addMemberButtonStyle.background = this.addMembersStyle.addMembersButtonBackground;
        this.addMemberButtonStyle.buttonTextFont = this.addMembersStyle.addMembersButtonTextFont;
        this.addMemberButtonStyle.buttonTextColor = this.addMembersStyle.addMembersButtonTextColor;
    }
    setUsersStyle() {
        let defaultStyle = new UsersStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: "none",
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            separatorColor: this.themeService.theme.palette.getAccent400(),
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            searchIconTint: this.themeService.theme.palette.getAccent600(),
            searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            searchBackground: this.themeService.theme.palette.getAccent100(),
            searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchTextColor: this.themeService.theme.palette.getAccent600(),
            searchTextFont: fontHelper(this.themeService.theme.typography.text3)
        });
        this.usersStyle = { ...defaultStyle, ...this.addMembersStyle };
    }
}
CometChatAddMembersComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembersComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatAddMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatAddMembersComponent, selector: "cometchat-add-members", inputs: { usersRequestBuilder: "usersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", hideError: "hideError", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onBack: "onBack", onClose: "onClose", onSelect: "onSelect", buttonText: "buttonText", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", listItemStyle: "listItemStyle", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", onAddMembersButtonClick: "onAddMembersButtonClick", titleAlignment: "titleAlignment", addMembersStyle: "addMembersStyle", StatusIndicatorStyle: "StatusIndicatorStyle", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle" }, ngImport: i0, template: "<div class=\"cc-add-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-back-button\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\"  (cc-button-clicked)=\"backClicked()\" *ngIf=\"showBackButton\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-add-members__wrapper\" [ngStyle]=\"addMembersStyles()\">\n   <div class=\"cc-users\">\n    <cometchat-users [searchPlaceholder]=\"searchPlaceholder\" [usersRequestBuilder]=\"usersRequestBuilder\"\n    [hideSearch]=\"hideSearch\"\n    [statusIndicatorStyle]=\"statusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\"\n    [searchIconURL]=\"searchIconURL\"\n    [searchRequestBuilder]=\"searchRequestBuilder\"\n    [usersStyle]=\"usersStyle\"\n    [subtitleView]=\"subtitleView\"\n    [options]=\"options\"\n    [usersRequestBuilder]=\"usersRequestBuilder\"\n    [emptyStateView]=\"emptyStateView\"\n    [onSelect]=\" addRemoveUsers\"\n    [sectionHeaderField]=\"sectionHeaderField\"\n    [loadingIconURL]=\"loadingIconURL\"\n    [errorStateView]=\"errorStateView\"\n    [loadingStateView]=\"loadingStateView\"\n    [titleAlignment]=\"titleAlignment\"\n    [showSectionHeader]=\"showSectionHeader\"\n    [listItemView]=\"listItemView\"\n    [menu]=\"menu\"\n    [hideSeparator]=\"hideSeparator\"\n    [hideError]=\"hideError\"\n    [selectionMode]=\" selectionMode\"\n    [listItemStyle]=\"listItemStyle\"\n    [title]=\"title\"  >\n\n    </cometchat-users>\n   </div>\n    <div class=\"cc-add-members__buttons\">\n      <cometchat-button class=\"cc-add-members__buttons--add\" [text]=\"buttonText\" [buttonStyle]=\"addMemberButtonStyle\" (click)=\"addMembersToGroup()\" ></cometchat-button>\n\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>", styles: [".cc-add-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-add-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-users{height:90%}.cc-add-members__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-add-members__buttons--add{height:42px;width:100%}\n"], components: [{ type: i2.CometChatUsersComponent, selector: "cometchat-users", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "disableUsersPresence", "listItemView", "menu", "options", "activeUser", "hideSeparator", "searchPlaceholder", "hideError", "selectionMode", "searchIconURL", "hideSearch", "title", "onError", "emptyStateView", "onSelect", "errorStateView", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "usersStyle", "listItemStyle", "statusIndicatorStyle", "avatarStyle", "onItemClick", "searchKeyword", "onEmpty", "userPresencePlacement", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-add-members", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-add-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-back-button\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\"  (cc-button-clicked)=\"backClicked()\" *ngIf=\"showBackButton\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-add-members__wrapper\" [ngStyle]=\"addMembersStyles()\">\n   <div class=\"cc-users\">\n    <cometchat-users [searchPlaceholder]=\"searchPlaceholder\" [usersRequestBuilder]=\"usersRequestBuilder\"\n    [hideSearch]=\"hideSearch\"\n    [statusIndicatorStyle]=\"statusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\"\n    [searchIconURL]=\"searchIconURL\"\n    [searchRequestBuilder]=\"searchRequestBuilder\"\n    [usersStyle]=\"usersStyle\"\n    [subtitleView]=\"subtitleView\"\n    [options]=\"options\"\n    [usersRequestBuilder]=\"usersRequestBuilder\"\n    [emptyStateView]=\"emptyStateView\"\n    [onSelect]=\" addRemoveUsers\"\n    [sectionHeaderField]=\"sectionHeaderField\"\n    [loadingIconURL]=\"loadingIconURL\"\n    [errorStateView]=\"errorStateView\"\n    [loadingStateView]=\"loadingStateView\"\n    [titleAlignment]=\"titleAlignment\"\n    [showSectionHeader]=\"showSectionHeader\"\n    [listItemView]=\"listItemView\"\n    [menu]=\"menu\"\n    [hideSeparator]=\"hideSeparator\"\n    [hideError]=\"hideError\"\n    [selectionMode]=\" selectionMode\"\n    [listItemStyle]=\"listItemStyle\"\n    [title]=\"title\"  >\n\n    </cometchat-users>\n   </div>\n    <div class=\"cc-add-members__buttons\">\n      <cometchat-button class=\"cc-add-members__buttons--add\" [text]=\"buttonText\" [buttonStyle]=\"addMemberButtonStyle\" (click)=\"addMembersToGroup()\" ></cometchat-button>\n\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>", styles: [".cc-add-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-add-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-users{height:90%}.cc-add-members__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-add-members__buttons--add{height:42px;width:100%}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { usersRequestBuilder: [{
                type: Input
            }], searchRequestBuilder: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], menu: [{
                type: Input
            }], options: [{
                type: Input
            }], backButtonIconURL: [{
                type: Input
            }], closeButtonIconURL: [{
                type: Input
            }], showBackButton: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], searchPlaceholder: [{
                type: Input
            }], hideError: [{
                type: Input
            }], searchIconURL: [{
                type: Input
            }], hideSearch: [{
                type: Input
            }], title: [{
                type: Input
            }], onError: [{
                type: Input
            }], onBack: [{
                type: Input
            }], onClose: [{
                type: Input
            }], onSelect: [{
                type: Input
            }], buttonText: [{
                type: Input
            }], group: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], showSectionHeader: [{
                type: Input
            }], sectionHeaderField: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], onAddMembersButtonClick: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], addMembersStyle: [{
                type: Input
            }], StatusIndicatorStyle: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBZSxNQUFNLGVBQWUsQ0FBQztBQUNsSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQW1DLE1BQU0seUJBQXlCLENBQUM7QUFDOUgsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQWtCLFVBQVUsRUFBRSxRQUFRLEVBQW1CLG9CQUFvQixFQUFFLHVCQUF1QixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTs7Ozs7QUFHaEw7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sNEJBQTRCO0lBb0R2QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBOUM5RSx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFHdEMsc0JBQWlCLEdBQVcsdUJBQXVCLENBQUE7UUFDbkQsdUJBQWtCLEdBQVcsb0JBQW9CLENBQUE7UUFDakQsbUJBQWMsR0FBWSxJQUFJLENBQUM7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S0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBR0csTUFBTTtzQkFBZCxLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUVHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLHVCQUF1QjtzQkFBL0IsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUdHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBS0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUVHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQsIElucHV0LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIFRlbXBsYXRlUmVmIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IEFkZE1lbWJlcnNTdHlsZSwgVXNlcnNTdHlsZSwgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LCBCYXNlU3R5bGUsIFVJS2l0U2V0dGluZ3NCdWlsZGVyIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWUsIGZvbnRIZWxwZXIsIGxvY2FsaXplLCBDb21ldENoYXRPcHRpb24sIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgVGl0bGVBbGlnbm1lbnQsIFNlbGVjdGlvbk1vZGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcydcbmltcG9ydCB7IEF2YXRhclN0eWxlLCBMaXN0SXRlbVN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG4vKipcbipcbiogQ29tZXRDaGF0QWRkTWVtYmVyc0NvbXBvbmVudENvbXBvbmVudCBpcyB1c2VkIHRvIHJlbmRlciBncm91cCBtZW1iZXJzIHRvIGFkZFxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1hZGQtbWVtYmVyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1hZGQtbWVtYmVycy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRBZGRNZW1iZXJzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcblxuICBASW5wdXQoKSB1c2Vyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHNlYXJjaFJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIlxuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCJcbiAgQElucHV0KCkgc2hvd0JhY2tCdXR0b246IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm11bHRpcGxlO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gbG9jYWxpemUoXCJTRUFSQ0hcIik7XG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWFyY2hJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9zZWFyY2guc3ZnXCI7XG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQUREX01FTUJFUlNcIik7XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIG9uQmFjayE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uQ2xvc2UhOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvblNlbGVjdCE6ICh1c2VyOiBDb21ldENoYXQuVXNlciwgc2VsZWN0ZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG5cbiAgQElucHV0KCkgYnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJBRERfTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHt9XG4gIEBJbnB1dCgpIHNob3dTZWN0aW9uSGVhZGVyOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlY3Rpb25IZWFkZXJGaWVsZDogc3RyaW5nID0gXCJuYW1lXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19VU0VSU19GT1VORFwiKVxuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIG9uQWRkTWVtYmVyc0J1dHRvbkNsaWNrITogKGd1aWQ6IHN0cmluZywgbWVtYmVyczogQ29tZXRDaGF0LlVzZXJbXSkgPT4gdm9pZDtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQuY2VudGVyO1xuICB0aXRsZUFsaWdubWVudEVudW06IHR5cGVvZiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIEBJbnB1dCgpIGFkZE1lbWJlcnNTdHlsZTogQWRkTWVtYmVyc1N0eWxlID0ge307XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy4xNC4gVXNlIGBzdGF0dXNJbmRpY2F0b3JTdHlsZWAgaW5zdGVhZC5cbiAgICovXG4gIEBJbnB1dCgpIFN0YXR1c0luZGljYXRvclN0eWxlOiBCYXNlU3R5bGUgPSB7fTtcblxuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge31cbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge31cbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBhY3Rpb25NZXNzYWdlc0xpc3Q6IENvbWV0Q2hhdC5BY3Rpb25bXSA9IFtdXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSkgeyB9XG4gIGFkZE1lbWJlckJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2IoNTEsIDE1MywgMjU1KVwiLFxuICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOiBcIndoaXRlXCIsXG4gICAgYnV0dG9uVGV4dEZvbnQ6IFwiXCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIlxuICB9XG4gIHNlYXJjaEtleXdvcmQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyB1c2Vyc1JlcXVlc3Q6IGFueTtcbiAgcHVibGljIHRpbWVvdXQ6IGFueTtcbiAgcHVibGljIHVzZXJzTGlzdDogQ29tZXRDaGF0LlVzZXJbXSA9IFtdO1xuICBwdWJsaWMgdXNlckxpc3RlbmVySWQ6IHN0cmluZyA9IFwidXNlcmxpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgdXNlcnNTdHlsZTogVXNlcnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG4gICAgc2VhcmNoQmFja2dyb3VuZDogXCIjZWZlZmVmXCIsXG4gICAgb25saW5lU3RhdHVzQ29sb3I6IFwiXCIsXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiLFxuICAgIHNlY3Rpb25IZWFkZXJUZXh0Rm9udDogXCJcIixcbiAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOiBcIlwiXG4gIH07XG4gIG1lbWJlcnNMaXN0OiBhbnlbXSA9IFtdO1xuICBhZGRlZE1lbWJlcnM6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcltdID0gW11cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRVc2Vyc1N0eWxlKClcbiAgICB0aGlzLnNldEFkZE1lbWJlcnNTdHlsZSgpO1xuICAgIHRoaXMubWVtYmVyc0xpc3QgPSBbXVxuICAgIHRoaXMuYWRkZWRNZW1iZXJzID0gW11cbiAgICB0aGlzLmFjdGlvbk1lc3NhZ2VzTGlzdCA9IFtdXG5cbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgfSkuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHVpZFxuICAgKi9cbiAgYWRkUmVtb3ZlVXNlcnMgPSAodXNlcjogQ29tZXRDaGF0LlVzZXIsIHNlbGVjdGVkOiBib29sZWFuKSA9PiB7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QodXNlciwgc2VsZWN0ZWQpXG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICBsZXQga2V5ID0gdGhpcy5tZW1iZXJzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtOiBhbnkpID0+IG0uZ2V0VWlkKCkgPT09IHVzZXIuZ2V0VWlkKClcbiAgICAgICk7XG4gICAgICBpZiAoa2V5ID49IDApIHtcbiAgICAgICAgdGhpcy5tZW1iZXJzTGlzdC5zcGxpY2Uoa2V5LCAxKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxldCBtZW1iZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciA9IG5ldyBDb21ldENoYXQuR3JvdXBNZW1iZXIodXNlci5nZXRVaWQoKSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJTY29wZS5wYXJ0aWNpcGFudClcbiAgICAgICAgbWVtYmVyLnNldE5hbWUodXNlci5nZXROYW1lKCkpXG4gICAgICAgIG1lbWJlci5zZXRHdWlkKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuXG4gICAgICAgIHRoaXMubWVtYmVyc0xpc3QucHVzaChtZW1iZXIpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICB9XG4gIGNsb3NlQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkNsb3NlKSB7XG4gICAgICB0aGlzLm9uQ2xvc2UoKVxuICAgIH1cbiAgfVxuICBiYWNrQ2xpY2tlZCgpIHtcbiAgICBpZiAodGhpcy5vbkJhY2spIHtcbiAgICAgIHRoaXMub25CYWNrKClcbiAgICB9XG4gIH1cbiAgYWRkTWVtYmVyc1RvR3JvdXAgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5tZW1iZXJzTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAodGhpcy5vbkFkZE1lbWJlcnNCdXR0b25DbGljaykge1xuICAgICAgICB0aGlzLm9uQWRkTWVtYmVyc0J1dHRvbkNsaWNrKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCB0aGlzLm1lbWJlcnNMaXN0KVxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZE1lbWJlcnNUb0dyb3VwKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCB0aGlzLm1lbWJlcnNMaXN0LCBbXSkudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuaGFzT3duUHJvcGVydHkoa2V5KSAmJiByZXNwb25zZVtrZXldID09PSBcInN1Y2Nlc3NcIikge1xuXG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gdGhpcy5tZW1iZXJzTGlzdC5maW5kKCh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4gdXNlci5nZXRVaWQoKSA9PT0ga2V5KTtcbiAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nVXNlcikge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVBY3Rpb25NZXNzYWdlKG1hdGNoaW5nVXNlcilcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoaW5nVXNlci5nZXRTY29wZSgpKSB7XG4gICAgICAgICAgICAgICAgICBtYXRjaGluZ1VzZXIuc2V0U2NvcGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJTY29wZS5wYXJ0aWNpcGFudCBhcyBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRlZE1lbWJlcnMucHVzaChtYXRjaGluZ1VzZXIpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmdyb3VwLnNldE1lbWJlcnNDb3VudCh0aGlzLmdyb3VwLmdldE1lbWJlcnNDb3VudCgpICsgdGhpcy5hZGRlZE1lbWJlcnM/Lmxlbmd0aCB8fCAwKVxuICAgICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5uZXh0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBtZXNzYWdlczogdGhpcy5hY3Rpb25NZXNzYWdlc0xpc3QsXG4gICAgICAgICAgICAgIHVzZXJzQWRkZWQ6IHRoaXMuYWRkZWRNZW1iZXJzLFxuICAgICAgICAgICAgICB1c2VyQWRkZWRJbjogdGhpcy5ncm91cCxcbiAgICAgICAgICAgICAgdXNlckFkZGVkQnk6IHRoaXMubG9nZ2VkSW5Vc2VyIVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKVxuICAgICAgICAgIHRoaXMubWVtYmVyc0xpc3QgPSBbXVxuICAgICAgICAgIHRoaXMuYWRkZWRNZW1iZXJzID0gW11cbiAgICAgICAgICB0aGlzLmFjdGlvbk1lc3NhZ2VzTGlzdCA9IFtdXG4gICAgICAgICAgaWYgKHRoaXMub25CYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm9uQmFjaygpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICB0aGlzLm1lbWJlcnNMaXN0ID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuICBjcmVhdGVBY3Rpb25NZXNzYWdlKGFjdGlvbk9uOiBDb21ldENoYXQuR3JvdXBNZW1iZXIpIHtcbiAgICBsZXQgYWN0aW9uTWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiA9IG5ldyBDb21ldENoYXQuQWN0aW9uKHRoaXMuZ3JvdXAuZ2V0R3VpZCgpLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gYXMgYW55KVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkFEREVEKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uQnkodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uRm9yKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25PbihhY3Rpb25PbilcbiAgICBhY3Rpb25NZXNzYWdlLnNldFJlY2VpdmVyKHRoaXMuZ3JvdXApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIhKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0Q29udmVyc2F0aW9uSWQoXCJncm91cF9cIiArIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE1lc3NhZ2UoYCR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX0gYWRkZWQgJHthY3Rpb25Pbi5nZXROYW1lKCl9YClcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKVxuICAgIHRoaXMuYWN0aW9uTWVzc2FnZXNMaXN0LnB1c2goYWN0aW9uTWVzc2FnZSlcbiAgfVxuXG4gIHNldEFkZE1lbWJlcnNTdHlsZSgpIHtcblxuICAgIGxldCBkZWZhdWx0U3R5bGU6IEFkZE1lbWJlcnNTdHlsZSA9IG5ldyBBZGRNZW1iZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIm5vbmVcIixcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIHNlYXJjaEJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICAgIGNsb3NlQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYmFja0J1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGFkZE1lbWJlcnNCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGFkZE1lbWJlcnNCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBhZGRNZW1iZXJzQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgcGFkZGluZzogXCIwIDEwMHB4XCJcbiAgICB9KVxuICAgIHRoaXMuYWRkTWVtYmVyc1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYWRkTWVtYmVyc1N0eWxlIH1cbiAgICB0aGlzLmFkZE1lbWJlckJ1dHRvblN0eWxlLmJhY2tncm91bmQgPSB0aGlzLmFkZE1lbWJlcnNTdHlsZS5hZGRNZW1iZXJzQnV0dG9uQmFja2dyb3VuZDtcbiAgICB0aGlzLmFkZE1lbWJlckJ1dHRvblN0eWxlLmJ1dHRvblRleHRGb250ID0gdGhpcy5hZGRNZW1iZXJzU3R5bGUuYWRkTWVtYmVyc0J1dHRvblRleHRGb250O1xuICAgIHRoaXMuYWRkTWVtYmVyQnV0dG9uU3R5bGUuYnV0dG9uVGV4dENvbG9yID0gdGhpcy5hZGRNZW1iZXJzU3R5bGUuYWRkTWVtYmVyc0J1dHRvblRleHRDb2xvcjtcbiAgfVxuICBzZXRVc2Vyc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFVzZXJzU3R5bGUgPSBuZXcgVXNlcnNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MylcbiAgICB9KVxuICAgIHRoaXMudXNlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmFkZE1lbWJlcnNTdHlsZSB9XG4gIH1cblxuICAvLyBzdHlsZXNcbiAgYmFja0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5hZGRNZW1iZXJzU3R5bGUuYmFja0J1dHRvbkljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfVxuICB9XG4gIGNsb3NlQnV0dG9uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5jbG9zZUJ1dHRvbkljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpXG4gICAgfVxuICB9XG5cbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5hZGRNZW1iZXJzU3R5bGUuYm9yZGVyUmFkaXVzXG4gICAgfVxuICB9XG4gIGFkZE1lbWJlcnNTdHlsZXMgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmc6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLnBhZGRpbmdcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1hZGQtbWVtYmVyc1wiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1iYWNrLWJ1dHRvblwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImJhY2tCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCIgIChjYy1idXR0b24tY2xpY2tlZCk9XCJiYWNrQ2xpY2tlZCgpXCIgKm5nSWY9XCJzaG93QmFja0J1dHRvblwiPlxuXG4gICAgPC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWFkZC1tZW1iZXJzX193cmFwcGVyXCIgW25nU3R5bGVdPVwiYWRkTWVtYmVyc1N0eWxlcygpXCI+XG4gICA8ZGl2IGNsYXNzPVwiY2MtdXNlcnNcIj5cbiAgICA8Y29tZXRjaGF0LXVzZXJzIFtzZWFyY2hQbGFjZWhvbGRlcl09XCJzZWFyY2hQbGFjZWhvbGRlclwiIFt1c2Vyc1JlcXVlc3RCdWlsZGVyXT1cInVzZXJzUmVxdWVzdEJ1aWxkZXJcIlxuICAgIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCJcbiAgICBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwic2VhcmNoUmVxdWVzdEJ1aWxkZXJcIlxuICAgIFt1c2Vyc1N0eWxlXT1cInVzZXJzU3R5bGVcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwic3VidGl0bGVWaWV3XCJcbiAgICBbb3B0aW9uc109XCJvcHRpb25zXCJcbiAgICBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJ1c2Vyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtvblNlbGVjdF09XCIgYWRkUmVtb3ZlVXNlcnNcIlxuICAgIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwic2VjdGlvbkhlYWRlckZpZWxkXCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCJcbiAgICBbc2hvd1NlY3Rpb25IZWFkZXJdPVwic2hvd1NlY3Rpb25IZWFkZXJcIlxuICAgIFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3XCJcbiAgICBbbWVudV09XCJtZW51XCJcbiAgICBbaGlkZVNlcGFyYXRvcl09XCJoaWRlU2VwYXJhdG9yXCJcbiAgICBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiXG4gICAgW3NlbGVjdGlvbk1vZGVdPVwiIHNlbGVjdGlvbk1vZGVcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgIFt0aXRsZV09XCJ0aXRsZVwiICA+XG5cbiAgICA8L2NvbWV0Y2hhdC11c2Vycz5cbiAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1hZGQtbWVtYmVyc19fYnV0dG9uc1wiPlxuICAgICAgPGNvbWV0Y2hhdC1idXR0b24gY2xhc3M9XCJjYy1hZGQtbWVtYmVyc19fYnV0dG9ucy0tYWRkXCIgW3RleHRdPVwiYnV0dG9uVGV4dFwiIFtidXR0b25TdHlsZV09XCJhZGRNZW1iZXJCdXR0b25TdHlsZVwiIChjbGljayk9XCJhZGRNZW1iZXJzVG9Hcm91cCgpXCIgPjwvY29tZXRjaGF0LWJ1dHRvbj5cblxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWNsb3NlLWJ1dHRvblwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImNsb3NlQnV0dG9uSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJjbG9zZUJ1dHRvblN0eWxlKClcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY2xvc2VDbGlja2VkKClcIj5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG48L2Rpdj4iXX0=