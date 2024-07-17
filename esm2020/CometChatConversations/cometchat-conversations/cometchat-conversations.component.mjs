import "@cometchat/uikit-elements";
import { AvatarStyle, BadgeStyle, ConfirmDialogStyle, DateStyle, ListItemStyle, ReceiptStyle, } from "@cometchat/uikit-elements";
import { CometChatSoundManager, CometChatUIKitUtility, ConversationUtils, ConversationsStyle, ListStyle, MessageReceiptUtils, } from "@cometchat/uikit-shared";
import { CometChatCallEvents, CometChatConversationEvents, CometChatGroupEvents, CometChatMessageEvents, CometChatUIKitConstants, CometChatUserEvents, DatePatterns, MentionsTargetElement, MessageStatus, SelectionMode, States, TitleAlignment, fontHelper, localize, } from "@cometchat/uikit-resources";
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
                newConversationObject.setUnreadMessageCount(0);
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
CometChatConversationsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatConversationsComponent, selector: "cometchat-conversations", inputs: { subtitleView: "subtitleView", title: "title", options: "options", searchPlaceHolder: "searchPlaceHolder", disableUsersPresence: "disableUsersPresence", disableReceipt: "disableReceipt", disableTyping: "disableTyping", deliveredIcon: "deliveredIcon", readIcon: "readIcon", errorIcon: "errorIcon", datePattern: "datePattern", onError: "onError", sentIcon: "sentIcon", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", customSoundForMessages: "customSoundForMessages", activeConversation: "activeConversation", searchIconURL: "searchIconURL", hideSearch: "hideSearch", conversationsRequestBuilder: "conversationsRequestBuilder", emptyStateView: "emptyStateView", onSelect: "onSelect", loadingIconURL: "loadingIconURL", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", listItemView: "listItemView", menu: "menu", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", disableSoundForMessages: "disableSoundForMessages", confirmDialogTitle: "confirmDialogTitle", confirmButtonText: "confirmButtonText", cancelButtonText: "cancelButtonText", confirmDialogMessage: "confirmDialogMessage", onItemClick: "onItemClick", deleteConversationDialogStyle: "deleteConversationDialogStyle", backdropStyle: "backdropStyle", badgeStyle: "badgeStyle", dateStyle: "dateStyle", conversationsStyle: "conversationsStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", typingIndicatorText: "typingIndicatorText", threadIndicatorText: "threadIndicatorText", avatarStyle: "avatarStyle", receiptStyle: "receiptStyle", loggedInUser: "loggedInUser", disableMentions: "disableMentions", textFormatters: "textFormatters" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"], components: [{ type: i3.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatConversationsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-conversations", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRDb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxXQUFXLEVBRVgsVUFBVSxFQUNWLGtCQUFrQixFQUNsQixTQUFTLEVBRVQsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFFTCxxQkFBcUIsRUFFckIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULG1CQUFtQixHQUNwQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFFdEIsdUJBQXVCLEVBQ3ZCLG1CQUFtQixFQUVuQixZQUFZLEVBT1oscUJBQXFCLEVBQ3JCLGFBQWEsRUFFYixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFFZCxVQUFVLEVBQ1YsUUFBUSxHQUNULE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsS0FBSyxHQU9OLE1BQU0sZUFBZSxDQUFDO0FBR3ZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5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QWM7c0JBQXRCLEtBQUs7Z0JBRUcsWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLHVCQUF1QjtzQkFBL0IsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBR0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyw2QkFBNkI7c0JBQXJDLEtBQUs7Z0JBZ0JHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsVUFBVTtzQkFBbEIsS0FBSztnQkFRRyxTQUFTO3NCQUFqQixLQUFLO2dCQUlHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFNRyxhQUFhO3NCQUFyQixLQUFLO2dCQUlHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFLRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFnSEcsWUFBWTtzQkFBcEIsS0FBSztnQkFHRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5cbmltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBCYWRnZVN0eWxlLFxuICBDb25maXJtRGlhbG9nU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgSWNvblN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxuICBSZWNlaXB0U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQge1xuICBCYXNlU3R5bGUsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbiAgQ29tZXRDaGF0VGV4dEZvcm1hdHRlcixcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBDb252ZXJzYXRpb25VdGlscyxcbiAgQ29udmVyc2F0aW9uc1N0eWxlLFxuICBMaXN0U3R5bGUsXG4gIE1lc3NhZ2VSZWNlaXB0VXRpbHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQ2FyZE1lc3NhZ2UsXG4gIENvbWV0Q2hhdENhbGxFdmVudHMsXG4gIENvbWV0Q2hhdENvbnZlcnNhdGlvbkV2ZW50cyxcbiAgQ29tZXRDaGF0R3JvdXBFdmVudHMsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdE9wdGlvbixcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIENvbWV0Q2hhdFVzZXJFdmVudHMsXG4gIEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSxcbiAgRGF0ZVBhdHRlcm5zLFxuICBGb3JtTWVzc2FnZSxcbiAgSUdyb3VwTGVmdCxcbiAgSUdyb3VwTWVtYmVyQWRkZWQsXG4gIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCxcbiAgSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLFxuICBJTWVzc2FnZXMsXG4gIE1lbnRpb25zVGFyZ2V0RWxlbWVudCxcbiAgTWVzc2FnZVN0YXR1cyxcbiAgU2NoZWR1bGVyTWVzc2FnZSxcbiAgU2VsZWN0aW9uTW9kZSxcbiAgU3RhdGVzLFxuICBUaXRsZUFsaWdubWVudCxcbiAgVXNlclByZXNlbmNlUGxhY2VtZW50LFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgSG9zdEJpbmRpbmcsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgRG9tU2FuaXRpemVyLCBTYWZlSHRtbCB9IGZyb20gXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCI7XG5cbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXQgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0NvbWV0Q2hhdFVJa2l0L0NvbWV0Q2hhdFVJS2l0XCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRDb252ZXJzYXRpb24gaXMgYSB3cmFwcGVyIGNvbXBvbmVudCBjb25zaXN0cyBvZiBDb21ldENoYXRMaXN0QmFzZUNvbXBvbmVudCBhbmQgQ29udmVyc2F0aW9uTGlzdENvbXBvbmVudC5cbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY29udmVyc2F0aW9uc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENvbnZlcnNhdGlvbnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIC8qKlxuICAgKiBUaGlzIHByb3BlcnRpZXMgd2lsbCBjb21lIGZyb20gUGFyZW50LlxuICAgKi9cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0hBVFNcIik7IC8vVGl0bGUgb2YgdGhlIGNvbXBvbmVudFxuICBASW5wdXQoKSBvcHRpb25zITpcbiAgICB8ICgoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiBDb21ldENoYXRPcHRpb25bXSlcbiAgICB8IG51bGw7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlSG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTsgLy8gcGxhY2Vob2xkZXIgdGV4dCBvZiBzZWFyY2ggaW5wdXRcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGlzYWJsZVJlY2VpcHQ6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBkaXNhYmxlVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRlbGl2ZXJlZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtZGVsaXZlcmVkLnN2Z1wiO1xuICBASW5wdXQoKSByZWFkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1yZWFkLnN2Z1wiO1xuICBASW5wdXQoKSBlcnJvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3dhcm5pbmctc21hbGwuc3ZnXCI7XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIHNlbnRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXNlbnQuc3ZnXCI7XG4gIEBJbnB1dCgpIHByaXZhdGVHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgYXMgb2YgdmVyc2lvbiA0LjMuNyBkdWUgdG8gbmV3ZXIgcHJvcGVydHkgJ3Bhc3N3b3JkR3JvdXBJY29uJy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHN1YnNlcXVlbnQgdmVyc2lvbnMuXG4gICAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JNZXNzYWdlczogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgYWN0aXZlQ29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IG51bGw7IC8vc2VsZWN0ZWQgY29udmVyc2F0aW9uXG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjsgLy9pbWFnZSBVUkwgb2YgdGhlIHNlYXJjaCBpY29uXG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSB0cnVlOyAvL3N3aXRjaCBvbi9mZiBzZWFyY2ggaW5wdXRcbiAgQElucHV0KCkgY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblNlbGVjdCE6IChcbiAgICBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24sXG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW5cbiAgKSA9PiB2b2lkO1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fQ0hBVFNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQubGVmdDtcblxuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBtZW51ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gbG9jYWxpemUoXCJTRUFSQ0hcIik7XG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBkaXNhYmxlU291bmRGb3JNZXNzYWdlczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjb25maXJtRGlhbG9nVGl0bGUgPSBsb2NhbGl6ZShcIkRFTEVURV9DT05WRVJTQVRJT05cIik7XG4gIEBJbnB1dCgpIGNvbmZpcm1CdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRFTEVURVwiKTtcbiAgQElucHV0KCkgY2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIGNvbmZpcm1EaWFsb2dNZXNzYWdlOiBzdHJpbmcgPSBsb2NhbGl6ZShcbiAgICBcIldPVUxEX19ZT1VfTElLRV9UT19ERUxFVEVfVEhJU19DT05WRVJTQVRJT05cIlxuICApO1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IFwiXCIsXG4gICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogXCJcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOiBcIlwiLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogXCJcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IFwiXCIsXG4gICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IFwiXCIsXG4gICAgdGl0bGVGb250OiBcIlwiLFxuICAgIHRpdGxlQ29sb3I6IFwiXCIsXG4gICAgbWVzc2FnZVRleHRGb250OiBcIlwiLFxuICAgIG1lc3NhZ2VUZXh0Q29sb3I6IFwiXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNmMmYyZjJcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gIH07XG4gIEBJbnB1dCgpIGJhZGdlU3R5bGU6IEJhZGdlU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMjVweFwiLFxuICAgIGhlaWdodDogXCIxNXB4XCIsXG4gICAgYmFja2dyb3VuZDogXCIjNWFhZWZmXCIsXG4gICAgdGV4dENvbG9yOiBcIndoaXRlXCIsXG4gICAgdGV4dEZvbnQ6IFwiNDAwIDEzcHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSBkYXRlU3R5bGU6IERhdGVTdHlsZSA9IHtcbiAgICB0ZXh0Rm9udDogXCI0MDAgMTFweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIHRleHRDb2xvcjogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gIH07XG4gIEBJbnB1dCgpIGNvbnZlcnNhdGlvbnNTdHlsZTogQ29udmVyc2F0aW9uc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIGhlaWdodDogXCI5NyVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gIH07XG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgfTtcbiAgQElucHV0KCkgdHlwaW5nSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJJU19UWVBJTkdcIik7XG4gIEBJbnB1dCgpIHRocmVhZEluZGljYXRvclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSU5fQV9USFJFQURcIik7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHt9O1xuICBASW5wdXQoKSByZWNlaXB0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IHt9O1xuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlU2VudCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VEZWxldGUhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTGVmdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NVc2VyQmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UZXh0TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lZGlhTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25Gb3JtTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DYXJkTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzRGVsaXZlcmVkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ1N0YXJ0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHlwaW5nRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY091dGdvaW5nQ2FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbFJlamVjdGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxBY2NlcHRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgaWNvblN0eWxlOiBhbnkgPSB7XG4gICAgaWNvblRpbnQ6IFwibGlnaHRncmV5XCIsXG4gICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICB3aWR0aDogXCIyMHB4XCIsXG4gIH07XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0gbmV3IExpc3RTdHlsZSh7fSk7XG4gIG1lbnVzdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIHRleHRGb250OiBcIlwiLFxuICAgIHRleHRDb2xvcjogXCJibGFja1wiLFxuICAgIGljb25UaW50OiBcImdyZXlcIixcbiAgICBpY29uQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGljb25Cb3JkZXI6IFwibm9uZVwiLFxuICAgIGljb25Cb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIHN1Ym1lbnVXaWR0aDogXCI3MHB4XCIsXG4gICAgc3VibWVudUhlaWdodDogXCIyMHB4XCIsXG4gICAgc3VibWVudUJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudUJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgfTtcbiAgcHVibGljIHR5cGluZ0luZGljYXRvciE6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IgfCBudWxsO1xuICBwdWJsaWMgdHlwaW5nTGlzdGVuZXJJZDogc3RyaW5nID1cbiAgICBcImNvbnZlcnNhdGlvbl9fTElTVEVORVJcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgY2FsbExpc3RlbmVySWQgPSBcImNhbGxfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIHB1YmxpYyBpc0RpYWxvZ09wZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGlzRW1wdHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGlzTG9hZGluZzogYm9vbGVhbiA9IHRydWU7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBzdGF0dXNDb2xvcjogYW55ID0ge1xuICAgIG9ubGluZTogXCJcIixcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCIsXG4gIH07XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyBpc0Vycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbXTtcbiAgcHVibGljIHNjcm9sbGVkVG9Cb3R0b206IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNoZWNrSXRlbUNoYW5nZTogYm9vbGVhbiA9IGZhbHNlO1xuICBjb252ZXJzYXRpb25PcHRpb25zITogQ29tZXRDaGF0T3B0aW9uW107XG4gIHB1YmxpYyBzaG93Q29uZmlybURpYWxvZzogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uVG9CZURlbGV0ZWQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gbnVsbDtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNoYXRsaXN0X3VzZXJfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGdyb3VwTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjaGF0bGlzdF9ncm91cF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgZ3JvdXBUb1VwZGF0ZTogQ29tZXRDaGF0Lkdyb3VwIHwge30gPSB7fTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblR5cGU/OiBzdHJpbmcgPSB1bmRlZmluZWQ7XG4gIHNhZmVIdG1sITogU2FmZUh0bWw7XG4gIGVuYWJsZVBvbGxzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVN0aWNrZXJzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVdoaXRlYm9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlRG9jdW1lbnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgdGhyZWFkSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvdGhyZWFkLWFycm93LnN2Z1wiO1xuICBwdWJsaWMgY29uZmlybURpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICB9O1xuICBzdWJ0aXRsZVZhbHVlITogc3RyaW5nO1xuICBtb2RhbFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjIzMHB4XCIsXG4gICAgd2lkdGg6IFwiMjcwcHhcIixcbiAgfTtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgaXNBY3RpdmU6IGJvb2xlYW4gPSB0cnVlO1xuICBjb250YWN0c05vdEZvdW5kOiBib29sZWFuID0gZmFsc2U7XG4gIGNoYXRTZWFyY2ghOiBib29sZWFuO1xuICByZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25zUmVxdWVzdDtcbiAgLyoqXG4gICAqIFByb3BlcnRpZXMgZm9yIGludGVybmFsIHVzZVxuICAgKi9cbiAgcHVibGljIGxvY2FsaXplID0gbG9jYWxpemU7XG4gIC8qKlxuICAgKiBUaGlzIHByb3BlcnRpZXMgd2lsbCBjb21lIGZyb20gUGFyZW50LlxuICAgKi9cbiAgQElucHV0KCkgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICAvL1RvIGJlIGVuYWJsZWQgaW4gVU1DXG4gIC8vIEBJbnB1dCgpIG1lbnRpb25zSWNvblVSTCE6IHN0cmluZztcbiAgQElucHV0KCkgZGlzYWJsZU1lbnRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRleHRGb3JtYXR0ZXJzPzogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj47XG5cbiAgLyoqXG4gICAqIFByb3BlcnRpZXMgZm9yIGludGVybmFsIHVzZVxuICAgKi9cbiAgLyoqXG4gICAqIHBhc3NpbmcgdGhpcyBjYWxsYmFjayB0byBtZW51TGlzdCBjb21wb25lbnQgb24gZGVsZXRlIGNsaWNrXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgZGVsZXRlQ29udmVyc2F0aW9uT25DbGljazogKCgpID0+IHZvaWQpIHwgbnVsbCA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDb25maXJtYXRpb25EaWFsb2codGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCEpO1xuICB9O1xuICAvLyBjYWxsYmFjayBmb3IgY29uZmlybURpYWxvZ0NvbXBvbmVudFxuICBvbkNvbmZpcm1DbGljayA9ICgpID0+IHtcbiAgICB0aGlzLmRlbGV0ZVNlbGVjdGVkQ29udmVyc2F0aW9uKCk7XG4gIH07XG4gIG9uQ29udmVyc2F0aW9uU2VsZWN0ZWQoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQuZGV0YWlsLmNoZWNrZWQ7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QoY29udmVyc2F0aW9uLCBzZWxlY3RlZCk7XG4gICAgfVxuICB9XG4gIHNldFN0YXR1c0luZGljYXRvclN0eWxlID0gKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgIGlmIChcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlO1xuICAgIH1cbiAgfTtcblxuICAvL1RvIGJlIGVuYWJsZWQgaW4gVU1DXG4gIC8vIGdldE1lbnRpb25JY29uU3R5bGUoKTogSWNvblN0eWxlIHtcbiAgLy8gICByZXR1cm4gbmV3IEljb25TdHlsZSh7XG4gIC8vICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAvLyAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAvLyAgICAgaWNvblRpbnQ6XG4gIC8vICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ubWVudGlvbkljb25UaW50ID8/XG4gIC8vICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIGNoZWNrU3RhdHVzVHlwZShjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBsZXQgdXNlcjogQ29tZXRDaGF0LlVzZXIgPVxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcjtcbiAgICBpZiAoXG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlXG4gICAgKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHVzZXIuZ2V0U3RhdHVzKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yW3VzZXIuZ2V0U3RhdHVzKCldO1xuICAgICAgfSBlbHNlIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBlbHNlIGlmIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICBsZXQgZ3JvdXAgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cDtcbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yW2dyb3VwLmdldFR5cGUoKV1cbiAgICB9XG4gIH1cblxuICBnZXRFeHRlbnNpb25EYXRhKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCBtZXNzYWdlVGV4dDtcbiAgICAvL3hzcyBleHRlbnNpb25zIGRhdGFcbiAgICBjb25zdCB4c3NEYXRhID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrTWVzc2FnZUZvckV4dGVuc2lvbnNEYXRhKFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIFwieHNzLWZpbHRlclwiXG4gICAgKTtcbiAgICBpZiAoXG4gICAgICB4c3NEYXRhICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eSh4c3NEYXRhLCBcInNhbml0aXplZF90ZXh0XCIpICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eSh4c3NEYXRhLCBcImhhc1hTU1wiKSAmJlxuICAgICAgeHNzRGF0YS5oYXNYU1MgPT09IFwieWVzXCJcbiAgICApIHtcbiAgICAgIG1lc3NhZ2VUZXh0ID0geHNzRGF0YS5zYW5pdGl6ZWRfdGV4dDtcbiAgICB9XG4gICAgLy9kYXRhbWFza2luZyBleHRlbnNpb25zIGRhdGFcbiAgICBjb25zdCBtYXNrZWREYXRhID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrTWVzc2FnZUZvckV4dGVuc2lvbnNEYXRhKFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIFwiZGF0YS1tYXNraW5nXCJcbiAgICApO1xuICAgIGlmIChcbiAgICAgIG1hc2tlZERhdGEgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KG1hc2tlZERhdGEsIFwiZGF0YVwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgIG1hc2tlZERhdGEuZGF0YSxcbiAgICAgICAgXCJzZW5zaXRpdmVfZGF0YVwiXG4gICAgICApICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgbWFza2VkRGF0YS5kYXRhLFxuICAgICAgICBcIm1lc3NhZ2VfbWFza2VkXCJcbiAgICAgICkgJiZcbiAgICAgIG1hc2tlZERhdGEuZGF0YS5zZW5zaXRpdmVfZGF0YSA9PT0gXCJ5ZXNcIlxuICAgICkge1xuICAgICAgbWVzc2FnZVRleHQgPSBtYXNrZWREYXRhLmRhdGEubWVzc2FnZV9tYXNrZWQ7XG4gICAgfVxuICAgIC8vcHJvZmFuaXR5IGV4dGVuc2lvbnMgZGF0YVxuICAgIGNvbnN0IHByb2ZhbmVEYXRhID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrTWVzc2FnZUZvckV4dGVuc2lvbnNEYXRhKFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIFwicHJvZmFuaXR5LWZpbHRlclwiXG4gICAgKTtcbiAgICBpZiAoXG4gICAgICBwcm9mYW5lRGF0YSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkocHJvZmFuZURhdGEsIFwicHJvZmFuaXR5XCIpICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShwcm9mYW5lRGF0YSwgXCJtZXNzYWdlX2NsZWFuXCIpICYmXG4gICAgICBwcm9mYW5lRGF0YS5wcm9mYW5pdHkgPT09IFwieWVzXCJcbiAgICApIHtcbiAgICAgIG1lc3NhZ2VUZXh0ID0gcHJvZmFuZURhdGEubWVzc2FnZV9jbGVhbjtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VUZXh0IHx8IChtZXNzYWdlT2JqZWN0IGFzIGFueSkudGV4dDtcbiAgfVxuICBzZXRTdWJ0aXRsZSA9IChjb252ZXJzYXRpb25PYmplY3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICBpZiAodGhpcy50eXBpbmdJbmRpY2F0b3IpIHtcbiAgICAgIGNvbnN0IGlzVHlwaW5nID1cbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iamVjdCBhcyBhbnkpPy5jb252ZXJzYXRpb25XaXRoPy5ndWlkID09XG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGlmIChpc1R5cGluZykge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0U2VuZGVyKCkuZ2V0TmFtZSgpfSAke3RoaXMudHlwaW5nSW5kaWNhdG9yVGV4dFxuICAgICAgICAgIH1gO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iamVjdCBhcyBhbnkpPy5jb252ZXJzYXRpb25XaXRoPy51aWQgPT1cbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3I/LmdldFNlbmRlcigpLmdldFVpZCgpICYmXG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVyVHlwZSgpICE9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwaW5nSW5kaWNhdG9yVGV4dDtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IHN1YnRpdGxlID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TGFzdENvbnZlcnNhdGlvbk1lc3NhZ2UoXG4gICAgICBjb252ZXJzYXRpb25PYmplY3QsXG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEsXG5cbiAgICAgIHtcbiAgICAgICAgZGlzYWJsZU1lbnRpb25zOiB0aGlzLmRpc2FibGVNZW50aW9ucyxcbiAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICBtZW50aW9uc1RhcmdldEVsZW1lbnQ6IE1lbnRpb25zVGFyZ2V0RWxlbWVudC5jb252ZXJzYXRpb24sXG4gICAgICAgIHRleHRGb3JtYXR0ZXJzOiB0aGlzLnRleHRGb3JtYXR0ZXJzXG4gICAgICB9XG4gICAgKTtcbiAgICBsZXQgaWNvbiA9XG4gICAgICBjb252ZXJzYXRpb25PYmplY3Q/LmdldExhc3RNZXNzYWdlKCk/LmdldFR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICAgICAgPyBcIvCfk54gXCJcbiAgICAgICAgOiBcIvCfk7kgXCI7XG5cbiAgICByZXR1cm4gdGhpcy5zYW5pdGl6ZXIuYnlwYXNzU2VjdXJpdHlUcnVzdEh0bWwoXG4gICAgICBjb252ZXJzYXRpb25PYmplY3Q/LmdldExhc3RNZXNzYWdlKCk/LmdldENhdGVnb3J5KCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGxcbiAgICAgICAgPyBpY29uICsgc3VidGl0bGVcbiAgICAgICAgOiBzdWJ0aXRsZVxuICAgICk7XG4gIH07XG5cbiAgLy9UbyBiZSBlbmFibGVkIGluIFVNQ1xuICAvLyBnZXRVbnJlYWRNZW50aW9uc0ljb25TdHlsZSgpIHtcbiAgLy8gICByZXR1cm4ge1xuICAvLyAgICAgcGFkZGluZ1JpZ2h0OiBcIjNweFwiLFxuICAvLyAgIH07XG4gIC8vIH1cblxuICBjaGVja0dyb3VwVHlwZShjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pOiBzdHJpbmcge1xuICAgIGxldCBpbWFnZTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAoXG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgKSB7XG4gICAgICBsZXQgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwO1xuICAgICAgc3dpdGNoIChncm91cC5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW1hZ2U7XG4gIH1cbiAgLy8gY2FsbGJhY2sgZm9yIGNvbmZpcm1EaWFsb2dDb21wb25lbnRcbiAgb25DYW5jZWxDbGljayA9ICgpID0+IHtcbiAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IGZhbHNlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgZ2V0TWVzc2FnZVJlY2VpcHQgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgbGV0IHJlY2VpcHQgPSBNZXNzYWdlUmVjZWlwdFV0aWxzLmdldFJlY2VpcHRTdGF0dXMoXG4gICAgICBjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKVxuICAgICk7XG4gICAgcmV0dXJuIHJlY2VpcHQ7XG4gIH07XG4gIGdldERhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0ZVBhdHRlcm4gPz8gRGF0ZVBhdHRlcm5zLkRheURhdGVUaW1lO1xuICB9XG4gIG9wdGlvbnNTdHlsZSA9IHtcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlLFxuICAgIHByaXZhdGUgc2FuaXRpemVyOiBEb21TYW5pdGl6ZXJcbiAgKSB7IH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlciA9XG4gICAgICAgIG5ldyBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdClcbiAgICB9XG4gICAgdGhpcy5zZXRDb252ZXJzYXRpb25PcHRpb25zKCk7XG4gICAgdGhpcy5zZXRUaGVtZVN0eWxlKCk7XG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuYXR0YWNoTGlzdGVuZXJzKHRoaXMuY29udmVyc2F0aW9uVXBkYXRlZCk7XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyLmJ1aWxkKCk7XG4gICAgaWYgKHRoaXMucmVxdWVzdEJ1aWxkZXI/LmdldENvbnZlcnNhdGlvblR5cGUoKSkge1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25UeXBlID0gdGhpcy5yZXF1ZXN0QnVpbGRlci5nZXRDb252ZXJzYXRpb25UeXBlKCk7XG4gICAgfVxuICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uKCk7XG4gIH1cbiAgLyoqXG4gICogRGV0ZXJtaW5lcyBpZiB0aGUgbGFzdCBtZXNzYWdlIHNob3VsZCB0cmlnZ2VyIGFuIHVwZGF0ZSBiYXNlZCBvbiBpdHMgY2F0ZWdvcnkgYW5kIHR5cGUuXG4gICpcbiAgKiBAcGFyYW0gbWVzc2FnZSAtIFRoZSBsYXN0IG1lc3NhZ2Ugc2VudCBvciByZWNlaXZlZCBpbiB0aGUgY29udmVyc2F0aW9uLlxuICAqIEByZXR1cm5zIHtib29sZWFufSAtIFJldHVybnMgdHJ1ZSBpZiB0aGUgbWVzc2FnZSBzaG91bGQgdHJpZ2dlciBhbiB1cGRhdGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgKi9cbiAgY2hlY2tJZkxhc3RNZXNzYWdlU2hvdWxkVXBkYXRlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSk6IGJvb2xlYW4gfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLmNvbnZlcnNhdGlvblR5cGUgJiYgdGhpcy5jb252ZXJzYXRpb25UeXBlICE9IG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2tpbmcgaWYgdGhlIG1lc3NhZ2UgaXMgYSBjdXN0b20gbWVzc2FnZVxuICAgIGxldCBpc0N1c3RvbU1lc3NhZ2UgPSBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY3VzdG9tXG4gICAgLy8gQ2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgYSByZXBseSB0byBhbm90aGVyIG1lc3NhZ2VcbiAgICBpZiAobWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiYgIUNvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPy5zaG91bGRVcGRhdGVPbk1lc3NhZ2VSZXBsaWVzKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQ3VzdG9tTWVzc2FnZSkge1xuICAgICAgaWYgKG1lc3NhZ2U/LmdldFBhcmVudE1lc3NhZ2VJZCgpICYmIENvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPy5zaG91bGRVcGRhdGVPbk1lc3NhZ2VSZXBsaWVzKCkgJiYgdGhpcy5zaG91bGRJbmNyZW1lbnRGb3JDdXN0b21NZXNzYWdlKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5zaG91bGRJbmNyZW1lbnRGb3JDdXN0b21NZXNzYWdlKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgbWVzc2FnZSBpcyBhbiBhY3Rpb24gbWVzc2FnZVxuICAgIGlmIChtZXNzYWdlPy5nZXRDYXRlZ29yeSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgbWVzc2FnZSBpcyBhIGdyb3VwIG1lbWJlciBhY3Rpb25cbiAgICAgIGlmIChtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcikge1xuICAgICAgICByZXR1cm4gQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uR3JvdXBBY3Rpb25zKCk7XG4gICAgICB9XG4gICAgICAvLyBCeSBkZWZhdWx0LCBhY3Rpb24gbWVzc2FnZXMgc2hvdWxkIHRyaWdnZXIgYW4gdXBkYXRlXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgbWVzc2FnZSBpcyBhIGNhbGwgKGVpdGhlciBhdWRpbyBvciB2aWRlbylcbiAgICBpZiAobWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiZcbiAgICAgIChtZXNzYWdlPy5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbyB8fFxuICAgICAgICBtZXNzYWdlLmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvKSkge1xuICAgICAgcmV0dXJuIENvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPy5zaG91bGRVcGRhdGVPbkNhbGxBY3Rpdml0aWVzKCk7XG4gICAgfVxuICAgIC8vIEJ5IGRlZmF1bHQsIG1lc3NhZ2VzIHNob3VsZCB0cmlnZ2VyIGFuIHVwZGF0ZVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHNob3VsZEluY3JlbWVudEZvckN1c3RvbU1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICBjb25zdCBtZXRhZGF0YTogYW55ID0gbWVzc2FnZS5nZXRNZXRhZGF0YSgpO1xuICAgIC8vIENoZWNraW5nIGlmIHRoZSBjdXN0b20gbWVzc2FnZSBzaG91bGQgaW5jcmVtZW50IHRoZSB1bnJlYWQgbWVzc2FnZSBjb3VudGVyXG4gICAgcmV0dXJuIG1lc3NhZ2Uud2lsbFVwZGF0ZUNvbnZlcnNhdGlvbigpXG4gICAgICB8fCAobWV0YWRhdGEgJiYgbWV0YWRhdGEuaGFzT3duUHJvcGVydHkoXCJpbmNyZW1lbnRVbnJlYWRDb3VudFwiKSAmJiBtZXRhZGF0YS5pbmNyZW1lbnRVbnJlYWRDb3VudCkgfHwgQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uQ3VzdG9tTWVzc2FnZXMoKTtcbiAgfVxuICBhdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCkge1xuICAgIENvbWV0Q2hhdC5hZGRDb25uZWN0aW9uTGlzdGVuZXIoXG4gICAgICB0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkLFxuICAgICAgbmV3IENvbWV0Q2hhdC5Db25uZWN0aW9uTGlzdGVuZXIoe1xuICAgICAgICBvbkNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+Y29ubmVjdGVkXCIpO1xuICAgICAgICAgIHRoaXMuZmV0Y2hOZXdDb252ZXJzYXRpb25zKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluQ29ubmVjdGluZzogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IEluIGNvbm5lY3RpbmdcIik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRGlzY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gT24gRGlzY29ubmVjdGVkXCIpO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBpZiAoY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKCkgJiYgdGhpcy5jaGVja0lmTGFzdE1lc3NhZ2VTaG91bGRVcGRhdGUoY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKCkpKSB7XG4gICAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvbklkKCkgPT0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICk7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGluZGV4LCAxLCBjb252ZXJzYXRpb24pO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCkge1xuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkID1cbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbiA9IHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0uZ3JvdXAhKTtcbiAgICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldExhc3RNZXNzYWdlKGl0ZW0ubWVzc2FnZSk7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQWRkZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyQWRkZWQpID0+IHtcbiAgICAgICAgICBsZXQgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCA9IGl0ZW0udXNlckFkZGVkSW4hO1xuICAgICAgICAgIGxldCBhY3Rpb25NZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uW10gPSBpdGVtLm1lc3NhZ2VzITtcbiAgICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgICB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLnVzZXJBZGRlZEluISk7XG4gICAgICAgICAgY29udmVyc2F0aW9uPy5zZXRDb252ZXJzYXRpb25XaXRoKGdyb3VwKTtcbiAgICAgICAgICBjb252ZXJzYXRpb24/LnNldExhc3RNZXNzYWdlKGFjdGlvbk1lc3NhZ2VbYWN0aW9uTWVzc2FnZT8ubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbiEpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkID1cbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlcktpY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbiA9IHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0ua2lja2VkRnJvbSEpO1xuICAgICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQgPVxuICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29udmVyc2F0aW9uID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS5raWNrZWRGcm9tISk7XG4gICAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRMYXN0TWVzc2FnZShpdGVtLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cERlbGV0ZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgICB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBMZWZ0KSA9PiB7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbktleTogbnVtYmVyID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgICAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgICAgICBjPy5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09XG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgICAgICAgKGM/LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PVxuICAgICAgICAgICAgICBpdGVtLmxlZnRHcm91cC5nZXRHdWlkKClcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPj0gMCkge1xuICAgICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcikge1xuICAgICAgdGhpcy5jY1VzZXJCbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPVxuICAgICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tVXNlcihpdGVtKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb24pO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gb2JqZWN0Py5tZXNzYWdlPy5nZXRSZWNlaXZlclR5cGUoKSkge1xuICAgICAgICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBvYmplY3QubWVzc2FnZSE7XG4gICAgICAgICAgaWYgKG9iamVjdC5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQuc3Vic2NyaWJlKFxuICAgICAgKG9iajogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBvYmoubWVzc2FnZSE7XG4gICAgICAgIGlmIChvYmouc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGUgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlT2JqZWN0KTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLnN1YnNjcmliZShcbiAgICAgIChtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG1lc3NhZ2VPYmplY3QuZ2V0UmVjZWl2ZXJUeXBlKCkpIHtcbiAgICAgICAgICBDb21ldENoYXQuQ29tZXRDaGF0SGVscGVyLmdldENvbnZlcnNhdGlvbkZyb21NZXNzYWdlKFxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdFxuICAgICAgICAgICkudGhlbigoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgICBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZU9iamVjdCBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgICAgICAgICB0aGlzLnJlc2V0VW5yZWFkQ291bnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxFbmRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsRW5kZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIGlmIChjYWxsICYmIE9iamVjdC5rZXlzKGNhbGwpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxSZWplY3RlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsUmVqZWN0ZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY091dGdvaW5nQ2FsbCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NPdXRnb2luZ0NhbGwuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NhbGxBY2NlcHRlZCA9IENvbWV0Q2hhdENhbGxFdmVudHMuY2NDYWxsQWNjZXB0ZWQuc3Vic2NyaWJlKFxuICAgICAgKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgfVxuICAgICk7XG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGU/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwRGVsZXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBMZWZ0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyQmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZVJlYWQ/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgZ2V0Q29udmVyc2F0aW9uRnJvbVVzZXIodXNlcjogQ29tZXRDaGF0LlVzZXIpIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGVsZW1lbnQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgICAoZWxlbWVudC5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpID09XG4gICAgICAgIHVzZXIuZ2V0VWlkKClcbiAgICApO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJzYXRpb25MaXN0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKFxuICAgIGdyb3VwOiBDb21ldENoYXQuR3JvdXBcbiAgKTogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgICAoZWxlbWVudC5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCkgPT1cbiAgICAgICAgZ3JvdXAuZ2V0R3VpZCgpXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udmVyc2F0aW9uTGlzdFtpbmRleF07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZTogU2ltcGxlQ2hhbmdlcykge1xuICAgIHRyeSB7XG4gICAgICBpZiAoY2hhbmdlW1wiYWN0aXZlQ29udmVyc2F0aW9uXCJdKSB7XG4gICAgICAgIHRoaXMucmVzZXRVbnJlYWRDb3VudCgpO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgICBpZiAoY2hhbmdlW1wiY29udmVyc2F0aW9uc1N0eWxlXCJdKSB7XG4gICAgICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgKiBXaGVuIHVzZXIgc2VuZHMgbWVzc2FnZSBjb252ZXJzYXRpb25MaXN0IGlzIHVwZGF0ZWQgd2l0aCBsYXRlc3QgbWVzc2FnZVxuICAgICAgICovXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVycygpO1xuICAgICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvLyBnZXR0aW5nIGRlZmF1bHQgY29udmVyc2F0aW9uIG9wdGlvbiBhbmQgYWRkaW5nIGNhbGxiYWNrIGluIGl0XG4gIHNldENvbnZlcnNhdGlvbk9wdGlvbnMoKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNvbnZlcnNhdGlvbk9wdGlvbnMgPSBDb252ZXJzYXRpb25VdGlscy5nZXREZWZhdWx0T3B0aW9ucygpO1xuICAgIHRoaXMuY29udmVyc2F0aW9uT3B0aW9ucy5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRPcHRpb24pID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgIWVsZW1lbnQub25DbGljayAmJlxuICAgICAgICBlbGVtZW50LmlkID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkNvbnZlcnNhdGlvbk9wdGlvbnMuZGVsZXRlXG4gICAgICApIHtcbiAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5kZWxldGVDb252ZXJzYXRpb25PbkNsaWNrO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuICAvLyByZXNldCB1bnJlYWQgY291bnRcbiAgb25DbGljayhjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBpZiAodGhpcy5vbkl0ZW1DbGljaykge1xuICAgICAgdGhpcy5vbkl0ZW1DbGljayhjb252ZXJzYXRpb24pO1xuICAgIH1cbiAgfVxuICAvLyBzZXQgdW5yZWFkIGNvdW50XG4gIHJlc2V0VW5yZWFkQ291bnQoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uKSB7XG4gICAgICBjb25zdCBjb252ZXJzYXRpb25saXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbXG4gICAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgIF07XG4gICAgICAvL0dldHMgdGhlIGluZGV4IG9mIHVzZXIgd2hpY2ggY29tZXMgb2ZmbGluZS9vbmxpbmVcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IGNvbnZlcnNhdGlvbmxpc3QuZmluZEluZGV4KFxuICAgICAgICAoY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iaj8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PT1cbiAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICBjb252ZXJzYXRpb25saXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIGxldCBuZXdDb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPSBjb252ZXJzYXRpb25PYmo7XG4gICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZXNzYWdlQ291bnQoMCk7XG4gICAgICAgIC8vbmV3Q29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lbnRpb25Jbk1lc3NhZ2VDb3VudCgwKTtcbiAgICAgICAgKG5ld0NvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk/LnNldE11aWQoXG4gICAgICAgICAgdGhpcy5nZXRVaW54KClcbiAgICAgICAgKTtcbiAgICAgICAgY29udmVyc2F0aW9ubGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBuZXdDb252ZXJzYXRpb25PYmopO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9ubGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gc2V0cyBwcm9wZXJ0eSBmcm9tIHRoZW1lIHRvIHN0eWxlIG9iamVjdFxuICBzZXRUaGVtZVN0eWxlKCkge1xuICAgIHRoaXMuc2V0QXZhdGFyU3R5bGUoKTtcbiAgICB0aGlzLnNldEJhZGdlU3R5bGUoKTtcbiAgICB0aGlzLnNldENvbmZpcm1EaWFsb2dTdHlsZSgpO1xuICAgIHRoaXMuc2V0Q29udmVyc2F0aW9uc1N0eWxlKCk7XG4gICAgdGhpcy5zZXRMaXN0SXRlbVN0eWxlKCk7XG4gICAgdGhpcy5zZXREYXRlU3R5bGUoKTtcbiAgICB0aGlzLnNldFN0YXR1c1N0eWxlKCk7XG4gICAgdGhpcy5zZXRSZWNlaXB0U3R5bGUoKTtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnByaXZhdGUgPVxuICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGU/LnByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kO1xuICAgIHRoaXMuc3RhdHVzQ29sb3Iub25saW5lID0gdGhpcy5jb252ZXJzYXRpb25zU3R5bGU/Lm9ubGluZVN0YXR1c0NvbG9yO1xuICAgIHRoaXMuc3RhdHVzQ29sb3IucGFzc3dvcmQgPVxuICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGU/LnBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZDtcbiAgICB0aGlzLmxpc3RTdHlsZSA9IHtcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRpdGxlVGV4dEZvbnQsXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudGl0bGVUZXh0Q29sb3IsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmVtcHR5U3RhdGVUZXh0Rm9udCxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmVtcHR5U3RhdGVUZXh0Q29sb3IsXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmVycm9yU3RhdGVUZXh0Rm9udCxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmVycm9yU3RhdGVUZXh0Q29sb3IsXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmxvYWRpbmdJY29uVGludCxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5zZXBhcmF0b3JDb2xvcixcbiAgICB9O1xuICAgIHRoaXMuaWNvblN0eWxlLmljb25UaW50ID0gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKTtcbiAgfVxuICBzZXRMaXN0SXRlbVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IExpc3RJdGVtU3R5bGUgPSBuZXcgTGlzdEl0ZW1TdHlsZSh7XG4gICAgICBoZWlnaHQ6IFwiOTclXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGFjdGl2ZUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGhvdmVyQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgIH0pO1xuICAgIHRoaXMubGlzdEl0ZW1TdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmxpc3RJdGVtU3R5bGUgfTtcbiAgfVxuICBzZXRBdmF0YXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBBdmF0YXJTdHlsZSA9IG5ldyBBdmF0YXJTdHlsZSh7XG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMzZweFwiLFxuICAgICAgaGVpZ2h0OiBcIjM2cHhcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIG5hbWVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgICBiYWNrZ3JvdW5kU2l6ZTogXCJjb3ZlclwiLFxuICAgICAgbmFtZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcblxuICAgICAgb3V0ZXJWaWV3Qm9yZGVyU3BhY2luZzogXCJcIixcbiAgICB9KTtcbiAgICB0aGlzLmF2YXRhclN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYXZhdGFyU3R5bGUgfTtcbiAgfVxuICBzZXRTdGF0dXNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgfTtcbiAgICB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSxcbiAgICB9O1xuICB9XG4gIHNldENvbnZlcnNhdGlvbnNTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDb252ZXJzYXRpb25zU3R5bGUgPSBuZXcgQ29udmVyc2F0aW9uc1N0eWxlKHtcbiAgICAgIGxhc3RNZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgbGFzdE1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gLFxuICAgICAgdGl0bGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBvbmxpbmVTdGF0dXNDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByaXZhdGVHcm91cEljb25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHBhc3N3b3JkR3JvdXBJY29uQmFja2dyb3VuZDogXCJSR0IoMjQ3LCAxNjUsIDApXCIsXG4gICAgICB0eXBpbmdJbmRpY3RvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICB0eXBpbmdJbmRpY3RvclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHRocmVhZEluZGljYXRvclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yXG4gICAgICApLFxuICAgICAgdGhyZWFkSW5kaWNhdG9yVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuY29udmVyc2F0aW9uc1N0eWxlIH07XG4gIH1cbiAgc2V0RGF0ZVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IERhdGVTdHlsZSA9IG5ldyBEYXRlU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfSk7XG4gICAgdGhpcy5kYXRlU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5kYXRlU3R5bGUgfTtcbiAgfVxuICBzZXRSZWNlaXB0U3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogUmVjZWlwdFN0eWxlID0gbmV3IFJlY2VpcHRTdHlsZSh7XG4gICAgICB3YWl0SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBzZW50SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkZWxpdmVyZWRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHJlYWRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBlcnJvckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBoZWlnaHQ6IFwiMjBweFwiLFxuICAgICAgd2lkdGg6IFwiMjBweFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiXG4gICAgfSk7XG4gICAgdGhpcy5yZWNlaXB0U3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5yZWNlaXB0U3R5bGUgfTtcbiAgfVxuICBzZXRCYWRnZVN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhZGdlU3R5bGUgPSBuZXcgQmFkZ2VTdHlsZSh7XG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgaGVpZ2h0OiBcIjE2cHhcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5iYWRnZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuYmFkZ2VTdHlsZSB9O1xuICB9XG4gIHNldENvbmZpcm1EaWFsb2dTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSBuZXcgQ29uZmlybURpYWxvZ1N0eWxlKHtcbiAgICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJkYXJrXCIpLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIG1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBtZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMzUwcHhcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5kZWxldGVDb252ZXJzYXRpb25EaWFsb2dTdHlsZSxcbiAgICB9O1xuICB9XG4gIC8vIGNoZWNraW5nIGlmIHVzZXIgaGFzIGhpcyBvd24gY29uZmlndXJhdGlvbiBlbHNlIHdpbGwgdXNlIGRlZmF1bHQgY29uZmlndXJhdGlvblxuICAvKipcbiAgICogQHBhcmFtICB7T2JqZWN0PXt9fSBjb25maWdcbiAgICogQHBhcmFtICB7T2JqZWN0fSBkZWZhdWx0Q29uZmlnP1xuICAgKiBAcmV0dXJucyBkZWZhdWx0Q29uZmlnXG4gICAqL1xuICAvLyBjYWxsaW5nIHN1YnRpdGxlIGNhbGxiYWNrIGZyb20gY29uZmlndXJhdGlvbnNcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIGNvdmVyc2F0aW9uIGJhc2VkIG9uIHRoZSBjb252ZXJzYXRpb25SZXF1ZXN0IGNvbmZpZ1xuICAgKi9cbiAgZmV0Y2hOZXh0Q29udmVyc2F0aW9uKCk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0aGlzLnJlcXVlc3RCdWlsZGVyLmZldGNoTmV4dCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB1cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSAmJlxuICAgICAgICAoY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlKS5nZXRJZCgpID09XG4gICAgICAgIG1lc3NhZ2U/LmdldElkKClcbiAgICApO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbkVkaXRlZERlbGV0ZWQobWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBhdHRhY2hlcyBMaXN0ZW5lcnMgZm9yIHVzZXIgYWN0aXZpdHkgLCBncm91cCBhY3Rpdml0aWVzIGFuZCBjYWxsaW5nXG4gICAqIEBwYXJhbSBjYWxsYmFja1xuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgYXR0YWNoTGlzdGVuZXJzKGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlICYmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpKSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRVc2VyTGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy51c2VyTGlzdGVuZXJJZCxcbiAgICAgICAgICBuZXcgQ29tZXRDaGF0LlVzZXJMaXN0ZW5lcih7XG4gICAgICAgICAgICBvblVzZXJPbmxpbmU6IChvbmxpbmVVc2VyOiBvYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgY29tZXMgb25saW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vbmxpbmUsXG4gICAgICAgICAgICAgICAgb25saW5lVXNlclxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVXNlck9mZmxpbmU6IChvZmZsaW5lVXNlcjogb2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIHdlbnQgb2ZmbGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub2ZmbGluZSxcbiAgICAgICAgICAgICAgICBvZmZsaW5lVXNlclxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZEdyb3VwTGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy5ncm91cExpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Hcm91cExpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQ6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICBjaGFuZ2VkVXNlcjogYW55LFxuICAgICAgICAgICAgICBuZXdTY29wZTogYW55LFxuICAgICAgICAgICAgICBvbGRTY29wZTogYW55LFxuICAgICAgICAgICAgICBjaGFuZ2VkR3JvdXA6IGFueVxuICAgICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJLaWNrZWQ6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICBraWNrZWRVc2VyOiBhbnksXG4gICAgICAgICAgICAgIGtpY2tlZEJ5OiBhbnksXG4gICAgICAgICAgICAgIGtpY2tlZEZyb206IGFueVxuICAgICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGtpY2tlZFVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbkZyb21NZXNzYWdlKGtpY2tlZEZyb20pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICBiYW5uZWRVc2VyOiBhbnksXG4gICAgICAgICAgICAgIGJhbm5lZEJ5OiBhbnksXG4gICAgICAgICAgICAgIGJhbm5lZEZyb206IGFueVxuICAgICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGJhbm5lZFVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbkZyb21NZXNzYWdlKGJhbm5lZEZyb20pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbk1lbWJlckFkZGVkVG9Hcm91cDogKFxuICAgICAgICAgICAgICBtZXNzYWdlOiBhbnksXG4gICAgICAgICAgICAgIHVzZXJBZGRlZDogYW55LFxuICAgICAgICAgICAgICB1c2VyQWRkZWRCeTogYW55LFxuICAgICAgICAgICAgICB1c2VyQWRkZWRJbjogYW55XG4gICAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChtZXNzYWdlOiBhbnksIGxlYXZpbmdVc2VyOiBhbnksIGdyb3VwOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKFxuICAgICAgICAgICAgICBtZXNzYWdlOiBhbnksXG4gICAgICAgICAgICAgIGpvaW5lZFVzZXI6IGFueSxcbiAgICAgICAgICAgICAgam9pbmVkR3JvdXA6IGFueVxuICAgICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgQ29tZXRDaGF0LmFkZENhbGxMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5jYWxsTGlzdGVuZXJJZCxcbiAgICAgICAgbmV3IENvbWV0Q2hhdC5DYWxsTGlzdGVuZXIoe1xuICAgICAgICAgIG9uSW5jb21pbmdDYWxsUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkluY29taW5nQ2FsbENhbmNlbGxlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uT3V0Z29pbmdDYWxsUmVqZWN0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk91dGdvaW5nQ2FsbEFjY2VwdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25DYWxsRW5kZWRNZXNzYWdlUmVjZWl2ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIC8vIFNESyBsaXN0ZW5lcnNcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblRleHRNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgICh0ZXh0TWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuVEVYVF9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICB0ZXh0TWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZWRpYU1lc3NhZ2U6IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBtZWRpYU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChjdXN0b21NZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25Gb3JtTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoZm9ybU1lc3NhZ2U6IEZvcm1NZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgZm9ybU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChmb3JtTWVzc2FnZTogU2NoZWR1bGVyTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGZvcm1NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChjYXJkTWVzc2FnZTogQ2FyZE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBjYXJkTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChjdXN0b21NZXNzYWdlOiBDdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBjdXN0b21NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNSZWFkLnN1YnNjcmliZShcbiAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQgJiYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpKSkge1xuICAgICAgICAgICAgdGhpcy5tYXJrQXNSZWFkKG1lc3NhZ2VSZWNlaXB0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZGVsZXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGRlbGV0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZWRpdGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBlZGl0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gbWVzc2FnZVJlY2VpcHQ/LmdldFJlY2VpdmVyVHlwZSgpKSkge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25UeXBpbmdTdGFydGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ1N0YXJ0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IHR5cGluZ0luZGljYXRvcj8uZ2V0UmVjZWl2ZXJUeXBlKCkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlVHlwaW5nKSB7XG4gICAgICAgICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yID0gdHlwaW5nSW5kaWNhdG9yO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uVHlwaW5nRW5kZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVHlwaW5nRW5kZWQuc3Vic2NyaWJlKFxuICAgICAgICAodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IHR5cGluZ0luZGljYXRvcj8uZ2V0UmVjZWl2ZXJUeXBlKCkpIHtcbiAgICAgICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZmV0Y2hOZXdDb252ZXJzYXRpb25zKCkge1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlci5idWlsZCgpO1xuICAgIGlmICh0aGlzLnJlcXVlc3RCdWlsZGVyPy5nZXRDb252ZXJzYXRpb25UeXBlKCkpIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uVHlwZSA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuZ2V0Q29udmVyc2F0aW9uVHlwZSgpO1xuICAgIH1cbiAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbXTtcbiAgICB0aGlzLmdldENvbnZlcnNhdGlvbihTdGF0ZXMubG9hZGVkKTtcbiAgfVxuICByZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShncm91cDogQ29tZXRDaGF0Lkdyb3VwKSB7XG4gICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChncm91cClcbiAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uKVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzXG4gICAqL1xuICByZW1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIENvbWV0Q2hhdC5yZW1vdmVVc2VyTGlzdGVuZXIodGhpcy51c2VyTGlzdGVuZXJJZCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlR3JvdXBMaXN0ZW5lcih0aGlzLmdyb3VwTGlzdGVuZXJJZCk7XG4gICAgICBDb21ldENoYXQucmVtb3ZlQ29ubmVjdGlvbkxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQpO1xuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25UeXBpbmdFbmRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEZldGNoZXMgQ29udmVyc2F0aW9ucyBEZXRhaWxzIHdpdGggYWxsIHRoZSB1c2Vyc1xuICAgKi9cbiAgZ2V0Q29udmVyc2F0aW9uID0gKHN0YXRlczogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmcpID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyICYmXG4gICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24gJiZcbiAgICAgICgodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlID09IDAgfHxcbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSAhPVxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24udG90YWxfcGFnZXMpXG4gICAgKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGVzO1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgICAgICB0aGlzLmZldGNoTmV4dENvbnZlcnNhdGlvbigpXG4gICAgICAgICAgICAgIC50aGVuKChjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10pID0+IHtcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LmZvckVhY2goXG4gICAgICAgICAgICAgICAgICAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKClcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRVbnJlYWRNZXNzYWdlQ291bnQoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnZlcnNhdGlvbi5zZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGVzID09IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW1xuICAgICAgICAgICAgICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICAgICAgICAgIC4uLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3QubGVuZ3RoIDw9IDAgJiZcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdD8ubGVuZ3RoIDw9IDBcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5lbXB0eSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGFjaCgpOyAvLyBEZXRhY2ggdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udmVyc2F0aW9uTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGlzUmVjZWlwdERpc2FibGUoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgbGV0IGl0ZW06IGFueSA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCk7XG4gICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpO1xuICAgIGlmIChcbiAgICAgICF0aGlzLmRpc2FibGVSZWNlaXB0ICYmXG4gICAgICBtZXNzYWdlICYmXG4gICAgICAhbWVzc2FnZT8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiZcbiAgICAgICghdGhpcy50eXBpbmdJbmRpY2F0b3IgfHxcbiAgICAgICAgKGl0ZW0/LnVpZCAhPSB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkgJiZcbiAgICAgICAgICBpdGVtPy5ndWlkICE9IHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVySWQoKSkpICYmXG4gICAgICBtZXNzYWdlLmdldFNlbmRlcigpPy5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb252ZXJzYXRpb24gbGlzdCdzIGxhc3QgbWVzc2FnZSAsIGJhZGdlQ291bnQgLCB1c2VyIHByZXNlbmNlIGJhc2VkIG9uIGFjdGl2aXRpZXMgcHJvcGFnYXRlZCBieSBsaXN0ZW5lcnNcbiAgICovXG4gIGNvbnZlcnNhdGlvblVwZGF0ZWQgPSAoXG4gICAga2V5OiBhbnksXG4gICAgaXRlbTogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAgfCBudWxsID0gbnVsbCxcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgb3B0aW9ucyA9IG51bGxcbiAgKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9mZmxpbmU6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIoaXRlbSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUQ6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRDoge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkFEREVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5KT0lORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uVU5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uU0NPUEVfQ0hBTkdFOlxuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMRVRFRDpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkVkaXRlZERlbGV0ZWQobWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtYXJrTWVzc2FnZUFzRGVsaXZlcmVkID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIC8vaWYgY2hhdCB3aW5kb3cgaXMgbm90IG9wZW4sIG1hcmsgbWVzc2FnZSBhcyBkZWxpdmVyZWRcbiAgICBpZiAoXG4gICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgKCF0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiB8fFxuICAgICAgICAgIChcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgICApPy5nZXRVaWQoKSAhPT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpKSAmJlxuICAgICAgICAhbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImRlbGl2ZXJlZEF0XCIpXG4gICAgICApIHtcbiAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICAoIXRoaXMuYWN0aXZlQ29udmVyc2F0aW9uIHx8XG4gICAgICAgICAgKFxuICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICApPy5nZXRHdWlkKCkgIT09IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKSkgJiZcbiAgICAgICAgIW1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJkZWxpdmVyZWRBdFwiKVxuICAgICAgKSB7XG4gICAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSByZWFkTWVzc2FnZVxuICAgKi9cbiAgZ2V0VWlueCA9ICgpID0+IHtcbiAgICByZXR1cm4gU3RyaW5nKE1hdGgucm91bmQoK25ldyBEYXRlKCkgLyAxMDAwKSk7XG4gIH07XG4gIG1hcmtBc1JlYWQocmVhZE1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkge1xuICAgIGxldCBjb252ZXJzYXRpb25saXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbLi4udGhpcy5jb252ZXJzYXRpb25MaXN0XTtcbiAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIChcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgKS5nZXRSZWNlaXZlcklkKCkgPT0gcmVhZE1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKClcbiAgICApO1xuICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iamVjdCE6IENvbWV0Q2hhdC5Db252ZXJzYXRpb247XG4gICAgICBpZiAoXG4gICAgICAgICEoXG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtcbiAgICAgICAgICAgIGNvbnZlcnNhdGlvbktleVxuICAgICAgICAgIF0uZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5nZXRSZWFkQXQoKVxuICAgICAgKSB7XG4gICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iamVjdCA9IGNvbnZlcnNhdGlvbmxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgKFxuICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iamVjdC5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLnNldFJlYWRBdChyZWFkTWVzc2FnZS5nZXRSZWFkQXQoKSk7XG4gICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iamVjdC5zZXRVbnJlYWRNZXNzYWdlQ291bnQoMCk7XG4gICAgICAgIChcbiAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5zZXRNdWlkKHRoaXMuZ2V0VWlueCgpKTtcbiAgICAgICAgY29udmVyc2F0aW9ubGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBuZXdDb252ZXJzYXRpb25PYmplY3QpO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9ubGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgRGV0YWlsIHdoZW4gdXNlciBjb21lcyBvbmxpbmUvb2ZmbGluZVxuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcnxDb21ldENoYXQuR3JvdXB8bnVsbH0gdXNlclxuICAgKi9cbiAgdXBkYXRlVXNlcih1c2VyOiBDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cCB8IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgLy93aGVuIHVzZXIgdXBkYXRlc1xuICAgICAgY29uc3QgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW1xuICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICBdO1xuICAgICAgLy9HZXRzIHRoZSBpbmRleCBvZiB1c2VyIHdoaWNoIGNvbWVzIG9mZmxpbmUvb25saW5lXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKSA9PT1cbiAgICAgICAgICAodXNlciBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uV2l0aE9iajogQ29tZXRDaGF0LlVzZXIgPVxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXI7XG4gICAgICAgIGNvbnZlcnNhdGlvbldpdGhPYmouc2V0U3RhdHVzKCh1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRTdGF0dXMoKSk7XG4gICAgICAgIGxldCBuZXdDb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPSBjb252ZXJzYXRpb25PYmo7XG4gICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRDb252ZXJzYXRpb25XaXRoKGNvbnZlcnNhdGlvbldpdGhPYmopO1xuICAgICAgICAobmV3Q29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gY29udmVyc2F0aW9ubGlzdDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICpcbiAgICogR2V0cyB0aGUgbGFzdCBtZXNzYWdlXG4gICAqIEBwYXJhbSBjb252ZXJzYXRpb25cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIG1ha2VMYXN0TWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwge30gPSB7fVxuICApIHtcbiAgICBjb25zdCBuZXdNZXNzYWdlID0gbWVzc2FnZTtcbiAgICByZXR1cm4gbmV3TWVzc2FnZTtcbiAgfVxuICB1cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcblxuICAgICAgY29uc3QgaXNTYW1lR3JvdXAgPSAobWVzc2FnZS5nZXRSZWNlaXZlcigpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpID09PVxuICAgICAgICAobWVzc2FnZS5nZXRBY3Rpb25Gb3IoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKTtcblxuICAgICAgaWYgKGlzU2FtZUdyb3VwKSB7XG4gICAgICAgIGxldCB1cGRhdGVkR3JvdXAgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cDtcbiAgICAgICAgdXBkYXRlZEdyb3VwLnNldE1lbWJlcnNDb3VudCgobWVzc2FnZS5nZXRBY3Rpb25Gb3IoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldE1lbWJlcnNDb3VudCgpKTtcbiAgICAgICAgY29udmVyc2F0aW9uLnNldENvbnZlcnNhdGlvbldpdGgodXBkYXRlZEdyb3VwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIFVwZGF0ZXMgQ29udmVyc2F0aW9ucyBhcyBUZXh0L0N1c3RvbSBNZXNzYWdlcyBhcmUgcmVjZWl2ZWRcbiAgICogQHBhcmFtXG4gICAqXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IG5vdGlmaWNhdGlvblxuICAgKi9cbiAgdXBkYXRlQ29udmVyc2F0aW9uKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICBub3RpZmljYXRpb246IGJvb2xlYW4gPSB0cnVlXG4gICkge1xuICAgIGxldCBtZXRhZGF0YTogYW55O1xuICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICAgIG1ldGFkYXRhID0gbWVzc2FnZS5nZXRNZXRhZGF0YSgpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMuY2hlY2tJZkxhc3RNZXNzYWdlU2hvdWxkVXBkYXRlKG1lc3NhZ2UpKSB7XG4gICAgICAgIHRoaXMubWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgaXNDdXN0b21NZXNzYWdlOiBib29sZWFuID0gbWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlXG4gICAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSByZXNwb25zZS5jb252ZXJzYXRpb25LZXk7XG4gICAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgICByZXNwb25zZS5jb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25MaXN0ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uTGlzdDtcbiAgICAgICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICAgICAgICAvLyBpZiBzZW5kZXIgaXMgbm90IGxvZ2dlZCBpbiB1c2VyIHRoZW4gIGluY3JlbWVudCBjb3VudFxuICAgICAgICAgICAgICBsZXQgdW5yZWFkTWVzc2FnZUNvdW50ID1cbiAgICAgICAgICAgICAgICAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgfHxcbiAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PSBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSlcbiAgICAgICAgICAgICAgICAgID8gdGhpcy5tYWtlVW5yZWFkTWVzc2FnZUNvdW50KGNvbnZlcnNhdGlvbk9iailcbiAgICAgICAgICAgICAgICAgIDogdGhpcy5tYWtlVW5yZWFkTWVzc2FnZUNvdW50KGNvbnZlcnNhdGlvbk9iaikgLSAxO1xuICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IHRoaXMubWFrZUxhc3RNZXNzYWdlKFxuICAgICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGxldCBuZXdDb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPSBjb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkFjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uV2l0aEZvckdyb3VwKG1lc3NhZ2UsIG5ld0NvbnZlcnNhdGlvbk9iailcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0TGFzdE1lc3NhZ2UobGFzdE1lc3NhZ2VPYmopO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZS5nZXRDYXRlZ29yeSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVzc2FnZUNvdW50KHVucmVhZE1lc3NhZ2VDb3VudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGxhc3RNZXNzYWdlT2JqLmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBsZXQgdGltZXNMb2dnZWRJblVzZXJJc01lbnRpb25lZCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbGFzdE1lc3NhZ2VPYmouZ2V0TWVudGlvbmVkVXNlcnMoKTtcbiAgICAgICAgICAgICAgICBpZiAobWVudGlvbmVkVXNlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKFxuICAgICAgICAgICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGkgPCBtZW50aW9uZWRVc2Vycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZW50aW9uZWRVc2Vyc1tpXS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aW1lc0xvZ2dlZEluVXNlcklzTWVudGlvbmVkKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxKTtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC51bnNoaWZ0KG5ld0NvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PSBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBuZXdDb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAhPSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCBpbmNyZW1lbnRDb3VudCA9IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAhPSBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpID8gMSA6IDBcbiAgICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlT2JqID0gdGhpcy5tYWtlTGFzdE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShsYXN0TWVzc2FnZU9iaik7XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkFjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uV2l0aEZvckdyb3VwKG1lc3NhZ2UsIGNvbnZlcnNhdGlvbk9iailcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobWVzc2FnZS5nZXRDYXRlZ29yeSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVzc2FnZUNvdW50KGluY3JlbWVudENvdW50KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3QudW5zaGlmdChjb252ZXJzYXRpb25PYmopO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBjb252ZXJzYXRpb25MaXN0O1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb24gJiZcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgdXBkYXRlRGVsaXZlcmVkTWVzc2FnZShtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSB7XG4gICAgbGV0IGNvbnZlcnNhdGlvbkxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFsuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgIGxldCBjb252ZXJzYXRpb25LZXk6IG51bWJlciA9IGNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIChjLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5nZXRJZCgpID09XG4gICAgICAgIE51bWJlcihtZXNzYWdlUmVjZWlwdC5nZXRNZXNzYWdlSWQoKSlcbiAgICApO1xuICAgIGxldCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb247XG4gICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICBjb252ZXJzYXRpb25PYmogPSBjb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICBpZiAoXG4gICAgICAgICEoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgKSB7XG4gICAgICAgIChcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5zZXREZWxpdmVyZWRBdChOdW1iZXIodGhpcy5nZXRVaW54KCkpKTtcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TXVpZChcbiAgICAgICAgICB0aGlzLmdldFVpbngoKVxuICAgICAgICApO1xuICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIGNvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICpcbiAgICogR2V0cyBUaGUgQ291bnQgb2YgVW5yZWFkIE1lc3NhZ2VzXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gY29udmVyc2F0aW9uXG4gICAqIEBwYXJhbSAge2FueX0gb3BlcmF0b3JcbiAgICovXG4gIG1ha2VVbnJlYWRNZXNzYWdlQ291bnQoXG4gICAgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uLFxuICAgIG9wZXJhdG9yOiBhbnkgPSBudWxsXG4gICkge1xuICAgIGlmIChPYmplY3Qua2V5cyhjb252ZXJzYXRpb24pLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGxldCB1bnJlYWRNZXNzYWdlQ291bnQ6IG51bWJlciA9IGNvbnZlcnNhdGlvbi5nZXRVbnJlYWRNZXNzYWdlQ291bnQoKTtcbiAgICBpZiAoXG4gICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PT1cbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgKSB7XG4gICAgICB1bnJlYWRNZXNzYWdlQ291bnQgKz0gMTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmhhc093blByb3BlcnR5KFwiZ3VpZFwiKSAmJlxuICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpLmhhc093blByb3BlcnR5KFwiZ3VpZFwiKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApLmdldEd1aWQoKSA9PT1cbiAgICAgICAgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCkpIHx8XG4gICAgICAodGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uaGFzT3duUHJvcGVydHkoXCJ1aWRcIikgJiZcbiAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKS5oYXNPd25Qcm9wZXJ0eShcInVpZFwiKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyXG4gICAgICAgICkuZ2V0VWlkKCkgPT09XG4gICAgICAgIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKSlcbiAgICApIHtcbiAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvcGVyYXRvciAmJiBvcGVyYXRvciA9PT0gXCJkZWNyZW1lbnRcIikge1xuICAgICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSB1bnJlYWRNZXNzYWdlQ291bnQgPyB1bnJlYWRNZXNzYWdlQ291bnQgLSAxIDogMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCA9IHVucmVhZE1lc3NhZ2VDb3VudCArIDE7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bnJlYWRNZXNzYWdlQ291bnQ7XG4gIH1cbiAgLyoqXG4gICAqIENoYW5nZXMgZGV0YWlsIG9mIGNvbnZlcnNhdGlvbnNcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtYWtlQ29udmVyc2F0aW9uKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgICAoYzogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjPy5nZXRDb252ZXJzYXRpb25JZCgpID09PSBtZXNzYWdlPy5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICApO1xuICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+PSAwKSB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICBjb252ZXJzYXRpb25LZXk6IGNvbnZlcnNhdGlvbktleSxcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmo6IGNvbnZlcnNhdGlvbixcbiAgICAgICAgICBjb252ZXJzYXRpb25MaXN0OiB0aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci5nZXRDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgaW5zdGFuY2VvZiBDb21ldENoYXQuR3JvdXAgJiZcbiAgICAgICAgICAgICAgIShcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICAgICApLmdldFNjb3BlKClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICAgICAgKS5zZXRIYXNKb2luZWQodHJ1ZSk7XG4gICAgICAgICAgICAgIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuc2V0U2NvcGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJTY29wZS5wYXJ0aWNpcGFudFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbktleTogLTEsXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iajogY29udmVyc2F0aW9uLFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0OiB0aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHJlamVjdChlcnJvcikpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIENvbnZlcnNhdGlvbiBWaWV3IHdoZW4gbWVzc2FnZSBpcyBlZGl0ZWQgb3IgZGVsZXRlZFxuICAgKi9cbiAgY29udmVyc2F0aW9uRWRpdGVkRGVsZXRlZChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tYWtlQ29udmVyc2F0aW9uKG1lc3NhZ2UpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uS2V5O1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgICByZXNwb25zZS5jb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uTGlzdCA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpO1xuICAgICAgICAgICAgaWYgKGxhc3RNZXNzYWdlT2JqLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKSkge1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouc2V0TGFzdE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgICAgICAgKS5zZXRNdWlkKHRoaXMuZ2V0VWlueCgpKTtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBjb252ZXJzYXRpb25PYmopO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogSWYgVXNlciBzY3JvbGxzIHRvIHRoZSBib3R0b20gb2YgdGhlIGN1cnJlbnQgQ29udmVyc2F0aW9uIGxpc3QgdGhhbiBmZXRjaCBuZXh0IGl0ZW1zIG9mIHRoZSBDb252ZXJzYXRpb24gbGlzdCBhbmQgYXBwZW5kXG4gICAqIEBwYXJhbSBFdmVudFxuICAgKi9cbiAgLyoqXG4gICAqIFBsYXlzIEF1ZGlvIFdoZW4gTWVzc2FnZSBpcyBSZWNlaXZlZFxuICAgKi9cbiAgcGxheUF1ZGlvKCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoXG4gICAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlRnJvbU90aGVyXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKlxuICAgKiBVcGRhdGVzIHRoZSBjb252ZXNhdGlvbiBsaXN0IHdoZW4gZGVsZXRlZC5cbiAgICogQWRkaW5nIENvbnZlcnNhdGlvbiBPYmplY3QgdG8gQ29tZXRjaGF0U2VydmljZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgdXBkYXRlQ29udmVyc2F0aW9uTGlzdChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50Py5nZXRDb252ZXJzYXRpb25JZCgpID09IGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICk7XG4gICAgdGhpcy5jb252ZXJzYXRpb25MaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBzaG93aW5nIGRpYWxvZyBmb3IgY29uZmlybSBhbmQgY2FuY2VsXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgc2hvd0NvbmZpcm1hdGlvbkRpYWxvZyA9IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IHRydWU7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IGNvbnZlcnNhdGlvbjtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIG9uT3B0aW9uQ2xpY2soZXZlbnQ6IGFueSwgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgbGV0IG9wdGlvbjogQ29tZXRDaGF0T3B0aW9uID0gZXZlbnQ/LmRldGFpbD8uZGF0YTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gY29udmVyc2F0aW9uO1xuICAgIGlmIChvcHRpb24pIHtcbiAgICAgIG9wdGlvbi5vbkNsaWNrISgpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogc2hvdyBjb25maXJtIGRpYWxvZyBzY3JlZW5cbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbnx7fX0gY29udmVyc2F0b25cbiAgICovXG4gIC8vIGNoZWNrIGlzIHRoZXJlIGlzIGFueSBhY3RpdmUgY29udmVyc2F0aW9uIGFuZCBtYXJrIGl0IGFzIGFjdGl2ZVxuICBnZXRBY3RpdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZSA9PSBTZWxlY3Rpb25Nb2RlLm5vbmUgfHwgIXRoaXMuc2VsZWN0aW9uTW9kZSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uIGFzIGFueSk/LmNvbnZlcnNhdGlvbklkID09XG4gICAgICAgIChjb252ZXJzYXRpb24gYXMgYW55KT8uY29udmVyc2F0aW9uSWRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIGhhbmRsZSBjb25maXJtIGRpYWxvZyByZXNwb25zZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHZhbHVlXG4gICAqL1xuICAvLyBjYWxsaW5nIGNvbWV0Y2hhdC5kZWxldGVDb252ZXJzYXRpb24gbWV0aG9kXG4gIGRlbGV0ZVNlbGVjdGVkQ29udmVyc2F0aW9uKCkge1xuICAgIGlmICh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZC5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBudWxsO1xuICAgICAgfVxuICAgICAgbGV0IGNvbnZlcnNhdGlvbldpdGg7XG4gICAgICBsZXQgY29udmVyc2F0aW9uVHlwZSA9IHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uVHlwZSgpO1xuICAgICAgaWYgKFxuICAgICAgICBjb252ZXJzYXRpb25UeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgICkge1xuICAgICAgICBjb252ZXJzYXRpb25XaXRoID0gKFxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyXG4gICAgICAgICkuZ2V0VWlkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb252ZXJzYXRpb25XaXRoID0gKFxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApLmdldEd1aWQoKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5kZWxldGVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uV2l0aCwgY29udmVyc2F0aW9uVHlwZSkudGhlbihcbiAgICAgICAgKGRlbGV0ZWRDb252ZXJzYXRpb24pID0+IHtcbiAgICAgICAgICBDb21ldENoYXRDb252ZXJzYXRpb25FdmVudHMuY2NDb252ZXJzYXRpb25EZWxldGVkLm5leHQoXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkIVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQpO1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBudWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMuaXNEaWFsb2dPcGVuID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8vIGV4cG9zZWQgbWV0aG9kcyB0byB1c2Vycy5cbiAgdXBkYXRlTGFzdE1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gIH1cbiAgcmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uTGlzdChjb252ZXJzYXRpb24pO1xuICB9XG4gIHN0eWxlczogYW55ID0ge1xuICAgIHdyYXBwZXJTdHlsZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGVpZ2h0OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5oZWlnaHQsXG4gICAgICAgIHdpZHRoOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS53aWR0aCxcbiAgICAgICAgYm9yZGVyOlxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJvcmRlciB8fFxuICAgICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgICAgICBiYWNrZ3JvdW5kOlxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJhY2tncm91bmQgfHxcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIH07XG4gICAgfSxcbiAgfTtcbiAgc3VidGl0bGVTdHlsZSA9IChjb252ZXJzYXRpb246IGFueSkgPT4ge1xuICAgIGlmIChcbiAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yICYmXG4gICAgICAoKHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PVxuICAgICAgICBjb252ZXJzYXRpb24uY29udmVyc2F0aW9uV2l0aD8udWlkKSB8fFxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkgPT1cbiAgICAgICAgY29udmVyc2F0aW9uLmNvbnZlcnNhdGlvbldpdGg/Lmd1aWQpXG4gICAgKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBmb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50eXBpbmdJbmRpY3RvclRleHRDb2xvcixcbiAgICAgICAgY29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnR5cGluZ0luZGljdG9yVGV4dENvbG9yLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGZvbnQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmxhc3RNZXNzYWdlVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUubGFzdE1lc3NhZ2VUZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbiAgaXRlbVRocmVhZEluZGljYXRvclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDpcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudGhyZWFkSW5kaWNhdG9yVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRleHRDb2xvcjpcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudGhyZWFkSW5kaWNhdG9yVGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgfTtcbiAgfTtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zXCIgW25nU3R5bGVdPVwic3R5bGVzLndyYXBwZXJTdHlsZSgpXCI+XG4gIDxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiICpuZ0lmPVwiaXNEaWFsb2dPcGVuXCI+XG4gICAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiY29uZmlybURpYWxvZ1RpdGxlXCJcbiAgICAgIFttZXNzYWdlVGV4dF09XCJjb25maXJtRGlhbG9nTWVzc2FnZVwiIFtjYW5jZWxCdXR0b25UZXh0XT1cImNhbmNlbEJ1dHRvblRleHRcIlxuICAgICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cImNvbmZpcm1CdXR0b25UZXh0XCJcbiAgICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25Db25maXJtQ2xpY2soKVwiXG4gICAgICAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwiZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGVcIj5cbiAgICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbiAgPC9jb21ldGNoYXQtYmFja2Ryb3A+XG4gIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19tZW51c1wiICpuZ0lmPVwibWVudVwiPlxuXG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cblxuICA8L2Rpdj5cbiAgPGNvbWV0Y2hhdC1saXN0IFtzdGF0ZV09XCJzdGF0ZVwiIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIlxuICAgIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIiBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCIgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cImdldENvbnZlcnNhdGlvblwiXG4gICAgW2xpc3RdPVwiY29udmVyc2F0aW9uTGlzdFwiXG4gICAgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiPjwvY29tZXRjaGF0LWxpc3Q+XG48L2Rpdj5cbjxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWNvbnZlcnNhdGlvbj5cbiAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiXG4gICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUoY29udmVyc2F0aW9uKVwiXG4gICAgW2lkXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uSWRcIlxuICAgIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKVwiXG4gICAgKGNjLWxpc3RpdGVtLWNsaWNrZWQpPVwib25DbGljayhjb252ZXJzYXRpb24pXCJcbiAgICBbdGl0bGVdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5uYW1lXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJjaGVja0dyb3VwVHlwZShjb252ZXJzYXRpb24pXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbilcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgIFthdmF0YXJVUkxdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5hdmF0YXIgfHwgY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5pY29uXCJcbiAgICBbYXZhdGFyTmFtZV09XCJjb252ZXJzYXRpb24/LmNvbnZlcnNhdGlvbldpdGg/Lm5hbWVcIj5cbiAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlldztlbHNlIGNvbnZlcnNhdGlvblN1YnRpdGxlXCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgICA8bmctdGVtcGxhdGUgI2NvbnZlcnNhdGlvblN1YnRpdGxlPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fc3VidGl0bGUtdmlldyBcIiBzbG90PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX190aHJlYWR2aWV3XCJcbiAgICAgICAgICAqbmdJZj1cImNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2U/LnBhcmVudE1lc3NhZ2VJZFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW2xhYmVsU3R5bGVdPVwiaXRlbVRocmVhZEluZGljYXRvclN0eWxlKClcIlxuICAgICAgICAgICAgW3RleHRdPVwidGhyZWFkSW5kaWNhdG9yVGV4dFwiPiA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8Y29tZXRjaGF0LWljb24gW1VSTF09XCJ0aHJlYWRJY29uVVJMXCJcbiAgICAgICAgICAgIFtpY29uU3R5bGVdPVwiaWNvblN0eWxlXCI+PC9jb21ldGNoYXQtaWNvbj5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3N1YnRpdGxlXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3JlYWRyZWNlaXB0XCJcbiAgICAgICAgICAgICpuZ0lmPVwiaXNSZWNlaXB0RGlzYWJsZShjb252ZXJzYXRpb24pXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LXJlY2VpcHQgW3JlY2VpcHRdPVwiZ2V0TWVzc2FnZVJlY2VpcHQoY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgICAgIFtyZWNlaXB0U3R5bGVdPVwicmVjZWlwdFN0eWxlXCIgW3NlbnRJY29uXT1cInNlbnRJY29uXCJcbiAgICAgICAgICAgICAgW2Vycm9ySWNvbl09XCJlcnJvckljb25cIiBbZGVsaXZlcmVkSWNvbl09XCJkZWxpdmVyZWRJY29uXCJcbiAgICAgICAgICAgICAgW3JlYWRJY29uXT1cInJlYWRJY29uXCI+PC9jb21ldGNoYXQtcmVjZWlwdD5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgW25nU3R5bGVdPVwic3VidGl0bGVTdHlsZShjb252ZXJzYXRpb24pXCIgY2xhc3M9XCJjYy1zdWJ0aXRsZV9fdGV4dFwiXG4gICAgICAgICAgICBbaW5uZXJIVE1MXT1cInNldFN1YnRpdGxlKGNvbnZlcnNhdGlvbilcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX29wdGlvbnN2aWV3XCJcbiAgICAgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5ub25lXCI+XG4gICAgICA8ZGl2ICpuZ0lmPVwib3B0aW9uc1wiPlxuICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbZGF0YV09XCJvcHRpb25zKGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwib25PcHRpb25DbGljaygkZXZlbnQsY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgW21lbnVMaXN0U3R5bGVdPVwibWVudXN0eWxlXCI+XG5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2ICpuZ0lmPVwiIW9wdGlvbnMgJiYgY29udmVyc2F0aW9uT3B0aW9uc1wiPlxuICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbZGF0YV09XCJjb252ZXJzYXRpb25PcHRpb25zXCJcbiAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cIm9uT3B0aW9uQ2xpY2soJGV2ZW50LGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgIFttZW51TGlzdFN0eWxlXT1cIm1lbnVzdHlsZVwiPlxuXG4gICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX190YWlsLXZpZXdcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWlsX192aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmUgJiYgY29udmVyc2F0aW9uPy5sYXN0TWVzc2FnZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSAqbmdJZj1cImNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2VcIlxuICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJkYXRlU3R5bGVcIlxuICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlPy5zZW50QXRcIlxuICAgICAgICAgICAgW3BhdHRlcm5dPVwiZ2V0RGF0ZSgpXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19iYWRnZVwiPlxuICAgICAgICAgIDwhLS0gPGNvbWV0Y2hhdC1pY29uICpuZ0lmPVwiY29udmVyc2F0aW9uPy5nZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoKVwiIFtuZ1N0eWxlXT1cImdldFVucmVhZE1lbnRpb25zSWNvblN0eWxlKClcIiBbaWNvblN0eWxlXT1nZXRNZW50aW9uSWNvblN0eWxlKCkgW1VSTF09XCJtZW50aW9uc0ljb25VUkxcIj48L2NvbWV0Y2hhdC1pY29uPiAtLT5cbiAgICAgICAgICA8Y29tZXRjaGF0LWJhZGdlIFtjb3VudF09XCJjb252ZXJzYXRpb24/LnVucmVhZE1lc3NhZ2VDb3VudFwiXG4gICAgICAgICAgICBbYmFkZ2VTdHlsZV09XCJiYWRnZVN0eWxlXCI+PC9jb21ldGNoYXQtYmFkZ2U+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fc2VsZWN0aW9uLXZpZXdcIlxuICAgICAgICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGFpbFZpZXdcIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiPlxuICAgICAgPGNvbWV0Y2hhdC1yYWRpby1idXR0b25cbiAgICAgICAgKGNjLXJhZGlvLWJ1dHRvbi1jaGFuZ2VkKT1cIm9uQ29udmVyc2F0aW9uU2VsZWN0ZWQoY29udmVyc2F0aW9uLCRldmVudClcIj48L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG4gICAgPC9kaXY+XG4gICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIj5cbiAgICAgIDxjb21ldGNoYXQtY2hlY2tib3hcbiAgICAgICAgKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwib25Db252ZXJzYXRpb25TZWxlY3RlZChjb252ZXJzYXRpb24sJGV2ZW50KVwiPjwvY29tZXRjaGF0LWNoZWNrYm94PlxuICAgIDwvZGl2PlxuICA8L25nLXRlbXBsYXRlPlxuPC9uZy10ZW1wbGF0ZT5cbiJdfQ==