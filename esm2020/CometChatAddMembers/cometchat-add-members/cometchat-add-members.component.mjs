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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBZSxNQUFNLGVBQWUsQ0FBQztBQUNsSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQW1DLE1BQU0seUJBQXlCLENBQUM7QUFDOUgsT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQWtCLFVBQVUsRUFBRSxRQUFRLEVBQW1CLG9CQUFvQixFQUFFLHVCQUF1QixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTs7Ozs7QUFHaEw7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sNEJBQTRCO0lBOEN2QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBeEM5RSx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFHdEMsc0JBQWlCLEdBQVcsdUJBQXVCLENBQUE7UUFDbkQsdUJBQWtCLEdBQVcsb0JBQW9CLENBQUE7UUFDakQsbUJBQWMsR0FBWSxJQUFJLENBQUM7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Q0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFHRyxNQUFNO3NCQUFkLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLFFBQVE7c0JBQWhCLEtBQUs7Z0JBRUcsVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxLQUFLO3NCQUFiLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBR0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgT25Jbml0LCBJbnB1dCwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBUZW1wbGF0ZVJlZiB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBBZGRNZW1iZXJzU3R5bGUsIFVzZXJzU3R5bGUsIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSwgQmFzZVN0eWxlLCBVSUtpdFNldHRpbmdzQnVpbGRlciB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtc2hhcmVkJztcbmltcG9ydCAnQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50cydcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lLCBmb250SGVscGVyLCBsb2NhbGl6ZSwgQ29tZXRDaGF0T3B0aW9uLCBDb21ldENoYXRHcm91cEV2ZW50cywgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsIFRpdGxlQWxpZ25tZW50LCBTZWxlY3Rpb25Nb2RlIH0gZnJvbSAnQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXMnXG5pbXBvcnQgeyBBdmF0YXJTdHlsZSwgTGlzdEl0ZW1TdHlsZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuLyoqXG4qXG4qIENvbWV0Q2hhdEFkZE1lbWJlcnNDb21wb25lbnRDb21wb25lbnQgaXMgdXNlZCB0byByZW5kZXIgZ3JvdXAgbWVtYmVycyB0byBhZGRcbipcbiogQHZlcnNpb24gMS4wLjBcbiogQGF1dGhvciBDb21ldENoYXRUZWFtXG4qIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuKlxuKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtYWRkLW1lbWJlcnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtYWRkLW1lbWJlcnMuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1hZGQtbWVtYmVycy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0QWRkTWVtYmVyc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cbiAgQElucHV0KCkgdXNlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzZWFyY2hSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBtZW51ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb3B0aW9ucyE6ICgobWVtYmVyOiBDb21ldENoYXQuVXNlcikgPT4gQ29tZXRDaGF0T3B0aW9uW10pIHwgbnVsbDtcbiAgQElucHV0KCkgYmFja0J1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2JhY2tidXR0b24uc3ZnXCJcbiAgQElucHV0KCkgY2xvc2VCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiXG4gIEBJbnB1dCgpIHNob3dCYWNrQnV0dG9uOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5tdWx0aXBsZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IFwiU2VhcmNoIE1lbWJlcnNcIjtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJBRERfTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25CYWNrITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBzZWxlY3RlZDogYm9vbGVhbikgPT4gdm9pZDtcblxuICBASW5wdXQoKSBidXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkFERF9NRU1CRVJTXCIpO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge31cbiAgQElucHV0KCkgc2hvd1NlY3Rpb25IZWFkZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBzdHJpbmcgPSBcIm5hbWVcIjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX0dST1VQU19GT1VORFwiKVxuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIG9uQWRkTWVtYmVyc0J1dHRvbkNsaWNrITogKGd1aWQ6IHN0cmluZywgbWVtYmVyczogQ29tZXRDaGF0LlVzZXJbXSkgPT4gdm9pZDtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQuY2VudGVyO1xuICB0aXRsZUFsaWdubWVudEVudW06IHR5cGVvZiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIEBJbnB1dCgpIGFkZE1lbWJlcnNTdHlsZTogQWRkTWVtYmVyc1N0eWxlID0ge307XG4gIEBJbnB1dCgpIFN0YXR1c0luZGljYXRvclN0eWxlOiBCYXNlU3R5bGUgPSB7fVxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7fVxuICBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIGFjdGlvbk1lc3NhZ2VzTGlzdDogQ29tZXRDaGF0LkFjdGlvbltdID0gW11cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7IH1cbiAgYWRkTWVtYmVyQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYig1MSwgMTUzLCAyNTUpXCIsXG4gICAgcGFkZGluZzogXCI4cHhcIixcbiAgICBidXR0b25UZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICBidXR0b25UZXh0Rm9udDogXCJcIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiXG4gIH1cbiAgc2VhcmNoS2V5d29yZDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHVzZXJzUmVxdWVzdDogYW55O1xuICBwdWJsaWMgdGltZW91dDogYW55O1xuICBwdWJsaWMgdXNlcnNMaXN0OiBDb21ldENoYXQuVXNlcltdID0gW107XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZDogc3RyaW5nID0gXCJ1c2VybGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICB1c2Vyc1N0eWxlOiBVc2Vyc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgICBzZWFyY2hCYWNrZ3JvdW5kOiBcIiNlZmVmZWZcIixcbiAgICBvbmxpbmVTdGF0dXNDb2xvcjogXCJcIixcbiAgICBzZXBhcmF0b3JDb2xvcjogXCJyZ2IoMjIyIDIyMiAyMjIgLyA0NiUpXCIsXG4gICAgc2VjdGlvbkhlYWRlclRleHRGb250OiBcIlwiLFxuICAgIHNlY3Rpb25IZWFkZXJUZXh0Q29sb3I6IFwiXCJcbiAgfTtcbiAgbWVtYmVyc0xpc3Q6IGFueVtdID0gW107XG4gIGFkZGVkTWVtYmVyczogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyW10gPSBbXVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFVzZXJzU3R5bGUoKVxuICAgIHRoaXMuc2V0QWRkTWVtYmVyc1N0eWxlKCk7XG4gICAgdGhpcy5tZW1iZXJzTGlzdCA9IFtdXG4gICAgdGhpcy5hZGRlZE1lbWJlcnMgPSBbXVxuICAgIHRoaXMuYWN0aW9uTWVzc2FnZXNMaXN0ID0gW11cblxuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICB9KS5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdWlkXG4gICAqL1xuICBhZGRSZW1vdmVVc2VycyA9ICh1c2VyOiBDb21ldENoYXQuVXNlciwgc2VsZWN0ZWQ6IGJvb2xlYW4pID0+IHtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdCh1c2VyLCBzZWxlY3RlZClcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIGxldCBrZXkgPSB0aGlzLm1lbWJlcnNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgKG06IGFueSkgPT4gbS5nZXRVaWQoKSA9PT0gdXNlci5nZXRVaWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChrZXkgPj0gMCkge1xuICAgICAgICB0aGlzLm1lbWJlcnNMaXN0LnNwbGljZShrZXksIDEpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGV0IG1lbWJlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyID0gbmV3IENvbWV0Q2hhdC5Hcm91cE1lbWJlcih1c2VyLmdldFVpZCgpLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlclNjb3BlLnBhcnRpY2lwYW50KVxuICAgICAgICBtZW1iZXIuc2V0TmFtZSh1c2VyLmdldE5hbWUoKSlcbiAgICAgICAgbWVtYmVyLnNldEd1aWQodGhpcy5ncm91cC5nZXRHdWlkKCkpXG5cbiAgICAgICAgdGhpcy5tZW1iZXJzTGlzdC5wdXNoKG1lbWJlcilcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gIH1cbiAgY2xvc2VDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uQ2xvc2UpIHtcbiAgICAgIHRoaXMub25DbG9zZSgpXG4gICAgfVxuICB9XG4gIGJhY2tDbGlja2VkKCkge1xuICAgIGlmICh0aGlzLm9uQmFjaykge1xuICAgICAgdGhpcy5vbkJhY2soKVxuICAgIH1cbiAgfVxuICBhZGRNZW1iZXJzVG9Hcm91cCA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5ncm91cCAmJiB0aGlzLm1lbWJlcnNMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICh0aGlzLm9uQWRkTWVtYmVyc0J1dHRvbkNsaWNrKSB7XG4gICAgICAgIHRoaXMub25BZGRNZW1iZXJzQnV0dG9uQ2xpY2sodGhpcy5ncm91cC5nZXRHdWlkKCksIHRoaXMubWVtYmVyc0xpc3QpXG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBDb21ldENoYXQuYWRkTWVtYmVyc1RvR3JvdXAodGhpcy5ncm91cC5nZXRHdWlkKCksIHRoaXMubWVtYmVyc0xpc3QsIFtdKS50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIHJlc3BvbnNlW2tleV0gPT09IFwic3VjY2Vzc1wiKSB7XG5cbiAgICAgICAgICAgICAgY29uc3QgbWF0Y2hpbmdVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSB0aGlzLm1lbWJlcnNMaXN0LmZpbmQoKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB1c2VyLmdldFVpZCgpID09PSBrZXkpO1xuICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdVc2VyKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUFjdGlvbk1lc3NhZ2UobWF0Y2hpbmdVc2VyKVxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hpbmdVc2VyLmdldFNjb3BlKCkpIHtcbiAgICAgICAgICAgICAgICAgIG1hdGNoaW5nVXNlci5zZXRTY29wZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlclNjb3BlLnBhcnRpY2lwYW50IGFzIENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmFkZGVkTWVtYmVycy5wdXNoKG1hdGNoaW5nVXNlcilcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZ3JvdXAuc2V0TWVtYmVyc0NvdW50KHRoaXMuZ3JvdXAuZ2V0TWVtYmVyc0NvdW50KCkgKyB0aGlzLmFkZGVkTWVtYmVycz8ubGVuZ3RoIHx8IDApXG4gICAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckFkZGVkLm5leHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VzOiB0aGlzLmFjdGlvbk1lc3NhZ2VzTGlzdCxcbiAgICAgICAgICAgICAgdXNlcnNBZGRlZDogdGhpcy5hZGRlZE1lbWJlcnMsXG4gICAgICAgICAgICAgIHVzZXJBZGRlZEluOiB0aGlzLmdyb3VwLFxuICAgICAgICAgICAgICB1c2VyQWRkZWRCeTogdGhpcy5sb2dnZWRJblVzZXIhXG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICApXG4gICAgICAgICAgdGhpcy5tZW1iZXJzTGlzdCA9IFtdXG4gICAgICAgICAgdGhpcy5hZGRlZE1lbWJlcnMgPSBbXVxuICAgICAgICAgIHRoaXMuYWN0aW9uTWVzc2FnZXNMaXN0ID0gW11cbiAgICAgICAgICBpZiAodGhpcy5vbkJhY2spIHtcbiAgICAgICAgICAgIHRoaXMub25CYWNrKClcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgIHRoaXMubWVtYmVyc0xpc3QgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG4gIGNyZWF0ZUFjdGlvbk1lc3NhZ2UoYWN0aW9uT246IENvbWV0Q2hhdC5Hcm91cE1lbWJlcikge1xuICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uID0gbmV3IENvbWV0Q2hhdC5BY3Rpb24odGhpcy5ncm91cC5nZXRHdWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiBhcyBhbnkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb24oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25CeSh0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRBY3Rpb25Gb3IodGhpcy5ncm91cClcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbk9uKGFjdGlvbk9uKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0UmVjZWl2ZXIodGhpcy5ncm91cClcbiAgICBhY3Rpb25NZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRDb252ZXJzYXRpb25JZChcImdyb3VwX1wiICsgdGhpcy5ncm91cC5nZXRHdWlkKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0TWVzc2FnZShgJHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfSBhZGRlZCAke2FjdGlvbk9uLmdldE5hbWUoKX1gKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpXG4gICAgdGhpcy5hY3Rpb25NZXNzYWdlc0xpc3QucHVzaChhY3Rpb25NZXNzYWdlKVxuICB9XG5cbiAgc2V0QWRkTWVtYmVyc1N0eWxlKCkge1xuXG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQWRkTWVtYmVyc1N0eWxlID0gbmV3IEFkZE1lbWJlcnNTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwibm9uZVwiLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgc2VhcmNoQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYWRkTWVtYmVyc0J1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYWRkTWVtYmVyc0J1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGFkZE1lbWJlcnNCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBwYWRkaW5nOiBcIjAgMTAwcHhcIlxuICAgIH0pXG4gICAgdGhpcy5hZGRNZW1iZXJzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hZGRNZW1iZXJzU3R5bGUgfVxuICAgIHRoaXMuYWRkTWVtYmVyQnV0dG9uU3R5bGUuYmFja2dyb3VuZCA9IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmFkZE1lbWJlcnNCdXR0b25CYWNrZ3JvdW5kO1xuICAgIHRoaXMuYWRkTWVtYmVyQnV0dG9uU3R5bGUuYnV0dG9uVGV4dEZvbnQgPSB0aGlzLmFkZE1lbWJlcnNTdHlsZS5hZGRNZW1iZXJzQnV0dG9uVGV4dEZvbnQ7XG4gICAgdGhpcy5hZGRNZW1iZXJCdXR0b25TdHlsZS5idXR0b25UZXh0Q29sb3IgPSB0aGlzLmFkZE1lbWJlcnNTdHlsZS5hZGRNZW1iZXJzQnV0dG9uVGV4dENvbG9yO1xuICB9XG4gIHNldFVzZXJzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogVXNlcnNTdHlsZSA9IG5ldyBVc2Vyc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZWFyY2hJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKVxuICAgIH0pXG4gICAgdGhpcy51c2Vyc1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYWRkTWVtYmVyc1N0eWxlIH1cbiAgfVxuXG4gIC8vIHN0eWxlc1xuICBiYWNrQnV0dG9uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5iYWNrQnV0dG9uSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICB9XG4gIH1cbiAgY2xvc2VCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmNsb3NlQnV0dG9uSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KClcbiAgICB9XG4gIH1cblxuICB3cmFwcGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5hZGRNZW1iZXJzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5hZGRNZW1iZXJzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5hZGRNZW1iZXJzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cbiAgYWRkTWVtYmVyc1N0eWxlcyA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGFkZGluZzogdGhpcy5hZGRNZW1iZXJzU3R5bGUucGFkZGluZ1xuICAgIH1cbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWFkZC1tZW1iZXJzXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWJhY2stYnV0dG9uXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIiBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIiAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImJhY2tDbGlja2VkKClcIiAqbmdJZj1cInNob3dCYWNrQnV0dG9uXCI+XG5cbiAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtYWRkLW1lbWJlcnNfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJhZGRNZW1iZXJzU3R5bGVzKClcIj5cbiAgIDxkaXYgY2xhc3M9XCJjYy11c2Vyc1wiPlxuICAgIDxjb21ldGNoYXQtdXNlcnMgW3NlYXJjaFBsYWNlaG9sZGVyXT1cInNlYXJjaFBsYWNlaG9sZGVyXCIgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiXG4gICAgW1N0YXR1c0luZGljYXRvclN0eWxlXT1cIlN0YXR1c0luZGljYXRvclN0eWxlXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIlxuICAgIFtzZWFyY2hSZXF1ZXN0QnVpbGRlcl09XCJzZWFyY2hSZXF1ZXN0QnVpbGRlclwiXG4gICAgW3VzZXJzU3R5bGVdPVwidXNlcnNTdHlsZVwiXG4gICAgW3N1YnRpdGxlVmlld109XCJzdWJ0aXRsZVZpZXdcIlxuICAgIFtvcHRpb25zXT1cIm9wdGlvbnNcIlxuICAgIFt1c2Vyc1JlcXVlc3RCdWlsZGVyXT1cInVzZXJzUmVxdWVzdEJ1aWxkZXJcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiXG4gICAgW29uU2VsZWN0XT1cIiBhZGRSZW1vdmVVc2Vyc1wiXG4gICAgW3NlY3Rpb25IZWFkZXJGaWVsZF09XCJzZWN0aW9uSGVhZGVyRmllbGRcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImVycm9yU3RhdGVWaWV3XCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIlxuICAgIFtzaG93U2VjdGlvbkhlYWRlcl09XCJzaG93U2VjdGlvbkhlYWRlclwiXG4gICAgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXdcIlxuICAgIFttZW51XT1cIm1lbnVcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIlxuICAgIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCJcbiAgICBbc2VsZWN0aW9uTW9kZV09XCIgc2VsZWN0aW9uTW9kZVwiXG4gICAgW3RpdGxlXT1cInRpdGxlXCIgID5cblxuICAgIDwvY29tZXRjaGF0LXVzZXJzPlxuICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLWFkZC1tZW1iZXJzX19idXR0b25zXCI+XG4gICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBjbGFzcz1cImNjLWFkZC1tZW1iZXJzX19idXR0b25zLS1hZGRcIiBbdGV4dF09XCJidXR0b25UZXh0XCIgW2J1dHRvblN0eWxlXT1cImFkZE1lbWJlckJ1dHRvblN0eWxlXCIgKGNsaWNrKT1cImFkZE1lbWJlcnNUb0dyb3VwKClcIiA+PC9jb21ldGNoYXQtYnV0dG9uPlxuXG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtY2xvc2UtYnV0dG9uXCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGUoKVwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJjbG9zZUNsaWNrZWQoKVwiPlxuXG4gICAgPC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbjwvZGl2PiJdfQ==