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
CometChatMessageListComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageListComponent, deps: [{ token: i0.NgZone }, { token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageListComponent, selector: "cometchat-message-list", inputs: { hideError: "hideError", hideDateSeparator: "hideDateSeparator", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateView: "emptyStateView", errorStateText: "errorStateText", emptyStateText: "emptyStateText", loadingIconURL: "loadingIconURL", user: "user", group: "group", disableReceipt: "disableReceipt", hideReceipt: "hideReceipt", disableSoundForMessages: "disableSoundForMessages", customSoundForMessages: "customSoundForMessages", readIcon: "readIcon", deliveredIcon: "deliveredIcon", sentIcon: "sentIcon", waitIcon: "waitIcon", errorIcon: "errorIcon", aiErrorIcon: "aiErrorIcon", aiEmptyIcon: "aiEmptyIcon", alignment: "alignment", showAvatar: "showAvatar", datePattern: "datePattern", timestampAlignment: "timestampAlignment", DateSeparatorPattern: "DateSeparatorPattern", templates: "templates", messagesRequestBuilder: "messagesRequestBuilder", newMessageIndicatorText: "newMessageIndicatorText", scrollToBottomOnNewMessages: "scrollToBottomOnNewMessages", thresholdValue: "thresholdValue", unreadMessageThreshold: "unreadMessageThreshold", reactionsConfiguration: "reactionsConfiguration", disableReactions: "disableReactions", emojiKeyboardStyle: "emojiKeyboardStyle", apiConfiguration: "apiConfiguration", onThreadRepliesClick: "onThreadRepliesClick", headerView: "headerView", footerView: "footerView", parentMessageId: "parentMessageId", threadIndicatorIcon: "threadIndicatorIcon", avatarStyle: "avatarStyle", backdropStyle: "backdropStyle", dateSeparatorStyle: "dateSeparatorStyle", messageListStyle: "messageListStyle", onError: "onError", messageInformationConfiguration: "messageInformationConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, viewQueries: [{ propertyName: "listScroll", first: true, predicate: ["listScroll"], descendants: true }, { propertyName: "bottom", first: true, predicate: ["bottom"], descendants: true }, { propertyName: "top", first: true, predicate: ["top"], descendants: true }, { propertyName: "textBubble", first: true, predicate: ["textBubble"], descendants: true }, { propertyName: "threadMessageBubble", first: true, predicate: ["threadMessageBubble"], descendants: true }, { propertyName: "fileBubble", first: true, predicate: ["fileBubble"], descendants: true }, { propertyName: "audioBubble", first: true, predicate: ["audioBubble"], descendants: true }, { propertyName: "videoBubble", first: true, predicate: ["videoBubble"], descendants: true }, { propertyName: "imageBubble", first: true, predicate: ["imageBubble"], descendants: true }, { propertyName: "formBubble", first: true, predicate: ["formBubble"], descendants: true }, { propertyName: "cardBubble", first: true, predicate: ["cardBubble"], descendants: true }, { propertyName: "stickerBubble", first: true, predicate: ["stickerBubble"], descendants: true }, { propertyName: "documentBubble", first: true, predicate: ["documentBubble"], descendants: true }, { propertyName: "whiteboardBubble", first: true, predicate: ["whiteboardBubble"], descendants: true }, { propertyName: "popoverRef", first: true, predicate: ["popoverRef"], descendants: true }, { propertyName: "directCalling", first: true, predicate: ["directCalling"], descendants: true }, { propertyName: "schedulerBubble", first: true, predicate: ["schedulerBubble"], descendants: true }, { propertyName: "pollBubble", first: true, predicate: ["pollBubble"], descendants: true }, { propertyName: "messageBubbleRef", predicate: ["messageBubbleRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"], components: [{ type: i2.CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: ["messageBubbleStyle", "alignment", "options", "id", "leadingView", "headerView", "replyView", "contentView", "threadView", "footerView", "bottomView", "statusInfoView", "moreIconURL", "topMenuSize"] }, { type: i3.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i4.CometChatMessageInformationComponent, selector: "cometchat-message-information", inputs: ["closeIconURL", "message", "title", "template", "bubbleView", "subtitleView", "listItemView", "receiptDatePattern", "onError", "messageInformationStyle", "readIcon", "deliveredIcon", "onClose", "listItemStyle", "emptyStateText", "errorStateText", "emptyStateView", "loadingIconURL", "loadingStateView", "errorStateView"] }], directives: [{ type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i5.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageListComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-list", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20%' : '13%'}\">\n    <cometchat-button [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"message?.message\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboardDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEVBU0wsU0FBUyxFQUNULFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsV0FBVyxFQUdYLGVBQWUsRUFDZixhQUFhLEVBRWIsU0FBUyxFQUVULGFBQWEsRUFHYixVQUFVLEVBQ1YsVUFBVSxFQUNWLGFBQWEsRUFHYixjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixpQkFBaUIsR0FDbEIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQ0wsYUFBYSxFQUNiLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsOEJBQThCLEVBQzlCLGdDQUFnQyxFQUNoQyxxQkFBcUIsRUFDckIsYUFBYSxFQUNiLHFCQUFxQixFQUNyQixlQUFlLEVBRWYsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQiwrQkFBK0IsRUFDL0IsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQiwyQkFBMkIsRUFDM0IsdUJBQXVCLEVBRXZCLG9CQUFvQixFQUVwQixxQkFBcUIsRUFFckIsNEJBQTRCLEVBQzVCLGNBQWMsRUFDZCx5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLGlC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Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLDJCQUEyQjtzQkFBbkMsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLHNCQUFzQjtzQkFBOUIsS0FBSztnQkFDRyxzQkFBc0I7c0JBQTlCLEtBQUs7Z0JBRUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBS0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUdHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQUlHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFLRyxPQUFPO3NCQUFmLEtBQUs7Z0JBS0csK0JBQStCO3NCQUF2QyxLQUFLO2dCQUVHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBbU5HLGNBQWM7c0JBQXRCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBcHBsaWNhdGlvblJlZixcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIFF1ZXJ5TGlzdCxcbiAgUmVuZGVyZXIyLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3Q2hpbGRyZW4sXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgQmFja2Ryb3BTdHlsZSxcbiAgQmFzZVN0eWxlLFxuICBDYWxsc2NyZWVuU3R5bGUsXG4gIENoZWNrYm94U3R5bGUsXG4gIENvbmZpcm1EaWFsb2dTdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBEb2N1bWVudEJ1YmJsZVN0eWxlLFxuICBEcm9wZG93blN0eWxlLFxuICBFbW9qaUtleWJvYXJkU3R5bGUsXG4gIEZ1bGxTY3JlZW5WaWV3ZXJTdHlsZSxcbiAgSW5wdXRTdHlsZSxcbiAgTGFiZWxTdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbiAgTWVudUxpc3RTdHlsZSxcbiAgUGFuZWxTdHlsZSxcbiAgUXVpY2tWaWV3U3R5bGUsXG4gIFJhZGlvQnV0dG9uU3R5bGUsXG4gIFJlY2VpcHRTdHlsZSxcbiAgU2luZ2xlU2VsZWN0U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQge1xuICBDYWxlbmRhclN0eWxlLFxuICBDYWxsaW5nRGV0YWlsc1V0aWxzLFxuICBDYXJkQnViYmxlU3R5bGUsXG4gIENvbGxhYm9yYXRpdmVEb2N1bWVudENvbnN0YW50cyxcbiAgQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmRDb25zdGFudHMsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbiAgVGltZVNsb3RTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBGb3JtQnViYmxlU3R5bGUsXG4gIEltYWdlTW9kZXJhdGlvblN0eWxlLFxuICBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscyxcbiAgTGlua1ByZXZpZXdDb25zdGFudHMsXG4gIE1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24sXG4gIE1lc3NhZ2VMaXN0U3R5bGUsXG4gIE1lc3NhZ2VSZWNlaXB0VXRpbHMsXG4gIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cyxcbiAgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUsXG4gIFBvbGxzQnViYmxlU3R5bGUsXG4gIFNjaGVkdWxlckJ1YmJsZVN0eWxlLFxuICBTbWFydFJlcGxpZXNDb25maWd1cmF0aW9uLFxuICBTbWFydFJlcGxpZXNDb25zdGFudHMsXG4gIFNtYXJ0UmVwbGllc1N0eWxlLFxuICBUaHVtYm5haWxHZW5lcmF0aW9uQ29uc3RhbnRzLFxuICBSZWFjdGlvbnNTdHlsZSxcbiAgUmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbixcbiAgUmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbixcbiAgUmVhY3Rpb25MaXN0U3R5bGUsXG4gIFJlYWN0aW9uSW5mb1N0eWxlLFxuICBSZWFjdGlvbnNDb25maWd1cmF0aW9uLFxuICBVc2VyTWVudGlvblN0eWxlLFxuICBDb21ldENoYXRVcmxzRm9ybWF0dGVyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBVcmxGb3JtYXR0ZXJTdHlsZSxcbiAgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lcixcbiAgU3RvcmFnZVV0aWxzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIENhcmRNZXNzYWdlLFxuICBDb21ldENoYXRDYWxsRXZlbnRzLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbixcbiAgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlLFxuICBDb21ldENoYXRUaGVtZSxcbiAgQ29tZXRDaGF0VUlFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gIERhdGVQYXR0ZXJucyxcbiAgRG9jdW1lbnRJY29uQWxpZ25tZW50LFxuICBGb3JtTWVzc2FnZSxcbiAgSUdyb3VwTGVmdCxcbiAgSUdyb3VwTWVtYmVyQWRkZWQsXG4gIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCxcbiAgSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLFxuICBJTWVzc2FnZXMsXG4gIElQYW5lbCxcbiAgTWVzc2FnZUJ1YmJsZUFsaWdubWVudCxcbiAgTWVzc2FnZUxpc3RBbGlnbm1lbnQsXG4gIE1lc3NhZ2VTdGF0dXMsXG4gIFBsYWNlbWVudCxcbiAgU2NoZWR1bGVyTWVzc2FnZSxcbiAgU3RhdGVzLFxuICBUaW1lc3RhbXBBbGlnbm1lbnQsXG4gIGZvbnRIZWxwZXIsXG4gIGxvY2FsaXplLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFVJS2l0Q2FsbHMsXG4gIExpbmtQcmV2aWV3U3R5bGUsXG4gIFN0aWNrZXJzQ29uc3RhbnRzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdCB9IGZyb20gXCIuLi8uLi9TaGFyZWQvQ29tZXRDaGF0VUlraXQvQ29tZXRDaGF0VUlLaXRcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiwgaXNFbXB0eSB9IGZyb20gXCJyeGpzXCI7XG5cbi8qKlxuICpcbiAqIENvbWV0Q2hhdE1lc3NhZ2VMaXN0IGlzIGEgd3JhcHBlciBjb21wb25lbnQgZm9yIG1lc3NhZ2VCdWJibGVcbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtbWVzc2FnZS1saXN0XCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VMaXN0Q29tcG9uZW50XG4gIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XG4gIEBWaWV3Q2hpbGQoXCJsaXN0U2Nyb2xsXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBsaXN0U2Nyb2xsITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImJvdHRvbVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYm90dG9tITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInRvcFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgdG9wITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInRleHRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHRleHRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwidGhyZWFkTWVzc2FnZUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgdGhyZWFkTWVzc2FnZUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJmaWxlQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBmaWxlQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImF1ZGlvQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBhdWRpb0J1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJ2aWRlb0J1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgdmlkZW9CdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiaW1hZ2VCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGltYWdlQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImZvcm1CdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGZvcm1CdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiY2FyZEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgY2FyZEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJzdGlja2VyQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBzdGlja2VyQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImRvY3VtZW50QnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBkb2N1bWVudEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJ3aGl0ZWJvYXJkQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICB3aGl0ZWJvYXJkQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInBvcG92ZXJSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHBvcG92ZXJSZWYhOiBhbnk7XG4gIEBWaWV3Q2hpbGQoXCJkaXJlY3RDYWxsaW5nXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBkaXJlY3RDYWxsaW5nITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInNjaGVkdWxlckJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgc2NoZWR1bGVyQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInBvbGxCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHBvbGxCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkcmVuKFwibWVzc2FnZUJ1YmJsZVJlZlwiKSBtZXNzYWdlQnViYmxlUmVmITogUXVlcnlMaXN0PEVsZW1lbnRSZWY+O1xuXG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBoaWRlRGF0ZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWRcbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjE2IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAnaGlkZVJlY2VpcHQnLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgICovXG4gIEBJbnB1dCgpIGRpc2FibGVSZWNlaXB0OiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGhpZGVSZWNlaXB0OiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvck1lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGN1c3RvbVNvdW5kRm9yTWVzc2FnZXM6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIHJlYWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXJlYWQuc3ZnXCI7XG4gIEBJbnB1dCgpIGRlbGl2ZXJlZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtZGVsaXZlcmVkLnN2Z1wiO1xuICBASW5wdXQoKSBzZW50SWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1zZW50LnN2Z1wiO1xuICBASW5wdXQoKSB3YWl0SWNvbjogc3RyaW5nID0gXCJhc3NldHMvd2FpdC5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JJY29uOiBzdHJpbmcgPSBcImFzc2V0cy93YXJuaW5nLXNtYWxsLnN2Z1wiO1xuICBASW5wdXQoKSBhaUVycm9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvYWktZXJyb3Iuc3ZnXCI7XG4gIEBJbnB1dCgpIGFpRW1wdHlJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9haS1lbXB0eS5zdmdcIjtcbiAgQElucHV0KCkgYWxpZ25tZW50OiBNZXNzYWdlTGlzdEFsaWdubWVudCA9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkO1xuICBASW5wdXQoKSBzaG93QXZhdGFyOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy50aW1lO1xuICBASW5wdXQoKSB0aW1lc3RhbXBBbGlnbm1lbnQ6IFRpbWVzdGFtcEFsaWdubWVudCA9IFRpbWVzdGFtcEFsaWdubWVudC5ib3R0b207XG4gIEBJbnB1dCgpIERhdGVTZXBhcmF0b3JQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIHRlbXBsYXRlczogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlW10gPSBbXTtcbiAgQElucHV0KCkgbWVzc2FnZXNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBuZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRocmVzaG9sZFZhbHVlOiBudW1iZXIgPSAxMDAwO1xuICBASW5wdXQoKSB1bnJlYWRNZXNzYWdlVGhyZXNob2xkOiBudW1iZXIgPSAzMDtcbiAgQElucHV0KCkgcmVhY3Rpb25zQ29uZmlndXJhdGlvbjogUmVhY3Rpb25zQ29uZmlndXJhdGlvbiA9XG4gICAgbmV3IFJlYWN0aW9uc0NvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBkaXNhYmxlUmVhY3Rpb25zOiBCb29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGVtb2ppS2V5Ym9hcmRTdHlsZTogRW1vamlLZXlib2FyZFN0eWxlID0ge307XG4gIEBJbnB1dCgpIGFwaUNvbmZpZ3VyYXRpb24/OiAoXG4gICAgdXNlcj86IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwXG4gICkgPT4gUHJvbWlzZTxPYmplY3Q+O1xuXG4gIEBJbnB1dCgpIG9uVGhyZWFkUmVwbGllc0NsaWNrITpcbiAgICB8ICgobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+KSA9PiB2b2lkKVxuICAgIHwgbnVsbDtcbiAgQElucHV0KCkgaGVhZGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGZvb3RlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBwYXJlbnRNZXNzYWdlSWQhOiBudW1iZXI7XG4gIEBJbnB1dCgpIHRocmVhZEluZGljYXRvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3RocmVhZEluZGljYXRvckljb24uc3ZnXCI7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHtcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICB9O1xuICBASW5wdXQoKSBiYWNrZHJvcFN0eWxlOiBCYWNrZHJvcFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiYSgwLCAwLCAwLCAwLjUpXCIsXG4gICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgfTtcbiAgQElucHV0KCkgZGF0ZVNlcGFyYXRvclN0eWxlOiBEYXRlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIHdpZHRoOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBtZXNzYWdlTGlzdFN0eWxlOiBNZXNzYWdlTGlzdFN0eWxlID0ge1xuICAgIG5hbWVUZXh0Rm9udDogXCI0MDAgMTFweCBJbnRlclwiLFxuICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICAgIGVycm9yU3RhdGVUZXh0Rm9udDogXCI3MDAgMjJweCBJbnRlclwiLFxuICB9O1xuICBASW5wdXQoKSBvbkVycm9yOiAoKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkKSB8IG51bGwgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuICBASW5wdXQoKSBtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uOiBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uID1cbiAgICBuZXcgTWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbih7fSk7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIG9wdGlvbnNTdHlsZTogTWVudUxpc3RTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgbW9yZUljb25UaW50OiBcImdyZXlcIixcbiAgfTtcbiAgcmVjZWlwdFN0eWxlOiBSZWNlaXB0U3R5bGUgPSB7fTtcbiAgZG9jdW1lbnRCdWJibGVBbGlnbm1lbnQ6IERvY3VtZW50SWNvbkFsaWdubWVudCA9IERvY3VtZW50SWNvbkFsaWdubWVudC5yaWdodDtcbiAgY2FsbEJ1YmJsZUFsaWdubWVudDogRG9jdW1lbnRJY29uQWxpZ25tZW50ID0gRG9jdW1lbnRJY29uQWxpZ25tZW50LmxlZnQ7XG4gIGltYWdlTW9kZXJhdGlvblN0eWxlOiBJbWFnZU1vZGVyYXRpb25TdHlsZSA9IHt9O1xuICB0aW1lc3RhbXBFbnVtOiB0eXBlb2YgVGltZXN0YW1wQWxpZ25tZW50ID0gVGltZXN0YW1wQWxpZ25tZW50O1xuICBwdWJsaWMgY2hhdENoYW5nZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICBzdGFydGVyRXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBzdGFydGVyRW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIHN0YXJ0ZXJMb2FkaW5nU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdFTkVSQVRJTkdfSUNFQlJFQUtFUlNcIik7XG4gIHN1bW1hcnlFcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIHN1bW1hcnlFbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgc3VtbWFyeUxvYWRpbmdTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiR0VORVJBVElOR19TVU1NQVJZXCIpO1xuICAvLyBwdWJsaWMgcHJvcGVydGllc1xuICBwdWJsaWMgcmVxdWVzdEJ1aWxkZXI6IGFueTtcbiAgcHVibGljIGNsb3NlSW1hZ2VNb2RlcmF0aW9uOiBhbnk7XG4gIHB1YmxpYyB0aW1lU3RhbXBDb2xvcjogc3RyaW5nID0gXCJcIjtcbiAgcHVibGljIHRpbWVTdGFtcEZvbnQ6IHN0cmluZyA9IFwiXCI7XG4gIHNtYXJ0UmVwbHlTdHlsZTogU21hcnRSZXBsaWVzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcbiAgY29udmVyc2F0aW9uU3RhcnRlclN0eWxlOiBTbWFydFJlcGxpZXNTdHlsZSA9IHt9O1xuICBjb252ZXJzYXRpb25TdW1tYXJ5U3R5bGU6IFBhbmVsU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBjbG9zZUljb25UaW50OiBcIlwiLFxuICAgIGJveFNoYWRvdzogXCJcIixcbiAgICB0ZXh0Rm9udDogXCJcIixcbiAgICB0ZXh0Q29sb3I6IFwiXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgfTtcblxuICBwdWJsaWMgc2hvd1NtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHNob3dDb252ZXJzYXRpb25TdGFydGVyOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdGFydGVyU3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXM6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBlbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzaG93Q29udmVyc2F0aW9uU3VtbWFyeTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIGNvbnZlcnNhdGlvblN1bW1hcnk6IHN0cmluZ1tdID0gW107XG4gIHB1YmxpYyBnZXRVbnJlYWRDb3VudDogYW55ID0gMDtcblxuICBjY0hpZGVQYW5lbCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NTaG93UGFuZWwhOiBTdWJzY3JpcHRpb247XG4gIHNtYXJ0UmVwbHlNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVuYWJsZVNtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc21hcnRSZXBseUNvbmZpZyE6IFNtYXJ0UmVwbGllc0NvbmZpZ3VyYXRpb247XG4gIHB1YmxpYyB0aW1lU3RhbXBCYWNrZ3JvdW5kOiBzdHJpbmcgPSBcIlwiO1xuICBsaW5rUHJldmlld1N0eWxlOiBMaW5rUHJldmlld1N0eWxlID0ge307XG4gIHB1YmxpYyB1bnJlYWRNZXNzYWdlc1N0eWxlID0ge307XG4gIHB1YmxpYyBtb2RhbFN0eWxlID0ge1xuICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgIHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG4gICAgY2xvc2VJY29uVGludDogXCJibHVlXCIsXG4gIH07XG4gIHB1YmxpYyBkaXZpZGVyU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMXB4XCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwiZ3JleVwiLFxuICB9O1xuICBwb2xsQnViYmxlU3R5bGU6IFBvbGxzQnViYmxlU3R5bGUgPSB7fTtcbiAgbGFiZWxTdHlsZTogYW55ID0ge1xuICAgIHRleHRGb250OiBcIjQwMCAxMXB4IEludGVyXCIsXG4gICAgdGV4dENvbG9yOiBcImdyZXlcIixcbiAgfTtcbiAgaW1hZ2VCdWJibGVTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyMDBweFwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHggOHB4IDBweCAwcHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIG1lc3NhZ2VzTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbXTtcbiAgYnViYmxlRGF0ZVN0eWxlOiBEYXRlU3R5bGUgPSB7fTtcbiAgd2hpdGVib2FyZEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2NvbGxhYm9yYXRpdmV3aGl0ZWJvYXJkLnN2Z1wiO1xuICBkb2N1bWVudEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2NvbGxhYm9yYXRpdmVkb2N1bWVudC5zdmdcIjtcbiAgZGlyZWN0Q2FsbEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1ZpZGVvLWNhbGwyeC5zdmdcIjtcbiAgcGxhY2Vob2xkZXJJY29uVVJMOiBzdHJpbmcgPSBcIi9hc3NldHMvcGxhY2Vob2xkZXIucG5nXCI7XG4gIGRvd25sb2FkSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvZG93bmxvYWQuc3ZnXCI7XG4gIHRyYW5zbGF0aW9uU3R5bGU6IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlID0ge307XG4gIGRvY3VtZW50QnViYmxlU3R5bGU6IERvY3VtZW50QnViYmxlU3R5bGUgPSB7fTtcbiAgY2FsbEJ1YmJsZVN0eWxlOiBEb2N1bWVudEJ1YmJsZVN0eWxlID0ge307XG4gIHdoaXRlYm9hcmRUaXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJDT0xMQUJPUkFUSVZFX1dISVRFQk9BUkRcIik7XG4gIHdoaXRlYm9hcmRTdWJpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRSQVdfV0hJVEVCT0FSRF9UT0dFVEhFUlwiKTtcbiAgd2hpdGVib2FyZEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiT1BFTl9XSElURUJPQVJEXCIpO1xuICBkb2N1bWVudFRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNPTExBQk9SQVRJVkVfRE9DVU1FTlRcIik7XG4gIGRvY3VtZW50U3ViaXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJEUkFXX0RPQ1VNRU5UX1RPR0VUSEVSXCIpO1xuICBkb2N1bWVudEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiT1BFTl9ET0NVTUVOVFwiKTtcbiAgam9pbkNhbGxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkpPSU5cIik7XG4gIHRvcE9ic2VydmVyITogSW50ZXJzZWN0aW9uT2JzZXJ2ZXI7XG4gIGJvdHRvbU9ic2VydmVyITogSW50ZXJzZWN0aW9uT2JzZXJ2ZXI7XG4gIGxvY2FsaXplOiB0eXBlb2YgbG9jYWxpemUgPSBsb2NhbGl6ZTtcbiAgcmVpbml0aWFsaXplZDogYm9vbGVhbiA9IGZhbHNlO1xuICBhZGRSZWFjdGlvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2FkZHJlYWN0aW9uLnN2Z1wiO1xuICBNZXNzYWdlVHlwZXNDb25zdGFudDogdHlwZW9mIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcyA9XG4gICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzO1xuICBjYWxsQ29uc3RhbnQ6IHN0cmluZyA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsO1xuICBwdWJsaWMgdHlwZXNNYXA6IGFueSA9IHt9O1xuICBwdWJsaWMgbWVzc2FnZVR5cGVzTWFwOiBhbnkgPSB7fTtcbiAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lID0gbmV3IENvbWV0Q2hhdFRoZW1lKHt9KTtcbiAgcHVibGljIGdyb3VwTGlzdGVuZXJJZCA9IFwiZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgcHVibGljIHN0YXRlczogdHlwZW9mIFN0YXRlcyA9IFN0YXRlcztcbiAgTWVzc2FnZUNhdGVnb3J5ID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5O1xuICBwdWJsaWMgbnVtYmVyT2ZUb3BTY3JvbGw6IG51bWJlciA9IDA7XG4gIGtlZXBSZWNlbnRNZXNzYWdlczogYm9vbGVhbiA9IHRydWU7XG4gIG1lc3NhZ2VUZW1wbGF0ZTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlW10gPSBbXTtcbiAgcHVibGljIG9wZW5Db250YWN0c1ZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbWVzc2FnZUNvdW50ITogbnVtYmVyO1xuICBpc09uQm90dG9tOiBib29sZWFuID0gZmFsc2U7XG4gIFVucmVhZENvdW50OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFtdO1xuICBuZXdNZXNzYWdlQ291bnQ6IG51bWJlciB8IHN0cmluZyA9IDA7XG4gIHR5cGU6IHN0cmluZyA9IFwiXCI7XG4gIGNvbmZpcm1UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIllFU1wiKTtcbiAgY2FuY2VsVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT1wiKTtcbiAgd2FybmluZ1RleHQ6IHN0cmluZyA9IFwiQXJlIHlvdSBzdXJlIHdhbnQgdG8gc2VlIHVuc2FmZSBjb250ZW50P1wiO1xuICBjY01lc3NhZ2VEZWxldGUhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVJlYWN0ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VSZWFkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ITogU3Vic2NyaXB0aW9uO1xuICBjY0xpdmVSZWFjdGlvbiE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlU2VudCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVySm9pbmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyS2lja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITogU3Vic2NyaXB0aW9uO1xuICBjY093bmVyc2hpcENoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwQ3JlYXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPdXRnb2luZ0NhbGwhOiBTdWJzY3JpcHRpb247XG4gIGNjQ2FsbFJlamVjdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0NhbGxFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDYWxsQWNjZXB0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVGV4dE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlUmVhY3Rpb25BZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlUmVhY3Rpb25SZW1vdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25Gb3JtTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DYXJkTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lZGlhTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzRGVsaXZlcmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc1JlYWRCeUFsbCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHJhbnNpZW50TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkludGVyYWN0aW9uR29hbENvbXBsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgdGhyZWFkZWRBbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ7XG4gIG1lc3NhZ2VJbmZvQWxpZ25tZW50OiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5yaWdodDtcbiAgb3BlbkVtb2ppS2V5Ym9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAga2V5Ym9hcmRBbGlnbm1lbnQ6IHN0cmluZyA9IFBsYWNlbWVudC5yaWdodDtcbiAgcG9wb3ZlclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjMzMHB4XCIsXG4gICAgd2lkdGg6IFwiMzI1cHhcIixcbiAgfTtcbiAgdmlkZW9CdWJibGVTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMzBweFwiLFxuICAgIHdpZHRoOiBcIjIzMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICB0aHJlYWRWaWV3QWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICB3aGl0ZWJvYXJkVVJMOiBzdHJpbmcgfCBVUkwgfCB1bmRlZmluZWQ7XG4gIGVuYWJsZURhdGFNYXNraW5nOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVRodW1ibmFpbEdlbmVyYXRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlTGlua1ByZXZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlUG9sbHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlUmVhY3Rpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZUltYWdlTW9kZXJhdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVTdGlja2VyczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVXaGl0ZWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZURvY3VtZW50OiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dPbmdvaW5nQ2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVDYWxsaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIG9uZ29pbmdDYWxsU3R5bGU6IENhbGxzY3JlZW5TdHlsZSA9IHt9O1xuICBzZXNzaW9uSWQ6IHN0cmluZyA9IFwiXCI7XG4gIG9wZW5NZXNzYWdlSW5mb1BhZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbWVzc2FnZUluZm9PYmplY3QhOiBDb21ldENoYXQuQmFzZU1lc3NhZ2U7XG4gIGZpcnN0UmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gIGlzV2Vic29ja2V0UmVjb25uZWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGxhc3RNZXNzYWdlSWQ6IG51bWJlciA9IDA7XG4gIGlzQ29ubmVjdGlvblJlZXN0YWJsaXNoZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dEZvcm1hdHRlcnM/OiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPjtcblxuICBjbG9zZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIHRocmVhZE9wZW5JY29uOiBzdHJpbmcgPSBcImFzc2V0cy9zaWRlLWFycm93LnN2Z1wiO1xuICBjb25maXJtRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHt9O1xuICBwdWJsaWMgbWVzc2FnZVRvUmVhY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IG51bGwgPSBudWxsO1xuXG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHR5cGVzOiBzdHJpbmdbXSA9IFtdO1xuICBjYXRlZ29yaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBjYWxsYmFja3M6IE1hcDxzdHJpbmcsIChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdm9pZD4gPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHsgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgICAgdGhpcy5jaGF0Q2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgY2hhbmdlc1tDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJdIHx8XG4gICAgICAgIGNoYW5nZXNbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cF1cbiAgICAgICkge1xuICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtdO1xuICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gW107XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgdGhpcy5zaG93RW5hYmxlZEV4dGVuc2lvbnMoKTtcbiAgICAgICAgdGhpcy5udW1iZXJPZlRvcFNjcm9sbCA9IDA7XG4gICAgICAgIGlmICghdGhpcy5sb2dnZWRJblVzZXIpIHtcbiAgICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gW107XG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LmtleXModGhpcy51c2VyKS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB0aGlzLnVzZXI7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXI7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5nZXRVc2VyKHRoaXMudXNlcikudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyO1xuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLmdyb3VwKS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aGlzLmdyb3VwID0gdGhpcy5ncm91cDtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5nZXRHcm91cCh0aGlzLmdyb3VwKS50aGVuKChncm91cDogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuZ3JvdXAgPSBncm91cDtcbiAgICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgc2VuZE1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIHJlY2VpdmVySWQ6IHN0cmluZyxcbiAgICByZWNlaXZlclR5cGU6IHN0cmluZ1xuICApIHtcbiAgICBpZiAobWVzc2FnZS5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQpIHtcbiAgICAgIGNvbnN0IG5ld01lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0LlRleHRNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICAobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldFRleHQoKSxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQ29tZXRDaGF0VUlLaXQuc2VuZFRleHRNZXNzYWdlKG5ld01lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gKG1lc3NhZ2UgYXMgYW55KT8uZGF0YT8uYXR0YWNobWVudHNbMF07XG4gICAgICBjb25zdCBuZXdNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIG1lc3NhZ2UuZ2V0VHlwZSgpLFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG4gICAgICBsZXQgYXR0YWNobWVudCA9IG5ldyBDb21ldENoYXQuQXR0YWNobWVudCh1cGxvYWRlZEZpbGUpO1xuICAgICAgbmV3TWVzc2FnZS5zZXRBdHRhY2htZW50KGF0dGFjaG1lbnQpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQ29tZXRDaGF0VUlLaXQuc2VuZE1lZGlhTWVzc2FnZShuZXdNZXNzYWdlIGFzIENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjbG9zZUNvbnRhY3RzUGFnZSA9ICgpID0+IHtcbiAgICB0aGlzLm9wZW5Db250YWN0c1ZpZXcgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGFkZFJlYWN0aW9uID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgZW1vamkgPSBldmVudD8uZGV0YWlsPy5pZDtcbiAgICB0aGlzLnBvcG92ZXJSZWYubmF0aXZlRWxlbWVudC5vcGVuQ29udGVudFZpZXcoZXZlbnQpO1xuICAgIGlmICh0aGlzLm1lc3NhZ2VUb1JlYWN0KSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKGVtb2ppLCB0aGlzLm1lc3NhZ2VUb1JlYWN0KTtcbiAgICB9XG4gIH07XG4gIGdldENhbGxCdWJibGVUaXRsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBpZiAoXG4gICAgICAhbWVzc2FnZS5nZXRTZW5kZXIoKSB8fFxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIGxvY2FsaXplKFwiWU9VX0lOSVRJQVRFRF9HUk9VUF9DQUxMXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYCR7bWVzc2FnZS5nZXRTZW5kZXIoKS5nZXROYW1lKCl9ICAke2xvY2FsaXplKFxuICAgICAgICBcIklOSVRJQVRFRF9HUk9VUF9DQUxMXCJcbiAgICAgICl9YDtcbiAgICB9XG4gIH1cbiAgZ2V0Q2FsbEFjdGlvbk1lc3NhZ2UgPSAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICByZXR1cm4gQ2FsbGluZ0RldGFpbHNVdGlscy5nZXRDYWxsU3RhdHVzKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyKTtcbiAgfTtcbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcblxuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRyeSB7XG4gICAgICAvL1JlbW92aW5nIE1lc3NhZ2UgTGlzdGVuZXJzXG4gICAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlQ2FsbExpc3RlbmVyKHRoaXMuY2FsbExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKVxuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWRUb0FsbD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWRCeUFsbD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFJlYWN0aW9uc1N0eWxlIG9iamVjdCB3aXRoIHRoZSBkZWZpbmVkIG9yIGRlZmF1bHQgc3R5bGVzLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UmVhY3Rpb25zU3R5bGV9IFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgUmVhY3Rpb25zU3R5bGUgd2l0aCB0aGUgc2V0IG9yIGRlZmF1bHQgc3R5bGVzLlxuICAgKi9cbiAgZ2V0UmVhY3Rpb25zU3R5bGUoKSB7XG4gICAgY29uc3QgcmVhY3Rpb25zU3R5bGUgPSB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uc1N0eWxlIHx8IHt9O1xuICAgIHJldHVybiBuZXcgUmVhY3Rpb25zU3R5bGUoe1xuICAgICAgaGVpZ2h0OiByZWFjdGlvbnNTdHlsZT8uaGVpZ2h0IHx8IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiByZWFjdGlvbnNTdHlsZT8ud2lkdGggfHwgXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyOiByZWFjdGlvbnNTdHlsZT8uYm9yZGVyIHx8IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiByZWFjdGlvbnNTdHlsZT8uYm9yZGVyUmFkaXVzIHx8IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogcmVhY3Rpb25zU3R5bGU/LmJhY2tncm91bmQgfHwgXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYWN0aXZlUmVhY3Rpb25CYWNrZ3JvdW5kOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25CYWNrZ3JvdW5kIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeTE1MCgpLFxuICAgICAgcmVhY3Rpb25CYWNrZ3JvdW5kOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25CYWNrZ3JvdW5kIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgcmVhY3Rpb25Cb3JkZXI6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJvcmRlciB8fFxuICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYWN0aXZlUmVhY3Rpb25Cb3JkZXI6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkJvcmRlciB8fFxuICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5NTAwKCl9YCxcbiAgICAgIHJlYWN0aW9uQm9yZGVyUmFkaXVzOiByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Cb3JkZXJSYWRpdXMgfHwgXCIxMnB4XCIsXG4gICAgICBhY3RpdmVSZWFjdGlvbkNvdW50VGV4dENvbG9yOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25Db3VudFRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlUmVhY3Rpb25Db3VudFRleHRGb250OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25Db3VudFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZWFjdGlvbkNvdW50VGV4dEZvbnQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkNvdW50VGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlYWN0aW9uQ291bnRUZXh0Q29sb3I6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkNvdW50VGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICByZWFjdGlvbkJveFNoYWRvdzpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQm94U2hhZG93IHx8IFwicmdiYSgwLCAwLCAwLCAwLjEpIDBweCA0cHggMTJweFwiLFxuICAgICAgcmVhY3Rpb25FbW9qaUZvbnQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkVtb2ppRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICB9KTtcbiAgfVxuICBpc01vYmlsZVZpZXcgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIDw9IDc2ODtcbiAgfTtcbiAgZ2V0QnViYmxlQnlJZChpZDogc3RyaW5nKTogRWxlbWVudFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IHRhcmdldEJ1YmJsZTogRWxlbWVudFJlZiB8IHVuZGVmaW5lZDtcbiAgICB0aGlzLm1lc3NhZ2VCdWJibGVSZWYuZm9yRWFjaCgoYnViYmxlOiBFbGVtZW50UmVmKSA9PiB7XG4gICAgICBpZiAoYnViYmxlLm5hdGl2ZUVsZW1lbnQuaWQgPT09IGlkKVxuICAgICAgICB0YXJnZXRCdWJibGUgPSBidWJibGU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0QnViYmxlO1xuICB9XG4gIHNob3dFbW9qaUtleWJvYXJkID0gKGlkOiBudW1iZXIsIGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgZmFsc2UgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICBpZiAobWVzc2FnZSkge1xuICAgICAgdGhpcy5tZXNzYWdlVG9SZWFjdCA9IG1lc3NhZ2U7XG4gICAgICBpZiAodGhpcy5pc01vYmlsZVZpZXcoKSkge1xuICAgICAgICBsZXQgYnViYmxlUmVmID0gdGhpcy5nZXRCdWJibGVCeUlkKFN0cmluZyhpZCkpXG4gICAgICAgIGlmIChidWJibGVSZWYpIHtcbiAgICAgICAgICBjb25zdCByZWN0ID0gYnViYmxlUmVmLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgY29uc3QgaXNBdFRvcCA9IHJlY3QudG9wIDwgaW5uZXJIZWlnaHQgLyAyO1xuICAgICAgICAgIGNvbnN0IGlzQXRCb3R0b20gPSByZWN0LmJvdHRvbSA+IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG4gICAgICAgICAgaWYgKGlzQXRUb3ApIHtcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRBbGlnbm1lbnQgPSBQbGFjZW1lbnQuYm90dG9tO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNBdEJvdHRvbSkge1xuICAgICAgICAgICAgdGhpcy5rZXlib2FyZEFsaWdubWVudCA9IFBsYWNlbWVudC50b3A7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5rZXlib2FyZEFsaWdubWVudCA9XG4gICAgICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICA/IFBsYWNlbWVudC5sZWZ0XG4gICAgICAgICAgICA6IFBsYWNlbWVudC5yaWdodDtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHRoaXMucG9wb3ZlclJlZi5uYXRpdmVFbGVtZW50Lm9wZW5Db250ZW50VmlldyhldmVudCk7XG4gICAgfVxuICB9O1xuICBzZXRCdWJibGVWaWV3ID0gKCkgPT4ge1xuICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlLmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSkgPT4ge1xuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbZWxlbWVudC5jYXRlZ29yeSsnXycrZWxlbWVudC50eXBlXSA9IGVsZW1lbnQ7ICAgICAgXG4gICAgfSk7XG4gIH07XG4gIG9wZW5UaHJlYWRWaWV3ID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGlmICh0aGlzLm9uVGhyZWFkUmVwbGllc0NsaWNrKSB7XG4gICAgICB0aGlzLm9uVGhyZWFkUmVwbGllc0NsaWNrKG1lc3NhZ2UsIHRoaXMudGhyZWFkTWVzc2FnZUJ1YmJsZSk7XG4gICAgfVxuICB9O1xuICB0aHJlYWRDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub3BlblRocmVhZFZpZXcobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIGRlbGV0ZUNhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5kZWxldGVNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBlZGl0Q2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLm9uRWRpdE1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIGNvcHlDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub25Db3B5TWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgbWVzc2FnZVByaXZhdGVseUNhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5zZW5kTWVzc2FnZVByaXZhdGVseShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgbWVzc2FnZUluZm9DYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub3Blbk1lc3NhZ2VJbmZvKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBvcGVuTWVzc2FnZUluZm8obWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdGhpcy5vcGVuTWVzc2FnZUluZm9QYWdlID0gdHJ1ZTtcbiAgICB0aGlzLm1lc3NhZ2VJbmZvT2JqZWN0ID0gbWVzc2FnZU9iamVjdDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgY2xvc2VNZXNzYWdlSW5mb1BhZ2UgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuTWVzc2FnZUluZm9QYWdlID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBzZW5kTWVzc2FnZVByaXZhdGVseShtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBDb21ldENoYXRVSUV2ZW50cy5jY09wZW5DaGF0Lm5leHQoeyB1c2VyOiBtZXNzYWdlT2JqZWN0LmdldFNlbmRlcigpIH0pO1xuICB9XG4gIGdldE1lc3NhZ2VCeUlkKGlkOiBudW1iZXIgfCBzdHJpbmcpIHtcbiAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleCgobSkgPT4gbS5nZXRJZCgpID09IGlkKTtcbiAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgaXNUcmFuc2xhdGVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk6IGFueSB7XG4gICAgbGV0IHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0OiBhbnkgPSBtZXNzYWdlO1xuICAgIGlmIChcbiAgICAgIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0ICYmXG4gICAgICB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdD8uZGF0YT8ubWV0YWRhdGEgJiZcbiAgICAgIHRyYW5zbGF0ZWRNZXNzYWdlT2JqZWN0Py5kYXRhPy5tZXRhZGF0YVtcbiAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy50cmFuc2xhdGVkX21lc3NhZ2VcbiAgICAgIF1cbiAgICApIHtcbiAgICAgIHJldHVybiB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdC5kYXRhLm1ldGFkYXRhW1xuICAgICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudHJhbnNsYXRlZF9tZXNzYWdlXG4gICAgICBdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgdXBkYXRlVHJhbnNsYXRlZE1lc3NhZ2UgPSAodHJhbnNsYXRpb246IGFueSkgPT4ge1xuICAgIHZhciByZWNlaXZlZE1lc3NhZ2UgPSB0cmFuc2xhdGlvbjtcbiAgICB2YXIgdHJhbnNsYXRlZFRleHQgPSByZWNlaXZlZE1lc3NhZ2UudHJhbnNsYXRpb25zWzBdLm1lc3NhZ2VfdHJhbnNsYXRlZDtcbiAgICBsZXQgbWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICBsZXQgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IHJlY2VpdmVkTWVzc2FnZS5tc2dJZFxuICAgICk7XG4gICAgbGV0IGRhdGE6IGFueTtcbiAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICB2YXIgbWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUtleV07XG4gICAgICBpZiAoKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRNZXRhZGF0YSgpKSB7XG4gICAgICAgIGRhdGEgPSAobWVzc2FnZU9iaiBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldE1ldGFkYXRhKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAobWVzc2FnZU9iaiBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLnNldE1ldGFkYXRhKHt9KTtcbiAgICAgICAgZGF0YSA9IChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0TWV0YWRhdGEoKTtcbiAgICAgIH1cbiAgICAgIGRhdGFbTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnRyYW5zbGF0ZWRfbWVzc2FnZV0gPSB0cmFuc2xhdGVkVGV4dDtcbiAgICAgIHZhciBuZXdNZXNzYWdlT2JqOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgfCBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPVxuICAgICAgICBtZXNzYWdlT2JqO1xuICAgICAgbWVzc2FnZUxpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG5ld01lc3NhZ2VPYmopO1xuICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZUxpc3RdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcbiAgdHJhbnNsYXRlTWVzc2FnZSA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IGZhbHNlID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgIENvbWV0Q2hhdC5jYWxsRXh0ZW5zaW9uKFxuICAgICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMubWVzc2FnZV90cmFuc2xhdGlvbixcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnBvc3QsXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy52Ml90cmFuc2xhdGUsXG4gICAgICAgIHtcbiAgICAgICAgICBtc2dJZDogbWVzc2FnZS5nZXRJZCgpLFxuICAgICAgICAgIHRleHQ6IChtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0VGV4dCgpLFxuICAgICAgICAgIGxhbmd1YWdlczogbmF2aWdhdG9yLmxhbmd1YWdlcyxcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgICAudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICByZXN1bHQ/LnRyYW5zbGF0aW9uc1swXT8ubWVzc2FnZV90cmFuc2xhdGVkICE9XG4gICAgICAgICAgICAobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpPy5nZXRUZXh0KClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVHJhbnNsYXRlZE1lc3NhZ2UocmVzdWx0KTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZXN1bHQgb2YgdHJhbnNsYXRpb25zXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHsgfSk7XG4gICAgfVxuICB9O1xuICBzZXRPcHRpb25zQ2FsbGJhY2sob3B0aW9uczogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdLCBpZDogbnVtYmVyKSB7XG4gICAgb3B0aW9ucz8uZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbikgPT4ge1xuICAgICAgc3dpdGNoIChlbGVtZW50LmlkKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5kZWxldGVNZXNzYWdlOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLmRlbGV0ZUNhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLmVkaXRNZXNzYWdlOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLmVkaXRDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi50cmFuc2xhdGVNZXNzYWdlOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLnRyYW5zbGF0ZU1lc3NhZ2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uY29weU1lc3NhZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuY29weUNhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlYWN0VG9NZXNzYWdlOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrIHx8ICEoZWxlbWVudCBhcyBhbnkpLmN1c3RvbVZpZXcpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVwbHlJblRocmVhZDpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy50aHJlYWRDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5zZW5kTWVzc2FnZVByaXZhdGVseTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5tZXNzYWdlUHJpdmF0ZWx5Q2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ubWVzc2FnZUluZm9ybWF0aW9uOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm1lc3NhZ2VJbmZvQ2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG4gIC8qKlxuICAgKiBzZW5kIG1lc3NhZ2Ugb3B0aW9ucyBiYXNlZCBvbiB0eXBlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbXNnT2JqZWN0XG4gICAqL1xuICBzZXRNZXNzYWdlT3B0aW9ucyhcbiAgICBtc2dPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10ge1xuICAgIGxldCBvcHRpb25zITogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdO1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZS5sZW5ndGggPiAwICYmXG4gICAgICAhbXNnT2JqZWN0Py5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbXNnT2JqZWN0Py5nZXRUeXBlKCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyXG4gICAgKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZS5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUpID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1zZ09iamVjdD8uZ2V0SWQoKSAmJlxuICAgICAgICAgIGVsZW1lbnQudHlwZSA9PSBtc2dPYmplY3Q/LmdldFR5cGUoKSAmJlxuICAgICAgICAgIGVsZW1lbnQ/Lm9wdGlvbnNcbiAgICAgICAgKSB7XG4gICAgICAgICAgb3B0aW9ucyA9XG4gICAgICAgICAgICB0aGlzLnNldE9wdGlvbnNDYWxsYmFjayhcbiAgICAgICAgICAgICAgZWxlbWVudD8ub3B0aW9ucyhcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcixcbiAgICAgICAgICAgICAgICBtc2dPYmplY3QsXG4gICAgICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICBtc2dPYmplY3Q/LmdldElkKClcbiAgICAgICAgICAgICkgfHwgW107XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zID0gW107XG4gICAgfVxuICAgIG9wdGlvbnMgPSB0aGlzLmZpbHRlckVtb2ppT3B0aW9ucyhvcHRpb25zKTtcbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuICAvKipcbiAgICogUmVhY3RzIHRvIGEgbWVzc2FnZSBieSBlaXRoZXIgYWRkaW5nIG9yIHJlbW92aW5nIHRoZSByZWFjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGVtb2ppIC0gVGhlIGVtb2ppIHVzZWQgZm9yIHRoZSByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGF0IHdhcyByZWFjdGVkIHRvLlxuICAgKi9cblxuICByZWFjdFRvTWVzc2FnZShlbW9qaTogc3RyaW5nLCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBtZXNzYWdlSWQgPSBtZXNzYWdlPy5nZXRJZCgpO1xuICAgIGNvbnN0IG1zZ09iamVjdCA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQobWVzc2FnZUlkKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2U7XG4gICAgY29uc3QgcmVhY3Rpb25zID0gbXNnT2JqZWN0Py5nZXRSZWFjdGlvbnMoKSB8fCBbXTtcbiAgICBjb25zdCBlbW9qaU9iamVjdCA9IHJlYWN0aW9ucz8uZmluZCgocmVhY3Rpb246IGFueSkgPT4ge1xuICAgICAgcmV0dXJuIHJlYWN0aW9uPy5yZWFjdGlvbiA9PSBlbW9qaTtcbiAgICB9KTtcbiAgICBpZiAoZW1vamlPYmplY3QgJiYgZW1vamlPYmplY3Q/LmdldFJlYWN0ZWRCeU1lKCkpIHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRSZWFjdGlvbnM6IGFueVtdID0gW107XG4gICAgICByZWFjdGlvbnMuZm9yRWFjaCgocmVhY3Rpb24pID0+IHtcbiAgICAgICAgaWYgKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpID09IGVtb2ppKSB7XG4gICAgICAgICAgaWYgKHJlYWN0aW9uPy5nZXRDb3VudCgpID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYWN0aW9uLnNldENvdW50KHJlYWN0aW9uPy5nZXRDb3VudCgpIC0gMSk7XG4gICAgICAgICAgICByZWFjdGlvbi5zZXRSZWFjdGVkQnlNZShmYWxzZSk7XG4gICAgICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG1zZ09iamVjdC5zZXRSZWFjdGlvbnModXBkYXRlZFJlYWN0aW9ucyk7XG4gICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTtcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVSZWFjdGlvbihtZXNzYWdlSWQsIGVtb2ppKVxuICAgICAgICAudGhlbigobWVzc2FnZSkgPT4geyB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgLy8gUmV0dXJuIG9sZCBtZXNzYWdlIG9iamVjdCBpbnN0ZWFkIG9mXG4gICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1zZ09iamVjdCk7IC8vbmVlZCBjaGFuZ2VzXG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgdXBkYXRlZFJlYWN0aW9ucyA9IFtdO1xuICAgICAgY29uc3QgcmVhY3Rpb25BdmFpbGFibGUgPSByZWFjdGlvbnMuZmluZCgocmVhY3Rpb24pID0+IHtcbiAgICAgICAgcmV0dXJuIHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpID09IGVtb2ppO1xuICAgICAgfSk7XG5cbiAgICAgIHJlYWN0aW9ucy5mb3JFYWNoKChyZWFjdGlvbikgPT4ge1xuICAgICAgICBpZiAocmVhY3Rpb24/LmdldFJlYWN0aW9uKCkgPT0gZW1vamkpIHtcbiAgICAgICAgICByZWFjdGlvbi5zZXRDb3VudChyZWFjdGlvbj8uZ2V0Q291bnQoKSArIDEpO1xuICAgICAgICAgIHJlYWN0aW9uLnNldFJlYWN0ZWRCeU1lKHRydWUpO1xuICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoIXJlYWN0aW9uQXZhaWxhYmxlKSB7XG4gICAgICAgIGNvbnN0IHJlYWN0OiBDb21ldENoYXQuUmVhY3Rpb25Db3VudCA9IG5ldyBDb21ldENoYXQuUmVhY3Rpb25Db3VudChcbiAgICAgICAgICBlbW9qaSxcbiAgICAgICAgICAxLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0KTtcbiAgICAgIH1cbiAgICAgIG1zZ09iamVjdC5zZXRSZWFjdGlvbnModXBkYXRlZFJlYWN0aW9ucyk7XG4gICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobXNnT2JqZWN0KTtcbiAgICAgIENvbWV0Q2hhdC5hZGRSZWFjdGlvbihtZXNzYWdlSWQsIGVtb2ppKVxuICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4geyB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1zZ09iamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogRmlsdGVycyBvdXQgdGhlICdhZGQgcmVhY3Rpb24nIG9wdGlvbiBpZiByZWFjdGlvbnMgYXJlIGRpc2FibGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXX0gb3B0aW9ucyAtIFRoZSBvcmlnaW5hbCBzZXQgb2YgbWVzc2FnZSBvcHRpb25zLlxuICAgKiBAcmV0dXJucyB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbltdfSBUaGUgZmlsdGVyZWQgc2V0IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAgICovXG5cbiAgZmlsdGVyRW1vamlPcHRpb25zID0gKG9wdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSkgPT4ge1xuICAgIGlmICghdGhpcy5kaXNhYmxlUmVhY3Rpb25zKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucy5maWx0ZXIoKG9wdGlvbjogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbikgPT4ge1xuICAgICAgcmV0dXJuIG9wdGlvbi5pZCAhPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5yZWFjdFRvTWVzc2FnZTtcbiAgICB9KTtcbiAgfTtcbiAgZ2V0Q2xvbmVkUmVhY3Rpb25PYmplY3QobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShtZXNzYWdlKTtcbiAgfVxuICAvKipcbiAgICogcGFzc2luZyBzdHlsZSBiYXNlZCBvbiBtZXNzYWdlIG9iamVjdFxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VPYmplY3RcbiAgICovXG4gIHNldE1lc3NhZ2VCdWJibGVTdHlsZShtc2c6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IEJhc2VTdHlsZSB7XG4gICAgbGV0IHN0eWxlITogQmFzZVN0eWxlO1xuICAgIGlmIChtc2c/LmdldERlbGV0ZWRBdCgpKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXI6IGAxcHggZGFzaGVkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX1gLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbXNnPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMubWVldGluZyAmJlxuICAgICAgKCFtc2c/LmdldFNlbmRlcigpIHx8XG4gICAgICAgIG1zZz8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKCkpXG4gICAgKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgfTtcbiAgICAgIC8vIH0gZWxzZSBpZiAodGhpcy5nZXRMaW5rUHJldmlldyhtc2cgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKSkge1xuICAgICAgLy8gICBzdHlsZSA9IHtcbiAgICAgIC8vICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAvLyAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIC8vICAgfTtcbiAgICB9IGVsc2UgaWYgKG1zZz8uZ2V0VHlwZSgpID09IFN0aWNrZXJzQ29uc3RhbnRzLnN0aWNrZXIpIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAhbXNnPy5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtc2c/LmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCAmJlxuICAgICAgKCFtc2c/LmdldFNlbmRlcigpIHx8XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PSBtc2c/LmdldFNlbmRlcigpLmdldFVpZCgpKVxuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6XG4gICAgICAgICAgdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdFxuICAgICAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpXG4gICAgICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgIW1zZz8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSAmJlxuICAgICAgbXNnPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbXNnPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyIHx8XG4gICAgICBtc2c/LmdldENhdGVnb3J5KCkgPT0gdGhpcy5jYWxsQ29uc3RhbnRcbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCl9YCxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFtc2c/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2c/LmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcbiAgICAgICAgbXNnPy5nZXRTZW5kZXIoKSAmJlxuICAgICAgICBtc2c/LmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpXG4gICAgICApIHtcbiAgICAgICAgc3R5bGUgPSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUgPSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R5bGU7XG4gIH1cbiAgZ2V0U2Vzc2lvbklkKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgbGV0IGRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0RGF0YSgpO1xuICAgIHJldHVybiBkYXRhPy5jdXN0b21EYXRhPy5zZXNzaW9uSUQ7XG4gIH1cbiAgZ2V0V2hpdGVib2FyZERvY3VtZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChtZXNzYWdlPy5nZXREYXRhKCkpIHtcbiAgICAgICAgdmFyIGRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0RGF0YSgpO1xuICAgICAgICBpZiAoZGF0YT8ubWV0YWRhdGEpIHtcbiAgICAgICAgICB2YXIgbWV0YWRhdGEgPSBkYXRhPy5tZXRhZGF0YTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgXCJAaW5qZWN0ZWRcIilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHZhciBpbmplY3RlZE9iamVjdCA9IG1ldGFkYXRhW1wiQGluamVjdGVkXCJdO1xuICAgICAgICAgICAgaWYgKGluamVjdGVkT2JqZWN0Py5leHRlbnNpb25zKSB7XG4gICAgICAgICAgICAgIHZhciBleHRlbnNpb25PYmplY3QgPSBpbmplY3RlZE9iamVjdC5leHRlbnNpb25zO1xuICAgICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9uT2JqZWN0W1xuICAgICAgICAgICAgICAgIENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkQ29uc3RhbnRzLndoaXRlYm9hcmRcbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgID8gZXh0ZW5zaW9uT2JqZWN0W0NvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkQ29uc3RhbnRzLndoaXRlYm9hcmRdXG4gICAgICAgICAgICAgICAgICAuYm9hcmRfdXJsXG4gICAgICAgICAgICAgICAgOiBleHRlbnNpb25PYmplY3RbQ29sbGFib3JhdGl2ZURvY3VtZW50Q29uc3RhbnRzLmRvY3VtZW50XVxuICAgICAgICAgICAgICAgICAgLmRvY3VtZW50X3VybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3BlbkxpbmtVUkwoZXZlbnQ6IGFueSkge1xuICAgIHdpbmRvdy5vcGVuKGV2ZW50Py5kZXRhaWw/LnVybCwgXCJfYmxhbmtcIik7XG4gIH1cbiAgZ2V0U3RpY2tlcihtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICBsZXQgc3RpY2tlckRhdGE6IGFueSA9IG51bGw7XG4gICAgICBpZiAoXG4gICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgU3RpY2tlcnNDb25zdGFudHMuZGF0YVxuICAgICAgICApICYmXG4gICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKS5nZXREYXRhKCksXG4gICAgICAgICAgU3RpY2tlcnNDb25zdGFudHMuY3VzdG9tX2RhdGFcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIHN0aWNrZXJEYXRhID0gKG1lc3NhZ2UgYXMgYW55KS5kYXRhLmN1c3RvbURhdGE7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICAgIHN0aWNrZXJEYXRhLFxuICAgICAgICAgICAgU3RpY2tlcnNDb25zdGFudHMuc3RpY2tlcl91cmxcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBzdGlja2VyRGF0YS5zdGlja2VyX3VybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdzdGF0dXNJbmZvVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cbiAgZ2V0Q29udGVudFZpZXcgPSAoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uY29udGVudFZpZXdcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LmNvbnRlbnRWaWV3KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5nZXREZWxldGVkQXQoKVxuICAgICAgICA/IHRoaXMudHlwZXNNYXBbXCJ0ZXh0XCJdXG4gICAgICAgIDogdGhpcy50eXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV07XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnaGVhZGVyVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cbiAgZ2V0SGVhZGVyVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgbGV0IHZpZXc6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uaGVhZGVyVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uaGVhZGVyVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ2Zvb3RlclZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldEZvb3RlclZpZXcobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGxldCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LmZvb3RlclZpZXdcbiAgICApIHtcbiAgICAgIHZpZXcgPSB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LmZvb3RlclZpZXcobWVzc2FnZSk7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdib3R0b21WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRCb3R0b21WaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uYm90dG9tVmlld1xuICAgICkge1xuICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uYm90dG9tVmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdzdGF0dXNJbmZvVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cblxuICBnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LnN0YXR1c0luZm9WaWV3XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5zdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIGlzQXVkaW9PclZpZGVvTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBtZXNzYWdlVHlwZSA9IG1lc3NhZ2U/LmdldFR5cGUoKTtcbiAgICBjb25zdCB0eXBlc1RvQ2hlY2sgPSBbXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8sXG4gICAgXTtcbiAgICByZXR1cm4gdHlwZXNUb0NoZWNrLmluY2x1ZGVzKG1lc3NhZ2VUeXBlKTtcbiAgfVxuXG4gIHNldEJ1YmJsZUFsaWdubWVudCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgYWxpZ25tZW50OiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5jZW50ZXI7XG4gICAgaWYgKHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQpIHtcbiAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyIHx8XG4gICAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudFxuICAgICAgKSB7XG4gICAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQuY2VudGVyO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSAhPVxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcilcbiAgICAgICkge1xuICAgICAgICBhbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWxpZ25tZW50O1xuICB9O1xuXG4gIGdldEZvcm1NZXNzYWdlQnViYmxlU3R5bGUoKSB7XG4gICAgY29uc3QgdGV4dFN0eWxlID0gbmV3IElucHV0U3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjMwcHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIHBhZGRpbmc6IFwiMHB4IDBweCAwcHggNXB4XCIsXG4gICAgICBwbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgfSk7XG4gICAgY29uc3QgbGFiZWxTdHlsZSA9IG5ldyBMYWJlbFN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICBjb25zdCByYWRpb0J1dHRvblN0eWxlID0gbmV3IFJhZGlvQnV0dG9uU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBsYWJlbFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGxhYmVsVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjRweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJcIixcbiAgICB9KTtcbiAgICBjb25zdCBjaGVja2JveFN0eWxlID0gbmV3IENoZWNrYm94U3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjE2cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgbGFiZWxUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBsYWJlbFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICB9KTtcbiAgICBjb25zdCBkcm9wZG93blN0eWxlID0gbmV3IERyb3Bkb3duU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjM1cHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjZweFwiLFxuICAgICAgYWN0aXZlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYWN0aXZlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG9wdGlvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgb3B0aW9uQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgb3B0aW9uSG92ZXJCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcbiAgICBjb25zdCBidXR0b25Hcm91cFN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgfTtcbiAgICBjb25zdCBzaW5nbGVTZWxlY3RTdHlsZSA9IG5ldyBTaW5nbGVTZWxlY3RTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGFjdGl2ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGFjdGl2ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFjdGl2ZVRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgb3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBvcHRpb25Cb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBvcHRpb25Cb3JkZXJSYWRpdXM6IFwiM3B4XCIsXG4gICAgICBob3ZlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGhvdmVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgaG92ZXJUZXh0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICB9KTtcbiAgICBjb25zdCBxdWlja1ZpZXdTdHlsZSA9IG5ldyBRdWlja1ZpZXdTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbGVhZGluZ0JhclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbGVhZGluZ0JhcldpZHRoOiBcIjRweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgRm9ybUJ1YmJsZVN0eWxlKHtcbiAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB3cmFwcGVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB3cmFwcGVyQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgdGV4dElucHV0U3R5bGU6IHRleHRTdHlsZSxcbiAgICAgIGxhYmVsU3R5bGU6IGxhYmVsU3R5bGUsXG4gICAgICByYWRpb0J1dHRvblN0eWxlOiByYWRpb0J1dHRvblN0eWxlLFxuICAgICAgY2hlY2tib3hTdHlsZTogY2hlY2tib3hTdHlsZSxcbiAgICAgIGRyb3Bkb3duU3R5bGU6IGRyb3Bkb3duU3R5bGUsXG4gICAgICBidXR0b25TdHlsZTogYnV0dG9uR3JvdXBTdHlsZSxcbiAgICAgIHNpbmdsZVNlbGVjdFN0eWxlOiBzaW5nbGVTZWxlY3RTdHlsZSxcbiAgICAgIHF1aWNrVmlld1N0eWxlOiBxdWlja1ZpZXdTdHlsZSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHdyYXBwZXJQYWRkaW5nOiBcIjJweFwiLFxuICAgICAgZGF0ZVBpY2tlckJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGRhdGVQaWNrZXJCb3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBkYXRlUGlja2VyRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBkYXRlUGlja2VyRm9udENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q2FyZE1lc3NhZ2VCdWJibGVTdHlsZSgpIHtcbiAgICBjb25zdCBidXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCI0MHB4XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwcHhcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogYCR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCl9YCxcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IENhcmRCdWJibGVTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICBpbWFnZUhlaWdodDogXCJhdXRvXCIsXG4gICAgICBpbWFnZVdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGltYWdlUmFkaXVzOiBcIjhweFwiLFxuICAgICAgaW1hZ2VCYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGRlc2NyaXB0aW9uRm9udENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGVzY3JpcHRpb25Gb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblN0eWxlOiBidXR0b25TdHlsZSxcbiAgICAgIGRpdmlkZXJUaW50Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICB3cmFwcGVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB3cmFwcGVyQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgd3JhcHBlclBhZGRpbmc6IFwiMnB4XCIsXG4gICAgICBkaXNhYmxlZEJ1dHRvbkNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q2FsbEJ1YmJsZVN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHZhciBpc0xlZnRBbGlnbmVkID0gdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIGlmIChpc1VzZXJTZW50TWVzc2FnZSAmJiAhaXNMZWZ0QWxpZ25lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBidXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIHdpZHRoOiBcIjI0MHB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiMjQwcHhcIixcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGdldEJ1YmJsZVdyYXBwZXIgPSAoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0+IHtcbiAgICBsZXQgdmlldzogVGVtcGxhdGVSZWY8YW55PiB8IG51bGw7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXAgJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0uYnViYmxlVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2U/LmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0uYnViYmxlVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3ID0gbnVsbDtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH1cbiAgfTtcbiAgZ2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0IHx8XG4gICAgICAobWVzc2FnZS5nZXRTZW5kZXIoKSAmJlxuICAgICAgICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpKVxuICAgICAgPyBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnRcbiAgICAgIDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5yaWdodDtcbiAgfVxuICBzZXRUcmFuc2xhdGlvblN0eWxlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHZhciBpc0xlZnRBbGlnbmVkID0gdGhpcy5hbGlnbm1lbnQgIT09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQ7XG4gICAgdmFyIGlzVXNlclNlbnRNZXNzYWdlID1cbiAgICAgICFtZXNzYWdlPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLmdldFVpZCgpID09PSBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKTtcbiAgICBpZiAoIWlzTGVmdEFsaWduZWQpIHtcbiAgICAgIHJldHVybiBuZXcgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUoe1xuICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgICApLFxuICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImxpZ2h0XCIpLFxuICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgICBoZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNVc2VyU2VudE1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSh7XG4gICAgICAgICAgdHJhbnNsYXRlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgICAgICksXG4gICAgICAgICAgdHJhbnNsYXRlZFRleHRDb2xvcjpcbiAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMChcImRhcmtcIiksXG4gICAgICAgICAgaGVscFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlKHtcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOlxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJsaWdodFwiKSxcbiAgICAgICAgICBoZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgICAgIGhlbHBUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgZ2V0Q2FsbFR5cGVJY29uKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGlmIChtZXNzYWdlLmdldFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8pIHtcbiAgICAgIHJldHVybiBcImFzc2V0cy9BdWRpby1DYWxsLnN2Z1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJhc3NldHMvVmlkZW8tY2FsbC5zdmdcIjtcbiAgICB9XG4gIH1cbiAgY2FsbFN0YXR1c1N0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuXG4gICAgaWYgKG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PSB0aGlzLmNhbGxDb25zdGFudCkge1xuICAgICAgbGV0IG1pc3NlZENhbGxUZXh0Q29sb3IgPSBDYWxsaW5nRGV0YWlsc1V0aWxzLmlzTWlzc2VkQ2FsbChcbiAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQ2FsbCxcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXJcbiAgICAgIClcbiAgICAgICAgPyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKClcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgICApLFxuICAgICAgICBidXR0b25UZXh0Q29sb3I6IG1pc3NlZENhbGxUZXh0Q29sb3IsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxMHB4XCIsXG4gICAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICAgIGJ1dHRvbkljb25UaW50OiBtaXNzZWRDYWxsVGV4dENvbG9yLFxuICAgICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgIHBhZGRpbmc6IFwiOHB4IDEycHhcIixcbiAgICAgICAgZ2FwOiBcIjRweFwiLFxuICAgICAgICBoZWlnaHQ6IFwiMjVweFwiLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICBzZXRUZXh0QnViYmxlU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGlzSW5mb0J1YmJsZSA9IHRoaXMubWVzc2FnZUluZm9PYmplY3QgJiYgbWVzc2FnZS5nZXRJZCgpICYmIHRoaXMubWVzc2FnZUluZm9PYmplY3QuZ2V0SWQoKSA9PSBtZXNzYWdlLmdldElkKClcbiAgICB2YXIgaXNEZWxldGVkID0gbWVzc2FnZS5nZXREZWxldGVkQXQoKTtcbiAgICB2YXIgbm90TGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCAhPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNUZXh0TWVzc2FnZSA9XG4gICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSAmJlxuICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIHZhciBpc0dyb3VwTWVtYmVyTWVzc2FnZSA9XG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcjtcbiAgICBpZiAoIWlzRGVsZXRlZCAmJiBub3RMZWZ0QWxpZ25lZCAmJiBpc1RleHRNZXNzYWdlICYmIGlzVXNlclNlbnRNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgICBidWJibGVQYWRkaW5nOiBpc0luZm9CdWJibGUgPyBcIjhweCAxMnB4XCIgOiBcIjhweCAxMnB4IDAgMTJweFwiXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhaXNEZWxldGVkICYmXG4gICAgICBub3RMZWZ0QWxpZ25lZCAmJlxuICAgICAgaXNUZXh0TWVzc2FnZSAmJlxuICAgICAgIWlzVXNlclNlbnRNZXNzYWdlICYmXG4gICAgICAhaXNHcm91cE1lbWJlck1lc3NhZ2VcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGJ1YmJsZVBhZGRpbmc6IFwiOHB4IDEycHggMnB4IDEycHhcIlxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGlzR3JvdXBNZW1iZXJNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmICghbm90TGVmdEFsaWduZWQgJiYgaXNUZXh0TWVzc2FnZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGJ1YmJsZVBhZGRpbmc6IFwiOHB4IDEycHhcIlxuICAgIH07XG4gIH07XG4gIC8qXG4qIGlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIGZvciB0aGlzIGxpc3QgYW5kIGlzIG5vdCBwYXJ0IG9mIHRocmVhZCBldmVuIGZvciBjdXJyZW50IGxpc3RcbiAgaXQgb25seSBydW5zIGZvciBVSSBldmVudCBiZWNhdXNlIGl0IGFzc3VtZXMgbG9nZ2VkIGluIHVzZXIgaXMgYWx3YXlzIHNlbmRlclxuKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuKi9cbiAgaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBtZXNzYWdlPy5nZXRSZWNlaXZlclR5cGUoKTtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmIHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIGlmIChyZWNlaXZlclR5cGUgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiYgcmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgIH1cbiAgICB9XG5cbiAgLypcbiAgICAqIGlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudDogVG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgYmVsb25ncyBmb3IgdGhpcyBsaXN0IGFuZCBpcyBub3QgcGFydCBvZiB0aHJlYWQgZXZlbiBmb3IgY3VycmVudCBsaXN0XG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFNESyBldmVudCBiZWNhdXNlIGl0IG5lZWRzIHNlbmRlcklkIHRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIHNhbWUgdXNlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50ID1cbiAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCByZWNlaXZlcklkID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpO1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJUeXBlKCk7XG4gICAgICBjb25zdCBzZW5kZXJJZCA9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKTtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkgfHwgc2VuZGVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJiAocmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgfVxuICAgIH1cblxuICAvKlxuICAgICogaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudDogVG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgYmVsb25ncyB0aHJlYWQgb2YgdGhpcyBsaXN0LFxuICAgICAgaXQgb25seSBydW5zIGZvciBVSSBldmVudCBiZWNhdXNlIGl0IGFzc3VtZXMgbG9nZ2VkIGluIHVzZXIgaXMgYWx3YXlzIHNlbmRlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKCFtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZWNlaXZlcklkID0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpO1xuXG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgLypcbiAgICAqIGlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIHRocmVhZCBvZiB0aGlzIGxpc3QsXG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFNESyBldmVudCBiZWNhdXNlIGl0IG5lZWRzIHNlbmRlcklkIHRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIHNhbWUgdXNlclxuICAgICogQHBhcmFtOiBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKi9cbiAgaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGlmICghbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCBzZW5kZXJJZCA9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKTtcblxuICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICBpZiAocmVjZWl2ZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpIHx8IHNlbmRlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIHNldEZpbGVCdWJibGVTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBhbnkge1xuICAgIHZhciBpc0ZpbGVNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlO1xuICAgIGlmIChpc0ZpbGVNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgICAgc3VidGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgdGhpcy5pb0JvdHRvbSgpO1xuICAgIHRoaXMuaW9Ub3AoKTtcbiAgICB0aGlzLmNoZWNrTWVzc2FnZVRlbXBsYXRlKCk7XG4gIH1cblxuICBnZXRTdGFydENhbGxGdW5jdGlvbihtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSk6IChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdm9pZCB7XG4gICAgbGV0IHNlc3Npb25JZCA9IHRoaXMuZ2V0U2Vzc2lvbklkKG1lc3NhZ2UpXG4gICAgbGV0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3MuZ2V0KHNlc3Npb25JZCk7XG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2sgPSAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHRoaXMuc3RhcnREaXJlY3RDYWxsKHNlc3Npb25JZCwgbWVzc2FnZSk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5zZXQoc2Vzc2lvbklkLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIHJldHVybiBjYWxsYmFjaztcbiAgfVxuICBzdGFydERpcmVjdENhbGwgPSAoc2Vzc2lvbklkOiBzdHJpbmcsIG1lc3NhZ2U6IGFueSkgPT4ge1xuICAgIHRoaXMuc2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gdHJ1ZTtcbiAgICBTdG9yYWdlVXRpbHMuc2V0SXRlbShDb21ldENoYXRVSUtpdENvbnN0YW50cy5jYWxscy5hY3RpdmVjYWxsLCBtZXNzYWdlKVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgbGF1bmNoQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmREb2N1bWVudCA9ICh1cmw6IHN0cmluZykgPT4ge1xuICAgIHdpbmRvdy5vcGVuKFxuICAgICAgdXJsICsgYCZ1c2VybmFtZT0ke3RoaXMubG9nZ2VkSW5Vc2VyPy5nZXROYW1lKCl9YCxcbiAgICAgIFwiXCIsXG4gICAgICBcImZ1bGxzY3JlZW49eWVzLCBzY3JvbGxiYXJzPWF1dG9cIlxuICAgICk7XG4gIH07XG4gIC8qKlxuICAgKiBFeHRyYWN0aW5nICB0eXBlcyBhbmQgY2F0ZWdvcmllcyBmcm9tIHRlbXBsYXRlXG4gICAqXG4gICAqL1xuICBjaGVja01lc3NhZ2VUZW1wbGF0ZSgpIHtcbiAgICB0aGlzLnR5cGVzTWFwID0ge1xuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dF06IHRoaXMudGV4dEJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGVdOiB0aGlzLmZpbGVCdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb106IHRoaXMuYXVkaW9CdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlb106IHRoaXMudmlkZW9CdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5pbWFnZV06IHRoaXMuaW1hZ2VCdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbisnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyXTogdGhpcy50ZXh0QnViYmxlLFxuICAgICAgY3VzdG9tX2V4dGVuc2lvbl9zdGlja2VyOiB0aGlzLnN0aWNrZXJCdWJibGUsXG4gICAgICBjdXN0b21fZXh0ZW5zaW9uX3doaXRlYm9hcmQ6IHRoaXMud2hpdGVib2FyZEJ1YmJsZSxcbiAgICAgIGN1c3RvbV9leHRlbnNpb25fZG9jdW1lbnQ6IHRoaXMuZG9jdW1lbnRCdWJibGUsXG4gICAgICBjdXN0b21fZXh0ZW5zaW9uX3BvbGw6IHRoaXMucG9sbEJ1YmJsZSxcbiAgICAgIGN1c3RvbV9tZWV0aW5nOiB0aGlzLmRpcmVjdENhbGxpbmcsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGwrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb106IHRoaXMuYXVkaW9CdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGwrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlb106IHRoaXMudmlkZW9CdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuc2NoZWR1bGVyXTogdGhpcy5zY2hlZHVsZXJCdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZm9ybV06IHRoaXMuZm9ybUJ1YmJsZSxcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5jYXJkXTogdGhpcy5jYXJkQnViYmxlLFxuICAgIH07XG4gICAgdGhpcy5zZXRCdWJibGVWaWV3KCk7XG4gIH1cbiAgZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UsIHR5cGU/OiBzdHJpbmcpIHtcbiAgICBsZXQgZGF0YTogYW55ID0gbWVzc2FnZS5nZXRDdXN0b21EYXRhKCk7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIHJldHVybiBkYXRhW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKTtcbiAgICB9XG4gIH1cbiAgZ2V0VGhyZWFkQ291bnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdmFyIHJlcGx5Q291bnQgPSBtZXNzYWdlPy5nZXRSZXBseUNvdW50KCkgfHwgMDtcbiAgICB2YXIgc3VmZml4ID0gcmVwbHlDb3VudCA9PT0gMSA/IGxvY2FsaXplKFwiUkVQTFlcIikgOiBsb2NhbGl6ZShcIlJFUExJRVNcIik7XG4gICAgcmV0dXJuIGAke3JlcGx5Q291bnR9ICR7c3VmZml4fWA7XG4gIH1cbiAgc2hvd0VuYWJsZWRFeHRlbnNpb25zKCkge1xuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwidGV4dG1vZGVyYXRvclwiKSkge1xuICAgICAgdGhpcy5lbmFibGVEYXRhTWFza2luZyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwidGh1bWJuYWlsZ2VuZXJhdGlvblwiKSkge1xuICAgICAgdGhpcy5lbmFibGVUaHVtYm5haWxHZW5lcmF0aW9uID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJsaW5rcHJldmlld1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVMaW5rUHJldmlldyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwicG9sbHNcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlUG9sbHMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInJlYWN0aW9uc1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVSZWFjdGlvbnMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImltYWdlbW9kZXJhdGlvblwiKSkge1xuICAgICAgdGhpcy5lbmFibGVJbWFnZU1vZGVyYXRpb24gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInN0aWNrZXJzXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVN0aWNrZXJzID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJjb2xsYWJvcmF0aXZld2hpdGVib2FyZFwiKSkge1xuICAgICAgdGhpcy5lbmFibGVXaGl0ZWJvYXJkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJjb2xsYWJvcmF0aXZlZG9jdW1lbnRcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlRG9jdW1lbnQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImNhbGxpbmdcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlQ2FsbGluZyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiYWljb252ZXJzYXRpb25zdGFydGVyXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXIgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImFpY29udmVyc2F0aW9uc3VtbWFyeVwiKSkge1xuICAgICAgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcHVibGljIG9wZW5Db25maXJtRGlhbG9nOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBvcGVuRnVsbHNjcmVlblZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGltYWdldXJsVG9PcGVuOiBzdHJpbmcgPSBcIlwiO1xuICBmdWxsU2NyZWVuVmlld2VyU3R5bGU6IEZ1bGxTY3JlZW5WaWV3ZXJTdHlsZSA9IHtcbiAgICBjbG9zZUljb25UaW50OiBcImJsdWVcIixcbiAgfTtcbiAgb3BlbkltYWdlSW5GdWxsU2NyZWVuKG1lc3NhZ2U6IGFueSkge1xuICAgIHRoaXMuaW1hZ2V1cmxUb09wZW4gPSBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsO1xuICAgIHRoaXMub3BlbkZ1bGxzY3JlZW5WaWV3ID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgY2xvc2VJbWFnZUluRnVsbFNjcmVlbigpIHtcbiAgICB0aGlzLmltYWdldXJsVG9PcGVuID0gXCJcIjtcbiAgICB0aGlzLm9wZW5GdWxsc2NyZWVuVmlldyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBvcGVuV2FybmluZ0RpYWxvZyhldmVudDogYW55KSB7XG4gICAgdGhpcy5jbG9zZUltYWdlTW9kZXJhdGlvbiA9IGV2ZW50Py5kZXRhaWw/Lm9uQ29uZmlybTtcbiAgICB0aGlzLm9wZW5Db25maXJtRGlhbG9nID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgb25Db25maXJtQ2xpY2sgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQ29uZmlybURpYWxvZyA9IGZhbHNlO1xuICAgIGlmICh0aGlzLmNsb3NlSW1hZ2VNb2RlcmF0aW9uKSB7XG4gICAgICB0aGlzLmNsb3NlSW1hZ2VNb2RlcmF0aW9uKCk7XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgb25DYW5jZWxDbGljaygpIHtcbiAgICB0aGlzLm9wZW5Db25maXJtRGlhbG9nID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGdldFRleHRNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk6IHN0cmluZyB7XG4gICAgdmFyIHRleHQgPSB0aGlzLmVuYWJsZURhdGFNYXNraW5nXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRFeHRlbnNpb25EYXRhKG1lc3NhZ2UpXG4gICAgICA6IG51bGw7XG4gICAgcmV0dXJuIHRleHQ/LnRyaW0oKT8ubGVuZ3RoID4gMCA/IHRleHQgOiBtZXNzYWdlLmdldFRleHQoKTtcbiAgfVxuICBnZXRMaW5rUHJldmlldyhtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICBpZiAobWVzc2FnZT8uZ2V0TWV0YWRhdGEoKSAmJiB0aGlzLmVuYWJsZUxpbmtQcmV2aWV3KSB7XG4gICAgICAgIHZhciBtZXRhZGF0YTogYW55ID0gbWVzc2FnZS5nZXRNZXRhZGF0YSgpO1xuICAgICAgICB2YXIgaW5qZWN0ZWRPYmplY3QgPSBtZXRhZGF0YVtMaW5rUHJldmlld0NvbnN0YW50cy5pbmplY3RlZF07XG4gICAgICAgIGlmIChpbmplY3RlZE9iamVjdCAmJiBpbmplY3RlZE9iamVjdD8uZXh0ZW5zaW9ucykge1xuICAgICAgICAgIHZhciBleHRlbnNpb25zT2JqZWN0ID0gaW5qZWN0ZWRPYmplY3QuZXh0ZW5zaW9ucztcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBleHRlbnNpb25zT2JqZWN0ICYmXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uc09iamVjdCxcbiAgICAgICAgICAgICAgTGlua1ByZXZpZXdDb25zdGFudHMubGlua19wcmV2aWV3XG4gICAgICAgICAgICApXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB2YXIgbGlua1ByZXZpZXdPYmplY3QgPVxuICAgICAgICAgICAgICBleHRlbnNpb25zT2JqZWN0W0xpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtfcHJldmlld107XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGxpbmtQcmV2aWV3T2JqZWN0ICYmXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgICAgICAgIGxpbmtQcmV2aWV3T2JqZWN0LFxuICAgICAgICAgICAgICAgIExpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtzXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgbGlua1ByZXZpZXdPYmplY3RbTGlua1ByZXZpZXdDb25zdGFudHMubGlua3NdLmxlbmd0aFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHJldHVybiBsaW5rUHJldmlld09iamVjdFtMaW5rUHJldmlld0NvbnN0YW50cy5saW5rc11bMF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0SW1hZ2VUaHVtYm5haWwobXNnOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKTogc3RyaW5nIHtcbiAgICB2YXIgbWVzc2FnZTogYW55ID0gbXNnIGFzIENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2U7XG4gICAgbGV0IGltYWdlVVJMID0gXCJcIjtcbiAgICBpZiAodGhpcy5lbmFibGVUaHVtYm5haWxHZW5lcmF0aW9uKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgbWV0YWRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICAgICAgdmFyIGluamVjdGVkT2JqZWN0ID0gbWV0YWRhdGE/LltcbiAgICAgICAgICBUaHVtYm5haWxHZW5lcmF0aW9uQ29uc3RhbnRzLmluamVjdGVkXG4gICAgICAgIF0gYXMgeyBleHRlbnNpb25zPzogYW55IH07XG4gICAgICAgIHZhciBleHRlbnNpb25zT2JqZWN0ID0gaW5qZWN0ZWRPYmplY3Q/LmV4dGVuc2lvbnM7XG4gICAgICAgIHZhciB0aHVtYm5haWxHZW5lcmF0aW9uT2JqZWN0ID1cbiAgICAgICAgICBleHRlbnNpb25zT2JqZWN0W1RodW1ibmFpbEdlbmVyYXRpb25Db25zdGFudHMudGh1bWJuYWlsX2dlbmVyYXRpb25dO1xuICAgICAgICB2YXIgaW1hZ2VUb0Rvd25sb2FkID0gdGh1bWJuYWlsR2VuZXJhdGlvbk9iamVjdD8udXJsX3NtYWxsO1xuICAgICAgICBpZiAoaW1hZ2VUb0Rvd25sb2FkKSB7XG4gICAgICAgICAgaW1hZ2VVUkwgPSBpbWFnZVRvRG93bmxvYWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1hZ2VVUkwgPSBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1xuICAgICAgICAgICAgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsXG4gICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpbWFnZVVSTCA9IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzXG4gICAgICAgID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybFxuICAgICAgICA6IFwiXCI7XG4gICAgfVxuICAgIHJldHVybiBpbWFnZVVSTDtcbiAgfVxuICBnZXRMaW5rUHJldmlld0RldGFpbHMoa2V5OiBzdHJpbmcsIG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk6IHN0cmluZyB7XG4gICAgbGV0IGxpbmtQcmV2aWV3T2JqZWN0OiBhbnkgPSB0aGlzLmdldExpbmtQcmV2aWV3KG1lc3NhZ2UpO1xuICAgIGlmIChPYmplY3Qua2V5cyhsaW5rUHJldmlld09iamVjdCkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGxpbmtQcmV2aWV3T2JqZWN0W2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICB0aGlzLnNldE1lc3NhZ2VzU3R5bGUoKTtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXREYXRlU3R5bGUoKTtcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdGhpcy5hZGRNZXNzYWdlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLnNldE9uZ29pbmdDYWxsU3R5bGUoKTtcbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlciBhcyBDb21ldENoYXQuVXNlcjtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB0aGlzLmRhdGVTZXBhcmF0b3JTdHlsZS5iYWNrZ3JvdW5kID1cbiAgICAgIHRoaXMuZGF0ZVNlcGFyYXRvclN0eWxlLmJhY2tncm91bmQgfHxcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCk7XG4gICAgdGhpcy5kaXZpZGVyU3R5bGUuYmFja2dyb3VuZCA9XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpO1xuICAgIFxuICAgIHRoaXMubGFiZWxTdHlsZS50ZXh0Q29sb3IgPSB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUubmFtZVRleHRDb2xvciB8fCB0aGlzLmxhYmVsU3R5bGUudGV4dENvbG9yO1xuICAgIHRoaXMubGFiZWxTdHlsZS50ZXh0Rm9udCA9IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5uYW1lVGV4dEZvbnQgfHwgdGhpcy5sYWJlbFN0eWxlLnRleHRGb250O1xuICAgIHRoaXMubG9hZGluZ1N0eWxlLmljb25UaW50ID0gdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmxvYWRpbmdJY29uVGludCB8fCB0aGlzLmxvYWRpbmdTdHlsZS5pY29uVGludDtcbiAgfVxuICBzZXRPbmdvaW5nQ2FsbFN0eWxlID0gKCkgPT4ge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgQ2FsbHNjcmVlblN0eWxlKHtcbiAgICAgIG1heEhlaWdodDogXCIxMDAlXCIsXG4gICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiIzFjMjIyNlwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjQwMHB4XCIsXG4gICAgICBtaW5XaWR0aDogXCI0MDBweFwiLFxuICAgICAgbWluaW1pemVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIG1heGltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfSk7XG4gICAgdGhpcy5vbmdvaW5nQ2FsbFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMub25nb2luZ0NhbGxTdHlsZSB9O1xuICB9O1xuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuICBzZXREYXRlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZSA9IG5ldyBEYXRlU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgcGFkZGluZzogXCI2cHggMTJweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVNlcGFyYXRvclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVNlcGFyYXRvclN0eWxlIH07XG4gIH1cbiAgc2V0TWVzc2FnZXNTdHlsZSgpIHtcbiAgICB0aGlzLnBvcG92ZXJTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIzMzBweFwiLFxuICAgICAgd2lkdGg6IFwiMzI1cHhcIixcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYm94U2hhZG93OiBgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfSAwcHggMHB4IDhweGBcbiAgICB9XG4gICAgbGV0IGRlZmF1bHRFbW9qaVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjMzMHB4XCIsXG4gICAgICB3aWR0aDogXCIzMjVweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgLi4udGhpcy5lbW9qaUtleWJvYXJkU3R5bGVcbiAgICB9XG4gICAgdGhpcy5lbW9qaUtleWJvYXJkU3R5bGUgPSBkZWZhdWx0RW1vamlTdHlsZTtcbiAgICB0aGlzLnVucmVhZE1lc3NhZ2VzU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICB9O1xuICAgIHRoaXMuc21hcnRSZXBseVN0eWxlID0ge1xuICAgICAgcmVwbHlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlcGx5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcmVwbHlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJveFNoYWRvdzogYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgLi4udGhpcy5zbWFydFJlcGx5U3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdHlsZSA9IHtcbiAgICAgIHJlcGx5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZXBseVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHJlcGx5QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3hTaGFkb3c6IGAwcHggMHB4IDFweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCl9YCxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0eWxlLFxuICAgIH07XG5cbiAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZSA9IHtcbiAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0eWxlLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJveFNoYWRvdzogYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpISxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSEsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjNjg1MUQ2XCIsXG4gICAgfTtcblxuICAgIHRoaXMuZnVsbFNjcmVlblZpZXdlclN0eWxlLmNsb3NlSWNvblRpbnQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCk7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTWVzc2FnZUxpc3RTdHlsZSA9IG5ldyBNZXNzYWdlTGlzdFN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRocmVhZFJlcGx5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICB0aHJlYWRSZXBseUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgdGhyZWFkUmVwbHlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aHJlYWRSZXBseVVucmVhZEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdGhyZWFkUmVwbHlVbnJlYWRUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICB0aHJlYWRSZXBseVVucmVhZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgVGltZXN0YW1wVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjNcbiAgICAgICksXG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlTGlzdFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubWVzc2FnZUxpc3RTdHlsZSB9O1xuICAgIHRoaXMubGlua1ByZXZpZXdTdHlsZSA9IG5ldyBMaW5rUHJldmlld1N0eWxlKHtcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgZGVzY3JpcHRpb25Db2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlc2NyaXB0aW9uRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pO1xuICAgIHRoaXMuZG9jdW1lbnRCdWJibGVTdHlsZSA9IHtcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBzdWJ0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc3VidGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYnV0dG9uQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgfTtcbiAgICB0aGlzLnBvbGxCdWJibGVTdHlsZSA9IHtcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHZvdGVQZXJjZW50VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdm90ZVBlcmNlbnRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBwb2xsUXVlc3Rpb25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBwb2xsUXVlc3Rpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBwb2xsT3B0aW9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBwb2xsT3B0aW9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcG9sbE9wdGlvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBvcHRpb25zSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0b3RhbFZvdGVDb3VudFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHRvdGFsVm90ZUNvdW50VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VsZWN0ZWRQb2xsT3B0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIHVzZXJTZWxlY3RlZE9wdGlvbkJhY2tncm91bmQ6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgcG9sbE9wdGlvbkJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIHBvbGxPcHRpb25Cb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLmltYWdlTW9kZXJhdGlvblN0eWxlID0ge1xuICAgICAgZmlsdGVyQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB3YXJuaW5nVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICB3YXJuaW5nVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH07XG4gICAgdGhpcy5jb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9O1xuICB9XG4gIGdldFJlY2VpcHRTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQgJiZcbiAgICAgIHRoaXMuYWxpZ25tZW50ICE9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQ7XG4gICAgdGhpcy5yZWNlaXB0U3R5bGUgPSBuZXcgUmVjZWlwdFN0eWxlKHtcbiAgICAgIHdhaXRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHNlbnRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlbGl2ZXJlZEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcmVhZEljb25UaW50OiBpc1RleHRNZXNzYWdlXG4gICAgICAgID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKClcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGVycm9ySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGhlaWdodDogXCIxMXB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KTtcbiAgICByZXR1cm4geyAuLi50aGlzLnJlY2VpcHRTdHlsZSB9O1xuICB9XG4gIGNyZWF0ZVJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmICghdGhpcy50ZW1wbGF0ZXMgfHwgdGhpcy50ZW1wbGF0ZXM/Lmxlbmd0aCA9PSAwKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZSA9XG4gICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFsbE1lc3NhZ2VUZW1wbGF0ZXMoKTtcbiAgICAgIHRoaXMuY2F0ZWdvcmllcyA9XG4gICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFsbE1lc3NhZ2VDYXRlZ29yaWVzKCk7XG4gICAgICB0aGlzLnR5cGVzID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZVR5cGVzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZXM7XG4gICAgfVxuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbnVsbDtcbiAgICBpZiAodGhpcy51c2VyIHx8IHRoaXMuZ3JvdXApIHtcbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgID8gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcilcbiAgICAgICAgICA6IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgICAgLnNldENhdGVnb3JpZXModGhpcy5jYXRlZ29yaWVzKVxuICAgICAgICAgICAgLmhpZGVSZXBsaWVzKHRydWUpO1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXIuZ2V0VWlkKCkpLmJ1aWxkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKVxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmNvbXB1dGVVbnJlYWRDb3VudCgpO1xuICAgICAgdGhpcy5mZXRjaFByZXZpb3VzTWVzc2FnZXMoKTtcbiAgICB9XG4gIH1cblxuICBjb21wdXRlVW5yZWFkQ291bnQoKSB7XG4gICAgaWYgKHRoaXMudXNlciB8fCB0aGlzLmdyb3VwKSB7XG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRVbnJlYWRNZXNzYWdlQ291bnRGb3JVc2VyKHRoaXMudXNlcj8uZ2V0VWlkKCkpLnRoZW4oXG4gICAgICAgICAgKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZHluYW1pY0tleSA9IHRoaXMudXNlcj8uZ2V0VWlkKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0VW5yZWFkQ291bnQgPSByZXNbZHluYW1pY0tleSBhcyBrZXlvZiB0eXBlb2YgcmVzXTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcikgPT4geyB9XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDb21ldENoYXQuZ2V0VW5yZWFkTWVzc2FnZUNvdW50Rm9yR3JvdXAodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS50aGVuKFxuICAgICAgICAgIChyZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNLZXkgPSB0aGlzLmdyb3VwPy5nZXRHdWlkKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0VW5yZWFkQ291bnQgPSByZXNbZHluYW1pY0tleSBhcyBrZXlvZiB0eXBlb2YgcmVzXTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcikgPT4geyB9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBMaXN0ZW5lciBUbyBSZWNlaXZlIE1lc3NhZ2VzIGluIFJlYWwgVGltZVxuICAgKiBAcGFyYW1cbiAgICovXG4gIGZldGNoUHJldmlvdXNNZXNzYWdlcyA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5yZWluaXRpYWxpemVkKSB7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgIC5zZXRNZXNzYWdlSWQodGhpcy5tZXNzYWdlc0xpc3RbMF0uZ2V0SWQoKSlcbiAgICAgICAgICAuc2V0Q2F0ZWdvcmllcyh0aGlzLmNhdGVnb3JpZXMpXG4gICAgICAgICAgLmhpZGVSZXBsaWVzKHRydWUpXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSkuYnVpbGQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlclxuICAgICAgLmZldGNoUHJldmlvdXMoKVxuICAgICAgLnRoZW4oXG4gICAgICAgIChtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICAgICAgICBpZiAobWVzc2FnZUxpc3QgJiYgbWVzc2FnZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZUxpc3QgPSBtZXNzYWdlTGlzdC5tYXAoXG4gICAgICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgPT09XG4gICAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmVcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgICAgICAgIC8vIE5vIE1lc3NhZ2VzIEZvdW5kXG4gICAgICAgICAgaWYgKG1lc3NhZ2VMaXN0Lmxlbmd0aCA9PT0gMCAmJiB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICBpZiAoIXRoaXMucGFyZW50TWVzc2FnZUlkICYmIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3RhcnRlcikge1xuICAgICAgICAgICAgICB0aGlzLmZldGNoQ29udmVyc2F0aW9uU3RhcnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWVzc2FnZUxpc3QgJiYgbWVzc2FnZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmdldFVucmVhZENvdW50ID49IHRoaXMudW5yZWFkTWVzc2FnZVRocmVzaG9sZCAmJlxuICAgICAgICAgICAgICB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN1bW1hcnlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLmZldGNoQ29udmVyc2F0aW9uU3VtbWFyeSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIoXG4gICAgICAgICAgICAgICAgbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV0uZ2V0SWQoKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUxpc3QubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBsZXQgaXNTZW50QnlNZTogYm9vbGVhbiA9IGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT1cbiAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICFpc1NlbnRCeU1lICYmXG4gICAgICAgICAgICAgICFsYXN0TWVzc2FnZS5nZXREZWxpdmVyZWRBdCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgLy9tYXJrIHRoZSBtZXNzYWdlIGFzIGRlbGl2ZXJlZFxuICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKGxhc3RNZXNzYWdlKS50aGVuKFxuICAgICAgICAgICAgICAgICAgKHJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PSBOdW1iZXIocmVjZWlwdD8uZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbGFzdE1lc3NhZ2U/LmdldFJlYWRBdCgpICYmICFpc1NlbnRCeU1lKSB7XG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oKHJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgbS5nZXRJZCgpID09PSBOdW1iZXIocmVjZWlwdD8uZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIC8vaWYgdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZSBpcyBub3QgdGhlIGxvZ2dlZGluIHVzZXIsIG1hcmsgaXQgYXMgcmVhZC5cbiAgICAgICAgICAgIGxldCBwcmV2U2Nyb2xsSGVpZ2h0ID0gdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodDtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmxpc3RTY3JvbGwubmF0aXZlRWxlbWVudC5zY3JvbGxUb3AgPVxuICAgICAgICAgICAgICAgIHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQgLSBwcmV2U2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5wcmVwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVyKCk7XG4gICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICApXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG4gIGZldGNoQWN0aW9uTWVzc2FnZXMoKSB7XG4gICAgbGV0IHJlcXVlc3RCdWlsZGVyOiBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAuc2V0VHlwZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSlcbiAgICAgIC5zZXRDYXRlZ29yeShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKVxuICAgICAgLnNldE1lc3NhZ2VJZCh0aGlzLmxhc3RNZXNzYWdlSWQpXG4gICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICByZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICByZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSk7XG4gICAgfVxuICAgIHJlcXVlc3RCdWlsZGVyLmJ1aWxkKClcbiAgICAgIC5mZXRjaE5leHQoKVxuICAgICAgLnRoZW4oKG1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlcyAmJiBtZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbWVzc2FnZXMuZm9yRWFjaCgobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5BY3Rpb24pLmdldEFjdGlvbk9uKCkgaW5zdGFuY2VvZlxuICAgICAgICAgICAgICBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAobSkgPT5cbiAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT1cbiAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkFjdGlvblxuICAgICAgICAgICAgICAgICAgICApLmdldEFjdGlvbk9uKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICAgICAgICAgICApLmdldElkKClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPj0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldID0gKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uXG4gICAgICAgICAgICAgICAgKS5nZXRBY3Rpb25PbigpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cbiAgZmV0Y2hOZXh0TWVzc2FnZSA9ICgpID0+IHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAxO1xuICAgIGxldCBtZXNzYWdlSWQ6IG51bWJlcjtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlaW5pdGlhbGl6ZWQgfHxcbiAgICAgICh0aGlzLmxhc3RNZXNzYWdlSWQgPiAwICYmIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZClcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5mZXRjaEFjdGlvbk1lc3NhZ2VzKCk7XG4gICAgICAgIG1lc3NhZ2VJZCA9IHRoaXMubGFzdE1lc3NhZ2VJZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2VJZCA9IHRoaXMubWVzc2FnZXNMaXN0W2luZGV4XS5nZXRJZCgpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyXG4gICAgICAgICAgPyB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICAgIC5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSlcbiAgICAgICAgICAgIC5zZXRNZXNzYWdlSWQobWVzc2FnZUlkKVxuICAgICAgICAgICAgLmJ1aWxkKClcbiAgICAgICAgICA6IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgICAgLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKVxuICAgICAgICAgICAgLnNldE1lc3NhZ2VJZChtZXNzYWdlSWQpXG4gICAgICAgICAgICAuYnVpbGQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgIC5zZXRNZXNzYWdlSWQobWVzc2FnZUlkKVxuICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLmZldGNoTmV4dCgpXG4gICAgICAgIC50aGVuKFxuICAgICAgICAgIChtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VMaXN0ID0gbWVzc2FnZUxpc3QubWFwKFxuICAgICAgICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmVcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMuY29udmVydEludGVyYWN0aXZlTWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgICAgIC8vIE5vIE1lc3NhZ2VzIEZvdW5kXG4gICAgICAgICAgICBpZiAobWVzc2FnZUxpc3QubGVuZ3RoID09PSAwICYmIHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNPbkJvdHRvbSkge1xuICAgICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdLmdldElkKClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldERlbGl2ZXJlZEF0KCkgJiZcbiAgICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXS5nZXRJZCgpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzKSB7XG4gICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50VGV4dCA9IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQ7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb3VudFRleHQgPVxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2NhbGl6ZShcIk5FV19NRVNTQUdFXCIpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKC4uLm1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgICAgICAgICAgXCIg4oaTIFwiICsgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggKyBcIiBcIiArIGNvdW50VGV4dDtcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgIWxhc3RNZXNzYWdlPy5nZXREZWxpdmVyZWRBdCgpICYmXG4gICAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzRGVsaXZlcmVkKG1lc3NhZ2VMaXN0Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2VzKG1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5tZXNzYWdlc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBhcHBlbmRNZXNzYWdlcyA9IChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICB0aGlzLm1lc3NhZ2VzTGlzdC5wdXNoKC4uLm1lc3NhZ2VzKTtcbiAgICB0aGlzLm1lc3NhZ2VDb3VudCA9IHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aDtcbiAgICBpZiAodGhpcy5tZXNzYWdlQ291bnQgPiB0aGlzLnRocmVzaG9sZFZhbHVlKSB7XG4gICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VCdWlsZGVyKCk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVyKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5mZXRjaE5leHRNZXNzYWdlKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gY29ubmVjdGVkXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICBhZGRNZXNzYWdlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdyb3VwTGlzdGVuZXJJZCxcbiAgICAgICAgbmV3IENvbWV0Q2hhdC5Hcm91cExpc3RlbmVyKHtcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgY2hhbmdlZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgbmV3U2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgb2xkU2NvcGU6IENvbWV0Q2hhdC5Hcm91cE1lbWJlclNjb3BlLFxuICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRSxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwLFxuICAgICAgICAgICAgICB7IHVzZXI6IGNoYW5nZWRVc2VyLCBzY29wZTogbmV3U2NvcGUgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICBraWNrZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGtpY2tlZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGtpY2tlZEZyb206IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBraWNrZWRGcm9tLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjoga2lja2VkVXNlcixcbiAgICAgICAgICAgICAgICBoYXNKb2luZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckJhbm5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGJhbm5lZFVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgYmFubmVkRnJvbTogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGJhbm5lZEZyb20sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBiYW5uZWRVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlclVuYmFubmVkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5iYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVuYmFubmVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdW5iYW5uZWRGcm9tOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICB1bmJhbm5lZEZyb20sXG4gICAgICAgICAgICAgIHsgdXNlcjogdW5iYW5uZWRVc2VyIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVzZXJBZGRlZDogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1c2VyQWRkZWRJbjogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW4sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiB1c2VyQWRkZWQsXG4gICAgICAgICAgICAgICAgaGFzSm9pbmVkOiB0cnVlLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICAgICAgICAgIGxlYXZpbmdVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGdyb3VwLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogbGVhdmluZ1VzZXIsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgICAgICAgICBqb2luZWRVc2VyOiBDb21ldENoYXQuR3JvdXBNZW1iZXIsXG4gICAgICAgICAgICBqb2luZWRHcm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgam9pbmVkR3JvdXAsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2VyOiBqb2luZWRVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMuZW5hYmxlQ2FsbGluZykge1xuICAgICAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuY2FsbExpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5DYWxsTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNhbGxFbmRlZE1lc3NhZ2VSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWFjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvbkFkZGVkID1cbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZVJlYWN0aW9uQWRkZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9BRERFRCxcbiAgICAgICAgICAgICAgICByZWFjdGlvblJlY2VpcHRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZCA9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVELFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uUmVjZWlwdFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UZXh0TWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25Gb3JtTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogRm9ybU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DYXJkTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ2FyZE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNEZWxpdmVyZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICBpZiAobWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWQuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFELFxuICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkQnlBbGwgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNSZWFkQnlBbGwuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2VSZWNlaXB0LCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFELFxuICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWRUb0FsbCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsLnN1YnNjcmliZShcbiAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICBpZiAobWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhZEFuZERlbGl2ZXJlZChtZXNzYWdlUmVjZWlwdCwgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMSVZFUkVELFxuICAgICAgICAgICAgICBtZXNzYWdlUmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChkZWxldGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgZGVsZXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChlZGl0ZWRNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIGVkaXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICh0cmFuc2llbnRNZXNzYWdlOiBDb21ldENoYXQuVHJhbnNpZW50TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGxpdmVSZWFjdGlvbjogYW55ID0gdHJhbnNpZW50TWVzc2FnZS5nZXREYXRhKCk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgICAgICAgIHRoaXMudXNlciAmJlxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLnVzZXIuZ2V0VWlkKCkgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInR5cGVcIl0gPT0gXCJsaXZlX3JlYWN0aW9uXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTGl2ZVJlYWN0aW9uLm5leHQoXG4gICAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1wicmVhY3Rpb25cIl1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgICAgICAgIHRoaXMuZ3JvdXAgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT0gdGhpcy5ncm91cC5nZXRHdWlkKCkgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInR5cGVcIl0gPT0gXCJsaXZlX3JlYWN0aW9uXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTGl2ZVJlYWN0aW9uLm5leHQoXG4gICAgICAgICAgICAgICAgbGl2ZVJlYWN0aW9uW1wicmVhY3Rpb25cIl1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25JbnRlcmFjdGlvbkdvYWxDb21wbGV0ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uSW50ZXJhY3Rpb25Hb2FsQ29tcGxldGVkLnN1YnNjcmliZShcbiAgICAgICAgICAocmVjZWlwdDogQ29tZXRDaGF0LkludGVyYWN0aW9uUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElPTl9HT0FMX0NPTVBMRVRFRCxcbiAgICAgICAgICAgICAgcmVjZWlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBVcGRhdGVzIG1lc3NhZ2VMaXN0IG9uIGJhc2lzIG9mIHVzZXIgYWN0aXZpdHkgb3IgZ3JvdXAgYWN0aXZpdHkgb3IgY2FsbGluZyBhY3Rpdml0eVxuICAgKiBAcGFyYW0gIHthbnk9bnVsbH0ga2V5XG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuR3JvdXAgfCBudWxsPW51bGx9IGdyb3VwXG4gICAqIEBwYXJhbSAge2FueT1udWxsfSBvcHRpb25zXG4gICAqL1xuICBtZXNzYWdlVXBkYXRlKFxuICAgIGtleTogc3RyaW5nIHwgbnVsbCA9IG51bGwsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0IHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlIHwgYW55ID0gbnVsbCxcbiAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgb3B0aW9uczogYW55ID0gbnVsbFxuICApIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW107XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5pc1RocmVhZE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMSVZFUkVEOlxuICAgICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFEOlxuICAgICAgICAgIHRoaXMubWVzc2FnZVJlYWRBbmREZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgXG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVEOiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlRWRpdGVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uU0NPUEVfQ0hBTkdFOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkFEREVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uVU5CQU5ORUQ6IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWQobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmlzVGhyZWFkT2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJT05fR09BTF9DT01QTEVURUQ6XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUludGVyYWN0aXZlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUNUSU9OX0FEREVEOlxuICAgICAgICAgIHRoaXMub25SZWFjdGlvblVwZGF0ZWQobWVzc2FnZSwgdHJ1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVEOlxuICAgICAgICAgIHRoaXMub25SZWFjdGlvblVwZGF0ZWQobWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYSBtZXNzYWdlJ3MgcmVhY3Rpb25zIGJhc2VkIG9uIGEgbmV3IHJlYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5SZWFjdGlvbkV2ZW50fSBtZXNzYWdlIC0gVGhlIG5ldyBtZXNzYWdlIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQWRkZWQgLSBUcnVlIGlmIHRoZSByZWFjdGlvbiB3YXMgYWRkZWQsIGZhbHNlIGlmIGl0IHdhcyByZW1vdmVkLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBmYWxzZSBpZiB0aGUgbWVzc2FnZSB3YXMgbm90IGZvdW5kLCB0cnVlIG90aGVyd2lzZS5cbiAgICovXG5cbiAgb25SZWFjdGlvblVwZGF0ZWQobWVzc2FnZTogQ29tZXRDaGF0LlJlYWN0aW9uRXZlbnQsIGlzQWRkZWQ6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBtZXNzYWdlSWQgPSBtZXNzYWdlLmdldFJlYWN0aW9uKCk/LmdldE1lc3NhZ2VJZCgpO1xuICAgIGNvbnN0IG1lc3NhZ2VPYmplY3QgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKG1lc3NhZ2VJZCk7XG5cbiAgICBpZiAoIW1lc3NhZ2VPYmplY3QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgYWN0aW9uOiBDb21ldENoYXQuUkVBQ1RJT05fQUNUSU9OO1xuICAgIGlmIChpc0FkZGVkKSB7XG4gICAgICBhY3Rpb24gPSBDb21ldENoYXQuUkVBQ1RJT05fQUNUSU9OLlJFQUNUSU9OX0FEREVEO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3Rpb24gPSBDb21ldENoYXQuUkVBQ1RJT05fQUNUSU9OLlJFQUNUSU9OX1JFTU9WRUQ7XG4gICAgfVxuICAgIGxldCBtb2RpZmllZE1lc3NhZ2UgPVxuICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci51cGRhdGVNZXNzYWdlV2l0aFJlYWN0aW9uSW5mbyhcbiAgICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgICAgbWVzc2FnZS5nZXRSZWFjdGlvbigpLFxuICAgICAgICBhY3Rpb25cbiAgICAgICk7XG4gICAgaWYgKG1vZGlmaWVkTWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1vZGlmaWVkTWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiB0cmFuc2xhdGUgbWVzc2FnZSB0aGVuIGNhbGwgdXBkYXRlIG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICAvLyB0cmFuc2xhdGVNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAvLyB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1hcmtNZXNzYWdlQXNEZWxpdmVyZWQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuZGlzYWJsZVJlY2VpcHQgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJkZWxpdmVyZWRBdFwiKSA9PT0gZmFsc2VcbiAgICApIHtcbiAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogV2hlbiBNZXNzYWdlIGlzIFJlY2VpdmVkXG4gICAqIEBwYXJhbSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtZXNzYWdlUmVjZWl2ZWQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7ICAgICAgICAgICBcbiAgICAgICBcbiAgICB0cnkge1xuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5ncm91cD8uZ2V0R3VpZCgpIHx8XG4gICAgICAgIChtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PT0gdGhpcy51c2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgICFtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKSB8fFxuICAgICAgICAgICghbWVzc2FnZT8uZ2V0UmVhZEF0KCkgJiZcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICAgICAgICB0aGlzLmlzT25Cb3R0b20pXG4gICAgICAgICkge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0aW5nIHRoZSByZXBseSBjb3VudCBvZiBUaHJlYWQgUGFyZW50IE1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgdXBkYXRlUmVwbHlDb3VudChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZWNlaXZlZE1lc3NhZ2UgPSBtZXNzYWdlcztcbiAgICAgIGxldCBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IHJlY2VpdmVkTWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VLZXldO1xuICAgICAgICBsZXQgcmVwbHlDb3VudCA9IG1lc3NhZ2VPYmouZ2V0UmVwbHlDb3VudCgpXG4gICAgICAgICAgPyBtZXNzYWdlT2JqLmdldFJlcGx5Q291bnQoKVxuICAgICAgICAgIDogMDtcbiAgICAgICAgcmVwbHlDb3VudCA9IHJlcGx5Q291bnQgKyAxO1xuICAgICAgICBtZXNzYWdlT2JqLnNldFJlcGx5Q291bnQocmVwbHlDb3VudCk7XG4gICAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlT2JqKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZUxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7c3RyaW5nfSB0eXBlXG4gICAqL1xuICBtZXNzYWdlUmVjZWl2ZWRIYW5kbGVyID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICsrdGhpcy5tZXNzYWdlQ291bnQ7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIC8vIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMudXBkYXRlVW5yZWFkUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGlmICghdGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgIFwiIOKGkyBcIiArIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKXtcbiAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgfVxuICAgIC8vaGFuZGxpbmcgZG9tIGxhZyAtIGluY3JlbWVudCBjb3VudCBvbmx5IGZvciBtYWluIG1lc3NhZ2UgbGlzdFxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IGZhbHNlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gdHJ1ZSAmJlxuICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWRcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiZcbiAgICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgfTtcbiAgcGxheUF1ZGlvKCkge1xuICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlLFxuICAgICAgICAgIHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldENhbGxCdWlsZGVyID0gKCk6IGFueSA9PiB7XG4gICAgY29uc3QgY2FsbFNldHRpbmdzOiBhbnkgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcbiAgICAgIC5lbmFibGVEZWZhdWx0TGF5b3V0KHRydWUpXG4gICAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGZhbHNlKVxuICAgICAgLnNldENhbGxMaXN0ZW5lcihcbiAgICAgICAgbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuT25nb2luZ0NhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG4gICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoe30gYXMgQ29tZXRDaGF0LkNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5idWlsZCgpO1xuICAgIHJldHVybiBjYWxsU2V0dGluZ3M7XG4gIH07XG4gIHJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCkge1xuICAgIHRoaXMucmVpbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5ncm91cExpc3RlbmVySWQgPSBcImdyb3VwX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5jYWxsTGlzdGVuZXJJZCA9IFwiY2FsbF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHRoaXMuYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgaWYgKHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgxLCB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAzMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlclxuICAgICAgICA/IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyLmdldFVpZCgpKS5idWlsZCgpXG4gICAgICAgIDogdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cC5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcykge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMSwgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoIC0gMzApO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgcmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgdGhpcy5tZXNzYWdlQ291bnQgPSAwO1xuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbnVsbDtcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMaXN0ZW5lcklkKTtcbiAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCk7XG4gIH07XG4gIGdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCByZWNlaXB0ID0gTWVzc2FnZVJlY2VpcHRVdGlscy5nZXRSZWNlaXB0U3RhdHVzKG1lc3NhZ2UpO1xuICAgIHJldHVybiByZWNlaXB0O1xuICB9XG4gIG1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCwgaXNHcm91cFJlY2VpcHQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHRyeSB7XG4gICAgICBpZihpc0dyb3VwUmVjZWlwdCl7XG4gICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICBtLmdldElkKCkgPT0gTnVtYmVyKG1lc3NhZ2UuZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XS5zZXREZWxpdmVyZWRBdChcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSk7XG5cbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IG1lc3NhZ2UuUkVDRUlQVF9UWVBFLkRFTElWRVJFRF9UT19BTExfUkVDRUlQVCAgJiYgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleSk7XG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBtZXNzYWdlLlJFQ0VJUFRfVFlQRS5SRUFEX0JZX0FMTF9SRUNFSVBUICAmJiB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5ERUxJVkVSWVxuICAgICAgICApIHtcbiAgICAgICAgICAvL3NlYXJjaCBmb3IgbWVzc2FnZVxuICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgbS5nZXRJZCgpID09IE51bWJlcihtZXNzYWdlLmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlJFQURcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy9zZWFyY2ggZm9yIG1lc3NhZ2VcbiAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PSBOdW1iZXIobWVzc2FnZS5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IHJlYWRNZXNzYWdlXG4gICAqL1xuICBtYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXk6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBtZXNzYWdlS2V5OyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKCF0aGlzLm1lc3NhZ2VzTGlzdFtpXS5nZXRSZWFkQXQoKSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFtpXS5zZXRSZWFkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldKTtcbiAgfVxuICBtYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleTogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IG1lc3NhZ2VLZXk7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoIXRoaXMubWVzc2FnZXNMaXN0W2ldLmdldERlbGl2ZXJlZEF0KCkpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbaV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IGEgbWVzc2FnZSB3YXMgZGVsZXRlZCBieSB0aGUgdXNlci9wZXJzb24geW91IGFyZSBjaGF0dGluZyB3aXRoXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogRGV0ZWN0cyBpZiB0aGUgbWVzc2FnZSB0aGF0IHdhcyBlZGl0IGlzIHlvdXIgY3VycmVudCBvcGVuIGNvbnZlcnNhdGlvbiB3aW5kb3dcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1lc3NhZ2VFZGl0ZWQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmdyb3VwPy5nZXRHdWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHVwZGF0ZUludGVyYWN0aXZlTWVzc2FnZSA9IChyZWNlaXB0OiBDb21ldENoYXQuSW50ZXJhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gcmVjZWlwdC5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoXG4gICAgICAgIHJlY2VpcHQuZ2V0TWVzc2FnZUlkKClcbiAgICAgICkgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZTtcbiAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChTdHJpbmcobWVzc2FnZT8uZ2V0SWQoKSkgPT0gU3RyaW5nKHJlY2VpcHQuZ2V0TWVzc2FnZUlkKCkpKSB7XG4gICAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSByZWNlaXB0LmdldEludGVyYWN0aW9ucygpO1xuICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2UpLnNldEludGVyYWN0aW9ucyhcbiAgICAgICAgICAgIGludGVyYWN0aW9uXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UoXG4gICAgICAgICAgICBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBhIG1lc3NhZ2Ugd2FzIGRlbGV0ZWQgYnkgdGhlIHVzZXIvcGVyc29uIHlvdSBhcmUgY2hhdHRpbmcgd2l0aFxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgdXBkYXRlRWRpdGVkTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB2YXIgbWVzc2FnZUxpc3QgPSB0aGlzLm1lc3NhZ2VzTGlzdDtcbiAgICAvLyBsZXQgbmV3TWVzc2FnZSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShtZXNzYWdlKTtcbiAgICB2YXIgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgICk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0gPSBtZXNzYWdlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICAvLyBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgLy8gICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtcbiAgICAvLyAgICAgLi4ubWVzc2FnZUxpc3Quc2xpY2UoMCwgbWVzc2FnZUtleSksXG4gICAgLy8gICAgIG1lc3NhZ2UsXG4gICAgLy8gICAgIC4uLm1lc3NhZ2VMaXN0LnNsaWNlKG1lc3NhZ2VLZXkgKyAxKSxcbiAgICAvLyAgIF07XG4gICAgLy8gICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgLy8gfVxuICB9O1xuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBHcm91cCBEYXRhIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogV2hlbiBjdXN0b20gbWVzc2FnZXMgYXJlIHJlY2VpdmVkIGVnLiBQb2xsLCBTdGlja2VycyBlbWl0cyBhY3Rpb24gdG8gdXBkYXRlIG1lc3NhZ2UgbGlzdFxuICAgKiBAcGFyYW0gbWVzc2FnZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgY3VzdG9tTWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKSB8fFxuICAgICAgICAobWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAhbWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMuaXNPbkJvdHRvbSkgfHxcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKVxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKG1lc3NhZ2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VzdG9tTWVzc2FnZVJlY2VpdmVkSGFuZGxlcihtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAgICovXG4gIGN1c3RvbU1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAvLyBhZGQgcmVjZWl2ZWQgbWVzc2FnZSB0byBtZXNzYWdlcyBsaXN0XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIC8vIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMudXBkYXRlVW5yZWFkUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGlmICghdGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgIFwiIOKGkyBcIiArIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKXtcbiAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgfVxuICAgIC8vaGFuZGxpbmcgZG9tIGxhZyAtIGluY3JlbWVudCBjb3VudCBvbmx5IGZvciBtYWluIG1lc3NhZ2UgbGlzdFxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IGZhbHNlICYmXG4gICAgICAhdGhpcy5wYXJlbnRNZXNzYWdlSWRcbiAgICApIHtcbiAgICAgICsrdGhpcy5tZXNzYWdlQ291bnQ7XG4gICAgICAvL2lmIHRoZSB1c2VyIGhhcyBub3Qgc2Nyb2xsZWQgaW4gY2hhdCB3aW5kb3coc2Nyb2xsIGlzIGF0IHRoZSBib3R0b20gb2YgdGhlIGNoYXQgd2luZG93KVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBtZXNzYWdlLmhhc093blByb3BlcnR5KFwicGFyZW50TWVzc2FnZUlkXCIpID09PSB0cnVlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgKSB7XG4gICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIGRhdGVzIGFuZCBzZXRzIERhdGUgb24gYSBhIG5ldyBkYXlcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IGZpcnN0RGF0ZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHNlY29uZERhdGVcbiAgICovXG4gIGlzRGF0ZURpZmZlcmVudChcbiAgICBmaXJzdERhdGU6IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgICBzZWNvbmREYXRlOiBudW1iZXIgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgbGV0IGZpcnN0RGF0ZU9iajogRGF0ZSwgc2Vjb25kRGF0ZU9iajogRGF0ZTtcbiAgICBmaXJzdERhdGVPYmogPSBuZXcgRGF0ZShmaXJzdERhdGUhICogMTAwMCk7XG4gICAgc2Vjb25kRGF0ZU9iaiA9IG5ldyBEYXRlKHNlY29uZERhdGUhICogMTAwMCk7XG4gICAgcmV0dXJuIChcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXREYXRlKCkgIT09IHNlY29uZERhdGVPYmouZ2V0RGF0ZSgpIHx8XG4gICAgICBmaXJzdERhdGVPYmouZ2V0TW9udGgoKSAhPT0gc2Vjb25kRGF0ZU9iai5nZXRNb250aCgpIHx8XG4gICAgICBmaXJzdERhdGVPYmouZ2V0RnVsbFllYXIoKSAhPT0gc2Vjb25kRGF0ZU9iai5nZXRGdWxsWWVhcigpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGZvcm1hdHRlcnMgZm9yIHRoZSB0ZXh0IGJ1YmJsZXNcbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHJldHVybnNcbiAgICovXG4gIGdldFRleHRGb3JtYXR0ZXJzID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBhbGlnbm1lbnQgPSB0aGlzLnNldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKTtcbiAgICBsZXQgY29uZmlnID0ge1xuICAgICAgdGV4dEZvcm1hdHRlcnM6XG4gICAgICAgIHRoaXMudGV4dEZvcm1hdHRlcnMgJiYgdGhpcy50ZXh0Rm9ybWF0dGVycy5sZW5ndGhcbiAgICAgICAgICA/IFsuLi50aGlzLnRleHRGb3JtYXR0ZXJzXVxuICAgICAgICAgIDogQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsVGV4dEZvcm1hdHRlcnMoe1xuICAgICAgICAgICAgZGlzYWJsZU1lbnRpb25zOiB0aGlzLmRpc2FibGVNZW50aW9ucyxcbiAgICAgICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICAgIGFsaWdubWVudCxcbiAgICAgICAgICB9KSxcbiAgICB9O1xuXG4gICAgbGV0IHRleHRGb3JtYXR0ZXJzOiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPiA9IGNvbmZpZy50ZXh0Rm9ybWF0dGVycztcbiAgICBsZXQgdXJsVGV4dEZvcm1hdHRlciE6IENvbWV0Q2hhdFVybHNGb3JtYXR0ZXI7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVNZW50aW9ucykge1xuICAgICAgbGV0IG1lbnRpb25zVGV4dEZvcm1hdHRlciE6IENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGV4dEZvcm1hdHRlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcikge1xuICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlciA9IHRleHRGb3JtYXR0ZXJzW1xuICAgICAgICAgICAgaVxuICAgICAgICAgIF0gYXMgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0TWVudGlvbmVkVXNlcnMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKFxuICAgICAgICAgICAgICBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRMb2dnZWRJblVzZXIoXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAodXJsVGV4dEZvcm1hdHRlcikge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB1cmxUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbaV0gYXMgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICAgICAgICBpZiAobWVudGlvbnNUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghbWVudGlvbnNUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlciA9XG4gICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAuLi5jb25maWcsXG4gICAgICAgICAgICBhbGlnbm1lbnQsXG4gICAgICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIHRleHRGb3JtYXR0ZXJzLnB1c2gobWVudGlvbnNUZXh0Rm9ybWF0dGVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGV4dEZvcm1hdHRlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXRVcmxzRm9ybWF0dGVyKSB7XG4gICAgICAgICAgdXJsVGV4dEZvcm1hdHRlciA9IHRleHRGb3JtYXR0ZXJzW2ldIGFzIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXVybFRleHRGb3JtYXR0ZXIpIHtcbiAgICAgIHVybFRleHRGb3JtYXR0ZXIgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRVcmxUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICBhbGlnbm1lbnQsXG4gICAgICB9KTtcbiAgICAgIHRleHRGb3JtYXR0ZXJzLnB1c2godXJsVGV4dEZvcm1hdHRlcik7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdGV4dEZvcm1hdHRlcnNbaV0uc2V0TWVzc2FnZUJ1YmJsZUFsaWdubWVudChhbGlnbm1lbnQpO1xuICAgICAgdGV4dEZvcm1hdHRlcnNbaV0uc2V0TWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGV4dEZvcm1hdHRlcnM7XG4gIH07XG5cbiAgLyoqXG4gICAqIHByZXBlbmQgRmV0Y2hlZCBNZXNzYWdlc1xuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZXNcbiAgICovXG4gIHByZXBlbmRNZXNzYWdlcyhtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZXMsIC4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgIHRoaXMubWVzc2FnZUNvdW50ID0gdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoO1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VCdWlsZGVyKCk7XG4gICAgICB9XG4gICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7IC8vIERldGFjaCB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLmNoYXRDaGFuZ2VkKSB7XG4gICAgICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjQWN0aXZlQ2hhdENoYW5nZWQubmV4dCh7XG4gICAgICAgICAgdXNlcjogdGhpcy51c2VyLFxuICAgICAgICAgIGdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VzW21lc3NhZ2VzPy5sZW5ndGggLSAxXSxcbiAgICAgICAgICB1bnJlYWRNZXNzYWdlQ291bnQ6IHRoaXMuZ2V0VW5yZWFkQ291bnQsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNoYXRDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBsaXN0ZW5pbmcgdG8gYm90dG9tIHNjcm9sbCB1c2luZyBpbnRlcnNlY3Rpb24gb2JzZXJ2ZXJcbiAgICovXG4gIGlvQm90dG9tKCkge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgcm9vdDogdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LFxuICAgICAgcm9vdE1hcmdpbjogXCItMTAwJSAwcHggMTAwcHggMHB4XCIsXG4gICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgfTtcbiAgICB2YXIgY2FsbGJhY2sgPSAoZW50cmllczogYW55KSA9PiB7XG4gICAgICB2YXIgbGFzdE1lc3NhZ2UgPSB0aGlzLlVucmVhZENvdW50W3RoaXMuVW5yZWFkQ291bnQubGVuZ3RoIC0gMV07XG4gICAgICB0aGlzLmlzT25Cb3R0b20gPSBlbnRyaWVzWzBdLmlzSW50ZXJzZWN0aW5nO1xuICAgICAgaWYgKHRoaXMuaXNPbkJvdHRvbSkge1xuICAgICAgICB0aGlzLmZldGNoTmV4dE1lc3NhZ2UoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmIHRoaXMuVW5yZWFkQ291bnQ/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChsYXN0TWVzc2FnZSkudGhlbihcbiAgICAgICAgICAgIChyZXM6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgICAgICBtLmdldElkKCkgPT09IE51bWJlcihyZXM/LmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9ic2VydmVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgIGNhbGxiYWNrLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLmJvdHRvbT8ubmF0aXZlRWxlbWVudCk7XG4gIH1cbiAgLyoqXG4gICAqIGxpc3RlbmluZyB0byB0b3Agc2Nyb2xsIHVzaW5nIGludGVyc2VjdGlvbiBvYnNlcnZlclxuICAgKi9cbiAgaW9Ub3AoKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICByb290OiB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQsXG4gICAgICByb290TWFyZ2luOiBcIjIwMHB4IDBweCAwcHggMHB4XCIsXG4gICAgICB0aHJlc2hvbGQ6IDEuMCxcbiAgICB9O1xuICAgIHZhciBjYWxsYmFjayA9IChlbnRyaWVzOiBhbnkpID0+IHtcbiAgICAgIGlmIChlbnRyaWVzWzBdLmlzSW50ZXJzZWN0aW5nKSB7XG4gICAgICAgIHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwrKztcbiAgICAgICAgaWYgKHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwgPiAxKSB7XG4gICAgICAgICAgdGhpcy5mZXRjaFByZXZpb3VzTWVzc2FnZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9ic2VydmVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgIGNhbGxiYWNrLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLnRvcD8ubmF0aXZlRWxlbWVudCk7XG4gIH1cbiAgLy8gcHVibGljIG1ldGhvZHNcbiAgYWRkTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0aGlzLm1lc3NhZ2VzTGlzdC5wdXNoKG1lc3NhZ2UpO1xuICAgIGlmIChtZXNzYWdlLmdldElkKCkpIHtcbiAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihtZXNzYWdlLmdldElkKCkpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgfHxcbiAgICAgIHRoaXMuaXNPbkJvdHRvbVxuICAgICkge1xuICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gIH07XG4gIC8qKlxuICAgKiBjYWxsYmFjayBmb3IgY29weSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5UZXh0TWVzc2FnZX0gb2JqZWN0XG4gICAqL1xuICBvbkNvcHlNZXNzYWdlID0gKG9iamVjdDogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSA9PiB7XG4gICAgbGV0IHRleHQgPSBvYmplY3QuZ2V0VGV4dCgpO1xuICAgIGlmIChcbiAgICAgICF0aGlzLmRpc2FibGVNZW50aW9ucyAmJlxuICAgICAgb2JqZWN0LmdldE1lbnRpb25lZFVzZXJzICYmXG4gICAgICBvYmplY3QuZ2V0TWVudGlvbmVkVXNlcnMoKS5sZW5ndGhcbiAgICApIHtcbiAgICAgIHRleHQgPSB0aGlzLmdldE1lbnRpb25zVGV4dFdpdGhvdXRTdHlsZShvYmplY3QpO1xuICAgIH1cbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KTtcbiAgfTtcblxuICAvKipcbiAgICogVGhpcyBpcyB0byBlbnN1cmUgdGhhdCB0aGUgdWlkIGRvZXNuJ3QgZ2V0IGNvcGllZCB3aGVuIGNsaWNraW5nIG9uIHRoZSBjb3B5IG9wdGlvbi5cbiAgICogVGhpcyBmdW5jdGlvbiBjaGFuZ2VzIHRoZSB1aWQgcmVnZXggdG8gJ0B1c2VyTmFtZScgd2l0aG91dCBmb3JtYXR0aW5nXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlRleHRNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBnZXRNZW50aW9uc1RleHRXaXRob3V0U3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgY29uc3QgcmVnZXggPSAvPEB1aWQ6KC4qPyk+L2c7XG4gICAgbGV0IG1lc3NhZ2VUZXh0ID0gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgbGV0IG1lc3NhZ2VUZXh0VG1wID0gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgIHdoaWxlIChtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgbGV0IHVzZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtYXRjaFsxXSA9PSBtZW50aW9uZWRVc2Vyc1tpXS5nZXRVaWQoKSkge1xuICAgICAgICAgIHVzZXIgPSBtZW50aW9uZWRVc2Vyc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlVGV4dFRtcC5yZXBsYWNlKFxuICAgICAgICAgIG1hdGNoWzBdLFxuICAgICAgICAgIFwiQFwiICsgdXNlci5nZXROYW1lKCkgKyBcIlwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMobWVzc2FnZVRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZVRleHRUbXA7XG4gIH1cblxuICAvKipcbiAgICogY2FsbGJhY2sgZm9yIGRlbGV0ZU1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBvYmplY3RcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VzXG4gICAqL1xuICBtZXNzYWdlU2VudChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdmFyIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VzO1xuICAgIHZhciBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4gbS5nZXRNdWlkKCkgPT09IG1lc3NhZ2UuZ2V0TXVpZCgpXG4gICAgKTtcbiAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZSk7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gbWVzc2FnZUxpc3Q7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgfVxuICAvKipcbiAgICogY2FsbGJhY2sgZm9yIGVkaXRNZXNzYWdlIG9wdGlvblxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG9iamVjdFxuICAgKi9cbiAgb25FZGl0TWVzc2FnZSA9IChvYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLm5leHQoe1xuICAgICAgbWVzc2FnZTogb2JqZWN0LFxuICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgfSk7XG4gIH07XG4gIHVwZGF0ZU1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBtdWlkOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICBpZiAobXVpZCkge1xuICAgICAgdGhpcy5tZXNzYWdlU2VudChtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICByZW1vdmVNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICB2YXIgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgKG1zZykgPT4gbXNnPy5nZXRJZCgpID09PSBtZXNzYWdlLmdldElkKClcbiAgICAgICk7XG4gICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3R5bGUgY29uZmlndXJhdGlvbiBmb3IgdGhlIHRocmVhZCB2aWV3IG9mIGEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGF0IHRoZSBzdHlsZSBjb25maWd1cmF0aW9uIGlzIGZvci5cbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIHN0eWxlIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuICAgKi9cbiAgZ2V0VGhyZWFkVmlld1N0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLnRocmVhZFJlcGx5SWNvblRpbnQsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhGbG93OlxuICAgICAgICB0aGlzLmlzU2VudEJ5TWUobWVzc2FnZSkgJiYgdGhpcy5hbGlnbm1lbnQgIT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdFxuICAgICAgICAgID8gXCJyb3ctcmV2ZXJzZVwiXG4gICAgICAgICAgOiBcInJvd1wiLFxuICAgICAgYWxpZ25JdGVtczogXCJmbGV4LXN0YXJ0XCIsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlUZXh0Q29sb3IsXG4gICAgICBidXR0b25UZXh0Rm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVRleHRGb250LFxuICAgICAgaWNvbkhlaWdodDogXCIxNXB4XCIsXG4gICAgICBpY29uV2lkdGg6IFwiMTVweFwiLFxuICAgICAgZ2FwOiBcIjRweFwiLFxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIG1lc3NhZ2Ugd2FzIHNlbnQgYnkgdGhlIGN1cnJlbnRseSBsb2dnZWQgaW4gdXNlci5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgbWVzc2FnZSBpcyBzZW50IGJ5IHRoZSBsb2dnZWQgaW4gdXNlciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNTZW50QnlNZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBsZXQgc2VudEJ5TWU6IGJvb2xlYW4gPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKTtcbiAgICByZXR1cm4gc2VudEJ5TWU7XG4gIH1cbiAgZGVsZXRlTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgdmFyIG1lc3NhZ2VJZDogYW55ID0gbWVzc2FnZS5nZXRJZCgpO1xuICAgICAgQ29tZXRDaGF0LmRlbGV0ZU1lc3NhZ2UobWVzc2FnZUlkKVxuICAgICAgICAudGhlbigoZGVsZXRlZE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQubmV4dChkZWxldGVkTWVzc2FnZSk7XG4gICAgICAgICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzY3JvbGxUb0JvdHRvbSA9ICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGwoe1xuICAgICAgICAgIHRvcDogdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCxcbiAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pc09uQm90dG9tID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfSwgMTApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGlmICh0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKSAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQuc3RhbmRhcmRcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNvdW50IG9mIHVucmVhZCByZXBseSBtZXNzYWdlcyBmb3IgYSBnaXZlbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIGZvciB3aGljaCB0aGUgcmVwbHkgY291bnQgaXMgYmVpbmcgdXBkYXRlZC5cbiAgICovXG5cbiAgdXBkYXRlVW5yZWFkUmVwbHlDb3VudCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICBsZXQgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUtleV07XG4gICAgICAgIC8vIGxldCB1bnJlYWRSZXBseUNvdW50ID0gbWVzc2FnZU9iai5nZXRVbnJlYWRSZXBseUNvdW50KClcbiAgICAgICAgLy8gICA/IG1lc3NhZ2VPYmouZ2V0VW5yZWFkUmVwbHlDb3VudCgpXG4gICAgICAgIC8vICAgOiAwO1xuICAgICAgICAvLyB1bnJlYWRSZXBseUNvdW50ID0gdW5yZWFkUmVwbHlDb3VudCArIDE7XG4gICAgICAgIC8vIG1lc3NhZ2VPYmouc2V0VW5yZWFkUmVwbHlDb3VudCh1bnJlYWRSZXBseUNvdW50KTtcbiAgICAgICAgbWVzc2FnZUxpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG1lc3NhZ2VPYmopO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlTGlzdF07XG4gICAgICB9XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBNZXRob2QgdG8gc3Vic2NyaWJlICB0aGUgcmVxdWlyZWQgUnhqcyBldmVudHMgd2hlbiB0aGUgQ29tZXRDaGF0TWVzc2FnZUxpc3RDb21wb25lbnQgbG9hZHNcbiAgICovXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NTaG93UGFuZWwgPSBDb21ldENoYXRVSUV2ZW50cy5jY1Nob3dQYW5lbC5zdWJzY3JpYmUoXG4gICAgICAoZGF0YTogSVBhbmVsKSA9PiB7XG4gICAgICAgIGlmIChkYXRhLmNoaWxkPy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeVZpZXcpIHtcbiAgICAgICAgICB0aGlzLmZldGNoQ29udmVyc2F0aW9uU3VtbWFyeSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc21hcnRSZXBseUNvbmZpZyA9IGRhdGEuY29uZmlndXJhdGlvbiE7XG4gICAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2UhO1xuICAgICAgICB2YXIgc21hcnRSZXBseU9iamVjdCA9IChkYXRhLm1lc3NhZ2UgYXMgYW55KT8ubWV0YWRhdGE/LltcbiAgICAgICAgICBTbWFydFJlcGxpZXNDb25zdGFudHMuaW5qZWN0ZWRcbiAgICAgICAgXT8uZXh0ZW5zaW9ucz8uW1NtYXJ0UmVwbGllc0NvbnN0YW50cy5zbWFydF9yZXBseV07XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudCh0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlKSAmJiBzbWFydFJlcGx5T2JqZWN0ICYmICFzbWFydFJlcGx5T2JqZWN0LmVycm9yKSB7XG4gICAgICAgICAgdGhpcy5lbmFibGVTbWFydFJlcGx5ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NIaWRlUGFuZWwgPSBDb21ldENoYXRVSUV2ZW50cy5jY0hpZGVQYW5lbC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IG51bGw7XG4gICAgICB0aGlzLmVuYWJsZVNtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICB9KTtcbiAgICB0aGlzLmNjTWVzc2FnZVJlYWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZU9iaiA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSk7XG4gICAgICAgICAgLy8gaWYgKG1lc3NhZ2VPYmogJiYgbWVzc2FnZU9iai5nZXRVbnJlYWRSZXBseUNvdW50KCkpIHtcbiAgICAgICAgICAvLyAgIG1lc3NhZ2VPYmouc2V0VW5yZWFkUmVwbHlDb3VudCgwKTtcbiAgICAgICAgICAvLyAgIHRoaXMudXBkYXRlTWVzc2FnZShtZXNzYWdlT2JqKTtcbiAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckFkZGVkLnN1YnNjcmliZShcbiAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgICBpdGVtO1xuICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2VzKGl0ZW0ubWVzc2FnZXMhKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShpdGVtLm1lc3NhZ2UhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID1cbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoaXRlbS5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQgPVxuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAob2JqZWN0OiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKG9iamVjdD8uc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChvYmplY3QubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShvYmplY3QubWVzc2FnZSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50LnN1YnNjcmliZShcbiAgICAgIChvYmo6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBpZiAob2JqLm1lc3NhZ2UpIHtcbiAgICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gb2JqLm1lc3NhZ2UhO1xuICAgICAgICAgIHN3aXRjaCAob2JqLnN0YXR1cykge1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3M6IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuc3VjY2Vzczoge1xuICAgICAgICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICAgICAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgPSBbXTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtZXNzYWdlLCB0cnVlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuZXJyb3I6IHtcbiAgICAgICAgICAgICAgaWYgKCFtZXNzYWdlLmdldFNlbmRlcigpIHx8IHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGUgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZU1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dPbmdvaW5nQ2FsbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlc3Npb25JZCA9IFwiXCI7XG4gICAgICAgIGlmIChjYWxsICYmIE9iamVjdC5rZXlzKGNhbGwpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxBY2NlcHRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsQWNjZXB0ZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICBjbG9zZVNtYXJ0UmVwbHkgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBjbG9zZUNvbnZlcnNhdGlvblN1bW1hcnkgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3VtbWFyeSA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2hvd1N0YXR1c0luZm8obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSB0aGlzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgICFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IHRoaXMuTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFNlbnRBdCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHNob3VsZFNob3dNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgZGlzYWJsZVJlY2VpcHQ6IGJvb2xlYW4sIGhpZGVSZWNlaXB0OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgICFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmXG4gICAgICAhKGRpc2FibGVSZWNlaXB0IHx8IGhpZGVSZWNlaXB0KSAmJlxuICAgICAgKCFtZXNzYWdlLmdldFNlbmRlcigpIHx8IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpID09PSBtZXNzYWdlLmdldFNlbmRlcigpPy5nZXRVaWQoKSkgJiZcbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSAhPT0gdGhpcy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICBtZXNzYWdlLmdldENhdGVnb3J5KCkgIT09IHRoaXMuTWVzc2FnZUNhdGVnb3J5LmNhbGxcbiAgICApO1xuICB9XG4gIFxuICBzZW5kUmVwbHkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgaWYgKHRoaXMuc21hcnRSZXBseUNvbmZpZy5jY1NtYXJ0UmVwbGllc0NsaWNrZWQpIHtcbiAgICAgIHRoaXMuc21hcnRSZXBseUNvbmZpZy5jY1NtYXJ0UmVwbGllc0NsaWNrZWQoXG4gICAgICAgIHJlcGx5LFxuICAgICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlISxcbiAgICAgICAgdGhpcy5vbkVycm9yLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMsXG4gICAgICAgIHRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXNcbiAgICAgICk7XG4gICAgICB0aGlzLmNsb3NlU21hcnRSZXBseSgpO1xuICAgIH1cbiAgfTtcbiAgc2VuZENvbnZlcnNhdGlvblN0YXJ0ZXIgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5uZXh0KHJlcGx5KTtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdGFydGVyID0gZmFsc2U7XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgZmV0Y2hDb252ZXJzYXRpb25TdGFydGVyKCkge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgbGV0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyLmdldFVpZCgpXG4gICAgICA6IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuICAgIENvbWV0Q2hhdC5nZXRDb252ZXJzYXRpb25TdGFydGVyKHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSlcbiAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgIE9iamVjdC5rZXlzKHJlc3BvbnNlKS5mb3JFYWNoKChyZXBseSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlW3JlcGx5XSAmJiByZXNwb25zZVtyZXBseV0gIT0gXCJcIikge1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzLnB1c2gocmVzcG9uc2VbcmVwbHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzICYmXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0Py5sZW5ndGggPD0gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGZldGNoQ29udmVyc2F0aW9uU3VtbWFyeSgpIHtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gdHJ1ZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGxldCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICBsZXQgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IHRoaXMudXNlci5nZXRVaWQoKVxuICAgICAgOiB0aGlzLmdyb3VwLmdldEd1aWQoKTtcblxuICAgIGxldCBhcGlDb25maWd1cmF0aW9uID0gdGhpcy5hcGlDb25maWd1cmF0aW9uO1xuXG4gICAgQ29tZXRDaGF0LmdldENvbnZlcnNhdGlvblN1bW1hcnkocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBhcGlDb25maWd1cmF0aW9uKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKFwiUGFyYW1ldGVyIGlzIG5vdCBhIG51bWJlciFcIik7XG4gICAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtyZXNwb25zZV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSAmJiB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5O1xuICB9XG5cbiAgZ2V0UmVwbGllcygpOiBzdHJpbmdbXSB8IG51bGwge1xuICAgIGxldCBzbWFydFJlcGx5OiBhbnkgPSB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlO1xuICAgIHZhciBzbWFydFJlcGx5T2JqZWN0ID1cbiAgICAgIHNtYXJ0UmVwbHk/Lm1ldGFkYXRhPy5bU21hcnRSZXBsaWVzQ29uc3RhbnRzLmluamVjdGVkXT8uZXh0ZW5zaW9ucz8uW1xuICAgICAgU21hcnRSZXBsaWVzQ29uc3RhbnRzLnNtYXJ0X3JlcGx5XG4gICAgICBdO1xuICAgIGlmIChcbiAgICAgIHNtYXJ0UmVwbHlPYmplY3Q/LnJlcGx5X3Bvc2l0aXZlICYmXG4gICAgICBzbWFydFJlcGx5T2JqZWN0Py5yZXBseV9uZXV0cmFsICYmXG4gICAgICBzbWFydFJlcGx5T2JqZWN0Py5yZXBseV9uZWdhdGl2ZVxuICAgICkge1xuICAgICAgdmFyIHsgcmVwbHlfcG9zaXRpdmUsIHJlcGx5X25ldXRyYWwsIHJlcGx5X25lZ2F0aXZlIH0gPSBzbWFydFJlcGx5T2JqZWN0O1xuICAgICAgcmV0dXJuIFtyZXBseV9wb3NpdGl2ZSwgcmVwbHlfbmV1dHJhbCwgcmVwbHlfbmVnYXRpdmVdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvKipcbiAgICogTWV0aG9kIHRvIHVuc3Vic2NyaWJlIGFsbCB0aGUgUnhqcyBldmVudHMgd2hlbiB0aGUgQ29tZXRDaGF0TWVzc2FnZUxpc3RDb21wb25lbnQgZ2V0cyBkZXN0cm95XG4gICAqL1xuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJKb2luZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPd25lcnNoaXBDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTGl2ZVJlYWN0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjU2hvd1BhbmVsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjSGlkZVBhbmVsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NDYWxsQWNjZXB0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIHRocmVhZCBpY29uIGJhc2VkIG9uIHRoZSBzZW5kZXIgb2YgdGhlIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgZm9yIHdoaWNoIHRoZSB0aHJlYWQgaWNvbiBpcyBiZWluZyBkZXRlcm1pbmVkLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVGhlIGljb24gZm9yIHRoZSB0aHJlYWQuIElmIHRoZSBtZXNzYWdlIHdhcyBzZW50IGJ5IHRoZSBsb2dnZWQgaW4gdXNlciwgcmV0dXJucyAndGhyZWFkUmlnaHRBcnJvdycuIE90aGVyd2lzZSwgcmV0dXJucyAndGhyZWFkSW5kaWNhdG9ySWNvbicuXG4gICAqL1xuICBnZXRUaHJlYWRJY29uQWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGJvb2xlYW4ge1xuICAgIGxldCBzZW50QnlNZTogYm9vbGVhbiA9XG4gICAgICB0aGlzLmlzU2VudEJ5TWUobWVzc2FnZSkgJiZcbiAgICAgIHRoaXMuYWxpZ25tZW50ID09PSBNZXNzYWdlTGlzdEFsaWdubWVudC5zdGFuZGFyZDtcbiAgICByZXR1cm4gc2VudEJ5TWUgPyBmYWxzZSA6IHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIHN0eWxpbmcgcGFydFxuICAgKi9cbiAgZ2V0QnViYmxlRGF0ZVN0eWxlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBpc1NlbnRCeU1lID1cbiAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJiB0aGlzLmFsaWdubWVudCAhPSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIGxldCBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0O1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Q29sb3I6XG4gICAgICAgIHRoaXMubWVzc2FnZUxpc3RTdHlsZS5UaW1lc3RhbXBUZXh0Q29sb3IgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRleHRGb250OlxuICAgICAgICB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuVGltZXN0YW1wVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24zKSxcbiAgICAgIHBhZGRpbmc6IFwiMHB4XCIsXG4gICAgICBkaXNwbGF5OiBcImJsb2NrXCIsXG4gICAgfTtcbiAgfTtcbiAgY2hhdHNMaXN0U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmhlaWdodCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5iYWNrZ3JvdW5kLFxuICAgIH07XG4gIH07XG4gIG1lc3NhZ2VDb250YWluZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS53aWR0aCxcbiAgICB9O1xuICB9O1xuICBlcnJvclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbiAgY29udmVyc2F0aW9uU3RhcnRlclN0YXRlU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfTtcbiAgfTtcblxuICBjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuXG4gIGVtcHR5U3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuICBsb2FkaW5nU3R5bGUgPSB7XG4gICAgaWNvblRpbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8ubG9hZGluZ0ljb25UaW50LFxuICB9O1xuICBjb252ZXJzYXRpb25TdGFydGVyTG9hZGVyID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpY29uVGludDogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG5cbiAgY29udmVyc2F0aW9uU3VtbWFyeUxvYWRlciA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuICBnZXRTY2hlZHVsZXJCdWJibGVTdHlsZSA9IChtZXNzZ2FlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCI1MCVcIixcbiAgICAgIHdpZHRoOiBcIjQ4cHhcIixcbiAgICAgIGhlaWdodDogXCI0OHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgIH0pO1xuICAgIGxldCBsaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcImF1dG9cIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiaW5oZXJpdFwiLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IFwiXCIsXG4gICAgICBob3ZlckJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcblxuICAgIGxldCBjYWxlbmRhclN0eWxlID0gbmV3IENhbGVuZGFyU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkYXlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGRheVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1vbnRoWWVhclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgbW9udGhZZWFyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZGVmYXVsdERhdGVUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgZGlzYWJsZWREYXRlVGV4dEJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpbWV6b25lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0aW1lem9uZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGFycm93QnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTJcbiAgICAgICksXG4gICAgfSk7XG4gICAgbGV0IHRpbWVTbG90U3R5bGUgPSBuZXcgVGltZVNsb3RTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgY2FsZW5kYXJJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpbWV6b25lSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVNsb3RJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGVtcHR5U2xvdFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGVtcHR5U2xvdFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIGRhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgc2VwZXJhdG9yVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHNsb3RCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgc2xvdEJvcmRlcjogXCJub25lXCIsXG4gICAgICBzbG90Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc2xvdFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHNsb3RUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICB9KTtcbiAgICBsZXQgcXVjaWtWaWV3U3R5bGUgPSBuZXcgUXVpY2tWaWV3U3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHN1YnRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbGVhZGluZ0JhclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbGVhZGluZ0JhcldpZHRoOiBcIjRweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgU2NoZWR1bGVyQnViYmxlU3R5bGUoe1xuICAgICAgYXZhdGFyU3R5bGU6IGF2YXRhclN0eWxlLFxuICAgICAgbGlzdEl0ZW1TdHlsZTogbGlzdEl0ZW1TdHlsZSxcbiAgICAgIHF1aWNrVmlld1N0eWxlOiBxdWNpa1ZpZXdTdHlsZSxcbiAgICAgIGRhdGVTZWxlY3RvclN0eWxlOiBjYWxlbmRhclN0eWxlLFxuICAgICAgdGltZVNsb3RTZWxlY3RvclN0eWxlOiB0aW1lU2xvdFN0eWxlLFxuICAgICAgYmFja0J1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzdWdnZXN0ZWRUaW1lQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVCb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKX1gLFxuICAgICAgc3VnZ2VzdGVkVGltZUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJhY2tncm91bmQ6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZEJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVEaXNhYmxlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgc3VnZ2VzdGVkVGltZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBzdWdnZXN0ZWRUaW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dEJvcmRlcjogXCJub25lXCIsXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0Qm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgbW9yZUJ1dHRvblRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dEJvcmRlcjogXCJub25lXCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dEJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBtb3JlQnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIG1vcmVCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIGdvYWxDb21wbGV0aW9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIGVycm9yVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBlcnJvclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgc2NoZWR1bGVCdXR0b25TdHlsZToge1xuICAgICAgICBpY29uSGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgICAgaWNvbldpZHRoOiBcIjIwcHhcIixcbiAgICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkubmFtZSksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgIH0sXG4gICAgICBzZXBlcmF0b3JUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkubmFtZSksXG4gICAgICBzdW1tYXJ5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc3VtbWFyeVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aW1lem9uZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgY2FsZW5kYXJJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGNsb2NrSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgfSk7XG4gIH07XG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIGZvciB0aGUgcmVhY3Rpb24gbGlzdC5cbiAgICogVGhpcyBpbmNsdWRlcyBzdHlsZXMgZm9yIHRoZSBhdmF0YXIsIGxpc3QgaXRlbXMsIGFuZCByZWFjdGlvbiBoaXN0b3J5LlxuICAgKiBAcmV0dXJucyB7UmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbn0gLSBUaGUgY29uZmlndXJlZCByZWFjdGlvbiBsaXN0LlxuICAgKi9cbiAgZ2V0UmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbigpIHtcbiAgICBjb25zdCBhdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiNTAlXCIsXG4gICAgICB3aWR0aDogXCIzNXB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzVweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIG91dGVyVmlld0JvcmRlcldpZHRoOiBcIjBcIixcbiAgICAgIG91dGVyVmlld0JvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBvdXRlclZpZXdCb3JkZXJDb2xvcjogXCJcIixcbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiMFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlYWN0aW9uSGlzdG9yeVN0eWxlID0gbmV3IFJlYWN0aW9uTGlzdFN0eWxlKHtcbiAgICAgIHdpZHRoOiBcIjMyMHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzAwcHhcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBlcnJvckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgc2xpZGVyRW1vamlDb3VudEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBzbGlkZXJFbW9qaUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MSksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGFpbFZpZXdGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGRpdmlkZXJUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2xpZGVyRW1vamlDb3VudENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgYWN0aXZlRW1vamlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKHtcbiAgICAgIGF2YXRhclN0eWxlOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/LmF2YXRhclN0eWxlIHx8XG4gICAgICAgIGF2YXRhclN0eWxlLFxuICAgICAgZXJyb3JJY29uVVJMOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/LmVycm9ySWNvblVSTCB8fFxuICAgICAgICBcIlwiLFxuICAgICAgbGlzdEl0ZW1TdHlsZTpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uPy5saXN0SXRlbVN0eWxlIHx8XG4gICAgICAgIGxpc3RJdGVtU3R5bGUsXG4gICAgICBsb2FkaW5nSWNvblVSTDpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5sb2FkaW5nSWNvblVSTCB8fCBcIlwiLFxuICAgICAgcmVhY3Rpb25MaXN0U3R5bGU6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvblxuICAgICAgICAgID8ucmVhY3Rpb25MaXN0U3R5bGUgfHwgcmVhY3Rpb25IaXN0b3J5U3R5bGUsXG4gICAgICByZWFjdGlvbkl0ZW1DbGlja2VkOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LnJlYWN0aW9uSXRlbUNsaWNrZWQgfHwgdGhpcy5vblJlYWN0aW9uSXRlbUNsaWNrZWQsXG4gICAgICByZWFjdGlvbnNSZXF1ZXN0QnVpbGRlcjpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5yZWFjdGlvbnNSZXF1ZXN0QnVpbGRlciB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIEhhbmRsZXMgd2hlbiBhIHJlYWN0aW9uIGl0ZW0gaXMgY2xpY2tlZC5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb259IHJlYWN0aW9uIC0gVGhlIGNsaWNrZWQgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhlIHJlYWN0aW9uIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAgICovXG5cbiAgb25SZWFjdGlvbkl0ZW1DbGlja2VkPyA9IChcbiAgICByZWFjdGlvbjogQ29tZXRDaGF0LlJlYWN0aW9uLFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApOiB2b2lkID0+IHtcbiAgICBpZiAocmVhY3Rpb24/LmdldFJlYWN0ZWRCeSgpPy5nZXRVaWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpLCBtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBIYW5kbGVzIGFkZGluZyBhIHJlYWN0aW9uIHdoZW4gY2xpY2tlZC5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb25Db3VudH0gcmVhY3Rpb24gLSBUaGUgY2xpY2tlZCByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGUgcmVhY3Rpb24gaXMgYXNzb2NpYXRlZCB3aXRoLlxuICAgKi9cbiAgYWRkUmVhY3Rpb25PbkNsaWNrID0gKFxuICAgIHJlYWN0aW9uOiBDb21ldENoYXQuUmVhY3Rpb25Db3VudCxcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKSA9PiB7XG4gICAgbGV0IG9uUmVhY3RDbGljayA9IHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25DbGljaztcbiAgICBpZiAob25SZWFjdENsaWNrKSB7XG4gICAgICBvblJlYWN0Q2xpY2socmVhY3Rpb24sIG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlYWN0VG9NZXNzYWdlKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpLCBtZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIGZvciB0aGUgcmVhY3Rpb24gaW5mby5cbiAgICogVGhpcyBpbmNsdWRlcyBzdHlsZXMgZm9yIHRoZSByZWFjdGlvbiBpbmZvIGRpc3BsYXkuXG4gICAqIEByZXR1cm5zIHtSZWFjdGlvbkluZm9Db25maWd1cmF0aW9ufSAtIFRoZSBjb25maWd1cmVkIHJlYWN0aW9uIGluZm8uXG4gICAqL1xuXG4gIGdldFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oKSB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkluZm9Db25maWd1cmF0aW9uIHx8IHt9O1xuICAgIGNvbnN0IHJlYWN0aW9uSW5mb1N0eWxlID0gbmV3IFJlYWN0aW9uSW5mb1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmJhY2tncm91bmQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8uYm9yZGVyIHx8IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5ib3JkZXJSYWRpdXMgfHwgXCIxMnB4XCIsXG4gICAgICBlcnJvckljb25UaW50OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5lcnJvckljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5sb2FkaW5nSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBuYW1lc0NvbG9yOlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5uYW1lc0NvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgbmFtZXNGb250OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5uYW1lc0ZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICByZWFjdGVkVGV4dENvbG9yOlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5yZWFjdGVkVGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKFwiZGFya1wiKSxcbiAgICAgIHJlYWN0ZWRUZXh0Rm9udDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ucmVhY3RlZFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgcmVhY3Rpb25Gb250U2l6ZTogY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8ucmVhY3Rpb25Gb250U2l6ZSB8fCBcIjM3cHhcIixcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oe1xuICAgICAgcmVhY3Rpb25JbmZvU3R5bGU6IHJlYWN0aW9uSW5mb1N0eWxlLFxuICAgICAgcmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXI6IGNvbmZpZz8ucmVhY3Rpb25zUmVxdWVzdEJ1aWxkZXIgfHwgdW5kZWZpbmVkLFxuICAgICAgZXJyb3JJY29uVVJMOiBjb25maWc/LmVycm9ySWNvblVSTCB8fCBcIlwiLFxuICAgICAgbG9hZGluZ0ljb25VUkw6IGNvbmZpZz8ubG9hZGluZ0ljb25VUkwgfHwgXCJcIixcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogR2V0IHN0eWxlIG9iamVjdCBiYXNlZCBvbiBtZXNzYWdlIHR5cGUuXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBzdHlsZSBvYmplY3QuXG4gICAqL1xuICBnZXRTdGF0dXNJbmZvU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgLy8gQmFzZSBzdHlsZXMgdGhhdCBhcmUgY29tbW9uIGZvciBib3RoIGNvbmRpdGlvbnNcbiAgICBjb25zdCBiYXNlU3R5bGUgPSB7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1lbmRcIixcbiAgICAgIGdhcDogXCIxcHhcIixcbiAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgfTtcblxuICAgIC8vIElmIG1lc3NhZ2UgdHlwZSBpcyBhdWRpbyBvciB2aWRlb1xuICAgIGlmICh0aGlzLmlzQXVkaW9PclZpZGVvTWVzc2FnZShtZXNzYWdlKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uYmFzZVN0eWxlLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIyMnB4XCIsXG4gICAgICAgIHBhZGRpbmc6IFwiM3B4IDVweFwiLFxuICAgICAgICBwYWRkaW5nVG9wOiBcIjJweFwiLFxuICAgICAgICBwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuICAgICAgICBtYXJnaW5Ub3A6IFwiLTI2cHhcIixcbiAgICAgICAgbWFyZ2luUmlnaHQ6IFwiNnB4XCIsXG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgICAgYWxpZ25TZWxmOiBcImZsZXgtZW5kXCIsXG4gICAgICAgIG1hcmdpbkJvdHRvbTogXCI2cHhcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gU3R5bGUgZm9yIG90aGVyIHR5cGVzIG9mIG1lc3NhZ2VzXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmJhc2VTdHlsZSxcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImZsZXgtZW5kXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtZW5kXCIsXG4gICAgICBwYWRkaW5nOiBcIjBweCA4cHggNHB4IDhweFwiLFxuICAgIH07XG4gIH07XG4gIHdyYXBwZXJTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH07XG4gIGxpc3RTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLnNob3dTbWFydFJlcGx5ID8gXCI5MiVcIiA6IFwiMTAwJVwiLFxuICAgIH07XG4gIH07XG4gIC8qKlxuICAgKiBTdHlsaW5nIGZvciByZWFjdGlvbnMgY29tcG9uZW50XG4gICAqXG4gICAqL1xuICBnZXRSZWFjdGlvbnNXcmFwcGVyU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IGFsaWdubWVudCA9IHRoaXMuc2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpO1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBwYWRkaW5nVG9wOiBcIjVweFwiLFxuICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgbWFyZ2luVG9wOiBcIi05cHhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OlxuICAgICAgICBhbGlnbm1lbnQgPT09IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdCA/IFwiZmxleC1zdGFydFwiIDogXCJmbGV4LWVuZFwiLFxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqIFN0eWxpbmcgZm9yIHVucmVhZCB0aHJlYWQgcmVwbGllc1xuICAgKiBAcmV0dXJucyBMYWJlbFN0eWxlXG4gICAqL1xuICBnZXRVbnJlYWRSZXBsaWVzQ291bnRTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwcHhcIixcbiAgICAgIHdpZHRoOiBcIjE1cHhcIixcbiAgICAgIGhlaWdodDogXCIxNXB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZEJhY2tncm91bmQsXG4gICAgICBjb2xvcjogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZFRleHRDb2xvcixcbiAgICAgIGZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlVbnJlYWRUZXh0Rm9udCxcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIH07XG4gIH07XG4gIGdldFRocmVhZFZpZXdBbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6XG4gICAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJlxuICAgICAgICAgIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkXG4gICAgICAgICAgPyBcImZsZXgtZW5kXCJcbiAgICAgICAgICA6IFwiZmxleC1zdGFydFwiLFxuICAgIH07XG4gIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3dyYXBwZXJcIiBbbmdTdHlsZV09XCJ3cmFwcGVyU3R5bGUoKVwiXG4gICpuZ0lmPVwiIW9wZW5Db250YWN0c1ZpZXdcIj5cblxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19oZWFkZXItdmlld1wiPlxuICAgIDxkaXYgKm5nSWY9XCJoZWFkZXJWaWV3XCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiaGVhZGVyVmlld1wiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0XCIgI2xpc3RTY3JvbGxcbiAgICBbbmdTdHlsZV09XCJ7aGVpZ2h0OiBzaG93U21hcnRSZXBseSB8fCBzaG93Q29udmVyc2F0aW9uU3RhcnRlciB8fCBzaG93Q29udmVyc2F0aW9uU3VtbWFyeSA/ICc5MiUnIDogJzEwMCUnfVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3RvcFwiICN0b3A+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGVjb3JhdG9yLW1lc3NhZ2VcIlxuICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMubG9hZGluZyB8fCBzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgIHx8IHN0YXRlID09IHN0YXRlcy5lbXB0eSBcIlxuICAgICAgW25nU3R5bGVdPVwibWVzc2FnZUNvbnRhaW5lclN0eWxlKClcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2xvYWRpbmctdmlld1wiXG4gICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbG9hZGVyIFtpY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCJcbiAgICAgICAgICBbbG9hZGVyU3R5bGVdPVwibG9hZGluZ1N0eWxlXCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWxvYWRlcj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2N1c3RvbXZpZXctLWxvYWRpbmdcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmxvYWRpbmcgICYmIGxvYWRpbmdTdGF0ZVZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibG9hZGluZ1N0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2Vycm9yLXZpZXdcIlxuICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lcnJvciAgJiYgIWhpZGVFcnJvciBcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbbGFiZWxTdHlsZV09XCJlcnJvclN0eWxlKClcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICYmICFlcnJvclN0YXRlVmlld1wiXG4gICAgICAgICAgW3RleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jdXN0b20tdmlldy0tZXJyb3JcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICAmJiBlcnJvclN0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJlcnJvclN0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2VtcHR5LXZpZXdcIiAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY3VzdG9tLXZpZXctLWVtcHR5XCJcbiAgICAgICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5lbXB0eSAmJiBlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJlbXB0eVN0YXRlVmlld1wiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGVcIlxuICAgICAgKm5nRm9yPVwibGV0IG1lc3NhZ2Ugb2YgbWVzc2FnZXNMaXN0OyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlLWNvbnRhaW5lclwiXG4gICAgICAgICpuZ0lmPVwiKGkgPT09IDApICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpICYmICFoaWRlRGF0ZVNlcGFyYXRvclwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbdGltZXN0YW1wXT1cIm1lc3NhZ2UhLmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtwYXR0ZXJuXT1cIkRhdGVTZXBhcmF0b3JQYXR0ZXJuXCIgW2RhdGVTdHlsZV09XCJkYXRlU2VwYXJhdG9yU3R5bGVcIj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGUtY29udGFpbmVyXCJcbiAgICAgICAgKm5nSWY9XCIoaSA+IDAgJiYgaXNEYXRlRGlmZmVyZW50KG1lc3NhZ2VzTGlzdFtpIC0gMV0/LmdldFNlbnRBdCgpLCBtZXNzYWdlc0xpc3RbaV0/LmdldFNlbnRBdCgpKSkgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KCkgJiYgIWhpZGVEYXRlU2VwYXJhdG9yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW3BhdHRlcm5dPVwiRGF0ZVNlcGFyYXRvclBhdHRlcm5cIiBbZGF0ZVN0eWxlXT1cImRhdGVTZXBhcmF0b3JTdHlsZVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiICNtZXNzYWdlQnViYmxlUmVmXG4gICAgICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGVcbiAgICAgICAgICBbbGVhZGluZ1ZpZXddPVwiIHNob3dBdmF0YXIgPyBsZWFkaW5nVmlldyA6IG51bGxcIlxuICAgICAgICAgIFtib3R0b21WaWV3XT1cImdldEJvdHRvbVZpZXcobWVzc2FnZSlcIlxuICAgICAgICAgIFtzdGF0dXNJbmZvVmlld109XCJzaG93U3RhdHVzSW5mbyhtZXNzYWdlKSA/ICBzdGF0dXNJbmZvVmlldyA6IG51bGxcIlxuICAgICAgICAgIFtoZWFkZXJWaWV3XT1cImdldEhlYWRlclZpZXcobWVzc2FnZSkgfHwgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSA/IGJ1YmJsZUhlYWRlciA6IG51bGxcIlxuICAgICAgICAgIFtmb290ZXJWaWV3XT1cImdldEZvb3RlclZpZXcobWVzc2FnZSkgfHwgcmVhY3Rpb25WaWV3XCJcbiAgICAgICAgICBbY29udGVudFZpZXddPVwiY29udGVudFZpZXdcIiBbdGhyZWFkVmlld109XCJ0aHJlYWRWaWV3XCJcbiAgICAgICAgICBbaWRdPVwibWVzc2FnZT8uZ2V0SWQoKSB8fCBtZXNzYWdlPy5nZXRNdWlkKClcIlxuICAgICAgICAgIFtvcHRpb25zXT1cInNldE1lc3NhZ2VPcHRpb25zKG1lc3NhZ2UpXCJcbiAgICAgICAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgW2FsaWdubWVudF09XCJzZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2NvbnRlbnRWaWV3PlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldENvbnRlbnRWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3JlYWN0aW9uVmlldz5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcmVhY3Rpb25zXG4gICAgICAgICAgICAgICpuZ0lmPVwibWVzc2FnZS5nZXRSZWFjdGlvbnMoKSAmJiBtZXNzYWdlLmdldFJlYWN0aW9ucygpLmxlbmd0aCA+IDAgJiYgIWRpc2FibGVSZWFjdGlvbnNcIlxuICAgICAgICAgICAgICBbbWVzc2FnZU9iamVjdF09XCJnZXRDbG9uZWRSZWFjdGlvbk9iamVjdChtZXNzYWdlKVwiXG4gICAgICAgICAgICAgIFthbGlnbm1lbnRdPVwic2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW3JlYWN0aW9uc1N0eWxlXT1cImdldFJlYWN0aW9uc1N0eWxlKClcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25DbGlja109XCJhZGRSZWFjdGlvbk9uQ2xpY2tcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbl09XCJnZXRSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKClcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbl09XCJnZXRSZWFjdGlvbkluZm9Db25maWd1cmF0aW9uKClcIj48L2NvbWV0Y2hhdC1yZWFjdGlvbnM+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3N0YXR1c0luZm9WaWV3PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLXN0YXR1cy1pbmZvXCJcbiAgICAgICAgICAgICAgW25nU3R5bGVdPVwiZ2V0U3RhdHVzSW5mb1N0eWxlKG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtlbHNlIGJ1YmJsZUZvb3RlclwiPlxuICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUZvb3Rlcj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtZGF0ZVwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLmJvdHRvbSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPlxuICAgICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAgIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+XG4gICAgICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwic2hvdWxkU2hvd01lc3NhZ2UobWVzc2FnZSwgZGlzYWJsZVJlY2VpcHQsIGhpZGVSZWNlaXB0KVwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fcmVjZWlwdFwiPlxuICAgICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAgICAgW3JlY2VpcHRTdHlsZV09XCJnZXRSZWNlaXB0U3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgICAgICBbd2FpdEljb25dPVwid2FpdEljb25cIiBbc2VudEljb25dPVwic2VudEljb25cIlxuICAgICAgICAgICAgICAgICAgICBbZGVsaXZlcmVkSWNvbl09XCJkZWxpdmVyZWRJY29uXCIgW3JlYWRJY29uXT1cInJlYWRJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgW2Vycm9ySWNvbl09XCJlcnJvckljb25cIj48L2NvbWV0Y2hhdC1yZWNlaXB0PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2xlYWRpbmdWaWV3PlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAqbmdJZj1cIiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKVwiPlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbbmFtZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICAgICAgICAgIFtpbWFnZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0QXZhdGFyKClcIj5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUhlYWRlcj5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2Vsc2UgZGVmYXVsdEhlYWRlclwiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0SGVhZGVyPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtaGVhZGVyXCJcbiAgICAgICAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiPlxuICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJsYWJlbFN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS50b3AgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgI3RocmVhZFZpZXc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X190aHJlYWRyZXBsaWVzXCJcbiAgICAgICAgICAgICAgKm5nSWY9XCJtZXNzYWdlPy5nZXRSZXBseUNvdW50KCkgJiYgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KClcIlxuICAgICAgICAgICAgICBbbmdTdHlsZV09XCJnZXRUaHJlYWRWaWV3QWxpZ25tZW50KG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtaWNvbi1idXR0b24gW2ljb25VUkxdPVwidGhyZWFkSW5kaWNhdG9ySWNvblwiXG4gICAgICAgICAgICAgICAgW21pcnJvckljb25dPVwiZ2V0VGhyZWFkSWNvbkFsaWdubWVudChtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldFRocmVhZFZpZXdTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5UaHJlYWRWaWV3KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICBbdGV4dF09J2dldFRocmVhZENvdW50KG1lc3NhZ2UpJz5cbiAgICAgICAgICAgICAgICA8IS0tIDxzcGFuIHNsb3Q9XCJidXR0b25WaWV3XCIgW25nU3R5bGVdPVwiZ2V0VW5yZWFkUmVwbGllc0NvdW50U3R5bGUoKVwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fdW5yZWFkLXRocmVhZFwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIG1lc3NhZ2UuZ2V0VW5yZWFkUmVwbHlDb3VudCgpID4gMFwiPlxuICAgICAgICAgICAgICAgICAge3ttZXNzYWdlLmdldFVucmVhZFJlcGx5Q291bnQoKX19XG4gICAgICAgICAgICAgICAgPC9zcGFuPiAtLT5cblxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDwvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYm90dG9tXCIgI2JvdHRvbT5cbiAgICA8L2Rpdj5cblxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fbWVzc2FnZS1pbmRpY2F0b3JcIlxuICAgICpuZ0lmPVwiVW5yZWFkQ291bnQgJiYgVW5yZWFkQ291bnQubGVuZ3RoID4gMCAmJiAhaXNPbkJvdHRvbVwiXG4gICAgW25nU3R5bGVdPVwie2JvdHRvbTogc2hvd1NtYXJ0UmVwbHkgfHwgZm9vdGVyVmlldyB8fCBzaG93Q29udmVyc2F0aW9uU3RhcnRlciB8fCBzaG93Q29udmVyc2F0aW9uU3VtbWFyeSAgPyAnMjAlJyA6ICcxMyUnfVwiPlxuICAgIDxjb21ldGNoYXQtYnV0dG9uIFt0ZXh0XT1cIm5ld01lc3NhZ2VDb3VudFwiXG4gICAgICBbYnV0dG9uU3R5bGVdPVwidW5yZWFkTWVzc2FnZXNTdHlsZVwiXG4gICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwic2Nyb2xsVG9Cb3R0b20oKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2Zvb3Rlci12aWV3XCIgW25nU3R5bGVdPVwie2hlaWdodDogICdhdXRvJ31cIj5cblxuICAgIDxkaXYgKm5nSWY9XCJmb290ZXJWaWV3O2Vsc2UgZm9vdGVyXCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiZm9vdGVyVmlld1wiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gICAgPG5nLXRlbXBsYXRlICNmb290ZXI+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3NtYXJ0LXJlcGxpZXNcIlxuICAgICAgICAqbmdJZj1cIiFzaG93Q29udmVyc2F0aW9uU3RhcnRlciAmJiBzaG93U21hcnRSZXBseSAmJiBnZXRSZXBsaWVzKClcIj5cbiAgICAgICAgPHNtYXJ0LXJlcGxpZXMgW3NtYXJ0UmVwbHlTdHlsZV09XCJzbWFydFJlcGx5U3R5bGVcIlxuICAgICAgICAgIFtyZXBsaWVzXT1cImdldFJlcGxpZXMoKVwiIChjYy1yZXBseS1jbGlja2VkKT1cInNlbmRSZXBseSgkZXZlbnQpXCJcbiAgICAgICAgICAoY2MtY2xvc2UtY2xpY2tlZCk9XCJjbG9zZVNtYXJ0UmVwbHkoKVwiPlxuICAgICAgICA8L3NtYXJ0LXJlcGxpZXM+XG4gICAgICA8L2Rpdj5cblxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jb252ZXJzYXRpb24tc3RhcnRlcnNcIlxuICAgICAgICAqbmdJZj1cImVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXIgJiYgc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXJcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1haS1jYXJkIFtzdGF0ZV09XCJjb252ZXJzYXRpb25TdGFydGVyU3RhdGVcIlxuICAgICAgICAgIFtsb2FkaW5nU3RhdGVUZXh0XT1cInN0YXJ0ZXJMb2FkaW5nU3RhdGVUZXh0XCJcbiAgICAgICAgICBbZW1wdHlTdGF0ZVRleHRdPVwic3RhcnRlckVtcHR5U3RhdGVUZXh0XCJcbiAgICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgICA8c21hcnQtcmVwbGllc1xuICAgICAgICAgICAgKm5nSWY9XCJjb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPT0gc3RhdGVzLmxvYWRlZCAmJiAhcGFyZW50TWVzc2FnZUlkXCJcbiAgICAgICAgICAgIFtzbWFydFJlcGx5U3R5bGVdPVwiY29udmVyc2F0aW9uU3RhcnRlclN0eWxlXCJcbiAgICAgICAgICAgIFtyZXBsaWVzXT1cImNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzXCIgc2xvdD1cImxvYWRlZFZpZXdcIlxuICAgICAgICAgICAgKGNjLXJlcGx5LWNsaWNrZWQpPVwic2VuZENvbnZlcnNhdGlvblN0YXJ0ZXIoJGV2ZW50KVwiXG4gICAgICAgICAgICBbY2xvc2VJY29uVVJMXT1cIicnXCI+XG4gICAgICAgICAgPC9zbWFydC1yZXBsaWVzPlxuICAgICAgICA8L2NvbWV0Y2hhdC1haS1jYXJkPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2NvbnZlcnNhdGlvbi1zdW1tYXJ5XCJcbiAgICAgICAgKm5nSWY9XCJlbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5ICYmIHNob3dDb252ZXJzYXRpb25TdW1tYXJ5XCI+XG5cbiAgICAgICAgPGNvbWV0Y2hhdC1haS1jYXJkIFtzdGF0ZV09XCJjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGVcIlxuICAgICAgICAgIFtsb2FkaW5nU3RhdGVUZXh0XT1cInN1bW1hcnlMb2FkaW5nU3RhdGVUZXh0XCJcbiAgICAgICAgICBbZW1wdHlTdGF0ZVRleHRdPVwic3VtbWFyeUVtcHR5U3RhdGVUZXh0XCJcbiAgICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIiBbZXJyb3JJY29uVVJMXT1cImFpRXJyb3JJY29uXCJcbiAgICAgICAgICBbZW1wdHlJY29uVVJMXT1cImFpRW1wdHlJY29uXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1wYW5lbFxuICAgICAgICAgICAgKm5nSWY9XCJjb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPT0gc3RhdGVzLmxvYWRlZCAmJiAhcGFyZW50TWVzc2FnZUlkXCJcbiAgICAgICAgICAgIHNsb3Q9XCJsb2FkZWRWaWV3XCIgW3BhbmVsU3R5bGVdPVwiY29udmVyc2F0aW9uU3VtbWFyeVN0eWxlXCJcbiAgICAgICAgICAgIHRpdGxlPVwiQ29udmVyc2F0aW9uIFN1bW1hcnlcIiBbdGV4dF09XCJjb252ZXJzYXRpb25TdW1tYXJ5XCJcbiAgICAgICAgICAgIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlQ29udmVyc2F0aW9uU3VtbWFyeSgpXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcGFuZWw+XG4gICAgICAgIDwvY29tZXRjaGF0LWFpLWNhcmQ+XG5cbiAgICAgIDwvZGl2PlxuXG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9kaXY+XG5cbjwvZGl2PlxuPCEtLSBkZWZhdWx0IGJ1YmJsZXMgLS0+XG48bmctdGVtcGxhdGUgI3RleHRCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAqbmdJZj1cIm1lc3NhZ2U/LnR5cGUgPT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJtZXNzYWdlPy5tZXNzYWdlXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG4gIDxjb21ldGNoYXQtdGV4dC1idWJibGUgKm5nSWY9XCJtZXNzYWdlPy5nZXREZWxldGVkQXQoKVwiXG4gICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cImxvY2FsaXplKCdNRVNTQUdFX0lTX0RFTEVURUQnKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgKm5nSWY9XCIhaXNUcmFuc2xhdGVkKG1lc3NhZ2UpICYmICFnZXRMaW5rUHJldmlldyhtZXNzYWdlKSAmJiAhbWVzc2FnZT8uZGVsZXRlZEF0ICYmIG1lc3NhZ2U/LnR5cGUgIT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCIgW3RleHRdPVwiZ2V0VGV4dE1lc3NhZ2UobWVzc2FnZSlcIlxuICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8bGluay1wcmV2aWV3IFtsaW5rUHJldmlld1N0eWxlXT1cImxpbmtQcmV2aWV3U3R5bGVcIlxuICAgIChjYy1saW5rLWNsaWNrZWQpPVwib3BlbkxpbmtVUkwoJGV2ZW50KVwiXG4gICAgKm5nSWY9XCIhbWVzc2FnZT8uZ2V0RGVsZXRlZEF0KCkgJiYgZ2V0TGlua1ByZXZpZXcobWVzc2FnZSkgJiYgZW5hYmxlTGlua1ByZXZpZXdcIlxuICAgIFt0aXRsZV09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ3RpdGxlJyxtZXNzYWdlKVwiXG4gICAgW2Rlc2NyaXB0aW9uXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygnZGVzY3JpcHRpb24nLG1lc3NhZ2UpXCJcbiAgICBbVVJMXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygndXJsJyxtZXNzYWdlKVwiXG4gICAgW2ltYWdlXT1cImdldExpbmtQcmV2aWV3RGV0YWlscygnaW1hZ2UnLG1lc3NhZ2UpXCJcbiAgICBbZmF2SWNvblVSTF09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ2Zhdmljb24nLG1lc3NhZ2UpXCI+XG4gICAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICAgKm5nSWY9XCIhaXNUcmFuc2xhdGVkKG1lc3NhZ2UpICYmIGdldExpbmtQcmV2aWV3KG1lc3NhZ2UpICYmICFtZXNzYWdlPy5kZWxldGVkQXQgJiYgbWVzc2FnZT8udHlwZSAhPSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiIFt0ZXh0XT1cImdldFRleHRNZXNzYWdlKG1lc3NhZ2UpXCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8L2xpbmstcHJldmlldz5cbiAgPG1lc3NhZ2UtdHJhbnNsYXRpb24tYnViYmxlIFthbGlnbm1lbnRdPVwiZ2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAqbmdJZj1cImlzVHJhbnNsYXRlZChtZXNzYWdlKVwiXG4gICAgW21lc3NhZ2VUcmFuc2xhdGlvblN0eWxlXT1cInNldFRyYW5zbGF0aW9uU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0cmFuc2xhdGVkVGV4dF09XCJpc1RyYW5zbGF0ZWQobWVzc2FnZSlcIlxuICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPlxuICAgIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAgICpuZ0lmPVwiICFtZXNzYWdlPy5kZWxldGVkQXQgJiYgbWVzc2FnZT8udHlwZSAhPSBNZXNzYWdlVHlwZXNDb25zdGFudC5ncm91cE1lbWJlclwiXG4gICAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiIFt0ZXh0XT1cIm1lc3NhZ2U/LnRleHRcIlxuICAgICAgW3RleHRGb3JtYXR0ZXJzXT1cImdldFRleHRGb3JtYXR0ZXJzKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtdGV4dC1idWJibGU+XG5cbiAgPC9tZXNzYWdlLXRyYW5zbGF0aW9uLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2ZpbGVCdWJibGUgbGV0LW1lc3NhZ2U+XG5cbiAgPGNvbWV0Y2hhdC1maWxlLWJ1YmJsZSBbZmlsZVN0eWxlXT1cInNldEZpbGVCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW2Rvd25sb2FkSWNvblVSTF09XCJkb3dubG9hZEljb25VUkxcIiBbc3VidGl0bGVdPVwibG9jYWxpemUoJ1NIQVJFRF9GSUxFJylcIlxuICAgIFt0aXRsZV09XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy5uYW1lOiAnJ1wiXG4gICAgW2ZpbGVVUkxdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsIDogJydcIj48L2NvbWV0Y2hhdC1maWxlLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2F1ZGlvQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtkaXNhYmxlZF09XCJ0cnVlXCJcbiAgICAqbmdJZj1cIm1lc3NhZ2U/LmNhdGVnb3J5ID09IGNhbGxDb25zdGFudCAmJiBtZXNzYWdlPy50eXBlID09IE1lc3NhZ2VUeXBlc0NvbnN0YW50LmF1ZGlvXCJcbiAgICBbaWNvblVSTF09XCJnZXRDYWxsVHlwZUljb24obWVzc2FnZSlcIlxuICAgIFtidXR0b25TdHlsZV09XCJjYWxsU3RhdHVzU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cImdldENhbGxBY3Rpb25NZXNzYWdlKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG4gIDxjb21ldGNoYXQtYXVkaW8tYnViYmxlXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlPy5jYXRlZ29yeSAhPSBjYWxsQ29uc3RhbnRcIlxuICAgIFtzcmNdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsIDogJydcIj5cbiAgPC9jb21ldGNoYXQtYXVkaW8tYnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjdmlkZW9CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtaWNvbi1idXR0b24gW2Rpc2FibGVkXT1cInRydWVcIlxuICAgICpuZ0lmPVwibWVzc2FnZT8uY2F0ZWdvcnkgPT0gY2FsbENvbnN0YW50ICYmIG1lc3NhZ2U/LnR5cGUgPT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQudmlkZW9cIlxuICAgIFtpY29uVVJMXT1cImdldENhbGxUeXBlSWNvbihtZXNzYWdlKVwiXG4gICAgW2J1dHRvblN0eWxlXT1cImNhbGxTdGF0dXNTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwiZ2V0Q2FsbEFjdGlvbk1lc3NhZ2UobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cblxuICA8Y29tZXRjaGF0LXZpZGVvLWJ1YmJsZVxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZT8uY2F0ZWdvcnkgIT0gY2FsbENvbnN0YW50XCJcbiAgICBbdmlkZW9TdHlsZV09XCJ2aWRlb0J1YmJsZVN0eWxlXCJcbiAgICBbc3JjXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybCA6ICcnXCJcbiAgICBbcG9zdGVyXT1cIiBnZXRJbWFnZVRodW1ibmFpbChtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXZpZGVvLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2ltYWdlQnViYmxlIGxldC1tZXNzYWdlPlxuICA8aW1hZ2UtbW9kZXJhdGlvbiAoY2Mtc2hvdy1kaWFsb2cpPVwib3Blbldhcm5pbmdEaWFsb2coJGV2ZW50KVwiXG4gICAgKm5nSWY9XCIhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBlbmFibGVJbWFnZU1vZGVyYXRpb25cIiBbbWVzc2FnZV09XCJtZXNzYWdlXCJcbiAgICBbaW1hZ2VNb2RlcmF0aW9uU3R5bGVdPVwiaW1hZ2VNb2RlcmF0aW9uU3R5bGVcIj5cbiAgICA8Y29tZXRjaGF0LWltYWdlLWJ1YmJsZSAoY2MtaW1hZ2UtY2xpY2tlZCk9XCJvcGVuSW1hZ2VJbkZ1bGxTY3JlZW4obWVzc2FnZSlcIlxuICAgICAgW2ltYWdlU3R5bGVdPVwiaW1hZ2VCdWJibGVTdHlsZVwiIFtzcmNdPVwiIGdldEltYWdlVGh1bWJuYWlsKG1lc3NhZ2UpXCJcbiAgICAgIFtwbGFjZWhvbGRlckltYWdlXT1cInBsYWNlaG9sZGVySWNvblVSTFwiPjwvY29tZXRjaGF0LWltYWdlLWJ1YmJsZT5cbiAgPC9pbWFnZS1tb2RlcmF0aW9uPlxuICA8Y29tZXRjaGF0LWltYWdlLWJ1YmJsZSBbaW1hZ2VTdHlsZV09XCJpbWFnZUJ1YmJsZVN0eWxlXCJcbiAgICAoY2MtaW1hZ2UtY2xpY2tlZCk9XCJvcGVuSW1hZ2VJbkZ1bGxTY3JlZW4obWVzc2FnZSlcIlxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgIWVuYWJsZUltYWdlTW9kZXJhdGlvblwiXG4gICAgW3NyY109XCIgZ2V0SW1hZ2VUaHVtYm5haWwobWVzc2FnZSlcIlxuICAgIFtwbGFjZWhvbGRlckltYWdlXT1cInBsYWNlaG9sZGVySWNvblVSTFwiPjwvY29tZXRjaGF0LWltYWdlLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2Zvcm1CdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtZm9ybS1idWJibGUgW21lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2Zvcm1CdWJibGVTdHlsZV09XCJnZXRGb3JtTWVzc2FnZUJ1YmJsZVN0eWxlKClcIj48L2NvbWV0Y2hhdC1mb3JtLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2NhcmRCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtY2FyZC1idWJibGUgW21lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2NhcmRCdWJibGVTdHlsZV09XCJnZXRDYXJkTWVzc2FnZUJ1YmJsZVN0eWxlKClcIj48L2NvbWV0Y2hhdC1jYXJkLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2N1c3RvbVRleHRCdWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNzdGlja2VyQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWltYWdlLWJ1YmJsZSBbc3JjXT1cImdldFN0aWNrZXIobWVzc2FnZSlcIlxuICAgIFtpbWFnZVN0eWxlXT1cImltYWdlQnViYmxlU3R5bGVcIj48L2NvbWV0Y2hhdC1pbWFnZS1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3doaXRlYm9hcmRCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlIFtoaWRlU2VwYXJhdG9yXT1cImZhbHNlXCJcbiAgICBbaWNvbkFsaWdubWVudF09XCJkb2N1bWVudEJ1YmJsZUFsaWdubWVudFwiXG4gICAgW2RvY3VtZW50U3R5bGVdPVwiZG9jdW1lbnRCdWJibGVTdHlsZVwiIFtVUkxdPVwiZ2V0V2hpdGVib2FyZERvY3VtZW50KG1lc3NhZ2UpXCJcbiAgICBbY2NDbGlja2VkXT1cImxhdW5jaENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkRG9jdW1lbnRcIlxuICAgIFtpY29uVVJMXT1cIndoaXRlYm9hcmRJY29uVVJMXCIgW3RpdGxlXT1cIndoaXRlYm9hcmRUaXRsZVwiXG4gICAgW2J1dHRvblRleHRdPVwid2hpdGVib2FyZEJ1dHRvblRleHRcIlxuICAgIFtzdWJ0aXRsZV09XCJ3aGl0ZWJvYXJkU3ViaXRsZVwiPjwvY29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjZG9jdW1lbnRCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlIFtoaWRlU2VwYXJhdG9yXT1cImZhbHNlXCJcbiAgICBbaWNvbkFsaWdubWVudF09XCJkb2N1bWVudEJ1YmJsZUFsaWdubWVudFwiXG4gICAgW2RvY3VtZW50U3R5bGVdPVwiZG9jdW1lbnRCdWJibGVTdHlsZVwiIFtVUkxdPVwiZ2V0V2hpdGVib2FyZERvY3VtZW50KG1lc3NhZ2UpXCJcbiAgICBbY2NDbGlja2VkXT1cImxhdW5jaENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkRG9jdW1lbnRcIlxuICAgIFtpY29uVVJMXT1cImRvY3VtZW50SWNvblVSTFwiIFt0aXRsZV09XCJkb2N1bWVudFRpdGxlXCJcbiAgICBbYnV0dG9uVGV4dF09XCJkb2N1bWVudEJ1dHRvblRleHRcIlxuICAgIFtzdWJ0aXRsZV09XCJkb2N1bWVudFN1Yml0bGVcIj48L2NvbWV0Y2hhdC1kb2N1bWVudC1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI2RpcmVjdENhbGxpbmcgbGV0LW1lc3NhZ2U+XG4gIDxjb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlIFtoaWRlU2VwYXJhdG9yXT1cInRydWVcIlxuICAgIFtpY29uQWxpZ25tZW50XT1cImNhbGxCdWJibGVBbGlnbm1lbnRcIlxuICAgIFtkb2N1bWVudFN0eWxlXT1cImdldENhbGxCdWJibGVTdHlsZShtZXNzYWdlKVwiIFtVUkxdPVwiZ2V0U2Vzc2lvbklkKG1lc3NhZ2UpXCJcbiAgICBbY2NDbGlja2VkXT1cImdldFN0YXJ0Q2FsbEZ1bmN0aW9uKG1lc3NhZ2UpXCIgW2ljb25VUkxdPVwiZGlyZWN0Q2FsbEljb25VUkxcIlxuICAgIFt0aXRsZV09XCJnZXRDYWxsQnViYmxlVGl0bGUobWVzc2FnZSlcIiBbYnV0dG9uVGV4dF09XCJqb2luQ2FsbEJ1dHRvblRleHRcIlxuICAgICpuZ0lmPVwibWVzc2FnZS5jYXRlZ29yeSA9PSAnY3VzdG9tJ1wiPjwvY29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjc2NoZWR1bGVyQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LXNjaGVkdWxlci1idWJibGUgW3NjaGVkdWxlck1lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2xvZ2dlZEluVXNlcl09XCJsb2dnZWRJblVzZXJcIlxuICAgIFtzY2hlZHVsZXJCdWJibGVTdHlsZV09XCJnZXRTY2hlZHVsZXJCdWJibGVTdHlsZShtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXNjaGVkdWxlci1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3BvbGxCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxwb2xscy1idWJibGUgW3BvbGxTdHlsZV09XCJwb2xsQnViYmxlU3R5bGVcIlxuICAgIFtwb2xsUXVlc3Rpb25dPVwiZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZSwncXVlc3Rpb24nKVwiXG4gICAgW3BvbGxJZF09XCJnZXRQb2xsQnViYmxlRGF0YShtZXNzYWdlLCdpZCcpXCIgW2xvZ2dlZEluVXNlcl09XCJsb2dnZWRJblVzZXJcIlxuICAgIFtzZW5kZXJVaWRdPVwiZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZSlcIlxuICAgIFttZXRhZGF0YV09XCJtZXNzYWdlPy5tZXRhZGF0YVwiPjwvcG9sbHMtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuXG48IS0tIHRocmVhZCBidWJibGUgdmlldyAtLT5cbjxuZy10ZW1wbGF0ZSAjdGhyZWFkTWVzc2FnZUJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGRpdiAqbmdJZj1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuICA8Y29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlICpuZ0lmPVwiIWdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIlxuICAgIFtib3R0b21WaWV3XT1cImdldEJvdHRvbVZpZXcobWVzc2FnZSlcIlxuICAgIFtzdGF0dXNJbmZvVmlld109XCJzaG93U3RhdHVzSW5mbyhtZXNzYWdlKSA/ICBzdGF0dXNJbmZvVmlldyA6IG51bGxcIlxuICAgIFtsZWFkaW5nVmlld109XCIgc2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiIFtoZWFkZXJWaWV3XT1cImJ1YmJsZUhlYWRlclwiXG4gICAgW2Zvb3RlclZpZXddPVwiZ2V0Rm9vdGVyVmlldyhtZXNzYWdlKVwiIFtjb250ZW50Vmlld109XCJjb250ZW50Vmlld1wiXG4gICAgW2lkXT1cIm1lc3NhZ2U/LmdldElkKCkgfHwgbWVzc2FnZT8uZ2V0TXVpZCgpXCJcbiAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW2FsaWdubWVudF09XCJ0aHJlYWRlZEFsaWdubWVudFwiPlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjc3RhdHVzSW5mb1ZpZXc+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtc3RhdHVzLWluZm9cIlxuICAgICAgICBbbmdTdHlsZV09XCJnZXRTdGF0dXNJbmZvU3R5bGUobWVzc2FnZSlcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO2Vsc2UgYnViYmxlRm9vdGVyXCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlRm9vdGVyPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1kYXRlXCJcbiAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0uYm90dG9tICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCIgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICpuZ0lmPVwic2hvdWxkU2hvd01lc3NhZ2UobWVzc2FnZSwgZGlzYWJsZVJlY2VpcHQsIGhpZGVSZWNlaXB0KVwiXG4gICAgICAgICAgICBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fcmVjZWlwdFwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW3JlY2VpcHRTdHlsZV09XCJnZXRSZWNlaXB0U3R5bGUobWVzc2FnZSlcIiBbd2FpdEljb25dPVwid2FpdEljb25cIlxuICAgICAgICAgICAgICBbc2VudEljb25dPVwic2VudEljb25cIiBbZGVsaXZlcmVkSWNvbl09XCJcIlxuICAgICAgICAgICAgICBbcmVhZEljb25dPVwiZGVsaXZlcmVkSWNvblwiXG4gICAgICAgICAgICAgIFtlcnJvckljb25dPVwiZXJyb3JJY29uXCI+PC9jb21ldGNoYXQtcmVjZWlwdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNsZWFkaW5nVmlldz5cbiAgICAgIDxkaXZcbiAgICAgICAgKm5nSWY9XCIgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKVwiPlxuICAgICAgICA8Y29tZXRjaGF0LWF2YXRhciBbbmFtZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgICAgICAgIFtpbWFnZV09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0QXZhdGFyKClcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtYXZhdGFyPlxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUhlYWRlcj5cbiAgICAgIDxkaXYgKm5nSWY9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2Vsc2UgZGVmYXVsdEhlYWRlclwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRIZWFkZXJWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0SGVhZGVyPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtaGVhZGVyXCJcbiAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSkgJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW3RleHRdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgICBbbGFiZWxTdHlsZV09XCJsYWJlbFN0eWxlXCI+PC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJnZXRCdWJibGVEYXRlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICAgICAgKm5nSWY9XCJ0aW1lc3RhbXBBbGlnbm1lbnQgPT0gdGltZXN0YW1wRW51bS50b3AgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG5cblxuPCEtLSAgLS0+XG48Y29tZXRjaGF0LXBvcG92ZXIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIiAjcG9wb3ZlclJlZlxuICBbcGxhY2VtZW50XT1cImtleWJvYXJkQWxpZ25tZW50XCI+XG4gIDxjb21ldGNoYXQtZW1vamkta2V5Ym9hcmQgKGNjLWVtb2ppLWNsaWNrZWQpPVwiYWRkUmVhY3Rpb24oJGV2ZW50KVwiXG4gICAgc2xvdD1cImNvbnRlbnRcIlxuICAgIFtlbW9qaUtleWJvYXJkU3R5bGVdPVwiZW1vamlLZXlib2FyZFN0eWxlXCI+PC9jb21ldGNoYXQtZW1vamkta2V5Ym9hcmQ+XG48L2NvbWV0Y2hhdC1wb3BvdmVyPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cIm9wZW5Db25maXJtRGlhbG9nXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCInJ1wiIFttZXNzYWdlVGV4dF09XCJ3YXJuaW5nVGV4dFwiXG4gICAgKGNjLWNvbmZpcm0tY2xpY2tlZCk9XCJvbkNvbmZpcm1DbGljaygpXCIgW2NhbmNlbEJ1dHRvblRleHRdPVwiY2FuY2VsVGV4dFwiXG4gICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cImNvbmZpcm1UZXh0XCIgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgW2NvbmZpcm1EaWFsb2dTdHlsZV09XCJjb25maXJtRGlhbG9nU3R5bGVcIj5cblxuICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbjwvY29tZXRjaGF0LWJhY2tkcm9wPlxuPGNvbWV0Y2hhdC1mdWxsLXNjcmVlbi12aWV3ZXIgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VJbWFnZUluRnVsbFNjcmVlbigpXCJcbiAgKm5nSWY9XCJvcGVuRnVsbHNjcmVlblZpZXdcIiBbVVJMXT1cImltYWdldXJsVG9PcGVuXCJcbiAgW2Nsb3NlSWNvblVSTF09XCJjbG9zZUljb25VUkxcIiBbZnVsbFNjcmVlblZpZXdlclN0eWxlXT1cImZ1bGxTY3JlZW5WaWV3ZXJTdHlsZVwiPlxuXG48L2NvbWV0Y2hhdC1mdWxsLXNjcmVlbi12aWV3ZXI+XG5cbjwhLS0gb25nb2luZyBjYWxsc2NyZWVuIGZvciBkaXJlY3QgY2FsbCAtLT5cbjxjb21ldGNoYXQtb25nb2luZy1jYWxsICpuZ0lmPVwic2hvd09uZ29pbmdDYWxsXCJcbiAgW2NhbGxTZXR0aW5nc0J1aWxkZXJdPVwiZ2V0Q2FsbEJ1aWxkZXIoKVwiIFtvbmdvaW5nQ2FsbFN0eWxlXT1cIm9uZ29pbmdDYWxsU3R5bGVcIlxuICBbc2Vzc2lvbklEXT1cInNlc3Npb25JZFwiPjwvY29tZXRjaGF0LW9uZ29pbmctY2FsbD5cbjwhLS0gbWVzc2FnZSBpbmZvcm1hdGlvbiB2aWV3IC0tPlxuPCEtLSB0aHJlYWQgYnViYmxlIHZpZXcgLS0+XG48bmctdGVtcGxhdGUgI21lc3NhZ2VpbmZvQnViYmxlIGxldC1tZXNzYWdlPlxuICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgIDxuZy1jb250YWluZXJcbiAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1idWJibGUgKm5nSWY9XCIhZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiXG4gICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgW3N0YXR1c0luZm9WaWV3XT1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpXCJcbiAgICBbZm9vdGVyVmlld109XCJnZXRGb290ZXJWaWV3KG1lc3NhZ2UpXCJcbiAgICBbbGVhZGluZ1ZpZXddPVwic2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiIFtoZWFkZXJWaWV3XT1cImJ1YmJsZUhlYWRlclwiXG4gICAgW2NvbnRlbnRWaWV3XT1cImNvbnRlbnRWaWV3XCIgW2lkXT1cIm1lc3NhZ2U/LmdldElkKCkgfHwgbWVzc2FnZT8uZ2V0TXVpZCgpXCJcbiAgICBbbWVzc2FnZUJ1YmJsZVN0eWxlXT1cInNldE1lc3NhZ2VCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW2FsaWdubWVudF09XCJtZXNzYWdlSW5mb0FsaWdubWVudFwiPlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG4gICAgICA8ZGl2XG4gICAgICAgICpuZ0lmPVwiIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSlcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1hdmF0YXIgW25hbWVdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgICAgICBbaW1hZ2VdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldEF2YXRhcigpXCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWF2YXRhcj5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNidWJibGVIZWFkZXI+XG4gICAgICA8ZGl2ICpuZ0lmPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtlbHNlIGRlZmF1bHRIZWFkZXJcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdEhlYWRlcj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLWhlYWRlclwiXG4gICAgICAgICAgKm5nSWY9XCJtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGxcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwibGFiZWxTdHlsZVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiXG4gICAgICAgICAgICBbdGltZXN0YW1wXT1cIm1lc3NhZ2U/LmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0udG9wICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cIm9wZW5NZXNzYWdlSW5mb1BhZ2VcIiBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCI+XG4gIDxjb21ldGNoYXQtbWVzc2FnZS1pbmZvcm1hdGlvblxuICAgIFtjbG9zZUljb25VUkxdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5jbG9zZUljb25VUkxcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubG9hZGluZ1N0YXRlVmlld1wiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uZXJyb3JTdGF0ZVZpZXdcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubGlzdEl0ZW1TdHlsZVwiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uZW1wdHlTdGF0ZVZpZXdcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICBbcmVhZEljb25dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5yZWFkSWNvblwiXG4gICAgW2RlbGl2ZXJlZEljb25dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5kZWxpdmVyZWRJY29uXCJcbiAgICBbb25FcnJvcl09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLm9uRXJyb3JcIlxuICAgIFtTdWJ0aXRsZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5zdWJ0aXRsZVZpZXdcIlxuICAgIFtyZWNlaXB0RGF0ZVBhdHRlcm5dPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5yZWNlaXB0RGF0ZVBhdHRlcm5cIlxuICAgIFtsaXN0SXRlbVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXcgXCJcbiAgICBbbWVzc2FnZUluZm9ybWF0aW9uU3R5bGVdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5tZXNzYWdlSW5mb3JtYXRpb25TdHlsZVwiXG4gICAgW29uQ2xvc2VdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5vbkNsb3NlID8/ICBjbG9zZU1lc3NhZ2VJbmZvUGFnZVwiXG4gICAgW2J1YmJsZVZpZXddPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5idWJibGVWaWV3ID8/IG1lc3NhZ2VpbmZvQnViYmxlXCJcbiAgICBbbWVzc2FnZV09XCJtZXNzYWdlSW5mb09iamVjdFwiPlxuXG4gIDwvY29tZXRjaGF0LW1lc3NhZ2UtaW5mb3JtYXRpb24+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==