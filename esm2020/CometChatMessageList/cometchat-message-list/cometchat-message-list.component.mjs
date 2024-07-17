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
        this.errorStateText = localize("SOMETHING_WRONG");
        this.emptyStateText = localize("NO_MESSAGES_FOUND");
        this.loadingIconURL = "assets/Spinner.svg";
        this.disableReceipt = false;
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
            nameTextFont: "600 15px Inter",
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
            height: "200px",
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
                this.messageTypesMap[element.type] = element;
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
            if (this.messageTypesMap[message?.getType()] &&
                this.messageTypesMap[message?.getType()]?.contentView) {
                return this.messageTypesMap[message?.getType()]?.contentView(message);
            }
            else {
                return message.getDeletedAt()
                    ? this.typesMap["text"]
                    : this.typesMap[message?.getType()];
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
                this.messageTypesMap[message?.getType()] &&
                this.messageTypesMap[message?.getType()].bubbleView) {
                view = this.messageTypesMap[message?.getType()].bubbleView(message);
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
                    this.requestBuilder = this.user
                        ? this.messagesRequestBuilder
                            .setUID(this.user?.getUid())
                            .setMessageId(this.messagesList[0].getId())
                            .build()
                        : this.messagesRequestBuilder
                            .setGUID(this.group?.getGuid())
                            .setMessageId(this.messagesList[0].getId())
                            .build();
                }
                else {
                    this.requestBuilder = new CometChat.MessagesRequestBuilder()
                        .setLimit(this.limit)
                        .setTypes(this.types)
                        .setMessageId(this.messagesList[0].getId())
                        .setCategories(this.categories)
                        .hideReplies(true);
                    if (this.user) {
                        this.requestBuilder.setUID(this.user?.getUid()).build();
                    }
                    else if (this.group) {
                        this.requestBuilder.setGUID(this.group?.getGuid()).build();
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
            this.playAudio();
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
            this.playAudio();
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
        if (this.messageTypesMap[message?.getType()] &&
            this.messageTypesMap[message?.getType()]?.headerView) {
            view = this.messageTypesMap[message?.getType()]?.headerView(message);
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
        if (this.messageTypesMap[message?.getType()] &&
            this.messageTypesMap[message?.getType()]?.footerView) {
            view = this.messageTypesMap[message?.getType()]?.footerView(message);
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
        if (this.messageTypesMap[message?.getType()] &&
            this.messageTypesMap[message?.getType()]?.bottomView) {
            return this.messageTypesMap[message?.getType()]?.bottomView(message);
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
        if (this.messageTypesMap[message?.getType()] &&
            this.messageTypesMap[message?.getType()]?.statusInfoView) {
            return this.messageTypesMap[message?.getType()]?.statusInfoView(message);
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
            text: this.textBubble,
            file: this.fileBubble,
            audio: this.audioBubble,
            video: this.videoBubble,
            image: this.imageBubble,
            groupMember: this.textBubble,
            extension_sticker: this.stickerBubble,
            extension_whiteboard: this.whiteboardBubble,
            extension_document: this.documentBubble,
            extension_poll: this.pollBubble,
            meeting: this.directCalling,
            scheduler: this.schedulerBubble,
            form: this.formBubble,
            card: this.cardBubble,
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
            nameTextFont: fontHelper(this.themeService.theme.typography.title2),
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
                    ? this.messagesRequestBuilder.setUID(this.user?.getUid()).build()
                    : new CometChat.MessagesRequestBuilder()
                        .setUID(this.user.getUid())
                        .setLimit(this.limit)
                        .setTypes(this.types)
                        .setCategories(this.categories)
                        .hideReplies(true)
                        .build();
            }
            else {
                this.requestBuilder = this.messagesRequestBuilder
                    ? this.messagesRequestBuilder.setGUID(this.group?.getGuid()).build()
                    : new CometChat.MessagesRequestBuilder()
                        .setGUID(this.group.getGuid())
                        .setLimit(this.limit)
                        .setTypes(this.types)
                        .hideReplies(true)
                        .setCategories(this.categories)
                        .build();
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
                    this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_DELIVERED, messageReceipt);
                });
            this.onMessagesRead = CometChatMessageEvents.onMessagesRead.subscribe((messageReceipt) => {
                this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_READ, messageReceipt);
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
        this.markMessageAsDelivered(message);
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
    messageReadAndDelivered(message) {
        try {
            if (message.getReceiverType() ==
                CometChatUIKitConstants.MessageReceiverType.user &&
                message?.getSender().getUid() == this.user?.getUid() &&
                message.getReceiver() == this.loggedInUser?.getUid()) {
                if (message.getReceiptType() == CometChatUIKitConstants.messages.DELIVERY) {
                    //search for message
                    let messageKey = this.messagesList.findIndex((m) => m.getId() == Number(message.getMessageId()));
                    if (messageKey > -1) {
                        this.messagesList[messageKey].setDeliveredAt(message.getDeliveredAt());
                        this.ref.detectChanges();
                    }
                    // this.ref.detectChanges();
                    this.markAllMessagAsDelivered(messageKey);
                }
                else if (message.getReceiptType() == CometChatUIKitConstants.messages.READ) {
                    //search for message
                    let messageKey = this.messagesList.findIndex((m) => m.getId() == Number(message.getMessageId()));
                    if (messageKey > -1) {
                        this.messagesList[messageKey].setReadAt(message?.getReadAt());
                        this.ref.detectChanges();
                    }
                    this.ref.detectChanges();
                    this.markAllMessagAsRead(messageKey);
                }
            }
            else if (message.getReceiverType() ===
                CometChatUIKitConstants.MessageReceiverType.group &&
                message.getReceiver() === this.group?.getGuid()) {
                return;
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
                            this.playAudio();
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
CometChatMessageListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageListComponent, selector: "cometchat-message-list", inputs: { hideError: "hideError", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateView: "emptyStateView", errorStateText: "errorStateText", emptyStateText: "emptyStateText", loadingIconURL: "loadingIconURL", user: "user", group: "group", disableReceipt: "disableReceipt", disableSoundForMessages: "disableSoundForMessages", customSoundForMessages: "customSoundForMessages", readIcon: "readIcon", deliveredIcon: "deliveredIcon", sentIcon: "sentIcon", waitIcon: "waitIcon", errorIcon: "errorIcon", aiErrorIcon: "aiErrorIcon", aiEmptyIcon: "aiEmptyIcon", alignment: "alignment", showAvatar: "showAvatar", datePattern: "datePattern", timestampAlignment: "timestampAlignment", DateSeparatorPattern: "DateSeparatorPattern", templates: "templates", messagesRequestBuilder: "messagesRequestBuilder", newMessageIndicatorText: "newMessageIndicatorText", scrollToBottomOnNewMessages: "scrollToBottomOnNewMessages", thresholdValue: "thresholdValue", unreadMessageThreshold: "unreadMessageThreshold", reactionsConfiguration: "reactionsConfiguration", disableReactions: "disableReactions", emojiKeyboardStyle: "emojiKeyboardStyle", apiConfiguration: "apiConfiguration", onThreadRepliesClick: "onThreadRepliesClick", headerView: "headerView", footerView: "footerView", parentMessageId: "parentMessageId", threadIndicatorIcon: "threadIndicatorIcon", avatarStyle: "avatarStyle", backdropStyle: "backdropStyle", dateSeparatorStyle: "dateSeparatorStyle", messageListStyle: "messageListStyle", onError: "onError", messageInformationConfiguration: "messageInformationConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, viewQueries: [{ propertyName: "listScroll", first: true, predicate: ["listScroll"], descendants: true }, { propertyName: "bottom", first: true, predicate: ["bottom"], descendants: true }, { propertyName: "top", first: true, predicate: ["top"], descendants: true }, { propertyName: "textBubble", first: true, predicate: ["textBubble"], descendants: true }, { propertyName: "threadMessageBubble", first: true, predicate: ["threadMessageBubble"], descendants: true }, { propertyName: "fileBubble", first: true, predicate: ["fileBubble"], descendants: true }, { propertyName: "audioBubble", first: true, predicate: ["audioBubble"], descendants: true }, { propertyName: "videoBubble", first: true, predicate: ["videoBubble"], descendants: true }, { propertyName: "imageBubble", first: true, predicate: ["imageBubble"], descendants: true }, { propertyName: "formBubble", first: true, predicate: ["formBubble"], descendants: true }, { propertyName: "cardBubble", first: true, predicate: ["cardBubble"], descendants: true }, { propertyName: "stickerBubble", first: true, predicate: ["stickerBubble"], descendants: true }, { propertyName: "documentBubble", first: true, predicate: ["documentBubble"], descendants: true }, { propertyName: "whiteboardBubble", first: true, predicate: ["whiteboardBubble"], descendants: true }, { propertyName: "popoverRef", first: true, predicate: ["popoverRef"], descendants: true }, { propertyName: "directCalling", first: true, predicate: ["directCalling"], descendants: true }, { propertyName: "schedulerBubble", first: true, predicate: ["schedulerBubble"], descendants: true }, { propertyName: "pollBubble", first: true, predicate: ["pollBubble"], descendants: true }, { propertyName: "messageBubbleRef", predicate: ["messageBubbleRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt()\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt()\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n            *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"], components: [{ type: i2.CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: ["messageBubbleStyle", "alignment", "options", "id", "leadingView", "headerView", "replyView", "contentView", "threadView", "footerView", "bottomView", "statusInfoView", "moreIconURL", "topMenuSize"] }, { type: i3.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i4.CometChatMessageInformationComponent, selector: "cometchat-message-information", inputs: ["closeIconURL", "message", "title", "template", "bubbleView", "subtitleView", "listItemView", "receiptDatePattern", "onError", "messageInformationStyle", "readIcon", "deliveredIcon", "onClose", "listItemStyle", "emptyStateText", "errorStateText", "emptyStateView", "loadingIconURL", "loadingStateView", "errorStateView"] }], directives: [{ type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i5.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageListComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-list", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt()\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt()\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n            *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEVBU0wsU0FBUyxFQUNULFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsV0FBVyxFQUdYLGVBQWUsRUFDZixhQUFhLEVBRWIsU0FBUyxFQUVULGFBQWEsRUFHYixVQUFVLEVBQ1YsVUFBVSxFQUNWLGFBQWEsRUFHYixjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixpQkFBaUIsR0FDbEIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQ0wsYUFBYSxFQUNiLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsOEJBQThCLEVBQzlCLGdDQUFnQyxFQUNoQyxxQkFBcUIsRUFDckIsYUFBYSxFQUNiLHFCQUFxQixFQUNyQixlQUFlLEVBRWYsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQiwrQkFBK0IsRUFDL0IsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQiwyQkFBMkIsRUFDM0IsdUJBQXVCLEVBRXZCLG9CQUFvQixFQUVwQixxQkFBcUIsRUFFckIsNEJBQTRCLEVBQzVCLGNBQWMsRUFDZCx5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLGlC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QUs7Z0JBS0csYUFBYTtzQkFBckIsS0FBSztnQkFNRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBSUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUtHLE9BQU87c0JBQWYsS0FBSztnQkFLRywrQkFBK0I7c0JBQXZDLEtBQUs7Z0JBRUcsZUFBZTtzQkFBdkIsS0FBSztnQkFpTkcsY0FBYztzQkFBdEIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUmVmLFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25DaGFuZ2VzLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgUXVlcnlMaXN0LFxuICBSZW5kZXJlcjIsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdDaGlsZHJlbixcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBCYXNlU3R5bGUsXG4gIENhbGxzY3JlZW5TdHlsZSxcbiAgQ2hlY2tib3hTdHlsZSxcbiAgQ29uZmlybURpYWxvZ1N0eWxlLFxuICBEYXRlU3R5bGUsXG4gIERvY3VtZW50QnViYmxlU3R5bGUsXG4gIERyb3Bkb3duU3R5bGUsXG4gIEVtb2ppS2V5Ym9hcmRTdHlsZSxcbiAgRnVsbFNjcmVlblZpZXdlclN0eWxlLFxuICBJbnB1dFN0eWxlLFxuICBMYWJlbFN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxuICBNZW51TGlzdFN0eWxlLFxuICBQYW5lbFN0eWxlLFxuICBRdWlja1ZpZXdTdHlsZSxcbiAgUmFkaW9CdXR0b25TdHlsZSxcbiAgUmVjZWlwdFN0eWxlLFxuICBTaW5nbGVTZWxlY3RTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7XG4gIENhbGVuZGFyU3R5bGUsXG4gIENhbGxpbmdEZXRhaWxzVXRpbHMsXG4gIENhcmRCdWJibGVTdHlsZSxcbiAgQ29sbGFib3JhdGl2ZURvY3VtZW50Q29uc3RhbnRzLFxuICBDb2xsYWJvcmF0aXZlV2hpdGVib2FyZENvbnN0YW50cyxcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxuICBUaW1lU2xvdFN0eWxlLFxuICBDb21ldENoYXRVSUtpdFV0aWxpdHksXG4gIEZvcm1CdWJibGVTdHlsZSxcbiAgSW1hZ2VNb2RlcmF0aW9uU3R5bGUsXG4gIEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLFxuICBMaW5rUHJldmlld0NvbnN0YW50cyxcbiAgTWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbixcbiAgTWVzc2FnZUxpc3RTdHlsZSxcbiAgTWVzc2FnZVJlY2VpcHRVdGlscyxcbiAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLFxuICBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSxcbiAgUG9sbHNCdWJibGVTdHlsZSxcbiAgU2NoZWR1bGVyQnViYmxlU3R5bGUsXG4gIFNtYXJ0UmVwbGllc0NvbmZpZ3VyYXRpb24sXG4gIFNtYXJ0UmVwbGllc0NvbnN0YW50cyxcbiAgU21hcnRSZXBsaWVzU3R5bGUsXG4gIFRodW1ibmFpbEdlbmVyYXRpb25Db25zdGFudHMsXG4gIFJlYWN0aW9uc1N0eWxlLFxuICBSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uLFxuICBSZWFjdGlvbkluZm9Db25maWd1cmF0aW9uLFxuICBSZWFjdGlvbkxpc3RTdHlsZSxcbiAgUmVhY3Rpb25JbmZvU3R5bGUsXG4gIFJlYWN0aW9uc0NvbmZpZ3VyYXRpb24sXG4gIFVzZXJNZW50aW9uU3R5bGUsXG4gIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFRleHRGb3JtYXR0ZXIsXG4gIFVybEZvcm1hdHRlclN0eWxlLFxuICBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcixcbiAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLFxuICBTdG9yYWdlVXRpbHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQ2FyZE1lc3NhZ2UsXG4gIENvbWV0Q2hhdENhbGxFdmVudHMsXG4gIENvbWV0Q2hhdEdyb3VwRXZlbnRzLFxuICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLFxuICBDb21ldENoYXRNZXNzYWdlT3B0aW9uLFxuICBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUsXG4gIENvbWV0Q2hhdFRoZW1lLFxuICBDb21ldENoYXRVSUV2ZW50cyxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSxcbiAgRGF0ZVBhdHRlcm5zLFxuICBEb2N1bWVudEljb25BbGlnbm1lbnQsXG4gIEZvcm1NZXNzYWdlLFxuICBJR3JvdXBMZWZ0LFxuICBJR3JvdXBNZW1iZXJBZGRlZCxcbiAgSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkLFxuICBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQsXG4gIElNZXNzYWdlcyxcbiAgSVBhbmVsLFxuICBNZXNzYWdlQnViYmxlQWxpZ25tZW50LFxuICBNZXNzYWdlTGlzdEFsaWdubWVudCxcbiAgTWVzc2FnZVN0YXR1cyxcbiAgUGxhY2VtZW50LFxuICBTY2hlZHVsZXJNZXNzYWdlLFxuICBTdGF0ZXMsXG4gIFRpbWVzdGFtcEFsaWdubWVudCxcbiAgZm9udEhlbHBlcixcbiAgbG9jYWxpemUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0VUlLaXRDYWxscyxcbiAgTGlua1ByZXZpZXdTdHlsZSxcbiAgU3RpY2tlcnNDb25zdGFudHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuXG5pbXBvcnQgeyBDaGF0Q29uZmlndXJhdG9yIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9GcmFtZXdvcmsvQ2hhdENvbmZpZ3VyYXRvclwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVJS2l0IH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9Db21ldENoYXRVSWtpdC9Db21ldENoYXRVSUtpdFwiO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uLCBpc0VtcHR5IH0gZnJvbSBcInJ4anNcIjtcblxuLyoqXG4gKlxuICogQ29tZXRDaGF0TWVzc2FnZUxpc3QgaXMgYSB3cmFwcGVyIGNvbXBvbmVudCBmb3IgbWVzc2FnZUJ1YmJsZVxuICpcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiAqIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuICpcbiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1tZXNzYWdlLWxpc3RcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtbWVzc2FnZS1saXN0LmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtbWVzc2FnZS1saXN0LmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0TWVzc2FnZUxpc3RDb21wb25lbnRcbiAgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSwgT25DaGFuZ2VzIHtcbiAgQFZpZXdDaGlsZChcImxpc3RTY3JvbGxcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGxpc3RTY3JvbGwhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiYm90dG9tXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBib3R0b20hOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwidG9wXCIsIHsgc3RhdGljOiBmYWxzZSB9KSB0b3AhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwidGV4dEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgdGV4dEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJ0aHJlYWRNZXNzYWdlQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICB0aHJlYWRNZXNzYWdlQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImZpbGVCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGZpbGVCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiYXVkaW9CdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGF1ZGlvQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInZpZGVvQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSB2aWRlb0J1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJpbWFnZUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgaW1hZ2VCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiZm9ybUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgZm9ybUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJjYXJkQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBjYXJkQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInN0aWNrZXJCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHN0aWNrZXJCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiZG9jdW1lbnRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIGRvY3VtZW50QnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcIndoaXRlYm9hcmRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHdoaXRlYm9hcmRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwicG9wb3ZlclJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgcG9wb3ZlclJlZiE6IGFueTtcbiAgQFZpZXdDaGlsZChcImRpcmVjdENhbGxpbmdcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIGRpcmVjdENhbGxpbmchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwic2NoZWR1bGVyQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBzY2hlZHVsZXJCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwicG9sbEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgcG9sbEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGRyZW4oXCJtZXNzYWdlQnViYmxlUmVmXCIpIG1lc3NhZ2VCdWJibGVSZWYhOiBRdWVyeUxpc3Q8RWxlbWVudFJlZj47XG5cbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIGRpc2FibGVSZWNlaXB0OiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvck1lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGN1c3RvbVNvdW5kRm9yTWVzc2FnZXM6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIHJlYWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXJlYWQuc3ZnXCI7XG4gIEBJbnB1dCgpIGRlbGl2ZXJlZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtZGVsaXZlcmVkLnN2Z1wiO1xuICBASW5wdXQoKSBzZW50SWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1zZW50LnN2Z1wiO1xuICBASW5wdXQoKSB3YWl0SWNvbjogc3RyaW5nID0gXCJhc3NldHMvd2FpdC5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JJY29uOiBzdHJpbmcgPSBcImFzc2V0cy93YXJuaW5nLXNtYWxsLnN2Z1wiO1xuICBASW5wdXQoKSBhaUVycm9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvYWktZXJyb3Iuc3ZnXCI7XG4gIEBJbnB1dCgpIGFpRW1wdHlJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9haS1lbXB0eS5zdmdcIjtcbiAgQElucHV0KCkgYWxpZ25tZW50OiBNZXNzYWdlTGlzdEFsaWdubWVudCA9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkO1xuICBASW5wdXQoKSBzaG93QXZhdGFyOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy50aW1lO1xuICBASW5wdXQoKSB0aW1lc3RhbXBBbGlnbm1lbnQ6IFRpbWVzdGFtcEFsaWdubWVudCA9IFRpbWVzdGFtcEFsaWdubWVudC5ib3R0b207XG4gIEBJbnB1dCgpIERhdGVTZXBhcmF0b3JQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIHRlbXBsYXRlczogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlW10gPSBbXTtcbiAgQElucHV0KCkgbWVzc2FnZXNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBuZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRocmVzaG9sZFZhbHVlOiBudW1iZXIgPSAxMDAwO1xuICBASW5wdXQoKSB1bnJlYWRNZXNzYWdlVGhyZXNob2xkOiBudW1iZXIgPSAzMDtcbiAgQElucHV0KCkgcmVhY3Rpb25zQ29uZmlndXJhdGlvbjogUmVhY3Rpb25zQ29uZmlndXJhdGlvbiA9XG4gICAgbmV3IFJlYWN0aW9uc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBkaXNhYmxlUmVhY3Rpb25zOiBCb29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGVtb2ppS2V5Ym9hcmRTdHlsZTogRW1vamlLZXlib2FyZFN0eWxlID0ge307XG4gIEBJbnB1dCgpIGFwaUNvbmZpZ3VyYXRpb24/OiAoXG4gICAgdXNlcj86IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwXG4gICkgPT4gUHJvbWlzZTxPYmplY3Q+O1xuXG4gIEBJbnB1dCgpIG9uVGhyZWFkUmVwbGllc0NsaWNrITpcbiAgICB8ICgobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+KSA9PiB2b2lkKVxuICAgIHwgbnVsbDtcbiAgQElucHV0KCkgaGVhZGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGZvb3RlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBwYXJlbnRNZXNzYWdlSWQhOiBudW1iZXI7XG4gIEBJbnB1dCgpIHRocmVhZEluZGljYXRvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3RocmVhZEluZGljYXRvckljb24uc3ZnXCI7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICB9O1xuICBASW5wdXQoKSBiYWNrZHJvcFN0eWxlOiBCYWNrZHJvcFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiYSgwLCAwLCAwLCAwLjUpXCIsXG4gICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgfTtcbiAgQElucHV0KCkgZGF0ZVNlcGFyYXRvclN0eWxlOiBEYXRlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIHdpZHRoOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBtZXNzYWdlTGlzdFN0eWxlOiBNZXNzYWdlTGlzdFN0eWxlID0ge1xuICAgIG5hbWVUZXh0Rm9udDogXCI2MDAgMTVweCBJbnRlclwiLFxuICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICAgIGVycm9yU3RhdGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICB9O1xuICBASW5wdXQoKSBvbkVycm9yOiAoKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkKSB8IG51bGwgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuICBASW5wdXQoKSBtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uOiBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uID1cbiAgICBuZXcgTWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbih7fSk7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIG9wdGlvbnNTdHlsZTogTWVudUxpc3RTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgbW9yZUljb25UaW50OiBcImdyZXlcIixcbiAgfTtcbiAgcmVjZWlwdFN0eWxlOiBSZWNlaXB0U3R5bGUgPSB7fTtcbiAgZG9jdW1lbnRCdWJibGVBbGlnbm1lbnQ6IERvY3VtZW50SWNvbkFsaWdubWVudCA9IERvY3VtZW50SWNvbkFsaWdubWVudC5yaWdodDtcbiAgY2FsbEJ1YmJsZUFsaWdubWVudDogRG9jdW1lbnRJY29uQWxpZ25tZW50ID0gRG9jdW1lbnRJY29uQWxpZ25tZW50LmxlZnQ7XG4gIGltYWdlTW9kZXJhdGlvblN0eWxlOiBJbWFnZU1vZGVyYXRpb25TdHlsZSA9IHt9O1xuICB0aW1lc3RhbXBFbnVtOiB0eXBlb2YgVGltZXN0YW1wQWxpZ25tZW50ID0gVGltZXN0YW1wQWxpZ25tZW50O1xuICBwdWJsaWMgY2hhdENoYW5nZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICBzdGFydGVyRXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBzdGFydGVyRW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIHN0YXJ0ZXJMb2FkaW5nU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdFTkVSQVRJTkdfSUNFQlJFQUtFUlNcIik7XG4gIHN1bW1hcnlFcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIHN1bW1hcnlFbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgc3VtbWFyeUxvYWRpbmdTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiR0VORVJBVElOR19TVU1NQVJZXCIpO1xuICAvLyBwdWJsaWMgcHJvcGVydGllc1xuICBwdWJsaWMgcmVxdWVzdEJ1aWxkZXI6IGFueTtcbiAgcHVibGljIGNsb3NlSW1hZ2VNb2RlcmF0aW9uOiBhbnk7XG4gIHB1YmxpYyB0aW1lU3RhbXBDb2xvcjogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHRpbWVTdGFtcEZvbnQ6IHN0cmluZyA9IFwiXCI7XG4gIHNtYXJ0UmVwbHlTdHlsZTogU21hcnRSZXBsaWVzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcbiAgY29udmVyc2F0aW9uU3RhcnRlclN0eWxlOiBTbWFydFJlcGxpZXNTdHlsZSA9IHt9O1xuICBjb252ZXJzYXRpb25TdW1tYXJ5U3R5bGU6IFBhbmVsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBjbG9zZUljb25UaW50OiBcIlwiLFxuICAgIGJveFNoYWRvdzogXCJcIixcbiAgICB0ZXh0Rm9udDogXCJcIixcbiAgICB0ZXh0Q29sb3I6IFwiXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgfTtcblxuICBwdWJsaWMgc2hvd1NtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHNob3dDb252ZXJzYXRpb25TdGFydGVyOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdGFydGVyU3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXM6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBlbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzaG93Q29udmVyc2F0aW9uU3VtbWFyeTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIGNvbnZlcnNhdGlvblN1bW1hcnk6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBnZXRVbnJlYWRDb3VudDogYW55ID0gMDtcblxuICBjY0hpZGVQYW5lbCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NTaG93UGFuZWwhOiBTdWJzY3JpcHRpb247XG4gIHNtYXJ0UmVwbHlNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVuYWJsZVNtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc21hcnRSZXBseUNvbmZpZyE6IFNtYXJ0UmVwbGllc0NvbmZpZ3VyYXRpb247XG4gIHB1YmxpYyB0aW1lU3RhbXBCYWNrZ3JvdW5kOiBzdHJpbmcgPSBcIlwiO1xuICBsaW5rUHJldmlld1N0eWxlOiBMaW5rUHJldmlld1N0eWxlID0ge307XG4gIHB1YmxpYyB1bnJlYWRNZXNzYWdlc1N0eWxlID0ge307XG4gIHB1YmxpYyBtb2RhbFN0eWxlID0ge1xuICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgIHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG4gICAgY2xvc2VJY29uVGludDogXCJibHVlXCIsXG4gIH07XG4gIHB1YmxpYyBkaXZpZGVyU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMXB4XCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiZ3JleVwiLFxuICB9O1xuICBwb2xsQnViYmxlU3R5bGU6IFBvbGxzQnViYmxlU3R5bGUgPSB7fTtcbiAgbGFiZWxTdHlsZTogYW55ID0ge1xuICAgIHRleHRGb250OiBcIjQwMCAxMXB4IEludGVyXCIsXG4gICAgdGV4dENvbG9yOiBcImdyZXlcIixcbiAgfTtcbiAgaW1hZ2VCdWJibGVTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyMDBweFwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHggOHB4IDBweCAwcHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIG1lc3NhZ2VzTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbXTtcbiAgYnViYmxlRGF0ZVN0eWxlOiBEYXRlU3R5bGUgPSB7fTtcbiAgd2hpdGVib2FyZEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2NvbGxhYm9yYXRpdmV3aGl0ZWJvYXJkLnN2Z1wiO1xuICBkb2N1bWVudEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2NvbGxhYm9yYXRpdmVkb2N1bWVudC5zdmdcIjtcbiAgZGlyZWN0Q2FsbEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1ZpZGVvLWNhbGwyeC5zdmdcIjtcbiAgcGxhY2Vob2xkZXJJY29uVVJMOiBzdHJpbmcgPSBcIi9hc3NldHMvcGxhY2Vob2xkZXIucG5nXCI7XG4gIGRvd25sb2FkSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvZG93bmxvYWQuc3ZnXCI7XG4gIHRyYW5zbGF0aW9uU3R5bGU6IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlID0ge307XG4gIGRvY3VtZW50QnViYmxlU3R5bGU6IERvY3VtZW50QnViYmxlU3R5bGUgPSB7fTtcbiAgY2FsbEJ1YmJsZVN0eWxlOiBEb2N1bWVudEJ1YmJsZVN0eWxlID0ge307XG4gIHdoaXRlYm9hcmRUaXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJDT0xMQUJPUkFUSVZFX1dISVRFQk9BUkRcIik7XG4gIHdoaXRlYm9hcmRTdWJpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRSQVdfV0hJVEVCT0FSRF9UT0dFVEhFUlwiKTtcbiAgd2hpdGVib2FyZEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiT1BFTl9XSElURUJPQVJEXCIpO1xuICBkb2N1bWVudFRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNPTExBQk9SQVRJVkVfRE9DVU1FTlRcIik7XG4gIGRvY3VtZW50U3ViaXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJEUkFXX0RPQ1VNRU5UX1RPR0VUSEVSXCIpO1xuICBkb2N1bWVudEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiT1BFTl9ET0NVTUVOVFwiKTtcbiAgam9pbkNhbGxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkpPSU5cIik7XG4gIHRvcE9ic2VydmVyITogSW50ZXJzZWN0aW9uT2JzZXJ2ZXI7XG4gIGJvdHRvbU9ic2VydmVyITogSW50ZXJzZWN0aW9uT2JzZXJ2ZXI7XG4gIGxvY2FsaXplOiB0eXBlb2YgbG9jYWxpemUgPSBsb2NhbGl6ZTtcbiAgcmVpbml0aWFsaXplZDogYm9vbGVhbiA9IGZhbHNlO1xuICBhZGRSZWFjdGlvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2FkZHJlYWN0aW9uLnN2Z1wiO1xuICBNZXNzYWdlVHlwZXNDb25zdGFudDogdHlwZW9mIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcyA9XG4gICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzO1xuICBjYWxsQ29uc3RhbnQ6IHN0cmluZyA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsO1xuICBwdWJsaWMgdHlwZXNNYXA6IGFueSA9IHt9O1xuICBwdWJsaWMgbWVzc2FnZVR5cGVzTWFwOiBhbnkgPSB7fTtcbiAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lID0gbmV3IENvbWV0Q2hhdFRoZW1lKHt9KTtcbiAgcHVibGljIGdyb3VwTGlzdGVuZXJJZCA9IFwiZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgcHVibGljIHN0YXRlczogdHlwZW9mIFN0YXRlcyA9IFN0YXRlcztcbiAgTWVzc2FnZUNhdGVnb3J5ID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5O1xuICBwdWJsaWMgbnVtYmVyT2ZUb3BTY3JvbGw6IG51bWJlciA9IDA7XG4gIGtlZXBSZWNlbnRNZXNzYWdlczogYm9vbGVhbiA9IHRydWU7XG4gIG1lc3NhZ2VUZW1wbGF0ZTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlW10gPSBbXTtcbiAgcHVibGljIG9wZW5Db250YWN0c1ZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbWVzc2FnZUNvdW50ITogbnVtYmVyO1xuICBpc09uQm90dG9tOiBib29sZWFuID0gZmFsc2U7XG4gIFVucmVhZENvdW50OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFtdO1xuICBuZXdNZXNzYWdlQ291bnQ6IG51bWJlciB8IHN0cmluZyA9IDA7XG4gIHR5cGU6IHN0cmluZyA9IFwiXCI7XG4gIGNvbmZpcm1UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIllFU1wiKTtcbiAgY2FuY2VsVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT1wiKTtcbiAgd2FybmluZ1RleHQ6IHN0cmluZyA9IFwiQXJlIHlvdSBzdXJlIHdhbnQgdG8gc2VlIHVuc2FmZSBjb250ZW50P1wiO1xuICBjY01lc3NhZ2VEZWxldGUhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVJlYWN0ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VSZWFkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ITogU3Vic2NyaXB0aW9uO1xuICBjY0xpdmVSZWFjdGlvbiE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlU2VudCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVySm9pbmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyS2lja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITogU3Vic2NyaXB0aW9uO1xuICBjY093bmVyc2hpcENoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwQ3JlYXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPdXRnb2luZ0NhbGwhOiBTdWJzY3JpcHRpb247XG4gIGNjQ2FsbFJlamVjdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0NhbGxFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDYWxsQWNjZXB0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVGV4dE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlUmVhY3Rpb25BZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlUmVhY3Rpb25SZW1vdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25Gb3JtTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DYXJkTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lZGlhTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzRGVsaXZlcmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBvblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25JbnRlcmFjdGlvbkdvYWxDb21wbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIHRocmVhZGVkQWxpZ25tZW50OiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICBtZXNzYWdlSW5mb0FsaWdubWVudDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ7XG4gIG9wZW5FbW9qaUtleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGtleWJvYXJkQWxpZ25tZW50OiBzdHJpbmcgPSBQbGFjZW1lbnQucmlnaHQ7XG4gIHBvcG92ZXJTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIzMzBweFwiLFxuICAgIHdpZHRoOiBcIjMyNXB4XCIsXG4gIH07XG4gIHZpZGVvQnViYmxlU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTMwcHhcIixcbiAgICB3aWR0aDogXCIyMzBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgdGhyZWFkVmlld0FsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDtcbiAgd2hpdGVib2FyZFVSTDogc3RyaW5nIHwgVVJMIHwgdW5kZWZpbmVkO1xuICBlbmFibGVEYXRhTWFza2luZzogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVUaHVtYm5haWxHZW5lcmF0aW9uOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZUxpbmtQcmV2aWV3OiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVBvbGxzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVJlYWN0aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVJbWFnZU1vZGVyYXRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlU3RpY2tlcnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlV2hpdGVib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVEb2N1bWVudDogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93T25nb2luZ0NhbGw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlQ2FsbGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBvbmdvaW5nQ2FsbFN0eWxlOiBDYWxsc2NyZWVuU3R5bGUgPSB7fTtcbiAgc2Vzc2lvbklkOiBzdHJpbmcgPSBcIlwiO1xuICBvcGVuTWVzc2FnZUluZm9QYWdlOiBib29sZWFuID0gZmFsc2U7XG4gIG1lc3NhZ2VJbmZvT2JqZWN0ITogQ29tZXRDaGF0LkJhc2VNZXNzYWdlO1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBpc1dlYnNvY2tldFJlY29ubmVjdGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBsYXN0TWVzc2FnZUlkOiBudW1iZXIgPSAwO1xuICBpc0Nvbm5lY3Rpb25SZWVzdGFibGlzaGVkOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRleHRGb3JtYXR0ZXJzPzogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj47XG5cbiAgY2xvc2VJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiO1xuICB0aHJlYWRPcGVuSWNvbjogc3RyaW5nID0gXCJhc3NldHMvc2lkZS1hcnJvdy5zdmdcIjtcbiAgY29uZmlybURpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7fTtcbiAgcHVibGljIG1lc3NhZ2VUb1JlYWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBudWxsID0gbnVsbDtcblxuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICB0eXBlczogc3RyaW5nW10gPSBbXTtcbiAgY2F0ZWdvcmllczogc3RyaW5nW10gPSBbXTtcbiAgY2FsbGJhY2tzOiBNYXA8c3RyaW5nLCAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHZvaWQ+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2VcbiAgKSB7IH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICBpZiAoY2hhbmdlc1tcInVzZXJcIl0gfHwgY2hhbmdlc1tcImdyb3VwXCJdKSB7XG4gICAgICAgIHRoaXMuY2hhdENoYW5nZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGNoYW5nZXNbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXSB8fFxuICAgICAgICBjaGFuZ2VzW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBdXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgPSBbXTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIHRoaXMuc2hvd0VuYWJsZWRFeHRlbnNpb25zKCk7XG4gICAgICAgIHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwgPSAwO1xuICAgICAgICBpZiAoIXRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlciBhcyBDb21ldENoYXQuVXNlcjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtdO1xuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMudXNlcikubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdGhpcy51c2VyO1xuICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBDb21ldENoYXQuZ2V0VXNlcih0aGlzLnVzZXIpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcjtcbiAgICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LmtleXModGhpcy5ncm91cCkubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy5ncm91cCA9IHRoaXMuZ3JvdXA7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBDb21ldENoYXQuZ2V0R3JvdXAodGhpcy5ncm91cCkudGhlbigoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmdyb3VwID0gZ3JvdXA7XG4gICAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNlbmRNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICByZWNlaXZlcklkOiBzdHJpbmcsXG4gICAgcmVjZWl2ZXJUeXBlOiBzdHJpbmdcbiAgKSB7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0KSB7XG4gICAgICBjb25zdCBuZXdNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5UZXh0TWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRUZXh0KCksXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0LnNlbmRUZXh0TWVzc2FnZShuZXdNZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSlcbiAgICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IChtZXNzYWdlIGFzIGFueSk/LmRhdGE/LmF0dGFjaG1lbnRzWzBdO1xuICAgICAgY29uc3QgbmV3TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuTWVkaWFNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICBcIlwiLFxuICAgICAgICBtZXNzYWdlLmdldFR5cGUoKSxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgbGV0IGF0dGFjaG1lbnQgPSBuZXcgQ29tZXRDaGF0LkF0dGFjaG1lbnQodXBsb2FkZWRGaWxlKTtcbiAgICAgIG5ld01lc3NhZ2Uuc2V0QXR0YWNobWVudChhdHRhY2htZW50KTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0LnNlbmRNZWRpYU1lc3NhZ2UobmV3TWVzc2FnZSBhcyBDb21ldENoYXQuTWVkaWFNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgY2xvc2VDb250YWN0c1BhZ2UgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQ29udGFjdHNWaWV3ID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBhZGRSZWFjdGlvbiA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IGVtb2ppID0gZXZlbnQ/LmRldGFpbD8uaWQ7XG4gICAgdGhpcy5wb3BvdmVyUmVmLm5hdGl2ZUVsZW1lbnQub3BlbkNvbnRlbnRWaWV3KGV2ZW50KTtcbiAgICBpZiAodGhpcy5tZXNzYWdlVG9SZWFjdCkge1xuICAgICAgdGhpcy5yZWFjdFRvTWVzc2FnZShlbW9qaSwgdGhpcy5tZXNzYWdlVG9SZWFjdCk7XG4gICAgfVxuICB9O1xuICBnZXRDYWxsQnViYmxlVGl0bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKFxuICAgICAgIW1lc3NhZ2UuZ2V0U2VuZGVyKCkgfHxcbiAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKClcbiAgICApIHtcbiAgICAgIHJldHVybiBsb2NhbGl6ZShcIllPVV9JTklUSUFURURfR1JPVVBfQ0FMTFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGAke21lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0TmFtZSgpfSAgJHtsb2NhbGl6ZShcbiAgICAgICAgXCJJTklUSUFURURfR1JPVVBfQ0FMTFwiXG4gICAgICApfWA7XG4gICAgfVxuICB9XG4gIGdldENhbGxBY3Rpb25NZXNzYWdlID0gKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgcmV0dXJuIENhbGxpbmdEZXRhaWxzVXRpbHMuZ2V0Q2FsbFN0YXR1cyhjYWxsLCB0aGlzLmxvZ2dlZEluVXNlcik7XG4gIH07XG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG5cbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0cnkge1xuICAgICAgLy9SZW1vdmluZyBNZXNzYWdlIExpc3RlbmVyc1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5ncm91cExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMaXN0ZW5lcklkKTtcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZClcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvbkFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHJhbnNpZW50TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgUmVhY3Rpb25zU3R5bGUgb2JqZWN0IHdpdGggdGhlIGRlZmluZWQgb3IgZGVmYXVsdCBzdHlsZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIHtSZWFjdGlvbnNTdHlsZX0gUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBSZWFjdGlvbnNTdHlsZSB3aXRoIHRoZSBzZXQgb3IgZGVmYXVsdCBzdHlsZXMuXG4gICAqL1xuICBnZXRSZWFjdGlvbnNTdHlsZSgpIHtcbiAgICBjb25zdCByZWFjdGlvbnNTdHlsZSA9IHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25zU3R5bGUgfHwge307XG4gICAgcmV0dXJuIG5ldyBSZWFjdGlvbnNTdHlsZSh7XG4gICAgICBoZWlnaHQ6IHJlYWN0aW9uc1N0eWxlPy5oZWlnaHQgfHwgXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IHJlYWN0aW9uc1N0eWxlPy53aWR0aCB8fCBcImZpdC1jb250ZW50XCIsXG4gICAgICBib3JkZXI6IHJlYWN0aW9uc1N0eWxlPy5ib3JkZXIgfHwgXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IHJlYWN0aW9uc1N0eWxlPy5ib3JkZXJSYWRpdXMgfHwgXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiByZWFjdGlvbnNTdHlsZT8uYmFja2dyb3VuZCB8fCBcInRyYW5zcGFyZW50XCIsXG4gICAgICBhY3RpdmVSZWFjdGlvbkJhY2tncm91bmQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5MTUwKCksXG4gICAgICByZWFjdGlvbkJhY2tncm91bmQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICByZWFjdGlvbkJvcmRlcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQm9yZGVyIHx8XG4gICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBhY3RpdmVSZWFjdGlvbkJvcmRlcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQm9yZGVyIHx8XG4gICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnk1MDAoKX1gLFxuICAgICAgcmVhY3Rpb25Cb3JkZXJSYWRpdXM6IHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJvcmRlclJhZGl1cyB8fCBcIjEycHhcIixcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Q29sb3I6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkNvdW50VGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhY3RpdmVSZWFjdGlvbkNvdW50VGV4dEZvbnQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkNvdW50VGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlYWN0aW9uQ291bnRUZXh0Rm9udDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQ291bnRUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVhY3Rpb25Db3VudFRleHRDb2xvcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQ291bnRUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHJlYWN0aW9uQm94U2hhZG93OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Cb3hTaGFkb3cgfHwgXCJyZ2JhKDAsIDAsIDAsIDAuMSkgMHB4IDRweCAxMnB4XCIsXG4gICAgICByZWFjdGlvbkVtb2ppRm9udDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uRW1vamlGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgIH0pO1xuICB9XG4gIGlzTW9iaWxlVmlldyA9ICgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmlubmVyV2lkdGggPD0gNzY4O1xuICB9O1xuICBnZXRCdWJibGVCeUlkKGlkOiBzdHJpbmcpOiBFbGVtZW50UmVmIHwgdW5kZWZpbmVkIHtcbiAgICBsZXQgdGFyZ2V0QnViYmxlOiBFbGVtZW50UmVmIHwgdW5kZWZpbmVkO1xuICAgIHRoaXMubWVzc2FnZUJ1YmJsZVJlZi5mb3JFYWNoKChidWJibGU6IEVsZW1lbnRSZWYpID0+IHtcbiAgICAgIGlmIChidWJibGUubmF0aXZlRWxlbWVudC5pZCA9PT0gaWQpXG4gICAgICAgIHRhcmdldEJ1YmJsZSA9IGJ1YmJsZTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0YXJnZXRCdWJibGU7XG4gIH1cbiAgc2hvd0Vtb2ppS2V5Ym9hcmQgPSAoaWQ6IG51bWJlciwgZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBmYWxzZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUb1JlYWN0ID0gbWVzc2FnZTtcbiAgICAgIGlmICh0aGlzLmlzTW9iaWxlVmlldygpKSB7XG4gICAgICAgIGxldCBidWJibGVSZWYgPSB0aGlzLmdldEJ1YmJsZUJ5SWQoU3RyaW5nKGlkKSlcbiAgICAgICAgaWYgKGJ1YmJsZVJlZikge1xuICAgICAgICAgIGNvbnN0IHJlY3QgPSBidWJibGVSZWYubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICBjb25zdCBpc0F0VG9wID0gcmVjdC50b3AgPCBpbm5lckhlaWdodCAvIDI7XG4gICAgICAgICAgY29uc3QgaXNBdEJvdHRvbSA9IHJlY3QuYm90dG9tID4gd2luZG93LmlubmVySGVpZ2h0IC8gMjtcbiAgICAgICAgICBpZiAoaXNBdFRvcCkge1xuICAgICAgICAgICAgdGhpcy5rZXlib2FyZEFsaWdubWVudCA9IFBsYWNlbWVudC5ib3R0b207XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0F0Qm90dG9tKSB7XG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkQWxpZ25tZW50ID0gUGxhY2VtZW50LnRvcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmtleWJvYXJkQWxpZ25tZW50ID1cbiAgICAgICAgICBtZXNzYWdlLmdldFNlbmRlcigpPy5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgID8gUGxhY2VtZW50LmxlZnRcbiAgICAgICAgICAgIDogUGxhY2VtZW50LnJpZ2h0O1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdGhpcy5wb3BvdmVyUmVmLm5hdGl2ZUVsZW1lbnQub3BlbkNvbnRlbnRWaWV3KGV2ZW50KTtcbiAgICB9XG4gIH07XG4gIHNldEJ1YmJsZVZpZXcgPSAoKSA9PiB7XG4gICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKSA9PiB7XG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFtlbGVtZW50LnR5cGVdID0gZWxlbWVudDtcbiAgICB9KTtcbiAgfTtcbiAgb3BlblRocmVhZFZpZXcgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgaWYgKHRoaXMub25UaHJlYWRSZXBsaWVzQ2xpY2spIHtcbiAgICAgIHRoaXMub25UaHJlYWRSZXBsaWVzQ2xpY2sobWVzc2FnZSwgdGhpcy50aHJlYWRNZXNzYWdlQnViYmxlKTtcbiAgICB9XG4gIH07XG4gIHRocmVhZENhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vcGVuVGhyZWFkVmlldyhtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgZGVsZXRlQ2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLmRlbGV0ZU1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIGVkaXRDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub25FZGl0TWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgY29weUNhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vbkNvcHlNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBtZXNzYWdlUHJpdmF0ZWx5Q2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLnNlbmRNZXNzYWdlUHJpdmF0ZWx5KG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBtZXNzYWdlSW5mb0NhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vcGVuTWVzc2FnZUluZm8obWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIG9wZW5NZXNzYWdlSW5mbyhtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0aGlzLm9wZW5NZXNzYWdlSW5mb1BhZ2UgPSB0cnVlO1xuICAgIHRoaXMubWVzc2FnZUluZm9PYmplY3QgPSBtZXNzYWdlT2JqZWN0O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBjbG9zZU1lc3NhZ2VJbmZvUGFnZSA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5NZXNzYWdlSW5mb1BhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIHNlbmRNZXNzYWdlUHJpdmF0ZWx5KG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjT3BlbkNoYXQubmV4dCh7IHVzZXI6IG1lc3NhZ2VPYmplY3QuZ2V0U2VuZGVyKCkgfSk7XG4gIH1cbiAgZ2V0TWVzc2FnZUJ5SWQoaWQ6IG51bWJlciB8IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KChtKSA9PiBtLmdldElkKCkgPT0gaWQpO1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBpc1RyYW5zbGF0ZWQobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogYW55IHtcbiAgICBsZXQgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q6IGFueSA9IG1lc3NhZ2U7XG4gICAgaWYgKFxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3QgJiZcbiAgICAgIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0Py5kYXRhPy5tZXRhZGF0YSAmJlxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q/LmRhdGE/Lm1ldGFkYXRhW1xuICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnRyYW5zbGF0ZWRfbWVzc2FnZVxuICAgICAgXVxuICAgICkge1xuICAgICAgcmV0dXJuIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0LmRhdGEubWV0YWRhdGFbXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy50cmFuc2xhdGVkX21lc3NhZ2VcbiAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICB1cGRhdGVUcmFuc2xhdGVkTWVzc2FnZSA9ICh0cmFuc2xhdGlvbjogYW55KSA9PiB7XG4gICAgdmFyIHJlY2VpdmVkTWVzc2FnZSA9IHRyYW5zbGF0aW9uO1xuICAgIHZhciB0cmFuc2xhdGVkVGV4dCA9IHJlY2VpdmVkTWVzc2FnZS50cmFuc2xhdGlvbnNbMF0ubWVzc2FnZV90cmFuc2xhdGVkO1xuICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gcmVjZWl2ZWRNZXNzYWdlLm1zZ0lkXG4gICAgKTtcbiAgICBsZXQgZGF0YTogYW55O1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIHZhciBtZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlS2V5XTtcbiAgICAgIGlmICgobWVzc2FnZU9iaiBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldE1ldGFkYXRhKCkpIHtcbiAgICAgICAgZGF0YSA9IChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0TWV0YWRhdGEoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TWV0YWRhdGEoe30pO1xuICAgICAgICBkYXRhID0gKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRNZXRhZGF0YSgpO1xuICAgICAgfVxuICAgICAgZGF0YVtNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudHJhbnNsYXRlZF9tZXNzYWdlXSA9IHRyYW5zbGF0ZWRUZXh0O1xuICAgICAgdmFyIG5ld01lc3NhZ2VPYmo6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9XG4gICAgICAgIG1lc3NhZ2VPYmo7XG4gICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbmV3TWVzc2FnZU9iaik7XG4gICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlTGlzdF07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuICB0cmFuc2xhdGVNZXNzYWdlID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgZmFsc2UgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICBpZiAobWVzc2FnZSkge1xuICAgICAgQ29tZXRDaGF0LmNhbGxFeHRlbnNpb24oXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy5tZXNzYWdlX3RyYW5zbGF0aW9uLFxuICAgICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMucG9zdCxcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnYyX3RyYW5zbGF0ZSxcbiAgICAgICAge1xuICAgICAgICAgIG1zZ0lkOiBtZXNzYWdlLmdldElkKCksXG4gICAgICAgICAgdGV4dDogKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRUZXh0KCksXG4gICAgICAgICAgbGFuZ3VhZ2VzOiBuYXZpZ2F0b3IubGFuZ3VhZ2VzLFxuICAgICAgICB9XG4gICAgICApXG4gICAgICAgIC50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHJlc3VsdD8udHJhbnNsYXRpb25zWzBdPy5tZXNzYWdlX3RyYW5zbGF0ZWQgIT1cbiAgICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk/LmdldFRleHQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVUcmFuc2xhdGVkTWVzc2FnZShyZXN1bHQpO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlc3VsdCBvZiB0cmFuc2xhdGlvbnNcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4geyB9KTtcbiAgICB9XG4gIH07XG4gIHNldE9wdGlvbnNDYWxsYmFjayhvcHRpb25zOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10sIGlkOiBudW1iZXIpIHtcbiAgICBvcHRpb25zPy5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRNZXNzYWdlT3B0aW9uKSA9PiB7XG4gICAgICBzd2l0Y2ggKGVsZW1lbnQuaWQpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLmRlbGV0ZU1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uZWRpdE1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZWRpdENhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnRyYW5zbGF0ZU1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMudHJhbnNsYXRlTWVzc2FnZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5jb3B5TWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5jb3B5Q2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVhY3RUb01lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2sgfHwgIShlbGVtZW50IGFzIGFueSkuY3VzdG9tVmlldykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5yZXBseUluVGhyZWFkOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLnRocmVhZENhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnNlbmRNZXNzYWdlUHJpdmF0ZWx5OlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm1lc3NhZ2VQcml2YXRlbHlDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5tZXNzYWdlSW5mb3JtYXRpb246XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMubWVzc2FnZUluZm9DYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH1cbiAgLyoqXG4gICAqIHNlbmQgbWVzc2FnZSBvcHRpb25zIGJhc2VkIG9uIHR5cGVcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtc2dPYmplY3RcbiAgICovXG4gIHNldE1lc3NhZ2VPcHRpb25zKFxuICAgIG1zZ09iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSB7XG4gICAgbGV0IG9wdGlvbnMhOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW107XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUgJiZcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmxlbmd0aCA+IDAgJiZcbiAgICAgICFtc2dPYmplY3Q/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2dPYmplY3Q/LmdldFR5cGUoKSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXJcbiAgICApIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSkgPT4ge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgbXNnT2JqZWN0Py5nZXRJZCgpICYmXG4gICAgICAgICAgZWxlbWVudC50eXBlID09IG1zZ09iamVjdD8uZ2V0VHlwZSgpICYmXG4gICAgICAgICAgZWxlbWVudD8ub3B0aW9uc1xuICAgICAgICApIHtcbiAgICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICAgIHRoaXMuc2V0T3B0aW9uc0NhbGxiYWNrKFxuICAgICAgICAgICAgICBlbGVtZW50Py5vcHRpb25zKFxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyLFxuICAgICAgICAgICAgICAgIG1zZ09iamVjdCxcbiAgICAgICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIG1zZ09iamVjdD8uZ2V0SWQoKVxuICAgICAgICAgICAgKSB8fCBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSBbXTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IHRoaXMuZmlsdGVyRW1vamlPcHRpb25zKG9wdGlvbnMpO1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG4gIC8qKlxuICAgKiBSZWFjdHMgdG8gYSBtZXNzYWdlIGJ5IGVpdGhlciBhZGRpbmcgb3IgcmVtb3ZpbmcgdGhlIHJlYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZW1vamkgLSBUaGUgZW1vamkgdXNlZCBmb3IgdGhlIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoYXQgd2FzIHJlYWN0ZWQgdG8uXG4gICAqL1xuXG4gIHJlYWN0VG9NZXNzYWdlKGVtb2ppOiBzdHJpbmcsIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IG1lc3NhZ2U/LmdldElkKCk7XG4gICAgY29uc3QgbXNnT2JqZWN0ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlSWQpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgICBjb25zdCByZWFjdGlvbnMgPSBtc2dPYmplY3Q/LmdldFJlYWN0aW9ucygpIHx8IFtdO1xuICAgIGNvbnN0IGVtb2ppT2JqZWN0ID0gcmVhY3Rpb25zPy5maW5kKChyZWFjdGlvbjogYW55KSA9PiB7XG4gICAgICByZXR1cm4gcmVhY3Rpb24/LnJlYWN0aW9uID09IGVtb2ppO1xuICAgIH0pO1xuICAgIGlmIChlbW9qaU9iamVjdCAmJiBlbW9qaU9iamVjdD8uZ2V0UmVhY3RlZEJ5TWUoKSkge1xuICAgICAgY29uc3QgdXBkYXRlZFJlYWN0aW9uczogYW55W10gPSBbXTtcbiAgICAgIHJlYWN0aW9ucy5mb3JFYWNoKChyZWFjdGlvbikgPT4ge1xuICAgICAgICBpZiAocmVhY3Rpb24/LmdldFJlYWN0aW9uKCkgPT0gZW1vamkpIHtcbiAgICAgICAgICBpZiAocmVhY3Rpb24/LmdldENvdW50KCkgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVhY3Rpb24uc2V0Q291bnQocmVhY3Rpb24/LmdldENvdW50KCkgLSAxKTtcbiAgICAgICAgICAgIHJlYWN0aW9uLnNldFJlYWN0ZWRCeU1lKGZhbHNlKTtcbiAgICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbXNnT2JqZWN0LnNldFJlYWN0aW9ucyh1cGRhdGVkUmVhY3Rpb25zKTtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZVJlYWN0aW9uKG1lc3NhZ2VJZCwgZW1vamkpXG4gICAgICAgIC50aGVuKChtZXNzYWdlKSA9PiB7IH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAvLyBSZXR1cm4gb2xkIG1lc3NhZ2Ugb2JqZWN0IGluc3RlYWQgb2ZcbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTsgLy9uZWVkIGNoYW5nZXNcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB1cGRhdGVkUmVhY3Rpb25zID0gW107XG4gICAgICBjb25zdCByZWFjdGlvbkF2YWlsYWJsZSA9IHJlYWN0aW9ucy5maW5kKChyZWFjdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gcmVhY3Rpb24/LmdldFJlYWN0aW9uKCkgPT0gZW1vamk7XG4gICAgICB9KTtcblxuICAgICAgcmVhY3Rpb25zLmZvckVhY2goKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChyZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSA9PSBlbW9qaSkge1xuICAgICAgICAgIHJlYWN0aW9uLnNldENvdW50KHJlYWN0aW9uPy5nZXRDb3VudCgpICsgMSk7XG4gICAgICAgICAgcmVhY3Rpb24uc2V0UmVhY3RlZEJ5TWUodHJ1ZSk7XG4gICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICghcmVhY3Rpb25BdmFpbGFibGUpIHtcbiAgICAgICAgY29uc3QgcmVhY3Q6IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50ID0gbmV3IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50KFxuICAgICAgICAgIGVtb2ppLFxuICAgICAgICAgIDEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3QpO1xuICAgICAgfVxuICAgICAgbXNnT2JqZWN0LnNldFJlYWN0aW9ucyh1cGRhdGVkUmVhY3Rpb25zKTtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgQ29tZXRDaGF0LmFkZFJlYWN0aW9uKG1lc3NhZ2VJZCwgZW1vamkpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7IH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBGaWx0ZXJzIG91dCB0aGUgJ2FkZCByZWFjdGlvbicgb3B0aW9uIGlmIHJlYWN0aW9ucyBhcmUgZGlzYWJsZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbltdfSBvcHRpb25zIC0gVGhlIG9yaWdpbmFsIHNldCBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIHtDb21ldENoYXRNZXNzYWdlT3B0aW9uW119IFRoZSBmaWx0ZXJlZCBzZXQgb2YgbWVzc2FnZSBvcHRpb25zLlxuICAgKi9cblxuICBmaWx0ZXJFbW9qaU9wdGlvbnMgPSAob3B0aW9uczogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdKSA9PiB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVSZWFjdGlvbnMpIHtcbiAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zLmZpbHRlcigob3B0aW9uOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uKSA9PiB7XG4gICAgICByZXR1cm4gb3B0aW9uLmlkICE9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlYWN0VG9NZXNzYWdlO1xuICAgIH0pO1xuICB9O1xuICBnZXRDbG9uZWRSZWFjdGlvbk9iamVjdChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICByZXR1cm4gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2UpO1xuICB9XG4gIC8qKlxuICAgKiBwYXNzaW5nIHN0eWxlIGJhc2VkIG9uIG1lc3NhZ2Ugb2JqZWN0XG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZU9iamVjdFxuICAgKi9cbiAgc2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1zZzogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogQmFzZVN0eWxlIHtcbiAgICBsZXQgc3R5bGUhOiBCYXNlU3R5bGU7XG4gICAgaWYgKG1zZz8uZ2V0RGVsZXRlZEF0KCkpIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlcjogYDFweCBkYXNoZWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5tZWV0aW5nICYmXG4gICAgICAoIW1zZz8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgbXNnPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSlcbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgICAgLy8gfSBlbHNlIGlmICh0aGlzLmdldExpbmtQcmV2aWV3KG1zZyBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpKSB7XG4gICAgICAvLyAgIHN0eWxlID0ge1xuICAgICAgLy8gICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIC8vICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgLy8gICB9O1xuICAgIH0gZWxzZSBpZiAobXNnPy5nZXRUeXBlKCkgPT0gU3RpY2tlcnNDb25zdGFudHMuc3RpY2tlcikge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFtc2c/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2c/LmdldENhdGVnb3J5KCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0ICYmXG4gICAgICAoIW1zZz8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09IG1zZz8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpXG4gICAgKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgICB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0XG4gICAgICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKClcbiAgICAgICAgICAgIDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAhbXNnPy5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIgfHxcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudFxuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKX1gLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgIW1zZz8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlXG4gICAgKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICB3aWR0aDogXCIzMDBweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBtc2c/LmdldFNlbmRlcigpICYmXG4gICAgICAgIG1zZz8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZTtcbiAgfVxuICBnZXRTZXNzaW9uSWQobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICBsZXQgZGF0YTogYW55ID0gbWVzc2FnZS5nZXREYXRhKCk7XG4gICAgcmV0dXJuIGRhdGE/LmN1c3RvbURhdGE/LnNlc3Npb25JRDtcbiAgfVxuICBnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKG1lc3NhZ2U/LmdldERhdGEoKSkge1xuICAgICAgICB2YXIgZGF0YTogYW55ID0gbWVzc2FnZS5nZXREYXRhKCk7XG4gICAgICAgIGlmIChkYXRhPy5tZXRhZGF0YSkge1xuICAgICAgICAgIHZhciBtZXRhZGF0YSA9IGRhdGE/Lm1ldGFkYXRhO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KG1ldGFkYXRhLCBcIkBpbmplY3RlZFwiKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFyIGluamVjdGVkT2JqZWN0ID0gbWV0YWRhdGFbXCJAaW5qZWN0ZWRcIl07XG4gICAgICAgICAgICBpZiAoaW5qZWN0ZWRPYmplY3Q/LmV4dGVuc2lvbnMpIHtcbiAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbk9iamVjdCA9IGluamVjdGVkT2JqZWN0LmV4dGVuc2lvbnM7XG4gICAgICAgICAgICAgIHJldHVybiBleHRlbnNpb25PYmplY3RbXG4gICAgICAgICAgICAgICAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMud2hpdGVib2FyZFxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgPyBleHRlbnNpb25PYmplY3RbQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMud2hpdGVib2FyZF1cbiAgICAgICAgICAgICAgICAgIC5ib2FyZF91cmxcbiAgICAgICAgICAgICAgICA6IGV4dGVuc2lvbk9iamVjdFtDb2xsYWJvcmF0aXZlRG9jdW1lbnRDb25zdGFudHMuZG9jdW1lbnRdXG4gICAgICAgICAgICAgICAgICAuZG9jdW1lbnRfdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcGVuTGlua1VSTChldmVudDogYW55KSB7XG4gICAgd2luZG93Lm9wZW4oZXZlbnQ/LmRldGFpbD8udXJsLCBcIl9ibGFua1wiKTtcbiAgfVxuICBnZXRTdGlja2VyKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBzdGlja2VyRGF0YTogYW55ID0gbnVsbDtcbiAgICAgIGlmIChcbiAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5kYXRhXG4gICAgICAgICkgJiZcbiAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpLmdldERhdGEoKSxcbiAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5jdXN0b21fZGF0YVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgc3RpY2tlckRhdGEgPSAobWVzc2FnZSBhcyBhbnkpLmRhdGEuY3VzdG9tRGF0YTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgICAgc3RpY2tlckRhdGEsXG4gICAgICAgICAgICBTdGlja2Vyc0NvbnN0YW50cy5zdGlja2VyX3VybFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHN0aWNrZXJEYXRhLnN0aWNrZXJfdXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ3N0YXR1c0luZm9WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRDb250ZW50VmlldyA9IChcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPT4ge1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0/LmNvbnRlbnRWaWV3XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXT8uY29udGVudFZpZXcobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLmdldERlbGV0ZWRBdCgpXG4gICAgICAgID8gdGhpcy50eXBlc01hcFtcInRleHRcIl1cbiAgICAgICAgOiB0aGlzLnR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV07XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnaGVhZGVyVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cbiAgZ2V0SGVhZGVyVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgbGV0IHZpZXc6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5oZWFkZXJWaWV3XG4gICAgKSB7XG4gICAgICB2aWV3ID0gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXT8uaGVhZGVyVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ2Zvb3RlclZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldEZvb3RlclZpZXcobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGxldCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXT8uZm9vdGVyVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0/LmZvb3RlclZpZXcobWVzc2FnZSk7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdib3R0b21WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRCb3R0b21WaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5ib3R0b21WaWV3XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXT8uYm90dG9tVmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdzdGF0dXNJbmZvVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cblxuICBnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXT8uc3RhdHVzSW5mb1ZpZXdcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5zdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIGlzQXVkaW9PclZpZGVvTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBtZXNzYWdlVHlwZSA9IG1lc3NhZ2U/LmdldFR5cGUoKTtcbiAgICBjb25zdCB0eXBlc1RvQ2hlY2sgPSBbXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8sXG4gICAgXTtcbiAgICByZXR1cm4gdHlwZXNUb0NoZWNrLmluY2x1ZGVzKG1lc3NhZ2VUeXBlKTtcbiAgfVxuXG4gIHNldEJ1YmJsZUFsaWdubWVudCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgYWxpZ25tZW50OiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5jZW50ZXI7XG4gICAgaWYgKHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQpIHtcbiAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyIHx8XG4gICAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudFxuICAgICAgKSB7XG4gICAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQuY2VudGVyO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSAhPVxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcilcbiAgICAgICkge1xuICAgICAgICBhbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWxpZ25tZW50O1xuICB9O1xuXG4gIGdldEZvcm1NZXNzYWdlQnViYmxlU3R5bGUoKSB7XG4gICAgY29uc3QgdGV4dFN0eWxlID0gbmV3IElucHV0U3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjMwcHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIHBhZGRpbmc6IFwiMHB4IDBweCAwcHggNXB4XCIsXG4gICAgICBwbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgfSk7XG4gICAgY29uc3QgbGFiZWxTdHlsZSA9IG5ldyBMYWJlbFN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICBjb25zdCByYWRpb0J1dHRvblN0eWxlID0gbmV3IFJhZGlvQnV0dG9uU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBsYWJlbFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGxhYmVsVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjRweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJcIixcbiAgICB9KTtcbiAgICBjb25zdCBjaGVja2JveFN0eWxlID0gbmV3IENoZWNrYm94U3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgbGFiZWxUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBsYWJlbFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICB9KTtcbiAgICBjb25zdCBkcm9wZG93blN0eWxlID0gbmV3IERyb3Bkb3duU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjM1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjZweFwiLFxuICAgICAgYWN0aXZlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYWN0aXZlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG9wdGlvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgb3B0aW9uQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgb3B0aW9uSG92ZXJCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcbiAgICBjb25zdCBidXR0b25Hcm91cFN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgfTtcbiAgICBjb25zdCBzaW5nbGVTZWxlY3RTdHlsZSA9IG5ldyBTaW5nbGVTZWxlY3RTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGFjdGl2ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGFjdGl2ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgb3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBvcHRpb25Cb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBvcHRpb25Cb3JkZXJSYWRpdXM6IFwiM3B4XCIsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcbiAgICBjb25zdCBxdWlja1ZpZXdTdHlsZSA9IG5ldyBRdWlja1ZpZXdTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbGVhZGluZ0JhclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbGVhZGluZ0JhcldpZHRoOiBcIjRweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgRm9ybUJ1YmJsZVN0eWxlKHtcbiAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB3cmFwcGVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB3cmFwcGVyQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgdGV4dElucHV0U3R5bGU6IHRleHRTdHlsZSxcbiAgICAgIGxhYmVsU3R5bGU6IGxhYmVsU3R5bGUsXG4gICAgICByYWRpb0J1dHRvblN0eWxlOiByYWRpb0J1dHRvblN0eWxlLFxuICAgICAgY2hlY2tib3hTdHlsZTogY2hlY2tib3hTdHlsZSxcbiAgICAgIGRyb3Bkb3duU3R5bGU6IGRyb3Bkb3duU3R5bGUsXG4gICAgICBidXR0b25TdHlsZTogYnV0dG9uR3JvdXBTdHlsZSxcbiAgICAgIHNpbmdsZVNlbGVjdFN0eWxlOiBzaW5nbGVTZWxlY3RTdHlsZSxcbiAgICAgIHF1aWNrVmlld1N0eWxlOiBxdWlja1ZpZXdTdHlsZSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHdyYXBwZXJQYWRkaW5nOiBcIjJweFwiLFxuICAgICAgZGF0ZVBpY2tlckJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGRhdGVQaWNrZXJCb3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBkYXRlUGlja2VyRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBkYXRlUGlja2VyRm9udENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q2FyZE1lc3NhZ2VCdWJibGVTdHlsZSgpIHtcbiAgICBjb25zdCBidXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCI0MHB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwcHhcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogYCR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCl9YCxcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IENhcmRCdWJibGVTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICBpbWFnZUhlaWdodDogXCJhdXRvXCIsXG4gICAgICBpbWFnZVdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGltYWdlUmFkaXVzOiBcIjhweFwiLFxuICAgICAgaW1hZ2VCYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGRlc2NyaXB0aW9uRm9udENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGVzY3JpcHRpb25Gb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblN0eWxlOiBidXR0b25TdHlsZSxcbiAgICAgIGRpdmlkZXJUaW50Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICB3cmFwcGVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB3cmFwcGVyQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgd3JhcHBlclBhZGRpbmc6IFwiMnB4XCIsXG4gICAgICBkaXNhYmxlZEJ1dHRvbkNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q2FsbEJ1YmJsZVN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHZhciBpc0xlZnRBbGlnbmVkID0gdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIGlmIChpc1VzZXJTZW50TWVzc2FnZSAmJiAhaXNMZWZ0QWxpZ25lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBidXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIHdpZHRoOiBcIjI0MHB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiMjQwcHhcIixcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGdldEJ1YmJsZVdyYXBwZXIgPSAoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0+IHtcbiAgICBsZXQgdmlldzogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXAgJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0uYnViYmxlVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0uYnViYmxlVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3ID0gbnVsbDtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH1cbiAgfTtcbiAgZ2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0IHx8XG4gICAgICAobWVzc2FnZS5nZXRTZW5kZXIoKSAmJlxuICAgICAgICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpKVxuICAgICAgPyBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnRcbiAgICAgIDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5yaWdodDtcbiAgfVxuICBzZXRUcmFuc2xhdGlvblN0eWxlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHZhciBpc0xlZnRBbGlnbmVkID0gdGhpcy5hbGlnbm1lbnQgIT09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQ7XG4gICAgdmFyIGlzVXNlclNlbnRNZXNzYWdlID1cbiAgICAgICFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09PSBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKTtcbiAgICBpZiAoIWlzTGVmdEFsaWduZWQpIHtcbiAgICAgIHJldHVybiBuZXcgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUoe1xuICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgICApLFxuICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImxpZ2h0XCIpLFxuICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgICBoZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNVc2VyU2VudE1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSh7XG4gICAgICAgICAgdHJhbnNsYXRlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgICAgICksXG4gICAgICAgICAgdHJhbnNsYXRlZFRleHRDb2xvcjpcbiAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMChcImRhcmtcIiksXG4gICAgICAgICAgaGVscFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlKHtcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOlxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJsaWdodFwiKSxcbiAgICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgICAgIGhlbHBUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgZ2V0Q2FsbFR5cGVJY29uKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGlmIChtZXNzYWdlLmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8pIHtcbiAgICAgIHJldHVybiBcImFzc2V0cy9BdWRpby1DYWxsLnN2Z1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJhc3NldHMvVmlkZW8tY2FsbC5zdmdcIjtcbiAgICB9XG4gIH1cbiAgY2FsbFN0YXR1c1N0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuXG4gICAgaWYgKG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudCkge1xuICAgICAgbGV0IG1pc3NlZENhbGxUZXh0Q29sb3IgPSBDYWxsaW5nRGV0YWlsc1V0aWxzLmlzTWlzc2VkQ2FsbChcbiAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQ2FsbCxcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXJcbiAgICAgIClcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKClcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgICApLFxuICAgICAgICBidXR0b25UZXh0Q29sb3I6IG1pc3NlZENhbGxUZXh0Q29sb3IsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMHB4XCIsXG4gICAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICAgIGJ1dHRvbkljb25UaW50OiBtaXNzZWRDYWxsVGV4dENvbG9yLFxuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIHBhZGRpbmc6IFwiOHB4IDEycHhcIixcbiAgICAgICAgZ2FwOiBcIjRweFwiLFxuICAgICAgICBoZWlnaHQ6IFwiMjVweFwiLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICBzZXRUZXh0QnViYmxlU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGlzSW5mb0J1YmJsZSA9IHRoaXMubWVzc2FnZUluZm9PYmplY3QgJiYgbWVzc2FnZS5nZXRJZCgpICYmIHRoaXMubWVzc2FnZUluZm9PYmplY3QuZ2V0SWQoKSA9PSBtZXNzYWdlLmdldElkKClcbiAgICB2YXIgaXNEZWxldGVkID0gbWVzc2FnZS5nZXREZWxldGVkQXQoKTtcbiAgICB2YXIgbm90TGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCAhPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNUZXh0TWVzc2FnZSA9XG4gICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSAmJlxuICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIHZhciBpc0dyb3VwTWVtYmVyTWVzc2FnZSA9XG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcjtcbiAgICBpZiAoIWlzRGVsZXRlZCAmJiBub3RMZWZ0QWxpZ25lZCAmJiBpc1RleHRNZXNzYWdlICYmIGlzVXNlclNlbnRNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgICBidWJibGVQYWRkaW5nOiBpc0luZm9CdWJibGUgPyBcIjhweCAxMnB4XCIgOiBcIjhweCAxMnB4IDAgMTJweFwiXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhaXNEZWxldGVkICYmXG4gICAgICBub3RMZWZ0QWxpZ25lZCAmJlxuICAgICAgaXNUZXh0TWVzc2FnZSAmJlxuICAgICAgIWlzVXNlclNlbnRNZXNzYWdlICYmXG4gICAgICAhaXNHcm91cE1lbWJlck1lc3NhZ2VcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGJ1YmJsZVBhZGRpbmc6IFwiOHB4IDEycHggMnB4IDEycHhcIlxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGlzR3JvdXBNZW1iZXJNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmICghbm90TGVmdEFsaWduZWQgJiYgaXNUZXh0TWVzc2FnZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGJ1YmJsZVBhZGRpbmc6IFwiOHB4IDEycHhcIlxuICAgIH07XG4gIH07XG4gIC8qXG4qIGlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIGZvciB0aGlzIGxpc3QgYW5kIGlzIG5vdCBwYXJ0IG9mIHRocmVhZCBldmVuIGZvciBjdXJyZW50IGxpc3RcbiAgaXQgb25seSBydW5zIGZvciBVSSBldmVudCBiZWNhdXNlIGl0IGFzc3VtZXMgbG9nZ2VkIGluIHVzZXIgaXMgYWx3YXlzIHNlbmRlclxuKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuKi9cbiAgaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBtZXNzYWdlPy5nZXRSZWNlaXZlclR5cGUoKTtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmIHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIGlmIChyZWNlaXZlclR5cGUgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiYgcmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgIH1cbiAgICB9XG5cbiAgLypcbiAgICAqIGlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudDogVG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgYmVsb25ncyBmb3IgdGhpcyBsaXN0IGFuZCBpcyBub3QgcGFydCBvZiB0aHJlYWQgZXZlbiBmb3IgY3VycmVudCBsaXN0XG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFNESyBldmVudCBiZWNhdXNlIGl0IG5lZWRzIHNlbmRlcklkIHRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIHNhbWUgdXNlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50ID1cbiAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCByZWNlaXZlcklkID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpO1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJUeXBlKCk7XG4gICAgICBjb25zdCBzZW5kZXJJZCA9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKTtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkgfHwgc2VuZGVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJiAocmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgfVxuICAgIH1cblxuICAvKlxuICAgICogaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudDogVG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgYmVsb25ncyB0aHJlYWQgb2YgdGhpcyBsaXN0LFxuICAgICAgaXQgb25seSBydW5zIGZvciBVSSBldmVudCBiZWNhdXNlIGl0IGFzc3VtZXMgbG9nZ2VkIGluIHVzZXIgaXMgYWx3YXlzIHNlbmRlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKCFtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZWNlaXZlcklkID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpO1xuXG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgLypcbiAgICAqIGlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIHRocmVhZCBvZiB0aGlzIGxpc3QsXG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFNESyBldmVudCBiZWNhdXNlIGl0IG5lZWRzIHNlbmRlcklkIHRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIHNhbWUgdXNlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGlmICghbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCBzZW5kZXJJZCA9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKTtcblxuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICBpZiAocmVjZWl2ZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpIHx8IHNlbmRlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIHNldEZpbGVCdWJibGVTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBhbnkge1xuICAgIHZhciBpc0ZpbGVNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlO1xuICAgIGlmIChpc0ZpbGVNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgICAgc3VidGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgdGhpcy5pb0JvdHRvbSgpO1xuICAgIHRoaXMuaW9Ub3AoKTtcbiAgICB0aGlzLmNoZWNrTWVzc2FnZVRlbXBsYXRlKCk7XG4gIH1cblxuICBnZXRTdGFydENhbGxGdW5jdGlvbihtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSk6IChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdm9pZCB7XG4gICAgbGV0IHNlc3Npb25JZCA9IHRoaXMuZ2V0U2Vzc2lvbklkKG1lc3NhZ2UpXG4gICAgbGV0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3MuZ2V0KHNlc3Npb25JZCk7XG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2sgPSAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHRoaXMuc3RhcnREaXJlY3RDYWxsKHNlc3Npb25JZCwgbWVzc2FnZSk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5zZXQoc2Vzc2lvbklkLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIHJldHVybiBjYWxsYmFjaztcbiAgfVxuICBzdGFydERpcmVjdENhbGwgPSAoc2Vzc2lvbklkOiBzdHJpbmcsIG1lc3NhZ2U6IGFueSkgPT4ge1xuICAgIHRoaXMuc2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gdHJ1ZTtcbiAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBtZXNzYWdlKVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgbGF1bmNoQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmREb2N1bWVudCA9ICh1cmw6IHN0cmluZykgPT4ge1xuICAgIHdpbmRvdy5vcGVuKFxuICAgICAgdXJsICsgYCZ1c2VybmFtZT0ke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9YCxcbiAgICAgIFwiXCIsXG4gICAgICBcImZ1bGxzY3JlZW49eWVzLCBzY3JvbGxiYXJzPWF1dG9cIlxuICAgICk7XG4gIH07XG4gIC8qKlxuICAgKiBFeHRyYWN0aW5nICB0eXBlcyBhbmQgY2F0ZWdvcmllcyBmcm9tIHRlbXBsYXRlXG4gICAqXG4gICAqL1xuICBjaGVja01lc3NhZ2VUZW1wbGF0ZSgpIHtcbiAgICB0aGlzLnR5cGVzTWFwID0ge1xuICAgICAgdGV4dDogdGhpcy50ZXh0QnViYmxlLFxuICAgICAgZmlsZTogdGhpcy5maWxlQnViYmxlLFxuICAgICAgYXVkaW86IHRoaXMuYXVkaW9CdWJibGUsXG4gICAgICB2aWRlbzogdGhpcy52aWRlb0J1YmJsZSxcbiAgICAgIGltYWdlOiB0aGlzLmltYWdlQnViYmxlLFxuICAgICAgZ3JvdXBNZW1iZXI6IHRoaXMudGV4dEJ1YmJsZSxcbiAgICAgIGV4dGVuc2lvbl9zdGlja2VyOiB0aGlzLnN0aWNrZXJCdWJibGUsXG4gICAgICBleHRlbnNpb25fd2hpdGVib2FyZDogdGhpcy53aGl0ZWJvYXJkQnViYmxlLFxuICAgICAgZXh0ZW5zaW9uX2RvY3VtZW50OiB0aGlzLmRvY3VtZW50QnViYmxlLFxuICAgICAgZXh0ZW5zaW9uX3BvbGw6IHRoaXMucG9sbEJ1YmJsZSxcbiAgICAgIG1lZXRpbmc6IHRoaXMuZGlyZWN0Q2FsbGluZyxcbiAgICAgIHNjaGVkdWxlcjogdGhpcy5zY2hlZHVsZXJCdWJibGUsXG4gICAgICBmb3JtOiB0aGlzLmZvcm1CdWJibGUsXG4gICAgICBjYXJkOiB0aGlzLmNhcmRCdWJibGUsXG4gICAgfTtcbiAgICB0aGlzLnNldEJ1YmJsZVZpZXcoKTtcbiAgfVxuICBnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSwgdHlwZT86IHN0cmluZykge1xuICAgIGxldCBkYXRhOiBhbnkgPSBtZXNzYWdlLmdldEN1c3RvbURhdGEoKTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgcmV0dXJuIGRhdGFbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIH1cbiAgfVxuICBnZXRUaHJlYWRDb3VudChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB2YXIgcmVwbHlDb3VudCA9IG1lc3NhZ2U/LmdldFJlcGx5Q291bnQoKSB8fCAwO1xuICAgIHZhciBzdWZmaXggPSByZXBseUNvdW50ID09PSAxID8gbG9jYWxpemUoXCJSRVBMWVwiKSA6IGxvY2FsaXplKFwiUkVQTElFU1wiKTtcbiAgICByZXR1cm4gYCR7cmVwbHlDb3VudH0gJHtzdWZmaXh9YDtcbiAgfVxuICBzaG93RW5hYmxlZEV4dGVuc2lvbnMoKSB7XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJ0ZXh0bW9kZXJhdG9yXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZURhdGFNYXNraW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJ0aHVtYm5haWxnZW5lcmF0aW9uXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVRodW1ibmFpbEdlbmVyYXRpb24gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImxpbmtwcmV2aWV3XCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUxpbmtQcmV2aWV3ID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJwb2xsc1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVQb2xscyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwicmVhY3Rpb25zXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVJlYWN0aW9ucyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiaW1hZ2Vtb2RlcmF0aW9uXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUltYWdlTW9kZXJhdGlvbiA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwic3RpY2tlcnNcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlU3RpY2tlcnMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImNvbGxhYm9yYXRpdmV3aGl0ZWJvYXJkXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVdoaXRlYm9hcmQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImNvbGxhYm9yYXRpdmVkb2N1bWVudFwiKSkge1xuICAgICAgdGhpcy5lbmFibGVEb2N1bWVudCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiY2FsbGluZ1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVDYWxsaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJhaWNvbnZlcnNhdGlvbnN0YXJ0ZXJcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiYWljb252ZXJzYXRpb25zdW1tYXJ5XCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnkgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgb3BlbkNvbmZpcm1EaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIG9wZW5GdWxsc2NyZWVuVmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgaW1hZ2V1cmxUb09wZW46IHN0cmluZyA9IFwiXCI7XG4gIGZ1bGxTY3JlZW5WaWV3ZXJTdHlsZTogRnVsbFNjcmVlblZpZXdlclN0eWxlID0ge1xuICAgIGNsb3NlSWNvblRpbnQ6IFwiYmx1ZVwiLFxuICB9O1xuICBvcGVuSW1hZ2VJbkZ1bGxTY3JlZW4obWVzc2FnZTogYW55KSB7XG4gICAgdGhpcy5pbWFnZXVybFRvT3BlbiA9IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmw7XG4gICAgdGhpcy5vcGVuRnVsbHNjcmVlblZpZXcgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBjbG9zZUltYWdlSW5GdWxsU2NyZWVuKCkge1xuICAgIHRoaXMuaW1hZ2V1cmxUb09wZW4gPSBcIlwiO1xuICAgIHRoaXMub3BlbkZ1bGxzY3JlZW5WaWV3ID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIG9wZW5XYXJuaW5nRGlhbG9nKGV2ZW50OiBhbnkpIHtcbiAgICB0aGlzLmNsb3NlSW1hZ2VNb2RlcmF0aW9uID0gZXZlbnQ/LmRldGFpbD8ub25Db25maXJtO1xuICAgIHRoaXMub3BlbkNvbmZpcm1EaWFsb2cgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBvbkNvbmZpcm1DbGljayA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5Db25maXJtRGlhbG9nID0gZmFsc2U7XG4gICAgaWYgKHRoaXMuY2xvc2VJbWFnZU1vZGVyYXRpb24pIHtcbiAgICAgIHRoaXMuY2xvc2VJbWFnZU1vZGVyYXRpb24oKTtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvbkNhbmNlbENsaWNrKCkge1xuICAgIHRoaXMub3BlbkNvbmZpcm1EaWFsb2cgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgZ2V0VGV4dE1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogc3RyaW5nIHtcbiAgICB2YXIgdGV4dCA9IHRoaXMuZW5hYmxlRGF0YU1hc2tpbmdcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldEV4dGVuc2lvbkRhdGEobWVzc2FnZSlcbiAgICAgIDogbnVsbDtcbiAgICByZXR1cm4gdGV4dD8udHJpbSgpPy5sZW5ndGggPiAwID8gdGV4dCA6IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICB9XG4gIGdldExpbmtQcmV2aWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChtZXNzYWdlPy5nZXRNZXRhZGF0YSgpICYmIHRoaXMuZW5hYmxlTGlua1ByZXZpZXcpIHtcbiAgICAgICAgdmFyIG1ldGFkYXRhOiBhbnkgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgICAgIHZhciBpbmplY3RlZE9iamVjdCA9IG1ldGFkYXRhW0xpbmtQcmV2aWV3Q29uc3RhbnRzLmluamVjdGVkXTtcbiAgICAgICAgaWYgKGluamVjdGVkT2JqZWN0ICYmIGluamVjdGVkT2JqZWN0Py5leHRlbnNpb25zKSB7XG4gICAgICAgICAgdmFyIGV4dGVuc2lvbnNPYmplY3QgPSBpbmplY3RlZE9iamVjdC5leHRlbnNpb25zO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3QgJiZcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgICAgICBleHRlbnNpb25zT2JqZWN0LFxuICAgICAgICAgICAgICBMaW5rUHJldmlld0NvbnN0YW50cy5saW5rX3ByZXZpZXdcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHZhciBsaW5rUHJldmlld09iamVjdCA9XG4gICAgICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3RbTGlua1ByZXZpZXdDb25zdGFudHMubGlua19wcmV2aWV3XTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgbGlua1ByZXZpZXdPYmplY3QgJiZcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgICAgICAgbGlua1ByZXZpZXdPYmplY3QsXG4gICAgICAgICAgICAgICAgTGlua1ByZXZpZXdDb25zdGFudHMubGlua3NcbiAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICBsaW5rUHJldmlld09iamVjdFtMaW5rUHJldmlld0NvbnN0YW50cy5saW5rc10ubGVuZ3RoXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGxpbmtQcmV2aWV3T2JqZWN0W0xpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtzXVswXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBnZXRJbWFnZVRodW1ibmFpbChtc2c6IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIHZhciBtZXNzYWdlOiBhbnkgPSBtc2cgYXMgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZTtcbiAgICBsZXQgaW1hZ2VVUkwgPSBcIlwiO1xuICAgIGlmICh0aGlzLmVuYWJsZVRodW1ibmFpbEdlbmVyYXRpb24pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBtZXRhZGF0YTogYW55ID0gbWVzc2FnZS5nZXRNZXRhZGF0YSgpO1xuICAgICAgICB2YXIgaW5qZWN0ZWRPYmplY3QgPSBtZXRhZGF0YT8uW1xuICAgICAgICAgIFRodW1ibmFpbEdlbmVyYXRpb25Db25zdGFudHMuaW5qZWN0ZWRcbiAgICAgICAgXSBhcyB7IGV4dGVuc2lvbnM/OiBhbnkgfTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbnNPYmplY3QgPSBpbmplY3RlZE9iamVjdD8uZXh0ZW5zaW9ucztcbiAgICAgICAgdmFyIHRodW1ibmFpbEdlbmVyYXRpb25PYmplY3QgPVxuICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3RbVGh1bWJuYWlsR2VuZXJhdGlvbkNvbnN0YW50cy50aHVtYm5haWxfZ2VuZXJhdGlvbl07XG4gICAgICAgIHZhciBpbWFnZVRvRG93bmxvYWQgPSB0aHVtYm5haWxHZW5lcmF0aW9uT2JqZWN0Py51cmxfc21hbGw7XG4gICAgICAgIGlmIChpbWFnZVRvRG93bmxvYWQpIHtcbiAgICAgICAgICBpbWFnZVVSTCA9IGltYWdlVG9Eb3dubG9hZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbWFnZVVSTCA9IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzXG4gICAgICAgICAgICA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmxcbiAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGltYWdlVVJMID0gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNcbiAgICAgICAgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsXG4gICAgICAgIDogXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGltYWdlVVJMO1xuICB9XG4gIGdldExpbmtQcmV2aWV3RGV0YWlscyhrZXk6IHN0cmluZywgbWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogc3RyaW5nIHtcbiAgICBsZXQgbGlua1ByZXZpZXdPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TGlua1ByZXZpZXcobWVzc2FnZSk7XG4gICAgaWYgKE9iamVjdC5rZXlzKGxpbmtQcmV2aWV3T2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gbGlua1ByZXZpZXdPYmplY3Rba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIHRoaXMuc2V0TWVzc2FnZXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmFkZE1lc3NhZ2VFdmVudExpc3RlbmVycygpO1xuICAgIHRoaXMuc2V0T25nb2luZ0NhbGxTdHlsZSgpO1xuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHRoaXMuZGF0ZVNlcGFyYXRvclN0eWxlLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUuYmFja2dyb3VuZCB8fFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKTtcbiAgICB0aGlzLmRpdmlkZXJTdHlsZS5iYWNrZ3JvdW5kID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCk7XG4gIH1cbiAgc2V0T25nb2luZ0NhbGxTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG4gICAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcbiAgICAgIG1pbkhlaWdodDogXCI0MDBweFwiLFxuICAgICAgbWluV2lkdGg6IFwiNDAwcHhcIixcbiAgICAgIG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBtYXhpbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH0pO1xuICAgIHRoaXMub25nb2luZ0NhbGxTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLm9uZ29pbmdDYWxsU3R5bGUgfTtcbiAgfTtcbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICAgIGhlaWdodDogXCIyOHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0RGF0ZVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHBhZGRpbmc6IFwiNnB4IDEycHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTZXBhcmF0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTZXBhcmF0b3JTdHlsZSB9O1xuICB9XG4gIHNldE1lc3NhZ2VzU3R5bGUoKSB7XG4gICAgdGhpcy5wb3BvdmVyU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMzMwcHhcIixcbiAgICAgIHdpZHRoOiBcIjMyNXB4XCIsXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJveFNoYWRvdzogYCR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX0gMHB4IDBweCA4cHhgXG4gICAgfVxuICAgIGxldCBkZWZhdWx0RW1vamlTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIzMzBweFwiLFxuICAgICAgd2lkdGg6IFwiMzI1cHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIC4uLnRoaXMuZW1vamlLZXlib2FyZFN0eWxlXG4gICAgfVxuICAgIHRoaXMuZW1vamlLZXlib2FyZFN0eWxlID0gZGVmYXVsdEVtb2ppU3R5bGU7XG4gICAgdGhpcy51bnJlYWRNZXNzYWdlc1N0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgfTtcbiAgICB0aGlzLnNtYXJ0UmVwbHlTdHlsZSA9IHtcbiAgICAgIHJlcGx5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZXBseVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHJlcGx5QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3hTaGFkb3c6IGAwcHggMHB4IDFweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCl9YCxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIC4uLnRoaXMuc21hcnRSZXBseVN0eWxlLFxuICAgIH07XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3R5bGUgPSB7XG4gICAgICByZXBseVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVwbHlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICByZXBseUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm94U2hhZG93OiBgMHB4IDBweCAxcHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpfWAsXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICAuLi50aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdHlsZSxcbiAgICB9O1xuXG4gICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3R5bGUgPSB7XG4gICAgICAuLi50aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3hTaGFkb3c6IGAwcHggMHB4IDFweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCl9YCxcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSEsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCkhLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIGJvcmRlcjogXCIxcHggc29saWQgIzY4NTFENlwiLFxuICAgIH07XG5cbiAgICB0aGlzLmZ1bGxTY3JlZW5WaWV3ZXJTdHlsZS5jbG9zZUljb25UaW50ID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpO1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IE1lc3NhZ2VMaXN0U3R5bGUgPSBuZXcgTWVzc2FnZUxpc3RTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGhyZWFkUmVwbHlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRocmVhZFJlcGx5SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICB0aHJlYWRSZXBseVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRocmVhZFJlcGx5VW5yZWFkQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB0aHJlYWRSZXBseVVucmVhZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHRocmVhZFJlcGx5VW5yZWFkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICBUaW1lc3RhbXBUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uM1xuICAgICAgKSxcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5tZXNzYWdlTGlzdFN0eWxlIH07XG4gICAgdGhpcy5saW5rUHJldmlld1N0eWxlID0gbmV3IExpbmtQcmV2aWV3U3R5bGUoe1xuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBkZXNjcmlwdGlvbkNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVzY3JpcHRpb25Gb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgfSk7XG4gICAgdGhpcy5kb2N1bWVudEJ1YmJsZVN0eWxlID0ge1xuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBidXR0b25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICB9O1xuICAgIHRoaXMucG9sbEJ1YmJsZVN0eWxlID0ge1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdm90ZVBlcmNlbnRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB2b3RlUGVyY2VudFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBvbGxRdWVzdGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHBvbGxRdWVzdGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHBvbGxPcHRpb25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHBvbGxPcHRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBwb2xsT3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG9wdGlvbnNJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRvdGFsVm90ZUNvdW50VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdG90YWxWb3RlQ291bnRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzZWxlY3RlZFBvbGxPcHRpb25CYWNrZ3JvdW5kOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgdXNlclNlbGVjdGVkT3B0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBwb2xsT3B0aW9uQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgcG9sbE9wdGlvbkJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9O1xuICAgIHRoaXMuaW1hZ2VNb2RlcmF0aW9uU3R5bGUgPSB7XG4gICAgICBmaWx0ZXJDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHdhcm5pbmdUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIHdhcm5pbmdUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLmNvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJkYXJrXCIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBtZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH07XG4gIH1cbiAgZ2V0UmVjZWlwdFN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IGlzVGV4dE1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCAmJlxuICAgICAgdGhpcy5hbGlnbm1lbnQgIT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB0aGlzLnJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IGlzVGV4dE1lc3NhZ2VcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjExcHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pO1xuICAgIHJldHVybiB7IC4uLnRoaXMucmVjZWlwdFN0eWxlIH07XG4gIH1cbiAgY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKSB7XG4gICAgaWYgKCF0aGlzLnRlbXBsYXRlcyB8fCB0aGlzLnRlbXBsYXRlcz8ubGVuZ3RoID09IDApIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlID1cbiAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZVRlbXBsYXRlcygpO1xuICAgICAgdGhpcy5jYXRlZ29yaWVzID1cbiAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZUNhdGVnb3JpZXMoKTtcbiAgICAgIHRoaXMudHlwZXMgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxNZXNzYWdlVHlwZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlcztcbiAgICB9XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBudWxsO1xuICAgIGlmICh0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCkge1xuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpLmJ1aWxkKClcbiAgICAgICAgICA6IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgICAuc2V0VUlEKHRoaXMudXNlci5nZXRVaWQoKSlcbiAgICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgICAuc2V0Q2F0ZWdvcmllcyh0aGlzLmNhdGVnb3JpZXMpXG4gICAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgICAgIC5idWlsZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgID8gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS5idWlsZCgpXG4gICAgICAgICAgOiBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgICAgLnNldEdVSUQodGhpcy5ncm91cC5nZXRHdWlkKCkpXG4gICAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgICAgLmhpZGVSZXBsaWVzKHRydWUpXG4gICAgICAgICAgICAuc2V0Q2F0ZWdvcmllcyh0aGlzLmNhdGVnb3JpZXMpXG4gICAgICAgICAgICAuYnVpbGQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY29tcHV0ZVVucmVhZENvdW50KCk7XG4gICAgICB0aGlzLmZldGNoUHJldmlvdXNNZXNzYWdlcygpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXB1dGVVbnJlYWRDb3VudCgpIHtcbiAgICBpZiAodGhpcy51c2VyIHx8IHRoaXMuZ3JvdXApIHtcbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgQ29tZXRDaGF0LmdldFVucmVhZE1lc3NhZ2VDb3VudEZvclVzZXIodGhpcy51c2VyPy5nZXRVaWQoKSkudGhlbihcbiAgICAgICAgICAocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkeW5hbWljS2V5ID0gdGhpcy51c2VyPy5nZXRVaWQoKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA9IHJlc1tkeW5hbWljS2V5IGFzIGtleW9mIHR5cGVvZiByZXNdO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yKSA9PiB7IH1cbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRVbnJlYWRNZXNzYWdlQ291bnRGb3JHcm91cCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLnRoZW4oXG4gICAgICAgICAgKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZHluYW1pY0tleSA9IHRoaXMuZ3JvdXA/LmdldEd1aWQoKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA9IHJlc1tkeW5hbWljS2V5IGFzIGtleW9mIHR5cGVvZiByZXNdO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yKSA9PiB7IH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIExpc3RlbmVyIFRvIFJlY2VpdmUgTWVzc2FnZXMgaW4gUmVhbCBUaW1lXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgZmV0Y2hQcmV2aW91c01lc3NhZ2VzID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnJlaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlclxuICAgICAgICAgID8gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgICAuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpXG4gICAgICAgICAgICAuc2V0TWVzc2FnZUlkKHRoaXMubWVzc2FnZXNMaXN0WzBdLmdldElkKCkpXG4gICAgICAgICAgICAuYnVpbGQoKVxuICAgICAgICAgIDogdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgICAuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpXG4gICAgICAgICAgICAuc2V0TWVzc2FnZUlkKHRoaXMubWVzc2FnZXNMaXN0WzBdLmdldElkKCkpXG4gICAgICAgICAgICAuYnVpbGQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgIC5zZXRNZXNzYWdlSWQodGhpcy5tZXNzYWdlc0xpc3RbMF0uZ2V0SWQoKSlcbiAgICAgICAgICAuc2V0Q2F0ZWdvcmllcyh0aGlzLmNhdGVnb3JpZXMpXG4gICAgICAgICAgLmhpZGVSZXBsaWVzKHRydWUpXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKS5idWlsZCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS5idWlsZCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXJcbiAgICAgIC5mZXRjaFByZXZpb3VzKClcbiAgICAgIC50aGVuKFxuICAgICAgICAobWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdKSA9PiB7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2VMaXN0ID0gbWVzc2FnZUxpc3QubWFwKFxuICAgICAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMuY29udmVydEludGVyYWN0aXZlTWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuSW50ZXJhY3RpdmVNZXNzYWdlXG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgICAvLyBObyBNZXNzYWdlcyBGb3VuZFxuICAgICAgICAgIGlmIChtZXNzYWdlTGlzdC5sZW5ndGggPT09IDAgJiYgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgaWYgKCF0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJiB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXIpIHtcbiAgICAgICAgICAgICAgdGhpcy5mZXRjaENvbnZlcnNhdGlvblN0YXJ0ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGhpcy5nZXRVbnJlYWRDb3VudCA+PSB0aGlzLnVucmVhZE1lc3NhZ2VUaHJlc2hvbGQgJiZcbiAgICAgICAgICAgICAgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5mZXRjaENvbnZlcnNhdGlvblN1bW1hcnkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5sYXN0TWVzc2FnZUlkID0gTnVtYmVyKFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdLmdldElkKClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgbGV0IGlzU2VudEJ5TWU6IGJvb2xlYW4gPSBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpID09XG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAhaXNTZW50QnlNZSAmJlxuICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIC8vbWFyayB0aGUgbWVzc2FnZSBhcyBkZWxpdmVyZWRcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc0RlbGl2ZXJlZChsYXN0TWVzc2FnZSkudGhlbihcbiAgICAgICAgICAgICAgICAgIChyZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT0gTnVtYmVyKHJlY2VpcHQ/LmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWxhc3RNZXNzYWdlPy5nZXRSZWFkQXQoKSAmJiAhaXNTZW50QnlNZSkge1xuICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChsYXN0TWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgIC50aGVuKChyZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT0gTnVtYmVyKHJlY2VpcHQ/LmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAvL2lmIHRoZSBzZW5kZXIgb2YgdGhlIG1lc3NhZ2UgaXMgbm90IHRoZSBsb2dnZWRpbiB1c2VyLCBtYXJrIGl0IGFzIHJlYWQuXG4gICAgICAgICAgICBsZXQgcHJldlNjcm9sbEhlaWdodCA9IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5saXN0U2Nyb2xsLm5hdGl2ZUVsZW1lbnQuc2Nyb2xsVG9wID1cbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gcHJldlNjcm9sbEhlaWdodDtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucHJlcGVuZE1lc3NhZ2VzKG1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLmF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcigpO1xuICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5tZXNzYWdlc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9O1xuICBmZXRjaEFjdGlvbk1lc3NhZ2VzKCkge1xuICAgIGxldCByZXF1ZXN0QnVpbGRlcjogQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgLnNldFR5cGUoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UpXG4gICAgICAuc2V0Q2F0ZWdvcnkoQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbilcbiAgICAgIC5zZXRNZXNzYWdlSWQodGhpcy5sYXN0TWVzc2FnZUlkKVxuICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgcmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgcmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpO1xuICAgIH1cbiAgICByZXF1ZXN0QnVpbGRlci5idWlsZCgpXG4gICAgICAuZmV0Y2hOZXh0KClcbiAgICAgIC50aGVuKChtZXNzYWdlcykgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZXMgJiYgbWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIG1lc3NhZ2VzLmZvckVhY2goKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAobWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uKS5nZXRBY3Rpb25PbigpIGluc3RhbmNlb2ZcbiAgICAgICAgICAgICAgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgKG0pID0+XG4gICAgICAgICAgICAgICAgICBtLmdldElkKCkgPT09XG4gICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5BY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgKS5nZXRBY3Rpb25PbigpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAgICAgICAgICAgICAgICAgKS5nZXRJZCgpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID49IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XSA9IChcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkFjdGlvblxuICAgICAgICAgICAgICAgICkuZ2V0QWN0aW9uT24oKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5tZXNzYWdlc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG4gIGZldGNoTmV4dE1lc3NhZ2UgPSAoKSA9PiB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoIC0gMTtcbiAgICBsZXQgbWVzc2FnZUlkOiBudW1iZXI7XG4gICAgaWYgKFxuICAgICAgdGhpcy5yZWluaXRpYWxpemVkIHx8XG4gICAgICAodGhpcy5sYXN0TWVzc2FnZUlkID4gMCAmJiB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQpXG4gICAgKSB7XG4gICAgICBpZiAodGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkKSB7XG4gICAgICAgIHRoaXMuZmV0Y2hBY3Rpb25NZXNzYWdlcygpO1xuICAgICAgICBtZXNzYWdlSWQgPSB0aGlzLmxhc3RNZXNzYWdlSWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlSWQgPSB0aGlzLm1lc3NhZ2VzTGlzdFtpbmRleF0uZ2V0SWQoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlclxuICAgICAgICAgID8gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgICAuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpXG4gICAgICAgICAgICAuc2V0TWVzc2FnZUlkKG1lc3NhZ2VJZClcbiAgICAgICAgICAgIC5idWlsZCgpXG4gICAgICAgICAgOiB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICAgIC5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSlcbiAgICAgICAgICAgIC5zZXRNZXNzYWdlSWQobWVzc2FnZUlkKVxuICAgICAgICAgICAgLmJ1aWxkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgICAuc2V0VHlwZXModGhpcy50eXBlcylcbiAgICAgICAgICAuc2V0TWVzc2FnZUlkKG1lc3NhZ2VJZClcbiAgICAgICAgICAuc2V0Q2F0ZWdvcmllcyh0aGlzLmNhdGVnb3JpZXMpXG4gICAgICAgICAgLmhpZGVSZXBsaWVzKHRydWUpXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKS5idWlsZCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS5idWlsZCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyXG4gICAgICAgIC5mZXRjaE5leHQoKVxuICAgICAgICAudGhlbihcbiAgICAgICAgICAobWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdKSA9PiB7XG4gICAgICAgICAgICBpZiAobWVzc2FnZUxpc3QgJiYgbWVzc2FnZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBtZXNzYWdlTGlzdCA9IG1lc3NhZ2VMaXN0Lm1hcChcbiAgICAgICAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLmNvbnZlcnRJbnRlcmFjdGl2ZU1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuSW50ZXJhY3RpdmVNZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgICAgICAgICAvLyBObyBNZXNzYWdlcyBGb3VuZFxuICAgICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0Lmxlbmd0aCA9PT0gMCAmJiB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobWVzc2FnZUxpc3QgJiYgbWVzc2FnZUxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzT25Cb3R0b20pIHtcbiAgICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXS5nZXRJZCgpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgIWxhc3RNZXNzYWdlPy5nZXRSZWFkQXQoKSAmJlxuICAgICAgICAgICAgICAgICAgbGFzdE1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9XG4gICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChsYXN0TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgIWxhc3RNZXNzYWdlPy5nZXREZWxpdmVyZWRBdCgpICYmXG4gICAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzRGVsaXZlcmVkKG1lc3NhZ2VMaXN0Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2VzKG1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0TWVzc2FnZUlkID0gTnVtYmVyKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV0uZ2V0SWQoKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGxldCBjb3VudFRleHQgPSBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKTtcbiAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICE9IFwiXCJcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjb3VudFRleHQgPSB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0O1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50Lmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICAgICAgICAgID8gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQucHVzaCguLi5tZXNzYWdlTGlzdCk7XG4gICAgICAgICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VDb3VudCA9XG4gICAgICAgICAgICAgICAgICAgIFwiIOKGkyBcIiArIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICFsYXN0TWVzc2FnZT8uZ2V0RGVsaXZlcmVkQXQoKSAmJlxuICAgICAgICAgICAgICAgICAgbGFzdE1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9XG4gICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChsYXN0TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlTGlzdC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRNZXNzYWdlcyhtZXNzYWdlTGlzdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgYXBwZW5kTWVzc2FnZXMgPSAobWVzc2FnZXM6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdKSA9PiB7XG4gICAgdGhpcy5tZXNzYWdlc0xpc3QucHVzaCguLi5tZXNzYWdlcyk7XG4gICAgdGhpcy5tZXNzYWdlQ291bnQgPSB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGg7XG4gICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgdGhpcy5rZWVwUmVjZW50TWVzc2FnZXMgPSB0cnVlO1xuICAgICAgdGhpcy5yZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlcigpO1xuICAgIH1cbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0TWVzc2FnZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IGNvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ncm91cExpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIG5ld1Njb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICAgIGNoYW5nZWRHcm91cDogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0UsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGNoYW5nZWRHcm91cCxcbiAgICAgICAgICAgICAgeyB1c2VyOiBjaGFuZ2VkVXNlciwgc2NvcGU6IG5ld1Njb3BlIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBraWNrZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBraWNrZWRGcm9tOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAga2lja2VkRnJvbSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZXI6IGtpY2tlZFVzZXIsXG4gICAgICAgICAgICAgICAgaGFzSm9pbmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICBiYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGJhbm5lZEZyb206IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBiYW5uZWRGcm9tLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogYmFubmVkVXNlcixcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJVbmJhbm5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1bmJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVuYmFubmVkRnJvbTogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5VTkJBTk5FRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgdW5iYW5uZWRGcm9tLFxuICAgICAgICAgICAgICB7IHVzZXI6IHVuYmFubmVkVXNlciB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICB1c2VyQWRkZWQ6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdXNlckFkZGVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdXNlckFkZGVkSW46IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIHVzZXJBZGRlZEluLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogdXNlckFkZGVkLFxuICAgICAgICAgICAgICAgIGhhc0pvaW5lZDogdHJ1ZSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgICAgICAgICBsZWF2aW5nVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgICAgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZULFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBncm91cCxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZXI6IGxlYXZpbmdVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgICAgICAgICAgam9pbmVkVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgICAgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5KT0lORUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGpvaW5lZEdyb3VwLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogam9pbmVkVXNlcixcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLmVuYWJsZUNhbGxpbmcpIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZENhbGxMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNhbGxMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uSW5jb21pbmdDYWxsUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkluY29taW5nQ2FsbENhbmNlbGxlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uT3V0Z29pbmdDYWxsUmVqZWN0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbk91dGdvaW5nQ2FsbEFjY2VwdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVhY3Rpb25zKSB7XG4gICAgICAgIHRoaXMub25NZXNzYWdlUmVhY3Rpb25BZGRlZCA9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VSZWFjdGlvbkFkZGVkLnN1YnNjcmliZShcbiAgICAgICAgICAgIChyZWFjdGlvblJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fQURERUQsXG4gICAgICAgICAgICAgICAgcmVhY3Rpb25SZWNlaXB0XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQgPVxuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlUmVhY3Rpb25SZW1vdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAgIChyZWFjdGlvblJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFRCxcbiAgICAgICAgICAgICAgICByZWFjdGlvblJlY2VpcHRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IEZvcm1NZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IENhcmRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzRGVsaXZlcmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVJlY2VpcHRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWQuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBRCxcbiAgICAgICAgICAgIG1lc3NhZ2VSZWNlaXB0XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChkZWxldGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgZGVsZXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChlZGl0ZWRNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIGVkaXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICh0cmFuc2llbnRNZXNzYWdlOiBDb21ldENoYXQuVHJhbnNpZW50TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGxpdmVSZWFjdGlvbjogYW55ID0gdHJhbnNpZW50TWVzc2FnZS5nZXREYXRhKCk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgICAgICAgIHRoaXMudXNlciAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLnVzZXIuZ2V0VWlkKCkgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInR5cGVcIl0gPT0gXCJsaXZlX3JlYWN0aW9uXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTGl2ZVJlYWN0aW9uLm5leHQoXG4gICAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1wicmVhY3Rpb25cIl1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgICAgICAgIHRoaXMuZ3JvdXAgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT0gdGhpcy5ncm91cC5nZXRHdWlkKCkgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInR5cGVcIl0gPT0gXCJsaXZlX3JlYWN0aW9uXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTGl2ZVJlYWN0aW9uLm5leHQoXG4gICAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1wicmVhY3Rpb25cIl1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25JbnRlcmFjdGlvbkdvYWxDb21wbGV0ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uSW50ZXJhY3Rpb25Hb2FsQ29tcGxldGVkLnN1YnNjcmliZShcbiAgICAgICAgICAocmVjZWlwdDogQ29tZXRDaGF0LkludGVyYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElPTl9HT0FMX0NPTVBMRVRFRCxcbiAgICAgICAgICAgICAgcmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBVcGRhdGVzIG1lc3NhZ2VMaXN0IG9uIGJhc2lzIG9mIHVzZXIgYWN0aXZpdHkgb3IgZ3JvdXAgYWN0aXZpdHkgb3IgY2FsbGluZyBhY3Rpdml0eVxuICAgKiBAcGFyYW0gIHthbnk9bnVsbH0ga2V5XG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXAgfCBudWxsPW51bGx9IGdyb3VwXG4gICAqIEBwYXJhbSAge2FueT1udWxsfSBvcHRpb25zXG4gICAqL1xuICBtZXNzYWdlVXBkYXRlKFxuICAgIGtleTogc3RyaW5nIHwgbnVsbCA9IG51bGwsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0IHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgYW55ID0gbnVsbCxcbiAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgb3B0aW9uczogYW55ID0gbnVsbFxuICApIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW107XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVjZWl2ZWQobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxJVkVSRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFEOlxuXG4gICAgICAgICAgdGhpcy5tZXNzYWdlUmVhZEFuZERlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9FRElURUQ6IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VFZGl0ZWQobWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0U6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5VTkJBTk5FRDoge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1lc3NhZ2VSZWNlaXZlZChtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElPTl9HT0FMX0NPTVBMRVRFRDpcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlSW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fQURERUQ6XG4gICAgICAgICAgdGhpcy5vblJlYWN0aW9uVXBkYXRlZChtZXNzYWdlLCB0cnVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUNUSU9OX1JFTU9WRUQ6XG4gICAgICAgICAgdGhpcy5vblJlYWN0aW9uVXBkYXRlZChtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyBhIG1lc3NhZ2UncyByZWFjdGlvbnMgYmFzZWQgb24gYSBuZXcgcmVhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlJlYWN0aW9uRXZlbnR9IG1lc3NhZ2UgLSBUaGUgbmV3IG1lc3NhZ2UgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNBZGRlZCAtIFRydWUgaWYgdGhlIHJlYWN0aW9uIHdhcyBhZGRlZCwgZmFsc2UgaWYgaXQgd2FzIHJlbW92ZWQuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGZhbHNlIGlmIHRoZSBtZXNzYWdlIHdhcyBub3QgZm91bmQsIHRydWUgb3RoZXJ3aXNlLlxuICAgKi9cblxuICBvblJlYWN0aW9uVXBkYXRlZChtZXNzYWdlOiBDb21ldENoYXQuUmVhY3Rpb25FdmVudCwgaXNBZGRlZDogYm9vbGVhbikge1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IG1lc3NhZ2UuZ2V0UmVhY3Rpb24oKT8uZ2V0TWVzc2FnZUlkKCk7XG4gICAgY29uc3QgbWVzc2FnZU9iamVjdCA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQobWVzc2FnZUlkKTtcblxuICAgIGlmICghbWVzc2FnZU9iamVjdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBhY3Rpb246IENvbWV0Q2hhdC5SRUFDVElPTl9BQ1RJT047XG4gICAgaWYgKGlzQWRkZWQpIHtcbiAgICAgIGFjdGlvbiA9IENvbWV0Q2hhdC5SRUFDVElPTl9BQ1RJT04uUkVBQ1RJT05fQURERUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFjdGlvbiA9IENvbWV0Q2hhdC5SRUFDVElPTl9BQ1RJT04uUkVBQ1RJT05fUkVNT1ZFRDtcbiAgICB9XG4gICAgbGV0IG1vZGlmaWVkTWVzc2FnZSA9XG4gICAgICBDb21ldENoYXQuQ29tZXRDaGF0SGVscGVyLnVwZGF0ZU1lc3NhZ2VXaXRoUmVhY3Rpb25JbmZvKFxuICAgICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgICBtZXNzYWdlLmdldFJlYWN0aW9uKCksXG4gICAgICAgIGFjdGlvblxuICAgICAgKTtcbiAgICBpZiAobW9kaWZpZWRNZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobW9kaWZpZWRNZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIHRyYW5zbGF0ZSBtZXNzYWdlIHRoZW4gY2FsbCB1cGRhdGUgbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIC8vIHRyYW5zbGF0ZU1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gIC8vIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFya01lc3NhZ2VBc0RlbGl2ZXJlZCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5kaXNhYmxlUmVjZWlwdCAmJlxuICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAmJlxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImRlbGl2ZXJlZEF0XCIpID09PSBmYWxzZVxuICAgICkge1xuICAgICAgQ29tZXRDaGF0Lm1hcmtBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBXaGVuIE1lc3NhZ2UgaXMgUmVjZWl2ZWRcbiAgICogQHBhcmFtIG1lc3NhZ2VcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1lc3NhZ2VSZWNlaXZlZChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKSB8fFxuICAgICAgICAobWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAhbWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMuaXNPbkJvdHRvbSkgfHxcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKVxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKG1lc3NhZ2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWVzc2FnZVJlY2VpdmVkSGFuZGxlcihtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBVcGRhdGluZyB0aGUgcmVwbHkgY291bnQgb2YgVGhyZWFkIFBhcmVudCBNZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZXNcbiAgICovXG4gIHVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZXM6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgcmVjZWl2ZWRNZXNzYWdlID0gbWVzc2FnZXM7XG4gICAgICBsZXQgbWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgICAobSkgPT4gbS5nZXRJZCgpID09PSByZWNlaXZlZE1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKClcbiAgICAgICk7XG4gICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgIHZhciBtZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlS2V5XTtcbiAgICAgICAgbGV0IHJlcGx5Q291bnQgPSBtZXNzYWdlT2JqLmdldFJlcGx5Q291bnQoKVxuICAgICAgICAgID8gbWVzc2FnZU9iai5nZXRSZXBseUNvdW50KClcbiAgICAgICAgICA6IDA7XG4gICAgICAgIHJlcGx5Q291bnQgPSByZXBseUNvdW50ICsgMTtcbiAgICAgICAgbWVzc2FnZU9iai5zZXRSZXBseUNvdW50KHJlcGx5Q291bnQpO1xuICAgICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZU9iaik7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VMaXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICAgKi9cbiAgbWVzc2FnZVJlY2VpdmVkSGFuZGxlciA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICArK3RoaXMubWVzc2FnZUNvdW50O1xuICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAvLyB0aGlzLnVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZSk7XG4gICAgICB0aGlzLnVwZGF0ZVVucmVhZFJlcGx5Q291bnQobWVzc2FnZSk7XG4gICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VDb3VudCA+IHRoaXMudGhyZXNob2xkVmFsdWUpIHtcbiAgICAgICAgdGhpcy5rZWVwUmVjZW50TWVzc2FnZXMgPSB0cnVlO1xuICAgICAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VCdWlsZGVyKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICBpZiAoIXRoaXMuaXNPbkJvdHRvbSkge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxUb0JvdHRvbU9uTmV3TWVzc2FnZXMpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBjb3VudFRleHQgPSBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICYmXG4gICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICE9IFwiXCJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvdW50VGV4dCA9IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvdW50VGV4dCA9XG4gICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIilcbiAgICAgICAgICAgICAgICA6IGxvY2FsaXplKFwiTkVXX01FU1NBR0VcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQucHVzaChtZXNzYWdlKTtcbiAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VDb3VudCA9XG4gICAgICAgICAgICBcIiDihpMgXCIgKyB0aGlzLlVucmVhZENvdW50Lmxlbmd0aCArIFwiIFwiICsgY291bnRUZXh0O1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgIC8vaGFuZGxpbmcgZG9tIGxhZyAtIGluY3JlbWVudCBjb3VudCBvbmx5IGZvciBtYWluIG1lc3NhZ2UgbGlzdFxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IGZhbHNlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gdHJ1ZSAmJlxuICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWRcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiZcbiAgICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgfTtcbiAgcGxheUF1ZGlvKCkge1xuICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlLFxuICAgICAgICAgIHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldENhbGxCdWlsZGVyID0gKCk6IGFueSA9PiB7XG4gICAgY29uc3QgY2FsbFNldHRpbmdzOiBhbnkgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcbiAgICAgIC5lbmFibGVEZWZhdWx0TGF5b3V0KHRydWUpXG4gICAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGZhbHNlKVxuICAgICAgLnNldENhbGxMaXN0ZW5lcihcbiAgICAgICAgbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuT25nb2luZ0NhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG4gICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoe30gYXMgQ29tZXRDaGF0LkNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5idWlsZCgpO1xuICAgIHJldHVybiBjYWxsU2V0dGluZ3M7XG4gIH07XG4gIHJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCkge1xuICAgIHRoaXMucmVpbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5ncm91cExpc3RlbmVySWQgPSBcImdyb3VwX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5jYWxsTGlzdGVuZXJJZCA9IFwiY2FsbF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHRoaXMuYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgaWYgKHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgxLCB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAzMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlclxuICAgICAgICA/IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyLmdldFVpZCgpKS5idWlsZCgpXG4gICAgICAgIDogdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cC5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcykge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMSwgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoIC0gMzApO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgcmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgdGhpcy5tZXNzYWdlQ291bnQgPSAwO1xuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbnVsbDtcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMaXN0ZW5lcklkKTtcbiAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCk7XG4gIH07XG4gIGdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCByZWNlaXB0ID0gTWVzc2FnZVJlY2VpcHRVdGlscy5nZXRSZWNlaXB0U3RhdHVzKG1lc3NhZ2UpO1xuICAgIHJldHVybiByZWNlaXB0O1xuICB9XG4gIG1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcigpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpcHRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuREVMSVZFUllcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy9zZWFyY2ggZm9yIG1lc3NhZ2VcbiAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PSBOdW1iZXIobWVzc2FnZS5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldLnNldERlbGl2ZXJlZEF0KFxuICAgICAgICAgICAgICBtZXNzYWdlLmdldERlbGl2ZXJlZEF0KClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5KTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpcHRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuUkVBRFxuICAgICAgICApIHtcbiAgICAgICAgICAvL3NlYXJjaCBmb3IgbWVzc2FnZVxuICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgbS5nZXRJZCgpID09IE51bWJlcihtZXNzYWdlLmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0uc2V0UmVhZEF0KG1lc3NhZ2U/LmdldFJlYWRBdCgpKTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzUmVhZChtZXNzYWdlS2V5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IHJlYWRNZXNzYWdlXG4gICAqL1xuICBtYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXk6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBtZXNzYWdlS2V5OyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKCF0aGlzLm1lc3NhZ2VzTGlzdFtpXS5nZXRSZWFkQXQoKSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFtpXS5zZXRSZWFkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldKTtcbiAgfVxuICBtYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleTogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IG1lc3NhZ2VLZXk7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoIXRoaXMubWVzc2FnZXNMaXN0W2ldLmdldERlbGl2ZXJlZEF0KCkpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbaV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IGEgbWVzc2FnZSB3YXMgZGVsZXRlZCBieSB0aGUgdXNlci9wZXJzb24geW91IGFyZSBjaGF0dGluZyB3aXRoXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogRGV0ZWN0cyBpZiB0aGUgbWVzc2FnZSB0aGF0IHdhcyBlZGl0IGlzIHlvdXIgY3VycmVudCBvcGVuIGNvbnZlcnNhdGlvbiB3aW5kb3dcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1lc3NhZ2VFZGl0ZWQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmdyb3VwPy5nZXRHdWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHVwZGF0ZUludGVyYWN0aXZlTWVzc2FnZSA9IChyZWNlaXB0OiBDb21ldENoYXQuSW50ZXJhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gcmVjZWlwdC5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoXG4gICAgICAgIHJlY2VpcHQuZ2V0TWVzc2FnZUlkKClcbiAgICAgICkgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZTtcbiAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChTdHJpbmcobWVzc2FnZT8uZ2V0SWQoKSkgPT0gU3RyaW5nKHJlY2VpcHQuZ2V0TWVzc2FnZUlkKCkpKSB7XG4gICAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSByZWNlaXB0LmdldEludGVyYWN0aW9ucygpO1xuICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2UpLnNldEludGVyYWN0aW9ucyhcbiAgICAgICAgICAgIGludGVyYWN0aW9uXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UoXG4gICAgICAgICAgICBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBhIG1lc3NhZ2Ugd2FzIGRlbGV0ZWQgYnkgdGhlIHVzZXIvcGVyc29uIHlvdSBhcmUgY2hhdHRpbmcgd2l0aFxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgdXBkYXRlRWRpdGVkTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB2YXIgbWVzc2FnZUxpc3QgPSB0aGlzLm1lc3NhZ2VzTGlzdDtcbiAgICAvLyBsZXQgbmV3TWVzc2FnZSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShtZXNzYWdlKTtcbiAgICB2YXIgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgICk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0gPSBtZXNzYWdlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICAvLyBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgLy8gICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtcbiAgICAvLyAgICAgLi4ubWVzc2FnZUxpc3Quc2xpY2UoMCwgbWVzc2FnZUtleSksXG4gICAgLy8gICAgIG1lc3NhZ2UsXG4gICAgLy8gICAgIC4uLm1lc3NhZ2VMaXN0LnNsaWNlKG1lc3NhZ2VLZXkgKyAxKSxcbiAgICAvLyAgIF07XG4gICAgLy8gICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgLy8gfVxuICB9O1xuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBHcm91cCBEYXRhIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogV2hlbiBjdXN0b20gbWVzc2FnZXMgYXJlIHJlY2VpdmVkIGVnLiBQb2xsLCBTdGlja2VycyBlbWl0cyBhY3Rpb24gdG8gdXBkYXRlIG1lc3NhZ2UgbGlzdFxuICAgKiBAcGFyYW0gbWVzc2FnZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgY3VzdG9tTWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKSB8fFxuICAgICAgICAobWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAhbWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMuaXNPbkJvdHRvbSkgfHxcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKVxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKG1lc3NhZ2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VzdG9tTWVzc2FnZVJlY2VpdmVkSGFuZGxlcihtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAgICovXG4gIGN1c3RvbU1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAvLyBhZGQgcmVjZWl2ZWQgbWVzc2FnZSB0byBtZXNzYWdlcyBsaXN0XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIC8vIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMudXBkYXRlVW5yZWFkUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGlmICghdGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgIFwiIOKGkyBcIiArIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgLy9oYW5kbGluZyBkb20gbGFnIC0gaW5jcmVtZW50IGNvdW50IG9ubHkgZm9yIG1haW4gbWVzc2FnZSBsaXN0XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gZmFsc2UgJiZcbiAgICAgICF0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAgIC8vaWYgdGhlIHVzZXIgaGFzIG5vdCBzY3JvbGxlZCBpbiBjaGF0IHdpbmRvdyhzY3JvbGwgaXMgYXQgdGhlIGJvdHRvbSBvZiB0aGUgY2hhdCB3aW5kb3cpXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IHRydWUgJiZcbiAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICB0aGlzLmlzT25Cb3R0b21cbiAgICApIHtcbiAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChtZXNzYWdlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gZGF0ZXMgYW5kIHNldHMgRGF0ZSBvbiBhIGEgbmV3IGRheVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge251bWJlcn0gZmlyc3REYXRlXG4gICAqIEBwYXJhbSAge251bWJlcn0gc2Vjb25kRGF0ZVxuICAgKi9cbiAgaXNEYXRlRGlmZmVyZW50KFxuICAgIGZpcnN0RGF0ZTogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICAgIHNlY29uZERhdGU6IG51bWJlciB8IHVuZGVmaW5lZFxuICApIHtcbiAgICBsZXQgZmlyc3REYXRlT2JqOiBEYXRlLCBzZWNvbmREYXRlT2JqOiBEYXRlO1xuICAgIGZpcnN0RGF0ZU9iaiA9IG5ldyBEYXRlKGZpcnN0RGF0ZSEgKiAxMDAwKTtcbiAgICBzZWNvbmREYXRlT2JqID0gbmV3IERhdGUoc2Vjb25kRGF0ZSEgKiAxMDAwKTtcbiAgICByZXR1cm4gKFxuICAgICAgZmlyc3REYXRlT2JqLmdldERhdGUoKSAhPT0gc2Vjb25kRGF0ZU9iai5nZXREYXRlKCkgfHxcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXRNb250aCgpICE9PSBzZWNvbmREYXRlT2JqLmdldE1vbnRoKCkgfHxcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXRGdWxsWWVhcigpICE9PSBzZWNvbmREYXRlT2JqLmdldEZ1bGxZZWFyKClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgZm9ybWF0dGVycyBmb3IgdGhlIHRleHQgYnViYmxlc1xuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgZ2V0VGV4dEZvcm1hdHRlcnMgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGFsaWdubWVudCA9IHRoaXMuc2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpO1xuICAgIGxldCBjb25maWcgPSB7XG4gICAgICB0ZXh0Rm9ybWF0dGVyczpcbiAgICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVycyAmJiB0aGlzLnRleHRGb3JtYXR0ZXJzLmxlbmd0aFxuICAgICAgICAgID8gWy4uLnRoaXMudGV4dEZvcm1hdHRlcnNdXG4gICAgICAgICAgOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxUZXh0Rm9ybWF0dGVycyh7XG4gICAgICAgICAgICBkaXNhYmxlTWVudGlvbnM6IHRoaXMuZGlzYWJsZU1lbnRpb25zLFxuICAgICAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICAgICAgYWxpZ25tZW50LFxuICAgICAgICAgIH0pLFxuICAgIH07XG5cbiAgICBsZXQgdGV4dEZvcm1hdHRlcnM6IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+ID0gY29uZmlnLnRleHRGb3JtYXR0ZXJzO1xuICAgIGxldCB1cmxUZXh0Rm9ybWF0dGVyITogQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICBsZXQgbWVudGlvbnNUZXh0Rm9ybWF0dGVyITogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbXG4gICAgICAgICAgICBpXG4gICAgICAgICAgXSBhcyBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICBpZiAobWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpLmxlbmd0aCkge1xuICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0TWVudGlvbmVkVXNlcnMoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldExvZ2dlZEluVXNlcihcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSFcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmICh1cmxUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHRGb3JtYXR0ZXJzW2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcikge1xuICAgICAgICAgIHVybFRleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tpXSBhcyBDb21ldENoYXRVcmxzRm9ybWF0dGVyO1xuICAgICAgICAgIGlmIChtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID1cbiAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoe1xuICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgIC4uLmNvbmZpZyxcbiAgICAgICAgICAgIGFsaWdubWVudCxcbiAgICAgICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgdGV4dEZvcm1hdHRlcnMucHVzaChtZW50aW9uc1RleHRGb3JtYXR0ZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB1cmxUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbaV0gYXMgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdXJsVGV4dEZvcm1hdHRlcikge1xuICAgICAgdXJsVGV4dEZvcm1hdHRlciA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFVybFRleHRGb3JtYXR0ZXIoe1xuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgIGFsaWdubWVudCxcbiAgICAgIH0pO1xuICAgICAgdGV4dEZvcm1hdHRlcnMucHVzaCh1cmxUZXh0Rm9ybWF0dGVyKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0ZXh0Rm9ybWF0dGVyc1tpXS5zZXRNZXNzYWdlQnViYmxlQWxpZ25tZW50KGFsaWdubWVudCk7XG4gICAgICB0ZXh0Rm9ybWF0dGVyc1tpXS5zZXRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXh0Rm9ybWF0dGVycztcbiAgfTtcblxuICAvKipcbiAgICogcHJlcGVuZCBGZXRjaGVkIE1lc3NhZ2VzXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgcHJlcGVuZE1lc3NhZ2VzKG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlcywgLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgdGhpcy5tZXNzYWdlQ291bnQgPSB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGg7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICAgIHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuY2hhdENoYW5nZWQpIHtcbiAgICAgICAgQ29tZXRDaGF0VUlFdmVudHMuY2NBY3RpdmVDaGF0Q2hhbmdlZC5uZXh0KHtcbiAgICAgICAgICB1c2VyOiB0aGlzLnVzZXIsXG4gICAgICAgICAgZ3JvdXA6IHRoaXMuZ3JvdXAsXG4gICAgICAgICAgbWVzc2FnZTogbWVzc2FnZXNbbWVzc2FnZXM/Lmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHVucmVhZE1lc3NhZ2VDb3VudDogdGhpcy5nZXRVbnJlYWRDb3VudCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2hhdENoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIGxpc3RlbmluZyB0byBib3R0b20gc2Nyb2xsIHVzaW5nIGludGVyc2VjdGlvbiBvYnNlcnZlclxuICAgKi9cbiAgaW9Cb3R0b20oKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICByb290OiB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQsXG4gICAgICByb290TWFyZ2luOiBcIi0xMDAlIDBweCAxMDBweCAwcHhcIixcbiAgICAgIHRocmVzaG9sZDogMCxcbiAgICB9O1xuICAgIHZhciBjYWxsYmFjayA9IChlbnRyaWVzOiBhbnkpID0+IHtcbiAgICAgIHZhciBsYXN0TWVzc2FnZSA9IHRoaXMuVW5yZWFkQ291bnRbdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggLSAxXTtcbiAgICAgIHRoaXMuaXNPbkJvdHRvbSA9IGVudHJpZXNbMF0uaXNJbnRlcnNlY3Rpbmc7XG4gICAgICBpZiAodGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIHRoaXMuZmV0Y2hOZXh0TWVzc2FnZSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQgJiYgdGhpcy5VbnJlYWRDb3VudD8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKS50aGVuKFxuICAgICAgICAgICAgKHJlczogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT0gTnVtYmVyKHJlcz8uZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChsYXN0TWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgb2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKFxuICAgICAgY2FsbGJhY2ssXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKHRoaXMuYm90dG9tPy5uYXRpdmVFbGVtZW50KTtcbiAgfVxuICAvKipcbiAgICogbGlzdGVuaW5nIHRvIHRvcCBzY3JvbGwgdXNpbmcgaW50ZXJzZWN0aW9uIG9ic2VydmVyXG4gICAqL1xuICBpb1RvcCgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIHJvb3Q6IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudCxcbiAgICAgIHJvb3RNYXJnaW46IFwiMjAwcHggMHB4IDBweCAwcHhcIixcbiAgICAgIHRocmVzaG9sZDogMS4wLFxuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrID0gKGVudHJpZXM6IGFueSkgPT4ge1xuICAgICAgaWYgKGVudHJpZXNbMF0uaXNJbnRlcnNlY3RpbmcpIHtcbiAgICAgICAgdGhpcy5udW1iZXJPZlRvcFNjcm9sbCsrO1xuICAgICAgICBpZiAodGhpcy5udW1iZXJPZlRvcFNjcm9sbCA+IDEpIHtcbiAgICAgICAgICB0aGlzLmZldGNoUHJldmlvdXNNZXNzYWdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgb2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKFxuICAgICAgY2FsbGJhY2ssXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKHRoaXMudG9wPy5uYXRpdmVFbGVtZW50KTtcbiAgfVxuICAvLyBwdWJsaWMgbWV0aG9kc1xuICBhZGRNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRoaXMubWVzc2FnZXNMaXN0LnB1c2gobWVzc2FnZSk7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0SWQoKSkge1xuICAgICAgdGhpcy5sYXN0TWVzc2FnZUlkID0gTnVtYmVyKG1lc3NhZ2UuZ2V0SWQoKSk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgICFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKSB8fFxuICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgKSB7XG4gICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgfTtcbiAgLyoqXG4gICAqIGNhbGxiYWNrIGZvciBjb3B5IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlRleHRNZXNzYWdlfSBvYmplY3RcbiAgICovXG4gIG9uQ29weU1lc3NhZ2UgPSAob2JqZWN0OiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpID0+IHtcbiAgICBsZXQgdGV4dCA9IG9iamVjdC5nZXRUZXh0KCk7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuZGlzYWJsZU1lbnRpb25zICYmXG4gICAgICBvYmplY3QuZ2V0TWVudGlvbmVkVXNlcnMgJiZcbiAgICAgIG9iamVjdC5nZXRNZW50aW9uZWRVc2VycygpLmxlbmd0aFxuICAgICkge1xuICAgICAgdGV4dCA9IHRoaXMuZ2V0TWVudGlvbnNUZXh0V2l0aG91dFN0eWxlKG9iamVjdCk7XG4gICAgfVxuICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRleHQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIHRvIGVuc3VyZSB0aGF0IHRoZSB1aWQgZG9lc24ndCBnZXQgY29waWVkIHdoZW4gY2xpY2tpbmcgb24gdGhlIGNvcHkgb3B0aW9uLlxuICAgKiBUaGlzIGZ1bmN0aW9uIGNoYW5nZXMgdGhlIHVpZCByZWdleCB0byAnQHVzZXJOYW1lJyB3aXRob3V0IGZvcm1hdHRpbmdcbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuVGV4dE1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHJldHVybnNcbiAgICovXG4gIGdldE1lbnRpb25zVGV4dFdpdGhvdXRTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHtcbiAgICBjb25zdCByZWdleCA9IC88QHVpZDooLio/KT4vZztcbiAgICBsZXQgbWVzc2FnZVRleHQgPSBtZXNzYWdlLmdldFRleHQoKTtcbiAgICBsZXQgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlLmdldFRleHQoKTtcbiAgICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgd2hpbGUgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBsZXQgdXNlcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG1hdGNoWzFdID09IG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpKSB7XG4gICAgICAgICAgdXNlciA9IG1lbnRpb25lZFVzZXJzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICBtZXNzYWdlVGV4dFRtcCA9IG1lc3NhZ2VUZXh0VG1wLnJlcGxhY2UoXG4gICAgICAgICAgbWF0Y2hbMF0sXG4gICAgICAgICAgXCJAXCIgKyB1c2VyLmdldE5hbWUoKSArIFwiXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlVGV4dFRtcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBjYWxsYmFjayBmb3IgZGVsZXRlTWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG9iamVjdFxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZXNcbiAgICovXG4gIG1lc3NhZ2VTZW50KG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB2YXIgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZXM7XG4gICAgdmFyIG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiBtLmdldE11aWQoKSA9PT0gbWVzc2FnZS5nZXRNdWlkKClcbiAgICApO1xuICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlKTtcbiAgICB9XG4gICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBtZXNzYWdlTGlzdDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICB9XG4gIC8qKlxuICAgKiBjYWxsYmFjayBmb3IgZWRpdE1lc3NhZ2Ugb3B0aW9uXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gb2JqZWN0XG4gICAqL1xuICBvbkVkaXRNZXNzYWdlID0gKG9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQubmV4dCh7XG4gICAgICBtZXNzYWdlOiBvYmplY3QsXG4gICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICB9KTtcbiAgfTtcbiAgdXBkYXRlTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIG11aWQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIGlmIChtdWlkKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VTZW50KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIHJlbW92ZU1lc3NhZ2UgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAobXNnKSA9PiBtc2c/LmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG1lc3NhZ2UpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdHlsZSBjb25maWd1cmF0aW9uIGZvciB0aGUgdGhyZWFkIHZpZXcgb2YgYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoYXQgdGhlIHN0eWxlIGNvbmZpZ3VyYXRpb24gaXMgZm9yLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgc3R5bGUgY29uZmlndXJhdGlvbiBvYmplY3QuXG4gICAqL1xuICBnZXRUaHJlYWRWaWV3U3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUudGhyZWFkUmVwbHlJY29uVGludCxcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleEZsb3c6XG4gICAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJiB0aGlzLmFsaWdubWVudCAhPSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0XG4gICAgICAgICAgPyBcInJvdy1yZXZlcnNlXCJcbiAgICAgICAgICA6IFwicm93XCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtc3RhcnRcIixcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVRleHRDb2xvcixcbiAgICAgIGJ1dHRvblRleHRGb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VGV4dEZvbnQsXG4gICAgICBpY29uSGVpZ2h0OiBcIjE1cHhcIixcbiAgICAgIGljb25XaWR0aDogXCIxNXB4XCIsXG4gICAgICBnYXA6IFwiNHB4XCIsXG4gICAgfTtcbiAgfVxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgbWVzc2FnZSB3YXMgc2VudCBieSB0aGUgY3VycmVudGx5IGxvZ2dlZCBpbiB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIGxvZ2dlZCBpbiB1c2VyLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBpc1NlbnRCeU1lKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCBzZW50QnlNZTogYm9vbGVhbiA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpO1xuICAgIHJldHVybiBzZW50QnlNZTtcbiAgfVxuICBkZWxldGVNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICB2YXIgbWVzc2FnZUlkOiBhbnkgPSBtZXNzYWdlLmdldElkKCk7XG4gICAgICBDb21ldENoYXQuZGVsZXRlTWVzc2FnZShtZXNzYWdlSWQpXG4gICAgICAgIC50aGVuKChkZWxldGVkTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRGVsZXRlZC5uZXh0KGRlbGV0ZWRNZXNzYWdlKTtcbiAgICAgICAgICAvLyB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKClcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHNjcm9sbFRvQm90dG9tID0gKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbCh7XG4gICAgICAgICAgdG9wOiB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmlzT25Cb3R0b20gPSB0cnVlO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9LCAxMCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzaG93SGVhZGVyVGl0bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuZ3JvdXAgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpICYmXG4gICAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5zdGFuZGFyZFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY291bnQgb2YgdW5yZWFkIHJlcGx5IG1lc3NhZ2VzIGZvciBhIGdpdmVuIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgZm9yIHdoaWNoIHRoZSByZXBseSBjb3VudCBpcyBiZWluZyB1cGRhdGVkLlxuICAgKi9cblxuICB1cGRhdGVVbnJlYWRSZXBseUNvdW50ID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgbWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgICAobSkgPT4gbS5nZXRJZCgpID09PSBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpXG4gICAgICApO1xuICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICBjb25zdCBtZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlS2V5XTtcbiAgICAgICAgLy8gbGV0IHVucmVhZFJlcGx5Q291bnQgPSBtZXNzYWdlT2JqLmdldFVucmVhZFJlcGx5Q291bnQoKVxuICAgICAgICAvLyAgID8gbWVzc2FnZU9iai5nZXRVbnJlYWRSZXBseUNvdW50KClcbiAgICAgICAgLy8gICA6IDA7XG4gICAgICAgIC8vIHVucmVhZFJlcGx5Q291bnQgPSB1bnJlYWRSZXBseUNvdW50ICsgMTtcbiAgICAgICAgLy8gbWVzc2FnZU9iai5zZXRVbnJlYWRSZXBseUNvdW50KHVucmVhZFJlcGx5Q291bnQpO1xuICAgICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZU9iaik7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VMaXN0XTtcbiAgICAgIH1cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIE1ldGhvZCB0byBzdWJzY3JpYmUgIHRoZSByZXF1aXJlZCBSeGpzIGV2ZW50cyB3aGVuIHRoZSBDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudCBsb2Fkc1xuICAgKi9cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY1Nob3dQYW5lbCA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd1BhbmVsLnN1YnNjcmliZShcbiAgICAgIChkYXRhOiBJUGFuZWwpID0+IHtcbiAgICAgICAgaWYgKGRhdGEuY2hpbGQ/LnNob3dDb252ZXJzYXRpb25TdW1tYXJ5Vmlldykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hDb252ZXJzYXRpb25TdW1tYXJ5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zbWFydFJlcGx5Q29uZmlnID0gZGF0YS5jb25maWd1cmF0aW9uITtcbiAgICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IGRhdGEubWVzc2FnZSE7XG4gICAgICAgIHZhciBzbWFydFJlcGx5T2JqZWN0ID0gKGRhdGEubWVzc2FnZSBhcyBhbnkpPy5tZXRhZGF0YT8uW1xuICAgICAgICAgIFNtYXJ0UmVwbGllc0NvbnN0YW50cy5pbmplY3RlZFxuICAgICAgICBdPy5leHRlbnNpb25zPy5bU21hcnRSZXBsaWVzQ29uc3RhbnRzLnNtYXJ0X3JlcGx5XTtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KHRoaXMuc21hcnRSZXBseU1lc3NhZ2UpICYmIHNtYXJ0UmVwbHlPYmplY3QgJiYgIXNtYXJ0UmVwbHlPYmplY3QuZXJyb3IpIHtcbiAgICAgICAgICB0aGlzLmVuYWJsZVNtYXJ0UmVwbHkgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0hpZGVQYW5lbCA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjSGlkZVBhbmVsLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuZW5hYmxlU21hcnRSZXBseSA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICBjb25zdCBtZXNzYWdlT2JqID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKTtcbiAgICAgICAgICAvLyBpZiAobWVzc2FnZU9iaiAmJiBtZXNzYWdlT2JqLmdldFVucmVhZFJlcGx5Q291bnQoKSkge1xuICAgICAgICAgIC8vICAgbWVzc2FnZU9iai5zZXRVbnJlYWRSZXBseUNvdW50KDApO1xuICAgICAgICAgIC8vICAgdGhpcy51cGRhdGVNZXNzYWdlKG1lc3NhZ2VPYmopO1xuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKFxuICAgICAgKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgIGl0ZW07XG4gICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMoaXRlbS5tZXNzYWdlcyEpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID1cbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoaXRlbS5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPVxuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShpdGVtLm1lc3NhZ2UhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZShcbiAgICAgIChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBpZiAob2JqZWN0Py5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG9iamVjdC5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG9iamVjdC5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQuc3Vic2NyaWJlKFxuICAgICAgKG9iajogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmIChvYmoubWVzc2FnZSkge1xuICAgICAgICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBvYmoubWVzc2FnZSE7XG4gICAgICAgICAgc3dpdGNoIChvYmouc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzczoge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3M6IHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICAgICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW107XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobWVzc2FnZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlU3RhdHVzLmVycm9yOiB7XG4gICAgICAgICAgICAgIGlmICghbWVzc2FnZS5nZXRTZW5kZXIoKSB8fCB0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VEZWxldGVkLnN1YnNjcmliZShcbiAgICAgIChtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgdGhpcy5yZW1vdmVNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEVuZGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zZXNzaW9uSWQgPSBcIlwiO1xuICAgICAgICBpZiAoY2FsbCAmJiBPYmplY3Qua2V5cyhjYWxsKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsUmVqZWN0ZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsQWNjZXB0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEFjY2VwdGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH1cbiAgY2xvc2VTbWFydFJlcGx5ID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgY2xvc2VDb252ZXJzYXRpb25TdW1tYXJ5ID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIHNob3dTdGF0dXNJbmZvKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGlmIChcbiAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gdGhpcy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICAhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSB0aGlzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmXG4gICAgICBtZXNzYWdlPy5nZXRTZW50QXQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgc2VuZFJlcGx5ID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgcmVwbHk6IHN0cmluZyA9IGV2ZW50Py5kZXRhaWw/LnJlcGx5O1xuICAgIGlmICh0aGlzLnNtYXJ0UmVwbHlDb25maWcuY2NTbWFydFJlcGxpZXNDbGlja2VkKSB7XG4gICAgICB0aGlzLnNtYXJ0UmVwbHlDb25maWcuY2NTbWFydFJlcGxpZXNDbGlja2VkKFxuICAgICAgICByZXBseSxcbiAgICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSEsXG4gICAgICAgIHRoaXMub25FcnJvcixcbiAgICAgICAgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzLFxuICAgICAgICB0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzXG4gICAgICApO1xuICAgICAgdGhpcy5jbG9zZVNtYXJ0UmVwbHkoKTtcbiAgICB9XG4gIH07XG4gIHNlbmRDb252ZXJzYXRpb25TdGFydGVyID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgcmVwbHk6IHN0cmluZyA9IGV2ZW50Py5kZXRhaWw/LnJlcGx5O1xuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjQ29tcG9zZU1lc3NhZ2UubmV4dChyZXBseSk7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGZldGNoQ29udmVyc2F0aW9uU3RhcnRlcigpIHtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gdHJ1ZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIGxldCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICBsZXQgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IHRoaXMudXNlci5nZXRVaWQoKVxuICAgICAgOiB0aGlzLmdyb3VwLmdldEd1aWQoKTtcbiAgICBDb21ldENoYXQuZ2V0Q29udmVyc2F0aW9uU3RhcnRlcihyZWNlaXZlcklkLCByZWNlaXZlclR5cGUpXG4gICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhyZXNwb25zZSkuZm9yRWFjaCgocmVwbHkpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZVtyZXBseV0gJiYgcmVzcG9uc2VbcmVwbHldICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcy5wdXNoKHJlc3BvbnNlW3JlcGx5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyAmJlxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDBcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfSk7XG4gIH1cblxuICBmZXRjaENvbnZlcnNhdGlvblN1bW1hcnkoKSB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IHRydWU7XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICBsZXQgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyB0aGlzLnVzZXIuZ2V0VWlkKClcbiAgICAgIDogdGhpcy5ncm91cC5nZXRHdWlkKCk7XG5cbiAgICBsZXQgYXBpQ29uZmlndXJhdGlvbiA9IHRoaXMuYXBpQ29uZmlndXJhdGlvbjtcblxuICAgIENvbWV0Q2hhdC5nZXRDb252ZXJzYXRpb25TdW1tYXJ5KHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSwgYXBpQ29uZmlndXJhdGlvbilcbiAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihcIlBhcmFtZXRlciBpcyBub3QgYSBudW1iZXIhXCIpO1xuICAgICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgPSBbcmVzcG9uc2VdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgJiYgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeTtcbiAgfVxuXG4gIGdldFJlcGxpZXMoKTogc3RyaW5nW10gfCBudWxsIHtcbiAgICBsZXQgc21hcnRSZXBseTogYW55ID0gdGhpcy5zbWFydFJlcGx5TWVzc2FnZTtcbiAgICB2YXIgc21hcnRSZXBseU9iamVjdCA9XG4gICAgICBzbWFydFJlcGx5Py5tZXRhZGF0YT8uW1NtYXJ0UmVwbGllc0NvbnN0YW50cy5pbmplY3RlZF0/LmV4dGVuc2lvbnM/LltcbiAgICAgIFNtYXJ0UmVwbGllc0NvbnN0YW50cy5zbWFydF9yZXBseVxuICAgICAgXTtcbiAgICBpZiAoXG4gICAgICBzbWFydFJlcGx5T2JqZWN0Py5yZXBseV9wb3NpdGl2ZSAmJlxuICAgICAgc21hcnRSZXBseU9iamVjdD8ucmVwbHlfbmV1dHJhbCAmJlxuICAgICAgc21hcnRSZXBseU9iamVjdD8ucmVwbHlfbmVnYXRpdmVcbiAgICApIHtcbiAgICAgIHZhciB7IHJlcGx5X3Bvc2l0aXZlLCByZXBseV9uZXV0cmFsLCByZXBseV9uZWdhdGl2ZSB9ID0gc21hcnRSZXBseU9iamVjdDtcbiAgICAgIHJldHVybiBbcmVwbHlfcG9zaXRpdmUsIHJlcGx5X25ldXRyYWwsIHJlcGx5X25lZ2F0aXZlXTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLyoqXG4gICAqIE1ldGhvZCB0byB1bnN1YnNjcmliZSBhbGwgdGhlIFJ4anMgZXZlbnRzIHdoZW4gdGhlIENvbWV0Q2hhdE1lc3NhZ2VMaXN0Q29tcG9uZW50IGdldHMgZGVzdHJveVxuICAgKi9cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVySm9pbmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3duZXJzaGlwQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBMZWZ0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0xpdmVSZWFjdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZT8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1Nob3dQYW5lbD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZVJlYWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0hpZGVQYW5lbD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjQ2FsbEVuZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NDYWxsUmVqZWN0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY091dGdvaW5nQ2FsbD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjQ2FsbEFjY2VwdGVkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcHByb3ByaWF0ZSB0aHJlYWQgaWNvbiBiYXNlZCBvbiB0aGUgc2VuZGVyIG9mIHRoZSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIGZvciB3aGljaCB0aGUgdGhyZWFkIGljb24gaXMgYmVpbmcgZGV0ZXJtaW5lZC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFRoZSBpY29uIGZvciB0aGUgdGhyZWFkLiBJZiB0aGUgbWVzc2FnZSB3YXMgc2VudCBieSB0aGUgbG9nZ2VkIGluIHVzZXIsIHJldHVybnMgJ3RocmVhZFJpZ2h0QXJyb3cnLiBPdGhlcndpc2UsIHJldHVybnMgJ3RocmVhZEluZGljYXRvckljb24nLlxuICAgKi9cbiAgZ2V0VGhyZWFkSWNvbkFsaWdubWVudChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBib29sZWFuIHtcbiAgICBsZXQgc2VudEJ5TWU6IGJvb2xlYW4gPVxuICAgICAgdGhpcy5pc1NlbnRCeU1lKG1lc3NhZ2UpICYmXG4gICAgICB0aGlzLmFsaWdubWVudCA9PT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQuc3RhbmRhcmQ7XG4gICAgcmV0dXJuIHNlbnRCeU1lID8gZmFsc2UgOiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiBzdHlsaW5nIHBhcnRcbiAgICovXG4gIGdldEJ1YmJsZURhdGVTdHlsZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgaXNTZW50QnlNZSA9XG4gICAgICB0aGlzLmlzU2VudEJ5TWUobWVzc2FnZSkgJiYgdGhpcy5hbGlnbm1lbnQgIT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICBsZXQgaXNUZXh0TWVzc2FnZSA9XG4gICAgICBtZXNzYWdlLmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dDtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dENvbG9yOlxuICAgICAgICB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuVGltZXN0YW1wVGV4dENvbG9yIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0ZXh0Rm9udDpcbiAgICAgICAgdGhpcy5tZXNzYWdlTGlzdFN0eWxlLlRpbWVzdGFtcFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMyksXG4gICAgICBwYWRkaW5nOiBcIjBweFwiLFxuICAgICAgZGlzcGxheTogXCJibG9ja1wiLFxuICAgIH07XG4gIH07XG4gIGNoYXRzTGlzdFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5oZWlnaHQsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYmFja2dyb3VuZCxcbiAgICB9O1xuICB9O1xuICBtZXNzYWdlQ29udGFpbmVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUud2lkdGgsXG4gICAgfTtcbiAgfTtcbiAgZXJyb3JTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIGNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG5cbiAgY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfTtcbiAgfTtcblxuICBlbXB0eVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbiAgbG9hZGluZ1N0eWxlID0ge1xuICAgIGljb25UaW50OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LmxvYWRpbmdJY29uVGludCxcbiAgfTtcbiAgY29udmVyc2F0aW9uU3RhcnRlckxvYWRlciA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnZlcnNhdGlvblN1bW1hcnlMb2FkZXIgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfTtcbiAgfTtcbiAgZ2V0U2NoZWR1bGVyQnViYmxlU3R5bGUgPSAobWVzc2dhZTogU2NoZWR1bGVyTWVzc2FnZSkgPT4ge1xuICAgIGxldCBhdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiNTAlXCIsXG4gICAgICB3aWR0aDogXCI0OHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiNDhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICB9KTtcbiAgICBsZXQgbGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCJhdXRvXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcImluaGVyaXRcIixcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiBcIlwiLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfSk7XG5cbiAgICBsZXQgY2FsZW5kYXJTdHlsZSA9IG5ldyBDYWxlbmRhclN0eWxlKHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGRhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBkYXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGF5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBkYXlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtb250aFllYXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIG1vbnRoWWVhclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGRlZmF1bHREYXRlVGV4dEJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGRpc2FibGVkRGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGRpc2FibGVkRGF0ZVRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGRpc2FibGVkRGF0ZVRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aW1lem9uZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGltZXpvbmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhcnJvd0J1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFycm93QnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyXG4gICAgICApLFxuICAgIH0pO1xuICAgIGxldCB0aW1lU2xvdFN0eWxlID0gbmV3IFRpbWVTbG90U3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGNhbGVuZGFySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aW1lem9uZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTbG90SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICBlbXB0eVNsb3RUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICBlbXB0eVNsb3RUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBkYXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHNlcGVyYXRvclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzbG90QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHNsb3RCb3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2xvdEJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHNsb3RUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBzbG90VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0aW1lem9uZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpbWV6b25lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgfSk7XG4gICAgbGV0IHF1Y2lrVmlld1N0eWxlID0gbmV3IFF1aWNrVmlld1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBzdWJ0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc3VidGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxlYWRpbmdCYXJUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGxlYWRpbmdCYXJXaWR0aDogXCI0cHhcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFNjaGVkdWxlckJ1YmJsZVN0eWxlKHtcbiAgICAgIGF2YXRhclN0eWxlOiBhdmF0YXJTdHlsZSxcbiAgICAgIGxpc3RJdGVtU3R5bGU6IGxpc3RJdGVtU3R5bGUsXG4gICAgICBxdWlja1ZpZXdTdHlsZTogcXVjaWtWaWV3U3R5bGUsXG4gICAgICBkYXRlU2VsZWN0b3JTdHlsZTogY2FsZW5kYXJTdHlsZSxcbiAgICAgIHRpbWVTbG90U2VsZWN0b3JTdHlsZTogdGltZVNsb3RTdHlsZSxcbiAgICAgIGJhY2tCdXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc3VnZ2VzdGVkVGltZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBzdWdnZXN0ZWRUaW1lQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCl9YCxcbiAgICAgIHN1Z2dlc3RlZFRpbWVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzdWdnZXN0ZWRUaW1lRGlzYWJsZWRCYWNrZ3JvdW5kOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBzdWdnZXN0ZWRUaW1lRGlzYWJsZWRCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBzdWdnZXN0ZWRUaW1lRGlzYWJsZWRCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzdWdnZXN0ZWRUaW1lRGlzYWJsZWRUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBzdWdnZXN0ZWRUaW1lRGlzYWJsZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VnZ2VzdGVkVGltZVRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dEJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRCb3JkZXI6IFwibm9uZVwiLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dEJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIG1vcmVCdXR0b25UZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgbW9yZUJ1dHRvblRleHRCb3JkZXI6IFwibm9uZVwiLFxuICAgICAgbW9yZUJ1dHRvblRleHRCb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgbW9yZUJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBtb3JlQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGdvYWxDb21wbGV0aW9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBlcnJvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgZXJyb3JUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIHNjaGVkdWxlQnV0dG9uU3R5bGU6IHtcbiAgICAgICAgaWNvbkhlaWdodDogXCIyMHB4XCIsXG4gICAgICAgIGljb25XaWR0aDogXCIyMHB4XCIsXG4gICAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5Lm5hbWUpLFxuICAgICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgICB9LFxuICAgICAgc2VwZXJhdG9yVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5Lm5hbWUpLFxuICAgICAgc3VtbWFyeVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1bW1hcnlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aW1lem9uZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRpbWV6b25lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGltZXpvbmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGNhbGVuZGFySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBjbG9ja0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH0pO1xuICB9O1xuICAvKipcbiAgICogQ29uZmlndXJhdGlvbiBmb3IgdGhlIHJlYWN0aW9uIGxpc3QuXG4gICAqIFRoaXMgaW5jbHVkZXMgc3R5bGVzIGZvciB0aGUgYXZhdGFyLCBsaXN0IGl0ZW1zLCBhbmQgcmVhY3Rpb24gaGlzdG9yeS5cbiAgICogQHJldHVybnMge1JlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb259IC0gVGhlIGNvbmZpZ3VyZWQgcmVhY3Rpb24gbGlzdC5cbiAgICovXG4gIGdldFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24oKSB7XG4gICAgY29uc3QgYXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjUwJVwiLFxuICAgICAgd2lkdGg6IFwiMzVweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM1cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBvdXRlclZpZXdCb3JkZXJXaWR0aDogXCIwXCIsXG4gICAgICBvdXRlclZpZXdCb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyQ29sb3I6IFwiXCIsXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIjBcIixcbiAgICB9KTtcbiAgICBjb25zdCBsaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcbiAgICBjb25zdCByZWFjdGlvbkhpc3RvcnlTdHlsZSA9IG5ldyBSZWFjdGlvbkxpc3RTdHlsZSh7XG4gICAgICB3aWR0aDogXCIzMjBweFwiLFxuICAgICAgaGVpZ2h0OiBcIjMwMHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHNsaWRlckVtb2ppQ291bnRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgc2xpZGVyRW1vamlGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDEpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHRhaWxWaWV3Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBkaXZpZGVyVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNsaWRlckVtb2ppQ291bnRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGFjdGl2ZUVtb2ppQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgUmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbih7XG4gICAgICBhdmF0YXJTdHlsZTpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uPy5hdmF0YXJTdHlsZSB8fFxuICAgICAgICBhdmF0YXJTdHlsZSxcbiAgICAgIGVycm9ySWNvblVSTDpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uPy5lcnJvckljb25VUkwgfHxcbiAgICAgICAgXCJcIixcbiAgICAgIGxpc3RJdGVtU3R5bGU6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbj8ubGlzdEl0ZW1TdHlsZSB8fFxuICAgICAgICBsaXN0SXRlbVN0eWxlLFxuICAgICAgbG9hZGluZ0ljb25VUkw6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvblxuICAgICAgICAgID8ubG9hZGluZ0ljb25VUkwgfHwgXCJcIixcbiAgICAgIHJlYWN0aW9uTGlzdFN0eWxlOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LnJlYWN0aW9uTGlzdFN0eWxlIHx8IHJlYWN0aW9uSGlzdG9yeVN0eWxlLFxuICAgICAgcmVhY3Rpb25JdGVtQ2xpY2tlZDpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5yZWFjdGlvbkl0ZW1DbGlja2VkIHx8IHRoaXMub25SZWFjdGlvbkl0ZW1DbGlja2VkLFxuICAgICAgcmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXI6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvblxuICAgICAgICAgID8ucmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXIgfHwgdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBIYW5kbGVzIHdoZW4gYSByZWFjdGlvbiBpdGVtIGlzIGNsaWNrZWQuXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlJlYWN0aW9ufSByZWFjdGlvbiAtIFRoZSBjbGlja2VkIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoZSByZWFjdGlvbiBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqL1xuXG4gIG9uUmVhY3Rpb25JdGVtQ2xpY2tlZD8gPSAoXG4gICAgcmVhY3Rpb246IENvbWV0Q2hhdC5SZWFjdGlvbixcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogdm9pZCA9PiB7XG4gICAgaWYgKHJlYWN0aW9uPy5nZXRSZWFjdGVkQnkoKT8uZ2V0VWlkKCkgPT09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgdGhpcy5yZWFjdFRvTWVzc2FnZShyZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSwgbWVzc2FnZSk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogSGFuZGxlcyBhZGRpbmcgYSByZWFjdGlvbiB3aGVuIGNsaWNrZWQuXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlJlYWN0aW9uQ291bnR9IHJlYWN0aW9uIC0gVGhlIGNsaWNrZWQgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhlIHJlYWN0aW9uIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAgICovXG4gIGFkZFJlYWN0aW9uT25DbGljayA9IChcbiAgICByZWFjdGlvbjogQ29tZXRDaGF0LlJlYWN0aW9uQ291bnQsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICkgPT4ge1xuICAgIGxldCBvblJlYWN0Q2xpY2sgPSB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uQ2xpY2s7XG4gICAgaWYgKG9uUmVhY3RDbGljaykge1xuICAgICAgb25SZWFjdENsaWNrKHJlYWN0aW9uLCBtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZWFjdFRvTWVzc2FnZShyZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSwgbWVzc2FnZSk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQ29uZmlndXJhdGlvbiBmb3IgdGhlIHJlYWN0aW9uIGluZm8uXG4gICAqIFRoaXMgaW5jbHVkZXMgc3R5bGVzIGZvciB0aGUgcmVhY3Rpb24gaW5mbyBkaXNwbGF5LlxuICAgKiBAcmV0dXJucyB7UmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbn0gLSBUaGUgY29uZmlndXJlZCByZWFjdGlvbiBpbmZvLlxuICAgKi9cblxuICBnZXRSZWFjdGlvbkluZm9Db25maWd1cmF0aW9uKCkge1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbiB8fCB7fTtcbiAgICBjb25zdCByZWFjdGlvbkluZm9TdHlsZSA9IG5ldyBSZWFjdGlvbkluZm9TdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5iYWNrZ3JvdW5kIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmJvcmRlciB8fCBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8uYm9yZGVyUmFkaXVzIHx8IFwiMTJweFwiLFxuICAgICAgZXJyb3JJY29uVGludDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8uZXJyb3JJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ubG9hZGluZ0ljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbmFtZXNDb2xvcjpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ubmFtZXNDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG5hbWVzRm9udDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ubmFtZXNGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgcmVhY3RlZFRleHRDb2xvcjpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ucmVhY3RlZFRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMChcImRhcmtcIiksXG4gICAgICByZWFjdGVkVGV4dEZvbnQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LnJlYWN0ZWRUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHJlYWN0aW9uRm9udFNpemU6IGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LnJlYWN0aW9uRm9udFNpemUgfHwgXCIzN3B4XCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBSZWFjdGlvbkluZm9Db25maWd1cmF0aW9uKHtcbiAgICAgIHJlYWN0aW9uSW5mb1N0eWxlOiByZWFjdGlvbkluZm9TdHlsZSxcbiAgICAgIHJlYWN0aW9uc1JlcXVlc3RCdWlsZGVyOiBjb25maWc/LnJlYWN0aW9uc1JlcXVlc3RCdWlsZGVyIHx8IHVuZGVmaW5lZCxcbiAgICAgIGVycm9ySWNvblVSTDogY29uZmlnPy5lcnJvckljb25VUkwgfHwgXCJcIixcbiAgICAgIGxvYWRpbmdJY29uVVJMOiBjb25maWc/LmxvYWRpbmdJY29uVVJMIHx8IFwiXCIsXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIEdldCBzdHlsZSBvYmplY3QgYmFzZWQgb24gbWVzc2FnZSB0eXBlLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdC5cbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgc3R5bGUgb2JqZWN0LlxuICAgKi9cbiAgZ2V0U3RhdHVzSW5mb1N0eWxlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIC8vIEJhc2Ugc3R5bGVzIHRoYXQgYXJlIGNvbW1vbiBmb3IgYm90aCBjb25kaXRpb25zXG4gICAgY29uc3QgYmFzZVN0eWxlID0ge1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtZW5kXCIsXG4gICAgICBnYXA6IFwiMXB4XCIsXG4gICAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgIH07XG5cbiAgICAvLyBJZiBtZXNzYWdlIHR5cGUgaXMgYXVkaW8gb3IgdmlkZW9cbiAgICBpZiAodGhpcy5pc0F1ZGlvT3JWaWRlb01lc3NhZ2UobWVzc2FnZSkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmJhc2VTdHlsZSxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMjJweFwiLFxuICAgICAgICBwYWRkaW5nOiBcIjNweCA1cHhcIixcbiAgICAgICAgcGFkZGluZ1RvcDogXCIycHhcIixcbiAgICAgICAgcG9zaXRpb246IFwicmVsYXRpdmVcIixcbiAgICAgICAgbWFyZ2luVG9wOiBcIi0yNnB4XCIsXG4gICAgICAgIG1hcmdpblJpZ2h0OiBcIjZweFwiLFxuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMChcImRhcmtcIiksXG4gICAgICAgIHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG4gICAgICAgIGFsaWduU2VsZjogXCJmbGV4LWVuZFwiLFxuICAgICAgICBtYXJnaW5Cb3R0b206IFwiNnB4XCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFN0eWxlIGZvciBvdGhlciB0eXBlcyBvZiBtZXNzYWdlc1xuICAgIHJldHVybiB7XG4gICAgICAuLi5iYXNlU3R5bGUsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJmbGV4LWVuZFwiLFxuICAgICAgYWxpZ25JdGVtczogXCJmbGV4LWVuZFwiLFxuICAgICAgcGFkZGluZzogXCIwcHggOHB4IDRweCA4cHhcIixcbiAgICB9O1xuICB9O1xuICB3cmFwcGVyU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9O1xuICBsaXN0U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5zaG93U21hcnRSZXBseSA/IFwiOTIlXCIgOiBcIjEwMCVcIixcbiAgICB9O1xuICB9O1xuICAvKipcbiAgICogU3R5bGluZyBmb3IgcmVhY3Rpb25zIGNvbXBvbmVudFxuICAgKlxuICAgKi9cbiAgZ2V0UmVhY3Rpb25zV3JhcHBlclN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCBhbGlnbm1lbnQgPSB0aGlzLnNldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKTtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgcGFkZGluZ1RvcDogXCI1cHhcIixcbiAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIG1hcmdpblRvcDogXCItOXB4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDpcbiAgICAgICAgYWxpZ25tZW50ID09PSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQgPyBcImZsZXgtc3RhcnRcIiA6IFwiZmxleC1lbmRcIixcbiAgICB9O1xuICB9XG4gIC8qKlxuICAgKiBTdHlsaW5nIGZvciB1bnJlYWQgdGhyZWFkIHJlcGxpZXNcbiAgICogQHJldHVybnMgTGFiZWxTdHlsZVxuICAgKi9cbiAgZ2V0VW5yZWFkUmVwbGllc0NvdW50U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMHB4XCIsXG4gICAgICB3aWR0aDogXCIxNXB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMTVweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlVbnJlYWRCYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlVbnJlYWRUZXh0Q29sb3IsXG4gICAgICBmb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VW5yZWFkVGV4dEZvbnQsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICB9O1xuICB9O1xuICBnZXRUaHJlYWRWaWV3QWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiB7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OlxuICAgICAgICB0aGlzLmlzU2VudEJ5TWUobWVzc2FnZSkgJiZcbiAgICAgICAgICB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5zdGFuZGFyZFxuICAgICAgICAgID8gXCJmbGV4LWVuZFwiXG4gICAgICAgICAgOiBcImZsZXgtc3RhcnRcIixcbiAgICB9O1xuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X193cmFwcGVyXCIgW25nU3R5bGVdPVwid3JhcHBlclN0eWxlKClcIlxuICAqbmdJZj1cIiFvcGVuQ29udGFjdHNWaWV3XCI+XG5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9faGVhZGVyLXZpZXdcIj5cbiAgICA8ZGl2ICpuZ0lmPVwiaGVhZGVyVmlld1wiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImhlYWRlclZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdFwiICNsaXN0U2Nyb2xsXG4gICAgW25nU3R5bGVdPVwie2hlaWdodDogc2hvd1NtYXJ0UmVwbHkgfHwgc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgfHwgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPyAnOTIlJyA6ICcxMDAlJ31cIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X190b3BcIiAjdG9wPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RlY29yYXRvci1tZXNzYWdlXCJcbiAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgfHwgc3RhdGUgPT0gc3RhdGVzLmVycm9yICB8fCBzdGF0ZSA9PSBzdGF0ZXMuZW1wdHkgXCJcbiAgICAgIFtuZ1N0eWxlXT1cIm1lc3NhZ2VDb250YWluZXJTdHlsZSgpXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19sb2FkaW5nLXZpZXdcIlxuICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5sb2FkaW5nIFwiPlxuICAgICAgICA8Y29tZXRjaGF0LWxvYWRlciBbaWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiXG4gICAgICAgICAgW2xvYWRlclN0eWxlXT1cImxvYWRpbmdTdHlsZVwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1sb2FkZXI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jdXN0b212aWV3LS1sb2FkaW5nXCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5sb2FkaW5nICAmJiBsb2FkaW5nU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImxvYWRpbmdTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19lcnJvci12aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgICYmICFoaWRlRXJyb3IgXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW2xhYmVsU3R5bGVdPVwiZXJyb3JTdHlsZSgpXCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lcnJvciAmJiAhZXJyb3JTdGF0ZVZpZXdcIlxuICAgICAgICAgIFt0ZXh0XT1cImVycm9yU3RhdGVUZXh0XCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY3VzdG9tLXZpZXctLWVycm9yXCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lcnJvciAgJiYgZXJyb3JTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZXJyb3JTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19lbXB0eS12aWV3XCIgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZW1wdHlcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2N1c3RvbS12aWV3LS1lbXB0eVwiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZW1wdHkgJiYgZW1wdHlTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZW1wdHlTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlXCJcbiAgICAgICpuZ0Zvcj1cImxldCBtZXNzYWdlIG9mIG1lc3NhZ2VzTGlzdDsgbGV0IGkgPSBpbmRleFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGF0ZS1jb250YWluZXJcIlxuICAgICAgICAqbmdJZj1cIihpID09PSAwKSAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbdGltZXN0YW1wXT1cIm1lc3NhZ2UhLmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtwYXR0ZXJuXT1cIkRhdGVTZXBhcmF0b3JQYXR0ZXJuXCIgW2RhdGVTdHlsZV09XCJkYXRlU2VwYXJhdG9yU3R5bGVcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGUtY29udGFpbmVyXCJcbiAgICAgICAgKm5nSWY9XCIoaSA+IDAgJiYgaXNEYXRlRGlmZmVyZW50KG1lc3NhZ2VzTGlzdFtpIC0gMV0/LmdldFNlbnRBdCgpLCBtZXNzYWdlc0xpc3RbaV0/LmdldFNlbnRBdCgpKSkgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICBbcGF0dGVybl09XCJEYXRlU2VwYXJhdG9yUGF0dGVyblwiIFtkYXRlU3R5bGVdPVwiZGF0ZVNlcGFyYXRvclN0eWxlXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cIiFnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCIgI21lc3NhZ2VCdWJibGVSZWZcbiAgICAgICAgW2lkXT1cIm1lc3NhZ2U/LmdldElkKClcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZVxuICAgICAgICAgIFtsZWFkaW5nVmlld109XCIgc2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiXG4gICAgICAgICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgICAgICAgW3N0YXR1c0luZm9WaWV3XT1cInNob3dTdGF0dXNJbmZvKG1lc3NhZ2UpID8gIHN0YXR1c0luZm9WaWV3IDogbnVsbFwiXG4gICAgICAgICAgW2hlYWRlclZpZXddPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKSB8fCBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpID8gYnViYmxlSGVhZGVyIDogbnVsbFwiXG4gICAgICAgICAgW2Zvb3RlclZpZXddPVwiZ2V0Rm9vdGVyVmlldyhtZXNzYWdlKSB8fCByZWFjdGlvblZpZXdcIlxuICAgICAgICAgIFtjb250ZW50Vmlld109XCJjb250ZW50Vmlld1wiIFt0aHJlYWRWaWV3XT1cInRocmVhZFZpZXdcIlxuICAgICAgICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpIHx8IG1lc3NhZ2U/LmdldE11aWQoKVwiXG4gICAgICAgICAgW29wdGlvbnNdPVwic2V0TWVzc2FnZU9wdGlvbnMobWVzc2FnZSlcIlxuICAgICAgICAgIFttZXNzYWdlQnViYmxlU3R5bGVdPVwic2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICBbYWxpZ25tZW50XT1cInNldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKVwiPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjcmVhY3Rpb25WaWV3PlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWFjdGlvbnNcbiAgICAgICAgICAgICAgKm5nSWY9XCJtZXNzYWdlLmdldFJlYWN0aW9ucygpICYmIG1lc3NhZ2UuZ2V0UmVhY3Rpb25zKCkubGVuZ3RoID4gMCAmJiAhZGlzYWJsZVJlYWN0aW9uc1wiXG4gICAgICAgICAgICAgIFttZXNzYWdlT2JqZWN0XT1cImdldENsb25lZFJlYWN0aW9uT2JqZWN0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW2FsaWdubWVudF09XCJzZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25zU3R5bGVdPVwiZ2V0UmVhY3Rpb25zU3R5bGUoKVwiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkNsaWNrXT1cImFkZFJlYWN0aW9uT25DbGlja1wiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXT1cImdldFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24oKVwiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkluZm9Db25maWd1cmF0aW9uXT1cImdldFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oKVwiPjwvY29tZXRjaGF0LXJlYWN0aW9ucz5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3RhdHVzSW5mb1ZpZXc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtc3RhdHVzLWluZm9cIlxuICAgICAgICAgICAgICBbbmdTdHlsZV09XCJnZXRTdGF0dXNJbmZvU3R5bGUobWVzc2FnZSlcIj5cbiAgICAgICAgICAgICAgPGRpdiAqbmdJZj1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO2Vsc2UgYnViYmxlRm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlRm9vdGVyPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1kYXRlXCJcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0uYm90dG9tICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiAhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+XG4gICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAgICAgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIj5cbiAgICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCIgIW1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpICYmICAhZGlzYWJsZVJlY2VpcHQgJiYgKCFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpID09IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGxcIlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3JlY2VpcHRcIj5cbiAgICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtcmVjZWlwdCBbcmVjZWlwdF09XCJnZXRNZXNzYWdlUmVjZWlwdChtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAgIFtyZWNlaXB0U3R5bGVdPVwiZ2V0UmVjZWlwdFN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAgICAgW3dhaXRJY29uXT1cIndhaXRJY29uXCIgW3NlbnRJY29uXT1cInNlbnRJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgW2RlbGl2ZXJlZEljb25dPVwiZGVsaXZlcmVkSWNvblwiIFtyZWFkSWNvbl09XCJyZWFkSWNvblwiXG4gICAgICAgICAgICAgICAgICAgIFtlcnJvckljb25dPVwiZXJyb3JJY29uXCI+PC9jb21ldGNoYXQtcmVjZWlwdD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNsZWFkaW5nVmlldz5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgKm5nSWY9XCIgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSlcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hdmF0YXIgW25hbWVdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgICAgICAgICAgICBbaW1hZ2VdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldEF2YXRhcigpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWF2YXRhcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNidWJibGVIZWFkZXI+XG4gICAgICAgICAgICA8ZGl2ICpuZ0lmPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtlbHNlIGRlZmF1bHRIZWFkZXJcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdEhlYWRlcj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLWhlYWRlclwiXG4gICAgICAgICAgICAgICAgKm5nSWY9XCJtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGxcIj5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwibGFiZWxTdHlsZVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiXG4gICAgICAgICAgICAgICAgICBbdGltZXN0YW1wXT1cIm1lc3NhZ2U/LmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0udG9wICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgPG5nLXRlbXBsYXRlICN0aHJlYWRWaWV3PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fdGhyZWFkcmVwbGllc1wiXG4gICAgICAgICAgICAgICpuZ0lmPVwibWVzc2FnZT8uZ2V0UmVwbHlDb3VudCgpICYmICFtZXNzYWdlLmdldERlbGV0ZWRBdCgpXCJcbiAgICAgICAgICAgICAgW25nU3R5bGVdPVwiZ2V0VGhyZWFkVmlld0FsaWdubWVudChtZXNzYWdlKVwiPlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtpY29uVVJMXT1cInRocmVhZEluZGljYXRvckljb25cIlxuICAgICAgICAgICAgICAgIFttaXJyb3JJY29uXT1cImdldFRocmVhZEljb25BbGlnbm1lbnQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJnZXRUaHJlYWRWaWV3U3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuVGhyZWFkVmlldyhtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgW3RleHRdPSdnZXRUaHJlYWRDb3VudChtZXNzYWdlKSc+XG4gICAgICAgICAgICAgICAgPCEtLSA8c3BhbiBzbG90PVwiYnV0dG9uVmlld1wiIFtuZ1N0eWxlXT1cImdldFVucmVhZFJlcGxpZXNDb3VudFN0eWxlKClcIlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3VucmVhZC10aHJlYWRcIlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlLmdldFVucmVhZFJlcGx5Q291bnQoKSA+IDBcIj5cbiAgICAgICAgICAgICAgICAgIHt7bWVzc2FnZS5nZXRVbnJlYWRSZXBseUNvdW50KCl9fVxuICAgICAgICAgICAgICAgIDwvc3Bhbj4gLS0+XG5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8L2NvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2JvdHRvbVwiICNib3R0b20+XG4gICAgPC9kaXY+XG5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX21lc3NhZ2UtaW5kaWNhdG9yXCJcbiAgICAqbmdJZj1cIlVucmVhZENvdW50ICYmIFVucmVhZENvdW50Lmxlbmd0aCA+IDAgJiYgIWlzT25Cb3R0b21cIlxuICAgIFtuZ1N0eWxlXT1cIntib3R0b206IHNob3dTbWFydFJlcGx5IHx8IGZvb3RlclZpZXcgfHwgc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgfHwgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgID8gJzIwJScgOiAnMTMlJ31cIj5cbiAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbdGV4dF09XCJuZXdNZXNzYWdlQ291bnRcIlxuICAgICAgW2J1dHRvblN0eWxlXT1cInVucmVhZE1lc3NhZ2VzU3R5bGVcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cInNjcm9sbFRvQm90dG9tKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19mb290ZXItdmlld1wiIFtuZ1N0eWxlXT1cIntoZWlnaHQ6ICAnYXV0byd9XCI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwiZm9vdGVyVmlldztlbHNlIGZvb3RlclwiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImZvb3RlclZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxuZy10ZW1wbGF0ZSAjZm9vdGVyPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19zbWFydC1yZXBsaWVzXCJcbiAgICAgICAgKm5nSWY9XCIhc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgJiYgc2hvd1NtYXJ0UmVwbHkgJiYgZ2V0UmVwbGllcygpXCI+XG4gICAgICAgIDxzbWFydC1yZXBsaWVzIFtzbWFydFJlcGx5U3R5bGVdPVwic21hcnRSZXBseVN0eWxlXCJcbiAgICAgICAgICBbcmVwbGllc109XCJnZXRSZXBsaWVzKClcIiAoY2MtcmVwbHktY2xpY2tlZCk9XCJzZW5kUmVwbHkoJGV2ZW50KVwiXG4gICAgICAgICAgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VTbWFydFJlcGx5KClcIj5cbiAgICAgICAgPC9zbWFydC1yZXBsaWVzPlxuICAgICAgPC9kaXY+XG5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY29udmVyc2F0aW9uLXN0YXJ0ZXJzXCJcbiAgICAgICAgKm5nSWY9XCJlbmFibGVDb252ZXJzYXRpb25TdGFydGVyICYmIHNob3dDb252ZXJzYXRpb25TdGFydGVyXCI+XG4gICAgICAgIDxjb21ldGNoYXQtYWktY2FyZCBbc3RhdGVdPVwiY29udmVyc2F0aW9uU3RhcnRlclN0YXRlXCJcbiAgICAgICAgICBbbG9hZGluZ1N0YXRlVGV4dF09XCJzdGFydGVyTG9hZGluZ1N0YXRlVGV4dFwiXG4gICAgICAgICAgW2VtcHR5U3RhdGVUZXh0XT1cInN0YXJ0ZXJFbXB0eVN0YXRlVGV4dFwiXG4gICAgICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCI+XG4gICAgICAgICAgPHNtYXJ0LXJlcGxpZXNcbiAgICAgICAgICAgICpuZ0lmPVwiY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID09IHN0YXRlcy5sb2FkZWQgJiYgIXBhcmVudE1lc3NhZ2VJZFwiXG4gICAgICAgICAgICBbc21hcnRSZXBseVN0eWxlXT1cImNvbnZlcnNhdGlvblN0YXJ0ZXJTdHlsZVwiXG4gICAgICAgICAgICBbcmVwbGllc109XCJjb252ZXJzYXRpb25TdGFydGVyUmVwbGllc1wiIHNsb3Q9XCJsb2FkZWRWaWV3XCJcbiAgICAgICAgICAgIChjYy1yZXBseS1jbGlja2VkKT1cInNlbmRDb252ZXJzYXRpb25TdGFydGVyKCRldmVudClcIlxuICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCInJ1wiPlxuICAgICAgICAgIDwvc21hcnQtcmVwbGllcz5cbiAgICAgICAgPC9jb21ldGNoYXQtYWktY2FyZD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jb252ZXJzYXRpb24tc3VtbWFyeVwiXG4gICAgICAgICpuZ0lmPVwiZW5hYmxlQ29udmVyc2F0aW9uU3VtbWFyeSAmJiBzaG93Q29udmVyc2F0aW9uU3VtbWFyeVwiPlxuXG4gICAgICAgIDxjb21ldGNoYXQtYWktY2FyZCBbc3RhdGVdPVwiY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlXCJcbiAgICAgICAgICBbbG9hZGluZ1N0YXRlVGV4dF09XCJzdW1tYXJ5TG9hZGluZ1N0YXRlVGV4dFwiXG4gICAgICAgICAgW2VtcHR5U3RhdGVUZXh0XT1cInN1bW1hcnlFbXB0eVN0YXRlVGV4dFwiXG4gICAgICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCIgW2Vycm9ySWNvblVSTF09XCJhaUVycm9ySWNvblwiXG4gICAgICAgICAgW2VtcHR5SWNvblVSTF09XCJhaUVtcHR5SWNvblwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcGFuZWxcbiAgICAgICAgICAgICpuZ0lmPVwiY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID09IHN0YXRlcy5sb2FkZWQgJiYgIXBhcmVudE1lc3NhZ2VJZFwiXG4gICAgICAgICAgICBzbG90PVwibG9hZGVkVmlld1wiIFtwYW5lbFN0eWxlXT1cImNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZVwiXG4gICAgICAgICAgICB0aXRsZT1cIkNvbnZlcnNhdGlvbiBTdW1tYXJ5XCIgW3RleHRdPVwiY29udmVyc2F0aW9uU3VtbWFyeVwiXG4gICAgICAgICAgICAoY2MtY2xvc2UtY2xpY2tlZCk9XCJjbG9zZUNvbnZlcnNhdGlvblN1bW1hcnkoKVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBhbmVsPlxuICAgICAgICA8L2NvbWV0Y2hhdC1haS1jYXJkPlxuXG4gICAgICA8L2Rpdj5cblxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvZGl2PlxuXG48L2Rpdj5cbjwhLS0gZGVmYXVsdCBidWJibGVzIC0tPlxuPG5nLXRlbXBsYXRlICN0ZXh0QnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgKm5nSWY9XCJtZXNzYWdlPy50eXBlID09IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwibWVzc2FnZT8ubWVzc2FnZVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8Y29tZXRjaGF0LXRleHQtYnViYmxlICpuZ0lmPVwibWVzc2FnZT8uZ2V0RGVsZXRlZEF0KClcIlxuICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJsb2NhbGl6ZSgnTUVTU0FHRV9JU19ERUxFVEVEJylcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICpuZ0lmPVwiIWlzVHJhbnNsYXRlZChtZXNzYWdlKSAmJiAhZ2V0TGlua1ByZXZpZXcobWVzc2FnZSkgJiYgIW1lc3NhZ2U/LmRlbGV0ZWRBdCAmJiBtZXNzYWdlPy50eXBlICE9IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiIFt0ZXh0XT1cImdldFRleHRNZXNzYWdlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPGxpbmstcHJldmlldyBbbGlua1ByZXZpZXdTdHlsZV09XCJsaW5rUHJldmlld1N0eWxlXCJcbiAgICAoY2MtbGluay1jbGlja2VkKT1cIm9wZW5MaW5rVVJMKCRldmVudClcIlxuICAgICpuZ0lmPVwiIW1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpICYmIGdldExpbmtQcmV2aWV3KG1lc3NhZ2UpICYmIGVuYWJsZUxpbmtQcmV2aWV3XCJcbiAgICBbdGl0bGVdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCd0aXRsZScsbWVzc2FnZSlcIlxuICAgIFtkZXNjcmlwdGlvbl09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ2Rlc2NyaXB0aW9uJyxtZXNzYWdlKVwiXG4gICAgW1VSTF09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ3VybCcsbWVzc2FnZSlcIlxuICAgIFtpbWFnZV09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ2ltYWdlJyxtZXNzYWdlKVwiXG4gICAgW2Zhdkljb25VUkxdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCdmYXZpY29uJyxtZXNzYWdlKVwiPlxuICAgIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAgICpuZ0lmPVwiIWlzVHJhbnNsYXRlZChtZXNzYWdlKSAmJiBnZXRMaW5rUHJldmlldyhtZXNzYWdlKSAmJiAhbWVzc2FnZT8uZGVsZXRlZEF0ICYmIG1lc3NhZ2U/LnR5cGUgIT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIiBbdGV4dF09XCJnZXRUZXh0TWVzc2FnZShtZXNzYWdlKVwiXG4gICAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPC9saW5rLXByZXZpZXc+XG4gIDxtZXNzYWdlLXRyYW5zbGF0aW9uLWJ1YmJsZSBbYWxpZ25tZW50XT1cImdldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKVwiXG4gICAgKm5nSWY9XCJpc1RyYW5zbGF0ZWQobWVzc2FnZSlcIlxuICAgIFttZXNzYWdlVHJhbnNsYXRpb25TdHlsZV09XCJzZXRUcmFuc2xhdGlvblN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdHJhbnNsYXRlZFRleHRdPVwiaXNUcmFuc2xhdGVkKG1lc3NhZ2UpXCJcbiAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj5cbiAgICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgICAqbmdJZj1cIiAhbWVzc2FnZT8uZGVsZXRlZEF0ICYmIG1lc3NhZ2U/LnR5cGUgIT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIiBbdGV4dF09XCJtZXNzYWdlPy50ZXh0XCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuXG4gIDwvbWVzc2FnZS10cmFuc2xhdGlvbi1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNmaWxlQnViYmxlIGxldC1tZXNzYWdlPlxuXG4gIDxjb21ldGNoYXQtZmlsZS1idWJibGUgW2ZpbGVTdHlsZV09XCJzZXRGaWxlQnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFtkb3dubG9hZEljb25VUkxdPVwiZG93bmxvYWRJY29uVVJMXCIgW3N1YnRpdGxlXT1cImxvY2FsaXplKCdTSEFSRURfRklMRScpXCJcbiAgICBbdGl0bGVdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8ubmFtZTogJydcIlxuICAgIFtmaWxlVVJMXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybCA6ICcnXCI+PC9jb21ldGNoYXQtZmlsZS1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNhdWRpb0J1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbZGlzYWJsZWRdPVwidHJ1ZVwiXG4gICAgKm5nSWY9XCJtZXNzYWdlPy5jYXRlZ29yeSA9PSBjYWxsQ29uc3RhbnQgJiYgbWVzc2FnZT8udHlwZSA9PSBNZXNzYWdlVHlwZXNDb25zdGFudC5hdWRpb1wiXG4gICAgW2ljb25VUkxdPVwiZ2V0Q2FsbFR5cGVJY29uKG1lc3NhZ2UpXCJcbiAgICBbYnV0dG9uU3R5bGVdPVwiY2FsbFN0YXR1c1N0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJnZXRDYWxsQWN0aW9uTWVzc2FnZShtZXNzYWdlKVwiPjwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICA8Y29tZXRjaGF0LWF1ZGlvLWJ1YmJsZVxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZT8uY2F0ZWdvcnkgIT0gY2FsbENvbnN0YW50XCJcbiAgICBbc3JjXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybCA6ICcnXCI+XG4gIDwvY29tZXRjaGF0LWF1ZGlvLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3ZpZGVvQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtkaXNhYmxlZF09XCJ0cnVlXCJcbiAgICAqbmdJZj1cIm1lc3NhZ2U/LmNhdGVnb3J5ID09IGNhbGxDb25zdGFudCAmJiBtZXNzYWdlPy50eXBlID09IE1lc3NhZ2VUeXBlc0NvbnN0YW50LnZpZGVvXCJcbiAgICBbaWNvblVSTF09XCJnZXRDYWxsVHlwZUljb24obWVzc2FnZSlcIlxuICAgIFtidXR0b25TdHlsZV09XCJjYWxsU3RhdHVzU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cImdldENhbGxBY3Rpb25NZXNzYWdlKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG5cbiAgPGNvbWV0Y2hhdC12aWRlby1idWJibGVcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIG1lc3NhZ2U/LmNhdGVnb3J5ICE9IGNhbGxDb25zdGFudFwiXG4gICAgW3ZpZGVvU3R5bGVdPVwidmlkZW9CdWJibGVTdHlsZVwiXG4gICAgW3NyY109XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmwgOiAnJ1wiXG4gICAgW3Bvc3Rlcl09XCIgZ2V0SW1hZ2VUaHVtYm5haWwobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC12aWRlby1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNpbWFnZUJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGltYWdlLW1vZGVyYXRpb24gKGNjLXNob3ctZGlhbG9nKT1cIm9wZW5XYXJuaW5nRGlhbG9nKCRldmVudClcIlxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgZW5hYmxlSW1hZ2VNb2RlcmF0aW9uXCIgW21lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2ltYWdlTW9kZXJhdGlvblN0eWxlXT1cImltYWdlTW9kZXJhdGlvblN0eWxlXCI+XG4gICAgPGNvbWV0Y2hhdC1pbWFnZS1idWJibGUgKGNjLWltYWdlLWNsaWNrZWQpPVwib3BlbkltYWdlSW5GdWxsU2NyZWVuKG1lc3NhZ2UpXCJcbiAgICAgIFtpbWFnZVN0eWxlXT1cImltYWdlQnViYmxlU3R5bGVcIiBbc3JjXT1cIiBnZXRJbWFnZVRodW1ibmFpbChtZXNzYWdlKVwiXG4gICAgICBbcGxhY2Vob2xkZXJJbWFnZV09XCJwbGFjZWhvbGRlckljb25VUkxcIj48L2NvbWV0Y2hhdC1pbWFnZS1idWJibGU+XG4gIDwvaW1hZ2UtbW9kZXJhdGlvbj5cbiAgPGNvbWV0Y2hhdC1pbWFnZS1idWJibGUgW2ltYWdlU3R5bGVdPVwiaW1hZ2VCdWJibGVTdHlsZVwiXG4gICAgKGNjLWltYWdlLWNsaWNrZWQpPVwib3BlbkltYWdlSW5GdWxsU2NyZWVuKG1lc3NhZ2UpXCJcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmICFlbmFibGVJbWFnZU1vZGVyYXRpb25cIlxuICAgIFtzcmNdPVwiIGdldEltYWdlVGh1bWJuYWlsKG1lc3NhZ2UpXCJcbiAgICBbcGxhY2Vob2xkZXJJbWFnZV09XCJwbGFjZWhvbGRlckljb25VUkxcIj48L2NvbWV0Y2hhdC1pbWFnZS1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNmb3JtQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWZvcm0tYnViYmxlIFttZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtmb3JtQnViYmxlU3R5bGVdPVwiZ2V0Rm9ybU1lc3NhZ2VCdWJibGVTdHlsZSgpXCI+PC9jb21ldGNoYXQtZm9ybS1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNjYXJkQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWNhcmQtYnViYmxlIFttZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtjYXJkQnViYmxlU3R5bGVdPVwiZ2V0Q2FyZE1lc3NhZ2VCdWJibGVTdHlsZSgpXCI+PC9jb21ldGNoYXQtY2FyZC1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNjdXN0b21UZXh0QnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjc3RpY2tlckJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1pbWFnZS1idWJibGUgW3NyY109XCJnZXRTdGlja2VyKG1lc3NhZ2UpXCJcbiAgICBbaW1hZ2VTdHlsZV09XCJpbWFnZUJ1YmJsZVN0eWxlXCI+PC9jb21ldGNoYXQtaW1hZ2UtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICN3aGl0ZWJvYXJkQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZSBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiXG4gICAgW2ljb25BbGlnbm1lbnRdPVwiZG9jdW1lbnRCdWJibGVBbGlnbm1lbnRcIlxuICAgIFtkb2N1bWVudFN0eWxlXT1cImRvY3VtZW50QnViYmxlU3R5bGVcIiBbVVJMXT1cImdldFdoaXRlYm9hcmREb2N1bWVudChtZXNzYWdlKVwiXG4gICAgW2NjQ2xpY2tlZF09XCJsYXVuY2hDb2xsYWJvcmF0aXZlV2hpdGVib2FyZERvY3VtZW50XCJcbiAgICBbaWNvblVSTF09XCJ3aGl0ZWJvYXJkSWNvblVSTFwiIFt0aXRsZV09XCJ3aGl0ZWJvYXJkVGl0bGVcIlxuICAgIFtidXR0b25UZXh0XT1cIndoaXRlYm9hcmRCdXR0b25UZXh0XCJcbiAgICBbc3VidGl0bGVdPVwid2hpdGVib2FyZFN1Yml0bGVcIj48L2NvbWV0Y2hhdC1kb2N1bWVudC1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2RvY3VtZW50QnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZSBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiXG4gICAgW2ljb25BbGlnbm1lbnRdPVwiZG9jdW1lbnRCdWJibGVBbGlnbm1lbnRcIlxuICAgIFtkb2N1bWVudFN0eWxlXT1cImRvY3VtZW50QnViYmxlU3R5bGVcIiBbVVJMXT1cImdldFdoaXRlYm9hcmREb2N1bWVudChtZXNzYWdlKVwiXG4gICAgW2NjQ2xpY2tlZF09XCJsYXVuY2hDb2xsYWJvcmF0aXZlV2hpdGVib2FyZERvY3VtZW50XCJcbiAgICBbaWNvblVSTF09XCJkb2N1bWVudEljb25VUkxcIiBbdGl0bGVdPVwiZG9jdW1lbnRUaXRsZVwiXG4gICAgW2J1dHRvblRleHRdPVwiZG9jdW1lbnRCdXR0b25UZXh0XCJcbiAgICBbc3VidGl0bGVdPVwiZG9jdW1lbnRTdWJpdGxlXCI+PC9jb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNkaXJlY3RDYWxsaW5nIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZSBbaGlkZVNlcGFyYXRvcl09XCJ0cnVlXCJcbiAgICBbaWNvbkFsaWdubWVudF09XCJjYWxsQnViYmxlQWxpZ25tZW50XCJcbiAgICBbZG9jdW1lbnRTdHlsZV09XCJnZXRDYWxsQnViYmxlU3R5bGUobWVzc2FnZSlcIiBbVVJMXT1cImdldFNlc3Npb25JZChtZXNzYWdlKVwiXG4gICAgW2NjQ2xpY2tlZF09XCJnZXRTdGFydENhbGxGdW5jdGlvbihtZXNzYWdlKVwiIFtpY29uVVJMXT1cImRpcmVjdENhbGxJY29uVVJMXCJcbiAgICBbdGl0bGVdPVwiZ2V0Q2FsbEJ1YmJsZVRpdGxlKG1lc3NhZ2UpXCIgW2J1dHRvblRleHRdPVwiam9pbkNhbGxCdXR0b25UZXh0XCJcbiAgICAqbmdJZj1cIm1lc3NhZ2UuY2F0ZWdvcnkgPT0gJ2N1c3RvbSdcIj48L2NvbWV0Y2hhdC1kb2N1bWVudC1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3NjaGVkdWxlckJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1zY2hlZHVsZXItYnViYmxlIFtzY2hlZHVsZXJNZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtsb2dnZWRJblVzZXJdPVwibG9nZ2VkSW5Vc2VyXCJcbiAgICBbc2NoZWR1bGVyQnViYmxlU3R5bGVdPVwiZ2V0U2NoZWR1bGVyQnViYmxlU3R5bGUobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC1zY2hlZHVsZXItYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNwb2xsQnViYmxlIGxldC1tZXNzYWdlPlxuICA8cG9sbHMtYnViYmxlIFtwb2xsU3R5bGVdPVwicG9sbEJ1YmJsZVN0eWxlXCJcbiAgICBbcG9sbFF1ZXN0aW9uXT1cImdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2UsJ3F1ZXN0aW9uJylcIlxuICAgIFtwb2xsSWRdPVwiZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZSwnaWQnKVwiIFtsb2dnZWRJblVzZXJdPVwibG9nZ2VkSW5Vc2VyXCJcbiAgICBbc2VuZGVyVWlkXT1cImdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2UpXCJcbiAgICBbbWV0YWRhdGFdPVwibWVzc2FnZT8ubWV0YWRhdGFcIj48L3BvbGxzLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cblxuPCEtLSB0aHJlYWQgYnViYmxlIHZpZXcgLS0+XG48bmctdGVtcGxhdGUgI3RocmVhZE1lc3NhZ2VCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxkaXYgKm5nSWY9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCI+XG4gICAgPG5nLWNvbnRhaW5lclxuICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuICA8L2Rpdj5cbiAgPGNvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZSAqbmdJZj1cIiFnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCJcbiAgICBbYm90dG9tVmlld109XCJnZXRCb3R0b21WaWV3KG1lc3NhZ2UpXCJcbiAgICBbc3RhdHVzSW5mb1ZpZXddPVwic2hvd1N0YXR1c0luZm8obWVzc2FnZSkgPyAgc3RhdHVzSW5mb1ZpZXcgOiBudWxsXCJcbiAgICBbbGVhZGluZ1ZpZXddPVwiIHNob3dBdmF0YXIgPyBsZWFkaW5nVmlldyA6IG51bGxcIiBbaGVhZGVyVmlld109XCJidWJibGVIZWFkZXJcIlxuICAgIFtmb290ZXJWaWV3XT1cImdldEZvb3RlclZpZXcobWVzc2FnZSlcIiBbY29udGVudFZpZXddPVwiY29udGVudFZpZXdcIlxuICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpIHx8IG1lc3NhZ2U/LmdldE11aWQoKVwiXG4gICAgW21lc3NhZ2VCdWJibGVTdHlsZV09XCJzZXRNZXNzYWdlQnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFthbGlnbm1lbnRdPVwidGhyZWFkZWRBbGlnbm1lbnRcIj5cbiAgICA8bmctdGVtcGxhdGUgI2NvbnRlbnRWaWV3PlxuICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldENvbnRlbnRWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI3N0YXR1c0luZm9WaWV3PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLXN0YXR1cy1pbmZvXCJcbiAgICAgICAgW25nU3R5bGVdPVwiZ2V0U3RhdHVzSW5mb1N0eWxlKG1lc3NhZ2UpXCI+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtlbHNlIGJ1YmJsZUZvb3RlclwiPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUZvb3Rlcj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtZGF0ZVwiXG4gICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLmJvdHRvbSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICpuZ0lmPVwiICFtZXNzYWdlPy5nZXREZWxldGVkQXQoKSAmJiAgIWRpc2FibGVSZWNlaXB0ICYmICghbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHx0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSA9PSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkpICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19yZWNlaXB0XCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LXJlY2VpcHQgW3JlY2VpcHRdPVwiZ2V0TWVzc2FnZVJlY2VpcHQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cImdldFJlY2VpcHRTdHlsZShtZXNzYWdlKVwiIFt3YWl0SWNvbl09XCJ3YWl0SWNvblwiXG4gICAgICAgICAgICAgIFtzZW50SWNvbl09XCJzZW50SWNvblwiIFtkZWxpdmVyZWRJY29uXT1cIlwiXG4gICAgICAgICAgICAgIFtyZWFkSWNvbl09XCJkZWxpdmVyZWRJY29uXCJcbiAgICAgICAgICAgICAgW2Vycm9ySWNvbl09XCJlcnJvckljb25cIj48L2NvbWV0Y2hhdC1yZWNlaXB0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2xlYWRpbmdWaWV3PlxuICAgICAgPGRpdlxuICAgICAgICAqbmdJZj1cIiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpXCI+XG4gICAgICAgIDxjb21ldGNoYXQtYXZhdGFyIFtuYW1lXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICAgICAgW2ltYWdlXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRBdmF0YXIoKVwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICA8L2Rpdj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlSGVhZGVyPlxuICAgICAgPGRpdiAqbmdJZj1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7ZWxzZSBkZWZhdWx0SGVhZGVyXCI+XG4gICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRIZWFkZXI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1oZWFkZXJcIlxuICAgICAgICAgICpuZ0lmPVwibWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImxhYmVsU3R5bGVcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIlxuICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLnRvcCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8L25nLXRlbXBsYXRlPlxuICA8L2NvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cblxuXG48IS0tICAtLT5cbjxjb21ldGNoYXQtcG9wb3ZlciBbcG9wb3ZlclN0eWxlXT1cInBvcG92ZXJTdHlsZVwiICNwb3BvdmVyUmVmXG4gIFtwbGFjZW1lbnRdPVwia2V5Ym9hcmRBbGlnbm1lbnRcIj5cbiAgPGNvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZCAoY2MtZW1vamktY2xpY2tlZCk9XCJhZGRSZWFjdGlvbigkZXZlbnQpXCJcbiAgICBzbG90PVwiY29udGVudFwiXG4gICAgW2Vtb2ppS2V5Ym9hcmRTdHlsZV09XCJlbW9qaUtleWJvYXJkU3R5bGVcIj48L2NvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZD5cbjwvY29tZXRjaGF0LXBvcG92ZXI+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwib3BlbkNvbmZpcm1EaWFsb2dcIiBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCI+XG4gIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cIicnXCIgW21lc3NhZ2VUZXh0XT1cIndhcm5pbmdUZXh0XCJcbiAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uQ29uZmlybUNsaWNrKClcIiBbY2FuY2VsQnV0dG9uVGV4dF09XCJjYW5jZWxUZXh0XCJcbiAgICBbY29uZmlybUJ1dHRvblRleHRdPVwiY29uZmlybVRleHRcIiAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImNvbmZpcm1EaWFsb2dTdHlsZVwiPlxuXG4gIDwvY29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG48Y29tZXRjaGF0LWZ1bGwtc2NyZWVuLXZpZXdlciAoY2MtY2xvc2UtY2xpY2tlZCk9XCJjbG9zZUltYWdlSW5GdWxsU2NyZWVuKClcIlxuICAqbmdJZj1cIm9wZW5GdWxsc2NyZWVuVmlld1wiIFtVUkxdPVwiaW1hZ2V1cmxUb09wZW5cIlxuICBbY2xvc2VJY29uVVJMXT1cImNsb3NlSWNvblVSTFwiIFtmdWxsU2NyZWVuVmlld2VyU3R5bGVdPVwiZnVsbFNjcmVlblZpZXdlclN0eWxlXCI+XG5cbjwvY29tZXRjaGF0LWZ1bGwtc2NyZWVuLXZpZXdlcj5cblxuPCEtLSBvbmdvaW5nIGNhbGxzY3JlZW4gZm9yIGRpcmVjdCBjYWxsIC0tPlxuPGNvbWV0Y2hhdC1vbmdvaW5nLWNhbGwgKm5nSWY9XCJzaG93T25nb2luZ0NhbGxcIlxuICBbY2FsbFNldHRpbmdzQnVpbGRlcl09XCJnZXRDYWxsQnVpbGRlcigpXCIgW29uZ29pbmdDYWxsU3R5bGVdPVwib25nb2luZ0NhbGxTdHlsZVwiXG4gIFtzZXNzaW9uSURdPVwic2Vzc2lvbklkXCI+PC9jb21ldGNoYXQtb25nb2luZy1jYWxsPlxuPCEtLSBtZXNzYWdlIGluZm9ybWF0aW9uIHZpZXcgLS0+XG48IS0tIHRocmVhZCBidWJibGUgdmlldyAtLT5cbjxuZy10ZW1wbGF0ZSAjbWVzc2FnZWluZm9CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxkaXYgKm5nSWY9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCI+XG4gICAgPG5nLWNvbnRhaW5lclxuICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuICA8L2Rpdj5cbiAgPGNvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZSAqbmdJZj1cIiFnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCJcbiAgICBbYm90dG9tVmlld109XCJnZXRCb3R0b21WaWV3KG1lc3NhZ2UpXCJcbiAgICBbc3RhdHVzSW5mb1ZpZXddPVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSlcIlxuICAgIFtmb290ZXJWaWV3XT1cImdldEZvb3RlclZpZXcobWVzc2FnZSlcIlxuICAgIFtsZWFkaW5nVmlld109XCJzaG93QXZhdGFyID8gbGVhZGluZ1ZpZXcgOiBudWxsXCIgW2hlYWRlclZpZXddPVwiYnViYmxlSGVhZGVyXCJcbiAgICBbY29udGVudFZpZXddPVwiY29udGVudFZpZXdcIiBbaWRdPVwibWVzc2FnZT8uZ2V0SWQoKSB8fCBtZXNzYWdlPy5nZXRNdWlkKClcIlxuICAgIFttZXNzYWdlQnViYmxlU3R5bGVdPVwic2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbYWxpZ25tZW50XT1cIm1lc3NhZ2VJbmZvQWxpZ25tZW50XCI+XG4gICAgPG5nLXRlbXBsYXRlICNjb250ZW50Vmlldz5cbiAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRDb250ZW50VmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNsZWFkaW5nVmlldz5cbiAgICAgIDxkaXZcbiAgICAgICAgKm5nSWY9XCIgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKVwiPlxuICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbbmFtZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICAgIFtpbWFnZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0QXZhdGFyKClcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUhlYWRlcj5cbiAgICAgIDxkaXYgKm5nSWY9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2Vsc2UgZGVmYXVsdEhlYWRlclwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0SGVhZGVyPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtaGVhZGVyXCJcbiAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJsYWJlbFN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS50b3AgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwib3Blbk1lc3NhZ2VJbmZvUGFnZVwiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNvbWV0Y2hhdC1tZXNzYWdlLWluZm9ybWF0aW9uXG4gICAgW2Nsb3NlSWNvblVSTF09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmNsb3NlSWNvblVSTFwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5sb2FkaW5nU3RhdGVWaWV3XCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5lcnJvclN0YXRlVmlld1wiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5saXN0SXRlbVN0eWxlXCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5lbXB0eVN0YXRlVmlld1wiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubG9hZGluZ0ljb25VUkxcIlxuICAgIFtyZWFkSWNvbl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLnJlYWRJY29uXCJcbiAgICBbZGVsaXZlcmVkSWNvbl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmRlbGl2ZXJlZEljb25cIlxuICAgIFtvbkVycm9yXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ub25FcnJvclwiXG4gICAgW1N1YnRpdGxlVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLnN1YnRpdGxlVmlld1wiXG4gICAgW3JlY2VpcHREYXRlUGF0dGVybl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLnJlY2VpcHREYXRlUGF0dGVyblwiXG4gICAgW2xpc3RJdGVtVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmxpc3RJdGVtVmlldyBcIlxuICAgIFttZXNzYWdlSW5mb3JtYXRpb25TdHlsZV09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLm1lc3NhZ2VJbmZvcm1hdGlvblN0eWxlXCJcbiAgICBbb25DbG9zZV09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLm9uQ2xvc2UgPz8gIGNsb3NlTWVzc2FnZUluZm9QYWdlXCJcbiAgICBbYnViYmxlVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmJ1YmJsZVZpZXcgPz8gbWVzc2FnZWluZm9CdWJibGVcIlxuICAgIFttZXNzYWdlXT1cIm1lc3NhZ2VJbmZvT2JqZWN0XCI+XG5cbiAgPC9jb21ldGNoYXQtbWVzc2FnZS1pbmZvcm1hdGlvbj5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuIl19