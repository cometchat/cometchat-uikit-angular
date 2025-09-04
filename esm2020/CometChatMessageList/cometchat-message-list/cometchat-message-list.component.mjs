import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewChildren, } from "@angular/core";
import { AvatarStyle, CallscreenStyle, CheckboxStyle, DateStyle, DropdownStyle, InputStyle, LabelStyle, ListItemStyle, QuickViewStyle, RadioButtonStyle, ReceiptStyle, SingleSelectStyle, } from "@cometchat/uikit-elements";
import { CalendarStyle, CallingDetailsUtils, CardBubbleStyle, CollaborativeDocumentConstants, CollaborativeWhiteboardConstants, CometChatSoundManager, TimeSlotStyle, CometChatUIKitUtility, FormBubbleStyle, InteractiveMessageUtils, LinkPreviewConstants, MessageInformationConfiguration, MessageListStyle, MessageReceiptUtils, MessageTranslationConstants, MessageTranslationStyle, SchedulerBubbleStyle, SmartRepliesConstants, ThumbnailGenerationConstants, ReactionsStyle, ReactionListConfiguration, ReactionInfoConfiguration, ReactionListStyle, ReactionInfoStyle, ReactionsConfiguration, CometChatUrlsFormatter, CometChatMentionsFormatter, CometChatUIKitLoginListener, StorageUtils, } from "@cometchat/uikit-shared";
import { ActivePopover, CometChatCallEvents, CometChatGroupEvents, CometChatMessageEvents, CometChatTheme, CometChatUIEvents, CometChatUIKitConstants, DatePatterns, DocumentIconAlignment, MessageBubbleAlignment, MessageListAlignment, MessageStatus, Placement, States, TimestampAlignment, fontHelper, localize, } from "@cometchat/uikit-resources";
import { CometChatUIKitCalls, LinkPreviewStyle, StickersConstants, } from "@cometchat/uikit-shared";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { CometChatUIKit } from "../../Shared/CometChatUIkit/CometChatUIKit";
import { MessageUtils } from "../../Shared/Utils/MessageUtils";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatMessageBubble/cometchat-message-bubble/cometchat-message-bubble.component";
import * as i3 from "../../Calls/CometChatOngoingCall/cometchat-ongoing-call/cometchat-ongoing-call.component";
import * as i4 from "../../CometChatMessageInformation/cometchat-message-information/cometchat-message-information.component";
import * as i5 from "@angular/common";
/**
 *
 * CometChatMessageList is a wrapper component for messageBubble
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export class CometChatMessageListComponent {
    constructor(ngZone, ref, themeService) {
        this.ngZone = ngZone;
        this.ref = ref;
        this.themeService = themeService;
        this.hideError = false;
        this.hideDateSeparator = false;
        this.errorStateText = localize("SOMETHING_WRONG");
        this.emptyStateText = localize("NO_MESSAGES_FOUND");
        this.loadingIconURL = "assets/Spinner.svg";
        /**
         * @deprecated
         *
         * This property is deprecated as of version 4.3.16 due to newer property 'hideReceipt'. It will be removed in subsequent versions.
         */
        this.disableReceipt = false;
        this.hideReceipt = false;
        this.disableSoundForMessages = false;
        this.customSoundForMessages = "";
        this.readIcon = "assets/message-read.svg";
        this.deliveredIcon = "assets/message-delivered.svg";
        this.sentIcon = "assets/message-sent.svg";
        this.waitIcon = "assets/wait.svg";
        this.errorIcon = "assets/warning-small.svg";
        this.aiErrorIcon = "assets/ai-error.svg";
        this.aiEmptyIcon = "assets/ai-empty.svg";
        this.alignment = MessageListAlignment.standard;
        this.showAvatar = true;
        this.datePattern = DatePatterns.time;
        this.timestampAlignment = TimestampAlignment.bottom;
        this.DateSeparatorPattern = DatePatterns.DayDateTime;
        this.templates = [];
        this.newMessageIndicatorText = "";
        this.scrollToBottomOnNewMessages = false;
        this.thresholdValue = 1000;
        this.unreadMessageThreshold = 30;
        this.reactionsConfiguration = new ReactionsConfiguration({});
        this.disableReactions = false;
        this.emojiKeyboardStyle = {};
        this.threadIndicatorIcon = "assets/threadIndicatorIcon.svg";
        this.avatarStyle = {
            borderRadius: "16px",
            width: "28px",
            height: "28px",
        };
        this.backdropStyle = {
            height: "100%",
            width: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
        };
        this.dateSeparatorStyle = {
            height: "",
            width: "",
        };
        this.messageListStyle = {
            nameTextFont: "400 11px Inter",
            emptyStateTextFont: "700 22px Inter",
            errorStateTextFont: "700 22px Inter",
        };
        this.onError = (error) => {
            console.log(error);
        };
        this.messageInformationConfiguration = new MessageInformationConfiguration({});
        this.disableMentions = false;
        this.state = States.loading;
        this.optionsStyle = {
            width: "",
            height: "",
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            background: "white",
            submenuWidth: "100%",
            submenuHeight: "100%",
            submenuBorder: "1px solid #e8e8e8",
            submenuBorderRadius: "8px",
            submenuBackground: "white",
            moreIconTint: "grey",
        };
        this.receiptStyle = {};
        this.documentBubbleAlignment = DocumentIconAlignment.right;
        this.callBubbleAlignment = DocumentIconAlignment.left;
        this.imageModerationStyle = {};
        this.timestampEnum = TimestampAlignment;
        this.chatChanged = true;
        this.starterErrorStateText = localize("SOMETHING_WRONG");
        this.starterEmptyStateText = localize("NO_MESSAGES_FOUND");
        this.starterLoadingStateText = localize("GENERATING_ICEBREAKERS");
        this.summaryErrorStateText = localize("SOMETHING_WRONG");
        this.summaryEmptyStateText = localize("NO_MESSAGES_FOUND");
        this.summaryLoadingStateText = localize("GENERATING_SUMMARY");
        this.timeStampColor = "";
        this.timeStampFont = "";
        this.smartReplyStyle = {
            width: "100%",
            height: "100%",
            border: "none",
        };
        this.conversationStarterStyle = {};
        this.conversationSummaryStyle = {
            width: "100%",
            height: "100%",
            border: "none",
            titleFont: "",
            titleColor: "",
            closeIconTint: "",
            boxShadow: "",
            textFont: "",
            textColor: "",
            background: "",
        };
        this.showSmartReply = false;
        this.enableConversationStarter = false;
        this.showConversationStarter = false;
        this.conversationStarterState = States.loading;
        this.conversationStarterReplies = [];
        this.enableConversationSummary = false;
        this.showConversationSummary = false;
        this.conversationSummaryState = States.loading;
        this.conversationSummary = [];
        this.getUnreadCount = 0;
        this.smartReplyMessage = null;
        this.enableSmartReply = false;
        this.timeStampBackground = "";
        this.linkPreviewStyle = {};
        this.unreadMessagesStyle = {};
        this.modalStyle = {
            height: "fit-content",
            width: "fit-content",
            closeIconTint: "blue",
        };
        this.dividerStyle = {
            height: "1px",
            width: "100%",
            background: "grey",
        };
        this.pollBubbleStyle = {};
        this.labelStyle = {
            textFont: "400 11px Inter",
            textColor: "grey",
        };
        this.imageBubbleStyle = {
            height: "auto",
            width: "100%",
            border: "none",
            borderRadius: "8px 8px 0px 0px",
            background: "transparent",
        };
        this.messagesList = [];
        this.bubbleDateStyle = {};
        this.whiteboardIconURL = "assets/collaborativewhiteboard.svg";
        this.documentIconURL = "assets/collaborativedocument.svg";
        this.directCallIconURL = "assets/Video-call2x.svg";
        this.placeholderIconURL = "/assets/placeholder.png";
        this.downloadIconURL = "assets/download.svg";
        this.translationStyle = {};
        this.documentBubbleStyle = {};
        this.callBubbleStyle = {};
        this.whiteboardTitle = localize("COLLABORATIVE_WHITEBOARD");
        this.whiteboardSubitle = localize("DRAW_WHITEBOARD_TOGETHER");
        this.whiteboardButtonText = localize("OPEN_WHITEBOARD");
        this.documentTitle = localize("COLLABORATIVE_DOCUMENT");
        this.documentSubitle = localize("DRAW_DOCUMENT_TOGETHER");
        this.documentButtonText = localize("OPEN_DOCUMENT");
        this.joinCallButtonText = localize("JOIN");
        this.localize = localize;
        this.reinitialized = false;
        this.addReactionIconURL = "assets/addreaction.svg";
        this.MessageTypesConstant = CometChatUIKitConstants.MessageTypes;
        this.callConstant = CometChatUIKitConstants.MessageCategory.call;
        this.typesMap = {};
        this.messageTypesMap = {};
        this.theme = new CometChatTheme({});
        this.groupListenerId = "group_" + new Date().getTime();
        this.callListenerId = "call_" + new Date().getTime();
        this.states = States;
        this.MessageCategory = CometChatUIKitConstants.MessageCategory;
        this.numberOfTopScroll = 0;
        this.keepRecentMessages = true;
        this.messageTemplate = [];
        this.openContactsView = false;
        this.isOnBottom = false;
        this.UnreadCount = [];
        this.newMessageCount = 0;
        this.type = "";
        this.confirmText = localize("YES");
        this.cancelText = localize("NO");
        this.warningText = "Are you sure want to see unsafe content?";
        this.threadedAlignment = MessageBubbleAlignment.left;
        this.messageInfoAlignment = MessageBubbleAlignment.right;
        this.openEmojiKeyboard = false;
        this.keyboardAlignment = Placement.right;
        this.popoverStyle = {
            height: "330px",
            width: "325px",
        };
        this.videoBubbleStyle = {
            height: "130px",
            width: "230px",
            border: "none",
            borderRadius: "8px",
            background: "transparent",
        };
        this.threadViewAlignment = MessageBubbleAlignment.left;
        this.enableDataMasking = false;
        this.enableThumbnailGeneration = false;
        this.enableLinkPreview = false;
        this.enablePolls = false;
        this.enableReactions = false;
        this.enableImageModeration = false;
        this.enableStickers = false;
        this.enableWhiteboard = false;
        this.enableDocument = false;
        this.showOngoingCall = false;
        this.enableCalling = false;
        this.ongoingCallStyle = {};
        this.sessionId = "";
        this.openMessageInfoPage = false;
        this.firstReload = false;
        this.isWebsocketReconnected = false;
        this.connectionListenerId = "connection_" + new Date().getTime();
        this.lastMessageId = 0;
        this.isConnectionReestablished = false;
        this.closeIconURL = "assets/close2x.svg";
        this.threadOpenIcon = "assets/side-arrow.svg";
        this.confirmDialogStyle = {};
        this.messageToReact = null;
        this.limit = 30;
        this.types = [];
        this.categories = [];
        this.callbacks = new Map();
        this.closeContactsPage = () => {
            this.openContactsView = false;
            this.ref.detectChanges();
        };
        this.addReaction = (event) => {
            let emoji = event?.detail?.id;
            this.popoverRef.nativeElement.openContentView(event);
            if (this.messageToReact) {
                this.reactToMessage(emoji, this.messageToReact);
                setTimeout(() => {
                    this.messageToReact = null;
                }, 0);
            }
        };
        this.getCallActionMessage = (call) => {
            return CallingDetailsUtils.getCallStatus(call, this.loggedInUser);
        };
        this.isMobileView = () => {
            return window.innerWidth <= 768;
        };
        this.showEmojiKeyboard = (id, event) => {
            CometChatUIEvents.ccActivePopover.next(ActivePopover.messageList);
            let message = this.getMessageById(id);
            if (message) {
                this.messageToReact = message;
                if (this.isMobileView()) {
                    let bubbleRef = this.getBubbleById(String(id));
                    if (bubbleRef) {
                        const rect = bubbleRef.nativeElement.getBoundingClientRect();
                        const isAtTop = rect.top < innerHeight / 2;
                        const isAtBottom = rect.bottom > window.innerHeight / 2;
                        if (isAtTop) {
                            this.keyboardAlignment = Placement.bottom;
                        }
                        else if (isAtBottom) {
                            this.keyboardAlignment = Placement.top;
                        }
                    }
                }
                else {
                    this.keyboardAlignment =
                        message.getSender()?.getUid() == this.loggedInUser?.getUid()
                            ? Placement.left
                            : Placement.right;
                }
                this.ref.detectChanges();
                this.popoverRef.nativeElement.openContentView(event);
            }
        };
        this.setBubbleView = () => {
            this.messageTemplate.forEach((element) => {
                this.messageTypesMap[element.category + '_' + element.type] = element;
            });
        };
        this.openThreadView = (message) => {
            if (this.onThreadRepliesClick) {
                this.onThreadRepliesClick(message, this.threadMessageBubble);
            }
        };
        this.threadCallback = (id) => {
            let messageObject = this.getMessageById(id);
            this.openThreadView(messageObject);
        };
        this.deleteCallback = (id) => {
            let messageObject = this.getMessageById(id);
            this.deleteMessage(messageObject);
        };
        this.editCallback = (id) => {
            let messageObject = this.getMessageById(id);
            this.onEditMessage(messageObject);
        };
        this.copyCallback = (id) => {
            let messageObject = this.getMessageById(id);
            this.onCopyMessage(messageObject);
        };
        this.messagePrivatelyCallback = (id) => {
            let messageObject = this.getMessageById(id);
            this.sendMessagePrivately(messageObject);
        };
        this.messageInfoCallback = (id) => {
            let messageObject = this.getMessageById(id);
            this.openMessageInfo(messageObject);
        };
        this.closeMessageInfoPage = () => {
            this.openMessageInfoPage = false;
            this.ref.detectChanges();
        };
        this.updateTranslatedMessage = (translation) => {
            var receivedMessage = translation;
            var translatedText = receivedMessage.translations[0].message_translated;
            let messageList = [...this.messagesList];
            let messageKey = messageList.findIndex((m) => m.getId() === receivedMessage.msgId);
            let data;
            if (messageKey > -1) {
                var messageObj = messageList[messageKey];
                if (messageObj.getMetadata()) {
                    data = messageObj.getMetadata();
                }
                else {
                    messageObj.setMetadata({});
                    data = messageObj.getMetadata();
                }
                data[MessageTranslationConstants.translated_message] = translatedText;
                var newMessageObj = messageObj;
                messageList.splice(messageKey, 1, newMessageObj);
                this.messagesList = [...messageList];
                this.ref.detectChanges();
            }
        };
        this.translateMessage = (id) => {
            let message = this.getMessageById(id);
            if (message) {
                CometChat.callExtension(MessageTranslationConstants.message_translation, MessageTranslationConstants.post, MessageTranslationConstants.v2_translate, {
                    msgId: message.getId(),
                    text: message.getText(),
                    languages: navigator.languages,
                })
                    .then((result) => {
                    if (result?.translations[0]?.message_translated !=
                        message?.getText()) {
                        this.updateTranslatedMessage(result);
                        this.ref.detectChanges();
                    }
                    else {
                        return;
                    }
                    // Result of translations
                })
                    .catch((error) => { });
            }
        };
        /**
         * Filters out the 'add reaction' option if reactions are disabled.
         *
         * @param {CometChatMessageOption[]} options - The original set of message options.
         * @returns {CometChatMessageOption[]} The filtered set of message options.
         */
        this.filterEmojiOptions = (options) => {
            if (this.disableReactions && options?.length > 0) {
                return options.filter((option) => {
                    return option.id !== CometChatUIKitConstants.MessageOption.reactToMessage;
                });
            }
            return options;
        };
        /**
         * Checks if the 'statusInfoView' is present in the default template provided by the user
         * If present, returns the user-defined template, otherwise returns null.
         *
         * @param message Message object for which the status info view needs to be fetched
         * @returns User-defined TemplateRef if present, otherwise null
         */
        this.getContentView = (message) => {
            if (this.messageTypesMap[message.getCategory() + '_' + message?.getType()] &&
                this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.contentView) {
                return this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.contentView(message);
            }
            else {
                return message.getDeletedAt()
                    ? this.typesMap[CometChatUIKitConstants.MessageCategory.message + '_' + CometChatUIKitConstants.MessageTypes.text]
                    : this.typesMap[message.getCategory() + '_' + message?.getType()];
            }
        };
        this.setBubbleAlignment = (message) => {
            let alignment = MessageBubbleAlignment.center;
            if (this.alignment == MessageListAlignment.left) {
                alignment = MessageBubbleAlignment.left;
            }
            else {
                if (message?.getType() ==
                    CometChatUIKitConstants.MessageTypes.groupMember ||
                    message.getCategory() == this.callConstant) {
                    alignment = MessageBubbleAlignment.center;
                }
                else if (!message?.getSender() ||
                    (message?.getSender().getUid() == this.loggedInUser.getUid() &&
                        message?.getType() !=
                            CometChatUIKitConstants.MessageTypes.groupMember)) {
                    alignment = MessageBubbleAlignment.right;
                }
                else {
                    alignment = MessageBubbleAlignment.left;
                }
            }
            return alignment;
        };
        this.getBubbleWrapper = (message) => {
            let view;
            if (this.messageTypesMap &&
                this.messageTypesMap[message?.getCategory() + '_' + message?.getType()] &&
                this.messageTypesMap[message?.getCategory() + '_' + message?.getType()].bubbleView) {
                view = this.messageTypesMap[message?.getCategory() + '_' + message?.getType()].bubbleView(message);
                return view;
            }
            else {
                view = null;
                return view;
            }
        };
        this.setTranslationStyle = (message) => {
            var isLeftAligned = this.alignment !== MessageListAlignment.left;
            var isUserSentMessage = !message?.getSender() ||
                this.loggedInUser.getUid() === message?.getSender().getUid();
            if (!isLeftAligned) {
                return new MessageTranslationStyle({
                    translatedTextFont: fontHelper(this.themeService.theme.typography.text3),
                    translatedTextColor: this.themeService.theme.palette.getAccent("light"),
                    helpTextColor: this.themeService.theme.palette.getAccent700(),
                    helpTextFont: fontHelper(this.themeService.theme.typography.caption2),
                    background: "transparent",
                });
            }
            else {
                if (isUserSentMessage) {
                    return new MessageTranslationStyle({
                        translatedTextFont: fontHelper(this.themeService.theme.typography.text3),
                        translatedTextColor: this.themeService.theme.palette.getAccent("dark"),
                        helpTextColor: this.themeService.theme.palette.getAccent700("dark"),
                        helpTextFont: fontHelper(this.themeService.theme.typography.caption2),
                        background: "transparent",
                    });
                }
                else {
                    return new MessageTranslationStyle({
                        translatedTextFont: fontHelper(this.themeService.theme.typography.text3),
                        translatedTextColor: this.themeService.theme.palette.getAccent("light"),
                        helpTextColor: this.themeService.theme.palette.getAccent700(),
                        helpTextFont: fontHelper(this.themeService.theme.typography.caption2),
                        background: "transparent",
                    });
                }
            }
        };
        this.setTextBubbleStyle = (message) => {
            let isInfoBubble = this.messageInfoObject && message.getId() && this.messageInfoObject.getId() == message.getId();
            var isDeleted = message.getDeletedAt();
            var notLeftAligned = this.alignment !== MessageListAlignment.left;
            var isTextMessage = message.getCategory() ===
                CometChatUIKitConstants.MessageCategory.message &&
                message?.getType() === CometChatUIKitConstants.MessageTypes.text;
            var isUserSentMessage = !message?.getSender() ||
                this.loggedInUser.getUid() === message?.getSender().getUid();
            var isGroupMemberMessage = message?.getType() === CometChatUIKitConstants.MessageTypes.groupMember;
            if (!isDeleted && notLeftAligned && isTextMessage && isUserSentMessage) {
                return {
                    textFont: fontHelper(this.themeService.theme.typography.text3),
                    textColor: this.themeService.theme.palette.getAccent900("light"),
                    bubblePadding: isInfoBubble ? "8px 12px" : "8px 12px 0 12px"
                };
            }
            if (!isDeleted &&
                notLeftAligned &&
                isTextMessage &&
                !isUserSentMessage &&
                !isGroupMemberMessage) {
                return {
                    textFont: fontHelper(this.themeService.theme.typography.text3),
                    textColor: this.themeService.theme.palette.getAccent(),
                    bubblePadding: "8px 12px 2px 12px"
                };
            }
            if (isGroupMemberMessage) {
                return {
                    textFont: fontHelper(this.themeService.theme.typography.subtitle2),
                    textColor: this.themeService.theme.palette.getAccent600(),
                };
            }
            if (!notLeftAligned && isTextMessage) {
                return {
                    textFont: fontHelper(this.themeService.theme.typography.text2),
                    textColor: this.themeService.theme.palette.getAccent(),
                };
            }
            return {
                textFont: fontHelper(this.themeService.theme.typography.text2),
                textColor: this.themeService.theme.palette.getAccent400(),
                bubblePadding: "8px 12px"
            };
        };
        /*
      * isPartOfCurrentChatForUIEvent: To check if the message belongs for this list and is not part of thread even for current list
        it only runs for UI event because it assumes logged in user is always sender
      * @param: message: CometChat.BaseMessage
      */
        this.isPartOfCurrentChatForUIEvent = (message) => {
            const receiverId = message?.getReceiverId();
            const receiverType = message?.getReceiverType();
            if (this.parentMessageId) {
                if (message.getParentMessageId() === this.parentMessageId) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                if (message.getParentMessageId()) {
                    return false;
                }
                if (this.user) {
                    if (receiverType === CometChatUIKitConstants.MessageReceiverType.user && receiverId === this.user.getUid()) {
                        return true;
                    }
                }
                else if (this.group) {
                    if (receiverType === CometChatUIKitConstants.MessageReceiverType.group && receiverId === this.group.getGuid()) {
                        return true;
                    }
                }
                return false;
            }
        };
        /*
          * isPartOfCurrentChatForSDKEvent: To check if the message belongs for this list and is not part of thread even for current list
            it only runs for SDK event because it needs senderId to check if the message is sent by the same user
          * @param: message: CometChat.BaseMessage
        */
        this.isPartOfCurrentChatForSDKEvent = (message) => {
            const receiverId = message?.getReceiverId();
            const receiverType = message?.getReceiverType();
            const senderId = message?.getSender()?.getUid();
            if (this.parentMessageId) {
                if (message.getParentMessageId() === this.parentMessageId) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                if (message.getParentMessageId()) {
                    return false;
                }
                if (this.user) {
                    if (receiverType === CometChatUIKitConstants.MessageReceiverType.user && (receiverId === this.user.getUid() || senderId === this.user.getUid())) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else if (this.group) {
                    if (receiverType === CometChatUIKitConstants.MessageReceiverType.group && (receiverId === this.group.getGuid())) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                return false;
            }
        };
        /*
          * isThreadOfCurrentChatForUIEvent: To check if the message belongs thread of this list,
            it only runs for UI event because it assumes logged in user is always sender
          * @param: message: CometChat.BaseMessage
        */
        this.isThreadOfCurrentChatForUIEvent = (message) => {
            if (!message.getParentMessageId()) {
                return false;
            }
            const receiverId = message?.getReceiverId();
            if (this.user) {
                if (receiverId === this.user.getUid()) {
                    return true;
                }
            }
            else if (this.group) {
                if (receiverId === this.group.getGuid()) {
                    return true;
                }
            }
            return false;
        };
        /*
          * isThreadOfCurrentChatForSDKEvent: To check if the message belongs thread of this list,
            it only runs for SDK event because it needs senderId to check if the message is sent by the same user
          * @param: message: CometChat.BaseMessage
        */
        this.isThreadOfCurrentChatForSDKEvent = (message) => {
            if (!message.getParentMessageId()) {
                return false;
            }
            const receiverId = message?.getReceiverId();
            const senderId = message?.getSender()?.getUid();
            if (this.user) {
                if (receiverId === this.user.getUid() || senderId === this.user.getUid()) {
                    return true;
                }
            }
            else if (this.group) {
                if (receiverId === this.group.getGuid()) {
                    return true;
                }
            }
            return false;
        };
        this.startDirectCall = (sessionId, message) => {
            this.sessionId = sessionId;
            this.showOngoingCall = true;
            StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, message);
            this.ref.detectChanges();
        };
        this.launchCollaborativeDocument = (url) => {
            window.open(url, "", "fullscreen=yes, scrollbars=auto");
        };
        this.launchCollaborativeWhiteboard = (url) => {
            window.open(url + `&username=${this.loggedInUser?.getName()}`, "", "fullscreen=yes, scrollbars=auto");
        };
        this.openConfirmDialog = false;
        this.openFullscreenView = false;
        this.imageurlToOpen = "";
        this.fullScreenViewerStyle = {
            closeIconTint: "blue",
        };
        this.onConfirmClick = () => {
            this.openConfirmDialog = false;
            if (this.closeImageModeration) {
                this.closeImageModeration();
            }
            this.ref.detectChanges();
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
        /**
         * Listener To Receive Messages in Real Time
         * @param
         */
        this.fetchPreviousMessages = () => {
            if (this.reinitialized) {
                if (this.messagesRequestBuilder) {
                    this.requestBuilder = CometChatUIKitUtility.clone(this.messagesRequestBuilder);
                }
                else {
                    this.requestBuilder = new CometChat.MessagesRequestBuilder()
                        .setLimit(this.limit)
                        .setTypes(this.types)
                        .setMessageId(this.messagesList[0].getId())
                        .setCategories(this.categories)
                        .hideReplies(true);
                    if (this.user) {
                        this.requestBuilder = this.requestBuilder.setUID(this.user?.getUid()).build();
                    }
                    else if (this.group) {
                        this.requestBuilder = this.requestBuilder.setGUID(this.group?.getGuid()).build();
                    }
                }
            }
            this.requestBuilder
                .fetchPrevious()
                .then((messageList) => {
                if (messageList && messageList.length > 0) {
                    messageList = messageList.map((message, i) => {
                        if (message.getCategory() ===
                            CometChatUIKitConstants.MessageCategory.interactive) {
                            return InteractiveMessageUtils.convertInteractiveMessage(message);
                        }
                        else {
                            return message;
                        }
                    });
                }
                this.state = States.loading;
                // No Messages Found
                if (messageList.length === 0 && this.messagesList.length === 0) {
                    this.state = States.empty;
                    if (!this.parentMessageId && this.enableConversationStarter) {
                        this.fetchConversationStarter();
                    }
                    this.ref.detectChanges();
                    return;
                }
                if (messageList && messageList.length > 0) {
                    if (this.getUnreadCount >= this.unreadMessageThreshold &&
                        this.enableConversationSummary) {
                        this.fetchConversationSummary();
                    }
                    this.showConversationStarter = false;
                    this.conversationStarterReplies = [];
                    if (this.firstReload) {
                        this.lastMessageId = Number(messageList[messageList.length - 1].getId());
                    }
                    let lastMessage = messageList[messageList.length - 1];
                    let isSentByMe = lastMessage?.getSender()?.getUid() ==
                        this.loggedInUser?.getUid();
                    if (!isSentByMe &&
                        !lastMessage.getDeliveredAt()) {
                        //mark the message as delivered
                        if (!this.disableReceipt) {
                            CometChat.markAsDelivered(lastMessage).then(() => {
                                if (lastMessage.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                                    let messageKey = this.messagesList.findIndex((m) => m.getId() === lastMessage?.getId());
                                    if (messageKey > -1) {
                                        this.markAllMessagAsDelivered(messageKey);
                                    }
                                }
                            });
                        }
                    }
                    if (!lastMessage?.getReadAt() && !isSentByMe) {
                        if (!this.disableReceipt) {
                            CometChat.markAsRead(lastMessage)
                                .then(() => {
                                if (lastMessage.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                                    let messageKey = this.messagesList.findIndex((m) => m.getId() === lastMessage?.getId());
                                    if (messageKey > -1) {
                                        this.markAllMessagAsRead(messageKey);
                                    }
                                }
                            })
                                .catch((error) => {
                                if (this.onError) {
                                    this.onError(error);
                                }
                            });
                        }
                        else {
                            this.UnreadCount = [];
                            this.ref.detectChanges();
                        }
                    }
                    this.state = States.loaded;
                    this.ref.detectChanges();
                    //if the sender of the message is not the loggedin user, mark it as read.
                    let prevScrollHeight = this.listScroll?.nativeElement.scrollHeight;
                    setTimeout(() => {
                        this.listScroll.nativeElement.scrollTop =
                            this.listScroll?.nativeElement.scrollHeight - prevScrollHeight;
                    }, 100);
                    this.showSmartReply = false;
                    this.smartReplyMessage = null;
                    this.prependMessages(messageList);
                }
                else {
                    this.state = States.loaded;
                }
                if (this.firstReload) {
                    this.attachConnectionListener();
                    this.firstReload = false;
                }
                this.ref.detectChanges();
            }, (error) => {
                this.state = States.error;
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
                this.ref.detectChanges();
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
                if (this.messagesList?.length <= 0) {
                    this.state = States.error;
                    this.ref.detectChanges();
                }
            });
        };
        this.fetchNextMessage = () => {
            let index = this.messagesList.length - 1;
            let messageId;
            if (this.reinitialized ||
                (this.lastMessageId > 0 && this.isWebsocketReconnected)) {
                if (this.isWebsocketReconnected) {
                    this.fetchActionMessages();
                    messageId = this.lastMessageId;
                }
                else {
                    messageId = this.messagesList[index].getId();
                }
                if (this.messagesRequestBuilder) {
                    this.requestBuilder = this.user
                        ? this.messagesRequestBuilder
                            .setUID(this.user?.getUid())
                            .setMessageId(messageId)
                            .build()
                        : this.messagesRequestBuilder
                            .setGUID(this.group?.getGuid())
                            .setMessageId(messageId)
                            .build();
                }
                else {
                    this.requestBuilder = new CometChat.MessagesRequestBuilder()
                        .setLimit(this.limit)
                        .setTypes(this.types)
                        .setMessageId(messageId)
                        .setCategories(this.categories)
                        .hideReplies(true);
                    if (this.user) {
                        this.requestBuilder.setUID(this.user?.getUid()).build();
                    }
                    else if (this.group) {
                        this.requestBuilder.setGUID(this.group?.getGuid()).build();
                    }
                }
                this.requestBuilder
                    .fetchNext()
                    .then((messageList) => {
                    if (messageList && messageList.length > 0) {
                        messageList = messageList.map((message, i) => {
                            if (message.getCategory() ===
                                CometChatUIKitConstants.MessageCategory.interactive) {
                                return InteractiveMessageUtils.convertInteractiveMessage(message);
                            }
                            else {
                                return message;
                            }
                        });
                    }
                    this.state = States.loading;
                    // No Messages Found
                    if (messageList.length === 0 && this.messagesList.length === 0) {
                        this.state = States.empty;
                        this.ref.detectChanges();
                        return;
                    }
                    if (messageList && messageList.length) {
                        if (this.isOnBottom) {
                            let lastMessage = messageList[messageList.length - 1];
                            this.lastMessageId = Number(messageList[messageList.length - 1].getId());
                            this.firstReload = false;
                            if (!lastMessage?.getReadAt() &&
                                lastMessage?.getSender().getUid() !=
                                    this.loggedInUser?.getUid()) {
                                if (!this.disableReceipt) {
                                    CometChat.markAsRead(lastMessage);
                                }
                                else {
                                    this.UnreadCount = [];
                                    this.ref.detectChanges();
                                }
                            }
                            if (!lastMessage?.getDeliveredAt() &&
                                lastMessage?.getSender().getUid() !=
                                    this.loggedInUser?.getUid()) {
                                this.markMessageAsDelivered(lastMessage);
                                this.markAllMessagAsDelivered(messageList.length - 1);
                            }
                            this.state = States.loaded;
                            this.scrollToBottom();
                            this.appendMessages(messageList);
                            this.isWebsocketReconnected = false;
                            this.ref.detectChanges();
                        }
                        else {
                            let lastMessage = messageList[messageList.length - 1];
                            this.lastMessageId = Number(messageList[messageList.length - 1].getId());
                            this.firstReload = false;
                            if (this.scrollToBottomOnNewMessages) {
                                setTimeout(() => {
                                    this.scrollToBottom();
                                }, 100);
                            }
                            else {
                                let countText = localize("NEW_MESSAGES");
                                if (this.newMessageIndicatorText &&
                                    this.newMessageIndicatorText != "") {
                                    countText = this.newMessageIndicatorText;
                                }
                                else {
                                    countText =
                                        this.UnreadCount.length > 0
                                            ? localize("NEW_MESSAGES")
                                            : localize("NEW_MESSAGE");
                                }
                                this.UnreadCount.push(...messageList);
                                this.newMessageCount =
                                    " ↓ " + this.UnreadCount.length + " " + countText;
                                this.ref.detectChanges();
                            }
                            if (!lastMessage?.getDeliveredAt() &&
                                lastMessage?.getSender().getUid() !=
                                    this.loggedInUser?.getUid()) {
                                this.markMessageAsDelivered(lastMessage);
                                this.markAllMessagAsDelivered(messageList.length - 1);
                            }
                            this.state = States.loaded;
                            this.appendMessages(messageList);
                            this.isWebsocketReconnected = false;
                            this.ref.detectChanges();
                        }
                    }
                }, (error) => {
                    this.state = States.error;
                    console.log(error);
                    if (this.onError) {
                        this.onError(CometChatException(error));
                    }
                    this.ref.detectChanges();
                })
                    .catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                    if (this.messagesList?.length <= 0) {
                        this.state = States.error;
                        this.ref.detectChanges();
                    }
                });
            }
        };
        this.appendMessages = (messages) => {
            if (!this.isPartOfCurrentChatForSDKEvent(messages[0])) {
                return;
            }
            this.messagesList.push(...messages);
            this.messageCount = this.messagesList.length;
            if (this.messageCount > this.thresholdValue) {
                this.keepRecentMessages = true;
                this.reInitializeMessageBuilder();
            }
            this.state = States.loaded;
            this.ref.detectChanges();
        };
        /**
         * translate message then call update message
         * @param  {CometChat.BaseMessage} message
         */
        // translateMessage(message: CometChat.BaseMessage) {
        // }
        /**
         * @param  {CometChat.BaseMessage} message
         */
        this.markMessageAsDelivered = (message) => {
            if (!this.disableReceipt &&
                message?.getSender().getUid() !== this.loggedInUser?.getUid() &&
                message.hasOwnProperty("deliveredAt") === false) {
                CometChat.markAsDelivered(message);
            }
        };
        /**
         * @param  {CometChat.BaseMessage} message
         * @param  {string} type
         */
        this.messageReceivedHandler = (message) => {
            ++this.messageCount;
            if (message.getParentMessageId()) {
                // this.updateReplyCount(message);
                this.updateUnreadReplyCount(message);
                this.addMessage(message);
            }
            else {
                if (this.messageCount > this.thresholdValue) {
                    this.keepRecentMessages = true;
                    this.reInitializeMessageBuilder();
                }
                this.addMessage(message);
                if (!this.isOnBottom) {
                    if (this.scrollToBottomOnNewMessages) {
                        setTimeout(() => {
                            this.scrollToBottom();
                        }, 100);
                    }
                    else {
                        let countText = localize("NEW_MESSAGES");
                        if (this.newMessageIndicatorText &&
                            this.newMessageIndicatorText != "") {
                            countText = this.newMessageIndicatorText;
                        }
                        else {
                            countText =
                                this.UnreadCount.length > 0
                                    ? localize("NEW_MESSAGES")
                                    : localize("NEW_MESSAGE");
                        }
                        this.UnreadCount.push(message);
                        this.newMessageCount =
                            " ↓ " + this.UnreadCount.length + " " + countText;
                        this.ref.detectChanges();
                    }
                }
            }
            if (!this.disableSoundForMessages) {
                this.playAudio();
            }
            //handling dom lag - increment count only for main message list
            if (message.hasOwnProperty("parentMessageId") === false &&
                this.parentMessageId) {
                ++this.messageCount;
                this.ref.detectChanges();
            }
            else if (message.hasOwnProperty("parentMessageId") === true &&
                this.parentMessageId) {
                if (message.getParentMessageId() === this.parentMessageId &&
                    this.isOnBottom) {
                    if (!this.disableReceipt) {
                        CometChat.markAsRead(message).then(() => {
                            CometChatMessageEvents.ccMessageRead.next(message);
                        });
                    }
                    else {
                        this.UnreadCount = [];
                        this.ref.detectChanges();
                    }
                    this.ref.detectChanges();
                }
            }
            else {
            }
        };
        this.getCallBuilder = () => {
            const callSettings = new CometChatUIKitCalls.CallSettingsBuilder()
                .enableDefaultLayout(true)
                .setIsAudioOnlyCall(false)
                .setCallListener(new CometChatUIKitCalls.OngoingCallListener({
                onCallEndButtonPressed: () => {
                    StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, null);
                    CometChatCallEvents.ccCallEnded.next({});
                },
                onError: (error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                },
            }))
                .build();
            return callSettings;
        };
        this.reInitializeMessageBuilder = () => {
            if (!this.parentMessageId) {
                this.messageCount = 0;
            }
            this.requestBuilder = null;
            CometChat.removeGroupListener(this.groupListenerId);
            CometChat.removeCallListener(this.callListenerId);
            this.reInitializeMessageList();
        };
        /**
         * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
         * @param {CometChat.BaseMessage} message
         */
        /**
         * Detects if the message that was edit is your current open conversation window
         * @param {CometChat.BaseMessage} message
         */
        this.messageEdited = (message) => {
            try {
                if (this.group &&
                    message.getReceiverType() ===
                        CometChatUIKitConstants.MessageReceiverType.group &&
                    message.getReceiverId() === this.group?.getGuid()) {
                    this.updateEditedMessage(message);
                }
                else if (this.user &&
                    message.getReceiverType() ===
                        CometChatUIKitConstants.MessageReceiverType.user &&
                    this.loggedInUser?.getUid() === message.getReceiverId() &&
                    message?.getSender().getUid() === this.user?.getUid()) {
                    this.updateEditedMessage(message);
                }
                else if (this.user &&
                    message.getReceiverType() ===
                        CometChatUIKitConstants.MessageReceiverType.user &&
                    this.loggedInUser?.getUid() === message?.getSender().getUid() &&
                    message.getReceiverId() === this.user?.getUid()) {
                    this.updateEditedMessage(message);
                }
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.updateInteractiveMessage = (receipt) => {
            if (this.loggedInUser.getUid() === receipt.getSender().getUid()) {
                const message = this.getMessageById(receipt.getMessageId());
                if (message) {
                    if (String(message?.getId()) == String(receipt.getMessageId())) {
                        const interaction = receipt.getInteractions();
                        message.setInteractions(interaction);
                        this.updateEditedMessage(InteractiveMessageUtils.convertInteractiveMessage(message));
                    }
                }
            }
        };
        /**
         * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
         * @param {CometChat.BaseMessage} message
         */
        this.updateEditedMessage = (message) => {
            var messageList = this.messagesList;
            // let newMessage = CometChatUIKitUtility.clone(message);
            var messageKey = messageList.findIndex((m) => m.getId() === message.getId());
            if (messageKey > -1) {
                this.messagesList[messageKey] = message;
                this.ref.detectChanges();
            }
            // if (messageKey > -1) {
            //   this.messagesList = [
            //     ...messageList.slice(0, messageKey),
            //     message,
            //     ...messageList.slice(messageKey + 1),
            //   ];
            //   this.ref.detectChanges();
            // }
        };
        /**
         * @param  {CometChat.BaseMessage} message
         * @param  {string} type
         */
        this.customMessageReceivedHandler = (message) => {
            ++this.messageCount;
            // add received message to messages list
            if (message.getParentMessageId()) {
                // this.updateReplyCount(message);
                this.updateUnreadReplyCount(message);
                this.addMessage(message);
            }
            else {
                if (this.messageCount > this.thresholdValue) {
                    this.keepRecentMessages = true;
                    this.reInitializeMessageBuilder();
                }
                this.addMessage(message);
                if (!this.isOnBottom) {
                    if (this.scrollToBottomOnNewMessages) {
                        setTimeout(() => {
                            this.scrollToBottom();
                        }, 100);
                    }
                    else {
                        let countText = localize("NEW_MESSAGES");
                        if (this.newMessageIndicatorText &&
                            this.newMessageIndicatorText != "") {
                            countText = this.newMessageIndicatorText;
                        }
                        else {
                            countText =
                                this.UnreadCount.length > 0
                                    ? localize("NEW_MESSAGES")
                                    : localize("NEW_MESSAGE");
                        }
                        this.UnreadCount.push(message);
                        this.newMessageCount =
                            " ↓ " + this.UnreadCount.length + " " + countText;
                        this.ref.detectChanges();
                    }
                }
            }
            if (!this.disableSoundForMessages) {
                this.playAudio();
            }
            //handling dom lag - increment count only for main message list
            if (message.hasOwnProperty("parentMessageId") === false &&
                !this.parentMessageId) {
                ++this.messageCount;
                //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
            }
            else if (message.hasOwnProperty("parentMessageId") === true &&
                this.parentMessageId &&
                this.isOnBottom) {
                if (message.getParentMessageId() === this.parentMessageId) {
                    if (!this.disableReceipt) {
                        CometChat.markAsRead(message).then(() => {
                            CometChatMessageEvents.ccMessageRead.next(message);
                        });
                    }
                    else {
                        this.UnreadCount = [];
                        this.ref.detectChanges();
                    }
                }
            }
            else {
            }
            this.ref.detectChanges();
        };
        /**
         * Returns formatters for the text bubbles
         *
         * @param {CometChat.BaseMessage} message
         * @returns
         */
        this.getTextFormatters = (message) => {
            let alignment = this.setBubbleAlignment(message);
            let config = {
                textFormatters: this.textFormatters && this.textFormatters.length
                    ? [...this.textFormatters]
                    : ChatConfigurator.getDataSource().getAllTextFormatters({
                        disableMentions: this.disableMentions,
                        theme: this.themeService.theme,
                        alignment,
                    }),
            };
            let textFormatters = config.textFormatters;
            let urlTextFormatter;
            if (!this.disableMentions) {
                let mentionsTextFormatter;
                for (let i = 0; i < textFormatters.length; i++) {
                    if (textFormatters[i] instanceof CometChatMentionsFormatter) {
                        mentionsTextFormatter = textFormatters[i];
                        mentionsTextFormatter.setMessage(message);
                        if (message.getMentionedUsers().length) {
                            mentionsTextFormatter.setCometChatUserGroupMembers(message.getMentionedUsers());
                        }
                        mentionsTextFormatter.setLoggedInUser(CometChatUIKitLoginListener.getLoggedInUser());
                        if (urlTextFormatter) {
                            break;
                        }
                    }
                    if (textFormatters[i] instanceof CometChatUrlsFormatter) {
                        urlTextFormatter = textFormatters[i];
                        if (mentionsTextFormatter) {
                            break;
                        }
                    }
                }
                if (!mentionsTextFormatter) {
                    mentionsTextFormatter =
                        ChatConfigurator.getDataSource().getMentionsTextFormatter({
                            message,
                            ...config,
                            alignment,
                            theme: this.themeService.theme,
                        });
                    textFormatters.push(mentionsTextFormatter);
                }
            }
            else {
                for (let i = 0; i < textFormatters.length; i++) {
                    if (textFormatters[i] instanceof CometChatUrlsFormatter) {
                        urlTextFormatter = textFormatters[i];
                        break;
                    }
                }
            }
            if (!urlTextFormatter) {
                urlTextFormatter = ChatConfigurator.getDataSource().getUrlTextFormatter({
                    theme: this.themeService.theme,
                    alignment,
                });
                textFormatters.push(urlTextFormatter);
            }
            for (let i = 0; i < textFormatters.length; i++) {
                textFormatters[i].setMessageBubbleAlignment(alignment);
                textFormatters[i].setMessage(message);
            }
            return textFormatters;
        };
        // public methods
        this.addMessage = (message) => {
            this.messagesList.push(message);
            if (message.getId()) {
                this.lastMessageId = Number(message.getId());
            }
            if (!message?.getSender() ||
                this.loggedInUser?.getUid() == message?.getSender()?.getUid() ||
                this.isOnBottom) {
                this.scrollToBottom();
            }
            if (this.state != States.loaded) {
                this.state = States.loaded;
            }
            this.ref.detectChanges();
        };
        /**
         * callback for copy message
         * @param  {CometChat.TextMessage} object
         */
        this.onCopyMessage = (object) => {
            let text = object.getText();
            if (!this.disableMentions &&
                object.getMentionedUsers &&
                object.getMentionedUsers().length) {
                text = this.getMentionsTextWithoutStyle(object);
            }
            navigator.clipboard.writeText(text);
        };
        /**
         * callback for editMessage option
         * @param  {CometChat.BaseMessage} object
         */
        this.onEditMessage = (object) => {
            CometChatMessageEvents.ccMessageEdited.next({
                message: object,
                status: MessageStatus.inprogress,
            });
        };
        this.removeMessage = (message) => {
            try {
                var messageKey = this.messagesList.findIndex((msg) => msg?.getId() === message.getId());
                if (messageKey > -1) {
                    this.messagesList.splice(messageKey, 1, message);
                    this.messagesList = [...this.messagesList];
                    this.ref.detectChanges();
                }
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.deleteMessage = (message) => {
            try {
                var messageId = message.getId();
                CometChat.deleteMessage(messageId)
                    .then((deletedMessage) => {
                    CometChatMessageEvents.ccMessageDeleted.next(deletedMessage);
                    // this.ref.detectChanges()
                })
                    .catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.scrollToBottom = () => {
            try {
                setTimeout(() => {
                    this.listScroll?.nativeElement.scroll({
                        top: this.listScroll?.nativeElement.scrollHeight,
                        left: 0,
                    });
                    this.isOnBottom = true;
                    this.ref.detectChanges();
                }, 10);
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        /**
         * Updates the count of unread reply messages for a given message.
         *
         * @param {CometChat.BaseMessage} message - The message for which the reply count is being updated.
         */
        this.updateUnreadReplyCount = (message) => {
            try {
                let messageList = [...this.messagesList];
                let messageKey = messageList.findIndex((m) => m.getId() === message.getParentMessageId());
                if (messageKey > -1) {
                    const messageObj = messageList[messageKey];
                    // let unreadReplyCount = messageObj.getUnreadReplyCount()
                    //   ? messageObj.getUnreadReplyCount()
                    //   : 0;
                    // unreadReplyCount = unreadReplyCount + 1;
                    // messageObj.setUnreadReplyCount(unreadReplyCount);
                    messageList.splice(messageKey, 1, messageObj);
                    this.messagesList = [...messageList];
                }
                // eslint-disable-next-line
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        this.closeSmartReply = () => {
            this.showSmartReply = false;
            this.smartReplyMessage = null;
            this.ref.detectChanges();
        };
        this.closeConversationSummary = () => {
            this.showConversationSummary = false;
            this.ref.detectChanges();
        };
        this.sendReply = (event) => {
            let reply = event?.detail?.reply;
            if (this.smartReplyConfig.ccSmartRepliesClicked) {
                this.smartReplyConfig.ccSmartRepliesClicked(reply, this.smartReplyMessage, this.onError, this.customSoundForMessages, this.disableSoundForMessages);
                this.closeSmartReply();
            }
        };
        this.sendConversationStarter = (event) => {
            let reply = event?.detail?.reply;
            CometChatUIEvents.ccComposeMessage.next(reply);
            this.showConversationStarter = false;
            this.conversationStarterReplies = [];
            this.ref.detectChanges();
        };
        /**
         * styling part
         */
        this.getBubbleDateStyle = (message) => {
            let isSentByMe = this.isSentByMe(message) && this.alignment != MessageListAlignment.left;
            let isTextMessage = message.getType() == CometChatUIKitConstants.MessageTypes.text;
            return {
                textColor: this.messageListStyle.TimestampTextColor || this.themeService.theme.palette.getAccent600(),
                textFont: this.messageListStyle.TimestampTextFont ||
                    fontHelper(this.themeService.theme.typography.caption3),
                padding: "0px",
                display: "block",
            };
        };
        this.chatsListStyle = () => {
            return {
                height: this.messageListStyle.height,
                background: this.messageListStyle.background,
            };
        };
        this.messageContainerStyle = () => {
            return {
                width: this.messageListStyle.width,
            };
        };
        this.errorStyle = () => {
            return {
                textFont: this.messageListStyle.errorStateTextFont,
                textColor: this.messageListStyle.errorStateTextColor,
            };
        };
        this.conversationStarterStateStyle = () => {
            return {
                textFont: fontHelper(this.theme.typography.title2),
                textColor: this.theme.palette.getAccent600(),
            };
        };
        this.conversationSummaryStateStyle = () => {
            return {
                textFont: fontHelper(this.theme.typography.title2),
                textColor: this.theme.palette.getAccent600(),
            };
        };
        this.emptyStyle = () => {
            return {
                textFont: this.messageListStyle.emptyStateTextFont,
                textColor: this.messageListStyle.emptyStateTextColor,
            };
        };
        this.loadingStyle = {
            iconTint: this.messageListStyle?.loadingIconTint,
        };
        this.conversationStarterLoader = () => {
            return {
                iconTint: this.theme.palette.getAccent600(),
            };
        };
        this.conversationSummaryLoader = () => {
            return {
                iconTint: this.theme.palette.getAccent600(),
            };
        };
        this.getSchedulerBubbleStyle = (messgae) => {
            let avatarStyle = new AvatarStyle({
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                border: "none",
                backgroundColor: this.themeService.theme.palette.getAccent700(),
                nameTextColor: this.themeService.theme.palette.getAccent900(),
                backgroundSize: "cover",
                nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            });
            let listItemStyle = new ListItemStyle({
                height: "auto",
                width: "100%",
                background: "inherit",
                activeBackground: "transparent",
                borderRadius: "0",
                titleFont: fontHelper(this.themeService.theme.typography.text1),
                titleColor: this.themeService.theme.palette.getAccent(),
                border: "none",
                separatorColor: "",
                hoverBackground: "transparent",
            });
            let calendarStyle = new CalendarStyle({
                height: "100%",
                width: "100%",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                dateTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
                dateTextColor: this.themeService.theme.palette.getAccent(),
                dayTextFont: fontHelper(this.themeService.theme.typography.text2),
                dayTextColor: this.themeService.theme.palette.getAccent(),
                monthYearTextFont: fontHelper(this.themeService.theme.typography.text2),
                monthYearTextColor: this.themeService.theme.palette.getAccent(),
                defaultDateTextBackground: "transparent",
                disabledDateTextColor: this.themeService.theme.palette.getAccent400(),
                disabledDateTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
                disabledDateTextBackground: "transparent",
                titleTextFont: fontHelper(this.themeService.theme.typography.text1),
                titleTextColor: this.themeService.theme.palette.getAccent(),
                timezoneTextFont: fontHelper(this.themeService.theme.typography.caption2),
                timezoneTextColor: this.themeService.theme.palette.getAccent(),
                arrowButtonTextColor: this.themeService.theme.palette.getAccent(),
                arrowButtonTextFont: fontHelper(this.themeService.theme.typography.title2),
            });
            let timeSlotStyle = new TimeSlotStyle({
                background: "transparent",
                height: "fit-content",
                width: "100%",
                border: "none",
                borderRadius: "0",
                calendarIconTint: this.themeService.theme.palette.getAccent(),
                timezoneIconTint: this.themeService.theme.palette.getAccent(),
                emptySlotIconTint: this.themeService.theme.palette.getAccent500(),
                emptySlotTextColor: this.themeService.theme.palette.getAccent500(),
                emptySlotTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
                dateTextColor: this.themeService.theme.palette.getAccent(),
                dateTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
                seperatorTint: this.themeService.theme.palette.getAccent100(),
                slotBackground: this.themeService.theme.palette.getAccent900(),
                slotBorder: "none",
                slotBorderRadius: "8px",
                slotTextColor: this.themeService.theme.palette.getAccent(),
                slotTextFont: fontHelper(this.themeService.theme.typography.caption2),
                timezoneTextColor: this.themeService.theme.palette.getAccent(),
                timezoneTextFont: fontHelper(this.themeService.theme.typography.caption2),
                titleTextColor: this.themeService.theme.palette.getAccent(),
                titleTextFont: fontHelper(this.themeService.theme.typography.text1),
            });
            let qucikViewStyle = new QuickViewStyle({
                background: this.themeService.theme.palette.getAccent50(),
                height: "fit-content",
                width: "100%",
                titleFont: fontHelper(this.themeService.theme.typography.subtitle2),
                titleColor: this.themeService.theme.palette.getAccent(),
                subtitleFont: fontHelper(this.themeService.theme.typography.subtitle2),
                subtitleColor: this.themeService.theme.palette.getAccent600(),
                leadingBarTint: this.themeService.theme.palette.getPrimary(),
                leadingBarWidth: "4px",
                borderRadius: "8px",
            });
            return new SchedulerBubbleStyle({
                avatarStyle: avatarStyle,
                listItemStyle: listItemStyle,
                quickViewStyle: qucikViewStyle,
                dateSelectorStyle: calendarStyle,
                timeSlotSelectorStyle: timeSlotStyle,
                backButtonIconTint: this.themeService.theme.palette.getPrimary(),
                background: "transparent",
                height: "100%",
                width: "100%",
                border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
                borderRadius: "8px",
                loadingIconTint: this.themeService.theme.palette.getAccent600(),
                suggestedTimeBackground: this.themeService.theme.palette.getAccent900(),
                suggestedTimeBorder: `1px solid ${this.themeService.theme.palette.getPrimary()}`,
                suggestedTimeBorderRadius: "8px",
                suggestedTimeDisabledBackground: this.themeService.theme.palette.getAccent50(),
                suggestedTimeDisabledBorder: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
                suggestedTimeDisabledBorderRadius: "8px",
                suggestedTimeDisabledTextColor: this.themeService.theme.palette.getAccent700(),
                suggestedTimeDisabledTextFont: fontHelper(this.themeService.theme.typography.text3),
                suggestedTimeTextColor: this.themeService.theme.palette.getPrimary(),
                suggestedTimeTextFont: fontHelper(this.themeService.theme.typography.text3),
                moreButtonDisabledTextBackground: "transparent",
                moreButtonDisabledTextBorder: "none",
                moreButtonDisabledTextBorderRadius: "0",
                moreButtonDisabledTextColor: this.themeService.theme.palette.getAccent600(),
                moreButtonDisabledTextFont: fontHelper(this.themeService.theme.typography.caption2),
                moreButtonTextBackground: "transparent",
                moreButtonTextBorder: "none",
                moreButtonTextBorderRadius: "0",
                moreButtonTextColor: this.themeService.theme.palette.getPrimary(),
                moreButtonTextFont: fontHelper(this.themeService.theme.typography.caption2),
                goalCompletionTextColor: this.themeService.theme.palette.getAccent(),
                goalCompletionTextFont: fontHelper(this.themeService.theme.typography.text3),
                errorTextColor: this.themeService.theme.palette.getError(),
                errorTextFont: fontHelper(this.themeService.theme.typography.text3),
                scheduleButtonStyle: {
                    iconHeight: "20px",
                    iconWidth: "20px",
                    buttonIconTint: this.themeService.theme.palette.getAccent(),
                    buttonTextFont: fontHelper(this.themeService.theme.typography.name),
                    buttonTextColor: this.themeService.theme.palette.getAccent("dark"),
                    border: "none",
                    borderRadius: "8px",
                    background: this.themeService.theme.palette.getPrimary(),
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    padding: "8px",
                },
                seperatorTint: this.themeService.theme.palette.getAccent200(),
                subtitleTextColor: this.themeService.theme.palette.getAccent400(),
                subtitleTextFont: fontHelper(this.themeService.theme.typography.name),
                summaryTextColor: this.themeService.theme.palette.getAccent(),
                summaryTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
                timezoneTextColor: this.themeService.theme.palette.getAccent600(),
                timezoneTextFont: fontHelper(this.themeService.theme.typography.caption2),
                titleTextColor: this.themeService.theme.palette.getAccent(),
                titleTextFont: fontHelper(this.themeService.theme.typography.title1),
                timezoneIconTint: this.themeService.theme.palette.getAccent(),
                calendarIconTint: this.themeService.theme.palette.getAccent(),
                clockIconTint: this.themeService.theme.palette.getAccent(),
            });
        };
        /**
         * Handles when a reaction item is clicked.
         * @param {CometChat.Reaction} reaction - The clicked reaction.
         * @param {CometChat.BaseMessage} message - The message the reaction is associated with.
         */
        this.onReactionItemClicked = (reaction, message) => {
            if (reaction?.getReactedBy()?.getUid() === this.loggedInUser?.getUid()) {
                this.reactToMessage(reaction?.getReaction(), message);
            }
        };
        /**
         * Handles adding a reaction when clicked.
         * @param {CometChat.ReactionCount} reaction - The clicked reaction.
         * @param {CometChat.BaseMessage} message - The message the reaction is associated with.
         */
        this.addReactionOnClick = (reaction, message) => {
            let onReactClick = this.reactionsConfiguration?.reactionClick;
            if (onReactClick) {
                onReactClick(reaction, message);
            }
            else {
                this.reactToMessage(reaction?.getReaction(), message);
            }
        };
        /**
         * Get style object based on message type.
         * @param {CometChat.BaseMessage} message - The message object.
         * @return {object} The style object.
         */
        this.getStatusInfoStyle = (message) => {
            // Base styles that are common for both conditions
            const baseStyle = {
                display: "flex",
                alignItems: "flex-end",
                gap: "1px",
                padding: "8px",
            };
            // If message type is audio or video
            if (this.isAudioOrVideoMessage(message)) {
                return {
                    ...baseStyle,
                    justifyContent: "center",
                    height: "fit-content",
                    borderRadius: "22px",
                    padding: "3px 5px",
                    paddingTop: "2px",
                    position: "relative",
                    marginTop: "-26px",
                    marginRight: "6px",
                    background: this.themeService.theme.palette.getAccent500("dark"),
                    width: "fit-content",
                    alignSelf: "flex-end",
                    marginBottom: "6px",
                };
            }
            // Style for other types of messages
            return {
                ...baseStyle,
                justifyContent: "flex-end",
                alignItems: "flex-end",
                padding: "0px 8px 4px 8px",
            };
        };
        this.wrapperStyle = () => {
            return {
                height: this.messageListStyle.height,
                width: this.messageListStyle.width,
                background: this.messageListStyle.background,
                border: this.messageListStyle.border,
                borderRadius: this.messageListStyle.borderRadius,
            };
        };
        this.listStyle = () => {
            return {
                height: this.showSmartReply ? "92%" : "100%",
            };
        };
        /**
         * Styling for unread thread replies
         * @returns LabelStyle
         */
        this.getUnreadRepliesCountStyle = () => {
            return {
                borderRadius: "10px",
                width: "15px",
                height: "15px",
                border: "none",
                background: this.messageListStyle?.threadReplyUnreadBackground,
                color: this.messageListStyle?.threadReplyUnreadTextColor,
                font: this.messageListStyle?.threadReplyUnreadTextFont,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            };
        };
    }
    ngOnChanges(changes) {
        try {
            if (changes["user"] || changes["group"]) {
                this.chatChanged = true;
            }
            if (changes[CometChatUIKitConstants.MessageReceiverType.user] ||
                changes[CometChatUIKitConstants.MessageReceiverType.group]) {
                this.showConversationStarter = false;
                this.showConversationSummary = false;
                this.conversationStarterReplies = [];
                this.conversationSummary = [];
                this.state = States.loading;
                this.messagesList = [];
                this.ref.detectChanges();
                this.showEnabledExtensions();
                this.numberOfTopScroll = 0;
                if (!this.loggedInUser) {
                    CometChat.getLoggedinUser()
                        .then((user) => {
                        this.loggedInUser = user;
                    })
                        .catch((error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                    });
                }
                this.messagesList = [];
                if (this.user) {
                    if (Object.keys(this.user).length > 1) {
                        this.user = this.user;
                        this.type = CometChatUIKitConstants.MessageReceiverType.user;
                        this.createRequestBuilder();
                    }
                    else {
                        CometChat.getUser(this.user).then((user) => {
                            this.user = user;
                            this.type = CometChatUIKitConstants.MessageReceiverType.user;
                            this.createRequestBuilder();
                        });
                    }
                }
                else if (this.group) {
                    if (Object.keys(this.group).length > 1) {
                        this.group = this.group;
                        this.type = CometChatUIKitConstants.MessageReceiverType.group;
                        this.createRequestBuilder();
                    }
                    else {
                        CometChat.getGroup(this.group).then((group) => {
                            this.group = group;
                            this.type = CometChatUIKitConstants.MessageReceiverType.group;
                            this.createRequestBuilder();
                        });
                    }
                }
                this.scrollToBottom();
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    sendMessage(message, receiverId, receiverType) {
        if (message.getType() == CometChatUIKitConstants.MessageTypes.text) {
            const newMessage = new CometChat.TextMessage(receiverId, message.getText(), receiverType);
            return new Promise((resolve, reject) => {
                CometChatUIKit.sendTextMessage(newMessage)
                    .then((message) => {
                    resolve(message);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        }
        else {
            const uploadedFile = message?.data?.attachments[0];
            const newMessage = new CometChat.MediaMessage(receiverId, "", message.getType(), receiverType);
            let attachment = new CometChat.Attachment(uploadedFile);
            newMessage.setAttachment(attachment);
            return new Promise((resolve, reject) => {
                CometChatUIKit.sendMediaMessage(newMessage)
                    .then((message) => {
                    resolve(message);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        }
    }
    onEmojiKeyboardClosed() {
        if (this.messageToReact) {
            this.messageToReact = null;
            this.ref.detectChanges();
        }
    }
    getCallBubbleTitle(message) {
        if (!message.getSender() ||
            message.getSender().getUid() == this.loggedInUser.getUid()) {
            return localize("YOU_INITIATED_GROUP_CALL");
        }
        else {
            return `${message.getSender().getName()}  ${localize("INITIATED_GROUP_CALL")}`;
        }
    }
    ngOnDestroy() {
        this.showConversationStarter = false;
        this.showConversationSummary = false;
        this.unsubscribeToEvents();
        try {
            //Removing Message Listeners
            CometChat.removeGroupListener(this.groupListenerId);
            CometChat.removeCallListener(this.callListenerId);
            CometChat.removeConnectionListener(this.connectionListenerId);
            this.onTextMessageReceived?.unsubscribe();
            this.onMediaMessageReceived?.unsubscribe();
            this.onMessageReactionAdded?.unsubscribe();
            this.onMessageReactionRemoved?.unsubscribe();
            this.onCustomMessageReceived?.unsubscribe();
            this.onFormMessageReceived?.unsubscribe();
            this.onSchedulerMessageReceived?.unsubscribe();
            this.onCardMessageReceived?.unsubscribe();
            this.onCustomInteractiveMessageReceived?.unsubscribe();
            this.onMessagesDelivered?.unsubscribe();
            this.onMessagesRead?.unsubscribe();
            this.onMessagesDeliveredToAll?.unsubscribe();
            this.onMessagesReadByAll?.unsubscribe();
            this.onMessageDeleted?.unsubscribe();
            this.onMessageEdited?.unsubscribe();
            this.onTransientMessageReceived?.unsubscribe();
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        this.ref.detectChanges();
    }
    /**
     * Creates a new ReactionsStyle object with the defined or default styles.
     *
     * @returns {ReactionsStyle} Returns an instance of ReactionsStyle with the set or default styles.
     */
    getReactionsStyle() {
        const reactionsStyle = this.reactionsConfiguration?.reactionsStyle || {};
        return new ReactionsStyle({
            height: reactionsStyle?.height || "fit-content",
            width: reactionsStyle?.width || "fit-content",
            border: reactionsStyle?.border || "none",
            borderRadius: reactionsStyle?.borderRadius || "0",
            background: reactionsStyle?.background || "transparent",
            activeReactionBackground: reactionsStyle?.activeReactionBackground ||
                this.themeService.theme.palette.getPrimary150(),
            reactionBackground: reactionsStyle?.reactionBackground ||
                this.themeService.theme.palette.getBackground(),
            reactionBorder: reactionsStyle?.reactionBorder ||
                `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            activeReactionBorder: reactionsStyle?.activeReactionBorder ||
                `1px solid ${this.themeService.theme.palette.getPrimary500()}`,
            reactionBorderRadius: reactionsStyle?.reactionBorderRadius || "12px",
            activeReactionCountTextColor: reactionsStyle?.activeReactionCountTextColor ||
                this.themeService.theme.palette.getAccent(),
            activeReactionCountTextFont: reactionsStyle?.activeReactionCountTextFont ||
                fontHelper(this.themeService.theme.typography.caption1),
            reactionCountTextFont: reactionsStyle?.reactionCountTextFont ||
                fontHelper(this.themeService.theme.typography.caption1),
            reactionCountTextColor: reactionsStyle?.reactionCountTextColor ||
                this.themeService.theme.palette.getAccent(),
            reactionBoxShadow: reactionsStyle?.reactionBoxShadow || "rgba(0, 0, 0, 0.1) 0px 4px 12px",
            reactionEmojiFont: reactionsStyle?.reactionEmojiFont ||
                fontHelper(this.themeService.theme.typography.subtitle1),
        });
    }
    getBubbleById(id) {
        let targetBubble;
        this.messageBubbleRef.forEach((bubble) => {
            if (bubble.nativeElement.id === id)
                targetBubble = bubble;
        });
        return targetBubble;
    }
    openMessageInfo(messageObject) {
        this.openMessageInfoPage = true;
        this.messageInfoObject = CometChatUIKitUtility.clone(messageObject);
        this.ref.detectChanges();
    }
    sendMessagePrivately(messageObject) {
        CometChatUIEvents.ccOpenChat.next({ user: messageObject.getSender() });
    }
    getMessageById(id) {
        let messageKey = this.messagesList.findIndex((m) => m.getId() == id);
        if (messageKey > -1) {
            return this.messagesList[messageKey];
        }
        else {
            return false;
        }
    }
    isTranslated(message) {
        let translatedMessageObject = message;
        if (translatedMessageObject &&
            translatedMessageObject?.data?.metadata &&
            translatedMessageObject?.data?.metadata[MessageTranslationConstants.translated_message]) {
            return translatedMessageObject.data.metadata[MessageTranslationConstants.translated_message];
        }
        else {
            return null;
        }
    }
    setOptionsCallback(options, id) {
        options?.forEach((element) => {
            switch (element.id) {
                case CometChatUIKitConstants.MessageOption.deleteMessage:
                    if (!element.onClick) {
                        element.onClick = this.deleteCallback;
                    }
                    break;
                case CometChatUIKitConstants.MessageOption.editMessage:
                    if (!element.onClick) {
                        element.onClick = this.editCallback;
                    }
                    break;
                case CometChatUIKitConstants.MessageOption.translateMessage:
                    if (!element.onClick) {
                        element.onClick = this.translateMessage;
                    }
                    break;
                case CometChatUIKitConstants.MessageOption.copyMessage:
                    if (!element.onClick) {
                        element.onClick = this.copyCallback;
                    }
                    break;
                case CometChatUIKitConstants.MessageOption.reactToMessage:
                    if (!element.onClick || !element.customView) {
                        element.onClick = this.showEmojiKeyboard;
                    }
                    break;
                case CometChatUIKitConstants.MessageOption.replyInThread:
                    if (!element.onClick) {
                        element.onClick = this.threadCallback;
                    }
                    break;
                case CometChatUIKitConstants.MessageOption.sendMessagePrivately:
                    if (!element.onClick) {
                        element.onClick = this.messagePrivatelyCallback;
                    }
                    break;
                case CometChatUIKitConstants.MessageOption.messageInformation:
                    if (!element.onClick) {
                        element.onClick = this.messageInfoCallback;
                    }
                    break;
                default:
                    break;
            }
        });
        return options;
    }
    /**
     * send message options based on type
     * @param  {CometChat.BaseMessage} msgObject
     */
    setMessageOptions(msgObject) {
        let options;
        if (this.messageTemplate &&
            this.messageTemplate.length > 0 &&
            !msgObject?.getDeletedAt() &&
            msgObject?.getType() != CometChatUIKitConstants.MessageTypes.groupMember) {
            this.messageTemplate.forEach((element) => {
                if (msgObject?.getId() &&
                    element.type == msgObject?.getType() &&
                    element?.options) {
                    options =
                        this.setOptionsCallback(element?.options(this.loggedInUser, msgObject, this.themeService.theme, this.group), msgObject?.getId()) || [];
                }
            });
        }
        else {
            options = [];
        }
        options = this.filterEmojiOptions(options);
        return options;
    }
    /**
     * Reacts to a message by either adding or removing the reaction.
     *
     * @param {string} emoji - The emoji used for the reaction.
     * @param {CometChat.BaseMessage} message - The message that was reacted to.
     */
    reactToMessage(emoji, message) {
        const messageId = message?.getId();
        const msgObject = this.getMessageById(messageId);
        const reactions = msgObject?.getReactions() || [];
        const emojiObject = reactions?.find((reaction) => {
            return reaction?.reaction == emoji;
        });
        if (emojiObject && emojiObject?.getReactedByMe()) {
            const updatedReactions = [];
            reactions.forEach((reaction) => {
                if (reaction?.getReaction() == emoji) {
                    if (reaction?.getCount() === 1) {
                        return;
                    }
                    else {
                        reaction.setCount(reaction?.getCount() - 1);
                        reaction.setReactedByMe(false);
                        updatedReactions.push(reaction);
                    }
                }
                else {
                    updatedReactions.push(reaction);
                }
            });
            msgObject.setReactions(updatedReactions);
            this.updateMessage(msgObject);
            CometChat.removeReaction(messageId, emoji)
                .then((message) => { })
                .catch((error) => {
                // Return old message object instead of
                this.updateMessage(msgObject); //need changes
                console.log(error);
            });
        }
        else {
            const updatedReactions = [];
            const reactionAvailable = reactions.find((reaction) => {
                return reaction?.getReaction() == emoji;
            });
            reactions.forEach((reaction) => {
                if (reaction?.getReaction() == emoji) {
                    reaction.setCount(reaction?.getCount() + 1);
                    reaction.setReactedByMe(true);
                    updatedReactions.push(reaction);
                }
                else {
                    updatedReactions.push(reaction);
                }
            });
            if (!reactionAvailable) {
                const react = new CometChat.ReactionCount(emoji, 1, true);
                updatedReactions.push(react);
            }
            msgObject.setReactions(updatedReactions);
            this.updateMessage(msgObject);
            CometChat.addReaction(messageId, emoji)
                .then((response) => { })
                .catch((error) => {
                console.log(error);
                this.updateMessage(msgObject);
            });
        }
    }
    getClonedReactionObject(message) {
        return CometChatUIKitUtility.clone(message);
    }
    /**
     * passing style based on message object
     * @param  {CometChat.BaseMessage} messageObject
     */
    setMessageBubbleStyle(msg) {
        let style;
        if (msg?.getDeletedAt()) {
            style = {
                background: "transparent",
                border: `1px dashed ${this.themeService.theme.palette.getAccent400()}`,
                borderRadius: "12px",
            };
        }
        else if (msg?.getType() == CometChatUIKitConstants.calls.meeting &&
            (!msg?.getSender() ||
                msg?.getSender().getUid() == this.loggedInUser.getUid())) {
            style = {
                background: this.themeService.theme.palette.getPrimary(),
                border: `none`,
                borderRadius: "12px",
            };
            // } else if (this.getLinkPreview(msg as CometChat.TextMessage)) {
            //   style = {
            //     borderRadius: "8px",
            //     background: this.themeService.theme.palette.getAccent100(),
            //   };
        }
        else if (msg?.getType() == StickersConstants.sticker) {
            style = {
                background: "transparent",
                borderRadius: "12px",
            };
        }
        else if (!msg?.getDeletedAt() &&
            msg?.getCategory() == CometChatUIKitConstants.MessageCategory.message &&
            msg?.getType() == CometChatUIKitConstants.MessageTypes.text &&
            (!msg?.getSender() ||
                this.loggedInUser.getUid() == msg?.getSender().getUid())) {
            style = {
                background: this.alignment == MessageListAlignment.left
                    ? this.themeService.theme.palette.getAccent100()
                    : this.themeService.theme.palette.getPrimary(),
                borderRadius: "12px",
            };
        }
        else if (!msg?.getDeletedAt() &&
            msg?.getCategory() == CometChatUIKitConstants.MessageCategory.message &&
            msg?.getType() == CometChatUIKitConstants.MessageTypes.audio) {
            style = {
                borderRadius: "",
                background: this.themeService.theme.palette.getSecondary(),
            };
        }
        else if (msg?.getType() == CometChatUIKitConstants.MessageTypes.groupMember ||
            msg?.getCategory() == this.callConstant) {
            style = {
                background: "transparent",
                borderRadius: "12px",
                border: `1px solid ${this.themeService.theme.palette.getSecondary()}`,
            };
        }
        else if (!msg?.getDeletedAt() &&
            msg?.getCategory() === CometChatUIKitConstants.MessageCategory.interactive) {
            return {
                background: this.themeService.theme.palette.getSecondary(),
                width: "300px",
            };
        }
        else {
            if (msg?.getSender() &&
                msg?.getSender().getUid() != this.loggedInUser.getUid()) {
                style = {
                    background: this.themeService.theme.palette.getSecondary(),
                    borderRadius: "12px",
                };
            }
            else {
                style = {
                    background: this.themeService.theme.palette.getSecondary(),
                    borderRadius: "12px",
                };
            }
        }
        return style;
    }
    getSessionId(message) {
        let data = message.getData();
        return data?.customData?.sessionID;
    }
    getWhiteboardDocument(message) {
        try {
            if (message?.getData()) {
                var data = message.getData();
                if (data?.metadata) {
                    var metadata = data?.metadata;
                    if (CometChatUIKitUtility.checkHasOwnProperty(metadata, "@injected")) {
                        var injectedObject = metadata["@injected"];
                        if (injectedObject?.extensions) {
                            var extensionObject = injectedObject.extensions;
                            return extensionObject[CollaborativeWhiteboardConstants.whiteboard]
                                ? extensionObject[CollaborativeWhiteboardConstants.whiteboard]
                                    .board_url
                                : extensionObject[CollaborativeDocumentConstants.document]
                                    .document_url;
                        }
                    }
                }
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    openLinkURL(event) {
        window.open(event?.detail?.url, "_blank");
    }
    getSticker(message) {
        try {
            let stickerData = null;
            if (CometChatUIKitUtility.checkHasOwnProperty(message, StickersConstants.data) &&
                CometChatUIKitUtility.checkHasOwnProperty(message.getData(), StickersConstants.custom_data)) {
                stickerData = message.data.customData;
                if (CometChatUIKitUtility.checkHasOwnProperty(stickerData, StickersConstants.sticker_url)) {
                    return stickerData.sticker_url;
                }
                else {
                    return "";
                }
            }
            else {
                return "";
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    /**
     * Checks if the 'headerView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getHeaderView(message) {
        let view = null;
        if (this.messageTypesMap[message.getCategory() + '_' + message?.getType()] &&
            this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.headerView) {
            view = this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.headerView(message);
            return view;
        }
        else {
            return null;
        }
    }
    /**
     * Checks if the 'footerView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getFooterView(message) {
        let view = null;
        if (this.messageTypesMap[message.getCategory() + '_' + message?.getType()] &&
            this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.footerView) {
            view = this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.footerView(message);
            return view;
        }
        else {
            return null;
        }
    }
    /**
     * Checks if the 'bottomView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getBottomView(message) {
        if (this.messageTypesMap[message.getCategory() + '_' + message?.getType()] &&
            this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.bottomView) {
            return this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.bottomView(message);
        }
        else {
            return null;
        }
    }
    /**
     * Checks if the 'statusInfoView' is present in the default template provided by the user
     * If present, returns the user-defined template, otherwise returns null.
     *
     * @param message Message object for which the status info view needs to be fetched
     * @returns User-defined TemplateRef if present, otherwise null
     */
    getStatusInfoView(message) {
        if (this.messageTypesMap[message.getCategory() + '_' + message?.getType()] &&
            this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.statusInfoView) {
            return this.messageTypesMap[message.getCategory() + '_' + message?.getType()]?.statusInfoView(message);
        }
        else {
            return null;
        }
    }
    isAudioOrVideoMessage(message) {
        const messageType = message?.getType();
        const typesToCheck = [
            CometChatUIKitConstants.MessageTypes.image,
            CometChatUIKitConstants.MessageTypes.video,
        ];
        return typesToCheck.includes(messageType);
    }
    getFormMessageBubbleStyle() {
        const textStyle = new InputStyle({
            width: "100%",
            height: "30px",
            border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            borderRadius: "6px",
            padding: "0px 0px 0px 5px",
            placeholderTextColor: this.themeService.theme.palette.getAccent400(),
            placeholderTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            textFont: fontHelper(this.themeService.theme.typography.subtitle2),
            textColor: this.themeService.theme.palette.getAccent(),
            background: this.themeService.theme.palette.getBackground(),
        });
        const labelStyle = new LabelStyle({
            textFont: fontHelper(this.themeService.theme.typography.subtitle1),
            textColor: this.themeService.theme.palette.getAccent(),
            background: "transparent",
        });
        const radioButtonStyle = new RadioButtonStyle({
            height: "16px",
            width: "16px",
            border: "none",
            labelTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            labelTextColor: this.themeService.theme.palette.getAccent600(),
            borderRadius: "4px",
            background: "",
        });
        const checkboxStyle = new CheckboxStyle({
            height: "16px",
            width: "16px",
            border: "none",
            borderRadius: "4px",
            background: "",
            labelTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            labelTextColor: this.themeService.theme.palette.getAccent(),
        });
        const dropdownStyle = new DropdownStyle({
            height: "35px",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            borderRadius: "6px",
            activeTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            activeTextColor: this.themeService.theme.palette.getAccent(),
            arrowIconTint: this.themeService.theme.palette.getAccent700(),
            textFont: fontHelper(this.themeService.theme.typography.subtitle2),
            textColor: this.themeService.theme.palette.getAccent(),
            optionBackground: this.themeService.theme.palette.getBackground(),
            optionBorder: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            optionHoverBorder: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            hoverTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            hoverTextColor: this.themeService.theme.palette.getAccent(),
            hoverTextBackground: this.themeService.theme.palette.getAccent100(),
        });
        const buttonGroupStyle = {
            height: "40px",
            width: "100%",
            background: this.themeService.theme.palette.getPrimary(),
            border: `none`,
            borderRadius: "6px",
            buttonTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            buttonTextColor: this.themeService.theme.palette.getBackground(),
            justifyContent: "center",
        };
        const singleSelectStyle = new SingleSelectStyle({
            height: "100%",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            border: "none",
            borderRadius: "12px",
            activeTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            activeTextColor: this.themeService.theme.palette.getAccent(),
            activeTextBackground: this.themeService.theme.palette.getAccent100(),
            textFont: fontHelper(this.themeService.theme.typography.subtitle2),
            textColor: this.themeService.theme.palette.getAccent(),
            optionBackground: this.themeService.theme.palette.getBackground(),
            optionBorder: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            optionBorderRadius: "3px",
            hoverTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            hoverTextColor: this.themeService.theme.palette.getAccent(),
            hoverTextBackground: this.themeService.theme.palette.getAccent100(),
        });
        const quickViewStyle = new QuickViewStyle({
            background: "transparent",
            height: "fit-content",
            width: "100%",
            titleFont: fontHelper(this.themeService.theme.typography.subtitle2),
            titleColor: this.themeService.theme.palette.getPrimary(),
            subtitleFont: fontHelper(this.themeService.theme.typography.subtitle2),
            subtitleColor: this.themeService.theme.palette.getAccent600(),
            leadingBarTint: this.themeService.theme.palette.getPrimary(),
            leadingBarWidth: "4px",
            borderRadius: "8px",
        });
        return new FormBubbleStyle({
            width: "300px",
            height: "fit-content",
            border: "none",
            background: "transparent",
            wrapperBackground: this.themeService.theme.palette.getBackground(),
            borderRadius: "8px",
            wrapperBorderRadius: "8px",
            textInputStyle: textStyle,
            labelStyle: labelStyle,
            radioButtonStyle: radioButtonStyle,
            checkboxStyle: checkboxStyle,
            dropdownStyle: dropdownStyle,
            buttonStyle: buttonGroupStyle,
            singleSelectStyle: singleSelectStyle,
            quickViewStyle: quickViewStyle,
            titleColor: this.themeService.theme.palette.getAccent(),
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            goalCompletionTextColor: this.themeService.theme.palette.getAccent(),
            goalCompletionTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            wrapperPadding: "2px",
            datePickerBorder: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            datePickerBorderRadius: "6px",
            datePickerFont: fontHelper(this.themeService.theme.typography.subtitle2),
            datePickerFontColor: this.themeService.theme.palette.getAccent(),
        });
    }
    getCardMessageBubbleStyle() {
        const buttonStyle = {
            height: "40px",
            width: "100%",
            background: "transparent",
            border: `none`,
            borderRadius: "0px",
            buttonTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            buttonTextColor: `${this.themeService.theme.palette.getPrimary()}`,
            justifyContent: "center",
        };
        return new CardBubbleStyle({
            background: "transparent",
            borderRadius: "8px",
            height: "fit-content",
            width: "300px",
            imageHeight: "auto",
            imageWidth: "100%",
            imageRadius: "8px",
            imageBackgroundColor: "transparent",
            descriptionFontColor: this.themeService.theme.palette.getAccent(),
            descriptionFont: fontHelper(this.themeService.theme.typography.subtitle2),
            buttonStyle: buttonStyle,
            dividerTintColor: this.themeService.theme.palette.getAccent100(),
            wrapperBackground: this.themeService.theme.palette.getBackground(),
            wrapperBorderRadius: "8px",
            wrapperPadding: "2px",
            disabledButtonColor: this.themeService.theme.palette.getAccent600(),
        });
    }
    getCallBubbleStyle(message) {
        var isLeftAligned = this.alignment == MessageListAlignment.left;
        var isUserSentMessage = !message?.getSender() ||
            this.loggedInUser.getUid() === message?.getSender().getUid();
        if (isUserSentMessage && !isLeftAligned) {
            return {
                titleFont: fontHelper(this.themeService.theme.typography.text2),
                titleColor: this.themeService.theme.palette.getAccent("dark"),
                iconTint: this.themeService.theme.palette.getAccent("dark"),
                buttonTextFont: fontHelper(this.themeService.theme.typography.text2),
                buttonTextColor: this.themeService.theme.palette.getPrimary(),
                buttonBackground: this.themeService.theme.palette.getAccent("dark"),
                width: "240px",
            };
        }
        else {
            return {
                titleFont: fontHelper(this.themeService.theme.typography.text2),
                titleColor: this.themeService.theme.palette.getAccent(),
                iconTint: this.themeService.theme.palette.getPrimary(),
                buttonTextFont: fontHelper(this.themeService.theme.typography.text2),
                buttonTextColor: this.themeService.theme.palette.getPrimary(),
                buttonBackground: this.themeService.theme.palette.getAccent("dark"),
                width: "240px",
            };
        }
    }
    getBubbleAlignment(message) {
        return this.alignment == MessageListAlignment.left ||
            (message.getSender() &&
                message.getSender().getUid() != this.loggedInUser.getUid())
            ? MessageBubbleAlignment.left
            : MessageBubbleAlignment.right;
    }
    getCallTypeIcon(message) {
        if (message.getType() == CometChatUIKitConstants.MessageTypes.audio) {
            return "assets/Audio-Call.svg";
        }
        else {
            return "assets/Video-call.svg";
        }
    }
    callStatusStyle(message) {
        if (message.getCategory() == this.callConstant) {
            let missedCallTextColor = CallingDetailsUtils.isMissedCall(message, this.loggedInUser)
                ? this.themeService.theme.palette.getError()
                : this.themeService.theme.palette.getAccent600();
            return {
                buttonTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
                buttonTextColor: missedCallTextColor,
                borderRadius: "10px",
                border: "none",
                buttonIconTint: missedCallTextColor,
                background: "transparent",
                iconBackground: "transparent",
                padding: "8px 12px",
                gap: "4px",
                height: "25px",
                justifyContent: "center",
            };
        }
        else {
            return null;
        }
    }
    setFileBubbleStyle(message) {
        var isFileMessage = message.getCategory() ===
            CometChatUIKitConstants.MessageCategory.message &&
            message?.getType() === CometChatUIKitConstants.MessageTypes.file;
        if (isFileMessage) {
            return {
                titleFont: fontHelper(this.theme.typography.subtitle1),
                titleColor: this.themeService.theme.palette.getAccent(),
                subtitleFont: fontHelper(this.theme.typography.subtitle2),
                subtitleColor: this.themeService.theme.palette.getAccent600(),
                iconTint: this.themeService.theme.palette.getPrimary(),
            };
        }
        else {
            return;
        }
    }
    ngAfterViewInit() {
        this.ioBottom();
        this.ioTop();
        this.checkMessageTemplate();
    }
    getStartCallFunction(message) {
        let sessionId = this.getSessionId(message);
        let callback = this.callbacks.get(sessionId);
        if (!callback) {
            callback = (sessionId) => this.startDirectCall(sessionId, message);
            this.callbacks.set(sessionId, callback);
        }
        return callback;
    }
    /**
     * Extracting  types and categories from template
     *
     */
    checkMessageTemplate() {
        this.typesMap = {
            [CometChatUIKitConstants.MessageCategory.message + '_' + CometChatUIKitConstants.MessageTypes.text]: this.textBubble,
            [CometChatUIKitConstants.MessageCategory.message + '_' + CometChatUIKitConstants.MessageTypes.file]: this.fileBubble,
            [CometChatUIKitConstants.MessageCategory.message + '_' + CometChatUIKitConstants.MessageTypes.audio]: this.audioBubble,
            [CometChatUIKitConstants.MessageCategory.message + '_' + CometChatUIKitConstants.MessageTypes.video]: this.videoBubble,
            [CometChatUIKitConstants.MessageCategory.message + '_' + CometChatUIKitConstants.MessageTypes.image]: this.imageBubble,
            [CometChatUIKitConstants.MessageCategory.action + '_' + CometChatUIKitConstants.MessageTypes.groupMember]: this.textBubble,
            custom_extension_sticker: this.stickerBubble,
            custom_extension_whiteboard: this.whiteboardBubble,
            custom_extension_document: this.documentBubble,
            custom_extension_poll: this.pollBubble,
            custom_meeting: this.directCalling,
            [CometChatUIKitConstants.MessageCategory.call + '_' + CometChatUIKitConstants.MessageTypes.audio]: this.audioBubble,
            [CometChatUIKitConstants.MessageCategory.call + '_' + CometChatUIKitConstants.MessageTypes.video]: this.videoBubble,
            [CometChatUIKitConstants.MessageCategory.interactive + '_' + CometChatUIKitConstants.MessageTypes.scheduler]: this.schedulerBubble,
            [CometChatUIKitConstants.MessageCategory.interactive + '_' + CometChatUIKitConstants.MessageTypes.form]: this.formBubble,
            [CometChatUIKitConstants.MessageCategory.interactive + '_' + CometChatUIKitConstants.MessageTypes.card]: this.cardBubble,
        };
        if (this.messageTemplate.length <= 0) {
            this.createRequestBuilder();
        }
        this.setBubbleView();
    }
    getPollBubbleData(message, type) {
        let data = message.getCustomData();
        if (type) {
            return data[type];
        }
        else {
            return message.getSender().getUid();
        }
    }
    getThreadCount(message) {
        var replyCount = message?.getReplyCount() || 0;
        var suffix = replyCount === 1 ? localize("REPLY") : localize("REPLIES");
        return `${replyCount} ${suffix}`;
    }
    showEnabledExtensions() {
        if (ChatConfigurator.names.includes("textmoderator")) {
            this.enableDataMasking = true;
        }
        if (ChatConfigurator.names.includes("thumbnailgeneration")) {
            this.enableThumbnailGeneration = true;
        }
        if (ChatConfigurator.names.includes("linkpreview")) {
            this.enableLinkPreview = true;
        }
        if (ChatConfigurator.names.includes("polls")) {
            this.enablePolls = true;
        }
        if (ChatConfigurator.names.includes("reactions")) {
            this.enableReactions = true;
        }
        if (ChatConfigurator.names.includes("imagemoderation")) {
            this.enableImageModeration = true;
        }
        if (ChatConfigurator.names.includes("stickers")) {
            this.enableStickers = true;
        }
        if (ChatConfigurator.names.includes("collaborativewhiteboard")) {
            this.enableWhiteboard = true;
        }
        if (ChatConfigurator.names.includes("collaborativedocument")) {
            this.enableDocument = true;
        }
        if (ChatConfigurator.names.includes("calling")) {
            this.enableCalling = true;
        }
        if (ChatConfigurator.names.includes("aiconversationstarter")) {
            this.enableConversationStarter = true;
        }
        if (ChatConfigurator.names.includes("aiconversationsummary")) {
            this.enableConversationSummary = true;
        }
    }
    openImageInFullScreen(message) {
        this.imageurlToOpen = message?.data?.attachments[0]?.url;
        this.openFullscreenView = true;
        this.ref.detectChanges();
    }
    closeImageInFullScreen() {
        this.imageurlToOpen = "";
        this.openFullscreenView = false;
        this.ref.detectChanges();
    }
    openWarningDialog(event) {
        this.closeImageModeration = event?.detail?.onConfirm;
        this.openConfirmDialog = true;
        this.ref.detectChanges();
    }
    onCancelClick() {
        this.openConfirmDialog = false;
        this.ref.detectChanges();
    }
    getTextMessage(message) {
        var text = this.enableDataMasking
            ? CometChatUIKitUtility.getExtensionData(message)
            : null;
        return text?.trim()?.length > 0 ? text : message.getText();
    }
    getLinkPreview(message) {
        try {
            if (message?.getMetadata() && this.enableLinkPreview) {
                var metadata = message.getMetadata();
                var injectedObject = metadata[LinkPreviewConstants.injected];
                if (injectedObject && injectedObject?.extensions) {
                    var extensionsObject = injectedObject.extensions;
                    if (extensionsObject &&
                        CometChatUIKitUtility.checkHasOwnProperty(extensionsObject, LinkPreviewConstants.link_preview)) {
                        var linkPreviewObject = extensionsObject[LinkPreviewConstants.link_preview];
                        if (linkPreviewObject &&
                            CometChatUIKitUtility.checkHasOwnProperty(linkPreviewObject, LinkPreviewConstants.links) &&
                            linkPreviewObject[LinkPreviewConstants.links].length) {
                            return linkPreviewObject[LinkPreviewConstants.links][0];
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        return null;
                    }
                }
            }
            else {
                return null;
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    getImageThumbnail(msg) {
        var message = msg;
        let imageURL = "";
        if (this.enableThumbnailGeneration) {
            try {
                var metadata = message.getMetadata();
                var injectedObject = metadata?.[ThumbnailGenerationConstants.injected];
                var extensionsObject = injectedObject?.extensions;
                var thumbnailGenerationObject = extensionsObject[ThumbnailGenerationConstants.thumbnail_generation];
                var imageToDownload = thumbnailGenerationObject?.url_medium;
                if (imageToDownload) {
                    imageURL = imageToDownload;
                }
                else {
                    imageURL = message?.data?.attachments
                        ? message?.data?.attachments[0]?.url
                        : "";
                }
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        }
        else {
            imageURL = message?.data?.attachments
                ? message?.data?.attachments[0]?.url
                : "";
        }
        return imageURL;
    }
    getLinkPreviewDetails(key, message) {
        let linkPreviewObject = this.getLinkPreview(message);
        if (Object.keys(linkPreviewObject).length > 0) {
            return linkPreviewObject[key];
        }
        else {
            return "";
        }
    }
    ngOnInit() {
        this.isWebsocketReconnected = false;
        this.firstReload = true;
        this.setMessagesStyle();
        this.setAvatarStyle();
        this.setDateStyle();
        this.subscribeToEvents();
        this.addMessageEventListeners();
        this.setOngoingCallStyle();
        this.state = States.loading;
        CometChat.getLoggedinUser()
            .then((user) => {
            this.loggedInUser = user;
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        this.dateSeparatorStyle.background =
            this.dateSeparatorStyle.background ||
                this.themeService.theme.palette.getAccent600();
        this.dividerStyle.background =
            this.themeService.theme.palette.getAccent100();
        this.labelStyle.textColor = this.messageListStyle.nameTextColor || this.labelStyle.textColor;
        this.labelStyle.textFont = this.messageListStyle.nameTextFont || this.labelStyle.textFont;
        this.loadingStyle.iconTint = this.messageListStyle.loadingIconTint || this.loadingStyle.iconTint;
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "28px",
            height: "28px",
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
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
            textFont: fontHelper(this.themeService.theme.typography.subtitle2),
            textColor: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            height: "100%",
            width: "100%",
            border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            borderRadius: "8px",
            padding: "6px 12px",
        });
        this.dateSeparatorStyle = { ...defaultStyle, ...this.dateSeparatorStyle };
    }
    setMessagesStyle() {
        this.popoverStyle = {
            height: "330px",
            width: "325px",
            border: `none`,
            borderRadius: "8px",
            boxShadow: `${this.themeService.theme.palette.getAccent400()} 0px 0px 8px`
        };
        let defaultEmojiStyle = {
            height: "330px",
            width: "325px",
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            borderRadius: "8px",
            ...this.emojiKeyboardStyle
        };
        this.emojiKeyboardStyle = defaultEmojiStyle;
        this.unreadMessagesStyle = {
            height: "100%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            border: "none",
            borderRadius: "12px",
            padding: "8px",
            background: this.themeService.theme.palette.getPrimary(),
            buttonTextColor: this.themeService.theme.palette.getAccent("dark"),
            buttonTextFont: fontHelper(this.themeService.theme.typography.text3),
        };
        this.smartReplyStyle = {
            replyTextFont: fontHelper(this.themeService.theme.typography.caption1),
            replyTextColor: this.themeService.theme.palette.getAccent(),
            replyBackground: this.themeService.theme.palette.getBackground(),
            boxShadow: `0px 0px 1px ${this.themeService.theme.palette.getAccent600()}`,
            closeIconTint: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            ...this.smartReplyStyle,
        };
        this.conversationStarterStyle = {
            replyTextFont: fontHelper(this.themeService.theme.typography.caption1),
            replyTextColor: this.themeService.theme.palette.getAccent(),
            replyBackground: this.themeService.theme.palette.getBackground(),
            boxShadow: `0px 0px 1px ${this.themeService.theme.palette.getAccent600()}`,
            closeIconTint: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            ...this.conversationStarterStyle,
        };
        this.conversationSummaryStyle = {
            ...this.conversationSummaryStyle,
            width: "100%",
            height: "fit-content",
            borderRadius: "8px",
            background: this.themeService.theme.palette.getBackground(),
            boxShadow: `0px 0px 1px ${this.themeService.theme.palette.getAccent600()}`,
            textFont: fontHelper(this.themeService.theme.typography.caption2),
            closeIconTint: this.themeService.theme.palette.getAccent600(),
            textColor: this.themeService.theme.palette.getAccent(),
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            border: "1px solid #6851D6",
        };
        this.fullScreenViewerStyle.closeIconTint =
            this.themeService.theme.palette.getPrimary();
        let defaultStyle = new MessageListStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `none`,
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            nameTextFont: fontHelper(this.themeService.theme.typography.caption2),
            nameTextColor: this.themeService.theme.palette.getAccent600(),
            threadReplyTextFont: fontHelper(this.themeService.theme.typography.text2),
            threadReplyIconTint: this.themeService.theme.palette.getAccent500(),
            threadReplyTextColor: this.themeService.theme.palette.getAccent(),
            threadReplyUnreadBackground: this.themeService.theme.palette.getPrimary(),
            threadReplyUnreadTextColor: this.themeService.theme.palette.getAccent900(),
            threadReplyUnreadTextFont: fontHelper(this.themeService.theme.typography.caption2),
            TimestampTextFont: fontHelper(this.themeService.theme.typography.caption3),
        });
        this.messageListStyle = { ...defaultStyle, ...this.messageListStyle };
        this.linkPreviewStyle = new LinkPreviewStyle({
            titleColor: this.themeService.theme.palette.getAccent(),
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            descriptionColor: this.themeService.theme.palette.getAccent600(),
            descriptionFont: fontHelper(this.themeService.theme.typography.subtitle2),
            background: "transparent",
            height: "100%",
            width: "100%",
        });
        this.documentBubbleStyle = {
            titleFont: fontHelper(this.themeService.theme.typography.text2),
            titleColor: this.themeService.theme.palette.getAccent(),
            subtitleFont: fontHelper(this.themeService.theme.typography.subtitle2),
            subtitleColor: this.themeService.theme.palette.getAccent600(),
            iconTint: this.themeService.theme.palette.getAccent700(),
            buttonTextFont: fontHelper(this.themeService.theme.typography.text2),
            buttonTextColor: this.themeService.theme.palette.getPrimary(),
            buttonBackground: "transparent",
            separatorColor: this.themeService.theme.palette.getAccent200(),
        };
        this.pollBubbleStyle = {
            borderRadius: "8px",
            background: "transparent",
            votePercentTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            votePercentTextColor: this.themeService.theme.palette.getAccent600(),
            pollQuestionTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            pollQuestionTextColor: this.themeService.theme.palette.getAccent(),
            pollOptionTextFont: fontHelper(this.themeService.theme.typography.text2),
            pollOptionTextColor: this.themeService.theme.palette.getAccent(),
            pollOptionBackground: this.themeService.theme.palette.getAccent900(),
            optionsIconTint: this.themeService.theme.palette.getAccent600(),
            totalVoteCountTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            totalVoteCountTextColor: this.themeService.theme.palette.getAccent600(),
            selectedPollOptionBackground: this.themeService.theme.palette.getAccent200(),
            userSelectedOptionBackground: this.themeService.theme.palette.getPrimary(),
            pollOptionBorder: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            pollOptionBorderRadius: "8px",
        };
        this.imageModerationStyle = {
            filterColor: this.themeService.theme.palette.getPrimary(),
            height: "100%",
            width: "100%",
            border: "none",
            warningTextColor: this.themeService.theme.palette.getAccent("dark"),
            warningTextFont: fontHelper(this.themeService.theme.typography.title2),
            borderRadius: "8px",
        };
        this.confirmDialogStyle = {
            confirmButtonBackground: this.themeService.theme.palette.getError(),
            cancelButtonBackground: this.themeService.theme.palette.getSecondary(),
            confirmButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
            confirmButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            cancelButtonTextColor: this.themeService.theme.palette.getAccent900("dark"),
            cancelButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            messageTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            messageTextColor: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            height: "100%",
            width: "100%",
            border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
            borderRadius: "8px",
        };
    }
    getReceiptStyle(message) {
        const isTextMessage = message?.getType() === CometChatUIKitConstants.MessageTypes.text &&
            this.alignment != MessageListAlignment.left;
        this.receiptStyle = new ReceiptStyle({
            waitIconTint: this.themeService.theme.palette.getAccent700(),
            sentIconTint: this.themeService.theme.palette.getAccent600(),
            deliveredIconTint: this.themeService.theme.palette.getAccent600(),
            readIconTint: isTextMessage
                ? this.themeService.theme.palette.getBackground()
                : this.themeService.theme.palette.getPrimary(),
            errorIconTint: this.themeService.theme.palette.getError(),
            height: "11px",
            width: "12px",
            background: "transparent"
        });
        return { ...this.receiptStyle };
    }
    createRequestBuilder() {
        if (!this.templates || this.templates?.length == 0) {
            this.messageTemplate =
                ChatConfigurator.getDataSource().getAllMessageTemplates();
            this.categories =
                ChatConfigurator.getDataSource().getAllMessageCategories();
            this.types = ChatConfigurator.getDataSource().getAllMessageTypes();
        }
        else {
            this.messageTemplate = this.templates;
        }
        this.state = States.loading;
        this.requestBuilder = null;
        if (this.user || this.group) {
            if (this.user) {
                this.requestBuilder = this.messagesRequestBuilder
                    ? CometChatUIKitUtility.clone(this.messagesRequestBuilder)
                    : new CometChat.MessagesRequestBuilder()
                        .setLimit(this.limit)
                        .setTypes(this.types)
                        .setCategories(this.categories)
                        .hideReplies(true);
                this.requestBuilder = this.requestBuilder.setUID(this.user.getUid()).build();
            }
            else {
                this.requestBuilder = this.messagesRequestBuilder
                    ? CometChatUIKitUtility.clone(this.messagesRequestBuilder)
                    : new CometChat.MessagesRequestBuilder()
                        .setLimit(this.limit)
                        .setTypes(this.types)
                        .hideReplies(true)
                        .setCategories(this.categories);
                this.requestBuilder = this.requestBuilder.setGUID(this.group?.getGuid()).build();
            }
            this.computeUnreadCount();
            this.fetchPreviousMessages();
        }
    }
    computeUnreadCount() {
        if (this.user || this.group) {
            if (this.user) {
                CometChat.getUnreadMessageCountForUser(this.user?.getUid()).then((res) => {
                    const dynamicKey = this.user?.getUid();
                    this.getUnreadCount = res[dynamicKey];
                }, (error) => { });
            }
            else {
                CometChat.getUnreadMessageCountForGroup(this.group?.getGuid()).then((res) => {
                    const dynamicKey = this.group?.getGuid();
                    this.getUnreadCount = res[dynamicKey];
                }, (error) => { });
            }
        }
    }
    getActionMessage(message) {
        const msg = new MessageUtils().getActionMessage(message);
        return msg ?? message.getMessage();
    }
    fetchActionMessages() {
        let requestBuilder = new CometChat.MessagesRequestBuilder()
            .setType(CometChatUIKitConstants.MessageCategory.message)
            .setCategory(CometChatUIKitConstants.MessageCategory.action)
            .setMessageId(this.lastMessageId)
            .setLimit(this.limit);
        if (this.user) {
            requestBuilder.setUID(this.user?.getUid());
        }
        else if (this.group) {
            requestBuilder.setGUID(this.group?.getGuid());
        }
        requestBuilder.build()
            .fetchNext()
            .then((messages) => {
            if (messages && messages.length > 0) {
                messages.forEach((message) => {
                    if (message.getActionOn() instanceof
                        CometChat.BaseMessage) {
                        let messageKey = this.messagesList.findIndex((m) => m.getId() ===
                            message.getActionOn().getId());
                        if (messageKey >= 0) {
                            this.messagesList[messageKey] = message.getActionOn();
                        }
                    }
                });
                this.messagesList = [...this.messagesList];
                this.ref.detectChanges();
            }
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
            if (this.messagesList?.length <= 0) {
                this.state = States.error;
                this.ref.detectChanges();
            }
        });
    }
    attachConnectionListener() {
        CometChat.addConnectionListener(this.connectionListenerId, new CometChat.ConnectionListener({
            onConnected: () => {
                this.isWebsocketReconnected = true;
                this.fetchNextMessage();
                console.log("ConnectionListener => connected");
            },
            onDisconnected: () => {
                this.isWebsocketReconnected = false;
                console.log("ConnectionListener => On Disconnected");
            },
        }));
    }
    addMessageEventListeners() {
        try {
            CometChat.addGroupListener(this.groupListenerId, new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    this.messageUpdate(CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE, message, changedGroup, { user: changedUser, scope: newScope });
                },
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    this.messageUpdate(CometChatUIKitConstants.groupMemberAction.KICKED, message, kickedFrom, {
                        user: kickedUser,
                        hasJoined: false,
                    });
                },
                onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                    this.messageUpdate(CometChatUIKitConstants.groupMemberAction.BANNED, message, bannedFrom, {
                        user: bannedUser,
                    });
                },
                onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                    this.messageUpdate(CometChatUIKitConstants.groupMemberAction.UNBANNED, message, unbannedFrom, { user: unbannedUser });
                },
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                    this.messageUpdate(CometChatUIKitConstants.groupMemberAction.ADDED, message, userAddedIn, {
                        user: userAdded,
                        hasJoined: true,
                    });
                },
                onGroupMemberLeft: (message, leavingUser, group) => {
                    this.messageUpdate(CometChatUIKitConstants.groupMemberAction.LEFT, message, group, {
                        user: leavingUser,
                    });
                },
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                    this.messageUpdate(CometChatUIKitConstants.groupMemberAction.JOINED, message, joinedGroup, {
                        user: joinedUser,
                    });
                },
            }));
            if (this.enableCalling) {
                CometChat.addCallListener(this.callListenerId, new CometChat.CallListener({
                    onIncomingCallReceived: (call) => {
                        if (this.isPartOfCurrentChatForSDKEvent(call)) {
                            this.addMessage(call);
                        }
                    },
                    onIncomingCallCancelled: (call) => {
                        if (this.isPartOfCurrentChatForSDKEvent(call)) {
                            this.addMessage(call);
                        }
                    },
                    onOutgoingCallRejected: (call) => {
                        if (this.isPartOfCurrentChatForSDKEvent(call)) {
                            this.addMessage(call);
                        }
                    },
                    onOutgoingCallAccepted: (call) => {
                        if (this.isPartOfCurrentChatForSDKEvent(call)) {
                            this.addMessage(call);
                        }
                    },
                    onCallEndedMessageReceived: (call) => {
                        if (this.isPartOfCurrentChatForSDKEvent(call)) {
                            this.addMessage(call);
                        }
                    },
                }));
            }
            if (!this.disableReactions) {
                this.onMessageReactionAdded =
                    CometChatMessageEvents.onMessageReactionAdded.subscribe((reactionReceipt) => {
                        this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_REACTION_ADDED, reactionReceipt);
                    });
                this.onMessageReactionRemoved =
                    CometChatMessageEvents.onMessageReactionRemoved.subscribe((reactionReceipt) => {
                        this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_REACTION_REMOVED, reactionReceipt);
                    });
            }
            this.onTextMessageReceived =
                CometChatMessageEvents.onTextMessageReceived.subscribe((message) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED, message);
                });
            this.onMediaMessageReceived =
                CometChatMessageEvents.onMediaMessageReceived.subscribe((message) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED, message);
                });
            this.onCustomMessageReceived =
                CometChatMessageEvents.onCustomMessageReceived.subscribe((message) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED, message);
                });
            this.onFormMessageReceived =
                CometChatMessageEvents.onFormMessageReceived.subscribe((message) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, message);
                });
            this.onSchedulerMessageReceived =
                CometChatMessageEvents.onSchedulerMessageReceived.subscribe((message) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, message);
                });
            this.onCardMessageReceived =
                CometChatMessageEvents.onCardMessageReceived.subscribe((message) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, message);
                });
            this.onCustomInteractiveMessageReceived =
                CometChatMessageEvents.onCustomInteractiveMessageReceived.subscribe((message) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, message);
                });
            this.onMessagesDelivered =
                CometChatMessageEvents.onMessagesDelivered.subscribe((messageReceipt) => {
                    if (messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                        this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_DELIVERED, messageReceipt);
                    }
                });
            this.onMessagesRead = CometChatMessageEvents.onMessagesRead.subscribe((messageReceipt) => {
                if (messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                    this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_READ, messageReceipt);
                }
            });
            this.onMessagesReadByAll = CometChatMessageEvents.onMessagesReadByAll.subscribe((messageReceipt) => {
                if (messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.group) {
                    this.messageReadAndDelivered(messageReceipt, true);
                    this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_READ, messageReceipt);
                }
            });
            this.onMessagesDeliveredToAll = CometChatMessageEvents.onMessagesDeliveredToAll.subscribe((messageReceipt) => {
                if (messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.group) {
                    this.messageReadAndDelivered(messageReceipt, true);
                    this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_DELIVERED, messageReceipt);
                }
            });
            this.onMessageDeleted = CometChatMessageEvents.onMessageDeleted.subscribe((deletedMessage) => {
                this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_DELETED, deletedMessage);
            });
            this.onMessageEdited = CometChatMessageEvents.onMessageEdited.subscribe((editedMessage) => {
                this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_EDITED, editedMessage);
            });
            this.onTransientMessageReceived =
                CometChatMessageEvents.onTransientMessageReceived.subscribe((transientMessage) => {
                    let liveReaction = transientMessage.getData();
                    if (transientMessage.getReceiverType() ==
                        CometChatUIKitConstants.MessageReceiverType.user &&
                        this.user &&
                        transientMessage?.getSender().getUid() == this.user.getUid() &&
                        transientMessage.getReceiverId() == this.loggedInUser?.getUid() &&
                        liveReaction["type"] == "live_reaction") {
                        CometChatMessageEvents.ccLiveReaction.next(liveReaction["reaction"]);
                        return;
                    }
                    else if (transientMessage.getReceiverType() ==
                        CometChatUIKitConstants.MessageReceiverType.group &&
                        this.group &&
                        transientMessage.getReceiverId() == this.group.getGuid() &&
                        transientMessage?.getSender().getUid() !=
                            this.loggedInUser?.getUid() &&
                        liveReaction["type"] == "live_reaction") {
                        CometChatMessageEvents.ccLiveReaction.next(liveReaction["reaction"]);
                        return;
                    }
                });
            this.onInteractionGoalCompleted =
                CometChatMessageEvents.onInteractionGoalCompleted.subscribe((receipt) => {
                    this.messageUpdate(CometChatUIKitConstants.messages.INTERACTION_GOAL_COMPLETED, receipt);
                });
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    /**
     *
     * @param
     */
    /**
     * Updates messageList on basis of user activity or group activity or calling activity
     * @param  {any=null} key
     * @param  {CometChat.MessageReceipt | CometChat.BaseMessage} message
     * @param  {CometChat.Group | null=null} group
     * @param  {any=null} options
     */
    messageUpdate(key = null, message = null, group = null, options = null) {
        try {
            this.showConversationStarter = false;
            this.showConversationSummary = false;
            this.conversationStarterReplies = [];
            this.conversationSummary = [];
            this.ref.detectChanges();
            switch (key) {
                case CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED:
                case CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED:
                    this.markMessageAsDelivered(message);
                    if (this.isPartOfCurrentChatForSDKEvent(message)) {
                        this.messageReceived(message);
                    }
                    if (this.isThreadOfCurrentChatForSDKEvent(message)) {
                        this.updateReplyCount(message);
                    }
                    break;
                case CometChatUIKitConstants.messages.MESSAGE_DELIVERED:
                case CometChatUIKitConstants.messages.MESSAGE_READ:
                    this.messageReadAndDelivered(message);
                    break;
                case CometChatUIKitConstants.messages.MESSAGE_DELETED:
                case CometChatUIKitConstants.messages.MESSAGE_EDITED: {
                    this.messageEdited(message);
                    break;
                }
                case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
                case CometChatUIKitConstants.groupMemberAction.JOINED:
                case CometChatUIKitConstants.groupMemberAction.LEFT:
                case CometChatUIKitConstants.groupMemberAction.ADDED:
                case CometChatUIKitConstants.groupMemberAction.KICKED:
                case CometChatUIKitConstants.groupMemberAction.BANNED:
                case CometChatUIKitConstants.groupMemberAction.UNBANNED: {
                    if (this.isPartOfCurrentChatForSDKEvent(message)) {
                        this.addMessage(message);
                    }
                    break;
                }
                case CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED:
                case CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED:
                    if (this.isPartOfCurrentChatForSDKEvent(message)) {
                        this.customMessageReceived(message);
                    }
                    if (this.isThreadOfCurrentChatForSDKEvent(message)) {
                        this.updateReplyCount(message);
                    }
                    break;
                case CometChatUIKitConstants.messages.INTERACTION_GOAL_COMPLETED:
                    if (this.isPartOfCurrentChatForSDKEvent(message)) {
                        this.updateInteractiveMessage(message);
                    }
                    break;
                case CometChatUIKitConstants.messages.MESSAGE_REACTION_ADDED:
                    this.onReactionUpdated(message, true);
                    break;
                case CometChatUIKitConstants.messages.MESSAGE_REACTION_REMOVED:
                    this.onReactionUpdated(message, false);
                    break;
                default:
                    return;
            }
            this.ref.detectChanges();
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    /**
     * Updates a message's reactions based on a new reaction.
     *
     * @param {CometChat.ReactionEvent} message - The new message reaction.
     * @param {boolean} isAdded - True if the reaction was added, false if it was removed.
     * @returns {boolean} Returns false if the message was not found, true otherwise.
     */
    onReactionUpdated(message, isAdded) {
        const messageId = message.getReaction()?.getMessageId();
        const messageObject = this.getMessageById(messageId);
        if (!messageObject) {
            return false;
        }
        let action;
        if (isAdded) {
            action = CometChat.REACTION_ACTION.REACTION_ADDED;
        }
        else {
            action = CometChat.REACTION_ACTION.REACTION_REMOVED;
        }
        let modifiedMessage = CometChat.CometChatHelper.updateMessageWithReactionInfo(messageObject, message.getReaction(), action);
        if (modifiedMessage instanceof CometChat.BaseMessage) {
            this.updateMessage(modifiedMessage);
        }
        return true;
    }
    /**
     * When Message is Received
     * @param message
     */
    /**
     * @param  {CometChat.BaseMessage} message
     */
    messageReceived(message) {
        try {
            if (message.getReceiverId() === this.group?.getGuid() ||
                (message?.getSender().getUid() === this.user?.getUid() &&
                    message.getReceiverId() === this.loggedInUser?.getUid())) {
                if ((!message?.getReadAt() &&
                    !message?.getParentMessageId() &&
                    this.isOnBottom) ||
                    (!message?.getReadAt() &&
                        message.getParentMessageId() &&
                        this.parentMessageId &&
                        this.isOnBottom)) {
                    if (!this.disableReceipt) {
                        CometChat.markAsRead(message).then(() => {
                            CometChatMessageEvents.ccMessageRead.next(message);
                        });
                    }
                    else {
                        this.UnreadCount = [];
                        this.ref.detectChanges();
                    }
                    CometChatMessageEvents.ccMessageRead.next(message);
                }
                this.messageReceivedHandler(message);
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        this.ref.detectChanges();
    }
    /**
     * Updating the reply count of Thread Parent Message
     * @param  {CometChat.BaseMessage} messages
     */
    updateReplyCount(messages) {
        try {
            var receivedMessage = messages;
            let messageList = [...this.messagesList];
            let messageKey = messageList.findIndex((m) => m.getId() === receivedMessage.getParentMessageId());
            if (messageKey > -1) {
                var messageObj = messageList[messageKey];
                let replyCount = messageObj.getReplyCount()
                    ? messageObj.getReplyCount()
                    : 0;
                replyCount = replyCount + 1;
                messageObj.setReplyCount(replyCount);
                messageList.splice(messageKey, 1, messageObj);
                this.messagesList = [...messageList];
                this.ref.detectChanges();
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    playAudio() {
        if (!this.disableSoundForMessages) {
            if (this.customSoundForMessages) {
                CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage, this.customSoundForMessages);
            }
            else {
                CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage);
            }
        }
    }
    reInitializeMessageList() {
        this.reinitialized = true;
        this.groupListenerId = "group_" + new Date().getTime();
        this.callListenerId = "call_" + new Date().getTime();
        this.addMessageEventListeners();
        if (this.messagesRequestBuilder) {
            if (this.keepRecentMessages) {
                this.messagesList.splice(1, this.messagesList.length - 30);
            }
            else {
                this.messagesList.splice(30);
            }
            this.requestBuilder = this.user
                ? this.messagesRequestBuilder.setUID(this.user.getUid()).build()
                : this.messagesRequestBuilder.setGUID(this.group.getGuid()).build();
        }
        else {
            if (this.keepRecentMessages) {
                this.messagesList.splice(1, this.messagesList.length - 30);
                this.scrollToBottom();
            }
            else {
                this.messagesList.splice(30);
            }
        }
        this.ref.detectChanges();
    }
    getMessageReceipt(message) {
        let receipt = MessageReceiptUtils.getReceiptStatus(message);
        return receipt;
    }
    messageReadAndDelivered(message, isGroupReceipt = false) {
        try {
            if (isGroupReceipt) {
                let messageKey = this.messagesList.findIndex((m) => m.getId() == Number(message.getMessageId()));
                if (messageKey > -1) {
                    this.messagesList[messageKey].setDeliveredAt(message.getDeliveredAt());
                    this.ref.detectChanges();
                }
                console.log(message.getReceiptType());
                message.getReceiptType() == message.RECEIPT_TYPE.DELIVERED_TO_ALL_RECEIPT && this.markAllMessagAsDelivered(messageKey);
                message.getReceiptType() == message.RECEIPT_TYPE.READ_BY_ALL_RECEIPT && this.markAllMessagAsRead(messageKey);
            }
            else if (message.getSender().getUid() !== this.loggedInUser?.getUid()) {
                if (message.getReceiptType() == CometChatUIKitConstants.messages.DELIVERY) {
                    //search for message
                    let messageKey = this.messagesList.findIndex((m) => m.getId() == Number(message.getMessageId()));
                    if (messageKey > -1) {
                        this.messagesList[messageKey].setDeliveredAt(message.getDeliveredAt());
                        this.ref.detectChanges();
                    }
                    this.markAllMessagAsDelivered(messageKey);
                }
                else if (message.getReceiptType() == CometChatUIKitConstants.messages.READ) {
                    //search for message
                    let messageKey = this.messagesList.findIndex((m) => m.getId() == Number(message.getMessageId()));
                    this.ref.detectChanges();
                    this.markAllMessagAsRead(messageKey);
                }
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        this.ref.detectChanges();
    }
    /**
     * @param  {CometChat.BaseMessage} readMessage
     */
    markAllMessagAsRead(messageKey) {
        for (let i = messageKey; i >= 0; i--) {
            if (!this.messagesList[i].getReadAt()) {
                this.messagesList[i].setReadAt(CometChatUIKitUtility.getUnixTimestamp());
                this.ref.detectChanges();
            }
        }
        CometChatMessageEvents.ccMessageRead.next(this.messagesList[messageKey]);
    }
    markAllMessagAsDelivered(messageKey) {
        for (let i = messageKey; i >= 0; i--) {
            if (!this.messagesList[i].getDeliveredAt()) {
                this.messagesList[i].setDeliveredAt(CometChatUIKitUtility.getUnixTimestamp());
                this.ref.detectChanges();
            }
        }
    }
    /**
     * Emits an Action Indicating that Group Data has been updated
     * @param
     */
    /**
     * When custom messages are received eg. Poll, Stickers emits action to update message list
     * @param message
     */
    /**
     * @param  {CometChat.BaseMessage} message
     */
    customMessageReceived(message) {
        try {
            this.markMessageAsDelivered(message);
            if (message.getReceiverId() === this.group?.getGuid() ||
                (message?.getSender().getUid() === this.user?.getUid() &&
                    message.getReceiverId() === this.loggedInUser?.getUid())) {
                if ((!message?.getReadAt() &&
                    !message?.getParentMessageId() &&
                    this.isOnBottom) ||
                    (!message?.getReadAt() &&
                        message.getParentMessageId() &&
                        this.parentMessageId &&
                        this.isOnBottom)) {
                    if (!this.disableReceipt) {
                        CometChat.markAsRead(message).then(() => {
                            CometChatMessageEvents.ccMessageRead.next(message);
                        });
                    }
                    else {
                        this.UnreadCount = [];
                        this.ref.detectChanges();
                    }
                }
                this.customMessageReceivedHandler(message);
            }
            else if (this.loggedInUser?.getUid() == message.getSender().getUid()) {
                this.customMessageReceivedHandler(message);
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        this.ref.detectChanges();
        return true;
    }
    /**
     * Compares two dates and sets Date on a a new day
     */
    /**
     * @param  {number} firstDate
     * @param  {number} secondDate
     */
    isDateDifferent(firstDate, secondDate) {
        let firstDateObj, secondDateObj;
        firstDateObj = new Date(firstDate * 1000);
        secondDateObj = new Date(secondDate * 1000);
        return (firstDateObj.getDate() !== secondDateObj.getDate() ||
            firstDateObj.getMonth() !== secondDateObj.getMonth() ||
            firstDateObj.getFullYear() !== secondDateObj.getFullYear());
    }
    /**
     * prepend Fetched Messages
     * @param {CometChat.BaseMessage} messages
     */
    prependMessages(messages) {
        try {
            if (!this.isPartOfCurrentChatForSDKEvent(messages[0])) {
                return;
            }
            this.messagesList = [...messages, ...this.messagesList];
            this.messageCount = this.messagesList.length;
            if (this.messageCount > this.thresholdValue) {
                this.keepRecentMessages = false;
                this.reInitializeMessageBuilder();
            }
            this.ngZone.run(() => {
                if (this.state != States.loaded) {
                    this.state = States.loaded;
                }
                this.ref.detach(); // Detach the change detector
            });
            if (this.chatChanged) {
                CometChatUIEvents.ccActiveChatChanged.next({
                    user: this.user,
                    group: this.group,
                    message: messages[messages?.length - 1],
                    unreadMessageCount: this.getUnreadCount,
                });
                this.chatChanged = false;
                this.scrollToBottom();
            }
        }
        catch (error) {
            this.state = States.error;
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    /**
     * listening to bottom scroll using intersection observer
     */
    ioBottom() {
        var options = {
            root: this.listScroll?.nativeElement,
            rootMargin: "-100% 0px 100px 0px",
            threshold: 0,
        };
        var callback = (entries) => {
            var lastMessage = this.UnreadCount[this.UnreadCount.length - 1];
            this.isOnBottom = entries[0].isIntersecting;
            if (this.isOnBottom) {
                this.fetchNextMessage();
                if (!this.disableReceipt && this.UnreadCount?.length > 0) {
                    CometChat.markAsRead(lastMessage).then((res) => {
                        this.UnreadCount = [];
                        let messageKey = this.messagesList.findIndex((m) => m.getId() === Number(res?.getMessageId()));
                        if (messageKey > -1) {
                            this.markAllMessagAsRead(messageKey);
                        }
                        this.ref.detectChanges();
                        CometChatMessageEvents.ccMessageRead.next(lastMessage);
                    });
                }
                else {
                    this.UnreadCount = [];
                    this.ref.detectChanges();
                }
            }
        };
        var observer = new IntersectionObserver(callback, options);
        observer.observe(this.bottom?.nativeElement);
    }
    /**
     * listening to top scroll using intersection observer
     */
    ioTop() {
        var options = {
            root: this.listScroll?.nativeElement,
            rootMargin: "200px 0px 0px 0px",
            threshold: 1.0,
        };
        var callback = (entries) => {
            if (entries[0].isIntersecting) {
                this.numberOfTopScroll++;
                if (this.numberOfTopScroll > 1) {
                    this.fetchPreviousMessages();
                }
            }
        };
        var observer = new IntersectionObserver(callback, options);
        observer.observe(this.top?.nativeElement);
    }
    /**
     * This is to ensure that the uid doesn't get copied when clicking on the copy option.
     * This function changes the uid regex to '@userName' without formatting
     *
     * @param {CometChat.TextMessage} message
     * @returns
     */
    getMentionsTextWithoutStyle(message) {
        const regex = /<@uid:(.*?)>/g;
        let messageText = message.getText();
        let messageTextTmp = message.getText();
        let match = regex.exec(messageText);
        let mentionedUsers = message.getMentionedUsers();
        while (match !== null) {
            let user;
            for (let i = 0; i < mentionedUsers.length; i++) {
                if (match[1] == mentionedUsers[i].getUid()) {
                    user = mentionedUsers[i];
                }
            }
            if (user) {
                messageTextTmp = messageTextTmp.replace(match[0], "@" + user.getName() + "");
            }
            match = regex.exec(messageText);
        }
        return messageTextTmp;
    }
    /**
     * callback for deleteMessage
     * @param  {CometChat.BaseMessage} object
     */
    /**
     * @param  {CometChat.BaseMessage} messages
     */
    messageSent(messages) {
        var message = messages;
        var messageList = [...this.messagesList];
        let messageKey = messageList.findIndex((m) => m.getMuid() === message.getMuid());
        if (messageKey > -1) {
            messageList.splice(messageKey, 1, message);
        }
        this.messagesList = messageList;
        this.ref.detectChanges();
        this.scrollToBottom();
    }
    updateMessage(message, muid = false) {
        if (muid) {
            this.messageSent(message);
        }
        else {
            this.updateEditedMessage(message);
        }
    }
    /**
     * Returns the style configuration for the thread view of a message.
     *
     * @param {CometChat.BaseMessage} message - The message that the style configuration is for.
     * @returns {Object} The style configuration object.
     */
    getThreadViewStyle(message) {
        return {
            height: "100%",
            width: "100%",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            buttonIconTint: this.messageListStyle.threadReplyIconTint,
            display: "flex",
            flexFlow: this.isSentByMe(message) && this.alignment != MessageListAlignment.left
                ? "row-reverse"
                : "row",
            alignItems: "flex-start",
            buttonTextColor: this.messageListStyle?.threadReplyTextColor,
            buttonTextFont: this.messageListStyle?.threadReplyTextFont,
            iconHeight: "15px",
            iconWidth: "15px",
            gap: "4px",
        };
    }
    /**
     * Checks if a message was sent by the currently logged in user.
     *
     * @param {CometChat.BaseMessage} message - The message to check.
     * @returns {boolean} Returns true if the message is sent by the logged in user, false otherwise.
     */
    isSentByMe(message) {
        let sentByMe = !message?.getSender() ||
            message.getSender().getUid() == this.loggedInUser?.getUid();
        return sentByMe;
    }
    showHeaderTitle(message) {
        if (this.alignment == MessageListAlignment.left) {
            return true;
        }
        else {
            if (this.group &&
                message?.getCategory() !=
                    CometChatUIKitConstants.MessageCategory.action &&
                message?.getSender() &&
                message?.getSender().getUid() != this.loggedInUser?.getUid() &&
                this.alignment == MessageListAlignment.standard) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    /**
     * Method to subscribe  the required Rxjs events when the CometChatMessageListComponent loads
     */
    subscribeToEvents() {
        this.ccActivePppover = CometChatUIEvents.ccActivePopover.subscribe((data) => {
            if (data == ActivePopover.composer && this.messageToReact) {
                this.popoverRef.nativeElement.openContentView();
                this.messageToReact = null;
                this.ref.detectChanges();
            }
        });
        this.ccShowPanel = CometChatUIEvents.ccShowPanel.subscribe((data) => {
            if (data.child?.showConversationSummaryView) {
                this.fetchConversationSummary();
            }
            this.smartReplyConfig = data.configuration;
            this.smartReplyMessage = data.message;
            var smartReplyObject = data.message?.metadata?.[SmartRepliesConstants.injected]?.extensions?.[SmartRepliesConstants.smart_reply];
            if (this.isPartOfCurrentChatForSDKEvent(this.smartReplyMessage) && smartReplyObject && !smartReplyObject.error) {
                this.enableSmartReply = true;
                this.showSmartReply = true;
                this.ref.detectChanges();
            }
        });
        this.ccHidePanel = CometChatUIEvents.ccHidePanel.subscribe(() => {
            this.smartReplyMessage = null;
            this.enableSmartReply = false;
            this.showSmartReply = false;
        });
        this.ccMessageRead = CometChatMessageEvents.ccMessageRead.subscribe((message) => {
            if (message && message.getParentMessageId()) {
                const messageObj = this.getMessageById(message.getParentMessageId());
                // if (messageObj && messageObj.getUnreadReplyCount()) {
                //   messageObj.setUnreadReplyCount(0);
                //   this.updateMessage(messageObj);
                // }
            }
        });
        this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item) => {
            item;
            this.appendMessages(item.messages);
        });
        this.ccGroupMemberBanned =
            CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
                if (this.isPartOfCurrentChatForUIEvent(item.message)) {
                    this.addMessage(item.message);
                }
            });
        this.ccGroupMemberKicked =
            CometChatGroupEvents.ccGroupMemberKicked.subscribe((item) => {
                if (this.isPartOfCurrentChatForUIEvent(item.message)) {
                    this.addMessage(item.message);
                }
            });
        this.ccGroupMemberScopeChanged =
            CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((item) => {
                if (this.isPartOfCurrentChatForUIEvent(item.message)) {
                    this.addMessage(item.message);
                }
            });
        this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item) => {
            if (this.isPartOfCurrentChatForUIEvent(item.message)) {
                this.addMessage(item.message);
            }
        });
        this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object) => {
            if (object?.status == MessageStatus.success) {
                if (this.isPartOfCurrentChatForSDKEvent(object.message)) {
                    let message = CometChatUIKitUtility.clone(object.message);
                    this.updateMessage(message);
                }
            }
        });
        this.ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe((obj) => {
            if (obj.message) {
                let message = CometChatUIKitUtility.clone(obj.message);
                switch (obj.status) {
                    case MessageStatus.inprogress: {
                        if (this.isPartOfCurrentChatForUIEvent(message)) {
                            this.addMessage(message);
                        }
                        break;
                    }
                    case MessageStatus.success: {
                        this.showConversationStarter = false;
                        this.conversationStarterReplies = [];
                        this.showConversationSummary = false;
                        this.conversationSummary = [];
                        this.ref.detectChanges();
                        if (this.isThreadOfCurrentChatForUIEvent(message)) {
                            this.updateReplyCount(CometChatUIKitUtility.clone(message));
                        }
                        this.updateMessage(message, true);
                        break;
                    }
                    case MessageStatus.error: {
                        if (!message.getSender() || this.isPartOfCurrentChatForUIEvent(message)) {
                            this.updateMessage(CometChatUIKitUtility.clone(message));
                        }
                    }
                }
            }
        });
        this.ccMessageDelete = CometChatMessageEvents.ccMessageDeleted.subscribe((messageObject) => {
            this.removeMessage(messageObject);
            this.ref.detectChanges();
        });
        this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call) => {
            this.showOngoingCall = false;
            this.sessionId = "";
            if (call && Object.keys(call).length > 0) {
                if (this.isPartOfCurrentChatForUIEvent(call)) {
                    this.addMessage(call);
                }
            }
            this.ref.detectChanges();
        });
        this.ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe((call) => {
            if (this.isPartOfCurrentChatForUIEvent(call)) {
                this.addMessage(call);
            }
        });
        this.ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe((call) => {
            if (this.isPartOfCurrentChatForUIEvent(call)) {
                this.addMessage(call);
            }
        });
        this.ccCallAccepted = CometChatCallEvents.ccCallAccepted.subscribe((call) => {
            if (this.isPartOfCurrentChatForUIEvent(call)) {
                this.addMessage(call);
            }
        });
    }
    showStatusInfo(message) {
        if (message?.getCategory() != this.MessageCategory.action &&
            !message.getDeletedAt() &&
            message?.getCategory() != this.MessageCategory.call &&
            message?.getSentAt()) {
            return true;
        }
        else {
            return false;
        }
    }
    shouldShowMessage(message, disableReceipt, hideReceipt) {
        return (!message.getDeletedAt() &&
            !(disableReceipt || hideReceipt) &&
            (!message.getSender() || this.loggedInUser.getUid() === message.getSender()?.getUid()) &&
            message.getCategory() !== this.MessageCategory.action &&
            message.getCategory() !== this.MessageCategory.call);
    }
    fetchConversationStarter() {
        this.showConversationStarter = true;
        this.conversationStarterState = States.loading;
        let receiverType = this.user
            ? CometChatUIKitConstants.MessageReceiverType.user
            : CometChatUIKitConstants.MessageReceiverType.group;
        let receiverId = this.user
            ? this.user.getUid()
            : this.group.getGuid();
        CometChat.getConversationStarter(receiverId, receiverType)
            .then((response) => {
            if (response) {
                Object.keys(response).forEach((reply) => {
                    if (response[reply] && response[reply] != "") {
                        this.conversationStarterReplies.push(response[reply]);
                    }
                });
                if (this.conversationStarterReplies &&
                    this.conversationStarterReplies.length > 0 &&
                    this.messagesList?.length <= 0) {
                    this.conversationStarterState = States.loaded;
                    this.ref.detectChanges();
                }
                else {
                    this.conversationStarterState = States.empty;
                    this.ref.detectChanges();
                }
            }
            else {
                this.conversationStarterState = States.empty;
                this.ref.detectChanges();
            }
        })
            .catch((err) => {
            if (this.onError) {
                this.onError(err);
            }
            this.conversationStarterState = States.error;
            this.ref.detectChanges();
        });
    }
    fetchConversationSummary() {
        this.showConversationSummary = true;
        this.conversationSummaryState = States.loading;
        this.ref.detectChanges();
        let receiverType = this.user
            ? CometChatUIKitConstants.MessageReceiverType.user
            : CometChatUIKitConstants.MessageReceiverType.group;
        let receiverId = this.user
            ? this.user.getUid()
            : this.group.getGuid();
        let apiConfiguration = this.apiConfiguration;
        CometChat.getConversationSummary(receiverId, receiverType, apiConfiguration)
            .then((response) => {
            // throw new Error("Parameter is not a number!");
            if (response) {
                this.conversationSummary = [response];
            }
            if (this.conversationSummary && this.conversationSummary.length > 0) {
                this.conversationSummaryState = States.loaded;
                this.ref.detectChanges();
            }
            else {
                this.conversationSummaryState = States.empty;
                this.ref.detectChanges();
            }
        })
            .catch((err) => {
            if (this.onError) {
                this.onError(err);
            }
            this.conversationSummaryState = States.error;
            this.ref.detectChanges();
        });
        return this.conversationSummary;
    }
    getReplies() {
        let smartReply = this.smartReplyMessage;
        var smartReplyObject = smartReply?.metadata?.[SmartRepliesConstants.injected]?.extensions?.[SmartRepliesConstants.smart_reply];
        if (smartReplyObject?.reply_positive &&
            smartReplyObject?.reply_neutral &&
            smartReplyObject?.reply_negative) {
            var { reply_positive, reply_neutral, reply_negative } = smartReplyObject;
            return [reply_positive, reply_neutral, reply_negative];
        }
        return null;
    }
    /**
     * Method to unsubscribe all the Rxjs events when the CometChatMessageListComponent gets destroy
     */
    unsubscribeToEvents() {
        this.ccGroupMemberAdded?.unsubscribe();
        this.ccGroupMemberBanned?.unsubscribe();
        this.ccGroupMemberJoined?.unsubscribe();
        this.ccGroupMemberKicked?.unsubscribe();
        this.ccOwnershipChanged?.unsubscribe();
        this.ccGroupLeft?.unsubscribe();
        this.ccMessageEdit?.unsubscribe();
        this.ccMessageSent?.unsubscribe();
        this.ccLiveReaction?.unsubscribe();
        this.ccMessageDelete?.unsubscribe();
        this.ccGroupMemberScopeChanged?.unsubscribe();
        this.ccShowPanel?.unsubscribe();
        this.ccMessageRead?.unsubscribe();
        this.ccHidePanel?.unsubscribe();
        this.ccCallEnded?.unsubscribe();
        this.ccCallRejected?.unsubscribe();
        this.ccOutgoingCall?.unsubscribe();
        this.ccCallAccepted?.unsubscribe();
    }
    /**
     * Returns the appropriate thread icon based on the sender of the message.
     *
     * @param {CometChat.BaseMessage} message - The message for which the thread icon is being determined.
     * @returns {boolean} The icon for the thread. If the message was sent by the logged in user, returns 'threadRightArrow'. Otherwise, returns 'threadIndicatorIcon'.
     */
    getThreadIconAlignment(message) {
        let sentByMe = this.isSentByMe(message) &&
            this.alignment === MessageListAlignment.standard;
        return sentByMe ? false : true;
    }
    /**
     * Configuration for the reaction list.
     * This includes styles for the avatar, list items, and reaction history.
     * @returns {ReactionListConfiguration} - The configured reaction list.
     */
    getReactionListConfiguration() {
        const avatarStyle = new AvatarStyle({
            borderRadius: "50%",
            width: "35px",
            height: "35px",
            border: "none",
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderWidth: "0",
            outerViewBorderRadius: "0",
            outerViewBorderColor: "",
            outerViewBorderSpacing: "0",
        });
        const listItemStyle = new ListItemStyle({
            activeBackground: this.themeService.theme.palette.getBackground(),
            hoverBackground: this.themeService.theme.palette.getBackground(),
            titleFont: fontHelper(this.themeService.theme.typography.subtitle1),
            titleColor: this.themeService.theme.palette.getAccent(),
            separatorColor: this.themeService.theme.palette.getAccent100(),
        });
        const reactionHistoryStyle = new ReactionListStyle({
            width: "320px",
            height: "300px",
            borderRadius: "12px",
            background: this.themeService.theme.palette.getBackground(),
            border: "none",
            errorIconTint: this.themeService.theme.palette.getAccent400(),
            loadingIconTint: this.themeService.theme.palette.getAccent400(),
            sliderEmojiCountFont: fontHelper(this.themeService.theme.typography.text2),
            sliderEmojiFont: fontHelper(this.themeService.theme.typography.text1),
            subtitleTextColor: this.themeService.theme.palette.getAccent500(),
            subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            tailViewFont: fontHelper(this.themeService.theme.typography.title1),
            dividerTint: this.themeService.theme.palette.getAccent100(),
            sliderEmojiCountColor: this.themeService.theme.palette.getAccent500(),
            activeEmojiBackground: this.themeService.theme.palette.getAccent100(),
        });
        return new ReactionListConfiguration({
            avatarStyle: this.reactionsConfiguration?.reactionListConfiguration?.avatarStyle ||
                avatarStyle,
            errorIconURL: this.reactionsConfiguration?.reactionListConfiguration?.errorIconURL ||
                "",
            listItemStyle: this.reactionsConfiguration?.reactionListConfiguration?.listItemStyle ||
                listItemStyle,
            loadingIconURL: this.reactionsConfiguration?.reactionListConfiguration
                ?.loadingIconURL || "",
            reactionListStyle: this.reactionsConfiguration?.reactionListConfiguration
                ?.reactionListStyle || reactionHistoryStyle,
            reactionItemClicked: this.reactionsConfiguration?.reactionListConfiguration
                ?.reactionItemClicked || this.onReactionItemClicked,
            reactionsRequestBuilder: this.reactionsConfiguration?.reactionListConfiguration
                ?.reactionsRequestBuilder || undefined,
        });
    }
    /**
     * Configuration for the reaction info.
     * This includes styles for the reaction info display.
     * @returns {ReactionInfoConfiguration} - The configured reaction info.
     */
    getReactionInfoConfiguration() {
        const config = this.reactionsConfiguration?.reactionInfoConfiguration || {};
        const reactionInfoStyle = new ReactionInfoStyle({
            background: config?.reactionInfoStyle?.background ||
                this.themeService.theme.palette.getAccent(),
            border: config?.reactionInfoStyle?.border || "none",
            borderRadius: config?.reactionInfoStyle?.borderRadius || "12px",
            errorIconTint: config?.reactionInfoStyle?.errorIconTint ||
                this.themeService.theme.palette.getBackground(),
            loadingIconTint: config?.reactionInfoStyle?.loadingIconTint ||
                this.themeService.theme.palette.getBackground(),
            namesColor: config?.reactionInfoStyle?.namesColor ||
                this.themeService.theme.palette.getBackground(),
            namesFont: config?.reactionInfoStyle?.namesFont ||
                fontHelper(this.themeService.theme.typography.subtitle2),
            reactedTextColor: config?.reactionInfoStyle?.reactedTextColor ||
                this.themeService.theme.palette.getAccent700("dark"),
            reactedTextFont: config?.reactionInfoStyle?.reactedTextFont ||
                fontHelper(this.themeService.theme.typography.subtitle2),
            reactionFontSize: config?.reactionInfoStyle?.reactionFontSize || "37px",
        });
        return new ReactionInfoConfiguration({
            reactionInfoStyle: reactionInfoStyle,
            reactionsRequestBuilder: config?.reactionsRequestBuilder || undefined,
            errorIconURL: config?.errorIconURL || "",
            loadingIconURL: config?.loadingIconURL || "",
        });
    }
    /**
     * Styling for reactions component
     *
     */
    getReactionsWrapperStyle(message) {
        let alignment = this.setBubbleAlignment(message);
        return {
            width: "100%",
            paddingTop: "5px",
            boxSizing: "border-box",
            display: "flex",
            marginTop: "-9px",
            justifyContent: alignment === MessageBubbleAlignment.left ? "flex-start" : "flex-end",
        };
    }
    getThreadViewAlignment(message) {
        return {
            display: "flex",
            justifyContent: this.isSentByMe(message) &&
                this.alignment == MessageListAlignment.standard
                ? "flex-end"
                : "flex-start",
        };
    }
}
CometChatMessageListComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageListComponent, deps: [{ token: i0.NgZone }, { token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageListComponent, selector: "cometchat-message-list", inputs: { hideError: "hideError", hideDateSeparator: "hideDateSeparator", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateView: "emptyStateView", errorStateText: "errorStateText", emptyStateText: "emptyStateText", loadingIconURL: "loadingIconURL", user: "user", group: "group", disableReceipt: "disableReceipt", hideReceipt: "hideReceipt", disableSoundForMessages: "disableSoundForMessages", customSoundForMessages: "customSoundForMessages", readIcon: "readIcon", deliveredIcon: "deliveredIcon", sentIcon: "sentIcon", waitIcon: "waitIcon", errorIcon: "errorIcon", aiErrorIcon: "aiErrorIcon", aiEmptyIcon: "aiEmptyIcon", alignment: "alignment", showAvatar: "showAvatar", datePattern: "datePattern", timestampAlignment: "timestampAlignment", DateSeparatorPattern: "DateSeparatorPattern", templates: "templates", messagesRequestBuilder: "messagesRequestBuilder", newMessageIndicatorText: "newMessageIndicatorText", scrollToBottomOnNewMessages: "scrollToBottomOnNewMessages", thresholdValue: "thresholdValue", unreadMessageThreshold: "unreadMessageThreshold", reactionsConfiguration: "reactionsConfiguration", disableReactions: "disableReactions", emojiKeyboardStyle: "emojiKeyboardStyle", apiConfiguration: "apiConfiguration", onThreadRepliesClick: "onThreadRepliesClick", headerView: "headerView", footerView: "footerView", parentMessageId: "parentMessageId", threadIndicatorIcon: "threadIndicatorIcon", avatarStyle: "avatarStyle", backdropStyle: "backdropStyle", dateSeparatorStyle: "dateSeparatorStyle", messageListStyle: "messageListStyle", onError: "onError", messageInformationConfiguration: "messageInformationConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, viewQueries: [{ propertyName: "listScroll", first: true, predicate: ["listScroll"], descendants: true }, { propertyName: "bottom", first: true, predicate: ["bottom"], descendants: true }, { propertyName: "top", first: true, predicate: ["top"], descendants: true }, { propertyName: "textBubble", first: true, predicate: ["textBubble"], descendants: true }, { propertyName: "threadMessageBubble", first: true, predicate: ["threadMessageBubble"], descendants: true }, { propertyName: "fileBubble", first: true, predicate: ["fileBubble"], descendants: true }, { propertyName: "audioBubble", first: true, predicate: ["audioBubble"], descendants: true }, { propertyName: "videoBubble", first: true, predicate: ["videoBubble"], descendants: true }, { propertyName: "imageBubble", first: true, predicate: ["imageBubble"], descendants: true }, { propertyName: "formBubble", first: true, predicate: ["formBubble"], descendants: true }, { propertyName: "cardBubble", first: true, predicate: ["cardBubble"], descendants: true }, { propertyName: "stickerBubble", first: true, predicate: ["stickerBubble"], descendants: true }, { propertyName: "documentBubble", first: true, predicate: ["documentBubble"], descendants: true }, { propertyName: "whiteboardBubble", first: true, predicate: ["whiteboardBubble"], descendants: true }, { propertyName: "popoverRef", first: true, predicate: ["popoverRef"], descendants: true }, { propertyName: "directCalling", first: true, predicate: ["directCalling"], descendants: true }, { propertyName: "schedulerBubble", first: true, predicate: ["schedulerBubble"], descendants: true }, { propertyName: "pollBubble", first: true, predicate: ["pollBubble"], descendants: true }, { propertyName: "messageBubbleRef", predicate: ["messageBubbleRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"getActionMessage(message)\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboard\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\" (cc-popover-outside-clicked)=\"onEmojiKeyboardClosed()\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}cometchat-document-bubble{width:100%;overflow:hidden}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"], components: [{ type: i2.CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: ["messageBubbleStyle", "alignment", "options", "id", "leadingView", "headerView", "replyView", "contentView", "threadView", "footerView", "bottomView", "statusInfoView", "moreIconURL", "topMenuSize"] }, { type: i3.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i4.CometChatMessageInformationComponent, selector: "cometchat-message-information", inputs: ["closeIconURL", "message", "title", "template", "bubbleView", "subtitleView", "listItemView", "receiptDatePattern", "onError", "messageInformationStyle", "readIcon", "deliveredIcon", "onClose", "listItemStyle", "emptyStateText", "errorStateText", "emptyStateView", "loadingIconURL", "loadingStateView", "errorStateView"] }], directives: [{ type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i5.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageListComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-list", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"getActionMessage(message)\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboard\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\" (cc-popover-outside-clicked)=\"onEmojiKeyboardClosed()\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}cometchat-document-bubble{width:100%;overflow:hidden}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { listScroll: [{
                type: ViewChild,
                args: ["listScroll", { static: false }]
            }], bottom: [{
                type: ViewChild,
                args: ["bottom", { static: false }]
            }], top: [{
                type: ViewChild,
                args: ["top", { static: false }]
            }], textBubble: [{
                type: ViewChild,
                args: ["textBubble", { static: false }]
            }], threadMessageBubble: [{
                type: ViewChild,
                args: ["threadMessageBubble", { static: false }]
            }], fileBubble: [{
                type: ViewChild,
                args: ["fileBubble", { static: false }]
            }], audioBubble: [{
                type: ViewChild,
                args: ["audioBubble", { static: false }]
            }], videoBubble: [{
                type: ViewChild,
                args: ["videoBubble", { static: false }]
            }], imageBubble: [{
                type: ViewChild,
                args: ["imageBubble", { static: false }]
            }], formBubble: [{
                type: ViewChild,
                args: ["formBubble", { static: false }]
            }], cardBubble: [{
                type: ViewChild,
                args: ["cardBubble", { static: false }]
            }], stickerBubble: [{
                type: ViewChild,
                args: ["stickerBubble", { static: false }]
            }], documentBubble: [{
                type: ViewChild,
                args: ["documentBubble", { static: false }]
            }], whiteboardBubble: [{
                type: ViewChild,
                args: ["whiteboardBubble", { static: false }]
            }], popoverRef: [{
                type: ViewChild,
                args: ["popoverRef", { static: false }]
            }], directCalling: [{
                type: ViewChild,
                args: ["directCalling", { static: false }]
            }], schedulerBubble: [{
                type: ViewChild,
                args: ["schedulerBubble", { static: false }]
            }], pollBubble: [{
                type: ViewChild,
                args: ["pollBubble", { static: false }]
            }], messageBubbleRef: [{
                type: ViewChildren,
                args: ["messageBubbleRef"]
            }], hideError: [{
                type: Input
            }], hideDateSeparator: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], user: [{
                type: Input
            }], group: [{
                type: Input
            }], disableReceipt: [{
                type: Input
            }], hideReceipt: [{
                type: Input
            }], disableSoundForMessages: [{
                type: Input
            }], customSoundForMessages: [{
                type: Input
            }], readIcon: [{
                type: Input
            }], deliveredIcon: [{
                type: Input
            }], sentIcon: [{
                type: Input
            }], waitIcon: [{
                type: Input
            }], errorIcon: [{
                type: Input
            }], aiErrorIcon: [{
                type: Input
            }], aiEmptyIcon: [{
                type: Input
            }], alignment: [{
                type: Input
            }], showAvatar: [{
                type: Input
            }], datePattern: [{
                type: Input
            }], timestampAlignment: [{
                type: Input
            }], DateSeparatorPattern: [{
                type: Input
            }], templates: [{
                type: Input
            }], messagesRequestBuilder: [{
                type: Input
            }], newMessageIndicatorText: [{
                type: Input
            }], scrollToBottomOnNewMessages: [{
                type: Input
            }], thresholdValue: [{
                type: Input
            }], unreadMessageThreshold: [{
                type: Input
            }], reactionsConfiguration: [{
                type: Input
            }], disableReactions: [{
                type: Input
            }], emojiKeyboardStyle: [{
                type: Input
            }], apiConfiguration: [{
                type: Input
            }], onThreadRepliesClick: [{
                type: Input
            }], headerView: [{
                type: Input
            }], footerView: [{
                type: Input
            }], parentMessageId: [{
                type: Input
            }], threadIndicatorIcon: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], backdropStyle: [{
                type: Input
            }], dateSeparatorStyle: [{
                type: Input
            }], messageListStyle: [{
                type: Input
            }], onError: [{
                type: Input
            }], messageInformationConfiguration: [{
                type: Input
            }], disableMentions: [{
                type: Input
            }], textFormatters: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEVBU0wsU0FBUyxFQUNULFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsV0FBVyxFQUdYLGVBQWUsRUFDZixhQUFhLEVBRWIsU0FBUyxFQUVULGFBQWEsRUFHYixVQUFVLEVBQ1YsVUFBVSxFQUNWLGFBQWEsRUFHYixjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixpQkFBaUIsR0FDbEIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQ0wsYUFBYSxFQUNiLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsOEJBQThCLEVBQzlCLGdDQUFnQyxFQUNoQyxxQkFBcUIsRUFDckIsYUFBYSxFQUNiLHFCQUFxQixFQUNyQixlQUFlLEVBRWYsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQiwrQkFBK0IsRUFDL0IsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQiwyQkFBMkIsRUFDM0IsdUJBQXVCLEVBRXZCLG9CQUFvQixFQUVwQixxQkFBcUIsRUFFckIsNEJBQTRCLEVBQzVCLGNBQWMsRUFDZCx5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLGlC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QUFnQjtzQkFBeEIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUtHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFHRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFJRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBS0csT0FBTztzQkFBZixLQUFLO2dCQUtHLCtCQUErQjtzQkFBdkMsS0FBSztnQkFFRyxlQUFlO3NCQUF2QixLQUFLO2dCQW9ORyxjQUFjO3NCQUF0QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBRdWVyeUxpc3QsXG4gIFJlbmRlcmVyMixcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0NoaWxkcmVuLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIEJhc2VTdHlsZSxcbiAgQ2FsbHNjcmVlblN0eWxlLFxuICBDaGVja2JveFN0eWxlLFxuICBDb25maXJtRGlhbG9nU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgRG9jdW1lbnRCdWJibGVTdHlsZSxcbiAgRHJvcGRvd25TdHlsZSxcbiAgRW1vamlLZXlib2FyZFN0eWxlLFxuICBGdWxsU2NyZWVuVmlld2VyU3R5bGUsXG4gIElucHV0U3R5bGUsXG4gIExhYmVsU3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG4gIE1lbnVMaXN0U3R5bGUsXG4gIFBhbmVsU3R5bGUsXG4gIFF1aWNrVmlld1N0eWxlLFxuICBSYWRpb0J1dHRvblN0eWxlLFxuICBSZWNlaXB0U3R5bGUsXG4gIFNpbmdsZVNlbGVjdFN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHtcbiAgQ2FsZW5kYXJTdHlsZSxcbiAgQ2FsbGluZ0RldGFpbHNVdGlscyxcbiAgQ2FyZEJ1YmJsZVN0eWxlLFxuICBDb2xsYWJvcmF0aXZlRG9jdW1lbnRDb25zdGFudHMsXG4gIENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkQ29uc3RhbnRzLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIFRpbWVTbG90U3R5bGUsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbiAgRm9ybUJ1YmJsZVN0eWxlLFxuICBJbWFnZU1vZGVyYXRpb25TdHlsZSxcbiAgSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMsXG4gIExpbmtQcmV2aWV3Q29uc3RhbnRzLFxuICBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLFxuICBNZXNzYWdlTGlzdFN0eWxlLFxuICBNZXNzYWdlUmVjZWlwdFV0aWxzLFxuICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMsXG4gIE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlLFxuICBQb2xsc0J1YmJsZVN0eWxlLFxuICBTY2hlZHVsZXJCdWJibGVTdHlsZSxcbiAgU21hcnRSZXBsaWVzQ29uZmlndXJhdGlvbixcbiAgU21hcnRSZXBsaWVzQ29uc3RhbnRzLFxuICBTbWFydFJlcGxpZXNTdHlsZSxcbiAgVGh1bWJuYWlsR2VuZXJhdGlvbkNvbnN0YW50cyxcbiAgUmVhY3Rpb25zU3R5bGUsXG4gIFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24sXG4gIFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24sXG4gIFJlYWN0aW9uTGlzdFN0eWxlLFxuICBSZWFjdGlvbkluZm9TdHlsZSxcbiAgUmVhY3Rpb25zQ29uZmlndXJhdGlvbixcbiAgVXNlck1lbnRpb25TdHlsZSxcbiAgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcixcbiAgQ29tZXRDaGF0VGV4dEZvcm1hdHRlcixcbiAgVXJsRm9ybWF0dGVyU3R5bGUsXG4gIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIsXG4gIFN0b3JhZ2VVdGlscyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBBY3RpdmVQb3BvdmVyLFxuICBDYXJkTWVzc2FnZSxcbiAgQ29tZXRDaGF0Q2FsbEV2ZW50cyxcbiAgQ29tZXRDaGF0R3JvdXBFdmVudHMsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24sXG4gIENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSxcbiAgQ29tZXRDaGF0VGhlbWUsXG4gIENvbWV0Q2hhdFVJRXZlbnRzLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlLFxuICBEYXRlUGF0dGVybnMsXG4gIERvY3VtZW50SWNvbkFsaWdubWVudCxcbiAgRm9ybU1lc3NhZ2UsXG4gIElHcm91cExlZnQsXG4gIElHcm91cE1lbWJlckFkZGVkLFxuICBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsXG4gIElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCxcbiAgSU1lc3NhZ2VzLFxuICBJUGFuZWwsXG4gIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQsXG4gIE1lc3NhZ2VMaXN0QWxpZ25tZW50LFxuICBNZXNzYWdlU3RhdHVzLFxuICBQbGFjZW1lbnQsXG4gIFNjaGVkdWxlck1lc3NhZ2UsXG4gIFN0YXRlcyxcbiAgVGltZXN0YW1wQWxpZ25tZW50LFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBDb21ldENoYXRVSUtpdENhbGxzLFxuICBMaW5rUHJldmlld1N0eWxlLFxuICBTdGlja2Vyc0NvbnN0YW50cyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5cbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXQgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0NvbWV0Q2hhdFVJa2l0L0NvbWV0Q2hhdFVJS2l0XCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24sIGlzRW1wdHkgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgTWVzc2FnZVV0aWxzIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9NZXNzYWdlVXRpbHNcIjtcblxuLyoqXG4gKlxuICogQ29tZXRDaGF0TWVzc2FnZUxpc3QgaXMgYSB3cmFwcGVyIGNvbXBvbmVudCBmb3IgbWVzc2FnZUJ1YmJsZVxuICpcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiAqIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuICpcbiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1tZXNzYWdlLWxpc3RcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtbWVzc2FnZS1saXN0LmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtbWVzc2FnZS1saXN0LmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0TWVzc2FnZUxpc3RDb21wb25lbnRcbiAgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSwgT25DaGFuZ2VzIHtcbiAgQFZpZXdDaGlsZChcImxpc3RTY3JvbGxcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGxpc3RTY3JvbGwhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiYm90dG9tXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBib3R0b20hOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwidG9wXCIsIHsgc3RhdGljOiBmYWxzZSB9KSB0b3AhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwidGV4dEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgdGV4dEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJ0aHJlYWRNZXNzYWdlQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICB0aHJlYWRNZXNzYWdlQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImZpbGVCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGZpbGVCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiYXVkaW9CdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGF1ZGlvQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInZpZGVvQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSB2aWRlb0J1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJpbWFnZUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgaW1hZ2VCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiZm9ybUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgZm9ybUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJjYXJkQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBjYXJkQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInN0aWNrZXJCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHN0aWNrZXJCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiZG9jdW1lbnRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIGRvY3VtZW50QnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcIndoaXRlYm9hcmRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHdoaXRlYm9hcmRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwicG9wb3ZlclJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgcG9wb3ZlclJlZiE6IGFueTtcbiAgQFZpZXdDaGlsZChcImRpcmVjdENhbGxpbmdcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIGRpcmVjdENhbGxpbmchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwic2NoZWR1bGVyQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBzY2hlZHVsZXJCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwicG9sbEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgcG9sbEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGRyZW4oXCJtZXNzYWdlQnViYmxlUmVmXCIpIG1lc3NhZ2VCdWJibGVSZWYhOiBRdWVyeUxpc3Q8RWxlbWVudFJlZj47XG5cbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGhpZGVEYXRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgYXMgb2YgdmVyc2lvbiA0LjMuMTYgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdoaWRlUmVjZWlwdCcuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAgKi9cbiAgQElucHV0KCkgZGlzYWJsZVJlY2VpcHQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgaGlkZVJlY2VpcHQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JNZXNzYWdlczogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgcmVhZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtcmVhZC5zdmdcIjtcbiAgQElucHV0KCkgZGVsaXZlcmVkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1kZWxpdmVyZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHNlbnRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXNlbnQuc3ZnXCI7XG4gIEBJbnB1dCgpIHdhaXRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy93YWl0LnN2Z1wiO1xuICBASW5wdXQoKSBlcnJvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3dhcm5pbmctc21hbGwuc3ZnXCI7XG4gIEBJbnB1dCgpIGFpRXJyb3JJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9haS1lcnJvci5zdmdcIjtcbiAgQElucHV0KCkgYWlFbXB0eUljb246IHN0cmluZyA9IFwiYXNzZXRzL2FpLWVtcHR5LnN2Z1wiO1xuICBASW5wdXQoKSBhbGlnbm1lbnQ6IE1lc3NhZ2VMaXN0QWxpZ25tZW50ID0gTWVzc2FnZUxpc3RBbGlnbm1lbnQuc3RhbmRhcmQ7XG4gIEBJbnB1dCgpIHNob3dBdmF0YXI6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBkYXRlUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLnRpbWU7XG4gIEBJbnB1dCgpIHRpbWVzdGFtcEFsaWdubWVudDogVGltZXN0YW1wQWxpZ25tZW50ID0gVGltZXN0YW1wQWxpZ25tZW50LmJvdHRvbTtcbiAgQElucHV0KCkgRGF0ZVNlcGFyYXRvclBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy5EYXlEYXRlVGltZTtcbiAgQElucHV0KCkgdGVtcGxhdGVzOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGVbXSA9IFtdO1xuICBASW5wdXQoKSBtZXNzYWdlc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIG5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0OiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBzY3JvbGxUb0JvdHRvbU9uTmV3TWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGhyZXNob2xkVmFsdWU6IG51bWJlciA9IDEwMDA7XG4gIEBJbnB1dCgpIHVucmVhZE1lc3NhZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDMwO1xuICBASW5wdXQoKSByZWFjdGlvbnNDb25maWd1cmF0aW9uOiBSZWFjdGlvbnNDb25maWd1cmF0aW9uID1cbiAgICBuZXcgUmVhY3Rpb25zQ29uZmlndXJhdGlvbih7fSk7XG4gIEBJbnB1dCgpIGRpc2FibGVSZWFjdGlvbnM6IEJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZW1vamlLZXlib2FyZFN0eWxlOiBFbW9qaUtleWJvYXJkU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgYXBpQ29uZmlndXJhdGlvbj86IChcbiAgICB1c2VyPzogQ29tZXRDaGF0LlVzZXIsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKSA9PiBQcm9taXNlPE9iamVjdD47XG5cbiAgQElucHV0KCkgb25UaHJlYWRSZXBsaWVzQ2xpY2shOlxuICAgIHwgKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIHZpZXc6IFRlbXBsYXRlUmVmPGFueT4pID0+IHZvaWQpXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBoZWFkZXJWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZm9vdGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHBhcmVudE1lc3NhZ2VJZCE6IG51bWJlcjtcbiAgQElucHV0KCkgdGhyZWFkSW5kaWNhdG9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvdGhyZWFkSW5kaWNhdG9ySWNvbi5zdmdcIjtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMjhweFwiLFxuICAgIGhlaWdodDogXCIyOHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuICBASW5wdXQoKSBkYXRlU2VwYXJhdG9yU3R5bGU6IERhdGVTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgd2lkdGg6IFwiXCIsXG4gIH07XG4gIEBJbnB1dCgpIG1lc3NhZ2VMaXN0U3R5bGU6IE1lc3NhZ2VMaXN0U3R5bGUgPSB7XG4gICAgbmFtZVRleHRGb250OiBcIjQwMCAxMXB4IEludGVyXCIsXG4gICAgZW1wdHlTdGF0ZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gICAgZXJyb3JTdGF0ZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIG1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb246IE1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24gPVxuICAgIG5ldyBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgZGlzYWJsZU1lbnRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgb3B0aW9uc1N0eWxlOiBNZW51TGlzdFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICAgIHN1Ym1lbnVXaWR0aDogXCIxMDAlXCIsXG4gICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgc3VibWVudUJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudUJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBtb3JlSWNvblRpbnQ6IFwiZ3JleVwiLFxuICB9O1xuICByZWNlaXB0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IHt9O1xuICBkb2N1bWVudEJ1YmJsZUFsaWdubWVudDogRG9jdW1lbnRJY29uQWxpZ25tZW50ID0gRG9jdW1lbnRJY29uQWxpZ25tZW50LnJpZ2h0O1xuICBjYWxsQnViYmxlQWxpZ25tZW50OiBEb2N1bWVudEljb25BbGlnbm1lbnQgPSBEb2N1bWVudEljb25BbGlnbm1lbnQubGVmdDtcbiAgaW1hZ2VNb2RlcmF0aW9uU3R5bGU6IEltYWdlTW9kZXJhdGlvblN0eWxlID0ge307XG4gIHRpbWVzdGFtcEVudW06IHR5cGVvZiBUaW1lc3RhbXBBbGlnbm1lbnQgPSBUaW1lc3RhbXBBbGlnbm1lbnQ7XG4gIHB1YmxpYyBjaGF0Q2hhbmdlZDogYm9vbGVhbiA9IHRydWU7XG4gIHN0YXJ0ZXJFcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIHN0YXJ0ZXJFbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgc3RhcnRlckxvYWRpbmdTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiR0VORVJBVElOR19JQ0VCUkVBS0VSU1wiKTtcbiAgc3VtbWFyeUVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgc3VtbWFyeUVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX01FU1NBR0VTX0ZPVU5EXCIpO1xuICBzdW1tYXJ5TG9hZGluZ1N0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJHRU5FUkFUSU5HX1NVTU1BUllcIik7XG4gIC8vIHB1YmxpYyBwcm9wZXJ0aWVzXG4gIHB1YmxpYyByZXF1ZXN0QnVpbGRlcjogYW55O1xuICBwdWJsaWMgY2xvc2VJbWFnZU1vZGVyYXRpb246IGFueTtcbiAgcHVibGljIHRpbWVTdGFtcENvbG9yOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgdGltZVN0YW1wRm9udDogc3RyaW5nID0gXCJcIjtcbiAgc21hcnRSZXBseVN0eWxlOiBTbWFydFJlcGxpZXNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICB9O1xuICBjb252ZXJzYXRpb25TdGFydGVyU3R5bGU6IFNtYXJ0UmVwbGllc1N0eWxlID0ge307XG4gIGNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZTogUGFuZWxTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIGNsb3NlSWNvblRpbnQ6IFwiXCIsXG4gICAgYm94U2hhZG93OiBcIlwiLFxuICAgIHRleHRGb250OiBcIlwiLFxuICAgIHRleHRDb2xvcjogXCJcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICB9O1xuXG4gIHB1YmxpYyBzaG93U21hcnRSZXBseTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdGFydGVyUmVwbGllczogc3RyaW5nW10gPSBbXTtcbiAgcHVibGljIGVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHNob3dDb252ZXJzYXRpb25TdW1tYXJ5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3VtbWFyeTogc3RyaW5nW10gPSBbXTtcbiAgcHVibGljIGdldFVucmVhZENvdW50OiBhbnkgPSAwO1xuXG4gIGNjSGlkZVBhbmVsITogU3Vic2NyaXB0aW9uO1xuICBjY1Nob3dQYW5lbCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NBY3RpdmVQcHBvdmVyITpTdWJzY3JpcHRpb247XG4gIHNtYXJ0UmVwbHlNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVuYWJsZVNtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc21hcnRSZXBseUNvbmZpZyE6IFNtYXJ0UmVwbGllc0NvbmZpZ3VyYXRpb247XG4gIHB1YmxpYyB0aW1lU3RhbXBCYWNrZ3JvdW5kOiBzdHJpbmcgPSBcIlwiO1xuICBsaW5rUHJldmlld1N0eWxlOiBMaW5rUHJldmlld1N0eWxlID0ge307XG4gIHB1YmxpYyB1bnJlYWRNZXNzYWdlc1N0eWxlID0ge307XG4gIHB1YmxpYyBtb2RhbFN0eWxlID0ge1xuICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgIHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG4gICAgY2xvc2VJY29uVGludDogXCJibHVlXCIsXG4gIH07XG4gIHB1YmxpYyBkaXZpZGVyU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMXB4XCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiZ3JleVwiLFxuICB9O1xuICBwb2xsQnViYmxlU3R5bGU6IFBvbGxzQnViYmxlU3R5bGUgPSB7fTtcbiAgbGFiZWxTdHlsZTogYW55ID0ge1xuICAgIHRleHRGb250OiBcIjQwMCAxMXB4IEludGVyXCIsXG4gICAgdGV4dENvbG9yOiBcImdyZXlcIixcbiAgfTtcbiAgaW1hZ2VCdWJibGVTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCJhdXRvXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweCA4cHggMHB4IDBweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgbWVzc2FnZXNMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFtdO1xuICBidWJibGVEYXRlU3R5bGU6IERhdGVTdHlsZSA9IHt9O1xuICB3aGl0ZWJvYXJkSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY29sbGFib3JhdGl2ZXdoaXRlYm9hcmQuc3ZnXCI7XG4gIGRvY3VtZW50SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY29sbGFib3JhdGl2ZWRvY3VtZW50LnN2Z1wiO1xuICBkaXJlY3RDYWxsSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvVmlkZW8tY2FsbDJ4LnN2Z1wiO1xuICBwbGFjZWhvbGRlckljb25VUkw6IHN0cmluZyA9IFwiL2Fzc2V0cy9wbGFjZWhvbGRlci5wbmdcIjtcbiAgZG93bmxvYWRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9kb3dubG9hZC5zdmdcIjtcbiAgdHJhbnNsYXRpb25TdHlsZTogTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUgPSB7fTtcbiAgZG9jdW1lbnRCdWJibGVTdHlsZTogRG9jdW1lbnRCdWJibGVTdHlsZSA9IHt9O1xuICBjYWxsQnViYmxlU3R5bGU6IERvY3VtZW50QnViYmxlU3R5bGUgPSB7fTtcbiAgd2hpdGVib2FyZFRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNPTExBQk9SQVRJVkVfV0hJVEVCT0FSRFwiKTtcbiAgd2hpdGVib2FyZFN1Yml0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiRFJBV19XSElURUJPQVJEX1RPR0VUSEVSXCIpO1xuICB3aGl0ZWJvYXJkQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJPUEVOX1dISVRFQk9BUkRcIik7XG4gIGRvY3VtZW50VGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ09MTEFCT1JBVElWRV9ET0NVTUVOVFwiKTtcbiAgZG9jdW1lbnRTdWJpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRSQVdfRE9DVU1FTlRfVE9HRVRIRVJcIik7XG4gIGRvY3VtZW50QnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJPUEVOX0RPQ1VNRU5UXCIpO1xuICBqb2luQ2FsbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSk9JTlwiKTtcbiAgdG9wT2JzZXJ2ZXIhOiBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbiAgYm90dG9tT2JzZXJ2ZXIhOiBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbiAgbG9jYWxpemU6IHR5cGVvZiBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICByZWluaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG4gIGFkZFJlYWN0aW9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYWRkcmVhY3Rpb24uc3ZnXCI7XG4gIE1lc3NhZ2VUeXBlc0NvbnN0YW50OiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzID1cbiAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXM7XG4gIGNhbGxDb25zdGFudDogc3RyaW5nID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGw7XG4gIHB1YmxpYyB0eXBlc01hcDogYW55ID0ge307XG4gIHB1YmxpYyBtZXNzYWdlVHlwZXNNYXA6IGFueSA9IHt9O1xuICB0aGVtZTogQ29tZXRDaGF0VGhlbWUgPSBuZXcgQ29tZXRDaGF0VGhlbWUoe30pO1xuICBwdWJsaWMgZ3JvdXBMaXN0ZW5lcklkID0gXCJncm91cF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgY2FsbExpc3RlbmVySWQgPSBcImNhbGxfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBwdWJsaWMgc3RhdGVzOiB0eXBlb2YgU3RhdGVzID0gU3RhdGVzO1xuICBNZXNzYWdlQ2F0ZWdvcnkgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnk7XG4gIHB1YmxpYyBudW1iZXJPZlRvcFNjcm9sbDogbnVtYmVyID0gMDtcbiAga2VlcFJlY2VudE1lc3NhZ2VzOiBib29sZWFuID0gdHJ1ZTtcbiAgbWVzc2FnZVRlbXBsYXRlOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGVbXSA9IFtdO1xuICBwdWJsaWMgb3BlbkNvbnRhY3RzVmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBtZXNzYWdlQ291bnQhOiBudW1iZXI7XG4gIGlzT25Cb3R0b206IGJvb2xlYW4gPSBmYWxzZTtcbiAgVW5yZWFkQ291bnQ6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gW107XG4gIG5ld01lc3NhZ2VDb3VudDogbnVtYmVyIHwgc3RyaW5nID0gMDtcbiAgdHlwZTogc3RyaW5nID0gXCJcIjtcbiAgY29uZmlybVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiWUVTXCIpO1xuICBjYW5jZWxUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PXCIpO1xuICB3YXJuaW5nVGV4dDogc3RyaW5nID0gXCJBcmUgeW91IHN1cmUgd2FudCB0byBzZWUgdW5zYWZlIGNvbnRlbnQ/XCI7XG4gIGNjTWVzc2FnZURlbGV0ZSE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlUmVhY3QhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVJlYWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXQhOiBTdWJzY3JpcHRpb247XG4gIGNjTGl2ZVJlYWN0aW9uITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VTZW50ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cERlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBDcmVhdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY091dGdvaW5nQ2FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0NhbGxBY2NlcHRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UZXh0TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VSZWFjdGlvbkFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkZvcm1NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkNhcmRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNEZWxpdmVyZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNSZWFkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZEJ5QWxsITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGwhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZURlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uSW50ZXJhY3Rpb25Hb2FsQ29tcGxldGVkITogU3Vic2NyaXB0aW9uO1xuICB0aHJlYWRlZEFsaWdubWVudDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDtcbiAgbWVzc2FnZUluZm9BbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICBvcGVuRW1vamlLZXlib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBrZXlib2FyZEFsaWdubWVudDogc3RyaW5nID0gUGxhY2VtZW50LnJpZ2h0O1xuICBwb3BvdmVyU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMzMwcHhcIixcbiAgICB3aWR0aDogXCIzMjVweFwiLFxuICB9O1xuICB2aWRlb0J1YmJsZVN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEzMHB4XCIsXG4gICAgd2lkdGg6IFwiMjMwcHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIHRocmVhZFZpZXdBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ7XG4gIHdoaXRlYm9hcmRVUkw6IHN0cmluZyB8IFVSTCB8IHVuZGVmaW5lZDtcbiAgZW5hYmxlRGF0YU1hc2tpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlVGh1bWJuYWlsR2VuZXJhdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVMaW5rUHJldmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVQb2xsczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVSZWFjdGlvbnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlSW1hZ2VNb2RlcmF0aW9uOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVN0aWNrZXJzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVdoaXRlYm9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlRG9jdW1lbnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd09uZ29pbmdDYWxsOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZUNhbGxpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgb25nb2luZ0NhbGxTdHlsZTogQ2FsbHNjcmVlblN0eWxlID0ge307XG4gIHNlc3Npb25JZDogc3RyaW5nID0gXCJcIjtcbiAgb3Blbk1lc3NhZ2VJbmZvUGFnZTogYm9vbGVhbiA9IGZhbHNlO1xuICBtZXNzYWdlSW5mb09iamVjdCE6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgaXNXZWJzb2NrZXRSZWNvbm5lY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29ubmVjdGlvbkxpc3RlbmVySWQgPSBcImNvbm5lY3Rpb25fXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgbGFzdE1lc3NhZ2VJZDogbnVtYmVyID0gMDtcbiAgaXNDb25uZWN0aW9uUmVlc3RhYmxpc2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0ZXh0Rm9ybWF0dGVycz86IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+O1xuXG4gIGNsb3NlSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIjtcbiAgdGhyZWFkT3Blbkljb246IHN0cmluZyA9IFwiYXNzZXRzL3NpZGUtYXJyb3cuc3ZnXCI7XG4gIGNvbmZpcm1EaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge307XG4gIHB1YmxpYyBtZXNzYWdlVG9SZWFjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgbnVsbCA9IG51bGw7XG5cbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgdHlwZXM6IHN0cmluZ1tdID0gW107XG4gIGNhdGVnb3JpZXM6IHN0cmluZ1tdID0gW107XG4gIGNhbGxiYWNrczogTWFwPHN0cmluZywgKHNlc3Npb25JZDogc3RyaW5nKSA9PiB2b2lkPiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkgeyB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgICB0aGlzLmNoYXRDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBjaGFuZ2VzW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcl0gfHxcbiAgICAgICAgY2hhbmdlc1tDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW107XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLnNob3dFbmFibGVkRXh0ZW5zaW9ucygpO1xuICAgICAgICB0aGlzLm51bWJlck9mVG9wU2Nyb2xsID0gMDtcbiAgICAgICAgaWYgKCF0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbXTtcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLnVzZXIpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHRoaXMudXNlcjtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcjtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ29tZXRDaGF0LmdldFVzZXIodGhpcy51c2VyKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXI7XG4gICAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuZ3JvdXApLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXAgPSB0aGlzLmdyb3VwO1xuICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ29tZXRDaGF0LmdldEdyb3VwKHRoaXMuZ3JvdXApLnRoZW4oKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5ncm91cCA9IGdyb3VwO1xuICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBzZW5kTWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgcmVjZWl2ZXJJZDogc3RyaW5nLFxuICAgIHJlY2VpdmVyVHlwZTogc3RyaW5nXG4gICkge1xuICAgIGlmIChtZXNzYWdlLmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCkge1xuICAgICAgY29uc3QgbmV3TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVGV4dE1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0VGV4dCgpLFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBDb21ldENoYXRVSUtpdC5zZW5kVGV4dE1lc3NhZ2UobmV3TWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSAobWVzc2FnZSBhcyBhbnkpPy5kYXRhPy5hdHRhY2htZW50c1swXTtcbiAgICAgIGNvbnN0IG5ld01lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgbWVzc2FnZS5nZXRUeXBlKCksXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcbiAgICAgIGxldCBhdHRhY2htZW50ID0gbmV3IENvbWV0Q2hhdC5BdHRhY2htZW50KHVwbG9hZGVkRmlsZSk7XG4gICAgICBuZXdNZXNzYWdlLnNldEF0dGFjaG1lbnQoYXR0YWNobWVudCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBDb21ldENoYXRVSUtpdC5zZW5kTWVkaWFNZXNzYWdlKG5ld01lc3NhZ2UgYXMgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSlcbiAgICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGNsb3NlQ29udGFjdHNQYWdlID0gKCkgPT4ge1xuICAgIHRoaXMub3BlbkNvbnRhY3RzVmlldyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgb25FbW9qaUtleWJvYXJkQ2xvc2VkKCkge1xuICAgIGlmICh0aGlzLm1lc3NhZ2VUb1JlYWN0KSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUb1JlYWN0ID0gbnVsbDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgYWRkUmVhY3Rpb24gPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBlbW9qaSA9IGV2ZW50Py5kZXRhaWw/LmlkO1xuICAgIHRoaXMucG9wb3ZlclJlZi5uYXRpdmVFbGVtZW50Lm9wZW5Db250ZW50VmlldyhldmVudCk7XG4gICAgaWYgKHRoaXMubWVzc2FnZVRvUmVhY3QpIHtcbiAgICAgIHRoaXMucmVhY3RUb01lc3NhZ2UoZW1vamksIHRoaXMubWVzc2FnZVRvUmVhY3QpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMubWVzc2FnZVRvUmVhY3QgPSBudWxsO1xuICAgICAgfSwgMCk7XG4gICAgfVxuICB9O1xuICBnZXRDYWxsQnViYmxlVGl0bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKFxuICAgICAgIW1lc3NhZ2UuZ2V0U2VuZGVyKCkgfHxcbiAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKClcbiAgICApIHtcbiAgICAgIHJldHVybiBsb2NhbGl6ZShcIllPVV9JTklUSUFURURfR1JPVVBfQ0FMTFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGAke21lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0TmFtZSgpfSAgJHtsb2NhbGl6ZShcbiAgICAgICAgXCJJTklUSUFURURfR1JPVVBfQ0FMTFwiXG4gICAgICApfWA7XG4gICAgfVxuICB9XG4gIGdldENhbGxBY3Rpb25NZXNzYWdlID0gKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgcmV0dXJuIENhbGxpbmdEZXRhaWxzVXRpbHMuZ2V0Q2FsbFN0YXR1cyhjYWxsLCB0aGlzLmxvZ2dlZEluVXNlcik7XG4gIH07XG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG5cbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0cnkge1xuICAgICAgLy9SZW1vdmluZyBNZXNzYWdlIExpc3RlbmVyc1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5ncm91cExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMaXN0ZW5lcklkKTtcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZClcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvbkFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGw/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkQnlBbGw/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZUVkaXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBSZWFjdGlvbnNTdHlsZSBvYmplY3Qgd2l0aCB0aGUgZGVmaW5lZCBvciBkZWZhdWx0IHN0eWxlcy5cbiAgICpcbiAgICogQHJldHVybnMge1JlYWN0aW9uc1N0eWxlfSBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIFJlYWN0aW9uc1N0eWxlIHdpdGggdGhlIHNldCBvciBkZWZhdWx0IHN0eWxlcy5cbiAgICovXG4gIGdldFJlYWN0aW9uc1N0eWxlKCkge1xuICAgIGNvbnN0IHJlYWN0aW9uc1N0eWxlID0gdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbnNTdHlsZSB8fCB7fTtcbiAgICByZXR1cm4gbmV3IFJlYWN0aW9uc1N0eWxlKHtcbiAgICAgIGhlaWdodDogcmVhY3Rpb25zU3R5bGU/LmhlaWdodCB8fCBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogcmVhY3Rpb25zU3R5bGU/LndpZHRoIHx8IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlcjogcmVhY3Rpb25zU3R5bGU/LmJvcmRlciB8fCBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogcmVhY3Rpb25zU3R5bGU/LmJvcmRlclJhZGl1cyB8fCBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IHJlYWN0aW9uc1N0eWxlPy5iYWNrZ3JvdW5kIHx8IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQmFja2dyb3VuZCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkxNTAoKSxcbiAgICAgIHJlYWN0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQmFja2dyb3VuZCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHJlYWN0aW9uQm9yZGVyOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Cb3JkZXIgfHxcbiAgICAgICAgYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQm9yZGVyOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25Cb3JkZXIgfHxcbiAgICAgICAgYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeTUwMCgpfWAsXG4gICAgICByZWFjdGlvbkJvcmRlclJhZGl1czogcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQm9yZGVyUmFkaXVzIHx8IFwiMTJweFwiLFxuICAgICAgYWN0aXZlUmVhY3Rpb25Db3VudFRleHRDb2xvcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Rm9udDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVhY3Rpb25Db3VudFRleHRGb250OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Db3VudFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZWFjdGlvbkNvdW50VGV4dENvbG9yOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Db3VudFRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcmVhY3Rpb25Cb3hTaGFkb3c6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJveFNoYWRvdyB8fCBcInJnYmEoMCwgMCwgMCwgMC4xKSAwcHggNHB4IDEycHhcIixcbiAgICAgIHJlYWN0aW9uRW1vamlGb250OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25FbW9qaUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgfSk7XG4gIH1cbiAgaXNNb2JpbGVWaWV3ID0gKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuaW5uZXJXaWR0aCA8PSA3Njg7XG4gIH07XG4gIGdldEJ1YmJsZUJ5SWQoaWQ6IHN0cmluZyk6IEVsZW1lbnRSZWYgfCB1bmRlZmluZWQge1xuICAgIGxldCB0YXJnZXRCdWJibGU6IEVsZW1lbnRSZWYgfCB1bmRlZmluZWQ7XG4gICAgdGhpcy5tZXNzYWdlQnViYmxlUmVmLmZvckVhY2goKGJ1YmJsZTogRWxlbWVudFJlZikgPT4ge1xuICAgICAgaWYgKGJ1YmJsZS5uYXRpdmVFbGVtZW50LmlkID09PSBpZClcbiAgICAgICAgdGFyZ2V0QnViYmxlID0gYnViYmxlO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRhcmdldEJ1YmJsZTtcbiAgfVxuICBzaG93RW1vamlLZXlib2FyZCA9IChpZDogbnVtYmVyLCBldmVudDogYW55KSA9PiB7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NBY3RpdmVQb3BvdmVyLm5leHQoQWN0aXZlUG9wb3Zlci5tZXNzYWdlTGlzdClcbiAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgZmFsc2UgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICBpZiAobWVzc2FnZSkge1xuICAgICAgdGhpcy5tZXNzYWdlVG9SZWFjdCA9IG1lc3NhZ2U7XG4gICAgICBpZiAodGhpcy5pc01vYmlsZVZpZXcoKSkge1xuICAgICAgICBsZXQgYnViYmxlUmVmID0gdGhpcy5nZXRCdWJibGVCeUlkKFN0cmluZyhpZCkpXG4gICAgICAgIGlmIChidWJibGVSZWYpIHtcbiAgICAgICAgICBjb25zdCByZWN0ID0gYnViYmxlUmVmLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgY29uc3QgaXNBdFRvcCA9IHJlY3QudG9wIDwgaW5uZXJIZWlnaHQgLyAyO1xuICAgICAgICAgIGNvbnN0IGlzQXRCb3R0b20gPSByZWN0LmJvdHRvbSA+IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG4gICAgICAgICAgaWYgKGlzQXRUb3ApIHtcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRBbGlnbm1lbnQgPSBQbGFjZW1lbnQuYm90dG9tO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNBdEJvdHRvbSkge1xuICAgICAgICAgICAgdGhpcy5rZXlib2FyZEFsaWdubWVudCA9IFBsYWNlbWVudC50b3A7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5rZXlib2FyZEFsaWdubWVudCA9XG4gICAgICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICA/IFBsYWNlbWVudC5sZWZ0XG4gICAgICAgICAgICA6IFBsYWNlbWVudC5yaWdodDtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHRoaXMucG9wb3ZlclJlZi5uYXRpdmVFbGVtZW50Lm9wZW5Db250ZW50VmlldyhldmVudCk7XG4gICAgfVxuICB9O1xuICBzZXRCdWJibGVWaWV3ID0gKCkgPT4ge1xuICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSkgPT4ge1xuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbZWxlbWVudC5jYXRlZ29yeSsnXycrZWxlbWVudC50eXBlXSA9IGVsZW1lbnQ7ICAgICAgXG4gICAgfSk7XG4gIH07XG4gIG9wZW5UaHJlYWRWaWV3ID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGlmICh0aGlzLm9uVGhyZWFkUmVwbGllc0NsaWNrKSB7XG4gICAgICB0aGlzLm9uVGhyZWFkUmVwbGllc0NsaWNrKG1lc3NhZ2UsIHRoaXMudGhyZWFkTWVzc2FnZUJ1YmJsZSk7XG4gICAgfVxuICB9O1xuICB0aHJlYWRDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub3BlblRocmVhZFZpZXcobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIGRlbGV0ZUNhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5kZWxldGVNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBlZGl0Q2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLm9uRWRpdE1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIGNvcHlDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub25Db3B5TWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgbWVzc2FnZVByaXZhdGVseUNhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5zZW5kTWVzc2FnZVByaXZhdGVseShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgbWVzc2FnZUluZm9DYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub3Blbk1lc3NhZ2VJbmZvKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBvcGVuTWVzc2FnZUluZm8obWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdGhpcy5vcGVuTWVzc2FnZUluZm9QYWdlID0gdHJ1ZTtcbiAgICB0aGlzLm1lc3NhZ2VJbmZvT2JqZWN0ID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2VPYmplY3QpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBjbG9zZU1lc3NhZ2VJbmZvUGFnZSA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5NZXNzYWdlSW5mb1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIHNlbmRNZXNzYWdlUHJpdmF0ZWx5KG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjT3BlbkNoYXQubmV4dCh7IHVzZXI6IG1lc3NhZ2VPYmplY3QuZ2V0U2VuZGVyKCkgfSk7XG4gIH1cbiAgZ2V0TWVzc2FnZUJ5SWQoaWQ6IG51bWJlciB8IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KChtKSA9PiBtLmdldElkKCkgPT0gaWQpO1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBpc1RyYW5zbGF0ZWQobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogYW55IHtcbiAgICBsZXQgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q6IGFueSA9IG1lc3NhZ2U7XG4gICAgaWYgKFxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3QgJiZcbiAgICAgIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0Py5kYXRhPy5tZXRhZGF0YSAmJlxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q/LmRhdGE/Lm1ldGFkYXRhW1xuICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnRyYW5zbGF0ZWRfbWVzc2FnZVxuICAgICAgXVxuICAgICkge1xuICAgICAgcmV0dXJuIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0LmRhdGEubWV0YWRhdGFbXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy50cmFuc2xhdGVkX21lc3NhZ2VcbiAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICB1cGRhdGVUcmFuc2xhdGVkTWVzc2FnZSA9ICh0cmFuc2xhdGlvbjogYW55KSA9PiB7XG4gICAgdmFyIHJlY2VpdmVkTWVzc2FnZSA9IHRyYW5zbGF0aW9uO1xuICAgIHZhciB0cmFuc2xhdGVkVGV4dCA9IHJlY2VpdmVkTWVzc2FnZS50cmFuc2xhdGlvbnNbMF0ubWVzc2FnZV90cmFuc2xhdGVkO1xuICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gcmVjZWl2ZWRNZXNzYWdlLm1zZ0lkXG4gICAgKTtcbiAgICBsZXQgZGF0YTogYW55O1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIHZhciBtZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlS2V5XTtcbiAgICAgIGlmICgobWVzc2FnZU9iaiBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldE1ldGFkYXRhKCkpIHtcbiAgICAgICAgZGF0YSA9IChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0TWV0YWRhdGEoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TWV0YWRhdGEoe30pO1xuICAgICAgICBkYXRhID0gKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRNZXRhZGF0YSgpO1xuICAgICAgfVxuICAgICAgZGF0YVtNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudHJhbnNsYXRlZF9tZXNzYWdlXSA9IHRyYW5zbGF0ZWRUZXh0O1xuICAgICAgdmFyIG5ld01lc3NhZ2VPYmo6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9XG4gICAgICAgIG1lc3NhZ2VPYmo7XG4gICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbmV3TWVzc2FnZU9iaik7XG4gICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlTGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICB0cmFuc2xhdGVNZXNzYWdlID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgZmFsc2UgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICBpZiAobWVzc2FnZSkge1xuICAgICAgQ29tZXRDaGF0LmNhbGxFeHRlbnNpb24oXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy5tZXNzYWdlX3RyYW5zbGF0aW9uLFxuICAgICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMucG9zdCxcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnYyX3RyYW5zbGF0ZSxcbiAgICAgICAge1xuICAgICAgICAgIG1zZ0lkOiBtZXNzYWdlLmdldElkKCksXG4gICAgICAgICAgdGV4dDogKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRUZXh0KCksXG4gICAgICAgICAgbGFuZ3VhZ2VzOiBuYXZpZ2F0b3IubGFuZ3VhZ2VzLFxuICAgICAgICB9XG4gICAgICApXG4gICAgICAgIC50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHJlc3VsdD8udHJhbnNsYXRpb25zWzBdPy5tZXNzYWdlX3RyYW5zbGF0ZWQgIT1cbiAgICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk/LmdldFRleHQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVUcmFuc2xhdGVkTWVzc2FnZShyZXN1bHQpO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlc3VsdCBvZiB0cmFuc2xhdGlvbnNcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4geyB9KTtcbiAgICB9XG4gIH07XG4gIHNldE9wdGlvbnNDYWxsYmFjayhvcHRpb25zOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10sIGlkOiBudW1iZXIpIHtcbiAgICBvcHRpb25zPy5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRNZXNzYWdlT3B0aW9uKSA9PiB7XG4gICAgICBzd2l0Y2ggKGVsZW1lbnQuaWQpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLmRlbGV0ZU1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uZWRpdE1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZWRpdENhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnRyYW5zbGF0ZU1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMudHJhbnNsYXRlTWVzc2FnZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5jb3B5TWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5jb3B5Q2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVhY3RUb01lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2sgfHwgIShlbGVtZW50IGFzIGFueSkuY3VzdG9tVmlldykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5yZXBseUluVGhyZWFkOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLnRocmVhZENhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnNlbmRNZXNzYWdlUHJpdmF0ZWx5OlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm1lc3NhZ2VQcml2YXRlbHlDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5tZXNzYWdlSW5mb3JtYXRpb246XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMubWVzc2FnZUluZm9DYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH1cbiAgLyoqXG4gICAqIHNlbmQgbWVzc2FnZSBvcHRpb25zIGJhc2VkIG9uIHR5cGVcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtc2dPYmplY3RcbiAgICovXG4gIHNldE1lc3NhZ2VPcHRpb25zKFxuICAgIG1zZ09iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSB7XG4gICAgbGV0IG9wdGlvbnMhOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW107XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUgJiZcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmxlbmd0aCA+IDAgJiZcbiAgICAgICFtc2dPYmplY3Q/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2dPYmplY3Q/LmdldFR5cGUoKSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXJcbiAgICApIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSkgPT4ge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgbXNnT2JqZWN0Py5nZXRJZCgpICYmXG4gICAgICAgICAgZWxlbWVudC50eXBlID09IG1zZ09iamVjdD8uZ2V0VHlwZSgpICYmXG4gICAgICAgICAgZWxlbWVudD8ub3B0aW9uc1xuICAgICAgICApIHtcbiAgICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICAgIHRoaXMuc2V0T3B0aW9uc0NhbGxiYWNrKFxuICAgICAgICAgICAgICBlbGVtZW50Py5vcHRpb25zKFxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyLFxuICAgICAgICAgICAgICAgIG1zZ09iamVjdCxcbiAgICAgICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIG1zZ09iamVjdD8uZ2V0SWQoKVxuICAgICAgICAgICAgKSB8fCBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSBbXTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IHRoaXMuZmlsdGVyRW1vamlPcHRpb25zKG9wdGlvbnMpO1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG4gIC8qKlxuICAgKiBSZWFjdHMgdG8gYSBtZXNzYWdlIGJ5IGVpdGhlciBhZGRpbmcgb3IgcmVtb3ZpbmcgdGhlIHJlYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZW1vamkgLSBUaGUgZW1vamkgdXNlZCBmb3IgdGhlIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoYXQgd2FzIHJlYWN0ZWQgdG8uXG4gICAqL1xuXG4gIHJlYWN0VG9NZXNzYWdlKGVtb2ppOiBzdHJpbmcsIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IG1lc3NhZ2U/LmdldElkKCk7XG4gICAgY29uc3QgbXNnT2JqZWN0ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlSWQpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgICBjb25zdCByZWFjdGlvbnMgPSBtc2dPYmplY3Q/LmdldFJlYWN0aW9ucygpIHx8IFtdO1xuICAgIGNvbnN0IGVtb2ppT2JqZWN0ID0gcmVhY3Rpb25zPy5maW5kKChyZWFjdGlvbjogYW55KSA9PiB7XG4gICAgICByZXR1cm4gcmVhY3Rpb24/LnJlYWN0aW9uID09IGVtb2ppO1xuICAgIH0pO1xuICAgIGlmIChlbW9qaU9iamVjdCAmJiBlbW9qaU9iamVjdD8uZ2V0UmVhY3RlZEJ5TWUoKSkge1xuICAgICAgY29uc3QgdXBkYXRlZFJlYWN0aW9uczogYW55W10gPSBbXTtcbiAgICAgIHJlYWN0aW9ucy5mb3JFYWNoKChyZWFjdGlvbikgPT4ge1xuICAgICAgICBpZiAocmVhY3Rpb24/LmdldFJlYWN0aW9uKCkgPT0gZW1vamkpIHtcbiAgICAgICAgICBpZiAocmVhY3Rpb24/LmdldENvdW50KCkgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVhY3Rpb24uc2V0Q291bnQocmVhY3Rpb24/LmdldENvdW50KCkgLSAxKTtcbiAgICAgICAgICAgIHJlYWN0aW9uLnNldFJlYWN0ZWRCeU1lKGZhbHNlKTtcbiAgICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbXNnT2JqZWN0LnNldFJlYWN0aW9ucyh1cGRhdGVkUmVhY3Rpb25zKTtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZVJlYWN0aW9uKG1lc3NhZ2VJZCwgZW1vamkpXG4gICAgICAgIC50aGVuKChtZXNzYWdlKSA9PiB7IH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAvLyBSZXR1cm4gb2xkIG1lc3NhZ2Ugb2JqZWN0IGluc3RlYWQgb2ZcbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTsgLy9uZWVkIGNoYW5nZXNcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB1cGRhdGVkUmVhY3Rpb25zID0gW107XG4gICAgICBjb25zdCByZWFjdGlvbkF2YWlsYWJsZSA9IHJlYWN0aW9ucy5maW5kKChyZWFjdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gcmVhY3Rpb24/LmdldFJlYWN0aW9uKCkgPT0gZW1vamk7XG4gICAgICB9KTtcblxuICAgICAgcmVhY3Rpb25zLmZvckVhY2goKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChyZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSA9PSBlbW9qaSkge1xuICAgICAgICAgIHJlYWN0aW9uLnNldENvdW50KHJlYWN0aW9uPy5nZXRDb3VudCgpICsgMSk7XG4gICAgICAgICAgcmVhY3Rpb24uc2V0UmVhY3RlZEJ5TWUodHJ1ZSk7XG4gICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICghcmVhY3Rpb25BdmFpbGFibGUpIHtcbiAgICAgICAgY29uc3QgcmVhY3Q6IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50ID0gbmV3IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50KFxuICAgICAgICAgIGVtb2ppLFxuICAgICAgICAgIDEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3QpO1xuICAgICAgfVxuICAgICAgbXNnT2JqZWN0LnNldFJlYWN0aW9ucyh1cGRhdGVkUmVhY3Rpb25zKTtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgQ29tZXRDaGF0LmFkZFJlYWN0aW9uKG1lc3NhZ2VJZCwgZW1vamkpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7IH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBGaWx0ZXJzIG91dCB0aGUgJ2FkZCByZWFjdGlvbicgb3B0aW9uIGlmIHJlYWN0aW9ucyBhcmUgZGlzYWJsZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbltdfSBvcHRpb25zIC0gVGhlIG9yaWdpbmFsIHNldCBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIHtDb21ldENoYXRNZXNzYWdlT3B0aW9uW119IFRoZSBmaWx0ZXJlZCBzZXQgb2YgbWVzc2FnZSBvcHRpb25zLlxuICAgKi9cblxuICBmaWx0ZXJFbW9qaU9wdGlvbnMgPSAob3B0aW9uczogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdKSA9PiB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZVJlYWN0aW9ucyAmJiBvcHRpb25zPy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5maWx0ZXIoKG9wdGlvbjogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gb3B0aW9uLmlkICE9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlYWN0VG9NZXNzYWdlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xuICB9O1xuICBnZXRDbG9uZWRSZWFjdGlvbk9iamVjdChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICByZXR1cm4gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2UpO1xuICB9XG4gIC8qKlxuICAgKiBwYXNzaW5nIHN0eWxlIGJhc2VkIG9uIG1lc3NhZ2Ugb2JqZWN0XG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZU9iamVjdFxuICAgKi9cbiAgc2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1zZzogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogQmFzZVN0eWxlIHtcbiAgICBsZXQgc3R5bGUhOiBCYXNlU3R5bGU7XG4gICAgaWYgKG1zZz8uZ2V0RGVsZXRlZEF0KCkpIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlcjogYDFweCBkYXNoZWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5tZWV0aW5nICYmXG4gICAgICAoIW1zZz8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgbXNnPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSlcbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgICAgLy8gfSBlbHNlIGlmICh0aGlzLmdldExpbmtQcmV2aWV3KG1zZyBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpKSB7XG4gICAgICAvLyAgIHN0eWxlID0ge1xuICAgICAgLy8gICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIC8vICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgLy8gICB9O1xuICAgIH0gZWxzZSBpZiAobXNnPy5nZXRUeXBlKCkgPT0gU3RpY2tlcnNDb25zdGFudHMuc3RpY2tlcikge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFtc2c/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2c/LmdldENhdGVnb3J5KCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0ICYmXG4gICAgICAoIW1zZz8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09IG1zZz8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpXG4gICAgKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgICB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0XG4gICAgICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKClcbiAgICAgICAgICAgIDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAhbXNnPy5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIgfHxcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudFxuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKX1gLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgIW1zZz8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlXG4gICAgKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICB3aWR0aDogXCIzMDBweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBtc2c/LmdldFNlbmRlcigpICYmXG4gICAgICAgIG1zZz8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZTtcbiAgfVxuICBnZXRTZXNzaW9uSWQobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICBsZXQgZGF0YTogYW55ID0gbWVzc2FnZS5nZXREYXRhKCk7XG4gICAgcmV0dXJuIGRhdGE/LmN1c3RvbURhdGE/LnNlc3Npb25JRDtcbiAgfVxuICBnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKG1lc3NhZ2U/LmdldERhdGEoKSkge1xuICAgICAgICB2YXIgZGF0YTogYW55ID0gbWVzc2FnZS5nZXREYXRhKCk7XG4gICAgICAgIGlmIChkYXRhPy5tZXRhZGF0YSkge1xuICAgICAgICAgIHZhciBtZXRhZGF0YSA9IGRhdGE/Lm1ldGFkYXRhO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KG1ldGFkYXRhLCBcIkBpbmplY3RlZFwiKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFyIGluamVjdGVkT2JqZWN0ID0gbWV0YWRhdGFbXCJAaW5qZWN0ZWRcIl07XG4gICAgICAgICAgICBpZiAoaW5qZWN0ZWRPYmplY3Q/LmV4dGVuc2lvbnMpIHtcbiAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbk9iamVjdCA9IGluamVjdGVkT2JqZWN0LmV4dGVuc2lvbnM7XG4gICAgICAgICAgICAgIHJldHVybiBleHRlbnNpb25PYmplY3RbXG4gICAgICAgICAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMud2hpdGVib2FyZFxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgPyBleHRlbnNpb25PYmplY3RbQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMud2hpdGVib2FyZF1cbiAgICAgICAgICAgICAgICAgIC5ib2FyZF91cmxcbiAgICAgICAgICAgICAgICA6IGV4dGVuc2lvbk9iamVjdFtDb2xsYWJvcmF0aXZlRG9jdW1lbnRDb25zdGFudHMuZG9jdW1lbnRdXG4gICAgICAgICAgICAgICAgICAuZG9jdW1lbnRfdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcGVuTGlua1VSTChldmVudDogYW55KSB7XG4gICAgd2luZG93Lm9wZW4oZXZlbnQ/LmRldGFpbD8udXJsLCBcIl9ibGFua1wiKTtcbiAgfVxuICBnZXRTdGlja2VyKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBzdGlja2VyRGF0YTogYW55ID0gbnVsbDtcbiAgICAgIGlmIChcbiAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5kYXRhXG4gICAgICAgICkgJiZcbiAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpLmdldERhdGEoKSxcbiAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5jdXN0b21fZGF0YVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgc3RpY2tlckRhdGEgPSAobWVzc2FnZSBhcyBhbnkpLmRhdGEuY3VzdG9tRGF0YTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgICAgc3RpY2tlckRhdGEsXG4gICAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5zdGlja2VyX3VybFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHN0aWNrZXJEYXRhLnN0aWNrZXJfdXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ3N0YXR1c0luZm9WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRDb250ZW50VmlldyA9IChcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPT4ge1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5jb250ZW50Vmlld1xuICAgICkge1xuICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uY29udGVudFZpZXcobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLmdldERlbGV0ZWRBdCgpXG4gICAgICAgID8gdGhpcy50eXBlc01hcFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHRdXG4gICAgICAgIDogdGhpcy50eXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV07XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnaGVhZGVyVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cbiAgZ2V0SGVhZGVyVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgbGV0IHZpZXc6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uaGVhZGVyVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uaGVhZGVyVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ2Zvb3RlclZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldEZvb3RlclZpZXcobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGxldCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LmZvb3RlclZpZXdcbiAgICApIHtcbiAgICAgIHZpZXcgPSB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LmZvb3RlclZpZXcobWVzc2FnZSk7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdib3R0b21WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRCb3R0b21WaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uYm90dG9tVmlld1xuICAgICkge1xuICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uYm90dG9tVmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdzdGF0dXNJbmZvVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cblxuICBnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LnN0YXR1c0luZm9WaWV3XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5zdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIGlzQXVkaW9PclZpZGVvTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBtZXNzYWdlVHlwZSA9IG1lc3NhZ2U/LmdldFR5cGUoKTtcbiAgICBjb25zdCB0eXBlc1RvQ2hlY2sgPSBbXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8sXG4gICAgXTtcbiAgICByZXR1cm4gdHlwZXNUb0NoZWNrLmluY2x1ZGVzKG1lc3NhZ2VUeXBlKTtcbiAgfVxuXG4gIHNldEJ1YmJsZUFsaWdubWVudCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgYWxpZ25tZW50OiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5jZW50ZXI7XG4gICAgaWYgKHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQpIHtcbiAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyIHx8XG4gICAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudFxuICAgICAgKSB7XG4gICAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQuY2VudGVyO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSAhPVxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcilcbiAgICAgICkge1xuICAgICAgICBhbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWxpZ25tZW50O1xuICB9O1xuXG4gIGdldEZvcm1NZXNzYWdlQnViYmxlU3R5bGUoKSB7XG4gICAgY29uc3QgdGV4dFN0eWxlID0gbmV3IElucHV0U3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjMwcHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIHBhZGRpbmc6IFwiMHB4IDBweCAwcHggNXB4XCIsXG4gICAgICBwbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgfSk7XG4gICAgY29uc3QgbGFiZWxTdHlsZSA9IG5ldyBMYWJlbFN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICBjb25zdCByYWRpb0J1dHRvblN0eWxlID0gbmV3IFJhZGlvQnV0dG9uU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBsYWJlbFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGxhYmVsVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjRweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJcIixcbiAgICB9KTtcbiAgICBjb25zdCBjaGVja2JveFN0eWxlID0gbmV3IENoZWNrYm94U3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgbGFiZWxUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBsYWJlbFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICB9KTtcbiAgICBjb25zdCBkcm9wZG93blN0eWxlID0gbmV3IERyb3Bkb3duU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjM1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjZweFwiLFxuICAgICAgYWN0aXZlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYWN0aXZlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG9wdGlvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgb3B0aW9uQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgb3B0aW9uSG92ZXJCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcbiAgICBjb25zdCBidXR0b25Hcm91cFN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgfTtcbiAgICBjb25zdCBzaW5nbGVTZWxlY3RTdHlsZSA9IG5ldyBTaW5nbGVTZWxlY3RTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGFjdGl2ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGFjdGl2ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgb3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBvcHRpb25Cb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBvcHRpb25Cb3JkZXJSYWRpdXM6IFwiM3B4XCIsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcbiAgICBjb25zdCBxdWlja1ZpZXdTdHlsZSA9IG5ldyBRdWlja1ZpZXdTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbGVhZGluZ0JhclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbGVhZGluZ0JhcldpZHRoOiBcIjRweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgRm9ybUJ1YmJsZVN0eWxlKHtcbiAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB3cmFwcGVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB3cmFwcGVyQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgdGV4dElucHV0U3R5bGU6IHRleHRTdHlsZSxcbiAgICAgIGxhYmVsU3R5bGU6IGxhYmVsU3R5bGUsXG4gICAgICByYWRpb0J1dHRvblN0eWxlOiByYWRpb0J1dHRvblN0eWxlLFxuICAgICAgY2hlY2tib3hTdHlsZTogY2hlY2tib3hTdHlsZSxcbiAgICAgIGRyb3Bkb3duU3R5bGU6IGRyb3Bkb3duU3R5bGUsXG4gICAgICBidXR0b25TdHlsZTogYnV0dG9uR3JvdXBTdHlsZSxcbiAgICAgIHNpbmdsZVNlbGVjdFN0eWxlOiBzaW5nbGVTZWxlY3RTdHlsZSxcbiAgICAgIHF1aWNrVmlld1N0eWxlOiBxdWlja1ZpZXdTdHlsZSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHdyYXBwZXJQYWRkaW5nOiBcIjJweFwiLFxuICAgICAgZGF0ZVBpY2tlckJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGRhdGVQaWNrZXJCb3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBkYXRlUGlja2VyRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBkYXRlUGlja2VyRm9udENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q2FyZE1lc3NhZ2VCdWJibGVTdHlsZSgpIHtcbiAgICBjb25zdCBidXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCI0MHB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwcHhcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogYCR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCl9YCxcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IENhcmRCdWJibGVTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICBpbWFnZUhlaWdodDogXCJhdXRvXCIsXG4gICAgICBpbWFnZVdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGltYWdlUmFkaXVzOiBcIjhweFwiLFxuICAgICAgaW1hZ2VCYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGRlc2NyaXB0aW9uRm9udENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGVzY3JpcHRpb25Gb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblN0eWxlOiBidXR0b25TdHlsZSxcbiAgICAgIGRpdmlkZXJUaW50Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICB3cmFwcGVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB3cmFwcGVyQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgd3JhcHBlclBhZGRpbmc6IFwiMnB4XCIsXG4gICAgICBkaXNhYmxlZEJ1dHRvbkNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q2FsbEJ1YmJsZVN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHZhciBpc0xlZnRBbGlnbmVkID0gdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIGlmIChpc1VzZXJTZW50TWVzc2FnZSAmJiAhaXNMZWZ0QWxpZ25lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBidXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIHdpZHRoOiBcIjI0MHB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiMjQwcHhcIixcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGdldEJ1YmJsZVdyYXBwZXIgPSAoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0+IHtcbiAgICBsZXQgdmlldzogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXAgJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0uYnViYmxlVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0uYnViYmxlVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3ID0gbnVsbDtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH1cbiAgfTtcbiAgZ2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0IHx8XG4gICAgICAobWVzc2FnZS5nZXRTZW5kZXIoKSAmJlxuICAgICAgICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpKVxuICAgICAgPyBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnRcbiAgICAgIDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5yaWdodDtcbiAgfVxuICBzZXRUcmFuc2xhdGlvblN0eWxlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHZhciBpc0xlZnRBbGlnbmVkID0gdGhpcy5hbGlnbm1lbnQgIT09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQ7XG4gICAgdmFyIGlzVXNlclNlbnRNZXNzYWdlID1cbiAgICAgICFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09PSBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKTtcbiAgICBpZiAoIWlzTGVmdEFsaWduZWQpIHtcbiAgICAgIHJldHVybiBuZXcgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUoe1xuICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgICApLFxuICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImxpZ2h0XCIpLFxuICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgICBoZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNVc2VyU2VudE1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSh7XG4gICAgICAgICAgdHJhbnNsYXRlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgICAgICksXG4gICAgICAgICAgdHJhbnNsYXRlZFRleHRDb2xvcjpcbiAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMChcImRhcmtcIiksXG4gICAgICAgICAgaGVscFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlKHtcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOlxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJsaWdodFwiKSxcbiAgICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgICAgIGhlbHBUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgZ2V0Q2FsbFR5cGVJY29uKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGlmIChtZXNzYWdlLmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8pIHtcbiAgICAgIHJldHVybiBcImFzc2V0cy9BdWRpby1DYWxsLnN2Z1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJhc3NldHMvVmlkZW8tY2FsbC5zdmdcIjtcbiAgICB9XG4gIH1cbiAgY2FsbFN0YXR1c1N0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuXG4gICAgaWYgKG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudCkge1xuICAgICAgbGV0IG1pc3NlZENhbGxUZXh0Q29sb3IgPSBDYWxsaW5nRGV0YWlsc1V0aWxzLmlzTWlzc2VkQ2FsbChcbiAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQ2FsbCxcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXJcbiAgICAgIClcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKClcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgICApLFxuICAgICAgICBidXR0b25UZXh0Q29sb3I6IG1pc3NlZENhbGxUZXh0Q29sb3IsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMHB4XCIsXG4gICAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICAgIGJ1dHRvbkljb25UaW50OiBtaXNzZWRDYWxsVGV4dENvbG9yLFxuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIHBhZGRpbmc6IFwiOHB4IDEycHhcIixcbiAgICAgICAgZ2FwOiBcIjRweFwiLFxuICAgICAgICBoZWlnaHQ6IFwiMjVweFwiLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICBzZXRUZXh0QnViYmxlU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGlzSW5mb0J1YmJsZSA9IHRoaXMubWVzc2FnZUluZm9PYmplY3QgJiYgbWVzc2FnZS5nZXRJZCgpICYmIHRoaXMubWVzc2FnZUluZm9PYmplY3QuZ2V0SWQoKSA9PSBtZXNzYWdlLmdldElkKClcbiAgICB2YXIgaXNEZWxldGVkID0gbWVzc2FnZS5nZXREZWxldGVkQXQoKTtcbiAgICB2YXIgbm90TGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCAhPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNUZXh0TWVzc2FnZSA9XG4gICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSAmJlxuICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIHZhciBpc0dyb3VwTWVtYmVyTWVzc2FnZSA9XG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcjtcbiAgICBpZiAoIWlzRGVsZXRlZCAmJiBub3RMZWZ0QWxpZ25lZCAmJiBpc1RleHRNZXNzYWdlICYmIGlzVXNlclNlbnRNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgICBidWJibGVQYWRkaW5nOiBpc0luZm9CdWJibGUgPyBcIjhweCAxMnB4XCIgOiBcIjhweCAxMnB4IDAgMTJweFwiXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhaXNEZWxldGVkICYmXG4gICAgICBub3RMZWZ0QWxpZ25lZCAmJlxuICAgICAgaXNUZXh0TWVzc2FnZSAmJlxuICAgICAgIWlzVXNlclNlbnRNZXNzYWdlICYmXG4gICAgICAhaXNHcm91cE1lbWJlck1lc3NhZ2VcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGJ1YmJsZVBhZGRpbmc6IFwiOHB4IDEycHggMnB4IDEycHhcIlxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGlzR3JvdXBNZW1iZXJNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmICghbm90TGVmdEFsaWduZWQgJiYgaXNUZXh0TWVzc2FnZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGJ1YmJsZVBhZGRpbmc6IFwiOHB4IDEycHhcIlxuICAgIH07XG4gIH07XG4gIC8qXG4qIGlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIGZvciB0aGlzIGxpc3QgYW5kIGlzIG5vdCBwYXJ0IG9mIHRocmVhZCBldmVuIGZvciBjdXJyZW50IGxpc3RcbiAgaXQgb25seSBydW5zIGZvciBVSSBldmVudCBiZWNhdXNlIGl0IGFzc3VtZXMgbG9nZ2VkIGluIHVzZXIgaXMgYWx3YXlzIHNlbmRlclxuKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuKi9cbiAgaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBtZXNzYWdlPy5nZXRSZWNlaXZlclR5cGUoKTtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmIHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIGlmIChyZWNlaXZlclR5cGUgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiYgcmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgIH1cbiAgICB9XG5cbiAgLypcbiAgICAqIGlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudDogVG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgYmVsb25ncyBmb3IgdGhpcyBsaXN0IGFuZCBpcyBub3QgcGFydCBvZiB0aHJlYWQgZXZlbiBmb3IgY3VycmVudCBsaXN0XG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFNESyBldmVudCBiZWNhdXNlIGl0IG5lZWRzIHNlbmRlcklkIHRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIHNhbWUgdXNlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50ID1cbiAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCByZWNlaXZlcklkID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpO1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJUeXBlKCk7XG4gICAgICBjb25zdCBzZW5kZXJJZCA9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKTtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkgfHwgc2VuZGVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJiAocmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgfVxuICAgIH1cblxuICAvKlxuICAgICogaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudDogVG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgYmVsb25ncyB0aHJlYWQgb2YgdGhpcyBsaXN0LFxuICAgICAgaXQgb25seSBydW5zIGZvciBVSSBldmVudCBiZWNhdXNlIGl0IGFzc3VtZXMgbG9nZ2VkIGluIHVzZXIgaXMgYWx3YXlzIHNlbmRlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKCFtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZWNlaXZlcklkID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpO1xuXG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgLypcbiAgICAqIGlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIHRocmVhZCBvZiB0aGlzIGxpc3QsXG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFNESyBldmVudCBiZWNhdXNlIGl0IG5lZWRzIHNlbmRlcklkIHRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIHNhbWUgdXNlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGlmICghbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCBzZW5kZXJJZCA9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKTtcblxuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICBpZiAocmVjZWl2ZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpIHx8IHNlbmRlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIHNldEZpbGVCdWJibGVTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBhbnkge1xuICAgIHZhciBpc0ZpbGVNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlO1xuICAgIGlmIChpc0ZpbGVNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgICAgc3VidGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgdGhpcy5pb0JvdHRvbSgpO1xuICAgIHRoaXMuaW9Ub3AoKTtcbiAgICB0aGlzLmNoZWNrTWVzc2FnZVRlbXBsYXRlKCk7XG4gIH1cblxuICBnZXRTdGFydENhbGxGdW5jdGlvbihtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSk6IChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdm9pZCB7XG4gICAgbGV0IHNlc3Npb25JZCA9IHRoaXMuZ2V0U2Vzc2lvbklkKG1lc3NhZ2UpXG4gICAgbGV0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3MuZ2V0KHNlc3Npb25JZCk7XG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2sgPSAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHRoaXMuc3RhcnREaXJlY3RDYWxsKHNlc3Npb25JZCwgbWVzc2FnZSk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5zZXQoc2Vzc2lvbklkLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIHJldHVybiBjYWxsYmFjaztcbiAgfVxuICBzdGFydERpcmVjdENhbGwgPSAoc2Vzc2lvbklkOiBzdHJpbmcsIG1lc3NhZ2U6IGFueSkgPT4ge1xuICAgIHRoaXMuc2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gdHJ1ZTtcbiAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBtZXNzYWdlKVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgbGF1bmNoQ29sbGFib3JhdGl2ZURvY3VtZW50ID0gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgd2luZG93Lm9wZW4odXJsLFwiXCIsXCJmdWxsc2NyZWVuPXllcywgc2Nyb2xsYmFycz1hdXRvXCIpO1xuICB9O1xuXG4gIGxhdW5jaENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkID0gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgd2luZG93Lm9wZW4oXG4gICAgICB1cmwgKyBgJnVzZXJuYW1lPSR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX1gLFxuICAgICAgXCJcIixcbiAgICAgIFwiZnVsbHNjcmVlbj15ZXMsIHNjcm9sbGJhcnM9YXV0b1wiXG4gICAgKTtcbiAgfTtcbiAgLyoqXG4gICAqIEV4dHJhY3RpbmcgIHR5cGVzIGFuZCBjYXRlZ29yaWVzIGZyb20gdGVtcGxhdGVcbiAgICpcbiAgICovXG4gIGNoZWNrTWVzc2FnZVRlbXBsYXRlKCkge1xuICAgIHRoaXMudHlwZXNNYXAgPSB7XG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0XTogdGhpcy50ZXh0QnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZV06IHRoaXMuZmlsZUJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXTogdGhpcy5hdWRpb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvXTogdGhpcy52aWRlb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmltYWdlXTogdGhpcy5pbWFnZUJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXJdOiB0aGlzLnRleHRCdWJibGUsXG4gICAgICBjdXN0b21fZXh0ZW5zaW9uX3N0aWNrZXI6IHRoaXMuc3RpY2tlckJ1YmJsZSxcbiAgICAgIGN1c3RvbV9leHRlbnNpb25fd2hpdGVib2FyZDogdGhpcy53aGl0ZWJvYXJkQnViYmxlLFxuICAgICAgY3VzdG9tX2V4dGVuc2lvbl9kb2N1bWVudDogdGhpcy5kb2N1bWVudEJ1YmJsZSxcbiAgICAgIGN1c3RvbV9leHRlbnNpb25fcG9sbDogdGhpcy5wb2xsQnViYmxlLFxuICAgICAgY3VzdG9tX21lZXRpbmc6IHRoaXMuZGlyZWN0Q2FsbGluZyxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXTogdGhpcy5hdWRpb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvXTogdGhpcy52aWRlb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5zY2hlZHVsZXJdOiB0aGlzLnNjaGVkdWxlckJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5mb3JtXTogdGhpcy5mb3JtQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmNhcmRdOiB0aGlzLmNhcmRCdWJibGUsXG4gICAgfTtcbiAgICBpZih0aGlzLm1lc3NhZ2VUZW1wbGF0ZS5sZW5ndGggPD0gMCkge1xuICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpXG4gICAgfVxuICAgIHRoaXMuc2V0QnViYmxlVmlldygpO1xuICB9XG4gIGdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlLCB0eXBlPzogc3RyaW5nKSB7XG4gICAgbGV0IGRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0Q3VzdG9tRGF0YSgpO1xuICAgIGlmICh0eXBlKSB7XG4gICAgICByZXR1cm4gZGF0YVt0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgfVxuICB9XG4gIGdldFRocmVhZENvdW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHZhciByZXBseUNvdW50ID0gbWVzc2FnZT8uZ2V0UmVwbHlDb3VudCgpIHx8IDA7XG4gICAgdmFyIHN1ZmZpeCA9IHJlcGx5Q291bnQgPT09IDEgPyBsb2NhbGl6ZShcIlJFUExZXCIpIDogbG9jYWxpemUoXCJSRVBMSUVTXCIpO1xuICAgIHJldHVybiBgJHtyZXBseUNvdW50fSAke3N1ZmZpeH1gO1xuICB9XG4gIHNob3dFbmFibGVkRXh0ZW5zaW9ucygpIHtcbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInRleHRtb2RlcmF0b3JcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlRGF0YU1hc2tpbmcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInRodW1ibmFpbGdlbmVyYXRpb25cIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlVGh1bWJuYWlsR2VuZXJhdGlvbiA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwibGlua3ByZXZpZXdcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlTGlua1ByZXZpZXcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInBvbGxzXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVBvbGxzID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJyZWFjdGlvbnNcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlUmVhY3Rpb25zID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJpbWFnZW1vZGVyYXRpb25cIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlSW1hZ2VNb2RlcmF0aW9uID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJzdGlja2Vyc1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVTdGlja2VycyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiY29sbGFib3JhdGl2ZXdoaXRlYm9hcmRcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlV2hpdGVib2FyZCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiY29sbGFib3JhdGl2ZWRvY3VtZW50XCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZURvY3VtZW50ID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJjYWxsaW5nXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUNhbGxpbmcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImFpY29udmVyc2F0aW9uc3RhcnRlclwiKSkge1xuICAgICAgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdGFydGVyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJhaWNvbnZlcnNhdGlvbnN1bW1hcnlcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3VtbWFyeSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBvcGVuQ29uZmlybURpYWxvZzogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgb3BlbkZ1bGxzY3JlZW5WaWV3OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpbWFnZXVybFRvT3Blbjogc3RyaW5nID0gXCJcIjtcbiAgZnVsbFNjcmVlblZpZXdlclN0eWxlOiBGdWxsU2NyZWVuVmlld2VyU3R5bGUgPSB7XG4gICAgY2xvc2VJY29uVGludDogXCJibHVlXCIsXG4gIH07XG4gIG9wZW5JbWFnZUluRnVsbFNjcmVlbihtZXNzYWdlOiBhbnkpIHtcbiAgICB0aGlzLmltYWdldXJsVG9PcGVuID0gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybDtcbiAgICB0aGlzLm9wZW5GdWxsc2NyZWVuVmlldyA9IHRydWU7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGNsb3NlSW1hZ2VJbkZ1bGxTY3JlZW4oKSB7XG4gICAgdGhpcy5pbWFnZXVybFRvT3BlbiA9IFwiXCI7XG4gICAgdGhpcy5vcGVuRnVsbHNjcmVlblZpZXcgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgb3Blbldhcm5pbmdEaWFsb2coZXZlbnQ6IGFueSkge1xuICAgIHRoaXMuY2xvc2VJbWFnZU1vZGVyYXRpb24gPSBldmVudD8uZGV0YWlsPy5vbkNvbmZpcm07XG4gICAgdGhpcy5vcGVuQ29uZmlybURpYWxvZyA9IHRydWU7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIG9uQ29uZmlybUNsaWNrID0gKCkgPT4ge1xuICAgIHRoaXMub3BlbkNvbmZpcm1EaWFsb2cgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5jbG9zZUltYWdlTW9kZXJhdGlvbikge1xuICAgICAgdGhpcy5jbG9zZUltYWdlTW9kZXJhdGlvbigpO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIG9uQ2FuY2VsQ2xpY2soKSB7XG4gICAgdGhpcy5vcGVuQ29uZmlybURpYWxvZyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBnZXRUZXh0TWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIHZhciB0ZXh0ID0gdGhpcy5lbmFibGVEYXRhTWFza2luZ1xuICAgICAgPyBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0RXh0ZW5zaW9uRGF0YShtZXNzYWdlKVxuICAgICAgOiBudWxsO1xuICAgIHJldHVybiB0ZXh0Py50cmltKCk/Lmxlbmd0aCA+IDAgPyB0ZXh0IDogbWVzc2FnZS5nZXRUZXh0KCk7XG4gIH1cbiAgZ2V0TGlua1ByZXZpZXcobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgaWYgKG1lc3NhZ2U/LmdldE1ldGFkYXRhKCkgJiYgdGhpcy5lbmFibGVMaW5rUHJldmlldykge1xuICAgICAgICB2YXIgbWV0YWRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICAgICAgdmFyIGluamVjdGVkT2JqZWN0ID0gbWV0YWRhdGFbTGlua1ByZXZpZXdDb25zdGFudHMuaW5qZWN0ZWRdO1xuICAgICAgICBpZiAoaW5qZWN0ZWRPYmplY3QgJiYgaW5qZWN0ZWRPYmplY3Q/LmV4dGVuc2lvbnMpIHtcbiAgICAgICAgICB2YXIgZXh0ZW5zaW9uc09iamVjdCA9IGluamVjdGVkT2JqZWN0LmV4dGVuc2lvbnM7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgZXh0ZW5zaW9uc09iamVjdCAmJlxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3QsXG4gICAgICAgICAgICAgIExpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtfcHJldmlld1xuICAgICAgICAgICAgKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFyIGxpbmtQcmV2aWV3T2JqZWN0ID1cbiAgICAgICAgICAgICAgZXh0ZW5zaW9uc09iamVjdFtMaW5rUHJldmlld0NvbnN0YW50cy5saW5rX3ByZXZpZXddO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBsaW5rUHJldmlld09iamVjdCAmJlxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICAgICAgICBsaW5rUHJldmlld09iamVjdCxcbiAgICAgICAgICAgICAgICBMaW5rUHJldmlld0NvbnN0YW50cy5saW5rc1xuICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgIGxpbmtQcmV2aWV3T2JqZWN0W0xpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtzXS5sZW5ndGhcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gbGlua1ByZXZpZXdPYmplY3RbTGlua1ByZXZpZXdDb25zdGFudHMubGlua3NdWzBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldEltYWdlVGh1bWJuYWlsKG1zZzogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSk6IHN0cmluZyB7XG4gICAgdmFyIG1lc3NhZ2U6IGFueSA9IG1zZyBhcyBDb21ldENoYXQuTWVkaWFNZXNzYWdlO1xuICAgIGxldCBpbWFnZVVSTCA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZW5hYmxlVGh1bWJuYWlsR2VuZXJhdGlvbikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIG1ldGFkYXRhOiBhbnkgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgICAgIHZhciBpbmplY3RlZE9iamVjdCA9IG1ldGFkYXRhPy5bXG4gICAgICAgICAgVGh1bWJuYWlsR2VuZXJhdGlvbkNvbnN0YW50cy5pbmplY3RlZFxuICAgICAgICBdIGFzIHsgZXh0ZW5zaW9ucz86IGFueSB9O1xuICAgICAgICB2YXIgZXh0ZW5zaW9uc09iamVjdCA9IGluamVjdGVkT2JqZWN0Py5leHRlbnNpb25zO1xuICAgICAgICB2YXIgdGh1bWJuYWlsR2VuZXJhdGlvbk9iamVjdCA9XG4gICAgICAgICAgZXh0ZW5zaW9uc09iamVjdFtUaHVtYm5haWxHZW5lcmF0aW9uQ29uc3RhbnRzLnRodW1ibmFpbF9nZW5lcmF0aW9uXTtcbiAgICAgICAgdmFyIGltYWdlVG9Eb3dubG9hZCA9IHRodW1ibmFpbEdlbmVyYXRpb25PYmplY3Q/LnVybF9tZWRpdW07XG4gICAgICAgIGlmIChpbWFnZVRvRG93bmxvYWQpIHtcbiAgICAgICAgICBpbWFnZVVSTCA9IGltYWdlVG9Eb3dubG9hZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbWFnZVVSTCA9IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzXG4gICAgICAgICAgICA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmxcbiAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGltYWdlVVJMID0gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNcbiAgICAgICAgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsXG4gICAgICAgIDogXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGltYWdlVVJMO1xuICB9XG4gIGdldExpbmtQcmV2aWV3RGV0YWlscyhrZXk6IHN0cmluZywgbWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogc3RyaW5nIHtcbiAgICBsZXQgbGlua1ByZXZpZXdPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TGlua1ByZXZpZXcobWVzc2FnZSk7XG4gICAgaWYgKE9iamVjdC5rZXlzKGxpbmtQcmV2aWV3T2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gbGlua1ByZXZpZXdPYmplY3Rba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIHRoaXMuc2V0TWVzc2FnZXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmFkZE1lc3NhZ2VFdmVudExpc3RlbmVycygpO1xuICAgIHRoaXMuc2V0T25nb2luZ0NhbGxTdHlsZSgpO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHRoaXMuZGF0ZVNlcGFyYXRvclN0eWxlLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUuYmFja2dyb3VuZCB8fFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKTtcbiAgICB0aGlzLmRpdmlkZXJTdHlsZS5iYWNrZ3JvdW5kID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCk7XG4gICAgXG4gICAgdGhpcy5sYWJlbFN0eWxlLnRleHRDb2xvciA9IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5uYW1lVGV4dENvbG9yIHx8IHRoaXMubGFiZWxTdHlsZS50ZXh0Q29sb3I7XG4gICAgdGhpcy5sYWJlbFN0eWxlLnRleHRGb250ID0gdGhpcy5tZXNzYWdlTGlzdFN0eWxlLm5hbWVUZXh0Rm9udCB8fCB0aGlzLmxhYmVsU3R5bGUudGV4dEZvbnQ7XG4gICAgdGhpcy5sb2FkaW5nU3R5bGUuaWNvblRpbnQgPSB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUubG9hZGluZ0ljb25UaW50IHx8IHRoaXMubG9hZGluZ1N0eWxlLmljb25UaW50O1xuICB9XG4gIHNldE9uZ29pbmdDYWxsU3R5bGUgPSAoKSA9PiB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZSA9IG5ldyBDYWxsc2NyZWVuU3R5bGUoe1xuICAgICAgbWF4SGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCIjMWMyMjI2XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiNDAwcHhcIixcbiAgICAgIG1pbldpZHRoOiBcIjQwMHB4XCIsXG4gICAgICBtaW5pbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgbWF4aW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH07XG4gIH07XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IERhdGVTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBwYWRkaW5nOiBcIjZweCAxMnB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUgfTtcbiAgfVxuICBzZXRNZXNzYWdlc1N0eWxlKCkge1xuICAgIHRoaXMucG9wb3ZlclN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjMzMHB4XCIsXG4gICAgICB3aWR0aDogXCIzMjVweFwiLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBib3hTaGFkb3c6IGAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCl9IDBweCAwcHggOHB4YFxuICAgIH1cbiAgICBsZXQgZGVmYXVsdEVtb2ppU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMzMwcHhcIixcbiAgICAgIHdpZHRoOiBcIjMyNXB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAuLi50aGlzLmVtb2ppS2V5Ym9hcmRTdHlsZVxuICAgIH1cbiAgICB0aGlzLmVtb2ppS2V5Ym9hcmRTdHlsZSA9IGRlZmF1bHRFbW9qaVN0eWxlO1xuICAgIHRoaXMudW5yZWFkTWVzc2FnZXNTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgIH07XG4gICAgdGhpcy5zbWFydFJlcGx5U3R5bGUgPSB7XG4gICAgICByZXBseVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVwbHlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICByZXBseUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm94U2hhZG93OiBgMHB4IDBweCAxcHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpfWAsXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICAuLi50aGlzLnNtYXJ0UmVwbHlTdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0eWxlID0ge1xuICAgICAgcmVwbHlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlcGx5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcmVwbHlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJveFNoYWRvdzogYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3R5bGUsXG4gICAgfTtcblxuICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0eWxlID0ge1xuICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3R5bGUsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm94U2hhZG93OiBgMHB4IDBweCAxcHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpfWAsXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCkhLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpISxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBib3JkZXI6IFwiMXB4IHNvbGlkICM2ODUxRDZcIixcbiAgICB9O1xuXG4gICAgdGhpcy5mdWxsU2NyZWVuVmlld2VyU3R5bGUuY2xvc2VJY29uVGludCA9XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBNZXNzYWdlTGlzdFN0eWxlID0gbmV3IE1lc3NhZ2VMaXN0U3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGhyZWFkUmVwbHlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRocmVhZFJlcGx5SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICB0aHJlYWRSZXBseVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRocmVhZFJlcGx5VW5yZWFkQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB0aHJlYWRSZXBseVVucmVhZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHRocmVhZFJlcGx5VW5yZWFkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICBUaW1lc3RhbXBUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uM1xuICAgICAgKSxcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5tZXNzYWdlTGlzdFN0eWxlIH07XG4gICAgdGhpcy5saW5rUHJldmlld1N0eWxlID0gbmV3IExpbmtQcmV2aWV3U3R5bGUoe1xuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBkZXNjcmlwdGlvbkNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVzY3JpcHRpb25Gb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgfSk7XG4gICAgdGhpcy5kb2N1bWVudEJ1YmJsZVN0eWxlID0ge1xuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBidXR0b25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICB9O1xuICAgIHRoaXMucG9sbEJ1YmJsZVN0eWxlID0ge1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdm90ZVBlcmNlbnRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB2b3RlUGVyY2VudFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBvbGxRdWVzdGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHBvbGxRdWVzdGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHBvbGxPcHRpb25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHBvbGxPcHRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBwb2xsT3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG9wdGlvbnNJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRvdGFsVm90ZUNvdW50VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdG90YWxWb3RlQ291bnRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWxlY3RlZFBvbGxPcHRpb25CYWNrZ3JvdW5kOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgdXNlclNlbGVjdGVkT3B0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBwb2xsT3B0aW9uQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgcG9sbE9wdGlvbkJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9O1xuICAgIHRoaXMuaW1hZ2VNb2RlcmF0aW9uU3R5bGUgPSB7XG4gICAgICBmaWx0ZXJDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHdhcm5pbmdUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIHdhcm5pbmdUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLmNvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJkYXJrXCIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBtZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH07XG4gIH1cbiAgZ2V0UmVjZWlwdFN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IGlzVGV4dE1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCAmJlxuICAgICAgdGhpcy5hbGlnbm1lbnQgIT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB0aGlzLnJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IGlzVGV4dE1lc3NhZ2VcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjExcHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pO1xuICAgIHJldHVybiB7IC4uLnRoaXMucmVjZWlwdFN0eWxlIH07XG4gIH1cbiAgY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKCF0aGlzLnRlbXBsYXRlcyB8fCB0aGlzLnRlbXBsYXRlcz8ubGVuZ3RoID09IDApIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlID1cbiAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZVRlbXBsYXRlcygpO1xuICAgICAgdGhpcy5jYXRlZ29yaWVzID1cbiAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZUNhdGVnb3JpZXMoKTtcbiAgICAgIHRoaXMudHlwZXMgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxNZXNzYWdlVHlwZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlcztcbiAgICB9XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBudWxsO1xuICAgIGlmICh0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCkge1xuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKVxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgICAuc2V0Q2F0ZWdvcmllcyh0aGlzLmNhdGVnb3JpZXMpXG4gICAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSk7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlci5nZXRVaWQoKSkuYnVpbGQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA/IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZSh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpXG4gICAgICAgICAgOiBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgICAuc2V0VHlwZXModGhpcy50eXBlcylcbiAgICAgICAgICAgIC5oaWRlUmVwbGllcyh0cnVlKVxuICAgICAgICAgICAgLnNldENhdGVnb3JpZXModGhpcy5jYXRlZ29yaWVzKVxuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY29tcHV0ZVVucmVhZENvdW50KCk7XG4gICAgICB0aGlzLmZldGNoUHJldmlvdXNNZXNzYWdlcygpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXB1dGVVbnJlYWRDb3VudCgpIHtcbiAgICBpZiAodGhpcy51c2VyIHx8IHRoaXMuZ3JvdXApIHtcbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgQ29tZXRDaGF0LmdldFVucmVhZE1lc3NhZ2VDb3VudEZvclVzZXIodGhpcy51c2VyPy5nZXRVaWQoKSkudGhlbihcbiAgICAgICAgICAocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkeW5hbWljS2V5ID0gdGhpcy51c2VyPy5nZXRVaWQoKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA9IHJlc1tkeW5hbWljS2V5IGFzIGtleW9mIHR5cGVvZiByZXNdO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yKSA9PiB7IH1cbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRVbnJlYWRNZXNzYWdlQ291bnRGb3JHcm91cCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLnRoZW4oXG4gICAgICAgICAgKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZHluYW1pY0tleSA9IHRoaXMuZ3JvdXA/LmdldEd1aWQoKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA9IHJlc1tkeW5hbWljS2V5IGFzIGtleW9mIHR5cGVvZiByZXNdO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yKSA9PiB7IH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0QWN0aW9uTWVzc2FnZShtZXNzYWdlOkNvbWV0Q2hhdC5CYXNlTWVzc2FnZSl7XG4gICAgY29uc3QgbXNnID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldEFjdGlvbk1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uKTtcbiAgICByZXR1cm4gbXNnID8/IChtZXNzYWdlIGFzIENvbWV0Q2hhdC5BY3Rpb24pLmdldE1lc3NhZ2UoKTtcbiAgfVxuICAvKipcbiAgICogTGlzdGVuZXIgVG8gUmVjZWl2ZSBNZXNzYWdlcyBpbiBSZWFsIFRpbWVcbiAgICogQHBhcmFtXG4gICAqL1xuICBmZXRjaFByZXZpb3VzTWVzc2FnZXMgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMucmVpbml0aWFsaXplZCkge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgICAuc2V0VHlwZXModGhpcy50eXBlcylcbiAgICAgICAgICAuc2V0TWVzc2FnZUlkKHRoaXMubWVzc2FnZXNMaXN0WzBdLmdldElkKCkpXG4gICAgICAgICAgLnNldENhdGVnb3JpZXModGhpcy5jYXRlZ29yaWVzKVxuICAgICAgICAgIC5oaWRlUmVwbGllcyh0cnVlKVxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS5idWlsZCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXJcbiAgICAgIC5mZXRjaFByZXZpb3VzKClcbiAgICAgIC50aGVuKFxuICAgICAgICAobWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdKSA9PiB7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2VMaXN0ID0gbWVzc2FnZUxpc3QubWFwKFxuICAgICAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMuY29udmVydEludGVyYWN0aXZlTWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuSW50ZXJhY3RpdmVNZXNzYWdlXG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgICAvLyBObyBNZXNzYWdlcyBGb3VuZFxuICAgICAgICAgIGlmIChtZXNzYWdlTGlzdC5sZW5ndGggPT09IDAgJiYgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgaWYgKCF0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJiB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXIpIHtcbiAgICAgICAgICAgICAgdGhpcy5mZXRjaENvbnZlcnNhdGlvblN0YXJ0ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA+PSB0aGlzLnVucmVhZE1lc3NhZ2VUaHJlc2hvbGQgJiZcbiAgICAgICAgICAgICAgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5mZXRjaENvbnZlcnNhdGlvblN1bW1hcnkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5sYXN0TWVzc2FnZUlkID0gTnVtYmVyKFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdLmdldElkKClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgbGV0IGlzU2VudEJ5TWU6IGJvb2xlYW4gPSBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpID09XG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAhaXNTZW50QnlNZSAmJlxuICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIC8vbWFyayB0aGUgbWVzc2FnZSBhcyBkZWxpdmVyZWRcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc0RlbGl2ZXJlZChsYXN0TWVzc2FnZSkudGhlbihcbiAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYobGFzdE1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKXtcbiAgICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT0gbGFzdE1lc3NhZ2U/LmdldElkKClcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzRGVsaXZlcmVkKG1lc3NhZ2VLZXkpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbGFzdE1lc3NhZ2U/LmdldFJlYWRBdCgpICYmICFpc1NlbnRCeU1lKSB7XG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZihsYXN0TWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpe1xuICAgICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PSBsYXN0TWVzc2FnZT8uZ2V0SWQoKVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXkpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgLy9pZiB0aGUgc2VuZGVyIG9mIHRoZSBtZXNzYWdlIGlzIG5vdCB0aGUgbG9nZ2VkaW4gdXNlciwgbWFyayBpdCBhcyByZWFkLlxuICAgICAgICAgICAgbGV0IHByZXZTY3JvbGxIZWlnaHQgPSB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubGlzdFNjcm9sbC5uYXRpdmVFbGVtZW50LnNjcm9sbFRvcCA9XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCAtIHByZXZTY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnByZXBlbmRNZXNzYWdlcyhtZXNzYWdlTGlzdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcbiAgZmV0Y2hBY3Rpb25NZXNzYWdlcygpIHtcbiAgICBsZXQgcmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgIC5zZXRUeXBlKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKVxuICAgICAgLnNldENhdGVnb3J5KENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24pXG4gICAgICAuc2V0TWVzc2FnZUlkKHRoaXMubGFzdE1lc3NhZ2VJZClcbiAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIHJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHJlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKTtcbiAgICB9XG4gICAgcmVxdWVzdEJ1aWxkZXIuYnVpbGQoKVxuICAgICAgLmZldGNoTmV4dCgpXG4gICAgICAudGhlbigobWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzICYmIG1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBtZXNzYWdlcy5mb3JFYWNoKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkFjdGlvbikuZ2V0QWN0aW9uT24oKSBpbnN0YW5jZW9mXG4gICAgICAgICAgICAgIENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgIChtKSA9PlxuICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PVxuICAgICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICkuZ2V0QWN0aW9uT24oKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICkuZ2V0SWQoKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZUtleSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0gPSAoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5BY3Rpb25cbiAgICAgICAgICAgICAgICApLmdldEFjdGlvbk9uKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuICBmZXRjaE5leHRNZXNzYWdlID0gKCkgPT4ge1xuICAgIGxldCBpbmRleCA9IHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCAtIDE7XG4gICAgbGV0IG1lc3NhZ2VJZDogbnVtYmVyO1xuICAgIGlmIChcbiAgICAgIHRoaXMucmVpbml0aWFsaXplZCB8fFxuICAgICAgKHRoaXMubGFzdE1lc3NhZ2VJZCA+IDAgJiYgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkKVxuICAgICkge1xuICAgICAgaWYgKHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCkge1xuICAgICAgICB0aGlzLmZldGNoQWN0aW9uTWVzc2FnZXMoKTtcbiAgICAgICAgbWVzc2FnZUlkID0gdGhpcy5sYXN0TWVzc2FnZUlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZUlkID0gdGhpcy5tZXNzYWdlc0xpc3RbaW5kZXhdLmdldElkKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJcbiAgICAgICAgICA/IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgICAgLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKVxuICAgICAgICAgICAgLnNldE1lc3NhZ2VJZChtZXNzYWdlSWQpXG4gICAgICAgICAgICAuYnVpbGQoKVxuICAgICAgICAgIDogdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgICAuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpXG4gICAgICAgICAgICAuc2V0TWVzc2FnZUlkKG1lc3NhZ2VJZClcbiAgICAgICAgICAgIC5idWlsZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgLnNldE1lc3NhZ2VJZChtZXNzYWdlSWQpXG4gICAgICAgICAgLnNldENhdGVnb3JpZXModGhpcy5jYXRlZ29yaWVzKVxuICAgICAgICAgIC5oaWRlUmVwbGllcyh0cnVlKVxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSkuYnVpbGQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlclxuICAgICAgICAuZmV0Y2hOZXh0KClcbiAgICAgICAgLnRoZW4oXG4gICAgICAgICAgKG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgbWVzc2FnZUxpc3QgPSBtZXNzYWdlTGlzdC5tYXAoXG4gICAgICAgICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09XG4gICAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZVxuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgICAgICAgICAgLy8gTm8gTWVzc2FnZXMgRm91bmRcbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdC5sZW5ndGggPT09IDAgJiYgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0TWVzc2FnZUlkID0gTnVtYmVyKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV0uZ2V0SWQoKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICFsYXN0TWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICFsYXN0TWVzc2FnZT8uZ2V0RGVsaXZlcmVkQXQoKSAmJlxuICAgICAgICAgICAgICAgICAgbGFzdE1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9XG4gICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChsYXN0TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlTGlzdC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRNZXNzYWdlcyhtZXNzYWdlTGlzdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdLmdldElkKClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zY3JvbGxUb0JvdHRvbU9uTmV3TWVzc2FnZXMpIHtcbiAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY291bnRUZXh0ID0gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIik7XG4gICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAhPSBcIlwiXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50VGV4dCA9XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGxvY2FsaXplKFwiTkVXX01FU1NBR0VcIik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50LnB1c2goLi4ubWVzc2FnZUxpc3QpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgICAgICAgICBcIiDihpMgXCIgKyB0aGlzLlVucmVhZENvdW50Lmxlbmd0aCArIFwiIFwiICsgY291bnRUZXh0O1xuICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldERlbGl2ZXJlZEF0KCkgJiZcbiAgICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG4gIGFwcGVuZE1lc3NhZ2VzID0gKG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkgPT4ge1xuICAgIGlmKCF0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlc1swXSkpe1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzTGlzdC5wdXNoKC4uLm1lc3NhZ2VzKTtcbiAgICB0aGlzLm1lc3NhZ2VDb3VudCA9IHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aDtcbiAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VCdWlsZGVyKCk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRNZXNzYWdlKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gY29ubmVjdGVkXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICBhZGRNZXNzYWdlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdyb3VwTGlzdGVuZXJJZCxcbiAgICAgICAgbmV3IENvbWV0Q2hhdC5Hcm91cExpc3RlbmVyKHtcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgY2hhbmdlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRSxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwLFxuICAgICAgICAgICAgICB7IHVzZXI6IGNoYW5nZWRVc2VyLCBzY29wZTogbmV3U2NvcGUgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICBraWNrZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGtpY2tlZEZyb206IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBraWNrZWRGcm9tLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjoga2lja2VkVXNlcixcbiAgICAgICAgICAgICAgICBoYXNKb2luZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckJhbm5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgYmFubmVkRnJvbTogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGJhbm5lZEZyb20sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBiYW5uZWRVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlclVuYmFubmVkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5iYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVuYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdW5iYW5uZWRGcm9tOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICB1bmJhbm5lZEZyb20sXG4gICAgICAgICAgICAgIHsgdXNlcjogdW5iYW5uZWRVc2VyIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRJbjogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW4sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiB1c2VyQWRkZWQsXG4gICAgICAgICAgICAgICAgaGFzSm9pbmVkOiB0cnVlLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICAgICAgICAgIGxlYXZpbmdVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGdyb3VwLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogbGVhdmluZ1VzZXIsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgICAgICAgICBqb2luZWRVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgICBqb2luZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgam9pbmVkR3JvdXAsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBqb2luZWRVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMuZW5hYmxlQ2FsbGluZykge1xuICAgICAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuY2FsbExpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5DYWxsTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNhbGxFbmRlZE1lc3NhZ2VSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWFjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvbkFkZGVkID1cbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZVJlYWN0aW9uQWRkZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9BRERFRCxcbiAgICAgICAgICAgICAgICByZWFjdGlvblJlY2VpcHRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZCA9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVELFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uUmVjZWlwdFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UZXh0TWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25Gb3JtTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogRm9ybU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DYXJkTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ2FyZE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNEZWxpdmVyZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICBpZiAobWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWQuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFELFxuICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkQnlBbGwgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNSZWFkQnlBbGwuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2VSZWNlaXB0LCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFELFxuICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWRUb0FsbCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsLnN1YnNjcmliZShcbiAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICBpZiAobWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhZEFuZERlbGl2ZXJlZChtZXNzYWdlUmVjZWlwdCwgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMSVZFUkVELFxuICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChkZWxldGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgZGVsZXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChlZGl0ZWRNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIGVkaXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICh0cmFuc2llbnRNZXNzYWdlOiBDb21ldENoYXQuVHJhbnNpZW50TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGxpdmVSZWFjdGlvbjogYW55ID0gdHJhbnNpZW50TWVzc2FnZS5nZXREYXRhKCk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgICAgICAgIHRoaXMudXNlciAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLnVzZXIuZ2V0VWlkKCkgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInR5cGVcIl0gPT0gXCJsaXZlX3JlYWN0aW9uXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTGl2ZVJlYWN0aW9uLm5leHQoXG4gICAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1wicmVhY3Rpb25cIl1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgICAgICAgIHRoaXMuZ3JvdXAgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT0gdGhpcy5ncm91cC5nZXRHdWlkKCkgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInR5cGVcIl0gPT0gXCJsaXZlX3JlYWN0aW9uXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTGl2ZVJlYWN0aW9uLm5leHQoXG4gICAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1wicmVhY3Rpb25cIl1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25JbnRlcmFjdGlvbkdvYWxDb21wbGV0ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uSW50ZXJhY3Rpb25Hb2FsQ29tcGxldGVkLnN1YnNjcmliZShcbiAgICAgICAgICAocmVjZWlwdDogQ29tZXRDaGF0LkludGVyYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElPTl9HT0FMX0NPTVBMRVRFRCxcbiAgICAgICAgICAgICAgcmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBVcGRhdGVzIG1lc3NhZ2VMaXN0IG9uIGJhc2lzIG9mIHVzZXIgYWN0aXZpdHkgb3IgZ3JvdXAgYWN0aXZpdHkgb3IgY2FsbGluZyBhY3Rpdml0eVxuICAgKiBAcGFyYW0gIHthbnk9bnVsbH0ga2V5XG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXAgfCBudWxsPW51bGx9IGdyb3VwXG4gICAqIEBwYXJhbSAge2FueT1udWxsfSBvcHRpb25zXG4gICAqL1xuICBtZXNzYWdlVXBkYXRlKFxuICAgIGtleTogc3RyaW5nIHwgbnVsbCA9IG51bGwsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0IHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgYW55ID0gbnVsbCxcbiAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgb3B0aW9uczogYW55ID0gbnVsbFxuICApIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW107XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5pc1RocmVhZE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMSVZFUkVEOlxuICAgICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFEOlxuICAgICAgICAgIHRoaXMubWVzc2FnZVJlYWRBbmREZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgXG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVEOiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlRWRpdGVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uU0NPUEVfQ0hBTkdFOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkFEREVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uVU5CQU5ORUQ6IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWQobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJT05fR09BTF9DT01QTEVURUQ6XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUludGVyYWN0aXZlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUNUSU9OX0FEREVEOlxuICAgICAgICAgIHRoaXMub25SZWFjdGlvblVwZGF0ZWQobWVzc2FnZSwgdHJ1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVEOlxuICAgICAgICAgIHRoaXMub25SZWFjdGlvblVwZGF0ZWQobWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYSBtZXNzYWdlJ3MgcmVhY3Rpb25zIGJhc2VkIG9uIGEgbmV3IHJlYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5SZWFjdGlvbkV2ZW50fSBtZXNzYWdlIC0gVGhlIG5ldyBtZXNzYWdlIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQWRkZWQgLSBUcnVlIGlmIHRoZSByZWFjdGlvbiB3YXMgYWRkZWQsIGZhbHNlIGlmIGl0IHdhcyByZW1vdmVkLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBmYWxzZSBpZiB0aGUgbWVzc2FnZSB3YXMgbm90IGZvdW5kLCB0cnVlIG90aGVyd2lzZS5cbiAgICovXG5cbiAgb25SZWFjdGlvblVwZGF0ZWQobWVzc2FnZTogQ29tZXRDaGF0LlJlYWN0aW9uRXZlbnQsIGlzQWRkZWQ6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBtZXNzYWdlSWQgPSBtZXNzYWdlLmdldFJlYWN0aW9uKCk/LmdldE1lc3NhZ2VJZCgpO1xuICAgIGNvbnN0IG1lc3NhZ2VPYmplY3QgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKG1lc3NhZ2VJZCk7XG5cbiAgICBpZiAoIW1lc3NhZ2VPYmplY3QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgYWN0aW9uOiBDb21ldENoYXQuUkVBQ1RJT05fQUNUSU9OO1xuICAgIGlmIChpc0FkZGVkKSB7XG4gICAgICBhY3Rpb24gPSBDb21ldENoYXQuUkVBQ1RJT05fQUNUSU9OLlJFQUNUSU9OX0FEREVEO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3Rpb24gPSBDb21ldENoYXQuUkVBQ1RJT05fQUNUSU9OLlJFQUNUSU9OX1JFTU9WRUQ7XG4gICAgfVxuICAgIGxldCBtb2RpZmllZE1lc3NhZ2UgPVxuICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci51cGRhdGVNZXNzYWdlV2l0aFJlYWN0aW9uSW5mbyhcbiAgICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgICAgbWVzc2FnZS5nZXRSZWFjdGlvbigpLFxuICAgICAgICBhY3Rpb25cbiAgICAgICk7XG4gICAgaWYgKG1vZGlmaWVkTWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1vZGlmaWVkTWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiB0cmFuc2xhdGUgbWVzc2FnZSB0aGVuIGNhbGwgdXBkYXRlIG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICAvLyB0cmFuc2xhdGVNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAvLyB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1hcmtNZXNzYWdlQXNEZWxpdmVyZWQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuZGlzYWJsZVJlY2VpcHQgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJkZWxpdmVyZWRBdFwiKSA9PT0gZmFsc2VcbiAgICApIHtcbiAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogV2hlbiBNZXNzYWdlIGlzIFJlY2VpdmVkXG4gICAqIEBwYXJhbSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtZXNzYWdlUmVjZWl2ZWQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7ICAgICAgICAgICBcbiAgICAgICBcbiAgICB0cnkge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5ncm91cD8uZ2V0R3VpZCgpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgICFtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKSB8fFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICAgICAgICB0aGlzLmlzT25Cb3R0b20pXG4gICAgICAgICkge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0aW5nIHRoZSByZXBseSBjb3VudCBvZiBUaHJlYWQgUGFyZW50IE1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgdXBkYXRlUmVwbHlDb3VudChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZWNlaXZlZE1lc3NhZ2UgPSBtZXNzYWdlcztcbiAgICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IHJlY2VpdmVkTWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VLZXldO1xuICAgICAgICBsZXQgcmVwbHlDb3VudCA9IG1lc3NhZ2VPYmouZ2V0UmVwbHlDb3VudCgpXG4gICAgICAgICAgPyBtZXNzYWdlT2JqLmdldFJlcGx5Q291bnQoKVxuICAgICAgICAgIDogMDtcbiAgICAgICAgcmVwbHlDb3VudCA9IHJlcGx5Q291bnQgKyAxO1xuICAgICAgICBtZXNzYWdlT2JqLnNldFJlcGx5Q291bnQocmVwbHlDb3VudCk7XG4gICAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlT2JqKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZUxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7c3RyaW5nfSB0eXBlXG4gICAqL1xuICBtZXNzYWdlUmVjZWl2ZWRIYW5kbGVyID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICsrdGhpcy5tZXNzYWdlQ291bnQ7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIC8vIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMudXBkYXRlVW5yZWFkUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGlmICghdGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgIFwiIOKGkyBcIiArIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKXtcbiAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgfVxuICAgIC8vaGFuZGxpbmcgZG9tIGxhZyAtIGluY3JlbWVudCBjb3VudCBvbmx5IGZvciBtYWluIG1lc3NhZ2UgbGlzdFxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IGZhbHNlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gdHJ1ZSAmJlxuICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWRcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiZcbiAgICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgfTtcbiAgcGxheUF1ZGlvKCkge1xuICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlLFxuICAgICAgICAgIHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldENhbGxCdWlsZGVyID0gKCk6IGFueSA9PiB7XG4gICAgY29uc3QgY2FsbFNldHRpbmdzOiBhbnkgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcbiAgICAgIC5lbmFibGVEZWZhdWx0TGF5b3V0KHRydWUpXG4gICAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGZhbHNlKVxuICAgICAgLnNldENhbGxMaXN0ZW5lcihcbiAgICAgICAgbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuT25nb2luZ0NhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG4gICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoe30gYXMgQ29tZXRDaGF0LkNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5idWlsZCgpO1xuICAgIHJldHVybiBjYWxsU2V0dGluZ3M7XG4gIH07XG4gIHJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCkge1xuICAgIHRoaXMucmVpbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5ncm91cExpc3RlbmVySWQgPSBcImdyb3VwX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5jYWxsTGlzdGVuZXJJZCA9IFwiY2FsbF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHRoaXMuYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgaWYgKHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgxLCB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAzMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlclxuICAgICAgICA/IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyLmdldFVpZCgpKS5idWlsZCgpXG4gICAgICAgIDogdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cC5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcykge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMSwgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoIC0gMzApO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgcmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgdGhpcy5tZXNzYWdlQ291bnQgPSAwO1xuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbnVsbDtcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMaXN0ZW5lcklkKTtcbiAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCk7XG4gIH07XG4gIGdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCByZWNlaXB0ID0gTWVzc2FnZVJlY2VpcHRVdGlscy5nZXRSZWNlaXB0U3RhdHVzKG1lc3NhZ2UpO1xuICAgIHJldHVybiByZWNlaXB0O1xuICB9XG4gIG1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCwgaXNHcm91cFJlY2VpcHQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHRyeSB7XG4gICAgICBpZihpc0dyb3VwUmVjZWlwdCl7XG4gICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICBtLmdldElkKCkgPT0gTnVtYmVyKG1lc3NhZ2UuZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XS5zZXREZWxpdmVyZWRBdChcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSk7XG5cbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IG1lc3NhZ2UuUkVDRUlQVF9UWVBFLkRFTElWRVJFRF9UT19BTExfUkVDRUlQVCAgJiYgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleSk7XG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBtZXNzYWdlLlJFQ0VJUFRfVFlQRS5SRUFEX0JZX0FMTF9SRUNFSVBUICAmJiB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5ERUxJVkVSWVxuICAgICAgICApIHtcbiAgICAgICAgICAvL3NlYXJjaCBmb3IgbWVzc2FnZVxuICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgbS5nZXRJZCgpID09IE51bWJlcihtZXNzYWdlLmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlJFQURcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy9zZWFyY2ggZm9yIG1lc3NhZ2VcbiAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PSBOdW1iZXIobWVzc2FnZS5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IHJlYWRNZXNzYWdlXG4gICAqL1xuICBtYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXk6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBtZXNzYWdlS2V5OyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKCF0aGlzLm1lc3NhZ2VzTGlzdFtpXS5nZXRSZWFkQXQoKSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFtpXS5zZXRSZWFkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldKTtcbiAgfVxuICBtYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleTogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IG1lc3NhZ2VLZXk7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoIXRoaXMubWVzc2FnZXNMaXN0W2ldLmdldERlbGl2ZXJlZEF0KCkpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbaV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IGEgbWVzc2FnZSB3YXMgZGVsZXRlZCBieSB0aGUgdXNlci9wZXJzb24geW91IGFyZSBjaGF0dGluZyB3aXRoXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogRGV0ZWN0cyBpZiB0aGUgbWVzc2FnZSB0aGF0IHdhcyBlZGl0IGlzIHlvdXIgY3VycmVudCBvcGVuIGNvbnZlcnNhdGlvbiB3aW5kb3dcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1lc3NhZ2VFZGl0ZWQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmdyb3VwPy5nZXRHdWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHVwZGF0ZUludGVyYWN0aXZlTWVzc2FnZSA9IChyZWNlaXB0OiBDb21ldENoYXQuSW50ZXJhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gcmVjZWlwdC5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoXG4gICAgICAgIHJlY2VpcHQuZ2V0TWVzc2FnZUlkKClcbiAgICAgICkgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZTtcbiAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChTdHJpbmcobWVzc2FnZT8uZ2V0SWQoKSkgPT0gU3RyaW5nKHJlY2VpcHQuZ2V0TWVzc2FnZUlkKCkpKSB7XG4gICAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSByZWNlaXB0LmdldEludGVyYWN0aW9ucygpO1xuICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2UpLnNldEludGVyYWN0aW9ucyhcbiAgICAgICAgICAgIGludGVyYWN0aW9uXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UoXG4gICAgICAgICAgICBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBhIG1lc3NhZ2Ugd2FzIGRlbGV0ZWQgYnkgdGhlIHVzZXIvcGVyc29uIHlvdSBhcmUgY2hhdHRpbmcgd2l0aFxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgdXBkYXRlRWRpdGVkTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB2YXIgbWVzc2FnZUxpc3QgPSB0aGlzLm1lc3NhZ2VzTGlzdDtcbiAgICAvLyBsZXQgbmV3TWVzc2FnZSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShtZXNzYWdlKTtcbiAgICB2YXIgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgICk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0gPSBtZXNzYWdlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICAvLyBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgLy8gICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtcbiAgICAvLyAgICAgLi4ubWVzc2FnZUxpc3Quc2xpY2UoMCwgbWVzc2FnZUtleSksXG4gICAgLy8gICAgIG1lc3NhZ2UsXG4gICAgLy8gICAgIC4uLm1lc3NhZ2VMaXN0LnNsaWNlKG1lc3NhZ2VLZXkgKyAxKSxcbiAgICAvLyAgIF07XG4gICAgLy8gICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgLy8gfVxuICB9O1xuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBHcm91cCBEYXRhIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogV2hlbiBjdXN0b20gbWVzc2FnZXMgYXJlIHJlY2VpdmVkIGVnLiBQb2xsLCBTdGlja2VycyBlbWl0cyBhY3Rpb24gdG8gdXBkYXRlIG1lc3NhZ2UgbGlzdFxuICAgKiBAcGFyYW0gbWVzc2FnZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgY3VzdG9tTWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKSB8fFxuICAgICAgICAobWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAhbWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMuaXNPbkJvdHRvbSkgfHxcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKVxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKG1lc3NhZ2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VzdG9tTWVzc2FnZVJlY2VpdmVkSGFuZGxlcihtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAgICovXG4gIGN1c3RvbU1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAvLyBhZGQgcmVjZWl2ZWQgbWVzc2FnZSB0byBtZXNzYWdlcyBsaXN0XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIC8vIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMudXBkYXRlVW5yZWFkUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGlmICghdGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgIFwiIOKGkyBcIiArIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKXtcbiAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgfVxuICAgIC8vaGFuZGxpbmcgZG9tIGxhZyAtIGluY3JlbWVudCBjb3VudCBvbmx5IGZvciBtYWluIG1lc3NhZ2UgbGlzdFxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IGZhbHNlICYmXG4gICAgICAhdGhpcy5wYXJlbnRNZXNzYWdlSWRcbiAgICApIHtcbiAgICAgICsrdGhpcy5tZXNzYWdlQ291bnQ7XG4gICAgICAvL2lmIHRoZSB1c2VyIGhhcyBub3Qgc2Nyb2xsZWQgaW4gY2hhdCB3aW5kb3coc2Nyb2xsIGlzIGF0IHRoZSBib3R0b20gb2YgdGhlIGNoYXQgd2luZG93KVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtZXNzYWdlLmhhc093blByb3BlcnR5KFwicGFyZW50TWVzc2FnZUlkXCIpID09PSB0cnVlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgKSB7XG4gICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIGRhdGVzIGFuZCBzZXRzIERhdGUgb24gYSBhIG5ldyBkYXlcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IGZpcnN0RGF0ZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHNlY29uZERhdGVcbiAgICovXG4gIGlzRGF0ZURpZmZlcmVudChcbiAgICBmaXJzdERhdGU6IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgICBzZWNvbmREYXRlOiBudW1iZXIgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgbGV0IGZpcnN0RGF0ZU9iajogRGF0ZSwgc2Vjb25kRGF0ZU9iajogRGF0ZTtcbiAgICBmaXJzdERhdGVPYmogPSBuZXcgRGF0ZShmaXJzdERhdGUhICogMTAwMCk7XG4gICAgc2Vjb25kRGF0ZU9iaiA9IG5ldyBEYXRlKHNlY29uZERhdGUhICogMTAwMCk7XG4gICAgcmV0dXJuIChcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXREYXRlKCkgIT09IHNlY29uZERhdGVPYmouZ2V0RGF0ZSgpIHx8XG4gICAgICBmaXJzdERhdGVPYmouZ2V0TW9udGgoKSAhPT0gc2Vjb25kRGF0ZU9iai5nZXRNb250aCgpIHx8XG4gICAgICBmaXJzdERhdGVPYmouZ2V0RnVsbFllYXIoKSAhPT0gc2Vjb25kRGF0ZU9iai5nZXRGdWxsWWVhcigpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGZvcm1hdHRlcnMgZm9yIHRoZSB0ZXh0IGJ1YmJsZXNcbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHJldHVybnNcbiAgICovXG4gIGdldFRleHRGb3JtYXR0ZXJzID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBhbGlnbm1lbnQgPSB0aGlzLnNldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKTtcbiAgICBsZXQgY29uZmlnID0ge1xuICAgICAgdGV4dEZvcm1hdHRlcnM6XG4gICAgICAgIHRoaXMudGV4dEZvcm1hdHRlcnMgJiYgdGhpcy50ZXh0Rm9ybWF0dGVycy5sZW5ndGhcbiAgICAgICAgICA/IFsuLi50aGlzLnRleHRGb3JtYXR0ZXJzXVxuICAgICAgICAgIDogQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsVGV4dEZvcm1hdHRlcnMoe1xuICAgICAgICAgICAgZGlzYWJsZU1lbnRpb25zOiB0aGlzLmRpc2FibGVNZW50aW9ucyxcbiAgICAgICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICAgIGFsaWdubWVudCxcbiAgICAgICAgICB9KSxcbiAgICB9O1xuXG4gICAgbGV0IHRleHRGb3JtYXR0ZXJzOiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPiA9IGNvbmZpZy50ZXh0Rm9ybWF0dGVycztcbiAgICBsZXQgdXJsVGV4dEZvcm1hdHRlciE6IENvbWV0Q2hhdFVybHNGb3JtYXR0ZXI7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVNZW50aW9ucykge1xuICAgICAgbGV0IG1lbnRpb25zVGV4dEZvcm1hdHRlciE6IENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGV4dEZvcm1hdHRlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcikge1xuICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlciA9IHRleHRGb3JtYXR0ZXJzW1xuICAgICAgICAgICAgaVxuICAgICAgICAgIF0gYXMgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0TWVudGlvbmVkVXNlcnMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKFxuICAgICAgICAgICAgICBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRMb2dnZWRJblVzZXIoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAodXJsVGV4dEZvcm1hdHRlcikge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB1cmxUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbaV0gYXMgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICAgICAgICBpZiAobWVudGlvbnNUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghbWVudGlvbnNUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlciA9XG4gICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAuLi5jb25maWcsXG4gICAgICAgICAgICBhbGlnbm1lbnQsXG4gICAgICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIHRleHRGb3JtYXR0ZXJzLnB1c2gobWVudGlvbnNUZXh0Rm9ybWF0dGVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGV4dEZvcm1hdHRlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXRVcmxzRm9ybWF0dGVyKSB7XG4gICAgICAgICAgdXJsVGV4dEZvcm1hdHRlciA9IHRleHRGb3JtYXR0ZXJzW2ldIGFzIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXVybFRleHRGb3JtYXR0ZXIpIHtcbiAgICAgIHVybFRleHRGb3JtYXR0ZXIgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRVcmxUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICBhbGlnbm1lbnQsXG4gICAgICB9KTtcbiAgICAgIHRleHRGb3JtYXR0ZXJzLnB1c2godXJsVGV4dEZvcm1hdHRlcik7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdGV4dEZvcm1hdHRlcnNbaV0uc2V0TWVzc2FnZUJ1YmJsZUFsaWdubWVudChhbGlnbm1lbnQpO1xuICAgICAgdGV4dEZvcm1hdHRlcnNbaV0uc2V0TWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGV4dEZvcm1hdHRlcnM7XG4gIH07XG5cbiAgLyoqXG4gICAqIHByZXBlbmQgRmV0Y2hlZCBNZXNzYWdlc1xuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZXNcbiAgICovXG4gIHByZXBlbmRNZXNzYWdlcyhtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pIHtcbiAgICB0cnkge1xuICAgICAgaWYoIXRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2VzWzBdKSl7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VzLCAuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICB0aGlzLm1lc3NhZ2VDb3VudCA9IHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aDtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VDb3VudCA+IHRoaXMudGhyZXNob2xkVmFsdWUpIHtcbiAgICAgICAgdGhpcy5rZWVwUmVjZW50TWVzc2FnZXMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGFjaCgpOyAvLyBEZXRhY2ggdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5jaGF0Q2hhbmdlZCkge1xuICAgICAgICBDb21ldENoYXRVSUV2ZW50cy5jY0FjdGl2ZUNoYXRDaGFuZ2VkLm5leHQoe1xuICAgICAgICAgIHVzZXI6IHRoaXMudXNlcixcbiAgICAgICAgICBncm91cDogdGhpcy5ncm91cCxcbiAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1ttZXNzYWdlcz8ubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgdW5yZWFkTWVzc2FnZUNvdW50OiB0aGlzLmdldFVucmVhZENvdW50LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jaGF0Q2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogbGlzdGVuaW5nIHRvIGJvdHRvbSBzY3JvbGwgdXNpbmcgaW50ZXJzZWN0aW9uIG9ic2VydmVyXG4gICAqL1xuICBpb0JvdHRvbSgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIHJvb3Q6IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudCxcbiAgICAgIHJvb3RNYXJnaW46IFwiLTEwMCUgMHB4IDEwMHB4IDBweFwiLFxuICAgICAgdGhyZXNob2xkOiAwLFxuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrID0gKGVudHJpZXM6IGFueSkgPT4ge1xuICAgICAgdmFyIGxhc3RNZXNzYWdlID0gdGhpcy5VbnJlYWRDb3VudFt0aGlzLlVucmVhZENvdW50Lmxlbmd0aCAtIDFdO1xuICAgICAgdGhpcy5pc09uQm90dG9tID0gZW50cmllc1swXS5pc0ludGVyc2VjdGluZztcbiAgICAgIGlmICh0aGlzLmlzT25Cb3R0b20pIHtcbiAgICAgICAgdGhpcy5mZXRjaE5leHRNZXNzYWdlKCk7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiB0aGlzLlVucmVhZENvdW50Py5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobGFzdE1lc3NhZ2UpLnRoZW4oXG4gICAgICAgICAgICAocmVzOiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PSBOdW1iZXIocmVzPy5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzUmVhZChtZXNzYWdlS2V5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBvYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoXG4gICAgICBjYWxsYmFjayxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICAgIG9ic2VydmVyLm9ic2VydmUodGhpcy5ib3R0b20/Lm5hdGl2ZUVsZW1lbnQpO1xuICB9XG4gIC8qKlxuICAgKiBsaXN0ZW5pbmcgdG8gdG9wIHNjcm9sbCB1c2luZyBpbnRlcnNlY3Rpb24gb2JzZXJ2ZXJcbiAgICovXG4gIGlvVG9wKCkge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgcm9vdDogdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LFxuICAgICAgcm9vdE1hcmdpbjogXCIyMDBweCAwcHggMHB4IDBweFwiLFxuICAgICAgdGhyZXNob2xkOiAxLjAsXG4gICAgfTtcbiAgICB2YXIgY2FsbGJhY2sgPSAoZW50cmllczogYW55KSA9PiB7XG4gICAgICBpZiAoZW50cmllc1swXS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICB0aGlzLm51bWJlck9mVG9wU2Nyb2xsKys7XG4gICAgICAgIGlmICh0aGlzLm51bWJlck9mVG9wU2Nyb2xsID4gMSkge1xuICAgICAgICAgIHRoaXMuZmV0Y2hQcmV2aW91c01lc3NhZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBvYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoXG4gICAgICBjYWxsYmFjayxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICAgIG9ic2VydmVyLm9ic2VydmUodGhpcy50b3A/Lm5hdGl2ZUVsZW1lbnQpO1xuICB9XG4gIC8vIHB1YmxpYyBtZXRob2RzXG4gIGFkZE1lc3NhZ2UgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdGhpcy5tZXNzYWdlc0xpc3QucHVzaChtZXNzYWdlKTtcbiAgICBpZiAobWVzc2FnZS5nZXRJZCgpKSB7XG4gICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIobWVzc2FnZS5nZXRJZCgpKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpIHx8XG4gICAgICB0aGlzLmlzT25Cb3R0b21cbiAgICApIHtcbiAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICB9O1xuICAvKipcbiAgICogY2FsbGJhY2sgZm9yIGNvcHkgbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVGV4dE1lc3NhZ2V9IG9iamVjdFxuICAgKi9cbiAgb25Db3B5TWVzc2FnZSA9IChvYmplY3Q6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkgPT4ge1xuICAgIGxldCB0ZXh0ID0gb2JqZWN0LmdldFRleHQoKTtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5kaXNhYmxlTWVudGlvbnMgJiZcbiAgICAgIG9iamVjdC5nZXRNZW50aW9uZWRVc2VycyAmJlxuICAgICAgb2JqZWN0LmdldE1lbnRpb25lZFVzZXJzKCkubGVuZ3RoXG4gICAgKSB7XG4gICAgICB0ZXh0ID0gdGhpcy5nZXRNZW50aW9uc1RleHRXaXRob3V0U3R5bGUob2JqZWN0KTtcbiAgICB9XG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgdG8gZW5zdXJlIHRoYXQgdGhlIHVpZCBkb2Vzbid0IGdldCBjb3BpZWQgd2hlbiBjbGlja2luZyBvbiB0aGUgY29weSBvcHRpb24uXG4gICAqIFRoaXMgZnVuY3Rpb24gY2hhbmdlcyB0aGUgdWlkIHJlZ2V4IHRvICdAdXNlck5hbWUnIHdpdGhvdXQgZm9ybWF0dGluZ1xuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5UZXh0TWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgZ2V0TWVudGlvbnNUZXh0V2l0aG91dFN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkge1xuICAgIGNvbnN0IHJlZ2V4ID0gLzxAdWlkOiguKj8pPi9nO1xuICAgIGxldCBtZXNzYWdlVGV4dCA9IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICAgIGxldCBtZXNzYWdlVGV4dFRtcCA9IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICAgIGxldCBtYXRjaCA9IHJlZ2V4LmV4ZWMobWVzc2FnZVRleHQpO1xuICAgIGxldCBtZW50aW9uZWRVc2VycyA9IG1lc3NhZ2UuZ2V0TWVudGlvbmVkVXNlcnMoKTtcbiAgICB3aGlsZSAobWF0Y2ggIT09IG51bGwpIHtcbiAgICAgIGxldCB1c2VyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZW50aW9uZWRVc2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobWF0Y2hbMV0gPT0gbWVudGlvbmVkVXNlcnNbaV0uZ2V0VWlkKCkpIHtcbiAgICAgICAgICB1c2VyID0gbWVudGlvbmVkVXNlcnNbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIG1lc3NhZ2VUZXh0VG1wID0gbWVzc2FnZVRleHRUbXAucmVwbGFjZShcbiAgICAgICAgICBtYXRjaFswXSxcbiAgICAgICAgICBcIkBcIiArIHVzZXIuZ2V0TmFtZSgpICsgXCJcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VUZXh0VG1wO1xuICB9XG5cbiAgLyoqXG4gICAqIGNhbGxiYWNrIGZvciBkZWxldGVNZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gb2JqZWN0XG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgbWVzc2FnZVNlbnQobWVzc2FnZXM6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHZhciBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlcztcbiAgICB2YXIgbWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICBsZXQgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IG0uZ2V0TXVpZCgpID09PSBtZXNzYWdlLmdldE11aWQoKVxuICAgICk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgbWVzc2FnZUxpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG1lc3NhZ2UpO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IG1lc3NhZ2VMaXN0O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gIH1cbiAgLyoqXG4gICAqIGNhbGxiYWNrIGZvciBlZGl0TWVzc2FnZSBvcHRpb25cbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBvYmplY3RcbiAgICovXG4gIG9uRWRpdE1lc3NhZ2UgPSAob2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5uZXh0KHtcbiAgICAgIG1lc3NhZ2U6IG9iamVjdCxcbiAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgIH0pO1xuICB9O1xuICB1cGRhdGVNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgbXVpZDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgaWYgKG11aWQpIHtcbiAgICAgIHRoaXMubWVzc2FnZVNlbnQobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgcmVtb3ZlTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgdmFyIG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtc2cpID0+IG1zZz8uZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRJZCgpXG4gICAgICApO1xuICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZSk7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0eWxlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSB0aHJlYWQgdmlldyBvZiBhIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhhdCB0aGUgc3R5bGUgY29uZmlndXJhdGlvbiBpcyBmb3IuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBzdHlsZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICovXG4gIGdldFRocmVhZFZpZXdTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS50aHJlYWRSZXBseUljb25UaW50LFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RmxvdzpcbiAgICAgICAgdGhpcy5pc1NlbnRCeU1lKG1lc3NhZ2UpICYmIHRoaXMuYWxpZ25tZW50ICE9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnRcbiAgICAgICAgICA/IFwicm93LXJldmVyc2VcIlxuICAgICAgICAgIDogXCJyb3dcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1zdGFydFwiLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VGV4dENvbG9yLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlUZXh0Rm9udCxcbiAgICAgIGljb25IZWlnaHQ6IFwiMTVweFwiLFxuICAgICAgaWNvbldpZHRoOiBcIjE1cHhcIixcbiAgICAgIGdhcDogXCI0cHhcIixcbiAgICB9O1xuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBtZXNzYWdlIHdhcyBzZW50IGJ5IHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluIHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgbG9nZ2VkIGluIHVzZXIsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGlzU2VudEJ5TWUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IHNlbnRCeU1lOiBib29sZWFuID1cbiAgICAgICFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCk7XG4gICAgcmV0dXJuIHNlbnRCeU1lO1xuICB9XG4gIGRlbGV0ZU1lc3NhZ2UgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBtZXNzYWdlSWQ6IGFueSA9IG1lc3NhZ2UuZ2V0SWQoKTtcbiAgICAgIENvbWV0Q2hhdC5kZWxldGVNZXNzYWdlKG1lc3NhZ2VJZClcbiAgICAgICAgLnRoZW4oKGRlbGV0ZWRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VEZWxldGVkLm5leHQoZGVsZXRlZE1lc3NhZ2UpO1xuICAgICAgICAgIC8vIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2Nyb2xsVG9Cb3R0b20gPSAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsKHtcbiAgICAgICAgICB0b3A6IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQsXG4gICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaXNPbkJvdHRvbSA9IHRydWU7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0sIDEwKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBpZiAodGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb3VudCBvZiB1bnJlYWQgcmVwbHkgbWVzc2FnZXMgZm9yIGEgZ2l2ZW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBmb3Igd2hpY2ggdGhlIHJlcGx5IGNvdW50IGlzIGJlaW5nIHVwZGF0ZWQuXG4gICAqL1xuXG4gIHVwZGF0ZVVucmVhZFJlcGx5Q291bnQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKClcbiAgICAgICk7XG4gICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VLZXldO1xuICAgICAgICAvLyBsZXQgdW5yZWFkUmVwbHlDb3VudCA9IG1lc3NhZ2VPYmouZ2V0VW5yZWFkUmVwbHlDb3VudCgpXG4gICAgICAgIC8vICAgPyBtZXNzYWdlT2JqLmdldFVucmVhZFJlcGx5Q291bnQoKVxuICAgICAgICAvLyAgIDogMDtcbiAgICAgICAgLy8gdW5yZWFkUmVwbHlDb3VudCA9IHVucmVhZFJlcGx5Q291bnQgKyAxO1xuICAgICAgICAvLyBtZXNzYWdlT2JqLnNldFVucmVhZFJlcGx5Q291bnQodW5yZWFkUmVwbHlDb3VudCk7XG4gICAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlT2JqKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZUxpc3RdO1xuICAgICAgfVxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogTWV0aG9kIHRvIHN1YnNjcmliZSAgdGhlIHJlcXVpcmVkIFJ4anMgZXZlbnRzIHdoZW4gdGhlIENvbWV0Q2hhdE1lc3NhZ2VMaXN0Q29tcG9uZW50IGxvYWRzXG4gICAqL1xuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjQWN0aXZlUHBwb3ZlciA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjQWN0aXZlUG9wb3Zlci5zdWJzY3JpYmUoXG4gICAgICAoZGF0YTogQWN0aXZlUG9wb3ZlcikgPT4ge1xuICAgICAgICBpZihkYXRhID09IEFjdGl2ZVBvcG92ZXIuY29tcG9zZXIgJiYgdGhpcy5tZXNzYWdlVG9SZWFjdCl7XG4gICAgICAgICAgdGhpcy5wb3BvdmVyUmVmLm5hdGl2ZUVsZW1lbnQub3BlbkNvbnRlbnRWaWV3KCk7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlVG9SZWFjdCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIHRoaXMuY2NTaG93UGFuZWwgPSBDb21ldENoYXRVSUV2ZW50cy5jY1Nob3dQYW5lbC5zdWJzY3JpYmUoXG4gICAgICAoZGF0YTogSVBhbmVsKSA9PiB7XG4gICAgICAgIGlmIChkYXRhLmNoaWxkPy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeVZpZXcpIHtcbiAgICAgICAgICB0aGlzLmZldGNoQ29udmVyc2F0aW9uU3VtbWFyeSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc21hcnRSZXBseUNvbmZpZyA9IGRhdGEuY29uZmlndXJhdGlvbiE7XG4gICAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2UhO1xuICAgICAgICB2YXIgc21hcnRSZXBseU9iamVjdCA9IChkYXRhLm1lc3NhZ2UgYXMgYW55KT8ubWV0YWRhdGE/LltcbiAgICAgICAgICBTbWFydFJlcGxpZXNDb25zdGFudHMuaW5qZWN0ZWRcbiAgICAgICAgXT8uZXh0ZW5zaW9ucz8uW1NtYXJ0UmVwbGllc0NvbnN0YW50cy5zbWFydF9yZXBseV07XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudCh0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlKSAmJiBzbWFydFJlcGx5T2JqZWN0ICYmICFzbWFydFJlcGx5T2JqZWN0LmVycm9yKSB7XG4gICAgICAgICAgdGhpcy5lbmFibGVTbWFydFJlcGx5ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NIaWRlUGFuZWwgPSBDb21ldENoYXRVSUV2ZW50cy5jY0hpZGVQYW5lbC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IG51bGw7XG4gICAgICB0aGlzLmVuYWJsZVNtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICB9KTtcbiAgICB0aGlzLmNjTWVzc2FnZVJlYWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZU9iaiA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSk7XG4gICAgICAgICAgLy8gaWYgKG1lc3NhZ2VPYmogJiYgbWVzc2FnZU9iai5nZXRVbnJlYWRSZXBseUNvdW50KCkpIHtcbiAgICAgICAgICAvLyAgIG1lc3NhZ2VPYmouc2V0VW5yZWFkUmVwbHlDb3VudCgwKTtcbiAgICAgICAgICAvLyAgIHRoaXMudXBkYXRlTWVzc2FnZShtZXNzYWdlT2JqKTtcbiAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckFkZGVkLnN1YnNjcmliZShcbiAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgICBpdGVtO1xuICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2VzKGl0ZW0ubWVzc2FnZXMhKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShpdGVtLm1lc3NhZ2UhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID1cbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoaXRlbS5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQgPVxuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAob2JqZWN0OiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKG9iamVjdD8uc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChvYmplY3QubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUob2JqZWN0Lm1lc3NhZ2UhKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5zdWJzY3JpYmUoXG4gICAgICAob2JqOiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKG9iai5tZXNzYWdlKSB7XG4gICAgICAgICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShvYmoubWVzc2FnZSEpO1xuICAgICAgICAgIHN3aXRjaCAob2JqLnN0YXR1cykge1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3M6IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVN0YXR1cy5zdWNjZXNzOiB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtdO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlcGx5Q291bnQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2UpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobWVzc2FnZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlU3RhdHVzLmVycm9yOiB7XG4gICAgICAgICAgICAgIGlmICghbWVzc2FnZS5nZXRTZW5kZXIoKSB8fCB0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShtZXNzYWdlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGUgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZU1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlc3Npb25JZCA9IFwiXCI7XG4gICAgICAgIGlmIChjYWxsICYmIE9iamVjdC5rZXlzKGNhbGwpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxBY2NlcHRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsQWNjZXB0ZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICBjbG9zZVNtYXJ0UmVwbHkgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBjbG9zZUNvbnZlcnNhdGlvblN1bW1hcnkgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2hvd1N0YXR1c0luZm8obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSB0aGlzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgICFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IHRoaXMuTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFNlbnRBdCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHNob3VsZFNob3dNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgZGlzYWJsZVJlY2VpcHQ6IGJvb2xlYW4sIGhpZGVSZWNlaXB0OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgICFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmXG4gICAgICAhKGRpc2FibGVSZWNlaXB0IHx8IGhpZGVSZWNlaXB0KSAmJlxuICAgICAgKCFtZXNzYWdlLmdldFNlbmRlcigpIHx8IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpID09PSBtZXNzYWdlLmdldFNlbmRlcigpPy5nZXRVaWQoKSkgJiZcbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSAhPT0gdGhpcy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgIT09IHRoaXMuTWVzc2FnZUNhdGVnb3J5LmNhbGxcbiAgICApO1xuICB9XG4gIFxuICBzZW5kUmVwbHkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgaWYgKHRoaXMuc21hcnRSZXBseUNvbmZpZy5jY1NtYXJ0UmVwbGllc0NsaWNrZWQpIHtcbiAgICAgIHRoaXMuc21hcnRSZXBseUNvbmZpZy5jY1NtYXJ0UmVwbGllc0NsaWNrZWQoXG4gICAgICAgIHJlcGx5LFxuICAgICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlISxcbiAgICAgICAgdGhpcy5vbkVycm9yLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMsXG4gICAgICAgIHRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXNcbiAgICAgICk7XG4gICAgICB0aGlzLmNsb3NlU21hcnRSZXBseSgpO1xuICAgIH1cbiAgfTtcbiAgc2VuZENvbnZlcnNhdGlvblN0YXJ0ZXIgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5uZXh0KHJlcGx5KTtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgZmV0Y2hDb252ZXJzYXRpb25TdGFydGVyKCkge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgbGV0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyLmdldFVpZCgpXG4gICAgICA6IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuICAgIENvbWV0Q2hhdC5nZXRDb252ZXJzYXRpb25TdGFydGVyKHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSlcbiAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgIE9iamVjdC5rZXlzKHJlc3BvbnNlKS5mb3JFYWNoKChyZXBseSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlW3JlcGx5XSAmJiByZXNwb25zZVtyZXBseV0gIT0gXCJcIikge1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzLnB1c2gocmVzcG9uc2VbcmVwbHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzICYmXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGZldGNoQ29udmVyc2F0aW9uU3VtbWFyeSgpIHtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gdHJ1ZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGxldCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICBsZXQgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IHRoaXMudXNlci5nZXRVaWQoKVxuICAgICAgOiB0aGlzLmdyb3VwLmdldEd1aWQoKTtcblxuICAgIGxldCBhcGlDb25maWd1cmF0aW9uID0gdGhpcy5hcGlDb25maWd1cmF0aW9uO1xuXG4gICAgQ29tZXRDaGF0LmdldENvbnZlcnNhdGlvblN1bW1hcnkocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBhcGlDb25maWd1cmF0aW9uKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKFwiUGFyYW1ldGVyIGlzIG5vdCBhIG51bWJlciFcIik7XG4gICAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtyZXNwb25zZV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSAmJiB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5O1xuICB9XG5cbiAgZ2V0UmVwbGllcygpOiBzdHJpbmdbXSB8IG51bGwge1xuICAgIGxldCBzbWFydFJlcGx5OiBhbnkgPSB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlO1xuICAgIHZhciBzbWFydFJlcGx5T2JqZWN0ID1cbiAgICAgIHNtYXJ0UmVwbHk/Lm1ldGFkYXRhPy5bU21hcnRSZXBsaWVzQ29uc3RhbnRzLmluamVjdGVkXT8uZXh0ZW5zaW9ucz8uW1xuICAgICAgU21hcnRSZXBsaWVzQ29uc3RhbnRzLnNtYXJ0X3JlcGx5XG4gICAgICBdO1xuICAgIGlmIChcbiAgICAgIHNtYXJ0UmVwbHlPYmplY3Q/LnJlcGx5X3Bvc2l0aXZlICYmXG4gICAgICBzbWFydFJlcGx5T2JqZWN0Py5yZXBseV9uZXV0cmFsICYmXG4gICAgICBzbWFydFJlcGx5T2JqZWN0Py5yZXBseV9uZWdhdGl2ZVxuICAgICkge1xuICAgICAgdmFyIHsgcmVwbHlfcG9zaXRpdmUsIHJlcGx5X25ldXRyYWwsIHJlcGx5X25lZ2F0aXZlIH0gPSBzbWFydFJlcGx5T2JqZWN0O1xuICAgICAgcmV0dXJuIFtyZXBseV9wb3NpdGl2ZSwgcmVwbHlfbmV1dHJhbCwgcmVwbHlfbmVnYXRpdmVdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvKipcbiAgICogTWV0aG9kIHRvIHVuc3Vic2NyaWJlIGFsbCB0aGUgUnhqcyBldmVudHMgd2hlbiB0aGUgQ29tZXRDaGF0TWVzc2FnZUxpc3RDb21wb25lbnQgZ2V0cyBkZXN0cm95XG4gICAqL1xuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTGl2ZVJlYWN0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjU2hvd1BhbmVsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjSGlkZVBhbmVsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NDYWxsQWNjZXB0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIHRocmVhZCBpY29uIGJhc2VkIG9uIHRoZSBzZW5kZXIgb2YgdGhlIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgZm9yIHdoaWNoIHRoZSB0aHJlYWQgaWNvbiBpcyBiZWluZyBkZXRlcm1pbmVkLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVGhlIGljb24gZm9yIHRoZSB0aHJlYWQuIElmIHRoZSBtZXNzYWdlIHdhcyBzZW50IGJ5IHRoZSBsb2dnZWQgaW4gdXNlciwgcmV0dXJucyAndGhyZWFkUmlnaHRBcnJvdycuIE90aGVyd2lzZSwgcmV0dXJucyAndGhyZWFkSW5kaWNhdG9ySWNvbicuXG4gICAqL1xuICBnZXRUaHJlYWRJY29uQWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGJvb2xlYW4ge1xuICAgIGxldCBzZW50QnlNZTogYm9vbGVhbiA9XG4gICAgICB0aGlzLmlzU2VudEJ5TWUobWVzc2FnZSkgJiZcbiAgICAgIHRoaXMuYWxpZ25tZW50ID09PSBNZXNzYWdlTGlzdEFsaWdubWVudC5zdGFuZGFyZDtcbiAgICByZXR1cm4gc2VudEJ5TWUgPyBmYWxzZSA6IHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIHN0eWxpbmcgcGFydFxuICAgKi9cbiAgZ2V0QnViYmxlRGF0ZVN0eWxlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBpc1NlbnRCeU1lID1cbiAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJiB0aGlzLmFsaWdubWVudCAhPSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIGxldCBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0O1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Q29sb3I6XG4gICAgICAgIHRoaXMubWVzc2FnZUxpc3RTdHlsZS5UaW1lc3RhbXBUZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRleHRGb250OlxuICAgICAgICB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuVGltZXN0YW1wVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24zKSxcbiAgICAgIHBhZGRpbmc6IFwiMHB4XCIsXG4gICAgICBkaXNwbGF5OiBcImJsb2NrXCIsXG4gICAgfTtcbiAgfTtcbiAgY2hhdHNMaXN0U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmhlaWdodCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5iYWNrZ3JvdW5kLFxuICAgIH07XG4gIH07XG4gIG1lc3NhZ2VDb250YWluZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS53aWR0aCxcbiAgICB9O1xuICB9O1xuICBlcnJvclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbiAgY29udmVyc2F0aW9uU3RhcnRlclN0YXRlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfTtcbiAgfTtcblxuICBjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuXG4gIGVtcHR5U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuICBsb2FkaW5nU3R5bGUgPSB7XG4gICAgaWNvblRpbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8ubG9hZGluZ0ljb25UaW50LFxuICB9O1xuICBjb252ZXJzYXRpb25TdGFydGVyTG9hZGVyID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpY29uVGludDogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG5cbiAgY29udmVyc2F0aW9uU3VtbWFyeUxvYWRlciA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuICBnZXRTY2hlZHVsZXJCdWJibGVTdHlsZSA9IChtZXNzZ2FlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCI1MCVcIixcbiAgICAgIHdpZHRoOiBcIjQ4cHhcIixcbiAgICAgIGhlaWdodDogXCI0OHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgIH0pO1xuICAgIGxldCBsaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcImF1dG9cIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiaW5oZXJpdFwiLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IFwiXCIsXG4gICAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcblxuICAgIGxldCBjYWxlbmRhclN0eWxlID0gbmV3IENhbGVuZGFyU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkYXlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGRheVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1vbnRoWWVhclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgbW9udGhZZWFyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGVmYXVsdERhdGVUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dEJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpbWV6b25lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0aW1lem9uZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFycm93QnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTJcbiAgICAgICksXG4gICAgfSk7XG4gICAgbGV0IHRpbWVTbG90U3R5bGUgPSBuZXcgVGltZVNsb3RTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgY2FsZW5kYXJJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpbWV6b25lSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVNsb3RJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGVtcHR5U2xvdFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGVtcHR5U2xvdFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgc2VwZXJhdG9yVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNsb3RCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgc2xvdEJvcmRlcjogXCJub25lXCIsXG4gICAgICBzbG90Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc2xvdFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHNsb3RUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICB9KTtcbiAgICBsZXQgcXVjaWtWaWV3U3R5bGUgPSBuZXcgUXVpY2tWaWV3U3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbGVhZGluZ0JhclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbGVhZGluZ0JhcldpZHRoOiBcIjRweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgU2NoZWR1bGVyQnViYmxlU3R5bGUoe1xuICAgICAgYXZhdGFyU3R5bGU6IGF2YXRhclN0eWxlLFxuICAgICAgbGlzdEl0ZW1TdHlsZTogbGlzdEl0ZW1TdHlsZSxcbiAgICAgIHF1aWNrVmlld1N0eWxlOiBxdWNpa1ZpZXdTdHlsZSxcbiAgICAgIGRhdGVTZWxlY3RvclN0eWxlOiBjYWxlbmRhclN0eWxlLFxuICAgICAgdGltZVNsb3RTZWxlY3RvclN0eWxlOiB0aW1lU2xvdFN0eWxlLFxuICAgICAgYmFja0J1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzdWdnZXN0ZWRUaW1lQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKX1gLFxuICAgICAgc3VnZ2VzdGVkVGltZUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJhY2tncm91bmQ6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgc3VnZ2VzdGVkVGltZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBzdWdnZXN0ZWRUaW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dEJvcmRlcjogXCJub25lXCIsXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0Qm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgbW9yZUJ1dHRvblRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dEJvcmRlcjogXCJub25lXCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dEJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIG1vcmVCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIGdvYWxDb21wbGV0aW9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIGVycm9yVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBlcnJvclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2NoZWR1bGVCdXR0b25TdHlsZToge1xuICAgICAgICBpY29uSGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgICAgaWNvbldpZHRoOiBcIjIwcHhcIixcbiAgICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkubmFtZSksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgIH0sXG4gICAgICBzZXBlcmF0b3JUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkubmFtZSksXG4gICAgICBzdW1tYXJ5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc3VtbWFyeVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aW1lem9uZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgY2FsZW5kYXJJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGNsb2NrSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgfSk7XG4gIH07XG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIGZvciB0aGUgcmVhY3Rpb24gbGlzdC5cbiAgICogVGhpcyBpbmNsdWRlcyBzdHlsZXMgZm9yIHRoZSBhdmF0YXIsIGxpc3QgaXRlbXMsIGFuZCByZWFjdGlvbiBoaXN0b3J5LlxuICAgKiBAcmV0dXJucyB7UmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbn0gLSBUaGUgY29uZmlndXJlZCByZWFjdGlvbiBsaXN0LlxuICAgKi9cbiAgZ2V0UmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbigpIHtcbiAgICBjb25zdCBhdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiNTAlXCIsXG4gICAgICB3aWR0aDogXCIzNXB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzVweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIG91dGVyVmlld0JvcmRlcldpZHRoOiBcIjBcIixcbiAgICAgIG91dGVyVmlld0JvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBvdXRlclZpZXdCb3JkZXJDb2xvcjogXCJcIixcbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiMFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlYWN0aW9uSGlzdG9yeVN0eWxlID0gbmV3IFJlYWN0aW9uTGlzdFN0eWxlKHtcbiAgICAgIHdpZHRoOiBcIjMyMHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzAwcHhcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBlcnJvckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgc2xpZGVyRW1vamlDb3VudEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBzbGlkZXJFbW9qaUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGFpbFZpZXdGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGRpdmlkZXJUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2xpZGVyRW1vamlDb3VudENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgYWN0aXZlRW1vamlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKHtcbiAgICAgIGF2YXRhclN0eWxlOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/LmF2YXRhclN0eWxlIHx8XG4gICAgICAgIGF2YXRhclN0eWxlLFxuICAgICAgZXJyb3JJY29uVVJMOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/LmVycm9ySWNvblVSTCB8fFxuICAgICAgICBcIlwiLFxuICAgICAgbGlzdEl0ZW1TdHlsZTpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uPy5saXN0SXRlbVN0eWxlIHx8XG4gICAgICAgIGxpc3RJdGVtU3R5bGUsXG4gICAgICBsb2FkaW5nSWNvblVSTDpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5sb2FkaW5nSWNvblVSTCB8fCBcIlwiLFxuICAgICAgcmVhY3Rpb25MaXN0U3R5bGU6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvblxuICAgICAgICAgID8ucmVhY3Rpb25MaXN0U3R5bGUgfHwgcmVhY3Rpb25IaXN0b3J5U3R5bGUsXG4gICAgICByZWFjdGlvbkl0ZW1DbGlja2VkOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LnJlYWN0aW9uSXRlbUNsaWNrZWQgfHwgdGhpcy5vblJlYWN0aW9uSXRlbUNsaWNrZWQsXG4gICAgICByZWFjdGlvbnNSZXF1ZXN0QnVpbGRlcjpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5yZWFjdGlvbnNSZXF1ZXN0QnVpbGRlciB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIEhhbmRsZXMgd2hlbiBhIHJlYWN0aW9uIGl0ZW0gaXMgY2xpY2tlZC5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb259IHJlYWN0aW9uIC0gVGhlIGNsaWNrZWQgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhlIHJlYWN0aW9uIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAgICovXG5cbiAgb25SZWFjdGlvbkl0ZW1DbGlja2VkPyA9IChcbiAgICByZWFjdGlvbjogQ29tZXRDaGF0LlJlYWN0aW9uLFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApOiB2b2lkID0+IHtcbiAgICBpZiAocmVhY3Rpb24/LmdldFJlYWN0ZWRCeSgpPy5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpLCBtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBIYW5kbGVzIGFkZGluZyBhIHJlYWN0aW9uIHdoZW4gY2xpY2tlZC5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb25Db3VudH0gcmVhY3Rpb24gLSBUaGUgY2xpY2tlZCByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGUgcmVhY3Rpb24gaXMgYXNzb2NpYXRlZCB3aXRoLlxuICAgKi9cbiAgYWRkUmVhY3Rpb25PbkNsaWNrID0gKFxuICAgIHJlYWN0aW9uOiBDb21ldENoYXQuUmVhY3Rpb25Db3VudCxcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKSA9PiB7XG4gICAgbGV0IG9uUmVhY3RDbGljayA9IHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25DbGljaztcbiAgICBpZiAob25SZWFjdENsaWNrKSB7XG4gICAgICBvblJlYWN0Q2xpY2socmVhY3Rpb24sIG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpLCBtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIGZvciB0aGUgcmVhY3Rpb24gaW5mby5cbiAgICogVGhpcyBpbmNsdWRlcyBzdHlsZXMgZm9yIHRoZSByZWFjdGlvbiBpbmZvIGRpc3BsYXkuXG4gICAqIEByZXR1cm5zIHtSZWFjdGlvbkluZm9Db25maWd1cmF0aW9ufSAtIFRoZSBjb25maWd1cmVkIHJlYWN0aW9uIGluZm8uXG4gICAqL1xuXG4gIGdldFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oKSB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkluZm9Db25maWd1cmF0aW9uIHx8IHt9O1xuICAgIGNvbnN0IHJlYWN0aW9uSW5mb1N0eWxlID0gbmV3IFJlYWN0aW9uSW5mb1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8uYm9yZGVyIHx8IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5ib3JkZXJSYWRpdXMgfHwgXCIxMnB4XCIsXG4gICAgICBlcnJvckljb25UaW50OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5lcnJvckljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5sb2FkaW5nSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBuYW1lc0NvbG9yOlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5uYW1lc0NvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbmFtZXNGb250OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5uYW1lc0ZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICByZWFjdGVkVGV4dENvbG9yOlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5yZWFjdGVkVGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKFwiZGFya1wiKSxcbiAgICAgIHJlYWN0ZWRUZXh0Rm9udDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ucmVhY3RlZFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgcmVhY3Rpb25Gb250U2l6ZTogY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ucmVhY3Rpb25Gb250U2l6ZSB8fCBcIjM3cHhcIixcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oe1xuICAgICAgcmVhY3Rpb25JbmZvU3R5bGU6IHJlYWN0aW9uSW5mb1N0eWxlLFxuICAgICAgcmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXI6IGNvbmZpZz8ucmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXIgfHwgdW5kZWZpbmVkLFxuICAgICAgZXJyb3JJY29uVVJMOiBjb25maWc/LmVycm9ySWNvblVSTCB8fCBcIlwiLFxuICAgICAgbG9hZGluZ0ljb25VUkw6IGNvbmZpZz8ubG9hZGluZ0ljb25VUkwgfHwgXCJcIixcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogR2V0IHN0eWxlIG9iamVjdCBiYXNlZCBvbiBtZXNzYWdlIHR5cGUuXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBzdHlsZSBvYmplY3QuXG4gICAqL1xuICBnZXRTdGF0dXNJbmZvU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgLy8gQmFzZSBzdHlsZXMgdGhhdCBhcmUgY29tbW9uIGZvciBib3RoIGNvbmRpdGlvbnNcbiAgICBjb25zdCBiYXNlU3R5bGUgPSB7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1lbmRcIixcbiAgICAgIGdhcDogXCIxcHhcIixcbiAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgfTtcblxuICAgIC8vIElmIG1lc3NhZ2UgdHlwZSBpcyBhdWRpbyBvciB2aWRlb1xuICAgIGlmICh0aGlzLmlzQXVkaW9PclZpZGVvTWVzc2FnZShtZXNzYWdlKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uYmFzZVN0eWxlLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIyMnB4XCIsXG4gICAgICAgIHBhZGRpbmc6IFwiM3B4IDVweFwiLFxuICAgICAgICBwYWRkaW5nVG9wOiBcIjJweFwiLFxuICAgICAgICBwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuICAgICAgICBtYXJnaW5Ub3A6IFwiLTI2cHhcIixcbiAgICAgICAgbWFyZ2luUmlnaHQ6IFwiNnB4XCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgICAgYWxpZ25TZWxmOiBcImZsZXgtZW5kXCIsXG4gICAgICAgIG1hcmdpbkJvdHRvbTogXCI2cHhcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gU3R5bGUgZm9yIG90aGVyIHR5cGVzIG9mIG1lc3NhZ2VzXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmJhc2VTdHlsZSxcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImZsZXgtZW5kXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtZW5kXCIsXG4gICAgICBwYWRkaW5nOiBcIjBweCA4cHggNHB4IDhweFwiLFxuICAgIH07XG4gIH07XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG4gIGxpc3RTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLnNob3dTbWFydFJlcGx5ID8gXCI5MiVcIiA6IFwiMTAwJVwiLFxuICAgIH07XG4gIH07XG4gIC8qKlxuICAgKiBTdHlsaW5nIGZvciByZWFjdGlvbnMgY29tcG9uZW50XG4gICAqXG4gICAqL1xuICBnZXRSZWFjdGlvbnNXcmFwcGVyU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IGFsaWdubWVudCA9IHRoaXMuc2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpO1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBwYWRkaW5nVG9wOiBcIjVweFwiLFxuICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgbWFyZ2luVG9wOiBcIi05cHhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OlxuICAgICAgICBhbGlnbm1lbnQgPT09IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdCA/IFwiZmxleC1zdGFydFwiIDogXCJmbGV4LWVuZFwiLFxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqIFN0eWxpbmcgZm9yIHVucmVhZCB0aHJlYWQgcmVwbGllc1xuICAgKiBAcmV0dXJucyBMYWJlbFN0eWxlXG4gICAqL1xuICBnZXRVbnJlYWRSZXBsaWVzQ291bnRTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwcHhcIixcbiAgICAgIHdpZHRoOiBcIjE1cHhcIixcbiAgICAgIGhlaWdodDogXCIxNXB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZEJhY2tncm91bmQsXG4gICAgICBjb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZFRleHRDb2xvcixcbiAgICAgIGZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlVbnJlYWRUZXh0Rm9udCxcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIH07XG4gIH07XG4gIGdldFRocmVhZFZpZXdBbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6XG4gICAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJlxuICAgICAgICAgIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkXG4gICAgICAgICAgPyBcImZsZXgtZW5kXCJcbiAgICAgICAgICA6IFwiZmxleC1zdGFydFwiLFxuICAgIH07XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiXG4gICpuZ0lmPVwiIW9wZW5Db250YWN0c1ZpZXdcIj5cblxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19oZWFkZXItdmlld1wiPlxuICAgIDxkaXYgKm5nSWY9XCJoZWFkZXJWaWV3XCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiaGVhZGVyVmlld1wiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0XCIgI2xpc3RTY3JvbGxcbiAgICBbbmdTdHlsZV09XCJ7aGVpZ2h0OiBzaG93U21hcnRSZXBseSB8fCBzaG93Q29udmVyc2F0aW9uU3RhcnRlciB8fCBzaG93Q29udmVyc2F0aW9uU3VtbWFyeSA/ICc5MiUnIDogJzEwMCUnfVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3RvcFwiICN0b3A+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGVjb3JhdG9yLW1lc3NhZ2VcIlxuICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMubG9hZGluZyB8fCBzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgIHx8IHN0YXRlID09IHN0YXRlcy5lbXB0eSBcIlxuICAgICAgW25nU3R5bGVdPVwibWVzc2FnZUNvbnRhaW5lclN0eWxlKClcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2xvYWRpbmctdmlld1wiXG4gICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbG9hZGVyIFtpY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgICBbbG9hZGVyU3R5bGVdPVwibG9hZGluZ1N0eWxlXCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWxvYWRlcj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2N1c3RvbXZpZXctLWxvYWRpbmdcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgICYmIGxvYWRpbmdTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibG9hZGluZ1N0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2Vycm9yLXZpZXdcIlxuICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lcnJvciAgJiYgIWhpZGVFcnJvciBcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbbGFiZWxTdHlsZV09XCJlcnJvclN0eWxlKClcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICYmICFlcnJvclN0YXRlVmlld1wiXG4gICAgICAgICAgW3RleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jdXN0b20tdmlldy0tZXJyb3JcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICAmJiBlcnJvclN0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJlcnJvclN0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2VtcHR5LXZpZXdcIiAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY3VzdG9tLXZpZXctLWVtcHR5XCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eSAmJiBlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGVcIlxuICAgICAgKm5nRm9yPVwibGV0IG1lc3NhZ2Ugb2YgbWVzc2FnZXNMaXN0OyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlLWNvbnRhaW5lclwiXG4gICAgICAgICpuZ0lmPVwiKGkgPT09IDApICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpICYmICFoaWRlRGF0ZVNlcGFyYXRvclwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbdGltZXN0YW1wXT1cIm1lc3NhZ2UhLmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtwYXR0ZXJuXT1cIkRhdGVTZXBhcmF0b3JQYXR0ZXJuXCIgW2RhdGVTdHlsZV09XCJkYXRlU2VwYXJhdG9yU3R5bGVcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGUtY29udGFpbmVyXCJcbiAgICAgICAgKm5nSWY9XCIoaSA+IDAgJiYgaXNEYXRlRGlmZmVyZW50KG1lc3NhZ2VzTGlzdFtpIC0gMV0/LmdldFNlbnRBdCgpLCBtZXNzYWdlc0xpc3RbaV0/LmdldFNlbnRBdCgpKSkgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KCkgJiYgIWhpZGVEYXRlU2VwYXJhdG9yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW3BhdHRlcm5dPVwiRGF0ZVNlcGFyYXRvclBhdHRlcm5cIiBbZGF0ZVN0eWxlXT1cImRhdGVTZXBhcmF0b3JTdHlsZVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiICNtZXNzYWdlQnViYmxlUmVmXG4gICAgICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGVcbiAgICAgICAgICBbbGVhZGluZ1ZpZXddPVwiIHNob3dBdmF0YXIgPyBsZWFkaW5nVmlldyA6IG51bGxcIlxuICAgICAgICAgIFtib3R0b21WaWV3XT1cImdldEJvdHRvbVZpZXcobWVzc2FnZSlcIlxuICAgICAgICAgIFtzdGF0dXNJbmZvVmlld109XCJzaG93U3RhdHVzSW5mbyhtZXNzYWdlKSA/ICBzdGF0dXNJbmZvVmlldyA6IG51bGxcIlxuICAgICAgICAgIFtoZWFkZXJWaWV3XT1cImdldEhlYWRlclZpZXcobWVzc2FnZSkgfHwgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSA/IGJ1YmJsZUhlYWRlciA6IG51bGxcIlxuICAgICAgICAgIFtmb290ZXJWaWV3XT1cImdldEZvb3RlclZpZXcobWVzc2FnZSkgfHwgcmVhY3Rpb25WaWV3XCJcbiAgICAgICAgICBbY29udGVudFZpZXddPVwiY29udGVudFZpZXdcIiBbdGhyZWFkVmlld109XCJ0aHJlYWRWaWV3XCJcbiAgICAgICAgICBbaWRdPVwibWVzc2FnZT8uZ2V0SWQoKSB8fCBtZXNzYWdlPy5nZXRNdWlkKClcIlxuICAgICAgICAgIFtvcHRpb25zXT1cInNldE1lc3NhZ2VPcHRpb25zKG1lc3NhZ2UpXCJcbiAgICAgICAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgW2FsaWdubWVudF09XCJzZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2NvbnRlbnRWaWV3PlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldENvbnRlbnRWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3JlYWN0aW9uVmlldz5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcmVhY3Rpb25zXG4gICAgICAgICAgICAgICpuZ0lmPVwibWVzc2FnZS5nZXRSZWFjdGlvbnMoKSAmJiBtZXNzYWdlLmdldFJlYWN0aW9ucygpLmxlbmd0aCA+IDAgJiYgIWRpc2FibGVSZWFjdGlvbnNcIlxuICAgICAgICAgICAgICBbbWVzc2FnZU9iamVjdF09XCJnZXRDbG9uZWRSZWFjdGlvbk9iamVjdChtZXNzYWdlKVwiXG4gICAgICAgICAgICAgIFthbGlnbm1lbnRdPVwic2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW3JlYWN0aW9uc1N0eWxlXT1cImdldFJlYWN0aW9uc1N0eWxlKClcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25DbGlja109XCJhZGRSZWFjdGlvbk9uQ2xpY2tcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbl09XCJnZXRSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKClcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbl09XCJnZXRSZWFjdGlvbkluZm9Db25maWd1cmF0aW9uKClcIj48L2NvbWV0Y2hhdC1yZWFjdGlvbnM+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3N0YXR1c0luZm9WaWV3PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLXN0YXR1cy1pbmZvXCJcbiAgICAgICAgICAgICAgW25nU3R5bGVdPVwiZ2V0U3RhdHVzSW5mb1N0eWxlKG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtlbHNlIGJ1YmJsZUZvb3RlclwiPlxuICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUZvb3Rlcj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtZGF0ZVwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLmJvdHRvbSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPlxuICAgICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAgIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+XG4gICAgICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwic2hvdWxkU2hvd01lc3NhZ2UobWVzc2FnZSwgZGlzYWJsZVJlY2VpcHQsIGhpZGVSZWNlaXB0KVwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fcmVjZWlwdFwiPlxuICAgICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAgICAgW3JlY2VpcHRTdHlsZV09XCJnZXRSZWNlaXB0U3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgICAgICBbd2FpdEljb25dPVwid2FpdEljb25cIiBbc2VudEljb25dPVwic2VudEljb25cIlxuICAgICAgICAgICAgICAgICAgICBbZGVsaXZlcmVkSWNvbl09XCJkZWxpdmVyZWRJY29uXCIgW3JlYWRJY29uXT1cInJlYWRJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgW2Vycm9ySWNvbl09XCJlcnJvckljb25cIj48L2NvbWV0Y2hhdC1yZWNlaXB0PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2xlYWRpbmdWaWV3PlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAqbmdJZj1cIiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKVwiPlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbbmFtZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICAgICAgICAgIFtpbWFnZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0QXZhdGFyKClcIj5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUhlYWRlcj5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2Vsc2UgZGVmYXVsdEhlYWRlclwiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0SGVhZGVyPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtaGVhZGVyXCJcbiAgICAgICAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiPlxuICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJsYWJlbFN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS50b3AgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3RocmVhZFZpZXc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X190aHJlYWRyZXBsaWVzXCJcbiAgICAgICAgICAgICAgKm5nSWY9XCJtZXNzYWdlPy5nZXRSZXBseUNvdW50KCkgJiYgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KClcIlxuICAgICAgICAgICAgICBbbmdTdHlsZV09XCJnZXRUaHJlYWRWaWV3QWxpZ25tZW50KG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtaWNvbi1idXR0b24gW2ljb25VUkxdPVwidGhyZWFkSW5kaWNhdG9ySWNvblwiXG4gICAgICAgICAgICAgICAgW21pcnJvckljb25dPVwiZ2V0VGhyZWFkSWNvbkFsaWdubWVudChtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldFRocmVhZFZpZXdTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5UaHJlYWRWaWV3KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICBbdGV4dF09J2dldFRocmVhZENvdW50KG1lc3NhZ2UpJz5cbiAgICAgICAgICAgICAgICA8IS0tIDxzcGFuIHNsb3Q9XCJidXR0b25WaWV3XCIgW25nU3R5bGVdPVwiZ2V0VW5yZWFkUmVwbGllc0NvdW50U3R5bGUoKVwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fdW5yZWFkLXRocmVhZFwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIG1lc3NhZ2UuZ2V0VW5yZWFkUmVwbHlDb3VudCgpID4gMFwiPlxuICAgICAgICAgICAgICAgICAge3ttZXNzYWdlLmdldFVucmVhZFJlcGx5Q291bnQoKX19XG4gICAgICAgICAgICAgICAgPC9zcGFuPiAtLT5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDwvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYm90dG9tXCIgI2JvdHRvbT5cbiAgICA8L2Rpdj5cblxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fbWVzc2FnZS1pbmRpY2F0b3JcIlxuICAgICpuZ0lmPVwiVW5yZWFkQ291bnQgJiYgVW5yZWFkQ291bnQubGVuZ3RoID4gMCAmJiAhaXNPbkJvdHRvbVwiXG4gICAgW25nU3R5bGVdPVwie2JvdHRvbTogc2hvd1NtYXJ0UmVwbHkgfHwgZm9vdGVyVmlldyB8fCBzaG93Q29udmVyc2F0aW9uU3RhcnRlciB8fCBzaG93Q29udmVyc2F0aW9uU3VtbWFyeSAgPyAnMjAlJyA6ICcxMyUnfVwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFt0ZXh0XT1cIm5ld01lc3NhZ2VDb3VudFwiXG4gICAgICBbYnV0dG9uU3R5bGVdPVwidW5yZWFkTWVzc2FnZXNTdHlsZVwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwic2Nyb2xsVG9Cb3R0b20oKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2Zvb3Rlci12aWV3XCIgW25nU3R5bGVdPVwie2hlaWdodDogICdhdXRvJ31cIj5cblxuICAgIDxkaXYgKm5nSWY9XCJmb290ZXJWaWV3O2Vsc2UgZm9vdGVyXCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZm9vdGVyVmlld1wiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gICAgPG5nLXRlbXBsYXRlICNmb290ZXI+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3NtYXJ0LXJlcGxpZXNcIlxuICAgICAgICAqbmdJZj1cIiFzaG93Q29udmVyc2F0aW9uU3RhcnRlciAmJiBzaG93U21hcnRSZXBseSAmJiBnZXRSZXBsaWVzKClcIj5cbiAgICAgICAgPHNtYXJ0LXJlcGxpZXMgW3NtYXJ0UmVwbHlTdHlsZV09XCJzbWFydFJlcGx5U3R5bGVcIlxuICAgICAgICAgIFtyZXBsaWVzXT1cImdldFJlcGxpZXMoKVwiIChjYy1yZXBseS1jbGlja2VkKT1cInNlbmRSZXBseSgkZXZlbnQpXCJcbiAgICAgICAgICAoY2MtY2xvc2UtY2xpY2tlZCk9XCJjbG9zZVNtYXJ0UmVwbHkoKVwiPlxuICAgICAgICA8L3NtYXJ0LXJlcGxpZXM+XG4gICAgICA8L2Rpdj5cblxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jb252ZXJzYXRpb24tc3RhcnRlcnNcIlxuICAgICAgICAqbmdJZj1cImVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXIgJiYgc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXJcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1haS1jYXJkIFtzdGF0ZV09XCJjb252ZXJzYXRpb25TdGFydGVyU3RhdGVcIlxuICAgICAgICAgIFtsb2FkaW5nU3RhdGVUZXh0XT1cInN0YXJ0ZXJMb2FkaW5nU3RhdGVUZXh0XCJcbiAgICAgICAgICBbZW1wdHlTdGF0ZVRleHRdPVwic3RhcnRlckVtcHR5U3RhdGVUZXh0XCJcbiAgICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgICA8c21hcnQtcmVwbGllc1xuICAgICAgICAgICAgKm5nSWY9XCJjb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPT0gc3RhdGVzLmxvYWRlZCAmJiAhcGFyZW50TWVzc2FnZUlkXCJcbiAgICAgICAgICAgIFtzbWFydFJlcGx5U3R5bGVdPVwiY29udmVyc2F0aW9uU3RhcnRlclN0eWxlXCJcbiAgICAgICAgICAgIFtyZXBsaWVzXT1cImNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzXCIgc2xvdD1cImxvYWRlZFZpZXdcIlxuICAgICAgICAgICAgKGNjLXJlcGx5LWNsaWNrZWQpPVwic2VuZENvbnZlcnNhdGlvblN0YXJ0ZXIoJGV2ZW50KVwiXG4gICAgICAgICAgICBbY2xvc2VJY29uVVJMXT1cIicnXCI+XG4gICAgICAgICAgPC9zbWFydC1yZXBsaWVzPlxuICAgICAgICA8L2NvbWV0Y2hhdC1haS1jYXJkPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2NvbnZlcnNhdGlvbi1zdW1tYXJ5XCJcbiAgICAgICAgKm5nSWY9XCJlbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5ICYmIHNob3dDb252ZXJzYXRpb25TdW1tYXJ5XCI+XG5cbiAgICAgICAgPGNvbWV0Y2hhdC1haS1jYXJkIFtzdGF0ZV09XCJjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGVcIlxuICAgICAgICAgIFtsb2FkaW5nU3RhdGVUZXh0XT1cInN1bW1hcnlMb2FkaW5nU3RhdGVUZXh0XCJcbiAgICAgICAgICBbZW1wdHlTdGF0ZVRleHRdPVwic3VtbWFyeUVtcHR5U3RhdGVUZXh0XCJcbiAgICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIiBbZXJyb3JJY29uVVJMXT1cImFpRXJyb3JJY29uXCJcbiAgICAgICAgICBbZW1wdHlJY29uVVJMXT1cImFpRW1wdHlJY29uXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1wYW5lbFxuICAgICAgICAgICAgKm5nSWY9XCJjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPT0gc3RhdGVzLmxvYWRlZCAmJiAhcGFyZW50TWVzc2FnZUlkXCJcbiAgICAgICAgICAgIHNsb3Q9XCJsb2FkZWRWaWV3XCIgW3BhbmVsU3R5bGVdPVwiY29udmVyc2F0aW9uU3VtbWFyeVN0eWxlXCJcbiAgICAgICAgICAgIHRpdGxlPVwiQ29udmVyc2F0aW9uIFN1bW1hcnlcIiBbdGV4dF09XCJjb252ZXJzYXRpb25TdW1tYXJ5XCJcbiAgICAgICAgICAgIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlQ29udmVyc2F0aW9uU3VtbWFyeSgpXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcGFuZWw+XG4gICAgICAgIDwvY29tZXRjaGF0LWFpLWNhcmQ+XG5cbiAgICAgIDwvZGl2PlxuXG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9kaXY+XG5cbjwvZGl2PlxuPCEtLSBkZWZhdWx0IGJ1YmJsZXMgLS0+XG48bmctdGVtcGxhdGUgI3RleHRCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAqbmdJZj1cIm1lc3NhZ2U/LnR5cGUgPT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJnZXRBY3Rpb25NZXNzYWdlKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDxjb21ldGNoYXQtdGV4dC1idWJibGUgKm5nSWY9XCJtZXNzYWdlPy5nZXREZWxldGVkQXQoKVwiXG4gICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cImxvY2FsaXplKCdNRVNTQUdFX0lTX0RFTEVURUQnKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgKm5nSWY9XCIhaXNUcmFuc2xhdGVkKG1lc3NhZ2UpICYmICFnZXRMaW5rUHJldmlldyhtZXNzYWdlKSAmJiAhbWVzc2FnZT8uZGVsZXRlZEF0ICYmIG1lc3NhZ2U/LnR5cGUgIT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW3RleHRdPVwiZ2V0VGV4dE1lc3NhZ2UobWVzc2FnZSlcIlxuICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8bGluay1wcmV2aWV3IFtsaW5rUHJldmlld1N0eWxlXT1cImxpbmtQcmV2aWV3U3R5bGVcIlxuICAgIChjYy1saW5rLWNsaWNrZWQpPVwib3BlbkxpbmtVUkwoJGV2ZW50KVwiXG4gICAgKm5nSWY9XCIhbWVzc2FnZT8uZ2V0RGVsZXRlZEF0KCkgJiYgZ2V0TGlua1ByZXZpZXcobWVzc2FnZSkgJiYgZW5hYmxlTGlua1ByZXZpZXdcIlxuICAgIFt0aXRsZV09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ3RpdGxlJyxtZXNzYWdlKVwiXG4gICAgW2Rlc2NyaXB0aW9uXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygnZGVzY3JpcHRpb24nLG1lc3NhZ2UpXCJcbiAgICBbVVJMXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygndXJsJyxtZXNzYWdlKVwiXG4gICAgW2ltYWdlXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygnaW1hZ2UnLG1lc3NhZ2UpXCJcbiAgICBbZmF2SWNvblVSTF09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ2Zhdmljb24nLG1lc3NhZ2UpXCI+XG4gICAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICAgKm5nSWY9XCIhaXNUcmFuc2xhdGVkKG1lc3NhZ2UpICYmIGdldExpbmtQcmV2aWV3KG1lc3NhZ2UpICYmICFtZXNzYWdlPy5kZWxldGVkQXQgJiYgbWVzc2FnZT8udHlwZSAhPSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiIFt0ZXh0XT1cImdldFRleHRNZXNzYWdlKG1lc3NhZ2UpXCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8L2xpbmstcHJldmlldz5cbiAgPG1lc3NhZ2UtdHJhbnNsYXRpb24tYnViYmxlIFthbGlnbm1lbnRdPVwiZ2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAqbmdJZj1cImlzVHJhbnNsYXRlZChtZXNzYWdlKVwiXG4gICAgW21lc3NhZ2VUcmFuc2xhdGlvblN0eWxlXT1cInNldFRyYW5zbGF0aW9uU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0cmFuc2xhdGVkVGV4dF09XCJpc1RyYW5zbGF0ZWQobWVzc2FnZSlcIlxuICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPlxuICAgIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAgICpuZ0lmPVwiICFtZXNzYWdlPy5kZWxldGVkQXQgJiYgbWVzc2FnZT8udHlwZSAhPSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiIFt0ZXh0XT1cIm1lc3NhZ2U/LnRleHRcIlxuICAgICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG5cbiAgPC9tZXNzYWdlLXRyYW5zbGF0aW9uLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2ZpbGVCdWJibGUgbGV0LW1lc3NhZ2U+XG5cbiAgPGNvbWV0Y2hhdC1maWxlLWJ1YmJsZSBbZmlsZVN0eWxlXT1cInNldEZpbGVCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW2Rvd25sb2FkSWNvblVSTF09XCJkb3dubG9hZEljb25VUkxcIiBbc3VidGl0bGVdPVwibG9jYWxpemUoJ1NIQVJFRF9GSUxFJylcIlxuICAgIFt0aXRsZV09XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy5uYW1lOiAnJ1wiXG4gICAgW2ZpbGVVUkxdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsIDogJydcIj48L2NvbWV0Y2hhdC1maWxlLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2F1ZGlvQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtkaXNhYmxlZF09XCJ0cnVlXCJcbiAgICAqbmdJZj1cIm1lc3NhZ2U/LmNhdGVnb3J5ID09IGNhbGxDb25zdGFudCAmJiBtZXNzYWdlPy50eXBlID09IE1lc3NhZ2VUeXBlc0NvbnN0YW50LmF1ZGlvXCJcbiAgICBbaWNvblVSTF09XCJnZXRDYWxsVHlwZUljb24obWVzc2FnZSlcIlxuICAgIFtidXR0b25TdHlsZV09XCJjYWxsU3RhdHVzU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cImdldENhbGxBY3Rpb25NZXNzYWdlKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG4gIDxjb21ldGNoYXQtYXVkaW8tYnViYmxlXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlPy5jYXRlZ29yeSAhPSBjYWxsQ29uc3RhbnRcIlxuICAgIFtzcmNdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsIDogJydcIj5cbiAgPC9jb21ldGNoYXQtYXVkaW8tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjdmlkZW9CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtaWNvbi1idXR0b24gW2Rpc2FibGVkXT1cInRydWVcIlxuICAgICpuZ0lmPVwibWVzc2FnZT8uY2F0ZWdvcnkgPT0gY2FsbENvbnN0YW50ICYmIG1lc3NhZ2U/LnR5cGUgPT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQudmlkZW9cIlxuICAgIFtpY29uVVJMXT1cImdldENhbGxUeXBlSWNvbihtZXNzYWdlKVwiXG4gICAgW2J1dHRvblN0eWxlXT1cImNhbGxTdGF0dXNTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwiZ2V0Q2FsbEFjdGlvbk1lc3NhZ2UobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cblxuICA8Y29tZXRjaGF0LXZpZGVvLWJ1YmJsZVxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZT8uY2F0ZWdvcnkgIT0gY2FsbENvbnN0YW50XCJcbiAgICBbdmlkZW9TdHlsZV09XCJ2aWRlb0J1YmJsZVN0eWxlXCJcbiAgICBbc3JjXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybCA6ICcnXCJcbiAgICBbcG9zdGVyXT1cIiBnZXRJbWFnZVRodW1ibmFpbChtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXZpZGVvLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2ltYWdlQnViYmxlIGxldC1tZXNzYWdlPlxuICA8aW1hZ2UtbW9kZXJhdGlvbiAoY2Mtc2hvdy1kaWFsb2cpPVwib3Blbldhcm5pbmdEaWFsb2coJGV2ZW50KVwiXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBlbmFibGVJbWFnZU1vZGVyYXRpb25cIiBbbWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbaW1hZ2VNb2RlcmF0aW9uU3R5bGVdPVwiaW1hZ2VNb2RlcmF0aW9uU3R5bGVcIj5cbiAgICA8Y29tZXRjaGF0LWltYWdlLWJ1YmJsZSAoY2MtaW1hZ2UtY2xpY2tlZCk9XCJvcGVuSW1hZ2VJbkZ1bGxTY3JlZW4obWVzc2FnZSlcIlxuICAgICAgW2ltYWdlU3R5bGVdPVwiaW1hZ2VCdWJibGVTdHlsZVwiIFtzcmNdPVwiIGdldEltYWdlVGh1bWJuYWlsKG1lc3NhZ2UpXCJcbiAgICAgIFtwbGFjZWhvbGRlckltYWdlXT1cInBsYWNlaG9sZGVySWNvblVSTFwiPjwvY29tZXRjaGF0LWltYWdlLWJ1YmJsZT5cbiAgPC9pbWFnZS1tb2RlcmF0aW9uPlxuICA8Y29tZXRjaGF0LWltYWdlLWJ1YmJsZSBbaW1hZ2VTdHlsZV09XCJpbWFnZUJ1YmJsZVN0eWxlXCJcbiAgICAoY2MtaW1hZ2UtY2xpY2tlZCk9XCJvcGVuSW1hZ2VJbkZ1bGxTY3JlZW4obWVzc2FnZSlcIlxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgIWVuYWJsZUltYWdlTW9kZXJhdGlvblwiXG4gICAgW3NyY109XCIgZ2V0SW1hZ2VUaHVtYm5haWwobWVzc2FnZSlcIlxuICAgIFtwbGFjZWhvbGRlckltYWdlXT1cInBsYWNlaG9sZGVySWNvblVSTFwiPjwvY29tZXRjaGF0LWltYWdlLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2Zvcm1CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtZm9ybS1idWJibGUgW21lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2Zvcm1CdWJibGVTdHlsZV09XCJnZXRGb3JtTWVzc2FnZUJ1YmJsZVN0eWxlKClcIj48L2NvbWV0Y2hhdC1mb3JtLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2NhcmRCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtY2FyZC1idWJibGUgW21lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2NhcmRCdWJibGVTdHlsZV09XCJnZXRDYXJkTWVzc2FnZUJ1YmJsZVN0eWxlKClcIj48L2NvbWV0Y2hhdC1jYXJkLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2N1c3RvbVRleHRCdWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNzdGlja2VyQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWltYWdlLWJ1YmJsZSBbc3JjXT1cImdldFN0aWNrZXIobWVzc2FnZSlcIlxuICAgIFtpbWFnZVN0eWxlXT1cImltYWdlQnViYmxlU3R5bGVcIj48L2NvbWV0Y2hhdC1pbWFnZS1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3doaXRlYm9hcmRCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlIFtoaWRlU2VwYXJhdG9yXT1cImZhbHNlXCJcbiAgICBbaWNvbkFsaWdubWVudF09XCJkb2N1bWVudEJ1YmJsZUFsaWdubWVudFwiXG4gICAgW2RvY3VtZW50U3R5bGVdPVwiZG9jdW1lbnRCdWJibGVTdHlsZVwiIFtVUkxdPVwiZ2V0V2hpdGVib2FyZERvY3VtZW50KG1lc3NhZ2UpXCJcbiAgICBbY2NDbGlja2VkXT1cImxhdW5jaENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkXCJcbiAgICBbaWNvblVSTF09XCJ3aGl0ZWJvYXJkSWNvblVSTFwiIFt0aXRsZV09XCJ3aGl0ZWJvYXJkVGl0bGVcIlxuICAgIFtidXR0b25UZXh0XT1cIndoaXRlYm9hcmRCdXR0b25UZXh0XCJcbiAgICBbc3VidGl0bGVdPVwid2hpdGVib2FyZFN1Yml0bGVcIj48L2NvbWV0Y2hhdC1kb2N1bWVudC1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2RvY3VtZW50QnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZSBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiXG4gICAgW2ljb25BbGlnbm1lbnRdPVwiZG9jdW1lbnRCdWJibGVBbGlnbm1lbnRcIlxuICAgIFtkb2N1bWVudFN0eWxlXT1cImRvY3VtZW50QnViYmxlU3R5bGVcIiBbVVJMXT1cImdldFdoaXRlYm9hcmREb2N1bWVudChtZXNzYWdlKVwiXG4gICAgW2NjQ2xpY2tlZF09XCJsYXVuY2hDb2xsYWJvcmF0aXZlRG9jdW1lbnRcIlxuICAgIFtpY29uVVJMXT1cImRvY3VtZW50SWNvblVSTFwiIFt0aXRsZV09XCJkb2N1bWVudFRpdGxlXCJcbiAgICBbYnV0dG9uVGV4dF09XCJkb2N1bWVudEJ1dHRvblRleHRcIlxuICAgIFtzdWJ0aXRsZV09XCJkb2N1bWVudFN1Yml0bGVcIj48L2NvbWV0Y2hhdC1kb2N1bWVudC1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2RpcmVjdENhbGxpbmcgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlIFtoaWRlU2VwYXJhdG9yXT1cInRydWVcIlxuICAgIFtpY29uQWxpZ25tZW50XT1cImNhbGxCdWJibGVBbGlnbm1lbnRcIlxuICAgIFtkb2N1bWVudFN0eWxlXT1cImdldENhbGxCdWJibGVTdHlsZShtZXNzYWdlKVwiIFtVUkxdPVwiZ2V0U2Vzc2lvbklkKG1lc3NhZ2UpXCJcbiAgICBbY2NDbGlja2VkXT1cImdldFN0YXJ0Q2FsbEZ1bmN0aW9uKG1lc3NhZ2UpXCIgW2ljb25VUkxdPVwiZGlyZWN0Q2FsbEljb25VUkxcIlxuICAgIFt0aXRsZV09XCJnZXRDYWxsQnViYmxlVGl0bGUobWVzc2FnZSlcIiBbYnV0dG9uVGV4dF09XCJqb2luQ2FsbEJ1dHRvblRleHRcIlxuICAgICpuZ0lmPVwibWVzc2FnZS5jYXRlZ29yeSA9PSAnY3VzdG9tJ1wiPjwvY29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjc2NoZWR1bGVyQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LXNjaGVkdWxlci1idWJibGUgW3NjaGVkdWxlck1lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2xvZ2dlZEluVXNlcl09XCJsb2dnZWRJblVzZXJcIlxuICAgIFtzY2hlZHVsZXJCdWJibGVTdHlsZV09XCJnZXRTY2hlZHVsZXJCdWJibGVTdHlsZShtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXNjaGVkdWxlci1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3BvbGxCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxwb2xscy1idWJibGUgW3BvbGxTdHlsZV09XCJwb2xsQnViYmxlU3R5bGVcIlxuICAgIFtwb2xsUXVlc3Rpb25dPVwiZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZSwncXVlc3Rpb24nKVwiXG4gICAgW3BvbGxJZF09XCJnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlLCdpZCcpXCIgW2xvZ2dlZEluVXNlcl09XCJsb2dnZWRJblVzZXJcIlxuICAgIFtzZW5kZXJVaWRdPVwiZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZSlcIlxuICAgIFttZXRhZGF0YV09XCJtZXNzYWdlPy5tZXRhZGF0YVwiPjwvcG9sbHMtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuXG48IS0tIHRocmVhZCBidWJibGUgdmlldyAtLT5cbjxuZy10ZW1wbGF0ZSAjdGhyZWFkTWVzc2FnZUJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGRpdiAqbmdJZj1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuICA8Y29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlICpuZ0lmPVwiIWdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIlxuICAgIFtib3R0b21WaWV3XT1cImdldEJvdHRvbVZpZXcobWVzc2FnZSlcIlxuICAgIFtzdGF0dXNJbmZvVmlld109XCJzaG93U3RhdHVzSW5mbyhtZXNzYWdlKSA/ICBzdGF0dXNJbmZvVmlldyA6IG51bGxcIlxuICAgIFtsZWFkaW5nVmlld109XCIgc2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiIFtoZWFkZXJWaWV3XT1cImJ1YmJsZUhlYWRlclwiXG4gICAgW2Zvb3RlclZpZXddPVwiZ2V0Rm9vdGVyVmlldyhtZXNzYWdlKVwiIFtjb250ZW50Vmlld109XCJjb250ZW50Vmlld1wiXG4gICAgW2lkXT1cIm1lc3NhZ2U/LmdldElkKCkgfHwgbWVzc2FnZT8uZ2V0TXVpZCgpXCJcbiAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW2FsaWdubWVudF09XCJ0aHJlYWRlZEFsaWdubWVudFwiPlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjc3RhdHVzSW5mb1ZpZXc+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtc3RhdHVzLWluZm9cIlxuICAgICAgICBbbmdTdHlsZV09XCJnZXRTdGF0dXNJbmZvU3R5bGUobWVzc2FnZSlcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO2Vsc2UgYnViYmxlRm9vdGVyXCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlRm9vdGVyPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1kYXRlXCJcbiAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0uYm90dG9tICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCIgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICpuZ0lmPVwic2hvdWxkU2hvd01lc3NhZ2UobWVzc2FnZSwgZGlzYWJsZVJlY2VpcHQsIGhpZGVSZWNlaXB0KVwiXG4gICAgICAgICAgICBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fcmVjZWlwdFwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW3JlY2VpcHRTdHlsZV09XCJnZXRSZWNlaXB0U3R5bGUobWVzc2FnZSlcIiBbd2FpdEljb25dPVwid2FpdEljb25cIlxuICAgICAgICAgICAgICBbc2VudEljb25dPVwic2VudEljb25cIiBbZGVsaXZlcmVkSWNvbl09XCJcIlxuICAgICAgICAgICAgICBbcmVhZEljb25dPVwiZGVsaXZlcmVkSWNvblwiXG4gICAgICAgICAgICAgIFtlcnJvckljb25dPVwiZXJyb3JJY29uXCI+PC9jb21ldGNoYXQtcmVjZWlwdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNsZWFkaW5nVmlldz5cbiAgICAgIDxkaXZcbiAgICAgICAgKm5nSWY9XCIgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKVwiPlxuICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbbmFtZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICAgIFtpbWFnZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0QXZhdGFyKClcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUhlYWRlcj5cbiAgICAgIDxkaXYgKm5nSWY9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2Vsc2UgZGVmYXVsdEhlYWRlclwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0SGVhZGVyPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtaGVhZGVyXCJcbiAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJsYWJlbFN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS50b3AgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG5cblxuPCEtLSAgLS0+XG48Y29tZXRjaGF0LXBvcG92ZXIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIiAjcG9wb3ZlclJlZlxuICBbcGxhY2VtZW50XT1cImtleWJvYXJkQWxpZ25tZW50XCIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cIm9uRW1vamlLZXlib2FyZENsb3NlZCgpXCI+XG4gIDxjb21ldGNoYXQtZW1vamkta2V5Ym9hcmQgKGNjLWVtb2ppLWNsaWNrZWQpPVwiYWRkUmVhY3Rpb24oJGV2ZW50KVwiXG4gICAgc2xvdD1cImNvbnRlbnRcIlxuICAgIFtlbW9qaUtleWJvYXJkU3R5bGVdPVwiZW1vamlLZXlib2FyZFN0eWxlXCI+PC9jb21ldGNoYXQtZW1vamkta2V5Ym9hcmQ+XG48L2NvbWV0Y2hhdC1wb3BvdmVyPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cIm9wZW5Db25maXJtRGlhbG9nXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiIFttZXNzYWdlVGV4dF09XCJ3YXJuaW5nVGV4dFwiXG4gICAgKGNjLWNvbmZpcm0tY2xpY2tlZCk9XCJvbkNvbmZpcm1DbGljaygpXCIgW2NhbmNlbEJ1dHRvblRleHRdPVwiY2FuY2VsVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cImNvbmZpcm1UZXh0XCIgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgW2NvbmZpcm1EaWFsb2dTdHlsZV09XCJjb25maXJtRGlhbG9nU3R5bGVcIj5cblxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1mdWxsLXNjcmVlbi12aWV3ZXIgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VJbWFnZUluRnVsbFNjcmVlbigpXCJcbiAgKm5nSWY9XCJvcGVuRnVsbHNjcmVlblZpZXdcIiBbVVJMXT1cImltYWdldXJsVG9PcGVuXCJcbiAgW2Nsb3NlSWNvblVSTF09XCJjbG9zZUljb25VUkxcIiBbZnVsbFNjcmVlblZpZXdlclN0eWxlXT1cImZ1bGxTY3JlZW5WaWV3ZXJTdHlsZVwiPlxuXG48L2NvbWV0Y2hhdC1mdWxsLXNjcmVlbi12aWV3ZXI+XG5cbjwhLS0gb25nb2luZyBjYWxsc2NyZWVuIGZvciBkaXJlY3QgY2FsbCAtLT5cbjxjb21ldGNoYXQtb25nb2luZy1jYWxsICpuZ0lmPVwic2hvd09uZ29pbmdDYWxsXCJcbiAgW2NhbGxTZXR0aW5nc0J1aWxkZXJdPVwiZ2V0Q2FsbEJ1aWxkZXIoKVwiIFtvbmdvaW5nQ2FsbFN0eWxlXT1cIm9uZ29pbmdDYWxsU3R5bGVcIlxuICBbc2Vzc2lvbklEXT1cInNlc3Npb25JZFwiPjwvY29tZXRjaGF0LW9uZ29pbmctY2FsbD5cbjwhLS0gbWVzc2FnZSBpbmZvcm1hdGlvbiB2aWV3IC0tPlxuPCEtLSB0aHJlYWQgYnViYmxlIHZpZXcgLS0+XG48bmctdGVtcGxhdGUgI21lc3NhZ2VpbmZvQnViYmxlIGxldC1tZXNzYWdlPlxuICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgIDxuZy1jb250YWluZXJcbiAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGUgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiXG4gICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgW3N0YXR1c0luZm9WaWV3XT1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpXCJcbiAgICBbZm9vdGVyVmlld109XCJnZXRGb290ZXJWaWV3KG1lc3NhZ2UpXCJcbiAgICBbbGVhZGluZ1ZpZXddPVwic2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiIFtoZWFkZXJWaWV3XT1cImJ1YmJsZUhlYWRlclwiXG4gICAgW2NvbnRlbnRWaWV3XT1cImNvbnRlbnRWaWV3XCIgW2lkXT1cIm1lc3NhZ2U/LmdldElkKCkgfHwgbWVzc2FnZT8uZ2V0TXVpZCgpXCJcbiAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW2FsaWdubWVudF09XCJtZXNzYWdlSW5mb0FsaWdubWVudFwiPlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG4gICAgICA8ZGl2XG4gICAgICAgICpuZ0lmPVwiIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSlcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1hdmF0YXIgW25hbWVdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgICAgICBbaW1hZ2VdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldEF2YXRhcigpXCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWF2YXRhcj5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNidWJibGVIZWFkZXI+XG4gICAgICA8ZGl2ICpuZ0lmPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtlbHNlIGRlZmF1bHRIZWFkZXJcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdEhlYWRlcj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLWhlYWRlclwiXG4gICAgICAgICAgKm5nSWY9XCJtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGxcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwibGFiZWxTdHlsZVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiXG4gICAgICAgICAgICBbdGltZXN0YW1wXT1cIm1lc3NhZ2U/LmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0udG9wICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cIm9wZW5NZXNzYWdlSW5mb1BhZ2VcIiBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCI+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1pbmZvcm1hdGlvblxuICAgIFtjbG9zZUljb25VUkxdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5jbG9zZUljb25VUkxcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICBbcmVhZEljb25dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5yZWFkSWNvblwiXG4gICAgW2RlbGl2ZXJlZEljb25dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5kZWxpdmVyZWRJY29uXCJcbiAgICBbb25FcnJvcl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtTdWJ0aXRsZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIlxuICAgIFtyZWNlaXB0RGF0ZVBhdHRlcm5dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5yZWNlaXB0RGF0ZVBhdHRlcm5cIlxuICAgIFtsaXN0SXRlbVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXcgXCJcbiAgICBbbWVzc2FnZUluZm9ybWF0aW9uU3R5bGVdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5tZXNzYWdlSW5mb3JtYXRpb25TdHlsZVwiXG4gICAgW29uQ2xvc2VdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5vbkNsb3NlID8/ICBjbG9zZU1lc3NhZ2VJbmZvUGFnZVwiXG4gICAgW2J1YmJsZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5idWJibGVWaWV3ID8/IG1lc3NhZ2VpbmZvQnViYmxlXCJcbiAgICBbbWVzc2FnZV09XCJtZXNzYWdlSW5mb09iamVjdFwiPlxuXG4gIDwvY29tZXRjaGF0LW1lc3NhZ2UtaW5mb3JtYXRpb24+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==