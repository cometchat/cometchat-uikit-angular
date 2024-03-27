import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { OutgoingCallConfiguration, CometChatSoundManager, CometChatUIKitCalls, CallScreenConfiguration, CallLogsStyle, } from "@cometchat/uikit-shared";
import { AvatarStyle, CallscreenStyle, DateStyle, ListItemStyle, } from "@cometchat/uikit-elements";
import { localize, CometChatUIKitConstants, fontHelper, DatePatterns, CometChatCallEvents, TitleAlignment, States, } from "@cometchat/uikit-resources";
import { CallLogUtils } from "../../../Shared/Utils/CallLogUtils";
import * as i0 from "@angular/core";
import * as i1 from "../../../CometChatTheme.service";
import * as i2 from "../../../CometChatList/cometchat-list.component";
import * as i3 from "../../CometChatOngoingCall/cometchat-ongoing-call/cometchat-ongoing-call.component";
import * as i4 from "../../CometChatOutgoingCall/cometchat-outgoing-call/cometchat-outgoing-call.component";
import * as i5 from "@angular/common";
export class CometchatCallLogsComponent {
    constructor(elementRef, ref, themeService) {
        this.elementRef = elementRef;
        this.ref = ref;
        this.themeService = themeService;
        this.title = localize("CALLS");
        this.titleAlignment = TitleAlignment.left;
        this.emptyStateText = localize("NO_CALLS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.loadingIconURL = "assets/Spinner.svg";
        this.infoIconUrl = "assets/InfoIcon.svg";
        this.missedAudioCallIconUrl = "assets/missedAudioCallIconUrl.svg";
        this.missedVideoCallIconUrl = "assets/missedVideoCallIconUrl.svg";
        this.outgoingAudioCallIconUrl = "assets/outgoingAudioCallIconUrl.svg";
        this.outgoingVideoCallIconUrl = "assets/outgoingVideoCallIconUrl.svg";
        this.incomingAudioCallIconUrl = "assets/incomingAudioCallIconUrl.svg";
        this.incomingVideoCallIconUrl = "assets/incomingVideoCallIconUrl.svg";
        this.onError = (error) => {
            console.log(error);
        };
        this.datePattern = DatePatterns.time;
        this.DateSeparatorPattern = DatePatterns.DayDate;
        this.callLogsStyle = {
            width: "100%",
            height: "100%",
        };
        this.avatarStyle = {
            borderRadius: "16px",
            width: "32px",
            height: "32px",
        };
        this.hideSeparator = false;
        this.dateSeparatorStyle = {
            height: "",
            width: "",
        };
        this.outgoingCallConfiguration = new OutgoingCallConfiguration({});
        this.hideError = false;
        this.showSectionHeader = true;
        this.showMoreInfo = false;
        this.sectionHeaderField = "initiatedAt";
        this.backdropStyle = {};
        this.dateStyle = {};
        this.listItemStyle = {};
        this.ongoingCallConfiguration = new CallScreenConfiguration({});
        this.state = States.loading;
        this.listStyle = {};
        this.sessionId = "";
        this.callLogsListenerId = "calllogscalling" + new Date().getTime();
        this.ongoingCallStyle = {};
        this.showOngoingCall = false;
        this.limit = 30;
        this.callsList = [];
        this.callsListenerId = "callsList_" + new Date().getTime();
        this.loggedInUser = null;
        this.authToken = "";
        this.showOutgoingCallscreen = false;
        this.onScrolledToBottom = null;
        this.outgoingCallStyle = {
            width: "360px",
            height: "581px",
            titleTextFont: "700 22px Inter",
            titleTextColor: "RGB(20, 20, 20)",
            subtitleTextFont: "400 15px Inter",
            subtitleTextColor: "RGBA(20, 20, 20, 0.58)",
            borderRadius: "8px",
        };
        this.fetchNextCallLogsList = () => {
            this.onScrolledToBottom = null;
            this.state = States.loading;
            this.ref.detectChanges();
            this.callsRequest.fetchNext()
                .then((callList) => {
                if (callList?.length > 0) {
                    this.onScrolledToBottom = this.fetchNextCallLogsList;
                    this.ref.detectChanges();
                }
                if (callList.length <= 0 && this.callsList?.length <= 0) {
                    this.state = States.empty;
                    this.ref.detectChanges();
                }
                else {
                    this.state = States.loaded;
                    this.callsList = [...this.callsList, ...callList];
                    if (this.callsList.length < 1) {
                        this.state = States.empty;
                        this.ref.detectChanges();
                    }
                    this.ref.detectChanges();
                }
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                    this.state = States.error;
                    this.ref.detectChanges();
                }
                this.state = States.error;
                this.ref.detectChanges();
            });
        };
        this.handleInfoClick = (call) => {
            this.selectedOrActiveCallLogObject = call;
            this.ref.detectChanges();
            if (this.onInfoClick) {
                this.onInfoClick(call);
            }
        };
        this.getActiveCall = (call) => {
            if (call.getSessionID() !== undefined &&
                call.getSessionID() === this.selectedOrActiveCallLogObject?.getSessionID()) {
                return true;
            }
            else {
                return false;
            }
        };
        this.getSectionHeader = (call, index) => {
            if (this.callsList && this.callsList.length > 0 && index === 0) {
                return this.callsList[0]["initiatedAt"];
            }
            if (this.callsList &&
                this.callsList.length > 0 &&
                index > 0 &&
                CallLogUtils.isDateDifferent(this.callsList[index - 1]["initiatedAt"], this.callsList[index]["initiatedAt"])) {
                return call.getInitiatedAt();
            }
        };
        this.onListItemClickCall = (call) => {
            let receiverID = call.getReceiver().uid;
            let callType = call?.type;
            let receiverType = call?.receiverType;
            if (this.loggedInUser?.getUid() === call?.getInitiator()?.getUid()) {
                receiverID = call.getReceiver()?.uid;
            }
            else {
                receiverID = call.getInitiator()?.uid;
            }
            let localCallObj = new CometChat.Call(receiverID, callType, receiverType);
            if (receiverType == CometChat.RECEIVER_TYPE.USER) {
                CometChat.initiateCall(localCallObj)
                    .then((outGoingCall) => {
                    this.cometchatCallObject = outGoingCall;
                    this.showOutgoingCallscreen = true;
                    this.ref.detectChanges();
                })
                    .catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            }
        };
        this.cancelOutgoingCall = () => {
            CometChatSoundManager.pause();
            CometChat.rejectCall(this.cometchatCallObject.getSessionId(), CometChatUIKitConstants.calls.cancelled)
                .then((call) => {
                this.showOutgoingCallscreen = false;
                CometChatCallEvents.ccCallRejected.next(call);
                this.cometchatCallObject = null;
                this.ref.detectChanges();
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
            this.showOutgoingCallscreen = false;
            this.ref.detectChanges();
        };
        this.callLogStyle = () => {
            return {
                height: this.callLogsStyle.height,
                width: this.callLogsStyle.width,
                background: this.callLogsStyle.background,
                border: this.callLogsStyle.border,
                borderRadius: this.callLogsStyle.borderRadius,
            };
        };
        this.subtitleStyle = () => {
            return {
                font: this.callLogsStyle.callStatusTextFont,
                color: this.callLogsStyle.callStatusTextColor,
            };
        };
        this.infoButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.callLogsStyle.infoIconTint,
            };
        };
        this.setOngoingCallStyle = () => {
            let defaultStyle = new CallscreenStyle({
                maxHeight: "100%",
                maxWidth: "100%",
                border: "none",
                borderRadius: "0",
                background: "#1c2226",
                minHeight: "400px",
                minWidth: "400px",
                minimizeIconTint: this.themeService.theme.palette.getAccent900(),
                maximizeIconTint: this.themeService.theme.palette.getAccent900(),
            });
            this.ongoingCallStyle = { ...defaultStyle, ...this.ongoingCallStyle };
        };
        this.state = States.loading;
    }
    ngOnInit() {
        this.setThemeStyle();
        this.attachListeners();
        CometChat.getLoggedinUser()
            .then((user) => {
            this.loggedInUser = user;
            this.authToken = this.loggedInUser.getAuthToken();
            this.callsRequest = this.getRequestBuilder();
            this.fetchNextCallLogsList();
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
    }
    attachListeners() {
        CometChat.addCallListener(this.callLogsListenerId, new CometChat.CallListener({
            onIncomingCallReceived: (call) => {
                this.cometchatCallObject = call;
                this.ref.detectChanges();
            },
            onIncomingCallCancelled: (call) => {
                this.cometchatCallObject = null;
                this.ref.detectChanges();
            },
            onOutgoingCallRejected: (call) => {
                this.cometchatCallObject = null;
                this.showOutgoingCallscreen = false;
                this.ref.detectChanges();
            },
            onOutgoingCallAccepted: (call) => {
                this.cometchatCallObject = call;
                this.openOngoingCallScreen(call);
            },
            onCallEndedMessageReceived: (call) => {
                this.cometchatCallObject = null;
                this.ref.detectChanges();
            },
        }));
    }
    ngOnDestroy() {
        this.callsRequest = null;
        this.removeListener();
        this.ref.detach();
    }
    removeListener() {
        CometChat.removeCallListener(this.callLogsListenerId);
    }
    getSubtitle(call) {
        return CallLogUtils.getCallStatusWithType(call, this.loggedInUser);
    }
    getCallerName(call) {
        if (this.loggedInUser?.getUid() === call?.getInitiator()?.getUid()) {
            return call?.getReceiver()?.getName();
        }
        return call.getInitiator()?.getName();
    }
    getAvatarUrl(call) {
        if (this.loggedInUser?.getUid() === call?.getInitiator()?.getUid()) {
            return call?.receiver?.avatar || call?.receiver?.icon;
        }
        return call.initiator?.avatar || call?.initiator?.icon;
    }
    getRequestBuilder() {
        if (this.callLogRequestBuilder) {
            return this.callLogRequestBuilder?.build();
        }
        else {
            return new CometChatUIKitCalls.CallLogRequestBuilder()
                .setLimit(this.limit)
                .setCallCategory("call")
                .setAuthToken(this.authToken)
                .build();
        }
    }
    getCallTypeIcon(call) {
        const missedCall = CallLogUtils.isMissedCall(call, this.loggedInUser);
        const callType = call.getType();
        let icon;
        if (missedCall) {
            if (callType === CometChat.CALL_TYPE.AUDIO) {
                icon = this.missedAudioCallIconUrl;
            }
            else {
                icon = this.missedVideoCallIconUrl;
            }
        }
        else if (call.getInitiator().getUid() === this.loggedInUser.getUid()) {
            if (callType === CometChat.CALL_TYPE.AUDIO) {
                icon = this.outgoingAudioCallIconUrl;
            }
            else {
                icon = this.outgoingVideoCallIconUrl;
            }
        }
        else {
            if (callType === CometChat.CALL_TYPE.AUDIO) {
                icon = this.incomingAudioCallIconUrl;
            }
            else {
                icon = this.incomingVideoCallIconUrl;
            }
        }
        return icon;
    }
    setThemeStyle() {
        this.setAvatarStyle();
        this.setDateStyle();
        this.setCallLogsStyle();
        this.listStyle = {
            titleTextFont: this.callLogsStyle.titleFont,
            titleTextColor: this.callLogsStyle.titleColor,
            emptyStateTextFont: this.callLogsStyle.emptyStateTextFont,
            emptyStateTextColor: this.callLogsStyle.emptyStateTextColor,
            errorStateTextFont: this.callLogsStyle.errorStateTextFont,
            errorStateTextColor: this.callLogsStyle.errorStateTextColor,
            loadingIconTint: this.callLogsStyle.loadingIconTint,
            separatorColor: this.callLogsStyle.dateSeparatorTextColor,
            sectionHeaderTextColor: this.callLogsStyle.dateSeparatorTextColor || "rgba(20, 20, 20, 0.46)",
            sectionHeaderTextFont: this.callLogsStyle.dateSeparatorTextFont,
        };
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "36px",
            height: "36px",
            border: "none",
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
    setDateStyle() {
        let defaultStyle = new DateStyle({
            textFont: fontHelper(this.themeService.theme.typography.caption2),
            textColor: this.themeService.theme.palette.getAccent600(),
            background: "transparent",
        });
        this.dateStyle = { ...defaultStyle, ...this.dateStyle };
    }
    getListItemStyle(call) {
        let defaultStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: this.themeService.theme.palette.getAccent100(),
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            // titleColor: this.isMissedCall(call, this.loggedInUser!)
            titleColor: CallLogUtils.isMissedCall(call, this.loggedInUser)
                ? this.themeService.theme.palette.getError()
                : this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            padding: "10px",
            hoverBackground: this.themeService.theme.palette.getAccent50(),
        });
        return { ...defaultStyle, ...this.listItemStyle };
    }
    setCallLogsStyle() {
        let defaultStyle = new CallLogsStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            dateSeparatorTextColor: this.themeService.theme.palette.getAccent600(),
            dateTextColor: this.themeService.theme.palette.getAccent600(),
            dateTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            missedCallIconTint: this.themeService.theme.palette.getAccent600(),
            borderRadius: "",
            infoIconTint: this.themeService.theme.palette.getPrimary(),
            outgoingCallIconTint: this.themeService.theme.palette.getAccent600(),
            incomingCallIconTint: this.themeService.theme.palette.getAccent600(),
            callStatusTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            callStatusTextColor: this.themeService.theme.palette.getAccent600(),
            dateSeparatorTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
        });
        this.callLogsStyle = { ...defaultStyle, ...this.callLogsStyle };
    }
    getCallBuilder() {
        let audioOnlyCall = this.activeCall?.getType() == CometChatUIKitConstants.MessageTypes.audio
            ? true
            : false;
        const callSettings = new CometChatUIKitCalls.CallSettingsBuilder()
            .enableDefaultLayout(true)
            .setIsAudioOnlyCall(audioOnlyCall)
            .setCallListener(new CometChatUIKitCalls.OngoingCallListener({
            onCallEnded: () => {
                if (this.cometchatCallObject?.getReceiverType() ==
                    CometChatUIKitConstants.MessageReceiverType.user) {
                    CometChatUIKitCalls.endSession();
                    this.closeCallScreen();
                }
            },
            onCallEndButtonPressed: () => {
                if (this.cometchatCallObject?.getReceiverType() ==
                    CometChatUIKitConstants.MessageReceiverType.user) {
                    CometChat.endCall(this.sessionId)
                        .then((call) => {
                        CometChatUIKitCalls.endSession();
                        CometChatCallEvents.ccCallEnded.next(call);
                        this.closeCallScreen();
                    })
                        .catch((err) => {
                        if (this.onError) {
                            this.onError(err);
                        }
                    });
                }
                else {
                    this.closeCallScreen();
                }
            },
            onError: (error) => {
                if (this.onError) {
                    this.onError(error);
                }
            },
        }))
            .build();
        return callSettings;
    }
    closeCallScreen() {
        this.cometchatCallObject = null;
        this.showOngoingCall = false;
        this.sessionId = "";
        this.showOutgoingCallscreen = false;
        this.cometchatCallObject = null;
        this.ref.detectChanges();
    }
    openOngoingCallScreen(call) {
        this.showOutgoingCallscreen = false;
        this.cometchatCallObject = call;
        this.sessionId = call.getSessionId();
        this.showOngoingCall = true;
        this.ref.detectChanges();
    }
    getDirectionIconStyle(call) {
        let tint;
        const missedCall = CallLogUtils.isMissedCall(call, this.loggedInUser);
        if (missedCall) {
            tint =
                this.callLogsStyle.missedCallIconTint ||
                    this.themeService.theme.palette.getAccent600();
        }
        else if (call.getInitiator().getUid() === this.loggedInUser?.getUid()) {
            tint =
                this.callLogsStyle.outgoingCallIconTint ||
                    this.themeService.theme.palette.getAccent600();
        }
        else {
            tint =
                this.callLogsStyle.incomingCallIconTint ||
                    this.themeService.theme.palette.getAccent600();
        }
        return {
            height: "18px",
            width: "18px",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            iconTint: tint,
        };
    }
}
CometchatCallLogsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometchatCallLogsComponent, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometchatCallLogsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometchatCallLogsComponent, selector: "cometchat-call-logs", inputs: { title: "title", titleAlignment: "titleAlignment", listItemView: "listItemView", subtitleView: "subtitleView", tailView: "tailView", menu: "menu", emptyStateView: "emptyStateView", errorStateView: "errorStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", loadingStateView: "loadingStateView", loadingIconURL: "loadingIconURL", infoIconUrl: "infoIconUrl", missedAudioCallIconUrl: "missedAudioCallIconUrl", missedVideoCallIconUrl: "missedVideoCallIconUrl", outgoingAudioCallIconUrl: "outgoingAudioCallIconUrl", outgoingVideoCallIconUrl: "outgoingVideoCallIconUrl", incomingAudioCallIconUrl: "incomingAudioCallIconUrl", incomingVideoCallIconUrl: "incomingVideoCallIconUrl", callLogRequestBuilder: "callLogRequestBuilder", cometchatCallObject: "cometchatCallObject", onItemClick: "onItemClick", onInfoClick: "onInfoClick", onError: "onError", activeCall: "activeCall", datePattern: "datePattern", DateSeparatorPattern: "DateSeparatorPattern", callLogsStyle: "callLogsStyle", avatarStyle: "avatarStyle", hideSeparator: "hideSeparator", dateSeparatorStyle: "dateSeparatorStyle", outgoingCallConfiguration: "outgoingCallConfiguration", hideError: "hideError", showSectionHeader: "showSectionHeader", showMoreInfo: "showMoreInfo", sectionHeaderField: "sectionHeaderField", backdropStyle: "backdropStyle", dateStyle: "dateStyle", listItemStyle: "listItemStyle", ongoingCallConfiguration: "ongoingCallConfiguration" }, ngImport: i0, template: "<div class=\"cc-call-logs\" [ngStyle]=\"callLogStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n  </div>\n  <cometchat-list [hideSearch]=\"true\" [listItemView]=\"listItemView ? listItemView : listItem\"\n    [onScrolledToBottom]=\"onScrolledToBottom\" [list]=\"callsList\" [hideError]=\"hideError\" [title]=\"title\"\n    [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\" [sectionHeaderField]=\"sectionHeaderField\"\n    [showSectionHeader]=\"showSectionHeader\" [errorStateView]=\"errorStateView\" [errorStateText]=\"errorStateText\"\n    [listStyle]=\"listStyle\" [state]=\"state\" [getSectionHeader]=\"getSectionHeader!\">\n  </cometchat-list>\n\n  <ng-template #listItem let-call>\n\n    <cometchat-list-item [title]=\"getCallerName(call)\" [avatarURL]=\"getAvatarUrl(call)\"\n      [avatarName]=\"getCallerName(call)\" [listItemStyle]=\"getListItemStyle(call)\" [avatarStyle]=\"avatarStyle\"\n      [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onListItemClickCall(call)\"\n      [isActive]=\"getActiveCall(call)\">\n      <div slot=\"subtitleView\" class=\"cc-call-logs__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n        <ng-container *ngTemplateOutlet=\"subtitleView\">\n        </ng-container>\n      </div>\n      <ng-template #groupSubtitle>\n        <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-logs__subtitle-view\">\n          <div class=\"cc-call__icon\">\n            <cometchat-icon [iconStyle]=\"getDirectionIconStyle(call)\" [URL]=\"getCallTypeIcon(call)\"></cometchat-icon>\n          </div>\n          <div class=\"cc-call__type\">\n            {{getSubtitle(call)}}\n          </div>\n        </div>\n      </ng-template>\n      <div slot=\"tailView\" class=\"cc-call-logs__tail-view\" *ngIf=\"tailView;else defaultTailView\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n      <ng-template #defaultTailView>\n        <div slot=\"tailView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-logs__subtitle-view\">\n          <div class=\"tail__view\">\n            <div class=\"cc-call-logs__date\">\n              <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"call?.initiatedAt\"\n                [pattern]=\"datePattern\"></cometchat-date>\n              <cometchat-button *ngIf=\"showMoreInfo\" [iconURL]=\"infoIconUrl\" class=\"cc-details__close-button\"\n                [buttonStyle]=\"infoButtonStyle()\" (cc-button-clicked)=\"handleInfoClick(call)\"></cometchat-button>\n            </div>\n          </div>\n        </div>\n      </ng-template>\n\n\n\n    </cometchat-list-item>\n\n  </ng-template>\n\n\n</div>\n\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\" [maximizeIconURL]=\"ongoingCallConfiguration.maximizeIconURL\"\n  [minimizeIconURL]=\"ongoingCallConfiguration.minimizeIconURL\" [sessionID]=\"sessionId\"\n  [callSettingsBuilder]=\"getCallBuilder()!\"></cometchat-ongoing-call>\n\n<cometchat-backdrop *ngIf=\"showOutgoingCallscreen\" [backdropStyle]=\"backdropStyle\">\n\n  <cometchat-outgoing-call [customSoundForCalls]=\"outgoingCallConfiguration.customSoundForCalls\"\n    [onError]=\"outgoingCallConfiguration.onError\"\n    [disableSoundForCalls]=\"outgoingCallConfiguration.disableSoundForCalls\"\n    [avatarStyle]=\"outgoingCallConfiguration.avatarStyle\" [customView]=\"outgoingCallConfiguration.customView\"\n    [declineButtonIconURL]=\"outgoingCallConfiguration.declineButtonIconURL\"\n    [onCloseClicked]=\"outgoingCallConfiguration.onCloseClicked || cancelOutgoingCall\"\n    [outgoingCallStyle]=\"outgoingCallConfiguration.outgoingCallStyle || outgoingCallStyle\"\n    [call]=\"cometchatCallObject!\"></cometchat-outgoing-call>\n</cometchat-backdrop>", styles: [".cc-call-logs{height:100%;width:100%;box-sizing:border-box;padding-bottom:24px}.cc-call-logs__tail-view{position:relative}.cc-call-logs__date{display:flex;gap:3px}.cc-menus{position:absolute;right:12px;top:6px}.cc-call-logs__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }, { type: i3.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i4.CometChatOutgoingCallComponent, selector: "cometchat-outgoing-call", inputs: ["call", "declineButtonText", "declineButtonIconURL", "customView", "onError", "disableSoundForCalls", "customSoundForCalls", "avatarStyle", "outgoingCallStyle", "onCloseClicked"] }], directives: [{ type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i5.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometchatCallLogsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-call-logs", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-call-logs\" [ngStyle]=\"callLogStyle()\">\n  <div class=\"cc-menus\" *ngIf=\"menu\">\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n  </div>\n  <cometchat-list [hideSearch]=\"true\" [listItemView]=\"listItemView ? listItemView : listItem\"\n    [onScrolledToBottom]=\"onScrolledToBottom\" [list]=\"callsList\" [hideError]=\"hideError\" [title]=\"title\"\n    [emptyStateText]=\"emptyStateText\" [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [emptyStateView]=\"emptyStateView\" [sectionHeaderField]=\"sectionHeaderField\"\n    [showSectionHeader]=\"showSectionHeader\" [errorStateView]=\"errorStateView\" [errorStateText]=\"errorStateText\"\n    [listStyle]=\"listStyle\" [state]=\"state\" [getSectionHeader]=\"getSectionHeader!\">\n  </cometchat-list>\n\n  <ng-template #listItem let-call>\n\n    <cometchat-list-item [title]=\"getCallerName(call)\" [avatarURL]=\"getAvatarUrl(call)\"\n      [avatarName]=\"getCallerName(call)\" [listItemStyle]=\"getListItemStyle(call)\" [avatarStyle]=\"avatarStyle\"\n      [hideSeparator]=\"hideSeparator\" (cc-listitem-clicked)=\"onListItemClickCall(call)\"\n      [isActive]=\"getActiveCall(call)\">\n      <div slot=\"subtitleView\" class=\"cc-call-logs__subtitle-view\" *ngIf=\"subtitleView;else groupSubtitle\">\n        <ng-container *ngTemplateOutlet=\"subtitleView\">\n        </ng-container>\n      </div>\n      <ng-template #groupSubtitle>\n        <div slot=\"subtitleView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-logs__subtitle-view\">\n          <div class=\"cc-call__icon\">\n            <cometchat-icon [iconStyle]=\"getDirectionIconStyle(call)\" [URL]=\"getCallTypeIcon(call)\"></cometchat-icon>\n          </div>\n          <div class=\"cc-call__type\">\n            {{getSubtitle(call)}}\n          </div>\n        </div>\n      </ng-template>\n      <div slot=\"tailView\" class=\"cc-call-logs__tail-view\" *ngIf=\"tailView;else defaultTailView\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n      <ng-template #defaultTailView>\n        <div slot=\"tailView\" [ngStyle]=\"subtitleStyle()\" class=\"cc-call-logs__subtitle-view\">\n          <div class=\"tail__view\">\n            <div class=\"cc-call-logs__date\">\n              <cometchat-date [dateStyle]=\"dateStyle\" [timestamp]=\"call?.initiatedAt\"\n                [pattern]=\"datePattern\"></cometchat-date>\n              <cometchat-button *ngIf=\"showMoreInfo\" [iconURL]=\"infoIconUrl\" class=\"cc-details__close-button\"\n                [buttonStyle]=\"infoButtonStyle()\" (cc-button-clicked)=\"handleInfoClick(call)\"></cometchat-button>\n            </div>\n          </div>\n        </div>\n      </ng-template>\n\n\n\n    </cometchat-list-item>\n\n  </ng-template>\n\n\n</div>\n\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\" [maximizeIconURL]=\"ongoingCallConfiguration.maximizeIconURL\"\n  [minimizeIconURL]=\"ongoingCallConfiguration.minimizeIconURL\" [sessionID]=\"sessionId\"\n  [callSettingsBuilder]=\"getCallBuilder()!\"></cometchat-ongoing-call>\n\n<cometchat-backdrop *ngIf=\"showOutgoingCallscreen\" [backdropStyle]=\"backdropStyle\">\n\n  <cometchat-outgoing-call [customSoundForCalls]=\"outgoingCallConfiguration.customSoundForCalls\"\n    [onError]=\"outgoingCallConfiguration.onError\"\n    [disableSoundForCalls]=\"outgoingCallConfiguration.disableSoundForCalls\"\n    [avatarStyle]=\"outgoingCallConfiguration.avatarStyle\" [customView]=\"outgoingCallConfiguration.customView\"\n    [declineButtonIconURL]=\"outgoingCallConfiguration.declineButtonIconURL\"\n    [onCloseClicked]=\"outgoingCallConfiguration.onCloseClicked || cancelOutgoingCall\"\n    [outgoingCallStyle]=\"outgoingCallConfiguration.outgoingCallStyle || outgoingCallStyle\"\n    [call]=\"cometchatCallObject!\"></cometchat-outgoing-call>\n</cometchat-backdrop>", styles: [".cc-call-logs{height:100%;width:100%;box-sizing:border-box;padding-bottom:24px}.cc-call-logs__tail-view{position:relative}.cc-call-logs__date{display:flex;gap:3px}.cc-menus{position:absolute;right:12px;top:6px}.cc-call-logs__subtitle-view{display:flex;align-items:center;justify-content:flex-start;gap:6px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { title: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], subtitleView: [{
                type: Input
            }], tailView: [{
                type: Input
            }], menu: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], infoIconUrl: [{
                type: Input
            }], missedAudioCallIconUrl: [{
                type: Input
            }], missedVideoCallIconUrl: [{
                type: Input
            }], outgoingAudioCallIconUrl: [{
                type: Input
            }], outgoingVideoCallIconUrl: [{
                type: Input
            }], incomingAudioCallIconUrl: [{
                type: Input
            }], incomingVideoCallIconUrl: [{
                type: Input
            }], callLogRequestBuilder: [{
                type: Input
            }], cometchatCallObject: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }], onInfoClick: [{
                type: Input
            }], onError: [{
                type: Input
            }], activeCall: [{
                type: Input
            }], datePattern: [{
                type: Input
            }], DateSeparatorPattern: [{
                type: Input
            }], callLogsStyle: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], dateSeparatorStyle: [{
                type: Input
            }], outgoingCallConfiguration: [{
                type: Input
            }], hideError: [{
                type: Input
            }], showSectionHeader: [{
                type: Input
            }], showMoreInfo: [{
                type: Input
            }], sectionHeaderField: [{
                type: Input
            }], backdropStyle: [{
                type: Input
            }], dateStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], ongoingCallConfiguration: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEdBS04sTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFFTCx5QkFBeUIsRUFDekIscUJBQXFCLEVBRXJCLG1CQUFtQixFQUNuQix1QkFBdUIsRUFDdkIsYUFBYSxHQUNkLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUNMLFdBQVcsRUFFWCxlQUFlLEVBQ2YsU0FBUyxFQUNULGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxRQUFRLEVBQ1IsdUJBQXVCLEVBQ3ZCLFVBQVUsRUFDVixZQUFZLEVBQ1osbUJBQW1CLEVBQ25CLGNBQWMsRUFDZCxNQUFNLEdBQ1AsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7Ozs7Ozs7QUFRbEUsTUFBTSxPQUFPLDBCQUEwQjtJQXdHckMsWUFDVSxVQUFzQixFQUN0QixHQUFzQixFQUN0QixZQUFtQztRQUZuQyxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ3RCLFFBQUcs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SztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBQ0csd0JBQXdCO3NCQUFoQyxLQUFLO2dCQUVHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFFRyx3QkFBd0I7c0JBQWhDLEtBQUs7Z0JBRUcsd0JBQXdCO3NCQUFoQyxLQUFLO2dCQUdHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFNRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUVHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBS0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxhQUFhO3NCQUFyQixLQUFLO2dCQUVHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFLRyx5QkFBeUI7c0JBQWpDLEtBQUs7Z0JBR0csU0FBUztzQkFBakIsS0FBSztnQkFFRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBRUcsYUFBYTtzQkFBckIsS0FBSztnQkFFRyxTQUFTO3NCQUFqQixLQUFLO2dCQUVHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csd0JBQXdCO3NCQUFoQyxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uSW5pdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5cbmltcG9ydCB7XG4gIExpc3RTdHlsZSxcbiAgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbixcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxuICBPdXRnb2luZ0NhbGxTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRDYWxscyxcbiAgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24sXG4gIENhbGxMb2dzU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIENhbGxzY3JlZW5TdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIGxvY2FsaXplLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgZm9udEhlbHBlcixcbiAgRGF0ZVBhdHRlcm5zLFxuICBDb21ldENoYXRDYWxsRXZlbnRzLFxuICBUaXRsZUFsaWdubWVudCxcbiAgU3RhdGVzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IENhbGxMb2dVdGlscyB9IGZyb20gXCIuLi8uLi8uLi9TaGFyZWQvVXRpbHMvQ2FsbExvZ1V0aWxzXCI7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY2FsbC1sb2dzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Y2hhdENhbGxMb2dzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FMTFNcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmxlZnQ7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IGFueTtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogYW55O1xuICBASW5wdXQoKSB0YWlsVmlldyE6IGFueTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19DQUxMU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcblxuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgaW5mb0ljb25Vcmw6IHN0cmluZyA9IFwiYXNzZXRzL0luZm9JY29uLnN2Z1wiO1xuICBASW5wdXQoKSBtaXNzZWRBdWRpb0NhbGxJY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9taXNzZWRBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBtaXNzZWRWaWRlb0NhbGxJY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9taXNzZWRWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBvdXRnb2luZ0F1ZGlvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvb3V0Z29pbmdBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBvdXRnb2luZ1ZpZGVvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvb3V0Z29pbmdWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBpbmNvbWluZ0F1ZGlvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvaW5jb21pbmdBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBpbmNvbWluZ1ZpZGVvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvaW5jb21pbmdWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuXG4gIEBJbnB1dCgpIGNhbGxMb2dSZXF1ZXN0QnVpbGRlciE6IGFueTtcbiAgQElucHV0KCkgY29tZXRjaGF0Q2FsbE9iamVjdCE6IENvbWV0Q2hhdC5DYWxsIHwgbnVsbDtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAoY2FsbDogYW55KSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkluZm9DbGljayE6IChjYWxsOiBhbnkpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG5cbiAgQElucHV0KCkgYWN0aXZlQ2FsbCE6IGFueTtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy50aW1lO1xuICBASW5wdXQoKSBEYXRlU2VwYXJhdG9yUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGU7XG5cbiAgQElucHV0KCkgY2FsbExvZ3NTdHlsZTogQ2FsbExvZ3NTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgfTtcblxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIzMnB4XCIsXG4gICAgaGVpZ2h0OiBcIjMycHhcIixcbiAgfTtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIEBJbnB1dCgpIGRhdGVTZXBhcmF0b3JTdHlsZTogRGF0ZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCJcIixcbiAgICB3aWR0aDogXCJcIixcbiAgfTtcblxuICBASW5wdXQoKSBvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uOiBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uID1cbiAgICBuZXcgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbih7fSk7XG5cbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG5cbiAgQElucHV0KCkgc2hvd1NlY3Rpb25IZWFkZXI6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBzaG93TW9yZUluZm86IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBhbnkgPSBcImluaXRpYXRlZEF0XCI7XG5cbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHt9O1xuXG4gIEBJbnB1dCgpIGRhdGVTdHlsZTogRGF0ZVN0eWxlID0ge307XG5cbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHt9O1xuICBASW5wdXQoKSBvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb246IENhbGxTY3JlZW5Db25maWd1cmF0aW9uID1cbiAgICBuZXcgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24oe30pO1xuXG4gIHB1YmxpYyBzZWxlY3RlZE9yQWN0aXZlQ2FsbExvZ09iamVjdCE6IGFueTtcbiAgY2FsbHNSZXF1ZXN0ITogYW55O1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IHt9O1xuXG4gIHNlc3Npb25JZDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIGNhbGxMb2dzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjYWxsbG9nc2NhbGxpbmdcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9O1xuXG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyBjYWxsc0xpc3Q6IGFueSA9IFtdO1xuICBwdWJsaWMgY2FsbHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNhbGxzTGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgYXV0aFRva2VuOiBzdHJpbmcgPSBcIlwiO1xuICBzaG93T3V0Z29pbmdDYWxsc2NyZWVuOiBib29sZWFuID0gZmFsc2U7XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTogYW55ID0gbnVsbDtcblxuICBvdXRnb2luZ0NhbGxTdHlsZTogT3V0Z29pbmdDYWxsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzYwcHhcIixcbiAgICBoZWlnaHQ6IFwiNTgxcHhcIixcbiAgICB0aXRsZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gICAgdGl0bGVUZXh0Q29sb3I6IFwiUkdCKDIwLCAyMCwgMjApXCIsXG4gICAgc3VidGl0bGVUZXh0Rm9udDogXCI0MDAgMTVweCBJbnRlclwiLFxuICAgIHN1YnRpdGxlVGV4dENvbG9yOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKCk7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgICAgdGhpcy5hdXRoVG9rZW4gPSB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0QXV0aFRva2VuKCk7XG4gICAgICAgIHRoaXMuY2FsbHNSZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICB0aGlzLmZldGNoTmV4dENhbGxMb2dzTGlzdCgpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDYWxsTGlzdGVuZXIoXG4gICAgICB0aGlzLmNhbGxMb2dzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gY2FsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuXG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25PdXRnb2luZ0NhbGxBY2NlcHRlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gY2FsbDtcbiAgICAgICAgICB0aGlzLm9wZW5PbmdvaW5nQ2FsbFNjcmVlbihjYWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5jYWxsc1JlcXVlc3QgPSBudWxsO1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcblxuICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMb2dzTGlzdGVuZXJJZCk7XG4gIH1cblxuICBmZXRjaE5leHRDYWxsTG9nc0xpc3QgPSAoKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgdGhpcy5jYWxsc1JlcXVlc3QhLmZldGNoTmV4dCgpXG4gICAgICAudGhlbigoY2FsbExpc3Q6IGFueSkgPT4ge1xuICAgICAgICBpZiAoY2FsbExpc3Q/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0Q2FsbExvZ3NMaXN0O1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbExpc3QubGVuZ3RoIDw9IDAgJiYgdGhpcy5jYWxsc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG5cbiAgICAgICAgICB0aGlzLmNhbGxzTGlzdCA9IFsuLi50aGlzLmNhbGxzTGlzdCwgLi4uY2FsbExpc3RdO1xuXG4gICAgICAgICAgaWYgKHRoaXMuY2FsbHNMaXN0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG5cbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gIGdldFN1YnRpdGxlKGNhbGw6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIENhbGxMb2dVdGlscy5nZXRDYWxsU3RhdHVzV2l0aFR5cGUoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgfVxuICBoYW5kbGVJbmZvQ2xpY2sgPSAoY2FsbDogYW55KSA9PiB7XG4gICAgdGhpcy5zZWxlY3RlZE9yQWN0aXZlQ2FsbExvZ09iamVjdCA9IGNhbGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgaWYgKHRoaXMub25JbmZvQ2xpY2spIHtcbiAgICAgIHRoaXMub25JbmZvQ2xpY2soY2FsbCk7XG4gICAgfVxuICB9O1xuXG4gIGdldEFjdGl2ZUNhbGwgPSAoY2FsbDogYW55KSA9PiB7XG4gICAgaWYgKFxuICAgICAgY2FsbC5nZXRTZXNzaW9uSUQoKSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBjYWxsLmdldFNlc3Npb25JRCgpID09PSB0aGlzLnNlbGVjdGVkT3JBY3RpdmVDYWxsTG9nT2JqZWN0Py5nZXRTZXNzaW9uSUQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgZ2V0U2VjdGlvbkhlYWRlciA9IChjYWxsOiBhbnksIGluZGV4OiBhbnkpID0+IHtcbiAgICBpZiAodGhpcy5jYWxsc0xpc3QgJiYgdGhpcy5jYWxsc0xpc3QubGVuZ3RoID4gMCAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FsbHNMaXN0WzBdW1wiaW5pdGlhdGVkQXRcIl07XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5jYWxsc0xpc3QgJiZcbiAgICAgIHRoaXMuY2FsbHNMaXN0Lmxlbmd0aCA+IDAgJiZcbiAgICAgIGluZGV4ID4gMCAmJlxuICAgICAgQ2FsbExvZ1V0aWxzLmlzRGF0ZURpZmZlcmVudChcbiAgICAgICAgdGhpcy5jYWxsc0xpc3RbaW5kZXggLSAxXVtcImluaXRpYXRlZEF0XCJdLFxuICAgICAgICB0aGlzLmNhbGxzTGlzdFtpbmRleF1bXCJpbml0aWF0ZWRBdFwiXVxuICAgICAgKVxuICAgICkge1xuICAgICAgcmV0dXJuIGNhbGwuZ2V0SW5pdGlhdGVkQXQoKTtcbiAgICB9XG4gIH07XG5cbiAgb25MaXN0SXRlbUNsaWNrQ2FsbCA9IChjYWxsOiBhbnkpID0+IHtcbiAgICBsZXQgcmVjZWl2ZXJJRCA9IGNhbGwuZ2V0UmVjZWl2ZXIoKS51aWQ7XG4gICAgbGV0IGNhbGxUeXBlID0gY2FsbD8udHlwZTtcbiAgICBsZXQgcmVjZWl2ZXJUeXBlID0gY2FsbD8ucmVjZWl2ZXJUeXBlO1xuXG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gY2FsbD8uZ2V0SW5pdGlhdG9yKCk/LmdldFVpZCgpKSB7XG4gICAgICByZWNlaXZlcklEID0gY2FsbC5nZXRSZWNlaXZlcigpPy51aWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlY2VpdmVySUQgPSBjYWxsLmdldEluaXRpYXRvcigpPy51aWQ7XG4gICAgfVxuXG4gICAgbGV0IGxvY2FsQ2FsbE9iaiA9IG5ldyBDb21ldENoYXQuQ2FsbChyZWNlaXZlcklELCBjYWxsVHlwZSwgcmVjZWl2ZXJUeXBlKTtcblxuICAgIGlmIChyZWNlaXZlclR5cGUgPT0gQ29tZXRDaGF0LlJFQ0VJVkVSX1RZUEUuVVNFUikge1xuICAgICAgQ29tZXRDaGF0LmluaXRpYXRlQ2FsbChsb2NhbENhbGxPYmopXG4gICAgICAgIC50aGVuKChvdXRHb2luZ0NhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBvdXRHb2luZ0NhbGw7XG4gICAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gdHJ1ZTtcblxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY2FuY2VsT3V0Z29pbmdDYWxsID0gKCkgPT4ge1xuICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpO1xuICAgIENvbWV0Q2hhdC5yZWplY3RDYWxsKFxuICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0IS5nZXRTZXNzaW9uSWQoKSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmNhbmNlbGxlZFxuICAgIClcbiAgICAgIC50aGVuKChjYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLm5leHQoY2FsbCk7XG4gICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgZ2V0Q2FsbGVyTmFtZShjYWxsOiBhbnkpIHtcbiAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBjYWxsPy5nZXRJbml0aWF0b3IoKT8uZ2V0VWlkKCkpIHtcbiAgICAgIHJldHVybiBjYWxsPy5nZXRSZWNlaXZlcigpPy5nZXROYW1lKCk7XG4gICAgfVxuICAgIHJldHVybiBjYWxsLmdldEluaXRpYXRvcigpPy5nZXROYW1lKCk7XG4gIH1cbiAgZ2V0QXZhdGFyVXJsKGNhbGw6IGFueSkge1xuICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGNhbGw/LmdldEluaXRpYXRvcigpPy5nZXRVaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGw/LnJlY2VpdmVyPy5hdmF0YXIgfHwgY2FsbD8ucmVjZWl2ZXI/Lmljb24gO1xuICAgIH1cbiAgICByZXR1cm4gY2FsbC5pbml0aWF0b3I/LmF2YXRhciB8fCBjYWxsPy5pbml0aWF0b3I/Lmljb247XG4gIH1cbiAgZ2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKHRoaXMuY2FsbExvZ1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYWxsTG9nUmVxdWVzdEJ1aWxkZXI/LmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsTG9nUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldENhbGxDYXRlZ29yeShcImNhbGxcIilcbiAgICAgICAgLnNldEF1dGhUb2tlbih0aGlzLmF1dGhUb2tlbilcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0Q2FsbFR5cGVJY29uKGNhbGw6IGFueSkge1xuICAgIGNvbnN0IG1pc3NlZENhbGwgPSBDYWxsTG9nVXRpbHMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgY29uc3QgY2FsbFR5cGUgPSBjYWxsLmdldFR5cGUoKTtcbiAgICBsZXQgaWNvbjtcbiAgICBpZiAobWlzc2VkQ2FsbCkge1xuICAgICAgaWYgKGNhbGxUeXBlID09PSBDb21ldENoYXQuQ0FMTF9UWVBFLkFVRElPKSB7XG4gICAgICAgIGljb24gPSB0aGlzLm1pc3NlZEF1ZGlvQ2FsbEljb25Vcmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpY29uID0gdGhpcy5taXNzZWRWaWRlb0NhbGxJY29uVXJsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2FsbC5nZXRJbml0aWF0b3IoKS5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpKSB7XG4gICAgICBpZiAoY2FsbFR5cGUgPT09IENvbWV0Q2hhdC5DQUxMX1RZUEUuQVVESU8pIHtcbiAgICAgICAgaWNvbiA9IHRoaXMub3V0Z29pbmdBdWRpb0NhbGxJY29uVXJsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWNvbiA9IHRoaXMub3V0Z29pbmdWaWRlb0NhbGxJY29uVXJsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY2FsbFR5cGUgPT09IENvbWV0Q2hhdC5DQUxMX1RZUEUuQVVESU8pIHtcbiAgICAgICAgaWNvbiA9IHRoaXMuaW5jb21pbmdBdWRpb0NhbGxJY29uVXJsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWNvbiA9IHRoaXMuaW5jb21pbmdWaWRlb0NhbGxJY29uVXJsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaWNvbjtcbiAgfVxuXG4gIGNhbGxMb2dTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmNhbGxMb2dzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuY2FsbExvZ3NTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmNhbGxMb2dzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNhbGxMb2dzU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG5cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXREYXRlU3R5bGUoKTtcbiAgICB0aGlzLnNldENhbGxMb2dzU3R5bGUoKTtcbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS50aXRsZUZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy5jYWxsTG9nc1N0eWxlLnRpdGxlQ29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmNhbGxMb2dzU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmNhbGxMb2dzU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5kYXRlU2VwYXJhdG9yVGV4dENvbG9yLFxuXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUuZGF0ZVNlcGFyYXRvclRleHRDb2xvciB8fCBcInJnYmEoMjAsIDIwLCAyMCwgMC40NilcIixcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmRhdGVTZXBhcmF0b3JUZXh0Rm9udCxcbiAgICB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuICBzZXREYXRlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogRGF0ZVN0eWxlID0gbmV3IERhdGVTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTdHlsZSB9O1xuICB9XG5cbiAgZ2V0TGlzdEl0ZW1TdHlsZShjYWxsOiBDb21ldENoYXQuQ2FsbCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICAvLyB0aXRsZUNvbG9yOiB0aGlzLmlzTWlzc2VkQ2FsbChjYWxsLCB0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgICB0aXRsZUNvbG9yOiBDYWxsTG9nVXRpbHMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKClcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgcGFkZGluZzogXCIxMHB4XCIsXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICByZXR1cm4geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG5cbiAgc2V0Q2FsbExvZ3NTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDYWxsTG9nc1N0eWxlID0gbmV3IENhbGxMb2dzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRhdGVTZXBhcmF0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkYXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1pc3NlZENhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgICAgIGluZm9JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBvdXRnb2luZ0NhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGluY29taW5nQ2FsbEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgY2FsbFN0YXR1c1RleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGNhbGxTdGF0dXNUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG5cbiAgICAgIGRhdGVTZXBhcmF0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgfSk7XG5cbiAgICB0aGlzLmNhbGxMb2dzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jYWxsTG9nc1N0eWxlIH07XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmNhbGxTdGF0dXNUZXh0Rm9udCxcbiAgICAgIGNvbG9yOiB0aGlzLmNhbGxMb2dzU3R5bGUuY2FsbFN0YXR1c1RleHRDb2xvcixcbiAgICB9O1xuICB9O1xuXG4gIGluZm9CdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5pbmZvSWNvblRpbnQsXG4gICAgfTtcbiAgfTtcblxuICBnZXRDYWxsQnVpbGRlcigpOiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3MgfCB1bmRlZmluZWQge1xuICAgIGxldCBhdWRpb09ubHlDYWxsOiBib29sZWFuID1cbiAgICAgIHRoaXMuYWN0aXZlQ2FsbD8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICA/IHRydWVcbiAgICAgICAgOiBmYWxzZTtcbiAgICBjb25zdCBjYWxsU2V0dGluZ3MgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcbiAgICAgIC5lbmFibGVEZWZhdWx0TGF5b3V0KHRydWUpXG4gICAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGF1ZGlvT25seUNhbGwpXG4gICAgICAuc2V0Q2FsbExpc3RlbmVyKFxuICAgICAgICBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5PbmdvaW5nQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkNhbGxFbmRlZDogKCkgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3Q/LmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpO1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3Q/LmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklkKVxuICAgICAgICAgICAgICAgIC50aGVuKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoY2FsbCk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5idWlsZCgpO1xuICAgIHJldHVybiBjYWxsU2V0dGluZ3M7XG4gIH1cblxuICBjbG9zZUNhbGxTY3JlZW4oKSB7XG4gICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gbnVsbDtcbiAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlO1xuICAgIHRoaXMuc2Vzc2lvbklkID0gXCJcIjtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIG9wZW5PbmdvaW5nQ2FsbFNjcmVlbihjYWxsOiBDb21ldENoYXQuQ2FsbCkge1xuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IGNhbGw7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBjYWxsLmdldFNlc3Npb25JZCgpO1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICBzZXRPbmdvaW5nQ2FsbFN0eWxlID0gKCkgPT4ge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgQ2FsbHNjcmVlblN0eWxlKHtcbiAgICAgIG1heEhlaWdodDogXCIxMDAlXCIsXG4gICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiIzFjMjIyNlwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjQwMHB4XCIsXG4gICAgICBtaW5XaWR0aDogXCI0MDBweFwiLFxuICAgICAgbWluaW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfSk7XG4gICAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub25nb2luZ0NhbGxTdHlsZSB9O1xuICB9O1xuXG4gIGdldERpcmVjdGlvbkljb25TdHlsZShjYWxsOiBhbnkpIHtcbiAgICBsZXQgdGludDtcbiAgICBjb25zdCBtaXNzZWRDYWxsID0gQ2FsbExvZ1V0aWxzLmlzTWlzc2VkQ2FsbChjYWxsLCB0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIGlmIChtaXNzZWRDYWxsKSB7XG4gICAgICB0aW50ID1cbiAgICAgICAgdGhpcy5jYWxsTG9nc1N0eWxlLm1pc3NlZENhbGxJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpO1xuICAgIH0gZWxzZSBpZiAoY2FsbC5nZXRJbml0aWF0b3IoKS5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aW50ID1cbiAgICAgICAgdGhpcy5jYWxsTG9nc1N0eWxlLm91dGdvaW5nQ2FsbEljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpbnQgPVxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUuaW5jb21pbmdDYWxsSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjE4cHhcIixcbiAgICAgIHdpZHRoOiBcIjE4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgaWNvblRpbnQ6IHRpbnQsXG4gICAgfTtcbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWNhbGwtbG9nc1wiIFtuZ1N0eWxlXT1cImNhbGxMb2dTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZW51c1wiICpuZ0lmPVwibWVudVwiPlxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuICA8Y29tZXRjaGF0LWxpc3QgW2hpZGVTZWFyY2hdPVwidHJ1ZVwiIFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIlxuICAgIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwib25TY3JvbGxlZFRvQm90dG9tXCIgW2xpc3RdPVwiY2FsbHNMaXN0XCIgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIiBbdGl0bGVdPVwidGl0bGVcIlxuICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwic2VjdGlvbkhlYWRlckZpZWxkXCJcbiAgICBbc2hvd1NlY3Rpb25IZWFkZXJdPVwic2hvd1NlY3Rpb25IZWFkZXJcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIlxuICAgIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCIgW2dldFNlY3Rpb25IZWFkZXJdPVwiZ2V0U2VjdGlvbkhlYWRlciFcIj5cbiAgPC9jb21ldGNoYXQtbGlzdD5cblxuICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1jYWxsPlxuXG4gICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cImdldENhbGxlck5hbWUoY2FsbClcIiBbYXZhdGFyVVJMXT1cImdldEF2YXRhclVybChjYWxsKVwiXG4gICAgICBbYXZhdGFyTmFtZV09XCJnZXRDYWxsZXJOYW1lKGNhbGwpXCIgW2xpc3RJdGVtU3R5bGVdPVwiZ2V0TGlzdEl0ZW1TdHlsZShjYWxsKVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICBbaGlkZVNlcGFyYXRvcl09XCJoaWRlU2VwYXJhdG9yXCIgKGNjLWxpc3RpdGVtLWNsaWNrZWQpPVwib25MaXN0SXRlbUNsaWNrQ2FsbChjYWxsKVwiXG4gICAgICBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlQ2FsbChjYWxsKVwiPlxuICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgY2xhc3M9XCJjYy1jYWxsLWxvZ3NfX3N1YnRpdGxlLXZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlldztlbHNlIGdyb3VwU3VidGl0bGVcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNncm91cFN1YnRpdGxlPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBbbmdTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIiBjbGFzcz1cImNjLWNhbGwtbG9nc19fc3VidGl0bGUtdmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jYWxsX19pY29uXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWljb24gW2ljb25TdHlsZV09XCJnZXREaXJlY3Rpb25JY29uU3R5bGUoY2FsbClcIiBbVVJMXT1cImdldENhbGxUeXBlSWNvbihjYWxsKVwiPjwvY29tZXRjaGF0LWljb24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGxfX3R5cGVcIj5cbiAgICAgICAgICAgIHt7Z2V0U3VidGl0bGUoY2FsbCl9fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtY2FsbC1sb2dzX190YWlsLXZpZXdcIiAqbmdJZj1cInRhaWxWaWV3O2Vsc2UgZGVmYXVsdFRhaWxWaWV3XCI+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0VGFpbFZpZXc+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgW25nU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCIgY2xhc3M9XCJjYy1jYWxsLWxvZ3NfX3N1YnRpdGxlLXZpZXdcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFpbF9fdmlld1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGwtbG9nc19fZGF0ZVwiPlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW2RhdGVTdHlsZV09XCJkYXRlU3R5bGVcIiBbdGltZXN0YW1wXT1cImNhbGw/LmluaXRpYXRlZEF0XCJcbiAgICAgICAgICAgICAgICBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwic2hvd01vcmVJbmZvXCIgW2ljb25VUkxdPVwiaW5mb0ljb25VcmxcIiBjbGFzcz1cImNjLWRldGFpbHNfX2Nsb3NlLWJ1dHRvblwiXG4gICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImluZm9CdXR0b25TdHlsZSgpXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImhhbmRsZUluZm9DbGljayhjYWxsKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG5cblxuXG4gICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuXG4gIDwvbmctdGVtcGxhdGU+XG5cblxuPC9kaXY+XG5cbjxjb21ldGNoYXQtb25nb2luZy1jYWxsICpuZ0lmPVwic2hvd09uZ29pbmdDYWxsXCIgW21heGltaXplSWNvblVSTF09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ubWF4aW1pemVJY29uVVJMXCJcbiAgW21pbmltaXplSWNvblVSTF09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ubWluaW1pemVJY29uVVJMXCIgW3Nlc3Npb25JRF09XCJzZXNzaW9uSWRcIlxuICBbY2FsbFNldHRpbmdzQnVpbGRlcl09XCJnZXRDYWxsQnVpbGRlcigpIVwiPjwvY29tZXRjaGF0LW9uZ29pbmctY2FsbD5cblxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cInNob3dPdXRnb2luZ0NhbGxzY3JlZW5cIiBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCI+XG5cbiAgPGNvbWV0Y2hhdC1vdXRnb2luZy1jYWxsIFtjdXN0b21Tb3VuZEZvckNhbGxzXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY3VzdG9tU291bmRGb3JDYWxsc1wiXG4gICAgW29uRXJyb3JdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbZGlzYWJsZVNvdW5kRm9yQ2FsbHNdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5kaXNhYmxlU291bmRGb3JDYWxsc1wiXG4gICAgW2F2YXRhclN0eWxlXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIiBbY3VzdG9tVmlld109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmN1c3RvbVZpZXdcIlxuICAgIFtkZWNsaW5lQnV0dG9uSWNvblVSTF09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmRlY2xpbmVCdXR0b25JY29uVVJMXCJcbiAgICBbb25DbG9zZUNsaWNrZWRdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkNsb3NlQ2xpY2tlZCB8fCBjYW5jZWxPdXRnb2luZ0NhbGxcIlxuICAgIFtvdXRnb2luZ0NhbGxTdHlsZV09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm91dGdvaW5nQ2FsbFN0eWxlIHx8IG91dGdvaW5nQ2FsbFN0eWxlXCJcbiAgICBbY2FsbF09XCJjb21ldGNoYXRDYWxsT2JqZWN0IVwiPjwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGw+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD4iXX0=