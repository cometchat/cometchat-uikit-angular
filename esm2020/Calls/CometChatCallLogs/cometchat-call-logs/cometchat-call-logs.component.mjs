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
                if (this.cometchatCallObject && this.cometchatCallObject.getSessionId() == call.getSessionId()) {
                    this.cometchatCallObject = null;
                    this.showOutgoingCallscreen = false;
                    this.ref.detectChanges();
                }
            },
            onOutgoingCallAccepted: (call) => {
                if (this.cometchatCallObject && this.cometchatCallObject.getSessionId() == call.getSessionId()) {
                    this.cometchatCallObject = call;
                    this.openOngoingCallScreen(call);
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEdBS04sTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFFTCx5QkFBeUIsRUFDekIscUJBQXFCLEVBRXJCLG1CQUFtQixFQUNuQix1QkFBdUIsRUFDdkIsYUFBYSxHQUNkLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUNMLFdBQVcsRUFFWCxlQUFlLEVBQ2YsU0FBUyxFQUNULGFBQWEsR0FDZCxNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxRQUFRLEVBQ1IsdUJBQXVCLEVBQ3ZCLFVBQVUsRUFDVixZQUFZLEVBQ1osbUJBQW1CLEVBQ25CLGNBQWMsRUFDZCxNQUFNLEdBQ1AsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7Ozs7Ozs7QUFRbEUsTUFBTSxPQUFPLDBCQUEwQjtJQXdHckMsWUFDVSxVQUFzQixFQUN0QixHQUFzQixFQUN0QixZQUFtQztRQUZuQyxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ3RCLFFBQUcs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b3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uSW5pdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5cbmltcG9ydCB7XG4gIExpc3RTdHlsZSxcbiAgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbixcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxuICBPdXRnb2luZ0NhbGxTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRDYWxscyxcbiAgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24sXG4gIENhbGxMb2dzU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIENhbGxzY3JlZW5TdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIGxvY2FsaXplLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgZm9udEhlbHBlcixcbiAgRGF0ZVBhdHRlcm5zLFxuICBDb21ldENoYXRDYWxsRXZlbnRzLFxuICBUaXRsZUFsaWdubWVudCxcbiAgU3RhdGVzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IENhbGxMb2dVdGlscyB9IGZyb20gXCIuLi8uLi8uLi9TaGFyZWQvVXRpbHMvQ2FsbExvZ1V0aWxzXCI7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY2FsbC1sb2dzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Y2hhdENhbGxMb2dzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FMTFNcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmxlZnQ7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IGFueTtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogYW55O1xuICBASW5wdXQoKSB0YWlsVmlldyE6IGFueTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19DQUxMU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcblxuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgaW5mb0ljb25Vcmw6IHN0cmluZyA9IFwiYXNzZXRzL0luZm9JY29uLnN2Z1wiO1xuICBASW5wdXQoKSBtaXNzZWRBdWRpb0NhbGxJY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9taXNzZWRBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBtaXNzZWRWaWRlb0NhbGxJY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9taXNzZWRWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBvdXRnb2luZ0F1ZGlvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvb3V0Z29pbmdBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBvdXRnb2luZ1ZpZGVvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvb3V0Z29pbmdWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBpbmNvbWluZ0F1ZGlvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvaW5jb21pbmdBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBpbmNvbWluZ1ZpZGVvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvaW5jb21pbmdWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuXG4gIEBJbnB1dCgpIGNhbGxMb2dSZXF1ZXN0QnVpbGRlciE6IGFueTtcbiAgQElucHV0KCkgY29tZXRjaGF0Q2FsbE9iamVjdCE6IENvbWV0Q2hhdC5DYWxsIHwgbnVsbDtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAoY2FsbDogYW55KSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkluZm9DbGljayE6IChjYWxsOiBhbnkpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG5cbiAgQElucHV0KCkgYWN0aXZlQ2FsbCE6IGFueTtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy50aW1lO1xuICBASW5wdXQoKSBEYXRlU2VwYXJhdG9yUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGU7XG5cbiAgQElucHV0KCkgY2FsbExvZ3NTdHlsZTogQ2FsbExvZ3NTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgfTtcblxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIzMnB4XCIsXG4gICAgaGVpZ2h0OiBcIjMycHhcIixcbiAgfTtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIEBJbnB1dCgpIGRhdGVTZXBhcmF0b3JTdHlsZTogRGF0ZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCJcIixcbiAgICB3aWR0aDogXCJcIixcbiAgfTtcblxuICBASW5wdXQoKSBvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uOiBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uID1cbiAgICBuZXcgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbih7fSk7XG5cbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG5cbiAgQElucHV0KCkgc2hvd1NlY3Rpb25IZWFkZXI6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBzaG93TW9yZUluZm86IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBhbnkgPSBcImluaXRpYXRlZEF0XCI7XG5cbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHt9O1xuXG4gIEBJbnB1dCgpIGRhdGVTdHlsZTogRGF0ZVN0eWxlID0ge307XG5cbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHt9O1xuICBASW5wdXQoKSBvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb246IENhbGxTY3JlZW5Db25maWd1cmF0aW9uID1cbiAgICBuZXcgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24oe30pO1xuXG4gIHB1YmxpYyBzZWxlY3RlZE9yQWN0aXZlQ2FsbExvZ09iamVjdCE6IGFueTtcbiAgY2FsbHNSZXF1ZXN0ITogYW55O1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IHt9O1xuXG4gIHNlc3Npb25JZDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIGNhbGxMb2dzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjYWxsbG9nc2NhbGxpbmdcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9O1xuXG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyBjYWxsc0xpc3Q6IGFueSA9IFtdO1xuICBwdWJsaWMgY2FsbHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNhbGxzTGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgYXV0aFRva2VuOiBzdHJpbmcgPSBcIlwiO1xuICBzaG93T3V0Z29pbmdDYWxsc2NyZWVuOiBib29sZWFuID0gZmFsc2U7XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTogYW55ID0gbnVsbDtcblxuICBvdXRnb2luZ0NhbGxTdHlsZTogT3V0Z29pbmdDYWxsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzYwcHhcIixcbiAgICBoZWlnaHQ6IFwiNTgxcHhcIixcbiAgICB0aXRsZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gICAgdGl0bGVUZXh0Q29sb3I6IFwiUkdCKDIwLCAyMCwgMjApXCIsXG4gICAgc3VidGl0bGVUZXh0Rm9udDogXCI0MDAgMTVweCBJbnRlclwiLFxuICAgIHN1YnRpdGxlVGV4dENvbG9yOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKCk7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgICAgdGhpcy5hdXRoVG9rZW4gPSB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0QXV0aFRva2VuKCk7XG4gICAgICAgIHRoaXMuY2FsbHNSZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICB0aGlzLmZldGNoTmV4dENhbGxMb2dzTGlzdCgpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDYWxsTGlzdGVuZXIoXG4gICAgICB0aGlzLmNhbGxMb2dzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gY2FsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuXG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ICYmIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgJiYgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0LmdldFNlc3Npb25JZCgpID09IGNhbGwuZ2V0U2Vzc2lvbklkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IGNhbGw7XG4gICAgICAgICAgICB0aGlzLm9wZW5PbmdvaW5nQ2FsbFNjcmVlbihjYWxsKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSxcbiAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5jYWxsc1JlcXVlc3QgPSBudWxsO1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcblxuICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMb2dzTGlzdGVuZXJJZCk7XG4gIH1cblxuICBmZXRjaE5leHRDYWxsTG9nc0xpc3QgPSAoKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgdGhpcy5jYWxsc1JlcXVlc3QhLmZldGNoTmV4dCgpXG4gICAgICAudGhlbigoY2FsbExpc3Q6IGFueSkgPT4ge1xuICAgICAgICBpZiAoY2FsbExpc3Q/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0Q2FsbExvZ3NMaXN0O1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbExpc3QubGVuZ3RoIDw9IDAgJiYgdGhpcy5jYWxsc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG5cbiAgICAgICAgICB0aGlzLmNhbGxzTGlzdCA9IFsuLi50aGlzLmNhbGxzTGlzdCwgLi4uY2FsbExpc3RdO1xuXG4gICAgICAgICAgaWYgKHRoaXMuY2FsbHNMaXN0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG5cbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gIGdldFN1YnRpdGxlKGNhbGw6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIENhbGxMb2dVdGlscy5nZXRDYWxsU3RhdHVzV2l0aFR5cGUoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgfVxuICBoYW5kbGVJbmZvQ2xpY2sgPSAoY2FsbDogYW55KSA9PiB7XG4gICAgdGhpcy5zZWxlY3RlZE9yQWN0aXZlQ2FsbExvZ09iamVjdCA9IGNhbGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgaWYgKHRoaXMub25JbmZvQ2xpY2spIHtcbiAgICAgIHRoaXMub25JbmZvQ2xpY2soY2FsbCk7XG4gICAgfVxuICB9O1xuXG4gIGdldEFjdGl2ZUNhbGwgPSAoY2FsbDogYW55KSA9PiB7XG4gICAgaWYgKFxuICAgICAgY2FsbC5nZXRTZXNzaW9uSUQoKSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBjYWxsLmdldFNlc3Npb25JRCgpID09PSB0aGlzLnNlbGVjdGVkT3JBY3RpdmVDYWxsTG9nT2JqZWN0Py5nZXRTZXNzaW9uSUQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgZ2V0U2VjdGlvbkhlYWRlciA9IChjYWxsOiBhbnksIGluZGV4OiBhbnkpID0+IHtcbiAgICBpZiAodGhpcy5jYWxsc0xpc3QgJiYgdGhpcy5jYWxsc0xpc3QubGVuZ3RoID4gMCAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FsbHNMaXN0WzBdW1wiaW5pdGlhdGVkQXRcIl07XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5jYWxsc0xpc3QgJiZcbiAgICAgIHRoaXMuY2FsbHNMaXN0Lmxlbmd0aCA+IDAgJiZcbiAgICAgIGluZGV4ID4gMCAmJlxuICAgICAgQ2FsbExvZ1V0aWxzLmlzRGF0ZURpZmZlcmVudChcbiAgICAgICAgdGhpcy5jYWxsc0xpc3RbaW5kZXggLSAxXVtcImluaXRpYXRlZEF0XCJdLFxuICAgICAgICB0aGlzLmNhbGxzTGlzdFtpbmRleF1bXCJpbml0aWF0ZWRBdFwiXVxuICAgICAgKVxuICAgICkge1xuICAgICAgcmV0dXJuIGNhbGwuZ2V0SW5pdGlhdGVkQXQoKTtcbiAgICB9XG4gIH07XG5cbiAgb25MaXN0SXRlbUNsaWNrQ2FsbCA9IChjYWxsOiBhbnkpID0+IHtcbiAgICBsZXQgcmVjZWl2ZXJJRCA9IGNhbGwuZ2V0UmVjZWl2ZXIoKS51aWQ7XG4gICAgbGV0IGNhbGxUeXBlID0gY2FsbD8udHlwZTtcbiAgICBsZXQgcmVjZWl2ZXJUeXBlID0gY2FsbD8ucmVjZWl2ZXJUeXBlO1xuXG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gY2FsbD8uZ2V0SW5pdGlhdG9yKCk/LmdldFVpZCgpKSB7XG4gICAgICByZWNlaXZlcklEID0gY2FsbC5nZXRSZWNlaXZlcigpPy51aWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlY2VpdmVySUQgPSBjYWxsLmdldEluaXRpYXRvcigpPy51aWQ7XG4gICAgfVxuXG4gICAgbGV0IGxvY2FsQ2FsbE9iaiA9IG5ldyBDb21ldENoYXQuQ2FsbChyZWNlaXZlcklELCBjYWxsVHlwZSwgcmVjZWl2ZXJUeXBlKTtcblxuICAgIGlmIChyZWNlaXZlclR5cGUgPT0gQ29tZXRDaGF0LlJFQ0VJVkVSX1RZUEUuVVNFUikge1xuICAgICAgQ29tZXRDaGF0LmluaXRpYXRlQ2FsbChsb2NhbENhbGxPYmopXG4gICAgICAgIC50aGVuKChvdXRHb2luZ0NhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBvdXRHb2luZ0NhbGw7XG4gICAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gdHJ1ZTtcblxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY2FuY2VsT3V0Z29pbmdDYWxsID0gKCkgPT4ge1xuICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpO1xuICAgIENvbWV0Q2hhdC5yZWplY3RDYWxsKFxuICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0IS5nZXRTZXNzaW9uSWQoKSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmNhbmNlbGxlZFxuICAgIClcbiAgICAgIC50aGVuKChjYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLm5leHQoY2FsbCk7XG4gICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgZ2V0Q2FsbGVyTmFtZShjYWxsOiBhbnkpIHtcbiAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBjYWxsPy5nZXRJbml0aWF0b3IoKT8uZ2V0VWlkKCkpIHtcbiAgICAgIHJldHVybiBjYWxsPy5nZXRSZWNlaXZlcigpPy5nZXROYW1lKCk7XG4gICAgfVxuICAgIHJldHVybiBjYWxsLmdldEluaXRpYXRvcigpPy5nZXROYW1lKCk7XG4gIH1cbiAgZ2V0QXZhdGFyVXJsKGNhbGw6IGFueSkge1xuICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGNhbGw/LmdldEluaXRpYXRvcigpPy5nZXRVaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGw/LnJlY2VpdmVyPy5hdmF0YXIgfHwgY2FsbD8ucmVjZWl2ZXI/Lmljb247XG4gICAgfVxuICAgIHJldHVybiBjYWxsLmluaXRpYXRvcj8uYXZhdGFyIHx8IGNhbGw/LmluaXRpYXRvcj8uaWNvbjtcbiAgfVxuICBnZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAodGhpcy5jYWxsTG9nUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbGxMb2dSZXF1ZXN0QnVpbGRlcj8uYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxMb2dSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAuc2V0Q2FsbENhdGVnb3J5KFwiY2FsbFwiKVxuICAgICAgICAuc2V0QXV0aFRva2VuKHRoaXMuYXV0aFRva2VuKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9XG4gIH1cblxuICBnZXRDYWxsVHlwZUljb24oY2FsbDogYW55KSB7XG4gICAgY29uc3QgbWlzc2VkQ2FsbCA9IENhbGxMb2dVdGlscy5pc01pc3NlZENhbGwoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgICBjb25zdCBjYWxsVHlwZSA9IGNhbGwuZ2V0VHlwZSgpO1xuICAgIGxldCBpY29uO1xuICAgIGlmIChtaXNzZWRDYWxsKSB7XG4gICAgICBpZiAoY2FsbFR5cGUgPT09IENvbWV0Q2hhdC5DQUxMX1RZUEUuQVVESU8pIHtcbiAgICAgICAgaWNvbiA9IHRoaXMubWlzc2VkQXVkaW9DYWxsSWNvblVybDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGljb24gPSB0aGlzLm1pc3NlZFZpZGVvQ2FsbEljb25Vcmw7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjYWxsLmdldEluaXRpYXRvcigpLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkpIHtcbiAgICAgIGlmIChjYWxsVHlwZSA9PT0gQ29tZXRDaGF0LkNBTExfVFlQRS5BVURJTykge1xuICAgICAgICBpY29uID0gdGhpcy5vdXRnb2luZ0F1ZGlvQ2FsbEljb25Vcmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpY29uID0gdGhpcy5vdXRnb2luZ1ZpZGVvQ2FsbEljb25Vcmw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjYWxsVHlwZSA9PT0gQ29tZXRDaGF0LkNBTExfVFlQRS5BVURJTykge1xuICAgICAgICBpY29uID0gdGhpcy5pbmNvbWluZ0F1ZGlvQ2FsbEljb25Vcmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpY29uID0gdGhpcy5pbmNvbWluZ1ZpZGVvQ2FsbEljb25Vcmw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpY29uO1xuICB9XG5cbiAgY2FsbExvZ1N0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5jYWxsTG9nc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jYWxsTG9nc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY2FsbExvZ3NTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY2FsbExvZ3NTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcblxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc2V0Q2FsbExvZ3NTdHlsZSgpO1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLnRpdGxlRm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLmNhbGxMb2dzU3R5bGUudGl0bGVDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmNhbGxMb2dzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5jYWxsTG9nc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5jYWxsTG9nc1N0eWxlLmRhdGVTZXBhcmF0b3JUZXh0Q29sb3IsXG5cbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuY2FsbExvZ3NTdHlsZS5kYXRlU2VwYXJhdG9yVGV4dENvbG9yIHx8IFwicmdiYSgyMCwgMjAsIDIwLCAwLjQ2KVwiLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRGb250OiB0aGlzLmNhbGxMb2dzU3R5bGUuZGF0ZVNlcGFyYXRvclRleHRGb250LFxuICAgIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEYXRlU3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cblxuICBnZXRMaXN0SXRlbVN0eWxlKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIC8vIHRpdGxlQ29sb3I6IHRoaXMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICAgIHRpdGxlQ29sb3I6IENhbGxMb2dVdGlscy5pc01pc3NlZENhbGwoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIhKVxuICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBwYWRkaW5nOiBcIjEwcHhcIixcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgIH0pO1xuICAgIHJldHVybiB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cblxuICBzZXRDYWxsTG9nc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENhbGxMb2dzU3R5bGUgPSBuZXcgQ2FsbExvZ3NTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGF0ZVNlcGFyYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWlzc2VkQ2FsbEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgICAgaW5mb0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIG91dGdvaW5nQ2FsbEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaW5jb21pbmdDYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBjYWxsU3RhdHVzVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgY2FsbFN0YXR1c1RleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcblxuICAgICAgZGF0ZVNlcGFyYXRvclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICB9KTtcblxuICAgIHRoaXMuY2FsbExvZ3NTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNhbGxMb2dzU3R5bGUgfTtcbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmNhbGxMb2dzU3R5bGUuY2FsbFN0YXR1c1RleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5jYWxsU3RhdHVzVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG5cbiAgaW5mb0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5jYWxsTG9nc1N0eWxlLmluZm9JY29uVGludCxcbiAgICB9O1xuICB9O1xuXG4gIGdldENhbGxCdWlsZGVyKCk6IHR5cGVvZiBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5ncyB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGF1ZGlvT25seUNhbGw6IGJvb2xlYW4gPVxuICAgICAgdGhpcy5hY3RpdmVDYWxsPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgICAgID8gdHJ1ZVxuICAgICAgICA6IGZhbHNlO1xuICAgIGNvbnN0IGNhbGxTZXR0aW5ncyA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuICAgICAgLmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSlcbiAgICAgIC5zZXRJc0F1ZGlvT25seUNhbGwoYXVkaW9Pbmx5Q2FsbClcbiAgICAgIC5zZXRDYWxsTGlzdGVuZXIoXG4gICAgICAgIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLk9uZ29pbmdDYWxsTGlzdGVuZXIoe1xuICAgICAgICAgIG9uQ2FsbEVuZGVkOiAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdD8uZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkNhbGxFbmRCdXR0b25QcmVzc2VkOiAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdD8uZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0LmVuZENhbGwodGhpcy5zZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgLnRoZW4oKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcbiAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dChjYWxsKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgcmV0dXJuIGNhbGxTZXR0aW5ncztcbiAgfVxuXG4gIGNsb3NlQ2FsbFNjcmVlbigpIHtcbiAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gZmFsc2U7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBcIlwiO1xuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgb3Blbk9uZ29pbmdDYWxsU2NyZWVuKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gY2FsbDtcbiAgICB0aGlzLnNlc3Npb25JZCA9IGNhbGwuZ2V0U2Vzc2lvbklkKCk7XG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIHNldE9uZ29pbmdDYWxsU3R5bGUgPSAoKSA9PiB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZSA9IG5ldyBDYWxsc2NyZWVuU3R5bGUoe1xuICAgICAgbWF4SGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCIjMWMyMjI2XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiNDAwcHhcIixcbiAgICAgIG1pbldpZHRoOiBcIjQwMHB4XCIsXG4gICAgICBtaW5pbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgbWF4aW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH07XG4gIH07XG5cbiAgZ2V0RGlyZWN0aW9uSWNvblN0eWxlKGNhbGw6IGFueSkge1xuICAgIGxldCB0aW50O1xuICAgIGNvbnN0IG1pc3NlZENhbGwgPSBDYWxsTG9nVXRpbHMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgaWYgKG1pc3NlZENhbGwpIHtcbiAgICAgIHRpbnQgPVxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUubWlzc2VkQ2FsbEljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCk7XG4gICAgfSBlbHNlIGlmIChjYWxsLmdldEluaXRpYXRvcigpLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgIHRpbnQgPVxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUub3V0Z29pbmdDYWxsSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGludCA9XG4gICAgICAgIHRoaXMuY2FsbExvZ3NTdHlsZS5pbmNvbWluZ0NhbGxJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMThweFwiLFxuICAgICAgd2lkdGg6IFwiMThweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBpY29uVGludDogdGludCxcbiAgICB9O1xuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY2FsbC1sb2dzXCIgW25nU3R5bGVdPVwiY2FsbExvZ1N0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbaGlkZVNlYXJjaF09XCJ0cnVlXCIgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiXG4gICAgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIiBbbGlzdF09XCJjYWxsc0xpc3RcIiBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCIgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCIgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCIgW3NlY3Rpb25IZWFkZXJGaWVsZF09XCJzZWN0aW9uSGVhZGVyRmllbGRcIlxuICAgIFtzaG93U2VjdGlvbkhlYWRlcl09XCJzaG93U2VjdGlvbkhlYWRlclwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiXG4gICAgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIiBbc3RhdGVdPVwic3RhdGVcIiBbZ2V0U2VjdGlvbkhlYWRlcl09XCJnZXRTZWN0aW9uSGVhZGVyIVwiPlxuICA8L2NvbWV0Y2hhdC1saXN0PlxuXG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWNhbGw+XG5cbiAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwiZ2V0Q2FsbGVyTmFtZShjYWxsKVwiIFthdmF0YXJVUkxdPVwiZ2V0QXZhdGFyVXJsKGNhbGwpXCJcbiAgICAgIFthdmF0YXJOYW1lXT1cImdldENhbGxlck5hbWUoY2FsbClcIiBbbGlzdEl0ZW1TdHlsZV09XCJnZXRMaXN0SXRlbVN0eWxlKGNhbGwpXCIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkxpc3RJdGVtQ2xpY2tDYWxsKGNhbGwpXCJcbiAgICAgIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVDYWxsKGNhbGwpXCI+XG4gICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWNhbGwtbG9nc19fc3VidGl0bGUtdmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgZ3JvdXBTdWJ0aXRsZVwiPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2dyb3VwU3VidGl0bGU+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiIGNsYXNzPVwiY2MtY2FsbC1sb2dzX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGxfX2ljb25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtaWNvbiBbaWNvblN0eWxlXT1cImdldERpcmVjdGlvbkljb25TdHlsZShjYWxsKVwiIFtVUkxdPVwiZ2V0Q2FsbFR5cGVJY29uKGNhbGwpXCI+PC9jb21ldGNoYXQtaWNvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY2FsbF9fdHlwZVwiPlxuICAgICAgICAgICAge3tnZXRTdWJ0aXRsZShjYWxsKX19XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1jYWxsLWxvZ3NfX3RhaWwtdmlld1wiICpuZ0lmPVwidGFpbFZpZXc7ZWxzZSBkZWZhdWx0VGFpbFZpZXdcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRUYWlsVmlldz5cbiAgICAgICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiBbbmdTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIiBjbGFzcz1cImNjLWNhbGwtbG9nc19fc3VidGl0bGUtdmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWlsX192aWV3XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY2FsbC1sb2dzX19kYXRlXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbZGF0ZVN0eWxlXT1cImRhdGVTdHlsZVwiIFt0aW1lc3RhbXBdPVwiY2FsbD8uaW5pdGlhdGVkQXRcIlxuICAgICAgICAgICAgICAgIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gKm5nSWY9XCJzaG93TW9yZUluZm9cIiBbaWNvblVSTF09XCJpbmZvSWNvblVybFwiIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiaW5mb0J1dHRvblN0eWxlKClcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaGFuZGxlSW5mb0NsaWNrKGNhbGwpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuXG5cbiAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG5cbiAgPC9uZy10ZW1wbGF0ZT5cblxuXG48L2Rpdj5cblxuPGNvbWV0Y2hhdC1vbmdvaW5nLWNhbGwgKm5nSWY9XCJzaG93T25nb2luZ0NhbGxcIiBbbWF4aW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5tYXhpbWl6ZUljb25VUkxcIlxuICBbbWluaW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5taW5pbWl6ZUljb25VUkxcIiBbc2Vzc2lvbklEXT1cInNlc3Npb25JZFwiXG4gIFtjYWxsU2V0dGluZ3NCdWlsZGVyXT1cImdldENhbGxCdWlsZGVyKCkhXCI+PC9jb21ldGNoYXQtb25nb2luZy1jYWxsPlxuXG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwic2hvd091dGdvaW5nQ2FsbHNjcmVlblwiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cblxuICA8Y29tZXRjaGF0LW91dGdvaW5nLWNhbGwgW2N1c3RvbVNvdW5kRm9yQ2FsbHNdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5jdXN0b21Tb3VuZEZvckNhbGxzXCJcbiAgICBbb25FcnJvcl09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtkaXNhYmxlU291bmRGb3JDYWxsc109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmRpc2FibGVTb3VuZEZvckNhbGxzXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiIFtjdXN0b21WaWV3XT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY3VzdG9tVmlld1wiXG4gICAgW2RlY2xpbmVCdXR0b25JY29uVVJMXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uZGVjbGluZUJ1dHRvbkljb25VUkxcIlxuICAgIFtvbkNsb3NlQ2xpY2tlZF09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm9uQ2xvc2VDbGlja2VkIHx8IGNhbmNlbE91dGdvaW5nQ2FsbFwiXG4gICAgW291dGdvaW5nQ2FsbFN0eWxlXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub3V0Z29pbmdDYWxsU3R5bGUgfHwgb3V0Z29pbmdDYWxsU3R5bGVcIlxuICAgIFtjYWxsXT1cImNvbWV0Y2hhdENhbGxPYmplY3QhXCI+PC9jb21ldGNoYXQtb3V0Z29pbmctY2FsbD5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPiJdfQ==