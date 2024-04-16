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
        this.searchPlaceholder = "Search Members";
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
        this.emptyStateText = localize("NO_GROUPS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.titleAlignment = TitleAlignment.center;
        this.titleAlignmentEnum = TitleAlignment;
        this.selectionmodeEnum = SelectionMode;
        this.addMembersStyle = {};
        this.StatusIndicatorStyle = {};
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
        console.log(this.actionMessagesList);
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
CometChatAddMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatAddMembersComponent, selector: "cometchat-add-members", inputs: { usersRequestBuilder: "usersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", hideError: "hideError", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onBack: "onBack", onClose: "onClose", onSelect: "onSelect", buttonText: "buttonText", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", listItemStyle: "listItemStyle", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", onAddMembersButtonClick: "onAddMembersButtonClick", titleAlignment: "titleAlignment", addMembersStyle: "addMembersStyle", StatusIndicatorStyle: "StatusIndicatorStyle", avatarStyle: "avatarStyle" }, ngImport: i0, template: "<div class=\"cc-add-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-back-button\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\"  (cc-button-clicked)=\"backClicked()\" *ngIf=\"showBackButton\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-add-members__wrapper\" [ngStyle]=\"addMembersStyles()\">\n   <div class=\"cc-users\">\n    <cometchat-users [searchPlaceholder]=\"searchPlaceholder\" [usersRequestBuilder]=\"usersRequestBuilder\"\n    [hideSearch]=\"hideSearch\"\n    [StatusIndicatorStyle]=\"StatusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\"\n    [searchIconURL]=\"searchIconURL\"\n    [searchRequestBuilder]=\"searchRequestBuilder\"\n    [usersStyle]=\"usersStyle\"\n    [subtitleView]=\"subtitleView\"\n    [options]=\"options\"\n    [usersRequestBuilder]=\"usersRequestBuilder\"\n    [emptyStateView]=\"emptyStateView\"\n    [onSelect]=\" addRemoveUsers\"\n    [sectionHeaderField]=\"sectionHeaderField\"\n    [loadingIconURL]=\"loadingIconURL\"\n    [errorStateView]=\"errorStateView\"\n    [loadingStateView]=\"loadingStateView\"\n    [titleAlignment]=\"titleAlignment\"\n    [showSectionHeader]=\"showSectionHeader\"\n    [listItemView]=\"listItemView\"\n    [menu]=\"menu\"\n    [hideSeparator]=\"hideSeparator\"\n    [hideError]=\"hideError\"\n    [selectionMode]=\" selectionMode\"\n    [title]=\"title\"  >\n\n    </cometchat-users>\n   </div>\n    <div class=\"cc-add-members__buttons\">\n      <cometchat-button class=\"cc-add-members__buttons--add\" [text]=\"buttonText\" [buttonStyle]=\"addMemberButtonStyle\" (click)=\"addMembersToGroup()\" ></cometchat-button>\n\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>", styles: [".cc-add-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-add-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-users{height:90%}.cc-add-members__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-add-members__buttons--add{height:42px;width:100%}\n"], components: [{ type: i2.CometChatUsersComponent, selector: "cometchat-users", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "disableUsersPresence", "listItemView", "menu", "options", "activeUser", "hideSeparator", "searchPlaceholder", "hideError", "selectionMode", "searchIconURL", "hideSearch", "title", "onError", "emptyStateView", "onSelect", "errorStateView", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "usersStyle", "listItemStyle", "statusIndicatorStyle", "avatarStyle", "onItemClick", "searchKeyword", "onEmpty", "userPresencePlacement", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-add-members", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-add-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-back-button\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\"  (cc-button-clicked)=\"backClicked()\" *ngIf=\"showBackButton\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-add-members__wrapper\" [ngStyle]=\"addMembersStyles()\">\n   <div class=\"cc-users\">\n    <cometchat-users [searchPlaceholder]=\"searchPlaceholder\" [usersRequestBuilder]=\"usersRequestBuilder\"\n    [hideSearch]=\"hideSearch\"\n    [StatusIndicatorStyle]=\"StatusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\"\n    [searchIconURL]=\"searchIconURL\"\n    [searchRequestBuilder]=\"searchRequestBuilder\"\n    [usersStyle]=\"usersStyle\"\n    [subtitleView]=\"subtitleView\"\n    [options]=\"options\"\n    [usersRequestBuilder]=\"usersRequestBuilder\"\n    [emptyStateView]=\"emptyStateView\"\n    [onSelect]=\" addRemoveUsers\"\n    [sectionHeaderField]=\"sectionHeaderField\"\n    [loadingIconURL]=\"loadingIconURL\"\n    [errorStateView]=\"errorStateView\"\n    [loadingStateView]=\"loadingStateView\"\n    [titleAlignment]=\"titleAlignment\"\n    [showSectionHeader]=\"showSectionHeader\"\n    [listItemView]=\"listItemView\"\n    [menu]=\"menu\"\n    [hideSeparator]=\"hideSeparator\"\n    [hideError]=\"hideError\"\n    [selectionMode]=\" selectionMode\"\n    [title]=\"title\"  >\n\n    </cometchat-users>\n   </div>\n    <div class=\"cc-add-members__buttons\">\n      <cometchat-button class=\"cc-add-members__buttons--add\" [text]=\"buttonText\" [buttonStyle]=\"addMemberButtonStyle\" (click)=\"addMembersToGroup()\" ></cometchat-button>\n\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>", styles: [".cc-add-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-add-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-users{height:90%}.cc-add-members__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-add-members__buttons--add{height:42px;width:100%}\n"] }]
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
            }], avatarStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBZSxNQUFNLGVBQWUsQ0FBQztBQUNsSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQW1DLE1BQU0seUJBQXlCLENBQUM7QUFDOUgsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQWtCLFVBQVUsRUFBRSxRQUFRLEVBQW1CLG9CQUFvQixFQUFFLHVCQUF1QixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTs7Ozs7QUFHaEw7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sNEJBQTRCO0lBOEN2QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBeEM5RSx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFHdEMsc0JBQWlCLEdBQVcsdUJBQXVCLENBQUE7UUFDbkQsdUJBQWtCLEdBQVcsb0JBQW9CLENBQUE7UUFDakQsbUJBQWMsR0FBWSxJQUFJLENBQUM7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LEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxLQUFLO3NCQUFiLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUdHLE1BQU07c0JBQWQsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csUUFBUTtzQkFBaEIsS0FBSztnQkFFRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyx1QkFBdUI7c0JBQS9CLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFHRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQsIElucHV0LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIFRlbXBsYXRlUmVmIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IEFkZE1lbWJlcnNTdHlsZSwgVXNlcnNTdHlsZSwgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LCBCYXNlU3R5bGUsIFVJS2l0U2V0dGluZ3NCdWlsZGVyIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWQnO1xuaW1wb3J0ICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWUsIGZvbnRIZWxwZXIsIGxvY2FsaXplLCBDb21ldENoYXRPcHRpb24sIENvbWV0Q2hhdEdyb3VwRXZlbnRzLCBDb21ldENoYXRVSUtpdENvbnN0YW50cywgVGl0bGVBbGlnbm1lbnQsIFNlbGVjdGlvbk1vZGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlcydcbmltcG9ydCB7IEF2YXRhclN0eWxlLCBMaXN0SXRlbVN0eWxlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG4vKipcbipcbiogQ29tZXRDaGF0QWRkTWVtYmVyc0NvbXBvbmVudENvbXBvbmVudCBpcyB1c2VkIHRvIHJlbmRlciBncm91cCBtZW1iZXJzIHRvIGFkZFxuKlxuKiBAdmVyc2lvbiAxLjAuMFxuKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4qXG4qL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1hZGQtbWVtYmVyc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1hZGQtbWVtYmVycy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRBZGRNZW1iZXJzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcblxuICBASW5wdXQoKSB1c2Vyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHNlYXJjaFJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvcHRpb25zITogKChtZW1iZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiBDb21ldENoYXRPcHRpb25bXSkgfCBudWxsO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIlxuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCJcbiAgQElucHV0KCkgc2hvd0JhY2tCdXR0b246IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm11bHRpcGxlO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gXCJTZWFyY2ggTWVtYmVyc1wiO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkFERF9NRU1CRVJTXCIpO1xuICBASW5wdXQoKSBvbkVycm9yOiAoKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkKSB8IG51bGwgPSAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgfVxuICBASW5wdXQoKSBvbkJhY2shOiAoKSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkNsb3NlITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAodXNlcjogQ29tZXRDaGF0LlVzZXIsIHNlbGVjdGVkOiBib29sZWFuKSA9PiB2b2lkO1xuXG4gIEBJbnB1dCgpIGJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQUREX01FTUJFUlNcIik7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7fVxuICBASW5wdXQoKSBzaG93U2VjdGlvbkhlYWRlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWN0aW9uSGVhZGVyRmllbGQ6IHN0cmluZyA9IFwibmFtZVwiO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fR1JPVVBTX0ZPVU5EXCIpXG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgb25BZGRNZW1iZXJzQnV0dG9uQ2xpY2shOiAoZ3VpZDogc3RyaW5nLCBtZW1iZXJzOiBDb21ldENoYXQuVXNlcltdKSA9PiB2b2lkO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5jZW50ZXI7XG4gIHRpdGxlQWxpZ25tZW50RW51bTogdHlwZW9mIFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnRcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgQElucHV0KCkgYWRkTWVtYmVyc1N0eWxlOiBBZGRNZW1iZXJzU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgU3RhdHVzSW5kaWNhdG9yU3R5bGU6IEJhc2VTdHlsZSA9IHt9XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHt9XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgYWN0aW9uTWVzc2FnZXNMaXN0OiBDb21ldENoYXQuQWN0aW9uW10gPSBbXVxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBhZGRNZW1iZXJCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDUxLCAxNTMsIDI1NSlcIixcbiAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIlwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgfVxuICBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHB1YmxpYyB1c2Vyc0xpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkOiBzdHJpbmcgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHVzZXJzU3R5bGU6IFVzZXJzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgIHNlYXJjaEJhY2tncm91bmQ6IFwiI2VmZWZlZlwiLFxuICAgIG9ubGluZVN0YXR1c0NvbG9yOiBcIlwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIixcbiAgICBzZWN0aW9uSGVhZGVyVGV4dEZvbnQ6IFwiXCIsXG4gICAgc2VjdGlvbkhlYWRlclRleHRDb2xvcjogXCJcIlxuICB9O1xuICBtZW1iZXJzTGlzdDogYW55W10gPSBbXTtcbiAgYWRkZWRNZW1iZXJzOiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFtdXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VXNlcnNTdHlsZSgpXG4gICAgdGhpcy5zZXRBZGRNZW1iZXJzU3R5bGUoKTtcbiAgICB0aGlzLm1lbWJlcnNMaXN0ID0gW11cbiAgICB0aGlzLmFkZGVkTWVtYmVycyA9IFtdXG4gICAgdGhpcy5hY3Rpb25NZXNzYWdlc0xpc3QgPSBbXVxuXG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7c3RyaW5nfSB1aWRcbiAgICovXG4gIGFkZFJlbW92ZVVzZXJzID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBzZWxlY3RlZDogYm9vbGVhbikgPT4ge1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIHNlbGVjdGVkKVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgbGV0IGtleSA9IHRoaXMubWVtYmVyc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAobTogYW55KSA9PiBtLmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpXG4gICAgICApO1xuICAgICAgaWYgKGtleSA+PSAwKSB7XG4gICAgICAgIHRoaXMubWVtYmVyc0xpc3Quc3BsaWNlKGtleSwgMSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZXQgbWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSBuZXcgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKHVzZXIuZ2V0VWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnQpXG4gICAgICAgIG1lbWJlci5zZXROYW1lKHVzZXIuZ2V0TmFtZSgpKVxuICAgICAgICBtZW1iZXIuc2V0R3VpZCh0aGlzLmdyb3VwLmdldEd1aWQoKSlcblxuICAgICAgICB0aGlzLm1lbWJlcnNMaXN0LnB1c2gobWVtYmVyKVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBjbG9zZUNsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25DbG9zZSkge1xuICAgICAgdGhpcy5vbkNsb3NlKClcbiAgICB9XG4gIH1cbiAgYmFja0NsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25CYWNrKSB7XG4gICAgICB0aGlzLm9uQmFjaygpXG4gICAgfVxuICB9XG4gIGFkZE1lbWJlcnNUb0dyb3VwID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMubWVtYmVyc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKHRoaXMub25BZGRNZW1iZXJzQnV0dG9uQ2xpY2spIHtcbiAgICAgICAgdGhpcy5vbkFkZE1lbWJlcnNCdXR0b25DbGljayh0aGlzLmdyb3VwLmdldEd1aWQoKSwgdGhpcy5tZW1iZXJzTGlzdClcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRNZW1iZXJzVG9Hcm91cCh0aGlzLmdyb3VwLmdldEd1aWQoKSwgdGhpcy5tZW1iZXJzTGlzdCwgW10pLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmhhc093blByb3BlcnR5KGtleSkgJiYgcmVzcG9uc2Vba2V5XSA9PT0gXCJzdWNjZXNzXCIpIHtcblxuICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1VzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciA9IHRoaXMubWVtYmVyc0xpc3QuZmluZCgodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHVzZXIuZ2V0VWlkKCkgPT09IGtleSk7XG4gICAgICAgICAgICAgIGlmIChtYXRjaGluZ1VzZXIpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQWN0aW9uTWVzc2FnZShtYXRjaGluZ1VzZXIpXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaGluZ1VzZXIuZ2V0U2NvcGUoKSkge1xuICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdVc2VyLnNldFNjb3BlKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnQgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuYWRkZWRNZW1iZXJzLnB1c2gobWF0Y2hpbmdVc2VyKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSArIHRoaXMuYWRkZWRNZW1iZXJzPy5sZW5ndGggfHwgMClcbiAgICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQubmV4dChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbWVzc2FnZXM6IHRoaXMuYWN0aW9uTWVzc2FnZXNMaXN0LFxuICAgICAgICAgICAgICB1c2Vyc0FkZGVkOiB0aGlzLmFkZGVkTWVtYmVycyxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW46IHRoaXMuZ3JvdXAsXG4gICAgICAgICAgICAgIHVzZXJBZGRlZEJ5OiB0aGlzLmxvZ2dlZEluVXNlciFcblxuICAgICAgICAgICAgfVxuICAgICAgICAgIClcbiAgICAgICAgICB0aGlzLm1lbWJlcnNMaXN0ID0gW11cbiAgICAgICAgICB0aGlzLmFkZGVkTWVtYmVycyA9IFtdXG4gICAgICAgICAgdGhpcy5hY3Rpb25NZXNzYWdlc0xpc3QgPSBbXVxuICAgICAgICAgIGlmICh0aGlzLm9uQmFjaykge1xuICAgICAgICAgICAgdGhpcy5vbkJhY2soKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgdGhpcy5tZW1iZXJzTGlzdCA9IFtdO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSB7XG4gICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24gPSBuZXcgQ29tZXRDaGF0LkFjdGlvbih0aGlzLmdyb3VwLmdldEd1aWQoKSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uIGFzIGFueSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbihDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRClcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkZvcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uT24oYWN0aW9uT24pXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKFwiZ3JvdXBfXCIgKyB0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRNZXNzYWdlKGAke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9IGFkZGVkICR7YWN0aW9uT24uZ2V0TmFtZSgpfWApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSlcbiAgICBjb25zb2xlLmxvZyh0aGlzLmFjdGlvbk1lc3NhZ2VzTGlzdClcbiAgICB0aGlzLmFjdGlvbk1lc3NhZ2VzTGlzdC5wdXNoKGFjdGlvbk1lc3NhZ2UpXG4gIH1cblxuICBzZXRBZGRNZW1iZXJzU3R5bGUoKSB7XG5cbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBZGRNZW1iZXJzU3R5bGUgPSBuZXcgQWRkTWVtYmVyc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhZGRNZW1iZXJzQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhZGRNZW1iZXJzQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgYWRkTWVtYmVyc0J1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiXG4gICAgfSlcbiAgICB0aGlzLmFkZE1lbWJlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmFkZE1lbWJlcnNTdHlsZSB9XG4gICAgdGhpcy5hZGRNZW1iZXJCdXR0b25TdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5hZGRNZW1iZXJzU3R5bGUuYWRkTWVtYmVyc0J1dHRvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5hZGRNZW1iZXJCdXR0b25TdHlsZS5idXR0b25UZXh0Rm9udCA9IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmFkZE1lbWJlcnNCdXR0b25UZXh0Rm9udDtcbiAgICB0aGlzLmFkZE1lbWJlckJ1dHRvblN0eWxlLmJ1dHRvblRleHRDb2xvciA9IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmFkZE1lbWJlcnNCdXR0b25UZXh0Q29sb3I7XG4gIH1cbiAgc2V0VXNlcnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBVc2Vyc1N0eWxlID0gbmV3IFVzZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpXG4gICAgfSlcbiAgICB0aGlzLnVzZXJzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hZGRNZW1iZXJzU3R5bGUgfVxuICB9XG5cbiAgLy8gc3R5bGVzXG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH1cbiAgfVxuICBjbG9zZUJ1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5hZGRNZW1iZXJzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH1cbiAgfVxuXG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5hZGRNZW1iZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmJvcmRlclJhZGl1c1xuICAgIH1cbiAgfVxuICBhZGRNZW1iZXJzU3R5bGVzID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBwYWRkaW5nOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5wYWRkaW5nXG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtYWRkLW1lbWJlcnNcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtYmFjay1idXR0b25cIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiYmFja0NsaWNrZWQoKVwiICpuZ0lmPVwic2hvd0JhY2tCdXR0b25cIj5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1hZGQtbWVtYmVyc19fd3JhcHBlclwiIFtuZ1N0eWxlXT1cImFkZE1lbWJlcnNTdHlsZXMoKVwiPlxuICAgPGRpdiBjbGFzcz1cImNjLXVzZXJzXCI+XG4gICAgPGNvbWV0Y2hhdC11c2VycyBbc2VhcmNoUGxhY2Vob2xkZXJdPVwic2VhcmNoUGxhY2Vob2xkZXJcIiBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJ1c2Vyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCJcbiAgICBbU3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiU3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cInNlYXJjaFJlcXVlc3RCdWlsZGVyXCJcbiAgICBbdXNlcnNTdHlsZV09XCJ1c2Vyc1N0eWxlXCJcbiAgICBbc3VidGl0bGVWaWV3XT1cInN1YnRpdGxlVmlld1wiXG4gICAgW29wdGlvbnNdPVwib3B0aW9uc1wiXG4gICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25TZWxlY3RdPVwiIGFkZFJlbW92ZVVzZXJzXCJcbiAgICBbc2VjdGlvbkhlYWRlckZpZWxkXT1cInNlY3Rpb25IZWFkZXJGaWVsZFwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiXG4gICAgW3Nob3dTZWN0aW9uSGVhZGVyXT1cInNob3dTZWN0aW9uSGVhZGVyXCJcbiAgICBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlld1wiXG4gICAgW21lbnVdPVwibWVudVwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiXG4gICAgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIlxuICAgIFtzZWxlY3Rpb25Nb2RlXT1cIiBzZWxlY3Rpb25Nb2RlXCJcbiAgICBbdGl0bGVdPVwidGl0bGVcIiAgPlxuXG4gICAgPC9jb21ldGNoYXQtdXNlcnM+XG4gICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtYWRkLW1lbWJlcnNfX2J1dHRvbnNcIj5cbiAgICAgIDxjb21ldGNoYXQtYnV0dG9uIGNsYXNzPVwiY2MtYWRkLW1lbWJlcnNfX2J1dHRvbnMtLWFkZFwiIFt0ZXh0XT1cImJ1dHRvblRleHRcIiBbYnV0dG9uU3R5bGVdPVwiYWRkTWVtYmVyQnV0dG9uU3R5bGVcIiAoY2xpY2spPVwiYWRkTWVtYmVyc1RvR3JvdXAoKVwiID48L2NvbWV0Y2hhdC1idXR0b24+XG5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1jbG9zZS1idXR0b25cIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJjbG9zZUJ1dHRvbkljb25VUkxcIiBbYnV0dG9uU3R5bGVdPVwiY2xvc2VCdXR0b25TdHlsZSgpXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImNsb3NlQ2xpY2tlZCgpXCI+XG5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuPC9kaXY+Il19