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
                    CometChat.clearActiveCall();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NhbGxzL0NvbWV0Q2hhdENhbGxMb2dzL2NvbWV0Y2hhdC1jYWxsLWxvZ3MvY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEdBS04sTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFFTCx5QkFBeUIsRUFDekIscUJBQXFCLEVBRXJCLG1CQUFtQixFQUNuQix1QkFBdUIsRUFDdkIsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFDTCxXQUFXLEVBRVgsZUFBZSxFQUNmLFNBQVMsRUFDVCxhQUFhLEdBQ2QsTUFBTSwyQkFBMkIsQ0FBQztBQUVuQyxPQUFPLEVBQ0wsUUFBUSxFQUNSLHVCQUF1QixFQUN2QixVQUFVLEVBQ1YsWUFBWSxFQUNaLG1CQUFtQixFQUNuQixjQUFjLEVBQ2QsTUFBTSxHQUNQLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG9DQUFvQyxDQUFDOzs7Ozs7O0FBUWxFLE1BQU0sT0FBTywwQkFBMEI7SUF3R3JDLFlBQ1UsVUFBc0IsRUFDdEIsR0FBc0IsRUFDdEIsWUFBbUM7UUFGbkMsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUN0QixRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUN0QixpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUExR3BDLFVBQUssR0FBVyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsbUJBQWMsR0FBbUIsY0FBYyxDQUFDLElBQUksQ0FBQztRQU9yRCxtQkFBYyxHQUFXLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BELG1CQUFjLEdBQVcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFHckQsbUJBQWMsR0FBVyxvQkFBb0IsQ0FBQztRQUM5QyxnQkFBVyxHQUFXLHFCQUFxQixDQUFDO1FBQzVDLDJCQUFzQixHQUFXLG1DQUFtQyxDQUFDO1FBQ3JFLDJCQUFzQixHQUFXLG1DQUFtQyxDQUFDO1FBQ3JFLDZCQUF3QixHQUMvQixxQ0FBcUMsQ0FBQztRQUMvQiw2QkFBd0IsR0FDL0IscUNBQXFDLENBQUM7UUFDL0IsNkJBQXdCLEdBQy9CLHFDQUFxQyxDQUFDO1FBQy9CLDZCQUF3QixHQUMvQixxQ0FBcUMsQ0FBQztRQU0vQixZQUFPLEdBQWtELENBQ2hFLEtBQW1DLEVBQ25DLEVBQUU7WUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JCLENBQUMsQ0FBQztRQUdPLGdCQUFXLEdBQWlCLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDOUMseUJBQW9CLEdBQWlCLFlBQVksQ0FBQyxPQUFPLENBQUM7UUFFMUQsa0JBQWEsR0FBa0I7WUFDdEMsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtTQUNmLENBQUM7UUFFTyxnQkFBVyxHQUFnQjtZQUNsQyxZQUFZLEVBQUUsTUFBTTtZQUNwQixLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxNQUFNO1NBQ2YsQ0FBQztRQUNPLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBRS9CLHVCQUFrQixHQUFjO1lBQ3ZDLE1BQU0sRUFBRSxFQUFFO1lBQ1YsS0FBSyxFQUFFLEVBQUU7U0FDVixDQUFDO1FBRU8sOEJBQXlCLEdBQ2hDLElBQUkseUJBQXlCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFM0IsY0FBUyxHQUFZLEtBQUssQ0FBQztRQUUzQixzQkFBaUIsR0FBWSxJQUFJLENBQUM7UUFDbEMsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDOUIsdUJBQWtCLEdBQVEsYUFBYSxDQUFDO1FBRXhDLGtCQUFhLEdBQWtCLEVBQUUsQ0FBQztRQUVsQyxjQUFTLEdBQWMsRUFBRSxDQUFDO1FBRTFCLGtCQUFhLEdBQWtCLEVBQUUsQ0FBQztRQUNsQyw2QkFBd0IsR0FDL0IsSUFBSSx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUkzQixVQUFLLEdBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUN0QyxjQUFTLEdBQWMsRUFBRSxDQUFDO1FBRTFCLGNBQVMsR0FBVyxFQUFFLENBQUM7UUFDaEIsdUJBQWtCLEdBQVcsaUJBQWlCLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU3RSxxQkFBZ0IsR0FBb0IsRUFBRSxDQUFDO1FBRXZDLG9CQUFlLEdBQVksS0FBSyxDQUFDO1FBRTFCLFVBQUssR0FBVyxFQUFFLENBQUM7UUFDbkIsY0FBUyxHQUFRLEVBQUUsQ0FBQztRQUNwQixvQkFBZSxHQUFXLFlBQVksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzlELGlCQUFZLEdBQTBCLElBQUksQ0FBQztRQUMzQyxjQUFTLEdBQVcsRUFBRSxDQUFDO1FBQzlCLDJCQUFzQixHQUFZLEtBQUssQ0FBQztRQUN4Qyx1QkFBa0IsR0FBUSxJQUFJLENBQUM7UUFFL0Isc0JBQWlCLEdBQXNCO1lBQ3JDLEtBQUssRUFBRSxPQUFPO1lBQ2QsTUFBTSxFQUFFLE9BQU87WUFDZixhQUFhLEVBQUUsZ0JBQWdCO1lBQy9CLGNBQWMsRUFBRSxpQkFBaUI7WUFDakMsZ0JBQWdCLEVBQUUsZ0JBQWdCO1lBQ2xDLGlCQUFpQixFQUFFLHdCQUF3QjtZQUMzQyxZQUFZLEVBQUUsS0FBSztTQUNwQixDQUFDO1FBMEVGLDBCQUFxQixHQUFHLEdBQUcsRUFBRTtZQUMzQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQy9CLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxZQUFhLENBQUMsU0FBUyxFQUFFO2lCQUMzQixJQUFJLENBQUMsQ0FBQyxRQUFhLEVBQUUsRUFBRTtnQkFDdEIsSUFBSSxRQUFRLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDeEIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztvQkFDckQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDMUI7Z0JBQ0QsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQ3ZELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztvQkFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDMUI7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO29CQUUzQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUM7b0JBRWxELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO3dCQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7cUJBQzFCO29CQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7aUJBQzFCO1lBQ0gsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxDQUFDLEtBQW1DLEVBQUUsRUFBRTtnQkFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUVwQixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7aUJBQzFCO2dCQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQztRQUtGLG9CQUFlLEdBQUcsQ0FBQyxJQUFTLEVBQUUsRUFBRTtZQUM5QixJQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDO1lBQzFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFekIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3hCO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsa0JBQWEsR0FBRyxDQUFDLElBQVMsRUFBRSxFQUFFO1lBQzVCLElBQ0UsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLFNBQVM7Z0JBQ2pDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsWUFBWSxFQUFFLEVBQzFFO2dCQUNBLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU07Z0JBQ0wsT0FBTyxLQUFLLENBQUM7YUFDZDtRQUNILENBQUMsQ0FBQztRQUVGLHFCQUFnQixHQUFHLENBQUMsSUFBUyxFQUFFLEtBQVUsRUFBRSxFQUFFO1lBQzNDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtnQkFDOUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3pDO1lBRUQsSUFDRSxJQUFJLENBQUMsU0FBUztnQkFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUN6QixLQUFLLEdBQUcsQ0FBQztnQkFDVCxZQUFZLENBQUMsZUFBZSxDQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FDckMsRUFDRDtnQkFDQSxPQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzthQUM5QjtRQUNILENBQUMsQ0FBQztRQUVGLHdCQUFtQixHQUFHLENBQUMsSUFBUyxFQUFFLEVBQUU7WUFDbEMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUN4QyxJQUFJLFFBQVEsR0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFDO1lBQzFCLElBQUksWUFBWSxHQUFHLElBQUksRUFBRSxZQUFZLENBQUM7WUFFdEMsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxLQUFLLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDbEUsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLENBQUM7YUFDdEM7aUJBQU07Z0JBQ0wsVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxHQUFHLENBQUM7YUFDdkM7WUFFRCxJQUFJLFlBQVksR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUUxRSxJQUFJLFlBQVksSUFBSSxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRTtnQkFDaEQsU0FBUyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUM7cUJBQ2pDLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFFO29CQUNyQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDO29CQUN4QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO29CQUVuQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUMzQixDQUFDLENBQUM7cUJBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7b0JBQ2YsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO3dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUNyQjtnQkFDSCxDQUFDLENBQUMsQ0FBQzthQUNOO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsdUJBQWtCLEdBQUcsR0FBRyxFQUFFO1lBQ3hCLHFCQUFxQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzlCLFNBQVMsQ0FBQyxVQUFVLENBQ2xCLElBQUksQ0FBQyxtQkFBb0IsQ0FBQyxZQUFZLEVBQUUsRUFDeEMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDeEM7aUJBQ0UsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztnQkFDcEMsbUJBQW1CLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMzQixDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2YsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNyQjtZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0wsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztZQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQztRQW9ERixpQkFBWSxHQUFHLEdBQUcsRUFBRTtZQUNsQixPQUFPO2dCQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQ2pDLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUs7Z0JBQy9CLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVU7Z0JBQ3pDLE1BQU0sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQ2pDLFlBQVksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVk7YUFDOUMsQ0FBQztRQUNKLENBQUMsQ0FBQztRQWdHRixrQkFBYSxHQUFHLEdBQUcsRUFBRTtZQUNuQixPQUFPO2dCQUNMLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQjtnQkFDM0MsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CO2FBQzlDLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRixvQkFBZSxHQUFHLEdBQUcsRUFBRTtZQUNyQixPQUFPO2dCQUNMLE1BQU0sRUFBRSxNQUFNO2dCQUNkLEtBQUssRUFBRSxNQUFNO2dCQUNiLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFlBQVksRUFBRSxHQUFHO2dCQUNqQixVQUFVLEVBQUUsYUFBYTtnQkFDekIsY0FBYyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWTthQUNoRCxDQUFDO1FBQ0osQ0FBQyxDQUFDO1FBMEVGLHdCQUFtQixHQUFHLEdBQUcsRUFBRTtZQUN6QixJQUFJLFlBQVksR0FBRyxJQUFJLGVBQWUsQ0FBQztnQkFDckMsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxZQUFZLEVBQUUsR0FBRztnQkFDakIsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLFNBQVMsRUFBRSxPQUFPO2dCQUNsQixRQUFRLEVBQUUsT0FBTztnQkFDakIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDaEUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTthQUNqRSxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hFLENBQUMsQ0FBQztRQXJjQSxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7SUFDOUIsQ0FBQztJQUVELFFBQVE7UUFDTixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLFNBQVMsQ0FBQyxlQUFlLEVBQUU7YUFDeEIsSUFBSSxDQUFDLENBQUMsSUFBMkIsRUFBRSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQWEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQy9CLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLEtBQW1DLEVBQUUsRUFBRTtZQUM3QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDckI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxlQUFlO1FBQ2IsU0FBUyxDQUFDLGVBQWUsQ0FDdkIsSUFBSSxDQUFDLGtCQUFrQixFQUN2QixJQUFJLFNBQVMsQ0FBQyxZQUFZLENBQUM7WUFDekIsc0JBQXNCLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUNELHVCQUF1QixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO2dCQUNoRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO2dCQUVoQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFDRCxzQkFBc0IsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtnQkFDL0MsSUFBSSxJQUFJLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRTtvQkFDOUYsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztvQkFDaEMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztvQkFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDMUI7WUFFSCxDQUFDO1lBQ0Qsc0JBQXNCLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7Z0JBQy9DLElBQUksSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQzlGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDbEM7WUFFSCxDQUFDO1lBQ0QsMEJBQTBCLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0IsQ0FBQztTQUNGLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUN6QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFFdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBRUQsY0FBYztRQUNaLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBd0NELFdBQVcsQ0FBQyxJQUFTO1FBQ25CLE9BQU8sWUFBWSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBYSxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQXlGRCxhQUFhLENBQUMsSUFBUztRQUNyQixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFLFlBQVksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ2xFLE9BQU8sSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDO1NBQ3ZDO1FBQ0QsT0FBTyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUNELFlBQVksQ0FBQyxJQUFTO1FBQ3BCLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsS0FBSyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbEUsT0FBTyxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQztTQUN2RDtRQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLElBQUksSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUM7SUFDekQsQ0FBQztJQUNELGlCQUFpQjtRQUNmLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFO1lBQzlCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDO1NBQzVDO2FBQU07WUFDTCxPQUFPLElBQUksbUJBQW1CLENBQUMscUJBQXFCLEVBQUU7aUJBQ25ELFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2lCQUNwQixlQUFlLENBQUMsTUFBTSxDQUFDO2lCQUN2QixZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztpQkFDNUIsS0FBSyxFQUFFLENBQUM7U0FDWjtJQUNILENBQUM7SUFFRCxlQUFlLENBQUMsSUFBUztRQUN2QixNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBYSxDQUFDLENBQUM7UUFDdkUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLElBQUksSUFBSSxDQUFDO1FBQ1QsSUFBSSxVQUFVLEVBQUU7WUFDZCxJQUFJLFFBQVEsS0FBSyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtnQkFDMUMsSUFBSSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQzthQUNwQztpQkFBTTtnQkFDTCxJQUFJLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDO2FBQ3BDO1NBQ0Y7YUFBTSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsWUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3ZFLElBQUksUUFBUSxLQUFLLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO2dCQUMxQyxJQUFJLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDO2FBQ3RDO2lCQUFNO2dCQUNMLElBQUksR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUM7YUFDdEM7U0FDRjthQUFNO1lBQ0wsSUFBSSxRQUFRLEtBQUssU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7Z0JBQzFDLElBQUksR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUM7YUFDdEM7aUJBQU07Z0JBQ0wsSUFBSSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQzthQUN0QztTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBWUQsYUFBYTtRQUNYLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRztZQUNmLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7WUFDM0MsY0FBYyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVTtZQUM3QyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQjtZQUN6RCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQjtZQUMzRCxrQkFBa0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQjtZQUN6RCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQjtZQUMzRCxlQUFlLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlO1lBQ25ELGNBQWMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLHNCQUFzQjtZQUV6RCxzQkFBc0IsRUFDcEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsSUFBSSx3QkFBd0I7WUFDdkUscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUI7U0FDaEUsQ0FBQztJQUNKLENBQUM7SUFDRCxjQUFjO1FBQ1osSUFBSSxZQUFZLEdBQWdCLElBQUksV0FBVyxDQUFDO1lBQzlDLFlBQVksRUFBRSxNQUFNO1lBQ3BCLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQy9ELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzdELGNBQWMsRUFBRSxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUV0RSxzQkFBc0IsRUFBRSxFQUFFO1NBQzNCLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0lBQ0QsWUFBWTtRQUNWLElBQUksWUFBWSxHQUFjLElBQUksU0FBUyxDQUFDO1lBQzFDLFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztZQUNqRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUN6RCxVQUFVLEVBQUUsYUFBYTtTQUMxQixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDMUQsQ0FBQztJQUVELGdCQUFnQixDQUFDLElBQW9CO1FBQ25DLElBQUksWUFBWSxHQUFrQixJQUFJLGFBQWEsQ0FBQztZQUNsRCxNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDM0QsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNoRSxZQUFZLEVBQUUsR0FBRztZQUNqQixTQUFTLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDaEUsMERBQTBEO1lBQzFELFVBQVUsRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBYSxDQUFDO2dCQUM3RCxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtnQkFDNUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDL0MsTUFBTSxFQUFFLE1BQU07WUFDZCxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM5RCxPQUFPLEVBQUUsTUFBTTtZQUNmLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO1NBQy9ELENBQUMsQ0FBQztRQUNILE9BQU8sRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNwRCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ2QsSUFBSSxZQUFZLEdBQWtCLElBQUksYUFBYSxDQUFDO1lBQ2xELFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQzNELE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwRSxTQUFTLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDaEUsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDdkQsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDekUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNuRSxrQkFBa0IsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUN6RSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ25FLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQy9ELHNCQUFzQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDdEUsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDN0QsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ3RFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDbEUsWUFBWSxFQUFFLEVBQUU7WUFDaEIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDMUQsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNwRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ3BFLGtCQUFrQixFQUFFLFVBQVUsQ0FDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDN0M7WUFDRCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBRW5FLHFCQUFxQixFQUFFLFVBQVUsQ0FDL0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDN0M7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDbEUsQ0FBQztJQW1CRCxjQUFjO1FBQ1osSUFBSSxhQUFhLEdBQ2YsSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsS0FBSztZQUN0RSxDQUFDLENBQUMsSUFBSTtZQUNOLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDWixNQUFNLFlBQVksR0FBRyxJQUFJLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFO2FBQy9ELG1CQUFtQixDQUFDLElBQUksQ0FBQzthQUN6QixrQkFBa0IsQ0FBQyxhQUFhLENBQUM7YUFDakMsZUFBZSxDQUNkLElBQUksbUJBQW1CLENBQUMsbUJBQW1CLENBQUM7WUFDMUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtnQkFDaEIsWUFBWSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVyRSxJQUNFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxlQUFlLEVBQUU7b0JBQzNDLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLElBQUksRUFDaEQ7b0JBQ0EsbUJBQW1CLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2pDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2lCQUN4QjtZQUNILENBQUM7WUFDRCxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7Z0JBQzNCLFlBQVksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFckUsSUFDRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsZUFBZSxFQUFFO29CQUMzQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQ2hEO29CQUNBLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQzt5QkFDOUIsSUFBSSxDQUFDLENBQUMsSUFBb0IsRUFBRSxFQUFFO3dCQUM3QixtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDakMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDM0MsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUN6QixDQUFDLENBQUM7eUJBQ0QsS0FBSyxDQUFDLENBQUMsR0FBaUMsRUFBRSxFQUFFO3dCQUMzQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7NEJBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQ25CO29CQUNILENBQUMsQ0FBQyxDQUFDO2lCQUNOO3FCQUFNO29CQUNMLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztpQkFDeEI7WUFDSCxDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUMsS0FBbUMsRUFBRSxFQUFFO2dCQUMvQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3JCO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FDSDthQUNBLEtBQUssRUFBRSxDQUFDO1FBQ1gsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUVELGVBQWU7UUFDYixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFDcEMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRCxxQkFBcUIsQ0FBQyxJQUFvQjtRQUN4QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7UUFDaEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDNUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBaUJELHFCQUFxQixDQUFDLElBQVM7UUFDN0IsSUFBSSxJQUFJLENBQUM7UUFDVCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBYSxDQUFDLENBQUM7UUFDdkUsSUFBSSxVQUFVLEVBQUU7WUFDZCxJQUFJO2dCQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsa0JBQWtCO29CQUNyQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDbEQ7YUFBTSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3ZFLElBQUk7Z0JBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0I7b0JBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztTQUNsRDthQUFNO1lBQ0wsSUFBSTtnQkFDRixJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFvQjtvQkFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO1NBQ2xEO1FBRUQsT0FBTztZQUNMLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxHQUFHO1lBQ2pCLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLFFBQVEsRUFBRSxJQUFJO1NBQ2YsQ0FBQztJQUNKLENBQUM7O3dIQTdrQlUsMEJBQTBCOzRHQUExQiwwQkFBMEIsaStDQ2hEdkMsbzJIQXlFcUI7NEZEekJSLDBCQUEwQjtrQkFOdEMsU0FBUzsrQkFDRSxxQkFBcUIsbUJBR2QsdUJBQXVCLENBQUMsTUFBTTtxS0FHdEMsS0FBSztzQkFBYixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLFFBQVE7c0JBQWhCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUVHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFFRyx3QkFBd0I7c0JBQWhDLEtBQUs7Z0JBRUcsd0JBQXdCO3NCQUFoQyxLQUFLO2dCQUVHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFHRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBTUcsVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFFRyxhQUFhO3NCQUFyQixLQUFLO2dCQUtHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBS0csYUFBYTtzQkFBckIsS0FBSztnQkFFRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBS0cseUJBQXlCO3NCQUFqQyxLQUFLO2dCQUdHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBRUcsaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csa0JBQWtCO3NCQUExQixLQUFLO2dCQUVHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBRUcsU0FBUztzQkFBakIsS0FBSztnQkFFRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuXG5pbXBvcnQge1xuICBMaXN0U3R5bGUsXG4gIE91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24sXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbiAgT3V0Z29pbmdDYWxsU3R5bGUsXG4gIENvbWV0Q2hhdFVJS2l0Q2FsbHMsXG4gIENhbGxTY3JlZW5Db25maWd1cmF0aW9uLFxuICBDYWxsTG9nc1N0eWxlLFxuICBTdG9yYWdlVXRpbHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIENhbGxzY3JlZW5TdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIGxvY2FsaXplLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgZm9udEhlbHBlcixcbiAgRGF0ZVBhdHRlcm5zLFxuICBDb21ldENoYXRDYWxsRXZlbnRzLFxuICBUaXRsZUFsaWdubWVudCxcbiAgU3RhdGVzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7IENhbGxMb2dVdGlscyB9IGZyb20gXCIuLi8uLi8uLi9TaGFyZWQvVXRpbHMvQ2FsbExvZ1V0aWxzXCI7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY2FsbC1sb2dzXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWNhbGwtbG9ncy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Y2hhdENhbGxMb2dzQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FMTFNcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmxlZnQ7XG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IGFueTtcbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogYW55O1xuICBASW5wdXQoKSB0YWlsVmlldyE6IGFueTtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19DQUxMU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcblxuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgaW5mb0ljb25Vcmw6IHN0cmluZyA9IFwiYXNzZXRzL0luZm9JY29uLnN2Z1wiO1xuICBASW5wdXQoKSBtaXNzZWRBdWRpb0NhbGxJY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9taXNzZWRBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBtaXNzZWRWaWRlb0NhbGxJY29uVXJsOiBzdHJpbmcgPSBcImFzc2V0cy9taXNzZWRWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBvdXRnb2luZ0F1ZGlvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvb3V0Z29pbmdBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBvdXRnb2luZ1ZpZGVvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvb3V0Z29pbmdWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBpbmNvbWluZ0F1ZGlvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvaW5jb21pbmdBdWRpb0NhbGxJY29uVXJsLnN2Z1wiO1xuICBASW5wdXQoKSBpbmNvbWluZ1ZpZGVvQ2FsbEljb25Vcmw6IHN0cmluZyA9XG4gICAgXCJhc3NldHMvaW5jb21pbmdWaWRlb0NhbGxJY29uVXJsLnN2Z1wiO1xuXG4gIEBJbnB1dCgpIGNhbGxMb2dSZXF1ZXN0QnVpbGRlciE6IGFueTtcbiAgQElucHV0KCkgY29tZXRjaGF0Q2FsbE9iamVjdCE6IENvbWV0Q2hhdC5DYWxsIHwgbnVsbDtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAoY2FsbDogYW55KSA9PiB2b2lkO1xuICBASW5wdXQoKSBvbkluZm9DbGljayE6IChjYWxsOiBhbnkpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG5cbiAgQElucHV0KCkgYWN0aXZlQ2FsbCE6IGFueTtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy50aW1lO1xuICBASW5wdXQoKSBEYXRlU2VwYXJhdG9yUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGU7XG5cbiAgQElucHV0KCkgY2FsbExvZ3NTdHlsZTogQ2FsbExvZ3NTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgfTtcblxuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIzMnB4XCIsXG4gICAgaGVpZ2h0OiBcIjMycHhcIixcbiAgfTtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIEBJbnB1dCgpIGRhdGVTZXBhcmF0b3JTdHlsZTogRGF0ZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCJcIixcbiAgICB3aWR0aDogXCJcIixcbiAgfTtcblxuICBASW5wdXQoKSBvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uOiBPdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uID1cbiAgICBuZXcgT3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbih7fSk7XG5cbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG5cbiAgQElucHV0KCkgc2hvd1NlY3Rpb25IZWFkZXI6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBzaG93TW9yZUluZm86IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VjdGlvbkhlYWRlckZpZWxkOiBhbnkgPSBcImluaXRpYXRlZEF0XCI7XG5cbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHt9O1xuXG4gIEBJbnB1dCgpIGRhdGVTdHlsZTogRGF0ZVN0eWxlID0ge307XG5cbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHt9O1xuICBASW5wdXQoKSBvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb246IENhbGxTY3JlZW5Db25maWd1cmF0aW9uID1cbiAgICBuZXcgQ2FsbFNjcmVlbkNvbmZpZ3VyYXRpb24oe30pO1xuXG4gIHB1YmxpYyBzZWxlY3RlZE9yQWN0aXZlQ2FsbExvZ09iamVjdCE6IGFueTtcbiAgY2FsbHNSZXF1ZXN0ITogYW55O1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IHt9O1xuXG4gIHNlc3Npb25JZDogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIGNhbGxMb2dzTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjYWxsbG9nc2NhbGxpbmdcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9O1xuXG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyBjYWxsc0xpc3Q6IGFueSA9IFtdO1xuICBwdWJsaWMgY2FsbHNMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNhbGxzTGlzdF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgYXV0aFRva2VuOiBzdHJpbmcgPSBcIlwiO1xuICBzaG93T3V0Z29pbmdDYWxsc2NyZWVuOiBib29sZWFuID0gZmFsc2U7XG4gIG9uU2Nyb2xsZWRUb0JvdHRvbTogYW55ID0gbnVsbDtcblxuICBvdXRnb2luZ0NhbGxTdHlsZTogT3V0Z29pbmdDYWxsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzYwcHhcIixcbiAgICBoZWlnaHQ6IFwiNTgxcHhcIixcbiAgICB0aXRsZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gICAgdGl0bGVUZXh0Q29sb3I6IFwiUkdCKDIwLCAyMCwgMjApXCIsXG4gICAgc3VidGl0bGVUZXh0Rm9udDogXCI0MDAgMTVweCBJbnRlclwiLFxuICAgIHN1YnRpdGxlVGV4dENvbG9yOiBcIlJHQkEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKCk7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgICAgdGhpcy5hdXRoVG9rZW4gPSB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0QXV0aFRva2VuKCk7XG4gICAgICAgIHRoaXMuY2FsbHNSZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICB0aGlzLmZldGNoTmV4dENhbGxMb2dzTGlzdCgpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgYXR0YWNoTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDYWxsTGlzdGVuZXIoXG4gICAgICB0aGlzLmNhbGxMb2dzTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gY2FsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuXG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ICYmIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdC5nZXRTZXNzaW9uSWQoKSA9PSBjYWxsLmdldFNlc3Npb25JZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgJiYgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0LmdldFNlc3Npb25JZCgpID09IGNhbGwuZ2V0U2Vzc2lvbklkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IGNhbGw7XG4gICAgICAgICAgICB0aGlzLm9wZW5PbmdvaW5nQ2FsbFNjcmVlbihjYWxsKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSxcbiAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5jYWxsc1JlcXVlc3QgPSBudWxsO1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoKTtcblxuICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMb2dzTGlzdGVuZXJJZCk7XG4gIH1cblxuICBmZXRjaE5leHRDYWxsTG9nc0xpc3QgPSAoKSA9PiB7XG4gICAgdGhpcy5vblNjcm9sbGVkVG9Cb3R0b20gPSBudWxsO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgdGhpcy5jYWxsc1JlcXVlc3QhLmZldGNoTmV4dCgpXG4gICAgICAudGhlbigoY2FsbExpc3Q6IGFueSkgPT4ge1xuICAgICAgICBpZiAoY2FsbExpc3Q/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLm9uU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMuZmV0Y2hOZXh0Q2FsbExvZ3NMaXN0O1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbExpc3QubGVuZ3RoIDw9IDAgJiYgdGhpcy5jYWxsc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG5cbiAgICAgICAgICB0aGlzLmNhbGxzTGlzdCA9IFsuLi50aGlzLmNhbGxzTGlzdCwgLi4uY2FsbExpc3RdO1xuXG4gICAgICAgICAgaWYgKHRoaXMuY2FsbHNMaXN0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG5cbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gIGdldFN1YnRpdGxlKGNhbGw6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIENhbGxMb2dVdGlscy5nZXRDYWxsU3RhdHVzV2l0aFR5cGUoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgfVxuICBoYW5kbGVJbmZvQ2xpY2sgPSAoY2FsbDogYW55KSA9PiB7XG4gICAgdGhpcy5zZWxlY3RlZE9yQWN0aXZlQ2FsbExvZ09iamVjdCA9IGNhbGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgaWYgKHRoaXMub25JbmZvQ2xpY2spIHtcbiAgICAgIHRoaXMub25JbmZvQ2xpY2soY2FsbCk7XG4gICAgfVxuICB9O1xuXG4gIGdldEFjdGl2ZUNhbGwgPSAoY2FsbDogYW55KSA9PiB7XG4gICAgaWYgKFxuICAgICAgY2FsbC5nZXRTZXNzaW9uSUQoKSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBjYWxsLmdldFNlc3Npb25JRCgpID09PSB0aGlzLnNlbGVjdGVkT3JBY3RpdmVDYWxsTG9nT2JqZWN0Py5nZXRTZXNzaW9uSUQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgZ2V0U2VjdGlvbkhlYWRlciA9IChjYWxsOiBhbnksIGluZGV4OiBhbnkpID0+IHtcbiAgICBpZiAodGhpcy5jYWxsc0xpc3QgJiYgdGhpcy5jYWxsc0xpc3QubGVuZ3RoID4gMCAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FsbHNMaXN0WzBdW1wiaW5pdGlhdGVkQXRcIl07XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5jYWxsc0xpc3QgJiZcbiAgICAgIHRoaXMuY2FsbHNMaXN0Lmxlbmd0aCA+IDAgJiZcbiAgICAgIGluZGV4ID4gMCAmJlxuICAgICAgQ2FsbExvZ1V0aWxzLmlzRGF0ZURpZmZlcmVudChcbiAgICAgICAgdGhpcy5jYWxsc0xpc3RbaW5kZXggLSAxXVtcImluaXRpYXRlZEF0XCJdLFxuICAgICAgICB0aGlzLmNhbGxzTGlzdFtpbmRleF1bXCJpbml0aWF0ZWRBdFwiXVxuICAgICAgKVxuICAgICkge1xuICAgICAgcmV0dXJuIGNhbGwuZ2V0SW5pdGlhdGVkQXQoKTtcbiAgICB9XG4gIH07XG5cbiAgb25MaXN0SXRlbUNsaWNrQ2FsbCA9IChjYWxsOiBhbnkpID0+IHtcbiAgICBsZXQgcmVjZWl2ZXJJRCA9IGNhbGwuZ2V0UmVjZWl2ZXIoKS51aWQ7XG4gICAgbGV0IGNhbGxUeXBlID0gY2FsbD8udHlwZTtcbiAgICBsZXQgcmVjZWl2ZXJUeXBlID0gY2FsbD8ucmVjZWl2ZXJUeXBlO1xuXG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gY2FsbD8uZ2V0SW5pdGlhdG9yKCk/LmdldFVpZCgpKSB7XG4gICAgICByZWNlaXZlcklEID0gY2FsbC5nZXRSZWNlaXZlcigpPy51aWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlY2VpdmVySUQgPSBjYWxsLmdldEluaXRpYXRvcigpPy51aWQ7XG4gICAgfVxuXG4gICAgbGV0IGxvY2FsQ2FsbE9iaiA9IG5ldyBDb21ldENoYXQuQ2FsbChyZWNlaXZlcklELCBjYWxsVHlwZSwgcmVjZWl2ZXJUeXBlKTtcblxuICAgIGlmIChyZWNlaXZlclR5cGUgPT0gQ29tZXRDaGF0LlJFQ0VJVkVSX1RZUEUuVVNFUikge1xuICAgICAgQ29tZXRDaGF0LmluaXRpYXRlQ2FsbChsb2NhbENhbGxPYmopXG4gICAgICAgIC50aGVuKChvdXRHb2luZ0NhbGwpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBvdXRHb2luZ0NhbGw7XG4gICAgICAgICAgdGhpcy5zaG93T3V0Z29pbmdDYWxsc2NyZWVuID0gdHJ1ZTtcblxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY2FuY2VsT3V0Z29pbmdDYWxsID0gKCkgPT4ge1xuICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wYXVzZSgpO1xuICAgIENvbWV0Q2hhdC5yZWplY3RDYWxsKFxuICAgICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0IS5nZXRTZXNzaW9uSWQoKSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmNhbmNlbGxlZFxuICAgIClcbiAgICAgIC50aGVuKChjYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLm5leHQoY2FsbCk7XG4gICAgICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgZ2V0Q2FsbGVyTmFtZShjYWxsOiBhbnkpIHtcbiAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBjYWxsPy5nZXRJbml0aWF0b3IoKT8uZ2V0VWlkKCkpIHtcbiAgICAgIHJldHVybiBjYWxsPy5nZXRSZWNlaXZlcigpPy5nZXROYW1lKCk7XG4gICAgfVxuICAgIHJldHVybiBjYWxsLmdldEluaXRpYXRvcigpPy5nZXROYW1lKCk7XG4gIH1cbiAgZ2V0QXZhdGFyVXJsKGNhbGw6IGFueSkge1xuICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGNhbGw/LmdldEluaXRpYXRvcigpPy5nZXRVaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGw/LnJlY2VpdmVyPy5hdmF0YXIgfHwgY2FsbD8ucmVjZWl2ZXI/Lmljb247XG4gICAgfVxuICAgIHJldHVybiBjYWxsLmluaXRpYXRvcj8uYXZhdGFyIHx8IGNhbGw/LmluaXRpYXRvcj8uaWNvbjtcbiAgfVxuICBnZXRSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAodGhpcy5jYWxsTG9nUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbGxMb2dSZXF1ZXN0QnVpbGRlcj8uYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxMb2dSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAuc2V0Q2FsbENhdGVnb3J5KFwiY2FsbFwiKVxuICAgICAgICAuc2V0QXV0aFRva2VuKHRoaXMuYXV0aFRva2VuKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICB9XG4gIH1cblxuICBnZXRDYWxsVHlwZUljb24oY2FsbDogYW55KSB7XG4gICAgY29uc3QgbWlzc2VkQ2FsbCA9IENhbGxMb2dVdGlscy5pc01pc3NlZENhbGwoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgICBjb25zdCBjYWxsVHlwZSA9IGNhbGwuZ2V0VHlwZSgpO1xuICAgIGxldCBpY29uO1xuICAgIGlmIChtaXNzZWRDYWxsKSB7XG4gICAgICBpZiAoY2FsbFR5cGUgPT09IENvbWV0Q2hhdC5DQUxMX1RZUEUuQVVESU8pIHtcbiAgICAgICAgaWNvbiA9IHRoaXMubWlzc2VkQXVkaW9DYWxsSWNvblVybDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGljb24gPSB0aGlzLm1pc3NlZFZpZGVvQ2FsbEljb25Vcmw7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjYWxsLmdldEluaXRpYXRvcigpLmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkpIHtcbiAgICAgIGlmIChjYWxsVHlwZSA9PT0gQ29tZXRDaGF0LkNBTExfVFlQRS5BVURJTykge1xuICAgICAgICBpY29uID0gdGhpcy5vdXRnb2luZ0F1ZGlvQ2FsbEljb25Vcmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpY29uID0gdGhpcy5vdXRnb2luZ1ZpZGVvQ2FsbEljb25Vcmw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjYWxsVHlwZSA9PT0gQ29tZXRDaGF0LkNBTExfVFlQRS5BVURJTykge1xuICAgICAgICBpY29uID0gdGhpcy5pbmNvbWluZ0F1ZGlvQ2FsbEljb25Vcmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpY29uID0gdGhpcy5pbmNvbWluZ1ZpZGVvQ2FsbEljb25Vcmw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpY29uO1xuICB9XG5cbiAgY2FsbExvZ1N0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5jYWxsTG9nc1N0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5jYWxsTG9nc1N0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMuY2FsbExvZ3NTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY2FsbExvZ3NTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcblxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc2V0Q2FsbExvZ3NTdHlsZSgpO1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLnRpdGxlRm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLmNhbGxMb2dzU3R5bGUudGl0bGVDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5jYWxsTG9nc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmNhbGxMb2dzU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5jYWxsTG9nc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMuY2FsbExvZ3NTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5jYWxsTG9nc1N0eWxlLmRhdGVTZXBhcmF0b3JUZXh0Q29sb3IsXG5cbiAgICAgIHNlY3Rpb25IZWFkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuY2FsbExvZ3NTdHlsZS5kYXRlU2VwYXJhdG9yVGV4dENvbG9yIHx8IFwicmdiYSgyMCwgMjAsIDIwLCAwLjQ2KVwiLFxuICAgICAgc2VjdGlvbkhlYWRlclRleHRGb250OiB0aGlzLmNhbGxMb2dzU3R5bGUuZGF0ZVNlcGFyYXRvclRleHRGb250LFxuICAgIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEYXRlU3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cblxuICBnZXRMaXN0SXRlbVN0eWxlKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI0NXB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIC8vIHRpdGxlQ29sb3I6IHRoaXMuaXNNaXNzZWRDYWxsKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyISlcbiAgICAgIHRpdGxlQ29sb3I6IENhbGxMb2dVdGlscy5pc01pc3NlZENhbGwoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIhKVxuICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBwYWRkaW5nOiBcIjEwcHhcIixcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgIH0pO1xuICAgIHJldHVybiB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cblxuICBzZXRDYWxsTG9nc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENhbGxMb2dzU3R5bGUgPSBuZXcgQ2FsbExvZ3NTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGF0ZVNlcGFyYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWlzc2VkQ2FsbEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgICAgaW5mb0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIG91dGdvaW5nQ2FsbEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaW5jb21pbmdDYWxsSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBjYWxsU3RhdHVzVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgY2FsbFN0YXR1c1RleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcblxuICAgICAgZGF0ZVNlcGFyYXRvclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICB9KTtcblxuICAgIHRoaXMuY2FsbExvZ3NTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNhbGxMb2dzU3R5bGUgfTtcbiAgfVxuICBzdWJ0aXRsZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmNhbGxMb2dzU3R5bGUuY2FsbFN0YXR1c1RleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuY2FsbExvZ3NTdHlsZS5jYWxsU3RhdHVzVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG5cbiAgaW5mb0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5jYWxsTG9nc1N0eWxlLmluZm9JY29uVGludCxcbiAgICB9O1xuICB9O1xuXG4gIGdldENhbGxCdWlsZGVyKCk6IHR5cGVvZiBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5ncyB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGF1ZGlvT25seUNhbGw6IGJvb2xlYW4gPVxuICAgICAgdGhpcy5hY3RpdmVDYWxsPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgICAgID8gdHJ1ZVxuICAgICAgICA6IGZhbHNlO1xuICAgIGNvbnN0IGNhbGxTZXR0aW5ncyA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuICAgICAgLmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSlcbiAgICAgIC5zZXRJc0F1ZGlvT25seUNhbGwoYXVkaW9Pbmx5Q2FsbClcbiAgICAgIC5zZXRDYWxsTGlzdGVuZXIoXG4gICAgICAgIG5ldyBDb21ldENoYXRVSUtpdENhbGxzLk9uZ29pbmdDYWxsTGlzdGVuZXIoe1xuICAgICAgICAgIG9uQ2FsbEVuZGVkOiAoKSA9PiB7XG4gICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBudWxsKTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3Q/LmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q2FsbHMuZW5kU2Vzc2lvbigpO1xuICAgICAgICAgICAgICBDb21ldENoYXQuY2xlYXJBY3RpdmVDYWxsKCk7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2VDYWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkNhbGxFbmRCdXR0b25QcmVzc2VkOiAoKSA9PiB7XG4gICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBudWxsKTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3Q/LmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdC5lbmRDYWxsKHRoaXMuc2Vzc2lvbklkKVxuICAgICAgICAgICAgICAgIC50aGVuKChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDYWxscy5lbmRTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoY2FsbCk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlQ2FsbFNjcmVlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5idWlsZCgpO1xuICAgIHJldHVybiBjYWxsU2V0dGluZ3M7XG4gIH1cblxuICBjbG9zZUNhbGxTY3JlZW4oKSB7XG4gICAgdGhpcy5jb21ldGNoYXRDYWxsT2JqZWN0ID0gbnVsbDtcbiAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlO1xuICAgIHRoaXMuc2Vzc2lvbklkID0gXCJcIjtcbiAgICB0aGlzLnNob3dPdXRnb2luZ0NhbGxzY3JlZW4gPSBmYWxzZTtcbiAgICB0aGlzLmNvbWV0Y2hhdENhbGxPYmplY3QgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIG9wZW5PbmdvaW5nQ2FsbFNjcmVlbihjYWxsOiBDb21ldENoYXQuQ2FsbCkge1xuICAgIHRoaXMuc2hvd091dGdvaW5nQ2FsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMuY29tZXRjaGF0Q2FsbE9iamVjdCA9IGNhbGw7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBjYWxsLmdldFNlc3Npb25JZCgpO1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICBzZXRPbmdvaW5nQ2FsbFN0eWxlID0gKCkgPT4ge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgQ2FsbHNjcmVlblN0eWxlKHtcbiAgICAgIG1heEhlaWdodDogXCIxMDAlXCIsXG4gICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiIzFjMjIyNlwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjQwMHB4XCIsXG4gICAgICBtaW5XaWR0aDogXCI0MDBweFwiLFxuICAgICAgbWluaW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfSk7XG4gICAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub25nb2luZ0NhbGxTdHlsZSB9O1xuICB9O1xuXG4gIGdldERpcmVjdGlvbkljb25TdHlsZShjYWxsOiBhbnkpIHtcbiAgICBsZXQgdGludDtcbiAgICBjb25zdCBtaXNzZWRDYWxsID0gQ2FsbExvZ1V0aWxzLmlzTWlzc2VkQ2FsbChjYWxsLCB0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIGlmIChtaXNzZWRDYWxsKSB7XG4gICAgICB0aW50ID1cbiAgICAgICAgdGhpcy5jYWxsTG9nc1N0eWxlLm1pc3NlZENhbGxJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpO1xuICAgIH0gZWxzZSBpZiAoY2FsbC5nZXRJbml0aWF0b3IoKS5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aW50ID1cbiAgICAgICAgdGhpcy5jYWxsTG9nc1N0eWxlLm91dGdvaW5nQ2FsbEljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpbnQgPVxuICAgICAgICB0aGlzLmNhbGxMb2dzU3R5bGUuaW5jb21pbmdDYWxsSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjE4cHhcIixcbiAgICAgIHdpZHRoOiBcIjE4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgaWNvblRpbnQ6IHRpbnQsXG4gICAgfTtcbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLWNhbGwtbG9nc1wiIFtuZ1N0eWxlXT1cImNhbGxMb2dTdHlsZSgpXCI+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZW51c1wiICpuZ0lmPVwibWVudVwiPlxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuICA8Y29tZXRjaGF0LWxpc3QgW2hpZGVTZWFyY2hdPVwidHJ1ZVwiIFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIlxuICAgIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwib25TY3JvbGxlZFRvQm90dG9tXCIgW2xpc3RdPVwiY2FsbHNMaXN0XCIgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIiBbdGl0bGVdPVwidGl0bGVcIlxuICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiIFtzZWN0aW9uSGVhZGVyRmllbGRdPVwic2VjdGlvbkhlYWRlckZpZWxkXCJcbiAgICBbc2hvd1NlY3Rpb25IZWFkZXJdPVwic2hvd1NlY3Rpb25IZWFkZXJcIiBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIlxuICAgIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCIgW3N0YXRlXT1cInN0YXRlXCIgW2dldFNlY3Rpb25IZWFkZXJdPVwiZ2V0U2VjdGlvbkhlYWRlciFcIj5cbiAgPC9jb21ldGNoYXQtbGlzdD5cblxuICA8bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1jYWxsPlxuXG4gICAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW3RpdGxlXT1cImdldENhbGxlck5hbWUoY2FsbClcIiBbYXZhdGFyVVJMXT1cImdldEF2YXRhclVybChjYWxsKVwiXG4gICAgICBbYXZhdGFyTmFtZV09XCJnZXRDYWxsZXJOYW1lKGNhbGwpXCIgW2xpc3RJdGVtU3R5bGVdPVwiZ2V0TGlzdEl0ZW1TdHlsZShjYWxsKVwiIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICBbaGlkZVNlcGFyYXRvcl09XCJoaWRlU2VwYXJhdG9yXCIgKGNjLWxpc3RpdGVtLWNsaWNrZWQpPVwib25MaXN0SXRlbUNsaWNrQ2FsbChjYWxsKVwiXG4gICAgICBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlQ2FsbChjYWxsKVwiPlxuICAgICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgY2xhc3M9XCJjYy1jYWxsLWxvZ3NfX3N1YnRpdGxlLXZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlldztlbHNlIGdyb3VwU3VidGl0bGVcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNncm91cFN1YnRpdGxlPlxuICAgICAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiBbbmdTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKClcIiBjbGFzcz1cImNjLWNhbGwtbG9nc19fc3VidGl0bGUtdmlld1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jYWxsX19pY29uXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWljb24gW2ljb25TdHlsZV09XCJnZXREaXJlY3Rpb25JY29uU3R5bGUoY2FsbClcIiBbVVJMXT1cImdldENhbGxUeXBlSWNvbihjYWxsKVwiPjwvY29tZXRjaGF0LWljb24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGxfX3R5cGVcIj5cbiAgICAgICAgICAgIHt7Z2V0U3VidGl0bGUoY2FsbCl9fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtY2FsbC1sb2dzX190YWlsLXZpZXdcIiAqbmdJZj1cInRhaWxWaWV3O2Vsc2UgZGVmYXVsdFRhaWxWaWV3XCI+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0VGFpbFZpZXc+XG4gICAgICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgW25nU3R5bGVdPVwic3VidGl0bGVTdHlsZSgpXCIgY2xhc3M9XCJjYy1jYWxsLWxvZ3NfX3N1YnRpdGxlLXZpZXdcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFpbF9fdmlld1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNhbGwtbG9nc19fZGF0ZVwiPlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW2RhdGVTdHlsZV09XCJkYXRlU3R5bGVcIiBbdGltZXN0YW1wXT1cImNhbGw/LmluaXRpYXRlZEF0XCJcbiAgICAgICAgICAgICAgICBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwic2hvd01vcmVJbmZvXCIgW2ljb25VUkxdPVwiaW5mb0ljb25VcmxcIiBjbGFzcz1cImNjLWRldGFpbHNfX2Nsb3NlLWJ1dHRvblwiXG4gICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImluZm9CdXR0b25TdHlsZSgpXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImhhbmRsZUluZm9DbGljayhjYWxsKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG5cblxuXG4gICAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuXG4gIDwvbmctdGVtcGxhdGU+XG5cblxuPC9kaXY+XG5cbjxjb21ldGNoYXQtb25nb2luZy1jYWxsICpuZ0lmPVwic2hvd09uZ29pbmdDYWxsXCIgW21heGltaXplSWNvblVSTF09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ubWF4aW1pemVJY29uVVJMXCJcbiAgW21pbmltaXplSWNvblVSTF09XCJvbmdvaW5nQ2FsbENvbmZpZ3VyYXRpb24ubWluaW1pemVJY29uVVJMXCIgW3Nlc3Npb25JRF09XCJzZXNzaW9uSWRcIlxuICBbY2FsbFNldHRpbmdzQnVpbGRlcl09XCJnZXRDYWxsQnVpbGRlcigpIVwiPjwvY29tZXRjaGF0LW9uZ29pbmctY2FsbD5cblxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cInNob3dPdXRnb2luZ0NhbGxzY3JlZW5cIiBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCI+XG5cbiAgPGNvbWV0Y2hhdC1vdXRnb2luZy1jYWxsIFtjdXN0b21Tb3VuZEZvckNhbGxzXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uY3VzdG9tU291bmRGb3JDYWxsc1wiXG4gICAgW29uRXJyb3JdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbZGlzYWJsZVNvdW5kRm9yQ2FsbHNdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5kaXNhYmxlU291bmRGb3JDYWxsc1wiXG4gICAgW2F2YXRhclN0eWxlXT1cIm91dGdvaW5nQ2FsbENvbmZpZ3VyYXRpb24uYXZhdGFyU3R5bGVcIiBbY3VzdG9tVmlld109XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmN1c3RvbVZpZXdcIlxuICAgIFtkZWNsaW5lQnV0dG9uSWNvblVSTF09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLmRlY2xpbmVCdXR0b25JY29uVVJMXCJcbiAgICBbb25DbG9zZUNsaWNrZWRdPVwib3V0Z29pbmdDYWxsQ29uZmlndXJhdGlvbi5vbkNsb3NlQ2xpY2tlZCB8fCBjYW5jZWxPdXRnb2luZ0NhbGxcIlxuICAgIFtvdXRnb2luZ0NhbGxTdHlsZV09XCJvdXRnb2luZ0NhbGxDb25maWd1cmF0aW9uLm91dGdvaW5nQ2FsbFN0eWxlIHx8IG91dGdvaW5nQ2FsbFN0eWxlXCJcbiAgICBbY2FsbF09XCJjb21ldGNoYXRDYWxsT2JqZWN0IVwiPjwvY29tZXRjaGF0LW91dGdvaW5nLWNhbGw+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD4iXX0=