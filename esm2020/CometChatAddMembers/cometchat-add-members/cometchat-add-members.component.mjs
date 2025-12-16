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
        this.showSelectedMembersPreview = false;
        this.selectedMemberPreviewStyle = {};
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
CometChatAddMembersComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatAddMembersComponent, selector: "cometchat-add-members", inputs: { usersRequestBuilder: "usersRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", disableUsersPresence: "disableUsersPresence", menu: "menu", options: "options", backButtonIconURL: "backButtonIconURL", closeButtonIconURL: "closeButtonIconURL", showBackButton: "showBackButton", hideSeparator: "hideSeparator", selectionMode: "selectionMode", searchPlaceholder: "searchPlaceholder", hideError: "hideError", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onBack: "onBack", onClose: "onClose", onSelect: "onSelect", buttonText: "buttonText", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", listItemStyle: "listItemStyle", showSectionHeader: "showSectionHeader", sectionHeaderField: "sectionHeaderField", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", onAddMembersButtonClick: "onAddMembersButtonClick", titleAlignment: "titleAlignment", addMembersStyle: "addMembersStyle", showSelectedMembersPreview: "showSelectedMembersPreview", selectedMemberPreviewStyle: "selectedMemberPreviewStyle", StatusIndicatorStyle: "StatusIndicatorStyle", statusIndicatorStyle: "statusIndicatorStyle", avatarStyle: "avatarStyle" }, ngImport: i0, template: "<div class=\"cc-add-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-back-button\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\"  (cc-button-clicked)=\"backClicked()\" *ngIf=\"showBackButton\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-add-members__wrapper\" [ngStyle]=\"addMembersStyles()\">\n   <div class=\"cc-users\">\n    <cometchat-users [searchPlaceholder]=\"searchPlaceholder\" [usersRequestBuilder]=\"usersRequestBuilder\"\n    [hideSearch]=\"hideSearch\"\n    [statusIndicatorStyle]=\"statusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\"\n    [searchIconURL]=\"searchIconURL\"\n    [searchRequestBuilder]=\"searchRequestBuilder\"\n    [usersStyle]=\"usersStyle\"\n    [subtitleView]=\"subtitleView\"\n    [options]=\"options\"\n    [usersRequestBuilder]=\"usersRequestBuilder\"\n    [emptyStateView]=\"emptyStateView\"\n    [onSelect]=\" addRemoveUsers\"\n    [sectionHeaderField]=\"sectionHeaderField\"\n    [loadingIconURL]=\"loadingIconURL\"\n    [errorStateView]=\"errorStateView\"\n    [loadingStateView]=\"loadingStateView\"\n    [titleAlignment]=\"titleAlignment\"\n    [showSectionHeader]=\"showSectionHeader\"\n    [listItemView]=\"listItemView\"\n    [menu]=\"menu\"\n    [hideSeparator]=\"hideSeparator\"\n    [hideError]=\"hideError\"\n    [selectionMode]=\" selectionMode\"\n    [listItemStyle]=\"listItemStyle\"\n    [title]=\"title\"  \n    [showSelectedUsersPreview]=\"showSelectedMembersPreview\"\n    [selectedUserPreviewStyle]=\"selectedMemberPreviewStyle\"\n    >\n\n    </cometchat-users>\n\n   </div>\n\n    <div class=\"cc-add-members__buttons\">\n      <cometchat-button [disabled]=\"!membersList || (membersList && membersList!.length <= 0)\" class=\"cc-add-members__buttons--add\" [text]=\"buttonText\" [buttonStyle]=\"addMemberButtonStyle\" (click)=\"addMembersToGroup()\" ></cometchat-button>\n\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>", styles: [".cc-add-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-add-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-users{height:90%}.cc-add-members__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-add-members__buttons--add{height:42px;width:100%}\n"], components: [{ type: i2.CometChatUsersComponent, selector: "cometchat-users", inputs: ["usersRequestBuilder", "searchRequestBuilder", "subtitleView", "disableUsersPresence", "listItemView", "menu", "options", "activeUser", "hideSeparator", "searchPlaceholder", "hideError", "selectionMode", "searchIconURL", "hideSearch", "title", "onError", "emptyStateView", "onSelect", "errorStateView", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "usersStyle", "listItemStyle", "statusIndicatorStyle", "avatarStyle", "selectedUserPreviewStyle", "showSelectedUsersPreview", "onItemClick", "searchKeyword", "onEmpty", "userPresencePlacement", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatAddMembersComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-add-members", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-add-members\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-back-button\">\n    <cometchat-button [iconURL]=\"backButtonIconURL\" [buttonStyle]=\"backButtonStyle()\"  (cc-button-clicked)=\"backClicked()\" *ngIf=\"showBackButton\">\n\n    </cometchat-button>\n  </div>\n  <div class=\"cc-add-members__wrapper\" [ngStyle]=\"addMembersStyles()\">\n   <div class=\"cc-users\">\n    <cometchat-users [searchPlaceholder]=\"searchPlaceholder\" [usersRequestBuilder]=\"usersRequestBuilder\"\n    [hideSearch]=\"hideSearch\"\n    [statusIndicatorStyle]=\"statusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\"\n    [searchIconURL]=\"searchIconURL\"\n    [searchRequestBuilder]=\"searchRequestBuilder\"\n    [usersStyle]=\"usersStyle\"\n    [subtitleView]=\"subtitleView\"\n    [options]=\"options\"\n    [usersRequestBuilder]=\"usersRequestBuilder\"\n    [emptyStateView]=\"emptyStateView\"\n    [onSelect]=\" addRemoveUsers\"\n    [sectionHeaderField]=\"sectionHeaderField\"\n    [loadingIconURL]=\"loadingIconURL\"\n    [errorStateView]=\"errorStateView\"\n    [loadingStateView]=\"loadingStateView\"\n    [titleAlignment]=\"titleAlignment\"\n    [showSectionHeader]=\"showSectionHeader\"\n    [listItemView]=\"listItemView\"\n    [menu]=\"menu\"\n    [hideSeparator]=\"hideSeparator\"\n    [hideError]=\"hideError\"\n    [selectionMode]=\" selectionMode\"\n    [listItemStyle]=\"listItemStyle\"\n    [title]=\"title\"  \n    [showSelectedUsersPreview]=\"showSelectedMembersPreview\"\n    [selectedUserPreviewStyle]=\"selectedMemberPreviewStyle\"\n    >\n\n    </cometchat-users>\n\n   </div>\n\n    <div class=\"cc-add-members__buttons\">\n      <cometchat-button [disabled]=\"!membersList || (membersList && membersList!.length <= 0)\" class=\"cc-add-members__buttons--add\" [text]=\"buttonText\" [buttonStyle]=\"addMemberButtonStyle\" (click)=\"addMembersToGroup()\" ></cometchat-button>\n\n    </div>\n  </div>\n  <div class=\"cc-close-button\">\n    <cometchat-button [iconURL]=\"closeButtonIconURL\" [buttonStyle]=\"closeButtonStyle()\" (cc-button-clicked)=\"closeClicked()\">\n\n    </cometchat-button>\n  </div>\n</div>", styles: [".cc-add-members{display:flex;height:100%;width:100%;overflow:hidden}.cc-back-button{position:absolute;left:8px;padding:12px 8px 8px}.cc-add-members__wrapper{height:100%;width:100%;padding:8px}.cc-close-button{position:absolute;right:8px;padding:12px 8px 8px}.cc-users{height:90%}.cc-add-members__buttons{height:10%;width:100%;display:flex;align-items:center;justify-content:center}.button__icon{display:flex;justify-content:flex-end}.cc-add-members__buttons--add{height:42px;width:100%}\n"] }]
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
            }], showSelectedMembersPreview: [{
                type: Input
            }], selectedMemberPreviewStyle: [{
                type: Input
            }], StatusIndicatorStyle: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0QWRkTWVtYmVycy9jb21ldGNoYXQtYWRkLW1lbWJlcnMvY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQVUsS0FBSyxFQUFxQix1QkFBdUIsRUFBYyxNQUFNLGVBQWUsQ0FBQztBQUNqSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQXVDLE1BQU0seUJBQXlCLENBQUM7QUFDbEksT0FBTywyQkFBMkIsQ0FBQTtBQUNsQyxPQUFPLEVBQWtCLFVBQVUsRUFBRSxRQUFRLEVBQW1CLG9CQUFvQixFQUFFLHVCQUF1QixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTs7Ozs7QUFHaEw7Ozs7Ozs7O0VBUUU7QUFPRixNQUFNLE9BQU8sNEJBQTRCO0lBc0R2QyxZQUFvQixHQUFzQixFQUFVLFlBQW1DO1FBQW5FLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQXVCO1FBaEQ5RSx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFHdEMsc0JBQWlCLEdBQVcsdUJBQXVCLENBQUE7UUFDbkQsdUJBQWtCLEdBQVcsb0JBQW9CLENBQUE7UUFDakQsbUJBQWMsR0FBWSxJQUFJLENBQUM7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WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgSW5wdXQsIENoYW5nZURldGVjdG9yUmVmLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVGVtcGxhdGVSZWZ9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBBZGRNZW1iZXJzU3R5bGUsIFVzZXJzU3R5bGUsIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSwgQmFzZVN0eWxlLCBTZWxlY3RlZFVzZXJQcmV2aWV3U3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZCc7XG5pbXBvcnQgJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZSwgZm9udEhlbHBlciwgbG9jYWxpemUsIENvbWV0Q2hhdE9wdGlvbiwgQ29tZXRDaGF0R3JvdXBFdmVudHMsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBUaXRsZUFsaWdubWVudCwgU2VsZWN0aW9uTW9kZSB9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzJ1xuaW1wb3J0IHsgQXZhdGFyU3R5bGUsIExpc3RJdGVtU3R5bGUgfSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbi8qKlxuKlxuKiBDb21ldENoYXRBZGRNZW1iZXJzQ29tcG9uZW50Q29tcG9uZW50IGlzIHVzZWQgdG8gcmVuZGVyIGdyb3VwIG1lbWJlcnMgdG8gYWRkXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWFkZC1tZW1iZXJzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWFkZC1tZW1iZXJzLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtYWRkLW1lbWJlcnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdEFkZE1lbWJlcnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gIEBJbnB1dCgpIHVzZXJzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc2VhcmNoUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9wdGlvbnMhOiAoKG1lbWJlcjogQ29tZXRDaGF0LlVzZXIpID0+IENvbWV0Q2hhdE9wdGlvbltdKSB8IG51bGw7XG4gIEBJbnB1dCgpIGJhY2tCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9iYWNrYnV0dG9uLnN2Z1wiXG4gIEBJbnB1dCgpIGNsb3NlQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIlxuICBASW5wdXQoKSBzaG93QmFja0J1dHRvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubXVsdGlwbGU7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJBRERfTUVNQkVSU1wiKTtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cbiAgQElucHV0KCkgb25CYWNrITogKCkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25DbG9zZSE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBzZWxlY3RlZDogYm9vbGVhbikgPT4gdm9pZDtcblxuICBASW5wdXQoKSBidXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkFERF9NRU1CRVJTXCIpO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge31cbiAgQElucHV0KCkgc2hvd1NlY3Rpb25IZWFkZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBzdHJpbmcgPSBcIm5hbWVcIjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX1VTRVJTX0ZPVU5EXCIpXG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgb25BZGRNZW1iZXJzQnV0dG9uQ2xpY2shOiAoZ3VpZDogc3RyaW5nLCBtZW1iZXJzOiBDb21ldENoYXQuVXNlcltdKSA9PiB2b2lkO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5jZW50ZXI7XG4gIHRpdGxlQWxpZ25tZW50RW51bTogdHlwZW9mIFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnRcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgQElucHV0KCkgYWRkTWVtYmVyc1N0eWxlOiBBZGRNZW1iZXJzU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgc2hvd1NlbGVjdGVkTWVtYmVyc1ByZXZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0ZWRNZW1iZXJQcmV2aWV3U3R5bGU6IFNlbGVjdGVkVXNlclByZXZpZXdTdHlsZSA9IHt9O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBUaGlzIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgYXMgb2YgdmVyc2lvbiA0LjMuMTQuIFVzZSBgc3RhdHVzSW5kaWNhdG9yU3R5bGVgIGluc3RlYWQuXG4gICAqL1xuICBASW5wdXQoKSBTdGF0dXNJbmRpY2F0b3JTdHlsZTogQmFzZVN0eWxlID0ge307XG5cbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IEJhc2VTdHlsZSA9IHt9XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHt9XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgYWN0aW9uTWVzc2FnZXNMaXN0OiBDb21ldENoYXQuQWN0aW9uW10gPSBbXVxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UpIHsgfVxuICBhZGRNZW1iZXJCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDUxLCAxNTMsIDI1NSlcIixcbiAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgIGJ1dHRvblRleHRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgIGJ1dHRvblRleHRGb250OiBcIlwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCJcbiAgfVxuICBzZWFyY2hLZXl3b3JkOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0OiBhbnk7XG4gIHB1YmxpYyB0aW1lb3V0OiBhbnk7XG4gIHB1YmxpYyB1c2Vyc0xpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkOiBzdHJpbmcgPSBcInVzZXJsaXN0X1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHVzZXJzU3R5bGU6IFVzZXJzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgIHNlYXJjaEJhY2tncm91bmQ6IFwiI2VmZWZlZlwiLFxuICAgIG9ubGluZVN0YXR1c0NvbG9yOiBcIlwiLFxuICAgIHNlcGFyYXRvckNvbG9yOiBcInJnYigyMjIgMjIyIDIyMiAvIDQ2JSlcIixcbiAgICBzZWN0aW9uSGVhZGVyVGV4dEZvbnQ6IFwiXCIsXG4gICAgc2VjdGlvbkhlYWRlclRleHRDb2xvcjogXCJcIlxuICB9O1xuICBtZW1iZXJzTGlzdDogYW55W10gPSBbXTtcbiAgYWRkZWRNZW1iZXJzOiBDb21ldENoYXQuR3JvdXBNZW1iZXJbXSA9IFtdXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VXNlcnNTdHlsZSgpXG4gICAgdGhpcy5zZXRBZGRNZW1iZXJzU3R5bGUoKTtcbiAgICB0aGlzLm1lbWJlcnNMaXN0ID0gW11cbiAgICB0aGlzLmFkZGVkTWVtYmVycyA9IFtdXG4gICAgdGhpcy5hY3Rpb25NZXNzYWdlc0xpc3QgPSBbXVxuXG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgIH0pLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7c3RyaW5nfSB1aWRcbiAgICovXG4gIGFkZFJlbW92ZVVzZXJzID0gKHVzZXI6IENvbWV0Q2hhdC5Vc2VyLCBzZWxlY3RlZDogYm9vbGVhbikgPT4ge1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KHVzZXIsIHNlbGVjdGVkKVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgbGV0IGtleSA9IHRoaXMubWVtYmVyc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAobTogYW55KSA9PiBtLmdldFVpZCgpID09PSB1c2VyLmdldFVpZCgpXG4gICAgICApO1xuICAgICAgaWYgKGtleSA+PSAwKSB7XG4gICAgICAgIHRoaXMubWVtYmVyc0xpc3Quc3BsaWNlKGtleSwgMSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZXQgbWVtYmVyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIgPSBuZXcgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKHVzZXIuZ2V0VWlkKCksIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnQpXG4gICAgICAgIG1lbWJlci5zZXROYW1lKHVzZXIuZ2V0TmFtZSgpKVxuICAgICAgICBtZW1iZXIuc2V0R3VpZCh0aGlzLmdyb3VwLmdldEd1aWQoKSlcblxuICAgICAgICB0aGlzLm1lbWJlcnNMaXN0LnB1c2gobWVtYmVyKVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgfVxuICBjbG9zZUNsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25DbG9zZSkge1xuICAgICAgdGhpcy5vbkNsb3NlKClcbiAgICB9XG4gIH1cbiAgYmFja0NsaWNrZWQoKSB7XG4gICAgaWYgKHRoaXMub25CYWNrKSB7XG4gICAgICB0aGlzLm9uQmFjaygpXG4gICAgfVxuICB9XG4gIGFkZE1lbWJlcnNUb0dyb3VwID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLmdyb3VwICYmIHRoaXMubWVtYmVyc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKHRoaXMub25BZGRNZW1iZXJzQnV0dG9uQ2xpY2spIHtcbiAgICAgICAgdGhpcy5vbkFkZE1lbWJlcnNCdXR0b25DbGljayh0aGlzLmdyb3VwLmdldEd1aWQoKSwgdGhpcy5tZW1iZXJzTGlzdClcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRNZW1iZXJzVG9Hcm91cCh0aGlzLmdyb3VwLmdldEd1aWQoKSwgdGhpcy5tZW1iZXJzTGlzdCwgW10pLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmhhc093blByb3BlcnR5KGtleSkgJiYgcmVzcG9uc2Vba2V5XSA9PT0gXCJzdWNjZXNzXCIpIHtcblxuICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1VzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciA9IHRoaXMubWVtYmVyc0xpc3QuZmluZCgodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHVzZXIuZ2V0VWlkKCkgPT09IGtleSk7XG4gICAgICAgICAgICAgIGlmIChtYXRjaGluZ1VzZXIpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQWN0aW9uTWVzc2FnZShtYXRjaGluZ1VzZXIpXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaGluZ1VzZXIuZ2V0U2NvcGUoKSkge1xuICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdVc2VyLnNldFNjb3BlKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnQgYXMgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuYWRkZWRNZW1iZXJzLnB1c2gobWF0Y2hpbmdVc2VyKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5ncm91cC5zZXRNZW1iZXJzQ291bnQodGhpcy5ncm91cC5nZXRNZW1iZXJzQ291bnQoKSArIHRoaXMuYWRkZWRNZW1iZXJzPy5sZW5ndGggfHwgMClcbiAgICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQubmV4dChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbWVzc2FnZXM6IHRoaXMuYWN0aW9uTWVzc2FnZXNMaXN0LFxuICAgICAgICAgICAgICB1c2Vyc0FkZGVkOiB0aGlzLmFkZGVkTWVtYmVycyxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW46IHRoaXMuZ3JvdXAsXG4gICAgICAgICAgICAgIHVzZXJBZGRlZEJ5OiB0aGlzLmxvZ2dlZEluVXNlciFcblxuICAgICAgICAgICAgfVxuICAgICAgICAgIClcbiAgICAgICAgICB0aGlzLm1lbWJlcnNMaXN0ID0gW11cbiAgICAgICAgICB0aGlzLmFkZGVkTWVtYmVycyA9IFtdXG4gICAgICAgICAgdGhpcy5hY3Rpb25NZXNzYWdlc0xpc3QgPSBbXVxuICAgICAgICAgIGlmICh0aGlzLm9uQmFjaykge1xuICAgICAgICAgICAgdGhpcy5vbkJhY2soKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgdGhpcy5tZW1iZXJzTGlzdCA9IFtdO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbiAgY3JlYXRlQWN0aW9uTWVzc2FnZShhY3Rpb25PbjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyKSB7XG4gICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24gPSBuZXcgQ29tZXRDaGF0LkFjdGlvbih0aGlzLmdyb3VwLmdldEd1aWQoKSwgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwLCBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uIGFzIGFueSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbihDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRClcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkJ5KHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldEFjdGlvbkZvcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0QWN0aW9uT24oYWN0aW9uT24pXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRSZWNlaXZlcih0aGlzLmdyb3VwKVxuICAgIGFjdGlvbk1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICBhY3Rpb25NZXNzYWdlLnNldENvbnZlcnNhdGlvbklkKFwiZ3JvdXBfXCIgKyB0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICBhY3Rpb25NZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRNZXNzYWdlKGAke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9IGFkZGVkICR7YWN0aW9uT24uZ2V0TmFtZSgpfWApXG4gICAgYWN0aW9uTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSlcbiAgICB0aGlzLmFjdGlvbk1lc3NhZ2VzTGlzdC5wdXNoKGFjdGlvbk1lc3NhZ2UpXG4gIH1cblxuICBzZXRBZGRNZW1iZXJzU3R5bGUoKSB7XG5cbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBZGRNZW1iZXJzU3R5bGUgPSBuZXcgQWRkTWVtYmVyc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCJub25lXCIsXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc2VhcmNoVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhZGRNZW1iZXJzQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhZGRNZW1iZXJzQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgYWRkTWVtYmVyc0J1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHBhZGRpbmc6IFwiMCAxMDBweFwiXG4gICAgfSlcbiAgICB0aGlzLmFkZE1lbWJlcnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmFkZE1lbWJlcnNTdHlsZSB9XG4gICAgdGhpcy5hZGRNZW1iZXJCdXR0b25TdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5hZGRNZW1iZXJzU3R5bGUuYWRkTWVtYmVyc0J1dHRvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5hZGRNZW1iZXJCdXR0b25TdHlsZS5idXR0b25UZXh0Rm9udCA9IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmFkZE1lbWJlcnNCdXR0b25UZXh0Rm9udDtcbiAgICB0aGlzLmFkZE1lbWJlckJ1dHRvblN0eWxlLmJ1dHRvblRleHRDb2xvciA9IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmFkZE1lbWJlcnNCdXR0b25UZXh0Q29sb3I7XG4gIH1cbiAgc2V0VXNlcnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBVc2Vyc1N0eWxlID0gbmV3IFVzZXJzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlYXJjaEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNlYXJjaFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpXG4gICAgfSlcbiAgICB0aGlzLnVzZXJzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hZGRNZW1iZXJzU3R5bGUgfVxuICB9XG5cbiAgLy8gc3R5bGVzXG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmJhY2tCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH1cbiAgfVxuICBjbG9zZUJ1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5hZGRNZW1iZXJzU3R5bGUuY2xvc2VCdXR0b25JY29uVGludCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKVxuICAgIH1cbiAgfVxuXG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5hZGRNZW1iZXJzU3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuYWRkTWVtYmVyc1N0eWxlLmJvcmRlclJhZGl1c1xuICAgIH1cbiAgfVxuICBhZGRNZW1iZXJzU3R5bGVzID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBwYWRkaW5nOiB0aGlzLmFkZE1lbWJlcnNTdHlsZS5wYWRkaW5nXG4gICAgfVxuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtYWRkLW1lbWJlcnNcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtYmFjay1idXR0b25cIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiYmFja0NsaWNrZWQoKVwiICpuZ0lmPVwic2hvd0JhY2tCdXR0b25cIj5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1hZGQtbWVtYmVyc19fd3JhcHBlclwiIFtuZ1N0eWxlXT1cImFkZE1lbWJlcnNTdHlsZXMoKVwiPlxuICAgPGRpdiBjbGFzcz1cImNjLXVzZXJzXCI+XG4gICAgPGNvbWV0Y2hhdC11c2VycyBbc2VhcmNoUGxhY2Vob2xkZXJdPVwic2VhcmNoUGxhY2Vob2xkZXJcIiBbdXNlcnNSZXF1ZXN0QnVpbGRlcl09XCJ1c2Vyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiXG4gICAgW3NlYXJjaFJlcXVlc3RCdWlsZGVyXT1cInNlYXJjaFJlcXVlc3RCdWlsZGVyXCJcbiAgICBbdXNlcnNTdHlsZV09XCJ1c2Vyc1N0eWxlXCJcbiAgICBbc3VidGl0bGVWaWV3XT1cInN1YnRpdGxlVmlld1wiXG4gICAgW29wdGlvbnNdPVwib3B0aW9uc1wiXG4gICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICBbb25TZWxlY3RdPVwiIGFkZFJlbW92ZVVzZXJzXCJcbiAgICBbc2VjdGlvbkhlYWRlckZpZWxkXT1cInNlY3Rpb25IZWFkZXJGaWVsZFwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiXG4gICAgW3Nob3dTZWN0aW9uSGVhZGVyXT1cInNob3dTZWN0aW9uSGVhZGVyXCJcbiAgICBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlld1wiXG4gICAgW21lbnVdPVwibWVudVwiXG4gICAgW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiXG4gICAgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIlxuICAgIFtzZWxlY3Rpb25Nb2RlXT1cIiBzZWxlY3Rpb25Nb2RlXCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICBbdGl0bGVdPVwidGl0bGVcIiAgXG4gICAgW3Nob3dTZWxlY3RlZFVzZXJzUHJldmlld109XCJzaG93U2VsZWN0ZWRNZW1iZXJzUHJldmlld1wiXG4gICAgW3NlbGVjdGVkVXNlclByZXZpZXdTdHlsZV09XCJzZWxlY3RlZE1lbWJlclByZXZpZXdTdHlsZVwiXG4gICAgPlxuXG4gICAgPC9jb21ldGNoYXQtdXNlcnM+XG5cbiAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cImNjLWFkZC1tZW1iZXJzX19idXR0b25zXCI+XG4gICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbZGlzYWJsZWRdPVwiIW1lbWJlcnNMaXN0IHx8IChtZW1iZXJzTGlzdCAmJiBtZW1iZXJzTGlzdCEubGVuZ3RoIDw9IDApXCIgY2xhc3M9XCJjYy1hZGQtbWVtYmVyc19fYnV0dG9ucy0tYWRkXCIgW3RleHRdPVwiYnV0dG9uVGV4dFwiIFtidXR0b25TdHlsZV09XCJhZGRNZW1iZXJCdXR0b25TdHlsZVwiIChjbGljayk9XCJhZGRNZW1iZXJzVG9Hcm91cCgpXCIgPjwvY29tZXRjaGF0LWJ1dHRvbj5cblxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLWNsb3NlLWJ1dHRvblwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cImNsb3NlQnV0dG9uSWNvblVSTFwiIFtidXR0b25TdHlsZV09XCJjbG9zZUJ1dHRvblN0eWxlKClcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY2xvc2VDbGlja2VkKClcIj5cblxuICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG48L2Rpdj4iXX0=