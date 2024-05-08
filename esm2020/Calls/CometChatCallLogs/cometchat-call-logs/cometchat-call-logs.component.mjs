import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { OutgoingCallConfiguration, CometChatSoundManager, CometChatUIKitCalls, CallScreenConfiguration, CallLogsStyle, StorageUtils, } from "@cometchat/uikit-shared";
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
                StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
                if (this.cometchatCallObject?.getReceiverType() ==
                    CometChatUIKitConstants.MessageReceiverType.user) {
                    CometChatUIKitCalls.endSession();
                    this.closeCallScreen();
                }
            },
            onCallEndButtonPressed: () => {
                StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEdBS04sTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFFTCx5QkFBeUIsRUFDekIscUJBQXFCLEVBRXJCLG1CQUFtQixFQUNuQix1QkFBdUIsRUFDdkIsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFDTCxXQUFXLEVBRVgsZUFBZSxFQUNmLFNBQVMsRUFDVCxhQUFhLEdBQ2QsTUFBTSwyQkFBMkIsQ0FBQztBQUVuQyxPQUFPLEVBQ0wsUUFBUSxFQUNSLHVCQUF1QixFQUN2QixVQUFVLEVBQ1YsWUFBWSxFQUNaLG1CQUFtQixFQUNuQixjQUFjLEVBQ2QsTUFBTSxHQUNQLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG9DQUFvQyxDQUFDOzs7Ozs7O0FBUWxFLE1BQU0sT0FBTywwQkFBMEI7SUF3R3JDLFlBQ1UsVUFBc0IsRUFDdEIsR0FBc0IsRUFDdEIsWUFBbUM7UUFGbkMsZUFBVSxHQUFWLFVBQVUsQ0FBWTtR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QUFZO3NCQUFwQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFFRyxhQUFhO3NCQUFyQixLQUFLO2dCQUVHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBRUcsYUFBYTtzQkFBckIsS0FBSztnQkFDRyx3QkFBd0I7c0JBQWhDLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcblxuaW1wb3J0IHtcbiAgTGlzdFN0eWxlLFxuICBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIE91dGdvaW5nQ2FsbFN0eWxlLFxuICBDb21ldENoYXRVSUtpdENhbGxzLFxuICBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbixcbiAgQ2FsbExvZ3NTdHlsZSxcbiAgU3RvcmFnZVV0aWxzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBDYWxsc2NyZWVuU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQge1xuICBsb2NhbGl6ZSxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIGZvbnRIZWxwZXIsXG4gIERhdGVQYXR0ZXJucyxcbiAgQ29tZXRDaGF0Q2FsbEV2ZW50cyxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIFN0YXRlcyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQgeyBDYWxsTG9nVXRpbHMgfSBmcm9tIFwiLi4vLi4vLi4vU2hhcmVkL1V0aWxzL0NhbGxMb2dVdGlsc1wiO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWNhbGwtbG9nc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jYWxsLWxvZ3MuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1jYWxsLWxvZ3MuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldGNoYXRDYWxsTG9nc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTExTXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBhbnk7XG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IGFueTtcbiAgQElucHV0KCkgdGFpbFZpZXchOiBhbnk7XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fQ0FMTFNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG5cbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGluZm9JY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9JbmZvSWNvbi5zdmdcIjtcbiAgQElucHV0KCkgbWlzc2VkQXVkaW9DYWxsSWNvblVybDogc3RyaW5nID0gXCJhc3NldHMvbWlzc2VkQXVkaW9DYWxsSWNvblVybC5zdmdcIjtcbiAgQElucHV0KCkgbWlzc2VkVmlkZW9DYWxsSWNvblVybDogc3RyaW5nID0gXCJhc3NldHMvbWlzc2VkVmlkZW9DYWxsSWNvblVybC5zdmdcIjtcbiAgQElucHV0KCkgb3V0Z29pbmdBdWRpb0NhbGxJY29uVXJsOiBzdHJpbmcgPVxuICAgIFwiYXNzZXRzL291dGdvaW5nQXVkaW9DYWxsSWNvblVybC5zdmdcIjtcbiAgQElucHV0KCkgb3V0Z29pbmdWaWRlb0NhbGxJY29uVXJsOiBzdHJpbmcgPVxuICAgIFwiYXNzZXRzL291dGdvaW5nVmlkZW9DYWxsSWNvblVybC5zdmdcIjtcbiAgQElucHV0KCkgaW5jb21pbmdBdWRpb0NhbGxJY29uVXJsOiBzdHJpbmcgPVxuICAgIFwiYXNzZXRzL2luY29taW5nQXVkaW9DYWxsSWNvblVybC5zdmdcIjtcbiAgQElucHV0KCkgaW5jb21pbmdWaWRlb0NhbGxJY29uVXJsOiBzdHJpbmcgPVxuICAgIFwiYXNzZXRzL2luY29taW5nVmlkZW9DYWxsSWNvblVybC5zdmdcIjtcblxuICBASW5wdXQoKSBjYWxsTG9nUmVxdWVzdEJ1aWxkZXIhOiBhbnk7XG4gIEBJbnB1dCgpIGNvbWV0Y2hhdENhbGxPYmplY3QhOiBDb21ldENoYXQuQ2FsbCB8IG51bGw7XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKGNhbGw6IGFueSkgPT4gdm9pZDtcbiAgQElucHV0KCkgb25JbmZvQ2xpY2shOiAoY2FsbDogYW55KSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuXG4gIEBJbnB1dCgpIGFjdGl2ZUNhbGwhOiBhbnk7XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMudGltZTtcbiAgQElucHV0KCkgRGF0ZVNlcGFyYXRvclBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy5EYXlEYXRlO1xuXG4gIEBJbnB1dCgpIGNhbGxMb2dzU3R5bGU6IENhbGxMb2dzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gIH07XG5cbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMzJweFwiLFxuICAgIGhlaWdodDogXCIzMnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBASW5wdXQoKSBkYXRlU2VwYXJhdG9yU3R5bGU6IERhdGVTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgd2lkdGg6IFwiXCIsXG4gIH07XG5cbiAgQElucHV0KCkgb3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbjogT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbiA9XG4gICAgbmV3IE91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24oe30pO1xuXG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIEBJbnB1dCgpIHNob3dTZWN0aW9uSGVhZGVyOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgc2hvd01vcmVJbmZvOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlY3Rpb25IZWFkZXJGaWVsZDogYW55ID0gXCJpbml0aWF0ZWRBdFwiO1xuXG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7fTtcblxuICBASW5wdXQoKSBkYXRlU3R5bGU6IERhdGVTdHlsZSA9IHt9O1xuXG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgb25nb2luZ0NhbGxDb25maWd1cmF0aW9uOiBDYWxsU2NyZWVuQ29uZmlndXJhdGlvbiA9XG4gICAgbmV3IENhbGxTY3JlZW5Db25maWd1cmF0aW9uKHt9KTtcblxuICBwdWJsaWMgc2VsZWN0ZWRPckFjdGl2ZUNhbGxMb2dPYmplY3QhOiBhbnk7XG4gIGNhbGxzUmVxdWVzdCE6IGFueTtcbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSB7fTtcblxuICBzZXNzaW9uSWQ6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBjYWxsTG9nc0xpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2FsbGxvZ3NjYWxsaW5nXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICBvbmdvaW5nQ2FsbFN0eWxlOiBDYWxsc2NyZWVuU3R5bGUgPSB7fTtcblxuICBzaG93T25nb2luZ0NhbGw6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgY2FsbHNMaXN0OiBhbnkgPSBbXTtcbiAgcHVibGljIGNhbGxzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjYWxsc0xpc3RfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGF1dGhUb2tlbjogc3RyaW5nID0gXCJcIjtcbiAgc2hvd091dGdvaW5nQ2FsbHNjcmVlbjogYm9vbGVhbiA9IGZhbHNlO1xuICBvblNjcm9sbGVkVG9Cb3R0b206IGFueSA9IG51bGw7XG5cbiAgb3V0Z29pbmdDYWxsU3R5bGU6IE91dGdvaW5nQ2FsbFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjM2MHB4XCIsXG4gICAgaGVpZ2h0OiBcIjU4MXB4XCIsXG4gICAgdGl0bGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICAgIHRpdGxlVGV4dENvbG9yOiBcIlJHQigyMCwgMjAsIDIwKVwiLFxuICAgIHN1YnRpdGxlVGV4dEZvbnQ6IFwiNDAwIDE1cHggSW50ZXJcIixcbiAgICBzdWJ0aXRsZVRleHRDb2xvcjogXCJSR0JBKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycygpO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgIHRoaXMuYXV0aFRva2VuID0gdGhpcy5sb2dnZWRJblVzZXIhLmdldEF1dGhUb2tlbigpO1xuICAgICAgICB0aGlzLmNhbGxzUmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgdGhpcy5mZXRjaE5leHRDYWxsTG9nc0xpc3QoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGF0dGFjaExpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgdGhpcy5jYWxsTG9nc0xpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgIG9uSW5jb21pbmdDYWxsUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IGNhbGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICBvbkluY29taW5nQ2FsbENhbmNlbGxlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gbnVsbDtcblxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCAmJiB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QuZ2V0U2Vzc2lvbklkKCkgPT0gY2FsbC5nZXRTZXNzaW9uSWQoKSkge1xuICAgICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbEFjY2VwdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ICYmIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBjYWxsO1xuICAgICAgICAgICAgdGhpcy5vcGVuT25nb2luZ0NhbGxTY3JlZW4oY2FsbCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuY2FsbHNSZXF1ZXN0ID0gbnVsbDtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCk7XG5cbiAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5yZW1vdmVDYWxsTGlzdGVuZXIodGhpcy5jYWxsTG9nc0xpc3RlbmVySWQpO1xuICB9XG5cbiAgZmV0Y2hOZXh0Q2FsbExvZ3NMaXN0ID0gKCkgPT4ge1xuICAgIHRoaXMub25TY3JvbGxlZFRvQm90dG9tID0gbnVsbDtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHRoaXMuY2FsbHNSZXF1ZXN0IS5mZXRjaE5leHQoKVxuICAgICAgLnRoZW4oKGNhbGxMaXN0OiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGNhbGxMaXN0Py5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSB0aGlzLmZldGNoTmV4dENhbGxMb2dzTGlzdDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhbGxMaXN0Lmxlbmd0aCA8PSAwICYmIHRoaXMuY2FsbHNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuXG4gICAgICAgICAgdGhpcy5jYWxsc0xpc3QgPSBbLi4udGhpcy5jYWxsc0xpc3QsIC4uLmNhbGxMaXN0XTtcblxuICAgICAgICAgIGlmICh0aGlzLmNhbGxzTGlzdC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuXG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgfTtcblxuICBnZXRTdWJ0aXRsZShjYWxsOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBDYWxsTG9nVXRpbHMuZ2V0Q2FsbFN0YXR1c1dpdGhUeXBlKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gIH1cbiAgaGFuZGxlSW5mb0NsaWNrID0gKGNhbGw6IGFueSkgPT4ge1xuICAgIHRoaXMuc2VsZWN0ZWRPckFjdGl2ZUNhbGxMb2dPYmplY3QgPSBjYWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGlmICh0aGlzLm9uSW5mb0NsaWNrKSB7XG4gICAgICB0aGlzLm9uSW5mb0NsaWNrKGNhbGwpO1xuICAgIH1cbiAgfTtcblxuICBnZXRBY3RpdmVDYWxsID0gKGNhbGw6IGFueSkgPT4ge1xuICAgIGlmIChcbiAgICAgIGNhbGwuZ2V0U2Vzc2lvbklEKCkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgY2FsbC5nZXRTZXNzaW9uSUQoKSA9PT0gdGhpcy5zZWxlY3RlZE9yQWN0aXZlQ2FsbExvZ09iamVjdD8uZ2V0U2Vzc2lvbklEKClcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIGdldFNlY3Rpb25IZWFkZXIgPSAoY2FsbDogYW55LCBpbmRleDogYW55KSA9PiB7XG4gICAgaWYgKHRoaXMuY2FsbHNMaXN0ICYmIHRoaXMuY2FsbHNMaXN0Lmxlbmd0aCA+IDAgJiYgaW5kZXggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbGxzTGlzdFswXVtcImluaXRpYXRlZEF0XCJdO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMuY2FsbHNMaXN0ICYmXG4gICAgICB0aGlzLmNhbGxzTGlzdC5sZW5ndGggPiAwICYmXG4gICAgICBpbmRleCA+IDAgJiZcbiAgICAgIENhbGxMb2dVdGlscy5pc0RhdGVEaWZmZXJlbnQoXG4gICAgICAgIHRoaXMuY2FsbHNMaXN0W2luZGV4IC0gMV1bXCJpbml0aWF0ZWRBdFwiXSxcbiAgICAgICAgdGhpcy5jYWxsc0xpc3RbaW5kZXhdW1wiaW5pdGlhdGVkQXRcIl1cbiAgICAgIClcbiAgICApIHtcbiAgICAgIHJldHVybiBjYWxsLmdldEluaXRpYXRlZEF0KCk7XG4gICAgfVxuICB9O1xuXG4gIG9uTGlzdEl0ZW1DbGlja0NhbGwgPSAoY2FsbDogYW55KSA9PiB7XG4gICAgbGV0IHJlY2VpdmVySUQgPSBjYWxsLmdldFJlY2VpdmVyKCkudWlkO1xuICAgIGxldCBjYWxsVHlwZSA9IGNhbGw/LnR5cGU7XG4gICAgbGV0IHJlY2VpdmVyVHlwZSA9IGNhbGw/LnJlY2VpdmVyVHlwZTtcblxuICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGNhbGw/LmdldEluaXRpYXRvcigpPy5nZXRVaWQoKSkge1xuICAgICAgcmVjZWl2ZXJJRCA9IGNhbGwuZ2V0UmVjZWl2ZXIoKT8udWlkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlcklEID0gY2FsbC5nZXRJbml0aWF0b3IoKT8udWlkO1xuICAgIH1cblxuICAgIGxldCBsb2NhbENhbGxPYmogPSBuZXcgQ29tZXRDaGF0LkNhbGwocmVjZWl2ZXJJRCwgY2FsbFR5cGUsIHJlY2VpdmVyVHlwZSk7XG5cbiAgICBpZiAocmVjZWl2ZXJUeXBlID09IENvbWV0Q2hhdC5SRUNFSVZFUl9UWVBFLlVTRVIpIHtcbiAgICAgIENvbWV0Q2hhdC5pbml0aWF0ZUNhbGwobG9jYWxDYWxsT2JqKVxuICAgICAgICAudGhlbigob3V0R29pbmdDYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gb3V0R29pbmdDYWxsO1xuICAgICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IHRydWU7XG5cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGNhbmNlbE91dGdvaW5nQ2FsbCA9ICgpID0+IHtcbiAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGF1c2UoKTtcbiAgICBDb21ldENoYXQucmVqZWN0Q2FsbChcbiAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCEuZ2V0U2Vzc2lvbklkKCksXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5jYW5jZWxsZWRcbiAgICApXG4gICAgICAudGhlbigoY2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5uZXh0KGNhbGwpO1xuICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIGdldENhbGxlck5hbWUoY2FsbDogYW55KSB7XG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gY2FsbD8uZ2V0SW5pdGlhdG9yKCk/LmdldFVpZCgpKSB7XG4gICAgICByZXR1cm4gY2FsbD8uZ2V0UmVjZWl2ZXIoKT8uZ2V0TmFtZSgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FsbC5nZXRJbml0aWF0b3IoKT8uZ2V0TmFtZSgpO1xuICB9XG4gIGdldEF2YXRhclVybChjYWxsOiBhbnkpIHtcbiAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBjYWxsPy5nZXRJbml0aWF0b3IoKT8uZ2V0VWlkKCkpIHtcbiAgICAgIHJldHVybiBjYWxsPy5yZWNlaXZlcj8uYXZhdGFyIHx8IGNhbGw/LnJlY2VpdmVyPy5pY29uO1xuICAgIH1cbiAgICByZXR1cm4gY2FsbC5pbml0aWF0b3I/LmF2YXRhciB8fCBjYWxsPy5pbml0aWF0b3I/Lmljb247XG4gIH1cbiAgZ2V0UmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKHRoaXMuY2FsbExvZ1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYWxsTG9nUmVxdWVzdEJ1aWxkZXI/LmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsTG9nUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgLnNldENhbGxDYXRlZ29yeShcImNhbGxcIilcbiAgICAgICAgLnNldEF1dGhUb2tlbih0aGlzLmF1dGhUb2tlbilcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0Q2FsbFR5cGVJY29uKGNhbGw6IGFueSkge1xuICAgIGNvbnN0IG1pc3NlZENhbGwgPSBDYWxsTG9nVXRpbHMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgY29uc3QgY2FsbFR5cGUgPSBjYWxsLmdldFR5cGUoKTtcbiAgICBsZXQgaWNvbjtcbiAgICBpZiAobWlzc2VkQ2FsbCkge1xuICAgICAgaWYgKGNhbGxUeXBlID09PSBDb21ldENoYXQuQ0FMTF9UWVBFLkFVRElPKSB7XG4gICAgICAgIGljb24gPSB0aGlzLm1pc3NlZEF1ZGlvQ2FsbEljb25Vcmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpY29uID0gdGhpcy5taXNzZWRWaWRlb0NhbGxJY29uVXJsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2FsbC5nZXRJbml0aWF0b3IoKS5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpKSB7XG4gICAgICBpZiAoY2FsbFR5cGUgPT09IENvbWV0Q2hhdC5DQUxMX1RZUEUuQVVESU8pIHtcbiAgICAgICAgaWNvbiA9IHRoaXMub3V0Z29pbmdBdWRpb0NhbGxJY29uVXJsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWNvbiA9IHRoaXMub3V0Z29pbmdWaWRlb0NhbGxJY29uVXJsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY2FsbFR5cGUgPT09IENvbWV0Q2hhdC5DQUxMX1RZUEUuQVVESU8pIHtcbiAgICAgICAgaWNvbiA9IHRoaXMuaW5jb21pbmdBdWRpb0NhbGxJY29uVXJsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWNvbiA9IHRoaXMuaW5jb21pbmdWaWRlb0NhbGxJY29uVXJsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaWNvbjtcbiAgfVxuXG4gIGNhbGxMb2dTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLmNhbGxMb2dzU3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMuY2FsbExvZ3NTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLmNhbGxMb2dzU3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNhbGxMb2dzU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG5cbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXREYXRlU3R5bGUoKTtcbiAgICB0aGlzLnNldENhbGxMb2dzU3R5bGUoKTtcbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS50aXRsZUZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy5jYWxsTG9nc1N0eWxlLnRpdGxlQ29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmNhbGxMb2dzU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmNhbGxMb2dzU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5kYXRlU2VwYXJhdG9yVGV4dENvbG9yLFxuXG4gICAgICBzZWN0aW9uSGVhZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUuZGF0ZVNlcGFyYXRvclRleHRDb2xvciB8fCBcInJnYmEoMjAsIDIwLCAyMCwgMC40NilcIixcbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmRhdGVTZXBhcmF0b3JUZXh0Rm9udCxcbiAgICB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuICBzZXREYXRlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogRGF0ZVN0eWxlID0gbmV3IERhdGVTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTdHlsZSB9O1xuICB9XG5cbiAgZ2V0TGlzdEl0ZW1TdHlsZShjYWxsOiBDb21ldENoYXQuQ2FsbCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiNDVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICAvLyB0aXRsZUNvbG9yOiB0aGlzLmlzTWlzc2VkQ2FsbChjYWxsLCB0aGlzLmxvZ2dlZEluVXNlciEpXG4gICAgICB0aXRsZUNvbG9yOiBDYWxsTG9nVXRpbHMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKClcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgcGFkZGluZzogXCIxMHB4XCIsXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICByZXR1cm4geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG5cbiAgc2V0Q2FsbExvZ3NTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDYWxsTG9nc1N0eWxlID0gbmV3IENhbGxMb2dzU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRhdGVTZXBhcmF0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkYXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1pc3NlZENhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgICAgIGluZm9JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBvdXRnb2luZ0NhbGxJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGluY29taW5nQ2FsbEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgY2FsbFN0YXR1c1RleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGNhbGxTdGF0dXNUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG5cbiAgICAgIGRhdGVTZXBhcmF0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgfSk7XG5cbiAgICB0aGlzLmNhbGxMb2dzU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jYWxsTG9nc1N0eWxlIH07XG4gIH1cbiAgc3VidGl0bGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmNhbGxTdGF0dXNUZXh0Rm9udCxcbiAgICAgIGNvbG9yOiB0aGlzLmNhbGxMb2dzU3R5bGUuY2FsbFN0YXR1c1RleHRDb2xvcixcbiAgICB9O1xuICB9O1xuXG4gIGluZm9CdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5pbmZvSWNvblRpbnQsXG4gICAgfTtcbiAgfTtcblxuICBnZXRDYWxsQnVpbGRlcigpOiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3MgfCB1bmRlZmluZWQge1xuICAgIGxldCBhdWRpb09ubHlDYWxsOiBib29sZWFuID1cbiAgICAgIHRoaXMuYWN0aXZlQ2FsbD8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICA/IHRydWVcbiAgICAgICAgOiBmYWxzZTtcbiAgICBjb25zdCBjYWxsU2V0dGluZ3MgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcbiAgICAgIC5lbmFibGVEZWZhdWx0TGF5b3V0KHRydWUpXG4gICAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGF1ZGlvT25seUNhbGwpXG4gICAgICAuc2V0Q2FsbExpc3RlbmVyKFxuICAgICAgICBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5PbmdvaW5nQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkNhbGxFbmRlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0Py5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZUNhbGxTY3JlZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2FsbEVuZEJ1dHRvblByZXNzZWQ6ICgpID0+IHtcbiAgICAgICAgICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG51bGwpO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdD8uZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0LmVuZENhbGwodGhpcy5zZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgLnRoZW4oKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENhbGxzLmVuZFNlc3Npb24oKTtcbiAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dChjYWxsKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgcmV0dXJuIGNhbGxTZXR0aW5ncztcbiAgfVxuXG4gIGNsb3NlQ2FsbFNjcmVlbigpIHtcbiAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gZmFsc2U7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBcIlwiO1xuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgb3Blbk9uZ29pbmdDYWxsU2NyZWVuKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gY2FsbDtcbiAgICB0aGlzLnNlc3Npb25JZCA9IGNhbGwuZ2V0U2Vzc2lvbklkKCk7XG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIHNldE9uZ29pbmdDYWxsU3R5bGUgPSAoKSA9PiB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZSA9IG5ldyBDYWxsc2NyZWVuU3R5bGUoe1xuICAgICAgbWF4SGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCIjMWMyMjI2XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiNDAwcHhcIixcbiAgICAgIG1pbldpZHRoOiBcIjQwMHB4XCIsXG4gICAgICBtaW5pbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgbWF4aW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH07XG4gIH07XG5cbiAgZ2V0RGlyZWN0aW9uSWNvblN0eWxlKGNhbGw6IGFueSkge1xuICAgIGxldCB0aW50O1xuICAgIGNvbnN0IG1pc3NlZENhbGwgPSBDYWxsTG9nVXRpbHMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgaWYgKG1pc3NlZENhbGwpIHtcbiAgICAgIHRpbnQgPVxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUubWlzc2VkQ2FsbEljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCk7XG4gICAgfSBlbHNlIGlmIChjYWxsLmdldEluaXRpYXRvcigpLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgIHRpbnQgPVxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUub3V0Z29pbmdDYWxsSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGludCA9XG4gICAgICAgIHRoaXMuY2FsbExvZ3NTdHlsZS5pbmNvbWluZ0NhbGxJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMThweFwiLFxuICAgICAgd2lkdGg6IFwiMThweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBpY29uVGludDogdGludCxcbiAgICB9O1xuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY2FsbC1sb2dzXCIgW25nU3R5bGVdPVwiY2FsbExvZ1N0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbaGlkZVNlYXJjaF09XCJ0cnVlXCIgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiXG4gICAgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJvblNjcm9sbGVkVG9Cb3R0b21cIiBbbGlzdF09XCJjYWxsc0xpc3RcIiBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCIgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCIgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCIgW3NlY3Rpb25IZWFkZXJGaWVsZF09XCJzZWN0aW9uSGVhZGVyRmllbGRcIlxuICAgIFtzaG93U2VjdGlvbkhlYWRlcl09XCJzaG93U2VjdGlvbkhlYWRlclwiIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiXG4gICAgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIiBbc3RhdGVdPVwic3RhdGVcIiBbZ2V0U2VjdGlvbkhlYWRlcl09XCJnZXRTZWN0aW9uSGVhZGVyIVwiPlxuICA8L2NvbWV0Y2hhdC1saXN0PlxuXG4gIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWNhbGw+XG5cbiAgICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbdGl0bGVdPVwiZ2V0Q2FsbGVyTmFtZShjYWxsKVwiIFthdmF0YXJVUkxdPVwiZ2V0QXZhdGFyVXJsKGNhbGwpXCJcbiAgICAgIFthdmF0YXJOYW1lXT1cImdldENhbGxlck5hbWUoY2FsbClcIiBbbGlzdEl0ZW1TdHlsZV09XCJnZXRMaXN0SXRlbVN0eWxlKGNhbGwpXCIgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIiAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkxpc3RJdGVtQ2xpY2tDYWxsKGNhbGwpXCJcbiAgICAgIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVDYWxsKGNhbGwpXCI+XG4gICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBjbGFzcz1cImNjLWNhbGwtbG9nc19fc3VidGl0bGUtdmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgZ3JvdXBTdWJ0aXRsZVwiPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2dyb3VwU3VidGl0bGU+XG4gICAgICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiIFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoKVwiIGNsYXNzPVwiY2MtY2FsbC1sb2dzX19zdWJ0aXRsZS12aWV3XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGxfX2ljb25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtaWNvbiBbaWNvblN0eWxlXT1cImdldERpcmVjdGlvbkljb25TdHlsZShjYWxsKVwiIFtVUkxdPVwiZ2V0Q2FsbFR5cGVJY29uKGNhbGwpXCI+PC9jb21ldGNoYXQtaWNvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY2FsbF9fdHlwZVwiPlxuICAgICAgICAgICAge3tnZXRTdWJ0aXRsZShjYWxsKX19XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1jYWxsLWxvZ3NfX3RhaWwtdmlld1wiICpuZ0lmPVwidGFpbFZpZXc7ZWxzZSBkZWZhdWx0VGFpbFZpZXdcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRUYWlsVmlldz5cbiAgICAgICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiBbbmdTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIiBjbGFzcz1cImNjLWNhbGwtbG9nc19fc3VidGl0bGUtdmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWlsX192aWV3XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY2FsbC1sb2dzX19kYXRlXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbZGF0ZVN0eWxlXT1cImRhdGVTdHlsZVwiIFt0aW1lc3RhbXBdPVwiY2FsbD8uaW5pdGlhdGVkQXRcIlxuICAgICAgICAgICAgICAgIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gKm5nSWY9XCJzaG93TW9yZUluZm9cIiBbaWNvblVSTF09XCJpbmZvSWNvblVybFwiIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiaW5mb0J1dHRvblN0eWxlKClcIiAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiaGFuZGxlSW5mb0NsaWNrKGNhbGwpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuXG5cbiAgICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG5cbiAgPC9uZy10ZW1wbGF0ZT5cblxuXG48L2Rpdj5cblxuPGNvbWV0Y2hhdC1vbmdvaW5nLWNhbGwgKm5nSWY9XCJzaG93T25nb2luZ0NhbGxcIiBbbWF4aW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5tYXhpbWl6ZUljb25VUkxcIlxuICBbbWluaW1pemVJY29uVVJMXT1cIm9uZ29pbmdDYWxsQ29uZmlndXJhdGlvbi5taW5pbWl6ZUljb25VUkxcIiBbc2Vzc2lvbklEXT1cInNlc3Npb25JZFwiXG4gIFtjYWxsU2V0dGluZ3NCdWlsZGVyXT1cImdldENhbGxCdWlsZGVyKCkhXCI+PC9jb21ldGNoYXQtb25nb2luZy1jYWxsPlxuXG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwic2hvd091dGdvaW5nQ2FsbHNjcmVlblwiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cblxuICA8Y29tZXRjaGF0LW91dGdvaW5nLWNhbGwgW2N1c3RvbVNvdW5kRm9yQ2FsbHNdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5jdXN0b21Tb3VuZEZvckNhbGxzXCJcbiAgICBbb25FcnJvcl09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtkaXNhYmxlU291bmRGb3JDYWxsc109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmRpc2FibGVTb3VuZEZvckNhbGxzXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiIFtjdXN0b21WaWV3XT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY3VzdG9tVmlld1wiXG4gICAgW2RlY2xpbmVCdXR0b25JY29uVVJMXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uZGVjbGluZUJ1dHRvbkljb25VUkxcIlxuICAgIFtvbkNsb3NlQ2xpY2tlZF09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm9uQ2xvc2VDbGlja2VkIHx8IGNhbmNlbE91dGdvaW5nQ2FsbFwiXG4gICAgW291dGdvaW5nQ2FsbFN0eWxlXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ub3V0Z29pbmdDYWxsU3R5bGUgfHwgb3V0Z29pbmdDYWxsU3R5bGVcIlxuICAgIFtjYWxsXT1cImNvbWV0Y2hhdENhbGxPYmplY3QhXCI+PC9jb21ldGNoYXQtb3V0Z29pbmctY2FsbD5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPiJdfQ==