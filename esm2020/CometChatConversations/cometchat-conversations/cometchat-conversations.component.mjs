import "@cometchat/uikit-elements";
import { AvatarStyle, BadgeStyle, ConfirmDialogStyle, DateStyle, ListItemStyle, ReceiptStyle, } from "@cometchat/uikit-elements";
import { CometChatSoundManager, CometChatUIKitUtility, ConversationUtils, ConversationsStyle, ListStyle, MessageReceiptUtils, } from "@cometchat/uikit-shared";
import { CometChatCallEvents, CometChatConversationEvents, CometChatGroupEvents, CometChatMessageEvents, CometChatUIKitConstants, CometChatUserEvents, DatePatterns, MessageStatus, SelectionMode, States, TitleAlignment, fontHelper, localize, MentionsTargetElement, } from "@cometchat/uikit-resources";
import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { CometChatUIKit } from "../../Shared/CometChatUIkit/CometChatUIKit";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "@angular/platform-browser";
import * as i3 from "../../CometChatList/cometchat-list.component";
import * as i4 from "@angular/common";
/**
 *
 * CometChatConversation is a wrapper component consists of CometChatListBaseComponent and ConversationListComponent.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export class CometChatConversationsComponent {
    constructor(ngZone, ref, themeService, sanitizer) {
        this.ngZone = ngZone;
        this.ref = ref;
        this.themeService = themeService;
        this.sanitizer = sanitizer;
        this.title = localize("CHATS"); //Title of the component
        this.searchPlaceHolder = localize("SEARCH"); // placeholder text of search input
        this.disableUsersPresence = false;
        this.disableReceipt = true;
        this.disableTyping = false;
        this.deliveredIcon = "assets/message-delivered.svg";
        this.readIcon = "assets/message-read.svg";
        this.errorIcon = "assets/warning-small.svg";
        this.datePattern = DatePatterns.DayDateTime;
        this.onError = (error) => {
            console.log(error);
        };
        this.sentIcon = "assets/message-sent.svg";
        this.privateGroupIcon = "assets/Private.svg";
        /**
         * @deprecated
         *
         * This property is deprecated as of version 4.3.7 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
         */
        this.protectedGroupIcon = "assets/Locked.svg";
        this.passwordGroupIcon = undefined;
        this.customSoundForMessages = "";
        this.activeConversation = null; //selected conversation
        this.searchIconURL = "assets/search.svg"; //image URL of the search icon
        this.hideSearch = true; //switch on/ff search input
        this.loadingIconURL = "assets/Spinner.svg";
        this.emptyStateText = localize("NO_CHATS_FOUND");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.titleAlignment = TitleAlignment.left;
        this.hideSeparator = false;
        this.searchPlaceholder = localize("SEARCH");
        this.hideError = false;
        this.selectionMode = SelectionMode.none;
        this.disableSoundForMessages = false;
        this.confirmDialogTitle = localize("DELETE_CONVERSATION");
        this.confirmButtonText = localize("DELETE");
        this.cancelButtonText = localize("CANCEL");
        this.confirmDialogMessage = localize("WOULD__YOU_LIKE_TO_DELETE_THIS_CONVERSATION");
        this.deleteConversationDialogStyle = {
            confirmButtonBackground: "",
            cancelButtonBackground: "",
            confirmButtonTextColor: "",
            confirmButtonTextFont: "",
            cancelButtonTextColor: "",
            cancelButtonTextFont: "",
            titleFont: "",
            titleColor: "",
            messageTextFont: "",
            messageTextColor: "",
            background: "",
            border: "1px solid #f2f2f2",
            height: "100%",
            width: "100%",
        };
        this.backdropStyle = {
            height: "100%",
            width: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
        };
        this.badgeStyle = {
            width: "25px",
            height: "15px",
            background: "#5aaeff",
            textColor: "white",
            textFont: "400 13px Inter, sans-serif",
            borderRadius: "16px",
        };
        this.dateStyle = {
            textFont: "400 11px Inter, sans-serif",
            textColor: "rgba(20, 20, 20, 0.58)",
        };
        this.conversationsStyle = {
            width: "",
            height: "",
            border: "",
            borderRadius: "",
        };
        this.listItemStyle = {
            height: "97%",
            width: "100%",
        };
        this.statusIndicatorStyle = {
            height: "10px",
            width: "10px",
            borderRadius: "16px",
        };
        this.typingIndicatorText = localize("IS_TYPING");
        this.threadIndicatorText = localize("IN_A_THREAD");
        this.avatarStyle = {};
        this.receiptStyle = {};
        this.iconStyle = {
            iconTint: "lightgrey",
            height: "20px",
            width: "20px",
        };
        this.listStyle = new ListStyle({});
        this.menustyle = {
            width: "",
            height: "",
            border: "none",
            borderRadius: "8px",
            background: "transparent",
            textFont: "",
            textColor: "black",
            iconTint: "grey",
            iconBackground: "transparent",
            iconBorder: "none",
            iconBorderRadius: "0",
            submenuWidth: "70px",
            submenuHeight: "20px",
            submenuBorder: "1px solid #e8e8e8",
            submenuBorderRadius: "8px",
            submenuBackground: "white",
        };
        this.typingListenerId = "conversation__LISTENER" + new Date().getTime();
        this.callListenerId = "call_" + new Date().getTime();
        this.connectionListenerId = "connection_" + new Date().getTime();
        this.selectionmodeEnum = SelectionMode;
        this.isDialogOpen = false;
        this.isEmpty = false;
        this.isLoading = true;
        this.state = States.loading;
        this.statusColor = {
            online: "",
            private: "",
            password: "#F7A500",
            public: "",
        };
        this.limit = 30;
        this.isError = false;
        this.conversationList = [];
        this.scrolledToBottom = false;
        this.checkItemChange = false;
        this.showConfirmDialog = false;
        this.conversationToBeDeleted = null;
        this.userListenerId = "chatlist_user_" + new Date().getTime();
        this.groupListenerId = "chatlist_group_" + new Date().getTime();
        this.groupToUpdate = {};
        this.conversationType = undefined;
        this.enablePolls = false;
        this.enableStickers = false;
        this.enableWhiteboard = false;
        this.enableDocument = false;
        this.threadIconURL = "assets/thread-arrow.svg";
        this.confirmDialogStyle = {
            height: "100%",
            width: "100%",
            borderRadius: "8px",
        };
        this.modalStyle = {
            height: "230px",
            width: "270px",
        };
        this.firstReload = false;
        this.isActive = true;
        this.contactsNotFound = false;
        /**
         * Properties for internal use
         */
        this.localize = localize;
        //To be enabled in UMC
        // @Input() mentionsIconURL!: string;
        this.disableMentions = false;
        /**
         * Properties for internal use
         */
        /**
         * passing this callback to menuList component on delete click
         * @param  {CometChat.Conversation} conversation
         */
        this.deleteConversationOnClick = () => {
            this.showConfirmationDialog(this.conversationToBeDeleted);
        };
        // callback for confirmDialogComponent
        this.onConfirmClick = () => {
            this.deleteSelectedConversation();
        };
        this.setStatusIndicatorStyle = (conversation) => {
            if (conversation.getConversationType() ==
                CometChatUIKitConstants.MessageReceiverType.group) {
                return {
                    height: "12px",
                    width: "12px",
                    borderRadius: "16px",
                };
            }
            else {
                return this.statusIndicatorStyle;
            }
        };
        this.setSubtitle = (conversationObject) => {
            if (this.typingIndicator) {
                const isTyping = conversationObject?.conversationWith?.guid ==
                    this.typingIndicator.getReceiverId();
                if (isTyping) {
                    return `${this.typingIndicator.getSender().getName()} ${this.typingIndicatorText}`;
                }
                else if (conversationObject?.conversationWith?.uid ==
                    this.typingIndicator?.getSender().getUid() &&
                    this.typingIndicator.getReceiverType() !==
                        CometChatUIKitConstants.MessageReceiverType.group) {
                    return this.typingIndicatorText;
                }
            }
            let subtitle = ChatConfigurator.getDataSource().getLastConversationMessage(conversationObject, this.loggedInUser, {
                disableMentions: this.disableMentions,
                theme: this.themeService.theme,
                mentionsTargetElement: MentionsTargetElement.conversation,
                textFormatters: this.textFormatters
            });
            let icon = conversationObject?.getLastMessage()?.getType() ==
                CometChatUIKitConstants.MessageTypes.audio
                ? "📞 "
                : "📹 ";
            return this.sanitizer.bypassSecurityTrustHtml(conversationObject?.getLastMessage()?.getCategory() ==
                CometChatUIKitConstants.MessageCategory.call
                ? icon + subtitle
                : subtitle);
        };
        // callback for confirmDialogComponent
        this.onCancelClick = () => {
            this.isDialogOpen = false;
            this.conversationToBeDeleted = null;
            this.ref.detectChanges();
        };
        this.getMessageReceipt = (conversation) => {
            let receipt = MessageReceiptUtils.getReceiptStatus(conversation.getLastMessage());
            return receipt;
        };
        this.optionsStyle = {
            background: "transparent",
            border: "none",
        };
        /**
         * Fetches Conversations Details with all the users
         */
        this.getConversation = (states = States.loading) => {
            if (this.requestBuilder &&
                this.requestBuilder.pagination &&
                (this.requestBuilder.pagination.current_page == 0 ||
                    this.requestBuilder.pagination.current_page !=
                        this.requestBuilder.pagination.total_pages)) {
                try {
                    this.state = states;
                    CometChat.getLoggedinUser()
                        .then((user) => {
                        this.loggedInUser = user;
                        this.fetchNextConversation()
                            .then((conversationList) => {
                            conversationList.forEach((conversation) => {
                                if (this.activeConversation &&
                                    this.activeConversation !== null &&
                                    this.activeConversation.getConversationType() ===
                                        conversation.getConversationType()) {
                                    if (this.activeConversation.getConversationId() ==
                                        conversation.getConversationId()) {
                                        conversation.setUnreadMessageCount(0);
                                        //conversation.setUnreadMentionInMessageCount(0);
                                    }
                                }
                            });
                            if (states == States.loaded) {
                                this.conversationList = [...conversationList];
                            }
                            else {
                                this.conversationList = [
                                    ...this.conversationList,
                                    ...conversationList,
                                ];
                            }
                            if (conversationList.length <= 0 &&
                                this.conversationList?.length <= 0) {
                                this.ngZone.run(() => {
                                    if (this.state != States.empty) {
                                        this.state = States.empty;
                                        this.ref.detectChanges();
                                    }
                                    this.ref.detach(); // Detach the change detector
                                });
                            }
                            else {
                                this.ngZone.run(() => {
                                    this.ref.detectChanges();
                                    if (this.state != States.loaded) {
                                        this.state = States.loaded;
                                        this.ref.detectChanges();
                                    }
                                    this.ref.detach(); // Detach the change detector
                                });
                            }
                            if (this.firstReload) {
                                this.attachConnectionListeners();
                                this.firstReload = false;
                            }
                        })
                            .catch((error) => {
                            if (this.onError) {
                                this.onError(error);
                            }
                            if (this.conversationList?.length <= 0) {
                                this.state = States.error;
                                this.ref.detectChanges();
                            }
                        });
                    })
                        .catch((error) => {
                        if (this.onError) {
                            this.onError(error);
                        }
                        this.state = States.error;
                        this.ref.detectChanges();
                    });
                }
                catch (error) {
                    if (this.onError) {
                        this.onError(CometChatException(error));
                    }
                }
            }
        };
        /**
         * Updates the conversation list's last message , badgeCount , user presence based on activities propagated by listeners
         */
        this.conversationUpdated = (key, item = null, message, options = null) => {
            try {
                switch (key) {
                    case CometChatUIKitConstants.userStatusType.online:
                    case CometChatUIKitConstants.userStatusType.offline: {
                        this.updateUser(item);
                        break;
                    }
                    case CometChatUIKitConstants.messages.MESSAGE_READ: {
                        this.updateConversation(message, false);
                        break;
                    }
                    case CometChatUIKitConstants.messages.MESSAGE_DELIVERED: {
                        this.updateConversation(message, false);
                        break;
                    }
                    case CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED:
                    case CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED:
                    case CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED:
                    case CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED:
                        if (!this.disableReceipt) {
                            this.markMessageAsDelivered(message);
                        }
                        this.updateConversation(message);
                        break;
                    case CometChatUIKitConstants.groupMemberAction.ADDED:
                    case CometChatUIKitConstants.groupMemberAction.BANNED:
                    case CometChatUIKitConstants.groupMemberAction.JOINED:
                    case CometChatUIKitConstants.groupMemberAction.KICKED:
                    case CometChatUIKitConstants.groupMemberAction.LEFT:
                    case CometChatUIKitConstants.groupMemberAction.UNBANNED:
                    case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
                        this.updateConversation(message);
                        break;
                    case CometChatUIKitConstants.messages.MESSAGE_EDITED:
                    case CometChatUIKitConstants.messages.MESSAGE_DELETED:
                        this.conversationEditedDeleted(message);
                        break;
                }
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        };
        /**
         * @param  {CometChat.BaseMessage} message
         */
        this.markMessageAsDelivered = (message) => {
            //if chat window is not open, mark message as delivered
            if (this.activeConversation?.getConversationType() ==
                CometChatUIKitConstants.MessageReceiverType.user) {
                if ((!this.activeConversation ||
                    this.activeConversation?.getConversationWith()?.getUid() !== message?.getSender()?.getUid()) &&
                    !message.hasOwnProperty("deliveredAt")) {
                    CometChat.markAsDelivered(message);
                }
            }
            else {
                if ((!this.activeConversation ||
                    this.activeConversation?.getConversationWith()?.getGuid() !== message?.getReceiverId()) &&
                    !message.hasOwnProperty("deliveredAt")) {
                    CometChat.markAsDelivered(message);
                }
            }
        };
        /**
         * @param  {CometChat.BaseMessage} readMessage
         */
        this.getUinx = () => {
            return String(Math.round(+new Date() / 1000));
        };
        /**
         * showing dialog for confirm and cancel
         * @param  {CometChat.Conversation|{}} conversation
         */
        this.showConfirmationDialog = (conversation) => {
            this.isDialogOpen = true;
            this.conversationToBeDeleted = conversation;
            this.ref.detectChanges();
        };
        this.styles = {
            wrapperStyle: () => {
                return {
                    height: this.conversationsStyle.height,
                    width: this.conversationsStyle.width,
                    border: this.conversationsStyle.border ||
                        `1px solid ${this.themeService.theme.palette.getAccent400()}`,
                    borderRadius: this.conversationsStyle.borderRadius,
                    background: this.conversationsStyle.background ||
                        this.themeService.theme.palette.getBackground(),
                };
            },
        };
        this.subtitleStyle = (conversation) => {
            if (this.typingIndicator &&
                ((this.typingIndicator.getReceiverType() ==
                    CometChatUIKitConstants.MessageReceiverType.user &&
                    this.typingIndicator.getSender().getUid() ==
                        conversation.conversationWith?.uid) ||
                    this.typingIndicator.getReceiverId() ==
                        conversation.conversationWith?.guid)) {
                return {
                    font: this.conversationsStyle.typingIndictorTextColor,
                    color: this.conversationsStyle.typingIndictorTextColor,
                };
            }
            return {
                font: this.conversationsStyle.lastMessageTextFont,
                color: this.conversationsStyle.lastMessageTextColor,
            };
        };
        this.itemThreadIndicatorStyle = () => {
            return {
                textFont: this.conversationsStyle.threadIndicatorTextFont ||
                    fontHelper(this.themeService.theme.typography.caption2),
                textColor: this.conversationsStyle.threadIndicatorTextColor ||
                    this.themeService.theme.palette.getAccent400(),
            };
        };
    }
    onConversationSelected(conversation, event) {
        let selected = event.detail.checked;
        if (this.onSelect) {
            this.onSelect(conversation, selected);
        }
    }
    //To be enabled in UMC
    // getMentionIconStyle(): IconStyle {
    //   return new IconStyle({
    //     height: "16px",
    //     width: "16px",
    //     iconTint:
    //     this.conversationsStyle?.mentionIconTint ??
    //     this.themeService.theme.palette.getPrimary(),
    //   });
    // }
    /**
     * @param  {CometChat.Conversation} conversation
     */
    checkStatusType(conversation) {
        let user = conversation.getConversationWith();
        if (conversation.getConversationType() ==
            CometChatUIKitConstants.MessageReceiverType.user &&
            !this.disableUsersPresence) {
            if (user.getStatus() === CometChatUIKitConstants.userStatusType.online) {
                return this.statusColor[user.getStatus()];
            }
            else
                return null;
        }
        else if (conversation.getConversationType() ==
            CometChatUIKitConstants.MessageReceiverType.group) {
            let group = conversation.getConversationWith();
            return this.statusColor[group.getType()];
        }
    }
    getExtensionData(messageObject) {
        let messageText;
        //xss extensions data
        const xssData = CometChatUIKitUtility.checkMessageForExtensionsData(messageObject, "xss-filter");
        if (xssData &&
            CometChatUIKitUtility.checkHasOwnProperty(xssData, "sanitized_text") &&
            CometChatUIKitUtility.checkHasOwnProperty(xssData, "hasXSS") &&
            xssData.hasXSS === "yes") {
            messageText = xssData.sanitized_text;
        }
        //datamasking extensions data
        const maskedData = CometChatUIKitUtility.checkMessageForExtensionsData(messageObject, "data-masking");
        if (maskedData &&
            CometChatUIKitUtility.checkHasOwnProperty(maskedData, "data") &&
            CometChatUIKitUtility.checkHasOwnProperty(maskedData.data, "sensitive_data") &&
            CometChatUIKitUtility.checkHasOwnProperty(maskedData.data, "message_masked") &&
            maskedData.data.sensitive_data === "yes") {
            messageText = maskedData.data.message_masked;
        }
        //profanity extensions data
        const profaneData = CometChatUIKitUtility.checkMessageForExtensionsData(messageObject, "profanity-filter");
        if (profaneData &&
            CometChatUIKitUtility.checkHasOwnProperty(profaneData, "profanity") &&
            CometChatUIKitUtility.checkHasOwnProperty(profaneData, "message_clean") &&
            profaneData.profanity === "yes") {
            messageText = profaneData.message_clean;
        }
        return messageText || messageObject.text;
    }
    //To be enabled in UMC
    // getUnreadMentionsIconStyle() {
    //   return {
    //     paddingRight: "3px",
    //   };
    // }
    checkGroupType(conversation) {
        let image = "";
        if (conversation.getConversationType() ==
            CometChatUIKitConstants.MessageReceiverType.group) {
            let group = conversation.getConversationWith();
            switch (group.getType()) {
                case CometChatUIKitConstants.GroupTypes.password:
                    image = this.passwordGroupIcon || this.protectedGroupIcon;
                    break;
                case CometChatUIKitConstants.GroupTypes.private:
                    image = this.privateGroupIcon;
                    break;
                default:
                    image = "";
                    break;
            }
        }
        return image;
    }
    getDate() {
        return this.datePattern ?? DatePatterns.DayDateTime;
    }
    ngOnInit() {
        this.firstReload = true;
        if (!this.conversationsRequestBuilder) {
            this.conversationsRequestBuilder =
                new CometChat.ConversationsRequestBuilder()
                    .setLimit(this.limit);
        }
        this.setConversationOptions();
        this.setThemeStyle();
        this.subscribeToEvents();
        this.attachListeners(this.conversationUpdated);
        this.requestBuilder = this.conversationsRequestBuilder.build();
        if (this.requestBuilder?.getConversationType()) {
            this.conversationType = this.requestBuilder.getConversationType();
        }
        this.getConversation();
    }
    /**
    * Determines if the last message should trigger an update based on its category and type.
    *
    * @param message - The last message sent or received in the conversation.
    * @returns {boolean} - Returns true if the message should trigger an update, false otherwise.
    */
    checkIfLastMessageShouldUpdate(message) {
        if (this.conversationType && this.conversationType != message.getReceiverType()) {
            return false;
        }
        // Checking if the message is a custom message
        let isCustomMessage = message?.getCategory() === CometChatUIKitConstants.MessageCategory.custom;
        // Check if the message is a reply to another message
        if (message?.getParentMessageId() && !CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnMessageReplies()) {
            return false;
        }
        if (isCustomMessage) {
            if (message?.getParentMessageId() && CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnMessageReplies() && this.shouldIncrementForCustomMessage(message)) {
                return true;
            }
            return this.shouldIncrementForCustomMessage(message);
        }
        // Check if the message is an action message
        if (message?.getCategory() === CometChatUIKitConstants.MessageCategory.action) {
            // Check if the message is a group member action
            if (message?.getType() === CometChatUIKitConstants.MessageTypes.groupMember) {
                return CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnGroupActions();
            }
            // By default, action messages should trigger an update
            return true;
        }
        // Check if the message is a call (either audio or video)
        if (message?.getCategory() === CometChatUIKitConstants.MessageCategory.call &&
            (message?.getType() === CometChatUIKitConstants.MessageTypes.audio ||
                message.getType() === CometChatUIKitConstants.MessageTypes.video)) {
            return CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnCallActivities();
        }
        // By default, messages should trigger an update
        return true;
    }
    shouldIncrementForCustomMessage(message) {
        const metadata = message.getMetadata();
        // Checking if the custom message should increment the unread message counter
        return message.willUpdateConversation()
            || (metadata && metadata.hasOwnProperty("incrementUnreadCount") && metadata.incrementUnreadCount) || CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnCustomMessages();
    }
    attachConnectionListeners() {
        CometChat.addConnectionListener(this.connectionListenerId, new CometChat.ConnectionListener({
            onConnected: () => {
                console.log("ConnectionListener =>connected");
                this.fetchNewConversations();
            },
            inConnecting: () => {
                console.log("ConnectionListener => In connecting");
            },
            onDisconnected: () => {
                console.log("ConnectionListener => On Disconnected");
            },
        }));
    }
    updateConversationObject(conversation) {
        if (conversation.getLastMessage() && this.checkIfLastMessageShouldUpdate(conversation.getLastMessage())) {
            let index = this.conversationList.findIndex((element) => element.getConversationId() == conversation.getConversationId());
            this.conversationList.splice(index, 1, conversation);
            this.ref.detectChanges();
        }
    }
    subscribeToEvents() {
        if (!this.conversationType || this.conversationType == CometChatUIKitConstants.MessageReceiverType.group) {
            this.ccGroupMemberScopeChanged =
                CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((item) => {
                    let conversation = this.getConversationFromGroup(item.group);
                    if (conversation) {
                        conversation.setLastMessage(item.message);
                        this.updateConversationObject(conversation);
                    }
                });
            this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item) => {
                let group = item.userAddedIn;
                let actionMessage = item.messages;
                let conversation = this.getConversationFromGroup(item.userAddedIn);
                conversation?.setConversationWith(group);
                conversation?.setLastMessage(actionMessage[actionMessage?.length - 1]);
                this.updateConversationObject(conversation);
            });
            this.ccGroupMemberKicked =
                CometChatGroupEvents.ccGroupMemberKicked.subscribe((item) => {
                    let conversation = this.getConversationFromGroup(item.kickedFrom);
                    if (conversation) {
                        conversation.setLastMessage(item.message);
                        this.updateConversationObject(conversation);
                    }
                });
            this.ccGroupMemberBanned =
                CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
                    let conversation = this.getConversationFromGroup(item.kickedFrom);
                    if (conversation) {
                        conversation.setLastMessage(item.message);
                        this.updateConversationObject(conversation);
                    }
                });
            this.ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe((item) => {
                let conversation = this.getConversationFromGroup(item);
                if (conversation) {
                    this.removeConversation(conversation);
                }
            });
            this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item) => {
                let conversationKey = this.conversationList.findIndex((c) => c?.getConversationType() ===
                    CometChatUIKitConstants.MessageReceiverType.group &&
                    c?.getConversationWith().getGuid() ==
                        item.leftGroup.getGuid());
                if (conversationKey >= 0) {
                    let conversation = this.conversationList[conversationKey];
                    this.removeConversation(conversation);
                    if (this.activeConversation &&
                        this.activeConversation?.getConversationId() ==
                            conversation?.getConversationId()) {
                        this.activeConversation = null;
                    }
                }
            });
        }
        if (!this.conversationType || this.conversationType == CometChatUIKitConstants.MessageReceiverType.user) {
            this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((item) => {
                let conversation = this.getConversationFromUser(item);
                if (conversation) {
                    this.removeConversation(conversation);
                }
            });
        }
        this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object) => {
            if (!this.conversationType || this.conversationType == object?.message?.getReceiverType()) {
                let message = object.message;
                if (object.status == MessageStatus.success) {
                    this.updateEditedMessage(message);
                }
            }
        });
        this.ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe((obj) => {
            let message = obj.message;
            if (obj.status == MessageStatus.success) {
                this.updateConversation(message, false);
            }
        });
        this.ccMessageDelete = CometChatMessageEvents.ccMessageDeleted.subscribe((messageObject) => {
            this.updateConversation(messageObject);
            this.ref.detectChanges();
        });
        this.ccMessageRead = CometChatMessageEvents.ccMessageRead.subscribe((messageObject) => {
            if (!this.conversationType || this.conversationType == messageObject.getReceiverType()) {
                CometChat.CometChatHelper.getConversationFromMessage(messageObject).then((conversation) => {
                    if (conversation &&
                        this.activeConversation &&
                        conversation?.getConversationId() ==
                            this.activeConversation?.getConversationId()) {
                        this.updateEditedMessage(messageObject);
                        this.resetUnreadCount();
                    }
                });
            }
        });
        this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call) => {
            if (call && Object.keys(call).length > 0) {
                this.updateConversation(call);
            }
        });
        this.ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe((call) => {
            this.updateConversation(call);
        });
        this.ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe((call) => {
            this.updateConversation(call);
        });
        this.ccCallAccepted = CometChatCallEvents.ccCallAccepted.subscribe((call) => {
            this.updateConversation(call);
        });
    }
    unsubscribeToEvents() {
        this.ccGroupMemberAdded?.unsubscribe();
        this.ccGroupMemberKicked?.unsubscribe();
        this.ccGroupMemberBanned?.unsubscribe();
        this.ccMessageEdit?.unsubscribe();
        this.ccMessageSent?.unsubscribe();
        this.ccMessageEdited?.unsubscribe();
        this.ccMessageDelete?.unsubscribe();
        this.ccGroupDeleted?.unsubscribe();
        this.ccGroupLeft?.unsubscribe();
        this.ccUserBlocked?.unsubscribe();
        this.ccMessageRead?.unsubscribe();
    }
    getConversationFromUser(user) {
        let index = this.conversationList.findIndex((element) => element.getConversationType() ==
            CometChatUIKitConstants.MessageReceiverType.user &&
            element.getConversationWith().getUid() ==
                user.getUid());
        if (index >= 0) {
            return this.conversationList[index];
        }
        return null;
    }
    getConversationFromGroup(group) {
        let index = this.conversationList.findIndex((element) => element.getConversationType() ==
            CometChatUIKitConstants.MessageReceiverType.group &&
            element.getConversationWith().getGuid() ==
                group.getGuid());
        if (index >= 0) {
            return this.conversationList[index];
        }
        return null;
    }
    ngOnChanges(change) {
        try {
            if (change["activeConversation"]) {
                this.resetUnreadCount();
                this.ref.detectChanges();
            }
            if (change["conversationsStyle"]) {
                this.setThemeStyle();
            }
            /**
             * When user sends message conversationList is updated with latest message
             */
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    ngOnDestroy() {
        try {
            this.removeListeners();
            this.unsubscribeToEvents();
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        this.ref.detectChanges();
    }
    // getting default conversation option and adding callback in it
    setConversationOptions() {
        if (this.options) {
            return;
        }
        this.conversationOptions = ConversationUtils.getDefaultOptions();
        this.conversationOptions.forEach((element) => {
            if (!element.onClick &&
                element.id == CometChatUIKitConstants.ConversationOptions.delete) {
                element.onClick = this.deleteConversationOnClick;
            }
        });
        return;
    }
    // reset unread count
    onClick(conversation) {
        if (this.onItemClick) {
            this.onItemClick(conversation);
        }
    }
    // set unread count
    resetUnreadCount() {
        if (this.activeConversation) {
            const conversationlist = [
                ...this.conversationList,
            ];
            //Gets the index of user which comes offline/online
            const conversationKey = conversationlist.findIndex((conversationObj) => conversationObj?.getConversationId() ===
                this.activeConversation?.getConversationId());
            if (conversationKey > -1) {
                let conversationObj = conversationlist[conversationKey];
                let newConversationObj = conversationObj;
                newConversationObj.setUnreadMessageCount(0);
                //newConversationObj.setUnreadMentionInMessageCount(0);
                newConversationObj.getLastMessage()?.setMuid(this.getUinx());
                conversationlist.splice(conversationKey, 1, newConversationObj);
                this.conversationList = [...conversationlist];
                this.ref.detectChanges();
            }
        }
    }
    // sets property from theme to style object
    setThemeStyle() {
        this.setAvatarStyle();
        this.setBadgeStyle();
        this.setConfirmDialogStyle();
        this.setConversationsStyle();
        this.setListItemStyle();
        this.setDateStyle();
        this.setStatusStyle();
        this.setReceiptStyle();
        this.statusColor.private =
            this.conversationsStyle?.privateGroupIconBackground;
        this.statusColor.online = this.conversationsStyle?.onlineStatusColor;
        this.statusColor.password =
            this.conversationsStyle?.passwordGroupIconBackground;
        this.listStyle = {
            titleTextFont: this.conversationsStyle.titleTextFont,
            titleTextColor: this.conversationsStyle.titleTextColor,
            emptyStateTextFont: this.conversationsStyle.emptyStateTextFont,
            emptyStateTextColor: this.conversationsStyle.emptyStateTextColor,
            errorStateTextFont: this.conversationsStyle.errorStateTextFont,
            errorStateTextColor: this.conversationsStyle.errorStateTextColor,
            loadingIconTint: this.conversationsStyle.loadingIconTint,
            separatorColor: this.conversationsStyle.separatorColor,
        };
        this.iconStyle.iconTint = this.themeService.theme.palette.getAccent400();
    }
    setListItemStyle() {
        let defaultStyle = new ListItemStyle({
            height: "97%",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            activeBackground: this.themeService.theme.palette.getAccent50(),
            borderRadius: "0",
            titleFont: fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.themeService.theme.palette.getAccent(),
            border: "none",
            separatorColor: this.themeService.theme.palette.getAccent200(),
            hoverBackground: this.themeService.theme.palette.getAccent50(),
        });
        this.listItemStyle = { ...defaultStyle, ...this.listItemStyle };
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "36px",
            height: "36px",
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
    setStatusStyle() {
        let defaultStyle = {
            height: "12px",
            width: "12px",
            border: "none",
            borderRadius: "24px",
        };
        this.statusIndicatorStyle = {
            ...defaultStyle,
            ...this.statusIndicatorStyle,
        };
    }
    setConversationsStyle() {
        let defaultStyle = new ConversationsStyle({
            lastMessageTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            lastMessageTextColor: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
            titleTextFont: fontHelper(this.themeService.theme.typography.title1),
            titleTextColor: this.themeService.theme.palette.getAccent(),
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            onlineStatusColor: this.themeService.theme.palette.getSuccess(),
            separatorColor: this.themeService.theme.palette.getAccent400(),
            privateGroupIconBackground: this.themeService.theme.palette.getSuccess(),
            passwordGroupIconBackground: "RGB(247, 165, 0)",
            typingIndictorTextColor: this.themeService.theme.palette.getPrimary(),
            typingIndictorTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            threadIndicatorTextFont: fontHelper(this.themeService.theme.typography.caption2),
            threadIndicatorTextColor: this.themeService.theme.palette.getAccent600(),
        });
        this.conversationsStyle = { ...defaultStyle, ...this.conversationsStyle };
    }
    setDateStyle() {
        let defaultStyle = new DateStyle({
            textFont: fontHelper(this.themeService.theme.typography.caption2),
            textColor: this.themeService.theme.palette.getAccent600(),
            background: "transparent",
        });
        this.dateStyle = { ...defaultStyle, ...this.dateStyle };
    }
    setReceiptStyle() {
        let defaultStyle = new ReceiptStyle({
            waitIconTint: this.themeService.theme.palette.getAccent700(),
            sentIconTint: this.themeService.theme.palette.getAccent600(),
            deliveredIconTint: this.themeService.theme.palette.getAccent600(),
            readIconTint: this.themeService.theme.palette.getPrimary(),
            errorIconTint: this.themeService.theme.palette.getError(),
            height: "20px",
            width: "20px",
            background: "transparent"
        });
        this.receiptStyle = { ...defaultStyle, ...this.receiptStyle };
    }
    setBadgeStyle() {
        let defaultStyle = new BadgeStyle({
            textFont: fontHelper(this.themeService.theme.typography.subtitle2),
            textColor: this.themeService.theme.palette.getAccent("dark"),
            background: this.themeService.theme.palette.getPrimary(),
            height: "16px",
            borderRadius: "16px",
            width: "24px",
        });
        this.badgeStyle = { ...defaultStyle, ...this.badgeStyle };
    }
    setConfirmDialogStyle() {
        let defaultStyle = new ConfirmDialogStyle({
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
            width: "350px",
            borderRadius: "8px",
        });
        this.deleteConversationDialogStyle = {
            ...defaultStyle,
            ...this.deleteConversationDialogStyle,
        };
    }
    // checking if user has his own configuration else will use default configuration
    /**
     * @param  {Object={}} config
     * @param  {Object} defaultConfig?
     * @returns defaultConfig
     */
    // calling subtitle callback from configurations
    /**
     * @param  {CometChat.Conversation} conversation
     */
    /**
     * Fetches the coversation based on the conversationRequest config
     */
    fetchNextConversation() {
        try {
            return this.requestBuilder.fetchNext();
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    updateEditedMessage(message) {
        let index = this.conversationList.findIndex((conversationObj) => conversationObj.getLastMessage() &&
            conversationObj.getLastMessage().getId() ==
                message?.getId());
        if (index >= 0) {
            this.conversationEditedDeleted(message);
        }
    }
    /**
     * attaches Listeners for user activity , group activities and calling
     * @param callback
     */
    /**
     * @param  {Function} callback
     */
    attachListeners(callback) {
        try {
            if (!this.disableUsersPresence && (!this.conversationType || this.conversationType == CometChatUIKitConstants.MessageReceiverType.user)) {
                CometChat.addUserListener(this.userListenerId, new CometChat.UserListener({
                    onUserOnline: (onlineUser) => {
                        /* when someuser/friend comes online, user will be received here */
                        callback(CometChatUIKitConstants.userStatusType.online, onlineUser);
                    },
                    onUserOffline: (offlineUser) => {
                        /* when someuser/friend went offline, user will be received here */
                        callback(CometChatUIKitConstants.userStatusType.offline, offlineUser);
                    },
                }));
            }
            if (!this.conversationType || this.conversationType == CometChatUIKitConstants.MessageReceiverType.group) {
                CometChat.addGroupListener(this.groupListenerId, new CometChat.GroupListener({
                    onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                        this.updateConversation(message);
                    },
                    onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                        if (this.loggedInUser?.getUid() === kickedUser.getUid()) {
                            this.removeConversationFromMessage(kickedFrom);
                        }
                        else {
                            this.updateConversation(message);
                        }
                    },
                    onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                        if (this.loggedInUser?.getUid() === bannedUser.getUid()) {
                            this.removeConversationFromMessage(bannedFrom);
                        }
                        else {
                            this.updateConversation(message);
                        }
                    },
                    onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                        this.updateConversation(message);
                    },
                    onGroupMemberLeft: (message, leavingUser, group) => {
                        this.updateConversation(message);
                    },
                    onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                        this.updateConversation(message);
                    },
                }));
            }
            CometChat.addCallListener(this.callListenerId, new CometChat.CallListener({
                onIncomingCallReceived: (call) => {
                    this.updateConversation(call);
                },
                onIncomingCallCancelled: (call) => {
                    this.updateConversation(call);
                },
                onOutgoingCallRejected: (call) => {
                    this.updateConversation(call);
                },
                onOutgoingCallAccepted: (call) => {
                    this.updateConversation(call);
                },
                onCallEndedMessageReceived: (call) => {
                    this.updateConversation(call);
                },
            }));
            // SDK listeners
            this.onTextMessageReceived =
                CometChatMessageEvents.onTextMessageReceived.subscribe((textMessage) => {
                    callback(CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED, null, textMessage);
                });
            this.onMediaMessageReceived =
                CometChatMessageEvents.onMediaMessageReceived.subscribe((mediaMessage) => {
                    callback(CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED, null, mediaMessage);
                });
            this.onCustomMessageReceived =
                CometChatMessageEvents.onCustomMessageReceived.subscribe((customMessage) => {
                    callback(CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED, null, customMessage);
                });
            this.onFormMessageReceived =
                CometChatMessageEvents.onFormMessageReceived.subscribe((formMessage) => {
                    callback(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, null, formMessage);
                });
            this.onSchedulerMessageReceived =
                CometChatMessageEvents.onSchedulerMessageReceived.subscribe((formMessage) => {
                    callback(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, null, formMessage);
                });
            this.onCardMessageReceived =
                CometChatMessageEvents.onCardMessageReceived.subscribe((cardMessage) => {
                    callback(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, null, cardMessage);
                });
            this.onCustomInteractiveMessageReceived =
                CometChatMessageEvents.onCustomInteractiveMessageReceived.subscribe((customMessage) => {
                    callback(CometChatUIKitConstants.messages.INTERACTIVE_MESSAGE_RECEIVED, null, customMessage);
                });
            this.onMessagesRead = CometChatMessageEvents.onMessagesRead.subscribe((messageReceipt) => {
                if (!this.disableReceipt && (!this.conversationType || this.conversationType == messageReceipt.getReceiverType())) {
                    this.markAsRead(messageReceipt);
                }
            });
            this.onMessageDeleted = CometChatMessageEvents.onMessageDeleted.subscribe((deletedMessage) => {
                callback(CometChatUIKitConstants.messages.MESSAGE_DELETED, null, deletedMessage);
            });
            this.onMessageEdited = CometChatMessageEvents.onMessageEdited.subscribe((editedMessage) => {
                callback(CometChatUIKitConstants.messages.MESSAGE_EDITED, null, editedMessage);
            });
            this.onMessagesDelivered =
                CometChatMessageEvents.onMessagesDelivered.subscribe((messageReceipt) => {
                    if (!this.disableReceipt && (!this.conversationType || this.conversationType == messageReceipt?.getReceiverType())) {
                        this.updateDeliveredMessage(messageReceipt);
                    }
                });
            this.onTypingStarted = CometChatMessageEvents.onTypingStarted.subscribe((typingIndicator) => {
                if (!this.conversationType || this.conversationType == typingIndicator?.getReceiverType()) {
                    if (!this.disableTyping) {
                        this.typingIndicator = typingIndicator;
                        this.ref.detectChanges();
                    }
                }
            });
            this.onTypingEnded = CometChatMessageEvents.onTypingEnded.subscribe((typingIndicator) => {
                if (!this.conversationType || this.conversationType == typingIndicator?.getReceiverType()) {
                    this.typingIndicator = null;
                    this.ref.detectChanges();
                }
            });
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    fetchNewConversations() {
        this.requestBuilder = this.conversationsRequestBuilder.build();
        if (this.requestBuilder?.getConversationType()) {
            this.conversationType = this.requestBuilder.getConversationType();
        }
        this.conversationList = [];
        this.getConversation(States.loaded);
    }
    removeConversationFromMessage(group) {
        let conversation = this.getConversationFromGroup(group);
        if (conversation) {
            this.updateConversationList(conversation);
        }
    }
    /**
     * Removes all listeners
     */
    removeListeners() {
        try {
            CometChat.removeUserListener(this.userListenerId);
            CometChat.removeGroupListener(this.groupListenerId);
            CometChat.removeConnectionListener(this.connectionListenerId);
            this.onTextMessageReceived?.unsubscribe();
            this.onMediaMessageReceived?.unsubscribe();
            this.onCustomMessageReceived?.unsubscribe();
            this.onFormMessageReceived?.unsubscribe();
            this.onSchedulerMessageReceived?.unsubscribe();
            this.onCardMessageReceived?.unsubscribe();
            this.onCustomInteractiveMessageReceived?.unsubscribe();
            this.onMessagesRead?.unsubscribe();
            this.onMessageDeleted?.unsubscribe();
            this.onMessageEdited?.unsubscribe();
            this.onMessagesDelivered?.unsubscribe();
            this.onTypingStarted?.unsubscribe();
            this.onTypingEnded?.unsubscribe();
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    isReceiptDisable(conversation) {
        let item = conversation.getConversationWith();
        let message = conversation.getLastMessage();
        if (!this.disableReceipt &&
            message &&
            !message?.getDeletedAt() &&
            message?.getCategory() !=
                CometChatUIKitConstants.MessageCategory.action &&
            message?.getCategory() != CometChatUIKitConstants.MessageCategory.call &&
            (!this.typingIndicator ||
                (item?.uid != this.typingIndicator.getReceiverId() &&
                    item?.guid != this.typingIndicator.getReceiverId())) &&
            message.getSender()?.getUid() == this.loggedInUser?.getUid()) {
            return true;
        }
        else {
            return false;
        }
    }
    markAsRead(readMessage) {
        let conversationlist = [...this.conversationList];
        const conversationKey = conversationlist.findIndex((conversationObj) => conversationObj.getLastMessage().getReceiverId() == readMessage.getSender().getUid());
        if (conversationKey > -1) {
            let newConversationObject;
            if (!conversationlist[conversationKey].getLastMessage().getReadAt()) {
                newConversationObject = conversationlist[conversationKey];
                newConversationObject.getLastMessage().setReadAt(readMessage.getReadAt());
                newConversationObject.getLastMessage().setMuid(this.getUinx());
                conversationlist.splice(conversationKey, 1, newConversationObject);
                this.conversationList = [...conversationlist];
                this.ref.detectChanges();
            }
        }
    }
    /**
     * Updates Detail when user comes online/offline
     * @param
     */
    /**
     * @param  {CometChat.User|CometChat.Group|null} user
     */
    updateUser(user) {
        try {
            //when user updates
            const conversationlist = [
                ...this.conversationList,
            ];
            //Gets the index of user which comes offline/online
            const conversationKey = conversationlist.findIndex((conversationObj) => conversationObj.getConversationType() ===
                CometChatUIKitConstants.MessageReceiverType.user &&
                conversationObj.getConversationWith().getUid() ===
                    user.getUid());
            if (conversationKey > -1) {
                let conversationObj = conversationlist[conversationKey];
                let conversationWithObj = conversationObj.getConversationWith();
                conversationWithObj.setStatus(user.getStatus());
                let newConversationObj = conversationObj;
                newConversationObj.setConversationWith(conversationWithObj);
                newConversationObj.getLastMessage().setMuid(this.getUinx());
                conversationlist.splice(conversationKey, 1, newConversationObj);
                this.conversationList = conversationlist;
                this.ref.detectChanges();
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
            this.ref.detectChanges();
        }
    }
    /**
     *
     * Gets the last message
     * @param conversation
    /**
     * @param  {CometChat.BaseMessage} message
     * @param  {CometChat.Conversation|{}} conversation
     */
    makeLastMessage(message, conversation = {}) {
        const newMessage = message;
        return newMessage;
    }
    updateConversationWithForGroup(message, conversation) {
        if (message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
            conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group) {
            const isSameGroup = message.getReceiver().getGuid() ===
                message.getActionFor().getGuid();
            if (isSameGroup) {
                let updatedGroup = conversation.getConversationWith();
                updatedGroup.setMembersCount(message.getActionFor().getMembersCount());
                conversation.setConversationWith(updatedGroup);
            }
        }
    }
    /**
     *
     * Updates Conversations as Text/Custom Messages are received
     * @param
     *
     */
    /**
     * @param  {CometChat.BaseMessage} message
     * @param  {boolean} notification
     */
    updateConversation(message, notification = true) {
        let metadata;
        if (message instanceof CometChat.CustomMessage) {
            metadata = message.getMetadata();
        }
        try {
            if (this.checkIfLastMessageShouldUpdate(message)) {
                this.makeConversation(message)
                    .then((response) => {
                    let isCustomMessage = message instanceof CometChat.CustomMessage;
                    const conversationKey = response.conversationKey;
                    const conversationObj = response.conversationObj;
                    const conversationList = response.conversationList;
                    if (conversationKey > -1) {
                        // if sender is not logged in user then  increment count
                        let unreadMessageCount = (this.loggedInUser?.getUid() != message.getSender().getUid() ||
                            this.loggedInUser?.getUid() == message.getReceiverId())
                            ? this.makeUnreadMessageCount(conversationObj)
                            : this.makeUnreadMessageCount(conversationObj) - 1;
                        let lastMessageObj = this.makeLastMessage(message, conversationObj);
                        let newConversationObj = conversationObj;
                        if (message instanceof CometChat.Action) {
                            this.updateConversationWithForGroup(message, newConversationObj);
                        }
                        newConversationObj.setLastMessage(lastMessageObj);
                        if (message.getCategory() != CometChatUIKitConstants.MessageCategory.action) {
                            newConversationObj.setUnreadMessageCount(unreadMessageCount);
                        }
                        if (lastMessageObj.getSender().getUid() != this.loggedInUser?.getUid()) {
                            let timesLoggedInUserIsMentioned = 0;
                            let mentionedUsers = lastMessageObj.getMentionedUsers();
                            if (mentionedUsers.length) {
                                for (let i = 0; i < mentionedUsers.length; i++) {
                                    if (mentionedUsers[i].getUid() == this.loggedInUser?.getUid()) {
                                        timesLoggedInUserIsMentioned++;
                                    }
                                }
                            }
                        }
                        conversationList.splice(conversationKey, 1);
                        conversationList.unshift(newConversationObj);
                        this.conversationList = [...conversationList];
                        if (this.loggedInUser?.getUid() == message.getSender().getUid()) {
                            this.activeConversation = newConversationObj;
                        }
                        if (notification &&
                            this.loggedInUser?.getUid() != message?.getSender()?.getUid()) {
                            this.playAudio();
                            this.ref.detectChanges();
                        }
                    }
                    else {
                        let incrementCount = this.loggedInUser?.getUid() != message.getSender().getUid() ? 1 : 0;
                        let lastMessageObj = this.makeLastMessage(message);
                        conversationObj.setLastMessage(lastMessageObj);
                        if (message instanceof CometChat.Action) {
                            this.updateConversationWithForGroup(message, conversationObj);
                        }
                        if (message.getCategory() != CometChatUIKitConstants.MessageCategory.action) {
                            conversationObj.setUnreadMessageCount(incrementCount);
                        }
                        conversationList.unshift(conversationObj);
                        this.conversationList = conversationList;
                        this.ref.detectChanges();
                        if (notification &&
                            this.loggedInUser?.getUid() != message?.getSender()?.getUid()) {
                            this.playAudio();
                            this.ref.detectChanges();
                        }
                    }
                    if (this.state != States.loaded) {
                        this.state = States.loaded;
                    }
                    this.ref.detectChanges();
                })
                    .catch((error) => {
                    if (this.onError) {
                        this.onError(error);
                    }
                    this.ref.detectChanges();
                });
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        this.ref.detectChanges();
    }
    updateDeliveredMessage(messageReceipt) {
        let conversationList = [...this.conversationList];
        let conversationKey = conversationList.findIndex((c) => c.getLastMessage().getId() ==
            Number(messageReceipt.getMessageId()));
        let conversationObj;
        if (conversationKey > -1) {
            conversationObj = conversationList[conversationKey];
            if (!conversationObj.getLastMessage().getDeliveredAt()) {
                conversationObj.getLastMessage().setDeliveredAt(Number(this.getUinx()));
                conversationObj.getLastMessage().setMuid(this.getUinx());
                conversationList.splice(conversationKey, 1, conversationObj);
                this.conversationList = [...conversationList];
                this.ref.detectChanges();
            }
        }
    }
    /**
     *
     * Gets The Count of Unread Messages
     * @param
     */
    /**
     * @param  {any} conversation
     * @param  {any} operator
     */
    makeUnreadMessageCount(conversation, operator = null) {
        if (Object.keys(conversation).length === 0) {
            return 1;
        }
        let unreadMessageCount = conversation.getUnreadMessageCount();
        if (this.activeConversation &&
            this.activeConversation.getConversationId() ===
                conversation.getConversationId()) {
            unreadMessageCount += 1;
        }
        else if ((this.activeConversation &&
            this.activeConversation.hasOwnProperty("guid") &&
            conversation.getConversationWith().hasOwnProperty("guid") &&
            this.activeConversation.getConversationWith().getGuid() ===
                conversation.getConversationWith().getGuid()) ||
            (this.activeConversation &&
                this.activeConversation.hasOwnProperty("uid") &&
                conversation.getConversationWith().hasOwnProperty("uid") &&
                this.activeConversation.getConversationWith().getUid() ===
                    conversation.getConversationWith().getUid())) {
            unreadMessageCount = 0;
        }
        else {
            if (operator && operator === "decrement") {
                unreadMessageCount = unreadMessageCount ? unreadMessageCount - 1 : 0;
            }
            else {
                unreadMessageCount = unreadMessageCount + 1;
            }
        }
        return unreadMessageCount;
    }
    /**
     * Changes detail of conversations
     * @param
     */
    /**
     * @param  {CometChat.BaseMessage} message
     */
    makeConversation(message) {
        const promise = new Promise((resolve, reject) => {
            let conversationKey = this.conversationList.findIndex((c) => c?.getConversationId() === message?.getConversationId());
            if (conversationKey >= 0) {
                let conversation = this.conversationList[conversationKey];
                resolve({
                    conversationKey: conversationKey,
                    conversationObj: conversation,
                    conversationList: this.conversationList,
                });
            }
            else {
                CometChat.CometChatHelper.getConversationFromMessage(message)
                    .then((conversation) => {
                    if (conversation?.getConversationWith() instanceof CometChat.Group &&
                        !conversation.getConversationWith().getScope()) {
                        conversation.getConversationWith().setHasJoined(true);
                        conversation.getConversationWith().setScope(CometChatUIKitConstants.groupMemberScope.participant);
                    }
                    resolve({
                        conversationKey: -1,
                        conversationObj: conversation,
                        conversationList: this.conversationList,
                    });
                    this.ref.detectChanges();
                })
                    .catch((error) => reject(error));
            }
        });
        return promise;
    }
    /**
     * Updates Conversation View when message is edited or deleted
     */
    conversationEditedDeleted(message) {
        try {
            this.makeConversation(message)
                .then((response) => {
                const conversationKey = response.conversationKey;
                const conversationObj = response.conversationObj;
                const conversationList = response.conversationList;
                if (conversationKey > -1) {
                    let lastMessageObj = conversationObj.getLastMessage();
                    if (lastMessageObj.getId() === message.getId()) {
                        conversationObj.setLastMessage(message);
                        conversationObj.getLastMessage().setMuid(this.getUinx());
                        conversationList.splice(conversationKey, 1, conversationObj);
                        this.conversationList = [...conversationList];
                        this.ref.detectChanges();
                    }
                }
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
                this.ref.detectChanges();
            });
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    /**
     * If User scrolls to the bottom of the current Conversation list than fetch next items of the Conversation list and append
     * @param Event
     */
    /**
     * Plays Audio When Message is Received
     */
    playAudio() {
        try {
            if (!this.disableSoundForMessages) {
                if (this.customSoundForMessages) {
                    CometChatSoundManager.play(this.customSoundForMessages);
                }
                else {
                    CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessageFromOther);
                }
            }
            else {
                return;
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    /*
     * Updates the convesation list when deleted.
     * Adding Conversation Object to CometchatService
     */
    /**
     * @param  {CometChat.Conversation|{}} conversation
     */
    updateConversationList(conversation) {
        let index = this.conversationList.findIndex((element) => element?.getConversationId() == conversation?.getConversationId());
        this.conversationList.splice(index, 1);
        this.ref.detectChanges();
    }
    onOptionClick(event, conversation) {
        let option = event?.detail?.data;
        this.conversationToBeDeleted = conversation;
        if (option) {
            option.onClick();
        }
    }
    /**
     * show confirm dialog screen
     * @param  {CometChat.Conversation|{}} conversaton
     */
    // check is there is any active conversation and mark it as active
    getActiveConversation(conversation) {
        if (this.selectionMode == SelectionMode.none || !this.selectionMode) {
            return (this.activeConversation &&
                this.activeConversation?.conversationId ==
                    conversation?.conversationId);
        }
        else {
            return false;
        }
    }
    /**
     * handle confirm dialog response
     * @param  {string} value
     */
    // calling cometchat.deleteConversation method
    deleteSelectedConversation() {
        if (this.conversationToBeDeleted) {
            if (this.activeConversation &&
                this.activeConversation.getConversationId() ==
                    this.conversationToBeDeleted.getConversationId()) {
                this.activeConversation = null;
            }
            let conversationWith;
            let conversationType = this.conversationToBeDeleted.getConversationType();
            if (conversationType === CometChatUIKitConstants.MessageReceiverType.user) {
                conversationWith = this.conversationToBeDeleted.getConversationWith().getUid();
            }
            else {
                conversationWith = this.conversationToBeDeleted.getConversationWith().getGuid();
            }
            CometChat.deleteConversation(conversationWith, conversationType).then((deletedConversation) => {
                CometChatConversationEvents.ccConversationDeleted.next(this.conversationToBeDeleted);
                this.updateConversationList(this.conversationToBeDeleted);
                this.conversationToBeDeleted = null;
                this.ref.detectChanges();
            });
            this.isDialogOpen = false;
            this.ref.detectChanges();
        }
    }
    // exposed methods to users.
    updateLastMessage(message) {
        this.updateConversation(message);
    }
    removeConversation(conversation) {
        this.updateConversationList(conversation);
    }
}
CometChatConversationsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatConversationsComponent, deps: [{ token: i0.NgZone }, { token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }, { token: i2.DomSanitizer }], target: i0.ɵɵFactoryTarget.Component });
CometChatConversationsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatConversationsComponent, selector: "cometchat-conversations", inputs: { subtitleView: "subtitleView", title: "title", options: "options", searchPlaceHolder: "searchPlaceHolder", disableUsersPresence: "disableUsersPresence", disableReceipt: "disableReceipt", disableTyping: "disableTyping", deliveredIcon: "deliveredIcon", readIcon: "readIcon", errorIcon: "errorIcon", datePattern: "datePattern", onError: "onError", sentIcon: "sentIcon", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", customSoundForMessages: "customSoundForMessages", activeConversation: "activeConversation", searchIconURL: "searchIconURL", hideSearch: "hideSearch", conversationsRequestBuilder: "conversationsRequestBuilder", emptyStateView: "emptyStateView", onSelect: "onSelect", loadingIconURL: "loadingIconURL", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", listItemView: "listItemView", menu: "menu", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", disableSoundForMessages: "disableSoundForMessages", confirmDialogTitle: "confirmDialogTitle", confirmButtonText: "confirmButtonText", cancelButtonText: "cancelButtonText", confirmDialogMessage: "confirmDialogMessage", onItemClick: "onItemClick", deleteConversationDialogStyle: "deleteConversationDialogStyle", backdropStyle: "backdropStyle", badgeStyle: "badgeStyle", dateStyle: "dateStyle", conversationsStyle: "conversationsStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", typingIndicatorText: "typingIndicatorText", threadIndicatorText: "threadIndicatorText", avatarStyle: "avatarStyle", receiptStyle: "receiptStyle", loggedInUser: "loggedInUser", disableMentions: "disableMentions", textFormatters: "textFormatters" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"], components: [{ type: i3.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatConversationsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-conversations", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }, { type: i2.DomSanitizer }]; }, propDecorators: { subtitleView: [{
                type: Input
            }], title: [{
                type: Input
            }], options: [{
                type: Input
            }], searchPlaceHolder: [{
                type: Input
            }], disableUsersPresence: [{
                type: Input
            }], disableReceipt: [{
                type: Input
            }], disableTyping: [{
                type: Input
            }], deliveredIcon: [{
                type: Input
            }], readIcon: [{
                type: Input
            }], errorIcon: [{
                type: Input
            }], datePattern: [{
                type: Input
            }], onError: [{
                type: Input
            }], sentIcon: [{
                type: Input
            }], privateGroupIcon: [{
                type: Input
            }], protectedGroupIcon: [{
                type: Input
            }], passwordGroupIcon: [{
                type: Input
            }], customSoundForMessages: [{
                type: Input
            }], activeConversation: [{
                type: Input
            }], searchIconURL: [{
                type: Input
            }], hideSearch: [{
                type: Input
            }], conversationsRequestBuilder: [{
                type: Input
            }], emptyStateView: [{
                type: Input
            }], onSelect: [{
                type: Input
            }], loadingIconURL: [{
                type: Input
            }], errorStateView: [{
                type: Input
            }], loadingStateView: [{
                type: Input
            }], emptyStateText: [{
                type: Input
            }], errorStateText: [{
                type: Input
            }], titleAlignment: [{
                type: Input
            }], listItemView: [{
                type: Input
            }], menu: [{
                type: Input
            }], hideSeparator: [{
                type: Input
            }], searchPlaceholder: [{
                type: Input
            }], hideError: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], disableSoundForMessages: [{
                type: Input
            }], confirmDialogTitle: [{
                type: Input
            }], confirmButtonText: [{
                type: Input
            }], cancelButtonText: [{
                type: Input
            }], confirmDialogMessage: [{
                type: Input
            }], onItemClick: [{
                type: Input
            }], deleteConversationDialogStyle: [{
                type: Input
            }], backdropStyle: [{
                type: Input
            }], badgeStyle: [{
                type: Input
            }], dateStyle: [{
                type: Input
            }], conversationsStyle: [{
                type: Input
            }], listItemStyle: [{
                type: Input
            }], statusIndicatorStyle: [{
                type: Input
            }], typingIndicatorText: [{
                type: Input
            }], threadIndicatorText: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], receiptStyle: [{
                type: Input
            }], loggedInUser: [{
                type: Input
            }], disableMentions: [{
                type: Input
            }], textFormatters: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRDb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxXQUFXLEVBRVgsVUFBVSxFQUNWLGtCQUFrQixFQUNsQixTQUFTLEVBRVQsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCxxQkFBcUIsRUFFckIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULG1CQUFtQixHQUNwQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFFdEIsdUJBQXVCLEVBQ3ZCLG1CQUFtQixFQUVuQixZQUFZLEVBT1osYUFBYSxFQUNiLGFBQWEsRUFDYixNQUFNLEVBQ04sY0FBYyxFQUNkLFVBQVUsRUFDVixRQUFRLEVBR1IscUJBQXFCLEdBQ3RCLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsS0FBSyxHQU9OLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5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QUk7c0JBQVosS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFHRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLDZCQUE2QjtzQkFBckMsS0FBSztnQkFnQkcsYUFBYTtzQkFBckIsS0FBSztnQkFNRyxVQUFVO3NCQUFsQixLQUFLO2dCQVFHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBSUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUs7Z0JBSUcsb0JBQW9CO3NCQUE1QixLQUFLO2dCQUtHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQWdIRyxZQUFZO3NCQUFwQixLQUFLO2dCQUdHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcblxuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIEJhZGdlU3R5bGUsXG4gIENvbmZpcm1EaWFsb2dTdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBJY29uU3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG4gIFJlY2VpcHRTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7IERvbVNhbml0aXplciwgU2FmZUh0bWwgfSBmcm9tIFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3NlclwiO1xuaW1wb3J0IHtcbiAgQmFzZVN0eWxlLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIENvbWV0Q2hhdFRleHRGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbiAgQ29udmVyc2F0aW9uVXRpbHMsXG4gIENvbnZlcnNhdGlvbnNTdHlsZSxcbiAgTGlzdFN0eWxlLFxuICBNZXNzYWdlUmVjZWlwdFV0aWxzLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIENhcmRNZXNzYWdlLFxuICBDb21ldENoYXRDYWxsRXZlbnRzLFxuICBDb21ldENoYXRDb252ZXJzYXRpb25FdmVudHMsXG4gIENvbWV0Q2hhdEdyb3VwRXZlbnRzLFxuICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLFxuICBDb21ldENoYXRPcHRpb24sXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBDb21ldENoYXRVc2VyRXZlbnRzLFxuICBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UsXG4gIERhdGVQYXR0ZXJucyxcbiAgRm9ybU1lc3NhZ2UsXG4gIElHcm91cExlZnQsXG4gIElHcm91cE1lbWJlckFkZGVkLFxuICBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQsXG4gIElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCxcbiAgSU1lc3NhZ2VzLFxuICBNZXNzYWdlU3RhdHVzLFxuICBTZWxlY3Rpb25Nb2RlLFxuICBTdGF0ZXMsXG4gIFRpdGxlQWxpZ25tZW50LFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbiAgU2NoZWR1bGVyTWVzc2FnZSxcbiAgVXNlclByZXNlbmNlUGxhY2VtZW50LFxuICBNZW50aW9uc1RhcmdldEVsZW1lbnQsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEhvc3RCaW5kaW5nLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkNoYW5nZXMsXG4gIE9uSW5pdCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXQgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0NvbWV0Q2hhdFVJa2l0L0NvbWV0Q2hhdFVJS2l0XCI7XG5cbi8qKlxuICpcbiAqIENvbWV0Q2hhdENvbnZlcnNhdGlvbiBpcyBhIHdyYXBwZXIgY29tcG9uZW50IGNvbnNpc3RzIG9mIENvbWV0Q2hhdExpc3RCYXNlQ29tcG9uZW50IGFuZCBDb252ZXJzYXRpb25MaXN0Q29tcG9uZW50LlxuICpcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiAqIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuICpcbiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1jb252ZXJzYXRpb25zXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0Q29udmVyc2F0aW9uc0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgLyoqXG4gICAqIFRoaXMgcHJvcGVydGllcyB3aWxsIGNvbWUgZnJvbSBQYXJlbnQuXG4gICAqL1xuICBASW5wdXQoKSBzdWJ0aXRsZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSB0aXRsZTogc3RyaW5nID0gbG9jYWxpemUoXCJDSEFUU1wiKTsgLy9UaXRsZSBvZiB0aGUgY29tcG9uZW50XG4gIEBJbnB1dCgpIG9wdGlvbnMhOlxuICAgIHwgKChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IENvbWV0Q2hhdE9wdGlvbltdKVxuICAgIHwgbnVsbDtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2VIb2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpOyAvLyBwbGFjZWhvbGRlciB0ZXh0IG9mIHNlYXJjaCBpbnB1dFxuICBASW5wdXQoKSBkaXNhYmxlVXNlcnNQcmVzZW5jZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBkaXNhYmxlUmVjZWlwdDogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGVsaXZlcmVkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1kZWxpdmVyZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHJlYWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXJlYWQuc3ZnXCI7XG4gIEBJbnB1dCgpIGVycm9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvd2FybmluZy1zbWFsbC5zdmdcIjtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy5EYXlEYXRlVGltZTtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKFxuICAgIGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uXG4gICkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfTtcbiAgQElucHV0KCkgc2VudEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2Utc2VudC5zdmdcIjtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgICovXG4gIEBJbnB1dCgpIHByb3RlY3RlZEdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvTG9ja2VkLnN2Z1wiO1xuICBASW5wdXQoKSBwYXNzd29yZEdyb3VwSWNvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2VzOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBhY3RpdmVDb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gbnVsbDsgLy9zZWxlY3RlZCBjb252ZXJzYXRpb25cbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiOyAvL2ltYWdlIFVSTCBvZiB0aGUgc2VhcmNoIGljb25cbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IHRydWU7IC8vc3dpdGNoIG9uL2ZmIHNlYXJjaCBpbnB1dFxuICBASW5wdXQoKSBjb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBzZWxlY3RlZDogYm9vbGVhblxuICApID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19DSEFUU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuXG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvck1lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGNvbmZpcm1EaWFsb2dUaXRsZSA9IGxvY2FsaXplKFwiREVMRVRFX0NPTlZFUlNBVElPTlwiKTtcbiAgQElucHV0KCkgY29uZmlybUJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiREVMRVRFXCIpO1xuICBASW5wdXQoKSBjYW5jZWxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTkNFTFwiKTtcbiAgQElucHV0KCkgY29uZmlybURpYWxvZ01lc3NhZ2U6IHN0cmluZyA9IGxvY2FsaXplKFxuICAgIFwiV09VTERfX1lPVV9MSUtFX1RPX0RFTEVURV9USElTX0NPTlZFUlNBVElPTlwiXG4gICk7XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4gdm9pZDtcbiAgQElucHV0KCkgZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogXCJcIixcbiAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6IFwiXCIsXG4gICAgY29uZmlybUJ1dHRvblRleHRGb250OiBcIlwiLFxuICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjogXCJcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogXCJcIixcbiAgICB0aXRsZUZvbnQ6IFwiXCIsXG4gICAgdGl0bGVDb2xvcjogXCJcIixcbiAgICBtZXNzYWdlVGV4dEZvbnQ6IFwiXCIsXG4gICAgbWVzc2FnZVRleHRDb2xvcjogXCJcIixcbiAgICBiYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgI2YyZjJmMlwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBiYWNrZHJvcFN0eWxlOiBCYWNrZHJvcFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiYSgwLCAwLCAwLCAwLjUpXCIsXG4gICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgfTtcbiAgQElucHV0KCkgYmFkZ2VTdHlsZTogQmFkZ2VTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyNXB4XCIsXG4gICAgaGVpZ2h0OiBcIjE1cHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcIiM1YWFlZmZcIixcbiAgICB0ZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICB0ZXh0Rm9udDogXCI0MDAgMTNweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGRhdGVTdHlsZTogRGF0ZVN0eWxlID0ge1xuICAgIHRleHRGb250OiBcIjQwMCAxMXB4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgdGV4dENvbG9yOiBcInJnYmEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgfTtcbiAgQElucHV0KCkgY29udmVyc2F0aW9uc1N0eWxlOiBDb252ZXJzYXRpb25zU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjk3JVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSB0eXBpbmdJbmRpY2F0b3JUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIklTX1RZUElOR1wiKTtcbiAgQElucHV0KCkgdGhyZWFkSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJJTl9BX1RIUkVBRFwiKTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge307XG4gIEBJbnB1dCgpIHJlY2VpcHRTdHlsZTogUmVjZWlwdFN0eWxlID0ge307XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VTZW50ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZURlbGV0ZSE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cERlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITogU3Vic2NyaXB0aW9uO1xuICBjY1VzZXJCbG9ja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VSZWFkITogU3Vic2NyaXB0aW9uO1xuICBvblRleHRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkZvcm1NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkNhcmRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNSZWFkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNEZWxpdmVyZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHlwaW5nU3RhcnRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjT3V0Z29pbmdDYWxsITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbEFjY2VwdGVkITogU3Vic2NyaXB0aW9uO1xuICBpY29uU3R5bGU6IGFueSA9IHtcbiAgICBpY29uVGludDogXCJsaWdodGdyZXlcIixcbiAgICBoZWlnaHQ6IFwiMjBweFwiLFxuICAgIHdpZHRoOiBcIjIwcHhcIixcbiAgfTtcbiAgbGlzdFN0eWxlOiBMaXN0U3R5bGUgPSBuZXcgTGlzdFN0eWxlKHt9KTtcbiAgbWVudXN0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgdGV4dEZvbnQ6IFwiXCIsXG4gICAgdGV4dENvbG9yOiBcImJsYWNrXCIsXG4gICAgaWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgaWNvbkJvcmRlcjogXCJub25lXCIsXG4gICAgaWNvbkJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgc3VibWVudVdpZHRoOiBcIjcwcHhcIixcbiAgICBzdWJtZW51SGVpZ2h0OiBcIjIwcHhcIixcbiAgICBzdWJtZW51Qm9yZGVyOiBcIjFweCBzb2xpZCAjZThlOGU4XCIsXG4gICAgc3VibWVudUJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBzdWJtZW51QmFja2dyb3VuZDogXCJ3aGl0ZVwiLFxuICB9O1xuICBwdWJsaWMgdHlwaW5nSW5kaWNhdG9yITogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvciB8IG51bGw7XG4gIHB1YmxpYyB0eXBpbmdMaXN0ZW5lcklkOiBzdHJpbmcgPVxuICAgIFwiY29udmVyc2F0aW9uX19MSVNURU5FUlwiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBjYWxsTGlzdGVuZXJJZCA9IFwiY2FsbF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgY29ubmVjdGlvbkxpc3RlbmVySWQgPSBcImNvbm5lY3Rpb25fXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgc2VsZWN0aW9ubW9kZUVudW06IHR5cGVvZiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZTtcbiAgcHVibGljIGlzRGlhbG9nT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgaXNFbXB0eTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgaXNMb2FkaW5nOiBib29sZWFuID0gdHJ1ZTtcbiAgcHVibGljIHN0YXRlOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZztcbiAgcHVibGljIHN0YXR1c0NvbG9yOiBhbnkgPSB7XG4gICAgb25saW5lOiBcIlwiLFxuICAgIHByaXZhdGU6IFwiXCIsXG4gICAgcGFzc3dvcmQ6IFwiI0Y3QTUwMFwiLFxuICAgIHB1YmxpYzogXCJcIixcbiAgfTtcbiAgcHVibGljIGxpbWl0OiBudW1iZXIgPSAzMDtcbiAgcHVibGljIGlzRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvbkxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFtdO1xuICBwdWJsaWMgc2Nyb2xsZWRUb0JvdHRvbTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY2hlY2tJdGVtQ2hhbmdlOiBib29sZWFuID0gZmFsc2U7XG4gIGNvbnZlcnNhdGlvbk9wdGlvbnMhOiBDb21ldENoYXRPcHRpb25bXTtcbiAgcHVibGljIHNob3dDb25maXJtRGlhbG9nOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25Ub0JlRGVsZXRlZDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgdXNlckxpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2hhdGxpc3RfdXNlcl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgZ3JvdXBMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNoYXRsaXN0X2dyb3VwX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBncm91cFRvVXBkYXRlOiBDb21ldENoYXQuR3JvdXAgfCB7fSA9IHt9O1xuICBwdWJsaWMgY29udmVyc2F0aW9uVHlwZT86IHN0cmluZyA9IHVuZGVmaW5lZDtcbiAgc2FmZUh0bWwhOiBTYWZlSHRtbDtcbiAgZW5hYmxlUG9sbHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlU3RpY2tlcnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlV2hpdGVib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVEb2N1bWVudDogYm9vbGVhbiA9IGZhbHNlO1xuICB0aHJlYWRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy90aHJlYWQtYXJyb3cuc3ZnXCI7XG4gIHB1YmxpYyBjb25maXJtRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gIH07XG4gIHN1YnRpdGxlVmFsdWUhOiBzdHJpbmc7XG4gIG1vZGFsU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMjMwcHhcIixcbiAgICB3aWR0aDogXCIyNzBweFwiLFxuICB9O1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBpc0FjdGl2ZTogYm9vbGVhbiA9IHRydWU7XG4gIGNvbnRhY3RzTm90Rm91bmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY2hhdFNlYXJjaCE6IGJvb2xlYW47XG4gIHJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbnNSZXF1ZXN0O1xuICAvKipcbiAgICogUHJvcGVydGllcyBmb3IgaW50ZXJuYWwgdXNlXG4gICAqL1xuICBwdWJsaWMgbG9jYWxpemUgPSBsb2NhbGl6ZTtcbiAgLyoqXG4gICAqIFRoaXMgcHJvcGVydGllcyB3aWxsIGNvbWUgZnJvbSBQYXJlbnQuXG4gICAqL1xuICBASW5wdXQoKSBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gQElucHV0KCkgbWVudGlvbnNJY29uVVJMITogc3RyaW5nO1xuICBASW5wdXQoKSBkaXNhYmxlTWVudGlvbnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dEZvcm1hdHRlcnM/OiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPjtcblxuICAvKipcbiAgICogUHJvcGVydGllcyBmb3IgaW50ZXJuYWwgdXNlXG4gICAqL1xuICAvKipcbiAgICogcGFzc2luZyB0aGlzIGNhbGxiYWNrIHRvIG1lbnVMaXN0IGNvbXBvbmVudCBvbiBkZWxldGUgY2xpY2tcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbn0gY29udmVyc2F0aW9uXG4gICAqL1xuICBkZWxldGVDb252ZXJzYXRpb25PbkNsaWNrOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0NvbmZpcm1hdGlvbkRpYWxvZyh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkISk7XG4gIH07XG4gIC8vIGNhbGxiYWNrIGZvciBjb25maXJtRGlhbG9nQ29tcG9uZW50XG4gIG9uQ29uZmlybUNsaWNrID0gKCkgPT4ge1xuICAgIHRoaXMuZGVsZXRlU2VsZWN0ZWRDb252ZXJzYXRpb24oKTtcbiAgfTtcbiAgb25Db252ZXJzYXRpb25TZWxlY3RlZChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24sIGV2ZW50OiBhbnkpIHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudC5kZXRhaWwuY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdChjb252ZXJzYXRpb24sIHNlbGVjdGVkKTtcbiAgICB9XG4gIH1cbiAgc2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgaWYgKFxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGU7XG4gICAgfVxuICB9O1xuXG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gZ2V0TWVudGlvbkljb25TdHlsZSgpOiBJY29uU3R5bGUge1xuICAvLyAgIHJldHVybiBuZXcgSWNvblN0eWxlKHtcbiAgLy8gICAgIGhlaWdodDogXCIxNnB4XCIsXG4gIC8vICAgICB3aWR0aDogXCIxNnB4XCIsXG4gIC8vICAgICBpY29uVGludDpcbiAgLy8gICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5tZW50aW9uSWNvblRpbnQgPz9cbiAgLy8gICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAvLyAgIH0pO1xuICAvLyB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCB1c2VyOiBDb21ldENoYXQuVXNlciA9XG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgIGlmIChcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2VcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgdXNlci5nZXRTdGF0dXMoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbdXNlci5nZXRTdGF0dXMoKV07XG4gICAgICB9IGVsc2UgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgIGxldCBncm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwO1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbZ3JvdXAuZ2V0VHlwZSgpXVxuICAgIH1cbiAgfVxuXG4gIGdldEV4dGVuc2lvbkRhdGEobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IG1lc3NhZ2VUZXh0O1xuICAgIC8veHNzIGV4dGVuc2lvbnMgZGF0YVxuICAgIGNvbnN0IHhzc0RhdGEgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tNZXNzYWdlRm9yRXh0ZW5zaW9uc0RhdGEoXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgXCJ4c3MtZmlsdGVyXCJcbiAgICApO1xuICAgIGlmIChcbiAgICAgIHhzc0RhdGEgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHhzc0RhdGEsIFwic2FuaXRpemVkX3RleHRcIikgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHhzc0RhdGEsIFwiaGFzWFNTXCIpICYmXG4gICAgICB4c3NEYXRhLmhhc1hTUyA9PT0gXCJ5ZXNcIlxuICAgICkge1xuICAgICAgbWVzc2FnZVRleHQgPSB4c3NEYXRhLnNhbml0aXplZF90ZXh0O1xuICAgIH1cbiAgICAvL2RhdGFtYXNraW5nIGV4dGVuc2lvbnMgZGF0YVxuICAgIGNvbnN0IG1hc2tlZERhdGEgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tNZXNzYWdlRm9yRXh0ZW5zaW9uc0RhdGEoXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgXCJkYXRhLW1hc2tpbmdcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgbWFza2VkRGF0YSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkobWFza2VkRGF0YSwgXCJkYXRhXCIpICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgbWFza2VkRGF0YS5kYXRhLFxuICAgICAgICBcInNlbnNpdGl2ZV9kYXRhXCJcbiAgICAgICkgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICBtYXNrZWREYXRhLmRhdGEsXG4gICAgICAgIFwibWVzc2FnZV9tYXNrZWRcIlxuICAgICAgKSAmJlxuICAgICAgbWFza2VkRGF0YS5kYXRhLnNlbnNpdGl2ZV9kYXRhID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IG1hc2tlZERhdGEuZGF0YS5tZXNzYWdlX21hc2tlZDtcbiAgICB9XG4gICAgLy9wcm9mYW5pdHkgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgcHJvZmFuZURhdGEgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tNZXNzYWdlRm9yRXh0ZW5zaW9uc0RhdGEoXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgXCJwcm9mYW5pdHktZmlsdGVyXCJcbiAgICApO1xuICAgIGlmIChcbiAgICAgIHByb2ZhbmVEYXRhICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShwcm9mYW5lRGF0YSwgXCJwcm9mYW5pdHlcIikgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHByb2ZhbmVEYXRhLCBcIm1lc3NhZ2VfY2xlYW5cIikgJiZcbiAgICAgIHByb2ZhbmVEYXRhLnByb2Zhbml0eSA9PT0gXCJ5ZXNcIlxuICAgICkge1xuICAgICAgbWVzc2FnZVRleHQgPSBwcm9mYW5lRGF0YS5tZXNzYWdlX2NsZWFuO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZVRleHQgfHwgKG1lc3NhZ2VPYmplY3QgYXMgYW55KS50ZXh0O1xuICB9XG4gIHNldFN1YnRpdGxlID0gKGNvbnZlcnNhdGlvbk9iamVjdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgIGlmICh0aGlzLnR5cGluZ0luZGljYXRvcikge1xuICAgICAgY29uc3QgaXNUeXBpbmcgPVxuICAgICAgICAoY29udmVyc2F0aW9uT2JqZWN0IGFzIGFueSk/LmNvbnZlcnNhdGlvbldpdGg/Lmd1aWQgPT1cbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpO1xuICAgICAgaWYgKGlzVHlwaW5nKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnR5cGluZ0luZGljYXRvci5nZXRTZW5kZXIoKS5nZXROYW1lKCl9ICR7dGhpcy50eXBpbmdJbmRpY2F0b3JUZXh0XG4gICAgICAgICAgfWA7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAoY29udmVyc2F0aW9uT2JqZWN0IGFzIGFueSk/LmNvbnZlcnNhdGlvbldpdGg/LnVpZCA9PVxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvcj8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgJiZcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJUeXBlKCkgIT09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBpbmdJbmRpY2F0b3JUZXh0O1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3VidGl0bGUgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRMYXN0Q29udmVyc2F0aW9uTWVzc2FnZShcbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdCxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyISxcblxuICAgICAge1xuICAgICAgICBkaXNhYmxlTWVudGlvbnM6IHRoaXMuZGlzYWJsZU1lbnRpb25zLFxuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgIG1lbnRpb25zVGFyZ2V0RWxlbWVudDogTWVudGlvbnNUYXJnZXRFbGVtZW50LmNvbnZlcnNhdGlvbixcbiAgICAgICAgdGV4dEZvcm1hdHRlcnM6IHRoaXMudGV4dEZvcm1hdHRlcnNcbiAgICAgIH1cbiAgICApO1xuICAgIGxldCBpY29uID1cbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdD8uZ2V0TGFzdE1lc3NhZ2UoKT8uZ2V0VHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICA/IFwi8J+TniBcIlxuICAgICAgICA6IFwi8J+TuSBcIjtcblxuICAgIHJldHVybiB0aGlzLnNhbml0aXplci5ieXBhc3NTZWN1cml0eVRydXN0SHRtbChcbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdD8uZ2V0TGFzdE1lc3NhZ2UoKT8uZ2V0Q2F0ZWdvcnkoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbFxuICAgICAgICA/IGljb24gKyBzdWJ0aXRsZVxuICAgICAgICA6IHN1YnRpdGxlXG4gICAgKTtcbiAgfTtcblxuICAvL1RvIGJlIGVuYWJsZWQgaW4gVU1DXG4gIC8vIGdldFVucmVhZE1lbnRpb25zSWNvblN0eWxlKCkge1xuICAvLyAgIHJldHVybiB7XG4gIC8vICAgICBwYWRkaW5nUmlnaHQ6IFwiM3B4XCIsXG4gIC8vICAgfTtcbiAgLy8gfVxuXG4gIGNoZWNrR3JvdXBUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbik6IHN0cmluZyB7XG4gICAgbGV0IGltYWdlOiBzdHJpbmcgPSBcIlwiO1xuICAgIGlmIChcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICApIHtcbiAgICAgIGxldCBncm91cDogQ29tZXRDaGF0Lkdyb3VwID0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXA7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnBhc3N3b3JkR3JvdXBJY29uIHx8IHRoaXMucHJvdGVjdGVkR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZTpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpbWFnZSA9IFwiXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbWFnZTtcbiAgfVxuICAvLyBjYWxsYmFjayBmb3IgY29uZmlybURpYWxvZ0NvbXBvbmVudFxuICBvbkNhbmNlbENsaWNrID0gKCkgPT4ge1xuICAgIHRoaXMuaXNEaWFsb2dPcGVuID0gZmFsc2U7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBnZXRNZXNzYWdlUmVjZWlwdCA9IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICBsZXQgcmVjZWlwdCA9IE1lc3NhZ2VSZWNlaXB0VXRpbHMuZ2V0UmVjZWlwdFN0YXR1cyhcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpXG4gICAgKTtcbiAgICByZXR1cm4gcmVjZWlwdDtcbiAgfTtcbiAgZ2V0RGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRlUGF0dGVybiA/PyBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIH1cbiAgb3B0aW9uc1N0eWxlID0ge1xuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSBzYW5pdGl6ZXI6IERvbVNhbml0aXplclxuICApIHsgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyID1cbiAgICAgICAgbmV3IENvbWV0Q2hhdC5Db252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgIH1cbiAgICB0aGlzLnNldENvbnZlcnNhdGlvbk9wdGlvbnMoKTtcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnModGhpcy5jb252ZXJzYXRpb25VcGRhdGVkKTtcbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKTtcbiAgICBpZiAodGhpcy5yZXF1ZXN0QnVpbGRlcj8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICB9XG4gICAgdGhpcy5nZXRDb252ZXJzYXRpb24oKTtcbiAgfVxuICAvKipcbiAgKiBEZXRlcm1pbmVzIGlmIHRoZSBsYXN0IG1lc3NhZ2Ugc2hvdWxkIHRyaWdnZXIgYW4gdXBkYXRlIGJhc2VkIG9uIGl0cyBjYXRlZ29yeSBhbmQgdHlwZS5cbiAgKlxuICAqIEBwYXJhbSBtZXNzYWdlIC0gVGhlIGxhc3QgbWVzc2FnZSBzZW50IG9yIHJlY2VpdmVkIGluIHRoZSBjb252ZXJzYXRpb24uXG4gICogQHJldHVybnMge2Jvb2xlYW59IC0gUmV0dXJucyB0cnVlIGlmIHRoZSBtZXNzYWdlIHNob3VsZCB0cmlnZ2VyIGFuIHVwZGF0ZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAqL1xuICBjaGVja0lmTGFzdE1lc3NhZ2VTaG91bGRVcGRhdGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuY29udmVyc2F0aW9uVHlwZSAmJiB0aGlzLmNvbnZlcnNhdGlvblR5cGUgIT0gbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVja2luZyBpZiB0aGUgbWVzc2FnZSBpcyBhIGN1c3RvbSBtZXNzYWdlXG4gICAgbGV0IGlzQ3VzdG9tTWVzc2FnZSA9IG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jdXN0b21cbiAgICAvLyBDaGVjayBpZiB0aGUgbWVzc2FnZSBpcyBhIHJlcGx5IHRvIGFub3RoZXIgbWVzc2FnZVxuICAgIGlmIChtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJiAhQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uTWVzc2FnZVJlcGxpZXMoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaXNDdXN0b21NZXNzYWdlKSB7XG4gICAgICBpZiAobWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiYgQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uTWVzc2FnZVJlcGxpZXMoKSAmJiB0aGlzLnNob3VsZEluY3JlbWVudEZvckN1c3RvbU1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnNob3VsZEluY3JlbWVudEZvckN1c3RvbU1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSk7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGFuIGFjdGlvbiBtZXNzYWdlXG4gICAgaWYgKG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24pIHtcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGEgZ3JvdXAgbWVtYmVyIGFjdGlvblxuICAgICAgaWYgKG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyKSB7XG4gICAgICAgIHJldHVybiBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25Hcm91cEFjdGlvbnMoKTtcbiAgICAgIH1cbiAgICAgIC8vIEJ5IGRlZmF1bHQsIGFjdGlvbiBtZXNzYWdlcyBzaG91bGQgdHJpZ2dlciBhbiB1cGRhdGVcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGEgY2FsbCAoZWl0aGVyIGF1ZGlvIG9yIHZpZGVvKVxuICAgIGlmIChtZXNzYWdlPy5nZXRDYXRlZ29yeSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJlxuICAgICAgKG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvIHx8XG4gICAgICAgIG1lc3NhZ2UuZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8pKSB7XG4gICAgICByZXR1cm4gQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uQ2FsbEFjdGl2aXRpZXMoKTtcbiAgICB9XG4gICAgLy8gQnkgZGVmYXVsdCwgbWVzc2FnZXMgc2hvdWxkIHRyaWdnZXIgYW4gdXBkYXRlXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgc2hvdWxkSW5jcmVtZW50Rm9yQ3VzdG9tTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgIGNvbnN0IG1ldGFkYXRhOiBhbnkgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgLy8gQ2hlY2tpbmcgaWYgdGhlIGN1c3RvbSBtZXNzYWdlIHNob3VsZCBpbmNyZW1lbnQgdGhlIHVucmVhZCBtZXNzYWdlIGNvdW50ZXJcbiAgICByZXR1cm4gbWVzc2FnZS53aWxsVXBkYXRlQ29udmVyc2F0aW9uKClcbiAgICAgIHx8IChtZXRhZGF0YSAmJiBtZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShcImluY3JlbWVudFVucmVhZENvdW50XCIpICYmIG1ldGFkYXRhLmluY3JlbWVudFVucmVhZENvdW50KSB8fCBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25DdXN0b21NZXNzYWdlcygpO1xuICB9XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENvbm5lY3Rpb25MaXN0ZW5lcihcbiAgICAgIHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNvbm5lY3Rpb25MaXN0ZW5lcih7XG4gICAgICAgIG9uQ29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT5jb25uZWN0ZWRcIik7XG4gICAgICAgICAgdGhpcy5mZXRjaE5ld0NvbnZlcnNhdGlvbnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgdXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmIChjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKSAmJiB0aGlzLmNoZWNrSWZMYXN0TWVzc2FnZVNob3VsZFVwZGF0ZShjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKSkpIHtcbiAgICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgIGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uSWQoKSA9PSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKTtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEsIGNvbnZlcnNhdGlvbik7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQgPVxuICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLnN1YnNjcmliZShcbiAgICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29udmVyc2F0aW9uID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS5ncm91cCEpO1xuICAgICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgICAgIGxldCBncm91cDogQ29tZXRDaGF0Lkdyb3VwID0gaXRlbS51c2VyQWRkZWRJbiE7XG4gICAgICAgICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb25bXSA9IGl0ZW0ubWVzc2FnZXMhO1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0udXNlckFkZGVkSW4hKTtcbiAgICAgICAgICBjb252ZXJzYXRpb24/LnNldENvbnZlcnNhdGlvbldpdGgoZ3JvdXApO1xuICAgICAgICAgIGNvbnZlcnNhdGlvbj8uc2V0TGFzdE1lc3NhZ2UoYWN0aW9uTWVzc2FnZVthY3Rpb25NZXNzYWdlPy5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uISk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPVxuICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZShcbiAgICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29udmVyc2F0aW9uID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS5raWNrZWRGcm9tISk7XG4gICAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRMYXN0TWVzc2FnZShpdGVtLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldExhc3RNZXNzYWdlKGl0ZW0ubWVzc2FnZSk7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwRGVsZXRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBEZWxldGVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0pO1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cExlZnQpID0+IHtcbiAgICAgICAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKGM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgICAgIGM/LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgICAgICAgICAoYz8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpID09XG4gICAgICAgICAgICAgIGl0ZW0ubGVmdEdyb3VwLmdldEd1aWQoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb24pO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICAgICAgICBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICB0aGlzLmNjVXNlckJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlckJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgICB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Vc2VyKGl0ZW0pO1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG9iamVjdDogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBvYmplY3Q/Lm1lc3NhZ2U/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG9iamVjdC5tZXNzYWdlITtcbiAgICAgICAgICBpZiAob2JqZWN0LnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5zdWJzY3JpYmUoXG4gICAgICAob2JqOiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG9iai5tZXNzYWdlITtcbiAgICAgICAgaWYgKG9iai5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZSA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2VPYmplY3QpO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZVJlYWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gbWVzc2FnZU9iamVjdC5nZXRSZWNlaXZlclR5cGUoKSkge1xuICAgICAgICAgIENvbWV0Q2hhdC5Db21ldENoYXRIZWxwZXIuZ2V0Q29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0XG4gICAgICAgICAgKS50aGVuKChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlT2JqZWN0IGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk7XG4gICAgICAgICAgICAgIHRoaXMucmVzZXRVbnJlYWRDb3VudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEVuZGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKGNhbGwgJiYgT2JqZWN0LmtleXMoY2FsbCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEFjY2VwdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxBY2NlcHRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZT8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tVXNlcih1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIChlbGVtZW50LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkgPT1cbiAgICAgICAgdXNlci5nZXRVaWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoXG4gICAgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICApOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIChlbGVtZW50LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PVxuICAgICAgICBncm91cC5nZXRHdWlkKClcbiAgICApO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJzYXRpb25MaXN0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChjaGFuZ2VbXCJhY3RpdmVDb252ZXJzYXRpb25cIl0pIHtcbiAgICAgICAgdGhpcy5yZXNldFVucmVhZENvdW50KCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGFuZ2VbXCJjb252ZXJzYXRpb25zU3R5bGVcIl0pIHtcbiAgICAgICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIFdoZW4gdXNlciBzZW5kcyBtZXNzYWdlIGNvbnZlcnNhdGlvbkxpc3QgaXMgdXBkYXRlZCB3aXRoIGxhdGVzdCBtZXNzYWdlXG4gICAgICAgKi9cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8vIGdldHRpbmcgZGVmYXVsdCBjb252ZXJzYXRpb24gb3B0aW9uIGFuZCBhZGRpbmcgY2FsbGJhY2sgaW4gaXRcbiAgc2V0Q29udmVyc2F0aW9uT3B0aW9ucygpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY29udmVyc2F0aW9uT3B0aW9ucyA9IENvbnZlcnNhdGlvblV0aWxzLmdldERlZmF1bHRPcHRpb25zKCk7XG4gICAgdGhpcy5jb252ZXJzYXRpb25PcHRpb25zLmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE9wdGlvbikgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICAhZWxlbWVudC5vbkNsaWNrICYmXG4gICAgICAgIGVsZW1lbnQuaWQgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuQ29udmVyc2F0aW9uT3B0aW9ucy5kZWxldGVcbiAgICAgICkge1xuICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLmRlbGV0ZUNvbnZlcnNhdGlvbk9uQ2xpY2s7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIHJlc2V0IHVucmVhZCBjb3VudFxuICBvbkNsaWNrKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmICh0aGlzLm9uSXRlbUNsaWNrKSB7XG4gICAgICB0aGlzLm9uSXRlbUNsaWNrKGNvbnZlcnNhdGlvbik7XG4gICAgfVxuICB9XG4gIC8vIHNldCB1bnJlYWQgY291bnRcbiAgcmVzZXRVbnJlYWRDb3VudCgpIHtcbiAgICBpZiAodGhpcy5hY3RpdmVDb252ZXJzYXRpb24pIHtcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbmxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFtcbiAgICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgXTtcbiAgICAgIC8vR2V0cyB0aGUgaW5kZXggb2YgdXNlciB3aGljaCBjb21lcyBvZmZsaW5lL29ubGluZVxuICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gY29udmVyc2F0aW9ubGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqPy5nZXRDb252ZXJzYXRpb25JZCgpID09PVxuICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICApO1xuICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgIGNvbnZlcnNhdGlvbmxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9IGNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lc3NhZ2VDb3VudCgwKTtcbiAgICAgICAgLy9uZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAobmV3Q29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKT8uc2V0TXVpZChcbiAgICAgICAgICB0aGlzLmdldFVpbngoKVxuICAgICAgICApO1xuICAgICAgICBjb252ZXJzYXRpb25saXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIG5ld0NvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25saXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyBzZXRzIHByb3BlcnR5IGZyb20gdGhlbWUgdG8gc3R5bGUgb2JqZWN0XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpO1xuICAgIHRoaXMuc2V0QmFkZ2VTdHlsZSgpO1xuICAgIHRoaXMuc2V0Q29uZmlybURpYWxvZ1N0eWxlKCk7XG4gICAgdGhpcy5zZXRDb252ZXJzYXRpb25zU3R5bGUoKTtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKTtcbiAgICB0aGlzLnNldFJlY2VpcHRTdHlsZSgpO1xuICAgIHRoaXMuc3RhdHVzQ29sb3IucHJpdmF0ZSA9XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5vbmxpbmUgPSB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ub25saW5lU3RhdHVzQ29sb3I7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wYXNzd29yZCA9XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kO1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgIH07XG4gICAgdGhpcy5pY29uU3R5bGUuaWNvblRpbnQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpO1xuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI5NyVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgfSk7XG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9O1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlLFxuICAgIH07XG4gIH1cbiAgc2V0Q29udmVyc2F0aW9uc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbnZlcnNhdGlvbnNTdHlsZSA9IG5ldyBDb252ZXJzYXRpb25zU3R5bGUoe1xuICAgICAgbGFzdE1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBsYXN0TWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kOiBcIlJHQigyNDcsIDE2NSwgMClcIixcbiAgICAgIHR5cGluZ0luZGljdG9yVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHR5cGluZ0luZGljdG9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGhyZWFkSW5kaWNhdG9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICB0aHJlYWRJbmRpY2F0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jb252ZXJzYXRpb25zU3R5bGUgfTtcbiAgfVxuICBzZXREYXRlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogRGF0ZVN0eWxlID0gbmV3IERhdGVTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9KTtcbiAgICB0aGlzLmRhdGVTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmRhdGVTdHlsZSB9O1xuICB9XG4gIHNldFJlY2VpcHRTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBSZWNlaXB0U3R5bGUgPSBuZXcgUmVjZWlwdFN0eWxlKHtcbiAgICAgIHdhaXRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIHNlbnRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlbGl2ZXJlZEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcmVhZEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGVycm9ySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgICB3aWR0aDogXCIyMHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCJcbiAgICB9KTtcbiAgICB0aGlzLnJlY2VpcHRTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnJlY2VpcHRTdHlsZSB9O1xuICB9XG4gIHNldEJhZGdlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFkZ2VTdHlsZSA9IG5ldyBCYWRnZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmJhZGdlU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5iYWRnZVN0eWxlIH07XG4gIH1cbiAgc2V0Q29uZmlybURpYWxvZ1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIzNTBweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLmRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlLFxuICAgIH07XG4gIH1cbiAgLy8gY2hlY2tpbmcgaWYgdXNlciBoYXMgaGlzIG93biBjb25maWd1cmF0aW9uIGVsc2Ugd2lsbCB1c2UgZGVmYXVsdCBjb25maWd1cmF0aW9uXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtPYmplY3Q9e319IGNvbmZpZ1xuICAgKiBAcGFyYW0gIHtPYmplY3R9IGRlZmF1bHRDb25maWc/XG4gICAqIEByZXR1cm5zIGRlZmF1bHRDb25maWdcbiAgICovXG4gIC8vIGNhbGxpbmcgc3VidGl0bGUgY2FsbGJhY2sgZnJvbSBjb25maWd1cmF0aW9uc1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbn0gY29udmVyc2F0aW9uXG4gICAqL1xuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgY292ZXJzYXRpb24gYmFzZWQgb24gdGhlIGNvbnZlcnNhdGlvblJlcXVlc3QgY29uZmlnXG4gICAqL1xuICBmZXRjaE5leHRDb252ZXJzYXRpb24oKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdEJ1aWxkZXIuZmV0Y2hOZXh0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpICYmXG4gICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2UpLmdldElkKCkgPT1cbiAgICAgICAgbWVzc2FnZT8uZ2V0SWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uRWRpdGVkRGVsZXRlZChtZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIGF0dGFjaGVzIExpc3RlbmVycyBmb3IgdXNlciBhY3Rpdml0eSAsIGdyb3VwIGFjdGl2aXRpZXMgYW5kIGNhbGxpbmdcbiAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBhdHRhY2hMaXN0ZW5lcnMoY2FsbGJhY2s6IGFueSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UgJiYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikpIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSxcbiAgICAgICAgICAgICAgICBvbmxpbmVVc2VyXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBvYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vZmZsaW5lLFxuICAgICAgICAgICAgICAgIG9mZmxpbmVVc2VyXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCkge1xuICAgICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmdyb3VwTGlzdGVuZXJJZCxcbiAgICAgICAgICBuZXcgQ29tZXRDaGF0Lkdyb3VwTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgICAgICBtZXNzYWdlOiBhbnksXG4gICAgICAgICAgICAgIGNoYW5nZWRVc2VyOiBhbnksXG4gICAgICAgICAgICAgIG5ld1Njb3BlOiBhbnksXG4gICAgICAgICAgICAgIG9sZFNjb3BlOiBhbnksXG4gICAgICAgICAgICAgIGNoYW5nZWRHcm91cDogYW55XG4gICAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKFxuICAgICAgICAgICAgICBtZXNzYWdlOiBhbnksXG4gICAgICAgICAgICAgIGtpY2tlZFVzZXI6IGFueSxcbiAgICAgICAgICAgICAga2lja2VkQnk6IGFueSxcbiAgICAgICAgICAgICAga2lja2VkRnJvbTogYW55XG4gICAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0ga2lja2VkVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uRnJvbU1lc3NhZ2Uoa2lja2VkRnJvbSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Hcm91cE1lbWJlckJhbm5lZDogKFxuICAgICAgICAgICAgICBtZXNzYWdlOiBhbnksXG4gICAgICAgICAgICAgIGJhbm5lZFVzZXI6IGFueSxcbiAgICAgICAgICAgICAgYmFubmVkQnk6IGFueSxcbiAgICAgICAgICAgICAgYmFubmVkRnJvbTogYW55XG4gICAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0gYmFubmVkVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoYmFubmVkRnJvbSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uTWVtYmVyQWRkZWRUb0dyb3VwOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkOiBhbnksXG4gICAgICAgICAgICAgIHVzZXJBZGRlZEJ5OiBhbnksXG4gICAgICAgICAgICAgIHVzZXJBZGRlZEluOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyTGVmdDogKG1lc3NhZ2U6IGFueSwgbGVhdmluZ1VzZXI6IGFueSwgZ3JvdXA6IGFueSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVySm9pbmVkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgam9pbmVkVXNlcjogYW55LFxuICAgICAgICAgICAgICBqb2luZWRHcm91cDogYW55XG4gICAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgICB0aGlzLmNhbGxMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkNhbGxFbmRlZE1lc3NhZ2VSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgLy8gU0RLIGxpc3RlbmVyc1xuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKHRleHRNZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIHRleHRNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lZGlhTWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIG1lZGlhTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGN1c3RvbU1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBjdXN0b21NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChmb3JtTWVzc2FnZTogRm9ybU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBmb3JtTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGZvcm1NZXNzYWdlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgZm9ybU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGNhcmRNZXNzYWdlOiBDYXJkTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGNhcmRNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGN1c3RvbU1lc3NhZ2U6IEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWQuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gbWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkpKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtBc1JlYWQobWVzc2FnZVJlY2VpcHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChkZWxldGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgZGVsZXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChlZGl0ZWRNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVELFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGVkaXRlZE1lc3NhZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzRGVsaXZlcmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBtZXNzYWdlUmVjZWlwdD8uZ2V0UmVjZWl2ZXJUeXBlKCkpKSB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlRGVsaXZlcmVkTWVzc2FnZShtZXNzYWdlUmVjZWlwdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVHlwaW5nU3RhcnRlZC5zdWJzY3JpYmUoXG4gICAgICAgICh0eXBpbmdJbmRpY2F0b3I6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gdHlwaW5nSW5kaWNhdG9yPy5nZXRSZWNlaXZlclR5cGUoKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmcpIHtcbiAgICAgICAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IgPSB0eXBpbmdJbmRpY2F0b3I7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25UeXBpbmdFbmRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAgICh0eXBpbmdJbmRpY2F0b3I6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gdHlwaW5nSW5kaWNhdG9yPy5nZXRSZWNlaXZlclR5cGUoKSkge1xuICAgICAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmZXRjaE5ld0NvbnZlcnNhdGlvbnMoKSB7XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyLmJ1aWxkKCk7XG4gICAgaWYgKHRoaXMucmVxdWVzdEJ1aWxkZXI/LmdldENvbnZlcnNhdGlvblR5cGUoKSkge1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25UeXBlID0gdGhpcy5yZXF1ZXN0QnVpbGRlci5nZXRDb252ZXJzYXRpb25UeXBlKCk7XG4gICAgfVxuICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFtdO1xuICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uKFN0YXRlcy5sb2FkZWQpO1xuICB9XG4gIHJlbW92ZUNvbnZlcnNhdGlvbkZyb21NZXNzYWdlKGdyb3VwOiBDb21ldENoYXQuR3JvdXApIHtcbiAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGdyb3VwKVxuICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uTGlzdChjb252ZXJzYXRpb24pXG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnNcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVycygpIHtcbiAgICB0cnkge1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZVVzZXJMaXN0ZW5lcih0aGlzLnVzZXJMaXN0ZW5lcklkKTtcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVHcm91cExpc3RlbmVyKHRoaXMuZ3JvdXBMaXN0ZW5lcklkKTtcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVDb25uZWN0aW9uTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCk7XG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZUVkaXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25UeXBpbmdTdGFydGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblR5cGluZ0VuZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogRmV0Y2hlcyBDb252ZXJzYXRpb25zIERldGFpbHMgd2l0aCBhbGwgdGhlIHVzZXJzXG4gICAqL1xuICBnZXRDb252ZXJzYXRpb24gPSAoc3RhdGVzOiBTdGF0ZXMgPSBTdGF0ZXMubG9hZGluZykgPT4ge1xuICAgIGlmIChcbiAgICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgJiZcbiAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbiAmJlxuICAgICAgKCh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgPT0gMCB8fFxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlICE9XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi50b3RhbF9wYWdlcylcbiAgICApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZXM7XG4gICAgICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgICAgICAgIHRoaXMuZmV0Y2hOZXh0Q29udmVyc2F0aW9uKClcbiAgICAgICAgICAgICAgLnRoZW4oKGNvbnZlcnNhdGlvbkxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3QuZm9yRWFjaChcbiAgICAgICAgICAgICAgICAgIChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09XG4gICAgICAgICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldFVucmVhZE1lc3NhZ2VDb3VudCgwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29udmVyc2F0aW9uLnNldFVucmVhZE1lbnRpb25Jbk1lc3NhZ2VDb3VudCgwKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZXMgPT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbXG4gICAgICAgICAgICAgICAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgICAgICAgICAgICAgICAgLi4uY29udmVyc2F0aW9uTGlzdCxcbiAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC5sZW5ndGggPD0gMCAmJlxuICAgICAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0Py5sZW5ndGggPD0gMFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmVtcHR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lbXB0eTtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7IC8vIERldGFjaCB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGFjaCgpOyAvLyBEZXRhY2ggdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0UmVsb2FkKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RSZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb252ZXJzYXRpb25MaXN0Py5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgaXNSZWNlaXB0RGlzYWJsZShjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBsZXQgaXRlbTogYW55ID0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKTtcbiAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKCk7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuZGlzYWJsZVJlY2VpcHQgJiZcbiAgICAgIG1lc3NhZ2UgJiZcbiAgICAgICFtZXNzYWdlPy5nZXREZWxldGVkQXQoKSAmJlxuICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbiAmJlxuICAgICAgbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJlxuICAgICAgKCF0aGlzLnR5cGluZ0luZGljYXRvciB8fFxuICAgICAgICAoaXRlbT8udWlkICE9IHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVySWQoKSAmJlxuICAgICAgICAgIGl0ZW0/Lmd1aWQgIT0gdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpKSkgJiZcbiAgICAgIG1lc3NhZ2UuZ2V0U2VuZGVyKCk/LmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNvbnZlcnNhdGlvbiBsaXN0J3MgbGFzdCBtZXNzYWdlICwgYmFkZ2VDb3VudCAsIHVzZXIgcHJlc2VuY2UgYmFzZWQgb24gYWN0aXZpdGllcyBwcm9wYWdhdGVkIGJ5IGxpc3RlbmVyc1xuICAgKi9cbiAgY29udmVyc2F0aW9uVXBkYXRlZCA9IChcbiAgICBrZXk6IGFueSxcbiAgICBpdGVtOiBDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cCB8IG51bGwgPSBudWxsLFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICBvcHRpb25zID0gbnVsbFxuICApID0+IHtcbiAgICB0cnkge1xuICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vbmxpbmU6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub2ZmbGluZToge1xuICAgICAgICAgIHRoaXMudXBkYXRlVXNlcihpdGVtKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfUkVBRDoge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMSVZFUkVEOiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuVEVYVF9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQpIHtcbiAgICAgICAgICAgIHRoaXMubWFya01lc3NhZ2VBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQkFOTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5LSUNLRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5VTkJBTk5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0U6XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9FRElURUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVEOlxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uRWRpdGVkRGVsZXRlZChtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1hcmtNZXNzYWdlQXNEZWxpdmVyZWQgPSAobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgLy9pZiBjaGF0IHdpbmRvdyBpcyBub3Qgb3BlbiwgbWFyayBtZXNzYWdlIGFzIGRlbGl2ZXJlZFxuICAgIGlmIChcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICkge1xuICAgICAgaWYgKFxuICAgICAgICAoIXRoaXMuYWN0aXZlQ29udmVyc2F0aW9uIHx8XG4gICAgICAgICAgKFxuICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICAgICk/LmdldFVpZCgpICE9PSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkpICYmXG4gICAgICAgICFtZXNzYWdlLmhhc093blByb3BlcnR5KFwiZGVsaXZlcmVkQXRcIilcbiAgICAgICkge1xuICAgICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgICghdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gfHxcbiAgICAgICAgICAoXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICk/LmdldEd1aWQoKSAhPT0gbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpKSAmJlxuICAgICAgICAhbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImRlbGl2ZXJlZEF0XCIpXG4gICAgICApIHtcbiAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IHJlYWRNZXNzYWdlXG4gICAqL1xuICBnZXRVaW54ID0gKCkgPT4ge1xuICAgIHJldHVybiBTdHJpbmcoTWF0aC5yb3VuZCgrbmV3IERhdGUoKSAvIDEwMDApKTtcbiAgfTtcbiAgbWFya0FzUmVhZChyZWFkTWVzc2FnZTogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSB7XG4gICAgbGV0IGNvbnZlcnNhdGlvbmxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFsuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IGNvbnZlcnNhdGlvbmxpc3QuZmluZEluZGV4KFxuICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAgICAgICApLmdldFJlY2VpdmVySWQoKSA9PSByZWFkTWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKVxuICAgICk7XG4gICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqZWN0ITogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbjtcbiAgICAgIGlmIChcbiAgICAgICAgIShcbiAgICAgICAgICBjb252ZXJzYXRpb25saXN0W1xuICAgICAgICAgICAgY29udmVyc2F0aW9uS2V5XG4gICAgICAgICAgXS5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLmdldFJlYWRBdCgpXG4gICAgICApIHtcbiAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0ID0gY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICAoXG4gICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0LmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0UmVhZEF0KHJlYWRNZXNzYWdlLmdldFJlYWRBdCgpKTtcbiAgICAgICAgKFxuICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iamVjdC5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLnNldE11aWQodGhpcy5nZXRVaW54KCkpO1xuICAgICAgICBjb252ZXJzYXRpb25saXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIG5ld0NvbnZlcnNhdGlvbk9iamVjdCk7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25saXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyBEZXRhaWwgd2hlbiB1c2VyIGNvbWVzIG9ubGluZS9vZmZsaW5lXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfENvbWV0Q2hhdC5Hcm91cHxudWxsfSB1c2VyXG4gICAqL1xuICB1cGRhdGVVc2VyKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCkge1xuICAgIHRyeSB7XG4gICAgICAvL3doZW4gdXNlciB1cGRhdGVzXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25saXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbXG4gICAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgIF07XG4gICAgICAvL0dldHMgdGhlIGluZGV4IG9mIHVzZXIgd2hpY2ggY29tZXMgb2ZmbGluZS9vbmxpbmVcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IGNvbnZlcnNhdGlvbmxpc3QuZmluZEluZGV4KFxuICAgICAgICAoY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgICAgKGNvbnZlcnNhdGlvbk9iai5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpID09PVxuICAgICAgICAgICh1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICBjb252ZXJzYXRpb25saXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIGxldCBjb252ZXJzYXRpb25XaXRoT2JqOiBDb21ldENoYXQuVXNlciA9XG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcjtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aE9iai5zZXRTdGF0dXMoKHVzZXIgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFN0YXR1cygpKTtcbiAgICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9IGNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldENvbnZlcnNhdGlvbldpdGgoY29udmVyc2F0aW9uV2l0aE9iaik7XG4gICAgICAgIChuZXdDb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLnNldE11aWQoXG4gICAgICAgICAgdGhpcy5nZXRVaW54KClcbiAgICAgICAgKTtcbiAgICAgICAgY29udmVyc2F0aW9ubGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBuZXdDb252ZXJzYXRpb25PYmopO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBjb252ZXJzYXRpb25saXN0O1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBHZXRzIHRoZSBsYXN0IG1lc3NhZ2VcbiAgICogQHBhcmFtIGNvbnZlcnNhdGlvblxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgbWFrZUxhc3RNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCB7fSA9IHt9XG4gICkge1xuICAgIGNvbnN0IG5ld01lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHJldHVybiBuZXdNZXNzYWdlO1xuICB9XG4gIHVwZGF0ZUNvbnZlcnNhdGlvbldpdGhGb3JHcm91cChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBpZiAobWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCkge1xuXG4gICAgICBjb25zdCBpc1NhbWVHcm91cCA9IChtZXNzYWdlLmdldFJlY2VpdmVyKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCkgPT09XG4gICAgICAgIChtZXNzYWdlLmdldEFjdGlvbkZvcigpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpO1xuXG4gICAgICBpZiAoaXNTYW1lR3JvdXApIHtcbiAgICAgICAgbGV0IHVwZGF0ZWRHcm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwO1xuICAgICAgICB1cGRhdGVkR3JvdXAuc2V0TWVtYmVyc0NvdW50KChtZXNzYWdlLmdldEFjdGlvbkZvcigpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0TWVtYmVyc0NvdW50KCkpO1xuICAgICAgICBjb252ZXJzYXRpb24uc2V0Q29udmVyc2F0aW9uV2l0aCh1cGRhdGVkR3JvdXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICpcbiAgICogVXBkYXRlcyBDb252ZXJzYXRpb25zIGFzIFRleHQvQ3VzdG9tIE1lc3NhZ2VzIGFyZSByZWNlaXZlZFxuICAgKiBAcGFyYW1cbiAgICpcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gbm90aWZpY2F0aW9uXG4gICAqL1xuICB1cGRhdGVDb252ZXJzYXRpb24oXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIG5vdGlmaWNhdGlvbjogYm9vbGVhbiA9IHRydWVcbiAgKSB7XG4gICAgbGV0IG1ldGFkYXRhOiBhbnk7XG4gICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgICAgbWV0YWRhdGEgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5jaGVja0lmTGFzdE1lc3NhZ2VTaG91bGRVcGRhdGUobWVzc2FnZSkpIHtcbiAgICAgICAgdGhpcy5tYWtlQ29udmVyc2F0aW9uKG1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGxldCBpc0N1c3RvbU1lc3NhZ2U6IGJvb2xlYW4gPSBtZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbktleTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbkxpc3QgPSByZXNwb25zZS5jb252ZXJzYXRpb25MaXN0O1xuICAgICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgICAgICAgIC8vIGlmIHNlbmRlciBpcyBub3QgbG9nZ2VkIGluIHVzZXIgdGhlbiAgaW5jcmVtZW50IGNvdW50XG4gICAgICAgICAgICAgIGxldCB1bnJlYWRNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgICAgICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSB8fFxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpKVxuICAgICAgICAgICAgICAgICAgPyB0aGlzLm1ha2VVbnJlYWRNZXNzYWdlQ291bnQoY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICAgICAgOiB0aGlzLm1ha2VVbnJlYWRNZXNzYWdlQ291bnQoY29udmVyc2F0aW9uT2JqKSAtIDE7XG4gICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gdGhpcy5tYWtlTGFzdE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmpcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9IGNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZSwgbmV3Q29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShsYXN0TWVzc2FnZU9iaik7XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlLmdldENhdGVnb3J5KCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbikge1xuICAgICAgICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZXNzYWdlQ291bnQodW5yZWFkTWVzc2FnZUNvdW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbGFzdE1lc3NhZ2VPYmouZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGxldCB0aW1lc0xvZ2dlZEluVXNlcklzTWVudGlvbmVkID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBsYXN0TWVzc2FnZU9iai5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgICAgICAgICAgICAgIGlmIChtZW50aW9uZWRVc2Vycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIGZvciAoXG4gICAgICAgICAgICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaSA8IG1lbnRpb25lZFVzZXJzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEpO1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnVuc2hpZnQobmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiA9IG5ld0NvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uICYmXG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IGluY3JlbWVudENvdW50ID0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPyAxIDogMFxuICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmogPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKGxhc3RNZXNzYWdlT2JqKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZSwgY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlLmdldENhdGVnb3J5KCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZXNzYWdlQ291bnQoaW5jcmVtZW50Q291bnQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC51bnNoaWZ0KGNvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAhPSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICB1cGRhdGVEZWxpdmVyZWRNZXNzYWdlKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpIHtcbiAgICBsZXQgY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gWy4uLnRoaXMuY29udmVyc2F0aW9uTGlzdF07XG4gICAgbGV0IGNvbnZlcnNhdGlvbktleTogbnVtYmVyID0gY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoYzogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgKGMuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLmdldElkKCkgPT1cbiAgICAgICAgTnVtYmVyKG1lc3NhZ2VSZWNlaXB0LmdldE1lc3NhZ2VJZCgpKVxuICAgICk7XG4gICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbjtcbiAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgIGNvbnZlcnNhdGlvbk9iaiA9IGNvbnZlcnNhdGlvbkxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgIGlmIChcbiAgICAgICAgIShcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5nZXREZWxpdmVyZWRBdCgpXG4gICAgICApIHtcbiAgICAgICAgKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLnNldERlbGl2ZXJlZEF0KE51bWJlcih0aGlzLmdldFVpbngoKSkpO1xuICAgICAgICAoY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBHZXRzIFRoZSBDb3VudCBvZiBVbnJlYWQgTWVzc2FnZXNcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBjb252ZXJzYXRpb25cbiAgICogQHBhcmFtICB7YW55fSBvcGVyYXRvclxuICAgKi9cbiAgbWFrZVVucmVhZE1lc3NhZ2VDb3VudChcbiAgICBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24sXG4gICAgb3BlcmF0b3I6IGFueSA9IG51bGxcbiAgKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKGNvbnZlcnNhdGlvbikubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgbGV0IHVucmVhZE1lc3NhZ2VDb3VudDogbnVtYmVyID0gY29udmVyc2F0aW9uLmdldFVucmVhZE1lc3NhZ2VDb3VudCgpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpID09PVxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICApIHtcbiAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCArPSAxO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAodGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uaGFzT3duUHJvcGVydHkoXCJndWlkXCIpICYmXG4gICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkuaGFzT3duUHJvcGVydHkoXCJndWlkXCIpICYmXG4gICAgICAgIChcbiAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkuZ2V0R3VpZCgpID09PVxuICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSkgfHxcbiAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5oYXNPd25Qcm9wZXJ0eShcInVpZFwiKSAmJlxuICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpLmhhc093blByb3BlcnR5KFwidWlkXCIpICYmXG4gICAgICAgIChcbiAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgKS5nZXRVaWQoKSA9PT1cbiAgICAgICAgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpKVxuICAgICkge1xuICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wZXJhdG9yICYmIG9wZXJhdG9yID09PSBcImRlY3JlbWVudFwiKSB7XG4gICAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCA9IHVucmVhZE1lc3NhZ2VDb3VudCA/IHVucmVhZE1lc3NhZ2VDb3VudCAtIDEgOiAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ID0gdW5yZWFkTWVzc2FnZUNvdW50ICsgMTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVucmVhZE1lc3NhZ2VDb3VudDtcbiAgfVxuICAvKipcbiAgICogQ2hhbmdlcyBkZXRhaWwgb2YgY29udmVyc2F0aW9uc1xuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1ha2VDb252ZXJzYXRpb24obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBjb252ZXJzYXRpb25LZXk6IG51bWJlciA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgIGM/LmdldENvbnZlcnNhdGlvbklkKCkgPT09IG1lc3NhZ2U/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID49IDApIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgIGNvbnZlcnNhdGlvbktleTogY29udmVyc2F0aW9uS2V5LFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iajogY29udmVyc2F0aW9uLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Q6IHRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDb21ldENoYXQuQ29tZXRDaGF0SGVscGVyLmdldENvbnZlcnNhdGlvbkZyb21NZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbldpdGgoKSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5Hcm91cCAmJlxuICAgICAgICAgICAgICAhKFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgICAgICkuZ2V0U2NvcGUoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICAgICApLnNldEhhc0pvaW5lZCh0cnVlKTtcbiAgICAgICAgICAgICAgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5zZXRTY29wZShcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlclNjb3BlLnBhcnRpY2lwYW50XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uS2V5OiAtMSxcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqOiBjb252ZXJzYXRpb24sXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Q6IHRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gcmVqZWN0KGVycm9yKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgQ29udmVyc2F0aW9uIFZpZXcgd2hlbiBtZXNzYWdlIGlzIGVkaXRlZCBvciBkZWxldGVkXG4gICAqL1xuICBjb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1ha2VDb252ZXJzYXRpb24obWVzc2FnZSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSByZXNwb25zZS5jb252ZXJzYXRpb25LZXk7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICAgIHJlc3BvbnNlLmNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25MaXN0ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uTGlzdDtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID1cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCk7XG4gICAgICAgICAgICBpZiAobGFzdE1lc3NhZ2VPYmouZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRJZCgpKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICAgICAgICApLnNldE11aWQodGhpcy5nZXRVaW54KCkpO1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIGNvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBJZiBVc2VyIHNjcm9sbHMgdG8gdGhlIGJvdHRvbSBvZiB0aGUgY3VycmVudCBDb252ZXJzYXRpb24gbGlzdCB0aGFuIGZldGNoIG5leHQgaXRlbXMgb2YgdGhlIENvbnZlcnNhdGlvbiBsaXN0IGFuZCBhcHBlbmRcbiAgICogQHBhcmFtIEV2ZW50XG4gICAqL1xuICAvKipcbiAgICogUGxheXMgQXVkaW8gV2hlbiBNZXNzYWdlIGlzIFJlY2VpdmVkXG4gICAqL1xuICBwbGF5QXVkaW8oKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShcbiAgICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5Tb3VuZC5pbmNvbWluZ01lc3NhZ2VGcm9tT3RoZXJcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qXG4gICAqIFVwZGF0ZXMgdGhlIGNvbnZlc2F0aW9uIGxpc3Qgd2hlbiBkZWxldGVkLlxuICAgKiBBZGRpbmcgQ29udmVyc2F0aW9uIE9iamVjdCB0byBDb21ldGNoYXRTZXJ2aWNlXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbnx7fX0gY29udmVyc2F0aW9uXG4gICAqL1xuICB1cGRhdGVDb252ZXJzYXRpb25MaXN0KGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwpIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGVsZW1lbnQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGVsZW1lbnQ/LmdldENvbnZlcnNhdGlvbklkKCkgPT0gY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgKTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIHNob3dpbmcgZGlhbG9nIGZvciBjb25maXJtIGFuZCBjYW5jZWxcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbnx7fX0gY29udmVyc2F0aW9uXG4gICAqL1xuICBzaG93Q29uZmlybWF0aW9uRGlhbG9nID0gKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgIHRoaXMuaXNEaWFsb2dPcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gY29udmVyc2F0aW9uO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgb25PcHRpb25DbGljayhldmVudDogYW55LCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBsZXQgb3B0aW9uOiBDb21ldENoYXRPcHRpb24gPSBldmVudD8uZGV0YWlsPy5kYXRhO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBjb252ZXJzYXRpb247XG4gICAgaWYgKG9wdGlvbikge1xuICAgICAgb3B0aW9uLm9uQ2xpY2shKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBzaG93IGNvbmZpcm0gZGlhbG9nIHNjcmVlblxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRvblxuICAgKi9cbiAgLy8gY2hlY2sgaXMgdGhlcmUgaXMgYW55IGFjdGl2ZSBjb252ZXJzYXRpb24gYW5kIG1hcmsgaXQgYXMgYWN0aXZlXG4gIGdldEFjdGl2ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBpZiAodGhpcy5zZWxlY3Rpb25Nb2RlID09IFNlbGVjdGlvbk1vZGUubm9uZSB8fCAhdGhpcy5zZWxlY3Rpb25Nb2RlKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAodGhpcy5hY3RpdmVDb252ZXJzYXRpb24gYXMgYW55KT8uY29udmVyc2F0aW9uSWQgPT1cbiAgICAgICAgKGNvbnZlcnNhdGlvbiBhcyBhbnkpPy5jb252ZXJzYXRpb25JZFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogaGFuZGxlIGNvbmZpcm0gZGlhbG9nIHJlc3BvbnNlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdmFsdWVcbiAgICovXG4gIC8vIGNhbGxpbmcgY29tZXRjaGF0LmRlbGV0ZUNvbnZlcnNhdGlvbiBtZXRob2RcbiAgZGVsZXRlU2VsZWN0ZWRDb252ZXJzYXRpb24oKSB7XG4gICAgaWYgKHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgICBsZXQgY29udmVyc2F0aW9uV2l0aDtcbiAgICAgIGxldCBjb252ZXJzYXRpb25UeXBlID0gdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZC5nZXRDb252ZXJzYXRpb25UeXBlKCk7XG4gICAgICBpZiAoXG4gICAgICAgIGNvbnZlcnNhdGlvblR5cGUgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgKSB7XG4gICAgICAgIGNvbnZlcnNhdGlvbldpdGggPSAoXG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZC5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgKS5nZXRVaWQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnZlcnNhdGlvbldpdGggPSAoXG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZC5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkuZ2V0R3VpZCgpO1xuICAgICAgfVxuICAgICAgQ29tZXRDaGF0LmRlbGV0ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb25XaXRoLCBjb252ZXJzYXRpb25UeXBlKS50aGVuKFxuICAgICAgICAoZGVsZXRlZENvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdENvbnZlcnNhdGlvbkV2ZW50cy5jY0NvbnZlcnNhdGlvbkRlbGV0ZWQubmV4dChcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQhXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QodGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCk7XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5pc0RpYWxvZ09wZW4gPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgLy8gZXhwb3NlZCBtZXRob2RzIHRvIHVzZXJzLlxuICB1cGRhdGVMYXN0TWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgfVxuICByZW1vdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KGNvbnZlcnNhdGlvbik7XG4gIH1cbiAgc3R5bGVzOiBhbnkgPSB7XG4gICAgd3JhcHBlclN0eWxlOiAoKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBoZWlnaHQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmhlaWdodCxcbiAgICAgICAgd2lkdGg6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLndpZHRoLFxuICAgICAgICBib3JkZXI6XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuYm9yZGVyIHx8XG4gICAgICAgICAgYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCl9YCxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICAgIGJhY2tncm91bmQ6XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuYmFja2dyb3VuZCB8fFxuICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgfTtcbiAgICB9LFxuICB9O1xuICBzdWJ0aXRsZVN0eWxlID0gKGNvbnZlcnNhdGlvbjogYW55KSA9PiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IgJiZcbiAgICAgICgodGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJUeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFNlbmRlcigpLmdldFVpZCgpID09XG4gICAgICAgIGNvbnZlcnNhdGlvbi5jb252ZXJzYXRpb25XaXRoPy51aWQpIHx8XG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVySWQoKSA9PVxuICAgICAgICBjb252ZXJzYXRpb24uY29udmVyc2F0aW9uV2l0aD8uZ3VpZClcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZvbnQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnR5cGluZ0luZGljdG9yVGV4dENvbG9yLFxuICAgICAgICBjb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudHlwaW5nSW5kaWN0b3JUZXh0Q29sb3IsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUubGFzdE1lc3NhZ2VUZXh0Rm9udCxcbiAgICAgIGNvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sYXN0TWVzc2FnZVRleHRDb2xvcixcbiAgICB9O1xuICB9O1xuICBpdGVtVGhyZWFkSW5kaWNhdG9yU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRGb250OlxuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aHJlYWRJbmRpY2F0b3JUZXh0Rm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOlxuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aHJlYWRJbmRpY2F0b3JUZXh0Q29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICB9O1xuICB9O1xufVxuIiwiPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNcIiBbbmdTdHlsZV09XCJzdHlsZXMud3JhcHBlclN0eWxlKClcIj5cbiAgPGNvbWV0Y2hhdC1iYWNrZHJvcCBbYmFja2Ryb3BTdHlsZV09XCJiYWNrZHJvcFN0eWxlXCIgKm5nSWY9XCJpc0RpYWxvZ09wZW5cIj5cbiAgICA8Y29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nIFt0aXRsZV09XCJjb25maXJtRGlhbG9nVGl0bGVcIlxuICAgICAgW21lc3NhZ2VUZXh0XT1cImNvbmZpcm1EaWFsb2dNZXNzYWdlXCIgW2NhbmNlbEJ1dHRvblRleHRdPVwiY2FuY2VsQnV0dG9uVGV4dFwiXG4gICAgICBbY29uZmlybUJ1dHRvblRleHRdPVwiY29uZmlybUJ1dHRvblRleHRcIlxuICAgICAgKGNjLWNvbmZpcm0tY2xpY2tlZCk9XCJvbkNvbmZpcm1DbGljaygpXCJcbiAgICAgIChjYy1jYW5jZWwtY2xpY2tlZCk9XCJvbkNhbmNlbENsaWNrKClcIlxuICAgICAgW2NvbmZpcm1EaWFsb2dTdHlsZV09XCJkZWxldGVDb252ZXJzYXRpb25EaWFsb2dTdHlsZVwiPlxuICAgIDwvY29tZXRjaGF0LWNvbmZpcm0tZGlhbG9nPlxuICA8L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX21lbnVzXCIgKm5nSWY9XCJtZW51XCI+XG5cbiAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwibWVudVwiPlxuICAgIDwvbmctY29udGFpbmVyPlxuXG4gIDwvZGl2PlxuICA8Y29tZXRjaGF0LWxpc3QgW3N0YXRlXT1cInN0YXRlXCIgW3NlYXJjaEljb25VUkxdPVwic2VhcmNoSWNvblVSTFwiXG4gICAgW2hpZGVFcnJvcl09XCJoaWRlRXJyb3JcIiBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIlxuICAgIFtsb2FkaW5nSWNvblVSTF09XCJsb2FkaW5nSWNvblVSTFwiIFt0aXRsZUFsaWdubWVudF09XCJ0aXRsZUFsaWdubWVudFwiXG4gICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIiBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIlxuICAgIFtlcnJvclN0YXRlVmlld109XCJlcnJvclN0YXRlVmlld1wiIFtvblNjcm9sbGVkVG9Cb3R0b21dPVwiZ2V0Q29udmVyc2F0aW9uXCJcbiAgICBbbGlzdF09XCJjb252ZXJzYXRpb25MaXN0XCJcbiAgICBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtVmlldyA/IGxpc3RJdGVtVmlldyA6IGxpc3RJdGVtXCIgW3RpdGxlXT1cInRpdGxlXCJcbiAgICBbaGlkZVNlYXJjaF09XCJoaWRlU2VhcmNoXCI+PC9jb21ldGNoYXQtbGlzdD5cbjwvZGl2PlxuPG5nLXRlbXBsYXRlICNsaXN0SXRlbSBsZXQtY29udmVyc2F0aW9uPlxuICA8Y29tZXRjaGF0LWxpc3QtaXRlbSBbaGlkZVNlcGFyYXRvcl09XCJoaWRlU2VwYXJhdG9yXCJcbiAgICBbYXZhdGFyU3R5bGVdPVwiYXZhdGFyU3R5bGVcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JTdHlsZV09XCJzZXRTdGF0dXNJbmRpY2F0b3JTdHlsZShjb252ZXJzYXRpb24pXCJcbiAgICBbaWRdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25JZFwiXG4gICAgW2lzQWN0aXZlXT1cImdldEFjdGl2ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb24pXCJcbiAgICAoY2MtbGlzdGl0ZW0tY2xpY2tlZCk9XCJvbkNsaWNrKGNvbnZlcnNhdGlvbilcIlxuICAgIFt0aXRsZV09XCJjb252ZXJzYXRpb24/LmNvbnZlcnNhdGlvbldpdGg/Lm5hbWVcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JJY29uXT1cImNoZWNrR3JvdXBUeXBlKGNvbnZlcnNhdGlvbilcIlxuICAgIFtzdGF0dXNJbmRpY2F0b3JDb2xvcl09XCJjaGVja1N0YXR1c1R5cGUoY29udmVyc2F0aW9uKVwiXG4gICAgW2xpc3RJdGVtU3R5bGVdPVwibGlzdEl0ZW1TdHlsZVwiXG4gICAgW2F2YXRhclVSTF09XCJjb252ZXJzYXRpb24/LmNvbnZlcnNhdGlvbldpdGg/LmF2YXRhclwiXG4gICAgW2F2YXRhck5hbWVdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5uYW1lXCI+XG4gICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXc7ZWxzZSBjb252ZXJzYXRpb25TdWJ0aXRsZVwiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gICAgPG5nLXRlbXBsYXRlICNjb252ZXJzYXRpb25TdWJ0aXRsZT5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3N1YnRpdGxlLXZpZXcgXCIgc2xvdD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fdGhyZWFkdmlld1wiXG4gICAgICAgICAgKm5nSWY9XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlPy5wYXJlbnRNZXNzYWdlSWRcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFtsYWJlbFN0eWxlXT1cIml0ZW1UaHJlYWRJbmRpY2F0b3JTdHlsZSgpXCJcbiAgICAgICAgICAgIFt0ZXh0XT1cInRocmVhZEluZGljYXRvclRleHRcIj4gPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1pY29uIFtVUkxdPVwidGhyZWFkSWNvblVSTFwiXG4gICAgICAgICAgICBbaWNvblN0eWxlXT1cImljb25TdHlsZVwiPjwvY29tZXRjaGF0LWljb24+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19zdWJ0aXRsZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19yZWFkcmVjZWlwdFwiXG4gICAgICAgICAgICAqbmdJZj1cImlzUmVjZWlwdERpc2FibGUoY29udmVyc2F0aW9uKVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cInJlY2VpcHRTdHlsZVwiIFtzZW50SWNvbl09XCJzZW50SWNvblwiXG4gICAgICAgICAgICAgIFtlcnJvckljb25dPVwiZXJyb3JJY29uXCIgW2RlbGl2ZXJlZEljb25dPVwiZGVsaXZlcmVkSWNvblwiXG4gICAgICAgICAgICAgIFtyZWFkSWNvbl09XCJyZWFkSWNvblwiPjwvY29tZXRjaGF0LXJlY2VpcHQ+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoY29udmVyc2F0aW9uKVwiIGNsYXNzPVwiY2Mtc3VidGl0bGVfX3RleHRcIlxuICAgICAgICAgICAgW2lubmVySFRNTF09XCJzZXRTdWJ0aXRsZShjb252ZXJzYXRpb24pXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICA8L2Rpdj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxkaXYgc2xvdD1cIm1lbnVWaWV3XCIgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19vcHRpb25zdmlld1wiXG4gICAgICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgPGRpdiAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cIm9uT3B0aW9uQ2xpY2soJGV2ZW50LGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgIFttZW51TGlzdFN0eWxlXT1cIm1lbnVzdHlsZVwiPlxuXG4gICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cIiFvcHRpb25zICYmIGNvbnZlcnNhdGlvbk9wdGlvbnNcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwiY29udmVyc2F0aW9uT3B0aW9uc1wiXG4gICAgICAgICAgKGNjLW1lbnUtY2xpY2tlZCk9XCJvbk9wdGlvbkNsaWNrKCRldmVudCxjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICBbbWVudUxpc3RTdHlsZV09XCJtZW51c3R5bGVcIj5cblxuICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fdGFpbC12aWV3XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFpbF9fdmlld1wiXG4gICAgICAgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5ub25lICYmIGNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2VcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRhdGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgKm5nSWY9XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlXCJcbiAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZGF0ZVN0eWxlXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwiY29udmVyc2F0aW9uPy5sYXN0TWVzc2FnZT8uc2VudEF0XCJcbiAgICAgICAgICAgIFtwYXR0ZXJuXT1cImdldERhdGUoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fYmFkZ2VcIj5cbiAgICAgICAgICA8IS0tIDxjb21ldGNoYXQtaWNvbiAqbmdJZj1cImNvbnZlcnNhdGlvbj8uZ2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KClcIiBbbmdTdHlsZV09XCJnZXRVbnJlYWRNZW50aW9uc0ljb25TdHlsZSgpXCIgW2ljb25TdHlsZV09Z2V0TWVudGlvbkljb25TdHlsZSgpIFtVUkxdPVwibWVudGlvbnNJY29uVVJMXCI+PC9jb21ldGNoYXQtaWNvbj4gLS0+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1iYWRnZSBbY291bnRdPVwiY29udmVyc2F0aW9uPy51bnJlYWRNZXNzYWdlQ291bnRcIlxuICAgICAgICAgICAgW2JhZGdlU3R5bGVdPVwiYmFkZ2VTdHlsZVwiPjwvY29tZXRjaGF0LWJhZGdlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3NlbGVjdGlvbi12aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgPG5nLXRlbXBsYXRlICN0YWlsVmlldz5cbiAgICA8ZGl2ICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIj5cbiAgICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uXG4gICAgICAgIChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbiwkZXZlbnQpXCI+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCI+XG4gICAgICA8Y29tZXRjaGF0LWNoZWNrYm94XG4gICAgICAgIChjYy1jaGVja2JveC1jaGFuZ2VkKT1cIm9uQ29udmVyc2F0aW9uU2VsZWN0ZWQoY29udmVyc2F0aW9uLCRldmVudClcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cbiAgICA8L2Rpdj5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvbmctdGVtcGxhdGU+XG4iXX0=