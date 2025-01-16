import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewChildren, } from "@angular/core";
import { AvatarStyle, CallscreenStyle, CheckboxStyle, DateStyle, DropdownStyle, InputStyle, LabelStyle, ListItemStyle, QuickViewStyle, RadioButtonStyle, ReceiptStyle, SingleSelectStyle, } from "@cometchat/uikit-elements";
import { CalendarStyle, CallingDetailsUtils, CardBubbleStyle, CollaborativeDocumentConstants, CollaborativeWhiteboardConstants, CometChatSoundManager, TimeSlotStyle, CometChatUIKitUtility, FormBubbleStyle, InteractiveMessageUtils, LinkPreviewConstants, MessageInformationConfiguration, MessageListStyle, MessageReceiptUtils, MessageTranslationConstants, MessageTranslationStyle, SchedulerBubbleStyle, SmartRepliesConstants, ThumbnailGenerationConstants, ReactionsStyle, ReactionListConfiguration, ReactionInfoConfiguration, ReactionListStyle, ReactionInfoStyle, ReactionsConfiguration, CometChatUrlsFormatter, CometChatMentionsFormatter, CometChatUIKitLoginListener, StorageUtils, } from "@cometchat/uikit-shared";
import { CometChatCallEvents, CometChatGroupEvents, CometChatMessageEvents, CometChatTheme, CometChatUIEvents, CometChatUIKitConstants, DatePatterns, DocumentIconAlignment, MessageBubbleAlignment, MessageListAlignment, MessageStatus, Placement, States, TimestampAlignment, fontHelper, localize, } from "@cometchat/uikit-resources";
import { CometChatUIKitCalls, LinkPreviewStyle, StickersConstants, } from "@cometchat/uikit-shared";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { CometChatUIKit } from "../../Shared/CometChatUIkit/CometChatUIKit";
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
            }
        };
        this.getCallActionMessage = (call) => {
            return CallingDetailsUtils.getCallStatus(call, this.loggedInUser);
        };
        this.isMobileView = () => {
            return window.innerWidth <= 768;
        };
        this.showEmojiKeyboard = (id, event) => {
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
            if (!this.disableReactions) {
                return options;
            }
            return options.filter((option) => {
                return option.id !== CometChatUIKitConstants.MessageOption.reactToMessage;
            });
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
                    ? this.typesMap["text"]
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
        this.launchCollaborativeWhiteboardDocument = (url) => {
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
                            CometChat.markAsDelivered(lastMessage).then((receipt) => {
                                let messageKey = this.messagesList.findIndex((m) => m.getId() === Number(receipt?.getMessageId()));
                                if (messageKey > -1) {
                                    this.markAllMessagAsDelivered(messageKey);
                                }
                            });
                        }
                    }
                    if (!lastMessage?.getReadAt() && !isSentByMe) {
                        if (!this.disableReceipt) {
                            CometChat.markAsRead(lastMessage)
                                .then((receipt) => {
                                let messageKey = this.messagesList.findIndex((m) => m.getId() === Number(receipt?.getMessageId()));
                                if (messageKey > -1) {
                                    this.markAllMessagAsRead(messageKey);
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
        this.messageInfoObject = messageObject;
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
                var imageToDownload = thumbnailGenerationObject?.url_small;
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
                    this.updateMessage(object.message);
                }
            }
        });
        this.ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe((obj) => {
            if (obj.message) {
                let message = obj.message;
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
                            this.updateReplyCount(message);
                        }
                        this.updateMessage(message, true);
                        break;
                    }
                    case MessageStatus.error: {
                        if (!message.getSender() || this.isPartOfCurrentChatForUIEvent(message)) {
                            this.updateMessage(message);
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
CometChatMessageListComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatMessageListComponent, deps: [{ token: i0.NgZone }, { token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.12", type: CometChatMessageListComponent, selector: "cometchat-message-list", inputs: { hideError: "hideError", hideDateSeparator: "hideDateSeparator", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateView: "emptyStateView", errorStateText: "errorStateText", emptyStateText: "emptyStateText", loadingIconURL: "loadingIconURL", user: "user", group: "group", disableReceipt: "disableReceipt", hideReceipt: "hideReceipt", disableSoundForMessages: "disableSoundForMessages", customSoundForMessages: "customSoundForMessages", readIcon: "readIcon", deliveredIcon: "deliveredIcon", sentIcon: "sentIcon", waitIcon: "waitIcon", errorIcon: "errorIcon", aiErrorIcon: "aiErrorIcon", aiEmptyIcon: "aiEmptyIcon", alignment: "alignment", showAvatar: "showAvatar", datePattern: "datePattern", timestampAlignment: "timestampAlignment", DateSeparatorPattern: "DateSeparatorPattern", templates: "templates", messagesRequestBuilder: "messagesRequestBuilder", newMessageIndicatorText: "newMessageIndicatorText", scrollToBottomOnNewMessages: "scrollToBottomOnNewMessages", thresholdValue: "thresholdValue", unreadMessageThreshold: "unreadMessageThreshold", reactionsConfiguration: "reactionsConfiguration", disableReactions: "disableReactions", emojiKeyboardStyle: "emojiKeyboardStyle", apiConfiguration: "apiConfiguration", onThreadRepliesClick: "onThreadRepliesClick", headerView: "headerView", footerView: "footerView", parentMessageId: "parentMessageId", threadIndicatorIcon: "threadIndicatorIcon", avatarStyle: "avatarStyle", backdropStyle: "backdropStyle", dateSeparatorStyle: "dateSeparatorStyle", messageListStyle: "messageListStyle", onError: "onError", messageInformationConfiguration: "messageInformationConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, viewQueries: [{ propertyName: "listScroll", first: true, predicate: ["listScroll"], descendants: true }, { propertyName: "bottom", first: true, predicate: ["bottom"], descendants: true }, { propertyName: "top", first: true, predicate: ["top"], descendants: true }, { propertyName: "textBubble", first: true, predicate: ["textBubble"], descendants: true }, { propertyName: "threadMessageBubble", first: true, predicate: ["threadMessageBubble"], descendants: true }, { propertyName: "fileBubble", first: true, predicate: ["fileBubble"], descendants: true }, { propertyName: "audioBubble", first: true, predicate: ["audioBubble"], descendants: true }, { propertyName: "videoBubble", first: true, predicate: ["videoBubble"], descendants: true }, { propertyName: "imageBubble", first: true, predicate: ["imageBubble"], descendants: true }, { propertyName: "formBubble", first: true, predicate: ["formBubble"], descendants: true }, { propertyName: "cardBubble", first: true, predicate: ["cardBubble"], descendants: true }, { propertyName: "stickerBubble", first: true, predicate: ["stickerBubble"], descendants: true }, { propertyName: "documentBubble", first: true, predicate: ["documentBubble"], descendants: true }, { propertyName: "whiteboardBubble", first: true, predicate: ["whiteboardBubble"], descendants: true }, { propertyName: "popoverRef", first: true, predicate: ["popoverRef"], descendants: true }, { propertyName: "directCalling", first: true, predicate: ["directCalling"], descendants: true }, { propertyName: "schedulerBubble", first: true, predicate: ["schedulerBubble"], descendants: true }, { propertyName: "pollBubble", first: true, predicate: ["pollBubble"], descendants: true }, { propertyName: "messageBubbleRef", predicate: ["messageBubbleRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"], components: [{ type: i2.CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: ["messageBubbleStyle", "alignment", "options", "id", "leadingView", "headerView", "replyView", "contentView", "threadView", "footerView", "bottomView", "statusInfoView", "moreIconURL", "topMenuSize"] }, { type: i3.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i4.CometChatMessageInformationComponent, selector: "cometchat-message-information", inputs: ["closeIconURL", "message", "title", "template", "bubbleView", "subtitleView", "listItemView", "receiptDatePattern", "onError", "messageInformationStyle", "readIcon", "deliveredIcon", "onClose", "listItemStyle", "emptyStateText", "errorStateText", "emptyStateView", "loadingIconURL", "loadingStateView", "errorStateView"] }], directives: [{ type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i5.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: CometChatMessageListComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-list", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEVBU0wsU0FBUyxFQUNULFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsV0FBVyxFQUdYLGVBQWUsRUFDZixhQUFhLEVBRWIsU0FBUyxFQUVULGFBQWEsRUFHYixVQUFVLEVBQ1YsVUFBVSxFQUNWLGFBQWEsRUFHYixjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixpQkFBaUIsR0FDbEIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQ0wsYUFBYSxFQUNiLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsOEJBQThCLEVBQzlCLGdDQUFnQyxFQUNoQyxxQkFBcUIsRUFDckIsYUFBYSxFQUNiLHFCQUFxQixFQUNyQixlQUFlLEVBRWYsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQiwrQkFBK0IsRUFDL0IsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQiwyQkFBMkIsRUFDM0IsdUJBQXVCLEVBRXZCLG9CQUFvQixFQUVwQixxQkFBcUIsRUFFckIsNEJBQTRCLEVBQzVCLGNBQWMsRUFDZCx5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLGlCQUFpQixFQUNqQixpQkFBaUIsRUFDakIsc0JBQXNCLEVBRXRCLHNCQUFzQixFQUd0QiwwQkFBMEIsRUFDMUIsMkJBQTJCLEVBQzNCLFlBQVksR0FDYixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsb0JBQW9CLEVBQ3BCLHNCQUFzQixFQUd0QixjQUFjLEVBQ2QsaUJBQWlCLEVBQ2pCLHVCQUF1QixFQUV2QixZQUFZLEVBQ1oscUJBQXFCLEVBUXJCLHNCQUFzQixFQUN0QixvQkFBb0IsRUFDcEIsYUFBYSxFQUNiLFNBQVMsRUFFVCxNQUFNLEVBQ04sa0JBQWtCLEVBQ2xCLFVBQVUsRUFDVixRQUFRLEdBQ1QsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQ0wsbUJBQW1CLEVBQ25CLGdCQUFnQixFQUNoQixpQkFBaUIsR0FDbEIsTUFBTSx5QkFBeUIsQ0FBQztBQUVqQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUMzRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFFMUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRDQUE0QyxDQUFDOzs7Ozs7O0FBRzVFOzs7Ozs7OztHQVFHO0FBT0gsTUFBTSxPQUFPLDZCQUE2QjtJQTJVeEMsWUFDVSxNQUFjLEVBQ2QsR0FBc0IsRUFDdEIsWUFBbUM7UUFGbkMsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLFFBQUcsR0FBSCxHQUFHLENBQW1CO1FBQ3RCLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtRQWxUcEMsY0FBUyxHQUFZLEtBQUssQ0FBQztRQUMzQixzQkFBaUIsR0FBWSxLQUFLLENBQUM7UUFJbkMsbUJBQWMsR0FBVyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNyRCxtQkFBYyxHQUFXLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3ZELG1CQUFjLEdBQVcsb0JBQW9CLENBQUM7UUFHdkQ7Ozs7V0FJRztRQUNNLG1CQUFjLEdBQVksS0FBSyxDQUFDO1FBQ2hDLGdCQUFXLEdBQVksS0FBSyxDQUFDO1FBQzdCLDRCQUF1QixHQUFZLEtBQUssQ0FBQztRQUN6QywyQkFBc0IsR0FBVyxFQUFFLENBQUM7UUFDcEMsYUFBUSxHQUFXLHlCQUF5QixDQUFDO1FBQzdDLGtCQUFhLEdBQVcsOEJBQThCLENBQUM7UUFDdkQsYUFBUSxHQUFXLHlCQUF5QixDQUFDO1FBQzdDLGFBQVEsR0FBVyxpQkFBaUIsQ0FBQztRQUNyQyxjQUFTLEdBQVcsMEJBQTBCLENBQUM7UUFDL0MsZ0JBQVcsR0FBVyxxQkFBcUIsQ0FBQztRQUM1QyxnQkFBVyxHQUFXLHFCQUFxQixDQUFDO1FBQzVDLGNBQVMsR0FBeUIsb0JBQW9CLENBQUMsUUFBUSxDQUFDO1FBQ2hFLGVBQVUsR0FBWSxJQUFJLENBQUM7UUFDM0IsZ0JBQVcsR0FBaUIsWUFBWSxDQUFDLElBQUksQ0FBQztRQUM5Qyx1QkFBa0IsR0FBdUIsa0JBQWtCLENBQUMsTUFBTSxDQUFDO1FBQ25FLHlCQUFvQixHQUFpQixZQUFZLENBQUMsV0FBVyxDQUFDO1FBQzlELGNBQVMsR0FBK0IsRUFBRSxDQUFDO1FBRTNDLDRCQUF1QixHQUFXLEVBQUUsQ0FBQztRQUNyQyxnQ0FBMkIsR0FBWSxLQUFLLENBQUM7UUFDN0MsbUJBQWMsR0FBVyxJQUFJLENBQUM7UUFDOUIsMkJBQXNCLEdBQVcsRUFBRSxDQUFDO1FBQ3BDLDJCQUFzQixHQUM3QixJQUFJLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hCLHFCQUFnQixHQUFZLEtBQUssQ0FBQztRQUNsQyx1QkFBa0IsR0FBdUIsRUFBRSxDQUFDO1FBWTVDLHdCQUFtQixHQUFXLGdDQUFnQyxDQUFDO1FBQy9ELGdCQUFXLEdBQWdCO1lBQ2xDLFlBQVksRUFBRSxNQUFNO1lBQ3BCLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07U0FDZixDQUFDO1FBQ08sa0JBQWEsR0FBa0I7WUFDdEMsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLFVBQVUsRUFBRSxvQkFBb0I7WUFDaEMsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQztRQUNPLHVCQUFrQixHQUFjO1lBQ3ZDLE1BQU0sRUFBRSxFQUFFO1lBQ1YsS0FBSyxFQUFFLEVBQUU7U0FDVixDQUFDO1FBQ08scUJBQWdCLEdBQXFCO1lBQzVDLFlBQVksRUFBRSxnQkFBZ0I7WUFDOUIsa0JBQWtCLEVBQUUsZ0JBQWdCO1lBQ3BDLGtCQUFrQixFQUFFLGdCQUFnQjtTQUNyQyxDQUFDO1FBQ08sWUFBTyxHQUEyRCxDQUN6RSxLQUFtQyxFQUNuQyxFQUFFO1lBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQixDQUFDLENBQUM7UUFDTyxvQ0FBK0IsR0FDdEMsSUFBSSwrQkFBK0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQyxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUMxQyxVQUFLLEdBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUMvQixpQkFBWSxHQUFrQjtZQUM1QixLQUFLLEVBQUUsRUFBRTtZQUNULE1BQU0sRUFBRSxFQUFFO1lBQ1YsTUFBTSxFQUFFLG1CQUFtQjtZQUMzQixZQUFZLEVBQUUsS0FBSztZQUNuQixVQUFVLEVBQUUsT0FBTztZQUNuQixZQUFZLEVBQUUsTUFBTTtZQUNwQixhQUFhLEVBQUUsTUFBTTtZQUNyQixhQUFhLEVBQUUsbUJBQW1CO1lBQ2xDLG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsaUJBQWlCLEVBQUUsT0FBTztZQUMxQixZQUFZLEVBQUUsTUFBTTtTQUNyQixDQUFDO1FBQ0YsaUJBQVksR0FBaUIsRUFBRSxDQUFDO1FBQ2hDLDRCQUF1QixHQUEwQixxQkFBcUIsQ0FBQyxLQUFLLENBQUM7UUFDN0Usd0JBQW1CLEdBQTBCLHFCQUFxQixDQUFDLElBQUksQ0FBQztRQUN4RSx5QkFBb0IsR0FBeUIsRUFBRSxDQUFDO1FBQ2hELGtCQUFhLEdBQThCLGtCQUFrQixDQUFDO1FBQ3ZELGdCQUFXLEdBQVksSUFBSSxDQUFDO1FBQ25DLDBCQUFxQixHQUFXLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVELDBCQUFxQixHQUFXLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzlELDRCQUF1QixHQUFXLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3JFLDBCQUFxQixHQUFXLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVELDBCQUFxQixHQUFXLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzlELDRCQUF1QixHQUFXLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBSTFELG1CQUFjLEdBQVcsRUFBRSxDQUFDO1FBQzVCLGtCQUFhLEdBQVcsRUFBRSxDQUFDO1FBQ2xDLG9CQUFlLEdBQXNCO1lBQ25DLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUsTUFBTTtTQUNmLENBQUM7UUFDRiw2QkFBd0IsR0FBc0IsRUFBRSxDQUFDO1FBQ2pELDZCQUF3QixHQUFlO1lBQ3JDLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLFNBQVMsRUFBRSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEVBQUU7WUFDZCxhQUFhLEVBQUUsRUFBRTtZQUNqQixTQUFTLEVBQUUsRUFBRTtZQUNiLFFBQVEsRUFBRSxFQUFFO1lBQ1osU0FBUyxFQUFFLEVBQUU7WUFDYixVQUFVLEVBQUUsRUFBRTtTQUNmLENBQUM7UUFFSyxtQkFBYyxHQUFZLEtBQUssQ0FBQztRQUNoQyw4QkFBeUIsR0FBWSxLQUFLLENBQUM7UUFDM0MsNEJBQXVCLEdBQVksS0FBSyxDQUFDO1FBQ3pDLDZCQUF3QixHQUFXLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbEQsK0JBQTBCLEdBQWEsRUFBRSxDQUFDO1FBQzFDLDhCQUF5QixHQUFZLEtBQUssQ0FBQztRQUMzQyw0QkFBdUIsR0FBWSxLQUFLLENBQUM7UUFDekMsNkJBQXdCLEdBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUNsRCx3QkFBbUIsR0FBYSxFQUFFLENBQUM7UUFDbkMsbUJBQWMsR0FBUSxDQUFDLENBQUM7UUFJL0Isc0JBQWlCLEdBQWlDLElBQUksQ0FBQztRQUNoRCxxQkFBZ0IsR0FBWSxLQUFLLENBQUM7UUFFbEMsd0JBQW1CLEdBQVcsRUFBRSxDQUFDO1FBQ3hDLHFCQUFnQixHQUFxQixFQUFFLENBQUM7UUFDakMsd0JBQW1CLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLGVBQVUsR0FBRztZQUNsQixNQUFNLEVBQUUsYUFBYTtZQUNyQixLQUFLLEVBQUUsYUFBYTtZQUNwQixhQUFhLEVBQUUsTUFBTTtTQUN0QixDQUFDO1FBQ0ssaUJBQVksR0FBYztZQUMvQixNQUFNLEVBQUUsS0FBSztZQUNiLEtBQUssRUFBRSxNQUFNO1lBQ2IsVUFBVSxFQUFFLE1BQU07U0FDbkIsQ0FBQztRQUNGLG9CQUFlLEdBQXFCLEVBQUUsQ0FBQztRQUN2QyxlQUFVLEdBQVE7WUFDaEIsUUFBUSxFQUFFLGdCQUFnQjtZQUMxQixTQUFTLEVBQUUsTUFBTTtTQUNsQixDQUFDO1FBQ0YscUJBQWdCLEdBQVE7WUFDdEIsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxNQUFNO1lBQ2QsWUFBWSxFQUFFLGlCQUFpQjtZQUMvQixVQUFVLEVBQUUsYUFBYTtTQUMxQixDQUFDO1FBQ0YsaUJBQVksR0FBNEIsRUFBRSxDQUFDO1FBQzNDLG9CQUFlLEdBQWMsRUFBRSxDQUFDO1FBQ2hDLHNCQUFpQixHQUFXLG9DQUFvQyxDQUFDO1FBQ2pFLG9CQUFlLEdBQVcsa0NBQWtDLENBQUM7UUFDN0Qsc0JBQWlCLEdBQVcseUJBQXlCLENBQUM7UUFDdEQsdUJBQWtCLEdBQVcseUJBQXlCLENBQUM7UUFDdkQsb0JBQWUsR0FBVyxxQkFBcUIsQ0FBQztRQUNoRCxxQkFBZ0IsR0FBNEIsRUFBRSxDQUFDO1FBQy9DLHdCQUFtQixHQUF3QixFQUFFLENBQUM7UUFDOUMsb0JBQWUsR0FBd0IsRUFBRSxDQUFDO1FBQzFDLG9CQUFlLEdBQVcsUUFBUSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDL0Qsc0JBQWlCLEdBQVcsUUFBUSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDakUseUJBQW9CLEdBQVcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDM0Qsa0JBQWEsR0FBVyxRQUFRLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUMzRCxvQkFBZSxHQUFXLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzdELHVCQUFrQixHQUFXLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN2RCx1QkFBa0IsR0FBVyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFHOUMsYUFBUSxHQUFvQixRQUFRLENBQUM7UUFDckMsa0JBQWEsR0FBWSxLQUFLLENBQUM7UUFDL0IsdUJBQWtCLEdBQVcsd0JBQXdCLENBQUM7UUFDdEQseUJBQW9CLEdBQ2xCLHVCQUF1QixDQUFDLFlBQVksQ0FBQztRQUN2QyxpQkFBWSxHQUFXLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFDN0QsYUFBUSxHQUFRLEVBQUUsQ0FBQztRQUNuQixvQkFBZSxHQUFRLEVBQUUsQ0FBQztRQUNqQyxVQUFLLEdBQW1CLElBQUksY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLG9CQUFlLEdBQUcsUUFBUSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEQsbUJBQWMsR0FBRyxPQUFPLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVoRCxXQUFNLEdBQWtCLE1BQU0sQ0FBQztRQUN0QyxvQkFBZSxHQUFHLHVCQUF1QixDQUFDLGVBQWUsQ0FBQztRQUNuRCxzQkFBaUIsR0FBVyxDQUFDLENBQUM7UUFDckMsdUJBQWtCLEdBQVksSUFBSSxDQUFDO1FBQ25DLG9CQUFlLEdBQStCLEVBQUUsQ0FBQztRQUMxQyxxQkFBZ0IsR0FBWSxLQUFLLENBQUM7UUFFekMsZUFBVSxHQUFZLEtBQUssQ0FBQztRQUM1QixnQkFBVyxHQUE0QixFQUFFLENBQUM7UUFDMUMsb0JBQWUsR0FBb0IsQ0FBQyxDQUFDO1FBQ3JDLFNBQUksR0FBVyxFQUFFLENBQUM7UUFDbEIsZ0JBQVcsR0FBVyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsZUFBVSxHQUFXLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxnQkFBVyxHQUFXLDBDQUEwQyxDQUFDO1FBc0NqRSxzQkFBaUIsR0FBMkIsc0JBQXNCLENBQUMsSUFBSSxDQUFDO1FBQ3hFLHlCQUFvQixHQUEyQixzQkFBc0IsQ0FBQyxLQUFLLENBQUM7UUFDNUUsc0JBQWlCLEdBQVksS0FBSyxDQUFDO1FBQ25DLHNCQUFpQixHQUFXLFNBQVMsQ0FBQyxLQUFLLENBQUM7UUFDNUMsaUJBQVksR0FBUTtZQUNsQixNQUFNLEVBQUUsT0FBTztZQUNmLEtBQUssRUFBRSxPQUFPO1NBQ2YsQ0FBQztRQUNGLHFCQUFnQixHQUFjO1lBQzVCLE1BQU0sRUFBRSxPQUFPO1lBQ2YsS0FBSyxFQUFFLE9BQU87WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxLQUFLO1lBQ25CLFVBQVUsRUFBRSxhQUFhO1NBQzFCLENBQUM7UUFDRix3QkFBbUIsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7UUFFbEQsc0JBQWlCLEdBQVksS0FBSyxDQUFDO1FBQ25DLDhCQUF5QixHQUFZLEtBQUssQ0FBQztRQUMzQyxzQkFBaUIsR0FBWSxLQUFLLENBQUM7UUFDbkMsZ0JBQVcsR0FBWSxLQUFLLENBQUM7UUFDN0Isb0JBQWUsR0FBWSxLQUFLLENBQUM7UUFDakMsMEJBQXFCLEdBQVksS0FBSyxDQUFDO1FBQ3ZDLG1CQUFjLEdBQVksS0FBSyxDQUFDO1FBQ2hDLHFCQUFnQixHQUFZLEtBQUssQ0FBQztRQUNsQyxtQkFBYyxHQUFZLEtBQUssQ0FBQztRQUNoQyxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUNqQyxrQkFBYSxHQUFZLEtBQUssQ0FBQztRQUMvQixxQkFBZ0IsR0FBb0IsRUFBRSxDQUFDO1FBQ3ZDLGNBQVMsR0FBVyxFQUFFLENBQUM7UUFDdkIsd0JBQW1CLEdBQVksS0FBSyxDQUFDO1FBRXJDLGdCQUFXLEdBQVksS0FBSyxDQUFDO1FBQzdCLDJCQUFzQixHQUFZLEtBQUssQ0FBQztRQUNqQyx5QkFBb0IsR0FBRyxhQUFhLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuRSxrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQiw4QkFBeUIsR0FBWSxLQUFLLENBQUM7UUFHM0MsaUJBQVksR0FBVyxvQkFBb0IsQ0FBQztRQUM1QyxtQkFBYyxHQUFXLHVCQUF1QixDQUFDO1FBQ2pELHVCQUFrQixHQUF1QixFQUFFLENBQUM7UUFDckMsbUJBQWMsR0FBaUMsSUFBSSxDQUFDO1FBRXBELFVBQUssR0FBVyxFQUFFLENBQUM7UUFDMUIsVUFBSyxHQUFhLEVBQUUsQ0FBQztRQUNyQixlQUFVLEdBQWEsRUFBRSxDQUFDO1FBQzFCLGNBQVMsR0FBNkMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQWlIaEUsc0JBQWlCLEdBQUcsR0FBRyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFDOUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUM7UUFDRixnQkFBVyxHQUFHLENBQUMsS0FBVSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxLQUFLLEdBQUcsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ2pEO1FBQ0gsQ0FBQyxDQUFDO1FBYUYseUJBQW9CLEdBQUcsQ0FBQyxJQUFvQixFQUFFLEVBQUU7WUFDOUMsT0FBTyxtQkFBbUIsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRSxDQUFDLENBQUM7UUErRUYsaUJBQVksR0FBRyxHQUFHLEVBQUU7WUFDbEIsT0FBTyxNQUFNLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQztRQUNsQyxDQUFDLENBQUM7UUFVRixzQkFBaUIsR0FBRyxDQUFDLEVBQVUsRUFBRSxLQUFVLEVBQUUsRUFBRTtZQUM3QyxJQUFJLE9BQU8sR0FBa0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyRSxJQUFJLE9BQU8sRUFBRTtnQkFDWCxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQztnQkFDOUIsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQ3ZCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQzlDLElBQUksU0FBUyxFQUFFO3dCQUNiLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMscUJBQXFCLEVBQUUsQ0FBQzt3QkFDN0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO3dCQUMzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO3dCQUN4RCxJQUFJLE9BQU8sRUFBRTs0QkFDWCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQzt5QkFDM0M7NkJBQU0sSUFBSSxVQUFVLEVBQUU7NEJBQ3JCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDO3lCQUN4QztxQkFDRjtpQkFDRjtxQkFDSTtvQkFDSCxJQUFJLENBQUMsaUJBQWlCO3dCQUNwQixPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUU7NEJBQzFELENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSTs0QkFDaEIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7aUJBQ3ZCO2dCQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0RDtRQUNILENBQUMsQ0FBQztRQUNGLGtCQUFhLEdBQUcsR0FBRyxFQUFFO1lBQ25CLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBaUMsRUFBRSxFQUFFO2dCQUNqRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUMsR0FBRyxHQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUM7WUFDcEUsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7UUFDRixtQkFBYyxHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQ2xELElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO2dCQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2FBQzlEO1FBQ0gsQ0FBQyxDQUFDO1FBQ0YsbUJBQWMsR0FBRyxDQUFDLEVBQVUsRUFBRSxFQUFFO1lBQzlCLElBQUksYUFBYSxHQUFRLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUM7UUFDRixtQkFBYyxHQUFHLENBQUMsRUFBVSxFQUFFLEVBQUU7WUFDOUIsSUFBSSxhQUFhLEdBQVEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQztRQUNGLGlCQUFZLEdBQUcsQ0FBQyxFQUFVLEVBQUUsRUFBRTtZQUM1QixJQUFJLGFBQWEsR0FBUSxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDO1FBQ0YsaUJBQVksR0FBRyxDQUFDLEVBQVUsRUFBRSxFQUFFO1lBQzVCLElBQUksYUFBYSxHQUFRLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUM7UUFDRiw2QkFBd0IsR0FBRyxDQUFDLEVBQVUsRUFBRSxFQUFFO1lBQ3hDLElBQUksYUFBYSxHQUFRLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQztRQUNGLHdCQUFtQixHQUFHLENBQUMsRUFBVSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxhQUFhLEdBQVEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQztRQU1GLHlCQUFvQixHQUFHLEdBQUcsRUFBRTtZQUMxQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDO1FBNEJGLDRCQUF1QixHQUFHLENBQUMsV0FBZ0IsRUFBRSxFQUFFO1lBQzdDLElBQUksZUFBZSxHQUFHLFdBQVcsQ0FBQztZQUNsQyxJQUFJLGNBQWMsR0FBRyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDO1lBQ3hFLElBQUksV0FBVyxHQUE0QixDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xFLElBQUksVUFBVSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQ3BDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssZUFBZSxDQUFDLEtBQUssQ0FDM0MsQ0FBQztZQUNGLElBQUksSUFBUyxDQUFDO1lBQ2QsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CLElBQUksVUFBVSxHQUEwQixXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2hFLElBQUssVUFBb0MsQ0FBQyxXQUFXLEVBQUUsRUFBRTtvQkFDdkQsSUFBSSxHQUFJLFVBQW9DLENBQUMsV0FBVyxFQUFFLENBQUM7aUJBQzVEO3FCQUFNO29CQUNKLFVBQW9DLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN0RCxJQUFJLEdBQUksVUFBb0MsQ0FBQyxXQUFXLEVBQUUsQ0FBQztpQkFDNUQ7Z0JBQ0QsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsY0FBYyxDQUFDO2dCQUN0RSxJQUFJLGFBQWEsR0FDZixVQUFVLENBQUM7Z0JBQ2IsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQztnQkFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtRQUNILENBQUMsQ0FBQztRQUNGLHFCQUFnQixHQUFHLENBQUMsRUFBVSxFQUFFLEVBQUU7WUFDaEMsSUFBSSxPQUFPLEdBQWtDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckUsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsU0FBUyxDQUFDLGFBQWEsQ0FDckIsMkJBQTJCLENBQUMsbUJBQW1CLEVBQy9DLDJCQUEyQixDQUFDLElBQUksRUFDaEMsMkJBQTJCLENBQUMsWUFBWSxFQUN4QztvQkFDRSxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRTtvQkFDdEIsSUFBSSxFQUFHLE9BQWlDLENBQUMsT0FBTyxFQUFFO29CQUNsRCxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVM7aUJBQy9CLENBQ0Y7cUJBQ0UsSUFBSSxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUU7b0JBQ3BCLElBQ0UsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxrQkFBa0I7d0JBQzFDLE9BQWlDLEVBQUUsT0FBTyxFQUFFLEVBQzdDO3dCQUNBLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztxQkFDMUI7eUJBQU07d0JBQ0wsT0FBTztxQkFDUjtvQkFDRCx5QkFBeUI7Z0JBQzNCLENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsQ0FBQyxLQUFtQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN4RDtRQUNILENBQUMsQ0FBQztRQStKRjs7Ozs7V0FLRztRQUVILHVCQUFrQixHQUFHLENBQUMsT0FBaUMsRUFBRSxFQUFFO1lBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQzFCLE9BQU8sT0FBTyxDQUFDO2FBQ2hCO1lBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBOEIsRUFBRSxFQUFFO2dCQUN2RCxPQUFPLE1BQU0sQ0FBQyxFQUFFLEtBQUssdUJBQXVCLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQztZQUM1RSxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQW1LRjs7Ozs7O1dBTUc7UUFDSCxtQkFBYyxHQUFHLENBQ2YsT0FBOEIsRUFDTCxFQUFFO1lBQzNCLElBQ0UsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFDL0U7Z0JBQ0EsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBQyxHQUFHLEdBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ2pHO2lCQUFNO2dCQUNMLE9BQU8sT0FBTyxDQUFDLFlBQVksRUFBRTtvQkFDM0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO29CQUN2QixDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2FBQ2pFO1FBQ0gsQ0FBQyxDQUFDO1FBbUZGLHVCQUFrQixHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQ3RELElBQUksU0FBUyxHQUEyQixzQkFBc0IsQ0FBQyxNQUFNLENBQUM7WUFDdEUsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLG9CQUFvQixDQUFDLElBQUksRUFBRTtnQkFDL0MsU0FBUyxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQzthQUN6QztpQkFBTTtnQkFDTCxJQUNFLE9BQU8sRUFBRSxPQUFPLEVBQUU7b0JBQ2xCLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxXQUFXO29CQUNoRCxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFDMUM7b0JBQ0EsU0FBUyxHQUFHLHNCQUFzQixDQUFDLE1BQU0sQ0FBQztpQkFDM0M7cUJBQU0sSUFDTCxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUU7b0JBQ3JCLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFO3dCQUMxRCxPQUFPLEVBQUUsT0FBTyxFQUFFOzRCQUNsQix1QkFBdUIsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQ25EO29CQUNBLFNBQVMsR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7aUJBQzFDO3FCQUFNO29CQUNMLFNBQVMsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7aUJBQ3pDO2FBQ0Y7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDLENBQUM7UUEyTEYscUJBQWdCLEdBQUcsQ0FDakIsT0FBOEIsRUFDTCxFQUFFO1lBQzNCLElBQUksSUFBNkIsQ0FBQztZQUNsQyxJQUNFLElBQUksQ0FBQyxlQUFlO2dCQUNwQixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBQyxHQUFHLEdBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUNuRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBQyxHQUFHLEdBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsVUFBVSxFQUM5RTtnQkFDQSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDL0YsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxDQUFDO2FBQ2I7UUFDSCxDQUFDLENBQUM7UUFRRix3QkFBbUIsR0FBRyxDQUFDLE9BQThCLEVBQUUsRUFBRTtZQUN2RCxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxLQUFLLG9CQUFvQixDQUFDLElBQUksQ0FBQztZQUNqRSxJQUFJLGlCQUFpQixHQUNuQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxZQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hFLElBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ2xCLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQztvQkFDakMsa0JBQWtCLEVBQUUsVUFBVSxDQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN6QztvQkFDRCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztvQkFDdkUsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7b0JBQzdELFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztvQkFDckUsVUFBVSxFQUFFLGFBQWE7aUJBQzFCLENBQUMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLElBQUksaUJBQWlCLEVBQUU7b0JBQ3JCLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQzt3QkFDakMsa0JBQWtCLEVBQUUsVUFBVSxDQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN6Qzt3QkFDRCxtQkFBbUIsRUFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7d0JBQ25ELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQzt3QkFDbkUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO3dCQUNyRSxVQUFVLEVBQUUsYUFBYTtxQkFDMUIsQ0FBQyxDQUFDO2lCQUNKO3FCQUFNO29CQUNMLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQzt3QkFDakMsa0JBQWtCLEVBQUUsVUFBVSxDQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN6Qzt3QkFDRCxtQkFBbUIsRUFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7d0JBQ3BELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO3dCQUM3RCxZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7d0JBQ3JFLFVBQVUsRUFBRSxhQUFhO3FCQUMxQixDQUFDLENBQUM7aUJBQ0o7YUFDRjtRQUNILENBQUMsQ0FBQztRQW9DRix1QkFBa0IsR0FBRyxDQUFDLE9BQThCLEVBQUUsRUFBRTtZQUN0RCxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUE7WUFDakgsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3ZDLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLEtBQUssb0JBQW9CLENBQUMsSUFBSSxDQUFDO1lBQ2xFLElBQUksYUFBYSxHQUNmLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0JBQ3JCLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxPQUFPO2dCQUMvQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQztZQUNuRSxJQUFJLGlCQUFpQixHQUNuQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxZQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hFLElBQUksb0JBQW9CLEdBQ3RCLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO1lBQzFFLElBQUksQ0FBQyxTQUFTLElBQUksY0FBYyxJQUFJLGFBQWEsSUFBSSxpQkFBaUIsRUFBRTtnQkFDdEUsT0FBTztvQkFDTCxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7b0JBQzlELFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztvQkFDaEUsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7aUJBQzdELENBQUM7YUFDSDtZQUNELElBQ0UsQ0FBQyxTQUFTO2dCQUNWLGNBQWM7Z0JBQ2QsYUFBYTtnQkFDYixDQUFDLGlCQUFpQjtnQkFDbEIsQ0FBQyxvQkFBb0IsRUFDckI7Z0JBQ0EsT0FBTztvQkFDTCxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7b0JBQzlELFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO29CQUN0RCxhQUFhLEVBQUUsbUJBQW1CO2lCQUNuQyxDQUFDO2FBQ0g7WUFDRCxJQUFJLG9CQUFvQixFQUFFO2dCQUN4QixPQUFPO29CQUNMLFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztvQkFDbEUsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7aUJBQzFELENBQUM7YUFDSDtZQUNELElBQUksQ0FBQyxjQUFjLElBQUksYUFBYSxFQUFFO2dCQUNwQyxPQUFPO29CQUNMLFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztvQkFDOUQsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7aUJBQ3ZELENBQUM7YUFDSDtZQUNELE9BQU87Z0JBQ0wsUUFBUSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUM5RCxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDekQsYUFBYSxFQUFFLFVBQVU7YUFDMUIsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUNGOzs7O1FBSUE7UUFDQSxrQ0FBNkIsR0FDM0IsQ0FBQyxPQUE4QixFQUFFLEVBQUU7WUFDakMsTUFBTSxVQUFVLEdBQUcsT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDO1lBQzVDLE1BQU0sWUFBWSxHQUFHLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQztZQUNoRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQ3hCLElBQUksT0FBTyxDQUFDLGtCQUFrQixFQUFFLEtBQUssSUFBSSxDQUFDLGVBQWUsRUFBRTtvQkFDekQsT0FBTyxJQUFJLENBQUM7aUJBQ2I7cUJBQ0k7b0JBQ0gsT0FBTyxLQUFLLENBQUM7aUJBQ2Q7YUFDRjtpQkFBTTtnQkFDTCxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFO29CQUNoQyxPQUFPLEtBQUssQ0FBQTtpQkFDYjtnQkFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ2IsSUFBSSxZQUFZLEtBQUssdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO3dCQUMxRyxPQUFPLElBQUksQ0FBQTtxQkFDWjtpQkFDRjtxQkFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7b0JBQ3JCLElBQUksWUFBWSxLQUFLLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLEtBQUssSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDN0csT0FBTyxJQUFJLENBQUE7cUJBQ1o7aUJBQ0Y7Z0JBRUQsT0FBTyxLQUFLLENBQUE7YUFFYjtRQUNILENBQUMsQ0FBQTtRQUVIOzs7O1VBSUU7UUFDRixtQ0FBOEIsR0FDNUIsQ0FBQyxPQUE4QixFQUFFLEVBQUU7WUFDakMsTUFBTSxVQUFVLEdBQUcsT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDO1lBQzVDLE1BQU0sWUFBWSxHQUFHLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQztZQUNoRCxNQUFNLFFBQVEsR0FBRyxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDaEQsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUN4QixJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3pELE9BQU8sSUFBSSxDQUFDO2lCQUNiO3FCQUNJO29CQUNILE9BQU8sS0FBSyxDQUFDO2lCQUNkO2FBQ0Y7aUJBQU07Z0JBQ0wsSUFBSSxPQUFPLENBQUMsa0JBQWtCLEVBQUUsRUFBRTtvQkFDaEMsT0FBTyxLQUFLLENBQUE7aUJBQ2I7Z0JBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNiLElBQUksWUFBWSxLQUFLLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7d0JBQy9JLE9BQU8sSUFBSSxDQUFBO3FCQUNaO3lCQUNJO3dCQUNILE9BQU8sS0FBSyxDQUFDO3FCQUNkO2lCQUNGO3FCQUFNLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtvQkFDckIsSUFBSSxZQUFZLEtBQUssdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRTt3QkFDL0csT0FBTyxJQUFJLENBQUE7cUJBQ1o7eUJBQ0k7d0JBQ0gsT0FBTyxLQUFLLENBQUM7cUJBQ2Q7aUJBQ0Y7Z0JBRUQsT0FBTyxLQUFLLENBQUE7YUFFYjtRQUNILENBQUMsQ0FBQTtRQUVIOzs7O1VBSUU7UUFDRixvQ0FBK0IsR0FDN0IsQ0FBQyxPQUE4QixFQUFFLEVBQUU7WUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFO2dCQUNqQyxPQUFPLEtBQUssQ0FBQTthQUNiO1lBRUQsTUFBTSxVQUFVLEdBQUcsT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDO1lBRTVDLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDYixJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUNyQyxPQUFPLElBQUksQ0FBQTtpQkFDWjthQUNGO2lCQUFNLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDckIsSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRTtvQkFDdkMsT0FBTyxJQUFJLENBQUE7aUJBQ1o7YUFDRjtZQUVELE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQyxDQUFBO1FBRUg7Ozs7VUFJRTtRQUNGLHFDQUFnQyxHQUM5QixDQUFDLE9BQThCLEVBQUUsRUFBRTtZQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUU7Z0JBQ2pDLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFFRCxNQUFNLFVBQVUsR0FBRyxPQUFPLEVBQUUsYUFBYSxFQUFFLENBQUM7WUFDNUMsTUFBTSxRQUFRLEdBQUcsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBRWhELElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDYixJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUN4RSxPQUFPLElBQUksQ0FBQztpQkFDYjthQUNGO2lCQUFNLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDckIsSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRTtvQkFDdkMsT0FBTyxJQUFJLENBQUM7aUJBQ2I7YUFDRjtZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFBO1FBaUNILG9CQUFlLEdBQUcsQ0FBQyxTQUFpQixFQUFFLE9BQVksRUFBRSxFQUFFO1lBQ3BELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzVCLFlBQVksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUN2RSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQztRQUNGLDBDQUFxQyxHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDdEQsTUFBTSxDQUFDLElBQUksQ0FDVCxHQUFHLEdBQUcsYUFBYSxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQ2pELEVBQUUsRUFDRixpQ0FBaUMsQ0FDbEMsQ0FBQztRQUNKLENBQUMsQ0FBQztRQTZFSyxzQkFBaUIsR0FBWSxLQUFLLENBQUM7UUFDbkMsdUJBQWtCLEdBQVksS0FBSyxDQUFDO1FBQ3BDLG1CQUFjLEdBQVcsRUFBRSxDQUFDO1FBQ25DLDBCQUFxQixHQUEwQjtZQUM3QyxhQUFhLEVBQUUsTUFBTTtTQUN0QixDQUFDO1FBZ0JGLG1CQUFjLEdBQUcsR0FBRyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFDL0IsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7Z0JBQzdCLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2FBQzdCO1lBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUM7UUF5SEYsd0JBQW1CLEdBQUcsR0FBRyxFQUFFO1lBQ3pCLElBQUksWUFBWSxHQUFHLElBQUksZUFBZSxDQUFDO2dCQUNyQyxTQUFTLEVBQUUsTUFBTTtnQkFDakIsUUFBUSxFQUFFLE1BQU07Z0JBQ2hCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFlBQVksRUFBRSxHQUFHO2dCQUNqQixVQUFVLEVBQUUsU0FBUztnQkFDckIsU0FBUyxFQUFFLE9BQU87Z0JBQ2xCLFFBQVEsRUFBRSxPQUFPO2dCQUNqQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUNoRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2FBQ2pFLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEUsQ0FBQyxDQUFDO1FBaVJGOzs7V0FHRztRQUNILDBCQUFxQixHQUFHLEdBQUcsRUFBRTtZQUMzQixJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ3RCLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFO29CQUMvQixJQUFJLENBQUMsY0FBYyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztpQkFDaEY7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxzQkFBc0IsRUFBRTt5QkFDekQsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7eUJBQ3BCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO3lCQUNwQixZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt5QkFDMUMsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7eUJBQzlCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtvQkFDcEIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO3dCQUNiLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO3FCQUMvRTt5QkFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7d0JBQ3JCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO3FCQUNsRjtpQkFDRjthQUNGO1lBQ0QsSUFBSSxDQUFDLGNBQWM7aUJBQ2hCLGFBQWEsRUFBRTtpQkFDZixJQUFJLENBQ0gsQ0FBQyxXQUFvQyxFQUFFLEVBQUU7Z0JBQ3ZDLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUN6QyxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FDM0IsQ0FBQyxPQUE4QixFQUFFLENBQUMsRUFBRSxFQUFFO3dCQUNwQyxJQUNFLE9BQU8sQ0FBQyxXQUFXLEVBQUU7NEJBQ3JCLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQ25EOzRCQUNBLE9BQU8sdUJBQXVCLENBQUMseUJBQXlCLENBQ3RELE9BQXVDLENBQ3hDLENBQUM7eUJBQ0g7NkJBQU07NEJBQ0wsT0FBTyxPQUFPLENBQUM7eUJBQ2hCO29CQUNILENBQUMsQ0FDRixDQUFDO2lCQUNIO2dCQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztnQkFDNUIsb0JBQW9CO2dCQUNwQixJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDOUQsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO29CQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMseUJBQXlCLEVBQUU7d0JBQzNELElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO3FCQUNqQztvQkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUN6QixPQUFPO2lCQUNSO2dCQUNELElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUN6QyxJQUNFLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLHNCQUFzQjt3QkFDbEQsSUFBSSxDQUFDLHlCQUF5QixFQUM5Qjt3QkFDQSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztxQkFDakM7b0JBRUQsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztvQkFDckMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO3dCQUNwQixJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FDekIsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQzVDLENBQUM7cUJBQ0g7b0JBQ0QsSUFBSSxXQUFXLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3RELElBQUksVUFBVSxHQUFZLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUU7d0JBQzFELElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLENBQUE7b0JBQzdCLElBQ0UsQ0FBQyxVQUFVO3dCQUNYLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxFQUM3Qjt3QkFDQSwrQkFBK0I7d0JBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFOzRCQUN4QixTQUFTLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FDekMsQ0FBQyxPQUFpQyxFQUFFLEVBQUU7Z0NBQ3BDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUMxQyxDQUFDLENBQXdCLEVBQUUsRUFBRSxDQUMzQixDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssTUFBTSxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUNoRCxDQUFDO2dDQUNGLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFO29DQUNuQixJQUFJLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUM7aUNBQzNDOzRCQUNILENBQUMsQ0FDRixDQUFDO3lCQUNIO3FCQUNGO29CQUNELElBQUksQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUU7d0JBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFOzRCQUN4QixTQUFTLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztpQ0FDOUIsSUFBSSxDQUFDLENBQUMsT0FBaUMsRUFBRSxFQUFFO2dDQUMxQyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FDMUMsQ0FBQyxDQUF3QixFQUFFLEVBQUUsQ0FDM0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLE1BQU0sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FDaEQsQ0FBQztnQ0FDRixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRTtvQ0FDbkIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2lDQUN0Qzs0QkFDSCxDQUFDLENBQUM7aUNBQ0QsS0FBSyxDQUFDLENBQUMsS0FBbUMsRUFBRSxFQUFFO2dDQUM3QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0NBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7aUNBQ3JCOzRCQUNILENBQUMsQ0FBQyxDQUFDO3lCQUNOOzZCQUFNOzRCQUNMLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDOzRCQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3lCQUMxQjtxQkFDRjtvQkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7b0JBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3pCLHlFQUF5RTtvQkFDekUsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxZQUFZLENBQUM7b0JBQ25FLFVBQVUsQ0FBQyxHQUFHLEVBQUU7d0JBQ2QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsU0FBUzs0QkFDckMsSUFBSSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsWUFBWSxHQUFHLGdCQUFnQixDQUFDO29CQUNuRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ1IsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7b0JBQzVCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7b0JBQzlCLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQ25DO3FCQUFNO29CQUNMLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztpQkFDNUI7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUNwQixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7aUJBQzFCO2dCQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0IsQ0FBQyxFQUNELENBQUMsS0FBVSxFQUFFLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUMxQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDekM7Z0JBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMzQixDQUFDLENBQ0Y7aUJBQ0EsS0FBSyxDQUFDLENBQUMsS0FBbUMsRUFBRSxFQUFFO2dCQUM3QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3JCO2dCQUNELElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLElBQUksQ0FBQyxFQUFFO29CQUNsQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7aUJBQzFCO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUM7UUFtREYscUJBQWdCLEdBQUcsR0FBRyxFQUFFO1lBQ3RCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUN6QyxJQUFJLFNBQWlCLENBQUM7WUFDdEIsSUFDRSxJQUFJLENBQUMsYUFBYTtnQkFDbEIsQ0FBQyxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsRUFDdkQ7Z0JBQ0EsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUU7b0JBQy9CLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUMzQixTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztpQkFDaEM7cUJBQU07b0JBQ0wsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQzlDO2dCQUNELElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFO29CQUMvQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJO3dCQUM3QixDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQjs2QkFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7NkJBQzNCLFlBQVksQ0FBQyxTQUFTLENBQUM7NkJBQ3ZCLEtBQUssRUFBRTt3QkFDVixDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQjs2QkFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUM7NkJBQzlCLFlBQVksQ0FBQyxTQUFTLENBQUM7NkJBQ3ZCLEtBQUssRUFBRSxDQUFDO2lCQUNkO3FCQUFNO29CQUNMLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLENBQUMsc0JBQXNCLEVBQUU7eUJBQ3pELFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO3lCQUNwQixRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzt5QkFDcEIsWUFBWSxDQUFDLFNBQVMsQ0FBQzt5QkFDdkIsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7eUJBQzlCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtvQkFDcEIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO3dCQUNiLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztxQkFDekQ7eUJBQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO3dCQUNyQixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7cUJBQzVEO2lCQUNGO2dCQUNELElBQUksQ0FBQyxjQUFjO3FCQUNoQixTQUFTLEVBQUU7cUJBQ1gsSUFBSSxDQUNILENBQUMsV0FBb0MsRUFBRSxFQUFFO29CQUN2QyxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDekMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQzNCLENBQUMsT0FBOEIsRUFBRSxDQUFDLEVBQUUsRUFBRTs0QkFDcEMsSUFDRSxPQUFPLENBQUMsV0FBVyxFQUFFO2dDQUNyQix1QkFBdUIsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUNuRDtnQ0FDQSxPQUFPLHVCQUF1QixDQUFDLHlCQUF5QixDQUN0RCxPQUF1QyxDQUN4QyxDQUFDOzZCQUNIO2lDQUFNO2dDQUNMLE9BQU8sT0FBTyxDQUFDOzZCQUNoQjt3QkFDSCxDQUFDLENBQ0YsQ0FBQztxQkFDSDtvQkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7b0JBQzVCLG9CQUFvQjtvQkFDcEIsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7d0JBQzlELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDekIsT0FBTztxQkFDUjtvQkFDRCxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO3dCQUNyQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7NEJBQ25CLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUN0RCxJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FDekIsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQzVDLENBQUM7NEJBQ0YsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7NEJBQ3pCLElBQ0UsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFO2dDQUN6QixXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFO29DQUNqQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUMzQjtnQ0FDQSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtvQ0FDeEIsU0FBUyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztpQ0FDbkM7cUNBQU07b0NBQ0wsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7b0NBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7aUNBQzFCOzZCQUNGOzRCQUNELElBQ0UsQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFO2dDQUM5QixXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFO29DQUNqQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUMzQjtnQ0FDQSxJQUFJLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0NBQ3pDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOzZCQUN2RDs0QkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7NEJBQzNCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzs0QkFFdEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQzs0QkFDakMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQzs0QkFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt5QkFDMUI7NkJBQU07NEJBQ0wsSUFBSSxXQUFXLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7NEJBQ3RELElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUN6QixXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FDNUMsQ0FBQzs0QkFDRixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQzs0QkFDekIsSUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7Z0NBQ3BDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0NBQ2QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dDQUN4QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7NkJBQ1Q7aUNBQU07Z0NBQ0wsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dDQUN6QyxJQUNFLElBQUksQ0FBQyx1QkFBdUI7b0NBQzVCLElBQUksQ0FBQyx1QkFBdUIsSUFBSSxFQUFFLEVBQ2xDO29DQUNBLFNBQVMsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUM7aUNBQzFDO3FDQUFNO29DQUNMLFNBQVM7d0NBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQzs0Q0FDekIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7NENBQzFCLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7aUNBQy9CO2dDQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUM7Z0NBQ3RDLElBQUksQ0FBQyxlQUFlO29DQUNsQixLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQztnQ0FDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzs2QkFDMUI7NEJBQ0QsSUFDRSxDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUU7Z0NBQzlCLFdBQVcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUU7b0NBQ2pDLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLEVBQzNCO2dDQUNBLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQ0FDekMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7NkJBQ3ZEOzRCQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQzs0QkFDM0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQzs0QkFDakMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQzs0QkFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt5QkFDMUI7cUJBQ0Y7Z0JBQ0gsQ0FBQyxFQUNELENBQUMsS0FBVSxFQUFFLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO29CQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztxQkFDekM7b0JBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDM0IsQ0FBQyxDQUNGO3FCQUNBLEtBQUssQ0FBQyxDQUFDLEtBQW1DLEVBQUUsRUFBRTtvQkFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO3dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUNyQjtvQkFDRCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxJQUFJLENBQUMsRUFBRTt3QkFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO3dCQUMxQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtnQkFDSCxDQUFDLENBQUMsQ0FBQzthQUNOO1FBQ0gsQ0FBQyxDQUFDO1FBQ0YsbUJBQWMsR0FBRyxDQUFDLFFBQWlDLEVBQUUsRUFBRTtZQUNyRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7WUFDN0MsSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2FBQ25DO1lBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDO1FBc2RGOzs7V0FHRztRQUNILHFEQUFxRDtRQUNyRCxJQUFJO1FBQ0o7O1dBRUc7UUFDSCwyQkFBc0IsR0FBRyxDQUFDLE9BQThCLEVBQUUsRUFBRTtZQUMxRCxJQUNFLENBQUMsSUFBSSxDQUFDLGNBQWM7Z0JBQ3BCLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRTtnQkFDN0QsT0FBTyxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsS0FBSyxLQUFLLEVBQy9DO2dCQUNBLFNBQVMsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDcEM7UUFDSCxDQUFDLENBQUM7UUF3RUY7OztXQUdHO1FBQ0gsMkJBQXNCLEdBQUcsQ0FBQyxPQUE4QixFQUFFLEVBQUU7WUFDMUQsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3BCLElBQUksT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUU7Z0JBQ2hDLGtDQUFrQztnQkFDbEMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzFCO2lCQUFNO2dCQUNMLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFO29CQUMzQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO29CQUMvQixJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztpQkFDbkM7Z0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7b0JBQ3BCLElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO3dCQUNwQyxVQUFVLENBQUMsR0FBRyxFQUFFOzRCQUNkLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDeEIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3FCQUNUO3lCQUFNO3dCQUNMLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQzt3QkFDekMsSUFDRSxJQUFJLENBQUMsdUJBQXVCOzRCQUM1QixJQUFJLENBQUMsdUJBQXVCLElBQUksRUFBRSxFQUNsQzs0QkFDQSxTQUFTLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDO3lCQUMxQzs2QkFBTTs0QkFDTCxTQUFTO2dDQUNQLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUM7b0NBQ3pCLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDO29DQUMxQixDQUFDLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO3lCQUMvQjt3QkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDL0IsSUFBSSxDQUFDLGVBQWU7NEJBQ2xCLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsU0FBUyxDQUFDO3dCQUNwRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtpQkFDRjthQUNGO1lBQ0QsSUFBRyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBQztnQkFDL0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2FBQ2xCO1lBQ0QsK0RBQStEO1lBQy9ELElBQ0UsT0FBTyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEtBQUs7Z0JBQ25ELElBQUksQ0FBQyxlQUFlLEVBQ3BCO2dCQUNBLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFDcEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtpQkFBTSxJQUNMLE9BQU8sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsS0FBSyxJQUFJO2dCQUNsRCxJQUFJLENBQUMsZUFBZSxFQUNwQjtnQkFDQSxJQUNFLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLElBQUksQ0FBQyxlQUFlO29CQUNyRCxJQUFJLENBQUMsVUFBVSxFQUNmO29CQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO3dCQUN4QixTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7NEJBQ3RDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3JELENBQUMsQ0FBQyxDQUFDO3FCQUNKO3lCQUFNO3dCQUNMLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO3dCQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtvQkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2lCQUMxQjthQUNGO2lCQUFNO2FBQ047UUFDSCxDQUFDLENBQUM7UUFhRixtQkFBYyxHQUFHLEdBQVEsRUFBRTtZQUN6QixNQUFNLFlBQVksR0FBUSxJQUFJLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFO2lCQUNwRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7aUJBQ3pCLGtCQUFrQixDQUFDLEtBQUssQ0FBQztpQkFDekIsZUFBZSxDQUNkLElBQUksbUJBQW1CLENBQUMsbUJBQW1CLENBQUM7Z0JBQzFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtvQkFDM0IsWUFBWSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNyRSxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQW9CLENBQUMsQ0FBQztnQkFDN0QsQ0FBQztnQkFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFtQyxFQUFFLEVBQUU7b0JBQy9DLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTt3QkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDckI7Z0JBQ0gsQ0FBQzthQUNGLENBQUMsQ0FDSDtpQkFDQSxLQUFLLEVBQUUsQ0FBQztZQUNYLE9BQU8sWUFBWSxDQUFDO1FBQ3RCLENBQUMsQ0FBQztRQXlCRiwrQkFBMEIsR0FBRyxHQUFHLEVBQUU7WUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZCO1lBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDM0IsU0FBUyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNwRCxTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQ2pDLENBQUMsQ0FBQztRQW9GRjs7O1dBR0c7UUFDSDs7O1dBR0c7UUFDSCxrQkFBYSxHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQ2pELElBQUk7Z0JBQ0YsSUFDRSxJQUFJLENBQUMsS0FBSztvQkFDVixPQUFPLENBQUMsZUFBZSxFQUFFO3dCQUN6Qix1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLO29CQUNqRCxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFDakQ7b0JBQ0EsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNuQztxQkFBTSxJQUNMLElBQUksQ0FBQyxJQUFJO29CQUNULE9BQU8sQ0FBQyxlQUFlLEVBQUU7d0JBQ3pCLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLElBQUk7b0JBQ2hELElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLEtBQUssT0FBTyxDQUFDLGFBQWEsRUFBRTtvQkFDdkQsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQ3JEO29CQUNBLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDbkM7cUJBQU0sSUFDTCxJQUFJLENBQUMsSUFBSTtvQkFDVCxPQUFPLENBQUMsZUFBZSxFQUFFO3dCQUN6Qix1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJO29CQUNoRCxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxLQUFLLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUU7b0JBQzdELE9BQU8sQ0FBQyxhQUFhLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUMvQztvQkFDQSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ25DO2FBQ0Y7WUFBQyxPQUFPLEtBQVUsRUFBRTtnQkFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQ3pDO2FBQ0Y7UUFDSCxDQUFDLENBQUM7UUFFRiw2QkFBd0IsR0FBRyxDQUFDLE9BQXFDLEVBQUUsRUFBRTtZQUNuRSxJQUFJLElBQUksQ0FBQyxZQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNoRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUNqQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQ1MsQ0FBQztnQkFDbEMsSUFBSSxPQUFPLEVBQUU7b0JBQ1gsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFO3dCQUM5RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQzdDLE9BQXdDLENBQUMsZUFBZSxDQUN2RCxXQUFXLENBQ1osQ0FBQzt3QkFDRixJQUFJLENBQUMsbUJBQW1CLENBQ3RCLHVCQUF1QixDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUMzRCxDQUFDO3FCQUNIO2lCQUNGO2FBQ0Y7UUFDSCxDQUFDLENBQUM7UUFFRjs7O1dBR0c7UUFDSCx3QkFBbUIsR0FBRyxDQUFDLE9BQThCLEVBQUUsRUFBRTtZQUN2RCxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3BDLHlEQUF5RDtZQUN6RCxJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUNwQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FDckMsQ0FBQztZQUNGLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUNuQixJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztnQkFDeEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtZQUNELHlCQUF5QjtZQUN6QiwwQkFBMEI7WUFDMUIsMkNBQTJDO1lBQzNDLGVBQWU7WUFDZiw0Q0FBNEM7WUFDNUMsT0FBTztZQUNQLDhCQUE4QjtZQUM5QixJQUFJO1FBQ04sQ0FBQyxDQUFDO1FBa0RGOzs7V0FHRztRQUNILGlDQUE0QixHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQ2hFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNwQix3Q0FBd0M7WUFDeEMsSUFBSSxPQUFPLENBQUMsa0JBQWtCLEVBQUUsRUFBRTtnQkFDaEMsa0NBQWtDO2dCQUNsQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDMUI7aUJBQU07Z0JBQ0wsSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUU7b0JBQzNDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7b0JBQy9CLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2lCQUNuQztnQkFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFDcEIsSUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7d0JBQ3BDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7NEJBQ2QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUN4QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ1Q7eUJBQU07d0JBQ0wsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO3dCQUN6QyxJQUNFLElBQUksQ0FBQyx1QkFBdUI7NEJBQzVCLElBQUksQ0FBQyx1QkFBdUIsSUFBSSxFQUFFLEVBQ2xDOzRCQUNBLFNBQVMsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUM7eUJBQzFDOzZCQUFNOzRCQUNMLFNBQVM7Z0NBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQztvQ0FDekIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7b0NBQzFCLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7eUJBQy9CO3dCQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUMvQixJQUFJLENBQUMsZUFBZTs0QkFDbEIsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxTQUFTLENBQUM7d0JBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7cUJBQzFCO2lCQUNGO2FBQ0Y7WUFDRCxJQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFDO2dCQUMvQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7YUFDbEI7WUFDRCwrREFBK0Q7WUFDL0QsSUFDRSxPQUFPLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLEtBQUssS0FBSztnQkFDbkQsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUNyQjtnQkFDQSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ3BCLHlGQUF5RjthQUMxRjtpQkFBTSxJQUNMLE9BQU8sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsS0FBSyxJQUFJO2dCQUNsRCxJQUFJLENBQUMsZUFBZTtnQkFDcEIsSUFBSSxDQUFDLFVBQVUsRUFDZjtnQkFDQSxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO3dCQUN4QixTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7NEJBQ3RDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3JELENBQUMsQ0FBQyxDQUFDO3FCQUNKO3lCQUFNO3dCQUNMLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO3dCQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtpQkFDRjthQUNGO2lCQUFNO2FBQ047WUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQztRQXNCRjs7Ozs7V0FLRztRQUNILHNCQUFpQixHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQ3JELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqRCxJQUFJLE1BQU0sR0FBRztnQkFDWCxjQUFjLEVBQ1osSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU07b0JBQy9DLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztvQkFDMUIsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxDQUFDLG9CQUFvQixDQUFDO3dCQUN0RCxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7d0JBQ3JDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUs7d0JBQzlCLFNBQVM7cUJBQ1YsQ0FBQzthQUNQLENBQUM7WUFFRixJQUFJLGNBQWMsR0FBa0MsTUFBTSxDQUFDLGNBQWMsQ0FBQztZQUMxRSxJQUFJLGdCQUF5QyxDQUFDO1lBQzlDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUN6QixJQUFJLHFCQUFrRCxDQUFDO2dCQUN2RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDOUMsSUFBSSxjQUFjLENBQUMsQ0FBQyxDQUFDLFlBQVksMEJBQTBCLEVBQUU7d0JBQzNELHFCQUFxQixHQUFHLGNBQWMsQ0FDcEMsQ0FBQyxDQUM0QixDQUFDO3dCQUNoQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzFDLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUMsTUFBTSxFQUFFOzRCQUN0QyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FDaEQsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQzVCLENBQUM7eUJBQ0g7d0JBQ0QscUJBQXFCLENBQUMsZUFBZSxDQUNuQywyQkFBMkIsQ0FBQyxlQUFlLEVBQUcsQ0FDL0MsQ0FBQzt3QkFDRixJQUFJLGdCQUFnQixFQUFFOzRCQUNwQixNQUFNO3lCQUNQO3FCQUNGO29CQUNELElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxZQUFZLHNCQUFzQixFQUFFO3dCQUN2RCxnQkFBZ0IsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUEyQixDQUFDO3dCQUMvRCxJQUFJLHFCQUFxQixFQUFFOzRCQUN6QixNQUFNO3lCQUNQO3FCQUNGO2lCQUNGO2dCQUNELElBQUksQ0FBQyxxQkFBcUIsRUFBRTtvQkFDMUIscUJBQXFCO3dCQUNuQixnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQzs0QkFDeEQsT0FBTzs0QkFDUCxHQUFHLE1BQU07NEJBQ1QsU0FBUzs0QkFDVCxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLO3lCQUMvQixDQUFDLENBQUM7b0JBQ0wsY0FBYyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2lCQUM1QzthQUNGO2lCQUFNO2dCQUNMLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM5QyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUMsWUFBWSxzQkFBc0IsRUFBRTt3QkFDdkQsZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBMkIsQ0FBQzt3QkFDL0QsTUFBTTtxQkFDUDtpQkFDRjthQUNGO1lBRUQsSUFBSSxDQUFDLGdCQUFnQixFQUFFO2dCQUNyQixnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztvQkFDdEUsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSztvQkFDOUIsU0FBUztpQkFDVixDQUFDLENBQUM7Z0JBQ0gsY0FBYyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2FBQ3ZDO1lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzlDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkQsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN2QztZQUVELE9BQU8sY0FBYyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztRQXFHRixpQkFBaUI7UUFDakIsZUFBVSxHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQzlDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNuQixJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUM5QztZQUNELElBQ0UsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFO2dCQUNyQixJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUU7Z0JBQzdELElBQUksQ0FBQyxVQUFVLEVBQ2Y7Z0JBQ0EsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2FBQ3ZCO1lBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQzthQUM1QjtZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFM0IsQ0FBQyxDQUFDO1FBQ0Y7OztXQUdHO1FBQ0gsa0JBQWEsR0FBRyxDQUFDLE1BQTZCLEVBQUUsRUFBRTtZQUNoRCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsSUFDRSxDQUFDLElBQUksQ0FBQyxlQUFlO2dCQUNyQixNQUFNLENBQUMsaUJBQWlCO2dCQUN4QixNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLEVBQ2pDO2dCQUNBLElBQUksR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDakQ7WUFDRCxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUM7UUFxREY7OztXQUdHO1FBQ0gsa0JBQWEsR0FBRyxDQUFDLE1BQTZCLEVBQUUsRUFBRTtZQUNoRCxzQkFBc0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO2dCQUMxQyxPQUFPLEVBQUUsTUFBTTtnQkFDZixNQUFNLEVBQUUsYUFBYSxDQUFDLFVBQVU7YUFDakMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBUUYsa0JBQWEsR0FBRyxDQUFDLE9BQThCLEVBQUUsRUFBRTtZQUNqRCxJQUFJO2dCQUNGLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUMxQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FDMUMsQ0FBQztnQkFDRixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRTtvQkFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUMzQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2lCQUMxQjthQUNGO1lBQUMsT0FBTyxLQUFVLEVBQUU7Z0JBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUN6QzthQUNGO1FBQ0gsQ0FBQyxDQUFDO1FBd0NGLGtCQUFhLEdBQUcsQ0FBQyxPQUE4QixFQUFFLEVBQUU7WUFDakQsSUFBSTtnQkFDRixJQUFJLFNBQVMsR0FBUSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3JDLFNBQVMsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDO3FCQUMvQixJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUUsRUFBRTtvQkFDdkIsc0JBQXNCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUM3RCwyQkFBMkI7Z0JBQzdCLENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsQ0FBQyxLQUFtQyxFQUFFLEVBQUU7b0JBQzdDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTt3QkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDckI7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7YUFDTjtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDekM7YUFDRjtRQUNILENBQUMsQ0FBQztRQUNGLG1CQUFjLEdBQUcsR0FBRyxFQUFFO1lBQ3BCLElBQUk7Z0JBQ0YsVUFBVSxDQUFDLEdBQUcsRUFBRTtvQkFDZCxJQUFJLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUM7d0JBQ3BDLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxZQUFZO3dCQUNoRCxJQUFJLEVBQUUsQ0FBQztxQkFDUixDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzNCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUNSO1lBQUMsT0FBTyxLQUFVLEVBQUU7Z0JBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUN6QzthQUNGO1FBQ0gsQ0FBQyxDQUFDO1FBbUJGOzs7O1dBSUc7UUFFSCwyQkFBc0IsR0FBRyxDQUFDLE9BQThCLEVBQUUsRUFBRTtZQUMxRCxJQUFJO2dCQUNGLElBQUksV0FBVyxHQUE0QixDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUNwQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUNsRCxDQUFDO2dCQUNGLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFO29CQUNuQixNQUFNLFVBQVUsR0FBMEIsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNsRSwwREFBMEQ7b0JBQzFELHVDQUF1QztvQkFDdkMsU0FBUztvQkFDVCwyQ0FBMkM7b0JBQzNDLG9EQUFvRDtvQkFDcEQsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQztpQkFDdEM7Z0JBQ0QsMkJBQTJCO2FBQzVCO1lBQUMsT0FBTyxLQUFVLEVBQUU7Z0JBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUN6QzthQUNGO1FBQ0gsQ0FBQyxDQUFDO1FBOEpGLG9CQUFlLEdBQUcsR0FBRyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1lBQzVCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUM7UUFFRiw2QkFBd0IsR0FBRyxHQUFHLEVBQUU7WUFDOUIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztZQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQztRQXdCRixjQUFTLEdBQUcsQ0FBQyxLQUFVLEVBQUUsRUFBRTtZQUN6QixJQUFJLEtBQUssR0FBVyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQztZQUN6QyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUN6QyxLQUFLLEVBQ0wsSUFBSSxDQUFDLGlCQUFrQixFQUN2QixJQUFJLENBQUMsT0FBTyxFQUNaLElBQUksQ0FBQyxzQkFBc0IsRUFDM0IsSUFBSSxDQUFDLHVCQUF1QixDQUM3QixDQUFDO2dCQUNGLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzthQUN4QjtRQUNILENBQUMsQ0FBQztRQUNGLDRCQUF1QixHQUFHLENBQUMsS0FBVSxFQUFFLEVBQUU7WUFDdkMsSUFBSSxLQUFLLEdBQVcsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUM7WUFDekMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7WUFDckMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQztRQW9JRjs7V0FFRztRQUNILHVCQUFrQixHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQ3RELElBQUksVUFBVSxHQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7WUFDMUUsSUFBSSxhQUFhLEdBQ2YsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDakUsT0FBTztnQkFDTCxTQUFTLEVBQ1AsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQzVGLFFBQVEsRUFDTixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCO29CQUN2QyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztnQkFDekQsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLE9BQU87YUFDakIsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUNGLG1CQUFjLEdBQUcsR0FBRyxFQUFFO1lBQ3BCLE9BQU87Z0JBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNO2dCQUNwQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7YUFDN0MsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUNGLDBCQUFxQixHQUFHLEdBQUcsRUFBRTtZQUMzQixPQUFPO2dCQUNMLEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSzthQUNuQyxDQUFDO1FBQ0osQ0FBQyxDQUFDO1FBQ0YsZUFBVSxHQUFHLEdBQUcsRUFBRTtZQUNoQixPQUFPO2dCQUNMLFFBQVEsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCO2dCQUNsRCxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQjthQUNyRCxDQUFDO1FBQ0osQ0FBQyxDQUFDO1FBQ0Ysa0NBQTZCLEdBQUcsR0FBRyxFQUFFO1lBQ25DLE9BQU87Z0JBQ0wsUUFBUSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7Z0JBQ2xELFNBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7YUFDN0MsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUVGLGtDQUE2QixHQUFHLEdBQUcsRUFBRTtZQUNuQyxPQUFPO2dCQUNMLFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO2dCQUNsRCxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2FBQzdDLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRixlQUFVLEdBQUcsR0FBRyxFQUFFO1lBQ2hCLE9BQU87Z0JBQ0wsUUFBUSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0I7Z0JBQ2xELFNBQVMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CO2FBQ3JELENBQUM7UUFDSixDQUFDLENBQUM7UUFDRixpQkFBWSxHQUFHO1lBQ2IsUUFBUSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlO1NBQ2pELENBQUM7UUFDRiw4QkFBeUIsR0FBRyxHQUFHLEVBQUU7WUFDL0IsT0FBTztnQkFDTCxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2FBQzVDLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRiw4QkFBeUIsR0FBRyxHQUFHLEVBQUU7WUFDL0IsT0FBTztnQkFDTCxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2FBQzVDLENBQUM7UUFDSixDQUFDLENBQUM7UUFDRiw0QkFBdUIsR0FBRyxDQUFDLE9BQXlCLEVBQUUsRUFBRTtZQUN0RCxJQUFJLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQztnQkFDaEMsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLEtBQUssRUFBRSxNQUFNO2dCQUNiLE1BQU0sRUFBRSxNQUFNO2dCQUNkLE1BQU0sRUFBRSxNQUFNO2dCQUNkLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUMvRCxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDN0QsY0FBYyxFQUFFLE9BQU87Z0JBQ3ZCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQzthQUN2RSxDQUFDLENBQUM7WUFDSCxJQUFJLGFBQWEsR0FBRyxJQUFJLGFBQWEsQ0FBQztnQkFDcEMsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLGdCQUFnQixFQUFFLGFBQWE7Z0JBQy9CLFlBQVksRUFBRSxHQUFHO2dCQUNqQixTQUFTLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7Z0JBQy9ELFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO2dCQUN2RCxNQUFNLEVBQUUsTUFBTTtnQkFDZCxjQUFjLEVBQUUsRUFBRTtnQkFDbEIsZUFBZSxFQUFFLGFBQWE7YUFDL0IsQ0FBQyxDQUFDO1lBRUgsSUFBSSxhQUFhLEdBQUcsSUFBSSxhQUFhLENBQUM7Z0JBQ3BDLE1BQU0sRUFBRSxNQUFNO2dCQUNkLEtBQUssRUFBRSxNQUFNO2dCQUNiLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFlBQVksRUFBRSxHQUFHO2dCQUNqQixVQUFVLEVBQUUsYUFBYTtnQkFDekIsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO2dCQUN0RSxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDMUQsV0FBVyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUNqRSxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDekQsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQy9ELHlCQUF5QixFQUFFLGFBQWE7Z0JBQ3hDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQ3JFLG9CQUFvQixFQUFFLFVBQVUsQ0FDOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDN0M7Z0JBQ0QsMEJBQTBCLEVBQUUsYUFBYTtnQkFDekMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUNuRSxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDM0QsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7Z0JBQ3pFLGlCQUFpQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQzlELG9CQUFvQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQ2pFLG1CQUFtQixFQUFFLFVBQVUsQ0FDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FDMUM7YUFDRixDQUFDLENBQUM7WUFDSCxJQUFJLGFBQWEsR0FBRyxJQUFJLGFBQWEsQ0FBQztnQkFDcEMsVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLE1BQU0sRUFBRSxhQUFhO2dCQUNyQixLQUFLLEVBQUUsTUFBTTtnQkFDYixNQUFNLEVBQUUsTUFBTTtnQkFDZCxZQUFZLEVBQUUsR0FBRztnQkFDakIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDN0QsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDN0QsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDakUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDbEUsaUJBQWlCLEVBQUUsVUFBVSxDQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUM3QztnQkFDRCxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDMUQsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO2dCQUN0RSxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDN0QsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQzlELFVBQVUsRUFBRSxNQUFNO2dCQUNsQixnQkFBZ0IsRUFBRSxLQUFLO2dCQUN2QixhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDMUQsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO2dCQUNyRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO2dCQUM5RCxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztnQkFDekUsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQzNELGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQzthQUNwRSxDQUFDLENBQUM7WUFDSCxJQUFJLGNBQWMsR0FBRyxJQUFJLGNBQWMsQ0FBQztnQkFDdEMsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0JBQ3pELE1BQU0sRUFBRSxhQUFhO2dCQUNyQixLQUFLLEVBQUUsTUFBTTtnQkFDYixTQUFTLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7Z0JBQ25FLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO2dCQUN2RCxZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7Z0JBQ3RFLGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUM3RCxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtnQkFDNUQsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLFlBQVksRUFBRSxLQUFLO2FBQ3BCLENBQUMsQ0FBQztZQUNILE9BQU8sSUFBSSxvQkFBb0IsQ0FBQztnQkFDOUIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLGFBQWEsRUFBRSxhQUFhO2dCQUM1QixjQUFjLEVBQUUsY0FBYztnQkFDOUIsaUJBQWlCLEVBQUUsYUFBYTtnQkFDaEMscUJBQXFCLEVBQUUsYUFBYTtnQkFDcEMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtnQkFDaEUsVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLEtBQUssRUFBRSxNQUFNO2dCQUNiLE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtnQkFDckUsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUMvRCx1QkFBdUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUN2RSxtQkFBbUIsRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRTtnQkFDaEYseUJBQXlCLEVBQUUsS0FBSztnQkFDaEMsK0JBQStCLEVBQzdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0JBQy9DLDJCQUEyQixFQUFFLGFBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFO2dCQUMxRixpQ0FBaUMsRUFBRSxLQUFLO2dCQUN4Qyw4QkFBOEIsRUFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDaEQsNkJBQTZCLEVBQUUsVUFBVSxDQUN2QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN6QztnQkFDRCxzQkFBc0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO2dCQUNwRSxxQkFBcUIsRUFBRSxVQUFVLENBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQ3pDO2dCQUNELGdDQUFnQyxFQUFFLGFBQWE7Z0JBQy9DLDRCQUE0QixFQUFFLE1BQU07Z0JBQ3BDLGtDQUFrQyxFQUFFLEdBQUc7Z0JBQ3ZDLDJCQUEyQixFQUN6QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUNoRCwwQkFBMEIsRUFBRSxVQUFVLENBQ3BDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQzVDO2dCQUNELHdCQUF3QixFQUFFLGFBQWE7Z0JBQ3ZDLG9CQUFvQixFQUFFLE1BQU07Z0JBQzVCLDBCQUEwQixFQUFFLEdBQUc7Z0JBQy9CLG1CQUFtQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBQ2pFLGtCQUFrQixFQUFFLFVBQVUsQ0FDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FDNUM7Z0JBQ0QsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDcEUsc0JBQXNCLEVBQUUsVUFBVSxDQUNoQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN6QztnQkFDRCxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtnQkFDMUQsYUFBYSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUNuRSxtQkFBbUIsRUFBRTtvQkFDbkIsVUFBVSxFQUFFLE1BQU07b0JBQ2xCLFNBQVMsRUFBRSxNQUFNO29CQUNqQixjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtvQkFDM0QsY0FBYyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO29CQUNuRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7b0JBQ2xFLE1BQU0sRUFBRSxNQUFNO29CQUNkLFlBQVksRUFBRSxLQUFLO29CQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtvQkFDeEQsS0FBSyxFQUFFLE1BQU07b0JBQ2IsT0FBTyxFQUFFLE1BQU07b0JBQ2YsY0FBYyxFQUFFLFFBQVE7b0JBQ3hCLE9BQU8sRUFBRSxLQUFLO2lCQUNmO2dCQUNELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUM3RCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUNqRSxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztnQkFDckUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDN0QsZUFBZSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO2dCQUN6RSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUNqRSxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztnQkFDekUsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQzNELGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztnQkFDcEUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDN0QsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDN0QsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7YUFDM0QsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBMEVGOzs7O1dBSUc7UUFFSCwwQkFBcUIsR0FBSSxDQUN2QixRQUE0QixFQUM1QixPQUE4QixFQUN4QixFQUFFO1lBQ1IsSUFBSSxRQUFRLEVBQUUsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDdEUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDdkQ7UUFDSCxDQUFDLENBQUM7UUFDRjs7OztXQUlHO1FBQ0gsdUJBQWtCLEdBQUcsQ0FDbkIsUUFBaUMsRUFDakMsT0FBOEIsRUFDOUIsRUFBRTtZQUNGLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxhQUFhLENBQUM7WUFDOUQsSUFBSSxZQUFZLEVBQUU7Z0JBQ2hCLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDakM7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDdkQ7UUFDSCxDQUFDLENBQUM7UUEwQ0Y7Ozs7V0FJRztRQUNILHVCQUFrQixHQUFHLENBQUMsT0FBOEIsRUFBRSxFQUFFO1lBQ3RELGtEQUFrRDtZQUNsRCxNQUFNLFNBQVMsR0FBRztnQkFDaEIsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLEdBQUcsRUFBRSxLQUFLO2dCQUNWLE9BQU8sRUFBRSxLQUFLO2FBQ2YsQ0FBQztZQUVGLG9DQUFvQztZQUNwQyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDdkMsT0FBTztvQkFDTCxHQUFHLFNBQVM7b0JBQ1osY0FBYyxFQUFFLFFBQVE7b0JBQ3hCLE1BQU0sRUFBRSxhQUFhO29CQUNyQixZQUFZLEVBQUUsTUFBTTtvQkFDcEIsT0FBTyxFQUFFLFNBQVM7b0JBQ2xCLFVBQVUsRUFBRSxLQUFLO29CQUNqQixRQUFRLEVBQUUsVUFBVTtvQkFDcEIsU0FBUyxFQUFFLE9BQU87b0JBQ2xCLFdBQVcsRUFBRSxLQUFLO29CQUNsQixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7b0JBQ2hFLEtBQUssRUFBRSxhQUFhO29CQUNwQixTQUFTLEVBQUUsVUFBVTtvQkFDckIsWUFBWSxFQUFFLEtBQUs7aUJBQ3BCLENBQUM7YUFDSDtZQUVELG9DQUFvQztZQUNwQyxPQUFPO2dCQUNMLEdBQUcsU0FBUztnQkFDWixjQUFjLEVBQUUsVUFBVTtnQkFDMUIsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLE9BQU8sRUFBRSxpQkFBaUI7YUFDM0IsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUNGLGlCQUFZLEdBQUcsR0FBRyxFQUFFO1lBQ2xCLE9BQU87Z0JBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNO2dCQUNwQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUs7Z0JBQ2xDLFVBQVUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtnQkFDNUMsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNO2dCQUNwQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVk7YUFDakQsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUNGLGNBQVMsR0FBRyxHQUFHLEVBQUU7WUFDZixPQUFPO2dCQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU07YUFDN0MsQ0FBQztRQUNKLENBQUMsQ0FBQztRQWlCRjs7O1dBR0c7UUFDSCwrQkFBMEIsR0FBRyxHQUFHLEVBQUU7WUFDaEMsT0FBTztnQkFDTCxZQUFZLEVBQUUsTUFBTTtnQkFDcEIsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsVUFBVSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSwyQkFBMkI7Z0JBQzlELEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsMEJBQTBCO2dCQUN4RCxJQUFJLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLHlCQUF5QjtnQkFDdEQsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsY0FBYyxFQUFFLFFBQVE7Z0JBQ3hCLFVBQVUsRUFBRSxRQUFRO2FBQ3JCLENBQUM7UUFDSixDQUFDLENBQUM7SUExMklFLENBQUM7SUFDTCxXQUFXLENBQUMsT0FBc0I7UUFDaEMsSUFBSTtZQUNGLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7YUFDekI7WUFFRCxJQUNFLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pELE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsRUFDMUQ7Z0JBQ0EsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztnQkFDckMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztnQkFFckMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO2dCQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO29CQUN0QixTQUFTLENBQUMsZUFBZSxFQUFFO3lCQUN4QixJQUFJLENBQUMsQ0FBQyxJQUEyQixFQUFFLEVBQUU7d0JBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBc0IsQ0FBQztvQkFDN0MsQ0FBQyxDQUFDO3lCQUNELEtBQUssQ0FBQyxDQUFDLEtBQW1DLEVBQUUsRUFBRTt3QkFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFOzRCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO3lCQUNyQjtvQkFDSCxDQUFDLENBQUMsQ0FBQztpQkFDTjtnQkFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNiLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQzt3QkFDN0QsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7cUJBQzdCO3lCQUFNO3dCQUNMLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQW9CLEVBQUUsRUFBRTs0QkFDekQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7NEJBQ2pCLElBQUksQ0FBQyxJQUFJLEdBQUcsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDOzRCQUM3RCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDOUIsQ0FBQyxDQUFDLENBQUM7cUJBQ0o7aUJBQ0Y7cUJBQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO29CQUNyQixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7d0JBQ3RDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzt3QkFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7d0JBQzlELElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO3FCQUM3Qjt5QkFBTTt3QkFDTCxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFzQixFQUFFLEVBQUU7NEJBQzdELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDOzRCQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQzs0QkFDOUQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7d0JBQzlCLENBQUMsQ0FBQyxDQUFDO3FCQUNKO2lCQUNGO2dCQUNELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzthQUN2QjtTQUNGO1FBQUMsT0FBTyxLQUFVLEVBQUU7WUFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDekM7U0FDRjtJQUNILENBQUM7SUFDRCxXQUFXLENBQ1QsT0FBOEIsRUFDOUIsVUFBa0IsRUFDbEIsWUFBb0I7UUFFcEIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUNsRSxNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxXQUFXLENBQzFDLFVBQVUsRUFDVCxPQUFpQyxDQUFDLE9BQU8sRUFBRSxFQUM1QyxZQUFZLENBQ2IsQ0FBQztZQUNGLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3JDLGNBQWMsQ0FBQyxlQUFlLENBQUMsVUFBbUMsQ0FBQztxQkFDaEUsSUFBSSxDQUFDLENBQUMsT0FBOEIsRUFBRSxFQUFFO29CQUN2QyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ25CLENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsQ0FBQyxHQUFpQyxFQUFFLEVBQUU7b0JBQzNDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLE1BQU0sWUFBWSxHQUFJLE9BQWUsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sVUFBVSxHQUFHLElBQUksU0FBUyxDQUFDLFlBQVksQ0FDM0MsVUFBVSxFQUNWLEVBQUUsRUFDRixPQUFPLENBQUMsT0FBTyxFQUFFLEVBQ2pCLFlBQVksQ0FDYixDQUFDO1lBQ0YsSUFBSSxVQUFVLEdBQUcsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3hELFVBQVUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDckMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLFVBQW9DLENBQUM7cUJBQ2xFLElBQUksQ0FBQyxDQUFDLE9BQThCLEVBQUUsRUFBRTtvQkFDdkMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNuQixDQUFDLENBQUM7cUJBQ0QsS0FBSyxDQUFDLENBQUMsR0FBaUMsRUFBRSxFQUFFO29CQUMzQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQVlELGtCQUFrQixDQUFDLE9BQThCO1FBQy9DLElBQ0UsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3BCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUMxRDtZQUNBLE9BQU8sUUFBUSxDQUFDLDBCQUEwQixDQUFDLENBQUM7U0FDN0M7YUFBTTtZQUNMLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssUUFBUSxDQUNsRCxzQkFBc0IsQ0FDdkIsRUFBRSxDQUFDO1NBQ0w7SUFDSCxDQUFDO0lBSUQsV0FBVztRQUNULElBQUksQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7UUFDckMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztRQUVyQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMzQixJQUFJO1lBQ0YsNEJBQTRCO1lBQzVCLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDcEQsU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNsRCxTQUFTLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUE7WUFDN0QsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUMzQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDM0MsSUFBSSxDQUFDLHdCQUF3QixFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUM1QyxJQUFJLENBQUMscUJBQXFCLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQy9DLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsa0NBQWtDLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDdkQsSUFBSSxDQUFDLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsV0FBVyxFQUFFLENBQUM7U0FDaEQ7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUN6QztTQUNGO1FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNILGlCQUFpQjtRQUNmLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxjQUFjLElBQUksRUFBRSxDQUFDO1FBQ3pFLE9BQU8sSUFBSSxjQUFjLENBQUM7WUFDeEIsTUFBTSxFQUFFLGNBQWMsRUFBRSxNQUFNLElBQUksYUFBYTtZQUMvQyxLQUFLLEVBQUUsY0FBYyxFQUFFLEtBQUssSUFBSSxhQUFhO1lBQzdDLE1BQU0sRUFBRSxjQUFjLEVBQUUsTUFBTSxJQUFJLE1BQU07WUFDeEMsWUFBWSxFQUFFLGNBQWMsRUFBRSxZQUFZLElBQUksR0FBRztZQUNqRCxVQUFVLEVBQUUsY0FBYyxFQUFFLFVBQVUsSUFBSSxhQUFhO1lBQ3ZELHdCQUF3QixFQUN0QixjQUFjLEVBQUUsd0JBQXdCO2dCQUN4QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQ2pELGtCQUFrQixFQUNoQixjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQ2pELGNBQWMsRUFDWixjQUFjLEVBQUUsY0FBYztnQkFDOUIsYUFBYSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEVBQUU7WUFDL0Qsb0JBQW9CLEVBQ2xCLGNBQWMsRUFBRSxvQkFBb0I7Z0JBQ3BDLGFBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQ2hFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxvQkFBb0IsSUFBSSxNQUFNO1lBQ3BFLDRCQUE0QixFQUMxQixjQUFjLEVBQUUsNEJBQTRCO2dCQUM1QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQzdDLDJCQUEyQixFQUN6QixjQUFjLEVBQUUsMkJBQTJCO2dCQUMzQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztZQUN6RCxxQkFBcUIsRUFDbkIsY0FBYyxFQUFFLHFCQUFxQjtnQkFDckMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDekQsc0JBQXNCLEVBQ3BCLGNBQWMsRUFBRSxzQkFBc0I7Z0JBQ3RDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDN0MsaUJBQWlCLEVBQ2YsY0FBYyxFQUFFLGlCQUFpQixJQUFJLGlDQUFpQztZQUN4RSxpQkFBaUIsRUFDZixjQUFjLEVBQUUsaUJBQWlCO2dCQUNqQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztTQUMzRCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBSUQsYUFBYSxDQUFDLEVBQVU7UUFDdEIsSUFBSSxZQUFvQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFrQixFQUFFLEVBQUU7WUFDbkQsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxFQUFFO2dCQUNoQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQThERCxlQUFlLENBQUMsYUFBb0M7UUFDbEQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztRQUNoQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUtELG9CQUFvQixDQUFDLGFBQW9DO1FBQ3ZELGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBQ0QsY0FBYyxDQUFDLEVBQW1CO1FBQ2hDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDbkIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3RDO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUNELFlBQVksQ0FBQyxPQUE4QjtRQUN6QyxJQUFJLHVCQUF1QixHQUFRLE9BQU8sQ0FBQztRQUMzQyxJQUNFLHVCQUF1QjtZQUN2Qix1QkFBdUIsRUFBRSxJQUFJLEVBQUUsUUFBUTtZQUN2Qyx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUN2QywyQkFBMkIsQ0FBQyxrQkFBa0IsQ0FDN0MsRUFDRDtZQUNBLE9BQU8sdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FDMUMsMkJBQTJCLENBQUMsa0JBQWtCLENBQy9DLENBQUM7U0FDSDthQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUM7SUFxREQsa0JBQWtCLENBQUMsT0FBaUMsRUFBRSxFQUFVO1FBQzlELE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUErQixFQUFFLEVBQUU7WUFDbkQsUUFBUSxPQUFPLENBQUMsRUFBRSxFQUFFO2dCQUNsQixLQUFLLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxhQUFhO29CQUN0RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDcEIsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO3FCQUN2QztvQkFDRCxNQUFNO2dCQUNSLEtBQUssdUJBQXVCLENBQUMsYUFBYSxDQUFDLFdBQVc7b0JBQ3BELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO3dCQUNwQixPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7cUJBQ3JDO29CQUNELE1BQU07Z0JBQ1IsS0FBSyx1QkFBdUIsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCO29CQUN6RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDcEIsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7cUJBQ3pDO29CQUNELE1BQU07Z0JBQ1IsS0FBSyx1QkFBdUIsQ0FBQyxhQUFhLENBQUMsV0FBVztvQkFDcEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7d0JBQ3BCLE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztxQkFDckM7b0JBQ0QsTUFBTTtnQkFDUixLQUFLLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxjQUFjO29CQUN2RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFFLE9BQWUsQ0FBQyxVQUFVLEVBQUU7d0JBQ3BELE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO3FCQUMxQztvQkFDRCxNQUFNO2dCQUNSLEtBQUssdUJBQXVCLENBQUMsYUFBYSxDQUFDLGFBQWE7b0JBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO3dCQUNwQixPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7cUJBQ3ZDO29CQUNELE1BQU07Z0JBQ1IsS0FBSyx1QkFBdUIsQ0FBQyxhQUFhLENBQUMsb0JBQW9CO29CQUM3RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDcEIsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUM7cUJBQ2pEO29CQUNELE1BQU07Z0JBQ1IsS0FBSyx1QkFBdUIsQ0FBQyxhQUFhLENBQUMsa0JBQWtCO29CQUMzRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDcEIsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUM7cUJBQzVDO29CQUNELE1BQU07Z0JBQ1I7b0JBQ0UsTUFBTTthQUNUO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsaUJBQWlCLENBQ2YsU0FBZ0M7UUFFaEMsSUFBSSxPQUFrQyxDQUFDO1FBQ3ZDLElBQ0UsSUFBSSxDQUFDLGVBQWU7WUFDcEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUMvQixDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUU7WUFDMUIsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQ3hFO1lBQ0EsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFpQyxFQUFFLEVBQUU7Z0JBQ2pFLElBQ0UsU0FBUyxFQUFFLEtBQUssRUFBRTtvQkFDbEIsT0FBTyxDQUFDLElBQUksSUFBSSxTQUFTLEVBQUUsT0FBTyxFQUFFO29CQUNwQyxPQUFPLEVBQUUsT0FBTyxFQUNoQjtvQkFDQSxPQUFPO3dCQUNMLElBQUksQ0FBQyxrQkFBa0IsQ0FDckIsT0FBTyxFQUFFLE9BQU8sQ0FDZCxJQUFJLENBQUMsWUFBWSxFQUNqQixTQUFTLEVBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQ3ZCLElBQUksQ0FBQyxLQUFLLENBQ1gsRUFDRCxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQ25CLElBQUksRUFBRSxDQUFDO2lCQUNYO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsT0FBTyxHQUFHLEVBQUUsQ0FBQztTQUNkO1FBQ0QsT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQyxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFFSCxjQUFjLENBQUMsS0FBYSxFQUFFLE9BQThCO1FBQzFELE1BQU0sU0FBUyxHQUFHLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBMEIsQ0FBQztRQUMxRSxNQUFNLFNBQVMsR0FBRyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO1FBQ2xELE1BQU0sV0FBVyxHQUFHLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxRQUFhLEVBQUUsRUFBRTtZQUNwRCxPQUFPLFFBQVEsRUFBRSxRQUFRLElBQUksS0FBSyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxXQUFXLElBQUksV0FBVyxFQUFFLGNBQWMsRUFBRSxFQUFFO1lBQ2hELE1BQU0sZ0JBQWdCLEdBQVUsRUFBRSxDQUFDO1lBQ25DLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDN0IsSUFBSSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUksS0FBSyxFQUFFO29CQUNwQyxJQUFJLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQUU7d0JBQzlCLE9BQU87cUJBQ1I7eUJBQU07d0JBQ0wsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQzVDLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQy9CLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDakM7aUJBQ0Y7cUJBQU07b0JBQ0wsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNqQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsU0FBUyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDOUIsU0FBUyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDO2lCQUN2QyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDdEIsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2YsdUNBQXVDO2dCQUN2QyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBYztnQkFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQztTQUNOO2FBQU07WUFDTCxNQUFNLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztZQUM1QixNQUFNLGlCQUFpQixHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDcEQsT0FBTyxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUksS0FBSyxDQUFDO1lBQzFDLENBQUMsQ0FBQyxDQUFDO1lBRUgsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUM3QixJQUFJLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBSSxLQUFLLEVBQUU7b0JBQ3BDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUM1QyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM5QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ2pDO3FCQUFNO29CQUNMLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDakM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDdEIsTUFBTSxLQUFLLEdBQTRCLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FDaEUsS0FBSyxFQUNMLENBQUMsRUFDRCxJQUFJLENBQ0wsQ0FBQztnQkFDRixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDOUI7WUFDRCxTQUFTLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5QixTQUFTLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUM7aUJBQ3BDLElBQUksQ0FBQyxDQUFDLFFBQWEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUM1QixLQUFLLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRTtnQkFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0gsQ0FBQztJQWlCRCx1QkFBdUIsQ0FBQyxPQUE4QjtRQUNwRCxPQUFPLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gscUJBQXFCLENBQUMsR0FBMEI7UUFDOUMsSUFBSSxLQUFpQixDQUFDO1FBQ3RCLElBQUksR0FBRyxFQUFFLFlBQVksRUFBRSxFQUFFO1lBQ3ZCLEtBQUssR0FBRztnQkFDTixVQUFVLEVBQUUsYUFBYTtnQkFDekIsTUFBTSxFQUFFLGNBQWMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFO2dCQUN0RSxZQUFZLEVBQUUsTUFBTTthQUNyQixDQUFDO1NBQ0g7YUFBTSxJQUNMLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsT0FBTztZQUN2RCxDQUFDLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtnQkFDaEIsR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFDMUQ7WUFDQSxLQUFLLEdBQUc7Z0JBQ04sVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBQ3hELE1BQU0sRUFBRSxNQUFNO2dCQUNkLFlBQVksRUFBRSxNQUFNO2FBQ3JCLENBQUM7WUFDRixrRUFBa0U7WUFDbEUsY0FBYztZQUNkLDJCQUEyQjtZQUMzQixrRUFBa0U7WUFDbEUsT0FBTztTQUNSO2FBQU0sSUFBSSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksaUJBQWlCLENBQUMsT0FBTyxFQUFFO1lBQ3RELEtBQUssR0FBRztnQkFDTixVQUFVLEVBQUUsYUFBYTtnQkFDekIsWUFBWSxFQUFFLE1BQU07YUFDckIsQ0FBQztTQUNIO2FBQU0sSUFDTCxDQUFDLEdBQUcsRUFBRSxZQUFZLEVBQUU7WUFDcEIsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxPQUFPO1lBQ3JFLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsSUFBSTtZQUMzRCxDQUFDLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtnQkFDaEIsSUFBSSxDQUFDLFlBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFDM0Q7WUFDQSxLQUFLLEdBQUc7Z0JBQ04sVUFBVSxFQUNSLElBQUksQ0FBQyxTQUFTLElBQUksb0JBQW9CLENBQUMsSUFBSTtvQkFDekMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7b0JBQ2hELENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO2dCQUNsRCxZQUFZLEVBQUUsTUFBTTthQUNyQixDQUFDO1NBQ0g7YUFBTSxJQUNMLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRTtZQUNwQixHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksdUJBQXVCLENBQUMsZUFBZSxDQUFDLE9BQU87WUFDckUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQzVEO1lBQ0EsS0FBSyxHQUFHO2dCQUNOLFlBQVksRUFBRSxFQUFFO2dCQUNoQixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTthQUMzRCxDQUFDO1NBQ0g7YUFBTSxJQUNMLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsV0FBVztZQUNsRSxHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFDdkM7WUFDQSxLQUFLLEdBQUc7Z0JBQ04sVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLFlBQVksRUFBRSxNQUFNO2dCQUNwQixNQUFNLEVBQUUsYUFBYSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEVBQUU7YUFDdEUsQ0FBQztTQUNIO2FBQU0sSUFDTCxDQUFDLEdBQUcsRUFBRSxZQUFZLEVBQUU7WUFDcEIsR0FBRyxFQUFFLFdBQVcsRUFBRSxLQUFLLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQzFFO1lBQ0EsT0FBTztnQkFDTCxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDMUQsS0FBSyxFQUFFLE9BQU87YUFDZixDQUFDO1NBQ0g7YUFBTTtZQUNMLElBQ0UsR0FBRyxFQUFFLFNBQVMsRUFBRTtnQkFDaEIsR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQ3ZEO2dCQUNBLEtBQUssR0FBRztvQkFDTixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtvQkFDMUQsWUFBWSxFQUFFLE1BQU07aUJBQ3JCLENBQUM7YUFDSDtpQkFBTTtnQkFDTCxLQUFLLEdBQUc7b0JBQ04sVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7b0JBQzFELFlBQVksRUFBRSxNQUFNO2lCQUNyQixDQUFDO2FBQ0g7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNELFlBQVksQ0FBQyxPQUFnQztRQUMzQyxJQUFJLElBQUksR0FBUSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEMsT0FBTyxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQztJQUNyQyxDQUFDO0lBQ0QscUJBQXFCLENBQUMsT0FBZ0M7UUFDcEQsSUFBSTtZQUNGLElBQUksT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFO2dCQUN0QixJQUFJLElBQUksR0FBUSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksSUFBSSxFQUFFLFFBQVEsRUFBRTtvQkFDbEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLFFBQVEsQ0FBQztvQkFDOUIsSUFDRSxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLEVBQ2hFO3dCQUNBLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFDM0MsSUFBSSxjQUFjLEVBQUUsVUFBVSxFQUFFOzRCQUM5QixJQUFJLGVBQWUsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDOzRCQUNoRCxPQUFPLGVBQWUsQ0FDcEIsZ0NBQWdDLENBQUMsVUFBVSxDQUM1QztnQ0FDQyxDQUFDLENBQUMsZUFBZSxDQUFDLGdDQUFnQyxDQUFDLFVBQVUsQ0FBQztxQ0FDM0QsU0FBUztnQ0FDWixDQUFDLENBQUMsZUFBZSxDQUFDLDhCQUE4QixDQUFDLFFBQVEsQ0FBQztxQ0FDdkQsWUFBWSxDQUFDO3lCQUNuQjtxQkFDRjtpQkFDRjthQUNGO1NBQ0Y7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUN6QztTQUNGO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxLQUFVO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELFVBQVUsQ0FBQyxPQUFnQztRQUN6QyxJQUFJO1lBQ0YsSUFBSSxXQUFXLEdBQVEsSUFBSSxDQUFDO1lBQzVCLElBQ0UscUJBQXFCLENBQUMsbUJBQW1CLENBQ3ZDLE9BQU8sRUFDUCxpQkFBaUIsQ0FBQyxJQUFJLENBQ3ZCO2dCQUNELHFCQUFxQixDQUFDLG1CQUFtQixDQUN0QyxPQUFtQyxDQUFDLE9BQU8sRUFBRSxFQUM5QyxpQkFBaUIsQ0FBQyxXQUFXLENBQzlCLEVBQ0Q7Z0JBQ0EsV0FBVyxHQUFJLE9BQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUMvQyxJQUNFLHFCQUFxQixDQUFDLG1CQUFtQixDQUN2QyxXQUFXLEVBQ1gsaUJBQWlCLENBQUMsV0FBVyxDQUM5QixFQUNEO29CQUNBLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQztpQkFDaEM7cUJBQU07b0JBQ0wsT0FBTyxFQUFFLENBQUM7aUJBQ1g7YUFDRjtpQkFBTTtnQkFDTCxPQUFPLEVBQUUsQ0FBQzthQUNYO1NBQ0Y7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUN6QztTQUNGO0lBQ0gsQ0FBQztJQXNCRDs7Ozs7O09BTUc7SUFDSCxhQUFhLENBQUMsT0FBOEI7UUFDMUMsSUFBSSxJQUFJLEdBQTRCLElBQUksQ0FBQztRQUN6QyxJQUNFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxHQUFDLEdBQUcsR0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDbEUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFDOUU7WUFDQSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvRixPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNILGFBQWEsQ0FBQyxPQUE4QjtRQUMxQyxJQUFJLElBQUksR0FBNEIsSUFBSSxDQUFDO1FBQ3pDLElBQ0UsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUNsRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBQyxHQUFHLEdBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUM5RTtZQUNBLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBQyxHQUFHLEdBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9GLE9BQU8sSUFBSSxDQUFDO1NBQ2I7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBQ0Q7Ozs7OztPQU1HO0lBQ0gsYUFBYSxDQUFDLE9BQThCO1FBQzFDLElBQ0UsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUNsRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBQyxHQUFHLEdBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUM5RTtZQUNBLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNoRzthQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUM7SUFDRDs7Ozs7O09BTUc7SUFFSCxpQkFBaUIsQ0FBQyxPQUE4QjtRQUM5QyxJQUNFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxHQUFDLEdBQUcsR0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDbEUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUMsR0FBRyxHQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFDbEY7WUFDQSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxHQUFDLEdBQUcsR0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDcEc7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBQ0QscUJBQXFCLENBQUMsT0FBOEI7UUFDbEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sWUFBWSxHQUFHO1lBQ25CLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxLQUFLO1lBQzFDLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxLQUFLO1NBQzNDLENBQUM7UUFDRixPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQTJCRCx5QkFBeUI7UUFDdkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxVQUFVLENBQUM7WUFDL0IsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUNyRSxZQUFZLEVBQUUsS0FBSztZQUNuQixPQUFPLEVBQUUsaUJBQWlCO1lBQzFCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDcEUsbUJBQW1CLEVBQUUsVUFBVSxDQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUM3QztZQUNELFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUNsRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUN0RCxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtTQUM1RCxDQUFDLENBQUM7UUFDSCxNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQztZQUNoQyxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDbEUsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDdEQsVUFBVSxFQUFFLGFBQWE7U0FDMUIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDO1lBQzVDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN2RSxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM5RCxZQUFZLEVBQUUsS0FBSztZQUNuQixVQUFVLEVBQUUsRUFBRTtTQUNmLENBQUMsQ0FBQztRQUNILE1BQU0sYUFBYSxHQUFHLElBQUksYUFBYSxDQUFDO1lBQ3RDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxLQUFLO1lBQ25CLFVBQVUsRUFBRSxFQUFFO1lBQ2QsYUFBYSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ3ZFLGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1NBQzVELENBQUMsQ0FBQztRQUNILE1BQU0sYUFBYSxHQUFHLElBQUksYUFBYSxDQUFDO1lBQ3RDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUMzRCxNQUFNLEVBQUUsYUFBYSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEVBQUU7WUFDckUsWUFBWSxFQUFFLEtBQUs7WUFDbkIsY0FBYyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ3hFLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQzVELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzdELFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUNsRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUN0RCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQ2pFLFlBQVksRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUMzRSxpQkFBaUIsRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUNoRixhQUFhLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDdkUsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDM0QsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtTQUNwRSxDQUFDLENBQUM7UUFDSCxNQUFNLGdCQUFnQixHQUFHO1lBQ3ZCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUN4RCxNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxLQUFLO1lBQ25CLGNBQWMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN4RSxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUNoRSxjQUFjLEVBQUUsUUFBUTtTQUN6QixDQUFDO1FBQ0YsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLGlCQUFpQixDQUFDO1lBQzlDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUMzRCxNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxNQUFNO1lBQ3BCLGNBQWMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN4RSxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUM1RCxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ3BFLFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUNsRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUN0RCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQ2pFLFlBQVksRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUMzRSxrQkFBa0IsRUFBRSxLQUFLO1lBQ3pCLGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN2RSxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUMzRCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1NBQ3BFLENBQUMsQ0FBQztRQUNILE1BQU0sY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDO1lBQ3hDLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLE1BQU0sRUFBRSxhQUFhO1lBQ3JCLEtBQUssRUFBRSxNQUFNO1lBQ2IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ25FLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQ3hELFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN0RSxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM3RCxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUM1RCxlQUFlLEVBQUUsS0FBSztZQUN0QixZQUFZLEVBQUUsS0FBSztTQUNwQixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksZUFBZSxDQUFDO1lBQ3pCLEtBQUssRUFBRSxPQUFPO1lBQ2QsTUFBTSxFQUFFLGFBQWE7WUFDckIsTUFBTSxFQUFFLE1BQU07WUFDZCxVQUFVLEVBQUUsYUFBYTtZQUN6QixpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQ2xFLFlBQVksRUFBRSxLQUFLO1lBQ25CLG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsY0FBYyxFQUFFLFNBQVM7WUFDekIsVUFBVSxFQUFFLFVBQVU7WUFDdEIsZ0JBQWdCLEVBQUUsZ0JBQWdCO1lBQ2xDLGFBQWEsRUFBRSxhQUFhO1lBQzVCLGFBQWEsRUFBRSxhQUFhO1lBQzVCLFdBQVcsRUFBRSxnQkFBZ0I7WUFDN0IsaUJBQWlCLEVBQUUsaUJBQWlCO1lBQ3BDLGNBQWMsRUFBRSxjQUFjO1lBQzlCLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3ZELFNBQVMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUNoRSx1QkFBdUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3BFLHNCQUFzQixFQUFFLFVBQVUsQ0FDaEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDN0M7WUFDRCxjQUFjLEVBQUUsS0FBSztZQUNyQixnQkFBZ0IsRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUMvRSxzQkFBc0IsRUFBRSxLQUFLO1lBQzdCLGNBQWMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN4RSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1NBQ2pFLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCx5QkFBeUI7UUFDdkIsTUFBTSxXQUFXLEdBQUc7WUFDbEIsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsWUFBWSxFQUFFLEtBQUs7WUFDbkIsY0FBYyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ3hFLGVBQWUsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUNsRSxjQUFjLEVBQUUsUUFBUTtTQUN6QixDQUFDO1FBRUYsT0FBTyxJQUFJLGVBQWUsQ0FBQztZQUN6QixVQUFVLEVBQUUsYUFBYTtZQUN6QixZQUFZLEVBQUUsS0FBSztZQUNuQixNQUFNLEVBQUUsYUFBYTtZQUNyQixLQUFLLEVBQUUsT0FBTztZQUNkLFdBQVcsRUFBRSxNQUFNO1lBQ25CLFVBQVUsRUFBRSxNQUFNO1lBQ2xCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLG9CQUFvQixFQUFFLGFBQWE7WUFDbkMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNqRSxlQUFlLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDekUsV0FBVyxFQUFFLFdBQVc7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNoRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQ2xFLG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsY0FBYyxFQUFFLEtBQUs7WUFDckIsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtTQUNwRSxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsa0JBQWtCLENBQUMsT0FBOEI7UUFDL0MsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7UUFDaEUsSUFBSSxpQkFBaUIsR0FDbkIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxZQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hFLElBQUksaUJBQWlCLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDdkMsT0FBTztnQkFDTCxTQUFTLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7Z0JBQy9ELFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztnQkFDN0QsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO2dCQUMzRCxjQUFjLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7Z0JBQ3BFLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO2dCQUM3RCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztnQkFDbkUsS0FBSyxFQUFFLE9BQU87YUFDZixDQUFDO1NBQ0g7YUFBTTtZQUNMLE9BQU87Z0JBQ0wsU0FBUyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUMvRCxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFDdkQsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RELGNBQWMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztnQkFDcEUsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBQzdELGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO2dCQUNuRSxLQUFLLEVBQUUsT0FBTzthQUNmLENBQUM7U0FDSDtJQUNILENBQUM7SUFpQkQsa0JBQWtCLENBQUMsT0FBOEI7UUFDL0MsT0FBTyxJQUFJLENBQUMsU0FBUyxJQUFJLG9CQUFvQixDQUFDLElBQUk7WUFDaEQsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO2dCQUNsQixPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM3RCxDQUFDLENBQUMsc0JBQXNCLENBQUMsSUFBSTtZQUM3QixDQUFDLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO0lBQ25DLENBQUM7SUEwQ0QsZUFBZSxDQUFDLE9BQThCO1FBQzVDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7WUFDbkUsT0FBTyx1QkFBdUIsQ0FBQztTQUNoQzthQUFNO1lBQ0wsT0FBTyx1QkFBdUIsQ0FBQztTQUNoQztJQUNILENBQUM7SUFDRCxlQUFlLENBQUMsT0FBOEI7UUFFNUMsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUM5QyxJQUFJLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDLFlBQVksQ0FDeEQsT0FBeUIsRUFDekIsSUFBSSxDQUFDLFlBQVksQ0FDbEI7Z0JBQ0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7Z0JBQzVDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUE7WUFDbEQsT0FBTztnQkFDTCxjQUFjLEVBQUUsVUFBVSxDQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUM3QztnQkFDRCxlQUFlLEVBQUUsbUJBQW1CO2dCQUNwQyxZQUFZLEVBQUUsTUFBTTtnQkFDcEIsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsY0FBYyxFQUFFLG1CQUFtQjtnQkFDbkMsVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLGNBQWMsRUFBRSxhQUFhO2dCQUM3QixPQUFPLEVBQUUsVUFBVTtnQkFDbkIsR0FBRyxFQUFFLEtBQUs7Z0JBQ1YsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsY0FBYyxFQUFFLFFBQVE7YUFDekIsQ0FBQztTQUNIO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQXVMRCxrQkFBa0IsQ0FBQyxPQUE4QjtRQUMvQyxJQUFJLGFBQWEsR0FDZixPQUFPLENBQUMsV0FBVyxFQUFFO1lBQ3JCLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxPQUFPO1lBQy9DLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQ25FLElBQUksYUFBYSxFQUFFO1lBQ2pCLE9BQU87Z0JBQ0wsU0FBUyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7Z0JBQ3RELFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO2dCQUN2RCxZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztnQkFDekQsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQzdELFFBQVEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO2FBQ3ZELENBQUM7U0FDSDthQUFNO1lBQ0wsT0FBTztTQUNSO0lBQ0gsQ0FBQztJQUNELGVBQWU7UUFDYixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELG9CQUFvQixDQUFDLE9BQWdDO1FBQ25ELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDMUMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLFFBQVEsR0FBRyxDQUFDLFNBQWlCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN6QztRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFjRDs7O09BR0c7SUFDSCxvQkFBb0I7UUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNkLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLE9BQU8sR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ2hILENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLE9BQU8sR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ2hILENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLE9BQU8sR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQ2xILENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLE9BQU8sR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQ2xILENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLE9BQU8sR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQ2xILENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ3RILHdCQUF3QixFQUFFLElBQUksQ0FBQyxhQUFhO1lBQzVDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDbEQseUJBQXlCLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDOUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDdEMsY0FBYyxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2xDLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLElBQUksR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQy9HLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLElBQUksR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQy9HLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLFdBQVcsR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQzlILENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLFdBQVcsR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ3BILENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLFdBQVcsR0FBQyxHQUFHLEdBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQ3JILENBQUM7UUFDRixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUNELGlCQUFpQixDQUFDLE9BQWdDLEVBQUUsSUFBYTtRQUMvRCxJQUFJLElBQUksR0FBUSxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDeEMsSUFBSSxJQUFJLEVBQUU7WUFDUixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNuQjthQUFNO1lBQ0wsT0FBTyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDckM7SUFDSCxDQUFDO0lBQ0QsY0FBYyxDQUFDLE9BQThCO1FBQzNDLElBQUksVUFBVSxHQUFHLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0MsSUFBSSxNQUFNLEdBQUcsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEUsT0FBTyxHQUFHLFVBQVUsSUFBSSxNQUFNLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBQ0QscUJBQXFCO1FBQ25CLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNwRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEVBQUU7WUFDMUQsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQztTQUN2QztRQUNELElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUNsRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzVDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ2hELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1NBQzdCO1FBQ0QsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7WUFDdEQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztTQUNuQztRQUNELElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMvQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztTQUM1QjtRQUNELElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFO1lBQzlELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7U0FDOUI7UUFDRCxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsRUFBRTtZQUM1RCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztTQUM1QjtRQUNELElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUM5QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUMzQjtRQUNELElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO1lBQzVELElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUM7U0FDdkM7UUFDRCxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsRUFBRTtZQUM1RCxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO1NBQ3ZDO0lBQ0gsQ0FBQztJQU9ELHFCQUFxQixDQUFDLE9BQVk7UUFDaEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7UUFDekQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRCxzQkFBc0I7UUFDcEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRCxpQkFBaUIsQ0FBQyxLQUFVO1FBQzFCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQztRQUNyRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQVFELGFBQWE7UUFDWCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUNELGNBQWMsQ0FBQyxPQUE4QjtRQUMzQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsaUJBQWlCO1lBQy9CLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7WUFDakQsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNULE9BQU8sSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdELENBQUM7SUFDRCxjQUFjLENBQUMsT0FBOEI7UUFDM0MsSUFBSTtZQUNGLElBQUksT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDcEQsSUFBSSxRQUFRLEdBQVEsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzdELElBQUksY0FBYyxJQUFJLGNBQWMsRUFBRSxVQUFVLEVBQUU7b0JBQ2hELElBQUksZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQztvQkFDakQsSUFDRSxnQkFBZ0I7d0JBQ2hCLHFCQUFxQixDQUFDLG1CQUFtQixDQUN2QyxnQkFBZ0IsRUFDaEIsb0JBQW9CLENBQUMsWUFBWSxDQUNsQyxFQUNEO3dCQUNBLElBQUksaUJBQWlCLEdBQ25CLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN0RCxJQUNFLGlCQUFpQjs0QkFDakIscUJBQXFCLENBQUMsbUJBQW1CLENBQ3ZDLGlCQUFpQixFQUNqQixvQkFBb0IsQ0FBQyxLQUFLLENBQzNCOzRCQUNELGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFDcEQ7NEJBQ0EsT0FBTyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDekQ7NkJBQU07NEJBQ0wsT0FBTyxJQUFJLENBQUM7eUJBQ2I7cUJBQ0Y7eUJBQU07d0JBQ0wsT0FBTyxJQUFJLENBQUM7cUJBQ2I7aUJBQ0Y7YUFDRjtpQkFBTTtnQkFDTCxPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUN6QztTQUNGO0lBQ0gsQ0FBQztJQUNELGlCQUFpQixDQUFDLEdBQTJCO1FBQzNDLElBQUksT0FBTyxHQUFRLEdBQTZCLENBQUM7UUFDakQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksSUFBSSxDQUFDLHlCQUF5QixFQUFFO1lBQ2xDLElBQUk7Z0JBQ0YsSUFBSSxRQUFRLEdBQVEsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLGNBQWMsR0FBRyxRQUFRLEVBQUUsQ0FDN0IsNEJBQTRCLENBQUMsUUFBUSxDQUNkLENBQUM7Z0JBQzFCLElBQUksZ0JBQWdCLEdBQUcsY0FBYyxFQUFFLFVBQVUsQ0FBQztnQkFDbEQsSUFBSSx5QkFBeUIsR0FDM0IsZ0JBQWdCLENBQUMsNEJBQTRCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDdEUsSUFBSSxlQUFlLEdBQUcseUJBQXlCLEVBQUUsU0FBUyxDQUFDO2dCQUMzRCxJQUFJLGVBQWUsRUFBRTtvQkFDbkIsUUFBUSxHQUFHLGVBQWUsQ0FBQztpQkFDNUI7cUJBQU07b0JBQ0wsUUFBUSxHQUFHLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVzt3QkFDbkMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUc7d0JBQ3BDLENBQUMsQ0FBQyxFQUFFLENBQUM7aUJBQ1I7YUFDRjtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDekM7YUFDRjtTQUNGO2FBQU07WUFDTCxRQUFRLEdBQUcsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXO2dCQUNuQyxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRztnQkFDcEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUNSO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUNELHFCQUFxQixDQUFDLEdBQVcsRUFBRSxPQUE4QjtRQUMvRCxJQUFJLGlCQUFpQixHQUFRLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUQsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM3QyxPQUFPLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQy9CO2FBQU07WUFDTCxPQUFPLEVBQUUsQ0FBQztTQUNYO0lBQ0gsQ0FBQztJQUNELFFBQVE7UUFDTixJQUFJLENBQUMsc0JBQXNCLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQzVCLFNBQVMsQ0FBQyxlQUFlLEVBQUU7YUFDeEIsSUFBSSxDQUFDLENBQUMsSUFBMkIsRUFBRSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBc0IsQ0FBQztRQUM3QyxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsQ0FBQyxLQUFtQyxFQUFFLEVBQUU7WUFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3JCO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVTtZQUNoQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVTtnQkFDbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ2pELElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVTtZQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFakQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztRQUM3RixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQzFGLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDbkcsQ0FBQztJQWVELGNBQWM7UUFDWixJQUFJLFlBQVksR0FBZ0IsSUFBSSxXQUFXLENBQUM7WUFDOUMsWUFBWSxFQUFFLE1BQU07WUFDcEIsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUNyRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUMvRCxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM3RCxjQUFjLEVBQUUsT0FBTztZQUN2QixZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFFdEUsc0JBQXNCLEVBQUUsRUFBRTtTQUMzQixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDOUQsQ0FBQztJQUNELFlBQVk7UUFDVixJQUFJLFlBQVksR0FBRyxJQUFJLFNBQVMsQ0FBQztZQUMvQixRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDbEUsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDekQsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDM0QsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUNyRSxZQUFZLEVBQUUsS0FBSztZQUNuQixPQUFPLEVBQUUsVUFBVTtTQUNwQixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQzVFLENBQUM7SUFDRCxnQkFBZ0I7UUFDZCxJQUFJLENBQUMsWUFBWSxHQUFHO1lBQ2xCLE1BQU0sRUFBRSxPQUFPO1lBQ2YsS0FBSyxFQUFFLE9BQU87WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxLQUFLO1lBQ25CLFNBQVMsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsY0FBYztTQUMzRSxDQUFBO1FBQ0QsSUFBSSxpQkFBaUIsR0FBRztZQUN0QixNQUFNLEVBQUUsT0FBTztZQUNmLEtBQUssRUFBRSxPQUFPO1lBQ2QsTUFBTSxFQUFFLGFBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFO1lBQ3JFLFlBQVksRUFBRSxLQUFLO1lBQ25CLEdBQUcsSUFBSSxDQUFDLGtCQUFrQjtTQUMzQixDQUFBO1FBQ0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO1FBQzVDLElBQUksQ0FBQyxtQkFBbUIsR0FBRztZQUN6QixNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsT0FBTyxFQUFFLE1BQU07WUFDZixjQUFjLEVBQUUsUUFBUTtZQUN4QixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxNQUFNO1lBQ3BCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDeEQsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ2xFLGNBQWMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztTQUNyRSxDQUFDO1FBQ0YsSUFBSSxDQUFDLGVBQWUsR0FBRztZQUNyQixhQUFhLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDdEUsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDM0QsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDaEUsU0FBUyxFQUFFLGVBQWUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFO1lBQzFFLGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzdELFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQzNELEdBQUcsSUFBSSxDQUFDLGVBQWU7U0FDeEIsQ0FBQztRQUNGLElBQUksQ0FBQyx3QkFBd0IsR0FBRztZQUM5QixhQUFhLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDdEUsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDM0QsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDaEUsU0FBUyxFQUFFLGVBQWUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFO1lBQzFFLGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzdELFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQzNELEdBQUcsSUFBSSxDQUFDLHdCQUF3QjtTQUNqQyxDQUFDO1FBRUYsSUFBSSxDQUFDLHdCQUF3QixHQUFHO1lBQzlCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QjtZQUNoQyxLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxhQUFhO1lBQ3JCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQzNELFNBQVMsRUFBRSxlQUFlLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUMxRSxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDakUsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUc7WUFDOUQsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUc7WUFDdkQsU0FBUyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ2hFLE1BQU0sRUFBRSxtQkFBbUI7U0FDNUIsQ0FBQztRQUVGLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhO1lBQ3RDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMvQyxJQUFJLFlBQVksR0FBcUIsSUFBSSxnQkFBZ0IsQ0FBQztZQUN4RCxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUMzRCxNQUFNLEVBQUUsTUFBTTtZQUNkLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ3pFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDbkUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDekUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNuRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUMvRCxZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDckUsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDN0QsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDekUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNuRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ2pFLDJCQUEyQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDekUsMEJBQTBCLEVBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDaEQseUJBQXlCLEVBQUUsVUFBVSxDQUNuQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUM1QztZQUNELGlCQUFpQixFQUFFLFVBQVUsQ0FDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FDNUM7U0FDRixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDO1lBQzNDLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3ZELFNBQVMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUNoRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ2hFLGVBQWUsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN6RSxVQUFVLEVBQUUsYUFBYTtZQUN6QixNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1NBQ2QsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLG1CQUFtQixHQUFHO1lBQ3pCLFNBQVMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUMvRCxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUN2RCxZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDdEUsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDN0QsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDeEQsY0FBYyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3BFLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQzdELGdCQUFnQixFQUFFLGFBQWE7WUFDL0IsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7U0FDL0QsQ0FBQztRQUNGLElBQUksQ0FBQyxlQUFlLEdBQUc7WUFDckIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsVUFBVSxFQUFFLGFBQWE7WUFDekIsbUJBQW1CLEVBQUUsVUFBVSxDQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUM3QztZQUNELG9CQUFvQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDcEUsb0JBQW9CLEVBQUUsVUFBVSxDQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUM3QztZQUNELHFCQUFxQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDbEUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDeEUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNoRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ3BFLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQy9ELHNCQUFzQixFQUFFLFVBQVUsQ0FDaEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDN0M7WUFDRCx1QkFBdUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ3ZFLDRCQUE0QixFQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ2hELDRCQUE0QixFQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQzlDLGdCQUFnQixFQUFFLGFBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFO1lBQy9FLHNCQUFzQixFQUFFLEtBQUs7U0FDOUIsQ0FBQztRQUNGLElBQUksQ0FBQyxvQkFBb0IsR0FBRztZQUMxQixXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUN6RCxNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUNuRSxlQUFlLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDdEUsWUFBWSxFQUFFLEtBQUs7U0FDcEIsQ0FBQztRQUNGLElBQUksQ0FBQyxrQkFBa0IsR0FBRztZQUN4Qix1QkFBdUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ25FLHNCQUFzQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDdEUsc0JBQXNCLEVBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDO1lBQ3ZELHFCQUFxQixFQUFFLFVBQVUsQ0FDL0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FDekM7WUFDRCxxQkFBcUIsRUFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7WUFDdEQsb0JBQW9CLEVBQUUsVUFBVSxDQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN6QztZQUNELFNBQVMsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUNoRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUN2RCxlQUFlLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDekUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNoRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUMzRCxNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLGFBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFO1lBQ3JFLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUM7SUFDSixDQUFDO0lBQ0QsZUFBZSxDQUFDLE9BQThCO1FBQzVDLE1BQU0sYUFBYSxHQUNqQixPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssdUJBQXVCLENBQUMsWUFBWSxDQUFDLElBQUk7WUFDaEUsSUFBSSxDQUFDLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7UUFDOUMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQztZQUNuQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM1RCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM1RCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ2pFLFlBQVksRUFBRSxhQUFhO2dCQUN6QixDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtnQkFDakQsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDaEQsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7WUFDekQsTUFBTSxFQUFFLE1BQU07WUFDZCxLQUFLLEVBQUUsTUFBTTtZQUNiLFVBQVUsRUFBRSxhQUFhO1NBQzFCLENBQUMsQ0FBQztRQUNILE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBQ0Qsb0JBQW9CO1FBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUNsRCxJQUFJLENBQUMsZUFBZTtnQkFDbEIsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUM1RCxJQUFJLENBQUMsVUFBVTtnQkFDYixnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzdELElBQUksQ0FBQyxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztTQUNwRTthQUFNO1lBQ0wsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1NBQ3ZDO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQzNCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQzNCLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDYixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxzQkFBc0I7b0JBQy9DLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDO29CQUMxRCxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUMsc0JBQXNCLEVBQUU7eUJBQ3JDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO3lCQUNwQixRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzt5QkFDcEIsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7eUJBQzlCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDaEY7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsc0JBQXNCO29CQUMvQyxDQUFDLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztvQkFDMUQsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLHNCQUFzQixFQUFFO3lCQUNyQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzt5QkFDcEIsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7eUJBQ3BCLFdBQVcsQ0FBQyxJQUFJLENBQUM7eUJBQ2pCLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7Z0JBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2xGO1lBQ0QsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7U0FDOUI7SUFDSCxDQUFDO0lBRUQsa0JBQWtCO1FBQ2hCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQzNCLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDYixTQUFTLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FDOUQsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDTixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO29CQUV2QyxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxVQUE4QixDQUFDLENBQUM7Z0JBQzVELENBQUMsRUFDRCxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUNmLENBQUM7YUFDSDtpQkFBTTtnQkFDTCxTQUFTLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FDakUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDTixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO29CQUV6QyxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxVQUE4QixDQUFDLENBQUM7Z0JBQzVELENBQUMsRUFDRCxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUNmLENBQUM7YUFDSDtTQUNGO0lBQ0gsQ0FBQztJQXNKRCxtQkFBbUI7UUFDakIsSUFBSSxjQUFjLEdBQXFDLElBQUksU0FBUyxDQUFDLHNCQUFzQixFQUFFO2FBQzFGLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDO2FBQ3hELFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDO2FBQzNELFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO2FBQ2hDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDdkIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ2IsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7U0FDNUM7YUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDckIsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7U0FDL0M7UUFDRCxjQUFjLENBQUMsS0FBSyxFQUFFO2FBQ25CLFNBQVMsRUFBRTthQUNYLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ2pCLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBOEIsRUFBRSxFQUFFO29CQUNsRCxJQUNHLE9BQTRCLENBQUMsV0FBVyxFQUFFO3dCQUMzQyxTQUFTLENBQUMsV0FBVyxFQUNyQjt3QkFDQSxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FDMUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNKLENBQUMsQ0FBQyxLQUFLLEVBQUU7NEJBR0wsT0FDRCxDQUFDLFdBQVcsRUFDZCxDQUFDLEtBQUssRUFBRSxDQUNaLENBQUM7d0JBQ0YsSUFBSSxVQUFVLElBQUksQ0FBQyxFQUFFOzRCQUNuQixJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUMzQixPQUNELENBQUMsV0FBVyxFQUEyQixDQUFDO3lCQUMxQztxQkFDRjtnQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDMUI7UUFDSCxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsQ0FBQyxLQUFtQyxFQUFFLEVBQUU7WUFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3JCO1lBQ0QsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sSUFBSSxDQUFDLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQTBLRCx3QkFBd0I7UUFDdEIsU0FBUyxDQUFDLHFCQUFxQixDQUM3QixJQUFJLENBQUMsb0JBQW9CLEVBQ3pCLElBQUksU0FBUyxDQUFDLGtCQUFrQixDQUFDO1lBQy9CLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUNELGNBQWMsRUFBRSxHQUFHLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7Z0JBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztZQUN2RCxDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBQ0Qsd0JBQXdCO1FBQ3RCLElBQUk7WUFDRixTQUFTLENBQUMsZ0JBQWdCLENBQ3hCLElBQUksQ0FBQyxlQUFlLEVBQ3BCLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBQztnQkFDMUIseUJBQXlCLEVBQUUsQ0FDekIsT0FBeUIsRUFDekIsV0FBMkIsRUFDM0IsUUFBb0MsRUFDcEMsUUFBb0MsRUFDcEMsWUFBOEIsRUFDOUIsRUFBRTtvQkFDRixJQUFJLENBQUMsYUFBYSxDQUNoQix1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQ3RELE9BQU8sRUFDUCxZQUFZLEVBQ1osRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FDdkMsQ0FBQztnQkFDSixDQUFDO2dCQUNELG1CQUFtQixFQUFFLENBQ25CLE9BQXlCLEVBQ3pCLFVBQTBCLEVBQzFCLFFBQXdCLEVBQ3hCLFVBQTRCLEVBQzVCLEVBQUU7b0JBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUNoRCxPQUFPLEVBQ1AsVUFBVSxFQUNWO3dCQUNFLElBQUksRUFBRSxVQUFVO3dCQUNoQixTQUFTLEVBQUUsS0FBSztxQkFDakIsQ0FDRixDQUFDO2dCQUNKLENBQUM7Z0JBQ0QsbUJBQW1CLEVBQUUsQ0FDbkIsT0FBeUIsRUFDekIsVUFBMEIsRUFDMUIsUUFBd0IsRUFDeEIsVUFBNEIsRUFDNUIsRUFBRTtvQkFDRixJQUFJLENBQUMsYUFBYSxDQUNoQix1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQ2hELE9BQU8sRUFDUCxVQUFVLEVBQ1Y7d0JBQ0UsSUFBSSxFQUFFLFVBQVU7cUJBQ2pCLENBQ0YsQ0FBQztnQkFDSixDQUFDO2dCQUNELHFCQUFxQixFQUFFLENBQ3JCLE9BQXlCLEVBQ3pCLFlBQTRCLEVBQzVCLFVBQTBCLEVBQzFCLFlBQThCLEVBQzlCLEVBQUU7b0JBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUNsRCxPQUFPLEVBQ1AsWUFBWSxFQUNaLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUN2QixDQUFDO2dCQUNKLENBQUM7Z0JBQ0Qsb0JBQW9CLEVBQUUsQ0FDcEIsT0FBeUIsRUFDekIsU0FBeUIsRUFDekIsV0FBMkIsRUFDM0IsV0FBNkIsRUFDN0IsRUFBRTtvQkFDRixJQUFJLENBQUMsYUFBYSxDQUNoQix1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQy9DLE9BQU8sRUFDUCxXQUFXLEVBQ1g7d0JBQ0UsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsU0FBUyxFQUFFLElBQUk7cUJBQ2hCLENBQ0YsQ0FBQztnQkFDSixDQUFDO2dCQUNELGlCQUFpQixFQUFFLENBQ2pCLE9BQThCLEVBQzlCLFdBQWtDLEVBQ2xDLEtBQXNCLEVBQ3RCLEVBQUU7b0JBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUM5QyxPQUFPLEVBQ1AsS0FBSyxFQUNMO3dCQUNFLElBQUksRUFBRSxXQUFXO3FCQUNsQixDQUNGLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxtQkFBbUIsRUFBRSxDQUNuQixPQUE4QixFQUM5QixVQUFpQyxFQUNqQyxXQUE0QixFQUM1QixFQUFFO29CQUNGLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFDaEQsT0FBTyxFQUNQLFdBQVcsRUFDWDt3QkFDRSxJQUFJLEVBQUUsVUFBVTtxQkFDakIsQ0FDRixDQUFDO2dCQUNKLENBQUM7YUFDRixDQUFDLENBQ0gsQ0FBQztZQUNGLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDdEIsU0FBUyxDQUFDLGVBQWUsQ0FDdkIsSUFBSSxDQUFDLGNBQWMsRUFDbkIsSUFBSSxTQUFTLENBQUMsWUFBWSxDQUFDO29CQUN6QixzQkFBc0IsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTt3QkFDL0MsSUFBSSxJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLEVBQUU7NEJBQzdDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQ3ZCO29CQUNILENBQUM7b0JBQ0QsdUJBQXVCLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7d0JBQ2hELElBQUksSUFBSSxDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxFQUFFOzRCQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUN2QjtvQkFDSCxDQUFDO29CQUNELHNCQUFzQixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO3dCQUMvQyxJQUFJLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsRUFBRTs0QkFDN0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzt5QkFDdkI7b0JBQ0gsQ0FBQztvQkFDRCxzQkFBc0IsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTt3QkFDL0MsSUFBSSxJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLEVBQUU7NEJBQzdDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQ3ZCO29CQUNILENBQUM7b0JBQ0QsMEJBQTBCLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7d0JBQ25ELElBQUksSUFBSSxDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxFQUFFOzRCQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUN2QjtvQkFDSCxDQUFDO2lCQUNGLENBQUMsQ0FDSCxDQUFDO2FBQ0g7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO2dCQUMxQixJQUFJLENBQUMsc0JBQXNCO29CQUN6QixzQkFBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQ3JELENBQUMsZUFBZSxFQUFFLEVBQUU7d0JBQ2xCLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFDdkQsZUFBZSxDQUNoQixDQUFDO29CQUNKLENBQUMsQ0FDRixDQUFDO2dCQUNKLElBQUksQ0FBQyx3QkFBd0I7b0JBQzNCLHNCQUFzQixDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FDdkQsQ0FBQyxlQUFlLEVBQUUsRUFBRTt3QkFDbEIsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUN6RCxlQUFlLENBQ2hCLENBQUM7b0JBQ0osQ0FBQyxDQUNGLENBQUM7YUFDTDtZQUNELElBQUksQ0FBQyxxQkFBcUI7Z0JBQ3hCLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FDcEQsQ0FBQyxPQUE4QixFQUFFLEVBQUU7b0JBQ2pDLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFDdEQsT0FBTyxDQUNSLENBQUM7Z0JBQ0osQ0FBQyxDQUNGLENBQUM7WUFDSixJQUFJLENBQUMsc0JBQXNCO2dCQUN6QixzQkFBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQ3JELENBQUMsT0FBK0IsRUFBRSxFQUFFO29CQUNsQyxJQUFJLENBQUMsYUFBYSxDQUNoQix1QkFBdUIsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQ3ZELE9BQU8sQ0FDUixDQUFDO2dCQUNKLENBQUMsQ0FDRixDQUFDO1lBQ0osSUFBSSxDQUFDLHVCQUF1QjtnQkFDMUIsc0JBQXNCLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUN0RCxDQUFDLE9BQWdDLEVBQUUsRUFBRTtvQkFDbkMsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUN4RCxPQUFPLENBQ1IsQ0FBQztnQkFDSixDQUFDLENBQ0YsQ0FBQztZQUNKLElBQUksQ0FBQyxxQkFBcUI7Z0JBQ3hCLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FDcEQsQ0FBQyxPQUFvQixFQUFFLEVBQUU7b0JBQ3ZCLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsRUFDN0QsT0FBTyxDQUNSLENBQUM7Z0JBQ0osQ0FBQyxDQUNGLENBQUM7WUFDSixJQUFJLENBQUMsMEJBQTBCO2dCQUM3QixzQkFBc0IsQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQ3pELENBQUMsT0FBeUIsRUFBRSxFQUFFO29CQUM1QixJQUFJLENBQUMsYUFBYSxDQUNoQix1QkFBdUIsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQzdELE9BQU8sQ0FDUixDQUFDO2dCQUNKLENBQUMsQ0FDRixDQUFDO1lBQ0osSUFBSSxDQUFDLHFCQUFxQjtnQkFDeEIsc0JBQXNCLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUNwRCxDQUFDLE9BQW9CLEVBQUUsRUFBRTtvQkFDdkIsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUM3RCxPQUFPLENBQ1IsQ0FBQztnQkFDSixDQUFDLENBQ0YsQ0FBQztZQUNKLElBQUksQ0FBQyxrQ0FBa0M7Z0JBQ3JDLHNCQUFzQixDQUFDLGtDQUFrQyxDQUFDLFNBQVMsQ0FDakUsQ0FBQyxPQUFpQyxFQUFFLEVBQUU7b0JBQ3BDLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsRUFDN0QsT0FBTyxDQUNSLENBQUM7Z0JBQ0osQ0FBQyxDQUNGLENBQUM7WUFDSixJQUFJLENBQUMsbUJBQW1CO2dCQUN0QixzQkFBc0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQ2xELENBQUMsY0FBd0MsRUFBRSxFQUFFO29CQUMzQyxJQUFJLGNBQWMsQ0FBQyxlQUFlLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUU7d0JBQ3hGLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFDbEQsY0FBYyxDQUNmLENBQUM7cUJBQ0g7Z0JBRUgsQ0FBQyxDQUNGLENBQUM7WUFDSixJQUFJLENBQUMsY0FBYyxHQUFHLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQ25FLENBQUMsY0FBd0MsRUFBRSxFQUFFO2dCQUMzQyxJQUFJLGNBQWMsQ0FBQyxlQUFlLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUU7b0JBQ3hGLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQzdDLGNBQWMsQ0FDZixDQUFDO2lCQUNIO1lBQ0gsQ0FBQyxDQUNGLENBQUM7WUFDRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUM3RSxDQUFDLGNBQXdDLEVBQUUsRUFBRTtnQkFDM0MsSUFBSSxjQUFjLENBQUMsZUFBZSxFQUFFLElBQUksdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFO29CQUN6RixJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNuRCxJQUFJLENBQUMsYUFBYSxDQUNoQix1QkFBdUIsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUM3QyxjQUFjLENBQ2YsQ0FBQztpQkFDSDtZQUNILENBQUMsQ0FDRixDQUFDO1lBQ0YsSUFBSSxDQUFDLHdCQUF3QixHQUFHLHNCQUFzQixDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FDdkYsQ0FBQyxjQUF3QyxFQUFFLEVBQUU7Z0JBQzNDLElBQUksY0FBYyxDQUFDLGVBQWUsRUFBRSxJQUFJLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRTtvQkFDekYsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUNsRCxjQUFjLENBQ2YsQ0FBQztpQkFDSDtZQUVILENBQUMsQ0FDRixDQUFDO1lBQ0YsSUFBSSxDQUFDLGdCQUFnQixHQUFHLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FDdkUsQ0FBQyxjQUFxQyxFQUFFLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxhQUFhLENBQ2hCLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQ2hELGNBQWMsQ0FDZixDQUFDO1lBQ0osQ0FBQyxDQUNGLENBQUM7WUFDRixJQUFJLENBQUMsZUFBZSxHQUFHLHNCQUFzQixDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQ3JFLENBQUMsYUFBb0MsRUFBRSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsYUFBYSxDQUNoQix1QkFBdUIsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUMvQyxhQUFhLENBQ2QsQ0FBQztZQUNKLENBQUMsQ0FDRixDQUFDO1lBQ0YsSUFBSSxDQUFDLDBCQUEwQjtnQkFDN0Isc0JBQXNCLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUN6RCxDQUFDLGdCQUE0QyxFQUFFLEVBQUU7b0JBQy9DLElBQUksWUFBWSxHQUFRLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNuRCxJQUNFLGdCQUFnQixDQUFDLGVBQWUsRUFBRTt3QkFDbEMsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsSUFBSTt3QkFDaEQsSUFBSSxDQUFDLElBQUk7d0JBQ1QsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQzVELGdCQUFnQixDQUFDLGFBQWEsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFO3dCQUMvRCxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksZUFBZSxFQUN2Qzt3QkFDQSxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUN4QyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQ3pCLENBQUM7d0JBQ0YsT0FBTztxQkFDUjt5QkFBTSxJQUNMLGdCQUFnQixDQUFDLGVBQWUsRUFBRTt3QkFDbEMsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsS0FBSzt3QkFDakQsSUFBSSxDQUFDLEtBQUs7d0JBQ1YsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7d0JBQ3hELGdCQUFnQixFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRTs0QkFDdEMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUU7d0JBQzNCLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxlQUFlLEVBQ3ZDO3dCQUNBLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQ3hDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FDekIsQ0FBQzt3QkFDRixPQUFPO3FCQUNSO2dCQUNILENBQUMsQ0FDRixDQUFDO1lBQ0osSUFBSSxDQUFDLDBCQUEwQjtnQkFDN0Isc0JBQXNCLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUN6RCxDQUFDLE9BQXFDLEVBQUUsRUFBRTtvQkFDeEMsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsdUJBQXVCLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUMzRCxPQUFPLENBQ1IsQ0FBQztnQkFDSixDQUFDLENBQ0YsQ0FBQztTQUNMO1FBQUMsT0FBTyxLQUFVLEVBQUU7WUFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDekM7U0FDRjtJQUNILENBQUM7SUFDRDs7O09BR0c7SUFDSDs7Ozs7O09BTUc7SUFDSCxhQUFhLENBQ1gsTUFBcUIsSUFBSSxFQUN6QixVQUFrRSxJQUFJLEVBQ3RFLFFBQWdDLElBQUksRUFDcEMsVUFBZSxJQUFJO1FBRW5CLElBQUk7WUFDRixJQUFJLENBQUMsdUJBQXVCLEdBQUcsS0FBSyxDQUFDO1lBQ3JDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7WUFDckMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDekIsUUFBUSxHQUFHLEVBQUU7Z0JBQ1gsS0FBSyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUM7Z0JBQzVELEtBQUssdUJBQXVCLENBQUMsUUFBUSxDQUFDLHNCQUFzQjtvQkFDMUQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNyQyxJQUFJLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxPQUFPLENBQUMsRUFBRTt3QkFDaEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztxQkFDL0I7b0JBQ0QsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQ2xELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQTtxQkFDL0I7b0JBQ0QsTUFBTTtnQkFFTixLQUFLLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDeEQsS0FBSyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsWUFBWTtvQkFDbEQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN0QyxNQUFNO2dCQUVSLEtBQUssdUJBQXVCLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQztnQkFDdEQsS0FBSyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ3BELElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVCLE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUM7Z0JBQzVELEtBQUssdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDO2dCQUN0RCxLQUFLLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztnQkFDcEQsS0FBSyx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7Z0JBQ3JELEtBQUssdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDO2dCQUN0RCxLQUFLLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQztnQkFDdEQsS0FBSyx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDdkQsSUFBSSxJQUFJLENBQUMsOEJBQThCLENBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7cUJBQzFCO29CQUNELE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUM7Z0JBQzlELEtBQUssdUJBQXVCLENBQUMsUUFBUSxDQUFDLDRCQUE0QjtvQkFDaEUsSUFBSSxJQUFJLENBQUMsOEJBQThCLENBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQ2hELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztxQkFDckM7b0JBQ0QsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQ2xELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQTtxQkFDL0I7b0JBQ0QsTUFBTTtnQkFDUixLQUFLLHVCQUF1QixDQUFDLFFBQVEsQ0FBQywwQkFBMEI7b0JBQzlELElBQUksSUFBSSxDQUFDLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUNoRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7cUJBQ3hDO29CQUVELE1BQU07Z0JBQ1IsS0FBSyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsc0JBQXNCO29CQUMxRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN0QyxNQUFNO2dCQUNSLEtBQUssdUJBQXVCLENBQUMsUUFBUSxDQUFDLHdCQUF3QjtvQkFDNUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDdkMsTUFBTTtnQkFDUjtvQkFDRSxPQUFPO2FBQ1Y7WUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzFCO1FBQUMsT0FBTyxLQUFVLEVBQUU7WUFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDekM7U0FDRjtJQUNILENBQUM7SUFDRDs7Ozs7O09BTUc7SUFFSCxpQkFBaUIsQ0FBQyxPQUFnQyxFQUFFLE9BQWdCO1FBQ2xFLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQztRQUN4RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXJELElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELElBQUksTUFBaUMsQ0FBQztRQUN0QyxJQUFJLE9BQU8sRUFBRTtZQUNYLE1BQU0sR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQztTQUNuRDthQUFNO1lBQ0wsTUFBTSxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUM7U0FDckQ7UUFDRCxJQUFJLGVBQWUsR0FDakIsU0FBUyxDQUFDLGVBQWUsQ0FBQyw2QkFBNkIsQ0FDckQsYUFBYSxFQUNiLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFDckIsTUFBTSxDQUNQLENBQUM7UUFDSixJQUFJLGVBQWUsWUFBWSxTQUFTLENBQUMsV0FBVyxFQUFFO1lBQ3BELElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDckM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFtQkQ7OztPQUdHO0lBQ0g7O09BRUc7SUFDSCxlQUFlLENBQUMsT0FBOEI7UUFFNUMsSUFBSTtZQUNGLElBQ0UsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFO2dCQUNqRCxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtvQkFDcEQsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFDMUQ7Z0JBQ0EsSUFDRSxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRTtvQkFDcEIsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUU7b0JBQzlCLElBQUksQ0FBQyxVQUFVLENBQUM7b0JBQ2xCLENBQUMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFO3dCQUNwQixPQUFPLENBQUMsa0JBQWtCLEVBQUU7d0JBQzVCLElBQUksQ0FBQyxlQUFlO3dCQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLEVBQ2xCO29CQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO3dCQUN4QixTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7NEJBQ3RDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3JELENBQUMsQ0FBQyxDQUFDO3FCQUNKO3lCQUFNO3dCQUNMLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO3dCQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtvQkFDRCxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNwRDtnQkFDRCxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDdEM7U0FDRjtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7UUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRDs7O09BR0c7SUFDSCxnQkFBZ0IsQ0FBQyxRQUErQjtRQUM5QyxJQUFJO1lBQ0YsSUFBSSxlQUFlLEdBQUcsUUFBUSxDQUFDO1lBQy9CLElBQUksV0FBVyxHQUE0QixDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xFLElBQUksVUFBVSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQ3BDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssZUFBZSxDQUFDLGtCQUFrQixFQUFFLENBQzFELENBQUM7WUFDRixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDbkIsSUFBSSxVQUFVLEdBQTBCLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRTtvQkFDekMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUU7b0JBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ04sVUFBVSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLFVBQVUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3JDLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDMUI7U0FDRjtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7SUFDSCxDQUFDO0lBeUVELFNBQVM7UUFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFO1lBQ2pDLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFO2dCQUMvQixxQkFBcUIsQ0FBQyxJQUFJLENBQ3hCLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQzNDLElBQUksQ0FBQyxzQkFBc0IsQ0FDNUIsQ0FBQzthQUNIO2lCQUFNO2dCQUNMLHFCQUFxQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7YUFDekU7U0FDRjtJQUNILENBQUM7SUFxQkQsdUJBQXVCO1FBQ3JCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzFCLElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkQsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyRCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNoQyxJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUMvQixJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2FBQzVEO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQzlCO1lBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBSTtnQkFDN0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRTtnQkFDaEUsQ0FBQyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3ZFO2FBQU07WUFDTCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7YUFDdkI7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDOUI7U0FDRjtRQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQVVELGlCQUFpQixDQUFDLE9BQThCO1FBQzlDLElBQUksT0FBTyxHQUFHLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDRCx1QkFBdUIsQ0FBQyxPQUFpQyxFQUFFLGlCQUEwQixLQUFLO1FBQ3hGLElBQUk7WUFDRixJQUFHLGNBQWMsRUFBQztnQkFDaEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQzFDLENBQUMsQ0FBd0IsRUFBRSxFQUFFLENBQzNCLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQzlDLENBQUM7Z0JBQ0YsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUU7b0JBQ25CLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsY0FBYyxDQUMxQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQ3pCLENBQUM7b0JBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDMUI7Z0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztnQkFFdEMsT0FBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsd0JBQXdCLElBQUssSUFBSSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN4SCxPQUFPLENBQUMsY0FBYyxFQUFFLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsSUFBSyxJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDL0c7aUJBQ0ksSUFDSCxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsRUFDNUQ7Z0JBQ0EsSUFDRSxPQUFPLENBQUMsY0FBYyxFQUFFLElBQUksdUJBQXVCLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFDckU7b0JBQ0Esb0JBQW9CO29CQUNwQixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FDMUMsQ0FBQyxDQUF3QixFQUFFLEVBQUUsQ0FDM0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FDOUMsQ0FBQztvQkFDRixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRTt3QkFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxjQUFjLENBQzFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FDekIsQ0FBQzt3QkFDRixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO3FCQUMxQjtvQkFDRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQzNDO3FCQUFNLElBQ0wsT0FBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQ2pFO29CQUNBLG9CQUFvQjtvQkFDcEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQzFDLENBQUMsQ0FBd0IsRUFBRSxFQUFFLENBQzNCLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQzlDLENBQUM7b0JBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUN0QzthQUNGO1NBQ0Y7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUN6QztTQUNGO1FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBQ0Q7O09BRUc7SUFDSCxtQkFBbUIsQ0FBQyxVQUFrQjtRQUNwQyxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUNyQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FDNUIscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUUsQ0FDekMsQ0FBQztnQkFDRixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzFCO1NBQ0Y7UUFDRCxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0Qsd0JBQXdCLENBQUMsVUFBa0I7UUFDekMsS0FBSyxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsRUFBRTtnQkFDMUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQ2pDLHFCQUFxQixDQUFDLGdCQUFnQixFQUFFLENBQ3pDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtTQUNGO0lBQ0gsQ0FBQztJQW9GRDs7O09BR0c7SUFDSDs7O09BR0c7SUFDSDs7T0FFRztJQUNILHFCQUFxQixDQUFDLE9BQThCO1FBQ2xELElBQUk7WUFDRixJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckMsSUFDRSxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUU7Z0JBQ2pELENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO29CQUNwRCxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUMxRDtnQkFDQSxJQUNFLENBQUMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFO29CQUNwQixDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtvQkFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDbEIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUU7d0JBQ3BCLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRTt3QkFDNUIsSUFBSSxDQUFDLGVBQWU7d0JBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsRUFDbEI7b0JBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7d0JBQ3hCLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTs0QkFDdEMsc0JBQXNCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDckQsQ0FBQyxDQUFDLENBQUM7cUJBQ0o7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7d0JBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7cUJBQzFCO2lCQUNGO2dCQUNELElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUM1QztpQkFBTSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUN0RSxJQUFJLENBQUMsNEJBQTRCLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDNUM7U0FDRjtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7UUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3pCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQXdFRDs7T0FFRztJQUNIOzs7T0FHRztJQUNILGVBQWUsQ0FDYixTQUE2QixFQUM3QixVQUE4QjtRQUU5QixJQUFJLFlBQWtCLEVBQUUsYUFBbUIsQ0FBQztRQUM1QyxZQUFZLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBVSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQzNDLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxVQUFXLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUNMLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxhQUFhLENBQUMsT0FBTyxFQUFFO1lBQ2xELFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxhQUFhLENBQUMsUUFBUSxFQUFFO1lBQ3BELFlBQVksQ0FBQyxXQUFXLEVBQUUsS0FBSyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQzNELENBQUM7SUFDSixDQUFDO0lBcUZEOzs7T0FHRztJQUNILGVBQWUsQ0FBQyxRQUFpQztRQUMvQyxJQUFJO1lBQ0YsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEdBQUcsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3hELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7WUFDN0MsSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7Z0JBQ2hDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2FBQ25DO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNuQixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtvQkFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2lCQUM1QjtnQkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsNkJBQTZCO1lBQ2xELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNwQixpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7b0JBQ3pDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7b0JBQ2pCLE9BQU8sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQ3ZDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxjQUFjO2lCQUN4QyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzthQUN2QjtTQUNGO1FBQUMsT0FBTyxLQUFVLEVBQUU7WUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQzFCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7SUFDSCxDQUFDO0lBQ0Q7O09BRUc7SUFDSCxRQUFRO1FBQ04sSUFBSSxPQUFPLEdBQUc7WUFDWixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxhQUFhO1lBQ3BDLFVBQVUsRUFBRSxxQkFBcUI7WUFDakMsU0FBUyxFQUFFLENBQUM7U0FDYixDQUFDO1FBQ0YsSUFBSSxRQUFRLEdBQUcsQ0FBQyxPQUFZLEVBQUUsRUFBRTtZQUM5QixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztZQUM1QyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ3hELFNBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUNwQyxDQUFDLEdBQTZCLEVBQUUsRUFBRTt3QkFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7d0JBQ3RCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUMxQyxDQUFDLENBQXdCLEVBQUUsRUFBRSxDQUMzQixDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUM1QyxDQUFDO3dCQUNGLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFOzRCQUNuQixJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7eUJBQ3RDO3dCQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ3pCLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ3pELENBQUMsQ0FDRixDQUFDO2lCQUNIO3FCQUFNO29CQUNMLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO29CQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2lCQUMxQjthQUNGO1FBQ0gsQ0FBQyxDQUFDO1FBQ0YsSUFBSSxRQUFRLEdBQXlCLElBQUksb0JBQW9CLENBQzNELFFBQVEsRUFDUixPQUFPLENBQ1IsQ0FBQztRQUNGLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0Q7O09BRUc7SUFDSCxLQUFLO1FBQ0gsSUFBSSxPQUFPLEdBQUc7WUFDWixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxhQUFhO1lBQ3BDLFVBQVUsRUFBRSxtQkFBbUI7WUFDL0IsU0FBUyxFQUFFLEdBQUc7U0FDZixDQUFDO1FBQ0YsSUFBSSxRQUFRLEdBQUcsQ0FBQyxPQUFZLEVBQUUsRUFBRTtZQUM5QixJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUU7Z0JBQzdCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN6QixJQUFJLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLEVBQUU7b0JBQzlCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2lCQUM5QjthQUNGO1FBQ0gsQ0FBQyxDQUFDO1FBQ0YsSUFBSSxRQUFRLEdBQXlCLElBQUksb0JBQW9CLENBQzNELFFBQVEsRUFDUixPQUFPLENBQ1IsQ0FBQztRQUNGLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBb0NEOzs7Ozs7T0FNRztJQUNILDJCQUEyQixDQUFDLE9BQThCO1FBQ3hELE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQztRQUM5QixJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEMsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZDLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDakQsT0FBTyxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ3JCLElBQUksSUFBSSxDQUFDO1lBQ1QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzlDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtvQkFDMUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDMUI7YUFDRjtZQUNELElBQUksSUFBSSxFQUFFO2dCQUNSLGNBQWMsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUNyQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQ1IsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQzFCLENBQUM7YUFDSDtZQUNELEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxjQUFjLENBQUM7SUFDeEIsQ0FBQztJQUVEOzs7T0FHRztJQUNIOztPQUVHO0lBQ0gsV0FBVyxDQUFDLFFBQStCO1FBQ3pDLElBQUksT0FBTyxHQUEwQixRQUFRLENBQUM7UUFDOUMsSUFBSSxXQUFXLEdBQTRCLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbEUsSUFBSSxVQUFVLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FDcEMsQ0FBQyxDQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUNoRSxDQUFDO1FBQ0YsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDbkIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQVdELGFBQWEsQ0FBQyxPQUE4QixFQUFFLE9BQWdCLEtBQUs7UUFDakUsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzNCO2FBQU07WUFDTCxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDbkM7SUFDSCxDQUFDO0lBaUJEOzs7OztPQUtHO0lBQ0gsa0JBQWtCLENBQUMsT0FBOEI7UUFDL0MsT0FBTztZQUNMLE1BQU0sRUFBRSxNQUFNO1lBQ2QsS0FBSyxFQUFFLE1BQU07WUFDYixNQUFNLEVBQUUsTUFBTTtZQUNkLFlBQVksRUFBRSxHQUFHO1lBQ2pCLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLGNBQWMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CO1lBQ3pELE9BQU8sRUFBRSxNQUFNO1lBQ2YsUUFBUSxFQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJO2dCQUNyRSxDQUFDLENBQUMsYUFBYTtnQkFDZixDQUFDLENBQUMsS0FBSztZQUNYLFVBQVUsRUFBRSxZQUFZO1lBQ3hCLGVBQWUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsb0JBQW9CO1lBQzVELGNBQWMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CO1lBQzFELFVBQVUsRUFBRSxNQUFNO1lBQ2xCLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLEdBQUcsRUFBRSxLQUFLO1NBQ1gsQ0FBQztJQUNKLENBQUM7SUFDRDs7Ozs7T0FLRztJQUNILFVBQVUsQ0FBQyxPQUE4QjtRQUN2QyxJQUFJLFFBQVEsR0FDVixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUU7WUFDckIsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFDOUQsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQW9DRCxlQUFlLENBQUMsT0FBOEI7UUFDNUMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLG9CQUFvQixDQUFDLElBQUksRUFBRTtZQUMvQyxPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxJQUNFLElBQUksQ0FBQyxLQUFLO2dCQUNWLE9BQU8sRUFBRSxXQUFXLEVBQUU7b0JBQ3RCLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxNQUFNO2dCQUM5QyxPQUFPLEVBQUUsU0FBUyxFQUFFO2dCQUNwQixPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxTQUFTLElBQUksb0JBQW9CLENBQUMsUUFBUSxFQUMvQztnQkFDQSxPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNO2dCQUNMLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7U0FDRjtJQUNILENBQUM7SUE4QkQ7O09BRUc7SUFDSCxpQkFBaUI7UUFDZixJQUFJLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQ3hELENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDZixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsMkJBQTJCLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2FBQ2pDO1lBQ0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFjLENBQUM7WUFDNUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxPQUFRLENBQUM7WUFDdkMsSUFBSSxnQkFBZ0IsR0FBSSxJQUFJLENBQUMsT0FBZSxFQUFFLFFBQVEsRUFBRSxDQUN0RCxxQkFBcUIsQ0FBQyxRQUFRLENBQy9CLEVBQUUsVUFBVSxFQUFFLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbkQsSUFBSSxJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksZ0JBQWdCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUU7Z0JBQzlHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzFCO1FBQ0gsQ0FBQyxDQUNGLENBQUM7UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQzlELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxhQUFhLEdBQUcsc0JBQXNCLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FDakUsQ0FBQyxPQUE4QixFQUFFLEVBQUU7WUFDakMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUU7Z0JBQzNDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztnQkFDckUsd0RBQXdEO2dCQUN4RCx1Q0FBdUM7Z0JBQ3ZDLG9DQUFvQztnQkFDcEMsSUFBSTthQUNMO1FBQ0gsQ0FBQyxDQUNGLENBQUM7UUFDRixJQUFJLENBQUMsa0JBQWtCLEdBQUcsb0JBQW9CLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUN6RSxDQUFDLElBQXVCLEVBQUUsRUFBRTtZQUMxQixJQUFJLENBQUM7WUFDTCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFTLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQ0YsQ0FBQztRQUNGLElBQUksQ0FBQyxtQkFBbUI7WUFDdEIsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUNoRCxDQUFDLElBQThCLEVBQUUsRUFBRTtnQkFDakMsSUFBSSxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFRLENBQUMsQ0FBQztpQkFDaEM7WUFDSCxDQUFDLENBQ0YsQ0FBQztRQUNKLElBQUksQ0FBQyxtQkFBbUI7WUFDdEIsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUNoRCxDQUFDLElBQThCLEVBQUUsRUFBRTtnQkFDakMsSUFBSSxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFRLENBQUMsQ0FBQztpQkFDaEM7WUFDSCxDQUFDLENBQ0YsQ0FBQztRQUNKLElBQUksQ0FBQyx5QkFBeUI7WUFDNUIsb0JBQW9CLENBQUMseUJBQXlCLENBQUMsU0FBUyxDQUN0RCxDQUFDLElBQThCLEVBQUUsRUFBRTtnQkFDakMsSUFBSSxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFRLENBQUMsQ0FBQztpQkFDaEM7WUFDSCxDQUFDLENBQ0YsQ0FBQztRQUNKLElBQUksQ0FBQyxXQUFXLEdBQUcsb0JBQW9CLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FDM0QsQ0FBQyxJQUFnQixFQUFFLEVBQUU7WUFDbkIsSUFBSSxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFRLENBQUMsQ0FBQzthQUNoQztRQUNILENBQUMsQ0FDRixDQUFDO1FBQ0YsSUFBSSxDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUNuRSxDQUFDLE1BQWlCLEVBQUUsRUFBRTtZQUNwQixJQUFJLE1BQU0sRUFBRSxNQUFNLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRTtnQkFDM0MsSUFBSSxJQUFJLENBQUMsOEJBQThCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUN2RCxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxPQUFRLENBQUMsQ0FBQztpQkFDckM7YUFDRjtRQUNILENBQUMsQ0FDRixDQUFDO1FBQ0YsSUFBSSxDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUNqRSxDQUFDLEdBQWMsRUFBRSxFQUFFO1lBQ2pCLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRTtnQkFDZixJQUFJLE9BQU8sR0FBMEIsR0FBRyxDQUFDLE9BQVEsQ0FBQztnQkFDbEQsUUFBUSxHQUFHLENBQUMsTUFBTSxFQUFFO29CQUNsQixLQUFLLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDN0IsSUFBSSxJQUFJLENBQUMsNkJBQTZCLENBQUMsT0FBTyxDQUFDLEVBQUU7NEJBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBRTFCO3dCQUNELE1BQU07cUJBQ1A7b0JBQ0QsS0FBSyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzFCLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7d0JBQ3JDLElBQUksQ0FBQywwQkFBMEIsR0FBRyxFQUFFLENBQUM7d0JBQ3JDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7d0JBQ3JDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLENBQUM7d0JBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ3pCLElBQUksSUFBSSxDQUFDLCtCQUErQixDQUFDLE9BQU8sQ0FBQyxFQUFFOzRCQUNqRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBQ2hDO3dCQUNELElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUNsQyxNQUFNO3FCQUNQO29CQUNELEtBQUssYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxPQUFPLENBQUMsRUFBRTs0QkFDdkUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFDN0I7cUJBQ0Y7aUJBQ0Y7YUFFRjtRQUNILENBQUMsQ0FDRixDQUFDO1FBQ0YsSUFBSSxDQUFDLGVBQWUsR0FBRyxzQkFBc0IsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQ3RFLENBQUMsYUFBb0MsRUFBRSxFQUFFO1lBQ3ZDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQ0YsQ0FBQztRQUNGLElBQUksQ0FBQyxXQUFXLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FDMUQsQ0FBQyxJQUFvQixFQUFFLEVBQUU7WUFDdkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDcEIsSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN4QyxJQUFJLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDNUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDdkI7YUFDRjtZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUNGLENBQUM7UUFDRixJQUFJLENBQUMsY0FBYyxHQUFHLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQ2hFLENBQUMsSUFBb0IsRUFBRSxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO1FBQ0gsQ0FBQyxDQUNGLENBQUM7UUFDRixJQUFJLENBQUMsY0FBYyxHQUFHLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQ2hFLENBQUMsSUFBb0IsRUFBRSxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO1FBQ0gsQ0FBQyxDQUNGLENBQUM7UUFDRixJQUFJLENBQUMsY0FBYyxHQUFHLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQ2hFLENBQUMsSUFBb0IsRUFBRSxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO1FBQ0gsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0lBV0QsY0FBYyxDQUFDLE9BQThCO1FBQzNDLElBQ0UsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTTtZQUNyRCxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDdkIsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSTtZQUNuRCxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQ3BCO1lBQ0EsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsT0FBTyxLQUFLLENBQUM7U0FDZDtJQUNILENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxPQUE4QixFQUFFLGNBQXVCLEVBQUUsV0FBb0I7UUFDN0YsT0FBTyxDQUNMLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUN2QixDQUFDLENBQUMsY0FBYyxJQUFJLFdBQVcsQ0FBQztZQUNoQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQ3RGLE9BQU8sQ0FBQyxXQUFXLEVBQUUsS0FBSyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU07WUFDckQsT0FBTyxDQUFDLFdBQVcsRUFBRSxLQUFLLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUNwRCxDQUFDO0lBQ0osQ0FBQztJQXNCRCx3QkFBd0I7UUFDdEIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQztRQUNwQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUMvQyxJQUFJLFlBQVksR0FBVyxJQUFJLENBQUMsSUFBSTtZQUNsQyxDQUFDLENBQUMsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsSUFBSTtZQUNsRCxDQUFDLENBQUMsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1FBQ3RELElBQUksVUFBVSxHQUFXLElBQUksQ0FBQyxJQUFJO1lBQ2hDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNwQixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN6QixTQUFTLENBQUMsc0JBQXNCLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQzthQUN2RCxJQUFJLENBQUMsQ0FBQyxRQUFhLEVBQUUsRUFBRTtZQUN0QixJQUFJLFFBQVEsRUFBRTtnQkFDWixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO29CQUN0QyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFO3dCQUM1QyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3FCQUN2RDtnQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUNFLElBQUksQ0FBQywwQkFBMEI7b0JBQy9CLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEdBQUcsQ0FBQztvQkFDMUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLElBQUksQ0FBQyxFQUM5QjtvQkFDQSxJQUFJLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztvQkFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDMUI7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLHdCQUF3QixHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBQzdDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7aUJBQzFCO2FBQ0Y7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLHdCQUF3QixHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDMUI7UUFDSCxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsQ0FBQyxHQUFpQyxFQUFFLEVBQUU7WUFDM0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ25CO1lBQ0QsSUFBSSxDQUFDLHdCQUF3QixHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCx3QkFBd0I7UUFDdEIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQztRQUNwQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXpCLElBQUksWUFBWSxHQUFXLElBQUksQ0FBQyxJQUFJO1lBQ2xDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJO1lBQ2xELENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7UUFDdEQsSUFBSSxVQUFVLEdBQVcsSUFBSSxDQUFDLElBQUk7WUFDaEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXpCLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBRTdDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixDQUFDO2FBQ3pFLElBQUksQ0FBQyxDQUFDLFFBQWEsRUFBRSxFQUFFO1lBQ3RCLGlEQUFpRDtZQUNqRCxJQUFJLFFBQVEsRUFBRTtnQkFDWixJQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QztZQUNELElBQUksSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNuRSxJQUFJLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMxQjtRQUNILENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLEdBQWlDLEVBQUUsRUFBRTtZQUMzQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbkI7WUFDRCxJQUFJLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUM3QyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7SUFDbEMsQ0FBQztJQUVELFVBQVU7UUFDUixJQUFJLFVBQVUsR0FBUSxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDN0MsSUFBSSxnQkFBZ0IsR0FDbEIsVUFBVSxFQUFFLFFBQVEsRUFBRSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUNwRSxxQkFBcUIsQ0FBQyxXQUFXLENBQ2hDLENBQUM7UUFDSixJQUNFLGdCQUFnQixFQUFFLGNBQWM7WUFDaEMsZ0JBQWdCLEVBQUUsYUFBYTtZQUMvQixnQkFBZ0IsRUFBRSxjQUFjLEVBQ2hDO1lBQ0EsSUFBSSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLEdBQUcsZ0JBQWdCLENBQUM7WUFDekUsT0FBTyxDQUFDLGNBQWMsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDeEQ7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRDs7T0FFRztJQUNILG1CQUFtQjtRQUNqQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDOUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsY0FBYyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFDSCxzQkFBc0IsQ0FBQyxPQUE4QjtRQUNuRCxJQUFJLFFBQVEsR0FDVixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsU0FBUyxLQUFLLG9CQUFvQixDQUFDLFFBQVEsQ0FBQztRQUNuRCxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQTZPRDs7OztPQUlHO0lBQ0gsNEJBQTRCO1FBQzFCLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDO1lBQ2xDLFlBQVksRUFBRSxLQUFLO1lBQ25CLEtBQUssRUFBRSxNQUFNO1lBQ2IsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQy9ELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQzdELGNBQWMsRUFBRSxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN0RSxvQkFBb0IsRUFBRSxHQUFHO1lBQ3pCLHFCQUFxQixFQUFFLEdBQUc7WUFDMUIsb0JBQW9CLEVBQUUsRUFBRTtZQUN4QixzQkFBc0IsRUFBRSxHQUFHO1NBQzVCLENBQUMsQ0FBQztRQUNILE1BQU0sYUFBYSxHQUFHLElBQUksYUFBYSxDQUFDO1lBQ3RDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDakUsZUFBZSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDaEUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ25FLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3ZELGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1NBQy9ELENBQUMsQ0FBQztRQUNILE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQztZQUNqRCxLQUFLLEVBQUUsT0FBTztZQUNkLE1BQU0sRUFBRSxPQUFPO1lBQ2YsWUFBWSxFQUFFLE1BQU07WUFDcEIsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDM0QsTUFBTSxFQUFFLE1BQU07WUFDZCxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUM3RCxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUMvRCxvQkFBb0IsRUFBRSxVQUFVLENBQzlCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQ3pDO1lBQ0QsZUFBZSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3JFLGlCQUFpQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDakUsZ0JBQWdCLEVBQUUsVUFBVSxDQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUM3QztZQUNELFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUNuRSxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUMzRCxxQkFBcUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ3JFLHFCQUFxQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7U0FDdEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFJLHlCQUF5QixDQUFDO1lBQ25DLFdBQVcsRUFDVCxJQUFJLENBQUMsc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsV0FBVztnQkFDbkUsV0FBVztZQUNiLFlBQVksRUFDVixJQUFJLENBQUMsc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsWUFBWTtnQkFDcEUsRUFBRTtZQUNKLGFBQWEsRUFDWCxJQUFJLENBQUMsc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsYUFBYTtnQkFDckUsYUFBYTtZQUNmLGNBQWMsRUFDWixJQUFJLENBQUMsc0JBQXNCLEVBQUUseUJBQXlCO2dCQUNwRCxFQUFFLGNBQWMsSUFBSSxFQUFFO1lBQzFCLGlCQUFpQixFQUNmLElBQUksQ0FBQyxzQkFBc0IsRUFBRSx5QkFBeUI7Z0JBQ3BELEVBQUUsaUJBQWlCLElBQUksb0JBQW9CO1lBQy9DLG1CQUFtQixFQUNqQixJQUFJLENBQUMsc0JBQXNCLEVBQUUseUJBQXlCO2dCQUNwRCxFQUFFLG1CQUFtQixJQUFJLElBQUksQ0FBQyxxQkFBcUI7WUFDdkQsdUJBQXVCLEVBQ3JCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSx5QkFBeUI7Z0JBQ3BELEVBQUUsdUJBQXVCLElBQUksU0FBUztTQUMzQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBK0JEOzs7O09BSUc7SUFFSCw0QkFBNEI7UUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLHlCQUF5QixJQUFJLEVBQUUsQ0FBQztRQUM1RSxNQUFNLGlCQUFpQixHQUFHLElBQUksaUJBQWlCLENBQUM7WUFDOUMsVUFBVSxFQUNSLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxVQUFVO2dCQUNyQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQzdDLE1BQU0sRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxJQUFJLE1BQU07WUFDbkQsWUFBWSxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxZQUFZLElBQUksTUFBTTtZQUMvRCxhQUFhLEVBQ1gsTUFBTSxFQUFFLGlCQUFpQixFQUFFLGFBQWE7Z0JBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDakQsZUFBZSxFQUNiLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxlQUFlO2dCQUMxQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO1lBQ2pELFVBQVUsRUFDUixNQUFNLEVBQUUsaUJBQWlCLEVBQUUsVUFBVTtnQkFDckMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUNqRCxTQUFTLEVBQ1AsTUFBTSxFQUFFLGlCQUFpQixFQUFFLFNBQVM7Z0JBQ3BDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQzFELGdCQUFnQixFQUNkLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0I7Z0JBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO1lBQ3RELGVBQWUsRUFDYixNQUFNLEVBQUUsaUJBQWlCLEVBQUUsZUFBZTtnQkFDMUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDMUQsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixJQUFJLE1BQU07U0FDeEUsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLHlCQUF5QixDQUFDO1lBQ25DLGlCQUFpQixFQUFFLGlCQUFpQjtZQUNwQyx1QkFBdUIsRUFBRSxNQUFNLEVBQUUsdUJBQXVCLElBQUksU0FBUztZQUNyRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFlBQVksSUFBSSxFQUFFO1lBQ3hDLGNBQWMsRUFBRSxNQUFNLEVBQUUsY0FBYyxJQUFJLEVBQUU7U0FDN0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXdERDs7O09BR0c7SUFDSCx3QkFBd0IsQ0FBQyxPQUE4QjtRQUNyRCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsT0FBTztZQUNMLEtBQUssRUFBRSxNQUFNO1lBQ2IsVUFBVSxFQUFFLEtBQUs7WUFDakIsU0FBUyxFQUFFLFlBQVk7WUFDdkIsT0FBTyxFQUFFLE1BQU07WUFDZixTQUFTLEVBQUUsTUFBTTtZQUNqQixjQUFjLEVBQ1osU0FBUyxLQUFLLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxVQUFVO1NBQ3hFLENBQUM7SUFDSixDQUFDO0lBbUJELHNCQUFzQixDQUFDLE9BQThCO1FBQ25ELE9BQU87WUFDTCxPQUFPLEVBQUUsTUFBTTtZQUNmLGNBQWMsRUFDWixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRO2dCQUMvQyxDQUFDLENBQUMsVUFBVTtnQkFDWixDQUFDLENBQUMsWUFBWTtTQUNuQixDQUFDO0lBQ0osQ0FBQzs7MkhBbnNKVSw2QkFBNkI7K0dBQTdCLDZCQUE2QixzaEhDeEkxQyxxbTJCQThpQkE7NEZEdGFhLDZCQUE2QjtrQkFOekMsU0FBUzsrQkFDRSx3QkFBd0IsbUJBR2pCLHVCQUF1QixDQUFDLE1BQU07aUtBSUgsVUFBVTtzQkFBckQsU0FBUzt1QkFBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUNGLE1BQU07c0JBQTdDLFNBQVM7dUJBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDRCxHQUFHO3NCQUF2QyxTQUFTO3VCQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7Z0JBQ1MsVUFBVTtzQkFBckQsU0FBUzt1QkFBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUUxQyxtQkFBbUI7c0JBRGxCLFNBQVM7dUJBQUMscUJBQXFCLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUVQLFVBQVU7c0JBQXJELFNBQVM7dUJBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDRyxXQUFXO3NCQUF2RCxTQUFTO3VCQUFDLGFBQWEsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7Z0JBQ0UsV0FBVztzQkFBdkQsU0FBUzt1QkFBQyxhQUFhLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUNFLFdBQVc7c0JBQXZELFNBQVM7dUJBQUMsYUFBYSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDQyxVQUFVO3NCQUFyRCxTQUFTO3VCQUFDLFlBQVksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7Z0JBQ0UsVUFBVTtzQkFBckQsU0FBUzt1QkFBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUUxQyxhQUFhO3NCQURaLFNBQVM7dUJBQUMsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFHN0MsY0FBYztzQkFEYixTQUFTO3VCQUFDLGdCQUFnQixFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFHOUMsZ0JBQWdCO3NCQURmLFNBQVM7dUJBQUMsa0JBQWtCLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUVKLFVBQVU7c0JBQXJELFNBQVM7dUJBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFFMUMsYUFBYTtzQkFEWixTQUFTO3VCQUFDLGVBQWUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7Z0JBRzdDLGVBQWU7c0JBRGQsU0FBUzt1QkFBQyxpQkFBaUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7Z0JBRUgsVUFBVTtzQkFBckQsU0FBUzt1QkFBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUNSLGdCQUFnQjtzQkFBakQsWUFBWTt1QkFBQyxrQkFBa0I7Z0JBRXZCLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFNRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLDJCQUEyQjtzQkFBbkMsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBRUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBS0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUdHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQUlHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFLRyxPQUFPO3NCQUFmLEtBQUs7Z0JBS0csK0JBQStCO3NCQUF2QyxLQUFLO2dCQUVHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBbU5HLGNBQWM7c0JBQXRCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBcHBsaWNhdGlvblJlZixcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIFF1ZXJ5TGlzdCxcbiAgUmVuZGVyZXIyLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3Q2hpbGRyZW4sXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgQmFja2Ryb3BTdHlsZSxcbiAgQmFzZVN0eWxlLFxuICBDYWxsc2NyZWVuU3R5bGUsXG4gIENoZWNrYm94U3R5bGUsXG4gIENvbmZpcm1EaWFsb2dTdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBEb2N1bWVudEJ1YmJsZVN0eWxlLFxuICBEcm9wZG93blN0eWxlLFxuICBFbW9qaUtleWJvYXJkU3R5bGUsXG4gIEZ1bGxTY3JlZW5WaWV3ZXJTdHlsZSxcbiAgSW5wdXRTdHlsZSxcbiAgTGFiZWxTdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbiAgTWVudUxpc3RTdHlsZSxcbiAgUGFuZWxTdHlsZSxcbiAgUXVpY2tWaWV3U3R5bGUsXG4gIFJhZGlvQnV0dG9uU3R5bGUsXG4gIFJlY2VpcHRTdHlsZSxcbiAgU2luZ2xlU2VsZWN0U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQge1xuICBDYWxlbmRhclN0eWxlLFxuICBDYWxsaW5nRGV0YWlsc1V0aWxzLFxuICBDYXJkQnViYmxlU3R5bGUsXG4gIENvbGxhYm9yYXRpdmVEb2N1bWVudENvbnN0YW50cyxcbiAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbiAgVGltZVNsb3RTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBGb3JtQnViYmxlU3R5bGUsXG4gIEltYWdlTW9kZXJhdGlvblN0eWxlLFxuICBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscyxcbiAgTGlua1ByZXZpZXdDb25zdGFudHMsXG4gIE1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24sXG4gIE1lc3NhZ2VMaXN0U3R5bGUsXG4gIE1lc3NhZ2VSZWNlaXB0VXRpbHMsXG4gIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cyxcbiAgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUsXG4gIFBvbGxzQnViYmxlU3R5bGUsXG4gIFNjaGVkdWxlckJ1YmJsZVN0eWxlLFxuICBTbWFydFJlcGxpZXNDb25maWd1cmF0aW9uLFxuICBTbWFydFJlcGxpZXNDb25zdGFudHMsXG4gIFNtYXJ0UmVwbGllc1N0eWxlLFxuICBUaHVtYm5haWxHZW5lcmF0aW9uQ29uc3RhbnRzLFxuICBSZWFjdGlvbnNTdHlsZSxcbiAgUmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbixcbiAgUmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbixcbiAgUmVhY3Rpb25MaXN0U3R5bGUsXG4gIFJlYWN0aW9uSW5mb1N0eWxlLFxuICBSZWFjdGlvbnNDb25maWd1cmF0aW9uLFxuICBVc2VyTWVudGlvblN0eWxlLFxuICBDb21ldENoYXRVcmxzRm9ybWF0dGVyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBVcmxGb3JtYXR0ZXJTdHlsZSxcbiAgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lcixcbiAgU3RvcmFnZVV0aWxzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIENhcmRNZXNzYWdlLFxuICBDb21ldENoYXRDYWxsRXZlbnRzLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbixcbiAgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlLFxuICBDb21ldENoYXRUaGVtZSxcbiAgQ29tZXRDaGF0VUlFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gIERhdGVQYXR0ZXJucyxcbiAgRG9jdW1lbnRJY29uQWxpZ25tZW50LFxuICBGb3JtTWVzc2FnZSxcbiAgSUdyb3VwTGVmdCxcbiAgSUdyb3VwTWVtYmVyQWRkZWQsXG4gIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCxcbiAgSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLFxuICBJTWVzc2FnZXMsXG4gIElQYW5lbCxcbiAgTWVzc2FnZUJ1YmJsZUFsaWdubWVudCxcbiAgTWVzc2FnZUxpc3RBbGlnbm1lbnQsXG4gIE1lc3NhZ2VTdGF0dXMsXG4gIFBsYWNlbWVudCxcbiAgU2NoZWR1bGVyTWVzc2FnZSxcbiAgU3RhdGVzLFxuICBUaW1lc3RhbXBBbGlnbm1lbnQsXG4gIGZvbnRIZWxwZXIsXG4gIGxvY2FsaXplLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFVJS2l0Q2FsbHMsXG4gIExpbmtQcmV2aWV3U3R5bGUsXG4gIFN0aWNrZXJzQ29uc3RhbnRzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdCB9IGZyb20gXCIuLi8uLi9TaGFyZWQvQ29tZXRDaGF0VUlraXQvQ29tZXRDaGF0VUlLaXRcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiwgaXNFbXB0eSB9IGZyb20gXCJyeGpzXCI7XG5cbi8qKlxuICpcbiAqIENvbWV0Q2hhdE1lc3NhZ2VMaXN0IGlzIGEgd3JhcHBlciBjb21wb25lbnQgZm9yIG1lc3NhZ2VCdWJibGVcbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtbWVzc2FnZS1saXN0XCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VMaXN0Q29tcG9uZW50XG4gIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XG4gIEBWaWV3Q2hpbGQoXCJsaXN0U2Nyb2xsXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBsaXN0U2Nyb2xsITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImJvdHRvbVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYm90dG9tITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInRvcFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgdG9wITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInRleHRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHRleHRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwidGhyZWFkTWVzc2FnZUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgdGhyZWFkTWVzc2FnZUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJmaWxlQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBmaWxlQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImF1ZGlvQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBhdWRpb0J1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJ2aWRlb0J1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgdmlkZW9CdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiaW1hZ2VCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGltYWdlQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImZvcm1CdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGZvcm1CdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiY2FyZEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgY2FyZEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJzdGlja2VyQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBzdGlja2VyQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImRvY3VtZW50QnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBkb2N1bWVudEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJ3aGl0ZWJvYXJkQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICB3aGl0ZWJvYXJkQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInBvcG92ZXJSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHBvcG92ZXJSZWYhOiBhbnk7XG4gIEBWaWV3Q2hpbGQoXCJkaXJlY3RDYWxsaW5nXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBkaXJlY3RDYWxsaW5nITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInNjaGVkdWxlckJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgc2NoZWR1bGVyQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInBvbGxCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHBvbGxCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkcmVuKFwibWVzc2FnZUJ1YmJsZVJlZlwiKSBtZXNzYWdlQnViYmxlUmVmITogUXVlcnlMaXN0PEVsZW1lbnRSZWY+O1xuXG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBoaWRlRGF0ZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWRcbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjE2IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAnaGlkZVJlY2VpcHQnLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgICovXG4gIEBJbnB1dCgpIGRpc2FibGVSZWNlaXB0OiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGhpZGVSZWNlaXB0OiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvck1lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGN1c3RvbVNvdW5kRm9yTWVzc2FnZXM6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIHJlYWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXJlYWQuc3ZnXCI7XG4gIEBJbnB1dCgpIGRlbGl2ZXJlZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtZGVsaXZlcmVkLnN2Z1wiO1xuICBASW5wdXQoKSBzZW50SWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1zZW50LnN2Z1wiO1xuICBASW5wdXQoKSB3YWl0SWNvbjogc3RyaW5nID0gXCJhc3NldHMvd2FpdC5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JJY29uOiBzdHJpbmcgPSBcImFzc2V0cy93YXJuaW5nLXNtYWxsLnN2Z1wiO1xuICBASW5wdXQoKSBhaUVycm9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvYWktZXJyb3Iuc3ZnXCI7XG4gIEBJbnB1dCgpIGFpRW1wdHlJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9haS1lbXB0eS5zdmdcIjtcbiAgQElucHV0KCkgYWxpZ25tZW50OiBNZXNzYWdlTGlzdEFsaWdubWVudCA9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkO1xuICBASW5wdXQoKSBzaG93QXZhdGFyOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy50aW1lO1xuICBASW5wdXQoKSB0aW1lc3RhbXBBbGlnbm1lbnQ6IFRpbWVzdGFtcEFsaWdubWVudCA9IFRpbWVzdGFtcEFsaWdubWVudC5ib3R0b207XG4gIEBJbnB1dCgpIERhdGVTZXBhcmF0b3JQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIHRlbXBsYXRlczogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlW10gPSBbXTtcbiAgQElucHV0KCkgbWVzc2FnZXNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBuZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRocmVzaG9sZFZhbHVlOiBudW1iZXIgPSAxMDAwO1xuICBASW5wdXQoKSB1bnJlYWRNZXNzYWdlVGhyZXNob2xkOiBudW1iZXIgPSAzMDtcbiAgQElucHV0KCkgcmVhY3Rpb25zQ29uZmlndXJhdGlvbjogUmVhY3Rpb25zQ29uZmlndXJhdGlvbiA9XG4gICAgbmV3IFJlYWN0aW9uc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBkaXNhYmxlUmVhY3Rpb25zOiBCb29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGVtb2ppS2V5Ym9hcmRTdHlsZTogRW1vamlLZXlib2FyZFN0eWxlID0ge307XG4gIEBJbnB1dCgpIGFwaUNvbmZpZ3VyYXRpb24/OiAoXG4gICAgdXNlcj86IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwXG4gICkgPT4gUHJvbWlzZTxPYmplY3Q+O1xuXG4gIEBJbnB1dCgpIG9uVGhyZWFkUmVwbGllc0NsaWNrITpcbiAgICB8ICgobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+KSA9PiB2b2lkKVxuICAgIHwgbnVsbDtcbiAgQElucHV0KCkgaGVhZGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGZvb3RlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBwYXJlbnRNZXNzYWdlSWQhOiBudW1iZXI7XG4gIEBJbnB1dCgpIHRocmVhZEluZGljYXRvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3RocmVhZEluZGljYXRvckljb24uc3ZnXCI7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICB9O1xuICBASW5wdXQoKSBiYWNrZHJvcFN0eWxlOiBCYWNrZHJvcFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiYSgwLCAwLCAwLCAwLjUpXCIsXG4gICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgfTtcbiAgQElucHV0KCkgZGF0ZVNlcGFyYXRvclN0eWxlOiBEYXRlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIHdpZHRoOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBtZXNzYWdlTGlzdFN0eWxlOiBNZXNzYWdlTGlzdFN0eWxlID0ge1xuICAgIG5hbWVUZXh0Rm9udDogXCI0MDAgMTFweCBJbnRlclwiLFxuICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICAgIGVycm9yU3RhdGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICB9O1xuICBASW5wdXQoKSBvbkVycm9yOiAoKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkKSB8IG51bGwgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuICBASW5wdXQoKSBtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uOiBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uID1cbiAgICBuZXcgTWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbih7fSk7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIG9wdGlvbnNTdHlsZTogTWVudUxpc3RTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgbW9yZUljb25UaW50OiBcImdyZXlcIixcbiAgfTtcbiAgcmVjZWlwdFN0eWxlOiBSZWNlaXB0U3R5bGUgPSB7fTtcbiAgZG9jdW1lbnRCdWJibGVBbGlnbm1lbnQ6IERvY3VtZW50SWNvbkFsaWdubWVudCA9IERvY3VtZW50SWNvbkFsaWdubWVudC5yaWdodDtcbiAgY2FsbEJ1YmJsZUFsaWdubWVudDogRG9jdW1lbnRJY29uQWxpZ25tZW50ID0gRG9jdW1lbnRJY29uQWxpZ25tZW50LmxlZnQ7XG4gIGltYWdlTW9kZXJhdGlvblN0eWxlOiBJbWFnZU1vZGVyYXRpb25TdHlsZSA9IHt9O1xuICB0aW1lc3RhbXBFbnVtOiB0eXBlb2YgVGltZXN0YW1wQWxpZ25tZW50ID0gVGltZXN0YW1wQWxpZ25tZW50O1xuICBwdWJsaWMgY2hhdENoYW5nZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICBzdGFydGVyRXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBzdGFydGVyRW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIHN0YXJ0ZXJMb2FkaW5nU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdFTkVSQVRJTkdfSUNFQlJFQUtFUlNcIik7XG4gIHN1bW1hcnlFcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIHN1bW1hcnlFbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgc3VtbWFyeUxvYWRpbmdTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiR0VORVJBVElOR19TVU1NQVJZXCIpO1xuICAvLyBwdWJsaWMgcHJvcGVydGllc1xuICBwdWJsaWMgcmVxdWVzdEJ1aWxkZXI6IGFueTtcbiAgcHVibGljIGNsb3NlSW1hZ2VNb2RlcmF0aW9uOiBhbnk7XG4gIHB1YmxpYyB0aW1lU3RhbXBDb2xvcjogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHRpbWVTdGFtcEZvbnQ6IHN0cmluZyA9IFwiXCI7XG4gIHNtYXJ0UmVwbHlTdHlsZTogU21hcnRSZXBsaWVzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcbiAgY29udmVyc2F0aW9uU3RhcnRlclN0eWxlOiBTbWFydFJlcGxpZXNTdHlsZSA9IHt9O1xuICBjb252ZXJzYXRpb25TdW1tYXJ5U3R5bGU6IFBhbmVsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBjbG9zZUljb25UaW50OiBcIlwiLFxuICAgIGJveFNoYWRvdzogXCJcIixcbiAgICB0ZXh0Rm9udDogXCJcIixcbiAgICB0ZXh0Q29sb3I6IFwiXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgfTtcblxuICBwdWJsaWMgc2hvd1NtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHNob3dDb252ZXJzYXRpb25TdGFydGVyOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdGFydGVyU3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXM6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBlbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzaG93Q29udmVyc2F0aW9uU3VtbWFyeTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIGNvbnZlcnNhdGlvblN1bW1hcnk6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBnZXRVbnJlYWRDb3VudDogYW55ID0gMDtcblxuICBjY0hpZGVQYW5lbCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NTaG93UGFuZWwhOiBTdWJzY3JpcHRpb247XG4gIHNtYXJ0UmVwbHlNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVuYWJsZVNtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc21hcnRSZXBseUNvbmZpZyE6IFNtYXJ0UmVwbGllc0NvbmZpZ3VyYXRpb247XG4gIHB1YmxpYyB0aW1lU3RhbXBCYWNrZ3JvdW5kOiBzdHJpbmcgPSBcIlwiO1xuICBsaW5rUHJldmlld1N0eWxlOiBMaW5rUHJldmlld1N0eWxlID0ge307XG4gIHB1YmxpYyB1bnJlYWRNZXNzYWdlc1N0eWxlID0ge307XG4gIHB1YmxpYyBtb2RhbFN0eWxlID0ge1xuICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgIHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG4gICAgY2xvc2VJY29uVGludDogXCJibHVlXCIsXG4gIH07XG4gIHB1YmxpYyBkaXZpZGVyU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMXB4XCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiZ3JleVwiLFxuICB9O1xuICBwb2xsQnViYmxlU3R5bGU6IFBvbGxzQnViYmxlU3R5bGUgPSB7fTtcbiAgbGFiZWxTdHlsZTogYW55ID0ge1xuICAgIHRleHRGb250OiBcIjQwMCAxMXB4IEludGVyXCIsXG4gICAgdGV4dENvbG9yOiBcImdyZXlcIixcbiAgfTtcbiAgaW1hZ2VCdWJibGVTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCJhdXRvXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweCA4cHggMHB4IDBweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgbWVzc2FnZXNMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFtdO1xuICBidWJibGVEYXRlU3R5bGU6IERhdGVTdHlsZSA9IHt9O1xuICB3aGl0ZWJvYXJkSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY29sbGFib3JhdGl2ZXdoaXRlYm9hcmQuc3ZnXCI7XG4gIGRvY3VtZW50SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY29sbGFib3JhdGl2ZWRvY3VtZW50LnN2Z1wiO1xuICBkaXJlY3RDYWxsSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvVmlkZW8tY2FsbDJ4LnN2Z1wiO1xuICBwbGFjZWhvbGRlckljb25VUkw6IHN0cmluZyA9IFwiL2Fzc2V0cy9wbGFjZWhvbGRlci5wbmdcIjtcbiAgZG93bmxvYWRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9kb3dubG9hZC5zdmdcIjtcbiAgdHJhbnNsYXRpb25TdHlsZTogTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUgPSB7fTtcbiAgZG9jdW1lbnRCdWJibGVTdHlsZTogRG9jdW1lbnRCdWJibGVTdHlsZSA9IHt9O1xuICBjYWxsQnViYmxlU3R5bGU6IERvY3VtZW50QnViYmxlU3R5bGUgPSB7fTtcbiAgd2hpdGVib2FyZFRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNPTExBQk9SQVRJVkVfV0hJVEVCT0FSRFwiKTtcbiAgd2hpdGVib2FyZFN1Yml0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiRFJBV19XSElURUJPQVJEX1RPR0VUSEVSXCIpO1xuICB3aGl0ZWJvYXJkQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJPUEVOX1dISVRFQk9BUkRcIik7XG4gIGRvY3VtZW50VGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ09MTEFCT1JBVElWRV9ET0NVTUVOVFwiKTtcbiAgZG9jdW1lbnRTdWJpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRSQVdfRE9DVU1FTlRfVE9HRVRIRVJcIik7XG4gIGRvY3VtZW50QnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJPUEVOX0RPQ1VNRU5UXCIpO1xuICBqb2luQ2FsbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSk9JTlwiKTtcbiAgdG9wT2JzZXJ2ZXIhOiBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbiAgYm90dG9tT2JzZXJ2ZXIhOiBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbiAgbG9jYWxpemU6IHR5cGVvZiBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICByZWluaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG4gIGFkZFJlYWN0aW9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYWRkcmVhY3Rpb24uc3ZnXCI7XG4gIE1lc3NhZ2VUeXBlc0NvbnN0YW50OiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzID1cbiAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXM7XG4gIGNhbGxDb25zdGFudDogc3RyaW5nID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGw7XG4gIHB1YmxpYyB0eXBlc01hcDogYW55ID0ge307XG4gIHB1YmxpYyBtZXNzYWdlVHlwZXNNYXA6IGFueSA9IHt9O1xuICB0aGVtZTogQ29tZXRDaGF0VGhlbWUgPSBuZXcgQ29tZXRDaGF0VGhlbWUoe30pO1xuICBwdWJsaWMgZ3JvdXBMaXN0ZW5lcklkID0gXCJncm91cF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgY2FsbExpc3RlbmVySWQgPSBcImNhbGxfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBwdWJsaWMgc3RhdGVzOiB0eXBlb2YgU3RhdGVzID0gU3RhdGVzO1xuICBNZXNzYWdlQ2F0ZWdvcnkgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnk7XG4gIHB1YmxpYyBudW1iZXJPZlRvcFNjcm9sbDogbnVtYmVyID0gMDtcbiAga2VlcFJlY2VudE1lc3NhZ2VzOiBib29sZWFuID0gdHJ1ZTtcbiAgbWVzc2FnZVRlbXBsYXRlOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGVbXSA9IFtdO1xuICBwdWJsaWMgb3BlbkNvbnRhY3RzVmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBtZXNzYWdlQ291bnQhOiBudW1iZXI7XG4gIGlzT25Cb3R0b206IGJvb2xlYW4gPSBmYWxzZTtcbiAgVW5yZWFkQ291bnQ6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gW107XG4gIG5ld01lc3NhZ2VDb3VudDogbnVtYmVyIHwgc3RyaW5nID0gMDtcbiAgdHlwZTogc3RyaW5nID0gXCJcIjtcbiAgY29uZmlybVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiWUVTXCIpO1xuICBjYW5jZWxUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PXCIpO1xuICB3YXJuaW5nVGV4dDogc3RyaW5nID0gXCJBcmUgeW91IHN1cmUgd2FudCB0byBzZWUgdW5zYWZlIGNvbnRlbnQ/XCI7XG4gIGNjTWVzc2FnZURlbGV0ZSE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlUmVhY3QhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVJlYWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXQhOiBTdWJzY3JpcHRpb247XG4gIGNjTGl2ZVJlYWN0aW9uITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VTZW50ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cERlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBDcmVhdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY091dGdvaW5nQ2FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0NhbGxBY2NlcHRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UZXh0TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VSZWFjdGlvbkFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkZvcm1NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkNhcmRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNEZWxpdmVyZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNSZWFkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZEJ5QWxsITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGwhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZURlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uSW50ZXJhY3Rpb25Hb2FsQ29tcGxldGVkITogU3Vic2NyaXB0aW9uO1xuICB0aHJlYWRlZEFsaWdubWVudDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDtcbiAgbWVzc2FnZUluZm9BbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICBvcGVuRW1vamlLZXlib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBrZXlib2FyZEFsaWdubWVudDogc3RyaW5nID0gUGxhY2VtZW50LnJpZ2h0O1xuICBwb3BvdmVyU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMzMwcHhcIixcbiAgICB3aWR0aDogXCIzMjVweFwiLFxuICB9O1xuICB2aWRlb0J1YmJsZVN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEzMHB4XCIsXG4gICAgd2lkdGg6IFwiMjMwcHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIHRocmVhZFZpZXdBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ7XG4gIHdoaXRlYm9hcmRVUkw6IHN0cmluZyB8IFVSTCB8IHVuZGVmaW5lZDtcbiAgZW5hYmxlRGF0YU1hc2tpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlVGh1bWJuYWlsR2VuZXJhdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVMaW5rUHJldmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVQb2xsczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVSZWFjdGlvbnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlSW1hZ2VNb2RlcmF0aW9uOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVN0aWNrZXJzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVdoaXRlYm9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlRG9jdW1lbnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd09uZ29pbmdDYWxsOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZUNhbGxpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgb25nb2luZ0NhbGxTdHlsZTogQ2FsbHNjcmVlblN0eWxlID0ge307XG4gIHNlc3Npb25JZDogc3RyaW5nID0gXCJcIjtcbiAgb3Blbk1lc3NhZ2VJbmZvUGFnZTogYm9vbGVhbiA9IGZhbHNlO1xuICBtZXNzYWdlSW5mb09iamVjdCE6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgaXNXZWJzb2NrZXRSZWNvbm5lY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29ubmVjdGlvbkxpc3RlbmVySWQgPSBcImNvbm5lY3Rpb25fXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgbGFzdE1lc3NhZ2VJZDogbnVtYmVyID0gMDtcbiAgaXNDb25uZWN0aW9uUmVlc3RhYmxpc2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0ZXh0Rm9ybWF0dGVycz86IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+O1xuXG4gIGNsb3NlSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIjtcbiAgdGhyZWFkT3Blbkljb246IHN0cmluZyA9IFwiYXNzZXRzL3NpZGUtYXJyb3cuc3ZnXCI7XG4gIGNvbmZpcm1EaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge307XG4gIHB1YmxpYyBtZXNzYWdlVG9SZWFjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgbnVsbCA9IG51bGw7XG5cbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgdHlwZXM6IHN0cmluZ1tdID0gW107XG4gIGNhdGVnb3JpZXM6IHN0cmluZ1tdID0gW107XG4gIGNhbGxiYWNrczogTWFwPHN0cmluZywgKHNlc3Npb25JZDogc3RyaW5nKSA9PiB2b2lkPiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkgeyB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgICB0aGlzLmNoYXRDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBjaGFuZ2VzW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcl0gfHxcbiAgICAgICAgY2hhbmdlc1tDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW107XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB0aGlzLnNob3dFbmFibGVkRXh0ZW5zaW9ucygpO1xuICAgICAgICB0aGlzLm51bWJlck9mVG9wU2Nyb2xsID0gMDtcbiAgICAgICAgaWYgKCF0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbXTtcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLnVzZXIpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHRoaXMudXNlcjtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcjtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ29tZXRDaGF0LmdldFVzZXIodGhpcy51c2VyKS50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXI7XG4gICAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuZ3JvdXApLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXAgPSB0aGlzLmdyb3VwO1xuICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ29tZXRDaGF0LmdldEdyb3VwKHRoaXMuZ3JvdXApLnRoZW4oKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5ncm91cCA9IGdyb3VwO1xuICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBzZW5kTWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgcmVjZWl2ZXJJZDogc3RyaW5nLFxuICAgIHJlY2VpdmVyVHlwZTogc3RyaW5nXG4gICkge1xuICAgIGlmIChtZXNzYWdlLmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCkge1xuICAgICAgY29uc3QgbmV3TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVGV4dE1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0VGV4dCgpLFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBDb21ldENoYXRVSUtpdC5zZW5kVGV4dE1lc3NhZ2UobmV3TWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSAobWVzc2FnZSBhcyBhbnkpPy5kYXRhPy5hdHRhY2htZW50c1swXTtcbiAgICAgIGNvbnN0IG5ld01lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgbWVzc2FnZS5nZXRUeXBlKCksXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcbiAgICAgIGxldCBhdHRhY2htZW50ID0gbmV3IENvbWV0Q2hhdC5BdHRhY2htZW50KHVwbG9hZGVkRmlsZSk7XG4gICAgICBuZXdNZXNzYWdlLnNldEF0dGFjaG1lbnQoYXR0YWNobWVudCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBDb21ldENoYXRVSUtpdC5zZW5kTWVkaWFNZXNzYWdlKG5ld01lc3NhZ2UgYXMgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSlcbiAgICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGNsb3NlQ29udGFjdHNQYWdlID0gKCkgPT4ge1xuICAgIHRoaXMub3BlbkNvbnRhY3RzVmlldyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgYWRkUmVhY3Rpb24gPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBlbW9qaSA9IGV2ZW50Py5kZXRhaWw/LmlkO1xuICAgIHRoaXMucG9wb3ZlclJlZi5uYXRpdmVFbGVtZW50Lm9wZW5Db250ZW50VmlldyhldmVudCk7XG4gICAgaWYgKHRoaXMubWVzc2FnZVRvUmVhY3QpIHtcbiAgICAgIHRoaXMucmVhY3RUb01lc3NhZ2UoZW1vamksIHRoaXMubWVzc2FnZVRvUmVhY3QpO1xuICAgIH1cbiAgfTtcbiAgZ2V0Q2FsbEJ1YmJsZVRpdGxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGlmIChcbiAgICAgICFtZXNzYWdlLmdldFNlbmRlcigpIHx8XG4gICAgICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gbG9jYWxpemUoXCJZT1VfSU5JVElBVEVEX0dST1VQX0NBTExcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBgJHttZXNzYWdlLmdldFNlbmRlcigpLmdldE5hbWUoKX0gICR7bG9jYWxpemUoXG4gICAgICAgIFwiSU5JVElBVEVEX0dST1VQX0NBTExcIlxuICAgICAgKX1gO1xuICAgIH1cbiAgfVxuICBnZXRDYWxsQWN0aW9uTWVzc2FnZSA9IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgIHJldHVybiBDYWxsaW5nRGV0YWlsc1V0aWxzLmdldENhbGxTdGF0dXMoY2FsbCwgdGhpcy5sb2dnZWRJblVzZXIpO1xuICB9O1xuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuXG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdHJ5IHtcbiAgICAgIC8vUmVtb3ZpbmcgTWVzc2FnZSBMaXN0ZW5lcnNcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVHcm91cExpc3RlbmVyKHRoaXMuZ3JvdXBMaXN0ZW5lcklkKTtcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVDYWxsTGlzdGVuZXIodGhpcy5jYWxsTGlzdGVuZXJJZCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlQ29ubmVjdGlvbkxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQpXG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlUmVhY3Rpb25BZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlUmVhY3Rpb25SZW1vdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZEJ5QWxsPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHJhbnNpZW50TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgUmVhY3Rpb25zU3R5bGUgb2JqZWN0IHdpdGggdGhlIGRlZmluZWQgb3IgZGVmYXVsdCBzdHlsZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIHtSZWFjdGlvbnNTdHlsZX0gUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBSZWFjdGlvbnNTdHlsZSB3aXRoIHRoZSBzZXQgb3IgZGVmYXVsdCBzdHlsZXMuXG4gICAqL1xuICBnZXRSZWFjdGlvbnNTdHlsZSgpIHtcbiAgICBjb25zdCByZWFjdGlvbnNTdHlsZSA9IHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25zU3R5bGUgfHwge307XG4gICAgcmV0dXJuIG5ldyBSZWFjdGlvbnNTdHlsZSh7XG4gICAgICBoZWlnaHQ6IHJlYWN0aW9uc1N0eWxlPy5oZWlnaHQgfHwgXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IHJlYWN0aW9uc1N0eWxlPy53aWR0aCB8fCBcImZpdC1jb250ZW50XCIsXG4gICAgICBib3JkZXI6IHJlYWN0aW9uc1N0eWxlPy5ib3JkZXIgfHwgXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IHJlYWN0aW9uc1N0eWxlPy5ib3JkZXJSYWRpdXMgfHwgXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiByZWFjdGlvbnNTdHlsZT8uYmFja2dyb3VuZCB8fCBcInRyYW5zcGFyZW50XCIsXG4gICAgICBhY3RpdmVSZWFjdGlvbkJhY2tncm91bmQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5MTUwKCksXG4gICAgICByZWFjdGlvbkJhY2tncm91bmQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICByZWFjdGlvbkJvcmRlcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQm9yZGVyIHx8XG4gICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBhY3RpdmVSZWFjdGlvbkJvcmRlcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQm9yZGVyIHx8XG4gICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnk1MDAoKX1gLFxuICAgICAgcmVhY3Rpb25Cb3JkZXJSYWRpdXM6IHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJvcmRlclJhZGl1cyB8fCBcIjEycHhcIixcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Q29sb3I6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkNvdW50VGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhY3RpdmVSZWFjdGlvbkNvdW50VGV4dEZvbnQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkNvdW50VGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlYWN0aW9uQ291bnRUZXh0Rm9udDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQ291bnRUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVhY3Rpb25Db3VudFRleHRDb2xvcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQ291bnRUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHJlYWN0aW9uQm94U2hhZG93OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Cb3hTaGFkb3cgfHwgXCJyZ2JhKDAsIDAsIDAsIDAuMSkgMHB4IDRweCAxMnB4XCIsXG4gICAgICByZWFjdGlvbkVtb2ppRm9udDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uRW1vamlGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgIH0pO1xuICB9XG4gIGlzTW9iaWxlVmlldyA9ICgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmlubmVyV2lkdGggPD0gNzY4O1xuICB9O1xuICBnZXRCdWJibGVCeUlkKGlkOiBzdHJpbmcpOiBFbGVtZW50UmVmIHwgdW5kZWZpbmVkIHtcbiAgICBsZXQgdGFyZ2V0QnViYmxlOiBFbGVtZW50UmVmIHwgdW5kZWZpbmVkO1xuICAgIHRoaXMubWVzc2FnZUJ1YmJsZVJlZi5mb3JFYWNoKChidWJibGU6IEVsZW1lbnRSZWYpID0+IHtcbiAgICAgIGlmIChidWJibGUubmF0aXZlRWxlbWVudC5pZCA9PT0gaWQpXG4gICAgICAgIHRhcmdldEJ1YmJsZSA9IGJ1YmJsZTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0YXJnZXRCdWJibGU7XG4gIH1cbiAgc2hvd0Vtb2ppS2V5Ym9hcmQgPSAoaWQ6IG51bWJlciwgZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBmYWxzZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUb1JlYWN0ID0gbWVzc2FnZTtcbiAgICAgIGlmICh0aGlzLmlzTW9iaWxlVmlldygpKSB7XG4gICAgICAgIGxldCBidWJibGVSZWYgPSB0aGlzLmdldEJ1YmJsZUJ5SWQoU3RyaW5nKGlkKSlcbiAgICAgICAgaWYgKGJ1YmJsZVJlZikge1xuICAgICAgICAgIGNvbnN0IHJlY3QgPSBidWJibGVSZWYubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICBjb25zdCBpc0F0VG9wID0gcmVjdC50b3AgPCBpbm5lckhlaWdodCAvIDI7XG4gICAgICAgICAgY29uc3QgaXNBdEJvdHRvbSA9IHJlY3QuYm90dG9tID4gd2luZG93LmlubmVySGVpZ2h0IC8gMjtcbiAgICAgICAgICBpZiAoaXNBdFRvcCkge1xuICAgICAgICAgICAgdGhpcy5rZXlib2FyZEFsaWdubWVudCA9IFBsYWNlbWVudC5ib3R0b207XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0F0Qm90dG9tKSB7XG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkQWxpZ25tZW50ID0gUGxhY2VtZW50LnRvcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmtleWJvYXJkQWxpZ25tZW50ID1cbiAgICAgICAgICBtZXNzYWdlLmdldFNlbmRlcigpPy5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgID8gUGxhY2VtZW50LmxlZnRcbiAgICAgICAgICAgIDogUGxhY2VtZW50LnJpZ2h0O1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdGhpcy5wb3BvdmVyUmVmLm5hdGl2ZUVsZW1lbnQub3BlbkNvbnRlbnRWaWV3KGV2ZW50KTtcbiAgICB9XG4gIH07XG4gIHNldEJ1YmJsZVZpZXcgPSAoKSA9PiB7XG4gICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKSA9PiB7XG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFtlbGVtZW50LmNhdGVnb3J5KydfJytlbGVtZW50LnR5cGVdID0gZWxlbWVudDsgICAgICBcbiAgICB9KTtcbiAgfTtcbiAgb3BlblRocmVhZFZpZXcgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgaWYgKHRoaXMub25UaHJlYWRSZXBsaWVzQ2xpY2spIHtcbiAgICAgIHRoaXMub25UaHJlYWRSZXBsaWVzQ2xpY2sobWVzc2FnZSwgdGhpcy50aHJlYWRNZXNzYWdlQnViYmxlKTtcbiAgICB9XG4gIH07XG4gIHRocmVhZENhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vcGVuVGhyZWFkVmlldyhtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgZGVsZXRlQ2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLmRlbGV0ZU1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIGVkaXRDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub25FZGl0TWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgY29weUNhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vbkNvcHlNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBtZXNzYWdlUHJpdmF0ZWx5Q2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLnNlbmRNZXNzYWdlUHJpdmF0ZWx5KG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBtZXNzYWdlSW5mb0NhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vcGVuTWVzc2FnZUluZm8obWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIG9wZW5NZXNzYWdlSW5mbyhtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0aGlzLm9wZW5NZXNzYWdlSW5mb1BhZ2UgPSB0cnVlO1xuICAgIHRoaXMubWVzc2FnZUluZm9PYmplY3QgPSBtZXNzYWdlT2JqZWN0O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBjbG9zZU1lc3NhZ2VJbmZvUGFnZSA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5NZXNzYWdlSW5mb1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIHNlbmRNZXNzYWdlUHJpdmF0ZWx5KG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjT3BlbkNoYXQubmV4dCh7IHVzZXI6IG1lc3NhZ2VPYmplY3QuZ2V0U2VuZGVyKCkgfSk7XG4gIH1cbiAgZ2V0TWVzc2FnZUJ5SWQoaWQ6IG51bWJlciB8IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KChtKSA9PiBtLmdldElkKCkgPT0gaWQpO1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBpc1RyYW5zbGF0ZWQobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogYW55IHtcbiAgICBsZXQgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q6IGFueSA9IG1lc3NhZ2U7XG4gICAgaWYgKFxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3QgJiZcbiAgICAgIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0Py5kYXRhPy5tZXRhZGF0YSAmJlxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q/LmRhdGE/Lm1ldGFkYXRhW1xuICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnRyYW5zbGF0ZWRfbWVzc2FnZVxuICAgICAgXVxuICAgICkge1xuICAgICAgcmV0dXJuIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0LmRhdGEubWV0YWRhdGFbXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy50cmFuc2xhdGVkX21lc3NhZ2VcbiAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICB1cGRhdGVUcmFuc2xhdGVkTWVzc2FnZSA9ICh0cmFuc2xhdGlvbjogYW55KSA9PiB7XG4gICAgdmFyIHJlY2VpdmVkTWVzc2FnZSA9IHRyYW5zbGF0aW9uO1xuICAgIHZhciB0cmFuc2xhdGVkVGV4dCA9IHJlY2VpdmVkTWVzc2FnZS50cmFuc2xhdGlvbnNbMF0ubWVzc2FnZV90cmFuc2xhdGVkO1xuICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gcmVjZWl2ZWRNZXNzYWdlLm1zZ0lkXG4gICAgKTtcbiAgICBsZXQgZGF0YTogYW55O1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIHZhciBtZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlS2V5XTtcbiAgICAgIGlmICgobWVzc2FnZU9iaiBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldE1ldGFkYXRhKCkpIHtcbiAgICAgICAgZGF0YSA9IChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0TWV0YWRhdGEoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TWV0YWRhdGEoe30pO1xuICAgICAgICBkYXRhID0gKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRNZXRhZGF0YSgpO1xuICAgICAgfVxuICAgICAgZGF0YVtNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudHJhbnNsYXRlZF9tZXNzYWdlXSA9IHRyYW5zbGF0ZWRUZXh0O1xuICAgICAgdmFyIG5ld01lc3NhZ2VPYmo6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9XG4gICAgICAgIG1lc3NhZ2VPYmo7XG4gICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbmV3TWVzc2FnZU9iaik7XG4gICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlTGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICB0cmFuc2xhdGVNZXNzYWdlID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgZmFsc2UgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICBpZiAobWVzc2FnZSkge1xuICAgICAgQ29tZXRDaGF0LmNhbGxFeHRlbnNpb24oXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy5tZXNzYWdlX3RyYW5zbGF0aW9uLFxuICAgICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMucG9zdCxcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnYyX3RyYW5zbGF0ZSxcbiAgICAgICAge1xuICAgICAgICAgIG1zZ0lkOiBtZXNzYWdlLmdldElkKCksXG4gICAgICAgICAgdGV4dDogKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRUZXh0KCksXG4gICAgICAgICAgbGFuZ3VhZ2VzOiBuYXZpZ2F0b3IubGFuZ3VhZ2VzLFxuICAgICAgICB9XG4gICAgICApXG4gICAgICAgIC50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHJlc3VsdD8udHJhbnNsYXRpb25zWzBdPy5tZXNzYWdlX3RyYW5zbGF0ZWQgIT1cbiAgICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk/LmdldFRleHQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVUcmFuc2xhdGVkTWVzc2FnZShyZXN1bHQpO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlc3VsdCBvZiB0cmFuc2xhdGlvbnNcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4geyB9KTtcbiAgICB9XG4gIH07XG4gIHNldE9wdGlvbnNDYWxsYmFjayhvcHRpb25zOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10sIGlkOiBudW1iZXIpIHtcbiAgICBvcHRpb25zPy5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRNZXNzYWdlT3B0aW9uKSA9PiB7XG4gICAgICBzd2l0Y2ggKGVsZW1lbnQuaWQpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLmRlbGV0ZU1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uZWRpdE1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZWRpdENhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnRyYW5zbGF0ZU1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMudHJhbnNsYXRlTWVzc2FnZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5jb3B5TWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5jb3B5Q2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVhY3RUb01lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2sgfHwgIShlbGVtZW50IGFzIGFueSkuY3VzdG9tVmlldykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5yZXBseUluVGhyZWFkOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLnRocmVhZENhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnNlbmRNZXNzYWdlUHJpdmF0ZWx5OlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm1lc3NhZ2VQcml2YXRlbHlDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5tZXNzYWdlSW5mb3JtYXRpb246XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMubWVzc2FnZUluZm9DYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH1cbiAgLyoqXG4gICAqIHNlbmQgbWVzc2FnZSBvcHRpb25zIGJhc2VkIG9uIHR5cGVcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtc2dPYmplY3RcbiAgICovXG4gIHNldE1lc3NhZ2VPcHRpb25zKFxuICAgIG1zZ09iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSB7XG4gICAgbGV0IG9wdGlvbnMhOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW107XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUgJiZcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmxlbmd0aCA+IDAgJiZcbiAgICAgICFtc2dPYmplY3Q/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2dPYmplY3Q/LmdldFR5cGUoKSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXJcbiAgICApIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSkgPT4ge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgbXNnT2JqZWN0Py5nZXRJZCgpICYmXG4gICAgICAgICAgZWxlbWVudC50eXBlID09IG1zZ09iamVjdD8uZ2V0VHlwZSgpICYmXG4gICAgICAgICAgZWxlbWVudD8ub3B0aW9uc1xuICAgICAgICApIHtcbiAgICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICAgIHRoaXMuc2V0T3B0aW9uc0NhbGxiYWNrKFxuICAgICAgICAgICAgICBlbGVtZW50Py5vcHRpb25zKFxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyLFxuICAgICAgICAgICAgICAgIG1zZ09iamVjdCxcbiAgICAgICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIG1zZ09iamVjdD8uZ2V0SWQoKVxuICAgICAgICAgICAgKSB8fCBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSBbXTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IHRoaXMuZmlsdGVyRW1vamlPcHRpb25zKG9wdGlvbnMpO1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG4gIC8qKlxuICAgKiBSZWFjdHMgdG8gYSBtZXNzYWdlIGJ5IGVpdGhlciBhZGRpbmcgb3IgcmVtb3ZpbmcgdGhlIHJlYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZW1vamkgLSBUaGUgZW1vamkgdXNlZCBmb3IgdGhlIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoYXQgd2FzIHJlYWN0ZWQgdG8uXG4gICAqL1xuXG4gIHJlYWN0VG9NZXNzYWdlKGVtb2ppOiBzdHJpbmcsIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IG1lc3NhZ2U/LmdldElkKCk7XG4gICAgY29uc3QgbXNnT2JqZWN0ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlSWQpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgICBjb25zdCByZWFjdGlvbnMgPSBtc2dPYmplY3Q/LmdldFJlYWN0aW9ucygpIHx8IFtdO1xuICAgIGNvbnN0IGVtb2ppT2JqZWN0ID0gcmVhY3Rpb25zPy5maW5kKChyZWFjdGlvbjogYW55KSA9PiB7XG4gICAgICByZXR1cm4gcmVhY3Rpb24/LnJlYWN0aW9uID09IGVtb2ppO1xuICAgIH0pO1xuICAgIGlmIChlbW9qaU9iamVjdCAmJiBlbW9qaU9iamVjdD8uZ2V0UmVhY3RlZEJ5TWUoKSkge1xuICAgICAgY29uc3QgdXBkYXRlZFJlYWN0aW9uczogYW55W10gPSBbXTtcbiAgICAgIHJlYWN0aW9ucy5mb3JFYWNoKChyZWFjdGlvbikgPT4ge1xuICAgICAgICBpZiAocmVhY3Rpb24/LmdldFJlYWN0aW9uKCkgPT0gZW1vamkpIHtcbiAgICAgICAgICBpZiAocmVhY3Rpb24/LmdldENvdW50KCkgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVhY3Rpb24uc2V0Q291bnQocmVhY3Rpb24/LmdldENvdW50KCkgLSAxKTtcbiAgICAgICAgICAgIHJlYWN0aW9uLnNldFJlYWN0ZWRCeU1lKGZhbHNlKTtcbiAgICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbXNnT2JqZWN0LnNldFJlYWN0aW9ucyh1cGRhdGVkUmVhY3Rpb25zKTtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZVJlYWN0aW9uKG1lc3NhZ2VJZCwgZW1vamkpXG4gICAgICAgIC50aGVuKChtZXNzYWdlKSA9PiB7IH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAvLyBSZXR1cm4gb2xkIG1lc3NhZ2Ugb2JqZWN0IGluc3RlYWQgb2ZcbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTsgLy9uZWVkIGNoYW5nZXNcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB1cGRhdGVkUmVhY3Rpb25zID0gW107XG4gICAgICBjb25zdCByZWFjdGlvbkF2YWlsYWJsZSA9IHJlYWN0aW9ucy5maW5kKChyZWFjdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gcmVhY3Rpb24/LmdldFJlYWN0aW9uKCkgPT0gZW1vamk7XG4gICAgICB9KTtcblxuICAgICAgcmVhY3Rpb25zLmZvckVhY2goKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChyZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSA9PSBlbW9qaSkge1xuICAgICAgICAgIHJlYWN0aW9uLnNldENvdW50KHJlYWN0aW9uPy5nZXRDb3VudCgpICsgMSk7XG4gICAgICAgICAgcmVhY3Rpb24uc2V0UmVhY3RlZEJ5TWUodHJ1ZSk7XG4gICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICghcmVhY3Rpb25BdmFpbGFibGUpIHtcbiAgICAgICAgY29uc3QgcmVhY3Q6IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50ID0gbmV3IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50KFxuICAgICAgICAgIGVtb2ppLFxuICAgICAgICAgIDEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3QpO1xuICAgICAgfVxuICAgICAgbXNnT2JqZWN0LnNldFJlYWN0aW9ucyh1cGRhdGVkUmVhY3Rpb25zKTtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgQ29tZXRDaGF0LmFkZFJlYWN0aW9uKG1lc3NhZ2VJZCwgZW1vamkpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7IH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBGaWx0ZXJzIG91dCB0aGUgJ2FkZCByZWFjdGlvbicgb3B0aW9uIGlmIHJlYWN0aW9ucyBhcmUgZGlzYWJsZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbltdfSBvcHRpb25zIC0gVGhlIG9yaWdpbmFsIHNldCBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIHtDb21ldENoYXRNZXNzYWdlT3B0aW9uW119IFRoZSBmaWx0ZXJlZCBzZXQgb2YgbWVzc2FnZSBvcHRpb25zLlxuICAgKi9cblxuICBmaWx0ZXJFbW9qaU9wdGlvbnMgPSAob3B0aW9uczogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdKSA9PiB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVSZWFjdGlvbnMpIHtcbiAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zLmZpbHRlcigob3B0aW9uOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uKSA9PiB7XG4gICAgICByZXR1cm4gb3B0aW9uLmlkICE9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlYWN0VG9NZXNzYWdlO1xuICAgIH0pO1xuICB9O1xuICBnZXRDbG9uZWRSZWFjdGlvbk9iamVjdChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICByZXR1cm4gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2UpO1xuICB9XG4gIC8qKlxuICAgKiBwYXNzaW5nIHN0eWxlIGJhc2VkIG9uIG1lc3NhZ2Ugb2JqZWN0XG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZU9iamVjdFxuICAgKi9cbiAgc2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1zZzogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogQmFzZVN0eWxlIHtcbiAgICBsZXQgc3R5bGUhOiBCYXNlU3R5bGU7XG4gICAgaWYgKG1zZz8uZ2V0RGVsZXRlZEF0KCkpIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlcjogYDFweCBkYXNoZWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5tZWV0aW5nICYmXG4gICAgICAoIW1zZz8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgbXNnPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSlcbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgICAgLy8gfSBlbHNlIGlmICh0aGlzLmdldExpbmtQcmV2aWV3KG1zZyBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpKSB7XG4gICAgICAvLyAgIHN0eWxlID0ge1xuICAgICAgLy8gICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIC8vICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgLy8gICB9O1xuICAgIH0gZWxzZSBpZiAobXNnPy5nZXRUeXBlKCkgPT0gU3RpY2tlcnNDb25zdGFudHMuc3RpY2tlcikge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFtc2c/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2c/LmdldENhdGVnb3J5KCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0ICYmXG4gICAgICAoIW1zZz8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09IG1zZz8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpXG4gICAgKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgICB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0XG4gICAgICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKClcbiAgICAgICAgICAgIDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAhbXNnPy5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIgfHxcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudFxuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKX1gLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgIW1zZz8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlXG4gICAgKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICB3aWR0aDogXCIzMDBweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBtc2c/LmdldFNlbmRlcigpICYmXG4gICAgICAgIG1zZz8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZTtcbiAgfVxuICBnZXRTZXNzaW9uSWQobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICBsZXQgZGF0YTogYW55ID0gbWVzc2FnZS5nZXREYXRhKCk7XG4gICAgcmV0dXJuIGRhdGE/LmN1c3RvbURhdGE/LnNlc3Npb25JRDtcbiAgfVxuICBnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKG1lc3NhZ2U/LmdldERhdGEoKSkge1xuICAgICAgICB2YXIgZGF0YTogYW55ID0gbWVzc2FnZS5nZXREYXRhKCk7XG4gICAgICAgIGlmIChkYXRhPy5tZXRhZGF0YSkge1xuICAgICAgICAgIHZhciBtZXRhZGF0YSA9IGRhdGE/Lm1ldGFkYXRhO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KG1ldGFkYXRhLCBcIkBpbmplY3RlZFwiKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFyIGluamVjdGVkT2JqZWN0ID0gbWV0YWRhdGFbXCJAaW5qZWN0ZWRcIl07XG4gICAgICAgICAgICBpZiAoaW5qZWN0ZWRPYmplY3Q/LmV4dGVuc2lvbnMpIHtcbiAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbk9iamVjdCA9IGluamVjdGVkT2JqZWN0LmV4dGVuc2lvbnM7XG4gICAgICAgICAgICAgIHJldHVybiBleHRlbnNpb25PYmplY3RbXG4gICAgICAgICAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMud2hpdGVib2FyZFxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgPyBleHRlbnNpb25PYmplY3RbQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMud2hpdGVib2FyZF1cbiAgICAgICAgICAgICAgICAgIC5ib2FyZF91cmxcbiAgICAgICAgICAgICAgICA6IGV4dGVuc2lvbk9iamVjdFtDb2xsYWJvcmF0aXZlRG9jdW1lbnRDb25zdGFudHMuZG9jdW1lbnRdXG4gICAgICAgICAgICAgICAgICAuZG9jdW1lbnRfdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcGVuTGlua1VSTChldmVudDogYW55KSB7XG4gICAgd2luZG93Lm9wZW4oZXZlbnQ/LmRldGFpbD8udXJsLCBcIl9ibGFua1wiKTtcbiAgfVxuICBnZXRTdGlja2VyKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBzdGlja2VyRGF0YTogYW55ID0gbnVsbDtcbiAgICAgIGlmIChcbiAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5kYXRhXG4gICAgICAgICkgJiZcbiAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpLmdldERhdGEoKSxcbiAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5jdXN0b21fZGF0YVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgc3RpY2tlckRhdGEgPSAobWVzc2FnZSBhcyBhbnkpLmRhdGEuY3VzdG9tRGF0YTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgICAgc3RpY2tlckRhdGEsXG4gICAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5zdGlja2VyX3VybFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHN0aWNrZXJEYXRhLnN0aWNrZXJfdXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ3N0YXR1c0luZm9WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRDb250ZW50VmlldyA9IChcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPT4ge1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5jb250ZW50Vmlld1xuICAgICkge1xuICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uY29udGVudFZpZXcobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLmdldERlbGV0ZWRBdCgpXG4gICAgICAgID8gdGhpcy50eXBlc01hcFtcInRleHRcIl1cbiAgICAgICAgOiB0aGlzLnR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdoZWFkZXJWaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRIZWFkZXJWaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBsZXQgdmlldzogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPSBudWxsO1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5oZWFkZXJWaWV3XG4gICAgKSB7XG4gICAgICB2aWV3ID0gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5oZWFkZXJWaWV3KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnZm9vdGVyVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cbiAgZ2V0Rm9vdGVyVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgbGV0IHZpZXc6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uZm9vdGVyVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uZm9vdGVyVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ2JvdHRvbVZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldEJvdHRvbVZpZXcobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5ib3R0b21WaWV3XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5ib3R0b21WaWV3KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ3N0YXR1c0luZm9WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuXG4gIGdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uc3RhdHVzSW5mb1ZpZXdcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LnN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgaXNBdWRpb09yVmlkZW9NZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IG1lc3NhZ2VUeXBlID0gbWVzc2FnZT8uZ2V0VHlwZSgpO1xuICAgIGNvbnN0IHR5cGVzVG9DaGVjayA9IFtcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5pbWFnZSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbyxcbiAgICBdO1xuICAgIHJldHVybiB0eXBlc1RvQ2hlY2suaW5jbHVkZXMobWVzc2FnZVR5cGUpO1xuICB9XG5cbiAgc2V0QnViYmxlQWxpZ25tZW50ID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBhbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmNlbnRlcjtcbiAgICBpZiAodGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdCkge1xuICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIgfHxcbiAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50XG4gICAgICApIHtcbiAgICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5jZW50ZXI7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgKG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpICYmXG4gICAgICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpICE9XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyKVxuICAgICAgKSB7XG4gICAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhbGlnbm1lbnQ7XG4gIH07XG5cbiAgZ2V0Rm9ybU1lc3NhZ2VCdWJibGVTdHlsZSgpIHtcbiAgICBjb25zdCB0ZXh0U3R5bGUgPSBuZXcgSW5wdXRTdHlsZSh7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMzBweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjZweFwiLFxuICAgICAgcGFkZGluZzogXCIwcHggMHB4IDBweCA1cHhcIixcbiAgICAgIHBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICB9KTtcbiAgICBjb25zdCBsYWJlbFN0eWxlID0gbmV3IExhYmVsU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHJhZGlvQnV0dG9uU3R5bGUgPSBuZXcgUmFkaW9CdXR0b25TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGxhYmVsVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbGFiZWxUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGNoZWNrYm94U3R5bGUgPSBuZXcgQ2hlY2tib3hTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI0cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgICBsYWJlbFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGxhYmVsVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IGRyb3Bkb3duU3R5bGUgPSBuZXcgRHJvcGRvd25TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMzVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBhY3RpdmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBhY3RpdmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhcnJvd0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgb3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBvcHRpb25Cb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBvcHRpb25Ib3ZlckJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGhvdmVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgaG92ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBob3ZlclRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IGJ1dHRvbkdyb3VwU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiNDBweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICB9O1xuICAgIGNvbnN0IHNpbmdsZVNlbGVjdFN0eWxlID0gbmV3IFNpbmdsZVNlbGVjdFN0eWxlKHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgYWN0aXZlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYWN0aXZlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlVGV4dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBvcHRpb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG9wdGlvbkJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIG9wdGlvbkJvcmRlclJhZGl1czogXCIzcHhcIixcbiAgICAgIGhvdmVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgaG92ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBob3ZlclRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHF1aWNrVmlld1N0eWxlID0gbmV3IFF1aWNrVmlld1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsZWFkaW5nQmFyVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBsZWFkaW5nQmFyV2lkdGg6IFwiNHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBGb3JtQnViYmxlU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHdyYXBwZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHdyYXBwZXJCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB0ZXh0SW5wdXRTdHlsZTogdGV4dFN0eWxlLFxuICAgICAgbGFiZWxTdHlsZTogbGFiZWxTdHlsZSxcbiAgICAgIHJhZGlvQnV0dG9uU3R5bGU6IHJhZGlvQnV0dG9uU3R5bGUsXG4gICAgICBjaGVja2JveFN0eWxlOiBjaGVja2JveFN0eWxlLFxuICAgICAgZHJvcGRvd25TdHlsZTogZHJvcGRvd25TdHlsZSxcbiAgICAgIGJ1dHRvblN0eWxlOiBidXR0b25Hcm91cFN0eWxlLFxuICAgICAgc2luZ2xlU2VsZWN0U3R5bGU6IHNpbmdsZVNlbGVjdFN0eWxlLFxuICAgICAgcXVpY2tWaWV3U3R5bGU6IHF1aWNrVmlld1N0eWxlLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGdvYWxDb21wbGV0aW9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgd3JhcHBlclBhZGRpbmc6IFwiMnB4XCIsXG4gICAgICBkYXRlUGlja2VyQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgZGF0ZVBpY2tlckJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIGRhdGVQaWNrZXJGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGRhdGVQaWNrZXJGb250Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgfSk7XG4gIH1cblxuICBnZXRDYXJkTWVzc2FnZUJ1YmJsZVN0eWxlKCkge1xuICAgIGNvbnN0IGJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBweFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiBgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKX1gLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgQ2FyZEJ1YmJsZVN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICAgIGltYWdlSGVpZ2h0OiBcImF1dG9cIixcbiAgICAgIGltYWdlV2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaW1hZ2VSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBpbWFnZUJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGVzY3JpcHRpb25Gb250Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkZXNjcmlwdGlvbkZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uU3R5bGU6IGJ1dHRvblN0eWxlLFxuICAgICAgZGl2aWRlclRpbnRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHdyYXBwZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHdyYXBwZXJCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB3cmFwcGVyUGFkZGluZzogXCIycHhcIixcbiAgICAgIGRpc2FibGVkQnV0dG9uQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cblxuICBnZXRDYWxsQnViYmxlU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdmFyIGlzTGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIHZhciBpc1VzZXJTZW50TWVzc2FnZSA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgaWYgKGlzVXNlclNlbnRNZXNzYWdlICYmICFpc0xlZnRBbGlnbmVkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiMjQwcHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICB3aWR0aDogXCIyNDBweFwiLFxuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgZ2V0QnViYmxlV3JhcHBlciA9IChcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPT4ge1xuICAgIGxldCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcCAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXS5idWJibGVWaWV3XG4gICAgKSB7XG4gICAgICB2aWV3ID0gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXS5idWJibGVWaWV3KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpZXcgPSBudWxsO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfVxuICB9O1xuICBnZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQgfHxcbiAgICAgIChtZXNzYWdlLmdldFNlbmRlcigpICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKCkpXG4gICAgICA/IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdFxuICAgICAgOiBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICB9XG4gIHNldFRyYW5zbGF0aW9uU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdmFyIGlzTGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCAhPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIGlmICghaXNMZWZ0QWxpZ25lZCkge1xuICAgICAgcmV0dXJuIG5ldyBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSh7XG4gICAgICAgIHRyYW5zbGF0ZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICksXG4gICAgICAgIHRyYW5zbGF0ZWRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwibGlnaHRcIiksXG4gICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICAgIGhlbHBUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc1VzZXJTZW50TWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gbmV3IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlKHtcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOlxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKFwiZGFya1wiKSxcbiAgICAgICAgICBoZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUoe1xuICAgICAgICAgIHRyYW5zbGF0ZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICAgICApLFxuICAgICAgICAgIHRyYW5zbGF0ZWRUZXh0Q29sb3I6XG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImxpZ2h0XCIpLFxuICAgICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICAgICAgaGVscFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBnZXRDYWxsVHlwZUljb24obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbykge1xuICAgICAgcmV0dXJuIFwiYXNzZXRzL0F1ZGlvLUNhbGwuc3ZnXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcImFzc2V0cy9WaWRlby1jYWxsLnN2Z1wiO1xuICAgIH1cbiAgfVxuICBjYWxsU3RhdHVzU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG5cbiAgICBpZiAobWVzc2FnZS5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50KSB7XG4gICAgICBsZXQgbWlzc2VkQ2FsbFRleHRDb2xvciA9IENhbGxpbmdEZXRhaWxzVXRpbHMuaXNNaXNzZWRDYWxsKFxuICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5DYWxsLFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlclxuICAgICAgKVxuICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogbWlzc2VkQ2FsbFRleHRDb2xvcixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwcHhcIixcbiAgICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgICAgYnV0dG9uSWNvblRpbnQ6IG1pc3NlZENhbGxUZXh0Q29sb3IsXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgcGFkZGluZzogXCI4cHggMTJweFwiLFxuICAgICAgICBnYXA6IFwiNHB4XCIsXG4gICAgICAgIGhlaWdodDogXCIyNXB4XCIsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIHNldFRleHRCdWJibGVTdHlsZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgaXNJbmZvQnViYmxlID0gdGhpcy5tZXNzYWdlSW5mb09iamVjdCAmJiBtZXNzYWdlLmdldElkKCkgJiYgdGhpcy5tZXNzYWdlSW5mb09iamVjdC5nZXRJZCgpID09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgIHZhciBpc0RlbGV0ZWQgPSBtZXNzYWdlLmdldERlbGV0ZWRBdCgpO1xuICAgIHZhciBub3RMZWZ0QWxpZ25lZCA9IHRoaXMuYWxpZ25tZW50ICE9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIHZhciBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0O1xuICAgIHZhciBpc1VzZXJTZW50TWVzc2FnZSA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgdmFyIGlzR3JvdXBNZW1iZXJNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyO1xuICAgIGlmICghaXNEZWxldGVkICYmIG5vdExlZnRBbGlnbmVkICYmIGlzVGV4dE1lc3NhZ2UgJiYgaXNVc2VyU2VudE1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICAgIGJ1YmJsZVBhZGRpbmc6IGlzSW5mb0J1YmJsZSA/IFwiOHB4IDEycHhcIiA6IFwiOHB4IDEycHggMCAxMnB4XCJcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChcbiAgICAgICFpc0RlbGV0ZWQgJiZcbiAgICAgIG5vdExlZnRBbGlnbmVkICYmXG4gICAgICBpc1RleHRNZXNzYWdlICYmXG4gICAgICAhaXNVc2VyU2VudE1lc3NhZ2UgJiZcbiAgICAgICFpc0dyb3VwTWVtYmVyTWVzc2FnZVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgYnViYmxlUGFkZGluZzogXCI4cHggMTJweCAycHggMTJweFwiXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoaXNHcm91cE1lbWJlck1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKCFub3RMZWZ0QWxpZ25lZCAmJiBpc1RleHRNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgYnViYmxlUGFkZGluZzogXCI4cHggMTJweFwiXG4gICAgfTtcbiAgfTtcbiAgLypcbiogaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQ6IFRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGJlbG9uZ3MgZm9yIHRoaXMgbGlzdCBhbmQgaXMgbm90IHBhcnQgb2YgdGhyZWFkIGV2ZW4gZm9yIGN1cnJlbnQgbGlzdFxuICBpdCBvbmx5IHJ1bnMgZm9yIFVJIGV2ZW50IGJlY2F1c2UgaXQgYXNzdW1lcyBsb2dnZWQgaW4gdXNlciBpcyBhbHdheXMgc2VuZGVyXG4qIEBwYXJhbTogbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4qL1xuICBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgY29uc3QgcmVjZWl2ZXJJZCA9IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IG1lc3NhZ2U/LmdldFJlY2VpdmVyVHlwZSgpO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgcmVjZWl2ZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJiByZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgfVxuICAgIH1cblxuICAvKlxuICAgICogaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIGZvciB0aGlzIGxpc3QgYW5kIGlzIG5vdCBwYXJ0IG9mIHRocmVhZCBldmVuIGZvciBjdXJyZW50IGxpc3RcbiAgICAgIGl0IG9ubHkgcnVucyBmb3IgU0RLIGV2ZW50IGJlY2F1c2UgaXQgbmVlZHMgc2VuZGVySWQgdG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgc2FtZSB1c2VyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBtZXNzYWdlPy5nZXRSZWNlaXZlclR5cGUoKTtcbiAgICAgIGNvbnN0IHNlbmRlcklkID0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgKHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSB8fCBzZW5kZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmIChyZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICB9XG4gICAgfVxuXG4gIC8qXG4gICAgKiBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIHRocmVhZCBvZiB0aGlzIGxpc3QsXG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFVJIGV2ZW50IGJlY2F1c2UgaXQgYXNzdW1lcyBsb2dnZWQgaW4gdXNlciBpcyBhbHdheXMgc2VuZGVyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50ID1cbiAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICBpZiAoIW1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG5cbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICBpZiAocmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAvKlxuICAgICogaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQ6IFRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGJlbG9uZ3MgdGhyZWFkIG9mIHRoaXMgbGlzdCxcbiAgICAgIGl0IG9ubHkgcnVucyBmb3IgU0RLIGV2ZW50IGJlY2F1c2UgaXQgbmVlZHMgc2VuZGVySWQgdG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgc2FtZSB1c2VyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JTREtFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKCFtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVjZWl2ZXJJZCA9IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGNvbnN0IHNlbmRlcklkID0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpO1xuXG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkgfHwgc2VuZGVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgc2V0RmlsZUJ1YmJsZVN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGFueSB7XG4gICAgdmFyIGlzRmlsZU1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU7XG4gICAgaWYgKGlzRmlsZU1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgICBpY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICB0aGlzLmlvQm90dG9tKCk7XG4gICAgdGhpcy5pb1RvcCgpO1xuICAgIHRoaXMuY2hlY2tNZXNzYWdlVGVtcGxhdGUoKTtcbiAgfVxuXG4gIGdldFN0YXJ0Q2FsbEZ1bmN0aW9uKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKTogKHNlc3Npb25JZDogc3RyaW5nKSA9PiB2b2lkIHtcbiAgICBsZXQgc2Vzc2lvbklkID0gdGhpcy5nZXRTZXNzaW9uSWQobWVzc2FnZSlcbiAgICBsZXQgY2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrcy5nZXQoc2Vzc2lvbklkKTtcbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayA9IChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdGhpcy5zdGFydERpcmVjdENhbGwoc2Vzc2lvbklkLCBtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnNldChzZXNzaW9uSWQsIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxiYWNrO1xuICB9XG4gIHN0YXJ0RGlyZWN0Q2FsbCA9IChzZXNzaW9uSWQ6IHN0cmluZywgbWVzc2FnZTogYW55KSA9PiB7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlO1xuICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG1lc3NhZ2UpXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBsYXVuY2hDb2xsYWJvcmF0aXZlV2hpdGVib2FyZERvY3VtZW50ID0gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgd2luZG93Lm9wZW4oXG4gICAgICB1cmwgKyBgJnVzZXJuYW1lPSR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX1gLFxuICAgICAgXCJcIixcbiAgICAgIFwiZnVsbHNjcmVlbj15ZXMsIHNjcm9sbGJhcnM9YXV0b1wiXG4gICAgKTtcbiAgfTtcbiAgLyoqXG4gICAqIEV4dHJhY3RpbmcgIHR5cGVzIGFuZCBjYXRlZ29yaWVzIGZyb20gdGVtcGxhdGVcbiAgICpcbiAgICovXG4gIGNoZWNrTWVzc2FnZVRlbXBsYXRlKCkge1xuICAgIHRoaXMudHlwZXNNYXAgPSB7XG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0XTogdGhpcy50ZXh0QnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZV06IHRoaXMuZmlsZUJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXTogdGhpcy5hdWRpb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvXTogdGhpcy52aWRlb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmltYWdlXTogdGhpcy5pbWFnZUJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXJdOiB0aGlzLnRleHRCdWJibGUsXG4gICAgICBjdXN0b21fZXh0ZW5zaW9uX3N0aWNrZXI6IHRoaXMuc3RpY2tlckJ1YmJsZSxcbiAgICAgIGN1c3RvbV9leHRlbnNpb25fd2hpdGVib2FyZDogdGhpcy53aGl0ZWJvYXJkQnViYmxlLFxuICAgICAgY3VzdG9tX2V4dGVuc2lvbl9kb2N1bWVudDogdGhpcy5kb2N1bWVudEJ1YmJsZSxcbiAgICAgIGN1c3RvbV9leHRlbnNpb25fcG9sbDogdGhpcy5wb2xsQnViYmxlLFxuICAgICAgY3VzdG9tX21lZXRpbmc6IHRoaXMuZGlyZWN0Q2FsbGluZyxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXTogdGhpcy5hdWRpb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvXTogdGhpcy52aWRlb0J1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5zY2hlZHVsZXJdOiB0aGlzLnNjaGVkdWxlckJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5mb3JtXTogdGhpcy5mb3JtQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmNhcmRdOiB0aGlzLmNhcmRCdWJibGUsXG4gICAgfTtcbiAgICB0aGlzLnNldEJ1YmJsZVZpZXcoKTtcbiAgfVxuICBnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSwgdHlwZT86IHN0cmluZykge1xuICAgIGxldCBkYXRhOiBhbnkgPSBtZXNzYWdlLmdldEN1c3RvbURhdGEoKTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgcmV0dXJuIGRhdGFbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIH1cbiAgfVxuICBnZXRUaHJlYWRDb3VudChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB2YXIgcmVwbHlDb3VudCA9IG1lc3NhZ2U/LmdldFJlcGx5Q291bnQoKSB8fCAwO1xuICAgIHZhciBzdWZmaXggPSByZXBseUNvdW50ID09PSAxID8gbG9jYWxpemUoXCJSRVBMWVwiKSA6IGxvY2FsaXplKFwiUkVQTElFU1wiKTtcbiAgICByZXR1cm4gYCR7cmVwbHlDb3VudH0gJHtzdWZmaXh9YDtcbiAgfVxuICBzaG93RW5hYmxlZEV4dGVuc2lvbnMoKSB7XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJ0ZXh0bW9kZXJhdG9yXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZURhdGFNYXNraW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJ0aHVtYm5haWxnZW5lcmF0aW9uXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVRodW1ibmFpbEdlbmVyYXRpb24gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImxpbmtwcmV2aWV3XCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUxpbmtQcmV2aWV3ID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJwb2xsc1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVQb2xscyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwicmVhY3Rpb25zXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVJlYWN0aW9ucyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiaW1hZ2Vtb2RlcmF0aW9uXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUltYWdlTW9kZXJhdGlvbiA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwic3RpY2tlcnNcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlU3RpY2tlcnMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImNvbGxhYm9yYXRpdmV3aGl0ZWJvYXJkXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVdoaXRlYm9hcmQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImNvbGxhYm9yYXRpdmVkb2N1bWVudFwiKSkge1xuICAgICAgdGhpcy5lbmFibGVEb2N1bWVudCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiY2FsbGluZ1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVDYWxsaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJhaWNvbnZlcnNhdGlvbnN0YXJ0ZXJcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiYWljb252ZXJzYXRpb25zdW1tYXJ5XCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnkgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgb3BlbkNvbmZpcm1EaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIG9wZW5GdWxsc2NyZWVuVmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgaW1hZ2V1cmxUb09wZW46IHN0cmluZyA9IFwiXCI7XG4gIGZ1bGxTY3JlZW5WaWV3ZXJTdHlsZTogRnVsbFNjcmVlblZpZXdlclN0eWxlID0ge1xuICAgIGNsb3NlSWNvblRpbnQ6IFwiYmx1ZVwiLFxuICB9O1xuICBvcGVuSW1hZ2VJbkZ1bGxTY3JlZW4obWVzc2FnZTogYW55KSB7XG4gICAgdGhpcy5pbWFnZXVybFRvT3BlbiA9IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmw7XG4gICAgdGhpcy5vcGVuRnVsbHNjcmVlblZpZXcgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBjbG9zZUltYWdlSW5GdWxsU2NyZWVuKCkge1xuICAgIHRoaXMuaW1hZ2V1cmxUb09wZW4gPSBcIlwiO1xuICAgIHRoaXMub3BlbkZ1bGxzY3JlZW5WaWV3ID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIG9wZW5XYXJuaW5nRGlhbG9nKGV2ZW50OiBhbnkpIHtcbiAgICB0aGlzLmNsb3NlSW1hZ2VNb2RlcmF0aW9uID0gZXZlbnQ/LmRldGFpbD8ub25Db25maXJtO1xuICAgIHRoaXMub3BlbkNvbmZpcm1EaWFsb2cgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBvbkNvbmZpcm1DbGljayA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5Db25maXJtRGlhbG9nID0gZmFsc2U7XG4gICAgaWYgKHRoaXMuY2xvc2VJbWFnZU1vZGVyYXRpb24pIHtcbiAgICAgIHRoaXMuY2xvc2VJbWFnZU1vZGVyYXRpb24oKTtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvbkNhbmNlbENsaWNrKCkge1xuICAgIHRoaXMub3BlbkNvbmZpcm1EaWFsb2cgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgZ2V0VGV4dE1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogc3RyaW5nIHtcbiAgICB2YXIgdGV4dCA9IHRoaXMuZW5hYmxlRGF0YU1hc2tpbmdcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldEV4dGVuc2lvbkRhdGEobWVzc2FnZSlcbiAgICAgIDogbnVsbDtcbiAgICByZXR1cm4gdGV4dD8udHJpbSgpPy5sZW5ndGggPiAwID8gdGV4dCA6IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICB9XG4gIGdldExpbmtQcmV2aWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChtZXNzYWdlPy5nZXRNZXRhZGF0YSgpICYmIHRoaXMuZW5hYmxlTGlua1ByZXZpZXcpIHtcbiAgICAgICAgdmFyIG1ldGFkYXRhOiBhbnkgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgICAgIHZhciBpbmplY3RlZE9iamVjdCA9IG1ldGFkYXRhW0xpbmtQcmV2aWV3Q29uc3RhbnRzLmluamVjdGVkXTtcbiAgICAgICAgaWYgKGluamVjdGVkT2JqZWN0ICYmIGluamVjdGVkT2JqZWN0Py5leHRlbnNpb25zKSB7XG4gICAgICAgICAgdmFyIGV4dGVuc2lvbnNPYmplY3QgPSBpbmplY3RlZE9iamVjdC5leHRlbnNpb25zO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3QgJiZcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgICAgICBleHRlbnNpb25zT2JqZWN0LFxuICAgICAgICAgICAgICBMaW5rUHJldmlld0NvbnN0YW50cy5saW5rX3ByZXZpZXdcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHZhciBsaW5rUHJldmlld09iamVjdCA9XG4gICAgICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3RbTGlua1ByZXZpZXdDb25zdGFudHMubGlua19wcmV2aWV3XTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgbGlua1ByZXZpZXdPYmplY3QgJiZcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgICAgICAgbGlua1ByZXZpZXdPYmplY3QsXG4gICAgICAgICAgICAgICAgTGlua1ByZXZpZXdDb25zdGFudHMubGlua3NcbiAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICBsaW5rUHJldmlld09iamVjdFtMaW5rUHJldmlld0NvbnN0YW50cy5saW5rc10ubGVuZ3RoXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGxpbmtQcmV2aWV3T2JqZWN0W0xpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtzXVswXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBnZXRJbWFnZVRodW1ibmFpbChtc2c6IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIHZhciBtZXNzYWdlOiBhbnkgPSBtc2cgYXMgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZTtcbiAgICBsZXQgaW1hZ2VVUkwgPSBcIlwiO1xuICAgIGlmICh0aGlzLmVuYWJsZVRodW1ibmFpbEdlbmVyYXRpb24pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBtZXRhZGF0YTogYW55ID0gbWVzc2FnZS5nZXRNZXRhZGF0YSgpO1xuICAgICAgICB2YXIgaW5qZWN0ZWRPYmplY3QgPSBtZXRhZGF0YT8uW1xuICAgICAgICAgIFRodW1ibmFpbEdlbmVyYXRpb25Db25zdGFudHMuaW5qZWN0ZWRcbiAgICAgICAgXSBhcyB7IGV4dGVuc2lvbnM/OiBhbnkgfTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbnNPYmplY3QgPSBpbmplY3RlZE9iamVjdD8uZXh0ZW5zaW9ucztcbiAgICAgICAgdmFyIHRodW1ibmFpbEdlbmVyYXRpb25PYmplY3QgPVxuICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3RbVGh1bWJuYWlsR2VuZXJhdGlvbkNvbnN0YW50cy50aHVtYm5haWxfZ2VuZXJhdGlvbl07XG4gICAgICAgIHZhciBpbWFnZVRvRG93bmxvYWQgPSB0aHVtYm5haWxHZW5lcmF0aW9uT2JqZWN0Py51cmxfc21hbGw7XG4gICAgICAgIGlmIChpbWFnZVRvRG93bmxvYWQpIHtcbiAgICAgICAgICBpbWFnZVVSTCA9IGltYWdlVG9Eb3dubG9hZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbWFnZVVSTCA9IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzXG4gICAgICAgICAgICA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmxcbiAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGltYWdlVVJMID0gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNcbiAgICAgICAgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsXG4gICAgICAgIDogXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGltYWdlVVJMO1xuICB9XG4gIGdldExpbmtQcmV2aWV3RGV0YWlscyhrZXk6IHN0cmluZywgbWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogc3RyaW5nIHtcbiAgICBsZXQgbGlua1ByZXZpZXdPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TGlua1ByZXZpZXcobWVzc2FnZSk7XG4gICAgaWYgKE9iamVjdC5rZXlzKGxpbmtQcmV2aWV3T2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gbGlua1ByZXZpZXdPYmplY3Rba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIHRoaXMuc2V0TWVzc2FnZXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmFkZE1lc3NhZ2VFdmVudExpc3RlbmVycygpO1xuICAgIHRoaXMuc2V0T25nb2luZ0NhbGxTdHlsZSgpO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHRoaXMuZGF0ZVNlcGFyYXRvclN0eWxlLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUuYmFja2dyb3VuZCB8fFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKTtcbiAgICB0aGlzLmRpdmlkZXJTdHlsZS5iYWNrZ3JvdW5kID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCk7XG4gICAgXG4gICAgdGhpcy5sYWJlbFN0eWxlLnRleHRDb2xvciA9IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5uYW1lVGV4dENvbG9yIHx8IHRoaXMubGFiZWxTdHlsZS50ZXh0Q29sb3I7XG4gICAgdGhpcy5sYWJlbFN0eWxlLnRleHRGb250ID0gdGhpcy5tZXNzYWdlTGlzdFN0eWxlLm5hbWVUZXh0Rm9udCB8fCB0aGlzLmxhYmVsU3R5bGUudGV4dEZvbnQ7XG4gICAgdGhpcy5sb2FkaW5nU3R5bGUuaWNvblRpbnQgPSB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUubG9hZGluZ0ljb25UaW50IHx8IHRoaXMubG9hZGluZ1N0eWxlLmljb25UaW50O1xuICB9XG4gIHNldE9uZ29pbmdDYWxsU3R5bGUgPSAoKSA9PiB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZSA9IG5ldyBDYWxsc2NyZWVuU3R5bGUoe1xuICAgICAgbWF4SGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCIjMWMyMjI2XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiNDAwcHhcIixcbiAgICAgIG1pbldpZHRoOiBcIjQwMHB4XCIsXG4gICAgICBtaW5pbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgbWF4aW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLm9uZ29pbmdDYWxsU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5vbmdvaW5nQ2FsbFN0eWxlIH07XG4gIH07XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IERhdGVTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBwYWRkaW5nOiBcIjZweCAxMnB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUgfTtcbiAgfVxuICBzZXRNZXNzYWdlc1N0eWxlKCkge1xuICAgIHRoaXMucG9wb3ZlclN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjMzMHB4XCIsXG4gICAgICB3aWR0aDogXCIzMjVweFwiLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBib3hTaGFkb3c6IGAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCl9IDBweCAwcHggOHB4YFxuICAgIH1cbiAgICBsZXQgZGVmYXVsdEVtb2ppU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMzMwcHhcIixcbiAgICAgIHdpZHRoOiBcIjMyNXB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAuLi50aGlzLmVtb2ppS2V5Ym9hcmRTdHlsZVxuICAgIH1cbiAgICB0aGlzLmVtb2ppS2V5Ym9hcmRTdHlsZSA9IGRlZmF1bHRFbW9qaVN0eWxlO1xuICAgIHRoaXMudW5yZWFkTWVzc2FnZXNTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgIH07XG4gICAgdGhpcy5zbWFydFJlcGx5U3R5bGUgPSB7XG4gICAgICByZXBseVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVwbHlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICByZXBseUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm94U2hhZG93OiBgMHB4IDBweCAxcHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpfWAsXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICAuLi50aGlzLnNtYXJ0UmVwbHlTdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0eWxlID0ge1xuICAgICAgcmVwbHlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlcGx5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcmVwbHlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJveFNoYWRvdzogYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3R5bGUsXG4gICAgfTtcblxuICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0eWxlID0ge1xuICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3R5bGUsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm94U2hhZG93OiBgMHB4IDBweCAxcHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpfWAsXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCkhLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpISxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBib3JkZXI6IFwiMXB4IHNvbGlkICM2ODUxRDZcIixcbiAgICB9O1xuXG4gICAgdGhpcy5mdWxsU2NyZWVuVmlld2VyU3R5bGUuY2xvc2VJY29uVGludCA9XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKTtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBNZXNzYWdlTGlzdFN0eWxlID0gbmV3IE1lc3NhZ2VMaXN0U3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGhyZWFkUmVwbHlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRocmVhZFJlcGx5SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICB0aHJlYWRSZXBseVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRocmVhZFJlcGx5VW5yZWFkQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB0aHJlYWRSZXBseVVucmVhZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHRocmVhZFJlcGx5VW5yZWFkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICBUaW1lc3RhbXBUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uM1xuICAgICAgKSxcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5tZXNzYWdlTGlzdFN0eWxlIH07XG4gICAgdGhpcy5saW5rUHJldmlld1N0eWxlID0gbmV3IExpbmtQcmV2aWV3U3R5bGUoe1xuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBkZXNjcmlwdGlvbkNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVzY3JpcHRpb25Gb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgfSk7XG4gICAgdGhpcy5kb2N1bWVudEJ1YmJsZVN0eWxlID0ge1xuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBidXR0b25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICB9O1xuICAgIHRoaXMucG9sbEJ1YmJsZVN0eWxlID0ge1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdm90ZVBlcmNlbnRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB2b3RlUGVyY2VudFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBvbGxRdWVzdGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHBvbGxRdWVzdGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHBvbGxPcHRpb25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHBvbGxPcHRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBwb2xsT3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG9wdGlvbnNJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRvdGFsVm90ZUNvdW50VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdG90YWxWb3RlQ291bnRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWxlY3RlZFBvbGxPcHRpb25CYWNrZ3JvdW5kOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgdXNlclNlbGVjdGVkT3B0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBwb2xsT3B0aW9uQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgcG9sbE9wdGlvbkJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9O1xuICAgIHRoaXMuaW1hZ2VNb2RlcmF0aW9uU3R5bGUgPSB7XG4gICAgICBmaWx0ZXJDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHdhcm5pbmdUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIHdhcm5pbmdUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLmNvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJkYXJrXCIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBtZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH07XG4gIH1cbiAgZ2V0UmVjZWlwdFN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IGlzVGV4dE1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCAmJlxuICAgICAgdGhpcy5hbGlnbm1lbnQgIT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB0aGlzLnJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IGlzVGV4dE1lc3NhZ2VcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjExcHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pO1xuICAgIHJldHVybiB7IC4uLnRoaXMucmVjZWlwdFN0eWxlIH07XG4gIH1cbiAgY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKCF0aGlzLnRlbXBsYXRlcyB8fCB0aGlzLnRlbXBsYXRlcz8ubGVuZ3RoID09IDApIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlID1cbiAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZVRlbXBsYXRlcygpO1xuICAgICAgdGhpcy5jYXRlZ29yaWVzID1cbiAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZUNhdGVnb3JpZXMoKTtcbiAgICAgIHRoaXMudHlwZXMgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxNZXNzYWdlVHlwZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlcztcbiAgICB9XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBudWxsO1xuICAgIGlmICh0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCkge1xuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKVxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgICAuc2V0Q2F0ZWdvcmllcyh0aGlzLmNhdGVnb3JpZXMpXG4gICAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSk7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlci5nZXRVaWQoKSkuYnVpbGQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA/IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZSh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpXG4gICAgICAgICAgOiBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgICAuc2V0VHlwZXModGhpcy50eXBlcylcbiAgICAgICAgICAgIC5oaWRlUmVwbGllcyh0cnVlKVxuICAgICAgICAgICAgLnNldENhdGVnb3JpZXModGhpcy5jYXRlZ29yaWVzKVxuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY29tcHV0ZVVucmVhZENvdW50KCk7XG4gICAgICB0aGlzLmZldGNoUHJldmlvdXNNZXNzYWdlcygpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXB1dGVVbnJlYWRDb3VudCgpIHtcbiAgICBpZiAodGhpcy51c2VyIHx8IHRoaXMuZ3JvdXApIHtcbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgQ29tZXRDaGF0LmdldFVucmVhZE1lc3NhZ2VDb3VudEZvclVzZXIodGhpcy51c2VyPy5nZXRVaWQoKSkudGhlbihcbiAgICAgICAgICAocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkeW5hbWljS2V5ID0gdGhpcy51c2VyPy5nZXRVaWQoKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA9IHJlc1tkeW5hbWljS2V5IGFzIGtleW9mIHR5cGVvZiByZXNdO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yKSA9PiB7IH1cbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRVbnJlYWRNZXNzYWdlQ291bnRGb3JHcm91cCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLnRoZW4oXG4gICAgICAgICAgKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZHluYW1pY0tleSA9IHRoaXMuZ3JvdXA/LmdldEd1aWQoKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA9IHJlc1tkeW5hbWljS2V5IGFzIGtleW9mIHR5cGVvZiByZXNdO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yKSA9PiB7IH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIExpc3RlbmVyIFRvIFJlY2VpdmUgTWVzc2FnZXMgaW4gUmVhbCBUaW1lXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgZmV0Y2hQcmV2aW91c01lc3NhZ2VzID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnJlaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZSh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgLnNldE1lc3NhZ2VJZCh0aGlzLm1lc3NhZ2VzTGlzdFswXS5nZXRJZCgpKVxuICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKS5idWlsZCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyXG4gICAgICAuZmV0Y2hQcmV2aW91cygpXG4gICAgICAudGhlbihcbiAgICAgICAgKG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlTGlzdCA9IG1lc3NhZ2VMaXN0Lm1hcChcbiAgICAgICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLmNvbnZlcnRJbnRlcmFjdGl2ZU1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgICAgICAgLy8gTm8gTWVzc2FnZXMgRm91bmRcbiAgICAgICAgICBpZiAobWVzc2FnZUxpc3QubGVuZ3RoID09PSAwICYmIHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgIGlmICghdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiYgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdGFydGVyKSB7XG4gICAgICAgICAgICAgIHRoaXMuZmV0Y2hDb252ZXJzYXRpb25TdGFydGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuZ2V0VW5yZWFkQ291bnQgPj0gdGhpcy51bnJlYWRNZXNzYWdlVGhyZXNob2xkICYmXG4gICAgICAgICAgICAgIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3VtbWFyeVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuZmV0Y2hDb252ZXJzYXRpb25TdW1tYXJ5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihcbiAgICAgICAgICAgICAgICBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXS5nZXRJZCgpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGxldCBpc1NlbnRCeU1lOiBib29sZWFuID0gbGFzdE1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKSA9PVxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgIWlzU2VudEJ5TWUgJiZcbiAgICAgICAgICAgICAgIWxhc3RNZXNzYWdlLmdldERlbGl2ZXJlZEF0KClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAvL21hcmsgdGhlIG1lc3NhZ2UgYXMgZGVsaXZlcmVkXG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobGFzdE1lc3NhZ2UpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAocmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBtLmdldElkKCkgPT09IE51bWJlcihyZWNlaXB0Py5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzRGVsaXZlcmVkKG1lc3NhZ2VLZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFsYXN0TWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiYgIWlzU2VudEJ5TWUpIHtcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobGFzdE1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAudGhlbigocmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBtLmdldElkKCkgPT09IE51bWJlcihyZWNlaXB0Py5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzUmVhZChtZXNzYWdlS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgLy9pZiB0aGUgc2VuZGVyIG9mIHRoZSBtZXNzYWdlIGlzIG5vdCB0aGUgbG9nZ2VkaW4gdXNlciwgbWFyayBpdCBhcyByZWFkLlxuICAgICAgICAgICAgbGV0IHByZXZTY3JvbGxIZWlnaHQgPSB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubGlzdFNjcm9sbC5uYXRpdmVFbGVtZW50LnNjcm9sbFRvcCA9XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCAtIHByZXZTY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnByZXBlbmRNZXNzYWdlcyhtZXNzYWdlTGlzdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9LFxuICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcbiAgZmV0Y2hBY3Rpb25NZXNzYWdlcygpIHtcbiAgICBsZXQgcmVxdWVzdEJ1aWxkZXI6IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgIC5zZXRUeXBlKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKVxuICAgICAgLnNldENhdGVnb3J5KENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24pXG4gICAgICAuc2V0TWVzc2FnZUlkKHRoaXMubGFzdE1lc3NhZ2VJZClcbiAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIHJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgIHJlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKTtcbiAgICB9XG4gICAgcmVxdWVzdEJ1aWxkZXIuYnVpbGQoKVxuICAgICAgLmZldGNoTmV4dCgpXG4gICAgICAudGhlbigobWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzICYmIG1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBtZXNzYWdlcy5mb3JFYWNoKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkFjdGlvbikuZ2V0QWN0aW9uT24oKSBpbnN0YW5jZW9mXG4gICAgICAgICAgICAgIENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgIChtKSA9PlxuICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PVxuICAgICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICkuZ2V0QWN0aW9uT24oKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICkuZ2V0SWQoKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZUtleSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0gPSAoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5BY3Rpb25cbiAgICAgICAgICAgICAgICApLmdldEFjdGlvbk9uKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuICBmZXRjaE5leHRNZXNzYWdlID0gKCkgPT4ge1xuICAgIGxldCBpbmRleCA9IHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCAtIDE7XG4gICAgbGV0IG1lc3NhZ2VJZDogbnVtYmVyO1xuICAgIGlmIChcbiAgICAgIHRoaXMucmVpbml0aWFsaXplZCB8fFxuICAgICAgKHRoaXMubGFzdE1lc3NhZ2VJZCA+IDAgJiYgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkKVxuICAgICkge1xuICAgICAgaWYgKHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCkge1xuICAgICAgICB0aGlzLmZldGNoQWN0aW9uTWVzc2FnZXMoKTtcbiAgICAgICAgbWVzc2FnZUlkID0gdGhpcy5sYXN0TWVzc2FnZUlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZUlkID0gdGhpcy5tZXNzYWdlc0xpc3RbaW5kZXhdLmdldElkKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJcbiAgICAgICAgICA/IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgICAgLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKVxuICAgICAgICAgICAgLnNldE1lc3NhZ2VJZChtZXNzYWdlSWQpXG4gICAgICAgICAgICAuYnVpbGQoKVxuICAgICAgICAgIDogdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgICAuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpXG4gICAgICAgICAgICAuc2V0TWVzc2FnZUlkKG1lc3NhZ2VJZClcbiAgICAgICAgICAgIC5idWlsZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgLnNldE1lc3NhZ2VJZChtZXNzYWdlSWQpXG4gICAgICAgICAgLnNldENhdGVnb3JpZXModGhpcy5jYXRlZ29yaWVzKVxuICAgICAgICAgIC5oaWRlUmVwbGllcyh0cnVlKVxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSkuYnVpbGQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlclxuICAgICAgICAuZmV0Y2hOZXh0KClcbiAgICAgICAgLnRoZW4oXG4gICAgICAgICAgKG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgbWVzc2FnZUxpc3QgPSBtZXNzYWdlTGlzdC5tYXAoXG4gICAgICAgICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09XG4gICAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZVxuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgICAgICAgICAgLy8gTm8gTWVzc2FnZXMgRm91bmRcbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdC5sZW5ndGggPT09IDAgJiYgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0TWVzc2FnZUlkID0gTnVtYmVyKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV0uZ2V0SWQoKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICFsYXN0TWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICFsYXN0TWVzc2FnZT8uZ2V0RGVsaXZlcmVkQXQoKSAmJlxuICAgICAgICAgICAgICAgICAgbGFzdE1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9XG4gICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChsYXN0TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlTGlzdC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRNZXNzYWdlcyhtZXNzYWdlTGlzdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdLmdldElkKClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zY3JvbGxUb0JvdHRvbU9uTmV3TWVzc2FnZXMpIHtcbiAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY291bnRUZXh0ID0gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIik7XG4gICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAhPSBcIlwiXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50VGV4dCA9XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGxvY2FsaXplKFwiTkVXX01FU1NBR0VcIik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50LnB1c2goLi4ubWVzc2FnZUxpc3QpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgICAgICAgICBcIiDihpMgXCIgKyB0aGlzLlVucmVhZENvdW50Lmxlbmd0aCArIFwiIFwiICsgY291bnRUZXh0O1xuICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldERlbGl2ZXJlZEF0KCkgJiZcbiAgICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG4gIGFwcGVuZE1lc3NhZ2VzID0gKG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkgPT4ge1xuICAgIHRoaXMubWVzc2FnZXNMaXN0LnB1c2goLi4ubWVzc2FnZXMpO1xuICAgIHRoaXMubWVzc2FnZUNvdW50ID0gdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoO1xuICAgIGlmICh0aGlzLm1lc3NhZ2VDb3VudCA+IHRoaXMudGhyZXNob2xkVmFsdWUpIHtcbiAgICAgIHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICB9XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBhdHRhY2hDb25uZWN0aW9uTGlzdGVuZXIoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENvbm5lY3Rpb25MaXN0ZW5lcihcbiAgICAgIHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNvbm5lY3Rpb25MaXN0ZW5lcih7XG4gICAgICAgIG9uQ29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV4dE1lc3NhZ2UoKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRGlzY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gT24gRGlzY29ubmVjdGVkXCIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIGFkZE1lc3NhZ2VFdmVudExpc3RlbmVycygpIHtcbiAgICB0cnkge1xuICAgICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICAgIHRoaXMuZ3JvdXBMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICBjaGFuZ2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBuZXdTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgICBvbGRTY29wZTogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyU2NvcGUsXG4gICAgICAgICAgICBjaGFuZ2VkR3JvdXA6IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uU0NPUEVfQ0hBTkdFLFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBjaGFuZ2VkR3JvdXAsXG4gICAgICAgICAgICAgIHsgdXNlcjogY2hhbmdlZFVzZXIsIHNjb3BlOiBuZXdTY29wZSB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGtpY2tlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAga2lja2VkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAga2lja2VkRnJvbTogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5LSUNLRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGtpY2tlZEZyb20sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBraWNrZWRVc2VyLFxuICAgICAgICAgICAgICAgIGhhc0pvaW5lZDogZmFsc2UsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBiYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBiYW5uZWRGcm9tOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgYmFubmVkRnJvbSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZXI6IGJhbm5lZFVzZXIsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyVW5iYW5uZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdW5iYW5uZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1bmJhbm5lZEZyb206IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uVU5CQU5ORUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIHVuYmFubmVkRnJvbSxcbiAgICAgICAgICAgICAgeyB1c2VyOiB1bmJhbm5lZFVzZXIgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uTWVtYmVyQWRkZWRUb0dyb3VwOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdXNlckFkZGVkOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVzZXJBZGRlZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVzZXJBZGRlZEluOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkFEREVELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICB1c2VyQWRkZWRJbixcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZXI6IHVzZXJBZGRlZCxcbiAgICAgICAgICAgICAgICBoYXNKb2luZWQ6IHRydWUsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyTGVmdDogKFxuICAgICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgICAgICAgICAgbGVhdmluZ1VzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcixcbiAgICAgICAgICAgIGdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgZ3JvdXAsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBsZWF2aW5nVXNlcixcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICAgICAgICAgIGpvaW5lZFVzZXI6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcixcbiAgICAgICAgICAgIGpvaW5lZEdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBqb2luZWRHcm91cCxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZXI6IGpvaW5lZFVzZXIsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBpZiAodGhpcy5lbmFibGVDYWxsaW5nKSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRDYWxsTGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy5jYWxsTGlzdGVuZXJJZCxcbiAgICAgICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgICBvbkluY29taW5nQ2FsbFJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25PdXRnb2luZ0NhbGxBY2NlcHRlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlYWN0aW9ucykge1xuICAgICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uQWRkZWQgPVxuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlUmVhY3Rpb25BZGRlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAocmVhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUNUSU9OX0FEREVELFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uUmVjZWlwdFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIHRoaXMub25NZXNzYWdlUmVhY3Rpb25SZW1vdmVkID1cbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAocmVhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUNUSU9OX1JFTU9WRUQsXG4gICAgICAgICAgICAgICAgcmVhY3Rpb25SZWNlaXB0XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblRleHRNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuVEVYVF9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBGb3JtTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogU2NoZWR1bGVyTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDYXJkTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMSVZFUkVELFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VSZWNlaXB0XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzUmVhZC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VSZWNlaXB0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWRCeUFsbCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWRCeUFsbC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVJlYWRBbmREZWxpdmVyZWQobWVzc2FnZVJlY2VpcHQsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VSZWNlaXB0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGwuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2VSZWNlaXB0LCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxJVkVSRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VSZWNlaXB0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VEZWxldGVkLnN1YnNjcmliZShcbiAgICAgICAgKGRlbGV0ZWRNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQsXG4gICAgICAgICAgICBkZWxldGVkTWVzc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZUVkaXRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgICAgKGVkaXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVELFxuICAgICAgICAgICAgZWRpdGVkTWVzc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uVHJhbnNpZW50TWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKHRyYW5zaWVudE1lc3NhZ2U6IENvbWV0Q2hhdC5UcmFuc2llbnRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGl2ZVJlYWN0aW9uOiBhbnkgPSB0cmFuc2llbnRNZXNzYWdlLmdldERhdGEoKTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgICAgICAgdGhpcy51c2VyICYmXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMudXNlci5nZXRVaWQoKSAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1widHlwZVwiXSA9PSBcImxpdmVfcmVhY3Rpb25cIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NMaXZlUmVhY3Rpb24ubmV4dChcbiAgICAgICAgICAgICAgICBsaXZlUmVhY3Rpb25bXCJyZWFjdGlvblwiXVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PSB0aGlzLmdyb3VwLmdldEd1aWQoKSAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1widHlwZVwiXSA9PSBcImxpdmVfcmVhY3Rpb25cIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NMaXZlUmVhY3Rpb24ubmV4dChcbiAgICAgICAgICAgICAgICBsaXZlUmVhY3Rpb25bXCJyZWFjdGlvblwiXVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkludGVyYWN0aW9uR29hbENvbXBsZXRlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25JbnRlcmFjdGlvbkdvYWxDb21wbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChyZWNlaXB0OiBDb21ldENoYXQuSW50ZXJhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSU9OX0dPQUxfQ09NUExFVEVELFxuICAgICAgICAgICAgICByZWNlaXB0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIFVwZGF0ZXMgbWVzc2FnZUxpc3Qgb24gYmFzaXMgb2YgdXNlciBhY3Rpdml0eSBvciBncm91cCBhY3Rpdml0eSBvciBjYWxsaW5nIGFjdGl2aXR5XG4gICAqIEBwYXJhbSAge2FueT1udWxsfSBrZXlcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0IHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cCB8IG51bGw9bnVsbH0gZ3JvdXBcbiAgICogQHBhcmFtICB7YW55PW51bGx9IG9wdGlvbnNcbiAgICovXG4gIG1lc3NhZ2VVcGRhdGUoXG4gICAga2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQgfCBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBhbnkgPSBudWxsLFxuICAgIGdyb3VwOiBDb21ldENoYXQuR3JvdXAgfCBudWxsID0gbnVsbCxcbiAgICBvcHRpb25zOiBhbnkgPSBudWxsXG4gICkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgPSBbXTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuVEVYVF9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVjZWl2ZWQobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxJVkVSRUQ6XG4gICAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUQ6XG4gICAgICAgICAgdGhpcy5tZXNzYWdlUmVhZEFuZERlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9FRElURUQ6IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VFZGl0ZWQobWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0U6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5VTkJBTk5FRDoge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1lc3NhZ2VSZWNlaXZlZChtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElPTl9HT0FMX0NPTVBMRVRFRDpcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlSW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fQURERUQ6XG4gICAgICAgICAgdGhpcy5vblJlYWN0aW9uVXBkYXRlZChtZXNzYWdlLCB0cnVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUNUSU9OX1JFTU9WRUQ6XG4gICAgICAgICAgdGhpcy5vblJlYWN0aW9uVXBkYXRlZChtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyBhIG1lc3NhZ2UncyByZWFjdGlvbnMgYmFzZWQgb24gYSBuZXcgcmVhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlJlYWN0aW9uRXZlbnR9IG1lc3NhZ2UgLSBUaGUgbmV3IG1lc3NhZ2UgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNBZGRlZCAtIFRydWUgaWYgdGhlIHJlYWN0aW9uIHdhcyBhZGRlZCwgZmFsc2UgaWYgaXQgd2FzIHJlbW92ZWQuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGZhbHNlIGlmIHRoZSBtZXNzYWdlIHdhcyBub3QgZm91bmQsIHRydWUgb3RoZXJ3aXNlLlxuICAgKi9cblxuICBvblJlYWN0aW9uVXBkYXRlZChtZXNzYWdlOiBDb21ldENoYXQuUmVhY3Rpb25FdmVudCwgaXNBZGRlZDogYm9vbGVhbikge1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IG1lc3NhZ2UuZ2V0UmVhY3Rpb24oKT8uZ2V0TWVzc2FnZUlkKCk7XG4gICAgY29uc3QgbWVzc2FnZU9iamVjdCA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQobWVzc2FnZUlkKTtcblxuICAgIGlmICghbWVzc2FnZU9iamVjdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBhY3Rpb246IENvbWV0Q2hhdC5SRUFDVElPTl9BQ1RJT047XG4gICAgaWYgKGlzQWRkZWQpIHtcbiAgICAgIGFjdGlvbiA9IENvbWV0Q2hhdC5SRUFDVElPTl9BQ1RJT04uUkVBQ1RJT05fQURERUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFjdGlvbiA9IENvbWV0Q2hhdC5SRUFDVElPTl9BQ1RJT04uUkVBQ1RJT05fUkVNT1ZFRDtcbiAgICB9XG4gICAgbGV0IG1vZGlmaWVkTWVzc2FnZSA9XG4gICAgICBDb21ldENoYXQuQ29tZXRDaGF0SGVscGVyLnVwZGF0ZU1lc3NhZ2VXaXRoUmVhY3Rpb25JbmZvKFxuICAgICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgICBtZXNzYWdlLmdldFJlYWN0aW9uKCksXG4gICAgICAgIGFjdGlvblxuICAgICAgKTtcbiAgICBpZiAobW9kaWZpZWRNZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobW9kaWZpZWRNZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIHRyYW5zbGF0ZSBtZXNzYWdlIHRoZW4gY2FsbCB1cGRhdGUgbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIC8vIHRyYW5zbGF0ZU1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gIC8vIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFya01lc3NhZ2VBc0RlbGl2ZXJlZCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5kaXNhYmxlUmVjZWlwdCAmJlxuICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAmJlxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImRlbGl2ZXJlZEF0XCIpID09PSBmYWxzZVxuICAgICkge1xuICAgICAgQ29tZXRDaGF0Lm1hcmtBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBXaGVuIE1lc3NhZ2UgaXMgUmVjZWl2ZWRcbiAgICogQHBhcmFtIG1lc3NhZ2VcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1lc3NhZ2VSZWNlaXZlZChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHsgICAgICAgICAgIFxuICAgICAgIFxuICAgIHRyeSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmdyb3VwPy5nZXRHdWlkKCkgfHxcbiAgICAgICAgKG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09PSB0aGlzLnVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSlcbiAgICAgICkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKCFtZXNzYWdlPy5nZXRSZWFkQXQoKSAmJlxuICAgICAgICAgICAgIW1lc3NhZ2U/LmdldFBhcmVudE1lc3NhZ2VJZCgpICYmXG4gICAgICAgICAgICB0aGlzLmlzT25Cb3R0b20pIHx8XG4gICAgICAgICAgKCFtZXNzYWdlPy5nZXRSZWFkQXQoKSAmJlxuICAgICAgICAgICAgbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJlxuICAgICAgICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiZcbiAgICAgICAgICAgIHRoaXMuaXNPbkJvdHRvbSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChtZXNzYWdlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQobWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogVXBkYXRpbmcgdGhlIHJlcGx5IGNvdW50IG9mIFRocmVhZCBQYXJlbnQgTWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VzXG4gICAqL1xuICB1cGRhdGVSZXBseUNvdW50KG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHJlY2VpdmVkTWVzc2FnZSA9IG1lc3NhZ2VzO1xuICAgICAgbGV0IG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICBsZXQgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gcmVjZWl2ZWRNZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpXG4gICAgICApO1xuICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICB2YXIgbWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUtleV07XG4gICAgICAgIGxldCByZXBseUNvdW50ID0gbWVzc2FnZU9iai5nZXRSZXBseUNvdW50KClcbiAgICAgICAgICA/IG1lc3NhZ2VPYmouZ2V0UmVwbHlDb3VudCgpXG4gICAgICAgICAgOiAwO1xuICAgICAgICByZXBseUNvdW50ID0gcmVwbHlDb3VudCArIDE7XG4gICAgICAgIG1lc3NhZ2VPYmouc2V0UmVwbHlDb3VudChyZXBseUNvdW50KTtcbiAgICAgICAgbWVzc2FnZUxpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG1lc3NhZ2VPYmopO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlTGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAgICovXG4gIG1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgLy8gdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgdGhpcy51cGRhdGVVbnJlYWRSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICAgIHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgaWYgKCF0aGlzLmlzT25Cb3R0b20pIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgY291bnRUZXh0ID0gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIik7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAmJlxuICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAhPSBcIlwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb3VudFRleHQgPSB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb3VudFRleHQgPVxuICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50Lmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpXG4gICAgICAgICAgICAgICAgOiBsb2NhbGl6ZShcIk5FV19NRVNTQUdFXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50LnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgdGhpcy5uZXdNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgXCIg4oaTIFwiICsgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggKyBcIiBcIiArIGNvdW50VGV4dDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpe1xuICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICB9XG4gICAgLy9oYW5kbGluZyBkb20gbGFnIC0gaW5jcmVtZW50IGNvdW50IG9ubHkgZm9yIG1haW4gbWVzc2FnZSBsaXN0XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gZmFsc2UgJiZcbiAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkXG4gICAgKSB7XG4gICAgICArK3RoaXMubWVzc2FnZUNvdW50O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtZXNzYWdlLmhhc093blByb3BlcnR5KFwicGFyZW50TWVzc2FnZUlkXCIpID09PSB0cnVlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICB0aGlzLmlzT25Cb3R0b21cbiAgICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChtZXNzYWdlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgfVxuICB9O1xuICBwbGF5QXVkaW8oKSB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5Tb3VuZC5pbmNvbWluZ01lc3NhZ2UsXG4gICAgICAgICAgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0Q2FsbEJ1aWxkZXIgPSAoKTogYW55ID0+IHtcbiAgICBjb25zdCBjYWxsU2V0dGluZ3M6IGFueSA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuICAgICAgLmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSlcbiAgICAgIC5zZXRJc0F1ZGlvT25seUNhbGwoZmFsc2UpXG4gICAgICAuc2V0Q2FsbExpc3RlbmVyKFxuICAgICAgICBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5PbmdvaW5nQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkNhbGxFbmRCdXR0b25QcmVzc2VkOiAoKSA9PiB7XG4gICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBudWxsKTtcbiAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dCh7fSBhcyBDb21ldENoYXQuQ2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgcmV0dXJuIGNhbGxTZXR0aW5ncztcbiAgfTtcbiAgcmVJbml0aWFsaXplTWVzc2FnZUxpc3QoKSB7XG4gICAgdGhpcy5yZWluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLmdyb3VwTGlzdGVuZXJJZCA9IFwiZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLmNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5hZGRNZXNzYWdlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICBpZiAodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICBpZiAodGhpcy5rZWVwUmVjZW50TWVzc2FnZXMpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3Quc3BsaWNlKDEsIHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCAtIDMwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgzMCk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyXG4gICAgICAgID8gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXIuZ2V0VWlkKCkpLmJ1aWxkKClcbiAgICAgICAgOiB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwLmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgxLCB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAzMCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgzMCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICByZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlciA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VDb3VudCA9IDA7XG4gICAgfVxuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBudWxsO1xuICAgIENvbWV0Q2hhdC5yZW1vdmVHcm91cExpc3RlbmVyKHRoaXMuZ3JvdXBMaXN0ZW5lcklkKTtcbiAgICBDb21ldENoYXQucmVtb3ZlQ2FsbExpc3RlbmVyKHRoaXMuY2FsbExpc3RlbmVySWQpO1xuICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUxpc3QoKTtcbiAgfTtcbiAgZ2V0TWVzc2FnZVJlY2VpcHQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IHJlY2VpcHQgPSBNZXNzYWdlUmVjZWlwdFV0aWxzLmdldFJlY2VpcHRTdGF0dXMobWVzc2FnZSk7XG4gICAgcmV0dXJuIHJlY2VpcHQ7XG4gIH1cbiAgbWVzc2FnZVJlYWRBbmREZWxpdmVyZWQobWVzc2FnZTogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0LCBpc0dyb3VwUmVjZWlwdDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmKGlzR3JvdXBSZWNlaXB0KXtcbiAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgIG0uZ2V0SWQoKSA9PSBOdW1iZXIobWVzc2FnZS5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldLnNldERlbGl2ZXJlZEF0KFxuICAgICAgICAgICAgbWVzc2FnZS5nZXREZWxpdmVyZWRBdCgpXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpKTtcblxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpcHRUeXBlKCkgPT0gbWVzc2FnZS5SRUNFSVBUX1RZUEUuREVMSVZFUkVEX1RPX0FMTF9SRUNFSVBUICAmJiB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5KTtcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IG1lc3NhZ2UuUkVDRUlQVF9UWVBFLlJFQURfQllfQUxMX1JFQ0VJUFQgICYmIHRoaXMubWFya0FsbE1lc3NhZ0FzUmVhZChtZXNzYWdlS2V5KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpICE9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkRFTElWRVJZXG4gICAgICAgICkge1xuICAgICAgICAgIC8vc2VhcmNoIGZvciBtZXNzYWdlXG4gICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICBtLmdldElkKCkgPT0gTnVtYmVyKG1lc3NhZ2UuZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XS5zZXREZWxpdmVyZWRBdChcbiAgICAgICAgICAgICAgbWVzc2FnZS5nZXREZWxpdmVyZWRBdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5KTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpcHRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuUkVBRFxuICAgICAgICApIHtcbiAgICAgICAgICAvL3NlYXJjaCBmb3IgbWVzc2FnZVxuICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgbS5nZXRJZCgpID09IE51bWJlcihtZXNzYWdlLmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzUmVhZChtZXNzYWdlS2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gcmVhZE1lc3NhZ2VcbiAgICovXG4gIG1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleTogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IG1lc3NhZ2VLZXk7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoIXRoaXMubWVzc2FnZXNMaXN0W2ldLmdldFJlYWRBdCgpKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0W2ldLnNldFJlYWRBdChcbiAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQodGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0pO1xuICB9XG4gIG1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5OiBudW1iZXIpIHtcbiAgICBmb3IgKGxldCBpID0gbWVzc2FnZUtleTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmICghdGhpcy5tZXNzYWdlc0xpc3RbaV0uZ2V0RGVsaXZlcmVkQXQoKSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFtpXS5zZXREZWxpdmVyZWRBdChcbiAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEVtaXRzIGFuIEFjdGlvbiBJbmRpY2F0aW5nIHRoYXQgYSBtZXNzYWdlIHdhcyBkZWxldGVkIGJ5IHRoZSB1c2VyL3BlcnNvbiB5b3UgYXJlIGNoYXR0aW5nIHdpdGhcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIC8qKlxuICAgKiBEZXRlY3RzIGlmIHRoZSBtZXNzYWdlIHRoYXQgd2FzIGVkaXQgaXMgeW91ciBjdXJyZW50IG9wZW4gY29udmVyc2F0aW9uIHdpbmRvd1xuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWVzc2FnZUVkaXRlZCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHRoaXMudXNlciAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHRoaXMudXNlciAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdXBkYXRlSW50ZXJhY3RpdmVNZXNzYWdlID0gKHJlY2VpcHQ6IENvbWV0Q2hhdC5JbnRlcmFjdGlvblJlY2VpcHQpID0+IHtcbiAgICBpZiAodGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09PSByZWNlaXB0LmdldFNlbmRlcigpLmdldFVpZCgpKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5nZXRNZXNzYWdlQnlJZChcbiAgICAgICAgcmVjZWlwdC5nZXRNZXNzYWdlSWQoKVxuICAgICAgKSBhcyBDb21ldENoYXQuSW50ZXJhY3RpdmVNZXNzYWdlO1xuICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKFN0cmluZyhtZXNzYWdlPy5nZXRJZCgpKSA9PSBTdHJpbmcocmVjZWlwdC5nZXRNZXNzYWdlSWQoKSkpIHtcbiAgICAgICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IHJlY2VpcHQuZ2V0SW50ZXJhY3Rpb25zKCk7XG4gICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZSkuc2V0SW50ZXJhY3Rpb25zKFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25cbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShcbiAgICAgICAgICAgIEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLmNvbnZlcnRJbnRlcmFjdGl2ZU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IGEgbWVzc2FnZSB3YXMgZGVsZXRlZCBieSB0aGUgdXNlci9wZXJzb24geW91IGFyZSBjaGF0dGluZyB3aXRoXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICB1cGRhdGVFZGl0ZWRNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHZhciBtZXNzYWdlTGlzdCA9IHRoaXMubWVzc2FnZXNMaXN0O1xuICAgIC8vIGxldCBuZXdNZXNzYWdlID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2UpO1xuICAgIHZhciBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRJZCgpXG4gICAgKTtcbiAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XSA9IG1lc3NhZ2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIC8vIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAvLyAgIHRoaXMubWVzc2FnZXNMaXN0ID0gW1xuICAgIC8vICAgICAuLi5tZXNzYWdlTGlzdC5zbGljZSgwLCBtZXNzYWdlS2V5KSxcbiAgICAvLyAgICAgbWVzc2FnZSxcbiAgICAvLyAgICAgLi4ubWVzc2FnZUxpc3Quc2xpY2UobWVzc2FnZUtleSArIDEpLFxuICAgIC8vICAgXTtcbiAgICAvLyAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAvLyB9XG4gIH07XG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IEdyb3VwIERhdGEgaGFzIGJlZW4gdXBkYXRlZFxuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBXaGVuIGN1c3RvbSBtZXNzYWdlcyBhcmUgcmVjZWl2ZWQgZWcuIFBvbGwsIFN0aWNrZXJzIGVtaXRzIGFjdGlvbiB0byB1cGRhdGUgbWVzc2FnZSBsaXN0XG4gICAqIEBwYXJhbSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBjdXN0b21NZXNzYWdlUmVjZWl2ZWQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5ncm91cD8uZ2V0R3VpZCgpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgICFtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKSB8fFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICAgICAgICB0aGlzLmlzT25Cb3R0b20pXG4gICAgICAgICkge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgICB0aGlzLmN1c3RvbU1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICAgKi9cbiAgY3VzdG9tTWVzc2FnZVJlY2VpdmVkSGFuZGxlciA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICArK3RoaXMubWVzc2FnZUNvdW50O1xuICAgIC8vIGFkZCByZWNlaXZlZCBtZXNzYWdlIHRvIG1lc3NhZ2VzIGxpc3RcbiAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgLy8gdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgdGhpcy51cGRhdGVVbnJlYWRSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICAgIHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgaWYgKCF0aGlzLmlzT25Cb3R0b20pIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgY291bnRUZXh0ID0gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIik7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAmJlxuICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAhPSBcIlwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb3VudFRleHQgPSB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb3VudFRleHQgPVxuICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50Lmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpXG4gICAgICAgICAgICAgICAgOiBsb2NhbGl6ZShcIk5FV19NRVNTQUdFXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50LnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgdGhpcy5uZXdNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgXCIg4oaTIFwiICsgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggKyBcIiBcIiArIGNvdW50VGV4dDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpe1xuICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICB9XG4gICAgLy9oYW5kbGluZyBkb20gbGFnIC0gaW5jcmVtZW50IGNvdW50IG9ubHkgZm9yIG1haW4gbWVzc2FnZSBsaXN0XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gZmFsc2UgJiZcbiAgICAgICF0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAgIC8vaWYgdGhlIHVzZXIgaGFzIG5vdCBzY3JvbGxlZCBpbiBjaGF0IHdpbmRvdyhzY3JvbGwgaXMgYXQgdGhlIGJvdHRvbSBvZiB0aGUgY2hhdCB3aW5kb3cpXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IHRydWUgJiZcbiAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICB0aGlzLmlzT25Cb3R0b21cbiAgICApIHtcbiAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChtZXNzYWdlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gZGF0ZXMgYW5kIHNldHMgRGF0ZSBvbiBhIGEgbmV3IGRheVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge251bWJlcn0gZmlyc3REYXRlXG4gICAqIEBwYXJhbSAge251bWJlcn0gc2Vjb25kRGF0ZVxuICAgKi9cbiAgaXNEYXRlRGlmZmVyZW50KFxuICAgIGZpcnN0RGF0ZTogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICAgIHNlY29uZERhdGU6IG51bWJlciB8IHVuZGVmaW5lZFxuICApIHtcbiAgICBsZXQgZmlyc3REYXRlT2JqOiBEYXRlLCBzZWNvbmREYXRlT2JqOiBEYXRlO1xuICAgIGZpcnN0RGF0ZU9iaiA9IG5ldyBEYXRlKGZpcnN0RGF0ZSEgKiAxMDAwKTtcbiAgICBzZWNvbmREYXRlT2JqID0gbmV3IERhdGUoc2Vjb25kRGF0ZSEgKiAxMDAwKTtcbiAgICByZXR1cm4gKFxuICAgICAgZmlyc3REYXRlT2JqLmdldERhdGUoKSAhPT0gc2Vjb25kRGF0ZU9iai5nZXREYXRlKCkgfHxcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXRNb250aCgpICE9PSBzZWNvbmREYXRlT2JqLmdldE1vbnRoKCkgfHxcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXRGdWxsWWVhcigpICE9PSBzZWNvbmREYXRlT2JqLmdldEZ1bGxZZWFyKClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgZm9ybWF0dGVycyBmb3IgdGhlIHRleHQgYnViYmxlc1xuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgZ2V0VGV4dEZvcm1hdHRlcnMgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGFsaWdubWVudCA9IHRoaXMuc2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpO1xuICAgIGxldCBjb25maWcgPSB7XG4gICAgICB0ZXh0Rm9ybWF0dGVyczpcbiAgICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVycyAmJiB0aGlzLnRleHRGb3JtYXR0ZXJzLmxlbmd0aFxuICAgICAgICAgID8gWy4uLnRoaXMudGV4dEZvcm1hdHRlcnNdXG4gICAgICAgICAgOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxUZXh0Rm9ybWF0dGVycyh7XG4gICAgICAgICAgICBkaXNhYmxlTWVudGlvbnM6IHRoaXMuZGlzYWJsZU1lbnRpb25zLFxuICAgICAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICAgICAgYWxpZ25tZW50LFxuICAgICAgICAgIH0pLFxuICAgIH07XG5cbiAgICBsZXQgdGV4dEZvcm1hdHRlcnM6IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+ID0gY29uZmlnLnRleHRGb3JtYXR0ZXJzO1xuICAgIGxldCB1cmxUZXh0Rm9ybWF0dGVyITogQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICBsZXQgbWVudGlvbnNUZXh0Rm9ybWF0dGVyITogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbXG4gICAgICAgICAgICBpXG4gICAgICAgICAgXSBhcyBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICBpZiAobWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpLmxlbmd0aCkge1xuICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0TWVudGlvbmVkVXNlcnMoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldExvZ2dlZEluVXNlcihcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSFcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmICh1cmxUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHRGb3JtYXR0ZXJzW2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcikge1xuICAgICAgICAgIHVybFRleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tpXSBhcyBDb21ldENoYXRVcmxzRm9ybWF0dGVyO1xuICAgICAgICAgIGlmIChtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID1cbiAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoe1xuICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgIC4uLmNvbmZpZyxcbiAgICAgICAgICAgIGFsaWdubWVudCxcbiAgICAgICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgdGV4dEZvcm1hdHRlcnMucHVzaChtZW50aW9uc1RleHRGb3JtYXR0ZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB1cmxUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbaV0gYXMgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdXJsVGV4dEZvcm1hdHRlcikge1xuICAgICAgdXJsVGV4dEZvcm1hdHRlciA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFVybFRleHRGb3JtYXR0ZXIoe1xuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgIGFsaWdubWVudCxcbiAgICAgIH0pO1xuICAgICAgdGV4dEZvcm1hdHRlcnMucHVzaCh1cmxUZXh0Rm9ybWF0dGVyKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0ZXh0Rm9ybWF0dGVyc1tpXS5zZXRNZXNzYWdlQnViYmxlQWxpZ25tZW50KGFsaWdubWVudCk7XG4gICAgICB0ZXh0Rm9ybWF0dGVyc1tpXS5zZXRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXh0Rm9ybWF0dGVycztcbiAgfTtcblxuICAvKipcbiAgICogcHJlcGVuZCBGZXRjaGVkIE1lc3NhZ2VzXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgcHJlcGVuZE1lc3NhZ2VzKG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlcywgLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgdGhpcy5tZXNzYWdlQ291bnQgPSB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGg7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICAgIHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuY2hhdENoYW5nZWQpIHtcbiAgICAgICAgQ29tZXRDaGF0VUlFdmVudHMuY2NBY3RpdmVDaGF0Q2hhbmdlZC5uZXh0KHtcbiAgICAgICAgICB1c2VyOiB0aGlzLnVzZXIsXG4gICAgICAgICAgZ3JvdXA6IHRoaXMuZ3JvdXAsXG4gICAgICAgICAgbWVzc2FnZTogbWVzc2FnZXNbbWVzc2FnZXM/Lmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHVucmVhZE1lc3NhZ2VDb3VudDogdGhpcy5nZXRVbnJlYWRDb3VudCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2hhdENoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIGxpc3RlbmluZyB0byBib3R0b20gc2Nyb2xsIHVzaW5nIGludGVyc2VjdGlvbiBvYnNlcnZlclxuICAgKi9cbiAgaW9Cb3R0b20oKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICByb290OiB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQsXG4gICAgICByb290TWFyZ2luOiBcIi0xMDAlIDBweCAxMDBweCAwcHhcIixcbiAgICAgIHRocmVzaG9sZDogMCxcbiAgICB9O1xuICAgIHZhciBjYWxsYmFjayA9IChlbnRyaWVzOiBhbnkpID0+IHtcbiAgICAgIHZhciBsYXN0TWVzc2FnZSA9IHRoaXMuVW5yZWFkQ291bnRbdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggLSAxXTtcbiAgICAgIHRoaXMuaXNPbkJvdHRvbSA9IGVudHJpZXNbMF0uaXNJbnRlcnNlY3Rpbmc7XG4gICAgICBpZiAodGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIHRoaXMuZmV0Y2hOZXh0TWVzc2FnZSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQgJiYgdGhpcy5VbnJlYWRDb3VudD8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKS50aGVuKFxuICAgICAgICAgICAgKHJlczogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT0gTnVtYmVyKHJlcz8uZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChsYXN0TWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgb2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKFxuICAgICAgY2FsbGJhY2ssXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKHRoaXMuYm90dG9tPy5uYXRpdmVFbGVtZW50KTtcbiAgfVxuICAvKipcbiAgICogbGlzdGVuaW5nIHRvIHRvcCBzY3JvbGwgdXNpbmcgaW50ZXJzZWN0aW9uIG9ic2VydmVyXG4gICAqL1xuICBpb1RvcCgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIHJvb3Q6IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudCxcbiAgICAgIHJvb3RNYXJnaW46IFwiMjAwcHggMHB4IDBweCAwcHhcIixcbiAgICAgIHRocmVzaG9sZDogMS4wLFxuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrID0gKGVudHJpZXM6IGFueSkgPT4ge1xuICAgICAgaWYgKGVudHJpZXNbMF0uaXNJbnRlcnNlY3RpbmcpIHtcbiAgICAgICAgdGhpcy5udW1iZXJPZlRvcFNjcm9sbCsrO1xuICAgICAgICBpZiAodGhpcy5udW1iZXJPZlRvcFNjcm9sbCA+IDEpIHtcbiAgICAgICAgICB0aGlzLmZldGNoUHJldmlvdXNNZXNzYWdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgb2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKFxuICAgICAgY2FsbGJhY2ssXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKHRoaXMudG9wPy5uYXRpdmVFbGVtZW50KTtcbiAgfVxuICAvLyBwdWJsaWMgbWV0aG9kc1xuICBhZGRNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRoaXMubWVzc2FnZXNMaXN0LnB1c2gobWVzc2FnZSk7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0SWQoKSkge1xuICAgICAgdGhpcy5sYXN0TWVzc2FnZUlkID0gTnVtYmVyKG1lc3NhZ2UuZ2V0SWQoKSk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgICFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKSB8fFxuICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgKSB7XG4gICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfTtcbiAgLyoqXG4gICAqIGNhbGxiYWNrIGZvciBjb3B5IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlRleHRNZXNzYWdlfSBvYmplY3RcbiAgICovXG4gIG9uQ29weU1lc3NhZ2UgPSAob2JqZWN0OiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpID0+IHtcbiAgICBsZXQgdGV4dCA9IG9iamVjdC5nZXRUZXh0KCk7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuZGlzYWJsZU1lbnRpb25zICYmXG4gICAgICBvYmplY3QuZ2V0TWVudGlvbmVkVXNlcnMgJiZcbiAgICAgIG9iamVjdC5nZXRNZW50aW9uZWRVc2VycygpLmxlbmd0aFxuICAgICkge1xuICAgICAgdGV4dCA9IHRoaXMuZ2V0TWVudGlvbnNUZXh0V2l0aG91dFN0eWxlKG9iamVjdCk7XG4gICAgfVxuICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRleHQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIHRvIGVuc3VyZSB0aGF0IHRoZSB1aWQgZG9lc24ndCBnZXQgY29waWVkIHdoZW4gY2xpY2tpbmcgb24gdGhlIGNvcHkgb3B0aW9uLlxuICAgKiBUaGlzIGZ1bmN0aW9uIGNoYW5nZXMgdGhlIHVpZCByZWdleCB0byAnQHVzZXJOYW1lJyB3aXRob3V0IGZvcm1hdHRpbmdcbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuVGV4dE1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHJldHVybnNcbiAgICovXG4gIGdldE1lbnRpb25zVGV4dFdpdGhvdXRTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHtcbiAgICBjb25zdCByZWdleCA9IC88QHVpZDooLio/KT4vZztcbiAgICBsZXQgbWVzc2FnZVRleHQgPSBtZXNzYWdlLmdldFRleHQoKTtcbiAgICBsZXQgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlLmdldFRleHQoKTtcbiAgICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgd2hpbGUgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBsZXQgdXNlcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG1hdGNoWzFdID09IG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpKSB7XG4gICAgICAgICAgdXNlciA9IG1lbnRpb25lZFVzZXJzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICBtZXNzYWdlVGV4dFRtcCA9IG1lc3NhZ2VUZXh0VG1wLnJlcGxhY2UoXG4gICAgICAgICAgbWF0Y2hbMF0sXG4gICAgICAgICAgXCJAXCIgKyB1c2VyLmdldE5hbWUoKSArIFwiXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlVGV4dFRtcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBjYWxsYmFjayBmb3IgZGVsZXRlTWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG9iamVjdFxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZXNcbiAgICovXG4gIG1lc3NhZ2VTZW50KG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB2YXIgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZXM7XG4gICAgdmFyIG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiBtLmdldE11aWQoKSA9PT0gbWVzc2FnZS5nZXRNdWlkKClcbiAgICApO1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlKTtcbiAgICB9XG4gICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBtZXNzYWdlTGlzdDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICB9XG4gIC8qKlxuICAgKiBjYWxsYmFjayBmb3IgZWRpdE1lc3NhZ2Ugb3B0aW9uXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gb2JqZWN0XG4gICAqL1xuICBvbkVkaXRNZXNzYWdlID0gKG9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQubmV4dCh7XG4gICAgICBtZXNzYWdlOiBvYmplY3QsXG4gICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICB9KTtcbiAgfTtcbiAgdXBkYXRlTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIG11aWQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIGlmIChtdWlkKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VTZW50KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIHJlbW92ZU1lc3NhZ2UgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAobXNnKSA9PiBtc2c/LmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG1lc3NhZ2UpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdHlsZSBjb25maWd1cmF0aW9uIGZvciB0aGUgdGhyZWFkIHZpZXcgb2YgYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoYXQgdGhlIHN0eWxlIGNvbmZpZ3VyYXRpb24gaXMgZm9yLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgc3R5bGUgY29uZmlndXJhdGlvbiBvYmplY3QuXG4gICAqL1xuICBnZXRUaHJlYWRWaWV3U3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUudGhyZWFkUmVwbHlJY29uVGludCxcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleEZsb3c6XG4gICAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJiB0aGlzLmFsaWdubWVudCAhPSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0XG4gICAgICAgICAgPyBcInJvdy1yZXZlcnNlXCJcbiAgICAgICAgICA6IFwicm93XCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtc3RhcnRcIixcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVRleHRDb2xvcixcbiAgICAgIGJ1dHRvblRleHRGb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VGV4dEZvbnQsXG4gICAgICBpY29uSGVpZ2h0OiBcIjE1cHhcIixcbiAgICAgIGljb25XaWR0aDogXCIxNXB4XCIsXG4gICAgICBnYXA6IFwiNHB4XCIsXG4gICAgfTtcbiAgfVxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgbWVzc2FnZSB3YXMgc2VudCBieSB0aGUgY3VycmVudGx5IGxvZ2dlZCBpbiB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIGxvZ2dlZCBpbiB1c2VyLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBpc1NlbnRCeU1lKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCBzZW50QnlNZTogYm9vbGVhbiA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpO1xuICAgIHJldHVybiBzZW50QnlNZTtcbiAgfVxuICBkZWxldGVNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICB2YXIgbWVzc2FnZUlkOiBhbnkgPSBtZXNzYWdlLmdldElkKCk7XG4gICAgICBDb21ldENoYXQuZGVsZXRlTWVzc2FnZShtZXNzYWdlSWQpXG4gICAgICAgIC50aGVuKChkZWxldGVkTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRGVsZXRlZC5uZXh0KGRlbGV0ZWRNZXNzYWdlKTtcbiAgICAgICAgICAvLyB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHNjcm9sbFRvQm90dG9tID0gKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbCh7XG4gICAgICAgICAgdG9wOiB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmlzT25Cb3R0b20gPSB0cnVlO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9LCAxMCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzaG93SGVhZGVyVGl0bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuZ3JvdXAgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpICYmXG4gICAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5zdGFuZGFyZFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY291bnQgb2YgdW5yZWFkIHJlcGx5IG1lc3NhZ2VzIGZvciBhIGdpdmVuIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgZm9yIHdoaWNoIHRoZSByZXBseSBjb3VudCBpcyBiZWluZyB1cGRhdGVkLlxuICAgKi9cblxuICB1cGRhdGVVbnJlYWRSZXBseUNvdW50ID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgbWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgICAobSkgPT4gbS5nZXRJZCgpID09PSBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpXG4gICAgICApO1xuICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICBjb25zdCBtZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlS2V5XTtcbiAgICAgICAgLy8gbGV0IHVucmVhZFJlcGx5Q291bnQgPSBtZXNzYWdlT2JqLmdldFVucmVhZFJlcGx5Q291bnQoKVxuICAgICAgICAvLyAgID8gbWVzc2FnZU9iai5nZXRVbnJlYWRSZXBseUNvdW50KClcbiAgICAgICAgLy8gICA6IDA7XG4gICAgICAgIC8vIHVucmVhZFJlcGx5Q291bnQgPSB1bnJlYWRSZXBseUNvdW50ICsgMTtcbiAgICAgICAgLy8gbWVzc2FnZU9iai5zZXRVbnJlYWRSZXBseUNvdW50KHVucmVhZFJlcGx5Q291bnQpO1xuICAgICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZU9iaik7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VMaXN0XTtcbiAgICAgIH1cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIE1ldGhvZCB0byBzdWJzY3JpYmUgIHRoZSByZXF1aXJlZCBSeGpzIGV2ZW50cyB3aGVuIHRoZSBDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudCBsb2Fkc1xuICAgKi9cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY1Nob3dQYW5lbCA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd1BhbmVsLnN1YnNjcmliZShcbiAgICAgIChkYXRhOiBJUGFuZWwpID0+IHtcbiAgICAgICAgaWYgKGRhdGEuY2hpbGQ/LnNob3dDb252ZXJzYXRpb25TdW1tYXJ5Vmlldykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hDb252ZXJzYXRpb25TdW1tYXJ5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zbWFydFJlcGx5Q29uZmlnID0gZGF0YS5jb25maWd1cmF0aW9uITtcbiAgICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IGRhdGEubWVzc2FnZSE7XG4gICAgICAgIHZhciBzbWFydFJlcGx5T2JqZWN0ID0gKGRhdGEubWVzc2FnZSBhcyBhbnkpPy5tZXRhZGF0YT8uW1xuICAgICAgICAgIFNtYXJ0UmVwbGllc0NvbnN0YW50cy5pbmplY3RlZFxuICAgICAgICBdPy5leHRlbnNpb25zPy5bU21hcnRSZXBsaWVzQ29uc3RhbnRzLnNtYXJ0X3JlcGx5XTtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KHRoaXMuc21hcnRSZXBseU1lc3NhZ2UpICYmIHNtYXJ0UmVwbHlPYmplY3QgJiYgIXNtYXJ0UmVwbHlPYmplY3QuZXJyb3IpIHtcbiAgICAgICAgICB0aGlzLmVuYWJsZVNtYXJ0UmVwbHkgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0hpZGVQYW5lbCA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjSGlkZVBhbmVsLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuZW5hYmxlU21hcnRSZXBseSA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICBjb25zdCBtZXNzYWdlT2JqID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKTtcbiAgICAgICAgICAvLyBpZiAobWVzc2FnZU9iaiAmJiBtZXNzYWdlT2JqLmdldFVucmVhZFJlcGx5Q291bnQoKSkge1xuICAgICAgICAgIC8vICAgbWVzc2FnZU9iai5zZXRVbnJlYWRSZXBseUNvdW50KDApO1xuICAgICAgICAgIC8vICAgdGhpcy51cGRhdGVNZXNzYWdlKG1lc3NhZ2VPYmopO1xuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKFxuICAgICAgKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgIGl0ZW07XG4gICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMoaXRlbS5tZXNzYWdlcyEpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID1cbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoaXRlbS5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPVxuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShpdGVtLm1lc3NhZ2UhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZShcbiAgICAgIChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBpZiAob2JqZWN0Py5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG9iamVjdC5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG9iamVjdC5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQuc3Vic2NyaWJlKFxuICAgICAgKG9iajogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmIChvYmoubWVzc2FnZSkge1xuICAgICAgICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBvYmoubWVzc2FnZSE7XG4gICAgICAgICAgc3dpdGNoIChvYmouc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzczoge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVN0YXR1cy5zdWNjZXNzOiB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtdO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1lc3NhZ2UsIHRydWUpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVN0YXR1cy5lcnJvcjoge1xuICAgICAgICAgICAgICBpZiAoIW1lc3NhZ2UuZ2V0U2VuZGVyKCkgfHwgdGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZSA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxFbmRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2Vzc2lvbklkID0gXCJcIjtcbiAgICAgICAgaWYgKGNhbGwgJiYgT2JqZWN0LmtleXMoY2FsbCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsUmVqZWN0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY091dGdvaW5nQ2FsbCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NPdXRnb2luZ0NhbGwuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEFjY2VwdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxBY2NlcHRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICB9XG4gIGNsb3NlU21hcnRSZXBseSA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gZmFsc2U7XG4gICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIGNsb3NlQ29udmVyc2F0aW9uU3VtbWFyeSA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBzaG93U3RhdHVzSW5mbyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBpZiAoXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IHRoaXMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJlxuICAgICAgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gdGhpcy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJlxuICAgICAgbWVzc2FnZT8uZ2V0U2VudEF0KClcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkU2hvd01lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBkaXNhYmxlUmVjZWlwdDogYm9vbGVhbiwgaGlkZVJlY2VpcHQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgICEoZGlzYWJsZVJlY2VpcHQgfHwgaGlkZVJlY2VpcHQpICYmXG4gICAgICAoIW1lc3NhZ2UuZ2V0U2VuZGVyKCkgfHwgdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKCkgPT09IG1lc3NhZ2UuZ2V0U2VuZGVyKCk/LmdldFVpZCgpKSAmJlxuICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpICE9PSB0aGlzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSAhPT0gdGhpcy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbFxuICAgICk7XG4gIH1cbiAgXG4gIHNlbmRSZXBseSA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IHJlcGx5OiBzdHJpbmcgPSBldmVudD8uZGV0YWlsPy5yZXBseTtcbiAgICBpZiAodGhpcy5zbWFydFJlcGx5Q29uZmlnLmNjU21hcnRSZXBsaWVzQ2xpY2tlZCkge1xuICAgICAgdGhpcy5zbWFydFJlcGx5Q29uZmlnLmNjU21hcnRSZXBsaWVzQ2xpY2tlZChcbiAgICAgICAgcmVwbHksXG4gICAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UhLFxuICAgICAgICB0aGlzLm9uRXJyb3IsXG4gICAgICAgIHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcyxcbiAgICAgICAgdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlc1xuICAgICAgKTtcbiAgICAgIHRoaXMuY2xvc2VTbWFydFJlcGx5KCk7XG4gICAgfVxuICB9O1xuICBzZW5kQ29udmVyc2F0aW9uU3RhcnRlciA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IHJlcGx5OiBzdHJpbmcgPSBldmVudD8uZGV0YWlsPy5yZXBseTtcbiAgICBDb21ldENoYXRVSUV2ZW50cy5jY0NvbXBvc2VNZXNzYWdlLm5leHQocmVwbHkpO1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBmZXRjaENvbnZlcnNhdGlvblN0YXJ0ZXIoKSB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IHRydWU7XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICBsZXQgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyB0aGlzLnVzZXIuZ2V0VWlkKClcbiAgICAgIDogdGhpcy5ncm91cC5nZXRHdWlkKCk7XG4gICAgQ29tZXRDaGF0LmdldENvbnZlcnNhdGlvblN0YXJ0ZXIocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgT2JqZWN0LmtleXMocmVzcG9uc2UpLmZvckVhY2goKHJlcGx5KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2VbcmVwbHldICYmIHJlc3BvbnNlW3JlcGx5XSAhPSBcIlwiKSB7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgJiZcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3Q/Lmxlbmd0aCA8PSAwXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgZmV0Y2hDb252ZXJzYXRpb25TdW1tYXJ5KCkge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgbGV0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyLmdldFVpZCgpXG4gICAgICA6IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuXG4gICAgbGV0IGFwaUNvbmZpZ3VyYXRpb24gPSB0aGlzLmFwaUNvbmZpZ3VyYXRpb247XG5cbiAgICBDb21ldENoYXQuZ2V0Q29udmVyc2F0aW9uU3VtbWFyeShyZWNlaXZlcklkLCByZWNlaXZlclR5cGUsIGFwaUNvbmZpZ3VyYXRpb24pXG4gICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoXCJQYXJhbWV0ZXIgaXMgbm90IGEgbnVtYmVyIVwiKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW3Jlc3BvbnNlXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ICYmIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pO1xuICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnk7XG4gIH1cblxuICBnZXRSZXBsaWVzKCk6IHN0cmluZ1tdIHwgbnVsbCB7XG4gICAgbGV0IHNtYXJ0UmVwbHk6IGFueSA9IHRoaXMuc21hcnRSZXBseU1lc3NhZ2U7XG4gICAgdmFyIHNtYXJ0UmVwbHlPYmplY3QgPVxuICAgICAgc21hcnRSZXBseT8ubWV0YWRhdGE/LltTbWFydFJlcGxpZXNDb25zdGFudHMuaW5qZWN0ZWRdPy5leHRlbnNpb25zPy5bXG4gICAgICBTbWFydFJlcGxpZXNDb25zdGFudHMuc21hcnRfcmVwbHlcbiAgICAgIF07XG4gICAgaWYgKFxuICAgICAgc21hcnRSZXBseU9iamVjdD8ucmVwbHlfcG9zaXRpdmUgJiZcbiAgICAgIHNtYXJ0UmVwbHlPYmplY3Q/LnJlcGx5X25ldXRyYWwgJiZcbiAgICAgIHNtYXJ0UmVwbHlPYmplY3Q/LnJlcGx5X25lZ2F0aXZlXG4gICAgKSB7XG4gICAgICB2YXIgeyByZXBseV9wb3NpdGl2ZSwgcmVwbHlfbmV1dHJhbCwgcmVwbHlfbmVnYXRpdmUgfSA9IHNtYXJ0UmVwbHlPYmplY3Q7XG4gICAgICByZXR1cm4gW3JlcGx5X3Bvc2l0aXZlLCByZXBseV9uZXV0cmFsLCByZXBseV9uZWdhdGl2ZV07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8qKlxuICAgKiBNZXRob2QgdG8gdW5zdWJzY3JpYmUgYWxsIHRoZSBSeGpzIGV2ZW50cyB3aGVuIHRoZSBDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudCBnZXRzIGRlc3Ryb3lcbiAgICovXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTGVmdD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NMaXZlUmVhY3Rpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGU/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NTaG93UGFuZWw/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NIaWRlUGFuZWw/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0NhbGxFbmRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGw/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0NhbGxBY2NlcHRlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXBwcm9wcmlhdGUgdGhyZWFkIGljb24gYmFzZWQgb24gdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBmb3Igd2hpY2ggdGhlIHRocmVhZCBpY29uIGlzIGJlaW5nIGRldGVybWluZWQuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBUaGUgaWNvbiBmb3IgdGhlIHRocmVhZC4gSWYgdGhlIG1lc3NhZ2Ugd2FzIHNlbnQgYnkgdGhlIGxvZ2dlZCBpbiB1c2VyLCByZXR1cm5zICd0aHJlYWRSaWdodEFycm93Jy4gT3RoZXJ3aXNlLCByZXR1cm5zICd0aHJlYWRJbmRpY2F0b3JJY29uJy5cbiAgICovXG4gIGdldFRocmVhZEljb25BbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogYm9vbGVhbiB7XG4gICAgbGV0IHNlbnRCeU1lOiBib29sZWFuID1cbiAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJlxuICAgICAgdGhpcy5hbGlnbm1lbnQgPT09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkO1xuICAgIHJldHVybiBzZW50QnlNZSA/IGZhbHNlIDogdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogc3R5bGluZyBwYXJ0XG4gICAqL1xuICBnZXRCdWJibGVEYXRlU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGlzU2VudEJ5TWUgPVxuICAgICAgdGhpcy5pc1NlbnRCeU1lKG1lc3NhZ2UpICYmIHRoaXMuYWxpZ25tZW50ICE9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQ7XG4gICAgbGV0IGlzVGV4dE1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZS5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRDb2xvcjpcbiAgICAgICAgdGhpcy5tZXNzYWdlTGlzdFN0eWxlLlRpbWVzdGFtcFRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGV4dEZvbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUxpc3RTdHlsZS5UaW1lc3RhbXBUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjMpLFxuICAgICAgcGFkZGluZzogXCIwcHhcIixcbiAgICAgIGRpc3BsYXk6IFwiYmxvY2tcIixcbiAgICB9O1xuICB9O1xuICBjaGF0c0xpc3RTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuaGVpZ2h0LFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmJhY2tncm91bmQsXG4gICAgfTtcbiAgfTtcbiAgbWVzc2FnZUNvbnRhaW5lclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLndpZHRoLFxuICAgIH07XG4gIH07XG4gIGVycm9yU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuICBjb252ZXJzYXRpb25TdGFydGVyU3RhdGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG5cbiAgZW1wdHlTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIGxvYWRpbmdTdHlsZSA9IHtcbiAgICBpY29uVGludDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy5sb2FkaW5nSWNvblRpbnQsXG4gIH07XG4gIGNvbnZlcnNhdGlvblN0YXJ0ZXJMb2FkZXIgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfTtcbiAgfTtcblxuICBjb252ZXJzYXRpb25TdW1tYXJ5TG9hZGVyID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpY29uVGludDogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG4gIGdldFNjaGVkdWxlckJ1YmJsZVN0eWxlID0gKG1lc3NnYWU6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICBsZXQgYXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjUwJVwiLFxuICAgICAgd2lkdGg6IFwiNDhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjQ4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgfSk7XG4gICAgbGV0IGxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiYXV0b1wiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJpbmhlcml0XCIsXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogXCJcIixcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuXG4gICAgbGV0IGNhbGVuZGFyU3R5bGUgPSBuZXcgQ2FsZW5kYXJTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBkYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgZGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGRheVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgZGF5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbW9udGhZZWFyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBtb250aFllYXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkZWZhdWx0RGF0ZVRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBkaXNhYmxlZERhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBkaXNhYmxlZERhdGVUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBkaXNhYmxlZERhdGVUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhcnJvd0J1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMlxuICAgICAgKSxcbiAgICB9KTtcbiAgICBsZXQgdGltZVNsb3RTdHlsZSA9IG5ldyBUaW1lU2xvdFN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBjYWxlbmRhckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGltZXpvbmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U2xvdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgZW1wdHlTbG90VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgZW1wdHlTbG90VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgZGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGRhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBzZXBlcmF0b3JUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2xvdEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBzbG90Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNsb3RCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzbG90VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc2xvdFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGltZXpvbmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aW1lem9uZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDEpLFxuICAgIH0pO1xuICAgIGxldCBxdWNpa1ZpZXdTdHlsZSA9IG5ldyBRdWlja1ZpZXdTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsZWFkaW5nQmFyVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBsZWFkaW5nQmFyV2lkdGg6IFwiNHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBTY2hlZHVsZXJCdWJibGVTdHlsZSh7XG4gICAgICBhdmF0YXJTdHlsZTogYXZhdGFyU3R5bGUsXG4gICAgICBsaXN0SXRlbVN0eWxlOiBsaXN0SXRlbVN0eWxlLFxuICAgICAgcXVpY2tWaWV3U3R5bGU6IHF1Y2lrVmlld1N0eWxlLFxuICAgICAgZGF0ZVNlbGVjdG9yU3R5bGU6IGNhbGVuZGFyU3R5bGUsXG4gICAgICB0aW1lU2xvdFNlbGVjdG9yU3R5bGU6IHRpbWVTbG90U3R5bGUsXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgc3VnZ2VzdGVkVGltZUJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpfWAsXG4gICAgICBzdWdnZXN0ZWRUaW1lQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkQmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBzdWdnZXN0ZWRUaW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRCb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICBtb3JlQnV0dG9uVGV4dEJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIG1vcmVCdXR0b25UZXh0Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIG1vcmVCdXR0b25UZXh0Qm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIG1vcmVCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbW9yZUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgZXJyb3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGVycm9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzY2hlZHVsZUJ1dHRvblN0eWxlOiB7XG4gICAgICAgIGljb25IZWlnaHQ6IFwiMjBweFwiLFxuICAgICAgICBpY29uV2lkdGg6IFwiMjBweFwiLFxuICAgICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5uYW1lKSxcbiAgICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgICAgfSxcbiAgICAgIHNlcGVyYXRvclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5uYW1lKSxcbiAgICAgIHN1bW1hcnlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBzdW1tYXJ5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGltZXpvbmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0aW1lem9uZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpbWV6b25lSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBjYWxlbmRhckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgY2xvY2tJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICB9KTtcbiAgfTtcbiAgLyoqXG4gICAqIENvbmZpZ3VyYXRpb24gZm9yIHRoZSByZWFjdGlvbiBsaXN0LlxuICAgKiBUaGlzIGluY2x1ZGVzIHN0eWxlcyBmb3IgdGhlIGF2YXRhciwgbGlzdCBpdGVtcywgYW5kIHJlYWN0aW9uIGhpc3RvcnkuXG4gICAqIEByZXR1cm5zIHtSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9ufSAtIFRoZSBjb25maWd1cmVkIHJlYWN0aW9uIGxpc3QuXG4gICAqL1xuICBnZXRSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKCkge1xuICAgIGNvbnN0IGF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCI1MCVcIixcbiAgICAgIHdpZHRoOiBcIjM1cHhcIixcbiAgICAgIGhlaWdodDogXCIzNXB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyV2lkdGg6IFwiMFwiLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIG91dGVyVmlld0JvcmRlckNvbG9yOiBcIlwiLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCIwXCIsXG4gICAgfSk7XG4gICAgY29uc3QgbGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG4gICAgY29uc3QgcmVhY3Rpb25IaXN0b3J5U3R5bGUgPSBuZXcgUmVhY3Rpb25MaXN0U3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMzIwcHhcIixcbiAgICAgIGhlaWdodDogXCIzMDBweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGVycm9ySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBzbGlkZXJFbW9qaUNvdW50Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIHNsaWRlckVtb2ppRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICAgIHN1YnRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0YWlsVmlld0ZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZGl2aWRlclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzbGlkZXJFbW9qaUNvdW50Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICBhY3RpdmVFbW9qaUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24oe1xuICAgICAgYXZhdGFyU3R5bGU6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbj8uYXZhdGFyU3R5bGUgfHxcbiAgICAgICAgYXZhdGFyU3R5bGUsXG4gICAgICBlcnJvckljb25VUkw6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbj8uZXJyb3JJY29uVVJMIHx8XG4gICAgICAgIFwiXCIsXG4gICAgICBsaXN0SXRlbVN0eWxlOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtU3R5bGUgfHxcbiAgICAgICAgbGlzdEl0ZW1TdHlsZSxcbiAgICAgIGxvYWRpbmdJY29uVVJMOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LmxvYWRpbmdJY29uVVJMIHx8IFwiXCIsXG4gICAgICByZWFjdGlvbkxpc3RTdHlsZTpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5yZWFjdGlvbkxpc3RTdHlsZSB8fCByZWFjdGlvbkhpc3RvcnlTdHlsZSxcbiAgICAgIHJlYWN0aW9uSXRlbUNsaWNrZWQ6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvblxuICAgICAgICAgID8ucmVhY3Rpb25JdGVtQ2xpY2tlZCB8fCB0aGlzLm9uUmVhY3Rpb25JdGVtQ2xpY2tlZCxcbiAgICAgIHJlYWN0aW9uc1JlcXVlc3RCdWlsZGVyOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LnJlYWN0aW9uc1JlcXVlc3RCdWlsZGVyIHx8IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogSGFuZGxlcyB3aGVuIGEgcmVhY3Rpb24gaXRlbSBpcyBjbGlja2VkLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5SZWFjdGlvbn0gcmVhY3Rpb24gLSBUaGUgY2xpY2tlZCByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGUgcmVhY3Rpb24gaXMgYXNzb2NpYXRlZCB3aXRoLlxuICAgKi9cblxuICBvblJlYWN0aW9uSXRlbUNsaWNrZWQ/ID0gKFxuICAgIHJlYWN0aW9uOiBDb21ldENoYXQuUmVhY3Rpb24sXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IHZvaWQgPT4ge1xuICAgIGlmIChyZWFjdGlvbj8uZ2V0UmVhY3RlZEJ5KCk/LmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMucmVhY3RUb01lc3NhZ2UocmVhY3Rpb24/LmdldFJlYWN0aW9uKCksIG1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEhhbmRsZXMgYWRkaW5nIGEgcmVhY3Rpb24gd2hlbiBjbGlja2VkLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5SZWFjdGlvbkNvdW50fSByZWFjdGlvbiAtIFRoZSBjbGlja2VkIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoZSByZWFjdGlvbiBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqL1xuICBhZGRSZWFjdGlvbk9uQ2xpY2sgPSAoXG4gICAgcmVhY3Rpb246IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50LFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApID0+IHtcbiAgICBsZXQgb25SZWFjdENsaWNrID0gdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkNsaWNrO1xuICAgIGlmIChvblJlYWN0Q2xpY2spIHtcbiAgICAgIG9uUmVhY3RDbGljayhyZWFjdGlvbiwgbWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVhY3RUb01lc3NhZ2UocmVhY3Rpb24/LmdldFJlYWN0aW9uKCksIG1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIENvbmZpZ3VyYXRpb24gZm9yIHRoZSByZWFjdGlvbiBpbmZvLlxuICAgKiBUaGlzIGluY2x1ZGVzIHN0eWxlcyBmb3IgdGhlIHJlYWN0aW9uIGluZm8gZGlzcGxheS5cbiAgICogQHJldHVybnMge1JlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb259IC0gVGhlIGNvbmZpZ3VyZWQgcmVhY3Rpb24gaW5mby5cbiAgICovXG5cbiAgZ2V0UmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbigpIHtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24gfHwge307XG4gICAgY29uc3QgcmVhY3Rpb25JbmZvU3R5bGUgPSBuZXcgUmVhY3Rpb25JbmZvU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8uYmFja2dyb3VuZCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5ib3JkZXIgfHwgXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmJvcmRlclJhZGl1cyB8fCBcIjEycHhcIixcbiAgICAgIGVycm9ySWNvblRpbnQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmVycm9ySWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmxvYWRpbmdJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG5hbWVzQ29sb3I6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/Lm5hbWVzQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBuYW1lc0ZvbnQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/Lm5hbWVzRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHJlYWN0ZWRUZXh0Q29sb3I6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LnJlYWN0ZWRUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoXCJkYXJrXCIpLFxuICAgICAgcmVhY3RlZFRleHRGb250OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5yZWFjdGVkVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICByZWFjdGlvbkZvbnRTaXplOiBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5yZWFjdGlvbkZvbnRTaXplIHx8IFwiMzdweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgUmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbih7XG4gICAgICByZWFjdGlvbkluZm9TdHlsZTogcmVhY3Rpb25JbmZvU3R5bGUsXG4gICAgICByZWFjdGlvbnNSZXF1ZXN0QnVpbGRlcjogY29uZmlnPy5yZWFjdGlvbnNSZXF1ZXN0QnVpbGRlciB8fCB1bmRlZmluZWQsXG4gICAgICBlcnJvckljb25VUkw6IGNvbmZpZz8uZXJyb3JJY29uVVJMIHx8IFwiXCIsXG4gICAgICBsb2FkaW5nSWNvblVSTDogY29uZmlnPy5sb2FkaW5nSWNvblVSTCB8fCBcIlwiLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBHZXQgc3R5bGUgb2JqZWN0IGJhc2VkIG9uIG1lc3NhZ2UgdHlwZS5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3QuXG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhlIHN0eWxlIG9iamVjdC5cbiAgICovXG4gIGdldFN0YXR1c0luZm9TdHlsZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAvLyBCYXNlIHN0eWxlcyB0aGF0IGFyZSBjb21tb24gZm9yIGJvdGggY29uZGl0aW9uc1xuICAgIGNvbnN0IGJhc2VTdHlsZSA9IHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgYWxpZ25JdGVtczogXCJmbGV4LWVuZFwiLFxuICAgICAgZ2FwOiBcIjFweFwiLFxuICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICB9O1xuXG4gICAgLy8gSWYgbWVzc2FnZSB0eXBlIGlzIGF1ZGlvIG9yIHZpZGVvXG4gICAgaWYgKHRoaXMuaXNBdWRpb09yVmlkZW9NZXNzYWdlKG1lc3NhZ2UpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5iYXNlU3R5bGUsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjIycHhcIixcbiAgICAgICAgcGFkZGluZzogXCIzcHggNXB4XCIsXG4gICAgICAgIHBhZGRpbmdUb3A6IFwiMnB4XCIsXG4gICAgICAgIHBvc2l0aW9uOiBcInJlbGF0aXZlXCIsXG4gICAgICAgIG1hcmdpblRvcDogXCItMjZweFwiLFxuICAgICAgICBtYXJnaW5SaWdodDogXCI2cHhcIixcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoXCJkYXJrXCIpLFxuICAgICAgICB3aWR0aDogXCJmaXQtY29udGVudFwiLFxuICAgICAgICBhbGlnblNlbGY6IFwiZmxleC1lbmRcIixcbiAgICAgICAgbWFyZ2luQm90dG9tOiBcIjZweFwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBTdHlsZSBmb3Igb3RoZXIgdHlwZXMgb2YgbWVzc2FnZXNcbiAgICByZXR1cm4ge1xuICAgICAgLi4uYmFzZVN0eWxlLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiZmxleC1lbmRcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1lbmRcIixcbiAgICAgIHBhZGRpbmc6IFwiMHB4IDhweCA0cHggOHB4XCIsXG4gICAgfTtcbiAgfTtcbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcbiAgbGlzdFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuc2hvd1NtYXJ0UmVwbHkgPyBcIjkyJVwiIDogXCIxMDAlXCIsXG4gICAgfTtcbiAgfTtcbiAgLyoqXG4gICAqIFN0eWxpbmcgZm9yIHJlYWN0aW9ucyBjb21wb25lbnRcbiAgICpcbiAgICovXG4gIGdldFJlYWN0aW9uc1dyYXBwZXJTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBsZXQgYWxpZ25tZW50ID0gdGhpcy5zZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHBhZGRpbmdUb3A6IFwiNXB4XCIsXG4gICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBtYXJnaW5Ub3A6IFwiLTlweFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6XG4gICAgICAgIGFsaWdubWVudCA9PT0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0ID8gXCJmbGV4LXN0YXJ0XCIgOiBcImZsZXgtZW5kXCIsXG4gICAgfTtcbiAgfVxuICAvKipcbiAgICogU3R5bGluZyBmb3IgdW5yZWFkIHRocmVhZCByZXBsaWVzXG4gICAqIEByZXR1cm5zIExhYmVsU3R5bGVcbiAgICovXG4gIGdldFVucmVhZFJlcGxpZXNDb3VudFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTBweFwiLFxuICAgICAgd2lkdGg6IFwiMTVweFwiLFxuICAgICAgaGVpZ2h0OiBcIjE1cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VW5yZWFkQmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VW5yZWFkVGV4dENvbG9yLFxuICAgICAgZm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZFRleHRGb250LFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgfTtcbiAgfTtcbiAgZ2V0VGhyZWFkVmlld0FsaWdubWVudChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDpcbiAgICAgICAgdGhpcy5pc1NlbnRCeU1lKG1lc3NhZ2UpICYmXG4gICAgICAgICAgdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQuc3RhbmRhcmRcbiAgICAgICAgICA/IFwiZmxleC1lbmRcIlxuICAgICAgICAgIDogXCJmbGV4LXN0YXJ0XCIsXG4gICAgfTtcbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fd3JhcHBlclwiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCJcbiAgKm5nSWY9XCIhb3BlbkNvbnRhY3RzVmlld1wiPlxuXG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2hlYWRlci12aWV3XCI+XG4gICAgPGRpdiAqbmdJZj1cImhlYWRlclZpZXdcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJoZWFkZXJWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RcIiAjbGlzdFNjcm9sbFxuICAgIFtuZ1N0eWxlXT1cIntoZWlnaHQ6IHNob3dTbWFydFJlcGx5IHx8IHNob3dDb252ZXJzYXRpb25TdGFydGVyIHx8IHNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID8gJzkyJScgOiAnMTAwJSd9XCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fdG9wXCIgI3RvcD5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kZWNvcmF0b3ItbWVzc2FnZVwiXG4gICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5sb2FkaW5nIHx8IHN0YXRlID09IHN0YXRlcy5lcnJvciAgfHwgc3RhdGUgPT0gc3RhdGVzLmVtcHR5IFwiXG4gICAgICBbbmdTdHlsZV09XCJtZXNzYWdlQ29udGFpbmVyU3R5bGUoKVwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fbG9hZGluZy12aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMubG9hZGluZyBcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1sb2FkZXIgW2ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIlxuICAgICAgICAgIFtsb2FkZXJTdHlsZV09XCJsb2FkaW5nU3R5bGVcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtbG9hZGVyPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY3VzdG9tdmlldy0tbG9hZGluZ1wiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMubG9hZGluZyAgJiYgbG9hZGluZ1N0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJsb2FkaW5nU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZXJyb3Itdmlld1wiXG4gICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICAmJiAhaGlkZUVycm9yIFwiPlxuICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFtsYWJlbFN0eWxlXT1cImVycm9yU3R5bGUoKVwiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgJiYgIWVycm9yU3RhdGVWaWV3XCJcbiAgICAgICAgICBbdGV4dF09XCJlcnJvclN0YXRlVGV4dFwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2N1c3RvbS12aWV3LS1lcnJvclwiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgICYmIGVycm9yU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImVycm9yU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZW1wdHktdmlld1wiICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVtcHR5XCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jdXN0b20tdmlldy0tZW1wdHlcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVtcHR5ICYmIGVtcHR5U3RhdGVWaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImVtcHR5U3RhdGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZVwiXG4gICAgICAqbmdGb3I9XCJsZXQgbWVzc2FnZSBvZiBtZXNzYWdlc0xpc3Q7IGxldCBpID0gaW5kZXhcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGUtY29udGFpbmVyXCJcbiAgICAgICAgKm5nSWY9XCIoaSA9PT0gMCkgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KCkgJiYgIWhpZGVEYXRlU2VwYXJhdG9yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZSEuZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW3BhdHRlcm5dPVwiRGF0ZVNlcGFyYXRvclBhdHRlcm5cIiBbZGF0ZVN0eWxlXT1cImRhdGVTZXBhcmF0b3JTdHlsZVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGF0ZS1jb250YWluZXJcIlxuICAgICAgICAqbmdJZj1cIihpID4gMCAmJiBpc0RhdGVEaWZmZXJlbnQobWVzc2FnZXNMaXN0W2kgLSAxXT8uZ2V0U2VudEF0KCksIG1lc3NhZ2VzTGlzdFtpXT8uZ2V0U2VudEF0KCkpKSAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKSAmJiAhaGlkZURhdGVTZXBhcmF0b3JcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICBbcGF0dGVybl09XCJEYXRlU2VwYXJhdG9yUGF0dGVyblwiIFtkYXRlU3R5bGVdPVwiZGF0ZVNlcGFyYXRvclN0eWxlXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cIiFnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCIgI21lc3NhZ2VCdWJibGVSZWZcbiAgICAgICAgW2lkXT1cIm1lc3NhZ2U/LmdldElkKClcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZVxuICAgICAgICAgIFtsZWFkaW5nVmlld109XCIgc2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiXG4gICAgICAgICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgICAgICAgW3N0YXR1c0luZm9WaWV3XT1cInNob3dTdGF0dXNJbmZvKG1lc3NhZ2UpID8gIHN0YXR1c0luZm9WaWV3IDogbnVsbFwiXG4gICAgICAgICAgW2hlYWRlclZpZXddPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKSB8fCBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpID8gYnViYmxlSGVhZGVyIDogbnVsbFwiXG4gICAgICAgICAgW2Zvb3RlclZpZXddPVwiZ2V0Rm9vdGVyVmlldyhtZXNzYWdlKSB8fCByZWFjdGlvblZpZXdcIlxuICAgICAgICAgIFtjb250ZW50Vmlld109XCJjb250ZW50Vmlld1wiIFt0aHJlYWRWaWV3XT1cInRocmVhZFZpZXdcIlxuICAgICAgICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpIHx8IG1lc3NhZ2U/LmdldE11aWQoKVwiXG4gICAgICAgICAgW29wdGlvbnNdPVwic2V0TWVzc2FnZU9wdGlvbnMobWVzc2FnZSlcIlxuICAgICAgICAgIFttZXNzYWdlQnViYmxlU3R5bGVdPVwic2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICBbYWxpZ25tZW50XT1cInNldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKVwiPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjcmVhY3Rpb25WaWV3PlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWFjdGlvbnNcbiAgICAgICAgICAgICAgKm5nSWY9XCJtZXNzYWdlLmdldFJlYWN0aW9ucygpICYmIG1lc3NhZ2UuZ2V0UmVhY3Rpb25zKCkubGVuZ3RoID4gMCAmJiAhZGlzYWJsZVJlYWN0aW9uc1wiXG4gICAgICAgICAgICAgIFttZXNzYWdlT2JqZWN0XT1cImdldENsb25lZFJlYWN0aW9uT2JqZWN0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW2FsaWdubWVudF09XCJzZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25zU3R5bGVdPVwiZ2V0UmVhY3Rpb25zU3R5bGUoKVwiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkNsaWNrXT1cImFkZFJlYWN0aW9uT25DbGlja1wiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXT1cImdldFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24oKVwiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkluZm9Db25maWd1cmF0aW9uXT1cImdldFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oKVwiPjwvY29tZXRjaGF0LXJlYWN0aW9ucz5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3RhdHVzSW5mb1ZpZXc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtc3RhdHVzLWluZm9cIlxuICAgICAgICAgICAgICBbbmdTdHlsZV09XCJnZXRTdGF0dXNJbmZvU3R5bGUobWVzc2FnZSlcIj5cbiAgICAgICAgICAgICAgPGRpdiAqbmdJZj1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO2Vsc2UgYnViYmxlRm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlRm9vdGVyPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1kYXRlXCJcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0uYm90dG9tICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiAhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+XG4gICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAgICAgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIj5cbiAgICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCJzaG91bGRTaG93TWVzc2FnZShtZXNzYWdlLCBkaXNhYmxlUmVjZWlwdCwgaGlkZVJlY2VpcHQpXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19yZWNlaXB0XCI+XG4gICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LXJlY2VpcHQgW3JlY2VpcHRdPVwiZ2V0TWVzc2FnZVJlY2VpcHQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cImdldFJlY2VpcHRTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAgIFt3YWl0SWNvbl09XCJ3YWl0SWNvblwiIFtzZW50SWNvbl09XCJzZW50SWNvblwiXG4gICAgICAgICAgICAgICAgICAgIFtkZWxpdmVyZWRJY29uXT1cImRlbGl2ZXJlZEljb25cIiBbcmVhZEljb25dPVwicmVhZEljb25cIlxuICAgICAgICAgICAgICAgICAgICBbZXJyb3JJY29uXT1cImVycm9ySWNvblwiPjwvY29tZXRjaGF0LXJlY2VpcHQ+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICpuZ0lmPVwiIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAgJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYXZhdGFyIFtuYW1lXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICAgICAgICAgICAgW2ltYWdlXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRBdmF0YXIoKVwiPlxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlSGVhZGVyPlxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7ZWxzZSBkZWZhdWx0SGVhZGVyXCI+XG4gICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRIZWFkZXI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1oZWFkZXJcIlxuICAgICAgICAgICAgICAgICpuZ0lmPVwibWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCI+XG4gICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImxhYmVsU3R5bGVcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIlxuICAgICAgICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLnRvcCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjdGhyZWFkVmlldz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3RocmVhZHJlcGxpZXNcIlxuICAgICAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldFJlcGx5Q291bnQoKSAmJiAhbWVzc2FnZS5nZXREZWxldGVkQXQoKVwiXG4gICAgICAgICAgICAgIFtuZ1N0eWxlXT1cImdldFRocmVhZFZpZXdBbGlnbm1lbnQobWVzc2FnZSlcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbaWNvblVSTF09XCJ0aHJlYWRJbmRpY2F0b3JJY29uXCJcbiAgICAgICAgICAgICAgICBbbWlycm9ySWNvbl09XCJnZXRUaHJlYWRJY29uQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiZ2V0VGhyZWFkVmlld1N0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib3BlblRocmVhZFZpZXcobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgIFt0ZXh0XT0nZ2V0VGhyZWFkQ291bnQobWVzc2FnZSknPlxuICAgICAgICAgICAgICAgIDwhLS0gPHNwYW4gc2xvdD1cImJ1dHRvblZpZXdcIiBbbmdTdHlsZV09XCJnZXRVbnJlYWRSZXBsaWVzQ291bnRTdHlsZSgpXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X191bnJlYWQtdGhyZWFkXCJcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZS5nZXRVbnJlYWRSZXBseUNvdW50KCkgPiAwXCI+XG4gICAgICAgICAgICAgICAgICB7e21lc3NhZ2UuZ2V0VW5yZWFkUmVwbHlDb3VudCgpfX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+IC0tPlxuXG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19ib3R0b21cIiAjYm90dG9tPlxuICAgIDwvZGl2PlxuXG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19tZXNzYWdlLWluZGljYXRvclwiXG4gICAgKm5nSWY9XCJVbnJlYWRDb3VudCAmJiBVbnJlYWRDb3VudC5sZW5ndGggPiAwICYmICFpc09uQm90dG9tXCJcbiAgICBbbmdTdHlsZV09XCJ7Ym90dG9tOiBzaG93U21hcnRSZXBseSB8fCBmb290ZXJWaWV3IHx8IHNob3dDb252ZXJzYXRpb25TdGFydGVyIHx8IHNob3dDb252ZXJzYXRpb25TdW1tYXJ5ICA/ICcyMCUnIDogJzEzJSd9XCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW3RleHRdPVwibmV3TWVzc2FnZUNvdW50XCJcbiAgICAgIFtidXR0b25TdHlsZV09XCJ1bnJlYWRNZXNzYWdlc1N0eWxlXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJzY3JvbGxUb0JvdHRvbSgpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZm9vdGVyLXZpZXdcIiBbbmdTdHlsZV09XCJ7aGVpZ2h0OiAgJ2F1dG8nfVwiPlxuXG4gICAgPGRpdiAqbmdJZj1cImZvb3RlclZpZXc7ZWxzZSBmb290ZXJcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJmb290ZXJWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgICA8bmctdGVtcGxhdGUgI2Zvb3Rlcj5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fc21hcnQtcmVwbGllc1wiXG4gICAgICAgICpuZ0lmPVwiIXNob3dDb252ZXJzYXRpb25TdGFydGVyICYmIHNob3dTbWFydFJlcGx5ICYmIGdldFJlcGxpZXMoKVwiPlxuICAgICAgICA8c21hcnQtcmVwbGllcyBbc21hcnRSZXBseVN0eWxlXT1cInNtYXJ0UmVwbHlTdHlsZVwiXG4gICAgICAgICAgW3JlcGxpZXNdPVwiZ2V0UmVwbGllcygpXCIgKGNjLXJlcGx5LWNsaWNrZWQpPVwic2VuZFJlcGx5KCRldmVudClcIlxuICAgICAgICAgIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlU21hcnRSZXBseSgpXCI+XG4gICAgICAgIDwvc21hcnQtcmVwbGllcz5cbiAgICAgIDwvZGl2PlxuXG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2NvbnZlcnNhdGlvbi1zdGFydGVyc1wiXG4gICAgICAgICpuZ0lmPVwiZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlciAmJiBzaG93Q29udmVyc2F0aW9uU3RhcnRlclwiPlxuICAgICAgICA8Y29tZXRjaGF0LWFpLWNhcmQgW3N0YXRlXT1cImNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZVwiXG4gICAgICAgICAgW2xvYWRpbmdTdGF0ZVRleHRdPVwic3RhcnRlckxvYWRpbmdTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJzdGFydGVyRW1wdHlTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiPlxuICAgICAgICAgIDxzbWFydC1yZXBsaWVzXG4gICAgICAgICAgICAqbmdJZj1cImNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9PSBzdGF0ZXMubG9hZGVkICYmICFwYXJlbnRNZXNzYWdlSWRcIlxuICAgICAgICAgICAgW3NtYXJ0UmVwbHlTdHlsZV09XCJjb252ZXJzYXRpb25TdGFydGVyU3R5bGVcIlxuICAgICAgICAgICAgW3JlcGxpZXNdPVwiY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXNcIiBzbG90PVwibG9hZGVkVmlld1wiXG4gICAgICAgICAgICAoY2MtcmVwbHktY2xpY2tlZCk9XCJzZW5kQ29udmVyc2F0aW9uU3RhcnRlcigkZXZlbnQpXCJcbiAgICAgICAgICAgIFtjbG9zZUljb25VUkxdPVwiJydcIj5cbiAgICAgICAgICA8L3NtYXJ0LXJlcGxpZXM+XG4gICAgICAgIDwvY29tZXRjaGF0LWFpLWNhcmQ+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY29udmVyc2F0aW9uLXN1bW1hcnlcIlxuICAgICAgICAqbmdJZj1cImVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnkgJiYgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnlcIj5cblxuICAgICAgICA8Y29tZXRjaGF0LWFpLWNhcmQgW3N0YXRlXT1cImNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZVwiXG4gICAgICAgICAgW2xvYWRpbmdTdGF0ZVRleHRdPVwic3VtbWFyeUxvYWRpbmdTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJzdW1tYXJ5RW1wdHlTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvckljb25VUkxdPVwiYWlFcnJvckljb25cIlxuICAgICAgICAgIFtlbXB0eUljb25VUkxdPVwiYWlFbXB0eUljb25cIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBhbmVsXG4gICAgICAgICAgICAqbmdJZj1cImNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9PSBzdGF0ZXMubG9hZGVkICYmICFwYXJlbnRNZXNzYWdlSWRcIlxuICAgICAgICAgICAgc2xvdD1cImxvYWRlZFZpZXdcIiBbcGFuZWxTdHlsZV09XCJjb252ZXJzYXRpb25TdW1tYXJ5U3R5bGVcIlxuICAgICAgICAgICAgdGl0bGU9XCJDb252ZXJzYXRpb24gU3VtbWFyeVwiIFt0ZXh0XT1cImNvbnZlcnNhdGlvblN1bW1hcnlcIlxuICAgICAgICAgICAgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VDb252ZXJzYXRpb25TdW1tYXJ5KClcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1wYW5lbD5cbiAgICAgICAgPC9jb21ldGNoYXQtYWktY2FyZD5cblxuICAgICAgPC9kaXY+XG5cbiAgICA8L25nLXRlbXBsYXRlPlxuICA8L2Rpdj5cblxuPC9kaXY+XG48IS0tIGRlZmF1bHQgYnViYmxlcyAtLT5cbjxuZy10ZW1wbGF0ZSAjdGV4dEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICpuZ0lmPVwibWVzc2FnZT8udHlwZSA9PSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cIm1lc3NhZ2U/Lm1lc3NhZ2VcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZSAqbmdJZj1cIm1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpXCJcbiAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwibG9jYWxpemUoJ01FU1NBR0VfSVNfREVMRVRFRCcpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAqbmdJZj1cIiFpc1RyYW5zbGF0ZWQobWVzc2FnZSkgJiYgIWdldExpbmtQcmV2aWV3KG1lc3NhZ2UpICYmICFtZXNzYWdlPy5kZWxldGVkQXQgJiYgbWVzc2FnZT8udHlwZSAhPSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIiBbdGV4dF09XCJnZXRUZXh0TWVzc2FnZShtZXNzYWdlKVwiXG4gICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDxsaW5rLXByZXZpZXcgW2xpbmtQcmV2aWV3U3R5bGVdPVwibGlua1ByZXZpZXdTdHlsZVwiXG4gICAgKGNjLWxpbmstY2xpY2tlZCk9XCJvcGVuTGlua1VSTCgkZXZlbnQpXCJcbiAgICAqbmdJZj1cIiFtZXNzYWdlPy5nZXREZWxldGVkQXQoKSAmJiBnZXRMaW5rUHJldmlldyhtZXNzYWdlKSAmJiBlbmFibGVMaW5rUHJldmlld1wiXG4gICAgW3RpdGxlXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygndGl0bGUnLG1lc3NhZ2UpXCJcbiAgICBbZGVzY3JpcHRpb25dPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCdkZXNjcmlwdGlvbicsbWVzc2FnZSlcIlxuICAgIFtVUkxdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCd1cmwnLG1lc3NhZ2UpXCJcbiAgICBbaW1hZ2VdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCdpbWFnZScsbWVzc2FnZSlcIlxuICAgIFtmYXZJY29uVVJMXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygnZmF2aWNvbicsbWVzc2FnZSlcIj5cbiAgICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgICAqbmdJZj1cIiFpc1RyYW5zbGF0ZWQobWVzc2FnZSkgJiYgZ2V0TGlua1ByZXZpZXcobWVzc2FnZSkgJiYgIW1lc3NhZ2U/LmRlbGV0ZWRBdCAmJiBtZXNzYWdlPy50eXBlICE9IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW3RleHRdPVwiZ2V0VGV4dE1lc3NhZ2UobWVzc2FnZSlcIlxuICAgICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDwvbGluay1wcmV2aWV3PlxuICA8bWVzc2FnZS10cmFuc2xhdGlvbi1idWJibGUgW2FsaWdubWVudF09XCJnZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIlxuICAgICpuZ0lmPVwiaXNUcmFuc2xhdGVkKG1lc3NhZ2UpXCJcbiAgICBbbWVzc2FnZVRyYW5zbGF0aW9uU3R5bGVdPVwic2V0VHJhbnNsYXRpb25TdHlsZShtZXNzYWdlKVwiXG4gICAgW3RyYW5zbGF0ZWRUZXh0XT1cImlzVHJhbnNsYXRlZChtZXNzYWdlKVwiXG4gICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+XG4gICAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICAgKm5nSWY9XCIgIW1lc3NhZ2U/LmRlbGV0ZWRBdCAmJiBtZXNzYWdlPy50eXBlICE9IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW3RleHRdPVwibWVzc2FnZT8udGV4dFwiXG4gICAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cblxuICA8L21lc3NhZ2UtdHJhbnNsYXRpb24tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjZmlsZUJ1YmJsZSBsZXQtbWVzc2FnZT5cblxuICA8Y29tZXRjaGF0LWZpbGUtYnViYmxlIFtmaWxlU3R5bGVdPVwic2V0RmlsZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbZG93bmxvYWRJY29uVVJMXT1cImRvd25sb2FkSWNvblVSTFwiIFtzdWJ0aXRsZV09XCJsb2NhbGl6ZSgnU0hBUkVEX0ZJTEUnKVwiXG4gICAgW3RpdGxlXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/Lm5hbWU6ICcnXCJcbiAgICBbZmlsZVVSTF09XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmwgOiAnJ1wiPjwvY29tZXRjaGF0LWZpbGUtYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjYXVkaW9CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtaWNvbi1idXR0b24gW2Rpc2FibGVkXT1cInRydWVcIlxuICAgICpuZ0lmPVwibWVzc2FnZT8uY2F0ZWdvcnkgPT0gY2FsbENvbnN0YW50ICYmIG1lc3NhZ2U/LnR5cGUgPT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuYXVkaW9cIlxuICAgIFtpY29uVVJMXT1cImdldENhbGxUeXBlSWNvbihtZXNzYWdlKVwiXG4gICAgW2J1dHRvblN0eWxlXT1cImNhbGxTdGF0dXNTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwiZ2V0Q2FsbEFjdGlvbk1lc3NhZ2UobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgPGNvbWV0Y2hhdC1hdWRpby1idWJibGVcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIG1lc3NhZ2U/LmNhdGVnb3J5ICE9IGNhbGxDb25zdGFudFwiXG4gICAgW3NyY109XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmwgOiAnJ1wiPlxuICA8L2NvbWV0Y2hhdC1hdWRpby1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICN2aWRlb0J1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbZGlzYWJsZWRdPVwidHJ1ZVwiXG4gICAgKm5nSWY9XCJtZXNzYWdlPy5jYXRlZ29yeSA9PSBjYWxsQ29uc3RhbnQgJiYgbWVzc2FnZT8udHlwZSA9PSBNZXNzYWdlVHlwZXNDb25zdGFudC52aWRlb1wiXG4gICAgW2ljb25VUkxdPVwiZ2V0Q2FsbFR5cGVJY29uKG1lc3NhZ2UpXCJcbiAgICBbYnV0dG9uU3R5bGVdPVwiY2FsbFN0YXR1c1N0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJnZXRDYWxsQWN0aW9uTWVzc2FnZShtZXNzYWdlKVwiPjwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuXG4gIDxjb21ldGNoYXQtdmlkZW8tYnViYmxlXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlPy5jYXRlZ29yeSAhPSBjYWxsQ29uc3RhbnRcIlxuICAgIFt2aWRlb1N0eWxlXT1cInZpZGVvQnViYmxlU3R5bGVcIlxuICAgIFtzcmNdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsIDogJydcIlxuICAgIFtwb3N0ZXJdPVwiIGdldEltYWdlVGh1bWJuYWlsKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdmlkZW8tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjaW1hZ2VCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxpbWFnZS1tb2RlcmF0aW9uIChjYy1zaG93LWRpYWxvZyk9XCJvcGVuV2FybmluZ0RpYWxvZygkZXZlbnQpXCJcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIGVuYWJsZUltYWdlTW9kZXJhdGlvblwiIFttZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtpbWFnZU1vZGVyYXRpb25TdHlsZV09XCJpbWFnZU1vZGVyYXRpb25TdHlsZVwiPlxuICAgIDxjb21ldGNoYXQtaW1hZ2UtYnViYmxlIChjYy1pbWFnZS1jbGlja2VkKT1cIm9wZW5JbWFnZUluRnVsbFNjcmVlbihtZXNzYWdlKVwiXG4gICAgICBbaW1hZ2VTdHlsZV09XCJpbWFnZUJ1YmJsZVN0eWxlXCIgW3NyY109XCIgZ2V0SW1hZ2VUaHVtYm5haWwobWVzc2FnZSlcIlxuICAgICAgW3BsYWNlaG9sZGVySW1hZ2VdPVwicGxhY2Vob2xkZXJJY29uVVJMXCI+PC9jb21ldGNoYXQtaW1hZ2UtYnViYmxlPlxuICA8L2ltYWdlLW1vZGVyYXRpb24+XG4gIDxjb21ldGNoYXQtaW1hZ2UtYnViYmxlIFtpbWFnZVN0eWxlXT1cImltYWdlQnViYmxlU3R5bGVcIlxuICAgIChjYy1pbWFnZS1jbGlja2VkKT1cIm9wZW5JbWFnZUluRnVsbFNjcmVlbihtZXNzYWdlKVwiXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiAhZW5hYmxlSW1hZ2VNb2RlcmF0aW9uXCJcbiAgICBbc3JjXT1cIiBnZXRJbWFnZVRodW1ibmFpbChtZXNzYWdlKVwiXG4gICAgW3BsYWNlaG9sZGVySW1hZ2VdPVwicGxhY2Vob2xkZXJJY29uVVJMXCI+PC9jb21ldGNoYXQtaW1hZ2UtYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjZm9ybUJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1mb3JtLWJ1YmJsZSBbbWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbZm9ybUJ1YmJsZVN0eWxlXT1cImdldEZvcm1NZXNzYWdlQnViYmxlU3R5bGUoKVwiPjwvY29tZXRjaGF0LWZvcm0tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjY2FyZEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1jYXJkLWJ1YmJsZSBbbWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbY2FyZEJ1YmJsZVN0eWxlXT1cImdldENhcmRNZXNzYWdlQnViYmxlU3R5bGUoKVwiPjwvY29tZXRjaGF0LWNhcmQtYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjY3VzdG9tVGV4dEJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3N0aWNrZXJCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtaW1hZ2UtYnViYmxlIFtzcmNdPVwiZ2V0U3RpY2tlcihtZXNzYWdlKVwiXG4gICAgW2ltYWdlU3R5bGVdPVwiaW1hZ2VCdWJibGVTdHlsZVwiPjwvY29tZXRjaGF0LWltYWdlLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjd2hpdGVib2FyZEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1kb2N1bWVudC1idWJibGUgW2hpZGVTZXBhcmF0b3JdPVwiZmFsc2VcIlxuICAgIFtpY29uQWxpZ25tZW50XT1cImRvY3VtZW50QnViYmxlQWxpZ25tZW50XCJcbiAgICBbZG9jdW1lbnRTdHlsZV09XCJkb2N1bWVudEJ1YmJsZVN0eWxlXCIgW1VSTF09XCJnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZSlcIlxuICAgIFtjY0NsaWNrZWRdPVwibGF1bmNoQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmREb2N1bWVudFwiXG4gICAgW2ljb25VUkxdPVwid2hpdGVib2FyZEljb25VUkxcIiBbdGl0bGVdPVwid2hpdGVib2FyZFRpdGxlXCJcbiAgICBbYnV0dG9uVGV4dF09XCJ3aGl0ZWJvYXJkQnV0dG9uVGV4dFwiXG4gICAgW3N1YnRpdGxlXT1cIndoaXRlYm9hcmRTdWJpdGxlXCI+PC9jb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNkb2N1bWVudEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1kb2N1bWVudC1idWJibGUgW2hpZGVTZXBhcmF0b3JdPVwiZmFsc2VcIlxuICAgIFtpY29uQWxpZ25tZW50XT1cImRvY3VtZW50QnViYmxlQWxpZ25tZW50XCJcbiAgICBbZG9jdW1lbnRTdHlsZV09XCJkb2N1bWVudEJ1YmJsZVN0eWxlXCIgW1VSTF09XCJnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZSlcIlxuICAgIFtjY0NsaWNrZWRdPVwibGF1bmNoQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmREb2N1bWVudFwiXG4gICAgW2ljb25VUkxdPVwiZG9jdW1lbnRJY29uVVJMXCIgW3RpdGxlXT1cImRvY3VtZW50VGl0bGVcIlxuICAgIFtidXR0b25UZXh0XT1cImRvY3VtZW50QnV0dG9uVGV4dFwiXG4gICAgW3N1YnRpdGxlXT1cImRvY3VtZW50U3ViaXRsZVwiPjwvY29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjZGlyZWN0Q2FsbGluZyBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1kb2N1bWVudC1idWJibGUgW2hpZGVTZXBhcmF0b3JdPVwidHJ1ZVwiXG4gICAgW2ljb25BbGlnbm1lbnRdPVwiY2FsbEJ1YmJsZUFsaWdubWVudFwiXG4gICAgW2RvY3VtZW50U3R5bGVdPVwiZ2V0Q2FsbEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW1VSTF09XCJnZXRTZXNzaW9uSWQobWVzc2FnZSlcIlxuICAgIFtjY0NsaWNrZWRdPVwiZ2V0U3RhcnRDYWxsRnVuY3Rpb24obWVzc2FnZSlcIiBbaWNvblVSTF09XCJkaXJlY3RDYWxsSWNvblVSTFwiXG4gICAgW3RpdGxlXT1cImdldENhbGxCdWJibGVUaXRsZShtZXNzYWdlKVwiIFtidXR0b25UZXh0XT1cImpvaW5DYWxsQnV0dG9uVGV4dFwiXG4gICAgKm5nSWY9XCJtZXNzYWdlLmNhdGVnb3J5ID09ICdjdXN0b20nXCI+PC9jb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNzY2hlZHVsZXJCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtc2NoZWR1bGVyLWJ1YmJsZSBbc2NoZWR1bGVyTWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbbG9nZ2VkSW5Vc2VyXT1cImxvZ2dlZEluVXNlclwiXG4gICAgW3NjaGVkdWxlckJ1YmJsZVN0eWxlXT1cImdldFNjaGVkdWxlckJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtc2NoZWR1bGVyLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjcG9sbEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPHBvbGxzLWJ1YmJsZSBbcG9sbFN0eWxlXT1cInBvbGxCdWJibGVTdHlsZVwiXG4gICAgW3BvbGxRdWVzdGlvbl09XCJnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlLCdxdWVzdGlvbicpXCJcbiAgICBbcG9sbElkXT1cImdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2UsJ2lkJylcIiBbbG9nZ2VkSW5Vc2VyXT1cImxvZ2dlZEluVXNlclwiXG4gICAgW3NlbmRlclVpZF09XCJnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlKVwiXG4gICAgW21ldGFkYXRhXT1cIm1lc3NhZ2U/Lm1ldGFkYXRhXCI+PC9wb2xscy1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG5cbjwhLS0gdGhyZWFkIGJ1YmJsZSB2aWV3IC0tPlxuPG5nLXRlbXBsYXRlICN0aHJlYWRNZXNzYWdlQnViYmxlIGxldC1tZXNzYWdlPlxuICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgIDxuZy1jb250YWluZXJcbiAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGUgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiXG4gICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgW3N0YXR1c0luZm9WaWV3XT1cInNob3dTdGF0dXNJbmZvKG1lc3NhZ2UpID8gIHN0YXR1c0luZm9WaWV3IDogbnVsbFwiXG4gICAgW2xlYWRpbmdWaWV3XT1cIiBzaG93QXZhdGFyID8gbGVhZGluZ1ZpZXcgOiBudWxsXCIgW2hlYWRlclZpZXddPVwiYnViYmxlSGVhZGVyXCJcbiAgICBbZm9vdGVyVmlld109XCJnZXRGb290ZXJWaWV3KG1lc3NhZ2UpXCIgW2NvbnRlbnRWaWV3XT1cImNvbnRlbnRWaWV3XCJcbiAgICBbaWRdPVwibWVzc2FnZT8uZ2V0SWQoKSB8fCBtZXNzYWdlPy5nZXRNdWlkKClcIlxuICAgIFttZXNzYWdlQnViYmxlU3R5bGVdPVwic2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbYWxpZ25tZW50XT1cInRocmVhZGVkQWxpZ25tZW50XCI+XG4gICAgPG5nLXRlbXBsYXRlICNjb250ZW50Vmlldz5cbiAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRDb250ZW50VmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNzdGF0dXNJbmZvVmlldz5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1zdGF0dXMtaW5mb1wiXG4gICAgICAgIFtuZ1N0eWxlXT1cImdldFN0YXR1c0luZm9TdHlsZShtZXNzYWdlKVwiPlxuICAgICAgICA8ZGl2ICpuZ0lmPVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSk7ZWxzZSBidWJibGVGb290ZXJcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNidWJibGVGb290ZXI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLWRhdGVcIlxuICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS5ib3R0b20gJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbdGltZXN0YW1wXT1cIm1lc3NhZ2U/LmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIiBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgKm5nSWY9XCJzaG91bGRTaG93TWVzc2FnZShtZXNzYWdlLCBkaXNhYmxlUmVjZWlwdCwgaGlkZVJlY2VpcHQpXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19yZWNlaXB0XCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LXJlY2VpcHQgW3JlY2VpcHRdPVwiZ2V0TWVzc2FnZVJlY2VpcHQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cImdldFJlY2VpcHRTdHlsZShtZXNzYWdlKVwiIFt3YWl0SWNvbl09XCJ3YWl0SWNvblwiXG4gICAgICAgICAgICAgIFtzZW50SWNvbl09XCJzZW50SWNvblwiIFtkZWxpdmVyZWRJY29uXT1cIlwiXG4gICAgICAgICAgICAgIFtyZWFkSWNvbl09XCJkZWxpdmVyZWRJY29uXCJcbiAgICAgICAgICAgICAgW2Vycm9ySWNvbl09XCJlcnJvckljb25cIj48L2NvbWV0Y2hhdC1yZWNlaXB0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2xlYWRpbmdWaWV3PlxuICAgICAgPGRpdlxuICAgICAgICAqbmdJZj1cIiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpXCI+XG4gICAgICAgIDxjb21ldGNoYXQtYXZhdGFyIFtuYW1lXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICAgICAgW2ltYWdlXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRBdmF0YXIoKVwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICA8L2Rpdj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlSGVhZGVyPlxuICAgICAgPGRpdiAqbmdJZj1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7ZWxzZSBkZWZhdWx0SGVhZGVyXCI+XG4gICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRIZWFkZXI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1oZWFkZXJcIlxuICAgICAgICAgICpuZ0lmPVwibWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImxhYmVsU3R5bGVcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIlxuICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLnRvcCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8L25nLXRlbXBsYXRlPlxuICA8L2NvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cblxuXG48IS0tICAtLT5cbjxjb21ldGNoYXQtcG9wb3ZlciBbcG9wb3ZlclN0eWxlXT1cInBvcG92ZXJTdHlsZVwiICNwb3BvdmVyUmVmXG4gIFtwbGFjZW1lbnRdPVwia2V5Ym9hcmRBbGlnbm1lbnRcIj5cbiAgPGNvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZCAoY2MtZW1vamktY2xpY2tlZCk9XCJhZGRSZWFjdGlvbigkZXZlbnQpXCJcbiAgICBzbG90PVwiY29udGVudFwiXG4gICAgW2Vtb2ppS2V5Ym9hcmRTdHlsZV09XCJlbW9qaUtleWJvYXJkU3R5bGVcIj48L2NvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZD5cbjwvY29tZXRjaGF0LXBvcG92ZXI+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwib3BlbkNvbmZpcm1EaWFsb2dcIiBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCI+XG4gIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cIicnXCIgW21lc3NhZ2VUZXh0XT1cIndhcm5pbmdUZXh0XCJcbiAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uQ29uZmlybUNsaWNrKClcIiBbY2FuY2VsQnV0dG9uVGV4dF09XCJjYW5jZWxUZXh0XCJcbiAgICBbY29uZmlybUJ1dHRvblRleHRdPVwiY29uZmlybVRleHRcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImNvbmZpcm1EaWFsb2dTdHlsZVwiPlxuXG4gIDwvY29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG48Y29tZXRjaGF0LWZ1bGwtc2NyZWVuLXZpZXdlciAoY2MtY2xvc2UtY2xpY2tlZCk9XCJjbG9zZUltYWdlSW5GdWxsU2NyZWVuKClcIlxuICAqbmdJZj1cIm9wZW5GdWxsc2NyZWVuVmlld1wiIFtVUkxdPVwiaW1hZ2V1cmxUb09wZW5cIlxuICBbY2xvc2VJY29uVVJMXT1cImNsb3NlSWNvblVSTFwiIFtmdWxsU2NyZWVuVmlld2VyU3R5bGVdPVwiZnVsbFNjcmVlblZpZXdlclN0eWxlXCI+XG5cbjwvY29tZXRjaGF0LWZ1bGwtc2NyZWVuLXZpZXdlcj5cblxuPCEtLSBvbmdvaW5nIGNhbGxzY3JlZW4gZm9yIGRpcmVjdCBjYWxsIC0tPlxuPGNvbWV0Y2hhdC1vbmdvaW5nLWNhbGwgKm5nSWY9XCJzaG93T25nb2luZ0NhbGxcIlxuICBbY2FsbFNldHRpbmdzQnVpbGRlcl09XCJnZXRDYWxsQnVpbGRlcigpXCIgW29uZ29pbmdDYWxsU3R5bGVdPVwib25nb2luZ0NhbGxTdHlsZVwiXG4gIFtzZXNzaW9uSURdPVwic2Vzc2lvbklkXCI+PC9jb21ldGNoYXQtb25nb2luZy1jYWxsPlxuPCEtLSBtZXNzYWdlIGluZm9ybWF0aW9uIHZpZXcgLS0+XG48IS0tIHRocmVhZCBidWJibGUgdmlldyAtLT5cbjxuZy10ZW1wbGF0ZSAjbWVzc2FnZWluZm9CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxkaXYgKm5nSWY9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCI+XG4gICAgPG5nLWNvbnRhaW5lclxuICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuICA8L2Rpdj5cbiAgPGNvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZSAqbmdJZj1cIiFnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCJcbiAgICBbYm90dG9tVmlld109XCJnZXRCb3R0b21WaWV3KG1lc3NhZ2UpXCJcbiAgICBbc3RhdHVzSW5mb1ZpZXddPVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSlcIlxuICAgIFtmb290ZXJWaWV3XT1cImdldEZvb3RlclZpZXcobWVzc2FnZSlcIlxuICAgIFtsZWFkaW5nVmlld109XCJzaG93QXZhdGFyID8gbGVhZGluZ1ZpZXcgOiBudWxsXCIgW2hlYWRlclZpZXddPVwiYnViYmxlSGVhZGVyXCJcbiAgICBbY29udGVudFZpZXddPVwiY29udGVudFZpZXdcIiBbaWRdPVwibWVzc2FnZT8uZ2V0SWQoKSB8fCBtZXNzYWdlPy5nZXRNdWlkKClcIlxuICAgIFttZXNzYWdlQnViYmxlU3R5bGVdPVwic2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbYWxpZ25tZW50XT1cIm1lc3NhZ2VJbmZvQWxpZ25tZW50XCI+XG4gICAgPG5nLXRlbXBsYXRlICNjb250ZW50Vmlldz5cbiAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRDb250ZW50VmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNsZWFkaW5nVmlldz5cbiAgICAgIDxkaXZcbiAgICAgICAgKm5nSWY9XCIgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKVwiPlxuICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbbmFtZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICAgIFtpbWFnZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0QXZhdGFyKClcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUhlYWRlcj5cbiAgICAgIDxkaXYgKm5nSWY9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2Vsc2UgZGVmYXVsdEhlYWRlclwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0SGVhZGVyPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtaGVhZGVyXCJcbiAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJsYWJlbFN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS50b3AgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwib3Blbk1lc3NhZ2VJbmZvUGFnZVwiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNvbWV0Y2hhdC1tZXNzYWdlLWluZm9ybWF0aW9uXG4gICAgW2Nsb3NlSWNvblVSTF09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmNsb3NlSWNvblVSTFwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubG9hZGluZ0ljb25VUkxcIlxuICAgIFtyZWFkSWNvbl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLnJlYWRJY29uXCJcbiAgICBbZGVsaXZlcmVkSWNvbl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmRlbGl2ZXJlZEljb25cIlxuICAgIFtvbkVycm9yXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW1N1YnRpdGxlVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiXG4gICAgW3JlY2VpcHREYXRlUGF0dGVybl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLnJlY2VpcHREYXRlUGF0dGVyblwiXG4gICAgW2xpc3RJdGVtVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmxpc3RJdGVtVmlldyBcIlxuICAgIFttZXNzYWdlSW5mb3JtYXRpb25TdHlsZV09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLm1lc3NhZ2VJbmZvcm1hdGlvblN0eWxlXCJcbiAgICBbb25DbG9zZV09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLm9uQ2xvc2UgPz8gIGNsb3NlTWVzc2FnZUluZm9QYWdlXCJcbiAgICBbYnViYmxlVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmJ1YmJsZVZpZXcgPz8gbWVzc2FnZWluZm9CdWJibGVcIlxuICAgIFttZXNzYWdlXT1cIm1lc3NhZ2VJbmZvT2JqZWN0XCI+XG5cbiAgPC9jb21ldGNoYXQtbWVzc2FnZS1pbmZvcm1hdGlvbj5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuIl19