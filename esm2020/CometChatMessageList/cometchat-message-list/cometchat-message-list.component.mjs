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
        this.newMessageIndicatorIconUrl = "";
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
        this.newMessageIndicatorStyle = {};
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
                                this.newMessageCount = this.UnreadCount.length + " " + countText;
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
                        this.newMessageCount = this.UnreadCount.length + " " + countText;
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
                        this.newMessageCount = this.UnreadCount.length + " " + countText;
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
        this.newMessageIndicatorIconUrl = this.newMessageIndicatorIconUrl || 'assets/new-message-icon.svg';
        this.emojiKeyboardStyle = defaultEmojiStyle;
        this.unreadMessagesStyle = {
            display: "flex",
            justifyContent: "center",
            padding: "8px",
            gap: "4px",
            buttonIconTint: this.newMessageIndicatorStyle.iconTint ?? this.themeService.theme.palette.getAccent("dark"),
            iconHeight: this.newMessageIndicatorStyle.iconHeight ?? "12px",
            iconWidth: this.newMessageIndicatorStyle.iconWidth ?? "12px",
            height: this.newMessageIndicatorStyle.height ?? "100%",
            width: this.newMessageIndicatorStyle.width ?? "100%",
            border: this.newMessageIndicatorStyle.border ?? "none",
            borderRadius: this.newMessageIndicatorStyle.borderRadius ?? "12px",
            background: this.newMessageIndicatorStyle.background ?? this.themeService.theme.palette.getPrimary(),
            buttonTextColor: this.newMessageIndicatorStyle.textColor ?? this.themeService.theme.palette.getAccent("dark"),
            buttonTextFont: this.newMessageIndicatorStyle.textFont ?? fontHelper(this.themeService.theme.typography.text3),
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
CometChatMessageListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageListComponent, selector: "cometchat-message-list", inputs: { hideError: "hideError", hideDateSeparator: "hideDateSeparator", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateView: "emptyStateView", errorStateText: "errorStateText", emptyStateText: "emptyStateText", loadingIconURL: "loadingIconURL", user: "user", group: "group", disableReceipt: "disableReceipt", hideReceipt: "hideReceipt", disableSoundForMessages: "disableSoundForMessages", customSoundForMessages: "customSoundForMessages", readIcon: "readIcon", deliveredIcon: "deliveredIcon", sentIcon: "sentIcon", waitIcon: "waitIcon", errorIcon: "errorIcon", aiErrorIcon: "aiErrorIcon", aiEmptyIcon: "aiEmptyIcon", alignment: "alignment", showAvatar: "showAvatar", datePattern: "datePattern", timestampAlignment: "timestampAlignment", DateSeparatorPattern: "DateSeparatorPattern", templates: "templates", messagesRequestBuilder: "messagesRequestBuilder", newMessageIndicatorText: "newMessageIndicatorText", newMessageIndicatorIconUrl: "newMessageIndicatorIconUrl", scrollToBottomOnNewMessages: "scrollToBottomOnNewMessages", thresholdValue: "thresholdValue", unreadMessageThreshold: "unreadMessageThreshold", reactionsConfiguration: "reactionsConfiguration", disableReactions: "disableReactions", emojiKeyboardStyle: "emojiKeyboardStyle", apiConfiguration: "apiConfiguration", onThreadRepliesClick: "onThreadRepliesClick", headerView: "headerView", footerView: "footerView", parentMessageId: "parentMessageId", threadIndicatorIcon: "threadIndicatorIcon", avatarStyle: "avatarStyle", newMessageIndicatorStyle: "newMessageIndicatorStyle", backdropStyle: "backdropStyle", dateSeparatorStyle: "dateSeparatorStyle", messageListStyle: "messageListStyle", onError: "onError", messageInformationConfiguration: "messageInformationConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, viewQueries: [{ propertyName: "listScroll", first: true, predicate: ["listScroll"], descendants: true }, { propertyName: "bottom", first: true, predicate: ["bottom"], descendants: true }, { propertyName: "top", first: true, predicate: ["top"], descendants: true }, { propertyName: "textBubble", first: true, predicate: ["textBubble"], descendants: true }, { propertyName: "threadMessageBubble", first: true, predicate: ["threadMessageBubble"], descendants: true }, { propertyName: "fileBubble", first: true, predicate: ["fileBubble"], descendants: true }, { propertyName: "audioBubble", first: true, predicate: ["audioBubble"], descendants: true }, { propertyName: "videoBubble", first: true, predicate: ["videoBubble"], descendants: true }, { propertyName: "imageBubble", first: true, predicate: ["imageBubble"], descendants: true }, { propertyName: "formBubble", first: true, predicate: ["formBubble"], descendants: true }, { propertyName: "cardBubble", first: true, predicate: ["cardBubble"], descendants: true }, { propertyName: "stickerBubble", first: true, predicate: ["stickerBubble"], descendants: true }, { propertyName: "documentBubble", first: true, predicate: ["documentBubble"], descendants: true }, { propertyName: "whiteboardBubble", first: true, predicate: ["whiteboardBubble"], descendants: true }, { propertyName: "popoverRef", first: true, predicate: ["popoverRef"], descendants: true }, { propertyName: "directCalling", first: true, predicate: ["directCalling"], descendants: true }, { propertyName: "schedulerBubble", first: true, predicate: ["schedulerBubble"], descendants: true }, { propertyName: "pollBubble", first: true, predicate: ["pollBubble"], descendants: true }, { propertyName: "messageBubbleRef", predicate: ["messageBubbleRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20px' : '10px'}\">\n    <cometchat-icon-button [iconURL]=\"newMessageIndicatorIconUrl\" [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-icon-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"getActionMessage(message)\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboard\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\" (cc-popover-outside-clicked)=\"onEmojiKeyboardClosed()\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}cometchat-document-bubble{width:100%;overflow:hidden}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"], components: [{ type: i2.CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: ["messageBubbleStyle", "alignment", "options", "id", "leadingView", "headerView", "replyView", "contentView", "threadView", "footerView", "bottomView", "statusInfoView", "moreIconURL", "topMenuSize"] }, { type: i3.CometChatOngoingCallComponent, selector: "cometchat-ongoing-call", inputs: ["ongoingCallStyle", "resizeIconHoverText", "sessionID", "minimizeIconURL", "maximizeIconURL", "callSettingsBuilder", "callWorkflow", "onError"] }, { type: i4.CometChatMessageInformationComponent, selector: "cometchat-message-information", inputs: ["closeIconURL", "message", "title", "template", "bubbleView", "subtitleView", "listItemView", "receiptDatePattern", "onError", "messageInformationStyle", "readIcon", "deliveredIcon", "onClose", "listItemStyle", "emptyStateText", "errorStateText", "emptyStateView", "loadingIconURL", "loadingStateView", "errorStateView"] }], directives: [{ type: i5.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i5.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i5.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }, { type: i5.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageListComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-list", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-list__wrapper\" [ngStyle]=\"wrapperStyle()\"\n  *ngIf=\"!openContactsView\">\n\n  <div class=\"cc-message-list__header-view\">\n    <div *ngIf=\"headerView\">\n      <ng-container *ngTemplateOutlet=\"headerView\">\n      </ng-container>\n    </div>\n  </div>\n  <div class=\"cc-message-list\" #listScroll\n    [ngStyle]=\"{height: showSmartReply || showConversationStarter || showConversationSummary ? '92%' : '100%'}\">\n    <div class=\"cc-message-list__top\" #top>\n    </div>\n    <div class=\"cc-message-list__decorator-message\"\n      *ngIf=\"state == states.loading || state == states.error  || state == states.empty \"\n      [ngStyle]=\"messageContainerStyle()\">\n      <div class=\"cc-message-list__loading-view\"\n        *ngIf=\"state == states.loading \">\n        <cometchat-loader [iconURL]=\"loadingIconURL\"\n          [loaderStyle]=\"loadingStyle\">\n        </cometchat-loader>\n        <span class=\"cc-message-list__customview--loading\"\n          *ngIf=\"state == states.loading  && loadingStateView\">\n          <ng-container *ngTemplateOutlet=\"loadingStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__error-view\"\n        *ngIf=\"state == states.error  && !hideError \">\n        <cometchat-label [labelStyle]=\"errorStyle()\"\n          *ngIf=\"state == states.error && !errorStateView\"\n          [text]=\"errorStateText\">\n        </cometchat-label>\n        <span class=\"cc-message-list__custom-view--error\"\n          *ngIf=\"state == states.error  && errorStateView\">\n          <ng-container *ngTemplateOutlet=\"errorStateView\">\n          </ng-container>\n        </span>\n      </div>\n      <div class=\"cc-message-list__empty-view\" *ngIf=\"state == states.empty\">\n        <span class=\"cc-message-list__custom-view--empty\"\n          *ngIf=\"state == states.empty && emptyStateView\">\n          <ng-container *ngTemplateOutlet=\"emptyStateView\">\n          </ng-container>\n        </span>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bubble\"\n      *ngFor=\"let message of messagesList; let i = index\">\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i === 0) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message!.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div class=\"cc-message-list__date-container\"\n        *ngIf=\"(i > 0 && isDateDifferent(messagesList[i - 1]?.getSentAt(), messagesList[i]?.getSentAt())) && message?.getSentAt() && !hideDateSeparator\">\n        <span class=\"cc-message-list__date\">\n          <cometchat-date [timestamp]=\"message?.getSentAt()\"\n            [pattern]=\"DateSeparatorPattern\" [dateStyle]=\"dateSeparatorStyle\">\n          </cometchat-date>\n        </span>\n      </div>\n      <div *ngIf=\"getBubbleWrapper(message)\">\n        <ng-container\n          *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <div *ngIf=\"!getBubbleWrapper(message)\" #messageBubbleRef\n        [id]=\"message?.getId()\">\n        <cometchat-message-bubble\n          [leadingView]=\" showAvatar ? leadingView : null\"\n          [bottomView]=\"getBottomView(message)\"\n          [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n          [headerView]=\"getHeaderView(message) || message?.getCategory() != MessageCategory.action && showHeaderTitle(message) ? bubbleHeader : null\"\n          [footerView]=\"getFooterView(message) || reactionView\"\n          [contentView]=\"contentView\" [threadView]=\"threadView\"\n          [id]=\"message?.getId() || message?.getMuid()\"\n          [options]=\"setMessageOptions(message)\"\n          [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n          [alignment]=\"setBubbleAlignment(message)\">\n          <ng-template #contentView>\n            <ng-container\n              *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n            </ng-container>\n          </ng-template>\n          <ng-template #reactionView>\n            <cometchat-reactions\n              *ngIf=\"message.getReactions() && message.getReactions().length > 0 && !disableReactions\"\n              [messageObject]=\"getClonedReactionObject(message)\"\n              [alignment]=\"setBubbleAlignment(message)\"\n              [reactionsStyle]=\"getReactionsStyle()\"\n              [reactionClick]=\"addReactionOnClick\"\n              [reactionListConfiguration]=\"getReactionListConfiguration()\"\n              [reactionInfoConfiguration]=\"getReactionInfoConfiguration()\"></cometchat-reactions>\n          </ng-template>\n          <ng-template #statusInfoView>\n            <div class=\"cc-message-list__bubble-status-info\"\n              [ngStyle]=\"getStatusInfoStyle(message)\">\n              <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n                <ng-container\n                  *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n                </ng-container>\n              </div>\n              <ng-template #bubbleFooter>\n                <div class=\"cc-message-list__bubble-date\"\n                  *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && !message.getDeletedAt() && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n                  <cometchat-date [timestamp]=\"message?.getSentAt()\"\n                    [dateStyle]=\"getBubbleDateStyle(message)\"\n                    [pattern]=\"datePattern\">\n                  </cometchat-date>\n                </div>\n                <div\n                  *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n                  class=\"cc-message-list__receipt\">\n                  <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n                    [receiptStyle]=\"getReceiptStyle(message)\"\n                    [waitIcon]=\"waitIcon\" [sentIcon]=\"sentIcon\"\n                    [deliveredIcon]=\"deliveredIcon\" [readIcon]=\"readIcon\"\n                    [errorIcon]=\"errorIcon\"></cometchat-receipt>\n                </div>\n              </ng-template>\n            </div>\n          </ng-template>\n          <ng-template #leadingView>\n            <div\n              *ngIf=\" message?.getCategory() != MessageCategory.action  && showHeaderTitle(message)\">\n              <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n                [avatarStyle]=\"avatarStyle\"\n                [image]=\"message?.getSender()?.getAvatar()\">\n              </cometchat-avatar>\n            </div>\n          </ng-template>\n          <ng-template #bubbleHeader>\n            <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n              <ng-container\n                *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n              </ng-container>\n            </div>\n            <ng-template #defaultHeader>\n              <div class=\"cc-message-list__bubble-header\"\n                *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n                <cometchat-label [text]=\"message?.getSender()?.getName()\"\n                  [labelStyle]=\"labelStyle\"></cometchat-label>\n                <cometchat-date [pattern]=\"datePattern\"\n                  [timestamp]=\"message?.getSentAt()\"\n                  [dateStyle]=\"getBubbleDateStyle(message)\"\n                  *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n              </div>\n            </ng-template>\n          </ng-template>\n          <ng-template #threadView>\n            <div class=\"cc-message-list__threadreplies\"\n              *ngIf=\"message?.getReplyCount() && !message.getDeletedAt()\"\n              [ngStyle]=\"getThreadViewAlignment(message)\">\n              <cometchat-icon-button [iconURL]=\"threadIndicatorIcon\"\n                [mirrorIcon]=\"getThreadIconAlignment(message)\"\n                [buttonStyle]=\"getThreadViewStyle(message)\"\n                (cc-button-clicked)=\"openThreadView(message)\"\n                [text]='getThreadCount(message)'>\n                <!-- <span slot=\"buttonView\" [ngStyle]=\"getUnreadRepliesCountStyle()\"\n                  class=\"cc-message-list__unread-thread\"\n                  *ngIf=\"!message.getDeletedAt() && message.getUnreadReplyCount() > 0\">\n                  {{message.getUnreadReplyCount()}}\n                </span> -->\n\n              </cometchat-icon-button>\n            </div>\n          </ng-template>\n        </cometchat-message-bubble>\n      </div>\n    </div>\n    <div class=\"cc-message-list__bottom\" #bottom>\n    </div>\n\n  </div>\n  <div class=\"cc-message-list__message-indicator\"\n    *ngIf=\"UnreadCount && UnreadCount.length > 0 && !isOnBottom\"\n    [ngStyle]=\"{bottom: showSmartReply || footerView || showConversationStarter || showConversationSummary  ? '20px' : '10px'}\">\n    <cometchat-icon-button [iconURL]=\"newMessageIndicatorIconUrl\" [text]=\"newMessageCount\"\n      [buttonStyle]=\"unreadMessagesStyle\"\n      (cc-button-clicked)=\"scrollToBottom()\"></cometchat-icon-button>\n  </div>\n  <div class=\"cc-message-list__footer-view\" [ngStyle]=\"{height:  'auto'}\">\n\n    <div *ngIf=\"footerView;else footer\">\n      <ng-container *ngTemplateOutlet=\"footerView\">\n      </ng-container>\n    </div>\n    <ng-template #footer>\n\n      <div class=\"cc-message-list__smart-replies\"\n        *ngIf=\"!showConversationStarter && showSmartReply && getReplies()\">\n        <smart-replies [smartReplyStyle]=\"smartReplyStyle\"\n          [replies]=\"getReplies()\" (cc-reply-clicked)=\"sendReply($event)\"\n          (cc-close-clicked)=\"closeSmartReply()\">\n        </smart-replies>\n      </div>\n\n\n      <div class=\"cc-message-list__conversation-starters\"\n        *ngIf=\"enableConversationStarter && showConversationStarter\">\n        <cometchat-ai-card [state]=\"conversationStarterState\"\n          [loadingStateText]=\"starterLoadingStateText\"\n          [emptyStateText]=\"starterEmptyStateText\"\n          [errorStateText]=\"errorStateText\">\n          <smart-replies\n            *ngIf=\"conversationStarterState == states.loaded && !parentMessageId\"\n            [smartReplyStyle]=\"conversationStarterStyle\"\n            [replies]=\"conversationStarterReplies\" slot=\"loadedView\"\n            (cc-reply-clicked)=\"sendConversationStarter($event)\"\n            [closeIconURL]=\"''\">\n          </smart-replies>\n        </cometchat-ai-card>\n      </div>\n\n      <div class=\"cc-message-list__conversation-summary\"\n        *ngIf=\"enableConversationSummary && showConversationSummary\">\n\n        <cometchat-ai-card [state]=\"conversationSummaryState\"\n          [loadingStateText]=\"summaryLoadingStateText\"\n          [emptyStateText]=\"summaryEmptyStateText\"\n          [errorStateText]=\"errorStateText\" [errorIconURL]=\"aiErrorIcon\"\n          [emptyIconURL]=\"aiEmptyIcon\">\n          <cometchat-panel\n            *ngIf=\"conversationSummaryState == states.loaded && !parentMessageId\"\n            slot=\"loadedView\" [panelStyle]=\"conversationSummaryStyle\"\n            title=\"Conversation Summary\" [text]=\"conversationSummary\"\n            (cc-close-clicked)=\"closeConversationSummary()\">\n          </cometchat-panel>\n        </cometchat-ai-card>\n\n      </div>\n\n    </ng-template>\n  </div>\n\n</div>\n<!-- default bubbles -->\n<ng-template #textBubble let-message>\n  <cometchat-text-bubble\n    *ngIf=\"message?.type == MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"getActionMessage(message)\"></cometchat-text-bubble>\n  <cometchat-text-bubble *ngIf=\"message?.getDeletedAt()\"\n    [textStyle]=\"setTextBubbleStyle(message)\"\n    [text]=\"localize('MESSAGE_IS_DELETED')\"></cometchat-text-bubble>\n  <cometchat-text-bubble\n    *ngIf=\"!isTranslated(message) && !getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n    [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n    [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  <link-preview [linkPreviewStyle]=\"linkPreviewStyle\"\n    (cc-link-clicked)=\"openLinkURL($event)\"\n    *ngIf=\"!message?.getDeletedAt() && getLinkPreview(message) && enableLinkPreview\"\n    [title]=\"getLinkPreviewDetails('title',message)\"\n    [description]=\"getLinkPreviewDetails('description',message)\"\n    [URL]=\"getLinkPreviewDetails('url',message)\"\n    [image]=\"getLinkPreviewDetails('image',message)\"\n    [favIconURL]=\"getLinkPreviewDetails('favicon',message)\">\n    <cometchat-text-bubble\n      *ngIf=\"!isTranslated(message) && getLinkPreview(message) && !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"getTextMessage(message)\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n  </link-preview>\n  <message-translation-bubble [alignment]=\"getBubbleAlignment(message)\"\n    *ngIf=\"isTranslated(message)\"\n    [messageTranslationStyle]=\"setTranslationStyle(message)\"\n    [translatedText]=\"isTranslated(message)\"\n    [textFormatters]=\"getTextFormatters(message)\">\n    <cometchat-text-bubble\n      *ngIf=\" !message?.deletedAt && message?.type != MessageTypesConstant.groupMember\"\n      [textStyle]=\"setTextBubbleStyle(message)\" [text]=\"message?.text\"\n      [textFormatters]=\"getTextFormatters(message)\"></cometchat-text-bubble>\n\n  </message-translation-bubble>\n</ng-template>\n<ng-template #fileBubble let-message>\n\n  <cometchat-file-bubble [fileStyle]=\"setFileBubbleStyle(message)\"\n    [downloadIconURL]=\"downloadIconURL\" [subtitle]=\"localize('SHARED_FILE')\"\n    [title]=\"message?.data?.attachments ? message?.data?.attachments[0]?.name: ''\"\n    [fileURL]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"></cometchat-file-bubble>\n</ng-template>\n<ng-template #audioBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.audio\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n  <cometchat-audio-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\">\n  </cometchat-audio-bubble>\n</ng-template>\n<ng-template #videoBubble let-message>\n  <cometchat-icon-button [disabled]=\"true\"\n    *ngIf=\"message?.category == callConstant && message?.type == MessageTypesConstant.video\"\n    [iconURL]=\"getCallTypeIcon(message)\"\n    [buttonStyle]=\"callStatusStyle(message)\"\n    [text]=\"getCallActionMessage(message)\"></cometchat-icon-button>\n\n  <cometchat-video-bubble\n    *ngIf=\"!message.getDeletedAt() && message?.category != callConstant\"\n    [videoStyle]=\"videoBubbleStyle\"\n    [src]=\"message?.data?.attachments ? message?.data?.attachments[0]?.url : ''\"\n    [poster]=\" getImageThumbnail(message)\"></cometchat-video-bubble>\n</ng-template>\n<ng-template #imageBubble let-message>\n  <image-moderation (cc-show-dialog)=\"openWarningDialog($event)\"\n    *ngIf=\"!message.getDeletedAt() && enableImageModeration\" [message]=\"message\"\n    [imageModerationStyle]=\"imageModerationStyle\">\n    <cometchat-image-bubble (cc-image-clicked)=\"openImageInFullScreen(message)\"\n      [imageStyle]=\"imageBubbleStyle\" [src]=\" getImageThumbnail(message)\"\n      [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n  </image-moderation>\n  <cometchat-image-bubble [imageStyle]=\"imageBubbleStyle\"\n    (cc-image-clicked)=\"openImageInFullScreen(message)\"\n    *ngIf=\"!message.getDeletedAt() && !enableImageModeration\"\n    [src]=\" getImageThumbnail(message)\"\n    [placeholderImage]=\"placeholderIconURL\"></cometchat-image-bubble>\n</ng-template>\n<ng-template #formBubble let-message>\n  <cometchat-form-bubble [message]=\"message\"\n    [formBubbleStyle]=\"getFormMessageBubbleStyle()\"></cometchat-form-bubble>\n</ng-template>\n<ng-template #cardBubble let-message>\n  <cometchat-card-bubble [message]=\"message\"\n    [cardBubbleStyle]=\"getCardMessageBubbleStyle()\"></cometchat-card-bubble>\n</ng-template>\n<ng-template #customTextBubble>\n</ng-template>\n<ng-template #stickerBubble let-message>\n  <cometchat-image-bubble [src]=\"getSticker(message)\"\n    [imageStyle]=\"imageBubbleStyle\"></cometchat-image-bubble>\n\n</ng-template>\n<ng-template #whiteboardBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeWhiteboard\"\n    [iconURL]=\"whiteboardIconURL\" [title]=\"whiteboardTitle\"\n    [buttonText]=\"whiteboardButtonText\"\n    [subtitle]=\"whiteboardSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #documentBubble let-message>\n  <cometchat-document-bubble [hideSeparator]=\"false\"\n    [iconAlignment]=\"documentBubbleAlignment\"\n    [documentStyle]=\"documentBubbleStyle\" [URL]=\"getWhiteboardDocument(message)\"\n    [ccClicked]=\"launchCollaborativeDocument\"\n    [iconURL]=\"documentIconURL\" [title]=\"documentTitle\"\n    [buttonText]=\"documentButtonText\"\n    [subtitle]=\"documentSubitle\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #directCalling let-message>\n  <cometchat-document-bubble [hideSeparator]=\"true\"\n    [iconAlignment]=\"callBubbleAlignment\"\n    [documentStyle]=\"getCallBubbleStyle(message)\" [URL]=\"getSessionId(message)\"\n    [ccClicked]=\"getStartCallFunction(message)\" [iconURL]=\"directCallIconURL\"\n    [title]=\"getCallBubbleTitle(message)\" [buttonText]=\"joinCallButtonText\"\n    *ngIf=\"message.category == 'custom'\"></cometchat-document-bubble>\n\n</ng-template>\n<ng-template #schedulerBubble let-message>\n  <cometchat-scheduler-bubble [schedulerMessage]=\"message\"\n    [loggedInUser]=\"loggedInUser\"\n    [schedulerBubbleStyle]=\"getSchedulerBubbleStyle(message)\"></cometchat-scheduler-bubble>\n\n</ng-template>\n<ng-template #pollBubble let-message>\n  <polls-bubble [pollStyle]=\"pollBubbleStyle\"\n    [pollQuestion]=\"getPollBubbleData(message,'question')\"\n    [pollId]=\"getPollBubbleData(message,'id')\" [loggedInUser]=\"loggedInUser\"\n    [senderUid]=\"getPollBubbleData(message)\"\n    [metadata]=\"message?.metadata\"></polls-bubble>\n\n</ng-template>\n\n<!-- thread bubble view -->\n<ng-template #threadMessageBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"showStatusInfo(message) ?  statusInfoView : null\"\n    [leadingView]=\" showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [footerView]=\"getFooterView(message)\" [contentView]=\"contentView\"\n    [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"threadedAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #statusInfoView>\n      <div class=\"cc-message-list__bubble-status-info\"\n        [ngStyle]=\"getStatusInfoStyle(message)\">\n        <div *ngIf=\"getStatusInfoView(message);else bubbleFooter\">\n          <ng-container\n            *ngTemplateOutlet=\"getStatusInfoView(message);context:{ $implicit: message }\">\n          </ng-container>\n        </div>\n        <ng-template #bubbleFooter>\n          <div class=\"cc-message-list__bubble-date\"\n            *ngIf=\"timestampAlignment == timestampEnum.bottom && message?.getCategory() != MessageCategory.action && message?.getCategory() != MessageCategory.call && message?.getSentAt()\">\n            <cometchat-date [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"getBubbleDateStyle(message)\" [pattern]=\"datePattern\">\n            </cometchat-date>\n          </div>\n          <div\n          *ngIf=\"shouldShowMessage(message, disableReceipt, hideReceipt)\"\n            class=\"cc-message-list__receipt\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(message)\"\n              [receiptStyle]=\"getReceiptStyle(message)\" [waitIcon]=\"waitIcon\"\n              [sentIcon]=\"sentIcon\" [deliveredIcon]=\"\"\n              [readIcon]=\"deliveredIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </div>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n\n\n<!--  -->\n<cometchat-popover [popoverStyle]=\"popoverStyle\" #popoverRef\n  [placement]=\"keyboardAlignment\" (cc-popover-outside-clicked)=\"onEmojiKeyboardClosed()\">\n  <cometchat-emoji-keyboard (cc-emoji-clicked)=\"addReaction($event)\"\n    slot=\"content\"\n    [emojiKeyboardStyle]=\"emojiKeyboardStyle\"></cometchat-emoji-keyboard>\n</cometchat-popover>\n<cometchat-backdrop *ngIf=\"openConfirmDialog\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-confirm-dialog [title]=\"''\" [messageText]=\"warningText\"\n    (cc-confirm-clicked)=\"onConfirmClick()\" [cancelButtonText]=\"cancelText\"\n    [confirmButtonText]=\"confirmText\" (cc-cancel-clicked)=\"onCancelClick()\"\n    [confirmDialogStyle]=\"confirmDialogStyle\">\n\n  </cometchat-confirm-dialog>\n</cometchat-backdrop>\n<cometchat-full-screen-viewer (cc-close-clicked)=\"closeImageInFullScreen()\"\n  *ngIf=\"openFullscreenView\" [URL]=\"imageurlToOpen\"\n  [closeIconURL]=\"closeIconURL\" [fullScreenViewerStyle]=\"fullScreenViewerStyle\">\n\n</cometchat-full-screen-viewer>\n\n<!-- ongoing callscreen for direct call -->\n<cometchat-ongoing-call *ngIf=\"showOngoingCall\"\n  [callSettingsBuilder]=\"getCallBuilder()\" [ongoingCallStyle]=\"ongoingCallStyle\"\n  [sessionID]=\"sessionId\"></cometchat-ongoing-call>\n<!-- message information view -->\n<!-- thread bubble view -->\n<ng-template #messageinfoBubble let-message>\n  <div *ngIf=\"getBubbleWrapper(message)\">\n    <ng-container\n      *ngTemplateOutlet=\"getBubbleWrapper(message);context:{ $implicit: message }\">\n    </ng-container>\n  </div>\n  <cometchat-message-bubble *ngIf=\"!getBubbleWrapper(message)\"\n    [bottomView]=\"getBottomView(message)\"\n    [statusInfoView]=\"getStatusInfoView(message)\"\n    [footerView]=\"getFooterView(message)\"\n    [leadingView]=\"showAvatar ? leadingView : null\" [headerView]=\"bubbleHeader\"\n    [contentView]=\"contentView\" [id]=\"message?.getId() || message?.getMuid()\"\n    [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n    [alignment]=\"messageInfoAlignment\">\n    <ng-template #contentView>\n      <ng-container\n        *ngTemplateOutlet=\"getContentView(message);context:{ $implicit: message }\">\n      </ng-container>\n    </ng-template>\n    <ng-template #leadingView>\n      <div\n        *ngIf=\" message?.getCategory() != MessageCategory.action && showHeaderTitle(message)\">\n        <cometchat-avatar [name]=\"message?.getSender()?.getName()\"\n          [avatarStyle]=\"avatarStyle\"\n          [image]=\"message?.getSender()?.getAvatar()\">\n        </cometchat-avatar>\n      </div>\n    </ng-template>\n    <ng-template #bubbleHeader>\n      <div *ngIf=\"getHeaderView(message);else defaultHeader\">\n        <ng-container\n          *ngTemplateOutlet=\"getHeaderView(message);context:{ $implicit: message }\">\n        </ng-container>\n      </div>\n      <ng-template #defaultHeader>\n        <div class=\"cc-message-list__bubble-header\"\n          *ngIf=\"message?.getCategory() != MessageCategory.action && showHeaderTitle(message) && message?.getCategory() != MessageCategory.call\">\n          <cometchat-label [text]=\"message?.getSender()?.getName()\"\n            [labelStyle]=\"labelStyle\"></cometchat-label>\n          <cometchat-date [pattern]=\"datePattern\"\n            [timestamp]=\"message?.getSentAt()\"\n            [dateStyle]=\"getBubbleDateStyle(message)\"\n            *ngIf=\"timestampAlignment == timestampEnum.top && message?.getSentAt()\"></cometchat-date>\n        </div>\n      </ng-template>\n    </ng-template>\n  </cometchat-message-bubble>\n\n</ng-template>\n<cometchat-backdrop *ngIf=\"openMessageInfoPage\" [backdropStyle]=\"backdropStyle\">\n  <cometchat-message-information\n    [closeIconURL]=\"messageInformationConfiguration.closeIconURL\"\n    [loadingStateView]=\"messageInformationConfiguration.loadingStateView\"\n    [errorStateView]=\"messageInformationConfiguration.errorStateView\"\n    [listItemStyle]=\"messageInformationConfiguration.listItemStyle\"\n    [emptyStateView]=\"messageInformationConfiguration.emptyStateView\"\n    [loadingIconURL]=\"messageInformationConfiguration.loadingIconURL\"\n    [readIcon]=\"messageInformationConfiguration.readIcon\"\n    [deliveredIcon]=\"messageInformationConfiguration.deliveredIcon\"\n    [onError]=\"messageInformationConfiguration.onError\"\n    [SubtitleView]=\"messageInformationConfiguration.subtitleView\"\n    [receiptDatePattern]=\"messageInformationConfiguration.receiptDatePattern\"\n    [listItemView]=\"messageInformationConfiguration.listItemView \"\n    [messageInformationStyle]=\"messageInformationConfiguration.messageInformationStyle\"\n    [onClose]=\"messageInformationConfiguration.onClose ??  closeMessageInfoPage\"\n    [bubbleView]=\"messageInformationConfiguration.bubbleView ?? messageinfoBubble\"\n    [message]=\"messageInfoObject\">\n\n  </cometchat-message-information>\n</cometchat-backdrop>\n", styles: [".cc-message-list{height:100%;width:100%;overflow-y:auto;overflow-x:hidden;position:relative}.cc-message-list__wrapper{height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;overflow-y:hidden}.cc-message-list__bubble-status-info{display:flex;align-items:flex-end;width:100%;padding:0 8px 8px;box-sizing:border-box}cometchat-reactions{margin-top:-3px}cometchat-document-bubble{width:100%;overflow:hidden}.cc-message-list__unread-thread{margin-left:4px}.cc-message-list__date-container{text-align:center;margin:5px 0}.cc-message-list__smart-replies,.cc-message-list__conversation-starters{height:-moz-fit-content;height:fit-content;width:100%;position:absolute;bottom:0;z-index:1}.cc-message-list__conversation-summary{height:100%;position:relative;bottom:0;z-index:1;padding:.1px 14px}.cc-message-list__date{border-radius:10px;display:flex;justify-content:center}.cc-message-list__threadreplies{min-width:130px;width:100%;padding-top:4px;display:flex}.cc-message-list__message-indicator{height:25px;display:flex;align-items:center;justify-content:center;width:100%;bottom:10%;position:absolute}.cc-message-list__footer-view{z-index:1;position:relative;width:100%;box-sizing:border-box;margin-bottom:1px}.cc-message-list__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%}.cc-message-list__footer__decorator-message{margin:0;line-height:30px;word-wrap:break-word;padding:0 8px 0 16px;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;height:100%}.cc-message-list::-webkit-scrollbar{background:transparent;width:8px}.cc-message-list::-webkit-scrollbar-thumb{background:#e8e5e5;border-radius:8px}.cc-message-list__footer-view-decorator{display:flex;flex-direction:row;column-gap:8px}.cc_panel_container{border:1px solid #6851d6}cometchat-scheduler-bubble{width:100%}.cc-message-list__bubble-reactions{width:100%;box-sizing:border-box}\n"] }]
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
            }], newMessageIndicatorIconUrl: [{
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
            }], newMessageIndicatorStyle: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL0NvbWV0Q2hhdE1lc3NhZ2VMaXN0L2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QvY29tZXRjaGF0LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxLQUFLLEVBU0wsU0FBUyxFQUNULFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wsV0FBVyxFQUdYLGVBQWUsRUFDZixhQUFhLEVBRWIsU0FBUyxFQUVULGFBQWEsRUFHYixVQUFVLEVBQ1YsVUFBVSxFQUNWLGFBQWEsRUFHYixjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixpQkFBaUIsR0FDbEIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQ0wsYUFBYSxFQUNiLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsOEJBQThCLEVBQzlCLGdDQUFnQyxFQUNoQyxxQkFBcUIsRUFDckIsYUFBYSxFQUNiLHFCQUFxQixFQUNyQixlQUFlLEVBRWYsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQiwrQkFBK0IsRUFDL0IsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQiwyQkFBMkIsRUFDM0IsdUJBQXVCLEVBRXZCLG9CQUFvQixFQUVwQixxQkFBcUIsRUFFckIsNEJBQTRCLEVBQzVCLGNBQWMsRUFDZCx5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLGlC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QUtHLCtCQUErQjtzQkFBdkMsS0FBSztnQkFFRyxlQUFlO3NCQUF2QixLQUFLO2dCQW9ORyxjQUFjO3NCQUF0QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBRdWVyeUxpc3QsXG4gIFJlbmRlcmVyMixcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0NoaWxkcmVuLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIEJhc2VTdHlsZSxcbiAgQ2FsbHNjcmVlblN0eWxlLFxuICBDaGVja2JveFN0eWxlLFxuICBDb25maXJtRGlhbG9nU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgRG9jdW1lbnRCdWJibGVTdHlsZSxcbiAgRHJvcGRvd25TdHlsZSxcbiAgRW1vamlLZXlib2FyZFN0eWxlLFxuICBGdWxsU2NyZWVuVmlld2VyU3R5bGUsXG4gIElucHV0U3R5bGUsXG4gIExhYmVsU3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG4gIE1lbnVMaXN0U3R5bGUsXG4gIFBhbmVsU3R5bGUsXG4gIFF1aWNrVmlld1N0eWxlLFxuICBSYWRpb0J1dHRvblN0eWxlLFxuICBSZWNlaXB0U3R5bGUsXG4gIFNpbmdsZVNlbGVjdFN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHtcbiAgQ2FsZW5kYXJTdHlsZSxcbiAgQ2FsbGluZ0RldGFpbHNVdGlscyxcbiAgQ2FyZEJ1YmJsZVN0eWxlLFxuICBDb2xsYWJvcmF0aXZlRG9jdW1lbnRDb25zdGFudHMsXG4gIENvbGxhYm9yYXRpdmVXaGl0ZWJvYXJkQ29uc3RhbnRzLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIFRpbWVTbG90U3R5bGUsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbiAgRm9ybUJ1YmJsZVN0eWxlLFxuICBJbWFnZU1vZGVyYXRpb25TdHlsZSxcbiAgSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMsXG4gIExpbmtQcmV2aWV3Q29uc3RhbnRzLFxuICBNZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLFxuICBNZXNzYWdlTGlzdFN0eWxlLFxuICBNZXNzYWdlUmVjZWlwdFV0aWxzLFxuICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMsXG4gIE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlLFxuICBQb2xsc0J1YmJsZVN0eWxlLFxuICBTY2hlZHVsZXJCdWJibGVTdHlsZSxcbiAgU21hcnRSZXBsaWVzQ29uZmlndXJhdGlvbixcbiAgU21hcnRSZXBsaWVzQ29uc3RhbnRzLFxuICBTbWFydFJlcGxpZXNTdHlsZSxcbiAgVGh1bWJuYWlsR2VuZXJhdGlvbkNvbnN0YW50cyxcbiAgUmVhY3Rpb25zU3R5bGUsXG4gIFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24sXG4gIFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24sXG4gIFJlYWN0aW9uTGlzdFN0eWxlLFxuICBSZWFjdGlvbkluZm9TdHlsZSxcbiAgUmVhY3Rpb25zQ29uZmlndXJhdGlvbixcbiAgVXNlck1lbnRpb25TdHlsZSxcbiAgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcixcbiAgQ29tZXRDaGF0VGV4dEZvcm1hdHRlcixcbiAgVXJsRm9ybWF0dGVyU3R5bGUsXG4gIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIsXG4gIFN0b3JhZ2VVdGlscyxcbiAgTmV3TWVzc2FnZUluZGljYXRvclN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIEFjdGl2ZVBvcG92ZXIsXG4gIENhcmRNZXNzYWdlLFxuICBDb21ldENoYXRDYWxsRXZlbnRzLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbixcbiAgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlLFxuICBDb21ldENoYXRUaGVtZSxcbiAgQ29tZXRDaGF0VUlFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gIERhdGVQYXR0ZXJucyxcbiAgRG9jdW1lbnRJY29uQWxpZ25tZW50LFxuICBGb3JtTWVzc2FnZSxcbiAgSUdyb3VwTGVmdCxcbiAgSUdyb3VwTWVtYmVyQWRkZWQsXG4gIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCxcbiAgSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLFxuICBJTWVzc2FnZXMsXG4gIElQYW5lbCxcbiAgTWVzc2FnZUJ1YmJsZUFsaWdubWVudCxcbiAgTWVzc2FnZUxpc3RBbGlnbm1lbnQsXG4gIE1lc3NhZ2VTdGF0dXMsXG4gIFBsYWNlbWVudCxcbiAgU2NoZWR1bGVyTWVzc2FnZSxcbiAgU3RhdGVzLFxuICBUaW1lc3RhbXBBbGlnbm1lbnQsXG4gIGZvbnRIZWxwZXIsXG4gIGxvY2FsaXplLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdFVJS2l0Q2FsbHMsXG4gIExpbmtQcmV2aWV3U3R5bGUsXG4gIFN0aWNrZXJzQ29uc3RhbnRzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdCB9IGZyb20gXCIuLi8uLi9TaGFyZWQvQ29tZXRDaGF0VUlraXQvQ29tZXRDaGF0VUlLaXRcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiwgaXNFbXB0eSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRNZXNzYWdlTGlzdCBpcyBhIHdyYXBwZXIgY29tcG9uZW50IGZvciBtZXNzYWdlQnViYmxlXG4gKlxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuICogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4gKlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LW1lc3NhZ2UtbGlzdFwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWxpc3QuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudFxuICBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95LCBPbkNoYW5nZXMge1xuICBAVmlld0NoaWxkKFwibGlzdFNjcm9sbFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgbGlzdFNjcm9sbCE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJib3R0b21cIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGJvdHRvbSE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJ0b3BcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHRvcCE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJ0ZXh0QnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSB0ZXh0QnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcInRocmVhZE1lc3NhZ2VCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHRocmVhZE1lc3NhZ2VCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwiZmlsZUJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgZmlsZUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJhdWRpb0J1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYXVkaW9CdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwidmlkZW9CdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIHZpZGVvQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImltYWdlQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBpbWFnZUJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJmb3JtQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBmb3JtQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZChcImNhcmRCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGNhcmRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwic3RpY2tlckJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgc3RpY2tlckJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJkb2N1bWVudEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgZG9jdW1lbnRCdWJibGUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAVmlld0NoaWxkKFwid2hpdGVib2FyZEJ1YmJsZVwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgd2hpdGVib2FyZEJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJwb3BvdmVyUmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBwb3BvdmVyUmVmITogYW55O1xuICBAVmlld0NoaWxkKFwiZGlyZWN0Q2FsbGluZ1wiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgZGlyZWN0Q2FsbGluZyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJzY2hlZHVsZXJCdWJibGVcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHNjaGVkdWxlckJ1YmJsZSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBWaWV3Q2hpbGQoXCJwb2xsQnViYmxlXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBwb2xsQnViYmxlITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQFZpZXdDaGlsZHJlbihcIm1lc3NhZ2VCdWJibGVSZWZcIikgbWVzc2FnZUJ1YmJsZVJlZiE6IFF1ZXJ5TGlzdDxFbGVtZW50UmVmPjtcblxuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgaGlkZURhdGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX01FU1NBR0VTX0ZPVU5EXCIpO1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy4xNiBkdWUgdG8gbmV3ZXIgcHJvcGVydHkgJ2hpZGVSZWNlaXB0Jy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHN1YnNlcXVlbnQgdmVyc2lvbnMuXG4gICAqL1xuICBASW5wdXQoKSBkaXNhYmxlUmVjZWlwdDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBoaWRlUmVjZWlwdDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBkaXNhYmxlU291bmRGb3JNZXNzYWdlczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2VzOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSByZWFkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1yZWFkLnN2Z1wiO1xuICBASW5wdXQoKSBkZWxpdmVyZWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLWRlbGl2ZXJlZC5zdmdcIjtcbiAgQElucHV0KCkgc2VudEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2Utc2VudC5zdmdcIjtcbiAgQElucHV0KCkgd2FpdEljb246IHN0cmluZyA9IFwiYXNzZXRzL3dhaXQuc3ZnXCI7XG4gIEBJbnB1dCgpIGVycm9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvd2FybmluZy1zbWFsbC5zdmdcIjtcbiAgQElucHV0KCkgYWlFcnJvckljb246IHN0cmluZyA9IFwiYXNzZXRzL2FpLWVycm9yLnN2Z1wiO1xuICBASW5wdXQoKSBhaUVtcHR5SWNvbjogc3RyaW5nID0gXCJhc3NldHMvYWktZW1wdHkuc3ZnXCI7XG4gIEBJbnB1dCgpIGFsaWdubWVudDogTWVzc2FnZUxpc3RBbGlnbm1lbnQgPSBNZXNzYWdlTGlzdEFsaWdubWVudC5zdGFuZGFyZDtcbiAgQElucHV0KCkgc2hvd0F2YXRhcjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMudGltZTtcbiAgQElucHV0KCkgdGltZXN0YW1wQWxpZ25tZW50OiBUaW1lc3RhbXBBbGlnbm1lbnQgPSBUaW1lc3RhbXBBbGlnbm1lbnQuYm90dG9tO1xuICBASW5wdXQoKSBEYXRlU2VwYXJhdG9yUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGVUaW1lO1xuICBASW5wdXQoKSB0ZW1wbGF0ZXM6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZVtdID0gW107XG4gIEBJbnB1dCgpIG1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgbmV3TWVzc2FnZUluZGljYXRvclRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIG5ld01lc3NhZ2VJbmRpY2F0b3JJY29uVXJsOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBzY3JvbGxUb0JvdHRvbU9uTmV3TWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGhyZXNob2xkVmFsdWU6IG51bWJlciA9IDEwMDA7XG4gIEBJbnB1dCgpIHVucmVhZE1lc3NhZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDMwO1xuICBASW5wdXQoKSByZWFjdGlvbnNDb25maWd1cmF0aW9uOiBSZWFjdGlvbnNDb25maWd1cmF0aW9uID1cbiAgICBuZXcgUmVhY3Rpb25zQ29uZmlndXJhdGlvbih7fSk7XG4gIEBJbnB1dCgpIGRpc2FibGVSZWFjdGlvbnM6IEJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZW1vamlLZXlib2FyZFN0eWxlOiBFbW9qaUtleWJvYXJkU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgYXBpQ29uZmlndXJhdGlvbj86IChcbiAgICB1c2VyPzogQ29tZXRDaGF0LlVzZXIsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKSA9PiBQcm9taXNlPE9iamVjdD47XG5cbiAgQElucHV0KCkgb25UaHJlYWRSZXBsaWVzQ2xpY2shOlxuICAgIHwgKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIHZpZXc6IFRlbXBsYXRlUmVmPGFueT4pID0+IHZvaWQpXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBoZWFkZXJWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZm9vdGVyVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHBhcmVudE1lc3NhZ2VJZCE6IG51bWJlcjtcbiAgQElucHV0KCkgdGhyZWFkSW5kaWNhdG9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvdGhyZWFkSW5kaWNhdG9ySWNvbi5zdmdcIjtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge1xuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgd2lkdGg6IFwiMjhweFwiLFxuICAgIGhlaWdodDogXCIyOHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIG5ld01lc3NhZ2VJbmRpY2F0b3JTdHlsZTogTmV3TWVzc2FnZUluZGljYXRvclN0eWxlID0ge31cbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gIH07XG4gIEBJbnB1dCgpIGRhdGVTZXBhcmF0b3JTdHlsZTogRGF0ZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCJcIixcbiAgICB3aWR0aDogXCJcIixcbiAgfTtcbiAgQElucHV0KCkgbWVzc2FnZUxpc3RTdHlsZTogTWVzc2FnZUxpc3RTdHlsZSA9IHtcbiAgICBuYW1lVGV4dEZvbnQ6IFwiNDAwIDExcHggSW50ZXJcIixcbiAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IFwiNzAwIDIycHggSW50ZXJcIixcbiAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IFwiNzAwIDIycHggSW50ZXJcIixcbiAgfTtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKFxuICAgIGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uXG4gICkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfTtcbiAgQElucHV0KCkgbWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbjogTWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbiA9XG4gICAgbmV3IE1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24oe30pO1xuICBASW5wdXQoKSBkaXNhYmxlTWVudGlvbnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBvcHRpb25zU3R5bGU6IE1lbnVMaXN0U3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gICAgc3VibWVudVdpZHRoOiBcIjEwMCVcIixcbiAgICBzdWJtZW51SGVpZ2h0OiBcIjEwMCVcIixcbiAgICBzdWJtZW51Qm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBzdWJtZW51QmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICAgIG1vcmVJY29uVGludDogXCJncmV5XCIsXG4gIH07XG4gIHJlY2VpcHRTdHlsZTogUmVjZWlwdFN0eWxlID0ge307XG4gIGRvY3VtZW50QnViYmxlQWxpZ25tZW50OiBEb2N1bWVudEljb25BbGlnbm1lbnQgPSBEb2N1bWVudEljb25BbGlnbm1lbnQucmlnaHQ7XG4gIGNhbGxCdWJibGVBbGlnbm1lbnQ6IERvY3VtZW50SWNvbkFsaWdubWVudCA9IERvY3VtZW50SWNvbkFsaWdubWVudC5sZWZ0O1xuICBpbWFnZU1vZGVyYXRpb25TdHlsZTogSW1hZ2VNb2RlcmF0aW9uU3R5bGUgPSB7fTtcbiAgdGltZXN0YW1wRW51bTogdHlwZW9mIFRpbWVzdGFtcEFsaWdubWVudCA9IFRpbWVzdGFtcEFsaWdubWVudDtcbiAgcHVibGljIGNoYXRDaGFuZ2VkOiBib29sZWFuID0gdHJ1ZTtcbiAgc3RhcnRlckVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgc3RhcnRlckVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX01FU1NBR0VTX0ZPVU5EXCIpO1xuICBzdGFydGVyTG9hZGluZ1N0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJHRU5FUkFUSU5HX0lDRUJSRUFLRVJTXCIpO1xuICBzdW1tYXJ5RXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBzdW1tYXJ5RW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIHN1bW1hcnlMb2FkaW5nU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdFTkVSQVRJTkdfU1VNTUFSWVwiKTtcbiAgLy8gcHVibGljIHByb3BlcnRpZXNcbiAgcHVibGljIHJlcXVlc3RCdWlsZGVyOiBhbnk7XG4gIHB1YmxpYyBjbG9zZUltYWdlTW9kZXJhdGlvbjogYW55O1xuICBwdWJsaWMgdGltZVN0YW1wQ29sb3I6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyB0aW1lU3RhbXBGb250OiBzdHJpbmcgPSBcIlwiO1xuICBzbWFydFJlcGx5U3R5bGU6IFNtYXJ0UmVwbGllc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG4gIGNvbnZlcnNhdGlvblN0YXJ0ZXJTdHlsZTogU21hcnRSZXBsaWVzU3R5bGUgPSB7fTtcbiAgY29udmVyc2F0aW9uU3VtbWFyeVN0eWxlOiBQYW5lbFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgdGl0bGVGb250OiBcIlwiLFxuICAgIHRpdGxlQ29sb3I6IFwiXCIsXG4gICAgY2xvc2VJY29uVGludDogXCJcIixcbiAgICBib3hTaGFkb3c6IFwiXCIsXG4gICAgdGV4dEZvbnQ6IFwiXCIsXG4gICAgdGV4dENvbG9yOiBcIlwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gIH07XG5cbiAgcHVibGljIHNob3dTbWFydFJlcGx5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBlbmFibGVDb252ZXJzYXRpb25TdGFydGVyOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzaG93Q29udmVyc2F0aW9uU3RhcnRlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uU3RhcnRlclN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIGNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBwdWJsaWMgZW5hYmxlQ29udmVyc2F0aW9uU3VtbWFyeTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25TdW1tYXJ5OiBzdHJpbmdbXSA9IFtdO1xuICBwdWJsaWMgZ2V0VW5yZWFkQ291bnQ6IGFueSA9IDA7XG5cbiAgY2NIaWRlUGFuZWwhOiBTdWJzY3JpcHRpb247XG4gIGNjU2hvd1BhbmVsITogU3Vic2NyaXB0aW9uO1xuICBjY0FjdGl2ZVBwcG92ZXIhOlN1YnNjcmlwdGlvbjtcbiAgc21hcnRSZXBseU1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZW5hYmxlU21hcnRSZXBseTogYm9vbGVhbiA9IGZhbHNlO1xuICBzbWFydFJlcGx5Q29uZmlnITogU21hcnRSZXBsaWVzQ29uZmlndXJhdGlvbjtcbiAgcHVibGljIHRpbWVTdGFtcEJhY2tncm91bmQ6IHN0cmluZyA9IFwiXCI7XG4gIGxpbmtQcmV2aWV3U3R5bGU6IExpbmtQcmV2aWV3U3R5bGUgPSB7fTtcbiAgcHVibGljIHVucmVhZE1lc3NhZ2VzU3R5bGUgPSB7fTtcbiAgcHVibGljIG1vZGFsU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICBjbG9zZUljb25UaW50OiBcImJsdWVcIixcbiAgfTtcbiAgcHVibGljIGRpdmlkZXJTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxcHhcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJncmV5XCIsXG4gIH07XG4gIHBvbGxCdWJibGVTdHlsZTogUG9sbHNCdWJibGVTdHlsZSA9IHt9O1xuICBsYWJlbFN0eWxlOiBhbnkgPSB7XG4gICAgdGV4dEZvbnQ6IFwiNDAwIDExcHggSW50ZXJcIixcbiAgICB0ZXh0Q29sb3I6IFwiZ3JleVwiLFxuICB9O1xuICBpbWFnZUJ1YmJsZVN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcImF1dG9cIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4IDhweCAwcHggMHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBtZXNzYWdlc0xpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gW107XG4gIGJ1YmJsZURhdGVTdHlsZTogRGF0ZVN0eWxlID0ge307XG4gIHdoaXRlYm9hcmRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jb2xsYWJvcmF0aXZld2hpdGVib2FyZC5zdmdcIjtcbiAgZG9jdW1lbnRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jb2xsYWJvcmF0aXZlZG9jdW1lbnQuc3ZnXCI7XG4gIGRpcmVjdENhbGxJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9WaWRlby1jYWxsMnguc3ZnXCI7XG4gIHBsYWNlaG9sZGVySWNvblVSTDogc3RyaW5nID0gXCIvYXNzZXRzL3BsYWNlaG9sZGVyLnBuZ1wiO1xuICBkb3dubG9hZEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Rvd25sb2FkLnN2Z1wiO1xuICB0cmFuc2xhdGlvblN0eWxlOiBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSA9IHt9O1xuICBkb2N1bWVudEJ1YmJsZVN0eWxlOiBEb2N1bWVudEJ1YmJsZVN0eWxlID0ge307XG4gIGNhbGxCdWJibGVTdHlsZTogRG9jdW1lbnRCdWJibGVTdHlsZSA9IHt9O1xuICB3aGl0ZWJvYXJkVGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ09MTEFCT1JBVElWRV9XSElURUJPQVJEXCIpO1xuICB3aGl0ZWJvYXJkU3ViaXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJEUkFXX1dISVRFQk9BUkRfVE9HRVRIRVJcIik7XG4gIHdoaXRlYm9hcmRCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk9QRU5fV0hJVEVCT0FSRFwiKTtcbiAgZG9jdW1lbnRUaXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJDT0xMQUJPUkFUSVZFX0RPQ1VNRU5UXCIpO1xuICBkb2N1bWVudFN1Yml0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiRFJBV19ET0NVTUVOVF9UT0dFVEhFUlwiKTtcbiAgZG9jdW1lbnRCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk9QRU5fRE9DVU1FTlRcIik7XG4gIGpvaW5DYWxsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJKT0lOXCIpO1xuICB0b3BPYnNlcnZlciE6IEludGVyc2VjdGlvbk9ic2VydmVyO1xuICBib3R0b21PYnNlcnZlciE6IEludGVyc2VjdGlvbk9ic2VydmVyO1xuICBsb2NhbGl6ZTogdHlwZW9mIGxvY2FsaXplID0gbG9jYWxpemU7XG4gIHJlaW5pdGlhbGl6ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgYWRkUmVhY3Rpb25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9hZGRyZWFjdGlvbi5zdmdcIjtcbiAgTWVzc2FnZVR5cGVzQ29uc3RhbnQ6IHR5cGVvZiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMgPVxuICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcztcbiAgY2FsbENvbnN0YW50OiBzdHJpbmcgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbDtcbiAgcHVibGljIHR5cGVzTWFwOiBhbnkgPSB7fTtcbiAgcHVibGljIG1lc3NhZ2VUeXBlc01hcDogYW55ID0ge307XG4gIHRoZW1lOiBDb21ldENoYXRUaGVtZSA9IG5ldyBDb21ldENoYXRUaGVtZSh7fSk7XG4gIHB1YmxpYyBncm91cExpc3RlbmVySWQgPSBcImdyb3VwX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBjYWxsTGlzdGVuZXJJZCA9IFwiY2FsbF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIHB1YmxpYyBzdGF0ZXM6IHR5cGVvZiBTdGF0ZXMgPSBTdGF0ZXM7XG4gIE1lc3NhZ2VDYXRlZ29yeSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeTtcbiAgcHVibGljIG51bWJlck9mVG9wU2Nyb2xsOiBudW1iZXIgPSAwO1xuICBrZWVwUmVjZW50TWVzc2FnZXM6IGJvb2xlYW4gPSB0cnVlO1xuICBtZXNzYWdlVGVtcGxhdGU6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZVtdID0gW107XG4gIHB1YmxpYyBvcGVuQ29udGFjdHNWaWV3OiBib29sZWFuID0gZmFsc2U7XG4gIG1lc3NhZ2VDb3VudCE6IG51bWJlcjtcbiAgaXNPbkJvdHRvbTogYm9vbGVhbiA9IGZhbHNlO1xuICBVbnJlYWRDb3VudDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbXTtcbiAgbmV3TWVzc2FnZUNvdW50OiBudW1iZXIgfCBzdHJpbmcgPSAwO1xuICB0eXBlOiBzdHJpbmcgPSBcIlwiO1xuICBjb25maXJtVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJZRVNcIik7XG4gIGNhbmNlbFRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9cIik7XG4gIHdhcm5pbmdUZXh0OiBzdHJpbmcgPSBcIkFyZSB5b3Ugc3VyZSB3YW50IHRvIHNlZSB1bnNhZmUgY29udGVudD9cIjtcbiAgY2NNZXNzYWdlRGVsZXRlITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VSZWFjdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NMaXZlUmVhY3Rpb24hOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVNlbnQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTGVmdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cENyZWF0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3V0Z29pbmdDYWxsITogU3Vic2NyaXB0aW9uO1xuICBjY0NhbGxSZWplY3RlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDYWxsRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjQ2FsbEFjY2VwdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBvblRleHRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZVJlYWN0aW9uQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DdXN0b21NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uRm9ybU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZWRpYU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc0RlbGl2ZXJlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc1JlYWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNSZWFkQnlBbGwhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNEZWxpdmVyZWRUb0FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBvblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25JbnRlcmFjdGlvbkdvYWxDb21wbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIHRocmVhZGVkQWxpZ25tZW50OiBNZXNzYWdlQnViYmxlQWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICBtZXNzYWdlSW5mb0FsaWdubWVudDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ7XG4gIG9wZW5FbW9qaUtleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGtleWJvYXJkQWxpZ25tZW50OiBzdHJpbmcgPSBQbGFjZW1lbnQucmlnaHQ7XG4gIHBvcG92ZXJTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIzMzBweFwiLFxuICAgIHdpZHRoOiBcIjMyNXB4XCIsXG4gIH07XG4gIHZpZGVvQnViYmxlU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTMwcHhcIixcbiAgICB3aWR0aDogXCIyMzBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgdGhyZWFkVmlld0FsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdDtcbiAgd2hpdGVib2FyZFVSTDogc3RyaW5nIHwgVVJMIHwgdW5kZWZpbmVkO1xuICBlbmFibGVEYXRhTWFza2luZzogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVUaHVtYm5haWxHZW5lcmF0aW9uOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZUxpbmtQcmV2aWV3OiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVBvbGxzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVJlYWN0aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVJbWFnZU1vZGVyYXRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlU3RpY2tlcnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlV2hpdGVib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVEb2N1bWVudDogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93T25nb2luZ0NhbGw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlQ2FsbGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBvbmdvaW5nQ2FsbFN0eWxlOiBDYWxsc2NyZWVuU3R5bGUgPSB7fTtcbiAgc2Vzc2lvbklkOiBzdHJpbmcgPSBcIlwiO1xuICBvcGVuTWVzc2FnZUluZm9QYWdlOiBib29sZWFuID0gZmFsc2U7XG4gIG1lc3NhZ2VJbmZvT2JqZWN0ITogQ29tZXRDaGF0LkJhc2VNZXNzYWdlO1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBpc1dlYnNvY2tldFJlY29ubmVjdGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBsYXN0TWVzc2FnZUlkOiBudW1iZXIgPSAwO1xuICBpc0Nvbm5lY3Rpb25SZWVzdGFibGlzaGVkOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRleHRGb3JtYXR0ZXJzPzogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj47XG5cbiAgY2xvc2VJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiO1xuICB0aHJlYWRPcGVuSWNvbjogc3RyaW5nID0gXCJhc3NldHMvc2lkZS1hcnJvdy5zdmdcIjtcbiAgY29uZmlybURpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7fTtcbiAgcHVibGljIG1lc3NhZ2VUb1JlYWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBudWxsID0gbnVsbDtcblxuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICB0eXBlczogc3RyaW5nW10gPSBbXTtcbiAgY2F0ZWdvcmllczogc3RyaW5nW10gPSBbXTtcbiAgY2FsbGJhY2tzOiBNYXA8c3RyaW5nLCAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHZvaWQ+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2VcbiAgKSB7IH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICBpZiAoY2hhbmdlc1tcInVzZXJcIl0gfHwgY2hhbmdlc1tcImdyb3VwXCJdKSB7XG4gICAgICAgIHRoaXMuY2hhdENoYW5nZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGNoYW5nZXNbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXSB8fFxuICAgICAgICBjaGFuZ2VzW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBdXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyUmVwbGllcyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnkgPSBbXTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIHRoaXMuc2hvd0VuYWJsZWRFeHRlbnNpb25zKCk7XG4gICAgICAgIHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwgPSAwO1xuICAgICAgICBpZiAoIXRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlciBhcyBDb21ldENoYXQuVXNlcjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtdO1xuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMudXNlcikubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdGhpcy51c2VyO1xuICAgICAgICAgICAgdGhpcy50eXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBDb21ldENoYXQuZ2V0VXNlcih0aGlzLnVzZXIpLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcjtcbiAgICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LmtleXModGhpcy5ncm91cCkubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy5ncm91cCA9IHRoaXMuZ3JvdXA7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXF1ZXN0QnVpbGRlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBDb21ldENoYXQuZ2V0R3JvdXAodGhpcy5ncm91cCkudGhlbigoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmdyb3VwID0gZ3JvdXA7XG4gICAgICAgICAgICAgIHRoaXMudHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdEJ1aWxkZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNlbmRNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICByZWNlaXZlcklkOiBzdHJpbmcsXG4gICAgcmVjZWl2ZXJUeXBlOiBzdHJpbmdcbiAgKSB7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0KSB7XG4gICAgICBjb25zdCBuZXdNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5UZXh0TWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRUZXh0KCksXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0LnNlbmRUZXh0TWVzc2FnZShuZXdNZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSlcbiAgICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IChtZXNzYWdlIGFzIGFueSk/LmRhdGE/LmF0dGFjaG1lbnRzWzBdO1xuICAgICAgY29uc3QgbmV3TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuTWVkaWFNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICBcIlwiLFxuICAgICAgICBtZXNzYWdlLmdldFR5cGUoKSxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgbGV0IGF0dGFjaG1lbnQgPSBuZXcgQ29tZXRDaGF0LkF0dGFjaG1lbnQodXBsb2FkZWRGaWxlKTtcbiAgICAgIG5ld01lc3NhZ2Uuc2V0QXR0YWNobWVudChhdHRhY2htZW50KTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0LnNlbmRNZWRpYU1lc3NhZ2UobmV3TWVzc2FnZSBhcyBDb21ldENoYXQuTWVkaWFNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgY2xvc2VDb250YWN0c1BhZ2UgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQ29udGFjdHNWaWV3ID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvbkVtb2ppS2V5Ym9hcmRDbG9zZWQoKSB7XG4gICAgaWYgKHRoaXMubWVzc2FnZVRvUmVhY3QpIHtcbiAgICAgIHRoaXMubWVzc2FnZVRvUmVhY3QgPSBudWxsO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICBhZGRSZWFjdGlvbiA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IGVtb2ppID0gZXZlbnQ/LmRldGFpbD8uaWQ7XG4gICAgdGhpcy5wb3BvdmVyUmVmLm5hdGl2ZUVsZW1lbnQub3BlbkNvbnRlbnRWaWV3KGV2ZW50KTtcbiAgICBpZiAodGhpcy5tZXNzYWdlVG9SZWFjdCkge1xuICAgICAgdGhpcy5yZWFjdFRvTWVzc2FnZShlbW9qaSwgdGhpcy5tZXNzYWdlVG9SZWFjdCk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5tZXNzYWdlVG9SZWFjdCA9IG51bGw7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH07XG4gIGdldENhbGxCdWJibGVUaXRsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBpZiAoXG4gICAgICAhbWVzc2FnZS5nZXRTZW5kZXIoKSB8fFxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIGxvY2FsaXplKFwiWU9VX0lOSVRJQVRFRF9HUk9VUF9DQUxMXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYCR7bWVzc2FnZS5nZXRTZW5kZXIoKS5nZXROYW1lKCl9ICAke2xvY2FsaXplKFxuICAgICAgICBcIklOSVRJQVRFRF9HUk9VUF9DQUxMXCJcbiAgICAgICl9YDtcbiAgICB9XG4gIH1cbiAgZ2V0Q2FsbEFjdGlvbk1lc3NhZ2UgPSAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICByZXR1cm4gQ2FsbGluZ0RldGFpbHNVdGlscy5nZXRDYWxsU3RhdHVzKGNhbGwsIHRoaXMubG9nZ2VkSW5Vc2VyKTtcbiAgfTtcbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcblxuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRyeSB7XG4gICAgICAvL1JlbW92aW5nIE1lc3NhZ2UgTGlzdGVuZXJzXG4gICAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlQ2FsbExpc3RlbmVyKHRoaXMuY2FsbExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKVxuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZVJlYWN0aW9uUmVtb3ZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWRUb0FsbD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWRCeUFsbD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblRyYW5zaWVudE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFJlYWN0aW9uc1N0eWxlIG9iamVjdCB3aXRoIHRoZSBkZWZpbmVkIG9yIGRlZmF1bHQgc3R5bGVzLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UmVhY3Rpb25zU3R5bGV9IFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgUmVhY3Rpb25zU3R5bGUgd2l0aCB0aGUgc2V0IG9yIGRlZmF1bHQgc3R5bGVzLlxuICAgKi9cbiAgZ2V0UmVhY3Rpb25zU3R5bGUoKSB7XG4gICAgY29uc3QgcmVhY3Rpb25zU3R5bGUgPSB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uc1N0eWxlIHx8IHt9O1xuICAgIHJldHVybiBuZXcgUmVhY3Rpb25zU3R5bGUoe1xuICAgICAgaGVpZ2h0OiByZWFjdGlvbnNTdHlsZT8uaGVpZ2h0IHx8IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiByZWFjdGlvbnNTdHlsZT8ud2lkdGggfHwgXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyOiByZWFjdGlvbnNTdHlsZT8uYm9yZGVyIHx8IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiByZWFjdGlvbnNTdHlsZT8uYm9yZGVyUmFkaXVzIHx8IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogcmVhY3Rpb25zU3R5bGU/LmJhY2tncm91bmQgfHwgXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgYWN0aXZlUmVhY3Rpb25CYWNrZ3JvdW5kOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25CYWNrZ3JvdW5kIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeTE1MCgpLFxuICAgICAgcmVhY3Rpb25CYWNrZ3JvdW5kOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25CYWNrZ3JvdW5kIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgcmVhY3Rpb25Cb3JkZXI6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkJvcmRlciB8fFxuICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYWN0aXZlUmVhY3Rpb25Cb3JkZXI6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5hY3RpdmVSZWFjdGlvbkJvcmRlciB8fFxuICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5NTAwKCl9YCxcbiAgICAgIHJlYWN0aW9uQm9yZGVyUmFkaXVzOiByZWFjdGlvbnNTdHlsZT8ucmVhY3Rpb25Cb3JkZXJSYWRpdXMgfHwgXCIxMnB4XCIsXG4gICAgICBhY3RpdmVSZWFjdGlvbkNvdW50VGV4dENvbG9yOlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25Db3VudFRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlUmVhY3Rpb25Db3VudFRleHRGb250OlxuICAgICAgICByZWFjdGlvbnNTdHlsZT8uYWN0aXZlUmVhY3Rpb25Db3VudFRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZWFjdGlvbkNvdW50VGV4dEZvbnQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkNvdW50VGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlYWN0aW9uQ291bnRUZXh0Q29sb3I6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkNvdW50VGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICByZWFjdGlvbkJveFNoYWRvdzpcbiAgICAgICAgcmVhY3Rpb25zU3R5bGU/LnJlYWN0aW9uQm94U2hhZG93IHx8IFwicmdiYSgwLCAwLCAwLCAwLjEpIDBweCA0cHggMTJweFwiLFxuICAgICAgcmVhY3Rpb25FbW9qaUZvbnQ6XG4gICAgICAgIHJlYWN0aW9uc1N0eWxlPy5yZWFjdGlvbkVtb2ppRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICB9KTtcbiAgfVxuICBpc01vYmlsZVZpZXcgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIDw9IDc2ODtcbiAgfTtcbiAgZ2V0QnViYmxlQnlJZChpZDogc3RyaW5nKTogRWxlbWVudFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IHRhcmdldEJ1YmJsZTogRWxlbWVudFJlZiB8IHVuZGVmaW5lZDtcbiAgICB0aGlzLm1lc3NhZ2VCdWJibGVSZWYuZm9yRWFjaCgoYnViYmxlOiBFbGVtZW50UmVmKSA9PiB7XG4gICAgICBpZiAoYnViYmxlLm5hdGl2ZUVsZW1lbnQuaWQgPT09IGlkKVxuICAgICAgICB0YXJnZXRCdWJibGUgPSBidWJibGU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0QnViYmxlO1xuICB9XG4gIHNob3dFbW9qaUtleWJvYXJkID0gKGlkOiBudW1iZXIsIGV2ZW50OiBhbnkpID0+IHtcbiAgICBDb21ldENoYXRVSUV2ZW50cy5jY0FjdGl2ZVBvcG92ZXIubmV4dChBY3RpdmVQb3BvdmVyLm1lc3NhZ2VMaXN0KVxuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBmYWxzZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUb1JlYWN0ID0gbWVzc2FnZTtcbiAgICAgIGlmICh0aGlzLmlzTW9iaWxlVmlldygpKSB7XG4gICAgICAgIGxldCBidWJibGVSZWYgPSB0aGlzLmdldEJ1YmJsZUJ5SWQoU3RyaW5nKGlkKSlcbiAgICAgICAgaWYgKGJ1YmJsZVJlZikge1xuICAgICAgICAgIGNvbnN0IHJlY3QgPSBidWJibGVSZWYubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICBjb25zdCBpc0F0VG9wID0gcmVjdC50b3AgPCBpbm5lckhlaWdodCAvIDI7XG4gICAgICAgICAgY29uc3QgaXNBdEJvdHRvbSA9IHJlY3QuYm90dG9tID4gd2luZG93LmlubmVySGVpZ2h0IC8gMjtcbiAgICAgICAgICBpZiAoaXNBdFRvcCkge1xuICAgICAgICAgICAgdGhpcy5rZXlib2FyZEFsaWdubWVudCA9IFBsYWNlbWVudC5ib3R0b207XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0F0Qm90dG9tKSB7XG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkQWxpZ25tZW50ID0gUGxhY2VtZW50LnRvcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmtleWJvYXJkQWxpZ25tZW50ID1cbiAgICAgICAgICBtZXNzYWdlLmdldFNlbmRlcigpPy5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgID8gUGxhY2VtZW50LmxlZnRcbiAgICAgICAgICAgIDogUGxhY2VtZW50LnJpZ2h0O1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgdGhpcy5wb3BvdmVyUmVmLm5hdGl2ZUVsZW1lbnQub3BlbkNvbnRlbnRWaWV3KGV2ZW50KTtcbiAgICB9XG4gIH07XG4gIHNldEJ1YmJsZVZpZXcgPSAoKSA9PiB7XG4gICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKSA9PiB7XG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFtlbGVtZW50LmNhdGVnb3J5KydfJytlbGVtZW50LnR5cGVdID0gZWxlbWVudDsgICAgICBcbiAgICB9KTtcbiAgfTtcbiAgb3BlblRocmVhZFZpZXcgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgaWYgKHRoaXMub25UaHJlYWRSZXBsaWVzQ2xpY2spIHtcbiAgICAgIHRoaXMub25UaHJlYWRSZXBsaWVzQ2xpY2sobWVzc2FnZSwgdGhpcy50aHJlYWRNZXNzYWdlQnViYmxlKTtcbiAgICB9XG4gIH07XG4gIHRocmVhZENhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vcGVuVGhyZWFkVmlldyhtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgZGVsZXRlQ2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLmRlbGV0ZU1lc3NhZ2UobWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIGVkaXRDYWxsYmFjayA9IChpZDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3Q6IGFueSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIHRoaXMub25FZGl0TWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgfTtcbiAgY29weUNhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vbkNvcHlNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBtZXNzYWdlUHJpdmF0ZWx5Q2FsbGJhY2sgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlT2JqZWN0OiBhbnkgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKGlkKTtcbiAgICB0aGlzLnNlbmRNZXNzYWdlUHJpdmF0ZWx5KG1lc3NhZ2VPYmplY3QpO1xuICB9O1xuICBtZXNzYWdlSW5mb0NhbGxiYWNrID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBsZXQgbWVzc2FnZU9iamVjdDogYW55ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChpZCk7XG4gICAgdGhpcy5vcGVuTWVzc2FnZUluZm8obWVzc2FnZU9iamVjdCk7XG4gIH07XG4gIG9wZW5NZXNzYWdlSW5mbyhtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0aGlzLm9wZW5NZXNzYWdlSW5mb1BhZ2UgPSB0cnVlO1xuICAgIHRoaXMubWVzc2FnZUluZm9PYmplY3QgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUobWVzc2FnZU9iamVjdCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGNsb3NlTWVzc2FnZUluZm9QYWdlID0gKCkgPT4ge1xuICAgIHRoaXMub3Blbk1lc3NhZ2VJbmZvUGFnZSA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2VuZE1lc3NhZ2VQcml2YXRlbHkobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NPcGVuQ2hhdC5uZXh0KHsgdXNlcjogbWVzc2FnZU9iamVjdC5nZXRTZW5kZXIoKSB9KTtcbiAgfVxuICBnZXRNZXNzYWdlQnlJZChpZDogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoKG0pID0+IG0uZ2V0SWQoKSA9PSBpZCk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGlzVHJhbnNsYXRlZChtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBhbnkge1xuICAgIGxldCB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdDogYW55ID0gbWVzc2FnZTtcbiAgICBpZiAoXG4gICAgICB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdCAmJlxuICAgICAgdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3Q/LmRhdGE/Lm1ldGFkYXRhICYmXG4gICAgICB0cmFuc2xhdGVkTWVzc2FnZU9iamVjdD8uZGF0YT8ubWV0YWRhdGFbXG4gICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudHJhbnNsYXRlZF9tZXNzYWdlXG4gICAgICBdXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJhbnNsYXRlZE1lc3NhZ2VPYmplY3QuZGF0YS5tZXRhZGF0YVtcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLnRyYW5zbGF0ZWRfbWVzc2FnZVxuICAgICAgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIHVwZGF0ZVRyYW5zbGF0ZWRNZXNzYWdlID0gKHRyYW5zbGF0aW9uOiBhbnkpID0+IHtcbiAgICB2YXIgcmVjZWl2ZWRNZXNzYWdlID0gdHJhbnNsYXRpb247XG4gICAgdmFyIHRyYW5zbGF0ZWRUZXh0ID0gcmVjZWl2ZWRNZXNzYWdlLnRyYW5zbGF0aW9uc1swXS5tZXNzYWdlX3RyYW5zbGF0ZWQ7XG4gICAgbGV0IG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgbGV0IG1lc3NhZ2VLZXkgPSBtZXNzYWdlTGlzdC5maW5kSW5kZXgoXG4gICAgICAobSkgPT4gbS5nZXRJZCgpID09PSByZWNlaXZlZE1lc3NhZ2UubXNnSWRcbiAgICApO1xuICAgIGxldCBkYXRhOiBhbnk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgdmFyIG1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VLZXldO1xuICAgICAgaWYgKChtZXNzYWdlT2JqIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0TWV0YWRhdGEoKSkge1xuICAgICAgICBkYXRhID0gKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRNZXRhZGF0YSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKG1lc3NhZ2VPYmogYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5zZXRNZXRhZGF0YSh7fSk7XG4gICAgICAgIGRhdGEgPSAobWVzc2FnZU9iaiBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldE1ldGFkYXRhKCk7XG4gICAgICB9XG4gICAgICBkYXRhW01lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy50cmFuc2xhdGVkX21lc3NhZ2VdID0gdHJhbnNsYXRlZFRleHQ7XG4gICAgICB2YXIgbmV3TWVzc2FnZU9iajogQ29tZXRDaGF0LlRleHRNZXNzYWdlIHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlID1cbiAgICAgICAgbWVzc2FnZU9iajtcbiAgICAgIG1lc3NhZ2VMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBuZXdNZXNzYWdlT2JqKTtcbiAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VMaXN0XTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH07XG4gIHRyYW5zbGF0ZU1lc3NhZ2UgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgfCBmYWxzZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoaWQpO1xuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICBDb21ldENoYXQuY2FsbEV4dGVuc2lvbihcbiAgICAgICAgTWVzc2FnZVRyYW5zbGF0aW9uQ29uc3RhbnRzLm1lc3NhZ2VfdHJhbnNsYXRpb24sXG4gICAgICAgIE1lc3NhZ2VUcmFuc2xhdGlvbkNvbnN0YW50cy5wb3N0LFxuICAgICAgICBNZXNzYWdlVHJhbnNsYXRpb25Db25zdGFudHMudjJfdHJhbnNsYXRlLFxuICAgICAgICB7XG4gICAgICAgICAgbXNnSWQ6IG1lc3NhZ2UuZ2V0SWQoKSxcbiAgICAgICAgICB0ZXh0OiAobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldFRleHQoKSxcbiAgICAgICAgICBsYW5ndWFnZXM6IG5hdmlnYXRvci5sYW5ndWFnZXMsXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgICAgLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgcmVzdWx0Py50cmFuc2xhdGlvbnNbMF0/Lm1lc3NhZ2VfdHJhbnNsYXRlZCAhPVxuICAgICAgICAgICAgKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKT8uZ2V0VGV4dCgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVRyYW5zbGF0ZWRNZXNzYWdlKHJlc3VsdCk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVzdWx0IG9mIHRyYW5zbGF0aW9uc1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7IH0pO1xuICAgIH1cbiAgfTtcbiAgc2V0T3B0aW9uc0NhbGxiYWNrKG9wdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSwgaWQ6IG51bWJlcikge1xuICAgIG9wdGlvbnM/LmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24pID0+IHtcbiAgICAgIHN3aXRjaCAoZWxlbWVudC5pZCkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uZGVsZXRlTWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5kZWxldGVDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5lZGl0TWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5lZGl0Q2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24udHJhbnNsYXRlTWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy50cmFuc2xhdGVNZXNzYWdlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLmNvcHlNZXNzYWdlOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLmNvcHlDYWxsYmFjaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5yZWFjdFRvTWVzc2FnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljayB8fCAhKGVsZW1lbnQgYXMgYW55KS5jdXN0b21WaWV3KSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlcGx5SW5UaHJlYWQ6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMudGhyZWFkQ2FsbGJhY2s7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uc2VuZE1lc3NhZ2VQcml2YXRlbHk6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMubWVzc2FnZVByaXZhdGVseUNhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLm1lc3NhZ2VJbmZvcm1hdGlvbjpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5tZXNzYWdlSW5mb0NhbGxiYWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuICAvKipcbiAgICogc2VuZCBtZXNzYWdlIG9wdGlvbnMgYmFzZWQgb24gdHlwZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1zZ09iamVjdFxuICAgKi9cbiAgc2V0TWVzc2FnZU9wdGlvbnMoXG4gICAgbXNnT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdIHtcbiAgICBsZXQgb3B0aW9ucyE6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXTtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUubGVuZ3RoID4gMCAmJlxuICAgICAgIW1zZ09iamVjdD8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZ09iamVjdD8uZ2V0VHlwZSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlclxuICAgICkge1xuICAgICAgdGhpcy5tZXNzYWdlVGVtcGxhdGUuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBtc2dPYmplY3Q/LmdldElkKCkgJiZcbiAgICAgICAgICBlbGVtZW50LnR5cGUgPT0gbXNnT2JqZWN0Py5nZXRUeXBlKCkgJiZcbiAgICAgICAgICBlbGVtZW50Py5vcHRpb25zXG4gICAgICAgICkge1xuICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgdGhpcy5zZXRPcHRpb25zQ2FsbGJhY2soXG4gICAgICAgICAgICAgIGVsZW1lbnQ/Lm9wdGlvbnMoXG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIsXG4gICAgICAgICAgICAgICAgbXNnT2JqZWN0LFxuICAgICAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgbXNnT2JqZWN0Py5nZXRJZCgpXG4gICAgICAgICAgICApIHx8IFtdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IFtdO1xuICAgIH1cbiAgICBvcHRpb25zID0gdGhpcy5maWx0ZXJFbW9qaU9wdGlvbnMob3B0aW9ucyk7XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH1cbiAgLyoqXG4gICAqIFJlYWN0cyB0byBhIG1lc3NhZ2UgYnkgZWl0aGVyIGFkZGluZyBvciByZW1vdmluZyB0aGUgcmVhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbW9qaSAtIFRoZSBlbW9qaSB1c2VkIGZvciB0aGUgcmVhY3Rpb24uXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdGhhdCB3YXMgcmVhY3RlZCB0by5cbiAgICovXG5cbiAgcmVhY3RUb01lc3NhZ2UoZW1vamk6IHN0cmluZywgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgY29uc3QgbWVzc2FnZUlkID0gbWVzc2FnZT8uZ2V0SWQoKTtcbiAgICBjb25zdCBtc2dPYmplY3QgPSB0aGlzLmdldE1lc3NhZ2VCeUlkKG1lc3NhZ2VJZCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlO1xuICAgIGNvbnN0IHJlYWN0aW9ucyA9IG1zZ09iamVjdD8uZ2V0UmVhY3Rpb25zKCkgfHwgW107XG4gICAgY29uc3QgZW1vamlPYmplY3QgPSByZWFjdGlvbnM/LmZpbmQoKHJlYWN0aW9uOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiByZWFjdGlvbj8ucmVhY3Rpb24gPT0gZW1vamk7XG4gICAgfSk7XG4gICAgaWYgKGVtb2ppT2JqZWN0ICYmIGVtb2ppT2JqZWN0Py5nZXRSZWFjdGVkQnlNZSgpKSB7XG4gICAgICBjb25zdCB1cGRhdGVkUmVhY3Rpb25zOiBhbnlbXSA9IFtdO1xuICAgICAgcmVhY3Rpb25zLmZvckVhY2goKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChyZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSA9PSBlbW9qaSkge1xuICAgICAgICAgIGlmIChyZWFjdGlvbj8uZ2V0Q291bnQoKSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFjdGlvbi5zZXRDb3VudChyZWFjdGlvbj8uZ2V0Q291bnQoKSAtIDEpO1xuICAgICAgICAgICAgcmVhY3Rpb24uc2V0UmVhY3RlZEJ5TWUoZmFsc2UpO1xuICAgICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBtc2dPYmplY3Quc2V0UmVhY3Rpb25zKHVwZGF0ZWRSZWFjdGlvbnMpO1xuICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1zZ09iamVjdCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlUmVhY3Rpb24obWVzc2FnZUlkLCBlbW9qaSlcbiAgICAgICAgLnRoZW4oKG1lc3NhZ2UpID0+IHsgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIC8vIFJldHVybiBvbGQgbWVzc2FnZSBvYmplY3QgaW5zdGVhZCBvZlxuICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpOyAvL25lZWQgY2hhbmdlc1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgIGNvbnN0IHJlYWN0aW9uQXZhaWxhYmxlID0gcmVhY3Rpb25zLmZpbmQoKHJlYWN0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiByZWFjdGlvbj8uZ2V0UmVhY3Rpb24oKSA9PSBlbW9qaTtcbiAgICAgIH0pO1xuXG4gICAgICByZWFjdGlvbnMuZm9yRWFjaCgocmVhY3Rpb24pID0+IHtcbiAgICAgICAgaWYgKHJlYWN0aW9uPy5nZXRSZWFjdGlvbigpID09IGVtb2ppKSB7XG4gICAgICAgICAgcmVhY3Rpb24uc2V0Q291bnQocmVhY3Rpb24/LmdldENvdW50KCkgKyAxKTtcbiAgICAgICAgICByZWFjdGlvbi5zZXRSZWFjdGVkQnlNZSh0cnVlKTtcbiAgICAgICAgICB1cGRhdGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKCFyZWFjdGlvbkF2YWlsYWJsZSkge1xuICAgICAgICBjb25zdCByZWFjdDogQ29tZXRDaGF0LlJlYWN0aW9uQ291bnQgPSBuZXcgQ29tZXRDaGF0LlJlYWN0aW9uQ291bnQoXG4gICAgICAgICAgZW1vamksXG4gICAgICAgICAgMSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICAgIHVwZGF0ZWRSZWFjdGlvbnMucHVzaChyZWFjdCk7XG4gICAgICB9XG4gICAgICBtc2dPYmplY3Quc2V0UmVhY3Rpb25zKHVwZGF0ZWRSZWFjdGlvbnMpO1xuICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1zZ09iamVjdCk7XG4gICAgICBDb21ldENoYXQuYWRkUmVhY3Rpb24obWVzc2FnZUlkLCBlbW9qaSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHsgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtc2dPYmplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEZpbHRlcnMgb3V0IHRoZSAnYWRkIHJlYWN0aW9uJyBvcHRpb24gaWYgcmVhY3Rpb25zIGFyZSBkaXNhYmxlZC5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXRNZXNzYWdlT3B0aW9uW119IG9wdGlvbnMgLSBUaGUgb3JpZ2luYWwgc2V0IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAgICogQHJldHVybnMge0NvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXX0gVGhlIGZpbHRlcmVkIHNldCBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gICAqL1xuXG4gIGZpbHRlckVtb2ppT3B0aW9ucyA9IChvcHRpb25zOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10pID0+IHtcbiAgICBpZiAodGhpcy5kaXNhYmxlUmVhY3Rpb25zICYmIG9wdGlvbnM/Lmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZpbHRlcigob3B0aW9uOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiBvcHRpb24uaWQgIT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVhY3RUb01lc3NhZ2U7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH07XG4gIGdldENsb25lZFJlYWN0aW9uT2JqZWN0KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUobWVzc2FnZSk7XG4gIH1cbiAgLyoqXG4gICAqIHBhc3Npbmcgc3R5bGUgYmFzZWQgb24gbWVzc2FnZSBvYmplY3RcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlT2JqZWN0XG4gICAqL1xuICBzZXRNZXNzYWdlQnViYmxlU3R5bGUobXNnOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBCYXNlU3R5bGUge1xuICAgIGxldCBzdHlsZSE6IEJhc2VTdHlsZTtcbiAgICBpZiAobXNnPy5nZXREZWxldGVkQXQoKSkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyOiBgMXB4IGRhc2hlZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCl9YCxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLm1lZXRpbmcgJiZcbiAgICAgICghbXNnPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgICBtc2c/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpKVxuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgICAvLyB9IGVsc2UgaWYgKHRoaXMuZ2V0TGlua1ByZXZpZXcobXNnIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkpIHtcbiAgICAgIC8vICAgc3R5bGUgPSB7XG4gICAgICAvLyAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgLy8gICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICAvLyAgIH07XG4gICAgfSBlbHNlIGlmIChtc2c/LmdldFR5cGUoKSA9PSBTdGlja2Vyc0NvbnN0YW50cy5zdGlja2VyKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgIW1zZz8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1zZz8uZ2V0Q2F0ZWdvcnkoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSAmJlxuICAgICAgbXNnPy5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQgJiZcbiAgICAgICghbXNnPy5nZXRTZW5kZXIoKSB8fFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT0gbXNnPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSlcbiAgICApIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOlxuICAgICAgICAgIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnRcbiAgICAgICAgICAgID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKVxuICAgICAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFtc2c/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtc2c/LmdldENhdGVnb3J5KCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICkge1xuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG1zZz8uZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlciB8fFxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50XG4gICAgKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpfWAsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAhbXNnPy5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbXNnPy5nZXRDYXRlZ29yeSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmVcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1zZz8uZ2V0U2VuZGVyKCkgJiZcbiAgICAgICAgbXNnPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPSB0aGlzLmxvZ2dlZEluVXNlci5nZXRVaWQoKVxuICAgICAgKSB7XG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0eWxlO1xuICB9XG4gIGdldFNlc3Npb25JZChtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgIGxldCBkYXRhOiBhbnkgPSBtZXNzYWdlLmdldERhdGEoKTtcbiAgICByZXR1cm4gZGF0YT8uY3VzdG9tRGF0YT8uc2Vzc2lvbklEO1xuICB9XG4gIGdldFdoaXRlYm9hcmREb2N1bWVudChtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAobWVzc2FnZT8uZ2V0RGF0YSgpKSB7XG4gICAgICAgIHZhciBkYXRhOiBhbnkgPSBtZXNzYWdlLmdldERhdGEoKTtcbiAgICAgICAgaWYgKGRhdGE/Lm1ldGFkYXRhKSB7XG4gICAgICAgICAgdmFyIG1ldGFkYXRhID0gZGF0YT8ubWV0YWRhdGE7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkobWV0YWRhdGEsIFwiQGluamVjdGVkXCIpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB2YXIgaW5qZWN0ZWRPYmplY3QgPSBtZXRhZGF0YVtcIkBpbmplY3RlZFwiXTtcbiAgICAgICAgICAgIGlmIChpbmplY3RlZE9iamVjdD8uZXh0ZW5zaW9ucykge1xuICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uT2JqZWN0ID0gaW5qZWN0ZWRPYmplY3QuZXh0ZW5zaW9ucztcbiAgICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbk9iamVjdFtcbiAgICAgICAgICAgICAgICBDb2xsYWJvcmF0aXZlV2hpdGVib2FyZENvbnN0YW50cy53aGl0ZWJvYXJkXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICA/IGV4dGVuc2lvbk9iamVjdFtDb2xsYWJvcmF0aXZlV2hpdGVib2FyZENvbnN0YW50cy53aGl0ZWJvYXJkXVxuICAgICAgICAgICAgICAgICAgLmJvYXJkX3VybFxuICAgICAgICAgICAgICAgIDogZXh0ZW5zaW9uT2JqZWN0W0NvbGxhYm9yYXRpdmVEb2N1bWVudENvbnN0YW50cy5kb2N1bWVudF1cbiAgICAgICAgICAgICAgICAgIC5kb2N1bWVudF91cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wZW5MaW5rVVJMKGV2ZW50OiBhbnkpIHtcbiAgICB3aW5kb3cub3BlbihldmVudD8uZGV0YWlsPy51cmwsIFwiX2JsYW5rXCIpO1xuICB9XG4gIGdldFN0aWNrZXIobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IHN0aWNrZXJEYXRhOiBhbnkgPSBudWxsO1xuICAgICAgaWYgKFxuICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIFN0aWNrZXJzQ29uc3RhbnRzLmRhdGFcbiAgICAgICAgKSAmJlxuICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICAobWVzc2FnZSBhcyBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkuZ2V0RGF0YSgpLFxuICAgICAgICAgIFN0aWNrZXJzQ29uc3RhbnRzLmN1c3RvbV9kYXRhXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBzdGlja2VyRGF0YSA9IChtZXNzYWdlIGFzIGFueSkuZGF0YS5jdXN0b21EYXRhO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgICAgICBzdGlja2VyRGF0YSxcbiAgICAgICAgICAgIFN0aWNrZXJzQ29uc3RhbnRzLnN0aWNrZXJfdXJsXG4gICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gc3RpY2tlckRhdGEuc3RpY2tlcl91cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnc3RhdHVzSW5mb1ZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldENvbnRlbnRWaWV3ID0gKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCA9PiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldICYmXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LmNvbnRlbnRWaWV3XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5jb250ZW50VmlldyhtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1lc3NhZ2UuZ2V0RGVsZXRlZEF0KClcbiAgICAgICAgPyB0aGlzLnR5cGVzTWFwW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dF1cbiAgICAgICAgOiB0aGlzLnR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlICdoZWFkZXJWaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuICBnZXRIZWFkZXJWaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBsZXQgdmlldzogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPSBudWxsO1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5oZWFkZXJWaWV3XG4gICAgKSB7XG4gICAgICB2aWV3ID0gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5oZWFkZXJWaWV3KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSAnZm9vdGVyVmlldycgaXMgcHJlc2VudCBpbiB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgKiBJZiBwcmVzZW50LCByZXR1cm5zIHRoZSB1c2VyLWRlZmluZWQgdGVtcGxhdGUsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2Ugb2JqZWN0IGZvciB3aGljaCB0aGUgc3RhdHVzIGluZm8gdmlldyBuZWVkcyB0byBiZSBmZXRjaGVkXG4gICAqIEByZXR1cm5zIFVzZXItZGVmaW5lZCBUZW1wbGF0ZVJlZiBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbFxuICAgKi9cbiAgZ2V0Rm9vdGVyVmlldyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgbGV0IHZpZXc6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uZm9vdGVyVmlld1xuICAgICkge1xuICAgICAgdmlldyA9IHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uZm9vdGVyVmlldyhtZXNzYWdlKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ2JvdHRvbVZpZXcnIGlzIHByZXNlbnQgaW4gdGhlIGRlZmF1bHQgdGVtcGxhdGUgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICogSWYgcHJlc2VudCwgcmV0dXJucyB0aGUgdXNlci1kZWZpbmVkIHRlbXBsYXRlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIG9iamVjdCBmb3Igd2hpY2ggdGhlIHN0YXR1cyBpbmZvIHZpZXcgbmVlZHMgdG8gYmUgZmV0Y2hlZFxuICAgKiBAcmV0dXJucyBVc2VyLWRlZmluZWQgVGVtcGxhdGVSZWYgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIG51bGxcbiAgICovXG4gIGdldEJvdHRvbVZpZXcobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGlmIChcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5ib3R0b21WaWV3XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZS5nZXRDYXRlZ29yeSgpKydfJyttZXNzYWdlPy5nZXRUeXBlKCldPy5ib3R0b21WaWV3KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgJ3N0YXR1c0luZm9WaWV3JyBpcyBwcmVzZW50IGluIHRoZSBkZWZhdWx0IHRlbXBsYXRlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyXG4gICAqIElmIHByZXNlbnQsIHJldHVybnMgdGhlIHVzZXItZGVmaW5lZCB0ZW1wbGF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSBvYmplY3QgZm9yIHdoaWNoIHRoZSBzdGF0dXMgaW5mbyB2aWV3IG5lZWRzIHRvIGJlIGZldGNoZWRcbiAgICogQHJldHVybnMgVXNlci1kZWZpbmVkIFRlbXBsYXRlUmVmIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsXG4gICAqL1xuXG4gIGdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0gJiZcbiAgICAgIHRoaXMubWVzc2FnZVR5cGVzTWFwW21lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXT8uc3RhdHVzSW5mb1ZpZXdcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VUeXBlc01hcFttZXNzYWdlLmdldENhdGVnb3J5KCkrJ18nK21lc3NhZ2U/LmdldFR5cGUoKV0/LnN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgaXNBdWRpb09yVmlkZW9NZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IG1lc3NhZ2VUeXBlID0gbWVzc2FnZT8uZ2V0VHlwZSgpO1xuICAgIGNvbnN0IHR5cGVzVG9DaGVjayA9IFtcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5pbWFnZSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbyxcbiAgICBdO1xuICAgIHJldHVybiB0eXBlc1RvQ2hlY2suaW5jbHVkZXMobWVzc2FnZVR5cGUpO1xuICB9XG5cbiAgc2V0QnViYmxlQWxpZ25tZW50ID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGxldCBhbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmNlbnRlcjtcbiAgICBpZiAodGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdCkge1xuICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIgfHxcbiAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50XG4gICAgICApIHtcbiAgICAgICAgYWxpZ25tZW50ID0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5jZW50ZXI7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgICAgKG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpICYmXG4gICAgICAgICAgbWVzc2FnZT8uZ2V0VHlwZSgpICE9XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyKVxuICAgICAgKSB7XG4gICAgICAgIGFsaWdubWVudCA9IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQucmlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGlnbm1lbnQgPSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhbGlnbm1lbnQ7XG4gIH07XG5cbiAgZ2V0Rm9ybU1lc3NhZ2VCdWJibGVTdHlsZSgpIHtcbiAgICBjb25zdCB0ZXh0U3R5bGUgPSBuZXcgSW5wdXRTdHlsZSh7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMzBweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjZweFwiLFxuICAgICAgcGFkZGluZzogXCIwcHggMHB4IDBweCA1cHhcIixcbiAgICAgIHBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICB9KTtcbiAgICBjb25zdCBsYWJlbFN0eWxlID0gbmV3IExhYmVsU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHJhZGlvQnV0dG9uU3R5bGUgPSBuZXcgUmFkaW9CdXR0b25TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGxhYmVsVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbGFiZWxUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGNoZWNrYm94U3R5bGUgPSBuZXcgQ2hlY2tib3hTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI0cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgICBsYWJlbFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGxhYmVsVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IGRyb3Bkb3duU3R5bGUgPSBuZXcgRHJvcGRvd25TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMzVweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBhY3RpdmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBhY3RpdmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhcnJvd0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgb3B0aW9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBvcHRpb25Cb3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWAsXG4gICAgICBvcHRpb25Ib3ZlckJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGhvdmVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgaG92ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBob3ZlclRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IGJ1dHRvbkdyb3VwU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiNDBweFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICB9O1xuICAgIGNvbnN0IHNpbmdsZVNlbGVjdFN0eWxlID0gbmV3IFNpbmdsZVNlbGVjdFN0eWxlKHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgYWN0aXZlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYWN0aXZlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYWN0aXZlVGV4dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBvcHRpb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG9wdGlvbkJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIG9wdGlvbkJvcmRlclJhZGl1czogXCIzcHhcIixcbiAgICAgIGhvdmVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgaG92ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBob3ZlclRleHRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHF1aWNrVmlld1N0eWxlID0gbmV3IFF1aWNrVmlld1N0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsZWFkaW5nQmFyVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBsZWFkaW5nQmFyV2lkdGg6IFwiNHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBGb3JtQnViYmxlU3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHdyYXBwZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHdyYXBwZXJCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB0ZXh0SW5wdXRTdHlsZTogdGV4dFN0eWxlLFxuICAgICAgbGFiZWxTdHlsZTogbGFiZWxTdHlsZSxcbiAgICAgIHJhZGlvQnV0dG9uU3R5bGU6IHJhZGlvQnV0dG9uU3R5bGUsXG4gICAgICBjaGVja2JveFN0eWxlOiBjaGVja2JveFN0eWxlLFxuICAgICAgZHJvcGRvd25TdHlsZTogZHJvcGRvd25TdHlsZSxcbiAgICAgIGJ1dHRvblN0eWxlOiBidXR0b25Hcm91cFN0eWxlLFxuICAgICAgc2luZ2xlU2VsZWN0U3R5bGU6IHNpbmdsZVNlbGVjdFN0eWxlLFxuICAgICAgcXVpY2tWaWV3U3R5bGU6IHF1aWNrVmlld1N0eWxlLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGdvYWxDb21wbGV0aW9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgd3JhcHBlclBhZGRpbmc6IFwiMnB4XCIsXG4gICAgICBkYXRlUGlja2VyQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gLFxuICAgICAgZGF0ZVBpY2tlckJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgIGRhdGVQaWNrZXJGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGRhdGVQaWNrZXJGb250Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgfSk7XG4gIH1cblxuICBnZXRDYXJkTWVzc2FnZUJ1YmJsZVN0eWxlKCkge1xuICAgIGNvbnN0IGJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBweFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiBgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKX1gLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgQ2FyZEJ1YmJsZVN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICAgIGltYWdlSGVpZ2h0OiBcImF1dG9cIixcbiAgICAgIGltYWdlV2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaW1hZ2VSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBpbWFnZUJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZGVzY3JpcHRpb25Gb250Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkZXNjcmlwdGlvbkZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uU3R5bGU6IGJ1dHRvblN0eWxlLFxuICAgICAgZGl2aWRlclRpbnRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIHdyYXBwZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHdyYXBwZXJCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICB3cmFwcGVyUGFkZGluZzogXCIycHhcIixcbiAgICAgIGRpc2FibGVkQnV0dG9uQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cblxuICBnZXRDYWxsQnViYmxlU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdmFyIGlzTGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIHZhciBpc1VzZXJTZW50TWVzc2FnZSA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgaWYgKGlzVXNlclNlbnRNZXNzYWdlICYmICFpc0xlZnRBbGlnbmVkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgICAgd2lkdGg6IFwiMjQwcHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICBidXR0b25UZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICB3aWR0aDogXCIyNDBweFwiLFxuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgZ2V0QnViYmxlV3JhcHBlciA9IChcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwgPT4ge1xuICAgIGxldCB2aWV3OiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbDtcbiAgICBpZiAoXG4gICAgICB0aGlzLm1lc3NhZ2VUeXBlc01hcCAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXSAmJlxuICAgICAgdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXS5idWJibGVWaWV3XG4gICAgKSB7XG4gICAgICB2aWV3ID0gdGhpcy5tZXNzYWdlVHlwZXNNYXBbbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSsnXycrbWVzc2FnZT8uZ2V0VHlwZSgpXS5idWJibGVWaWV3KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpZXcgPSBudWxsO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfVxuICB9O1xuICBnZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxpZ25tZW50ID09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQgfHxcbiAgICAgIChtZXNzYWdlLmdldFNlbmRlcigpICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKCkpXG4gICAgICA/IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdFxuICAgICAgOiBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICB9XG4gIHNldFRyYW5zbGF0aW9uU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdmFyIGlzTGVmdEFsaWduZWQgPSB0aGlzLmFsaWdubWVudCAhPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdDtcbiAgICB2YXIgaXNVc2VyU2VudE1lc3NhZ2UgPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEuZ2V0VWlkKCkgPT09IG1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpO1xuICAgIGlmICghaXNMZWZ0QWxpZ25lZCkge1xuICAgICAgcmV0dXJuIG5ldyBNZXNzYWdlVHJhbnNsYXRpb25TdHlsZSh7XG4gICAgICAgIHRyYW5zbGF0ZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICksXG4gICAgICAgIHRyYW5zbGF0ZWRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwibGlnaHRcIiksXG4gICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICAgIGhlbHBUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc1VzZXJTZW50TWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gbmV3IE1lc3NhZ2VUcmFuc2xhdGlvblN0eWxlKHtcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0cmFuc2xhdGVkVGV4dENvbG9yOlxuICAgICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKFwiZGFya1wiKSxcbiAgICAgICAgICBoZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTWVzc2FnZVRyYW5zbGF0aW9uU3R5bGUoe1xuICAgICAgICAgIHRyYW5zbGF0ZWRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICAgICApLFxuICAgICAgICAgIHRyYW5zbGF0ZWRUZXh0Q29sb3I6XG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImxpZ2h0XCIpLFxuICAgICAgICAgIGhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICAgICAgaGVscFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBnZXRDYWxsVHlwZUljb24obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbykge1xuICAgICAgcmV0dXJuIFwiYXNzZXRzL0F1ZGlvLUNhbGwuc3ZnXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcImFzc2V0cy9WaWRlby1jYWxsLnN2Z1wiO1xuICAgIH1cbiAgfVxuICBjYWxsU3RhdHVzU3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG5cbiAgICBpZiAobWVzc2FnZS5nZXRDYXRlZ29yeSgpID09IHRoaXMuY2FsbENvbnN0YW50KSB7XG4gICAgICBsZXQgbWlzc2VkQ2FsbFRleHRDb2xvciA9IENhbGxpbmdEZXRhaWxzVXRpbHMuaXNNaXNzZWRDYWxsKFxuICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5DYWxsLFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlclxuICAgICAgKVxuICAgICAgICA/IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKVxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvblRleHRDb2xvcjogbWlzc2VkQ2FsbFRleHRDb2xvcixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwcHhcIixcbiAgICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgICAgYnV0dG9uSWNvblRpbnQ6IG1pc3NlZENhbGxUZXh0Q29sb3IsXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgcGFkZGluZzogXCI4cHggMTJweFwiLFxuICAgICAgICBnYXA6IFwiNHB4XCIsXG4gICAgICAgIGhlaWdodDogXCIyNXB4XCIsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIHNldFRleHRCdWJibGVTdHlsZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICBsZXQgaXNJbmZvQnViYmxlID0gdGhpcy5tZXNzYWdlSW5mb09iamVjdCAmJiBtZXNzYWdlLmdldElkKCkgJiYgdGhpcy5tZXNzYWdlSW5mb09iamVjdC5nZXRJZCgpID09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgIHZhciBpc0RlbGV0ZWQgPSBtZXNzYWdlLmdldERlbGV0ZWRBdCgpO1xuICAgIHZhciBub3RMZWZ0QWxpZ25lZCA9IHRoaXMuYWxpZ25tZW50ICE9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0O1xuICAgIHZhciBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlICYmXG4gICAgICBtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0O1xuICAgIHZhciBpc1VzZXJTZW50TWVzc2FnZSA9XG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCk7XG4gICAgdmFyIGlzR3JvdXBNZW1iZXJNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyO1xuICAgIGlmICghaXNEZWxldGVkICYmIG5vdExlZnRBbGlnbmVkICYmIGlzVGV4dE1lc3NhZ2UgJiYgaXNVc2VyU2VudE1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICAgIGJ1YmJsZVBhZGRpbmc6IGlzSW5mb0J1YmJsZSA/IFwiOHB4IDEycHhcIiA6IFwiOHB4IDEycHggMCAxMnB4XCJcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChcbiAgICAgICFpc0RlbGV0ZWQgJiZcbiAgICAgIG5vdExlZnRBbGlnbmVkICYmXG4gICAgICBpc1RleHRNZXNzYWdlICYmXG4gICAgICAhaXNVc2VyU2VudE1lc3NhZ2UgJiZcbiAgICAgICFpc0dyb3VwTWVtYmVyTWVzc2FnZVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgYnViYmxlUGFkZGluZzogXCI4cHggMTJweCAycHggMTJweFwiXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoaXNHcm91cE1lbWJlck1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKCFub3RMZWZ0QWxpZ25lZCAmJiBpc1RleHRNZXNzYWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgYnViYmxlUGFkZGluZzogXCI4cHggMTJweFwiXG4gICAgfTtcbiAgfTtcbiAgLypcbiogaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQ6IFRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGJlbG9uZ3MgZm9yIHRoaXMgbGlzdCBhbmQgaXMgbm90IHBhcnQgb2YgdGhyZWFkIGV2ZW4gZm9yIGN1cnJlbnQgbGlzdFxuICBpdCBvbmx5IHJ1bnMgZm9yIFVJIGV2ZW50IGJlY2F1c2UgaXQgYXNzdW1lcyBsb2dnZWQgaW4gdXNlciBpcyBhbHdheXMgc2VuZGVyXG4qIEBwYXJhbTogbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4qL1xuICBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgY29uc3QgcmVjZWl2ZXJJZCA9IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IG1lc3NhZ2U/LmdldFJlY2VpdmVyVHlwZSgpO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgcmVjZWl2ZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKHJlY2VpdmVyVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJiByZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgfVxuICAgIH1cblxuICAvKlxuICAgICogaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIGZvciB0aGlzIGxpc3QgYW5kIGlzIG5vdCBwYXJ0IG9mIHRocmVhZCBldmVuIGZvciBjdXJyZW50IGxpc3RcbiAgICAgIGl0IG9ubHkgcnVucyBmb3IgU0RLIGV2ZW50IGJlY2F1c2UgaXQgbmVlZHMgc2VuZGVySWQgdG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgc2FtZSB1c2VyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBtZXNzYWdlPy5nZXRSZWNlaXZlclR5cGUoKTtcbiAgICAgIGNvbnN0IHNlbmRlcklkID0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgKHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSB8fCBzZW5kZXJJZCA9PT0gdGhpcy51c2VyLmdldFVpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICBpZiAocmVjZWl2ZXJUeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmIChyZWNlaXZlcklkID09PSB0aGlzLmdyb3VwLmdldEd1aWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICB9XG4gICAgfVxuXG4gIC8qXG4gICAgKiBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50OiBUbyBjaGVjayBpZiB0aGUgbWVzc2FnZSBiZWxvbmdzIHRocmVhZCBvZiB0aGlzIGxpc3QsXG4gICAgICBpdCBvbmx5IHJ1bnMgZm9yIFVJIGV2ZW50IGJlY2F1c2UgaXQgYXNzdW1lcyBsb2dnZWQgaW4gdXNlciBpcyBhbHdheXMgc2VuZGVyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JVSUV2ZW50ID1cbiAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICBpZiAoIW1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY2VpdmVySWQgPSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG5cbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICBpZiAocmVjZWl2ZXJJZCA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAvKlxuICAgICogaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQ6IFRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGJlbG9uZ3MgdGhyZWFkIG9mIHRoaXMgbGlzdCxcbiAgICAgIGl0IG9ubHkgcnVucyBmb3IgU0RLIGV2ZW50IGJlY2F1c2UgaXQgbmVlZHMgc2VuZGVySWQgdG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgc2VudCBieSB0aGUgc2FtZSB1c2VyXG4gICAgKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAqL1xuICBpc1RocmVhZE9mQ3VycmVudENoYXRGb3JTREtFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKCFtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVjZWl2ZXJJZCA9IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGNvbnN0IHNlbmRlcklkID0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpO1xuXG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChyZWNlaXZlcklkID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkgfHwgc2VuZGVySWQgPT09IHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKHJlY2VpdmVySWQgPT09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgc2V0RmlsZUJ1YmJsZVN0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGFueSB7XG4gICAgdmFyIGlzRmlsZU1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UgJiZcbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU7XG4gICAgaWYgKGlzRmlsZU1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgICBzdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgICBpY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICB0aGlzLmlvQm90dG9tKCk7XG4gICAgdGhpcy5pb1RvcCgpO1xuICAgIHRoaXMuY2hlY2tNZXNzYWdlVGVtcGxhdGUoKTtcbiAgfVxuXG4gIGdldFN0YXJ0Q2FsbEZ1bmN0aW9uKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKTogKHNlc3Npb25JZDogc3RyaW5nKSA9PiB2b2lkIHtcbiAgICBsZXQgc2Vzc2lvbklkID0gdGhpcy5nZXRTZXNzaW9uSWQobWVzc2FnZSlcbiAgICBsZXQgY2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrcy5nZXQoc2Vzc2lvbklkKTtcbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayA9IChzZXNzaW9uSWQ6IHN0cmluZykgPT4gdGhpcy5zdGFydERpcmVjdENhbGwoc2Vzc2lvbklkLCBtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnNldChzZXNzaW9uSWQsIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxiYWNrO1xuICB9XG4gIHN0YXJ0RGlyZWN0Q2FsbCA9IChzZXNzaW9uSWQ6IHN0cmluZywgbWVzc2FnZTogYW55KSA9PiB7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG4gICAgdGhpcy5zaG93T25nb2luZ0NhbGwgPSB0cnVlO1xuICAgIFN0b3JhZ2VVdGlscy5zZXRJdGVtKENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmNhbGxzLmFjdGl2ZWNhbGwsIG1lc3NhZ2UpXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBsYXVuY2hDb2xsYWJvcmF0aXZlRG9jdW1lbnQgPSAodXJsOiBzdHJpbmcpID0+IHtcbiAgICB3aW5kb3cub3Blbih1cmwsXCJcIixcImZ1bGxzY3JlZW49eWVzLCBzY3JvbGxiYXJzPWF1dG9cIik7XG4gIH07XG5cbiAgbGF1bmNoQ29sbGFib3JhdGl2ZVdoaXRlYm9hcmQgPSAodXJsOiBzdHJpbmcpID0+IHtcbiAgICB3aW5kb3cub3BlbihcbiAgICAgIHVybCArIGAmdXNlcm5hbWU9JHt0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0TmFtZSgpfWAsXG4gICAgICBcIlwiLFxuICAgICAgXCJmdWxsc2NyZWVuPXllcywgc2Nyb2xsYmFycz1hdXRvXCJcbiAgICApO1xuICB9O1xuICAvKipcbiAgICogRXh0cmFjdGluZyAgdHlwZXMgYW5kIGNhdGVnb3JpZXMgZnJvbSB0ZW1wbGF0ZVxuICAgKlxuICAgKi9cbiAgY2hlY2tNZXNzYWdlVGVtcGxhdGUoKSB7XG4gICAgdGhpcy50eXBlc01hcCA9IHtcbiAgICAgIFtDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHRdOiB0aGlzLnRleHRCdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UrJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlXTogdGhpcy5maWxlQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9dOiB0aGlzLmF1ZGlvQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW9dOiB0aGlzLnZpZGVvQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2VdOiB0aGlzLmltYWdlQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24rJ18nK0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcl06IHRoaXMudGV4dEJ1YmJsZSxcbiAgICAgIGN1c3RvbV9leHRlbnNpb25fc3RpY2tlcjogdGhpcy5zdGlja2VyQnViYmxlLFxuICAgICAgY3VzdG9tX2V4dGVuc2lvbl93aGl0ZWJvYXJkOiB0aGlzLndoaXRlYm9hcmRCdWJibGUsXG4gICAgICBjdXN0b21fZXh0ZW5zaW9uX2RvY3VtZW50OiB0aGlzLmRvY3VtZW50QnViYmxlLFxuICAgICAgY3VzdG9tX2V4dGVuc2lvbl9wb2xsOiB0aGlzLnBvbGxCdWJibGUsXG4gICAgICBjdXN0b21fbWVldGluZzogdGhpcy5kaXJlY3RDYWxsaW5nLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9dOiB0aGlzLmF1ZGlvQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW9dOiB0aGlzLnZpZGVvQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnNjaGVkdWxlcl06IHRoaXMuc2NoZWR1bGVyQnViYmxlLFxuICAgICAgW0NvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZSsnXycrQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZvcm1dOiB0aGlzLmZvcm1CdWJibGUsXG4gICAgICBbQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlKydfJytDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuY2FyZF06IHRoaXMuY2FyZEJ1YmJsZSxcbiAgICB9O1xuICAgIGlmKHRoaXMubWVzc2FnZVRlbXBsYXRlLmxlbmd0aCA8PSAwKSB7XG4gICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RCdWlsZGVyKClcbiAgICB9XG4gICAgdGhpcy5zZXRCdWJibGVWaWV3KCk7XG4gIH1cbiAgZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UsIHR5cGU/OiBzdHJpbmcpIHtcbiAgICBsZXQgZGF0YTogYW55ID0gbWVzc2FnZS5nZXRDdXN0b21EYXRhKCk7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIHJldHVybiBkYXRhW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKTtcbiAgICB9XG4gIH1cbiAgZ2V0VGhyZWFkQ291bnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdmFyIHJlcGx5Q291bnQgPSBtZXNzYWdlPy5nZXRSZXBseUNvdW50KCkgfHwgMDtcbiAgICB2YXIgc3VmZml4ID0gcmVwbHlDb3VudCA9PT0gMSA/IGxvY2FsaXplKFwiUkVQTFlcIikgOiBsb2NhbGl6ZShcIlJFUExJRVNcIik7XG4gICAgcmV0dXJuIGAke3JlcGx5Q291bnR9ICR7c3VmZml4fWA7XG4gIH1cbiAgc2hvd0VuYWJsZWRFeHRlbnNpb25zKCkge1xuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwidGV4dG1vZGVyYXRvclwiKSkge1xuICAgICAgdGhpcy5lbmFibGVEYXRhTWFza2luZyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwidGh1bWJuYWlsZ2VuZXJhdGlvblwiKSkge1xuICAgICAgdGhpcy5lbmFibGVUaHVtYm5haWxHZW5lcmF0aW9uID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJsaW5rcHJldmlld1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVMaW5rUHJldmlldyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwicG9sbHNcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlUG9sbHMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInJlYWN0aW9uc1wiKSkge1xuICAgICAgdGhpcy5lbmFibGVSZWFjdGlvbnMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImltYWdlbW9kZXJhdGlvblwiKSkge1xuICAgICAgdGhpcy5lbmFibGVJbWFnZU1vZGVyYXRpb24gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcInN0aWNrZXJzXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZVN0aWNrZXJzID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJjb2xsYWJvcmF0aXZld2hpdGVib2FyZFwiKSkge1xuICAgICAgdGhpcy5lbmFibGVXaGl0ZWJvYXJkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENoYXRDb25maWd1cmF0b3IubmFtZXMuaW5jbHVkZXMoXCJjb2xsYWJvcmF0aXZlZG9jdW1lbnRcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlRG9jdW1lbnQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImNhbGxpbmdcIikpIHtcbiAgICAgIHRoaXMuZW5hYmxlQ2FsbGluZyA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDaGF0Q29uZmlndXJhdG9yLm5hbWVzLmluY2x1ZGVzKFwiYWljb252ZXJzYXRpb25zdGFydGVyXCIpKSB7XG4gICAgICB0aGlzLmVuYWJsZUNvbnZlcnNhdGlvblN0YXJ0ZXIgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ2hhdENvbmZpZ3VyYXRvci5uYW1lcy5pbmNsdWRlcyhcImFpY29udmVyc2F0aW9uc3VtbWFyeVwiKSkge1xuICAgICAgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdW1tYXJ5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcHVibGljIG9wZW5Db25maXJtRGlhbG9nOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBvcGVuRnVsbHNjcmVlblZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGltYWdldXJsVG9PcGVuOiBzdHJpbmcgPSBcIlwiO1xuICBmdWxsU2NyZWVuVmlld2VyU3R5bGU6IEZ1bGxTY3JlZW5WaWV3ZXJTdHlsZSA9IHtcbiAgICBjbG9zZUljb25UaW50OiBcImJsdWVcIixcbiAgfTtcbiAgb3BlbkltYWdlSW5GdWxsU2NyZWVuKG1lc3NhZ2U6IGFueSkge1xuICAgIHRoaXMuaW1hZ2V1cmxUb09wZW4gPSBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8udXJsO1xuICAgIHRoaXMub3BlbkZ1bGxzY3JlZW5WaWV3ID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgY2xvc2VJbWFnZUluRnVsbFNjcmVlbigpIHtcbiAgICB0aGlzLmltYWdldXJsVG9PcGVuID0gXCJcIjtcbiAgICB0aGlzLm9wZW5GdWxsc2NyZWVuVmlldyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBvcGVuV2FybmluZ0RpYWxvZyhldmVudDogYW55KSB7XG4gICAgdGhpcy5jbG9zZUltYWdlTW9kZXJhdGlvbiA9IGV2ZW50Py5kZXRhaWw/Lm9uQ29uZmlybTtcbiAgICB0aGlzLm9wZW5Db25maXJtRGlhbG9nID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgb25Db25maXJtQ2xpY2sgPSAoKSA9PiB7XG4gICAgdGhpcy5vcGVuQ29uZmlybURpYWxvZyA9IGZhbHNlO1xuICAgIGlmICh0aGlzLmNsb3NlSW1hZ2VNb2RlcmF0aW9uKSB7XG4gICAgICB0aGlzLmNsb3NlSW1hZ2VNb2RlcmF0aW9uKCk7XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgb25DYW5jZWxDbGljaygpIHtcbiAgICB0aGlzLm9wZW5Db25maXJtRGlhbG9nID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIGdldFRleHRNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk6IHN0cmluZyB7XG4gICAgdmFyIHRleHQgPSB0aGlzLmVuYWJsZURhdGFNYXNraW5nXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRFeHRlbnNpb25EYXRhKG1lc3NhZ2UpXG4gICAgICA6IG51bGw7XG4gICAgcmV0dXJuIHRleHQ/LnRyaW0oKT8ubGVuZ3RoID4gMCA/IHRleHQgOiBtZXNzYWdlLmdldFRleHQoKTtcbiAgfVxuICBnZXRMaW5rUHJldmlldyhtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICBpZiAobWVzc2FnZT8uZ2V0TWV0YWRhdGEoKSAmJiB0aGlzLmVuYWJsZUxpbmtQcmV2aWV3KSB7XG4gICAgICAgIHZhciBtZXRhZGF0YTogYW55ID0gbWVzc2FnZS5nZXRNZXRhZGF0YSgpO1xuICAgICAgICB2YXIgaW5qZWN0ZWRPYmplY3QgPSBtZXRhZGF0YVtMaW5rUHJldmlld0NvbnN0YW50cy5pbmplY3RlZF07XG4gICAgICAgIGlmIChpbmplY3RlZE9iamVjdCAmJiBpbmplY3RlZE9iamVjdD8uZXh0ZW5zaW9ucykge1xuICAgICAgICAgIHZhciBleHRlbnNpb25zT2JqZWN0ID0gaW5qZWN0ZWRPYmplY3QuZXh0ZW5zaW9ucztcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBleHRlbnNpb25zT2JqZWN0ICYmXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uc09iamVjdCxcbiAgICAgICAgICAgICAgTGlua1ByZXZpZXdDb25zdGFudHMubGlua19wcmV2aWV3XG4gICAgICAgICAgICApXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB2YXIgbGlua1ByZXZpZXdPYmplY3QgPVxuICAgICAgICAgICAgICBleHRlbnNpb25zT2JqZWN0W0xpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtfcHJldmlld107XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGxpbmtQcmV2aWV3T2JqZWN0ICYmXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICAgICAgICAgIGxpbmtQcmV2aWV3T2JqZWN0LFxuICAgICAgICAgICAgICAgIExpbmtQcmV2aWV3Q29uc3RhbnRzLmxpbmtzXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgbGlua1ByZXZpZXdPYmplY3RbTGlua1ByZXZpZXdDb25zdGFudHMubGlua3NdLmxlbmd0aFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHJldHVybiBsaW5rUHJldmlld09iamVjdFtMaW5rUHJldmlld0NvbnN0YW50cy5saW5rc11bMF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0SW1hZ2VUaHVtYm5haWwobXNnOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKTogc3RyaW5nIHtcbiAgICB2YXIgbWVzc2FnZTogYW55ID0gbXNnIGFzIENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2U7XG4gICAgbGV0IGltYWdlVVJMID0gXCJcIjtcbiAgICBpZiAodGhpcy5lbmFibGVUaHVtYm5haWxHZW5lcmF0aW9uKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgbWV0YWRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICAgICAgdmFyIGluamVjdGVkT2JqZWN0ID0gbWV0YWRhdGE/LltcbiAgICAgICAgICBUaHVtYm5haWxHZW5lcmF0aW9uQ29uc3RhbnRzLmluamVjdGVkXG4gICAgICAgIF0gYXMgeyBleHRlbnNpb25zPzogYW55IH07XG4gICAgICAgIHZhciBleHRlbnNpb25zT2JqZWN0ID0gaW5qZWN0ZWRPYmplY3Q/LmV4dGVuc2lvbnM7XG4gICAgICAgIHZhciB0aHVtYm5haWxHZW5lcmF0aW9uT2JqZWN0ID1cbiAgICAgICAgICBleHRlbnNpb25zT2JqZWN0W1RodW1ibmFpbEdlbmVyYXRpb25Db25zdGFudHMudGh1bWJuYWlsX2dlbmVyYXRpb25dO1xuICAgICAgICB2YXIgaW1hZ2VUb0Rvd25sb2FkID0gdGh1bWJuYWlsR2VuZXJhdGlvbk9iamVjdD8udXJsX21lZGl1bTtcbiAgICAgICAgaWYgKGltYWdlVG9Eb3dubG9hZCkge1xuICAgICAgICAgIGltYWdlVVJMID0gaW1hZ2VUb0Rvd25sb2FkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltYWdlVVJMID0gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNcbiAgICAgICAgICAgID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybFxuICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaW1hZ2VVUkwgPSBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1xuICAgICAgICA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmxcbiAgICAgICAgOiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gaW1hZ2VVUkw7XG4gIH1cbiAgZ2V0TGlua1ByZXZpZXdEZXRhaWxzKGtleTogc3RyaW5nLCBtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIGxldCBsaW5rUHJldmlld09iamVjdDogYW55ID0gdGhpcy5nZXRMaW5rUHJldmlldyhtZXNzYWdlKTtcbiAgICBpZiAoT2JqZWN0LmtleXMobGlua1ByZXZpZXdPYmplY3QpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBsaW5rUHJldmlld09iamVjdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5pc1dlYnNvY2tldFJlY29ubmVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5maXJzdFJlbG9hZCA9IHRydWU7XG4gICAgdGhpcy5zZXRNZXNzYWdlc1N0eWxlKCk7XG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpO1xuICAgIHRoaXMuc2V0RGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5zZXRPbmdvaW5nQ2FsbFN0eWxlKCk7XG4gICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXIgYXMgQ29tZXRDaGF0LlVzZXI7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgdGhpcy5kYXRlU2VwYXJhdG9yU3R5bGUuYmFja2dyb3VuZCA9XG4gICAgICB0aGlzLmRhdGVTZXBhcmF0b3JTdHlsZS5iYWNrZ3JvdW5kIHx8XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpO1xuICAgIHRoaXMuZGl2aWRlclN0eWxlLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKTtcbiAgICBcbiAgICB0aGlzLmxhYmVsU3R5bGUudGV4dENvbG9yID0gdGhpcy5tZXNzYWdlTGlzdFN0eWxlLm5hbWVUZXh0Q29sb3IgfHwgdGhpcy5sYWJlbFN0eWxlLnRleHRDb2xvcjtcbiAgICB0aGlzLmxhYmVsU3R5bGUudGV4dEZvbnQgPSB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUubmFtZVRleHRGb250IHx8IHRoaXMubGFiZWxTdHlsZS50ZXh0Rm9udDtcbiAgICB0aGlzLmxvYWRpbmdTdHlsZS5pY29uVGludCA9IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5sb2FkaW5nSWNvblRpbnQgfHwgdGhpcy5sb2FkaW5nU3R5bGUuaWNvblRpbnQ7XG4gIH1cbiAgc2V0T25nb2luZ0NhbGxTdHlsZSA9ICgpID0+IHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlID0gbmV3IENhbGxzY3JlZW5TdHlsZSh7XG4gICAgICBtYXhIZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcIiMxYzIyMjZcIixcbiAgICAgIG1pbkhlaWdodDogXCI0MDBweFwiLFxuICAgICAgbWluV2lkdGg6IFwiNDAwcHhcIixcbiAgICAgIG1pbmltaXplSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBtYXhpbWl6ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH0pO1xuICAgIHRoaXMub25nb2luZ0NhbGxTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLm9uZ29pbmdDYWxsU3R5bGUgfTtcbiAgfTtcbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI4cHhcIixcbiAgICAgIGhlaWdodDogXCIyOHB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0RGF0ZVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIHBhZGRpbmc6IFwiNnB4IDEycHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTZXBhcmF0b3JTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTZXBhcmF0b3JTdHlsZSB9O1xuICB9XG4gIHNldE1lc3NhZ2VzU3R5bGUoKSB7XG4gICAgdGhpcy5wb3BvdmVyU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMzMwcHhcIixcbiAgICAgIHdpZHRoOiBcIjMyNXB4XCIsXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJveFNoYWRvdzogYCR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX0gMHB4IDBweCA4cHhgXG4gICAgfVxuICAgIGxldCBkZWZhdWx0RW1vamlTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIzMzBweFwiLFxuICAgICAgd2lkdGg6IFwiMzI1cHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIC4uLnRoaXMuZW1vamlLZXlib2FyZFN0eWxlXG4gICAgfVxuICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvckljb25VcmwgPSB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JJY29uVXJsIHx8ICdhc3NldHMvbmV3LW1lc3NhZ2UtaWNvbi5zdmcnOyAgICBcbiAgICB0aGlzLmVtb2ppS2V5Ym9hcmRTdHlsZSA9IGRlZmF1bHRFbW9qaVN0eWxlO1xuICAgIHRoaXMudW5yZWFkTWVzc2FnZXNTdHlsZSA9IHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgICAgZ2FwOlwiNHB4XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yU3R5bGUuaWNvblRpbnQgPz8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgaWNvbkhlaWdodDogdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yU3R5bGUuaWNvbkhlaWdodCA/PyBcIjEycHhcIixcbiAgICAgIGljb25XaWR0aDogdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yU3R5bGUuaWNvbldpZHRoID8/IFwiMTJweFwiLFxuICAgICAgaGVpZ2h0OiB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JTdHlsZS5oZWlnaHQgPz8gXCIxMDAlXCIsXG4gICAgICB3aWR0aDogdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yU3R5bGUud2lkdGggPz8gXCIxMDAlXCIsIFxuICAgICAgYm9yZGVyOiB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JTdHlsZS5ib3JkZXIgPz8gXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclN0eWxlLmJvcmRlclJhZGl1cyA/PyBcIjEycHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclN0eWxlLmJhY2tncm91bmQgPz8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclN0eWxlLnRleHRDb2xvciA/PyB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBidXR0b25UZXh0Rm9udDogdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yU3R5bGUudGV4dEZvbnQgPz8gZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICB9O1xuICAgIHRoaXMuc21hcnRSZXBseVN0eWxlID0ge1xuICAgICAgcmVwbHlUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xKSxcbiAgICAgIHJlcGx5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcmVwbHlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJveFNoYWRvdzogYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgLi4udGhpcy5zbWFydFJlcGx5U3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdHlsZSA9IHtcbiAgICAgIHJlcGx5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMSksXG4gICAgICByZXBseVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHJlcGx5QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3hTaGFkb3c6IGAwcHggMHB4IDFweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCl9YCxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0eWxlLFxuICAgIH07XG5cbiAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZSA9IHtcbiAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0eWxlLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJveFNoYWRvdzogYDBweCAwcHggMXB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKX1gLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpISxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSEsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjNjg1MUQ2XCIsXG4gICAgfTtcblxuICAgIHRoaXMuZnVsbFNjcmVlblZpZXdlclN0eWxlLmNsb3NlSWNvblRpbnQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCk7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTWVzc2FnZUxpc3RTdHlsZSA9IG5ldyBNZXNzYWdlTGlzdFN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRocmVhZFJlcGx5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICB0aHJlYWRSZXBseUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgdGhyZWFkUmVwbHlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aHJlYWRSZXBseVVucmVhZEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdGhyZWFkUmVwbHlVbnJlYWRUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICB0aHJlYWRSZXBseVVucmVhZFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgVGltZXN0YW1wVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjNcbiAgICAgICksXG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlTGlzdFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubWVzc2FnZUxpc3RTdHlsZSB9O1xuICAgIHRoaXMubGlua1ByZXZpZXdTdHlsZSA9IG5ldyBMaW5rUHJldmlld1N0eWxlKHtcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgZGVzY3JpcHRpb25Db2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlc2NyaXB0aW9uRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pO1xuICAgIHRoaXMuZG9jdW1lbnRCdWJibGVTdHlsZSA9IHtcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBzdWJ0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgc3VidGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYnV0dG9uQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgfTtcbiAgICB0aGlzLnBvbGxCdWJibGVTdHlsZSA9IHtcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHZvdGVQZXJjZW50VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdm90ZVBlcmNlbnRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBwb2xsUXVlc3Rpb25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBwb2xsUXVlc3Rpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBwb2xsT3B0aW9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBwb2xsT3B0aW9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgcG9sbE9wdGlvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBvcHRpb25zSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0b3RhbFZvdGVDb3VudFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHRvdGFsVm90ZUNvdW50VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc2VsZWN0ZWRQb2xsT3B0aW9uQmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIHVzZXJTZWxlY3RlZE9wdGlvbkJhY2tncm91bmQ6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgcG9sbE9wdGlvbkJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIHBvbGxPcHRpb25Cb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLmltYWdlTW9kZXJhdGlvblN0eWxlID0ge1xuICAgICAgZmlsdGVyQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB3YXJuaW5nVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICB3YXJuaW5nVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH07XG4gICAgdGhpcy5jb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9O1xuICB9XG4gIGdldFJlY2VpcHRTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBpc1RleHRNZXNzYWdlID1cbiAgICAgIG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQgJiZcbiAgICAgIHRoaXMuYWxpZ25tZW50ICE9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQ7XG4gICAgdGhpcy5yZWNlaXB0U3R5bGUgPSBuZXcgUmVjZWlwdFN0eWxlKHtcbiAgICAgIHdhaXRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHNlbnRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlbGl2ZXJlZEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcmVhZEljb25UaW50OiBpc1RleHRNZXNzYWdlXG4gICAgICAgID8gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKClcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGVycm9ySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGhlaWdodDogXCIxMXB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KTtcbiAgICByZXR1cm4geyAuLi50aGlzLnJlY2VpcHRTdHlsZSB9O1xuICB9XG4gIGNyZWF0ZVJlcXVlc3RCdWlsZGVyKCkge1xuICAgIGlmICghdGhpcy50ZW1wbGF0ZXMgfHwgdGhpcy50ZW1wbGF0ZXM/Lmxlbmd0aCA9PSAwKSB7XG4gICAgICB0aGlzLm1lc3NhZ2VUZW1wbGF0ZSA9XG4gICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFsbE1lc3NhZ2VUZW1wbGF0ZXMoKTtcbiAgICAgIHRoaXMuY2F0ZWdvcmllcyA9XG4gICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFsbE1lc3NhZ2VDYXRlZ29yaWVzKCk7XG4gICAgICB0aGlzLnR5cGVzID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QWxsTWVzc2FnZVR5cGVzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVzc2FnZVRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZXM7XG4gICAgfVxuICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbnVsbDtcbiAgICBpZiAodGhpcy51c2VyIHx8IHRoaXMuZ3JvdXApIHtcbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgID8gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcilcbiAgICAgICAgICA6IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgICAgLnNldENhdGVnb3JpZXModGhpcy5jYXRlZ29yaWVzKVxuICAgICAgICAgICAgLmhpZGVSZXBsaWVzKHRydWUpO1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXIuZ2V0VWlkKCkpLmJ1aWxkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUodGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyKVxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5NZXNzYWdlc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmNvbXB1dGVVbnJlYWRDb3VudCgpO1xuICAgICAgdGhpcy5mZXRjaFByZXZpb3VzTWVzc2FnZXMoKTtcbiAgICB9XG4gIH1cblxuICBjb21wdXRlVW5yZWFkQ291bnQoKSB7XG4gICAgaWYgKHRoaXMudXNlciB8fCB0aGlzLmdyb3VwKSB7XG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRVbnJlYWRNZXNzYWdlQ291bnRGb3JVc2VyKHRoaXMudXNlcj8uZ2V0VWlkKCkpLnRoZW4oXG4gICAgICAgICAgKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZHluYW1pY0tleSA9IHRoaXMudXNlcj8uZ2V0VWlkKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0VW5yZWFkQ291bnQgPSByZXNbZHluYW1pY0tleSBhcyBrZXlvZiB0eXBlb2YgcmVzXTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcikgPT4geyB9XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDb21ldENoYXQuZ2V0VW5yZWFkTWVzc2FnZUNvdW50Rm9yR3JvdXAodGhpcy5ncm91cD8uZ2V0R3VpZCgpKS50aGVuKFxuICAgICAgICAgIChyZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNLZXkgPSB0aGlzLmdyb3VwPy5nZXRHdWlkKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0VW5yZWFkQ291bnQgPSByZXNbZHluYW1pY0tleSBhcyBrZXlvZiB0eXBlb2YgcmVzXTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcikgPT4geyB9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldEFjdGlvbk1lc3NhZ2UobWVzc2FnZTpDb21ldENoYXQuQmFzZU1lc3NhZ2Upe1xuICAgIGNvbnN0IG1zZyA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRBY3Rpb25NZXNzYWdlKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkFjdGlvbik7XG4gICAgcmV0dXJuIG1zZyA/PyAobWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uKS5nZXRNZXNzYWdlKCk7XG4gIH1cbiAgLyoqXG4gICAqIExpc3RlbmVyIFRvIFJlY2VpdmUgTWVzc2FnZXMgaW4gUmVhbCBUaW1lXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgZmV0Y2hQcmV2aW91c01lc3NhZ2VzID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnJlaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZSh0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgICAgICAgLnNldFR5cGVzKHRoaXMudHlwZXMpXG4gICAgICAgICAgLnNldE1lc3NhZ2VJZCh0aGlzLm1lc3NhZ2VzTGlzdFswXS5nZXRJZCgpKVxuICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLnNldFVJRCh0aGlzLnVzZXI/LmdldFVpZCgpKS5idWlsZCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXApIHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5yZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSkuYnVpbGQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyXG4gICAgICAuZmV0Y2hQcmV2aW91cygpXG4gICAgICAudGhlbihcbiAgICAgICAgKG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlTGlzdCA9IG1lc3NhZ2VMaXN0Lm1hcChcbiAgICAgICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSA9PT1cbiAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIEludGVyYWN0aXZlTWVzc2FnZVV0aWxzLmNvbnZlcnRJbnRlcmFjdGl2ZU1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgICAgICAgLy8gTm8gTWVzc2FnZXMgRm91bmRcbiAgICAgICAgICBpZiAobWVzc2FnZUxpc3QubGVuZ3RoID09PSAwICYmIHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgIGlmICghdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiYgdGhpcy5lbmFibGVDb252ZXJzYXRpb25TdGFydGVyKSB7XG4gICAgICAgICAgICAgIHRoaXMuZmV0Y2hDb252ZXJzYXRpb25TdGFydGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuZ2V0VW5yZWFkQ291bnQgPj0gdGhpcy51bnJlYWRNZXNzYWdlVGhyZXNob2xkICYmXG4gICAgICAgICAgICAgIHRoaXMuZW5hYmxlQ29udmVyc2F0aW9uU3VtbWFyeVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuZmV0Y2hDb252ZXJzYXRpb25TdW1tYXJ5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihcbiAgICAgICAgICAgICAgICBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXS5nZXRJZCgpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGxldCBpc1NlbnRCeU1lOiBib29sZWFuID0gbGFzdE1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKSA9PVxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgIWlzU2VudEJ5TWUgJiZcbiAgICAgICAgICAgICAgIWxhc3RNZXNzYWdlLmdldERlbGl2ZXJlZEF0KClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAvL21hcmsgdGhlIG1lc3NhZ2UgYXMgZGVsaXZlcmVkXG4gICAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobGFzdE1lc3NhZ2UpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGxhc3RNZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcil7XG4gICAgICAgICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2VLZXkgPSB0aGlzLm1lc3NhZ2VzTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgICAgICAgICAobTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBtLmdldElkKCkgPT09IGxhc3RNZXNzYWdlPy5nZXRJZCgpXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc0RlbGl2ZXJlZChtZXNzYWdlS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWxhc3RNZXNzYWdlPy5nZXRSZWFkQXQoKSAmJiAhaXNTZW50QnlNZSkge1xuICAgICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChsYXN0TWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYobGFzdE1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKXtcbiAgICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT0gbGFzdE1lc3NhZ2U/LmdldElkKClcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzUmVhZChtZXNzYWdlS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIC8vaWYgdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZSBpcyBub3QgdGhlIGxvZ2dlZGluIHVzZXIsIG1hcmsgaXQgYXMgcmVhZC5cbiAgICAgICAgICAgIGxldCBwcmV2U2Nyb2xsSGVpZ2h0ID0gdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodDtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmxpc3RTY3JvbGwubmF0aXZlRWxlbWVudC5zY3JvbGxUb3AgPVxuICAgICAgICAgICAgICAgIHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQgLSBwcmV2U2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5wcmVwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVyKCk7XG4gICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICApXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG4gIGZldGNoQWN0aW9uTWVzc2FnZXMoKSB7XG4gICAgbGV0IHJlcXVlc3RCdWlsZGVyOiBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlciA9IG5ldyBDb21ldENoYXQuTWVzc2FnZXNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAuc2V0VHlwZShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSlcbiAgICAgIC5zZXRDYXRlZ29yeShDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKVxuICAgICAgLnNldE1lc3NhZ2VJZCh0aGlzLmxhc3RNZXNzYWdlSWQpXG4gICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICByZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICByZXF1ZXN0QnVpbGRlci5zZXRHVUlEKHRoaXMuZ3JvdXA/LmdldEd1aWQoKSk7XG4gICAgfVxuICAgIHJlcXVlc3RCdWlsZGVyLmJ1aWxkKClcbiAgICAgIC5mZXRjaE5leHQoKVxuICAgICAgLnRoZW4oKG1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlcyAmJiBtZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbWVzc2FnZXMuZm9yRWFjaCgobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5BY3Rpb24pLmdldEFjdGlvbk9uKCkgaW5zdGFuY2VvZlxuICAgICAgICAgICAgICBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgICAgICAobSkgPT5cbiAgICAgICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PT1cbiAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkFjdGlvblxuICAgICAgICAgICAgICAgICAgICApLmdldEFjdGlvbk9uKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICAgICAgICAgICApLmdldElkKClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPj0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldID0gKFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZSBhcyBDb21ldENoYXQuQWN0aW9uXG4gICAgICAgICAgICAgICAgKS5nZXRBY3Rpb25PbigpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cbiAgZmV0Y2hOZXh0TWVzc2FnZSA9ICgpID0+IHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAxO1xuICAgIGxldCBtZXNzYWdlSWQ6IG51bWJlcjtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlaW5pdGlhbGl6ZWQgfHxcbiAgICAgICh0aGlzLmxhc3RNZXNzYWdlSWQgPiAwICYmIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZClcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5mZXRjaEFjdGlvbk1lc3NhZ2VzKCk7XG4gICAgICAgIG1lc3NhZ2VJZCA9IHRoaXMubGFzdE1lc3NhZ2VJZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2VJZCA9IHRoaXMubWVzc2FnZXNMaXN0W2luZGV4XS5nZXRJZCgpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyXG4gICAgICAgICAgPyB0aGlzLm1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICAgIC5zZXRVSUQodGhpcy51c2VyPy5nZXRVaWQoKSlcbiAgICAgICAgICAgIC5zZXRNZXNzYWdlSWQobWVzc2FnZUlkKVxuICAgICAgICAgICAgLmJ1aWxkKClcbiAgICAgICAgICA6IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgICAgLnNldEdVSUQodGhpcy5ncm91cD8uZ2V0R3VpZCgpKVxuICAgICAgICAgICAgLnNldE1lc3NhZ2VJZChtZXNzYWdlSWQpXG4gICAgICAgICAgICAuYnVpbGQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSBuZXcgQ29tZXRDaGF0Lk1lc3NhZ2VzUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgICAgICAgIC5zZXRUeXBlcyh0aGlzLnR5cGVzKVxuICAgICAgICAgIC5zZXRNZXNzYWdlSWQobWVzc2FnZUlkKVxuICAgICAgICAgIC5zZXRDYXRlZ29yaWVzKHRoaXMuY2F0ZWdvcmllcylcbiAgICAgICAgICAuaGlkZVJlcGxpZXModHJ1ZSlcbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0VUlEKHRoaXMudXNlcj8uZ2V0VWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIuc2V0R1VJRCh0aGlzLmdyb3VwPy5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgLmZldGNoTmV4dCgpXG4gICAgICAgIC50aGVuKFxuICAgICAgICAgIChtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VMaXN0ID0gbWVzc2FnZUxpc3QubWFwKFxuICAgICAgICAgICAgICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpID09PVxuICAgICAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmVcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSW50ZXJhY3RpdmVNZXNzYWdlVXRpbHMuY29udmVydEludGVyYWN0aXZlTWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICAgICAgICAgIC8vIE5vIE1lc3NhZ2VzIEZvdW5kXG4gICAgICAgICAgICBpZiAobWVzc2FnZUxpc3QubGVuZ3RoID09PSAwICYmIHRoaXMubWVzc2FnZXNMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtZXNzYWdlTGlzdCAmJiBtZXNzYWdlTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNPbkJvdHRvbSkge1xuICAgICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VMaXN0W21lc3NhZ2VMaXN0Lmxlbmd0aCAtIDFdLmdldElkKClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhbGFzdE1lc3NhZ2U/LmdldERlbGl2ZXJlZEF0KCkgJiZcbiAgICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPVxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMobWVzc2FnZUxpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNXZWJzb2NrZXRSZWNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlSWQgPSBOdW1iZXIoXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlTGlzdFttZXNzYWdlTGlzdC5sZW5ndGggLSAxXS5nZXRJZCgpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsVG9Cb3R0b21Pbk5ld01lc3NhZ2VzKSB7XG4gICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50VGV4dCA9IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQ7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb3VudFRleHQgPVxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2NhbGl6ZShcIk5FV19NRVNTQUdFXCIpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKC4uLm1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID0gdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggKyBcIiBcIiArIGNvdW50VGV4dDtcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgIWxhc3RNZXNzYWdlPy5nZXREZWxpdmVyZWRBdCgpICYmXG4gICAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT1cbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKGxhc3RNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMubWFya0FsbE1lc3NhZ0FzRGVsaXZlcmVkKG1lc3NhZ2VMaXN0Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2VzKG1lc3NhZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5tZXNzYWdlc0xpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBhcHBlbmRNZXNzYWdlcyA9IChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10pID0+IHtcbiAgICBpZighdGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZXNbMF0pKXtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tZXNzYWdlc0xpc3QucHVzaCguLi5tZXNzYWdlcyk7XG4gICAgdGhpcy5tZXNzYWdlQ291bnQgPSB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGg7XG4gICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgdGhpcy5rZWVwUmVjZW50TWVzc2FnZXMgPSB0cnVlO1xuICAgICAgdGhpcy5yZUluaXRpYWxpemVNZXNzYWdlQnVpbGRlcigpO1xuICAgIH1cbiAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcigpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0TWVzc2FnZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IGNvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlzV2Vic29ja2V0UmVjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ncm91cExpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGNoYW5nZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIG5ld1Njb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICAgIG9sZFNjb3BlOiBDb21ldENoYXQuR3JvdXBNZW1iZXJTY29wZSxcbiAgICAgICAgICAgIGNoYW5nZWRHcm91cDogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0UsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGNoYW5nZWRHcm91cCxcbiAgICAgICAgICAgICAgeyB1c2VyOiBjaGFuZ2VkVXNlciwgc2NvcGU6IG5ld1Njb3BlIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAga2lja2VkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBraWNrZWRCeTogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICBraWNrZWRGcm9tOiBudWxsIHwgdW5kZWZpbmVkXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAga2lja2VkRnJvbSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZXI6IGtpY2tlZFVzZXIsXG4gICAgICAgICAgICAgICAgaGFzSm9pbmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICBiYW5uZWRVc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIGJhbm5lZEZyb206IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVELFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBiYW5uZWRGcm9tLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogYmFubmVkVXNlcixcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJVbmJhbm5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuYmFubmVkVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgICAgICAgICB1bmJhbm5lZEJ5OiBDb21ldENoYXQuVXNlcixcbiAgICAgICAgICAgIHVuYmFubmVkRnJvbTogbnVsbCB8IHVuZGVmaW5lZFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5VTkJBTk5FRCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgdW5iYW5uZWRGcm9tLFxuICAgICAgICAgICAgICB7IHVzZXI6IHVuYmFubmVkVXNlciB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IG51bGwgfCB1bmRlZmluZWQsXG4gICAgICAgICAgICB1c2VyQWRkZWQ6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdXNlckFkZGVkQnk6IENvbWV0Q2hhdC5Vc2VyLFxuICAgICAgICAgICAgdXNlckFkZGVkSW46IG51bGwgfCB1bmRlZmluZWRcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIHVzZXJBZGRlZEluLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogdXNlckFkZGVkLFxuICAgICAgICAgICAgICAgIGhhc0pvaW5lZDogdHJ1ZSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAoXG4gICAgICAgICAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgICAgICAgICBsZWF2aW5nVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgICAgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZULFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBncm91cCxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZXI6IGxlYXZpbmdVc2VyLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgICAgICAgICAgam9pbmVkVXNlcjogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyLFxuICAgICAgICAgICAgam9pbmVkR3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5KT0lORUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIGpvaW5lZEdyb3VwLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXNlcjogam9pbmVkVXNlcixcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLmVuYWJsZUNhbGxpbmcpIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZENhbGxMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNhbGxMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uSW5jb21pbmdDYWxsUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkluY29taW5nQ2FsbENhbmNlbGxlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChjYWxsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uT3V0Z29pbmdDYWxsUmVqZWN0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbk91dGdvaW5nQ2FsbEFjY2VwdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVhY3Rpb25zKSB7XG4gICAgICAgIHRoaXMub25NZXNzYWdlUmVhY3Rpb25BZGRlZCA9XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VSZWFjdGlvbkFkZGVkLnN1YnNjcmliZShcbiAgICAgICAgICAgIChyZWFjdGlvblJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fQURERUQsXG4gICAgICAgICAgICAgICAgcmVhY3Rpb25SZWNlaXB0XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2VSZWFjdGlvblJlbW92ZWQgPVxuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlUmVhY3Rpb25SZW1vdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAgIChyZWFjdGlvblJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFRCxcbiAgICAgICAgICAgICAgICByZWFjdGlvblJlY2VpcHRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IEZvcm1NZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2U6IENhcmRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZTogQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzRGVsaXZlcmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikge1xuICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxJVkVSRUQsXG4gICAgICAgICAgICAgICAgbWVzc2FnZVJlY2VpcHRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNSZWFkLnN1YnNjcmliZShcbiAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICBpZiAobWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVJlY2VpcHRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZEJ5QWxsID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzUmVhZEJ5QWxsLnN1YnNjcmliZShcbiAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICBpZiAobWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhZEFuZERlbGl2ZXJlZChtZXNzYWdlUmVjZWlwdCwgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VVcGRhdGUoXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVJlY2VpcHRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGwgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNEZWxpdmVyZWRUb0FsbC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVJlYWRBbmREZWxpdmVyZWQobWVzc2FnZVJlY2VpcHQsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRCxcbiAgICAgICAgICAgICAgbWVzc2FnZVJlY2VpcHRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZGVsZXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMRVRFRCxcbiAgICAgICAgICAgIGRlbGV0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZWRpdGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlVXBkYXRlKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9FRElURUQsXG4gICAgICAgICAgICBlZGl0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25UcmFuc2llbnRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVHJhbnNpZW50TWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAodHJhbnNpZW50TWVzc2FnZTogQ29tZXRDaGF0LlRyYW5zaWVudE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGxldCBsaXZlUmVhY3Rpb246IGFueSA9IHRyYW5zaWVudE1lc3NhZ2UuZ2V0RGF0YSgpO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0cmFuc2llbnRNZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgICAgICAgdHJhbnNpZW50TWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy51c2VyLmdldFVpZCgpICYmXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICAgICAgICBsaXZlUmVhY3Rpb25bXCJ0eXBlXCJdID09IFwibGl2ZV9yZWFjdGlvblwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY0xpdmVSZWFjdGlvbi5uZXh0KFxuICAgICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInJlYWN0aW9uXCJdXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgICAgICAgICB0aGlzLmdyb3VwICYmXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpICYmXG4gICAgICAgICAgICAgIHRyYW5zaWVudE1lc3NhZ2U/LmdldFNlbmRlcigpLmdldFVpZCgpICE9XG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAmJlxuICAgICAgICAgICAgICBsaXZlUmVhY3Rpb25bXCJ0eXBlXCJdID09IFwibGl2ZV9yZWFjdGlvblwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY0xpdmVSZWFjdGlvbi5uZXh0KFxuICAgICAgICAgICAgICAgIGxpdmVSZWFjdGlvbltcInJlYWN0aW9uXCJdXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uSW50ZXJhY3Rpb25Hb2FsQ29tcGxldGVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkludGVyYWN0aW9uR29hbENvbXBsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKHJlY2VpcHQ6IENvbWV0Q2hhdC5JbnRlcmFjdGlvblJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVVwZGF0ZShcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJT05fR09BTF9DT01QTEVURUQsXG4gICAgICAgICAgICAgIHJlY2VpcHRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICpcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogVXBkYXRlcyBtZXNzYWdlTGlzdCBvbiBiYXNpcyBvZiB1c2VyIGFjdGl2aXR5IG9yIGdyb3VwIGFjdGl2aXR5IG9yIGNhbGxpbmcgYWN0aXZpdHlcbiAgICogQHBhcmFtICB7YW55PW51bGx9IGtleVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQgfCBDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0Lkdyb3VwIHwgbnVsbD1udWxsfSBncm91cFxuICAgKiBAcGFyYW0gIHthbnk9bnVsbH0gb3B0aW9uc1xuICAgKi9cbiAgbWVzc2FnZVVwZGF0ZShcbiAgICBrZXk6IHN0cmluZyB8IG51bGwgPSBudWxsLFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IGFueSA9IG51bGwsXG4gICAgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCB8IG51bGwgPSBudWxsLFxuICAgIG9wdGlvbnM6IGFueSA9IG51bGxcbiAgKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgPSBbXTtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeSA9IFtdO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWNlaXZlZChtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRDpcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBRDpcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIFxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMRVRFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRDoge1xuICAgICAgICAgIHRoaXMubWVzc2FnZUVkaXRlZChtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRTpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5KT0lORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5LSUNLRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVEOiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5pc1RocmVhZE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVSZXBseUNvdW50KG1lc3NhZ2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSU9OX0dPQUxfQ09NUExFVEVEOlxuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JTREtFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVJbnRlcmFjdGl2ZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFDVElPTl9BRERFRDpcbiAgICAgICAgICB0aGlzLm9uUmVhY3Rpb25VcGRhdGVkKG1lc3NhZ2UsIHRydWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFRDpcbiAgICAgICAgICB0aGlzLm9uUmVhY3Rpb25VcGRhdGVkKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIGEgbWVzc2FnZSdzIHJlYWN0aW9ucyBiYXNlZCBvbiBhIG5ldyByZWFjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuUmVhY3Rpb25FdmVudH0gbWVzc2FnZSAtIFRoZSBuZXcgbWVzc2FnZSByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtib29sZWFufSBpc0FkZGVkIC0gVHJ1ZSBpZiB0aGUgcmVhY3Rpb24gd2FzIGFkZGVkLCBmYWxzZSBpZiBpdCB3YXMgcmVtb3ZlZC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgZmFsc2UgaWYgdGhlIG1lc3NhZ2Ugd2FzIG5vdCBmb3VuZCwgdHJ1ZSBvdGhlcndpc2UuXG4gICAqL1xuXG4gIG9uUmVhY3Rpb25VcGRhdGVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5SZWFjdGlvbkV2ZW50LCBpc0FkZGVkOiBib29sZWFuKSB7XG4gICAgY29uc3QgbWVzc2FnZUlkID0gbWVzc2FnZS5nZXRSZWFjdGlvbigpPy5nZXRNZXNzYWdlSWQoKTtcbiAgICBjb25zdCBtZXNzYWdlT2JqZWN0ID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlSWQpO1xuXG4gICAgaWYgKCFtZXNzYWdlT2JqZWN0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGFjdGlvbjogQ29tZXRDaGF0LlJFQUNUSU9OX0FDVElPTjtcbiAgICBpZiAoaXNBZGRlZCkge1xuICAgICAgYWN0aW9uID0gQ29tZXRDaGF0LlJFQUNUSU9OX0FDVElPTi5SRUFDVElPTl9BRERFRDtcbiAgICB9IGVsc2Uge1xuICAgICAgYWN0aW9uID0gQ29tZXRDaGF0LlJFQUNUSU9OX0FDVElPTi5SRUFDVElPTl9SRU1PVkVEO1xuICAgIH1cbiAgICBsZXQgbW9kaWZpZWRNZXNzYWdlID1cbiAgICAgIENvbWV0Q2hhdC5Db21ldENoYXRIZWxwZXIudXBkYXRlTWVzc2FnZVdpdGhSZWFjdGlvbkluZm8oXG4gICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVhY3Rpb24oKSxcbiAgICAgICAgYWN0aW9uXG4gICAgICApO1xuICAgIGlmIChtb2RpZmllZE1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtb2RpZmllZE1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogdHJhbnNsYXRlIG1lc3NhZ2UgdGhlbiBjYWxsIHVwZGF0ZSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgLy8gdHJhbnNsYXRlTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgLy8gfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtYXJrTWVzc2FnZUFzRGVsaXZlcmVkID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGlmIChcbiAgICAgICF0aGlzLmRpc2FibGVSZWNlaXB0ICYmXG4gICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICYmXG4gICAgICBtZXNzYWdlLmhhc093blByb3BlcnR5KFwiZGVsaXZlcmVkQXRcIikgPT09IGZhbHNlXG4gICAgKSB7XG4gICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIFdoZW4gTWVzc2FnZSBpcyBSZWNlaXZlZFxuICAgKiBAcGFyYW0gbWVzc2FnZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgeyAgICAgICAgICAgXG4gICAgICAgXG4gICAgdHJ5IHtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKSB8fFxuICAgICAgICAobWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAhbWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMuaXNPbkJvdHRvbSkgfHxcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKVxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKG1lc3NhZ2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWVzc2FnZVJlY2VpdmVkSGFuZGxlcihtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBVcGRhdGluZyB0aGUgcmVwbHkgY291bnQgb2YgVGhyZWFkIFBhcmVudCBNZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZXNcbiAgICovXG4gIHVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZXM6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgcmVjZWl2ZWRNZXNzYWdlID0gbWVzc2FnZXM7XG4gICAgICBsZXQgbWVzc2FnZUxpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gWy4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgICAobSkgPT4gbS5nZXRJZCgpID09PSByZWNlaXZlZE1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKClcbiAgICAgICk7XG4gICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgIHZhciBtZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlTGlzdFttZXNzYWdlS2V5XTtcbiAgICAgICAgbGV0IHJlcGx5Q291bnQgPSBtZXNzYWdlT2JqLmdldFJlcGx5Q291bnQoKVxuICAgICAgICAgID8gbWVzc2FnZU9iai5nZXRSZXBseUNvdW50KClcbiAgICAgICAgICA6IDA7XG4gICAgICAgIHJlcGx5Q291bnQgPSByZXBseUNvdW50ICsgMTtcbiAgICAgICAgbWVzc2FnZU9iai5zZXRSZXBseUNvdW50KHJlcGx5Q291bnQpO1xuICAgICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZU9iaik7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gWy4uLm1lc3NhZ2VMaXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICAgKi9cbiAgbWVzc2FnZVJlY2VpdmVkSGFuZGxlciA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICArK3RoaXMubWVzc2FnZUNvdW50O1xuICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAvLyB0aGlzLnVwZGF0ZVJlcGx5Q291bnQobWVzc2FnZSk7XG4gICAgICB0aGlzLnVwZGF0ZVVucmVhZFJlcGx5Q291bnQobWVzc2FnZSk7XG4gICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VDb3VudCA+IHRoaXMudGhyZXNob2xkVmFsdWUpIHtcbiAgICAgICAgdGhpcy5rZWVwUmVjZW50TWVzc2FnZXMgPSB0cnVlO1xuICAgICAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VCdWlsZGVyKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICBpZiAoIXRoaXMuaXNPbkJvdHRvbSkge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxUb0JvdHRvbU9uTmV3TWVzc2FnZXMpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBjb3VudFRleHQgPSBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICYmXG4gICAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VJbmRpY2F0b3JUZXh0ICE9IFwiXCJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvdW50VGV4dCA9IHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvdW50VGV4dCA9XG4gICAgICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gbG9jYWxpemUoXCJORVdfTUVTU0FHRVNcIilcbiAgICAgICAgICAgICAgICA6IGxvY2FsaXplKFwiTkVXX01FU1NBR0VcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQucHVzaChtZXNzYWdlKTtcbiAgICAgICAgICB0aGlzLm5ld01lc3NhZ2VDb3VudCA9IHRoaXMuVW5yZWFkQ291bnQubGVuZ3RoICsgXCIgXCIgKyBjb3VudFRleHQ7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKXtcbiAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgfVxuICAgIC8vaGFuZGxpbmcgZG9tIGxhZyAtIGluY3JlbWVudCBjb3VudCBvbmx5IGZvciBtYWluIG1lc3NhZ2UgbGlzdFxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IGZhbHNlICYmXG4gICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gdHJ1ZSAmJlxuICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWRcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiZcbiAgICAgICAgdGhpcy5pc09uQm90dG9tXG4gICAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc1JlYWQobWVzc2FnZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgfTtcbiAgcGxheUF1ZGlvKCkge1xuICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlLFxuICAgICAgICAgIHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldENhbGxCdWlsZGVyID0gKCk6IGFueSA9PiB7XG4gICAgY29uc3QgY2FsbFNldHRpbmdzOiBhbnkgPSBuZXcgQ29tZXRDaGF0VUlLaXRDYWxscy5DYWxsU2V0dGluZ3NCdWlsZGVyKClcbiAgICAgIC5lbmFibGVEZWZhdWx0TGF5b3V0KHRydWUpXG4gICAgICAuc2V0SXNBdWRpb09ubHlDYWxsKGZhbHNlKVxuICAgICAgLnNldENhbGxMaXN0ZW5lcihcbiAgICAgICAgbmV3IENvbWV0Q2hhdFVJS2l0Q2FsbHMuT25nb2luZ0NhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25DYWxsRW5kQnV0dG9uUHJlc3NlZDogKCkgPT4ge1xuICAgICAgICAgICAgU3RvcmFnZVV0aWxzLnNldEl0ZW0oQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuY2FsbHMuYWN0aXZlY2FsbCwgbnVsbCk7XG4gICAgICAgICAgICBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLm5leHQoe30gYXMgQ29tZXRDaGF0LkNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5idWlsZCgpO1xuICAgIHJldHVybiBjYWxsU2V0dGluZ3M7XG4gIH07XG4gIHJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCkge1xuICAgIHRoaXMucmVpbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5ncm91cExpc3RlbmVySWQgPSBcImdyb3VwX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5jYWxsTGlzdGVuZXJJZCA9IFwiY2FsbF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHRoaXMuYWRkTWVzc2FnZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgaWYgKHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgaWYgKHRoaXMua2VlcFJlY2VudE1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZSgxLCB0aGlzLm1lc3NhZ2VzTGlzdC5sZW5ndGggLSAzMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlclxuICAgICAgICA/IHRoaXMubWVzc2FnZXNSZXF1ZXN0QnVpbGRlci5zZXRVSUQodGhpcy51c2VyLmdldFVpZCgpKS5idWlsZCgpXG4gICAgICAgIDogdGhpcy5tZXNzYWdlc1JlcXVlc3RCdWlsZGVyLnNldEdVSUQodGhpcy5ncm91cC5nZXRHdWlkKCkpLmJ1aWxkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcykge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMSwgdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoIC0gMzApO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdC5zcGxpY2UoMzApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgcmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgdGhpcy5tZXNzYWdlQ291bnQgPSAwO1xuICAgIH1cbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gbnVsbDtcbiAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgQ29tZXRDaGF0LnJlbW92ZUNhbGxMaXN0ZW5lcih0aGlzLmNhbGxMaXN0ZW5lcklkKTtcbiAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VMaXN0KCk7XG4gIH07XG4gIGdldE1lc3NhZ2VSZWNlaXB0KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCByZWNlaXB0ID0gTWVzc2FnZVJlY2VpcHRVdGlscy5nZXRSZWNlaXB0U3RhdHVzKG1lc3NhZ2UpO1xuICAgIHJldHVybiByZWNlaXB0O1xuICB9XG4gIG1lc3NhZ2VSZWFkQW5kRGVsaXZlcmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCwgaXNHcm91cFJlY2VpcHQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHRyeSB7XG4gICAgICBpZihpc0dyb3VwUmVjZWlwdCl7XG4gICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICBtLmdldElkKCkgPT0gTnVtYmVyKG1lc3NhZ2UuZ2V0TWVzc2FnZUlkKCkpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFttZXNzYWdlS2V5XS5zZXREZWxpdmVyZWRBdChcbiAgICAgICAgICAgIG1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSk7XG5cbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IG1lc3NhZ2UuUkVDRUlQVF9UWVBFLkRFTElWRVJFRF9UT19BTExfUkVDRUlQVCAgJiYgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleSk7XG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBtZXNzYWdlLlJFQ0VJUFRfVFlQRS5SRUFEX0JZX0FMTF9SRUNFSVBUICAmJiB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWlwdFR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5ERUxJVkVSWVxuICAgICAgICApIHtcbiAgICAgICAgICAvL3NlYXJjaCBmb3IgbWVzc2FnZVxuICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT5cbiAgICAgICAgICAgICAgbS5nZXRJZCgpID09IE51bWJlcihtZXNzYWdlLmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXB0VHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlJFQURcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy9zZWFyY2ggZm9yIG1lc3NhZ2VcbiAgICAgICAgICBsZXQgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgIG0uZ2V0SWQoKSA9PSBOdW1iZXIobWVzc2FnZS5nZXRNZXNzYWdlSWQoKSlcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB0aGlzLm1hcmtBbGxNZXNzYWdBc1JlYWQobWVzc2FnZUtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IHJlYWRNZXNzYWdlXG4gICAqL1xuICBtYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXk6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBtZXNzYWdlS2V5OyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKCF0aGlzLm1lc3NhZ2VzTGlzdFtpXS5nZXRSZWFkQXQoKSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdFtpXS5zZXRSZWFkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KHRoaXMubWVzc2FnZXNMaXN0W21lc3NhZ2VLZXldKTtcbiAgfVxuICBtYXJrQWxsTWVzc2FnQXNEZWxpdmVyZWQobWVzc2FnZUtleTogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IG1lc3NhZ2VLZXk7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoIXRoaXMubWVzc2FnZXNMaXN0W2ldLmdldERlbGl2ZXJlZEF0KCkpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbaV0uc2V0RGVsaXZlcmVkQXQoXG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBFbWl0cyBhbiBBY3Rpb24gSW5kaWNhdGluZyB0aGF0IGEgbWVzc2FnZSB3YXMgZGVsZXRlZCBieSB0aGUgdXNlci9wZXJzb24geW91IGFyZSBjaGF0dGluZyB3aXRoXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICAvKipcbiAgICogRGV0ZWN0cyBpZiB0aGUgbWVzc2FnZSB0aGF0IHdhcyBlZGl0IGlzIHlvdXIgY3VycmVudCBvcGVuIGNvbnZlcnNhdGlvbiB3aW5kb3dcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1lc3NhZ2VFZGl0ZWQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5ncm91cCAmJlxuICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLmdyb3VwPy5nZXRHdWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgJiZcbiAgICAgICAgbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnVzZXIgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgJiZcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHVwZGF0ZUludGVyYWN0aXZlTWVzc2FnZSA9IChyZWNlaXB0OiBDb21ldENoYXQuSW50ZXJhY3Rpb25SZWNlaXB0KSA9PiB7XG4gICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyIS5nZXRVaWQoKSA9PT0gcmVjZWlwdC5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TWVzc2FnZUJ5SWQoXG4gICAgICAgIHJlY2VpcHQuZ2V0TWVzc2FnZUlkKClcbiAgICAgICkgYXMgQ29tZXRDaGF0LkludGVyYWN0aXZlTWVzc2FnZTtcbiAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChTdHJpbmcobWVzc2FnZT8uZ2V0SWQoKSkgPT0gU3RyaW5nKHJlY2VpcHQuZ2V0TWVzc2FnZUlkKCkpKSB7XG4gICAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSByZWNlaXB0LmdldEludGVyYWN0aW9ucygpO1xuICAgICAgICAgIChtZXNzYWdlIGFzIENvbWV0Q2hhdC5JbnRlcmFjdGl2ZU1lc3NhZ2UpLnNldEludGVyYWN0aW9ucyhcbiAgICAgICAgICAgIGludGVyYWN0aW9uXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UoXG4gICAgICAgICAgICBJbnRlcmFjdGl2ZU1lc3NhZ2VVdGlscy5jb252ZXJ0SW50ZXJhY3RpdmVNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBhIG1lc3NhZ2Ugd2FzIGRlbGV0ZWQgYnkgdGhlIHVzZXIvcGVyc29uIHlvdSBhcmUgY2hhdHRpbmcgd2l0aFxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgdXBkYXRlRWRpdGVkTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB2YXIgbWVzc2FnZUxpc3QgPSB0aGlzLm1lc3NhZ2VzTGlzdDtcbiAgICAvLyBsZXQgbmV3TWVzc2FnZSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShtZXNzYWdlKTtcbiAgICB2YXIgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgIChtKSA9PiBtLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKVxuICAgICk7XG4gICAgaWYgKG1lc3NhZ2VLZXkgPiAtMSkge1xuICAgICAgdGhpcy5tZXNzYWdlc0xpc3RbbWVzc2FnZUtleV0gPSBtZXNzYWdlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICAvLyBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgLy8gICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFtcbiAgICAvLyAgICAgLi4ubWVzc2FnZUxpc3Quc2xpY2UoMCwgbWVzc2FnZUtleSksXG4gICAgLy8gICAgIG1lc3NhZ2UsXG4gICAgLy8gICAgIC4uLm1lc3NhZ2VMaXN0LnNsaWNlKG1lc3NhZ2VLZXkgKyAxKSxcbiAgICAvLyAgIF07XG4gICAgLy8gICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgLy8gfVxuICB9O1xuICAvKipcbiAgICogRW1pdHMgYW4gQWN0aW9uIEluZGljYXRpbmcgdGhhdCBHcm91cCBEYXRhIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogV2hlbiBjdXN0b20gbWVzc2FnZXMgYXJlIHJlY2VpdmVkIGVnLiBQb2xsLCBTdGlja2VycyBlbWl0cyBhY3Rpb24gdG8gdXBkYXRlIG1lc3NhZ2UgbGlzdFxuICAgKiBAcGFyYW0gbWVzc2FnZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgY3VzdG9tTWVzc2FnZVJlY2VpdmVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgIGlmIChcbiAgICAgICAgbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXA/LmdldEd1aWQoKSB8fFxuICAgICAgICAobWVzc2FnZT8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT09IHRoaXMudXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgICBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICAhbWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiZcbiAgICAgICAgICAgIHRoaXMuaXNPbkJvdHRvbSkgfHxcbiAgICAgICAgICAoIW1lc3NhZ2U/LmdldFJlYWRBdCgpICYmXG4gICAgICAgICAgICBtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJlxuICAgICAgICAgICAgdGhpcy5pc09uQm90dG9tKVxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgIENvbWV0Q2hhdC5tYXJrQXNSZWFkKG1lc3NhZ2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQubmV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VzdG9tTWVzc2FnZVJlY2VpdmVkSGFuZGxlcihtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgdGhpcy5jdXN0b21NZXNzYWdlUmVjZWl2ZWRIYW5kbGVyKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAgICovXG4gIGN1c3RvbU1lc3NhZ2VSZWNlaXZlZEhhbmRsZXIgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAvLyBhZGQgcmVjZWl2ZWQgbWVzc2FnZSB0byBtZXNzYWdlcyBsaXN0XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIC8vIHRoaXMudXBkYXRlUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMudXBkYXRlVW5yZWFkUmVwbHlDb3VudChtZXNzYWdlKTtcbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVJbml0aWFsaXplTWVzc2FnZUJ1aWxkZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGlmICghdGhpcy5pc09uQm90dG9tKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvQm90dG9tT25OZXdNZXNzYWdlcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGNvdW50VGV4dCA9IGxvY2FsaXplKFwiTkVXX01FU1NBR0VTXCIpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgJiZcbiAgICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUluZGljYXRvclRleHQgIT0gXCJcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY291bnRUZXh0ID0gdGhpcy5uZXdNZXNzYWdlSW5kaWNhdG9yVGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnRUZXh0ID1cbiAgICAgICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBsb2NhbGl6ZShcIk5FV19NRVNTQUdFU1wiKVxuICAgICAgICAgICAgICAgIDogbG9jYWxpemUoXCJORVdfTUVTU0FHRVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudC5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoaXMubmV3TWVzc2FnZUNvdW50ID0gdGhpcy5VbnJlYWRDb3VudC5sZW5ndGggKyBcIiBcIiArIGNvdW50VGV4dDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpe1xuICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICB9XG4gICAgLy9oYW5kbGluZyBkb20gbGFnIC0gaW5jcmVtZW50IGNvdW50IG9ubHkgZm9yIG1haW4gbWVzc2FnZSBsaXN0XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcInBhcmVudE1lc3NhZ2VJZFwiKSA9PT0gZmFsc2UgJiZcbiAgICAgICF0aGlzLnBhcmVudE1lc3NhZ2VJZFxuICAgICkge1xuICAgICAgKyt0aGlzLm1lc3NhZ2VDb3VudDtcbiAgICAgIC8vaWYgdGhlIHVzZXIgaGFzIG5vdCBzY3JvbGxlZCBpbiBjaGF0IHdpbmRvdyhzY3JvbGwgaXMgYXQgdGhlIGJvdHRvbSBvZiB0aGUgY2hhdCB3aW5kb3cpXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJwYXJlbnRNZXNzYWdlSWRcIikgPT09IHRydWUgJiZcbiAgICAgIHRoaXMucGFyZW50TWVzc2FnZUlkICYmXG4gICAgICB0aGlzLmlzT25Cb3R0b21cbiAgICApIHtcbiAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChtZXNzYWdlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5uZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuVW5yZWFkQ291bnQgPSBbXTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gZGF0ZXMgYW5kIHNldHMgRGF0ZSBvbiBhIGEgbmV3IGRheVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge251bWJlcn0gZmlyc3REYXRlXG4gICAqIEBwYXJhbSAge251bWJlcn0gc2Vjb25kRGF0ZVxuICAgKi9cbiAgaXNEYXRlRGlmZmVyZW50KFxuICAgIGZpcnN0RGF0ZTogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICAgIHNlY29uZERhdGU6IG51bWJlciB8IHVuZGVmaW5lZFxuICApIHtcbiAgICBsZXQgZmlyc3REYXRlT2JqOiBEYXRlLCBzZWNvbmREYXRlT2JqOiBEYXRlO1xuICAgIGZpcnN0RGF0ZU9iaiA9IG5ldyBEYXRlKGZpcnN0RGF0ZSEgKiAxMDAwKTtcbiAgICBzZWNvbmREYXRlT2JqID0gbmV3IERhdGUoc2Vjb25kRGF0ZSEgKiAxMDAwKTtcbiAgICByZXR1cm4gKFxuICAgICAgZmlyc3REYXRlT2JqLmdldERhdGUoKSAhPT0gc2Vjb25kRGF0ZU9iai5nZXREYXRlKCkgfHxcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXRNb250aCgpICE9PSBzZWNvbmREYXRlT2JqLmdldE1vbnRoKCkgfHxcbiAgICAgIGZpcnN0RGF0ZU9iai5nZXRGdWxsWWVhcigpICE9PSBzZWNvbmREYXRlT2JqLmdldEZ1bGxZZWFyKClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgZm9ybWF0dGVycyBmb3IgdGhlIHRleHQgYnViYmxlc1xuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgZ2V0VGV4dEZvcm1hdHRlcnMgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGFsaWdubWVudCA9IHRoaXMuc2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2UpO1xuICAgIGxldCBjb25maWcgPSB7XG4gICAgICB0ZXh0Rm9ybWF0dGVyczpcbiAgICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVycyAmJiB0aGlzLnRleHRGb3JtYXR0ZXJzLmxlbmd0aFxuICAgICAgICAgID8gWy4uLnRoaXMudGV4dEZvcm1hdHRlcnNdXG4gICAgICAgICAgOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBbGxUZXh0Rm9ybWF0dGVycyh7XG4gICAgICAgICAgICBkaXNhYmxlTWVudGlvbnM6IHRoaXMuZGlzYWJsZU1lbnRpb25zLFxuICAgICAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICAgICAgYWxpZ25tZW50LFxuICAgICAgICAgIH0pLFxuICAgIH07XG5cbiAgICBsZXQgdGV4dEZvcm1hdHRlcnM6IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+ID0gY29uZmlnLnRleHRGb3JtYXR0ZXJzO1xuICAgIGxldCB1cmxUZXh0Rm9ybWF0dGVyITogQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICBsZXQgbWVudGlvbnNUZXh0Rm9ybWF0dGVyITogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbXG4gICAgICAgICAgICBpXG4gICAgICAgICAgXSBhcyBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICBpZiAobWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpLmxlbmd0aCkge1xuICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgICAgIG1lc3NhZ2UuZ2V0TWVudGlvbmVkVXNlcnMoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldExvZ2dlZEluVXNlcihcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lci5nZXRMb2dnZWRJblVzZXIoKSFcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmICh1cmxUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHRGb3JtYXR0ZXJzW2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcikge1xuICAgICAgICAgIHVybFRleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tpXSBhcyBDb21ldENoYXRVcmxzRm9ybWF0dGVyO1xuICAgICAgICAgIGlmIChtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyID1cbiAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoe1xuICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgIC4uLmNvbmZpZyxcbiAgICAgICAgICAgIGFsaWdubWVudCxcbiAgICAgICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgdGV4dEZvcm1hdHRlcnMucHVzaChtZW50aW9uc1RleHRGb3JtYXR0ZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB1cmxUZXh0Rm9ybWF0dGVyID0gdGV4dEZvcm1hdHRlcnNbaV0gYXMgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdXJsVGV4dEZvcm1hdHRlcikge1xuICAgICAgdXJsVGV4dEZvcm1hdHRlciA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFVybFRleHRGb3JtYXR0ZXIoe1xuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgIGFsaWdubWVudCxcbiAgICAgIH0pO1xuICAgICAgdGV4dEZvcm1hdHRlcnMucHVzaCh1cmxUZXh0Rm9ybWF0dGVyKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0ZXh0Rm9ybWF0dGVyc1tpXS5zZXRNZXNzYWdlQnViYmxlQWxpZ25tZW50KGFsaWdubWVudCk7XG4gICAgICB0ZXh0Rm9ybWF0dGVyc1tpXS5zZXRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXh0Rm9ybWF0dGVycztcbiAgfTtcblxuICAvKipcbiAgICogcHJlcGVuZCBGZXRjaGVkIE1lc3NhZ2VzXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlc1xuICAgKi9cbiAgcHJlcGVuZE1lc3NhZ2VzKG1lc3NhZ2VzOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSkge1xuICAgIHRyeSB7XG4gICAgICBpZighdGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yU0RLRXZlbnQobWVzc2FnZXNbMF0pKXtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4ubWVzc2FnZXMsIC4uLnRoaXMubWVzc2FnZXNMaXN0XTtcbiAgICAgIHRoaXMubWVzc2FnZUNvdW50ID0gdGhpcy5tZXNzYWdlc0xpc3QubGVuZ3RoO1xuICAgICAgaWYgKHRoaXMubWVzc2FnZUNvdW50ID4gdGhpcy50aHJlc2hvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLmtlZXBSZWNlbnRNZXNzYWdlcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlSW5pdGlhbGl6ZU1lc3NhZ2VCdWlsZGVyKCk7XG4gICAgICB9XG4gICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7IC8vIERldGFjaCB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLmNoYXRDaGFuZ2VkKSB7XG4gICAgICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjQWN0aXZlQ2hhdENoYW5nZWQubmV4dCh7XG4gICAgICAgICAgdXNlcjogdGhpcy51c2VyLFxuICAgICAgICAgIGdyb3VwOiB0aGlzLmdyb3VwLFxuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VzW21lc3NhZ2VzPy5sZW5ndGggLSAxXSxcbiAgICAgICAgICB1bnJlYWRNZXNzYWdlQ291bnQ6IHRoaXMuZ2V0VW5yZWFkQ291bnQsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNoYXRDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBsaXN0ZW5pbmcgdG8gYm90dG9tIHNjcm9sbCB1c2luZyBpbnRlcnNlY3Rpb24gb2JzZXJ2ZXJcbiAgICovXG4gIGlvQm90dG9tKCkge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgcm9vdDogdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LFxuICAgICAgcm9vdE1hcmdpbjogXCItMTAwJSAwcHggMTAwcHggMHB4XCIsXG4gICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgfTtcbiAgICB2YXIgY2FsbGJhY2sgPSAoZW50cmllczogYW55KSA9PiB7XG4gICAgICB2YXIgbGFzdE1lc3NhZ2UgPSB0aGlzLlVucmVhZENvdW50W3RoaXMuVW5yZWFkQ291bnQubGVuZ3RoIC0gMV07XG4gICAgICB0aGlzLmlzT25Cb3R0b20gPSBlbnRyaWVzWzBdLmlzSW50ZXJzZWN0aW5nO1xuICAgICAgaWYgKHRoaXMuaXNPbkJvdHRvbSkge1xuICAgICAgICB0aGlzLmZldGNoTmV4dE1lc3NhZ2UoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmIHRoaXMuVW5yZWFkQ291bnQ/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBDb21ldENoYXQubWFya0FzUmVhZChsYXN0TWVzc2FnZSkudGhlbihcbiAgICAgICAgICAgIChyZXM6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLlVucmVhZENvdW50ID0gW107XG4gICAgICAgICAgICAgIGxldCBtZXNzYWdlS2V5ID0gdGhpcy5tZXNzYWdlc0xpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgIChtOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+XG4gICAgICAgICAgICAgICAgICBtLmdldElkKCkgPT09IE51bWJlcihyZXM/LmdldE1lc3NhZ2VJZCgpKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrQWxsTWVzc2FnQXNSZWFkKG1lc3NhZ2VLZXkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLm5leHQobGFzdE1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5VbnJlYWRDb3VudCA9IFtdO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9ic2VydmVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgIGNhbGxiYWNrLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLmJvdHRvbT8ubmF0aXZlRWxlbWVudCk7XG4gIH1cbiAgLyoqXG4gICAqIGxpc3RlbmluZyB0byB0b3Agc2Nyb2xsIHVzaW5nIGludGVyc2VjdGlvbiBvYnNlcnZlclxuICAgKi9cbiAgaW9Ub3AoKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICByb290OiB0aGlzLmxpc3RTY3JvbGw/Lm5hdGl2ZUVsZW1lbnQsXG4gICAgICByb290TWFyZ2luOiBcIjIwMHB4IDBweCAwcHggMHB4XCIsXG4gICAgICB0aHJlc2hvbGQ6IDEuMCxcbiAgICB9O1xuICAgIHZhciBjYWxsYmFjayA9IChlbnRyaWVzOiBhbnkpID0+IHtcbiAgICAgIGlmIChlbnRyaWVzWzBdLmlzSW50ZXJzZWN0aW5nKSB7XG4gICAgICAgIHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwrKztcbiAgICAgICAgaWYgKHRoaXMubnVtYmVyT2ZUb3BTY3JvbGwgPiAxKSB7XG4gICAgICAgICAgdGhpcy5mZXRjaFByZXZpb3VzTWVzc2FnZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9ic2VydmVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgIGNhbGxiYWNrLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLnRvcD8ubmF0aXZlRWxlbWVudCk7XG4gIH1cbiAgLy8gcHVibGljIG1ldGhvZHNcbiAgYWRkTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0aGlzLm1lc3NhZ2VzTGlzdC5wdXNoKG1lc3NhZ2UpO1xuICAgIGlmIChtZXNzYWdlLmdldElkKCkpIHtcbiAgICAgIHRoaXMubGFzdE1lc3NhZ2VJZCA9IE51bWJlcihtZXNzYWdlLmdldElkKCkpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhbWVzc2FnZT8uZ2V0U2VuZGVyKCkgfHxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgfHxcbiAgICAgIHRoaXMuaXNPbkJvdHRvbVxuICAgICkge1xuICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gIH07XG4gIC8qKlxuICAgKiBjYWxsYmFjayBmb3IgY29weSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5UZXh0TWVzc2FnZX0gb2JqZWN0XG4gICAqL1xuICBvbkNvcHlNZXNzYWdlID0gKG9iamVjdDogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSA9PiB7XG4gICAgbGV0IHRleHQgPSBvYmplY3QuZ2V0VGV4dCgpO1xuICAgIGlmIChcbiAgICAgICF0aGlzLmRpc2FibGVNZW50aW9ucyAmJlxuICAgICAgb2JqZWN0LmdldE1lbnRpb25lZFVzZXJzICYmXG4gICAgICBvYmplY3QuZ2V0TWVudGlvbmVkVXNlcnMoKS5sZW5ndGhcbiAgICApIHtcbiAgICAgIHRleHQgPSB0aGlzLmdldE1lbnRpb25zVGV4dFdpdGhvdXRTdHlsZShvYmplY3QpO1xuICAgIH1cbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KTtcbiAgfTtcblxuICAvKipcbiAgICogVGhpcyBpcyB0byBlbnN1cmUgdGhhdCB0aGUgdWlkIGRvZXNuJ3QgZ2V0IGNvcGllZCB3aGVuIGNsaWNraW5nIG9uIHRoZSBjb3B5IG9wdGlvbi5cbiAgICogVGhpcyBmdW5jdGlvbiBjaGFuZ2VzIHRoZSB1aWQgcmVnZXggdG8gJ0B1c2VyTmFtZScgd2l0aG91dCBmb3JtYXR0aW5nXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlRleHRNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBnZXRNZW50aW9uc1RleHRXaXRob3V0U3R5bGUobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgY29uc3QgcmVnZXggPSAvPEB1aWQ6KC4qPyk+L2c7XG4gICAgbGV0IG1lc3NhZ2VUZXh0ID0gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgbGV0IG1lc3NhZ2VUZXh0VG1wID0gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgIHdoaWxlIChtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgbGV0IHVzZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtYXRjaFsxXSA9PSBtZW50aW9uZWRVc2Vyc1tpXS5nZXRVaWQoKSkge1xuICAgICAgICAgIHVzZXIgPSBtZW50aW9uZWRVc2Vyc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlVGV4dFRtcC5yZXBsYWNlKFxuICAgICAgICAgIG1hdGNoWzBdLFxuICAgICAgICAgIFwiQFwiICsgdXNlci5nZXROYW1lKCkgKyBcIlwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMobWVzc2FnZVRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZVRleHRUbXA7XG4gIH1cblxuICAvKipcbiAgICogY2FsbGJhY2sgZm9yIGRlbGV0ZU1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBvYmplY3RcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VzXG4gICAqL1xuICBtZXNzYWdlU2VudChtZXNzYWdlczogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdmFyIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2VzO1xuICAgIHZhciBtZXNzYWdlTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgIGxldCBtZXNzYWdlS2V5ID0gbWVzc2FnZUxpc3QuZmluZEluZGV4KFxuICAgICAgKG06IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4gbS5nZXRNdWlkKCkgPT09IG1lc3NhZ2UuZ2V0TXVpZCgpXG4gICAgKTtcbiAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICBtZXNzYWdlTGlzdC5zcGxpY2UobWVzc2FnZUtleSwgMSwgbWVzc2FnZSk7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZXNMaXN0ID0gbWVzc2FnZUxpc3Q7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgfVxuICAvKipcbiAgICogY2FsbGJhY2sgZm9yIGVkaXRNZXNzYWdlIG9wdGlvblxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG9iamVjdFxuICAgKi9cbiAgb25FZGl0TWVzc2FnZSA9IChvYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLm5leHQoe1xuICAgICAgbWVzc2FnZTogb2JqZWN0LFxuICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgfSk7XG4gIH07XG4gIHVwZGF0ZU1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBtdWlkOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICBpZiAobXVpZCkge1xuICAgICAgdGhpcy5tZXNzYWdlU2VudChtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICByZW1vdmVNZXNzYWdlID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICB2YXIgbWVzc2FnZUtleSA9IHRoaXMubWVzc2FnZXNMaXN0LmZpbmRJbmRleChcbiAgICAgICAgKG1zZykgPT4gbXNnPy5nZXRJZCgpID09PSBtZXNzYWdlLmdldElkKClcbiAgICAgICk7XG4gICAgICBpZiAobWVzc2FnZUtleSA+IC0xKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXNMaXN0LnNwbGljZShtZXNzYWdlS2V5LCAxLCBtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3QgPSBbLi4udGhpcy5tZXNzYWdlc0xpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3R5bGUgY29uZmlndXJhdGlvbiBmb3IgdGhlIHRocmVhZCB2aWV3IG9mIGEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGF0IHRoZSBzdHlsZSBjb25maWd1cmF0aW9uIGlzIGZvci5cbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIHN0eWxlIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuICAgKi9cbiAgZ2V0VGhyZWFkVmlld1N0eWxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLnRocmVhZFJlcGx5SWNvblRpbnQsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhGbG93OlxuICAgICAgICB0aGlzLmlzU2VudEJ5TWUobWVzc2FnZSkgJiYgdGhpcy5hbGlnbm1lbnQgIT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQubGVmdFxuICAgICAgICAgID8gXCJyb3ctcmV2ZXJzZVwiXG4gICAgICAgICAgOiBcInJvd1wiLFxuICAgICAgYWxpZ25JdGVtczogXCJmbGV4LXN0YXJ0XCIsXG4gICAgICBidXR0b25UZXh0Q29sb3I6IHRoaXMubWVzc2FnZUxpc3RTdHlsZT8udGhyZWFkUmVwbHlUZXh0Q29sb3IsXG4gICAgICBidXR0b25UZXh0Rm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVRleHRGb250LFxuICAgICAgaWNvbkhlaWdodDogXCIxNXB4XCIsXG4gICAgICBpY29uV2lkdGg6IFwiMTVweFwiLFxuICAgICAgZ2FwOiBcIjRweFwiLFxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIG1lc3NhZ2Ugd2FzIHNlbnQgYnkgdGhlIGN1cnJlbnRseSBsb2dnZWQgaW4gdXNlci5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgbWVzc2FnZSBpcyBzZW50IGJ5IHRoZSBsb2dnZWQgaW4gdXNlciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNTZW50QnlNZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBsZXQgc2VudEJ5TWU6IGJvb2xlYW4gPVxuICAgICAgIW1lc3NhZ2U/LmdldFNlbmRlcigpIHx8XG4gICAgICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKTtcbiAgICByZXR1cm4gc2VudEJ5TWU7XG4gIH1cbiAgZGVsZXRlTWVzc2FnZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgdmFyIG1lc3NhZ2VJZDogYW55ID0gbWVzc2FnZS5nZXRJZCgpO1xuICAgICAgQ29tZXRDaGF0LmRlbGV0ZU1lc3NhZ2UobWVzc2FnZUlkKVxuICAgICAgICAudGhlbigoZGVsZXRlZE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQubmV4dChkZWxldGVkTWVzc2FnZSk7XG4gICAgICAgICAgLy8gdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzY3JvbGxUb0JvdHRvbSA9ICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMubGlzdFNjcm9sbD8ubmF0aXZlRWxlbWVudC5zY3JvbGwoe1xuICAgICAgICAgIHRvcDogdGhpcy5saXN0U2Nyb2xsPy5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCxcbiAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pc09uQm90dG9tID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfSwgMTApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGlmICh0aGlzLmFsaWdubWVudCA9PSBNZXNzYWdlTGlzdEFsaWdubWVudC5sZWZ0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmdyb3VwICYmXG4gICAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKSAmJlxuICAgICAgICBtZXNzYWdlPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICAgdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQuc3RhbmRhcmRcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNvdW50IG9mIHVucmVhZCByZXBseSBtZXNzYWdlcyBmb3IgYSBnaXZlbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIGZvciB3aGljaCB0aGUgcmVwbHkgY291bnQgaXMgYmVpbmcgdXBkYXRlZC5cbiAgICovXG5cbiAgdXBkYXRlVW5yZWFkUmVwbHlDb3VudCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IG1lc3NhZ2VMaXN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2VbXSA9IFsuLi50aGlzLm1lc3NhZ2VzTGlzdF07XG4gICAgICBsZXQgbWVzc2FnZUtleSA9IG1lc3NhZ2VMaXN0LmZpbmRJbmRleChcbiAgICAgICAgKG0pID0+IG0uZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChtZXNzYWdlS2V5ID4gLTEpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZUxpc3RbbWVzc2FnZUtleV07XG4gICAgICAgIC8vIGxldCB1bnJlYWRSZXBseUNvdW50ID0gbWVzc2FnZU9iai5nZXRVbnJlYWRSZXBseUNvdW50KClcbiAgICAgICAgLy8gICA/IG1lc3NhZ2VPYmouZ2V0VW5yZWFkUmVwbHlDb3VudCgpXG4gICAgICAgIC8vICAgOiAwO1xuICAgICAgICAvLyB1bnJlYWRSZXBseUNvdW50ID0gdW5yZWFkUmVwbHlDb3VudCArIDE7XG4gICAgICAgIC8vIG1lc3NhZ2VPYmouc2V0VW5yZWFkUmVwbHlDb3VudCh1bnJlYWRSZXBseUNvdW50KTtcbiAgICAgICAgbWVzc2FnZUxpc3Quc3BsaWNlKG1lc3NhZ2VLZXksIDEsIG1lc3NhZ2VPYmopO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzTGlzdCA9IFsuLi5tZXNzYWdlTGlzdF07XG4gICAgICB9XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBNZXRob2QgdG8gc3Vic2NyaWJlICB0aGUgcmVxdWlyZWQgUnhqcyBldmVudHMgd2hlbiB0aGUgQ29tZXRDaGF0TWVzc2FnZUxpc3RDb21wb25lbnQgbG9hZHNcbiAgICovXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NBY3RpdmVQcHBvdmVyID0gQ29tZXRDaGF0VUlFdmVudHMuY2NBY3RpdmVQb3BvdmVyLnN1YnNjcmliZShcbiAgICAgIChkYXRhOiBBY3RpdmVQb3BvdmVyKSA9PiB7XG4gICAgICAgIGlmKGRhdGEgPT0gQWN0aXZlUG9wb3Zlci5jb21wb3NlciAmJiB0aGlzLm1lc3NhZ2VUb1JlYWN0KXtcbiAgICAgICAgICB0aGlzLnBvcG92ZXJSZWYubmF0aXZlRWxlbWVudC5vcGVuQ29udGVudFZpZXcoKTtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VUb1JlYWN0ID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgdGhpcy5jY1Nob3dQYW5lbCA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd1BhbmVsLnN1YnNjcmliZShcbiAgICAgIChkYXRhOiBJUGFuZWwpID0+IHtcbiAgICAgICAgaWYgKGRhdGEuY2hpbGQ/LnNob3dDb252ZXJzYXRpb25TdW1tYXJ5Vmlldykge1xuICAgICAgICAgIHRoaXMuZmV0Y2hDb252ZXJzYXRpb25TdW1tYXJ5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zbWFydFJlcGx5Q29uZmlnID0gZGF0YS5jb25maWd1cmF0aW9uITtcbiAgICAgICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IGRhdGEubWVzc2FnZSE7XG4gICAgICAgIHZhciBzbWFydFJlcGx5T2JqZWN0ID0gKGRhdGEubWVzc2FnZSBhcyBhbnkpPy5tZXRhZGF0YT8uW1xuICAgICAgICAgIFNtYXJ0UmVwbGllc0NvbnN0YW50cy5pbmplY3RlZFxuICAgICAgICBdPy5leHRlbnNpb25zPy5bU21hcnRSZXBsaWVzQ29uc3RhbnRzLnNtYXJ0X3JlcGx5XTtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KHRoaXMuc21hcnRSZXBseU1lc3NhZ2UpICYmIHNtYXJ0UmVwbHlPYmplY3QgJiYgIXNtYXJ0UmVwbHlPYmplY3QuZXJyb3IpIHtcbiAgICAgICAgICB0aGlzLmVuYWJsZVNtYXJ0UmVwbHkgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0hpZGVQYW5lbCA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjSGlkZVBhbmVsLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnNtYXJ0UmVwbHlNZXNzYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuZW5hYmxlU21hcnRSZXBseSA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICBjb25zdCBtZXNzYWdlT2JqID0gdGhpcy5nZXRNZXNzYWdlQnlJZChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKTtcbiAgICAgICAgICAvLyBpZiAobWVzc2FnZU9iaiAmJiBtZXNzYWdlT2JqLmdldFVucmVhZFJlcGx5Q291bnQoKSkge1xuICAgICAgICAgIC8vICAgbWVzc2FnZU9iai5zZXRVbnJlYWRSZXBseUNvdW50KDApO1xuICAgICAgICAgIC8vICAgdGhpcy51cGRhdGVNZXNzYWdlKG1lc3NhZ2VPYmopO1xuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKFxuICAgICAgKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgIGl0ZW07XG4gICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZXMoaXRlbS5tZXNzYWdlcyEpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID1cbiAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoaXRlbS5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGl0ZW0ubWVzc2FnZSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPVxuICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChpdGVtLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShpdGVtLm1lc3NhZ2UhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZShcbiAgICAgIChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGl0ZW0ubWVzc2FnZSkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoaXRlbS5tZXNzYWdlISk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBpZiAob2JqZWN0Py5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclNES0V2ZW50KG9iamVjdC5tZXNzYWdlKSkge1xuICAgICAgICAgICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jbG9uZShvYmplY3QubWVzc2FnZSEpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50LnN1YnNjcmliZShcbiAgICAgIChvYmo6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBpZiAob2JqLm1lc3NhZ2UpIHtcbiAgICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG9iai5tZXNzYWdlISk7XG4gICAgICAgICAgc3dpdGNoIChvYmouc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzczoge1xuICAgICAgICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3M6IHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgICAgICAgICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW107XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaXNUaHJlYWRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVwbHlDb3VudChDb21ldENoYXRVSUtpdFV0aWxpdHkuY2xvbmUobWVzc2FnZSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZShtZXNzYWdlLCB0cnVlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VTdGF0dXMuZXJyb3I6IHtcbiAgICAgICAgICAgICAgaWYgKCFtZXNzYWdlLmdldFNlbmRlcigpIHx8IHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNsb25lKG1lc3NhZ2UpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZSA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTWVzc2FnZShtZXNzYWdlT2JqZWN0KTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxFbmRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd09uZ29pbmdDYWxsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2Vzc2lvbklkID0gXCJcIjtcbiAgICAgICAgaWYgKGNhbGwgJiYgT2JqZWN0LmtleXMoY2FsbCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsUmVqZWN0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudChjYWxsKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY091dGdvaW5nQ2FsbCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NPdXRnb2luZ0NhbGwuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGFydE9mQ3VycmVudENoYXRGb3JVSUV2ZW50KGNhbGwpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEFjY2VwdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxBY2NlcHRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQoY2FsbCkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UoY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICB9XG4gIGNsb3NlU21hcnRSZXBseSA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gZmFsc2U7XG4gICAgdGhpcy5zbWFydFJlcGx5TWVzc2FnZSA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIGNsb3NlQ29udmVyc2F0aW9uU3VtbWFyeSA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBzaG93U3RhdHVzSW5mbyhtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBpZiAoXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IHRoaXMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJlxuICAgICAgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gdGhpcy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJlxuICAgICAgbWVzc2FnZT8uZ2V0U2VudEF0KClcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkU2hvd01lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBkaXNhYmxlUmVjZWlwdDogYm9vbGVhbiwgaGlkZVJlY2VpcHQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgICEoZGlzYWJsZVJlY2VpcHQgfHwgaGlkZVJlY2VpcHQpICYmXG4gICAgICAoIW1lc3NhZ2UuZ2V0U2VuZGVyKCkgfHwgdGhpcy5sb2dnZWRJblVzZXIuZ2V0VWlkKCkgPT09IG1lc3NhZ2UuZ2V0U2VuZGVyKCk/LmdldFVpZCgpKSAmJlxuICAgICAgbWVzc2FnZS5nZXRDYXRlZ29yeSgpICE9PSB0aGlzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgIG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSAhPT0gdGhpcy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbFxuICAgICk7XG4gIH1cbiAgXG4gIHNlbmRSZXBseSA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IHJlcGx5OiBzdHJpbmcgPSBldmVudD8uZGV0YWlsPy5yZXBseTtcbiAgICBpZiAodGhpcy5zbWFydFJlcGx5Q29uZmlnLmNjU21hcnRSZXBsaWVzQ2xpY2tlZCkge1xuICAgICAgdGhpcy5zbWFydFJlcGx5Q29uZmlnLmNjU21hcnRSZXBsaWVzQ2xpY2tlZChcbiAgICAgICAgcmVwbHksXG4gICAgICAgIHRoaXMuc21hcnRSZXBseU1lc3NhZ2UhLFxuICAgICAgICB0aGlzLm9uRXJyb3IsXG4gICAgICAgIHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcyxcbiAgICAgICAgdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlc1xuICAgICAgKTtcbiAgICAgIHRoaXMuY2xvc2VTbWFydFJlcGx5KCk7XG4gICAgfVxuICB9O1xuICBzZW5kQ29udmVyc2F0aW9uU3RhcnRlciA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IHJlcGx5OiBzdHJpbmcgPSBldmVudD8uZGV0YWlsPy5yZXBseTtcbiAgICBDb21ldENoYXRVSUV2ZW50cy5jY0NvbXBvc2VNZXNzYWdlLm5leHQocmVwbHkpO1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJSZXBsaWVzID0gW107XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBmZXRjaENvbnZlcnNhdGlvblN0YXJ0ZXIoKSB7XG4gICAgdGhpcy5zaG93Q29udmVyc2F0aW9uU3RhcnRlciA9IHRydWU7XG4gICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMubG9hZGluZztcbiAgICBsZXQgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyB0aGlzLnVzZXIuZ2V0VWlkKClcbiAgICAgIDogdGhpcy5ncm91cC5nZXRHdWlkKCk7XG4gICAgQ29tZXRDaGF0LmdldENvbnZlcnNhdGlvblN0YXJ0ZXIocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgT2JqZWN0LmtleXMocmVzcG9uc2UpLmZvckVhY2goKHJlcGx5KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2VbcmVwbHldICYmIHJlc3BvbnNlW3JlcGx5XSAhPSBcIlwiKSB7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMgJiZcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclJlcGxpZXMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlc0xpc3Q/Lmxlbmd0aCA8PSAwXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN0YXJ0ZXJTdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdGFydGVyU3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgZmV0Y2hDb252ZXJzYXRpb25TdW1tYXJ5KCkge1xuICAgIHRoaXMuc2hvd0NvbnZlcnNhdGlvblN1bW1hcnkgPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgbGV0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyLmdldFVpZCgpXG4gICAgICA6IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuXG4gICAgbGV0IGFwaUNvbmZpZ3VyYXRpb24gPSB0aGlzLmFwaUNvbmZpZ3VyYXRpb247XG5cbiAgICBDb21ldENoYXQuZ2V0Q29udmVyc2F0aW9uU3VtbWFyeShyZWNlaXZlcklkLCByZWNlaXZlclR5cGUsIGFwaUNvbmZpZ3VyYXRpb24pXG4gICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoXCJQYXJhbWV0ZXIgaXMgbm90IGEgbnVtYmVyIVwiKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ID0gW3Jlc3BvbnNlXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5ICYmIHRoaXMuY29udmVyc2F0aW9uU3VtbWFyeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25TdW1tYXJ5U3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH0pO1xuICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvblN1bW1hcnk7XG4gIH1cblxuICBnZXRSZXBsaWVzKCk6IHN0cmluZ1tdIHwgbnVsbCB7XG4gICAgbGV0IHNtYXJ0UmVwbHk6IGFueSA9IHRoaXMuc21hcnRSZXBseU1lc3NhZ2U7XG4gICAgdmFyIHNtYXJ0UmVwbHlPYmplY3QgPVxuICAgICAgc21hcnRSZXBseT8ubWV0YWRhdGE/LltTbWFydFJlcGxpZXNDb25zdGFudHMuaW5qZWN0ZWRdPy5leHRlbnNpb25zPy5bXG4gICAgICBTbWFydFJlcGxpZXNDb25zdGFudHMuc21hcnRfcmVwbHlcbiAgICAgIF07XG4gICAgaWYgKFxuICAgICAgc21hcnRSZXBseU9iamVjdD8ucmVwbHlfcG9zaXRpdmUgJiZcbiAgICAgIHNtYXJ0UmVwbHlPYmplY3Q/LnJlcGx5X25ldXRyYWwgJiZcbiAgICAgIHNtYXJ0UmVwbHlPYmplY3Q/LnJlcGx5X25lZ2F0aXZlXG4gICAgKSB7XG4gICAgICB2YXIgeyByZXBseV9wb3NpdGl2ZSwgcmVwbHlfbmV1dHJhbCwgcmVwbHlfbmVnYXRpdmUgfSA9IHNtYXJ0UmVwbHlPYmplY3Q7XG4gICAgICByZXR1cm4gW3JlcGx5X3Bvc2l0aXZlLCByZXBseV9uZXV0cmFsLCByZXBseV9uZWdhdGl2ZV07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8qKlxuICAgKiBNZXRob2QgdG8gdW5zdWJzY3JpYmUgYWxsIHRoZSBSeGpzIGV2ZW50cyB3aGVuIHRoZSBDb21ldENoYXRNZXNzYWdlTGlzdENvbXBvbmVudCBnZXRzIGRlc3Ryb3lcbiAgICovXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckpvaW5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY093bmVyc2hpcENoYW5nZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTGVmdD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NMaXZlUmVhY3Rpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGU/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NTaG93UGFuZWw/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NIaWRlUGFuZWw/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0NhbGxFbmRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGw/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0NhbGxBY2NlcHRlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXBwcm9wcmlhdGUgdGhyZWFkIGljb24gYmFzZWQgb24gdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBmb3Igd2hpY2ggdGhlIHRocmVhZCBpY29uIGlzIGJlaW5nIGRldGVybWluZWQuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBUaGUgaWNvbiBmb3IgdGhlIHRocmVhZC4gSWYgdGhlIG1lc3NhZ2Ugd2FzIHNlbnQgYnkgdGhlIGxvZ2dlZCBpbiB1c2VyLCByZXR1cm5zICd0aHJlYWRSaWdodEFycm93Jy4gT3RoZXJ3aXNlLCByZXR1cm5zICd0aHJlYWRJbmRpY2F0b3JJY29uJy5cbiAgICovXG4gIGdldFRocmVhZEljb25BbGlnbm1lbnQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogYm9vbGVhbiB7XG4gICAgbGV0IHNlbnRCeU1lOiBib29sZWFuID1cbiAgICAgIHRoaXMuaXNTZW50QnlNZShtZXNzYWdlKSAmJlxuICAgICAgdGhpcy5hbGlnbm1lbnQgPT09IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkO1xuICAgIHJldHVybiBzZW50QnlNZSA/IGZhbHNlIDogdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogc3R5bGluZyBwYXJ0XG4gICAqL1xuICBnZXRCdWJibGVEYXRlU3R5bGUgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgbGV0IGlzU2VudEJ5TWUgPVxuICAgICAgdGhpcy5pc1NlbnRCeU1lKG1lc3NhZ2UpICYmIHRoaXMuYWxpZ25tZW50ICE9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LmxlZnQ7XG4gICAgbGV0IGlzVGV4dE1lc3NhZ2UgPVxuICAgICAgbWVzc2FnZS5nZXRUeXBlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRDb2xvcjpcbiAgICAgICAgdGhpcy5tZXNzYWdlTGlzdFN0eWxlLlRpbWVzdGFtcFRleHRDb2xvciB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGV4dEZvbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUxpc3RTdHlsZS5UaW1lc3RhbXBUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjMpLFxuICAgICAgcGFkZGluZzogXCIwcHhcIixcbiAgICAgIGRpc3BsYXk6IFwiYmxvY2tcIixcbiAgICB9O1xuICB9O1xuICBjaGF0c0xpc3RTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuaGVpZ2h0LFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmJhY2tncm91bmQsXG4gICAgfTtcbiAgfTtcbiAgbWVzc2FnZUNvbnRhaW5lclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLndpZHRoLFxuICAgIH07XG4gIH07XG4gIGVycm9yU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuICBjb252ZXJzYXRpb25TdGFydGVyU3RhdGVTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnZlcnNhdGlvblN1bW1hcnlTdGF0ZVN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG5cbiAgZW1wdHlTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIGxvYWRpbmdTdHlsZSA9IHtcbiAgICBpY29uVGludDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy5sb2FkaW5nSWNvblRpbnQsXG4gIH07XG4gIGNvbnZlcnNhdGlvblN0YXJ0ZXJMb2FkZXIgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfTtcbiAgfTtcblxuICBjb252ZXJzYXRpb25TdW1tYXJ5TG9hZGVyID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpY29uVGludDogdGhpcy50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH07XG4gIH07XG4gIGdldFNjaGVkdWxlckJ1YmJsZVN0eWxlID0gKG1lc3NnYWU6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICBsZXQgYXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjUwJVwiLFxuICAgICAgd2lkdGg6IFwiNDhweFwiLFxuICAgICAgaGVpZ2h0OiBcIjQ4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgfSk7XG4gICAgbGV0IGxpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiYXV0b1wiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJpbmhlcml0XCIsXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogXCJcIixcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuXG4gICAgbGV0IGNhbGVuZGFyU3R5bGUgPSBuZXcgQ2FsZW5kYXJTdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBkYXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgZGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGRheVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgZGF5VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbW9udGhZZWFyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBtb250aFllYXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBkZWZhdWx0RGF0ZVRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBkaXNhYmxlZERhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBkaXNhYmxlZERhdGVUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBkaXNhYmxlZERhdGVUZXh0QmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGltZXpvbmVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRpbWV6b25lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYXJyb3dCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBhcnJvd0J1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMlxuICAgICAgKSxcbiAgICB9KTtcbiAgICBsZXQgdGltZVNsb3RTdHlsZSA9IG5ldyBUaW1lU2xvdFN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBjYWxlbmRhckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgdGltZXpvbmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U2xvdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgZW1wdHlTbG90VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgZW1wdHlTbG90VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgZGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGRhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBzZXBlcmF0b3JUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgc2xvdEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBzbG90Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNsb3RCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBzbG90VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc2xvdFRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGltZXpvbmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aW1lem9uZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDEpLFxuICAgIH0pO1xuICAgIGxldCBxdWNpa1ZpZXdTdHlsZSA9IG5ldyBRdWlja1ZpZXdTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc3VidGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHN1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsZWFkaW5nQmFyVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBsZWFkaW5nQmFyV2lkdGg6IFwiNHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBTY2hlZHVsZXJCdWJibGVTdHlsZSh7XG4gICAgICBhdmF0YXJTdHlsZTogYXZhdGFyU3R5bGUsXG4gICAgICBsaXN0SXRlbVN0eWxlOiBsaXN0SXRlbVN0eWxlLFxuICAgICAgcXVpY2tWaWV3U3R5bGU6IHF1Y2lrVmlld1N0eWxlLFxuICAgICAgZGF0ZVNlbGVjdG9yU3R5bGU6IGNhbGVuZGFyU3R5bGUsXG4gICAgICB0aW1lU2xvdFNlbGVjdG9yU3R5bGU6IHRpbWVTbG90U3R5bGUsXG4gICAgICBiYWNrQnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YCxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgc3VnZ2VzdGVkVGltZUJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpfWAsXG4gICAgICBzdWdnZXN0ZWRUaW1lQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkQmFja2dyb3VuZDpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkQm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkQm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc3VnZ2VzdGVkVGltZURpc2FibGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDNcbiAgICAgICksXG4gICAgICBzdWdnZXN0ZWRUaW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHN1Z2dlc3RlZFRpbWVUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0M1xuICAgICAgKSxcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRCYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBtb3JlQnV0dG9uRGlzYWJsZWRUZXh0Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIG1vcmVCdXR0b25EaXNhYmxlZFRleHRCb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbW9yZUJ1dHRvbkRpc2FibGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICBtb3JlQnV0dG9uVGV4dEJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIG1vcmVCdXR0b25UZXh0Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIG1vcmVCdXR0b25UZXh0Qm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIG1vcmVCdXR0b25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgbW9yZUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgZ29hbENvbXBsZXRpb25UZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBnb2FsQ29tcGxldGlvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQzXG4gICAgICApLFxuICAgICAgZXJyb3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGVycm9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICBzY2hlZHVsZUJ1dHRvblN0eWxlOiB7XG4gICAgICAgIGljb25IZWlnaHQ6IFwiMjBweFwiLFxuICAgICAgICBpY29uV2lkdGg6IFwiMjBweFwiLFxuICAgICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5uYW1lKSxcbiAgICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICBwYWRkaW5nOiBcIjhweFwiLFxuICAgICAgfSxcbiAgICAgIHNlcGVyYXRvclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBzdWJ0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHN1YnRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5uYW1lKSxcbiAgICAgIHN1bW1hcnlUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBzdW1tYXJ5VGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGltZXpvbmVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0aW1lem9uZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpbWV6b25lSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBjYWxlbmRhckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgY2xvY2tJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICB9KTtcbiAgfTtcbiAgLyoqXG4gICAqIENvbmZpZ3VyYXRpb24gZm9yIHRoZSByZWFjdGlvbiBsaXN0LlxuICAgKiBUaGlzIGluY2x1ZGVzIHN0eWxlcyBmb3IgdGhlIGF2YXRhciwgbGlzdCBpdGVtcywgYW5kIHJlYWN0aW9uIGhpc3RvcnkuXG4gICAqIEByZXR1cm5zIHtSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9ufSAtIFRoZSBjb25maWd1cmVkIHJlYWN0aW9uIGxpc3QuXG4gICAqL1xuICBnZXRSZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uKCkge1xuICAgIGNvbnN0IGF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCI1MCVcIixcbiAgICAgIHdpZHRoOiBcIjM1cHhcIixcbiAgICAgIGhlaWdodDogXCIzNXB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyV2lkdGg6IFwiMFwiLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIG91dGVyVmlld0JvcmRlckNvbG9yOiBcIlwiLFxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCIwXCIsXG4gICAgfSk7XG4gICAgY29uc3QgbGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG4gICAgY29uc3QgcmVhY3Rpb25IaXN0b3J5U3R5bGUgPSBuZXcgUmVhY3Rpb25MaXN0U3R5bGUoe1xuICAgICAgd2lkdGg6IFwiMzIwcHhcIixcbiAgICAgIGhlaWdodDogXCIzMDBweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGVycm9ySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBzbGlkZXJFbW9qaUNvdW50Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIHNsaWRlckVtb2ppRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQxKSxcbiAgICAgIHN1YnRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgc3VidGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0YWlsVmlld0ZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZGl2aWRlclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBzbGlkZXJFbW9qaUNvdW50Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICBhY3RpdmVFbW9qaUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24oe1xuICAgICAgYXZhdGFyU3R5bGU6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbj8uYXZhdGFyU3R5bGUgfHxcbiAgICAgICAgYXZhdGFyU3R5bGUsXG4gICAgICBlcnJvckljb25VUkw6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvbj8uZXJyb3JJY29uVVJMIHx8XG4gICAgICAgIFwiXCIsXG4gICAgICBsaXN0SXRlbVN0eWxlOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24/Lmxpc3RJdGVtU3R5bGUgfHxcbiAgICAgICAgbGlzdEl0ZW1TdHlsZSxcbiAgICAgIGxvYWRpbmdJY29uVVJMOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LmxvYWRpbmdJY29uVVJMIHx8IFwiXCIsXG4gICAgICByZWFjdGlvbkxpc3RTdHlsZTpcbiAgICAgICAgdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXG4gICAgICAgICAgPy5yZWFjdGlvbkxpc3RTdHlsZSB8fCByZWFjdGlvbkhpc3RvcnlTdHlsZSxcbiAgICAgIHJlYWN0aW9uSXRlbUNsaWNrZWQ6XG4gICAgICAgIHRoaXMucmVhY3Rpb25zQ29uZmlndXJhdGlvbj8ucmVhY3Rpb25MaXN0Q29uZmlndXJhdGlvblxuICAgICAgICAgID8ucmVhY3Rpb25JdGVtQ2xpY2tlZCB8fCB0aGlzLm9uUmVhY3Rpb25JdGVtQ2xpY2tlZCxcbiAgICAgIHJlYWN0aW9uc1JlcXVlc3RCdWlsZGVyOlxuICAgICAgICB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb25cbiAgICAgICAgICA/LnJlYWN0aW9uc1JlcXVlc3RCdWlsZGVyIHx8IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogSGFuZGxlcyB3aGVuIGEgcmVhY3Rpb24gaXRlbSBpcyBjbGlja2VkLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5SZWFjdGlvbn0gcmVhY3Rpb24gLSBUaGUgY2xpY2tlZCByZWFjdGlvbi5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0aGUgcmVhY3Rpb24gaXMgYXNzb2NpYXRlZCB3aXRoLlxuICAgKi9cblxuICBvblJlYWN0aW9uSXRlbUNsaWNrZWQ/ID0gKFxuICAgIHJlYWN0aW9uOiBDb21ldENoYXQuUmVhY3Rpb24sXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICk6IHZvaWQgPT4ge1xuICAgIGlmIChyZWFjdGlvbj8uZ2V0UmVhY3RlZEJ5KCk/LmdldFVpZCgpID09PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgIHRoaXMucmVhY3RUb01lc3NhZ2UocmVhY3Rpb24/LmdldFJlYWN0aW9uKCksIG1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEhhbmRsZXMgYWRkaW5nIGEgcmVhY3Rpb24gd2hlbiBjbGlja2VkLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5SZWFjdGlvbkNvdW50fSByZWFjdGlvbiAtIFRoZSBjbGlja2VkIHJlYWN0aW9uLlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRoZSByZWFjdGlvbiBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqL1xuICBhZGRSZWFjdGlvbk9uQ2xpY2sgPSAoXG4gICAgcmVhY3Rpb246IENvbWV0Q2hhdC5SZWFjdGlvbkNvdW50LFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApID0+IHtcbiAgICBsZXQgb25SZWFjdENsaWNrID0gdGhpcy5yZWFjdGlvbnNDb25maWd1cmF0aW9uPy5yZWFjdGlvbkNsaWNrO1xuICAgIGlmIChvblJlYWN0Q2xpY2spIHtcbiAgICAgIG9uUmVhY3RDbGljayhyZWFjdGlvbiwgbWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVhY3RUb01lc3NhZ2UocmVhY3Rpb24/LmdldFJlYWN0aW9uKCksIG1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIENvbmZpZ3VyYXRpb24gZm9yIHRoZSByZWFjdGlvbiBpbmZvLlxuICAgKiBUaGlzIGluY2x1ZGVzIHN0eWxlcyBmb3IgdGhlIHJlYWN0aW9uIGluZm8gZGlzcGxheS5cbiAgICogQHJldHVybnMge1JlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb259IC0gVGhlIGNvbmZpZ3VyZWQgcmVhY3Rpb24gaW5mby5cbiAgICovXG5cbiAgZ2V0UmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbigpIHtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnJlYWN0aW9uc0NvbmZpZ3VyYXRpb24/LnJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24gfHwge307XG4gICAgY29uc3QgcmVhY3Rpb25JbmZvU3R5bGUgPSBuZXcgUmVhY3Rpb25JbmZvU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgY29uZmlnPy5yZWFjdGlvbkluZm9TdHlsZT8uYmFja2dyb3VuZCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5ib3JkZXIgfHwgXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmJvcmRlclJhZGl1cyB8fCBcIjEycHhcIixcbiAgICAgIGVycm9ySWNvblRpbnQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmVycm9ySWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LmxvYWRpbmdJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIG5hbWVzQ29sb3I6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/Lm5hbWVzQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBuYW1lc0ZvbnQ6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/Lm5hbWVzRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHJlYWN0ZWRUZXh0Q29sb3I6XG4gICAgICAgIGNvbmZpZz8ucmVhY3Rpb25JbmZvU3R5bGU/LnJlYWN0ZWRUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoXCJkYXJrXCIpLFxuICAgICAgcmVhY3RlZFRleHRGb250OlxuICAgICAgICBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5yZWFjdGVkVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICByZWFjdGlvbkZvbnRTaXplOiBjb25maWc/LnJlYWN0aW9uSW5mb1N0eWxlPy5yZWFjdGlvbkZvbnRTaXplIHx8IFwiMzdweFwiLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgUmVhY3Rpb25JbmZvQ29uZmlndXJhdGlvbih7XG4gICAgICByZWFjdGlvbkluZm9TdHlsZTogcmVhY3Rpb25JbmZvU3R5bGUsXG4gICAgICByZWFjdGlvbnNSZXF1ZXN0QnVpbGRlcjogY29uZmlnPy5yZWFjdGlvbnNSZXF1ZXN0QnVpbGRlciB8fCB1bmRlZmluZWQsXG4gICAgICBlcnJvckljb25VUkw6IGNvbmZpZz8uZXJyb3JJY29uVVJMIHx8IFwiXCIsXG4gICAgICBsb2FkaW5nSWNvblVSTDogY29uZmlnPy5sb2FkaW5nSWNvblVSTCB8fCBcIlwiLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBHZXQgc3R5bGUgb2JqZWN0IGJhc2VkIG9uIG1lc3NhZ2UgdHlwZS5cbiAgICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3QuXG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhlIHN0eWxlIG9iamVjdC5cbiAgICovXG4gIGdldFN0YXR1c0luZm9TdHlsZSA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAvLyBCYXNlIHN0eWxlcyB0aGF0IGFyZSBjb21tb24gZm9yIGJvdGggY29uZGl0aW9uc1xuICAgIGNvbnN0IGJhc2VTdHlsZSA9IHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgYWxpZ25JdGVtczogXCJmbGV4LWVuZFwiLFxuICAgICAgZ2FwOiBcIjFweFwiLFxuICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICB9O1xuXG4gICAgLy8gSWYgbWVzc2FnZSB0eXBlIGlzIGF1ZGlvIG9yIHZpZGVvXG4gICAgaWYgKHRoaXMuaXNBdWRpb09yVmlkZW9NZXNzYWdlKG1lc3NhZ2UpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5iYXNlU3R5bGUsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjIycHhcIixcbiAgICAgICAgcGFkZGluZzogXCIzcHggNXB4XCIsXG4gICAgICAgIHBhZGRpbmdUb3A6IFwiMnB4XCIsXG4gICAgICAgIHBvc2l0aW9uOiBcInJlbGF0aXZlXCIsXG4gICAgICAgIG1hcmdpblRvcDogXCItMjZweFwiLFxuICAgICAgICBtYXJnaW5SaWdodDogXCI2cHhcIixcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoXCJkYXJrXCIpLFxuICAgICAgICB3aWR0aDogXCJmaXQtY29udGVudFwiLFxuICAgICAgICBhbGlnblNlbGY6IFwiZmxleC1lbmRcIixcbiAgICAgICAgbWFyZ2luQm90dG9tOiBcIjZweFwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBTdHlsZSBmb3Igb3RoZXIgdHlwZXMgb2YgbWVzc2FnZXNcbiAgICByZXR1cm4ge1xuICAgICAgLi4uYmFzZVN0eWxlLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiZmxleC1lbmRcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1lbmRcIixcbiAgICAgIHBhZGRpbmc6IFwiMHB4IDhweCA0cHggOHB4XCIsXG4gICAgfTtcbiAgfTtcbiAgd3JhcHBlclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubWVzc2FnZUxpc3RTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfTtcbiAgbGlzdFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMuc2hvd1NtYXJ0UmVwbHkgPyBcIjkyJVwiIDogXCIxMDAlXCIsXG4gICAgfTtcbiAgfTtcbiAgLyoqXG4gICAqIFN0eWxpbmcgZm9yIHJlYWN0aW9ucyBjb21wb25lbnRcbiAgICpcbiAgICovXG4gIGdldFJlYWN0aW9uc1dyYXBwZXJTdHlsZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBsZXQgYWxpZ25tZW50ID0gdGhpcy5zZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIHBhZGRpbmdUb3A6IFwiNXB4XCIsXG4gICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBtYXJnaW5Ub3A6IFwiLTlweFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6XG4gICAgICAgIGFsaWdubWVudCA9PT0gTWVzc2FnZUJ1YmJsZUFsaWdubWVudC5sZWZ0ID8gXCJmbGV4LXN0YXJ0XCIgOiBcImZsZXgtZW5kXCIsXG4gICAgfTtcbiAgfVxuICAvKipcbiAgICogU3R5bGluZyBmb3IgdW5yZWFkIHRocmVhZCByZXBsaWVzXG4gICAqIEByZXR1cm5zIExhYmVsU3R5bGVcbiAgICovXG4gIGdldFVucmVhZFJlcGxpZXNDb3VudFN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTBweFwiLFxuICAgICAgd2lkdGg6IFwiMTVweFwiLFxuICAgICAgaGVpZ2h0OiBcIjE1cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VW5yZWFkQmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiB0aGlzLm1lc3NhZ2VMaXN0U3R5bGU/LnRocmVhZFJlcGx5VW5yZWFkVGV4dENvbG9yLFxuICAgICAgZm9udDogdGhpcy5tZXNzYWdlTGlzdFN0eWxlPy50aHJlYWRSZXBseVVucmVhZFRleHRGb250LFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgfTtcbiAgfTtcbiAgZ2V0VGhyZWFkVmlld0FsaWdubWVudChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDpcbiAgICAgICAgdGhpcy5pc1NlbnRCeU1lKG1lc3NhZ2UpICYmXG4gICAgICAgICAgdGhpcy5hbGlnbm1lbnQgPT0gTWVzc2FnZUxpc3RBbGlnbm1lbnQuc3RhbmRhcmRcbiAgICAgICAgICA/IFwiZmxleC1lbmRcIlxuICAgICAgICAgIDogXCJmbGV4LXN0YXJ0XCIsXG4gICAgfTtcbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fd3JhcHBlclwiIFtuZ1N0eWxlXT1cIndyYXBwZXJTdHlsZSgpXCJcbiAgKm5nSWY9XCIhb3BlbkNvbnRhY3RzVmlld1wiPlxuXG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2hlYWRlci12aWV3XCI+XG4gICAgPGRpdiAqbmdJZj1cImhlYWRlclZpZXdcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJoZWFkZXJWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RcIiAjbGlzdFNjcm9sbFxuICAgIFtuZ1N0eWxlXT1cIntoZWlnaHQ6IHNob3dTbWFydFJlcGx5IHx8IHNob3dDb252ZXJzYXRpb25TdGFydGVyIHx8IHNob3dDb252ZXJzYXRpb25TdW1tYXJ5ID8gJzkyJScgOiAnMTAwJSd9XCI+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fdG9wXCIgI3RvcD5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kZWNvcmF0b3ItbWVzc2FnZVwiXG4gICAgICAqbmdJZj1cInN0YXRlID09IHN0YXRlcy5sb2FkaW5nIHx8IHN0YXRlID09IHN0YXRlcy5lcnJvciAgfHwgc3RhdGUgPT0gc3RhdGVzLmVtcHR5IFwiXG4gICAgICBbbmdTdHlsZV09XCJtZXNzYWdlQ29udGFpbmVyU3R5bGUoKVwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fbG9hZGluZy12aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMubG9hZGluZyBcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1sb2FkZXIgW2ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIlxuICAgICAgICAgIFtsb2FkZXJTdHlsZV09XCJsb2FkaW5nU3R5bGVcIj5cbiAgICAgICAgPC9jb21ldGNoYXQtbG9hZGVyPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY3VzdG9tdmlldy0tbG9hZGluZ1wiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMubG9hZGluZyAgJiYgbG9hZGluZ1N0YXRlVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJsb2FkaW5nU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZXJyb3Itdmlld1wiXG4gICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVycm9yICAmJiAhaGlkZUVycm9yIFwiPlxuICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFtsYWJlbFN0eWxlXT1cImVycm9yU3R5bGUoKVwiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgJiYgIWVycm9yU3RhdGVWaWV3XCJcbiAgICAgICAgICBbdGV4dF09XCJlcnJvclN0YXRlVGV4dFwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2N1c3RvbS12aWV3LS1lcnJvclwiXG4gICAgICAgICAgKm5nSWY9XCJzdGF0ZSA9PSBzdGF0ZXMuZXJyb3IgICYmIGVycm9yU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImVycm9yU3RhdGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZW1wdHktdmlld1wiICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVtcHR5XCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jdXN0b20tdmlldy0tZW1wdHlcIlxuICAgICAgICAgICpuZ0lmPVwic3RhdGUgPT0gc3RhdGVzLmVtcHR5ICYmIGVtcHR5U3RhdGVWaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImVtcHR5U3RhdGVWaWV3XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZVwiXG4gICAgICAqbmdGb3I9XCJsZXQgbWVzc2FnZSBvZiBtZXNzYWdlc0xpc3Q7IGxldCBpID0gaW5kZXhcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGUtY29udGFpbmVyXCJcbiAgICAgICAgKm5nSWY9XCIoaSA9PT0gMCkgJiYgbWVzc2FnZT8uZ2V0U2VudEF0KCkgJiYgIWhpZGVEYXRlU2VwYXJhdG9yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19kYXRlXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZSEuZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgW3BhdHRlcm5dPVwiRGF0ZVNlcGFyYXRvclBhdHRlcm5cIiBbZGF0ZVN0eWxlXT1cImRhdGVTZXBhcmF0b3JTdHlsZVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fZGF0ZS1jb250YWluZXJcIlxuICAgICAgICAqbmdJZj1cIihpID4gMCAmJiBpc0RhdGVEaWZmZXJlbnQobWVzc2FnZXNMaXN0W2kgLSAxXT8uZ2V0U2VudEF0KCksIG1lc3NhZ2VzTGlzdFtpXT8uZ2V0U2VudEF0KCkpKSAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKSAmJiAhaGlkZURhdGVTZXBhcmF0b3JcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2RhdGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICBbcGF0dGVybl09XCJEYXRlU2VwYXJhdG9yUGF0dGVyblwiIFtkYXRlU3R5bGVdPVwiZGF0ZVNlcGFyYXRvclN0eWxlXCI+XG4gICAgICAgICAgPC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2ICpuZ0lmPVwiZ2V0QnViYmxlV3JhcHBlcihtZXNzYWdlKVwiPlxuICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cIiFnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCIgI21lc3NhZ2VCdWJibGVSZWZcbiAgICAgICAgW2lkXT1cIm1lc3NhZ2U/LmdldElkKClcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZVxuICAgICAgICAgIFtsZWFkaW5nVmlld109XCIgc2hvd0F2YXRhciA/IGxlYWRpbmdWaWV3IDogbnVsbFwiXG4gICAgICAgICAgW2JvdHRvbVZpZXddPVwiZ2V0Qm90dG9tVmlldyhtZXNzYWdlKVwiXG4gICAgICAgICAgW3N0YXR1c0luZm9WaWV3XT1cInNob3dTdGF0dXNJbmZvKG1lc3NhZ2UpID8gIHN0YXR1c0luZm9WaWV3IDogbnVsbFwiXG4gICAgICAgICAgW2hlYWRlclZpZXddPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKSB8fCBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpID8gYnViYmxlSGVhZGVyIDogbnVsbFwiXG4gICAgICAgICAgW2Zvb3RlclZpZXddPVwiZ2V0Rm9vdGVyVmlldyhtZXNzYWdlKSB8fCByZWFjdGlvblZpZXdcIlxuICAgICAgICAgIFtjb250ZW50Vmlld109XCJjb250ZW50Vmlld1wiIFt0aHJlYWRWaWV3XT1cInRocmVhZFZpZXdcIlxuICAgICAgICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpIHx8IG1lc3NhZ2U/LmdldE11aWQoKVwiXG4gICAgICAgICAgW29wdGlvbnNdPVwic2V0TWVzc2FnZU9wdGlvbnMobWVzc2FnZSlcIlxuICAgICAgICAgIFttZXNzYWdlQnViYmxlU3R5bGVdPVwic2V0TWVzc2FnZUJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICBbYWxpZ25tZW50XT1cInNldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKVwiPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjY29udGVudFZpZXc+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0Q29udGVudFZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjcmVhY3Rpb25WaWV3PlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWFjdGlvbnNcbiAgICAgICAgICAgICAgKm5nSWY9XCJtZXNzYWdlLmdldFJlYWN0aW9ucygpICYmIG1lc3NhZ2UuZ2V0UmVhY3Rpb25zKCkubGVuZ3RoID4gMCAmJiAhZGlzYWJsZVJlYWN0aW9uc1wiXG4gICAgICAgICAgICAgIFttZXNzYWdlT2JqZWN0XT1cImdldENsb25lZFJlYWN0aW9uT2JqZWN0KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgW2FsaWdubWVudF09XCJzZXRCdWJibGVBbGlnbm1lbnQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICBbcmVhY3Rpb25zU3R5bGVdPVwiZ2V0UmVhY3Rpb25zU3R5bGUoKVwiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkNsaWNrXT1cImFkZFJlYWN0aW9uT25DbGlja1wiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkxpc3RDb25maWd1cmF0aW9uXT1cImdldFJlYWN0aW9uTGlzdENvbmZpZ3VyYXRpb24oKVwiXG4gICAgICAgICAgICAgIFtyZWFjdGlvbkluZm9Db25maWd1cmF0aW9uXT1cImdldFJlYWN0aW9uSW5mb0NvbmZpZ3VyYXRpb24oKVwiPjwvY29tZXRjaGF0LXJlYWN0aW9ucz5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjc3RhdHVzSW5mb1ZpZXc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtc3RhdHVzLWluZm9cIlxuICAgICAgICAgICAgICBbbmdTdHlsZV09XCJnZXRTdGF0dXNJbmZvU3R5bGUobWVzc2FnZSlcIj5cbiAgICAgICAgICAgICAgPGRpdiAqbmdJZj1cImdldFN0YXR1c0luZm9WaWV3KG1lc3NhZ2UpO2Vsc2UgYnViYmxlRm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlRm9vdGVyPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1kYXRlXCJcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0uYm90dG9tICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiAhbWVzc2FnZS5nZXREZWxldGVkQXQoKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+XG4gICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAgICAgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIj5cbiAgICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCJzaG91bGRTaG93TWVzc2FnZShtZXNzYWdlLCBkaXNhYmxlUmVjZWlwdCwgaGlkZVJlY2VpcHQpXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19yZWNlaXB0XCI+XG4gICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LXJlY2VpcHQgW3JlY2VpcHRdPVwiZ2V0TWVzc2FnZVJlY2VpcHQobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cImdldFJlY2VpcHRTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAgIFt3YWl0SWNvbl09XCJ3YWl0SWNvblwiIFtzZW50SWNvbl09XCJzZW50SWNvblwiXG4gICAgICAgICAgICAgICAgICAgIFtkZWxpdmVyZWRJY29uXT1cImRlbGl2ZXJlZEljb25cIiBbcmVhZEljb25dPVwicmVhZEljb25cIlxuICAgICAgICAgICAgICAgICAgICBbZXJyb3JJY29uXT1cImVycm9ySWNvblwiPjwvY29tZXRjaGF0LXJlY2VpcHQ+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICpuZ0lmPVwiIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAgJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpXCI+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYXZhdGFyIFtuYW1lXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICAgICAgICAgICAgW2ltYWdlXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRBdmF0YXIoKVwiPlxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlSGVhZGVyPlxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7ZWxzZSBkZWZhdWx0SGVhZGVyXCI+XG4gICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRIZWFkZXI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1oZWFkZXJcIlxuICAgICAgICAgICAgICAgICpuZ0lmPVwibWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCI+XG4gICAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImxhYmVsU3R5bGVcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIlxuICAgICAgICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLnRvcCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjdGhyZWFkVmlldz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3RocmVhZHJlcGxpZXNcIlxuICAgICAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LmdldFJlcGx5Q291bnQoKSAmJiAhbWVzc2FnZS5nZXREZWxldGVkQXQoKVwiXG4gICAgICAgICAgICAgIFtuZ1N0eWxlXT1cImdldFRocmVhZFZpZXdBbGlnbm1lbnQobWVzc2FnZSlcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbaWNvblVSTF09XCJ0aHJlYWRJbmRpY2F0b3JJY29uXCJcbiAgICAgICAgICAgICAgICBbbWlycm9ySWNvbl09XCJnZXRUaHJlYWRJY29uQWxpZ25tZW50KG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiZ2V0VGhyZWFkVmlld1N0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib3BlblRocmVhZFZpZXcobWVzc2FnZSlcIlxuICAgICAgICAgICAgICAgIFt0ZXh0XT0nZ2V0VGhyZWFkQ291bnQobWVzc2FnZSknPlxuICAgICAgICAgICAgICAgIDwhLS0gPHNwYW4gc2xvdD1cImJ1dHRvblZpZXdcIiBbbmdTdHlsZV09XCJnZXRVbnJlYWRSZXBsaWVzQ291bnRTdHlsZSgpXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X191bnJlYWQtdGhyZWFkXCJcbiAgICAgICAgICAgICAgICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZS5nZXRVbnJlYWRSZXBseUNvdW50KCkgPiAwXCI+XG4gICAgICAgICAgICAgICAgICB7e21lc3NhZ2UuZ2V0VW5yZWFkUmVwbHlDb3VudCgpfX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+IC0tPlxuXG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19ib3R0b21cIiAjYm90dG9tPlxuICAgIDwvZGl2PlxuXG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19tZXNzYWdlLWluZGljYXRvclwiXG4gICAgKm5nSWY9XCJVbnJlYWRDb3VudCAmJiBVbnJlYWRDb3VudC5sZW5ndGggPiAwICYmICFpc09uQm90dG9tXCJcbiAgICBbbmdTdHlsZV09XCJ7Ym90dG9tOiBzaG93U21hcnRSZXBseSB8fCBmb290ZXJWaWV3IHx8IHNob3dDb252ZXJzYXRpb25TdGFydGVyIHx8IHNob3dDb252ZXJzYXRpb25TdW1tYXJ5ICA/ICcyMHB4JyA6ICcxMHB4J31cIj5cbiAgICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtpY29uVVJMXT1cIm5ld01lc3NhZ2VJbmRpY2F0b3JJY29uVXJsXCIgW3RleHRdPVwibmV3TWVzc2FnZUNvdW50XCJcbiAgICAgIFtidXR0b25TdHlsZV09XCJ1bnJlYWRNZXNzYWdlc1N0eWxlXCJcbiAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJzY3JvbGxUb0JvdHRvbSgpXCI+PC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19mb290ZXItdmlld1wiIFtuZ1N0eWxlXT1cIntoZWlnaHQ6ICAnYXV0byd9XCI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwiZm9vdGVyVmlldztlbHNlIGZvb3RlclwiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cImZvb3RlclZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxuZy10ZW1wbGF0ZSAjZm9vdGVyPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19zbWFydC1yZXBsaWVzXCJcbiAgICAgICAgKm5nSWY9XCIhc2hvd0NvbnZlcnNhdGlvblN0YXJ0ZXIgJiYgc2hvd1NtYXJ0UmVwbHkgJiYgZ2V0UmVwbGllcygpXCI+XG4gICAgICAgIDxzbWFydC1yZXBsaWVzIFtzbWFydFJlcGx5U3R5bGVdPVwic21hcnRSZXBseVN0eWxlXCJcbiAgICAgICAgICBbcmVwbGllc109XCJnZXRSZXBsaWVzKClcIiAoY2MtcmVwbHktY2xpY2tlZCk9XCJzZW5kUmVwbHkoJGV2ZW50KVwiXG4gICAgICAgICAgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VTbWFydFJlcGx5KClcIj5cbiAgICAgICAgPC9zbWFydC1yZXBsaWVzPlxuICAgICAgPC9kaXY+XG5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fY29udmVyc2F0aW9uLXN0YXJ0ZXJzXCJcbiAgICAgICAgKm5nSWY9XCJlbmFibGVDb252ZXJzYXRpb25TdGFydGVyICYmIHNob3dDb252ZXJzYXRpb25TdGFydGVyXCI+XG4gICAgICAgIDxjb21ldGNoYXQtYWktY2FyZCBbc3RhdGVdPVwiY29udmVyc2F0aW9uU3RhcnRlclN0YXRlXCJcbiAgICAgICAgICBbbG9hZGluZ1N0YXRlVGV4dF09XCJzdGFydGVyTG9hZGluZ1N0YXRlVGV4dFwiXG4gICAgICAgICAgW2VtcHR5U3RhdGVUZXh0XT1cInN0YXJ0ZXJFbXB0eVN0YXRlVGV4dFwiXG4gICAgICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCI+XG4gICAgICAgICAgPHNtYXJ0LXJlcGxpZXNcbiAgICAgICAgICAgICpuZ0lmPVwiY29udmVyc2F0aW9uU3RhcnRlclN0YXRlID09IHN0YXRlcy5sb2FkZWQgJiYgIXBhcmVudE1lc3NhZ2VJZFwiXG4gICAgICAgICAgICBbc21hcnRSZXBseVN0eWxlXT1cImNvbnZlcnNhdGlvblN0YXJ0ZXJTdHlsZVwiXG4gICAgICAgICAgICBbcmVwbGllc109XCJjb252ZXJzYXRpb25TdGFydGVyUmVwbGllc1wiIHNsb3Q9XCJsb2FkZWRWaWV3XCJcbiAgICAgICAgICAgIChjYy1yZXBseS1jbGlja2VkKT1cInNlbmRDb252ZXJzYXRpb25TdGFydGVyKCRldmVudClcIlxuICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCInJ1wiPlxuICAgICAgICAgIDwvc21hcnQtcmVwbGllcz5cbiAgICAgICAgPC9jb21ldGNoYXQtYWktY2FyZD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19jb252ZXJzYXRpb24tc3VtbWFyeVwiXG4gICAgICAgICpuZ0lmPVwiZW5hYmxlQ29udmVyc2F0aW9uU3VtbWFyeSAmJiBzaG93Q29udmVyc2F0aW9uU3VtbWFyeVwiPlxuXG4gICAgICAgIDxjb21ldGNoYXQtYWktY2FyZCBbc3RhdGVdPVwiY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlXCJcbiAgICAgICAgICBbbG9hZGluZ1N0YXRlVGV4dF09XCJzdW1tYXJ5TG9hZGluZ1N0YXRlVGV4dFwiXG4gICAgICAgICAgW2VtcHR5U3RhdGVUZXh0XT1cInN1bW1hcnlFbXB0eVN0YXRlVGV4dFwiXG4gICAgICAgICAgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCIgW2Vycm9ySWNvblVSTF09XCJhaUVycm9ySWNvblwiXG4gICAgICAgICAgW2VtcHR5SWNvblVSTF09XCJhaUVtcHR5SWNvblwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcGFuZWxcbiAgICAgICAgICAgICpuZ0lmPVwiY29udmVyc2F0aW9uU3VtbWFyeVN0YXRlID09IHN0YXRlcy5sb2FkZWQgJiYgIXBhcmVudE1lc3NhZ2VJZFwiXG4gICAgICAgICAgICBzbG90PVwibG9hZGVkVmlld1wiIFtwYW5lbFN0eWxlXT1cImNvbnZlcnNhdGlvblN1bW1hcnlTdHlsZVwiXG4gICAgICAgICAgICB0aXRsZT1cIkNvbnZlcnNhdGlvbiBTdW1tYXJ5XCIgW3RleHRdPVwiY29udmVyc2F0aW9uU3VtbWFyeVwiXG4gICAgICAgICAgICAoY2MtY2xvc2UtY2xpY2tlZCk9XCJjbG9zZUNvbnZlcnNhdGlvblN1bW1hcnkoKVwiPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBhbmVsPlxuICAgICAgICA8L2NvbWV0Y2hhdC1haS1jYXJkPlxuXG4gICAgICA8L2Rpdj5cblxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvZGl2PlxuXG48L2Rpdj5cbjwhLS0gZGVmYXVsdCBidWJibGVzIC0tPlxuPG5nLXRlbXBsYXRlICN0ZXh0QnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgKm5nSWY9XCJtZXNzYWdlPy50eXBlID09IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiXG4gICAgW3RleHRdPVwiZ2V0QWN0aW9uTWVzc2FnZShtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuICA8Y29tZXRjaGF0LXRleHQtYnViYmxlICpuZ0lmPVwibWVzc2FnZT8uZ2V0RGVsZXRlZEF0KClcIlxuICAgIFt0ZXh0U3R5bGVdPVwic2V0VGV4dEJ1YmJsZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJsb2NhbGl6ZSgnTUVTU0FHRV9JU19ERUxFVEVEJylcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPGNvbWV0Y2hhdC10ZXh0LWJ1YmJsZVxuICAgICpuZ0lmPVwiIWlzVHJhbnNsYXRlZChtZXNzYWdlKSAmJiAhZ2V0TGlua1ByZXZpZXcobWVzc2FnZSkgJiYgIW1lc3NhZ2U/LmRlbGV0ZWRBdCAmJiBtZXNzYWdlPy50eXBlICE9IE1lc3NhZ2VUeXBlc0NvbnN0YW50Lmdyb3VwTWVtYmVyXCJcbiAgICBbdGV4dFN0eWxlXT1cInNldFRleHRCdWJibGVTdHlsZShtZXNzYWdlKVwiIFt0ZXh0XT1cImdldFRleHRNZXNzYWdlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPGxpbmstcHJldmlldyBbbGlua1ByZXZpZXdTdHlsZV09XCJsaW5rUHJldmlld1N0eWxlXCJcbiAgICAoY2MtbGluay1jbGlja2VkKT1cIm9wZW5MaW5rVVJMKCRldmVudClcIlxuICAgICpuZ0lmPVwiIW1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpICYmIGdldExpbmtQcmV2aWV3KG1lc3NhZ2UpICYmIGVuYWJsZUxpbmtQcmV2aWV3XCJcbiAgICBbdGl0bGVdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCd0aXRsZScsbWVzc2FnZSlcIlxuICAgIFtkZXNjcmlwdGlvbl09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ2Rlc2NyaXB0aW9uJyxtZXNzYWdlKVwiXG4gICAgW1VSTF09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ3VybCcsbWVzc2FnZSlcIlxuICAgIFtpbWFnZV09XCJnZXRMaW5rUHJldmlld0RldGFpbHMoJ2ltYWdlJyxtZXNzYWdlKVwiXG4gICAgW2Zhdkljb25VUkxdPVwiZ2V0TGlua1ByZXZpZXdEZXRhaWxzKCdmYXZpY29uJyxtZXNzYWdlKVwiPlxuICAgIDxjb21ldGNoYXQtdGV4dC1idWJibGVcbiAgICAgICpuZ0lmPVwiIWlzVHJhbnNsYXRlZChtZXNzYWdlKSAmJiBnZXRMaW5rUHJldmlldyhtZXNzYWdlKSAmJiAhbWVzc2FnZT8uZGVsZXRlZEF0ICYmIG1lc3NhZ2U/LnR5cGUgIT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIiBbdGV4dF09XCJnZXRUZXh0TWVzc2FnZShtZXNzYWdlKVwiXG4gICAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC10ZXh0LWJ1YmJsZT5cbiAgPC9saW5rLXByZXZpZXc+XG4gIDxtZXNzYWdlLXRyYW5zbGF0aW9uLWJ1YmJsZSBbYWxpZ25tZW50XT1cImdldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKVwiXG4gICAgKm5nSWY9XCJpc1RyYW5zbGF0ZWQobWVzc2FnZSlcIlxuICAgIFttZXNzYWdlVHJhbnNsYXRpb25TdHlsZV09XCJzZXRUcmFuc2xhdGlvblN0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdHJhbnNsYXRlZFRleHRdPVwiaXNUcmFuc2xhdGVkKG1lc3NhZ2UpXCJcbiAgICBbdGV4dEZvcm1hdHRlcnNdPVwiZ2V0VGV4dEZvcm1hdHRlcnMobWVzc2FnZSlcIj5cbiAgICA8Y29tZXRjaGF0LXRleHQtYnViYmxlXG4gICAgICAqbmdJZj1cIiAhbWVzc2FnZT8uZGVsZXRlZEF0ICYmIG1lc3NhZ2U/LnR5cGUgIT0gTWVzc2FnZVR5cGVzQ29uc3RhbnQuZ3JvdXBNZW1iZXJcIlxuICAgICAgW3RleHRTdHlsZV09XCJzZXRUZXh0QnViYmxlU3R5bGUobWVzc2FnZSlcIiBbdGV4dF09XCJtZXNzYWdlPy50ZXh0XCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJnZXRUZXh0Rm9ybWF0dGVycyhtZXNzYWdlKVwiPjwvY29tZXRjaGF0LXRleHQtYnViYmxlPlxuXG4gIDwvbWVzc2FnZS10cmFuc2xhdGlvbi1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNmaWxlQnViYmxlIGxldC1tZXNzYWdlPlxuXG4gIDxjb21ldGNoYXQtZmlsZS1idWJibGUgW2ZpbGVTdHlsZV09XCJzZXRGaWxlQnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFtkb3dubG9hZEljb25VUkxdPVwiZG93bmxvYWRJY29uVVJMXCIgW3N1YnRpdGxlXT1cImxvY2FsaXplKCdTSEFSRURfRklMRScpXCJcbiAgICBbdGl0bGVdPVwibWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHMgPyBtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50c1swXT8ubmFtZTogJydcIlxuICAgIFtmaWxlVVJMXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybCA6ICcnXCI+PC9jb21ldGNoYXQtZmlsZS1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNhdWRpb0J1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbZGlzYWJsZWRdPVwidHJ1ZVwiXG4gICAgKm5nSWY9XCJtZXNzYWdlPy5jYXRlZ29yeSA9PSBjYWxsQ29uc3RhbnQgJiYgbWVzc2FnZT8udHlwZSA9PSBNZXNzYWdlVHlwZXNDb25zdGFudC5hdWRpb1wiXG4gICAgW2ljb25VUkxdPVwiZ2V0Q2FsbFR5cGVJY29uKG1lc3NhZ2UpXCJcbiAgICBbYnV0dG9uU3R5bGVdPVwiY2FsbFN0YXR1c1N0eWxlKG1lc3NhZ2UpXCJcbiAgICBbdGV4dF09XCJnZXRDYWxsQWN0aW9uTWVzc2FnZShtZXNzYWdlKVwiPjwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICA8Y29tZXRjaGF0LWF1ZGlvLWJ1YmJsZVxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgbWVzc2FnZT8uY2F0ZWdvcnkgIT0gY2FsbENvbnN0YW50XCJcbiAgICBbc3JjXT1cIm1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzID8gbWVzc2FnZT8uZGF0YT8uYXR0YWNobWVudHNbMF0/LnVybCA6ICcnXCI+XG4gIDwvY29tZXRjaGF0LWF1ZGlvLWJ1YmJsZT5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3ZpZGVvQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtkaXNhYmxlZF09XCJ0cnVlXCJcbiAgICAqbmdJZj1cIm1lc3NhZ2U/LmNhdGVnb3J5ID09IGNhbGxDb25zdGFudCAmJiBtZXNzYWdlPy50eXBlID09IE1lc3NhZ2VUeXBlc0NvbnN0YW50LnZpZGVvXCJcbiAgICBbaWNvblVSTF09XCJnZXRDYWxsVHlwZUljb24obWVzc2FnZSlcIlxuICAgIFtidXR0b25TdHlsZV09XCJjYWxsU3RhdHVzU3R5bGUobWVzc2FnZSlcIlxuICAgIFt0ZXh0XT1cImdldENhbGxBY3Rpb25NZXNzYWdlKG1lc3NhZ2UpXCI+PC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG5cbiAgPGNvbWV0Y2hhdC12aWRlby1idWJibGVcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmIG1lc3NhZ2U/LmNhdGVnb3J5ICE9IGNhbGxDb25zdGFudFwiXG4gICAgW3ZpZGVvU3R5bGVdPVwidmlkZW9CdWJibGVTdHlsZVwiXG4gICAgW3NyY109XCJtZXNzYWdlPy5kYXRhPy5hdHRhY2htZW50cyA/IG1lc3NhZ2U/LmRhdGE/LmF0dGFjaG1lbnRzWzBdPy51cmwgOiAnJ1wiXG4gICAgW3Bvc3Rlcl09XCIgZ2V0SW1hZ2VUaHVtYm5haWwobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC12aWRlby1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNpbWFnZUJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGltYWdlLW1vZGVyYXRpb24gKGNjLXNob3ctZGlhbG9nKT1cIm9wZW5XYXJuaW5nRGlhbG9nKCRldmVudClcIlxuICAgICpuZ0lmPVwiIW1lc3NhZ2UuZ2V0RGVsZXRlZEF0KCkgJiYgZW5hYmxlSW1hZ2VNb2RlcmF0aW9uXCIgW21lc3NhZ2VdPVwibWVzc2FnZVwiXG4gICAgW2ltYWdlTW9kZXJhdGlvblN0eWxlXT1cImltYWdlTW9kZXJhdGlvblN0eWxlXCI+XG4gICAgPGNvbWV0Y2hhdC1pbWFnZS1idWJibGUgKGNjLWltYWdlLWNsaWNrZWQpPVwib3BlbkltYWdlSW5GdWxsU2NyZWVuKG1lc3NhZ2UpXCJcbiAgICAgIFtpbWFnZVN0eWxlXT1cImltYWdlQnViYmxlU3R5bGVcIiBbc3JjXT1cIiBnZXRJbWFnZVRodW1ibmFpbChtZXNzYWdlKVwiXG4gICAgICBbcGxhY2Vob2xkZXJJbWFnZV09XCJwbGFjZWhvbGRlckljb25VUkxcIj48L2NvbWV0Y2hhdC1pbWFnZS1idWJibGU+XG4gIDwvaW1hZ2UtbW9kZXJhdGlvbj5cbiAgPGNvbWV0Y2hhdC1pbWFnZS1idWJibGUgW2ltYWdlU3R5bGVdPVwiaW1hZ2VCdWJibGVTdHlsZVwiXG4gICAgKGNjLWltYWdlLWNsaWNrZWQpPVwib3BlbkltYWdlSW5GdWxsU2NyZWVuKG1lc3NhZ2UpXCJcbiAgICAqbmdJZj1cIiFtZXNzYWdlLmdldERlbGV0ZWRBdCgpICYmICFlbmFibGVJbWFnZU1vZGVyYXRpb25cIlxuICAgIFtzcmNdPVwiIGdldEltYWdlVGh1bWJuYWlsKG1lc3NhZ2UpXCJcbiAgICBbcGxhY2Vob2xkZXJJbWFnZV09XCJwbGFjZWhvbGRlckljb25VUkxcIj48L2NvbWV0Y2hhdC1pbWFnZS1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNmb3JtQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWZvcm0tYnViYmxlIFttZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtmb3JtQnViYmxlU3R5bGVdPVwiZ2V0Rm9ybU1lc3NhZ2VCdWJibGVTdHlsZSgpXCI+PC9jb21ldGNoYXQtZm9ybS1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNjYXJkQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWNhcmQtYnViYmxlIFttZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtjYXJkQnViYmxlU3R5bGVdPVwiZ2V0Q2FyZE1lc3NhZ2VCdWJibGVTdHlsZSgpXCI+PC9jb21ldGNoYXQtY2FyZC1idWJibGU+XG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNjdXN0b21UZXh0QnViYmxlPlxuPC9uZy10ZW1wbGF0ZT5cbjxuZy10ZW1wbGF0ZSAjc3RpY2tlckJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1pbWFnZS1idWJibGUgW3NyY109XCJnZXRTdGlja2VyKG1lc3NhZ2UpXCJcbiAgICBbaW1hZ2VTdHlsZV09XCJpbWFnZUJ1YmJsZVN0eWxlXCI+PC9jb21ldGNoYXQtaW1hZ2UtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICN3aGl0ZWJvYXJkQnViYmxlIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZSBbaGlkZVNlcGFyYXRvcl09XCJmYWxzZVwiXG4gICAgW2ljb25BbGlnbm1lbnRdPVwiZG9jdW1lbnRCdWJibGVBbGlnbm1lbnRcIlxuICAgIFtkb2N1bWVudFN0eWxlXT1cImRvY3VtZW50QnViYmxlU3R5bGVcIiBbVVJMXT1cImdldFdoaXRlYm9hcmREb2N1bWVudChtZXNzYWdlKVwiXG4gICAgW2NjQ2xpY2tlZF09XCJsYXVuY2hDb2xsYWJvcmF0aXZlV2hpdGVib2FyZFwiXG4gICAgW2ljb25VUkxdPVwid2hpdGVib2FyZEljb25VUkxcIiBbdGl0bGVdPVwid2hpdGVib2FyZFRpdGxlXCJcbiAgICBbYnV0dG9uVGV4dF09XCJ3aGl0ZWJvYXJkQnV0dG9uVGV4dFwiXG4gICAgW3N1YnRpdGxlXT1cIndoaXRlYm9hcmRTdWJpdGxlXCI+PC9jb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNkb2N1bWVudEJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1kb2N1bWVudC1idWJibGUgW2hpZGVTZXBhcmF0b3JdPVwiZmFsc2VcIlxuICAgIFtpY29uQWxpZ25tZW50XT1cImRvY3VtZW50QnViYmxlQWxpZ25tZW50XCJcbiAgICBbZG9jdW1lbnRTdHlsZV09XCJkb2N1bWVudEJ1YmJsZVN0eWxlXCIgW1VSTF09XCJnZXRXaGl0ZWJvYXJkRG9jdW1lbnQobWVzc2FnZSlcIlxuICAgIFtjY0NsaWNrZWRdPVwibGF1bmNoQ29sbGFib3JhdGl2ZURvY3VtZW50XCJcbiAgICBbaWNvblVSTF09XCJkb2N1bWVudEljb25VUkxcIiBbdGl0bGVdPVwiZG9jdW1lbnRUaXRsZVwiXG4gICAgW2J1dHRvblRleHRdPVwiZG9jdW1lbnRCdXR0b25UZXh0XCJcbiAgICBbc3VidGl0bGVdPVwiZG9jdW1lbnRTdWJpdGxlXCI+PC9jb21ldGNoYXQtZG9jdW1lbnQtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNkaXJlY3RDYWxsaW5nIGxldC1tZXNzYWdlPlxuICA8Y29tZXRjaGF0LWRvY3VtZW50LWJ1YmJsZSBbaGlkZVNlcGFyYXRvcl09XCJ0cnVlXCJcbiAgICBbaWNvbkFsaWdubWVudF09XCJjYWxsQnViYmxlQWxpZ25tZW50XCJcbiAgICBbZG9jdW1lbnRTdHlsZV09XCJnZXRDYWxsQnViYmxlU3R5bGUobWVzc2FnZSlcIiBbVVJMXT1cImdldFNlc3Npb25JZChtZXNzYWdlKVwiXG4gICAgW2NjQ2xpY2tlZF09XCJnZXRTdGFydENhbGxGdW5jdGlvbihtZXNzYWdlKVwiIFtpY29uVVJMXT1cImRpcmVjdENhbGxJY29uVVJMXCJcbiAgICBbdGl0bGVdPVwiZ2V0Q2FsbEJ1YmJsZVRpdGxlKG1lc3NhZ2UpXCIgW2J1dHRvblRleHRdPVwiam9pbkNhbGxCdXR0b25UZXh0XCJcbiAgICAqbmdJZj1cIm1lc3NhZ2UuY2F0ZWdvcnkgPT0gJ2N1c3RvbSdcIj48L2NvbWV0Y2hhdC1kb2N1bWVudC1idWJibGU+XG5cbjwvbmctdGVtcGxhdGU+XG48bmctdGVtcGxhdGUgI3NjaGVkdWxlckJ1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGNvbWV0Y2hhdC1zY2hlZHVsZXItYnViYmxlIFtzY2hlZHVsZXJNZXNzYWdlXT1cIm1lc3NhZ2VcIlxuICAgIFtsb2dnZWRJblVzZXJdPVwibG9nZ2VkSW5Vc2VyXCJcbiAgICBbc2NoZWR1bGVyQnViYmxlU3R5bGVdPVwiZ2V0U2NoZWR1bGVyQnViYmxlU3R5bGUobWVzc2FnZSlcIj48L2NvbWV0Y2hhdC1zY2hlZHVsZXItYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuPG5nLXRlbXBsYXRlICNwb2xsQnViYmxlIGxldC1tZXNzYWdlPlxuICA8cG9sbHMtYnViYmxlIFtwb2xsU3R5bGVdPVwicG9sbEJ1YmJsZVN0eWxlXCJcbiAgICBbcG9sbFF1ZXN0aW9uXT1cImdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2UsJ3F1ZXN0aW9uJylcIlxuICAgIFtwb2xsSWRdPVwiZ2V0UG9sbEJ1YmJsZURhdGEobWVzc2FnZSwnaWQnKVwiIFtsb2dnZWRJblVzZXJdPVwibG9nZ2VkSW5Vc2VyXCJcbiAgICBbc2VuZGVyVWlkXT1cImdldFBvbGxCdWJibGVEYXRhKG1lc3NhZ2UpXCJcbiAgICBbbWV0YWRhdGFdPVwibWVzc2FnZT8ubWV0YWRhdGFcIj48L3BvbGxzLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cblxuPCEtLSB0aHJlYWQgYnViYmxlIHZpZXcgLS0+XG48bmctdGVtcGxhdGUgI3RocmVhZE1lc3NhZ2VCdWJibGUgbGV0LW1lc3NhZ2U+XG4gIDxkaXYgKm5nSWY9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCI+XG4gICAgPG5nLWNvbnRhaW5lclxuICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuICA8L2Rpdj5cbiAgPGNvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZSAqbmdJZj1cIiFnZXRCdWJibGVXcmFwcGVyKG1lc3NhZ2UpXCJcbiAgICBbYm90dG9tVmlld109XCJnZXRCb3R0b21WaWV3KG1lc3NhZ2UpXCJcbiAgICBbc3RhdHVzSW5mb1ZpZXddPVwic2hvd1N0YXR1c0luZm8obWVzc2FnZSkgPyAgc3RhdHVzSW5mb1ZpZXcgOiBudWxsXCJcbiAgICBbbGVhZGluZ1ZpZXddPVwiIHNob3dBdmF0YXIgPyBsZWFkaW5nVmlldyA6IG51bGxcIiBbaGVhZGVyVmlld109XCJidWJibGVIZWFkZXJcIlxuICAgIFtmb290ZXJWaWV3XT1cImdldEZvb3RlclZpZXcobWVzc2FnZSlcIiBbY29udGVudFZpZXddPVwiY29udGVudFZpZXdcIlxuICAgIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpIHx8IG1lc3NhZ2U/LmdldE11aWQoKVwiXG4gICAgW21lc3NhZ2VCdWJibGVTdHlsZV09XCJzZXRNZXNzYWdlQnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFthbGlnbm1lbnRdPVwidGhyZWFkZWRBbGlnbm1lbnRcIj5cbiAgICA8bmctdGVtcGxhdGUgI2NvbnRlbnRWaWV3PlxuICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldENvbnRlbnRWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI3N0YXR1c0luZm9WaWV3PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLXN0YXR1cy1pbmZvXCJcbiAgICAgICAgW25nU3R5bGVdPVwiZ2V0U3RhdHVzSW5mb1N0eWxlKG1lc3NhZ2UpXCI+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKTtlbHNlIGJ1YmJsZUZvb3RlclwiPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0U3RhdHVzSW5mb1ZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8bmctdGVtcGxhdGUgI2J1YmJsZUZvb3Rlcj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1saXN0X19idWJibGUtZGF0ZVwiXG4gICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLmJvdHRvbSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFt0aW1lc3RhbXBdPVwibWVzc2FnZT8uZ2V0U2VudEF0KClcIlxuICAgICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAqbmdJZj1cInNob3VsZFNob3dNZXNzYWdlKG1lc3NhZ2UsIGRpc2FibGVSZWNlaXB0LCBoaWRlUmVjZWlwdClcIlxuICAgICAgICAgICAgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX3JlY2VpcHRcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcmVjZWlwdCBbcmVjZWlwdF09XCJnZXRNZXNzYWdlUmVjZWlwdChtZXNzYWdlKVwiXG4gICAgICAgICAgICAgIFtyZWNlaXB0U3R5bGVdPVwiZ2V0UmVjZWlwdFN0eWxlKG1lc3NhZ2UpXCIgW3dhaXRJY29uXT1cIndhaXRJY29uXCJcbiAgICAgICAgICAgICAgW3NlbnRJY29uXT1cInNlbnRJY29uXCIgW2RlbGl2ZXJlZEljb25dPVwiXCJcbiAgICAgICAgICAgICAgW3JlYWRJY29uXT1cImRlbGl2ZXJlZEljb25cIlxuICAgICAgICAgICAgICBbZXJyb3JJY29uXT1cImVycm9ySWNvblwiPjwvY29tZXRjaGF0LXJlY2VpcHQ+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8L2Rpdj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG4gICAgICA8ZGl2XG4gICAgICAgICpuZ0lmPVwiIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJiBzaG93SGVhZGVyVGl0bGUobWVzc2FnZSlcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1hdmF0YXIgW25hbWVdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldE5hbWUoKVwiXG4gICAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICAgICAgICBbaW1hZ2VdPVwibWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldEF2YXRhcigpXCI+XG4gICAgICAgIDwvY29tZXRjaGF0LWF2YXRhcj5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPG5nLXRlbXBsYXRlICNidWJibGVIZWFkZXI+XG4gICAgICA8ZGl2ICpuZ0lmPVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtlbHNlIGRlZmF1bHRIZWFkZXJcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiZ2V0SGVhZGVyVmlldyhtZXNzYWdlKTtjb250ZXh0OnsgJGltcGxpY2l0OiBtZXNzYWdlIH1cIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdEhlYWRlcj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtbGlzdF9fYnViYmxlLWhlYWRlclwiXG4gICAgICAgICAgKm5nSWY9XCJtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpICYmIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gTWVzc2FnZUNhdGVnb3J5LmNhbGxcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFt0ZXh0XT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgICAgW2xhYmVsU3R5bGVdPVwibGFiZWxTdHlsZVwiPjwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbcGF0dGVybl09XCJkYXRlUGF0dGVyblwiXG4gICAgICAgICAgICBbdGltZXN0YW1wXT1cIm1lc3NhZ2U/LmdldFNlbnRBdCgpXCJcbiAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZ2V0QnViYmxlRGF0ZVN0eWxlKG1lc3NhZ2UpXCJcbiAgICAgICAgICAgICpuZ0lmPVwidGltZXN0YW1wQWxpZ25tZW50ID09IHRpbWVzdGFtcEVudW0udG9wICYmIG1lc3NhZ2U/LmdldFNlbnRBdCgpXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L25nLXRlbXBsYXRlPlxuICAgIDwvbmctdGVtcGxhdGU+XG4gIDwvY29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlPlxuXG48L25nLXRlbXBsYXRlPlxuXG5cbjwhLS0gIC0tPlxuPGNvbWV0Y2hhdC1wb3BvdmVyIFtwb3BvdmVyU3R5bGVdPVwicG9wb3ZlclN0eWxlXCIgI3BvcG92ZXJSZWZcbiAgW3BsYWNlbWVudF09XCJrZXlib2FyZEFsaWdubWVudFwiIChjYy1wb3BvdmVyLW91dHNpZGUtY2xpY2tlZCk9XCJvbkVtb2ppS2V5Ym9hcmRDbG9zZWQoKVwiPlxuICA8Y29tZXRjaGF0LWVtb2ppLWtleWJvYXJkIChjYy1lbW9qaS1jbGlja2VkKT1cImFkZFJlYWN0aW9uKCRldmVudClcIlxuICAgIHNsb3Q9XCJjb250ZW50XCJcbiAgICBbZW1vamlLZXlib2FyZFN0eWxlXT1cImVtb2ppS2V5Ym9hcmRTdHlsZVwiPjwvY29tZXRjaGF0LWVtb2ppLWtleWJvYXJkPlxuPC9jb21ldGNoYXQtcG9wb3Zlcj5cbjxjb21ldGNoYXQtYmFja2Ryb3AgKm5nSWY9XCJvcGVuQ29uZmlybURpYWxvZ1wiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiJydcIiBbbWVzc2FnZVRleHRdPVwid2FybmluZ1RleHRcIlxuICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25Db25maXJtQ2xpY2soKVwiIFtjYW5jZWxCdXR0b25UZXh0XT1cImNhbmNlbFRleHRcIlxuICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJjb25maXJtVGV4dFwiIChjYy1jYW5jZWwtY2xpY2tlZCk9XCJvbkNhbmNlbENsaWNrKClcIlxuICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwiY29uZmlybURpYWxvZ1N0eWxlXCI+XG5cbiAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbjxjb21ldGNoYXQtZnVsbC1zY3JlZW4tdmlld2VyIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlSW1hZ2VJbkZ1bGxTY3JlZW4oKVwiXG4gICpuZ0lmPVwib3BlbkZ1bGxzY3JlZW5WaWV3XCIgW1VSTF09XCJpbWFnZXVybFRvT3BlblwiXG4gIFtjbG9zZUljb25VUkxdPVwiY2xvc2VJY29uVVJMXCIgW2Z1bGxTY3JlZW5WaWV3ZXJTdHlsZV09XCJmdWxsU2NyZWVuVmlld2VyU3R5bGVcIj5cblxuPC9jb21ldGNoYXQtZnVsbC1zY3JlZW4tdmlld2VyPlxuXG48IS0tIG9uZ29pbmcgY2FsbHNjcmVlbiBmb3IgZGlyZWN0IGNhbGwgLS0+XG48Y29tZXRjaGF0LW9uZ29pbmctY2FsbCAqbmdJZj1cInNob3dPbmdvaW5nQ2FsbFwiXG4gIFtjYWxsU2V0dGluZ3NCdWlsZGVyXT1cImdldENhbGxCdWlsZGVyKClcIiBbb25nb2luZ0NhbGxTdHlsZV09XCJvbmdvaW5nQ2FsbFN0eWxlXCJcbiAgW3Nlc3Npb25JRF09XCJzZXNzaW9uSWRcIj48L2NvbWV0Y2hhdC1vbmdvaW5nLWNhbGw+XG48IS0tIG1lc3NhZ2UgaW5mb3JtYXRpb24gdmlldyAtLT5cbjwhLS0gdGhyZWFkIGJ1YmJsZSB2aWV3IC0tPlxuPG5nLXRlbXBsYXRlICNtZXNzYWdlaW5mb0J1YmJsZSBsZXQtbWVzc2FnZT5cbiAgPGRpdiAqbmdJZj1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuICA8Y29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlICpuZ0lmPVwiIWdldEJ1YmJsZVdyYXBwZXIobWVzc2FnZSlcIlxuICAgIFtib3R0b21WaWV3XT1cImdldEJvdHRvbVZpZXcobWVzc2FnZSlcIlxuICAgIFtzdGF0dXNJbmZvVmlld109XCJnZXRTdGF0dXNJbmZvVmlldyhtZXNzYWdlKVwiXG4gICAgW2Zvb3RlclZpZXddPVwiZ2V0Rm9vdGVyVmlldyhtZXNzYWdlKVwiXG4gICAgW2xlYWRpbmdWaWV3XT1cInNob3dBdmF0YXIgPyBsZWFkaW5nVmlldyA6IG51bGxcIiBbaGVhZGVyVmlld109XCJidWJibGVIZWFkZXJcIlxuICAgIFtjb250ZW50Vmlld109XCJjb250ZW50Vmlld1wiIFtpZF09XCJtZXNzYWdlPy5nZXRJZCgpIHx8IG1lc3NhZ2U/LmdldE11aWQoKVwiXG4gICAgW21lc3NhZ2VCdWJibGVTdHlsZV09XCJzZXRNZXNzYWdlQnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgIFthbGlnbm1lbnRdPVwibWVzc2FnZUluZm9BbGlnbm1lbnRcIj5cbiAgICA8bmctdGVtcGxhdGUgI2NvbnRlbnRWaWV3PlxuICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldENvbnRlbnRWaWV3KG1lc3NhZ2UpO2NvbnRleHQ6eyAkaW1wbGljaXQ6IG1lc3NhZ2UgfVwiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8bmctdGVtcGxhdGUgI2xlYWRpbmdWaWV3PlxuICAgICAgPGRpdlxuICAgICAgICAqbmdJZj1cIiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiYgc2hvd0hlYWRlclRpdGxlKG1lc3NhZ2UpXCI+XG4gICAgICAgIDxjb21ldGNoYXQtYXZhdGFyIFtuYW1lXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXROYW1lKClcIlxuICAgICAgICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgICAgICAgW2ltYWdlXT1cIm1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRBdmF0YXIoKVwiPlxuICAgICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICA8L2Rpdj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxuZy10ZW1wbGF0ZSAjYnViYmxlSGVhZGVyPlxuICAgICAgPGRpdiAqbmdJZj1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7ZWxzZSBkZWZhdWx0SGVhZGVyXCI+XG4gICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImdldEhlYWRlclZpZXcobWVzc2FnZSk7Y29udGV4dDp7ICRpbXBsaWNpdDogbWVzc2FnZSB9XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRIZWFkZXI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWxpc3RfX2J1YmJsZS1oZWFkZXJcIlxuICAgICAgICAgICpuZ0lmPVwibWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBNZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmIHNob3dIZWFkZXJUaXRsZShtZXNzYWdlKSAmJiBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IE1lc3NhZ2VDYXRlZ29yeS5jYWxsXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbdGV4dF09XCJtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0TmFtZSgpXCJcbiAgICAgICAgICAgIFtsYWJlbFN0eWxlXT1cImxhYmVsU3R5bGVcIj48L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgW3BhdHRlcm5dPVwiZGF0ZVBhdHRlcm5cIlxuICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICBbZGF0ZVN0eWxlXT1cImdldEJ1YmJsZURhdGVTdHlsZShtZXNzYWdlKVwiXG4gICAgICAgICAgICAqbmdJZj1cInRpbWVzdGFtcEFsaWdubWVudCA9PSB0aW1lc3RhbXBFbnVtLnRvcCAmJiBtZXNzYWdlPy5nZXRTZW50QXQoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8L25nLXRlbXBsYXRlPlxuICA8L2NvbWV0Y2hhdC1tZXNzYWdlLWJ1YmJsZT5cblxuPC9uZy10ZW1wbGF0ZT5cbjxjb21ldGNoYXQtYmFja2Ryb3AgKm5nSWY9XCJvcGVuTWVzc2FnZUluZm9QYWdlXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y29tZXRjaGF0LW1lc3NhZ2UtaW5mb3JtYXRpb25cbiAgICBbY2xvc2VJY29uVVJMXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uY2xvc2VJY29uVVJMXCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmVycm9yU3RhdGVWaWV3XCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmxpc3RJdGVtU3R5bGVcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJtZXNzYWdlSW5mb3JtYXRpb25Db25maWd1cmF0aW9uLmVtcHR5U3RhdGVWaWV3XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5sb2FkaW5nSWNvblVSTFwiXG4gICAgW3JlYWRJY29uXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ucmVhZEljb25cIlxuICAgIFtkZWxpdmVyZWRJY29uXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uZGVsaXZlcmVkSWNvblwiXG4gICAgW29uRXJyb3JdPVwibWVzc2FnZUluZm9ybWF0aW9uQ29uZmlndXJhdGlvbi5vbkVycm9yXCJcbiAgICBbU3VidGl0bGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICBbcmVjZWlwdERhdGVQYXR0ZXJuXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ucmVjZWlwdERhdGVQYXR0ZXJuXCJcbiAgICBbbGlzdEl0ZW1WaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubGlzdEl0ZW1WaWV3IFwiXG4gICAgW21lc3NhZ2VJbmZvcm1hdGlvblN0eWxlXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ubWVzc2FnZUluZm9ybWF0aW9uU3R5bGVcIlxuICAgIFtvbkNsb3NlXT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24ub25DbG9zZSA/PyAgY2xvc2VNZXNzYWdlSW5mb1BhZ2VcIlxuICAgIFtidWJibGVWaWV3XT1cIm1lc3NhZ2VJbmZvcm1hdGlvbkNvbmZpZ3VyYXRpb24uYnViYmxlVmlldyA/PyBtZXNzYWdlaW5mb0J1YmJsZVwiXG4gICAgW21lc3NhZ2VdPVwibWVzc2FnZUluZm9PYmplY3RcIj5cblxuICA8L2NvbWV0Y2hhdC1tZXNzYWdlLWluZm9ybWF0aW9uPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG4iXX0=