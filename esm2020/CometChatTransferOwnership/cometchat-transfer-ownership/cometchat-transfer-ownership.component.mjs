import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { localize, TitleAlignment, SelectionMode, CometChatGroupEvents, fontHelper } from "@cometchat/uikit-resources";
import { TransferOwnershipStyle, GroupMembersStyle } from "@cometchat/uikit-shared";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatGroupMembers/cometchat-group-members/cometchat-group-members.component";
import * as i3 from "@angular/common";
/**
*
* CometChatTransferOwnershipComponent is used to render users list to transfer wonership
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export class CometChatTransferOwnershipComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.disableUsersPresence = false;
        this.closeButtonIconURL = "assets/close2x.svg";
        this.hideSeparator = false;
        this.searchPlaceholder = localize("SEARCH");
        this.searchIconURL = "assets/search.svg";
        this.hideSearch = true;
        this.title = localize("TRANSFER_OWNERSHIP");
        this.onError = (error) => {
            console.log(error);
        };
        this.loadingIconURL = "assets/Spinner.svg";
        this.emptyStateText = localize("NO_GROUPS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.statusIndicatorStyle = {
            height: "10px",
            width: "10px",
            borderRadius: "16px",
            border: ""
        };
        this.transferOwnershipStyle = {
            width: "360px",
            height: "650px",
            borderRadius: "8px",
        };
        this.transferButtonText = localize("TRANSFER_OWNERSHIP");
        this.cancelButtonText = localize("CANCEL");
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.groupMembersStyle = {
            width: "100%",
            height: "100%",
            background: "",
            border: "",
            borderRadius: "8px",
            padding: "0"
        };
        this.listItemStyle = {
            height: "100%",
            width: "100%",
            background: "",
            separatorColor: "rgb(222 222 222 / 46%)"
        };
        this.titleAlignment = TitleAlignment.center;
        this.selectionMode = SelectionMode.none;
        this.showBackButton = false;
        this.transferButtonStyle = {
            height: "100%",
            width: "100%",
            background: "rgb(51, 153, 255)",
            padding: "8px",
            buttonTextColor: "white",
            buttonTextFont: "600 15px Inter, sans-serif",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "none",
            borderRadius: "8px"
        };
        this.cancelButtonStyle = {
            height: "100%",
            width: "100%",
            background: "white",
            padding: "8px",
            buttonTextColor: "black",
            buttonTextFont: "600 15px Inter, sans-serif",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "1px solid #e0e0e0",
            borderRadius: "8px"
        };
        this.onOwnerSelected = (member) => {
            this.selectedMember = member;
        };
        this.onTransferClick = () => {
            CometChat.getUser(this.selectedMember?.getUid()).then((user) => {
                this.selectedUser = user;
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
            if (this.onTransferOwnership) {
                this.onTransferOwnership(this.selectedMember);
                this.selectedMember = null;
            }
            else {
                if (this.selectedMember) {
                    CometChat.transferGroupOwnership(this.group.getGuid(), this.selectedMember.getUid()).then((response) => {
                        this.group.setOwner(this.selectedMember.getUid());
                        CometChatGroupEvents.ccOwnershipChanged.next({
                            group: this.group,
                            newOwner: this.selectedMember
                        });
                        this.selectedMember = null;
                    })
                        .catch((error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                    });
                }
            }
        };
        this.closeClicked = () => {
            if (this.onClose) {
                this.onClose();
            }
        };
        this.membersStyle = () => {
            return {
                height: this.groupMembersStyle.height,
                width: this.groupMembersStyle.width,
                background: this.groupMembersStyle.background,
                border: this.groupMembersStyle.border,
                borderRadius: this.groupMembersStyle.borderRadius
            };
        };
        this.wrapperStyle = () => {
            return {
                height: this.transferOwnershipStyle.height || "650px",
                width: this.transferOwnershipStyle.width || "360px",
                background: this.transferOwnershipStyle.background,
                border: this.transferOwnershipStyle.border,
                borderRadius: this.transferOwnershipStyle.borderRadius
            };
        };
        this.getScopeStyle = () => {
            return {
                textFont: this.transferOwnershipStyle.MemberScopeTextFont,
                textColor: this.transferOwnershipStyle.MemberScopeTextColor
            };
        };
    }
    ngOnInit() {
        CometChat.getLoggedinUser().then((user) => {
            this.loggedInUser = user;
        }).catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        this.setThemeStyle();
    }
    setThemeStyle() {
        this.setGroupMembersStyle();
        this.setListItemStyle();
        this.setAvatarStyle();
        this.setownershipStyle();
        this.setStatusStyle();
        this.transferButtonStyle.buttonTextFont = this.transferOwnershipStyle.transferButtonTextFont || fontHelper(this.themeService.theme.typography.subtitle1);
        this.transferButtonStyle.buttonTextColor = this.transferOwnershipStyle.transferButtonTextColor || this.themeService.theme.palette.getAccent900();
        this.transferButtonStyle.background = this.themeService.theme.palette.getPrimary();
        this.cancelButtonStyle.background = this.themeService.theme.palette.getSecondary();
        this.cancelButtonStyle.buttonTextFont = this.transferOwnershipStyle.cancelButtonTextFont || fontHelper(this.themeService.theme.typography.subtitle1);
        this.cancelButtonStyle.buttonTextColor = this.transferOwnershipStyle.cancelButtonTextColor || this.themeService.theme.palette.getAccent();
        this.ref.detectChanges();
    }
    setListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: "transparent",
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            hoverBackground: "transparent"
        });
        this.listItemStyle = { ...defaultStyle, ...this.listItemStyle };
    }
    setGroupMembersStyle() {
        let defaultStyle = new GroupMembersStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
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
            searchIconTint: this.themeService.theme.palette.getAccent600(),
            searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            searchBackground: this.themeService.theme.palette.getAccent100(),
            searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchTextColor: this.themeService.theme.palette.getAccent600(),
            searchTextFont: fontHelper(this.themeService.theme.typography.text3),
            searchBorderRadius: "8px",
            closeButtonIconTint: this.themeService.theme.palette.getPrimary(),
            backButtonIconTint: this.themeService.theme.palette.getPrimary(),
            padding: "0 100px",
        });
        this.groupMembersStyle = { ...defaultStyle, ...this.groupMembersStyle };
        this.ref.detectChanges();
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "28px",
            height: "28px",
            border: "none",
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
    setStatusStyle() {
        let defaultStyle = {
            height: "10px",
            width: "10px",
            border: "none",
            borderRadius: "24px",
        };
        this.statusIndicatorStyle = { ...defaultStyle, ...this.statusIndicatorStyle };
    }
    setownershipStyle() {
        let defaultStyle = new TransferOwnershipStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            MemberScopeTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            MemberScopeTextColor: this.themeService.theme.palette.getAccent600(),
            transferButtonTextFont: fontHelper(this.themeService.theme.typography.title2),
            transferButtonTextColor: this.themeService.theme.palette.getAccent("dark"),
            cancelButtonTextFont: fontHelper(this.themeService.theme.typography.title2),
            cancelButtonTextColor: this.themeService.theme.palette.getAccent("light"),
            width: "360px",
            height: "650px",
            borderRadius: "8px",
        });
        this.transferOwnershipStyle = { ...defaultStyle, ...this.transferOwnershipStyle };
    }
}
CometChatTransferOwnershipComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatTransferOwnershipComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatTransferOwnershipComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatTransferOwnershipComponent, selector: "cometchat-transfer-ownership", inputs: { groupMemberRequestBuilder: "groupMemberRequestBuilder", searchRequestBuilder: "searchRequestBuilder", subtitleView: "subtitleView", listItemView: "listItemView", disableUsersPresence: "disableUsersPresence", options: "options", closeButtonIconURL: "closeButtonIconURL", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", searchIconURL: "searchIconURL", hideSearch: "hideSearch", title: "title", onError: "onError", onClose: "onClose", onTransferOwnership: "onTransferOwnership", group: "group", emptyStateView: "emptyStateView", errorStateView: "errorStateView", loadingIconURL: "loadingIconURL", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", statusIndicatorStyle: "statusIndicatorStyle", transferOwnershipStyle: "transferOwnershipStyle", transferButtonText: "transferButtonText", cancelButtonText: "cancelButtonText", avatarStyle: "avatarStyle", groupMembersStyle: "groupMembersStyle", listItemStyle: "listItemStyle", titleAlignment: "titleAlignment" }, ngImport: i0, template: "\n<div class=\"cc-transfer-ownership\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-transfer-ownership__members\">\n    <cometchat-group-members [listItemView]=\"listItemView\" [searchRequestBuilder]=\"searchRequestBuilder\"\n    [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [loadingStateView]=\"loadingStateView\"\n    [hideSeparator]=\"hideSeparator\" [emptyStateText]=\"emptyStateText\"\n    [groupMemberRequestBuilder]=\"groupMemberRequestBuilder\" [hideSearch]=\"false\"\n    [closeButtonIconURL]=\"closeButtonIconURL\" [listItemStyle]=\"listItemStyle\" [emptyStateView]=\"emptyStateView\"\n    [searchPlaceholder]=\"searchPlaceholder\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\" [groupMembersStyle]=\"groupMembersStyle\" [onError]=\"onError\"\n    [subtitleView]=\"subtitleView\" [disableUsersPresence]=\"disableUsersPresence\" [onClose]=\"closeClicked\"\n    [tailView]=\"tailView\" [selectionMode]=\"selectionMode\"\n    [titleAlignment]=\"titleAlignment\" [group]=\"group\" [showBackButton]=\"showBackButton\" [title]=\"title\" [options]=\"options\">\n    </cometchat-group-members>\n    </div>\n    <div class=\"cc-transfer-ownership-buttons\">\n    <cometchat-button class=\"cc-transfer-ownership__buttons--confirm\" [text]=\"transferButtonText\"\n      [buttonStyle]=\"transferButtonStyle\" (cc-button-clicked)=\"onTransferClick()\" [disabled]=\"selectedMember ? false : true\"></cometchat-button>\n    <cometchat-button class=\"cc-transfer-ownership__buttons--cancel\" [text]=\"cancelButtonText\"\n      [buttonStyle]=\"cancelButtonStyle\" (cc-button-clicked)=\"closeClicked()\"></cometchat-button>\n    </div>\n  </div>\n<!-- view for member scope -->\n<ng-template #tailView let-groupMember>\n  <div  class=\"cc-transfer-ownership-tailview\">\n    <cometchat-label [text]=\"groupMember?.scope\" [labelStyle]=\"getScopeStyle()\">\n    </cometchat-label>\n    <cometchat-radio-button (cc-radio-button-changed)=\"onOwnerSelected(groupMember)\" *ngIf=\"groupMember && groupMember.getUid() != group?.getOwner()\"></cometchat-radio-button>\n  </div>\n  </ng-template>", styles: [".cc-transfer-ownership__buttons--confirm,.cc-transfer-ownership__buttons--cancel{height:42px;width:100%}.cc-transfer-ownership{width:320px;height:650%;background-color:#fff;box-shadow:0 0 10px #00000080;display:flex;flex-direction:column;padding:8px;justify-content:space-between;position:relative}.modal-header{display:flex;justify-content:center;align-items:center;height:40px}.cc-transfer-ownership-tailview{display:flex;justify-content:flex-end;align-items:flex-start}.cc-transfer-ownership__members{height:85%}.cc-transfer-ownership-buttons{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:15%;gap:10px}\n"], components: [{ type: i2.CometChatGroupMembersComponent, selector: "cometchat-group-members", inputs: ["groupMemberRequestBuilder", "searchRequestBuilder", "subtitleView", "listItemView", "tailView", "disableUsersPresence", "menu", "options", "backButtonIconURL", "closeButtonIconURL", "showBackButton", "hideSeparator", "selectionMode", "searchPlaceholder", "searchIconURL", "hideSearch", "title", "onError", "backdropStyle", "onBack", "onClose", "onSelect", "group", "emptyStateView", "errorStateView", "loadingIconURL", "loadingStateView", "emptyStateText", "errorStateText", "titleAlignment", "dropdownIconURL", "statusIndicatorStyle", "avatarStyle", "groupMembersStyle", "groupScopeStyle", "listItemStyle", "onItemClick", "onEmpty", "userPresencePlacement", "disableLoadingState", "searchKeyword"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatTransferOwnershipComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-transfer-ownership", changeDetection: ChangeDetectionStrategy.OnPush, template: "\n<div class=\"cc-transfer-ownership\" [ngStyle]=\"wrapperStyle()\">\n  <div class=\"cc-transfer-ownership__members\">\n    <cometchat-group-members [listItemView]=\"listItemView\" [searchRequestBuilder]=\"searchRequestBuilder\"\n    [errorStateText]=\"errorStateText\" [errorStateView]=\"errorStateView\" [loadingStateView]=\"loadingStateView\"\n    [hideSeparator]=\"hideSeparator\" [emptyStateText]=\"emptyStateText\"\n    [groupMemberRequestBuilder]=\"groupMemberRequestBuilder\" [hideSearch]=\"false\"\n    [closeButtonIconURL]=\"closeButtonIconURL\" [listItemStyle]=\"listItemStyle\" [emptyStateView]=\"emptyStateView\"\n    [searchPlaceholder]=\"searchPlaceholder\" [statusIndicatorStyle]=\"statusIndicatorStyle\"\n    [avatarStyle]=\"avatarStyle\" [groupMembersStyle]=\"groupMembersStyle\" [onError]=\"onError\"\n    [subtitleView]=\"subtitleView\" [disableUsersPresence]=\"disableUsersPresence\" [onClose]=\"closeClicked\"\n    [tailView]=\"tailView\" [selectionMode]=\"selectionMode\"\n    [titleAlignment]=\"titleAlignment\" [group]=\"group\" [showBackButton]=\"showBackButton\" [title]=\"title\" [options]=\"options\">\n    </cometchat-group-members>\n    </div>\n    <div class=\"cc-transfer-ownership-buttons\">\n    <cometchat-button class=\"cc-transfer-ownership__buttons--confirm\" [text]=\"transferButtonText\"\n      [buttonStyle]=\"transferButtonStyle\" (cc-button-clicked)=\"onTransferClick()\" [disabled]=\"selectedMember ? false : true\"></cometchat-button>\n    <cometchat-button class=\"cc-transfer-ownership__buttons--cancel\" [text]=\"cancelButtonText\"\n      [buttonStyle]=\"cancelButtonStyle\" (cc-button-clicked)=\"closeClicked()\"></cometchat-button>\n    </div>\n  </div>\n<!-- view for member scope -->\n<ng-template #tailView let-groupMember>\n  <div  class=\"cc-transfer-ownership-tailview\">\n    <cometchat-label [text]=\"groupMember?.scope\" [labelStyle]=\"getScopeStyle()\">\n    </cometchat-label>\n    <cometchat-radio-button (cc-radio-button-changed)=\"onOwnerSelected(groupMember)\" *ngIf=\"groupMember && groupMember.getUid() != group?.getOwner()\"></cometchat-radio-button>\n  </div>\n  </ng-template>", styles: [".cc-transfer-ownership__buttons--confirm,.cc-transfer-ownership__buttons--cancel{height:42px;width:100%}.cc-transfer-ownership{width:320px;height:650%;background-color:#fff;box-shadow:0 0 10px #00000080;display:flex;flex-direction:column;padding:8px;justify-content:space-between;position:relative}.modal-header{display:flex;justify-content:center;align-items:center;height:40px}.cc-transfer-ownership-tailview{display:flex;justify-content:flex-end;align-items:flex-start}.cc-transfer-ownership__members{height:85%}.cc-transfer-ownership-buttons{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:15%;gap:10px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { groupMemberRequestBuilder: [{
                type: Input
            }], searchRequestBuilder: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], options: [{
                type: Input
            }], closeButtonIconURL: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], searchPlaceholder: [{
                type: Input
            }], searchIconURL: [{
                type: Input
            }], hideSearch: [{
                type: Input
            }], title: [{
                type: Input
            }], onError: [{
                type: Input
            }], onClose: [{
                type: Input
            }], onTransferOwnership: [{
                type: Input
            }], group: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], transferOwnershipStyle: [{
                type: Input
            }], transferButtonText: [{
                type: Input
            }], cancelButtonText: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], groupMembersStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFRyYW5zZmVyT3duZXJzaGlwL2NvbWV0Y2hhdC10cmFuc2Zlci1vd25lcnNoaXAvY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdFRyYW5zZmVyT3duZXJzaGlwL2NvbWV0Y2hhdC10cmFuc2Zlci1vd25lcnNoaXAvY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFXLEtBQUssRUFBcUIsdUJBQXVCLEVBQWUsTUFBTSxlQUFlLENBQUM7QUFDbkgsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBQyxXQUFXLEVBQWEsYUFBYSxFQUFDLE1BQU0sMkJBQTJCLENBQUE7QUFDL0UsT0FBTyxFQUFtQixRQUFRLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBMkIsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDakssT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0seUJBQXlCLENBQUM7Ozs7O0FBR3BGOzs7Ozs7OztFQVFFO0FBT0YsTUFBTSxPQUFPLG1DQUFtQztJQW9FN0MsWUFBb0IsR0FBc0IsRUFBUyxZQUFrQztRQUFqRSxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUFTLGlCQUFZLEdBQVosWUFBWSxDQUFzQjtRQS9EN0UseUJBQW9CLEdBQVksS0FBSyxDQUFDO1FBRXRDLHVCQUFrQixHQUFXLG9CQUFvQixDQUFB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M0IsS0FBSztnQkFDRyxLQUFLO3NCQUFiLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBTUcsc0JBQXNCO3NCQUE5QixLQUFLO2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFNRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBU0csYUFBYTtzQkFBckIsS0FBSztnQkFRRyxjQUFjO3NCQUF0QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQsICBJbnB1dCwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBUZW1wbGF0ZVJlZiB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQge0F2YXRhclN0eWxlLCBCYXNlU3R5bGUsIExpc3RJdGVtU3R5bGV9IGZyb20gJ0Bjb21ldGNoYXQvdWlraXQtZWxlbWVudHMnXG5pbXBvcnQgeyBDb21ldENoYXRPcHRpb24sIGxvY2FsaXplLCBUaXRsZUFsaWdubWVudCwgU2VsZWN0aW9uTW9kZSwgQ29tZXRDaGF0R3JvdXBFdmVudHMsIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLCBmb250SGVscGVyIH0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBUcmFuc2Zlck93bmVyc2hpcFN0eWxlLCBHcm91cE1lbWJlcnNTdHlsZSB9IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcblxuLyoqXG4qXG4qIENvbWV0Q2hhdFRyYW5zZmVyT3duZXJzaGlwQ29tcG9uZW50IGlzIHVzZWQgdG8gcmVuZGVyIHVzZXJzIGxpc3QgdG8gdHJhbnNmZXIgd29uZXJzaGlwXG4qXG4qIEB2ZXJzaW9uIDEuMC4wXG4qIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbipcbiovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LXRyYW5zZmVyLW93bmVyc2hpcFwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC10cmFuc2Zlci1vd25lcnNoaXAuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC10cmFuc2Zlci1vd25lcnNoaXAuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjpDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0VHJhbnNmZXJPd25lcnNoaXBDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSBncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBzZWFyY2hSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgb3B0aW9ucyE6ICgobWVtYmVyOkNvbWV0Q2hhdC5Hcm91cE1lbWJlcik9PkNvbWV0Q2hhdE9wdGlvbltdKSB8IG51bGw7XG4gIEBJbnB1dCgpIGNsb3NlQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIlxuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiVFJBTlNGRVJfT1dORVJTSElQXCIpO1xuICBASW5wdXQoKSBvbkVycm9yOigoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PnZvaWQpIHwgbnVsbCA9IChlcnJvcjpDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKT0+e1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICB9XG4gIEBJbnB1dCgpIG9uQ2xvc2UhOigpPT52b2lkO1xuICBASW5wdXQoKSBvblRyYW5zZmVyT3duZXJzaGlwIToobWVtYmVyOkNvbWV0Q2hhdC5Hcm91cE1lbWJlcik9PnZvaWQ7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19HUk9VUFNfRk9VTkRcIilcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgYm9yZGVyOlwiXCJcbiAgfTtcbiAgQElucHV0KCkgdHJhbnNmZXJPd25lcnNoaXBTdHlsZTpUcmFuc2Zlck93bmVyc2hpcFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjM2MHB4XCIsXG4gICAgaGVpZ2h0OiBcIjY1MHB4XCIsXG5cbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gIH1cbiAgQElucHV0KCkgdHJhbnNmZXJCdXR0b25UZXh0OnN0cmluZyA9IGxvY2FsaXplKFwiVFJBTlNGRVJfT1dORVJTSElQXCIpXG4gIEBJbnB1dCgpIGNhbmNlbEJ1dHRvblRleHQ6c3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIilcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG5cbiAgfTtcbiAgQElucHV0KCkgZ3JvdXBNZW1iZXJzU3R5bGU6IEdyb3VwTWVtYmVyc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcblxuICAgIHBhZGRpbmc6XCIwXCJcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuXG4gICAgc2VwYXJhdG9yQ29sb3I6IFwicmdiKDIyMiAyMjIgMjIyIC8gNDYlKVwiXG4gIH07XG5cbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQuY2VudGVyO1xuICAgcHVibGljIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gICBwdWJsaWMgc2hvd0JhY2tCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcbiAgIHB1YmxpYyBzZWxlY3RlZE1lbWJlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlciB8IG51bGw7XG4gICBwdWJsaWMgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICAgcHVibGljIHNlbGVjdGVkVXNlciE6Q29tZXRDaGF0LlVzZXI7XG4gICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYscHJpdmF0ZSB0aGVtZVNlcnZpY2U6Q29tZXRDaGF0VGhlbWVTZXJ2aWNlKSB7XG4gICB9XG4gICBwdWJsaWMgIHRyYW5zZmVyQnV0dG9uU3R5bGU6YW55ID0ge1xuICAgIGhlaWdodDpcIjEwMCVcIixcbiAgICB3aWR0aDpcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOlwicmdiKDUxLCAxNTMsIDI1NSlcIixcbiAgICBwYWRkaW5nOlwiOHB4XCIsXG4gICAgYnV0dG9uVGV4dENvbG9yOlwid2hpdGVcIixcbiAgICBidXR0b25UZXh0Rm9udDpcIjYwMCAxNXB4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgZGlzcGxheTpcImZsZXhcIixcbiAgICBqdXN0aWZ5Q29udGVudDpcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6XCJjZW50ZXJcIixcbiAgICBib3JkZXI6XCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOlwiOHB4XCJcbn1cbiAgIHB1YmxpYyBjYW5jZWxCdXR0b25TdHlsZTphbnkgPSB7XG4gIGhlaWdodDpcIjEwMCVcIixcbiAgd2lkdGg6XCIxMDAlXCIsXG4gIGJhY2tncm91bmQ6XCJ3aGl0ZVwiLFxuICBwYWRkaW5nOlwiOHB4XCIsXG4gIGJ1dHRvblRleHRDb2xvcjpcImJsYWNrXCIsXG4gIGJ1dHRvblRleHRGb250OlwiNjAwIDE1cHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgZGlzcGxheTpcImZsZXhcIixcbiAganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIixcbiAgYWxpZ25JdGVtczpcImNlbnRlclwiLFxuICBib3JkZXI6XCIxcHggc29saWQgI2UwZTBlMFwiLFxuICBib3JkZXJSYWRpdXM6XCI4cHhcIlxufVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKCkudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXJcbiAgICB9KS5jYXRjaCgoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgICAgIGlmKHRoaXMub25FcnJvcil7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpXG4gIH1cbiAgb25Pd25lclNlbGVjdGVkID0gKG1lbWJlcjpDb21ldENoYXQuR3JvdXBNZW1iZXIpPT57XG4gICAgdGhpcy5zZWxlY3RlZE1lbWJlciA9IG1lbWJlclxuICB9XG4gIG9uVHJhbnNmZXJDbGljayA9ICgpPT57XG5Db21ldENoYXQuZ2V0VXNlcih0aGlzLnNlbGVjdGVkTWVtYmVyPy5nZXRVaWQoKSkudGhlbigodXNlcjpDb21ldENoYXQuVXNlcik9PntcbnRoaXMuc2VsZWN0ZWRVc2VyID0gdXNlclxufSlcbi5jYXRjaCgoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgaWYodGhpcy5vbkVycm9yKXtcbiAgICB0aGlzLm9uRXJyb3IoZXJyb3IpXG4gIH1cbn0pXG4gICAgaWYodGhpcy5vblRyYW5zZmVyT3duZXJzaGlwKXtcbiAgICAgIHRoaXMub25UcmFuc2Zlck93bmVyc2hpcCh0aGlzLnNlbGVjdGVkTWVtYmVyISlcbiAgICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIgPSBudWxsXG4gICAgfVxuICAgIGVsc2V7XG5pZih0aGlzLnNlbGVjdGVkTWVtYmVyKXtcbiAgQ29tZXRDaGF0LnRyYW5zZmVyR3JvdXBPd25lcnNoaXAodGhpcy5ncm91cC5nZXRHdWlkKCksdGhpcy5zZWxlY3RlZE1lbWJlciEuZ2V0VWlkKCkpLnRoZW4oKHJlc3BvbnNlOnN0cmluZyk9PntcbiAgICB0aGlzLmdyb3VwLnNldE93bmVyKHRoaXMuc2VsZWN0ZWRNZW1iZXIhLmdldFVpZCgpKVxuICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NPd25lcnNoaXBDaGFuZ2VkLm5leHQoXG4gICAge1xuICAgICAgZ3JvdXA6dGhpcy5ncm91cCxcbiAgICAgIG5ld093bmVyOnRoaXMuc2VsZWN0ZWRNZW1iZXIhXG4gICAgICAgfVxuICAgKVxuICAgIHRoaXMuc2VsZWN0ZWRNZW1iZXIgPSBudWxsXG4gIH0pXG4gIC5jYXRjaCgoZXJyb3I6Q29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbik9PntcbiAgICBpZih0aGlzLm9uRXJyb3Ipe1xuICAgICAgdGhpcy5vbkVycm9yKGVycm9yKVxuICAgIH1cbiAgfSlcbn1cbiAgICB9XG4gIH1cbiAgY2xvc2VDbGlja2VkID0oKT0+e1xuICAgIGlmKHRoaXMub25DbG9zZSl7XG4gICAgICB0aGlzLm9uQ2xvc2UoKVxuICAgIH1cbiAgfVxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0R3JvdXBNZW1iZXJzU3R5bGUoKVxuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldG93bmVyc2hpcFN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuICAgIHRoaXMudHJhbnNmZXJCdXR0b25TdHlsZS5idXR0b25UZXh0Rm9udCA9IHRoaXMudHJhbnNmZXJPd25lcnNoaXBTdHlsZS50cmFuc2ZlckJ1dHRvblRleHRGb250IHx8IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpO1xuICAgIHRoaXMudHJhbnNmZXJCdXR0b25TdHlsZS5idXR0b25UZXh0Q29sb3IgPSB0aGlzLnRyYW5zZmVyT3duZXJzaGlwU3R5bGUudHJhbnNmZXJCdXR0b25UZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKTtcbiAgICB0aGlzLnRyYW5zZmVyQnV0dG9uU3R5bGUuYmFja2dyb3VuZCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpO1xuICAgIHRoaXMuY2FuY2VsQnV0dG9uU3R5bGUuYmFja2dyb3VuZCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCk7XG4gICAgdGhpcy5jYW5jZWxCdXR0b25TdHlsZS5idXR0b25UZXh0Rm9udCA9IHRoaXMudHJhbnNmZXJPd25lcnNoaXBTdHlsZS5jYW5jZWxCdXR0b25UZXh0Rm9udCB8fCBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKTtcbiAgICB0aGlzLmNhbmNlbEJ1dHRvblN0eWxlLmJ1dHRvblRleHRDb2xvciA9IHRoaXMudHJhbnNmZXJPd25lcnNoaXBTdHlsZS5jYW5jZWxCdXR0b25UZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpe1xuICAgIGxldCBkZWZhdWx0U3R5bGU6TGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOlwidHJhbnNwYXJlbnRcIlxuICAgIH0pXG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLmxpc3RJdGVtU3R5bGV9XG4gIH1cbiAgc2V0R3JvdXBNZW1iZXJzU3R5bGUoKXtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOkdyb3VwTWVtYmVyc1N0eWxlID0gbmV3IEdyb3VwTWVtYmVyc1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6YDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6Zm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6Zm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwibm9uZVwiLFxuICAgICAgc2VhcmNoSWNvblRpbnQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFBsYWNlaG9sZGVyVGV4dENvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWFyY2hCYWNrZ3JvdW5kOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzZWFyY2hQbGFjZWhvbGRlclRleHRGb250OmZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hUZXh0Q29sb3I6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlYXJjaFRleHRGb250OmZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzZWFyY2hCb3JkZXJSYWRpdXM6XCI4cHhcIixcbiAgICAgIGNsb3NlQnV0dG9uSWNvblRpbnQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBwYWRkaW5nOlwiMCAxMDBweFwiLFxuXG4gICAgfSlcbiAgICB0aGlzLmdyb3VwTWVtYmVyc1N0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLmdyb3VwTWVtYmVyc1N0eWxlfVxuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBcbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSlcbiAgICB0aGlzLmF2YXRhclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLmF2YXRhclN0eWxlfVxuICB9XG4gIHNldFN0YXR1c1N0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpCYXNlU3R5bGUgPSB7XG4gICAgICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgICAgIHdpZHRoOlwiMTBweFwiLFxuICAgICAgICBib3JkZXI6XCJub25lXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czpcIjI0cHhcIixcblxuICAgIH1cbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0gey4uLmRlZmF1bHRTdHlsZSwuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlfVxuICB9XG4gIHNldG93bmVyc2hpcFN0eWxlKCl7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTpUcmFuc2Zlck93bmVyc2hpcFN0eWxlID0gbmV3IFRyYW5zZmVyT3duZXJzaGlwU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjpgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICBNZW1iZXJTY29wZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIE1lbWJlclNjb3BlVGV4dENvbG9yOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0cmFuc2ZlckJ1dHRvblRleHRGb250IDpmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRyYW5zZmVyQnV0dG9uVGV4dENvbG9yIDp0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udCA6Zm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3IgOnRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwibGlnaHRcIiksXG4gICAgICB3aWR0aDogXCIzNjBweFwiLFxuICAgICAgaGVpZ2h0OiBcIjY1MHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSlcbiAgICB0aGlzLnRyYW5zZmVyT3duZXJzaGlwU3R5bGUgPSB7Li4uZGVmYXVsdFN0eWxlLC4uLnRoaXMudHJhbnNmZXJPd25lcnNoaXBTdHlsZX1cbiAgfVxuICBtZW1iZXJzU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5ncm91cE1lbWJlcnNTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuZ3JvdXBNZW1iZXJzU3R5bGUuYm9yZGVyUmFkaXVzXG4gICAgfVxuICB9XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLnRyYW5zZmVyT3duZXJzaGlwU3R5bGUuaGVpZ2h0IHx8IFwiNjUwcHhcIixcbiAgICAgIHdpZHRoOiB0aGlzLnRyYW5zZmVyT3duZXJzaGlwU3R5bGUud2lkdGggfHwgXCIzNjBweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50cmFuc2Zlck93bmVyc2hpcFN0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMudHJhbnNmZXJPd25lcnNoaXBTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMudHJhbnNmZXJPd25lcnNoaXBTdHlsZS5ib3JkZXJSYWRpdXNcbiAgICB9XG4gIH1cbiAgZ2V0U2NvcGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMudHJhbnNmZXJPd25lcnNoaXBTdHlsZS5NZW1iZXJTY29wZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRyYW5zZmVyT3duZXJzaGlwU3R5bGUuTWVtYmVyU2NvcGVUZXh0Q29sb3JcbiAgICB9XG4gIH1cbn1cbiIsIlxuPGRpdiBjbGFzcz1cImNjLXRyYW5zZmVyLW93bmVyc2hpcFwiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy10cmFuc2Zlci1vd25lcnNoaXBfX21lbWJlcnNcIj5cbiAgICA8Y29tZXRjaGF0LWdyb3VwLW1lbWJlcnMgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXdcIiBbc2VhcmNoUmVxdWVzdEJ1aWxkZXJdPVwic2VhcmNoUmVxdWVzdEJ1aWxkZXJcIlxuICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIlxuICAgIFtncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXJcIiBbaGlkZVNlYXJjaF09XCJmYWxzZVwiXG4gICAgW2Nsb3NlQnV0dG9uSWNvblVSTF09XCJjbG9zZUJ1dHRvbkljb25VUkxcIiBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCJcbiAgICBbc2VhcmNoUGxhY2Vob2xkZXJdPVwic2VhcmNoUGxhY2Vob2xkZXJcIiBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic3RhdHVzSW5kaWNhdG9yU3R5bGVcIlxuICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiIFtncm91cE1lbWJlcnNTdHlsZV09XCJncm91cE1lbWJlcnNTdHlsZVwiIFtvbkVycm9yXT1cIm9uRXJyb3JcIlxuICAgIFtzdWJ0aXRsZVZpZXddPVwic3VidGl0bGVWaWV3XCIgW2Rpc2FibGVVc2Vyc1ByZXNlbmNlXT1cImRpc2FibGVVc2Vyc1ByZXNlbmNlXCIgW29uQ2xvc2VdPVwiY2xvc2VDbGlja2VkXCJcbiAgICBbdGFpbFZpZXddPVwidGFpbFZpZXdcIiBbc2VsZWN0aW9uTW9kZV09XCJzZWxlY3Rpb25Nb2RlXCJcbiAgICBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIiBbZ3JvdXBdPVwiZ3JvdXBcIiBbc2hvd0JhY2tCdXR0b25dPVwic2hvd0JhY2tCdXR0b25cIiBbdGl0bGVdPVwidGl0bGVcIiBbb3B0aW9uc109XCJvcHRpb25zXCI+XG4gICAgPC9jb21ldGNoYXQtZ3JvdXAtbWVtYmVycz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtdHJhbnNmZXItb3duZXJzaGlwLWJ1dHRvbnNcIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBjbGFzcz1cImNjLXRyYW5zZmVyLW93bmVyc2hpcF9fYnV0dG9ucy0tY29uZmlybVwiIFt0ZXh0XT1cInRyYW5zZmVyQnV0dG9uVGV4dFwiXG4gICAgICBbYnV0dG9uU3R5bGVdPVwidHJhbnNmZXJCdXR0b25TdHlsZVwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJvblRyYW5zZmVyQ2xpY2soKVwiIFtkaXNhYmxlZF09XCJzZWxlY3RlZE1lbWJlciA/IGZhbHNlIDogdHJ1ZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBjbGFzcz1cImNjLXRyYW5zZmVyLW93bmVyc2hpcF9fYnV0dG9ucy0tY2FuY2VsXCIgW3RleHRdPVwiY2FuY2VsQnV0dG9uVGV4dFwiXG4gICAgICBbYnV0dG9uU3R5bGVdPVwiY2FuY2VsQnV0dG9uU3R5bGVcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY2xvc2VDbGlja2VkKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPCEtLSB2aWV3IGZvciBtZW1iZXIgc2NvcGUgLS0+XG48bmctdGVtcGxhdGUgI3RhaWxWaWV3IGxldC1ncm91cE1lbWJlcj5cbiAgPGRpdiAgY2xhc3M9XCJjYy10cmFuc2Zlci1vd25lcnNoaXAtdGFpbHZpZXdcIj5cbiAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cImdyb3VwTWVtYmVyPy5zY29wZVwiIFtsYWJlbFN0eWxlXT1cImdldFNjb3BlU3R5bGUoKVwiPlxuICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uIChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJvbk93bmVyU2VsZWN0ZWQoZ3JvdXBNZW1iZXIpXCIgKm5nSWY9XCJncm91cE1lbWJlciAmJiBncm91cE1lbWJlci5nZXRVaWQoKSAhPSBncm91cD8uZ2V0T3duZXIoKVwiPjwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+Il19