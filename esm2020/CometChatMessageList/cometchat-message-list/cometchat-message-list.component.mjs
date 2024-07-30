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
CometChatMessageListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageListComponent, selector: "cometchat-message-list", inputs: { hideError: "hideError", hideDateSeparator: "hideDateSeparator", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateView: "emptyStateView", errorStateText: "errorStateText", emptyStateText: "emptyStateText", loadingIconURL: "loadingIconURL", user: "user", group: "group", disableReceipt: "disableReceipt", disableSoundForMessages: "disableSoundForMessages", customSoundForMessages: "customSoundForMessages", readIcon: "readIcon", deliveredIcon: "deliveredIcon", sentIcon: "sentIcon", waitIcon: "waitIcon", errorIcon: "errorIcon", aiErrorIcon: "aiErrorIcon", aiEmptyIcon: "aiEmptyIcon", alignment: "alignment", showAvatar: "showAvatar", datePattern: "datePattern", timestampAlignment: "timestampAlignment", DateSeparatorPattern: "DateSeparatorPattern", templates: "templates", messagesRequestBuilder: "messagesRequestBuilder", newMessageIndicatorText: "newMessageIndicatorText", scrollToBottomOnNewMessages: "scrollToBottomOnNewMessages", thresholdValue: "thresholdValue", unreadMessageThreshold: "unreadMessageThreshold", reactionsConfiguration: "reactionsConfiguration", disableReactions: "disableReactions", emojiKeyboardStyle: "emojiKeyboardStyle", apiConfiguration: "apiConfiguration", onThreadRepliesClick: "onThreadRepliesClick", headerView: "headerView", footerView: "footerView", parentMessageId: "parentMessageId", threadIndicatorIcon: "threadIndicatorIcon", avatarStyle: "avatarStyle", backdropStyle: "backdropStyle", dateSeparatorStyle: "dateSeparatorStyle", messageListStyle: "messageListStyle", onError: "onError", messageInformationConfiguration: "messageInformationConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, viewQueries: [{ propertyName: "listScroll", first: true, predicate: ["listScroll"], descendants: true }, { propertyName: "bottom", first: true, predicate: ["bottom"], descendants: true }, { propertyName: "top", first: true, predicate: ["top"], descendants: true }, { propertyName: "textBubble", first: true, predicate: ["textBubble"], descendants: true }, { propertyName: "threadMessageBubble", first: true, predicate: ["threadMessageBubble"], descendants: true }, { propertyName: "fileBubble", first: true, predicate: ["fileBubble"], descendants: true }, { propertyName: "audioBubble", first: true, predicate: ["audioBubble"], descendants: true }, { propertyName: "videoBubble", first: true, predicate: ["videoBubble"], descendants: true }, { propertyName: "imageBubble", first: true, predicate: ["imageBubble"], descendants: true }, { propertyName: "formBubble", first: true, predicate: ["formBubble"], descendants: true }, { propertyName: "cardBubble", first: true, predicate: ["cardBubble"], descendants: true }, { propertyName: "stickerBubble", first: true, predicate: ["stickerBubble"], descendants: true }, { propertyName: "documentBubble", first: true, predicate: ["documentBubble"], descendants: true }, { propertyName: "whiteboardBubble", first: true, predicate: ["whiteboardBubble"], descendants: true }, { propertyName: "popoverRef", first: true, predicate: ["popoverRef"], descendants: true }, { propertyName: "directCalling", first: true, predicate: ["directCalling"], descendants: true }, { propertyName: "schedulerBubble", first: true, predicate: ["schedulerBubble"], descendants: true }, { propertyName: "pollBubble", first: true, predicate: ["pollBubble"], descendants: true }, { propertyName: "messageBubbleRef", predicate: ["messageBubbleRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n            *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"], components: [{ type: i2.CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: ["messageBubbleStyle", "alignment", "options", "id", "leadingView", "headerView", "replyView", "contentView", "threadView", "footerView", "bottomView", "statusInfoView", "moreIconURL", "topMenuSize"] }, { type: i3.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i4.CometChatMessageInformationComponent, selector: "cometchat-message-information", inputs: ["closeIconURL", "message", "title", "template", "bubbleView", "subtitleView", "listItemView", "receiptDatePattern", "onError", "messageInformationStyle", "readIcon", "deliveredIcon", "onClose", "listItemStyle", "emptyStateText", "errorStateText", "emptyStateView", "loadingIconURL", "loadingStateView", "errorStateView"] }], directives: [{ type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i5.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageListComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-list", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n            *ngIf=\" !message?.getDeletedAt() &&  !disableReceipt && (!message?.getSender() ||this.loggedInUser.getUid() == message?.getSender()?.getUid()) && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEVBU0wsU0FBUyxFQUNULFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsV0FBVyxFQUdYLGVBQWUsRUFDZixhQUFhLEVBRWIsU0FBUyxFQUVULGFBQWEsRUFHYixVQUFVLEVBQ1YsVUFBVSxFQUNWLGFBQWEsRUFHYixjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixpQkFBaUIsR0FDbEIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQ0wsYUFBYSxFQUNiLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsOEJBQThCLEVBQzlCLGdDQUFnQyxFQUNoQyxxQkFBcUIsRUFDckIsYUFBYSxFQUNiLHFCQUFxQixFQUNyQixlQUFlLEVBRWYsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQiwrQkFBK0IsRUFDL0IsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQiwyQkFBMkIsRUFDM0IsdUJBQXVCLEVBRXZCLG9CQUFvQixFQUVwQixxQkFBcUIsRUFFckIsNEJBQTRCLEVBQzVCLGNBQWMsRUFDZCx5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLGlC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QUE5QixLQUFLO2dCQUNHLHVCQUF1QjtzQkFBL0IsS0FBSztnQkFDRywyQkFBMkI7c0JBQW5DLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUVHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUtHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFHRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFLRyxhQUFhO3NCQUFyQixLQUFLO2dCQU1HLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFJRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBS0csT0FBTztzQkFBZixLQUFLO2dCQUtHLCtCQUErQjtzQkFBdkMsS0FBSztnQkFFRyxlQUFlO3NCQUF2QixLQUFLO2dCQWlORyxjQUFjO3NCQUF0QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBRdWVyeUxpc3QsXG4gIFJlbmRlcmVyMixcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0NoaWxkcmVuLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIEJhc2VTdHlsZSxcbiAgQ2FsbHNjcmVlblN0eWxlLFxuICBDaGVja2JveFN0eWxlLFxuICBDb25maXJtRGlhbG9nU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgRG9jdW1lbnRCdWJibGVTdHlsZSxcbiAgRHJvcGRvd25TdHlsZSxcbiAgRW1vamlLZXlib2FyZFN0eWxlLFxuICBGdWxsU2NyZWVuVmlld2VyU3R5bGUsXG4gIElucHV0U3R5bGUsXG4gIExhYmVsU3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG4gIE1lbnVMaXN0U3R5bGUsXG4gIFBhbmVsU3R5bGUsXG4gIFF1aWNrVmlld1N0eWxlLFxuICBSYWRpb0J1dHRvblN0eWxlLFxuICBSZWNlaXB0U3R5bGUsXG4gIFNpbmdsZVNlbGVjdFN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHtcbiAgQ2FsZW5kYXJTdHlsZSxcbiAgQ2FsbGluZ0RldGFpbHNVdGlscyxcbiAgQ2FyZEJ1YmJsZVN0eWxlLFxuICBDb2xsYWJvcmF0aXZlRG9jdW1lbnRDb25zdGFudHMsXG4gIENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkQ29uc3RhbnRzLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIFRpbWVTbG90U3R5bGUsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbiAgRm9ybUJ1YmJsZVN0eWxlLFxuICBJbWFnZU1vZGVyYXRpb25TdHlsZSxcbiAgSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMsXG4gIExpbmtQcmV2aWV3Q29uc3RhbnRzLFxuICBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLFxuICBNZXNzYWdlTGlzdFN0eWxlLFxuICBNZXNzYWdlUmVjZWlwdFV0aWxzLFxuICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMsXG4gIE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlLFxuICBQb2xsc0J1YmJsZVN0eWxlLFxuICBTY2hlZHVsZXJCdWJibGVTdHlsZSxcbiAgU21hcnRSZXBsaWVzQ29uZmlndXJhdGlvbixcbiAgU21hcnRSZXBsaWVzQ29uc3RhbnRzLFxuICBTbWFydFJlcGxpZXNTdHlsZSxcbiAgVGh1bWJuYWlsR2VuZXJhdGlvbkNvbnN0YW50cyxcbiAgUmVhY3Rpb25zU3R5bGUsXG4gIFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24sXG4gIFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24sXG4gIFJlYWN0aW9uTGlzdFN0eWxlLFxuICBSZWFjdGlvbkluZm9TdHlsZSxcbiAgUmVhY3Rpb25zQ29uZmlndXJhdGlvbixcbiAgVXNlck1lbnRpb25TdHlsZSxcbiAgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcixcbiAgQ29tZXRDaGF0VGV4dEZvcm1hdHRlcixcbiAgVXJsRm9ybWF0dGVyU3R5bGUsXG4gIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIsXG4gIFN0b3JhZ2VVdGlscyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBDYXJkTWVzc2FnZSxcbiAgQ29tZXRDaGF0Q2FsbEV2ZW50cyxcbiAgQ29tZXRDaGF0R3JvdXBFdmVudHMsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24sXG4gIENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSxcbiAgQ29tZXRDaGF0VGhlbWUsXG4gIENvbWV0Q2hhdFVJRXZlbnRzLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlLFxuICBEYXRlUGF0dGVybnMsXG4gIERvY3VtZW50SWNvbkFsaWdubWVudCxcbiAgRm9ybU1lc3NhZ2UsXG4gIElHcm91cExlZnQsXG4gIElHcm91cE1lbWJlckFkZGVkLFxuICBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsXG4gIElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCxcbiAgSU1lc3NhZ2VzLFxuICBJUGFuZWwsXG4gIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQsXG4gIE1lc3NhZ2VMaXN0QWxpZ25tZW50LFxuICBNZXNzYWdlU3RhdHVzLFxuICBQbGFjZW1lbnQsXG4gIFNjaGVkdWxlck1lc3NhZ2UsXG4gIFN0YXRlcyxcbiAgVGltZXN0YW1wQWxpZ25tZW50LFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBDb21ldENoYXRVSUtpdENhbGxzLFxuICBMaW5rUHJldmlld1N0eWxlLFxuICBTdGlja2Vyc0NvbnN0YW50cyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5cbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXQgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0NvbWV0Q2hhdFVJa2l0L0NvbWV0Q2hhdFVJS2l0XCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24sIGlzRW1wdHkgfSBmcm9tIFwicnhqc1wiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRNZXNzYWdlTGlzdCBpcyBhIHdyYXBwZXIgY29tcG9uZW50IGZvciBtZXNzYWdlQnViYmxlXG4gKlxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuICogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4gKlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdFwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudFxuICBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95LCBPbkNoYW5nZXMge1xuICBAVmlld0NoaWxkKFwibGlzdFNjcm9sbFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgbGlzdFNjcm9sbCE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJib3R0b21cIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGJvdHRvbSE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJ0b3BcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHRvcCE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJ0ZXh0QnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSB0ZXh0QnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInRocmVhZE1lc3NhZ2VCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHRocmVhZE1lc3NhZ2VCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiZmlsZUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgZmlsZUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJhdWRpb0J1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYXVkaW9CdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwidmlkZW9CdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHZpZGVvQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImltYWdlQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBpbWFnZUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJmb3JtQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBmb3JtQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImNhcmRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGNhcmRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwic3RpY2tlckJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgc3RpY2tlckJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJkb2N1bWVudEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgZG9jdW1lbnRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwid2hpdGVib2FyZEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgd2hpdGVib2FyZEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJwb3BvdmVyUmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBwb3BvdmVyUmVmITogYW55O1xuICBAVmlld0NoaWxkKFwiZGlyZWN0Q2FsbGluZ1wiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgZGlyZWN0Q2FsbGluZyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJzY2hlZHVsZXJCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHNjaGVkdWxlckJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJwb2xsQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBwb2xsQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZHJlbihcIm1lc3NhZ2VCdWJibGVSZWZcIikgbWVzc2FnZUJ1YmJsZVJlZiE6IFF1ZXJ5TGlzdDxFbGVtZW50UmVmPjtcblxuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgaGlkZURhdGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX01FU1NBR0VTX0ZPVU5EXCIpO1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgZGlzYWJsZVJlY2VpcHQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JNZXNzYWdlczogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgcmVhZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtcmVhZC5zdmdcIjtcbiAgQElucHV0KCkgZGVsaXZlcmVkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1kZWxpdmVyZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHNlbnRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXNlbnQuc3ZnXCI7XG4gIEBJbnB1dCgpIHdhaXRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy93YWl0LnN2Z1wiO1xuICBASW5wdXQoKSBlcnJvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3dhcm5pbmctc21hbGwuc3ZnXCI7XG4gIEBJbnB1dCgpIGFpRXJyb3JJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9haS1lcnJvci5zdmdcIjtcbiAgQElucHV0KCkgYWlFbXB0eUljb246IHN0cmluZyA9IFwiYXNzZXRzL2FpLWVtcHR5LnN2Z1wiO1xuICBASW5wdXQoKSBhbGlnbm1lbnQ6IE1lc3NhZ2VMaXN0QWxpZ25tZW50ID0gTWVzc2FnZUxpc3RBbGlnbm1lbnQuc3RhbmRhcmQ7XG4gIEBJbnB1dCgpIHNob3dBdmF0YXI6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBkYXRlUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLnRpbWU7XG4gIEBJbnB1dCgpIHRpbWVzdGFtcEFsaWdubWVudDogVGltZXN0YW1wQWxpZ25tZW50ID0gVGltZXN0YW1wQWxpZ25tZW50LmJvdHRvbTtcbiAgQElucHV0KCkgRGF0ZVNlcGFyYXRvclBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy5EYXlEYXRlVGltZTtcbiAgQElucHV0KCkgdGVtcGxhdGVzOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGVbXSA9IFtdO1xuICBASW5wdXQoKSBtZXNzYWdlc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIG5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0OiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBzY3JvbGxUb0JvdHRvbU9uTmV3TWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGhyZXNob2xkVmFsdWU6IG51bWJlciA9IDEwMDA7XG4gIEBJbnB1dCgpIHVucmVhZE1lc3NhZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDMwO1xuICBASW5wdXQoKSByZWFjdGlvbnNDb25maWd1cmF0aW9uOiBSZWFjdGlvbnNDb25maWd1cmF0aW9uID1cbiAgICBuZXcgUmVhY3Rpb25zQ29uZmlndXJhdGlvbih7fSk7XG4gIEBJbnB1dCgpIGRpc2FibGVSZWFjdGlvbnM6IEJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZW1vamlLZXlib2FyZFN0eWxlOiBFbW9qaUtleWJvYXJkU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgYXBpQ29uZmlndXJhdGlvbj86IChcbiAgICB1c2VyPzogQ29tZXRDaGF0LlVzZXIsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKSA9PiBQcm9taXNlPE9iamVjdD47XG5cbiAgQElucHV0KCkgb25UaHJlYWRSZXBsaWVzQ2xpY2shOlxuICAgIHwgKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIHZpZXc6IFRlbXBsYXRlUmVmPGFueT4pID0+IHZvaWQpXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBoZWFkZXJWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZm9vdGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHBhcmVudE1lc3NhZ2VJZCE6IG51bWJlcjtcbiAgQElucHV0KCkgdGhyZWFkSW5kaWNhdG9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvdGhyZWFkSW5kaWNhdG9ySWNvbi5zdmdcIjtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMjhweFwiLFxuICAgIGhlaWdodDogXCIyOHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuICBASW5wdXQoKSBkYXRlU2VwYXJhdG9yU3R5bGU6IERhdGVTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgd2lkdGg6IFwiXCIsXG4gIH07XG4gIEBJbnB1dCgpIG1lc3NhZ2VMaXN0U3R5bGU6IE1lc3NhZ2VMaXN0U3R5bGUgPSB7XG4gICAgbmFtZVRleHRGb250OiBcIjQwMCAxMXB4IEludGVyXCIsXG4gICAgZW1wdHlTdGF0ZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gICAgZXJyb3JTdGF0ZVRleHRGb250OiBcIjcwMCAyMnB4IEludGVyXCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIG1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb246IE1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24gPVxuICAgIG5ldyBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uKHt9KTtcbiAgQElucHV0KCkgZGlzYWJsZU1lbnRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgb3B0aW9uc1N0eWxlOiBNZW51TGlzdFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICAgIHN1Ym1lbnVXaWR0aDogXCIxMDAlXCIsXG4gICAgc3VibWVudUhlaWdodDogXCIxMDAlXCIsXG4gICAgc3VibWVudUJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudUJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBtb3JlSWNvblRpbnQ6IFwiZ3JleVwiLFxuICB9O1xuICByZWNlaXB0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IHt9O1xuICBkb2N1bWVudEJ1YmJsZUFsaWdubWVudDogRG9jdW1lbnRJY29uQWxpZ25tZW50ID0gRG9jdW1lbnRJY29uQWxpZ25tZW50LnJpZ2h0O1xuICBjYWxsQnViYmxlQWxpZ25tZW50OiBEb2N1bWVudEljb25BbGlnbm1lbnQgPSBEb2N1bWVudEljb25BbGlnbm1lbnQubGVmdDtcbiAgaW1hZ2VNb2RlcmF0aW9uU3R5bGU6IEltYWdlTW9kZXJhdGlvblN0eWxlID0ge307XG4gIHRpbWVzdGFtcEVudW06IHR5cGVvZiBUaW1lc3RhbXBBbGlnbm1lbnQgPSBUaW1lc3RhbXBBbGlnbm1lbnQ7XG4gIHB1YmxpYyBjaGF0Q2hhbmdlZDogYm9vbGVhbiA9IHRydWU7XG4gIHN0YXJ0ZXJFcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIHN0YXJ0ZXJFbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgc3RhcnRlckxvYWRpbmdTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiR0VORVJBVElOR19JQ0VCUkVBS0VSU1wiKTtcbiAgc3VtbWFyeUVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgc3VtbWFyeUVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX01FU1NBR0VTX0ZPVU5EXCIpO1xuICBzdW1tYXJ5TG9hZGluZ1N0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJHRU5FUkFUSU5HX1NVTU1BUllcIik7XG4gIC8vIHB1YmxpYyBwcm9wZXJ0aWVzXG4gIHB1YmxpYyByZXF1ZXN0QnVpbGRlcjogYW55O1xuICBwdWJsaWMgY2xvc2VJbWFnZU1vZGVyYXRpb246IGFueTtcbiAgcHVibGljIHRpbWVTdGFtcENvbG9yOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgdGltZVN0YW1wRm9udDogc3RyaW5nID0gXCJcIjtcbiAgc21hcnRSZXBseVN0eWxlOiBTbWFydFJlcGxpZXNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICB9O1xuICBjb252ZXJzYXRpb25TdGFydGVyU3R5bGU6IFNtYXJ0UmVwbGllc1N0eWxlID0ge307XG4gIGNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZTogUGFuZWxTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIGNsb3NlSWNvblRpbnQ6IFwiXCIsXG4gICAgYm94U2hhZG93OiBcIlwiLFxuICAgIHRleHRGb250OiBcIlwiLFxuICAgIHRleHRDb2xvcjogXCJcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICB9O1xuXG4gIHB1YmxpYyBzaG93U21hcnRSZXBseTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdGFydGVyUmVwbGllczogc3RyaW5nW10gPSBbXTtcbiAgcHVibGljIGVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHNob3dDb252ZXJzYXRpb25TdW1tYXJ5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3VtbWFyeTogc3RyaW5nW10gPSBbXTtcbiAgcHVibGljIGdldFVucmVhZENvdW50OiBhbnkgPSAwO1xuXG4gIGNjSGlkZVBhbmVsITogU3Vic2NyaXB0aW9uO1xuICBjY1Nob3dQYW5lbCE6IFN1YnNjcmlwdGlvbjtcbiAgc21hcnRSZXBseU1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZW5hYmxlU21hcnRSZXBseTogYm9vbGVhbiA9IGZhbHNlO1xuICBzbWFydFJlcGx5Q29uZmlnITogU21hcnRSZXBsaWVzQ29uZmlndXJhdGlvbjtcbiAgcHVibGljIHRpbWVTdGFtcEJhY2tncm91bmQ6IHN0cmluZyA9IFwiXCI7XG4gIGxpbmtQcmV2aWV3U3R5bGU6IExpbmtQcmV2aWV3U3R5bGUgPSB7fTtcbiAgcHVibGljIHVucmVhZE1lc3NhZ2VzU3R5bGUgPSB7fTtcbiAgcHVibGljIG1vZGFsU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICBjbG9zZUljb25UaW50OiBcImJsdWVcIixcbiAgfTtcbiAgcHVibGljIGRpdmlkZXJTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxcHhcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJncmV5XCIsXG4gIH07XG4gIHBvbGxCdWJibGVTdHlsZTogUG9sbHNCdWJibGVTdHlsZSA9IHt9O1xuICBsYWJlbFN0eWxlOiBhbnkgPSB7XG4gICAgdGV4dEZvbnQ6IFwiNDAwIDExcHggSW50ZXJcIixcbiAgICB0ZXh0Q29sb3I6IFwiZ3JleVwiLFxuICB9O1xuICBpbWFnZUJ1YmJsZVN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjIwMHB4XCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweCA4cHggMHB4IDBweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgbWVzc2FnZXNMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFtdO1xuICBidWJibGVEYXRlU3R5bGU6IERhdGVTdHlsZSA9IHt9O1xuICB3aGl0ZWJvYXJkSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY29sbGFib3JhdGl2ZXdoaXRlYm9hcmQuc3ZnXCI7XG4gIGRvY3VtZW50SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY29sbGFib3JhdGl2ZWRvY3VtZW50LnN2Z1wiO1xuICBkaXJlY3RDYWxsSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvVmlkZW8tY2FsbDJ4LnN2Z1wiO1xuICBwbGFjZWhvbGRlckljb25VUkw6IHN0cmluZyA9IFwiL2Fzc2V0cy9wbGFjZWhvbGRlci5wbmdcIjtcbiAgZG93bmxvYWRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9kb3dubG9hZC5zdmdcIjtcbiAgdHJhbnNsYXRpb25TdHlsZTogTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUgPSB7fTtcbiAgZG9jdW1lbnRCdWJibGVTdHlsZTogRG9jdW1lbnRCdWJibGVTdHlsZSA9IHt9O1xuICBjYWxsQnViYmxlU3R5bGU6IERvY3VtZW50QnViYmxlU3R5bGUgPSB7fTtcbiAgd2hpdGVib2FyZFRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNPTExBQk9SQVRJVkVfV0hJVEVCT0FSRFwiKTtcbiAgd2hpdGVib2FyZFN1Yml0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiRFJBV19XSElURUJPQVJEX1RPR0VUSEVSXCIpO1xuICB3aGl0ZWJvYXJkQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJPUEVOX1dISVRFQk9BUkRcIik7XG4gIGRvY3VtZW50VGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ09MTEFCT1JBVElWRV9ET0NVTUVOVFwiKTtcbiAgZG9jdW1lbnRTdWJpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRSQVdfRE9DVU1FTlRfVE9HRVRIRVJcIik7XG4gIGRvY3VtZW50QnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJPUEVOX0RPQ1VNRU5UXCIpO1xuICBqb2luQ2FsbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSk9JTlwiKTtcbiAgdG9wT2JzZXJ2ZXIhOiBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbiAgYm90dG9tT2JzZXJ2ZXIhOiBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbiAgbG9jYWxpemU6IHR5cGVvZiBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICByZWluaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG4gIGFkZFJlYWN0aW9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYWRkcmVhY3Rpb24uc3ZnXCI7XG4gIE1lc3NhZ2VUeXBlc0NvbnN0YW50OiB0eXBlb2YgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzID1cbiAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXM7XG4gIGNhbGxDb25zdGFudDogc3RyaW5nID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGw7XG4gIHB1YmxpYyB0eXBlc01hcDogYW55ID0ge307XG4gIHB1YmxpYyBtZXNzYWdlVHlwZXNNYXA6IGFueSA9IHt9O1xuICB0aGVtZTogQ29tZXRDaGF0VGhlbWUgPSBuZXcgQ29tZXRDaGF0VGhlbWUoe30pO1xuICBwdWJsaWMgZ3JvdXBMaXN0ZW5lcklkID0gXCJncm91cF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgY2FsbExpc3RlbmVySWQgPSBcImNhbGxfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBwdWJsaWMgc3RhdGVzOiB0eXBlb2YgU3RhdGVzID0gU3RhdGVzO1xuICBNZXNzYWdlQ2F0ZWdvcnkgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnk7XG4gIHB1YmxpYyBudW1iZXJPZlRvcFNjcm9sbDogbnVtYmVyID0gMDtcbiAga2VlcFJlY2VudE1lc3NhZ2VzOiBib29sZWFuID0gdHJ1ZTtcbiAgbWVzc2FnZVRlbXBsYXRlOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGVbXSA9IFtdO1xuICBwdWJsaWMgb3BlbkNvbnRhY3RzVmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBtZXNzYWdlQ291bnQhOiBudW1iZXI7XG4gIGlzT25Cb3R0b206IGJvb2xlYW4gPSBmYWxzZTtcbiAgVW5yZWFkQ291bnQ6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gW107XG4gIG5ld01lc3NhZ2VDb3VudDogbnVtYmVyIHwgc3RyaW5nID0gMDtcbiAgdHlwZTogc3RyaW5nID0gXCJcIjtcbiAgY29uZmlybVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiWUVTXCIpO1xuICBjYW5jZWxUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PXCIpO1xuICB3YXJuaW5nVGV4dDogc3RyaW5nID0gXCJBcmUgeW91IHN1cmUgd2FudCB0byBzZWUgdW5zYWZlIGNvbnRlbnQ/XCI7XG4gIGNjTWVzc2FnZURlbGV0ZSE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlUmVhY3QhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVJlYWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXQhOiBTdWJzY3JpcHRpb247XG4gIGNjTGl2ZVJlYWN0aW9uITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VTZW50ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cERlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBDcmVhdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY091dGdvaW5nQ2FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0NhbGxBY2NlcHRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UZXh0TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VSZWFjdGlvbkFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkZvcm1NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkNhcmRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNEZWxpdmVyZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNSZWFkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHJhbnNpZW50TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkludGVyYWN0aW9uR29hbENvbXBsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgdGhyZWFkZWRBbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ7XG4gIG1lc3NhZ2VJbmZvQWxpZ25tZW50OiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5yaWdodDtcbiAgb3BlbkVtb2ppS2V5Ym9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAga2V5Ym9hcmRBbGlnbm1lbnQ6IHN0cmluZyA9IFBsYWNlbWVudC5yaWdodDtcbiAgcG9wb3ZlclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjMzMHB4XCIsXG4gICAgd2lkdGg6IFwiMzI1cHhcIixcbiAgfTtcbiAgdmlkZW9CdWJibGVTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMzBweFwiLFxuICAgIHdpZHRoOiBcIjIzMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICB0aHJlYWRWaWV3QWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICB3aGl0ZWJvYXJkVVJMOiBzdHJpbmcgfCBVUkwgfCB1bmRlZmluZWQ7XG4gIGVuYWJsZURhdGFNYXNraW5nOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVRodW1ibmFpbEdlbmVyYXRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlTGlua1ByZXZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlUG9sbHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlUmVhY3Rpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZUltYWdlTW9kZXJhdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVTdGlja2VyczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVXaGl0ZWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZURvY3VtZW50OiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVDYWxsaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9O1xuICBzZXNzaW9uSWQ6IHN0cmluZyA9IFwiXCI7XG4gIG9wZW5NZXNzYWdlSW5mb1BhZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbWVzc2FnZUluZm9PYmplY3QhOiBDb21ldENoYXQuQmFzZU1lc3NhZ2U7XG4gIGZpcnN0UmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gIGlzV2Vic29ja2V0UmVjb25uZWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGxhc3RNZXNzYWdlSWQ6IG51bWJlciA9IDA7XG4gIGlzQ29ubmVjdGlvblJlZXN0YWJsaXNoZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dEZvcm1hdHRlcnM/OiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPjtcblxuICBjbG9zZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIHRocmVhZE9wZW5JY29uOiBzdHJpbmcgPSBcImFzc2V0cy9zaWRlLWFycm93LnN2Z1wiO1xuICBjb25maXJtRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHt9O1xuICBwdWJsaWMgbWVzc2FnZVRvUmVhY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IG51bGwgPSBudWxsO1xuXG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHR5cGVzOiBzdHJpbmdbXSA9IFtdO1xuICBjYXRlZ29yaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBjYWxsYmFja3M6IE1hcDxzdHJpbmcsIChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdm9pZD4gPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHsgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgICAgdGhpcy5jaGF0Q2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgY2hhbmdlc1tDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJdIHx8XG4gICAgICAgIGNoYW5nZXNbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cF1cbiAgICAgICkge1xuICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtdO1xuICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gW107XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgdGhpcy5zaG93RW5hYmxlZEV4dGVuc2lvbnMoKTtcbiAgICAgICAgdGhpcy5udW1iZXJPZlRvcFNjcm9sbCA9IDA7XG4gICAgICAgIGlmICghdGhpcy5sb2dnZWRJblVzZXIpIHtcbiAgICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gW107XG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LmtleXModGhpcy51c2VyKS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB0aGlzLnVzZXI7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXI7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5nZXRVc2VyKHRoaXMudXNlcikudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyO1xuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLmdyb3VwKS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aGlzLmdyb3VwID0gdGhpcy5ncm91cDtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5nZXRHcm91cCh0aGlzLmdyb3VwKS50aGVuKChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuZ3JvdXAgPSBncm91cDtcbiAgICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgc2VuZE1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIHJlY2VpdmVySWQ6IHN0cmluZyxcbiAgICByZWNlaXZlclR5cGU6IHN0cmluZ1xuICApIHtcbiAgICBpZiAobWVzc2FnZS5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQpIHtcbiAgICAgIGNvbnN0IG5ld01lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0LlRleHRNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICAobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldFRleHQoKSxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQ29tZXRDaGF0VUlLaXQuc2VuZFRleHRNZXNzYWdlKG5ld01lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gKG1lc3NhZ2UgYXMgYW55KT8uZGF0YT8uYXR0YWNobWVudHNbMF07XG4gICAgICBjb25zdCBuZXdNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIG1lc3NhZ2UuZ2V0VHlwZSgpLFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG4gICAgICBsZXQgYXR0YWNobWVudCA9IG5ldyBDb21ldENoYXQuQXR0YWNobWVudCh1cGxvYWRlZEZpbGUpO1xuICAgICAgbmV3TWVzc2FnZS5zZXRBdHRhY2htZW50KGF0dGFjaG1lbnQpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQ29tZXRDaGF0VUlLaXQuc2VuZE1lZGlhTWVzc2FnZShuZXdNZXNzYWdlIGFzIENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjbG9zZUNvbnRhY3RzUGFnZSA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5Db250YWN0c1ZpZXcgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGFkZFJlYWN0aW9uID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgZW1vamkgPSBldmVudD8uZGV0YWlsPy5pZDtcbiAgICB0aGlzLnBvcG92ZXJSZWYubmF0aXZlRWxlbWVudC5vcGVuQ29udGVudFZpZXcoZXZlbnQpO1xuICAgIGlmICh0aGlzLm1lc3NhZ2VUb1JlYWN0KSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKGVtb2ppLCB0aGlzLm1lc3NhZ2VUb1JlYWN0KTtcbiAgICB9XG4gIH07XG4gIGdldENhbGxCdWJibGVUaXRsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBpZiAoXG4gICAgICAhbWVzc2FnZS5nZXRTZW5kZXIoKSB8fFxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIGxvY2FsaXplKFwiWU9VX0lOSVRJQVRFRF9HUk9VUF9DQUxMXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYCR7bWVzc2FnZS5nZXRTZW5kZXIoKS5nZXROYW1lKCl9ICAke2xvY2FsaXplKFxuICAgICAgICBcIklOSVRJQVRFRF9HUk9VUF9DQUxMXCJcbiAgICAgICl9YDtcbiAgICB9XG4gIH1cbiAgZ2V0Q2FsbEFjdGlvbk1lc3NhZ2UgPSAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICByZXR1cm4gQ2FsbGluZ0RldGFpbHNVdGlscy5nZXRDYWxsU3RhdHVzKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyKTtcbiAgfTtcbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcblxuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRyeSB7XG4gICAgICAvL1JlbW92aW5nIE1lc3NhZ2UgTGlzdGVuZXJzXG4gICAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlQ2FsbExpc3RlbmVyKHRoaXMuY2FsbExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKVxuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZUVkaXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBSZWFjdGlvbnNTdHlsZSBvYmplY3Qgd2l0aCB0aGUgZGVmaW5lZCBvciBkZWZhdWx0IHN0eWxlcy5cbiAgICpcbiAgICogQHJldHVybnMge1JlYWN0aW9uc1N0eWxlfSBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIFJlYWN0aW9uc1N0eWxlIHdpdGggdGhlIHNldCBvciBkZWZhdWx0IHN0eWxlcy5cbiAgICovXG4gIGdldFJlYWN0aW9uc1N0eWxlKCkge1xuICAgIGNvbnN0IHJlYWN0aW9uc1N0eWxlID0gdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbnNTdHlsZSB8fCB7fTtcbiAgICByZXR1cm4gbmV3IFJlYWN0aW9uc1N0eWxlKHtcbiAgICAgIGhlaWdodDogcmVhY3Rpb25zU3R5bGU/LmhlaWdodCB8fCBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogcmVhY3Rpb25zU3R5bGU/LndpZHRoIHx8IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlcjogcmVhY3Rpb25zU3R5bGU/LmJvcmRlciB8fCBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogcmVhY3Rpb25zU3R5bGU/LmJvcmRlclJhZGl1cyB8fCBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IHJlYWN0aW9uc1N0eWxlPy5iYWNrZ3JvdW5kIHx8IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQmFja2dyb3VuZCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkxNTAoKSxcbiAgICAgIHJlYWN0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQmFja2dyb3VuZCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHJlYWN0aW9uQm9yZGVyOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Cb3JkZXIgfHxcbiAgICAgICAgYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQm9yZGVyOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25Cb3JkZXIgfHxcbiAgICAgICAgYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeTUwMCgpfWAsXG4gICAgICByZWFjdGlvbkJvcmRlclJhZGl1czogcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQm9yZGVyUmFkaXVzIHx8IFwiMTJweFwiLFxuICAgICAgYWN0aXZlUmVhY3Rpb25Db3VudFRleHRDb2xvcjpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Rm9udDpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LmFjdGl2ZVJlYWN0aW9uQ291bnRUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVhY3Rpb25Db3VudFRleHRGb250OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Db3VudFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZWFjdGlvbkNvdW50VGV4dENvbG9yOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Db3VudFRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcmVhY3Rpb25Cb3hTaGFkb3c6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJveFNoYWRvdyB8fCBcInJnYmEoMCwgMCwgMCwgMC4xKSAwcHggNHB4IDEycHhcIixcbiAgICAgIHJlYWN0aW9uRW1vamlGb250OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25FbW9qaUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgfSk7XG4gIH1cbiAgaXNNb2JpbGVWaWV3ID0gKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuaW5uZXJXaWR0aCA8PSA3Njg7XG4gIH07XG4gIGdldEJ1YmJsZUJ5SWQoaWQ6IHN0cmluZyk6IEVsZW1lbnRSZWYgfCB1bmRlZmluZWQge1xuICAgIGxldCB0YXJnZXRCdWJibGU6IEVsZW1lbnRSZWYgfCB1bmRlZmluZWQ7XG4gICAgdGhpcy5tZXNzYWdlQnViYmxlUmVmLmZvckVhY2goKGJ1YmJsZTogRWxlbWVudFJlZikgPT4ge1xuICAgICAgaWYgKGJ1YmJsZS5uYXRpdmVFbGVtZW50LmlkID09PSBpZClcbiAgICAgICAgdGFyZ2V0QnViYmxlID0gYnViYmxlO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRhcmdldEJ1YmJsZTtcbiAgfVxuICBzaG93RW1vamlLZXlib2FyZCA9IChpZDogbnVtYmVyLCBldmVudDogYW55KSA9PiB7XG4gICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IGZhbHNlID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMubWVzc2FnZVRvUmVhY3QgPSBtZXNzYWdlO1xuICAgICAgaWYgKHRoaXMuaXNNb2JpbGVWaWV3KCkpIHtcbiAgICAgICAgbGV0IGJ1YmJsZVJlZiA9IHRoaXMuZ2V0QnViYmxlQnlJZChTdHJpbmcoaWQpKVxuICAgICAgICBpZiAoYnViYmxlUmVmKSB7XG4gICAgICAgICAgY29uc3QgcmVjdCA9IGJ1YmJsZVJlZi5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgIGNvbnN0IGlzQXRUb3AgPSByZWN0LnRvcCA8IGlubmVySGVpZ2h0IC8gMjtcbiAgICAgICAgICBjb25zdCBpc0F0Qm90dG9tID0gcmVjdC5ib3R0b20gPiB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyO1xuICAgICAgICAgIGlmIChpc0F0VG9wKSB7XG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkQWxpZ25tZW50ID0gUGxhY2VtZW50LmJvdHRvbTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGlzQXRCb3R0b20pIHtcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRBbGlnbm1lbnQgPSBQbGFjZW1lbnQudG9wO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRBbGlnbm1lbnQgPVxuICAgICAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCk/LmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgPyBQbGFjZW1lbnQubGVmdFxuICAgICAgICAgICAgOiBQbGFjZW1lbnQucmlnaHQ7XG4gICAgICB9XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB0aGlzLnBvcG92ZXJSZWYubmF0aXZlRWxlbWVudC5vcGVuQ29udGVudFZpZXcoZXZlbnQpO1xuICAgIH1cbiAgfTtcbiAgc2V0QnViYmxlVmlldyA9ICgpID0+IHtcbiAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZS5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUpID0+IHtcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW2VsZW1lbnQudHlwZV0gPSBlbGVtZW50O1xuICAgIH0pO1xuICB9O1xuICBvcGVuVGhyZWFkVmlldyA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBpZiAodGhpcy5vblRocmVhZFJlcGxpZXNDbGljaykge1xuICAgICAgdGhpcy5vblRocmVhZFJlcGxpZXNDbGljayhtZXNzYWdlLCB0aGlzLnRocmVhZE1lc3NhZ2VCdWJibGUpO1xuICAgIH1cbiAgfTtcbiAgdGhyZWFkQ2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLm9wZW5UaHJlYWRWaWV3KG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBkZWxldGVDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMuZGVsZXRlTWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgZWRpdENhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vbkVkaXRNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBjb3B5Q2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLm9uQ29weU1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIG1lc3NhZ2VQcml2YXRlbHlDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMuc2VuZE1lc3NhZ2VQcml2YXRlbHkobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIG1lc3NhZ2VJbmZvQ2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLm9wZW5NZXNzYWdlSW5mbyhtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgb3Blbk1lc3NhZ2VJbmZvKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRoaXMub3Blbk1lc3NhZ2VJbmZvUGFnZSA9IHRydWU7XG4gICAgdGhpcy5tZXNzYWdlSW5mb09iamVjdCA9IG1lc3NhZ2VPYmplY3Q7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGNsb3NlTWVzc2FnZUluZm9QYWdlID0gKCkgPT4ge1xuICAgIHRoaXMub3Blbk1lc3NhZ2VJbmZvUGFnZSA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2VuZE1lc3NhZ2VQcml2YXRlbHkobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NPcGVuQ2hhdC5uZXh0KHsgdXNlcjogbWVzc2FnZU9iamVjdC5nZXRTZW5kZXIoKSB9KTtcbiAgfVxuICBnZXRNZXNzYWdlQnlJZChpZDogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoKG0pID0+IG0uZ2V0SWQoKSA9PSBpZCk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGlzVHJhbnNsYXRlZChtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBhbnkge1xuICAgIGxldCB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdDogYW55ID0gbWVzc2FnZTtcbiAgICBpZiAoXG4gICAgICB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdCAmJlxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q/LmRhdGE/Lm1ldGFkYXRhICYmXG4gICAgICB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdD8uZGF0YT8ubWV0YWRhdGFbXG4gICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudHJhbnNsYXRlZF9tZXNzYWdlXG4gICAgICBdXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3QuZGF0YS5tZXRhZGF0YVtcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnRyYW5zbGF0ZWRfbWVzc2FnZVxuICAgICAgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIHVwZGF0ZVRyYW5zbGF0ZWRNZXNzYWdlID0gKHRyYW5zbGF0aW9uOiBhbnkpID0+IHtcbiAgICB2YXIgcmVjZWl2ZWRNZXNzYWdlID0gdHJhbnNsYXRpb247XG4gICAgdmFyIHRyYW5zbGF0ZWRUZXh0ID0gcmVjZWl2ZWRNZXNzYWdlLnRyYW5zbGF0aW9uc1swXS5tZXNzYWdlX3RyYW5zbGF0ZWQ7XG4gICAgbGV0IG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAobSkgPT4gbS5nZXRJZCgpID09PSByZWNlaXZlZE1lc3NhZ2UubXNnSWRcbiAgICApO1xuICAgIGxldCBkYXRhOiBhbnk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgdmFyIG1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VLZXldO1xuICAgICAgaWYgKChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0TWV0YWRhdGEoKSkge1xuICAgICAgICBkYXRhID0gKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRNZXRhZGF0YSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5zZXRNZXRhZGF0YSh7fSk7XG4gICAgICAgIGRhdGEgPSAobWVzc2FnZU9iaiBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldE1ldGFkYXRhKCk7XG4gICAgICB9XG4gICAgICBkYXRhW01lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy50cmFuc2xhdGVkX21lc3NhZ2VdID0gdHJhbnNsYXRlZFRleHQ7XG4gICAgICB2YXIgbmV3TWVzc2FnZU9iajogQ29tZXRDaGF0LlRleHRNZXNzYWdlIHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlID1cbiAgICAgICAgbWVzc2FnZU9iajtcbiAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBuZXdNZXNzYWdlT2JqKTtcbiAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VMaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIHRyYW5zbGF0ZU1lc3NhZ2UgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBmYWxzZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICBDb21ldENoYXQuY2FsbEV4dGVuc2lvbihcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLm1lc3NhZ2VfdHJhbnNsYXRpb24sXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy5wb3N0LFxuICAgICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudjJfdHJhbnNsYXRlLFxuICAgICAgICB7XG4gICAgICAgICAgbXNnSWQ6IG1lc3NhZ2UuZ2V0SWQoKSxcbiAgICAgICAgICB0ZXh0OiAobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldFRleHQoKSxcbiAgICAgICAgICBsYW5ndWFnZXM6IG5hdmlnYXRvci5sYW5ndWFnZXMsXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgICAgLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgcmVzdWx0Py50cmFuc2xhdGlvbnNbMF0/Lm1lc3NhZ2VfdHJhbnNsYXRlZCAhPVxuICAgICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKT8uZ2V0VGV4dCgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVRyYW5zbGF0ZWRNZXNzYWdlKHJlc3VsdCk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVzdWx0IG9mIHRyYW5zbGF0aW9uc1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7IH0pO1xuICAgIH1cbiAgfTtcbiAgc2V0T3B0aW9uc0NhbGxiYWNrKG9wdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSwgaWQ6IG51bWJlcikge1xuICAgIG9wdGlvbnM/LmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24pID0+IHtcbiAgICAgIHN3aXRjaCAoZWxlbWVudC5pZCkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uZGVsZXRlTWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5kZWxldGVDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5lZGl0TWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5lZGl0Q2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24udHJhbnNsYXRlTWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy50cmFuc2xhdGVNZXNzYWdlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLmNvcHlNZXNzYWdlOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLmNvcHlDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5yZWFjdFRvTWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljayB8fCAhKGVsZW1lbnQgYXMgYW55KS5jdXN0b21WaWV3KSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlcGx5SW5UaHJlYWQ6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMudGhyZWFkQ2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uc2VuZE1lc3NhZ2VQcml2YXRlbHk6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMubWVzc2FnZVByaXZhdGVseUNhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLm1lc3NhZ2VJbmZvcm1hdGlvbjpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5tZXNzYWdlSW5mb0NhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuICAvKipcbiAgICogc2VuZCBtZXNzYWdlIG9wdGlvbnMgYmFzZWQgb24gdHlwZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1zZ09iamVjdFxuICAgKi9cbiAgc2V0TWVzc2FnZU9wdGlvbnMoXG4gICAgbXNnT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdIHtcbiAgICBsZXQgb3B0aW9ucyE6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXTtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUubGVuZ3RoID4gMCAmJlxuICAgICAgIW1zZ09iamVjdD8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZ09iamVjdD8uZ2V0VHlwZSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlclxuICAgICkge1xuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBtc2dPYmplY3Q/LmdldElkKCkgJiZcbiAgICAgICAgICBlbGVtZW50LnR5cGUgPT0gbXNnT2JqZWN0Py5nZXRUeXBlKCkgJiZcbiAgICAgICAgICBlbGVtZW50Py5vcHRpb25zXG4gICAgICAgICkge1xuICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgdGhpcy5zZXRPcHRpb25zQ2FsbGJhY2soXG4gICAgICAgICAgICAgIGVsZW1lbnQ/Lm9wdGlvbnMoXG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIsXG4gICAgICAgICAgICAgICAgbXNnT2JqZWN0LFxuICAgICAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgbXNnT2JqZWN0Py5nZXRJZCgpXG4gICAgICAgICAgICApIHx8IFtdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IFtdO1xuICAgIH1cbiAgICBvcHRpb25zID0gdGhpcy5maWx0ZXJFbW9qaU9wdGlvbnMob3B0aW9ucyk7XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH1cbiAgLyoqXG4gICAqIFJlYWN0cyB0byBhIG1lc3NhZ2UgYnkgZWl0aGVyIGFkZGluZyBvciByZW1vdmluZyB0aGUgcmVhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbW9qaSAtIFRoZSBlbW9qaSB1c2VkIGZvciB0aGUgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhhdCB3YXMgcmVhY3RlZCB0by5cbiAgICovXG5cbiAgcmVhY3RUb01lc3NhZ2UoZW1vamk6IHN0cmluZywgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgY29uc3QgbWVzc2FnZUlkID0gbWVzc2FnZT8uZ2V0SWQoKTtcbiAgICBjb25zdCBtc2dPYmplY3QgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKG1lc3NhZ2VJZCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlO1xuICAgIGNvbnN0IHJlYWN0aW9ucyA9IG1zZ09iamVjdD8uZ2V0UmVhY3Rpb25zKCkgfHwgW107XG4gICAgY29uc3QgZW1vamlPYmplY3QgPSByZWFjdGlvbnM/LmZpbmQoKHJlYWN0aW9uOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiByZWFjdGlvbj8ucmVhY3Rpb24gPT0gZW1vamk7XG4gICAgfSk7XG4gICAgaWYgKGVtb2ppT2JqZWN0ICYmIGVtb2ppT2JqZWN0Py5nZXRSZWFjdGVkQnlNZSgpKSB7XG4gICAgICBjb25zdCB1cGRhdGVkUmVhY3Rpb25zOiBhbnlbXSA9IFtdO1xuICAgICAgcmVhY3Rpb25zLmZvckVhY2goKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChyZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSA9PSBlbW9qaSkge1xuICAgICAgICAgIGlmIChyZWFjdGlvbj8uZ2V0Q291bnQoKSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFjdGlvbi5zZXRDb3VudChyZWFjdGlvbj8uZ2V0Q291bnQoKSAtIDEpO1xuICAgICAgICAgICAgcmVhY3Rpb24uc2V0UmVhY3RlZEJ5TWUoZmFsc2UpO1xuICAgICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBtc2dPYmplY3Quc2V0UmVhY3Rpb25zKHVwZGF0ZWRSZWFjdGlvbnMpO1xuICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1zZ09iamVjdCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlUmVhY3Rpb24obWVzc2FnZUlkLCBlbW9qaSlcbiAgICAgICAgLnRoZW4oKG1lc3NhZ2UpID0+IHsgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIC8vIFJldHVybiBvbGQgbWVzc2FnZSBvYmplY3QgaW5zdGVhZCBvZlxuICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpOyAvL25lZWQgY2hhbmdlc1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgIGNvbnN0IHJlYWN0aW9uQXZhaWxhYmxlID0gcmVhY3Rpb25zLmZpbmQoKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiByZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSA9PSBlbW9qaTtcbiAgICAgIH0pO1xuXG4gICAgICByZWFjdGlvbnMuZm9yRWFjaCgocmVhY3Rpb24pID0+IHtcbiAgICAgICAgaWYgKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpID09IGVtb2ppKSB7XG4gICAgICAgICAgcmVhY3Rpb24uc2V0Q291bnQocmVhY3Rpb24/LmdldENvdW50KCkgKyAxKTtcbiAgICAgICAgICByZWFjdGlvbi5zZXRSZWFjdGVkQnlNZSh0cnVlKTtcbiAgICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKCFyZWFjdGlvbkF2YWlsYWJsZSkge1xuICAgICAgICBjb25zdCByZWFjdDogQ29tZXRDaGF0LlJlYWN0aW9uQ291bnQgPSBuZXcgQ29tZXRDaGF0LlJlYWN0aW9uQ291bnQoXG4gICAgICAgICAgZW1vamksXG4gICAgICAgICAgMSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdCk7XG4gICAgICB9XG4gICAgICBtc2dPYmplY3Quc2V0UmVhY3Rpb25zKHVwZGF0ZWRSZWFjdGlvbnMpO1xuICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1zZ09iamVjdCk7XG4gICAgICBDb21ldENoYXQuYWRkUmVhY3Rpb24obWVzc2FnZUlkLCBlbW9qaSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHsgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEZpbHRlcnMgb3V0IHRoZSAnYWRkIHJlYWN0aW9uJyBvcHRpb24gaWYgcmVhY3Rpb25zIGFyZSBkaXNhYmxlZC5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXRNZXNzYWdlT3B0aW9uW119IG9wdGlvbnMgLSBUaGUgb3JpZ2luYWwgc2V0IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAgICogQHJldHVybnMge0NvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXX0gVGhlIGZpbHRlcmVkIHNldCBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gICAqL1xuXG4gIGZpbHRlckVtb2ppT3B0aW9ucyA9IChvcHRpb25zOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10pID0+IHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVJlYWN0aW9ucykge1xuICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyKChvcHRpb246IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24pID0+IHtcbiAgICAgIHJldHVybiBvcHRpb24uaWQgIT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVhY3RUb01lc3NhZ2U7XG4gICAgfSk7XG4gIH07XG4gIGdldENsb25lZFJlYWN0aW9uT2JqZWN0KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUobWVzc2FnZSk7XG4gIH1cbiAgLyoqXG4gICAqIHBhc3Npbmcgc3R5bGUgYmFzZWQgb24gbWVzc2FnZSBvYmplY3RcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlT2JqZWN0XG4gICAqL1xuICBzZXRNZXNzYWdlQnViYmxlU3R5bGUobXNnOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBCYXNlU3R5bGUge1xuICAgIGxldCBzdHlsZSE6IEJhc2VTdHlsZTtcbiAgICBpZiAobXNnPy5nZXREZWxldGVkQXQoKSkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyOiBgMXB4IGRhc2hlZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCl9YCxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLm1lZXRpbmcgJiZcbiAgICAgICghbXNnPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgICBtc2c/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpKVxuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgICAvLyB9IGVsc2UgaWYgKHRoaXMuZ2V0TGlua1ByZXZpZXcobXNnIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkpIHtcbiAgICAgIC8vICAgc3R5bGUgPSB7XG4gICAgICAvLyAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgLy8gICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICAvLyAgIH07XG4gICAgfSBlbHNlIGlmIChtc2c/LmdldFR5cGUoKSA9PSBTdGlja2Vyc0NvbnN0YW50cy5zdGlja2VyKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgIW1zZz8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSAmJlxuICAgICAgbXNnPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQgJiZcbiAgICAgICghbXNnPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT0gbXNnPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSlcbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOlxuICAgICAgICAgIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnRcbiAgICAgICAgICAgID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKVxuICAgICAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFtc2c/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2c/LmdldENhdGVnb3J5KCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciB8fFxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50XG4gICAgKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpfWAsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAhbXNnPy5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmVcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1zZz8uZ2V0U2VuZGVyKCkgJiZcbiAgICAgICAgbXNnPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKVxuICAgICAgKSB7XG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0eWxlO1xuICB9XG4gIGdldFNlc3Npb25JZChtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgIGxldCBkYXRhOiBhbnkgPSBtZXNzYWdlLmdldERhdGEoKTtcbiAgICByZXR1cm4gZGF0YT8uY3VzdG9tRGF0YT8uc2Vzc2lvbklEO1xuICB9XG4gIGdldFdoaXRlYm9hcmREb2N1bWVudChtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAobWVzc2FnZT8uZ2V0RGF0YSgpKSB7XG4gICAgICAgIHZhciBkYXRhOiBhbnkgPSBtZXNzYWdlLmdldERhdGEoKTtcbiAgICAgICAgaWYgKGRhdGE/Lm1ldGFkYXRhKSB7XG4gICAgICAgICAgdmFyIG1ldGFkYXRhID0gZGF0YT8ubWV0YWRhdGE7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkobWV0YWRhdGEsIFwiQGluamVjdGVkXCIpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB2YXIgaW5qZWN0ZWRPYmplY3QgPSBtZXRhZGF0YVtcIkBpbmplY3RlZFwiXTtcbiAgICAgICAgICAgIGlmIChpbmplY3RlZE9iamVjdD8uZXh0ZW5zaW9ucykge1xuICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uT2JqZWN0ID0gaW5qZWN0ZWRPYmplY3QuZXh0ZW5zaW9ucztcbiAgICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbk9iamVjdFtcbiAgICAgICAgICAgICAgICBDb2xsYWJvcmF0aXZlV2hpdGVib2FyZENvbnN0YW50cy53aGl0ZWJvYXJkXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICA/IGV4dGVuc2lvbk9iamVjdFtDb2xsYWJvcmF0aXZlV2hpdGVib2FyZENvbnN0YW50cy53aGl0ZWJvYXJkXVxuICAgICAgICAgICAgICAgICAgLmJvYXJkX3VybFxuICAgICAgICAgICAgICAgIDogZXh0ZW5zaW9uT2JqZWN0W0NvbGxhYm9yYXRpdmVEb2N1bWVudENvbnN0YW50cy5kb2N1bWVudF1cbiAgICAgICAgICAgICAgICAgIC5kb2N1bWVudF91cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wZW5MaW5rVVJMKGV2ZW50OiBhbnkpIHtcbiAgICB3aW5kb3cub3BlbihldmVudD8uZGV0YWlsPy51cmwsIFwiX2JsYW5rXCIpO1xuICB9XG4gIGdldFN0aWNrZXIobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IHN0aWNrZXJEYXRhOiBhbnkgPSBudWxsO1xuICAgICAgaWYgKFxuICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIFN0aWNrZXJzQ29uc3RhbnRzLmRhdGFcbiAgICAgICAgKSAmJlxuICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICAobWVzc2FnZSBhcyBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkuZ2V0RGF0YSgpLFxuICAgICAgICAgIFN0aWNrZXJzQ29uc3RhbnRzLmN1c3RvbV9kYXRhXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBzdGlja2VyRGF0YSA9IChtZXNzYWdlIGFzIGFueSkuZGF0YS5jdXN0b21EYXRhO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgICBzdGlja2VyRGF0YSxcbiAgICAgICAgICAgIFN0aWNrZXJzQ29uc3RhbnRzLnN0aWNrZXJfdXJsXG4gICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gc3RpY2tlckRhdGEuc3RpY2tlcl91cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnc3RhdHVzSW5mb1ZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldENvbnRlbnRWaWV3ID0gKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCA9PiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXT8uY29udGVudFZpZXdcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5jb250ZW50VmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1lc3NhZ2UuZ2V0RGVsZXRlZEF0KClcbiAgICAgICAgPyB0aGlzLnR5cGVzTWFwW1widGV4dFwiXVxuICAgICAgICA6IHRoaXMudHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdoZWFkZXJWaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRIZWFkZXJWaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBsZXQgdmlldzogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPSBudWxsO1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0/LmhlYWRlclZpZXdcbiAgICApIHtcbiAgICAgIHZpZXcgPSB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5oZWFkZXJWaWV3KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnZm9vdGVyVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cbiAgZ2V0Rm9vdGVyVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgbGV0IHZpZXc6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5mb290ZXJWaWV3XG4gICAgKSB7XG4gICAgICB2aWV3ID0gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXT8uZm9vdGVyVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ2JvdHRvbVZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldEJvdHRvbVZpZXcobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0/LmJvdHRvbVZpZXdcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5ib3R0b21WaWV3KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ3N0YXR1c0luZm9WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuXG4gIGdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlPy5nZXRUeXBlKCldPy5zdGF0dXNJbmZvVmlld1xuICAgICkge1xuICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldFR5cGUoKV0/LnN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgaXNBdWRpb09yVmlkZW9NZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IG1lc3NhZ2VUeXBlID0gbWVzc2FnZT8uZ2V0VHlwZSgpO1xuICAgIGNvbnN0IHR5cGVzVG9DaGVjayA9IFtcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5pbWFnZSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbyxcbiAgICBdO1xuICAgIHJldHVybiB0eXBlc1RvQ2hlY2suaW5jbHVkZXMobWVzc2FnZVR5cGUpO1xuICB9XG5cbiAgc2V0QnViYmxlQWxpZ25tZW50ID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBhbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmNlbnRlcjtcbiAgICBpZiAodGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdCkge1xuICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIgfHxcbiAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50XG4gICAgICApIHtcbiAgICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5jZW50ZXI7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgKG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpICYmXG4gICAgICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpICE9XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyKVxuICAgICAgKSB7XG4gICAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhbGlnbm1lbnQ7XG4gIH07XG5cbiAgZ2V0Rm9ybU1lc3NhZ2VCdWJibGVTdHlsZSgpIHtcbiAgICBjb25zdCB0ZXh0U3R5bGUgPSBuZXcgSW5wdXRTdHlsZSh7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMzBweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjZweFwiLFxuICAgICAgcGFkZGluZzogXCIwcHggMHB4IDBweCA1cHhcIixcbiAgICAgIHBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICB9KTtcbiAgICBjb25zdCBsYWJlbFN0eWxlID0gbmV3IExhYmVsU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHJhZGlvQnV0dG9uU3R5bGUgPSBuZXcgUmFkaW9CdXR0b25TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGxhYmVsVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbGFiZWxUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGNoZWNrYm94U3R5bGUgPSBuZXcgQ2hlY2tib3hTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI0cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgICBsYWJlbFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGxhYmVsVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IGRyb3Bkb3duU3R5bGUgPSBuZXcgRHJvcGRvd25TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMzVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBhY3RpdmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBhY3RpdmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhcnJvd0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgb3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBvcHRpb25Cb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBvcHRpb25Ib3ZlckJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGhvdmVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgaG92ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBob3ZlclRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IGJ1dHRvbkdyb3VwU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiNDBweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICB9O1xuICAgIGNvbnN0IHNpbmdsZVNlbGVjdFN0eWxlID0gbmV3IFNpbmdsZVNlbGVjdFN0eWxlKHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgYWN0aXZlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYWN0aXZlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlVGV4dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBvcHRpb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG9wdGlvbkJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIG9wdGlvbkJvcmRlclJhZGl1czogXCIzcHhcIixcbiAgICAgIGhvdmVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgaG92ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBob3ZlclRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHF1aWNrVmlld1N0eWxlID0gbmV3IFF1aWNrVmlld1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsZWFkaW5nQmFyVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBsZWFkaW5nQmFyV2lkdGg6IFwiNHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBGb3JtQnViYmxlU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHdyYXBwZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHdyYXBwZXJCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB0ZXh0SW5wdXRTdHlsZTogdGV4dFN0eWxlLFxuICAgICAgbGFiZWxTdHlsZTogbGFiZWxTdHlsZSxcbiAgICAgIHJhZGlvQnV0dG9uU3R5bGU6IHJhZGlvQnV0dG9uU3R5bGUsXG4gICAgICBjaGVja2JveFN0eWxlOiBjaGVja2JveFN0eWxlLFxuICAgICAgZHJvcGRvd25TdHlsZTogZHJvcGRvd25TdHlsZSxcbiAgICAgIGJ1dHRvblN0eWxlOiBidXR0b25Hcm91cFN0eWxlLFxuICAgICAgc2luZ2xlU2VsZWN0U3R5bGU6IHNpbmdsZVNlbGVjdFN0eWxlLFxuICAgICAgcXVpY2tWaWV3U3R5bGU6IHF1aWNrVmlld1N0eWxlLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGdvYWxDb21wbGV0aW9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgd3JhcHBlclBhZGRpbmc6IFwiMnB4XCIsXG4gICAgICBkYXRlUGlja2VyQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgZGF0ZVBpY2tlckJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIGRhdGVQaWNrZXJGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGRhdGVQaWNrZXJGb250Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgfSk7XG4gIH1cblxuICBnZXRDYXJkTWVzc2FnZUJ1YmJsZVN0eWxlKCkge1xuICAgIGNvbnN0IGJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBweFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiBgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKX1gLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgQ2FyZEJ1YmJsZVN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICAgIGltYWdlSGVpZ2h0OiBcImF1dG9cIixcbiAgICAgIGltYWdlV2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaW1hZ2VSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBpbWFnZUJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGVzY3JpcHRpb25Gb250Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkZXNjcmlwdGlvbkZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uU3R5bGU6IGJ1dHRvblN0eWxlLFxuICAgICAgZGl2aWRlclRpbnRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHdyYXBwZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHdyYXBwZXJCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB3cmFwcGVyUGFkZGluZzogXCIycHhcIixcbiAgICAgIGRpc2FibGVkQnV0dG9uQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cblxuICBnZXRDYWxsQnViYmxlU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdmFyIGlzTGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIHZhciBpc1VzZXJTZW50TWVzc2FnZSA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgaWYgKGlzVXNlclNlbnRNZXNzYWdlICYmICFpc0xlZnRBbGlnbmVkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiMjQwcHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICB3aWR0aDogXCIyNDBweFwiLFxuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgZ2V0QnViYmxlV3JhcHBlciA9IChcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPT4ge1xuICAgIGxldCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcCAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXS5idWJibGVWaWV3XG4gICAgKSB7XG4gICAgICB2aWV3ID0gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0VHlwZSgpXS5idWJibGVWaWV3KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpZXcgPSBudWxsO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfVxuICB9O1xuICBnZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQgfHxcbiAgICAgIChtZXNzYWdlLmdldFNlbmRlcigpICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKCkpXG4gICAgICA/IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdFxuICAgICAgOiBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICB9XG4gIHNldFRyYW5zbGF0aW9uU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdmFyIGlzTGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCAhPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIGlmICghaXNMZWZ0QWxpZ25lZCkge1xuICAgICAgcmV0dXJuIG5ldyBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSh7XG4gICAgICAgIHRyYW5zbGF0ZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICksXG4gICAgICAgIHRyYW5zbGF0ZWRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwibGlnaHRcIiksXG4gICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICAgIGhlbHBUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc1VzZXJTZW50TWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gbmV3IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlKHtcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOlxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKFwiZGFya1wiKSxcbiAgICAgICAgICBoZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUoe1xuICAgICAgICAgIHRyYW5zbGF0ZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICAgICApLFxuICAgICAgICAgIHRyYW5zbGF0ZWRUZXh0Q29sb3I6XG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImxpZ2h0XCIpLFxuICAgICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICAgICAgaGVscFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBnZXRDYWxsVHlwZUljb24obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbykge1xuICAgICAgcmV0dXJuIFwiYXNzZXRzL0F1ZGlvLUNhbGwuc3ZnXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcImFzc2V0cy9WaWRlby1jYWxsLnN2Z1wiO1xuICAgIH1cbiAgfVxuICBjYWxsU3RhdHVzU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG5cbiAgICBpZiAobWVzc2FnZS5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50KSB7XG4gICAgICBsZXQgbWlzc2VkQ2FsbFRleHRDb2xvciA9IENhbGxpbmdEZXRhaWxzVXRpbHMuaXNNaXNzZWRDYWxsKFxuICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5DYWxsLFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlclxuICAgICAgKVxuICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogbWlzc2VkQ2FsbFRleHRDb2xvcixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwcHhcIixcbiAgICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgICAgYnV0dG9uSWNvblRpbnQ6IG1pc3NlZENhbGxUZXh0Q29sb3IsXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgcGFkZGluZzogXCI4cHggMTJweFwiLFxuICAgICAgICBnYXA6IFwiNHB4XCIsXG4gICAgICAgIGhlaWdodDogXCIyNXB4XCIsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIHNldFRleHRCdWJibGVTdHlsZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgaXNJbmZvQnViYmxlID0gdGhpcy5tZXNzYWdlSW5mb09iamVjdCAmJiBtZXNzYWdlLmdldElkKCkgJiYgdGhpcy5tZXNzYWdlSW5mb09iamVjdC5nZXRJZCgpID09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgIHZhciBpc0RlbGV0ZWQgPSBtZXNzYWdlLmdldERlbGV0ZWRBdCgpO1xuICAgIHZhciBub3RMZWZ0QWxpZ25lZCA9IHRoaXMuYWxpZ25tZW50ICE9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIHZhciBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0O1xuICAgIHZhciBpc1VzZXJTZW50TWVzc2FnZSA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgdmFyIGlzR3JvdXBNZW1iZXJNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyO1xuICAgIGlmICghaXNEZWxldGVkICYmIG5vdExlZnRBbGlnbmVkICYmIGlzVGV4dE1lc3NhZ2UgJiYgaXNVc2VyU2VudE1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICAgIGJ1YmJsZVBhZGRpbmc6IGlzSW5mb0J1YmJsZSA/IFwiOHB4IDEycHhcIiA6IFwiOHB4IDEycHggMCAxMnB4XCJcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChcbiAgICAgICFpc0RlbGV0ZWQgJiZcbiAgICAgIG5vdExlZnRBbGlnbmVkICYmXG4gICAgICBpc1RleHRNZXNzYWdlICYmXG4gICAgICAhaXNVc2VyU2VudE1lc3NhZ2UgJiZcbiAgICAgICFpc0dyb3VwTWVtYmVyTWVzc2FnZVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgYnViYmxlUGFkZGluZzogXCI4cHggMTJweCAycHggMTJweFwiXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoaXNHcm91cE1lbWJlck1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKCFub3RMZWZ0QWxpZ25lZCAmJiBpc1RleHRNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgYnViYmxlUGFkZGluZzogXCI4cHggMTJweFwiXG4gICAgfTtcbiAgfTtcbiAgLypcbiogaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQ6IFRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGJlbG9uZ3MgZm9yIHRoaXMgbGlzdCBhbmQgaXMgbm90IHBhcnQgb2YgdGhyZWFkIGV2ZW4gZm9yIGN1cnJlbnQgbGlzdFxuICBpdCBvbmx5IHJ1bnMgZm9yIFVJIGV2ZW50IGJlY2F1c2UgaXQgYXNzdW1lcyBsb2dnZWQgaW4gdXNlciBpcyBhbHdheXMgc2VuZGVyXG4qIEBwYXJhbTogbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4qL1xuICBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgY29uc3QgcmVjZWl2ZXJJZCA9IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IG1lc3NhZ2U/LmdldFJlY2VpdmVyVHlwZSgpO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgcmVjZWl2ZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJiByZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgfVxuICAgIH1cblxuICAvKlxuICAgICogaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIGZvciB0aGlzIGxpc3QgYW5kIGlzIG5vdCBwYXJ0IG9mIHRocmVhZCBldmVuIGZvciBjdXJyZW50IGxpc3RcbiAgICAgIGl0IG9ubHkgcnVucyBmb3IgU0RLIGV2ZW50IGJlY2F1c2UgaXQgbmVlZHMgc2VuZGVySWQgdG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgc2FtZSB1c2VyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBtZXNzYWdlPy5nZXRSZWNlaXZlclR5cGUoKTtcbiAgICAgIGNvbnN0IHNlbmRlcklkID0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgKHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSB8fCBzZW5kZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmIChyZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICB9XG4gICAgfVxuXG4gIC8qXG4gICAgKiBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIHRocmVhZCBvZiB0aGlzIGxpc3QsXG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFVJIGV2ZW50IGJlY2F1c2UgaXQgYXNzdW1lcyBsb2dnZWQgaW4gdXNlciBpcyBhbHdheXMgc2VuZGVyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50ID1cbiAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICBpZiAoIW1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG5cbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICBpZiAocmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAvKlxuICAgICogaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQ6IFRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGJlbG9uZ3MgdGhyZWFkIG9mIHRoaXMgbGlzdCxcbiAgICAgIGl0IG9ubHkgcnVucyBmb3IgU0RLIGV2ZW50IGJlY2F1c2UgaXQgbmVlZHMgc2VuZGVySWQgdG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgc2FtZSB1c2VyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JTREtFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKCFtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVjZWl2ZXJJZCA9IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGNvbnN0IHNlbmRlcklkID0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpO1xuXG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkgfHwgc2VuZGVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgc2V0RmlsZUJ1YmJsZVN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGFueSB7XG4gICAgdmFyIGlzRmlsZU1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU7XG4gICAgaWYgKGlzRmlsZU1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgICBpY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICB0aGlzLmlvQm90dG9tKCk7XG4gICAgdGhpcy5pb1RvcCgpO1xuICAgIHRoaXMuY2hlY2tNZXNzYWdlVGVtcGxhdGUoKTtcbiAgfVxuXG4gIGdldFN0YXJ0Q2FsbEZ1bmN0aW9uKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKTogKHNlc3Npb25JZDogc3RyaW5nKSA9PiB2b2lkIHtcbiAgICBsZXQgc2Vzc2lvbklkID0gdGhpcy5nZXRTZXNzaW9uSWQobWVzc2FnZSlcbiAgICBsZXQgY2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrcy5nZXQoc2Vzc2lvbklkKTtcbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayA9IChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdGhpcy5zdGFydERpcmVjdENhbGwoc2Vzc2lvbklkLCBtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnNldChzZXNzaW9uSWQsIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxiYWNrO1xuICB9XG4gIHN0YXJ0RGlyZWN0Q2FsbCA9IChzZXNzaW9uSWQ6IHN0cmluZywgbWVzc2FnZTogYW55KSA9PiB7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlO1xuICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG1lc3NhZ2UpXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBsYXVuY2hDb2xsYWJvcmF0aXZlV2hpdGVib2FyZERvY3VtZW50ID0gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgd2luZG93Lm9wZW4oXG4gICAgICB1cmwgKyBgJnVzZXJuYW1lPSR7dGhpcy5sb2dnZWRJblVzZXI/LmdldE5hbWUoKX1gLFxuICAgICAgXCJcIixcbiAgICAgIFwiZnVsbHNjcmVlbj15ZXMsIHNjcm9sbGJhcnM9YXV0b1wiXG4gICAgKTtcbiAgfTtcbiAgLyoqXG4gICAqIEV4dHJhY3RpbmcgIHR5cGVzIGFuZCBjYXRlZ29yaWVzIGZyb20gdGVtcGxhdGVcbiAgICpcbiAgICovXG4gIGNoZWNrTWVzc2FnZVRlbXBsYXRlKCkge1xuICAgIHRoaXMudHlwZXNNYXAgPSB7XG4gICAgICB0ZXh0OiB0aGlzLnRleHRCdWJibGUsXG4gICAgICBmaWxlOiB0aGlzLmZpbGVCdWJibGUsXG4gICAgICBhdWRpbzogdGhpcy5hdWRpb0J1YmJsZSxcbiAgICAgIHZpZGVvOiB0aGlzLnZpZGVvQnViYmxlLFxuICAgICAgaW1hZ2U6IHRoaXMuaW1hZ2VCdWJibGUsXG4gICAgICBncm91cE1lbWJlcjogdGhpcy50ZXh0QnViYmxlLFxuICAgICAgZXh0ZW5zaW9uX3N0aWNrZXI6IHRoaXMuc3RpY2tlckJ1YmJsZSxcbiAgICAgIGV4dGVuc2lvbl93aGl0ZWJvYXJkOiB0aGlzLndoaXRlYm9hcmRCdWJibGUsXG4gICAgICBleHRlbnNpb25fZG9jdW1lbnQ6IHRoaXMuZG9jdW1lbnRCdWJibGUsXG4gICAgICBleHRlbnNpb25fcG9sbDogdGhpcy5wb2xsQnViYmxlLFxuICAgICAgbWVldGluZzogdGhpcy5kaXJlY3RDYWxsaW5nLFxuICAgICAgc2NoZWR1bGVyOiB0aGlzLnNjaGVkdWxlckJ1YmJsZSxcbiAgICAgIGZvcm06IHRoaXMuZm9ybUJ1YmJsZSxcbiAgICAgIGNhcmQ6IHRoaXMuY2FyZEJ1YmJsZSxcbiAgICB9O1xuICAgIHRoaXMuc2V0QnViYmxlVmlldygpO1xuICB9XG4gIGdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlLCB0eXBlPzogc3RyaW5nKSB7XG4gICAgbGV0IGRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0Q3VzdG9tRGF0YSgpO1xuICAgIGlmICh0eXBlKSB7XG4gICAgICByZXR1cm4gZGF0YVt0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgfVxuICB9XG4gIGdldFRocmVhZENvdW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHZhciByZXBseUNvdW50ID0gbWVzc2FnZT8uZ2V0UmVwbHlDb3VudCgpIHx8IDA7XG4gICAgdmFyIHN1ZmZpeCA9IHJlcGx5Q291bnQgPT09IDEgPyBsb2NhbGl6ZShcIlJFUExZXCIpIDogbG9jYWxpemUoXCJSRVBMSUVTXCIpO1xuICAgIHJldHVybiBgJHtyZXBseUNvdW50fSAke3N1ZmZpeH1gO1xuICB9XG4gIHNob3dFbmFibGVkRXh0ZW5zaW9ucygpIHtcbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInRleHRtb2RlcmF0b3JcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlRGF0YU1hc2tpbmcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInRodW1ibmFpbGdlbmVyYXRpb25cIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlVGh1bWJuYWlsR2VuZXJhdGlvbiA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwibGlua3ByZXZpZXdcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlTGlua1ByZXZpZXcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInBvbGxzXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVBvbGxzID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJyZWFjdGlvbnNcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlUmVhY3Rpb25zID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJpbWFnZW1vZGVyYXRpb25cIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlSW1hZ2VNb2RlcmF0aW9uID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJzdGlja2Vyc1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVTdGlja2VycyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiY29sbGFib3JhdGl2ZXdoaXRlYm9hcmRcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlV2hpdGVib2FyZCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiY29sbGFib3JhdGl2ZWRvY3VtZW50XCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZURvY3VtZW50ID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJjYWxsaW5nXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUNhbGxpbmcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImFpY29udmVyc2F0aW9uc3RhcnRlclwiKSkge1xuICAgICAgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdGFydGVyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJhaWNvbnZlcnNhdGlvbnN1bW1hcnlcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3VtbWFyeSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBvcGVuQ29uZmlybURpYWxvZzogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgb3BlbkZ1bGxzY3JlZW5WaWV3OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpbWFnZXVybFRvT3Blbjogc3RyaW5nID0gXCJcIjtcbiAgZnVsbFNjcmVlblZpZXdlclN0eWxlOiBGdWxsU2NyZWVuVmlld2VyU3R5bGUgPSB7XG4gICAgY2xvc2VJY29uVGludDogXCJibHVlXCIsXG4gIH07XG4gIG9wZW5JbWFnZUluRnVsbFNjcmVlbihtZXNzYWdlOiBhbnkpIHtcbiAgICB0aGlzLmltYWdldXJsVG9PcGVuID0gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybDtcbiAgICB0aGlzLm9wZW5GdWxsc2NyZWVuVmlldyA9IHRydWU7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGNsb3NlSW1hZ2VJbkZ1bGxTY3JlZW4oKSB7XG4gICAgdGhpcy5pbWFnZXVybFRvT3BlbiA9IFwiXCI7XG4gICAgdGhpcy5vcGVuRnVsbHNjcmVlblZpZXcgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgb3Blbldhcm5pbmdEaWFsb2coZXZlbnQ6IGFueSkge1xuICAgIHRoaXMuY2xvc2VJbWFnZU1vZGVyYXRpb24gPSBldmVudD8uZGV0YWlsPy5vbkNvbmZpcm07XG4gICAgdGhpcy5vcGVuQ29uZmlybURpYWxvZyA9IHRydWU7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIG9uQ29uZmlybUNsaWNrID0gKCkgPT4ge1xuICAgIHRoaXMub3BlbkNvbmZpcm1EaWFsb2cgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5jbG9zZUltYWdlTW9kZXJhdGlvbikge1xuICAgICAgdGhpcy5jbG9zZUltYWdlTW9kZXJhdGlvbigpO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIG9uQ2FuY2VsQ2xpY2soKSB7XG4gICAgdGhpcy5vcGVuQ29uZmlybURpYWxvZyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBnZXRUZXh0TWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIHZhciB0ZXh0ID0gdGhpcy5lbmFibGVEYXRhTWFza2luZ1xuICAgICAgPyBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0RXh0ZW5zaW9uRGF0YShtZXNzYWdlKVxuICAgICAgOiBudWxsO1xuICAgIHJldHVybiB0ZXh0Py50cmltKCk/Lmxlbmd0aCA+IDAgPyB0ZXh0IDogbWVzc2FnZS5nZXRUZXh0KCk7XG4gIH1cbiAgZ2V0TGlua1ByZXZpZXcobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgaWYgKG1lc3NhZ2U/LmdldE1ldGFkYXRhKCkgJiYgdGhpcy5lbmFibGVMaW5rUHJldmlldykge1xuICAgICAgICB2YXIgbWV0YWRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICAgICAgdmFyIGluamVjdGVkT2JqZWN0ID0gbWV0YWRhdGFbTGlua1ByZXZpZXdDb25zdGFudHMuaW5qZWN0ZWRdO1xuICAgICAgICBpZiAoaW5qZWN0ZWRPYmplY3QgJiYgaW5qZWN0ZWRPYmplY3Q/LmV4dGVuc2lvbnMpIHtcbiAgICAgICAgICB2YXIgZXh0ZW5zaW9uc09iamVjdCA9IGluamVjdGVkT2JqZWN0LmV4dGVuc2lvbnM7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgZXh0ZW5zaW9uc09iamVjdCAmJlxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgICAgIGV4dGVuc2lvbnNPYmplY3QsXG4gICAgICAgICAgICAgIExpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtfcHJldmlld1xuICAgICAgICAgICAgKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFyIGxpbmtQcmV2aWV3T2JqZWN0ID1cbiAgICAgICAgICAgICAgZXh0ZW5zaW9uc09iamVjdFtMaW5rUHJldmlld0NvbnN0YW50cy5saW5rX3ByZXZpZXddO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBsaW5rUHJldmlld09iamVjdCAmJlxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICAgICAgICBsaW5rUHJldmlld09iamVjdCxcbiAgICAgICAgICAgICAgICBMaW5rUHJldmlld0NvbnN0YW50cy5saW5rc1xuICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgIGxpbmtQcmV2aWV3T2JqZWN0W0xpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtzXS5sZW5ndGhcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gbGlua1ByZXZpZXdPYmplY3RbTGlua1ByZXZpZXdDb25zdGFudHMubGlua3NdWzBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldEltYWdlVGh1bWJuYWlsKG1zZzogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSk6IHN0cmluZyB7XG4gICAgdmFyIG1lc3NhZ2U6IGFueSA9IG1zZyBhcyBDb21ldENoYXQuTWVkaWFNZXNzYWdlO1xuICAgIGxldCBpbWFnZVVSTCA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZW5hYmxlVGh1bWJuYWlsR2VuZXJhdGlvbikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIG1ldGFkYXRhOiBhbnkgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgICAgIHZhciBpbmplY3RlZE9iamVjdCA9IG1ldGFkYXRhPy5bXG4gICAgICAgICAgVGh1bWJuYWlsR2VuZXJhdGlvbkNvbnN0YW50cy5pbmplY3RlZFxuICAgICAgICBdIGFzIHsgZXh0ZW5zaW9ucz86IGFueSB9O1xuICAgICAgICB2YXIgZXh0ZW5zaW9uc09iamVjdCA9IGluamVjdGVkT2JqZWN0Py5leHRlbnNpb25zO1xuICAgICAgICB2YXIgdGh1bWJuYWlsR2VuZXJhdGlvbk9iamVjdCA9XG4gICAgICAgICAgZXh0ZW5zaW9uc09iamVjdFtUaHVtYm5haWxHZW5lcmF0aW9uQ29uc3RhbnRzLnRodW1ibmFpbF9nZW5lcmF0aW9uXTtcbiAgICAgICAgdmFyIGltYWdlVG9Eb3dubG9hZCA9IHRodW1ibmFpbEdlbmVyYXRpb25PYmplY3Q/LnVybF9zbWFsbDtcbiAgICAgICAgaWYgKGltYWdlVG9Eb3dubG9hZCkge1xuICAgICAgICAgIGltYWdlVVJMID0gaW1hZ2VUb0Rvd25sb2FkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltYWdlVVJMID0gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNcbiAgICAgICAgICAgID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybFxuICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaW1hZ2VVUkwgPSBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1xuICAgICAgICA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmxcbiAgICAgICAgOiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gaW1hZ2VVUkw7XG4gIH1cbiAgZ2V0TGlua1ByZXZpZXdEZXRhaWxzKGtleTogc3RyaW5nLCBtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIGxldCBsaW5rUHJldmlld09iamVjdDogYW55ID0gdGhpcy5nZXRMaW5rUHJldmlldyhtZXNzYWdlKTtcbiAgICBpZiAoT2JqZWN0LmtleXMobGlua1ByZXZpZXdPYmplY3QpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBsaW5rUHJldmlld09iamVjdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5maXJzdFJlbG9hZCA9IHRydWU7XG4gICAgdGhpcy5zZXRNZXNzYWdlc1N0eWxlKCk7XG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpO1xuICAgIHRoaXMuc2V0RGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5zZXRPbmdvaW5nQ2FsbFN0eWxlKCk7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXI7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgdGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUuYmFja2dyb3VuZCA9XG4gICAgICB0aGlzLmRhdGVTZXBhcmF0b3JTdHlsZS5iYWNrZ3JvdW5kIHx8XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpO1xuICAgIHRoaXMuZGl2aWRlclN0eWxlLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKTtcbiAgICBcbiAgICB0aGlzLmxhYmVsU3R5bGUudGV4dENvbG9yID0gdGhpcy5tZXNzYWdlTGlzdFN0eWxlLm5hbWVUZXh0Q29sb3IgfHwgdGhpcy5sYWJlbFN0eWxlLnRleHRDb2xvcjtcbiAgICB0aGlzLmxhYmVsU3R5bGUudGV4dEZvbnQgPSB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUubmFtZVRleHRGb250IHx8IHRoaXMubGFiZWxTdHlsZS50ZXh0Rm9udDtcbiAgICB0aGlzLmxvYWRpbmdTdHlsZS5pY29uVGludCA9IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5sb2FkaW5nSWNvblRpbnQgfHwgdGhpcy5sb2FkaW5nU3R5bGUuaWNvblRpbnQ7XG4gIH1cbiAgc2V0T25nb2luZ0NhbGxTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG4gICAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcbiAgICAgIG1pbkhlaWdodDogXCI0MDBweFwiLFxuICAgICAgbWluV2lkdGg6IFwiNDAwcHhcIixcbiAgICAgIG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBtYXhpbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH0pO1xuICAgIHRoaXMub25nb2luZ0NhbGxTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLm9uZ29pbmdDYWxsU3R5bGUgfTtcbiAgfTtcbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICAgIGhlaWdodDogXCIyOHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0RGF0ZVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHBhZGRpbmc6IFwiNnB4IDEycHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTZXBhcmF0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTZXBhcmF0b3JTdHlsZSB9O1xuICB9XG4gIHNldE1lc3NhZ2VzU3R5bGUoKSB7XG4gICAgdGhpcy5wb3BvdmVyU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMzMwcHhcIixcbiAgICAgIHdpZHRoOiBcIjMyNXB4XCIsXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJveFNoYWRvdzogYCR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX0gMHB4IDBweCA4cHhgXG4gICAgfVxuICAgIGxldCBkZWZhdWx0RW1vamlTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIzMzBweFwiLFxuICAgICAgd2lkdGg6IFwiMzI1cHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIC4uLnRoaXMuZW1vamlLZXlib2FyZFN0eWxlXG4gICAgfVxuICAgIHRoaXMuZW1vamlLZXlib2FyZFN0eWxlID0gZGVmYXVsdEVtb2ppU3R5bGU7XG4gICAgdGhpcy51bnJlYWRNZXNzYWdlc1N0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgfTtcbiAgICB0aGlzLnNtYXJ0UmVwbHlTdHlsZSA9IHtcbiAgICAgIHJlcGx5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZXBseVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHJlcGx5QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3hTaGFkb3c6IGAwcHggMHB4IDFweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCl9YCxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIC4uLnRoaXMuc21hcnRSZXBseVN0eWxlLFxuICAgIH07XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3R5bGUgPSB7XG4gICAgICByZXBseVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjEpLFxuICAgICAgcmVwbHlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICByZXBseUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm94U2hhZG93OiBgMHB4IDBweCAxcHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpfWAsXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICAuLi50aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdHlsZSxcbiAgICB9O1xuXG4gICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3R5bGUgPSB7XG4gICAgICAuLi50aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZSxcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3hTaGFkb3c6IGAwcHggMHB4IDFweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCl9YCxcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSEsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCkhLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIGJvcmRlcjogXCIxcHggc29saWQgIzY4NTFENlwiLFxuICAgIH07XG5cbiAgICB0aGlzLmZ1bGxTY3JlZW5WaWV3ZXJTdHlsZS5jbG9zZUljb25UaW50ID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpO1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IE1lc3NhZ2VMaXN0U3R5bGUgPSBuZXcgTWVzc2FnZUxpc3RTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0aHJlYWRSZXBseVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGhyZWFkUmVwbHlJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIHRocmVhZFJlcGx5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGhyZWFkUmVwbHlVbnJlYWRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHRocmVhZFJlcGx5VW5yZWFkVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgdGhyZWFkUmVwbHlVbnJlYWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIFRpbWVzdGFtcFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24zXG4gICAgICApLFxuICAgIH0pO1xuICAgIHRoaXMubWVzc2FnZUxpc3RTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLm1lc3NhZ2VMaXN0U3R5bGUgfTtcbiAgICB0aGlzLmxpbmtQcmV2aWV3U3R5bGUgPSBuZXcgTGlua1ByZXZpZXdTdHlsZSh7XG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIGRlc2NyaXB0aW9uQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkZXNjcmlwdGlvbkZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICB9KTtcbiAgICB0aGlzLmRvY3VtZW50QnViYmxlU3R5bGUgPSB7XG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBpY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgIH07XG4gICAgdGhpcy5wb2xsQnViYmxlU3R5bGUgPSB7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB2b3RlUGVyY2VudFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHZvdGVQZXJjZW50VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcG9sbFF1ZXN0aW9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgcG9sbFF1ZXN0aW9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcG9sbE9wdGlvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgcG9sbE9wdGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHBvbGxPcHRpb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgb3B0aW9uc0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdG90YWxWb3RlQ291bnRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0b3RhbFZvdGVDb3VudFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHNlbGVjdGVkUG9sbE9wdGlvbkJhY2tncm91bmQ6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICB1c2VyU2VsZWN0ZWRPcHRpb25CYWNrZ3JvdW5kOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHBvbGxPcHRpb25Cb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBwb2xsT3B0aW9uQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH07XG4gICAgdGhpcy5pbWFnZU1vZGVyYXRpb25TdHlsZSA9IHtcbiAgICAgIGZpbHRlckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgd2FybmluZ1RleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgd2FybmluZ1RleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9O1xuICAgIHRoaXMuY29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfTtcbiAgfVxuICBnZXRSZWNlaXB0U3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgY29uc3QgaXNUZXh0TWVzc2FnZSA9XG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0ICYmXG4gICAgICB0aGlzLmFsaWdubWVudCAhPSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIHRoaXMucmVjZWlwdFN0eWxlID0gbmV3IFJlY2VpcHRTdHlsZSh7XG4gICAgICB3YWl0SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBzZW50SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkZWxpdmVyZWRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHJlYWRJY29uVGludDogaXNUZXh0TWVzc2FnZVxuICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpXG4gICAgICAgIDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBlcnJvckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBoZWlnaHQ6IFwiMTFweFwiLFxuICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gICAgfSk7XG4gICAgcmV0dXJuIHsgLi4udGhpcy5yZWNlaXB0U3R5bGUgfTtcbiAgfVxuICBjcmVhdGVSZXF1ZXN0QnVpbGRlcigpIHtcbiAgICBpZiAoIXRoaXMudGVtcGxhdGVzIHx8IHRoaXMudGVtcGxhdGVzPy5sZW5ndGggPT0gMCkge1xuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUgPVxuICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxNZXNzYWdlVGVtcGxhdGVzKCk7XG4gICAgICB0aGlzLmNhdGVnb3JpZXMgPVxuICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxNZXNzYWdlQ2F0ZWdvcmllcygpO1xuICAgICAgdGhpcy50eXBlcyA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFsbE1lc3NhZ2VUeXBlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGVzO1xuICAgIH1cbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG51bGw7XG4gICAgaWYgKHRoaXMudXNlciB8fCB0aGlzLmdyb3VwKSB7XG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA/IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSkuYnVpbGQoKVxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAgIC5zZXRVSUQodGhpcy51c2VyLmdldFVpZCgpKVxuICAgICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgICAuc2V0VHlwZXModGhpcy50eXBlcylcbiAgICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAgIC5oaWRlUmVwbGllcyh0cnVlKVxuICAgICAgICAgICAgLmJ1aWxkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKClcbiAgICAgICAgICA6IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgICAuc2V0R1VJRCh0aGlzLmdyb3VwLmdldEd1aWQoKSlcbiAgICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAgIC5idWlsZCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5jb21wdXRlVW5yZWFkQ291bnQoKTtcbiAgICAgIHRoaXMuZmV0Y2hQcmV2aW91c01lc3NhZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgY29tcHV0ZVVucmVhZENvdW50KCkge1xuICAgIGlmICh0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCkge1xuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICBDb21ldENoYXQuZ2V0VW5yZWFkTWVzc2FnZUNvdW50Rm9yVXNlcih0aGlzLnVzZXI/LmdldFVpZCgpKS50aGVuKFxuICAgICAgICAgIChyZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNLZXkgPSB0aGlzLnVzZXI/LmdldFVpZCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdldFVucmVhZENvdW50ID0gcmVzW2R5bmFtaWNLZXkgYXMga2V5b2YgdHlwZW9mIHJlc107XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3IpID0+IHsgfVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0LmdldFVucmVhZE1lc3NhZ2VDb3VudEZvckdyb3VwKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkudGhlbihcbiAgICAgICAgICAocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkeW5hbWljS2V5ID0gdGhpcy5ncm91cD8uZ2V0R3VpZCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdldFVucmVhZENvdW50ID0gcmVzW2R5bmFtaWNLZXkgYXMga2V5b2YgdHlwZW9mIHJlc107XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3IpID0+IHsgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogTGlzdGVuZXIgVG8gUmVjZWl2ZSBNZXNzYWdlcyBpbiBSZWFsIFRpbWVcbiAgICogQHBhcmFtXG4gICAqL1xuICBmZXRjaFByZXZpb3VzTWVzc2FnZXMgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMucmVpbml0aWFsaXplZCkge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyXG4gICAgICAgICAgPyB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICAgIC5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSlcbiAgICAgICAgICAgIC5zZXRNZXNzYWdlSWQodGhpcy5tZXNzYWdlc0xpc3RbMF0uZ2V0SWQoKSlcbiAgICAgICAgICAgIC5idWlsZCgpXG4gICAgICAgICAgOiB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICAgIC5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSlcbiAgICAgICAgICAgIC5zZXRNZXNzYWdlSWQodGhpcy5tZXNzYWdlc0xpc3RbMF0uZ2V0SWQoKSlcbiAgICAgICAgICAgIC5idWlsZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgLnNldE1lc3NhZ2VJZCh0aGlzLm1lc3NhZ2VzTGlzdFswXS5nZXRJZCgpKVxuICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlclxuICAgICAgLmZldGNoUHJldmlvdXMoKVxuICAgICAgLnRoZW4oXG4gICAgICAgIChtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICAgICAgICBpZiAobWVzc2FnZUxpc3QgJiYgbWVzc2FnZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZUxpc3QgPSBtZXNzYWdlTGlzdC5tYXAoXG4gICAgICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09XG4gICAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmVcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgICAgICAgIC8vIE5vIE1lc3NhZ2VzIEZvdW5kXG4gICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0Lmxlbmd0aCA9PT0gMCAmJiB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICBpZiAoIXRoaXMucGFyZW50TWVzc2FnZUlkICYmIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlcikge1xuICAgICAgICAgICAgICB0aGlzLmZldGNoQ29udmVyc2F0aW9uU3RhcnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWVzc2FnZUxpc3QgJiYgbWVzc2FnZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmdldFVucmVhZENvdW50ID49IHRoaXMudW5yZWFkTWVzc2FnZVRocmVzaG9sZCAmJlxuICAgICAgICAgICAgICB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLmZldGNoQ29udmVyc2F0aW9uU3VtbWFyeSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIoXG4gICAgICAgICAgICAgICAgbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV0uZ2V0SWQoKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBsZXQgaXNTZW50QnlNZTogYm9vbGVhbiA9IGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT1cbiAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICFpc1NlbnRCeU1lICYmXG4gICAgICAgICAgICAgICFsYXN0TWVzc2FnZS5nZXREZWxpdmVyZWRBdCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgLy9tYXJrIHRoZSBtZXNzYWdlIGFzIGRlbGl2ZXJlZFxuICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKGxhc3RNZXNzYWdlKS50aGVuKFxuICAgICAgICAgICAgICAgICAgKHJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PSBOdW1iZXIocmVjZWlwdD8uZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbGFzdE1lc3NhZ2U/LmdldFJlYWRBdCgpICYmICFpc1NlbnRCeU1lKSB7XG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oKHJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PSBOdW1iZXIocmVjZWlwdD8uZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIC8vaWYgdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZSBpcyBub3QgdGhlIGxvZ2dlZGluIHVzZXIsIG1hcmsgaXQgYXMgcmVhZC5cbiAgICAgICAgICAgIGxldCBwcmV2U2Nyb2xsSGVpZ2h0ID0gdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodDtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmxpc3RTY3JvbGwubmF0aXZlRWxlbWVudC5zY3JvbGxUb3AgPVxuICAgICAgICAgICAgICAgIHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQgLSBwcmV2U2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5wcmVwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVyKCk7XG4gICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICApXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG4gIGZldGNoQWN0aW9uTWVzc2FnZXMoKSB7XG4gICAgbGV0IHJlcXVlc3RCdWlsZGVyOiBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAuc2V0VHlwZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSlcbiAgICAgIC5zZXRDYXRlZ29yeShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKVxuICAgICAgLnNldE1lc3NhZ2VJZCh0aGlzLmxhc3RNZXNzYWdlSWQpXG4gICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICByZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICByZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSk7XG4gICAgfVxuICAgIHJlcXVlc3RCdWlsZGVyLmJ1aWxkKClcbiAgICAgIC5mZXRjaE5leHQoKVxuICAgICAgLnRoZW4oKG1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlcyAmJiBtZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbWVzc2FnZXMuZm9yRWFjaCgobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5BY3Rpb24pLmdldEFjdGlvbk9uKCkgaW5zdGFuY2VvZlxuICAgICAgICAgICAgICBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAobSkgPT5cbiAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT1cbiAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkFjdGlvblxuICAgICAgICAgICAgICAgICAgICApLmdldEFjdGlvbk9uKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICAgICAgICAgICApLmdldElkKClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPj0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldID0gKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uXG4gICAgICAgICAgICAgICAgKS5nZXRBY3Rpb25PbigpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cbiAgZmV0Y2hOZXh0TWVzc2FnZSA9ICgpID0+IHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAxO1xuICAgIGxldCBtZXNzYWdlSWQ6IG51bWJlcjtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlaW5pdGlhbGl6ZWQgfHxcbiAgICAgICh0aGlzLmxhc3RNZXNzYWdlSWQgPiAwICYmIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZClcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5mZXRjaEFjdGlvbk1lc3NhZ2VzKCk7XG4gICAgICAgIG1lc3NhZ2VJZCA9IHRoaXMubGFzdE1lc3NhZ2VJZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2VJZCA9IHRoaXMubWVzc2FnZXNMaXN0W2luZGV4XS5nZXRJZCgpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyXG4gICAgICAgICAgPyB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICAgIC5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSlcbiAgICAgICAgICAgIC5zZXRNZXNzYWdlSWQobWVzc2FnZUlkKVxuICAgICAgICAgICAgLmJ1aWxkKClcbiAgICAgICAgICA6IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgICAgLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKVxuICAgICAgICAgICAgLnNldE1lc3NhZ2VJZChtZXNzYWdlSWQpXG4gICAgICAgICAgICAuYnVpbGQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgIC5zZXRNZXNzYWdlSWQobWVzc2FnZUlkKVxuICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLmZldGNoTmV4dCgpXG4gICAgICAgIC50aGVuKFxuICAgICAgICAgIChtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VMaXN0ID0gbWVzc2FnZUxpc3QubWFwKFxuICAgICAgICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmVcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMuY29udmVydEludGVyYWN0aXZlTWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgICAgIC8vIE5vIE1lc3NhZ2VzIEZvdW5kXG4gICAgICAgICAgICBpZiAobWVzc2FnZUxpc3QubGVuZ3RoID09PSAwICYmIHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNPbkJvdHRvbSkge1xuICAgICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdLmdldElkKClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldERlbGl2ZXJlZEF0KCkgJiZcbiAgICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXS5nZXRJZCgpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzKSB7XG4gICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50VGV4dCA9IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQ7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb3VudFRleHQgPVxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2NhbGl6ZShcIk5FV19NRVNTQUdFXCIpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKC4uLm1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgICAgICAgICAgXCIg4oaTIFwiICsgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggKyBcIiBcIiArIGNvdW50VGV4dDtcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgIWxhc3RNZXNzYWdlPy5nZXREZWxpdmVyZWRBdCgpICYmXG4gICAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzRGVsaXZlcmVkKG1lc3NhZ2VMaXN0Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2VzKG1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5tZXNzYWdlc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBhcHBlbmRNZXNzYWdlcyA9IChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICB0aGlzLm1lc3NhZ2VzTGlzdC5wdXNoKC4uLm1lc3NhZ2VzKTtcbiAgICB0aGlzLm1lc3NhZ2VDb3VudCA9IHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aDtcbiAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VCdWlsZGVyKCk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRNZXNzYWdlKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gY29ubmVjdGVkXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICBhZGRNZXNzYWdlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdyb3VwTGlzdGVuZXJJZCxcbiAgICAgICAgbmV3IENvbWV0Q2hhdC5Hcm91cExpc3RlbmVyKHtcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgY2hhbmdlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRSxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwLFxuICAgICAgICAgICAgICB7IHVzZXI6IGNoYW5nZWRVc2VyLCBzY29wZTogbmV3U2NvcGUgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICBraWNrZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGtpY2tlZEZyb206IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBraWNrZWRGcm9tLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjoga2lja2VkVXNlcixcbiAgICAgICAgICAgICAgICBoYXNKb2luZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckJhbm5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgYmFubmVkRnJvbTogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGJhbm5lZEZyb20sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBiYW5uZWRVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlclVuYmFubmVkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5iYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVuYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdW5iYW5uZWRGcm9tOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICB1bmJhbm5lZEZyb20sXG4gICAgICAgICAgICAgIHsgdXNlcjogdW5iYW5uZWRVc2VyIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRJbjogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW4sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiB1c2VyQWRkZWQsXG4gICAgICAgICAgICAgICAgaGFzSm9pbmVkOiB0cnVlLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICAgICAgICAgIGxlYXZpbmdVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGdyb3VwLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogbGVhdmluZ1VzZXIsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgICAgICAgICBqb2luZWRVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgICBqb2luZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgam9pbmVkR3JvdXAsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBqb2luZWRVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMuZW5hYmxlQ2FsbGluZykge1xuICAgICAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuY2FsbExpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5DYWxsTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNhbGxFbmRlZE1lc3NhZ2VSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWFjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvbkFkZGVkID1cbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZVJlYWN0aW9uQWRkZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9BRERFRCxcbiAgICAgICAgICAgICAgICByZWFjdGlvblJlY2VpcHRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZCA9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVELFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uUmVjZWlwdFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UZXh0TWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25Gb3JtTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogRm9ybU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DYXJkTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ2FyZE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNEZWxpdmVyZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMSVZFUkVELFxuICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzUmVhZC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFELFxuICAgICAgICAgICAgbWVzc2FnZVJlY2VpcHRcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VEZWxldGVkLnN1YnNjcmliZShcbiAgICAgICAgKGRlbGV0ZWRNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQsXG4gICAgICAgICAgICBkZWxldGVkTWVzc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZUVkaXRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgICAgKGVkaXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVELFxuICAgICAgICAgICAgZWRpdGVkTWVzc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uVHJhbnNpZW50TWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKHRyYW5zaWVudE1lc3NhZ2U6IENvbWV0Q2hhdC5UcmFuc2llbnRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGl2ZVJlYWN0aW9uOiBhbnkgPSB0cmFuc2llbnRNZXNzYWdlLmdldERhdGEoKTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgICAgICAgdGhpcy51c2VyICYmXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMudXNlci5nZXRVaWQoKSAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1widHlwZVwiXSA9PSBcImxpdmVfcmVhY3Rpb25cIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NMaXZlUmVhY3Rpb24ubmV4dChcbiAgICAgICAgICAgICAgICBsaXZlUmVhY3Rpb25bXCJyZWFjdGlvblwiXVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PSB0aGlzLmdyb3VwLmdldEd1aWQoKSAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1widHlwZVwiXSA9PSBcImxpdmVfcmVhY3Rpb25cIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NMaXZlUmVhY3Rpb24ubmV4dChcbiAgICAgICAgICAgICAgICBsaXZlUmVhY3Rpb25bXCJyZWFjdGlvblwiXVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkludGVyYWN0aW9uR29hbENvbXBsZXRlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25JbnRlcmFjdGlvbkdvYWxDb21wbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChyZWNlaXB0OiBDb21ldENoYXQuSW50ZXJhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSU9OX0dPQUxfQ09NUExFVEVELFxuICAgICAgICAgICAgICByZWNlaXB0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIFVwZGF0ZXMgbWVzc2FnZUxpc3Qgb24gYmFzaXMgb2YgdXNlciBhY3Rpdml0eSBvciBncm91cCBhY3Rpdml0eSBvciBjYWxsaW5nIGFjdGl2aXR5XG4gICAqIEBwYXJhbSAge2FueT1udWxsfSBrZXlcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0IHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Hcm91cCB8IG51bGw9bnVsbH0gZ3JvdXBcbiAgICogQHBhcmFtICB7YW55PW51bGx9IG9wdGlvbnNcbiAgICovXG4gIG1lc3NhZ2VVcGRhdGUoXG4gICAga2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQgfCBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBhbnkgPSBudWxsLFxuICAgIGdyb3VwOiBDb21ldENoYXQuR3JvdXAgfCBudWxsID0gbnVsbCxcbiAgICBvcHRpb25zOiBhbnkgPSBudWxsXG4gICkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgPSBbXTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuVEVYVF9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWNlaXZlZChtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUQ6XG5cbiAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMRVRFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRDoge1xuICAgICAgICAgIHRoaXMubWVzc2FnZUVkaXRlZChtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRTpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5KT0lORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5LSUNLRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVEOiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5pc1RocmVhZE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSU9OX0dPQUxfQ09NUExFVEVEOlxuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVJbnRlcmFjdGl2ZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9BRERFRDpcbiAgICAgICAgICB0aGlzLm9uUmVhY3Rpb25VcGRhdGVkKG1lc3NhZ2UsIHRydWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFRDpcbiAgICAgICAgICB0aGlzLm9uUmVhY3Rpb25VcGRhdGVkKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIGEgbWVzc2FnZSdzIHJlYWN0aW9ucyBiYXNlZCBvbiBhIG5ldyByZWFjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb25FdmVudH0gbWVzc2FnZSAtIFRoZSBuZXcgbWVzc2FnZSByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtib29sZWFufSBpc0FkZGVkIC0gVHJ1ZSBpZiB0aGUgcmVhY3Rpb24gd2FzIGFkZGVkLCBmYWxzZSBpZiBpdCB3YXMgcmVtb3ZlZC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgZmFsc2UgaWYgdGhlIG1lc3NhZ2Ugd2FzIG5vdCBmb3VuZCwgdHJ1ZSBvdGhlcndpc2UuXG4gICAqL1xuXG4gIG9uUmVhY3Rpb25VcGRhdGVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5SZWFjdGlvbkV2ZW50LCBpc0FkZGVkOiBib29sZWFuKSB7XG4gICAgY29uc3QgbWVzc2FnZUlkID0gbWVzc2FnZS5nZXRSZWFjdGlvbigpPy5nZXRNZXNzYWdlSWQoKTtcbiAgICBjb25zdCBtZXNzYWdlT2JqZWN0ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlSWQpO1xuXG4gICAgaWYgKCFtZXNzYWdlT2JqZWN0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGFjdGlvbjogQ29tZXRDaGF0LlJFQUNUSU9OX0FDVElPTjtcbiAgICBpZiAoaXNBZGRlZCkge1xuICAgICAgYWN0aW9uID0gQ29tZXRDaGF0LlJFQUNUSU9OX0FDVElPTi5SRUFDVElPTl9BRERFRDtcbiAgICB9IGVsc2Uge1xuICAgICAgYWN0aW9uID0gQ29tZXRDaGF0LlJFQUNUSU9OX0FDVElPTi5SRUFDVElPTl9SRU1PVkVEO1xuICAgIH1cbiAgICBsZXQgbW9kaWZpZWRNZXNzYWdlID1cbiAgICAgIENvbWV0Q2hhdC5Db21ldENoYXRIZWxwZXIudXBkYXRlTWVzc2FnZVdpdGhSZWFjdGlvbkluZm8oXG4gICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVhY3Rpb24oKSxcbiAgICAgICAgYWN0aW9uXG4gICAgICApO1xuICAgIGlmIChtb2RpZmllZE1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtb2RpZmllZE1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogdHJhbnNsYXRlIG1lc3NhZ2UgdGhlbiBjYWxsIHVwZGF0ZSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgLy8gdHJhbnNsYXRlTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgLy8gfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtYXJrTWVzc2FnZUFzRGVsaXZlcmVkID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGlmIChcbiAgICAgICF0aGlzLmRpc2FibGVSZWNlaXB0ICYmXG4gICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICBtZXNzYWdlLmhhc093blByb3BlcnR5KFwiZGVsaXZlcmVkQXRcIikgPT09IGZhbHNlXG4gICAgKSB7XG4gICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIFdoZW4gTWVzc2FnZSBpcyBSZWNlaXZlZFxuICAgKiBAcGFyYW0gbWVzc2FnZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICB0cnkge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5ncm91cD8uZ2V0R3VpZCgpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgICFtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKSB8fFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICAgICAgICB0aGlzLmlzT25Cb3R0b20pXG4gICAgICAgICkge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0aW5nIHRoZSByZXBseSBjb3VudCBvZiBUaHJlYWQgUGFyZW50IE1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgdXBkYXRlUmVwbHlDb3VudChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZWNlaXZlZE1lc3NhZ2UgPSBtZXNzYWdlcztcbiAgICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IHJlY2VpdmVkTWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VLZXldO1xuICAgICAgICBsZXQgcmVwbHlDb3VudCA9IG1lc3NhZ2VPYmouZ2V0UmVwbHlDb3VudCgpXG4gICAgICAgICAgPyBtZXNzYWdlT2JqLmdldFJlcGx5Q291bnQoKVxuICAgICAgICAgIDogMDtcbiAgICAgICAgcmVwbHlDb3VudCA9IHJlcGx5Q291bnQgKyAxO1xuICAgICAgICBtZXNzYWdlT2JqLnNldFJlcGx5Q291bnQocmVwbHlDb3VudCk7XG4gICAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlT2JqKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZUxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7c3RyaW5nfSB0eXBlXG4gICAqL1xuICBtZXNzYWdlUmVjZWl2ZWRIYW5kbGVyID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICsrdGhpcy5tZXNzYWdlQ291bnQ7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIC8vIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMudXBkYXRlVW5yZWFkUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGlmICghdGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgIFwiIOKGkyBcIiArIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgLy9oYW5kbGluZyBkb20gbGFnIC0gaW5jcmVtZW50IGNvdW50IG9ubHkgZm9yIG1haW4gbWVzc2FnZSBsaXN0XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gZmFsc2UgJiZcbiAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkXG4gICAgKSB7XG4gICAgICArK3RoaXMubWVzc2FnZUNvdW50O1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtZXNzYWdlLmhhc093blByb3BlcnR5KFwicGFyZW50TWVzc2FnZUlkXCIpID09PSB0cnVlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICB0aGlzLmlzT25Cb3R0b21cbiAgICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChtZXNzYWdlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgfVxuICB9O1xuICBwbGF5QXVkaW8oKSB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5Tb3VuZC5pbmNvbWluZ01lc3NhZ2UsXG4gICAgICAgICAgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0Q2FsbEJ1aWxkZXIgPSAoKTogYW55ID0+IHtcbiAgICBjb25zdCBjYWxsU2V0dGluZ3M6IGFueSA9IG5ldyBDb21ldENoYXRVSUtpdENhbGxzLkNhbGxTZXR0aW5nc0J1aWxkZXIoKVxuICAgICAgLmVuYWJsZURlZmF1bHRMYXlvdXQodHJ1ZSlcbiAgICAgIC5zZXRJc0F1ZGlvT25seUNhbGwoZmFsc2UpXG4gICAgICAuc2V0Q2FsbExpc3RlbmVyKFxuICAgICAgICBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5PbmdvaW5nQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkNhbGxFbmRCdXR0b25QcmVzc2VkOiAoKSA9PiB7XG4gICAgICAgICAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBudWxsKTtcbiAgICAgICAgICAgIENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQubmV4dCh7fSBhcyBDb21ldENoYXQuQ2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgcmV0dXJuIGNhbGxTZXR0aW5ncztcbiAgfTtcbiAgcmVJbml0aWFsaXplTWVzc2FnZUxpc3QoKSB7XG4gICAgdGhpcy5yZWluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLmdyb3VwTGlzdGVuZXJJZCA9IFwiZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLmNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5hZGRNZXNzYWdlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICBpZiAodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICBpZiAodGhpcy5rZWVwUmVjZW50TWVzc2FnZXMpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3Quc3BsaWNlKDEsIHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCAtIDMwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgzMCk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyXG4gICAgICAgID8gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXIuZ2V0VWlkKCkpLmJ1aWxkKClcbiAgICAgICAgOiB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwLmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgxLCB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAzMCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgzMCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICByZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlciA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VDb3VudCA9IDA7XG4gICAgfVxuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBudWxsO1xuICAgIENvbWV0Q2hhdC5yZW1vdmVHcm91cExpc3RlbmVyKHRoaXMuZ3JvdXBMaXN0ZW5lcklkKTtcbiAgICBDb21ldENoYXQucmVtb3ZlQ2FsbExpc3RlbmVyKHRoaXMuY2FsbExpc3RlbmVySWQpO1xuICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUxpc3QoKTtcbiAgfTtcbiAgZ2V0TWVzc2FnZVJlY2VpcHQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IHJlY2VpcHQgPSBNZXNzYWdlUmVjZWlwdFV0aWxzLmdldFJlY2VpcHRTdGF0dXMobWVzc2FnZSk7XG4gICAgcmV0dXJuIHJlY2VpcHQ7XG4gIH1cbiAgbWVzc2FnZVJlYWRBbmREZWxpdmVyZWQobWVzc2FnZTogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5ERUxJVkVSWVxuICAgICAgICApIHtcbiAgICAgICAgICAvL3NlYXJjaCBmb3IgbWVzc2FnZVxuICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgbS5nZXRJZCgpID09IE51bWJlcihtZXNzYWdlLmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzRGVsaXZlcmVkKG1lc3NhZ2VLZXkpO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5SRUFEXG4gICAgICAgICkge1xuICAgICAgICAgIC8vc2VhcmNoIGZvciBtZXNzYWdlXG4gICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICBtLmdldElkKCkgPT0gTnVtYmVyKG1lc3NhZ2UuZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XS5zZXRSZWFkQXQobWVzc2FnZT8uZ2V0UmVhZEF0KCkpO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXIoKSA9PT0gdGhpcy5ncm91cD8uZ2V0R3VpZCgpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gcmVhZE1lc3NhZ2VcbiAgICovXG4gIG1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleTogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IG1lc3NhZ2VLZXk7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoIXRoaXMubWVzc2FnZXNMaXN0W2ldLmdldFJlYWRBdCgpKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0W2ldLnNldFJlYWRBdChcbiAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQodGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0pO1xuICB9XG4gIG1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5OiBudW1iZXIpIHtcbiAgICBmb3IgKGxldCBpID0gbWVzc2FnZUtleTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmICghdGhpcy5tZXNzYWdlc0xpc3RbaV0uZ2V0RGVsaXZlcmVkQXQoKSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFtpXS5zZXREZWxpdmVyZWRBdChcbiAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEVtaXRzIGFuIEFjdGlvbiBJbmRpY2F0aW5nIHRoYXQgYSBtZXNzYWdlIHdhcyBkZWxldGVkIGJ5IHRoZSB1c2VyL3BlcnNvbiB5b3UgYXJlIGNoYXR0aW5nIHdpdGhcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIC8qKlxuICAgKiBEZXRlY3RzIGlmIHRoZSBtZXNzYWdlIHRoYXQgd2FzIGVkaXQgaXMgeW91ciBjdXJyZW50IG9wZW4gY29udmVyc2F0aW9uIHdpbmRvd1xuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWVzc2FnZUVkaXRlZCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHRoaXMudXNlciAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHRoaXMudXNlciAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdXBkYXRlSW50ZXJhY3RpdmVNZXNzYWdlID0gKHJlY2VpcHQ6IENvbWV0Q2hhdC5JbnRlcmFjdGlvblJlY2VpcHQpID0+IHtcbiAgICBpZiAodGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09PSByZWNlaXB0LmdldFNlbmRlcigpLmdldFVpZCgpKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5nZXRNZXNzYWdlQnlJZChcbiAgICAgICAgcmVjZWlwdC5nZXRNZXNzYWdlSWQoKVxuICAgICAgKSBhcyBDb21ldENoYXQuSW50ZXJhY3RpdmVNZXNzYWdlO1xuICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKFN0cmluZyhtZXNzYWdlPy5nZXRJZCgpKSA9PSBTdHJpbmcocmVjZWlwdC5nZXRNZXNzYWdlSWQoKSkpIHtcbiAgICAgICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IHJlY2VpcHQuZ2V0SW50ZXJhY3Rpb25zKCk7XG4gICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZSkuc2V0SW50ZXJhY3Rpb25zKFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25cbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShcbiAgICAgICAgICAgIEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLmNvbnZlcnRJbnRlcmFjdGl2ZU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IGEgbWVzc2FnZSB3YXMgZGVsZXRlZCBieSB0aGUgdXNlci9wZXJzb24geW91IGFyZSBjaGF0dGluZyB3aXRoXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICB1cGRhdGVFZGl0ZWRNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHZhciBtZXNzYWdlTGlzdCA9IHRoaXMubWVzc2FnZXNMaXN0O1xuICAgIC8vIGxldCBuZXdNZXNzYWdlID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2UpO1xuICAgIHZhciBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRJZCgpXG4gICAgKTtcbiAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XSA9IG1lc3NhZ2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIC8vIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAvLyAgIHRoaXMubWVzc2FnZXNMaXN0ID0gW1xuICAgIC8vICAgICAuLi5tZXNzYWdlTGlzdC5zbGljZSgwLCBtZXNzYWdlS2V5KSxcbiAgICAvLyAgICAgbWVzc2FnZSxcbiAgICAvLyAgICAgLi4ubWVzc2FnZUxpc3Quc2xpY2UobWVzc2FnZUtleSArIDEpLFxuICAgIC8vICAgXTtcbiAgICAvLyAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAvLyB9XG4gIH07XG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IEdyb3VwIERhdGEgaGFzIGJlZW4gdXBkYXRlZFxuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBXaGVuIGN1c3RvbSBtZXNzYWdlcyBhcmUgcmVjZWl2ZWQgZWcuIFBvbGwsIFN0aWNrZXJzIGVtaXRzIGFjdGlvbiB0byB1cGRhdGUgbWVzc2FnZSBsaXN0XG4gICAqIEBwYXJhbSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBjdXN0b21NZXNzYWdlUmVjZWl2ZWQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5ncm91cD8uZ2V0R3VpZCgpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgICFtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKSB8fFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICAgICAgICB0aGlzLmlzT25Cb3R0b20pXG4gICAgICAgICkge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgICB0aGlzLmN1c3RvbU1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICAgKi9cbiAgY3VzdG9tTWVzc2FnZVJlY2VpdmVkSGFuZGxlciA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICArK3RoaXMubWVzc2FnZUNvdW50O1xuICAgIC8vIGFkZCByZWNlaXZlZCBtZXNzYWdlIHRvIG1lc3NhZ2VzIGxpc3RcbiAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgLy8gdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgdGhpcy51cGRhdGVVbnJlYWRSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICAgIHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgaWYgKCF0aGlzLmlzT25Cb3R0b20pIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgY291bnRUZXh0ID0gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIik7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAmJlxuICAgICAgICAgICAgdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dCAhPSBcIlwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb3VudFRleHQgPSB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb3VudFRleHQgPVxuICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50Lmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpXG4gICAgICAgICAgICAgICAgOiBsb2NhbGl6ZShcIk5FV19NRVNTQUdFXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50LnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgdGhpcy5uZXdNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgXCIg4oaTIFwiICsgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggKyBcIiBcIiArIGNvdW50VGV4dDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAvL2hhbmRsaW5nIGRvbSBsYWcgLSBpbmNyZW1lbnQgY291bnQgb25seSBmb3IgbWFpbiBtZXNzYWdlIGxpc3RcbiAgICBpZiAoXG4gICAgICBtZXNzYWdlLmhhc093blByb3BlcnR5KFwicGFyZW50TWVzc2FnZUlkXCIpID09PSBmYWxzZSAmJlxuICAgICAgIXRoaXMucGFyZW50TWVzc2FnZUlkXG4gICAgKSB7XG4gICAgICArK3RoaXMubWVzc2FnZUNvdW50O1xuICAgICAgLy9pZiB0aGUgdXNlciBoYXMgbm90IHNjcm9sbGVkIGluIGNoYXQgd2luZG93KHNjcm9sbCBpcyBhdCB0aGUgYm90dG9tIG9mIHRoZSBjaGF0IHdpbmRvdylcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gdHJ1ZSAmJlxuICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiZcbiAgICAgIHRoaXMuaXNPbkJvdHRvbVxuICAgICkge1xuICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkgPT09IHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKG1lc3NhZ2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQobWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBkYXRlcyBhbmQgc2V0cyBEYXRlIG9uIGEgYSBuZXcgZGF5XG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7bnVtYmVyfSBmaXJzdERhdGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSBzZWNvbmREYXRlXG4gICAqL1xuICBpc0RhdGVEaWZmZXJlbnQoXG4gICAgZmlyc3REYXRlOiBudW1iZXIgfCB1bmRlZmluZWQsXG4gICAgc2Vjb25kRGF0ZTogbnVtYmVyIHwgdW5kZWZpbmVkXG4gICkge1xuICAgIGxldCBmaXJzdERhdGVPYmo6IERhdGUsIHNlY29uZERhdGVPYmo6IERhdGU7XG4gICAgZmlyc3REYXRlT2JqID0gbmV3IERhdGUoZmlyc3REYXRlISAqIDEwMDApO1xuICAgIHNlY29uZERhdGVPYmogPSBuZXcgRGF0ZShzZWNvbmREYXRlISAqIDEwMDApO1xuICAgIHJldHVybiAoXG4gICAgICBmaXJzdERhdGVPYmouZ2V0RGF0ZSgpICE9PSBzZWNvbmREYXRlT2JqLmdldERhdGUoKSB8fFxuICAgICAgZmlyc3REYXRlT2JqLmdldE1vbnRoKCkgIT09IHNlY29uZERhdGVPYmouZ2V0TW9udGgoKSB8fFxuICAgICAgZmlyc3REYXRlT2JqLmdldEZ1bGxZZWFyKCkgIT09IHNlY29uZERhdGVPYmouZ2V0RnVsbFllYXIoKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBmb3JtYXR0ZXJzIGZvciB0aGUgdGV4dCBidWJibGVzXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBnZXRUZXh0Rm9ybWF0dGVycyA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgYWxpZ25tZW50ID0gdGhpcy5zZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSk7XG4gICAgbGV0IGNvbmZpZyA9IHtcbiAgICAgIHRleHRGb3JtYXR0ZXJzOlxuICAgICAgICB0aGlzLnRleHRGb3JtYXR0ZXJzICYmIHRoaXMudGV4dEZvcm1hdHRlcnMubGVuZ3RoXG4gICAgICAgICAgPyBbLi4udGhpcy50ZXh0Rm9ybWF0dGVyc11cbiAgICAgICAgICA6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFsbFRleHRGb3JtYXR0ZXJzKHtcbiAgICAgICAgICAgIGRpc2FibGVNZW50aW9uczogdGhpcy5kaXNhYmxlTWVudGlvbnMsXG4gICAgICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgICAgICBhbGlnbm1lbnQsXG4gICAgICAgICAgfSksXG4gICAgfTtcblxuICAgIGxldCB0ZXh0Rm9ybWF0dGVyczogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSBjb25maWcudGV4dEZvcm1hdHRlcnM7XG4gICAgbGV0IHVybFRleHRGb3JtYXR0ZXIhOiBDb21ldENoYXRVcmxzRm9ybWF0dGVyO1xuICAgIGlmICghdGhpcy5kaXNhYmxlTWVudGlvbnMpIHtcbiAgICAgIGxldCBtZW50aW9uc1RleHRGb3JtYXR0ZXIhOiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dEZvcm1hdHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRleHRGb3JtYXR0ZXJzW2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIpIHtcbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tcbiAgICAgICAgICAgIGlcbiAgICAgICAgICBdIGFzIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgIGlmIChtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKCkubGVuZ3RoKSB7XG4gICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgICAgICAgICAgbWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0TG9nZ2VkSW5Vc2VyKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRMb2dpbkxpc3RlbmVyLmdldExvZ2dlZEluVXNlcigpIVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHVybFRleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dEZvcm1hdHRlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXRVcmxzRm9ybWF0dGVyKSB7XG4gICAgICAgICAgdXJsVGV4dEZvcm1hdHRlciA9IHRleHRGb3JtYXR0ZXJzW2ldIGFzIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXI7XG4gICAgICAgICAgaWYgKG1lbnRpb25zVGV4dEZvcm1hdHRlcikge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIW1lbnRpb25zVGV4dEZvcm1hdHRlcikge1xuICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPVxuICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lbnRpb25zVGV4dEZvcm1hdHRlcih7XG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgLi4uY29uZmlnLFxuICAgICAgICAgICAgYWxpZ25tZW50LFxuICAgICAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICAgIH0pO1xuICAgICAgICB0ZXh0Rm9ybWF0dGVycy5wdXNoKG1lbnRpb25zVGV4dEZvcm1hdHRlcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dEZvcm1hdHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRleHRGb3JtYXR0ZXJzW2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcikge1xuICAgICAgICAgIHVybFRleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tpXSBhcyBDb21ldENoYXRVcmxzRm9ybWF0dGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF1cmxUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICB1cmxUZXh0Rm9ybWF0dGVyID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0VXJsVGV4dEZvcm1hdHRlcih7XG4gICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgYWxpZ25tZW50LFxuICAgICAgfSk7XG4gICAgICB0ZXh0Rm9ybWF0dGVycy5wdXNoKHVybFRleHRGb3JtYXR0ZXIpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dEZvcm1hdHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRleHRGb3JtYXR0ZXJzW2ldLnNldE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQoYWxpZ25tZW50KTtcbiAgICAgIHRleHRGb3JtYXR0ZXJzW2ldLnNldE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRleHRGb3JtYXR0ZXJzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBwcmVwZW5kIEZldGNoZWQgTWVzc2FnZXNcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VzXG4gICAqL1xuICBwcmVwZW5kTWVzc2FnZXMobWVzc2FnZXM6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VzLCAuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICB0aGlzLm1lc3NhZ2VDb3VudCA9IHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aDtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VDb3VudCA+IHRoaXMudGhyZXNob2xkVmFsdWUpIHtcbiAgICAgICAgdGhpcy5rZWVwUmVjZW50TWVzc2FnZXMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGFjaCgpOyAvLyBEZXRhY2ggdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5jaGF0Q2hhbmdlZCkge1xuICAgICAgICBDb21ldENoYXRVSUV2ZW50cy5jY0FjdGl2ZUNoYXRDaGFuZ2VkLm5leHQoe1xuICAgICAgICAgIHVzZXI6IHRoaXMudXNlcixcbiAgICAgICAgICBncm91cDogdGhpcy5ncm91cCxcbiAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1ttZXNzYWdlcz8ubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgdW5yZWFkTWVzc2FnZUNvdW50OiB0aGlzLmdldFVucmVhZENvdW50LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jaGF0Q2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogbGlzdGVuaW5nIHRvIGJvdHRvbSBzY3JvbGwgdXNpbmcgaW50ZXJzZWN0aW9uIG9ic2VydmVyXG4gICAqL1xuICBpb0JvdHRvbSgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIHJvb3Q6IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudCxcbiAgICAgIHJvb3RNYXJnaW46IFwiLTEwMCUgMHB4IDEwMHB4IDBweFwiLFxuICAgICAgdGhyZXNob2xkOiAwLFxuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrID0gKGVudHJpZXM6IGFueSkgPT4ge1xuICAgICAgdmFyIGxhc3RNZXNzYWdlID0gdGhpcy5VbnJlYWRDb3VudFt0aGlzLlVucmVhZENvdW50Lmxlbmd0aCAtIDFdO1xuICAgICAgdGhpcy5pc09uQm90dG9tID0gZW50cmllc1swXS5pc0ludGVyc2VjdGluZztcbiAgICAgIGlmICh0aGlzLmlzT25Cb3R0b20pIHtcbiAgICAgICAgdGhpcy5mZXRjaE5leHRNZXNzYWdlKCk7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiB0aGlzLlVucmVhZENvdW50Py5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobGFzdE1lc3NhZ2UpLnRoZW4oXG4gICAgICAgICAgICAocmVzOiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PSBOdW1iZXIocmVzPy5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzUmVhZChtZXNzYWdlS2V5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBvYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoXG4gICAgICBjYWxsYmFjayxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICAgIG9ic2VydmVyLm9ic2VydmUodGhpcy5ib3R0b20/Lm5hdGl2ZUVsZW1lbnQpO1xuICB9XG4gIC8qKlxuICAgKiBsaXN0ZW5pbmcgdG8gdG9wIHNjcm9sbCB1c2luZyBpbnRlcnNlY3Rpb24gb2JzZXJ2ZXJcbiAgICovXG4gIGlvVG9wKCkge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgcm9vdDogdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LFxuICAgICAgcm9vdE1hcmdpbjogXCIyMDBweCAwcHggMHB4IDBweFwiLFxuICAgICAgdGhyZXNob2xkOiAxLjAsXG4gICAgfTtcbiAgICB2YXIgY2FsbGJhY2sgPSAoZW50cmllczogYW55KSA9PiB7XG4gICAgICBpZiAoZW50cmllc1swXS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICB0aGlzLm51bWJlck9mVG9wU2Nyb2xsKys7XG4gICAgICAgIGlmICh0aGlzLm51bWJlck9mVG9wU2Nyb2xsID4gMSkge1xuICAgICAgICAgIHRoaXMuZmV0Y2hQcmV2aW91c01lc3NhZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBvYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoXG4gICAgICBjYWxsYmFjayxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICAgIG9ic2VydmVyLm9ic2VydmUodGhpcy50b3A/Lm5hdGl2ZUVsZW1lbnQpO1xuICB9XG4gIC8vIHB1YmxpYyBtZXRob2RzXG4gIGFkZE1lc3NhZ2UgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdGhpcy5tZXNzYWdlc0xpc3QucHVzaChtZXNzYWdlKTtcbiAgICBpZiAobWVzc2FnZS5nZXRJZCgpKSB7XG4gICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIobWVzc2FnZS5nZXRJZCgpKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpIHx8XG4gICAgICB0aGlzLmlzT25Cb3R0b21cbiAgICApIHtcbiAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICB9O1xuICAvKipcbiAgICogY2FsbGJhY2sgZm9yIGNvcHkgbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVGV4dE1lc3NhZ2V9IG9iamVjdFxuICAgKi9cbiAgb25Db3B5TWVzc2FnZSA9IChvYmplY3Q6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkgPT4ge1xuICAgIGxldCB0ZXh0ID0gb2JqZWN0LmdldFRleHQoKTtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5kaXNhYmxlTWVudGlvbnMgJiZcbiAgICAgIG9iamVjdC5nZXRNZW50aW9uZWRVc2VycyAmJlxuICAgICAgb2JqZWN0LmdldE1lbnRpb25lZFVzZXJzKCkubGVuZ3RoXG4gICAgKSB7XG4gICAgICB0ZXh0ID0gdGhpcy5nZXRNZW50aW9uc1RleHRXaXRob3V0U3R5bGUob2JqZWN0KTtcbiAgICB9XG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgdG8gZW5zdXJlIHRoYXQgdGhlIHVpZCBkb2Vzbid0IGdldCBjb3BpZWQgd2hlbiBjbGlja2luZyBvbiB0aGUgY29weSBvcHRpb24uXG4gICAqIFRoaXMgZnVuY3Rpb24gY2hhbmdlcyB0aGUgdWlkIHJlZ2V4IHRvICdAdXNlck5hbWUnIHdpdGhvdXQgZm9ybWF0dGluZ1xuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5UZXh0TWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgZ2V0TWVudGlvbnNUZXh0V2l0aG91dFN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkge1xuICAgIGNvbnN0IHJlZ2V4ID0gLzxAdWlkOiguKj8pPi9nO1xuICAgIGxldCBtZXNzYWdlVGV4dCA9IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICAgIGxldCBtZXNzYWdlVGV4dFRtcCA9IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICAgIGxldCBtYXRjaCA9IHJlZ2V4LmV4ZWMobWVzc2FnZVRleHQpO1xuICAgIGxldCBtZW50aW9uZWRVc2VycyA9IG1lc3NhZ2UuZ2V0TWVudGlvbmVkVXNlcnMoKTtcbiAgICB3aGlsZSAobWF0Y2ggIT09IG51bGwpIHtcbiAgICAgIGxldCB1c2VyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZW50aW9uZWRVc2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobWF0Y2hbMV0gPT0gbWVudGlvbmVkVXNlcnNbaV0uZ2V0VWlkKCkpIHtcbiAgICAgICAgICB1c2VyID0gbWVudGlvbmVkVXNlcnNbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIG1lc3NhZ2VUZXh0VG1wID0gbWVzc2FnZVRleHRUbXAucmVwbGFjZShcbiAgICAgICAgICBtYXRjaFswXSxcbiAgICAgICAgICBcIkBcIiArIHVzZXIuZ2V0TmFtZSgpICsgXCJcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VUZXh0VG1wO1xuICB9XG5cbiAgLyoqXG4gICAqIGNhbGxiYWNrIGZvciBkZWxldGVNZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gb2JqZWN0XG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgbWVzc2FnZVNlbnQobWVzc2FnZXM6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHZhciBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlcztcbiAgICB2YXIgbWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICBsZXQgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IG0uZ2V0TXVpZCgpID09PSBtZXNzYWdlLmdldE11aWQoKVxuICAgICk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgbWVzc2FnZUxpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG1lc3NhZ2UpO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IG1lc3NhZ2VMaXN0O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gIH1cbiAgLyoqXG4gICAqIGNhbGxiYWNrIGZvciBlZGl0TWVzc2FnZSBvcHRpb25cbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBvYmplY3RcbiAgICovXG4gIG9uRWRpdE1lc3NhZ2UgPSAob2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5uZXh0KHtcbiAgICAgIG1lc3NhZ2U6IG9iamVjdCxcbiAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgIH0pO1xuICB9O1xuICB1cGRhdGVNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgbXVpZDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgaWYgKG11aWQpIHtcbiAgICAgIHRoaXMubWVzc2FnZVNlbnQobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgcmVtb3ZlTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgdmFyIG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtc2cpID0+IG1zZz8uZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRJZCgpXG4gICAgICApO1xuICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZSk7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0eWxlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSB0aHJlYWQgdmlldyBvZiBhIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhhdCB0aGUgc3R5bGUgY29uZmlndXJhdGlvbiBpcyBmb3IuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBzdHlsZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICovXG4gIGdldFRocmVhZFZpZXdTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS50aHJlYWRSZXBseUljb25UaW50LFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RmxvdzpcbiAgICAgICAgdGhpcy5pc1NlbnRCeU1lKG1lc3NhZ2UpICYmIHRoaXMuYWxpZ25tZW50ICE9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnRcbiAgICAgICAgICA/IFwicm93LXJldmVyc2VcIlxuICAgICAgICAgIDogXCJyb3dcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1zdGFydFwiLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VGV4dENvbG9yLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlUZXh0Rm9udCxcbiAgICAgIGljb25IZWlnaHQ6IFwiMTVweFwiLFxuICAgICAgaWNvbldpZHRoOiBcIjE1cHhcIixcbiAgICAgIGdhcDogXCI0cHhcIixcbiAgICB9O1xuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBtZXNzYWdlIHdhcyBzZW50IGJ5IHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluIHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgbG9nZ2VkIGluIHVzZXIsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGlzU2VudEJ5TWUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IHNlbnRCeU1lOiBib29sZWFuID1cbiAgICAgICFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCk7XG4gICAgcmV0dXJuIHNlbnRCeU1lO1xuICB9XG4gIGRlbGV0ZU1lc3NhZ2UgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBtZXNzYWdlSWQ6IGFueSA9IG1lc3NhZ2UuZ2V0SWQoKTtcbiAgICAgIENvbWV0Q2hhdC5kZWxldGVNZXNzYWdlKG1lc3NhZ2VJZClcbiAgICAgICAgLnRoZW4oKGRlbGV0ZWRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VEZWxldGVkLm5leHQoZGVsZXRlZE1lc3NhZ2UpO1xuICAgICAgICAgIC8vIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2Nyb2xsVG9Cb3R0b20gPSAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsKHtcbiAgICAgICAgICB0b3A6IHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQsXG4gICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaXNPbkJvdHRvbSA9IHRydWU7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0sIDEwKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBpZiAodGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb3VudCBvZiB1bnJlYWQgcmVwbHkgbWVzc2FnZXMgZm9yIGEgZ2l2ZW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBmb3Igd2hpY2ggdGhlIHJlcGx5IGNvdW50IGlzIGJlaW5nIHVwZGF0ZWQuXG4gICAqL1xuXG4gIHVwZGF0ZVVucmVhZFJlcGx5Q291bnQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKClcbiAgICAgICk7XG4gICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VLZXldO1xuICAgICAgICAvLyBsZXQgdW5yZWFkUmVwbHlDb3VudCA9IG1lc3NhZ2VPYmouZ2V0VW5yZWFkUmVwbHlDb3VudCgpXG4gICAgICAgIC8vICAgPyBtZXNzYWdlT2JqLmdldFVucmVhZFJlcGx5Q291bnQoKVxuICAgICAgICAvLyAgIDogMDtcbiAgICAgICAgLy8gdW5yZWFkUmVwbHlDb3VudCA9IHVucmVhZFJlcGx5Q291bnQgKyAxO1xuICAgICAgICAvLyBtZXNzYWdlT2JqLnNldFVucmVhZFJlcGx5Q291bnQodW5yZWFkUmVwbHlDb3VudCk7XG4gICAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlT2JqKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZUxpc3RdO1xuICAgICAgfVxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogTWV0aG9kIHRvIHN1YnNjcmliZSAgdGhlIHJlcXVpcmVkIFJ4anMgZXZlbnRzIHdoZW4gdGhlIENvbWV0Q2hhdE1lc3NhZ2VMaXN0Q29tcG9uZW50IGxvYWRzXG4gICAqL1xuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjU2hvd1BhbmVsID0gQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93UGFuZWwuc3Vic2NyaWJlKFxuICAgICAgKGRhdGE6IElQYW5lbCkgPT4ge1xuICAgICAgICBpZiAoZGF0YS5jaGlsZD8uc2hvd0NvbnZlcnNhdGlvblN1bW1hcnlWaWV3KSB7XG4gICAgICAgICAgdGhpcy5mZXRjaENvbnZlcnNhdGlvblN1bW1hcnkoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNtYXJ0UmVwbHlDb25maWcgPSBkYXRhLmNvbmZpZ3VyYXRpb24hO1xuICAgICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlID0gZGF0YS5tZXNzYWdlITtcbiAgICAgICAgdmFyIHNtYXJ0UmVwbHlPYmplY3QgPSAoZGF0YS5tZXNzYWdlIGFzIGFueSk/Lm1ldGFkYXRhPy5bXG4gICAgICAgICAgU21hcnRSZXBsaWVzQ29uc3RhbnRzLmluamVjdGVkXG4gICAgICAgIF0/LmV4dGVuc2lvbnM/LltTbWFydFJlcGxpZXNDb25zdGFudHMuc21hcnRfcmVwbHldO1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQodGhpcy5zbWFydFJlcGx5TWVzc2FnZSkgJiYgc21hcnRSZXBseU9iamVjdCAmJiAhc21hcnRSZXBseU9iamVjdC5lcnJvcikge1xuICAgICAgICAgIHRoaXMuZW5hYmxlU21hcnRSZXBseSA9IHRydWU7XG4gICAgICAgICAgdGhpcy5zaG93U21hcnRSZXBseSA9IHRydWU7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjSGlkZVBhbmVsID0gQ29tZXRDaGF0VUlFdmVudHMuY2NIaWRlUGFuZWwuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBudWxsO1xuICAgICAgdGhpcy5lbmFibGVTbWFydFJlcGx5ID0gZmFsc2U7XG4gICAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gZmFsc2U7XG4gICAgfSk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLnN1YnNjcmliZShcbiAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2VPYmogPSB0aGlzLmdldE1lc3NhZ2VCeUlkKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpO1xuICAgICAgICAgIC8vIGlmIChtZXNzYWdlT2JqICYmIG1lc3NhZ2VPYmouZ2V0VW5yZWFkUmVwbHlDb3VudCgpKSB7XG4gICAgICAgICAgLy8gICBtZXNzYWdlT2JqLnNldFVucmVhZFJlcGx5Q291bnQoMCk7XG4gICAgICAgICAgLy8gICB0aGlzLnVwZGF0ZU1lc3NhZ2UobWVzc2FnZU9iaik7XG4gICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogSUdyb3VwTWVtYmVyQWRkZWQpID0+IHtcbiAgICAgICAgaXRlbTtcbiAgICAgICAgdGhpcy5hcHBlbmRNZXNzYWdlcyhpdGVtLm1lc3NhZ2VzISk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQgPVxuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShpdGVtLm1lc3NhZ2UhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkID1cbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoaXRlbS5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBMZWZ0ID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQuc3Vic2NyaWJlKFxuICAgICAgKGl0ZW06IElHcm91cExlZnQpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoaXRlbS5tZXNzYWdlKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShpdGVtLm1lc3NhZ2UhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG9iamVjdDogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmIChvYmplY3Q/LnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQob2JqZWN0Lm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2Uob2JqZWN0Lm1lc3NhZ2UhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5zdWJzY3JpYmUoXG4gICAgICAob2JqOiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKG9iai5tZXNzYWdlKSB7XG4gICAgICAgICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG9iai5tZXNzYWdlITtcbiAgICAgICAgICBzd2l0Y2ggKG9iai5zdGF0dXMpIHtcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzOiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuc3VjY2Vzczoge1xuICAgICAgICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICAgICAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgPSBbXTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtZXNzYWdlLCB0cnVlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuZXJyb3I6IHtcbiAgICAgICAgICAgICAgaWYgKCFtZXNzYWdlLmdldFNlbmRlcigpIHx8IHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGUgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZU1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlc3Npb25JZCA9IFwiXCI7XG4gICAgICAgIGlmIChjYWxsICYmIE9iamVjdC5rZXlzKGNhbGwpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxBY2NlcHRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsQWNjZXB0ZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICBjbG9zZVNtYXJ0UmVwbHkgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBjbG9zZUNvbnZlcnNhdGlvblN1bW1hcnkgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2hvd1N0YXR1c0luZm8obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSB0aGlzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgICFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IHRoaXMuTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFNlbnRBdCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBzZW5kUmVwbHkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgaWYgKHRoaXMuc21hcnRSZXBseUNvbmZpZy5jY1NtYXJ0UmVwbGllc0NsaWNrZWQpIHtcbiAgICAgIHRoaXMuc21hcnRSZXBseUNvbmZpZy5jY1NtYXJ0UmVwbGllc0NsaWNrZWQoXG4gICAgICAgIHJlcGx5LFxuICAgICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlISxcbiAgICAgICAgdGhpcy5vbkVycm9yLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMsXG4gICAgICAgIHRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXNcbiAgICAgICk7XG4gICAgICB0aGlzLmNsb3NlU21hcnRSZXBseSgpO1xuICAgIH1cbiAgfTtcbiAgc2VuZENvbnZlcnNhdGlvblN0YXJ0ZXIgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5uZXh0KHJlcGx5KTtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgZmV0Y2hDb252ZXJzYXRpb25TdGFydGVyKCkge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgbGV0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyLmdldFVpZCgpXG4gICAgICA6IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuICAgIENvbWV0Q2hhdC5nZXRDb252ZXJzYXRpb25TdGFydGVyKHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSlcbiAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgIE9iamVjdC5rZXlzKHJlc3BvbnNlKS5mb3JFYWNoKChyZXBseSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlW3JlcGx5XSAmJiByZXNwb25zZVtyZXBseV0gIT0gXCJcIikge1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzLnB1c2gocmVzcG9uc2VbcmVwbHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzICYmXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGZldGNoQ29udmVyc2F0aW9uU3VtbWFyeSgpIHtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gdHJ1ZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGxldCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICBsZXQgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IHRoaXMudXNlci5nZXRVaWQoKVxuICAgICAgOiB0aGlzLmdyb3VwLmdldEd1aWQoKTtcblxuICAgIGxldCBhcGlDb25maWd1cmF0aW9uID0gdGhpcy5hcGlDb25maWd1cmF0aW9uO1xuXG4gICAgQ29tZXRDaGF0LmdldENvbnZlcnNhdGlvblN1bW1hcnkocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBhcGlDb25maWd1cmF0aW9uKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKFwiUGFyYW1ldGVyIGlzIG5vdCBhIG51bWJlciFcIik7XG4gICAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtyZXNwb25zZV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSAmJiB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5O1xuICB9XG5cbiAgZ2V0UmVwbGllcygpOiBzdHJpbmdbXSB8IG51bGwge1xuICAgIGxldCBzbWFydFJlcGx5OiBhbnkgPSB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlO1xuICAgIHZhciBzbWFydFJlcGx5T2JqZWN0ID1cbiAgICAgIHNtYXJ0UmVwbHk/Lm1ldGFkYXRhPy5bU21hcnRSZXBsaWVzQ29uc3RhbnRzLmluamVjdGVkXT8uZXh0ZW5zaW9ucz8uW1xuICAgICAgU21hcnRSZXBsaWVzQ29uc3RhbnRzLnNtYXJ0X3JlcGx5XG4gICAgICBdO1xuICAgIGlmIChcbiAgICAgIHNtYXJ0UmVwbHlPYmplY3Q/LnJlcGx5X3Bvc2l0aXZlICYmXG4gICAgICBzbWFydFJlcGx5T2JqZWN0Py5yZXBseV9uZXV0cmFsICYmXG4gICAgICBzbWFydFJlcGx5T2JqZWN0Py5yZXBseV9uZWdhdGl2ZVxuICAgICkge1xuICAgICAgdmFyIHsgcmVwbHlfcG9zaXRpdmUsIHJlcGx5X25ldXRyYWwsIHJlcGx5X25lZ2F0aXZlIH0gPSBzbWFydFJlcGx5T2JqZWN0O1xuICAgICAgcmV0dXJuIFtyZXBseV9wb3NpdGl2ZSwgcmVwbHlfbmV1dHJhbCwgcmVwbHlfbmVnYXRpdmVdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvKipcbiAgICogTWV0aG9kIHRvIHVuc3Vic2NyaWJlIGFsbCB0aGUgUnhqcyBldmVudHMgd2hlbiB0aGUgQ29tZXRDaGF0TWVzc2FnZUxpc3RDb21wb25lbnQgZ2V0cyBkZXN0cm95XG4gICAqL1xuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTGl2ZVJlYWN0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjU2hvd1BhbmVsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjSGlkZVBhbmVsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NDYWxsQWNjZXB0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIHRocmVhZCBpY29uIGJhc2VkIG9uIHRoZSBzZW5kZXIgb2YgdGhlIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgZm9yIHdoaWNoIHRoZSB0aHJlYWQgaWNvbiBpcyBiZWluZyBkZXRlcm1pbmVkLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVGhlIGljb24gZm9yIHRoZSB0aHJlYWQuIElmIHRoZSBtZXNzYWdlIHdhcyBzZW50IGJ5IHRoZSBsb2dnZWQgaW4gdXNlciwgcmV0dXJucyAndGhyZWFkUmlnaHRBcnJvdycuIE90aGVyd2lzZSwgcmV0dXJucyAndGhyZWFkSW5kaWNhdG9ySWNvbicuXG4gICAqL1xuICBnZXRUaHJlYWRJY29uQWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGJvb2xlYW4ge1xuICAgIGxldCBzZW50QnlNZTogYm9vbGVhbiA9XG4gICAgICB0aGlzLmlzU2VudEJ5TWUobWVzc2FnZSkgJiZcbiAgICAgIHRoaXMuYWxpZ25tZW50ID09PSBNZXNzYWdlTGlzdEFsaWdubWVudC5zdGFuZGFyZDtcbiAgICByZXR1cm4gc2VudEJ5TWUgPyBmYWxzZSA6IHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIHN0eWxpbmcgcGFydFxuICAgKi9cbiAgZ2V0QnViYmxlRGF0ZVN0eWxlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBpc1NlbnRCeU1lID1cbiAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJiB0aGlzLmFsaWdubWVudCAhPSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIGxldCBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0O1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Q29sb3I6XG4gICAgICAgIHRoaXMubWVzc2FnZUxpc3RTdHlsZS5UaW1lc3RhbXBUZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRleHRGb250OlxuICAgICAgICB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuVGltZXN0YW1wVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24zKSxcbiAgICAgIHBhZGRpbmc6IFwiMHB4XCIsXG4gICAgICBkaXNwbGF5OiBcImJsb2NrXCIsXG4gICAgfTtcbiAgfTtcbiAgY2hhdHNMaXN0U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmhlaWdodCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5iYWNrZ3JvdW5kLFxuICAgIH07XG4gIH07XG4gIG1lc3NhZ2VDb250YWluZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS53aWR0aCxcbiAgICB9O1xuICB9O1xuICBlcnJvclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbiAgY29udmVyc2F0aW9uU3RhcnRlclN0YXRlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfTtcbiAgfTtcblxuICBjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuXG4gIGVtcHR5U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuICBsb2FkaW5nU3R5bGUgPSB7XG4gICAgaWNvblRpbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8ubG9hZGluZ0ljb25UaW50LFxuICB9O1xuICBjb252ZXJzYXRpb25TdGFydGVyTG9hZGVyID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpY29uVGludDogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG5cbiAgY29udmVyc2F0aW9uU3VtbWFyeUxvYWRlciA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuICBnZXRTY2hlZHVsZXJCdWJibGVTdHlsZSA9IChtZXNzZ2FlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCI1MCVcIixcbiAgICAgIHdpZHRoOiBcIjQ4cHhcIixcbiAgICAgIGhlaWdodDogXCI0OHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgIH0pO1xuICAgIGxldCBsaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcImF1dG9cIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiaW5oZXJpdFwiLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IFwiXCIsXG4gICAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcblxuICAgIGxldCBjYWxlbmRhclN0eWxlID0gbmV3IENhbGVuZGFyU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkYXlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGRheVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1vbnRoWWVhclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgbW9udGhZZWFyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGVmYXVsdERhdGVUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dEJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpbWV6b25lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0aW1lem9uZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFycm93QnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTJcbiAgICAgICksXG4gICAgfSk7XG4gICAgbGV0IHRpbWVTbG90U3R5bGUgPSBuZXcgVGltZVNsb3RTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgY2FsZW5kYXJJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpbWV6b25lSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVNsb3RJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGVtcHR5U2xvdFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGVtcHR5U2xvdFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgc2VwZXJhdG9yVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNsb3RCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgc2xvdEJvcmRlcjogXCJub25lXCIsXG4gICAgICBzbG90Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc2xvdFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHNsb3RUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICB9KTtcbiAgICBsZXQgcXVjaWtWaWV3U3R5bGUgPSBuZXcgUXVpY2tWaWV3U3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbGVhZGluZ0JhclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbGVhZGluZ0JhcldpZHRoOiBcIjRweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgU2NoZWR1bGVyQnViYmxlU3R5bGUoe1xuICAgICAgYXZhdGFyU3R5bGU6IGF2YXRhclN0eWxlLFxuICAgICAgbGlzdEl0ZW1TdHlsZTogbGlzdEl0ZW1TdHlsZSxcbiAgICAgIHF1aWNrVmlld1N0eWxlOiBxdWNpa1ZpZXdTdHlsZSxcbiAgICAgIGRhdGVTZWxlY3RvclN0eWxlOiBjYWxlbmRhclN0eWxlLFxuICAgICAgdGltZVNsb3RTZWxlY3RvclN0eWxlOiB0aW1lU2xvdFN0eWxlLFxuICAgICAgYmFja0J1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzdWdnZXN0ZWRUaW1lQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKX1gLFxuICAgICAgc3VnZ2VzdGVkVGltZUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJhY2tncm91bmQ6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgc3VnZ2VzdGVkVGltZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBzdWdnZXN0ZWRUaW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dEJvcmRlcjogXCJub25lXCIsXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0Qm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgbW9yZUJ1dHRvblRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dEJvcmRlcjogXCJub25lXCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dEJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIG1vcmVCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIGdvYWxDb21wbGV0aW9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIGVycm9yVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBlcnJvclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2NoZWR1bGVCdXR0b25TdHlsZToge1xuICAgICAgICBpY29uSGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgICAgaWNvbldpZHRoOiBcIjIwcHhcIixcbiAgICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkubmFtZSksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgIH0sXG4gICAgICBzZXBlcmF0b3JUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkubmFtZSksXG4gICAgICBzdW1tYXJ5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc3VtbWFyeVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aW1lem9uZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgY2FsZW5kYXJJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGNsb2NrSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgfSk7XG4gIH07XG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIGZvciB0aGUgcmVhY3Rpb24gbGlzdC5cbiAgICogVGhpcyBpbmNsdWRlcyBzdHlsZXMgZm9yIHRoZSBhdmF0YXIsIGxpc3QgaXRlbXMsIGFuZCByZWFjdGlvbiBoaXN0b3J5LlxuICAgKiBAcmV0dXJucyB7UmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbn0gLSBUaGUgY29uZmlndXJlZCByZWFjdGlvbiBsaXN0LlxuICAgKi9cbiAgZ2V0UmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbigpIHtcbiAgICBjb25zdCBhdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiNTAlXCIsXG4gICAgICB3aWR0aDogXCIzNXB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzVweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIG91dGVyVmlld0JvcmRlcldpZHRoOiBcIjBcIixcbiAgICAgIG91dGVyVmlld0JvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBvdXRlclZpZXdCb3JkZXJDb2xvcjogXCJcIixcbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiMFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlYWN0aW9uSGlzdG9yeVN0eWxlID0gbmV3IFJlYWN0aW9uTGlzdFN0eWxlKHtcbiAgICAgIHdpZHRoOiBcIjMyMHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzAwcHhcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBlcnJvckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgc2xpZGVyRW1vamlDb3VudEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBzbGlkZXJFbW9qaUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGFpbFZpZXdGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGRpdmlkZXJUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2xpZGVyRW1vamlDb3VudENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgYWN0aXZlRW1vamlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKHtcbiAgICAgIGF2YXRhclN0eWxlOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/LmF2YXRhclN0eWxlIHx8XG4gICAgICAgIGF2YXRhclN0eWxlLFxuICAgICAgZXJyb3JJY29uVVJMOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/LmVycm9ySWNvblVSTCB8fFxuICAgICAgICBcIlwiLFxuICAgICAgbGlzdEl0ZW1TdHlsZTpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uPy5saXN0SXRlbVN0eWxlIHx8XG4gICAgICAgIGxpc3RJdGVtU3R5bGUsXG4gICAgICBsb2FkaW5nSWNvblVSTDpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5sb2FkaW5nSWNvblVSTCB8fCBcIlwiLFxuICAgICAgcmVhY3Rpb25MaXN0U3R5bGU6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvblxuICAgICAgICAgID8ucmVhY3Rpb25MaXN0U3R5bGUgfHwgcmVhY3Rpb25IaXN0b3J5U3R5bGUsXG4gICAgICByZWFjdGlvbkl0ZW1DbGlja2VkOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LnJlYWN0aW9uSXRlbUNsaWNrZWQgfHwgdGhpcy5vblJlYWN0aW9uSXRlbUNsaWNrZWQsXG4gICAgICByZWFjdGlvbnNSZXF1ZXN0QnVpbGRlcjpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5yZWFjdGlvbnNSZXF1ZXN0QnVpbGRlciB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIEhhbmRsZXMgd2hlbiBhIHJlYWN0aW9uIGl0ZW0gaXMgY2xpY2tlZC5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb259IHJlYWN0aW9uIC0gVGhlIGNsaWNrZWQgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhlIHJlYWN0aW9uIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAgICovXG5cbiAgb25SZWFjdGlvbkl0ZW1DbGlja2VkPyA9IChcbiAgICByZWFjdGlvbjogQ29tZXRDaGF0LlJlYWN0aW9uLFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApOiB2b2lkID0+IHtcbiAgICBpZiAocmVhY3Rpb24/LmdldFJlYWN0ZWRCeSgpPy5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpLCBtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBIYW5kbGVzIGFkZGluZyBhIHJlYWN0aW9uIHdoZW4gY2xpY2tlZC5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb25Db3VudH0gcmVhY3Rpb24gLSBUaGUgY2xpY2tlZCByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGUgcmVhY3Rpb24gaXMgYXNzb2NpYXRlZCB3aXRoLlxuICAgKi9cbiAgYWRkUmVhY3Rpb25PbkNsaWNrID0gKFxuICAgIHJlYWN0aW9uOiBDb21ldENoYXQuUmVhY3Rpb25Db3VudCxcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKSA9PiB7XG4gICAgbGV0IG9uUmVhY3RDbGljayA9IHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25DbGljaztcbiAgICBpZiAob25SZWFjdENsaWNrKSB7XG4gICAgICBvblJlYWN0Q2xpY2socmVhY3Rpb24sIG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpLCBtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIGZvciB0aGUgcmVhY3Rpb24gaW5mby5cbiAgICogVGhpcyBpbmNsdWRlcyBzdHlsZXMgZm9yIHRoZSByZWFjdGlvbiBpbmZvIGRpc3BsYXkuXG4gICAqIEByZXR1cm5zIHtSZWFjdGlvbkluZm9Db25maWd1cmF0aW9ufSAtIFRoZSBjb25maWd1cmVkIHJlYWN0aW9uIGluZm8uXG4gICAqL1xuXG4gIGdldFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oKSB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkluZm9Db25maWd1cmF0aW9uIHx8IHt9O1xuICAgIGNvbnN0IHJlYWN0aW9uSW5mb1N0eWxlID0gbmV3IFJlYWN0aW9uSW5mb1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8uYm9yZGVyIHx8IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5ib3JkZXJSYWRpdXMgfHwgXCIxMnB4XCIsXG4gICAgICBlcnJvckljb25UaW50OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5lcnJvckljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5sb2FkaW5nSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBuYW1lc0NvbG9yOlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5uYW1lc0NvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbmFtZXNGb250OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5uYW1lc0ZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICByZWFjdGVkVGV4dENvbG9yOlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5yZWFjdGVkVGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKFwiZGFya1wiKSxcbiAgICAgIHJlYWN0ZWRUZXh0Rm9udDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ucmVhY3RlZFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgcmVhY3Rpb25Gb250U2l6ZTogY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ucmVhY3Rpb25Gb250U2l6ZSB8fCBcIjM3cHhcIixcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oe1xuICAgICAgcmVhY3Rpb25JbmZvU3R5bGU6IHJlYWN0aW9uSW5mb1N0eWxlLFxuICAgICAgcmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXI6IGNvbmZpZz8ucmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXIgfHwgdW5kZWZpbmVkLFxuICAgICAgZXJyb3JJY29uVVJMOiBjb25maWc/LmVycm9ySWNvblVSTCB8fCBcIlwiLFxuICAgICAgbG9hZGluZ0ljb25VUkw6IGNvbmZpZz8ubG9hZGluZ0ljb25VUkwgfHwgXCJcIixcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogR2V0IHN0eWxlIG9iamVjdCBiYXNlZCBvbiBtZXNzYWdlIHR5cGUuXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBzdHlsZSBvYmplY3QuXG4gICAqL1xuICBnZXRTdGF0dXNJbmZvU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgLy8gQmFzZSBzdHlsZXMgdGhhdCBhcmUgY29tbW9uIGZvciBib3RoIGNvbmRpdGlvbnNcbiAgICBjb25zdCBiYXNlU3R5bGUgPSB7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1lbmRcIixcbiAgICAgIGdhcDogXCIxcHhcIixcbiAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgfTtcblxuICAgIC8vIElmIG1lc3NhZ2UgdHlwZSBpcyBhdWRpbyBvciB2aWRlb1xuICAgIGlmICh0aGlzLmlzQXVkaW9PclZpZGVvTWVzc2FnZShtZXNzYWdlKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uYmFzZVN0eWxlLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIyMnB4XCIsXG4gICAgICAgIHBhZGRpbmc6IFwiM3B4IDVweFwiLFxuICAgICAgICBwYWRkaW5nVG9wOiBcIjJweFwiLFxuICAgICAgICBwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuICAgICAgICBtYXJnaW5Ub3A6IFwiLTI2cHhcIixcbiAgICAgICAgbWFyZ2luUmlnaHQ6IFwiNnB4XCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgICAgYWxpZ25TZWxmOiBcImZsZXgtZW5kXCIsXG4gICAgICAgIG1hcmdpbkJvdHRvbTogXCI2cHhcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gU3R5bGUgZm9yIG90aGVyIHR5cGVzIG9mIG1lc3NhZ2VzXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmJhc2VTdHlsZSxcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImZsZXgtZW5kXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtZW5kXCIsXG4gICAgICBwYWRkaW5nOiBcIjBweCA4cHggNHB4IDhweFwiLFxuICAgIH07XG4gIH07XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG4gIGxpc3RTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLnNob3dTbWFydFJlcGx5ID8gXCI5MiVcIiA6IFwiMTAwJVwiLFxuICAgIH07XG4gIH07XG4gIC8qKlxuICAgKiBTdHlsaW5nIGZvciByZWFjdGlvbnMgY29tcG9uZW50XG4gICAqXG4gICAqL1xuICBnZXRSZWFjdGlvbnNXcmFwcGVyU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IGFsaWdubWVudCA9IHRoaXMuc2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpO1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBwYWRkaW5nVG9wOiBcIjVweFwiLFxuICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgbWFyZ2luVG9wOiBcIi05cHhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OlxuICAgICAgICBhbGlnbm1lbnQgPT09IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdCA/IFwiZmxleC1zdGFydFwiIDogXCJmbGV4LWVuZFwiLFxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqIFN0eWxpbmcgZm9yIHVucmVhZCB0aHJlYWQgcmVwbGllc1xuICAgKiBAcmV0dXJucyBMYWJlbFN0eWxlXG4gICAqL1xuICBnZXRVbnJlYWRSZXBsaWVzQ291bnRTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwcHhcIixcbiAgICAgIHdpZHRoOiBcIjE1cHhcIixcbiAgICAgIGhlaWdodDogXCIxNXB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZEJhY2tncm91bmQsXG4gICAgICBjb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZFRleHRDb2xvcixcbiAgICAgIGZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlVbnJlYWRUZXh0Rm9udCxcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIH07XG4gIH07XG4gIGdldFRocmVhZFZpZXdBbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6XG4gICAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJlxuICAgICAgICAgIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkXG4gICAgICAgICAgPyBcImZsZXgtZW5kXCJcbiAgICAgICAgICA6IFwiZmxleC1zdGFydFwiLFxuICAgIH07XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiXG4gICpuZ0lmPVwiIW9wZW5Db250YWN0c1ZpZXdcIj5cblxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19oZWFkZXItdmlld1wiPlxuICAgIDxkaXYgKm5nSWY9XCJoZWFkZXJWaWV3XCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiaGVhZGVyVmlld1wiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0XCIgI2xpc3RTY3JvbGxcbiAgICBbbmdTdHlsZV09XCJ7aGVpZ2h0OiBzaG93U21hcnRSZXBseSB8fCBzaG93Q29udmVyc2F0aW9uU3RhcnRlciB8fCBzaG93Q29udmVyc2F0aW9uU3VtbWFyeSA/ICc5MiUnIDogJzEwMCUnfVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3RvcFwiICN0b3A+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGVjb3JhdG9yLW1lc3NhZ2VcIlxuICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMubG9hZGluZyB8fCBzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgIHx8IHN0YXRlID09IHN0YXRlcy5lbXB0eSBcIlxuICAgICAgW25nU3R5bGVdPVwibWVzc2FnZUNvbnRhaW5lclN0eWxlKClcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2xvYWRpbmctdmlld1wiXG4gICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbG9hZGVyIFtpY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgICBbbG9hZGVyU3R5bGVdPVwibG9hZGluZ1N0eWxlXCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWxvYWRlcj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2N1c3RvbXZpZXctLWxvYWRpbmdcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgICYmIGxvYWRpbmdTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibG9hZGluZ1N0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2Vycm9yLXZpZXdcIlxuICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lcnJvciAgJiYgIWhpZGVFcnJvciBcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbbGFiZWxTdHlsZV09XCJlcnJvclN0eWxlKClcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICYmICFlcnJvclN0YXRlVmlld1wiXG4gICAgICAgICAgW3RleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jdXN0b20tdmlldy0tZXJyb3JcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICAmJiBlcnJvclN0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJlcnJvclN0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2VtcHR5LXZpZXdcIiAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY3VzdG9tLXZpZXctLWVtcHR5XCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eSAmJiBlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGVcIlxuICAgICAgKm5nRm9yPVwibGV0IG1lc3NhZ2Ugb2YgbWVzc2FnZXNMaXN0OyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlLWNvbnRhaW5lclwiXG4gICAgICAgICpuZ0lmPVwiKGkgPT09IDApICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpICYmICFoaWRlRGF0ZVNlcGFyYXRvclwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbdGltZXN0YW1wXT1cIm1lc3NhZ2UhLmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtwYXR0ZXJuXT1cIkRhdGVTZXBhcmF0b3JQYXR0ZXJuXCIgW2RhdGVTdHlsZV09XCJkYXRlU2VwYXJhdG9yU3R5bGVcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGUtY29udGFpbmVyXCJcbiAgICAgICAgKm5nSWY9XCIoaSA+IDAgJiYgaXNEYXRlRGlmZmVyZW50KG1lc3NhZ2VzTGlzdFtpIC0gMV0/LmdldFNlbnRBdCgpLCBtZXNzYWdlc0xpc3RbaV0/LmdldFNlbnRBdCgpKSkgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KCkgJiYgIWhpZGVEYXRlU2VwYXJhdG9yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW3BhdHRlcm5dPVwiRGF0ZVNlcGFyYXRvclBhdHRlcm5cIiBbZGF0ZVN0eWxlXT1cImRhdGVTZXBhcmF0b3JTdHlsZVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiICNtZXNzYWdlQnViYmxlUmVmXG4gICAgICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGVcbiAgICAgICAgICBbbGVhZGluZ1ZpZXddPVwiIHNob3dBdmF0YXIgPyBsZWFkaW5nVmlldyA6IG51bGxcIlxuICAgICAgICAgIFtib3R0b21WaWV3XT1cImdldEJvdHRvbVZpZXcobWVzc2FnZSlcIlxuICAgICAgICAgIFtzdGF0dXNJbmZvVmlld109XCJzaG93U3RhdHVzSW5mbyhtZXNzYWdlKSA/ICBzdGF0dXNJbmZvVmlldyA6IG51bGxcIlxuICAgICAgICAgIFtoZWFkZXJWaWV3XT1cImdldEhlYWRlclZpZXcobWVzc2FnZSkgfHwgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSA/IGJ1YmJsZUhlYWRlciA6IG51bGxcIlxuICAgICAgICAgIFtmb290ZXJWaWV3XT1cImdldEZvb3RlclZpZXcobWVzc2FnZSkgfHwgcmVhY3Rpb25WaWV3XCJcbiAgICAgICAgICBbY29udGVudFZpZXddPVwiY29udGVudFZpZXdcIiBbdGhyZWFkVmlld109XCJ0aHJlYWRWaWV3XCJcbiAgICAgICAgICBbaWRdPVwibWVzc2FnZT8uZ2V0SWQoKSB8fCBtZXNzYWdlPy5nZXRNdWlkKClcIlxuICAgICAgICAgIFtvcHRpb25zXT1cInNldE1lc3NhZ2VPcHRpb25zKG1lc3NhZ2UpXCJcbiAgICAgICAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgW2FsaWdubWVudF09XCJzZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2NvbnRlbnRWaWV3PlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldENvbnRlbnRWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3JlYWN0aW9uVmlldz5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcmVhY3Rpb25zXG4gICAgICAgICAgICAgICpuZ0lmPVwibWVzc2FnZS5nZXRSZWFjdGlvbnMoKSAmJiBtZXNzYWdlLmdldFJlYWN0aW9ucygpLmxlbmd0aCA+IDAgJiYgIWRpc2FibGVSZWFjdGlvbnNcIlxuICAgICAgICAgICAgICBbbWVzc2FnZU9iamVjdF09XCJnZXRDbG9uZWRSZWFjdGlvbk9iamVjdChtZXNzYWdlKVwiXG4gICAgICAgICAgICAgIFthbGlnbm1lbnRdPVwic2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW3JlYWN0aW9uc1N0eWxlXT1cImdldFJlYWN0aW9uc1N0eWxlKClcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25DbGlja109XCJhZGRSZWFjdGlvbk9uQ2xpY2tcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbl09XCJnZXRSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKClcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbl09XCJnZXRSZWFjdGlvbkluZm9Db25maWd1cmF0aW9uKClcIj48L2NvbWV0Y2hhdC1yZWFjdGlvbnM+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3N0YXR1c0luZm9WaWV3PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLXN0YXR1cy1pbmZvXCJcbiAgICAgICAgICAgICAgW25nU3R5bGVdPVwiZ2V0U3RhdHVzSW5mb1N0eWxlKG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtlbHNlIGJ1YmJsZUZvb3RlclwiPlxuICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUZvb3Rlcj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtZGF0ZVwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLmJvdHRvbSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPlxuICAgICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAgIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+XG4gICAgICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwiICFtZXNzYWdlPy5nZXREZWxldGVkQXQoKSAmJiAgIWRpc2FibGVSZWNlaXB0ICYmICghbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHx0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSA9PSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkpICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19yZWNlaXB0XCI+XG4gICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LXJlY2VpcHQgW3JlY2VpcHRdPVwiZ2V0TWVzc2FnZVJlY2VpcHQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cImdldFJlY2VpcHRTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAgIFt3YWl0SWNvbl09XCJ3YWl0SWNvblwiIFtzZW50SWNvbl09XCJzZW50SWNvblwiXG4gICAgICAgICAgICAgICAgICAgIFtkZWxpdmVyZWRJY29uXT1cImRlbGl2ZXJlZEljb25cIiBbcmVhZEljb25dPVwicmVhZEljb25cIlxuICAgICAgICAgICAgICAgICAgICBbZXJyb3JJY29uXT1cImVycm9ySWNvblwiPjwvY29tZXRjaGF0LXJlY2VpcHQ+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICpuZ0lmPVwiIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAgJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYXZhdGFyIFtuYW1lXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICAgICAgICAgICAgW2ltYWdlXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRBdmF0YXIoKVwiPlxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlSGVhZGVyPlxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7ZWxzZSBkZWZhdWx0SGVhZGVyXCI+XG4gICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRIZWFkZXI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1oZWFkZXJcIlxuICAgICAgICAgICAgICAgICpuZ0lmPVwibWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCI+XG4gICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImxhYmVsU3R5bGVcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIlxuICAgICAgICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLnRvcCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjdGhyZWFkVmlldz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3RocmVhZHJlcGxpZXNcIlxuICAgICAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldFJlcGx5Q291bnQoKSAmJiAhbWVzc2FnZS5nZXREZWxldGVkQXQoKVwiXG4gICAgICAgICAgICAgIFtuZ1N0eWxlXT1cImdldFRocmVhZFZpZXdBbGlnbm1lbnQobWVzc2FnZSlcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbaWNvblVSTF09XCJ0aHJlYWRJbmRpY2F0b3JJY29uXCJcbiAgICAgICAgICAgICAgICBbbWlycm9ySWNvbl09XCJnZXRUaHJlYWRJY29uQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiZ2V0VGhyZWFkVmlld1N0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib3BlblRocmVhZFZpZXcobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgIFt0ZXh0XT0nZ2V0VGhyZWFkQ291bnQobWVzc2FnZSknPlxuICAgICAgICAgICAgICAgIDwhLS0gPHNwYW4gc2xvdD1cImJ1dHRvblZpZXdcIiBbbmdTdHlsZV09XCJnZXRVbnJlYWRSZXBsaWVzQ291bnRTdHlsZSgpXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X191bnJlYWQtdGhyZWFkXCJcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZS5nZXRVbnJlYWRSZXBseUNvdW50KCkgPiAwXCI+XG4gICAgICAgICAgICAgICAgICB7e21lc3NhZ2UuZ2V0VW5yZWFkUmVwbHlDb3VudCgpfX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+IC0tPlxuXG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19ib3R0b21cIiAjYm90dG9tPlxuICAgIDwvZGl2PlxuXG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19tZXNzYWdlLWluZGljYXRvclwiXG4gICAgKm5nSWY9XCJVbnJlYWRDb3VudCAmJiBVbnJlYWRDb3VudC5sZW5ndGggPiAwICYmICFpc09uQm90dG9tXCJcbiAgICBbbmdTdHlsZV09XCJ7Ym90dG9tOiBzaG93U21hcnRSZXBseSB8fCBmb290ZXJWaWV3IHx8IHNob3dDb252ZXJzYXRpb25TdGFydGVyIHx8IHNob3dDb252ZXJzYXRpb25TdW1tYXJ5ICA/ICcyMCUnIDogJzEzJSd9XCI+XG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW3RleHRdPVwibmV3TWVzc2FnZUNvdW50XCJcbiAgICAgIFtidXR0b25TdHlsZV09XCJ1bnJlYWRNZXNzYWdlc1N0eWxlXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJzY3JvbGxUb0JvdHRvbSgpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZm9vdGVyLXZpZXdcIiBbbmdTdHlsZV09XCJ7aGVpZ2h0OiAgJ2F1dG8nfVwiPlxuXG4gICAgPGRpdiAqbmdJZj1cImZvb3RlclZpZXc7ZWxzZSBmb290ZXJcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJmb290ZXJWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgICA8bmctdGVtcGxhdGUgI2Zvb3Rlcj5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fc21hcnQtcmVwbGllc1wiXG4gICAgICAgICpuZ0lmPVwiIXNob3dDb252ZXJzYXRpb25TdGFydGVyICYmIHNob3dTbWFydFJlcGx5ICYmIGdldFJlcGxpZXMoKVwiPlxuICAgICAgICA8c21hcnQtcmVwbGllcyBbc21hcnRSZXBseVN0eWxlXT1cInNtYXJ0UmVwbHlTdHlsZVwiXG4gICAgICAgICAgW3JlcGxpZXNdPVwiZ2V0UmVwbGllcygpXCIgKGNjLXJlcGx5LWNsaWNrZWQpPVwic2VuZFJlcGx5KCRldmVudClcIlxuICAgICAgICAgIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlU21hcnRSZXBseSgpXCI+XG4gICAgICAgIDwvc21hcnQtcmVwbGllcz5cbiAgICAgIDwvZGl2PlxuXG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2NvbnZlcnNhdGlvbi1zdGFydGVyc1wiXG4gICAgICAgICpuZ0lmPVwiZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlciAmJiBzaG93Q29udmVyc2F0aW9uU3RhcnRlclwiPlxuICAgICAgICA8Y29tZXRjaGF0LWFpLWNhcmQgW3N0YXRlXT1cImNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZVwiXG4gICAgICAgICAgW2xvYWRpbmdTdGF0ZVRleHRdPVwic3RhcnRlckxvYWRpbmdTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJzdGFydGVyRW1wdHlTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiPlxuICAgICAgICAgIDxzbWFydC1yZXBsaWVzXG4gICAgICAgICAgICAqbmdJZj1cImNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9PSBzdGF0ZXMubG9hZGVkICYmICFwYXJlbnRNZXNzYWdlSWRcIlxuICAgICAgICAgICAgW3NtYXJ0UmVwbHlTdHlsZV09XCJjb252ZXJzYXRpb25TdGFydGVyU3R5bGVcIlxuICAgICAgICAgICAgW3JlcGxpZXNdPVwiY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXNcIiBzbG90PVwibG9hZGVkVmlld1wiXG4gICAgICAgICAgICAoY2MtcmVwbHktY2xpY2tlZCk9XCJzZW5kQ29udmVyc2F0aW9uU3RhcnRlcigkZXZlbnQpXCJcbiAgICAgICAgICAgIFtjbG9zZUljb25VUkxdPVwiJydcIj5cbiAgICAgICAgICA8L3NtYXJ0LXJlcGxpZXM+XG4gICAgICAgIDwvY29tZXRjaGF0LWFpLWNhcmQ+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY29udmVyc2F0aW9uLXN1bW1hcnlcIlxuICAgICAgICAqbmdJZj1cImVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnkgJiYgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnlcIj5cblxuICAgICAgICA8Y29tZXRjaGF0LWFpLWNhcmQgW3N0YXRlXT1cImNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZVwiXG4gICAgICAgICAgW2xvYWRpbmdTdGF0ZVRleHRdPVwic3VtbWFyeUxvYWRpbmdTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJzdW1tYXJ5RW1wdHlTdGF0ZVRleHRcIlxuICAgICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiIFtlcnJvckljb25VUkxdPVwiYWlFcnJvckljb25cIlxuICAgICAgICAgIFtlbXB0eUljb25VUkxdPVwiYWlFbXB0eUljb25cIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBhbmVsXG4gICAgICAgICAgICAqbmdJZj1cImNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9PSBzdGF0ZXMubG9hZGVkICYmICFwYXJlbnRNZXNzYWdlSWRcIlxuICAgICAgICAgICAgc2xvdD1cImxvYWRlZFZpZXdcIiBbcGFuZWxTdHlsZV09XCJjb252ZXJzYXRpb25TdW1tYXJ5U3R5bGVcIlxuICAgICAgICAgICAgdGl0bGU9XCJDb252ZXJzYXRpb24gU3VtbWFyeVwiIFt0ZXh0XT1cImNvbnZlcnNhdGlvblN1bW1hcnlcIlxuICAgICAgICAgICAgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VDb252ZXJzYXRpb25TdW1tYXJ5KClcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1wYW5lbD5cbiAgICAgICAgPC9jb21ldGNoYXQtYWktY2FyZD5cblxuICAgICAgPC9kaXY+XG5cbiAgICA8L25nLXRlbXBsYXRlPlxuICA8L2Rpdj5cblxuPC9kaXY+XG48IS0tIGRlZmF1bHQgYnViYmxlcyAtLT5cbjxuZy10ZW1wbGF0ZSAjdGV4dEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICpuZ0lmPVwibWVzc2FnZT8udHlwZSA9PSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cIm1lc3NhZ2U/Lm1lc3NhZ2VcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZSAqbmdJZj1cIm1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpXCJcbiAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwibG9jYWxpemUoJ01FU1NBR0VfSVNfREVMRVRFRCcpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAqbmdJZj1cIiFpc1RyYW5zbGF0ZWQobWVzc2FnZSkgJiYgIWdldExpbmtQcmV2aWV3KG1lc3NhZ2UpICYmICFtZXNzYWdlPy5kZWxldGVkQXQgJiYgbWVzc2FnZT8udHlwZSAhPSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIiBbdGV4dF09XCJnZXRUZXh0TWVzc2FnZShtZXNzYWdlKVwiXG4gICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDxsaW5rLXByZXZpZXcgW2xpbmtQcmV2aWV3U3R5bGVdPVwibGlua1ByZXZpZXdTdHlsZVwiXG4gICAgKGNjLWxpbmstY2xpY2tlZCk9XCJvcGVuTGlua1VSTCgkZXZlbnQpXCJcbiAgICAqbmdJZj1cIiFtZXNzYWdlPy5nZXREZWxldGVkQXQoKSAmJiBnZXRMaW5rUHJldmlldyhtZXNzYWdlKSAmJiBlbmFibGVMaW5rUHJldmlld1wiXG4gICAgW3RpdGxlXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygndGl0bGUnLG1lc3NhZ2UpXCJcbiAgICBbZGVzY3JpcHRpb25dPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCdkZXNjcmlwdGlvbicsbWVzc2FnZSlcIlxuICAgIFtVUkxdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCd1cmwnLG1lc3NhZ2UpXCJcbiAgICBbaW1hZ2VdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCdpbWFnZScsbWVzc2FnZSlcIlxuICAgIFtmYXZJY29uVVJMXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygnZmF2aWNvbicsbWVzc2FnZSlcIj5cbiAgICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgICAqbmdJZj1cIiFpc1RyYW5zbGF0ZWQobWVzc2FnZSkgJiYgZ2V0TGlua1ByZXZpZXcobWVzc2FnZSkgJiYgIW1lc3NhZ2U/LmRlbGV0ZWRBdCAmJiBtZXNzYWdlPy50eXBlICE9IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW3RleHRdPVwiZ2V0VGV4dE1lc3NhZ2UobWVzc2FnZSlcIlxuICAgICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDwvbGluay1wcmV2aWV3PlxuICA8bWVzc2FnZS10cmFuc2xhdGlvbi1idWJibGUgW2FsaWdubWVudF09XCJnZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIlxuICAgICpuZ0lmPVwiaXNUcmFuc2xhdGVkKG1lc3NhZ2UpXCJcbiAgICBbbWVzc2FnZVRyYW5zbGF0aW9uU3R5bGVdPVwic2V0VHJhbnNsYXRpb25TdHlsZShtZXNzYWdlKVwiXG4gICAgW3RyYW5zbGF0ZWRUZXh0XT1cImlzVHJhbnNsYXRlZChtZXNzYWdlKVwiXG4gICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+XG4gICAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICAgKm5nSWY9XCIgIW1lc3NhZ2U/LmRlbGV0ZWRBdCAmJiBtZXNzYWdlPy50eXBlICE9IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW3RleHRdPVwibWVzc2FnZT8udGV4dFwiXG4gICAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cblxuICA8L21lc3NhZ2UtdHJhbnNsYXRpb24tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjZmlsZUJ1YmJsZSBsZXQtbWVzc2FnZT5cblxuICA8Y29tZXRjaGF0LWZpbGUtYnViYmxlIFtmaWxlU3R5bGVdPVwic2V0RmlsZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbZG93bmxvYWRJY29uVVJMXT1cImRvd25sb2FkSWNvblVSTFwiIFtzdWJ0aXRsZV09XCJsb2NhbGl6ZSgnU0hBUkVEX0ZJTEUnKVwiXG4gICAgW3RpdGxlXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/Lm5hbWU6ICcnXCJcbiAgICBbZmlsZVVSTF09XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmwgOiAnJ1wiPjwvY29tZXRjaGF0LWZpbGUtYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjYXVkaW9CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtaWNvbi1idXR0b24gW2Rpc2FibGVkXT1cInRydWVcIlxuICAgICpuZ0lmPVwibWVzc2FnZT8uY2F0ZWdvcnkgPT0gY2FsbENvbnN0YW50ICYmIG1lc3NhZ2U/LnR5cGUgPT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuYXVkaW9cIlxuICAgIFtpY29uVVJMXT1cImdldENhbGxUeXBlSWNvbihtZXNzYWdlKVwiXG4gICAgW2J1dHRvblN0eWxlXT1cImNhbGxTdGF0dXNTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwiZ2V0Q2FsbEFjdGlvbk1lc3NhZ2UobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgPGNvbWV0Y2hhdC1hdWRpby1idWJibGVcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIG1lc3NhZ2U/LmNhdGVnb3J5ICE9IGNhbGxDb25zdGFudFwiXG4gICAgW3NyY109XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmwgOiAnJ1wiPlxuICA8L2NvbWV0Y2hhdC1hdWRpby1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICN2aWRlb0J1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbZGlzYWJsZWRdPVwidHJ1ZVwiXG4gICAgKm5nSWY9XCJtZXNzYWdlPy5jYXRlZ29yeSA9PSBjYWxsQ29uc3RhbnQgJiYgbWVzc2FnZT8udHlwZSA9PSBNZXNzYWdlVHlwZXNDb25zdGFudC52aWRlb1wiXG4gICAgW2ljb25VUkxdPVwiZ2V0Q2FsbFR5cGVJY29uKG1lc3NhZ2UpXCJcbiAgICBbYnV0dG9uU3R5bGVdPVwiY2FsbFN0YXR1c1N0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJnZXRDYWxsQWN0aW9uTWVzc2FnZShtZXNzYWdlKVwiPjwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuXG4gIDxjb21ldGNoYXQtdmlkZW8tYnViYmxlXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlPy5jYXRlZ29yeSAhPSBjYWxsQ29uc3RhbnRcIlxuICAgIFt2aWRlb1N0eWxlXT1cInZpZGVvQnViYmxlU3R5bGVcIlxuICAgIFtzcmNdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsIDogJydcIlxuICAgIFtwb3N0ZXJdPVwiIGdldEltYWdlVGh1bWJuYWlsKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdmlkZW8tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjaW1hZ2VCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxpbWFnZS1tb2RlcmF0aW9uIChjYy1zaG93LWRpYWxvZyk9XCJvcGVuV2FybmluZ0RpYWxvZygkZXZlbnQpXCJcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIGVuYWJsZUltYWdlTW9kZXJhdGlvblwiIFttZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtpbWFnZU1vZGVyYXRpb25TdHlsZV09XCJpbWFnZU1vZGVyYXRpb25TdHlsZVwiPlxuICAgIDxjb21ldGNoYXQtaW1hZ2UtYnViYmxlIChjYy1pbWFnZS1jbGlja2VkKT1cIm9wZW5JbWFnZUluRnVsbFNjcmVlbihtZXNzYWdlKVwiXG4gICAgICBbaW1hZ2VTdHlsZV09XCJpbWFnZUJ1YmJsZVN0eWxlXCIgW3NyY109XCIgZ2V0SW1hZ2VUaHVtYm5haWwobWVzc2FnZSlcIlxuICAgICAgW3BsYWNlaG9sZGVySW1hZ2VdPVwicGxhY2Vob2xkZXJJY29uVVJMXCI+PC9jb21ldGNoYXQtaW1hZ2UtYnViYmxlPlxuICA8L2ltYWdlLW1vZGVyYXRpb24+XG4gIDxjb21ldGNoYXQtaW1hZ2UtYnViYmxlIFtpbWFnZVN0eWxlXT1cImltYWdlQnViYmxlU3R5bGVcIlxuICAgIChjYy1pbWFnZS1jbGlja2VkKT1cIm9wZW5JbWFnZUluRnVsbFNjcmVlbihtZXNzYWdlKVwiXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiAhZW5hYmxlSW1hZ2VNb2RlcmF0aW9uXCJcbiAgICBbc3JjXT1cIiBnZXRJbWFnZVRodW1ibmFpbChtZXNzYWdlKVwiXG4gICAgW3BsYWNlaG9sZGVySW1hZ2VdPVwicGxhY2Vob2xkZXJJY29uVVJMXCI+PC9jb21ldGNoYXQtaW1hZ2UtYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjZm9ybUJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1mb3JtLWJ1YmJsZSBbbWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbZm9ybUJ1YmJsZVN0eWxlXT1cImdldEZvcm1NZXNzYWdlQnViYmxlU3R5bGUoKVwiPjwvY29tZXRjaGF0LWZvcm0tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjY2FyZEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1jYXJkLWJ1YmJsZSBbbWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbY2FyZEJ1YmJsZVN0eWxlXT1cImdldENhcmRNZXNzYWdlQnViYmxlU3R5bGUoKVwiPjwvY29tZXRjaGF0LWNhcmQtYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjY3VzdG9tVGV4dEJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3N0aWNrZXJCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtaW1hZ2UtYnViYmxlIFtzcmNdPVwiZ2V0U3RpY2tlcihtZXNzYWdlKVwiXG4gICAgW2ltYWdlU3R5bGVdPVwiaW1hZ2VCdWJibGVTdHlsZVwiPjwvY29tZXRjaGF0LWltYWdlLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjd2hpdGVib2FyZEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1kb2N1bWVudC1idWJibGUgW2hpZGVTZXBhcmF0b3JdPVwiZmFsc2VcIlxuICAgIFtpY29uQWxpZ25tZW50XT1cImRvY3VtZW50QnViYmxlQWxpZ25tZW50XCJcbiAgICBbZG9jdW1lbnRTdHlsZV09XCJkb2N1bWVudEJ1YmJsZVN0eWxlXCIgW1VSTF09XCJnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZSlcIlxuICAgIFtjY0NsaWNrZWRdPVwibGF1bmNoQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmREb2N1bWVudFwiXG4gICAgW2ljb25VUkxdPVwid2hpdGVib2FyZEljb25VUkxcIiBbdGl0bGVdPVwid2hpdGVib2FyZFRpdGxlXCJcbiAgICBbYnV0dG9uVGV4dF09XCJ3aGl0ZWJvYXJkQnV0dG9uVGV4dFwiXG4gICAgW3N1YnRpdGxlXT1cIndoaXRlYm9hcmRTdWJpdGxlXCI+PC9jb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNkb2N1bWVudEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1kb2N1bWVudC1idWJibGUgW2hpZGVTZXBhcmF0b3JdPVwiZmFsc2VcIlxuICAgIFtpY29uQWxpZ25tZW50XT1cImRvY3VtZW50QnViYmxlQWxpZ25tZW50XCJcbiAgICBbZG9jdW1lbnRTdHlsZV09XCJkb2N1bWVudEJ1YmJsZVN0eWxlXCIgW1VSTF09XCJnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZSlcIlxuICAgIFtjY0NsaWNrZWRdPVwibGF1bmNoQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmREb2N1bWVudFwiXG4gICAgW2ljb25VUkxdPVwiZG9jdW1lbnRJY29uVVJMXCIgW3RpdGxlXT1cImRvY3VtZW50VGl0bGVcIlxuICAgIFtidXR0b25UZXh0XT1cImRvY3VtZW50QnV0dG9uVGV4dFwiXG4gICAgW3N1YnRpdGxlXT1cImRvY3VtZW50U3ViaXRsZVwiPjwvY29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjZGlyZWN0Q2FsbGluZyBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1kb2N1bWVudC1idWJibGUgW2hpZGVTZXBhcmF0b3JdPVwidHJ1ZVwiXG4gICAgW2ljb25BbGlnbm1lbnRdPVwiY2FsbEJ1YmJsZUFsaWdubWVudFwiXG4gICAgW2RvY3VtZW50U3R5bGVdPVwiZ2V0Q2FsbEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW1VSTF09XCJnZXRTZXNzaW9uSWQobWVzc2FnZSlcIlxuICAgIFtjY0NsaWNrZWRdPVwiZ2V0U3RhcnRDYWxsRnVuY3Rpb24obWVzc2FnZSlcIiBbaWNvblVSTF09XCJkaXJlY3RDYWxsSWNvblVSTFwiXG4gICAgW3RpdGxlXT1cImdldENhbGxCdWJibGVUaXRsZShtZXNzYWdlKVwiIFtidXR0b25UZXh0XT1cImpvaW5DYWxsQnV0dG9uVGV4dFwiXG4gICAgKm5nSWY9XCJtZXNzYWdlLmNhdGVnb3J5ID09ICdjdXN0b20nXCI+PC9jb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNzY2hlZHVsZXJCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtc2NoZWR1bGVyLWJ1YmJsZSBbc2NoZWR1bGVyTWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbbG9nZ2VkSW5Vc2VyXT1cImxvZ2dlZEluVXNlclwiXG4gICAgW3NjaGVkdWxlckJ1YmJsZVN0eWxlXT1cImdldFNjaGVkdWxlckJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtc2NoZWR1bGVyLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjcG9sbEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPHBvbGxzLWJ1YmJsZSBbcG9sbFN0eWxlXT1cInBvbGxCdWJibGVTdHlsZVwiXG4gICAgW3BvbGxRdWVzdGlvbl09XCJnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlLCdxdWVzdGlvbicpXCJcbiAgICBbcG9sbElkXT1cImdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2UsJ2lkJylcIiBbbG9nZ2VkSW5Vc2VyXT1cImxvZ2dlZEluVXNlclwiXG4gICAgW3NlbmRlclVpZF09XCJnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlKVwiXG4gICAgW21ldGFkYXRhXT1cIm1lc3NhZ2U/Lm1ldGFkYXRhXCI+PC9wb2xscy1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG5cbjwhLS0gdGhyZWFkIGJ1YmJsZSB2aWV3IC0tPlxuPG5nLXRlbXBsYXRlICN0aHJlYWRNZXNzYWdlQnViYmxlIGxldC1tZXNzYWdlPlxuICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgIDxuZy1jb250YWluZXJcbiAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGUgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiXG4gICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgW3N0YXR1c0luZm9WaWV3XT1cInNob3dTdGF0dXNJbmZvKG1lc3NhZ2UpID8gIHN0YXR1c0luZm9WaWV3IDogbnVsbFwiXG4gICAgW2xlYWRpbmdWaWV3XT1cIiBzaG93QXZhdGFyID8gbGVhZGluZ1ZpZXcgOiBudWxsXCIgW2hlYWRlclZpZXddPVwiYnViYmxlSGVhZGVyXCJcbiAgICBbZm9vdGVyVmlld109XCJnZXRGb290ZXJWaWV3KG1lc3NhZ2UpXCIgW2NvbnRlbnRWaWV3XT1cImNvbnRlbnRWaWV3XCJcbiAgICBbaWRdPVwibWVzc2FnZT8uZ2V0SWQoKSB8fCBtZXNzYWdlPy5nZXRNdWlkKClcIlxuICAgIFttZXNzYWdlQnViYmxlU3R5bGVdPVwic2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbYWxpZ25tZW50XT1cInRocmVhZGVkQWxpZ25tZW50XCI+XG4gICAgPG5nLXRlbXBsYXRlICNjb250ZW50Vmlldz5cbiAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRDb250ZW50VmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNzdGF0dXNJbmZvVmlldz5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1zdGF0dXMtaW5mb1wiXG4gICAgICAgIFtuZ1N0eWxlXT1cImdldFN0YXR1c0luZm9TdHlsZShtZXNzYWdlKVwiPlxuICAgICAgICA8ZGl2ICpuZ0lmPVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSk7ZWxzZSBidWJibGVGb290ZXJcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNidWJibGVGb290ZXI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLWRhdGVcIlxuICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS5ib3R0b20gJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbdGltZXN0YW1wXT1cIm1lc3NhZ2U/LmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIiBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAqbmdJZj1cIiAhbWVzc2FnZT8uZ2V0RGVsZXRlZEF0KCkgJiYgICFkaXNhYmxlUmVjZWlwdCAmJiAoIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8dGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKCkgPT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiXG4gICAgICAgICAgICBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fcmVjZWlwdFwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW3JlY2VpcHRTdHlsZV09XCJnZXRSZWNlaXB0U3R5bGUobWVzc2FnZSlcIiBbd2FpdEljb25dPVwid2FpdEljb25cIlxuICAgICAgICAgICAgICBbc2VudEljb25dPVwic2VudEljb25cIiBbZGVsaXZlcmVkSWNvbl09XCJcIlxuICAgICAgICAgICAgICBbcmVhZEljb25dPVwiZGVsaXZlcmVkSWNvblwiXG4gICAgICAgICAgICAgIFtlcnJvckljb25dPVwiZXJyb3JJY29uXCI+PC9jb21ldGNoYXQtcmVjZWlwdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNsZWFkaW5nVmlldz5cbiAgICAgIDxkaXZcbiAgICAgICAgKm5nSWY9XCIgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKVwiPlxuICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbbmFtZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICAgIFtpbWFnZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0QXZhdGFyKClcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUhlYWRlcj5cbiAgICAgIDxkaXYgKm5nSWY9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2Vsc2UgZGVmYXVsdEhlYWRlclwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0SGVhZGVyPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtaGVhZGVyXCJcbiAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJsYWJlbFN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS50b3AgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG5cblxuPCEtLSAgLS0+XG48Y29tZXRjaGF0LXBvcG92ZXIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIiAjcG9wb3ZlclJlZlxuICBbcGxhY2VtZW50XT1cImtleWJvYXJkQWxpZ25tZW50XCI+XG4gIDxjb21ldGNoYXQtZW1vamkta2V5Ym9hcmQgKGNjLWVtb2ppLWNsaWNrZWQpPVwiYWRkUmVhY3Rpb24oJGV2ZW50KVwiXG4gICAgc2xvdD1cImNvbnRlbnRcIlxuICAgIFtlbW9qaUtleWJvYXJkU3R5bGVdPVwiZW1vamlLZXlib2FyZFN0eWxlXCI+PC9jb21ldGNoYXQtZW1vamkta2V5Ym9hcmQ+XG48L2NvbWV0Y2hhdC1wb3BvdmVyPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cIm9wZW5Db25maXJtRGlhbG9nXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiIFttZXNzYWdlVGV4dF09XCJ3YXJuaW5nVGV4dFwiXG4gICAgKGNjLWNvbmZpcm0tY2xpY2tlZCk9XCJvbkNvbmZpcm1DbGljaygpXCIgW2NhbmNlbEJ1dHRvblRleHRdPVwiY2FuY2VsVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cImNvbmZpcm1UZXh0XCIgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgW2NvbmZpcm1EaWFsb2dTdHlsZV09XCJjb25maXJtRGlhbG9nU3R5bGVcIj5cblxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1mdWxsLXNjcmVlbi12aWV3ZXIgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VJbWFnZUluRnVsbFNjcmVlbigpXCJcbiAgKm5nSWY9XCJvcGVuRnVsbHNjcmVlblZpZXdcIiBbVVJMXT1cImltYWdldXJsVG9PcGVuXCJcbiAgW2Nsb3NlSWNvblVSTF09XCJjbG9zZUljb25VUkxcIiBbZnVsbFNjcmVlblZpZXdlclN0eWxlXT1cImZ1bGxTY3JlZW5WaWV3ZXJTdHlsZVwiPlxuXG48L2NvbWV0Y2hhdC1mdWxsLXNjcmVlbi12aWV3ZXI+XG5cbjwhLS0gb25nb2luZyBjYWxsc2NyZWVuIGZvciBkaXJlY3QgY2FsbCAtLT5cbjxjb21ldGNoYXQtb25nb2luZy1jYWxsICpuZ0lmPVwic2hvd09uZ29pbmdDYWxsXCJcbiAgW2NhbGxTZXR0aW5nc0J1aWxkZXJdPVwiZ2V0Q2FsbEJ1aWxkZXIoKVwiIFtvbmdvaW5nQ2FsbFN0eWxlXT1cIm9uZ29pbmdDYWxsU3R5bGVcIlxuICBbc2Vzc2lvbklEXT1cInNlc3Npb25JZFwiPjwvY29tZXRjaGF0LW9uZ29pbmctY2FsbD5cbjwhLS0gbWVzc2FnZSBpbmZvcm1hdGlvbiB2aWV3IC0tPlxuPCEtLSB0aHJlYWQgYnViYmxlIHZpZXcgLS0+XG48bmctdGVtcGxhdGUgI21lc3NhZ2VpbmZvQnViYmxlIGxldC1tZXNzYWdlPlxuICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgIDxuZy1jb250YWluZXJcbiAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGUgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiXG4gICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgW3N0YXR1c0luZm9WaWV3XT1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpXCJcbiAgICBbZm9vdGVyVmlld109XCJnZXRGb290ZXJWaWV3KG1lc3NhZ2UpXCJcbiAgICBbbGVhZGluZ1ZpZXddPVwic2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiIFtoZWFkZXJWaWV3XT1cImJ1YmJsZUhlYWRlclwiXG4gICAgW2NvbnRlbnRWaWV3XT1cImNvbnRlbnRWaWV3XCIgW2lkXT1cIm1lc3NhZ2U/LmdldElkKCkgfHwgbWVzc2FnZT8uZ2V0TXVpZCgpXCJcbiAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW2FsaWdubWVudF09XCJtZXNzYWdlSW5mb0FsaWdubWVudFwiPlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG4gICAgICA8ZGl2XG4gICAgICAgICpuZ0lmPVwiIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSlcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1hdmF0YXIgW25hbWVdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgICAgICBbaW1hZ2VdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldEF2YXRhcigpXCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWF2YXRhcj5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNidWJibGVIZWFkZXI+XG4gICAgICA8ZGl2ICpuZ0lmPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtlbHNlIGRlZmF1bHRIZWFkZXJcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdEhlYWRlcj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLWhlYWRlclwiXG4gICAgICAgICAgKm5nSWY9XCJtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGxcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwibGFiZWxTdHlsZVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiXG4gICAgICAgICAgICBbdGltZXN0YW1wXT1cIm1lc3NhZ2U/LmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0udG9wICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cIm9wZW5NZXNzYWdlSW5mb1BhZ2VcIiBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCI+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1pbmZvcm1hdGlvblxuICAgIFtjbG9zZUljb25VUkxdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5jbG9zZUljb25VUkxcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICBbcmVhZEljb25dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5yZWFkSWNvblwiXG4gICAgW2RlbGl2ZXJlZEljb25dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5kZWxpdmVyZWRJY29uXCJcbiAgICBbb25FcnJvcl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtTdWJ0aXRsZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIlxuICAgIFtyZWNlaXB0RGF0ZVBhdHRlcm5dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5yZWNlaXB0RGF0ZVBhdHRlcm5cIlxuICAgIFtsaXN0SXRlbVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXcgXCJcbiAgICBbbWVzc2FnZUluZm9ybWF0aW9uU3R5bGVdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5tZXNzYWdlSW5mb3JtYXRpb25TdHlsZVwiXG4gICAgW29uQ2xvc2VdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5vbkNsb3NlID8/ICBjbG9zZU1lc3NhZ2VJbmZvUGFnZVwiXG4gICAgW2J1YmJsZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5idWJibGVWaWV3ID8/IG1lc3NhZ2VpbmZvQnViYmxlXCJcbiAgICBbbWVzc2FnZV09XCJtZXNzYWdlSW5mb09iamVjdFwiPlxuXG4gIDwvY29tZXRjaGF0LW1lc3NhZ2UtaW5mb3JtYXRpb24+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==